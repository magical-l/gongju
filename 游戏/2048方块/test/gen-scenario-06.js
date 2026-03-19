/**
 * 生成 ⑥ 消行有剩余用例。
 * 棋盘 m×n：m = 块包围盒高度，n = 块宽 + 2（最右 2 列为固定堆）；块区空洞填 2，保证锁定时各行满格。
 * 运行：node test/gen-scenario-06.js（在 游戏/2048方块 目录）
 * 同时刷新 scenarios/scenario-07.js 中 GEN_I0_3X4 段。
 */
'use strict';
var fs = require('fs');
var path = require('path');
var logic = require(path.join(__dirname, '..', 'logic.js'));
var tick = logic.tick;
var createPiece = logic.createPiece;
var applyPendingClearLines = logic.applyPendingClearLines;

function makeState(rows, cols, boardRows, piece) {
	var board = [];
	for (var r = 0; r < boardRows.length; r++) {
		var row = [];
		for (var c = 0; c < boardRows[r].length; c++) row.push(boardRows[r][c] || 0);
		board.push(row);
	}
	return { rows: rows, cols: cols, board: board, currentPiece: piece, pieceCount: piece ? 1 : 0, nextPiece: null, gameOver: false, clearLinesPending: null, postClearGravityState: null, cascadePending: false, score: 0, highScore: 0, seed: 0 };
}
function pieceFromCase(tc) {
	var p = tc.piece;
	var piece = createPiece(p.shape, p.rotation != null ? p.rotation : 0, p.row, p.col);
	if (p.cellValues && Array.isArray(p.cellValues)) {
		for (var i = 0; i < piece.cells.length && i < p.cellValues.length; i++) piece.cells[i].value = p.cellValues[i];
	}
	return piece;
}
function deepCopyBoard(arr) { return JSON.parse(JSON.stringify(arr)); }

function runFullClearWithGravityCase(tc) {
	var rows = tc.rows, cols = tc.cols;
	var board = deepCopyBoard(tc.before);
	var piece = pieceFromCase(tc);
	var pieceCountBefore = piece ? 1 : 0;
	var state = null;
	var ticksToRun = tc.ticks != null ? tc.ticks : 20;
	for (var i = 0; i < ticksToRun; i++) {
		state = makeState(rows, cols, board, piece);
		state.pieceCount = pieceCountBefore;
		state = tick(state);
		pieceCountBefore = state.pieceCount;
		board = deepCopyBoard(state.board);
		piece = state.currentPiece;
		if (!piece) break;
	}
	while (state && (state.clearLinesPending && state.clearLinesPending.length > 0 || state.postClearGravityState != null)) {
		state = applyPendingClearLines(state);
	}
	var guard = 0;
	while (state && state.cascadePending && guard++ < 500) {
		state = tick(state);
	}
	return state ? deepCopyBoard(state.board) : board;
}

function emptyBoard(rows, cols) {
	var b = [];
	for (var r = 0; r < rows; r++) {
		var row = [];
		for (var c = 0; c < cols; c++) row.push(0);
		b.push(row);
	}
	return b;
}

function copyBoard(b) {
	return b.map(function(row) { return row.slice(); });
}

/** 堆列全 2；块列：脚印外填 2，脚印内 0（由活动块覆盖） */
function polyBaseBefore(shape, rotation) {
	var p = createPiece(shape, rotation, 0, 0);
	var maxDr = 0, maxDc = 0;
	for (var i = 0; i < p.cells.length; i++) {
		maxDr = Math.max(maxDr, p.cells[i].dr);
		maxDc = Math.max(maxDc, p.cells[i].dc);
	}
	var m = maxDr + 1;
	var width = maxDc + 1;
	var stackStart = width;
	var n = width + 2;
	var b = emptyBoard(m, n);
	for (var r = 0; r < m; r++) {
		for (var c = stackStart; c < n; c++) {
			b[r][c] = 2;
		}
	}
	var foot = {};
	for (var j = 0; j < p.cells.length; j++) {
		var cell = p.cells[j];
		foot[cell.dr + ',' + cell.dc] = true;
	}
	for (var r2 = 0; r2 < m; r2++) {
		for (var c2 = 0; c2 < stackStart; c2++) {
			if (!foot[r2 + ',' + c2]) {
				b[r2][c2] = 2;
			}
		}
	}
	return { m: m, n: n, stackStart: stackStart, board: b };
}

function boardToJs(b) {
	return '[' + b.map(function(row) {
		return '[' + row.join(',') + ']';
	}).join(',') + ']';
}

function emitCase(shape, rotation, rows, cols, before, piece, label, sortKey) {
	var tc = { shape: shape, rotation: rotation, ticks: 20, rows: rows, cols: cols, before: before, piece: piece };
	tc.expected = runFullClearWithGravityCase(tc);
	tc.label = label;
	tc.sortKey = sortKey;
	var pieceStr = JSON.stringify(piece).replace(/"([^"]+)":/g, '$1:');
	return '\t\t\t{ shape: \'' + shape + '\', rotation: ' + rotation + ', ticks: 20, rows: ' + rows + ', cols: ' + cols + ', before: ' + boardToJs(before) + ', piece: ' + pieceStr + ', expected: ' + boardToJs(tc.expected) + ', label: \'' + label.replace(/'/g, "\\'") + '\', sortKey: ' + sortKey + ' }';
}

var cases = [];
var sk = 60000;

/**
 * 与 O 相同规律排序：①1个4堆(行主序) ②1个4块(格序) ③2个4堆+堆(列不同,i<j) ④2个4块+堆 ⑤2个4块+块(列不同)
 */
function emitPolyCases(shape, rotation, prefix) {
	var info = polyBaseBefore(shape, rotation);
	var m = info.m, n = info.n, stackStart = info.stackStart;
	var base = info.board;
	var pc = createPiece(shape, rotation, 0, 0);
	var scells = [];
	for (var r = 0; r < m; r++) {
		for (var c = stackStart; c < n; c++) {
			scells.push([r, c]);
		}
	}
	// ① 1个4 堆
	for (var si = 0; si < scells.length; si++) {
		var br = scells[si][0], bc = scells[si][1];
		var b1 = copyBoard(base);
		b1[br][bc] = 4;
		cases.push(emitCase(shape, rotation, m, n, b1, { shape: shape, rotation: rotation, row: 0, col: 0 }, prefix + ' 1个4 堆(' + br + ',' + bc + ')', sk++));
	}
	// ② 1个4 块
	for (var pi = 0; pi < pc.cells.length; pi++) {
		var cv = [];
		for (var j = 0; j < pc.cells.length; j++) cv.push(j === pi ? 4 : 2);
		cases.push(emitCase(shape, rotation, m, n, copyBoard(base), { shape: shape, rotation: rotation, row: 0, col: 0, cellValues: cv }, prefix + ' 1个4 块(格' + pi + ')', sk++));
	}
	// ③ 2个4 堆+堆（列不同）
	for (var i = 0; i < scells.length; i++) {
		for (var j = i + 1; j < scells.length; j++) {
			if (scells[i][1] === scells[j][1]) continue;
			var b2 = copyBoard(base);
			b2[scells[i][0]][scells[i][1]] = 4;
			b2[scells[j][0]][scells[j][1]] = 4;
			cases.push(emitCase(shape, rotation, m, n, b2, { shape: shape, rotation: rotation, row: 0, col: 0 }, prefix + ' 2个4 堆(' + scells[i][0] + ',' + scells[i][1] + ')+堆(' + scells[j][0] + ',' + scells[j][1] + ')', sk++));
		}
	}
	// ④ 2个4 块+堆
	for (var pi2 = 0; pi2 < pc.cells.length; pi2++) {
		var cv2 = [];
		for (var t = 0; t < pc.cells.length; t++) cv2.push(t === pi2 ? 4 : 2);
		for (var sj = 0; sj < scells.length; sj++) {
			var sr = scells[sj][0], sc = scells[sj][1];
			var b3 = copyBoard(base);
			b3[sr][sc] = 4;
			cases.push(emitCase(shape, rotation, m, n, b3, { shape: shape, rotation: rotation, row: 0, col: 0, cellValues: cv2.slice() }, prefix + ' 2个4 块(格' + pi2 + ')+堆(' + sr + ',' + sc + ')', sk++));
		}
	}
	// ⑤ 2个4 块+块（dc 不同列）
	for (var a = 0; a < pc.cells.length; a++) {
		for (var bb = a + 1; bb < pc.cells.length; bb++) {
			if (pc.cells[a].dc === pc.cells[bb].dc) continue;
			var cv3 = [];
			for (var t2 = 0; t2 < pc.cells.length; t2++) cv3.push(t2 === a || t2 === bb ? 4 : 2);
			cases.push(emitCase(shape, rotation, m, n, copyBoard(base), { shape: shape, rotation: rotation, row: 0, col: 0, cellValues: cv3 }, prefix + ' 2个4 块(格' + a + ')+块(格' + bb + ')', sk++));
		}
	}
}

// —— I0 ——
emitPolyCases('I', 0, 'I0');

// —— I90：m=1 n=6，列 0～5 上放 k 个 4（互不同列）——
function i90BeforeAndPiece(fourCols) {
	var row = [0, 0, 0, 0, 2, 2];
	var cellValues = [2, 2, 2, 2];
	var piece = { shape: 'I', rotation: 1, row: 0, col: 0 };
	for (var fi = 0; fi < fourCols.length; fi++) {
		var col = fourCols[fi];
		if (col >= 0 && col <= 3) {
			cellValues[3 - col] = 4;
		} else if (col === 4) {
			row[4] = 4;
		} else if (col === 5) {
			row[5] = 4;
		}
	}
	piece.cellValues = cellValues;
	return { before: [row.slice()], piece: piece };
}

function combinationsCols(n, k) {
	var out = [];
	function rec(start, path) {
		if (path.length === k) {
			out.push(path.slice());
			return;
		}
		for (var i = start; i < n; i++) {
			path.push(i);
			rec(i + 1, path);
			path.pop();
		}
	}
	rec(0, []);
	return out;
}

function addI90K(k) {
	var combs = combinationsCols(6, k);
	for (var ci = 0; ci < combs.length; ci++) {
		var cols = combs[ci];
		var bp = i90BeforeAndPiece(cols);
		cases.push(emitCase('I', 1, 1, 6, bp.before, bp.piece, 'I90 ' + k + '个4 列' + cols.join(','), sk++));
	}
}
for (var k90 = 1; k90 <= 6; k90++) {
	addI90K(k90);
}

// —— O：与 emitPolyCases 同序 ——
emitPolyCases('O', 0, 'O');

// —— Z S J L：四旋转，命名 形状+旋转索引 ——
var polyShapes = ['Z', 'S', 'J', 'L'];
for (var ps = 0; ps < polyShapes.length; ps++) {
	var sh = polyShapes[ps];
	for (var rot = 0; rot < 4; rot++) {
		emitPolyCases(sh, rot, sh + rot);
	}
}

var DESC = '棋盘 m×n：块包围盒高 m、宽+2 列（右 2 列固定堆）；块区空洞填 2 保证满行。I0/I90/O/Z/S/J/L；I90 含 1～6 个 4 占不同列。I0「3个4」全消类在⑦组 GEN_I0_3X4。期望由 logic 算出。';
var header = '/**\n * ⑥ 消行有剩余\n * 由 test/gen-scenario-06.js 生成；改规则后请重新运行生成器。\n */\n(function() {\n\tvar s = {\n\t\ttitle: \'⑥ 消行有剩余\',\n\t\tdesc: \'' + DESC.replace(/'/g, "\\'") + '\',\n\t\tcases: [\n';
var footer = '\n\t\t]\n\t};\n\tif (typeof module !== \'undefined\' && module.exports) module.exports = s;\n\tif (typeof window !== \'undefined\') window.SCENARIO_06 = s;\n})();\n';

var outPath = path.join(__dirname, 'scenarios', 'scenario-06.js');
fs.writeFileSync(outPath, header + cases.join(',\n') + footer, 'utf8');
console.log('Wrote ' + cases.length + ' cases to ' + outPath);

// ⑦组：I0「3个4」
var I0m = 4, I0n = 3, stackLo = I0n - 2;
var i0baseTemplate = polyBaseBefore('I', 0).board;
function i0baseStackAllTwo() {
	return copyBoard(i0baseTemplate);
}
var sk7 = 100;
var i07Lines = [];
for (var pi7 = 0; pi7 < 4; pi7++) {
	var cv7 = [2, 2, 2, 2];
	cv7[pi7] = 4;
	for (var r1 = 0; r1 < I0m; r1++) {
		for (var r2 = 0; r2 < I0m; r2++) {
			var b7 = i0baseStackAllTwo();
			b7[r1][stackLo] = 4;
			b7[r2][stackLo + 1] = 4;
			i07Lines.push(emitCase('I', 0, I0m, I0n, b7, { shape: 'I', rotation: 0, row: 0, col: 0, cellValues: cv7.slice() }, 'I0 3个4 块(行' + pi7 + ')+堆(' + r1 + ',' + stackLo + ')+堆(' + r2 + ',' + (stackLo + 1) + ')', sk7++));
		}
	}
}
var s07Path = path.join(__dirname, 'scenarios', 'scenario-07.js');
var s07txt = fs.readFileSync(s07Path, 'utf8');
if (!/\/\/ GEN_I0_3X4_START\r?\n[\s\S]*?\/\/ GEN_I0_3X4_END/.test(s07txt)) {
	console.error('GEN_I0_3X4 markers missing in scenario-07.js');
	process.exit(1);
}
var block7 = '\t\t\t// GEN_I0_3X4_START\n' + i07Lines.join(',\n') + '\n\t\t\t// GEN_I0_3X4_END';
s07txt = s07txt.replace(/\/\/ GEN_I0_3X4_START\r?\n[\s\S]*?\/\/ GEN_I0_3X4_END/, block7);
fs.writeFileSync(s07Path, s07txt, 'utf8');
console.log('Updated scenario-07.js GEN_I0_3X4: ' + i07Lines.length + ' cases');

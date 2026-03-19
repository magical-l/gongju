/**
 * 生成 ⑥ 消行有剩余用例。
 * 棋盘 m×n：m = 活动块高度，n = 块宽 + 2（最右 2 列为固定堆，其余为块落点）；锁定时这些行均为满行。
 * 运行：node test/gen-scenario-06.js（在 游戏/2048方块 目录）
 * 同时会刷新 scenarios/scenario-07.js 中 GEN_I0_3X4 段（I0「3个4」全消类，自⑥迁出）。
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

// I0：m=4 n=3，左 1 列竖条，右 2 列为固定堆
var I0m = 4, I0n = 3;
var stackLo = I0n - 2;

function i0baseStackAllTwo() {
	var b = emptyBoard(I0m, I0n);
	for (var r = 0; r < I0m; r++) for (var c = stackLo; c < I0n; c++) b[r][c] = 2;
	return b;
}

// 1个4：仅在固定堆
for (var br = 0; br < I0m; br++) {
	for (var bc = stackLo; bc < I0n; bc++) {
		var b = i0baseStackAllTwo();
		b[br][bc] = 4;
		cases.push(emitCase('I', 0, I0m, I0n, b, { shape: 'I', rotation: 0, row: 0, col: 0 }, 'I0 1个4 堆(' + br + ',' + bc + ')', sk++));
	}
}
// 1个4：仅在 I 上（竖条 cellValues 索引 i 对应棋盘行 row=i，0 为最上行）
for (var pi = 0; pi < 4; pi++) {
	var cv = [2, 2, 2, 2];
	cv[pi] = 4;
	cases.push(emitCase('I', 0, I0m, I0n, i0baseStackAllTwo(), { shape: 'I', rotation: 0, row: 0, col: 0, cellValues: cv }, 'I0 1个4 块(行' + pi + ')', sk++));
}

// 2个4：两堆、列不同
var i0cells = [];
for (var r = 0; r < I0m; r++) for (var c = stackLo; c < I0n; c++) i0cells.push([r, c]);
for (var i = 0; i < i0cells.length; i++) {
	for (var j = i + 1; j < i0cells.length; j++) {
		if (i0cells[i][1] === i0cells[j][1]) continue;
		var b2 = i0baseStackAllTwo();
		b2[i0cells[i][0]][i0cells[i][1]] = 4;
		b2[i0cells[j][0]][i0cells[j][1]] = 4;
		cases.push(emitCase('I', 0, I0m, I0n, b2, { shape: 'I', rotation: 0, row: 0, col: 0 }, 'I0 2个4 堆(' + i0cells[i][0] + ',' + i0cells[i][1] + ')+堆(' + i0cells[j][0] + ',' + i0cells[j][1] + ')', sk++));
	}
}
// 2个4：一块一堆（列必为 0 与堆列，互不同列）
for (var pi = 0; pi < 4; pi++) {
	var cv2 = [2, 2, 2, 2];
	cv2[pi] = 4;
	for (var si = 0; si < i0cells.length; si++) {
		var br = i0cells[si][0], bc = i0cells[si][1];
		var b3 = i0baseStackAllTwo();
		b3[br][bc] = 4;
		cases.push(emitCase('I', 0, I0m, I0n, b3, { shape: 'I', rotation: 0, row: 0, col: 0, cellValues: cv2.slice() }, 'I0 2个4 块(行' + pi + ')+堆(' + br + ',' + bc + ')', sk++));
	}
}

// I90：m=1 n=6，左 4 格横条，右 2 列固定堆
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

function addI90Combo(name, colList) {
	var used = {};
	for (var i = 0; i < colList.length; i++) {
		if (used[colList[i]]) return;
		used[colList[i]] = true;
	}
	var bp = i90BeforeAndPiece(colList);
	cases.push(emitCase('I', 1, 1, 6, bp.before, bp.piece, 'I90 ' + name + ' 列' + colList.join(','), sk++));
}

for (var k = 0; k < 6; k++) {
	addI90Combo('1个4', [k]);
}
for (var a = 0; a < 6; a++) {
	for (var b = a + 1; b < 6; b++) {
		addI90Combo('2个4', [a, b]);
	}
}
for (var a = 0; a < 6; a++) {
	for (var b = a + 1; b < 6; b++) {
		for (var c = b + 1; c < 6; c++) {
			addI90Combo('3个4', [a, b, c]);
		}
	}
}

// O：m=2 n=4，左 2×2，右 2 列固定堆
function oTemplateBulkFours(fourCells, oCellFours) {
	oCellFours = oCellFours || [];
	var Om = 2, On = 4;
	var b = emptyBoard(Om, On);
	var stackStart = On - 2;
	for (var r = 0; r < Om; r++) for (var c = stackStart; c < On; c++) b[r][c] = 2;
	for (var i = 0; i < fourCells.length; i++) {
		b[fourCells[i][0]][fourCells[i][1]] = 4;
	}
	var cv = [2, 2, 2, 2];
	for (var j = 0; j < oCellFours.length; j++) cv[oCellFours[j]] = 4;
	var piece = { shape: 'O', rotation: 0, row: 0, col: 0 };
	if (oCellFours.length) piece.cellValues = cv;
	return { before: b, piece: piece };
}

var Om = 2, On = 4;
var stackStart = On - 2;
var ocells = [];
for (var rr = 0; rr < Om; rr++) for (var cc = stackStart; cc < On; cc++) ocells.push([rr, cc]);
for (var oi = 0; oi < ocells.length; oi++) {
	var t = oTemplateBulkFours([ocells[oi]], []);
	cases.push(emitCase('O', 0, Om, On, t.before, t.piece, 'O 1个4 堆(' + ocells[oi][0] + ',' + ocells[oi][1] + ')', sk++));
}
for (var oi = 0; oi < ocells.length; oi++) {
	for (var oj = oi + 1; oj < ocells.length; oj++) {
		if (ocells[oi][1] === ocells[oj][1]) continue;
		var t2 = oTemplateBulkFours([ocells[oi], ocells[oj]], []);
		cases.push(emitCase('O', 0, Om, On, t2.before, t2.piece, 'O 2个4 堆(' + ocells[oi][0] + ',' + ocells[oi][1] + ')+堆(' + ocells[oj][0] + ',' + ocells[oj][1] + ')', sk++));
	}
}
// O 2个4：一块一堆（块上一格为 4，堆上一格为 4）
for (var oc = 0; oc < 4; oc++) {
	for (var si = 0; si < ocells.length; si++) {
		var sr = ocells[si][0], sc = ocells[si][1];
		var tp = oTemplateBulkFours([[sr, sc]], [oc]);
		cases.push(emitCase('O', 0, Om, On, tp.before, tp.piece, 'O 2个4 块角' + oc + '+堆(' + sr + ',' + sc + ')', sk++));
	}
}
// O 2个4：均在块上、两列不同（角标对 (0,1)(0,3)(1,2)(2,3)）
var oTwoOnPiece = [[0, 1], [0, 3], [1, 2], [2, 3]];
for (var ti = 0; ti < oTwoOnPiece.length; ti++) {
	var a = oTwoOnPiece[ti][0], bb = oTwoOnPiece[ti][1];
	var tpp = oTemplateBulkFours([], [a, bb]);
	cases.push(emitCase('O', 0, Om, On, tpp.before, tpp.piece, 'O 2个4 块角' + a + '+块角' + bb, sk++));
}
for (var oc = 0; oc < 4; oc++) {
	var t4 = oTemplateBulkFours([], [oc]);
	cases.push(emitCase('O', 0, Om, On, t4.before, t4.piece, 'O 1个4 块角' + oc, sk++));
}

var DESC = '棋盘 m×n：m 为块高，n=块宽+2，最右 2 列为固定堆，左为块落点；锁定时各行满格。I0：4×3（无「3个4」：列数等于 4 的个数时多为全消，见⑦组）；I90：1×6；O：2×4。期望由 logic（满行除 min、重力、cleared 内竖并、cascade）算出。';
var header = '/**\n * ⑥ 消行有剩余\n * 由 test/gen-scenario-06.js 生成；改规则后请重新运行生成器。\n */\n(function() {\n\tvar s = {\n\t\ttitle: \'⑥ 消行有剩余\',\n\t\tdesc: \'' + DESC.replace(/'/g, "\\'") + '\',\n\t\tcases: [\n';
var footer = '\n\t\t]\n\t};\n\tif (typeof module !== \'undefined\' && module.exports) module.exports = s;\n\tif (typeof window !== \'undefined\') window.SCENARIO_06 = s;\n})();\n';

var outPath = path.join(__dirname, 'scenarios', 'scenario-06.js');
fs.writeFileSync(outPath, header + cases.join(',\n') + footer, 'utf8');
console.log('Wrote ' + cases.length + ' cases to ' + outPath);

// ⑦组：I0「3个4」（3 列各一 4 → 多为全消，不属于⑥「有剩余」）
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

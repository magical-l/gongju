/**
 * 计算 scenario-05 中 T/Z/S/J/L 各角度的 before。
 * 规则：1) 被消行只有 2 和 0；2) 挡块 4 只在地板（第 3 行）。
 * 3 行块（T0/T180/Z0 等）：消最上一行、消上两行、消上三行；
 * 2 行块（T90/T270 等）：消最上一行、消两行。
 */
'use strict';
var path = require('path');
var logic = require(path.join(__dirname, '..', 'logic.js'));
var createPiece = logic.createPiece;

function buildBeforeForClear(shape, rotation, rows, cols, numFullRows) {
	var pieceAtRow = 0;
	var piece = createPiece(shape, rotation, 0, 0);
	var rel = piece.cells.map(function(c) { return [c.dr, c.dc]; });
	if (!rel.length) return null;
	var maxDr = Math.max.apply(null, rel.map(function(p) { return p[0]; }));

	if (maxDr === 1) {
		pieceAtRow = 1;
		piece = createPiece(shape, rotation, 1, 0);
		rel = piece.cells.map(function(c) { return [c.dr, c.dc]; });
	}

	var pieceCol = 0;
	var occupy = rel.map(function(p) { return { r: pieceAtRow + p[0], c: pieceCol + p[1] }; });
	var occupySet = {};
	occupy.forEach(function(cell) { occupySet[cell.r + ',' + cell.c] = true; });
	var down = rel.map(function(p) { return { r: pieceAtRow + 1 + p[0], c: pieceCol + p[1] }; });

	var before = [];
	for (var r = 0; r < rows; r++) {
		var row = [];
		for (var c = 0; c < cols; c++) row.push(0);
		before.push(row);
	}
	// 3 行块填 0,1,2 行；2 行块只填方块所在两行（pieceAtRow, pieceAtRow+1），不填上方
	var fillFrom = maxDr >= 2 ? 0 : pieceAtRow;
	for (var r = fillFrom; r <= 2 && r < rows; r++)
		for (var c = 0; c < cols; c++) before[r][c] = 2;
	occupy.forEach(function(cell) {
		if (cell.r >= 0 && cell.r < rows && cell.c >= 0 && cell.c < cols)
			before[cell.r][cell.c] = 0;
	});
	// 使锁定后只有 numFullRows 行满：3 行块为前 numFullRows 行；2 行块为方块所在的前 numFullRows 行
	var zeroFrom = maxDr >= 2 ? numFullRows : pieceAtRow + numFullRows;
	var zeroTo = maxDr >= 2 ? 2 : pieceAtRow + 1;
	for (var r = zeroFrom; r <= zeroTo && r < rows; r++) {
		for (var c = 0; c < cols; c++) {
			if (!occupySet[r + ',' + c]) {
				before[r][c] = 0;
				break;
			}
		}
	}
	var floorRow = 3;
	var downOnFloor = down.filter(function(cell) { return cell.r === floorRow; });
	if (downOnFloor.length) {
		var col = downOnFloor[0].c;
		if (col >= 0 && col < cols) before[floorRow][col] = 4;
	}
	for (var c = 0; c < cols; c++)
		if (before[floorRow][c] !== 4) before[floorRow][c] = 0;
	if (rows === 5) {
		for (var c = 0; c < cols; c++) before[4][c] = 0;
	}
	return { before: before, pieceRow: pieceAtRow };
}

function getBoardAfterLock(before, shape, rotation, pieceRow, rows, cols) {
	var tick = logic.tick;
	var piece = createPiece(shape, rotation, pieceRow, 0);
	var board = before.map(function(r) { return r.slice(); });
	var state = { rows: rows, cols: cols, board: board, currentPiece: piece, pieceCount: 1, nextPiece: null, gameOver: false, clearLinesPending: null, postClearGravityState: null, cascadePending: false, score: 0, highScore: 0, seed: 0 };
	for (var i = 0; i < 20; i++) {
		state = tick(state);
		board = state.board.map(function(r) { return r.slice(); });
		piece = state.currentPiece;
		if (!piece) break;
		state = { rows: rows, cols: cols, board: board, currentPiece: piece, pieceCount: state.pieceCount, nextPiece: null, gameOver: false, clearLinesPending: null, postClearGravityState: null, cascadePending: false, score: 0, highScore: 0, seed: 0 };
	}
	return state.board;
}
var getFullRowIndices = logic.getFullRowIndices;
function expectedAfterClear(before, numFullRows, shape, rotation, pieceRow, rows, cols) {
	var afterLock = getBoardAfterLock(before, shape, rotation, pieceRow, rows, cols);
	var fullRows = getFullRowIndices(afterLock, rows, cols);
	var result = afterLock.map(function(row, r) {
		return fullRows.indexOf(r) >= 0 ? row.map(function() { return 0; }) : row.slice();
	});
	return result;
}

var ROT_NAMES = { 0: '0', 1: '90', 2: '180', 3: '270' };
var shapes = ['T', 'Z', 'S', 'J', 'L'];
var rotations = [0, 1, 2, 3];
var casesOut = [];

shapes.forEach(function(shape) {
	var rows = (shape === 'J' || shape === 'L') ? 4 : 5;
	// Z/S 的 180° 与 0° 同形、270° 与 90° 同形，只测 0 和 90
	var rots = (shape === 'Z' || shape === 'S') ? [0, 1] : rotations;
	rots.forEach(function(rot) {
		var piece = createPiece(shape, rot, 0, 0);
		var maxDr = Math.max.apply(null, piece.cells.map(function(c) { return c.dr; }));
		var is3Row = maxDr >= 2;
		var baseKey = shape + ROT_NAMES[rot];
		if (is3Row) {
			// 消最上一行、消上两行、消上三行
			var baseSort = { T: 8, Z: 18, S: 28, J: 38, L: 48 };
			for (var n = 1; n <= 3; n++) {
				var r = buildBeforeForClear(shape, rot, rows, 4, n);
				var label = n === 1 ? '消最上一行' : (n === 2 ? '消上两行' : '消上三行');
				var exp = expectedAfterClear(r.before, n, shape, rot, r.pieceRow, rows, 4);
				casesOut.push({
					shape: shape, rotation: rot, rows: rows, cols: 4,
					before: r.before, pieceRow: r.pieceRow, expected: exp,
					label: baseKey + ' ' + label,
					sortKey: baseSort[shape] * 100 + rot * 10 + (n - 1)
				});
			}
		} else {
			// 消最上一行、消两行
			for (var n = 1; n <= 2; n++) {
				var r = buildBeforeForClear(shape, rot, rows, 4, n);
				var label = n === 1 ? '消最上一行' : '消两行';
				var exp = expectedAfterClear(r.before, n, shape, rot, r.pieceRow, rows, 4);
				var baseSort = { T: 8, Z: 18, S: 28, J: 38, L: 48 };
				casesOut.push({
					shape: shape, rotation: rot, rows: rows, cols: 4,
					before: r.before, pieceRow: r.pieceRow, expected: exp,
					label: baseKey + ' ' + label,
					sortKey: baseSort[shape] * 100 + rot * 10 + (n - 1)
				});
			}
		}
	});
});

// 按 sortKey 排一下并输出为 scenario-05 可粘贴的格式（仅 T/Z/S/J/L 部分）
casesOut.sort(function(a, b) { return a.sortKey - b.sortKey; });

console.log('// T/Z/S/J/L 用例（消最上一行、消上两行/消两行、消上三行按块行数）:\n');
casesOut.forEach(function(c) {
	var piece = '{ shape: \'' + c.shape + '\', rotation: ' + c.rotation + ', row: ' + c.pieceRow + ', col: 0 }';
	var line = '\t\t\t{ shape: \'' + c.shape + '\', rotation: ' + c.rotation + ', ticks: 1, rows: ' + c.rows + ', cols: 4, before: ' + JSON.stringify(c.before) + ', piece: ' + piece + ', expected: ' + JSON.stringify(c.expected) + ', label: \'' + c.label + '\', sortKey: ' + c.sortKey + ' },';
	console.log(line);
});

// 验证
var tick = logic.tick;
var getFullRowIndices = logic.getFullRowIndices;
function deepCopyBoard(arr) { return JSON.parse(JSON.stringify(arr)); }
function makeState(rows, cols, boardRows, piece) {
	var board = boardRows.map(function(r) { return r.slice(); });
	return { rows: rows, cols: cols, board: board, currentPiece: piece, pieceCount: piece ? 1 : 0, nextPiece: null, gameOver: false, clearLinesPending: null, postClearGravityState: null, cascadePending: false, score: 0, highScore: 0, seed: 0 };
}
function pieceFromCase(tc) {
	return createPiece(tc.shape, tc.rotation, tc.pieceRow, 0);
}
function boardEquals(a, b, rows, cols) {
	for (var r = 0; r < rows; r++)
		for (var c = 0; c < cols; c++)
			if ((a[r] && a[r][c] || 0) !== (b[r] && b[r][c] || 0)) return false;
	return true;
}
console.log('\nVerify:');
var failCount = 0;
casesOut.forEach(function(tc) {
	var rows = tc.rows, cols = 4, board = deepCopyBoard(tc.before), piece = pieceFromCase(tc), state = null, pieceCountBefore = 1;
	for (var i = 0; i < 20; i++) {
		state = makeState(rows, cols, board, piece);
		state.pieceCount = pieceCountBefore;
		state = tick(state);
		pieceCountBefore = state.pieceCount;
		board = deepCopyBoard(state.board);
		piece = state.currentPiece;
		if (!piece) break;
	}
	var resultBoard = state ? deepCopyBoard(state.board) : board;
	var fullRows = getFullRowIndices(resultBoard, rows, cols);
	for (var r = 0; r < fullRows.length; r++)
		for (var c = 0; c < cols; c++) resultBoard[fullRows[r]][c] = 0;
	var pass = boardEquals(resultBoard, tc.expected, rows, cols);
	if (!pass) { failCount++; console.log('FAIL', tc.label); }
});
console.log(failCount === 0 ? 'All ' + casesOut.length + ' passed.' : 'Failed: ' + failCount);
process.exit(failCount > 0 ? 1 : 0);

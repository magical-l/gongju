/**
 * 【已弃用】「消行有剩余」已迁至第⑥组并由 test/gen-scenario-06.js 按规则系统生成。
 * 本脚本保留仅供参考，勿再用于更新 scenario-05。
 * 运行：node test/gen-scenario05-remaining.js
 */
'use strict';
var path = require('path');
var logic = require(path.join(__dirname, '..', 'logic.js'));
var s05 = require(path.join(__dirname, 'scenarios', 'scenario-05.js'));
var tick = logic.tick;
var createPiece = logic.createPiece;
var getFullRowIndices = logic.getFullRowIndices;

function makeState(rows, cols, boardRows, piece) {
	var board = boardRows.map(function(r) { return r.slice(); });
	return { rows: rows, cols: cols, board: board, currentPiece: piece, pieceCount: piece ? 1 : 0, nextPiece: null, gameOver: false, clearLinesPending: null, postClearGravityState: null, cascadePending: false };
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

function runClearCase(tc) {
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
	var resultBoard = state ? deepCopyBoard(state.board) : board;
	var fullRows = getFullRowIndices ? getFullRowIndices(resultBoard, rows, cols) : [];
	for (var r = 0; r < fullRows.length; r++)
		for (var c = 0; c < cols; c++) resultBoard[fullRows[r]][c] = 0;
	return resultBoard;
}

var cases = s05.cases.filter(function(c) { return (c.sortKey || 0) < 10000; });
var trimShapes = { 'I': { 1: true }, 'T': true, 'Z': true, 'S': true, 'J': true, 'L': true };
var newCases = [];

for (var i = 0; i < cases.length; i++) {
	var c = cases[i];
	var dup = JSON.parse(JSON.stringify(c));
	dup.piece = dup.piece || {};
	dup.piece.cellValues = [2, 2, 2, 4];
	dup.label = (dup.label || '') + ' 有剩余';
	dup.sortKey = (dup.sortKey || 0) + 10000;

	var shape = c.shape;
	var rot = (c.piece && c.piece.rotation != null) ? c.piece.rotation : 0;
	var doTrim = (shape === 'I' && rot === 1) || (shape === 'T' || shape === 'Z' || shape === 'S' || shape === 'J' || shape === 'L');

	if (doTrim && c.piece && c.piece.row != null) {
		var lastRow = c.piece.row;
		dup.rows = lastRow + 1;
		dup.before = dup.before.slice(0, lastRow + 1);
		dup.expected = null;
	}
	dup.expected = runClearCase(dup);
	var hasRemaining = dup.expected.some(function(row) { return row.some(function(v) { return v !== 0; }); });
	if (hasRemaining) newCases.push(dup);
}

function fmtRow(r) { return '[' + r.join(',') + ']'; }
function fmtBoard(arr) { return '[' + arr.map(fmtRow).join(',') + ']'; }
function fmtCase(tc) {
	var p = tc.piece;
	var pc = "piece: { shape: '" + p.shape + "', rotation: " + (p.rotation != null ? p.rotation : 0) + ", row: " + (p.row != null ? p.row : 0) + ", col: " + (p.col != null ? p.col : 0) + (p.cellValues ? ", cellValues: [2,2,2,4]" : "") + " }";
	return "\t\t{ shape: '" + tc.shape + "', rotation: " + (tc.rotation != null ? tc.rotation : 0) + ", ticks: " + (tc.ticks || 1) + ", rows: " + tc.rows + ", cols: " + tc.cols + ", before: " + fmtBoard(tc.before) + ", " + pc + ", expected: " + fmtBoard(tc.expected) + ", label: '" + tc.label.replace(/'/g, "\\'") + "', sortKey: " + tc.sortKey + " }";
}

console.log('// 消行有剩余（活动块含一个4；I90/T/Z/S/J/L 裁到地板）');
newCases.forEach(function(tc) { console.log(fmtCase(tc) + ','); });
process.exit(0);

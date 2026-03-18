/**
 * 在 Node 中按浏览器 runner 规则跑全部 6 个场景，打印失败用例。
 * 运行：node test/run-all-scenarios.js（在 游戏/2048方块 目录）
 */
'use strict';
var path = require('path');
var logic = require(path.join(__dirname, '..', 'logic.js'));
var s01 = require(path.join(__dirname, 'scenarios', 'scenario-01.js'));
var s02 = require(path.join(__dirname, 'scenarios', 'scenario-02.js'));
var s03 = require(path.join(__dirname, 'scenarios', 'scenario-03.js'));
var s04 = require(path.join(__dirname, 'scenarios', 'scenario-04.js'));
var s05 = require(path.join(__dirname, 'scenarios', 'scenario-05.js'));
var s06 = require(path.join(__dirname, 'scenarios', 'scenario-06.js'));

var SCENARIOS = [s01, s02, s03, s04, s05, s06];
var tick = logic.tick;
var createPiece = logic.createPiece;
var pieceAbsCells = logic.pieceAbsCells;
var applyPendingClearLines = logic.applyPendingClearLines;
var getFullRowIndices = logic.getFullRowIndices;

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
	return createPiece(p.shape, p.rotation != null ? p.rotation : 0, p.row, p.col);
}
function deepCopyBoard(arr) { return JSON.parse(JSON.stringify(arr)); }
function boardEquals(a, b, rows, cols) {
	for (var r = 0; r < rows; r++)
		for (var c = 0; c < cols; c++)
			if ((a[r] && a[r][c] || 0) !== (b[r] && b[r][c] || 0)) return false;
	return true;
}
function getDisplayBoard(state) {
	var rows = state.rows, cols = state.cols;
	var out = [];
	for (var r = 0; r < rows; r++) {
		var row = [];
		for (var c = 0; c < cols; c++) row.push(state.board[r][c] || 0);
		out.push(row);
	}
	var piece = state.currentPiece;
	if (piece && !state.gameOver) {
		pieceAbsCells(piece).forEach(function(cell) {
			if (cell.r >= 0 && cell.r < rows && cell.c >= 0 && cell.c < cols) out[cell.r][cell.c] = cell.value;
		});
	}
	return out;
}

function runMergeCase(tc) {
	var rows = tc.rows, cols = tc.cols;
	var board = deepCopyBoard(tc.before);
	var piece = pieceFromCase(tc);
	var boardAfterLock = null;
	var pieceCountBefore = piece ? 1 : 0;
	var lastState = null;
	for (var i = 0; i < tc.ticks; i++) {
		var state = makeState(rows, cols, board, piece);
		state.pieceCount = pieceCountBefore;
		state = tick(state);
		lastState = state;
		if (piece && state.pieceCount > pieceCountBefore) boardAfterLock = deepCopyBoard(state.board);
		pieceCountBefore = state.pieceCount;
		board = deepCopyBoard(state.board);
		piece = state.currentPiece;
		if (!piece) break;
	}
	var resultBoard = (boardAfterLock != null) ? boardAfterLock
		: (lastState && lastState.currentPiece ? getDisplayBoard(lastState) : deepCopyBoard(board));
	var pass = tc.expected != null && boardEquals(resultBoard, tc.expected, rows, cols);
	return { resultBoard: resultBoard, pass: pass };
}
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
	var pass = tc.expected != null && boardEquals(resultBoard, tc.expected, rows, cols);
	return { resultBoard: resultBoard, pass: pass };
}
function runClearWithGravityCase(tc) {
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
	var resultBoard = state ? deepCopyBoard(state.board) : board;
	var pass = tc.expected != null && boardEquals(resultBoard, tc.expected, rows, cols);
	return { resultBoard: resultBoard, pass: pass };
}

var runFns = [runMergeCase, runMergeCase, runMergeCase, runMergeCase, runClearCase, runClearWithGravityCase];
var failed = [];
SCENARIOS.forEach(function(scenario, si) {
	var runFn = runFns[si];
	(scenario.cases || []).forEach(function(tc, ci) {
		var res = runFn(tc);
		if (!res.pass) {
			failed.push({ scenario: scenario.title, scenarioIndex: si, caseIndex: ci, label: tc.label || (tc.shape + ' ' + tc.piece.rotation), expected: tc.expected, got: res.resultBoard });
		}
	});
});

if (failed.length === 0) {
	console.log('All scenarios passed.');
} else {
	console.log('Failed ' + failed.length + ' case(s):\n');
	failed.forEach(function(f, i) {
		console.log((i + 1) + '. [' + f.scenarioIndex + '] ' + f.scenario + ' — ' + (f.label || 'case ' + f.caseIndex));
		console.log('   expected: ' + JSON.stringify(f.expected));
		console.log('   got:      ' + JSON.stringify(f.got));
		console.log('');
	});
}
process.exit(failed.length > 0 ? 1 : 0);

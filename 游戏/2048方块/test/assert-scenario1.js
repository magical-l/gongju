/**
 * 读取 scenarios/scenario-01.js 中 ① 组的 cases，用 logic 跑 runMergeCase 并与 expected 比对。
 * 用法: node assert-scenario1.js
 */
'use strict';
var path = require('path');
var logic = require(path.join(__dirname, '..', 'logic.js'));
var scenario1 = require(path.join(__dirname, 'scenarios', 'scenario-01.js'));
var cases = scenario1.cases;
var tick = logic.tick;
var createPiece = logic.createPiece;
var pieceAbsCells = logic.pieceAbsCells;

function makeState(rows, cols, boardRows, piece) {
  var board = [];
  for (var r = 0; r < boardRows.length; r++) {
    var row = [];
    for (var c = 0; c < boardRows[r].length; c++) row.push(boardRows[r][c] || 0);
    board.push(row);
  }
  return { rows: rows, cols: cols, board: board, currentPiece: piece, pieceCount: piece ? 1 : 0, nextPiece: null, gameOver: false, clearLinesPending: null, postClearGravityState: null, cascadePending: false, score: 0, highScore: 0, seed: 0 };
}
function deepCopyBoard(arr) { return JSON.parse(JSON.stringify(arr)); }
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
  var piece = createPiece(tc.piece.shape, tc.piece.rotation, tc.piece.row, tc.piece.col);
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
  return (boardAfterLock != null) ? boardAfterLock
    : (tc.ticks === 1 && lastState && lastState.currentPiece ? getDisplayBoard(lastState) : deepCopyBoard(board));
}
function boardEquals(a, b, rows, cols) {
  for (var r = 0; r < rows; r++)
    for (var c = 0; c < cols; c++)
      if ((a[r] && a[r][c] || 0) !== (b[r] && b[r][c] || 0)) return false;
  return true;
}

var failed = [];
cases.forEach(function(tc, index) {
  var got = runMergeCase(tc);
  if (!boardEquals(got, tc.expected, tc.rows, tc.cols)) {
    failed.push({
      index: index,
      shape: tc.shape,
      rotation: tc.rotation,
      columnIndex: tc.columnIndex,
      pileBlocks: tc.pileBlocks,
      expected: JSON.stringify(tc.expected),
      got: JSON.stringify(got)
    });
  }
});

if (failed.length) {
  console.log('FAIL: ' + failed.length + ' / ' + cases.length);
  failed.forEach(function(f) {
    console.log('  #' + f.index + ' ' + f.shape + ' ' + f.rotation + '°' + (f.columnIndex != null ? ' 列' + f.columnIndex : '') + (f.pileBlocks != null ? ' ' + f.pileBlocks + '块' : ''));
    console.log('    expected: ' + f.expected);
    console.log('    got:      ' + f.got);
  });
  process.exit(1);
}
console.log('PASS: ① 共 ' + cases.length + ' 条用例全部通过');
process.exit(0);

/**
 * 复现 测试可视化-按场景.html 的 runMergeCase，跑出①组每个用例的「执行后」棋盘。
 * 用法: node run-scenario1.js
 */
'use strict';
var logic = require('./logic.js');
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
  var resultBoard = (boardAfterLock != null) ? boardAfterLock
    : (tc.ticks === 1 && lastState && lastState.currentPiece ? getDisplayBoard(lastState) : deepCopyBoard(board));
  return resultBoard;
}

var SCENARIO1 = [
  { shape: 'I', rotation: 0, ticks: 1, rows: 6, cols: 2, before: [[0,0],[0,0],[0,0],[0,0],[0,0],[2,0]], piece: { shape: 'I', rotation: 0, row: 1, col: 0 } },
  { shape: 'I', rotation: 1, ticks: 1, rows: 2, cols: 4, before: [[0,0,0,0],[2,0,0,0]], piece: { shape: 'I', rotation: 1, row: 0, col: 0 } },
  { shape: 'O', rotation: 0, ticks: 1, rows: 4, cols: 2, before: [[0,0],[0,0],[2,0],[2,0]], piece: { shape: 'O', rotation: 0, row: 0, col: 0 } },
  { shape: 'T', rotation: 0, ticks: 1, rows: 4, cols: 2, before: [[0,0],[0,0],[0,0],[0,2]], piece: { shape: 'T', rotation: 0, row: 0, col: 0 } },
  { shape: 'T', rotation: 1, ticks: 1, rows: 3, cols: 3, before: [[0,0,0],[0,0,0],[0,2,0]], piece: { shape: 'T', rotation: 1, row: 0, col: 0 } },
  { shape: 'T', rotation: 2, ticks: 1, rows: 4, cols: 2, before: [[0,0],[0,0],[0,0],[2,0]], piece: { shape: 'T', rotation: 2, row: 0, col: 0 } },
  { shape: 'T', rotation: 3, ticks: 1, rows: 3, cols: 3, before: [[0,0,0],[0,0,0],[0,2,0]], piece: { shape: 'T', rotation: 3, row: 0, col: 0 } },
  { shape: 'Z', rotation: 0, ticks: 1, rows: 4, cols: 2, before: [[0,0],[0,0],[0,0],[2,0]], piece: { shape: 'Z', rotation: 0, row: 0, col: 0 } },
  { shape: 'Z', rotation: 1, ticks: 1, rows: 3, cols: 3, before: [[0,0,0],[0,0,0],[0,2,0]], piece: { shape: 'Z', rotation: 1, row: 0, col: 0 } },
  { shape: 'Z', rotation: 2, ticks: 1, rows: 4, cols: 2, before: [[0,0],[0,0],[0,0],[2,0]], piece: { shape: 'Z', rotation: 2, row: 0, col: 0 } },
  { shape: 'Z', rotation: 3, ticks: 1, rows: 3, cols: 3, before: [[0,0,0],[0,0,0],[0,2,0]], piece: { shape: 'Z', rotation: 3, row: 0, col: 0 } },
  { shape: 'S', rotation: 0, ticks: 1, rows: 4, cols: 2, before: [[0,0],[0,0],[0,0],[0,2]], piece: { shape: 'S', rotation: 0, row: 0, col: 0 } },
  { shape: 'S', rotation: 1, ticks: 1, rows: 3, cols: 3, before: [[0,0,0],[0,0,0],[0,2,0]], piece: { shape: 'S', rotation: 1, row: 0, col: 0 } },
  { shape: 'S', rotation: 2, ticks: 1, rows: 4, cols: 2, before: [[0,0],[0,0],[0,0],[0,2]], piece: { shape: 'S', rotation: 2, row: 0, col: 0 } },
  { shape: 'S', rotation: 3, ticks: 1, rows: 3, cols: 3, before: [[0,0,0],[0,0,0],[0,2,0]], piece: { shape: 'S', rotation: 3, row: 0, col: 0 } },
  { shape: 'J', rotation: 0, ticks: 1, rows: 4, cols: 2, before: [[0,0],[0,0],[0,0],[2,0]], piece: { shape: 'J', rotation: 0, row: 0, col: 0 } },
  { shape: 'J', rotation: 1, ticks: 1, rows: 3, cols: 3, before: [[0,0,0],[0,0,0],[2,0,0]], piece: { shape: 'J', rotation: 1, row: 0, col: 0 } },
  { shape: 'J', rotation: 2, ticks: 1, rows: 4, cols: 2, before: [[0,0],[0,0],[0,0],[2,0]], piece: { shape: 'J', rotation: 2, row: 0, col: 0 } },
  { shape: 'J', rotation: 3, ticks: 1, rows: 3, cols: 3, before: [[0,0,0],[0,0,0],[0,0,2]], piece: { shape: 'J', rotation: 3, row: 0, col: 0 } },
  { shape: 'L', rotation: 0, ticks: 1, rows: 4, cols: 2, before: [[0,0],[0,0],[0,0],[2,0]], piece: { shape: 'L', rotation: 0, row: 0, col: 0 } },
  { shape: 'L', rotation: 1, ticks: 1, rows: 3, cols: 3, before: [[0,0,0],[0,0,0],[0,0,2]], piece: { shape: 'L', rotation: 1, row: 0, col: 0 } },
  { shape: 'L', rotation: 2, ticks: 1, rows: 4, cols: 2, before: [[0,0],[0,0],[0,0],[2,0]], piece: { shape: 'L', rotation: 2, row: 0, col: 0 } },
  { shape: 'L', rotation: 3, ticks: 1, rows: 3, cols: 3, before: [[0,0,0],[0,0,0],[2,0,0]], piece: { shape: 'L', rotation: 3, row: 0, col: 0 } },
];

console.log('=== ① 组每用例执行结果 ===\n');
SCENARIO1.forEach(function(tc) {
  var label = tc.shape + ' ' + (tc.rotation * 90) + '°';
  try {
    console.log(label + ' => ' + JSON.stringify(runMergeCase(tc)));
  } catch (e) {
    console.log(label + ' => ERROR ' + e.message);
  }
});

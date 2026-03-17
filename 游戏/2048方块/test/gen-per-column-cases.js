/**
 * 为 ① 组生成「每列一个 2」的用例：每种形状、每种角度，底行 2 从第 0 列到 cols-1 列各一个用例。
 * 用法: node gen-per-column-cases.js
 */
'use strict';
var logic = require('../logic.js');
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

// ① 组已有的 (shape, rotation, rows, cols) 唯一条目（与 HTML 一致，不含 Z/S 180°/270°）
var SCENARIO1_TEMPLATES = [
  { shape: 'I', rotation: 0, rows: 6, cols: 2 },
  { shape: 'I', rotation: 1, rows: 2, cols: 4 },
  { shape: 'O', rotation: 0, rows: 4, cols: 2 },
  { shape: 'T', rotation: 0, rows: 4, cols: 2 },
  { shape: 'T', rotation: 1, rows: 3, cols: 3 },
  { shape: 'T', rotation: 2, rows: 4, cols: 2 },
  { shape: 'T', rotation: 3, rows: 3, cols: 3 },
  { shape: 'Z', rotation: 0, rows: 4, cols: 2 },
  { shape: 'Z', rotation: 1, rows: 3, cols: 3 },
  { shape: 'S', rotation: 0, rows: 4, cols: 2 },
  { shape: 'S', rotation: 1, rows: 3, cols: 3 },
  { shape: 'J', rotation: 0, rows: 4, cols: 2 },
  { shape: 'J', rotation: 1, rows: 3, cols: 3 },
  { shape: 'J', rotation: 2, rows: 4, cols: 2 },
  { shape: 'J', rotation: 3, rows: 3, cols: 3 },
  { shape: 'L', rotation: 0, rows: 4, cols: 2 },
  { shape: 'L', rotation: 1, rows: 3, cols: 3 },
  { shape: 'L', rotation: 2, rows: 4, cols: 2 },
  { shape: 'L', rotation: 3, rows: 3, cols: 3 },
];

function buildBefore(rows, cols, colWith2) {
  var before = [];
  for (var r = 0; r < rows; r++) {
    var row = [];
    for (var c = 0; c < cols; c++) row.push(0);
    before.push(row);
  }
  before[rows - 1][colWith2] = 2;
  return before;
}

function getRelCells(shape, rotation) {
  var p = createPiece(shape, rotation, 0, 0);
  return p.cells.map(function(c) { return { dr: c.dr, dc: c.dc }; });
}

function findPiecePosition(shape, rotation, rows, cols, colWith2) {
  var rel = getRelCells(shape, rotation);
  var maxDr = Math.max.apply(null, rel.map(function(c) { return c.dr; }));
  var minDc = Math.min.apply(null, rel.map(function(c) { return c.dc; }));
  var maxDc = Math.max.apply(null, rel.map(function(c) { return c.dc; }));
  var bottomCells = rel.filter(function(c) { return c.dr === maxDr; });
  var pieceRow = rows - 2 - maxDr;
  for (var i = 0; i < bottomCells.length; i++) {
    var dc = bottomCells[i].dc;
    var pieceCol = colWith2 - dc;
    if (pieceCol < 0) continue;
    if (pieceCol + maxDc >= cols) continue;
    var minR = pieceRow + Math.min.apply(null, rel.map(function(c) { return c.dr; }));
    if (minR < 0) continue;
    return { row: pieceRow, col: pieceCol };
  }
  return null;
}

var cases = [];
SCENARIO1_TEMPLATES.forEach(function(tpl) {
  for (var c = 0; c < tpl.cols; c++) {
    var before = buildBefore(tpl.rows, tpl.cols, c);
    var pos = findPiecePosition(tpl.shape, tpl.rotation, tpl.rows, tpl.cols, c);
    if (!pos) {
      console.error(tpl.shape + ' ' + tpl.rotation + '° col ' + c + ': no valid piece position');
      continue;
    }
    var tc = {
      shape: tpl.shape,
      rotation: tpl.rotation,
      ticks: 1,
      rows: tpl.rows,
      cols: tpl.cols,
      before: before,
      piece: { shape: tpl.shape, rotation: tpl.rotation, row: pos.row, col: pos.col },
      columnIndex: c
    };
    tc.expected = runMergeCase(tc);
    cases.push(tc);
  }
});

// 输出为可粘贴到 HTML 的格式（单行一条，便于替换）
console.log('// ① 组 cases（含每列一个 2），共 ' + cases.length + ' 条');
cases.forEach(function(tc) {
  var line = '{ shape: \'' + tc.shape + '\', rotation: ' + tc.rotation + ', ticks: 1, rows: ' + tc.rows + ', cols: ' + tc.cols + ', before: ' + JSON.stringify(tc.before) + ', piece: { shape: \'' + tc.piece.shape + '\', rotation: ' + tc.piece.rotation + ', row: ' + tc.piece.row + ', col: ' + tc.piece.col + ' }, columnIndex: ' + tc.columnIndex + ', expected: ' + JSON.stringify(tc.expected) + ' }';
  console.log(line);
});

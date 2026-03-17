/**
 * 为 ① 组生成「固定块堆有 2、3、4 个方块」的用例。
 * 规则：按方块自身宽度（占几列）——仅当 width>=2 时才生成 2/3/4 块用例；I0 宽度为 1，不生成。
 * 用法: node gen-multi-block-cases.js
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

function getRelCells(shape, rotation) {
  var p = createPiece(shape, rotation, 0, 0);
  return p.cells.map(function(c) { return { dr: c.dr, dc: c.dc }; });
}

function pieceWidth(shape, rotation) {
  var rel = getRelCells(shape, rotation);
  var minDc = Math.min.apply(null, rel.map(function(x) { return x.dc; }));
  var maxDc = Math.max.apply(null, rel.map(function(x) { return x.dc; }));
  return maxDc - minDc + 1;
}

// 每个 (shape, rotation) 的 (rows, cols)；pileCol 表示竖块时堆在哪一列（null 表示横块/特殊）
var MULTI_BLOCK_TEMPLATES = [
  { shape: 'I', rotation: 0, rows: 6, cols: 2, pileCol: 0 },
  { shape: 'I', rotation: 1, rows: 2, cols: 4, pileCol: null },
  { shape: 'O', rotation: 0, rows: 4, cols: 2, pileCol: null },
  { shape: 'T', rotation: 0, rows: 4, cols: 2, pileCol: 1 },
  { shape: 'T', rotation: 1, rows: 3, cols: 3, pileCol: 1 },
  { shape: 'T', rotation: 2, rows: 4, cols: 2, pileCol: 0 },
  { shape: 'T', rotation: 3, rows: 3, cols: 3, pileCol: 1 },
  { shape: 'Z', rotation: 0, rows: 4, cols: 2, pileCol: 0 },
  { shape: 'Z', rotation: 1, rows: 3, cols: 3, pileCol: 1 },
  { shape: 'S', rotation: 0, rows: 4, cols: 2, pileCol: 1 },
  { shape: 'S', rotation: 1, rows: 3, cols: 3, pileCol: 0 },
  { shape: 'J', rotation: 0, rows: 4, cols: 2, pileCol: 0 },
  { shape: 'J', rotation: 1, rows: 3, cols: 3, pileCol: 0 },
  { shape: 'J', rotation: 2, rows: 4, cols: 2, pileCol: 0 },
  { shape: 'J', rotation: 3, rows: 3, cols: 3, pileCol: 2 },
  { shape: 'L', rotation: 0, rows: 4, cols: 2, pileCol: 0 },
  { shape: 'L', rotation: 1, rows: 3, cols: 3, pileCol: 2 },
  { shape: 'L', rotation: 2, rows: 4, cols: 2, pileCol: 1 },
  { shape: 'L', rotation: 3, rows: 3, cols: 3, pileCol: 0 },
];

function buildBeforeVertical(rows, cols, pileCol, nBlocks) {
  var before = [];
  for (var r = 0; r < rows; r++) {
    var row = [];
    for (var c = 0; c < cols; c++) row.push(0);
    before.push(row);
  }
  for (var i = 0; i < nBlocks; i++) before[rows - 1 - i][pileCol] = 2;
  return before;
}

function buildBeforeHorizontal(rows, cols, nBlocks) {
  var before = [];
  for (var r = 0; r < rows; r++) {
    var row = [];
    for (var c = 0; c < cols; c++) row.push(0);
    before.push(row);
  }
  for (var c = 0; c < nBlocks && c < cols; c++) before[rows - 1][c] = 2;
  return before;
}

// 竖块：从底行起 nBlocks 格在 pileCol 列。求能让某底格落在 pileCol 的 pieceCol（尝试每个底格 dc）
function findPieceColVertical(rel, pileCol, cols) {
  var maxDr = Math.max.apply(null, rel.map(function(x) { return x.dr; }));
  var maxDc = Math.max.apply(null, rel.map(function(x) { return x.dc; }));
  var bottomCells = rel.filter(function(x) { return x.dr === maxDr; });
  for (var i = 0; i < bottomCells.length; i++) {
    var dc = bottomCells[i].dc;
    var pieceCol = pileCol - dc;
    if (pieceCol >= 0 && pieceCol + maxDc < cols) return pieceCol;
  }
  return null;
}

// 多块堆：仅「2块」一种；只有 I 90°（宽度 4）才额外保留 3块、4块。
var cases = [];
function nBlocksList(tpl) {
  if (tpl.shape === 'I' && tpl.rotation === 1) return [2, 3, 4];
  return [2];
}
MULTI_BLOCK_TEMPLATES.forEach(function(tpl) {
  var w = pieceWidth(tpl.shape, tpl.rotation);
  if (w < 2) return;
  nBlocksList(tpl).forEach(function(nBlocks) {

    var rows = tpl.rows, cols = tpl.cols, c = tpl.pileCol;
    var before;
    var pieceRow, pieceCol;
    var rel = getRelCells(tpl.shape, tpl.rotation);
    var maxDr = Math.max.apply(null, rel.map(function(x) { return x.dr; }));
    var minDc = Math.min.apply(null, rel.map(function(x) { return x.dc; }));
    var maxDc = Math.max.apply(null, rel.map(function(x) { return x.dc; }));

    if (c != null) {
      if (nBlocks > maxDr + 1) return;
      before = buildBeforeVertical(rows, cols, c, nBlocks);
      pieceRow = rows - 2 - maxDr;
      pieceCol = findPieceColVertical(rel, c, cols);
      if (pieceCol == null) return;
    } else {
      if (tpl.shape === 'I' && tpl.rotation === 1) {
        before = buildBeforeHorizontal(rows, cols, nBlocks);
        pieceRow = 0;
        pieceCol = 0;
      } else if (tpl.shape === 'O' && tpl.rotation === 0) {
        if (nBlocks > 4) return;
        before = [];
        for (var r = 0; r < rows; r++) {
          var row = [];
          for (var c0 = 0; c0 < cols; c0++) row.push(0);
          before.push(row);
        }
        if (nBlocks === 2) { before[rows-1][0]=2; before[rows-1][1]=2; }
        else if (nBlocks === 3) { before[rows-1][0]=2; before[rows-1][1]=2; before[rows-2][0]=2; }
        else { before[rows-2][0]=2; before[rows-2][1]=2; before[rows-1][0]=2; before[rows-1][1]=2; }
        pieceRow = rows - 2 - maxDr;
        pieceCol = 0;
      } else return;
    }

    if (pieceRow + Math.min.apply(null, rel.map(function(x) { return x.dr; })) < 0) return;

    var tc = {
      shape: tpl.shape,
      rotation: tpl.rotation,
      ticks: 1,
      rows: rows,
      cols: cols,
      before: before,
      piece: { shape: tpl.shape, rotation: tpl.rotation, row: pieceRow, col: pieceCol },
      pileBlocks: nBlocks
    };
    try {
      tc.expected = runMergeCase(tc);
    } catch (e) {
      console.error(tpl.shape + ' ' + tpl.rotation + '° pile' + nBlocks + ': ' + e.message);
      return;
    }
    cases.push(tc);
  });
});

function caseToLine(tc) {
  var piece = tc.piece;
  var extra = (tc.pileBlocks != null) ? ', pileBlocks: ' + tc.pileBlocks : '';
  if (tc.columnIndex != null) extra += ', columnIndex: ' + tc.columnIndex;
  return '{ shape: \'' + tc.shape + '\', rotation: ' + tc.rotation + ', ticks: 1, rows: ' + tc.rows + ', cols: ' + tc.cols + ', before: ' + JSON.stringify(tc.before) + ', piece: { shape: \'' + piece.shape + '\', rotation: ' + piece.rotation + ', row: ' + piece.row + ', col: ' + piece.col + ' }' + extra + ', expected: ' + JSON.stringify(tc.expected) + ' }';
}

console.log('// ① 组 固定块堆 2/3/4 块（仅 width>=2），共 ' + cases.length + ' 条');
cases.forEach(function(tc) { console.log(caseToLine(tc)); });

/**
 * 生成第五组「简单消行」用例：I0 左侧一列 + 右侧固定堆，共同成行；含只消 1/2/3/4 行及跳行（如只消第 1、3 行）。
 * 运行: node gen-clear-cases.js
 */
var logic = require('../logic.js');
var tick = logic.tick;
var applyPendingClearLines = logic.applyPendingClearLines;

function makeState(rows, cols, boardRows, piece) {
  var board = boardRows.map(function(r) { return r.slice(); });
  return {
    rows: rows, cols: cols, board: board,
    currentPiece: piece, pieceCount: piece ? 1 : 0, nextPiece: null, gameOver: false,
    clearLinesPending: null, postClearGravityState: null, cascadePending: false,
    score: 0, highScore: 0, seed: 0
  };
}

function createPiece(shape, rotation, row, col) {
  return logic.createPiece(shape, rotation != null ? rotation : 0, row, col);
}

function runClearCase(rows, cols, before, pieceSpec, maxTicks) {
  var piece = createPiece(pieceSpec.shape, pieceSpec.rotation, pieceSpec.row, pieceSpec.col);
  var board = before.map(function(r) { return r.slice(); });
  var pieceCountBefore = 1;
  var state;
  for (var i = 0; i < (maxTicks || 20); i++) {
    state = makeState(rows, cols, board, piece);
    state.pieceCount = pieceCountBefore;
    state = tick(state);
    pieceCountBefore = state.pieceCount;
    board = state.board.map(function(r) { return r.slice(); });
    piece = state.currentPiece;
    if (!piece) break;
  }
  while (state.clearLinesPending && state.clearLinesPending.length > 0 || state.postClearGravityState != null) {
    state = applyPendingClearLines(state);
  }
  return state.board;
}

var rows = 4, cols = 4;
var pieceI0 = { shape: 'I', rotation: 0, row: 0, col: 0 };

// 约定：col 0 为 I0 占据，cols 1..3 为固定堆。某行「满」= 该行 before 为 [0,2,2,2]（锁块后为 [2,2,2,2]）。
// fullRows: 要成为满行的行号数组
function makeBeforeI0(fullRowsSet) {
  var before = [];
  for (var r = 0; r < rows; r++) {
    if (fullRowsSet[r]) {
      before.push([0, 2, 2, 2]);
    } else {
      before.push([0, 0, 2, 2]); // 非满行：至少一个 0 在 1..3
    }
  }
  return before;
}

var cases = [];
var labels = [];

// 消 1 行：第 0 / 1 / 2 / 3 行
[[0], [1], [2], [3]].forEach(function(rowsToClear) {
  var set = {};
  rowsToClear.forEach(function(r) { set[r] = true; });
  var before = makeBeforeI0(set);
  var expected = runClearCase(rows, cols, before, pieceI0, 1);
  cases.push({ before: before, expected: expected });
  labels.push('消第' + (rowsToClear.map(function(r) { return r + 1; }).join(',')) + '行');
});

// 消 2 行：连续 0+1, 1+2, 2+3；跳行 0+2, 1+3, 0+3
[[0,1], [1,2], [2,3], [0,2], [1,3], [0,3]].forEach(function(rowsToClear) {
  var set = {};
  rowsToClear.forEach(function(r) { set[r] = true; });
  var before = makeBeforeI0(set);
  var expected = runClearCase(rows, cols, before, pieceI0, 1);
  cases.push({ before: before, expected: expected });
  labels.push('消第' + (rowsToClear.map(function(r) { return r + 1; }).join('、')) + '行');
});

// 消 3 行
[[0,1,2], [1,2,3], [0,1,3], [0,2,3]].forEach(function(rowsToClear) {
  var set = {};
  rowsToClear.forEach(function(r) { set[r] = true; });
  var before = makeBeforeI0(set);
  var expected = runClearCase(rows, cols, before, pieceI0, 1);
  cases.push({ before: before, expected: expected });
  labels.push('消第' + (rowsToClear.map(function(r) { return r + 1; }).join('、')) + '行');
});

// 消 4 行
var set4 = { 0: true, 1: true, 2: true, 3: true };
var before4 = makeBeforeI0(set4);
var expected4 = runClearCase(rows, cols, before4, pieceI0, 1);
cases.push({ before: before4, expected: expected4 });
labels.push('消第1、2、3、4行');

// O：左侧 2 列块，右侧 2 列堆，4 行 4 列；O 在 (2,0) 锁块后填满第 2、3 行
var beforeO = [[0,0,2,2],[0,0,2,2],[0,0,2,2],[0,0,2,2]];
var pieceO = { shape: 'O', rotation: 0, row: 2, col: 0 };
var expectedO = runClearCase(4, 4, beforeO, pieceO, 1);
cases.push({ before: beforeO, expected: expectedO });
labels.push('O 消2行');

// 输出为可粘贴到 HTML 的格式
console.log('// I0 左侧一列 + 右侧堆，1 tick 锁定后消行');
cases.forEach(function(c, i) {
  var tc = {
    shape: i < cases.length - 1 ? 'I' : 'O',
    rotation: 0,
    ticks: 1,
    rows: 4,
    cols: 4,
    before: c.before,
    piece: i < cases.length - 1 ? { shape: 'I', rotation: 0, row: 0, col: 0 } : { shape: 'O', rotation: 0, row: 2, col: 0 },
    expected: c.expected
  };
  if (i < labels.length) tc.label = labels[i];
  console.log(JSON.stringify(tc) + ',');
});

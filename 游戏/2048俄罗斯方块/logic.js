/**
 * 2048方块 - 纯逻辑（Web 版）。俄罗斯方块式下落，同数合并、行消除。
 * 从 test1 miniprogram/games/2048blocks/logic.ts 移植，localStorage 由 dom 层处理。
 */
'use strict';

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.Game2048BlocksLogic = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  var STORAGE_HIGH_SCORE_BLOCKS = '2048blocks-high-score';
  var STORAGE_SETTINGS_BLOCKS = '2048blocks-settings';
  var STORAGE_GAME_STATE_BLOCKS = '2048blocks-game-state';

  var SHAPES = {
    I: [[0, 0], [1, 0], [2, 0], [3, 0]],
    O: [[0, 0], [0, 1], [1, 0], [1, 1]],
    T: [[0, 1], [1, 0], [1, 1], [2, 1]],
    Z: [[0, 1], [1, 0], [1, 1], [2, 0]],
    S: [[0, 0], [1, 0], [1, 1], [2, 1]],
    J: [[0, 1], [1, 1], [2, 0], [2, 1]],
    L: [[0, 0], [1, 0], [2, 0], [2, 1]],
  };
  var SHAPE_KEYS = Object.keys(SHAPES);
  var MIN_ROWS = 8;
  var MIN_COLS = 6;
  var DEFAULT_CFG = { rows: 12, cols: 8, fallIntervalMs: 500 };

  function getShapeCells(shape, rotation) {
    var def = SHAPES[shape];
    if (!def) return [];
    var coords = def.map(function (p) { return [p[0], p[1]]; });
    var center = { r: 0, c: 0 };
    for (var i = 0; i < coords.length; i++) {
      center.r += coords[i][0];
      center.c += coords[i][1];
    }
    center.r /= coords.length;
    center.c /= coords.length;
    for (var rot = 0; rot < rotation; rot++) {
      coords = coords.map(function (p) {
        var r = p[0], c = p[1];
        var nr = c - center.c + center.r;
        var nc = -(r - center.r) + center.c;
        return [Math.round(nr), Math.round(nc)];
      });
    }
    var minR = Math.min.apply(null, coords.map(function (p) { return p[0]; }));
    var minC = Math.min.apply(null, coords.map(function (p) { return p[1]; }));
    return coords.map(function (p) { return [p[0] - minR, p[1] - minC]; });
  }

  function createPiece(shape, rotation, row, col) {
    var rel = getShapeCells(shape, rotation);
    var cells = rel.map(function (p) { return { dr: p[0], dc: p[1], value: 2 }; });
    return { shape: shape, rotation: rotation, row: row, col: col, cells: cells, mergeCount: 0 };
  }

  function pieceAbsCells(p) {
    return p.cells.map(function (c) {
      return { r: p.row + c.dr, c: p.col + c.dc, value: c.value };
    });
  }

  function pieceOverlapsBoard(board, rows, cols, p, rowOffset, colOffset) {
    var cells = pieceAbsCells(p);
    for (var i = 0; i < cells.length; i++) {
      var r2 = cells[i].r + rowOffset;
      var c2 = cells[i].c + colOffset;
      if (r2 >= 0 && r2 < rows && c2 >= 0 && c2 < cols && board[r2][c2] !== 0) return true;
    }
    return false;
  }

  function pieceOutOfBounds(rows, cols, p, rowOffset, colOffset) {
    var cells = pieceAbsCells(p);
    for (var i = 0; i < cells.length; i++) {
      var r2 = cells[i].r + rowOffset;
      var c2 = cells[i].c + colOffset;
      if (c2 < 0 || c2 >= cols) return true;
      if (r2 >= rows) return true;
    }
    return false;
  }

  function wouldCollide(board, rows, cols, p, downRows, colOffset) {
    if (pieceOutOfBounds(rows, cols, p, downRows, colOffset)) return true;
    if (pieceOverlapsBoard(board, rows, cols, p, downRows, colOffset)) return true;
    return false;
  }

  function getContactCells(piece) {
    return piece.cells.filter(function (c) {
      return !piece.cells.some(function (c2) { return c2.dr === c.dr + 1 && c2.dc === c.dc; });
    });
  }

  function hasBlockInRow0(board, cols) {
    for (var c = 0; c < cols; c++) {
      if (board[0][c] !== 0) return true;
    }
    return false;
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

  function seededRandom(seed, pieceIndex) {
    var s = (seed + pieceIndex * 7919) >>> 0;
    s = (Math.imul(s, 1103515245) + 12345) >>> 0;
    var a = (s & 0x7fffffff) / 0x7fffffff;
    s = (Math.imul(s, 1103515245) + 12345) >>> 0;
    var b = (s & 0x7fffffff) / 0x7fffffff;
    return [a, b];
  }

  function spawnNextPiece(rows, cols, seed, pieceIndex) {
    var useSeed = seed != null && pieceIndex != null;
    var rands = useSeed ? seededRandom(seed, pieceIndex) : [Math.random(), Math.random()];
    var shape = SHAPE_KEYS[Math.floor(rands[0] * SHAPE_KEYS.length)];
    var rotation = Math.floor(rands[1] * 4);
    var rel = getShapeCells(shape, rotation);
    var maxDr = Math.max.apply(null, rel.map(function (p) { return p[0]; }));
    var maxC = Math.max.apply(null, rel.map(function (p) { return p[1]; }));
    var col = Math.max(0, Math.floor((cols - maxC - 1) / 2));
    return createPiece(shape, rotation, -maxDr, col);
  }

  function writePieceToBoard(board, rows, cols, piece) {
    for (var i = 0; i < piece.cells.length; i++) {
      var cell = piece.cells[i];
      if (cell.merged) continue;
      var r = piece.row + cell.dr;
      var c = piece.col + cell.dc;
      if (r >= 0 && r < rows && c >= 0 && c < cols) board[r][c] = cell.value;
    }
  }

  function getFullRowIndices(board, rows, cols) {
    var out = [];
    for (var r = 0; r < rows; r++) {
      var full = true;
      for (var c = 0; c < cols; c++) {
        if (board[r][c] === 0) { full = false; break; }
      }
      if (full) out.push(r);
    }
    return out;
  }

  function compactGravityColumn(board, rows, c) {
    var colVals = [];
    for (var r = rows - 1; r >= 0; r--) {
      if (board[r][c] !== 0) colVals.push(board[r][c]);
    }
    for (var k = 0; k < rows; k++) {
      board[rows - 1 - k][c] = k < colVals.length ? colVals[k] : 0;
    }
  }

  function compactGravityColumnRange(board, startRow, endRow, c) {
    var colVals = [];
    for (var r = endRow; r >= startRow; r--) {
      if (board[r][c] !== 0) colVals.push(board[r][c]);
    }
    for (var k = 0; k <= endRow - startRow; k++) {
      board[endRow - k][c] = k < colVals.length ? colVals[k] : 0;
    }
  }

  function hasVerticalMergeInClearedRows(board, rows, cols, remainingRowsSet, remainingInCleared) {
    var arr = Array.from(remainingRowsSet);
    for (var i = 0; i < arr.length; i++) {
      var r = arr[i];
      if (r <= 0) continue;
      for (var c = 0; c < cols; c++) {
        if (remainingInCleared[r][c] && board[r][c] !== 0 && board[r][c] === board[r - 1][c]) return true;
      }
    }
    return false;
  }

  function doOneVerticalMergeInClearedRows(board, rows, cols, remainingRowsSet, remainingInCleared) {
    var sorted = Array.from(remainingRowsSet).filter(function (r) { return r > 0; }).sort(function (a, b) { return b - a; });
    for (var i = 0; i < sorted.length; i++) {
      var r = sorted[i];
      for (var c = 0; c < cols; c++) {
        if (remainingInCleared[r][c] && board[r][c] !== 0 && board[r][c] === board[r - 1][c]) {
          board[r][c] *= 2;
          board[r - 1][c] = 0;
          compactGravityColumn(board, rows, c);
          remainingInCleared[r][c] = false;
          return true;
        }
      }
    }
    return false;
  }

  function doClearAndGravityOnly(board, rows, cols, fullRows) {
    if (fullRows.length === 0) {
      var rem = [];
      for (var r = 0; r < rows; r++) {
        var row = [];
        for (var c = 0; c < cols; c++) row.push(false);
        rem.push(row);
      }
      return { scoreAdd: 0, remainingInCleared: rem, remainingRows: [] };
    }
    var clearedSet = {};
    var clearedRowMinVal = {};
    var scoreAdd = 0;
    var afterClear = board.map(function (row) { return row.slice(); });
    var beforeBoard = board.map(function (row) { return row.slice(); });
    for (var i = 0; i < fullRows.length; i++) {
      var r = fullRows[i];
      var minVal = 0;
      for (var c = 0; c < cols; c++) {
        if (board[r][c] !== 0 && (minVal === 0 || board[r][c] < minVal)) minVal = board[r][c];
      }
      if (minVal === 0) continue;
      clearedSet[r] = true;
      clearedRowMinVal[r] = minVal;
      for (var c = 0; c < cols; c++) {
        var v = board[r][c] / minVal;
        if (v === 1) {
          afterClear[r][c] = 0;
          scoreAdd += minVal;
        } else {
          afterClear[r][c] = v;
        }
      }
    }
    var sortedCleared = Object.keys(clearedSet).map(Number).sort(function (a, b) { return a - b; });
    var firstRowCleared = Math.min.apply(null, sortedCleared);
    var numCleared = sortedCleared.length;
    var numAbove = firstRowCleared;
    var numFallIntoEmpty = Math.max(0, numAbove - numCleared);
    var remainingInCleared = [];
    for (var r = 0; r < rows; r++) {
      var row = [];
      for (var c = 0; c < cols; c++) row.push(false);
      remainingInCleared.push(row);
    }
    for (var c = 0; c < cols; c++) {
      for (var r = 0; r < numCleared; r++) {
        board[r][c] = 0;
        remainingInCleared[r][c] = false;
      }
      for (var i = 0; i < numFallIntoEmpty; i++) {
        var r = numCleared + i;
        board[r][c] = beforeBoard[i][c];
        remainingInCleared[r][c] = false;
      }
      for (var ri = 0; ri < numCleared; ri++) {
        var r = firstRowCleared + ri;
        var fallen = numFallIntoEmpty + ri < numAbove ? beforeBoard[numFallIntoEmpty + ri][c] : 0;
        var remain = afterClear[r][c];
        board[r][c] = (fallen && remain && fallen === remain) ? 2 * fallen : (fallen || remain);
        remainingInCleared[r][c] = board[r][c] !== 0;
      }
    }
    var remainingRows = [];
    for (var i = 0; i < numCleared; i++) remainingRows.push(firstRowCleared + i);
    return { scoreAdd: scoreAdd, remainingInCleared: remainingInCleared, remainingRows: remainingRows };
  }

  function doMergeInClearedRows(board, rows, cols, remainingInCleared, remainingRowsArr) {
    var remainingRowsSet = new Set(remainingRowsArr);
    while (hasVerticalMergeInClearedRows(board, rows, cols, remainingRowsSet, remainingInCleared)) {
      while (doOneVerticalMergeInClearedRows(board, rows, cols, remainingRowsSet, remainingInCleared)) {}
    }
    return getFullRowIndices(board, rows, cols);
  }

  function clearOneRound(board, rows, cols) {
    var fullRows = getFullRowIndices(board, rows, cols);
    if (fullRows.length === 0) return { scoreAdd: 0, newFullRows: [] };
    var firstRowCleared = Math.min.apply(null, fullRows);
    var numCleared = fullRows.length;
    var result = doClearAndGravityOnly(board, rows, cols, fullRows);
    var startRow = firstRowCleared;
    var endRow = firstRowCleared + numCleared - 1;
    for (var c = 0; c < cols; c++) compactGravityColumnRange(board, startRow, endRow, c);
    var remainingInCleared = [];
    for (var r = 0; r < rows; r++) {
      var row = [];
      for (var c = 0; c < cols; c++) row.push(false);
      remainingInCleared.push(row);
    }
    for (var i = 0; i < result.remainingRows.length; i++) {
      var r = result.remainingRows[i];
      for (var c = 0; c < cols; c++) remainingInCleared[r][c] = board[r][c] !== 0;
    }
    var newFullRows = doMergeInClearedRows(board, rows, cols, remainingInCleared, result.remainingRows);
    return { scoreAdd: result.scoreAdd, newFullRows: newFullRows };
  }

  function clearFullLines(board, rows, cols) {
    var totalScore = 0;
    var chainBonus = 1;
    while (true) {
      var result = clearOneRound(board, rows, cols);
      if (result.scoreAdd === 0 && result.newFullRows.length === 0) break;
      totalScore += result.scoreAdd * chainBonus;
      chainBonus += 1;
      if (result.newFullRows.length === 0) break;
    }
    return totalScore;
  }

  function hasAnyCascade(board, rows, cols) {
    for (var c = 0; c < cols; c++) {
      for (var r = 0; r < rows; r++) {
        if (board[r][c] === 0) continue;
        if (r + 1 < rows && board[r][c] === board[r + 1][c]) return true;
        if (r - 1 >= 0 && board[r][c] === board[r - 1][c]) return true;
      }
    }
    return false;
  }

  function doOneCascadeStep(board, rows, cols) {
    for (var c = 0; c < cols; c++) {
      for (var r = 0; r < rows; r++) {
        if (board[r][c] === 0) continue;
        if (r + 1 < rows && board[r][c] === board[r + 1][c]) {
          board[r + 1][c] *= 2;
          board[r][c] = 0;
          return { didOne: true, more: hasAnyCascade(board, rows, cols) };
        }
        if (r - 1 >= 0 && board[r][c] === board[r - 1][c]) {
          board[r][c] *= 2;
          board[r - 1][c] = 0;
          return { didOne: true, more: hasAnyCascade(board, rows, cols) };
        }
      }
    }
    return { didOne: false, more: false };
  }

  function applyPendingClearLines(g) {
    var post = g.postClearGravityState;
    if (post != null) {
      var newFullRows = doMergeInClearedRows(g.board, g.rows, g.cols, post.remainingInCleared, post.remainingRows);
      var score = g.score + post.scoreAdd;
      var highScore = g.highScore >= score ? g.highScore : score;
      if (newFullRows.length > 0) {
        return Object.assign({}, g, {
          score: score,
          highScore: highScore,
          clearLinesPending: newFullRows,
          postClearGravityState: null,
        });
      }
      var nextCount = g.pieceCount;
      var newCurrent = g.nextPiece != null ? g.nextPiece : spawnNextPiece(g.rows, g.cols, g.seed, nextCount - 1);
      var nextPiece = spawnNextPiece(g.rows, g.cols, g.seed, nextCount);
      var gameOver = hasBlockInRow0(g.board, g.cols) || wouldCollide(g.board, g.rows, g.cols, newCurrent, 0, 0);
      return Object.assign({}, g, {
        board: g.board,
        currentPiece: gameOver ? null : newCurrent,
        nextPiece: gameOver ? g.nextPiece : nextPiece,
        score: score,
        highScore: highScore,
        gameOver: gameOver,
        overlayVisible: gameOver,
        overlayMessage: gameOver ? '游戏结束' : g.overlayMessage,
        clearLinesPending: null,
        postClearGravityState: null,
      });
    }
    if (g.clearLinesPending == null || g.clearLinesPending.length === 0) return g;
    var result = doClearAndGravityOnly(g.board, g.rows, g.cols, g.clearLinesPending);
    return Object.assign({}, g, {
      board: g.board,
      clearLinesPending: null,
      postClearGravityState: { scoreAdd: result.scoreAdd, remainingInCleared: result.remainingInCleared, remainingRows: result.remainingRows },
    });
  }

  function moveLeft(game) {
    if (game.gameOver || !game.currentPiece) return game;
    if (wouldCollide(game.board, game.rows, game.cols, game.currentPiece, 0, -1)) return game;
    return Object.assign({}, game, { currentPiece: Object.assign({}, game.currentPiece, { col: game.currentPiece.col - 1 }) });
  }

  function moveRight(game) {
    if (game.gameOver || !game.currentPiece) return game;
    if (wouldCollide(game.board, game.rows, game.cols, game.currentPiece, 0, 1)) return game;
    return Object.assign({}, game, { currentPiece: Object.assign({}, game.currentPiece, { col: game.currentPiece.col + 1 }) });
  }

  function rotate(game) {
    if (game.gameOver || !game.currentPiece) return game;
    var p = game.currentPiece;
    if (p.mergeCount > 0) return game;
    var nextRotation = (p.rotation + 1) % 4;
    var rel = getShapeCells(p.shape, nextRotation);
    var baseNext = {
      shape: p.shape,
      rotation: nextRotation,
      row: p.row,
      col: p.col,
      cells: rel.map(function (pt) { return { dr: pt[0], dc: pt[1], value: 2 }; }),
      mergeCount: p.mergeCount,
    };
    var tryOffsets = [0, -1, 1, -2, 2, -3, 3];
    for (var i = 0; i < tryOffsets.length; i++) {
      var offset = tryOffsets[i];
      var nextPiece = Object.assign({}, baseNext, { col: p.col + offset });
      if (pieceOutOfBounds(game.rows, game.cols, nextPiece, 0, 0)) continue;
      if (pieceOverlapsBoard(game.board, game.rows, game.cols, nextPiece, 0, 0)) continue;
      return Object.assign({}, game, { currentPiece: nextPiece });
    }
    return game;
  }

  var MAX_TICKS_UNTIL_LOCK = 200;

  function runUntilFirstLock(g) {
    var state = g;
    var initialCount = g.pieceCount;
    var n = 0;
    while (state.pieceCount === initialCount && state.currentPiece != null) {
      if (n >= MAX_TICKS_UNTIL_LOCK) throw new Error('runUntilFirstLock 超时');
      state = tick(state);
      n++;
    }
    return state;
  }

  function tick(game) {
    if (game.gameOver) return game;
    if (game.clearLinesPending != null && game.clearLinesPending.length > 0) return game;
    if (game.postClearGravityState != null) return game;
    var g = Object.assign({}, game);
    if (g.cascadePending) {
      var cascade = doOneCascadeStep(g.board, g.rows, g.cols);
      if (cascade.didOne) {
        return Object.assign({}, g, { cascadePending: cascade.more });
      }
      return Object.assign({}, g, { cascadePending: false });
    }
    var piece = g.currentPiece;
    if (!piece) return g;

    if (pieceOutOfBounds(g.rows, g.cols, piece, 1, 0)) {
      var maxDr = Math.max.apply(null, piece.cells.map(function (c) { return c.dr; }));
      var lockRow = Math.min(piece.row, g.rows - 1 - maxDr);
      var lockPieceAt = Object.assign({}, piece, { row: lockRow });
      writePieceToBoard(g.board, g.rows, g.cols, lockPieceAt);
      var nextCount = g.pieceCount + 1;
      var fullRows = getFullRowIndices(g.board, g.rows, g.cols);
      if (fullRows.length > 0) {
        return Object.assign({}, g, {
          board: g.board,
          currentPiece: null,
          pieceCount: nextCount,
          clearLinesPending: fullRows,
        });
      }
      var score = g.score + clearFullLines(g.board, g.rows, g.cols);
      var highScore = g.highScore >= score ? g.highScore : score;
      var newCurrent = g.nextPiece != null ? g.nextPiece : spawnNextPiece(g.rows, g.cols, g.seed, nextCount - 1);
      var nextPiece = spawnNextPiece(g.rows, g.cols, g.seed, nextCount);
      var gameOver = hasBlockInRow0(g.board, g.cols) || wouldCollide(g.board, g.rows, g.cols, newCurrent, 0, 0);
      return Object.assign({}, g, {
        board: g.board,
        currentPiece: gameOver ? null : newCurrent,
        nextPiece: gameOver ? g.nextPiece : nextPiece,
        score: score,
        highScore: highScore,
        gameOver: gameOver,
        overlayVisible: gameOver,
        overlayMessage: gameOver ? '游戏结束' : g.overlayMessage,
        pieceCount: nextCount,
      });
    }

    var rows = g.rows;
    var cols = g.cols;
    var board = g.board;

    while (true) {
      var wouldHit = pieceOverlapsBoard(board, rows, cols, piece, 1, 0);
      if (!wouldHit) {
        return Object.assign({}, g, { board: board, currentPiece: Object.assign({}, piece, { row: piece.row + 1 }) });
      }

      var pieceRow = piece.row;
      var pieceCol = piece.col;
      var contactCells = getContactCells(piece);

      var hitBottom = false;
      for (var i = 0; i < contactCells.length; i++) {
        var rowBelow = pieceRow + contactCells[i].dr + 1;
        if (rowBelow >= rows) { hitBottom = true; break; }
      }
      if (hitBottom) {
        writePieceToBoard(board, rows, cols, Object.assign({}, piece, { row: pieceRow }));
        var nextCount = g.pieceCount + 1;
        var fullRows = getFullRowIndices(board, rows, cols);
        if (fullRows.length > 0) {
          return Object.assign({}, g, {
            board: board,
            currentPiece: null,
            pieceCount: nextCount,
            clearLinesPending: fullRows,
          });
        }
        var score = g.score + clearFullLines(board, rows, cols);
        var highScore = g.highScore >= score ? g.highScore : score;
        var newCurrent = g.nextPiece != null ? g.nextPiece : spawnNextPiece(rows, cols, g.seed, nextCount - 1);
        var nextPiece = spawnNextPiece(rows, cols, g.seed, nextCount);
        var gameOver = hasBlockInRow0(board, cols) || wouldCollide(board, rows, cols, newCurrent, 0, 0);
        return Object.assign({}, g, {
          board: board,
          currentPiece: gameOver ? null : newCurrent,
          nextPiece: gameOver ? g.nextPiece : nextPiece,
          score: score,
          highScore: highScore,
          gameOver: gameOver,
          overlayVisible: gameOver,
          overlayMessage: gameOver ? '游戏结束' : g.overlayMessage,
          pieceCount: nextCount,
        });
      }

      var canFallOrMerge = true;
      for (var i = 0; i < contactCells.length; i++) {
        var cell = contactCells[i];
        var rowBelow = pieceRow + cell.dr + 1;
        var col = piece.col + cell.dc;
        var below = (col >= 0 && col < cols) ? board[rowBelow][col] : -1;
        if (below !== 0 && below !== cell.value) {
          canFallOrMerge = false;
          break;
        }
      }

      if (!canFallOrMerge) {
        writePieceToBoard(board, rows, cols, Object.assign({}, piece, { row: pieceRow }));
        var nextCount = g.pieceCount + 1;
        var fullRows = getFullRowIndices(board, rows, cols);
        if (fullRows.length > 0) {
          return Object.assign({}, g, {
            board: board,
            currentPiece: null,
            pieceCount: nextCount,
            clearLinesPending: fullRows,
          });
        }
        var score = g.score + clearFullLines(board, rows, cols);
        var highScore = g.highScore >= score ? g.highScore : score;
        var newCurrent = g.nextPiece != null ? g.nextPiece : spawnNextPiece(rows, cols, g.seed, nextCount - 1);
        var nextPiece = spawnNextPiece(rows, cols, g.seed, nextCount);
        var gameOver = hasBlockInRow0(board, cols) || wouldCollide(board, rows, cols, newCurrent, 0, 0);
        return Object.assign({}, g, {
          board: board,
          currentPiece: gameOver ? null : newCurrent,
          nextPiece: gameOver ? g.nextPiece : nextPiece,
          score: score,
          highScore: highScore,
          gameOver: gameOver,
          overlayVisible: gameOver,
          overlayMessage: gameOver ? '游戏结束' : g.overlayMessage,
          pieceCount: nextCount,
        });
      }

      var newRow = pieceRow + 1;
      var updatedCells = piece.cells.map(function (cell) {
        var hasBelowInPiece = piece.cells.some(function (c2) { return c2.dr === cell.dr + 1 && c2.dc === cell.dc; });
        if (hasBelowInPiece) return Object.assign({}, cell);
        var rowBelow = pieceRow + cell.dr + 1;
        var col = piece.col + cell.dc;
        if (col < 0 || col >= cols) return Object.assign({}, cell);
        var below = board[rowBelow][col];
        if (below === cell.value) {
          var pr = pieceRow + cell.dr;
          var pc = col;
          board[pr][pc] = 0;
          board[rowBelow][col] = cell.value * 2;
          return Object.assign({}, cell, { value: cell.value * 2, merged: true });
        }
        return Object.assign({}, cell);
      });

      var mergedCount = 0;
      for (var i = 0; i < contactCells.length; i++) {
        var c = contactCells[i];
        var rowBelow = pieceRow + c.dr + 1;
        var col = piece.col + c.dc;
        if (col >= 0 && col < cols && board[rowBelow][col] === c.value * 2) mergedCount++;
      }
      piece = Object.assign({}, piece, { row: newRow, cells: updatedCells, mergeCount: piece.mergeCount + mergedCount });
    }
  }

  function init(highScore, overrides) {
    highScore = highScore || 0;
    overrides = overrides || {};
    var rows = Math.max(MIN_ROWS, overrides.rows != null ? overrides.rows : DEFAULT_CFG.rows);
    var cols = Math.max(MIN_COLS, overrides.cols != null ? overrides.cols : DEFAULT_CFG.cols);
    var fallIntervalMs = overrides.fallIntervalMs != null ? overrides.fallIntervalMs : DEFAULT_CFG.fallIntervalMs;
    var seed = overrides.seed != null ? overrides.seed : Date.now();
    var board = emptyBoard(rows, cols);
    var currentPiece = spawnNextPiece(rows, cols, seed, 0);
    var nextPiece = spawnNextPiece(rows, cols, seed, 1);
    return {
      rows: rows,
      cols: cols,
      board: board,
      currentPiece: currentPiece,
      nextPiece: nextPiece,
      score: 0,
      highScore: highScore,
      gameOver: false,
      overlayVisible: false,
      overlayMessage: '',
      fallIntervalMs: fallIntervalMs,
      cascadePending: false,
      pieceCount: 1,
      seed: seed,
      clearLinesPending: null,
      postClearGravityState: null,
    };
  }

  function serializeGameState(g) {
    function serPiece(p) {
      if (!p) return null;
      return {
        shape: p.shape,
        rotation: p.rotation,
        row: p.row,
        col: p.col,
        cells: p.cells.map(function (c) { return { dr: c.dr, dc: c.dc, value: c.value }; }),
        mergeCount: p.mergeCount,
      };
    }
    return {
      rows: g.rows,
      cols: g.cols,
      board: g.board.map(function (row) { return row.slice(); }),
      currentPiece: serPiece(g.currentPiece),
      nextPiece: serPiece(g.nextPiece),
      score: g.score,
      highScore: g.highScore,
      gameOver: g.gameOver,
      overlayVisible: g.overlayVisible,
      overlayMessage: g.overlayMessage,
      fallIntervalMs: g.fallIntervalMs,
      cascadePending: g.cascadePending,
      pieceCount: g.pieceCount,
      seed: g.seed,
      clearLinesPending: g.clearLinesPending ? g.clearLinesPending.slice() : null,
      postClearGravityState: g.postClearGravityState == null ? null : {
        scoreAdd: g.postClearGravityState.scoreAdd,
        remainingInCleared: g.postClearGravityState.remainingInCleared.map(function (r) { return r.slice(); }),
        remainingRows: g.postClearGravityState.remainingRows.slice(),
      },
    };
  }

  var MIN_ROWS_BLOCKS = 8;
  var MIN_COLS_BLOCKS = 6;
  var DEFAULT_FALL_INTERVAL_MS_BLOCKS = 500;

  function deserializeGameState(raw) {
    if (!raw || typeof raw !== 'object') return null;
    var o = raw;
    var rows = Number(o.rows);
    var cols = Number(o.cols);
    if (!Number.isFinite(rows) || rows < MIN_ROWS_BLOCKS || !Number.isFinite(cols) || cols < MIN_COLS_BLOCKS) return null;
    var boardRaw = o.board;
    if (!Array.isArray(boardRaw) || boardRaw.length !== rows) return null;
    var board = [];
    for (var r = 0; r < rows; r++) {
      var rowRaw = boardRaw[r];
      if (!Array.isArray(rowRaw) || rowRaw.length !== cols) return null;
      board.push(rowRaw.map(function (v) { return (Number.isFinite(Number(v)) && Number(v) >= 0) ? Number(v) : 0; }));
    }
    function dePiece(p) {
      if (!p || typeof p !== 'object') return null;
      var shape = String(p.shape || 'I');
      var rotation = Math.max(0, Math.min(3, Number(p.rotation) || 0));
      var row = Number(p.row);
      var col = Number(p.col);
      if (SHAPE_KEYS.indexOf(shape) === -1 || !Number.isFinite(row) || !Number.isFinite(col)) return null;
      var base = createPiece(shape, rotation, row, col);
      var cellsRaw = p.cells;
      if (Array.isArray(cellsRaw) && cellsRaw.length === base.cells.length) {
        base.cells = cellsRaw.map(function (c) {
          return {
            dr: Number(c.dr) || 0,
            dc: Number(c.dc) || 0,
            value: Number(c.value) >= 2 ? Number(c.value) : 2,
          };
        });
      }
      base.mergeCount = Math.max(0, Number(p.mergeCount) || 0);
      return base;
    }
    var currentPiece = dePiece(o.currentPiece);
    var nextPiece = dePiece(o.nextPiece);
    var fallIntervalMs = Math.max(100, Number(o.fallIntervalMs) || DEFAULT_FALL_INTERVAL_MS_BLOCKS);
    var clearLinesPending = Array.isArray(o.clearLinesPending) ? o.clearLinesPending.slice() : null;
    var postRaw = o.postClearGravityState;
    var postClearGravityState = null;
    if (postRaw && typeof postRaw === 'object') {
      var remainingInCleared = postRaw.remainingInCleared;
      var remainingRows = postRaw.remainingRows;
      if (Array.isArray(remainingInCleared) && Array.isArray(remainingRows)) {
        postClearGravityState = {
          scoreAdd: Number(postRaw.scoreAdd) || 0,
          remainingInCleared: remainingInCleared.map(function (r) { return Array.isArray(r) ? r.slice() : []; }),
          remainingRows: remainingRows.slice(),
        };
      }
    }
    return {
      rows: rows,
      cols: cols,
      board: board,
      currentPiece: currentPiece,
      nextPiece: nextPiece,
      score: Math.max(0, Number(o.score) || 0),
      highScore: Math.max(0, Number(o.highScore) || 0),
      gameOver: Boolean(o.gameOver),
      overlayVisible: Boolean(o.overlayVisible),
      overlayMessage: String(o.overlayMessage != null ? o.overlayMessage : ''),
      fallIntervalMs: fallIntervalMs,
      cascadePending: Boolean(o.cascadePending),
      pieceCount: Math.max(1, Number(o.pieceCount) || 1),
      seed: Number.isFinite(Number(o.seed)) ? Number(o.seed) : Date.now(),
      clearLinesPending: clearLinesPending,
      postClearGravityState: postClearGravityState,
    };
  }

  return {
    STORAGE_HIGH_SCORE_BLOCKS: STORAGE_HIGH_SCORE_BLOCKS,
    STORAGE_SETTINGS_BLOCKS: STORAGE_SETTINGS_BLOCKS,
    STORAGE_GAME_STATE_BLOCKS: STORAGE_GAME_STATE_BLOCKS,
    init: init,
    tick: tick,
    moveLeft: moveLeft,
    moveRight: moveRight,
    rotate: rotate,
    runUntilFirstLock: runUntilFirstLock,
    applyPendingClearLines: applyPendingClearLines,
    pieceAbsCells: pieceAbsCells,
    createPiece: createPiece,
    getFullRowIndices: getFullRowIndices,
    serializeGameState: serializeGameState,
    deserializeGameState: deserializeGameState,
  };
});

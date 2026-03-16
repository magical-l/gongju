/**
 * 2048方块 - DOM 与键盘/手势/定时器。依赖 logic.js、constants.js。
 * 与 test1 2048blocks 一致：下落定时 tick，左右下旋转由按键/手势控制。
 */
'use strict';

var logic, constants;
var init, tick, moveLeft, moveRight, rotate, runUntilFirstLock, applyPendingClearLines, pieceAbsCells;
var serializeGameState, deserializeGameState;
var STORAGE_HIGH_SCORE_BLOCKS, STORAGE_SETTINGS_BLOCKS, STORAGE_GAME_STATE_BLOCKS;
var MIN_SWIPE_PX = 30;
var SWIPE_PX_PER_CELL = 40;
var LONG_SWIPE_DOWN_PX = 80;

var view = null;
var gameState = null;
var fallTimer = null;
var clearLinesTimeout = null;
var paused = true;

function getStorage(key) {
  try { return localStorage.getItem(key); } catch (e) { return null; }
}
function setStorage(key, value) {
  try { localStorage.setItem(key, value); } catch (e) {}
}

/** 合并 board + currentPiece 为显示用的一维数组 (row-major)，空为 0 */
function getDisplayBoard(state) {
  var rows = state.rows;
  var cols = state.cols;
  var board = state.board;
  var total = rows * cols;
  var flat = [];
  for (var r = 0; r < rows; r++) {
    for (var c = 0; c < cols; c++) {
      flat.push(board[r][c] || 0);
    }
  }
  var piece = state.currentPiece;
  if (piece && !state.gameOver) {
    var abs = pieceAbsCells(piece);
    for (var i = 0; i < abs.length; i++) {
      var cell = abs[i];
      if (cell.r >= 0 && cell.r < rows && cell.c >= 0 && cell.c < cols) {
        flat[cell.r * cols + cell.c] = cell.value;
      }
    }
  }
  return flat;
}

function commitState(state) {
  if (!state || !view || !view.commitState) return;
  var disp = getDisplayBoard(state);
  var rows = state.rows;
  var cols = state.cols;
  var gameStateForView = Object.assign({}, state, {
    board: disp,
    boardWidth: cols,
    boardHeight: rows,
  });
  view.setBoardView(disp, rows, cols, gameStateForView);
  view.updateScores(state.score, state.highScore, cols, rows);
  view.setGameResult(
    !!(state.overlayVisible && state.overlayMessage),
    state.overlayMessage || '',
    state.gameOver ? '最终得分：' + state.score : '',
    false
  );
  view.commitState(gameStateForView);
}

function stopFallTimer() {
  if (fallTimer) {
    clearInterval(fallTimer);
    fallTimer = null;
  }
}

function startFallTimer() {
  stopFallTimer();
  if (paused || !gameState || gameState.gameOver) return;
  if (gameState.clearLinesPending && gameState.clearLinesPending.length > 0) return;
  if (gameState.postClearGravityState) return;
  var ms = Math.max(100, gameState.fallIntervalMs || 500);
  fallTimer = setInterval(function () {
    if (!gameState || gameState.gameOver) {
      stopFallTimer();
      return;
    }
    if (gameState.clearLinesPending && gameState.clearLinesPending.length > 0) return;
    if (gameState.postClearGravityState) return;
    gameState = tick(gameState);
    var prevHigh = Number(getStorage(STORAGE_HIGH_SCORE_BLOCKS)) || 0;
    if (gameState.highScore > prevHigh) setStorage(STORAGE_HIGH_SCORE_BLOCKS, String(gameState.highScore));
    commitState(gameState);
    startClearLinesAnimationIfPending();
  }, ms);
}

function startClearLinesAnimationIfPending() {
  if (!gameState || !gameState.clearLinesPending || gameState.clearLinesPending.length === 0) {
    if (gameState && !gameState.postClearGravityState) startFallTimer();
    return;
  }
  stopFallTimer();
  if (clearLinesTimeout) clearTimeout(clearLinesTimeout);
  clearLinesTimeout = setTimeout(function () {
    clearLinesTimeout = null;
    gameState = applyPendingClearLines(gameState);
    commitState(gameState);
    if (gameState.clearLinesPending && gameState.clearLinesPending.length > 0) {
      startClearLinesAnimationIfPending();
      return;
    }
    if (gameState.postClearGravityState) {
      clearLinesTimeout = setTimeout(function () {
        clearLinesTimeout = null;
        gameState = applyPendingClearLines(gameState);
        commitState(gameState);
        if (gameState.clearLinesPending && gameState.clearLinesPending.length > 0) {
          startClearLinesAnimationIfPending();
          return;
        }
        startFallTimer();
      }, 300);
      return;
    }
    startFallTimer();
  }, 400);
}

function gestureDirection(dx, dy) {
  var ax = Math.abs(dx);
  var ay = Math.abs(dy);
  if (Math.max(ax, ay) < MIN_SWIPE_PX) return null;
  if (ax >= ay) return dx > 0 ? 'right' : 'left';
  if (dy > LONG_SWIPE_DOWN_PX) return 'hardDown';
  if (dy > MIN_SWIPE_PX) return 'down';
  if (dy < -MIN_SWIPE_PX) return 'rotate';
  return null;
}

function handleAction(action) {
  if (!gameState || gameState.gameOver) return;
  if (gameState.overlayVisible) return;
  if (gameState.clearLinesPending && gameState.clearLinesPending.length > 0) return;
  if (gameState.postClearGravityState) return;
  if (action === 'left') {
    gameState = moveLeft(gameState);
  } else if (action === 'right') {
    gameState = moveRight(gameState);
  } else if (action === 'down') {
    gameState = tick(gameState);
    var prevHigh = Number(getStorage(STORAGE_HIGH_SCORE_BLOCKS)) || 0;
    if (gameState.highScore > prevHigh) setStorage(STORAGE_HIGH_SCORE_BLOCKS, String(gameState.highScore));
  } else if (action === 'hardDown') {
    try {
      gameState = runUntilFirstLock(gameState);
      var prevHigh = Number(getStorage(STORAGE_HIGH_SCORE_BLOCKS)) || 0;
      if (gameState.highScore > prevHigh) setStorage(STORAGE_HIGH_SCORE_BLOCKS, String(gameState.highScore));
    } catch (e) {}
  } else if (action === 'rotate') {
    gameState = rotate(gameState);
  }
  commitState(gameState);
  startClearLinesAnimationIfPending();
}

function handleRestart() {
  stopFallTimer();
  if (clearLinesTimeout) {
    clearTimeout(clearLinesTimeout);
    clearLinesTimeout = null;
  }
  if (!gameState) return;
  paused = false;
  var opts = {
    rows: gameState.rows,
    cols: gameState.cols,
    fallIntervalMs: gameState.fallIntervalMs,
  };
  var highScore = Number(getStorage(STORAGE_HIGH_SCORE_BLOCKS)) || 0;
  gameState = init(highScore, opts);
  commitState(gameState);
  startFallTimer();
  if (view && view.setPaused) view.setPaused(paused);
  focusMapArea();
}

function loadSettingsFromStorage() {
  try {
    var raw = getStorage(STORAGE_SETTINGS_BLOCKS);
    if (!raw) return null;
    var o = JSON.parse(raw);
    if (!o || typeof o !== 'object') return null;
    var s = {};
    if (Number(o.rows) >= 8) s.rows = Number(o.rows);
    if (Number(o.cols) >= 6) s.cols = Number(o.cols);
    if (Number(o.fallIntervalMs) >= 100) s.fallIntervalMs = Number(o.fallIntervalMs);
    return Object.keys(s).length ? s : null;
  } catch (e) { return null; }
}

function applyBoardSettings(obj) {
  if (!obj) return;
  var rows = obj.rows != null ? obj.rows : (obj.boardHeight != null ? obj.boardHeight : (gameState && gameState.rows));
  var cols = obj.cols != null ? obj.cols : (obj.boardWidth != null ? obj.boardWidth : (gameState && gameState.cols));
  var fallIntervalMs = obj.fallIntervalMs != null ? obj.fallIntervalMs : (gameState && gameState.fallIntervalMs);
  var needRestart = !gameState || (rows !== gameState.rows) || (cols !== gameState.cols);
  if (needRestart) {
    stopFallTimer();
    if (clearLinesTimeout) { clearTimeout(clearLinesTimeout); clearLinesTimeout = null; }
    paused = false;
    var highScore = Number(getStorage(STORAGE_HIGH_SCORE_BLOCKS)) || 0;
    gameState = init(highScore, { rows: rows, cols: cols, fallIntervalMs: fallIntervalMs });
  } else {
    gameState = Object.assign({}, gameState, { fallIntervalMs: fallIntervalMs });
    if (!paused) startFallTimer();
  }
  try {
    setStorage(STORAGE_SETTINGS_BLOCKS, JSON.stringify({ rows: rows, cols: cols, fallIntervalMs: fallIntervalMs }));
  } catch (e) {}
  if (view && view.syncToolbarSettings) view.syncToolbarSettings();
  commitState(gameState);
  if (!paused) focusMapArea();
}

function getBoardSettings() {
  if (!gameState) return null;
  return {
    rows: gameState.rows,
    cols: gameState.cols,
    boardHeight: gameState.rows,
    boardWidth: gameState.cols,
    fallIntervalMs: gameState.fallIntervalMs,
  };
}

function focusMapArea() {
  var el = document.querySelector('.main.map.area');
  if (el && typeof el.focus === 'function') el.focus();
}

function doInit() {
  var loaded = loadSettingsFromStorage();
  var restored = null;
  try {
    var stateRaw = getStorage(STORAGE_GAME_STATE_BLOCKS);
    if (stateRaw) restored = deserializeGameState(JSON.parse(stateRaw));
  } catch (e) {}
  var useRestored = restored && !restored.gameOver && restored.currentPiece != null;
  if (useRestored) {
    gameState = restored;
    var storedHigh = Number(getStorage(STORAGE_HIGH_SCORE_BLOCKS)) || 0;
    if (gameState.highScore > storedHigh) setStorage(STORAGE_HIGH_SCORE_BLOCKS, String(gameState.highScore));
  } else {
    var rows = (loaded && loaded.rows) || (restored && restored.rows) || 12;
    var cols = (loaded && loaded.cols) || (restored && restored.cols) || 8;
    var fallIntervalMs = (loaded && loaded.fallIntervalMs) != null ? loaded.fallIntervalMs : ((restored && restored.fallIntervalMs) != null ? restored.fallIntervalMs : 500);
    var highScore = Number(getStorage(STORAGE_HIGH_SCORE_BLOCKS)) || 0;
    gameState = init(highScore, { rows: rows, cols: cols, fallIntervalMs: fallIntervalMs });
  }
  commitState(gameState);
  if (view && view.syncToolbarSettings) view.syncToolbarSettings();
  if (view && view.setPaused) view.setPaused(paused);
}

function saveState() {
  if (!gameState) return;
  if (!gameState.gameOver) {
    try {
      setStorage(STORAGE_GAME_STATE_BLOCKS, JSON.stringify(serializeGameState(gameState)));
    } catch (e) {}
  } else {
    try { localStorage.removeItem(STORAGE_GAME_STATE_BLOCKS); } catch (e) {}
  }
}

function initBridge(bridge) {
  view = bridge && typeof bridge === 'object' ? bridge : null;
  doInit();
}

function getPaused() { return paused; }
function togglePause() {
  paused = !paused;
  if (paused) {
    stopFallTimer();
  } else {
    startFallTimer();
    focusMapArea();
  }
  if (view && view.setPaused) view.setPaused(paused);
}

function getTileDisplayContent(state, value) {
  if (value <= 0) return { type: 'number', value: value };
  return { type: 'number', value: value };
}

var stub = {
  init: function () {},
  getState: function () { return null; },
  getPaused: function () { return true; },
  togglePause: function () {},
  applyBoardSettings: function () {},
  getBoardSettings: function () { return null; },
  getTileDisplayContent: function (_, value) { return { type: 'number', value: value != null ? value : 0 }; },
  onResultRestart: function () {},
  onGesture: function () {},
};

(function () {
  if (typeof window === 'undefined') {
    window.Game2048Blocks = stub;
    return;
  }
  logic = window.Game2048BlocksLogic;
  constants = window.Game2048BlocksConstants;
  if (!logic || !constants) {
    console.error('请先加载 logic.js 和 constants.js');
    window.Game2048Blocks = stub;
    return;
  }
  init = logic.init;
  tick = logic.tick;
  moveLeft = logic.moveLeft;
  moveRight = logic.moveRight;
  rotate = logic.rotate;
  runUntilFirstLock = logic.runUntilFirstLock;
  applyPendingClearLines = logic.applyPendingClearLines;
  pieceAbsCells = logic.pieceAbsCells;
  serializeGameState = logic.serializeGameState;
  deserializeGameState = logic.deserializeGameState;
  STORAGE_HIGH_SCORE_BLOCKS = logic.STORAGE_HIGH_SCORE_BLOCKS;
  STORAGE_SETTINGS_BLOCKS = logic.STORAGE_SETTINGS_BLOCKS;
  STORAGE_GAME_STATE_BLOCKS = logic.STORAGE_GAME_STATE_BLOCKS;
  MIN_SWIPE_PX = constants.MIN_SWIPE_PX || 30;

  document.addEventListener('keydown', function (e) {
    if (gameState && gameState.overlayVisible) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleRestart();
      }
      return;
    }
    if (e.key === ' ') {
      var active = document.activeElement;
      var isEditable = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT' || (active.isContentEditable && active.isContentEditable === 'true'));
      if (!isEditable) {
        e.preventDefault();
        togglePause();
        return;
      }
    }
    if (!window.GameKeysArea || !window.GameKeysArea.shouldHandle(e)) return;
    var action = null;
    if (e.key === 'ArrowLeft') action = 'left';
    else if (e.key === 'ArrowRight') action = 'right';
    else if (e.key === 'ArrowDown') action = 'down';
    else if (e.key === 'ArrowUp') action = 'rotate';
    if (action) {
      e.preventDefault();
      handleAction(action);
    }
  });

  window.addEventListener('beforeunload', function () {
    saveState();
    stopFallTimer();
    if (clearLinesTimeout) clearTimeout(clearLinesTimeout);
  });

  window.Game2048Blocks = {
    init: initBridge,
    getState: function () { return gameState; },
    getPaused: getPaused,
    togglePause: togglePause,
    applyBoardSettings: applyBoardSettings,
    getBoardSettings: getBoardSettings,
    getTileDisplayContent: getTileDisplayContent,
    onResultRestart: handleRestart,
    onGesture: function (dx, dy) {
      if (!gameState) return;
      if (gameState.overlayVisible) {
        handleRestart();
        return;
      }
      var action = gestureDirection(dx, dy);
      if (action) handleAction(action);
    },
    handleAction: handleAction,
  };
})();

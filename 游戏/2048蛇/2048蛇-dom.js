/**
 * 2048蛇 - DOM 与键盘/手势/定时器。依赖 logic.js、constants.js。
 * 与 test1 2048snake 一致：改方向 + 定时 tick 移动。
 * 在脚本末尾才读取 window.Game2048SnakeLogic / Constants，确保前序脚本已执行。
 */
'use strict';

var logic, constants;
var init, tick, setDirection, canSetDirection, getDisplayBoard, restart;
var serializeGameState, deserializeGameState, getHighScoreKey;
var STORAGE_GAME_STATE, STORAGE_SETTINGS;
var MIN_SWIPE_PX = 30;

var view = null;

function getTileDisplayContent(state, value) {
  if (value <= 0) return { type: 'number', value: value };
  return { type: 'number', value: value };
}

function getStorage(key) {
  try { return localStorage.getItem(key); } catch (e) { return null; }
}
function setStorage(key, value) {
  try { localStorage.setItem(key, value); } catch (e) {}
}

var gameState = null;
var turnTimer = null;
var paused = true;

function gestureDirection(dx, dy) {
  var ax = Math.abs(dx);
  var ay = Math.abs(dy);
  if (Math.max(ax, ay) < MIN_SWIPE_PX) return null;
  return ax >= ay ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
}

function commitState(state) {
  if (!state || !view || !view.commitState) return;
  var disp = getDisplayBoard(state);
  var rows = state.rows;
  var cols = state.cols;
  var gameStateForView = Object.assign({}, state, {
    board: disp.board,
    headRow: disp.headRow,
    headCol: disp.headCol,
    boardWidth: cols,
    boardHeight: rows,
  });
  view.setBoardView(disp.board, rows, cols, gameStateForView);
  view.updateScores(state.score, state.highScore, cols, rows);
  view.setGameResult(
    !!(state.overlayVisible && state.overlayMessage),
    state.overlayMessage || '',
    state.gameOver ? '最终得分：' + state.score : '',
    !!state.gameWin
  );
  view.commitState(gameStateForView);
}

function stopTurnTimer() {
  if (turnTimer) {
    clearInterval(turnTimer);
    turnTimer = null;
  }
}

function startTurnTimer() {
  stopTurnTimer();
  if (paused || !gameState || gameState.gameOver || gameState.gameWin) return;
  var ms = Math.max(50, gameState.turnIntervalMs || 400);
  turnTimer = setInterval(function () {
    if (!gameState || gameState.gameOver || gameState.gameWin) {
      stopTurnTimer();
      return;
    }
    gameState = tick(gameState);
    var highKey = getHighScoreKey(gameState.rows, gameState.cols);
    var prevHigh = Number(getStorage(highKey)) || 0;
    if (gameState.highScore > prevHigh) setStorage(highKey, String(gameState.highScore));
    commitState(gameState);
    if (gameState.gameOver || gameState.gameWin) stopTurnTimer();
  }, ms);
}

function focusMapArea() {
  var el = document.querySelector('.main.map.area');
  if (el && typeof el.focus === 'function') el.focus();
}

function handleDirection(newDir) {
  if (!gameState || gameState.gameOver || gameState.gameWin) return;
  if (gameState.overlayVisible && gameState.gameWin) {
    gameState = Object.assign({}, gameState, { gameWin: false, overlayVisible: false, overlayMessage: '' });
  }
  if (!canSetDirection(gameState, newDir)) return;
  gameState = setDirection(gameState, newDir);
  commitState(gameState);
}

function handleRestart() {
  stopTurnTimer();
  if (!gameState) return;
  paused = false;
  gameState = restart(gameState);
  commitState(gameState);
  startTurnTimer();
  focusMapArea();
  if (view && view.setPaused) view.setPaused(paused);
}

function loadSettingsFromStorage() {
  try {
    var raw = getStorage(STORAGE_SETTINGS);
    if (!raw) return null;
    var o = JSON.parse(raw);
    if (!o || typeof o !== 'object') return null;
    var s = {};
    if (Number(o.rows) >= 6) s.rows = Number(o.rows);
    if (Number(o.cols) >= 6) s.cols = Number(o.cols);
    if (o.targetNumber !== undefined) s.targetNumber = (o.targetNumber == null || o.targetNumber === 'Infinity' || o.targetNumber === 'null') ? null : Number(o.targetNumber);
    if (Number(o.turnIntervalMs) >= 50) s.turnIntervalMs = Number(o.turnIntervalMs);
    if (Number(o.initialLength) >= 1) s.initialLength = Number(o.initialLength);
    if (Number(o.foodCount) >= 1) s.foodCount = Number(o.foodCount);
    return Object.keys(s).length ? s : null;
  } catch (e) { return null; }
}

function applyBoardSettings(obj) {
  if (!gameState || !obj) return;
  var rows = obj.rows != null ? obj.rows : (obj.boardHeight != null ? obj.boardHeight : gameState.rows);
  var cols = obj.cols != null ? obj.cols : (obj.boardWidth != null ? obj.boardWidth : gameState.cols);
  var needRestart = (rows !== gameState.rows) ||
    (cols !== gameState.cols) ||
    (obj.initialLength != null && obj.initialLength !== gameState.initialLength) ||
    (obj.foodCount != null && obj.foodCount !== gameState.foodCount) ||
    (obj.targetNumber !== undefined && obj.targetNumber !== gameState.targetNumber);
  var opts = {
    rows: rows,
    cols: cols,
    initialLength: obj.initialLength != null ? obj.initialLength : gameState.initialLength,
    foodCount: obj.foodCount != null ? obj.foodCount : gameState.foodCount,
    targetNumber: obj.targetNumber !== undefined ? obj.targetNumber : gameState.targetNumber,
    turnIntervalMs: obj.turnIntervalMs != null ? obj.turnIntervalMs : gameState.turnIntervalMs,
  };
  if (needRestart) {
    stopTurnTimer();
    paused = false;
    var highScore = Number(getStorage(getHighScoreKey(opts.rows, opts.cols))) || 0;
    gameState = init(highScore, opts);
    if (view && view.setPaused) view.setPaused(paused);
  } else {
    gameState = Object.assign({}, gameState, {
      turnIntervalMs: opts.turnIntervalMs != null ? opts.turnIntervalMs : gameState.turnIntervalMs,
      targetNumber: opts.targetNumber != null ? opts.targetNumber : gameState.targetNumber,
      foodCount: opts.foodCount != null ? opts.foodCount : gameState.foodCount,
    });
    if (opts.turnIntervalMs != null && !paused) startTurnTimer();
  }
  if (view && view.syncToolbarSettings) view.syncToolbarSettings();
  commitState(gameState);
  if (!paused) {
    startTurnTimer();
    focusMapArea();
  }
}

function getBoardSettings() {
  if (!gameState) return null;
  return {
    rows: gameState.rows,
    cols: gameState.cols,
    boardHeight: gameState.rows,
    boardWidth: gameState.cols,
    targetNumber: gameState.targetNumber,
    turnIntervalMs: gameState.turnIntervalMs,
    initialLength: gameState.initialLength,
    foodCount: gameState.foodCount,
  };
}

function doInit() {
  var loaded = loadSettingsFromStorage();
  var restored = null;
  try {
    var stateRaw = getStorage(STORAGE_GAME_STATE);
    if (stateRaw) restored = deserializeGameState(JSON.parse(stateRaw));
  } catch (e) {}
  var useRestored = restored && !restored.gameOver && !restored.gameWin &&
    Array.isArray(restored.segments) && restored.segments.length > 0;
  if (useRestored) {
    gameState = restored;
    var keyRestored = getHighScoreKey(gameState.rows, gameState.cols);
    var storedRestored = Number(getStorage(keyRestored)) || 0;
    if (gameState.highScore > storedRestored) setStorage(keyRestored, String(gameState.highScore));
  } else {
    var rows = (loaded && loaded.rows) || 8;
    var cols = (loaded && loaded.cols) || 8;
    var highScore = Number(getStorage(getHighScoreKey(rows, cols))) || 0;
    gameState = init(highScore, loaded || undefined);
  }
  commitState(gameState);
  if (view && view.syncToolbarSettings) view.syncToolbarSettings();
  if (view && view.setPaused) view.setPaused(paused);
}

function saveState() {
  if (!gameState) return;
  if (!gameState.gameOver && !gameState.gameWin) {
    setStorage(STORAGE_GAME_STATE, JSON.stringify(serializeGameState(gameState)));
  } else {
    try { localStorage.removeItem(STORAGE_GAME_STATE); } catch (e) {}
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
    stopTurnTimer();
  } else {
    startTurnTimer();
    focusMapArea();
  }
  if (view && view.setPaused) view.setPaused(paused);
}

var stub = {
  init: function () {},
  getState: function () { return null; },
  getPaused: function () { return true; },
  togglePause: function () {},
  setDirection: function () {},
  onGesture: function () {},
  applyBoardSettings: function () {},
  getBoardSettings: function () { return null; },
  getTileDisplayContent: function (_, value) { return { type: 'number', value: value ?? 0 }; },
  onResultRestart: function () {},
};

(function () {
  if (typeof window === 'undefined') {
    window.Game2048Snake = stub;
    return;
  }
  logic = window.Game2048SnakeLogic;
  constants = window.Game2048SnakeConstants;
  if (!logic || !constants) {
    console.error('请先加载 logic.js 和 constants.js');
    window.Game2048Snake = stub;
    return;
  }
  init = logic.init;
  tick = logic.tick;
  setDirection = logic.setDirection;
  canSetDirection = logic.canSetDirection;
  getDisplayBoard = logic.getDisplayBoard;
  restart = logic.restart;
  serializeGameState = logic.serializeGameState;
  deserializeGameState = logic.deserializeGameState;
  getHighScoreKey = logic.getHighScoreKey;
  STORAGE_GAME_STATE = logic.STORAGE_GAME_STATE;
  STORAGE_SETTINGS = logic.STORAGE_SETTINGS;
  MIN_SWIPE_PX = constants.MIN_SWIPE_PX;

  function tryPauseOnClickOutside(e) {
    if (paused) return;
    if (!gameState || gameState.gameOver || gameState.gameWin) return;
    var mapArea = document.querySelector('.main.map.area');
    if (!mapArea || !e.target) return;
    if (mapArea.contains(e.target)) return;
    paused = true;
    stopTurnTimer();
    if (view && view.setPaused) view.setPaused(paused);
  }
  document.addEventListener('mousedown', tryPauseOnClickOutside);
  document.addEventListener('touchstart', tryPauseOnClickOutside, { passive: true });

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
    var direction = null;
    if (e.key === 'ArrowLeft') direction = 'left';
    else if (e.key === 'ArrowRight') direction = 'right';
    else if (e.key === 'ArrowUp') direction = 'up';
    else if (e.key === 'ArrowDown') direction = 'down';
    if (direction) {
      e.preventDefault();
      handleDirection(direction);
    }
  });
  window.addEventListener('beforeunload', function () {
    saveState();
    stopTurnTimer();
  });

  window.Game2048Snake = {
    init: initBridge,
    getState: function () { return gameState; },
    getPaused: getPaused,
    togglePause: togglePause,
    setDirection: handleDirection,
    onGesture: function (dx, dy) {
      if (!gameState) return;
      if (gameState.overlayVisible) {
        handleRestart();
        return;
      }
      var dir = gestureDirection(dx, dy);
      if (dir) handleDirection(dir);
    },
    applyBoardSettings: applyBoardSettings,
    getBoardSettings: getBoardSettings,
    getTileDisplayContent: getTileDisplayContent,
    onResultRestart: handleRestart,
  };
})();

/**
 * 2048方块 - DOM 与键盘/手势/定时器。依赖 logic.js、constants.js。
 * 与 test1 2048blocks 一致：下落定时 tick，左右下旋转由按键/手势控制。
 */
'use strict';

let logic, constants;
let init, tick, moveLeft, moveRight, rotate, runUntilFirstLock, applyPendingClearLines, pieceAbsCells;
let serializeGameState, deserializeGameState;
let STORAGE_HIGH_SCORE_BLOCKS, STORAGE_SETTINGS_BLOCKS, STORAGE_GAME_STATE_BLOCKS;
let MIN_SWIPE_PX = 30;
const SWIPE_PX_PER_CELL = 40;
const LONG_SWIPE_DOWN_PX = 80;

let view = null;
let gameState = null;
let fallTimer = null;
let hardDropTimer = null;
let clearLinesTimeout = null;
let cascadeStepTimeout = null;
let paused = true;
const CASCADE_STEP_MS = 180;

/** 与 runFallLoop 一致的下落步长（含 DEV_FIXED_FALL_MS） */
function getFallStepMs(state) {
	const s = state || gameState;
	return (constants && constants.DEV_FIXED_FALL_MS > 0)
		? constants.DEV_FIXED_FALL_MS
		: Math.max(100, (s && s.fallIntervalMs) || 500);
}

function getStorage(key) {
	try { return localStorage.getItem(key); } catch (e) { return null; }
}

function setStorage(key, value) {
	try { localStorage.setItem(key, value); } catch (e) {}
}

/** 合并 board + 消行剩格 + currentPiece 为显示用的一维数组 (row-major)，空为 0；剩格与活动块后绘覆盖底图 */
function getDisplayBoard(state) {
	const rows = state.rows;
	const cols = state.cols;
	const board = state.board;
	const total = rows * cols;
	const flat = [];
	for (let r = 0; r < rows; r++) {
		for (let c = 0; c < cols; c++) {
			flat.push(board[r][c] || 0);
		}
	}
	const rem = state.lineClearRemainderCells;
	if (rem && rem.length > 0) {
		for (let ri = 0; ri < rem.length; ri++) {
			const cell = rem[ri];
			if (cell.r >= 0 && cell.r < rows && cell.c >= 0 && cell.c < cols) {
				flat[cell.r * cols + cell.c] = cell.v;
			}
		}
	}
	const piece = state.currentPiece;
	if (piece && !state.gameOver) {
		const abs = pieceAbsCells(piece);
		for (let i = 0; i < abs.length; i++) {
			const cell = abs[i];
			if (cell.r >= 0 && cell.r < rows && cell.c >= 0 && cell.c < cols) {
				flat[cell.r * cols + cell.c] = cell.value;
			}
		}
	}
	return flat;
}

function commitState(state) {
	if (!state || !view || !view.commitState) {
		return;
	}
	const disp = getDisplayBoard(state);
	const rows = state.rows;
	const cols = state.cols;
	const gameStateForView = Object.assign({}, state, {
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
		false,
	);
	view.commitState(gameStateForView);
}

function stopHardDropTimer() {
	if (hardDropTimer) {
		clearTimeout(hardDropTimer);
		hardDropTimer = null;
	}
}

function stopFallTimer() {
	if (fallTimer) {
		clearTimeout(fallTimer);
		fallTimer = null;
	}
	stopHardDropTimer();
}

/** 硬降：与自动下落同一间隔，每步 tick 一行，直到锁定或进入消行等状态 */
function runHardDropStep() {
	hardDropTimer = null;
	if (paused || !gameState || gameState.gameOver) {
		scheduleNext();
		return;
	}
	if (gameState.clearLinesPending && gameState.clearLinesPending.length > 0) {
		scheduleNext();
		return;
	}
	if (gameState.postClearGravityState) {
		scheduleNext();
		return;
	}
	if (gameState.cascadePending) {
		scheduleNext();
		return;
	}
	if (!gameState.currentPiece) {
		scheduleNext();
		return;
	}
	gameState = tick(gameState);
	const prevHigh = Number(getStorage(STORAGE_HIGH_SCORE_BLOCKS)) || 0;
	if (gameState.highScore > prevHigh) {
		setStorage(STORAGE_HIGH_SCORE_BLOCKS, String(gameState.highScore));
	}
	commitState(gameState);
	const stillPiece = gameState.currentPiece != null && !gameState.gameOver;
	const blocked = (gameState.clearLinesPending && gameState.clearLinesPending.length > 0)
		|| gameState.postClearGravityState
		|| gameState.cascadePending;
	if (stillPiece && !blocked) {
		hardDropTimer = setTimeout(runHardDropStep, getFallStepMs(gameState));
	} else {
		scheduleNext();
	}
}

function stopCascadeStepTimer() {
	if (cascadeStepTimeout) {
		clearTimeout(cascadeStepTimeout);
		cascadeStepTimeout = null;
	}
}

function stopClearLinesTimer() {
	if (clearLinesTimeout) {
		clearTimeout(clearLinesTimeout);
		clearLinesTimeout = null;
	}
}

/** 唯一调度入口：根据当前 gameState 决定下一步（下落 / cascade / 消行动画）。每次状态变化后都调此函数。 */
function scheduleNext() {
	stopFallTimer();
	stopCascadeStepTimer();
	stopClearLinesTimer();

	if (paused || !gameState || gameState.gameOver) {
		return;
	}
	if (gameState.clearLinesPending && gameState.clearLinesPending.length > 0) {
		runClearLinesAnimation();
		return;
	}
	if (gameState.postClearGravityState) {
		runPostClearGravityStep();
		return;
	}
	if (gameState.cascadePending) {
		runCascadeStep();
		return;
	}
	runFallLoop();
}

function runFallLoop() {
	if (paused || !gameState || gameState.gameOver) {
		return;
	}
	if (gameState.clearLinesPending && gameState.clearLinesPending.length > 0) {
		scheduleNext();
		return;
	}
	if (gameState.postClearGravityState) {
		scheduleNext();
		return;
	}
	if (gameState.cascadePending) {
		scheduleNext();
		return;
	}
	const ms = getFallStepMs(gameState);
	fallTimer = setTimeout(function() {
		fallTimer = null;
		if (!gameState || gameState.gameOver) {
			return;
		}
		if (gameState.clearLinesPending && gameState.clearLinesPending.length > 0) {
			scheduleNext();
			return;
		}
		if (gameState.postClearGravityState) {
			scheduleNext();
			return;
		}
		if (gameState.cascadePending) {
			commitState(gameState);
			scheduleNext();
			return;
		}
		gameState = tick(gameState);
		const prevHigh = Number(getStorage(STORAGE_HIGH_SCORE_BLOCKS)) || 0;
		if (gameState.highScore > prevHigh) {
			setStorage(STORAGE_HIGH_SCORE_BLOCKS, String(gameState.highScore));
		}
		commitState(gameState);
		scheduleNext();
	}, ms);
}

function runCascadeStep() {
	if (paused || !gameState || gameState.gameOver) {
		return;
	}
	if (!gameState.cascadePending) {
		scheduleNext();
		return;
	}
	cascadeStepTimeout = setTimeout(function() {
		cascadeStepTimeout = null;
		if (!gameState || gameState.gameOver) {
			scheduleNext();
			return;
		}
		if (!gameState.cascadePending) {
			scheduleNext();
			return;
		}
		gameState = tick(gameState);
		const prevHigh = Number(getStorage(STORAGE_HIGH_SCORE_BLOCKS)) || 0;
		if (gameState.highScore > prevHigh) {
			setStorage(STORAGE_HIGH_SCORE_BLOCKS, String(gameState.highScore));
		}
		commitState(gameState);
		scheduleNext();
	}, CASCADE_STEP_MS);
}

function runClearLinesAnimation() {
	stopFallTimer();
	clearLinesTimeout = setTimeout(function() {
		clearLinesTimeout = null;
		gameState = applyPendingClearLines(gameState, {steppedLineClearRemainder: true});
		commitState(gameState);
		scheduleNext();
	}, 400);
}

function runPostClearGravityStep() {
	const ms = getFallStepMs(gameState);
	clearLinesTimeout = setTimeout(function() {
		clearLinesTimeout = null;
		gameState = applyPendingClearLines(gameState);
		commitState(gameState);
		scheduleNext();
	}, ms);
}

function startFallTimer() {
	scheduleNext();
}

function startClearLinesAnimationIfPending() {
	scheduleNext();
}

function gestureDirection(dx, dy) {
	const ax = Math.abs(dx);
	const ay = Math.abs(dy);
	if (Math.max(ax, ay) < MIN_SWIPE_PX) {
		return null;
	}
	if (ax >= ay) {
		return dx > 0 ? 'right' : 'left';
	}
	if (dy > LONG_SWIPE_DOWN_PX) {
		return 'hardDown';
	}
	if (dy > MIN_SWIPE_PX) {
		return 'down';
	}
	if (dy < -MIN_SWIPE_PX) {
		return 'rotate';
	}
	return null;
}

function handleAction(action) {
	if (!gameState || gameState.gameOver) {
		return;
	}
	if (gameState.overlayVisible) {
		return;
	}
	if (gameState.clearLinesPending && gameState.clearLinesPending.length > 0) {
		return;
	}
	if (gameState.postClearGravityState) {
		return;
	}
	const remainderPhase = gameState.lineClearRemainderCells && gameState.lineClearRemainderCells.length > 0;
	if (remainderPhase && action !== 'down') {
		return;
	}
	if (action === 'left') {
		gameState = moveLeft(gameState);
	} else if (action === 'right') {
		gameState = moveRight(gameState);
	} else if (action === 'down') {
		gameState = tick(gameState);
		const prevHigh = Number(getStorage(STORAGE_HIGH_SCORE_BLOCKS)) || 0;
		if (gameState.highScore > prevHigh) {
			setStorage(STORAGE_HIGH_SCORE_BLOCKS, String(gameState.highScore));
		}
	} else if (action === 'hardDown') {
		stopFallTimer();
		stopHardDropTimer();
		runHardDropStep();
		return;
	} else if (action === 'rotate') {
		gameState = rotate(gameState);
	}
	commitState(gameState);
	startClearLinesAnimationIfPending();
}

function handleRestart() {
	stopFallTimer();
	stopCascadeStepTimer();
	if (clearLinesTimeout) {
		clearTimeout(clearLinesTimeout);
		clearLinesTimeout = null;
	}
	if (!gameState) {
		return;
	}
	paused = false;
	const opts = {
		rows: gameState.rows,
		cols: gameState.cols,
		fallIntervalMs: gameState.fallIntervalMs,
		lineClearPolicy: gameState.lineClearPolicy,
	};
	const highScore = Number(getStorage(STORAGE_HIGH_SCORE_BLOCKS)) || 0;
	gameState = init(highScore, opts);
	commitState(gameState);
	startFallTimer();
	if (view && view.setPaused) {
		view.setPaused(paused);
	}
	focusMapArea();
}

function loadSettingsFromStorage() {
	try {
		const raw = getStorage(STORAGE_SETTINGS_BLOCKS);
		if (!raw) {
			return null;
		}
		const o = JSON.parse(raw);
		if (!o || typeof o !== 'object') {
			return null;
		}
		const s = {};
		if (Number(o.rows) >= 8) {
			s.rows = Number(o.rows);
		}
		if (Number(o.cols) >= 6) {
			s.cols = Number(o.cols);
		}
		if (Number(o.fallIntervalMs) >= 100) {
			s.fallIntervalMs = Number(o.fallIntervalMs);
		}
		if (o.lineClearPolicy && typeof o.lineClearPolicy === 'object') {
			s.lineClearPolicy = logic.normalizeLineClearPolicy(o.lineClearPolicy);
		}
		return Object.keys(s).length ? s : null;
	} catch (e) { return null; }
}

function applyBoardSettings(obj) {
	if (!obj) {
		return;
	}
	const rows = obj.rows != null ? obj.rows : (obj.boardHeight != null ? obj.boardHeight : gameState && gameState.rows);
	const cols = obj.cols != null ? obj.cols : (obj.boardWidth != null ? obj.boardWidth : gameState && gameState.cols);
	const rawFall = obj.fallIntervalMs != null ? obj.fallIntervalMs : gameState && gameState.fallIntervalMs;
	const fallIntervalMs = (constants && constants.DEV_FIXED_FALL_MS > 0)
		? constants.DEV_FIXED_FALL_MS
		: rawFall;
	const needRestart = !gameState || rows !== gameState.rows || cols !== gameState.cols;
	const lineClearPolicy = logic.normalizeLineClearPolicy(
		obj.lineClearPolicy != null ? obj.lineClearPolicy : (gameState && gameState.lineClearPolicy),
	);
	if (needRestart) {
		stopFallTimer();
		if (clearLinesTimeout) {
			clearTimeout(clearLinesTimeout);
			clearLinesTimeout = null;
		}
		paused = false;
		const highScore = Number(getStorage(STORAGE_HIGH_SCORE_BLOCKS)) || 0;
		gameState = init(highScore, {rows: rows, cols: cols, fallIntervalMs: fallIntervalMs, lineClearPolicy: lineClearPolicy});
	} else {
		gameState = Object.assign({}, gameState, {fallIntervalMs: fallIntervalMs, lineClearPolicy: lineClearPolicy});
		if (!paused) {
			startFallTimer();
		}
	}
	try {
		setStorage(STORAGE_SETTINGS_BLOCKS, JSON.stringify({
			rows: rows, cols: cols, fallIntervalMs: fallIntervalMs,
			lineClearPolicy: gameState.lineClearPolicy,
		}));
	} catch (e) {}
	if (view && view.syncToolbarSettings) {
		view.syncToolbarSettings();
	}
	commitState(gameState);
	if (!paused) {
		focusMapArea();
	}
}

function getBoardSettings() {
	if (!gameState) {
		return null;
	}
	return {
		rows: gameState.rows,
		cols: gameState.cols,
		boardHeight: gameState.rows,
		boardWidth: gameState.cols,
		fallIntervalMs: gameState.fallIntervalMs,
		lineClearPolicy: gameState.lineClearPolicy,
	};
}

function getLineClearPolicy() {
	if (!gameState) {
		return logic.getDefaultLineClearPolicy();
	}
	return logic.normalizeLineClearPolicy(gameState.lineClearPolicy);
}

function applyLineClearPolicy(pol) {
	if (!gameState || !pol || typeof pol !== 'object') {
		return;
	}
	gameState = Object.assign({}, gameState, {
		lineClearPolicy: logic.normalizeLineClearPolicy(Object.assign({}, gameState.lineClearPolicy, pol)),
	});
	try {
		const raw = getStorage(STORAGE_SETTINGS_BLOCKS);
		const o = raw ? JSON.parse(raw) : {};
		setStorage(STORAGE_SETTINGS_BLOCKS, JSON.stringify(Object.assign({}, o, {
			rows: gameState.rows,
			cols: gameState.cols,
			fallIntervalMs: gameState.fallIntervalMs,
			lineClearPolicy: gameState.lineClearPolicy,
		})));
	} catch (e) {}
	saveState();
	commitState(gameState);
	if (view && view.syncToolbarSettings) {
		view.syncToolbarSettings();
	}
}

function focusMapArea() {
	const el = document.querySelector('.main.map.area');
	if (el && typeof el.focus === 'function') {
		el.focus();
	}
}

function doInit() {
	const loaded = loadSettingsFromStorage();
	let restored = null;
	try {
		const stateRaw = getStorage(STORAGE_GAME_STATE_BLOCKS);
		if (stateRaw) {
			restored = deserializeGameState(JSON.parse(stateRaw));
		}
	} catch (e) {}
	const useRestored = restored && !restored.gameOver && restored.currentPiece != null;
	if (useRestored) {
		gameState = restored;
		const storedHigh = Number(getStorage(STORAGE_HIGH_SCORE_BLOCKS)) || 0;
		if (gameState.highScore > storedHigh) {
			setStorage(STORAGE_HIGH_SCORE_BLOCKS, String(gameState.highScore));
		}
	} else {
		const rows = loaded && loaded.rows || restored && restored.rows || 12;
		const cols = loaded && loaded.cols || restored && restored.cols || 10;
		const rawFall = (loaded && loaded.fallIntervalMs) != null ? loaded.fallIntervalMs : ((restored && restored.fallIntervalMs) != null ? restored.fallIntervalMs : 500);
		const fallIntervalMs = (constants && constants.DEV_FIXED_FALL_MS > 0) ? constants.DEV_FIXED_FALL_MS : rawFall;
		const highScore = Number(getStorage(STORAGE_HIGH_SCORE_BLOCKS)) || 0;
		const lp = loaded && loaded.lineClearPolicy ? loaded.lineClearPolicy : undefined;
		gameState = init(highScore, {rows: rows, cols: cols, fallIntervalMs: fallIntervalMs, lineClearPolicy: lp});
	}
	gameState = Object.assign({}, gameState, {
		lineClearPolicy: logic.normalizeLineClearPolicy(gameState.lineClearPolicy),
	});
	commitState(gameState);
	if (view && view.syncToolbarSettings) {
		view.syncToolbarSettings();
	}
	if (view && view.setPaused) {
		view.setPaused(paused);
	}
}

function saveState() {
	if (!gameState) {
		return;
	}
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
	if (view && view.setPaused) {
		view.setPaused(paused);
	}
}

function getTileDisplayContent(state, value) {
	if (value <= 0) {
		return {type: 'number', value: value};
	}
	return {type: 'number', value: value};
}

const stub = {
	init: function() {},
	getState: function() { return null; },
	getPaused: function() { return true; },
	togglePause: function() {},
	applyBoardSettings: function() {},
	getBoardSettings: function() { return null; },
	getLineClearPolicy: function() { return {afterClearPack: 'whole', mergeStart: 'contact', mergeRounds: 'untilStable'}; },
	applyLineClearPolicy: function() {},
	getTileDisplayContent: function(_, value) { return {type: 'number', value: value != null ? value : 0}; },
	onResultRestart: function() {},
	onGesture: function() {},
};

(function() {
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

	function tryPauseOnClickOutside(e) {
		if (paused) {
			return;
		}
		if (!gameState || gameState.gameOver) {
			return;
		}
		if (!e.target) {
			return;
		}
		if (e.target.closest && e.target.closest('.one.controller')) {
			return;
		}
		const mapArea = document.querySelector('.main.map.area');
		if (!mapArea || mapArea.contains(e.target)) {
			return;
		}
		paused = true;
		stopFallTimer();
		stopCascadeStepTimer();
		if (view && view.setPaused) {
			view.setPaused(paused);
		}
	}

	document.addEventListener('mousedown', tryPauseOnClickOutside);
	document.addEventListener('touchstart', tryPauseOnClickOutside, {passive: true});

	document.addEventListener('keydown', function(e) {
		if (gameState && gameState.overlayVisible) {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				handleRestart();
			}
			return;
		}
		if (e.key === ' ') {
			const active = document.activeElement;
			const isEditable = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName
																		=== 'SELECT' || active.isContentEditable && active.isContentEditable === 'true');
			if (!isEditable) {
				e.preventDefault();
				togglePause();
				return;
			}
		}
		if (!window.GameKeysArea || !window.GameKeysArea.shouldHandle(e)) {
			return;
		}
		let action = null;
		if (e.key === 'ArrowLeft') {
			action = 'left';
		} else if (e.key === 'ArrowRight') {
			action = 'right';
		} else if (e.key === 'ArrowDown') {
			action = 'down';
		} else if (e.key === 'ArrowUp') {
			action = 'rotate';
		}
		if (action) {
			e.preventDefault();
			handleAction(action);
		}
	});

	window.addEventListener('beforeunload', function() {
		saveState();
		stopFallTimer();
		if (clearLinesTimeout) {
			clearTimeout(clearLinesTimeout);
		}
	});

	window.Game2048Blocks = {
		init: initBridge,
		getState: function() { return gameState; },
		getPaused: getPaused,
		togglePause: togglePause,
		applyBoardSettings: applyBoardSettings,
		getBoardSettings: getBoardSettings,
		getLineClearPolicy: getLineClearPolicy,
		applyLineClearPolicy: applyLineClearPolicy,
		getTileDisplayContent: getTileDisplayContent,
		onResultRestart: handleRestart,
		onGesture: function(dx, dy) {
			if (!gameState) {
				return;
			}
			if (gameState.overlayVisible) {
				handleRestart();
				return;
			}
			const action = gestureDirection(dx, dy);
			if (action) {
				handleAction(action);
			}
		},
		handleAction: handleAction,
	};
})();

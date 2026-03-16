/** 依赖 logic.js、constants.js。ES 模块：export default Game2048，通过 init(bridge) 注入视图接口。 */
'use strict';

const logic = typeof window !== 'undefined' && window.Game2048Logic;
const constants = typeof window !== 'undefined' && window.Game2048Constants;
if (!logic || !constants) {
	console.error('请先加载 logic.js 和 constants.js');
}

const initGame = logic.initGame;
const doMove = logic.doMove;
const restart = logic.restart;
const undo = logic.undo;
const serializeGameState = logic.serializeGameState;
const deserializeGameState = logic.deserializeGameState;
const getHighScoreKey = logic.getHighScoreKey;
const STORAGE_GAME_STATE = logic.STORAGE_GAME_STATE;
const STORAGE_SETTINGS = logic.STORAGE_SETTINGS;

const MIN_SWIPE_PX = constants.MIN_SWIPE_PX;
const getTileImageKeys = constants.getTileImageKeys;

/** 由 Vue 在 init(bridge) 时注入，dom 通过 view.xxx() 更新界面 */
let view = null;

function getTileDisplayContent(state, value) {
	if (value <= 0) {
		return {type: 'number', value: value};
	}
	const key = String(value);
	const img = state.customImages && state.customImages[key];
	if (img && String(img).trim()) {
		return {type: 'image', src: String(img).trim(), value: value};
	}
	const label = state.customLabels && state.customLabels[key];
	if (label != null && String(label).trim() !== '') {
		return {type: 'text', text: String(label).trim(), value: value};
	}
	return {type: 'number', value: value};
}

function getStorage(key) {
	try { return localStorage.getItem(key); } catch (e) { return null; }
}

function setStorage(key, value) {
	try { localStorage.setItem(key, value); } catch (e) {}
}

let gameState = null;
const showSettings = false;
let pendingSettings = {};
let slideAnimationActive = false;

function gestureDirection(dx, dy) {
	const ax = Math.abs(dx);
	const ay = Math.abs(dy);
	if (Math.max(ax, ay) < MIN_SWIPE_PX) {
		return null;
	}
	return ax >= ay ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
}

function runSlideAnimation(slides, finalState, stateBeforeMove, newTileIndex) {
	if (slideAnimationActive || !slides || !slides.length) {
		gameState = finalState;
		if (view && view.commitState) {
			view.commitState(gameState);
		}
		if (view && view.setNewTileIndex) {
			view.setNewTileIndex(newTileIndex);
		}
		return;
	}
	slideAnimationActive = true;
	if (view && view.runSlideAnimation) {
		view.runSlideAnimation(slides, finalState, stateBeforeMove, newTileIndex, function() {
			slideAnimationActive = false;
		});
	} else {
		gameState = finalState;
		if (view && view.commitState) {
			view.commitState(gameState);
		}
		if (view && view.setNewTileIndex) {
			view.setNewTileIndex(newTileIndex);
		}
		slideAnimationActive = false;
	}
}

function clearSlideAnimation() {
	slideAnimationActive = false;
	if (view && view.clearSlideAnimation) {
		view.clearSlideAnimation();
	}
}

function handleMove(direction) {
	if (view && view.clearNewTileIndex) {
		view.clearNewTileIndex();
	}
	if (slideAnimationActive) {
		return;
	}
	if (gameState.gameWin) {
		gameState = Object.assign({}, gameState, {gameWin: false, overlayVisible: false, overlayMessage: ''});
	}
	const stateBeforeMove = gameState;
	const result = doMove(gameState, direction);
	if (!result.moved) {
		if (view && view.commitState) {
			view.commitState(gameState);
		}
		return;
	}
	gameState = result.state;
	const highKey = getHighScoreKey(gameState.boardWidth, gameState.boardHeight);
	const prevHigh = Number(getStorage(highKey)) || 0;
	if (gameState.highScore > prevHigh) {
		setStorage(highKey, String(gameState.highScore));
	}
	if (result.slides && result.slides.length > 0) {
		runSlideAnimation(result.slides, gameState, stateBeforeMove, result.newTileIndex);
	} else {
		if (view && view.commitState) {
			view.commitState(gameState);
		}
		if (view && view.setNewTileIndex) {
			view.setNewTileIndex(result.newTileIndex);
		}
	}
}

function handleRestart() {
	clearSlideAnimation();
	gameState = restart(gameState);
	if (view && view.clearNewTileIndex) {
		view.clearNewTileIndex();
	}
	if (view && view.commitState) {
		view.commitState(gameState);
	}
}

function handleUndo() {
	clearSlideAnimation();
	gameState = undo(gameState);
	if (view && view.clearNewTileIndex) {
		view.clearNewTileIndex();
	}
	if (view && view.commitState) {
		view.commitState(gameState);
	}
}

function loadSettingsFromStorage() {
	try {
		const raw = getStorage(STORAGE_SETTINGS);
		if (!raw) {
			return null;
		}
		const o = JSON.parse(raw);
		if (!o || typeof o !== 'object') {
			return null;
		}
		const s = {};
		if (Number(o.boardWidth) >= 2) {
			s.boardWidth = Number(o.boardWidth);
		}
		if (Number(o.boardHeight) >= 2) {
			s.boardHeight = Number(o.boardHeight);
		}
		if (o.targetNumber !== undefined) {
			s.targetNumber = o.targetNumber == null || o.targetNumber === 'Infinity'
												|| o.targetNumber === 'null' ? null : Number(o.targetNumber);
		}
		s.initialTiles = 2;
		if (typeof o.showNewTileMarker === 'boolean') {
			s.showNewTileMarker = o.showNewTileMarker;
		} else if (typeof o.showHighlight === 'boolean') {
			s.showNewTileMarker = o.showHighlight;
		}
		if (typeof o.newTileOnMidStop === 'boolean') {
			s.newTileOnMidStop = o.newTileOnMidStop;
		}
		if (o.customLabels && typeof o.customLabels === 'object') {
			s.customLabels = o.customLabels;
		}
		if (o.customImages && typeof o.customImages === 'object') {
			s.customImages = o.customImages;
		}
		return Object.keys(s).length ? s : null;
	} catch (e) { return null; }
}

function saveSettingsToStorage() {
	try {
		const s = {
			boardWidth: pendingSettings.boardWidth,
			boardHeight: pendingSettings.boardHeight,
			targetNumber: pendingSettings.targetNumber,
			initialTiles: pendingSettings.initialTiles,
			showNewTileMarker: pendingSettings.showNewTileMarker,
			newTileOnMidStop: pendingSettings.newTileOnMidStop,
			customLabels: pendingSettings.customLabels && typeof pendingSettings.customLabels === 'object'
										? pendingSettings.customLabels : {},
			customImages: pendingSettings.customImages && typeof pendingSettings.customImages === 'object'
										? pendingSettings.customImages : {},
		};
		setStorage(STORAGE_SETTINGS, JSON.stringify(s));
	} catch (e) {}
}

function saveSettingsFromGameState() {
	if (!gameState) {
		return;
	}
	try {
		const s = {
			boardWidth: gameState.boardWidth,
			boardHeight: gameState.boardHeight,
			targetNumber: gameState.targetNumber,
			initialTiles: gameState.initialTiles,
			showNewTileMarker: gameState.showNewTileMarker,
			newTileOnMidStop: gameState.newTileOnMidStop,
			customLabels: gameState.customLabels && typeof gameState.customLabels === 'object' ? gameState.customLabels : {},
			customImages: gameState.customImages && typeof gameState.customImages === 'object' ? gameState.customImages : {},
		};
		setStorage(STORAGE_SETTINGS, JSON.stringify(s));
	} catch (e) {}
}

function saveQuickSettingsToStorage(showNewTileMarker, newTileOnMidStop) {
	try {
		const raw = getStorage(STORAGE_SETTINGS);
		let o = raw && (function() { try { return JSON.parse(raw); } catch (e) { return null; } })() || {};
		if (typeof o !== 'object') {
			o = {};
		}
		o.showNewTileMarker = showNewTileMarker;
		o.newTileOnMidStop = newTileOnMidStop;
		setStorage(STORAGE_SETTINGS, JSON.stringify(o));
	} catch (e) {}
}

function applyQuickSettings(showNewTileMarker) {
	if (!gameState) {
		return;
	}
	gameState = Object.assign({}, gameState, {showNewTileMarker: !!showNewTileMarker});
	saveQuickSettingsToStorage(gameState.showNewTileMarker, gameState.newTileOnMidStop);
	if (view && view.commitState) {
		view.commitState(gameState);
	}
}

function openCustomTiles() {
	if (!gameState) {
		return;
	}
	pendingSettings.boardWidth = gameState.boardWidth;
	pendingSettings.boardHeight = gameState.boardHeight;
	pendingSettings.targetNumber = gameState.targetNumber;
	pendingSettings.customLabels = gameState.customLabels ? Object.assign({}, gameState.customLabels) : {};
	pendingSettings.customImages = gameState.customImages ? Object.assign({}, gameState.customImages) : {};
}

function applyCustomTiles() {
	if (!gameState) {
		return;
	}
	gameState = Object.assign({}, gameState, {
		customLabels: pendingSettings.customLabels && typeof pendingSettings.customLabels === 'object'
									? Object.assign({}, pendingSettings.customLabels) : {},
		customImages: pendingSettings.customImages && typeof pendingSettings.customImages === 'object'
									? Object.assign({}, pendingSettings.customImages) : {},
	});
	saveSettingsFromGameState();
	if (view && view.commitState) {
		view.commitState(gameState);
	}
}

function getBoardSettings() {
	if (!gameState) {
		return null;
	}
	return {boardHeight: gameState.boardHeight, boardWidth: gameState.boardWidth, targetNumber: gameState.targetNumber};
}

function applyBoardSettings(obj) {
	if (!gameState || !obj) {
		return;
	}
	pendingSettings = {
		boardWidth: obj.boardWidth != null ? obj.boardWidth : gameState.boardWidth,
		boardHeight: obj.boardHeight != null ? obj.boardHeight : gameState.boardHeight,
		targetNumber: obj.targetNumber !== undefined ? obj.targetNumber : gameState.targetNumber,
		initialTiles: 2,
		showNewTileMarker: gameState.showNewTileMarker,
		newTileOnMidStop: gameState.newTileOnMidStop,
		customLabels: gameState.customLabels ? Object.assign({}, gameState.customLabels) : {},
		customImages: gameState.customImages ? Object.assign({}, gameState.customImages) : {},
	};
	applyBoardSettingsFromPending();
	if (view && view.syncToolbarSettings) {
		view.syncToolbarSettings();
	}
}

function applyBoardSettingsFromPending() {
	if (!gameState) {
		return;
	}
	pendingSettings.initialTiles = 2;
	saveSettingsToStorage();
	const needRestart = pendingSettings.boardWidth !== gameState.boardWidth || pendingSettings.boardHeight
											!== gameState.boardHeight || pendingSettings.targetNumber !== gameState.targetNumber
											|| pendingSettings.initialTiles !== gameState.initialTiles;
	if (needRestart) {
		const highForNewSize = Number(
			getStorage(getHighScoreKey(pendingSettings.boardWidth, pendingSettings.boardHeight))) || 0;
		gameState = initGame(highForNewSize, pendingSettings);
	} else {
		gameState = Object.assign({}, gameState,
			{customLabels: pendingSettings.customLabels || {}, customImages: pendingSettings.customImages || {}});
	}
	if (view && view.commitState) {
		view.commitState(gameState);
	}
}

function isPowerOf2(n) {
	if (typeof n !== 'number' || n < 2 || !Number.isFinite(n)) {
		return false;
	}
	return (n & n - 1) === 0;
}

function getCustomTileKeysForList() {
	const baseKeys = getTileImageKeys(2048);
	const maxBase = 2048;
	const extra = {};
	let keys = pendingSettings.customLabels && typeof pendingSettings.customLabels === 'object'
						 ? Object.keys(pendingSettings.customLabels) : [];
	for (let i = 0; i < keys.length; i++) {
		const n = parseInt(keys[i], 10);
		if (isPowerOf2(n) && n > maxBase) {
			extra[n] = true;
		}
	}
	keys = pendingSettings.customImages && typeof pendingSettings.customImages === 'object'
				 ? Object.keys(pendingSettings.customImages) : [];
	for (let j = 0; j < keys.length; j++) {
		const num = parseInt(keys[j], 10);
		if (isPowerOf2(num) && num > maxBase) {
			extra[num] = true;
		}
	}
	const extraKeys = Object.keys(extra).map(Number).sort(function(a, b) { return a - b; });
	return baseKeys.concat(extraKeys.map(String));
}

function getPendingCustomTilesForVue() {
	if (!pendingSettings.customLabels) {
		pendingSettings.customLabels = {};
	}
	if (!pendingSettings.customImages) {
		pendingSettings.customImages = {};
	}
	return {
		customLabels: Object.assign({}, pendingSettings.customLabels),
		customImages: Object.assign({}, pendingSettings.customImages),
		tileKeys: getCustomTileKeysForList(),
	};
}

function setPendingCustomTiles(labels, images) {
	pendingSettings.customLabels = labels && typeof labels === 'object' ? Object.assign({}, labels) : {};
	pendingSettings.customImages = images && typeof images === 'object' ? Object.assign({}, images) : {};
}

function doInit() {
	const loaded = loadSettingsFromStorage();
	let restored = null;
	try {
		const stateRaw = getStorage(STORAGE_GAME_STATE);
		if (stateRaw) {
			restored = deserializeGameState(JSON.parse(stateRaw));
		}
	} catch (e) {}
	if (restored) {
		gameState = restored;
		const keyRestored = getHighScoreKey(gameState.boardWidth, gameState.boardHeight);
		const storedRestored = Number(getStorage(keyRestored)) || 0;
		if (gameState.highScore > storedRestored) {
			setStorage(keyRestored, String(gameState.highScore));
		}
	} else {
		const w = loaded && loaded.boardWidth || 4;
		const h = loaded && loaded.boardHeight || 4;
		const highScore = Number(getStorage(getHighScoreKey(w, h))) || 0;
		gameState = initGame(highScore, loaded || undefined);
	}
	if (view && view.commitState) {
		view.commitState(gameState);
	}
	if (view && view.setQuickSettings) {
		view.setQuickSettings(
			{showNewTileMarker: gameState.showNewTileMarker, newTileOnMidStop: gameState.newTileOnMidStop});
	}
	if (view && view.syncToolbarSettings) {
		view.syncToolbarSettings();
	}
}

function saveState() {
	if (!gameState) {
		return;
	}
	if (!gameState.gameOver && !gameState.gameWin) {
		setStorage(STORAGE_GAME_STATE, JSON.stringify(serializeGameState(gameState)));
	} else {
		try { localStorage.removeItem(STORAGE_GAME_STATE); } catch (e) {}
	}
}

function onResultClose() {
	if (!gameState) {
		return;
	}
	gameState = Object.assign({}, gameState, {overlayVisible: false, overlayMessage: ''});
	if (view && view.commitState) {
		view.commitState(gameState);
	}
}

/** 入口：注入视图桥接对象后执行初始化。Vue 在 mounted 前调用并传入提供 setGameResult、setBoardView、commitState 等方法的对象。 */
function init(bridge) {
	view = bridge && typeof bridge === 'object' ? bridge : null;
	doInit();
}

const Game2048 = !logic || !constants
								 ? {
		init() {},
		move() {},
		undo() {},
		onGesture() {},
		applyQuickSettings() {},
		openCustomTiles() {},
		applyCustomTiles() {},
		getBoardSettings() { return null; },
		applyBoardSettings() {},
		getPendingCustomTilesForVue() { return {customLabels: {}, customImages: {}, tileKeys: []}; },
		setPendingCustomTiles() {},
		getTileDisplayContent(_, value) { return {type: 'number', value: value ?? 0}; },
		onResultClose() {},
		onResultRestart() {},
	}
								 : (function() {
		document.addEventListener('keydown', function(e) {
			if (showSettings) {
				return;
			}
			if (gameState && gameState.overlayVisible) {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					gameState = Object.assign({}, gameState, {overlayVisible: false, overlayMessage: ''});
					if (view && view.commitState) {
						view.commitState(gameState);
					}
				}
				return;
			}
			if (!window.GameKeysArea || !window.GameKeysArea.shouldHandle(e)) {
				return;
			}
			let direction = null;
			if (e.key === 'ArrowLeft') {
				direction = 'left';
			} else if (e.key === 'ArrowRight') {
				direction = 'right';
			} else if (e.key === 'ArrowUp') {
				direction = 'up';
			} else if (e.key === 'ArrowDown') {
				direction = 'down';
			}
			if (direction) {
				e.preventDefault();
				handleMove(direction);
			}
		});
		window.addEventListener('beforeunload', saveState);
		return {
			init,
			move: handleMove,
			undo: handleUndo,
			onGesture: function(dx, dy) {
				if (showSettings) {
					return;
				}
				if (!gameState) {
					return;
				}
				if (gameState.overlayVisible) {
					gameState = Object.assign({}, gameState, {overlayVisible: false, overlayMessage: ''});
					if (view && view.commitState) {
						view.commitState(gameState);
					}
					return;
				}
				const dir = gestureDirection(dx, dy);
				if (dir) {
					handleMove(dir);
				}
			},
			applyQuickSettings,
			openCustomTiles,
			applyCustomTiles,
			getBoardSettings,
			applyBoardSettings,
			getPendingCustomTilesForVue,
			setPendingCustomTiles,
			getTileDisplayContent,
			onResultClose,
			onResultRestart: handleRestart,
		};
	})();

export default Game2048;

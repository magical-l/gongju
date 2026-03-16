/**
 * 2048蛇 游戏与 UI 常量。网页通过 script 加载挂到 window.Game2048SnakeConstants
 */
;(function(root, factory) {
	if (typeof module !== 'undefined' && module.exports) {
		module.exports = factory();
	} else {
		root.Game2048SnakeConstants = factory();
	}
})(typeof self !== 'undefined' ? self : this, function() {
	'use strict';
	const TILE_COLORS = {
		2: {bg: '#E2EAD8', fg: '#5A6B52'},
		4: {bg: '#D4E0C8', fg: '#5A6B52'},
		8: {bg: '#A8C99E', fg: '#F5F9F2'},
		16: {bg: '#8FBC85', fg: '#F5F9F2'},
		32: {bg: '#7CB37A', fg: '#F5F9F2'},
		64: {bg: '#6BA36B', fg: '#F5F9F2'},
		128: {bg: '#9CB87C', fg: '#F5F9F2'},
		256: {bg: '#8AB06E', fg: '#F5F9F2'},
		512: {bg: '#7AA862', fg: '#F5F9F2'},
		1024: {bg: '#6A9F56', fg: '#F5F9F2'},
		2048: {bg: '#5A8F4A', fg: '#F5F9F2'},
	};
	const TILE_SUPER = {bg: '#4A5A42', fg: '#F5F9F2'};
	const CELL_EMPTY = '#D4E0C8';
	const BOARD_BG = '#B8C9A8';
	const MIN_SWIPE_PX = 30;
	/** 至少 6×6，与 test1 2048snake 一致 */
	const SIZE_OPTIONS = [6, 7, 8, 10, 12];
	const TARGET_OPTIONS = [1024, 2048, 4096, 8192, Infinity];
	const TARGET_LABELS = ['1024', '2048', '4096', '8192', '无限'];
	const SPEED_OPTIONS_MS = [500, 400, 300, 200];
	const SPEED_LABELS = ['慢', '中', '快', '很快'];

	function getQuickSettingsList() {
		return [];
	}

	return {
		TILE_COLORS,
		TILE_SUPER,
		CELL_EMPTY,
		BOARD_BG,
		MIN_SWIPE_PX,
		SIZE_OPTIONS,
		TARGET_OPTIONS,
		TARGET_LABELS,
		SPEED_OPTIONS_MS,
		SPEED_LABELS,
		getQuickSettingsList: getQuickSettingsList,
	};
});

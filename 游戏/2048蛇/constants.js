/**
 * 2048蛇 游戏与 UI 常量。网页通过 script 加载挂到 window.Game2048SnakeConstants
 * 颜色常量引用 2048/constants.js（需先加载）
 */
;(function(root, factory) {
	if (typeof module !== 'undefined' && module.exports) {
		module.exports = factory();
	} else {
		root.Game2048SnakeConstants = factory();
	}
})(typeof self !== 'undefined' ? self : this, function() {
	'use strict';
	// 从 Game2048Constants 获取颜色常量（需先加载 2048/constants.js）
	const C2048 = (typeof self !== 'undefined' ? self : this).Game2048Constants || {};
	const TILE_COLORS = C2048.TILE_COLORS || {};
	const TILE_SUPER = C2048.TILE_SUPER || {};
	const CELL_EMPTY = C2048.CELL_EMPTY || '#D4E0C8';
	const BOARD_BG = C2048.BOARD_BG || '#B8C9A8';
	const MIN_SWIPE_PX = C2048.MIN_SWIPE_PX || 30;
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

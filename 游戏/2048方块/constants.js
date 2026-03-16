/**
 * 2048方块 - 常量与选项。网页通过 script 加载挂到 window.Game2048BlocksConstants
 */
;(function(root, factory) {
	if (typeof module !== 'undefined' && module.exports) {
		module.exports = factory();
	} else {
		root.Game2048BlocksConstants = factory();
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
	const ROWS_OPTIONS = [8, 10, 12, 14, 16];
	const COLS_OPTIONS = [6, 8, 10, 12];
	const SPEED_OPTIONS_MS = [1200, 700, 500, 350, 200];
	const SPEED_LABELS = ['慢', '中慢', '中', '快', '很快'];
	const MIN_SWIPE_PX = 30;

	return {
		TILE_COLORS: TILE_COLORS,
		TILE_SUPER: TILE_SUPER,
		ROWS_OPTIONS: ROWS_OPTIONS,
		COLS_OPTIONS: COLS_OPTIONS,
		SPEED_OPTIONS_MS: SPEED_OPTIONS_MS,
		SPEED_LABELS: SPEED_LABELS,
		MIN_SWIPE_PX: MIN_SWIPE_PX,
	};
});

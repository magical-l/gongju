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
	/** 场地行数可选：8～20，对应玩法 12.1 FIELD_HEIGHT */
	const ROWS_OPTIONS = [8, 10, 12, 14, 16, 18, 20];
	/** 场地列数可选：6～12，对应玩法 12.1 FIELD_WIDTH */
	const COLS_OPTIONS = [6, 7, 8, 9, 10, 11, 12];
	const DEFAULT_ROWS = 12;
	const DEFAULT_COLS = 10;

	/** 计分：消行基础分系数（玩法 12.2） */
	const SCORE_1 = 40;
	const SCORE_2 = 100;
	const SCORE_3 = 300;
	const SCORE_4 = 1200;
	/** 每消除多少行升 1 级（玩法 12.1） */
	const LINES_PER_LEVEL = 10;
	/** 锁定延迟 ms（玩法 12.1），100～1000，默认 500 */
	const LOCK_DELAY_DURATION = 500;
	/** 下落周期表 ms，索引为等级 0～19+（玩法 12.2） */
	const FALL_DELAY = [800, 720, 640, 560, 480, 400, 320, 240, 160, 120, 80, 70, 60, 50, 40, 30, 20, 15, 10, 8];
	/** 软降间隔 ms（玩法 12.2） */
	const SOFT_DROP_INTERVAL = 50;

	/** 开发/测试：为 true 时下落速度固定为较慢值，忽略等级与玩家速度 */
	const DEV_FIXED_FALL_MS = typeof window !== 'undefined' && window.__2048_BLOCKS_DEV_SLOW_FALL__ ? 800 : 0;

	const SPEED_OPTIONS_MS = [1200, 700, 500, 350, 200];
	const SPEED_LABELS = ['慢', '中慢', '中', '快', '很快'];
	const MIN_SWIPE_PX = 30;

	return {
		TILE_COLORS: TILE_COLORS,
		TILE_SUPER: TILE_SUPER,
		ROWS_OPTIONS: ROWS_OPTIONS,
		COLS_OPTIONS: COLS_OPTIONS,
		DEFAULT_ROWS: DEFAULT_ROWS,
		DEFAULT_COLS: DEFAULT_COLS,
		SCORE_1: SCORE_1,
		SCORE_2: SCORE_2,
		SCORE_3: SCORE_3,
		SCORE_4: SCORE_4,
		LINES_PER_LEVEL: LINES_PER_LEVEL,
		LOCK_DELAY_DURATION: LOCK_DELAY_DURATION,
		FALL_DELAY: FALL_DELAY,
		SOFT_DROP_INTERVAL: SOFT_DROP_INTERVAL,
		DEV_FIXED_FALL_MS: DEV_FIXED_FALL_MS,
		SPEED_OPTIONS_MS: SPEED_OPTIONS_MS,
		SPEED_LABELS: SPEED_LABELS,
		MIN_SWIPE_PX: MIN_SWIPE_PX,
	};
});

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
	const DEFAULT_COLS = 8;
	const MIN_FIELD_ROWS = Math.min.apply(null, ROWS_OPTIONS);
	const MAX_FIELD_ROWS = Math.max.apply(null, ROWS_OPTIONS);
	const MIN_FIELD_COLS = Math.min.apply(null, COLS_OPTIONS);
	const MAX_FIELD_COLS = Math.max.apply(null, COLS_OPTIONS);

	/** 计分：消行基础分系数（玩法 12.2） */
	const SCORE_1 = 40;
	const SCORE_2 = 100;
	const SCORE_3 = 300;
	const SCORE_4 = 1200;
	/** §11.2 每累计多少分升 1 级。《玩法》未规定程序默认值。logic.js 仅读此常量。 */
	const SCORE_PER_LEVEL = 5000;
	/** 锁定延迟默认与中限（ms，玩法 12.1） */
	const LOCK_DELAY_DURATION = 500;
	const LOCK_DELAY_MIN_MS = 100;
	const LOCK_DELAY_MAX_MS = 1000;
	/** 工具栏「初始等级」与存档里 initialLevel 的合法上限 */
	const INITIAL_LEVEL_UI_MAX = 20;
	/** 旧存档 fallIntervalMs 疑似整体 ×10 标度时的阈值，仅用于推断初始等级 */
	const LEGACY_FALL_INTERVAL_SCALE_THRESHOLD_MS = 2500;
	/** §11.3 指数下落；logic.js 仅读这些常量 */
	const INITIAL_FALL_DELAY_MS = 800;
	const FALL_DELAY_DECAY_FACTOR = 0.93;
	const MIN_FALL_DELAY_MS = 100;
	/** 软降间隔 ms */
	const SOFT_DROP_INTERVAL = 50;

	/** 开发/测试：为 true 时下落速度固定为较慢值，忽略等级与玩家速度 */
	const DEV_FIXED_FALL_MS = typeof window !== 'undefined' && window.__2048_BLOCKS_DEV_SLOW_FALL__ ? 800 : 0;

	const SPEED_OPTIONS_MS = [1200, 700, 500, 350, 200];
	const SPEED_LABELS = ['慢', '中慢', '中', '快', '很快'];
	const MIN_SWIPE_PX = 30;
	/** 主局 flush 消行链外层/内层循环安全上限（非玩法数值，防死循环） */
	const LINE_CLEAR_CHAIN_STEP_LIMIT = 5000;

	return {
		TILE_COLORS: TILE_COLORS,
		TILE_SUPER: TILE_SUPER,
		ROWS_OPTIONS: ROWS_OPTIONS,
		COLS_OPTIONS: COLS_OPTIONS,
		DEFAULT_ROWS: DEFAULT_ROWS,
		DEFAULT_COLS: DEFAULT_COLS,
		MIN_FIELD_ROWS: MIN_FIELD_ROWS,
		MAX_FIELD_ROWS: MAX_FIELD_ROWS,
		MIN_FIELD_COLS: MIN_FIELD_COLS,
		MAX_FIELD_COLS: MAX_FIELD_COLS,
		SCORE_1: SCORE_1,
		SCORE_2: SCORE_2,
		SCORE_3: SCORE_3,
		SCORE_4: SCORE_4,
		SCORE_PER_LEVEL: SCORE_PER_LEVEL,
		LOCK_DELAY_DURATION: LOCK_DELAY_DURATION,
		LOCK_DELAY_MIN_MS: LOCK_DELAY_MIN_MS,
		LOCK_DELAY_MAX_MS: LOCK_DELAY_MAX_MS,
		INITIAL_LEVEL_UI_MAX: INITIAL_LEVEL_UI_MAX,
		LEGACY_FALL_INTERVAL_SCALE_THRESHOLD_MS: LEGACY_FALL_INTERVAL_SCALE_THRESHOLD_MS,
		INITIAL_FALL_DELAY_MS: INITIAL_FALL_DELAY_MS,
		FALL_DELAY_DECAY_FACTOR: FALL_DELAY_DECAY_FACTOR,
		MIN_FALL_DELAY_MS: MIN_FALL_DELAY_MS,
		SOFT_DROP_INTERVAL: SOFT_DROP_INTERVAL,
		DEV_FIXED_FALL_MS: DEV_FIXED_FALL_MS,
		SPEED_OPTIONS_MS: SPEED_OPTIONS_MS,
		SPEED_LABELS: SPEED_LABELS,
		MIN_SWIPE_PX: MIN_SWIPE_PX,
		LINE_CLEAR_CHAIN_STEP_LIMIT: LINE_CLEAR_CHAIN_STEP_LIMIT,
	};
});

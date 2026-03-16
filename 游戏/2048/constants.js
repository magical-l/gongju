/**
 * 2048 游戏与 UI 常量。小程序侧 require() 得到 module.exports；网页侧通过 script 加载时挂到 window.Game2048Constants
 */
;(function(root, factory) {
	if (typeof module !== 'undefined' && module.exports) {
		module.exports = factory();
	} else {
		root.Game2048Constants = factory();
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
	const TILE_SUPER = {bg: '#4a5a42', fg: '#f5f9f2'};
	const CELL_EMPTY = '#d4e0c8';
	const BOARD_BG = '#b8c9a8';
	const PAGE_BG = '#e8f0e0';
	const TEXT_DARK = '#5a6b52';
	const TEXT_LIGHT = '#f5f9f2';
	const BTN_PRIMARY = '#6b8e5c';
	const BTN_SECONDARY = '#8fa87a';

	const TILE_IMAGE_KEYS = ['2', '4', '8', '16', '32', '64', '128', '256', '512', '1024', '2048'];
	/** 数字显示可配置的最大数字（2 的幂），支持扩展至 2048 以上 */
	const CUSTOM_TILE_MAX = 8192;

	function getTileImageKeys(targetOrMax) {
		const max = targetOrMax != null && targetOrMax !== Infinity ? targetOrMax : CUSTOM_TILE_MAX;
		const cap = Math.max(2048, Math.min(max, 65536));
		const keys = [];
		for (let n = 2; n <= cap; n *= 2) {
			keys.push(String(n));
		}
		return keys;
	}

	const SIZE_OPTIONS = [4, 5, 6];
	const TARGET_OPTIONS = [1024, 2048, 4096, 8192, Infinity];
	const TARGET_LABELS = ['1024', '2048', '4096', '8192', '无限'];
	const INITIAL_OPTIONS = [1, 2, 3, 4, 5];
	const ACCEL_SPEED_OPTIONS = ['slow', 'medium', 'fast'];
	const ACCEL_SPEED_LABELS = ['慢', '中', '快'];
	const MERGE_ANIM_OPTIONS = ['flip', 'scale', 'shake', 'bounce', 'glow', 'none'];
	const MERGE_ANIM_LABELS = ['翻牌', '缩放', '旋转', '弹跳', '脉冲', '无'];
	/**
	 * 设置项与 UI 文案的 schema：按 endpoint 区分。
	 * 结构：{ default: { label?, endpoints?, vals?, ... }, wechat?: {...}, web?: {...} }
	 * - default 为兜底；wechat / web 覆盖同名字段，若为 null 表示该端不展示该项。
	 * - endpoints 表示该项在哪些端展示（合并 default 与 endpoint 后取）。
	 */
	const SETTINGS_SCHEMA = {
		useAccelerometer: {default: {endpoints: ['wechat']}, web: null},
		accelerometerSpeed: {default: {endpoints: ['wechat']}, web: null},
		newTileOnMidStop: {default: {endpoints: ['wechat']}, web: null},
		showNewTileMarker: {
			default: {label: '新数标记', endpoints: ['web', 'wechat'], type: 'toggle'},
			wechat: {},
			web: {},
		},
	};

	/** 各端 UI 文案（非设置项）：{ 区域: { 键: { default?, wechat?, web? } } }，网页可写长一点 */
	const UI_LABELS = {
		customTiles: {
			labelPlaceholder: {default: '文字', web: '自定义文字'},
			pickImage: {default: '选图', web: '选择本地图片'},
		},
	};

	function getSettingForEndpoint(key, endpoint) {
		const s = SETTINGS_SCHEMA[key];
		if (!s) {
			return null;
		}
		const base = s.default != null ? s.default : s;
		const over = s[endpoint];
		if (over === null || over === false) {
			return null;
		}
		return Object.assign({}, base, over || {});
	}

	function getDisplayLabel(area, key, endpoint) {
		const a = UI_LABELS[area];
		if (!a) {
			return key;
		}
		const o = a[key];
		if (!o) {
			return key;
		}
		const v = o[endpoint] != null ? o[endpoint] : o.default;
		return v != null ? String(v) : key;
	}

	function getSettingOptions(key, endpoint) {
		const c = getSettingForEndpoint(key, endpoint);
		if (!c || !c.vals) {
			return null;
		}
		const list = [];
		for (let v in c.vals) {
			const o = c.vals[v];
			if (!o.endpoints || o.endpoints.indexOf(endpoint) !== -1) {
				list.push(
					{value: v, label: o.label != null ? o.label : v});
			}
		}
		return list;
	}

	function isSettingVisible(key, endpoint) {
		const c = getSettingForEndpoint(key, endpoint);
		if (!c) {
			return false;
		}
		return !c.endpoints || c.endpoints.indexOf(endpoint) !== -1;
	}

	function buildVisibilityFromSchema() {
		const vis = {};
		for (let key in SETTINGS_SCHEMA) {
			if (!isSettingVisible(key, 'web')) {
				vis[key] = 'wechat';
			} else if (!isSettingVisible(key, 'wechat')) {
				vis[key] = 'web';
			}
		}
		return vis;
	}

	/** 工具栏「快速设置」项顺序；仅在此列表且对 endpoint 可见的会生成到界面 */
	const QUICK_SETTINGS_KEYS = ['showNewTileMarker'];

	function getQuickSettingsList(endpoint) {
		const list = [];
		for (let i = 0; i < QUICK_SETTINGS_KEYS.length; i++) {
			const key = QUICK_SETTINGS_KEYS[i];
			if (!isSettingVisible(key, endpoint)) {
				continue;
			}
			const c = getSettingForEndpoint(key, endpoint);
			if (!c) {
				continue;
			}
			const item = {key: key, label: c.label || key};
			if (c.vals) {
				item.type = 'select';
				item.options = getSettingOptions(key, endpoint) || [];
			} else {
				item.type = c.type || 'switch';
			}
			list.push(item);
		}
		return list;
	}

	const SETTINGS_VISIBILITY = buildVisibilityFromSchema();
	const SETTINGS_TILE_KEYS = [
		'boardHeight', 'boardWidth', 'targetNumber', 'initialTiles',
		'showNewTileMarker', 'useAccelerometer', 'accelerometerSpeed', 'newTileOnMidStop',
	];

	const ACCEL_COOLDOWN = {slow: 900, medium: 480, fast: 280};
	const ACCEL_TILT_THRESHOLD = 0.45;
	const MERGE_ANIM_DURATION_MS = 200;
	const DRAW_INTERVAL_MS = 50;
	const MS_PER_CELL_BY_SPEED = {slow: 1000, medium: 600, fast: 300};
	const GESTURE_MS_PER_CELL = 50;
	const MERGE_SCALE_AMOUNT = 0.2;
	const PROGRESS_EPSILON = 1e-6;

	const PADDING = 16;
	const SAFE_TOP_MIN = 20;
	const HEADER_H = 120;
	const BOARD_PADDING = 12;
	const GRID_LINE = '#9bad8f';
	const GRID_LINE_WIDTH = 1;
	const GAP = 6;
	const BOARD_CORNER_RADIUS = 8;
	const TILE_CORNER_RADIUS = 6;
	const TITLE_FONT_SIZE = 28;
	const TITLE_Y = 38;
	const SCORE_FONT_SIZE = 16;
	const SCORE_Y1 = 28;
	const SCORE_Y2 = 50;
	const BTN_H = 36;
	const BTN_Y = 58;
	const BTN_GAP = 10;
	const BTN_W0 = 44;
	const BTN_W1 = 56;
	const BTN_W2 = 56;
	const BTN_W3 = 56;
	const BTN_CORNER_RADIUS = 8;
	const OVERLAY_TITLE_FONT = 32;
	const OVERLAY_SUB_FONT = 18;
	const OVERLAY_BTN_FONT = 16;
	const OVERLAY_BTN_OFFSET_Y = 50;
	const TILE_FONT_SIZE_LARGE = 24;
	const TILE_FONT_SIZE_MEDIUM = 18;
	const TILE_FONT_SIZE_SMALL = 14;
	const TILE_FONT_CELL_THRESHOLD_LARGE = 50;
	const TILE_FONT_CELL_THRESHOLD_MEDIUM = 36;
	const TILE_IMAGE_PAD_RATIO = 0.08;
	const TILE_IMAGE_MIN_PAD = 2;

	const PANEL_MAX_W = 340;
	const PANEL_MAX_H = 400;
	const PANEL_MARGIN_H = 24;
	const PANEL_MARGIN_TOP = 32;
	const PANEL_OFFSET_Y = 16;
	const PANEL_PAD = 14;
	const PANEL_LABEL_W = 72;
	const PANEL_ROW_H = 26;
	const PANEL_GAP = 6;
	const PANEL_TILE_H = 24;
	const PANEL_LIST_ROW_H = 32;
	const PANEL_IMG_COL_MAX_W = 80;
	const PANEL_IMG_COL_W = PANEL_IMG_COL_MAX_W;
	const PANEL_DISPLAY_ROW_H = PANEL_IMG_COL_MAX_W + 4;
	const PANEL_CLEAR_ROW_H = 40;
	const PANEL_BTN_H2 = 34;
	const PANEL_HEADER_H = 40;
	const PANEL_REOPEN_HINT_H = 18;
	const PANEL_CORNER_RADIUS = 12;
	const PANEL_OPT_CORNER_RADIUS = 6;
	const PANEL_NUM_COL_W = 36;
	const PANEL_DISPLAY_TEXT_COL_W = 44;
	const PANEL_DISPLAY_EMOJI_IMG_GAP = 10;
	const PANEL_CLEAR_IMG_BTN_W = 28;
	const PANEL_CLEAR_IMG_BTN_H = 32;
	const PANEL_TOGGLE_BTN_W = 48;
	const PANEL_OPT_GAP = 5;
	const PANEL_HINT_FONT_SIZE = 13;
	const PANEL_HINT_OFFSET_Y = 14;
	const PANEL_HINT_ROW_OFFSET = 18;
	const PANEL_CLEAR_BTN_GAP = 8;
	const PANEL_LIST_HEADER_OFFSET = 16;
	const PANEL_DISPLAY_INNER_PAD = 4;
	const PANEL_IMG_MARGIN = 6;
	const PANEL_SECTION_GAP = 8;
	const PANEL_BTN_CORNER_RADIUS = 8;
	const PANEL_TITLE_FONT_SIZE = 20;
	const PANEL_TITLE_Y = 20;
	const PANEL_ROW_OPT_PAD = 4;
	const PANEL_TEXT_CORNER_RADIUS = 4;
	const PANEL_DISPLAY_TRUNCATE_LEN = 8;
	const PANEL_DISPLAY_ELLIPSIS_LEN = 7;

	const MIN_SWIPE_PX = 30;
	const TOAST_SAVED_DURATION = 2000;
	const TOAST_PRIVACY_DURATION = 3500;

	return {
		TILE_COLORS,
		TILE_SUPER,
		CELL_EMPTY,
		BOARD_BG,
		PAGE_BG,
		TEXT_DARK,
		TEXT_LIGHT,
		BTN_PRIMARY,
		BTN_SECONDARY,
		TILE_IMAGE_KEYS,
		CUSTOM_TILE_MAX: CUSTOM_TILE_MAX,
		getTileImageKeys: getTileImageKeys,
		SIZE_OPTIONS,
		TARGET_OPTIONS,
		TARGET_LABELS,
		INITIAL_OPTIONS,
		ACCEL_SPEED_OPTIONS,
		ACCEL_SPEED_LABELS,
		MERGE_ANIM_OPTIONS,
		MERGE_ANIM_LABELS,
		SETTINGS_SCHEMA,
		UI_LABELS,
		getSettingForEndpoint,
		getDisplayLabel,
		getSettingOptions,
		isSettingVisible,
		QUICK_SETTINGS_KEYS: QUICK_SETTINGS_KEYS,
		getQuickSettingsList,
		SETTINGS_VISIBILITY,
		SETTINGS_TILE_KEYS,
		ACCEL_COOLDOWN,
		ACCEL_TILT_THRESHOLD,
		MERGE_ANIM_DURATION_MS,
		DRAW_INTERVAL_MS,
		MS_PER_CELL_BY_SPEED,
		GESTURE_MS_PER_CELL,
		MERGE_SCALE_AMOUNT,
		PROGRESS_EPSILON,
		PADDING,
		SAFE_TOP_MIN,
		HEADER_H,
		BOARD_PADDING,
		GRID_LINE,
		GRID_LINE_WIDTH,
		GAP,
		BOARD_CORNER_RADIUS,
		TILE_CORNER_RADIUS,
		TITLE_FONT_SIZE,
		TITLE_Y,
		SCORE_FONT_SIZE,
		SCORE_Y1,
		SCORE_Y2,
		BTN_H,
		BTN_Y,
		BTN_GAP,
		BTN_W0,
		BTN_W1,
		BTN_W2,
		BTN_W3,
		BTN_CORNER_RADIUS,
		OVERLAY_TITLE_FONT,
		OVERLAY_SUB_FONT,
		OVERLAY_BTN_FONT,
		OVERLAY_BTN_OFFSET_Y,
		TILE_FONT_SIZE_LARGE,
		TILE_FONT_SIZE_MEDIUM,
		TILE_FONT_SIZE_SMALL,
		TILE_FONT_CELL_THRESHOLD_LARGE,
		TILE_FONT_CELL_THRESHOLD_MEDIUM,
		TILE_IMAGE_PAD_RATIO,
		TILE_IMAGE_MIN_PAD,
		PANEL_MAX_W,
		PANEL_MAX_H,
		PANEL_MARGIN_H,
		PANEL_MARGIN_TOP,
		PANEL_OFFSET_Y,
		PANEL_PAD,
		PANEL_LABEL_W,
		PANEL_ROW_H,
		PANEL_GAP,
		PANEL_TILE_H,
		PANEL_LIST_ROW_H,
		PANEL_IMG_COL_MAX_W,
		PANEL_IMG_COL_W,
		PANEL_DISPLAY_ROW_H,
		PANEL_CLEAR_ROW_H,
		PANEL_BTN_H2,
		PANEL_HEADER_H,
		PANEL_REOPEN_HINT_H,
		PANEL_CORNER_RADIUS,
		PANEL_OPT_CORNER_RADIUS,
		PANEL_NUM_COL_W,
		PANEL_DISPLAY_TEXT_COL_W,
		PANEL_DISPLAY_EMOJI_IMG_GAP,
		PANEL_CLEAR_IMG_BTN_W,
		PANEL_CLEAR_IMG_BTN_H,
		PANEL_TOGGLE_BTN_W,
		PANEL_OPT_GAP,
		PANEL_HINT_FONT_SIZE,
		PANEL_HINT_OFFSET_Y,
		PANEL_HINT_ROW_OFFSET,
		PANEL_CLEAR_BTN_GAP,
		PANEL_LIST_HEADER_OFFSET,
		PANEL_DISPLAY_INNER_PAD,
		PANEL_IMG_MARGIN,
		PANEL_SECTION_GAP,
		PANEL_BTN_CORNER_RADIUS,
		PANEL_TITLE_FONT_SIZE,
		PANEL_TITLE_Y,
		PANEL_ROW_OPT_PAD,
		PANEL_TEXT_CORNER_RADIUS,
		PANEL_DISPLAY_TRUNCATE_LEN,
		PANEL_DISPLAY_ELLIPSIS_LEN,
		MIN_SWIPE_PX,
		TOAST_SAVED_DURATION,
		TOAST_PRIVACY_DURATION,
	};
})

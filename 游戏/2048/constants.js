/**
 * 2048 游戏与 UI 常量。小程序侧 require() 得到 module.exports；网页侧通过 script 加载时挂到 window.Game2048Constants
 */
;(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory()
  } else {
    root.Game2048Constants = factory()
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict'
  var TILE_COLORS = {
  2: { bg: '#e2ead8', fg: '#5a6b52' },
  4: { bg: '#d4e0c8', fg: '#5a6b52' },
  8: { bg: '#a8c99e', fg: '#f5f9f2' },
  16: { bg: '#8fbc85', fg: '#f5f9f2' },
  32: { bg: '#7cb37a', fg: '#f5f9f2' },
  64: { bg: '#6ba36b', fg: '#f5f9f2' },
  128: { bg: '#9cb87c', fg: '#f5f9f2' },
  256: { bg: '#8ab06e', fg: '#f5f9f2' },
  512: { bg: '#7aa862', fg: '#f5f9f2' },
  1024: { bg: '#6a9f56', fg: '#f5f9f2' },
  2048: { bg: '#5a8f4a', fg: '#f5f9f2' },
}
var TILE_SUPER = { bg: '#4a5a42', fg: '#f5f9f2' }
var CELL_EMPTY = '#d4e0c8'
var BOARD_BG = '#b8c9a8'
var PAGE_BG = '#e8f0e0'
var TEXT_DARK = '#5a6b52'
var TEXT_LIGHT = '#f5f9f2'
var BTN_PRIMARY = '#6b8e5c'
var BTN_SECONDARY = '#8fa87a'

var TILE_IMAGE_KEYS = ['2', '4', '8', '16', '32', '64', '128', '256', '512', '1024', '2048']
/** 数字显示可配置的最大数字（2 的幂），支持扩展至 2048 以上 */
var CUSTOM_TILE_MAX = 8192
function getTileImageKeys(targetOrMax) {
  var max = (targetOrMax != null && targetOrMax !== Infinity) ? targetOrMax : CUSTOM_TILE_MAX
  var cap = Math.max(2048, Math.min(max, 65536))
  var keys = []
  for (var n = 2; n <= cap; n *= 2) keys.push(String(n))
  return keys
}
var SIZE_OPTIONS = [4, 5, 6]
var TARGET_OPTIONS = [1024, 2048, 4096, 8192, Infinity]
var TARGET_LABELS = ['1024', '2048', '4096', '8192', '无限']
var INITIAL_OPTIONS = [1, 2, 3, 4, 5]
var ACCEL_SPEED_OPTIONS = ['slow', 'medium', 'fast']
var ACCEL_SPEED_LABELS = ['慢', '中', '快']
var MERGE_ANIM_OPTIONS = ['flip', 'scale', 'shake', 'bounce', 'glow', 'none']
var MERGE_ANIM_LABELS = ['翻牌', '缩放', '旋转', '弹跳', '脉冲', '无']
/**
 * 设置项与 UI 文案的 schema：按 endpoint 区分。
 * 结构：{ default: { label?, endpoints?, vals?, ... }, wechat?: {...}, web?: {...} }
 * - default 为兜底；wechat / web 覆盖同名字段，若为 null 表示该端不展示该项。
 * - endpoints 表示该项在哪些端展示（合并 default 与 endpoint 后取）。
 */
var SETTINGS_SCHEMA = {
  useAccelerometer: { default: { endpoints: ['wechat'] }, web: null },
  accelerometerSpeed: { default: { endpoints: ['wechat'] }, web: null },
  newTileOnMidStop: { default: { endpoints: ['wechat'] }, web: null },
  showNewTileMarker: {
    default: { label: '新数标记', endpoints: ['web', 'wechat'], display: 'toggleButton' },
    wechat: {},
    web: {}
  },
}

/** 各端 UI 文案（非设置项）：{ 区域: { 键: { default?, wechat?, web? } } }，网页可写长一点 */
var UI_LABELS = {
  customTiles: {
    labelPlaceholder: { default: '文字', web: '自定义文字' },
    pickImage: { default: '选图', web: '选择本地图片' }
  }
}

function getSettingForEndpoint(key, endpoint) {
  var s = SETTINGS_SCHEMA[key]
  if (!s) return null
  var base = s.default != null ? s.default : s
  var over = s[endpoint]
  if (over === null || over === false) return null
  return Object.assign({}, base, over || {})
}

function getDisplayLabel(area, key, endpoint) {
  var a = UI_LABELS[area]
  if (!a) return key
  var o = a[key]
  if (!o) return key
  var v = o[endpoint] != null ? o[endpoint] : o.default
  return v != null ? String(v) : key
}

function getSettingOptions(key, endpoint) {
  var c = getSettingForEndpoint(key, endpoint)
  if (!c || !c.vals) return null
  var list = []
  for (var v in c.vals) {
    var o = c.vals[v]
    if (!o.endpoints || o.endpoints.indexOf(endpoint) !== -1) list.push({ value: v, label: o.label != null ? o.label : v })
  }
  return list
}

function isSettingVisible(key, endpoint) {
  var c = getSettingForEndpoint(key, endpoint)
  if (!c) return false
  return !c.endpoints || c.endpoints.indexOf(endpoint) !== -1
}

function buildVisibilityFromSchema() {
  var vis = {}
  for (var key in SETTINGS_SCHEMA) {
    if (!isSettingVisible(key, 'web')) vis[key] = 'wechat'
    else if (!isSettingVisible(key, 'wechat')) vis[key] = 'web'
  }
  return vis
}

/** 工具栏「快速设置」项顺序；仅在此列表且对 endpoint 可见的会生成到界面 */
var QUICK_SETTINGS_KEYS = ['showNewTileMarker']

function getQuickSettingsList(endpoint) {
  var list = []
  for (var i = 0; i < QUICK_SETTINGS_KEYS.length; i++) {
    var key = QUICK_SETTINGS_KEYS[i]
    if (!isSettingVisible(key, endpoint)) continue
    var c = getSettingForEndpoint(key, endpoint)
    if (!c) continue
    var item = { key: key, label: c.label || key }
    if (c.vals) {
      item.type = 'select'
      item.options = getSettingOptions(key, endpoint) || []
    } else {
      item.type = 'boolean'
      item.display = c.display || 'switch'
    }
    list.push(item)
  }
  return list
}

var SETTINGS_VISIBILITY = buildVisibilityFromSchema()
var SETTINGS_TILE_KEYS = [
  'boardHeight', 'boardWidth', 'targetNumber', 'initialTiles',
  'showNewTileMarker', 'useAccelerometer', 'accelerometerSpeed', 'newTileOnMidStop',
]

var ACCEL_COOLDOWN = { slow: 900, medium: 480, fast: 280 }
var ACCEL_TILT_THRESHOLD = 0.45
var MERGE_ANIM_DURATION_MS = 200
var DRAW_INTERVAL_MS = 50
var MS_PER_CELL_BY_SPEED = { slow: 1000, medium: 600, fast: 300 }
var GESTURE_MS_PER_CELL = 50
var MERGE_SCALE_AMOUNT = 0.2
var PROGRESS_EPSILON = 1e-6

var PADDING = 16
var SAFE_TOP_MIN = 20
var HEADER_H = 120
var BOARD_PADDING = 12
var GRID_LINE = '#9bad8f'
var GRID_LINE_WIDTH = 1
var GAP = 6
var BOARD_CORNER_RADIUS = 8
var TILE_CORNER_RADIUS = 6
var TITLE_FONT_SIZE = 28
var TITLE_Y = 38
var SCORE_FONT_SIZE = 16
var SCORE_Y1 = 28
var SCORE_Y2 = 50
var BTN_H = 36
var BTN_Y = 58
var BTN_GAP = 10
var BTN_W0 = 44
var BTN_W1 = 56
var BTN_W2 = 56
var BTN_W3 = 56
var BTN_CORNER_RADIUS = 8
var OVERLAY_TITLE_FONT = 32
var OVERLAY_SUB_FONT = 18
var OVERLAY_BTN_FONT = 16
var OVERLAY_BTN_OFFSET_Y = 50
var TILE_FONT_SIZE_LARGE = 24
var TILE_FONT_SIZE_MEDIUM = 18
var TILE_FONT_SIZE_SMALL = 14
var TILE_FONT_CELL_THRESHOLD_LARGE = 50
var TILE_FONT_CELL_THRESHOLD_MEDIUM = 36
var TILE_IMAGE_PAD_RATIO = 0.08
var TILE_IMAGE_MIN_PAD = 2

var PANEL_MAX_W = 340
var PANEL_MAX_H = 400
var PANEL_MARGIN_H = 24
var PANEL_MARGIN_TOP = 32
var PANEL_OFFSET_Y = 16
var PANEL_PAD = 14
var PANEL_LABEL_W = 72
var PANEL_ROW_H = 26
var PANEL_GAP = 6
var PANEL_TILE_H = 24
var PANEL_LIST_ROW_H = 32
var PANEL_IMG_COL_MAX_W = 80
var PANEL_IMG_COL_W = PANEL_IMG_COL_MAX_W
var PANEL_DISPLAY_ROW_H = PANEL_IMG_COL_MAX_W + 4
var PANEL_CLEAR_ROW_H = 40
var PANEL_BTN_H2 = 34
var PANEL_HEADER_H = 40
var PANEL_REOPEN_HINT_H = 18
var PANEL_CORNER_RADIUS = 12
var PANEL_OPT_CORNER_RADIUS = 6
var PANEL_NUM_COL_W = 36
var PANEL_DISPLAY_TEXT_COL_W = 44
var PANEL_DISPLAY_EMOJI_IMG_GAP = 10
var PANEL_CLEAR_IMG_BTN_W = 28
var PANEL_CLEAR_IMG_BTN_H = 32
var PANEL_TOGGLE_BTN_W = 48
var PANEL_OPT_GAP = 5
var PANEL_HINT_FONT_SIZE = 13
var PANEL_HINT_OFFSET_Y = 14
var PANEL_HINT_ROW_OFFSET = 18
var PANEL_CLEAR_BTN_GAP = 8
var PANEL_LIST_HEADER_OFFSET = 16
var PANEL_DISPLAY_INNER_PAD = 4
var PANEL_IMG_MARGIN = 6
var PANEL_SECTION_GAP = 8
var PANEL_BTN_CORNER_RADIUS = 8
var PANEL_TITLE_FONT_SIZE = 20
var PANEL_TITLE_Y = 20
var PANEL_ROW_OPT_PAD = 4
var PANEL_TEXT_CORNER_RADIUS = 4
var PANEL_DISPLAY_TRUNCATE_LEN = 8
var PANEL_DISPLAY_ELLIPSIS_LEN = 7

var MIN_SWIPE_PX = 30
var TOAST_SAVED_DURATION = 2000
var TOAST_PRIVACY_DURATION = 3500

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
  getSettingForEndpoint: getSettingForEndpoint,
  getDisplayLabel: getDisplayLabel,
  getSettingOptions: getSettingOptions,
  isSettingVisible: isSettingVisible,
  QUICK_SETTINGS_KEYS: QUICK_SETTINGS_KEYS,
  getQuickSettingsList: getQuickSettingsList,
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

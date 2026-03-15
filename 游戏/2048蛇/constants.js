/**
 * 2048蛇 游戏与 UI 常量。网页通过 script 加载挂到 window.Game2048SnakeConstants
 */
;(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.Game2048SnakeConstants = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
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
  };
  var TILE_SUPER = { bg: '#4a5a42', fg: '#f5f9f2' };
  var CELL_EMPTY = '#d4e0c8';
  var BOARD_BG = '#b8c9a8';
  var MIN_SWIPE_PX = 30;
  /** 至少 6×6，与 test1 2048snake 一致 */
  var SIZE_OPTIONS = [6, 7, 8, 10, 12];
  var TARGET_OPTIONS = [1024, 2048, 4096, 8192, Infinity];
  var TARGET_LABELS = ['1024', '2048', '4096', '8192', '无限'];
  var SPEED_OPTIONS_MS = [500, 400, 300, 200];
  var SPEED_LABELS = ['慢', '中', '快', '很快'];

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

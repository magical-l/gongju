/**
 * 2048方块 - 常量与选项。网页通过 script 加载挂到 window.Game2048BlocksConstants
 */
;(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.Game2048BlocksConstants = factory();
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
  var ROWS_OPTIONS = [8, 10, 12, 14, 16];
  var COLS_OPTIONS = [6, 8, 10, 12];
  var SPEED_OPTIONS_MS = [1200, 700, 500, 350, 200];
  var SPEED_LABELS = ['慢', '中慢', '中', '快', '很快'];
  var MIN_SWIPE_PX = 30;

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

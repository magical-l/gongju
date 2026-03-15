/**
 * 2048蛇 - 纯逻辑（与 test1 miniprogram/games/2048snake/logic.ts 一致）。
 * 多节蛇、定时移动、吃食物后消化（相邻同数合并）。
 */
;(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.Game2048SnakeLogic = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var STORAGE_HIGH_SCORE = '2048snake-high-score';
  var STORAGE_SETTINGS = '2048snake-settings';
  var STORAGE_GAME_STATE = '2048snake-game-state';

  function getHighScoreKey(rows, cols) {
    return STORAGE_HIGH_SCORE + '-' + (rows || 8) + '-' + (cols || 8);
  }

  var MIN_ROWS_COLS = 6;
  var DEFAULT_CFG = {
    rows: 8,
    cols: 8,
    initialLength: 3,
    foodCount: 1,
    targetNumber: 2048,
    turnIntervalMs: 400,
  };

  function positionKey(r, c) {
    return r + ',' + c;
  }

  function nextPosition(r, c, dir) {
    if (dir === 'up') return { r: r - 1, c: c };
    if (dir === 'down') return { r: r + 1, c: c };
    if (dir === 'left') return { r: r, c: c - 1 };
    return { r: r, c: c + 1 };
  }

  function oppositeDir(dir) {
    if (dir === 'up') return 'down';
    if (dir === 'down') return 'up';
    if (dir === 'left') return 'right';
    return 'left';
  }

  function randomFoodValue(maxSnakeValue) {
    var maxVal = Math.max(2, maxSnakeValue);
    var pool = [];
    for (var v = 2; v <= maxVal; v *= 2) pool.push(v);
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function initSnakeValues(length) {
    var arr = [];
    for (var i = 0; i < length; i++) arr.push(Math.pow(2, i + 1));
    return arr;
  }

  function emptyPositions(rows, cols, segments, food) {
    var used = {};
    var i;
    for (i = 0; i < segments.length; i++) {
      used[positionKey(segments[i].position.r, segments[i].position.c)] = true;
    }
    for (i = 0; i < food.length; i++) {
      used[positionKey(food[i].r, food[i].c)] = true;
    }
    var out = [];
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        if (!used[positionKey(r, c)]) out.push({ r: r, c: c });
      }
    }
    return out;
  }

  function spawnFood(rows, cols, segments, food, count, snakeValues) {
    var positions = segments.map(function (s) { return s.position; });
    var empty = emptyPositions(rows, cols, segments, food);
    if (empty.length < count) return food;
    var maxSnake = snakeValues && snakeValues.length ? Math.max.apply(null, snakeValues) : 8;
    var next = food.slice();
    for (var i = empty.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = empty[i]; empty[i] = empty[j]; empty[j] = t;
    }
    for (var k = 0; k < count; k++) {
      next.push({ r: empty[k].r, c: empty[k].c, value: randomFoodValue(maxSnake) });
    }
    return next;
  }

  function initSnake(rows, cols, length, direction) {
    var values = initSnakeValues(length);
    var positions = [];
    var r0 = Math.floor(rows / 2) - Math.floor(length / 2);
    var c0 = Math.floor(cols / 2) - Math.floor(length / 2);
    var rStart = Math.max(0, Math.min(r0, rows - length));
    var cStart = Math.max(0, Math.min(c0, cols - length));
    if (direction === 'left' || direction === 'right') {
      if (cStart + length > cols) cStart = cols - length;
      var r = Math.floor(rows / 2);
      for (var i = 0; i < length; i++) {
        positions.push({ r: r, c: direction === 'right' ? cStart + length - 1 - i : cStart + i });
      }
    } else {
      if (rStart + length > rows) rStart = rows - length;
      var c = Math.floor(cols / 2);
      for (var i = 0; i < length; i++) {
        positions.push({ r: direction === 'down' ? rStart + length - 1 - i : rStart + i, c: c });
      }
    }
    return positions.map(function (p, i) { return { position: { r: p.r, c: p.c }, value: values[i] }; });
  }

  function snakeOccupies(segments, r, c) {
    for (var i = 0; i < segments.length; i++) {
      if (segments[i].position.r === r && segments[i].position.c === c) return true;
    }
    return false;
  }

  function digestOneStep(segments, highlightIdx) {
    var result = { changed: false, newHighlight: highlightIdx, newDigesting: false };
    for (var i = 0; i < segments.length - 1; i++) {
      var v0 = segments[i].value;
      var v1 = segments[i + 1].value;
      if (v0 > v1) {
        segments[i].value = v1;
        segments[i + 1].value = v0;
        result.newHighlight = highlightIdx === i ? i + 1 : highlightIdx === i + 1 ? i : highlightIdx;
        result.changed = true;
        return result;
      }
      if (v0 < v1) continue;
      segments[i].value = v0 * 2;
        var positionsAfterRemoved = segments.slice(i + 2).map(function (s) { return { r: s.position.r, c: s.position.c }; });
        segments.splice(i + 1, 1);
        for (var j = i + 1; j < segments.length; j++) {
          segments[j].position.r = positionsAfterRemoved[j - (i + 1)].r;
          segments[j].position.c = positionsAfterRemoved[j - (i + 1)].c;
        }
        result.newDigesting = highlightIdx === i || highlightIdx === i + 1;
        result.newHighlight = result.newDigesting ? i : highlightIdx > i + 1 ? highlightIdx - 1 : highlightIdx;
        result.changed = true;
        return result;
    }
    return result;
  }

  function fillGap(segments) {
    if (segments.length <= 1) return;
    for (var i = 1; i < segments.length; i++) {
      var prev = segments[i - 1].position;
      var cur = segments[i].position;
      var dr = cur.r - prev.r;
      var dc = cur.c - prev.c;
      if (Math.abs(dr) + Math.abs(dc) > 1) {
        if (dr === 0) cur.c = prev.c + (dc > 0 ? 1 : -1);
        else if (dc === 0) cur.r = prev.r + (dr > 0 ? 1 : -1);
        else { cur.r = prev.r + (dr > 0 ? 1 : -1); cur.c = prev.c; }
      }
    }
  }

  function init(highScore, overrides) {
    if (highScore === undefined) highScore = 0;
    var o = overrides || {};
    var rows = Math.max(MIN_ROWS_COLS, o.rows != null ? o.rows : DEFAULT_CFG.rows);
    var cols = Math.max(MIN_ROWS_COLS, o.cols != null ? o.cols : DEFAULT_CFG.cols);
    var initialLength = o.initialLength != null ? o.initialLength : DEFAULT_CFG.initialLength;
    if (rows <= 6 && cols <= 6) initialLength = Math.min(initialLength, 2);
    initialLength = Math.min(initialLength, rows * cols - 1);
    var len = Math.max(1, initialLength);
    var dirs = ['up', 'down', 'left', 'right'];
    var direction = dirs[Math.floor(Math.random() * dirs.length)];
    var segments = initSnake(rows, cols, len, direction);
    var foodCount = o.foodCount != null ? o.foodCount : DEFAULT_CFG.foodCount;
    var snakeValues = segments.map(function (s) { return s.value; });
    var food = spawnFood(rows, cols, segments, [], foodCount, snakeValues);
    var turnIntervalMs = o.turnIntervalMs != null ? Number(o.turnIntervalMs) : DEFAULT_CFG.turnIntervalMs;
    return {
      rows: rows,
      cols: cols,
      segments: segments,
      direction: direction,
      food: food,
      score: 0,
      highScore: highScore,
      gameOver: false,
      gameWin: false,
      overlayVisible: false,
      overlayMessage: '',
      initialLength: len,
      foodCount: foodCount,
      targetNumber: o.targetNumber != null ? o.targetNumber : DEFAULT_CFG.targetNumber,
      turnIntervalMs: Math.max(50, turnIntervalMs),
      highlightSegmentIndex: -1,
      highlightDigesting: false,
    };
  }

  function headPosition(state) {
    return state.segments[0].position;
  }

  function nextHeadPos(state) {
    var h = state.segments[0].position;
    return nextPosition(h.r, h.c, state.direction);
  }

  function canSetDirection(state, newDir) {
    if (state.segments.length <= 1) return true;
    if (newDir === oppositeDir(state.direction)) return false;
    var next = nextHeadPos({ segments: state.segments, direction: newDir });
    if (snakeOccupies(state.segments, next.r, next.c)) return false;
    return true;
  }

  function setDirection(state, newDir) {
    if (!canSetDirection(state, newDir)) return state;
    return Object.assign({}, state, { direction: newDir });
  }

  function tick(state) {
    if (state.gameOver || state.gameWin) return state;
    var g = Object.assign({}, state);
    g.segments = state.segments.map(function (s) {
      return { position: { r: s.position.r, c: s.position.c }, value: s.value };
    });

    if (g.highlightDigesting) {
      var digestResult = digestOneStep(g.segments, g.highlightSegmentIndex);
      if (digestResult.changed) {
        fillGap(g.segments);
        return Object.assign({}, g, {
          highlightSegmentIndex: digestResult.newHighlight,
          highlightDigesting: true,
        });
      }
      g = Object.assign({}, g, { highlightDigesting: false, highlightSegmentIndex: -1 });
    }

    var next = nextHeadPos(g);
    var rows = g.rows;
    var cols = g.cols;

    if (next.r < 0 || next.r >= rows || next.c < 0 || next.c >= cols) {
      return Object.assign({}, g, {
        gameOver: true,
        overlayVisible: true,
        overlayMessage: '撞墙了',
      });
    }
    if (snakeOccupies(g.segments, next.r, next.c)) {
      return Object.assign({}, g, {
        gameOver: true,
        overlayVisible: true,
        overlayMessage: '撞到自己了',
      });
    }

    var foodIdx = -1;
    for (var fi = 0; fi < g.food.length; fi++) {
      if (g.food[fi].r === next.r && g.food[fi].c === next.c) { foodIdx = fi; break; }
    }

    if (foodIdx >= 0) {
      var eaten = g.food[foodIdx];
      var newFood = g.food.filter(function (_, i) { return i !== foodIdx; });
      g.segments.unshift({ position: { r: next.r, c: next.c }, value: eaten.value });
      var dig = digestOneStep(g.segments, 0);
      if (dig.changed) fillGap(g.segments);
      fillGap(g.segments);
      g = Object.assign({}, g, {
        highlightSegmentIndex: dig.newHighlight,
        highlightDigesting: dig.changed,
        food: newFood.length ? newFood : spawnFood(g.rows, g.cols, g.segments, [], g.foodCount, g.segments.map(function (s) { return s.value; })),
        score: g.score + eaten.value,
      });
      if (g.score > g.highScore) g = Object.assign({}, g, { highScore: g.score });
      var target = g.targetNumber;
      if (target !== Infinity && target != null) {
        for (var si = 0; si < g.segments.length; si++) {
          if (g.segments[si].value >= target) {
            g = Object.assign({}, g, { gameWin: true, overlayVisible: true, overlayMessage: '恭喜过关！' });
            break;
          }
        }
      }
      return g;
    }

    var segs = g.segments;
    for (var i = segs.length - 1; i >= 1; i--) {
      segs[i].position.r = segs[i - 1].position.r;
      segs[i].position.c = segs[i - 1].position.c;
    }
    segs[0].position.r = next.r;
    segs[0].position.c = next.c;

    var newHighlight = g.highlightSegmentIndex >= 0 ? g.highlightSegmentIndex + 1 : -1;
    if (newHighlight >= g.segments.length) newHighlight = -1;
    return Object.assign({}, g, { highlightSegmentIndex: newHighlight, highlightDigesting: false });
  }

  /** 用于界面展示：把蛇身 + 食物 填成 rows*cols 的扁平数组，以及 head 位置 */
  function getDisplayBoard(state) {
    if (!state) return { board: [], headRow: 0, headCol: 0 };
    var rows = state.rows || 8;
    var cols = state.cols || 8;
    var board = Array(rows * cols).fill(0);
    var i;
    if (state.food && Array.isArray(state.food)) {
      for (i = 0; i < state.food.length; i++) {
        var f = state.food[i];
        if (f && f.r >= 0 && f.r < rows && f.c >= 0 && f.c < cols) board[f.r * cols + f.c] = f.value || 0;
      }
    }
    if (state.segments && state.segments.length > 0) {
      for (i = 0; i < state.segments.length; i++) {
        var s = state.segments[i];
        if (s && s.position) board[s.position.r * cols + s.position.c] = s.value || 0;
      }
    }
    var head = state.segments && state.segments[0] ? state.segments[0].position : { r: 0, c: 0 };
    return {
      board: board,
      headRow: head.r,
      headCol: head.c,
    };
  }

  function serializeGameState(state) {
    var positions = state.segments.map(function (s) { return { r: s.position.r, c: s.position.c }; });
    var values = state.segments.map(function (s) { return s.value; });
    var food = state.food.map(function (f) { return { r: f.r, c: f.c, value: f.value }; });
    return {
      rows: state.rows,
      cols: state.cols,
      segments: state.segments.map(function (s) { return { position: { r: s.position.r, c: s.position.c }, value: s.value }; }),
      direction: state.direction,
      food: food,
      score: state.score,
      highScore: state.highScore,
      initialLength: state.initialLength,
      foodCount: state.foodCount,
      targetNumber: state.targetNumber === Infinity ? 'Infinity' : state.targetNumber,
      turnIntervalMs: state.turnIntervalMs,
    };
  }

  function deserializeGameState(raw) {
    if (!raw || typeof raw !== 'object') return null;
    var o = raw;
    var rows = Number(o.rows);
    var cols = Number(o.cols);
    if (!Number.isFinite(rows) || rows < MIN_ROWS_COLS || !Number.isFinite(cols) || cols < MIN_ROWS_COLS) return null;
    if (!Array.isArray(o.segments) || o.segments.length === 0) return null;
    var segments = o.segments.map(function (s) {
      return { position: { r: Number(s.position.r), c: Number(s.position.c) }, value: Number(s.value) };
    });
    var dir = o.direction;
    if (dir !== 'up' && dir !== 'down' && dir !== 'left' && dir !== 'right') return null;
    var food = [];
    if (Array.isArray(o.food)) {
      for (var i = 0; i < o.food.length; i++) {
        var f = o.food[i];
        var r = Number(f.r), c = Number(f.c), v = Number(f.value);
        if (Number.isFinite(r) && r >= 0 && r < rows && Number.isFinite(c) && c >= 0 && c < cols && Number.isFinite(v) && v >= 2)
          food.push({ r: r, c: c, value: v });
      }
    }
    var targetNumber = o.targetNumber === 'Infinity' ? Infinity : Number(o.targetNumber);
    return {
      rows: rows,
      cols: cols,
      segments: segments,
      direction: dir,
      food: food,
      score: Math.max(0, Number(o.score) || 0),
      highScore: Math.max(0, Number(o.highScore) || 0),
      gameOver: false,
      gameWin: false,
      overlayVisible: false,
      overlayMessage: '',
      initialLength: Math.max(1, Number(o.initialLength) || segments.length),
      foodCount: Math.max(1, Number(o.foodCount) || 1),
      targetNumber: Number.isFinite(targetNumber) ? targetNumber : DEFAULT_CFG.targetNumber,
      turnIntervalMs: Math.max(50, Number(o.turnIntervalMs) || DEFAULT_CFG.turnIntervalMs),
      highlightSegmentIndex: -1,
      highlightDigesting: false,
    };
  }

  function restart(state) {
    return init(state.highScore, {
      rows: state.rows,
      cols: state.cols,
      initialLength: state.initialLength,
      foodCount: state.foodCount,
      targetNumber: state.targetNumber,
      turnIntervalMs: state.turnIntervalMs,
    });
  }

  return {
    getHighScoreKey: getHighScoreKey,
    STORAGE_HIGH_SCORE: STORAGE_HIGH_SCORE,
    STORAGE_SETTINGS: STORAGE_SETTINGS,
    STORAGE_GAME_STATE: STORAGE_GAME_STATE,
    getDisplayBoard: getDisplayBoard,
    init: init,
    tick: tick,
    setDirection: setDirection,
    canSetDirection: canSetDirection,
    restart: restart,
    serializeGameState: serializeGameState,
    deserializeGameState: deserializeGameState,
  };
});

/**
 * 依赖 logic.js、constants.js
 * 挂到 window。
 */
;(function () {
  'use strict'

  const logic = typeof window !== 'undefined' && window.Game2048Logic;
  const constants = typeof window !== 'undefined' && window.Game2048Constants;
  if (!logic || !constants) {
    console.error('请先加载 logic.js 和 constants.js')
    return
  }

  const initGame = logic.initGame;
  const doMove = logic.doMove;
  const restart = logic.restart;
  const undo = logic.undo;
  const serializeGameState = logic.serializeGameState;
  const deserializeGameState = logic.deserializeGameState;
  const getHighScoreKey = logic.getHighScoreKey;
  const STORAGE_GAME_STATE = logic.STORAGE_GAME_STATE;
  const STORAGE_SETTINGS = logic.STORAGE_SETTINGS;

  const MIN_SWIPE_PX = constants.MIN_SWIPE_PX;
  const getTileImageKeys = constants.getTileImageKeys;
  const SLIDE_MS_PER_CELL = 80;
  function getTileClass(value) {
    if (value <= 0) return 'tile-2'
    if (value > 2048) return 'tile-super'
    return 'tile-' + value
  }
  window.__2048GetTileClass__ = getTileClass

  /** 获取某数字的显示内容：优先图片 > 自定义文字 > 数字 */
  function getTileDisplayContent(state, value) {
    if (value <= 0) return { type: 'number', value: value }
    const key = String(value);
    const img = state.customImages && state.customImages[key];
    if (img && String(img).trim()) return { type: 'image', src: String(img).trim(), value: value }
    const label = state.customLabels && state.customLabels[key];
    if (label != null && String(label).trim() !== '') return { type: 'text', text: String(label).trim(), value: value }
    return { type: 'number', value: value }
  }
  window.__2048GetTileDisplayContent__ = getTileDisplayContent

  function setTileContent(tileEl, state, value) {
    const content = getTileDisplayContent(state, value);
    tileEl.innerHTML = ''
    if (content.type === 'image') {
      const img = document.createElement('img');
      img.src = content.src
      img.alt = String(value)
      img.loading = 'lazy'
      tileEl.appendChild(img)
    } else if (content.type === 'text') {
      tileEl.textContent = content.text
    } else {
      tileEl.textContent = content.value
    }
  }

  function getStorage(key) {
    try { return localStorage.getItem(key) } catch (e) { return null }
  }
  function setStorage(key, value) {
    try { localStorage.setItem(key, value) } catch (e) {}
  }

  let gameState = null;
  const showSettings = false;
  let pendingSettings = {};
  let slideAnimationActive = false;

  const boardEl = document.getElementById('board');
  const boardFloatingEl = document.getElementById('board-floating');
  const boardWrapEl = document.getElementById('board-wrap');
  const scoreEl = document.getElementById('score');
  const highScoreEl = document.getElementById('high-score');

  /* 结算界面由 Vue 模板 + __2048SetGameResult__ / __2048OnResultClose__ / __2048OnResultRestart__ 驱动，不再持 DOM 引用 */

  /**
   * #board-wrap / #board 的 JS 逻辑链（Vue 必用，无 fallback）：
   *
   * 1) render() 里 boardEl.querySelector('.cell') 取第一个格子
   *    → firstCell.offsetWidth 写入 document 根上的 CSS 变量 --cell-size
   *    → 用途：.custom.tile.preview（数字显示弹层里的小预览格）用 var(--cell-size) 做宽高，与棋盘格视觉一致。
   *
   * 2) getCellPositions()：boardEl.querySelectorAll('.cell') + boardWrapEl.getBoundingClientRect()
   *    → 算出每个格子相对 board-wrap 的 left/top/width/height
   *    → 用途：runSlideAnimation 里给 #board-floating 下的浮动格设起始位置和过渡终点，做滑动动画。
   *
   * 3) boardWrapEl：touchstart/touchend、mousedown/mouseup 事件
   *    → 滑动手势 = 触屏（touch 起止点）+ 鼠标（mousedown 起止点），算位移与方向后 handleMove(direction)。
   *
   * 4) 新格角标：由 Vue 状态 newTileIndex + 模板 v-if 渲染，此处只调 __2048SetNewTileIndex__ / __2048ClearNewTileIndex__。
   */

  /** 棋盘由 Vue 渲染，此处只把数据同步给 Vue；无 fallback。 */
  function renderBoard(state, boardOverride) {
    const cols = state.boardWidth;
    const rows = state.boardHeight;
    const board = boardOverride != null ? boardOverride : state.board;
    if (typeof window.__2048SetBoardView__ === 'function') {
      window.__2048SetBoardView__(board, rows, cols, state);
      return;
    }
  }

  function renderHeader(state) {
    if (typeof window.__2048UpdateScores__ === 'function') {
      window.__2048UpdateScores__(state.score, state.highScore, state.boardWidth, state.boardHeight)
      return
    }
    if (scoreEl) scoreEl.textContent = state.score
    if (highScoreEl) highScoreEl.textContent = state.highScore
  }

  function renderOverlay(state) {
    if (typeof window.__2048SetGameResult__ === 'function') {
      const visible = !!(state.overlayVisible && state.overlayMessage);
      const message = state.overlayMessage || '';
      const sub = state.gameOver ? '最终得分：' + state.score : '';
      window.__2048SetGameResult__(visible, message, sub)
    }
  }

  function render(state) {
    if (!state) return
    renderHeader(state)
    renderBoard(state)
    renderOverlay(state)
    const firstCell = boardEl && boardEl.querySelector('.cell');
    if (firstCell && firstCell.offsetWidth > 0) {
      document.documentElement.style.setProperty('--cell-size', firstCell.offsetWidth + 'px')
    }
  }

  function getCellPositions() {
    const cells = boardEl.querySelectorAll('.cell');
    const wrapRect = boardWrapEl.getBoundingClientRect();
    const positions = [];
    for (let i = 0; i < cells.length; i++) {
      const r = cells[i].getBoundingClientRect();
      positions.push({
        left: r.left - wrapRect.left,
        top: r.top - wrapRect.top,
        width: r.width,
        height: r.height
      })
    }
    return positions
  }

  function runSlideAnimation(slides, finalState, stateBeforeMove, newTileIndex) {
    if (slideAnimationActive || !slides || slides.length === 0) {
      gameState = finalState
      render(gameState)
      if (typeof window.__2048SetNewTileIndex__ === 'function') window.__2048SetNewTileIndex__(newTileIndex)
      return
    }
    slideAnimationActive = true
    const displayBoard = stateBeforeMove.board.slice();
    for (let s = 0; s < slides.length; s++) {
      const path = slides[s].path
      if (path && path.length >= 2) displayBoard[path[0]] = 0
    }
    renderHeader(stateBeforeMove)
    renderBoard(stateBeforeMove, displayBoard)
    renderOverlay(stateBeforeMove)

    const positions = getCellPositions();
    boardFloatingEl.innerHTML = ''
    boardFloatingEl.style.pointerEvents = 'none'

    let maxDuration = 0;
    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      const path = slide.path
      if (!path || path.length < 2) continue
      const fromIdx = path[0];
      const toIdx = path[path.length - 1];
      const duration = (path.length - 1) * SLIDE_MS_PER_CELL;
      if (duration > maxDuration) maxDuration = duration

      const fromPos = positions[fromIdx];
      const toPos = positions[toIdx];
      if (!fromPos || !toPos) continue

      const tile = document.createElement('div');
      tile.className = 'floating-tile ' + getTileClass(slide.value)
      setTileContent(tile, finalState, slide.value)
      tile.style.left = fromPos.left + 'px'
      tile.style.top = fromPos.top + 'px'
      tile.style.width = fromPos.width + 'px'
      tile.style.height = fromPos.height + 'px'
      tile.style.transitionDuration = duration + 'ms'
      boardFloatingEl.appendChild(tile)

      ;(function (tileRef, toPosRef) {
        requestAnimationFrame(function () {
          tileRef.style.left = toPosRef.left + 'px'
          tileRef.style.top = toPosRef.top + 'px'
          tileRef.style.width = toPosRef.width + 'px'
          tileRef.style.height = toPosRef.height + 'px'
        })
      })(tile, toPos)
    }

    setTimeout(function () {
      boardFloatingEl.innerHTML = ''
      slideAnimationActive = false
      gameState = finalState
      render(gameState)
      if (typeof window.__2048SetNewTileIndex__ === 'function') window.__2048SetNewTileIndex__(newTileIndex)
    }, maxDuration + 50)
  }

  function clearSlideAnimation() {
    slideAnimationActive = false
    boardFloatingEl.innerHTML = ''
  }

  function handleMove(direction) {
    if (typeof window.__2048ClearNewTileIndex__ === 'function') window.__2048ClearNewTileIndex__()
    if (slideAnimationActive) return
    if (gameState.gameWin) {
      gameState = Object.assign({}, gameState, { gameWin: false, overlayVisible: false, overlayMessage: '' })
    }
    const stateBeforeMove = gameState;
    const result = doMove(gameState, direction);
    if (!result.moved) {
      render(gameState)
      return
    }
    gameState = result.state
    const highKey = getHighScoreKey(gameState.boardWidth, gameState.boardHeight);
    const prevHigh = Number(getStorage(highKey)) || 0;
    if (gameState.highScore > prevHigh) setStorage(highKey, String(gameState.highScore))
    if (result.slides && result.slides.length > 0) {
      runSlideAnimation(result.slides, gameState, stateBeforeMove, result.newTileIndex)
    } else {
      render(gameState)
      if (typeof window.__2048SetNewTileIndex__ === 'function') window.__2048SetNewTileIndex__(result.newTileIndex)
    }
  }

  function handleRestart() {
    clearSlideAnimation()
    gameState = restart(gameState)
    render(gameState)
  }

  function handleUndo() {
    clearSlideAnimation()
    gameState = undo(gameState)
    render(gameState)
  }

  function loadSettingsFromStorage() {
    try {
      const raw = getStorage(STORAGE_SETTINGS);
      if (!raw) return null
      const o = JSON.parse(raw);
      if (!o || typeof o !== 'object') return null
      const s = {};
      if (Number(o.boardWidth) >= 2) s.boardWidth = Number(o.boardWidth)
      if (Number(o.boardHeight) >= 2) s.boardHeight = Number(o.boardHeight)
      if (o.targetNumber !== undefined) s.targetNumber = o.targetNumber === 'Infinity' ? Infinity : Number(o.targetNumber)
      s.initialTiles = 2
      if (typeof o.showNewTileMarker === 'boolean') s.showNewTileMarker = o.showNewTileMarker
      else if (typeof o.showHighlight === 'boolean') s.showNewTileMarker = o.showHighlight
      if (typeof o.newTileOnMidStop === 'boolean') s.newTileOnMidStop = o.newTileOnMidStop
      if (o.customLabels && typeof o.customLabels === 'object') s.customLabels = o.customLabels
      if (o.customImages && typeof o.customImages === 'object') s.customImages = o.customImages
      return Object.keys(s).length ? s : null
    } catch (e) { return null }
  }

  function saveSettingsToStorage() {
    try {
      const s = {
        boardWidth: pendingSettings.boardWidth,
        boardHeight: pendingSettings.boardHeight,
        targetNumber: pendingSettings.targetNumber === Infinity ? 'Infinity' : pendingSettings.targetNumber,
        initialTiles: pendingSettings.initialTiles,
        showNewTileMarker: pendingSettings.showNewTileMarker,
        newTileOnMidStop: pendingSettings.newTileOnMidStop,
        customLabels: pendingSettings.customLabels && typeof pendingSettings.customLabels === 'object'
                      ? pendingSettings.customLabels : {},
        customImages: pendingSettings.customImages && typeof pendingSettings.customImages === 'object'
                      ? pendingSettings.customImages : {},
      };
      setStorage(STORAGE_SETTINGS, JSON.stringify(s))
    } catch (e) {}
  }

  function saveSettingsFromGameState() {
    if (!gameState) return
    try {
      const s = {
        boardWidth: gameState.boardWidth,
        boardHeight: gameState.boardHeight,
        targetNumber: gameState.targetNumber === Infinity ? 'Infinity' : gameState.targetNumber,
        initialTiles: gameState.initialTiles,
        showNewTileMarker: gameState.showNewTileMarker,
        newTileOnMidStop: gameState.newTileOnMidStop,
        customLabels: gameState.customLabels && typeof gameState.customLabels === 'object' ? gameState.customLabels
                                                                                           : {},
        customImages: gameState.customImages && typeof gameState.customImages === 'object' ? gameState.customImages : {},
      };
      setStorage(STORAGE_SETTINGS, JSON.stringify(s))
    } catch (e) {}
  }

  function saveQuickSettingsToStorage(showNewTileMarker, newTileOnMidStop) {
    try {
      const raw = getStorage(STORAGE_SETTINGS);
      let o = raw && (function() { try { return JSON.parse(raw); } catch (e) { return null; } })() || {};
      if (typeof o !== 'object') o = {}
      o.showNewTileMarker = showNewTileMarker
      o.newTileOnMidStop = newTileOnMidStop
      setStorage(STORAGE_SETTINGS, JSON.stringify(o))
    } catch (e) {}
  }

  window.__2048ApplyQuickSettings__ = function (showNewTileMarker) {
    if (!gameState) return
    gameState = Object.assign({}, gameState, { showNewTileMarker: !!showNewTileMarker })
    saveQuickSettingsToStorage(gameState.showNewTileMarker, gameState.newTileOnMidStop)
    render(gameState)
  }

  window.__2048OpenCustomTiles__ = function () {
    if (!gameState) return
    pendingSettings.boardWidth = gameState.boardWidth
    pendingSettings.boardHeight = gameState.boardHeight
    pendingSettings.targetNumber = gameState.targetNumber
    pendingSettings.customLabels = gameState.customLabels ? Object.assign({}, gameState.customLabels) : {}
    pendingSettings.customImages = gameState.customImages ? Object.assign({}, gameState.customImages) : {}
  }

  window.__2048ApplyCustomTiles__ = function () {
    if (!gameState) return
    gameState = Object.assign({}, gameState, {
      customLabels: pendingSettings.customLabels && typeof pendingSettings.customLabels === 'object' ? Object.assign({}, pendingSettings.customLabels) : {},
      customImages: pendingSettings.customImages && typeof pendingSettings.customImages === 'object' ? Object.assign({}, pendingSettings.customImages) : {}
    })
    saveSettingsFromGameState()
    render(gameState)
  }

  window.__2048GetBoardSettings__ = function () {
    if (!gameState) return null
    return { boardHeight: gameState.boardHeight, boardWidth: gameState.boardWidth, targetNumber: gameState.targetNumber }
  }

  window.__2048ApplyBoardSettings__ = function (obj) {
    if (!gameState || !obj) return
    pendingSettings = {
      boardWidth: obj.boardWidth != null ? obj.boardWidth : gameState.boardWidth,
      boardHeight: obj.boardHeight != null ? obj.boardHeight : gameState.boardHeight,
      targetNumber: obj.targetNumber != null ? obj.targetNumber : gameState.targetNumber,
      initialTiles: 2,
      showNewTileMarker: gameState.showNewTileMarker,
      newTileOnMidStop: gameState.newTileOnMidStop,
      customLabels: gameState.customLabels ? Object.assign({}, gameState.customLabels) : {},
      customImages: gameState.customImages ? Object.assign({}, gameState.customImages) : {}
    }
    applyBoardSettingsFromPending()
    if (typeof window.__2048SyncToolbarSettings__ === 'function') window.__2048SyncToolbarSettings__()
  }

  function applyBoardSettingsFromPending() {
    if (!gameState) return
    pendingSettings.initialTiles = 2
    saveSettingsToStorage()
    const needRestart = pendingSettings.boardWidth !== gameState.boardWidth || pendingSettings.boardHeight
                        !== gameState.boardHeight || pendingSettings.targetNumber !== gameState.targetNumber
                        || pendingSettings.initialTiles !== gameState.initialTiles;
    if (needRestart) {
      const highForNewSize = Number(
        getStorage(getHighScoreKey(pendingSettings.boardWidth, pendingSettings.boardHeight))) || 0;
      gameState = initGame(highForNewSize, pendingSettings)
    } else {
      gameState = Object.assign({}, gameState, { customLabels: pendingSettings.customLabels || {}, customImages: pendingSettings.customImages || {} })
    }
    render(gameState)
  }

  function isPowerOf2(n) {
    if (typeof n !== 'number' || n < 2 || !Number.isFinite(n)) return false
    return (n & n - 1) === 0
  }

  function getCustomTileKeysForList() {
    const baseKeys = getTileImageKeys(pendingSettings.targetNumber);
    const maxBase = baseKeys.length ? parseInt(baseKeys[baseKeys.length - 1], 10) : 2;
    const extra = {};
    let keys = pendingSettings.customLabels && typeof pendingSettings.customLabels === 'object' ? Object.keys(
      pendingSettings.customLabels) : [];
    for (let i = 0; i < keys.length; i++) {
      const n = parseInt(keys[i], 10)
      if (isPowerOf2(n) && n > maxBase) extra[n] = true
    }
    keys = pendingSettings.customImages && typeof pendingSettings.customImages === 'object' ? Object.keys(pendingSettings.customImages) : []
    for (let j = 0; j < keys.length; j++) {
      const num = parseInt(keys[j], 10)
      if (isPowerOf2(num) && num > maxBase) extra[num] = true
    }
    const extraKeys = Object.keys(extra).map(Number).sort(function(a, b) { return a - b; });
    return baseKeys.concat(extraKeys.map(String))
  }

  window.__2048GetPendingCustomTilesForVue__ = function () {
    if (!pendingSettings.customLabels) pendingSettings.customLabels = {}
    if (!pendingSettings.customImages) pendingSettings.customImages = {}
    return {
      customLabels: Object.assign({}, pendingSettings.customLabels),
      customImages: Object.assign({}, pendingSettings.customImages),
      tileKeys: getCustomTileKeysForList()
    }
  }
  window.__2048SetPendingCustomTiles__ = function (labels, images) {
    pendingSettings.customLabels = labels && typeof labels === 'object' ? Object.assign({}, labels) : {}
    pendingSettings.customImages = images && typeof images === 'object' ? Object.assign({}, images) : {}
  }
  function init() {
    const loaded = loadSettingsFromStorage();
    let restored = null;
    try {
      const stateRaw = getStorage(STORAGE_GAME_STATE);
      if (stateRaw) restored = deserializeGameState(JSON.parse(stateRaw))
    } catch (e) {}
    if (restored) {
      gameState = restored
      const keyRestored = getHighScoreKey(gameState.boardWidth, gameState.boardHeight);
      const storedRestored = Number(getStorage(keyRestored)) || 0;
      if (gameState.highScore > storedRestored) setStorage(keyRestored, String(gameState.highScore))
    } else {
      const w = loaded && loaded.boardWidth || 4;
      const h = loaded && loaded.boardHeight || 4;
      const highScore = Number(getStorage(getHighScoreKey(w, h))) || 0;
      gameState = initGame(highScore, loaded || undefined)
    }
    render(gameState)
    if (typeof window.__2048SetQuickSettings__ === 'function') {
      window.__2048SetQuickSettings__({ showNewTileMarker: gameState.showNewTileMarker, newTileOnMidStop: gameState.newTileOnMidStop })
    }
    if (typeof window.__2048SyncToolbarSettings__ === 'function') window.__2048SyncToolbarSettings__()
  }

  function saveState() {
    if (!gameState) return
    if (!gameState.gameOver && !gameState.gameWin) {
      setStorage(STORAGE_GAME_STATE, JSON.stringify(serializeGameState(gameState)))
    } else {
      try { localStorage.removeItem(STORAGE_GAME_STATE) } catch (e) {}
    }
  }

  /* 工具栏「新局」由 Vue 的 onRestart 调用 __2048ApplyBoardSettings__，不再在此绑定 handleRestart */
  document.getElementById('btn-undo').addEventListener('click', handleUndo)

  window.__2048OnResultClose__ = function () {
    if (!gameState) return
    gameState = Object.assign({}, gameState, { overlayVisible: false, overlayMessage: '' })
    render(gameState)
  }
  window.__2048OnResultRestart__ = handleRestart

  document.addEventListener('keydown', function (e) {
    if (showSettings) return
    if (gameState.overlayVisible) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        gameState = Object.assign({}, gameState, { overlayVisible: false, overlayMessage: '' })
        render(gameState)
      }
      return
    }
    let direction = null;
    if (e.key === 'ArrowLeft') direction = 'left'
    else if (e.key === 'ArrowRight') direction = 'right'
    else if (e.key === 'ArrowUp') direction = 'up'
    else if (e.key === 'ArrowDown') direction = 'down'
    if (direction) {
      e.preventDefault()
      handleMove(direction)
    }
  })

  let touchStartX = 0;
  let touchStartY = 0;
  boardWrapEl.addEventListener('touchstart', function (e) {
    const t = e.touches[0];
    if (t) { touchStartX = t.clientX; touchStartY = t.clientY }
  }, { passive: true })
  boardWrapEl.addEventListener('touchend', function (e) {
    const t = e.changedTouches[0];
    if (!t || !gameState || showSettings) return
    if (gameState.overlayVisible) {
      gameState = Object.assign({}, gameState, { overlayVisible: false, overlayMessage: '' })
      render(gameState)
      return
    }
    const dx = t.clientX - touchStartX;
    const dy = t.clientY - touchStartY;
    const ax = Math.abs(dx);
    const ay = Math.abs(dy);
    if (Math.max(ax, ay) < MIN_SWIPE_PX) return
    const dir = ax >= ay ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    handleMove(dir)
  }, { passive: true })

  let mouseDownX = 0;
  let mouseDownY = 0;
  boardWrapEl.addEventListener('mousedown', function (e) {
    mouseDownX = e.clientX
    mouseDownY = e.clientY
  })
  boardWrapEl.addEventListener('mouseup', function (e) {
    if (!gameState || showSettings) return
    if (gameState.overlayVisible) return
    const dx = e.clientX - mouseDownX;
    const dy = e.clientY - mouseDownY;
    const ax = Math.abs(dx);
    const ay = Math.abs(dy);
    if (Math.max(ax, ay) < MIN_SWIPE_PX) return
    const dir = ax >= ay ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    handleMove(dir)
  })

  window.addEventListener('beforeunload', saveState)

  window.__2048Init__ = init
  /* 由页面内联脚本在 Vue mount 后调用 __2048Init__()，确保 __2048SetBoardView__ 已注册后再 render */
})()

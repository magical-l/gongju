/**
 * 2048 网页版 - 全 DOM+CSS 驱动。依赖 logic.js、constants.js（挂到 window）。
 */
;(function () {
  'use strict'

  var logic = typeof window !== 'undefined' && window.Game2048Logic
  var constants = typeof window !== 'undefined' && window.Game2048Constants
  if (!logic || !constants) {
    console.error('请先加载 logic.js 和 constants.js')
    return
  }

  var initGame = logic.initGame
  var doMove = logic.doMove
  var restart = logic.restart
  var undo = logic.undo
  var serializeGameState = logic.serializeGameState
  var deserializeGameState = logic.deserializeGameState
  var STORAGE_HIGH_SCORE = logic.STORAGE_HIGH_SCORE
  var getHighScoreKey = logic.getHighScoreKey
  var STORAGE_GAME_STATE = logic.STORAGE_GAME_STATE
  var STORAGE_SETTINGS = logic.STORAGE_SETTINGS

  var TILE_COLORS = constants.TILE_COLORS
  var TILE_SUPER = constants.TILE_SUPER
  var SIZE_OPTIONS = constants.SIZE_OPTIONS
  var TARGET_OPTIONS = constants.TARGET_OPTIONS
  var TARGET_LABELS = constants.TARGET_LABELS
  var MIN_SWIPE_PX = constants.MIN_SWIPE_PX
  var TILE_IMAGE_KEYS = constants.TILE_IMAGE_KEYS
  var getTileImageKeys = constants.getTileImageKeys
  var getDisplayLabel = constants.getDisplayLabel
  var WEB_ENDPOINT = 'web'

  var SLIDE_MS_PER_CELL = 80
  var CUSTOM_LABEL_MAX_LEN = 10
  /** 网页端支持更大棋盘；4–6 与小程序一致，7–8 增加策略深度，再大易拖沓（常见变体多为 5x5/6x6，少数 8x8） */
  var WEB_SIZE_OPTIONS = [4, 5, 6, 7, 8]

  function getMergedIndicesFromSlides(slides) {
    var set = {}
    for (var i = 0; i < slides.length; i++) {
      var p = slides[i].path
      if (p && p.length >= 2) set[p[p.length - 1]] = true
    }
    return Object.keys(set).map(Number)
  }

  function getTileClass(value) {
    if (value <= 0) return 'tile-2'
    if (value > 2048) return 'tile-super'
    return 'tile-' + value
  }
  window.__2048GetTileClass__ = getTileClass

  /** 获取某数字的显示内容：优先图片 > 自定义文字 > 数字 */
  function getTileDisplayContent(state, value) {
    if (value <= 0) return { type: 'number', value: value }
    var key = String(value)
    var img = state.customImages && state.customImages[key]
    if (img && String(img).trim()) return { type: 'image', src: String(img).trim(), value: value }
    var label = state.customLabels && state.customLabels[key]
    if (label != null && String(label).trim() !== '') return { type: 'text', text: String(label).trim(), value: value }
    return { type: 'number', value: value }
  }
  window.__2048GetTileDisplayContent__ = getTileDisplayContent

  function setTileContent(tileEl, state, value, className) {
    var content = getTileDisplayContent(state, value)
    tileEl.innerHTML = ''
    if (content.type === 'image') {
      var img = document.createElement('img')
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

  var gameState = null
  var showSettings = false
  var pendingSettings = {}
  var slideAnimationActive = false

  var boardEl = document.getElementById('board')
  var boardFloatingEl = document.getElementById('board-floating')
  var boardWrapEl = document.getElementById('board-wrap')
  var scoreEl = document.getElementById('score')
  var highScoreEl = document.getElementById('high-score')
  /* 结算界面由 Vue 模板 + __2048SetGameResult__ / __2048OnResultClose__ / __2048OnResultRestart__ 驱动，不再持 DOM 引用 */

  function renderBoard(state, boardOverride) {
    var cols = state.boardWidth
    var rows = state.boardHeight
    var board = boardOverride != null ? boardOverride : state.board
    if (typeof window.__2048SetBoardView__ === 'function') {
      window.__2048SetBoardView__(board, rows, cols, state)
      return
    }
    boardEl.style.gridTemplateColumns = 'repeat(' + cols + ', 1fr)'
    boardEl.style.gridTemplateRows = 'repeat(' + rows + ', 1fr)'
    boardEl.innerHTML = ''
    for (var i = 0; i < cols * rows; i++) {
      var cell = document.createElement('div')
      cell.className = 'cell'
      cell.dataset.index = i
      var value = board[i] || 0
      if (value > 0) {
        var tile = document.createElement('div')
        tile.className = 'tile ' + getTileClass(value)
        tile.dataset.index = i
        setTileContent(tile, state, value)
        cell.appendChild(tile)
      }
      boardEl.appendChild(cell)
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
      var visible = !!(state.overlayVisible && state.overlayMessage)
      var message = state.overlayMessage || ''
      var sub = state.gameOver ? '最终得分：' + state.score : ''
      window.__2048SetGameResult__(visible, message, sub)
      return
    }
  }

  function render(state) {
    if (!state) return
    renderHeader(state)
    renderBoard(state)
    renderOverlay(state)
    var firstCell = boardEl && boardEl.querySelector('.cell')
    if (firstCell && firstCell.offsetWidth > 0) {
      document.documentElement.style.setProperty('--cell-size', firstCell.offsetWidth + 'px')
    }
  }

  function addNewTileMarker(index, state) {
    if (index < 0 || !state.showNewTileMarker) return
    var cell = boardEl.querySelector('.cell[data-index="' + index + '"]')
    if (!cell) return
    var tileEl = cell.querySelector('.tile')
    if (!tileEl || tileEl.nodeType !== 1) return
    var badge = document.createElement('span')
    badge.className = 'tile-new-badge'
    badge.textContent = '!'
    tileEl.appendChild(badge)
  }

  function getCellPositions() {
    var cells = boardEl.querySelectorAll('.cell')
    var wrapRect = boardWrapEl.getBoundingClientRect()
    var positions = []
    for (var i = 0; i < cells.length; i++) {
      var r = cells[i].getBoundingClientRect()
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
      addNewTileMarker(newTileIndex, finalState)
      return
    }
    slideAnimationActive = true
    var cols = finalState.boardWidth
    var rows = finalState.boardHeight

    var displayBoard = stateBeforeMove.board.slice()
    for (var s = 0; s < slides.length; s++) {
      var path = slides[s].path
      if (path && path.length >= 2) displayBoard[path[0]] = 0
    }
    renderHeader(stateBeforeMove)
    renderBoard(stateBeforeMove, displayBoard)
    renderOverlay(stateBeforeMove)

    var positions = getCellPositions()
    boardFloatingEl.innerHTML = ''
    boardFloatingEl.style.pointerEvents = 'none'

    var maxDuration = 0
    for (var i = 0; i < slides.length; i++) {
      var slide = slides[i]
      var path = slide.path
      if (!path || path.length < 2) continue
      var fromIdx = path[0]
      var toIdx = path[path.length - 1]
      var duration = (path.length - 1) * SLIDE_MS_PER_CELL
      if (duration > maxDuration) maxDuration = duration

      var fromPos = positions[fromIdx]
      var toPos = positions[toIdx]
      if (!fromPos || !toPos) continue

      var tile = document.createElement('div')
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
      addNewTileMarker(newTileIndex, finalState)
    }, maxDuration + 50)
  }

  function clearSlideAnimation() {
    slideAnimationActive = false
    boardFloatingEl.innerHTML = ''
  }

  function handleMove(direction) {
    if (slideAnimationActive) return
    if (gameState.gameWin) {
      gameState = Object.assign({}, gameState, { gameWin: false, overlayVisible: false, overlayMessage: '' })
    }
    var stateBeforeMove = gameState
    var result = doMove(gameState, direction)
    if (!result.moved) {
      render(gameState)
      return
    }
    gameState = result.state
    var highKey = getHighScoreKey(gameState.boardWidth, gameState.boardHeight)
    var prevHigh = Number(getStorage(highKey)) || 0
    if (gameState.highScore > prevHigh) setStorage(highKey, String(gameState.highScore))
    if (result.slides && result.slides.length > 0) {
      runSlideAnimation(result.slides, gameState, stateBeforeMove, result.newTileIndex)
    } else {
      render(gameState)
      addNewTileMarker(result.newTileIndex, gameState)
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
      var raw = getStorage(STORAGE_SETTINGS)
      if (!raw) return null
      var o = JSON.parse(raw)
      if (!o || typeof o !== 'object') return null
      var s = {}
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
      var s = {
        boardWidth: pendingSettings.boardWidth,
        boardHeight: pendingSettings.boardHeight,
        targetNumber: pendingSettings.targetNumber === Infinity ? 'Infinity' : pendingSettings.targetNumber,
        initialTiles: pendingSettings.initialTiles,
        showNewTileMarker: pendingSettings.showNewTileMarker,
        newTileOnMidStop: pendingSettings.newTileOnMidStop,
        customLabels: pendingSettings.customLabels && typeof pendingSettings.customLabels === 'object' ? pendingSettings.customLabels : {},
        customImages: pendingSettings.customImages && typeof pendingSettings.customImages === 'object' ? pendingSettings.customImages : {}
      }
      setStorage(STORAGE_SETTINGS, JSON.stringify(s))
    } catch (e) {}
  }

  function saveSettingsFromGameState() {
    if (!gameState) return
    try {
      var s = {
        boardWidth: gameState.boardWidth,
        boardHeight: gameState.boardHeight,
        targetNumber: gameState.targetNumber === Infinity ? 'Infinity' : gameState.targetNumber,
        initialTiles: gameState.initialTiles,
        showNewTileMarker: gameState.showNewTileMarker,
        newTileOnMidStop: gameState.newTileOnMidStop,
        customLabels: gameState.customLabels && typeof gameState.customLabels === 'object' ? gameState.customLabels : {},
        customImages: gameState.customImages && typeof gameState.customImages === 'object' ? gameState.customImages : {}
      }
      setStorage(STORAGE_SETTINGS, JSON.stringify(s))
    } catch (e) {}
  }

  function saveQuickSettingsToStorage(showNewTileMarker, newTileOnMidStop) {
    try {
      var raw = getStorage(STORAGE_SETTINGS)
      var o = (raw && (function () { try { return JSON.parse(raw) } catch (e) { return null } })()) || {}
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
    var needRestart = pendingSettings.boardWidth !== gameState.boardWidth || pendingSettings.boardHeight !== gameState.boardHeight || pendingSettings.targetNumber !== gameState.targetNumber || pendingSettings.initialTiles !== gameState.initialTiles
    if (needRestart) {
      var highForNewSize = Number(getStorage(getHighScoreKey(pendingSettings.boardWidth, pendingSettings.boardHeight))) || 0
      gameState = initGame(highForNewSize, pendingSettings)
    } else {
      gameState = Object.assign({}, gameState, { customLabels: pendingSettings.customLabels || {}, customImages: pendingSettings.customImages || {} })
    }
    render(gameState)
  }

  function isPowerOf2(n) {
    if (typeof n !== 'number' || n < 2 || !Number.isFinite(n)) return false
    return (n & (n - 1)) === 0
  }

  function getCustomTileKeysForList() {
    var baseKeys = getTileImageKeys(pendingSettings.targetNumber)
    var maxBase = baseKeys.length ? parseInt(baseKeys[baseKeys.length - 1], 10) : 2
    var extra = {}
    var keys = pendingSettings.customLabels && typeof pendingSettings.customLabels === 'object' ? Object.keys(pendingSettings.customLabels) : []
    for (var i = 0; i < keys.length; i++) {
      var n = parseInt(keys[i], 10)
      if (isPowerOf2(n) && n > maxBase) extra[n] = true
    }
    keys = pendingSettings.customImages && typeof pendingSettings.customImages === 'object' ? Object.keys(pendingSettings.customImages) : []
    for (var j = 0; j < keys.length; j++) {
      n = parseInt(keys[j], 10)
      if (isPowerOf2(n) && n > maxBase) extra[n] = true
    }
    var extraKeys = Object.keys(extra).map(Number).sort(function (a, b) { return a - b })
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
  function escapeAttr(s) {
    if (s == null) return ''
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
  }

  function init() {
    var loaded = loadSettingsFromStorage()
    var restored = null
    try {
      var stateRaw = getStorage(STORAGE_GAME_STATE)
      if (stateRaw) restored = deserializeGameState(JSON.parse(stateRaw))
    } catch (e) {}
    if (restored) {
      gameState = restored
      var keyRestored = getHighScoreKey(gameState.boardWidth, gameState.boardHeight)
      var storedRestored = Number(getStorage(keyRestored)) || 0
      if (gameState.highScore > storedRestored) setStorage(keyRestored, String(gameState.highScore))
    } else {
      var w = (loaded && loaded.boardWidth) || 4
      var h = (loaded && loaded.boardHeight) || 4
      var highScore = Number(getStorage(getHighScoreKey(w, h))) || 0
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
    var direction = null
    if (e.key === 'ArrowLeft') direction = 'left'
    else if (e.key === 'ArrowRight') direction = 'right'
    else if (e.key === 'ArrowUp') direction = 'up'
    else if (e.key === 'ArrowDown') direction = 'down'
    if (direction) {
      e.preventDefault()
      handleMove(direction)
    }
  })

  var touchStartX = 0
  var touchStartY = 0
  boardWrapEl.addEventListener('touchstart', function (e) {
    var t = e.touches[0]
    if (t) { touchStartX = t.clientX; touchStartY = t.clientY }
  }, { passive: true })
  boardWrapEl.addEventListener('touchend', function (e) {
    var t = e.changedTouches[0]
    if (!t || !gameState || showSettings) return
    if (gameState.overlayVisible) {
      gameState = Object.assign({}, gameState, { overlayVisible: false, overlayMessage: '' })
      render(gameState)
      return
    }
    var dx = t.clientX - touchStartX
    var dy = t.clientY - touchStartY
    var ax = Math.abs(dx)
    var ay = Math.abs(dy)
    if (Math.max(ax, ay) < MIN_SWIPE_PX) return
    var dir = ax >= ay ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up')
    handleMove(dir)
  }, { passive: true })

  var mouseDownX = 0
  var mouseDownY = 0
  boardWrapEl.addEventListener('mousedown', function (e) {
    mouseDownX = e.clientX
    mouseDownY = e.clientY
  })
  boardWrapEl.addEventListener('mouseup', function (e) {
    if (!gameState || showSettings) return
    if (gameState.overlayVisible) return
    var dx = e.clientX - mouseDownX
    var dy = e.clientY - mouseDownY
    var ax = Math.abs(dx)
    var ay = Math.abs(dy)
    if (Math.max(ax, ay) < MIN_SWIPE_PX) return
    var dir = ax >= ay ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up')
    handleMove(dir)
  })

  window.addEventListener('beforeunload', saveState)

  window.__2048Init__ = init
  /* 由页面内联脚本在 Vue mount 后调用 __2048Init__()，确保 __2048SetBoardView__ 已注册后再 render */
})()

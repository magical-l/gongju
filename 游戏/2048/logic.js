/**
 * 2048 纯逻辑。网页侧通过 script 加载时挂到 window.Game2048Logic
 * （与小程序 test1 共用同一套逻辑，此处为静态页面工具内副本）
 */
;(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory()
  } else {
    root.Game2048Logic = factory()
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict'
  var STORAGE_HIGH_SCORE = '2048-high-score'
  function getHighScoreKey(boardWidth, boardHeight) {
    return STORAGE_HIGH_SCORE + '-' + (boardWidth || 4) + '-' + (boardHeight || 4)
  }
var STORAGE_SETTINGS = '2048-settings'
var STORAGE_GAME_STATE = '2048-game-state'

var DEFAULT_STATE = {
  board: [],
  score: 0,
  highScore: 0,
  gameOver: false,
  gameWin: false,
  overlayVisible: false,
  overlayMessage: '',
  boardWidth: 4,
  boardHeight: 4,
  targetNumber: 2048,
  initialTiles: 2,
  showNewTileMarker: true,
  useAccelerometer: false,
  accelerometerSpeed: 'medium',
  newTileOnMidStop: false,
  customLabels: {},
  customImages: {},
  moveHistory: [],
}

/** 某格是“合并结果”时，该格在行内的两个来源位置 [靠前的, 靠后的]（都滑到这一格） */
function mergeLine(line, originalPositions, lineLength) {
  var filtered = []
  var filteredPositions = []
  for (var i = 0; i < line.length; i++) {
    if (line[i] !== 0) {
      filtered.push(line[i])
      filteredPositions.push(originalPositions[i])
    }
  }
  var scoreAdd = 0
  var mergeResults = new Array(filtered.length)
  for (var i = 0; i < filtered.length - 1; i++) {
    if (filtered[i] === filtered[i + 1]) {
      mergeResults[i] = [filteredPositions[i], filteredPositions[i + 1]]
      var moverFrom = filteredPositions[i + 1]
      filtered[i] *= 2
      scoreAdd += filtered[i]
      filtered[i + 1] = 0
      filteredPositions[i + 1] = filteredPositions[i]
      filteredPositions[i] = moverFrom
    }
  }
  var finalFiltered = []
  var finalPositions = []
  for (var i = 0; i < filtered.length; i++) {
    if (filtered[i] !== 0) {
      finalFiltered.push(filtered[i])
      finalPositions.push(filteredPositions[i])
    }
  }
  var newPositions = []
  for (var i = 0; i < lineLength; i++) {
    newPositions.push(i < finalFiltered.length ? finalPositions[i] : -1)
  }
  while (finalFiltered.length < lineLength) finalFiltered.push(0)
  return { merged: finalFiltered, newPositions: newPositions, scoreAdd: scoreAdd, mergeSources: mergeResults }
}

function buildPath(fromIndex, toIndex, cols, direction) {
  var path = []
  if (fromIndex === toIndex) return [fromIndex]
  var fromRow = Math.floor(fromIndex / cols)
  var fromCol = fromIndex % cols
  var toRow = Math.floor(toIndex / cols)
  var toCol = toIndex % cols
  if (direction === 'left') {
    for (var c = fromCol; c >= toCol; c--) path.push(fromRow * cols + c)
  } else if (direction === 'right') {
    for (var c = fromCol; c <= toCol; c++) path.push(fromRow * cols + c)
  } else if (direction === 'up') {
    for (var r = fromRow; r >= toRow; r--) path.push(r * cols + fromCol)
  } else {
    for (var r = fromRow; r <= toRow; r++) path.push(r * cols + fromCol)
  }
  return path
}

function moveLeft(state) {
  var cols = state.boardWidth
  var rows = state.boardHeight
  var board = state.board.slice()
  var scoreAdd = 0
  var moved = false
  var slides = []
  for (var row = 0; row < rows; row++) {
    var line = []
    var originalPositions = []
    for (var col = 0; col < cols; col++) {
      var index = row * cols + col
      line.push(board[index])
      originalPositions.push(index)
    }
    var result = mergeLine(line, originalPositions, cols)
    var merged = result.merged
    var newPositions = result.newPositions
    var add = result.scoreAdd
    var mergeSources = result.mergeSources
    scoreAdd += add
    for (var col = 0; col < cols; col++) {
      var newIndex = row * cols + col
      var newValue = merged[col]
      if (newValue !== board[newIndex]) moved = true
      board[newIndex] = newValue
      if (newValue === 0) continue
      var sources = mergeSources[col]
      if (sources != null) {
        for (var k = 0; k < sources.length; k++) {
          var fromIndex = sources[k]
          slides.push({ path: buildPath(fromIndex, newIndex, cols, 'left'), value: state.board[fromIndex] })
        }
      } else if (newPositions[col] >= 0) {
        slides.push({ path: buildPath(newPositions[col], newIndex, cols, 'left'), value: state.board[newPositions[col]] })
      }
    }
  }
  if (!moved) return { state: state, moved: false, slides: [] }
  var history = state.moveHistory.slice()
  if (history.length >= 50) history.shift()
  history.push({ board: state.board.slice(), score: state.score })
  return { state: Object.assign({}, state, { board: board, score: state.score + scoreAdd, moveHistory: history }), moved: true, slides: slides }
}

function moveRight(state) {
  var cols = state.boardWidth
  var rows = state.boardHeight
  var board = state.board.slice()
  var scoreAdd = 0
  var moved = false
  var slides = []
  for (var row = 0; row < rows; row++) {
    var line = []
    var originalPositions = []
    for (var col = cols - 1; col >= 0; col--) {
      var index = row * cols + col
      line.push(board[index])
      originalPositions.push(index)
    }
    var result = mergeLine(line, originalPositions, cols)
    var merged = result.merged
    var newPositions = result.newPositions
    var add = result.scoreAdd
    var mergeSources = result.mergeSources
    scoreAdd += add
    for (var col = 0; col < cols; col++) {
      var newIndex = row * cols + col
      var lineSlot = cols - 1 - col
      var newValue = merged[lineSlot]
      if (newValue !== board[newIndex]) moved = true
      board[newIndex] = newValue
      if (newValue === 0) continue
      var sources = mergeSources[lineSlot]
      if (sources != null) {
        for (var k = 0; k < sources.length; k++) {
          var fromIndex = sources[k]
          slides.push({ path: buildPath(fromIndex, newIndex, cols, 'right'), value: state.board[fromIndex] })
        }
      } else if (newPositions[lineSlot] >= 0) {
        slides.push({ path: buildPath(newPositions[lineSlot], newIndex, cols, 'right'), value: state.board[newPositions[lineSlot]] })
      }
    }
  }
  if (!moved) return { state: state, moved: false, slides: [] }
  var history = state.moveHistory.slice()
  if (history.length >= 50) history.shift()
  history.push({ board: state.board.slice(), score: state.score })
  return { state: Object.assign({}, state, { board: board, score: state.score + scoreAdd, moveHistory: history }), moved: true, slides: slides }
}

function moveUp(state) {
  var cols = state.boardWidth
  var rows = state.boardHeight
  var board = state.board.slice()
  var scoreAdd = 0
  var moved = false
  var slides = []
  for (var col = 0; col < cols; col++) {
    var line = []
    var originalPositions = []
    for (var row = 0; row < rows; row++) {
      var index = row * cols + col
      line.push(board[index])
      originalPositions.push(index)
    }
    var result = mergeLine(line, originalPositions, rows)
    var merged = result.merged
    var newPositions = result.newPositions
    var add = result.scoreAdd
    var mergeSources = result.mergeSources
    scoreAdd += add
    for (var row = 0; row < rows; row++) {
      var newIndex = row * cols + col
      var newValue = merged[row]
      if (newValue !== board[newIndex]) moved = true
      board[newIndex] = newValue
      if (newValue === 0) continue
      var sources = mergeSources[row]
      if (sources != null) {
        for (var k = 0; k < sources.length; k++) {
          var fromIndex = sources[k]
          slides.push({ path: buildPath(fromIndex, newIndex, cols, 'up'), value: state.board[fromIndex] })
        }
      } else if (newPositions[row] >= 0) {
        slides.push({ path: buildPath(newPositions[row], newIndex, cols, 'up'), value: state.board[newPositions[row]] })
      }
    }
  }
  if (!moved) return { state: state, moved: false, slides: [] }
  var history = state.moveHistory.slice()
  if (history.length >= 50) history.shift()
  history.push({ board: state.board.slice(), score: state.score })
  return { state: Object.assign({}, state, { board: board, score: state.score + scoreAdd, moveHistory: history }), moved: true, slides: slides }
}

function moveDown(state) {
  var cols = state.boardWidth
  var rows = state.boardHeight
  var board = state.board.slice()
  var scoreAdd = 0
  var moved = false
  var slides = []
  for (var col = 0; col < cols; col++) {
    var line = []
    var originalPositions = []
    for (var row = rows - 1; row >= 0; row--) {
      var index = row * cols + col
      line.push(board[index])
      originalPositions.push(index)
    }
    var result = mergeLine(line, originalPositions, rows)
    var merged = result.merged
    var newPositions = result.newPositions
    var add = result.scoreAdd
    var mergeSources = result.mergeSources
    scoreAdd += add
    for (var row = 0; row < rows; row++) {
      var newIndex = row * cols + col
      var lineSlot = rows - 1 - row
      var newValue = merged[lineSlot]
      if (newValue !== board[newIndex]) moved = true
      board[newIndex] = newValue
      if (newValue === 0) continue
      var sources = mergeSources[lineSlot]
      if (sources != null) {
        for (var k = 0; k < sources.length; k++) {
          var fromIndex = sources[k]
          slides.push({ path: buildPath(fromIndex, newIndex, cols, 'down'), value: state.board[fromIndex] })
        }
      } else if (newPositions[lineSlot] >= 0) {
        slides.push({ path: buildPath(newPositions[lineSlot], newIndex, cols, 'down'), value: state.board[newPositions[lineSlot]] })
      }
    }
  }
  if (!moved) return { state: state, moved: false, slides: [] }
  var history = state.moveHistory.slice()
  if (history.length >= 50) history.shift()
  history.push({ board: state.board.slice(), score: state.score })
  return { state: Object.assign({}, state, { board: board, score: state.score + scoreAdd, moveHistory: history }), moved: true, slides: slides }
}

function addRandomTile(state) {
  var board = state.board
  var w = state.boardWidth
  var h = state.boardHeight
  var total = w * h
  var empty = []
  for (var i = 0; i < total; i++) {
    if (board[i] === 0) empty.push(i)
  }
  if (empty.length === 0) return { state: state, newIndex: -1 }
  var idx = empty[Math.floor(Math.random() * empty.length)]
  var next = board.slice()
  next[idx] = Math.random() < 0.9 ? 2 : 4
  return { state: Object.assign({}, state, { board: next }), newIndex: idx }
}

function checkGameOver(state) {
  var board = state.board
  var cols = state.boardWidth
  var rows = state.boardHeight
  var total = cols * rows
  for (var i = 0; i < total; i++) {
    if (board[i] === 0) return false
  }
  for (var row = 0; row < rows; row++) {
    for (var col = 0; col < cols; col++) {
      var cur = board[row * cols + col]
      if (col < cols - 1 && board[row * cols + col + 1] === cur) return false
      if (row < rows - 1 && board[(row + 1) * cols + col] === cur) return false
    }
  }
  return true
}

function initGame(highScore, overrides) {
  if (highScore === undefined) highScore = 0
  var o = overrides
  var w = (o && o.boardWidth != null) ? o.boardWidth : DEFAULT_STATE.boardWidth
  var h = (o && o.boardHeight != null) ? o.boardHeight : DEFAULT_STATE.boardHeight
  var target = (o && o.targetNumber != null) ? o.targetNumber : DEFAULT_STATE.targetNumber
  var initialTiles = (o && o.initialTiles != null) ? o.initialTiles : DEFAULT_STATE.initialTiles
  var total = w * h
  var board = Array(total).fill(0)
  var count = Math.min(initialTiles, total)
  while (count > 0) {
    var empty = []
    for (var i = 0; i < total; i++) if (board[i] === 0) empty.push(i)
    if (empty.length === 0) break
    var idx = empty[Math.floor(Math.random() * empty.length)]
    board[idx] = Math.random() < 0.9 ? 2 : 4
    count--
  }
  return Object.assign({}, DEFAULT_STATE, {
    board: board,
    boardWidth: w,
    boardHeight: h,
    targetNumber: target,
    initialTiles: initialTiles,
    showNewTileMarker: (o && o.showNewTileMarker != null) ? o.showNewTileMarker !== false : (o && o.showHighlight != null ? o.showHighlight !== false : DEFAULT_STATE.showNewTileMarker),
    useAccelerometer: (o && o.useAccelerometer != null) ? o.useAccelerometer : DEFAULT_STATE.useAccelerometer,
    accelerometerSpeed: (o && o.accelerometerSpeed != null) ? o.accelerometerSpeed : DEFAULT_STATE.accelerometerSpeed,
    newTileOnMidStop: (o && o.newTileOnMidStop != null) ? o.newTileOnMidStop : DEFAULT_STATE.newTileOnMidStop,
    customLabels: (o && o.customLabels) ? Object.assign({}, o.customLabels) : Object.assign({}, DEFAULT_STATE.customLabels),
    customImages: (o && o.customImages) ? Object.assign({}, o.customImages) : Object.assign({}, DEFAULT_STATE.customImages),
    highScore: highScore,
    moveHistory: [],
  })
}

function doMove(state, direction) {
  if (state.gameOver) return { state: state, moved: false, slides: [], newTileIndex: -1 }
  var result
  if (direction === 'left') result = moveLeft(state)
  else if (direction === 'right') result = moveRight(state)
  else if (direction === 'up') result = moveUp(state)
  else result = moveDown(state)
  if (!result.moved) return { state: state, moved: false, slides: [], newTileIndex: -1 }
  var addResult = addRandomTile(result.state)
  var next = addResult.state
  if (next.score > next.highScore) {
    next = Object.assign({}, next, { highScore: next.score })
  }
  var targetNum = next.targetNumber
  if (!next.gameWin && targetNum != null) {
    for (var i = 0; i < next.board.length; i++) {
      if (next.board[i] >= targetNum) {
        next = Object.assign({}, next, { gameWin: true, overlayVisible: true, overlayMessage: '恭喜！' })
        break
      }
    }
  }
  if (checkGameOver(next)) {
    next = Object.assign({}, next, { gameOver: true, overlayVisible: true, overlayMessage: '游戏结束' })
  }
  return { state: next, moved: true, slides: result.slides, newTileIndex: addResult.newIndex }
}

function restart(state) {
  return initGame(state.highScore, {
    boardWidth: state.boardWidth,
    boardHeight: state.boardHeight,
    targetNumber: state.targetNumber,
    initialTiles: state.initialTiles,
    showNewTileMarker: state.showNewTileMarker,
    useAccelerometer: state.useAccelerometer,
    accelerometerSpeed: state.accelerometerSpeed,
    newTileOnMidStop: state.newTileOnMidStop,
    customLabels: state.customLabels,
    customImages: state.customImages,
  })
}

function undo(state) {
  if (state.moveHistory.length === 0) return state
  var prev = state.moveHistory[state.moveHistory.length - 1]
  return Object.assign({}, state, {
    board: prev.board.slice(),
    score: prev.score,
    gameOver: false,
    overlayVisible: false,
    overlayMessage: '',
    moveHistory: state.moveHistory.slice(0, -1),
  })
}

function serializeGameState(state) {
  return {
    board: state.board.slice(),
    score: state.score,
    highScore: state.highScore,
    gameOver: state.gameOver,
    gameWin: state.gameWin,
    overlayVisible: state.overlayVisible,
    overlayMessage: state.overlayMessage,
    boardWidth: state.boardWidth,
    boardHeight: state.boardHeight,
    targetNumber: state.targetNumber,
    initialTiles: state.initialTiles,
    showNewTileMarker: state.showNewTileMarker,
    useAccelerometer: state.useAccelerometer,
    accelerometerSpeed: state.accelerometerSpeed,
    newTileOnMidStop: state.newTileOnMidStop,
    customLabels: state.customLabels ? Object.assign({}, state.customLabels) : {},
    customImages: state.customImages ? Object.assign({}, state.customImages) : {},
    moveHistory: state.moveHistory.map(function (h) { return { board: h.board.slice(), score: h.score } }),
  }
}

function deserializeGameState(raw) {
  if (!raw || typeof raw !== 'object') return null
  var o = raw
  var boardWidth = Number(o.boardWidth)
  var boardHeight = Number(o.boardHeight)
  if (!Number.isFinite(boardWidth) || boardWidth < 2 || !Number.isFinite(boardHeight) || boardHeight < 2) return null
  var total = boardWidth * boardHeight
  var boardRaw = o.board
  if (!Array.isArray(boardRaw) || boardRaw.length !== total) return null
  var board = []
  for (var i = 0; i < total; i++) {
    var v = Number(boardRaw[i])
    board.push(Number.isFinite(v) && v >= 0 ? v : 0)
  }
  var targetNumber = (o.targetNumber == null || o.targetNumber === 'Infinity' || o.targetNumber === 'null') ? null : Number(o.targetNumber)
  var moveHistoryRaw = o.moveHistory
  var moveHistory = []
  if (Array.isArray(moveHistoryRaw)) {
    for (var j = 0; j < moveHistoryRaw.length; j++) {
      var h = moveHistoryRaw[j]
      if (h && Array.isArray(h.board) && h.board.length === total && Number.isFinite(Number(h.score))) {
        moveHistory.push({ board: h.board.slice(), score: Number(h.score) })
      }
    }
  }
  return Object.assign({}, DEFAULT_STATE, {
    board: board,
    score: Math.max(0, Number(o.score) || 0),
    highScore: Math.max(0, Number(o.highScore) || 0),
    gameOver: Boolean(o.gameOver),
    gameWin: Boolean(o.gameWin),
    overlayVisible: Boolean(o.overlayVisible),
    overlayMessage: String(o.overlayMessage != null ? o.overlayMessage : ''),
    boardWidth: boardWidth,
    boardHeight: boardHeight,
    targetNumber: (targetNumber == null || Number.isFinite(targetNumber)) ? targetNumber : 2048,
    initialTiles: Math.max(1, Math.min(total, Number(o.initialTiles) || 2)),
    showNewTileMarker: (o.showNewTileMarker != null ? o.showNewTileMarker !== false : o.showHighlight !== false),
    useAccelerometer: Boolean(o.useAccelerometer),
    accelerometerSpeed: (o.accelerometerSpeed === 'slow' || o.accelerometerSpeed === 'fast') ? o.accelerometerSpeed : 'medium',
    newTileOnMidStop: Boolean(o.newTileOnMidStop),
    customLabels: (o.customLabels && typeof o.customLabels === 'object') ? Object.assign({}, o.customLabels) : {},
    customImages: (o.customImages && typeof o.customImages === 'object') ? Object.assign({}, o.customImages) : {},
    moveHistory: moveHistory,
  })
}

  function getStepIndexAndMaxLenFromCells(slides, cellsMoved) {
    var steps = []
    var maxLenPerSlide = []
    var maxPathLenGlobal = 1
    for (var i = 0; i < slides.length; i++) {
      var path = slides[i].path
      if (!path || path.length === 0) { steps[i] = 0; maxLenPerSlide[i] = 1; continue }
      if (path.length > maxPathLenGlobal) maxPathLenGlobal = path.length
    }
    var maxSteps = maxPathLenGlobal - 1
    var globalStep = Math.min(Math.floor(cellsMoved), maxSteps)
    for (var i = 0; i < slides.length; i++) {
      var path = slides[i].path
      if (!path || path.length === 0) continue
      var pathLen = path.length
      steps[i] = globalStep >= pathLen ? pathLen - 1 : globalStep
      maxLenPerSlide[i] = maxPathLenGlobal
    }
    return { steps: steps, maxLenPerSlide: maxLenPerSlide }
  }

  function getStepIndexPerSlide(slides, cellsMoved) {
    return getStepIndexAndMaxLenFromCells(slides, cellsMoved).steps
  }

  return {
    STORAGE_HIGH_SCORE: STORAGE_HIGH_SCORE,
    getHighScoreKey: getHighScoreKey,
    STORAGE_SETTINGS: STORAGE_SETTINGS,
    STORAGE_GAME_STATE: STORAGE_GAME_STATE,
    addRandomTile: addRandomTile,
    initGame: initGame,
    doMove: doMove,
    restart: restart,
    undo: undo,
    serializeGameState: serializeGameState,
    deserializeGameState: deserializeGameState,
    getStepIndexAndMaxLenFromCells: getStepIndexAndMaxLenFromCells,
    getStepIndexPerSlide: getStepIndexPerSlide,
  }
})

/**
 * 按场景测试页的共用运行逻辑。依赖：已加载 logic.js，且 window.SCENARIOS 已赋值（数组，每项 { title, desc?, cases }）。
 * 单场景页可设置 window.SCENARIO_INDEX_BASE = 0～5：0～3 为 runMergeCase；4～5 为 runPostLockClearCase（锁后整盘 + logic.advancePostLockLineClearNoSpawn）。
 */
(function() {
	'use strict';
	var SCENARIOS = window.SCENARIOS;
	var scenarioIndexBase = window.SCENARIO_INDEX_BASE;
	if (!SCENARIOS || !SCENARIOS.length) {
		document.body.insertAdjacentHTML('beforeend', '<p style="color:red">未设置 SCENARIOS</p>');
		return;
	}
	var logic = window.Game2048BlocksLogic;
	if (!logic) {
		document.body.insertAdjacentHTML('beforeend', '<p style="color:red">未加载 logic.js</p>');
		return;
	}
	var tick = logic.tick;
	var createPiece = logic.createPiece;
	var pieceAbsCells = logic.pieceAbsCells;
	var advancePostLockLineClearNoSpawn = logic.advancePostLockLineClearNoSpawn;
	var ROT_LABELS = ['0°', '90°', '180°', '270°'];
	// T: 旧0→90°, 旧90→180°, 旧180→270°, 旧270→0°；Z/S: 仅两角，旧0→90°, 旧90→0°
	function getAngleLabel(shape, rotation) {
		var r = rotation == null ? 0 : rotation;
		if (shape === 'T') return ['90°', '180°', '270°', '0°'][r] || (r + '°');
		if (shape === 'Z' || shape === 'S') return ['90°', '0°', '90°', '0°'][r] || (r + '°');
		return ROT_LABELS[r] || (r + '°');
	}
	function rotationSortIndex(shape, rotation) {
		var r = rotation == null ? 0 : rotation;
		if (shape === 'T') return [1, 2, 3, 0][r]; // 3,0,1,2 → 0,1,2,3
		if (shape === 'Z' || shape === 'S') return [1, 0, 3, 2][r]; // 1,0,3,2
		return r;
	}

	function makeState(rows, cols, boardRows, piece) {
		var board = [];
		for (var r = 0; r < boardRows.length; r++) {
			var row = [];
			for (var c = 0; c < boardRows[r].length; c++) row.push(boardRows[r][c] || 0);
			board.push(row);
		}
		return { rows: rows, cols: cols, board: board, currentPiece: piece, pieceCount: piece ? 1 : 0, nextPiece: null, gameOver: false, clearLinesPending: null, postClearGravityState: null, cascadePending: false, score: 0, highScore: 0, seed: 0 };
	}
	function pieceFromCase(tc) {
		if (!tc.piece) return null;
		var p = tc.piece;
		var piece = createPiece(p.shape, p.rotation != null ? p.rotation : 0, p.row, p.col);
		if (p.cellValues && Array.isArray(p.cellValues)) {
			for (var i = 0; i < piece.cells.length && i < p.cellValues.length; i++) piece.cells[i].value = p.cellValues[i];
		}
		return piece;
	}
	function deepCopyBoard(arr) { return JSON.parse(JSON.stringify(arr)); }
	function boardEquals(a, b, rows, cols) {
		for (var r = 0; r < rows; r++)
			for (var c = 0; c < cols; c++)
				if ((a[r] && a[r][c] || 0) !== (b[r] && b[r][c] || 0)) return false;
		return true;
	}
	function getDisplayBoard(state) {
		var rows = state.rows, cols = state.cols;
		var out = [];
		for (var r = 0; r < rows; r++) {
			var row = [];
			for (var c = 0; c < cols; c++) row.push(state.board[r][c] || 0);
			out.push(row);
		}
		var piece = state.currentPiece;
		if (piece && !state.gameOver) {
			pieceAbsCells(piece).forEach(function(cell) {
				if (cell.r >= 0 && cell.r < rows && cell.c >= 0 && cell.c < cols) out[cell.r][cell.c] = cell.value;
			});
		}
		return out;
	}

	var SHAPE_ORDER = { I: 0, O: 1, T: 2, Z: 3, S: 4, J: 5, L: 6 };
	function countBlocksInLastRow(tc) {
		var last = tc.before[tc.rows - 1];
		if (!last) return 0;
		var n = 0;
		for (var c = 0; c < last.length; c++) if (last[c] === 2 || last[c] === 4) n++;
		return n;
	}
	function getColumnSet(tc) {
		var last = tc.before[tc.rows - 1];
		if (!last) return [];
		var cols = [];
		for (var c = 0; c < last.length; c++) if (last[c] === 2 || last[c] === 4) cols.push(c);
		return cols;
	}
	function blockCount(tc) {
		if (tc.pileBlocks) return tc.pileBlocks;
		if (tc.sortKey != null) return countBlocksInLastRow(tc);
		return 1;
	}
	function sortCases(cases) {
		if (cases.length > 0 && cases.every(function(c) { return c.sortKey != null; })) {
			return cases.slice().sort(function(a, b) { return a.sortKey - b.sortKey; });
		}
		function colKey(tc) {
			var n = blockCount(tc);
			if (n === 1) return 1000 + (tc.columnIndex != null ? tc.columnIndex : 0);
			return n * 1000 + (tc.sortKey != null ? tc.sortKey : 0);
		}
		return cases.slice().sort(function(a, b) {
			var so = SHAPE_ORDER[a.shape] - SHAPE_ORDER[b.shape];
			if (so !== 0) return so;
			var ra = a.piece && a.piece.rotation != null ? a.piece.rotation : 0;
			var rb = b.piece && b.piece.rotation != null ? b.piece.rotation : 0;
			var ro = rotationSortIndex(a.shape, ra) - rotationSortIndex(b.shape, rb);
			if (ro !== 0) return ro;
			return colKey(a) - colKey(b);
		});
	}
	function isFullRowColumnSet(cols, colsLen) {
		if (cols.length !== colsLen) return false;
		for (var i = 0; i < colsLen; i++) if (cols[i] !== i) return false;
		return true;
	}
	function blockLabel(tc) {
		var n = blockCount(tc);
		if (n > 1) {
			var cols = getColumnSet(tc);
			if (isFullRowColumnSet(cols, tc.cols)) return n + '块';
			return n + '块(列' + cols.join('、') + ')';
		}
		return '1块(列' + (tc.columnIndex != null ? tc.columnIndex : 0) + ')';
	}

	function runMergeCase(tc) {
		var rows = tc.rows, cols = tc.cols;
		var board = deepCopyBoard(tc.before);
		var piece = pieceFromCase(tc);
		var boardAfterLock = null;
		var pieceCountBefore = piece ? 1 : 0;
		var lastState = null;
		for (var i = 0; i < tc.ticks; i++) {
			var state = makeState(rows, cols, board, piece);
			state.pieceCount = pieceCountBefore;
			state = tick(state);
			lastState = state;
			if (piece && state.pieceCount > pieceCountBefore) boardAfterLock = deepCopyBoard(state.board);
			pieceCountBefore = state.pieceCount;
			board = deepCopyBoard(state.board);
			piece = state.currentPiece;
			if (!piece) break;
		}
		var resultBoard = (boardAfterLock != null) ? boardAfterLock
			: (lastState && lastState.currentPiece ? getDisplayBoard(lastState) : deepCopyBoard(board));
		var pass = tc.expected != null && boardEquals(resultBoard, tc.expected, rows, cols);
		return { resultBoard: resultBoard, pass: pass };
	}
	/** ⑤⑥：初始为「已锁块后的整盘」，走 logic 内与 tick 一致的消行全流程，止于即将生成下一块（不生成下一块）。 */
	function runPostLockClearCase(tc) {
		var rows = tc.rows, cols = tc.cols;
		var board = deepCopyBoard(tc.before);
		var state = {
			rows: rows,
			cols: cols,
			board: board,
			currentPiece: null,
			pieceCount: tc.pieceCount != null ? tc.pieceCount : 1,
			nextPiece: null,
			gameOver: false,
			clearLinesPending: null,
			postClearGravityState: null,
			cascadePending: false,
			score: 0,
			highScore: 0,
			seed: tc.seed != null ? tc.seed : 0,
			level: 0,
			linesClearedTotal: 0,
			overlayVisible: false,
			overlayMessage: '',
			fallIntervalMs: 500
		};
		var out = advancePostLockLineClearNoSpawn(state);
		var resultBoard = deepCopyBoard(out.board);
		var pass = tc.expected != null && boardEquals(resultBoard, tc.expected, rows, cols);
		return { resultBoard: resultBoard, pass: pass };
	}
	function runCaseForScenarioIndex(tc, scenarioIndex) {
		if (scenarioIndex >= 4 && scenarioIndex <= 5) return runPostLockClearCase(tc);
		return runMergeCase(tc);
	}
	function renderBoardSm(board, rows, cols, piece) {
		if (!board || !rows || !cols) return '';
		var pieceCells = piece ? pieceAbsCells(piece) : [];
		var pieceSet = {};
		pieceCells.forEach(function(cell) {
			if (cell.r >= 0 && cell.r < rows && cell.c >= 0 && cell.c < cols) pieceSet[cell.r * cols + cell.c] = cell.value;
		});
		var html = '<div class="board-sm" style="grid-template-columns:repeat(' + cols + ',20px);grid-template-rows:repeat(' + rows + ',20px)">';
		for (var r = 0; r < rows; r++)
			for (var c = 0; c < cols; c++) {
				var val = pieceSet[r * cols + c] != null ? pieceSet[r * cols + c] : (board[r][c] || 0);
				var cls = pieceSet[r * cols + c] != null ? 'cell piece' : (val ? 'cell has' : 'cell');
				html += '<div class="' + cls + '">' + (val || '') + '</div>';
			}
		html += '</div>';
		return html;
	}

	var allCards = [];
	var scenarioRoot = document.getElementById('scenarios');
	if (!scenarioRoot) return;

	SCENARIOS.forEach(function(scenario, si) {
		var section = document.createElement('div');
		section.className = 'scenario';
		section.innerHTML = '<h2>' + scenario.title + '</h2>' + (scenario.desc ? '<p class="scenario-desc" style="margin:0 0 10px 0;font-size:12px;color:#666;max-width:720px;">' + scenario.desc + '</p>' : '') + '<div class="card-grid" id="grid-' + si + '"></div>';
		var grid = section.querySelector('.card-grid');
		var scenarioIndex = scenarioIndexBase != null ? scenarioIndexBase : si;
		sortCases(scenario.cases).forEach(function(tc, ci) {
			var piece = pieceFromCase(tc);
			var pr = piece && piece.rotation != null ? piece.rotation : 0;
			var cardTitle = (scenarioIndex >= 4 && scenarioIndex <= 5 && !piece)
				? (tc.label || '消行')
				: (tc.shape + ' ' + getAngleLabel(tc.shape, pr) + (tc.label ? ' ' + tc.label : ''));
			var card = document.createElement('div');
			card.className = 'card';
			card.innerHTML =
				'<div class="card-title">' + cardTitle + '</div>' +
				'<div class="card-boards">' +
				'<div class="card-row"><span class="label">初始</span>' + renderBoardSm(tc.before, tc.rows, tc.cols, piece) + '</div>' +
				'<div class="card-row"><span class="label">期望</span>' + renderBoardSm(tc.expected, tc.rows, tc.cols, null) + '</div>' +
				'<div class="card-row"><span class="label">执行后</span><span data-result></span></div>' +
				'</div>' +
				'<div class="card-actions">' +
				'<button type="button" class="run-one">执行</button>' +
				'<span class="card-result pending" data-status>—</span>' +
				'</div>';
			var resultEl = card.querySelector('[data-result]');
			var statusEl = card.querySelector('[data-status]');
			var runBtn = card.querySelector('.run-one');
			runBtn.addEventListener('click', function() {
				var res = runCaseForScenarioIndex(tc, scenarioIndex);
				resultEl.innerHTML = renderBoardSm(res.resultBoard, tc.rows, tc.cols, null);
				statusEl.textContent = res.pass ? '✓' : '✗';
				statusEl.className = 'card-result ' + (res.pass ? 'ok' : 'fail');
				card.classList.toggle('card-fail', !res.pass);
			});
			allCards.push({ tc: tc, card: card, resultEl: resultEl, statusEl: statusEl, scenarioIndex: scenarioIndex });
			grid.appendChild(card);
		});
		scenarioRoot.appendChild(section);
	});

	var summaryEl = document.getElementById('runSummary');
	if (summaryEl) summaryEl.textContent = '成功 —，失败 —，共 ' + allCards.length;

	var runAllBtn = document.getElementById('runAll');
	if (runAllBtn) {
		runAllBtn.addEventListener('click', function() {
			var ok = 0, fail = 0;
			allCards.forEach(function(o) {
				var res = runCaseForScenarioIndex(o.tc, o.scenarioIndex);
				o.resultEl.innerHTML = renderBoardSm(res.resultBoard, o.tc.rows, o.tc.cols, null);
				o.statusEl.textContent = res.pass ? '✓' : '✗';
				o.statusEl.className = 'card-result ' + (res.pass ? 'ok' : 'fail');
				if (o.card) o.card.classList.toggle('card-fail', !res.pass);
				if (res.pass) ok++; else fail++;
			});
			var el = document.getElementById('runSummary');
			if (el) el.textContent = '成功 ' + ok + '，失败 ' + fail + '，共 ' + (ok + fail);
		});
	}
})();

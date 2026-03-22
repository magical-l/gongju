/**
 * 2048方块 - 纯逻辑（Web 版）。俄罗斯方块式下落，同数合并、行消除。
 * 从 test1 miniprogram/games/2048blocks/logic.ts 移植，localStorage 由 dom 层处理。
 */
'use strict';

(function(root, factory) {
	if (typeof module !== 'undefined' && module.exports) {
		module.exports = factory();
	} else {
		root.Game2048BlocksLogic = factory();
	}
})(typeof self !== 'undefined' ? self : this, function() {
	const STORAGE_HIGH_SCORE_BLOCKS = '2048blocks-high-score';
	const STORAGE_SETTINGS_BLOCKS = '2048blocks-settings';
	const STORAGE_GAME_STATE_BLOCKS = '2048blocks-game-state';

	const SHAPES = {
		I: [[0, 0], [1, 0], [2, 0], [3, 0]],
		O: [[0, 0], [0, 1], [1, 0], [1, 1]],
		T: [[0, 1], [1, 0], [1, 1], [2, 1]],
		Z: [[0, 1], [1, 0], [1, 1], [2, 0]],
		S: [[0, 0], [1, 0], [1, 1], [2, 1]],
		J: [[0, 1], [1, 1], [2, 0], [2, 1]],
		L: [[0, 0], [1, 0], [2, 0], [2, 1]],
	};
	const SHAPE_KEYS = Object.keys(SHAPES);
	const MIN_ROWS = 8;
	const MIN_COLS = 6;
	const MAX_ROWS = 20;
	const MAX_COLS = 12;
	const DEFAULT_CFG = {rows: 12, cols: 10, fallIntervalMs: 500};
	/**
	 * 消行后行为（可调参；默认与历史逻辑一致）
	 * - afterClearPack: **整块模式 whole** 与 **列模式 column** 在 7.1 收尾阶段应一致：均只执行「整行抽掉已空满行 + 顶补空行」（packAfterClearedEmptyRows），**保留**行内建造空隙，**不得**对整列做重力压实。旧版 column 误用 packColumnsStackBottom（逐列落底）已移除。
	 * - mergeStart: top|bottom|contact — 全场竖向 cascade 每步选哪条合并先做
	 * - mergeRounds: once=每段 cascade 只合并一步；untilStable=多步直到不能再合并
	 */
	const DEFAULT_LINE_CLEAR_POLICY = {afterClearPack: 'whole', mergeStart: 'top', mergeRounds: 'untilStable'};

	function getDefaultLineClearPolicy() {
		return {afterClearPack: DEFAULT_LINE_CLEAR_POLICY.afterClearPack,
			mergeStart: DEFAULT_LINE_CLEAR_POLICY.mergeStart,
			mergeRounds: DEFAULT_LINE_CLEAR_POLICY.mergeRounds};
	}

	function normalizeLineClearPolicy(raw) {
		const d = getDefaultLineClearPolicy();
		if (!raw || typeof raw !== 'object') {
			return d;
		}
		const pack = raw.afterClearPack === 'column' ? 'column' : 'whole';
		let merge = d.mergeStart;
		if (raw.mergeStart === 'bottom') {
			merge = 'bottom';
		} else if (raw.mergeStart === 'contact') {
			merge = 'contact';
		} else if (raw.mergeStart === 'top') {
			merge = 'top';
		}
		const rounds = raw.mergeRounds === 'once' ? 'once' : 'untilStable';
		return {afterClearPack: pack, mergeStart: merge, mergeRounds: rounds};
	}

	/** 消行基础分系数（玩法 12.2），供 getLineClearBaseScore 使用 */
	const SCORE_BY_LINES = [0, 40, 100, 300, 1200];

	/** 前进方向：{ dr, dc }，与坐标轴无关，如向下为 dr=1, dc=0 */
	const DIR_DOWN = { dr: 1, dc: 0 };
	const DIR_LEFT = { dr: 0, dc: -1 };
	const DIR_RIGHT = { dr: 0, dc: 1 };

	/**
	 * 方格：维护自己的数字；合并时数字翻倍。
	 */
	function Cell(value) {
		this.value = value == null ? 2 : value;
	}
	Cell.prototype.merge = function() {
		this.value *= 2;
		return this.value;
	};

	/**
	 * 方块（活动块）：维护位置与方格列表，可沿某方向取「最前线」格。
	 * 最前线 = 该方向上没有同块其它格的格（即前进方向上的“首格”）。
	 */
	function Block(row, col, cells) {
		this.row = row;
		this.col = col;
		this.cells = cells;
	}
	Block.prototype.getFrontLineCells = function(direction) {
		var dr = direction.dr, dc = direction.dc;
		return this.cells.filter(function(c) {
			return !this.cells.some(function(c2) {
				return c2.dr === c.dr + dr && c2.dc === c.dc + dc;
			});
		}, this);
	};
	Block.prototype.getTargetRowCol = function(cell, direction) {
		return {
			r: this.row + cell.dr + direction.dr,
			c: this.col + cell.dc + direction.dc,
		};
	};

	/** 消行基础分（玩法 11）：消除 n 行时返回 SCORE_n × (level+1)，n 取 1～4。接口预留，计分可后续接入。 */
	function getLineClearBaseScore(numLinesCleared, level) {
		level = level != null && Number.isFinite(level) ? Math.max(0, level) : 0;
		const n = Math.max(0, Math.min(4, Math.floor(numLinesCleared) || 0));
		return (SCORE_BY_LINES[n] || 0) * (level + 1);
	}

	function getShapeCells(shape, rotation) {
		const def = SHAPES[shape];
		if (!def) {
			return [];
		}
		let coords = def.map(function(p) { return [p[0], p[1]]; });
		const center = {r: 0, c: 0};
		for (let i = 0; i < coords.length; i++) {
			center.r += coords[i][0];
			center.c += coords[i][1];
		}
		center.r /= coords.length;
		center.c /= coords.length;
		for (let rot = 0; rot < rotation; rot++) {
			coords = coords.map(function(p) {
				const r = p[0], c = p[1];
				const nr = c - center.c + center.r;
				const nc = -(r - center.r) + center.c;
				return [Math.round(nr), Math.round(nc)];
			});
		}
		const minR = Math.min.apply(null, coords.map(function(p) { return p[0]; }));
		const minC = Math.min.apply(null, coords.map(function(p) { return p[1]; }));
		return coords.map(function(p) { return [p[0] - minR, p[1] - minC]; });
	}

	function createPiece(shape, rotation, row, col) {
		const rel = getShapeCells(shape, rotation);
		const cells = rel.map(function(p) { return {dr: p[0], dc: p[1], value: 2}; });
		return {shape: shape, rotation: rotation, row: row, col: col, cells: cells, mergeCount: 0};
	}

	/**
	 * 调试/关卡编辑：由棋盘绝对坐标构造活动块（任意连通形状）。shape 取 T 以便旋转走几何旋转分支。
	 * @param {Array<{r:number,c:number,value?:number}>} entries
	 */
	function createCustomPieceFromAbsCells(entries) {
		if (!entries || entries.length === 0) {
			return null;
		}
		const cleaned = [];
		const seen = {};
		for (let i = 0; i < entries.length; i++) {
			const e = entries[i];
			const r = Number(e.r);
			const c = Number(e.c);
			const v = e.value != null && Number.isFinite(Number(e.value)) ? Number(e.value) : 2;
			if (!Number.isFinite(r) || !Number.isFinite(c) || !(v > 0)) {
				continue;
			}
			const k = r + ',' + c;
			if (seen[k]) {
				continue;
			}
			seen[k] = true;
			cleaned.push({r: r, c: c, v: v});
		}
		if (cleaned.length === 0) {
			return null;
		}
		let minR = cleaned[0].r;
		let minC = cleaned[0].c;
		for (let j = 1; j < cleaned.length; j++) {
			if (cleaned[j].r < minR) {
				minR = cleaned[j].r;
			}
			if (cleaned[j].c < minC) {
				minC = cleaned[j].c;
			}
		}
		const cells = cleaned.map(function(e) {
			return {dr: e.r - minR, dc: e.c - minC, value: e.v, merged: false};
		});
		return {
			shape: 'T',
			rotation: 0,
			row: minR,
			col: minC,
			cells: cells,
			mergeCount: 0,
		};
	}

	function pieceAbsCells(p) {
		return p.cells.map(function(c) {
			return {r: p.row + c.dr, c: p.col + c.dc, value: c.value};
		});
	}

	/** 与 getShapeCells 相同：绕质心逆时针 90°，再 min 归一化；各格携带 value/merged。 */
	function rotatePieceCells90CCW(piece) {
		const cells = piece.cells;
		const n = cells.length;
		let cr = 0;
		let cc = 0;
		for (let i = 0; i < n; i++) {
			cr += cells[i].dr;
			cc += cells[i].dc;
		}
		cr /= n;
		cc /= n;
		const spun = cells.map(function(c) {
			const r = c.dr;
			const c0 = c.dc;
			const nr = c0 - cc + cr;
			const nc = -(r - cr) + cc;
			return {
				dr: Math.round(nr),
				dc: Math.round(nc),
				value: c.value,
				merged: !!c.merged,
			};
		});
		let minR = spun[0].dr;
		let minC = spun[0].dc;
		for (let k = 1; k < n; k++) {
			if (spun[k].dr < minR) {
				minR = spun[k].dr;
			}
			if (spun[k].dc < minC) {
				minC = spun[k].dc;
			}
		}
		const normalized = spun.map(function(c) {
			return {
				dr: c.dr - minR,
				dc: c.dc - minC,
				value: c.value,
				merged: c.merged,
			};
		});
		return {
			shape: piece.shape,
			rotation: (piece.rotation + 1) % 4,
			row: piece.row,
			col: piece.col,
			cells: normalized,
			mergeCount: piece.mergeCount,
		};
	}

	/** O/S/Z：旋转后保持包围盒左上角（min r/c）在盘面上的绝对位置不变，避免「原地转」却左右漂移。 */
	function rotatePieceKeepBoundingAnchor(piece) {
		const oldAbs = pieceAbsCells(piece);
		let oldMinR = oldAbs[0].r;
		let oldMinC = oldAbs[0].c;
		for (let i = 1; i < oldAbs.length; i++) {
			if (oldAbs[i].r < oldMinR) {
				oldMinR = oldAbs[i].r;
			}
			if (oldAbs[i].c < oldMinC) {
				oldMinC = oldAbs[i].c;
			}
		}
		const spun = rotatePieceCells90CCW(piece);
		const tentative = Object.assign({}, spun, {row: piece.row, col: piece.col});
		const newAbs = pieceAbsCells(tentative);
		let newMinR = newAbs[0].r;
		let newMinC = newAbs[0].c;
		for (let j = 1; j < newAbs.length; j++) {
			if (newAbs[j].r < newMinR) {
				newMinR = newAbs[j].r;
			}
			if (newAbs[j].c < newMinC) {
				newMinC = newAbs[j].c;
			}
		}
		return Object.assign({}, spun, {
			row: piece.row + (oldMinR - newMinR),
			col: piece.col + (oldMinC - newMinC),
		});
	}

	/**
	 * 检测占用：格上有非 0 即视为阻挡。未锁定时 merged 只存在于活动块，不占棋盘。
	 */
	function pieceOverlapsBoardStrict(board, rows, cols, p, rowOffset, colOffset) {
		const cells = pieceAbsCells(p);
		for (let i = 0; i < cells.length; i++) {
			const r2 = cells[i].r + rowOffset;
			const c2 = cells[i].c + colOffset;
			if (r2 < 0 || r2 >= rows || c2 < 0 || c2 >= cols || !board[r2]) {
				continue;
			}
			if (board[r2][c2] !== 0) {
				return true;
			}
		}
		return false;
	}

	function pieceOverlapsBoard(board, rows, cols, p, rowOffset, colOffset) {
		return pieceOverlapsBoardStrict(board, rows, cols, p, rowOffset, colOffset);
	}

	function pieceOutOfBounds(rows, cols, p, rowOffset, colOffset) {
		const cells = pieceAbsCells(p);
		for (let i = 0; i < cells.length; i++) {
			const r2 = cells[i].r + rowOffset;
			const c2 = cells[i].c + colOffset;
			if (c2 < 0 || c2 >= cols) {
				return true;
			}
			if (r2 >= rows) {
				return true;
			}
		}
		return false;
	}

	function wouldCollide(board, rows, cols, p, downRows, colOffset) {
		if (pieceOutOfBounds(rows, cols, p, downRows, colOffset)) {
			return true;
		}
		return pieceOverlapsBoard(board, rows, cols, p, downRows, colOffset);
	}

	/** 按前进方向返回最前线格（该方向上没有同块其它格的格）。不限定 y 轴，由 direction 决定。 */
	function getFrontLineCells(piece, direction) {
		var dr = direction.dr, dc = direction.dc;
		return piece.cells.filter(function(c) {
			return !piece.cells.some(function(c2) { return c2.dr === c.dr + dr && c2.dc === c.dc + dc; });
		});
	}

	function hasBlockInRow0(board, cols) {
		for (let c = 0; c < cols; c++) {
			if (board[0][c] !== 0) {
				return true;
			}
		}
		return false;
	}

	function emptyBoard(rows, cols) {
		const b = [];
		for (let r = 0; r < rows; r++) {
			const row = [];
			for (let c = 0; c < cols; c++) {
				row.push(0);
			}
			b.push(row);
		}
		return b;
	}

	function seededRandom(seed, pieceIndex) {
		let s = seed + pieceIndex * 7919 >>> 0;
		s = Math.imul(s, 1103515245) + 12345 >>> 0;
		const a = (s & 0x7fffffff) / 0x7fffffff;
		s = Math.imul(s, 1103515245) + 12345 >>> 0;
		const b = (s & 0x7fffffff) / 0x7fffffff;
		return [a, b];
	}

	function spawnNextPiece(rows, cols, seed, pieceIndex) {
		const useSeed = seed != null && pieceIndex != null;
		const rands = useSeed ? seededRandom(seed, pieceIndex) : [Math.random(), Math.random()];
		const shape = SHAPE_KEYS[Math.floor(rands[0] * SHAPE_KEYS.length)];
		const rotation = Math.floor(rands[1] * 4);
		const rel = getShapeCells(shape, rotation);
		const maxDr = Math.max.apply(null, rel.map(function(p) { return p[0]; }));
		const maxC = Math.max.apply(null, rel.map(function(p) { return p[1]; }));
		const col = Math.max(0, Math.floor((cols - maxC - 1) / 2));
		return createPiece(shape, rotation, -maxDr, col);
	}

	function writePieceToBoard(board, rows, cols, piece) {
		for (let i = 0; i < piece.cells.length; i++) {
			const cell = piece.cells[i];
			const r = piece.row + cell.dr;
			const c = piece.col + cell.dc;
			if (r >= 0 && r < rows && c >= 0 && c < cols) {
				board[r][c] = cell.value;
			}
		}
	}

	/** 测试/展示：固化棋盘 + 当前活动块各格（含 merged）叠在最上，与 DOM 显示一致（不含消行剩格 overlay）。 */
	function getBoardWithCurrentPiece(game) {
		if (!game || !game.board) {
			return null;
		}
		const rows = game.rows;
		const cols = game.cols;
		const b = game.board.map(function(row) { return row.slice(); });
		const piece = game.currentPiece;
		if (!piece) {
			return b;
		}
		for (let i = 0; i < piece.cells.length; i++) {
			const cell = piece.cells[i];
			const r = piece.row + cell.dr;
			const c = piece.col + cell.dc;
			if (r >= 0 && r < rows && c >= 0 && c < cols && b[r]) {
				b[r][c] = cell.value;
			}
		}
		return b;
	}

	function getFullRowIndices(board, rows, cols) {
		const out = [];
		for (let r = 0; r < rows; r++) {
			let full = true;
			for (let c = 0; c < cols; c++) {
				if (board[r][c] === 0) {
					full = false;
					break;
				}
			}
			if (full) {
				out.push(r);
			}
		}
		return out;
	}

	function compactGravityColumn(board, rows, c) {
		const colVals = [];
		for (let r = rows - 1; r >= 0; r--) {
			if (board[r][c] !== 0) {
				colVals.push(board[r][c]);
			}
		}
		for (let k = 0; k < rows; k++) {
			board[rows - 1 - k][c] = k < colVals.length ? colVals[k] : 0;
		}
	}

	function compactGravityColumnRange(board, startRow, endRow, c) {
		const colVals = [];
		for (let r = endRow; r >= startRow; r--) {
			if (board[r][c] !== 0) {
				colVals.push(board[r][c]);
			}
		}
		for (let k = 0; k <= endRow - startRow; k++) {
			board[endRow - k][c] = k < colVals.length ? colVals[k] : 0;
		}
	}

	/**
	 * 与 tick 下落/合并一致，但锁定后**不**生成下一块、不在这里接下一轮消行（交给后续整理流程）。
	 * @param { { clearRemainderMergeSteps?: number } | null | undefined } stats 可选：统计消行剩格 1×1 下落过程中发生的合并步数
	 */
	function tickLineClearRemainderStep(g, stats) {
		if (g.gameOver || !g.currentPiece) {
			return g;
		}
		const board = g.board;
		const rows = g.rows;
		const cols = g.cols;
		let piece = g.currentPiece;

		if (pieceOutOfBounds(rows, cols, piece, 1, 0)) {
			const maxDr = Math.max.apply(null, piece.cells.map(function(c) { return c.dr; }));
			const lockRow = Math.min(piece.row, rows - 1 - maxDr);
			const lockPieceAt = Object.assign({}, piece, {row: lockRow});
			writePieceToBoard(board, rows, cols, lockPieceAt);
			return Object.assign({}, g, {board: board, currentPiece: null});
		}

		while (true) {
			const wouldHit = pieceOverlapsBoard(board, rows, cols, piece, 1, 0);
			if (!wouldHit) {
				piece.cells.forEach(function(cell) {
					if (cell.merged) {
						return;
					}
					var r = piece.row + cell.dr;
					var c = piece.col + cell.dc;
					if (r >= 0 && r < rows && c >= 0 && c < cols && board[r]) {
						board[r][c] = 0;
					}
				});
				return Object.assign({}, g, {board: board, currentPiece: Object.assign({}, piece, {row: piece.row + 1})});
			}

			const pieceRow = piece.row;
			const direction = DIR_DOWN;
			const frontLineCells = getFrontLineCells(piece, direction);

			var hitBottom = false;
			for (var fi = 0; fi < frontLineCells.length; fi++) {
				var targetR = pieceRow + frontLineCells[fi].dr + direction.dr;
				if (targetR >= rows) {
					hitBottom = true;
					break;
				}
			}
			if (hitBottom) {
				writePieceToBoard(board, rows, cols, Object.assign({}, piece, {row: pieceRow}));
				return Object.assign({}, g, {board: board, currentPiece: null});
			}

			var canMove = true;
			for (var ci = 0; ci < frontLineCells.length; ci++) {
				var cell = frontLineCells[ci];
				var targetR = pieceRow + cell.dr + direction.dr;
				var targetC = piece.col + cell.dc + direction.dc;
				if (targetC < 0 || targetC >= cols || targetR >= rows || targetR < 0 || !board[targetR]) {
					continue;
				}
				var targetValue = board[targetR][targetC];
				if (targetValue !== 0 && targetValue !== cell.value) {
					canMove = false;
					break;
				}
			}
			if (!canMove) {
				writePieceToBoard(board, rows, cols, Object.assign({}, piece, {row: pieceRow}));
				return Object.assign({}, g, {board: board, currentPiece: null});
			}

			var newRow = pieceRow + direction.dr;
			var newCol = piece.col + direction.dc;
			var frontKey = {};
			frontLineCells.forEach(function(c) { frontKey[c.dr + ',' + c.dc] = true; });
			var mergedCount = 0;
			var updatedCells = piece.cells.map(function(cell) {
				if (!frontKey[cell.dr + ',' + cell.dc]) {
					return Object.assign({}, cell);
				}
				var tr = pieceRow + cell.dr + direction.dr;
				var tc = piece.col + cell.dc + direction.dc;
				if (tc < 0 || tc >= cols || tr >= rows || tr < 0 || !board[tr]) {
					return Object.assign({}, cell);
				}
				var tv = board[tr][tc];
				if (tv === cell.value) {
					mergedCount++;
					return Object.assign({}, cell, {value: cell.value * 2, merged: true});
				}
				return Object.assign({}, cell);
			});

			for (let mi = 0; mi < piece.cells.length; mi++) {
				if (!updatedCells[mi].merged) {
					continue;
				}
				const c0 = piece.cells[mi];
				var tr = pieceRow + c0.dr + direction.dr;
				var tc = piece.col + c0.dc + direction.dc;
				if (tr >= 0 && tr < rows && tc >= 0 && tc < cols && board[tr]) {
					board[tr][tc] = 0;
				}
			}
			piece.cells.forEach(function(cell) {
				var r = pieceRow + cell.dr;
				var c = piece.col + cell.dc;
				if (r >= 0 && r < rows && c >= 0 && c < cols && board[r]) {
					board[r][c] = 0;
				}
			});
			piece = Object.assign({}, piece, {row: newRow, col: newCol, cells: updatedCells, mergeCount: piece.mergeCount + mergedCount});
			if (stats && mergedCount > 0) {
				stats.clearRemainderMergeSteps = (stats.clearRemainderMergeSteps || 0) + 1;
			}
			return Object.assign({}, g, {board: board, currentPiece: piece});
		}
	}

	function runRemainderPieceUntilLocked(board, rows, cols, piece, stats) {
		let state = {
			rows: rows,
			cols: cols,
			board: board,
			currentPiece: piece,
			pieceCount: 1,
			nextPiece: null,
			gameOver: false,
			clearLinesPending: null,
			postClearGravityState: null,
			cascadePending: false,
			score: 0,
			highScore: 0,
			seed: 0,
			overlayVisible: false,
			overlayMessage: '',
			fallIntervalMs: 500,
		};
		let guard = 0;
		const maxGuard = rows * cols * 24 + 100;
		while (state.currentPiece != null) {
			if (++guard > maxGuard) {
				throw new Error('runRemainderPieceUntilLocked: exceeded guard');
			}
			state = tickLineClearRemainderStep(state, stats);
		}
	}

	/**
	 * 消行 7.1 收尾：本轮作为**满行**参与除法与剩格下落后，凡属于该满行且**已全空**的行，从棋盘上
	 * **整行抽掉**（行数变少），再在**顶部**补回等量空行，使场地高度不变；其余行**上下相对顺序不变**，
	 * 行内图案（含建造空隙）不变。这样上方悬空行与下方被消行之间的全空行会保留，不会把非空行压缩到场地最底。
	 * @param {Object<number, boolean>} clearedSet 本轮处理过的满行行号集合
	 */
	function packAfterClearedEmptyRows(board, rows, cols, clearedSet) {
		const kept = [];
		for (let r = 0; r < rows; r++) {
			const wasClearedLine = !!clearedSet[r];
			let allZero = true;
			for (let c = 0; c < cols; c++) {
				if (board[r][c] !== 0) {
					allZero = false;
					break;
				}
			}
			if (wasClearedLine && allZero) {
				continue;
			}
			kept.push(board[r].slice());
		}
		const padTop = rows - kept.length;
		for (let r = 0; r < rows; r++) {
			if (r < padTop) {
				for (let c = 0; c < cols; c++) {
					board[r][c] = 0;
				}
			} else {
				const src = kept[r - padTop];
				for (let c = 0; c < cols; c++) {
					board[r][c] = src[c];
				}
			}
		}
	}

	function hasVerticalMergeInClearedRows(board, rows, cols, remainingRowsSet, remainingInCleared) {
		const arr = Array.from(remainingRowsSet);
		for (let i = 0; i < arr.length; i++) {
			const r = arr[i];
			if (r <= 0) {
				continue;
			}
			for (let c = 0; c < cols; c++) {
				if (remainingInCleared[r][c] && board[r][c] !== 0 && board[r][c] === board[r - 1][c]) {
					return true;
				}
			}
		}
		return false;
	}

	function doOneVerticalMergeInClearedRows(board, rows, cols, remainingRowsSet, remainingInCleared) {
		const sorted = Array.from(remainingRowsSet).filter(function(r) { return r > 0; })
												.sort(function(a, b) { return b - a; });
		for (let i = 0; i < sorted.length; i++) {
			var r = sorted[i];
			for (let c = 0; c < cols; c++) {
				if (remainingInCleared[r][c] && board[r][c] !== 0 && board[r][c] === board[r - 1][c]) {
					board[r][c] *= 2;
					board[r - 1][c] = 0;
					compactGravityColumn(board, rows, c);
					remainingInCleared[r][c] = false;
					return true;
				}
			}
		}
		return false;
	}

	/**
	 * 消行除法后：棋盘已写入除法结果，返回 clearedSet、得分、按序剩格列表（尚未从棋盘擦除）。
	 */
	function prepareLineClearDivisionPhase(board, rows, cols, fullRows) {
		const clearedSet = {};
		let scoreAdd = 0;
		const afterClear = board.map(function(row) { return row.slice(); });
		for (let i = 0; i < fullRows.length; i++) {
			const r = fullRows[i];
			let minVal = 0;
			for (let c = 0; c < cols; c++) {
				if (board[r][c] !== 0 && (minVal === 0 || board[r][c] < minVal)) {
					minVal = board[r][c];
				}
			}
			if (minVal === 0) {
				continue;
			}
			clearedSet[r] = true;
			for (let c = 0; c < cols; c++) {
				const v = board[r][c] / minVal;
				if (v === 1) {
					afterClear[r][c] = 0;
					scoreAdd += minVal;
				} else {
					afterClear[r][c] = v;
				}
			}
		}
		for (let i = 0; i < fullRows.length; i++) {
			const r = fullRows[i];
			if (!clearedSet[r]) {
				continue;
			}
			for (let c = 0; c < cols; c++) {
				board[r][c] = afterClear[r][c];
			}
		}
		const sortedList = [];
		for (let r = 0; r < rows; r++) {
			if (!clearedSet[r]) {
				continue;
			}
			for (let c = 0; c < cols; c++) {
				const v = board[r][c];
				if (v !== 0) {
					sortedList.push({r: r, c: c, v: v});
				}
			}
		}
		sortedList.sort(function(a, b) {
			if (b.r !== a.r) {
				return b.r - a.r;
			}
			return a.c - b.c;
		});
		return {scoreAdd: scoreAdd, clearedSet: clearedSet, sortedList: sortedList};
	}

	function runRemainderDropsFromSortedList(board, rows, cols, sortedList, stats) {
		for (let i = 0; i < sortedList.length; i++) {
			board[sortedList[i].r][sortedList[i].c] = 0;
		}
		for (let i = 0; i < sortedList.length; i++) {
			const x = sortedList[i];
			const piece = {
				shape: '_REMAINDER1',
				rotation: 0,
				row: x.r,
				col: x.c,
				cells: [{dr: 0, dc: 0, value: x.v}],
				mergeCount: 0,
			};
			runRemainderPieceUntilLocked(board, rows, cols, piece, stats);
		}
	}

	function buildRemainingInClearedSnapshot(board, rows, cols) {
		const remainingInCleared = [];
		for (let r = 0; r < rows; r++) {
			const row = [];
			for (let c = 0; c < cols; c++) {
				row.push(board[r][c] !== 0);
			}
			remainingInCleared.push(row);
		}
		const remainingRows = [];
		for (let r = 0; r < rows; r++) {
			remainingRows.push(r);
		}
		return {remainingInCleared: remainingInCleared, remainingRows: remainingRows};
	}

	function clearedRowsArrayFromClearedSet(clearedSet) {
		const arr = [];
		for (const k in clearedSet) {
			if (clearedSet[k]) {
				arr.push(Number(k));
			}
		}
		arr.sort(function(a, b) { return a - b; });
		return arr;
	}

	function clearedSetFromRowsArray(rowsArr) {
		const clearedSet = {};
		for (let i = 0; i < rowsArr.length; i++) {
			clearedSet[rowsArr[i]] = true;
		}
		return clearedSet;
	}

	function createRemainderOnePiece(x) {
		const merged = !!(x && x.merged);
		const mc = x && x.mergeCount != null ? x.mergeCount : 0;
		return {
			shape: '_REMAINDER1',
			rotation: 0,
			row: x.r,
			col: x.c,
			cells: [{dr: 0, dc: 0, value: x.v, merged: merged}],
			mergeCount: mc,
		};
	}

	function isLineClearRemainderPhase(g) {
		return Array.isArray(g.lineClearRemainderCells) && g.lineClearRemainderCells.length > 0;
	}

	/**
	 * 页面试玩：所有消行剩格留在棋盘上原位，同一 tick 内按「下优先、同行左先」各落一格（与单粒 tick 规则一致）。
	 */
	function tickLineClearSimultaneousRemainders(g, stats) {
		const board = g.board;
		const rows = g.rows;
		const cols = g.cols;
		const ordered = g.lineClearRemainderCells.slice();
		ordered.sort(function(a, b) {
			if (b.r !== a.r) {
				return b.r - a.r;
			}
			return a.c - b.c;
		});
		const still = [];
		for (let i = 0; i < ordered.length; i++) {
			const e = ordered[i];
			const piece = {
				shape: '_REMAINDER1',
				rotation: 0,
				row: e.r,
				col: e.c,
				cells: [{dr: 0, dc: 0, value: e.v, merged: !!e.merged}],
				mergeCount: e.mergeCount != null ? e.mergeCount : 0,
			};
			const mini = {
				gameOver: false,
				rows: rows,
				cols: cols,
				board: board,
				currentPiece: piece,
				clearLinesPending: null,
				postClearGravityState: null,
				cascadePending: false,
			};
			const out = tickLineClearRemainderStep(mini, stats);
			if (out.currentPiece != null) {
				const p = out.currentPiece;
				still.push({
					r: p.row,
					c: p.col,
					v: p.cells[0].value,
					merged: !!p.cells[0].merged,
					mergeCount: p.mergeCount != null ? p.mergeCount : 0,
				});
			}
		}
		const gBase = Object.assign({}, g, {board: board});
		if (still.length === 0) {
			return finishLineClearRemainderPhase(Object.assign({}, gBase, {lineClearRemainderCells: null}));
		}
		const fullRows = getFullRowIndices(board, rows, cols);
		if (fullRows.length > 0) {
			return syncFlushRemainingLineClearRemainders(Object.assign({}, gBase, {lineClearRemainderCells: still}));
		}
		return Object.assign({}, gBase, {lineClearRemainderCells: still});
	}

	/** 消行处理 + 7.1：除法 → 各剩格 1×1 依次落到底 → 俄式整行抽行下移（或 column 策略）。 @param stats 可选；@param policy 可选 */
	function doClearAndGravityOnly(board, rows, cols, fullRows, stats, policy) {
		if (fullRows.length === 0) {
			const rem = [];
			for (let r = 0; r < rows; r++) {
				const row = [];
				for (let c = 0; c < cols; c++) {
					row.push(false);
				}
				rem.push(row);
			}
			return {scoreAdd: 0, remainingInCleared: rem, remainingRows: []};
		}
		const prep = prepareLineClearDivisionPhase(board, rows, cols, fullRows);
		runRemainderDropsFromSortedList(board, rows, cols, prep.sortedList, stats);
		packAfterClearedEmptyRows(board, rows, cols, prep.clearedSet);
		const snap = buildRemainingInClearedSnapshot(board, rows, cols);
		return {scoreAdd: prep.scoreAdd, remainingInCleared: snap.remainingInCleared, remainingRows: snap.remainingRows};
	}

	function doMergeInClearedRows(board, rows, cols, remainingInCleared, remainingRowsArr) {
		const remainingRowsSet = new Set(remainingRowsArr);
		while (hasVerticalMergeInClearedRows(board, rows, cols, remainingRowsSet, remainingInCleared)) {
			while (doOneVerticalMergeInClearedRows(board, rows, cols, remainingRowsSet, remainingInCleared)) {}
		}
		return getFullRowIndices(board, rows, cols);
	}

	function clearOneRound(board, rows, cols, policy) {
		const fullRows = getFullRowIndices(board, rows, cols);
		if (fullRows.length === 0) {
			return {scoreAdd: 0, newFullRows: [], numLinesCleared: 0};
		}
		const result = doClearAndGravityOnly(board, rows, cols, fullRows, undefined, policy);
		const newFullRows = doMergeInClearedRows(board, rows, cols, result.remainingInCleared, result.remainingRows);
		return {scoreAdd: result.scoreAdd, newFullRows: newFullRows, numLinesCleared: fullRows.length};
	}

	function clearFullLines(board, rows, cols) {
		let totalScore = 0;
		let chainBonus = 1;
		while (true) {
			const result = clearOneRound(board, rows, cols);
			if (result.scoreAdd === 0 && result.newFullRows.length === 0) {
				break;
			}
			totalScore += result.scoreAdd * chainBonus;
			chainBonus += 1;
			if (result.newFullRows.length === 0) {
				break;
			}
		}
		return totalScore;
	}

	function hasAnyCascade(board, rows, cols) {
		for (let c = 0; c < cols; c++) {
			for (let r = 0; r < rows; r++) {
				if (board[r][c] === 0) {
					continue;
				}
				if (r + 1 < rows && board[r][c] === board[r + 1][c]) {
					return true;
				}
				if (r - 1 >= 0 && board[r][c] === board[r - 1][c]) {
					return true;
				}
			}
		}
		return false;
	}

	/** 合并后该列向下落到底（与 compactGravityColumn 一致），不能向上顶否则会顶掉整列导致显示错乱。 */
	function gravityColumn(board, rows, c) {
		const colVals = [];
		for (let r = rows - 1; r >= 0; r--) {
			if (board[r][c] !== 0) {
				colVals.push(board[r][c]);
			}
		}
		for (let k = 0; k < rows; k++) {
			board[rows - 1 - k][c] = k < colVals.length ? colVals[k] : 0;
		}
	}

	function doOneCascadeStep(board, rows, cols, mergeStart) {
		const mode = mergeStart === 'bottom' ? 'bottom' : (mergeStart === 'contact' ? 'contact' : 'top');
		if (mode === 'contact') {
			for (let c = 0; c < cols; c++) {
				let topR = -1;
				for (let r = 0; r < rows; r++) {
					if (board[r][c] !== 0) {
						topR = r;
						break;
					}
				}
				if (topR < 0) {
					continue;
				}
				if (topR + 1 < rows && board[topR][c] === board[topR + 1][c]) {
					board[topR + 1][c] *= 2;
					board[topR][c] = 0;
					gravityColumn(board, rows, c);
					return {didOne: true, more: hasAnyCascade(board, rows, cols)};
				}
			}
			return {didOne: false, more: false};
		}
		if (mode === 'bottom') {
			for (let c = 0; c < cols; c++) {
				for (let r = rows - 1; r >= 0; r--) {
					if (board[r][c] === 0) {
						continue;
					}
					if (r + 1 < rows && board[r][c] === board[r + 1][c]) {
						board[r + 1][c] *= 2;
						board[r][c] = 0;
						gravityColumn(board, rows, c);
						return {didOne: true, more: hasAnyCascade(board, rows, cols)};
					}
					if (r - 1 >= 0 && board[r][c] === board[r - 1][c]) {
						board[r][c] *= 2;
						board[r - 1][c] = 0;
						gravityColumn(board, rows, c);
						return {didOne: true, more: hasAnyCascade(board, rows, cols)};
					}
				}
			}
			return {didOne: false, more: false};
		}
		for (let c = 0; c < cols; c++) {
			for (let r = 0; r < rows; r++) {
				if (board[r][c] === 0) {
					continue;
				}
				if (r + 1 < rows && board[r][c] === board[r + 1][c]) {
					board[r + 1][c] *= 2;
					board[r][c] = 0;
					gravityColumn(board, rows, c);
					return {didOne: true, more: hasAnyCascade(board, rows, cols)};
				}
				if (r - 1 >= 0 && board[r][c] === board[r - 1][c]) {
					board[r][c] *= 2;
					board[r - 1][c] = 0;
					gravityColumn(board, rows, c);
					return {didOne: true, more: hasAnyCascade(board, rows, cols)};
				}
			}
		}
		return {didOne: false, more: false};
	}

	function spawnNextAfterLock(g) {
		const nextCount = g.pieceCount;
		const newCurrent = g.nextPiece != null ? g.nextPiece : spawnNextPiece(g.rows, g.cols, g.seed, nextCount - 1);
		const nextPiece = spawnNextPiece(g.rows, g.cols, g.seed, nextCount);
		const gameOver = hasBlockInRow0(g.board, g.cols) || wouldCollide(g.board, g.rows, g.cols, newCurrent, 0, 0);
		return Object.assign({}, g, {
			currentPiece: gameOver ? null : newCurrent,
			nextPiece: gameOver ? g.nextPiece : nextPiece,
			gameOver: gameOver,
			overlayVisible: gameOver,
			overlayMessage: gameOver ? '游戏结束' : g.overlayMessage,
			cascadePending: false,
		});
	}

	function finishLineClearRemainderPhase(g) {
		const rowsArr = g.lineClearClearedRows;
		if (!rowsArr || rowsArr.length === 0) {
			throw new Error('finishLineClearRemainderPhase: missing lineClearClearedRows');
		}
		const clearedSet = clearedSetFromRowsArray(rowsArr);
		const scoreAdd = g.lineClearScoreAddPending != null ? g.lineClearScoreAddPending : 0;
		packAfterClearedEmptyRows(g.board, g.rows, g.cols, clearedSet);
		const snap = buildRemainingInClearedSnapshot(g.board, g.rows, g.cols);
		return Object.assign({}, g, {
			board: g.board,
			currentPiece: null,
			postClearGravityState: {
				scoreAdd: scoreAdd,
				remainingInCleared: snap.remainingInCleared,
				remainingRows: snap.remainingRows,
			},
			lineClearRemainderCells: null,
			lineClearClearedRows: null,
			lineClearScoreAddPending: null,
		});
	}

	/**
	 * 极罕见：剩格同步下落中途又形成满行时，将仍活跃的剩格依次一口气落完再 pack。
	 */
	function syncFlushRemainingLineClearRemainders(g) {
		const cells = g.lineClearRemainderCells || [];
		const board = g.board;
		const rows = g.rows;
		const cols = g.cols;
		for (let j = 0; j < cells.length; j++) {
			const e = cells[j];
			const piece = createRemainderOnePiece({
				r: e.r,
				c: e.c,
				v: e.v,
				merged: e.merged,
				mergeCount: e.mergeCount,
			});
			runRemainderPieceUntilLocked(board, rows, cols, piece, null);
		}
		return finishLineClearRemainderPhase(Object.assign({}, g, {
			lineClearRemainderCells: null,
		}));
	}

	function resolveLockAfterTick(g, board, lockedPiece, suppressSpawn) {
		const nextCount = g.pieceCount + 1;
		const fullRows = getFullRowIndices(board, g.rows, g.cols);
		if (fullRows.length > 0) {
			return Object.assign({}, g, {
				board: board,
				currentPiece: null,
				pieceCount: nextCount,
				clearLinesPending: fullRows,
			});
		}
		if (suppressSpawn) {
			return Object.assign({}, g, {
				board: board,
				currentPiece: null,
				pieceCount: nextCount,
				clearLinesPending: null,
				postClearGravityState: null,
				cascadePending: false,
				lineClearRemainderCells: null,
				lineClearClearedRows: null,
				lineClearScoreAddPending: null,
			});
		}
		return spawnNextAfterLock(Object.assign({}, g, {board: board, pieceCount: nextCount}));
	}

	/**
	 * @param { { clearedVerticalMerges?: number, cascadeSteps?: number, clearRemainderMergeSteps?: number, steppedLineClearRemainder?: boolean, lineClearBundledApply?: boolean } | null | undefined } stats 可选，用于测试统计 / 分步消行剩格（仅页面）
	 */
	function applyPendingClearLines(g, stats) {
		const post = g.postClearGravityState;
		if (post != null) {
			const remainingRowsSet = new Set(post.remainingRows);
			const hasMore = hasVerticalMergeInClearedRows(g.board, g.rows, g.cols, remainingRowsSet, post.remainingInCleared);
			if (!hasMore) {
				const newFullRows = getFullRowIndices(g.board, g.rows, g.cols);
				const score = g.score + post.scoreAdd;
				const highScore = g.highScore >= score ? g.highScore : score;
				if (newFullRows.length > 0) {
					return Object.assign({}, g, {
						score: score,
						highScore: highScore,
						clearLinesPending: newFullRows,
						postClearGravityState: null,
					});
				}
				return Object.assign({}, g, {
					score: score,
					highScore: highScore,
					clearLinesPending: null,
					postClearGravityState: null,
					cascadePending: true,
				});
			}
			doOneVerticalMergeInClearedRows(g.board, g.rows, g.cols, remainingRowsSet, post.remainingInCleared);
			if (stats) {
				stats.clearedVerticalMerges = (stats.clearedVerticalMerges || 0) + 1;
			}
			return Object.assign({}, g, {
				board: g.board,
				postClearGravityState: post,
			});
		}
		if (g.clearLinesPending == null || g.clearLinesPending.length === 0) {
			return g;
		}
		const useBundled = !stats || !stats.steppedLineClearRemainder || stats.lineClearBundledApply;
		if (!useBundled) {
			const prep = prepareLineClearDivisionPhase(g.board, g.rows, g.cols, g.clearLinesPending);
			const sorted = prep.sortedList;
			const clearedRows = clearedRowsArrayFromClearedSet(prep.clearedSet);
			if (sorted.length === 0) {
				packAfterClearedEmptyRows(g.board, g.rows, g.cols, prep.clearedSet);
				const snap0 = buildRemainingInClearedSnapshot(g.board, g.rows, g.cols);
				return Object.assign({}, g, {
					board: g.board,
					clearLinesPending: null,
					postClearGravityState: {
						scoreAdd: prep.scoreAdd,
						remainingInCleared: snap0.remainingInCleared,
						remainingRows: snap0.remainingRows,
					},
				});
			}
			const listCopy = sorted.map(function(x) {
				return {r: x.r, c: x.c, v: x.v, merged: false, mergeCount: 0};
			});
			for (let zi = 0; zi < sorted.length; zi++) {
				const x = sorted[zi];
				if (g.board[x.r] && x.c >= 0 && x.c < g.cols) {
					g.board[x.r][x.c] = 0;
				}
			}
			return Object.assign({}, g, {
				board: g.board,
				clearLinesPending: null,
				currentPiece: null,
				lineClearRemainderCells: listCopy,
				lineClearClearedRows: clearedRows,
				lineClearScoreAddPending: prep.scoreAdd,
			});
		}
		const result = doClearAndGravityOnly(g.board, g.rows, g.cols, g.clearLinesPending, stats,
			g.lineClearPolicy);
		return Object.assign({}, g, {
			board: g.board,
			clearLinesPending: null,
			postClearGravityState: {
				scoreAdd: result.scoreAdd,
				remainingInCleared: result.remainingInCleared,
				remainingRows: result.remainingRows,
			},
		});
	}

	/**
	 * 测试/工具：从「刚锁块、棋盘已含固化格」的状态出发，按与 tick 相同的顺序跑完
	 * applyPendingClearLines（消行 + 消行区内竖向合并 + 可能的多轮满行）以及随后的 cascadePending 全场合并，
	 * 停在即将生成下一活动块之前：currentPiece 仍为 null，cascadePending 已清。
	 * 要求 currentPiece === null；若 board 无满行则原样返回（清空 pending 标志）。
	 */
	/**
	 * @param { { clearedVerticalMerges?: number, cascadeSteps?: number, clearRemainderMergeSteps?: number } | null | undefined } stats 可选：统计区内竖合、cascade、消行剩格下落合并步数（供测试筛分用例）
	 */
	function advancePostLockLineClearNoSpawn(game, stats) {
		if (game.currentPiece != null) {
			throw new Error('advancePostLockLineClearNoSpawn: currentPiece must be null (locked board only)');
		}
		const rows = game.rows;
		const cols = game.cols;
		let state = Object.assign({}, game);
		state.board = game.board.map(function(row) { return row.slice(); });
		const fr = getFullRowIndices(state.board, rows, cols);
		if (fr.length === 0) {
			return Object.assign({}, state, {
				clearLinesPending: null,
				postClearGravityState: null,
				cascadePending: false,
			});
		}
		state = Object.assign({}, state, {
			clearLinesPending: fr.slice(),
			postClearGravityState: null,
			cascadePending: false,
		});
		let guardApply = 0;
		while ((state.clearLinesPending && state.clearLinesPending.length > 0) || state.postClearGravityState != null) {
			if (++guardApply > 5000) {
				throw new Error('advancePostLockLineClearNoSpawn: applyPendingClearLines exceeded guard');
			}
			state = applyPendingClearLines(state, Object.assign({}, stats || {}, {lineClearBundledApply: true}));
		}
		let guardCascade = 0;
		const polAdv = normalizeLineClearPolicy(state.lineClearPolicy);
		while (state.cascadePending) {
			if (++guardCascade > 2000) {
				throw new Error('advancePostLockLineClearNoSpawn: cascade exceeded guard');
			}
			const cascade = doOneCascadeStep(state.board, rows, cols, polAdv.mergeStart);
			if (stats && cascade.didOne) {
				stats.cascadeSteps = (stats.cascadeSteps || 0) + 1;
			}
			if (!cascade.didOne) {
				state = Object.assign({}, state, {cascadePending: false});
				break;
			}
			if (polAdv.mergeRounds === 'once') {
				state = Object.assign({}, state, {cascadePending: false});
				break;
			}
			if (!cascade.more) {
				state = Object.assign({}, state, {cascadePending: false});
				break;
			}
		}
		return Object.assign({}, state, {
			clearLinesPending: null,
			postClearGravityState: null,
			cascadePending: false,
			currentPiece: null,
		});
	}

	/** 测试：返回终盘 + 是否发生消行区内竖向合并 / cascade 合并 */
	function advancePostLockLineClearNoSpawnWithStats(game) {
		const stats = { clearedVerticalMerges: 0, cascadeSteps: 0, clearRemainderMergeSteps: 0 };
		const state = advancePostLockLineClearNoSpawn(game, stats);
		return {
			board: state.board,
			clearedVerticalMerges: stats.clearedVerticalMerges || 0,
			cascadeSteps: stats.cascadeSteps || 0,
			clearRemainderMergeSteps: stats.clearRemainderMergeSteps || 0,
			hasMergeOrCascade: (stats.clearedVerticalMerges || 0) > 0 || (stats.cascadeSteps || 0) > 0 || (stats.clearRemainderMergeSteps || 0) > 0,
		};
	}

	/** 与正式局 scheduleNext 一致：下一拍本应 spawnNextAfterLock 时即为 true（活动块空且无消行/cascade 收尾工作）。 */
	function isAtPreSpawnGate(g) {
		if (!g || g.gameOver) {
			return true;
		}
		if (g.currentPiece != null) {
			return false;
		}
		if (g.clearLinesPending != null && g.clearLinesPending.length > 0) {
			return false;
		}
		if (g.postClearGravityState != null) {
			return false;
		}
		if (g.cascadePending) {
			return false;
		}
		if (isLineClearRemainderPhase(g)) {
			return false;
		}
		return true;
	}

	/**
	 * 手动调试：单步推进，与主界面调度顺序一致（bundled 消行）。默认 suppressNextSpawn，永不生成下一块。
	 */
	function debugSimulationStep(game, stepOpts) {
		stepOpts = stepOpts || {};
		const suppressNextSpawn = stepOpts.suppressNextSpawn !== false;
		const g = game;
		if (!g || g.gameOver) {
			return g;
		}
		if (g.clearLinesPending != null && g.clearLinesPending.length > 0) {
			return applyPendingClearLines(g, {lineClearBundledApply: true});
		}
		if (g.postClearGravityState != null) {
			return applyPendingClearLines(g, {lineClearBundledApply: true});
		}
		return tick(g, suppressNextSpawn ? {suppressNextSpawn: true} : undefined);
	}

	function moveLeft(game) {
		if (game.gameOver || !game.currentPiece) {
			return game;
		}
		if (isLineClearRemainderPhase(game)) {
			return game;
		}
		const p = game.currentPiece;
		const next = Object.assign({}, p, {col: p.col - 1});
		if (wouldCollide(game.board, game.rows, game.cols, next, 0, 0)) {
			return game;
		}
		return Object.assign({}, game, {currentPiece: next});
	}

	function moveRight(game) {
		if (game.gameOver || !game.currentPiece) {
			return game;
		}
		if (isLineClearRemainderPhase(game)) {
			return game;
		}
		const p = game.currentPiece;
		const next = Object.assign({}, p, {col: p.col + 1});
		if (wouldCollide(game.board, game.rows, game.cols, next, 0, 0)) {
			return game;
		}
		return Object.assign({}, game, {currentPiece: next});
	}

	/**
	 * 旋转后若整块仍在棋盘上方（r&lt;0），逐格下移直到至少一行进入场内或顶到已有格。
	 * 解决 I 竖条在高处转正后整行在视区之上的问题。
	 */
	function kickPieceVerticallyIntoView(rows, cols, board, piece) {
		let cur = piece;
		for (let g = 0; g < rows + 8; g++) {
			const abs = pieceAbsCells(cur);
			let minR = abs[0].r;
			for (let i = 1; i < abs.length; i++) {
				if (abs[i].r < minR) {
					minR = abs[i].r;
				}
			}
			if (minR >= 0) {
				return cur;
			}
			const down = Object.assign({}, cur, {row: cur.row + 1});
			if (pieceOverlapsBoard(board, rows, cols, down, 0, 0)) {
				return cur;
			}
			if (pieceOutOfBounds(rows, cols, down, 0, 0)) {
				return cur;
			}
			cur = down;
		}
		return cur;
	}

	function rotate(game) {
		if (game.gameOver || !game.currentPiece) {
			return game;
		}
		if (isLineClearRemainderPhase(game)) {
			return game;
		}
		const p = game.currentPiece;
		const osz = p.shape === 'O' || p.shape === 'S' || p.shape === 'Z';
		const baseGeom = osz ? rotatePieceKeepBoundingAnchor(p) : rotatePieceCells90CCW(p);
		const tryOffsets = osz ? [0] : [0, -1, 1, -2, 2, -3, 3];
		for (let i = 0; i < tryOffsets.length; i++) {
			const offset = tryOffsets[i];
			let nextPiece = Object.assign({}, baseGeom, {col: p.col + offset});
			if (pieceOutOfBounds(game.rows, game.cols, nextPiece, 0, 0)) {
				continue;
			}
			if (pieceOverlapsBoard(game.board, game.rows, game.cols, nextPiece, 0, 0)) {
				continue;
			}
			nextPiece = kickPieceVerticallyIntoView(game.rows, game.cols, game.board, nextPiece);
			const abs = pieceAbsCells(nextPiece);
			let minR = abs[0].r;
			for (let j = 1; j < abs.length; j++) {
				if (abs[j].r < minR) {
					minR = abs[j].r;
				}
			}
			if (minR < 0) {
				continue;
			}
			if (pieceOverlapsBoard(game.board, game.rows, game.cols, nextPiece, 0, 0)) {
				continue;
			}
			if (pieceOutOfBounds(game.rows, game.cols, nextPiece, 0, 0)) {
				continue;
			}
			return Object.assign({}, game, {currentPiece: nextPiece});
		}
		return game;
	}

	const MAX_TICKS_UNTIL_LOCK = 200;

	function runUntilFirstLock(g) {
		let state = g;
		const initialCount = g.pieceCount;
		let n = 0;
		while (state.pieceCount === initialCount && state.currentPiece != null) {
			if (n >= MAX_TICKS_UNTIL_LOCK) {
				throw new Error('runUntilFirstLock 超时');
			}
			state = tick(state);
			n++;
		}
		return state;
	}

	function tick(game, tickOpts) {
		tickOpts = tickOpts || {};
		const suppressSpawn = !!tickOpts.suppressNextSpawn;
		if (game.gameOver) {
			return game;
		}
		if (game.clearLinesPending != null && game.clearLinesPending.length > 0) {
			return game;
		}
		if (game.postClearGravityState != null) {
			return game;
		}
		const g = Object.assign({}, game);
		if (g.cascadePending) {
			const pol = normalizeLineClearPolicy(g.lineClearPolicy);
			const cascade = doOneCascadeStep(g.board, g.rows, g.cols, pol.mergeStart);
			if (!cascade.didOne) {
				return suppressSpawn
					? Object.assign({}, g, {cascadePending: false, currentPiece: null})
					: spawnNextAfterLock(g);
			}
			if (pol.mergeRounds === 'once') {
				return suppressSpawn
					? Object.assign({}, g, {cascadePending: false, currentPiece: null})
					: spawnNextAfterLock(g);
			}
			if (cascade.more) {
				return Object.assign({}, g, {cascadePending: true});
			}
			return suppressSpawn
				? Object.assign({}, g, {cascadePending: false, currentPiece: null})
				: spawnNextAfterLock(g);
		}
		if (isLineClearRemainderPhase(g)) {
			return tickLineClearSimultaneousRemainders(g, null);
		}
		let piece = g.currentPiece;
		if (!piece) {
			return g;
		}

		if (pieceOutOfBounds(g.rows, g.cols, piece, 1, 0)) {
			const maxDr = Math.max.apply(null, piece.cells.map(function(c) { return c.dr; }));
			const lockRow = Math.min(piece.row, g.rows - 1 - maxDr);
			const lockPieceAt = Object.assign({}, piece, {row: lockRow});
			writePieceToBoard(g.board, g.rows, g.cols, lockPieceAt);
			return resolveLockAfterTick(g, g.board, lockPieceAt, suppressSpawn);
		}

		const rows = g.rows;
		const cols = g.cols;
		const board = g.board;

		while (true) {
			const wouldHit = pieceOverlapsBoard(board, rows, cols, piece, 1, 0);
			if (!wouldHit) {
				// 未锁定前 merged 不占棋盘；纯下落只清非 merged 可能留下的 ghost，再整块下移一行
				piece.cells.forEach(function(cell) {
					if (cell.merged) {
						return;
					}
					var r = piece.row + cell.dr;
					var c = piece.col + cell.dc;
					if (r >= 0 && r < rows && c >= 0 && c < cols && board[r]) {
						board[r][c] = 0;
					}
				});
				return Object.assign({}, g, {board: board, currentPiece: Object.assign({}, piece, {row: piece.row + 1})});
			}

			const pieceRow = piece.row;
			const direction = DIR_DOWN;
			const frontLineCells = getFrontLineCells(piece, direction);

			var hitBottom = false;
			for (var fi = 0; fi < frontLineCells.length; fi++) {
				var targetR = pieceRow + frontLineCells[fi].dr + direction.dr;
				if (targetR >= rows) {
					hitBottom = true;
					break;
				}
			}
			if (hitBottom) {
				const lockedAt = Object.assign({}, piece, {row: pieceRow});
				writePieceToBoard(board, rows, cols, lockedAt);
				return resolveLockAfterTick(g, board, lockedAt, suppressSpawn);
			}

			// 仅看前进方向上的「最前线」格：每个这样的格在前进方向上的目标格，要么为空要么为同数（二者满足其一即可，不是「全部为空」或「全部为同数」）。任一方格在该方向不可行进则整块不可行进，锁定。
			var canMove = true;
			for (var ci = 0; ci < frontLineCells.length; ci++) {
				var cell = frontLineCells[ci];
				var targetR = pieceRow + cell.dr + direction.dr;
				var targetC = piece.col + cell.dc + direction.dc;
				if (targetC < 0 || targetC >= cols || targetR >= rows || targetR < 0 || !board[targetR]) {
					continue;
				}
				var targetValue = board[targetR][targetC];
				if (targetValue !== 0 && targetValue !== cell.value) {
					canMove = false;
					break;
				}
			}
			if (!canMove) {
				const lockedAt = Object.assign({}, piece, {row: pieceRow});
				writePieceToBoard(board, rows, cols, lockedAt);
				return resolveLockAfterTick(g, board, lockedAt, suppressSpawn);
			}

			// 最前线均允许：整块沿前进方向移一格；仅最前线格可与目标格同数合并（合并后数字翻倍写入目标格）
			var newRow = pieceRow + direction.dr;
			var newCol = piece.col + direction.dc;
			var frontKey = {};
			frontLineCells.forEach(function(c) { frontKey[c.dr + ',' + c.dc] = true; });
			var mergedCount = 0;
			var updatedCells = piece.cells.map(function(cell) {
				if (!frontKey[cell.dr + ',' + cell.dc]) {
					return Object.assign({}, cell);
				}
				var targetR = pieceRow + cell.dr + direction.dr;
				var targetC = piece.col + cell.dc + direction.dc;
				if (targetC < 0 || targetC >= cols || targetR >= rows || targetR < 0 || !board[targetR]) {
					return Object.assign({}, cell);
				}
				var targetValue = board[targetR][targetC];
				if (targetValue === cell.value) {
					mergedCount++;
					return Object.assign({}, cell, {value: cell.value * 2, merged: true});
				}
				return Object.assign({}, cell);
			});

			// 「吃掉」固定堆：被合并的堆格从棋盘移除；翻倍值只留在活动块 cells 上，不写棋盘直至锁定
			for (let mi = 0; mi < piece.cells.length; mi++) {
				if (!updatedCells[mi].merged) {
					continue;
				}
				const c0 = piece.cells[mi];
				var targetR = pieceRow + c0.dr + direction.dr;
				var targetC = piece.col + c0.dc + direction.dc;
				if (targetR >= 0 && targetR < rows && targetC >= 0 && targetC < cols && board[targetR]) {
					board[targetR][targetC] = 0;
				}
			}
			// 整块离开原位置：清空棋盘上原 footprint（merged 未写在棋盘上，此处多为 no-op）
			piece.cells.forEach(function(cell) {
				var r = pieceRow + cell.dr;
				var c = piece.col + cell.dc;
				if (r >= 0 && r < rows && c >= 0 && c < cols && board[r]) {
					board[r][c] = 0;
				}
			});
			piece = Object.assign({}, piece, {row: newRow, col: newCol, cells: updatedCells, mergeCount: piece.mergeCount + mergedCount});
			return Object.assign({}, g, {board: board, currentPiece: piece});
		}
	}

	function init(highScore, overrides) {
		highScore = highScore || 0;
		overrides = overrides || {};
		const rows = Math.max(MIN_ROWS, Math.min(MAX_ROWS, overrides.rows != null ? overrides.rows : DEFAULT_CFG.rows));
		const cols = Math.max(MIN_COLS, Math.min(MAX_COLS, overrides.cols != null ? overrides.cols : DEFAULT_CFG.cols));
		const fallIntervalMs = overrides.fallIntervalMs != null ? overrides.fallIntervalMs : DEFAULT_CFG.fallIntervalMs;
		const seed = overrides.seed != null ? overrides.seed : Date.now();
		const board = emptyBoard(rows, cols);
		const currentPiece = spawnNextPiece(rows, cols, seed, 0);
		const nextPiece = spawnNextPiece(rows, cols, seed, 1);
		return {
			rows: rows,
			cols: cols,
			board: board,
			currentPiece: currentPiece,
			nextPiece: nextPiece,
			score: 0,
			highScore: highScore,
			gameOver: false,
			overlayVisible: false,
			overlayMessage: '',
			fallIntervalMs: fallIntervalMs,
			cascadePending: false,
			pieceCount: 1,
			seed: seed,
			clearLinesPending: null,
			postClearGravityState: null,
			level: 0,
			linesClearedTotal: 0,
			lineClearPolicy: normalizeLineClearPolicy(overrides.lineClearPolicy),
			lineClearRemainderCells: null,
			lineClearClearedRows: null,
			lineClearScoreAddPending: null,
		};
	}

	function serializeGameState(g) {
		function serPiece(p) {
			if (!p) {
				return null;
			}
			return {
				shape: p.shape,
				rotation: p.rotation,
				row: p.row,
				col: p.col,
				cells: p.cells.map(function(c) {
					return {dr: c.dr, dc: c.dc, value: c.value, merged: !!c.merged};
				}),
				mergeCount: p.mergeCount,
			};
		}

		return {
			rows: g.rows,
			cols: g.cols,
			board: g.board.map(function(row) { return row.slice(); }),
			currentPiece: serPiece(g.currentPiece),
			nextPiece: serPiece(g.nextPiece),
			score: g.score,
			highScore: g.highScore,
			gameOver: g.gameOver,
			overlayVisible: g.overlayVisible,
			overlayMessage: g.overlayMessage,
			fallIntervalMs: g.fallIntervalMs,
			cascadePending: g.cascadePending,
			pieceCount: g.pieceCount,
			seed: g.seed,
			clearLinesPending: g.clearLinesPending ? g.clearLinesPending.slice() : null,
			postClearGravityState: g.postClearGravityState == null ? null : {
				scoreAdd: g.postClearGravityState.scoreAdd,
				remainingInCleared: g.postClearGravityState.remainingInCleared.map(function(r) { return r.slice(); }),
				remainingRows: g.postClearGravityState.remainingRows.slice(),
			},
			level: g.level != null ? g.level : 0,
			linesClearedTotal: g.linesClearedTotal != null ? g.linesClearedTotal : 0,
			lineClearPolicy: g.lineClearPolicy ? normalizeLineClearPolicy(g.lineClearPolicy) : getDefaultLineClearPolicy(),
			lineClearRemainderCells: g.lineClearRemainderCells
				? g.lineClearRemainderCells.map(function(x) {
					return {
						r: x.r,
						c: x.c,
						v: x.v,
						merged: !!x.merged,
						mergeCount: x.mergeCount != null ? x.mergeCount : 0,
					};
				})
				: null,
			lineClearClearedRows: g.lineClearClearedRows ? g.lineClearClearedRows.slice() : null,
			lineClearScoreAddPending: g.lineClearScoreAddPending != null ? g.lineClearScoreAddPending : null,
		};
	}

	const MIN_ROWS_BLOCKS = 8;
	const MIN_COLS_BLOCKS = 6;
	const DEFAULT_FALL_INTERVAL_MS_BLOCKS = 500;

	function deserializeGameState(raw) {
		if (!raw || typeof raw !== 'object') {
			return null;
		}
		const o = raw;
		const rows = Number(o.rows);
		const cols = Number(o.cols);
		if (!Number.isFinite(rows) || rows < MIN_ROWS_BLOCKS || !Number.isFinite(cols) || cols
				< MIN_COLS_BLOCKS) {
			return null;
		}
		const boardRaw = o.board;
		if (!Array.isArray(boardRaw) || boardRaw.length !== rows) {
			return null;
		}
		const board = [];
		for (let r = 0; r < rows; r++) {
			const rowRaw = boardRaw[r];
			if (!Array.isArray(rowRaw) || rowRaw.length !== cols) {
				return null;
			}
			board.push(rowRaw.map(function(v) { return Number.isFinite(Number(v)) && Number(v) >= 0 ? Number(v) : 0; }));
		}

		function dePiece(p) {
			if (!p || typeof p !== 'object') {
				return null;
			}
			const shape = String(p.shape || 'I');
			if (shape === '_REMAINDER1') {
				const row = Number(p.row);
				const col = Number(p.col);
				if (!Number.isFinite(row) || !Number.isFinite(col)) {
					return null;
				}
				let val = 2;
				const cellsRawRm = p.cells;
				if (Array.isArray(cellsRawRm) && cellsRawRm.length >= 1) {
					const cv = Number(cellsRawRm[0].value);
					val = Number.isFinite(cv) && cv >= 2 ? cv : 2;
				}
				const merged0 = !!(cellsRawRm[0] && cellsRawRm[0].merged);
				return {
					shape: '_REMAINDER1',
					rotation: 0,
					row: row,
					col: col,
					cells: [{dr: 0, dc: 0, value: val, merged: merged0}],
					mergeCount: Math.max(0, Number(p.mergeCount) || 0),
				};
			}
			const rotation = Math.max(0, Math.min(3, Number(p.rotation) || 0));
			const row = Number(p.row);
			const col = Number(p.col);
			if (SHAPE_KEYS.indexOf(shape) === -1 || !Number.isFinite(row) || !Number.isFinite(col)) {
				return null;
			}
			const base = createPiece(shape, rotation, row, col);
			const cellsRaw = p.cells;
			if (Array.isArray(cellsRaw) && cellsRaw.length === base.cells.length) {
				base.cells = cellsRaw.map(function(c) {
					return {
						dr: Number(c.dr) || 0,
						dc: Number(c.dc) || 0,
						value: Number(c.value) >= 2 ? Number(c.value) : 2,
						merged: !!c.merged,
					};
				});
			}
			base.mergeCount = Math.max(0, Number(p.mergeCount) || 0);
			return base;
		}

		const currentPiece = dePiece(o.currentPiece);
		const nextPiece = dePiece(o.nextPiece);
		const fallIntervalMs = Math.max(100, Number(o.fallIntervalMs) || DEFAULT_FALL_INTERVAL_MS_BLOCKS);
		const clearLinesPending = Array.isArray(o.clearLinesPending) ? o.clearLinesPending.slice() : null;
		const postRaw = o.postClearGravityState;
		let postClearGravityState = null;
		if (postRaw && typeof postRaw === 'object') {
			const remainingInCleared = postRaw.remainingInCleared;
			const remainingRows = postRaw.remainingRows;
			if (Array.isArray(remainingInCleared) && Array.isArray(remainingRows)) {
				postClearGravityState = {
					scoreAdd: Number(postRaw.scoreAdd) || 0,
					remainingInCleared: remainingInCleared.map(function(r) { return Array.isArray(r) ? r.slice() : []; }),
					remainingRows: remainingRows.slice(),
				};
			}
		}
		return {
			rows: rows,
			cols: cols,
			board: board,
			currentPiece: currentPiece,
			nextPiece: nextPiece,
			score: Math.max(0, Number(o.score) || 0),
			highScore: Math.max(0, Number(o.highScore) || 0),
			gameOver: Boolean(o.gameOver),
			overlayVisible: Boolean(o.overlayVisible),
			overlayMessage: String(o.overlayMessage != null ? o.overlayMessage : ''),
			fallIntervalMs: fallIntervalMs,
			cascadePending: Boolean(o.cascadePending),
			pieceCount: Math.max(1, Number(o.pieceCount) || 1),
			seed: Number.isFinite(Number(o.seed)) ? Number(o.seed) : Date.now(),
			clearLinesPending: clearLinesPending,
			postClearGravityState: postClearGravityState,
			level: Math.max(0, Math.min(20, Number(o.level) || 0)),
			linesClearedTotal: Math.max(0, Number(o.linesClearedTotal) || 0),
			lineClearPolicy: normalizeLineClearPolicy(o.lineClearPolicy),
			lineClearRemainderCells: (function() {
				function parseCellList(raw) {
					if (!Array.isArray(raw)) {
						return null;
					}
					const out = [];
					for (let i = 0; i < raw.length; i++) {
						const it = raw[i];
						if (!it || typeof it !== 'object') {
							continue;
						}
						const rr = Number(it.r);
						const cc = Number(it.c);
						const vv = Number(it.v);
						if (!Number.isFinite(rr) || !Number.isFinite(cc) || !Number.isFinite(vv)) {
							continue;
						}
						out.push({
							r: rr,
							c: cc,
							v: vv,
							merged: !!it.merged,
							mergeCount: Number.isFinite(Number(it.mergeCount)) ? Number(it.mergeCount) : 0,
						});
					}
					return out.length > 0 ? out : null;
				}
				let cells = parseCellList(o.lineClearRemainderCells);
				if (!cells && Array.isArray(o.lineClearRemainderList) && o.lineClearRemainderList.length > 0) {
					const legacy = o.lineClearRemainderList;
					const idx = o.lineClearRemainderIndex != null && Number.isFinite(Number(o.lineClearRemainderIndex))
						? Math.max(0, Math.min(legacy.length - 1, Number(o.lineClearRemainderIndex)))
						: 0;
					const tail = legacy.slice(idx);
					const conv = [];
					for (let j = 0; j < tail.length; j++) {
						const it = tail[j];
						if (!it || typeof it !== 'object') {
							continue;
						}
						const rr = Number(it.r);
						const cc = Number(it.c);
						const vv = Number(it.v);
						if (!Number.isFinite(rr) || !Number.isFinite(cc) || !Number.isFinite(vv)) {
							continue;
						}
						conv.push({r: rr, c: cc, v: vv, merged: false, mergeCount: 0});
					}
					cells = conv.length > 0 ? conv : null;
				}
				return cells;
			})(),
			lineClearClearedRows: Array.isArray(o.lineClearClearedRows)
				? o.lineClearClearedRows.map(function(x) { return Number(x); }).filter(function(x) { return Number.isFinite(x); })
				: null,
			lineClearScoreAddPending: o.lineClearScoreAddPending != null && Number.isFinite(Number(o.lineClearScoreAddPending))
				? Number(o.lineClearScoreAddPending)
				: null,
		};
	}

	return {
		STORAGE_HIGH_SCORE_BLOCKS: STORAGE_HIGH_SCORE_BLOCKS,
		STORAGE_SETTINGS_BLOCKS: STORAGE_SETTINGS_BLOCKS,
		STORAGE_GAME_STATE_BLOCKS: STORAGE_GAME_STATE_BLOCKS,
		getDefaultLineClearPolicy: getDefaultLineClearPolicy,
		normalizeLineClearPolicy: normalizeLineClearPolicy,
		getLineClearBaseScore: getLineClearBaseScore,
		init: init,
		tick: tick,
		moveLeft: moveLeft,
		moveRight: moveRight,
		rotate: rotate,
		runUntilFirstLock: runUntilFirstLock,
		applyPendingClearLines: applyPendingClearLines,
		advancePostLockLineClearNoSpawn: advancePostLockLineClearNoSpawn,
		advancePostLockLineClearNoSpawnWithStats: advancePostLockLineClearNoSpawnWithStats,
		pieceAbsCells: pieceAbsCells,
		createPiece: createPiece,
		getFullRowIndices: getFullRowIndices,
		clearOneRound: clearOneRound,
		serializeGameState: serializeGameState,
		deserializeGameState: deserializeGameState,
		Cell: Cell,
		Block: Block,
		getFrontLineCells: getFrontLineCells,
		DIR_DOWN: DIR_DOWN,
		DIR_LEFT: DIR_LEFT,
		DIR_RIGHT: DIR_RIGHT,
		getBoardWithCurrentPiece: getBoardWithCurrentPiece,
		createCustomPieceFromAbsCells: createCustomPieceFromAbsCells,
		isAtPreSpawnGate: isAtPreSpawnGate,
		debugSimulationStep: debugSimulationStep,
	};
});

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
	const DEFAULT_CFG = {rows: 12, cols: 10, fallIntervalMs: 500, lockDelayDurationMs: 500};
	const MIN_LOCK_DELAY_MS = 100;
	const MAX_LOCK_DELAY_MS = 1000;
	/** 整理阶段非玩家块：0 = 本拍内接触后即固化（尽量短） */
	const REFORM_LOCK_TICKS = 0;
	/**
	 * 消行后行为（normalize 写死，非用户策略）
	 * - afterClearPack：恒为 whole（7.1 仅 `packAfterClearedEmptyRows`；旧 whole/column 已废弃）
	 * - mergeStart / mergeRounds：contact + untilStable
	 * - aboveRowsMode：分步消行时「上方行」切块方式，手动调试可调
	 */
	const DEFAULT_LINE_CLEAR_POLICY = {
		afterClearPack: 'whole',
		mergeStart: 'contact',
		mergeRounds: 'untilStable',
		/** 分步消行整理：「上方行」视为活动块的方式 — column 每列竖条；whole 每组上方区域整体一块（可多断格）。默认 whole，与玩法补充 2.2「整体模式」一致；与 afterClearPack 无关。 */
		aboveRowsMode: 'whole',
	};

	function getDefaultLineClearPolicy() {
		return {
			afterClearPack: DEFAULT_LINE_CLEAR_POLICY.afterClearPack,
			mergeStart: DEFAULT_LINE_CLEAR_POLICY.mergeStart,
			mergeRounds: DEFAULT_LINE_CLEAR_POLICY.mergeRounds,
			aboveRowsMode: DEFAULT_LINE_CLEAR_POLICY.aboveRowsMode,
		};
	}

	function normalizeLineClearPolicy(raw) {
		const d = getDefaultLineClearPolicy();
		if (!raw || typeof raw !== 'object') {
			return d;
		}
		const aboveRowsMode = raw.aboveRowsMode === 'column' ? 'column' : 'whole';
		return {
			afterClearPack: 'whole',
			mergeStart: 'contact',
			mergeRounds: 'untilStable',
			aboveRowsMode: aboveRowsMode,
		};
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

	/** 从整理活动块中抠掉绝对坐标 (absR,absC) 一格，重算 row/col 与 dr/dc；无格则返回 null。 */
	function reformPieceAfterRemovingAbsCell(piece, absR, absC) {
		const remaining = [];
		for (let i = 0; i < piece.cells.length; i++) {
			const c = piece.cells[i];
			const ar = piece.row + c.dr;
			const ac = piece.col + c.dc;
			if (ar === absR && ac === absC) {
				continue;
			}
			remaining.push(c);
		}
		if (remaining.length === 0) {
			return null;
		}
		let minR = Infinity;
		let minC = Infinity;
		for (let ri = 0; ri < remaining.length; ri++) {
			const ar = piece.row + remaining[ri].dr;
			const ac = piece.col + remaining[ri].dc;
			if (ar < minR) {
				minR = ar;
			}
			if (ac < minC) {
				minC = ac;
			}
		}
		const newCells = remaining.map(function(c) {
			const ar = piece.row + c.dr;
			const ac = piece.col + c.dc;
			return Object.assign({}, c, {
				dr: ar - minR,
				dc: ac - minC,
			});
		});
		return Object.assign({}, piece, {
			row: minR,
			col: minC,
			cells: newCells,
		});
	}

	/**
	 * 当前块与下方「另一整理块」同数合并后，从被吃块中去掉对应格（真实 board 上该格本为 0，仅靠 vboard 无法区分）。
	 */
	function consumeReformMergeFromOtherPieces(working, moverIndex, pieceBefore, newPiece) {
		const pieceRow = pieceBefore.row;
		const direction = DIR_DOWN;
		for (let mi = 0; mi < newPiece.cells.length; mi++) {
			if (!newPiece.cells[mi].merged) {
				continue;
			}
			const c0 = pieceBefore.cells[mi];
			const trM = pieceRow + c0.dr + direction.dr;
			const tcM = pieceBefore.col + c0.dc + direction.dc;
			const srcVal = c0.value;
			for (let j = 0; j < working.length; j++) {
				if (j === moverIndex || !working[j].piece) {
					continue;
				}
				const abs = pieceAbsCells(working[j].piece);
				let hit = false;
				for (let k = 0; k < abs.length; k++) {
					if (abs[k].r === trM && abs[k].c === tcM && abs[k].value === srcVal) {
						hit = true;
						break;
					}
				}
				if (!hit) {
					continue;
				}
				working[j].piece = reformPieceAfterRemovingAbsCell(working[j].piece, trM, tcM);
				break;
			}
		}
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

	/**
	 * 整理阶段：单个方格上的数字（与《技术设计》Cell 对应；此处与 legacy `{dr,dc,value,merged}` 可并存）。
	 */
	function ReformPieceCell(dr, dc, value, merged) {
		this.dr = dr;
		this.dc = dc;
		this.value = value == null ? 2 : value;
		this.merged = !!merged;
	}
	ReformPieceCell.prototype.doubleAfterMerge = function() {
		this.value *= 2;
		this.merged = true;
		return this.value;
	};

	/**
	 * 消行剩格一步下落 / 整理块一步下落的共用判定（只读 board，不写字）。
	 * mergeOpts（可选）：整理阶段传入 mergeCheckBoard / mergeCheckCellGroup / lineClearPolicy 并 enableWholeMergeBlock，
	 * 使竖并与链式整理共用 isAdjacentVerticalMergeBlockedWhole；剩格迷你局不传。
	 * @returns {{ kind: 'oob' } | { kind: 'solidify' } | { kind: 'free', newPiece: object } | { kind: 'afterHit', newPiece: object, mergedCount: number }}
	 */
	function computeOneStepDownFall(board, rows, cols, piece, mergeOpts) {
		mergeOpts = mergeOpts || {};
		const mob = mergeOpts.enableWholeMergeBlock === true;
		const mBoard = mergeOpts.mergeCheckBoard;
		const mCg = mergeOpts.mergeCheckCellGroup;
		const pol = mergeOpts.lineClearPolicy;
		if (pieceOutOfBounds(rows, cols, piece, 1, 0)) {
			return {kind: 'oob'};
		}
		const wouldHit = pieceOverlapsBoard(board, rows, cols, piece, 1, 0);
		if (!wouldHit) {
			return {kind: 'free', newPiece: Object.assign({}, piece, {row: piece.row + 1})};
		}
		const pieceRow = piece.row;
		const direction = DIR_DOWN;
		const frontLineCells = getFrontLineCells(piece, direction);
		for (let fi = 0; fi < frontLineCells.length; fi++) {
			if (pieceRow + frontLineCells[fi].dr + direction.dr >= rows) {
				return {kind: 'solidify'};
			}
		}
		let canMove = true;
		for (let ci = 0; ci < frontLineCells.length; ci++) {
			const cell = frontLineCells[ci];
			const targetR2 = pieceRow + cell.dr + direction.dr;
			const targetC2 = piece.col + cell.dc + direction.dc;
			if (targetC2 < 0 || targetC2 >= cols || targetR2 >= rows || targetR2 < 0 || !board[targetR2]) {
				continue;
			}
			const targetValue = board[targetR2][targetC2];
			if (targetValue !== 0 && targetValue !== cell.value) {
				canMove = false;
				break;
			}
			if (targetValue === cell.value && mob && mBoard && mCg && pol != null
					&& isAdjacentVerticalMergeBlockedWholeReformPhase(pol, mCg, mBoard, rows, cols, targetR2 - 1, targetR2, targetC2)) {
				canMove = false;
				break;
			}
		}
		if (!canMove) {
			return {kind: 'solidify'};
		}
		const newRow = pieceRow + direction.dr;
		const newCol = piece.col + direction.dc;
		const frontKey = {};
		frontLineCells.forEach(function(c) { frontKey[c.dr + ',' + c.dc] = true; });
		let mergedCount = 0;
		const updatedCells = piece.cells.map(function(cell) {
			if (!frontKey[cell.dr + ',' + cell.dc]) {
				return Object.assign({}, cell);
			}
			const tr = pieceRow + cell.dr + direction.dr;
			const tc = piece.col + cell.dc + direction.dc;
			if (tc < 0 || tc >= cols || tr >= rows || tr < 0 || !board[tr]) {
				return Object.assign({}, cell);
			}
			const tv = board[tr][tc];
			if (tv === cell.value) {
				if (mob && mBoard && mCg && pol != null
						&& isAdjacentVerticalMergeBlockedWholeReformPhase(pol, mCg, mBoard, rows, cols, tr - 1, tr, tc)) {
					return Object.assign({}, cell);
				}
				mergedCount++;
				return Object.assign({}, cell, {value: cell.value * 2, merged: true});
			}
			return Object.assign({}, cell);
		});
		return {
			kind: 'afterHit',
			newPiece: Object.assign({}, piece, {
				row: newRow,
				col: newCol,
				cells: updatedCells,
				mergeCount: piece.mergeCount + mergedCount,
			}),
			mergedCount: mergedCount,
		};
	}

	/**
	 * 一步下落（free 或 afterHit）后，在真实 board 上清除被合并的静态格与旧占位；与 computeOneStepDownFall 成对使用。
	 */
	function applyBoardWritesAfterFallStep(board, cg, rows, cols, pieceBefore, newPiece) {
		const pieceRow = pieceBefore.row;
		const direction = DIR_DOWN;
		let anyMerged = false;
		for (let i = 0; i < newPiece.cells.length; i++) {
			if (newPiece.cells[i].merged) {
				anyMerged = true;
				break;
			}
		}
		if (anyMerged) {
			for (let mi = 0; mi < newPiece.cells.length; mi++) {
				if (!newPiece.cells[mi].merged) {
					continue;
				}
				const c0 = pieceBefore.cells[mi];
				const trM = pieceRow + c0.dr + direction.dr;
				const tcM = pieceBefore.col + c0.dc + direction.dc;
				if (trM >= 0 && trM < rows && tcM >= 0 && tcM < cols && board[trM]) {
					board[trM][tcM] = 0;
					if (cg) {
						cg[trM][tcM] = 0;
					}
				}
			}
			pieceBefore.cells.forEach(function(cell) {
				const r = pieceRow + cell.dr;
				const c = pieceBefore.col + cell.dc;
				if (r >= 0 && r < rows && c >= 0 && c < cols && board[r]) {
					board[r][c] = 0;
					if (cg) {
						cg[r][c] = 0;
					}
				}
			});
			return;
		}
		pieceBefore.cells.forEach(function(cell) {
			if (cell.merged) {
				return;
			}
			const r = pieceRow + cell.dr;
			const c = pieceBefore.col + cell.dc;
			if (r >= 0 && r < rows && c >= 0 && c < cols && board[r]) {
				board[r][c] = 0;
				if (cg) {
					cg[r][c] = 0;
				}
			}
		});
	}

	/**
	 * 整理阶段下落中的活动块：封装前线格判定与一步下落/固化（对齐《玩法》§4.1、`playerControllable === false`）。
	 */
	function ReformActivePiece(legacyPiece) {
		this.piece = legacyPiece;
		this.playerControllable = false;
	}

	/**
	 * 对 miniGame 状态执行一步下落（与原先 tickLineClearRemainderStep 行为一致）。
	 * @param {{gameOver:boolean,rows:number,cols:number,board:any,boardCellGroup:any|null,currentPiece:any}} g
	 */
	ReformActivePiece.prototype.applyOneFallTick = function(g, stats) {
		if (g.gameOver || !g.currentPiece) {
			return g;
		}
		const board = g.board;
		const rows = g.rows;
		const cols = g.cols;
		const cg = g.boardCellGroup || null;
		const piece = g.currentPiece;

		const r = computeOneStepDownFall(board, rows, cols, piece);
		if (r.kind === 'oob') {
			const maxDr = Math.max.apply(null, piece.cells.map(function(c) { return c.dr; }));
			const lockRow = Math.min(piece.row, rows - 1 - maxDr);
			const lockPieceAt = Object.assign({}, piece, {row: lockRow});
			writePieceToBoard(board, rows, cols, lockPieceAt, cg);
			return Object.assign({}, g, {board: board, currentPiece: null});
		}
		if (r.kind === 'solidify') {
			writePieceToBoard(board, rows, cols, Object.assign({}, piece, {row: piece.row}), cg);
			return Object.assign({}, g, {board: board, currentPiece: null});
		}
		if (r.kind === 'free') {
			applyBoardWritesAfterFallStep(board, cg, rows, cols, piece, r.newPiece);
			return Object.assign({}, g, {board: board, currentPiece: r.newPiece});
		}
		if (r.kind === 'afterHit') {
			applyBoardWritesAfterFallStep(board, cg, rows, cols, piece, r.newPiece);
			if (stats && r.mergedCount > 0) {
				stats.clearRemainderMergeSteps = (stats.clearRemainderMergeSteps || 0) + 1;
			}
			return Object.assign({}, g, {board: board, currentPiece: r.newPiece});
		}
		return g;
	};

	/** 将其它整理中活动块叠在只读副本上（写入真实数值，供碰撞与合并判定）。 */
	function buildVirtualBoardForReform(board, rows, cols, workingEntries, skipIndex) {
		const b = board.map(function(row) { return row.slice(); });
		for (let i = 0; i < workingEntries.length; i++) {
			if (i === skipIndex || !workingEntries[i].piece) {
				continue;
			}
			const abs = pieceAbsCells(workingEntries[i].piece);
			for (let k = 0; k < abs.length; k++) {
				const a = abs[k];
				if (a.r >= 0 && a.r < rows && a.c >= 0 && a.c < cols) {
					b[a.r][a.c] = a.value;
				}
			}
		}
		return b;
	}

	/** 固定堆 + 当前所有整理块叠图，供 isAdjacentVerticalMergeBlockedWhole 与真实盘面一致。 */
	function buildCompositeBoardGroupAllReformPieces(board, boardCellGroup, rows, cols, workingEntries) {
		const b = board.map(function(row) { return row.slice(); });
		const g = boardCellGroup
			? boardCellGroup.map(function(row) { return row.slice(); })
			: emptyBoardCellGroup(rows, cols);
		for (let i = 0; i < workingEntries.length; i++) {
			if (!workingEntries[i].piece) {
				continue;
			}
			const piece = workingEntries[i].piece;
			const abs = pieceAbsCells(piece);
			const gid = piece.shape === '_ABOVE_WHOLE_' && piece.aboveWholeGroupId != null && piece.aboveWholeGroupId > 0
				? piece.aboveWholeGroupId
				: 0;
			for (let k = 0; k < abs.length; k++) {
				const a = abs[k];
				if (a.r >= 0 && a.r < rows && a.c >= 0 && a.c < cols) {
					b[a.r][a.c] = a.value;
					g[a.r][a.c] = gid;
				}
			}
		}
		return {board: b, cellGroup: g};
	}

	function playerCurrentPieceCanMoveDown(board, rows, cols, piece) {
		const r = computeOneStepDownFall(board, rows, cols, piece);
		return r.kind === 'free' || r.kind === 'afterHit';
	}

	function computePlayerLockTicks(lockDelayDurationMs, fallIntervalMs) {
		const fd = Math.max(1, fallIntervalMs || 500);
		const ld = Math.max(MIN_LOCK_DELAY_MS, Math.min(MAX_LOCK_DELAY_MS, lockDelayDurationMs || 500));
		return Math.max(1, Math.ceil(ld / fd));
	}

	/**
	 * 《玩法》§7.2：整理阶段多块同拍下移、固化、链式消行。
	 */
	function ReformPhaseController() {}

	ReformPhaseController.prototype.tickFrame = function(g, tickOpts) {
		tickOpts = tickOpts || {};
		const suppressSpawn = !!tickOpts.suppressNextSpawn || g.suppressSpawnAfterReform === true;
		ensureBoardCellGroup(g);
		if (g.clearLinesPending != null && g.clearLinesPending.length > 0) {
			return applyPendingClearLines(g, tickOpts);
		}
		const board = g.board;
		const rows = g.rows;
		const cols = g.cols;
		const cg = g.boardCellGroup;
		let working = g.reformPieces.map(function(e) {
			return {piece: e.piece, lockTicks: e.lockTicks};
		});
		const order = working.map(function(_, idx) { return idx; }).sort(function(ia, ib) {
			const da = pieceMaxFootprintRow(working[ia].piece);
			const db = pieceMaxFootprintRow(working[ib].piece);
			if (db !== da) {
				return db - da;
			}
			if (working[ia].piece.col !== working[ib].piece.col) {
				return working[ia].piece.col - working[ib].piece.col;
			}
			return working[ia].piece.row - working[ib].piece.row;
		});
		const movedThisRound = [];
		for (let oi = 0; oi < order.length; oi++) {
			movedThisRound[order[oi]] = false;
		}
		for (let si = 0; si < order.length; si++) {
			const i = order[si];
			const pieceBeforeMove = working[i].piece;
			if (!pieceBeforeMove) {
				continue;
			}
			const mergeCtx = buildCompositeBoardGroupAllReformPieces(board, cg, rows, cols, working);
			const vboard = buildVirtualBoardForReform(board, rows, cols, working, i);
			const fallR = computeOneStepDownFall(vboard, rows, cols, pieceBeforeMove, {
				lineClearPolicy: g.lineClearPolicy,
				mergeCheckBoard: mergeCtx.board,
				mergeCheckCellGroup: mergeCtx.cellGroup,
				enableWholeMergeBlock: true,
			});
			if (fallR.kind === 'free' || fallR.kind === 'afterHit') {
				applyBoardWritesAfterFallStep(board, cg, rows, cols, pieceBeforeMove, fallR.newPiece);
				working[i].piece = fallR.newPiece;
				if (fallR.kind === 'afterHit') {
					let anyMerged = false;
					for (let mk = 0; mk < fallR.newPiece.cells.length; mk++) {
						if (fallR.newPiece.cells[mk].merged) {
							anyMerged = true;
							break;
						}
					}
					if (anyMerged) {
						consumeReformMergeFromOtherPieces(working, i, pieceBeforeMove, fallR.newPiece);
					}
				}
				working[i].lockTicks = null;
				movedThisRound[i] = true;
			}
		}
		for (let wi = 0; wi < working.length; wi++) {
			if (!working[wi].piece) {
				continue;
			}
			if (movedThisRound[wi]) {
				continue;
			}
			if (working[wi].lockTicks == null) {
				working[wi].lockTicks = REFORM_LOCK_TICKS;
			} else {
				working[wi].lockTicks -= 1;
			}
		}
		const solidifyIndices = [];
		for (let zi = 0; zi < working.length; zi++) {
			if (!working[zi].piece) {
				continue;
			}
			if (movedThisRound[zi]) {
				continue;
			}
			if (working[zi].lockTicks != null && working[zi].lockTicks <= 0) {
				solidifyIndices.push(zi);
			}
		}
		solidifyIndices.sort(function(a, b) { return b - a; });
		for (let si = 0; si < solidifyIndices.length; si++) {
			const idx = solidifyIndices[si];
			const p = working[idx].piece;
			writePieceToBoard(board, rows, cols, p, cg);
			working.splice(idx, 1);
		}
		working = working.filter(function(e) {
			return e.piece != null;
		});
		let gNext = Object.assign({}, g, {board: board, reformPieces: working});
		const frDefer = getFullRowIndices(board, rows, cols);
		if (frDefer.length > 0) {
			return Object.assign({}, gNext, {clearLinesPending: frDefer.slice()});
		}
		if (working.length === 0) {
			return completeReformPackAndSpawn(gNext, suppressSpawn);
		}
		gNext.reformPieces = working;
		return gNext;
	};

	function tickReformPhase(g, tickOpts) {
		return new ReformPhaseController().tickFrame(g, tickOpts);
	}

	function completeReformPackAndSpawn(g, suppressSpawn) {
		const rowsArr = g.lineClearClearedRows;
		if (!rowsArr || rowsArr.length === 0) {
			throw new Error('completeReformPackAndSpawn: missing lineClearClearedRows');
		}
		const clearedSet = clearedSetFromRowsArray(rowsArr);
		const scoreAdd = g.lineClearScoreAddPending != null ? g.lineClearScoreAddPending : 0;
		packAfterClearedEmptyRows(g.board, g.rows, g.cols, clearedSet, g.boardCellGroup);
		const score = g.score + scoreAdd;
		const highScore = g.highScore >= score ? g.highScore : score;
		const nextCount = g.pieceCount + 1;
		const base = Object.assign({}, g, {
			board: g.board,
			score: score,
			highScore: highScore,
			reformPieces: null,
			lineClearClearedRows: null,
			lineClearScoreAddPending: null,
			lineClearRemainderCells: null,
			lineClearAbovePieces: null,
			postClearGravityState: null,
			cascadePending: false,
			currentPiece: null,
			pieceCount: nextCount,
			playerLockTicksRemaining: null,
		});
		if (suppressSpawn || g.suppressSpawnAfterReform === true) {
			return base;
		}
		return spawnNextAfterLock(base);
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

	/** 与 board 同形；>0 表示「整块上方行」同一落地位，禁止与同组邻格竖合（修正案：whole 模式） */
	function emptyBoardCellGroup(rows, cols) {
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

	function ensureBoardCellGroup(g) {
		if (!g || !g.board) {
			return null;
		}
		if (!g.boardCellGroup || g.boardCellGroup.length !== g.rows) {
			g.boardCellGroup = emptyBoardCellGroup(g.rows, g.cols);
		}
		return g.boardCellGroup;
	}

	/**
	 * whole 模式下：相邻两行 (rUpper,rLower) 在列 c 的竖向同数合并是否禁止。
	 * 语义来源：《玩法补充》§十「一组上方行是一块」与主《玩法》旧 7.2「全盘按列扫」的冲突处理。
	 * 分条由子函数实现；活动块下落 tick 不走此套判定。
	 */
	function isAdjacentVerticalMergeBlockedByWholeSlab(policy, cellGroup, rUpper, rLower, c) {
		if (!cellGroup) {
			return false;
		}
		const pol = normalizeLineClearPolicy(policy || {});
		if (pol.aboveRowsMode !== 'whole') {
			return false;
		}
		const a = cellGroup[rUpper][c];
		const b = cellGroup[rLower][c];
		if (a > 0 && a === b) {
			return true;
		}
		if (a > 0 && b === 0) {
			return true;
		}
		return false;
	}

	/**
	 * whole · 旧 rim：连续列段两格均非零且段两端列均「上≠下」时，禁止段内列号严格介于两端之间的同数竖并。
	 * （与 NonuniformBandInterior 互补：后者处理「仅中间列不齐、两端仍同质」的情形。）
	 */
	function isAdjacentVerticalMergeBlockedByWholeRim(board, rows, cols, rUpper, rLower, c, policy) {
		const pol = normalizeLineClearPolicy(policy || {});
		if (pol.aboveRowsMode !== 'whole') {
			return false;
		}
		if (rUpper < 0 || rLower !== rUpper + 1 || rLower >= rows) {
			return false;
		}
		if (!board[rUpper] || !board[rLower]) {
			return false;
		}
		let cc = 0;
		while (cc < cols) {
			while (cc < cols && (board[rUpper][cc] === 0 || board[rLower][cc] === 0)) {
				cc++;
			}
			if (cc >= cols) {
				break;
			}
			const segL = cc;
			while (cc < cols && board[rUpper][cc] !== 0 && board[rLower][cc] !== 0) {
				cc++;
			}
			const segR = cc - 1;
			if (segR - segL < 2) {
				continue;
			}
			if (c <= segL || c >= segR) {
				continue;
			}
			const u0 = board[rUpper][segL];
			const d0 = board[rLower][segL];
			const u1 = board[rUpper][segR];
			const d1 = board[rLower][segR];
			if (u0 !== 0 && d0 !== 0 && u0 !== d0 && u1 !== 0 && d1 !== 0 && u1 !== d1) {
				return true;
			}
		}
		return false;
	}

	/**
	 * whole：相邻两行 (rUpper,rLower) 与列 c。
	 * 定义「双排非零列区间」：包含 c 的连续列集合，这些列上两格均非零；且无法再向左或右各扩一列仍保持两格均非零（即常见的「极大」双非零连通块，此处用文字定义替代单独名词）。
	 * 若该区间内存在列 k 使 board[rUpper][k] !== board[rLower][k]，则禁止在该区间内**任何**列做「上下同数」竖并（与具体是 2、4 或其它 2^n 无关；端点列不例外）。
	 */
	function wholeAdjacentMergeBlockedWhenDoubleNonzeroRunHasMismatch(board, rows, cols, rUpper, rLower, c, policy) {
		const pol = normalizeLineClearPolicy(policy || {});
		if (pol.aboveRowsMode !== 'whole') {
			return false;
		}
		if (rUpper < 0 || rLower !== rUpper + 1 || rLower >= rows) {
			return false;
		}
		if (!board[rUpper] || !board[rLower]) {
			return false;
		}
		let cc = 0;
		while (cc < cols) {
			while (cc < cols && (board[rUpper][cc] === 0 || board[rLower][cc] === 0)) {
				cc++;
			}
			if (cc >= cols) {
				break;
			}
			const segL = cc;
			while (cc < cols && board[rUpper][cc] !== 0 && board[rLower][cc] !== 0) {
				cc++;
			}
			const segR = cc - 1;
			if (c < segL || c > segR) {
				continue;
			}
			let hasMismatch = false;
			for (let k = segL; k <= segR; k++) {
				if (board[rUpper][k] !== board[rLower][k]) {
					hasMismatch = true;
					break;
				}
			}
			if (!hasMismatch) {
				continue;
			}
			const u = board[rUpper][c];
			const d = board[rLower][c];
			if (u !== 0 && d !== 0 && u === d) {
				return true;
			}
		}
		return false;
	}

	/**
	 * whole · 全横杠同质：若某连续列段内各行对上=下且数值全相同（横杠齐），则禁止在段内列号非端点处竖并，避免「中间先并」。
	 * cols===6 且 0..4 为玩法主宽度时，对应 c∈{1,2,3} 封禁；列宽变化时见 fnz/lnz 分支。
	 */
	function isAdjacentVerticalMergeBlockedByWholeUniformBarEdgesOnly(board, rows, cols, rUpper, rLower, c, policy) {
		const pol = normalizeLineClearPolicy(policy || {});
		if (pol.aboveRowsMode !== 'whole') {
			return false;
		}
		if (rUpper < 0 || rLower !== rUpper + 1 || rLower >= rows) {
			return false;
		}
		if (!board[rUpper] || !board[rLower]) {
			return false;
		}
		if (cols === 6) {
			let v0 = null;
			for (let col = 0; col <= 4; col++) {
				const u = board[rUpper][col];
				const d = board[rLower][col];
				if (u === 0 || d === 0 || u !== d) {
					return false;
				}
				if (v0 == null) {
					v0 = u;
				} else if (u !== v0) {
					return false;
				}
			}
			if (c >= 1 && c <= 3) {
				return true;
			}
			return false;
		}
		let fnz = -1;
		let lnz = -1;
		for (let cc = 0; cc < cols; cc++) {
			const u = board[rUpper][cc];
			const d = board[rLower][cc];
			if (u !== 0 && d !== 0) {
				if (fnz < 0) {
					fnz = cc;
				}
				lnz = cc;
			}
		}
		if (fnz < 0 || lnz - fnz < 2) {
			return false;
		}
		let v0 = null;
		for (let cc = fnz; cc <= lnz; cc++) {
			const u = board[rUpper][cc];
			const d = board[rLower][cc];
			if (u === 0 || d === 0 || u !== d) {
				return false;
			}
			if (v0 == null) {
				v0 = u;
			} else if (u !== v0) {
				return false;
			}
		}
		if (c <= fnz || c >= lnz) {
			return false;
		}
		return true;
	}

	function isAdjacentVerticalMergeBlockedWhole(policy, cellGroup, board, rows, cols, rUpper, rLower, c) {
		if (isAdjacentVerticalMergeBlockedByWholeSlab(policy, cellGroup, rUpper, rLower, c)) {
			return true;
		}
		if (wholeAdjacentMergeBlockedWhenDoubleNonzeroRunHasMismatch(board, rows, cols, rUpper, rLower, c, policy)) {
			return true;
		}
		if (isAdjacentVerticalMergeBlockedByWholeUniformBarEdgesOnly(board, rows, cols, rUpper, rLower, c, policy)) {
			return true;
		}
		return isAdjacentVerticalMergeBlockedByWholeRim(board, rows, cols, rUpper, rLower, c, policy);
	}

	/**
	 * 整理阶段竖并封禁：不用 wholeSlab（浮动块在合成盘上同 aboveWholeGroupId 与固化堆语义不同，会误杀合法合并）。
	 * 与 isAdjacentVerticalMergeBlockedWhole 共用 rim / 横杠同质 / 双排异质 三条。
	 */
	function isAdjacentVerticalMergeBlockedWholeReformPhase(policy, cellGroup, board, rows, cols, rUpper, rLower, c) {
		if (wholeAdjacentMergeBlockedWhenDoubleNonzeroRunHasMismatch(board, rows, cols, rUpper, rLower, c, policy)) {
			return true;
		}
		if (isAdjacentVerticalMergeBlockedByWholeUniformBarEdgesOnly(board, rows, cols, rUpper, rLower, c, policy)) {
			return true;
		}
		return isAdjacentVerticalMergeBlockedByWholeRim(board, rows, cols, rUpper, rLower, c, policy);
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

	function writePieceToBoard(board, rows, cols, piece, cellGroup) {
		const gid = piece && piece.shape === '_ABOVE_WHOLE_' && piece.aboveWholeGroupId != null
			&& piece.aboveWholeGroupId > 0 ? piece.aboveWholeGroupId : 0;
		for (let i = 0; i < piece.cells.length; i++) {
			const cell = piece.cells[i];
			const r = piece.row + cell.dr;
			const c = piece.col + cell.dc;
			if (r >= 0 && r < rows && c >= 0 && c < cols) {
				board[r][c] = cell.value;
				if (cellGroup) {
					cellGroup[r][c] = gid;
				}
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

	function compactGravityColumnRangeWithGroup(board, cellGroup, startRow, endRow, c) {
		const colVals = [];
		const grpVals = [];
		for (let r = endRow; r >= startRow; r--) {
			if (board[r][c] !== 0) {
				colVals.push(board[r][c]);
				grpVals.push(cellGroup[r][c]);
			}
		}
		for (let k = 0; k <= endRow - startRow; k++) {
			const idx = endRow - k;
			if (k < colVals.length) {
				board[idx][c] = colVals[k];
				cellGroup[idx][c] = grpVals[k];
			} else {
				board[idx][c] = 0;
				cellGroup[idx][c] = 0;
			}
		}
	}

	/**
	 * 消行 7.1 收尾：本轮作为**满行**参与除法与剩格下落后，凡属于该满行且**已全空**的行，从棋盘上
	 * **整行抽掉**（行数变少），再在**顶部**补回等量空行，使场地高度不变；其余行**上下相对顺序不变**，
	 * 行内图案（含建造空隙）不变。这样上方悬空行与下方被消行之间的全空行会保留，不会把非空行压缩到场地最底。
	 * @param {Object<number, boolean>} clearedSet 本轮处理过的满行行号集合
	 */
	function packAfterClearedEmptyRows(board, rows, cols, clearedSet, cellGroup) {
		const kept = [];
		const keptG = [];
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
			if (cellGroup) {
				keptG.push(cellGroup[r].slice());
			}
		}
		const padTop = rows - kept.length;
		for (let r = 0; r < rows; r++) {
			if (r < padTop) {
				for (let c = 0; c < cols; c++) {
					board[r][c] = 0;
					if (cellGroup) {
						cellGroup[r][c] = 0;
					}
				}
			} else {
				const src = kept[r - padTop];
				for (let c = 0; c < cols; c++) {
					board[r][c] = src[c];
					if (cellGroup) {
						cellGroup[r][c] = keptG[r - padTop][c];
					}
				}
			}
		}
	}

	/**
	 * 跑完消行链：apply ↔ 整理 tick，直到无 clearLinesPending、无 reformPieces、且无新满行。
	 */
	function flushEntireLineClearChain(g, stats) {
		ensureBoardCellGroup(g);
		const opts = Object.assign({}, stats || {}, {suppressNextSpawn: true});
		let state = g;
		let outer = 0;
		while (++outer < 5000) {
			let inner = 0;
			while (state.clearLinesPending && state.clearLinesPending.length > 0 && ++inner < 5000) {
				state = applyPendingClearLines(state, opts);
			}
			state = syncFlushRemainingLineClearReform(state);
			let rg = 0;
			while (state.reformPieces && state.reformPieces.length > 0 && ++rg < 200000) {
				state = tickReformPhase(state, {suppressNextSpawn: true});
			}
			const fr = getFullRowIndices(state.board, state.rows, state.cols);
			if (fr.length === 0) {
				break;
			}
			state = Object.assign({}, state, {clearLinesPending: fr.slice()});
		}
		return state;
	}

	function boardOnlyGameState(board, rows, cols, policy, cellGroup) {
		const b = board.map(function(row) { return row.slice(); });
		const bg = cellGroup
			? cellGroup.map(function(row) { return row.slice(); })
			: emptyBoardCellGroup(rows, cols);
		return {
			rows: rows,
			cols: cols,
			board: b,
			boardCellGroup: bg,
			wholeAboveGroupSeq: 1,
			currentPiece: null,
			nextPiece: null,
			pieceCount: 1,
			score: 0,
			highScore: 0,
			gameOver: false,
			clearLinesPending: null,
			postClearGravityState: null,
			cascadePending: false,
			lineClearPolicy: normalizeLineClearPolicy(policy),
			lineClearRemainderCells: null,
			lineClearAbovePieces: null,
			lineClearClearedRows: null,
			lineClearScoreAddPending: null,
			reformPieces: null,
			fallIntervalMs: 500,
			lockDelayDurationMs: 500,
			playerLockTicksRemaining: null,
			suppressSpawnAfterReform: true,
			seed: 0,
			level: 0,
			linesClearedTotal: 0,
			overlayVisible: false,
			overlayMessage: '',
		};
	}

	function clearOneRound(board, rows, cols, policy, cellGroup) {
		const pol = policy != null ? policy : getDefaultLineClearPolicy();
		const fullRows = getFullRowIndices(board, rows, cols);
		if (fullRows.length === 0) {
			return {scoreAdd: 0, newFullRows: [], numLinesCleared: 0};
		}
		const g = boardOnlyGameState(board, rows, cols, pol, cellGroup);
		const score0 = g.score;
		g.clearLinesPending = fullRows.slice();
		const finalState = flushEntireLineClearChain(g, {lineClearBundledApply: true});
		for (let r = 0; r < rows; r++) {
			for (let c = 0; c < cols; c++) {
				board[r][c] = finalState.board[r][c];
			}
		}
		const newFullRows = getFullRowIndices(board, rows, cols);
		return {
			scoreAdd: finalState.score - score0,
			newFullRows: newFullRows,
			numLinesCleared: fullRows.length,
		};
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

	/** 升序满行行号拆成若干组，每组内行号两两相邻 */
	function clusterClearedRowGroups(sortedAsc) {
		const groups = [];
		if (!sortedAsc || sortedAsc.length === 0) {
			return groups;
		}
		let start = 0;
		for (let i = 1; i <= sortedAsc.length; i++) {
			if (i === sortedAsc.length || sortedAsc[i] !== sortedAsc[i - 1] + 1) {
				groups.push(sortedAsc.slice(start, i));
				start = i;
			}
		}
		return groups;
	}

	function pieceMaxFootprintRow(piece) {
		let mx = -1e9;
		for (let i = 0; i < piece.cells.length; i++) {
			const r = piece.row + piece.cells[i].dr;
			if (r > mx) {
				mx = r;
			}
		}
		return mx;
	}

	/**
	 * 从棋盘上抠出「各组被消行之上的上方行」里的非零格，改为活动块列表，并把这些格置 0。
	 * @param {'column'|'whole'} mode
	 * @param {{ next: number }} groupSeq whole 模式下为每块分配 aboveWholeGroupId，并递增 next
	 * @returns {Array<Object>} piece 列表（shape 为 _ABOVE_COL_ / _ABOVE_WHOLE_）
	 */
	function extractLineClearAbovePiecesAndClearBoard(board, cellGroup, rows, cols, clearedRowsArr, mode, groupSeq) {
		const sorted = clearedRowsArr.slice().sort(function(a, b) { return a - b; });
		const groups = clusterClearedRowGroups(sorted);
		const outPieces = [];
		let prevGroupMax = -1;
		for (let gi = 0; gi < groups.length; gi++) {
			const g = groups[gi];
			const rMin = g[0];
			const rowStart = prevGroupMax + 1;
			const rowEnd = rMin - 1;
			prevGroupMax = g[g.length - 1];
			if (rowStart > rowEnd || rowStart < 0) {
				continue;
			}
			if (mode === 'whole') {
				const cells = [];
				for (let r = rowStart; r <= rowEnd; r++) {
					for (let c = 0; c < cols; c++) {
						const v = board[r][c];
						if (v !== 0) {
							cells.push({r: r, c: c, v: v});
						}
					}
				}
				if (cells.length === 0) {
					continue;
				}
				let minR = cells[0].r;
				let minC = cells[0].c;
				for (let i = 1; i < cells.length; i++) {
					if (cells[i].r < minR) {
						minR = cells[i].r;
					}
					if (cells[i].c < minC) {
						minC = cells[i].c;
					}
				}
				const pcells = cells.map(function(x) {
					return {dr: x.r - minR, dc: x.c - minC, value: x.v};
				});
				const gid = groupSeq.next++;
				for (let i = 0; i < cells.length; i++) {
					const cr = cells[i].r;
					const cc = cells[i].c;
					board[cr][cc] = 0;
					if (cellGroup) {
						cellGroup[cr][cc] = 0;
					}
				}
				outPieces.push({
					shape: '_ABOVE_WHOLE_',
					rotation: 0,
					row: minR,
					col: minC,
					cells: pcells,
					mergeCount: 0,
					playerControllable: false,
					aboveWholeGroupId: gid,
				});
			} else {
				for (let c = 0; c < cols; c++) {
					let runStart = -1;
					for (let r = rowStart; r <= rowEnd + 1; r++) {
						const inRange = r <= rowEnd;
						const v = inRange && r >= 0 && r < rows ? board[r][c] : 0;
						const nz = v !== 0;
						if (nz && runStart < 0) {
							runStart = r;
						}
						if ((!nz || r > rowEnd) && runStart >= 0) {
							const runEnd = r > rowEnd ? rowEnd : r - 1;
							const pcells = [];
							for (let rr = runStart; rr <= runEnd; rr++) {
								pcells.push({dr: rr - runStart, dc: 0, value: board[rr][c]});
							}
							for (let rr = runStart; rr <= runEnd; rr++) {
								board[rr][c] = 0;
								if (cellGroup) {
									cellGroup[rr][c] = 0;
								}
							}
							outPieces.push({
								shape: '_ABOVE_COL_',
								rotation: 0,
								row: runStart,
								col: c,
								cells: pcells,
								mergeCount: 0,
								playerControllable: false,
							});
							runStart = -1;
						}
					}
				}
			}
		}
		return outPieces;
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

	/**
	 * 消行管线（面向对象）：对棋盘就地执行 §7.1「除法 → 擦剩格 → 抠上方块 → 进入整理列表」。
	 * 「待消行 apply」与「整理态内再满行」共用本类，避免两处复制粘贴。
	 * @param {number[][]} board
	 * @param {number[][]} boardCellGroup
	 * @param {{ next: number }} wholeAboveGroupSeq 可变异，与 extractLineClearAbovePiecesAndClearBoard 一致
	 */
	function LineClearPipeline(board, boardCellGroup, rows, cols, lineClearPolicy) {
		this.board = board;
		this.boardCellGroup = boardCellGroup;
		this.rows = rows;
		this.cols = cols;
		this.policy = normalizeLineClearPolicy(lineClearPolicy);
	}

	/**
	 * 对一批满行行号执行一次完整消行切片，返回整理列表与计分增量（不写入 GameState）。
	 */
	LineClearPipeline.prototype.buildReformListFromFullRows = function(fullRows, wholeAboveGroupSeq) {
		const prep = prepareLineClearDivisionPhase(this.board, this.rows, this.cols, fullRows);
		const sorted = prep.sortedList;
		const clearedRows = clearedRowsArrayFromClearedSet(prep.clearedSet);
		const pol = this.policy;
		for (let zi = 0; zi < sorted.length; zi++) {
			const x = sorted[zi];
			if (this.board[x.r] && x.c >= 0 && x.c < this.cols) {
				this.board[x.r][x.c] = 0;
				this.boardCellGroup[x.r][x.c] = 0;
			}
		}
		const abovePieces = extractLineClearAbovePiecesAndClearBoard(
			this.board, this.boardCellGroup, this.rows, this.cols, clearedRows, pol.aboveRowsMode, wholeAboveGroupSeq);
		const reformPieces = [];
		for (let ri = 0; ri < sorted.length; ri++) {
			const xx = sorted[ri];
			reformPieces.push({
				piece: createRemainderOnePiece({
					r: xx.r,
					c: xx.c,
					v: xx.v,
					merged: false,
					mergeCount: 0,
				}),
				lockTicks: null,
			});
		}
		for (let ai = 0; ai < abovePieces.length; ai++) {
			abovePieces[ai].playerControllable = false;
			reformPieces.push({piece: abovePieces[ai], lockTicks: null});
		}
		return {
			prep: prep,
			clearedRows: clearedRows,
			reformPieces: reformPieces,
			scoreAddFromDivision: prep.scoreAdd,
		};
	};

	/** 是否处于消行后的整理阶段（多块下落中） */
	function isLineClearReformPhase(g) {
		return !!(g && g.reformPieces && g.reformPieces.length > 0);
	}

	/** 兼容旧调试接口：等同 tickReformPhase */
	function tickLineClearSimultaneousRemainders(g, stats) {
		return tickReformPhase(g, stats || {});
	}

	function hasAnyCascade(board, rows, cols, cellGroup, lineClearPolicy) {
		for (let c = 0; c < cols; c++) {
			for (let r = 0; r < rows; r++) {
				if (board[r][c] === 0) {
					continue;
				}
				if (r + 1 < rows && board[r][c] === board[r + 1][c]) {
					if (!isAdjacentVerticalMergeBlockedWhole(lineClearPolicy, cellGroup, board, rows, cols, r, r + 1, c)) {
						return true;
					}
				}
				if (r - 1 >= 0 && board[r][c] === board[r - 1][c]) {
					if (!isAdjacentVerticalMergeBlockedWhole(lineClearPolicy, cellGroup, board, rows, cols, r - 1, r, c)) {
						return true;
					}
				}
			}
		}
		return false;
	}

	/**
	 * 玩法 7.2.2：竖向合并后上格为「合并空隙」，在本列仅对该空隙所在列前缀 [0, gapRow] 顺填（compactGravityColumnRange），
	 * 不把整列拉到棋盘最底（与整列 gravity 区分）。不引入「整行数了几格非零」「某数字阈值」等启发式。
	 * @param {number} gapRow 合并后变为 0 的那一格所在行
	 */
	function mergeGapGravityColumn(board, rows, gapRow, c, cellGroup) {
		if (gapRow < 0 || gapRow >= rows) {
			return;
		}
		if (cellGroup) {
			compactGravityColumnRangeWithGroup(board, cellGroup, 0, gapRow, c);
		} else {
			compactGravityColumnRange(board, 0, gapRow, c);
		}
	}

	function doOneCascadeStep(board, rows, cols, mergeStart, cellGroup, lineClearPolicy) {
		const pol = lineClearPolicy != null ? lineClearPolicy : getDefaultLineClearPolicy();
		const mode = mergeStart === 'bottom' ? 'bottom' : (mergeStart === 'contact' ? 'contact' : 'top');
		if (mode === 'contact') {
			/* whole：自下而上尝试相邻行对 (r,r+1)，先于「每列最上接触」顺序，使较深行对（如 6–7）先与边缘耦合/rim 判定，避免仅因先合并 5–6 而中间列抢在两侧定型前竖并。 */
			if (pol.aboveRowsMode === 'whole') {
				for (let r = rows - 2; r >= 0; r--) {
					for (let c = 0; c < cols; c++) {
						const u = board[r][c];
						const d = board[r + 1][c];
						if (u === 0 || d === 0 || u !== d) {
							continue;
						}
						if (isAdjacentVerticalMergeBlockedWhole(pol, cellGroup, board, rows, cols, r, r + 1, c)) {
							continue;
						}
						board[r + 1][c] *= 2;
						board[r][c] = 0;
						if (cellGroup) {
							cellGroup[r + 1][c] = 0;
							cellGroup[r][c] = 0;
						}
						mergeGapGravityColumn(board, rows, r, c, cellGroup);
						return {didOne: true, more: hasAnyCascade(board, rows, cols, cellGroup, pol)};
					}
				}
				return {didOne: false, more: false};
			}
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
					if (isAdjacentVerticalMergeBlockedWhole(pol, cellGroup, board, rows, cols, topR, topR + 1, c)) {
						continue;
					}
					board[topR + 1][c] *= 2;
					board[topR][c] = 0;
					if (cellGroup) {
						cellGroup[topR + 1][c] = 0;
						cellGroup[topR][c] = 0;
					}
					mergeGapGravityColumn(board, rows, topR, c, cellGroup);
					return {didOne: true, more: hasAnyCascade(board, rows, cols, cellGroup, pol)};
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
						if (isAdjacentVerticalMergeBlockedWhole(pol, cellGroup, board, rows, cols, r, r + 1, c)) {
							continue;
						}
						board[r + 1][c] *= 2;
						board[r][c] = 0;
						if (cellGroup) {
							cellGroup[r + 1][c] = 0;
							cellGroup[r][c] = 0;
						}
						mergeGapGravityColumn(board, rows, r, c, cellGroup);
						return {didOne: true, more: hasAnyCascade(board, rows, cols, cellGroup, pol)};
					}
					if (r - 1 >= 0 && board[r][c] === board[r - 1][c]) {
						if (isAdjacentVerticalMergeBlockedWhole(pol, cellGroup, board, rows, cols, r - 1, r, c)) {
							continue;
						}
						board[r][c] *= 2;
						board[r - 1][c] = 0;
						if (cellGroup) {
							cellGroup[r][c] = 0;
							cellGroup[r - 1][c] = 0;
						}
						mergeGapGravityColumn(board, rows, r - 1, c, cellGroup);
						return {didOne: true, more: hasAnyCascade(board, rows, cols, cellGroup, pol)};
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
					if (isAdjacentVerticalMergeBlockedWhole(pol, cellGroup, board, rows, cols, r, r + 1, c)) {
						continue;
					}
					board[r + 1][c] *= 2;
					board[r][c] = 0;
					if (cellGroup) {
						cellGroup[r + 1][c] = 0;
						cellGroup[r][c] = 0;
					}
					mergeGapGravityColumn(board, rows, r, c, cellGroup);
					return {didOne: true, more: hasAnyCascade(board, rows, cols, cellGroup, pol)};
				}
				if (r - 1 >= 0 && board[r][c] === board[r - 1][c]) {
					if (isAdjacentVerticalMergeBlockedWhole(pol, cellGroup, board, rows, cols, r - 1, r, c)) {
						continue;
					}
					board[r][c] *= 2;
					board[r - 1][c] = 0;
					if (cellGroup) {
						cellGroup[r][c] = 0;
						cellGroup[r - 1][c] = 0;
					}
					mergeGapGravityColumn(board, rows, r - 1, c, cellGroup);
					return {didOne: true, more: hasAnyCascade(board, rows, cols, cellGroup, pol)};
				}
			}
		}
		return {didOne: false, more: false};
	}

	function spawnNextAfterLock(g) {
		if (g.suppressSpawnAfterReform === true) {
			return Object.assign({}, g, {
				currentPiece: null,
				cascadePending: false,
			});
		}
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

	/**
	 * 兼容：旧存档若仍有 lineClearRemainderCells，先迁入 reformPieces 再快进整理。
	 */
	function syncFlushRemainingLineClearReform(g) {
		let state = Object.assign({}, g);
		if ((!state.reformPieces || state.reformPieces.length === 0)
				&& ((state.lineClearRemainderCells && state.lineClearRemainderCells.length > 0)
					|| (state.lineClearAbovePieces && state.lineClearAbovePieces.length > 0))) {
			const cells = state.lineClearRemainderCells || [];
			const aboves = state.lineClearAbovePieces || [];
			const rp = [];
			for (let j = 0; j < cells.length; j++) {
				const e = cells[j];
				rp.push({
					piece: createRemainderOnePiece({
						r: e.r,
						c: e.c,
						v: e.v,
						merged: e.merged,
						mergeCount: e.mergeCount,
					}),
					lockTicks: null,
				});
			}
			for (let k = 0; k < aboves.length; k++) {
				const ap = Object.assign({}, aboves[k]);
				ap.playerControllable = false;
				rp.push({piece: ap, lockTicks: null});
			}
			state = Object.assign({}, state, {
				reformPieces: rp,
				lineClearRemainderCells: null,
				lineClearAbovePieces: null,
			});
		}
		let guard = 0;
		while (state.reformPieces && state.reformPieces.length > 0 && ++guard < 200000) {
			state = tickReformPhase(state, {suppressNextSpawn: true});
		}
		return state;
	}

	function resolveLockAfterTick(g, board, lockedPiece, suppressSpawn) {
		const nextCount = g.pieceCount + 1;
		const fullRows = getFullRowIndices(board, g.rows, g.cols);
		const lockClear = {playerLockTicksRemaining: null};
		if (fullRows.length > 0) {
			return Object.assign({}, g, lockClear, {
				board: board,
				currentPiece: null,
				pieceCount: nextCount,
				clearLinesPending: fullRows,
			});
		}
		if (suppressSpawn) {
			return Object.assign({}, g, lockClear, {
				board: board,
				currentPiece: null,
				pieceCount: nextCount,
				clearLinesPending: null,
				postClearGravityState: null,
				cascadePending: false,
				lineClearRemainderCells: null,
				lineClearAbovePieces: null,
				lineClearClearedRows: null,
				lineClearScoreAddPending: null,
			});
		}
		return spawnNextAfterLock(Object.assign({}, g, lockClear, {board: board, pieceCount: nextCount}));
	}

	/** 玩家块：若能下落一格则返回新状态，否则返回 null（《玩法》§4.1 前线格规则）。 */
	function tryPlayerGravityOneStep(g) {
		const board = g.board;
		const rows = g.rows;
		const cols = g.cols;
		const cg = g.boardCellGroup;
		let piece = g.currentPiece;
		if (!piece || g.gameOver) {
			return null;
		}
		if (pieceOutOfBounds(rows, cols, piece, 1, 0)) {
			return null;
		}
		const wouldHit = pieceOverlapsBoard(board, rows, cols, piece, 1, 0);
		if (!wouldHit) {
			piece.cells.forEach(function(cell) {
				if (cell.merged) {
					return;
				}
				const r = piece.row + cell.dr;
				const c = piece.col + cell.dc;
				if (r >= 0 && r < rows && c >= 0 && c < cols && board[r]) {
					board[r][c] = 0;
					if (cg) {
						cg[r][c] = 0;
					}
				}
			});
			return Object.assign({}, g, {
				board: board,
				currentPiece: Object.assign({}, piece, {row: piece.row + 1}),
				playerLockTicksRemaining: null,
			});
		}
		const pieceRow = piece.row;
		const direction = DIR_DOWN;
		const frontLineCells = getFrontLineCells(piece, direction);
		for (let fi = 0; fi < frontLineCells.length; fi++) {
			if (pieceRow + frontLineCells[fi].dr + direction.dr >= rows) {
				return null;
			}
		}
		for (let ci = 0; ci < frontLineCells.length; ci++) {
			const cell = frontLineCells[ci];
			const tr = pieceRow + cell.dr + direction.dr;
			const tc = piece.col + cell.dc + direction.dc;
			if (tc < 0 || tc >= cols || tr >= rows || tr < 0 || !board[tr]) {
				continue;
			}
			const tv = board[tr][tc];
			if (tv !== 0 && tv !== cell.value) {
				return null;
			}
		}
		const newRow = pieceRow + direction.dr;
		const newCol = piece.col + direction.dc;
		const frontKey = {};
		frontLineCells.forEach(function(c) { frontKey[c.dr + ',' + c.dc] = true; });
		let mergedCount = 0;
		const updatedCells = piece.cells.map(function(cell) {
			if (!frontKey[cell.dr + ',' + cell.dc]) {
				return Object.assign({}, cell);
			}
			const tr2 = pieceRow + cell.dr + direction.dr;
			const tc2 = piece.col + cell.dc + direction.dc;
			if (tc2 < 0 || tc2 >= cols || tr2 >= rows || tr2 < 0 || !board[tr2]) {
				return Object.assign({}, cell);
			}
			const tv2 = board[tr2][tc2];
			if (tv2 === cell.value) {
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
			const trM = pieceRow + c0.dr + direction.dr;
			const tcM = piece.col + c0.dc + direction.dc;
			if (trM >= 0 && trM < rows && tcM >= 0 && tcM < cols && board[trM]) {
				board[trM][tcM] = 0;
				if (cg) {
					cg[trM][tcM] = 0;
				}
			}
		}
		piece.cells.forEach(function(cell) {
			const r = pieceRow + cell.dr;
			const c = piece.col + cell.dc;
			if (r >= 0 && r < rows && c >= 0 && c < cols && board[r]) {
				board[r][c] = 0;
				if (cg) {
					cg[r][c] = 0;
				}
			}
		});
		piece = Object.assign({}, piece, {
			row: newRow,
			col: newCol,
			cells: updatedCells,
			mergeCount: piece.mergeCount + mergedCount,
		});
		return Object.assign({}, g, {board: board, currentPiece: piece, playerLockTicksRemaining: null});
	}

	function solidifyPlayerPieceNow(g, lockedPiece, suppressSpawn) {
		writePieceToBoard(g.board, g.rows, g.cols, lockedPiece, g.boardCellGroup);
		const ss = !!suppressSpawn || g.suppressSpawnAfterReform === true;
		return resolveLockAfterTick(Object.assign({}, g, {playerLockTicksRemaining: null}), g.board, lockedPiece, ss);
	}

	/**
	 * 玩家活动块一帧：锁定延迟、软降/硬降、重力一步与固化（《玩法》§4 + 锁定）。
	 */
	function ActivePieceController(game) {
		this.game = game;
	}
	ActivePieceController.prototype.tryGravityOneStep = function() {
		return tryPlayerGravityOneStep(this.game);
	};
	ActivePieceController.prototype.solidify = function(lockedPiece, suppressSpawn) {
		return solidifyPlayerPieceNow(this.game, lockedPiece, suppressSpawn);
	};
	/**
	 * 当前活动块的一拍（无活动块时勿调；由 tick 保证）。
	 */
	ActivePieceController.prototype.tickPlayerPhase = function(tickOpts) {
		tickOpts = tickOpts || {};
		const suppressSpawn = !!tickOpts.suppressNextSpawn;
		const hardDrop = tickOpts.hardDrop === true;
		const userSoftDrop = tickOpts.userSoftDrop === true;
		const g = this.game;
		const piece = g.currentPiece;
		const lockFull = computePlayerLockTicks(g.lockDelayDurationMs, g.fallIntervalMs);
		if (pieceOutOfBounds(g.rows, g.cols, piece, 1, 0)) {
			const maxDr = Math.max.apply(null, piece.cells.map(function(c) { return c.dr; }));
			const lockRow = Math.min(piece.row, g.rows - 1 - maxDr);
			const lockPieceAt = Object.assign({}, piece, {row: lockRow});
			return solidifyPlayerPieceNow(g, lockPieceAt, suppressSpawn);
		}
		if (!hardDrop && g.playerLockTicksRemaining != null) {
			if (userSoftDrop) {
				const moved = tryPlayerGravityOneStep(g);
				if (moved) {
					return moved;
				}
				const nk = g.playerLockTicksRemaining - 1;
				if (nk <= 0) {
					const lockedAt = Object.assign({}, piece, {row: piece.row});
					return solidifyPlayerPieceNow(g, lockedAt, suppressSpawn);
				}
				return Object.assign({}, g, {playerLockTicksRemaining: nk});
			}
			const nkAuto = g.playerLockTicksRemaining - 1;
			if (nkAuto <= 0) {
				const lockedAt2 = Object.assign({}, piece, {row: piece.row});
				return solidifyPlayerPieceNow(g, lockedAt2, suppressSpawn);
			}
			return Object.assign({}, g, {playerLockTicksRemaining: nkAuto});
		}
		const moved2 = tryPlayerGravityOneStep(g);
		if (moved2) {
			return moved2;
		}
		if (hardDrop) {
			const lockedHd = Object.assign({}, piece, {row: piece.row});
			return solidifyPlayerPieceNow(g, lockedHd, suppressSpawn);
		}
		if (userSoftDrop) {
			const baseTicks = g.playerLockTicksRemaining != null ? g.playerLockTicksRemaining : lockFull;
			const nkSd = baseTicks - 1;
			if (nkSd <= 0) {
				const lockedSd = Object.assign({}, piece, {row: piece.row});
				return solidifyPlayerPieceNow(g, lockedSd, suppressSpawn);
			}
			return Object.assign({}, g, {playerLockTicksRemaining: nkSd});
		}
		return Object.assign({}, g, {playerLockTicksRemaining: lockFull});
	};

	/**
	 * @param { { clearedVerticalMerges?: number, cascadeSteps?: number, clearRemainderMergeSteps?: number, steppedLineClearRemainder?: boolean, lineClearBundledApply?: boolean } | null | undefined } stats 可选，用于测试统计 / 分步消行剩格（仅页面）
	 */
	function applyPendingClearLines(g, stats) {
		ensureBoardCellGroup(g);
		stats = stats || {};
		if (g.clearLinesPending == null || g.clearLinesPending.length === 0) {
			return g;
		}
		const hadReform = g.reformPieces != null && g.reformPieces.length > 0;
		const groupSeq = {next: g.wholeAboveGroupSeq != null ? g.wholeAboveGroupSeq : 1};
		const applyPipeline = new LineClearPipeline(g.board, g.boardCellGroup, g.rows, g.cols, g.lineClearPolicy);
		const built = applyPipeline.buildReformListFromFullRows(g.clearLinesPending, groupSeq);
		const prep = built.prep;
		const clearedRows = built.clearedRows;
		const reformPieces = built.reformPieces;
		const prevRows = g.lineClearClearedRows || [];
		const mergedRows = prevRows.concat(clearedRows).filter(function(v, i, a) {
			return a.indexOf(v) === i;
		});
		const scoreAddTotal = (g.lineClearScoreAddPending || 0) + prep.scoreAdd;

		function attachChainIfAny(out) {
			const chainFr = getFullRowIndices(g.board, g.rows, g.cols);
			if (chainFr.length > 0) {
				return Object.assign({}, out, {clearLinesPending: chainFr.slice()});
			}
			return out;
		}

		if (reformPieces.length === 0) {
			if (hadReform) {
				const out = Object.assign({}, g, {
					board: g.board,
					clearLinesPending: null,
					postClearGravityState: null,
					cascadePending: false,
					currentPiece: null,
					reformPieces: g.reformPieces,
					lineClearRemainderCells: null,
					lineClearAbovePieces: null,
					lineClearClearedRows: mergedRows,
					lineClearScoreAddPending: scoreAddTotal,
					wholeAboveGroupSeq: groupSeq.next,
				});
				return attachChainIfAny(out);
			}
			packAfterClearedEmptyRows(g.board, g.rows, g.cols, prep.clearedSet, g.boardCellGroup);
			const score = g.score + scoreAddTotal;
			const highScore = g.highScore >= score ? g.highScore : score;
			const suppressSpawn = stats.suppressNextSpawn === true || g.suppressSpawnAfterReform === true;
			const newFullRows = getFullRowIndices(g.board, g.rows, g.cols);
			if (newFullRows.length > 0) {
				return Object.assign({}, g, {
					board: g.board,
					score: score,
					highScore: highScore,
					clearLinesPending: newFullRows,
					postClearGravityState: null,
					cascadePending: false,
					reformPieces: null,
					lineClearClearedRows: mergedRows,
					lineClearScoreAddPending: 0,
					lineClearRemainderCells: null,
					lineClearAbovePieces: null,
					currentPiece: null,
					wholeAboveGroupSeq: groupSeq.next,
				});
			}
			const nextCount = g.pieceCount + 1;
			const base = Object.assign({}, g, {
				board: g.board,
				score: score,
				highScore: highScore,
				clearLinesPending: null,
				postClearGravityState: null,
				cascadePending: false,
				reformPieces: null,
				lineClearClearedRows: null,
				lineClearScoreAddPending: null,
				lineClearRemainderCells: null,
				lineClearAbovePieces: null,
				currentPiece: null,
				pieceCount: nextCount,
				playerLockTicksRemaining: null,
				wholeAboveGroupSeq: groupSeq.next,
			});
			if (suppressSpawn) {
				return base;
			}
			return spawnNextAfterLock(base);
		}
		let finalReform = reformPieces;
		if (hadReform) {
			finalReform = g.reformPieces.map(function(e) {
				return {piece: e.piece, lockTicks: e.lockTicks};
			});
			for (let wi = 0; wi < reformPieces.length; wi++) {
				finalReform.push(reformPieces[wi]);
			}
		}
		const outReform = Object.assign({}, g, {
			board: g.board,
			clearLinesPending: null,
			postClearGravityState: null,
			cascadePending: false,
			currentPiece: null,
			reformPieces: finalReform,
			lineClearRemainderCells: null,
			lineClearAbovePieces: null,
			lineClearClearedRows: hadReform ? mergedRows : clearedRows,
			lineClearScoreAddPending: hadReform ? scoreAddTotal : prep.scoreAdd,
			wholeAboveGroupSeq: groupSeq.next,
		});
		return attachChainIfAny(outReform);
	}

	/**
	 * 测试/工具：从「无活动块、棋盘已含固化格」出发，跑完与主局相同的消行链（含链式新满行），不生成新生块。
	 * 内部等同 `flushEntireLineClearChain`。要求 currentPiece === null；若 board 无满行则原样返回。
	 * @param { { clearedVerticalMerges?: number, cascadeSteps?: number, clearRemainderMergeSteps?: number } | null | undefined } stats 可选：遗留字段，已不再累计竖合/cascade
	 */
	function advancePostLockLineClearNoSpawn(game, stats) {
		if (game.currentPiece != null) {
			throw new Error('advancePostLockLineClearNoSpawn: currentPiece must be null (locked board only)');
		}
		const rows = game.rows;
		const cols = game.cols;
		let state = Object.assign({}, game);
		state.board = game.board.map(function(row) { return row.slice(); });
		if (game.boardCellGroup) {
			state.boardCellGroup = game.boardCellGroup.map(function(row) { return row.slice(); });
		} else {
			state.boardCellGroup = emptyBoardCellGroup(rows, cols);
		}
		state.postClearGravityState = null;
		state.cascadePending = false;
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
		const flushStats = Object.assign({}, stats || {}, {lineClearBundledApply: true, suppressNextSpawn: true});
		state = flushEntireLineClearChain(state, flushStats);
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

	/** 与正式局 scheduleNext 一致：下一拍本应 spawnNextAfterLock 时即为 true（活动块空且无消行/整理收尾）。 */
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
		if (isLineClearReformPhase(g)) {
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
			return applyPendingClearLines(g, {
				lineClearBundledApply: true,
				suppressNextSpawn: suppressNextSpawn,
			});
		}
		return tick(g, suppressNextSpawn ? {suppressNextSpawn: true} : undefined);
	}

	function moveLeft(game) {
		if (game.gameOver || !game.currentPiece) {
			return game;
		}
		if (isLineClearReformPhase(game)) {
			return game;
		}
		const p = game.currentPiece;
		const next = Object.assign({}, p, {col: p.col - 1});
		if (wouldCollide(game.board, game.rows, game.cols, next, 0, 0)) {
			return game;
		}
		const outL = Object.assign({}, game, {currentPiece: next});
		if (playerCurrentPieceCanMoveDown(outL.board, outL.rows, outL.cols, next)) {
			outL.playerLockTicksRemaining = null;
		}
		return outL;
	}

	function moveRight(game) {
		if (game.gameOver || !game.currentPiece) {
			return game;
		}
		if (isLineClearReformPhase(game)) {
			return game;
		}
		const p = game.currentPiece;
		const next = Object.assign({}, p, {col: p.col + 1});
		if (wouldCollide(game.board, game.rows, game.cols, next, 0, 0)) {
			return game;
		}
		const outR = Object.assign({}, game, {currentPiece: next});
		if (playerCurrentPieceCanMoveDown(outR.board, outR.rows, outR.cols, next)) {
			outR.playerLockTicksRemaining = null;
		}
		return outR;
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
		if (isLineClearReformPhase(game)) {
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
			const outRt = Object.assign({}, game, {currentPiece: nextPiece});
			if (playerCurrentPieceCanMoveDown(outRt.board, outRt.rows, outRt.cols, nextPiece)) {
				outRt.playerLockTicksRemaining = null;
			}
			return outRt;
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

	/**
	 * 全局一拍：待消行占位 → 整理阶段 → 玩家活动块阶段。
	 */
	function tick(game, tickOpts) {
		tickOpts = tickOpts || {};
		if (game.gameOver) {
			return game;
		}
		if (game.clearLinesPending != null && game.clearLinesPending.length > 0) {
			return game;
		}
		const g = Object.assign({}, game);
		ensureBoardCellGroup(g);
		if (g.reformPieces && g.reformPieces.length > 0) {
			return tickReformPhase(g, tickOpts);
		}
		if (!g.currentPiece) {
			return g;
		}
		return new ActivePieceController(g).tickPlayerPhase(tickOpts);
	}

	function init(highScore, overrides) {
		highScore = highScore || 0;
		overrides = overrides || {};
		const rows = Math.max(MIN_ROWS, Math.min(MAX_ROWS, overrides.rows != null ? overrides.rows : DEFAULT_CFG.rows));
		const cols = Math.max(MIN_COLS, Math.min(MAX_COLS, overrides.cols != null ? overrides.cols : DEFAULT_CFG.cols));
		const fallIntervalMs = overrides.fallIntervalMs != null ? overrides.fallIntervalMs : DEFAULT_CFG.fallIntervalMs;
		let lockDelayDurationMs = overrides.lockDelayDurationMs != null ? overrides.lockDelayDurationMs : DEFAULT_CFG.lockDelayDurationMs;
		lockDelayDurationMs = Math.max(MIN_LOCK_DELAY_MS, Math.min(MAX_LOCK_DELAY_MS, lockDelayDurationMs));
		const seed = overrides.seed != null ? overrides.seed : Date.now();
		const board = emptyBoard(rows, cols);
		const boardCellGroup = emptyBoardCellGroup(rows, cols);
		const currentPiece = spawnNextPiece(rows, cols, seed, 0);
		const nextPiece = spawnNextPiece(rows, cols, seed, 1);
		return {
			rows: rows,
			cols: cols,
			board: board,
			boardCellGroup: boardCellGroup,
			wholeAboveGroupSeq: 1,
			currentPiece: currentPiece,
			nextPiece: nextPiece,
			score: 0,
			highScore: highScore,
			gameOver: false,
			overlayVisible: false,
			overlayMessage: '',
			fallIntervalMs: fallIntervalMs,
			lockDelayDurationMs: lockDelayDurationMs,
			playerLockTicksRemaining: null,
			reformPieces: null,
			cascadePending: false,
			pieceCount: 1,
			seed: seed,
			clearLinesPending: null,
			postClearGravityState: null,
			level: 0,
			linesClearedTotal: 0,
			lineClearPolicy: normalizeLineClearPolicy(overrides.lineClearPolicy),
			lineClearRemainderCells: null,
			lineClearAbovePieces: null,
			lineClearClearedRows: null,
			lineClearScoreAddPending: null,
			suppressSpawnAfterReform: overrides.suppressSpawnAfterReform === true,
		};
	}

	function serializeGameState(g) {
		function serPiece(p) {
			if (!p) {
				return null;
			}
			const o = {
				shape: p.shape,
				rotation: p.rotation,
				row: p.row,
				col: p.col,
				cells: p.cells.map(function(c) {
					return {dr: c.dr, dc: c.dc, value: c.value, merged: !!c.merged};
				}),
				mergeCount: p.mergeCount,
			};
			if (p.shape === '_ABOVE_WHOLE_' && p.aboveWholeGroupId != null) {
				o.aboveWholeGroupId = p.aboveWholeGroupId;
			}
			return o;
		}

		return {
			rows: g.rows,
			cols: g.cols,
			board: g.board.map(function(row) { return row.slice(); }),
			boardCellGroup: g.boardCellGroup
				? g.boardCellGroup.map(function(row) { return row.slice(); })
				: emptyBoardCellGroup(g.rows, g.cols),
			wholeAboveGroupSeq: g.wholeAboveGroupSeq != null ? g.wholeAboveGroupSeq : 1,
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
			lineClearAbovePieces: g.lineClearAbovePieces
				? g.lineClearAbovePieces.map(function(p) { return serPiece(p); })
				: null,
			lineClearClearedRows: g.lineClearClearedRows ? g.lineClearClearedRows.slice() : null,
			lineClearScoreAddPending: g.lineClearScoreAddPending != null ? g.lineClearScoreAddPending : null,
			lockDelayDurationMs: (function() {
				const ld = Number(g.lockDelayDurationMs);
				if (Number.isFinite(ld)) {
					return Math.max(MIN_LOCK_DELAY_MS, Math.min(MAX_LOCK_DELAY_MS, ld));
				}
				return DEFAULT_CFG.lockDelayDurationMs;
			})(),
			playerLockTicksRemaining: g.playerLockTicksRemaining != null && Number.isFinite(Number(g.playerLockTicksRemaining))
				? Math.max(0, Math.floor(Number(g.playerLockTicksRemaining)))
				: null,
			reformPieces: (function() {
				if (!g.reformPieces || g.reformPieces.length === 0) {
					return null;
				}
				const out = [];
				for (let i = 0; i < g.reformPieces.length; i++) {
					const e = g.reformPieces[i];
					if (!e || !e.piece) {
						continue;
					}
					out.push({
						piece: serPiece(e.piece),
						lockTicks: e.lockTicks != null && Number.isFinite(Number(e.lockTicks))
							? Math.floor(Number(e.lockTicks))
							: null,
					});
				}
				return out.length > 0 ? out : null;
			})(),
			suppressSpawnAfterReform: g.suppressSpawnAfterReform === true,
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

		let boardCellGroup = emptyBoardCellGroup(rows, cols);
		const bgRaw = o.boardCellGroup;
		if (Array.isArray(bgRaw) && bgRaw.length === rows) {
			let okG = true;
			const gRows = [];
			for (let r = 0; r < rows; r++) {
				const rowRawG = bgRaw[r];
				if (!Array.isArray(rowRawG) || rowRawG.length !== cols) {
					okG = false;
					break;
				}
				gRows.push(rowRawG.map(function(v) {
					const n = Number(v);
					return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
				}));
			}
			if (okG) {
				boardCellGroup = gRows;
			}
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
			if (shape === '_ABOVE_COL_' || shape === '_ABOVE_WHOLE_') {
				const rowA = Number(p.row);
				const colA = Number(p.col);
				if (!Number.isFinite(rowA) || !Number.isFinite(colA)) {
					return null;
				}
				const cellsRawA = p.cells;
				if (!Array.isArray(cellsRawA) || cellsRawA.length === 0) {
					return null;
				}
				const cellsA = cellsRawA.map(function(c) {
					return {
						dr: Number(c.dr) || 0,
						dc: Number(c.dc) || 0,
						value: Number(c.value) >= 2 ? Number(c.value) : 2,
						merged: !!c.merged,
					};
				});
				const ab = {
					shape: shape,
					rotation: 0,
					row: rowA,
					col: colA,
					cells: cellsA,
					mergeCount: Math.max(0, Number(p.mergeCount) || 0),
					playerControllable: false,
				};
				if (shape === '_ABOVE_WHOLE_' && p.aboveWholeGroupId != null && Number.isFinite(Number(p.aboveWholeGroupId))) {
					ab.aboveWholeGroupId = Number(p.aboveWholeGroupId);
				}
				return ab;
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
		/** 旧存档中的 postClearGravityState 已废弃，不再恢复（与《玩法》§7 多块整理一致）。 */
		const postClearGravityState = null;
		return {
			rows: rows,
			cols: cols,
			board: board,
			boardCellGroup: boardCellGroup,
			wholeAboveGroupSeq: Math.max(1, Number(o.wholeAboveGroupSeq) || 1),
			currentPiece: currentPiece,
			nextPiece: nextPiece,
			score: Math.max(0, Number(o.score) || 0),
			highScore: Math.max(0, Number(o.highScore) || 0),
			gameOver: Boolean(o.gameOver),
			overlayVisible: Boolean(o.overlayVisible),
			overlayMessage: String(o.overlayMessage != null ? o.overlayMessage : ''),
			fallIntervalMs: fallIntervalMs,
			cascadePending: false,
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
			lineClearAbovePieces: Array.isArray(o.lineClearAbovePieces)
				? o.lineClearAbovePieces.map(function(p) { return dePiece(p); }).filter(function(x) { return x != null; })
				: null,
			lineClearClearedRows: Array.isArray(o.lineClearClearedRows)
				? o.lineClearClearedRows.map(function(x) { return Number(x); }).filter(function(x) { return Number.isFinite(x); })
				: null,
			lineClearScoreAddPending: o.lineClearScoreAddPending != null && Number.isFinite(Number(o.lineClearScoreAddPending))
				? Number(o.lineClearScoreAddPending)
				: null,
			lockDelayDurationMs: (function() {
				const ld = Number(o.lockDelayDurationMs);
				if (Number.isFinite(ld)) {
					return Math.max(MIN_LOCK_DELAY_MS, Math.min(MAX_LOCK_DELAY_MS, ld));
				}
				return DEFAULT_CFG.lockDelayDurationMs;
			})(),
			playerLockTicksRemaining: (function() {
				if (o.playerLockTicksRemaining == null) {
					return null;
				}
				const n = Number(o.playerLockTicksRemaining);
				return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : null;
			})(),
			reformPieces: (function() {
				const rawRp = o.reformPieces;
				if (!Array.isArray(rawRp) || rawRp.length === 0) {
					return null;
				}
				const rp = [];
				for (let i = 0; i < rawRp.length; i++) {
					const e = rawRp[i];
					if (!e || typeof e !== 'object') {
						continue;
					}
					const pie = dePiece(e.piece);
					if (!pie) {
						continue;
					}
					const lt = e.lockTicks != null && Number.isFinite(Number(e.lockTicks))
						? Math.floor(Number(e.lockTicks))
						: null;
					rp.push({piece: pie, lockTicks: lt});
				}
				return rp.length > 0 ? rp : null;
			})(),
			suppressSpawnAfterReform: o.suppressSpawnAfterReform === true,
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
		LineClearPipeline: LineClearPipeline,
		ReformPhaseController: ReformPhaseController,
		ActivePieceController: ActivePieceController,
		getFrontLineCells: getFrontLineCells,
		ReformPieceCell: ReformPieceCell,
		ReformActivePiece: ReformActivePiece,
		DIR_DOWN: DIR_DOWN,
		DIR_LEFT: DIR_LEFT,
		DIR_RIGHT: DIR_RIGHT,
		getBoardWithCurrentPiece: getBoardWithCurrentPiece,
		createCustomPieceFromAbsCells: createCustomPieceFromAbsCells,
		isAtPreSpawnGate: isAtPreSpawnGate,
		debugSimulationStep: debugSimulationStep,
	};
});

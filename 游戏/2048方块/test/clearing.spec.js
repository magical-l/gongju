/**
 * 整理与多块路径：§7.2～7.3 链式 flush；锁定后分步消行、整块上方、lineClearPolicy。
 * 后续可在此文件继续增加多块争格、连续 reform、链式记分等用例。
 */
'use strict';

module.exports = function(r) {
	const { describe, it } = r;
	const {
		_tick,
		_makeState,
		_assertBoardEqual,
		applyPendingClearLines,
		runUntilFirstLock,
		isAtPreSpawnGate,
		initGame,
		createCustomPieceFromAbsCells,
		runClearAndCascade,
	} = require('./spec-common.js')(r);

	describe('整理与多块路径（flush·整块上方·策略）', function() {

		describe('§7.2～7.3 整理链（flush）', function() {
			it('消一行后链式整理终盘（与主局 flush 一致）', function() {
				const rows = 6, cols = 2;
				const board = [[0, 0], [0, 0], [0, 0], [2, 0], [2, 0], [2, 2]];
				const state = _makeState(rows, cols, board, null);
				const final_ = runClearAndCascade(state);
				const expected = [[0, 0], [0, 0], [0, 0], [0, 0], [2, 0], [2, 0]];
				_assertBoardEqual(final_.board, expected, '消一行后链式整理');
			});

			it('消两行后链式整理终盘（与主局 flush 一致）', function() {
				const rows = 6, cols = 3;
				const board = [[0, 0, 0], [0, 0, 0], [2, 2, 0], [2, 2, 0], [2, 2, 2], [2, 2, 2]];
				const state = _makeState(rows, cols, board, null);
				const final_ = runClearAndCascade(state);
				const expected = [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [2, 2, 0], [2, 2, 0]];
				_assertBoardEqual(final_.board, expected, '消两行后链式整理');
			});
		});

		describe('§7 整块上方行与 lineClearPolicy（分步消行，与手动调试页一致）', function() {
			it('8×6 U 形上框：落子后消行，终盘底行两侧为 4、中间为 2（不整行并成四个 4）', function() {
				const fixed = [
					[0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0],
					[2, 2, 2, 2, 2, 0], [2, 0, 0, 0, 2, 0], [2, 2, 2, 2, 2, 0],
					[0, 0, 0, 0, 0, 32], [0, 0, 0, 0, 0, 0], [2, 2, 2, 2, 2, 0],
				];
				const piece = createCustomPieceFromAbsCells([{ r: 4, c: 5, value: 2 }]);
				let g = initGame(0, { rows: 8, cols: 6 });
				g.board = fixed.map(row => row.slice());
				g.currentPiece = piece;
				g = runUntilFirstLock(g);
				g.suppressSpawnAfterReform = true;
				let n = 0;
				while (!isAtPreSpawnGate(g) && n++ < 8000) {
					if (g.clearLinesPending && g.clearLinesPending.length) {
						g = applyPendingClearLines(g, { suppressNextSpawn: true });
					} else {
						g = _tick(g, { suppressNextSpawn: true });
					}
				}
				const expected = [
					[0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0],
					[0, 0, 0, 0, 0, 32], [2, 2, 2, 2, 2, 0], [4, 2, 2, 2, 4, 0],
				];
				_assertBoardEqual(g.board, expected, 'U 形上框分步消行终盘');
			});

			it('8×6 三行顶 + 中行 4：横段有异数则该段不做同数竖并', function() {
				const fixed = [
					[2, 2, 2, 2, 2, 0],
					[2, 2, 2, 2, 2, 0],
					[2, 2, 2, 2, 2, 0],
					[0, 0, 0, 0, 0, 32],
					[0, 0, 0, 0, 0, 0],
					[2, 2, 4, 2, 2, 0],
					[2, 2, 2, 2, 2, 0],
					[0, 0, 0, 0, 0, 0],
				];
				const piece = createCustomPieceFromAbsCells([{ r: 2, c: 5, value: 2 }]);
				let g = initGame(0, { rows: 8, cols: 6 });
				g.board = fixed.map(row => row.slice());
				g.currentPiece = piece;
				g = runUntilFirstLock(g);
				g.suppressSpawnAfterReform = true;
				let n = 0;
				while (!isAtPreSpawnGate(g) && n++ < 8000) {
					if (g.clearLinesPending && g.clearLinesPending.length) {
						g = applyPendingClearLines(g, { suppressNextSpawn: true });
					} else {
						g = _tick(g, { suppressNextSpawn: true });
					}
				}
				const b = g.board[6];
				_assertBoardEqual(b, [2, 2, 2, 2, 2, 0], 'row6 在 5/6 行横段有异数时整段禁同数竖并，故保持全 2');
			});

			it('8×6 双行底 2：两侧 4 与底行 2 异数时，中间列不单独竖并', function() {
				const fixed = [
					[0, 0, 0, 0, 0, 0],
					[2, 2, 2, 2, 2, 0],
					[2, 0, 0, 0, 2, 0],
					[2, 2, 2, 2, 2, 0],
					[0, 0, 0, 0, 0, 32],
					[0, 0, 0, 0, 0, 0],
					[2, 2, 2, 2, 2, 0],
					[2, 2, 2, 2, 2, 0],
				];
				const piece = createCustomPieceFromAbsCells([{ r: 3, c: 5, value: 2 }]);
				let g = initGame(0, { rows: 8, cols: 6 });
				g.board = fixed.map(row => row.slice());
				g.currentPiece = piece;
				g = runUntilFirstLock(g);
				g.suppressSpawnAfterReform = true;
				let n = 0;
				while (!isAtPreSpawnGate(g) && n++ < 8000) {
					if (g.clearLinesPending && g.clearLinesPending.length) {
						g = applyPendingClearLines(g, { suppressNextSpawn: true });
					} else {
						g = _tick(g, { suppressNextSpawn: true });
					}
				}
				const expected = [
					[0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0],
					[0, 0, 0, 0, 0, 32], [2, 2, 2, 2, 2, 0], [4, 2, 2, 2, 4, 0], [2, 2, 2, 2, 2, 0],
				];
				_assertBoardEqual(g.board, expected, '双行底 2 边缘耦合终盘');
			});
		});
	});
};

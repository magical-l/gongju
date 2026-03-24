/**
 * 基础与常规路径：§4.1 合并与硬降、§7.1 固定盘上的消行/除法/重力、§11 计分。
 * 不涵盖多块同时整理、整块上方分步消行（见 clearing.spec.js）。
 */
'use strict';

module.exports = function(r) {
	const { describe, it } = r;
	const {
		_tick,
		_createPiece,
		_makeState,
		_assertBoardEqual,
		_visBoard,
		clearOneRound,
		runClearUntilStable,
		runTicksUntilNoCurrentPiece,
		logic,
	} = require('./spec-common.js')(r);

	describe('基础与常规路径（§4.1、§7.1 一般消行、§11 计分）', function() {

		describe('§4.1 合并（前线格 · 同数/异数 · 七形状）', function() {
			it('I 竖条下落一格与正下方 2 合并为 4', function() {
				const rows = 6, cols = 2;
				const before = [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [2, 0]];
				const piece = _createPiece('I', 0, 1, 0);
				const state = _makeState(rows, cols, before, piece);
				const next = _tick(state);
				const expected = [[0, 0], [0, 0], [2, 0], [2, 0], [2, 0], [4, 0]];
				_assertBoardEqual(_visBoard(next), expected, 'I 下落一格与 2 合并');
			});

			it('O 下落一格与正下方 2 合并为 4', function() {
				const rows = 4, cols = 2;
				const before = [[0, 0], [0, 0], [2, 0], [2, 0]];
				const piece = _createPiece('O', 0, 0, 0);
				const state = _makeState(rows, cols, before, piece);
				const next = _tick(state);
				const expected = [[0, 0], [2, 2], [4, 2], [2, 0]];
				_assertBoardEqual(_visBoard(next), expected, 'O 下落一格与 2 合并');
			});

			it('T 下落一格与正下方 2 合并为 4', function() {
				const rows = 4, cols = 2;
				const before = [[0, 0], [0, 0], [0, 0], [0, 2]];
				const piece = _createPiece('T', 0, 0, 0);
				const state = _makeState(rows, cols, before, piece);
				const next = _tick(state);
				const expected = [[0, 0], [0, 2], [2, 2], [0, 4]];
				_assertBoardEqual(_visBoard(next), expected, 'T 下落一格与 2 合并');
			});

			it('Z 下落一格与正下方 2 合并为 4', function() {
				const rows = 4, cols = 2;
				const before = [[0, 0], [0, 0], [0, 0], [2, 0]];
				const piece = _createPiece('Z', 0, 0, 0);
				const state = _makeState(rows, cols, before, piece);
				const next = _tick(state);
				const expected = [[0, 0], [0, 2], [2, 2], [4, 0]];
				_assertBoardEqual(_visBoard(next), expected, 'Z 下落一格与 2 合并');
			});

			it('S 下落一格与正下方 2 合并为 4', function() {
				const rows = 4, cols = 2;
				const before = [[0, 0], [0, 0], [0, 0], [0, 2]];
				const piece = _createPiece('S', 0, 0, 0);
				const state = _makeState(rows, cols, before, piece);
				const next = _tick(state);
				const expected = [[0, 0], [2, 0], [2, 2], [0, 4]];
				_assertBoardEqual(_visBoard(next), expected, 'S 下落一格与 2 合并');
			});

			it('J 下落一格与正下方 2 合并为 4', function() {
				const rows = 4, cols = 2;
				const before = [[0, 0], [0, 0], [0, 0], [2, 0]];
				const piece = _createPiece('J', 0, 0, 0);
				const state = _makeState(rows, cols, before, piece);
				const next = _tick(state);
				const expected = [[0, 0], [0, 2], [0, 2], [4, 2]];
				_assertBoardEqual(_visBoard(next), expected, 'J 下落一格与 2 合并');
			});

			it('L 下落一格与正下方 2 合并为 4', function() {
				const rows = 4, cols = 2;
				const before = [[0, 0], [0, 0], [0, 0], [2, 0]];
				const piece = _createPiece('L', 0, 0, 0);
				const state = _makeState(rows, cols, before, piece);
				const next = _tick(state);
				const expected = [[0, 0], [2, 0], [2, 0], [4, 2]];
				_assertBoardEqual(_visBoard(next), expected, 'L 下落一格与 2 合并');
			});

			it('T 旋转 180° 触底锁定、与正下方同数行合并为 4', function() {
				const rows = 5;
				const cols = 3;
				const before = [
					[0, 0, 0],
					[0, 0, 0],
					[0, 0, 0],
					[2, 2, 2],
					[0, 4, 0],
				];
				const piece = _createPiece('T', 2, 2, 0);
				const state = _makeState(rows, cols, before, piece);
				const next = _tick(state);
				const expected = [
					[0, 0, 0],
					[0, 0, 0],
					[2, 0, 0],
					[2, 2, 2],
					[2, 4, 0],
				];
				_assertBoardEqual(next.board, expected, 'T180 触底写入固定堆');
			});

			it('I 竖条连续两 tick：先合并再触底锁定', function() {
				const rows = 6, cols = 2;
				const before = [[0, 0], [0, 0], [0, 0], [0, 0], [2, 0], [2, 0]];
				const piece = _createPiece('I', 0, 0, 0);
				let state = _makeState(rows, cols, before, piece);
				state = runTicksUntilNoCurrentPiece(state);
				const expected = [[0, 0], [2, 0], [2, 0], [2, 0], [4, 0], [2, 0]];
				_assertBoardEqual(state.board, expected, 'I 两 tick 合并后锁定');
			});

			it('I 块遇异数不合并、锁定', function() {
				const rows = 5, cols = 2;
				const before = [[0, 0], [0, 0], [0, 0], [0, 0], [4, 0]];
				const piece = _createPiece('I', 0, 0, 0);
				const state = _makeState(rows, cols, before, piece);
				const next = _tick(state, { hardDrop: true });
				const expected = [[2, 0], [2, 0], [2, 0], [2, 0], [4, 0]];
				_assertBoardEqual(next.board, expected, 'I 遇异数锁定并写出整块');
			});

			it('O 块遇异数不合并、锁定', function() {
				const rows = 4, cols = 2;
				const before = [[0, 0], [0, 0], [4, 0], [4, 0]];
				const piece = _createPiece('O', 0, 0, 0);
				const state = _makeState(rows, cols, before, piece);
				const next = _tick(state, { hardDrop: true });
				const expected = [[2, 2], [2, 2], [4, 0], [4, 0]];
				_assertBoardEqual(next.board, expected, 'O 遇异数锁定并写出整块');
			});

			it('T 块遇异数不合并、锁定', function() {
				const rows = 4, cols = 2;
				const before = [[0, 0], [0, 0], [0, 0], [0, 4]];
				const piece = _createPiece('T', 0, 0, 0);
				const next = _tick(_makeState(rows, cols, before, piece), { hardDrop: true });
				_assertBoardEqual(next.board, [[0, 2], [2, 2], [0, 2], [0, 4]], 'T 遇异数锁定');
			});

			it('Z 块遇异数不合并、锁定', function() {
				const rows = 4, cols = 2;
				const before = [[0, 0], [0, 0], [0, 0], [4, 0]];
				const piece = _createPiece('Z', 0, 0, 0);
				const next = _tick(_makeState(rows, cols, before, piece), { hardDrop: true });
				_assertBoardEqual(next.board, [[0, 2], [2, 2], [2, 0], [4, 0]], 'Z 遇异数锁定');
			});

			it('S 块遇异数不合并、锁定', function() {
				const rows = 4, cols = 2;
				const before = [[0, 0], [0, 0], [0, 0], [0, 4]];
				const piece = _createPiece('S', 0, 0, 0);
				const next = _tick(_makeState(rows, cols, before, piece), { hardDrop: true });
				_assertBoardEqual(next.board, [[2, 0], [2, 2], [0, 2], [0, 4]], 'S 遇异数锁定');
			});

			it('J 块遇异数不合并、锁定', function() {
				const rows = 4, cols = 2;
				const before = [[0, 0], [0, 0], [0, 0], [4, 0]];
				const piece = _createPiece('J', 0, 0, 0);
				const next = _tick(_makeState(rows, cols, before, piece), { hardDrop: true });
				_assertBoardEqual(next.board, [[0, 2], [0, 2], [2, 2], [4, 0]], 'J 遇异数锁定');
			});

			it('L 块遇异数不合并、锁定', function() {
				const rows = 4, cols = 2;
				const before = [[0, 0], [0, 0], [0, 0], [4, 0]];
				const piece = _createPiece('L', 0, 0, 0);
				const next = _tick(_makeState(rows, cols, before, piece), { hardDrop: true });
				_assertBoardEqual(next.board, [[2, 0], [2, 0], [2, 2], [4, 0]], 'L 遇异数锁定');
			});

			it('O 连续两 tick 先合并再触底锁定', function() {
				let state = _makeState(5, 2, [[0, 0], [0, 0], [0, 0], [2, 0], [2, 0]], _createPiece('O', 0, 0, 0));
				state = _tick(state);
				state = _tick(state);
				_assertBoardEqual(_visBoard(state), [[0, 0], [0, 0], [2, 2], [4, 2], [2, 0]], 'O 两 tick');
			});

			it('T 连续两 tick 先合并再触底锁定', function() {
				let state = _makeState(5, 2, [[0, 0], [0, 0], [0, 0], [0, 2], [0, 0]], _createPiece('T', 0, 0, 0));
				state = _tick(state);
				state = _tick(state);
				_assertBoardEqual(_visBoard(state), [[0, 0], [0, 0], [0, 2], [2, 2], [0, 4]], 'T 两 tick');
			});

			it('Z 连续两 tick 先合并再触底锁定', function() {
				let state = _makeState(5, 2, [[0, 0], [0, 0], [0, 0], [2, 0], [0, 0]], _createPiece('Z', 0, 0, 0));
				state = _tick(state);
				state = _tick(state);
				_assertBoardEqual(_visBoard(state), [[0, 0], [0, 0], [0, 2], [2, 2], [4, 0]], 'Z 两 tick');
			});

			it('S 连续两 tick 先合并再触底锁定', function() {
				let state = _makeState(5, 2, [[0, 0], [0, 0], [0, 0], [0, 2], [0, 0]], _createPiece('S', 0, 0, 0));
				state = _tick(state);
				state = _tick(state);
				_assertBoardEqual(_visBoard(state), [[0, 0], [0, 0], [2, 0], [2, 2], [0, 4]], 'S 两 tick');
			});

			it('J 连续两 tick 先合并再触底锁定', function() {
				let state = _makeState(5, 2, [[0, 0], [0, 0], [0, 0], [2, 0], [0, 0]], _createPiece('J', 0, 0, 0));
				state = _tick(state);
				state = _tick(state);
				_assertBoardEqual(_visBoard(state), [[0, 0], [0, 0], [0, 2], [0, 2], [4, 2]], 'J 两 tick');
			});

			it('L 连续两 tick 先合并再触底锁定', function() {
				let state = _makeState(5, 2, [[0, 0], [0, 0], [0, 0], [2, 0], [0, 0]], _createPiece('L', 0, 0, 0));
				state = _tick(state);
				state = _tick(state);
				_assertBoardEqual(_visBoard(state), [[0, 0], [0, 0], [2, 0], [2, 0], [4, 2]], 'L 两 tick');
			});
		});

		describe('§7.1 消行（除法 min、消行空隙、重力；固定盘、无玩家活动块）', function() {
			it('1.1 仅最后一行满(全2)、上方全空', function() {
				const rows = 6, cols = 4;
				const before = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [2, 2, 2, 2]];
				const expected = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
				const board = before.map(row => row.slice());
				runClearUntilStable(board, rows, cols);
				_assertBoardEqual(board, expected, '1.1');
			});

			it('1.2 仅最后一行满、倒数第二行有零有2(不满)', function() {
				const rows = 6, cols = 4;
				const before = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 2, 0, 0], [2, 2, 2, 2]];
				const expected = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 2, 0, 0]];
				const board = before.map(row => row.slice());
				runClearUntilStable(board, rows, cols);
				_assertBoardEqual(board, expected, '1.2');
			});

			it('1.3 仅最后一行满(2与4混合)有剩余、上方无同列同数', function() {
				const rows = 6, cols = 4;
				const before = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [2, 4, 2, 2]];
				const expected = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 2, 0, 0]];
				const board = before.map(row => row.slice());
				runClearUntilStable(board, rows, cols);
				_assertBoardEqual(board, expected, '1.3');
			});

			it('2.1 仅一行满有剩余、重力与合并阶段后', function() {
				const rows = 6, cols = 4;
				const before = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 2, 0, 0], [2, 4, 2, 2], [0, 2, 4, 4]];
				const board = before.map(row => row.slice());
				runClearUntilStable(board, rows, cols);
				const expected = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 2, 0, 0], [0, 4, 4, 4]];
				_assertBoardEqual(board, expected, '2.1');
			});

			it('2.2 仅最后一行满有剩余、合并阶段与上一行同数合并', function() {
				const rows = 6, cols = 4;
				const before = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 2, 0, 0], [2, 4, 2, 2]];
				const expected = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 4, 0, 0]];
				const board = before.map(row => row.slice());
				runClearUntilStable(board, rows, cols);
				_assertBoardEqual(board, expected, '2.2');
			});

			it('3.1 仅底两行满(全2)无剩余', function() {
				const rows = 6, cols = 4;
				const before = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [2, 2, 2, 2], [2, 2, 2, 2]];
				const expected = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
				const board = before.map(row => row.slice());
				runClearUntilStable(board, rows, cols);
				_assertBoardEqual(board, expected, '3.1');
			});

			it('3.2 仅底两行满、有剩余、上方下落无合并', function() {
				const rows = 6, cols = 4;
				const before = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 4, 2, 2], [2, 2, 2, 2], [2, 2, 2, 2]];
				const expected = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 4, 2, 2]];
				const board = before.map(row => row.slice());
				runClearUntilStable(board, rows, cols);
				_assertBoardEqual(board, expected, '3.2');
			});

			it('3.3 仅底两行满、有剩余、合并阶段一列合并', function() {
				const rows = 6, cols = 4;
				const before = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 2, 0, 0], [2, 4, 2, 2], [2, 2, 2, 2]];
				const expected = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 4, 0, 0]];
				const board = before.map(row => row.slice());
				runClearUntilStable(board, rows, cols);
				_assertBoardEqual(board, expected, '3.3');
			});

			it('4.1 消四行(全2)无剩余、上方空', function() {
				const rows = 6, cols = 4;
				const before = [[0, 0, 0, 0], [0, 0, 0, 0], [2, 2, 2, 2], [2, 2, 2, 2], [2, 2, 2, 2], [2, 2, 2, 2]];
				const expected = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
				const board = before.map(row => row.slice());
				runClearUntilStable(board, rows, cols);
				_assertBoardEqual(board, expected, '4.1');
			});

			it('4.2 消三行有剩余、保形下落后合并（行内空隙保留）', function() {
				const rows = 6, cols = 4;
				const before = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 2, 0, 0], [2, 4, 2, 2], [2, 2, 4, 2], [2, 2, 2, 4]];
				const expected = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 4, 2, 2]];
				const board = before.map(row => row.slice());
				runClearUntilStable(board, rows, cols);
				_assertBoardEqual(board, expected, '4.2');
			});
		});

		describe('§11 计分', function() {
			const getLineClearBaseScore = logic.getLineClearBaseScore;
			it('消一行全 2：基础 40 + 数字奖励 8', function() {
				const rows = 6, cols = 4;
				const before = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [2, 2, 2, 2]];
				const board = before.map(row => row.slice());
				const result = clearOneRound(board, rows, cols);
				if (result.scoreAdd !== 48) {
					throw new Error('scoreAdd expected 48, got ' + result.scoreAdd);
				}
			});
			it('消一行 2 与 4 混合：基础 40 + 原数字之和 6', function() {
				const rows = 6, cols = 4;
				const before = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [2, 4, 2, 2]];
				const board = before.map(row => row.slice());
				const result = clearOneRound(board, rows, cols);
				if (result.scoreAdd !== 46) {
					throw new Error('scoreAdd expected 46, got ' + result.scoreAdd);
				}
			});
			it('getLineClearBaseScore：n 行 × (level+1)', function() {
				if (getLineClearBaseScore(1, 0) !== 40) {
					throw new Error('1 line L0');
				}
				if (getLineClearBaseScore(4, 0) !== 1200) {
					throw new Error('4 lines L0');
				}
				if (getLineClearBaseScore(1, 1) !== 80) {
					throw new Error('1 line L1');
				}
			});
		});
	});
};

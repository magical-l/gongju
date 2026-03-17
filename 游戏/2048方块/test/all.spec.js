/**
 * 2048方块 全部用例（合并 / 消行 / 消行后合并），单文件版。
 * 由 run.js 加载，接收 testEnv（describe, it, logic, makeState, assertBoardEqual 等）。
 */
'use strict';

module.exports = function(r) {
	const { describe, it, logic } = r;
	const _tick = logic.tick;
	const _createPiece = logic.createPiece;
	const _makeState = r.makeState;
	const _assertBoardEqual = r.assertBoardEqual;
	const clearOneRound = logic.clearOneRound;
	const applyPendingClearLines = logic.applyPendingClearLines;

	function runClearUntilStable(board, rows, cols, maxRounds) {
		maxRounds = maxRounds || 20;
		for (let round = 0; round < maxRounds; round++) {
			const result = clearOneRound(board, rows, cols);
			if (result.newFullRows.length === 0) break;
		}
	}

	function runClearAndCascade(state, maxSteps) {
		maxSteps = maxSteps || 100;
		let s = state;
		for (let i = 0; i < maxSteps; i++) {
			if (s.clearLinesPending && s.clearLinesPending.length > 0) {
				s = applyPendingClearLines(s);
				continue;
			}
			if (s.cascadePending) {
				s = _tick(s);
				continue;
			}
			if (s.postClearGravityState != null) {
				s = applyPendingClearLines(s);
				continue;
			}
			break;
		}
		return s;
	}

	// ---------- 合并 ----------
	describe('合并', function() {
		it('I 竖条下落一格与正下方 2 合并为 4', function() {
			const rows = 6, cols = 2;
			const before = [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [2, 0]];
			const piece = _createPiece('I', 0, 1, 0);
			const state = _makeState(rows, cols, before, piece);
			const next = _tick(state);
			const expected = [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [4, 0]];
			_assertBoardEqual(next.board, expected, 'I 下落一格与 2 合并');
		});

		it('I 竖条连续两 tick：先合并再触底锁定', function() {
			const rows = 6, cols = 2;
			const before = [[0, 0], [0, 0], [0, 0], [0, 0], [2, 0], [2, 0]];
			const piece = _createPiece('I', 0, 0, 0);
			let state = _makeState(rows, cols, before, piece);
			state = _tick(state);
			state = _tick(state);
			const expected = [[0, 0], [2, 0], [2, 0], [2, 0], [4, 0], [2, 0]];
			_assertBoardEqual(state.board, expected, 'I 两 tick 合并后锁定');
		});

		it('块遇异数不合并、锁定', function() {
			const rows = 5, cols = 2;
			const before = [[0, 0], [0, 0], [0, 0], [0, 0], [4, 0]];
			const piece = _createPiece('I', 0, 0, 0);
			const state = _makeState(rows, cols, before, piece);
			const next = _tick(state);
			const expected = [[2, 0], [2, 0], [2, 0], [2, 0], [4, 0]];
			_assertBoardEqual(next.board, expected, '遇异数锁定并写出整块');
		});
	});

	// ---------- 消行 ----------
	describe('消行', function() {
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

		it('4.2 消三行有剩余、列压实后合并', function() {
			const rows = 6, cols = 4;
			const before = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 2, 0, 0], [2, 4, 2, 2], [2, 2, 4, 2], [2, 2, 2, 4]];
			const expected = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 4, 2, 2]];
			const board = before.map(row => row.slice());
			runClearUntilStable(board, rows, cols);
			_assertBoardEqual(board, expected, '4.2');
		});
	});

	// ---------- 消行后合并 ----------
	describe('消行后合并', function() {
		it('消一行后列内相邻 2+2 合并为 4', function() {
			const rows = 6, cols = 2;
			const board = [[0, 0], [0, 0], [0, 0], [2, 0], [2, 0], [2, 2]];
			const state = _makeState(rows, cols, board, null);
			state.clearLinesPending = [5];
			const final_ = runClearAndCascade(state);
			const expected = [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [4, 0]];
			_assertBoardEqual(final_.board, expected, '消一行后列内 2+2 合并');
		});

		it('消两行后多列有合并', function() {
			const rows = 6, cols = 3;
			const board = [[0, 0, 0], [0, 0, 0], [2, 2, 0], [2, 2, 0], [2, 2, 2], [2, 2, 2]];
			const state = _makeState(rows, cols, board, null);
			state.clearLinesPending = [4, 5];
			const final_ = runClearAndCascade(state);
			const expected = [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [4, 4, 0]];
			_assertBoardEqual(final_.board, expected, '消两行后多列合并');
		});
	});
};

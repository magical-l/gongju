/**
 * 供 core.spec.js / clearing.spec.js 共享：logic 绑定与小型辅助函数。
 */
'use strict';

module.exports = function createSpecCommon(r) {
	const { logic, makeState, assertBoardEqual } = r;
	const _tick = logic.tick;
	const _createPiece = logic.createPiece;
	const _makeState = makeState;
	const _assertBoardEqual = assertBoardEqual;
	const _visBoard = function(state) {
		return state.currentPiece != null && !state.gameOver
			? logic.getBoardWithCurrentPiece(state)
			: state.board;
	};
	const clearOneRound = logic.clearOneRound;
	const applyPendingClearLines = logic.applyPendingClearLines;
	const advancePostLockLineClearNoSpawn = logic.advancePostLockLineClearNoSpawn;
	const runUntilFirstLock = logic.runUntilFirstLock;
	const isAtPreSpawnGate = logic.isAtPreSpawnGate;
	const initGame = logic.init;
	const createCustomPieceFromAbsCells = logic.createCustomPieceFromAbsCells;

	function runClearUntilStable(board, rows, cols, maxRounds) {
		maxRounds = maxRounds || 20;
		for (let round = 0; round < maxRounds; round++) {
			const result = clearOneRound(board, rows, cols);
			if (result.newFullRows.length === 0) {
				break;
			}
		}
	}

	function runClearAndCascade(state) {
		return advancePostLockLineClearNoSpawn(state);
	}

	function runTicksUntilNoCurrentPiece(state, max) {
		let s = state;
		let n = 0;
		max = max || 200;
		while (s.currentPiece && !s.gameOver && n < max) {
			s = _tick(s, { suppressNextSpawn: true });
			n++;
		}
		return s;
	}

	return {
		_tick: _tick,
		_createPiece: _createPiece,
		_makeState: _makeState,
		_assertBoardEqual: _assertBoardEqual,
		_visBoard: _visBoard,
		clearOneRound: clearOneRound,
		applyPendingClearLines: applyPendingClearLines,
		advancePostLockLineClearNoSpawn: advancePostLockLineClearNoSpawn,
		runUntilFirstLock: runUntilFirstLock,
		isAtPreSpawnGate: isAtPreSpawnGate,
		initGame: initGame,
		createCustomPieceFromAbsCells: createCustomPieceFromAbsCells,
		runClearUntilStable: runClearUntilStable,
		runClearAndCascade: runClearAndCascade,
		runTicksUntilNoCurrentPiece: runTicksUntilNoCurrentPiece,
		logic: logic,
	};
};

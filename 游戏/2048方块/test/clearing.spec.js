/**
 * 整理回归：`clearing-data.js` 按《玩法》§7.1 划分（仅剩格 / 仅上方块 / 二者皆有 / 分步宽6）。
 */
'use strict';

const { CLEARING_CASES } = require('./clearing-data.js');

module.exports = function(r) {
	const { describe, it } = r;
	const {
		_makeState,
		_assertBoardEqual,
		applyPendingClearLines,
		runUntilFirstLock,
		isAtPreSpawnGate,
		initGame,
		createCustomPieceFromAbsCells,
		runClearAndCascade,
		_tick,
	} = require('./spec-common.js')(r);

	function runLockCase(sc) {
		const piece = createCustomPieceFromAbsCells(sc.pieceCells);
		let g = initGame(0, { rows: sc.fixed.length, cols: sc.fixed[0].length });
		g.board = sc.fixed.map(function(row) { return row.slice(); });
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
		return g.board;
	}

	const groups = { s0: [], s1: [], s2: [], s3: [], s4: [] };
	for (let i = 0; i < CLEARING_CASES.length; i++) {
		const c = CLEARING_CASES[i];
		const k = c.section;
		if (groups[k]) {
			groups[k].push(c);
		}
	}

	function runFlushCase(sc) {
		const rows = sc.board.length;
		const cols = sc.board[0].length;
		const state = _makeState(rows, cols, sc.board, null);
		const final_ = runClearAndCascade(state);
		_assertBoardEqual(final_.board, sc.expected, sc.id);
	}

	describe('整理（§7.1 剩格 / 上方块 / §7.2 整理）', function() {
		describe('§0 无满行', function() {
			groups.s0.forEach(function(sc) {
				it((sc.caseNo ? sc.caseNo + ' ' : '') + sc.id + ' · ' + sc.playbook + '：' + sc.title, function() {
					runFlushCase(sc);
				});
			});
		});

		describe('§1 仅消行剩余（无上方块）', function() {
			groups.s1.forEach(function(sc) {
				it((sc.caseNo ? sc.caseNo + ' ' : '') + sc.id + ' · ' + sc.playbook + '：' + sc.title, function() {
					runFlushCase(sc);
				});
			});
		});

		describe('§2 仅上方块（无消行剩格）', function() {
			groups.s2.forEach(function(sc) {
				it((sc.caseNo ? sc.caseNo + ' ' : '') + sc.id + ' · ' + sc.playbook + '：' + sc.title, function() {
					runFlushCase(sc);
				});
			});
		});

		describe('§3 既有剩格也有上方块', function() {
			groups.s3.forEach(function(sc) {
				it((sc.caseNo ? sc.caseNo + ' ' : '') + sc.id + ' · ' + sc.playbook + '：' + sc.title, function() {
					runFlushCase(sc);
				});
			});
		});

		describe('§4 宽6·落子锁定后分步消行', function() {
			groups.s4.forEach(function(sc) {
				it((sc.caseNo ? sc.caseNo + ' ' : '') + sc.id + ' · ' + sc.playbook + '：' + sc.title, function() {
					const actual = runLockCase(sc);
					if (sc.assertFull) {
						_assertBoardEqual(actual, sc.expected, sc.id);
					} else {
						_assertBoardEqual(actual[sc.assertRowIndex], sc.expectedRow, sc.id + ' row' + sc.assertRowIndex);
					}
				});
			});
		});
	});
};

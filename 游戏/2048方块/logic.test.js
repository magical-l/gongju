/**
 * 2048方块 logic 单元测试：下落、固化、合并。
 * 运行：node logic.test.js（需在 游戏/2048方块 目录）
 *
 * 规则与实现对应：
 * - 仅「最前线」格（沿前进方向最前的格）参与判定；每个这样的格在前进方向上的目标格，要么为空要么为同数（即：每格二选一，不是「全部为空」或「全部为同数」）。
 * - 「目标格」「下方」按前进方向定义，不限定 y 轴（如左移时目标为左侧格）。
 * - 任一方格在该方向不可行进则整块不可行进（锁定）；不做部分合并。
 * - 「填空隙」：曾有一种实现会把未参与合并的块格单独写入棋盘上的空位；现改为整块同进同退，未合并格随块移动，不单独写入棋盘。
 * - 测试大工程暂缓，先保证规则逻辑清晰；当前仅保留 T180 等少量用例。
 */
'use strict';

const path = require('path');
const logicPath = path.join(__dirname, 'logic.js');
const logic = require(logicPath);

const tick = logic.tick;
const createPiece = logic.createPiece;
const init = logic.init;
const pieceAbsCells = logic.pieceAbsCells;

function boardFromRows(rows) {
	return rows.map(function(row) { return row.slice(); });
}

function rowsFromBoard(board) {
	return board.map(function(row) { return row.slice(); });
}

function makeState(rows, cols, boardRows, piece) {
	const board = boardFromRows(boardRows);
	// init() 会按 MIN_ROWS 把 rows 钳成至少 8，所以先建 state 再覆盖 board 后必须让 rows 与 board 行数一致
	const state = init(0, { rows: rows, cols: cols });
	state.board = board;
	state.rows = board.length;
	state.cols = board[0].length;
	state.currentPiece = piece;
	state.pieceCount = piece ? 1 : 0;
	state.nextPiece = null;
	return state;
}

function assertBoardEqual(actual, expected, msg) {
	const ar = rowsFromBoard(actual);
	const er = expected.map(function(r) { return r.slice(); });
	if (JSON.stringify(ar) !== JSON.stringify(er)) {
		console.error(msg || 'board mismatch');
		console.error('expected:', JSON.stringify(er, null, 2));
		console.error('actual:  ', JSON.stringify(ar, null, 2));
		throw new Error(msg || 'board mismatch');
	}
}

function runOneTickAndAssertBoard(initialBoardRows, piece, expectedBoardRowsAfterTick, description) {
	const rows = initialBoardRows.length;
	const cols = initialBoardRows[0].length;
	const state = makeState(rows, cols, initialBoardRows, piece);
	const next = tick(state);
	assertBoardEqual(next.board, expectedBoardRowsAfterTick, description);
	return next;
}

console.log('--- 用例：T 180° 在 row2，与 row3 接触（你之前说的 T 90° 实为 180°）---');
console.log('玩法：y=0 为底，y=4 为顶；代码中 board[0]=顶 board[4]=底。');

// 顶部三行空，T 180° 在 row2（下落2行后）；T 180° 形态：竖条在 c0、一格在 (3,1)
const emptyTop = [0, 0, 0];
const r1 = [2, 2, 2];
const r0 = [0, 4, 0];
const initialBoard = [emptyTop.slice(), emptyTop.slice(), emptyTop.slice(), r1.slice(), r0.slice()];
const piece = createPiece('T', 2, 2, 0); // rotation 2 = 180°

console.log('initial board (code: row0=top):', initialBoard);
console.log('T 180° piece at row=2 col=0, cells:', pieceAbsCells(piece));

// T 180° 在 row2 时格子为 (2,0),(3,0),(3,1),(4,0)； (4,0) 已在底行 → 触底锁定，整块写入
const expectedAfterFirstTick = [
	[0, 0, 0],
	[0, 0, 0],
	[2, 0, 0],
	[2, 2, 2],
	[2, 4, 0],
];
const state0 = makeState(5, 3, initialBoard, piece);
const state1 = tick(state0);
assertBoardEqual(state1.board, expectedAfterFirstTick, 'T180 first tick (lock at bottom)');

console.log('--- 第二次 tick：已锁定，应生成新块 ---');
const state2 = tick(state1);
// 锁定后下一 tick 会 spawn 新块，棋盘不变（或无满行时不变）
if (state2.board) {
	const rows = state2.board.length;
	const cols = state2.board[0].length;
	if (rows !== 5 || cols !== 3) throw new Error('T180 after second tick: board shape');
}

// ---------- 随机测试暂缓（测试大工程后续再做） ----------
// 如需随机测试：随机棋盘 + 随机块/旋转，多次 tick 断言棋盘合法、不崩溃，可在此恢复。

console.log('all passed.');

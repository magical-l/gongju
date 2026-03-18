/**
 * 从「视觉初始」反推 before（仅固定块堆），并验证 2 tick 后是否等于 expected。
 * 用法: node verify-merge-cases.js
 */
const path = require('path');
const logic = require(path.join(__dirname, '..', 'logic.js'));
const { createPiece, tick, pieceAbsCells } = logic;

function deepCopyBoard(board) {
	return board.map(row => row.slice());
}

function makeState(rows, cols, boardRows, piece) {
	const board = boardRows.map(row => row.map(v => v || 0));
	return {
		rows, cols, board,
		currentPiece: piece,
		pieceCount: piece ? 1 : 0,
		nextPiece: null,
		gameOver: false,
		clearLinesPending: null,
		postClearGravityState: null,
		cascadePending: false,
		score: 0, highScore: 0, seed: 0
	};
}

function getDisplayBoard(state) {
	const { rows, cols } = state;
	const out = state.board.map(row => row.slice());
	const piece = state.currentPiece;
	if (piece && !state.gameOver) {
		pieceAbsCells(piece).forEach(cell => {
			if (cell.r >= 0 && cell.r < rows && cell.c >= 0 && cell.c < cols)
				out[cell.r][cell.c] = cell.value;
		});
	}
	return out;
}

/** 视觉 = 固定块堆 + 下落块。返回 固定块堆 = 视觉 - 下落块占位（置 0） */
function visualToBefore(visual, shape, rotation, pieceRow, pieceCol) {
	const rows = visual.length;
	const cols = visual[0].length;
	const before = visual.map(r => r.slice());
	const piece = createPiece(shape, rotation, pieceRow, pieceCol);
	pieceAbsCells(piece).forEach(cell => {
		if (cell.r >= 0 && cell.r < rows && cell.c >= 0 && cell.c < cols)
			before[cell.r][cell.c] = 0;
	});
	return before;
}

function pieceFromSpec(p) {
	const piece = createPiece(p.shape, p.rotation != null ? p.rotation : 0, p.row, p.col);
	if (p.cellValues && Array.isArray(p.cellValues)) {
		for (let i = 0; i < piece.cells.length && i < p.cellValues.length; i++)
			piece.cells[i].value = p.cellValues[i];
	}
	return piece;
}

function runMergeCase(rows, cols, before, pieceSpec, ticks, expected) {
	const piece = pieceSpec && typeof pieceSpec.shape === 'string' ? pieceFromSpec(pieceSpec) : pieceSpec;
	let board = deepCopyBoard(before);
	let currentPiece = piece;
	let pieceCountBefore = piece ? 1 : 0;
	let lastState = null;
	let boardAfterLock = null;
	for (let i = 0; i < ticks; i++) {
		const state = makeState(rows, cols, board, currentPiece);
		state.pieceCount = pieceCountBefore;
		const next = tick(state);
		lastState = next;
		if (currentPiece && next.pieceCount > pieceCountBefore)
			boardAfterLock = deepCopyBoard(next.board);
		pieceCountBefore = next.pieceCount;
		board = deepCopyBoard(next.board);
		currentPiece = next.currentPiece;
		if (!currentPiece) break;
	}
	const resultBoard = boardAfterLock != null
		? boardAfterLock
		: (lastState && lastState.currentPiece ? getDisplayBoard(lastState) : deepCopyBoard(board));
	const pass = expected && resultBoard.length === expected.length &&
		resultBoard.every((row, r) => row.length === expected[r].length &&
			row.every((v, c) => v === expected[r][c]));
	return { resultBoard, pass };
}

function boardEquals(a, b, rows, cols) {
	for (let r = 0; r < rows; r++)
		for (let c = 0; c < cols; c++)
			if ((a[r] && a[r][c] || 0) !== (b[r] && b[r][c] || 0)) return false;
	return true;
}

// 用例：部分用视觉反推 before，部分直接给 before；T0-2/Z0-2/S0-2 用 cellValues 使最下端为 4
const cases = [
	// T0
	{ shape: 'T', rotation: 0, rows: 5, cols: 2, before: [[0,0],[0,0],[0,0],[0,2],[2,4]], piece: { shape: 'T', rotation: 0, row: 0, col: 0 }, expected: [[0,0],[0,0],[0,2],[2,2],[2,8]] },
	{ shape: 'T', rotation: 0, rows: 5, cols: 2, before: [[0,0],[0,0],[0,0],[0,4],[2,8]], piece: { shape: 'T', rotation: 0, row: 0, col: 0, cellValues: [2,2,2,4] }, expected: [[0,0],[0,0],[0,2],[2,2],[2,16]] },
	// Z0
	{ shape: 'Z', rotation: 0, rows: 5, cols: 2, before: [[0,0],[0,0],[0,0],[2,0],[4,2]], piece: { shape: 'Z', rotation: 0, row: 0, col: 0 }, expected: [[0,0],[0,0],[0,2],[2,2],[8,2]] },
	{ shape: 'Z', rotation: 0, rows: 5, cols: 2, before: [[0,0],[0,0],[0,0],[4,0],[8,2]], piece: { shape: 'Z', rotation: 0, row: 0, col: 0, cellValues: [2,2,2,4] }, expected: [[0,0],[0,0],[0,2],[2,2],[16,2]] },
	// S0
	{ shape: 'S', rotation: 0, rows: 5, cols: 2, before: [[0,0],[0,0],[0,0],[0,2],[2,4]], piece: { shape: 'S', rotation: 0, row: 0, col: 0 }, expected: [[0,0],[0,0],[2,0],[2,2],[2,8]] },
	{ shape: 'S', rotation: 0, rows: 5, cols: 2, before: [[0,0],[0,0],[0,0],[0,4],[2,8]], piece: { shape: 'S', rotation: 0, row: 0, col: 0, cellValues: [2,2,2,4] }, expected: [[0,0],[0,0],[2,0],[2,2],[2,16]] },
	// J0
	{ shape: 'J', rotation: 0, rows: 5, cols: 2, before: [[0,0],[0,0],[0,0],[2,0],[4,0]], piece: { shape: 'J', rotation: 0, row: 0, col: 0 }, expected: [[0,0],[0,0],[0,2],[0,2],[8,2]] },
	{ shape: 'J', rotation: 0, rows: 5, cols: 2, before: [[0,0],[0,0],[0,0],[0,2],[0,4]], piece: { shape: 'J', rotation: 0, row: 0, col: 0 }, expected: [[0,0],[0,0],[0,2],[0,2],[2,8]] },
	// L0
	{ shape: 'L', rotation: 0, rows: 5, cols: 2, before: [[0,0],[0,0],[0,0],[0,2],[0,4]], piece: { shape: 'L', rotation: 0, row: 0, col: 0 }, expected: [[0,0],[0,0],[2,0],[2,0],[2,8]] },
	{ shape: 'L', rotation: 0, rows: 5, cols: 2, before: [[0,0],[0,0],[0,0],[2,0],[4,0]], piece: { shape: 'L', rotation: 0, row: 0, col: 0 }, expected: [[0,0],[0,0],[2,0],[2,0],[8,2]] },
];

console.log('=== 验证 2 tick 与 expected ===\n');
let allPass = true;
cases.forEach((tc, idx) => {
	const before = tc.before || visualToBefore(tc.visual, tc.shape, tc.rotation, 0, 0);
	const pieceSpec = tc.piece || { shape: tc.shape, rotation: tc.rotation, row: 0, col: 0 };
	const { resultBoard, pass } = runMergeCase(tc.rows, tc.cols, before, pieceSpec, 2, tc.expected);
	allPass = allPass && pass;
	const name = tc.shape + '0-' + (idx % 2 + 1);
	console.log(name + ' before=' + JSON.stringify(before));
	console.log(name + ' expected=' + JSON.stringify(tc.expected));
	console.log(name + ' resultBoard=' + JSON.stringify(resultBoard));
	console.log(name + ' pass=' + pass + '\n');
});
console.log('allPass=' + allPass);

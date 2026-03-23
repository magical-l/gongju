/**
 * 2048方块 测试运行器：describe/it 风格，可分组运行。
 * 运行：node test/run.js 或 npm test（在 游戏/2048方块 目录）
 */
'use strict';

const path = require('path');
const logicPath = path.join(__dirname, '..', 'logic.js');
const logic = require(logicPath);

// --- 公共断言与工具（与 logic.test.js 一致） ---
function boardFromRows(rows) {
	return rows.map(function(row) { return row.slice(); });
}

function boardEquals(a, b, rows, cols) {
	for (let r = 0; r < rows; r++) {
		for (let c = 0; c < cols; c++) {
			const va = a[r] == null ? 0 : (a[r][c] == null ? 0 : a[r][c]);
			const vb = b[r] == null ? 0 : (b[r][c] == null ? 0 : b[r][c]);
			if (va !== vb) return false;
		}
	}
	return true;
}

function boardToStr(board, rows, cols) {
	return Array.from(
		{ length: rows },
		(_, r) => 'r' + r + ':[' + (board[r] == null ? '' : board[r].slice(0, cols).join(',')) + ']'
	).join(' ');
}

function makeState(rows, cols, boardRows, piece) {
	const board = boardFromRows(boardRows);
	const state = logic.init(0, { rows: rows, cols: cols });
	state.board = board;
	state.rows = board.length;
	state.cols = board[0].length;
	state.currentPiece = piece;
	state.pieceCount = piece ? 1 : 0;
	state.nextPiece = null;
	return state;
}

function assertBoardEqual(actual, expected, msg) {
	const a1 = actual && actual.length > 0 && !Array.isArray(actual[0]);
	const e1 = expected && expected.length > 0 && !Array.isArray(expected[0]);
	if (a1 && e1) {
		if (actual.length !== expected.length) {
			console.error(msg || 'row length mismatch');
			throw new Error(msg || 'row length mismatch');
		}
		for (let j = 0; j < actual.length; j++) {
			const va = actual[j] == null ? 0 : actual[j];
			const vb = expected[j] == null ? 0 : expected[j];
			if (va !== vb) {
				console.error(msg || 'board mismatch');
				console.error('expected row:', expected.join(','));
				console.error('actual row: ', actual.join(','));
				throw new Error(msg || 'board mismatch');
			}
		}
		return;
	}
	const rows = actual.length;
	const cols = actual[0] && actual[0].length || 0;
	if (!boardEquals(actual, expected, rows, cols)) {
		console.error(msg || 'board mismatch');
		console.error('expected:', boardToStr(expected, rows, cols));
		console.error('actual:  ', boardToStr(actual, rows, cols));
		throw new Error(msg || 'board mismatch');
	}
}

// --- 简易 describe/it 运行器 ---
const suites = [];
let currentSuite = null;

function describe(name, fn) {
	const prev = currentSuite;
	const suite = { name, tests: [], children: [] };
	currentSuite = suite;
	try {
		fn();
	} finally {
		currentSuite = prev;
	}
	if (prev) prev.children.push(suite);
	else suites.push(suite);
}

function it(name, fn) {
	if (!currentSuite) {
		suites.push({ name: '(root)', tests: [{ name, fn }], children: [] });
		return;
	}
	currentSuite.tests.push({ name, fn });
}

function runTests(list, prefix) {
	prefix = prefix || '';
	let passed = 0;
	let failed = 0;
	for (const s of list) {
		const fullName = prefix ? prefix + ' ' + s.name : s.name;
		if (s.tests && s.tests.length) {
			for (const t of s.tests) {
				try {
					t.fn();
					passed++;
					console.log('  ✓ ' + fullName + ' › ' + t.name);
				} catch (e) {
					failed++;
					console.error('  ✗ ' + fullName + ' › ' + t.name);
					console.error('    ' + (e.message || e));
				}
			}
		}
		if (s.children && s.children.length) {
			const r = runTests(s.children, fullName);
			passed += r.passed;
			failed += r.failed;
		}
	}
	return { passed, failed };
}

// --- 注入到测试文件 ---
const testEnv = {
	describe,
	it,
	logic,
	makeState,
	assertBoardEqual,
	boardEquals,
	boardToStr,
	boardFromRows,
};

// --- 加载并执行测试文件（单文件：合并 / 消行 / 消行后合并）---
const testFiles = ['all.spec.js'];

console.log('2048方块 测试（合并 / 消行 / 消行后合并）\n');

let totalPassed = 0;
let totalFailed = 0;

for (const file of testFiles) {
	const filePath = path.join(__dirname, file);
	try {
		const run = require(filePath);
		if (typeof run === 'function') {
			run(testEnv);
		}
	} catch (e) {
		if (e.code === 'MODULE_NOT_FOUND') {
			console.log('(skip ' + file + ' - not found)');
			continue;
		}
		console.error('Error loading ' + file + ':', e.message);
		totalFailed++;
	}
}

const result = runTests(suites);
totalPassed += result.passed;
totalFailed += result.failed;

console.log('\n' + totalPassed + ' passed, ' + totalFailed + ' failed');
process.exit(totalFailed > 0 ? 1 : 0);

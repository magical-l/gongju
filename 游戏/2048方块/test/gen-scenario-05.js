/**
 * 生成 test/scenarios/scenario-05.js（⑤ 无合并）与 scenario-06.js（⑥ 含合并）。
 * 判定：advancePostLockLineClearNoSpawnWithStats — clearedVerticalMerges>0 或 cascadeSteps>0 → ⑥。
 * 运行：node test/gen-scenario-05.js（在 游戏/2048方块 目录）
 */
'use strict';
var path = require('path');
var fs = require('fs');
var logic = require(path.join(__dirname, '..', 'logic.js'));

var COLS = 4;
var ROWS_ONE = 5;
var ROWS_TWO = 5;

function makeGame(board) {
	var rows = board.length;
	var cols = board[0].length;
	return {
		rows: rows,
		cols: cols,
		board: board.map(function(r) { return r.slice(); }),
		currentPiece: null,
		pieceCount: 1,
		nextPiece: null,
		gameOver: false,
		clearLinesPending: null,
		postClearGravityState: null,
		cascadePending: false,
		score: 0,
		highScore: 0,
		seed: 0,
		level: 0,
		linesClearedTotal: 0,
		overlayVisible: false,
		overlayMessage: '',
		fallIntervalMs: 500
	};
}

function emptyTop(rows, cols) {
	var b = [];
	for (var r = 0; r < rows; r++) {
		var row = [];
		for (var c = 0; c < cols; c++) row.push(0);
		b.push(row);
	}
	return b;
}

function placeRow(b, r, rowVals) {
	for (var c = 0; c < rowVals.length; c++) b[r][c] = rowVals[c];
}

function rowPatternsK4(k) {
	var cols = COLS;
	var out = [];
	if (k === 1) {
		for (var c = 0; c < cols; c++) {
			var row = [];
			for (var j = 0; j < cols; j++) row.push(j === c ? 4 : 2);
			out.push({ label: '1个4在列' + c, row: row });
		}
		return out;
	}
	if (k === 2) {
		for (var a = 0; a < cols; a++) {
			for (var b = a + 1; b < cols; b++) {
				var row = [];
				for (var j = 0; j < cols; j++) row.push(j === a || j === b ? 4 : 2);
				out.push({ label: '2个4在列' + a + ',' + b, row: row });
			}
		}
		return out;
	}
	if (k === 3) {
		for (var c = 0; c < cols; c++) {
			var row = [];
			for (var j = 0; j < cols; j++) row.push(j === c ? 2 : 4);
			out.push({ label: '3个4（列' + c + '为2）', row: row });
		}
		return out;
	}
	return out;
}

function allRowPatterns() {
	return [].concat(rowPatternsK4(1), rowPatternsK4(2), rowPatternsK4(3));
}

function esc(s) {
	return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function emitCase(tc) {
	return '\t\t\t{ rows: ' + tc.rows + ', cols: ' + tc.cols + ', sortKey: ' + tc.sortKey +
		", label: '" + esc(tc.label) + "',\n" +
		'\t\t\t\tbefore: ' + JSON.stringify(tc.before) + ',\n' +
		'\t\t\t\texpected: ' + JSON.stringify(tc.expected) + ' }';
}

var cases = [];
var sortKey = 0;

cases.push({
	sortKey: sortKey++,
	label: '无满行，不变',
	rows: 4,
	cols: 4,
	before: [[0,0,0,2],[0,0,0,0],[0,0,0,0],[0,0,0,0]]
});

(function() {
	var b = emptyTop(ROWS_ONE, COLS);
	placeRow(b, ROWS_ONE - 1, [2,2,2,2]);
	cases.push({
		sortKey: sortKey++,
		label: '仅底一行满，全为2（全除尽）',
		rows: ROWS_ONE,
		cols: COLS,
		before: b
	});
})();

[1, 2, 3].forEach(function(k) {
	rowPatternsK4(k).forEach(function(p) {
		var b = emptyTop(ROWS_ONE, COLS);
		placeRow(b, ROWS_ONE - 1, p.row);
		cases.push({
			sortKey: sortKey++,
			label: '仅底一行满，' + p.label,
			rows: ROWS_ONE,
			cols: COLS,
			before: b
		});
	});
});

(function() {
	var b = emptyTop(ROWS_TWO, COLS);
	placeRow(b, ROWS_TWO - 2, [2,2,2,2]);
	placeRow(b, ROWS_TWO - 1, [2,2,2,2]);
	cases.push({
		sortKey: sortKey++,
		label: '底两行满，均为全2（全除尽）',
		rows: ROWS_TWO,
		cols: COLS,
		before: b
	});
})();

var pat = allRowPatterns();
for (var i = 0; i < pat.length; i++) {
	for (var j = 0; j < pat.length; j++) {
		var b = emptyTop(ROWS_TWO, COLS);
		placeRow(b, ROWS_TWO - 2, pat[i].row);
		placeRow(b, ROWS_TWO - 1, pat[j].row);
		cases.push({
			sortKey: sortKey++,
			label: '底两行满，上行' + pat[i].label + '；下行' + pat[j].label,
			rows: ROWS_TWO,
			cols: COLS,
			before: b
		});
	}
}

var cases05 = [];
var cases06gen = [];
cases.forEach(function(tc) {
	var res = logic.advancePostLockLineClearNoSpawnWithStats(makeGame(tc.before));
	tc.expected = res.board;
	if (res.hasMergeOrCascade) {
		cases06gen.push({
			label: tc.label + '（区内合并' + res.clearedVerticalMerges + '·cascade' + res.cascadeSteps + '）',
			rows: tc.rows,
			cols: tc.cols,
			before: tc.before,
			expected: tc.expected
		});
	} else {
		cases05.push(tc);
	}
});

cases05.forEach(function(tc, idx) {
	tc.sortKey = idx;
});

var FIXED_06 = [
	{ rows: 4, cols: 4, sortKey: 1, label: '顶行满2消后，下方2与剩余列合并为4',
		before: [[2,2,2,2],[0,0,2,2],[0,0,2,2],[0,0,2,2]],
		expected: [[0,0,0,0],[0,0,0,0],[0,0,2,2],[0,0,4,4]] },
	{ rows: 5, cols: 4, sortKey: 2, label: '底两满行消后，4 下落与底行2合并',
		before: [[0,0,0,0],[0,0,0,0],[4,0,0,4],[2,2,2,2],[2,2,2,2]],
		expected: [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[4,0,0,4]] },
	{ rows: 4, cols: 4, sortKey: 3, label: '消两行后多列 2+2 成4',
		before: [[2,2,2,2],[2,2,2,2],[0,0,2,2],[0,0,2,2]],
		expected: [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,4,4]] },
	{ rows: 5, cols: 4, sortKey: 4, label: '底两行 2,4,2,4 / 2,2,2,4（列1与列3 剩余上下对齐）',
		before: [[0,0,0,0],[0,0,0,0],[0,0,0,0],[2,4,2,4],[2,2,2,4]],
		expected: [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,2,0,4]] }
];

var seen06 = {};
FIXED_06.forEach(function(tc) {
	seen06[JSON.stringify(tc.before)] = true;
});

var cases06merged = [];
var sk = 10;
cases06gen.forEach(function(tc) {
	var k = JSON.stringify(tc.before);
	if (seen06[k]) return;
	seen06[k] = true;
	tc.sortKey = sk++;
	cases06merged.push(tc);
});

var cases06all = FIXED_06.slice().concat(cases06merged);

var header05 = '/**\n * ⑤ 简单消行（锁后整盘，无合并）\n * 由 test/gen-scenario-05.js 生成；筛除：advancePostLockLineClearNoSpawnWithStats 区内合并与 cascade 均为 0。\n */\n(function() {\n\tvar s = {\n' +
	'\t\ttitle: \'⑤ 简单消行（锁后整盘，无合并）\',\n' +
	'\t\tdesc: \'不测落子。顺序：无满行 → 仅底一行满（全2；1/2/3个4列遍历）→ 底两行满（全2；上行×下行14×14）。仅保留未触发消行区内竖向合并且未发生 cascade 的盘。\',\n' +
	'\t\tcases: [\n';

var footer05 = '\n\t\t]\n\t};\n\tif (typeof module !== \'undefined\' && module.exports) module.exports = s;\n\tif (typeof window !== \'undefined\') window.SCENARIO_05 = s;\n})();\n';

var header06 = '/**\n * ⑥ 消行后合并 / 连锁（锁后整盘）\n * 固定用例 + gen-scenario-05.js 从同一枚举筛入（曾发生区内合并或 cascade）。\n */\n(function() {\n\tvar s = {\n' +
	'\t\ttitle: \'⑥ 消行后下落合并（锁后整盘）\',\n' +
	'\t\tdesc: \'不测落子。固定几条 + 枚举中「含合并或 cascade」的盘；期望由 logic 生成。\',\n' +
	'\t\tcases: [\n';

var footer06 = '\n\t\t]\n\t};\n\tif (typeof module !== \'undefined\' && module.exports) module.exports = s;\n\tif (typeof window !== \'undefined\') window.SCENARIO_06 = s;\n})();\n';

var path05 = path.join(__dirname, 'scenarios', 'scenario-05.js');
var path06 = path.join(__dirname, 'scenarios', 'scenario-06.js');

fs.writeFileSync(path05, header05 + cases05.map(emitCase).join(',\n') + footer05, 'utf8');
fs.writeFileSync(path06, header06 + cases06all.map(emitCase).join(',\n') + footer06, 'utf8');

console.log('⑤ 无合并: ' + cases05.length + ' → ' + path05);
console.log('⑥ 含合并: ' + cases06all.length + '（固定 ' + FIXED_06.length + ' + 枚举 ' + cases06merged.length + '）→ ' + path06);

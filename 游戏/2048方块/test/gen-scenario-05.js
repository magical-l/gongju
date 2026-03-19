/**
 * 生成 test/scenarios/scenario-05.js（⑤ 无合并）与 scenario-06.js（⑥ 含合并）。
 * 判定：advancePostLockLineClearNoSpawnWithStats — 区内竖合、cascade、消行剩格下落合并 任一项 >0 → ⑥。
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

/** ⑤ 补充（整组最后）：含悬空/建造空隙；逻辑与正式局一致（剩块当活动块落 + 俄式整行塌）。从简到繁 */
[
	{ label: '4×4 悬空·列0有4、下行空、底行满2·保形下落', before: [[0,0,0,0],[4,0,0,0],[0,0,0,0],[2,2,2,2]] },
	{ label: '5×4 悬空·上行两格4·下双行满2除尽·保形下落', before: [[0,0,0,0],[0,0,0,0],[4,0,0,4],[2,2,2,2],[2,2,2,2]] },
	{ label: '5×4 悬空·列0有8、下行空·下双行满2', before: [[0,0,0,0],[8,0,0,0],[0,0,0,0],[2,2,2,2],[2,2,2,2]] },
	{ label: '5×4 悬空·上行 4,2 列2·下双行满2', before: [[0,0,0,0],[0,0,0,0],[4,2,0,0],[2,2,2,2],[2,2,2,2]] },
	{ label: '5×4 悬空·上行 4,4·下双行满2', before: [[0,0,0,0],[4,4,0,0],[0,0,0,0],[2,2,2,2],[2,2,2,2]] },
	{ label: '5×4 悬空·列0有2、下行空·下双行满2（底留单列2）', before: [[0,0,0,0],[2,0,0,0],[0,0,0,0],[2,2,2,2],[2,2,2,2]] },
	{ label: '5×4 悬空·上行两格2/4 错行·下双行满2（较繁）', before: [[2,0,0,0],[0,0,0,0],[4,0,0,0],[2,2,2,2],[2,2,2,2]] }
].forEach(function(extra) {
	cases.push({
		sortKey: sortKey++,
		label: extra.label,
		rows: extra.before.length,
		cols: extra.before[0].length,
		before: extra.before
	});
});

var cases05 = [];
var cases06gen = [];
cases.forEach(function(tc) {
	var res = logic.advancePostLockLineClearNoSpawnWithStats(makeGame(tc.before));
	tc.expected = res.board;
	if (res.hasMergeOrCascade) {
		var tag = '';
		if (res.clearedVerticalMerges !== 1 || res.cascadeSteps !== 0 || (res.clearRemainderMergeSteps || 0) !== 0) {
			tag = '｜区合' + res.clearedVerticalMerges + '·级联' + res.cascadeSteps + '·剩落合' + (res.clearRemainderMergeSteps || 0);
		}
		cases06gen.push({
			label: '底两行｜' + tc.label.replace(/^底两行满，/, '') + tag,
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

/** ⑥ 固定：被消行上方仍有非满行（不入 ⑤/枚举划分，始终归 ⑥） */
var FIXED_06_ABOVE_NONFULL = (function() {
	var C = COLS;
	var out = [];
	function push6(label, fillTop) {
		var H = 6;
		var b = emptyTop(H, C);
		fillTop(b);
		placeRow(b, H - 2, [2, 2, 2, 2]);
		placeRow(b, H - 1, [2, 2, 2, 2]);
		out.push({ rows: H, cols: C, label: label, before: b });
	}
	push6('6×4·被消行上方一行非满·下双行满2除尽', function(b) {
		placeRow(b, 1, [2, 2, 0, 0]);
	});
	push6('6×4·被消行上方两行非满·下双行满2除尽', function(b) {
		placeRow(b, 0, [4, 0, 0, 0]);
		placeRow(b, 1, [0, 2, 2, 2]);
	});
	var b3 = emptyTop(6, C);
	placeRow(b3, 1, [2, 4, 0, 0]);
	placeRow(b3, 4, [2, 2, 2, 2]);
	placeRow(b3, 5, [2, 4, 2, 4]);
	out.push({ rows: 6, cols: C, label: '6×4·被消行上方非满·下双行满含4', before: b3 });
	var H7 = 7;
	var b4 = emptyTop(H7, C);
	placeRow(b4, 0, [2, 0, 0, 0]);
	placeRow(b4, 3, [0, 0, 4, 4]);
	placeRow(b4, H7 - 2, [2, 2, 2, 2]);
	placeRow(b4, H7 - 1, [2, 2, 2, 2]);
	out.push({ rows: H7, cols: C, label: '7×4·上方非满行与全空行间隔·下双行满2除尽', before: b4 });
	var b5 = emptyTop(5, C);
	placeRow(b5, 1, [2, 0, 0, 2]);
	placeRow(b5, 4, [2, 2, 2, 2]);
	out.push({ rows: 5, cols: C, label: '5×4·被消行上方一行非满·仅底行满2除尽', before: b5 });
	return out;
})();

/** ⑥ 固定用例：列/双行合并、错列剩余、6 行含 4 消行（与 ⑤ 按 stats 划分） */
var FIXED_06_RAW = [
	{ rows: 4, cols: 4, label: '4×4 最上行满2 消后·下方列内 2+2→4',
		before: [[2,2,2,2],[0,0,2,2],[0,0,2,2],[0,0,2,2]] },
	{ rows: 4, cols: 4, label: '4×4 连续两行满2 消后·底部两列成4',
		before: [[2,2,2,2],[2,2,2,2],[0,0,2,2],[0,0,2,2]] },
	{ rows: 5, cols: 4, label: '5×4 底两行 2,4,2,4 / 2,2,2,4·列1与列3 剩余上下对齐',
		before: [[0,0,0,0],[0,0,0,0],[0,0,0,0],[2,4,2,4],[2,2,2,4]] },
	{ rows: 6, cols: 4, label: '6×4 中间行单格2 + 下两行满（含4）消后·列内合并',
		before: [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,2,0,0],[2,4,2,2],[2,2,2,2]] }
];
FIXED_06_RAW.forEach(function(tc) {
	tc.expected = logic.advancePostLockLineClearNoSpawn(makeGame(tc.before)).board;
});
FIXED_06_ABOVE_NONFULL.forEach(function(tc) {
	tc.expected = logic.advancePostLockLineClearNoSpawn(makeGame(tc.before)).board;
});

var seenBeforeFixed = {};
FIXED_06_RAW.forEach(function(tc) {
	seenBeforeFixed[JSON.stringify(tc.before)] = true;
});
FIXED_06_ABOVE_NONFULL.forEach(function(tc) {
	seenBeforeFixed[JSON.stringify(tc.before)] = true;
});

cases06gen = cases06gen.filter(function(tc) {
	return !seenBeforeFixed[JSON.stringify(tc.before)];
});

function patternIndex(row) {
	for (var pi = 0; pi < pat.length; pi++) {
		var ok = true;
		for (var c = 0; c < COLS; c++) {
			if (pat[pi].row[c] !== row[c]) {
				ok = false;
				break;
			}
		}
		if (ok) return pi;
	}
	return 999;
}
cases06gen.sort(function(a, b) {
	var ua = a.before[a.rows - 2];
	var da = a.before[a.rows - 1];
	var ub = b.before[b.rows - 2];
	var db = b.before[b.rows - 1];
	var ka = patternIndex(ua) * 32 + patternIndex(da);
	var kb = patternIndex(ub) * 32 + patternIndex(db);
	if (ka !== kb) return ka - kb;
	return JSON.stringify(a.before).localeCompare(JSON.stringify(b.before));
});

var seenExpected = new Set();
var cases06all = [];
FIXED_06_RAW.forEach(function(tc) {
	seenExpected.add(JSON.stringify(tc.expected));
	cases06all.push(tc);
});
FIXED_06_ABOVE_NONFULL.forEach(function(tc) {
	seenExpected.add(JSON.stringify(tc.expected));
	cases06all.push(tc);
});
cases06gen.forEach(function(tc) {
	var ek = JSON.stringify(tc.expected);
	if (seenExpected.has(ek)) {
		return;
	}
	seenExpected.add(ek);
	cases06all.push(tc);
});

cases06all.forEach(function(tc, idx) {
	tc.sortKey = idx + 1;
});

var numFixed = FIXED_06_RAW.length + FIXED_06_ABOVE_NONFULL.length;
var numEnumUnique = cases06all.length - numFixed;

var header05 = '/**\n * ⑤ 简单消行（无合并）\n * 由 test/gen-scenario-05.js 生成；筛除：advancePostLockLineClearNoSpawnWithStats 区内竖合、cascade、消行剩格下落合并 均为 0。\n */\n(function() {\n\tvar s = {\n' +
	'\t\ttitle: \'⑤ 简单消行（无合并）\',\n' +
	'\t\tdesc: \'不测活动块操作。含无满行、单行满、双行满枚举、末尾悬空例。剩格各为 1×1 依次落再俄式抽空行；本组终盘满足区内竖合、cascade、剩格下落合并均为 0。\',\n' +
	'\t\tcases: [\n';

var footer05 = '\n\t\t]\n\t};\n\tif (typeof module !== \'undefined\' && module.exports) module.exports = s;\n\tif (typeof window !== \'undefined\') window.SCENARIO_05 = s;\n})();\n';

var header06 = '/**\n * ⑥ 消行后下落合并\n * 由 test/gen-scenario-05.js 生成：固定盘（含被消行上方非满行）+ 双行枚举终盘去重。\n */\n(function() {\n\tvar s = {\n' +
	'\t\ttitle: \'⑥ 消行后下落合并\',\n' +
	'\t\tdesc: \'不测活动块操作。含固定例、被消行上方仍有非满行、双行枚举去重；终盘多含区内竖合、cascade 或剩格下落合并。期望同 advancePostLockLineClearNoSpawn。\',\n' +
	'\t\tcases: [\n';

var footer06 = '\n\t\t]\n\t};\n\tif (typeof module !== \'undefined\' && module.exports) module.exports = s;\n\tif (typeof window !== \'undefined\') window.SCENARIO_06 = s;\n})();\n';

var path05 = path.join(__dirname, 'scenarios', 'scenario-05.js');
var path06 = path.join(__dirname, 'scenarios', 'scenario-06.js');

fs.writeFileSync(path05, header05 + cases05.map(emitCase).join(',\n') + footer05, 'utf8');
fs.writeFileSync(path06, header06 + cases06all.map(emitCase).join(',\n') + footer06, 'utf8');

console.log('⑤ 无合并: ' + cases05.length + ' → ' + path05);
console.log('⑥: ' + cases06all.length + '（固定用例 ' + numFixed + ' + 枚举终盘去重 ' + numEnumUnique + '）→ ' + path06);

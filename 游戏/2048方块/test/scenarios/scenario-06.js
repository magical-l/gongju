/**
 * ⑥ 消行后下落合并（待实现/校验）
 * 供 测试可视化-按场景.html 使用。
 */
(function() {
	var s = {
		title: '⑥ 消行后下落合并（待实现/校验）',
		desc: '锁块后消行 + 重力 + 竖向合并，与当前 logic 的 applyPendingClearLines 行为一致。先保留用例，后续再对逻辑或期望做校验。',
		cases: [
			{ shape: 'I', rotation: 0, ticks: 1, rows: 4, cols: 4, before: [[0,2,2,2],[0,0,2,2],[0,0,2,2],[0,0,2,2]], piece: { shape: 'I', rotation: 0, row: 0, col: 0 }, expected: [[0,0,0,0],[0,0,0,0],[2,0,2,2],[4,0,4,4]], label: '消第1行', sortKey: 1 },
			{ shape: 'I', rotation: 0, ticks: 1, rows: 4, cols: 4, before: [[0,0,2,2],[0,2,2,2],[0,0,2,2],[0,0,2,2]], piece: { shape: 'I', rotation: 0, row: 0, col: 0 }, expected: [[0,0,0,0],[0,0,0,0],[2,0,2,2],[4,0,4,4]], label: '消第2行', sortKey: 2 },
			{ shape: 'I', rotation: 0, ticks: 1, rows: 4, cols: 4, before: [[0,0,2,2],[0,0,2,2],[0,2,2,2],[0,0,2,2]], piece: { shape: 'I', rotation: 0, row: 0, col: 0 }, expected: [[0,0,0,0],[0,0,0,0],[2,0,2,2],[4,0,4,4]], label: '消第3行', sortKey: 3 },
			{ shape: 'I', rotation: 0, ticks: 1, rows: 4, cols: 4, before: [[0,0,2,2],[0,0,2,2],[0,0,2,2],[0,2,2,2]], piece: { shape: 'I', rotation: 0, row: 0, col: 0 }, expected: [[0,0,0,0],[0,0,0,0],[2,0,2,2],[4,0,4,4]], label: '消第4行', sortKey: 4 },
			{ shape: 'I', rotation: 0, ticks: 1, rows: 4, cols: 4, before: [[0,2,2,2],[0,2,2,2],[0,0,2,2],[0,0,2,2]], piece: { shape: 'I', rotation: 0, row: 0, col: 0 }, expected: [[0,0,0,0],[0,0,0,0],[0,0,0,0],[4,0,4,4]], label: '消第1、2行', sortKey: 5 },
			{ shape: 'I', rotation: 0, ticks: 1, rows: 4, cols: 4, before: [[0,0,2,2],[0,2,2,2],[0,2,2,2],[0,0,2,2]], piece: { shape: 'I', rotation: 0, row: 0, col: 0 }, expected: [[0,0,0,0],[0,0,0,0],[0,0,0,0],[4,0,4,4]], label: '消第2、3行', sortKey: 6 },
			{ shape: 'I', rotation: 0, ticks: 1, rows: 4, cols: 4, before: [[0,0,2,2],[0,0,2,2],[0,2,2,2],[0,2,2,2]], piece: { shape: 'I', rotation: 0, row: 0, col: 0 }, expected: [[0,0,0,0],[0,0,0,0],[0,0,0,0],[4,0,4,4]], label: '消第3、4行', sortKey: 7 },
			{ shape: 'I', rotation: 0, ticks: 1, rows: 4, cols: 4, before: [[0,2,2,2],[0,0,2,2],[0,2,2,2],[0,0,2,2]], piece: { shape: 'I', rotation: 0, row: 0, col: 0 }, expected: [[0,0,0,0],[0,0,0,0],[0,0,0,0],[4,0,4,4]], label: '消第1、3行', sortKey: 8 },
			{ shape: 'I', rotation: 0, ticks: 1, rows: 4, cols: 4, before: [[0,0,2,2],[0,2,2,2],[0,0,2,2],[0,2,2,2]], piece: { shape: 'I', rotation: 0, row: 0, col: 0 }, expected: [[0,0,0,0],[0,0,0,0],[0,0,0,0],[4,0,4,4]], label: '消第2、4行', sortKey: 9 },
			{ shape: 'I', rotation: 0, ticks: 1, rows: 4, cols: 4, before: [[0,2,2,2],[0,0,2,2],[0,0,2,2],[0,2,2,2]], piece: { shape: 'I', rotation: 0, row: 0, col: 0 }, expected: [[0,0,0,0],[0,0,0,0],[0,0,0,0],[4,0,4,4]], label: '消第1、4行', sortKey: 10 },
			{ shape: 'I', rotation: 0, ticks: 1, rows: 4, cols: 4, before: [[0,2,2,2],[0,2,2,2],[0,2,2,2],[0,0,2,2]], piece: { shape: 'I', rotation: 0, row: 0, col: 0 }, expected: [[0,0,0,0],[0,0,0,0],[0,0,0,0],[2,0,2,2]], label: '消第1、2、3行', sortKey: 11 },
			{ shape: 'I', rotation: 0, ticks: 1, rows: 4, cols: 4, before: [[0,0,2,2],[0,2,2,2],[0,2,2,2],[0,2,2,2]], piece: { shape: 'I', rotation: 0, row: 0, col: 0 }, expected: [[0,0,0,0],[0,0,0,0],[0,0,0,0],[2,0,2,2]], label: '消第2、3、4行', sortKey: 12 },
			{ shape: 'I', rotation: 0, ticks: 1, rows: 4, cols: 4, before: [[0,2,2,2],[0,2,2,2],[0,0,2,2],[0,2,2,2]], piece: { shape: 'I', rotation: 0, row: 0, col: 0 }, expected: [[0,0,0,0],[0,0,0,0],[0,0,0,0],[2,0,2,2]], label: '消第1、2、4行', sortKey: 13 },
			{ shape: 'I', rotation: 0, ticks: 1, rows: 4, cols: 4, before: [[0,2,2,2],[0,0,2,2],[0,2,2,2],[0,2,2,2]], piece: { shape: 'I', rotation: 0, row: 0, col: 0 }, expected: [[0,0,0,0],[0,0,0,0],[0,0,0,0],[2,0,2,2]], label: '消第1、3、4行', sortKey: 14 },
			{ shape: 'I', rotation: 0, ticks: 1, rows: 4, cols: 4, before: [[0,2,2,2],[0,2,2,2],[0,2,2,2],[0,2,2,2]], piece: { shape: 'I', rotation: 0, row: 0, col: 0 }, expected: [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]], label: '消第1、2、3、4行', sortKey: 15 },
			{ shape: 'O', rotation: 0, ticks: 1, rows: 4, cols: 4, before: [[0,0,2,2],[0,0,2,2],[0,0,2,2],[0,0,2,2]], piece: { shape: 'O', rotation: 0, row: 2, col: 0 }, expected: [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,4,4]], label: 'O 消2行', sortKey: 16 }
		]
	};
	if (typeof module !== 'undefined' && module.exports) module.exports = s;
	if (typeof window !== 'undefined') window.SCENARIO_06 = s;
})();

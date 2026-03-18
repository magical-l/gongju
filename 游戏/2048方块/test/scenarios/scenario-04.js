/**
 * ④ 同一块：连续多行都可下落合并
 * 供 测试可视化-按场景.html 使用。
 */
(function() {
	var s = {
		title: '④ 同一块：连续多行都可下落合并',
		desc: '同一块、多 tick：下落块每 tick 下移一行，与固定块堆中同数格子合并（连续多行固定块参与合并）。较复杂用例。',
		cases: [
			{ shape: 'I', rotation: 0, ticks: 2, rows: 6, cols: 2, before: [[0,0],[0,0],[0,0],[0,0],[2,0],[4,0]], piece: { shape: 'I', rotation: 0, row: 0, col: 0 }, expected: [[0,0],[0,0],[2,0],[2,0],[2,0],[8,0]] },
			{ shape: 'I', rotation: 0, ticks: 2, rows: 6, cols: 2, before: [[0,0],[0,0],[0,0],[0,0],[4,0],[8,0]], piece: { shape: 'I', rotation: 0, row: 0, col: 0, cellValues: [2,2,2,4] }, expected: [[0,0],[0,0],[2,0],[2,0],[2,0],[16,0]] },
			{ shape: 'I', rotation: 0, ticks: 5, rows: 9, cols: 2, before: [[2,0],[2,0],[2,0],[2,0],[2,0],[4,0],[8,0],[16,0],[32,0]], piece: { shape: 'I', rotation: 0, row: 0, col: 0 }, expected: [[0,0],[0,0],[0,0],[0,0],[0,0],[2,0],[2,0],[2,0],[64,0]] },
			{ shape: 'I', rotation: 1, ticks: 3, rows: 4, cols: 4, before: [[0,0,0,0],[2,0,0,0],[0,2,0,0],[0,0,0,0]], piece: { shape: 'I', rotation: 1, row: 0, col: 0 }, expected: [[0,0,0,0],[0,0,0,0],[0,0,0,0],[4,4,2,2]] },
			{ shape: 'I', rotation: 1, ticks: 3, rows: 4, cols: 4, before: [[0,0,0,0],[4,0,0,0],[8,0,0,0],[0,0,0,0]], piece: { shape: 'I', rotation: 1, row: 0, col: 0, cellValues: [2,2,2,4] }, expected: [[0,0,0,0],[0,0,0,0],[0,0,0,0],[16,2,2,2]] },
			{ shape: 'I', rotation: 1, ticks: 3, rows: 4, cols: 4, before: [[0,0,0,0],[2,2,2,2],[4,4,4,4],[0,0,0,0]], piece: { shape: 'I', rotation: 1, row: 0, col: 0 }, expected: [[0,0,0,0],[0,0,0,0],[0,0,0,0],[8,8,8,8]] },
			{ shape: 'I', rotation: 1, ticks: 4, rows: 5, cols: 4, before: [[0,0,0,0],[2,0,0,0],[0,2,0,0],[0,0,2,0],[0,0,0,2]], piece: { shape: 'I', rotation: 1, row: 0, col: 0 }, expected: [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[4,4,4,4]] },
			{ shape: 'I', rotation: 1, ticks: 4, rows: 5, cols: 4, before: [[0,0,0,0],[2,0,0,2],[0,2,2,0],[0,4,4,0],[4,0,0,4]], piece: { shape: 'I', rotation: 1, row: 0, col: 0 }, expected: [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[8,8,8,8]] },
			{ shape: 'O', rotation: 0, ticks: 2, rows: 4, cols: 2, before: [[0,0],[0,0],[2,2],[4,4]], piece: { shape: 'O', rotation: 0, row: 0, col: 0 }, expected: [[0,0],[0,0],[2,2],[8,8]] },
			{ shape: 'T', rotation: 0, ticks: 2, rows: 5, cols: 2, before: [[0,0],[0,0],[0,0],[0,2],[2,4]], piece: { shape: 'T', rotation: 0, row: 0, col: 0 }, expected: [[0,0],[0,0],[0,2],[2,2],[2,8]] },
			{ shape: 'T', rotation: 0, ticks: 2, rows: 5, cols: 2, before: [[0,0],[0,0],[0,0],[0,4],[2,8]], piece: { shape: 'T', rotation: 0, row: 0, col: 0, cellValues: [2,2,2,4] }, expected: [[0,0],[0,0],[0,2],[2,2],[2,16]] },
			{ shape: 'Z', rotation: 0, ticks: 2, rows: 5, cols: 2, before: [[0,0],[0,0],[0,0],[2,0],[4,2]], piece: { shape: 'Z', rotation: 0, row: 0, col: 0 }, expected: [[0,0],[0,0],[0,2],[2,2],[8,2]] },
			{ shape: 'Z', rotation: 0, ticks: 2, rows: 5, cols: 2, before: [[0,0],[0,0],[0,0],[4,0],[8,2]], piece: { shape: 'Z', rotation: 0, row: 0, col: 0, cellValues: [2,2,2,4] }, expected: [[0,0],[0,0],[0,2],[2,2],[16,2]] },
			{ shape: 'S', rotation: 0, ticks: 2, rows: 5, cols: 2, before: [[0,0],[0,0],[0,0],[0,2],[2,4]], piece: { shape: 'S', rotation: 0, row: 0, col: 0 }, expected: [[0,0],[0,0],[2,0],[2,2],[2,8]] },
			{ shape: 'S', rotation: 0, ticks: 2, rows: 5, cols: 2, before: [[0,0],[0,0],[0,0],[0,4],[2,8]], piece: { shape: 'S', rotation: 0, row: 0, col: 0, cellValues: [2,2,2,4] }, expected: [[0,0],[0,0],[2,0],[2,2],[2,16]] },
			{ shape: 'J', rotation: 0, ticks: 2, rows: 5, cols: 2, before: [[0,0],[0,0],[0,0],[2,0],[4,0]], piece: { shape: 'J', rotation: 0, row: 0, col: 0 }, expected: [[0,0],[0,0],[0,2],[0,2],[8,2]] },
			{ shape: 'J', rotation: 0, ticks: 2, rows: 5, cols: 2, before: [[0,0],[0,0],[0,0],[0,2],[0,4]], piece: { shape: 'J', rotation: 0, row: 0, col: 0 }, expected: [[0,0],[0,0],[0,2],[0,2],[2,8]] },
			{ shape: 'L', rotation: 0, ticks: 2, rows: 5, cols: 2, before: [[0,0],[0,0],[0,0],[0,2],[0,4]], piece: { shape: 'L', rotation: 0, row: 0, col: 0 }, expected: [[0,0],[0,0],[2,0],[2,0],[2,8]] },
			{ shape: 'L', rotation: 0, ticks: 2, rows: 5, cols: 2, before: [[0,0],[0,0],[0,0],[2,0],[4,0]], piece: { shape: 'L', rotation: 0, row: 0, col: 0 }, expected: [[0,0],[0,0],[2,0],[2,0],[8,2]] },
			{ shape: 'T', rotation: 1, ticks: 3, rows: 5, cols: 3, before: [[0,0,0],[0,0,0],[0,2,0],[0,4,0],[0,0,0]], piece: { shape: 'T', rotation: 1, row: 0, col: 0 }, expected: [[0,0,0],[0,0,0],[0,0,0],[0,2,0],[2,8,2]] },
			{ shape: 'Z', rotation: 1, ticks: 3, rows: 5, cols: 3, before: [[0,0,0],[0,0,0],[0,2,0],[0,4,0],[0,0,0]], piece: { shape: 'Z', rotation: 1, row: 0, col: 0 }, expected: [[0,0,0],[0,0,0],[0,0,0],[2,2,0],[0,8,2]] },
			{ shape: 'S', rotation: 1, ticks: 3, rows: 5, cols: 3, before: [[0,0,0],[0,0,0],[0,2,0],[0,4,0],[0,0,0]], piece: { shape: 'S', rotation: 1, row: 0, col: 0 }, expected: [[0,0,0],[0,0,0],[0,0,0],[0,2,2],[2,8,0]] },
			{ shape: 'J', rotation: 1, ticks: 3, rows: 5, cols: 3, before: [[0,0,0],[0,0,0],[0,2,0],[0,4,0],[0,0,0]], piece: { shape: 'J', rotation: 1, row: 0, col: 0 }, expected: [[0,0,0],[0,0,0],[0,0,0],[2,0,0],[2,8,2]] },
			{ shape: 'L', rotation: 1, ticks: 3, rows: 5, cols: 3, before: [[0,0,0],[0,0,0],[0,2,0],[0,4,0],[0,0,0]], piece: { shape: 'L', rotation: 1, row: 0, col: 0 }, expected: [[0,0,0],[0,0,0],[0,0,0],[2,8,2],[2,0,0]] },
			{ shape: 'T', rotation: 2, ticks: 3, rows: 5, cols: 3, before: [[0,0,0],[0,0,0],[0,2,0],[0,4,0],[0,0,0]], piece: { shape: 'T', rotation: 2, row: 0, col: 0 }, expected: [[0,0,0],[0,0,0],[2,0,0],[2,8,0],[2,0,0]] },
			{ shape: 'Z', rotation: 2, ticks: 3, rows: 5, cols: 3, before: [[0,0,0],[0,0,0],[0,2,0],[0,4,0],[0,0,0]], piece: { shape: 'Z', rotation: 2, row: 0, col: 0 }, expected: [[0,0,0],[0,0,0],[0,2,0],[2,8,0],[2,0,0]] },
			{ shape: 'S', rotation: 2, ticks: 3, rows: 5, cols: 3, before: [[0,0,0],[0,0,0],[0,2,0],[0,4,0],[0,0,0]], piece: { shape: 'S', rotation: 2, row: 0, col: 0 }, expected: [[2,0,0],[2,2,0],[0,2,0],[0,4,0],[0,0,0]] },
			{ shape: 'J', rotation: 2, ticks: 3, rows: 5, cols: 3, before: [[0,0,0],[0,0,0],[0,2,0],[0,4,0],[0,0,0]], piece: { shape: 'J', rotation: 2, row: 0, col: 0 }, expected: [[0,0,0],[0,0,0],[2,4,0],[2,4,0],[2,0,0]] },
			{ shape: 'L', rotation: 2, ticks: 3, rows: 5, cols: 3, before: [[0,0,0],[0,0,0],[0,2,0],[0,4,0],[0,0,0]], piece: { shape: 'L', rotation: 2, row: 0, col: 0 }, expected: [[2,2,0],[0,2,0],[0,2,0],[0,4,0],[0,0,0]] },
			{ shape: 'T', rotation: 3, ticks: 3, rows: 5, cols: 3, before: [[0,0,0],[0,0,0],[0,2,0],[0,4,0],[0,0,0]], piece: { shape: 'T', rotation: 3, row: 0, col: 0 }, expected: [[0,0,0],[0,0,0],[0,0,0],[2,2,2],[0,8,0]] },
			{ shape: 'Z', rotation: 3, ticks: 3, rows: 5, cols: 3, before: [[0,0,0],[0,0,0],[0,2,0],[0,4,0],[0,0,0]], piece: { shape: 'Z', rotation: 3, row: 0, col: 0 }, expected: [[0,0,0],[0,0,0],[0,0,0],[2,2,0],[0,8,2]] },
			{ shape: 'S', rotation: 3, ticks: 3, rows: 5, cols: 3, before: [[0,0,0],[0,0,0],[0,2,0],[0,4,0],[0,0,0]], piece: { shape: 'S', rotation: 3, row: 0, col: 0 }, expected: [[0,0,0],[0,0,0],[0,0,0],[0,2,2],[2,8,0]] },
			{ shape: 'J', rotation: 3, ticks: 3, rows: 5, cols: 3, before: [[0,0,0],[0,0,0],[0,2,0],[0,4,0],[0,0,0]], piece: { shape: 'J', rotation: 3, row: 0, col: 0 }, expected: [[0,0,0],[0,0,0],[0,0,0],[2,8,2],[0,0,2]] },
			{ shape: 'L', rotation: 3, ticks: 3, rows: 5, cols: 3, before: [[0,0,0],[0,0,0],[0,2,0],[0,4,0],[0,0,0]], piece: { shape: 'L', rotation: 3, row: 0, col: 0 }, expected: [[0,0,0],[0,0,0],[0,0,0],[0,0,2],[2,8,2]] }
		]
	};
	if (typeof module !== 'undefined' && module.exports) module.exports = s;
	if (typeof window !== 'undefined') window.SCENARIO_04 = s;
})();

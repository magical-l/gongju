/**
 * ③ 同一块：下落一行合并，再下一行不能合并于是锁定
 * 供 测试可视化-按场景.html 使用。
 */
(function() {
	var s = {
		title: '③ 同一块：下落一行合并，再下一行不能合并于是锁定',
		desc: '同一块、两 tick：第 1 tick 下落一行与 2 合并；第 2 tick 再下落一行时遇 4（或异数）不能合并，于是锁定。与①（只测合并）不同：这里测「合并后紧接着被挡住」的锁定。',
		cases: [
			{ shape: 'I', rotation: 0, ticks: 2, rows: 6, cols: 2, before: [[0,0],[0,0],[0,0],[0,0],[2,0],[2,0]], piece: { shape: 'I', rotation: 0, row: 0, col: 0 }, expected: [[0,0],[2,0],[2,0],[2,0],[4,0],[2,0]] },
			{ shape: 'I', rotation: 1, ticks: 2, rows: 3, cols: 4, before: [[0,0,0,0],[2,0,0,0],[0,4,0,0]], piece: { shape: 'I', rotation: 1, row: 0, col: 0 }, columnIndex: 0, expected: [[0,0,0,0],[4,2,2,2],[0,4,0,0]] },
			{ shape: 'O', rotation: 0, ticks: 2, rows: 4, cols: 2, before: [[0,0],[0,0],[2,0],[2,0]], piece: { shape: 'O', rotation: 0, row: 0, col: 0 }, expected: [[0,0],[2,2],[4,2],[2,0]] },
			{ shape: 'T', rotation: 0, ticks: 2, rows: 5, cols: 2, before: [[0,0],[0,0],[0,0],[0,2],[0,2]], piece: { shape: 'T', rotation: 0, row: 0, col: 0 }, expected: [[0,0],[0,2],[2,2],[0,4],[0,2]] },
			{ shape: 'Z', rotation: 0, ticks: 2, rows: 5, cols: 2, before: [[0,0],[0,0],[0,0],[2,0],[2,0]], piece: { shape: 'Z', rotation: 0, row: 0, col: 0 }, expected: [[0,0],[0,2],[2,2],[4,0],[2,0]] },
			{ shape: 'S', rotation: 0, ticks: 2, rows: 5, cols: 2, before: [[0,0],[0,0],[0,0],[0,2],[0,2]], piece: { shape: 'S', rotation: 0, row: 0, col: 0 }, expected: [[0,0],[2,0],[2,2],[0,4],[0,2]] },
			{ shape: 'J', rotation: 0, ticks: 2, rows: 5, cols: 2, before: [[0,0],[0,0],[0,0],[0,2],[0,2]], piece: { shape: 'J', rotation: 0, row: 0, col: 0 }, expected: [[0,0],[0,2],[0,2],[2,4],[0,2]] },
			{ shape: 'L', rotation: 0, ticks: 2, rows: 5, cols: 2, before: [[0,0],[0,0],[0,0],[2,0],[2,0]], piece: { shape: 'L', rotation: 0, row: 0, col: 0 }, expected: [[0,0],[2,0],[2,0],[4,2],[2,0]] }
		]
	};
	if (typeof module !== 'undefined' && module.exports) module.exports = s;
	if (typeof window !== 'undefined') window.SCENARIO_03 = s;
})();

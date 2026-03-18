/**
 * ⑤ 简单消行（不会发生重力下落-合并的场景）
 * 供 测试可视化-按场景.html 使用。
 */
(function() {
	var s = {
		title: '⑤ 简单消行（不会发生重力下落-合并的场景）',
		desc: '仅测「满行在最上方连续若干行」或「O 仅最后两行有堆」：消行后上方无格子，故不会触发重力下落与合并。I0：消第一行、消上两行、消上三行、4行全消；I90：消第一行（仅一行）；O：最后两行之上无格子，消最上行 / 2行全消；T/Z/S/J/L：各一例消上三行（左块+右堆，顶用 4 挡住下落）。',
		cases: [
			{ shape: 'I', rotation: 0, ticks: 1, rows: 4, cols: 4, before: [[0,2,2,2],[0,0,2,2],[0,0,2,2],[0,0,2,2]], piece: { shape: 'I', rotation: 0, row: 0, col: 0 }, expected: [[0,0,0,0],[2,0,2,2],[2,0,2,2],[2,0,2,2]], label: '消第一行', sortKey: 1 },
			{ shape: 'I', rotation: 0, ticks: 1, rows: 4, cols: 4, before: [[0,2,2,2],[0,2,2,2],[0,0,2,2],[0,0,2,2]], piece: { shape: 'I', rotation: 0, row: 0, col: 0 }, expected: [[0,0,0,0],[0,0,0,0],[2,0,2,2],[2,0,2,2]], label: '消上两行', sortKey: 2 },
			{ shape: 'I', rotation: 0, ticks: 1, rows: 4, cols: 4, before: [[0,2,2,2],[0,2,2,2],[0,2,2,2],[0,0,2,2]], piece: { shape: 'I', rotation: 0, row: 0, col: 0 }, expected: [[0,0,0,0],[0,0,0,0],[0,0,0,0],[2,0,2,2]], label: '消上三行', sortKey: 3 },
			{ shape: 'I', rotation: 0, ticks: 1, rows: 4, cols: 4, before: [[0,2,2,2],[0,2,2,2],[0,2,2,2],[0,2,2,2]], piece: { shape: 'I', rotation: 0, row: 0, col: 0 }, expected: [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]], label: '4行全消', sortKey: 4 },
			{ shape: 'I', rotation: 1, ticks: 1, rows: 4, cols: 4, before: [[0,0,0,0],[4,4,4,0],[0,0,2,2],[0,0,2,2]], piece: { shape: 'I', rotation: 1, row: 0, col: 0 }, expected: [[0,0,0,0],[4,4,4,0],[0,0,2,2],[0,0,2,2]], label: 'I90 消第一行', sortKey: 5 },
			{ shape: 'O', rotation: 0, ticks: 1, rows: 4, cols: 4, before: [[0,0,0,0],[0,0,0,0],[0,0,2,2],[0,0,0,2]], piece: { shape: 'O', rotation: 0, row: 2, col: 0 }, expected: [[0,0,0,0],[0,0,0,0],[0,0,0,0],[2,2,0,2]], label: 'O 消最上行', sortKey: 6 },
			{ shape: 'O', rotation: 0, ticks: 1, rows: 4, cols: 4, before: [[0,0,0,0],[0,0,0,0],[0,0,2,2],[0,0,2,2]], piece: { shape: 'O', rotation: 0, row: 2, col: 0 }, expected: [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]], label: 'O 2行全消', sortKey: 7 },
			{ shape: 'T', rotation: 0, ticks: 1, rows: 5, cols: 4, before: [[2,0,2,2],[0,0,2,2],[2,0,2,2],[0,4,0,0],[0,0,0,0]], piece: { shape: 'T', rotation: 0, row: 0, col: 0 }, expected: [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,4,0,0],[0,0,0,0]], label: 'T 消上三行', sortKey: 8 },
			{ shape: 'Z', rotation: 0, ticks: 1, rows: 5, cols: 4, before: [[2,0,2,2],[0,0,2,2],[0,2,2,2],[4,0,0,0],[0,0,0,0]], piece: { shape: 'Z', rotation: 0, row: 0, col: 0 }, expected: [[0,0,0,0],[0,0,0,0],[0,0,0,0],[4,0,0,0],[0,0,0,0]], label: 'Z 消上三行', sortKey: 9 },
			{ shape: 'S', rotation: 0, ticks: 1, rows: 5, cols: 4, before: [[0,2,2,2],[0,0,2,2],[2,0,2,2],[0,4,0,0],[0,0,0,0]], piece: { shape: 'S', rotation: 0, row: 0, col: 0 }, expected: [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,4,0,0],[0,0,0,0]], label: 'S 消上三行', sortKey: 10 },
			{ shape: 'J', rotation: 0, ticks: 1, rows: 4, cols: 4, before: [[2,0,2,2],[2,0,2,2],[0,0,2,2],[4,4,0,2]], piece: { shape: 'J', rotation: 0, row: 0, col: 0 }, expected: [[0,0,0,0],[0,0,0,0],[0,0,0,0],[4,4,0,2]], label: 'J 消上三行', sortKey: 11 },
			{ shape: 'L', rotation: 0, ticks: 1, rows: 4, cols: 4, before: [[0,2,2,2],[0,2,2,2],[0,0,2,2],[4,4,0,2]], piece: { shape: 'L', rotation: 0, row: 0, col: 0 }, expected: [[0,0,0,0],[0,0,0,0],[0,0,0,0],[4,4,0,2]], label: 'L 消上三行', sortKey: 12 }
		]
	};
	if (typeof module !== 'undefined' && module.exports) module.exports = s;
	if (typeof window !== 'undefined') window.SCENARIO_05 = s;
})();

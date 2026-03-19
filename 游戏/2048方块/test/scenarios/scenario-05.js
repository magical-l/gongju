/**
 * ⑤ 简单消行（不会发生重力下落-合并的场景）
 * 供 测试可视化-按场景.html 使用。
 * 用例按形状分组：I、O、T(0/90/180/270)、Z、S、J、L。
 */
(function() {
	var s = {
		title: '⑤ 简单消行（不会发生重力下落-合并的场景）',
		desc: '仅测「满行在最上方连续若干行」或「O 仅最后两行有堆」：消行后上方无格子，故不会触发重力下落与合并。I0：消第一行、消上两行、消上三行、4行全消；I90：消第一行（仅一行）；O：消最上行/2行全消；T/Z/S/J/L：3行块有消最上一行、消上两行、消上三行，2行块有消最上一行、消两行（挡块4只在地板）。',
		cases: [
			// I
			{ shape: 'I', rotation: 0, ticks: 1, rows: 4, cols: 4, before: [[0,2,2,2],[0,0,2,2],[0,0,2,2],[0,0,2,2]], piece: { shape: 'I', rotation: 0, row: 0, col: 0 }, expected: [[0,0,0,0],[2,0,2,2],[2,0,2,2],[2,0,2,2]], label: '消第一行', sortKey: 1 },
			{ shape: 'I', rotation: 0, ticks: 1, rows: 4, cols: 4, before: [[0,2,2,2],[0,2,2,2],[0,0,2,2],[0,0,2,2]], piece: { shape: 'I', rotation: 0, row: 0, col: 0 }, expected: [[0,0,0,0],[0,0,0,0],[2,0,2,2],[2,0,2,2]], label: '消上两行', sortKey: 2 },
			{ shape: 'I', rotation: 0, ticks: 1, rows: 4, cols: 4, before: [[0,2,2,2],[0,2,2,2],[0,2,2,2],[0,0,2,2]], piece: { shape: 'I', rotation: 0, row: 0, col: 0 }, expected: [[0,0,0,0],[0,0,0,0],[0,0,0,0],[2,0,2,2]], label: '消上三行', sortKey: 3 },
			{ shape: 'I', rotation: 0, ticks: 1, rows: 4, cols: 4, before: [[0,2,2,2],[0,2,2,2],[0,2,2,2],[0,2,2,2]], piece: { shape: 'I', rotation: 0, row: 0, col: 0 }, expected: [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]], label: '4行全消', sortKey: 4 },
			{ shape: 'I', rotation: 1, ticks: 1, rows: 4, cols: 4, before: [[0,0,0,0],[4,4,4,0],[0,0,2,2],[0,0,2,2]], piece: { shape: 'I', rotation: 1, row: 0, col: 0 }, expected: [[0,0,0,0],[4,4,4,0],[0,0,2,2],[0,0,2,2]], label: 'I90 消第一行', sortKey: 5 },
			// O
			{ shape: 'O', rotation: 0, ticks: 1, rows: 4, cols: 4, before: [[0,0,0,0],[0,0,0,0],[0,0,2,2],[0,0,0,2]], piece: { shape: 'O', rotation: 0, row: 2, col: 0 }, expected: [[0,0,0,0],[0,0,0,0],[0,0,0,0],[2,2,0,2]], label: 'O 消最上行', sortKey: 6 },
			{ shape: 'O', rotation: 0, ticks: 1, rows: 4, cols: 4, before: [[0,0,0,0],[0,0,0,0],[0,0,2,2],[0,0,2,2]], piece: { shape: 'O', rotation: 0, row: 2, col: 0 }, expected: [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]], label: 'O 2行全消', sortKey: 7 },
			// T/Z/S/J/L 用例（角度：T 新0°=旧270°，Z/S 新0°=旧90°；仅改标题与顺序）
			{ shape: 'T', rotation: 3, ticks: 1, rows: 5, cols: 4, before: [[0,0,0,0],[0,0,0,2],[0,0,2,2],[0,4,0,0],[0,0,0,0]], piece: { shape: 'T', rotation: 3, row: 1, col: 0 }, expected: [[0,0,0,0],[0,0,0,0],[0,2,2,2],[0,4,0,0],[0,0,0,0]], label: 'T0 消最上一行', sortKey: 800 },
			{ shape: 'T', rotation: 3, ticks: 1, rows: 5, cols: 4, before: [[0,0,0,0],[0,0,0,2],[2,0,2,2],[0,4,0,0],[0,0,0,0]], piece: { shape: 'T', rotation: 3, row: 1, col: 0 }, expected: [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,4,0,0],[0,0,0,0]], label: 'T0 消两行', sortKey: 801 },
			{ shape: 'T', rotation: 0, ticks: 1, rows: 5, cols: 4, before: [[2,0,2,2],[0,0,0,2],[0,0,2,2],[0,4,0,0],[0,0,0,0]], piece: { shape: 'T', rotation: 0, row: 0, col: 0 }, expected: [[0,0,0,0],[2,2,0,2],[0,2,2,2],[0,4,0,0],[0,0,0,0]], label: 'T90 消最上一行', sortKey: 810 },
			{ shape: 'T', rotation: 0, ticks: 1, rows: 5, cols: 4, before: [[2,0,2,2],[0,0,2,2],[0,0,2,2],[0,4,0,0],[0,0,0,0]], piece: { shape: 'T', rotation: 0, row: 0, col: 0 }, expected: [[0,0,0,0],[0,0,0,0],[0,2,2,2],[0,4,0,0],[0,0,0,0]], label: 'T90 消上两行', sortKey: 811 },
			{ shape: 'T', rotation: 0, ticks: 1, rows: 5, cols: 4, before: [[2,0,2,2],[0,0,2,2],[2,0,2,2],[0,4,0,0],[0,0,0,0]], piece: { shape: 'T', rotation: 0, row: 0, col: 0 }, expected: [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,4,0,0],[0,0,0,0]], label: 'T90 消上三行', sortKey: 812 },
			{ shape: 'T', rotation: 1, ticks: 1, rows: 5, cols: 4, before: [[0,0,0,0],[2,0,2,2],[0,0,0,0],[0,0,4,0],[0,0,0,0]], piece: { shape: 'T', rotation: 1, row: 1, col: 0 }, expected: [[0,0,0,0],[0,0,0,0],[2,2,2,0],[0,0,4,0],[0,0,0,0]], label: 'T180 消最上一行', sortKey: 820 },
			{ shape: 'T', rotation: 1, ticks: 1, rows: 5, cols: 4, before: [[0,0,0,0],[2,0,2,2],[0,0,0,2],[0,0,4,0],[0,0,0,0]], piece: { shape: 'T', rotation: 1, row: 1, col: 0 }, expected: [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,4,0],[0,0,0,0]], label: 'T180 消两行', sortKey: 821 },
			{ shape: 'T', rotation: 2, ticks: 1, rows: 5, cols: 4, before: [[0,2,2,2],[0,0,0,2],[0,0,2,2],[4,0,0,0],[0,0,0,0]], piece: { shape: 'T', rotation: 2, row: 0, col: 0 }, expected: [[0,0,0,0],[2,2,0,2],[2,0,2,2],[4,0,0,0],[0,0,0,0]], label: 'T270 消最上一行', sortKey: 830 },
			{ shape: 'T', rotation: 2, ticks: 1, rows: 5, cols: 4, before: [[0,2,2,2],[0,0,2,2],[0,0,2,2],[4,0,0,0],[0,0,0,0]], piece: { shape: 'T', rotation: 2, row: 0, col: 0 }, expected: [[0,0,0,0],[0,0,0,0],[2,0,2,2],[4,0,0,0],[0,0,0,0]], label: 'T270 消上两行', sortKey: 831 },
			{ shape: 'T', rotation: 2, ticks: 1, rows: 5, cols: 4, before: [[0,2,2,2],[0,0,2,2],[0,2,2,2],[4,0,0,0],[0,0,0,0]], piece: { shape: 'T', rotation: 2, row: 0, col: 0 }, expected: [[0,0,0,0],[0,0,0,0],[0,0,0,0],[4,0,0,0],[0,0,0,0]], label: 'T270 消上三行', sortKey: 832 },
			{ shape: 'Z', rotation: 1, ticks: 1, rows: 5, cols: 4, before: [[0,0,0,0],[0,0,2,2],[0,0,0,2],[0,0,4,0],[0,0,0,0]], piece: { shape: 'Z', rotation: 1, row: 1, col: 0 }, expected: [[0,0,0,0],[0,0,0,0],[0,2,2,2],[0,0,4,0],[0,0,0,0]], label: 'Z0 消最上一行', sortKey: 1800 },
			{ shape: 'Z', rotation: 1, ticks: 1, rows: 5, cols: 4, before: [[0,0,0,0],[0,0,2,2],[2,0,0,2],[0,0,4,0],[0,0,0,0]], piece: { shape: 'Z', rotation: 1, row: 1, col: 0 }, expected: [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,4,0],[0,0,0,0]], label: 'Z0 消两行', sortKey: 1801 },
			{ shape: 'Z', rotation: 0, ticks: 1, rows: 5, cols: 4, before: [[2,0,2,2],[0,0,0,2],[0,0,2,2],[4,0,0,0],[0,0,0,0]], piece: { shape: 'Z', rotation: 0, row: 0, col: 0 }, expected: [[0,0,0,0],[2,2,0,2],[2,0,2,2],[4,0,0,0],[0,0,0,0]], label: 'Z90 消最上一行', sortKey: 1810 },
			{ shape: 'Z', rotation: 0, ticks: 1, rows: 5, cols: 4, before: [[2,0,2,2],[0,0,2,2],[0,0,2,2],[4,0,0,0],[0,0,0,0]], piece: { shape: 'Z', rotation: 0, row: 0, col: 0 }, expected: [[0,0,0,0],[0,0,0,0],[2,0,2,2],[4,0,0,0],[0,0,0,0]], label: 'Z90 消上两行', sortKey: 1811 },
			{ shape: 'Z', rotation: 0, ticks: 1, rows: 5, cols: 4, before: [[2,0,2,2],[0,0,2,2],[0,2,2,2],[4,0,0,0],[0,0,0,0]], piece: { shape: 'Z', rotation: 0, row: 0, col: 0 }, expected: [[0,0,0,0],[0,0,0,0],[0,0,0,0],[4,0,0,0],[0,0,0,0]], label: 'Z90 消上三行', sortKey: 1812 },
			{ shape: 'S', rotation: 1, ticks: 1, rows: 5, cols: 4, before: [[0,0,0,0],[2,0,0,2],[0,0,0,2],[0,4,0,0],[0,0,0,0]], piece: { shape: 'S', rotation: 1, row: 1, col: 0 }, expected: [[0,0,0,0],[0,0,0,0],[2,2,0,2],[0,4,0,0],[0,0,0,0]], label: 'S0 消最上一行', sortKey: 2800 },
			{ shape: 'S', rotation: 1, ticks: 1, rows: 5, cols: 4, before: [[0,0,0,0],[2,0,0,2],[0,0,2,2],[0,4,0,0],[0,0,0,0]], piece: { shape: 'S', rotation: 1, row: 1, col: 0 }, expected: [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,4,0,0],[0,0,0,0]], label: 'S0 消两行', sortKey: 2801 },
			{ shape: 'S', rotation: 0, ticks: 1, rows: 5, cols: 4, before: [[0,2,2,2],[0,0,0,2],[0,0,2,2],[0,4,0,0],[0,0,0,0]], piece: { shape: 'S', rotation: 0, row: 0, col: 0 }, expected: [[0,0,0,0],[2,2,0,2],[0,2,2,2],[0,4,0,0],[0,0,0,0]], label: 'S90 消最上一行', sortKey: 2810 },
			{ shape: 'S', rotation: 0, ticks: 1, rows: 5, cols: 4, before: [[0,2,2,2],[0,0,2,2],[0,0,2,2],[0,4,0,0],[0,0,0,0]], piece: { shape: 'S', rotation: 0, row: 0, col: 0 }, expected: [[0,0,0,0],[0,0,0,0],[0,2,2,2],[0,4,0,0],[0,0,0,0]], label: 'S90 消上两行', sortKey: 2811 },
			{ shape: 'S', rotation: 0, ticks: 1, rows: 5, cols: 4, before: [[0,2,2,2],[0,0,2,2],[2,0,2,2],[0,4,0,0],[0,0,0,0]], piece: { shape: 'S', rotation: 0, row: 0, col: 0 }, expected: [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,4,0,0],[0,0,0,0]], label: 'S90 消上三行', sortKey: 2812 },
			{ shape: 'J', rotation: 0, ticks: 1, rows: 4, cols: 4, before: [[2,0,2,2],[0,0,2,2],[0,0,0,2],[4,0,0,0]], piece: { shape: 'J', rotation: 0, row: 0, col: 0 }, expected: [[0,0,0,0],[0,2,2,2],[2,2,0,2],[4,0,0,0]], label: 'J0 消最上一行', sortKey: 3800 },
			{ shape: 'J', rotation: 0, ticks: 1, rows: 4, cols: 4, before: [[2,0,2,2],[2,0,2,2],[0,0,0,2],[4,0,0,0]], piece: { shape: 'J', rotation: 0, row: 0, col: 0 }, expected: [[0,0,0,0],[0,0,0,0],[2,2,0,2],[4,0,0,0]], label: 'J0 消上两行', sortKey: 3801 },
			{ shape: 'J', rotation: 0, ticks: 1, rows: 4, cols: 4, before: [[2,0,2,2],[2,0,2,2],[0,0,2,2],[4,0,0,0]], piece: { shape: 'J', rotation: 0, row: 0, col: 0 }, expected: [[0,0,0,0],[0,0,0,0],[0,0,0,0],[4,0,0,0]], label: 'J0 消上三行', sortKey: 3802 },
			{ shape: 'J', rotation: 1, ticks: 1, rows: 4, cols: 4, before: [[0,0,0,0],[0,2,2,2],[0,0,0,0],[0,0,4,0]], piece: { shape: 'J', rotation: 1, row: 1, col: 0 }, expected: [[0,0,0,0],[0,0,0,0],[2,2,2,0],[0,0,4,0]], label: 'J90 消最上一行', sortKey: 3810 },
			{ shape: 'J', rotation: 1, ticks: 1, rows: 4, cols: 4, before: [[0,0,0,0],[0,2,2,2],[0,0,0,2],[0,0,4,0]], piece: { shape: 'J', rotation: 1, row: 1, col: 0 }, expected: [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,4,0]], label: 'J90 消两行', sortKey: 3811 },
			{ shape: 'J', rotation: 2, ticks: 1, rows: 4, cols: 4, before: [[0,0,2,2],[0,0,2,2],[0,0,2,2],[4,0,0,0]], piece: { shape: 'J', rotation: 2, row: 0, col: 0 }, expected: [[0,0,0,0],[2,0,2,2],[2,0,2,2],[4,0,0,0]], label: 'J180 消最上一行', sortKey: 3820 },
			{ shape: 'J', rotation: 2, ticks: 1, rows: 4, cols: 4, before: [[0,0,2,2],[0,2,2,2],[0,0,2,2],[4,0,0,0]], piece: { shape: 'J', rotation: 2, row: 0, col: 0 }, expected: [[0,0,0,0],[0,0,0,0],[2,0,2,2],[4,0,0,0]], label: 'J180 消上两行', sortKey: 3821 },
			{ shape: 'J', rotation: 2, ticks: 1, rows: 4, cols: 4, before: [[0,0,2,2],[0,2,2,2],[0,2,2,2],[4,0,0,0]], piece: { shape: 'J', rotation: 2, row: 0, col: 0 }, expected: [[0,0,0,0],[0,0,0,0],[0,0,0,0],[4,0,0,0]], label: 'J180 消上三行', sortKey: 3822 },
			{ shape: 'J', rotation: 3, ticks: 1, rows: 4, cols: 4, before: [[0,0,0,0],[0,0,0,2],[0,2,0,2],[0,0,4,0]], piece: { shape: 'J', rotation: 3, row: 1, col: 0 }, expected: [[0,0,0,0],[0,0,0,0],[0,2,2,2],[0,0,4,0]], label: 'J270 消最上一行', sortKey: 3830 },
			{ shape: 'J', rotation: 3, ticks: 1, rows: 4, cols: 4, before: [[0,0,0,0],[0,0,0,2],[2,2,0,2],[0,0,4,0]], piece: { shape: 'J', rotation: 3, row: 1, col: 0 }, expected: [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,4,0]], label: 'J270 消两行', sortKey: 3831 },
			{ shape: 'L', rotation: 0, ticks: 1, rows: 4, cols: 4, before: [[0,2,2,2],[0,0,2,2],[0,0,0,2],[4,0,0,0]], piece: { shape: 'L', rotation: 0, row: 0, col: 0 }, expected: [[0,0,0,0],[2,0,2,2],[2,2,0,2],[4,0,0,0]], label: 'L0 消最上一行', sortKey: 4800 },
			{ shape: 'L', rotation: 0, ticks: 1, rows: 4, cols: 4, before: [[0,2,2,2],[0,2,2,2],[0,0,0,2],[4,0,0,0]], piece: { shape: 'L', rotation: 0, row: 0, col: 0 }, expected: [[0,0,0,0],[0,0,0,0],[2,2,0,2],[4,0,0,0]], label: 'L0 消上两行', sortKey: 4801 },
			{ shape: 'L', rotation: 0, ticks: 1, rows: 4, cols: 4, before: [[0,2,2,2],[0,2,2,2],[0,0,2,2],[4,0,0,0]], piece: { shape: 'L', rotation: 0, row: 0, col: 0 }, expected: [[0,0,0,0],[0,0,0,0],[0,0,0,0],[4,0,0,0]], label: 'L0 消上三行', sortKey: 4802 },
			{ shape: 'L', rotation: 1, ticks: 1, rows: 4, cols: 4, before: [[0,0,0,0],[0,0,0,2],[0,0,2,2],[4,0,0,0]], piece: { shape: 'L', rotation: 1, row: 1, col: 0 }, expected: [[0,0,0,0],[0,0,0,0],[2,0,2,2],[4,0,0,0]], label: 'L90 消最上一行', sortKey: 4810 },
			{ shape: 'L', rotation: 1, ticks: 1, rows: 4, cols: 4, before: [[0,0,0,0],[0,0,0,2],[0,2,2,2],[4,0,0,0]], piece: { shape: 'L', rotation: 1, row: 1, col: 0 }, expected: [[0,0,0,0],[0,0,0,0],[0,0,0,0],[4,0,0,0]], label: 'L90 消两行', sortKey: 4811 },
			{ shape: 'L', rotation: 2, ticks: 1, rows: 4, cols: 4, before: [[0,0,2,2],[0,0,2,2],[0,0,2,2],[0,4,0,0]], piece: { shape: 'L', rotation: 2, row: 0, col: 0 }, expected: [[0,0,0,0],[0,2,2,2],[0,2,2,2],[0,4,0,0]], label: 'L180 消最上一行', sortKey: 4820 },
			{ shape: 'L', rotation: 2, ticks: 1, rows: 4, cols: 4, before: [[0,0,2,2],[2,0,2,2],[0,0,2,2],[0,4,0,0]], piece: { shape: 'L', rotation: 2, row: 0, col: 0 }, expected: [[0,0,0,0],[0,0,0,0],[0,2,2,2],[0,4,0,0]], label: 'L180 消上两行', sortKey: 4821 },
			{ shape: 'L', rotation: 2, ticks: 1, rows: 4, cols: 4, before: [[0,0,2,2],[2,0,2,2],[2,0,2,2],[0,4,0,0]], piece: { shape: 'L', rotation: 2, row: 0, col: 0 }, expected: [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,4,0,0]], label: 'L180 消上三行', sortKey: 4822 },
			{ shape: 'L', rotation: 3, ticks: 1, rows: 4, cols: 4, before: [[0,0,0,0],[2,2,0,2],[0,0,0,0],[4,0,0,0]], piece: { shape: 'L', rotation: 3, row: 1, col: 0 }, expected: [[0,0,0,0],[0,0,0,0],[2,2,2,0],[4,0,0,0]], label: 'L270 消最上一行', sortKey: 4830 },
			{ shape: 'L', rotation: 3, ticks: 1, rows: 4, cols: 4, before: [[0,0,0,0],[2,2,0,2],[0,0,0,2],[4,0,0,0]], piece: { shape: 'L', rotation: 3, row: 1, col: 0 }, expected: [[0,0,0,0],[0,0,0,0],[0,0,0,0],[4,0,0,0]], label: 'L270 消两行', sortKey: 4831 }
		]
	};
	if (typeof module !== 'undefined' && module.exports) module.exports = s;
	if (typeof window !== 'undefined') window.SCENARIO_05 = s;
})();

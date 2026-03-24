/**
 * 整理用例表（与 clearing.spec.js、整理测试可视化.html 同源）。
 *
 * 组织方式按《玩法》§7.1「消行剩余 / 上方块」划分，便于回归覆盖；不采用实现细节里的口语化名。
 * - Node：module.exports = { PLAYBOOK, CLEARING_CASES }
 * - 浏览器：CLEARING_TEST_PLAYBOOK、CLEARING_TEST_CASES
 */
(function (factory) {
	'use strict';
	const exp = factory();
	if (typeof module !== 'undefined' && module.exports) {
		module.exports = exp;
	}
	const g = typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : {});
	g.CLEARING_TEST_PLAYBOOK = exp.PLAYBOOK;
	g.CLEARING_TEST_CASES = exp.CLEARING_CASES;
})(function () {
	'use strict';

	/**
	 * 玩法视角「路径」说明§7.1～§7.2 在盘面上如何切分剩格与上方块；具体终盘以用例期望为准。
	 * @type {Record<string, string>}
	 */
	const PLAYBOOK = {
		'§0': '棋盘无满行：不触发消行链，盘面不变。',
		'§1':
			'仅消行剩余、无上方块：被消行组之上至顶行的固定区域内无非零格，除法后至少一格商>1，抠出的整理列表里只有 1×1 剩格。',
		'§2':
			'仅上方块、无消行剩余：满行除法后该行无剩格（商均为 1），其上有非零区域，抠成整块上方行后进入整理。',
		'§3.1':
			'同一消行切片内既有剩格也有上方块；剩格占列与上方块初始占列不交，整理中互不挡道（可按序下落）。',
		'§3.2':
			'剩格先落地后，同列落下之上方块为异数，仅能叠在其上（§4.1 同数才并），不吞噬剩格。',
		'§3.3': '剩格与上方块为同数，竖向接触后合并。',
		'§4':
			'宽 6、落子锁定后以 applyPendingClearLines 与 tick 分步推进（与手动调试页一致），含整块上行竖并限制等规则。',
	};

	/**
	 * section：spec 里 describe 分组
	 * playbook：PLAYBOOK 键
	 * caseNo：稳定编号 C-01… 便于口头/文档对齐（与数组顺序一致）。
	 * @type {(Object)[]}
	 */
	const CLEARING_CASES = [
		{
			id: 'flush-identity',
			caseNo: 'C-01',
			section: 's0',
			playbook: '§0',
			title: '无满行：不进入消行链',
			kind: 'flush',
			board: [[0, 0], [0, 2]],
			expected: [[0, 0], [0, 2]],
		},
		{
			id: 'rem-1cell-q2',
			caseNo: 'C-02',
			section: 's1',
			playbook: '§1',
			title: '底行满 1 个剩格（商为 2），上方全空',
			kind: 'flush',
			board: [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [2, 2, 4, 2]],
			expected: [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 2, 0]],
		},
		{
			id: 'rem-2cell',
			caseNo: 'C-03',
			section: 's1',
			playbook: '§1',
			title: '底行满 2 个剩格（均为商 2）',
			kind: 'flush',
			board: [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [2, 2, 4, 4]],
			expected: [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 2, 2]],
		},
		{
			id: 'rem-3cell',
			caseNo: 'C-04',
			section: 's1',
			playbook: '§1',
			title: '底行满 3 个剩格（均为商 2）',
			kind: 'flush',
			board: [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [2, 4, 4, 4]],
			expected: [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 2, 2, 2]],
		},
		{
			id: 'rem-4cell-wide6',
			caseNo: 'C-05',
			section: 's1',
			playbook: '§1',
			title: '底行满 4 个剩格（商为 2/4/8）',
			kind: 'flush',
			board: [[0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], [2, 2, 4, 4, 8, 8]],
			expected: [[0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], [0, 0, 2, 2, 4, 4]],
		},
		{
			id: 'rem-1cell-q4',
			caseNo: 'C-06',
			section: 's1',
			playbook: '§1',
			title: '底行满 1 个剩格（商为 4）',
			kind: 'flush',
			board: [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [2, 2, 2, 8]],
			expected: [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 4]],
		},
		{
			id: 'above-1cell-col',
			caseNo: 'C-07',
			section: 's2',
			playbook: '§2',
			title: '底行满全消、仅一列上方块下落',
			kind: 'flush',
			board: [[0, 0, 0, 0], [0, 0, 0, 0], [2, 0, 0, 0], [0, 0, 0, 0], [2, 2, 2, 2]],
			expected: [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [2, 0, 0, 0], [0, 0, 0, 0]],
		},
		{
			id: 'above-L-shape',
			caseNo: 'C-08',
			section: 's2',
			playbook: '§2',
			title: '底行满全消、上方块为非矩形（L 形）',
			kind: 'flush',
			board: [[2, 2, 0, 0], [2, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [2, 2, 2, 2]],
			expected: [[0, 0, 0, 0], [2, 2, 0, 0], [2, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
		},
		{
			id: 'flush-1',
			caseNo: 'C-09',
			section: 's2',
			playbook: '§2',
			title: '回归：双列底满 + 左列堆叠（historic flush-1）',
			kind: 'flush',
			board: [[0, 0], [0, 0], [0, 0], [2, 0], [2, 0], [2, 2]],
			expected: [[0, 0], [0, 0], [0, 0], [0, 0], [2, 0], [2, 0]],
		},
		{
			id: 'flush-2',
			caseNo: 'C-10',
			section: 's2',
			playbook: '§2',
			title: '回归：两行满 + 上方阶梯（historic flush-2）',
			kind: 'flush',
			board: [[0, 0, 0], [0, 0, 0], [2, 2, 0], [2, 2, 0], [2, 2, 2], [2, 2, 2]],
			expected: [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [2, 2, 0], [2, 2, 0]],
		},
		{
			id: 'flush-gap',
			caseNo: 'C-11',
			section: 's2',
			playbook: '§2',
			title: '上方块含建造空隙：落稳后行内洞保留',
			kind: 'flush',
			board: [[0, 0, 0, 0], [2, 2, 0, 0], [0, 0, 0, 0], [2, 2, 2, 2]],
			expected: [[0, 0, 0, 0], [0, 0, 0, 0], [2, 2, 0, 0], [0, 0, 0, 0]],
		},
		{
			id: 'flush-cascade-col',
			caseNo: 'C-12',
			section: 's2',
			playbook: '§2',
			title: '整列 2 在底消后竖向多轮并稳',
			kind: 'flush',
			board: [[2, 0, 0, 0], [2, 0, 0, 0], [2, 0, 0, 0], [2, 0, 0, 0], [0, 0, 0, 0], [2, 2, 2, 2]],
			expected: [[0, 0, 0, 0], [2, 0, 0, 0], [2, 0, 0, 0], [2, 0, 0, 0], [2, 0, 0, 0], [0, 0, 0, 0]],
		},
		{
			id: 'flush-split-full-rows',
			caseNo: 'C-13',
			section: 's2',
			playbook: '§2',
			title: '多组不相邻满行、均为全消',
			kind: 'flush',
			board: [[2, 2, 2, 2], [0, 0, 0, 0], [2, 2, 2, 2], [0, 0, 0, 0], [2, 2, 2, 2]],
			expected: [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
		},
		{
			id: 'flush-top-strip',
			caseNo: 'C-14',
			section: 's2',
			playbook: '§2',
			title: '顶行满全消、下方区外列残留与竖并',
			kind: 'flush',
			board: [[2, 2, 2, 2], [0, 0, 2, 2], [0, 0, 2, 2], [0, 0, 2, 2]],
			expected: [[0, 0, 0, 0], [0, 0, 2, 2], [0, 0, 2, 2], [0, 0, 2, 2]],
		},
		{
			id: 'mix-stagger-cols',
			caseNo: 'C-15',
			section: 's3',
			playbook: '§3.1',
			title: '剩格与上方块分列（错开互不挡）',
			kind: 'flush',
			board: [[0, 0, 0, 0], [0, 0, 0, 2], [0, 0, 0, 0], [0, 0, 0, 0], [4, 2, 2, 2]],
			expected: [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 2], [0, 0, 0, 0], [2, 0, 0, 0]],
		},
		{
			id: 'mix-hetero-stack',
			caseNo: 'C-16',
			section: 's3',
			playbook: '§3.2',
			title: '剩格 2 落地后同列上方 4 叠上（异数不并）',
			kind: 'flush',
			board: [[0, 0, 0, 0], [4, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [4, 2, 2, 2]],
			expected: [[0, 0, 0, 0], [0, 0, 0, 0], [4, 0, 0, 0], [0, 0, 0, 0], [2, 0, 0, 0]],
		},
		{
			id: 'mix-same-merge',
			caseNo: 'C-17',
			section: 's3',
			playbook: '§3.3',
			title: '剩格与上方块同数 2 竖并',
			kind: 'flush',
			board: [[0, 0, 0, 0], [0, 0, 0, 0], [0, 2, 0, 0], [0, 0, 0, 0], [4, 2, 2, 2]],
			expected: [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 2, 0, 0], [2, 0, 0, 0]],
		},
		{
			id: 'policy-u',
			caseNo: 'C-18',
			section: 's4',
			playbook: '§4',
			title: '8×6 U 形：落子后消行终盘两侧 4、中 2',
			kind: 'lockCascade',
			fixed: [
				[0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0],
				[2, 2, 2, 2, 2, 0], [2, 0, 0, 0, 2, 0], [2, 2, 2, 2, 2, 0],
				[0, 0, 0, 0, 0, 32], [0, 0, 0, 0, 0, 0], [2, 2, 2, 2, 2, 0],
			],
			pieceCells: [{ r: 4, c: 5, value: 2 }],
			expected: [
				[0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0],
				[0, 0, 0, 0, 0, 32], [2, 2, 2, 2, 2, 0], [4, 2, 2, 2, 4, 0],
			],
			assertFull: true,
		},
		{
			id: 'policy-mixed',
			caseNo: 'C-19',
			section: 's4',
			playbook: '§4',
			title: '8×6 横段有异数则段内禁同数竖并',
			kind: 'lockCascade',
			fixed: [
				[2, 2, 2, 2, 2, 0],
				[2, 2, 2, 2, 2, 0],
				[2, 2, 2, 2, 2, 0],
				[0, 0, 0, 0, 0, 32],
				[0, 0, 0, 0, 0, 0],
				[2, 2, 4, 2, 2, 0],
				[2, 2, 2, 2, 2, 0],
				[0, 0, 0, 0, 0, 0],
			],
			pieceCells: [{ r: 2, c: 5, value: 2 }],
			expectedRow: [2, 2, 2, 2, 2, 0],
			assertRowIndex: 6,
			assertFull: false,
		},
		{
			id: 'policy-edges',
			caseNo: 'C-20',
			section: 's4',
			playbook: '§4',
			title: '8×6 双行底 2：两侧 4、中列保 2',
			kind: 'lockCascade',
			fixed: [
				[0, 0, 0, 0, 0, 0],
				[2, 2, 2, 2, 2, 0],
				[2, 0, 0, 0, 2, 0],
				[2, 2, 2, 2, 2, 0],
				[0, 0, 0, 0, 0, 32],
				[0, 0, 0, 0, 0, 0],
				[2, 2, 2, 2, 2, 0],
				[2, 2, 2, 2, 2, 0],
			],
			pieceCells: [{ r: 3, c: 5, value: 2 }],
			expected: [
				[0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0],
				[0, 0, 0, 0, 0, 32], [2, 2, 2, 2, 2, 0], [4, 2, 2, 2, 4, 0], [2, 2, 2, 2, 2, 0],
			],
			assertFull: true,
		},
	];

	return { PLAYBOOK, CLEARING_CASES };
});

const {
	createApp,
	h
} = Vue;

// ===== 标签数据（全局）=====
// TAGS：标签.json 四轴树（文字系统/官方分类/区块/语义）；NAMES：名字.json（码位→官方英文名）
// FLAT：展平后的有成员标签列表 {name,node,path,count}；SYMBOL_MAP：char → {names,enames,aliases,mode}
let TAGS = null;
let NAMES = null;
let ZH_NAMES = null; // 中文名.json（码位→中文名），空则回退英文名
let FLAT = [];
const SYMBOL_MAP = new Map();
const CAP = 500; // 网格每页字符数
const AXIS_ORDER = ['文字系统', '官方分类', '区块']; // 三大机械轴，树末尾固定顺序
const SEQ_INDEX = new Map(); // 'cp1-cp2' → { zh, en }：旗序列（双码位）名映射，flatten 时构建

/** 区间列表含字符总数 */
function rangeCount(ranges) {
	let n = 0;
	for (const [lo, hi] of ranges) n += hi - lo + 1;
	return n;
}

/** 码位是否落在任一区间 */
function inRanges(ranges, cp) {
	for (const [lo, hi] of ranges) if (cp >= lo && cp <= hi) return true;
	return false;
}

/** 从合并区间列表取第 [start, start+count) 个码位（跨区间顺序枚举，不物化全量） */
function enumerateWindow(ranges, start, count) {
	const out = [];
	let remaining = count;
	let skip = start;
	for (const [lo, hi] of ranges) {
		const len = hi - lo + 1;
		if (skip >= len) { skip -= len; continue; }
		const from = lo + skip;
		const avail = len - skip;
		const take = Math.min(avail, remaining);
		for (let cp = from; cp < from + take; cp++) out.push(cp);
		remaining -= take;
		skip = 0;
		if (remaining <= 0) break;
	}
	return out;
}

/** 区间合并：按 lo 排序并合并重叠/相邻区间，返回无重叠的升序区间列表 */
function mergeRanges(ranges) {
	if (!ranges.length) return [];
	const sorted = [...ranges].sort((a, b) => a[0] - b[0]);
	const out = [];
	let [curLo, curHi] = sorted[0];
	for (let i = 1; i < sorted.length; i++) {
		const [lo, hi] = sorted[i];
		if (lo <= curHi + 1) {
			curHi = Math.max(curHi, hi);
		} else {
			out.push([curLo, curHi]);
			curLo = lo;
			curHi = hi;
		}
	}
	out.push([curLo, curHi]);
	return out;
}

/** 聚合节点及所有子孙的 ranges/seqs（并集去重），树计数与选中标签共用 */
function collectNodeMembers(node) {
	const ranges = [], seqs = [];
	const walk = (n) => {
		if (n.ranges) ranges.push(...n.ranges);
		if (n.seqs) seqs.push(...n.seqs);
		for (const c of Object.values(n.children || {})) walk(c);
	};
	walk(node);
	return { ranges: mergeRanges(ranges), seqs };
}

/** 码位 → 官方英文名：先二分查 names（严格升序），未命中扫 patterns，都没有返回 '' */
function nameOf(cp) {
	if (!NAMES) return '';
	let lo = 0, hi = NAMES.names.length - 1;
	while (lo <= hi) {
		const mid = (lo + hi) >> 1;
		const c = NAMES.names[mid][0];
		if (c === cp) return NAMES.names[mid][1];
		if (c < cp) lo = mid + 1;
		else hi = mid - 1;
	}
	for (const [a, b, prefix] of NAMES.patterns) {
		if (cp >= a && cp <= b) return prefix + cp.toString(16).toUpperCase();
	}
	return '';
}

/** 把搜索词解析为 unicode 码点；不支持或不合法返回 null
 *  支持：U+1F600 / 0x1F600 / &#128512; / &#x1F600;，也支持裸码点（如 1F600、4E2D、face）
 *  裸码点为纯 hex 2-6 位（含纯字母单词，接受英文词误触发——关键词搜索仍会继续并集）；纯数字先按十六进制、越界回退十进制（如 128512） */
function parseCodePointQuery(q) {
	let m = /^(?:u\+|0x)([0-9a-f]{1,6})$/i.exec(q)
		|| /^&#(?:x([0-9a-f]{1,6})|([0-9]{1,7}));?$/i.exec(q);
	let cp;
	if (m) {
		cp = m[1] !== undefined ? parseInt(m[1], 16) : parseInt(m[2], 10);
	} else {
		if (!/^[0-9a-f]{2,6}$/i.test(q)) return null;
		cp = parseInt(q, 16);
		if (cp > 0x10FFFF) {
			if (!/^[0-9]+$/.test(q)) return null; // 混合字母且 hex 越界 → 无效
			cp = parseInt(q, 10); // 十六进制越界回退十进制
		}
	}
	// 越界或落在 UTF-16 代理区（无实际字符，fromCodePoint 会抛错）判为无效
	if (cp > 0x10FFFF || (cp >= 0xD800 && cp <= 0xDFFF)) return null;
	return { cp };
}

/** 码位 → 中文名：SYMBOL_MAP 人工名优先，未命中二分查 中文名.json，都没有返回 '' */
function zhNameOf(cp) {
	const sc = SYMBOL_MAP.get(String.fromCodePoint(cp));
	if (sc && sc.names[0]) return sc.names[0];
	if (!ZH_NAMES) return '';
	let lo = 0, hi = ZH_NAMES.names.length - 1;
	while (lo <= hi) {
		const mid = (lo + hi) >> 1;
		const c = ZH_NAMES.names[mid][0];
		if (c === cp) return ZH_NAMES.names[mid][1];
		if (c < cp) lo = mid + 1;
		else hi = mid - 1;
	}
	for (const [a, b, prefix] of ZH_NAMES.patterns) {
		if (cp >= a && cp <= b) return prefix;
	}
	return '';
}

/** 展平树：收集所有带 ranges/seqs 的节点及纯组节点（有子节点），并构建旗序列名映射 */
function flatten(name, node, path) {
	const hasChildren = !!(node.children && Object.keys(node.children).length > 0);
	if (node.ranges || node.seqs || hasChildren) FLAT.push({ name, node, path, count: (node.ranges ? rangeCount(node.ranges) : 0) + (node.seqs ? node.seqs.length : 0) });
	if (node.seqs) for (const s of node.seqs) SEQ_INDEX.set(s[0] + '-' + s[1], { zh: s[2], en: s[3] });
	if (node.children) for (const [k, v] of Object.entries(node.children)) flatten(k, v, path + '/' + k);
}

/** 构建 char → 元数据 映射（SYMBOLS 为旧数据富化源，first-wins） */
function buildSymbolMap() {
	for (const s of SYMBOLS) {
		if (SYMBOL_MAP.has(s.char)) continue;
		const names = [], enames = [], aliases = [];
		const seen = new Set();
		for (const g of Object.values(s.groups)) {
			if (g.name && !seen.has('n:' + g.name)) { seen.add('n:' + g.name); names.push(g.name); }
			if (g.ename && !seen.has('e:' + g.ename)) { seen.add('e:' + g.ename); enames.push(g.ename); }
			for (const a of (g.alias || [])) {
				if (!seen.has('a:' + a)) { seen.add('a:' + a); aliases.push(a); }
			}
		}
		SYMBOL_MAP.set(s.char, { names, enames, aliases, mode: s.mode || '' });
	}
}

/** 所属标签：入参为单码位或旗序列 [cp1,cp2]（同名同内容合并为一个，多分支 paths 聚合） */
function tagsOf(cp) {
	const byKey = new Map();
	if (Array.isArray(cp)) {
		const [a, b] = cp;
		const seqKey = 'seq:' + a + '-' + b;
		for (const t of FLAT) {
			if (!t.node.seqs || !t.node.seqs.some(s => s[0] === a && s[1] === b)) continue;
			const key = t.name + '\x00' + seqKey;
			let g = byKey.get(key);
			if (!g) { g = { name: t.name, node: t.node, paths: [], count: t.count, intro: t.node.intro || '' }; byKey.set(key, g); }
			g.paths.push(t.path);
		}
		return [...byKey.values()];
	}
	for (const t of FLAT) {
		if (!t.node.ranges || !inRanges(t.node.ranges, cp)) continue;
		const key = t.name + '\x00' + JSON.stringify(t.node.ranges);
		let g = byKey.get(key);
		if (!g) { g = { name: t.name, node: t.node, paths: [], count: rangeCount(t.node.ranges), intro: t.node.intro || '' }; byKey.set(key, g); }
		g.paths.push(t.path);
	}
	return [...byKey.values()];
}

// ===== 字体相关 =====

/** 回退字体列表：queryLocalFonts 不可用时的预定义备用字体（优先符号覆盖广的） */
const FALLBACK_SYMBOL_FONTS = [
	'Noto Sans Symbols 2',
	'Segoe UI Emoji',
	'Segoe UI Symbol',
	'Arial Unicode MS',
	'Arial',
	'Microsoft Sans Serif',
	'Lucida Sans Unicode',
	'Consolas',
	'Courier New',
	'Microsoft YaHei',
	'DengXian',
	'SimSun-ExtB',
	'NSimSun',
	'Yu Gothic',
	'Meiryo',
	'Malgun Gothic',
	'Noto Sans CJK SC',
];

/** 构建渲染栈：系统默认优先（sans-serif 触发系统回退链）+ families 居中 + 内嵌 Noto 兜底 */
function buildFontStack(families) {
	const seen = new Set();
	const quoted = ['sans-serif'];
	for (const f of families) {
		if (!f || seen.has(f)) continue;
		seen.add(f);
		quoted.push('"' + String(f).replace(/"/g, '') + '"');
	}
	quoted.push('"Noto Sans Symbols 2"');
	return quoted.join(', ');
}

/** 全量渲染栈（含内嵌 Noto） */
let FULL_FONT_STACK = buildFontStack(FALLBACK_SYMBOL_FONTS);

/** 更新显示字体栈 + CSS 变量。families 为完整字体名列表（Task 5 动态枚举后调用）。
 *  注意：不清渲染缓存——检测结果与显示栈解耦（豆腐块检测走硬编码空栈），清缓存会使已判豆腐块的字符丢标记。 */
function setFontStacks(families) {
	FULL_FONT_STACK = buildFontStack(families);
	document.documentElement.style.setProperty('--sym-font-stack', FULL_FONT_STACK);
}

/** noto-cmap.json：Noto 覆盖的码位区间（升序、相邻合并） */
let TOFU_NOTO = null;
/** 豆腐块模板像素（空栈渲染私有区所得）及其有效性 */
let TOFU_TEMPLATE = null;
let TOFU_TEMPLATE_OK = false;
/** 模板候选私有区（相邻中性 PUA：几乎不被任何系统字体映射 → 必画 .notdef；不用 F8FF——macOS 映射 Apple logo） */
const TOFU_CANDIDATES = [0xE000, 0xE001, 0xE002];

/** 正向白名单·系统必含（跳过检测，直接判能渲染） */
const ALWAYS_RENDERABLE = [
	[0x0000, 0x024f], [0x0370, 0x04ff], [0x1e00, 0x1eff],
	[0x2000, 0x22ff], [0x2500, 0x26ff], [0x3000, 0x303f],
	[0x4e00, 0x9fff], [0xac00, 0xd7af], [0xf900, 0xfaff], [0xff00, 0xffef],
	[0x1f000, 0x1faff],
];
/** 反向白名单·肯定豆腐块（跳过检测，直接判不支持） */
const ALWAYS_TOFU = [
	[0xe000, 0xf8ff], [0xf0000, 0xffffd], [0x100000, 0x10fffd],
];

/** 完整渲染能力缓存（Noto 或 本机） / 本机渲染能力缓存（不含 Noto） */
const FULL_CACHE = new Map();
const LOCAL_CACHE = new Map();

/** 升序区间列表二分查询 */
function inRangesList(ranges, cp) {
	if (!ranges || !ranges.length) return false;
	let lo = 0, hi = ranges.length - 1;
	while (lo <= hi) {
		const mid = (lo + hi) >> 1;
		const [a, b] = ranges[mid];
		if (cp < a) hi = mid - 1;
		else if (cp > b) lo = mid + 1;
		else return true;
	}
	return false;
}
/** Noto 是否含此码位（离线精确） */
function notoHas(cp) {
	return !!TOFU_NOTO && inRangesList(TOFU_NOTO.ranges, cp);
}

/** 空栈渲染到像素数组（__nonexistent__ + serif → 系统默认字体回退链） */
const _tofuCanvas = (() => { const c = document.createElement('canvas'); c.width = 200; c.height = 100; return c; })();
function _emptyStackData(char) {
	const ctx = _tofuCanvas.getContext('2d');
	ctx.clearRect(0, 0, 200, 100);
	ctx.fillStyle = '#000';
	ctx.font = '72px "__nonexistent__", serif';
	ctx.fillText(char, 30, 60);
	return ctx.getImageData(0, 0, 200, 100).data;
}
function _samePixels(a, b) {
	for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
	return true;
}

/** 生成豆腐块模板：多个私有区渲染一致才启用（防用户装了私有字体致模板失真） */
function initTofuTemplate() {
	const first = _emptyStackData(String.fromCodePoint(TOFU_CANDIDATES[0]));
	let ok = true;
	for (let i = 1; i < TOFU_CANDIDATES.length; i++) {
		if (!_samePixels(first, _emptyStackData(String.fromCodePoint(TOFU_CANDIDATES[i])))) { ok = false; break; }
	}
	if (ok) { TOFU_TEMPLATE = first; TOFU_TEMPLATE_OK = true; }
}

/** 本机（系统默认，不含 Noto）能否渲染单码位：白名单优先，否则豆腐块模板比对 */
function _localCan(cp) {
	if (inRangesList(ALWAYS_RENDERABLE, cp)) return true;
	if (inRangesList(ALWAYS_TOFU, cp)) return false;
	if (!TOFU_TEMPLATE_OK) return true; // 模板无效保守判能渲染
	try {
		return !_samePixels(_emptyStackData(String.fromCodePoint(cp)), TOFU_TEMPLATE);
	} catch (e) { return true; }
}

/** 完整渲染能力（Noto 或 本机）能否渲染：目的1 替代显示用 */
async function checkRenderable(cp) {
	const char = String.fromCodePoint(cp);
	if (FULL_CACHE.has(char)) return FULL_CACHE.get(char);
	const ok = notoHas(cp) ? true : _localCan(cp);
	FULL_CACHE.set(char, ok);
	return ok;
}

/** 本机（不含 Noto）能否渲染：目的2 四象限"本机含"用 */
async function checkLocalRenderable(cp) {
	const char = String.fromCodePoint(cp);
	if (LOCAL_CACHE.has(char)) return LOCAL_CACHE.get(char);
	const ok = _localCan(cp);
	LOCAL_CACHE.set(char, ok);
	return ok;
}

/** 枚举本机所有可用字体 */
async function enumerateFonts(fallbackList) {
	// 优先 queryLocalFonts（Chrome 103+，需用户手势触发权限）
	try {
		if ('queryLocalFonts' in navigator) {
			const raw = await navigator.queryLocalFonts();
			const families = [...new Set(raw.map(f => f.family))];
			return families.sort((a, b) => a.localeCompare(b));
		}
	} catch (e) {
		// 权限拒绝或 API 不可用，静默降级
	}

	// 回退：用预定义列表
	return fallbackList;
}

/** 左侧标签树节点：原生 details/summary 递归组件（展开/折叠交给浏览器原生，点击选中由 select 事件上抛） */
const TagTreeNode = {
	name: 'TagTreeNode',
	props: {
		name: { type: String, required: true },
		node: { type: Object, required: true },
		path: { type: String, required: true },
		selectedPath: { type: String, default: '' },
		defaultOpen: { type: Boolean, default: false }
	},
	data() {
		return { open: this.defaultOpen };
	},
	computed: {
		count() {
			const m = collectNodeMembers(this.node);
			return rangeCount(m.ranges) + m.seqs.length;
		}
	},
	methods: {
		onToggle(e) { this.open = e.target.open; },
		onSelect() {
			this.$emit('select', { name: this.name, node: this.node, path: this.path, count: this.count });
		}
	},
	render() {
		const kids = Object.entries(this.node.children || {});
		const hasChild = kids.length > 0;
		const selectedCls = { selected: this.selectedPath === this.path };
		const rowInner = () => [
			h('span', { class: 'tname' }, this.name),
			h('span', { class: 'tcount' }, String(this.count))
		];
		const children = kids.map(([k, c]) => h(TagTreeNode, {
			key: this.path + '/' + k,
			name: k,
			node: c,
			path: this.path + '/' + k,
			selectedPath: this.selectedPath,
			onSelect: (t) => this.$emit('select', t)
		}));
		if (!hasChild) {
			return h('div', { class: ['trow', 'trow-leaf', selectedCls], onClick: this.onSelect, title: this.node.alias && this.node.alias.length ? this.name + '\n别名：' + this.node.alias.join('、') : this.name }, rowInner());
		}
		return h('details', { class: 'tnode', open: this.open, onToggle: this.onToggle }, [
			h('summary', {
				class: ['trow', selectedCls],
				onClick: this.onSelect,
				title: this.node.alias && this.node.alias.length ? this.name + '\n别名：' + this.node.alias.join('、') : this.name
			}, rowInner()),
			children
		]);
	}
};

const app = createApp({
	components: { TagTreeNode },
	data() {
		return {
			loading: true,
			searchQuery: '',
			selectedTag: null,
			selectedChar: null,
			detailTofu: false, // 选中字符是否渲染不出（详情替代显示）
			detailAdvice: '', // 详情区四象限建议（Noto 含 + 本机不含 → 提示装 Noto）
			gridPage: 1, // 网格当前页码
			gridPageSize: CAP, // 网格每页大小
			searchPage: 1, // 搜索视图页码
			previewFontSize: 2,
			fontSizeAutoFit: true,

			// 字体切换
			fontList: [],
			selectedPreviewFont: '',
			fontAffectsAll: true,
			fontPermDone: false,
		};
	},
	computed: {
		previewStyle() {
			const style = { fontSize: this.previewFontSize + 'rem' };
			if (this.selectedPreviewFont && this.fontAffectsAll) {
				style.fontFamily = `"${this.selectedPreviewFont}"`;
			}
			return style;
		},
		symbolStyle() {
			if (!this.selectedPreviewFont) return {}; // 无字体时走 CSS 默认 Noto
			return { fontFamily: '"' + this.selectedPreviewFont + '", "Noto Sans Symbols 2", sans-serif' };
		},
		previewFontPt() {
			return Math.round(this.previewFontSize * 12);
		},
		/** 树根重排：语义轴在前，文字系统/官方分类/区块末尾（区块最后） */
		treeRoots() {
			if (!TAGS) return [];
			const entries = Object.entries(TAGS.roots);
			const others = entries.filter(([k]) => !AXIS_ORDER.includes(k));
			const formal = AXIS_ORDER.map(k => [k, TAGS.roots[k]]).filter(([, v]) => v);
			return [...others, ...formal];
		},
		/** 是否有搜索关键词 */
		isSearching() {
			return this.searchQuery.trim() !== '';
		},
		/** 当前选中标签聚合的下级成员：递归收集自身及所有子孙的 ranges/seqs */
		selectedMembers() {
			if (!this.selectedTag || !this.selectedTag.node) return { ranges: [], seqs: [] };
			return this.collectNode(this.selectedTag.node);
		},
		/** 当前选中标签聚合后的成员总数（含子孙） */
		selectedCount() {
			return rangeCount(this.selectedMembers.ranges) + this.selectedMembers.seqs.length;
		},
		/** 当前选中标签的网格条目：按页窗口切片（单码位在前，旗序列衔接其后，每页最多 CAP 个） */
		gridItems() {
			const m = this.selectedMembers;
			if (!m.ranges.length && !m.seqs.length) return [];
			const start = (this.gridPage - 1) * this.gridPageSize;
			const size = this.gridPageSize;
			const singleTotal = rangeCount(m.ranges);
			const items = [];
			if (start < singleTotal) {
				items.push(...enumerateWindow(m.ranges, start, size));
			}
			if (items.length < size) {
				const seqStart = Math.max(0, start - singleTotal);
				const seqEnd = Math.min(m.seqs.length, seqStart + (size - items.length));
				for (let i = seqStart; i < seqEnd; i++) items.push([m.seqs[i][0], m.seqs[i][1]]);
			}
			return items;
		},
		/** 当前选中标签的总页数 */
		gridPageCount() {
			return Math.max(1, Math.ceil(this.selectedCount / this.gridPageSize));
		},
		/** 关键词命中的标签（name、path 或简介包含，前 100） */
		matchedTags() {
			const q = this.searchQuery.trim().toLowerCase();
			if (!q) return [];
			const out = [];
			for (const t of FLAT) {
				if (t.name.toLowerCase().includes(q) || t.path.toLowerCase().includes(q) || (t.node.intro && t.node.intro.toLowerCase().includes(q)) || (t.node.alias && t.node.alias.some(a => a.toLowerCase().includes(q)))) {
					out.push(t);
					if (out.length >= 100) break;
				}
			}
			return out;
		},
		/** 关键词命中的符号（char 完全匹配最前，其余搜中文名/别名/英文名，返回全部命中；旗序列按中英名匹配；所属标签简介含关键词也命中） */
		matchedChars() {
			const raw = this.searchQuery.trim();
			const q = raw.toLowerCase();
			if (!q) return [];
			const out = [];
			const seen = new Set();
			// unicode 码 / HTML 数字转义 / 裸码点：解析到码点则加入结果开头，但不阻断后续关键词匹配（并集，多搜点）
			const cpq = parseCodePointQuery(q);
			if (cpq) {
				const cp = cpq.cp;
				out.push({ char: String.fromCodePoint(cp), cp, zhName: zhNameOf(cp), officialName: nameOf(cp) });
				seen.add(cp);
			}
			// 单字符输入：该字符本身直接置顶（不经 SYMBOL_MAP，覆盖普通字母/符号如 a、A、😀，且保留原大小写）
			const single = Array.from(raw);
			if (single.length === 1) {
				const cp = single[0].codePointAt(0);
				out.push({ char: single[0], cp, zhName: zhNameOf(cp), officialName: nameOf(cp) });
				seen.add(cp);
			} else {
				for (const [char, meta] of SYMBOL_MAP) {
					if (char === q) {
						const cp = char.codePointAt(0);
						out.push({ char, cp, zhName: zhNameOf(cp), officialName: nameOf(cp) });
						seen.add(cp);
						break;
					}
				}
			}
			for (const [char, meta] of SYMBOL_MAP) {
				const hit = meta.names.some(n => n.toLowerCase().includes(q))
					|| meta.enames.some(e => e.toLowerCase().includes(q))
					|| meta.aliases.some(a => a.toLowerCase().includes(q));
				if (!hit) continue;
				const cp = char.codePointAt(0);
				if (seen.has(cp)) continue;
				seen.add(cp);
				out.push({ char, cp, zhName: zhNameOf(cp), officialName: nameOf(cp) });
			}
			// 中文名.json 关键词匹配（CLDR emoji/词表/规则产出的中文名，搜"逗号"可找到 ,）
			if (ZH_NAMES) {
				for (const [cp, zh] of ZH_NAMES.names) {
					if (seen.has(cp)) continue;
					if (zh.toLowerCase().includes(q)) {
						seen.add(cp);
						out.push({ char: String.fromCodePoint(cp), cp, zhName: zh, officialName: nameOf(cp) });
					}
				}
			}
			// 旗序列（双码位）关键词匹配：扫 FLAT 中有 seqs 的节点
			for (const t of FLAT) {
				if (!t.node.seqs) continue;
				for (const s of t.node.seqs) {
					if (!String(s[2] || '').toLowerCase().includes(q) && !String(s[3] || '').toLowerCase().includes(q)) continue;
					const key = 'seq:' + s[0] + '-' + s[1];
					if (seen.has(key)) continue;
					seen.add(key);
					out.push({ char: String.fromCodePoint(s[0], s[1]), cp: [s[0], s[1]], zhName: s[2] || '', officialName: s[3] || '' });
				}
			}
			// 所属标签简介关键词匹配：标签简介含关键词的字符也命中（枚举该标签全部成员）
			for (const t of FLAT) {
				if (!t.node.intro || !t.node.intro.toLowerCase().includes(q)) continue;
				const m = collectNodeMembers(t.node);
				for (const [lo, hi] of m.ranges) {
					for (let cp = lo; cp <= hi; cp++) {
						if (seen.has(cp)) continue;
						seen.add(cp);
						out.push({ char: String.fromCodePoint(cp), cp, zhName: zhNameOf(cp), officialName: nameOf(cp) });
					}
				}
				for (const s of m.seqs) {
					const key = 'seq:' + s[0] + '-' + s[1];
					if (seen.has(key)) continue;
					seen.add(key);
					out.push({ char: String.fromCodePoint(s[0], s[1]), cp: [s[0], s[1]], zhName: s[2] || '', officialName: s[3] || '' });
				}
			}
			return out;
		},
		/** 搜索符号匹配：按页切片（每页最多 gridPageSize 个） */
		searchChars() {
			if (!this.matchedChars.length) return [];
			const start = (this.searchPage - 1) * this.gridPageSize;
			return this.matchedChars.slice(start, start + this.gridPageSize);
		},
		/** 搜索符号匹配总页数 */
		searchPageCount() {
			return Math.max(1, Math.ceil(this.matchedChars.length / this.gridPageSize));
		},
	},
	methods: {
		/** 递归收集节点及所有子孙的 ranges 和 seqs */
		collectNode(node) {
			return collectNodeMembers(node);
		},
		/** 选中标签：重置到第一页；网格非空则自动选中第一个条目（保持预览有内容） */
		selectTag(tag) {
			this.gridPage = 1;
			this.selectedTag = tag;
			if (this.gridItems.length) this.selectItem(this.gridItems[0]);
			if (this.gridItems.length) this.refreshRenderability(this.gridItems);
		},
		/** 翻页：更新页码；若当前选中项不在新页，自动选中新页第一个（保持预览与列表一致） */
		onGridPageChange(page) {
			this.gridPage = page;
			if (this.gridItems.length) this.refreshRenderability(this.gridItems);
			if (!this.selectedChar) return;
			const curKey = this.cellKey(this.selectedChar.cp);
			if (!this.gridItems.some(item => this.cellKey(item) === curKey) && this.gridItems.length) {
				this.selectItem(this.gridItems[0]);
			}
		},
		/** 搜索符号匹配翻页 */
		onSearchPageChange(page) {
			this.searchPage = page;
			if (this.searchChars.length) this.refreshRenderability(this.searchChars.map(mc => mc.cp));
		},
		/** 网格条目分发：旗序列（数组）走 selectFlag，单码位走 selectChar */
		selectItem(item) {
			if (this.isFlag(item)) this.selectFlag(item);
			else this.selectChar(item);
		},
		/** 树节点选中：details/summary 原生展开折叠，这里只负责选中标签 */
		onTreeSelect(t) {
			this.selectTag(t);
		},
		/** 是否三大机械轴（文字系统/官方分类/区块）——语义轴默认展开 */
		isFormalAxis(name) {
			return AXIS_ORDER.includes(name);
		},
		/** 选中单码位字符：算元数据 + 官方名 + 所属标签，并刷新预览 */
		selectChar(cp) {
			const char = String.fromCodePoint(cp);
			const meta = SYMBOL_MAP.get(char);
			this.selectedChar = {
				cp,
				char,
				zhName: zhNameOf(cp),
				mode: meta ? meta.mode : '',
				aliases: meta ? meta.aliases : [],
				officialName: nameOf(cp),
				tags: tagsOf(cp),
				codeStr: cp.toString(16).toUpperCase(),
				htmlEntity: '&#' + cp + ';'
			};
			// 详情替代显示检测：旗序列跳过；异步结果回来时用 JSON.stringify 比对防竞态
			this.detailTofu = false;
			if (!Array.isArray(cp)) {
				checkRenderable(cp).then(ok => {
					if (this.selectedChar && JSON.stringify(this.selectedChar.cp) === JSON.stringify(cp)) this.detailTofu = !ok;
				});
			}
			// 详情区四象限建议：Noto 含 + 本机不含 → 提示装 Noto（旗序列跳过）
			this.detailAdvice = '';
			this.refreshDetailAdvice(cp);
			if (this.fontSizeAutoFit) this.adjustFontSize();
		},
		/** 详情区四象限建议：Noto 含 + 本机不含 → 提示装 Noto（旗序列跳过；异步结果回来时用 JSON.stringify 比对防竞态） */
		async refreshDetailAdvice(cp) {
			if (Array.isArray(cp)) { this.detailAdvice = ''; return; } // 旗序列不做建议
			if (!notoHas(cp)) { this.detailAdvice = ''; return; }      // Noto 不含：本机有则 v1 不提示，都无则替代显示已提示
			const localOk = await checkLocalRenderable(cp);
			if (this.selectedChar && JSON.stringify(this.selectedChar.cp) === JSON.stringify(cp)) {
				this.detailAdvice = localOk ? '' : '此字符需 Noto Sans Symbols 2 字体，装它才能在别处显示';
			}
		},
		/** 选中旗序列 [cp1,cp2]：查 SEQ_INDEX 取名，tags 按双码位匹配 */
		selectFlag(seq) {
			const [cp1, cp2] = seq;
			const meta = SEQ_INDEX.get(cp1 + '-' + cp2) || {};
			this.selectedChar = {
				cp: [cp1, cp2],
				char: String.fromCodePoint(cp1, cp2),
				zhName: meta.zh || '',
				officialName: meta.en || '',
				mode: '',
				aliases: [],
				tags: tagsOf([cp1, cp2]),
				codeStr: cp1.toString(16).toUpperCase() + ' ' + cp2.toString(16).toUpperCase(),
				htmlEntity: '&#' + cp1 + ';&#' + cp2 + ';'
			};
			// 旗序列恒可渲染：仅重置详情替代态与建议，不触发检测
			this.detailTofu = false;
			this.detailAdvice = '';
			if (this.fontSizeAutoFit) this.adjustFontSize();
		},
		/** 按名字选标签（取 FLAT 第一个同名且有成员的） */
		selectTagByName(name) {
			// 与 searchSelectTag 一致：跳转时清空搜索态，保证中心栏切回该标签网格
			this.searchQuery = '';
			const t = FLAT.find(x => x.name === name && x.count > 0);
			if (t) this.selectTag(t);
		},
		/** 从搜索结果选标签：清空搜索词并选中 */
		searchSelectTag(t) {
			this.searchQuery = '';
			this.selectTag(t);
		},
		/** 字符格标题：中文名优先，英文名兜底 */
		titleOf(cp) {
			const zh = zhNameOf(cp);
			if (zh) return zh + '\nU+' + cp.toString(16).toUpperCase();
			const nm = nameOf(cp);
			return 'U+' + cp.toString(16).toUpperCase() + (nm ? '\n' + nm : '');
		},
		/** 搜索网格条目标题：中文名 + 官方名（无官方名时回退 U+ 码点，旗序列双码位） */
		searchTitle(mc) {
			const code = Array.isArray(mc.cp)
				? 'U+' + mc.cp.map(c => c.toString(16).toUpperCase()).join(' ')
				: 'U+' + mc.cp.toString(16).toUpperCase();
			return mc.zhName + '\n' + (mc.officialName || code);
		},
		/** 是否为旗序列条目（双码位数组） */
		isFlag(item) {
			return Array.isArray(item);
		},
		/** 网格条目渲染文本 */
		cellText(item) {
			return this.isFlag(item) ? String.fromCodePoint(...item) : String.fromCodePoint(item);
		},
		/** 渲染态：true=能渲染, false=当前字体不支持, null=检测中（占位，不显示豆腐块） */
		renderState(item) {
			if (this.isFlag(item)) return true;
			const v = FULL_CACHE.get(this.cellText(item));
			return v === undefined ? null : v;
		},
		/** 对条目列表批量发起可渲染性检测（仅未缓存单码位），完成后重渲染 */
		async refreshRenderability(items) {
			const singles = [];
			for (const it of items) {
				if (this.isFlag(it)) continue;
				const cp = it;
				if (FULL_CACHE.has(this.cellText(it))) continue;
				singles.push(cp);
			}
			// 分批检测：每 50 个让出事件循环（setTimeout 为宏任务，渲染/输入可在批间处理），
			// 避免 500 字符单次同步跑满（每字符 200×100 getImageData + 逐字节比对）
			for (let i = 0; i < singles.length; i += 50) {
				const batch = singles.slice(i, i + 50);
				await Promise.all(batch.map(cp => checkRenderable(cp)));
				await new Promise(r => setTimeout(r, 0));
			}
			this.$forceUpdate();
		},
		/** 网格条目唯一 key（旗加 's' 前缀防与数字码位混淆） */
		cellKey(item) {
			return this.isFlag(item) ? 's' + item.join('-') : String(item);
		},
		/** 网格条目悬浮标题：旗显示中/英文名，单码位走 titleOf */
		itemTitle(item) {
			if (this.isFlag(item)) {
				const meta = SEQ_INDEX.get(item[0] + '-' + item[1]) || {};
				return (meta.zh || '') + '\n' + (meta.en || '');
			}
			return this.titleOf(item);
		},
		/** 网格卡片显示名：单码位中文名优先英文名兜底；旗序列中/英文名 */
		gridItemName(item) {
			if (this.isFlag(item)) {
				const meta = SEQ_INDEX.get(item[0] + '-' + item[1]) || {};
				return meta.zh || meta.en || '';
			}
			return zhNameOf(item) || nameOf(item) || '';
		},
		/** 网格条目是否为双模字符（文本/表情两种变体），旗序列恒为 false */
		itemDual(item) {
			if (this.isFlag(item)) return false;
			return SYMBOL_MAP.get(this.cellText(item))?.mode === 'dual';
		},
		/** 网格条目是否当前选中 */
		isSelected(item) {
			if (!this.selectedChar) return false;
			if (this.isFlag(item)) {
				return Array.isArray(this.selectedChar.cp)
					&& this.selectedChar.cp[0] === item[0]
					&& this.selectedChar.cp[1] === item[1];
			}
			return item === this.selectedChar.cp;
		},
		/** 复制当前字符（双模按表情风格） */
		copyChar() {
			const sc = this.selectedChar;
			if (!sc) return;
			const text = sc.mode === 'dual' ? sc.char + '️' : sc.char;
			navigator.clipboard.writeText(text).then(() => {
				ElementPlus.ElMessage.success(`"${sc.zhName || sc.char}"已复制`);
			}).catch(err => {
				ElementPlus.ElMessage.error('复制失败: ' + err);
			});
		},
		/** 复制双模变体（text/emoji） */
		copyVariant(type) {
			const sc = this.selectedChar;
			if (!sc || sc.mode !== 'dual') return;
			const vs = type === 'text' ? '︎' : '️';
			const text = sc.char + vs;
			navigator.clipboard.writeText(text).then(() => {
				const label = type === 'text' ? '文本风格' : '表情风格';
				ElementPlus.ElMessage.success(`"${sc.zhName || sc.char}"（${label}）已复制`);
			}).catch(err => {
				ElementPlus.ElMessage.error('复制失败: ' + err);
			});
		},
		/** 复制网格条目的双模变体（text/emoji），item 为网格条目 */
		copyGridVariant(item, type) {
			const char = this.cellText(item);
			const vs = type === 'text' ? '︎' : '️';
			const text = char + vs;
			navigator.clipboard.writeText(text).then(() => {
				const label = type === 'text' ? '文本风格' : '表情风格';
				ElementPlus.ElMessage.success(`"${zhNameOf(item) || char}"（${label}）已复制`);
			}).catch(err => {
				ElementPlus.ElMessage.error('复制失败: ' + err);
			});
		},
		copyCode(event) {
			const codeText = event.target.closest('.code').querySelector('.code-text').textContent;
			navigator.clipboard.writeText(codeText).then(() => {
				ElementPlus.ElMessage.success(`"${codeText}"已复制`);
			}).catch(err => {
				ElementPlus.ElMessage.error('复制失败: ' + err);
			});
		},
		adjustFontSize() {
			this.$nextTick(() => {
				// 只处理溢出缩小（同一个 align-row 上比 scrollWidth > clientWidth），
				// 不做太小放大——窄符号天然窄，放大会破坏视觉效果。
				// 用户需放大时通过手动 +/- 按钮。
				const rows = document.querySelectorAll(".symbol-preview .align-row");
				if (!rows.length) return;
				let maxRatio = 1;
				for (const row of rows) {
					if (row.scrollWidth > row.clientWidth) {
						maxRatio = Math.max(maxRatio, row.scrollWidth / row.clientWidth);
					}
				}
				if (maxRatio <= 1) return;

				// 读 DOM 实际字号（px），避免多次  调用时用 stale 的 data 反复缩
				const actualPx = parseFloat(getComputedStyle(rows[0]).fontSize);
				const actualRem = actualPx / 16;
				let newSize = Math.round((actualRem / maxRatio) * 10) / 10;
				newSize = Math.max(0.3, Math.min(6, newSize));

				if (Math.abs(newSize - this.previewFontSize) > 0.05) {
					this.previewFontSize = newSize;
				}
			});
		},
		adjustFontSizeBy(deltaPt) {
			this.fontSizeAutoFit = false;
			let newSize = Math.round((this.previewFontSize + deltaPt / 12) * 10) / 10;
			newSize = Math.max(0.3, Math.min(6, newSize));
			this.previewFontSize = newSize;
		},
		resetFontSize() {
			this.fontSizeAutoFit = true;
			this.previewFontSize = 2;
			this.$nextTick(() => this.adjustFontSize());
		},

		// ===== 字体切换 =====

		/** 初始化字体列表（先加载回退列表，dropdown 打开时再尝试 queryLocalFonts） */
		async initFontList() {
			const families = await enumerateFonts(FALLBACK_SYMBOL_FONTS);
			this.fontList = families.length > 0 ? families : FALLBACK_SYMBOL_FONTS;
		},

		/** 字体选择器区域用户交互时申请 queryLocalFonts 授权：更新显示渲染栈 + 字体列表 */
		async requestFontPerm() {
			if (this.fontPermDone) return;
			try {
				// Chrome 151+ 挂 window，旧版挂 navigator。WebIDL 方法对 this 有品牌检查，
				// 须先判断挂在谁身上、以正确的 receiver 调用，避免 Illegal invocation 被吞
				let raw;
				if (typeof window.queryLocalFonts === 'function') {
					raw = await window.queryLocalFonts();
				} else if (typeof navigator.queryLocalFonts === 'function') {
					raw = await navigator.queryLocalFonts();
				} else {
					return; // API 不可用
				}
				const families = [...new Set(raw.map(f => f.family))].sort((a, b) => a.localeCompare(b));
				// 仅成功枚举到字体才置完成标记；拒绝/失败保持 false 可重试
				if (families.length) {
					setFontStacks(families);
					this.fontList = families;
					this.fontPermDone = true;
				}
			} catch (e) {
				// 用户拒绝授权或 API 不可用 → 保持当前（静态降级）栈，静默；fontPermDone 仍为 false 可重试
			}
		},

		/** 获取字体的 style 对象，用于在选项内预览字符；空字体回退 Noto */
		fontStyle(fontName) {
			if (!fontName) return {};
			return { fontFamily: '"' + fontName + '", "Noto Sans Symbols 2", sans-serif' };
		},
	},
	async mounted() {
		try {
			const [tags, names, zhnames] = await Promise.all([
				fetch('标签.json').then(r => r.json()),
				fetch('名字.json').then(r => r.json()),
				fetch('中文名.json').then(r => r.json()),
				fetch('noto-cmap.json').then(r => r.json()).then(d => { TOFU_NOTO = d; }).catch(() => {})
			]);
			TAGS = tags;
			NAMES = names;
			ZH_NAMES = zhnames;
			for (const [name, node] of Object.entries(TAGS.roots)) flatten(name, node, name);
			buildSymbolMap();
			this.loading = false;
			// 豆腐块模板须在首次 selectTag（触发 refreshRenderability 检测）之前生成，
			// 否则模板未就绪时白名单外全判能渲染并缓存，后续不复检
			initTofuTemplate();
			// 默认标签：优先一个能看懂的脸部 emoji 标签
			const def = FLAT.find(t => t.name === '表情、脸')
				|| FLAT.find(t => t.name === '表情、情绪')
				|| FLAT[0];
			if (def) this.selectTag(def);
		} catch (err) {
			console.error('标签数据加载失败', err);
			ElementPlus.ElMessage.error('标签数据加载失败：' + err);
			this.loading = false;
		}
		setFontStacks(FALLBACK_SYMBOL_FONTS);
		this.initFontList();
		this.$nextTick(() => {
			this.adjustFontSize();
			window.addEventListener("resize", this.adjustFontSize);
		});
	},
	watch: {
		searchQuery(nv) {
			this.searchPage = 1;
			const s = nv.trim();
			if (s === '') return;
			const arr = Array.from(s);
			if (arr.length === 1) {
				const cp = arr[0].codePointAt(0);
				if (cp !== undefined && cp !== null) this.selectChar(cp);
			}
			if (arr.length === 2) {
				const key = arr[0].codePointAt(0) + '-' + arr[1].codePointAt(0);
				if (SEQ_INDEX.has(key)) this.selectFlag(arr.map(x => x.codePointAt(0)));
			}
			// unicode 码 / HTML 转义：解析到码点直接选中详情，与输入单字符一致
			const cpq = parseCodePointQuery(s);
			if (cpq) this.selectChar(cpq.cp);
		},
		// 搜索符号匹配变化 → 预检测渲染能力（未检测字符置占位，不闪豆腐块）
		searchChars(nv) {
			if (nv.length) this.refreshRenderability(nv.map(mc => mc.cp));
		}
	}
}).use(ElementPlus).mount('main>article');

const help = createApp({
	data() {
		return {
			introVisible: !localStorage.getItem('intro-hidden-' + window.location.pathname)
		};
	},
	watch: {
		introVisible(newValue) {
			const storageKey = 'intro-hidden-' + window.location.pathname;
			if (!newValue) {
				localStorage.setItem(storageKey, 'true');
			} else {
				localStorage.removeItem(storageKey);
			}
		}
	}
}).use(ElementPlus).mount('.help.area');

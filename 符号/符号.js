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
let DUAL_SET = new Set(); // 双模（文本/表情两变体）码位集合：mounted 时从 标签.json 的 emoji > emoji-text双模 ranges 构建（权威集合，207 码位）
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

/** 是否 C0/C1 控制码（不可见；与 官方分类/控制字符 标签的 ranges 同源） */
function isControlCode(cp) {
	return cp < 0x20 || (cp >= 0x7F && cp <= 0x9F);
}

/** 无名字码点分类：C0/C1 控制字符 / 私用区（含补充平面）/ 其余（未分配、非字符等） */
function unnamedKind(cp) {
	if (isControlCode(cp)) return 'control';
	if ((cp >= 0xE000 && cp <= 0xF8FF) || (cp >= 0xF0000 && cp <= 0xFFFFD) || (cp >= 0x100000 && cp <= 0x10FFFD)) return 'private';
	return 'unassigned';
}

/** 码位 → 官方英文名：先二分查 names（严格升序），未命中扫 patterns；数据层无名的码点按分类给标签名兜底 */
function nameOf(cp) {
	if (NAMES) {
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
	}
	const h = cp.toString(16).toUpperCase();
	const kind = unnamedKind(cp);
	if (kind === 'control') return '<control-' + h + '>';
	if (kind === 'private') return '<private-use-' + h + '>';
	return '<unassigned-' + h + '>';
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

/** 码位 → 中文名：SYMBOL_MAP 人工名优先，未命中二分查 中文名.json；数据层无中文名的码点按分类给中文名兜底 */
function zhNameOf(cp) {
	const sc = SYMBOL_MAP.get(String.fromCodePoint(cp));
	if (sc && sc.names[0]) return sc.names[0];
	if (ZH_NAMES) {
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
	}
	const kind = unnamedKind(cp);
	if (kind === 'control') return '控制字符';
	if (kind === 'private') return '私用区码点';
	return '未分配码点';
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

// ===== 临时数据修正：内存级 TAGS 操作（不写盘）=====

/** 从路径定位标签节点：TAGS.roots 起逐级走 children；找不到返回 null */
function nodeAtPath(path) {
	if (!TAGS) return null;
	const parts = path.split('/');
	let node = TAGS.roots[parts[0]];
	if (!node) return null;
	for (let i = 1; i < parts.length; i++) {
		node = node.children && node.children[parts[i]];
		if (!node) return null;
	}
	return node;
}

/** 节点自身是否直接持有某成员（单码位查 ranges，旗序列查 seqs） */
function nodeHasMember(node, cp) {
	if (Array.isArray(cp)) {
		return !!(node.seqs && node.seqs.some(s => s[0] === cp[0] && s[1] === cp[1]));
	}
	return !!(node.ranges && inRanges(node.ranges, cp));
}

/** 节点聚合（含子孙）是否已含某成员——与网格显示一致 */
function nodeAggregatesMember(node, cp) {
	const m = collectNodeMembers(node);
	if (Array.isArray(cp)) return m.seqs.some(s => s[0] === cp[0] && s[1] === cp[1]);
	return inRanges(m.ranges, cp);
}

/** 区间加单码位：并入 [cp,cp] 后合并（原地） */
function rangesAdd(node, cp) {
	node.ranges = mergeRanges([...(node.ranges || []), [cp, cp]]);
}

/** 区间删单码位：拆开含 cp 的区间（原地） */
function rangesRemove(node, cp) {
	if (!node.ranges) return;
	const out = [];
	for (const [lo, hi] of node.ranges) {
		if (cp < lo || cp > hi) { out.push([lo, hi]); continue; }
		if (lo <= cp - 1) out.push([lo, cp - 1]);
		if (cp + 1 <= hi) out.push([cp + 1, hi]);
	}
	node.ranges = mergeRanges(out);
}

/** 旗序列加：去重后 push [cp1,cp2,zh,en]（原地） */
function seqsAdd(node, seq, zh, en) {
	if (!node.seqs) node.seqs = [];
	const [a, b] = seq;
	if (!node.seqs.some(s => s[0] === a && s[1] === b)) node.seqs.push([a, b, zh || '', en || '']);
}

/** 旗序列删：按双码位过滤（原地） */
function seqsRemove(node, seq) {
	if (!node.seqs) return;
	const [a, b] = seq;
	node.seqs = node.seqs.filter(s => !(s[0] === a && s[1] === b));
}

/** 在 node 子树内找到真正持有 cp 的节点并删除（单码位拆区间/旗序列过滤），返回是否找到 */
function removeFromSubtree(node, cp) {
	if (nodeHasMember(node, cp)) {
		if (Array.isArray(cp)) seqsRemove(node, cp);
		else rangesRemove(node, cp);
		return true;
	}
	for (const c of Object.values(node.children || {})) {
		if (removeFromSubtree(c, cp)) return true;
	}
	return false;
}

/** 重建 FLAT 与 SEQ_INDEX（TAGS 被内存改动后调用；flatten 是增量追加，须先清空） */
function rebuildFlat() {
	FLAT = [];
	SEQ_INDEX.clear();
	for (const [name, node] of Object.entries(TAGS.roots)) flatten(name, node, name);
}

// ===== 字体相关 =====

/** 回退字体列表：queryLocalFonts 不可用时的预定义备用字体（优先符号覆盖广的） */
const FALLBACK_SYMBOL_FONTS = [
	'Segoe UI Emoji',
	'Segoe UI Symbol',
	'Consolas',
	'Lucida Sans Unicode',
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

/** 左侧标签树节点：原生 details/summary 递归组件（展开/折叠交给浏览器原生，点击选中由 select 事件上抛） */
const TagTreeNode = {
	name: 'TagTreeNode',
	emits: ['select', 'drag-over', 'drag-leave', 'drop'],
	props: {
		name: { type: String, required: true },
		node: { type: Object, required: true },
		path: { type: String, required: true },
		selectedPath: { type: String, default: '' },
		defaultOpen: { type: Boolean, default: false },
		dragOverPath: { type: String, default: '' }
	},
	data() {
		return { open: this.defaultOpen };
	},
	computed: {
		count() {
			const m = collectNodeMembers(this.node);
			return rangeCount(m.ranges) + m.seqs.length;
		},
		/** 拖拽悬浮高亮：父级传入的悬浮路径 === 本节点路径 */
		isDragOver() {
			return this.dragOverPath === this.path;
		}
	},
	methods: {
		onToggle(e) { this.open = e.target.open; },
		onSelect() {
			this.$emit('select', { name: this.name, node: this.node, path: this.path, count: this.count });
		},
		onDragOver(e) {
			e.preventDefault(); // 允许 drop
			e.stopPropagation(); // 阻断原生 dragover 冒泡到祖先 summary（避免路径被覆盖）
			this.$emit('drag-over', this.path, e);
			if (e.dataTransfer) e.dataTransfer.dropEffect = e.ctrlKey ? 'copy' : 'move';
		},
		onDragLeave(e) {
			if (e && e.stopPropagation) e.stopPropagation();
			this.$emit('drag-leave');
		},
		onDrop(e) {
			e.preventDefault();
			e.stopPropagation();
			this.$emit('drop', this.path, e);
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
			dragOverPath: this.dragOverPath,
			onSelect: (t) => this.$emit('select', t),
			onDragOver: (p, e) => this.$emit('drag-over', p, e),
			onDragLeave: () => this.$emit('drag-leave'),
			onDrop: (p, e) => this.$emit('drop', p, e)
		}));
		if (!hasChild) {
			return h('div', { class: ['trow', 'trow-leaf', selectedCls, { 'drag-over': this.isDragOver }], onClick: this.onSelect, onDragover: this.onDragOver, onDragleave: this.onDragLeave, onDrop: this.onDrop, title: this.node.alias && this.node.alias.length ? this.name + '\n别名：' + this.node.alias.join('、') : this.name }, rowInner());
		}
		return h('details', { class: 'tnode', open: this.open, onToggle: this.onToggle }, [
			h('summary', {
				class: ['trow', selectedCls, { 'drag-over': this.isDragOver }],
				onClick: this.onSelect,
				onDragover: this.onDragOver,
				onDragleave: this.onDragLeave,
				onDrop: this.onDrop,
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

			// 临时数据修正（仅内存，不写盘）
			tagEditorVisible: false,
			tagEditorChar: null,   // {char, cp, zhName}：当前待修正字符
			tagEditorTarget: '',   // 编辑对话框选中的目标标签 path
			ops: [],               // 操作记录 [{action, cps, sourcePath, targetPath, char, zhName}]
			dragChar: null,        // 拖拽中的网格条目（数字=单码位，数组=旗序列）
			dragOverPath: '',      // 拖拽悬浮的树节点 path（高亮）

			// 服务器直写（dev_server.py）：编辑可用性与元数据编辑弹窗
			editEnabled: false,          // 服务器可用性（mounted 探测 /symbol-api/health）
			treeVersion: 0,              // 树结构变更计数（改名等非响应式改动后 bump，触发 treeRoots 重算）
			metaEditorVisible: false,    // 元数据编辑弹窗开关
			metaEditorKind: 'tag',       // 'tag' 标签 | 'symbol' 符号
			metaEditorPath: '',          // 标签模式：当前编辑的标签路径
			metaEditorName: '',          // 名字输入
			metaEditorAliases: [],       // 别名输入数组
			metaEditorChar: null,        // 符号模式：当前编辑的字符对象
			metaEditorCpStr: '',         // 符号模式：码位串显示
			metaEditorOldAliases: [],    // 打开弹窗时的旧别名（比对变更用）
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
			return { fontFamily: '"' + this.selectedPreviewFont + '"' }; // 显式选字体：只用该字体渲染，不覆盖则显示豆腐块
		},
		previewFontPt() {
			return Math.round(this.previewFontSize * 12);
		},
		/** 树根重排：语义轴在前，文字系统/官方分类/区块末尾（区块最后） */
		treeRoots() {
			if (!TAGS) return [];
			void this.treeVersion; // TAGS 结构变更（改名）后 bump，强制本计算属性重算
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
		/** 关键词命中的符号（char 完全匹配最前，其余搜中文名/别名/英文名，返回全部命中；旗序列按中英名匹配） */
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
		/** 编辑对话框语义轴标签树（排除三大机械轴）：roots children 字典转 el-tree 数组，节点带完整 path */
		editableTree() {
			if (!TAGS) return [];
			const toNodes = (dict, path) => {
				const arr = [];
				for (const [k, v] of Object.entries(dict)) {
					const n = { name: k, path: path + '/' + k };
					if (v.children && Object.keys(v.children).length) n.children = toNodes(v.children, n.path);
					arr.push(n);
				}
				return arr;
			};
			const out = [];
			for (const [k, v] of Object.entries(TAGS.roots)) {
				if (AXIS_ORDER.includes(k)) continue; // 排除三大机械轴
				const n = { name: k, path: k };
				if (v.children && Object.keys(v.children).length) n.children = toNodes(v.children, k);
				out.push(n);
			}
			return out;
		},
	},
	methods: {
		/** 递归收集节点及所有子孙的 ranges 和 seqs */
		collectNode(node) {
			return collectNodeMembers(node);
		},
		/** 是否 C0/C1 控制码（模板用，委托顶层同名函数） */
		isControlCode(cp) {
			return isControlCode(cp);
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
				mode: this.isDualCp(cp) ? 'dual' : '',
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
		/** 字符格标题：中文名优先，英文名兜底；控制码前置标识 */
		titleOf(cp) {
			const zh = zhNameOf(cp);
			if (zh) return (isControlCode(cp) ? '控制码 ' : '') + zh + '\nU+' + cp.toString(16).toUpperCase();
			const nm = nameOf(cp);
			return 'U+' + cp.toString(16).toUpperCase() + (nm ? '\n' + nm : '');
		},
		/** 搜索网格条目标题：中文名 + 官方名（无官方名时回退 U+ 码点，旗序列双码位）；控制码前置标识 */
		searchTitle(mc) {
			const code = Array.isArray(mc.cp)
				? 'U+' + mc.cp.map(c => c.toString(16).toUpperCase()).join(' ')
				: 'U+' + mc.cp.toString(16).toUpperCase();
			return (isControlCode(mc.cp) ? '控制码 ' : '') + mc.zhName + '\n' + (mc.officialName || code);
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
		/** 单码位是否双模（文本/表情两变体）：权威集合来自 标签.json emoji > emoji-text双模 ranges */
		isDualCp(cp) {
			return DUAL_SET.has(cp);
		},
		/** 网格条目是否为双模字符（文本/表情两种变体），旗序列恒为 false */
		itemDual(item) {
			if (this.isFlag(item)) return false;
			return this.isDualCp(item);
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

		async initFontList() {
			this.fontList = ['Noto Sans Symbols 2', ...FALLBACK_SYMBOL_FONTS];
		},

		/** 加载本机所有字体到切换列表（只改列表，不改渲染栈） */
		async loadLocalFonts() {
			try {
				let raw;
				if (typeof window.queryLocalFonts === 'function') {
					raw = await window.queryLocalFonts();
				} else if (typeof navigator.queryLocalFonts === 'function') {
					raw = await navigator.queryLocalFonts();
				} else {
					ElementPlus.ElMessage.warning('当前浏览器不支持枚举本机字体');
					return;
				}
				const families = [...new Set(raw.map(f => f.family))].sort((a, b) => a.localeCompare(b));
				if (families.length) {
					this.fontList = families;
					ElementPlus.ElMessage.success('已加载 ' + families.length + ' 个本机字体');
				}
			} catch (e) {
				ElementPlus.ElMessage.warning('加载本机字体需要授权，已取消');
			}
		},

		/** 获取字体的 style 对象，用于在选项内预览字符；空字体回退 Noto */
		fontStyle(fontName) {
			if (!fontName) return {};
			return { fontFamily: '"' + fontName + '"' };
		},
		/** 清除选中字体，回归默认字体栈 */
		clearPreviewFont() {
			this.selectedPreviewFont = '';
		},

		// ===== 临时数据修正 =====

		// ----- 拖拽移动/添加（卡片 → 标签树）-----

		/** 卡片拖拽开始：记录条目并允许 copyMove；部分浏览器必须 setData 才允许拖（旗序列取首码位） */
		onDragStart(item, e) {
			this.dragChar = item;
			e.dataTransfer.effectAllowed = 'copyMove';
			e.dataTransfer.setData('text/plain', String(this.isFlag(item) ? item[0] : item));
		},
		/** 拖拽结束（含 drop 之后）：清拖拽状态 */
		onDragEnd() {
			this.dragChar = null;
			this.dragOverPath = '';
		},
		/** 树节点 dragover：允许 drop，按 Ctrl 区分 copy/move，并记录高亮路径 */
		onTreeDragOver(path, e) {
			if (this.dragChar === null) return;
			e.preventDefault();
			if (e.dataTransfer) e.dataTransfer.dropEffect = e.ctrlKey ? 'copy' : 'move';
			this.dragOverPath = path;
		},
		/** 树节点 dragleave：清高亮 */
		onTreeDragLeave() {
			this.dragOverPath = '';
		},
		/** 树节点 drop：构造 tagEditorChar/Target 后复用 opAdd/opMove；机械轴目标拦截；搜索态或 Ctrl=添加 */
		onTreeDrop(path, e) {
			e.preventDefault();
			if (this.dragChar === null) return;
			this.dragOverPath = '';
			if (AXIS_ORDER.includes(path.split('/')[0])) {
				ElementPlus.ElMessage.warning('不能拖到机械轴标签');
				this.dragChar = null;
				return;
			}
			const item = this.dragChar;
			let cp, char, zhName = '';
			if (this.isFlag(item)) {
				cp = item;
				char = String.fromCodePoint(item[0], item[1]);
				const meta = SEQ_INDEX.get(item[0] + '-' + item[1]) || {};
				zhName = meta.zh || '';
			} else {
				cp = item;
				char = String.fromCodePoint(item);
				zhName = zhNameOf(item);
			}
			this.tagEditorChar = { char, cp, zhName };
			this.tagEditorTarget = path;
			if (this.isSearching || e.ctrlKey) this.opAdd();
			else this.opMove();
			this.dragChar = null;
		},

		/** 打开编辑对话框：item 为网格条目（数字=单码位，数组=旗序列） */
		openTagEditor(item) {
			let cp, char, zhName = '';
			if (this.isFlag(item)) {
				cp = item;
				char = String.fromCodePoint(item[0], item[1]);
				const meta = SEQ_INDEX.get(item[0] + '-' + item[1]) || {};
				zhName = meta.zh || '';
			} else {
				cp = item;
				char = String.fromCodePoint(item);
				zhName = zhNameOf(item);
			}
			this.tagEditorChar = { char, cp, zhName };
			this.tagEditorTarget = '';
			this.tagEditorVisible = true;
		},
		/** 编辑对话框树节点点击：记录目标标签 path */
		onTreePickNode(data) {
			this.tagEditorTarget = data.path;
		},
		/** 添加：校验不变（目标空/不存在/已存在）；先写服务器，成功后再应用内存+记录 */
		async opAdd() {
			const tc = this.tagEditorChar;
			const target = this.tagEditorTarget;
			if (!tc) return;
			if (!target) { ElementPlus.ElMessage.warning('请先在左侧树选择目标标签'); return; }
			const dst = nodeAtPath(target);
			if (!dst) {
				ElementPlus.ElMessage.error('目标标签不存在，无法添加');
				return;
			}
			if (nodeAggregatesMember(dst, tc.cp)) { this.tagEditorVisible = false; return; } // 已存在→静默
			try {
				await this.serverSave({ action: 'add', cps: this.toCpsArray(tc.cp), targetPath: target });
			} catch (e) {
				ElementPlus.ElMessage.error('添加失败：' + e.message);
				return;
			}
			const op = { action: 'add', cps: tc.cp, targetPath: target, char: tc.char, zhName: tc.zhName };
			if (this.applyOp(op)) {
				this.ops.push(op);
				this.tagEditorVisible = false;
				ElementPlus.ElMessage.success('已添加');
			}
		},
		/** 移动：源=当前选中标签，目标=树选中；先写服务器，成功后再应用内存+记录 */
		async opMove() {
			const tc = this.tagEditorChar;
			const target = this.tagEditorTarget;
			const src = this.selectedTag;
			if (!tc || !src) return;
			if (!target) { ElementPlus.ElMessage.warning('请先在左侧树选择目标标签'); return; }
			if (target === src.path) { this.tagEditorVisible = false; return; } // 同标签→静默
			if (!nodeAggregatesMember(src.node, tc.cp)) {
				ElementPlus.ElMessage.warning('该字符不在当前标签中，无法移动');
				return;
			}
			const dst = nodeAtPath(target);
			if (!dst) {
				ElementPlus.ElMessage.error('目标标签不存在，无法移动');
				return;
			}
			try {
				await this.serverSave({ action: 'move', cps: this.toCpsArray(tc.cp), sourcePath: src.path, targetPath: target });
			} catch (e) {
				ElementPlus.ElMessage.error('移动失败：' + e.message);
				return;
			}
			const op = { action: 'move', cps: tc.cp, sourcePath: src.path, targetPath: target, char: tc.char, zhName: tc.zhName };
			if (this.applyOp(op)) {
				this.ops.push(op);
				this.tagEditorVisible = false;
				ElementPlus.ElMessage.success('已移动');
			}
		},
		/** 应用操作到内存 TAGS：add→目标加；move→源子树删+目标加；节点缺失则报错不记录 */
		applyOp(op) {
			if (op.action === 'move') {
				const src = nodeAtPath(op.sourcePath);
				const dst = nodeAtPath(op.targetPath);
				if (!src || !dst) {
					ElementPlus.ElMessage.error('移动失败：源或目标标签不存在');
					return false;
				}
				removeFromSubtree(src, op.cps);
				this._applyAddToNode(dst, op.cps);
			} else {
				const dst = nodeAtPath(op.targetPath);
				if (!dst) {
					ElementPlus.ElMessage.error('添加失败：目标标签不存在');
					return false;
				}
				this._applyAddToNode(dst, op.cps);
			}
			this.refreshAfterOp();
			return true;
		},
		/** 把成员加到节点自身（单码位入 ranges，旗序列入 seqs 并补名） */
		_applyAddToNode(node, cp) {
			if (Array.isArray(cp)) {
				const meta = SEQ_INDEX.get(cp[0] + '-' + cp[1]) || {};
				seqsAdd(node, cp, meta.zh, meta.en);
			} else {
				rangesAdd(node, cp);
			}
		},
		/** 重建 FLAT/SEQ_INDEX 并刷新当前网格（保持页码与选中字符；字符已不在聚合内则回退选第一项） */
		refreshAfterOp() {
			rebuildFlat();
			this.treeVersion++; // 触发左树重算（TAGS 非响应式，成员增删后计数/结构需刷新）
			if (!this.selectedTag) return;
			const tag = this.selectedTag;
			const page = this.gridPage;
			const curCp = this.selectedChar ? this.selectedChar.cp : null;
			// 重新赋值 selectedTag 触发 gridItems 重算（TAGS 节点为内存引用，值已变）
			this.selectedTag = null;
			this.selectedTag = tag;
			this.gridPage = Math.min(page, this.gridPageCount); // 网格缩页后钳制页码
			if (curCp !== null) {
				const still = this.gridItems.some(item => this.cellKey(item) === this.cellKey(curCp));
				if (still) this.selectItem(curCp);
				else if (this.gridItems.length) this.selectItem(this.gridItems[0]);
				else this.selectedChar = null;
			}
			if (this.selectedChar) this.selectedChar.tags = tagsOf(this.selectedChar.cp);
			if (this.gridItems.length) this.refreshRenderability(this.gridItems);
		},
		/** 码位十六进制串：单码位 "1F600"，旗序列 "1F1E8-1F1F3" */
		cpsHex(cp) {
			if (Array.isArray(cp)) return cp.map(c => c.toString(16).toUpperCase()).join('-');
			return cp.toString(16).toUpperCase();
		},
		/** 码位显示串（空格分隔，同详情区）：单码位 "1F600"，旗序列 "1F1E8 1F1F3" */
		codeStrOf(cp) {
			if (Array.isArray(cp)) return cp.map(c => c.toString(16).toUpperCase()).join(' ');
			return cp.toString(16).toUpperCase();
		},
		/** 操作记录显示字符 */
		opChar(op) {
			if (Array.isArray(op.cps)) return String.fromCodePoint(op.cps[0], op.cps[1]);
			return String.fromCodePoint(op.cps);
		},
		/** 删除单条操作记录（只移记录不改数据） */
		removeOp(index) {
			this.ops.splice(index, 1);
		},
		/** 清空操作记录 */
		clearOps() {
			this.ops = [];
		},
		/** 复制操作记录为文本，每行一条：添加 <cps hex> <targetPath> / 移动 <cps hex> <sourcePath> <targetPath> */
		async copyOps() {
			if (!this.ops.length) return;
			const lines = this.ops.map(op => {
				const hex = this.cpsHex(op.cps);
				return op.action === 'move'
					? `移动 ${hex} ${op.sourcePath} ${op.targetPath}`
					: `添加 ${hex} ${op.targetPath}`;
			});
			try {
				await navigator.clipboard.writeText(lines.join('\n'));
				ElementPlus.ElMessage.success('已复制 ' + this.ops.length + ' 条操作记录');
			} catch (err) {
				ElementPlus.ElMessage.error('复制失败: ' + err);
			}
		},

		// ===== 元数据编辑（服务器直写）=====

		/** 码位转数组：单码位包一层、旗序列原样（服务器 cps 恒为数组） */
		toCpsArray(cp) {
			return Array.isArray(cp) ? cp : [cp];
		},
		/** 保存到服务器：POST /symbol-api/save；网络错误或服务器返回失败抛异常，成功返回 {ok,message} */
		async serverSave(payload) {
			let r;
			try {
				r = await fetch('/symbol-api/save', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(payload)
				});
			} catch (e) {
				throw new Error('无法连接保存服务器（请先运行 python 符号/dev_server.py）');
			}
			let d;
			try {
				d = await r.json();
			} catch (e) {
				throw new Error('服务器返回异常');
			}
			if (!r.ok || !d.ok) throw new Error(d.message || d.error || '保存失败');
			return d;
		},

		/** 打开标签元数据编辑弹窗：从 selectedTag 取名字/别名初始化 */
		editSelectedTagMeta() {
			const t = this.selectedTag;
			if (!t) return;
			if (this.isFormalAxis(t.path.split('/')[0])) return; // 机械轴按钮已隐藏，双保险
			this.metaEditorKind = 'tag';
			this.metaEditorPath = t.path;
			this.metaEditorName = t.name;
			this.metaEditorAliases = (t.node && t.node.alias && t.node.alias.length) ? [...t.node.alias] : [];
			this.metaEditorOldAliases = [...this.metaEditorAliases];
			this.metaEditorChar = null;
			this.metaEditorVisible = true;
		},
		/** 兄弟节点重名检测：根或父 children 已有同名标签则冲突（newName 等于旧名不算） */
		tagRenameConflict(path, newName) {
			const parts = path.split('/');
			const oldName = parts[parts.length - 1];
			if (newName === oldName) return false;
			const dict = parts.length > 1
				? (nodeAtPath(parts.slice(0, -1).join('/')) || {}).children || {}
				: (TAGS.roots || {});
			return Object.prototype.hasOwnProperty.call(dict, newName);
		},
		/** 保存标签元数据：只把变更字段发服务器（先查兄弟重名）；成功后再改内存 */
		async saveTagMeta() {
			const path = this.metaEditorPath;
			const oldName = path.split('/').pop();
			const newName = (this.metaEditorName || '').trim();
			const aliases = [...new Set(this.metaEditorAliases.map(a => (a || '').trim()).filter(a => a !== ''))];
			const nameChanged = newName !== oldName;
			const aliasChanged = JSON.stringify(aliases) !== JSON.stringify(this.metaEditorOldAliases);
			if (!nameChanged && !aliasChanged) { this.metaEditorVisible = false; return; }
			if (nameChanged) {
				if (!newName) { ElementPlus.ElMessage.error('标签名不能为空'); return; }
				if (newName.includes('/')) { ElementPlus.ElMessage.error('标签名不能包含斜杠 /'); return; }
				if (this.isFormalAxis(path.split('/')[0])) { ElementPlus.ElMessage.error('机械轴标签禁止修改'); return; }
				if (this.tagRenameConflict(path, newName)) { ElementPlus.ElMessage.error('目标标签名已存在：' + newName); return; }
			}
			const payload = { action: 'tag', path };
			if (nameChanged) payload.newName = newName;
			if (aliasChanged) payload.aliases = aliases;
			try {
				await this.serverSave(payload);
			} catch (e) {
				ElementPlus.ElMessage.error('保存失败：' + e.message);
				return;
			}
			// 成功 → 改内存
			const node = nodeAtPath(path);
			if (!node) { ElementPlus.ElMessage.error('标签不存在：' + path); return; }
			let newPath = path;
			if (nameChanged) {
				const parts = path.split('/');
				const lastName = parts[parts.length - 1];
				if (parts.length > 1) {
					const parent = nodeAtPath(parts.slice(0, -1).join('/'));
					if (parent && parent.children && parent.children[lastName]) {
						parent.children[newName] = parent.children[lastName];
						delete parent.children[lastName];
					}
				} else if (TAGS.roots[lastName]) {
					TAGS.roots[newName] = TAGS.roots[lastName];
					delete TAGS.roots[lastName];
				}
				newPath = parts.length > 1 ? parts.slice(0, -1).join('/') + '/' + newName : newName;
			}
			if (aliasChanged) node.alias = aliases;
			rebuildFlat();
			this.treeVersion++;
			const st = this.selectedTag;
			if (st && st.path === path) {
				this.selectedTag = { name: nameChanged ? newName : st.name, node, path: newPath, count: st.count };
			}
			this.$forceUpdate();
			this.metaEditorVisible = false;
			ElementPlus.ElMessage.success('已保存');
		},

		/** 打开符号元数据编辑弹窗：从 selectedChar 取名字/别名初始化 */
		editSelectedSymbol() {
			const sc = this.selectedChar;
			if (!sc) return;
			this.metaEditorKind = 'symbol';
			this.metaEditorChar = sc;
			this.metaEditorName = sc.zhName || '';
			this.metaEditorAliases = (sc.aliases && sc.aliases.length) ? [...sc.aliases] : [];
			this.metaEditorOldAliases = [...this.metaEditorAliases];
			this.metaEditorCpStr = sc.codeStr || this.cpsHex(sc.cp);
			this.metaEditorPath = '';
			this.metaEditorVisible = true;
		},
		/** 保存符号元数据：按路由（SYMBOLS entry / 中文名.json）先写服务器，成功后再改内存 */
		async saveSymbolMeta() {
			const sc = this.metaEditorChar;
			if (!sc) return;
			const isSeq = Array.isArray(sc.cp);
			const oldName = sc.zhName || '';
			const newName = (this.metaEditorName || '').trim();
			const aliases = [...new Set(this.metaEditorAliases.map(a => (a || '').trim()).filter(a => a !== ''))];
			const nameChanged = newName !== oldName;
			const aliasChanged = JSON.stringify(aliases) !== JSON.stringify(this.metaEditorOldAliases);
			if (!nameChanged && !aliasChanged) { this.metaEditorVisible = false; return; }
			if (nameChanged && !newName) { ElementPlus.ElMessage.error('名字不能为空'); return; }
			// 路由决策：
			//   旗序列 / 字符在 SYMBOLS / 需加别名（可同时改名）→ entry 路线（写 符号数据.js）
			//   不在 SYMBOLS 且仅改名 → name 路线（写 中文名.json，只对单码位有意义）
			const inSymbols = !isSeq && SYMBOLS.some(s => s.char === sc.char);
			const useNameRoute = !isSeq && !inSymbols && nameChanged && !aliasChanged;
			const payload = { action: 'sym', cps: this.toCpsArray(sc.cp) };
			// entry 路线需在 serverSave 前改内存 entry（要发出去），失败必须回滚，否则页面与文件不一致
			let entry = null;
			let snapshot = null;
			if (useNameRoute) {
				if (!ZH_NAMES) { ElementPlus.ElMessage.error('中文名数据未加载'); return; }
				payload.name = newName;
			} else {
				entry = SYMBOLS.find(s => s.char === sc.char);
				snapshot = entry ? JSON.parse(JSON.stringify(entry)) : null;
				if (entry) {
					// 改名：改第一个有 name 的 group 的 name；都没有则给第一个 group 补 name
					if (nameChanged) {
						const g = Object.values(entry.groups).find(g => g && g.name) || Object.values(entry.groups)[0];
						if (g) g.name = newName;
						else entry.groups['编辑'] = { name: newName };
					}
					// 改别名：第一个 group 的 alias 数组（清空则删 alias 字段）
					if (aliasChanged) {
						const g2 = Object.values(entry.groups)[0];
						if (g2) {
							if (aliases.length) g2.alias = aliases;
							else delete g2.alias;
						} else {
							entry.groups['编辑'] = { alias: aliases };
						}
					}
				} else {
					// 新建最小条目：组键用字符第一个所属标签名，没有则用「编辑」
					const groupKey = (sc.tags && sc.tags.length && sc.tags[0].name) || '编辑';
					const gg = {};
					if (nameChanged) gg.name = newName;
					if (aliasChanged && aliases.length) gg.alias = aliases;
					entry = { char: sc.char, groups: { [groupKey]: gg } };
					SYMBOLS.push(entry);
				}
				payload.entry = entry;
			}
			try {
				await this.serverSave(payload);
			} catch (e) {
				// 服务器保存失败 → 回滚内存：已有条目还原快照，新建条目从 SYMBOLS 移除
				if (entry) {
					if (snapshot) Object.assign(entry, snapshot);
					else {
						const i = SYMBOLS.indexOf(entry);
						if (i >= 0) SYMBOLS.splice(i, 1);
					}
				}
				ElementPlus.ElMessage.error('保存失败：' + e.message);
				return;
			}
			// 成功 → 改内存
			if (useNameRoute) {
				const cp = sc.cp;
				const arr = ZH_NAMES.names;
				let i = arr.findIndex(p => p[0] === cp);
				if (i >= 0) {
					arr[i][1] = newName;
				} else {
					let lo = 0, hi = arr.length;
					while (lo < hi) {
						const mid = (lo + hi) >> 1;
						if (arr[mid][0] < cp) lo = mid + 1;
						else hi = mid;
					}
					arr.splice(lo, 0, [cp, newName]);
				}
				sc.zhName = newName;
			} else {
				SYMBOL_MAP.clear();
				buildSymbolMap();
				if (nameChanged) sc.zhName = newName;
				if (aliasChanged) sc.aliases = aliases;
			}
			this.$forceUpdate();
			this.metaEditorVisible = false;
			ElementPlus.ElMessage.success('已保存');
		},
		/** 删除别名编辑行 */
		removeMetaAlias(i) {
			this.metaEditorAliases.splice(i, 1);
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
			// 构建双模集合：标签.json 权威（emoji > emoji-text双模 节点 ranges，207 码位）；节点缺失则留空集
			const dualNode = TAGS.roots['emoji']?.children?.['emoji-text双模'];
			if (dualNode && dualNode.ranges) {
				for (const [lo, hi] of dualNode.ranges) {
					for (let cp = lo; cp <= hi; cp++) DUAL_SET.add(cp);
				}
			}
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
		// 服务器直写可用性探测：dev_server.py 启动时编辑可用；失败保持 false（只读浏览不受影响）
		fetch('/symbol-api/health', { cache: 'no-store' })
			.then(r => r.json())
			.then(d => { if (d && d.ok) this.editEnabled = true; })
			.catch(() => {});
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

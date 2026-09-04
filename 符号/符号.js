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
let DUAL_SET = new Set(); // 双模（文本/表情两变体）码位集合：mounted 时从 标签.json 的 emoji（绘文字）> emoji-text双模 ranges 构建（权威集合，207 码位）
const CAP = 100; // 网格每页字符数
const PREVIEW_N = 30; // 概览视图每段预览字符数（网格 10 列 × 3 行）
const AXIS_ORDER = ['文字系统', '官方分类', '区块']; // 三大机械轴，树末尾固定顺序
const SEQ_INDEX = new Map(); // 'cp1-cp2' → { zh, en }：旗序列（双码位）名映射，flatten 时构建
let SEQ_ALIASES = new Map(); // 'cp1-cp2…'（去肤色基础键）→ string[]：序列别名，mounted 时从 序列别名.json 加载

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

/** 从 seqs 条目剥离尾部 zh/en 字符串 → 纯码位数组（旗帜 [cp1,cp2,zh,en] 与 ZWJ [cp1..cpN,zh,en] 同构） */
function seqCps(s) {
	let end = s.length;
	while (end > 0 && typeof s[end - 1] === 'string') end--;
	return s.slice(0, end);
}
/** seqs 条目 → {zh, en}（末尾字符串；纯码位条目返回空串） */
function seqMeta(s) {
	const cps = seqCps(s);
	return { zh: s[cps.length] || '', en: s[cps.length + 1] || '' };
}
/** 码位数组 → 已收录序列的规范码位（容忍 VS16/VS15（FE0F/FE0E）有无；找不到返回 null） */
function resolveSeq(cps) {
	const exact = cps.join('-');
	if (SEQ_INDEX.has(exact)) return cps;
	const noVS = cps.filter(c => c !== 0xFE0F && c !== 0xFE0E).join('-');
	for (const t of FLAT) {
		if (!t.node.seqs) continue;
		for (const s of t.node.seqs) {
			const sc = seqCps(s);
			if (sc.filter(c => c !== 0xFE0F && c !== 0xFE0E).join('-') === noVS) return sc;
		}
	}
	return null;
}
// ---- 变体折叠（v1.13.0）----
/** 肤色修饰符码位（U+1F3FB–1F3FF）：变体折叠的分组依据 */
const SKIN_CPS = new Set([0x1F3FB, 0x1F3FC, 0x1F3FD, 0x1F3FE, 0x1F3FF]);

/** 序列变体分组键：去掉肤色码位后的整串（同款不同肤色同组）；异常条目（嵌套/dict）跳过 */
function variantGroupKey(cps) {
	if (!Array.isArray(cps)) return '';
	if (!cps.every(c => typeof c === 'number')) return '';
	return cps.filter(c => !SKIN_CPS.has(c)).join('-');
}

/** seqs → 变体组：Map<组键, 纯码位数组[]>（组内保持 seqs 原序；嵌套/dict 条目跳过） */
function groupSeqsByBase(seqs) {
	const groups = new Map();
	for (const s of seqs) {
		const cps = seqCps(s);
		if (!Array.isArray(cps) || cps.length === 0) continue;
		if (!cps.every(c => typeof c === 'number')) continue;
		const key = variantGroupKey(cps);
		if (!groups.has(key)) groups.set(key, []);
		groups.get(key).push(cps);
	}
	return groups;
}

/** 组内成员 → 卡片 { main, dots, overflow }：main=无肤色优先（无则第一个），dots=其余全部（原序），overflow=超 8 计数 */
function makeCard(members) {
	if (members.length === 1) return { main: members[0], dots: [], overflow: 0 };
	let main = members.find(cps => !cps.some(c => SKIN_CPS.has(c)));
	if (main === undefined) main = members[0];
	const dots = members.filter(cps => cps !== main);
	return { main, dots, overflow: Math.max(0, dots.length - 8) };
}

/** 网格卡片窗口：单码位逐码位成卡（前），seqs 变体组折叠成卡（后）；取 [start, start+size) 张卡 */
function cardWindow(ranges, seqs, start, size) {
	const singleTotal = rangeCount(ranges);
	const cards = [];
	if (start < singleTotal) {
		for (const cp of enumerateWindow(ranges, start, size)) cards.push({ main: cp, dots: [], overflow: 0 });
	}
	if (cards.length < size) {
		const groups = [...groupSeqsByBase(seqs).values()];
		const seqStart = Math.max(0, start - singleTotal);
		const seqEnd = Math.min(groups.length, seqStart + (size - cards.length));
		for (let i = seqStart; i < seqEnd; i++) cards.push(makeCard(groups[i]));
	}
	return cards;
}

/** 卡片列表 → 平铺成员（主符号 + 全部变体；供渲染能力检测 / 选中检测 / 拖拽） */
function cardsToMembers(cards) {
	const out = [];
	for (const c of cards) {
		out.push(c.main);
		for (const d of c.dots) out.push(d);
	}
	return out;
}

/** 成员 Set 键：单码位=码位数字；序列='s' + 整串码位（字符串，与数字不撞型） */
function memberKey(member) {
	return Array.isArray(member) ? 's' + seqCps(member).join('-') : member;
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

/** 树根重排：语义轴在前，文字系统/官方分类/区块末尾（区块最后） */
function rootEntries() {
	if (!TAGS) return [];
	const entries = Object.entries(TAGS.roots);
	const others = entries.filter(([k]) => !AXIS_ORDER.includes(k));
	const formal = AXIS_ORDER.map(k => [k, TAGS.roots[k]]).filter(([, v]) => v);
	return [...others, ...formal];
}

/** 展平树：收集所有带 ranges/seqs 的节点及纯组节点（有子节点），并构建旗序列名映射 */
function flatten(name, node, path) {
	const hasChildren = !!(node.children && Object.keys(node.children).length > 0);
	if (node.ranges || node.seqs || hasChildren) FLAT.push({ name, node, path, count: (node.ranges ? rangeCount(node.ranges) : 0) + (node.seqs ? node.seqs.length : 0) });
	if (node.seqs) for (const s of node.seqs) SEQ_INDEX.set(seqCps(s).join('-'), seqMeta(s));
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
		SYMBOL_MAP.set(s.char, { names, enames, aliases, mode: s.mode || '', intro: s.intro || '' });
	}
}

/** 所属标签：入参为单码位或序列码位数组（同名同内容合并为一个，多分支 paths 聚合） */
function tagsOf(cp) {
	const byKey = new Map();
	if (Array.isArray(cp)) {
		const seqKey = 'seq:' + cp.join('-');
		for (const t of FLAT) {
			if (!t.node.seqs || !t.node.seqs.some(s => seqCps(s).join('-') === cp.join('-'))) continue;
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

/** 对象内键改名：保持键顺序原地重排（obj[new]=obj[old]; delete obj[old] 会把新键排到末尾） */
function renameKey(obj, oldKey, newKey) {
	if (oldKey === newKey) return;
	const newObj = {};
	for (const k of Object.keys(obj)) newObj[k === oldKey ? newKey : k] = obj[k];
	Object.keys(obj).forEach(k => delete obj[k]);
	Object.assign(obj, newObj);
}

/** 对象内把键与相邻键交换一位（可排序块：传入 formalKeys 时=非机械轴键，否则=全部键）；边界返回 false */
function moveKeyInBlock(dict, key, dir, formalKeys) {
	const keys = Object.keys(dict);
	const block = formalKeys ? keys.filter(k => !formalKeys.includes(k)) : keys;
	const i = block.indexOf(key);
	if (i < 0) return false;
	const j = dir === 'up' ? i - 1 : i + 1;
	if (j < 0 || j >= block.length) return false;
	const a = block[i], b = block[j];
	const newKeys = keys.slice();
	const ai = newKeys.indexOf(a), bi = newKeys.indexOf(b);
	[newKeys[ai], newKeys[bi]] = [newKeys[bi], newKeys[ai]];
	const newObj = {};
	for (const k of newKeys) newObj[k] = dict[k];
	Object.keys(dict).forEach(k => delete dict[k]);
	Object.assign(dict, newObj);
	return true;
}

/** 节点自身是否直接持有某成员（单码位查 ranges，序列查 seqs） */
function nodeHasMember(node, cp) {
	if (Array.isArray(cp)) {
		const key = cp.join('-');
		return !!(node.seqs && node.seqs.some(s => seqCps(s).join('-') === key));
	}
	return !!(node.ranges && inRanges(node.ranges, cp));
}

/** 节点聚合（含子孙）是否已含某成员——与网格显示一致 */
function nodeAggregatesMember(node, cp) {
	const m = collectNodeMembers(node);
	if (Array.isArray(cp)) { const key = cp.join('-'); return m.seqs.some(s => seqCps(s).join('-') === key); }
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

/** 序列加：去重后 push [...seq, zh, en]（原地） */
function seqsAdd(node, seq, zh, en) {
	if (!node.seqs) node.seqs = [];
	const key = seq.join('-');
	if (!node.seqs.some(s => seqCps(s).join('-') === key)) node.seqs.push([...seq, zh || '', en || '']);
}

/** 序列删：按整串码位过滤（原地） */
function seqsRemove(node, seq) {
	if (!node.seqs) return;
	const key = seq.join('-');
	node.seqs = node.seqs.filter(s => seqCps(s).join('-') !== key);
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

/** 从 node 子树删除成员的全部持有（含子孙），返回是否删到至少一处。取消打标用。 */
function removeAllFromSubtree(node, cp) {
	let found = false;
	if (nodeHasMember(node, cp)) {
		if (Array.isArray(cp)) seqsRemove(node, cp);
		else rangesRemove(node, cp);
		found = true;
	}
	for (const c of Object.values(node.children || {})) {
		if (removeAllFromSubtree(c, cp)) found = true;
	}
	return found;
}

/** 重建 FLAT 与 SEQ_INDEX（TAGS 被内存改动后调用；flatten 是增量追加，须先清空） */
function rebuildFlat() {
	FLAT = [];
	SEQ_INDEX.clear();
	for (const [name, node] of rootEntries()) flatten(name, node, name);
}

/** 从 TAGS 移除路径节点（含子树），返回是否成功 */
function removeNodeAtPath(path) {
	const parts = path.split('/');
	if (parts.length > 1) {
		const parent = nodeAtPath(parts.slice(0, -1).join('/'));
		if (parent && parent.children && parent.children[parts[parts.length - 1]]) {
			delete parent.children[parts[parts.length - 1]];
			return true;
		}
	} else if (TAGS && TAGS.roots && TAGS.roots[parts[0]]) {
		delete TAGS.roots[parts[0]];
		return true;
	}
	return false;
}

/** 子树内节点总数（不含自身），用于删除确认提示 */
function countSubtreeNodes(node) {
	const kids = node.children ? Object.values(node.children) : [];
	let n = 0;
	for (const c of kids) n += 1 + countSubtreeNodes(c);
	return n;
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

/** ZWJ 序列连字渲染缓存（'1F9D1-200D-1F430' → 是否连字） */
const SEQ_RENDER_CACHE = new Map();
/** 序列连字检测专用 canvas（400px 宽容纳 3-5 字符，避免溢出截断干扰像素对比） */
const _seqCanvas = (() => { const c = document.createElement('canvas'); c.width = 400; c.height = 100; return c; })();
function _seqData(char) {
	const ctx = _seqCanvas.getContext('2d');
	ctx.clearRect(0, 0, 400, 100);
	ctx.fillStyle = '#000';
	ctx.font = '60px "__nonexistent__", serif';
	ctx.fillText(char, 20, 65);
	return ctx.getImageData(0, 0, 400, 100).data;
}
/** ZWJ 序列是否可渲染：①任一码位单字符豆腐块（系统字体缺失，如 U+1FAEF）→ 不支持；②渲染序列 vs 去 ZWJ 分离形式像素相同（无连字）→ 不支持 */
async function checkSeqRenderable(cps) {
	const key = cps.join('-');
	if (SEQ_RENDER_CACHE.has(key)) return SEQ_RENDER_CACHE.get(key);
	for (const cp of cps) {
		if (cp === 0x200D || cp === 0xFE0F || cp === 0xFE0E) continue; // 零宽连接符/变体选择符不检测
		if (!_strictLocalCan(cp)) { SEQ_RENDER_CACHE.set(key, false); return false; }
	}
	const joined = String.fromCodePoint(...cps);
	const separated = String.fromCodePoint(...cps.filter(c => c !== 0x200D));
	let ok;
	try {
		ok = !_samePixels(_seqData(joined), _seqData(separated));
	} catch (e) { ok = true; }
	SEQ_RENDER_CACHE.set(key, ok);
	return ok;
}

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
	if (inRangesList(ALWAYS_TOFU, cp)) return false;
	if (inRangesList(ALWAYS_RENDERABLE, cp)) {
		// emoji 区（1F000-1FAFF）可能含 Unicode 15/16 新增字符（老系统字体缺失），模板验证兜底
		if (cp >= 0x1F000 && cp <= 0x1FAFF) return _strictLocalCan(cp);
		return true;
	}
	if (!TOFU_TEMPLATE_OK) return true; // 模板无效保守判能渲染
	try {
		return !_samePixels(_emptyStackData(String.fromCodePoint(cp)), TOFU_TEMPLATE);
	} catch (e) { return true; }
}

/** 严格单码位渲染检测（不用白名单乐观假设，豆腐块模板精确判定）——序列成员用 */
function _strictLocalCan(cp) {
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
	emits: ['select', 'drag-over', 'drag-leave', 'drop', 'sort'],
	props: {
		name: { type: String, required: true },
		node: { type: Object, required: true },
		path: { type: String, required: true },
		selectedPath: { type: String, default: '' },
		defaultOpen: { type: Boolean, default: false },
		dragOverPath: { type: String, default: '' },
		version: { type: Number, default: 0 }, // 树结构版本：bump 时 props 变化强制重渲染（TAGS 非响应式，节点对象引用不变时 Vue 会跳过）
		editing: { type: Boolean, default: false } // 编辑模式：显示 ▲▼ 排序按钮
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
		onSummaryClick(e) {
			e.preventDefault(); // 阻止原生 toggle：导航时不要收展
			if (e.target.closest('.ttoggle')) return; // 三角按钮已自行处理
			this.onSelect();
		},
		onToggleBtn(e) {
			e.preventDefault();
			e.stopPropagation(); // 只收展，不导航
			this.open = !this.open;
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
		},
		onSort(e, dir) {
			e.preventDefault();
			e.stopPropagation(); // 只排序，不导航/不选中
			this.$emit('sort', this.path, dir);
		},
	},
	render() {
		const kids = Object.entries(this.node.children || {});
		const hasChild = kids.length > 0;
		const selectedCls = { selected: this.selectedPath === this.path };
		const reorder = this.editing ? [
			h('button', { class: 'treorder treorder-up btn , icon-only', type: 'button', onClick: (e) => this.onSort(e, 'up'), title: '上移' }, '▲'),
			h('button', { class: 'treorder treorder-down btn , icon-only', type: 'button', onClick: (e) => this.onSort(e, 'down'), title: '下移' }, '▼')
		] : [];
		const rowInner = () => [
			h('span', { class: 'tname' }, this.name),
			h('span', { class: 'tcount' }, String(this.count)),
			...reorder
		];
		const children = kids.map(([k, c]) => h(TagTreeNode, {
			key: this.path + '/' + k,
			name: k,
			node: c,
			path: this.path + '/' + k,
			selectedPath: this.selectedPath,
			dragOverPath: this.dragOverPath,
			version: this.version,
			editing: this.editing,
			onSelect: (t) => this.$emit('select', t),
			onSort: (p, dir) => this.$emit('sort', p, dir),
			onDragOver: (p, e) => this.$emit('drag-over', p, e),
			onDragLeave: () => this.$emit('drag-leave'),
			onDrop: (p, e) => this.$emit('drop', p, e)
		}));
		if (!hasChild) {
			return h('div', { class: ['trow', 'trow-leaf', selectedCls, { 'drag-over': this.isDragOver }], onClick: this.onSelect, onDragover: this.onDragOver, onDragleave: this.onDragLeave, onDrop: this.onDrop, title: this.node.alias && this.node.alias.length ? this.name + '\n别名：' + this.node.alias.join('、') : this.name }, [
				h('span', { class: 'ttoggle' }, ''), // 优化18：预留三角标记位置，与有子节点行对齐
				h('div', { class: 'tnav' }, rowInner())
			]);
		}
		return h('details', { class: 'tnode', open: this.open, onToggle: this.onToggle }, [
			h('summary', {
				class: ['trow', selectedCls, { 'drag-over': this.isDragOver }],
				onClick: this.onSummaryClick,
				onDragover: this.onDragOver,
				onDragleave: this.onDragLeave,
				onDrop: this.onDrop,
				title: this.node.alias && this.node.alias.length ? this.name + '\n别名：' + this.node.alias.join('、') : this.name
			}, [
				h('button', { class: 'ttoggle btn , icon-only', type: 'button', onClick: this.onToggleBtn, 'aria-label': this.open ? '折叠' : '展开' }, '▶'),
				h('div', { class: 'tnav' }, rowInner())
			]),
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
			overviewLocalPage: 1, // 概览视图"本级"段页码
			gridOverview: true, // true=概览分段视图（选中非叶子节点）；false=完整网格视图（聚合+分页）
			searchSectionPages: {}, // 搜索分节页码（分节 key → 页码）
			variantOpenKey: null,         // 变体下拉展开的卡片 key（cellKey(card.main)），null=收起
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
			metaEditorKind: 'tag',       // 'tag' 标签 | 'symbol' 符号 | 'root' 新增根
			metaEditorPath: '',          // 标签模式：当前编辑的标签路径
			metaEditorName: '',          // 名字输入
			metaEditorAliases: [],       // 别名输入数组
			metaEditorChar: null,        // 符号模式：当前编辑的字符对象
			metaEditorCpStr: '',         // 符号模式：码位串显示
			metaEditorOldAliases: [],    // 打开弹窗时的旧别名（比对变更用）
			metaEditorIntro: '',      // 编辑弹窗标签简介
			metaEditorOldIntro: '',   // 打开弹窗时的简介（判断是否变更）
			reparentTarget: '',       // 父级归属：选中的目标父 path（''=提升为根）
			metaNewChild: '',            // 标签模式：新增子标签的名字输入
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
		/** 选中序列的组成符号（去掉 ZWJ 连接符/变体选择符）：右侧详情"组成符号"行 */
		zwjComponents() {
			const cps = this.selectedChar && this.selectedChar.cp;
			if (!Array.isArray(cps) || cps.length < 2) return [];
			return cps.filter(c => c !== 0x200D && c !== 0xFE0F).map(c => ({
				cp: c,
				char: String.fromCodePoint(c),
				name: zhNameOf(c) || nameOf(c) || 'U+' + c.toString(16).toUpperCase()
			}));
		},
		symbolStyle() {
			if (!this.selectedPreviewFont) return {}; // 无字体时走 CSS 默认 Noto
			return { fontFamily: '"' + this.selectedPreviewFont + '"' }; // 显式选字体：只用该字体渲染，不覆盖则显示豆腐块
		},
		previewFontPt() {
			return Math.round(this.previewFontSize * 12);
		},
		treeRoots() {
			void this.treeVersion; // TAGS 结构变更（改名）后 bump，强制本计算属性重算
			return rootEntries();
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
		/** 当前选中标签聚合后的卡片总数（单码位逐码位 + seqs 变体组折叠） */
		selectedCount() {
			const m = this.selectedMembers;
			return rangeCount(m.ranges) + groupSeqsByBase(m.seqs).size;
		},
		/** 当前选中标签的网格卡片：按页窗口切片（单码位在前，变体组衔接其后，每页最多 CAP 张卡） */
		gridCards() {
			const m = this.selectedMembers;
			if (!m.ranges.length && !m.seqs.length) return [];
			const start = (this.gridPage - 1) * this.gridPageSize;
			return cardWindow(m.ranges, m.seqs, start, this.gridPageSize);
		},
		/** 当前页卡片的平铺成员（主符号+全部变体；渲染检测/选中检测用，保持 gridItems 语义） */
		gridItems() {
			return cardsToMembers(this.gridCards);
		},
		/** 概览视图的分段：本级 + 各直接子节点（各段 preview=卡片，count=卡片数；本级按卡分页，子段前 PREVIEW_N 张卡） */
		overviewSegments() {
			const node = this.selectedTag && this.selectedTag.node;
			if (!node) return [];
			const segs = [];
			const ownRanges = mergeRanges(node.ranges || []);
			const ownSeqs = node.seqs || [];
			if (ownRanges.length || ownSeqs.length) {
				const total = rangeCount(ownRanges) + groupSeqsByBase(ownSeqs).size;
				const size = this.gridPageSize;
				const start = (this.overviewLocalPage - 1) * size;
				const preview = cardWindow(ownRanges, ownSeqs, start, size);
				segs.push({ name: '本级', path: this.selectedTag.path, node, count: total, preview, page: this.overviewLocalPage, pageCount: Math.max(1, Math.ceil(total / size)), local: true });
			}
			for (const [name, child] of Object.entries(node.children || {})) {
				const m = collectNodeMembers(child);
				if (!m.ranges.length && !m.seqs.length) continue;
				const count = rangeCount(m.ranges) + groupSeqsByBase(m.seqs).size;
				const preview = cardWindow(m.ranges, m.seqs, 0, PREVIEW_N);
				segs.push({ name, path: this.selectedTag.path + '/' + name, node: child, count, preview, hasMore: preview.length < count });
			}
			return segs;
		},
		/** 当前选中标签的总页数 */
		gridPageCount() {
			return Math.max(1, Math.ceil(this.selectedCount / this.gridPageSize));
		},
		/** 搜索词拆分为 token（空白分隔，去空、去重） */
		searchTokens() {
			return [...new Set(this.searchQuery.trim().split(/\s+/).filter(Boolean))];
		},
		/** 每个 token 的搜索结果（标签命中 + 字符集） */
		tokenResults() {
			return this.searchTokens.map(t => this.computeTokenResult(t));
		},
		/** 标签匹配：按 token 分组（仅保留有标签命中的 token） */
		searchTagGroups() {
			return this.tokenResults.filter(r => r.tagHits.length).map(r => ({ token: r.token, tagHits: r.tagHits }));
		},
		/** 多 token 交集（Set<memberKey>）；正向 token 不足 2 个返回 null */
		intersectionKeys() {
			const results = this.tokenResults;
			if (results.length < 2) return null;
			let inter = null;
			for (const r of results) {
				if (!r.memberSet.size) return new Set();
				if (inter === null) inter = new Set(r.memberSet);
				else for (const k of inter) if (!r.memberSet.has(k)) inter.delete(k);
			}
			return inter || new Set();
		},
		/** 交集空提示：指出无匹配的 token */
		intersectionHint() {
			const empty = this.tokenResults.filter(r => !r.memberSet.size).map(r => '「' + r.token + '」');
			const base = '没有同时满足所有关键词的字符';
			return empty.length ? base + '（' + empty.join('、') + ' 无匹配）' : base;
		},
		/** 字符结果分节：第一节=交集（≥2 token 时），其后每 token 一节；每节独立分页、按卡折叠 */
		searchSections() {
			const results = this.tokenResults;
			const sections = [];
			const pageSize = this.gridPageSize;
			const pages = this.searchSectionPages;
			const addSection = (key, title, keys, emptyHint, preferKeys) => {
				const cards = this.searchCardsFromKeys(keys, preferKeys);
				const total = cards.length;
				const page = pages[key] || 1;
				const start = (page - 1) * pageSize;
				sections.push({
					key, title, total, emptyHint, page,
					pageCount: Math.max(1, Math.ceil(total / pageSize)),
					items: cards.slice(start, start + pageSize)
				});
			};
			if (results.length >= 2) addSection('__inter__', '多标签交集', this.intersectionKeys, this.intersectionHint);
			results.forEach((r, i) => addSection('tok' + i, r.token, r.memberSet, '「' + r.token + '」无匹配（标签或字符）', new Set(r.charHits.map(h => memberKey(h.cp)))));
			return sections;
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
		/** 编辑标签的当前父级路径（tag 模式用；根=空串） */
		metaEditorParentPath() {
			const p = this.metaEditorPath;
			if (!p) return '';
			const parts = p.split('/');
			return parts.length > 1 ? parts.slice(0, -1).join('/') : '';
		},
		/** 父级归属选择树：排除自身/子孙/三大机械轴（目标父只能是语义轴节点） */
		reparentTree() {
			if (!TAGS) return [];
			void this.treeVersion;
			const exclude = this.metaEditorPath;
			const skip = (full) => exclude && (full === exclude || full.startsWith(exclude + '/'));
			const walk = (dict, prefix) => {
				const arr = [];
				for (const [k, v] of Object.entries(dict)) {
					const full = prefix ? prefix + '/' + k : k;
					if (skip(full)) continue; // 排除自身/子孙
					const n = { name: k, path: full };
					if (v.children && Object.keys(v.children).length) {
						const kids = walk(v.children, full);
						if (kids.length) n.children = kids;
					}
					arr.push(n);
				}
				return arr;
			};
			const out = [];
			for (const [k, v] of Object.entries(TAGS.roots)) {
				if (AXIS_ORDER.includes(k)) continue; // 机械轴不可作目标父
				if (skip(k)) continue;
				const n = { name: k, path: k };
				if (v.children && Object.keys(v.children).length) {
					const kids = walk(v.children, k);
					if (kids.length) n.children = kids;
				}
				out.push(n);
			}
			return out;
		},
	},
	methods: {
		/** memberKey 集 → 搜索卡片：单码位逐码位 + seqs 按肤色分组折叠；main=搜索命中变体优先（preferKeys），无则无肤色优先，再无则第一个 */
		searchCardsFromKeys(keys, preferKeys) {
			const singles = [];
			const groups = new Map();
			for (const k of keys) {
				if (typeof k === 'number') { singles.push(k); continue; }
				const cps = k.slice(1).split('-').map(Number);
				const gk = variantGroupKey(cps);
				if (!groups.has(gk)) groups.set(gk, []);
				groups.get(gk).push(cps);
			}
			const cards = singles.map(cp => ({ main: cp, dots: [], overflow: 0 }));
			for (const members of groups.values()) {
				if (members.length === 1) { cards.push({ main: members[0], dots: [], overflow: 0 }); continue; }
				let main;
				if (preferKeys && preferKeys.size) {
					main = members.find(cps => preferKeys.has('s' + cps.join('-')));
				}
				if (main === undefined) main = members.find(cps => !cps.some(c => SKIN_CPS.has(c)));
				if (main === undefined) main = members[0];
				const dots = members.filter(cps => cps !== main);
				cards.push({ main, dots, overflow: Math.max(0, dots.length - 8) });
			}
			return cards;
		},
		/** 递归收集节点及所有子孙的 ranges 和 seqs */
		collectNode(node) {
			return collectNodeMembers(node);
		},
		/** 是否 C0/C1 控制码（模板用，委托顶层同名函数） */
		isControlCode(cp) {
			return isControlCode(cp);
		},
		/** 选中标签：重置到第一页；非叶子→概览分段视图，叶子→完整网格；自动选中首条（保持预览有内容） */
		selectTag(tag) {
			this.gridPage = 1;
			this.overviewLocalPage = 1;
			this.selectedTag = tag;
			const node = tag.node;
			this.gridOverview = !!(node.children && Object.keys(node.children).length > 0); // 非叶子→概览
			const first = this.viewFirstItem();
			if (first != null) {
				this.selectItem(first);
				this.refreshRenderability(this.viewItems());
			}
		},
		/** 当前视图全部成员（概览=各段卡片平铺；完整=当前页卡片平铺；渲染检测/自动选中用） */
		viewItems() {
			if (this.gridOverview) return cardsToMembers(this.overviewSegments.flatMap(s => s.preview));
			return this.gridItems;
		},
		/** 当前视图首条成员（自动选中用；概览取首段首卡 main） */
		viewFirstItem() {
			if (this.gridOverview) {
				const s = this.overviewSegments[0];
				return (s && s.preview.length) ? s.preview[0].main : null;
			}
			return this.gridItems.length ? this.gridItems[0] : null;
		},
		/** 段"查看更多"：选中该子标签（自动判定叶子/非叶子） */
		viewSegment(seg) {
			this.selectTag({ name: seg.name, node: seg.node, path: seg.path });
		},
		/** 展开/收起变体下拉：key 为卡片主符号 cellKey，再点同卡收起 */
		toggleVariantMenu(card) {
			const key = this.cellKey(card.main);
			this.variantOpenKey = this.variantOpenKey === key ? null : key;
		},
		/** 点击变体下拉外部关闭（mounted 注册 document 监听） */
		onVariantDocClick(e) {
			if (!e.target.closest('.variant-btn, .variant-drop')) this.variantOpenKey = null;
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
		/** 概览本级段翻页：更新页码并刷新渲染能力 */
		onOverviewLocalPageChange(page) {
			this.overviewLocalPage = page;
			const seg = this.overviewSegments.find(s => s.local);
			if (seg && seg.preview.length) this.refreshRenderability(cardsToMembers(seg.preview));
		},
		/** 搜索分节翻页：更新该节页码并刷新渲染能力 */
		onSearchSectionPageChange(key, page) {
			this.searchSectionPages[key] = page;
			const sec = this.searchSections.find(s => s.key === key);
			if (sec && sec.items.length) this.refreshRenderability(cardsToMembers(sec.items));
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
				intro: meta ? (meta.intro || '') : '',
				officialName: nameOf(cp),
				tags: tagsOf(cp),
				codeStr: cp.toString(16).toUpperCase(),
				htmlEntity: '&#' + cp + ';'
			};
			// 详情替代显示检测：旗序列跳过；异步结果回来时用 JSON.stringify 比对防竞态
			this.detailTofu = false;
			if (!Array.isArray(cp) && !this.isDualCp(cp)) {
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
			if (Array.isArray(cp) || this.isDualCp(cp)) { this.detailAdvice = ''; return; } // 旗序列/双模不做建议（双模顶部用 emoji 变体，不依赖 Noto）
			if (!notoHas(cp)) { this.detailAdvice = ''; return; }      // Noto 不含：本机有则 v1 不提示，都无则替代显示已提示
			const localOk = await checkLocalRenderable(cp);
			if (this.selectedChar && JSON.stringify(this.selectedChar.cp) === JSON.stringify(cp)) {
				this.detailAdvice = localOk ? '' : '此字符需 Noto Sans Symbols 2 字体，装它才能在别处显示';
			}
		},
		/** 选中序列（任意长度码位数组）：查 SEQ_INDEX 取名，tags 按整串匹配 */
		selectFlag(seq) {
			const cps = seqCps(seq);
			const meta = SEQ_INDEX.get(cps.join('-')) || {};
			this.selectedChar = {
				cp: cps,
				char: String.fromCodePoint(...cps),
				zhName: meta.zh || '',
				officialName: meta.en || '',
				mode: '',
				aliases: SEQ_ALIASES.get(variantGroupKey(cps)) || [],
				tags: tagsOf(cps),
				codeStr: cps.map(c => c.toString(16).toUpperCase()).join(' '),
				htmlEntity: cps.map(c => '&#' + c + ';').join('')
			};
			// ZWJ 序列检测连字（不连字的详情提示）；旗帜（非 ZWJ）恒可渲染
			this.detailTofu = false;
			this.detailAdvice = '';
			if (cps.includes(0x200D)) {
				checkSeqRenderable(cps).then(ok => {
					if (this.selectedChar && JSON.stringify(this.selectedChar.cp) === JSON.stringify(cps)) this.detailTofu = !ok;
				});
			}
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
		/** 关键词命中的标签（name/path/intro/alias 子串匹配，最多 100；含简介命中，用于"标签匹配"导航列表） */
		matchTagsForToken(token) {
			const q = token.toLowerCase();
			const out = [];
			for (const t of FLAT) {
				if (t.name.toLowerCase().includes(q) || t.path.toLowerCase().includes(q) || (t.node.intro && t.node.intro.toLowerCase().includes(q)) || (t.node.alias && t.node.alias.some(a => a.toLowerCase().includes(q)))) {
					out.push(t);
					if (out.length >= 100) break;
				}
			}
			return out;
		},
		/** 关键词强命中的标签（仅 name/path/alias 子串匹配，不含 intro，最多 100；用于成员物化，避免简介提词拉进整桶） */
		matchTagsStrong(token) {
			const q = token.toLowerCase();
			const out = [];
			for (const t of FLAT) {
				if (t.name.toLowerCase().includes(q) || t.path.toLowerCase().includes(q) || (t.node.alias && t.node.alias.some(a => a.toLowerCase().includes(q)))) {
					out.push(t);
					if (out.length >= 100) break;
				}
			}
			return out;
		},
		/** 一组标签的成员并集 → Set<memberKey>（ranges 物化为码位，seqs 物化为 'sX-Y' 键） */
		memberSetOfTags(tags) {
			const set = new Set();
			for (const t of tags) {
				const m = collectNodeMembers(t.node);
				for (const [lo, hi] of m.ranges) for (let cp = lo; cp <= hi; cp++) set.add(cp);
				for (const s of m.seqs) set.add(memberKey(s));
			}
			return set;
		},
		/** 关键词命中的符号：逻辑与旧 matchedChars 一致，抽成 per-token（码点/单字符/名匹配/中文名/旗序列） */
		matchCharsForToken(token) {
			const q = token.toLowerCase();
			const out = [];
			const seen = new Set();
			const cpq = parseCodePointQuery(q);
			if (cpq) {
				const cp = cpq.cp;
				out.push({ char: String.fromCodePoint(cp), cp, zhName: zhNameOf(cp), officialName: nameOf(cp) });
				seen.add(cp);
			}
			const single = Array.from(token);
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
			if (ZH_NAMES) {
				for (const [cp, zh] of ZH_NAMES.names) {
					if (seen.has(cp)) continue;
					if (zh.toLowerCase().includes(q)) {
						seen.add(cp);
						out.push({ char: String.fromCodePoint(cp), cp, zhName: zh, officialName: nameOf(cp) });
					}
				}
			}
			for (const t of FLAT) {
				if (!t.node.seqs) continue;
				for (const s of t.node.seqs) {
					const cps = seqCps(s);
					const meta = seqMeta(s);
					const aliases = SEQ_ALIASES.get(variantGroupKey(cps)) || [];
					if (!String(meta.zh).toLowerCase().includes(q) && !String(meta.en).toLowerCase().includes(q) && !aliases.some(a => a.toLowerCase().includes(q))) continue;
					const key = 'seq:' + cps.join('-');
					if (seen.has(key)) continue;
					seen.add(key);
					out.push({ char: String.fromCodePoint(...cps), cp: cps, zhName: meta.zh, officialName: meta.en });
				}
			}
			// token 本身是已收录序列（直接输入 👨⚕️ 等）：中心栏直接出结果
			const resolved = resolveSeq([...token].map(c => c.codePointAt(0)));
			if (resolved) {
				const meta = SEQ_INDEX.get(resolved.join('-')) || {};
				const k = 'seq:' + resolved.join('-');
				if (!seen.has(k)) {
					seen.add(k);
					out.push({ char: String.fromCodePoint(...resolved), cp: resolved, zhName: meta.zh || '', officialName: meta.en || '' });
				}
			}
			return out;
		},
		/** 单个 token 结果：标签成员 ∪ 字符名匹配（两条匹配通道独立，标签命中不压制字符名搜索；成员集只物化强命中标签，简介命中仅进导航列表） */
		computeTokenResult(token) {
			const tagHits = this.matchTagsForToken(token);
			const charHits = this.matchCharsForToken(token);
			const memberSet = this.memberSetOfTags(this.matchTagsStrong(token));
			for (const hit of charHits) memberSet.add(memberKey(hit.cp));
			return { token, tagHits, charHits, memberSet };
		},
		/** memberKey → 网格条目对象 {char, cp, zhName, officialName}（供分节网格渲染） */
		mcFromKey(key) {
			if (typeof key === 'number') {
				return { char: String.fromCodePoint(key), cp: key, zhName: zhNameOf(key), officialName: nameOf(key) };
			}
			const cps = key.slice(1).split('-').map(Number);
			const meta = SEQ_INDEX.get(cps.join('-')) || {};
			return { char: String.fromCodePoint(...cps), cp: cps, zhName: meta.zh || '', officialName: meta.en || '' };
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
		/** 网格条目渲染文本（嵌套数组=异常数据时安全返回空） */
		cellText(item) {
			if (Array.isArray(item) && item.length > 0 && Array.isArray(item[0])) return '';
			return this.isFlag(item) ? String.fromCodePoint(...item) : String.fromCodePoint(item);
		},
		/** 双模变体渲染文本：text=追加VS15(U+FE0E)强制文本呈现，emoji=追加VS16(U+FE0F)强制表情呈现
		 *  （font-variant-emoji: emoji 在 Chrome 对文本默认类字符不生效，须用变体选择符可靠呈现） */
		variantText(char, type) {
			return char + (type === 'text' ? '︎' : '️');
		},
		/** 渲染态：true=能渲染, false=当前字体不支持, null=检测中（占位，不显示豆腐块） */
		renderState(item) {
			if (this.isFlag(item)) {
				if (!item.includes(0x200D)) return true; // 非 ZWJ 序列（旗帜等）恒可渲染
				const v = SEQ_RENDER_CACHE.get(item.join('-'));
				return v === undefined ? null : v;
			}
			const v = FULL_CACHE.get(this.cellText(item));
			return v === undefined ? null : v;
		},
		/** 对条目列表批量发起可渲染性检测（仅未缓存单码位），完成后重渲染 */
		async refreshRenderability(items) {
			const seqs = [];
			const singles = [];
			for (const it of items) {
				if (this.isFlag(it)) {
					if (it.includes(0x200D) && !SEQ_RENDER_CACHE.has(it.join('-'))) seqs.push(it);
					continue;
				}
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
			for (let i = 0; i < seqs.length; i += 50) {
				const batch = seqs.slice(i, i + 50);
				await Promise.all(batch.map(it => checkSeqRenderable(it)));
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
				const meta = SEQ_INDEX.get(item.join('-')) || {};
				return (meta.zh || '') + '\n' + (meta.en || '');
			}
			return this.titleOf(item);
		},
		/** 网格卡片显示名：单码位中文名优先英文名兜底；序列中/英文名 */
		gridItemName(item) {
			if (this.isFlag(item)) {
				const meta = SEQ_INDEX.get(item.join('-')) || {};
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
				return Array.isArray(this.selectedChar.cp) && this.selectedChar.cp.join('-') === item.join('-');
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

		/** 卡片拖拽开始：记录条目（折叠卡记整组成员列表）；部分浏览器必须 setData 才允许拖（旗序列取首码位） */
		onDragStart(item, e) {
			if (item && item.main !== undefined) {
				this.dragChar = { group: [item.main, ...item.dots] };
				const main = item.main;
				e.dataTransfer.effectAllowed = 'copyMove';
				e.dataTransfer.setData('text/plain', String(this.isFlag(main) ? main[0] : main));
				return;
			}
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
			if (item && item.group) {
				const members = item.group;
				const main = members[0];
				let char = '', zhName = '';
				if (this.isFlag(main)) {
					char = String.fromCodePoint(...main);
					const meta = SEQ_INDEX.get(main.join('-')) || {};
					zhName = meta.zh || '';
				} else {
					char = String.fromCodePoint(main);
					zhName = zhNameOf(main);
				}
				this.tagEditorChar = { char, cp: main, zhName, members };
				this.tagEditorTarget = path;
				if (this.isSearching || e.ctrlKey) this.opAdd();
				else this.opMove();
				this.dragChar = null;
				return;
			}
			let cp, char, zhName = '';
			if (this.isFlag(item)) {
				cp = item;
				char = String.fromCodePoint(...item);
				const meta = SEQ_INDEX.get(item.join('-')) || {};
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

		/** 打开编辑对话框：item 为网格条目（数字=单码位，数组=旗序列）或折叠卡对象 {main, dots} */
		openTagEditor(item) {
			if (item && item.main !== undefined) {
				const main = item.main;
				let char, zhName = '';
				if (this.isFlag(main)) {
					char = String.fromCodePoint(...main);
					const meta = SEQ_INDEX.get(main.join('-')) || {};
					zhName = meta.zh || '';
				} else {
					char = String.fromCodePoint(main);
					zhName = zhNameOf(main);
				}
				this.tagEditorChar = { char, cp: main, zhName, members: [main, ...item.dots] };
				this.tagEditorTarget = '';
				this.tagEditorVisible = true;
				return;
			}
			let cp, char, zhName = '';
			if (this.isFlag(item)) {
				cp = item;
				char = String.fromCodePoint(...item);
				const meta = SEQ_INDEX.get(item.join('-')) || {};
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
		/** 网格条目直接取消打标：移出当前选中标签 */
		async removeFromGrid(item) {
			let cp, char, zhName = '';
			if (this.isFlag(item)) {
				cp = item;
				char = String.fromCodePoint(...item);
				const meta = SEQ_INDEX.get(item.join('-')) || {};
				zhName = meta.zh || '';
			} else {
				cp = item;
				char = String.fromCodePoint(item);
				zhName = zhNameOf(item);
			}
			this.tagEditorChar = { char, cp, zhName };
			await this.opRemove();
		},
		/** 该标签是否允许取消打标：任一分支属机械轴则禁改（按钮已隐藏，双保险） */
		canUntagTag(g) {
			return !g.paths.some(p => this.isFormalAxis(p.split('/')[0]));
		},
		/** 详情区标签取消打标：只删该标签自身直接持有，不级联子标签（同名多分支各自移除） */
		async removeFromTag(g) {
			const cp = this.selectedChar && this.selectedChar.cp;
			if (cp === null || cp === undefined) return;
			const isFlag = Array.isArray(cp);
			const char = isFlag ? String.fromCodePoint(...cp) : String.fromCodePoint(cp);
			const zhName = isFlag ? ((SEQ_INDEX.get(cp.join('-')) || {}).zh || '') : zhNameOf(cp);
			this.tagEditorChar = { char, cp, zhName };
			const paths = g.paths.filter(path => {
				const src = nodeAtPath(path);
				return src && nodeHasMember(src, cp);
			});
			if (!paths.length) {
				ElementPlus.ElMessage.warning('该字符不在标签中');
				return;
			}
			for (const path of paths) {
				try {
					await this.serverSave({ action: 'remove', cps: this.toCpsArray(cp), sourcePath: path, scope: 'node' });
				} catch (e) {
					ElementPlus.ElMessage.error('取消打标失败：' + e.message);
					return;
				}
				const op = { action: 'remove', cps: cp, sourcePath: path, targetPath: '', char, zhName, scope: 'node' };
				if (this.applyOp(op)) this.ops.push(op);
			}
			ElementPlus.ElMessage.success('已取消打标');
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
			const members = tc.members || [tc.cp];
			// 已全部存在→静默
			if (members.every(m => nodeAggregatesMember(dst, m))) { this.tagEditorVisible = false; return; }
			try {
				const payload = { action: 'add', targetPath: target };
				if (tc.members && tc.members.length > 1) {
					payload.cps = members.map(m => {
						const obj = { cps: this.toCpsArray(m) };
						if (Array.isArray(m)) {
							const meta = SEQ_INDEX.get(m.join('-')) || {};
							obj.zh = meta.zh || '';
							obj.en = meta.en || '';
						}
						return obj;
					});
				} else {
					payload.cps = this.toCpsArray(members[0]);
					if (Array.isArray(members[0])) {
						const meta = SEQ_INDEX.get(members[0].join('-')) || {};
						payload.zh = meta.zh || '';
						payload.en = meta.en || '';
					}
				}
				await this.serverSave(payload);
			} catch (e) {
				ElementPlus.ElMessage.error('添加失败：' + e.message);
				return;
			}
			const op = { action: 'add', cps: tc.members && tc.members.length > 1 ? members : tc.cp, targetPath: target, char: tc.char, zhName: tc.zhName };
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
			const members = tc.members || [tc.cp];
			if (!members.every(m => nodeAggregatesMember(src.node, m))) {
				ElementPlus.ElMessage.warning('有成员不在当前标签中，无法移动');
				return;
			}
			const dst = nodeAtPath(target);
			if (!dst) {
				ElementPlus.ElMessage.error('目标标签不存在，无法移动');
				return;
			}
			try {
				const payload = { action: 'move', sourcePath: src.path, targetPath: target };
				if (tc.members && tc.members.length > 1) {
					payload.cps = members.map(m => {
						const obj = { cps: this.toCpsArray(m) };
						if (Array.isArray(m)) {
							const meta = SEQ_INDEX.get(m.join('-')) || {};
							obj.zh = meta.zh || '';
							obj.en = meta.en || '';
						}
						return obj;
					});
				} else {
					payload.cps = this.toCpsArray(members[0]);
					if (Array.isArray(members[0])) {
						const meta = SEQ_INDEX.get(members[0].join('-')) || {};
						payload.zh = meta.zh || '';
						payload.en = meta.en || '';
					}
				}
				await this.serverSave(payload);
			} catch (e) {
				ElementPlus.ElMessage.error('移动失败：' + e.message);
				return;
			}
			const op = { action: 'move', cps: tc.members && tc.members.length > 1 ? members : tc.cp, sourcePath: src.path, targetPath: target, char: tc.char, zhName: tc.zhName };
			if (this.applyOp(op)) {
				this.ops.push(op);
				this.tagEditorVisible = false;
				ElementPlus.ElMessage.success('已移动');
			}
		},
		/** 取消打标：把字符从当前选中标签子树全部移除；先写服务器，成功后再改内存+记录 */
		async opRemove() {
			const src = this.selectedTag;
			const tc = this.tagEditorChar;
			if (!src || !tc) return;
			const members = tc.members || [tc.cp];
			if (!members.every(m => nodeAggregatesMember(src.node, m))) {
				ElementPlus.ElMessage.warning('有成员不在当前标签中');
				return;
			}
			try {
				await this.serverSave({ action: 'remove', cps: members.map(m => this.toCpsArray(m)), sourcePath: src.path });
			} catch (e) {
				ElementPlus.ElMessage.error('取消打标失败：' + e.message);
				return;
			}
			const op = { action: 'remove', cps: tc.members && tc.members.length > 1 ? members : tc.cp, sourcePath: src.path, targetPath: '', char: tc.char, zhName: tc.zhName };
			if (this.applyOp(op)) {
				this.ops.push(op);
				this.tagEditorVisible = false;
				ElementPlus.ElMessage.success('已取消打标');
			}
		},
		/** 应用操作到内存 TAGS：add→目标加；move→源子树删+目标加；节点缺失则报错不记录；op.cps 支持成员列表 */
		applyOp(op) {
			const isGroup = Array.isArray(op.cps) && op.cps.length > 0 && Array.isArray(op.cps[0]);
			const members = isGroup ? op.cps : [op.cps];
			if (op.action === 'remove') {
				const src = nodeAtPath(op.sourcePath);
				if (!src) {
					ElementPlus.ElMessage.error('取消打标失败：标签不存在');
					return false;
				}
				if (op.scope === 'node') {
					for (const m of members) {
						const ok = nodeHasMember(src, m);
						if (!ok) { ElementPlus.ElMessage.error('该字符不在标签中'); return false; }
						if (Array.isArray(m)) seqsRemove(src, m);
						else rangesRemove(src, m);
					}
				} else {
					for (const m of members) {
						const ok = removeAllFromSubtree(src, m);
						if (!ok) { ElementPlus.ElMessage.error('该字符不在标签中'); return false; }
					}
				}
			} else if (op.action === 'move') {
				const src = nodeAtPath(op.sourcePath);
				const dst = nodeAtPath(op.targetPath);
				if (!src || !dst) {
					ElementPlus.ElMessage.error('移动失败：源或目标标签不存在');
					return false;
				}
				for (const m of members) {
					removeFromSubtree(src, m);
					this._applyAddToNode(dst, m);
				}
			} else {
				const dst = nodeAtPath(op.targetPath);
				if (!dst) {
					ElementPlus.ElMessage.error('添加失败：目标标签不存在');
					return false;
				}
				for (const m of members) this._applyAddToNode(dst, m);
			}
			this.refreshAfterOp();
			return true;
		},
		/** 把成员加到节点自身（单码位入 ranges，旗序列入 seqs 并补名） */
		_applyAddToNode(node, cp) {
			if (Array.isArray(cp)) {
				const meta = SEQ_INDEX.get(cp.join('-')) || {};
				seqsAdd(node, cp, meta.zh, meta.en);
			} else {
				rangesAdd(node, cp);
			}
		},
		/** 重建 FLAT/SEQ_INDEX 并刷新当前网格（保持页码与选中字符；字符已不在聚合内则回退选第一项） */
		refreshAfterOp() {
			rebuildFlat();
			this.treeVersion++; // 触发左树重算（TAGS 非响应式，成员增删后计数/结构需刷新）
			if (this.selectedChar) this.selectedChar.tags = tagsOf(this.selectedChar.cp);
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
		/** 码位十六进制串：单码位 "1F600"，旗序列 "1F1E8-1F1F3"；成员列表取第一个（主符号） */
		cpsHex(cp) {
			if (Array.isArray(cp) && cp.length > 0 && Array.isArray(cp[0])) cp = cp[0];
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
			const cps = (Array.isArray(op.cps) && op.cps.length > 0 && Array.isArray(op.cps[0])) ? op.cps[0] : op.cps;
			if (Array.isArray(cps)) return String.fromCodePoint(...cps);
			return String.fromCodePoint(cps);
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
			this.metaEditorIntro = (t.node && t.node.intro) ? t.node.intro : '';
			this.metaEditorOldIntro = this.metaEditorIntro;
			this.metaEditorChar = null;
			this.reparentTarget = '';
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
			const intro = (this.metaEditorIntro || '').trim();
			const introChanged = intro !== this.metaEditorOldIntro;
			if (!nameChanged && !aliasChanged && !introChanged) { this.metaEditorVisible = false; return; }
			if (nameChanged) {
				if (!newName) { ElementPlus.ElMessage.error('标签名不能为空'); return; }
				if (newName.includes('/')) { ElementPlus.ElMessage.error('标签名不能包含斜杠 /'); return; }
				if (this.isFormalAxis(path.split('/')[0])) { ElementPlus.ElMessage.error('机械轴标签禁止修改'); return; }
				if (this.tagRenameConflict(path, newName)) { ElementPlus.ElMessage.error('目标标签名已存在：' + newName); return; }
			}
			const payload = { action: 'tag', path };
			if (nameChanged) payload.newName = newName;
			if (aliasChanged) payload.aliases = aliases;
			if (introChanged) payload.intro = intro;
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
						renameKey(parent.children, lastName, newName);
					}
				} else if (TAGS.roots[lastName]) {
					renameKey(TAGS.roots, lastName, newName);
				}
				newPath = parts.length > 1 ? parts.slice(0, -1).join('/') + '/' + newName : newName;
			}
			if (aliasChanged) node.alias = aliases;
			if (introChanged) {
				if (intro) node.intro = intro;
				else delete node.intro;
			}
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
			this.metaEditorIntro = sc.intro || ''; this.metaEditorOldIntro = this.metaEditorIntro; this.reparentTarget = '';
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
			const intro = (this.metaEditorIntro || '').trim();
			const introChanged = intro !== this.metaEditorOldIntro;
			if (!nameChanged && !aliasChanged && !introChanged) { this.metaEditorVisible = false; return; }
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
					if (introChanged) {
						if (intro) entry.intro = intro;
						else delete entry.intro;
					}
				} else {
					// 新建最小条目：组键用字符第一个所属标签名，没有则用「编辑」
					const groupKey = (sc.tags && sc.tags.length && sc.tags[0].name) || '编辑';
					const gg = {};
					if (nameChanged) gg.name = newName;
					if (aliasChanged && aliases.length) gg.alias = aliases;
					entry = { char: sc.char, groups: { [groupKey]: gg } };
					if (introChanged && intro) entry.intro = intro;
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
				if (introChanged) sc.intro = intro;
			}
			this.$forceUpdate();
			this.metaEditorVisible = false;
			ElementPlus.ElMessage.success('已保存');
		},
		/** 删除别名编辑行 */
		removeMetaAlias(i) {
			this.metaEditorAliases.splice(i, 1);
		},
		/** 父级归属树节点点击：记录目标父 path */
		onReparentPick(data) {
			this.reparentTarget = data.path;
		},
		/** 调整父级归属：promote=true 提升为根，否则移动到 reparentTarget 下；服务器直写成功后再改内存 */
		async saveTagReparent(promote) {
			const path = this.metaEditorPath;
			if (!path) return;
			const parts = path.split('/');
			const name = parts[parts.length - 1];
			const oldParent = parts.length > 1 ? parts.slice(0, -1).join('/') : '';
			const target = promote ? '' : this.reparentTarget;
			if (!promote && !target) { ElementPlus.ElMessage.warning('请先选择目标父级'); return; }
			if (target === oldParent) { ElementPlus.ElMessage.info('标签已在该父级下'); return; }
			if (target) {
				if (target === path) { ElementPlus.ElMessage.error('不能移动到自身'); return; }
				if (target.startsWith(path + '/')) { ElementPlus.ElMessage.error('不能移动到自身子级'); return; }
				const dst = nodeAtPath(target);
				if (!dst) { ElementPlus.ElMessage.error('目标父标签不存在'); return; }
				if (dst.children && dst.children[name]) { ElementPlus.ElMessage.error('目标父下已有同名标签：' + name); return; }
			} else if (TAGS.roots[name]) {
				ElementPlus.ElMessage.error('根级已有同名标签：' + name);
				return;
			}
			try {
				await this.serverSave({ action: 'tag-reparent', path, targetPath: target });
			} catch (e) { ElementPlus.ElMessage.error('移动失败：' + e.message); return; }
			// 成功 → 改内存：先取节点引用，再摘除挂载
			const node = nodeAtPath(path);
			if (parts.length > 1) {
				const p = nodeAtPath(oldParent);
				if (p && p.children) delete p.children[name];
			} else {
				delete TAGS.roots[name];
			}
			const newPath = target ? target + '/' + name : name;
			if (target) {
				const dst = nodeAtPath(target);
				if (!dst.children) dst.children = {};
				dst.children[name] = node;
			} else {
				TAGS.roots[name] = node;
			}
			rebuildFlat();
			this.treeVersion++;
			this.reparentTarget = '';
			const st = this.selectedTag;
			if (st && st.path === path) this.selectedTag = { ...st, path: newPath };
			this.metaEditorPath = newPath;
			this.$forceUpdate();
			ElementPlus.ElMessage.success('已移动');
		},

		// ===== 新增/删除标签树节点（服务器直写）=====

		/** 打开「新增根标签」弹窗（root 模式：名字 + 可选别名） */
		openNewRoot() {
			this.metaEditorKind = 'root';
			this.metaEditorPath = '';
			this.metaEditorName = '';
			this.metaEditorAliases = [];
			this.metaEditorOldAliases = [];
			this.metaEditorIntro = '';
			this.metaEditorOldIntro = '';
			this.reparentTarget = '';
			this.metaNewChild = '';
			this.metaEditorVisible = true;
		},
		/** 按弹窗模式分发保存：root→新增根；tag→改标签名/别名；symbol→改符号名/别名 */
		async saveMetaEditor() {
			if (this.metaEditorKind === 'root') await this.saveRootMeta();
			else if (this.metaEditorKind === 'tag') await this.saveTagMeta();
			else await this.saveSymbolMeta();
		},
		/** 新增语义根：服务器 tag-new parentPath=''，成功后再改内存 */
		async saveRootMeta() {
			const name = (this.metaEditorName || '').trim();
			const aliases = [...new Set(this.metaEditorAliases.map(a => (a || '').trim()).filter(a => a !== ''))];
			if (!name) { ElementPlus.ElMessage.error('根标签名不能为空'); return; }
			if (name.includes('/')) { ElementPlus.ElMessage.error('根标签名不能包含斜杠 /'); return; }
			if (TAGS.roots && TAGS.roots[name]) { ElementPlus.ElMessage.error('根标签名已存在：' + name); return; }
			try {
				await this.serverSave({ action: 'tag-new', parentPath: '', name, aliases: aliases.length ? aliases : undefined });
			} catch (e) { ElementPlus.ElMessage.error('新增失败：' + e.message); return; }
			TAGS.roots[name] = { children: {} };
			if (aliases.length) TAGS.roots[name].alias = aliases;
			rebuildFlat();
			this.treeVersion++;
			this.metaEditorVisible = false;
			this.$forceUpdate();
			ElementPlus.ElMessage.success('已新增根标签');
		},
		/** 新增子标签：服务器 tag-new parentPath=当前编辑标签路径，成功后再改内存 */
		async addChildTag() {
			const name = (this.metaNewChild || '').trim();
			if (!name) { ElementPlus.ElMessage.warning('请输入子标签名'); return; }
			if (name.includes('/')) { ElementPlus.ElMessage.error('子标签名不能包含斜杠 /'); return; }
			const parent = this.metaEditorPath;
			const pnode = nodeAtPath(parent);
			if (!pnode) { ElementPlus.ElMessage.error('父标签不存在'); return; }
			if (pnode.children && pnode.children[name]) { ElementPlus.ElMessage.error('标签名已存在：' + name); return; }
			try {
				await this.serverSave({ action: 'tag-new', parentPath: parent, name });
			} catch (e) { ElementPlus.ElMessage.error('新增失败：' + e.message); return; }
			if (!pnode.children) pnode.children = {};
			pnode.children[name] = { children: {} };
			rebuildFlat();
			this.treeVersion++;
			this.metaNewChild = '';
			this.$forceUpdate();
			ElementPlus.ElMessage.success('已新增子标签');
		},
		/** 删除当前编辑标签（含子树）：先确认影响，再服务器直写 */
		async deleteTagConfirm() {
			const path = this.metaEditorPath;
			const node = nodeAtPath(path);
			if (!node) return;
			const name = this.metaEditorName || path.split('/').pop();
			const m = collectNodeMembers(node);
			const chars = rangeCount(m.ranges) + m.seqs.length;
			const kids = countSubtreeNodes(node);
			const detail = [];
			if (chars) detail.push(chars + ' 个字符的归属');
			if (kids) detail.push(kids + ' 个子标签');
			const msg = '删除「' + name + '」将移除' + (detail.length ? ' ' + detail.join(' 和 ') : '（空标签）')
				+ '。\n这些字符若仅在此标签下将变为未打标。此操作不可撤销，确认删除？';
			try {
				await ElementPlus.ElMessageBox.confirm(msg, '确认删除标签', { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' });
			} catch (e) { return; } // 用户取消
			try {
				await this.serverSave({ action: 'tag-del', path });
			} catch (e) { ElementPlus.ElMessage.error('删除失败：' + e.message); return; }
			removeNodeAtPath(path);
			rebuildFlat();
			this.treeVersion++;
			this.metaEditorVisible = false;
			if (this.selectedTag && this.selectedTag.path === path) {
				this.selectedTag = null;
				this.selectedChar = null;
			}
			this.$forceUpdate();
			ElementPlus.ElMessage.success('已删除');
		},

		/** 调节标签顺序：服务器 tag-sort 直写，成功后再改内存（根级只在非机械轴块内移动） */
		async onTreeSort(path, dir) {
			const parts = path.split('/');
			const key = parts[parts.length - 1];
			const isRoot = parts.length === 1;
			const dict = isRoot ? TAGS.roots : ((nodeAtPath(parts.slice(0, -1).join('/')) || {}).children || {});
			if (!dict || !Object.prototype.hasOwnProperty.call(dict, key)) return;
			try {
				await this.serverSave({ action: 'tag-sort', path, dir });
			} catch (e) {
				ElementPlus.ElMessage.error('排序失败：' + e.message);
				return;
			}
			if (!moveKeyInBlock(dict, key, dir, isRoot ? AXIS_ORDER : null)) {
				ElementPlus.ElMessage.info(dir === 'up' ? '已在最前' : '已在最后');
				return;
			}
			rebuildFlat();
			this.treeVersion++;
			this.$forceUpdate();
		},
	},
	async mounted() {
		document.addEventListener('click', this.onVariantDocClick);
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
			// 构建双模集合：标签.json 权威（emoji（绘文字）> emoji-text双模 节点 ranges，207 码位）；节点缺失则留空集
			const dualNode = TAGS.roots['emoji（绘文字）']?.children?.['emoji-text双模'];
			if (dualNode && dualNode.ranges) {
				for (const [lo, hi] of dualNode.ranges) {
					for (let cp = lo; cp <= hi; cp++) DUAL_SET.add(cp);
				}
			}
			for (const [name, node] of rootEntries()) flatten(name, node, name);
			buildSymbolMap();
			this.loading = false;
			// 豆腐块模板须在首次 selectTag（触发 refreshRenderability 检测）之前生成，
			// 否则模板未就绪时白名单外全判能渲染并缓存，后续不复检
			initTofuTemplate();
			// 默认标签：整个标签树展示序的第一个元素（语义轴在前，当前为「人」）
			const firstRoot = this.treeRoots[0];
			if (firstRoot) this.selectTag({ name: firstRoot[0], node: firstRoot[1], path: firstRoot[0] });
			// 序列别名（异步加载，失败静默；详情/搜索按需查 SEQ_ALIASES）
			fetch('序列别名.json').then(r => r.json()).then(d => { SEQ_ALIASES = new Map(Object.entries(d)); }).catch(() => {});
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
	unmounted() {
		document.removeEventListener('click', this.onVariantDocClick);
	},
	watch: {
		searchQuery(nv) {
			this.searchSectionPages = {}; // 新搜索 → 所有分节回到第 1 页
			const s = nv.trim();
			if (s === '') return;
			const arr = Array.from(s);
			if (arr.length === 1) {
				const cp = arr[0].codePointAt(0);
				if (cp !== undefined && cp !== null) this.selectChar(cp);
			}
			if (arr.length >= 2) {
				const cps = arr.map(x => x.codePointAt(0));
				const resolved = resolveSeq(cps);
				if (resolved) this.selectFlag(resolved);
			}
			// unicode 码 / HTML 转义：解析到码点直接选中详情，与输入单字符一致
			const cpq = parseCodePointQuery(s);
			if (cpq) this.selectChar(cpq.cp);
		},
		// 搜索关键词变化 → 预检测渲染能力（未检测字符置占位，不闪豆腐块）
		searchTokens(nv) {
			const sec = this.searchSections;
			for (const s of sec) if (s.items.length) this.refreshRenderability(cardsToMembers(s.items));
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

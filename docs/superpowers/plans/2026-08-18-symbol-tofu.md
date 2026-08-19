# 符号页豆腐块检测与字体信息 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 符号页检测"当前字体不支持"的字符（不再显示豆腐块），替代显示置灰码点；详情区给出跨设备字体建议。

**Architecture:** ① fontTools 离线生成 `noto-cmap.json`（Noto 覆盖区间）；② 运行时**豆腐块模板比对**——用空栈渲染私有区生成"当前环境 .notdef 豆腐块"模板，字符空栈渲染后逐像素比对（相同=系统默认画豆腐块=不支持，不同=真实字形=能渲染），配正/反向白名单跳过 canvas；③ 渲染栈动态化（Noto + 本机字体 + 兜底）经 CSS 变量注入，**检测用空栈（不含 Noto），判"本机能否渲染"**，与显示栈解耦。

**Tech Stack:** Python fontTools（工具链，一次性 pip install）、Vue 3 global build、原生 canvas API。

## Global Constraints

- 不创建 package.json / node_modules，不引入 npm 包（CLAUDE.md）——工具链用 Python，与现有 8 个 `build_*.py` 一致
- 不修改 `lib/` 下任何文件（第三方代码）
- 检测方法：**豆腐块模板比对**（空栈渲染 vs 私有区模板，逐像素比对）+ 正/反向白名单。**弃用**宽度法（汉字/☺ 同宽不可判定）、FontFace API（Chrome `fonts.load/check` 不做字形检查）
- 反向白名单只放"肯定豆腐块"（私有区/未分配码位）；西夏文等"大概率没有"的走模板比对
- 旗序列（双码位 emoji）不做替代显示（系统 emoji 字体渲染，默认能渲染）
- 模板无效（多私有区渲染不一致）→ 禁用检测，保守全判能渲染
- 复制/所属标签/搜索功能不受影响（复制的是字符本体）
- **无 commit 步骤**：按项目约定（CLAUDE.md 阶段5），所有改动在用户验收通过后统一 git commit
- 测试服务器必须从项目根 `d:\工具兽\静态页面工具` 起（页面引用 `../lib/`）；端口优先 52330/52331

---

### Task 1: build_noto_cmap.py 生成 noto-cmap.json

**Files:**
- Create: `符号/build_noto_cmap.py`
- Create: `符号/noto-cmap.json`（脚本生成物）

**Interfaces:**
- Consumes: `lib/fonts/NotoSansSymbols2-Regular.ttf`（已有）
- Produces: `noto-cmap.json`，结构 `{_v: 1, count: N, ranges: [[lo,hi],...]}`（ranges 为升序、相邻合并的码位区间）

- [x] **已完成**（实现者验证通过：count 2955，213 区间，区间升序合并正确，未动 lib/）

---

### Task 2: 符号.js 检测核心（豆腐块模板比对 + 双向白名单）

**Files:**
- Modify: `符号/符号.js`（字体区段 L168-218 附近，含上一轮 FontFace 实现，整段替换）

**Interfaces:**
- Consumes: `FALLBACK_SYMBOL_FONTS`（已有，L171-189）
- Produces:
  - `TOFU_NOTO`（noto-cmap.json 区间）、`TOFU_TEMPLATE`/`TOFU_TEMPLATE_OK`（豆腐块模板）
  - `ALWAYS_RENDERABLE`（正向白名单）、`ALWAYS_TOFU`（反向白名单）
  - `FULL_CACHE`/`LOCAL_CACHE`（缓存 Map）
  - `inRangesList(ranges, cp)` → bool（升序区间二分）
  - `notoHas(cp)` → bool（Noto 是否含此码位）
  - `initTofuTemplate()` → 同步生成豆腐块模板（多私有区一致性校验）
  - `checkRenderable(cp)` → Promise\<bool>（完整渲染能力：Noto 或 本机；目的1 用）
  - `checkLocalRenderable(cp)` → Promise\<bool>（本机渲染能力，不含 Noto；目的2 用）
  - `setFontStacks(families)`（已有实现保留，更新 CSS 变量 `--sym-font-stack`）

- [ ] **Step 1: 替换字体区段**

保留现有的 `buildFontStack`、`setFontStacks`（上一轮已实现）。删除上一轮 FontFace 版的 `TOFU_NOTO`（重建）、`ALWAYS_RENDERABLE`（替换为双向白名单）、`RENDERABLE_CACHE`、`LOCAL_FACES`、`inRangesList`、`notoHas`、`isAlwaysRenderable`、`registerLocalFonts`、`checkRenderable`，整体替换为：

```js
/** noto-cmap.json：Noto 覆盖的码位区间（升序、相邻合并） */
let TOFU_NOTO = null;
/** 豆腐块模板像素（空栈渲染私有区所得）及其有效性 */
let TOFU_TEMPLATE = null;
let TOFU_TEMPLATE_OK = false;
/** 模板候选私有区（任何系统字体都不含 → 必画 .notdef） */
const TOFU_CANDIDATES = [0xE000, 0xF8FF, 0x10FFFD];

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
```

- [ ] **Step 2: mounted 接入**（L695-723）

`this.initFontList()` 之前保留 `setFontStacks(FALLBACK_SYMBOL_FONTS);`，其后加 `initTofuTemplate();`。Promise.all 中追加：

```js
fetch('noto-cmap.json').then(r => r.json()).then(d => { TOFU_NOTO = d; }).catch(() => {});
```

- [ ] **Step 3: 语法验证 + 浏览器断言**

启动服务器（项目根，端口 52330/52331 优先）。DevTools Console：

```js
initTofuTemplate();  // 已由 mounted 调用，可重复调用
await checkRenderable(0x4e2d)   // 汉字"中"：白名单 → true
await checkRenderable(0x263a)   // ☺：白名单(2600-26FF) → true
await checkRenderable(0xe000)   // 私有区：反白名单 → false
await checkRenderable(0x17000)  // 西夏文：模板比对 → false（系统无西夏字体）
await checkRenderable(0x12000)  // 楔形文字：模板比对 → true（系统有 Segoe UI Historic）
await checkLocalRenderable(0x263a)  // 本机能否渲染 ☺ → true
```
Expected: `中` true、`☺` true、`0xe000` false、`0x17000` false、`0x12000` true、local ☺ true。无 JS 错误。

---

### Task 3: 网格卡片替代显示

**Files:**
- Modify: `符号/符号.css:271-280`（.char-symbol 字体栈 + 新增 tofu 样式）
- Modify: `符号/符号.html:103-112, 121-131`（网格卡片模板）
- Modify: `符号/符号.js`（methods：renderable/tofuText；selectTag/翻页触发预计算）

**Interfaces:**
- Consumes: `checkRenderable`、`FULL_CACHE`（Task 2）
- Produces:
  - `renderable(item)` → bool（同步查缓存；旗序列/未检测恒 true）
  - `tofuText(item)` → string（`U+XXXX`，旗序列空格分隔）
  - `refreshRenderability(items)` → 对未缓存单码位批量 async 检测，完成后重渲染
  - `.char-symbol.tofu` 样式（置灰码点）

- [ ] **Step 1: CSS 变量 + 置灰样式**

符号.css 顶部（@font-face 之后）加：

```css
:root {
	/* JS 启动时经 setProperty 注入，此为兜底默认值 */
	--sym-font-stack: "Noto Sans Symbols 2", "Segoe UI Symbol", sans-serif;
}
```

`.char-grid .char .char-symbol`（L274）的 `font-family: 'Noto Sans Symbols 2',sans-serif;` 改为 `font-family: var(--sym-font-stack);`。其后加：

```css
.char-grid .char .char-symbol.tofu {
	font-size: 13px;
	color: #bbb;
	font-family: Consolas, 'Courier New', monospace;
}
```

- [ ] **Step 2: JS 方法**（methods 内加）

```js
/** 网格条目能否渲染：旗序列恒 true；单码位查 FULL_CACHE（未检测/能渲染 → true） */
renderable(item) {
	if (this.isFlag(item)) return true;
	const v = FULL_CACHE.get(this.cellText(item));
	return v !== false;
},
/** 替代显示的置灰码点文本 */
tofuText(item) {
	if (this.isFlag(item)) return 'U+' + item.map(c => c.toString(16).toUpperCase()).join(' ');
	return 'U+' + item.toString(16).toUpperCase();
},
/** 对条目列表批量发起可渲染性检测（仅未缓存单码位），完成后重渲染 */
refreshRenderability(items) {
	const singles = [];
	for (const it of items) {
		if (this.isFlag(it)) continue;
		const cp = it;
		if (FULL_CACHE.has(this.cellText(it))) continue;
		singles.push(cp);
	}
	return Promise.all(singles.map(cp => checkRenderable(cp))).then(() => this.$forceUpdate());
},
```

- [ ] **Step 3: 选中标签/翻页时触发预计算**（selectTag L465-469、onGridPageChange L471-478、onSearchPageChange L480-482 内调用）

```js
if (this.gridItems.length) this.refreshRenderability(this.gridItems);
```
（selectTag 与 onGridPageChange 中，页码更新后加；搜索视图在 onSearchPageChange 中对 `searchChars` 调用。）

- [ ] **Step 4: 网格卡片模板分支**（符号.html L122-129 标签网格；L103-110 搜索网格）

**标签网格**（`v-for="item in gridItems"`，原 `.char-symbol` 块替换）：

```html
<span class="char-symbol" :class="{ tofu: !renderable(item) }">
	<template v-if="renderable(item)">
		<template v-if="itemDual(item)">
			<span class="variant text vs-text" @click.stop="copyGridVariant(item, 'text')">{{ cellText(item) }}</span>
			<span class="variant emoji" @click.stop="copyGridVariant(item, 'emoji')">{{ cellText(item) }}</span>
		</template>
		<template v-else>{{ cellText(item) }}</template>
	</template>
	<span v-else class="tofu-code">{{ tofuText(item) }}</span>
</span>
```

**搜索网格**（`v-for="mc in searchChars"`，变量 `mc`，字符参数一律 `mc.cp`）：

```html
<span class="char-symbol" :class="{ tofu: !renderable(mc.cp) }">
	<template v-if="renderable(mc.cp)">
		<template v-if="itemDual(mc.cp)">
			<span class="variant text vs-text" @click.stop="copyGridVariant(mc.cp, 'text')">{{ cellText(mc.cp) }}</span>
			<span class="variant emoji" @click.stop="copyGridVariant(mc.cp, 'emoji')">{{ cellText(mc.cp) }}</span>
		</template>
		<template v-else>{{ cellText(mc.cp) }}</template>
	</template>
	<span v-else class="tofu-code">{{ tofuText(mc.cp) }}</span>
</span>
```

- [ ] **Step 5: 浏览器验证**

启动服务器打开页面，选含白名单外字符的标签（如"区块"轴的西夏文/楔形文字）：检测完成后，西夏文等系统无字体的字符显示置灰 `U+XXXX`；楔形文字（Historic 能渲染）、汉字、常见符号正常显示字符。翻页触发新页检测。

---

### Task 4: 详情/效果预览替代显示 + 提示条

**Files:**
- Modify: `符号/符号.html:143-187`（详情大预览、效果预览）
- Modify: `符号/符号.css:339-388`（.symbol-preview 区，新增 tofu 样式）
- Modify: `符号/符号.js`（selectChar/selectFlag 触发详情检测；data 加 detailTofu）

**Interfaces:**
- Consumes: `checkRenderable`（Task 2）
- Produces:
  - `detailTofu` data → bool（选中字符是否渲染不出，异步检测结果）
  - `.tofu-tip` 提示条样式、`.symbol-preview .tofu-code` 样式

- [ ] **Step 1: data 加字段**（data L294-310 附近）

```js
detailTofu: false,
```

- [ ] **Step 2: selectChar/selectFlag 触发详情检测**（L497-529 内，选中赋值后加）

```js
this.detailTofu = false;
if (!Array.isArray(cp)) {
	checkRenderable(cp).then(ok => {
		if (this.selectedChar && JSON.stringify(this.selectedChar.cp) === JSON.stringify(cp)) this.detailTofu = !ok;
	});
}
```

- [ ] **Step 3: 详情大预览分支**（符号.html L145 `.char-preview`）

```html
<div class="char-preview">
	<span v-if="selectedChar && !detailTofu" class="symbol-char" :style="fontStyle(selectedPreviewFont)">{{ selectedChar.char }}</span>
	<span v-else-if="selectedChar" class="symbol-char tofu-code">{{ tofuText(selectedChar.cp) }}</span>
	<span v-else class="symbol-char placeholder-char">？</span>
</div>
```

- [ ] **Step 4: 详情提示条**（名字行 `class="name"` 之后，L146 后插入）

```html
<div v-if="selectedChar && detailTofu" class="tofu-tip">当前字体不支持</div>
```

- [ ] **Step 5: 效果预览分支**（符号.html L171-186 整个 `<template v-if="selectedChar">…</template><div v-else>？</div>` 区块）

替换为（dual 分支 L172-179 原样保留；单码位分支按 detailTofu 分两态）：

```html
<template v-if="selectedChar">
	<div v-if="selectedChar.mode === 'dual'">
		<div class="align-row" :style="previewStyle">
			<span class="txt">gxhAyO<span class="align-sym variant text vs-text" :style="symbolStyle" @click.stop="copyVariant('text')" title="复制文本风格">{{ selectedChar.char }}</span>gxhAyO</span>
		</div>
		<div class="align-row" :style="previewStyle">
			<span class="txt">gxhAyO<span class="align-sym variant emoji" :style="symbolStyle" @click.stop="copyVariant('emoji')" title="复制表情风格">{{ selectedChar.char }}</span>gxhAyO</span>
		</div>
	</div>
	<template v-else-if="!detailTofu">
		<div class="align-row" :style="previewStyle">
			<span class="txt">gxhAyO<span class="align-sym" :style="symbolStyle">{{ selectedChar.char }}</span>gxhAyO</span>
		</div>
	</template>
	<template v-else>
		<div class="align-row" :style="previewStyle">
			<span class="txt">gxhAyO<span class="align-sym tofu-code">{{ tofuText(selectedChar.cp) }}</span>gxhAyO</span>
		</div>
	</template>
</template>
<div v-else class="align-row" :style="previewStyle">
	<span class="txt">gxhAyO<span class="align-sym placeholder-char">？</span>gxhAyO</span>
</div>
```

注意：dual 字符（emoji）一般能渲染，不做替代显示，dual 分支原样保留。

- [ ] **Step 6: CSS**（.symbol-preview 区内加）

```css
& .tofu-code {
	font-family: Consolas, 'Courier New', monospace;
	color: #bbb;
}
& .tofu-tip {
	margin-top: 4px;
	font-size: 12px;
	color: #e6a23c;
}
```

- [ ] **Step 7: 浏览器验证**

选中西夏文（系统无字体）：大预览显示置灰 `U+XXXX`，名字行下方出现黄色「当前字体不支持」；效果预览区对应位置显示置灰码点；楔形文字/汉字/常见字符不受影响。

---

### Task 5: 动态渲染栈（queryLocalFonts 授权接入显示栈）

**Files:**
- Modify: `符号/符号.js:684-693`（initFontList/fontStyle）
- Modify: `符号/符号.html:200-210`（字体选择器，加授权触发）

**Interfaces:**
- Consumes: `setFontStacks`（Task 2 保留）
- Produces:
  - `fontPermDone` data（防重复授权）
  - `requestFontPerm()` 方法 → 授权后枚举本机字体、更新显示栈 + 字体列表
  - 字体选择器容器 `@click` 触发授权（在用户手势内）

**说明**：检测（豆腐块模板比对）用空栈，与字体列表无关，故授权后**无需重测**；queryLocalFonts 只更新显示渲染栈（CSS 变量）和字体选择器列表。

- [ ] **Step 1: data 加字段**（L307-310 附近）

```js
fontPermDone: false,
```

- [ ] **Step 2: 方法**（initFontList 之后加）

```js
/** 字体选择器区域用户交互时申请 queryLocalFonts 授权：更新显示渲染栈 + 字体列表 */
async requestFontPerm() {
	if (this.fontPermDone) return;
	this.fontPermDone = true;
	try {
		if ('queryLocalFonts' in navigator) {
			const raw = await navigator.queryLocalFonts();
			const families = [...new Set(raw.map(f => f.family))].sort((a, b) => a.localeCompare(b));
			if (families.length) {
				setFontStacks(families);
				this.fontList = families;
			}
		}
	} catch (e) {
		// 用户拒绝授权或 API 不可用 → 保持当前（静态降级）栈，静默
	}
},
```

- [ ] **Step 3: 模板加授权触发**（符号.html L201 `.font-selector` 容器）

```html
<div class="font-selector" @click="requestFontPerm">
```

- [ ] **Step 4: 浏览器验证**

打开页面，点击右侧「字体切换」区域任一字体项：
- 第一次点击触发浏览器权限框（Chrome），授权后字体列表变为本机全部字体
- 授权后 CSS 变量 `--sym-font-stack` 更新（控制台 `getComputedStyle(document.documentElement).getPropertyValue('--sym-font-stack')` 含本机字体）
- 刷新后再点不弹权限框（Chrome 记住授权）

---

### Task 6: 目的2 四象限提示（详情区）

**Files:**
- Modify: `符号/符号.js`（detailAdvice 计算 + data 字段）
- Modify: `符号/符号.html:146`（提示条区域，追加四象限建议）

**Interfaces:**
- Consumes: `notoHas`、`checkLocalRenderable`（Task 2）
- Produces:
  - `detailAdvice` data → string（跨设备建议，无则空串）
  - `refreshDetailAdvice(cp)` 方法 → async 计算四象限

- [ ] **Step 1: data 加字段**

```js
detailAdvice: '',
```

- [ ] **Step 2: 方法**（methods 内加）

```js
/** 详情区四象限建议：Noto 含 + 本机不含 → 提示装 Noto */
async refreshDetailAdvice(cp) {
	if (Array.isArray(cp)) { this.detailAdvice = ''; return; } // 旗序列不做建议
	if (!notoHas(cp)) { this.detailAdvice = ''; return; }      // Noto 不含：本机有则 v1 不提示，都无则替代显示已提示
	const localOk = await checkLocalRenderable(cp);
	this.detailAdvice = localOk ? '' : '此字符需 Noto Sans Symbols 2 字体，装它才能在别处显示';
},
```

- [ ] **Step 3: selectChar 触发建议计算**（Task 4 Step 2 已加的检测旁）

```js
this.detailAdvice = '';
this.refreshDetailAdvice(cp);
```

- [ ] **Step 4: 模板追加建议**（符号.html L146 的提示条之后，Task 4 已加的 `tofu-tip` 下方）

```html
<div v-if="selectedChar && detailAdvice" class="tofu-tip">{{ detailAdvice }}</div>
```

- [ ] **Step 5: 浏览器验证**

选一个 Noto 覆盖但本机没有的符号（如部分 U+1F000 段符号，Noto Sans Symbols 2 覆盖而本机无）：详情区出现黄色「此字符需 Noto Sans Symbols 2 字体…」建议。选常见 emoji/本机有的字符：无建议。

---

## Self-Review

**Spec 覆盖：**
- 豆腐块模板比对（空栈 vs 私有区模板，逐像素）→ Task 2
- 正/反向白名单（Noto + 系统必含 / 私有区+未分配）→ Task 2
- 模板一致性校验（多私有区）→ Task 2 initTofuTemplate
- 显示栈动态化（CSS 变量）→ Task 2 setFontStacks + Task 3 :root + Task 5
- 网格/详情/效果预览替代显示 + 提示条 → Task 3/4
- 旗序列不做替代 → Task 3 renderable
- 目的2 四象限（notoHas + checkLocalRenderable）→ Task 6
- 授权时机（字体选择器交互）→ Task 5
- 模板无效保守全判能渲染 → Task 2 `_localCan`
- 未分配码位反白名单 → Task 2 ALWAYS_TOFU（含 100000-10FFFD）

**占位符扫描：** 无 TBD/TODO；所有步骤含实际代码。

**类型一致性：**
- `checkRenderable(cp)`（Task 2，Promise）Task 3/4 调用一致
- `checkLocalRenderable(cp)`（Task 2）Task 6 调用一致
- `notoHas(cp)`（Task 2）Task 6 调用一致
- `setFontStacks(families)`（Task 2 保留）Task 5 调用一致
- `tofuText(item)` Task 3 定义，Task 4 用 `tofuText(selectedChar.cp)`（cp 为数字或数组，与 item 形态一致）
- `initTofuTemplate()` Task 2 定义，mounted 调用
- FULL_CACHE/LOCAL_CACHE 由 Task 2 定义，Task 3 读 FULL_CACHE
- 已删除 FontFace/宽度法相关（`LOCAL_FACES`/`RENDERABLE_CACHE`/`registerLocalFonts`/旧 `checkRenderable`）在 Task 3-6 不再引用

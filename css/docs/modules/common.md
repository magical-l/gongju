---
title: common.css 模块
covers_file: [css/common.css]
depends_on: [css-architecture]
api_signature: CSS 类（.btn、.icon、.hidden、.invisible、.scrollable 等）和 CSS 变量（--bg-*、--text-*、--btn-* 等）
last_updated: 2026-07-24
why_exists: common.css 是 CSS 库的核心文件，提供全局 reset、Design Tokens、通用组件样式
---

## 设计意图

common.css 的目标是**一个文件覆盖通用需求**：从最基础的浏览器默认值修正，到 Design Tokens 变量系统，再到按钮、图标、表单、弹出层等开箱即用的组件。使用者 `<link>` 加载后即可使用 `.btn.primary`、`.icon` 等类。

### 文件结构分区

文件按 CSS 逻辑分层组织，每层以 `/* ================== 分区标题 ================== */` 分隔：

1. **理所当然** — 全局 reset（`box-sizing: border-box`、`html`/`body` 默认值、滚动条美化）
2. **对外** — 元素在页面中的位置和可见性（`.hidden`、`.invisible`、`.sticky`、`.fullscreen`、`.resizable`）
3. **自身呈现** — 元素形状和背景（`.shape.square`、`.shape.circle`、`.background.*`）
4. **对内约束** — 元素内部布局和滚动（`.list`、`.scrollable`、`.animation.spin`）
5. **内容** — 文本排版、图像、图标系统
6. **交互** — 按钮、按钮组（`.btn`、`.btn-group`、`label.btn`）、表单、编辑控件
7. **复合组件** — 弹出层定位、模态框
8. **选择** — `:root` 上的所有默认值变量

## Design Tokens

### 颜色

| 变量 | 默认值 | 用途 |
|------|--------|------|
| `--body-bg` | #F5F5F5 | 页面背景 |
| `--bg-muted` | #f3f4f6 | 次要背景，按钮默认 |
| `--bg-active` | #e5e7eb | 激活态背景 |
| `--bg-subtle` | #f9fafb | 极弱背景 |
| `--bg-base` | #ffffff | 白色基础 |
| `--text-primary` | #111827 | 主要文字 |
| `--text-secondary` | #374151 | 次要文字 |
| `--text-muted` | #6b7280 | 弱化文字 |
| `--accent-primary` | #5b8def | 强调色 |
| `--primary` | var(--accent-primary) | 语义"主要" |
| `--danger` | #dc2626 | 语义"危险" |
| `--success` | #059669 | 语义"成功" |
| `--warning` | #d97706 | 语义"警告" |

### 尺寸

| 变量 | 默认值 | 用途 |
|------|--------|------|
| `--space-1` ~ `--space-8` | 4px ~ 32px | 间距系统 |
| `--radius-sm/md/lg/xl` | 4/6/8/12px | 圆角系统 |
| `--btn-h` | 32px | 按钮高度 |
| `--btn-p` | 4px | 按钮内边距 |
| `--circle-size` | 24px | 圆形对象尺寸 |
| `--square-size` | 24px | 方形对象尺寸 |
| `--icon-min/max-width/height` | 12/36px | 图标极限尺寸 |

### 阴影

| 变量 | 默认值 |
|------|--------|
| `--shadow-sm` | 0 1px 2px rgba(0,0,0,0.05) |
| `--shadow-md` | 0 1px 3px/2px rgba |
| `--shadow-lg` | 0 4px 6px/2px rgba |
| `--shadow-xl` | 0 20px 40px rgba(0,0,0,0.15) |

## 图标系统

图标系统通过 CSS 变量 `--icon-char` 驱动，`<i class="icon char-style status ok"></i>` 即可显示默认的 ✓ 图标。

### 工作原理

1. `.icon` 提供尺寸约束（`width`/`height`/`inline-flex` 居中）
2. `.char-style` 通过 `::before` 伪元素显示 `--icon-char` 字符
3. 状态类（`.ok` `.error` `.warning` 等）为 `--icon-char` 赋值
4. `.emoji` 类全局将字符变体从 text 切到 emoji

### 图标目录

| 状态类 | 默认字符（text） | Emoji 版本 |
|--------|-------------------|------------|
| `.ok` `.checked` `.done` `.correct` `.success` `.completed` | ✓ | ✅ |
| `.cancel` `.wrong` `.fail` `.error` `.failed` | ✗ | ❌ |
| `.loading` `.wait` | ⏳ | ⏳ |
| `.help` `.question` | ? | ❓ |
| `.warning` `.alert` `.caution` | ⚠ | ⚠ |
| `.info` | ⓘ | 💡 |
| `.close` | ⌧ | ❎ |
| `.edit` `.modify` | ✎ | ✏️ |
| `.star` `.favorite` | ★ | ⭐ |
| `.menu` | ☰ | ☰ |
| `.refresh` `.reload` | ↻ | 🔄 |
| `.settings` | ⚙ | ⚙ |
| `.copy` `.duplicate` | ⧉ | 📋 |
| `.add` `.plus` | + | ➕ |
| `.minus` | - | ➖ |
| `.delete` `.remove` | ✕ | ✖ |
| `.trash` | 🗑 | 🗑️ |
| `.attach` | 🖇 | 🖇️ |
| `.up` | ⬆ | ⬆️ |
| `.down` | ⬇ | ⬇️ |
| `.go-top` | ⤒ | ⏫ |
| `.go-bottom` | ⤓ | ⏬ |
| `.link` | ⛓ | ⛓ |
| `.file` | 🗋 | 📄 |
| `.folder-open` | 🗀 | 📂 |
| `.folder-closed` | 🗁 | 📁 |
| `.drag` | ⋮ | ⋮ |
| `.inherit` | 🜍 | ⬆ |
| `.chat` / `.chat.from-left` / `.chat.from-right` | 🗪 / 🗩 / 🗨 | 🫧 / 💬 / 🗨️ |
| `.stop` | ⏹ | ⏹ |
| `.sun` / `.sun.outline` | ☀ / ☼ | ☀️ / ☀️ |
| `.moon` | 🌙 | 🌙 |
| `.digits` | 🔢 | 🔢 |
| `.palette` | 🎨 | 🎨 |
| `.chart` | 📊 | 📊 |

## 按钮系统

### 基础按钮

```html
<button class="btn">默认</button>
<button class="btn primary">主要</button>
<button class="btn danger">危险</button>
<button class="btn success">成功</button>
<button class="btn bare primary">裸按钮</button>
```

按钮通过 CSS 变量驱动颜色：

| 变量 | 默认值 |
|------|--------|
| `--btn-bg` | var(--bg-muted) |
| `--btn-border` | 1px solid var(--border-default) |
| `--btn-text-color` | var(--text-primary) |
| `--hover-bg` | var(--bg-muted) |
| `--hover-border` | currentColor |

### 按钮变体

| 类组合 | 效果 |
|--------|------|
| `.btn .bare` | 无背景/边框 |
| `.btn .square` | 正方形按钮（宽=高=--btn-h） |
| `.btn .busy` | 隐藏自身，显示同级的 `.status.icon.wait` |
| `.btn .done` | 隐藏自身，显示同级的 `.status.icon.ok` |

### 按钮组 (`.btn-group`)

根据 flex 方向自动处理首尾项的圆角，支持多方向（`items-go-x/y`、`items-from-*`）。
内部通过 `--btn-first-radius` / `--btn-last-radius` 两个 CSS 自定义属性驱动，方向 class 只需改写这两个变量。
可见性感知：用 `:nth-child(1 of :not(.hidden))` 检测首个/末个可见按钮，唯一可见按钮自动四角全圆角。

### 标签式按钮 (`label.btn`)

将 `<label>` 包装为按钮，内含隐藏 `<input>`，通过 `:checked` 驱动选中态。

## 弹出层系统

### Popover 定位

利用 CSS Anchor Positioning API，通过 `[popover]` 属性 + 定位类实现弹窗：

| 类 | 行为 |
|----|------|
| `.at-top` | 在触发器上方，水平居中 |
| `.at-bottom` | 在触发器下方，水平居中 |
| `.at-left` | 在触发器左侧，垂直居中 |
| `.at-right` | 在触发器右侧，垂直居中 |
| `.at-top.at-left` | 左上角 |
| `.at-top.at-right` | 右上角 |
| `.at-bottom.at-left` | 左下角 |
| `.at-bottom.at-right` | 右下角 |

### Modal

`.modal` 类实现全屏遮罩层，内容居中。

## 滚动系统

| 类 | 效果 |
|----|------|
| `.scrollable.on-y` | Y 轴滚动 |
| `.scrollable.on-y.when-content-long` | Y 轴自动滚动 + 预留滚动条空间 |
| `.scrollable.on-y.space-symmetrical` | 两侧皆留滚动条空间 |
| `.scrollable.on-x` | X 轴滚动 |
| `.no-scroll` | 禁止滚动 |

## 函数索引

| 类/区域 | 功能 | 可见性 | 备注 |
|---------|------|--------|------|
| `.hidden` `[hidden]` `.no-see` | 完全隐藏 | 全局 | `display: none !important` |
| `.invisible` | 视觉隐藏 / 无障碍保留 | 全局 | `clip: rect` 方式 |
| `.top-layer` | 最高层级 | 全局 | `z-index: 9999` |
| `.position-fixed` | 固定定位 | 全局 | |
| `.sticky` | 粘性定位（支持方位类） | 全局 | |
| `.fullscreen` | 铺满视口 | 全局 | `position: fixed; inset: 0` |
| `.shape.square` | 正方形 | 全局 | `--square-size` 控制 |
| `.shape.circle` | 圆形 | 全局 | `--circle-size` + `border-radius: 50%` |
| `.background.{correct/incorrect/...}` | 背景色 | 全局 | 语义背景 |
| `.list` | 列表容器 | 全局 | Flex column |
| `.scrollable.*` | 滚动容器 | 全局 | 见上表 |
| `.animation.spin` | 旋转动画 | 全局 | 1s linear infinite |
| `h1-h3` | 标题平衡换行 | 全局 | `text-wrap: balance` |
| `.text.*` | 文字样式/颜色/粗细 | 全局 | |
| `.icon.*` | 图标系统 | `.icon` | 状态/风格/emoji 切换 |
| `.btn.*` | 按钮基础/主题/状态 | `.btn` | 变量驱动 |
| `.btn-group.*` | 按钮组 | `.btn-group` | 自动圆角 |
| `label.btn` | 标签按钮 | `label.btn` | `:checked` 驱动 |
| `form:has(input:invalid)` | 表单验证 | form | 红框提示 |
| `[popover].at-*` | 弹出层定位 | `[popover]` | Anchor Positioning |
| `.modal` | 模态框遮罩 | `.modal` | Flex 居中 |
| `.drag.handle` | 拖拽把手 | `.drag.handle` | `cursor: grab` |
| `.divider` | 可拖拽分割条 | `.divider` | row/col 方向 |
| `.non-interactive` | 禁用交互 | 全局 | `pointer-events: none` |

## 决策日志

- 2026-07-15: 初始文档创建
- 2026-07-15: 图标系统重构: --char-* 变量统一到 :root，同义类合并（.ok/.done/.completed → --char-check）。.emoji 改为覆盖 --char-* 而非逐个覆盖 --icon-*。新增 .sun（空心/实心）、.moon 类。
- 2026-07-15: 新增 `.trash`/`.attach` 图标类；修复 `.btn > .icon` 特异性过高导致图标自身 `--icon-font-size` 被覆盖的 bug（改用 `:where()` 降特异性至 0,1,0）
- 2026-07-24: `.btn-group` 圆角系统重构：用 `--btn-first-radius`/`--btn-last-radius` 自定义属性替代 4 块重复选择器；新增 `display: inline-flex` 消除按钮间空隙；可见性感知改用 `:nth-child(1 of :not(.hidden))`；唯一可见按钮自动全圆角。`.btn-group > .btn` 加 `border: none` 防止边框叠加。

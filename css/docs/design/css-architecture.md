---
title: CSS 架构
covers_file: [css/common.css, css/layout.css, css/花活.css]
depends_on: []
api_signature: 无（纯样式，无 JS 接口）
last_updated: 2026-08-19
why_exists: 三个 CSS 文件覆盖不同职责（基础/布局/装饰），需要文档说明分层逻辑和类名规则
---

## 设计意图

CSS 布局实验室采用**三文件分层架构**，每个文件职责明确、可独立引用：

| 文件 | 职责 | 依赖 |
|------|------|------|
| `common.css` | 全局 reset、Design Tokens、通用组件（图标/按钮/表单/弹出层） | 无 |
| `layout.css` | 布局 utility 类（flex/grid/table）、书写模式、预设 Grid 布局 | 无（独立于 common.css） |
| `花活.css` | 装饰性/特效样式（太极图、撒花动画、呼吸灯） | 无 |

页面按需直接引用：业务页用 `css/common.css` 等相对路径 `<link>`/`@import` 加载；`demo/`、`test/`、`trial/` 页用 `../common.css` 等。无独立入口页。

### 设计哲学

- **Utility-first 但不极端**：提供 `.flex.items-near-center` 等组合类解决 90% 的布局需求，同时对复杂布局提供 Grid 预设（`.工字形`、`.亚字形`）
- **类名可读性优先**：不缩写（`.items-near-center` 而非 `.inc`），CSS 类名就是语义声明
- **书写模式感知**：通过 `.content-Z` / `.content-S` / `.content-N` / `.content-И` 四种模式，以及 `:dir(rtl)`，实现横排/竖排/RTL 下的统一布局语义
- **零 JS 依赖**：所有效果纯 CSS，不依赖 JavaScript 或框架

### 关键约束

- 类名采用**连字符 kebab-case**，以 `.items-*` `.groups-*` `.near-*` 前缀统一语义
- 变量（Custom Properties）以 `--body-*` `--text-*` `--bg-*` `--btn-*` `--icon-*` 等前缀分类
- 不引入预处理器——CSS 原生嵌套 (`&.class`) 在支持度足够后已广泛使用
- 所有 `.btn` 样式都通过自定义属性驱动，而非直接写颜色值，确保主题化能力

## 变量体系

### Design Tokens 分类

| 类别 | 前缀示例 | 所在文件 |
|------|----------|----------|
| 数学常数 | `--pi`, `--sqrt2`, `--golden-ratio` | common.css :root |
| 颜色 — 背景 | `--bg-muted`, `--bg-active`, `--bg-subtle`, `--body-bg` | common.css :root |
| 颜色 — 文字 | `--text-primary`, `--text-secondary`, `--text-muted` | common.css :root |
| 颜色 — 强调 | `--accent-primary`, `--accent-primary-hover` | common.css :root |
| 颜色 — 语义 | `--primary`, `--danger`, `--success`, `--warning` | common.css :root |
| 尺寸 — 间距 | `--space-1` ~ `--space-8` (4px 步进) | common.css :root |
| 尺寸 — 按钮 | `--btn-h` (32px), `--btn-p` (4px) | common.css :root |
| 尺寸 — 图标 | `--icon-width/height`, `--icon-min/max-*` | common.css :root |
| 尺寸 — 形状 | `--circle-size`, `--square-size` (24px) | common.css :root |
| 尺寸 — 圆角 | `--radius-sm/md/lg/xl` | common.css :root |
| 阴影 | `--shadow-sm/md/lg/xl` | common.css :root |
| 布局 | `--layout-main-row-min`, `--sidebar-min/max-width` | layout.css :root |

### 变量作用域策略

- **全局默认值**：定义在 `:root`（common.css 末尾的「选择」区域）
- **组件覆盖**：在 `.btn` 等组件块内声明 `--btn-bg` 等局部变量
- **hover 分离**：每个组件维护 `--hover-bg` / `--hover-border` 等变量，保持 hover 逻辑集中

## 类名命名约定

| 格式 | 示例 | 说明 |
|------|------|------|
| `.items-{方位}` | `.items-near-left`, `.items-go-x` | 容器级：子元素对齐/排列方向 |
| `.items-{轴}-{分布}` | `.items-x-space-between` | 容器级：指定轴上的间距分布 |
| `.items-{方位}-{修饰}` | `.items-x-near-center` | 容器级：指定轴上的居中对齐 |
| `.groups-{方位/分布}` | `.groups-near-top`, `.groups-mutex` | 容器级：子元素组（行/列）的对齐 |
| `.near-{方位}` | `.near-left`, `.near-top` | 子元素级：自身在容器中的位置 |
| `.at-outside-{方位}` | `.at-outside-top` | 子元素级：定位在容器外部 |
| `.content-{模式}` | `.content-Z`, `.content-S` | 书写模式预设 |
| `.shape.{形状}` | `.shape.square`, `.shape.circle` | 形状类 |
| `.animation.{效果}` | `.animation.spin`, `.animation.pulse` | 动画类 |
| `.icon.{风格}` | `.icon.char-style`, `.icon.outline-style` | 图标风格 |
| `.btn.{主题}` | `.btn.primary`, `.btn.danger`, `.btn.bare` | 按钮主题变体 |

## 函数索引

| 区域 | 所在文件 | 功能 | 可见性 | 备注 |
|------|----------|------|--------|------|
| 全局 reset | common.css | `box-sizing`、html/body 默认值、滚动条、平滑滚动 | 自动 | 加载即生效 |
| Design Tokens | common.css | CSS 变量系统（颜色/尺寸/阴影/间距） | :root | 全局可用 |
| 图标系统 | common.css | `.icon` 类 + 状态变量（`--icon-char` 驱动） | `.icon` 类 | [详情](modules/common.md#图标系统) |
| 按钮组件 | common.css | `.btn` `.btn-group` `label.btn` | `.btn` 类 | [详情](modules/common.md#按钮) |
| 弹出层 | common.css | `[popover]` 定位、`.modal` 遮罩 | 属性/类 | 依赖 Anchor Positioning API |
| Flex utility | layout.css | `.flex` + 方位/分布/拉伸 modifiers | `.flex` 类 | [详情](modules/layout.md#flex-布局系统) |
| Grid utility | layout.css | `.grid` + 方位/分布/反向流 modifiers | `.grid` 类 | [详情](modules/layout.md#grid-布局系统) |
| 书写模式 | layout.css | `.content-Z/S/N/И` 四种模式 | 类 | 含 `:dir(rtl)` RTL 适配 |
| Grid 预设 | layout.css | `.工字形` `.朋字形` `.亚字形` `.叵字形` `.反叵字形` `.目字形` | 类 | 中文名命名的 Grid template |
| 装饰图形 | 花活.css | `.taiji` `.shape.triangle` | 类 | [详情](modules/hua-huo.md) |
| 动画特效 | 花活.css | `.confetti-piece` `.animation.pulse` `.animation.shadow-breathing` | 类 | [详情](modules/hua-huo.md) |

## 决策日志

- 2026-07-15: 初始文档创建

---
title: layout.css 模块
covers_file: [css/layout.css]
depends_on: [css-architecture]
api_signature: CSS 类（.flex 及其 modifiers、.grid 及其 modifiers、.table 修饰、.content-Z/S/N/И、.工字形、.near-* 等）
last_updated: 2026-07-15
why_exists: layout.css 提供完整的 Flex/Grid/Table Utility 类系统和预设布局，是 CSS 库的布局引擎
---

## 设计意图

layout.css 解决一个核心问题：**在不写手写 CSS 属性的情况下，通过语义化的 HTML 类名表达任何布局意图**。它通过组合类名（方位 + 排列 + 分布）覆盖横排、竖排、反向、书写模式切换等所有布局场景。

### 设计原则

1. **语义映射**：`.items-near-left` 比 `justify-content: flex-start` 更接近人类直觉——"元素靠左"
2. **轴抽象**：通过 `items-go-x/y` 声明主轴方向，之后所有 `near-*`、`space-*` 类自动按照当前轴解释
3. **书写模式感知**：支持 4 种书写模式（Z/S/N/И），每种模式下 `near-left/right/top/bottom` 映射正确的 CSS 属性
4. **容器与子元素分离**：`.items-*` 和 `.groups-*` 控制容器，`.near-*` 控制子元素自身

## Flex 布局系统

### 主轴方向

| 类 | flex-direction |
|----|---------------|
| `.flex.items-go-x` | row |
| `.flex.items-go-y` | column |
| `.flex.items-from-left` | row |
| `.flex.items-from-right` | row-reverse |
| `.flex.items-from-top` | column |
| `.flex.items-from-bottom` | column-reverse |

### 子元素对齐（主轴）

| 类 | 等价 justify-content | 说明 |
|----|---------------------|------|
| `.items-near-left` | flex-start | 靠左/靠开始 |
| `.items-near-right` | flex-end | 靠右/靠结束 |
| `.items-x-near-center` | center | 主轴居中 |
| `.items-x-space-between` | space-between | 两端对齐 |
| `.items-x-space-around` | space-around | 环绕均分 |
| `.items-x-space-evenly` | space-evenly | 等距均分 |

### 子元素对齐（次轴）

| 类 | 等价 align-items/content |
|----|--------------------------|
| `.items-near-top` | flex-start |
| `.items-near-bottom` | flex-end |
| `.items-y-near-center` | center |
| `.items-y-stretch` | stretch |

### 子元素组对齐

| 类 | 等价的 align-content |
|----|---------------------|
| `.groups-near-top` | flex-start |
| `.groups-near-bottom` | flex-end |
| `.groups-near-center` | center |
| `.groups-mutex` (.groups-social-phobia) | space-between |
| `.groups-unfamiliar` | space-around |
| `.groups-friendly` | space-evenly |

### 竖排适配规则

当容器同时有 `.items-go-y`（或 `.items-from-top/bottom`）时，X/Y 轴的 CSS 属性映射交换（justify-content 和 align-content 的职责互换）。layout.css 中为每种组合显式覆盖了所有 near-* / space-* 类。

### 子元素自身定位

| 类 | 效果 |
|----|------|
| `.near-left` | margin-left:0; margin-right:auto |
| `.near-right` | margin-left:auto; margin-right:0 |
| `.near-top` | margin-top:0; margin-bottom:auto |
| `.near-bottom` | margin-top:auto; margin-bottom:0 |
| `.near-x-center` | margin-left/right:auto |
| `.near-y-center` | margin-top/bottom:auto |
| `.near-center` | margin:auto; place-self:center |

### 子元素尺寸控制

| 类 | 效果 |
|----|------|
| `.monopoly-x` | flex-basis:100%（横排独占一行） |
| `.monopoly-y` | flex-basis:100%（竖排独占一行） |
| `.no-shrink` | flex-shrink:0（不压缩） |
| `.flexible` | flex:1 1 auto + align-self:stretch |

## Grid 布局系统

layout.css 为 `.grid` 容器提供了与 `.flex` 平行的类名系统，遵循同样的方位语义。

### Grid 特有方向

| 类 | 效果 |
|----|------|
| `.grid.items-go-x` | grid-auto-flow: row |
| `.grid.items-go-y` | grid-auto-flow: column |
| `.grid.items-from-bottom` | 通过 `writing-mode: vertical-lr` + `direction: rtl` 实现反向流 |

### Grid 预设布局

| 类 | 描述 | 结构 |
|----|------|------|
| `.工字形` | 工字型：上 header + 下 footer + 左中右三栏（左右均分） | grid-template-columns: 1fr 1fr |
| `.朋字形` | 朋字型：只有左右两栏均分 | grid-template-columns: 1fr 1fr |
| `.亚字形` | 亚字型：上 header + 下 footer + 左侧栏 + 主内容 + 右侧栏 | 三列：side / 1fr / side |
| `.叵字形` | 叵字型：上 header + 下 footer + 左侧栏 + 右侧主内容 | 两列：side / 1fr |
| `.反叵字形` | 反叵字型：上 header + 下 footer + 主内容 + 右侧栏 | 两列：1fr / side |
| `.目字形` / `.三字形` | 目字型：上 header + 下 footer，无侧栏 | 单列 |

所有预设布局通过 Grid `grid-template-areas` 实现，`header`/`footer`/`main`/`.sidebar.near-left`/`.sidebar.near-right` 自动分配到对应区域。

## Table 修饰

| 类 | 效果 |
|----|------|
| `.table.items-near-left` | td/th text-align:left |
| `.table.items-near-right` | td/th text-align:right |
| `.table.items-near-top` | td/th vertical-align:top |
| `.table.items-near-bottom` | td/th vertical-align:bottom |
| `.table.items-from-right` | direction:rtl（表内恢复 ltr） |

## 书写模式系统

### 四种模式

| 类 | writing-mode | direction |
|----|-------------|-----------|
| `.content-Z` | horizontal-tb | ltr（标准横排） |
| `.content-S` | horizontal-tb | rtl（右到左横排） |
| `.content-N` | vertical-rl | ltr（竖排从右到左） |
| `.content-И` | vertical-lr | ltr（竖排从左到右） |

### RTL 适配 (`:dir(rtl)`, `.content-S`)

在 RTL 环境下：
- `.items-from-left` → row-reverse（而非 row）
- `.items-from-right` → row（而非 row-reverse）
- `.near-left` → justify-self:end
- `.near-right` → justify-self:start
- Grid/Table 同样反转

### N 模式适配

`.content-N`（竖排 vertical-rl）下：
- 横/flex 方向交换（go-x → column-reverse, go-y → row）
- Grid 对齐属性交换（near-top → justify-content:flex-start, near-left → align-content:flex-end）

### И 模式适配

`.content-И`（竖排 vertical-lr）下：
- 与 N 模式类似但轴映射方向相反
- Grid 的 near-left/near-right 对应不同的 align-content 值

## 函数索引

| 类 | 功能 | 可见性 | 备注 |
|----|------|--------|------|
| `.flex` | Flex 容器 | 全局 | `flex-wrap: wrap` + `align-items: flex-start` |
| `.grid` | Grid 容器 | 全局 | |
| `.inline` `.block` `.table` | 基础 display | 全局 | |
| `.items-go-x/y` | 主轴方向 | flex/grid | |
| `.items-from-{l/r/t/b}` | 排列起始边 | flex/grid/table | |
| `.items-near-{l/r/t/b}` | 子元素对齐 | flex/grid/table | |
| `.items-{x/y}-near-center` | 轴居中 | flex/grid | |
| `.items-{x/y}-space-*` | 间距分布 | flex/grid | |
| `.items-{x/y}-stretch` | 拉伸 | flex/grid | |
| `.groups-{near/center/space}` | 组对齐 | flex/grid | 通用于 flex 和 grid |
| `.monopoly-{x/y}` | 子元素独占 | flex | `flex-basis: 100%` |
| `.no-shrink` | 禁止压缩 | flex 子元素 | |
| `.flexible` | 弹性填充 | flex 子元素 | |
| `.near-*` | 子元素自身定位 | 通用 | margin/justify-self/align-self |
| `.at-outside-*` | 外部定位 | 通用 | 用于 tooltip 等 |
| `.content-{Z/S/N/И}` | 书写模式 | 全局 | 影响布局方向 |
| `.工字形` / `.朋字形` | Grid 预设布局 | 全局 | Grid template-areas |
| `.亚字形` / `.叵字形` / `.反叵字形` | Grid 预设布局 | 全局 | 带侧栏 |
| `.目字形` / `.三字形` | Grid 预设布局 | 全局 | 无侧栏 |

## 决策日志

- 2026-07-15: 初始文档创建

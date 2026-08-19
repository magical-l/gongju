---
title: 花活.css 模块
covers_file: [css/花活.css]
depends_on: [css-architecture]
api_signature: CSS 类（.taiji、.shape.triangle、.confetti-piece、.animation.pulse、.animation.shadow-breathing）
last_updated: 2026-07-15
why_exists: 花活.css 包含纯 CSS 装饰性图案和动画——这些不属于"常规"样式，独立文件便于按需加载
---

## 设计意图

花活.css 收集那些**炫技但不实用**的纯 CSS 效果——太极图、三角箭头提示框、撒花动画、呼吸灯光晕。它们独立于 common.css 和 layout.css，使用方按需 `<link>` 加载。

### 为什么独立成文件

- common.css 和 layout.css 是日常使用的"基础设施"，花活.css 是"锦上添花"
- 撒花动画 `.confetti-piece` 约 200 行（因为 10 种颜色的 nth-child 展开），混入基础文件不划算
- 太极图使用多层 `radial-gradient` + `linear-gradient`，包含复杂数值，适合独立维护

## 特殊图形

### 太极图 (`.taiji`)

纯 CSS 实现，通过两层 `radial-gradient` + 一层 `linear-gradient` 在 `::before` 上绘制。

```html
<div class="taiji"></div>
```

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `--taiji-yin-color` | #000 | 阴色（黑色半圆+鱼眼） |
| `--taiji-yang-color` | #fff | 阳色（白色半圆+鱼眼） |
| `--taiji-border-color` | #999 | 外边框颜色 |

实现原理：`background` 三层叠加——
1. 白色径向渐变（上 25% 位置）→ 阴鱼白底
2. 黑色径向渐变（下 75% 位置）→ 阳鱼黑底
3. 线性渐变（左黑右白）→ 半边底色

### 三角箭头 (`.shape.triangle`)

配合 `near-*` 和 `to-*` 类实现指向性提示箭头：

```html
<div class="shape triangle near-top to-down">向下指</div>
```

| 类 | 效果 |
|----|------|
| `.near-top` | 箭头在元素上方 |
| `.near-bottom` | 箭头在元素下方 |
| `.near-left` | 箭头在元素左侧 |
| `.near-right` | 箭头在元素右侧 |
| `.to-down` | 箭头朝下 |
| `.to-up` | 箭头朝上 |
| `.to-left` | 箭头朝左 |
| `.to-right` | 箭头朝右 |

通过 `border` 透明 + 单边有色实现三角，`::before` / `::after` 伪元素定位。

## 动画

### 撒花 (`.confetti-piece`)

用 10 个 `.confetti-piece` 元素（`nth-child(10n+1)` ~ `nth-child(10n)`）生成彩色掉落纸片。每个位置、颜色、持续时间不同。

```html
<div class="confetti-piece"></div>
<!-- 放 10 个即生成完整的撒花效果 -->
```

通过 `::before` 和 `::after` 伪元素扩展出左右两侧的额外纸片。

| 动画名 | 效果 |
|--------|------|
| `confetti-fall` | 从上到下坠落 + 透明度渐变 |
| `confetti-spin` | 自旋转 |

### 脉冲 (`.animation.pulse`)

```html
<div class="animation pulse shadow">呼吸光晕</div>
```

| 类组合 | 效果 |
|--------|------|
| `.animation.pulse.shadow` | box-shadow 脉冲（呼吸光晕） |
| `.animation.pulse.color` | 文字色脉冲（闪烁文字） |

### 呼吸灯 (`.animation.shadow-breathing`)

```html
<div class="animation shadow-breathing">三层光晕呼吸灯</div>
```

三层嵌套 box-shadow 同时呼吸，可通过变量定制：

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `--pulse-glow-color-1` | rgba(0,255,255,0.6) | 内层光晕色 |
| `--pulse-glow-color-2` | rgba(255,0,255,0.4) | 中层光晕色 |
| `--pulse-glow-color-3` | rgba(0,255,128,0.2) | 外层光晕色 |
| `--pulse-glow-duration` | 1.5s | 呼吸周期 |
| `--pulse-glow-size-1/2/3` | 20/40/60px | 各层光晕尺寸 |

`.on-hover` 变体在鼠标悬停时触发。

`.golden-glow` 定制变体—金色光晕配色。

## 函数索引

| 类 | 功能 | 可见性 | 备注 |
|----|------|--------|------|
| `.taiji` | 纯 CSS 太极图 | 全局 | 通过 background 多层渐变绘制 |
| `.shape.triangle` | 三角箭头提示 | `.shape.triangle` | 配合 near-* + to-* 使用 |
| `.confetti-piece` | 撒花纸片元素 | 全局 | 10 个元素一组 |
| `.animation.pulse.shadow` | 阴影脉冲 | `.animation.pulse` | box-shadow 呼吸 |
| `.animation.pulse.color` | 文字脉冲 | `.animation.pulse` | 颜色闪烁 |
| `.animation.shadow-breathing` | 三层呼吸灯 | 全局 | 可定制颜色/尺寸 |
| `.animation.shadow-breathing.on-hover` | 悬停触发呼吸灯 | `.animation.shadow-breathing` | hover 时才呼吸 |
| `.animation.shadow-breathing.golden-glow` | 金色呼吸灯 | `.animation.shadow-breathing` | 金色光晕预设 |

## 决策日志

- 2026-07-15: 初始文档创建

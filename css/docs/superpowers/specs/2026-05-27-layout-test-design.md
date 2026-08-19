# layout.css 测试体系设计

## 概述

为 layout.css 设计完整测试体系，覆盖所有类及其有意义组合。旧测试文件类名已过时（go-x→items-go-x 等），需要重写。

## 文件结构

| 文件 | 内容 | 生成方式 |
|------|------|---------|
| `test/basics.html` | 独立类：display、gap、single/multi-line、near-*、flex专属、grid专属、预设布局 | 全手写 |
| `test/layout.html` | 笛卡尔积：容器类型 × 方向 × 分布（不含书写模式） | JS 批量 + 手写边界 |
| `test/writing-mode.html` | 书写模式(content-Z/S/N/И) × (容器类型 × 方向 × 分布) | JS 批量 |

## 笛卡尔积维度

仅以下三维参与组合：

| 维度 | 取值 |
|------|------|
| 容器类型 | `grid`、`flex`（均不设 go 方向时默认物理横向） |
| 方向 | `items-go-x`、`items-go-y`、`items-go-x.items-from-right`、`items-go-y.items-from-bottom` |
| 分布 | `items-near-left/right/top/bottom`、`items-x/y-stretch`、`items-stretch`、`items-x/y-near-center`、`items-near-center`、`items-x/y-space-between/evenly/around`（含别名：mutex/social-phobia/friendly/unfamiliar） |

不参与组合的独立类：`items-no-gap`、`items-single-line`、`items-multi-line`、`no-shrink`、`flexible`、`monopoly-x/y`、`one-row`、`one-column`、预设布局、display 类型别名、`.near-*` 元素定位。

## 用例结构

```html
<div class="case" data-id="1"
     data-expect="justify-content:start justify-items:start">
  <div class="label">容器类名列表</div>
  <div class="container 类名列表">
    <div class="item">1</div>
  </div>
</div>
```

- `data-id`：全局唯一数字编号，自增
- `data-expect`：`属性名:值` 空格分隔，只列需要检查的属性
- `.container`：测试容器，承载被测类名组合
- `.item`：子元素，数量根据测试需要（分布类测试需要 ≥3 个，定位类 1-2 个）

## 验证机制

```js
function verify() {
  document.querySelectorAll('.case').forEach(c => {
    const expect = parseExpect(c.dataset.expect); // {prop: value, ...}
    const cs = getComputedStyle(c.querySelector('.container'));
    const ok = Object.entries(expect).every(([prop, val]) => cs[prop] === val);
    c.classList.add(ok ? 'pass' : 'fail');
  });
}
```

失败的用例在 `.label` 后追加实际值，方便调试。

## 各文件详细范围

### basics.html

手写所有独立规则，每规则至少一个用例：

- **display**：`.inline`、`.block`、`.block.inline`、`.table`、`.table.inline`、`.flex`、`.flex.inline`、`.grid`、`.grid.inline`
- **换行/间隙**：`.items-single-line`(flex)、`.items-multi-line`(flex)、`.items-no-gap`(flex)
- **元素定位**：`.near-left/right/top/bottom/x-center/y-center/center`，各适配块/flex/grid/定位场景；含 `.items-go-y > .near-*` 轴交换
- **flex 专属**：`.monopoly-x`、`.monopoly-y`（需 `.items-multi-line.items-go-x/y` 容器）、`.no-shrink`、`.flexible`
- **grid 专属**：`.one-row`、`.one-column`
- **预设布局**：`.工字形`、`.朋字形`、`.亚字形`、`.叵字形`、`.反叵字形`、`.目字形`/`.三字形`

### layout.html

笛卡尔积（3 维），全部在 content-Z（默认书写模式）下：

**容器类型 × 方向：**
- grid + 无 go → 默认横向（grid-auto-flow:row）
- grid + items-go-x → grid-auto-flow:row
- grid + items-go-y → grid-auto-flow:column
- flex + 无 go → 默认 row
- flex + items-go-x → flex-direction:row
- flex + items-go-x.items-from-right → flex-direction:row-reverse
- flex + items-go-y → flex-direction:column
- flex + items-go-y.items-from-bottom → flex-direction:column-reverse

**方向 × 分布：**
- items-go-x × 所有分布类 → 检查 justify-*（横向分布）
- items-go-y × 所有分布类 → 检查 justify-* / align-* 轴交换
- items-go-x.items-from-right × items-near-left/right → 左右反转
- items-go-y.items-from-bottom × items-near-top/bottom → 上下反转

手写边界用例：stretch 搭配 flex 子元素 `flex:1` 行为、多行 flex 换行后的分布效果。

### writing-mode.html

将 layout.html 的笛卡尔积在 4 种书写模式下重复：

- **content-Z**（horizontal-tb, ltr）：默认，与 layout.html 一致
- **content-S**（horizontal-tb, rtl）：items-near-left/right 左右反转；含 items-go-y 下的 align-self 翻转
- **content-N**（vertical-rl）：go 方向轴交换（go-x↔go-y）、items-near-* 轴交换
- **content-И**（vertical-lr）：同上，方向不同

每个 content-* 下覆盖容器类型 × 方向（含 go-x/go-y + from-*）× 全部分布类。每个 content-* 板块内单独编号段（如 300-399 for content-Z, 400-499 for content-S）。

## 实现注意事项

1. JS 生成用例时，容器需设置合适尺寸（width/height/min-height），确保分布效果可见
2. Grid 容器需要 `grid-template-columns/rows` 创建轨道
3. 多行 Flex 分布测试需要 `flex-wrap` + 限制宽度
4. content-N/И 需要 `height` 或 `min-height`
5. 用例编号在三个文件间连续分配：basics 1-99，layout 100-299，writing-mode 300-699
6. CSS 文件统一引用 `../css/layout.css`
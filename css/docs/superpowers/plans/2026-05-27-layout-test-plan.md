# layout.css 测试体系 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 重写 layout.css 的测试体系，覆盖所有类及其有意义组合，自动化验证 computedStyle。

**Architecture:** 三个测试文件（basics/layout/writing-mode），共享统一的用例结构和验证函数。布局类测试（layout/writing-mode）用 JS 批量生成笛卡尔积用例；独立类测试（basics）手写 HTML。

**Tech Stack:** 纯 HTML + CSS + 原生 JS，无框架依赖。引用 `../css/layout.css`。

---

## 文件职责

| 文件 | 职责 |
|------|------|
| `test/basics.html` | 独立类：display、gap、line、near-*、flex专属、grid专属、预设布局 |
| `test/layout.html` | 笛卡尔积：容器×方向×分布（content-Z 默认书写模式） |
| `test/writing-mode.html` | 书写模式 × (容器×方向×分布) 全组合 |

共享 `.case` 结构和 `data-expect` 验证协议，无共享 JS 文件（每个文件自包含验证逻辑）。

---

### Task 1: 创建 basics.html — 基础结构和 display 类型

**Files:**
- Create: `d:\工作\css\test\basics.html`

- [ ] **Step 1: 创建文件骨架和样式**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<title>layout.css 基础测试</title>
<link rel="stylesheet" href="../css/layout.css">
<style>
body { padding: 20px; font-family: sans-serif; font-size: 14px; }
h1 { border-bottom: 2px solid #333; }
h2 { margin-top: 30px; color: #555; border-bottom: 1px solid #999; }
#summary { position: sticky; top: 0; z-index: 100; padding: 8px 16px;
  font-size: 14px; font-weight: bold; margin-bottom: 10px; }
.section { margin: 15px 0; display: flex; gap: 15px; flex-wrap: wrap; align-items: flex-start; }
.case { border: 1px solid #999; padding: 10px; background: #fafafa; }
.case.pass { background: #e8f5e9; border-color: #4caf50; }
.case.fail { background: #ffebee; border-color: #f44336; }
.case .label { font-weight: bold; margin-bottom: 3px; font-size: 12px; }
.case .classes { font-family: monospace; font-size: 11px; color: #555; margin-bottom: 6px; }
.case .actual { font-family: monospace; font-size: 10px; color: #c62828; display: none; }
.case.fail .actual { display: block; }
.container { border: 3px solid #333; background: #f0f0f0; }
.item { background: #a5d6a7; border: 2px solid #333;
  display: flex; align-items: center; justify-content: center; font-weight: bold; color: #333; }
</style>
</head>
<body>
<h1>layout.css 基础测试</h1>
<div id="summary"></div>
<script>
function verify() {
  let pass = 0, fail = 0;
  document.querySelectorAll('.case').forEach(c => {
    const expectStr = c.dataset.expect || '';
    const expect = {};
    expectStr.split(/\s+/).filter(Boolean).forEach(pair => {
      const [prop, val] = pair.split(':');
      if (prop && val) expect[prop] = val;
    });
    const cs = getComputedStyle(c.querySelector('.container'));
    let ok = true, actuals = [];
    for (const [prop, val] of Object.entries(expect)) {
      const actual = cs[prop];
      if (actual !== val) { ok = false; actuals.push(prop + ':' + actual + '≠' + val); }
    }
    c.classList.add(ok ? 'pass' : 'fail');
    if (!ok) {
      const el = c.querySelector('.actual');
      if (el) el.textContent = actuals.join(' ');
    }
    if (ok) pass++; else fail++;
  });
  const s = document.getElementById('summary');
  const allPass = fail === 0;
  s.style.background = allPass ? '#e8f5e9' : '#ffebee';
  s.style.color = allPass ? '#2e7d32' : '#c62828';
  s.textContent = pass + ' 通过 / ' + fail + ' 失败 / ' + (pass+fail) + ' 总计' + (allPass ? ' ✓' : ' ✗');
}
window.addEventListener('DOMContentLoaded', verify);
</script>
</body>
</html>
```

- [ ] **Step 2: 添加 display 类型用例**

在 `<h1>` 之后、`</body>` 之前插入：

```html
<h2>display 类型</h2>
<div class="section">
  <div class="case" data-id="1" data-expect="display:inline">
    <div class="label">1. .inline</div>
    <div class="classes">inline</div>
    <div class="container inline" style="width:100px;height:40px"><div class="item">A</div></div>
    <div class="actual"></div>
  </div>
  <div class="case" data-id="2" data-expect="display:block">
    <div class="label">2. .block</div>
    <div class="classes">block</div>
    <div class="container block" style="width:100px;height:40px"><div class="item">A</div></div>
    <div class="actual"></div>
  </div>
  <div class="case" data-id="3" data-expect="display:inline-block">
    <div class="label">3. .block.inline</div>
    <div class="classes">block inline</div>
    <div class="container block inline" style="width:100px;height:40px"><div class="item">A</div></div>
    <div class="actual"></div>
  </div>
  <div class="case" data-id="4" data-expect="display:table">
    <div class="label">4. .table</div>
    <div class="classes">table</div>
    <div class="container table" style="width:100px;height:40px"><div class="item">A</div></div>
    <div class="actual"></div>
  </div>
  <div class="case" data-id="5" data-expect="display:inline-table">
    <div class="label">5. .table.inline</div>
    <div class="classes">table inline</div>
    <div class="container table inline" style="width:100px;height:40px"><div class="item">A</div></div>
    <div class="actual"></div>
  </div>
  <div class="case" data-id="6" data-expect="display:flex">
    <div class="label">6. .flex</div>
    <div class="classes">flex</div>
    <div class="container flex" style="width:100px;height:40px"><div class="item">A</div></div>
    <div class="actual"></div>
  </div>
  <div class="case" data-id="7" data-expect="display:inline-flex">
    <div class="label">7. .flex.inline</div>
    <div class="classes">flex inline</div>
    <div class="container flex inline" style="width:100px;height:40px"><div class="item">A</div></div>
    <div class="actual"></div>
  </div>
  <div class="case" data-id="8" data-expect="display:grid">
    <div class="label">8. .grid</div>
    <div class="classes">grid</div>
    <div class="container grid" style="width:100px;height:40px"><div class="item">A</div></div>
    <div class="actual"></div>
  </div>
  <div class="case" data-id="9" data-expect="display:inline-grid">
    <div class="label">9. .grid.inline</div>
    <div class="classes">grid inline</div>
    <div class="container grid inline" style="width:100px;height:40px"><div class="item">A</div></div>
    <div class="actual"></div>
  </div>
</div>
```

- [ ] **Step 3: 提交**

```bash
git add d:\工作\css\test\basics.html
git commit -m "test: basics.html — 骨架和display类型用例"
```

---

### Task 2: basics.html — 换行/间隙/元素定位

**Files:**
- Modify: `d:\工作\css\test\basics.html`

- [ ] **Step 1: 添加换行/间隙用例**

在 display 段之后插入：

```html
<h2>换行 / 间隙</h2>
<div class="section">
  <div class="case" data-id="10" data-expect="flex-wrap:nowrap">
    <div class="label">10. .items-single-line (flex)</div>
    <div class="classes">flex items-single-line</div>
    <div class="container flex items-single-line" style="width:120px">
      <div class="item" style="width:50px;height:30px">1</div>
      <div class="item" style="width:50px;height:30px">2</div>
      <div class="item" style="width:50px;height:30px">3</div>
    </div>
    <div class="actual"></div>
  </div>
  <div class="case" data-id="11" data-expect="flex-wrap:wrap">
    <div class="label">11. .items-multi-line (flex)</div>
    <div class="classes">flex items-multi-line</div>
    <div class="container flex items-multi-line" style="width:120px">
      <div class="item" style="width:50px;height:30px">1</div>
      <div class="item" style="width:50px;height:30px">2</div>
      <div class="item" style="width:50px;height:30px">3</div>
    </div>
    <div class="actual"></div>
  </div>
  <div class="case" data-id="12" data-expect="gap:0px">
    <div class="label">12. .items-no-gap</div>
    <div class="classes">flex items-no-gap</div>
    <div class="container flex items-no-gap" style="width:200px;height:40px">
      <div class="item" style="width:50px;height:30px">1</div>
      <div class="item" style="width:50px;height:30px">2</div>
    </div>
    <div class="actual"></div>
  </div>
</div>
```

- [ ] **Step 2: 添加 near-* 元素定位用例**

```html
<h2>near-* 元素定位</h2>
<p>容器为 flex（默认横向），子元素用 near-* 定位</p>
<div class="section">
  <div class="case" data-id="13" data-expect="margin-left:0px margin-right:auto justify-self:start left:0px right:auto">
    <div class="label">13. .near-left (flex子元素)</div>
    <div class="classes">flex → .near-left</div>
    <div class="container flex" style="width:300px;height:60px">
      <div class="item near-left" style="width:60px;height:40px">L</div>
    </div>
    <div class="actual"></div>
  </div>
  <div class="case" data-id="14" data-expect="margin-left:auto margin-right:0px justify-self:end left:auto right:0px">
    <div class="label">14. .near-right (flex子元素)</div>
    <div class="classes">flex → .near-right</div>
    <div class="container flex" style="width:300px;height:60px">
      <div class="item near-right" style="width:60px;height:40px">R</div>
    </div>
    <div class="actual"></div>
  </div>
  <div class="case" data-id="15" data-expect="margin-top:0px margin-bottom:auto align-self:start vertical-align:top top:0px bottom:auto">
    <div class="label">15. .near-top (flex子元素)</div>
    <div class="classes">flex → .near-top</div>
    <div class="container flex" style="width:300px;height:80px">
      <div class="item near-top" style="width:60px;height:40px">T</div>
    </div>
    <div class="actual"></div>
  </div>
  <div class="case" data-id="16" data-expect="margin-top:auto margin-bottom:0px align-self:end vertical-align:bottom top:auto bottom:0px">
    <div class="label">16. .near-bottom (flex子元素)</div>
    <div class="classes">flex → .near-bottom</div>
    <div class="container flex" style="width:300px;height:80px">
      <div class="item near-bottom" style="width:60px;height:40px">B</div>
    </div>
    <div class="actual"></div>
  </div>
  <div class="case" data-id="17" data-expect="margin-left:auto margin-right:auto justify-self:center left:0px right:0px">
    <div class="label">17. .near-x-center (flex子元素)</div>
    <div class="classes">flex → .near-x-center</div>
    <div class="container flex" style="width:300px;height:60px">
      <div class="item near-x-center" style="width:60px;height:40px">X</div>
    </div>
    <div class="actual"></div>
  </div>
  <div class="case" data-id="18" data-expect="margin-top:auto margin-bottom:auto align-self:center vertical-align:middle top:0px bottom:0px">
    <div class="label">18. .near-y-center (flex子元素)</div>
    <div class="classes">flex → .near-y-center</div>
    <div class="container flex" style="width:300px;height:80px">
      <div class="item near-y-center" style="width:60px;height:40px">Y</div>
    </div>
    <div class="actual"></div>
  </div>
  <div class="case" data-id="19" data-expect="margin:auto justify-self:center align-self:center vertical-align:middle inset:0px">
    <div class="label">19. .near-center (flex子元素)</div>
    <div class="classes">flex → .near-center</div>
    <div class="container flex" style="width:300px;height:80px">
      <div class="item near-center" style="width:60px;height:40px">C</div>
    </div>
    <div class="actual"></div>
  </div>
</div>
```

- [ ] **Step 3: 添加 items-go-y 下 near-* 轴交换用例**

```html
<h2>items-go-y 下 near-* 轴交换</h2>
<div class="section">
  <div class="case" data-id="20" data-expect="justify-self:auto align-self:start">
    <div class="label">20. .items-go-y > .near-left</div>
    <div class="classes">flex items-go-y → .near-left</div>
    <div class="container flex items-go-y" style="width:200px;height:120px">
      <div class="item near-left" style="width:60px;height:30px">L</div>
    </div>
    <div class="actual"></div>
  </div>
  <div class="case" data-id="21" data-expect="justify-self:auto align-self:end">
    <div class="label">21. .items-go-y > .near-right</div>
    <div class="classes">flex items-go-y → .near-right</div>
    <div class="container flex items-go-y" style="width:200px;height:120px">
      <div class="item near-right" style="width:60px;height:30px">R</div>
    </div>
    <div class="actual"></div>
  </div>
  <div class="case" data-id="22" data-expect="align-self:auto justify-self:start">
    <div class="label">22. .items-go-y > .near-top</div>
    <div class="classes">flex items-go-y → .near-top</div>
    <div class="container flex items-go-y" style="width:200px;height:120px">
      <div class="item near-top" style="width:60px;height:30px">T</div>
    </div>
    <div class="actual"></div>
  </div>
  <div class="case" data-id="23" data-expect="align-self:auto justify-self:end">
    <div class="label">23. .items-go-y > .near-bottom</div>
    <div class="classes">flex items-go-y → .near-bottom</div>
    <div class="container flex items-go-y" style="width:200px;height:120px">
      <div class="item near-bottom" style="width:60px;height:30px">B</div>
    </div>
    <div class="actual"></div>
  </div>
</div>
```

- [ ] **Step 4: 提交**

```bash
git add d:\工作\css\test\basics.html
git commit -m "test: basics.html — 换行/间隙/near-*定位用例"
```

---

### Task 3: basics.html — flex专属、grid专属、预设布局

**Files:**
- Modify: `d:\工作\css\test\basics.html`

- [ ] **Step 1: 添加 flex 专属用例**

```html
<h2>flex 专属</h2>
<div class="section">
  <div class="case" data-id="24" data-expect="flex-basis:100%">
    <div class="label">24. .monopoly-x</div>
    <div class="classes">flex items-multi-line items-go-x → .monopoly-x</div>
    <div class="container flex items-multi-line items-go-x" style="width:200px;height:80px">
      <div class="item monopoly-x" style="height:30px">X</div>
      <div class="item" style="width:50px;height:30px">A</div>
    </div>
    <div class="actual"></div>
  </div>
  <div class="case" data-id="25" data-expect="flex-basis:100%">
    <div class="label">25. .monopoly-y</div>
    <div class="classes">flex items-multi-line items-go-y → .monopoly-y</div>
    <div class="container flex items-multi-line items-go-y" style="width:200px;height:120px">
      <div class="item monopoly-y" style="width:50px">Y</div>
      <div class="item" style="width:50px;height:30px">A</div>
    </div>
    <div class="actual"></div>
  </div>
  <div class="case" data-id="26" data-expect="flex-shrink:0">
    <div class="label">26. .no-shrink</div>
    <div class="classes">flex → .no-shrink</div>
    <div class="container flex" style="width:150px;height:40px">
      <div class="item no-shrink" style="width:100px;height:30px">NO</div>
      <div class="item" style="width:100px;height:30px">S</div>
    </div>
    <div class="actual"></div>
  </div>
  <div class="case" data-id="27" data-expect="flex-grow:1 flex-shrink:1 flex-basis:auto align-self:stretch min-width:0px min-height:0px">
    <div class="label">27. .flexible</div>
    <div class="classes">flex → .flexible</div>
    <div class="container flex" style="width:200px;height:80px">
      <div class="item flexible">FILL</div>
    </div>
    <div class="actual"></div>
  </div>
</div>
```

- [ ] **Step 2: 添加 grid 专属用例**

```html
<h2>grid 专属</h2>
<div class="section">
  <div class="case" data-id="28" data-expect="grid-column-start:1 grid-column-end:-1">
    <div class="label">28. .one-row</div>
    <div class="classes">grid → .one-row</div>
    <div class="container grid" style="grid-template-columns:80px 80px 80px;grid-template-rows:50px 50px;width:260px;height:120px">
      <div class="item one-row" style="height:30px">FULL</div>
      <div class="item">A</div>
      <div class="item">B</div>
    </div>
    <div class="actual"></div>
  </div>
  <div class="case" data-id="29" data-expect="grid-row-start:1 grid-row-end:-1">
    <div class="label">29. .one-column</div>
    <div class="classes">grid → .one-column</div>
    <div class="container grid" style="grid-template-columns:80px 80px 80px;grid-template-rows:50px 50px;width:260px;height:120px">
      <div class="item one-column" style="width:30px">FULL</div>
      <div class="item">A</div>
      <div class="item">B</div>
    </div>
    <div class="actual"></div>
  </div>
</div>
```

- [ ] **Step 3: 添加预设布局用例**

```html
<h2>预设布局</h2>
<div class="section">
  <div class="case" data-id="30" data-expect="display:grid grid-template-areas:header header|left right|footer footer">
    <div class="label">30. .工字形</div>
    <div class="classes">工字形</div>
    <div class="container 工字形" style="width:300px;height:150px">
      <header class="item">H</header>
      <div class="item sidebar near-left">L</div>
      <div class="item sidebar near-right">R</div>
      <footer class="item">F</footer>
    </div>
    <div class="actual"></div>
  </div>
  <div class="case" data-id="31" data-expect="display:grid grid-template-areas:left right">
    <div class="label">31. .朋字形</div>
    <div class="classes">朋字形</div>
    <div class="container 朋字形" style="width:300px;height:100px">
      <div class="item near-left">L</div>
      <div class="item near-right">R</div>
    </div>
    <div class="actual"></div>
  </div>
  <div class="case" data-id="32" data-expect="display:grid">
    <div class="label">32. .亚字形</div>
    <div class="classes">亚字形</div>
    <div class="container 亚字形" style="width:400px;height:200px">
      <header class="item">H</header>
      <div class="item sidebar near-left">L</div>
      <main class="item main">M</main>
      <div class="item sidebar near-right">R</div>
      <footer class="item">F</footer>
    </div>
    <div class="actual"></div>
  </div>
  <div class="case" data-id="33" data-expect="display:grid">
    <div class="label">33. .叵字形</div>
    <div class="classes">叵字形</div>
    <div class="container 叵字形" style="width:400px;height:200px">
      <header class="item">H</header>
      <div class="item sidebar near-left">L</div>
      <main class="item main">M</main>
      <footer class="item">F</footer>
    </div>
    <div class="actual"></div>
  </div>
  <div class="case" data-id="34" data-expect="display:grid">
    <div class="label">34. .反叵字形</div>
    <div class="classes">反叵字形</div>
    <div class="container 反叵字形" style="width:400px;height:200px">
      <header class="item">H</header>
      <main class="item main">M</main>
      <div class="item sidebar near-right">R</div>
      <footer class="item">F</footer>
    </div>
    <div class="actual"></div>
  </div>
  <div class="case" data-id="35" data-expect="display:grid">
    <div class="label">35. .目字形 / .三字形</div>
    <div class="classes">目字形</div>
    <div class="container 目字形" style="width:300px;height:150px">
      <header class="item">H</header>
      <main class="item main">M</main>
      <footer class="item">F</footer>
    </div>
    <div class="actual"></div>
  </div>
</div>
```

- [ ] **Step 4: 提交**

```bash
git add d:\工作\css\test\basics.html
git commit -m "test: basics.html — flex/grid专属和预设布局用例"
```

---

### Task 4: 创建 layout.html — 笛卡尔积测试

**Files:**
- Create: `d:\工作\css\test\layout.html`

- [ ] **Step 1: 创建文件骨架（复用 basics.html 的样式和 verify 函数）**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<title>layout.css 布局组合测试</title>
<link rel="stylesheet" href="../css/layout.css">
<style>
/* 复用 basics.html 的样式，额外增加 */
body { padding: 20px; font-family: sans-serif; font-size: 14px; }
h1 { border-bottom: 2px solid #333; }
h2 { margin-top: 30px; color: #555; border-bottom: 1px solid #999; }
#summary { position: sticky; top: 0; z-index: 100; padding: 8px 16px;
  font-size: 14px; font-weight: bold; margin-bottom: 10px; }
.section { margin: 15px 0; display: flex; gap: 12px; flex-wrap: wrap; align-items: flex-start; }
.case { border: 1px solid #999; padding: 8px; background: #fafafa; font-size: 11px; }
.case.pass { background: #e8f5e9; border-color: #4caf50; }
.case.fail { background: #ffebee; border-color: #f44336; }
.case .label { font-weight: bold; margin-bottom: 2px; }
.case .classes { font-family: monospace; color: #555; margin-bottom: 4px; font-size: 10px; }
.case .actual { font-family: monospace; color: #c62828; display: none; font-size: 10px; }
.case.fail .actual { display: block; }
.container { border: 2px solid #333; background: #f5f5f5; }
.item { background: #a5d6a7; border: 1px solid #333;
  display: flex; align-items: center; justify-content: center; font-weight: bold; color: #333; }
/* grid 容器固定轨道 */
.container.grid { grid-template-columns: 70px 70px 70px; grid-template-rows: 50px 50px;
  width: 230px; height: 130px; gap: 0; }
.container.grid .item { width: 40px; height: 25px; }
/* flex 容器尺寸 */
.container.flex { width: 230px; min-height: 100px; gap: 0; }
.container.flex .item { width: 50px; height: 30px; }
/* 多行 flex 容器 */
.container.flex.multi { flex-wrap: wrap; width: 130px; }
.container.flex.col-multi { flex-wrap: wrap; height: 80px; width: 200px; }
</style>
</head>
<body>
<h1>layout.css 布局组合测试（content-Z 默认书写模式）</h1>
<div id="summary"></div>

<script>
// ========== verify（同 basics.html） ==========
function verify() {
  let pass = 0, fail = 0;
  document.querySelectorAll('.case').forEach(c => {
    const expectStr = c.dataset.expect || '';
    const expect = {};
    expectStr.split(/\s+/).filter(Boolean).forEach(pair => {
      const [prop, val] = pair.split(':');
      if (prop && val) expect[prop] = val;
    });
    const cs = getComputedStyle(c.querySelector('.container'));
    let ok = true, actuals = [];
    for (const [prop, val] of Object.entries(expect)) {
      const actual = cs[prop];
      if (actual !== val) { ok = false; actuals.push(prop + ':' + actual + '≠' + val); }
    }
    c.classList.add(ok ? 'pass' : 'fail');
    if (!ok) {
      const el = c.querySelector('.actual');
      if (el) el.textContent = actuals.join(' ');
    }
    if (ok) pass++; else fail++;
  });
  const s = document.getElementById('summary');
  const allPass = fail === 0;
  s.style.background = allPass ? '#e8f5e9' : '#ffebee';
  s.style.color = allPass ? '#2e7d32' : '#c62828';
  s.textContent = pass + ' 通过 / ' + fail + ' 失败 / ' + (pass+fail) + ' 总计' + (allPass ? ' ✓' : ' ✗');
}
</script>
</body>
</html>
```

- [ ] **Step 2: 添加 JS 批量生成函数**

在 `verify` 函数之后、`</script>` 之前插入：

```js
// ========== 用例生成 ==========
let caseId = 100;

function makeCase(containerClass, itemCount, expect, label) {
  const div = document.createElement('div');
  div.className = 'case';
  div.dataset.id = caseId;
  div.dataset.expect = expect;
  div.innerHTML = '<div class="label">' + caseId + '. ' + label + '</div>'
    + '<div class="classes">' + containerClass + '</div>'
    + '<div class="container ' + containerClass + '">'
    + Array(itemCount).fill('<div class="item">X</div>').join('')
    + '</div><div class="actual"></div>';
  document.getElementById('cases').appendChild(div);
  caseId++;
}

// ========== 期望值生成函数 ==========
// 方向：items-go-x → flex-direction:row, items-go-y → flex-direction:column
function dirExpect(goClass) {
  if (goClass.includes('items-go-y')) return 'flex-direction:column';
  if (goClass.includes('items-go-x')) return 'flex-direction:row';
  return 'flex-direction:row'; // 默认
}

// from-* 修饰
function fromExpect(goClass, fromClass) {
  if (fromClass === 'items-from-right') return 'flex-direction:row-reverse';
  if (fromClass === 'items-from-bottom') return 'flex-direction:column-reverse';
  return dirExpect(goClass);
}

// 分布期望：根据 go 方向和分布类，确定检查 justify-content 还是 align-content
function distExpect(goClass, distClass) {
  const isY = goClass.includes('items-go-y');
  const map = {
    'items-near-left':   isY ? 'align-content:start align-items:start' : 'justify-content:start justify-items:start',
    'items-near-right':  isY ? 'align-content:end align-items:end' : 'justify-content:end justify-items:end',
    'items-near-top':    isY ? 'justify-content:start justify-items:start' : 'align-content:start align-items:start',
    'items-near-bottom': isY ? 'justify-content:end justify-items:end' : 'align-content:end align-items:end',
    'items-x-stretch':   isY ? 'align-content:stretch align-items:stretch' : 'justify-content:stretch justify-items:stretch',
    'items-y-stretch':   isY ? 'justify-content:stretch justify-items:stretch' : 'align-content:stretch align-items:stretch',
    'items-stretch':     'place-content:stretch place-items:stretch',
    'items-x-near-center':  isY ? 'align-content:center' : 'justify-content:center justify-items:center',
    'items-y-near-center':  isY ? 'justify-content:center' : 'align-content:center align-items:center',
    'items-near-center':    'place-content:center place-items:center',
    'items-x-space-between': isY ? 'align-content:space-between' : 'justify-content:space-between',
    'items-y-space-between': isY ? 'justify-content:space-between' : 'align-content:space-between',
    'items-space-between': 'place-content:space-between',
    'items-x-space-evenly': isY ? 'align-content:space-evenly' : 'justify-content:space-evenly',
    'items-y-space-evenly': isY ? 'justify-content:space-evenly' : 'align-content:space-evenly',
    'items-space-evenly': 'place-content:space-evenly',
    'items-x-space-around': isY ? 'align-content:space-around' : 'justify-content:space-around',
    'items-y-space-around': isY ? 'justify-content:space-around' : 'align-content:space-around',
    'items-space-around': 'place-content:space-around',
  };
  return map[distClass] || '';
}

// flex-direction 用于 flex 容器
function flexDirExpect(goClass, fromClass) {
  if (fromClass) return fromExpect(goClass, fromClass);
  return dirExpect(goClass);
}

// grid-auto-flow 用于 grid 容器
function gridFlowExpect(goClass) {
  if (goClass.includes('items-go-y')) return 'grid-auto-flow:column';
  return 'grid-auto-flow:row';
}
```

- [ ] **Step 3: 批量生成 Grid 用例**

```js
// ========== Grid 用例 ==========
document.write('<h2>Grid</h2><div id="cases" class="section"></div>');

// Grid 方向用例
const gridGos = ['items-go-x', 'items-go-y'];
const gridDists = [
  'items-near-left', 'items-near-right', 'items-near-top', 'items-near-bottom',
  'items-x-stretch', 'items-y-stretch', 'items-stretch',
  'items-x-near-center', 'items-y-near-center', 'items-near-center',
  'items-x-space-between', 'items-y-space-between', 'items-space-between',
  'items-x-space-evenly', 'items-y-space-evenly', 'items-space-evenly',
  'items-x-space-around', 'items-y-space-around', 'items-space-around',
];

gridGos.forEach(go => {
  gridDists.forEach(dist => {
    const cls = 'grid ' + go + ' ' + dist;
    const flow = gridFlowExpect(go);
    const distE = distExpect(go, dist);
    makeCase(cls, 4, flow + ' ' + distE, cls);
  });
});

// Grid 无 go 方向（默认 row）
gridDists.forEach(dist => {
  const cls = 'grid ' + dist;
  const distE = distExpect('items-go-x', dist); // 默认横向 = go-x
  makeCase(cls, 4, 'grid-auto-flow:row ' + distE, cls);
});
```

- [ ] **Step 4: 批量生成 Flex 用例**

```js
// ========== Flex 用例 ==========
document.write('<h2>Flex</h2><div id="flex-cases" class="section"></div>');
// 切换插入目标
caseId--; // 回退，让 Grid 和 Flex 同 section
// 实际会用不同容器

const flexCombos = [
  {go: 'items-go-x', from: null},
  {go: 'items-go-x', from: 'items-from-right'},
  {go: 'items-go-y', from: null},
  {go: 'items-go-y', from: 'items-from-bottom'},
];

flexCombos.forEach(({go, from}) => {
  gridDists.forEach(dist => {
    const parts = ['flex', go];
    if (from) parts.push(from);
    parts.push(dist);
    const cls = parts.join(' ');
    const dirE = flexDirExpect(go, from);
    const distE = distExpect(go, dist);
    makeCase(cls, 3, dirE + ' ' + distE, cls);
  });
});

// Flex 无 go 方向（默认 row）
gridDists.forEach(dist => {
  const cls = 'flex ' + dist;
  const distE = distExpect('items-go-x', dist); // 默认横向
  makeCase(cls, 3, 'flex-direction:row ' + distE, cls);
});
```

- [ ] **Step 5: 手写边界用例（stretch flex子元素、from-* + near-* 反转）**

```html
<h2>边界用例</h2>
<div class="section">
  <div class="case" data-id="200" data-expect="justify-content:end justify-items:end">
    <div class="label">200. .items-go-x.items-from-right.items-near-left</div>
    <div class="classes">flex items-go-x items-from-right items-near-left</div>
    <div class="container flex items-go-x items-from-right items-near-left" style="width:230px;min-height:60px">
      <div class="item" style="width:40px;height:30px">1</div><div class="item" style="width:40px;height:30px">2</div>
    </div>
    <div class="actual"></div>
  </div>
  <div class="case" data-id="201" data-expect="justify-content:start justify-items:start">
    <div class="label">201. .items-go-x.items-from-right.items-near-right</div>
    <div class="classes">flex items-go-x items-from-right items-near-right</div>
    <div class="container flex items-go-x items-from-right items-near-right" style="width:230px;min-height:60px">
      <div class="item" style="width:40px;height:30px">1</div><div class="item" style="width:40px;height:30px">2</div>
    </div>
    <div class="actual"></div>
  </div>
  <div class="case" data-id="202" data-expect="justify-content:end justify-items:end">
    <div class="label">202. .items-go-y.items-from-bottom.items-near-top</div>
    <div class="classes">flex items-go-y items-from-bottom items-near-top</div>
    <div class="container flex items-go-y items-from-bottom items-near-top" style="width:230px;height:120px">
      <div class="item" style="width:40px;height:25px">1</div><div class="item" style="width:40px;height:25px">2</div>
    </div>
    <div class="actual"></div>
  </div>
  <div class="case" data-id="203" data-expect="justify-content:start justify-items:start">
    <div class="label">203. .items-go-y.items-from-bottom.items-near-bottom</div>
    <div class="classes">flex items-go-y items-from-bottom items-near-bottom</div>
    <div class="container flex items-go-y items-from-bottom items-near-bottom" style="width:230px;height:120px">
      <div class="item" style="width:40px;height:25px">1</div><div class="item" style="width:40px;height:25px">2</div>
    </div>
    <div class="actual"></div>
  </div>
</div>
```

- [ ] **Step 6: 最后触发验证**

在 `</script>` 之前：

```js
window.addEventListener('DOMContentLoaded', () => {
  // 等待批量生成的 DOM 就绪后验证
  setTimeout(verify, 100);
});
```

- [ ] **Step 7: 提交**

```bash
git add d:\工作\css\test\layout.html
git commit -m "test: layout.html — 笛卡尔积组合测试"
```

---

### Task 5: 创建 writing-mode.html — 书写模式全组合测试

**Files:**
- Create: `d:\工作\css\test\writing-mode.html`

- [ ] **Step 1: 创建文件骨架**

复刻 layout.html 的结构，但样式需适配竖排容器尺寸。

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<title>layout.css 书写模式测试</title>
<link rel="stylesheet" href="../css/layout.css">
<style>
body { padding: 20px; font-family: sans-serif; font-size: 14px; }
h1 { border-bottom: 2px solid #333; }
h2 { margin-top: 30px; color: #555; border-bottom: 1px solid #999; }
#summary { position: sticky; top: 0; z-index: 100; padding: 8px 16px;
  font-size: 14px; font-weight: bold; margin-bottom: 10px; }
.section { margin: 15px 0; display: flex; gap: 12px; flex-wrap: wrap; align-items: flex-start; }
.case { border: 1px solid #999; padding: 8px; background: #fafafa; font-size: 11px; }
.case.pass { background: #e8f5e9; border-color: #4caf50; }
.case.fail { background: #ffebee; border-color: #f44336; }
.case .label { font-weight: bold; margin-bottom: 2px; }
.case .classes { font-family: monospace; color: #555; margin-bottom: 4px; font-size: 10px; }
.case .actual { font-family: monospace; color: #c62828; display: none; font-size: 10px; }
.case.fail .actual { display: block; }
.container { border: 2px solid #333; background: #f5f5f5; }
.item { background: #a5d6a7; border: 1px solid #333;
  display: flex; align-items: center; justify-content: center; font-weight: bold; color: #333; }
/* 通用尺寸 */
.container.grid { grid-template-columns: 60px 60px 60px; grid-template-rows: 45px 45px;
  width: 200px; height: 110px; gap: 0; }
.container.grid .item { width: 35px; height: 22px; }
.container.flex { width: 200px; min-height: 90px; gap: 0; }
.container.flex .item { width: 40px; height: 28px; }
/* 竖排容器尺寸 */
.container.grid.content-N, .container.grid.content-И { width: 110px; height: 200px; }
.container.flex.content-N, .container.flex.content-И { width: 80px; min-height: 200px; }
</style>
</head>
<body>
<h1>layout.css 书写模式测试</h1>
<div id="summary"></div>
<script>
// verify 函数（同 layout.html）
function verify() {
  let pass = 0, fail = 0;
  document.querySelectorAll('.case').forEach(c => {
    const expectStr = c.dataset.expect || '';
    const expect = {};
    expectStr.split(/\s+/).filter(Boolean).forEach(pair => {
      const [prop, val] = pair.split(':');
      if (prop && val) expect[prop] = val;
    });
    const cs = getComputedStyle(c.querySelector('.container'));
    let ok = true, actuals = [];
    for (const [prop, val] of Object.entries(expect)) {
      const actual = cs[prop];
      if (actual !== val) { ok = false; actuals.push(prop + ':' + actual + '≠' + val); }
    }
    c.classList.add(ok ? 'pass' : 'fail');
    if (!ok) {
      const el = c.querySelector('.actual');
      if (el) el.textContent = actuals.join(' ');
    }
    if (ok) pass++; else fail++;
  });
  const s = document.getElementById('summary');
  const allPass = fail === 0;
  s.style.background = allPass ? '#e8f5e9' : '#ffebee';
  s.style.color = allPass ? '#2e7d32' : '#c62828';
  s.textContent = pass + ' 通过 / ' + fail + ' 失败 / ' + (pass+fail) + ' 总计' + (allPass ? ' ✓' : ' ✗');
}
</script>
</body>
</html>
```

- [ ] **Step 2: 添加期望值生成函数和批量生成逻辑**

```js
let caseId = 300;

function makeCase(containerClass, itemCount, expect, label) {
  const div = document.createElement('div');
  div.className = 'case';
  div.dataset.id = caseId;
  div.dataset.expect = expect;
  div.innerHTML = '<div class="label">' + caseId + '. ' + label + '</div>'
    + '<div class="classes">' + containerClass + '</div>'
    + '<div class="container ' + containerClass + '">'
    + Array(itemCount).fill('<div class="item">X</div>').join('')
    + '</div><div class="actual"></div>';
  document.getElementById('cases').appendChild(div);
  caseId++;
}

// 书写模式下的期望值逻辑
// content-Z: 同 layout.html
// content-S: RTL翻转 items-near-left/right 的 justify-*
// content-N: 竖排轴交换（go-x↔go-y）+ items-near-* 轴交换
// content-И: 同上但方向不同

function wmDistExpect(mode, goClass, distClass) {
  const isY = goClass.includes('items-go-y');
  const isVertical = mode === 'N' || mode === 'И';

  if (isVertical) {
    // 竖排：items-near-top/bottom → justify-*, items-near-left/right → align-*
    const vmap = {
      'items-near-left':  mode === 'N' ? 'align-content:end align-items:end' : 'align-content:start align-items:start',
      'items-near-right': mode === 'N' ? 'align-content:start align-items:start' : 'align-content:end align-items:end',
      'items-near-top':   'justify-content:start justify-items:start',
      'items-near-bottom':'justify-content:end justify-items:end',
      'items-x-stretch':  isY ? 'justify-content:stretch justify-items:stretch' : 'align-content:stretch align-items:stretch',
      'items-y-stretch':  isY ? 'align-content:stretch align-items:stretch' : 'justify-content:stretch justify-items:stretch',
      'items-stretch':    'place-content:stretch place-items:stretch',
      'items-x-near-center':  isY ? 'justify-content:center' : 'align-content:center',
      'items-y-near-center':  isY ? 'align-content:center' : 'justify-content:center',
      'items-near-center':    'place-content:center place-items:center',
      'items-x-space-between': isY ? 'justify-content:space-between' : 'align-content:space-between',
      'items-y-space-between': isY ? 'align-content:space-between' : 'justify-content:space-between',
      'items-space-between': 'place-content:space-between',
      'items-x-space-evenly': isY ? 'justify-content:space-evenly' : 'align-content:space-evenly',
      'items-y-space-evenly': isY ? 'align-content:space-evenly' : 'justify-content:space-evenly',
      'items-space-evenly': 'place-content:space-evenly',
      'items-x-space-around': isY ? 'justify-content:space-around' : 'align-content:space-around',
      'items-y-space-around': isY ? 'align-content:space-around' : 'justify-content:space-around',
      'items-space-around': 'place-content:space-around',
    };
    return vmap[distClass] || '';
  }

  if (mode === 'S') {
    // RTL：items-near-left/right 的 justify-* 翻转
    const smap = {
      'items-near-left':  isY ? 'align-content:end align-items:end' : 'justify-content:end justify-items:end',
      'items-near-right': isY ? 'align-content:start align-items:start' : 'justify-content:start justify-items:start',
    };
    if (smap[distClass]) return smap[distClass];
  }

  // Z 模式或未被 S/N/И 覆盖时，回退到 layout.html 逻辑
  return distExpect(goClass, distClass);
}

function distExpect(goClass, distClass) {
  const isY = goClass.includes('items-go-y');
  const map = {
    'items-near-left':   isY ? 'align-content:start align-items:start' : 'justify-content:start justify-items:start',
    'items-near-right':  isY ? 'align-content:end align-items:end' : 'justify-content:end justify-items:end',
    'items-near-top':    isY ? 'justify-content:start justify-items:start' : 'align-content:start align-items:start',
    'items-near-bottom': isY ? 'justify-content:end justify-items:end' : 'align-content:end align-items:end',
    'items-x-stretch':   isY ? 'align-content:stretch align-items:stretch' : 'justify-content:stretch justify-items:stretch',
    'items-y-stretch':   isY ? 'justify-content:stretch justify-items:stretch' : 'align-content:stretch align-items:stretch',
    'items-stretch':     'place-content:stretch place-items:stretch',
    'items-x-near-center':  isY ? 'align-content:center' : 'justify-content:center justify-items:center',
    'items-y-near-center':  isY ? 'justify-content:center' : 'align-content:center align-items:center',
    'items-near-center':    'place-content:center place-items:center',
    'items-x-space-between': isY ? 'align-content:space-between' : 'justify-content:space-between',
    'items-y-space-between': isY ? 'justify-content:space-between' : 'align-content:space-between',
    'items-space-between': 'place-content:space-between',
    'items-x-space-evenly': isY ? 'align-content:space-evenly' : 'justify-content:space-evenly',
    'items-y-space-evenly': isY ? 'justify-content:space-evenly' : 'align-content:space-evenly',
    'items-space-evenly': 'place-content:space-evenly',
    'items-x-space-around': isY ? 'align-content:space-around' : 'justify-content:space-around',
    'items-y-space-around': isY ? 'justify-content:space-around' : 'align-content:space-around',
    'items-space-around': 'place-content:space-around',
  };
  return map[distClass] || '';
}

function flexDirExpect(goClass, fromClass) {
  if (fromClass === 'items-from-right') return 'flex-direction:row-reverse';
  if (fromClass === 'items-from-bottom') return 'flex-direction:column-reverse';
  if (goClass.includes('items-go-y')) return 'flex-direction:column';
  return 'flex-direction:row';
}

function gridFlowExpect(goClass) {
  if (goClass.includes('items-go-y')) return 'grid-auto-flow:column';
  return 'grid-auto-flow:row';
}

const allDists = [
  'items-near-left', 'items-near-right', 'items-near-top', 'items-near-bottom',
  'items-x-stretch', 'items-y-stretch', 'items-stretch',
  'items-x-near-center', 'items-y-near-center', 'items-near-center',
  'items-x-space-between', 'items-y-space-between', 'items-space-between',
  'items-x-space-evenly', 'items-y-space-evenly', 'items-space-evenly',
  'items-x-space-around', 'items-y-space-around', 'items-space-around',
];

const flexCombos = [
  {go: 'items-go-x', from: null},
  {go: 'items-go-x', from: 'items-from-right'},
  {go: 'items-go-y', from: null},
  {go: 'items-go-y', from: 'items-from-bottom'},
];

// ========== 生成 4 种书写模式的用例 ==========
['Z', 'S', 'N', 'И'].forEach(mode => {
  const modeClass = 'content-' + mode;
  document.write('<h2>content-' + mode + '</h2><div id="cases-' + mode + '" class="section"></div>');

  // Grid + go-x/go-y
  ['items-go-x', 'items-go-y'].forEach(go => {
    allDists.forEach(dist => {
      const cls = ['grid', modeClass, go, dist].join(' ');
      const flow = gridFlowExpect(go);
      const distE = wmDistExpect(mode, go, dist);
      // 对于竖排模式，grid-auto-flow 也会受影响
      const flowAdjusted = (mode === 'N' || mode === 'И') ? gridFlowExpect(go.includes('items-go-y') ? 'items-go-x' : 'items-go-y') : flow;
      makeCase(cls, 4, flow + ' ' + distE, cls);
    });
  });

  // Grid 无 go
  allDists.forEach(dist => {
    const cls = ['grid', modeClass, dist].join(' ');
    const distE = wmDistExpect(mode, 'items-go-x', dist);
    makeCase(cls, 4, 'grid-auto-flow:row ' + distE, cls);
  });

  // Flex combos
  flexCombos.forEach(({go, from}) => {
    allDists.forEach(dist => {
      const parts = ['flex', modeClass, go];
      if (from) parts.push(from);
      parts.push(dist);
      const cls = parts.join(' ');
      const dirE = flexDirExpect(go, from);
      const distE = wmDistExpect(mode, go, dist);
      makeCase(cls, 3, dirE + ' ' + distE, cls);
    });
  });

  // Flex 无 go
  allDists.forEach(dist => {
    const cls = ['flex', modeClass, dist].join(' ');
    const distE = wmDistExpect(mode, 'items-go-x', dist);
    makeCase(cls, 3, 'flex-direction:row ' + distE, cls);
  });
});

window.addEventListener('DOMContentLoaded', () => setTimeout(verify, 100));
```

- [ ] **Step 3: 提交**

```bash
git add d:\工作\css\test\writing-mode.html
git commit -m "test: writing-mode.html — 书写模式全组合测试"
```

---

### Task 6: 验证和修复

**Files:**
- 无需修改，验证环节

- [ ] **Step 1: 在浏览器中打开 basics.html 并检查**

打开 `http://localhost:52330/test/basics.html`，确认全部通过。

- [ ] **Step 2: 在浏览器中打开 layout.html 并检查**

打开 `http://localhost:52330/test/layout.html`，逐一检查失败用例，修正 `distExpect` 映射。

- [ ] **Step 3: 在浏览器中打开 writing-mode.html 并检查**

打开 `http://localhost:52330/test/writing-mode.html`，逐一检查失败用例，修正 `wmDistExpect` 映射。

- [ ] **Step 4: 修复所有失败用例后提交**

```bash
git add d:\工作\css\test\layout.html d:\工作\css\test\writing-mode.html
git commit -m "fix: 修正测试期望值映射"
```
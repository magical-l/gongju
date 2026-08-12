# 字符作画页 floatPanel 拆解 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** 把 #floatPanel 管风琴拆成三个独立呈现：素材库→右侧固定栏、图层→瘦长条（素材库左沿）、已选元素→画布内浮层（贴元素可拖离），消除空间竞争，保留全部现有功能。

**Architecture:** editor 改 flex 双区——左侧 canvas-card（画布，flex:1）+ 右侧固定组合（图层瘦长条 + 素材库栏）。floatPanel 只剩已选元素面板并移入 sceneCanvas 内（随画布 transform）。图层瘦长条由 `refreshLayers` 渲染字符列，拖拽排序替代原上移/下移按钮。

**Tech Stack:** 纯静态 HTML/CSS/JS（vanilla），无构建。运行时验证用 Playwright。

**执行说明（本项目特有）：** 本项目无单测框架。每个任务的"实施"由 html-editor 子代理完成（读文件→改→自闭环语法/平衡检查）；"验证"由 testing 子代理用 Playwright 在 `http://localhost:52330/` 打开页面实测。CSS 受 css-edit-safety 守卫限制：含 `>` 的选择器改名/多行改动走 `ensure-rule` 等 css-ast 事务工具，html-editor 已掌握此流程。

## Global Constraints

- 不引入 npm 包/构建流程；纯静态三文件（html/css/js）
- 保留：撤销/重做、自动保存（pushHistory/undo/redo→autoSave）、拖拽移动、缩放固定中心、多选、画布平移缩放、新建/打开/清空
- 图层瘦长条宽 ~36px；素材库固定栏宽 ~300px；均不覆盖画布
- 已选元素浮层：无选中隐藏；单选贴元素右上（画布相对坐标）；拖标题栏可脱离跟随；画布平移/缩放时浮层随 sceneCanvas transform（不重新贴住）；拖动元素不重贴
- 多选：浮层切批量模式，贴最近点选元素
- 不扩大化：本次只做结构拆解，素材库内容/符号分组、滑块逻辑等不动

---

## 文件结构

| 文件 | 职责 | 改动 |
|------|------|------|
| `字符作画/字符作画.html` | 页面骨架 | editor 结构重组：canvas-card + right-side（layer-rail + library-bar）；floatPanel 只留 propsPanel 移入 sceneCanvas；删 libraryPanel/layerPanel details |
| `字符作画/字符作画.css` | 样式 | editor 双区布局；library-bar 固定栏；layer-rail 瘦长条；floatPanel 浮层定位；删旧管风琴样式 |
| `字符作画/字符作画.js` | 逻辑 | refreshLayers→渲染 layer-rail 字符列 + 拖拽排序；selectElement→浮层定位（贴元素/拖离/多选/隐藏）；删 layer-list 按钮逻辑 |

---

### Task 1: 素材库拆到右侧固定栏

**Files:**
- Modify: `字符作画/字符作画.html`（editor 结构、floatPanel 内删 libraryPanel）
- Modify: `字符作画/字符作画.css`（editor flex 双区、library-bar 样式、删 symbols-scroll 旧约束）

**Interfaces:**
- Consumes: 现有 `#emojiSymbolsContainer`、`#normalSymbolsContainer`、`.tab-bar`（id 保留，仅移动 DOM 位置）
- Produces: `.library-bar` 容器（editor 右侧固定栏，内含 tab-bar + 两个 symbols-scroll 容器）；floatPanel 中不再有 `#libraryPanel`

- [x] **Step 1: HTML 重组 editor**

将 `#topToolbar` 之后的 `<section class="editor">` 结构改为：
```html
<section class="editor">
    <div class="canvas-card canvas-container" id="canvasContainer">
        <div class="scene-canvas" id="sceneCanvas"></div>
        <div class="float-panel" id="floatPanel">
            <!-- 仅剩 propsPanel（已选元素），libraryPanel/layerPanel 待拆 -->
        </div>
    </div>
    <div class="right-side">
        <div class="layer-rail" id="layerRail"></div>
        <aside class="library-bar">
            <div class="tab-bar flex items-single-line">
                <button class="tab-btn active" data-tab="emoji">😊 Emoji</button>
                <button class="tab-btn" data-tab="normal">🔤 普通符号</button>
            </div>
            <div id="emojiSymbolsContainer" class="symbols-scroll"></div>
            <div id="normalSymbolsContainer" class="symbols-scroll" style="display:none;"></div>
        </aside>
    </div>
</section>
```
即：把 `.tab-bar` + 两个 `symbols-scroll` 从 `#libraryPanel` 移到 `.right-side` 内新 `.library-bar`；floatPanel 里删除整个 `<details id="libraryPanel">`；保留 `#propsPanel`（图层 details 也暂保留，Task 2 拆）。

- [x] **Step 2: CSS 双区布局 + library-bar**

`.editor` 保持 flex；新增：
```css
.right-side {
    display: flex;
    flex-direction: row;
    align-items: stretch;
    flex-shrink: 0;
    width: 336px; /* 300 栏 + 36 条 */
}
.library-bar {
    flex: 1;
    overflow-y: auto;
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-lg);
    background: var(--bg-base);
    padding: 0.75rem;
}
```
删旧 `.float-panel details`/`.symbols-scroll` 的 max-height/overflow 约束（`.symbols-scroll` 现由 `.library-bar` 高度约束滚动）。floatPanel 不再 flex 管风琴。

- [x] **Step 3: 自闭环检查**

html-editor 改完跑 node --check（js 未动可跳过）+ HTML 标签配对 + CSS 花括号平衡。确认 `#libraryPanel`、`#emojiSymbolsContainer`、`#normalSymbolsContainer` 各 id 唯一且 JS 引用不失效（buildGroupedSymbols/initTabs 用 getElementById，位置无关）。

- [x] **Step 4: 运行时验证（testing）**

Playwright：素材库在右侧固定栏渲染（tab 切换正常、符号拖入画布成功）；画布区变窄但 800px 画布完整可见；floatPanel 仅剩已选元素+图层 details；控制台无 error。

- [x] **Step 5: Commit**

```bash
git add 字符作画/
git restore --staged 字符作画/todo.txt
git commit -m "重构：字符作画页素材库拆到右侧固定栏"
```

---

### Task 2: 图层瘦长条（拖拽排序）

**Files:**
- Modify: `字符作画/字符作画.html`（floatPanel 删 layerPanel，layerRail 已就位）
- Modify: `字符作画/字符作画.css`（layer-rail 样式）
- Modify: `字符作画/字符作画.js`（refreshLayers→渲染 layer-rail；拖拽排序；删 layer-list 按钮逻辑）

**Interfaces:**
- Consumes: `selectElement(el, opts)`（现有）、`swapLayerZ(el, dir)`（改为拖拽驱动）、`getSelectionTargets()`
- Produces: `refreshLayers()` 渲染 `#layerRail` 内 `.layer-rail-item`（字符小格）；拖拽项触发 z-index 交换 + `pushHistory()`

- [x] **Step 1: HTML 删 layerPanel**

floatPanel 内删除 `<details id="layerPanel">`，floatPanel 只剩 `#propsPanel`。

- [x] **Step 2: CSS layer-rail 瘦长条**

```css
.layer-rail {
    width: 36px;
    overflow-y: auto;
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-lg);
    background: var(--bg-base);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 4px;
    flex-shrink: 0;
}
.layer-rail-item {
    width: 100%;
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    border-radius: var(--radius-md);
    cursor: pointer;
    user-select: none;
}
.layer-rail-item:hover { background: var(--bg-subtle); }
.layer-rail-item.active { background: var(--accent-light); outline: 1px solid var(--accent-primary); }
```

- [x] **Step 3: JS 重写 refreshLayers 渲染字符列**

`refreshLayers()` 改为：按 z-index 降序收集 `#sceneCanvas .scene-item`，为每个元素创建 `.layer-rail-item`（innerText 取字符首码点；active 高亮看 `selectedSet.has(el)`；`title` 存完整字符），点击调 `selectElement(el, {additive: ctrl})`。删除原 `.layer-item`/`.layer-up/down/del` 相关渲染与按钮事件。

- [x] **Step 4: JS 拖拽排序**

给每个 `.layer-rail-item` 绑 pointer 拖拽：dragstart 记录源项 index → 拖过其他项时实时交换 z-index（复用 swapLayerZ 的交换语义）→ 拖放后 `pushHistory()` + `refreshLayers()`。注意与画布元素拖拽（makeDraggable，作用于 scene-item）区域不冲突。

- [x] **Step 5: 自闭环检查**

node --check + 平衡；grep 确认无 `layer-list`/`layer-up`/`layer-down`/`layer-del` 残留引用。

- [x] **Step 6: 运行时验证（testing）**

瘦长条层级顺序正确（上=顶层）；点击项选中画布对应元素（高亮联动）；拖拽换位改变 z-index 且可撤销；Delete 删除选中元素后瘦长条同步；空画布瘦长条空。

- [x] **Step 7: Commit**

```bash
git add 字符作画/
git restore --staged 字符作画/todo.txt
git commit -m "重构：字符作画页图层拆成瘦长条，拖拽排序"
```

---

### Task 3: 已选元素浮层（贴元素/拖离）

**Files:**
- Modify: `字符作画/字符作画.html`（floatPanel 留在 canvas-container 内，位置不动）
- Modify: `字符作画/字符作画.css`（浮层隐藏态 .visible、去默认 top/left）
- Modify: `字符作画/字符作画.js`（positionFloatPanel 定位、selectElement 调用、多选批量贴最近）

**Interfaces:**
- Consumes: `selectElement(el, opts)`、`currentSelected`、`selectedSet`、`container`（#canvasContainer）
- Produces: `positionFloatPanel(el)`（贴元素右上，canvas-container 相对坐标，getBoundingClientRect 换算）；浮层拖离逻辑（复用原 initPanelFloating）

- [x] **Step 1: HTML 不动 + CSS 隐藏态**

floatPanel 留在 `.canvas-container` 内（absolute 定位，不随 sceneCanvas 的 zoom/pan transform，避免浮层内容被缩放）。CSS：`.float-panel` 默认 `display:none`，新增 `.float-panel.visible { display:block; }`；去掉默认 `top:12px; left:12px`（改由 JS 定位，保留亦可作 fallback）。

- [x] **Step 2: CSS 边界与滚动**

`.float-panel` 保留 width/max-height/overflow（内容超高时 panel-body 内部滚，沿用现有 @supports 内 panel-body 规则）。

- [x] **Step 3: JS 定位浮层**

新增 `positionFloatPanel(el)`：`const er = el.getBoundingClientRect(); const cr = container.getBoundingClientRect();` 浮层 `left = er.right - cr.left + 8`、`top = er.top - cr.top - 12`（贴元素右上）；若 `left + 浮层宽 > container.clientWidth` 则翻转贴左（`left = er.left - cr.left - 浮层宽 - 8`）。`selectElement` 中：有选中 → `floatPanel.classList.add('visible')` + `positionFloatPanel(锚点元素)`；无选中 → `remove('visible')`。多选批量模式贴 `[...selectedSet].at(-1)`。画布平移/缩放/拖动元素**不重贴**（仅 selectElement 时定位一次）。

- [x] **Step 4: JS 拖离确认**

`initPanelFloating` 已有拖动能力（拖标题栏移动、松手停留），确认它不调用 positionFloatPanel（拖动元素/画布变换都不重贴）；重新 selectElement 时重贴。多选切换（selectElement 再次触发）仍重新贴。

- [x] **Step 5: 自闭环检查**

node --check + 平衡；确认 floatPanel 不再引用 `#propsPanelTitle` 以外被删元素。

- [x] **Step 6: 运行时验证（testing）**

选中元素浮层贴右上浮现；画布平移缩放后浮层随画布（不重贴）；拖动元素后浮层不动；拖浮层标题可脱离且停留；Ctrl 多选切批量模式贴最近元素；点画布空白/取消选中浮层隐藏；滑块操作正常。

- [x] **Step 7: Commit**

```bash
git add 字符作画/
git restore --staged 字符作画/todo.txt
git commit -m "重构：字符作画页已选元素拆成贴元素浮层"
```

---

### Task 4: 清理与全回归

**Files:**
- Modify: `字符作画/字符作画.css`（删死代码：旧 `.float-panel details`、`::details-content`、`.panel-body`、`.symbols-scroll`、`.layer-list` 等）
- Modify: `字符作画/字符作画.js`（删图层按钮/面板残留引用；确认自动保存快照 `captureSnapshot` 仍正确含 left/top/fontSize）

**Interfaces:**
- Consumes: 前 3 个任务的产出
- Produces: 无死代码、全功能通过的最终状态

- [x] **Step 1: 清理 CSS 死代码**

删除不再使用的规则（由 html-editor 用 css-ast 事务工具删除：`.float-panel details`、`details::details-content`、`.panel-body`、`.layer-list`、`.layer-item` 等，注意含 `>` 的选择器用 ensure-rule/remove 流程处理）。grep 确认无死选择器。

- [x] **Step 2: 清理 JS 残留**

grep 确认无 `layerPanel`/`layer-list`/`multiSelectPanel` 错误引用；`captureSnapshot`/`applySnapshot` 不含面板 DOM（本就只抓 scene-item，确认未破坏）。

- [x] **Step 3: 全功能回归（testing）**

完整回归：撤销/重做、自动保存（编辑后刷新恢复）、拖拽移动、缩放固定中心、多选移动/删除、画布平移缩放、新建/打开/清空、素材库拖入、复制字符、图层拖拽排序。控制台全程无 error。

- [x] **Step 4: 收尾（用户确认验收后）**

更新决策文档 `docs/2026-08-11-字符作画-风格统一与功能增强.md` 追加本次重构章节 + commit。

---

## Self-Review

- **Spec 覆盖**：素材库右栏（T1）、图层瘦长条+拖拽排序（T2）、已选元素贴元素/拖离/多选（T3）、清理回归（T4）——均覆盖。
- **占位符**：无 TBD/TODO。
- **类型/命名一致**：`refreshLayers`、`selectElement`、`swapLayerZ`、`positionFloatPanel` 在任务间一致；`#layerRail`/`.library-bar`/`.right-side` id/类名全局一致。

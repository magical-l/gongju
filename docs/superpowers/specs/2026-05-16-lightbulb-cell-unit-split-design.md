# 点灯游戏 cell/unit 拆分设计

## 目标

将点灯游戏的 `.cell` 拆分为格子容器 + 单位灯泡，实现：
1. 语义清晰 - 格子承载单位，概念分层
2. 单位可独立展示 - 不依赖格子，可在棋子库等场景复用

## HTML 结构

```html
<div class="cell">
  <div class="unit light">
    <svg viewBox="0 0 24 24" stroke-width="1.5">
      <path d="M9 21h6"/>
      <path d="M12 3a6 6 0 0 0-6 6c0 2.5 2 4.5 2 6.5V17h8v-1.5c0-2 2-4 2-6.5a6 6 0 0 0-6-6z"/>
    </svg>
  </div>
</div>
```

## CSS 设计

### 格子 `.cell`

容器角色，只负责定位和尺寸：

```css
.cell {
  width: var(--cell-size);
  height: var(--cell-size);
  display: flex;
  align-items: center;
  justify-content: center;
  /* 不再有 cursor、transition、hover */
}
```

### 单位 `.unit.light`

交互和视觉的核心：

```css
.unit.light {
  width: 60%; /* 相对格子尺寸 */
  height: 60%;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover { scale: 1.05; }
  
  /* SVG 样式 */
  svg {
    width: 100%;
    height: 100%;
  }
}
```

### 状态样式

**灯灭 `.off`**：
```css
.unit.light.off {
  svg {
    fill: none;
    stroke: #666;
  }
}
/* 格子背景保持默认 #d4e0c8 */
```

**灯亮 `.on`**：
```css
.unit.light.on {
  /* 光晕溢出到格子外 */
  position: relative;
  
  svg {
    fill: #ffd700;
    stroke: #ffa500;
  }
  
  /* 光晕效果 */
  &::before {
    content: '';
    position: absolute;
    inset: -50%; /* 溢出到格子外 */
    background: radial-gradient(circle, 
      rgba(255,215,0,0.3) 0%, 
      rgba(255,228,181,0.2) 40%, 
      transparent 70%);
    z-index: -1;
  }
}
```

**格子被照亮**：
```css
.cell.has-light {
  background: radial-gradient(circle at center,
    #fff 0%,
    #fffacd 50%,
    #ffe4b5 100%);
}
```

### 棋盘 gap 调整

光晕溢出效果需要格子间距为 0：

```css
.board.map {
  gap: 0; /* 从 0.5rem 改为 0 */
}
```

光晕通过伪元素 `inset: -50%` 溢出到相邻格子，gap 为 0 时效果最完整。

## 状态管理

JS 需要同步更新：
- `.cell.has-light` - 格子被照亮
- `.unit.light.on` / `.off` - 单位状态

当前逻辑（点击切换）保持不变，只是 CSS 选择器从 `.cell.on/.off` 改为 `.unit.light.on/.off`。

## 拆分后的好处

1. **语义清晰**：`.cell` 是位置容器，`.unit` 是可交互对象
2. **单位独立**：灯泡可以在格子外展示（如选中预览、棋子库）
3. **样式分离**：格子样式在 game.css，单位样式在具体游戏
4. **复用模式**：其他游戏可沿用 `.cell > .unit` 结构

## 需要修改的文件

1. `游戏/点灯.html`：
   - HTML：`.cell` 内添加 `.unit.light`
   - CSS：移动 cursor/hover 到 `.unit`
   - CSS：添加灯泡 SVG 样式和光晕效果
   - CSS：`.board.map` gap 改为 0

2. `游戏/game.css`：
   - `.cell` 去掉交互相关样式（cursor 等）
   - `.unit` 补充基础样式（如交互提示）

3. JS 逻辑：
   - 状态类名从 `.cell.on/.off` 改为 `.unit.light.on/.off`
   - 添加 `.cell.has-light` 状态管理
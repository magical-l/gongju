# CSS 多动画时序调试纪要

## 根因

同一元素上多个 `animation`，`animation-fill-mode: backwards` 同时生效时，**后面动画的 0% 帧覆盖前面动画的 0% 帧**。

```css
/* BUG：deal-card 0% 的 opacity:1 覆盖了 stack-drop 0% 的 opacity:0 */
animation:
    stack-drop 0.15s 0.3s both,   /* 0%: opacity:0 ✓  */
    deal-card 0.5s 0.45s both;    /* 0%: opacity:1 ✗ 覆盖上面 */
```

展开瞬间 `deal-card` 的 `backwards` fill 把卡片设成 `opacity: 1`，封口还没翻完卡片就现身。

## 解法

后续动画的 0% 帧**不声明想继承的属性**（留空），fill 用 `forwards` 而非 `both`：「延迟期间不做任何事，启动时从当前计算值过渡」。

```css
/* 正确：deal-card 0% 空，forwards 不干预延迟期 */
animation:
    stack-drop 0.15s 0.3s both,
    deal-card 0.5s 0.45s forwards;  /* 0% {} 空帧 */

@keyframes deal-card {
    0% {}                    /* 不设任何属性 */
    100% { transform: ...; } /* 只设自己要管的属性 */
}
```

`deal-card` 启动时 `transform` 从 `stack-drop` fill 值自然过渡到终值。

## 调试方法

从最简测试页开始，每次只加一个变量，定位到出问题的那一步：

1. 单动画 + 硬值 → 确认基础时序对
2. +`var()` 在关键帧 → 确认变量可用
3. +`calc()` + `var()` 在 delay → 确认可用
4. +第二个动画 → **此处出问题**
5. 隔离是否是 `calc/var` 导致的 → 不是，硬值也一样
6. F12 逐个禁用动画的 `transform` / `opacity` / `fill-mode` → 定位到 `backwards` fill 的 `opacity` 冲突

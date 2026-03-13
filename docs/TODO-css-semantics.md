# CSS / 语义与结构 待办

记录与样式、类名、DOM 结构相关的约定与后续待统一事项，避免遗忘或重新理清上下文成本过高。

---

## 游戏结果弹层类名统一

- **目标**：将「游戏结果」弹层的 class 从单类 `.game-result` 统一为双类 `.game .result`，语义更通顺（“游戏” + “结果”），并与 2048 已采用的 `.game.result .hint` 等选择器一致。
- **待改页面**：中国象棋等仍使用 `class="game-result"` 的页面。
- **操作**：HTML 中 el-dialog（或对应容器）改为 `class="game result"`；相关 CSS 选择器由 `.game-result` 改为 `.game.result`；若有 `.result-hint` 等子类，可一并按 2048 的 `.hint` 方案收敛。

---

## 其他可补充项

（日后有类似“全站统一”“先记下再改”的约定，可继续追加本节。）

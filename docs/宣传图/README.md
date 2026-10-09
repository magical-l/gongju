# 宣传图（首页卡片缩略图）

首页每张卡片顶部那张图。**不是页面截图，是按「这个工具主要干嘛」画出来的示意图**——页面会改版，示意图不用跟着改。

## 画面约定

- **构图**：左「输入什么」→ 中箭头 → 右「出什么」
- **画布**：固定 `1000 × 560`（与卡片图区同比例）
- **配色**：画布底 `#eef0f7`（分类色紫苑 `#757cbb` 的极浅版）、主体 `#3d3f57`、强调 `#757cbb`。分类色与 `resources/home.css` 里的 `[data-cat]` 保持一致
- **铺满**：每个元素尽量撑开画面，不留大块空白
- **按卡片尺寸定字号**：图在首页卡片里只显示成约 330px 宽，**缩放比约 0.33**。凡是要让人认出来的文字，画布字号 = 目标屏幕字号 ÷ 0.33 —— 想让代码在卡片上有 9px，画布里就得 28px。反过来，画布里 20px 的字落到卡片上只有 6.6px，等于看不清。
  这条约束会倒逼内容重排：`svg转图标.html` 的示例代码就是为了配合 28px 字号（每行只装约 30 字符）按短行重新断行过的。

### 变体：符号（2026-10-09）——不走「输入→箭头→输出」

`符号.html` 是另一路画法：**页面的缩小复刻**，因为符号这工具没有「输入输出」，它的卖点就是「字符多、按标签找得到」。

- **画布 260 × 166**（卡片图区净尺寸）**按 3× 渲染** = 780 × 498。字号不按上面那条倒推，直接把真实页面的尺寸照搬，再整体放大 3 倍——这样字距行距跟线上一致。
- **左栏**：标签树，80px 宽。选中「自然 / 生物 / 植物 / 花朵」，带父级、兄弟姐妹、叔伯。
  四个硬要求：窄、行铺满列高、**选中态不能把文字挤右**（用 `box-shadow: inset` 不用 `border-left`）、三角收展符保留。
  行尾**不列成员数**（用户要求）。
- **右栏**：5 × 5 网格。成员**从「花朵」标签里手挑、顺序手排**，照搬页面顺序没有意义——**网格是按码点顺序分页的**，一页往往只有一种文字，看不出「什么都有」。
- **取名字要走真实页面的顺序**：该标签子树里最深的已命名组 → 条目级主名 → 直译名。只查后两层会显示直译名。
- ⚠️ **不要给整块加 `font-variant-emoji: text`**。真实页面只把它加在「文本变体」那个小标签上（`.vs-text` / `.variant.text`），网格卡片是 `normal`——emoji 在网格里是**彩色**的。加错会做出一屏黑白 emoji。
- ⚠️ **墨迹比字号框大的字符**（如 `꧁ ꧂`，13px 字号画出 20px 墨迹）会顶出格子压到邻居。约定：**这种字符不进图**，别靠裁剪或缩小字号救——用户认为「字形溢出」本身会让访客以为是 bug。

## 怎么出图

1. 起本地静态服务（`python -m http.server`），浏览器打开本目录下的 `<工具名>.html`
2. 用 Playwright 截图。**视口要开得比画布大**（如 `1240 × 820`），再按画布区域 `clip` 裁：

   ```js
   await page.setViewportSize({ width: 1240, height: 820 });
   const b = await page.evaluate(() => {
     const r = document.body.getBoundingClientRect();
     return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)];
   });
   await page.screenshot({ path: 'shot.png', clip: { x: b[0], y: b[1], width: b[2], height: b[3] } });
   ```

   **不能直接用视口尺寸截图**：Playwright MCP 会在视口右下角画一个实例角标，它会被截进图片、又不在 DOM 里删不掉。放大视口后裁剪就能把它落在框外。

   `符号.html` 这种整页就是画布的，可以直接对元素截图，省掉裁剪：

   ```js
   await page.locator('.thumb').screenshot({ path: 'shot.png' });
   ```

3. 用 Pillow 缩到宽 760、存 JPEG 到该工具所在目录的 `thumbnails/`：

   ```python
   from PIL import Image
   im = Image.open('shot.png').convert('RGB')
   im = im.resize((760, round(im.height * 760 / im.width)), Image.LANCZOS)
   im.save('编解码/thumbnails/svg转图标.jpg', 'JPEG', quality=86, optimize=True, progressive=True)
   ```

4. 在 `resources/tools.js` 填 `thumb` 字段、在 `index.html` 把图标占位换成 `<img class="tool thumb">`

## 现有

| 文件 | 对应的工具 | 状态 |
|---|---|---|
| `svg转图标.html` | 编解码/svg转图标.html | 定稿 |
| `符号.html` | 符号/符号.html | 定稿（缩小复刻画法，见上） |


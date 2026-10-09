# 宣传图（首页卡片缩略图）

首页每张卡片顶部那张图。**不是页面截图，是按「这个工具主要干嘛」画出来的示意图**——页面会改版，示意图不用跟着改。

## 画面约定

- **构图**：左「输入什么」→ 中箭头 → 右「出什么」
- **画布**：固定 `1000 × 560`（与卡片图区同比例）
- **配色**：画布底 `#eef0f7`（分类色紫苑 `#757cbb` 的极浅版）、主体 `#3d3f57`、强调 `#757cbb`。分类色与 `resources/home.css` 里的 `[data-cat]` 保持一致
- **铺满**：每个元素尽量撑开画面，不留大块空白
- **按卡片尺寸定字号**：图在首页卡片里只显示成约 330px 宽，**缩放比约 0.33**。凡是要让人认出来的文字，画布字号 = 目标屏幕字号 ÷ 0.33 —— 想让代码在卡片上有 9px，画布里就得 28px。反过来，画布里 20px 的字落到卡片上只有 6.6px，等于看不清。
  这条约束会倒逼内容重排：`svg转图标.html` 的示例代码就是为了配合 28px 字号（每行只装约 30 字符）按短行重新断行过的。

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

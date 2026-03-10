# 2048 网页版（工具兽）

## 与小程序端共享成果

**可以共享的：** 游戏逻辑与设置结构。

- **logic.js**、**constants.js** 是两端共用的“核心”：相同的状态结构（board、score、customLabels、customImages 等）、相同的 API（`initGame`、`doMove`、`restart`、`undo`、序列化等）。  
- **增加或修改功能时**（例如新增设置项、新规则）：  
  1. 在**一端**改好 `logic.js` 和/或 `constants.js`。  
  2. 把这两个文件**复制到另一端**对应目录（工具兽：`游戏/2048/`；小程序：`miniprogram/games/2048/`）。  
  3. 两端即可共享同一套逻辑与设置定义。

**各自实现的：** 界面与交互。

- 网页：**2048-dom.js** + **2048.css** + **2048.html**（DOM 渲染、设置表单、本地选图等）。  
- 小程序：**index.ts**（Canvas 绘制、微信 API 选图等）。

因此“共享成果”的方式是：**复制并同步 logic.js、constants.js**；UI 需在各自项目里实现或按需移植思路。

---

## 约定（网页端）

- **Element Plus 组件不能使用自闭合标签**：必须写完整闭合标签，例如 `<el-button>新局</el-button>`，不要写成 `<el-button />`，否则图标等插槽内容可能不显示。

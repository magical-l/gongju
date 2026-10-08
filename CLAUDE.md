# 工具兽 · 静态页面工具

## 项目概览

纯静态 MPA（多页 HTML），每个页面独立文件，页面跳转靠浏览器整页加载。无构建工具、无包管理器。

## 目录结构

```
.                          # 先是根目录的几个页面，后来页面文件多了才建子目录
├── index.html             # 站点首页：全站工具索引（卡片 + 分类筛选）
├── 买房/                  # 买房费用计算器
├── 化学/                  # 元素周期表等
├── 拼音/                  # 拼音工具（数据在 JSON 文件中）
├── 数学/                  # 数学小达人口算练习（设计见 docs/superpowers/specs/2026-10-04-数学口算练习增强-design.md）
├── 符号/                  # 符号工具（文档体系见 符号/docs/README.txt，数据规格见 符号/docs/设计/数据说明.md）
├── 计科/unicode/          # Unicode 工具
├── css/                   # CSS 布局实验室（子项目，含自己的 CLAUDE.md / docs / demo / test）
├── 游戏/                  # 所有游戏
│   ├── 2048/ 2048方块/ 2048蛇/  # 2048 系列
│   ├── 五子棋/
│   ├── 中国象棋/
│   ├── 贪吃蛇/
│   ├── 俄罗斯方块/
│   ├── 数字华容道/
│   ├── 点灯/
│   ├── 星连星/
│   ├── 塔防/
│   ├── game.css           # 游戏共享样式
│   ├── kit.esm.js         # 游戏通用工具库
│   ├── turn-based-game.esm.js  # 回合制游戏框架
│   ├── battlefield-module.esm.js # 战场模块
│   └── unit-module.esm.js  # 单位模块
├── lib/                   # 第三方库（全部 vendored，无 CDN 强依赖）
│   ├── vue/3.5.18/        # Vue 3 global build
│   ├── element-plus/2.10.7/ # Element Plus
│   ├── fonts/             # 字体文件
│   └── ...                # jquery, js-base64, js-md5, js-sha1, pako, toastr
├── resources/             # 项目自有资源
│   ├── tools.js           # 全站工具清单（window.TOOLS）——首页卡片与各页导航的唯一数据源
│   ├── site-nav.js        # 子页顶部导航渲染（读 tools.js，按 data-root 拼相对路径）
│   ├── home.css           # 首页样式（自成一套，不加载其它样式表）
│   ├── thumbnails/        # 首页卡片缩略图
│   ├── biz.css            # 业务组件样式
│   ├── el-plus.css        # Element Plus 覆盖样式
│   ├── biz-util.js        # 业务工具函数
│   ├── c-chooser.js       # 自定义选择器组件
│   ├── c-input.js         # 自定义输入组件
│   ├── debug-utils.js     # 调试工具
│   ├── ue.js              # 跨页面通用（ue = utils & extensions）
│   ├── util.js            # 工具函数
│   └── math.js            # 数学工具
├── docs/                  # 文档
│   └── superpowers/       # 超级技能文档
└── test/                  # 测试
    └── ...                # 通常放在游戏子目录的 test/ 下
```

## 技术栈

| 技术 | 使用方式 |
|------|---------|
| **Vue 3** | global build，`Vue.createApp().mount('main')` |
| **Element Plus 2.10.7** | 全局引入，CSS 使用 `@import ... layer(el-plus)` |
| **ES Modules** | 游戏使用 `.esm.js` 扩展名的 ES module |
| **Vanilla JS** | 简单工具页面直接内联 script |
| **CSS** | 嵌套语法（`&` 显式标注后代），`@layer` 隔离 |
| **测试** | 简单 spec 文件 + 手动调试页面 |

## CSS 约定

- **全局样式**：`css/common.css`（基础重置、CSS 变量、组件）、`css/layout.css`（布局系统）、`css/花活.css`（花式效果）——全本地加载，无远程 CDN 依赖
- **CSS 布局实验室子项目**（`css/`）：模块文档 `css/docs/modules/`（common/layout/花活），页面分 `demo/`（使用范式）、`test/`（正确性）、`trial/`（试效果）；版本号在 `common.css` 头部 `/* vX.Y.Z */`；改 css 后同步对应模块文档（追加决策日志 + 更新 last_updated）
- **业务样式**：`resources/biz.css`（Element Plus 弹窗、卡片覆盖等）
- **游戏样式**：`游戏/game.css`（游戏共享变量和组件）
- **Element Plus 覆盖**：`resources/el-plus.css`
- **按需再起页面专用 CSS 文件**
- **类名含逗号**：`class="gaming area , 反叵字形 grid"`——逗号分隔不同语义组
- **类名正交拆分**：`main.board.game` 而非 `main-board-game`
- **body 布局类**：`反叵字形`（左横右纵）、`目字形`（三栏）等
- **属性顺序**：表义(id/class) > 渲染逻辑(v-if) > 样式 > 交互 > 约束 > 事件
- **CSS 变量**：游戏在 `.game` 作用域内定义 `--lv-*`、`--red-color` 等颜色变量

## JS / 架构约定

- **Vue 挂载点**：`mount('main')`
- **页面基础 DOM 结构**：`<body><header>网站导航</header><main>...</main></body>`
- **站点导航**：见下节「站点导航」
- **游戏模块**：纯 ES modules（`.esm.js`），无 importmap，直接 `<script type="module">` 引入
- **回合制游戏**：依赖 `turn-based-game.esm.js` 框架，提供 Module、Player、TurnBasedGaming、Command、Skill 等基类
- **业务组件**：`resources/biz-util.js` 中有 `ue()` 辅助函数等
- **无 TypeScript**：全部纯 JS

## HTML 约定

- **SEO meta**：每个页面包含 `itemscope itemtype`、`og:*`、`twitter:*`、keywords/description
- **CDN 兼容**：lib 目录中的 CSS 留有 CDN 链接注释（被注释掉的 jsDelivr 地址），少量走 CDN 时可切换
- **Element Plus CSS**：使用 `@import ... layer(el-plus)` 的方式加载，而非 `<link>`

## 站点导航

导航不再在各页手写复制，改由一份共用数据渲染。

- **数据源**：`resources/tools.js` 暴露 `window.TOOLS`（分类 / 图标 / 名称 / 简介 / 路径 / 缩略图）。`href`、`thumb` 都是**相对站点根**的路径，不带 `../`。
- **子页导航**：页面 `<header>` 里只写两行 + 一个空容器

  ```html
  <nav class="site nav" data-root="../"></nav>
  <script src="../resources/tools.js" defer></script>
  <script src="../resources/site-nav.js" defer></script>
  ```

  `data-root` 是该页到站点根的相对前缀：根目录页面 `""`、一级子目录 `"../"`、二级 `"../../"`。`site-nav.js` 用它拼出每个链接和目标页的路径，同时渲染成分类下拉（原生 `<details>`），并给当前页所在分类加选中态、把页头站名包成回首页的链接。
- **导航样式由 `site-nav.js` 自行注入** `<style>`：各页加载的样式栈不一致（游戏页走 `@import ... layer()`，工具页走 `<link>`），自带一份才能保证导航在每个页面长得一样。
- **首页例外**：`index.html` 不放分类下拉（首页本身就是索引），它的卡片是**静态 HTML**，不靠 JS 渲染——保证禁用 JS 时首页仍可用、链接也在源码里。

**新增一个工具页面要改两处**：`resources/tools.js` 加一条（进各页导航）、`index.html` 加一张卡片（进首页）。分类色在 `resources/home.css` 里按 `[data-cat="…"]` 映射。

## 游戏测试

- 测试放在 `游戏/<游戏名>/test/` 下
- `.spec.js` 搭配 `spec-common.js` 执行
- 有独立的 `run.js` 运行器和手动调试 HTML

## 重要

- **不要创建 package.json 或 node_modules**——项目是纯静态，无构建流程
- **不要引入 npm 包**——所有库已经 vendored 在 `lib/` 中
- **不要修改 `lib/` 中的任何文件**——它们是第三方代码，由 git 记录版本
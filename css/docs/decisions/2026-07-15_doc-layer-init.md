# 计划：为 CSS 布局实验室构建自愈文档层

## 一、设计目标

1. 一个 AI 原生文档层，填补 CLAUDE.md 和 CSS 源代码之间的"设计意图"断层
2. 文档由 AI 初始化、由 AI 在改代码后自动同步（自愈）
3. 格式上找到"AI 可精确解析"与"人可流畅阅读"的边际收益最佳点
4. 后续每个新会话从 docs/index.md 入口加载，按需深入特定模块文档

## 二、文档目录结构

```
docs/
  index.md                 入口：项目目的、总体架构、文件索引、阅读路线
  design/
    css-architecture.md    CSS 架构：变量体系、文件分层、类名命名规则
    test-system.md         测试体系：Demo / Test 目录用途和测试方法
  modules/
    common.md              common.css：reset、Design Tokens、图标、按钮、弹出层
    layout.md              layout.css：Flex/Grid/Table utility、书写模式、预设布局
    hua-huo.md             花活.css：装饰图案、动画特效
  decisions/
    2026-07-15_doc-layer-init.md   本计划
```

## 三、文档格式规范

每个文档以 YAML frontmatter 开头：

```yaml
---
title: 模块名
covers_file: [相对路径/文件名]
depends_on: [其他文档名]
api_signature: 对外暴露的类名/变量名摘要
last_updated: YYYY-MM-DD
why_exists: 一句话设计目的
---
```

### 内容结构

- **设计意图**：prose 说明模块解决什么问题、为什么这么设计
- **关键表格**：变量、类名、API 汇总
- **函数/类索引**：表格列出所有可用的 CSS 类及其功能
- **决策日志**：记录变更原因，按 `YYYY-MM-DD: 原因` 格式

### 不追踪行号

CSS 类索引不写行号，由 AI 实时 grep 定位。

## 四、改代码后的文档同步规则

1. **定位**：通过 `covers_file` 元数据找到被改文件对应的文档
2. **更新功能描述**：如果改动改变了类的行为或新增了类
3. **追加决策日志**：记录变更原因
4. **更新 `last_updated`** 字段

## 五、自愈纠错

读文档时，如果发现内容与代码不符（类描述过时、分类变化、`covers_file` 不完整），立即修正。

## 六、文档层与快连 AI 文档层的差异

| 方面 | 快连 AI | CSS 布局实验室 |
|------|---------|---------------|
| 源码语言 | JavaScript / HTML | CSS 纯样式 |
| 模块粒度 | 按 JS 功能模块拆分 | 按 CSS 文件拆分 |
| API 对象 | 函数/类/方法 | CSS 类/变量/Custom Properties |
| 入口页 | src/layout.html 源码版 | index.html 演示入口 |
| 构建工具 | node build.js | 无构建工具 |

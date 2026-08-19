---
title: CSS 布局实验室 项目文档入口
covers_file: [css/ 下所有源文件]
depends_on: []
api_signature: 无（项目文档索引）
last_updated: 2026-08-19
why_exists: CSS Utility 库的测试、演示与文档集合，纯 CSS 无构建工具
---

# CSS 布局实验室

## 项目目的

CSS Utility 库——提供一组通用、可复用的 CSS 类名与 Design Tokens，覆盖布局（Flex/Grid）、形状、图标、按钮、表单、动画等场景。附带演示页与测试页，用于验证浏览器兼容性。

## 源代码组成

| 文件 | 行数 | 职责 |
|------|------|------|
| [`css/common.css`](modules/common.md) | ~879 | 全局 reset、Design Tokens、图标系统、按钮、表单、弹出层、模态框 |
| [`css/layout.css`](modules/layout.md) | ~548 | Flex/Grid/Table 布局 utility、书写模式、Grid 预设布局（工/朋/亚字形等） |
| [`css/花活.css`](modules/hua-huo.md) | ~256 | 装饰性 CSS——太极图、三角箭头、撒花动画、光晕呼吸灯 |

## 产物形态

纯 CSS 库，无构建工具依赖，`<link>` 即用。

```
css/
  common.css    → 全局基础 + Design Tokens + 组件样式
  layout.css    → 布局 Utility class 系统
  花活.css      → 装饰性 / 特效样式
```

## 阅读路线

| 入口文档 | 适合什么场景 |
|----------|-------------|
| [CSS 架构](design/css-architecture.md) | 理解变量体系、文件分层、类名命名约定 |
| [common.css 模块](modules/common.md) | 需要改全局 reset / Tokens / 图标 / 按钮 / 表单时 |
| [layout.css 模块](modules/layout.md) | 需要改 Flex/Grid utility 或新增预设布局时 |
| [花活.css 模块](modules/hua-huo.md) | 需要改装饰性 / 动画 / 特效样式时 |
| [测试体系](design/test-system.md) | 需要新增测试页或理解现有测试覆盖时 |

## 演示与测试

- **Demo**（`demo/`）— 使用范式：太极图、沙漏、图标 Overlay、凹陷按钮开关
- **Test**（`test/`）— 正确性：基础类、布局组合、动画、模态框、特殊图形、书写模式、居中类、btn-group
- **Trial**（`trial/`）— 试效果：stretch 规律、原生属性、布局类探索器、Grid×writing-mode、按钮 light 对比
- 详见 [测试体系](design/test-system.md)

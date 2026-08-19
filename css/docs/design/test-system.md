---
title: 测试体系
covers_file: [test/, demo/, trial/]
depends_on: [css-architecture]
api_signature: 无（测试页面，纯 HTML 手工构造）
last_updated: 2026-08-19
why_exists: CSS 库没有单元测试，测试靠手动创建的 HTML 页面验证布局行为，需要文档说明测试覆盖情况
---

## 设计意图

CSS 布局实验室的测试体系没有自动化测试框架，依靠**手工构造的 HTML 页面**验证浏览器渲染结果。页面按用途分三类：

- **Demo**（`demo/`）— 使用范式：展示"怎么用某个 CSS 类/组件"，用户打开看效果学用法
- **Test**（`test/`）— 正确性：系统验证某组 Utility 类在不同组合下的表现，开发者打开看"对不对"（部分页带自动校验脚本）
- **Trial**（`trial/`）— 试效果：探索"这个属性/组合到底是什么效果"，不保证正确性，是实验工作台

## Demo 目录（使用范式）

| 文件 | 内容 | 说明 |
|------|------|------|
| `太极.html` | `.taiji` 类 | 纯 CSS 太极图绘制 |
| `toggle.html` | `label.toggle.btn` | 凹陷/弹起切换按钮开关 |
| `icon-overlay-demo.html` | 图标 Overlay | 图标叠加效果 |
| `hourglass.html` | `.icon.hourglass` | 沙漏图标 |

## Test 目录（正确性）

| 文件 | 测试内容 | 校验方式 |
|------|----------|----------|
| `basics.html` | 基础类（`.hidden` `.invisible` `.shape.*` `.icon.*` `.btn.*`） | 自动 |
| `layout.html` | 完整的 layout.css utility 类 | 自动 |
| `animation.html` | 动画效果（`.spin` `.pulse` `.shadow-breathing`） | 手动 |
| `modal.html` | 模态框布局 | 手动 |
| `shape.html` | 特殊图形（`.shape.triangle` `.taiji`） | 手动 |
| `writing-mode.html` | 书写模式类（`.content-Z/S/N/И`） | 自动 |
| `居中类.html` | `.near-*` / `.at-*` 多书写模式场景 | 自动校验脚本 |
| `btn-group.html` | `.btn-group` 方向组合 + 圆角（含 hidden 处理） | 自动校验脚本 |

## Trial 目录（试效果）

| 文件 | 内容 |
|------|------|
| `stretch.html` | Flex/Grid 中 stretch 的规律探索（含规律总结表） |
| `native-property-demo.html` | justify/align-content/items 原生属性行为 |
| `layout-demo.html` | CSS 布局类交互探索器 |
| `grid-writing-mode-demo.html` | Grid 原生属性与书写模式的关系 |
| `test-btn-light.html` | 按钮 light 主题透明度对比 |

## 如何新增

1. 判定页面归属：使用范式 → `demo/`；验证正确性 → `test/`；探索效果 → `trial/`
2. 在对应目录创建 HTML 文件，引用 `../common.css` 和 `../layout.css`
3. 页面标题与文件功能对应
4. 如果测试的是某个特定模块的复杂行为，在对应模块文档的决策日志中添加条目

## 测试原则

- 一个页面测试一组相关的类，不要混入无关测试
- 使用文字标签标注每个被测元素的预期行为
- 视觉对比：对于颜色/尺寸等视觉变量，可创建并排对比页面
- 验证在主流浏览器（Chrome/Firefox/Safari/Edge）上的表现一致

## 决策日志

- 2026-07-15: 初始文档创建
- 2026-08-19: 合并进静态页面工具 `css/` 子项目；目录三分（demo 使用范式 / test 正确性 / trial 试效果）；btn-group-demo→test/btn-group.html，stretch、native-property-demo、layout-demo、grid-writing-mode-demo→trial/；移除独立入口 index.html

# 符号 · 工具

改数据时用的**通用工具**。以前散在 `tmp/` 里（**被 gitignore，换个会话就丢**），2026-10-04 收进来。

⚠️ 都是**只读工具**，不写任何权威数据；落盘一律走 `符号/datatool.py`。

⚠️ 用之前把本目录加进 `sys.path`（模块之间是平级 import）：

```python
import sys; sys.path.insert(0, r'd:\工具兽\静态页面工具\符号\工具')
import grid3, sheet2
```

---

## 一、官方码表取字形（依赖链最深的一套）

字体画的字形**不可信**（`✓017` 那次 `Segoe UI Symbol` 把太玄经三个码位画错位），
判字形只能信 **Unicode 官方码表 PDF**（`unicode.org/charts/PDF/U<区块起点>.pdf`）。

| 文件 | 干什么 |
|---|---|
| `chartlib.py` | `fetch(blockstart)` 下码表 PDF 到 `工具/charts/`，带缓存与重试（`curl` 会 301，大区块会超时，它都兜了） |
| `chartgrid.py` | 从**页内所有 4 位十六进制标签**推断行列边界，定位到码位的格子 |
| `grid3.py` | **按码表页自身的格线**定位字形区（不猜 pitch）。⚠️ 格线要用**长线**判（长度 > 90pt），短的是字形笔画。`get(cp)` → 位图 ndarray |
| `sheet.py` | 底座：`clean()` 等位图清洗 |
| `sheet2.py` | `sheet(items, path)` 把**字形 + 名字**并排拼成一张图——**审名用**（`✓038` 埃及象形就靠它） |
| `amap.py` | ASCII 逐格墨迹图（字形的墨量分布，终端里看） |
| `poly.py` | 取某格里的**填充路径多边形**（黑块的真实几何） |
| `arrows.py` | 朝向筛查：名字里的方位词 vs 字形墨迹偏重的一侧 |
| `dirq.py` | 判朝向：①箭头/指针的"头"在哪侧 ②时钟指针角度 |
| `domino.py` | 多米诺：名字写了两个点数，数字形里的点子 |
| `gua.py` | 卦爻核对：从字形读出爻（实/断）序列，跟名字蕴含的卦对 |

⚠️ **`sheet2.py` 的两处坑**（`✓038` 踩过并改掉）：字体原写死 `consola.ttf` ——
**中文全是豆腐块**，现用 `msyh.ttc`；字号原写死 12px，现给了 `nfont` / `nlen` 参数。

## 二、参考数据解析 / 口径

| 文件 | 干什么 |
|---|---|
| `nameslist.py` | `NamesList.txt` → `码位 → {name, als(=), notes(*), xrefs(x), formal(%)}` |
| `scope_names2.py` | **「只算页面显示得出来的」口径 = 有直译名**（`zh` 里 `'-' not in k`）。也顺带印 `%`/`=`/`*` 三个口径的数量 |
| `coverage.py` | `Unikemet.txt` / `NamesList.txt` 各覆盖什么范围 |

## 三、`✓035` 的 `kEH_Desc` → 形状标签分类器

| 文件 | 干什么 |
|---|---|
| `reclass4.py` | 按 `kEH_Desc` 判形象型标签（v4 定稿规则） |
| `make_map2.py` | 把 `reclass4` 的判定部分抽成可入库模块（路径按 `__file__` 定位） |

里面的 **`kEH_Desc` 主体提取规则**（首个名词短语、切到第一个逗号、去掉 `with/holding/…` 引出的附带成分）
是 `✓035` 定稿的，`✓038` 起名字也照这套用。

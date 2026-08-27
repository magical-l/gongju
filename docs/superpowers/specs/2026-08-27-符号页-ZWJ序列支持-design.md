# 符号页 ZWJ 序列支持 + 全量打标（design）

日期：2026-08-27
状态：已批准（用户确认：功能+打标一起做、全量 1614、并入现有标签、肤色词简化版、"肤色+基础名"）

## 背景

todo 待办：ZWJ 序列（3+ 码位，如 🧑🦰 = 1F9D1+200D+1F9B0）无法打标。根因：页面网格只支持单码位 ranges + 双码位旗帜 seqs；把 ZWJ 序列硬塞 ranges 会把 U+200D/U+FE0F 当字符加进 ranges（已踩过坑）。

目标：让网格支持任意长度码位序列（seqs），并全量打标 ZWJ 序列。

## 数据模型

seqs 条目统一为 `[cp1, cp2, ..., cpN, zh, en]`（N≥2，码位在前 + 中英文名）。旗帜（`[cp1,cp2,zh,en]`）与 ZWJ（`[cp1,...,cpN,zh,en]`）同构。网格条目 = 纯码位数组（剥离名字）。

**前端核心抽象（符号.js）**：
- `seqCps(s)`：从 seqs 条目剥离尾部 zh/en 字符串 → 纯码位数组（已有条目若尾部无字符串则原样返回）
- 序列键统一：`cps.join('-')`（如 `"1F9D1-200D-1F9B0"`）

## 前端改动（符号.js，~15 处）

泛化"取前两个码位"假设为"取全部码位"：

| 位置 | 现状（双码位假设） | 改为 |
|------|------|------|
| `memberKey` | `'s'+m[0]+'-'+m[1]` | `'s'+seqCps(m).join('-')` |
| `flatten` SEQ_INDEX | `s[0]+'-'+s[1]` | `seqCps(s).join('-')` |
| `tagsOf` 序列分支 | `'seq:'+a+'-'+b` | `'seq:'+seqCps(s).join('-')` |
| `nodeHasMember`/`nodeAggregatesMember` | 比较 `s[0]`/`s[1]` | 比较整串码位 |
| `seqsAdd`/`seqsRemove` | 比较 `s[0]`/`s[1]` | 比较整串码位 |
| `gridItems` | `[seqs[i][0], seqs[i][1]]` | `seqCps(m.seqs[i])` |
| `previewItems` | `[seqs[i][0], seqs[i][1]]` | `seqCps(seqs[i])` |
| `selectFlag` | `[cp1,cp2]=seq`，codeStr/htmlEntity 双码位 | 任意长度，`String.fromCodePoint(...)` |
| `matchCharsForToken` seqs 段 | `s[0]+'-'+s[1]`、`fromCodePoint(s[0],s[1])` | 整串 |
| `mcFromKey` | 解构前两个 | `cps = key.slice(1).split('-')`，`fromCodePoint(...cps)` |
| `isSelected` | 比较 `[0]`/`[1]` | 整串比较 |
| `itemTitle`/`gridItemName` | `SEQ_INDEX.get(item[0]+'-'+item[1])` | 整串 key |
| 编辑五处（`onTreeDrop`/`openTagEditor`/`removeFromGrid`/`removeFromTag`/`_applyAddToNode`） | `SEQ_INDEX.get(...)`、`fromCodePoint(item[0],item[1])` | 整串 key、`fromCodePoint(...)` |
| `opChar` | `fromCodePoint(op.cps[0],op.cps[1])` | `fromCodePoint(...op.cps)` |
| 搜索框 watch | `arr.length===2` 时 `SEQ_INDEX.has(key)` | 任意长度序列匹配 |

**不需改**：`cellKey`（`item.join('-')` 已支持）、渲染（`String.fromCodePoint(...item)` 已支持）、`cellText`、`toCpsArray`、`cpsHex`/`codeStrOf`、`renderState`（isFlag 恒 true）、`refreshRenderability`（isFlag 跳过）、`isControlCode`（数组比较为 NaN，无害）。

## 服务器改动（dev_server.py）

`seqs_contains`/`seqs_remove`：前缀比较 `s[:len(cps)] == cps` → 剥离尾部字符串后**精确比较码位部分** `seq_cps(s) == cps`（防 ZWJ 序列与旗帜前缀误匹配，如 `[a,b,c]` 不应被 `[a,b]` 匹配）。

```python
def seq_cps(s):
    i = len(s)
    while i > 0 and isinstance(s[i-1], str):
        i -= 1
    return s[:i]

def seqs_contains(seqs, cps):
    return any(seq_cps(s) == cps for s in seqs)

def seqs_remove(node, cps):
    seqs = node.get('seqs', [])
    for i, s in enumerate(seqs):
        if seq_cps(s) == cps:
            seqs.pop(i)
            return True
    return False
```

`seqs_add` 排序 `s[:2]` 保留（码位部分前两位排序，ZWJ 与旗帜同构）。`seqs_add` 存 `list(cps)`（纯码位，无名字）——与前端 `seqsAdd` 存 `[码位..., zh, en]` 的不一致是既有行为，页面内存为本次会话权威，刷新后新增序列名字可能丢失（既有旗帜同样问题，不在本次范围）。

## 打标脚本（新增 `build_zwj.py`，参考 build_flags.py，跑完可删或保留）

**数据源**：`参考资料/emoji-test.txt`（Unicode 17.0），全部含 U+200D 的 fully-qualified 序列 = 1614 个。

**名字**：
- 英文名 = emoji-test 注释（现成）
- 中文名：
  - 基础序列（无肤色 1F3FB-1F3FF）：CLDR zh（`参考资料/annotations-zh.json`）剥 VS16 后匹配，命中 188/249；未命中 61 个程序化兜底
  - 肤色变体 = 肤色词 + 基础名（用户裁定：肤色前置），肤色词简化版：🏻浅肤色/🏼中浅肤色/🏽中肤色/🏾中深肤色/🏿深肤色
  - 肤色词从英文名顺序确定（emoji-test 注释中肤色词与基础描述的相对位置）

**写入**：`标签.json` 对应节点 `seqs`（注入 `[cp1,...,cpN,zh,en]`，不碰 ranges）。json.dump indent=2 CRLF 整文件重写（与既有脚本一致）。

**归属映射**（249 基础，肤色变体自动跟随挂同节点）：

| 类别 | 基础数 | 标签路径 |
|------|--------|----------|
| 发型（胡子/红发/卷发/白发/秃顶/金发） | 16 | `身体部位相关/头发、发型、发色` |
| 表情（迷茫/叹息/头晕） | 3 | `表情、表达/难受` |
| 表情（摇头/点头） | 2 | `表情、表达/手势、姿势` |
| 爱（心火/修复心/情侣/亲吻） | 8 | `表情、表达/喜欢、爱、尊敬` |
| 手势（皱眉/撅嘴/拒绝/OK/举手/聋/鞠躬/捂脸/耸肩） | 20 | `表情、表达/手势、姿势` |
| 职业（医护/学生/教师/法官/农民/厨师/机械师/工厂/办公/科学/技术/歌手/艺术家/飞行员/宇航员/消防员/警察/侦探/卫兵/建筑工/包头巾） | 53 | `人/职业` |
| 家庭（核心/单亲/哺乳） | 32 | `人/家庭` |
| 婚礼（燕尾服/头纱） | 4 | `人/性别、婚姻` |
| 神话（魔法师/精灵/吸血鬼/美人鱼/小精灵/灯神/僵尸） | 14 | 双挂 `人/人物角色/神仙巫师` + `信仰、神秘学/神话、传说、外星人` |
| 奇幻角色（超级英雄/反派） | 4 | `人/人物角色/装扮、角色` |
| 圣诞老人 | 1 | `节日、纪念日、庆祝/圣诞节` |
| 美容（按摩/理发） | 4 | `人/梳妆打扮` |
| 移动（走/站/跪/白杖/电动轮椅/手动轮椅） | 20 | `人`（根级） |
| 跑步 | 6 | `体育、运动/田径运动` |
| 舞蹈（芭蕾/兔耳） | 3 | `体育、运动/舞蹈` |
| 水上运动（冲浪/划船/游泳/水球） | 8 | `体育、运动/水上运动` |
| 球类（篮球/手球） | 4 | `体育、运动/球类运动` |
| 其他运动（高尔夫/举重/单车/山地车/体操/摔跤/杂耍/攀岩/打坐） | 18 | `体育、运动/其他运动` |
| 桑拿 | 1 | `物品、用具/生活用品` |
| 动物（服务犬/黑猫/北极熊/黑鸟/凤凰） | 5 | `自然、科学/生物/动物/*`（哺乳动物/鸟类/传说生物） |
| 饮食（青柠/棕蘑菇） | 2 | `饮食` |
| 断链 | 1 | `物品、用具`（技术符号相关节点） |
| 旗帜（彩虹/跨性别/海盗） | 3 | `标志/旗帜` |
| 眼睛对话框 | 1 | `表情、表达`（根） |

> 映射细节（动物子节点、断链的具体归属）在脚本实现时对照现有树逐条落位，验收时一并核对。

## 验证

1. dev_server.py 起服务（项目根）
2. Playwright 打开 `符号/符号.html`
3. 点 `人/职业` → 看到 ZWJ 职业序列卡片（如 👨🍳）渲染完整 emoji
4. 搜索"红发" → 命中发型序列
5. 点击 ZWJ 序列详情 → 显示多码位 U+ 串 + HTML 转义
6. ✎/拖拽打标 ZWJ 序列到新标签 → 刷新后持久（seqs 正确写入）
7. 国旗（双码位）回归：点 `标志/旗帜/国旗` 259 旗帜仍正常渲染

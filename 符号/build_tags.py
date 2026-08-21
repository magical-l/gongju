# -*- coding: utf-8 -*-
"""
build_tags.py — 从 标签.txt 重建 标签.json 的语义轴，并迁移旧数据。

流程：
  1) parse_txt()    解析 标签.txt → 语义树（名字/别名/层级/挂起）
  2) build_axis()   按新结构生成语义轴节点骨架
  3) migrate()      旧树 ranges/seqs/src 按 old→new 映射迁移（改名/移父/拆/并删）
  4) apply()        合入 标签.json（保留 文字系统/官方分类/区块 三轴）

运行： python build_tags.py [--dry]
--dry 只打印迁移报告，不写文件。
"""
import json
import re
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
TXT = os.path.join(HERE, '标签.txt')
TAGS_JSON = os.path.join(HERE, '标签.json')

# ---------------------------------------------------------------- 解析
def parse_txt(path=TXT):
    """解析 标签.txt → 嵌套树 [[node,...], ...]，node=(name, alias, pending)。"""
    stack = []
    roots = []
    for raw in open(path, encoding='utf-8'):
        s = raw.rstrip('\n')
        if not s.strip() or s.strip().startswith('……') or re.match(r'^v?\d+\.\d+', s.strip()):
            continue
        name = s.strip()
        alias, pending = [], False
        m = re.match(r'^(.*?)(?:：留校察看)(?:：别名（(.*?)）)?$', name)
        if m:
            name, pending = m.group(1), True
            if m.group(2):
                alias = [a.strip() for a in m.group(2).split('、')]
        else:
            m = re.match(r'^(.*?)(?:：别名（(.*?)）)$', name)
            if m:
                name = m.group(1)
                alias = [a.strip() for a in m.group(2).split('、')]
        depth = len(raw) - len(raw.lstrip('\t'))
        node = {'name': name, 'alias': alias, 'pending': pending, 'children': []}
        while stack and stack[-1][0] >= depth:
            stack.pop()
        if not stack:
            roots.append(node)
        else:
            stack[-1][1]['children'].append(node)
        stack.append((depth, node))
    return roots

# ---------------------------------------------------------------- 新轴骨架
def build_axis(tree):
    """嵌套树 → JSON 节点结构 {name: {children, alias, pending?}}。返回 (roots_dict, by_path)。"""
    def make(nodes):
        d = {}
        for n in nodes:
            node = {'children': make(n['children'])}
            if n['alias']:
                node['alias'] = n['alias']
            if n['pending']:
                node['pending'] = True
            d[n['name']] = node
        return d
    roots = make(tree)
    by_path = {}
    def walk(prefix, d):
        for name, node in d.items():
            path = prefix + name
            by_path[path] = node
            walk(path + '/', node['children'])
    walk('', roots)
    return roots, by_path

# ---------------------------------------------------------------- 旧数据收集
def collect_old(roots):
    """旧语义轴 → {old_path: {ranges, seqs, src}}。"""
    out = {}
    def walk(path, node):
        d = {}
        if node.get('ranges'):
            d['ranges'] = node['ranges']
        if node.get('seqs'):
            d['seqs'] = node['seqs']
        if node.get('src'):
            d['src'] = node['src']
        if d:
            out[path] = d
        for k, v in node.get('children', {}).items():
            walk(path + '/' + k, v)
    for rname, r in roots.items():
        walk(rname, r)
    return out

# ---------------------------------------------------------------- 迁移映射
# 简单改名/移父：old_path → new_path（ranges/seqs/src 原样搬）
MIGRATE = {
    '人与身体/表情、情绪': '人与身体/情绪表达',
    '人与身体/手势': '人与身体/身体部位/手、手势',
    '人与身体/发型与发色': '人与身体/发型、发色',
    '人与身体/人物': '人与身体/人物角色',
    '人与身体/职业': '社会生活/工作、职业',
    '人与身体/家庭': '社会生活/家庭',
    '社会生活/生活用品': '社会生活/生活用品、生产用品',
    '饮食/熟食、菜肴': '饮食/熟菜',
    '饮食/餐具、厨具': '饮食/餐饮用具',
    '交通、出行/旅游、旅行': '社会生活/旅游、旅行',
    '体育、游戏、文体娱乐/球类运动': '体育、运动/球类运动',
    '体育、游戏、文体娱乐/田径运动、跑步': '体育、运动/田径运动',
    '体育、游戏、文体娱乐/水上运动': '体育、运动/水上运动',
    '体育、游戏、文体娱乐/冰雪运动': '体育、运动/冰雪运动',
    '体育、游戏、文体娱乐/武术、格斗': '体育、运动/功夫',
    '体育、游戏、文体娱乐/其他运动': '体育、运动/其他运动',
    '体育、游戏、文体娱乐/棋类/国际象棋': '游戏、博弈/棋类/国际象棋',
    '体育、游戏、文体娱乐/棋类/中国象棋': '游戏、博弈/棋类/中国象棋',
    '体育、游戏、文体娱乐/棋类/围棋': '游戏、博弈/棋类/围棋',
    '体育、游戏、文体娱乐/牌类/扑克': '游戏、博弈/牌类/扑克',
    '体育、游戏、文体娱乐/牌类/麻将': '游戏、博弈/牌类/麻将',
    '体育、游戏、文体娱乐/牌类/多米诺骨牌': '游戏、博弈/牌类/多米诺骨牌',
    '体育、游戏、文体娱乐/牌类/色子、骰子': '游戏、博弈/骰子',
    '体育、游戏、文体娱乐/奖牌与奖杯': '社会生活/荣誉',
    '体育、游戏、文体娱乐/电子游戏': '游戏、博弈/电子游戏',
    '体育、游戏、文体娱乐/玩具': '文化娱乐/玩具',
    '体育、游戏、文体娱乐/游乐场、游乐园、娱乐表演': '文化娱乐/娱乐场地和表演',
    '自然、科学/生物/植物/花': '自然、科学/生物/植物/花朵',
    '自然、科学/生物/植物/果': '自然、科学/生物/植物/果实、种子',
    '自然、科学/生物/植物/叶': '自然、科学/生物/植物/叶子',
    '自然、科学/生物/动物/海洋动物': '自然、科学/生物/动物/水生生物',
    '自然、科学/生物/动物/十二生肖': '自然、科学/生物/动物/生肖',
    '自然、科学/天文': '自然、科学/天文、太空、宇宙',
    '自然、科学/天文/日月': '自然、科学/天文、太空、宇宙/太阳系',
    '自然、科学/天文/星星': '自然、科学/天文、太空、宇宙/星星',
    '自然、科学/天文/星座': '自然、科学/天文、太空、宇宙/星座',
    '自然、科学/地理、地貌': '自然、科学/地理、地质、地貌',
    '数学/数字/汉语数字': '数学/数字/汉字数字',
    '数学/数字/带圈数字': '数学/数字/带圈数字、带框数字',
    '数学/数字/正字计数': '数学/数字/汉字数字/正字计数',
    '装饰、花纹/制表符': '技术符号/制表符',
    '标志/国旗': '标志/旗帜/国旗',
    '标志/货币': '标志/货币标志',
    '技术符号/控制符号的图形表示': '技术符号/控制符号的具象图形',
    '语言与文字': '语言、文字',
    '语言与文字/标点符号': '语言、文字/标点符号',
    '语言与文字/音标与发音符号': '语言、文字/音标',
    '语言与文字/特殊语言标记': '语言、文字/特殊语言标记',
    '语言与文字/古文字': '语言、文字/古文字',
    '语言与文字/古文字/楔形文字': '语言、文字/古文字/楔形文字',
    '语言与文字/古文字/如尼字母': '语言、文字/古文字/如尼字母',
    '语言与文字/古文字/古意大利字母': '语言、文字/古文字/古意大利字母',
    '语言与文字/古文字/埃及象形文字': '语言、文字/古文字/埃及象形文字',
    '语言与文字/盲文': '语言、文字/盲文',
    '哲学、宗教、神秘学、怪力乱神': '宗教、神秘学',
    '哲学、宗教、神秘学、怪力乱神/易经符号、八卦、六十四卦': '宗教、神秘学/易经符号、八卦、六十四卦',
    '哲学、宗教、神秘学、怪力乱神/太玄经符号、八十一首': '宗教、神秘学/太玄经符号、八十一首',
    '哲学、宗教、神秘学、怪力乱神/炼金术符号': '宗教、神秘学/炼金术符号',
    '哲学、宗教、神秘学、怪力乱神/宗教符号': '宗教、神秘学/宗教符号',
    '哲学、宗教、神秘学、怪力乱神/神话、传说、外星人': '宗教、神秘学/神话、传说、外星人',
    '哲学、宗教、神秘学、怪力乱神/占星符号、算命': '宗教、神秘学/占卜',
    '哲学、宗教、神秘学、怪力乱神/占星符号、算命/黄道十二宫': '宗教、神秘学/占卜/黄道十二宫',
    '哲学、宗教、神秘学、怪力乱神/占星符号、算命/行星符号': '宗教、神秘学/占卜/行星符号',
    '哲学、宗教、神秘学、怪力乱神/占星符号、算命/相位': '宗教、神秘学/占卜/相位',
}

# 拆：旧路径 → {新路径: [码位]}，旧节点自身 ranges 按码位分配
SPLITS = {
    '饮食/蔬菜、食材、调料': {
        '饮食/食材/蔬菜': [0x1F33D, 0x1F345, 0x1F346, 0x1F951, 0x1F952, 0x1F954,
                           0x1F955, 0x1F966, 0x1F96C, 0x1F9C5, 0x1FAD1, 0x1FAD8,
                           0x1FADB, 0x1FADC],
        '饮食/调料': [0x1F9C4, 0x1FADA],
        '饮食/水果、干果': [0x1F330, 0x1F95C],
    },
    '体育、游戏、文体娱乐': {   # 旧根自身散运动
        '体育、运动/其他运动': [0x1F3AF, 0x1F3B1, 0x1F3C7, 0x1F6B4, 0x1F6B5, 0x1F938],
        '体育、运动/冰雪运动': [0x1F3C2],
        '体育、运动/水上运动': [0x1F3C4, 0x1F3CA, 0x1F6A3, 0x1F93D],
        '体育、运动/功夫': [0x1F93A, 0x1F93C],
        '体育、运动/球类运动': [0x1F93E],
        '文化娱乐/娱乐场地和表演': [0x1F939],
    },
    '体育、游戏、文体娱乐/棋类/其他棋类': {
        '游戏、博弈/棋类': [0x26C0, 0x26C1, 0x26C2, 0x26C3, 0x26C9, 0x26CA],
    },
    '绘画、雕塑': {
        '书法、绘画': [0x270F, 0x2710, 0x2712, 0x1F3A8, 0x1F58A, 0x1F58B, 0x1F58C,
                       0x1F58D, 0x1F5BC],
        '电影、电视、摄影': [0x1F39E, 0x1F3AC],
        '文化娱乐/娱乐场地和表演': [0x1F39F, 0x1F3AA, 0x1F3AD],
        '社会生活/工具、办公、文具': [0x2702],
        '社会生活/生活用品、生产用品': [0x1F9F5, 0x1F9F6, 0x1FAA1, 0x1FAA2],
    },
    '电影、电视、摄影': {
        '电影、电视、摄影': [0x1F3A5, 0x1F3AC, 0x1F4F7, 0x1F4F8, 0x1F4F9, 0x1F4FA, 0x1F4FC],
        '社会生活/生活用品、生产用品': [0x1F3EE, 0x1F4A1, 0x1F526, 0x1FA94],
        '社会生活/工具、办公、文具': [0x1F50D, 0x1F50E],
    },
}

# 拆（按区间）：旧路径 → {新路径: [[lo, hi], ...]}，区间不重叠、正好覆盖旧节点 ranges。
# 语义节点若整体按连续块拆分，比 SPLITS 逐码位清单更清晰。
SPLIT_RANGES = {
    '语言、文字/特殊语言标记': {      # v1.1.3：方块片假名 与 手语文字(SignWriting) 拆开
        '语言、文字/方块假名': [[0x3300, 0x33FF]],
        '语言、文字/手语文字': [
            [0x1D800, 0x1D9FF], [0x1DA37, 0x1DA3A], [0x1DA6D, 0x1DA74],
            [0x1DA76, 0x1DA83], [0x1DA85, 0x1DA86]],
    },
}

# 额外移除/添加（todo 数据清理中明确、无歧义的）
EXTRA_REMOVES = {
    '社会生活/建筑、场所': [0x1F5FF, 0x1F9F3, 0x1F6CE],
    #   🗿 → 雕塑；🧳 行李箱 → 旅游、旅行；🛎 服务铃 → 生活用品
    # v1.1.1：🦕🦖 从爬行动物细分到恐龙子类
    # v1.1.3：🐉🐲 龙/龙脸 → 传说生物（神话动物，非爬行动物）
    '自然、科学/生物/动物/爬行动物': [0x1F995, 0x1F996, 0x1F409, 0x1F432],
    # v1.1.1：生肖 误挂的黄道十二宫符号移除（♈♉…⛎ 属 占卜/黄道十二宫）
    '自然、科学/生物/动物/生肖': [0x2648, 0x2649, 0x264A, 0x264B, 0x264C, 0x264D,
                                    0x264E, 0x264F, 0x2650, 0x2651, 0x2652, 0x2653,
                                    0x26CE],
    # v1.1.3 审计：错放位置
    '交通、出行/景点、地标建筑': [0x1F488],                       # 💈 理发店柱
    '数学/数字/带圈数字、带框数字': list(range(0x2160, 0x216C)),   # Ⅰ-Ⅻ → 罗马数字
    '技术符号/计算机不可见字符、组合字符': list(range(0x2400, 0x242A)),  # ␀-␩ 控制图形 → 控制符号的具象图形
    '技术符号/制表符': list(range(0x2500, 0x2580)),               # ─-┿ 框线 → 制表线
    '自然、科学/天文、太空、宇宙': list(range(0x263F, 0x2648)),   # ☿-♇ 行星符号 → 占卜/行星符号
    '数学/几何形状/星形': [0x2311],                               # ⌑ 方菱形 → 方形
    '饮食/熟菜': [0x1F969, 0x1F356, 0x1F95A],                    # 🥩🍖🥚 → 食材/肉、蛋
    '数学/数字/上标、下标': [0x2072, 0x2073, 0x208F],             # 未分配码位防护（防手滑）
}
EXTRA_ADDS = {
    '雕塑': [0x1F5FF],
    '文化娱乐/娱乐场地和表演': [0x1F3AB, 0x1F3A0, 0x1F3A1, 0x1F3A2, 0x1F3AA],  # 🎫 + 公共设施游乐设施
    # v1.1.1：恐龙子类（🦕 蜥脚类 / 🦖 兽脚类）
    '自然、科学/生物/动物/爬行动物/恐龙': [0x1F995, 0x1F996],
    # v1.1.1：生肖（鼠牛虎兔龙蛇马羊猴鸡狗猪的全部常见 emoji）
    '自然、科学/生物/动物/生肖': [
        0x1F42D, 0x1F400,                       # 🐭 🐀 鼠
        0x1F42E, 0x1F402, 0x1F403, 0x1F404,     # 🐮 🐂 🐃 🐄 牛
        0x1F42F, 0x1F405,                       # 🐯 🐅 虎
        0x1F430, 0x1F407,                       # 🐰 🐇 兔
        0x1F432, 0x1F409,                       # 🐲 🐉 龙
        0x1F40D,                                # 🐍 蛇
        0x1F434, 0x1F40E,                       # 🐴 🐎 马
        0x1F411, 0x1F40F, 0x1F410,              # 🐑 🐏 🐐 羊
        0x1F435, 0x1F412,                       # 🐵 🐒 猴
        0x1F414, 0x1F413,                       # 🐔 🐓 鸡
        0x1F436, 0x1F415, 0x1F429, 0x1F9AE,     # 🐶 🐕 🐩 🦮 狗
        0x1F437, 0x1F416, 0x1F417,              # 🐷 🐖 🐗 猪
    ],
    # v1.1.3 审计：少打标签 + 错放补正
    '数学/数字/罗马数字': list(range(0x2160, 0x2189)),            # Ⅰ-ↈ
    '数学/数字/分数': [0x00BC, 0x00BD, 0x00BE] + list(range(0x2150, 0x2160)) + [0x2189],  # ¼½¾ ⅐-⅟ ↉
    '数学/数字/上标、下标': [0x00B2, 0x00B3, 0x00B9]
                          + list(range(0x2070, 0x2072))    # ⁰¹
                          + list(range(0x2074, 0x208F))    # ⁴-⁹⁽⁾ⁿ…（2072/2073 未分配）
                          + list(range(0x2090, 0x209D)),   # ₐ-ₜ
    '数学/数字/带圈数字、带框数字': list(range(0x24EA, 0x2500)) + list(range(0x2776, 0x2794)),  # ⓪-⓿ ❶-➓
    '数学/数字/阿拉伯数字': list(range(0x30, 0x3A)),               # 0-9
    '技术符号/控制符号的具象图形': list(range(0x2400, 0x242A)),     # ␀-␩
    '技术符号/制表符/制表线': list(range(0x2500, 0x2580)),         # ─-┿
    '宗教、神秘学/占卜/行星符号': list(range(0x263F, 0x2648)),     # ☿-♇
    '数学/几何形状/方形': [0x2311],                               # ⌑
    '自然、科学/生物/动物/传说生物': [0x1F409, 0x1F432],           # 🐉🐲
    '自然、科学/天文、太空、宇宙/航天': [0x1F680, 0x1F6F8],       # 🚀🛸
    '社会生活/公共设施/通讯、网络': [0x1F6F0],                    # 🛰
    '社会生活/法律、秩序': [0x2696],                              # ⚖ 天平/正义
    '社会生活/生活用品、生产用品': [0x1F6CE],                     # 🛎 服务铃
    '社会生活/工业': [0x1F3ED],                                  # 🏭 工厂
    '社会生活/农业': [0x1F69C],                                  # 🚜 拖拉机
    '饮食/食材/肉、蛋': [0x1F969, 0x1F356, 0x1F95A],             # 🥩🍖🥚
    # v1.1.3b：𞅏 尼亚肯普苗文带圈字母 同时归语言文字（脚本本体）；🛎 服务铃归旅游/餐饮
    '语言、文字': [0x1E14F],
    '社会生活/旅游、旅行': [0x1F6CE],
    '饮食': [0x1F6CE],
}

# ---------------------------------------------------------------- 工具
def split_ranges(ranges, cps_set):
    """从 ranges 中抽出属于 cps_set 的子区间。返回 (抽出的, 剩余的)。"""
    extracted, remaining = [], []
    for lo, hi in ranges:
        seg_lo = seg_hi = None
        for cp in range(lo, hi + 1):
            if cp in cps_set:
                if seg_lo is None:
                    seg_lo = seg_hi = cp
                else:
                    seg_hi = cp
            else:
                if seg_lo is not None:
                    extracted.append([seg_lo, seg_hi])
                    seg_lo = seg_hi = None
        if seg_lo is not None:
            extracted.append([seg_lo, seg_hi])
    # 剩余 = 原区间减去抽出的
    rem_cps = set()
    for lo, hi in ranges:
        for cp in range(lo, hi + 1):
            if cp not in cps_set:
                rem_cps.add(cp)
    remaining = ranges_to_list(sorted(rem_cps))
    return extracted, remaining

def ranges_to_list(cps):
    out = []
    for cp in cps:
        if out and cp == out[-1][1] + 1:
            out[-1][1] = cp
        else:
            out.append([cp, cp])
    return out

def merge_ranges(*lists):
    """多个 ranges 列表合并去重。"""
    all_cps = set()
    for lst in lists:
        for lo, hi in lst:
            for cp in range(lo, hi + 1):
                all_cps.add(cp)
    return ranges_to_list(sorted(all_cps))

def add_ranges(node, ranges_list):
    if not ranges_list:
        return
    if node.get('ranges'):
        node['ranges'] = merge_ranges(node['ranges'], ranges_list)
    else:
        node['ranges'] = sorted(ranges_list, key=lambda r: r[0])

def remove_ranges(node, cps_set):
    if not node.get('ranges'):
        return
    kept = [cp for lo, hi in node['ranges'] for cp in range(lo, hi + 1) if cp not in cps_set]
    node['ranges'] = ranges_to_list(kept)

# ---------------------------------------------------------------- 主流程
def main():
    dry = '--dry' in sys.argv

    old = json.load(open(TAGS_JSON, encoding='utf-8'))
    old_roots = old['roots']

    # 旧语义数据
    sem_old = {k: v for k, v in old_roots.items() if k not in ('文字系统', '官方分类', '区块')}
    old_data = collect_old(sem_old)

    # 新树
    tree = parse_txt()
    new_roots, by_path = build_axis(tree)

    report = []
    unmapped = []
    migrated_count = 0

    def target(path, extra=()):
        """旧路径 → 新路径列表。"""
        if path in SPLITS:
            return list(SPLITS[path].keys()) + list(extra)
        np = MIGRATE.get(path, path)
        return [np]

    for path, data in old_data.items():
        ranges = data.get('ranges', [])
        seqs = data.get('seqs', [])
        src = data.get('src')
        if path in SPLIT_RANGES:
            # 按区间拆（区间正好覆盖旧节点 ranges）
            spec = SPLIT_RANGES[path]
            for np_, rngs in spec.items():
                cps = set(cp for lo, hi in rngs for cp in range(lo, hi + 1))
                extracted, _ = split_ranges(ranges, cps)
                if extracted:
                    add_ranges(by_path[np_], extracted)
                    migrated_count += len(extracted)
                    report.append(f'  拆r {path} → {np_}: {len(extracted)} 段')
        elif path in SPLITS:
            # 拆
            spec = SPLITS[path]
            for np_, cps in spec.items():
                extracted, _ = split_ranges(ranges, set(cps))
                if extracted:
                    add_ranges(by_path[np_], extracted)
                    migrated_count += len(extracted)
                    report.append(f'  拆  {path} → {np_}: {len(extracted)} 段')
            # seqs 无法按码位拆，原样给第一个目标（若只有一个目标）
            if seqs and len(spec) == 1:
                add_seqs(by_path[next(iter(spec))], seqs)
        else:
            np_ = MIGRATE.get(path, path)
            if np_ in by_path:
                if ranges:
                    add_ranges(by_path[np_], ranges)
                    migrated_count += len(ranges)
                if seqs:
                    by_path[np_].setdefault('seqs', []).extend(seqs)
                if src:
                    by_path[np_].setdefault('src', src)
                report.append(f'  迁  {path} → {np_}: ranges={len(ranges)} seqs={len(seqs)}')
            else:
                unmapped.append(path)

    # 额外移除/添加
    for path, cps in EXTRA_REMOVES.items():
        np_ = MIGRATE.get(path, path)
        if np_ in by_path:
            remove_ranges(by_path[np_], set(cps))
    for np_, cps in EXTRA_ADDS.items():
        if np_ in by_path:
            add_ranges(by_path[np_], ranges_to_list(cps))

    # 新根并入旧 JSON（替换语义轴，保留其他三轴）
    new_sem = {}
    for r in tree:
        name = r['name']
        node = new_roots[name]
        new_sem[name] = node
    new_roots_all = {}
    for k, v in old_roots.items():
        if k in ('文字系统', '官方分类', '区块'):
            new_roots_all[k] = v
    for k, v in new_sem.items():
        new_roots_all[k] = v
    new_roots_all['_order'] = None  # placeholder, 移除
    if '_order' in new_roots_all:
        del new_roots_all['_order']

    print('=== 迁移报告 ===')
    print(f'旧语义节点: {len(old_data)}，未映射: {unmapped or "无"}')
    print(f'ranges 迁移段数: {migrated_count}')
    print('--- 迁移明细（前 60 条）---')
    for l in report[:60]:
        print(l)
    if len(report) > 60:
        print(f'  … 共 {len(report)} 条')

    # 新轴数据覆盖统计
    def node_count(n):
        c = len(n.get('ranges', [])) + len(n.get('seqs', []))
        return c + sum(node_count(ch) for ch in n['children'].values())
    print('\n=== 新树各根覆盖（ranges 段数）===')
    for name in new_sem:
        print(f'  {name}: {node_count(new_sem[name])}')

    if not dry:
        old['roots'] = new_roots_all
        old['_v'] = old.get('_v', '17.0.0')
        json.dump(old, open(TAGS_JSON, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
        print('\n已写入 标签.json')

def add_seqs(node, seqs):
    node.setdefault('seqs', []).extend([list(s) for s in seqs])

if __name__ == '__main__':
    main()

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""从 emoji-test.txt 生成 ZWJ 序列数据并注入 标签.js（build_zwj.py，一次性脚本，跑完可删或保留）。

ZWJ 序列（含 U+200D，3+ 码位）塞不进单码位 ranges，节点用 seqs（同旗帜机制）:
  seqs: [[cp1, ..., cpN], ...]  **只存码位（归属）**

序列名**不进 标签.js**，写在名字层（键 = 连字符码位串 "128104-8205-9877-65039"）：
  中文名 → 官方名直译名.js   英文 → unicode官方名.js
  本脚本**独占这些键**，直接覆盖（页面改序列名走符号条目，从不写名字层）。

中文名：
  基础序列（无肤色）→ **官方英文名的机械直译**（词表见 emoji词表.py 的「ZWJ 序列专用」块，
                        引擎借 build_emoji_zh.translate），未命中程序化兜底（家庭/发型/爱情/面向右）
  肤色变体 → 肤色词 + 基础名（用户裁定：肤色前置、词简化）

  ⚠️ **名字层不取 CLDR**。CLDR 短名是俗名（`man rowing boat → 划船`），不含人称，
     男/女/中性三条序列会撞成同一个名字。俗名按分层原则只能进人工层的 alias。

序列别名（写 符号富化数据.js）：
  人称打头的序列 → 人称同义词 × (动作词 + 动作同义词)，见 PERSON_SYN / ACTION_SYN。
  只给**无肤色、不朝右**的基础序列（肤色变体是同一张折叠卡的下挂项）。
  别名一律**不进名字层**，也不当显示名。

归属：按 emoji-test 英文名规则映射到语义标签（肤色变体与基础节点同挂）
  ⚠️ 体育类序列**双挂**：「体育、运动/<项>」是主题轴，「人/人物角色/运动的人」是角色轴，
     两条轴正交，不是二选一（SPORTY 常量）。
"""
import json
import os
import re
import sys

BASE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE)
from datatool import (append_symbols, dump_data, dump_tags, load_symbols, read_data,
                      update_symbols, wrap, write_text)
# 直译引擎与单码位共用一份（词表和引擎都在 emoji词表.py）
from emoji词表 import translate
# 机械轴名单、条目取值函数与单码位那套共用（别名归属规则一致，别各写一份）
from build_emoji_zh import MECHANICAL_TAGS, entry_values

EMOJI_TEST = os.path.join(BASE, '参考资料', 'emoji-test.txt')
TAG_FILE = os.path.join(BASE, '标签.js')
ZH_FILE = os.path.join(BASE, '官方名直译名.js')
NM_FILE = os.path.join(BASE, 'unicode官方名.js')

# 肤色词（用户裁定简化版；拼接肤色在前）
SKIN_ZH = {0x1F3FB: '浅肤色', 0x1F3FC: '中浅肤色', 0x1F3FD: '中肤色', 0x1F3FE: '中深肤色', 0x1F3FF: '深肤色'}
SKIN_EN = re.compile(r'(light|medium-light|medium|medium-dark|dark) skin tone[, ]*')
# 肤色维度节点：人 根下建「肤色」，子节点 = 各肤色（按用户裁定挂所有出现的肤色，多挂合法）
SKIN_SUB = {0x1F3FB: '浅肤色', 0x1F3FC: '中浅肤色', 0x1F3FD: '中肤色', 0x1F3FE: '中深肤色', 0x1F3FF: '深肤色'}
# 反过来：从中文名里剥肤色前缀用（长词在前，免得「中浅肤色」被「浅肤色」误伤）
SKIN_PREFIX = ('中浅肤色', '中深肤色', '中肤色', '浅肤色', '深肤色')

# 程序化兜底词表（CLDR 未命中的基础序列）
FALLBACK = {
    'man': '男人', 'woman': '女人', 'person': '人',
    'red hair': '红发', 'curly hair': '卷发', 'white hair': '白发', 'bald': '秃顶',
    'beard': '胡须', 'blond': '金发',
    'boy': '男孩', 'girl': '女孩', 'adult': '大人', 'child': '孩子',
}

# 职业词表（CLDR 第一个注解常是泛词如'做饭'，fallback 优先）
OCCUPATIONS = {
    'health worker': '医生', 'student': '学生', 'teacher': '教师', 'judge': '法官',
    'farmer': '农民', 'cook': '厨师', 'mechanic': '机械师', 'factory worker': '工人',
    'office worker': '白领', 'scientist': '科学家', 'technologist': '技术员', 'singer': '歌手',
    'artist': '艺术家', 'pilot': '飞行员', 'astronaut': '宇航员', 'firefighter': '消防员',
    'police officer': '警察', 'detective': '侦探', 'guard': '卫兵', 'construction worker': '建筑工人',
}
# 注：这里只放**职业**。`wearing turban` 曾混在这儿，会让 `man wearing turban` 拼成
# 「男戴头巾的人」——它不是职业，交给直译（男人戴头巾）。


def occ_zh(en):
    """'cook' / 'man cook' / 'woman cook' → 厨师 / 男厨师 / 女厨师"""
    for occ, zh in OCCUPATIONS.items():
        if en == occ:
            return zh
        if en == 'man ' + occ:
            return '男' + zh
        if en == 'woman ' + occ:
            return '女' + zh
    return None


# 归属规则（按顺序匹配；每条返回一个或多个标签路径）
# 「运动的人」是**人物角色**轴，跟「体育、运动」那条**主题**轴正交：同一条序列两边都该在
# （跑/骑那两个是早年手工加的，其余一直漏着，🚣‍♂️ 只在「水上运动」里、不在「运动的人」里）。
SPORTY = '人/人物角色/运动的人'

RULES = [
    (lambda b: 'family:' in b, ['人/家庭']),
    (lambda b: 'feeding baby' in b, ['人/家庭']),
    (lambda b: any(k in b for k in ('red hair', 'curly hair', 'white hair', 'bald', 'beard', 'blond')),
     ['身体部位相关/头发、发型、发色']),
    (lambda b: any(k in b for k in (
        'health worker', 'student', 'teacher', 'judge', 'farmer', 'cook', 'mechanic', 'factory worker',
        'office worker', 'scientist', 'technologist', 'singer', 'artist', 'pilot', 'astronaut',
        'firefighter', 'police officer', 'detective', 'guard', 'construction worker', 'wearing turban')),
     ['人/职业']),
    (lambda b: 'tuxedo' in b or 'veil' in b, ['人/性别、婚姻']),
    (lambda b: any(k in b for k in ('mage', 'fairy', 'vampire', 'mermaid', 'merman', 'elf', 'genie', 'zombie')),
     ['人/人物角色/神仙巫师', '信仰、神秘学/神话、传说、外星人']),
    (lambda b: 'superhero' in b or 'supervillain' in b, ['人/人物角色/装扮、角色']),
    (lambda b: 'Mx Claus' in b, ['社会生活/节日、纪念日、庆祝/圣诞节']),
    (lambda b: 'getting massage' in b or 'getting haircut' in b, ['人/梳妆打扮']),
    (lambda b: any(k in b for k in ('walking', 'standing', 'kneeling', 'white cane', 'wheelchair')), ['人']),
    (lambda b: 'running' in b, ['体育、运动/田径运动', SPORTY]),
    (lambda b: 'ballet dancer' in b or 'bunny ears' in b, ['体育、运动/舞蹈', SPORTY]),
    (lambda b: any(k in b for k in ('surfing', 'rowing', 'swimming', 'water polo')),
     ['体育、运动/水上运动', SPORTY]),
    (lambda b: 'bouncing ball' in b or 'handball' in b, ['体育、运动/球类运动', SPORTY]),
    (lambda b: any(k in b for k in ('golfing', 'lifting weights', 'biking', 'mountain biking', 'cartwheeling',
                                    'wrestling', 'juggling', 'climbing', 'lotus position')),
     ['体育、运动/其他运动', SPORTY]),
    (lambda b: 'steamy room' in b, ['物品、用具/生活用品、生产用品']),
    (lambda b: 'service dog' in b or 'polar bear' in b or 'black cat' in b, ['自然、科学/生物/动物/哺乳动物']),
    (lambda b: 'black bird' in b, ['自然、科学/生物/动物/鸟类']),
    (lambda b: 'phoenix' in b, ['自然、科学/生物/动物/传说生物']),
    (lambda b: 'lime' in b, ['饮食/食物/水果、干果']),
    (lambda b: 'brown mushroom' in b, ['饮食/食物/蔬菜']),
    (lambda b: 'broken chain' in b, ['物品、用具']),
    (lambda b: 'rainbow flag' in b or 'transgender flag' in b or 'pirate flag' in b, ['标志/旗帜']),
    (lambda b: 'face in clouds' in b or 'face exhaling' in b or 'face with spiral eyes' in b, ['表情、表达/难受']),
    (lambda b: 'head shaking' in b, ['表情、表达/手势、姿势']),
    (lambda b: 'heart on fire' in b or 'mending heart' in b or 'couple with heart' in b or b.startswith('kiss'),
     ['表情、表达/喜欢、爱、尊敬']),
    (lambda b: 'holding hands' in b, ['人/性别、婚姻']),
    (lambda b: 'handshake' in b, ['表情、表达/手势、姿势']),
    (lambda b: 'eye in speech bubble' in b, ['表情、表达']),
    (lambda b: any(k in b for k in ('frowning', 'pouting', 'gesturing NO', 'gesturing OK', 'tipping hand',
                                    'raising hand', 'deaf', 'bowing', 'facepalming', 'shrugging')),
     ['表情、表达/手势、姿势']),
]


def strip_fe0f(s):
    return s.replace('️', '')


def en_clean(en):
    """emoji-test 注释形如 '😶🌫️ E13.1 face in clouds' → 剥 emoji 前缀与版本号 → 'face in clouds'"""
    m = re.match(r'^\S+\s+E\d+(?:\.\d+)?\s+(.*)$', en)
    return m.group(1) if m else en


def direct_zh(en):
    """官方英文名 → 机械直译。词表查不到的词原样留着，此时返回 '' 并记进 MISSING_WORDS。

    返回空串而不是半英半中的串：漏词是**词表没补全**，要让它显式爆在 missing_zh 里，
    不能静默产出「男人SURFING」这种名字。
    """
    unknown = []
    out = translate(en.upper().split(), unknown)
    if unknown:
        MISSING_WORDS.update(unknown)
        return ''
    return out


MISSING_WORDS = {}


def parse_emoji_test():
    """全部含 U+200D 的 fully-qualified 序列 → [(cps, en_name), ...]"""
    out = []
    with open(EMOJI_TEST, encoding='utf-8') as f:
        for line in f:
            if line.startswith('#') or not line.strip():
                continue
            if line.split(';')[1].split()[0] != 'fully-qualified':
                continue
            cps = [int(c, 16) for c in line.split(';')[0].strip().split()]
            if 0x200D not in cps:
                continue
            out.append((cps, line.split('#')[1].strip()))
    return out


def is_skin(cp):
    return 0x1F3FB <= cp <= 0x1F3FF


def fallback_zh(en):
    """**句式**命名（直译引擎按「词 + 短语」翻，盖不住这些带冒号/逗号的结构）：

    握手 / 职业 / 超级英雄 / 家庭 / 爱情 / 发型。
    逐词拼会串味（`family: man, woman, girl` 会拼成「家庭男人女人女孩」），
    所以在这儿按模式生成，剩下的才交给 direct_zh 逐词直译。
    """
    if en.startswith('handshake'):
        return '握手'
    occ = occ_zh(en)
    if occ:
        return occ
    if 'superhero' in en or 'supervillain' in en:
        zh = '超级英雄' if 'superhero' in en else '超级反派'
        if en.startswith('man '):
            return '男' + zh
        if en.startswith('woman '):
            return '女' + zh
        return zh
    if en.startswith('family:'):
        members = [FALLBACK.get(x.strip(), x.strip()) for x in en.split(':', 1)[1].split(',')]
        return '家庭：' + '、'.join(members)
    m = re.match(r'kiss: (.*)$', en)
    if m:
        pair = [FALLBACK.get(x.strip(), x.strip()) for x in m.group(1).split(',')]
        return '和'.join(pair) + '接吻'
    m = re.match(r'couple with heart: (.*)$', en)
    if m:
        pair = [FALLBACK.get(x.strip(), x.strip()) for x in m.group(1).split(',')]
        return '和'.join(pair) + '情侣'
    m = re.match(r'(man|woman|person): (red hair|curly hair|white hair|bald|beard|blond hair)$', en)
    if m:
        person, hair = m.groups()
        hz = FALLBACK.get(hair) or FALLBACK.get(hair.replace(' hair', ''))
        return (hz or hair) + FALLBACK[person]
    return ''


def base_cps_of(cps):
    """序列去朝右箭头 0x27A1 及其前导 ZWJ → 基础序列码位（🚶➡️ → 🚶）"""
    out = []
    for c in cps:
        if c == 0x27A1:
            if out and out[-1] == 0x200D:
                out.pop()
            continue
        out.append(c)
    return out


# 双肤色序列动作词（握手/牵手/摔跤/兔耳舞/接吻/相爱 等多人组合）
MULTI_ACTION = [
    ('holding hands', '牵手'),
    ('handshake', '握手'),
    ('wrestling', '摔跤'),
    ('with bunny ears', '戴兔耳'),
    ('kiss', '接吻'),
    ('couple with heart', '相爱'),
]


def multi_skin_zh(skins, en):
    """双肤色序列名。交互动作（牵手/握手/接吻）→ 肤色1人[动作]肤色2人；共同动作（戴兔耳/摔跤/相爱）→ 肤色1人与肤色2人[动作]。"""
    for act, zh in MULTI_ACTION:
        if act not in en:
            continue
        if 'kiss:' in en or 'couple with heart:' in en:
            # 格式 'kiss: man, man' / 'couple with heart: person, person'
            m = re.match(r'(?:kiss|couple with heart):\s*(.*)$', en)
            pair = [x.strip() for x in m.group(1).split(',')[:2]]
            p1 = {'man': '男人', 'woman': '女人', 'person': '人'}.get(pair[0], '人')
            p2 = {'man': '男人', 'woman': '女人', 'person': '人'}.get(pair[1], '人')
            return SKIN_ZH[skins[0]] + p1 + zh + SKIN_ZH[skins[1]] + p2
        person = '男人' if en.startswith('men') else '女人' if en.startswith('women') else '人'
        if act in ('with bunny ears', 'wrestling'):
            return SKIN_ZH[skins[0]] + person + '与' + SKIN_ZH[skins[1]] + person + zh
        return SKIN_ZH[skins[0]] + person + zh + SKIN_ZH[skins[1]] + person
    return None


def zh_of(cps, en):
    """一条序列的中文名：多肤色 = 肤色1人+动作+肤色2人；单肤色 = 肤色词+基础名；面向右 = 基础名+朝右；基础 = 直译"""
    skin = [c for c in cps if is_skin(c)]
    if len(skin) >= 2:
        base_en = SKIN_EN.sub('', en).rstrip(': ').strip()
        r = multi_skin_zh(skin, base_en)
        if r:
            return r
        # 未命中动作词（罕见）→ 退单肤色逻辑（取第一个肤色）
        return SKIN_ZH[skin[0]] + zh_of([c for c in cps if not is_skin(c)], base_en)
    if skin:
        base_cps = [c for c in cps if not is_skin(c)]
        base_en = SKIN_EN.sub('', en).rstrip(': ').strip()  # 'cook: light skin tone'→'cook'
        base = zh_of(base_cps, base_en)
        return SKIN_ZH[skin[0]] + base
    m = re.match(r'^(.*) facing right$', en)
    if m:
        base_en = m.group(1)
        base = zh_of(base_cps_of(cps), base_en)
        return base + '朝右' if base else ''
    fb = fallback_zh(en)
    if fb:
        return fb  # 句式（家庭/发型/爱情/握手/职业）
    return direct_zh(en)


def classify(en):
    """归属：按英文名规则表匹配（肤色片段先剥除）。"""
    base = SKIN_EN.sub('', en).rstrip(': ').strip()
    for cond, paths in RULES:
        if cond(base):
            return paths
    return []


def get_node(roots, path):
    parts = path.split('/')
    node = roots.get(parts[0])
    if node is None:
        return None
    for p in parts[1:]:
        if node is None:
            return None
        node = node.get('children', {}).get(p)
    return node


def seq_cps(s):
    i = len(s)
    while i > 0 and isinstance(s[i - 1], str):
        i -= 1
    return s[:i]


def seqs_contains(seqs, cps):
    return any(seq_cps(s) == cps for s in seqs)


# ==================== 序列别名（供搜索） ====================
# 「男人」这个人称在中文里有好几种写法：男人 / 男子 / 男生（女性同理）。搜索的人用哪种都可能，
# 别名就得把这些写法全兜住 —— 所以按**人称同义词 × 动作同义词**做笛卡尔积，
# 而不是把官方名换个说法了事。
PERSON_SYN = {
    'man': ['男人', '男子', '男生'], 'men': ['男人', '男子', '男生'],
    'woman': ['女人', '女子', '女生'], 'women': ['女人', '女子', '女生'],
    'person': ['人'], 'people': ['人'],
}

# 动作/身份的同义词。**只收真有第二种通行说法的**，没有就留空 —— 别为了凑数编一个
# （「游泳」就没有同义词）。来源是 CLDR 里质量过关的那几条，联想词已筛掉：
# `划船` 那组 CLDR 俗名里的 `河`/`湖`/`钓鱼`/`船` 是联想不是名字，`冲刺`/`训练` 同理。
ACTION_SYN = {
    'rowing boat': ['划艇', '泛舟'],
}

# CLDR `tts` 里逐条挑出来的俗名别名（2026-09-15 人工筛，共 30 条）。
# **不要整批灌 CLDR** —— 它是半吊子翻译，同一组里混着联想词（`河`/`湖`/`钓鱼`/`船`
# 之于「划船」、`冲刺`/`训练` 之于「跑步」），整批进来别名行就成垃圾场了。
# 这里放的只是「确认比现有名字更好搜」的那些说法，按**官方英文名**做键（比码位可读、比中文名稳）。
# 只增不改：脚本不会删任何已有别名。
CLDR_PICKED_ALIAS = {
    'face exhaling': '呼气',
    'face with spiral eyes': '晕',
    'man farmer': '农夫', 'woman farmer': '农妇',
    'mechanic': '技工', 'man mechanic': '男技工', 'woman mechanic': '女技工',
    'technologist': '程序员', 'man technologist': '男程序员', 'woman technologist': '女程序员',
    'man feeding baby': '哺乳的男人', 'woman feeding baby': '哺乳的女人', 'person feeding baby': '哺乳的人',
    'Mx Claus': '圣诞人',
    'man with white cane': '拄盲杖的男人', 'woman with white cane': '拄盲杖的女人',
    'person with white cane': '拄盲杖的人',
    'man in motorized wheelchair': '坐电动轮椅的男人', 'woman in motorized wheelchair': '坐电动轮椅的女人',
    'person in motorized wheelchair': '坐电动轮椅的人',
    'man in manual wheelchair': '坐手动轮椅的男人', 'woman in manual wheelchair': '坐手动轮椅的女人',
    'person in manual wheelchair': '坐手动轮椅的人',
    'people holding hands': '手拉手的两个人',
    'family: adult, adult, child': '一孩家庭',
    'family: adult, adult, child, child': '二孩家庭',
    'family: adult, child': '单亲一孩家庭',
    'family: adult, child, child': '单亲二孩家庭',
    'black bird': '黑色的鸟',
    'brown mushroom': '褐色蘑菇',
}


def seq_aliases(en, zh):
    """一条序列的搜索别名：人称同义词 × (动作词 + 动作同义词)。

    `zh` 是已算好的显示名，要排除掉（别名不得与显示名同字，数据说明 §四）。
    非人称打头的序列（国家、家庭、表情、旗帜…）返回空 —— 它们没有人称变体可展开。
    """
    m = re.match(r'^(man|woman|person|men|women|people)\s+(.*)$', en)
    if not m:
        return []
    person, rest_en = m.groups()
    rest_zh = direct_zh(rest_en)
    if not rest_zh:
        return []
    out = []
    for p in PERSON_SYN[person]:
        for t in [rest_zh] + ACTION_SYN.get(rest_en, []):
            a = p + t
            if a != zh and a not in out:
                out.append(a)
    return out


def seq_tag(cps, roots):
    """含该序列的**最深**非机械标签的叶名（= 组键）。找不到返回 None。

    组键必须是现存标签名，且该标签要真的含这个字符（数据说明 §三），所以按 seqs 往下钻；
    钻到最深那层，跟单码位那边 `deepest_semantic_tag` 的判据一致。
    """
    target = list(cps)
    best = [-1, None]

    def walk(name, node, depth):
        if name in MECHANICAL_TAGS:
            return
        if any(seq_cps(s) == target for s in (node.get('seqs') or [])) and depth > best[0]:
            best[0], best[1] = depth, name
        for child_name, child in (node.get('children') or {}).items():
            walk(child_name, child, depth + 1)

    for name, root in (roots or {}).items():
        walk(name, root, 1)
    return best[1]


PERSON_WORDS = ('男人', '女人', '人')


def split_person(zh):
    """把显示名拆成 (肤色前缀, 人称词, 其余)。拆不出人称返回 None。

    `浅肤色男人划船` → ('浅肤色', '男人', '划船')。
    """
    skin = ''
    for p in SKIN_PREFIX:
        if zh.startswith(p):
            skin, zh = p, zh[len(p):]
            break
    for p in PERSON_WORDS:
        if zh.startswith(p):
            return skin, p, zh[len(p):]
    return None


def seq_group_names(zh, paths):
    """运动类序列在两条轴上的**语境名**：主题轴「男人划船」/ 角色轴「划船男人」。

    两条轴正交（见 SPORTY），同一条序列在两边该读成不同的短语：在「水上运动」里
    是「男人划船」这件事，在「运动的人」里是「划船男人」这个人。

    ⚠️ 全局名 = 各语境名拼接（`符号.js` 的 `joinGroupNames`），所以这条序列的全局名
       会变成「男人划船、划船男人」。单码位 🚣 就是这个形态（「划船、划船的人」）。
    """
    topic = next((p for p in paths if p.startswith('体育、运动/')), None)
    if not topic:
        return {}                       # 不是运动类（职业/神仙/表情…），不适用双轴命名
    sp = split_person(zh)
    if not sp:
        return {}
    skin, person, rest = sp
    if not rest:
        return {}
    # 多人组合（`浅肤色男人与中浅肤色男人戴兔耳`、`…人牵手中肤色人`）有**两个**人称，
    # 句首那个搬不走：搬出来是「浅肤色与中浅肤色男人戴兔耳男人」。这种就不拆，只留主题名。
    if '与' in rest or any(w in rest for w in PERSON_WORDS):
        return {topic.split('/')[-1]: {'name': zh}}
    return {topic.split('/')[-1]: {'name': skin + person + rest},
            '运动的人': {'name': skin + rest + person}}


def write_seq_meta(plan):
    """把序列的组名/别名落进 符号富化数据.js。只增不改，可重跑。返回 (补名条数, 新建条数)。

    plan: {字符: {组键: {'name': str|None, 'alias': [str, ...]}}}；
    组键 None（取不到语义标签）时别名挂条目级，跟单码位那边的处理一致。
    """
    if not plan:
        return 0, 0
    by_char = {e['char']: e for e in load_symbols()}

    todo = {}
    for ch, groups in plan.items():
        entry = by_char.get(ch)
        if entry is None:
            continue
        have = set(entry_values(entry))
        keep = {}
        for tag, item in groups.items():
            name = item.get('name')
            # 名字已等于本条任何既有显示名就跳过（含组名/条目名，防自相重复）
            if name and name not in have:
                keep.setdefault(tag, {})['name'] = name
            add = [a for a in (item.get('alias') or []) if a not in have]
            if add:
                keep.setdefault(tag, {})['alias'] = add
        if keep:
            todo[ch] = keep

    def fix(entry):
        groups = todo.get(entry['char'])
        if not groups:
            return False
        for tag, item in groups.items():
            bucket = entry.setdefault('groups', {}).setdefault(tag, {}) if tag else entry
            if item.get('name'):
                bucket['name'] = item['name']
            if item.get('alias'):
                cur = bucket.setdefault('alias', [])
                cur += [a for a in item['alias'] if a not in cur]
        return True

    patched = update_symbols(fix) if todo else 0

    fresh = []
    for ch, groups in plan.items():
        if ch in by_char:
            continue
        if None in groups:
            fresh.append({'char': ch, 'alias': list(groups[None].get('alias') or [])})
        else:
            fresh.append({'char': ch, 'groups': groups})
    return patched, append_symbols(fresh) if fresh else 0


def _sortkey(k):
    """码点键按数值升序在前，序列键（'-'）在后"""
    return ('-' in k, int(k) if '-' not in k else 0, k)


def write_name_layer(zh_pairs, en_pairs):
    """把序列名/单码点名写入名字层。

    ⚠️ 这些键由本脚本**独占**，直接覆盖：页面编辑序列名走的是符号条目（语境名/别名），
       从不写名字层，所以这里覆盖不会冲突人工改动。
    zh_pairs / en_pairs：{键: 名}，键为十进制码点或连字符码位串。
    """
    for path, var, pairs in ((ZH_FILE, 'ZH_TRANSLATION_DATA', zh_pairs),
                             (NM_FILE, 'UNICODE_NAMES_DATA', en_pairs)):
        if not pairs:
            continue
        d = read_data(path, var)
        for k, v in pairs.items():
            if v:
                d['names'][k] = v
        d['names'] = dict(sorted(d['names'].items(), key=lambda kv: _sortkey(kv[0])))
        write_text(path, dump_data(d, var))


def main():
    seqs = parse_emoji_test()
    print(f'ZWJ 序列总数: {len(seqs)}')

    data = read_data(TAG_FILE, 'TAGS_DATA')
    roots = data['roots']

    added = {}
    missing_zh = []
    unclassified = []
    no_node = []
    seq_zh, seq_en = {}, {}          # 序列名 → 名字层（seqs 只留码位）
    seq_meta = {}                    # 字符 → {组键: {name/alias}}
    for cps, en in seqs:
        en = en_clean(en)
        zh = zh_of(cps, en)
        paths = classify(en)
        if not zh:
            missing_zh.append(en)
        if not paths:
            unclassified.append(en)
            continue
        key = '-'.join(map(str, cps))
        if zh:
            seq_zh[key] = zh
        if en:
            seq_en[key] = en
        if zh and 0x27A1 not in cps:
            ch = ''.join(chr(c) for c in cps)
            slot = seq_meta.setdefault(ch, {})
            # 语境名**先**写：组键的插入顺序决定全局名的拼接顺序（`符号.js` 的
            # `joinGroupNames` 按组序取），主题轴的名该排在角色轴前面。
            # 连肤色变体一起给：语境名是**按字符**取的，变体也得能在轴下读通。
            for tag, item in seq_group_names(zh, paths).items():
                slot.setdefault(tag, {}).update(item)
            # 别名只给**无肤色**的基础序列：肤色变体是同一张折叠卡的下挂项，
            # 给它挂「男生划船」只会把搜索引到浅肤色那条上（v1.37.0 修过同类坑）。
            if not any(is_skin(c) for c in cps):
                base_en = SKIN_EN.sub('', en).rstrip(': ').strip()
                picked = CLDR_PICKED_ALIAS.get(base_en)
                al = (seq_aliases(base_en, zh) or []) + ([picked] if picked else [])
                al = [a for a in al if a != zh]      # 别名不得与显示名同字（数据说明 §四）
                if al:
                    # 别名**每个语境组都挂一份**：详情面板的语境别名 = 本组 alias ∪ 其他组名
                    # （`符号.js` 的 ctxAliases），只挂一个组的话，在另一个标签下点开就看不到。
                    for t in (list(seq_group_names(zh, paths)) or [seq_tag(cps, roots)]):
                        slot.setdefault(t, {})['alias'] = al
            if not slot:
                seq_meta.pop(ch)
        for path in paths:
            node = get_node(roots, path)
            if node is None:
                no_node.append(path)
                continue
            node.setdefault('seqs', [])
            if not seqs_contains(node['seqs'], cps):
                node['seqs'].append(list(cps))
                added[path] = added.get(path, 0) + 1

    for path in added:
        node = get_node(roots, path)
        node['seqs'].sort(key=lambda s: tuple(s[:2]))

    # ===== 肤色维度（人 > 肤色 > 各肤色；含肤色序列按出现的肤色多挂 + 修饰符单码位）=====
    person = roots['人']
    pchildren = person.setdefault('children', {})
    if '肤色' not in pchildren:
        new_pc = {}
        for k, v in pchildren.items():
            new_pc[k] = v
            if k == '性别、婚姻':  # 肤色插在 性别、婚姻 之后（人属性聚集）
                new_pc['肤色'] = {'children': {sk: {'children': {}} for sk in SKIN_SUB.values()}}
        pchildren.clear()
        pchildren.update(new_pc)
    skin_root = pchildren['肤色']['children']
    skin_added = {}
    for cps, en in seqs:
        en = en_clean(en)
        skins = [c for c in cps if is_skin(c)]
        if not skins:
            continue
        zh = zh_of(cps, en)
        for sk in set(skins):  # 双肤色（握手）多挂
            node = skin_root[SKIN_SUB[sk]]
            node.setdefault('seqs', [])
            if not seqs_contains(node['seqs'], cps):
                node['seqs'].append(list(cps))
                skin_added[SKIN_SUB[sk]] = skin_added.get(SKIN_SUB[sk], 0) + 1
    for node in skin_root.values():
        node['seqs'].sort(key=lambda s: tuple(s[:2]))
    # 修饰符单码位（🏻🏼🏽🏾🏿）挂对应肤色节点 ranges + 官方名直译名.js 显式条目
    for cp, name in SKIN_SUB.items():
        node = skin_root[name]
        ranges = node.setdefault('ranges', [])
        if not any(lo <= cp <= hi for lo, hi in ranges):
            ranges.append([cp, cp])
            ranges.sort()
        seq_zh[str(cp)] = name

    # ===== emoji 标签挂载（ZWJ 序列是 emoji）=====
    emojinode = roots['emoji（绘文字）']
    emojinode.setdefault('seqs', [])
    emoji_added = 0
    for cps, en in seqs:
        if not seqs_contains(emojinode['seqs'], cps):
            emojinode['seqs'].append(list(cps))
            emoji_added += 1
    emojinode['seqs'].sort(key=lambda s: tuple(s[:2]))
    print(f'emoji（绘文字）挂载: 共 {len(emojinode["seqs"])} 条 ZWJ 序列')

    # ===== 序列名写入名字层（seqs 只留归属，名字不进 标签.js）=====
    write_name_layer(seq_zh, seq_en)
    print(f'名字层写入序列名: 中文 {len(seq_zh)} 条 / 英文 {len(seq_en)} 条')

    patched, fresh = write_seq_meta(seq_meta)
    print(f'序列组名/别名: 补进已有条目 {patched} 条 / 新建条目 {fresh} 条（共 {len(seq_meta)} 组）')

    write_text(TAG_FILE, wrap('TAGS_DATA', dump_tags(data)))

    print(f'注入完成: {sum(added.values())} 条 -> {len(added)} 个节点')
    for path, n in sorted(added.items()):
        print(f'  {path}: {n}')
    print('肤色维度:')
    for name, node in skin_root.items():
        print(f'  人/肤色/{name}: seqs {len(node.get("seqs") or [])} + 修饰符 {len(node.get("ranges") or [])}')
    if missing_zh:
        print(f'缺中文名 {len(missing_zh)}:')
        for m in missing_zh[:20]:
            print(f'  {m}')
    if unclassified:
        print(f'未分类 {len(unclassified)}:')
        for m in unclassified[:20]:
            print(f'  {m}')
    if no_node:
        print(f'目标节点不存在 {len(no_node)}:')
        for m in set(no_node):
            print(f'  {m}')


if __name__ == '__main__':
    main()

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""从 emoji-test.txt 生成 ZWJ 序列数据并注入 标签.json（build_zwj.py，一次性脚本，跑完可删或保留）。

ZWJ 序列（含 U+200D，3+ 码位）塞不进单码位 ranges，节点用 seqs（同旗帜机制）:
  seqs: [[cp1, ..., cpN, zh, en], ...]  码位在前 + 中英文名

中文名：
  基础序列（无肤色）→ CLDR zh 注解优先（剥 VS16 匹配），未命中程序化兜底（家庭/发型/爱情/面向右）
  肤色变体 → 肤色词 + 基础名（用户裁定：肤色前置、词简化）
归属：按 emoji-test 英文名规则映射到语义标签（肤色变体与基础同节点）
"""
import json
import os
import re

BASE = os.path.dirname(os.path.abspath(__file__))
EMOJI_TEST = os.path.join(BASE, '参考资料', 'emoji-test.txt')
ANNOTATIONS = os.path.join(BASE, '参考资料', 'annotations-zh.json')
TAG_FILE = os.path.join(BASE, '标签.json')
ZH_FILE = os.path.join(BASE, '中文名.json')

# 肤色词（用户裁定简化版；拼接肤色在前）
SKIN_ZH = {0x1F3FB: '浅肤色', 0x1F3FC: '中浅肤色', 0x1F3FD: '中肤色', 0x1F3FE: '中深肤色', 0x1F3FF: '深肤色'}
SKIN_EN = re.compile(r'(light|medium-light|medium|medium-dark|dark) skin tone[, ]*')
# 肤色维度节点：人 根下建「肤色」，子节点 = 各肤色（按用户裁定挂所有出现的肤色，多挂合法）
SKIN_SUB = {0x1F3FB: '浅肤色', 0x1F3FC: '中浅肤色', 0x1F3FD: '中肤色', 0x1F3FE: '中深肤色', 0x1F3FF: '深肤色'}

# 程序化兜底词表（CLDR 未命中的基础序列）
FALLBACK = {
    'man': '男人', 'woman': '女人', 'person': '人',
    'red hair': '红发', 'curly hair': '卷发', 'white hair': '白发', 'bald': '秃顶',
    'beard': '胡须', 'blond': '金发',
    'boy': '男孩', 'girl': '女孩', 'adult': '大人', 'child': '孩子',
}

# 职业词表（CLDR 第一个注解常是泛词如'做饭'，fallback 优先）
OCCUPATIONS = {
    'health worker': '医务工作者', 'student': '学生', 'teacher': '教师', 'judge': '法官',
    'farmer': '农民', 'cook': '厨师', 'mechanic': '机械师', 'factory worker': '工人',
    'office worker': '白领', 'scientist': '科学家', 'technologist': '技术员', 'singer': '歌手',
    'artist': '艺术家', 'pilot': '飞行员', 'astronaut': '宇航员', 'firefighter': '消防员',
    'police officer': '警察', 'detective': '侦探', 'guard': '卫兵', 'construction worker': '建筑工人',
    'wearing turban': '戴头巾的人',
}


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


# 动作词（CLDR 第一个注解常是性别泛词如'男'/'女'，程序化兜底：动作+人）
ACTION_ZH = {
    'gesturing NO': '打叉', 'gesturing OK': '打勾', 'tipping hand': '托腮',
    'facepalming': '捂脸', 'standing': '站立', 'running': '跑步', 'golfing': '打高尔夫',
    'swimming': '游泳', 'playing water polo': '打水球', 'playing handball': '打手球',
    'juggling': '玩杂耍', 'getting massage': '按摩', 'getting haircut': '理发',
    'bouncing ball': '拍球', 'wrestling': '摔跤',
    'with bunny ears': '戴兔耳', 'holding hands': '牵手',
}


def action_zh(en):
    for action, zh in ACTION_ZH.items():
        if action in en:
            if en.startswith('woman and man ') or en.startswith('man and man ') or en.startswith('woman and woman '):
                return zh + '的人'
            if en.startswith('man '):
                return zh + '男人'
            if en.startswith('woman '):
                return zh + '女人'
            if en.startswith('person '):
                return zh + '人'
            if en.startswith('men ') or en.startswith('women ') or en.startswith('people '):
                return zh + '的人'
            return zh + '的人'
    return None


# 显式覆盖（CLDR 第一个注解是泛词/关联词，程序化兜底更精确）
EXTRA_ZH = {
    'heart on fire': '燃烧的心',
    'mending heart': '修复的心',
    'face with spiral eyes': '头晕眼花',
    'man feeding baby': '哺乳的男人', 'woman feeding baby': '哺乳的女人', 'person feeding baby': '哺乳的人',
    'man in tuxedo': '穿燕尾服的男士', 'woman in tuxedo': '穿燕尾服的女士',
    'man with veil': '蒙头纱的男士', 'woman with veil': '蒙头纱的女士',
    'Mx Claus': '圣诞老人',
    'man with white cane': '拿白杖的男人', 'woman with white cane': '拿白杖的女人',
    'person with white cane': '拄白手杖的人',
    'man walking': '走路的人', 'woman walking': '走路的人', 'person walking': '走路的人',
    'broken chain': '断链',
    'polar bear': '北极熊', 'black bird': '黑鸟', 'phoenix': '凤凰',
    'rainbow flag': '彩虹旗', 'transgender flag': '跨性别旗', 'pirate flag': '海盗旗',
}

# 归属规则（按顺序匹配；每条返回一个或多个标签路径）
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
    (lambda b: 'running' in b, ['体育、运动/田径运动']),
    (lambda b: 'ballet dancer' in b or 'bunny ears' in b, ['体育、运动/舞蹈']),
    (lambda b: any(k in b for k in ('surfing', 'rowing', 'swimming', 'water polo')), ['体育、运动/水上运动']),
    (lambda b: 'bouncing ball' in b or 'handball' in b, ['体育、运动/球类运动']),
    (lambda b: any(k in b for k in ('golfing', 'lifting weights', 'biking', 'mountain biking', 'cartwheeling',
                                    'wrestling', 'juggling', 'climbing', 'lotus position')), ['体育、运动/其他运动']),
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


def load_cldr():
    """CLDR zh 注解：剥 VS16 后的序列串 → 中文名列表"""
    d = json.load(open(ANNOTATIONS, encoding='utf-8'))
    return {strip_fe0f(k): v['default'] for k, v in d['annotations']['annotations'].items()}


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
    """从 emoji-test 英文名翻译（发型/家庭/爱情/握手/职业/超级英雄：程序化名比 CLDR 第一个宽泛词更精确）。"""
    if en.startswith('handshake'):
        return '握手'
    if en in EXTRA_ZH:
        return EXTRA_ZH[en]
    occ = occ_zh(en)
    if occ:
        return occ
    act = action_zh(en)
    if act:
        return act
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
        return ''.join(pair) + '接吻'
    m = re.match(r'couple with heart: (.*)$', en)
    if m:
        pair = [FALLBACK.get(x.strip(), x.strip()) for x in m.group(1).split(',')]
        return ''.join(pair) + '情侣'
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


def zh_of(cps, en, cldr):
    """一条序列的中文名：多肤色 = 肤色1人+动作+肤色2人；单肤色 = 肤色词+基础名；面向右 = 基础名+朝右；基础 = CLDR 优先"""
    skin = [c for c in cps if is_skin(c)]
    if len(skin) >= 2:
        base_en = SKIN_EN.sub('', en).rstrip(': ').strip()
        r = multi_skin_zh(skin, base_en)
        if r:
            return r
        # 未命中动作词（罕见）→ 退单肤色逻辑（取第一个肤色）
        return SKIN_ZH[skin[0]] + zh_of([c for c in cps if not is_skin(c)], base_en, cldr)
    if skin:
        base_cps = [c for c in cps if not is_skin(c)]
        base_en = SKIN_EN.sub('', en).rstrip(': ').strip()  # 'cook: light skin tone'→'cook'
        base = zh_of(base_cps, base_en, cldr)
        return SKIN_ZH[skin[0]] + base
    m = re.match(r'^(.*) facing right$', en)
    if m:
        base_en = m.group(1)
        base = zh_of(base_cps_of(cps), base_en, cldr)
        return base + '朝右' if base else ''
    key = strip_fe0f(''.join(chr(c) for c in cps))
    fb = fallback_zh(en)
    if fb:
        return fb  # 发型/家庭/爱情/握手：程序化名比 CLDR 第一个宽泛词更精确
    if key in cldr:
        return cldr[key][0]
    return ''


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


def zhname_set(cp, name):
    """写 中文名.json 显式条目（有则改，无则升序插入）。保留原换行风格。"""
    text = open(ZH_FILE, encoding='utf-8', newline='').read()
    nl = '\r\n' if '\r\n' in text else '\n'
    d = json.loads(text)
    names = d['names']
    lo, hi = 0, len(names) - 1
    idx = None
    while lo <= hi:
        mid = (lo + hi) // 2
        c = names[mid][0]
        if c == cp:
            idx = mid
            break
        if c < cp:
            lo = mid + 1
        else:
            hi = mid - 1
    if idx is not None:
        names[idx][1] = name
    else:
        names.insert(lo, [cp, name])
    body = json.dumps(d, ensure_ascii=False, indent=2).replace('\n', nl)
    open(ZH_FILE, 'w', encoding='utf-8', newline='').write(body)


def main():
    cldr = load_cldr()
    seqs = parse_emoji_test()
    print(f'ZWJ 序列总数: {len(seqs)}')

    text = open(TAG_FILE, encoding='utf-8', newline='').read()
    nl = '\r\n' if '\r\n' in text else '\n'
    data = json.loads(text)
    roots = data['roots']

    added = {}
    missing_zh = []
    unclassified = []
    no_node = []
    for cps, en in seqs:
        en = en_clean(en)
        zh = zh_of(cps, en, cldr)
        paths = classify(en)
        if not zh:
            missing_zh.append(en)
        if not paths:
            unclassified.append(en)
            continue
        for path in paths:
            node = get_node(roots, path)
            if node is None:
                no_node.append(path)
                continue
            node.setdefault('seqs', [])
            entry = cps + [zh, en]
            idx = next((i for i, s in enumerate(node['seqs']) if seq_cps(s) == cps), None)
            if idx is None:
                node['seqs'].append(entry)
                added[path] = added.get(path, 0) + 1
            else:
                node['seqs'][idx] = entry  # 重跑幂等：同码位更新名字

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
        zh = zh_of(cps, en, cldr)
        for sk in set(skins):  # 双肤色（握手）多挂
            node = skin_root[SKIN_SUB[sk]]
            node.setdefault('seqs', [])
            entry = cps + [zh, en]
            idx = next((i for i, s in enumerate(node['seqs']) if seq_cps(s) == cps), None)
            if idx is None:
                node['seqs'].append(entry)
                skin_added[SKIN_SUB[sk]] = skin_added.get(SKIN_SUB[sk], 0) + 1
            else:
                node['seqs'][idx] = entry
    for node in skin_root.values():
        node['seqs'].sort(key=lambda s: tuple(s[:2]))
    # 修饰符单码位（🏻🏼🏽🏾🏿）挂对应肤色节点 ranges + 中文名.json 显式条目
    for cp, name in SKIN_SUB.items():
        node = skin_root[name]
        ranges = node.setdefault('ranges', [])
        if not any(lo <= cp <= hi for lo, hi in ranges):
            ranges.append([cp, cp])
            ranges.sort()
        zhname_set(cp, name)

    # ===== emoji 标签挂载（ZWJ 序列是 emoji）=====
    emojinode = roots['emoji（绘文字）']
    emojinode.setdefault('seqs', [])
    emoji_added = 0
    for cps, en in seqs:
        en = en_clean(en)
        zh = zh_of(cps, en, cldr)
        entry = cps + [zh, en]
        idx = next((i for i, s in enumerate(emojinode['seqs']) if seq_cps(s) == cps), None)
        if idx is None:
            emojinode['seqs'].append(entry)
            emoji_added += 1
        else:
            emojinode['seqs'][idx] = entry
    emojinode['seqs'].sort(key=lambda s: tuple(s[:2]))
    print(f'emoji（绘文字）挂载: 共 {len(emojinode["seqs"])} 条 ZWJ 序列')

    body = json.dumps(data, ensure_ascii=False, indent=2).replace('\n', nl)
    open(TAG_FILE, 'w', encoding='utf-8', newline='').write(body)

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

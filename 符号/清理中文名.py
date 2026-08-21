# -*- coding: utf-8 -*-
"""
数据清理：中文名.json 修正（item4/5/6）
  item4: 🪠马桶塞、🧝精灵、𜱏 触手鱿鱼名
  item5: 西里尔名英文残留翻译（WITH 词尾 + 符号 + 术语），字母名保持拉丁
  item6: 杭州数字→苏州码子，〇(U+3007)→苏州码子零
运行： python 清理中文名.py
"""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
ZH_JSON = os.path.join(HERE, '中文名.json')


def load():
    return json.load(open(ZH_JSON, encoding='utf-8'))


# ---------- item4/item6：按码位直接改名 ----------
CP_FIX = {
    # item4
    '0x1FAA0': '马桶塞',              # PLUNGER 活塞 → 马桶塞
    '0x1F9DD': '精灵',                # ELF 小精灵 → 精灵
    '0x1CC4E': '张开触手的外星鱿鱼',   # ALIEN SQUID OPEN TENTACLES
    '0x1CC4F': '收起触手的外星鱿鱼',   # ALIEN SQUID CLOSED TENTACLES
    # item6：〇 = 苏州码子的 0
    '0x3007': '苏州码子零',           # IDEOGRAPHIC NUMBER ZERO
    # item6：杭州数字 → 苏州码子（Unicode 官方名是历史误名）
    '0x3021': '苏州码子一',
    '0x3022': '苏州码子二',
    '0x3023': '苏州码子三',
    '0x3024': '苏州码子四',
    '0x3025': '苏州码子五',
    '0x3026': '苏州码子六',
    '0x3027': '苏州码子七',
    '0x3028': '苏州码子八',
    '0x3029': '苏州码子九',
    '0x3038': '苏州码子十',
    '0x3039': '苏州码子二十',
    '0x303A': '苏州码子三十',
}

# ---------- item5：西里尔 WITH 词尾 ----------
WITH_MAP = {
    'BACK YER': '后部耶尔符',
    'BREVE': '短音符',
    'DESCENDER': '下垂部',
    'DIAERESIS': '分音符',
    'DOUBLE ACUTE': '双锐音符',
    'DOUBLE GRAVE ACCENT': '双抑音符',
    'GRAVE': '抑音符',
    'HOOK': '钩',
    'LEFT HOOK': '左钩',
    'MACRON': '长音符',
    'MIDDLE HOOK': '中钩',
    'STROKE AND HOOK': '删线和钩',
    'STROKE': '删线',
    'TAIL': '尾',
    'TICK': '撇',
    'TITLO': '蒂特洛符',
    'UPTURN': '翻转',
    'VERTICAL STROKE': '竖线',
}

# ---------- item5：西里尔 符号/术语/前缀 ----------
TERM_MAP = [
    # 符号 后缀（长词优先）
    ('THOUSAND MILLIONS符号', '十亿位符号'),
    ('HUNDRED MILLIONS符号', '亿位符号'),
    ('TEN MILLIONS符号', '千万位符号'),
    ('HUNDRED THOUSANDS符号', '十万位符号'),
    ('MILLIONS符号', '百万位符号'),
    ('THOUSANDS符号', '千位符号'),
    ('HARD符号', '硬音符'),
    ('SOFT符号', '软音符'),
    # 西里尔独立术语
    ('DASIA PNEUMATA', '粗气符'),
    ('PSILI PNEUMATA', '细气符'),
    ('KAVYKA', '卡维卡符'),
    ('PAYEROK', '帕耶罗克符'),
    ('POKRYTIE', '波克雷蒂耶符'),
    ('PALOCHKA', '帕洛奇卡符'),
    ('VZMET', '弗兹梅特符'),
    ('DJERV', '杰尔夫'),
    ('ZEMLYA', '泽姆利亚'),
    ('SCHWA', '中央元音'),
    # TITLO 变体（先长后短）
    ('TITLO LEFT HALF', '左半蒂特洛符'),
    ('TITLO RIGHT HALF', '右半蒂特洛符'),
    ('TITLO', '蒂特洛符'),
    # 前缀/小类
    ('SUBSCRIPT小写字母', '下标小写字母'),
    ('大写 LIGATURE', '大写连字'),
    ('小写 LIGATURE', '小写连字'),
    ('LIGATURE', '连字'),
    ('小写大写', '小型大写'),
]


def fix_cyrillic(name):
    if '西里尔' not in name:
        return name
    for mod in sorted(WITH_MAP, key=len, reverse=True):
        name = name.replace(' WITH ' + mod, ' 带' + WITH_MAP[mod])
    for eng, zh in TERM_MAP:
        name = name.replace(eng, zh)
    return name


def main():
    data = load()
    pairs = data['names']
    changed = 0
    for p in pairs:
        if not (isinstance(p, list) and len(p) >= 2 and isinstance(p[1], str)):
            continue
        cp, name = p[0], p[1]
        new = name
        key = '0x%X' % cp
        if key in CP_FIX:
            new = CP_FIX[key]
        if '西里尔' in new:
            new = fix_cyrillic(new)
        if new != name:
            print(f'U+{cp:04X}  {name}  →  {new}')
            p[1] = new
            changed += 1
    json.dump(data, open(ZH_JSON, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    print(f'\n共改 {changed} 条，已写回 中文名.json')


if __name__ == '__main__':
    main()

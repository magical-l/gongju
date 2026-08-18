#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""build_zhnames.py — 生成 中文名.json（码位 → 中文名）

数据源（全部在 符号/ 下）：
- 名字.json              —— 英文名权威（读取字母类/韩文等做规则翻译）
- 参考资料/annotations-zh.json —— CLDR 官方 emoji 中文名
- zh-*.json              —— 子代理翻译产物（符号/标点/数字/组合词表），结构 [[cp, "中文名"], ...]

输出：中文名.json {_v, names:[[cp,zh]...]升序, patterns:[[lo,hi,prefix]...]}，
结构同 名字.json，页面用相同二分查询。幂等可重跑。

覆盖分层（优先级从高到低）：
1. 翻译词表 zh-*.json（子代理人工翻译）
2. 字母类规则翻译（SCRIPT_ZH 结构翻译）
3. CLDR emoji 中文名（只补空缺，不覆盖已有）
4. patterns 算法块：汉字 / 西夏文 / 谚文音节（页面按范围前缀生成）
"""

import json
import glob
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))

# ===== 174 种文字系统 → 中文名（Unicode Scripts.txt） =====
SCRIPT_ZH = {
    'ADLAM': '阿德拉姆', 'AHOM': '阿霍姆', 'ANATOLIAN_HIEROGLYPHS': '安纳托利亚象形文字',
    'ARABIC': '阿拉伯', 'ARMENIAN': '亚美尼亚', 'AVESTAN': '阿维斯陀', 'BALINESE': '巴厘',
    'BAMUM': '巴姆姆', 'BASSA_VAH': '巴萨瓦', 'BATAK': '巴塔克', 'BENGALI': '孟加拉',
    'BERIA_ERFE': '贝里亚', 'BHAIKSUKI': '拜克舒基', 'BOPOMOFO': '注音符号', 'BRAHMI': '婆罗米',
    'BRAILLE': '盲文', 'BUGINESE': '布吉', 'BUHID': '布希德', 'CANADIAN_ABORIGINAL': '加拿大原住民音节',
    'CARIAN': '卡里亚', 'CAUCASIAN_ALBANIAN': '高加索阿尔巴尼亚', 'CHAKMA': '查克马', 'CHAM': '占文',
    'CHEROKEE': '切罗基', 'CHORASMIAN': '花剌子模', 'COMMON': '通用', 'COPTIC': '科普特',
    'CUNEIFORM': '楔形文字', 'CYPRIOT': '塞浦路斯', 'CYPRO_MINOAN': '塞浦路斯米诺斯', 'CYRILLIC': '西里尔',
    'DESERET': '德瑟雷特', 'DEVANAGARI': '天城文', 'DIVES_AKURU': '迪维希', 'DOGRA': '多格拉',
    'DUPLOYAN': '迪普洛伊', 'EGYPTIAN_HIEROGLYPHS': '古埃及象形文字', 'ELBASAN': '埃尔巴桑',
    'ELYMAIC': '埃兰', 'ETHIOPIC': '埃塞俄比亚', 'GARAY': '加雷', 'GEORGIAN': '格鲁吉亚',
    'GLAGOLITIC': '格拉哥里', 'GOTHIC': '哥特', 'GRANTHA': '格兰塔', 'GREEK': '希腊',
    'GUJARATI': '古吉拉特', 'GUNJALA_GONDI': '贡贾拉贡德', 'GURMUKHI': '古木基', 'GURUNG_KHEMA': '古隆凯马',
    'HAN': '汉字', 'HANGUL': '谚文', 'HANIFI_ROHINGYA': '罗兴亚', 'HANUNOO': '哈努诺',
    'HATRAN': '哈特拉', 'HEBREW': '希伯来', 'HIRAGANA': '平假名', 'IMPERIAL_ARAMAIC': '帝国阿拉米',
    'INHERITED': '继承', 'INSCRIPTIONAL_PAHLAVI': '碑铭巴列维', 'INSCRIPTIONAL_PARTHIAN': '碑铭帕提亚',
    'JAVANESE': '爪哇', 'KAITHI': '凯提', 'KANNADA': '卡纳达', 'KATAKANA': '片假名',
    'KAWI': '卡维', 'KAYAH_LI': '克耶', 'KHAROSHTHI': '佉卢文', 'KHITAN_SMALL_SCRIPT': '契丹小字',
    'KHMER': '高棉', 'KHOJKI': '科杰基', 'KHUDAWADI': '库达瓦迪', 'KIRAT_RAI': '基拉特莱',
    'LAO': '老挝', 'LATIN': '拉丁', 'LEPCHA': '雷布查', 'LIMBU': '林布', 'LINEAR_A': '线形文字A',
    'LINEAR_B': '线形文字B', 'LISU': '傈僳', 'LYCIAN': '利西亚', 'LYDIAN': '吕底亚',
    'MAHAJANI': '摩诃贾尼', 'MAKASAR': '望加锡', 'MALAYALAM': '马拉雅拉姆', 'MANDAIC': '曼达',
    'MANICHAEAN': '摩尼教', 'MARCHEN': '玛钦', 'MASARAM_GONDI': '马萨拉姆贡德',
    'MEDEFAIDRIN': '梅德法伊德林', 'MEETEI_MAYEK': '曼尼普尔', 'MENDE_KIKAKUI': '门德',
    'MEROITIC_CURSIVE': '麦罗埃草书', 'MEROITIC_HIEROGLYPHS': '麦罗埃象形文字', 'MIAO': '苗文',
    'MODI': '莫迪', 'MONGOLIAN': '蒙古', 'MRO': '姆罗', 'MULTANI': '穆尔塔尼',
    'MYANMAR': '缅甸', 'NABATAEAN': '纳巴泰', 'NAG_MUNDARI': '纳格蒙达里', 'NANDINAGARI': '南迪纳加里',
    'NEW_TAI_LUE': '新傣仂', 'NEWA': '尼瓦尔', 'NKO': '恩科', 'NUSHU': '女书',
    'NYIAKENG_PUACHUE_HMONG': '尼亚肯普阿楚苗文', 'OGHAM': '欧甘', 'OL_CHIKI': '奥尔奇基',
    'OL_ONAL': '奥尔奥纳尔', 'OLD_HUNGARIAN': '古匈牙利', 'OLD_ITALIC': '古意大利',
    'OLD_NORTH_ARABIAN': '古北阿拉伯', 'OLD_PERMIC': '古彼尔姆', 'OLD_PERSIAN': '古波斯',
    'OLD_SOGDIAN': '古粟特', 'OLD_SOUTH_ARABIAN': '古南阿拉伯', 'OLD_TURKIC': '古突厥',
    'OLD_UYGHUR': '古回鹘', 'ORIYA': '奥里亚', 'OSAGE': '奥塞奇', 'OSMANYA': '奥斯曼亚',
    'PAHAWH_HMONG': '帕豪苗文', 'PALMYRENE': '帕尔米拉', 'PAU_CIN_HAU': '保钦豪',
    'PHAGS_PA': '八思巴', 'PHOENICIAN': '腓尼基', 'PSALTER_PAHLAVI': '诗篇巴列维',
    'REJANG': '勒姜', 'RUNIC': '卢恩', 'SAMARITAN': '撒玛利亚', 'SAURASHTRA': '索拉什特拉',
    'SHARADA': '沙拉达', 'SHAVIAN': '萧伯纳', 'SIDDHAM': '悉昙', 'SIDETIC': '西代',
    'SIGNWRITING': '手语书写', 'SINHALA': '僧伽罗', 'SOGDIAN': '粟特', 'SORA_SOMPENG': '索拉颂彭',
    'SOYOMBO': '索永布', 'SUNDANESE': '巽他', 'SUNUWAR': '苏努瓦尔', 'SYLOTI_NAGRI': '锡尔赫特',
    'SYRIAC': '叙利亚', 'TAGALOG': '他加禄', 'TAGBANWA': '塔格巴努亚', 'TAI_LE': '傣那',
    'TAI_THAM': '傣文', 'TAI_VIET': '傣越', 'TAI_YO': '泰哟', 'TAKRI': '塔克里',
    'TAMIL': '泰米尔', 'TANGSA': '唐萨', 'TANGUT': '西夏文', 'TELUGU': '泰卢固',
    'THAANA': '它拿', 'THAI': '泰文', 'TIBETAN': '藏文', 'TIFINAGH': '提非纳',
    'TIRHUTA': '底罗婆多', 'TODHRI': '托德赫里', 'TOLONG_SIKI': '托隆西基', 'TOTO': '托托',
    'TULU_TIGALARI': '图卢蒂加拉里', 'UGARITIC': '乌加里特', 'VAI': '瓦伊', 'VITHKUQI': '维什库奇',
    'WANCHO': '万乔', 'WARANG_CITI': '瓦朗奇提', 'YEZIDI': '雅兹迪', 'YI': '彝文',
    'ZANABAZAR_SQUARE': '札那巴札尔方形文字',
}

# 名字中的实际形态：脚本名（下划线）→ 名字（空格大写），如 Old_Italic → 'OLD ITALIC'
SCRIPT_ZH = {k.replace('_', ' '): v for k, v in SCRIPT_ZH.items()}
# 名字实际形态与脚本名不一致的别名
SCRIPT_ZH.update({
    'EGYPTIAN HIEROGLYPH': '古埃及象形文字',
    'CANADIAN SYLLABICS': '加拿大原住民音节',
    'ANATOLIAN HIEROGLYPH': '安纳托利亚象形文字',
    'MEROITIC HIEROGLYPHIC': '麦罗埃象形文字',
    'HENTAIGANA': '变体假名',
    'CYPRO-MINOAN': '塞浦路斯米诺斯',
})

# ===== 结构词 → 中文 =====
STRUCT_MAP = {
    'CAPITAL': '大写', 'SMALL': '小写', 'LETTER': '字母',
    'CHOSEONG': '初声', 'JUNGSEONG': '中声', 'JONGSEONG': '终声',
    'SYMBOL': '符号', 'SIGN': '符号', 'DIGIT': '数字',
}

# ===== 修饰前缀 → 中文（字母类前的数学/全角等） =====
PREFIX_RULES = [
    ('MATHEMATICAL BOLD SANS-SERIF', '数学粗体无衬线'),
    ('MATHEMATICAL SANS-SERIF BOLD ITALIC', '数学无衬线粗斜体'),
    ('MATHEMATICAL SANS-SERIF ITALIC', '数学无衬线斜体'),
    ('MATHEMATICAL SANS-SERIF BOLD', '数学无衬线粗体'),
    ('MATHEMATICAL BOLD ITALIC', '数学粗斜体'),
    ('MATHEMATICAL DOUBLE-STRUCK', '数学空心体'),
    ('MATHEMATICAL BOLD FRAKTUR', '数学粗哥特体'),
    ('MATHEMATICAL SANS-SERIF', '数学无衬线'),
    ('MATHEMATICAL MONOSPACE', '数学等宽'),
    ('MATHEMATICAL ITALIC', '数学斜体'),
    ('MATHEMATICAL BOLD SCRIPT', '数学粗手写体'),
    ('MATHEMATICAL BOLD', '数学粗体'),
    ('MATHEMATICAL FRAKTUR', '数学哥特体'),
    ('MATHEMATICAL SCRIPT', '数学手写体'),
    ('MATHEMATICAL', '数学'),
    ('FULLWIDTH', '全角'),
    ('HALFWIDTH', '半角'),
    ('HENTAIGANA LETTER', '变体假名'),
    ('VEDIC SIGN', '吠陀符号'),
    ('VERTICAL KANA', '纵排假名'),
    ('DOUBLE-STRUCK', '空心体'),
    ('BLACK-LETTER', '哥特体'),
    ('SCRIPT CAPITAL', '手写体'),
    ('LINEAR B SYLLABLE', '线形文字B音节'),
    ('LINEAR B IDEOGRAM', '线形文字B表意'),
    ('LINEAR A', '线形文字A'),
    ('MODIFIER LETTER', '修饰字母'),
]

# ===== 跳过规则翻译、交由 patterns/词表处理的名字 =====
SKIP_PREFIXES = ('HANGUL SYLLABLE ',)

# ===== 算法块：码位范围 → 中文前缀 =====
ALGORITHMIC = [
    # 汉字各段（与名字.json patterns 同源）
    (0x4E00, 0x9FFF, '汉字'),
    (0x3400, 0x4DBF, '汉字（扩展A）'),
    (0x20000, 0x2A6DF, '汉字（扩展B）'),
    (0x2A700, 0x2B73F, '汉字（扩展C）'),
    (0x2B740, 0x2B81D, '汉字（扩展D）'),
    (0x2B820, 0x2CEAD, '汉字（扩展E）'),
    (0x2CEB0, 0x2EBE0, '汉字（扩展F）'),
    (0x30000, 0x3134A, '汉字（扩展G）'),
    (0x31350, 0x323AF, '汉字（扩展H）'),
    (0x2EBF0, 0x2EE5D, '汉字（扩展I）'),
    (0x323B0, 0x33479, '汉字（扩展J）'),
    # 西夏文
    (0x17000, 0x187FF, '西夏文'),
    (0x18D00, 0x18D1E, '西夏文（补充）'),
    # 谚文音节
    (0xAC00, 0xD7A3, '谚文音节'),
    # 古埃及象形文字（编号对用户无意义，字符本身即标识）
    (0x13000, 0x1342F, '古埃及象形文字'),
    (0x13441, 0x13446, '古埃及象形文字'),
    (0x13460, 0x143FA, '古埃及象形文字'),
    # 安纳托利亚象形文字
    (0x14400, 0x14646, '安纳托利亚象形文字'),
    # 契丹小字
    (0x18B00, 0x18CD5, '契丹小字'),
    (0x18CFF, 0x18CFF, '契丹小字'),
    # 汉字（兼容表意）
    (0xF900, 0xFA6D, '汉字（兼容表意）'),
    (0xFA70, 0xFAD9, '汉字（兼容表意）'),
    (0x2F800, 0x2FA1D, '汉字（兼容表意）'),
]


def _rest_zh(rest_words):
    """结构词转中文紧贴拼接，英文词（字母名等）保留并以空格分隔。"""
    out = ''
    for r in rest_words:
        z = STRUCT_MAP.get(r)
        if z:
            out += z
        else:
            out += (' ' if out else '') + r
    return out


def letter_zh(en):
    """字母类英文名 → 中文名（SCRIPT 结构翻译）。无 script 且无修饰前缀时返回 None。"""
    zh = ''
    rest = en
    matched_prefix = False
    for prefix, pzh in PREFIX_RULES:
        if rest.startswith(prefix):
            zh = pzh
            rest = rest[len(prefix):].strip()
            matched_prefix = True
            break
    words = rest.split()
    # 贪心多词匹配 script（优先长形态，如 'OLD ITALIC' 而非 'OLD'）
    for i in range(len(words)):
        for k in (3, 2, 1):
            phrase = ' '.join(words[i:i + k])
            if phrase in SCRIPT_ZH:
                zh += SCRIPT_ZH[phrase]
                rest_words = words[i + k:]
                if phrase in ('HIRAGANA', 'KATAKANA', 'HENTAIGANA', 'CANADIAN SYLLABICS'):
                    rest_words = [r for r in rest_words if r != 'LETTER']
                return _join(zh, _rest_zh(rest_words))
    # 无 script 词：只有修饰前缀（MATHEMATICAL/FULLWIDTH 等）时才有意义
    if not matched_prefix:
        return None
    return _join(zh, _rest_zh(words))


def _join(zh, tail):
    """中文词缀与尾部拼接：尾部以中文开头紧贴，以英文字母名开头则空一格。"""
    if not tail:
        return zh
    if not zh:
        return tail
    return zh + (' ' if tail[0].isascii() else '') + tail


def main():
    names_en = json.load(open(os.path.join(HERE, '名字.json'), encoding='utf-8'))['names']

    zh_map = {}  # cp → 中文名

    # 1. 字母类规则翻译（含韩文字母，跳过谚文音节交给 patterns）
    for cp, en in names_en:
        if en.startswith(SKIP_PREFIXES):
            continue
        zh = letter_zh(en)
        if zh:
            zh_map[cp] = zh

    # 2. 翻译词表合并（子代理产物，覆盖规则）
    for f in sorted(glob.glob(os.path.join(HERE, 'zh-*.json'))):
        tbl = json.load(open(f, encoding='utf-8'))
        for cp, zh in tbl:
            cp_int = int(cp, 16) if isinstance(cp, str) and cp.lower().startswith('0x') else int(cp)
            zh_map[cp_int] = zh
        print(f'  词表 {os.path.basename(f)}: {len(tbl)} 条')

    # 3. CLDR emoji 中文名（只补空缺）
    cldr_path = os.path.join(HERE, '参考资料', 'annotations-zh.json')
    cldr_n = 0
    if os.path.exists(cldr_path):
        d = json.load(open(cldr_path, encoding='utf-8'))
        ann = d['annotations']['annotations']
        for char, info in ann.items():
            cps = [ord(c) for c in char if ord(c) != 0xFE0F]  # 去变体选择符
            if len(cps) != 1:
                continue
            cp = cps[0]
            if cp in zh_map:
                continue
            tts = info.get('tts')
            if not tts:
                continue
            zh_map[cp] = tts[0]
            cldr_n += 1
        print(f'  CLDR emoji: {cldr_n} 条')

    # 4. 输出 names + patterns
    names_out = sorted(([cp, zh] for cp, zh in zh_map.items()), key=lambda x: x[0])
    patterns_out = [[lo, hi, prefix] for lo, hi, prefix in ALGORITHMIC]

    out = {
        '_v': '17.0.0',
        'names': names_out,
        'patterns': patterns_out,
    }
    out_path = os.path.join(HERE, '中文名.json')
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    print(f'已生成 中文名.json: {len(names_out)} 条显式 + {len(patterns_out)} 个范围模式')


if __name__ == '__main__':
    main()

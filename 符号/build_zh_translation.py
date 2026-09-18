#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""build_zh_translation.py — 给 官方名直译名.js（成员 → 中文名）**补空缺**

⚠️ 语义是 **merge，不是重算**：已有的键一律不动，只写没有的。
   官方名直译名.js 是权威，本脚本只负责"新码位自动补译"（Unicode 升级时用）。
   历史上它是全量生成器，跑一次会抹掉后来所有人工改动（实测差过 8963 条），
   故改为 merge。真要全量重算，得先把现有文件挪走。

数据源（全部在 符号/ 下）：
- unicode官方名.js                —— 英文名权威（读取字母类/韩文等做规则翻译）
- 参考资料/annotations-zh.json —— CLDR 官方 emoji 中文名
- zh-*.json              —— 翻译词表，结构 [[cp, "中文名"], ...]（仅对"没有的键"生效）

输出：官方名直译名.js {_v, names:{键:中文名}, patterns:[[lo,hi,prefix]...]}
  - 键为十进制码点字符串；含 '-' 的是序列键（由 build_zwj.py / 人工维护，本脚本不生成也不动）
  - 与 unicode官方名.js 同构

补缺来源（优先级从高到低）：
1. 翻译词表 zh-*.json
2. 字母类规则翻译（SCRIPT_ZH 结构翻译）
3. CLDR emoji 中文名
4. patterns 算法块：汉字 / 西夏文 / 谚文音节（页面按范围前缀生成；本脚本整体重写该段）
"""

import json
import glob
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from datatool import ZH, dump_data, read_data, write_text

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
    # ===== 字母的修饰符（`LATIN CAPITAL LETTER A **WITH GRAVE**`）=====
    # 缺这批时 `_rest_zh` 会把整段尾巴原样留成英文，产出「拉丁大写字母A WITH GRAVE」。
    # 2026-09-17 补。验收标准：letter_zh 的输出与 官方名直译名.js 里已有的 703 条**逐字相同**，
    # 这样全量重算不会把数据改回去。
    'WITH': '带', 'AND': '与',
    'GRAVE': '钝音符', 'ACUTE': '锐音符', 'CIRCUMFLEX': '抑扬符', 'TILDE': '波浪号',
    'DIAERESIS': '分音符', 'MACRON': '长音符号', 'BREVE': '短音符', 'CARON': '倒折符',
    'CEDILLA': '下加符', 'OGONEK': '尾钩',
    # STROKE 是中性词「划线」——它本身不含横/斜，别替它加方向（2026-09-18 用户裁定）
    'STROKE': '划线', 'HOOK': '钩',
    'DOT': '点', 'RING': '圆圈', 'COMMA': '逗号', 'BAR': '横杠', 'LINE': '线',
    # ⚠️ OGONEK 译「鼻化符」不是「尾钩」——这是数据里的既定说法（Ą 在波兰语里确实鼻化）
    'OGONEK': '鼻化符', 'PALATAL': '硬腭', 'RETROFLEX': '卷舌', 'HORN': '角', 'MIDDLE': '中',
    'SHARP': '锐', 'TURNED': '翻转', 'REVERSED': '反向', 'INVERTED': '倒置',
    'TOPBAR': '顶横杠', 'DOTLESS': '无点', 'OPEN': '开口', 'TAIL': '尾',
    # 长尾（2026-09-17 按「引擎输出 == 数据」逐轮抽出，见 §验收）
    'DIAGONAL': '对角', 'INSULAR': '海岛体', 'OBLIQUE': '斜', 'CURL': '卷曲',
    'DESCENDER': '下伸部', 'LEG': '腿', 'VOLAPUK': '沃拉普克', 'GLOTTAL': '声门', 'SQUAT': '矮',
    'FLOURISH': '花饰', 'SCRIPT': '手写体', 'BELT': '束带', 'FISHHOOK': '鱼钩',
    'LOOP': '环', 'EGYPTOLOGICAL': '埃及学', 'BARRED': '带横杠', 'SIDEWAYS': '侧向',
    'HIGH': '高', 'LOW': '低', 'BLACKLETTER': '黑体', 'RAMS': '羊', 'BROKEN': '断',
    'VEND': '文德', 'ANGLICANA': '安格利卡纳', 'SCOTS': '古苏格兰', 'SIGMOID': '乙状',
    'AFRICAN': '非洲', 'DIGRAPH': '二合字母', 'SWASH': '卷尾', 'CLOSED': '闭',
    'PHARYNGEAL': '咽音', 'VOICED': '浊', 'FRICATIVE': '擦音', 'STOP': '塞音',
    # 下述三对是同词异写，取**多数派**为准，少数派已在数据里统一（2026-09-17）
    'MID-HEIGHT': '中高', 'MIDDLE-WELSH': '中古威尔士', 'SERIF': '衬线',
    'DIAERESIZED': '带分音符', 'STRIKETHROUGH': '删除线', 'TAILLESS': '无尾', 'OVERLAY': '叠加', 'INSIDE': '内部', 'SQUIRREL': '松鼠',
    'HANDLE': '柄', 'TRILL': '颤音', 'WITHOUT': '无', 'OPEN-O': '开口-O',
    'NOTCH': '缺口', 'HORIZONTAL': '横', 'LENIS': '弱', 'LAZY': '懒',
    'STIRRUP': '马镫', 'BASELINE': '基线', 'SAKHA': '萨哈', 'IOTIFIED': '带iota',
    # 希腊字母名 → 字形。官方名写 `LAMBDA`，中文名写字形 `λ`（「写本源字形」那条规则）
    # ⚠️ 一律用**官方名里的写法**（大写）——数据里 `ᵹ` 是「拉丁小写字母海岛体G」，
    #    G 大写；`Ɣ` 是「拉丁大写字母Γ」，Γ 大写。字符自身是小写不影响。
    'ALPHA': 'Α', 'BETA': 'Β', 'GAMMA': 'Γ', 'DELTA': 'Δ', 'EPSILON': 'Ε',
    'ZETA': 'Ζ', 'ETA': 'Η', 'THETA': 'Θ', 'IOTA': 'Ι', 'KAPPA': 'Κ',
    'LAMBDA': 'Λ', 'MU': 'Μ', 'NU': 'Ν', 'XI': 'Ξ', 'OMICRON': 'Ο',
    'PI': 'Π', 'RHO': 'Ρ', 'SIGMA': 'Σ', 'TAU': 'Τ', 'UPSILON': 'Υ',
    'PHI': 'Φ', 'CHI': 'Χ', 'PSI': 'Ψ', 'OMEGA': 'Ω',
    'LONG': '长', 'SHORT': '短', 'DOUBLE': '双',
    'LEFT': '左', 'RIGHT': '右', 'TOP': '顶部', 'BOTTOM': '底部', 'HALF': '半',
}

# 需要**倒序**的修饰短语：英文后置、中文前置（`RING ABOVE` → 上方圆圈）。
# `_rest_zh` 按最长匹配先整块吃掉，再做逐词拼接。
STRUCT_PHRASE = {
    'HOOK ABOVE': '上方钩', 'HORN ABOVE': '上方角',
    'THROUGH DESCENDER': '穿下延',
    # 整块短语：逐词拼会重复（`SWASH TAIL` 拼成「卷尾钩尾」、`HOOK TAIL` 拼成「钩钩尾」）
    'PRECEDED BY APOSTROPHE': '带前置撇号', 'INVERTED BREVE': '倒短音符',
    'SWASH TAIL': '卷尾', 'HOOK TAIL': '钩尾', 'WITH TAIL': '带尾',
    'R ROTUNDA': 'R圆体',
    'TONE SIX': '第六声', 'TONE TWO': '第二声', 'TONE FIVE': '第五声',
    'GLOTTAL STOP': '声门塞音', 'OLD POLISH': '旧波兰', 'CLOSED INSULAR': '闭口海岛体',
    'PHARYNGEAL VOICED FRICATIVE': '咽音浊擦音', 'CROSSED-TAIL': '交叉尾',
    'OPEN E': '开口E', 'LONG STROKE OVERLAY': '叠加长划线',
    'REVERSED-SCHWA': '反转-SCHWA',
    'WITHOUT HANDLE': '无柄', 'LOW RING INSIDE': '内低圆圈',
    'RUM ROTUNDA': 'RUM圆体',  'IOTIFIED E': '带iotaE', 'INVERTED ALPHA': '倒α',
    'SHORT STROKE OVERLAY': '叠加短划线', 'HORIZONTAL STROKE': '横划线',
    'SHARP S': '德语锐S', 'LONG S': '长S', 'DOTLESS J': '无点J', 'OPEN O': '开口O',
    'RING ABOVE': '上方圆圈', 'DOT ABOVE': '上方点', 'MACRON ABOVE': '上方长音符号',
    'LINE ABOVE': '上方线', 'COMMA ABOVE': '上方逗号', 'TILDE ABOVE': '上方波浪号',
    'CIRCUMFLEX ABOVE': '上方抑扬符',
    'CIRCUMFLEX BELOW': '下方抑扬符', 'TILDE BELOW': '下方波浪号',
    'DIAERESIS BELOW': '下方分音符', 'HORN BELOW': '下方角',
    'DOT BELOW': '下方点', 'LINE BELOW': '下方线', 'COMMA BELOW': '下方逗号',
    'RING BELOW': '下方圆圈', 'MACRON BELOW': '下方长音符号', 'BREVE BELOW': '下方短音符',
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
    # 汉字各段（与unicode官方名.js patterns 同源）
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
    """结构词转中文紧贴拼接，英文词（字母名等）保留。

    英文词**之间**空一格（`EN GHE`、`ZAQEF QATAN` 这种多词转写名要分开读），
    但**中文之后紧贴**——中英文之间不空格（2026-09-17 用户裁定）。

    查表时先按 `STRUCT_PHRASE` 做**最长匹配**——那批修饰语英文后置、中文前置
    （`RING ABOVE` 是「上方圆圈」不是「圆圈上方」），逐词拼会反。
    """
    out, i = '', 0
    while i < len(rest_words):
        for n in (3, 2, 1):
            key = ' '.join(rest_words[i:i + n])
            z = STRUCT_PHRASE.get(key) if n > 1 else STRUCT_MAP.get(key)
            if z:
                out += z
                i += n
                break
        else:
            r = rest_words[i]
            out += (' ' + r) if (out and out[-1].isascii()) else r
            i += 1
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
    """中文词缀与尾部拼接：一律紧贴。

    ⚠️ 曾写成「尾部以英文字母名开头则空一格」，产出 `拉丁大写字母 A`、
    `楔形文字符号 GA2` 这类中英夹空格的直译名。2026-09-17 用户裁定**中英文之间不空格**，
    那个分支已删；同一批 1244 条历史数据也已清。
    """
    if not tail:
        return zh
    if not zh:
        return tail
    return zh + tail


def main():
    names_en = read_data(os.path.join(HERE, 'unicode官方名.js'), 'UNICODE_NAMES_DATA')['names']

    zh_map = {}  # cp(int) → 中文名

    # 1. 字母类规则翻译（含韩文字母，跳过谚文音节交给 patterns）
    #    names 是 {键: 名} 映射；含 '-' 的序列键不归本脚本（由 build_zwj.py 写），跳过
    for k, en in names_en.items():
        if '-' in k:
            continue
        cp = int(k)
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

    # 4. 输出：以现有文件为权威，**只补没有的键**（merge，不重算）
    #    已有的键一律不动 —— 含人工改过的名字、以及序列键（'-'，由 build_zwj.py 维护）
    out_path = ZH
    existing = {}
    if os.path.exists(out_path):
        try:
            d = read_data(out_path, 'ZH_TRANSLATION_DATA')
            if isinstance(d.get('names'), dict):
                existing = d['names']
        except Exception:
            pass

    names_out = dict(existing)
    added = 0
    for cp, zh in zh_map.items():
        k = str(cp)
        if k in names_out:
            continue
        names_out[k] = zh
        added += 1
    # 排序：码点键按数值升序在前，序列键在后
    names_out = dict(sorted(names_out.items(), key=lambda kv: (
        '-' in kv[0], int(kv[0]) if '-' not in kv[0] else 0, kv[0])))

    patterns_out = [[lo, hi, prefix] for lo, hi, prefix in ALGORITHMIC]

    out = {
        '_v': '17.0.0',
        'names': names_out,
        'patterns': patterns_out,
    }
    write_text(out_path, dump_data(out, 'ZH_TRANSLATION_DATA'))
    print(f'官方名直译名.js: 已有 {len(existing)} 条保持不变，新补 {added} 条 '
          f'→ 共 {len(names_out)} 条 + {len(patterns_out)} 个范围模式')


if __name__ == '__main__':
    main()

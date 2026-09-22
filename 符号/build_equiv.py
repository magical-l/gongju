#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""生成「等价形式别名」，写进 符号富化数据.js（条目级 alias）。

用法::

    python build_equiv.py
    python build_equiv.py --dry-run     # 只打印统计，不落盘

等价形式别名 = 「这个字符还能写成什么样」，只当**搜索键**用，不参与显示。
它不是名字、也不是官方名的直译，所以不进直译名（直译名的值会当作显示名）。

两个来源：

1. **NFKC 展开式**（`参考资料/UnicodeData.txt` 的 Decomposition_Mapping 字段）
   ① → `1`、Ⅻ → `XII`、㎏ → `kg`、㎡ → `m2`、µ → `μ`、ﬁ → `fi`、
   ½ → `1/2`（U+2044 分数斜杠归一成普通 `/`）、㍿ → `株式会社`。

2. **同形字**（`参考资料/confusables.txt`，UTS #39）
   西里尔 а → `a`、希腊 ο → `o` 这类跨文字系统的形近字。
   按**源字符的文字系统**收窄到 拉丁/希腊/西里尔/通用 四类，挡掉希伯来/阿拉伯
   变音符那类对中文用户无意义的噪音；再挡掉**目标是装饰性图形块**的（见
   `DECORATIVE_BLOCKS`——🍓 的 confusable 是 U+1CEBF「另一套图」，当别名是垃圾）；
   再挡掉**拿别的字母/数字顶替**的（`letter_identity_spoof`，判据：跟它相似的那个**是不是
   同一个字母**——含字母变体、含字母被当符号用；不是就删。2026-09-21 用户裁定）。
   `Ｉ→l`、`⒨→(rn)`、`⑽→(lO)`、`△→Δ` 删；`①→➀`、`ɡ→g`、`∑→Ʃ` 留。

设计说明：

- **NFKC 只碰数据，不碰用户输入**。给字符发别名，绝不把查询词 NFKC 化——
  那会让「打 ① 直接跳到它」变成「在三千多条里翻」，而那是本工具的核心交互。
  实测：51704 个单码位字符里有 4985 个（9.6%）会被 NFKC 改写成别的字符本身。
- 别名走条目级 `alias` 字段，搜索通道（`meta.aliases`）本来就认它，**搜索代码零改动**。
  有标签的字符用条目级 alias（不是组级）：NFKC 等价与语境无关，不该按标签拆。
- 副作用（已知并接受）：新建条目的字符，改名落盘从 `官方名直译名.js` 改到
  `符号富化数据.js`——页面改名本来就该落到符号数据里。
- **幂等**：重复跑不会重复追加（写入前与本条已有的别名/名字比对）。

License: confusables.txt 与 UnicodeData.txt 均为 Unicode, Inc. 数据文件
（https://www.unicode.org/terms_of_use.html）。
"""
import os
import re
import sys
import unicodedata
from collections import Counter

BASE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE)
from datatool import append_symbols, load_symbols, load_zh, read_data, update_symbols

REF = os.path.join(BASE, '参考资料')
UNICODE_DATA = os.path.join(REF, 'UnicodeData.txt')
SCRIPTS = os.path.join(REF, 'Scripts.txt')
CONFUSABLES = os.path.join(REF, 'confusables.txt')

# 同形字**源**字符的文字系统白名单
CONFUSABLE_SCRIPTS = {'LATIN', 'GREEK', 'CYRILLIC', 'COMMON'}

# 同形字**目标**字符的文字系统白名单：在源的基础上放开 汉字
# （࿕→卐、⎜→丨 这类目标用户能打出来），但不收阿拉伯/希伯来/卡里亚等
# —— ö→ة、▽→𐊼 那种跨半个世界的形近字对中文用户没有意义。
CONFUSABLE_TARGET_SCRIPTS = CONFUSABLE_SCRIPTS | {'HAN'}

# 条目字段顺序（手工追加条目时也按这个顺序）
FIELD_ORDER = ('char', 'name', 'alias', 'groups', 'intro', 'mode')

# 展开结果里出现这些类别就不要：组合符、空白、控制符、格式符
# （¨ → 空格 + 组合分音符 这类对搜索无用；U+2028 之类还会破坏 JS 源码行）
BAD_CATEGORIES = ('Mn', 'Mc', 'Me', 'Zs', 'Zl', 'Zp', 'Cc', 'Cf')

# 装饰性图形块：整块是**另一套图**而不是同一个字的另一种写法，当搜索别名毫无价值
# —— 普通输入法打不出来，还会在详情区的「别名」行里当垃圾显示。
#   U+1CC00-1CEBF  Symbols for Legacy Computing Supplement（Unicode 16/17 新增的复古终端美术字形）
#   U+1FB00-1FBFF  Symbols for Legacy Computing
#   U+1F000-1FAFF  emoji 图形区
# 典型受害对：🍓 U+1F353 的 confusable 是 U+1CEBF（都是"图"）。
DECORATIVE_BLOCKS = ((0x1CC00, 0x1CEBF), (0x1FB00, 0x1FBFF), (0x1F000, 0x1FAFF))

# 多字符同形字里**确实该符号本身写法**的——只有这几条，逐条判过（2026-09-21 用户裁定）。
# 判据是「这串字母是不是这个符号的写法/通行缩写」，**不是**「别名有几个字符」。
# 炼金术符号尤其明显：它们的传统写法就是字母缩写或字母堆叠。
MULTI_KEEP = {
    ('🝜', 'sss'),   # 层叠符（stratum super stratum），就画成三个 s
    ('🜀', 'QE'),    # 第五元素 quintessence 的通行缩写
    ('🜇', 'AR'),    # 王水 aqua regia
    ('🝫', 'MB'),    # 玛丽水浴 Maria bath
    ('🝬', 'VB'),    # 蒸气浴 vapor bath
    ('₶', 'lt'),     # livre tournois 的标准缩写
}

# 「跟它相似的那个是不是同一个字母」——判据的两个零件（2026-09-21 用户裁定）
_WORDNUM = {'ZERO': '0', 'ONE': '1', 'TWO': '2', 'THREE': '3', 'FOUR': '4', 'FIVE': '5', 'SIX': '6',
            'SEVEN': '7', 'EIGHT': '8', 'NINE': '9', 'TEN': '10', 'ELEVEN': '11', 'TWELVE': '12',
            'THIRTEEN': '13', 'FOURTEEN': '14', 'FIFTEEN': '15', 'SIXTEEN': '16', 'SEVENTEEN': '17',
            'EIGHTEEN': '18', 'NINETEEN': '19', 'TWENTY': '20', 'THIRTY': '30'}
_MOD_RE = re.compile(r'^(?:(?:FULLWIDTH|HALFWIDTH|PARENTHESIZED|CIRCLED|SQUARED|DINGBAT|NEGATIVE|WHITE|BLACK|SMALL|LARGE)\s+)+')
_LETTER_RE = re.compile(r'(?:LATIN|GREEK|CYRILLIC)\s+(?:CAPITAL|SMALL)\s+LETTER\s+(?:[A-Z]+\s+)*([A-Z])$')
_WORDNUM_RE = re.compile(r'(?:DIGIT|NUMBER)\s+([A-Z]+)$')
_ROMAN_RE = re.compile(r'ROMAN NUMERAL\s+([IVXLC]+)$')
MATH_IDENTITY = re.compile(r'N-ARY|SUMMATION|PRODUCT|INTEGRAL|FOR ALL|THERE EXISTS|OPERATOR|MATHEMATICAL|UNION|INTERSECTION|LOGICAL')


def strip_modifiers(name):
    """剥掉 FULLWIDTH / PARENTHESIZED / CIRCLED… 这类包装词，露出真正的名词部分。"""
    while True:
        m = _MOD_RE.match(name)
        if not m:
            return name
        name = name[m.end():]


def letter_identity(name):
    """Unicode 名 → 它代表的字母/数字（小写）。不是字母数字类返回 None。

    `LATIN SMALL LETTER SCRIPT G` → `g`（花体也算同一个字母）、`CIRCLED DIGIT ONE` → `1`、
    `LATIN SMALL LETTER THORN` → None（thorn 不是任何一个拉丁字母）。
    """
    for src in (strip_modifiers(name), name):
        m = _LETTER_RE.search(src)
        if m:
            return m.group(1).lower()
        m = _WORDNUM_RE.search(src)
        if m and m.group(1) in _WORDNUM:
            return _WORDNUM[m.group(1)]
        m = _ROMAN_RE.search(src)
        if m:
            return m.group(1).lower()
    return None


def ascii_alnum_content(s):
    """多字符别名里的 ASCII 字母数字内容（`(lO)` → `lo`）；没有则 None。"""
    c = ''.join(ch for ch in s if ch.isascii() and ch.isalnum())
    return c.lower() or None

FRACTION_SLASH = '⁄'          # U+2044 FRACTION SLASH，归一成 '/'
FRACTION_SLASH_PLAIN = '/'


# ==================== 数据源 ====================

def load_unicodedata(path=UNICODE_DATA):
    """→ (分解表, 类别表)，一次扫 UnicodeData.txt。

    分解表 {码位: (是否兼容分解, [码位...])}，取自第 6 字段。
    类别表 {码位: 通用类别}，取自第 3 字段；`<Xxx, First>` / `<Xxx, Last>` 成对出现，
    展开成整段（CJK、谚文、私用区等）。**用项目自带的 17.0.0，不用 Python 的
    unicodedata（本机是 UCD 14）**——否则 Unicode 15+ 新增的组合符会被漏判成"可用"。
    """
    decomp = {}
    category = {}
    names = {}
    pending = None
    with open(path, encoding='utf-8') as f:
        for line in f:
            fields = line.split(';')
            if len(fields) < 3:
                continue
            cp = int(fields[0], 16)
            name, cat = fields[1], fields[2]
            if name.endswith(', First>'):
                pending = (cp, cat)
                continue
            if name.endswith(', Last>'):
                if pending:
                    for c in range(pending[0], cp + 1):
                        category[c] = pending[1]
                    pending = None
                continue
            category[cp] = cat
            names[cp] = name
            if len(fields) < 6:
                continue
            dm = fields[5].strip()
            if not dm:
                continue
            parts = dm.split()
            compat = parts[0].startswith('<')
            decomp[cp] = (compat, [int(x, 16) for x in (parts[1:] if compat else parts)])
    return decomp, category, names


def load_scripts(path=SCRIPTS):
    """→ [(起, 止, 文字系统名大写)]，来自 Scripts.txt。"""
    out = []
    with open(path, encoding='utf-8') as f:
        for line in f:
            line = line.split('#')[0].strip()
            if not line:
                continue
            rng, sc = [x.strip() for x in line.split(';')]
            lo, _, hi = rng.partition('..')
            out.append((int(lo, 16), int(hi, 16) if hi else int(lo, 16), sc.upper()))
    return out


def load_confusables(path=CONFUSABLES):
    """→ {源码位: 目标字符串}，来自 confusables.txt。"""
    out = {}
    with open(path, encoding='utf-8') as f:
        for line in f:
            line = line.split('#')[0].strip()
            if not line:
                continue
            fields = [x.strip() for x in line.split(';')]
            if len(fields) < 2:
                continue
            out[int(fields[0], 16)] = ''.join(chr(int(x, 16)) for x in fields[1].split())
    return out


# ==================== 计算 ====================

class Equiv:
    """把两个来源算成 {字符: [等价形式...]}。"""

    def __init__(self):
        self.decomp, self.category, self.names = load_unicodedata()
        self.scripts = load_scripts()
        self._cache = {}
        self.stats = Counter()

    # --- 工具 ---

    def script_of(self, cp):
        for lo, hi, sc in self.scripts:
            if lo <= cp <= hi:
                return sc
        return 'ZZZZ'

    def usable(self, s):
        """展开结果能不能当搜索键：不能含组合符/空白/控制符。

        类别查项目自带的 UnicodeData.txt（17.0.0）——查不到的按未分配处理（丢掉）。
        """
        for ch in s:
            cp = ord(ch)
            if cp < 0x20 or cp == 0x7F:
                return False
            if self.category.get(cp, 'Cn') in BAD_CATEGORIES:
                return False
        return True

    @staticmethod
    def decorative_target(cp):
        """目标是不是「另一套图」的装饰性图形（见 DECORATIVE_BLOCKS）。"""
        return any(lo <= cp <= hi for lo, hi in DECORATIVE_BLOCKS)

    @staticmethod
    def half_width(ch):
        """全角 → 半角（宽度折叠通道已覆盖的形式不必再收作别名）。"""
        cp = ord(ch)
        if 0xFF01 <= cp <= 0xFF5E:
            return chr(cp - 0xFEE0)
        return ' ' if cp == 0x3000 else ch

    def full_decompose(self, cp):
        """递归全分解（规范 + 兼容）。"""
        if cp in self._cache:
            return self._cache[cp]
        self._cache[cp] = ''                      # 占位防环
        if cp not in self.decomp:
            result = chr(cp)
        else:
            result = ''.join(self.full_decompose(c) for c in self.decomp[cp][1])
        self._cache[cp] = result
        return result

    def nfkc(self, cp):
        """NFKC 展开式：全分解后按规范重新组合（组合回去的等于自己，自然被滤掉）。"""
        return unicodedata.normalize('NFC', self.full_decompose(cp))

    # --- 两个来源 ---

    def nfkc_forms(self, cps):
        """NFKC 展开式 → {码位: [形式]}。"""
        out = {}
        for cp in cps:
            s = self.nfkc(cp)
            if s == chr(cp):
                continue
            self.stats['nfkc_changed'] += 1
            if not self.usable(s):
                self.stats['nfkc_dropped_bad'] += 1
                continue
            s = s.replace(FRACTION_SLASH, FRACTION_SLASH_PLAIN)
            if self.half_width(chr(cp)) == s:
                self.stats['nfkc_dropped_width'] += 1   # 宽度折叠通道已覆盖
                continue
            out[cp] = [s]
        return out

    def letter_identity_spoof(self, cp, target):
        """「拿别的字母/数字去顶替」的那类同形字——2026-09-21 用户裁定**不收**。

        判据（用户原话）：**跟它相似的那个，是不是同一个字母——含字母变体、含字母被当符号用？
        不是就删。** 多字符的拆开看关键那个：`🄘`（带括号的 i）配 `(l)` ✗、`⑽`（10）配 `(lO)` ✗。

        - 删：`Ｉ→l`、`⒨→(rn)`、`⑽→(lO)`、`△→Δ`（三角形不是希腊字母）、`þ→p`、`ſ→f`
        - 留：`①→➀`（都是数字 1）、`ɡ→g`（同字母的花体）、`∑→Ʃ`／`∀→Ɐ`（数学借字母形）

        ⚠️ 我在这条判据上连着错过两次：先按「多字符」一刀切（错杀 `🝜→sss`、错放 `∞→oo`），
        又按「源是字母才管」切（还是错）。**"多字符"不是判据，"是不是同一个字母"才是。**
        两边都不是字母数字的（`☐→□`、`○→°`）不归这条管，留给人工。
        """
        if (chr(cp), target) in MULTI_KEEP:
            return False          # 这 6 条是符号本身的写法/通行缩写，不是顶替
        ia = letter_identity(self.names.get(cp, ''))
        ib = (letter_identity(self.names.get(ord(target), '')) if len(target) == 1
              else ascii_alnum_content(target))
        if ia is None and ib is None:
            return False
        if ia == ib:
            return False
        if MATH_IDENTITY.search(self.names.get(cp, '')) and ib and ib.isalpha():
            return False          # 数学/逻辑符号借字母形（∑→Ʃ、∀→Ɐ、∏→Π）
        return True

    def confusable_forms(self, char_set):
        """同形字 → {码位: [形式]}（收窄 + 过滤后）。"""
        out = {}
        for cp, target in load_confusables().items():
            if cp not in char_set:
                continue
            self.stats['conf_in_data'] += 1
            if self.script_of(cp) not in CONFUSABLE_SCRIPTS:
                continue
            self.stats['conf_narrow'] += 1
            if not self.usable(target):
                self.stats['conf_dropped_bad'] += 1
                continue
            if self.letter_identity_spoof(cp, target):
                self.stats['conf_dropped_spoof'] += 1     # 拿别的字母/数字顶替（1↔l、m↔rn、△↔Δ）
                continue
            if self.half_width(chr(cp)) == target:
                self.stats['conf_dropped_width'] += 1     # 宽度折叠通道已覆盖
                continue
            if any(self.decorative_target(ord(ch)) for ch in target):
                self.stats['conf_dropped_decor'] += 1     # 目标落在装饰性图形块
                continue
            if any(self.script_of(ord(ch)) not in CONFUSABLE_TARGET_SCRIPTS for ch in target):
                self.stats['conf_dropped_script'] += 1    # 目标文字系统不在白名单
                continue
            out[cp] = [target]
        return out

    def build(self, cps, char_set):
        """合并两个来源 → {字符: [去重后的等价形式]}，同一字符的多条形式合在一起。"""
        merged = {}
        order = []

        def put(cp, forms):
            ch = chr(cp)
            kept = merged.get(ch) or []
            seen = {f.lower() for f in kept}         # 搜索不分大小写，大小写变体算重复
            for f in forms:
                if f != ch and f.lower() not in seen and f.lower() != ch.lower():
                    kept.append(f)
                    seen.add(f.lower())
            if not kept:                             # 一条都没留下就别建壳
                return
            if ch not in merged:
                order.append(ch)
            merged[ch] = kept

        nfkc = self.nfkc_forms(cps)
        for cp in cps:
            if cp in nfkc:
                put(cp, nfkc[cp])
        conf = self.confusable_forms(char_set)
        for cp in sorted(conf):
            put(cp, conf[cp])
            if cp in nfkc:
                self.stats['conf_overlap_nfkc'] += 1
            else:
                self.stats['conf_added'] += 1
        return {ch: merged[ch] for ch in order}


# ==================== 写盘 ====================

def ordered(entry):
    """按 FIELD_ORDER 排字段；未知字段原样排在最后。"""
    out = {k: entry[k] for k in FIELD_ORDER if k in entry}
    for k in entry:
        if k not in out:
            out[k] = entry[k]
    return out


def blocked(entry_char, entry, fallback_names):
    """这条条目里「可被搜到的文本」的原文（小写）—— 名字、别名、直译名兜底。

    ⚠️ 返回值拿去**做子串判断**（`f in t`），不是拿去做集合成员判断，
    所以返回的必须是完整字符串、不能是先切好的词。

    三处都要算进去，漏一处就会造出「别名跟在名字后面重复显示」的条目
    （实测：漏掉第 3 处会多出 170 条，全是康熙部首 —— `⼀` 的名字就是 `一`，
    再挂一条 `一` 当别名纯属重复）：

    1. 符号数据里这条自己的名字（条目级 `name`、各组 `name`）
    2. 各组已有的别名（含条目级 `alias`）
    3. **直译名兜底名**（`官方名直译名.js` 里这个字符的中文名）—— 条目没有名字时，
       显示走的就是它
    """
    words = {a.lower() for a in (entry.get('alias') or [])}
    if entry.get('name'):
        words.add(entry['name'].lower())
    for group in (entry.get('groups') or {}).values():
        if group.get('name'):
            words.add(group['name'].lower())
        words |= {a.lower() for a in (group.get('alias') or [])}
    if len(entry_char) == 1:
        fallback = fallback_names.get(str(ord(entry_char)))
        if fallback:
            words.add(fallback.lower())
    return words


def fresh_forms(entry_char, entry, forms, fallback_names):
    """这条条目真正需要追加的等价形式。

    判据：**这条等价形式当查询词打进去，这个字符现在会不会被搜到？**
    会，就不必挂——搜索的匹配方式是「可搜索文本包含查询词」，所以只要 `f` 是
    任何一处显示名 / 已有别名的**子串**，打 `f` 本来就命中它。

    ⚠️ 早先这里是**完全相同**（`f.lower() not in taken`），漏掉整整一类：
    `¹` 的等价形式 `1` 落在直译名「上标1」里面、`㊀` 的 `一` 落在「带圈数字一」里面，
    都不是相等，于是被当成"需要追加"灌了 1226 条纯冗余别名（2026-09-17 改成子串）。
    ⚠️ `taken` 里装的是「可搜索文本」的**原文**（名字、别名），不是词——子串判断必须拿原文比。
    """
    if not forms:
        return []
    taken = blocked(entry_char, entry, fallback_names)
    ch = entry_char.lower()
    return [f for f in forms
            if f.lower() != ch and not any(f.lower() in t for t in taken)]


def plan(equiv, fallback_names):
    """算要做什么、不落盘。→ ([要追加 alias 的条目], [要新建的条目])。

    落盘和 `--dry-run` **共用这一个函数**，否则两边数字对不上：dry-run 若直接拿
    `len(equiv) − 已有条数` 当「需新建」，就不计上面的重复过滤，实测虚报 170 条。
    """
    existing = {o['char']: o for o in load_symbols()}
    patch = [entry for ch, entry in existing.items()
             if fresh_forms(ch, entry, equiv.get(ch), fallback_names)]
    fresh = [{'char': ch, 'alias': alias}
             for ch in equiv if ch not in existing
             for alias in [fresh_forms(ch, {}, equiv[ch], fallback_names)] if alias]
    return patch, fresh


def apply_plan(patch, fresh, equiv, fallback_names):
    """按计划落盘。→ (改了的老条目数, 新建条目数)。"""
    wanted = {e['char'] for e in patch}

    def add_alias(entry):
        """给已有条目补条目级 alias。重排字段后原地覆盖（update_symbols 认这个对象）。"""
        if entry['char'] not in wanted:
            return False
        fresh_alias = fresh_forms(entry['char'], entry, equiv.get(entry['char']), fallback_names)
        if not fresh_alias:
            return False
        updated = dict(entry)
        updated['alias'] = list(entry.get('alias') or []) + fresh_alias
        entry.clear()
        entry.update(ordered(updated))
        return True

    changed = update_symbols(add_alias)
    if fresh:
        append_symbols(fresh)
    return changed, len(fresh)


def main(argv):
    dry = '--dry-run' in argv

    names = read_data(os.path.join(BASE, 'unicode官方名.js'), 'UNICODE_NAMES_DATA')['names']
    cps = sorted(int(k) for k in names if '-' not in k)     # 序列键不适用 NFKC
    char_set = set(cps)
    print('项目单码位字符: %d' % len(cps))

    eq = Equiv()
    equiv = eq.build(cps, char_set)
    print('--- 来源 ---')
    print('  NFKC 会改写: %d（剔组合符/空白 %d，与宽度折叠重复 %d）'
          % (eq.stats['nfkc_changed'], eq.stats['nfkc_dropped_bad'], eq.stats['nfkc_dropped_width']))
    print('  confusables 落在字符集里: %d（收窄后 %d；剔组合符 %d、与宽度折叠重复 %d、'
          '装饰性图形 %d、目标文字系统 %d、ASCII 冒充 %d；与 NFKC 同一字符 %d）'
          % (eq.stats['conf_in_data'], eq.stats['conf_narrow'], eq.stats['conf_dropped_bad'],
             eq.stats['conf_dropped_width'], eq.stats['conf_dropped_decor'],
             eq.stats['conf_dropped_script'], eq.stats['conf_dropped_spoof'],
             eq.stats['conf_overlap_nfkc']))
    print('合并: %d 个字符 / %d 条等价形式' % (len(equiv), sum(len(v) for v in equiv.values())))

    patch, fresh = plan(equiv, load_zh()['names'])
    print('  要追加 alias 的老条目: %d' % len(patch))
    print('  要新建的条目: %d' % len(fresh))

    if dry:
        print('--dry-run：未落盘')
        return 0

    changed, added = apply_plan(patch, fresh, equiv, load_zh()['names'])
    print('--- 落盘 ---')
    print('  追加 alias 的条目: %d' % changed)
    print('  新建条目: %d' % added)
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))

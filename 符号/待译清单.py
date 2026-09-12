# -*- coding: utf-8 -*-
"""刷新 符号/待译清单.json —— 符号页「名字还没译干净」的两类清单 + KEEP 存疑清单。

结构（旧版只有一个扁平 items，判据是「名字里出现了词表查不到的英文词」）：

  a 节 —— 「译法有了、却没应用到名字里」
     判据：名字里出现的某个拉丁 token **是 WORD/PHRASE 里的键**
     （说明词表已给出中文译法），却仍以拉丁原文留在中文名里。
     例：阿拉伯字母ALEF WITH ATTACHED TOP RIGHT FATHA AND DOT ABOVE
         → todo ['ABOVE','AND','ATTACHED','DOT','RIGHT','WITH']
     这类条目老判据**永远报不出来**：WITH/ATTACHED/DOT/ABOVE 全在词表里，
     「词都在词表里」于是被当成已处理 —— 口径洞就在这里。
     每条 {cp, name, todo:[该应用的词…]}

  b 节 —— 「词表里根本没有这个词」（新词，需要新增译法）
     判据：名字里出现既不在 WORD/PHRASE、也不在 KEEP 里的英文词。
     每条 {cp, name, block:[卡住的词…]}

  keep_suspect 节 —— KEEP 存疑清单（**只列出，不自动改**）
     KEEP 是扁平集合、没有语境，AT / IN / NO 这类词既是英文虚词又是音节名。
     这里把 KEEP 里「像英文常用词」的挑出来给人工过目，词表一个都不动。

a / b 两节**可以重叠**：同一条名字可能既有「没应用的译法」（a），又夹着
「词表没有的新词」（b）—— 两边都列，改的时候别只改一边。

已知残留（本次**没改**行为，只在控制台报数）：b 节沿用旧判据，把「出现在某个
PHRASE 里的词」也算已处理（当初是为了不让 WITH 尾巴挡路）。副作用是 PHRASE
'TOP BAR' 会让 TOP / BAR 单飞时也不进 b 节。控制台的「短语遮蔽」一行报出这类
条目的量；要彻底修就把 known 里的 phw 去掉，但那会改变 b 节的规模，得先拍板。

分词规则：
  · 只取长度 ≥2 的拉丁字母串（单个字母当编号处理，如 B155 / A715，不参与）
  · 先剥码位后缀 -?[0-9A-F]{4,}：契丹小字字符-18BED 会被切成 BED、
    契丹小字字符-18BEE 切成 BEE，这些伪词撞进词表就会误判/漏报。
    只剥「带前导连字符」或「自身含数字」的；纯字母串（DEAD / BCAD / AEDA
    这类真字母名、真转写）原样保留，免得把真词当码位删掉。
  · 再切「小写→大写」边界（CAMEL）：中文名里贴着汉字的小写拉丁是**译法残留**，
    不是没译的 token。源名 'CYRILLIC CAPITAL LETTER IOTIFIED E' 译成
    「西里尔大写字母带iotaE」（IOTIFIED→带iota），Latin 串 'iotaE' 把残留 'iota'
    和未译的 'E' 粘成一个 token 'IOTAE'，白报一条（iotaA / iotaYAT 同理）。
    切完 'iota' 命中 KEEP、'E' 只有 1 个字母按编号规则忽略。
    只切小写→大写，全大写的字母名/转写不受影响。
  · 大小写不敏感（词表一律大写）

用法：
    python 符号/待译清单.py             # 刷新 待译清单.json 并打印统计
    python 符号/待译清单.py --top 50    # 顺带列出每节挡路最多的 50 个词

只依赖项目内路径，可在任何目录下执行。
"""
import io
import importlib.util
import json
import os
import re
import sys
from collections import Counter

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

BASE = os.path.dirname(os.path.abspath(__file__))
ZM = os.path.join(BASE, '中文名.json')
WL = os.path.join(BASE, '待译清单.json')
TOP = 20
if '--top' in sys.argv:
    TOP = int(sys.argv[sys.argv.index('--top') + 1])

TOKEN = re.compile(r'[A-Za-z]{2,}')
HEX_SUFFIX = re.compile(r'(?i)-?[0-9A-F]{4,}\b')
# 小写→大写 = 拉丁串内部的分词边界。名字层里，贴着汉字的那段小写拉丁是**中文
# 译法的残留**，不是没译的 token：源名 'CYRILLIC CAPITAL LETTER IOTIFIED E'
# 译成「西里尔大写字母带iotaE」（IOTIFIED→带iota），Latin 串 'iotaE' 于是把
# 译法残留 'iota' 和未译的 'E' 粘成了一个 token 'IOTAE'，白报一条。
# 只切 小写→大写：语料里的混合大小写串只有 iotaE/iotaA/iotaYAT（全是这类粘接）
# 和 'Co.'（方块Co.，大写→小写，不动）；全大写的字母名/转写一律不受影响。
CAMEL = re.compile(r'(?<=[a-z])(?=[A-Z])')

# KEEP 里「像英文常用词」的存疑名单用：高频英文词（虚词 + 短实词）。
# 只用来**筛出**要人工过目的 KEEP 词，不参与 a/b 判定，也不改词表。
ENGLISH_WORDS = set("""
    A AN THE AND OR NOR NOT NO SO IF THEN THAN THAT THIS THESE THOSE THERE THEIR
    THEM THEY YOU HE SHE IT WE US ME MY MINE YOUR YOURS HIS HER HERS ITS OUR OURS
    HIM DO DOES DID DONE BE BEEN AM IS ARE WAS WERE WILL WOULD SHALL SHOULD CAN
    COULD MAY MIGHT MUST HAVE HAS HAD AT IN ON OF TO BY FOR FROM WITH WITHOUT UP
    DOWN OUT INTO OVER UNDER ABOVE BELOW ABOUT AFTER BEFORE BETWEEN AGAIN ONCE
    HERE THERE WHEN WHERE WHY HOW ALL ANY BOTH EACH FEW MORE MOST OTHER SOME SUCH
    ONLY OWN SAME TOO VERY JUST ALSO EVEN STILL YET NOW EVER NEVER ALWAYS OFTEN
    PER VIA ONE TWO THREE FOUR FIVE SIX SEVEN EIGHT NINE TEN ELEVEN TWELVE MAN
    MEN WOMAN BOY GIRL COW OX BULL CALF PIG DOG CAT RAT BAT BEE OWL FOX BIRD FISH
    SUN MOON STAR SKY DAY NIGHT MORN EVE YEAR MONTH WEEK HOUR TIME EGG EYE EAR
    ARM LEG FOOT HAND HEAD HAIR NOSE MOUTH TOOTH FACE BODY SKIN BONE BLOOD KING
    QUEEN LORD GOD MAN SOUL LIFE DEATH HOUSE HOME ROAD WAY WALL DOOR GATE TREE
    LEAF WOOD STONE ROCK SAND SEA WAVE RIVER LAKE HILL MOUNT FIELD FARM GOLD
    SILVER IRON COPPER SALT OIL WAX WOOL CLOTH ROPE KNIFE SWORD SPEAR BOW ARROW
    CUP POT BOWL JAR BOX BAG NET HOOK WHEEL BOAT SHIP CART HORSE COW GOAT SHEEP
    RAT MOUSE LION BEAR WOLF DEER HARE SNAKE WORM FLY ANT SPIDER HOT COLD WET DRY
    NEW OLD BIG SMALL LONG SHORT HIGH LOW WIDE NARROW DEEP THIN THICK HARD SOFT
    GOOD BAD TRUE FALSE FULL EMPTY OPEN SHUT FAST SLOW WARM COOL LIGHT DARK
    SEE SAW LOOK HEAR SAY SAID TELL SPEAK CALL NAME WORD SONG PLAY SING DANCE EAT
    DRINK SLEEP WAKE WALK RUN JUMP FLY SWIM SIT STAND LIE FALL RISE GIVE TAKE GET
    PUT SET LET MAKE DO GO COME SEND FIND LOSE KEEP HOLD BRING BUY SELL PAY OWE
    WIN LOSE KILL DIE LIVE BURN CUT DIG HIT BEAT PUSH PULL TURN MOVE STOP START
    END OPEN CLOSE PLUS MINUS LESS MORE HALF PART WHOLE
""".split())


def load_words():
    """加载 符号/译名词表.py，返回模块（WORD / KEEP / PHRASE / ENGLISH）"""
    path = os.path.join(BASE, '译名词表.py')
    spec = importlib.util.spec_from_file_location('译名词表', path)
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


def strip_code_suffixes(name):
    """剥掉 -?[0-9A-F]{4,} 形式的码位后缀，返回等长、被剥处为空格的新串。

    只剥「带前导连字符」或「自身含数字」的，纯字母串（DEAD / BCAD / AEDA
    这类真字母名、真转写）保留 —— 否则会把真词当码位静默删掉。
    """
    spans = []
    for mm in HEX_SUFFIX.finditer(name):
        s = mm.group(0)
        if s.startswith('-') or re.search(r'[0-9]', s):
            spans.append(mm.span())
    for a, b in reversed(spans):
        name = name[:a] + ' ' + name[b:]
    return name


def tokens_of(name):
    """分词：剥码位后缀 → 切小写→大写边界 → 取长度 ≥2 的拉丁串 → 全大写去重"""
    return sorted({t.upper() for t in TOKEN.findall(CAMEL.sub(' ', strip_code_suffixes(name)))})


def main():
    w = load_words()
    # 短语里的词也算「已处理」，这样 WITH 尾巴才不会被当成挡路
    phw = set(x for ph in w.PHRASE for x in ph.split())
    known = set(w.WORD) | set(w.KEEP) | phw | set(w.PHRASE)

    # a 节候选键：有译法的词。剔掉三类不算「没应用」的：
    #   · 译法本身就是拉丁原样（APL / OCR）——原文出现即正确形态
    #   · 同时在 KEEP 里的（EPACT / HORA / SHAN）——出现时无法区分是译法还是专名
    ident = {k for k, v in w.WORD.items() if not re.search(r'[一-鿿]', v)}
    akey = set(w.WORD) - set(w.KEEP) - ident

    d = json.load(open(ZM, encoding='utf-8'))['names']
    prev = set()
    if os.path.exists(WL):
        old = json.load(open(WL, encoding='utf-8'))
        for sec in ('a', 'b', 'items'):           # items = 旧版扁平结构
            for it in old.get(sec, []) or []:
                prev.add(it['cp'])

    a_items, b_items = [], []
    for cp, name in d.items():
        toks = tokens_of(name)
        raw_up = strip_code_suffixes(name).upper()

        todo = [t for t in toks if t in akey]
        todo += [p for p in w.PHRASE if p in raw_up and p not in ident]
        if todo:
            a_items.append({'cp': cp, 'name': name, 'todo': sorted(set(todo)),
                            'new': cp not in prev})

        miss = [t for t in toks if t not in known]
        if miss:
            b_items.append({'cp': cp, 'name': name, 'block': miss,
                            'new': cp not in prev})

    # 残留口径洞（不改 b 节语义，只报数）：只出现在 PHRASE 里的词被当成「已处理」，
    # 如 PHRASE 'TOP BAR' 会让 TOP / BAR 单独出现时也不进 b 节。这类条目上面已经
    # 一条都不漏地算了，这里只把「本来会被漏掉」的量报出来供人工判断。
    phw_only = {t for t in phw if t not in set(w.WORD) | set(w.KEEP)}
    mask_words = Counter()
    for cp, name in d.items():
        toks = tokens_of(name)
        if any(t not in known for t in toks):
            continue                                   # 已在 b 节报到
        for t in toks:
            if t in phw_only:
                mask_words[t] += 1

    # KEEP 存疑：只挑出来给人看，不动 KEEP
    kc = Counter(t for name in d.values() for t in tokens_of(name)
                 if t in w.KEEP and t in ENGLISH_WORDS)

    json.dump({'note': '待译清单。a = 词表有译法但名字里仍留拉丁原文的条目'
                       '（译法未应用）；b = 名字里含词表未收录英文词的条目（缺译法）；'
                       'keep_suspect = KEEP 里像英文常用词的存疑项，仅供人工过目，'
                       '不自动改词表。由 符号/待译清单.py 生成，改好下次跑自动除名。'
                       'a/b 两节可重叠。',
               'counts': {'a': len(a_items), 'b': len(b_items),
                          'keep_suspect': len(kc)},
               'a': a_items, 'b': b_items,
               'keep_suspect': [{'word': t, 'names': n} for t, n in kc.most_common()]},
              open(WL, 'w', encoding='utf-8', newline='\n'), ensure_ascii=False, indent=1)

    na = sum(1 for it in a_items if it['new'])
    nb = sum(1 for it in b_items if it['new'])
    print('a 节（有译法没应用）：%d 条（本轮新出现 %d）' % (len(a_items), na))
    print('b 节（词表没有的新词）：%d 条（本轮新出现 %d）' % (len(b_items), nb))
    bset = {x['cp'] for x in b_items}
    both = sum(1 for it in a_items if it['cp'] in bset)
    print('两节重叠（同一条既有没应用的译法、又夹着新词）：%d 条' % both)
    print('词表：WORD %d 词 / PHRASE %d 短语 / KEEP %d 词 / ENGLISH %d 词'
          % (len(w.WORD), len(w.PHRASE), len(w.KEEP), len(w.ENGLISH)))
    if mask_words:
        print('短语遮蔽（词只出现在 PHRASE 里，b 节会漏掉它们单飞的情况）：%d 条 / %d 词 —— %s'
              % (sum(mask_words.values()), len(mask_words),
                 ' '.join('%s(%d)' % (t, n) for t, n in mask_words.most_common(12))))

    ca = Counter(t for it in a_items for t in it['todo'])
    cb = Counter(t for it in b_items for t in it['block'])
    print('\na 节词 top %d（共 %d 个不同词；括号内是词表给的中文译法）：' % (TOP, len(ca)))
    for tok, n in ca.most_common(TOP):
        print('   %5d  %-22s %s' % (n, tok, w.WORD.get(tok, '（短语）')))
    print('\nb 节词 top %d（共 %d 个不同词）：' % (TOP, len(cb)))
    for tok, n in cb.most_common(TOP):
        print('   %5d  %s' % (n, tok))
    print('\nKEEP 存疑（像英文常用词的 KEEP 项，共 %d 个，只列不改）：' % len(kc))
    print('   ' + ' '.join('%s(%d)' % (t, n) for t, n in kc.most_common()))


if __name__ == '__main__':
    main()

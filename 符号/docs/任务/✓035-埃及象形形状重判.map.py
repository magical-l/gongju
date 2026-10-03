# -*- coding: utf-8 -*-
# ✓035 埃及象形「形象型标签」判定表（与 ✓035-埃及象形形状重判.md 配套）
#
# 依据：符号/参考资料/Unikemet.txt 的 kEH_Desc（Unicode 官方，采自 Gardiner 著作）
#       —— 「这个符号画的是什么」。
# ⚠️ 不要拿官方名里的 Gardiner 字母（N035 的 N）当形状：那是主题分类，不是形状。
#
# 主体 = 描述的首个名词短语（截到第一个逗号/句号，再去掉 with/holding/inside/upon/… 引出的附带物）。
# 判序：动物 → 人/人体部位 → 植物 → 器物 → 主体本身是几何形 → Gardiner 组兜底。
#
# 这 1046 个的实际来源：
#   921 条 classify(kEH_Desc)       ← 本模块
#     4 条 OVERRIDE                 ← 本模块
#    12 条 按 kEH_AltSeq 继承变体的判定（无自己的描述）
#   109 条 无 kEH_Desc 也无变体指向  ← 保留逐页看图判的结果，见 ✓035 文档 §3
#
# 配套：**语义型**标签另按 参考资料/NamesList.txt 的「怎么用」挂（本轮未做）。
import os, re, collections

# 本文件在 符号/docs/任务/ 下；参考资料在同项目 符号/参考资料/
_HERE = os.path.dirname(os.path.abspath(__file__))
_REF = os.path.join(_HERE, '..', '..', '参考资料', 'Unikemet.txt')

U = collections.defaultdict(dict)
for line in open(_REF, encoding='utf-8'):
    if line.startswith('U+'):
        cp, tag, val = line.rstrip('\n').split('\t', 2)
        U[int(cp[2:], 16)][tag] = val

SHAPES = ['圆形纹', '方形纹', '三角纹', '线形纹', '波浪纹', '云纹', '点状纹', '星形纹',
          '植物纹', '动物纹', '人形纹', '心形纹', '交叉纹', '网格纹', '六边形纹',
          '菱形纹', '器具纹']

GROUP_FALLBACK = {
    'A': ['人形纹'], 'B': ['人形纹'], 'C': ['人形纹'], 'D': ['人形纹'],
    'E': ['动物纹'], 'F': ['动物纹'], 'G': ['动物纹'], 'H': ['动物纹'],
    'I': ['动物纹'], 'K': ['动物纹'], 'L': ['动物纹'],
    'M': ['植物纹'],
    'N': ['线形纹'], 'NL': ['线形纹'], 'NU': ['线形纹'],
    'O': ['器具纹'], 'P': ['器具纹'], 'Q': ['器具纹'], 'R': ['器具纹'],
    'S': ['器具纹'], 'T': ['器具纹'], 'U': ['器具纹'], 'V': ['器具纹'],
    'W': ['器具纹'], 'X': ['器具纹'], 'Y': ['器具纹'],
    'Z': ['线形纹'], 'AA': ['器具纹'],
}

ANIMAL = r'\b(?:animal|mammal|bird|fish|reptile|insect|amphibian|falcon|hawk|vulture|' \
         r'eagle|goose|duck|owl|swallow|sparrow|hoopoe|ibis|flamingo|stork|heron|' \
         r'cormorant|widgeon|quail|plover|crane|egret|pelican|lapwing|cattle|ox|bull|' \
         r'cow|calf|sheep|ram|ewe|goat|antelope|gazelle|oryx|ibex|bubalis|donkey|horse|' \
         r'pig|boar|hippopotamus|lion|leopard|cheetah|panther|cat|dog|hound|jackal|fox|' \
         r'hare|rabbit|monkey|baboon|crocodile|lizard|gecko|snake|serpent|cobra|viper|' \
         r'frog|toad|scorpion|beetle|scarab|locust|grasshopper|fly|bee|wasp|tilapia|' \
         r'mullet|catfish|turtle|tortoise|egg|feather|wing|tail|horn|hoof|claw|beak|' \
         r'spoonbill|beef|shelduck|teal|snipe|curlew|kingfisher|barbet|' \
         r'tusk|nest|bovid|pelt|mammalian|squid|belemnite)(?:s|es)?\b|' \
         r'\bskins? of\b|\bpiece of .*skin\b|\bhide\b'
HUMAN = r'\b(?:man|men|woman|women|person|human|figure|deity|god|goddess|king|queen|' \
        r'prince|princess|priest|priestess|child|infant|baby|dwarf|enemy|prisoner|' \
        r'worshipper|servant|soldier|mummy|sidelock|beard|nomarch|official)(?:s|es)?\b|' \
        r'\bman/god\b'
BODYPART = r'\b(?:head|face|eye|eyebrow|pupil|mouth|lip|lips|ear|nose|nostril|arm|' \
           r'forearm|hand|palm of the hand|palm|fist|finger|thumb|thigh|knee|leg|foot|' \
           r'feet|toe|heart|windpipe|lung|tongue|tooth|teeth|hair|breast|navel|phallus|' \
           r'backbone|vertebra|rib|spine|skeleton|skull|flesh|bone|mustache|curls|' \
           r'pubic|loin|nape|thumb)(?:s|es)?\b'
PLANT = r'\b(?:plant|tree|leaf|leaves|reed|papyrus|lotus|flower|blossom|grain|corn|' \
        r'barley|wheat|branch|bough|seed|fruit|herb|bulb|root|rhizome|stalk|stem|' \
        r'palm branch|vine|thorn|thicket|bush|sedge|shoot|sprout|bud|sheaf|flax|' \
        r'clover|wood|log of wood)(?:s|es)?\b|\bstalks?\b|\bbundle of reeds\b'
OBJ = r'\b(?:vessel|pot|jar|jug|vase|bowl|cup|basin|dish|plate|tray|basket|box|chest|' \
      r'sack|bag|pouch|quiver|shield|axe|adze|knife|dagger|spear|harpoon|mace|bow|arrow|' \
      r'club|razor|chisel|drill|graver|sickle|plough|plow|hoe|pestle|mortar|loom|spindle|' \
      r'comb|brush|fan|mirror|sceptre|scepter|crook|flail|whip|rope|cord|cloth|garment|' \
      r'clothing|sandal|kilt|apron|girdle|wig|headdress|crown|mask|necklace|collar|' \
      r'pectoral|pendant|amulet|ring|seal|cylinder|weight|boat|ship|barque|sail|oar|mast|' \
      r'bier|chair|stool|seat|bed|headrest|table|altar|censer|brazier|scales|balance|' \
      r'plummet|sistrum|harp|trap|chariot|float|kiln|cartouche|granary|storehouse|' \
      r'fortress|brick|yoke|hobble|frail|warp|platform|ingot|loaf|bread|offering|emblem|' \
      r'pawn|draughtsman|tie|binding|bandage|knot|loop|strap|bolt|shelter|well|house|' \
      r'enclosure|wall|door|gate|gateway|doorway|temple|shrine|building|palace|pavilion|' \
      r'booth|hall|courtyard|façade|facade|mastaba|obelisk|stela|stairway|staircase|' \
      r'column|post|standard|scroll|block|bundle|rack|pole|stake|peg|threshold|hoop|' \
      r'water skin|sieve|winnowing|figure of|piece of cloth|newspaper)(?:s|es)?\b'

GEO = [
    ('网格纹', r'\b(?:grid|net|mesh|grating|lattice|checker|reticul\w*|hatch\w*|'
               r'irrigation ditches|wickerwork)(?:s)?\b'),
    ('波浪纹', r'\b(?:ripple|wave|wavy|undulat\w*|zigzag|inundation|flood)(?:s|es)?\b|'
               r'\bripple of water\b|\bwaves of water\b'),
    ('星形纹', r'\b(?:star|asterisk)(?:s)?\b'),
    ('交叉纹', r'\bcrossed\b|\bcross(?:es)?\b|\bintersect\w*\b|\bX-shape\b'),
    ('菱形纹', r'\b(?:rhomb\w*|diamond|lozenge)(?:s)?\b'),
    ('六边形纹', r'\b(?:hexagon\w*|honeycomb)(?:s)?\b'),
    ('云纹', r'\bcloud\w*\b'),
    ('点状纹', r'\b(?:dot|pellet|granule|bead|speck|spot|grain)(?:s|es)?\b'),
    ('心形纹', r'\bhearts?\b'),
    ('三角纹', r'\b(?:triang\w*|pyramid\w*|cone|conical|wedge|obelisk)(?:s)?\b'),
    ('圆形纹', r'\b(?:circle|circular|disk|disc|round|oval|ring|hoop|ball|bead|sun|'
               r'sun disk|moon|crescent|pupil|egg|spherical)(?:s|es)?\b'),
    ('方形纹', r'\b(?:square|rectang\w*|quadrang\w*|cube|block|cartouche|wall|house|'
               r'enclosure|doorway|gateway|shrine|hall|courtyard|façade|facade|brick|'
               r'stela|platform|box|chest)(?:s|es)?\b|\bplan of\b|\bplans of\b'),
    ('线形纹', r'\b(?:a line|line|stroke|bar|rod|staff|stick|strip|ribbon|plank|beam|'
               r'shaft|thread|cord|string|fillet|pole|bolt)(?:s|es)?\b'),
]

CUT = re.compile(r'\s+(?:with|holding|inside|in front of|on top of|on\b|above|below|under|'
                 r'behind|upon|from|towards|pointing|angled|written|placed|consisting|'
                 r'related to|for|by)\s+.*$', re.I)

# 撞词：先抹掉，免得被旁边的类抢走
TRAP = [
    (r'\bwater skin\b', 'BAGP'), (r'\bwater scorpion\b', 'SCORP'), (r'\bhouse sparrow\b', 'SPARR'),
    (r'\breed shelter\b', 'SHLTR'), (r'\bpalm branch\b', 'PBRANCH'), (r'\bgrain of sand\b', 'SANDGRAIN'),
    (r'\bgrains of sand\b', 'SANDGRAINS'), (r'\bbundle of reeds\b', 'REEDB'),
    (r'\bwooden column\b', 'WCOL'), (r'\bbow of a boat\b', 'BOATBOW'),
    (r'\btongues? of land\b', 'TONGLAND'),
    (r'\bears? of corn\b', 'EAROFCORN'),
    (r'\bpalms? of the hand\b', 'HANDPM'),
    (r'\bgrain measure\b', 'GRAINMEAS'),
    (r'\bbeads?\b', 'BEADX'),
    (r'\bpectoral of\b', 'PECTORALOF'),
]

# 人工覆盖（分类器怎么调都不对的小尾巴）
OVERRIDE = {
    # 只有分类器真判不出来的才留在这
    0x13131: ['线形纹'],      # AA56 一条长竖线（组兜底会多挂器具纹）
    0x13208: ['网格纹'],      # N024 一畦带灌渠的地：渠就是那张网
    0x13212: ['点状纹'],      # N033 一粒沙
    0x13213: ['点状纹'],      # N033A 三粒沙
}


def prep(desc):
    s = desc
    for rx, rep in TRAP:
        s = re.sub(rx, rep, s, flags=re.I)
    return s


def subject(desc):
    s = prep(desc).split('.')[0].split(',')[0].strip()
    return CUT.sub('', s).strip()


def classify(desc, letter):
    sub = subject(desc)
    if re.search(ANIMAL, sub, re.I):
        dom = ['动物纹']
    elif re.search(HUMAN, sub, re.I) or re.search(BODYPART, sub, re.I):
        dom = ['人形纹']
    elif re.search(PLANT, sub, re.I):
        dom = ['植物纹']
    elif re.search(OBJ, sub, re.I):
        dom = ['器具纹']
    else:
        dom = []
    geo = [n for n, rx in GEO if re.search(rx, sub, re.I)]
    if not dom and (not geo or GROUP_FALLBACK[letter] != ['线形纹']):
        dom = list(GROUP_FALLBACK[letter])
    return dom + geo

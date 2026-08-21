# -*- coding: utf-8 -*-
"""
tag_emoji.py — 给未打标的 emoji 批量打语义标签。

策略：
  1) 从 emoji-test.txt 取 fully-qualified 单码位 emoji（去肤色变体）。
  2) 按 emoji-test 的 group/subgroup 映射到用户语义标签（SUBGROUP_MAP）。
  3) 需要细分的子组用关键词微调（KEYWORD_REFINE）。
  4) 已有语义标签的跳过（不覆盖迁移结果）。
  5) 额外：emoji 根 = 全部 base emoji；emoji/emoji-text双模 = 有 text/emoji 双模式的码位；
     旗帜序列 → 标志/旗帜/国旗。

运行： python tag_emoji.py [--dry]
"""
import json
import re
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
EMOJI_TEST = os.path.join(HERE, '参考资料', 'emoji-test.txt')
TAGS_JSON = os.path.join(HERE, '标签.json')

# ---------------------------------------------------------------- 子组 → 标签
FACE = ['人与身体/情绪表达', '人与身体/脸']
HAND = ['人与身体/身体部位/手、手势']

SUBGROUP_MAP = {
    # Smileys & Emotion
    'face-smiling': FACE, 'face-affection': FACE, 'face-tongue': FACE,
    'face-hand': FACE, 'face-neutral-skeptical': FACE, 'face-sleepy': FACE,
    'face-unwell': FACE, 'face-hat': FACE, 'face-costume': FACE,
    'face-glasses': FACE, 'face-concerned': FACE, 'face-negative': FACE,
    'cat-face': FACE + ['自然、科学/生物/动物/哺乳动物'],
    'monkey-face': FACE + ['自然、科学/生物/动物/哺乳动物'],
    'emotion': ['人与身体/情绪表达'],
    'heart': ['人与身体/情绪表达'],
    # People & Body
    'body-parts': ['人与身体/身体部位'],
    'hand-fingers-open': HAND, 'hand-fingers-partial': HAND,
    'hand-single-finger': HAND, 'hand-fingers-closed': HAND,
    'hand-fingers-crossed': HAND, 'hands': HAND, 'hand-prop': HAND,
    'person': ['人与身体/通用人'],
    'person-gesture': ['人与身体/人物角色'] + HAND,
    'person-role': ['社会生活/工作、职业', '人与身体/人物角色'],
    'person-fantasy': ['宗教、神秘学/神话、传说、外星人', '人与身体/人物角色'],
    'person-activity': ['体育、运动/其他运动'],
    'person-sport': ['体育、运动'],
    'person-resting': ['人与身体/人物角色'],
    'person-symbol': ['人与身体/通用人'],
    'family': ['社会生活/家庭'],
    # Animals & Nature
    'animal-mammal': ['自然、科学/生物/动物/哺乳动物'],
    'animal-bird': ['自然、科学/生物/动物/鸟类'],
    'animal-amphibian': ['自然、科学/生物/动物/两栖动物'],
    'animal-reptile': ['自然、科学/生物/动物/爬行动物'],
    'animal-marine': ['自然、科学/生物/动物/海洋动物'],
    'animal-bug': ['自然、科学/生物/动物/虫'],
    'plant-flower': ['自然、科学/生物/植物/花朵'],
    'plant-other': ['自然、科学/生物/植物'],
    'sky & weather': ['自然、科学/自然现象、天气'],
    'zodiac': ['自然、科学/生物/动物/十二生肖'],
    # Food & Drink
    'food-fruit': ['饮食/水果、干果'],
    'food-vegetable': ['饮食/食材/蔬菜'],
    'food-asian': ['饮食/熟菜'],
    'food-prepared': ['饮食/熟菜'],
    'food-marine': ['饮食/食材/水产'],
    'food-sweet': ['饮食/甜点、零食'],
    'drink': ['饮食/饮品、饮料'],
    'dishware': ['饮食/餐饮用具'],
    # Travel & Places
    'place-building': ['社会生活/建筑、场所'],
    'place-religious': ['社会生活/建筑、场所', '宗教、神秘学/宗教符号'],
    'place-geographic': ['自然、科学/地理、地质、地貌'],
    'place-map': ['交通、出行/地图相关'],
    'place-other': ['交通、出行/景点、地标建筑'],
    'transport-ground': ['交通、出行/交通工具/陆路'],
    'transport-water': ['交通、出行/交通工具/水路'],
    'transport-air': ['交通、出行/交通工具/航空'],
    'transport-sign': ['交通、出行/交通标志、信号'],
    'hotel': ['社会生活/建筑、场所'],
    'time': ['社会生活/时间、日期'],
    # Activities
    'sport': ['体育、运动'],
    'game': ['游戏、博弈'],
    'event': ['社会生活/节日、纪念日、庆祝'],
    'arts & crafts': ['书法、绘画'],
    'award-medal': ['社会生活/荣誉'],
    'music': ['声音和音乐'],
    'musical-instrument': ['声音和音乐/乐器'],
    'science': ['自然、科学'],
    'medical': ['社会生活/健康、医疗、医学'],
    # Objects
    'clothing': ['人与身体/服饰'],
    'household': ['社会生活/生活用品、生产用品'],
    'tool': ['社会生活/工具、办公、文具'],
    'office': ['社会生活/工具、办公、文具'],
    'book-paper': ['社会生活/教育、学习'],
    'computer': ['社会生活/电子设备、电子产品'],
    'phone': ['社会生活/电子设备、电子产品'],
    'light & video': ['电影、电视、摄影'],
    'sound': ['声音和音乐/声音与音频'],
    'money': ['标志/货币标志'],
    'mail': ['社会生活/公共设施/通讯、网络'],
    'lock': ['标志/其他标志'],
    'writing': ['书法、绘画'],
    'other-object': ['社会生活/生活用品、生产用品'],
    # Symbols
    'av-symbol': ['标志/其他标志'],
    'geometric': ['数学/几何形状'],
    'alphanum': ['数学/数学用的字母数字符号'],
    'arrow': ['标志/箭头与方向'],
    'warning': ['标志/禁止、警告、危险'],
    'religion': ['宗教、神秘学/宗教符号'],
    'math': ['数学/数学符号/运算符、比较符、操作符'],
    'punctuation': ['语言、文字/标点符号'],
    'currency': ['标志/货币标志'],
    'flag': ['标志/旗帜'],
    'other-symbol': ['标志/其他标志'],
    'keycap': ['技术符号/计算机键盘符号'],
}

# 关键词微调：匹配到 → 覆盖该子组的默认标签
KEYWORD_REFINE = {
    'sport': [
        (re.compile(r'soccer|basketball|football|baseball|tennis|volleyball|rugby|pool|ping pong|badminton|net|ball', re.I), ['体育、运动/球类运动']),
        (re.compile(r'ski|ice skate|curling|snowboard', re.I), ['体育、运动/冰雪运动']),
        (re.compile(r'boxing|martial', re.I), ['体育、运动/功夫']),
    ],
    'game': [
        (re.compile(r'video game|joystick', re.I), ['游戏、博弈/电子游戏']),
        (re.compile(r'die|dice', re.I), ['游戏、博弈/骰子']),
        (re.compile(r'mahjong', re.I), ['游戏、博弈/牌类/麻将']),
        (re.compile(r'playing card|joker', re.I), ['游戏、博弈/牌类/扑克']),
    ],
    'clothing': [
        (re.compile(r'kimono|sari|sari|flag\b', re.I), ['人与身体/服饰/民族特色服饰']),
        (re.compile(r'hat|cap|crown|headband|helmet|graduation cap', re.I), ['人与身体/服饰/帽子']),
        (re.compile(r'shoe|boot|sandal|slipper|footwear|sneaker', re.I), ['人与身体/服饰/鞋子']),
        (re.compile(r'sock', re.I), ['人与身体/服饰/袜子']),
        (re.compile(r'necklace|ring|watch|gem|bell|bag|glasses|purse|tie|scarf|glove|bikini|one-piece', re.I), ['人与身体/服饰/配饰']),
    ],
    'light & video': [
        (re.compile(r'movie|video|camera|clapper|television|radio|projector|film', re.I), ['电影、电视、摄影']),
        (re.compile(r'bulb|flashlight|lantern|light|flashlight|oil lamp|candle|electric', re.I), ['社会生活/生活用品、生产用品']),
    ],
    'event': [
        (re.compile(r'ticket|admission', re.I), ['文化娱乐/娱乐场地和表演']),
    ],
    'arts & crafts': [
        (re.compile(r'scissors|thread|needle|knot|yarn', re.I), ['社会生活/生活用品、生产用品']),
    ],
    'book-paper': [
        (re.compile(r'book|notebook|newspaper|magazine|scroll|page', re.I), ['社会生活/教育、学习']),
    ],
    'science': [
        (re.compile(r'test tube|microscope|dna|atom', re.I), ['自然、科学/物理']),
        (re.compile(r'chemical|alembic', re.I), ['自然、科学/化学']),
    ],
    'person-activity': [
        (re.compile(r'danc', re.I), ['体育、运动/舞蹈']),
        (re.compile(r'running|walking', re.I), ['体育、运动/田径运动']),
        (re.compile(r'climbing', re.I), ['体育、运动/其他运动']),
        (re.compile(r'massage|haircut|standing|kneeling|levitating|bunny|steamy', re.I), ['人与身体/人物角色']),
    ],
    'person-sport': [
        (re.compile(r'swim|surf|row|water polo|diving', re.I), ['体育、运动/水上运动']),
        (re.compile(r'snowboard|ski|ice', re.I), ['体育、运动/冰雪运动']),
        (re.compile(r'golf|gymnast|weight|lifting|climbing|horse|cycle|fencing|martial|wrestl|jugg', re.I), ['体育、运动/其他运动']),
        (re.compile(r'soccer|basketball|volleyball|handball|tennis', re.I), ['体育、运动/球类运动']),
    ],
}

def normalize(name):
    return re.sub(r'[:,]', ' ', name).strip().lower()

# ---------------------------------------------------------------- 读 emoji-test
def read_emoji():
    """返回 (单码位列表, 双模集合, 旗帜序列列表)。"""
    singles = []      # (cp, group, subgroup, name)
    dual = set()      # 有 unqualified/minimally-qualified 的码位 → 双模
    flags = []        # 区域指示符对 → 国旗 seq
    group = sub = None
    for line in open(EMOJI_TEST, encoding='utf-8'):
        if line.startswith('# group:'):
            group = line.split(':')[1].strip()
            continue
        if line.startswith('# subgroup:'):
            sub = line.split(':')[1].strip()
            continue
        if '; ' not in line or '#' not in line:
            continue
        try:
            left, right = line.split(';', 1)
            status = right.split('#', 1)[0].strip()
            name = right.split('#', 1)[1].split(' ', 1)[-1].strip()
        except Exception:
            continue
        # 只处理以十六进制码位开头的行（跳过表头/注释）
        if not re.match(r'^[0-9A-F ]+$', left.strip()):
            continue
        cps = [int(x, 16) for x in left.strip().split()]
        # 双模判定依据：该字符存在"单码位文字形态"条目（status=unqualified）
        # —— 即 Emoji_Presentation=No，字符本身可 text 可 emoji；与 FE0F 后缀无关。
        # 多码位/minimally-qualified 的组件（如 ZWJ 里的人物码位）不参与双模判定。
        if status == 'unqualified' and len(cps) == 1:
            dual.add(cps[0])
            continue
        if status in ('unqualified', 'minimally-qualified'):
            continue
        if status != 'fully-qualified':
            continue
        # 旗帜：区域指示符对
        if len(cps) == 2 and all(0x1F1E6 <= c <= 0x1F1FF for c in cps):
            flags.append(cps)
            continue
        if len(cps) == 1:
            singles.append((cps[0], group, sub, name))
        elif len(cps) == 2 and cps[1] == 0xFE0F:
            # 双模 emoji 的 fully-qualified 形态 = 基码位 + FE0F（如 2639 FE0F ☹️）
            # 按基码位打语义标签，这样 ☹ 这类字符也能进"脸/情绪表达"等
            singles.append((cps[0], group, sub, name))
    return singles, dual, flags


def read_zwj():
    """返回多码位 fully-qualified 序列（非旗帜）→ [(cps, name)]。"""
    out = []
    for line in open(EMOJI_TEST, encoding='utf-8'):
        if '; fully-qualified' not in line or '#' not in line:
            continue
        left, right = line.split(';', 1)
        if not re.match(r'^[0-9A-F ]+$', left.strip()):
            continue
        cps = [int(x, 16) for x in left.strip().split()]
        if len(cps) < 2:
            continue
        if all(0x1F1E6 <= c <= 0x1F1FF for c in cps):
            continue  # 旗帜在 read_emoji 里处理
        name = right.split('#', 1)[1].split(' ', 1)[-1].strip()
        out.append((cps, name))
    return out

# ---------------------------------------------------------------- 主流程
def main():
    dry = '--dry' in sys.argv
    data = json.load(open(TAGS_JSON, encoding='utf-8'))
    roots = data['roots']

    def get_node(path):
        parts = path.split('/')
        node = roots.get(parts[0])
        if node is None:
            return None
        for p in parts[1:]:
            node = node.get('children', {}).get(p)
            if node is None:
                return None
        return node

    def set_cps(path, cps):
        """用给定码位集合整体替换节点 ranges（用于双模等需精确覆盖的）。"""
        node = get_node(path)
        if node is None:
            print(f'  [缺失节点] {path}')
            return 0
        node['ranges'] = []
        prev = None
        for cp in sorted(set(cps)):
            if prev is not None and cp == prev + 1:
                node['ranges'][-1][1] = cp
            else:
                node['ranges'].append([cp, cp])
            prev = cp
        return len(cps)

    def tag_cps(path, cps):
        node = get_node(path)
        if node is None:
            print(f'  [缺失节点] {path}')
            return 0
        cur = node.setdefault('ranges', [])
        allcp = set()
        for lo, hi in cur:
            allcp.update(range(lo, hi + 1))
        allcp.update(cps)
        node['ranges'] = []
        prev = None
        for cp in sorted(allcp):
            if prev is not None and cp == prev + 1:
                node['ranges'][-1][1] = cp
            else:
                node['ranges'].append([cp, cp])
            prev = cp
        return len(cps)

    singles, dual, flags = read_emoji()

    # 单码位 base emoji（去肤色）——全部按映射细化/补叶子标签（幂等）
    SKIN = {0x1F3FB, 0x1F3FC, 0x1F3FD, 0x1F3FE, 0x1F3FF}
    base = [e for e in singles if e[0] not in SKIN]
    print(f'单码位 fully-qualified: {len(singles)}，base（去肤色）: {len(base)}')
    print(f'双模码位: {len(dual)}，旗帜序列: {len(flags)}')

    stats = {}
    for cp, group, sub, name in base:
        paths = SUBGROUP_MAP.get(sub)
        if paths is None:
            stats.setdefault('未映射子组', []).append((sub, name))
            continue
        # 关键词微调
        refined = None
        for r, rep in KEYWORD_REFINE.get(sub, []):
            if r.search(name):
                refined = rep
                break
        if refined is not None:
            paths = refined
        for path in paths:
            tag_cps(path, [cp])
            stats.setdefault(path, 0)
            stats[path] += 1

    # ZWJ 序列（家庭/职业/发型/幻想等 3+ 码位）暂不打标：
    # 页面网格只支持单码位 ranges + 双码位 seqs（旗帜），ZWJ 序列显示不了，
    # 硬塞进 ranges 会把 ZWJ/VS16 这类格式符也当字符加进去（见 bug）。留待后续。

    # 非 RGI 但常见的表情字符（emoji-test 没有，手动补）
    EXTRA_SINGLES = {
        0x263B: ['人与身体/情绪表达', '人与身体/脸'],  # ☻ 黑脸微笑
    }
    for cp, paths in EXTRA_SINGLES.items():
        for path in paths:
            tag_cps(path, [cp])

    # 双模（整体替换，清掉旧污染的 ZWJ 组件）
    set_cps('emoji/emoji-text双模', sorted(dual))
    # emoji 根 = 全部 base emoji（含已打标的）
    base_emoji = [e[0] for e in singles if e[0] not in SKIN]
    tag_cps('emoji', base_emoji)
    # 旗帜序列（幂等：按前两个码位判重，不覆盖带名字的原版）
    flagnode = get_node('标志/旗帜/国旗')
    if flagnode is not None:
        cur_seqs = flagnode.setdefault('seqs', [])
        existing = {tuple(s[:2]) for s in cur_seqs}
        for fl in flags:
            if tuple(fl) not in existing:
                cur_seqs.append(fl)
                existing.add(tuple(fl))
        cur_seqs.sort(key=lambda s: tuple(s[:2]))

    print()
    print('=== 单码位细化统计（按标签）===')
    unmapped = stats.pop('未映射子组', [])
    for path, n in sorted(stats.items(), key=lambda x: -x[1]):
        print(f'  {path}: {n}')
    if unmapped:
        print(f'  未映射子组的 emoji: {len(unmapped)}')

    if not dry:
        json.dump(data, open(TAGS_JSON, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
        print('\n已写入 标签.json')

if __name__ == '__main__':
    main()

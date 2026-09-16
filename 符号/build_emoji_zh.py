#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""把 CLDR 俗名从名字表分层搬走，名字表补上官方英文名的**机械直译**。

用法::

    python build_emoji_zh.py --dry-run      # 只出报告 + 抽样，不落盘
    python build_emoji_zh.py                # 落盘

背景（`符号/docs/任务/20260914-待办27与29的设计与交接.md` 第二节）：

`官方名直译名.js` 是**名字表**，只该装官方英文名的机械直译。但它里面混着
一千多条 CLDR 俗名（`GRINNING FACE → 嘿嘿`、`FACE PALM → 捂脸`）——
那是**俗名**不是译名。按分层原则，俗名该回人工层（`符号富化数据.js`），
名字表补直译。

做法：

1. 认定范围（见 `find_scope`，**可重跑**）：`SCOPE_RANGES` 范围内所有有 CLDR 俗名的
   单码位，且名字表当前值是「CLDR 兜底值」或「本脚本产出的直译」两种之一。
   人工改过的名字不动。
2. 给这些码位生成机械直译（`emoji词表.py` 的词 + `translate` 的结构规则），写回名字表。
3. 把 CLDR 俗名搬进符号数据当 `alias`：
   · **直译 == 俗名**          → 什么都不搬。这条留在名字表里就是对的（那个值
                                既是俗名、也是正确的机械直译，两者恰好同字），
                                再搬一份当 alias 只会让详情区的别名行跟主名重复。
   · 已有条目且俗名已在名/别名里 → 什么都不做（名字表换直译即可）
   · 已有条目但没收录         → 往该条第一个组补一个 alias
   · 符号数据里完全没有       → 新建条目，alias 落**条目级**（= 全局别名）

⚠️ 顺带的行为变化（与待办 27 同源，已知并接受）：新建条目的字符，改名落盘从
`官方名直译名.js` 改到 `符号富化数据.js`。
"""
import json
import os
import re
import sys
from collections import Counter

BASE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE)
from datatool import append_symbols, load_symbols, load_zh, read_data, save_zh, update_symbols
from emoji词表 import EMOJI_PHRASE, EMOJI_WORD, EXTRA_ALIASES, translate
CLDR_ANNOTATIONS = os.path.join(BASE, '参考资料', 'annotations-zh.json')
# 认定范围：这两段里「名字表的值 == CLDR 注解」的单码位名，必然是 CLDR 兜底灌进来的
#   U+2600-27BF  杂项符号/装饰符号（☎ ☀ ♠ ♈ …）——混着标准中文名，靠下面的翻译质量把关
#   U+1F000+     补充符号/表情区（😀 🍓 🚒 …）——基本全是俗名
SCOPE_RANGES = ((0x2600, 0x27BF), (0x1F000, 0x1FFFF))

# 机械类标签不作组键（数据说明 §三）
MECHANICAL_TAGS = {'文字系统', '官方分类', '区块', 'emoji（绘文字）'}




def cldr_single_codepoint(path=CLDR_ANNOTATIONS):
    """→ {码位: CLDR 俗名}，只收单码位（剥变体选择符）。"""
    data = json.load(open(path, encoding='utf-8'))
    out = {}
    for char, info in data['annotations']['annotations'].items():
        cps = [ord(c) for c in char if ord(c) != 0xFE0F]
        if len(cps) == 1 and info.get('tts'):
            out[cps[0]] = info['tts'][0]
    return out


# ==================== 三步 ====================

def in_scope(cp):
    return any(lo <= cp <= hi for lo, hi in SCOPE_RANGES)


def find_scope():
    """→ [(码位, 官方英文名, CLDR 俗名)]。

    候选 = 范围内所有**有 CLDR 俗名**的单码位；再按名字表当前值放行两类：

      · `值 == CLDR 俗名`   —— 还是当年 CLDR 兜底灌进来的那个值，要换直译
      · `值 == 本脚本的直译` —— 已经换过了。**这一条是为了可重跑**：光看
                              「值 == CLDR 俗名」的话，搬完之后脚本就再也认不出
                              这些码位，重跑等于失效。

    两条都不满足的（人工改过的名字）一律不动。
    """
    zh = load_zh()['names']
    names = read_data(os.path.join(BASE, 'unicode官方名.js'), 'UNICODE_NAMES_DATA')['names']
    cldr = cldr_single_codepoint()
    scope = []
    for cp, cldr_name in sorted(cldr.items()):
        if not in_scope(cp):
            continue
        cur = zh.get(str(cp))
        if cur is None:
            continue
        en = names.get(str(cp), '')
        if cur == cldr_name or cur == translate(en.split(), []):
            scope.append((cp, en, cldr_name))
    return scope


def build_translations(scope):
    """→ ({码位: 直译}, 未收录词计数)。

    译出来是空串的话**保留 CLDR 值**：冠词 THE / A 在词表里映射成空串（去冠词用），
    万一某个官方名整串只有冠词，直译就会是空的。名字表写空名是静默的数据损坏
    （`datatool.check_all` 只校验键合法，不校验值非空），所以在这里兜住并计数。
    """
    translations = {}
    unknown = Counter()
    empty = []
    for cp, en, cldr_name in scope:
        bag = []
        zh = translate(en.split(), bag)
        if not zh.strip():
            zh = cldr_name
            empty.append(cp)
        translations[cp] = zh
        unknown.update(bag)
    if empty:
        print('  ⚠ 直译落空、保留原值的：%d 条 %s'
              % (len(empty), ' '.join('U+%04X' % cp for cp in empty[:10])))
    return translations, unknown


def apply_to_name_table(translations):
    """把直译写回 官方名直译名.js（只改这些键）。→ 改动条数。"""
    d = load_zh()
    changed = 0
    for cp, zh in translations.items():
        k = str(cp)
        if d['names'].get(k) != zh:
            d['names'][k] = zh
            changed += 1
    if changed:
        save_zh(d)
    return changed


def entry_values(entry):
    """条目里现有的全部名字与别名（用来判断俗名是否已收录）。"""
    out = list(entry.get('alias') or [])
    if entry.get('name'):
        out.append(entry['name'])
    for group in (entry.get('groups') or {}).values():
        out += group.get('alias') or []
        if group.get('name'):
            out.append(group['name'])
    return out


def has_display_name(entry):
    """这条条目自己有没有名字（条目级或任一组的）。

    没有的话，页面显示名走 `官方名直译名.js` 兜底 —— 那正是别名行会撞上主名的那批。
    """
    if entry.get('name'):
        return True
    return any(g.get('name') for g in (entry.get('groups') or {}).values())


def covered(colloquial, entry, new_name):
    """俗名是不是已经被某个**会显示出来的**名字包含（子串）了。

    包含就别再挂别名：搜索是子串匹配，打「融化」本来就能命中主名「融化脸」，
    再挂一条同名别名只会让详情区的别名行跟主名重复。（用户 2026-09-14 手工删掉
    🫠 的别名「融化」时给的理由，把它固化成规则。）
    """
    names = []
    if entry:
        if entry.get('name'):
            names.append(entry['name'])
        names += [g['name'] for g in (entry.get('groups') or {}).values() if g.get('name')]
    if not names:
        names.append(new_name)
    return any(colloquial in name for name in names)


def plan_colloquial(scope, translations):
    """算俗名怎么搬、不落盘。→ (直译同字不搬, 已收录, 补 alias, 新建, 要删的撞名别名)。

    落盘和报告**共用这一个函数**，否则 dry-run 的拆分是拿「范围 − 新建」硬减出来的，
    会把「直译==俗名」那批算进「已有条目」，数字与真实动作对不上。
    """
    by_char = {o['char']: o for o in load_symbols()}
    same, already, patch, fresh, strip, skipcov = 0, 0, {}, [], {}, 0

    for cp, _, name in scope:
        ch = chr(cp)
        entry = by_char.get(ch)
        new_name = translations.get(cp)
        extras = EXTRA_ALIASES.get(ch, [])
        # 名字表的值被换成直译后，显示名就跟着换。若这个新显示名跟本条**既有**的
        # 某条别名同字，别名行会把主名再念一遍（上一轮 testing 抓到 8 例）。
        # 别名本来是当搜索同义词的，如今它成了主名，名字表通道本来就搜得到，留着纯冗余。
        if entry is not None and not has_display_name(entry) and new_name in entry_values(entry):
            strip[ch] = new_name

        # 每条只归一类，六个计数加起来正好是范围条数
        if new_name == name:
            same += 1                              # 直译与俗名同字，名字表那条不用换
        elif entry is None:
            if covered(name, None, new_name):
                skipcov += 1                       # 俗名已被名字表的值包含，没必要新建条目
            else:
                fresh.append((cp, [name]))
        elif name in entry_values(entry):
            already += 1
        elif covered(name, entry, new_name):
            skipcov += 1                           # 俗名已被显示名包含（子串），挂别名是冗余
        else:
            patch[ch] = [name]

        # 人工补充别名（EXTRA_ALIASES）单独叠加，不占用上面那一个归类
        if extras and entry is not None:
            patch.setdefault(ch, [])
            patch[ch] = patch[ch] + extras

    for ch, wanted in list(patch.items()):
        have = entry_values(by_char[ch])
        kept = [a for a in wanted if a not in have and a != translations.get(ord(ch))]
        if kept:
            patch[ch] = kept
        else:
            del patch[ch]
    return same, already, patch, fresh, strip, skipcov


def move_colloquial(patch, fresh, strip):
    """按计划把俗名搬进符号数据。→ (补 alias 数, 新建条目数)。"""

    def fix_entry(entry):
        changed = False
        # 1) 删掉与被换掉的名字同字的既有别名（不删就没东西可删、也别删成空壳）
        clash = strip.get(entry['char'])
        if clash:
            # 别名既可能挂在条目级、也可能挂在某个组里，两处都要查
            # （v1.39.1 把无名组的别名搬到了条目级，只查组会漏掉）
            at_entry = entry.get('alias') or []
            if clash in at_entry:
                kept = [a for a in at_entry if a != clash]
                if kept:
                    entry['alias'] = kept
                else:
                    entry.pop('alias', None)
                changed = True
            groups = entry.get('groups') or {}
            for key in list(groups):
                group = dict(groups[key])
                aliases = group.get('alias') or []
                kept = [a for a in aliases if a != clash]
                if len(kept) == len(aliases):
                    continue
                if kept:
                    group['alias'] = kept
                elif group.get('name'):
                    group.pop('alias', None)       # 组名还在，别名删光就行
                else:
                    # 组里就这一条别名，删掉就空了。把它提成**组语境名**：
                    # 显示效果完全一样（名字表兜底值本来就是它），但组不再是空壳。
                    # 例：💃 `{"通用":{"alias":["舞者"]}}` → `{"通用":{"name":"舞者"}}`
                    group.pop('alias', None)
                    group['name'] = clash
                groups[key] = group
                changed = True
        # 2) 补别名（俗名 + 人工补充的）
        wanted = patch.get(entry['char'])
        if wanted:
            # 别名一律落**条目级**（= 全局别名）。别名是搜索键，搜索本来就是全局的；
            # 挂进某个组只会在别的标签下看不见它。组里只放**语境名**——
            # 「有组 = 有语境名」是硬规则（v1.39.2 把 3804 条组内别名全提到了条目级）。
            have = entry.get('alias') or []
            add = [a for a in wanted if a not in have]
            if add:
                entry['alias'] = list(have) + add
                changed = True
        return changed

    patched = update_symbols(fix_entry)

    # 新建条目一律把别名写**条目级**（过去挂"最深语义标签"下，会建出只装别名的无名组）
    entries = [{'char': chr(cp), 'alias': aliases} for cp, aliases in fresh]
    if entries:
        append_symbols(entries)

    return patched, len(entries)


def main(argv):
    dry = '--dry-run' in argv
    scope = find_scope()
    cldr = {cp: c for cp, _, c in scope}
    print('== 第 1 步：认定范围 ==')
    print('  名字表的值 == CLDR 俗名，且在 %s：%d 条'
          % (' + '.join('U+%X-%X' % r for r in SCOPE_RANGES), len(scope)))

    translations, unknown = build_translations(scope)
    print('== 第 2 步：机械直译 ==')
    print('  生成 %d 条；未收录词 %d 个（共 %d 词次）'
          % (len(translations), len(unknown), sum(unknown.values())))
    if unknown:
        print('  词频前 40：')
        for w, n in unknown.most_common(40):
            print('    %-24s %d' % (w, n))

    same, already, patch, fresh, strip, skipcov = plan_colloquial(scope, translations)
    print('== 第 3 步：俗名搬移（共 %d 条）==' % len(scope))
    print('  直译==俗名（不搬）：%d；俗名已收录：%d；俗名被主名包含（不挂）：%d；'
          '补 alias：%d；新建条目：%d；删撞名别名：%d'
          % (same, already, skipcov, len(patch), len(fresh), len(strip)))

    print('== 抽样（英文名 → 直译 ／ CLDR 俗名）==')
    step = max(1, len(scope) // 30)
    for cp, en, name in scope[::step][:30]:
        print('  %s U+%04X  %-46s → %-20s (CLDR %s)' % (chr(cp), cp, en, translations[cp], name))

    if dry:
        print('--dry-run：未落盘')
        return 0

    print('  名字表换直译：%d 条' % apply_to_name_table(translations))
    move_colloquial(patch, fresh, strip)
    print('  落盘完成：补 alias %d、新建条目 %d、删撞名别名 %d'
          % (len(patch), len(fresh), len(strip)))
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))

# -*- coding: utf-8 -*-
"""体检：ENRICHED_SYMBOLS 里的「组键」是否仍可命中标签语境。

背景（见 数据说明.md 第三节）：
  组键（groups 的键）必须是**现存标签名**。若某组键指向的标签并不包含该符号
  （标签被改名/删除，或符号没打这个标签），该语境名就永远显示不出来，页面会
  静默回退到全局名——不报错，很难发现。本脚本把这类"不可达组键"列出来。

判定口径（与页面一致）：
  字符 cp 在标签 T 下可见 ⇔ T（或其祖先）的 ranges/seqs 含 cp。
  因此某组键 K 对 cp 可达 ⇔ K 是"含 cp 的节点名"或"这些节点的祖先名"之一。

用法： python 符号/check_group_keys.py
  退出码 0 = 无问题；1 = 存在不可达组键。
"""
import json
import os
import sys
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from datatool import read_data

TAGS = os.path.join(HERE, '标签.js')
ENRICHED_SYMBOLS = os.path.join(HERE, '符号富化数据.js')


def collect_nodes(d, trail=()):
    """收集所有含 ranges 的节点 → [(trail, node)]，trail 为该节点名及其祖先名。"""
    out = []
    if isinstance(d, dict):
        if d.get('ranges'):
            out.append((trail, d))
        for k, v in (d.get('children') or {}).items():
            out.extend(collect_nodes(v, trail + (k,)))
    return out


def seq_cps(s):
    """seqs 条目 → 纯码位数组（尾部 zh/en 字符串剥掉，与 符号.js 的 seqCps 同构）。"""
    end = len(s)
    while end > 0 and isinstance(s[end - 1], str):
        end -= 1
    return s[:end]


def norm_seq(cps):
    """序列规范化：去掉 VS16/VS15（U+FE0F/U+FE0E）。与 符号.js 的 resolveSeq 口径一致。"""
    return tuple(c for c in cps if c not in (0xFE0F, 0xFE0E))


def main():
    tag = read_data(TAGS, 'TAGS_DATA')
    nodes = []
    for rk, rv in tag['roots'].items():
        nodes.extend(collect_nodes(rv, (rk,)))

    # 序列（ZWJ / 旗帜）归属：整串码位精确比对（容忍 VS 有无）→ 持有它的节点 trail 列表
    seq_trails = defaultdict(list)

    def collect_seqs(d, trail=()):
        for k, v in (d.get('children') or {}).items():
            for s in (v.get('seqs') or []):
                seq_trails[norm_seq(seq_cps(s))].append(trail + (k,))
            collect_seqs(v, trail + (k,))
    for rk, rv in tag['roots'].items():
        for s in (rv.get('seqs') or []):
            seq_trails[norm_seq(seq_cps(s))].append((rk,))
        collect_seqs(rv, (rk,))

    def reachable_names(member):
        """选中该成员时可能出现的 selectedTag.name 集合。
        member 为 int（单码位）或码位元组（序列）。"""
        res = set()
        if isinstance(member, int):
            for trail, node in nodes:
                for a, b in node['ranges']:
                    if a <= member <= b:
                        res |= set(trail)      # 节点自身名 + 全部祖先名
                        break
        else:
            for trail in seq_trails.get(norm_seq(member), []):
                res |= set(trail)              # 持有该序列的节点名 + 全部祖先名
        return res

    bad = defaultdict(list)

    total = 0
    for ln in open(ENRICHED_SYMBOLS, encoding='utf-8'):
        s = ln.strip()
        if not s.startswith('{'):
            continue
        try:
            o = json.loads(s.rstrip(','))
        except Exception:
            continue
        ch = o.get('char', '')
        if not ch:
            continue
        total += 1
        ok = reachable_names(ord(ch) if len(ch) == 1 else tuple(map(ord, ch)))
        for k in (o.get('groups') or {}):
            if k in ok:
                continue
            bad[k].append(ch)

    print('检查条目 %d 条' % total)
    if not bad:
        print('\n[OK] 无可达性问题：所有组键都能命中标签语境。')
        return 0
    print('\n[问题] 不可达组键 %d 种 / %d 处（值为键，行内为受影响字符）：' % (
        len(bad), sum(len(v) for v in bad.values())))
    for k, chs in sorted(bad.items(), key=lambda x: -len(x[1])):
        print('  %-18s %3d  %s%s' % (k, len(chs), ' '.join(chs[:8]),
                                     ' …' if len(chs) > 8 else ''))
    print('\n修法二选一：① 把组键改成该字符真实的标签名；② 给这些字符补打该标签。')
    return 1


if __name__ == '__main__':
    sys.exit(main())

# -*- coding: utf-8 -*-
"""体检：SYMBOLS 里的「组键」是否仍可命中标签语境。

背景（见 数据说明.md 第三节）：
  组键（groups 的键）必须是**现存标签名**。若某组键指向的标签并不包含该符号
  （标签被改名/删除，或符号没打这个标签），该语境名就永远显示不出来，页面会
  静默回退到全局名——不报错，很难发现。本脚本把这类"不可达组键"列出来。

判定口径（与页面一致）：
  字符 cp 在标签 T 下可见 ⇔ T（或其祖先）的 ranges/seqs 含 cp。
  因此某组键 K 对 cp 可达 ⇔ K 是"含 cp 的节点名"或"这些节点的祖先名"之一。

用法： python 符号/check_group_keys.py
  退出码 0 = 无问题；1 = 存在不可达组键（`编辑` 属兜底键，单列为提示）。
"""
import json
import os
import sys
from collections import Counter, defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
TAGS = os.path.join(HERE, '标签.json')
SYMBOLS = os.path.join(HERE, '符号数据.js')
FALLBACK_KEY = '编辑'   # 新建条目无可用标签名时的兜底容器键


def collect_nodes(d, trail=()):
    """收集所有含 ranges 的节点 → [(trail, node)]，trail 为该节点名及其祖先名。"""
    out = []
    if isinstance(d, dict):
        if d.get('ranges'):
            out.append((trail, d))
        for k, v in (d.get('children') or {}).items():
            out.extend(collect_nodes(v, trail + (k,)))
    return out


def main():
    tag = json.load(open(TAGS, encoding='utf-8'))
    nodes = []
    for rk, rv in tag['roots'].items():
        nodes.extend(collect_nodes(rv, (rk,)))

    def reachable_names(cp):
        """选中该字符时可能出现的 selectedTag.name 集合。"""
        res = set()
        for trail, node in nodes:
            for a, b in node['ranges']:
                if a <= cp <= b:
                    res |= set(trail)      # 节点自身名 + 全部祖先名
                    break
        return res

    bad = defaultdict(list)
    fallback = Counter()
    total = 0
    for ln in open(SYMBOLS, encoding='utf-8'):
        s = ln.strip()
        if not s.startswith('{'):
            continue
        try:
            o = json.loads(s.rstrip(','))
        except Exception:
            continue
        ch = o.get('char', '')
        if len(ch) != 1:          # 多码位序列（ZWJ/旗帜）另论，此处不检查
            continue
        total += 1
        ok = reachable_names(ord(ch))
        for k in (o.get('groups') or {}):
            if k in ok:
                continue
            if k == FALLBACK_KEY:
                fallback[ch] += 1
            else:
                bad[k].append(ch)

    print('检查条目 %d 条' % total)
    if fallback:
        print('\n[提示] 兜底键「%s」：%d 条（该字符无任何语义标签，语境名本就不适用，无需处理）'
              % (FALLBACK_KEY, sum(fallback.values())))
        print('      例：' + ' '.join(sorted(fallback)[:12]))
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

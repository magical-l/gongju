# -*- coding: utf-8 -*-
"""两个参考文件各覆盖什么范围。"""
import re, collections, io

print('=== Unikemet.txt（Unikemet-18.0.0） ===')
cps = set()
tags = collections.Counter()
nline = 0
for line in io.open('符号/参考资料/Unikemet.txt', encoding='utf-8'):
    if line.startswith('U+'):
        nline += 1
        cp, tag, _ = line.rstrip('\n').split('\t', 2)
        cps.add(int(cp[2:], 16))
        tags[tag] += 1
print('  条目行 %d，覆盖码位 %d' % (nline, len(cps)))
lo, hi = min(cps), max(cps)
print('  码位范围 U+%X – U+%X' % (lo, hi))
blocks = collections.Counter()
for c in cps:
    blocks['U+%X000 段' % (c >> 12)] += 1
print('  按 4K 段:', dict(sorted(blocks.items())))
print('  字段:', dict(tags.most_common()))

print()
print('=== NamesList.txt（NamesList-18.0.0） ===')
tot = ann = 0
blocks = collections.Counter()
cur = None
for line in io.open('符号/参考资料/NamesList.txt', encoding='utf-8', errors='replace'):
    m = re.match(r'^([0-9A-F]{4,6})\t(.+)$', line.rstrip('\n'))
    if m:
        tot += 1
        cur = int(m.group(1), 16)
        blocks['U+%02X00 段' % (cur >> 8)] += 1
        continue
    if cur is not None and line.startswith('\t') and line[1] in '*=%x~':
        ann += 1
        cur = None
print('  有条目的码位 %d（遍及全 Unicode 已分配字符）' % tot)
print('  带注解条目 %d' % ann)
print('  U+13000 段（埃及）条目数:', blocks.get('U+1300 段'))
seg = {k: v for k, v in blocks.items() if k.startswith('U+13')}
print('  U+13xx 各段:', dict(sorted(seg.items())))

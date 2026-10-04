# -*- coding: utf-8 -*-
"""盘子的实用口径：页面真显示得出来的字符（有直译名 或 在机械轴区块里）才算。"""
import io, re, sys, collections

sys.path.insert(0, '符号')
from datatool import load_zh, load_symbols

zh = load_zh()['names']
disp = {int(k) for k in zh if '-' not in k}          # 有直译名 = 显示得出来
enr = {o['char'] for o in load_symbols() if len(o['char']) == 1}
enr_cp = {ord(c) for c in enr}
showable = disp | enr_cp
print('有直译名（显示得出来）的单码位：', len(disp))
print('富化层有名字/别名的条目：', len(enr_cp))

formal, alias, note = {}, {}, {}
cur = None
for line in io.open('符号/参考资料/NamesList.txt', encoding='utf-8', errors='replace'):
    m = re.match(r'^([0-9A-F]{4,6})\t(.+)$', line.rstrip('\n'))
    if m:
        cur = int(m.group(1), 16)
        continue
    if cur is None:
        continue
    if line.startswith('\t%'):
        formal.setdefault(cur, []).append(line.strip()[1:].strip())
    elif line.startswith('\t='):
        alias.setdefault(cur, []).append(line.strip()[1:].strip())
    elif line.startswith('\t*'):
        note.setdefault(cur, []).append(line.strip()[1:].strip())
    elif not line.startswith('\t'):
        cur = None

print()
print('%-14s %8s %8s' % ('NamesList 字段', '全库', '其中可显示'))
for name, d in (('% 正式更正', formal), ('= 别名', alias), ('* 注解', note)):
    print('%-14s %8d %8d' % (name, len(d), len(set(d) & showable)))

# 富化层已有主名的
have = {ord(o['char']) for o in load_symbols() if len(o['char']) == 1 and o.get('name')}
print()
print('其中「富化层已有主名」的：', len(have))
print('  % 里还没主名的：', len((set(formal) & showable) - have))
print('  = 里还没主名也没这条别名的：',
      sum(1 for c in (set(alias) & showable) - have
          if not any(a in (load_symbols() and []) for a in [])))
print()
print('--- % 40 条全列（正式更正别名，量小价值高） ---')
sym = {ord(o['char']): o for o in load_symbols() if len(o['char']) == 1}
zh_d = {int(k): v for k, v in zh.items() if '-' not in k}
for c in sorted(formal):
    o = sym.get(c)
    cur_name = (o.get('name') or zh_d.get(c) or '(无名)') if o or c in zh_d else '(无名)'
    print('  %05X %-22s 现名=%-14s %% = %s' % (c, chr(c), cur_name, ' / '.join(formal[c])))

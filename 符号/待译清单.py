# -*- coding: utf-8 -*-
"""刷新 符号/待译清单.json —— 符号页「还带未译英文词」的名字清单。

清单 = 中文名.json 里仍含「词表未收录英文词」的条目，每条形如
    {cp: <码位键>, name: <当前中文名>, block: [卡住的英文词…]}
某个名字一旦译干净（或挡路的词进了 KEEP），下次跑就会自动除名，所以不需要手工划掉。

挡路词的判定见 符号/译名词表.py 的三个结构（WORD / KEEP / PHRASE）：
词表命中就算「已处理」，既不在 WORD/PHRASE 里、也不在 KEEP 里的英文词才算挡路。
匹配大小写不敏感（词表一律大写），单个字母不算挡路词（编号如 B155、A715 因此不挡路）。

用法：
    python 符号/待译清单.py             # 刷新清单并打印统计
    python 符号/待译清单.py --top 50    # 顺带列出挡住最多的 50 个词

只依赖项目内路径，可在任何目录下执行。
"""
import io
import importlib.util
import json
import os
import re
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

BASE = os.path.dirname(os.path.abspath(__file__))
ZM = os.path.join(BASE, '中文名.json')
WL = os.path.join(BASE, '待译清单.json')
TOP = 20
if '--top' in sys.argv:
    TOP = int(sys.argv[sys.argv.index('--top') + 1])


def load_words():
    """加载 符号/译名词表.py，返回 WORD / KEEP / PHRASE"""
    path = os.path.join(BASE, '译名词表.py')
    spec = importlib.util.spec_from_file_location('译名词表', path)
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


def main():
    w = load_words()
    # 短语里的词也算「已处理」，这样 WITH 尾巴才不会被当成挡路
    phw = set(x for ph in w.PHRASE for x in ph.split())
    known = set(w.WORD) | set(w.KEEP) | phw | set(w.PHRASE)

    d = json.load(open(ZM, encoding='utf-8'))
    prev = {}
    if os.path.exists(WL):
        prev = {it['cp']: it for it in json.load(open(WL, encoding='utf-8')).get('items', [])}

    items, done = [], 0
    for cp, name in d['names'].items():
        miss = sorted({t.upper() for t in re.findall(r'[A-Za-z]{2,}', name) if t.upper() not in known})
        if miss:
            items.append({'cp': cp, 'name': name, 'block': miss, 'new': cp not in prev})
        elif cp in prev:
            done += 1

    json.dump({'note': '待译清单：当前中文名里还含未收录英文词的条目。由 符号/待译清单.py 生成，'
                       '译干净或词进 KEEP 后会自动除名。',
               'count': len(items), 'items': items},
              open(WL, 'w', encoding='utf-8', newline='\n'), ensure_ascii=False, indent=1)

    from collections import Counter
    c = Counter(t for it in items for t in it['block'])
    print('清单：%d 条待译（本轮新出现 %d 条，已除名 %d 条）'
          % (len(items), sum(1 for it in items if it['new']), done))
    print('词表：WORD %d 词 / PHRASE %d 短语 / KEEP %d 词' % (len(w.WORD), len(w.PHRASE), len(w.KEEP)))
    print('挡住最多的词 top %d（共 %d 个不同的挡路词）：' % (TOP, len(c)))
    for tok, n in c.most_common(TOP):
        print('   %5d  %s' % (n, tok))


if __name__ == '__main__':
    main()

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""从 OpenCC 的 TSCharacters.txt 生成 繁简表.js（繁体字 → 简体字 单字映射）。

用法::

    python build_zh_variants.py

数据源：参考资料/TSCharacters.txt
    Open Chinese Convert (OpenCC) 的繁→简单字表，取自
    https://github.com/BYVoid/OpenCC/blob/master/data/dictionary/TSCharacters.txt
    格式：`key<TAB>value(s)`，value 用空格分隔多个候选（本脚本取第一个）。

License: OpenCC 是 Apache-2.0（源文件头亦标注 `License: Apache-2.0`）。

设计说明：
    - 本表是**纯 繁→简 单向**。反向（简→繁）按设计不做——一个简体字常对应多个繁体字
      （如 干 → 乾/幹/干），一对多有歧义，无法给出确定映射。
    - 搜索时把查询词与内容文本都折到简体，一次比较即可同时覆盖
      「繁体查询搜简体内容」与「简体查询搜繁体内容」。
    - 剔掉 `key == value[0]` 的空转条目（自己映射自己，如 㑮→㑮）。

输出结构（繁简表.js）::

    window.ZH_VARIANTS_DATA = {
      "_v": "OpenCC",
      "map": { "乾": "干", "車": "车", ... }
    };

源文件更新后重跑本脚本即可覆盖产出。
"""
import os
import sys

BASE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE)
from datatool import dump_data, write_text

SRC = os.path.join(BASE, '参考资料', 'TSCharacters.txt')
OUT = os.path.join(BASE, '繁简表.js')


def main():
    raw_lines = 0
    comments = 0
    entries = 0
    noop = 0
    mapping = {}

    with open(SRC, encoding='utf-8') as f:
        for line in f:
            raw_lines += 1
            line = line.rstrip('\n')
            if not line.strip():
                continue
            if line.startswith('#'):
                comments += 1
                continue
            key, _, value = line.partition('\t')
            values = value.split()
            if not values:
                continue                      # 无候选值的坏行，跳过
            entries += 1
            first = values[0]
            if key == first:
                noop += 1                     # 空转条目：自己映射自己
                continue
            mapping[key] = first

    data = {'_v': 'OpenCC', 'map': mapping}
    write_text(OUT, dump_data(data, 'ZH_VARIANTS_DATA'))

    size = os.path.getsize(OUT)
    print('读入行数: %d（注释 %d）' % (raw_lines, comments))
    print('条目行: %d' % entries)
    print('剔掉空转条数: %d' % noop)
    print('最终条目数: %d' % len(mapping))
    print('产出文件字节数: %d -> %s' % (size, OUT))


if __name__ == '__main__':
    main()

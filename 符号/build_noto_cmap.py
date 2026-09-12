#!/usr/bin/env python3
"""生成 noto-cmap.js：Noto Sans Symbols 2 覆盖的码位区间列表（升序、相邻合并）"""
import os
import sys

from fontTools.ttLib import TTFont

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from datatool import dump_data, write_text

FONT_PATH = os.path.join(HERE, '..', 'lib', 'fonts', 'NotoSansSymbols2-Regular.ttf')
OUT_PATH = os.path.join(HERE, 'noto-cmap.js')


def build_ranges(cps):
    """升序码位列表 → 相邻合并的区间列表 [[lo,hi],...]"""
    if not cps:
        return []
    ranges = []
    lo = hi = cps[0]
    for cp in cps[1:]:
        if cp == hi + 1:
            hi = cp
        else:
            ranges.append([lo, hi])
            lo = hi = cp
    ranges.append([lo, hi])
    return ranges


def main():
    font = TTFont(FONT_PATH)
    cmap = font.getBestCmap()
    cps = sorted(cmap.keys())
    ranges = build_ranges(cps)
    data = {'_v': 1, 'count': len(cps), 'ranges': ranges}
    write_text(OUT_PATH, dump_data(data, 'NOTO_CMAP_DATA'))
    print(f'{len(cps)} 码位 -> {len(ranges)} 区间 -> {OUT_PATH}')


if __name__ == '__main__':
    main()

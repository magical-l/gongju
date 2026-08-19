#!/usr/bin/env python3
"""生成 noto-cmap.json：Noto Sans Symbols 2 覆盖的码位区间列表（升序、相邻合并）"""
import json
import os

from fontTools.ttLib import TTFont

HERE = os.path.dirname(os.path.abspath(__file__))
FONT_PATH = os.path.join(HERE, '..', 'lib', 'fonts', 'NotoSansSymbols2-Regular.ttf')
OUT_PATH = os.path.join(HERE, 'noto-cmap.json')


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
    with open(OUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f'{len(cps)} 码位 -> {len(ranges)} 区间 -> {OUT_PATH}')


if __name__ == '__main__':
    main()

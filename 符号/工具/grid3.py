# -*- coding: utf-8 -*-
"""按码表页自身的格线定位字形区（不猜 pitch）。"""
import collections, statistics
import pymupdf, numpy as np
from PIL import Image
from scipy import ndimage as ND
import chartlib as CL
import chartgrid as G

_docs = {}
_pages = {}

def _doc(blk):
    if blk not in _docs:
        _docs[blk] = pymupdf.open(CL.fetch(blk))
    return _docs[blk]

def _lines(page):
    """只保留**长**格线（长度 > minlen），短的是字形笔画。"""
    minlen = 90.0
    vs, hs = {}, {}
    def bump(d, k, a, b):
        lo, hi = (a, b) if a <= b else (b, a)
        if k in d:
            d[k] = (min(d[k][0], lo), max(d[k][1], hi))
        else:
            d[k] = (lo, hi)
    for dr in page.get_drawings():
        for it in dr['items']:
            if it[0] == 'l':
                p, q = it[1], it[2]
                if abs(p.x - q.x) < 0.4 and abs(p.y - q.y) >= minlen:
                    bump(vs, round((p.x + q.x) / 2, 1), p.y, q.y)
                elif abs(p.y - q.y) < 0.4 and abs(p.x - q.x) >= minlen:
                    bump(hs, round((p.y + q.y) / 2, 1), p.x, q.x)
            elif it[0] == 're':
                r = it[1]
                if r.height >= minlen:
                    bump(vs, round(r.x0, 1), r.y0, r.y1); bump(vs, round(r.x1, 1), r.y0, r.y1)
                if r.width >= minlen:
                    bump(hs, round(r.y0, 1), r.x0, r.x1); bump(hs, round(r.y1, 1), r.x0, r.x1)
    return sorted(vs), sorted(hs)

def _pageinfo(key, page):
    if key not in _pages:
        labs = G.page_labels(page)
        vx, hy = _lines(page)
        _pages[key] = (labs, vx, hy)
    return _pages[key]

def glyph_area(cp):
    """返回 (page, pymupdf.Rect) —— 格子内、标签上方的字形区。"""
    lo, hi, nm = CL.block_of(cp)
    doc = _doc(lo)
    # 网格页优先（标签最多的那页），它才有整齐的格子
    best, bestn = 0, -1
    for pi in range(len(doc)):
        n = len(_pageinfo((lo, pi), doc[pi])[0])
        if n > bestn:
            best, bestn = pi, n
    for pi in [best] + [i for i in range(len(doc)) if i != best]:
        page = doc[pi]
        labs, vx, hy = _pageinfo((lo, pi), page)
        if not labs:
            continue
        # 排除区块标题行（页首那一行，放的是区块起止码位，不是格子）
        _tops = min(round(rr.y0, 0) for _, rr in labs)
        for c, r in labs:
            if c != cp or round(r.y0, 0) == _tops:
                continue
            lefts = [x for x in vx if -40 < x - r.x0 < 1]
            rights = [x for x in vx if 1 < x - r.x0 < 40]
            tops = [y for y in hy if -45 < y - r.y0 < -2]
            bots = [y for y in hy if 2 < y - r.y0 < 45]
            if not (lefts and rights and tops and bots):
                continue
            L, Rr = max(lefts), min(rights)
            T, B = max(tops), min(bots)
            if Rr - L > 60 or B - T > 60 or Rr - L < 5 or B - T < 8:
                continue
            # 字形区：格内、标签顶边之上
            return page, pymupdf.Rect(L + 1.6, T + 1.6, Rr - 1.6, r.y0 - 1.6)
    return None, None

def bitmap(cp, zoom=10, thr=170):
    page, rect = glyph_area(cp)
    if page is None:
        return None
    pix = page.get_pixmap(matrix=pymupdf.Matrix(zoom, zoom), clip=rect,
                          colorspace=pymupdf.csGRAY)
    a = np.array(Image.frombytes('L', (pix.width, pix.height), pix.samples)) < thr
    return a

def clean(a):
    """扔贴边碎屑 + 去掉细长格线残段。"""
    if a.size == 0:
        return a
    lab, n = ND.label(a)
    if n == 0:
        return a
    keep = np.zeros(n + 1, bool)
    sizes = ND.sum(a, lab, range(1, n + 1))
    big = sizes.max()
    for i in range(1, n + 1):
        ys, xs = np.where(lab == i)
        h, w = ys.max() - ys.min() + 1, xs.max() - xs.min() + 1
        touches = ys.min() == 0 or xs.min() == 0 or ys.max() == a.shape[0]-1 or xs.max() == a.shape[1]-1
        thin_full = ((h > 0.85 * a.shape[0] and w <= max(8, 0.03 * a.shape[1])) or
                     (w > 0.85 * a.shape[1] and h <= max(8, 0.03 * a.shape[0])))
        if thin_full:
            continue
        if touches and sizes[i-1] < 0.25 * big:
            continue
        keep[i] = True
    return keep[lab]

def tight(a, m=1):
    ys, xs = np.where(a)
    if len(ys) == 0:
        return a
    return a[max(0, ys.min()-m):ys.max()+1+m, max(0, xs.min()-m):xs.max()+1+m]

def get(cp, **kw):
    a = bitmap(cp, **kw)
    if a is None:
        return None
    a = clean(a)
    return tight(a)

def ink_centroid(a):
    ys, xs = np.where(a)
    if len(ys) < 10:
        return None
    return (xs.mean() / (a.shape[1] - 1) - 0.5, ys.mean() / (a.shape[0] - 1) - 0.5, a.mean())

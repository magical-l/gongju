# -*- coding: utf-8 -*-
"""从 Unicode 官方码表 PDF 定位格子并取字形位图（自建：按页内所有标签推断行列边界）。"""
import os, re, sys
import pymupdf
from PIL import Image
import numpy as np
import chartlib as CL

def page_labels(page):
    """页内所有 4 位十六进制标签 -> [(cp, rect)]，按 y 再 x 排序。"""
    out = []
    for w in page.get_text('words'):
        x0, y0, x1, y1, txt = w[0], w[1], w[2], w[3], w[4]
        m = re.fullmatch(r'([0-9A-F]{4,5})', txt)
        if m:
            out.append((int(m.group(1), 16), pymupdf.Rect(x0, y0, x1, y1)))
    out.sort(key=lambda t: (round(t[1].y0 / 6), t[1].x0))
    return out

def find(pidx, cp):
    doc = pymupdf.open(CL.fetch(pidx[0]))
    page = doc[pidx[1]]
    labs = page_labels(page)
    for i, (c, r) in enumerate(labs):
        if c == cp:
            doc.close()
            return page.rect, r, labs
    doc.close()
    return None

def cell_page(cp):
    """返回 (page, rect, doc) —— 调用方负责 doc.close()。"""
    lo, hi, nm = CL.block_of(cp)
    doc = pymupdf.open(CL.fetch(lo))
    for pi in range(len(doc)):
        page = doc[pi]
        for c, r in page_labels(page):
            if c == cp:
                return page, r, doc
    doc.close(); return None, None, None

def glyph_bitmap(cp, zoom=6, outdir=None, save=None):
    """取字形位图（numpy bool，True=墨）。用标签右下方区域，再裁紧到最大连通墨迹。"""
    page, lab, doc = cell_page(cp)
    if page is None: return None
    x0, y0 = lab.x0, lab.y0
    rect = pymupdf.Rect(x0 - 1, y0 + lab.height + 1, x0 + 34, y0 + lab.height + 40)
    pix = page.get_pixmap(matrix=pymupdf.Matrix(zoom, zoom), clip=rect,
                          colorspace=pymupdf.csGRAY)
    doc.close()
    im = Image.frombytes('L', (pix.width, pix.height), pix.samples)
    if save:
        os.makedirs(outdir or '.', exist_ok=True)
        im.save(os.path.join(outdir or '.', save))
    a = np.array(im) < 160
    return a

def tight(a, margin=2):
    ys, xs = np.where(a)
    if len(ys) == 0: return a
    y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
    return a[max(0,y0-margin):y1+1+margin, max(0,x0-margin):x1+1+margin]

def ink_ratio(a):
    return a.sum() / a.size if a.size else 0.0

def row_profile(a, n=None):
    """每行墨量 -> 归一化。"""
    p = a.sum(axis=1).astype(float)
    return p

def describe(a):
    """行分段：(高度占比, 段内墨点数, 段宽) —— 用来数笔画。"""
    rows = a.sum(axis=1) > 0
    bands, prev, s = [], False, 0
    for i, v in enumerate(rows):
        if v and not prev: s = i
        if not v and prev: bands.append((s, i - 1))
        prev = v
    if prev: bands.append((s, len(rows) - 1))
    out = []
    for (b0, b1) in bands:
        sub = a[b0:b1+1]
        cols = sub.sum(axis=0) > 0
        # 列分段
        segs, prev2, s2 = [], False, 0
        for i, v in enumerate(cols):
            if v and not prev2: s2 = i
            if not v and prev2: segs.append(i - s2)
            prev2 = v
        if prev2: segs.append(len(cols) - s2)
        out.append({'h': b1 - b0 + 1, 'w': len(cols), 'nseg': len(segs), 'segs': segs,
                    'ink': int(sub.sum())})
    return out

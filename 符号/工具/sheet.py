# -*- coding: utf-8 -*-
"""家族拼图：把一组码位的官方码表字形拼成一张带标签的对照图。"""
import os, numpy as np
from PIL import Image, ImageDraw, ImageFont
import grid2 as G2

FONT = r'd:\工具兽\静态页面工具\lib\fonts\NotoSansSymbols2-Regular.ttf'
UI = None
for cand in [r'C:\Windows\Fonts\consola.ttf', r'C:\Windows\Fonts\arial.ttf']:
    if os.path.exists(cand): UI = cand; break

def _f(size):
    return ImageFont.truetype(UI, size) if UI else ImageFont.load_default()

from scipy import ndimage as ND

def clean(a, zoom=10):
    """去格线残留：连通域分析，扔掉贴边且相对小的碎片。"""
    lab, n = ND.label(a)
    if n <= 1:
        return a
    sizes = ND.sum(a, lab, range(1, n + 1))
    big = sizes.max()
    keep = np.zeros(n + 1, bool)
    for i in range(1, n + 1):
        ys, xs = np.where(lab == i)
        touches = ys.min() == 0 or xs.min() == 0 or ys.max() == a.shape[0]-1 or xs.max() == a.shape[1]-1
        if touches and sizes[i-1] < 0.25 * big:
            continue
        keep[i] = True
    return keep[lab]

def glyph_img(cp, cell=120):
    a = G2.bitmap(cp)
    if a is None: return None
    a = clean(G2.tight(a))
    if a.size == 0: return None
    im = Image.fromarray((~a * 255).astype('uint8'))
    s = min(cell / im.width, cell / im.height, 4.0)
    return im.resize((max(1, int(im.width * s)), max(1, int(im.height * s))), Image.LANCZOS)

def sheet(items, path, cols=8, cell=120, show_name=True):
    """items: [(cp, name)]。"""
    rows = (len(items) + cols - 1) // cols
    lh = 40 if show_name else 0
    ch = cell + lh
    W, H = cols * cell, rows * ch
    img = Image.new('L', (W, H), 255)
    d = ImageDraw.Draw(img)
    f = _f(14); f2 = _f(12)
    for i, (cp, name) in enumerate(items):
        cx, cy = (i % cols) * cell, (i // cols) * ch
        d.rectangle([cx, cy, cx + cell - 1, cy + ch - 1], outline=170)
        g = glyph_img(cp, cell - 16)
        if g is not None:
            img.paste(g, (cx + (cell - g.width) // 2, cy + 8 + (cell - 16 - g.height) // 2))
        d.text((cx + 4, cy + cell - 2), 'U+%04X' % cp, font=f, fill=0)
        if show_name:
            nm = name.replace(' ', '\n', 0)
            d.text((cx + 4, cy + cell + 14), name[:34], font=f2, fill=40)
    img.save(path)
    return path

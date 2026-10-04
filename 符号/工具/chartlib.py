# -*- coding: utf-8 -*-
"""Unicode 官方码表取字形：下载 PDF → 定位码位格 → 裁图。"""
import os, re, sys, urllib.request
import pymupdf
from PIL import Image

CACHE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'charts')
os.makedirs(CACHE, exist_ok=True)
UA = {'User-Agent': 'Mozilla/5.0'}

def fetch(blockstart):
    """blockstart: int。下载 U<HEX>.pdf 到 charts/。"""
    name = 'U%04X.pdf' % blockstart
    p = os.path.join(CACHE, name)
    if os.path.exists(p) and os.path.getsize(p) > 20000:
        return p
    url = 'https://www.unicode.org/charts/PDF/' + name
    last = None
    for attempt in range(6):
        try:
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=180) as r:
                blob = r.read()
            if len(blob) < 20000:
                raise IOError('too small: %d' % len(blob))
            tmp = p + '.part'
            open(tmp, 'wb').write(blob)
            os.replace(tmp, p)
            return p
        except Exception as e:
            last = e
    raise IOError('下载失败 %s: %r' % (name, last))

def _load_blocks():
    # 本文件在 符号/工具/ 下；参考资料 在 符号/参考资料/
    txt = open(os.path.join(os.path.dirname(os.path.abspath(__file__)),
                            '..', '参考资料', 'Blocks.txt'), encoding='utf-8').read()
    out = []
    for line in txt.splitlines():
        m = re.match(r'^([0-9A-F]+)\.\.([0-9A-F]+);\s*(.+?)\s*$', line)
        if m:
            out.append((int(m.group(1), 16), int(m.group(2), 16), m.group(3)))
    return out

BLOCKS = _load_blocks()

def block_of(cp):
    for lo, hi, nm in BLOCKS:
        if lo <= cp <= hi:
            return lo, hi, nm
    return None

def find_cell(doc, cp):
    """返回 (page_index, bbox_of_code_label, page_size)。"""
    label = '%04X' % cp
    for pi in range(len(doc)):
        page = doc[pi]
        hits = page.search_for(label)
        if not hits:
            continue
        # 页头/页脚也会命中，排除页面上下边距之外的
        H = page.rect.height
        hits = [h for h in hits if 40 < h.y0 < H - 40]
        if len(hits) == 1:
            return pi, hits[0], page.rect
        if hits:
            # 多命中：取最左上的那个（码表格子从左到右、上到下排）
            hits.sort(key=lambda r: (round(r.y0 / 5), r.x0))
            return pi, hits[0], page.rect
    return None

def crop(cp, zoom=4, pad=3.0, outdir=None, tag=''):
    """裁出 cp 的格子图，返回 PNG 路径。pad 单位是 pt。"""
    b = block_of(cp)
    if not b:
        return None
    lo, hi, nm = b
    pdf = fetch(lo)
    doc = pymupdf.open(pdf)
    r = find_cell(doc, cp)
    if not r:
        doc.close()
        return None
    pi, bbox, _ = r
    page = doc[pi]
    # 格子：码位标签通常贴在格子的左上角。格子宽约 (文本区宽)/列数
    # 用标签 bbox 往右下扩一个方形区域，再靠渲染结果裁紧
    rect = pymupdf.Rect(bbox.x0 - pad, bbox.y0 - pad, bbox.x0 + 34 + pad, bbox.y0 + 38 + pad)
    pix = page.get_pixmap(matrix=pymupdf.Matrix(zoom, zoom), clip=rect)
    outdir = outdir or CACHE
    os.makedirs(outdir, exist_ok=True)
    p = os.path.join(outdir, 'cell_%s%04X.png' % (tag, cp))
    pix.save(p)
    doc.close()
    return p

def tighten(p, thr=200, margin=6):
    """把白边裁掉，只留墨迹。"""
    im = Image.open(p).convert('L')
    bbox = im.point(lambda v: 0 if v > thr else 255).getbbox()
    if not bbox:
        return p
    x0, y0, x1, y1 = bbox
    im2 = Image.open(p).convert('RGB').crop(
        (max(0, x0 - margin), max(0, y0 - margin),
         min(im.width, x1 + margin), min(im.height, y1 + margin)))
    im2.save(p)
    return p

# -*- coding: utf-8 -*-
"""取某码位格子里的**填充路径多边形**（黑块的真实几何）。"""
import collections
import pymupdf, chartlib as CL, grid3 as G3

def cell_rect(page, labs, vx, hy, r, colp=None, rowp=None):
    rows = collections.defaultdict(list)
    for c, rr in labs: rows[round(rr.y0,0)].append(rr)
    xs = sorted(x.x0 for x in rows[round(r.y0,0)])
    ys = sorted(rows)
    dxs = [b-a for a,b in zip(xs,xs[1:])]; dys=[b-a for a,b in zip(ys,ys[1:])]
    colp = min(dxs) if dxs else 32; rowp = min(dys) if dys else 40
    L = max([x for x in vx if x < r.x0], default=r.x0-colp*0.3)
    R = min([x for x in vx if x > r.x0+colp*0.6], default=r.x0+colp*0.7)
    T = max([y for y in hy if y < r.y0-rowp*0.3], default=r.y0-rowp*0.8)
    B = min([y for y in hy if y > r.y0+2], default=r.y0+8)
    if R-L < 8: R = L + colp
    if B-T < 8: B = T + rowp
    return pymupdf.Rect(L, T, R, B)

def fills(cp):
    lo,hi,nm = CL.block_of(cp); doc = G3._doc(lo)
    best,bn = 0,-1
    for pi in range(len(doc)):
        n = len(G3._pageinfo((lo,pi),doc[pi])[0])
        if n>bn: best,bn=pi,n
    page = doc[best]; labs,vx,hy = G3._pageinfo((lo,best),page)
    r = [rr for c,rr in labs if c==cp][0]
    cell = cell_rect(page, labs, vx, hy, r)
    inside = pymupdf.Rect(cell.x0+0.5, cell.y0+0.5, cell.x1-0.5, cell.y1-0.5)
    out = []
    for d in page.get_drawings():
        if not d.get('fill'):
            continue
        bbox = d['rect']
        if not inside.contains(bbox) or bbox.is_empty:
            continue
        pts = []
        for it in d['items']:
            if it[0]=='l': pts += [it[1], it[2]]
            elif it[0]=='re': pts += [it[1].tl, it[1].tr, it[1].br, it[1].bl]
            elif it[0]=='c': pts += [it[1], it[4]]
        if not pts: continue
        # 归一化到格子坐标 0..1（y 向下）
        W, H = cell.width, cell.height
        npts = [((p.x-cell.x0)/W, (p.y-cell.y0)/H) for p in pts]
        out.append({'bbox': ((bbox.x0-cell.x0)/W, (bbox.y0-cell.y0)/H,
                             (bbox.x1-cell.x0)/W, (bbox.y1-cell.y0)/H),
                    'pts': npts})
    return cell, out

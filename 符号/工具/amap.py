# -*- coding: utf-8 -*-
import sys, numpy as np
sys.path.insert(0,'.')
import grid3 as G3, sheet as S

def amap_arr(a, n=22, inset=0.06):
    if a is None or a.size == 0: return None
    b = S.clean(a)
    if b.size == 0: return None
    b = G3.tight(b)
    h,w = b.shape; m = int(min(h,w)*inset)
    if h-m*2 < 4 or w-m*2 < 4: m=0
    b = b[m:h-m, m:w-m]
    H,W = b.shape
    rows=[]
    for i in range(n):
        y0,y1 = int(i*H/n), max(int((i+1)*H/n), int(i*H/n)+1)
        line=''
        for j in range(n):
            x0,x1 = int(j*W/n), max(int((j+1)*W/n), int(j*W/n)+1)
            line += '#' if b[y0:y1,x0:x1].mean()>0.5 else '.'
        rows.append(line)
    return rows

def show(cps, label, n=22):
    print('### %s' % label)
    for cp in cps:
        nm = NM.get(cp,'?')
        rows = amap_arr(G3.bitmap(cp))
        print('U+%04X %s' % (cp, nm))
        if rows is None: print('   (取不到)'); continue
        for r in rows: print('   '+r)
    print()

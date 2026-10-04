# -*- coding: utf-8 -*-
"""判字形的朝向：①箭头/指针的"头"在哪一侧 ②时钟指针角度。"""
import sys, numpy as np
sys.path.insert(0,'.')
import grid3 as G3, sheet as S

def arr(cp):
    a = G3.get(cp)
    if a is None or a.size == 0: return None
    a = S.clean(a)
    if a.sum() < 10: return None
    h, w = a.shape
    ext = a.sum(axis=0)            # 每列的墨量（竖向量）
    # 用"每列在该列内的竖直跨度"衡量箭头头部（头宽尾窄）
    span = np.zeros(w)
    for x in range(w):
        ys = np.where(a[:, x])[0]
        span[x] = (ys.max() - ys.min() + 1) if len(ys) else 0
    l3, r3 = span[:w//3].max(), span[-w//3:].max()
    return dict(shape=(h, w), ink=float(a.mean()), span_l=float(l3), span_r=float(r3),
                horizontal=w > h * 1.15)

def clock_hands(cp):
    """返回 12 扇区墨量（0=12点方向，顺时针）。"""
    a = G3.get(cp)
    if a is None or a.size == 0: return None
    a = S.clean(a)
    h, w = a.shape
    cy, cx = (h-1)/2, (w-1)/2
    r = min(h, w)/2
    ys, xs = np.where(a)
    dy, dx = ys-cy, xs-cx
    d = np.hypot(dy, dx)
    inner = d < r*0.80          # 去掉外圈
    if inner.sum() < 5: return None
    ang = (np.degrees(np.arctan2(dx[inner], -dy[inner])) + 360) % 360   # 0=上，顺时针
    hist = np.zeros(12)
    for x in ang: hist[int(x//30) % 12] += 1
    return hist

# -*- coding: utf-8 -*-
"""朝向筛查：名字里的方位词 vs 字形墨迹偏重的一侧。"""
import sys, re, numpy as np
sys.path.insert(0,'.')
import grid3 as G3, sheet as S

def thirds(cp):
    a = G3.get(cp)
    if a is None or a.size == 0: return None
    a = S.clean(a)
    if a.sum() < 15: return None
    return a

def side_bias(a):
    """返回 (左右偏重, 上下偏重)，已归一化；正=偏右/偏下。"""
    h, w = a.shape
    L = a[:, :w//3].sum(); R = a[:, -(w//3):].sum()
    T = a[:h//3, :].sum(); B = a[-(h//3):, :].sum()
    lr = (R - L) / max(L + R, 1)
    tb = (B - T) / max(T + B, 1)
    return lr, tb, (h, w)

DIRW = {
 'LEFTWARDS':'l','RIGHTWARDS':'r','UPWARDS':'u','DOWNWARDS':'d',
 'LEFT':'l','RIGHT':'r','UP':'u','DOWN':'d',
 'NORTH':'u','SOUTH':'d','EAST':'r','WEST':'l',
 'UP-POINTING':'u','DOWN-POINTING':'d','LEFT-POINTING':'l','RIGHT-POINTING':'r',
 'UPWARD':'u','DOWNWARD':'d',
}
def want_dir(name):
    """取名字里第一个（最靠前的）方位词。"""
    best, bi = None, 10**9
    for w, d in DIRW.items():
        i = name.find(w)
        if i >= 0 and i < bi:
            bi, best = i, d
    return best

def screen(name):
    """名字里同时出现左右或上下两个方位词 = 双向符号，跳过。"""
    ds = set()
    for w, d in DIRW.items():
        if re.search(r'\b'+re.escape(w)+r'\b', name): ds.add(d)
    return ds

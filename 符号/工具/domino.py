# -*- coding: utf-8 -*-
"""多米诺：名字里写了两个点数，数一下字形里的点子。"""
import sys, re, numpy as np
sys.path.insert(0,'.')
from scipy import ndimage as ND
import grid3 as G3, sheet as S

def pips(cp):
    a = G3.get(cp)
    if a is None or a.size == 0: return None
    a = S.clean(a)
    if a.mean() > 0.35: return None          # 实心/异常
    lab, n = ND.label(a)
    objs = ND.find_objects(lab)
    out = []
    H, W = a.shape
    for i, sl in enumerate(objs):
        h = sl[0].stop - sl[0].start; w = sl[1].stop - sl[1].start
        area = int((lab[sl] == i + 1).sum())
        out.append({'bbox': (sl[1].start, sl[0].start, w, h), 'area': area,
                    'fill': area / max(h * w, 1)})
    return a, out

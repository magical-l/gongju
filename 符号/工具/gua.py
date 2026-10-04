# -*- coding: utf-8 -*-
"""卦爻核对：从官方码表字形读出爻（实/断）序列，与名字蕴含的卦核对。"""
import sys, numpy as np
sys.path.insert(0,'.')
import grid3 as G3, sheet as S

def bands(a, want=6):
    """按行墨量切出 want 个横条，返回每条的实/断布尔（中心留空=断）。"""
    rows = a.sum(axis=1)
    on = rows > 0
    segs, prev, s = [], False, 0
    for i, v in enumerate(on):
        if v and not prev: s = i
        if not v and prev: segs.append((s, i - 1))
        prev = v
    if prev: segs.append((s, len(on) - 1))
    # 合并过近的段（断爻的两截在同一行带里？不会，断爻仍是一条带）
    return segs

def yao(a):
    """返回 ('1','0',...)，index0 = 最下面一爻。"""
    segs = bands(a)
    if not segs: return None, segs
    out = []
    W = a.shape[1]
    for (y0, y1) in segs:
        sub = a[y0:y1+1]
        c0, c1 = int(W*0.38), int(W*0.62)
        mid = sub[:, c0:c1].mean()
        out.append('1' if mid > 0.5 else '0')
    out = out[::-1]   # 上→下 翻成 下→上
    return ''.join(out), segs

# 三爻卦：下→上
TRIG = {'111':'乾','110':'兑','101':'离','100':'震','011':'巽','010':'坎','001':'艮','000':'坤'}
# 八卦 Unicode 名 → 卦
TRI_NAME = {
 'HEAVEN':'111','LAKE':'110','FIRE':'101','THUNDER':'100',
 'WIND':'011','WATER':'010','MOUNTAIN':'001','EARTH':'000'}

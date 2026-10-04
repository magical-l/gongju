# -*- coding: utf-8 -*-
"""解析 NamesList.txt：码位 -> {name, als(=), notes(*), xrefs(x), formal(%)}"""
import re, os

def load(path='NamesList.txt'):
    d = {}
    cur = None
    for line in open(path, encoding='utf-8', errors='replace'):
        m = re.match(r'^([0-9A-F]{4,6})\t(.*)$', line)
        if m:
            cur = int(m.group(1), 16)
            d[cur] = {'name': m.group(2), 'als': [], 'notes': [], 'xrefs': [], 'formal': []}
            continue
        if cur is None: continue
        s = line.rstrip('\n')
        if s.startswith('\t='):   d[cur]['als'].append(s.strip()[2:].strip())
        elif s.startswith('\t*'): d[cur]['notes'].append(s.strip()[2:].strip())
        elif s.startswith('\t%'): d[cur]['formal'].append(s.strip()[2:].strip())
        elif s.startswith('\tx'): d[cur]['xrefs'].append(s.strip()[2:].strip())
        elif s.startswith('\t@'): cur = None
    return d

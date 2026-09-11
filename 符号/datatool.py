# -*- coding: utf-8 -*-
"""符号页数据读写公共库。

**改数据的脚本一律用这里，别各自手写 JSON 解析 / 写回。**
这里封掉的都是踩过的坑：逗号归一、`},,` 造成的稀疏空槽、写回格式选错、
备份忘记清理、中文名.json 的映射格式。

用法::

    import sys; sys.path.insert(0, r'd:\\工具兽\\静态页面工具\\符号')
    from datatool import *

    # 改 符号数据.js（只重写被改动的行，其余字节不动）
    def f(o):                      # o 是解析后的条目 dict，改它
        if o['char'] == '☭':
            o['groups'] = {...}
            return True            # 返回 True 表示这条改了
    n = update_symbols(f)

    # 加新条目
    append_symbols([{'char':'🆕','groups':{'某标签':{'name':'某名'}}}])

    # 名字表（中文名.json，names 是 {码点:名字} 映射）
    zh = load_zh(); zh['0x262D'] ...
    set_zh(0x262D, '镰刀锤子'); save_zh()

    # 全量体检
    check_all()
"""
import json
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
SYMS = os.path.join(HERE, '符号数据.js')
ZH = os.path.join(HERE, '中文名.json')
TAGS = os.path.join(HERE, '标签.json')
HEAD = 'const SYMBOLS = ['
TAIL = '];'


# ==================== 符号数据.js ====================

def _lines(path=SYMS):
    return open(path, encoding='utf-8').read().split('\n')


def load_symbols():
    """→ [dict, ...]，跳过表头与 `];`；逐行解析（行尾逗号剥掉）。"""
    out = []
    for ln in _lines():
        s = ln.strip()
        if not s.startswith('{'):
            continue
        out.append(json.loads(s.rstrip(',')))
    return out


_CTRL = re.compile(r'[\x7f-\x9f]')   # DEL + C1：json.dumps 不转义，必须自己转，否则裸控制字符进源码


def _entry_line(o):
    s = json.dumps(o, ensure_ascii=False, separators=(',', ':'))
    s = _CTRL.sub(lambda m: '\\u%04x' % ord(m.group(0)), s)
    return '\t' + s + ','


def _normalize(lines):
    """逗号归一：除 `];` 前最后一条外，条目行都要带逗号。表头不加。"""
    out = []
    for l in lines:
        if l.strip().startswith('{'):
            l = l.rstrip().rstrip(',') + ','
        out.append(l)
    j = max(i for i, l in enumerate(out) if l.strip() == TAIL)
    for i in range(j - 1, -1, -1):
        if out[i].strip().startswith('{'):
            out[i] = out[i].rstrip().rstrip(',')
            break
    return out


def update_symbols(fn, path=SYMS):
    """逐条改。fn(o) 就地改 dict，返回 True 表示这条要重写。
    返回改动条数。未改动的行原样保留（diff 干净）。"""
    lines = _lines(path)
    out, n = [], 0
    for ln in lines:
        s = ln.strip()
        if not s.startswith('{'):
            out.append(ln)
            continue
        o = json.loads(s.rstrip(','))
        if fn(o):
            out.append(_entry_line(o))
            n += 1
        else:
            out.append(ln)
    if n:
        _write(path, '\n'.join(_normalize(out)))
    return n


def append_symbols(entries, path=SYMS):
    """在 `];` 前追加条目。返回追加条数。"""
    lines = _lines(path)
    j = max(i for i, l in enumerate(lines) if l.strip() == TAIL)
    lines[j:j] = [_entry_line(o).rstrip(',') for o in entries]
    _write(path, '\n'.join(_normalize(lines)))
    return len(entries)


def _write(path, text):
    open(path, 'w', encoding='utf-8', newline='\n').write(text)


# ==================== 中文名.json ====================
# 格式：{_v, names:{ "码点": "名字" }, patterns:[[lo,hi,前缀],...]}
# names 是映射，没有"必须升序"这回事。

def load_zh():
    return json.load(open(ZH, encoding='utf-8'))


def save_zh(d):
    _write(ZH, json.dumps(d, ensure_ascii=False, indent=2))


def set_zh(cp, name):
    """改/加一个名字。返回旧值（无则 None）。调用方自己 save_zh()。"""
    d = load_zh()
    old = d['names'].get(str(cp))
    d['names'][str(cp)] = name
    save_zh(d)
    return old


def zh_names():
    """→ {int(码点): 名字}"""
    return {int(k): v for k, v in load_zh()['names'].items()}


# ==================== 标签.json ====================

def load_tags():
    return json.load(open(TAGS, encoding='utf-8'))


def dump_tags(d):
    """标签.json 的紧凑写法：ranges/seqs 这种「列表的列表」**一行一条**，其余按 indent=2。

    不这么写的话，`indent=2` 会把 [128104, 8205, 9877] 拆成 6 行 —— 十万行里八成是数字行和括号行。
    """
    def enc(v, ind):
        pad = '  ' * ind
        if isinstance(v, dict):
            if not v:
                return '{}'
            items = ['%s  %s: %s' % (pad, json.dumps(k, ensure_ascii=False), enc(x, ind + 1))
                     for k, x in v.items()]
            return '{\n' + ',\n'.join(items) + '\n' + pad + '}'
        if isinstance(v, list):
            if not v:
                return '[]'
            if all(isinstance(x, list) for x in v):        # ranges / seqs
                items = ['%s  %s' % (pad, json.dumps(x, ensure_ascii=False, separators=(',', ':')))
                         for x in v]
                return '[\n' + ',\n'.join(items) + '\n' + pad + ']'
            return json.dumps(v, ensure_ascii=False, separators=(', ', ': '))
        return json.dumps(v, ensure_ascii=False)
    return enc(d, 0) + '\n'


def save_tags(d):
    _write(TAGS, dump_tags(d))


def walk_tags(d, trail=()):
    """→ (trail, node) 逐个节点。trail 是节点名元组。"""
    for k, v in (d.get('children') or {}).items():
        yield trail + (k,), v
        yield from walk_tags(v, trail + (k,))


def all_ranges(d):
    """→ {码点: {含它的节点名及其祖先名}}——与 check_group_keys 口径一致。"""
    from collections import defaultdict
    res = defaultdict(set)

    def add(node, trail):
        for a, b in (node.get('ranges') or []):
            for c in range(a, b + 1):
                res[c] |= set(trail)
        for k, v in (node.get('children') or {}).items():
            add(v, trail + (k,))
    for rk, rv in d['roots'].items():
        add(rv, (rk,))
    return res


# ==================== 体检 ====================

def check_all(verbose=True):
    """一次跑完所有不变量。返回 (ok, [问题描述])。"""
    bad = []

    # ① 符号数据.js 语法
    r = subprocess.run(['node', '--check', SYMS], capture_output=True, text=True)
    if r.returncode:
        bad.append('符号数据.js 语法错：' + r.stderr.strip().split('\n')[0])

    # ② 逐项校验（防 `},,` 造成的稀疏空槽：语法合法但数组里是 undefined）
    raw = [l.strip() for l in _lines() if l.strip().startswith('{')]
    chars = []
    for i, l in enumerate(raw):
        try:
            o = json.loads(l.rstrip(','))
        except Exception as e:
            bad.append('第 %d 条解析失败：%s' % (i + 1, e))
            continue
        c = o.get('char')
        if not isinstance(c, str) or not c:
            bad.append('第 %d 条 char 不是非空字符串：%r' % (i + 1, c))
        chars.append(c)

    # ③ char 重复
    from collections import Counter
    for c, n in Counter(chars).items():
        if n > 1:
            bad.append('char 重复：%r × %d' % (c, n))

    # ④ 空壳条目（只剩 char，什么内容都没有）——历史上名字被删重复后留下的残骸
    for o in load_symbols():
        if not (set(o) - {'char'}):
            bad.append('%s 是空壳条目：除 char 外没有任何字段' % o['char'])

    # ④b 空组（既无 name 也无 alias）：v1.27.0 删重复组名时留下的组壳，
    #      会让 ctxGroupKey 返回一个没有名字的键，导致该标签下显示回落到英文名
    for o in load_symbols():
        for k, v in (o.get('groups') or {}).items():
            if not v or (not v.get('name') and not v.get('alias')):
                bad.append('%s 的组 %r 是空组（既无 name 也无 alias）' % (o['char'], k))

    # ④c 组里空名字 / 顿号异常
    for o in load_symbols():
        for k, v in (o.get('groups') or {}).items():
            nm = v.get('name')
            if nm is not None and not nm:
                bad.append('%s 的组 %r 名字为空串' % (o['char'], k))
            if nm and (nm.startswith('、') or nm.endswith('、') or '、、' in nm):
                bad.append('%s 的组 %r 名字顿号异常：%r' % (o['char'], k, nm))

    # ⑤ 名字层两个文件：可解析，且键都是「十进制码点」或「连字符码位串」
    for fname, path in (('中文名.json', ZH), ('名字.json', os.path.join(HERE, '名字.json'))):
        try:
            d = json.load(open(path, encoding='utf-8'))
            for k in d['names']:
                for part in k.split('-'):
                    int(part)
        except Exception as e:
            bad.append('%s：%s' % (fname, e))

    # ⑥ 标签.json 可解析
    try:
        load_tags()
    except Exception as e:
        bad.append('标签.json：%s' % e)

    # ⑦ 组键可达性（复用 check_group_keys.py）
    r = subprocess.run([sys.executable, os.path.join(HERE, 'check_group_keys.py')],
                       capture_output=True, text=True, encoding='utf-8')
    if r.returncode:
        bad.append('组键可达性：见 check_group_keys.py')

    if verbose:
        if bad:
            print('体检不通过，%d 项问题：' % len(bad))
            for b in bad[:30]:
                print('   ' + b)
        else:
            print('体检通过：语法/条目/重复/组名/组键 全部正常')
    return (not bad), bad


if __name__ == '__main__':
    sys.exit(0 if check_all()[0] else 1)

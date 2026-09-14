# -*- coding: utf-8 -*-
"""符号页数据读写公共库。

**改数据的脚本一律用这里，别各自手写 JSON 解析 / 写回。**
这里封掉的都是踩过的坑：逗号归一、`},,` 造成的稀疏空槽、写回格式选错、
备份忘记清理、官方名直译名.js 的映射格式。

用法::

    import sys; sys.path.insert(0, r'd:\\工具兽\\静态页面工具\\符号')
    from datatool import *

    # 改 符号富化数据.js（只重写被改动的行，其余字节不动）
    def f(o):                      # o 是解析后的条目 dict，改它
        if o['char'] == '☭':
            o['groups'] = {...}
            return True            # 返回 True 表示这条改了
    n = update_symbols(f)

    # 加新条目
    append_symbols([{'char':'🆕','groups':{'某标签':{'name':'某名'}}}])

    # 名字表（官方名直译名.js，names 是 {码点:名字} 映射）
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
SYMS = os.path.join(HERE, '符号富化数据.js')
ZH = os.path.join(HERE, '官方名直译名.js')
UNICODE_NAMES = os.path.join(HERE, 'unicode官方名.js')
TAGS = os.path.join(HERE, '标签.js')
NOTO = os.path.join(HERE, 'noto-cmap.js')
HEAD = 'const ENRICHED_SYMBOLS = ['
TAIL = '];'


# ==================== 数据文件包装 / 通用读写 ====================
# 4 个数据文件都是 `window.VAR = <JSON>;` 的形式（前后缀各包一层，里面就是原来的 JSON）。
# 四个现在都是 LF，末尾换行仍不统一（标签.js 有，其余无）。读写一律探测后保持原样——
# 硬写 newline='\n' 会把 CRLF 文件悄悄转成 LF（noto-cmap 早年被这么改过，本次已统一）。

def detect_newline(path):
    """探测现有文件换行风格，返回 '\r\n' 或 '\n'；文件不存在时返回 '\n'。"""
    try:
        raw = open(path, 'rb').read()
    except OSError:
        return '\n'
    return '\r\n' if b'\r\n' in raw else '\n'


def detect_trailing(path):
    """探测现有文件末尾是否有换行，返回 '\\r\\n' / '\\n' / ''（无末尾换行）；文件不存在时返回 ''。"""
    try:
        raw = open(path, 'rb').read()
    except OSError:
        return ''
    if raw.endswith(b'\r\n'):
        return '\r\n'
    if raw.endswith(b'\n'):
        return '\n'
    return ''


def wrap(var, body):
    """JSON body 文本 → 完整文件文本 `window.VAR = <body>;`（不含末尾换行）。

    body 尾部的换行先剥掉：dump_tags() 的返回值自带一个尾换行，直接拼会写成
    `}\\n;`，与现存的 `};` 差一个字节。文件末尾的换行由 write_text 的 trailing 管。
    """
    if body.endswith('\r\n'):
        body = body[:-2]
    elif body.endswith('\n'):
        body = body[:-1]
    return 'window.%s = ' % var + body + ';'


def unwrap(text, var):
    """剥掉 `window.VAR = ...;` 包装，返回里面的 JSON 文本（不含末尾换行）。

    前缀不符或结尾缺 ';' 时抛 ValueError。尾部换行先容忍掉再找 ';'，
    这样「有末尾换行」和「没有」两种文件都能读。
    """
    head = 'window.%s = ' % var
    if not text.startswith(head):
        raise ValueError('%s 的前缀不是 %r，实际开头 %r' % (var, head, text[:60]))
    body = text[len(head):].rstrip('\r\n')
    if not body.endswith(';'):
        raise ValueError('%s 的结尾缺 ";", 实际结尾 %r' % (var, body[-40:]))
    return body[:-1]


def read_data(path, var):
    """读 `window.VAR = {...};` 形式的数据文件 → dict。"""
    try:
        return json.loads(unwrap(open(path, encoding='utf-8').read(), var))
    except ValueError as e:                       # 含 JSONDecodeError
        raise ValueError('%s：%s' % (os.path.basename(path), e))


def dump_data(data, var, indent=2):
    """dict → 完整文件文本 'window.VAR = ' + json.dumps(...) + ';'（不含末尾换行）。"""
    return wrap(var, json.dumps(data, ensure_ascii=False, indent=indent))


def write_text(path, text, newline=None, trailing=None):
    """写回数据文件。newline/trailing 为 None 时自动探测并保持原文件的换行风格与末尾换行。

    text 里用 '\\n' 分隔，写盘前统一替换成探测到的 newline。
    用 newline='' 打开，避免 Python 再转换一次换行。
    """
    if newline is None:
        newline = detect_newline(path)
    if trailing is None:
        trailing = detect_trailing(path)
    text = text.replace('\r\n', '\n').replace('\r', '\n').replace('\n', newline)
    open(path, 'w', encoding='utf-8', newline='').write(text + trailing)


# ==================== 符号富化数据.js ====================

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


# ==================== 官方名直译名.js ====================
# 格式：window.ZH_TRANSLATION_DATA = {_v, names:{ "码点": "名字" }, patterns:[[lo,hi,前缀],...]};
# names 是映射，没有"必须升序"这回事。

def load_zh():
    return read_data(ZH, 'ZH_TRANSLATION_DATA')


def save_zh(d):
    write_text(ZH, dump_data(d, 'ZH_TRANSLATION_DATA'))


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


# ==================== 标签.js ====================

def load_tags():
    return read_data(TAGS, 'TAGS_DATA')


def dump_tags(d):
    """标签.js 的紧凑写法：ranges/seqs 这种「列表的列表」**一行一条**，其余按 indent=2。

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
    write_text(TAGS, wrap('TAGS_DATA', dump_tags(d)))


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

    # ① 符号富化数据.js 语法
    r = subprocess.run(['node', '--check', SYMS], capture_output=True, text=True)
    if r.returncode:
        bad.append('符号富化数据.js 语法错：' + r.stderr.strip().split('\n')[0])

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
    for fname, path, var in (('官方名直译名.js', ZH, 'ZH_TRANSLATION_DATA'), ('unicode官方名.js', UNICODE_NAMES, 'UNICODE_NAMES_DATA')):
        try:
            d = read_data(path, var)
            for k in d['names']:
                for part in k.split('-'):
                    int(part)
        except Exception as e:
            bad.append('%s：%s' % (fname, e))

    # ⑥ 标签.js 可解析
    try:
        read_data(TAGS, 'TAGS_DATA')
    except Exception as e:
        bad.append('标签.js：%s' % e)

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


# ==================== 自检 ====================

# (路径, 全局变量, 是否用 dump_tags 的紧凑写法)
DATA_FILES = (
    (TAGS, 'TAGS_DATA', True),
    (UNICODE_NAMES, 'UNICODE_NAMES_DATA', False),
    (ZH, 'ZH_TRANSLATION_DATA', False),
    (NOTO, 'NOTO_CMAP_DATA', False),
)


def selftest():
    """读→剥→dump→再剥，逐文件验证语义等价，并在临时副本上验证字节级还原。

    写的是临时副本，真文件一个字节都不动。返回 True/False。
    """
    import tempfile
    ok = True
    for path, var, compact in DATA_FILES:
        name = os.path.basename(path)
        nl, tr = detect_newline(path), detect_trailing(path)
        raw = open(path, 'rb').read()
        d = read_data(path, var)
        out = wrap(var, dump_tags(d)) if compact else dump_data(d, var)

        same_sem = False
        try:
            same_sem = json.loads(unwrap(out, var)) == d
        except Exception as e:
            print('  %s 再剥失败：%s' % (name, e))

        tmp = os.path.join(tempfile.mkdtemp(), name)
        with open(tmp, 'wb') as f:
            f.write(raw)
        write_text(tmp, out)                      # newline/trailing 走自动探测
        same_bytes = open(tmp, 'rb').read() == raw

        print('%-16s 换行=%-6r 末尾=%-6r 语义等价=%s 字节还原=%s'
              % (name, nl, tr, 'OK' if same_sem else 'NG', 'OK' if same_bytes else 'NG'))
        ok = ok and same_sem and same_bytes
    print('自检%s' % ('通过' if ok else '不通过'))
    return ok


def main(argv):
    if '--selftest' in argv:
        return 0 if selftest() else 1
    return 0 if check_all()[0] else 1


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))

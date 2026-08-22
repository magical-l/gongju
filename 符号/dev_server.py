# -*- coding: utf-8 -*-
"""
dev_server.py — 符号页编辑保存服务器（临时功能）。

作用：
  1. 从项目根起静态服务（页面依赖 ../lib/ 等，必须根目录起）
  2. 提供 POST /symbol-api/save —— 页面一改，当场写入数据文件
  3. 提供 GET /symbol-api/health —— 页面加载时探测编辑可用性
     （API 路径用纯 ASCII，避免 self.path 中文乱码导致匹配失败）

接口动作（页面发 JSON body，action 字段）：
  add       {"action":"add",  "cps":[1F600],      "targetPath":"语义/..."}
  move      {"action":"move", "cps":[1F600],      "sourcePath":"...", "targetPath":"..."}
  tag       {"action":"tag",  "path":"...",        "newName":"新名"|null, "aliases":[...]|null}
  sym       {"action":"sym",  "cps":[1F600],       "entry":{char,groups}|null, "name":"新名"|null}
              entry 提供 → 写 符号数据.js（页面已路由好：字符在 SYMBOLS 或加了别名）
              name 提供  → 写 中文名.json（仅非 SYMBOLS 字符的改名）

落盘规则：
  add/move        → 标签.json（成员移动/添加，不影响 标签.txt）
  tag-rename      → 标签.json（改 children key）+ 同步 标签.txt
  tag-alias       → 标签.json（alias 整体替换）+ 同步 标签.txt
  sym-name        → 字符在 符号数据.js → 改它；否则 → 中文名.json
  sym-alias       → 符号数据.js alias（不在 → 新建条目）
  机械轴（文字系统/官方分类/区块）禁止修改

运行： python 符号/dev_server.py
"""
import json
import os
import re
import socket
import threading
import traceback
import urllib.parse
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

from apply_ops import MECHANICAL, get_node, ranges_add, ranges_remove, seqs_add, seqs_remove

HERE = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(HERE)  # 项目根
TAGS_JSON = os.path.join(HERE, '标签.json')
TAGS_TXT = os.path.join(HERE, '标签.txt')
ZH_JSON = os.path.join(HERE, '中文名.json')
SYMBOL_JS = os.path.join(HERE, '符号数据.js')

# 页面 fetch 的这些文件加 no-cache，改完刷新即新
NO_CACHE_FILES = ('标签.json', '中文名.json', '名字.json', '符号数据.js', 'noto-cmap.json')

# 单写锁：读-改-写串行化（ThreadingHTTPServer 下防并发写坏文件）
LOCK = threading.Lock()


# ===== 文件读写工具 =====

def _read_lines(path):
    """读取文本并拆分行，保留原始换行风格（CRLF/LF）。"""
    text = open(path, encoding='utf-8', newline='').read()
    nl = '\r\n' if '\r\n' in text else '\n'
    lines = text.split('\n')
    if nl == '\r\n':
        lines = [l[:-1] if l.endswith('\r') else l for l in lines]
    return lines, nl


def _write_lines(path, lines, nl):
    open(path, 'w', encoding='utf-8', newline='').write(nl.join(lines))


_JSON_NL = '\n'


def load_tags():
    """读标签.json，并记住当前换行风格（CRLF/LF），写回时保持一致（git diff 才干净）。"""
    global _JSON_NL
    text = open(TAGS_JSON, encoding='utf-8', newline='').read()
    _JSON_NL = '\r\n' if '\r\n' in text else '\n'
    return json.loads(text)


def save_tags(data):
    body = json.dumps(data, ensure_ascii=False, indent=2).replace('\n', _JSON_NL)
    open(TAGS_JSON, 'w', encoding='utf-8', newline='').write(body)


def norm_cps(cps):
    if isinstance(cps, int):
        return [cps]
    return list(cps)


# ===== 标签.txt 同步（结构性改名/别名，保 pending 挂起标记）=====

def _txt_find(lines, segs):
    """按路径段逐级匹配 tab 缩进树，返回行索引；找不到返回 None。"""
    seg_idx = 0
    want_depth = 0
    for i, raw in enumerate(lines):
        m = re.match(r'^(\t*)([^\t]*?)$', raw)
        if not m or not m.group(2).strip():
            continue
        content = m.group(2)
        if content.startswith('……'):
            continue
        d = len(m.group(1))
        if seg_idx > 0 and d < want_depth:
            return None  # 已离开目标根子树
        if d == want_depth and content.split('：')[0].strip() == segs[seg_idx]:
            seg_idx += 1
            if seg_idx == len(segs):
                return i
            want_depth += 1
    return None


def _txt_parse(content):
    """解析行内容 → (name, pending, aliases|None)。"""
    name, _, rest = content.partition('：')
    pending = '留校察看' in rest
    aliases = None
    m = re.search(r'别名（(.*?)）', rest)
    if m:
        aliases = [a.strip() for a in m.group(1).split('、') if a.strip()]
    return name.strip(), pending, aliases


def _txt_fmt(name, pending, aliases):
    parts = []
    if pending:
        parts.append('留校察看')
    if aliases:
        parts.append('别名（' + '、'.join(aliases) + '）')
    return name + ('：' + '，'.join(parts) if parts else '')


def sync_txt(path, new_name=None, aliases=None):
    """把标签改名/别名同步到 标签.txt。节点不在 标签.txt 时 best-effort 跳过。"""
    segs = path.split('/')
    lines, nl = _read_lines(TAGS_TXT)
    idx = _txt_find(lines, segs)
    if idx is None:
        return (False, '标签.txt 未找到 ' + path + '（已跳过，重跑 build_tags 可能丢失本次改名）')
    raw = lines[idx]
    m = re.match(r'^(\t*)(.*)$', raw)
    indent = m.group(1)
    name, pending, old_aliases = _txt_parse(m.group(2))
    if new_name is not None:
        name = new_name
    if aliases is not None:
        old_aliases = aliases
    lines[idx] = indent + _txt_fmt(name, pending, old_aliases)
    _write_lines(TAGS_TXT, lines, nl)
    return (True, '')


# ===== 标签.json 操作 =====

def tag_add(p):
    data = load_tags()
    roots = data['roots']
    target = p['targetPath']
    if target.split('/')[0] in MECHANICAL:
        return False, '机械轴禁止修改'
    dst = get_node(roots, target)
    if dst is None:
        return False, '目标标签不存在: ' + target
    cps = norm_cps(p['cps'])
    if len(cps) > 1:
        seqs_add(dst, cps)
    else:
        ranges_add(dst, cps[0])
    save_tags(data)
    return True, '已添加'


def tag_move(p):
    data = load_tags()
    roots = data['roots']
    for path in (p['sourcePath'], p['targetPath']):
        if path.split('/')[0] in MECHANICAL:
            return False, '机械轴禁止修改'
    src = get_node(roots, p['sourcePath'])
    dst = get_node(roots, p['targetPath'])
    if src is None or dst is None:
        return False, '源或目标标签不存在'
    cps = norm_cps(p['cps'])
    if len(cps) > 1:
        seqs_remove(src, cps)
        seqs_add(dst, cps)
    else:
        ranges_remove(src, cps[0])
        ranges_add(dst, cps[0])
    save_tags(data)
    return True, '已移动'


def tag_meta(p):
    path = p['path']
    new_name = p.get('newName')
    aliases = p.get('aliases')
    if new_name is None and aliases is None:
        return False, '无变更'
    if path.split('/')[0] in MECHANICAL:
        return False, '机械轴禁止修改'

    data = load_tags()
    roots = data['roots']
    parts = path.split('/')
    new_path = path
    if new_name is not None:
        if len(parts) > 1:
            parent = get_node(roots, '/'.join(parts[:-1]))
            if parent is None:
                return False, '父标签不存在: ' + '/'.join(parts[:-1])
            if new_name in parent['children'] and new_name != parts[-1]:
                return False, '目标标签名已存在: ' + new_name
            parent['children'][new_name] = parent['children'].pop(parts[-1])
            new_path = '/'.join(parts[:-1] + [new_name])
        else:
            if new_name in roots and new_name != parts[0]:
                return False, '目标标签名已存在: ' + new_name
            roots[new_name] = roots.pop(parts[0])
            new_path = new_name

    node = get_node(roots, new_path)
    if node is None:
        return False, '标签不存在: ' + path
    if aliases is not None:
        node['alias'] = aliases
    save_tags(data)

    # 同步 标签.txt（best-effort）：先按旧路径改名，再按新路径改别名
    note = ''
    if new_name is not None:
        ok, n = sync_txt(path, new_name=new_name)
        if not ok:
            note = n
    if aliases is not None:
        ok, n = sync_txt(new_path, aliases=aliases)
        if not ok:
            note = n
    return True, '已保存' + ('（' + note + '）' if note else '')


# ===== 符号编辑 =====

def sym_upsert(entry):
    """把条目写入 符号数据.js：有同 char 则替换行，否则追加到 ] 前。

    文件格式：`const SYMBOLS = [` + 每条目一行 `\t{...},` + `];`，但最后一条不带逗号。
    追加时若原末条缺逗号须补上，否则非法 JSON。
    """
    char = entry['char']
    lines, nl = _read_lines(SYMBOL_JS)
    compact = json.dumps(entry, ensure_ascii=False, separators=(',', ':'))
    replaced = False
    for i, ln in enumerate(lines):
        m = re.search(r'"char":\s*("(?:[^"\\]|\\.)*")', ln)
        if not m:
            continue
        try:
            if json.loads(m.group(1)) == char:
                trailing = ',' if ln.rstrip().endswith(',') else ''
                lines[i] = '\t' + compact + trailing
                replaced = True
                break
        except Exception:
            continue
    if not replaced:
        # 追加到收尾 ] 前：给原末条补逗号，新条目不带逗号（成为新末条）
        insert_idx = len(lines)
        for i, ln in enumerate(lines):
            if ln.strip() == '];':
                insert_idx = i
                break
        if insert_idx > 0 and not lines[insert_idx - 1].rstrip().endswith(','):
            lines[insert_idx - 1] = lines[insert_idx - 1].rstrip() + ','
        lines.insert(insert_idx, '\t' + compact)
    _write_lines(SYMBOL_JS, lines, nl)


def zhname_set(cp, name):
    """写 中文名.json：有显式条目改它，否则按升序插入（覆盖 pattern 范围）。保留原换行风格。"""
    text = open(ZH_JSON, encoding='utf-8', newline='').read()
    nl = '\r\n' if '\r\n' in text else '\n'
    d = json.loads(text)
    names = d['names']
    lo, hi = 0, len(names) - 1
    idx = None
    while lo <= hi:
        mid = (lo + hi) // 2
        c = names[mid][0]
        if c == cp:
            idx = mid
            break
        if c < cp:
            lo = mid + 1
        else:
            hi = mid - 1
    if idx is not None:
        names[idx][1] = name
    else:
        names.insert(lo, [cp, name])
    body = json.dumps(d, ensure_ascii=False, indent=2).replace('\n', nl)
    open(ZH_JSON, 'w', encoding='utf-8', newline='').write(body)


def sym_save(p):
    entry = p.get('entry')
    name = p.get('name')
    if entry:
        sym_upsert(entry)
        return True, '已保存到 符号数据.js'
    if name is not None:
        cps = norm_cps(p['cps'])
        zhname_set(cps[0], name)
        return True, '已保存到 中文名.json'
    return False, '无变更'


def handle_save(payload):
    action = payload.get('action')
    with LOCK:
        if action == 'add':
            return tag_add(payload)
        if action == 'move':
            return tag_move(payload)
        if action == 'tag':
            return tag_meta(payload)
        if action == 'sym':
            return sym_save(payload)
    return False, '未知动作: ' + str(action)


# ===== HTTP 服务 =====

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=PROJECT_ROOT, **kwargs)

    def _path(self):
        """还原请求路径：self.path 是请求行按 latin-1 解码的结果，中文会变乱码。
        浏览器发百分号编码、curl 发原始 UTF-8，两种都还原成正确的 str。"""
        raw = urllib.parse.unquote(self.path.split('?', 1)[0])
        try:
            return raw.encode('latin-1').decode('utf-8')
        except (UnicodeEncodeError, UnicodeDecodeError):
            return raw

    def end_headers(self):
        # 数据文件禁用缓存（改完刷新即新）；允许跨域（防 file:// 打开时探测失败）
        if self._path().endswith(NO_CACHE_FILES):
            self.send_header('Cache-Control', 'no-cache')
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

    def do_GET(self):
        if self._path() == '/symbol-api/health':
            return self._json({'ok': True})
        return super().do_GET()

    def do_POST(self):
        if self._path() == '/symbol-api/save':
            return self._handle_save()
        self.send_error(404, 'Not Found')

    def _json(self, obj, status=200):
        body = json.dumps(obj, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _handle_save(self):
        try:
            length = int(self.headers.get('Content-Length') or 0)
            payload = json.loads(self.rfile.read(length) or b'{}')
        except Exception as e:
            return self._json({'ok': False, 'error': '无法解析请求: ' + str(e)}, 400)
        try:
            ok, msg = handle_save(payload)
        except Exception as e:
            traceback.print_exc()
            return self._json({'ok': False, 'error': str(e)}, 500)
        return self._json({'ok': ok, 'message': msg})


def pick_port():
    """选空闲端口。用 connect 探测（而非 bind）：Windows 允许 127.0.0.1 与 0.0.0.0
    双绑定，bind 会误判被 0.0.0.0 占用的端口为空闲，导致服务器绑定后不可达。"""
    candidates = [52330, 52331] + list(range(18765, 18800))
    for p in candidates:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(0.3)
            if s.connect_ex(('127.0.0.1', p)) != 0:  # 无任何监听 → 空闲可用
                return p
    raise SystemExit('没有可用端口')


def main():
    port = pick_port()
    httpd = ThreadingHTTPServer(('127.0.0.1', port), Handler)
    print('符号页编辑保存服务器已启动', flush=True)
    print(f'  打开页面: http://localhost:{port}/符号/符号.html', flush=True)
    print(f'  保存接口: http://localhost:{port}/符号/api/save   (Ctrl+C 停止)', flush=True)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print('\n已停止')


if __name__ == '__main__':
    main()

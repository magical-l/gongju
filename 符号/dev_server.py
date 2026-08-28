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
  remove    {"action":"remove","cps":[1F600],     "sourcePath":"..."}（取消打标：从源标签子树全部移除）
  tag       {"action":"tag",  "path":"...",        "newName":"新名"|null, "aliases":[...]|null, "intro":"简介"|null}
  tag-new   {"action":"tag-new","parentPath":"父路径或空", "name":"新标签", "aliases":[...]?}
              parentPath 空 → 新增语义根；否则新增子节点
  tag-del   {"action":"tag-del","path":"要删的路径"}（含子树）
  tag-sort  {"action":"tag-sort","path":"...",     "dir":"up"|"down"}
              同级内上移/下移一位（根级只在非机械轴根之间排）
  tag-reparent {"action":"tag-reparent","path":"源完整路径", "targetPath":"目标父路径或空"}
              targetPath 空 → 提升为语义根；否则把节点（含子树）移到目标父下
  sym       {"action":"sym",  "cps":[1F600],       "entry":{char,groups}|null, "name":"新名"|null}
              entry 提供 → 写 符号数据.js（页面已路由好：字符在 SYMBOLS 或加了别名）
              name 提供  → 写 中文名.json（仅非 SYMBOLS 字符的改名）

落盘规则（标签.json 为唯一权威，标签.txt / build_tags 等已清理）：
  add/move/remove → 标签.json（成员添加/移动/取消打标）
  tag-rename      → 标签.json（改 children key）
  tag-alias       → 标签.json（alias 整体替换）
  tag-new         → 标签.json（新增空节点）
  tag-del         → 标签.json（删节点+子树）
  tag-sort        → 标签.json（同级键换序）
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

HERE = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(HERE)  # 项目根
TAGS_JSON = os.path.join(HERE, '标签.json')
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


def is_member_list(cps):
    """cps 是成员列表（对象数组 [{cps,zh,en}...]）则 True；单成员（int 或 [cps]）False。"""
    return isinstance(cps, list) and len(cps) > 0 and isinstance(cps[0], dict)


def _add_member(node, member):
    """把单成员加到节点：member 为 dict {cps,zh,en}（成员列表元素）、裸 cps（单成员，int 或 [cps]）
    或数组的数组（[[cps],...] 旧协议成员列表）。数组的数组逐个递归处理。"""
    if isinstance(member, dict):
        cps = norm_cps(member['cps'])
        zh = member.get('zh', '')
        en = member.get('en', '')
    elif isinstance(member, list) and len(member) > 0 and isinstance(member[0], list):
        for sub in member:
            _add_member(node, sub)
        return
    else:
        cps = norm_cps(member)
        zh = en = ''
    if len(cps) > 1:
        seqs_add(node, cps, zh, en)
    else:
        ranges_add(node, cps[0])


# ===== 标签树操作（原 apply_ops.py 内联，apply_ops.py 已清理；json 唯一权威）=====

MECHANICAL = ('文字系统', '官方分类', '区块')


def get_node(roots, path):
    parts = path.split('/')
    node = roots.get(parts[0])
    if node is None:
        return None
    for p in parts[1:]:
        node = node.get('children', {}).get(p)
        if node is None:
            return None
    return node


def ranges_add(node, cp):
    """给节点加单码位并合并区间，返回是否真的新增。"""
    ranges = node.get('ranges')
    if ranges is None:
        node['ranges'] = [[cp, cp]]
        return True
    if any(lo <= cp <= hi for lo, hi in ranges):
        return False
    ranges.append([cp, cp])
    ranges.sort(key=lambda r: r[0])
    merged = [ranges[0]]
    for lo, hi in ranges[1:]:
        _, phi = merged[-1]
        if lo <= phi + 1:
            merged[-1][1] = max(phi, hi)
        else:
            merged.append([lo, hi])
    ranges[:] = merged
    return True


def ranges_remove(node, cp):
    """从节点删单码位并拆分区间，返回是否真的删除。"""
    ranges = node.get('ranges')
    if not ranges:
        return False
    for i, (lo, hi) in enumerate(ranges):
        if lo <= cp <= hi:
            ranges.pop(i)
            if lo < cp:
                ranges.insert(i, [lo, cp - 1])
                i += 1
            if cp < hi:
                ranges.insert(i, [cp + 1, hi])
            return True
    return False


def seq_cps(s):
    """seqs 条目 → 纯码位数组（剥离末尾 zh/en 字符串）。旗帜 [a,b,zh,en] 与 ZWJ [a..n,zh,en] 同构。"""
    i = len(s)
    while i > 0 and isinstance(s[i - 1], str):
        i -= 1
    return s[:i]


def seqs_contains(seqs, cps):
    return any(seq_cps(s) == cps for s in seqs)


def seqs_add(node, cps, zh='', en=''):
    if seqs_contains(node.get('seqs', []), cps):
        return False
    node.setdefault('seqs', []).append(list(cps) + [zh, en])
    # 防御性排序：仅取首元素为 int 的条目 key，坏数据（dict/list 首元素）用 0 兜底，避免比较崩溃
    node['seqs'].sort(key=lambda s: (s[0], s[1]) if isinstance(s, list) and len(s) > 1 and isinstance(s[0], int) and isinstance(s[1], int) else (0, 0))
    return True


def seqs_remove(node, cps):
    seqs = node.get('seqs', [])
    for i, s in enumerate(seqs):
        if seq_cps(s) == cps:
            seqs.pop(i)
            return True
    return False


def remove_from_subtree(node, cps):
    """从 node 子树删除成员（实际持有处，含子孙），返回是否删到。移动用。"""
    if len(cps) > 1:
        if seqs_remove(node, cps):
            return True
    else:
        if ranges_remove(node, cps[0]):
            return True
    for c in (node.get('children') or {}).values():
        if remove_from_subtree(c, cps):
            return True
    return False


def remove_all_from_subtree(node, cps):
    """从 node 子树删除成员的全部持有（含子孙），返回是否删到至少一处。取消打标用。"""
    found = False
    if len(cps) > 1:
        if seqs_remove(node, cps):
            found = True
    else:
        if ranges_remove(node, cps[0]):
            found = True
    for c in (node.get('children') or {}).values():
        if remove_all_from_subtree(c, cps):
            found = True
    return found


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
    if is_member_list(p.get('cps')):
        for m in p['cps']:
            _add_member(dst, m)
    else:
        _add_member(dst, p.get('cps'))
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
    if is_member_list(p.get('cps')):
        members = p['cps']
    else:
        members = [p.get('cps')]
    # 从源标签子树移除（与客户端 removeFromSubtree 一致；直接删源节点会在父标签视图下漏删子标签持有）
    for m in members:
        cps = m['cps'] if isinstance(m, dict) else m
        remove_from_subtree(src, cps)
        _add_member(dst, m)
    save_tags(data)
    return True, '已移动'


def tag_remove(p):
    """取消打标：从源标签移除成员。scope='node' 只删该标签自身直接持有（详情区 chip 用）；
    缺省删整棵子树（网格 ✕ 用，避免父视图聚合子节点导致字符"复活"）。机械轴禁止。"""
    path = p['sourcePath']
    if path.split('/')[0] in MECHANICAL:
        return False, '机械轴禁止修改'
    data = load_tags()
    roots = data['roots']
    src = get_node(roots, path)
    if src is None:
        return False, '标签不存在: ' + path
    if is_member_list(p.get('cps')):
        members = [m['cps'] for m in p['cps']]
    else:
        members = [norm_cps(p.get('cps'))]
    if p.get('scope') == 'node':
        for cps in members:
            found = seqs_remove(src, cps) if len(cps) > 1 else ranges_remove(src, cps[0])
            if not found:
                return False, '该字符不在标签中: ' + path
    else:
        for cps in members:
            found = remove_all_from_subtree(src, cps)
            if not found:
                return False, '该字符不在标签中: ' + path
    save_tags(data)
    return True, '已取消打标'


def rename_dict_key(d, old, new):
    """dict 键改名并保持键顺序：d[new]=d.pop(old) 会把新键排到末尾。"""
    if old == new:
        return
    items = [(new if k == old else k, v) for k, v in d.items()]
    d.clear()
    d.update(items)


def move_key_order(d, key, direction, sortable=None):
    """把 d 的键 key 上移/下移一位（限 sortable 键集内，None=全部键）。
    返回 (是否移动, 消息)；边界不移动也不报错。"""
    keys = list(d.keys())
    block = [k for k in keys if k in sortable] if sortable is not None else keys
    i = block.index(key)
    j = i - 1 if direction == 'up' else i + 1
    if j < 0 or j >= len(block):
        return False, '已在最' + ('前' if direction == 'up' else '后')
    a, b = block[i], block[j]
    new_keys = list(keys)
    ai, bi = new_keys.index(a), new_keys.index(b)
    new_keys[ai], new_keys[bi] = new_keys[bi], new_keys[ai]
    items = [(k, d[k]) for k in new_keys]
    d.clear()
    d.update(items)
    return True, ''


def tag_meta(p):
    path = p['path']
    new_name = p.get('newName')
    aliases = p.get('aliases')
    intro = p.get('intro')
    if new_name is None and aliases is None and intro is None:
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
            rename_dict_key(parent['children'], parts[-1], new_name)
            new_path = '/'.join(parts[:-1] + [new_name])
        else:
            if new_name in roots and new_name != parts[0]:
                return False, '目标标签名已存在: ' + new_name
            rename_dict_key(roots, parts[0], new_name)
            new_path = new_name

    node = get_node(roots, new_path)
    if node is None:
        return False, '标签不存在: ' + path
    if aliases is not None:
        node['alias'] = aliases
    if intro is not None:
        if intro:
            node['intro'] = intro
        else:
            node.pop('intro', None)  # 空串=清空简介字段，保持 json 干净
    save_tags(data)

    return True, '已保存'


def tag_new(p):
    """新增语义标签节点：parentPath 为空 → 新增语义根；否则作为父节点的子节点。"""
    parent = p.get('parentPath') or ''
    name = (p.get('name') or '').strip()
    aliases = p.get('aliases')
    if not name:
        return False, '节点名不能为空'
    if '/' in name:
        return False, '节点名不能包含斜杠 /'

    data = load_tags()
    roots = data['roots']
    if parent:
        if parent.split('/')[0] in MECHANICAL:
            return False, '机械轴禁止修改'
        pnode = get_node(roots, parent)
        if pnode is None:
            return False, '父标签不存在: ' + parent
        if name in pnode.setdefault('children', {}):
            return False, '标签名已存在: ' + name
        node = {'children': {}}
        if aliases:
            node['alias'] = aliases
        pnode['children'][name] = node
        save_tags(data)
    else:
        if name in roots:
            return False, '标签名已存在: ' + name
        node = {'children': {}}
        if aliases:
            node['alias'] = aliases
        roots[name] = node
        save_tags(data)
    return True, '已新增'


def tag_del(p):
    """删除语义标签节点（含子树）。机械轴禁止。"""
    path = p['path']
    if path.split('/')[0] in MECHANICAL:
        return False, '机械轴禁止修改'
    data = load_tags()
    roots = data['roots']
    if get_node(roots, path) is None:
        return False, '标签不存在: ' + path
    parts = path.split('/')
    if len(parts) > 1:
        parent = get_node(roots, '/'.join(parts[:-1]))
        del parent['children'][parts[-1]]
    else:
        del roots[parts[0]]
    save_tags(data)
    return True, '已删除'


def tag_sort(p):
    """调节标签顺序：同级可排序块内上移/下移一位。根级块=非机械轴根。"""
    path = p['path']
    direction = p.get('dir')
    if direction not in ('up', 'down'):
        return False, '未知方向: ' + str(direction)
    if path.split('/')[0] in MECHANICAL:
        return False, '机械轴禁止修改'
    data = load_tags()
    roots = data['roots']
    parts = path.split('/')
    if len(parts) > 1:
        parent = get_node(roots, '/'.join(parts[:-1]))
        if parent is None:
            return False, '父标签不存在: ' + '/'.join(parts[:-1])
        d = parent['children']
        sortable = None  # 子级全部键可排（父必为语义轴）
    else:
        d = roots
        sortable = [k for k in roots.keys() if k not in MECHANICAL]
    if parts[-1] not in d:
        return False, '标签不存在: ' + path
    moved, note = move_key_order(d, parts[-1], direction, sortable)
    if not moved:
        return True, note  # 边界（已在最前/最后）不报错
    save_tags(data)
    return True, '已排序'


def tag_reparent(p):
    """移动标签节点（含子树）到另一父级，targetPath 空 = 提升为语义根。

    校验：机械轴（源/目标）禁改、目标父存在、不能移到自身或自身子级、
    目标父下无同名键、源父与目标父相同视为无变化。
    """
    path = p['path']
    target = p.get('targetPath') or ''
    if path.split('/')[0] in MECHANICAL:
        return False, '机械轴禁止修改'
    if target and target.split('/')[0] in MECHANICAL:
        return False, '目标父为机械轴，禁止修改'
    data = load_tags()
    roots = data['roots']
    parts = path.split('/')
    name = parts[-1]
    old_parent = '/'.join(parts[:-1]) if len(parts) > 1 else ''
    if target == old_parent:
        return False, '标签已在该父级下'
    node = get_node(roots, path)
    if node is None:
        return False, '标签不存在: ' + path
    if target:
        dst = get_node(roots, target)
        if dst is None:
            return False, '目标父标签不存在: ' + target
        if target == path or target.startswith(path + '/'):
            return False, '不能移动到自身或自身子级'
        if name in dst.get('children', {}):
            return False, '目标父下已有同名标签: ' + name
    else:
        if name in roots:
            return False, '根级已有同名标签: ' + name
    # 摘除源
    if old_parent:
        parent = get_node(roots, old_parent)
        del parent['children'][name]
    else:
        del roots[name]
    # 挂载到目标
    if target:
        dst = get_node(roots, target)
        dst.setdefault('children', {})[name] = node
    else:
        roots[name] = node
    save_tags(data)
    return True, '已移动'


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
        if action == 'remove':
            return tag_remove(payload)
        if action == 'tag':
            return tag_meta(payload)
        if action == 'tag-new':
            return tag_new(payload)
        if action == 'tag-del':
            return tag_del(payload)
        if action == 'tag-sort':
            return tag_sort(payload)
        if action == 'tag-reparent':
            return tag_reparent(payload)
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

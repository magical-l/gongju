# -*- coding: utf-8 -*-
"""
apply_ops.py — 把页面"操作记录"复制的文本应用到 标签.json。

输入格式（每行一条，与页面复制一致）：
  添加 1F600 人与身体/情绪表达
  移动 1F483 人与身体/人物角色 体育、运动/舞蹈
  添加 1F468-200D-1F469 社会生活/家庭     （旗序列/ZWJ：码位用 - 连接）

规则：
  - 添加：目标节点 ranges（单码位）或 seqs（多码位）；已在目标则跳过（幂等）
  - 移动：源节点删 + 目标节点加
  - 源/目标不能是三大机械轴（文字系统/官方分类/区块）——防止破坏固定轴
  - 节点路径不存在 → 报错并跳过该条

运行： python apply_ops.py <操作文件>
"""
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
TAGS_JSON = os.path.join(HERE, '标签.json')
MECHANICAL = ('文字系统', '官方分类', '区块')

LINE_RE = re.compile(r'^(添加|移动)\s+([0-9A-Fa-f\-]+)\s+(\S+)(?:\s+(\S+))?\s*$')


def load():
    return json.load(open(TAGS_JSON, encoding='utf-8'))


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


def parse_cps(text):
    return [int(x, 16) for x in text.split('-')]


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


def seqs_contains(seqs, cps):
    return any(s[:len(cps)] == cps for s in seqs)


def seqs_add(node, cps):
    if seqs_contains(node.get('seqs', []), cps):
        return False
    node.setdefault('seqs', []).append(list(cps))
    node['seqs'].sort(key=lambda s: tuple(s[:2]))
    return True


def seqs_remove(node, cps):
    seqs = node.get('seqs', [])
    for i, s in enumerate(seqs):
        if s[:len(cps)] == cps:
            seqs.pop(i)
            return True
    return False


def main():
    if len(sys.argv) < 2:
        print('用法: python apply_ops.py <操作文件.txt>')
        sys.exit(1)
    ops_path = sys.argv[1]
    data = load()
    roots = data['roots']

    lines = [l for l in open(ops_path, encoding='utf-8') if l.strip()]
    applied = skipped = failed = 0
    for ln, raw in enumerate(lines, 1):
        m = LINE_RE.match(raw.strip())
        if not m:
            print(f'L{ln} 无法解析，跳过: {raw.strip()[:60]}')
            failed += 1
            continue
        action, cps_text, p3, p4 = m.group(1), m.group(2), m.group(3), m.group(4)
        # 格式：添加 <cps> <target>；移动 <cps> <source> <target>
        if action == '添加':
            target, source = p3, None
        else:
            source, target = p3, p4
        cps = parse_cps(cps_text)

        # 机械轴保护
        if target.split('/')[0] in MECHANICAL or (source and source.split('/')[0] in MECHANICAL):
            print(f'L{ln} 机械轴禁止修改，跳过: {raw.strip()[:60]}')
            skipped += 1
            continue

        dst = get_node(roots, target)
        if dst is None:
            print(f'L{ln} 目标节点不存在: {target}')
            failed += 1
            continue
        if action == '添加':
            ok = seqs_add(dst, cps) if len(cps) > 1 else ranges_add(dst, cps[0])
            if not ok:
                print(f'L{ln} 已在目标，跳过: {raw.strip()[:60]}')
                skipped += 1
            else:
                applied += 1
        else:  # 移动
            if not source:
                print(f'L{ln} 移动缺少源路径，跳过')
                failed += 1
                continue
            src = get_node(roots, source)
            if src is None:
                print(f'L{ln} 源节点不存在: {source}')
                failed += 1
                continue
            if len(cps) > 1:
                removed = seqs_remove(src, cps)
                seqs_add(dst, cps)
            else:
                removed = ranges_remove(src, cps[0])
                ranges_add(dst, cps[0])
            if not removed:
                print(f'L{ln} 字符不在源节点，已添加目标但未删源: {raw.strip()[:60]}')
            applied += 1

    json.dump(data, open(TAGS_JSON, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    print(f'\n完成：应用 {applied}，跳过 {skipped}，失败 {failed}')
    print('已写回 标签.json')


if __name__ == '__main__':
    main()

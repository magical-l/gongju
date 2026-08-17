#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Unicode 升级重生成工具：只更新带 code 的 UCD 节点（文字系统/官方分类/区块），语义节点不动。

用法：
  python upgrade_ucd.py check   # 校验模式：重算 vs 现状，只报告不写入（默认）
  python upgrade_ucd.py apply   # 应用模式：备份后更新 标签.json + 重生成 名字.json

规则：
  - 文字系统：Scripts.txt 直接取各 script 范围；Zzzz（未知文字系统）= 全部码位减已分配 script 并集
  - 官方分类：DerivedGeneralCategory.txt 直接取（Cn 也在文件里）
  - 区块：Blocks.txt 直接取；No_Block（无区块）= 全部码位减已列区块并集
  - 只按 code 更新现有节点的 ranges；新 code 只报告（需人工补中文名），已移除的 code 报告
校验模式可用当前数据自证：Unicode 版本不变时重算应与现状一致（任何差异都是解析逻辑 bug）。
"""
import json
import os
import sys

BASE = os.path.dirname(os.path.abspath(__file__))
REF = os.path.join(BASE, '参考资料')
TAG_FILE = os.path.join(BASE, '标签.json')
MAX_CP = 0x10FFFF


def parse_ucd(filename):
	"""解析 UCD txt：'HEX..HEX ; Code # ...' 或 'HEX ; Code # ...'，返回 {code: [[lo,hi],...]}"""
	out = {}
	with open(os.path.join(REF, filename), encoding='utf-8') as f:
		for line in f:
			if not line or line[0] == '#':
				continue
			body = line.split('#')[0].strip()
			if not body:
				continue
			cp_part, _, code_part = body.partition(';')
			code = code_part.strip()
			cp_part = cp_part.strip()
			if '..' in cp_part:
				lo, hi = cp_part.split('..')
				lo, hi = int(lo, 16), int(hi, 16)
			else:
				lo = hi = int(cp_part, 16)
			out.setdefault(code, []).append([lo, hi])
	return out


def union_ranges(pairs):
	"""区间对并集，返回升序无重叠区间列表；pairs = [[lo,hi],...]"""
	flat = sorted(pairs)
	merged = []
	for lo, hi in flat:
		if merged and lo <= merged[-1][1] + 1:
			merged[-1][1] = max(merged[-1][1], hi)
		else:
			merged.append([lo, hi])
	return merged


def flatten(nested):
	"""[[[lo,hi],...]...] → [[lo,hi],...]（多个 code 的区间合并为一份）"""
	return [p for rs in nested for p in rs]


def complement(pairs):
	"""0..MAX_CP 减 pairs 的补集"""
	gaps = []
	cur = 0
	for lo, hi in union_ranges(pairs):
		if cur < lo:
			gaps.append([cur, lo - 1])
		cur = max(cur, hi + 1)
	if cur <= MAX_CP:
		gaps.append([cur, MAX_CP])
	return gaps


def build_axes():
	scripts = parse_ucd('Scripts.txt')
	script_ranges = {c: union_ranges(r) for c, r in scripts.items()}
	script_ranges['Zzzz'] = complement(flatten(scripts.values()))

	cats = parse_ucd('DerivedGeneralCategory.txt')
	cat_ranges = {c: union_ranges(r) for c, r in cats.items()}

	blocks = parse_ucd('Blocks.txt')
	block_ranges = {c: union_ranges(r) for c, r in blocks.items()}
	block_ranges['No_Block'] = complement(flatten(blocks.values()))

	return {
		'文字系统': script_ranges,
		'官方分类': cat_ranges,
		'区块': block_ranges,
	}


def main():
	mode = sys.argv[1] if len(sys.argv) > 1 else 'check'
	with open(TAG_FILE, encoding='utf-8') as f:
		data = json.load(f)
	axes = build_axes()

	total_nodes = 0
	updated = 0
	reported = []

	for axis_name, code_map in axes.items():
		axis = data['roots'][axis_name]['children']
		for node_name, node in axis.items():
			code = node.get('code')
			if not code:
				continue
			total_nodes += 1
			new_ranges = code_map.get(code)
			if new_ranges is None:
				reported.append(f'[{axis_name}/{node_name}] code={code} 源文件中已不存在，需人工确认')
				continue
			old_count = len(node.get('ranges') or [])
			if node.get('ranges') != new_ranges:
				if mode == 'apply':
					node['ranges'] = new_ranges
				reported.append(f'[{axis_name}/{node_name}] code={code} 范围有变: {old_count}段 → {len(new_ranges)}段')
			else:
				updated += 1
		# 新 code 报告
		known = {n.get('code') for n in axis.values() if n.get('code')}
		for code in code_map:
			if code not in known:
				reported.append(f'[新][{axis_name}] code={code} 尚无节点，需补中文名与结构')

	print(f'共 {total_nodes} 个 code 节点；{updated} 个一致，{len(reported)} 条差异/新增报告')
	for r in reported:
		print('  ' + r)

	if mode == 'apply':
		# 备份 + 写回
		bak = TAG_FILE + '.bak'
		with open(TAG_FILE, encoding='utf-8') as f:
			orig = f.read()
		with open(bak, 'w', encoding='utf-8', newline='\n') as f:
			f.write(orig)
		with open(TAG_FILE, 'w', encoding='utf-8', newline='\n') as f:
			json.dump(data, f, ensure_ascii=False, indent=2)
			f.write('\n')
		print(f'已备份 → {os.path.basename(bak)}，已写回 标签.json')
		# 重生成 名字.json（名字层随 Unicode 升级一起重算）
		import build_names
		build_names.main()


if __name__ == '__main__':
	main()

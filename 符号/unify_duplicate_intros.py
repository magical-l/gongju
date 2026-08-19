#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""统一 标签.json 同名节点的 intro（优化12）：同名标签显示相同的简介。

规则：
- 同名 = 名字剥掉「（区块）」后缀后相同（如「西夏文」与「西夏文（区块）」）
- 权威 intro 优先级：文字系统轴 > 区块轴 > 官方分类 > 其他轴（取有 intro 的实例）
  ——文字系统 intro 人工维护，经权威源核对 7 个矛盾对全部正确
- 只改动与权威 intro 不同的节点，重跑安全（已统一的会跳过）
"""
import json
import os
import collections

BASE = os.path.dirname(os.path.abspath(__file__))
TAG_FILE = os.path.join(BASE, '标签.json')


def norm_name(name):
	# 「（区块）」后缀是 4 个字符，用长度切片避免切错
	return name[:-len('（区块）')] if name.endswith('（区块）') else name


def main():
	with open(TAG_FILE, encoding='utf-8') as f:
		data = json.load(f)

	# 收集所有命名节点：轴、名、节点对象
	nodes = []
	def walk(axis, node):
		for name, n in node.get('children', {}).items():
			nodes.append((axis, name, n))
			walk(axis, n)
	for axis, root in data['roots'].items():
		walk(axis, root)

	groups = collections.defaultdict(list)
	for axis, name, n in nodes:
		groups[norm_name(name)].append((axis, name, n))

	changed = []
	skipped = 0
	for norm, group in groups.items():
		if len(group) < 2:
			continue
		# 权威 intro：文字系统 > 区块 > 官方分类 > 其他（取有 intro 的实例）
		authority = None
		for axis in ('文字系统', '区块', '官方分类'):
			for g_axis, name, n in group:
				if g_axis == axis and n.get('intro'):
					authority = (g_axis, name, n['intro'])
					break
			if authority:
				break
		if not authority:
			for g_axis, name, n in group:
				if n.get('intro'):
					authority = (g_axis, name, n['intro'])
					break
		if not authority:
			skipped += 1
			continue
		src_axis, src_name, src_intro = authority
		for g_axis, name, n in group:
			if n.get('intro') != src_intro:
				old = n.get('intro')
				n['intro'] = src_intro
				changed.append((norm, g_axis, name, src_axis, src_name, old, src_intro))

	with open(TAG_FILE, 'w', encoding='utf-8', newline='\n') as f:
		json.dump(data, f, ensure_ascii=False, indent=2)
		f.write('\n')

	n_groups = len(set(c[0] for c in changed))
	print(f'统一 {len(changed)} 个节点 intro（{n_groups} 个同名组）；{skipped} 组无 intro 跳过')
	for norm, g_axis, name, src_axis, src_name, old, new in changed:
		print(f'  [{g_axis}] {name}  ← [{src_axis}] {src_name}')
		print(f'      {old}')
		print(f'    → {new}')


if __name__ == '__main__':
	main()

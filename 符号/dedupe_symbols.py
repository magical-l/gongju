#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""去重 符号数据.js 的 SYMBOLS：107 个重复字符 → 每字符一条目，多组保留，组名冲突首名为主。

修复项：
  - ⛉⛊⛋（U+26C9-26CB）被误标为"雾"挂在天 气组——它们实为将棋/几何图形，从天气组剔除
  - 𝅝（U+1D15D 全音符）被误标"空心二分音符"——剔除该误名
合并规则（同字符多条目）：
  - 不同组 → 全部保留（多标签合法）
  - 同组同名 → 去重
  - 同组不同名 → 首个名为主名，其余并入 alias（便于搜索）
  - ename 取首个非空；alias 全部并集去重；任一条目 dual 则 mode=dual
"""
import json
import os

BASE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(BASE, '符号数据.js')

# 从天气组剔除的字符（错标）
_DROP_WEATHER = {'⛉', '⛊', '⛋'}
# 该字符的误标名（剔除不进别名）
_DROP_ALIAS = {'𝅝': {'空心二分音符'}}


def parse(src_text):
	start = src_text.index('[')
	end = src_text.rindex(']')
	return json.loads(src_text[start:end + 1])


def main():
	with open(SRC, encoding='utf-8') as f:
		text = f.read()
	arr = parse(text)

	merged = []
	seen_char = set()
	for e in arr:
		char = e['char']
		if char in seen_char:
			continue  # 已合并过，跳过（首条目为基准）
		seen_char.add(char)

		groups = {}
		mode = ''
		for src_e in arr:
			if src_e['char'] != char:
				continue
			if src_e.get('mode') == 'dual':
				mode = 'dual'
			for gname, info in src_e['groups'].items():
				if char in _DROP_WEATHER and gname == '天气':
					continue  # 剔除错标天气组
				cur = groups.get(gname)
				name = info['name']
				if cur is None:
					groups[gname] = {
						'name': name,
						'ename': info.get('ename', ''),
						'alias': list(info.get('alias', [])),
					}
					continue
				# 同组再次出现：合并
				if name != cur['name'] and name not in _DROP_ALIAS.get(char, set()):
					# 首名为主，次名并入 alias
					if name not in cur['alias']:
						cur['alias'].append(name)
				for a in info.get('alias', []):
					if a and a not in cur['alias']:
						cur['alias'].append(a)
				if not cur['ename'] and info.get('ename'):
					cur['ename'] = info['ename']

		# 剔除空 groups（如只挂天气且被剔除）
		groups = {k: v for k, v in groups.items() if v}
		entry = {'char': char, 'groups': groups}
		if mode:
			entry['mode'] = mode
		merged.append(entry)

	with open(SRC, 'w', encoding='utf-8', newline='\n') as f:
		f.write('const SYMBOLS = [\n')
		for i, e in enumerate(merged):
			line = json.dumps(e, ensure_ascii=False, separators=(',', ':'))
			f.write('\t' + line + (',' if i < len(merged) - 1 else '') + '\n')
		f.write('];\n')

	print(f'原 {len(arr)} 条 → 去重后 {len(merged)} 条')
	chars = [e['char'] for e in merged]
	print(f'唯一字符: {len(set(chars))}')
	# 验证 雾 已剔
	wea = [e for e in merged if '天气' in e['groups']]
	bad = [e['char'] for e in wea if e['char'] in _DROP_WEATHER]
	print(f'天气组残留错标: {bad}')


if __name__ == '__main__':
	main()

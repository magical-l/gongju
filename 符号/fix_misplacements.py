#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""修正 标签.json 的语义标签错位。

1. 球类运动：剔除非球类成员，移到正确归属标签（跳棋/将棋→棋类/其他棋类，击剑/拳击/武术→武术、格斗，
   滑雪/滑冰/雪橇/冰壶→冰雪运动，钓鱼/飞镖→其他运动，田径服→田径运动、跑步，潜水→水上运动）
2. 年龄与性别：剔除死亡符号（⚰ 棺材、⚱ 骨灰瓮、⛼ 墓碑）
"""
import json
import os

BASE = os.path.dirname(os.path.abspath(__file__))
TAG_FILE = os.path.join(BASE, '标签.json')

# 球类运动 → 目标标签 的错位成员
MOVES = {
	'武术、格斗': [0x2694, 0x1F94A, 0x1F94B],        # ⚔ 🥊 🥋
	'冰雪运动': [0x26F7, 0x26F8, 0x1F3BF, 0x1F6F7, 0x1F94C],  # ⛷ ⛸ 🎿 🛷 🥌
	'其他运动': [0x1F3A3, 0x1F3AF],                   # 🎣 🎯
	'田径运动、跑步': [0x1F3BD],                       # 🎽
	'水上运动': [0x1F93F],                            # 🤿
}
BOARD_GAMES = [0x26C0, 0x26C1, 0x26C2, 0x26C3, 0x26C9, 0x26CA]  # 跳棋/将棋 → 其他棋类
DEATH_SYMBOLS = [0x26B0, 0x26B1, 0x26FC]             # ⚰ ⚱ ⛼ 从 年龄与性别 剔除


def add_cp(ranges, cp):
	"""把码位并入升序区间列表（合并相邻）"""
	ranges = [list(r) for r in ranges]
	for r in ranges:
		if r[0] <= cp <= r[1]:
			return ranges
	insert = []
	done = False
	for i, (lo, hi) in enumerate(ranges):
		if cp < lo:
			insert = [i, cp]
			done = True
			break
	if not done:
		insert = [len(ranges), cp]
	i, cp = insert
	ranges.insert(i, [cp, cp])
	# 合并相邻
	merged = [ranges[0]]
	for lo, hi in ranges[1:]:
		plo, phi = merged[-1]
		if lo <= phi + 1:
			merged[-1] = [plo, max(phi, hi)]
		else:
			merged.append([lo, hi])
	return merged


def remove_cps(ranges, cps):
	"""从区间列表剔除多个码位"""
	bad = set(cps)
	out = []
	for lo, hi in ranges:
		# 在 [lo,hi] 内找出不被剔除的连续段
		seg = []
		cp = lo
		while cp <= hi:
			if cp not in bad:
				seg.append(cp)
			cp += 1
		if seg:
			# 压缩成区间
			s = p = seg[0]
			for c in seg[1:]:
				if c == p + 1:
					p = c
				else:
					out.append([s, p])
					s = p = c
			out.append([s, p])
	return out


def main():
	with open(TAG_FILE, encoding='utf-8') as f:
		data = json.load(f)

	ty = data['roots']['体育、游戏、文体娱乐']['children']
	ball = ty['球类运动']

	# 1. 球类运动 剔除全部错位成员
	all_bad = []
	for cps in MOVES.values():
		all_bad += cps
	all_bad += BOARD_GAMES
	ball['ranges'] = remove_cps(ball['ranges'], all_bad)

	# 2. 移入目标标签
	for name, cps in MOVES.items():
		node = ty[name]
		if 'ranges' not in node:
			node['ranges'] = []
		for cp in cps:
			node['ranges'] = add_cp(node['ranges'], cp)
		node['src'] = ['draft']

	# 3. 棋类/其他棋类
	qilei = ty['棋类']['children']['其他棋类']
	if 'ranges' not in qilei:
		qilei['ranges'] = []
	for cp in BOARD_GAMES:
		qilei['ranges'] = add_cp(qilei['ranges'], cp)
	qilei['src'] = ['draft']

	# 4. 年龄与性别 剔除死亡符号
	age = data['roots']['人与身体']['children']['年龄与性别']
	age['ranges'] = remove_cps(age['ranges'], DEATH_SYMBOLS)

	with open(TAG_FILE, 'w', encoding='utf-8', newline='\n') as f:
		json.dump(data, f, ensure_ascii=False, indent=2)
		f.write('\n')

	# 报告
	ball_cps = [cp for lo, hi in ball['ranges'] for cp in range(lo, hi + 1)]
	print(f'球类运动 剩余 {len(ball_cps)} 字:')
	for cp in ball_cps:
		print(f'  U+{cp:04X} {chr(cp)}')
	for name in MOVES:
		node = ty[name]
		cps = [cp for lo, hi in node['ranges'] for cp in range(lo, hi + 1)]
		print(f'{name}: {[hex(c) for c in cps]}')
	qcps = [cp for lo, hi in qilei['ranges'] for cp in range(lo, hi + 1)]
	print(f'其他棋类: {[hex(c) for c in qcps]}')
	age_cps = [cp for lo, hi in age['ranges'] for cp in range(lo, hi + 1)]
	print(f'年龄与性别 剩余 {len(age_cps)} 字: {[chr(c) for c in age_cps]}')


if __name__ == '__main__':
	main()

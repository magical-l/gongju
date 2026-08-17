#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""从 UnicodeData.txt 生成 名字.json（码位→官方名）。

输出结构：
  {
    "_v": "17.0.0",
    "names":    [[码位, 官方名], ...] 按码位升序。Hangul 音节为算法推导名，已展开。
    "patterns": [[起, 止, 名前缀], ...] CJK/Tangut 表意字，名 = 前缀 + 码位大写十六进制。
  }

命名规则（对应 UnicodeData.txt 字段）：
  - 普通字符：field 2 官方名
  - <control>：field 10（Unicode 1.0 名），空则无名（如 U+0080）
  - <CJK/Tangut Ideograph, First/Last>：名字从码位推导，进 patterns
  - <Hangul Syllable, First/Last>：算法名（HANGUL SYLLABLE xxx），展开进 names
  - 代理区 / 私用区：无名，跳过

Unicode 升级时重跑本脚本即可，只产出名字层，不碰 标签.json。
"""
import json
import os
import re

BASE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(BASE, '参考资料', 'UnicodeData.txt')
OUT = os.path.join(BASE, '名字.json')

# ---- Hangul 音节算法 ----
_SBASE, _LCOUNT, _VCOUNT, _TCOUNT = 0xAC00, 19, 21, 28
_NCOUNT, _SCOUNT = _VCOUNT * _TCOUNT, 19 * 21 * 28
_L_JAMO = ['G', 'GG', 'N', 'D', 'DD', 'R', 'M', 'B', 'BB', 'S', 'SS', '',
           'J', 'JJ', 'C', 'K', 'T', 'P', 'H']

# UnicodeData 的 First/Last 标记名是缩写，官方名前缀要展开：
# <CJK Ideograph> 实际前缀是 CJK UNIFIED IDEOGRAPH-（标记里没有 UNIFIED）。
_IDEO_PREFIX = {
	'CJK Ideograph': 'CJK UNIFIED IDEOGRAPH-',
	'Tangut Ideograph': 'TANGUT IDEOGRAPH-',
	'Tangut Ideograph Supplement': 'TANGUT IDEOGRAPH SUPPLEMENT-',
}
for _ext in 'ABCDEFGHIJ':
	_IDEO_PREFIX['CJK Ideograph Extension ' + _ext] = (
		'CJK UNIFIED IDEOGRAPH EXTENSION ' + _ext + '-')
_V_JAMO = ['A', 'AE', 'YA', 'YAE', 'EO', 'E', 'YEO', 'YE', 'O', 'WA', 'WAE',
           'OE', 'YO', 'U', 'WEO', 'WE', 'WI', 'YU', 'EU', 'YI', 'I']
_T_JAMO = ['', 'G', 'GG', 'GS', 'N', 'NJ', 'NH', 'D', 'L', 'LG', 'LM', 'LB',
           'LS', 'LT', 'LP', 'LH', 'M', 'B', 'BS', 'S', 'SS', 'NG', 'J', 'C',
           'K', 'T', 'P', 'H']


def hangul_name(cp):
	si = cp - _SBASE
	l = _L_JAMO[si // _NCOUNT]
	v = _V_JAMO[(si % _NCOUNT) // _TCOUNT]
	t = _T_JAMO[si % _TCOUNT]
	return 'HANGUL SYLLABLE ' + l + v + t


def main():
	names = {}   # cp -> 官方名（显式 + Hangul）
	patterns = []  # [lo, hi, 前缀]

	with open(SRC, encoding='utf-8') as f:
		for line in f:
			parts = line.rstrip('\n').split(';')
			if len(parts) < 12:
				continue
			cp = int(parts[0], 16)
			name = parts[1]

			m = re.match(r'<(.+?)(?:, (First|Last))?>$', name)
			if m:
				key, edge = m.group(1), m.group(2)
				if key == 'control':
					# 控制字符：官方名在 field 10，空则无名
					if parts[10]:
						names[cp] = parts[10]
				elif key == 'Hangul Syllable' and edge == 'First':
					# 整段算法展开
					for c in range(cp, cp + _SCOUNT):
						names[c] = hangul_name(c)
				elif edge == 'First' and key in _IDEO_PREFIX:
					# CJK/Tangut 表意字范围：记录前缀，名 = 前缀 + 十六进制。
					# 代理区/私用区的 First 标记不在 _IDEO_PREFIX，天然排除。
					patterns.append([cp, 0, _IDEO_PREFIX[key]])
				continue

			if name.startswith('<'):
				continue  # 私用区 / 代理区等，无名
			names[cp] = name

	# 用 Last 补齐 patterns 的止值
	by_key = {}
	for lo, _, prefix in patterns:
		by_key[prefix] = lo
	for line in open(SRC, encoding='utf-8'):
		parts = line.rstrip('\n').split(';')
		if len(parts) < 2:
			continue
		m = re.match(r'<(.+?), Last>$', parts[1])
		if m and m.group(1) in _IDEO_PREFIX:
			prefix = _IDEO_PREFIX[m.group(1)]
			if prefix in by_key:
				by_key[prefix] = [by_key[prefix], int(parts[0], 16)]
	patterns = [[lo, hi, prefix] for prefix, (lo, hi) in sorted(by_key.items())]

	names_list = sorted(names.items())

	data = {'_v': '17.0.0', 'names': names_list, 'patterns': patterns}
	with open(OUT, 'w', encoding='utf-8', newline='\n') as f:
		f.write('{\n')
		f.write('  "_v": "%s",\n' % data['_v'])
		f.write('  "names": [\n')
		for i, (cp, name) in enumerate(data['names']):
			f.write('%s[%d, %s]%s\n' % (
				'  ',
				cp,
				json.dumps(name),
				',' if i < len(data['names']) - 1 else ''))
		f.write('  ],\n')
		f.write('  "patterns": %s\n' % json.dumps(patterns))
		f.write('}\n')

	print('写入 %s' % OUT)
	print('显式名条目: %d' % len(names_list))
	print('范围模式: %d' % len(patterns))
	bytes_size = os.path.getsize(OUT)
	print('文件大小: %.1f KB' % (bytes_size / 1024))


if __name__ == '__main__':
	main()

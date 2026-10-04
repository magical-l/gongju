# -*- coding: utf-8 -*-
"""从 reclass4.py 抽出判定部分，做成可入库模块：路径按 __file__ 定位，不依赖 CWD。"""
import io

src = io.open('tmp/reclass4.py', encoding='utf-8').read()
core = src[:src.index("node = load_tags()")].rstrip() + "\n"

# 路径与导入改成与 CWD 无关
core = core.replace(
    "import json, re, collections, sys\n\nsys.path.insert(0, '符号')\n"
    "from datatool import load_tags, read_data, UNICODE_NAMES\n",
    "import os, re, collections\n\n"
    "# 本文件在 符号/docs/任务/ 下；参考资料在同项目 符号/参考资料/\n"
    "_HERE = os.path.dirname(os.path.abspath(__file__))\n"
    "_REF = os.path.join(_HERE, '..', '..', '参考资料', 'Unikemet.txt')\n")
core = core.replace("for line in open('符号/参考资料/Unikemet.txt', encoding='utf-8'):",
                    "for line in open(_REF, encoding='utf-8'):")

header = '''# -*- coding: utf-8 -*-
# ✓035 埃及象形「形象型标签」判定表（与 ✓035-埃及象形形状重判.md 配套）
#
# 依据：符号/参考资料/Unikemet.txt 的 kEH_Desc（Unicode 官方，采自 Gardiner 著作）
#       —— 「这个符号画的是什么」。
# ⚠️ 不要拿官方名里的 Gardiner 字母（N035 的 N）当形状：那是主题分类，不是形状。
# ⚠️ 组字母也不要从官方名取——官方名里有些码位用的是 UniK 编号（如 13131 叫 F045A），
#    要取 Unikemet 的 kEH_HG（那才是 Gardiner 码）。见 letter()。
#
# 主体 = 描述的首个名词短语（截到第一个逗号/句号，再去掉 with/holding/inside/upon/… 引出的附带物）。
# 判序：动物 → 人/人体部位 → 植物 → 器物 → 主体本身是几何形 → Gardiner 组兜底。
#
# 这 1046 个的实际来源：
#   917 条 classify(kEH_Desc)       ← 本模块
#    10 条 OVERRIDE                 ← 本模块
#    12 条 按 kEH_AltSeq 继承变体的判定（无自己的描述；多值的 AltSeq 是替代序列，不继承）
#   107 条 无 kEH_Desc 也无变体指向  ← 保留逐页看图判的结果，见 ✓035 文档 §3
#
# 配套：**语义型**标签另按 参考资料/NamesList.txt 的「怎么用」挂（本轮未做）。
'''
io.open('符号/docs/任务/✓035-埃及象形形状重判.map.py', 'w', encoding='utf-8', newline='\n').write(header + core)
print('written')

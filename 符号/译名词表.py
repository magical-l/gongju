# -*- coding: utf-8 -*-
"""符号页译名词表 —— 权威词表。由一次性脚本生成，此后人工增补。

本文件导出四个结构：

  WORD    词 → 中文译法。英文实词的默认译法，逐词替换用。
  PHRASE  整块短语 → 中文。优先于 WORD 命中（先替长短语再替单词）。
  ENGLISH 真英文词黑名单：确认为英语实词的词，必须逐词译出。
  KEEP    保留原样的词集合 = set().union(各 _KEEP_* 类目) － ENGLISH。
          判据：**不是英语实词**，而是某个文字系统的
          记音/音节名/字母本名/楔形转写/语言或文字专名/编号。
          这些词不该译成中文，名字里原样保留（如「蒙古字母 ALI GALI ...」
          里的 ALI GALI）。ENGLISH 是唯一权威，KEEP 在文件末尾统一减它，
          别在 _KEEP_* 里再抄一份减法表（历史副本曾与 ENGLISH 脱节）。

KEEP 的判据展开（**别把真英文词塞进来**）：
  · 音节名   —— 各文字系统音节表的记音，如 NA / KA / RI / MU / SHE
  · 字母名   —— 字母本名，如 ALEPH / BETH / YODH / MEEM / YEH / QAF
  · 楔形转写 —— 苏美尔/阿卡德记音，如 IGI / EZEN / NINDA / DUG / LAGAB / SAG
  · 文字专名 —— 语言/文字系统的名字，如 ORKHON / YENISEI / MANCHU / COPTIC
  · 编号     —— 带数字的编号，如 CM001 / NL001 / GI4 / LAK-648
  · 其他记音 —— 藏文/阿拉伯/叙利亚/彝文等转写，如 RGYA / ALAYHI / BZUNG
  反例（**属于 WORD 该译，不能进 KEEP**）：HINGE / CURVE / STRAIGHT / MARK /
  WITH / FORM / VESSEL / DAMAGED / INSULAR / DOTLESS / MAN / COW / PHASE …
  这些词在下方 ENGLISH 集合里；KEEP 与 ENGLISH 严格互斥。

用法（清单生成器在 符号/待译清单.py，只读本文件，不反写）：
    python 符号/待译清单.py            # 刷新 待译清单.json 并打印统计
    python 符号/待译清单.py --top 50   # 顺带列出每节挡路最多的 50 个词

清单分三节（详见 符号/待译清单.py 文件头）：
    a           WORD/PHRASE 里有译法、名字里却仍留拉丁原文 → 译法没应用
    b           名字里有 WORD/PHRASE/KEEP 都查不到的英文词 → 词表缺译法
    keep_suspect KEEP 里像英文常用词的项（AT / IN / NO 之类），只列给人过目

改词表的规矩：
  · 要译的新英文词        → 加进 WORD（或整块加进 PHRASE）
  · 又发现一个专名/音节名  → 加进下方对应类别的 _KEEP_* 集合
  · 拿不准的词            → 一律留在 ENGLISH 之外、也不要进 KEEP，
                            让它继续出现在待译清单里，别替它做决定
  · 某词被确认是英文实词   → 加进 ENGLISH（KEEP 会自动把它排除掉）
"""


# ---- 英文词 → 中文译法 ----
# 2026-09 复核：BAR(横杠) / GUNU(古努) / TWO(二) 三条已从本表挪走 —— 逐条查过语料
# （符号/中文名.json）里它们的**每一处**出现，全是记音而非英文实义：
#   BAR  ×4   楔形文字符号 BAR / GA2×BAR+RA / KA×BAR / URU×BAR
#   GUNU ×52  全部是楔形转写名尾（… GUNU），苏美尔记音
#   TWO  ×2   加拿大原住民音节TWO / 西-克里TWO，是音节音值不是数字二
# 三条都改入下方对应 _KEEP_* 类目。本表与 KEEP 若同时命中，以 KEEP 为准
# （待译清单.py 的 akey = WORD - KEEP），所以留在本表只会让生成端继续译错，
# 一并删掉才是「一词一归属」。
WORD = {
    'ABBREVIATION':                                '缩写',
    'ABOVE':                                       '上方',
    'ACCENT':                                      '音符',
    'ACROPHONIC':                                  '表音',
    'ACUTE':                                       '锐音符',
    'AND':                                         '与',
    'ANUSVARA':                                    '随韵',
    'APL':                                         'APL',
    'APOSTROPHE':                                  '撇号',
    'ARABIC':                                      '阿拉伯',
    'ARCHAIC':                                     '古式',
    'ARROW':                                       '箭头',
    'ARROWHEAD':                                   '箭头',
    'ATTACHED':                                    '附着',
    'BELOW':                                       '下方',
    'BELT':                                        '束带',
    'BLACK':                                       '实心',
    'BREVE':                                       '短音符',
    'CANDRABINDU':                                 '月牙鼻化符',
    'CAPITAL':                                     '大写',
    'CARON':                                       '倒折符',
    'CARRIER':                                     '卡里尔',
    'CEDILLA':                                     '下加符',
    'CEILING':                                     '上限',
    'CENTERED':                                    '居中',
    'CHARACTER':                                   '字符',
    'CIRCLE':                                      '圆圈',
    'CIRCUMFLEX':                                  '抑扬符',
    'CLAN':                                        '部族',
    'CLOSED':                                      '闭',
    'COLON':                                       '冒号',
    'COMBINING':                                   '组合',
    'COMMA':                                       '逗号',
    'COMPONENT':                                   '部件',
    'CONSONANT':                                   '辅音',
    'CREE':                                        '克里',
    'CRESCENTS':                                   '月牙',
    'CROSS':                                       '十字',
    'CROSSED':                                     '交叉',
    'CURL':                                        '卷曲',
    'DANDA':                                       '竖线句号',
    'DASH':                                        '破折号',
    'DASIA':                                       '粗气符',
    'DESCENDER':                                   '下伸部',
    'DIAERESIS':                                   '分音符',
    'DIAGONAL':                                    '对角',
    'DIALYTIKA':                                   '分音符',
    'DIGIT':                                       '数字',
    'DOT':                                         '点',
    'DOTS':                                        '点',
    'DOUBLE':                                      '双',
    'EAST':                                        '东',
    'EIGHT':                                       '八',
    'EPACT':                                       '岁差',
    'EPIGRAPHIC':                                  '铭文',
    'EQUALS':                                      '等号',
    'EXCLAMATION':                                 '叹',
    'EXTENDED':                                    '扩展',
    'FINAL':                                       '词尾',
    'FISHHOOK':                                    '鱼钩',
    'FIST':                                        '拳',
    'FIVE':                                        '五',
    'FLOOR':                                       '下限',
    'FLOORPLANE':                                  '地面',
    'FORM':                                        '形',
    'FOUR':                                        '四',
    'FRACTION':                                    '分数',
    'GRAVE':                                       '钝音符',
    'GREAT':                                       '大',
    'GREEK':                                       '希腊',
    'HALF':                                        '半',
    'HAND':                                        '手',
    'HIGH':                                        '高',
    'HITTING':                                     '击',
    'HOOK':                                        '钩',
    'HORA':                                        '时',
    'HORIZONTAL':                                  '横',
    'HORN':                                        '角',
    'HUNDRED':                                     '百',
    'HYPHEN':                                      '连字符',
    'INDEX':                                       '索引',
    'INDIC':                                       '印度',
    'INITIAL':                                     '首式',
    'INVERTED':                                    '倒',
    'ISOLATED':                                    '独立式',
    'KARSHANA':                                    '卡尔沙纳',
    'KORONIS':                                     '弯钩符',
    'LARGE':                                       '大',
    'LEFT':                                        '左',
    'LEG':                                         '腿',
    'LETTER':                                      '字母',
    'LIGATURE':                                    '连字',
    'LINE':                                        '线',
    'LITTLE':                                      '小',
    'LONG':                                        '长',
    'LOW':                                         '低',
    'LOWER':                                       '下',
    'MACRON':                                      '长音符号',
    'MARK':                                        '符号',
    'MATHEMATICAL':                                '数学',
    'MEDIAL':                                      '中式',
    'MIDDLE':                                      '中',
    'MINUS':                                       '减',
    'MODIFIER':                                    '修饰',
    'MOVEMENT':                                    '动作',
    'NEW':                                         '新',
    'NINE':                                        '九',
    'NORTH':                                       '北',
    'NUMBER':                                      '数',
    'NUMERAL':                                     '数字',
    'NUMERIC':                                     '数字',
    'OBLIQUE':                                     '斜',
    'OCR':                                         'OCR',
    'OGONEK':                                      '鼻化符',
    'OLD':                                         '古',
    'ONE':                                         '一',
    'OPEN':                                        '开',
    'ORNAMENT':                                    '装饰',
    'OVER':                                        '叠',
    'OXIA':                                        '锐音符',
    'PALATAL':                                     '硬腭',
    'PATTERN':                                     '图案',
    'PERISPOMENI':                                 '扬抑符',
    'PLUS':                                        '加',
    'PRIME':                                       '撇',
    'PROSGEGRAMMENI':                              '前加ι',
    'PSILI':                                       '柔气符',
    'PUNCTUATION':                                 '标点',
    'QUARTER':                                     '四分之一',
    'QUESTION':                                    '问',
    'RADICAL':                                     '部首',
    'RETROFLEX':                                   '卷舌',
    'REVERSED':                                    '反向',
    'RIGHT':                                       '右',
    'RING':                                        '圆圈',
    'ROTATION':                                    '旋转',
    'SECTION':                                     '节',
    'SEMIVOWEL':                                   '半元音',
    'SEVEN':                                       '七',
    'SHADOWED':                                    '带阴影',
    'SHAN':                                        '掸',
    'SHORT':                                       '短',
    'SIGN':                                        '符号',
    'SINGLE':                                      '单',
    'SIX':                                         '六',
    'SMALL':                                       '小型',
    'SOUTH':                                       '南',
    'SQUARE':                                      '方形',
    'STROKE':                                      '斜线',
    'SUBJOINED':                                   '下接',
    'SUBSCRIPT':                                   '下标',
    'SUPERSCRIPT':                                 '上标',
    'SYLLABLE':                                    '音节',
    'SYMBOL':                                      '符号',
    'TAIL':                                        '尾',
    'TEN':                                         '十',
    'THOUSAND':                                    '千',
    'THREE':                                       '三',
    'THUMB':                                       '拇指',
    'TILDE':                                       '波浪号',
    'TIMES':                                       '乘',
    'TONE':                                        '声调',
    'TONOS':                                       '音调符',
    'TOPBAR':                                      '顶横杠',
    'TRIANGLE':                                    '三角',
    'TRIPLE':                                      '三',
    'TURNED':                                      '翻转',
    'UPPER':                                       '上',
    'VARIA':                                       '钝音符',
    'VERTICAL':                                    '竖',
    'VERTICALLY':                                  '竖',
    'VISARGA':                                     '止韵',
    'VOCALIC':                                     '元音性',
    'VOWEL':                                       '元音',
    'WALLPLANE':                                   '壁面',
    'WEST':                                        '西',
    'WHITE':                                       '空心',
    'WITH':                                        '带',
    'YPOGEGRAMMENI':                               '下加ι',
    'ZERO':                                        '零',
}

# ---- 整块短语 → 中文 ----
PHRASE = {
    'ACUTE ACCENT':                                '锐音符',
    'ALEF MAKSURA':                                '短尾alif',
    'ARROWHEAD ABOVE':                             '上方箭头',
    'ARROWHEAD BELOW':                             '下方箭头',
    'CAPITAL LETTER':                              '大写字母',
    'CIRCUMFLEX ACCENT':                           '抑扬符',
    'COMMA ABOVE':                                 '上方逗号',
    'DOT ABOVE':                                   '上方点',
    'DOT BELOW':                                   '下方点',
    'DOTS ABOVE':                                  '上方点',
    'DOTS BELOW':                                  '下方点',
    'DOTS VERTICALLY ABOVE':                       '上方竖直点',
    'DOTTED LUNATE SIGMA':                         '带点月牙σ',
    'DOUBLE ACUTE ACCENT':                         '双锐音符',
    'DOUBLE GRAVE ACCENT':                         '双钝音符',
    'DOUBLE VERTICAL LINE ABOVE':                  '上方双竖线',
    'EIGHT TWELFTHS':                              '十二分之八',
    'ELEVEN TWELFTHS':                             '十二分之十一',
    'FINAL SIGMA':                                 '词尾σ',
    'FISH HOOK':                                   '鱼钩',
    'FIVE TWELFTHS':                               '十二分之五',
    'FOUR TWELFTHS':                               '十二分之四',
    'GLOTTAL STOP':                                '声门塞音',
    'GRAVE ACCENT':                                '钝音符',
    'HARD SIGN':                                   '硬音符',
    'HORIZONTAL LINE':                             '横线',
    'LEFT ARROWHEAD ABOVE':                        '上方左箭头',
    'LEFT LEG':                                    '左腿',
    'LONG RIGHT LEG':                              '长右腿',
    'LONG SOLIDUS':                                '长斜杠',
    'LONG STROKE':                                 '长斜线',
    'LUNATE SIGMA':                                '月牙σ',
    'MIDDLE DOT':                                  '中点',
    'MIDDLE HOOK':                                 '中钩',
    'MIDDLE TILDE':                                '中波浪号',
    'NINE TWELFTHS':                               '十二分之九',
    'ONE EIGHTH':                                  '八分之一',
    'ONE EIGHTIETH':                               '八十分之一',
    'ONE FIFTH':                                   '五分之一',
    'ONE FORTIETH':                                '四十分之一',
    'ONE HALF':                                    '二分之一',
    'ONE ONE-HUNDRED-AND-SIXTIETH':                '一百六十分之一',
    'ONE QUARTER':                                 '四分之一',
    'ONE SIXTEENTH':                               '十六分之一',
    'ONE SIXTY-FOURTH':                            '六十四分之一',
    'ONE TENTH':                                   '十分之一',
    'ONE THIRTY-SECOND':                           '三十二分之一',
    'ONE THREE-HUNDRED-AND-TWENTIETH':             '三百二十分之一',
    'ONE TWELFTH':                                 '十二分之一',
    'ONE TWENTIETH':                               '二十分之一',
    'OPEN E':                                      '开e',
    'OPEN O':                                      '开o',
    'PALATAL HOOK':                                '硬腭钩',
    'RETROFLEX HOOK':                              '卷舌钩',
    'REVERSED COMMA ABOVE':                        '上方反向逗号',
    'REVERSED LUNATE SIGMA':                       '反向月牙σ',
    'RIGHT ARROWHEAD ABOVE':                       '上方右箭头',
    'RIGHT LEG':                                   '右腿',
    'RING ABOVE':                                  '上方圆圈',
    'RING BELOW':                                  '下方圆圈',
    'SEVEN TWELFTHS':                              '十二分之七',
    'SHORT STROKE':                                '短斜线',
    'SIX TWELFTHS':                                '十二分之六',
    'SMALL LETTER':                                '小写字母',
    'SOFT SIGN':                                   '软音符',
    'TEN TWELFTHS':                                '十二分之十',
    'THREE DOTS ABOVE':                            '上方三点',
    'THREE DOTS BELOW':                            '下方三点',
    'THREE DOTS VERTICALLY ABOVE':                 '上方竖直三点',
    'THREE EIGHTIETHS':                            '八十分之三',
    'THREE QUARTERS':                              '四分之三',
    'THREE SIXTEENTHS':                            '十六分之三',
    'THREE SIXTY-FOURTHS':                         '六十四分之三',
    'THREE TWELFTHS':                              '十二分之三',
    'TONE FIVE':                                   '第五声',
    'TONE FOUR':                                   '第四声',
    'TONE ONE':                                    '第一声',
    'TONE SIX':                                    '第六声',
    'TONE THREE':                                  '第三声',
    'TONE TWO':                                    '第二声',
    'TOP BAR':                                     '顶横杠',
    'TURNED COMMA ABOVE':                          '上方翻转逗号',
    'TWO DOTS ABOVE':                              '上方两点',
    'TWO DOTS BELOW':                              '下方两点',
    'TWO DOTS VERTICALLY ABOVE':                   '上方竖直两点',
    'TWO DOTS VERTICALLY BELOW':                   '下方竖直两点',
    'TWO TWELFTHS':                                '十二分之二',
    'VERTICAL LINE':                               '竖线',
    'VERTICAL LINE ABOVE':                         '上方竖线',
    'VERTICALLY ABOVE':                            '上方竖排',
    'VERTICALLY BELOW':                            '下方竖排',
}

# ---- 保留原样的词：按「出现最多的语境」归类，仅作注释用 ----
# 音节名：各文字系统音节表的记音 —— 1789
_KEEP_SYLLABLE = set("""
    AAI AAU AAY AEDA AELA AHH AIVILIK ANAP AW AX BAP BAT
    BAX BBAA BBAP BBAT BBAX BBEE BBEP BBEX BBI BBIE BBIEP BBIET
    BBIEX BBIP BBIT BBIX BBO BBOP BBOT BBOX BBU BBUO BBUOP BBUOX
    BBUP BBUR BBURX BBUT BBUX BBY BBYP BBYT BBYX BEAVER BEE BEP
    BEX BHATTIPROLU BHE BHEE BHI BHO BHOO BHU BIE BIEP BIET BIEX
    BIP BIX BOA BOO BOP BOT BOX BUO BUOP BUOX BUP BURX
    BUT BUX BWA BWE BWEE BWI BYP BYR BYRX BYT BYX CAA
    CAAI CAP CAT CAU CAX CCA CCAA CCE CCEE CCHA CCHAA CCHE
    CCHEE CCHHA CCHHAA CCHHE CCHHEE CCHHI CCHHO CCHHU CCHI CCHO CCHU CCI
    CCO CCU CEE CEP CEX CHAA CHAP CHAT CHAU CHAX CHEE CHEINAP
    CHEP CHET CHEX CHOA CHOP CHOT CHOX CHU CHUO CHUOP CHUOT CHUOX
    CHUP CHUR CHURX CHUX CHWA CHY CHYP CHYR CHYRX CHYT CHYX CI
    CIE CIEP CIET CIEX CII CIP CIT CIX COA COO COP COT
    COX CU CUO CUOP CUOX CUP CUR CURX CUT CUX CWA CWAA
    CWE CWI CWII CWO CWOO CY CYP CYR CYRX CYT CYX DAA
    DAT DAX DDAA DDAP DDAT DDAX DDE DDEE DDEP DDEX DDHAA DDHE
    DDHEE DDHI DDHU DDI DDIE DDIEP DDIEX DDIP DDIT DDIX DDO DDOA
    DDOP DDOT DDOX DDU DDUO DDUOP DDUOX DDUP DDUR DDURX DDUT DDUX
    DDWA DEE DEKA DENE DEP DEX DHE DHEE DHHA DHHE DHHEE DHHI
    DHHO DHHOO DHHU DHI DHO DHOO DHU DIE DIEP DIEX DIGA DIP
    DIRGA DIT DIX DLE DLEE DLI DLO DLU DOA DOO DOP DOX
    DUO DUOX DUP DURX DUT DUX DWA DZAA DZEE DZI DZO DZU
    EEN EI EX FAA FAAI FAP FAT FAX FII FIP FIT FIX
    FOO FOP FOX FUA FUP FUR FURX FUT FUX FWA FWAA FWE
    FWEE FWI FY FYA FYP FYT FYX GAETTA GAT GAX GAYANUKITTA GBE
    GBEE GBEN GBI GBO GBON GBOO GBU GEE GEN GEP GET GEX
    GGAA GGAP GGAT GGAX GGE GGEE GGEP GGET GGEX GGI GGIE GGIEP
    GGIEX GGIT GGIX GGO GGOP GGOT GGOX GGU GGUO GGUOP GGUOT GGUOX
    GGUP GGUR GGURX GGUT GGUX GGWA GGWAA GGWE GGWEE GGWI GHEE GHI
    GHO GHU GIE GIEP GIET GIEX GIP GIT GIX GOA GOO GOP
    GOT GOX GUAN GUEI GUO GUOP GUOT GUOX GUP GURX GUT GUX
    GWA GWAA GWE GWEE GWI GWU GYA GYAA GYE GYEE GYI GYO
    GYU HAA HAARU HAP HAU HAX HEE HEEI HEN HEP HEX HHA
    HHE HHEE HHI HHO HHU HHWA HHWE HHWEE HHWI HHYA HHYAA HHYE
    HHYEE HHYI HHYO HHYU HIEX HII HIN HIT HK HLAP HLAT HLAU
    HLAX HLE HLEP HLEX HLIE HLIEP HLIEX HLIP HLIT HLIX HLO HLOP
    HLOX HLU HLUO HLUOP HLUOX HLUP HLUR HLURX HLUT HLUX HLY HLYP
    HLYR HLYRX HLYT HLYX HMA HMAP HMAT HMAX HMI HMIE HMIEP HMIEX
    HMIP HMIT HMIX HMO HMOP HMOT HMOX HMU HMUO HMUOP HMUOX HMUP
    HMUR HMURX HMUT HMUX HMY HMYP HMYR HMYRX HMYX HNAP HNAT HNAU
    HNAX HNE HNEP HNEX HNI HNIE HNIEP HNIET HNIEX HNIP HNIT HNIX
    HNOP HNOT HNOX HNUO HNUOX HNUT HOA HON HOO HOOU HOP HOT
    HOX HUAN HUN HUO HUOP HUOT HUOX HWA HWE HWEE HWI HWO
    HWU HXA HXAP HXAT HXAX HXE HXEP HXEX HXI HXIE HXIEP HXIET
    HXIEX HXIP HXIT HXIX HXO HXOP HXOT HXOX HXUO HXUOP HXUOT HXUOX
    IA IANG IEP IET IEX II ILUT INAP IONG IP IS IX
    JAA JEE JI JIE JIEP JIET JIEX JIP JIT JIX JJE JJEE
    JJI JJIE JJIEP JJIET JJIEX JJIP JJIT JJIX JJO JJOP JJOT JJOX
    JJU JJUO JJUOP JJUOX JJUP JJUR JJURX JJUT JJUX JJY JJYP JJYT
    JJYX JO JOA JOO JOP JOT JOX JU JUO JUOP JUOT JUOX
    JUP JUR JURX JUT JUU JUX JWA JY JYP JYR JYRX JYT
    JYX KAA KAAB KAAI KAAV KAH KAIB KAIV KAN KAP KARO KAT
    KAUB KAUV KAV KAWB KAWV KAX KAY KAYAH KEB KEE KEEB KEEV
    KEP KERET KETTI KEV KEX KHE KHEE KHI KHU KIAB KIAV KIB
    KIE KIEP KIEX KIH KII KIP KIT KIV KIX KK KKE KKEE
    KKI KKO KKU KOA KOB KOH KOMBU KOMBUVA KON KOO KOOB KOOV
    KOP KOT KOV KOX KPAN KPE KPEE KPEN KPI KPO KPOO KPU
    KUA KUAB KUAV KUB KUO KUOX KUP KURX KUV KUX KW KWA
    KWAA KWAY KWB KWE KWEE KWI KWII KWO KWOO KWV KXA KXAA
    KXE KXEE KXI KXO KXU KXWA KXWAA KXWE KXWEE KXWI KYA KYAA
    KYE KYI KYO KYU LAA LAAI LAT LAU LAX LAY LE LEE
    LEP LEX LH LHA LHAA LHE LHEE LHI LHII LHO LHOO LHU
    LIE LIEP LIET LIEX LIGATING LII LIP LIT LIX LL LO LOA
    LOO LOP LOT LOX LUO LUOP LUOT LUOX LUP LUR LURX LUT
    LUX LWA LWAA LWE LWI LWII LWO LWOO LY LYP LYR LYRX
    LYT LYX LYY MAA MAAI MAT MAU MAX MAY MBE MBEE MBI
    MBO MBOO MBU MBUU MEE MELIK MENDUT MEX MGA MGAP MGAT MGAX
    MGBA MGBE MGBEE MGBI MGBO MGBOO MGBU MGE MGEP MGEX MGIE MGIEX
    MGOP MGOT MGOX MGU MGUO MGUOP MGUOX MGUP MGUR MGURX MGUT MGUX
    MH MIE MIEP MIEX MII MIP MIX MOA MOO MOOSE MOP MOT
    MOX MUEN MUN MUO MUOP MUOT MUOX MUP MUR MURE MURX MUT
    MUX MWA MWAA MWE MWEE MWI MWII MWO MWOO MY MYP MYT
    MYX NAAI NAN NAP NATTILIK NAU NAX NAY NBA NBAP NBAT NBAX
    NBI NBIE NBIEP NBIEX NBIP NBIT NBIX NBO NBOP NBOT NBOX NBU
    NBUP NBUR NBURX NBUT NBUX NBY NBYP NBYR NBYRX NBYT NBYX NCHAU
    NDAT NDAX NDE NDEE NDEP NDEX NDI NDIE NDIEX NDIP NDIT NDIX
    NDO NDOLE NDOO NDOP NDOT NDOX NDU NDUP NDUR NDURX NDUT NDUX
    NEE NEP NEX NGAA NGAAI NGAI NGAN NGAP NGAT NGAX NGE NGEN
    NGEP NGEX NGGAA NGGE NGGEE NGGI NGGO NGGOO NGGU NGGUA NGI NGIE
    NGIEP NGIEX NGII NGON NGOO NGOP NGOT NGOX NGUAN NGUO NGUOT NGUOX
    NH NIE NIEP NIEX NII NIP NIT NIX NJA NJIE NJIEP NJIET
    NJIEX NJIP NJIT NJIX NJO NJOO NJOP NJOT NJOX NJU NJUO NJUOX
    NJUP NJUR NJURX NJUX NJY NJYP NJYR NJYRX NJYT NJYX NKAU NLAU
    NNG NNGA NNGAA NNGI NNGII NNGO NNGOO NOA NON NOO NOP NOT
    NOX NOY NRAP NRAT NRAX NRE NREP NRET NREX NRO NROP NROX
    NRU NRUP NRUR NRURX NRUT NRUX NRY NRYP NRYR NRYRX NRYT NRYX
    NTHAU NTSAU NUNG NUO NUOP NUOX NUP NUR NURX NUT NUX NWA
    NWAA NWE NWI NWII NWO NWOO NYAA NYAN NYE NYEE NYEN NYIE
    NYIEP NYIET NYIEX NYIN NYIP NYIT NYIX NYOA NYON NYOO NYOP NYOT
    NYOX NYU NYUN NYUO NYUOP NYUOX NYUP NYUT NYUX NYWA NZAP NZAT
    NZAX NZE NZEX NZI NZIE NZIEP NZIEX NZIP NZIT NZIX NZOP NZOX
    NZU NZUO NZUOX NZUP NZUR NZURX NZUX NZY NZYP NZYR NZYRX NZYT
    NZYX OA OAY OER OEY OG ONAP OO OOE OON OP OX
    OY PAA PAAI PAMEPET PAMINGKAL PANAELAENG PANEULEUNG PANGHULU PANOLONG PANYAKRA PANYIKU PANYUKU
    PASANGAN PAT PAX PAY PENGKAL PEPET PHAA PHE PHEE PHOA PHU PHWA
    PIE PIEP PIEX PILLA PIP PIT PIX PLHAU PO POA POO POP
    POT POX POY PRISHTHAMATRA PUO PUOP PUOX PUP PUR PURX PUT PUX
    PWA PWAA PWE PWEE PWI PWII PWOO PWOY PY PYP PYR PYRX
    PYT PYX QAA QAAI QAI QAQ QAU QE QEE QHA QHAA QHAU
    QHE QHEE QHI QHO QHU QHWA QHWAA QHWE QHWEE QHWI QI QIE
    QIEP QIET QIEX QII QIP QIT QIX QO QOA QOO QOP QOT
    QOX QU QUK QUOP QUOT QUOX QUP QUR QURX QUT QUUV QUX
    QWA QWAA QWE QWEE QWI QY QYA QYAA QYE QYEE QYI QYO
    QYP QYR QYRX QYT QYU QYX RAAI RAP RAT RATHAOR RAU RAX
    RE REP REPA REX ROA ROO ROP ROT ROX RR RRAX RRE
    RREP RRET RREX RRO RROP RROT RROX RRU RRUO RRUOX RRUP RRUR
    RRURX RRUT RRUX RRY RRYP RRYR RRYRX RRYT RRYX RUO RUOP RUOX
    RUP RUR RURX RUT RUX RWA RWAA RWE RWEE RWI RWII RWO
    RWOO RY RYA RYP RYR RYRX RYT RYX RYY SAA SAAI SAP
    SARI SAT SAX SAY SCWA SEBATBEIT SEE SEP SEX SHAA SHAP SHAT
    SHAX SHAY SHEE SHEP SHET SHEX SHI SHO SHOA SHOO SHOP SHOT
    SHOX SHOY SHRA SHRAA SHRO SHROO SHUO SHUOP SHUOX SHUP SHUR SHURX
    SHUT SHUX SHWA SHWAA SHWE SHWI SHWII SHWO SHWOO SHWOY SHY SHYP
    SHYR SHYRX SHYT SHYX SIA SIE SIEP SIEX SIP SIT SK SKW
    SKWA SOA SOO SOP SOUNAP SOX SOY SPA SPE SPI SPO SPWA
    SSAA SSAP SSAT SSAX SSE SSEE SSEP SSEX SSI SSIE SSIEP SSIEX
    SSIP SSIT SSIX SSOP SSOT SSOX SSU SSUP SSUT SSUX SSY SSYP
    SSYR SSYRX SSYT SSYX STWA SUKU SUO SUOP SUOX SUP SURX SUT
    SUX SW SWA SWAA SWE SWI SWII SWO SWOO SY SYP SYR
    SYRX SYT SYX SZA SZAA SZE SZEE SZI SZO SZU SZWA TAAI
    TALING TANG TAP TARUNG TAT TAX TAY TEE TEP TEX TH THA
    THAA THE THEE THI THII THOA THOO THU THWA THWAA THWE THWEE
    THWI THWII THWO THWOO TIE TIEP TIEX TII TIP TIX TLEE TLHA
    TLHE TLHEE TLHI TLHO TLHOO TLHU TLHWE TOA TOLONG TOO TOT TOX
    TSAA TSEE TSI TSO TSU TSWA TTE TTEE TTH TTHAA TTHE TTHEE
    TTHI TTHO TTHOO TTHU TTHWE TTI TTO TTSA TTSE TTSEE TTSI TTSO
    TTSU TTU TUO TUOP TUOT TUOX TUP TURX TUT TUX TWA TWAA
    TWE TWI TWII TWOO TYA TYE TYI TYO TZA TZAA TZE TZEE
    TZI TZO TZOA TZU UA UAN UANG UEA UEI UEY UFOR UNAP
    UNG UO UOG UOP UOX UUE UY VAA VAP VAT VAU VAX
    VEP VEX VI VIE VIEP VIET VIEX VIP VIT VIX VOO VOP
    VOT VOX VU VUP VUR VURX VUT VUX VW VWA VY VYP
    VYR VYRX VYT VYX WAA WAN WAP WAT WAX WAY WE WEE
    WEEN WEN WEP WEX WII WIN WOA WON WOO WOODS WOON WOP
    WOX WU WUI WULU WUN WUO WUOP WUOX WVA WVE WVI XA
    XAA XAU XE XEE XIE XIEP XIET XIEX XIP XIT XIX XO
    XOA XOP XOT XOX XU XUO XUOX XWA XWAA XWE XWEE XWI
    XY XYA XYAA XYE XYEE XYI XYO XYP XYR XYRX XYT XYU
    XYX YAAI YAU YAY YEE YENAP YIE YIEP YIET YIEX YII YIP
    YIT YIX YOA YOO YOP YOX YOY YUI YUO YUOP YUOT YUOX
    YUP YUR YURX YUX YWA YWAA YWE YWI YWII YWO YWOO YY
    YYP YYR YYRX YYT YYX ZAP ZAT ZAX ZEE ZEP ZEX ZHAA
    ZHAP ZHAT ZHAX ZHEE ZHEP ZHET ZHEX ZHI ZHO ZHOO ZHOP ZHOT
    ZHOX ZHU ZHUO ZHUOP ZHUOX ZHUP ZHUR ZHURX ZHUT ZHUX ZHWA ZHY
    ZHYP ZHYR ZHYRX ZHYT ZHYX ZIE ZIEP ZIEX ZIP ZIT ZIX ZOA
    ZOO ZOP ZOT ZOX ZUO ZUOP ZUOX ZUP ZUR ZURX ZUT ZUX
    ZWA ZYP ZYR ZYRX ZYT ZYX ZZA ZZAA ZZAP ZZAT ZZAX ZZE
    ZZEE ZZEP ZZEX ZZI ZZIE ZZIEP ZZIET ZZIEX ZZIP ZZIT ZZIX ZZO
    ZZOP ZZOX ZZU ZZUP ZZUR ZZURX ZZUX ZZY ZZYP ZZYR ZZYRX ZZYT
    ZZYX
    BY TWO
""".split())  # 2026-09 复核补入：BY = 彝文音节BY；TWO = 加拿大原住民音节TWO / 西-克里TWO

# 字母名：字母本名与附加符名 —— 2069
_KEEP_LETTER = set("""
    AAJ AAK AAL AAM AAN AANG AAO AAW AAYANNA AAYIN AAZHAAKKU AC
    ADAK AEB AED AEE AEEYANNA AEG AEK AEL AEN AENG AER AES
    AESC AET AEY AEYANNA AF AG AGUNG AH AHSA AHSDA AI AIHVUS
    AIKARA AILM AINN AINU AITON AIVA AIYANNA AJ AKARA AKAT AKHMIMIC AKSA
    ALAF ALAPH ALAYHE ALEPH ALF ALFA ALI ALIF ALIFU ALLAHOU ALPA ALPAPRAANA
    ALPAPRANA ALPHA ALT AM AMB AMBA ANG ANGKHANKHU ANHU ANIMAL ANN ANSUZ
    ANTARGOMUKHA ANUDATTA ANUSVARAYA ANY AO AOR AOU AP AQ AR ARAEAE ARDHACANDRA
    ARDHAVISARGA ASAT ASPIRATION ASSALLAM ASYURA ASZ ATIKRAMA ATIU ATIYA ATT ATTAK ATTHACAN
    AUE AUNN AURAMAZDAA AURAMAZDAAHA AUYANNA AV AVA AVAGRAHA AVAKRAHASANYA AWC AWQ AWX
    AWZ AY AYANNA AYB AYER AYIN AYN AZ AZU BAA BAB BAC
    BAE BAF BAGA BAH BAHIRGOMUKHA BAIMAI BAIRKAN BALUDA BANG BANTOC BARIYOOSAN BARREE
    BASH BASIGNA BATHAMASAT BAYANNA BBA BBB BBC BBD BBE BBF BCA BCAD
    BCB BCC BCD BCE BCF BDA BDB BDC BDD BDE BDF BEA
    BEB BEC BED BEEH BEF BEHEH BEI BEITH BEN BEORC BERKANAN BET
    BETA BETH BEYYAL BFA BFB BFC BFD BFE BFF BH BHA BHAA
    BHALE BHAM BHETH BIB BIDENTAL BIG BILABIAL BINDI BISAH BIT BJARKAN BKA
    BLA BLACKLETTER BO BRA BRDA BRI BSDUS BSKA BSKUR BSTAR BUKY BUNG
    BUON BUUMISH BZHI BZUNG CAANG CAB CABBAGE CAC CAD CAE CAF CAH
    CALC CALL CAMNUC CAN CANDRA CANG CAR CARMI CASKET CAUDA CAYANNA CAYN
    CBA CBB CBC CBD CBE CBF CCB CCC CCD CCF CE CEALC
    CECAK CECEK CEEB CEEV CEIRT CEN CEREK CEVITU CF CFF CH CHA
    CHADA CHAL CHAN CHANG CHATTAWA CHAVIYANI CHE CHEEM CHEH CHELAP CHEN CHERY
    CHHA CHHIM CHI CHIL CHILLU CHIM CHIN CHING CHIRET CHO CHOE CHOY
    CHRIVI CHULA CHWV CIL CIM CO COENG COLL CON CRYPTOGRAMMIC CUAM CUATRILLO
    CWEORTH CYA CYAW CYAY DAADHU DAALI DAEG DAGALGA DAGAZ DAGBASINNA DAGESH DAGS
    DAH DAHAL DAHYAAUSH DAI DAIR DAL DALAT DALATH DALDA DALET DALETH DAMARU
    DANG DANTAJA DAP DARBAI DAVIYANI DAWB DAYANNA DB DC DCHE DD DDA
    DDAHAL DDAL DDAYANNA DDDA DDDHA DDH DDHA DDHO DE DEEL DEI DEK
    DELT DELTA DENNEN DERET DEVI DEZH DF DH DHA DHAA DHAALU DHADHE
    DHAL DHALATH DHALETH DHAMEDH DHII DHOU DIFAT DIGAMMA DIL DJA DJAI DJE
    DJERV DJERVI DKAR DLA DLHA DLHYA DO DOACHASHMEE DOBRO DOI DOKMAI DON
    DONGA DOONG DOT DOWN DRIL DUL DUM DUSHENNA DV DVISVARA DWE DYAN
    DYEH DZ DZA DZAY DZE DZELO DZHA DZHE DZHOI DZITA DZJE DZUD
    DZWE DZYAY DZYI DZZA DZZE DZZHE EA EABHADH EADHADH EAMHANCHOLL EB EC
    ECS ED EDD EE EEH EEYANNA EF EG EGY EGYPTOLOGICAL EH EHCHA
    EHKA EHPA EHTA EHTSA EHWAZ EIE EIN EIS EJ EKARA EKO EKS
    EL ELIF ELIFI ELL ELT ELY EM EMP ENC ENG ENN ENNI
    ENT ENY EOH EOLHX EP EPENTHETIC EPSILON EQ ER ERIGO ERR ERS
    ES ESS ESZ ET ETA ETH ETHEL ETT ETY EV EW EYANNA
    EYN EZ EZH EZS FA FAAFU FAAMAE FAIB FAIHU FAM FAN FAQ
    FAYANNA FB FC FD FE FEARN FEE FEEM FEENG FEH FEHU FEI
    FENG FEOH FETH FEUFEUAET FEUX FI FIRI FITA FLA FO FOM FON
    FONGMAN FRANKS FRITU FU FUE FUET GAA GAAFU GAF GAG GAH GAI
    GALI GAMAL GAMAN GAML GAMLA GAMMA GANGIA GARSHUNI GAY GAYANNA GBA GBAKURUNEN
    GBAYI GBET GBEUX GBIEE GCIG GDAN GEBO GEEM GER GG GGA GH
    GHA GHAA GHAAMAE GHAD GHAINU GHAMAL GHAMMA GHAN GHAP GHARAE GHAYN GHE
    GHET GHEUAE GHEUAEGHEUAE GHEUAERAE GHEUGHEN GHEUGHEUAEM GHEUN GHEUX GHEYS GHHA GHIMEL GHOM
    GHOU GHUNNA GHWA GIBA GIL GIM GIMEL GJA GJE GLA GLAGOLI GN
    GNA GNAVIYANI GNYIS GO GOAL GOK GORA GORT GOWAY GRAF GRAM GRU
    GSUM GTER GUEH GUG GV GW GYAN GYAS GYFU GYON HAAM HAE
    HAEGL HAGALL HAGL HAGLAZ HAI HAIS HALANTA HALQA HAMSO HAN HANG HAO
    HAR HARBAHAY HASANTA HAT HATE HAY HAYANNA HECAKA HEI HENG HERU HET
    HETA HETH HEXIFORM HEYT HHAA HIDET HIE HIP HIRDEABO HIYO HJA HL
    HLA HLI HME HNA HNUB HODDOND HOE HOI HOLO HOM HORI HORR
    HOTA HOUSE HOY HP HTA HTTA HUK HUNG HUVA HV HWAH HWAIR
    HYA IAN IAUDA IC IDD IE IFIN IGGWS IH IIYANNA IJE IKARA
    IKIR ILUUYANNA ILUYANNA IMAR IN ING INGWAZ INI INN INNN INY INYA
    IO IODHADH IOR IOTA IQ IRB IRUUYANNA IRUYANNA ISAZ ISS IT ITT
    IU IUJA IWAZ IWN IY IYANNA IZ IZHE IZHITSA JA JAH JAVIYANI
    JAYANNA JAYIN JAYN JEH JER JERA JERAN JEU JH JHA JHAA JHAM
    JHAN JHAYIN JHEH JHO JHOX JIA JIHVAMULIYA JIIM JIL JJA JNYA JONA
    JONG JUDGE JUDUL JYAH KAAF KAAFU KAAN KAANKUU KAFA KAKABAT KAKO KANG
    KANTAJA KAPA KAPAL KAPH KAPPA KAQ KAR KARAN KAUN KAUNA KAWI KAYANNA
    KEAAE KEENG KEH KEHEH KEMBANG KEMPHRENG KEN KENAT KEOW KES KET KEUAE
    KEUAEM KEUAERI KEUAETMEUN KEUKAQ KEUKEUTNDA KEUM KEUOT KEUP KEUPUQ KEUSEUX KEUSHEUAEP KEUX
    KEUYEUX KH KHAA KHAF KHAI KHAKASSIAN KHAN KHANDA KHANG KHAPH KHAR KHAV
    KHEI KHETH KHHA KHHO KHMU KHO KHOMUT KHON KHONNA KHOT KHOU KHUAT
    KHUEN KHWAI KHYIL KICK KIEEM KIK KILLER KINNA KIQ KIW KJE KKA
    KLA KLOKO KOBO KOET KOGHOM KOI KOK KOKE KOOMUUT KOPPA KOQNDON KOTO
    KOVUU KP KPA KPAH KPARAQ KPEUX KPOQ KRA KSI KSSA KUET KUNG
    KUOM KUOP KUOQ KUQ KURT KURUNI KUSMA KUT KUUH KUZHI KVA KVO
    KWAET KYEE LAAM LAAMU LAAN LAANAE LABAT LABIAL LABIALIZATION LACA LAE LAEV
    LAGU LAGUS LAH LAI LAING LAKKHANGYAO LAKKO LAKUNA LAMADH LAMD LAMDA LAMED
    LAMEDH LAN LAP LAPAQ LAQ LARYNGEAL LAS LATIK LATINATE LAUKAZ LAULA LAW
    LAYANNA LAYAR LAZY LCE LCI LDAN LEADING LEEEE LEERAEWA LEGGED LEI LEK
    LELET LENGA LESH LET LEU LEUAEM LEUAEP LEUM LEZH LHAVIYANI LHYA LIEE
    LING LIQ LIWN LJ LJE LJUDIJE LLA LLE LLHA LLL LLLA LOACHA
    LOGR LOLL LOM LOMMAE LONSUM LOON LOOT LOQ LOS LS LUAEP LUB
    LUE LUIS LUS LV LYA LYIT LZ MADR MADU MAE MAEKEUP MAELEE
    MAEM MAEMBA MAEMBGBIEE MAEMGBIEE MAEMKPEN MAEMVEUX MAENJET MAENYI MAESI MAH MAHAAPRAANA MAHAPRANA
    MAI MAIMALAI MAIMUAN MAITAIKHU MAIYAMOK MALEERI MAN MANDAILING MANNA MANNAZ MANSUAE MAP
    MAPIQ MAQ MAR MARBUTA MARWARI MASORA MAYANNA MBA MBAA MBAAKET MBAARAE MBANYI
    MBAQ MBEEKEET MBEN MBERAE MBEUM MBEURI MBEUX MBIRIEEN MBIT MBUAE MBUAEM MBUE
    MBUO MBUOQ MC MCHAN MDUN MED MEEEE MEEJ MEEMU MEM MENOE METEK
    MEUN MEUNJOMNDEUQ MEUQ MEUT MFAA MFEUAE MFEUQ MFEUT MFIEE MFIYAQ MFO MFON
    MGBASA MGBASAQ MGBEN MGBEUN MGBIEE MGBOFUM MGO MHA MID MIEE MIG MIIM
    MIIN MIM MIME MINDU MISRA MIT MKPARAQ MLA MM MNYAM MON MONGKEUAEQ
    MONI MONOCULAR MONOGRAPH MONTIEEN MOOMEUT MOOMPUQ MPA MQ MUAE MUAN MUE MUEANG
    MUHOR MUIN MUKHA MUKKURUNI MUKPHRENG MULTIOCULAR MUM MUOMAE MUOY MURDA MUS MUTHALIYA
    MUURDHAJA MUUSIKATOAN MUUVUZHAKKU MV MVEUAENGAM MVI MVOP MX MYA MYSLITE MZ NAA
    NAAKSIKYAYA NAASIKYAYA NAE NAG NAH NAKAARA NANGMONTHO NANSANAQ NAQ NAR NASHI NAUD
    NAUDIZ NAUTHS NAYANNA NCA ND NDA NDAA NDAANGGEUAET NDAM NDAP NDEUAEREE NDEUT
    NDEUX NDIAQ NDIDA NDIQ NDOMBU NDON NDUN NEL NEN NENOE NEQUDAA NG
    NGA NGAH NGANGU NGAQ NGAR NGAS NGAY NGEADAL NGEUREUT NGG NGGA NGGAAM
    NGGAAMAE NGGAP NGGEEEE NGGEET NGGEN NGGEU NGGEUAE NGGEUAET NGGEUX NGGUAEN NGGUAESHAE NGGUEET
    NGGUM NGGUOM NGGUON NGGUOQ NGGUP NGGURAE NGGWAEN NGHA NGJA NGKA NGKAAMI NGKAP
    NGKAQ NGKEUAEM NGKEUAEQ NGKEURI NGKEUX NGKIEE NGKINDI NGKUE NGKUENZEUM NGKUM NGKUN NGKUP
    NGKWAEN NGKYEE NGO NGOEH NGOM NGOQ NGOU NGU NGUAE NGUAET NGUE NGVE
    NGYE NHA NHJA NHUE NIA NIHSHVASA NIKA NIKAHIT NIKHAHIT NIKOLSBURG NINI NION
    NJ NJAA NJAEM NJAM NJAN NJAP NJAQ NJE NJEE NJEEEE NJEUAEM NJEUAENA
    NJEUT NJEUX NJI NJIEE NJUAE NJUEQ NJUQA NKA NKAARAE NKINDI NKOM NN
    NNA NNAA NNE NNHA NNNA NNO NNY NNYA NOKHUK NOONU NOR NOWC
    NPA NPLA NQA NQIG NRA NRES NRUA NSA NSEN NSEUAEN NSHA NSHAQ
    NSHEE NSHIEE NSHUE NSHUET NSHUOP NSHUT NSIEE NSIEEP NSIEET NSOM NSUM NSUN
    NSUOT NTA NTAA NTAP NTEE NTEN NTEUM NTEUNGBA NTIEE NTOG NTOQPEN NTSA
    NTU NTUJ NTUM NTUU NTXA NTXIV NUAE NUE NUKTA NUM NUUN NV
    NXA NXHA NY NYA NYAEMAE NYAH NYAM NYCA NYD NYEH NYET NYHA
    NYI NYIR NYIS NYJA NYO NYUE NZA NZAQ NZEUM NZUN NZUQ OB
    OC OCCLUSION OE OEE OEK OH OI OIN OJOD OKARA OL OMEGA
    OMICRON ON ONG ONN ONU OOH OOU OOYANNA OOZE OQ ORR OS
    OSS OT OTHAL OTHALAN OTT OTTHI OTU OU OV OW OYANNA OZ
    PAAM PAARAE PAARAM PADMA PAH PAIRTHRA PAIYANNOI PAKPAK PALUTA PAMAAEH PAMSHAE PAMUDPOD
    PANGLAYAR PANGWISAD PANYANGGA PANYECEK PAR PARUM PASHAE PATHAKKU PATHAMASAT PAVIYANI PAYANNA PE
    PEE PEEI PEEM PEESHI PEH PEHEH PEITH PEN PEORTH PERNIN PERSON PERTHO
    PET PEUT PEUTAE PEUX PH PHA PHAM PHAN PHAR PHASE PHI PHINTHU
    PHNAEK PHO PHRU PHUNG PHUR PHUTHAO PIEEQ PIEET PIET PII PIN PINARBORAS
    PIPAEMBA PIPAEMGBIEE PIRIEEN PIWR PLA PLUTA POKOJI POLLU PON POON POSTPOSITION PPA
    PRAM PSA PSI PUAE PUAQ PUB PUE PUM PUNGAAM PUQ PUSHPIKA PUUT
    PVO QA QAAF QAAFU QAF QAIRTHRA QAPH QAR QAY QGA QHOPH QOF
    QOPA QOPH QP QUA QUADRUPLE QUE QUF QUI QUO QUU QUV RAA
    RAD RAE RAEM RAFE RAH RAHMATULLAH RAI RAIDA RAIDO RAKHANG RAMBAT RAMS
    RAN RANA RAQ RASHA RASWADI RATA RATHA RAYANNA RDEL RDO REAHMUK REE
    REH REI REID REN REPH REREKAN RESH REU REUX RGYA RGYAN RGYINGS
    RH RHA RHO RHOTIC RICEM RIEE RII RIKRIK RIMGBA RIN RISH RITSI
    RJE RJES RNAM RNOON RNYING ROBAT ROC ROG ROM ROSH RRA RREH
    RRH RRRA RTAGS RTE RTHANG RUA RUDIMENTA RUE RUIS RULAI RUM RUMAI
    RUSI SAADHU SAAT SADE SADHE SAFHA SAGA SAIL SAKEUAE SAKIN SAKOT SALA
    SALLALLAHOU SALTILLO SAM SAMBA SAMEKH SAMKA SAMPHAO SAMPI SAMVAT SAMYOK SAN SANAH
    SANNYA SANYAKA SANYOOGA SAPA SAQ SARA SASAK SATKAAN SATKAANKUU SAUIL SAW SAWAN
    SAYANNA SBRUL SBUB SCHWA SEENU SEEV SEH SELA SEMK SEMKATH SERI SET
    SETFON SEUAEQ SEUNYAM SEUX SEYK SGAB SGOR SHAD SHAK SHANG SHAVIYANI SHCHA
    SHCHOOI SHEENU SHEI SHEUAE SHEUAEQ SHEUAEQTU SHEUOQ SHEUX SHHA SHII SHIIN SHIMA
    SHIN SHINDA SHIQ SHIRAE SHOG SHOOI SHOQ SHTA SHTAPIC SHUENSHUET SHUEQ SHUM
    SHYA SHYE SHYELE SHYER SIBE SIDDHAM SIEE SIGEL SIGMOID SII SIMA SIMALUNGUN
    SIN SINGAAT SINNYIIYHE SINOLOGICAL SISA SJE SKAN SLOAN SLOVO SNA SOL SOM
    SON SONJAM SOQ SOT SOU SOWILO SPUNGS SS SSA SSHE SSHIN SSO
    SSUU STA STAN STAUROS STIGMA STRAIF SUA SUAB SUAE SUAEN SUAET SUAM
    SUE SUN SUNG SURANG SUTUH SUU SV SVARITA SYA SYI TAA TAAF
    TAALUJA TAAM TAAQ TAASHAE TAE TAEN TAH TAHALA TAI TAKHALLUS TAM TAMURA
    TAN TANA TAQ TAS TASLA TASSI TATASOUE TAU TAUM TAV TAVIYANI TAW
    TAWA TAWELLEMET TAYANNA TC TCHE TCHEH TCHEHEH TEDUNG TEEEE TEHEH TEIWS TEK
    TELU TENTU TESH TET TETH TEU TEUAEN TEUAEQ TEUN TEUT TEUTEUWEN TEUTEUX
    THAALU THAHAN THAJ THAL THAMEDH THANNA THANTHAKHAT THARI THAW THEA THELE THETA
    THETH THETHE THIAB THIUTH THO THOLHOMA THOM THONG THORN THOU THUNG THURISAZ
    THURS TIL TING TINNE TIRYAK TIT TITA TITUAEP TIWAZ TIWN TIWR TJE
    TLA TLE TLHYA TLI TLO TLU TLV TOANDAKHIAT TODO TOMPI TONG TONPI
    TOON TOQ TOS TOV TOYOR TRA TRESILLO TRI TRIISAP TROKUTASTI TS TSA
    TSAADIY TSADI TSE TSEEB TSHA TSHAB TSHE TSHEG TSHES TSHOOJ TSIU TSOV
    TSSA TSSE TSV TSWE TTA TTAA TTAYANNA TTEH TTEHEH TTHA TTTA TTTHA
    TU TUAE TUAEP TUB TUKWENTIS TUMAE TUTEYASAT TUUMU TVRIDO TXA TXHEEJ TXWV
    TYAY TYR TZ TZIR UATH UBADAMA UBHAYATO UC UDAAT UDATTA UDD UE
    UEC UEE UEN UEQ UEX UEZ UH UI UIC UILLEANN UIQ UIUC
    UIUQ UIUX UIUZ UIX UIZ UJ UK UKARA UKU ULU UNK UNN
    UNY UPADHMANIYA UPSILON UQ URUS URUZ USHENNA UTTHI UU UUUU UUYANNA UWU
    UX UYANNA UZHAKKU VA VAAVU VAH VAKAIYARAA VAMAGOMUKHA VARCA VAV VAYANNA VC
    VE VEDE VEDIC VEE VEH VELI VEND VER VEUAE VEUAEPEN VEUM VEUX
    VEW VEYZ VFA VHA VIDA VIDJ VIN VIRAMA VIRIAM VISARGAYA VIYO VO
    VOICING VOLAPUK VOM VOOI VOS VOW VQ VRACHY VUEQ VX VZ WAAVU
    WADDA WAEN WAI WANGKUOQ WASLA WASSALLAM WASSE WAU WAW WEI WEUX WH
    WIANG WIANGWAAK WIGNYAN WINJA WOE WOLOSO WOW WUAEN WUAET WUE WUNJO WUP
    WV WYNN XAN XAPH XAUS XEH XEYN XHA XHEYN XI XIAB XOPH
    XSHAAYATHIYA XVA XVE XW XYEEM XYOO YAA YAB YABH YACH YAD YADD
    YADDH YADH YAEMMAE YAF YAFU YAG YAGH YAGHH YAGN YAH YAHH YAJ
    YAK YAKASH YAKH YAKHH YAL YAM YAMAKKAN YAMOK YAN YAP YAQ YAR
    YARR YAS YASH YASS YAT YATH YATI YATT YAV YAW YAYANNA YAYD
    YAZ YAZH YAZZ YEA YEIN YEN YER YERI YERU YESTU YEUAE YEUAET
    YEUM YEUQ YEURAE YEUX YEW YEY YHA YHE YI YIEE YIG YIH
    YING YIWN YIZET YN YOD YODH YOGH YOQ YORI YOT YOWD YR
    YRY YUAEN YUDH YUE YUEQ YUJ YUM YUN YUOM YUPI YUQ YUS
    YUT YUUKALEAPINTU YUWOQ YV YYA YYAA YYE ZAA ZAH ZAI ZAL ZARL
    ZATA ZAVIYANI ZAYIN ZAYN ZEMLJA ZEMLYA ZEN ZETA ZH ZHA ZHAIN ZHAR
    ZHAYIN ZHE ZHIL ZHIVETE ZHOI ZHWE ZJE ZLA ZO ZRA ZSA ZSHA
    ZWJ ZY ZZSA ZZSYA ZZYA
    EAR FITKO ODD OR
""".split())  # 2026-09 复核补入：EAR 卢恩字母EAR；FITKO 贝里亚字母FITKO；
              # ODD 瓦朗奇提字母ODD；OR 欧甘字母OR（都是字母本名）

# 楔形文字转写名 —— 160
_KEEP_CUNEIFORM = set("""
    AD AK AL ALAN AMAR AN ANSHE APIN ARAD ARKAB ASHGAB BAD
    BAL BALAG BI BU BULUG BURU DA DAM DAR DI DIB DIN
    DISH DU DUG DUGUD DUH EDIN EGIR EN EREN EZEN GABA GAD
    GAL GALAM GAM GASHAN GESHTIN GESHU GIDIM GIG GISAL GISH GUD GUL
    GUM GURUN GURUSH HA HAL HI HU HUSH IB IDIM IG IGI
    IM IR ISH KAB KABA KAK KAL KASKAL KI KID KIN KISAL
    KISH KUG KUL KUN KUR LA LAGAB LAGAR LAHSHU LAK LAL LI
    LIL LISH LUGAL LUH LUL LUM ME MES MESH MI MIN MUG
    MUNSUB NAGA NAGAR NE NIGIDAESH NIGIDAMIN NIM NISAG NUN NUNUZ NUTILLU PA
    PAD PAP PI PIRIG RAB SAG SAL SAR SHARU SHE SHEN SHESHIG
    SHESHLAM SHID SHIM SHINIG SHIR SHITA SHUBUR SHUL SI SUHUR SUM SUMASH
    TAB TAG TAR TENU TIR TUK TUM TUR UB UD UDUG UM
    UMBIN UMUM UN URU URUDA USHUMX USHX UTUKI UZU ZAG ZAMX ZIB
    ZIDA ZIG ZUBUR ZUM
    BAR GUNU
""".split())  # 2026-09 复核补入：BAR/GUNU 语料内只作楔形转写名（见 WORD 表头注释）

# 语言/文字专名 —— 61
_KEEP_SCRIPTNAME = set("""
    ABKHASIAN AFRICAN AHAGGAR ALEUT ALGIZ ANGLICANA APPHO ATHAPASCAN BASHKIR BERBER BLACKFOOT BOHAIRIC
    BYELORUSSIAN CARYSTIAN CHINOOK COPTIC CYRENAIC EPIDAUREAN FARSI GURAGE ICELANDIC KASHMIRI KAZAKH KHAMTI
    KIRGHIZ KOMI MALAYALAM MANCHU MESSENIAN NASKAPI NAXIAN NUBIAN NUNAVIK NUNAVUT OJIBWAY ORKHON
    PALAUNG PALI PALOCHKA PAMPHYLIAN PERSIAN POLISH ROHINGYA ROMANIAN SAKHA SANSKRIT SAYISI SCOTS
    SINDHI SLAVEY SOGDIAN SPANISH TAMIL THESPIAN TUAREG UIGHUR UKRAINIAN VISIGOTHIC WELSH YAJURVEDIC
    YENISEI
""".split())

# 编号（带数字） —— 127
_KEEP_CODE = set("""
    A AA AB ASAL ASH B BA BAG BAHAR BAN BARA BB
    BC BD BE BF BUR C CA CB CC CD CM D
    DAG DARA DIM DUB DUN DUR E ERIN ESH ESHE F G
    GA GAN GAR GE GESH GI GIR GU GUR H HUB HUL
    I IL ILIMMU IMIN K KA KAD KAM KESH KISIM KU KUSHU
    KWU L LD LIMMU LU M MA MASH MB MURGU MUSH N
    NA NAM NI NIN NINDA NL NU O P PESH PIR PU
    Q R RA RO S SANGA SH SHA SHAB SHAR SHEG SHESH
    SHU SIG SIK SILA ST SUD SUR T TA TAK TI TT
    TUG TURO U UR URI USH USSU UUU UZ V W X
    Y Z ZA ZE ZI ZIZ ZU
""".split())

# 其他记音：藏文/阿拉伯/叙利亚/彝文等转写 —— 537
_KEEP_TRANSLIT = set("""
    AABAAFILI AALIH AALIHEE ABAFILI ABB ADDAK ADEG AE AFFRICATION AFSAAQ AHAD AHANG
    AIN AJJAL AKBAR ALAA ALAYH ALAYHAA ALAYHI ALAYHIM ALAYHIMAA ALAYNAA ALEF ALLAAH
    ALLAAHI ALLAAHU ALLAH ANDAP ANGED ANGKA ANH ANHAA ANHUM ANHUMAA ANHUNNA ANJI
    ANNAAU ANO APUN ARAEA AREPA ARKAANU ARLAUG AS ASPER ASRAARUHUM ASTROLOGICAL AT
    ATH ATMAAU ATNAH ATTIC AU AYAH AZZA BARAKAATUHUM BARREKH BATHTUB BAU BAWAK
    BEGIN BEH BELGTHOR BIBLICAL BILLIONS BINDU BIRGA BISMILLAH CAKRA CALYA CARIK CATAWA
    CEONGCHIEUMCHIEUCH CEONGCHIEUMCIEUC CEONGCHIEUMSIOS CEONGCHIEUMSSANGCIEUC CEONGCHIEUMSSANGSIOS CER CHAD CHAR CHEIKHAN CHEIKHEI CHIEUCH CHITUEUMCHIEUCH
    CHITUEUMCIEUC CHITUEUMSIOS CHITUEUMSSANGCIEUC CHITUEUMSSANGSIOS CIEUC CL COW CRUCIFORM CULTIVATION CYPERUS DAAMAT DAD
    DAMMA DAMMATAN DANTAYALAN DARGA DAY DEBIT DEHI DIGEUD DIPTE DJ DNA DVD
    DWO EBEFILI ECH EEBEEFILI EK EKAM EO EPACT ESASA ETNAHTA EU EWE
    EYBEYFILI EYYY FAJ FARAJAHU FATHA FATHATAN FEATHER FF FFI FFL FL FOOTSTOOL
    FULL GAAHLAA GADOL GAP GCAN GEBA GEDOLA GERESH GERSHAYIM GHAIN GVANG HAFIZAHU
    HAFIZAHUM HAFIZAHUMAA HAFUKH HAFUKHA HAH HAM HAMZA HARKLEAN HASERFOR HATAF HATHI HAWJ
    HBASA HC HDR HE HEAD HEH HELMET HERAEUM HERMIONIAN HIEUH HIRAGANA HIRIQ
    HIZB HM HO HOKA HOLAM HORA IBIFILI IEUNG IJ ILUY IMAALA IMN
    IRI ISEN ISHMAAM ISSHAR IYEK J JAIN JALL JALLA JALLAJALALOUHOU JE JEEM
    JUDEO JUZ KAF KAI KANAKO KAPO KAPYEOUNMIEUM KAPYEOUNPHIEUPH KAPYEOUNPIEUP KAPYEOUNRIEUL KAPYEOUNSSANGPIEUP KARA
    KAREN KARRAMA KASRA KASRATAN KATAKANA KAVYKA KE KEFULA KHA KHAB KHAH KHIEUKH
    KHIT KHUDAM KHYUD KIIZH KIYEOK KO KOINI KOKO KORANIC KUNDDALIYA KWM LAJANYALAN
    LAM LAMBDA LAND LANTANG LAUJ LENIS LHAG LINGSA LIS LITH LONGA LOTUS
    LUHUR LUNGSI MAAYYAA MADDA MADDAH MADYA MAHAPAKH MAKSURA MANGALAM MAQAF MARQADAH MASHFAAT
    MCHU MD MEEM MEN MERI MERKHA METEG METOBELUS MIEUM MNAS MO MOHAMMAD
    MOKHASSAS MONOGRAM MORPHOLOGICAL MR MTAVRULI MU MUAS MUCAAD MUNAH MUQDAM NAWWARA NHAY
    NIEUN NIGGAHITA NIRUGU NISF NJAEMLI NO NOON NOW NPN NUENG NYAJ OABOAFILI
    OBELUS OBOFILI OLE OM ONKAR OOBOOFILI PADA PALATALIZATION PALLAWA PAMADA PAMUNGKAH PAN
    PANGKAT PANGKON PANGLONG PANGOLAT PANGRANGKEP PANONGONAN PANSIOS PANTI PAO PARA PAREREN PASEQ
    PASHTA PASSIMBANG PASUQ PATAH PATAK PAYEROK PAZER PHAARKAA PHAB PHIEUPH PIASTRE PIEUP
    PISELEH PLETHRON PLOPHU PNEUMATA PNP POKRYTIE POSSESSION PPV PR PREFACE PTE PTHAHA
    PURNAMA PWO QADDASA QADMA QALA QAMATS QARNEY QASR QATAN QETANA QIF QITSA
    QN QUBUTS QUDDISA QUDDISAT QUSHSHAYA RADI RAHEEM RAHIMAHU RAHIMAHUM RAHIMAHUMAA RAHMAH RAHMAN
    RAHMATU RAM RASOUL RAY RBASA RELAA REPHA RERENGGAN REVIA RI RIEUL RMT
    ROL RU RUB RUKKAKHA RWAHA SA SAD SAH SAJDA SAJDAH SAKTA SALAAM
    SALAAMUHU SALAATU SALAM SALLA SALLALLAAHU SALLALLAHU SALLAM SANDHI SATANGA SD SDONG SE
    SECANT SEEN SEGOL SEMI SGAW SGRA SHADDA SHALSHELET SHAN SHAREEF SHEEN SHEVA
    SHIYYAALAA SHRI SHRII SHV SIDDHI SIGMA SIKI SIOS SIRRAH SIRRUHUM SIRRUHUMAA SO
    SOF SONG SOON SOS SOW SPIRITUS SSANGARAEA SSANGCIEUC SSANGHIEUH SSANGIEUNG SSANGKIYEOK SSANGMIEUM
    SSANGNIEUN SSANGPIEUP SSANGRIEUL SSANGSIOS SSANGTHIEUTH SSANGTIKEUT SSANGYEORINHIEUH STRATIAN SU SUBHAANAHU SUBLINEAR SUPRALINEAR
    SURYA SUTRA TAAALAA TABAARAKA TAO TASHEEL TE TEENS TEH TELEIA TELISHA TEVIR
    THALATHA THAM THAN THEH THIEUTH THOJ THYOOM TIKEUT TIPEHA TIPPI TIRTA TO
    TROEZENIAN TSAB TSADE TSERE TSHEEJ TSHOOK TSHUGS TSWB TTUDDAAG TTUDDAG TUMETES TUPNI
    TURU TVIMADUR UBUFILI UHD UNGGA URA US VAJ VARIKA VAS VOCALIZATION VOD
    VS VWJ VZMET WA WAAALIHEE WAAJIB WAE WAJHAH WAQFA WAS WASALLAM WC
    WEO WET WI WINDU WINE WO WOOL WORD WZ XAM XYOOJ YA
    YAE YE YEEG YEH YEO YEORINHIEUH YERAH YESIEUNG YETIV YO YOMO YU
    ZAEF ZAIN ZAQEF ZARQA ZINOR ZIQAA ZLAMA ZQAPHA ZWARAKAY
    ID OK
""".split())  # 2026-09 复核补入：ID/OK 在中文里原样使用（ID按钮 / OK手势 /
              # SQUARED ID），另有 奥尔奥纳尔字母ID 一例是字母本名


# ---- 真英文词黑名单：确认为英语实词，必须逐词译出，绝不在 KEEP 里 ----
# 前半是早期判定的英文词；后半（AFFRICATION 起）是 2026-09 从 KEEP 回收的：
# 上一轮自动分类按「结构上不像英文」误把英语实词塞进了 KEEP，于是它们永远
# 不算挡路词，所在条目永久漏报。同族词（EWE/RAM/SOW/COW/WINE/WOOL…
# 其中 MAN 已在下面二轮复核里移回 KEEP）
# 与 _KEEP_* 里的音节名/字母名重名，回收后会连带翻出几处本意保留转写的条目，
# 属预期代价。
#
# 2026-09 二轮复核（把上面那句「预期代价」逐条查实）：a 节 58 条 + b 节 108 条里
# 的每一个词，都在语料（符号/中文名.json）里把**全部**出现位置列出来看过，判据是
# 「这个词在本语料里有没有任何一处是英文实义」：
#   · 一处都没有 → 记音/字母名/首字母缩写，从本表移回 KEEP —— 共 58 词
#   · 有实义     → 留在本表 —— 本轮一个都没有
# 移回的 58 词里有 50 个原本就躺在某个 _KEEP_* 类目里、只是被本表压着（BAT、THE、
# MAN、SEE、BEE…），删掉本表条目即自动复现；另 8 个是新归位：
#   _KEEP_SYLLABLE  BY（彝文音节BY） TWO（加拿大原住民音节TWO）
#   _KEEP_LETTER    EAR（卢恩字母EAR） FITKO（贝里亚字母FITKO）
#                   ODD（瓦朗奇提字母ODD） OR（欧甘字母OR）
#   _KEEP_TRANSLIT  ID（ID按钮 / 奥尔奥纳尔字母ID） OK（OK手势）
# 代价：这 58 词从此不再进待译清单 —— 即「语料里再冒出英文实义的 THE/SEE/MAN…
# 也不报」。它们在**当前**语料里查无实义用法，故本轮接受；要更保险就得给清单加
# 「域」概念（如「楔形文字符号 …」内才豁免），那是架构级改动，另议。
ENGLISH = set("""

    AFFRICATION AFRICAN ANIMAL ASPER ASPIRATION ASTROLOGICAL BATHTUB BEAVER BED
    BEGIN BIBLICAL BIDENTAL BIG BILABIAL BILLIONS CABBAGE
    CASKET CRUCIFORM CRYPTOGRAMMIC CULTIVATION
    DAY DEBIT DOT DOWN EGYPTOLOGICAL EPENTHETIC EWE
    FEATHER FOOTSTOOL FRANKS FULL GOAL
    HEAD HELMET HEXIFORM JUDGE KILLER KORANIC LABIAL
    LABIALIZATION LAND LARYNGEAL LATINATE LAZY LEADING LEGGED LENIS LIGATING
    LOTUS MID MONOCULAR MONOGRAM
    MONOGRAPH MOOSE MORPHOLOGICAL MULTIOCULAR OCCLUSION PALATALIZATION
    PERSON PHASE POLISH POSSESSION POSTPOSITION PREFACE
    QUADRUPLE RAM RAMS RHOTIC SECANT
    SEMI SIGMOID SINOLOGICAL SOON SOW SUBLINEAR SUN SUPRALINEAR
    TEENS VOCALIZATION VOICING
    WET WINE WOOL WORD

    ACADEMY ADO AFFIX AFOREMENTIONED AGE AIR ALTERNATE ALTERNATIVE AMPERSAND AND
    ANGULAR ARE ARMOUR ARRAY ASTERISCUS ASTERISK AWE BARLEY BARS BASELINE
    BETWEEN BIBLE BINOCULAR BLANK BLENDED BOAR BOLD BOTTOM BRANCH BROAD
    BRONZE BULL CANCELLATION CARET CAUDATE CENTRALIZATION CHARIOT CHURCH CIRCLED
    CIRCLES CIRCULAR CITATION CLEAVER CLOSE CLOSING CLOTH CLUSTER COMMERCIAL COMPLETED
    CONTINUATION CONTRACTION COOL COUNCIL COVER CREDIT CRESCENT CURLED CURLY CURRENT
    CURVE DAMAGED DART DEAD DECIMAL DEER DELIMITER DELPHIC DENTAL DESCENDING
    DIAERESIZED DIALECT DIRECT DISPUTED DIVIDER DOTLESS DOUBLED DOWNSCALING DRACHMA DRACHMAS
    DRY EASTERN EAT EGG EIGHTY ELLIPSIS EMPHASIS EMPHATIC ENCLOSURE
    ENCLOSURES END ENUMERATION EPOCH EQUID ETERNITY EVEN EXTRA FACTOR FATIGUE
    FEMININE FIFTY FLAME FLEURON FLOWER FOR FORMS FORTY FOURTH
    FOURTHS FRAGMENT FRAME FRICATIVE FROM GARMENT GEMINATE GENITIVE GOAT GOLD
    GREATER HANDLE HEADSTROKE HYPHENATION ICE IF INDEPENDENT INDICATOR INDIRECT
    INSERT INSERTION INSULAR INTERSYLLABIC INVERTEBRATE IOTATED IOTIFIED LENGTH LESS LETTERS
    LIKE LINED LINES LOCATION LOCATIVE LOGOGRAM LOGOTYPE LOST MARE MEASURE
    MELODIC MIDLINE MIRROR MONTH MOON MOVED MUCH MULTIPLE MUSIC NARROW
    NASAL NEUTRAL NEW NINETY NORTHERN NOTCH OAK OF OIL
    OLD OLIVE ONE OPTION ORNAMENTS OUT OVERLINE OVERLONG
    PEEP PEOPLE PERCENT PERCUSSIVE PICKET PING PLACE PLACEHOLDER PLURAL POETIC
    POETRY POINT POINTED POUND POWERS PRECEDED PREFIXED PROLONGED QUOTATION RAISED
    RAYS RECTANGULAR REDUPLICATION REMEDY ROAR ROTUNDA ROUND SALT SECOND SEGMENT
    SEGMENTED SEMISOFT SEPTUPLE SEVENTY SHAPED SHAPING SHARP SHELF SHELL SHORTENER
    SIX SIXTIETH SIXTY SOFTNESS SOURCE SOUTHERN SPACING SPEAR SPENT SPICE
    SPIDERY SPIRAL SPIRANT SQUAT SQUIRREL STAGE STALLION START STARTING STATERS
    STEM STIRRUP STRAIGHT STRETCHED STRIKETHROUGH STROKES SUBJOINER SURE SWASH SWIMMING
    SWIRL SWORD TACK TAILED TAILLESS TALENTS TANGENT TEN TERMINAL TEXT
    THEY THICK THIGH THING THIRD THIRDS THIRTY THOUSANDS TIGHT TORTOISE
    TOTAL TRADITIONAL TRAILING TREE TRIANGULAR TRIDENT TRILL TRILLIONS TRUNCATED TWENTIETHS
    TWENTY TWIG UNASPIRATED UNBLENDED UNIT UNKNOWN UP UPRIGHT UPTURN
    USED VARIANT VERSE VESSEL WALLED WESTERN WHEAT WHEEL WHEELED WITH
    WITHOUT WOMAN WORDSPACE YEAR
""".split())

# 旧版词表里已在 KEEP 的希腊/希伯来/阿拉伯字母本名等，一并保留
_KEEP_LEGACY = set("""
    A AA AIN ALEF ALPHA ASH AYIN B BA BEH BETA BHA
    C CHA CHI CHIEUCH CIEUC D DAD DAGESH DAL DDA DDHA DELTA
    DHA DIGAMMA DIGEUD DJE DOT E EL EM EN EPACT EPSILON ER
    ES ETA F FEH FEI G GA GALI GAMMA GHA GHAIN GJE
    H HA HAH HAMZA HEH HETA HIEUH HIRIQ HOLAM HORA I IE
    IEUNG IOTA J JA JEEM JHA K KA KAF KAPH KAPPA KAREN
    KASRA KHA KHAH KHEI KHIEUKH KIYEOK KOPPA L LA LAGAB LAING LAK
    LAM LAMBDA LAMED LU M MA MAKSURA MAPIQ MEEM MEM MIEUM MTAVRULI
    MU N NGA NIEUN NNA NOON NU NUN NYA O OMEGA OMICRON
    P PA PAO PATAH PE PHA PHASE PHI PHIEUPH PI PIEUP PSI
    Q QAMATS QOF QOPH QUBUTS R RA RAFE REH RESH RHO RIEUL
    S SA SAD SAMEKH SAMPI SEEN SEGOL SHA SHAN SHEEN SHEI SHEVA
    SHIN SIGMA SIOS SSA STIGMA T TAH TAU TAV TE TEH TET
    THA THAL THAM THETA THIEUTH TIKEUT TSADE TSADI TSE TSERE TTA TTHA
    U UPSILON V VA VAV W WAW X XI Y YA YEH
    YOD Z ZAH ZAIN ZAYIN ZETA ZHE
""".split())

# KEEP = 所有「非英语实词」类目之和 － ENGLISH。ENGLISH 是唯一权威黑名单，
# 两边严格互斥，别再另抄一份减法表（历史副本曾与 ENGLISH 脱节，见注释）。
KEEP = (set().union(_KEEP_SYLLABLE, _KEEP_LETTER, _KEEP_CUNEIFORM, _KEEP_SCRIPTNAME,
                    _KEEP_CODE, _KEEP_TRANSLIT, _KEEP_LEGACY)) - ENGLISH

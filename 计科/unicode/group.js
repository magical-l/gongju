// 〾 //303E Ideographic Variation Indicator 异体字标识符，不可见

const 月份汉字合字 = {name: '月份', intro: '阿拉伯数字与汉字‘月’的合字', parts: [{from: 0x32C0, to: 0x32CB}]};// ㋀~㋋
const 日期汉字合字 = {name: '日期', intro: '阿拉伯数字与汉字‘日’的合字', parts: [{from: 0x33E0, to: 0x33FE}]};// ㏠~㏾
const 钟点汉字合字 = {name: '钟点', intro: '阿拉伯数字与汉字‘点’的合字', parts: [{from: 0x3358, to: 0x3370}]};// ㍘~㍰
const 七曜日 = {
	name: '星期几的名称',
	intro: '中国唐代从摩尼教引进，七曜日（日曜日=周日，月曜日=周一，火曜日=周二，水曜日=周三，木曜日=周四，金曜日=周五，土曜日=周六）作为一周七天的注释存在，未广泛流行。现在在日本使用较广。',
	parts: [
		{from: 0x322A, to: 0x3230},//带括号的月火水木金土日
		{from: 0x328A, to: 0x3290}//带圈的月火水木金土日
	]
};

const 科学单位合字 = {
	name: '科学单位合字',
	intro: '科学单位合并成一个字符，比如㎐（赫兹）、㏀（千欧）等。东亚特供，多见于日文。（西方直接写那几个字母，不合并）',
	parts: [
		{from: 0x3380, to: 0x33CF},
		{from: 0x32CC, to: 0x32CE}//Hg（汞柱）、erg（尔格，能量单位）、eV（电子伏特）
	]
};

const 古汉字标点 = {
	name: '古汉字标点',
	parts: [
		0x16FE2,//古汉语句读钩标记/OLD CHINESE HOOK MARK，在中国古代文献（如竹简、抄本）中用作标点，表示一个停顿或断句。
		0x16FE3//古汉字叠字符号/OLD CHINESE ITERATION MARK，在中国古代文献中使用的叠字标记，其功能等价于“々”(3005)和竖排的“〻”(303B)。
	]
};
const 汉字标点 = {
	name: '标点',
	parts: [//按常用程度排序
		{
			name: '普通横排标点',
			parts: [
				'，',//FF0C
				'。',//3002
				'、',//3001
				'！',//FF01
				'？',//FF1F
				'：',//FF1A
				'；',//FF1B
				'“',//201C
				'”',//201D
				'‘',//2018
				'’',//2019
				'—',//2014：破折号的一半
				'…',//2026：省略号的一半
				'（',//FF08
				'）',//FF09
				{from: 0x3008, to: 0x301B, exclude: ['〒', '〓']},//
				'　',//3000：全角空格/Ideographic Space
				'〃', //3003：‘同上’标记
				'々' //3005：横排汉字叠字标记/IDEOGRAPHIC ITERATION MARK
			]
		},
		{
			name: '普通竖排标点',
			parts: [
				{from: 0xFE10, to: 0xFE1F}, //竖排形式/Vertical Forms，目前只到FE09，后面几个位置还空着。
				'　',//3000：全角空格/Ideographic Space
				'〻'//303B：竖排汉字叠字标记/VERTICAL IDEOGRAPHIC ITERATION MARK，相当于竖排的‘々’
			]
		},
		{
			name: '普通横排标点变体',
			parts: [
				//todo：一些奇怪的逗号、句号等的变体。
				'〿'//303F：半角空格/Ideographic Half Fill Space，象形文字的半宽空格，与全角空格对应，跟32‘ ’不一样。
			]
		},
		{
			name: '普通竖排标点变体',
			parts: [
				{from: 0xFE50, to: 0xFE6B},//小型变体/Small Form Variants，多数是竖排用。
				{from: 0xFE30, to: 0xFE4F},//中日朝兼容形式/CJK Compatibility Forms，兼容其他编码集的竖排中文标点。
				'〿'//303F：半角空格/Ideographic Half Fill Space，象形文字的半宽空格，与全角空格对应，跟32‘ ’不一样。
			]
		},
		古汉字标点
	]
};

const Kanbun汉字 = {from: 0x3192, to: 0x319F};
const Kanbun = {
	name: 'Kanbun',
	intro: '主要用于处理日本对中文古典文本的注释符号。如㆕、㆖、㆚、㆝。',
	parts: [
		{from: 0x3190, to: 0x3191},
		Kanbun汉字
	]
};//比Kanbu汉字多了两个日文字符

//#############################

const 汉字变体符号 = {
	name: '汉字变体符号',
	intro: '由汉字产生的符号化变体',
	parts: [
		{
			name: '装饰',
			intro: '带有装饰符号（如圈、方框、括号）的汉字',
			parts: [
				{from: 0x3220, to: 0x3247}, // 带括号汉字
				{from: 0x3280, to: 0x32B0}, // 带圈汉字
				{from: 0x1F210, to: 0x1F251}, // 带框汉字
				{from: 0x1FA60, to: 0x1FA6D}, // 象棋棋子
				{from: 0x1F000, to: 0x1F005}, // 麻将风向牌
				{from: 0x1F007, to: 0x1F00F}, // 麻将萬字牌
				{from: 0x1F022, to: 0x1F02A},  // 麻将花牌、百搭
				{from: 0x1F210, to: 0x1F265, exclude: [0x1F213]}//装饰象形文字补充/Enclosed Ideographic Supplement
			]
		},
		{
			name: '合字',
			parts: [
				{from: 0x1F007, to: 0x1F00F}, // 麻将萬字牌
				0x1F02A,  // 麻将百搭牌
				...月份汉字合字.parts, ...日期汉字合字.parts, ...钟点汉字合字.parts,//只引入月份、日期、钟点的字符，不作为独立的子级分组。
				'㍻', '㍼', '㍽', '㍾', // 日本几个天皇年号符号 337B~337E
				'㋿',//32FF
				'㍿'//337F
			]
		},
		{
			name: '草书',
			intro: '实际上源于一些‘假名’区，收录的是古籍中的‘假名’，它们本身就源于汉字草书且尚未简化。',
			parts: [
				{from: 0x1B000, to: 0x1B0FF},//假名补充/Kana Supplement
				{from: 0x1B100, to: 0x1B12F}//假名扩展A/Kana Extended-A
			]
		},
		{
			name: '用作标记',
			parts: [
				Kanbun汉字
			]
		}
	]
};

const 汉语普通数字 = {
	name: '普通数字',
	parts: [
		'零',//96F6
		'一',//4E00
		'二',//4E8C
		'三',//4E09
		'四',//56DB
		'五',//4E94
		'六',//516D
		'七',//4E03
		'八',//516B
		'九',//4E5D
		'十',//5341
		'廿',//5EFF
		'卅',//5345
		'卌',//534C
		'百',//767E
		'千',//5343
		'万',//4E07
		'亿',//4EBF
		'兆',//5146
		'京',//4EAC
		'垓',//5793
		'秭',//79ED
		'穰',//7A70
		'沟',//6C9F
		'涧',//6DA7
		'正',//6B63
		'载',//8F7D
		'〇',//3007
		{from: 0x3220, to: 0x3229},//括号数字一-十
		{from: 0x3280, to: 0x3289}//带圈数字㊀~㊉
	]
};
const 汉语大写数字 = {
	name: '大写数字',
	parts: [
		'壹',//58F9
		'贰',//8D30
		'叁',//53C1
		'肆',//8086
		'伍',//4F0D
		'陆',//9646
		'柒',//67D2
		'捌',//634C
		'玖',//7396
		'拾',//62FE
		'佰',//4F70
		'仟',//4EDF
		'萬',//842C
		'億'//5104
		// 更大的计数单位无大写数字
	]
};
const 天干 = {
	name: '天干',
	parts: [
		'甲',//7532
		'乙',//4E59
		'丙',//4E19
		'丁',//4E01
		'戊',//620A
		'己',//5DF1
		'庚',//5E9A
		'辛',//8F9B
		'壬',//58EC
		'癸'//7678
	]
};
const 地支 = {
	name: '地支',
	parts: [
		'子',//5B50
		'丑',//4E11
		'寅',//5BC5
		'卯',//536F
		'辰',//8FB0
		'巳',//5DF3
		'午',//5348
		'未',//672A
		'申',//7533
		'酉',//9149
		'戌',//620C
		'亥'//4EA5
	]
};

const 汉字 = {
	//todo：中日朝汉字是混放的，只有根据‘IRG 源’才能判断：
	//kIRG_GSource: 来源为中国大陆 (Mainland China - G)
	//kIRG_JSource: 来源为日本 (Japan - J)
	//kIRG_KSource: 来源为韩国 (Korea - K)
	//kIRG_TSource: 来源为台湾 (Taiwan - T)
	//kIRG_VSource: 来源为越南 (Vietnam - V)
	// 例如，汉字“辻” (U+8FBB，意为十字路口)，其 kIRG_JSource字段会显示它来自日本的 JIS 标准。
	name: '汉字',
	intro: '任何能当成单个汉字用的字符',
	parts: [
		{
			name: '常用字',
			parts: [
				{from: 0x4E00, to: 0x9FFF}
			]
		},
		{
			name: '生僻字',
			parts: [
				{from: 0x3400, to: 0x4DBF},//扩展A，以‘㐀’开头。
				{from: 0x20000, to: 0x2A6DF},//扩展B，以‘𠀀’开头。
				{from: 0x2A700, to: 0x2B73F},//扩展C，以‘𪜀’开头。
				{from: 0x2B740, to: 0x2B81F},//扩展D，以‘𫝀’开头。
				{from: 0x2B820, to: 0x2CEAF},//扩展E，以‘𫠠’开头。
				{from: 0x2CEB0, to: 0x2EBEF},//扩展F，以‘𬺰’开头。
				{from: 0x30000, to: 0x3134A},//扩展G，以‘𰀀’开头。
				{from: 0x31350, to: 0x323AF},//扩展H
				{from: 0x2EBF0, to: 0x2EE5F}//扩展I
			]
		},
		{
			name: '兼容汉字',
			intro: '逻辑上unicode已收录该字，但又收录了一些变体字符，可能字形略有不同。',
			parts: [
				{from: 0xF900, to: 0xFAFF},//兼容表意文字
				{from: 0x2F800, to: 0x2FA1F}//兼容补充
			]
		}
	]
};

const 汉字系统 = {
	name: '汉字系统',
	intro: '包含汉语书面材料可能用到的任何文字类字符、符号、标记和标点',
	parts: [
		汉字,
		{
			name: '计数计量',
			intro: '在汉语中用来计数、计量的字符',
			parts: [
				汉语普通数字, 汉语大写数字, 天干, 地支, 月份汉字合字, 日期汉字合字, 钟点汉字合字, 七曜日,
				{
					name: '苏州码子',
					parts: [
						'〇',//3007
						{from: 0x3021, to: 0x3029}, // 〡-〩
						{from: 0x3038, to: 0x303A}  // 〸〹〺
					]
				},
				{name: '算筹数码', parts: [{from: 0x1D360, to: 0x1D378}]}//写在注释里可能显示不了。
			]
		},
		汉字变体符号,
		{
			name: '偏旁部首',
			parts: [
				{from: 0x2F00, to: 0x2FDF},//康熙部首/CJK Radicals / Kangxi Radicals，《康熙字典》中收录的部首，皆为繁体，比如2FD3‘⿓’（跟作为汉字的9F8D‘龍’不同）。
				{from: 0x2E80, to: 0x2EFF}//部首补充/CJK Radicals Supplement，包括简化的部首，比如2EF0‘⻰’（跟作为汉字9F99‘龙’不同）。
			]
		},
		{
			name: '汉字结构符',
			ename: 'Ideographic Description Characters',
			intro: '每个都代表一种特定的汉字结构关系',
			parts: [{from: 0x2FF0, to: 0x2FFF}]//⿰⿱⿲⿳⿴⿵⿶⿷⿸⿹⿺⿻等
		},
		{name: '笔画', ename: 'CJK Strokes', parts: [{from: 0x31C0, to: 0x31EF}]},
		汉字标点,
		科学单位合字,
		{
			name: '汉语拼音',
			parts: [
				{
					name: '声母',
					parts: [
						'b',//62
						'p',//70
						'm',//6D
						'f',//66
						'd',//64
						't',//74
						'n',//6E
						'l',//6C
						'g',//67
						'k',//6B
						'h',//68
						'j',//6A
						'q',//71
						'x',//78
						'r',//72
						'z',//7A
						'c',//63
						's',//73
						'y',//79
						'w'//77
					]
				},
				{
					name: '韵母',
					parts: [
						'a',//61
						'o',//6F
						'e',//65
						'i',//69
						'u',//75
						'ü'//FC
					]
				},
				{
					name: '音调',
					parts: [
						0x0304,// 阴平调（第一声）
						0x0301,// 阳平调（第二声）
						0x030C,// 上声调（第三声）
						0x0300,// 去声调（第四声）
						0x0307// 轻声（有时用）
					]
				},
				{
					name: '带调韵母',
					intro: 'unicode没有收录带声调的汉语拼音韵母，下面是从拉丁字母中借用的同形字符，覆盖不全面',
					parts: [// 预组合带调韵母 todo：可能有的有误。
						{from: 0x00E0, to: 0x00E0}, // à
						{from: 0x00E1, to: 0x00E1}, // á
						{from: 0x00E2, to: 0x00E2}, // â
						{from: 0x00E4, to: 0x00E4}, // ä
						{from: 0x00E8, to: 0x00E8}, // è
						{from: 0x00E9, to: 0x00E9}, // é
						{from: 0x00EA, to: 0x00EA}, // ê
						{from: 0x00EB, to: 0x00EB}, // ë
						{from: 0x00EC, to: 0x00EC}, // ì
						{from: 0x00ED, to: 0x00ED}, // í
						{from: 0x00EE, to: 0x00EE}, // î
						{from: 0x00EF, to: 0x00EF}, // ï
						{from: 0x00F2, to: 0x00F2}, // ò
						{from: 0x00F3, to: 0x00F3}, // ó
						{from: 0x00F4, to: 0x00F4}, // ô
						{from: 0x00F6, to: 0x00F6}, // ö
						{from: 0x00F9, to: 0x00F9}, // ù
						{from: 0x00FA, to: 0x00FA}, // ú
						{from: 0x00FB, to: 0x00FB}, // û
						{from: 0x00FC, to: 0x00FC}, // ü
						{from: 0x0101, to: 0x0101}, // ā
						{from: 0x0103, to: 0x0103}, // ă
						{from: 0x01CE, to: 0x01CE}, // ǎ
						{from: 0x0113, to: 0x0113}, // ē
						{from: 0x0115, to: 0x0115}, // ĕ
						{from: 0x011B, to: 0x011B}, // ě
						{from: 0x012B, to: 0x012B}, // ī
						{from: 0x012D, to: 0x012D}, // ĭ
						{from: 0x01D0, to: 0x01D0}, // ǐ
						{from: 0x014D, to: 0x014D}, // ō
						{from: 0x014F, to: 0x014F}, // ŏ
						{from: 0x01D2, to: 0x01D2}, // ǒ
						{from: 0x016B, to: 0x016B}, // ū
						{from: 0x016D, to: 0x016D}, // ŭ
						{from: 0x01D4, to: 0x01D4}, // ǔ
						{from: 0x01D6, to: 0x01D6}, // ǖ
						{from: 0x01D8, to: 0x01D8}, // ǘ
						{from: 0x01DA, to: 0x01DA}, // ǚ
						{from: 0x01DC, to: 0x01DC}, // ǜ
						// 拉丁字母ɑ带调
						{from: 0x0251, to: 0x0304}, // ɑ̄ (组合字符)
						{from: 0x0251, to: 0x0301}, // ɑ́ (组合字符)
						{from: 0x0251, to: 0x030C}, // ɑ̌ (组合字符)
						{from: 0x0251, to: 0x0300}  // ɑ̀ (组合字符)
					]
				}
			]
		},
		{
			name: '注音符号',
			ename: 'Bopomofo',
			intro: '理论上也分声母韵母，音调同拼音的，但有点复杂，先不管。',
			parts: [
				{from: 0x3100, to: 0x312F},//注音符号/Bopomofo：ㄅㄆㄇㄈ等
				{from: 0x31A0, to: 0x31BF}//注音符号扩展/Bopomofo Extended
			]
		},
		{
			name: '中古汉语声调符号',
			intro: '平上去入四声的标调符，需要结合另一个字符来用',
			parts: [
				0x302A,//平声/Ideographic Level Tone Mark
				0x302B,//上声/Ideographic Rising Tone Mark
				0x302C,//去声/Ideographic Departing Tone Mark
				0x302D//入声/Ideographic Entering Tone Mark
			]
		},
		{
			name: '古文字',
			intro: '古汉字。是现代汉字的老祖宗（比如甲骨文、金文、小篆等），不包括旁亲（比如西夏文、契丹文等）。目前unicode尚未正式收录。',
			parts: [
				{name: '甲骨文', parts: []},
				{name: '金文', parts: []},
				{name: '小篆', parts: []},
			]
		}
	]
};//汉字系统

const 日文合略假名 = {
	name: '合略假名',
	intro: '变体假名的一种特殊形式，它是将两个或以上的假名（或汉字）通过草书笔迹巧妙地连笔、简化，合并成一个字符的书写形式。现已废弃。',
	parts: [
		'ゟ',//309F：より (yori)
		'ヿ'//30FF：コト (koto)
	]
};
const 日文系统 = {
	name: '日文系统',
	intro: '包含日语书面材料可能用到的所有字符、符号和标记',
	parts: [
		汉字,
		{
			name: '假名系统',
			intro: '平假名和片假名',
			parts: [
				{
					name: '平假名',
					parts: [
						{from: 0x3041, to: 0x3096}, // 基本平假名
						{from: 0x309D, to: 0x309F}, // 平假名迭代标记
						{from: 0x1B000, to: 0x1B0FF} // 平假名扩展
					]
				},
				{
					name: '片假名',
					parts: [
						{from: 0x30A1, to: 0x30FA}, // 基本片假名
						{from: 0x30FD, to: 0x30FF}, // 片假名迭代标记
						{from: 0x31F0, to: 0x31FF}, // 片假名音标扩展
						{from: 0x1B100, to: 0x1B12F}, // 假名补充扩展
						{from: 0xFF66, to: 0xFF9F}  // 半角片假名（作为变体）
					]
				},
				{
					name: '振假名',
					parts: [
						{from: 0x3099, to: 0x309C}, // 假名发音符
						{from: 0xFF9E, to: 0xFF9F}  // 半角假名发音符
					]
				},
				{
					name: '冷僻假名',
					parts: [
						{from: 0x1B000, to: 0x1B0FF},//Kana Supplement
						{from: 0x1B100, to: 0x1B12F},//Kana Extended-A
						{from: 0x1AFF0, to: 0x1AFFF},//Kana Extended-B
						{from: 0x1B130, to: 0x1B16F}//Small Kana Extension
					]
				},
				日文合略假名
			]
		},
		{
			name: '计数计量',
			intro: '在日文中用来计数、计量的字符',
			parts: [汉语普通数字, 汉语大写数字, 天干, 地支, 月份汉字合字, 日期汉字合字, 钟点汉字合字, 七曜日]
		},
		汉字变体符号,//引用
		{
			name: '假名变体符号',
			parts: [
				{from: 0x32D0, to: 0x32FE},//带圈假名
				'🈀',//1F200，‘其他’标记
				'🈁',//1F201，‘这里’标记
				'🈂',//1F202，‘服务’标记
				'🈓'//1F213，数据广播方面的标记
			]
		},
		{
			name: '标点',
			parts: [
				...汉字标点.parts,
				{
					name: '日文专用标点',
					intro: '在汉字标点外额外创造的标点。',
					parts: [
						{from: 0x301D, to: 0x301F},//日文双引号
						'〜',//301C，波浪线
						'〰',//3030，波浪线变体
						'ー'//30FC (长音符号)
					]
				}
			]
		},
		{
			name: '文本功能标记',
			intro: '用于文本编辑、结构表示和特殊功能的标记',
			parts: [
				'〆', //3006 结束标记
				'〓', //3013 代字符号
				{from: 0x3031, to: 0x3035},//竖排假名重复标记
				'〽', // 303D Part Alternation Mark（部分交替标记），主要用于日本民歌（民谣）的乐谱中。
				'〼' //303C：枡标记，代表日本传统的木制计量容器“枡”（masu）。有时在菜单、招牌或传统风格的描述中用作装饰或缩写，表示食物或清酒的一份（一杯）。
			]
		},
		{
			name: '专用标记',
			parts: [
				'㍻', '㍼', '㍽', '㍾', //337B~337E
				'㋿', //32FF
				{from: 0x3231, to: 0x3247},
				{from: 0x3291, to: 0x32B0},
				'㍿',//337F：株式会社（股份有限公司）
				'㋏',//32CF：有限责任标志
				'㉐',//3250：合伙企业标志
				'〄',//3004：JIS标记
				'〒',//3012：邮政标记
				'〠',//3020：邮政表情
				'〼', //303C：枡标记，代表日本传统的木制计量容器“枡”（masu）。有时在菜单、招牌或传统风格的描述中用作装饰或缩写，表示食物或清酒的一份（一杯）。
				'🈀',//1F200，‘其他’标记
				'🈁',//1F201，‘这里’标记
				'🈂',//1F202，‘服务’标记
				'🈓'//1F213，数据广播方面的标记
			]
		},
		{
			name: '科学单位合字',
			parts: [
				{from: 0x3300, to: 0x3357},//假名拼写的科学单位的合字。
				科学单位合字
			]
		},
		{
			name: '古文字和古符号',
			parts: [
				日文合略假名,
				Kanbun
			]
		}
	]
};//日文系统

const 朝鲜文系统 = {
	name: '朝鲜文系统',
	intro: '包含朝鲜语（韩语）书面材料可能用到的所有字符、符号和标记',
	parts: [
		汉字,
		{
			name: '谚文系统',
			intro: '朝鲜文特有的表音文字',
			parts: [
				{
					name: '谚文字母',
					parts: [
						{from: 0x1100, to: 0x11FF}, // 基本谚文字母
						{from: 0xA960, to: 0xA97F}, // 谚文字母扩展A
						{from: 0xD7B0, to: 0xD7FF}, // 谚文字母扩展B
						{from: 0xFFA0, to: 0xFFDC}, // 半角谚文字母
						{from: 0x3130, to: 0x318F}  // 谚文兼容字母
					]
				},
				{
					name: '谚文音节',
					intro: '用谚文字母拼好的音节',
					parts: [{from: 0xAC00, to: 0xD7A3}]
				},
				{
					name: '谚文发音符号',//似乎现在已废弃
					parts: [
						0x302E,//〮：Hangul Single Dot Tone Mark 谚文单点声调标记
						0x302F//〯：Hangul Double Dot Tone Mark 谚文双点声调标记
					]
				}
			]
		},
		{
			name: '计数计量',
			intro: '在朝鲜文中用来计数、计量的字符',
			parts: [
				汉语普通数字, 汉语大写数字, 天干, 地支, 月份汉字合字, 日期汉字合字, 钟点汉字合字
			]
		},
		汉字变体符号,//引用
		{
			name: '谚文字母变体符号',
			parts: [
				{from: 0x3200, to: 0x321E}, // 括号谚文字母
				{from: 0x3260, to: 0x327F} // 带圈谚文字母
			]
		},
		汉字标点,
		{
			name: '专用标记',
			parts: [
				'㉾',//327E：CIRCLED HANGUL IEUNG U，postal code mark，韩国邮政标志
				'㉿'//327F：KOREAN STANDARD SYMBOL，韩国标准标志
			]
		},
		{
			name: '科学单位合字',
			parts: [
				{from: 0x3300, to: 0x3357},//假名拼写的科学单位的合字。
				科学单位合字
			]
		}
	]
};//朝鲜文系统

// 辅助函数：查找分组
function findGroupById(root, id) {
	if (root.id === id) {
		return root;
	}

	if (root.parts) {
		for (const part of root.parts) {
			if (typeof part === 'object') {
				const found = findGroupById(part, id);
				if (found) {
					return found;
				}
			}
		}
	}

	return null;
}

const groups = [];
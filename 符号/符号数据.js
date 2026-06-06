const CATEGORIES = {
	"表情": [],
	"日常用品和概念": [],
	"警告、危险": [],
	"出行、交通、旅游": [],
	"箭头、方向": [],
	"经济、商业、货币": [],
	"建筑": [],
	"饮食": [],
	"艺术": [],
	"音乐": [],
	"体育、运动": [
		"围棋",
		"国际象棋",
		"中国象棋",
		"扑克牌",
		"麻将",
		"骰子/色子",
		"多米诺骨牌"
	],
	"语文、语言学、标点符号": [
		"西文字母变体",
		"音标",
		"平假名",
		"片假名",
		"括号和引号",
		"CJK符号和标点",
		"竖排形式",
		"CJK兼容形式",
		"小写变体形式",
		"半角及全角形式",
		"标记符号"
	],
	"数学": [
		"数字",
		"运算符、操作符、比较符",
		"几何图形"
	],
	"自然": [
		"物理、化学",
		"生物",
		"天文",
		"抽象星形符号",
		"天气",
		"地理",
		"自然现象"
	],
	"哲学、宗教、神秘学": [
		"《易经》符号（八卦、六十四卦）",
		"《太玄经》符号（八十一首）"
	],
};


const SYMBOLS = [
	{
		"char": "😀",
		"name": "咧嘴笑脸",
		"ename": "Grinning Face",
		"tags": [
			"表情"
		],
		"alias": [
			"嘿嘿",
			"笑脸",
			"脸",
			"高兴"
		]
	},
	{
		"char": "😃",
		"name": "张嘴笑脸",
		"ename": "Grinning Face With Big Eyes",
		"tags": [
			"表情"
		],
		"alias": [
			"哈哈",
			"太棒了",
			"开口笑",
			"开口笑脸",
			"笑脸",
			"脸",
			"高兴"
		]
	},
	{
		"char": "😄",
		"name": "眯眼笑脸",
		"ename": "Grinning Face With Smiling Eyes",
		"tags": [
			"表情"
		],
		"alias": [
			"哈哈",
			"大笑",
			"开口而笑的脸",
			"开心",
			"笑",
			"脸",
			"露齿而笑",
			"高兴"
		]
	},
	{
		"char": "😁",
		"name": "露齿笑脸",
		"ename": "Beaming Face With Smiling Eyes",
		"tags": [
			"表情"
		],
		"alias": [
			"嘻嘻",
			"笑脸",
			"笑颜",
			"脸",
			"露齿而笑"
		]
	},
	{
		"char": "😅",
		"name": "冷汗笑脸",
		"ename": "Grinning Face With Sweat",
		"tags": [
			"表情"
		],
		"alias": [
			"冷汗",
			"出汗",
			"开口冒冷汗的脸",
			"汗",
			"泄气",
			"紧张",
			"脸",
			"苦笑"
		]
	},
	{
		"char": "😂",
		"name": "笑哭",
		"ename": "Face With Tears of Joy",
		"tags": [
			"表情"
		],
		"alias": [
			"lol",
			"喜极而泣",
			"大笑",
			"眼泪",
			"笑",
			"笑哭了",
			"脸"
		]
	},
	{
		"char": "🤣",
		"name": "笑滚",
		"ename": "Rolling On The Floor Laughing",
		"tags": [
			"表情"
		],
		"alias": [
			"lolol",
			"乐翻了",
			"哈哈",
			"地板",
			"太扯了",
			"打滚",
			"满地打滚的笑",
			"笑",
			"笑得流泪",
			"笑得满地打滚",
			"脸",
			"超扯"
		]
	},
	{
		"char": "😊",
		"name": "羞笑脸",
		"ename": "Smiling Face With Smiling Eyes",
		"tags": [
			"表情"
		],
		"alias": [
			"害羞",
			"微笑",
			"满意",
			"笑脸相迎",
			"羞涩",
			"羞涩微笑",
			"脸",
			"脸红"
		]
	},
	{
		"char": "😇",
		"name": "天使",
		"ename": "Smiling Face With Halo",
		"tags": [
			"表情"
		],
		"alias": [
			"光环",
			"天真",
			"幻想",
			"微笑",
			"微笑天使",
			"脸",
			"顶罩光环的笑脸"
		]
	},
	{
		"char": "🙂",
		"name": "浅笑",
		"ename": "Slightly Smiling Face",
		"tags": [
			"表情"
		],
		"alias": [
			"呵呵",
			"开心",
			"浅笑的脸",
			"笑",
			"脸"
		]
	},
	{
		"char": "🙃",
		"name": "倒脸",
		"ename": "Upside-Down Face",
		"tags": [
			"表情"
		],
		"alias": [
			"好玩",
			"好笑",
			"脸",
			"颠倒",
			"颠倒的脸"
		]
	},
	{
		"char": "😉",
		"name": "眨眼",
		"ename": "Winking Face",
		"tags": [
			"表情"
		],
		"alias": [
			"媚眼",
			"撩拨",
			"眨眼的脸",
			"笑",
			"脸"
		]
	},
	{
		"char": "😌",
		"name": "释然",
		"ename": "Relieved Face",
		"tags": [
			"表情"
		],
		"alias": [
			"如释重负",
			"松了口气",
			"松口气",
			"脸",
			"蝉"
		]
	},
	{
		"char": "😍",
		"name": "花痴",
		"ename": "Smiling Face With Heart-Eyes",
		"tags": [
			"表情"
		],
		"alias": [
			"我爱你",
			"爱",
			"红心",
			"脸"
		]
	},
	{
		"char": "🥰",
		"name": "心心眼",
		"ename": "Smiling Face With Hearts",
		"tags": [
			"表情"
		],
		"alias": [
			"三颗爱心的笑脸",
			"喜笑颜开",
			"心",
			"我爱你",
			"爱慕",
			"相爱",
			"笑脸",
			"迷恋",
			"陷入爱河"
		]
	},
	{
		"char": "😘",
		"name": "飞吻",
		"ename": "Face Blowing a Kiss",
		"tags": [
			"表情"
		],
		"alias": [
			"亲亲",
			"想你",
			"我爱你",
			"眨眼",
			"脸"
		]
	},
	{
		"char": "😋",
		"name": "馋嘴",
		"ename": "Face Savoring Food",
		"tags": [
			"表情"
		],
		"alias": [
			"口水",
			"哈喇子",
			"好吃",
			"津津有味",
			"流口水",
			"美味",
			"脸"
		]
	},
	{
		"char": "😛",
		"name": "吐舌",
		"ename": "Face With Tongue",
		"tags": [
			"表情"
		],
		"alias": [
			"吐舌头的脸",
			"太好了",
			"脸",
			"舌头",
			"调皮"
		]
	},
	{
		"char": "😜",
		"name": "眨眼吐舌",
		"ename": "Winking Face With Tongue",
		"tags": [
			"表情"
		],
		"alias": [
			"单眼",
			"单眼吐舌",
			"古怪",
			"吐舌",
			"开玩笑",
			"怪人",
			"挤眉弄眼",
			"脸"
		]
	},
	{
		"char": "🤪",
		"name": "疯脸",
		"ename": "Zany Face",
		"tags": [
			"表情"
		],
		"alias": [
			"大小眼",
			"大眼",
			"小眼",
			"滑稽",
			"滑稽的脸",
			"疯狂的脸",
			"疯眼",
			"脸"
		]
	},
	{
		"char": "🤨",
		"name": "挑眉",
		"ename": "Face With Raised Eyebrow",
		"tags": [
			"表情"
		],
		"alias": [
			"不信任",
			"不敢置信",
			"不赞同",
			"怀疑",
			"氧起眉毛的脸",
			"眉毛上挑的脸",
			"脸"
		]
	},
	{
		"char": "🤓",
		"name": "书呆",
		"ename": "Nerd Face",
		"tags": [
			"表情"
		],
		"alias": [
			"专家",
			"书呆子",
			"书呆子脸",
			"天才",
			"奇葩",
			"宅男",
			"极客",
			"眼镜",
			"眼镜笑脸",
			"聪明",
			"脸"
		]
	},
	{
		"char": "😎",
		"name": "墨镜",
		"ename": "Smiling Face With Sunglasses",
		"tags": [
			"表情"
		],
		"alias": [
			"太阳镜",
			"眼镜",
			"耶",
			"脸",
			"酷",
			"墨镜笑脸"
		]
	},
	{
		"char": "🤩",
		"name": "星星眼",
		"ename": "Star-Struck",
		"tags": [
			"表情"
		],
		"alias": [
			"兴奋",
			"咧嘴笑",
			"好崇拜哦",
			"满天星",
			"满眼星",
			"脸",
			"追星族",
			"露齿笑"
		]
	},
	{
		"char": "🥳",
		"name": "派对",
		"ename": "Partying Face",
		"tags": [
			"表情"
		],
		"alias": [
			"号角",
			"喝彩",
			"帽子",
			"庆祝",
			"狂欢的脸",
			"生日",
			"聚会",
			"聚会笑脸",
			"脸",
			"节日快乐"
		]
	},
	{
		"char": "😏",
		"name": "坏笑",
		"ename": "Smirking Face",
		"tags": [
			"表情"
		],
		"alias": [
			"假笑",
			"冷笑",
			"得意",
			"得意的笑",
			"脸",
			"诡异地笑"
		]
	},
	{
		"char": "😒",
		"name": "不爽",
		"ename": "Unamused Face",
		"tags": [
			"表情"
		],
		"alias": [
			"不屑",
			"不服",
			"不爽的脸",
			"不高兴",
			"脸",
			"郁闷",
			"鄙视",
			"随便啦"
		]
	},
	{
		"char": "😞",
		"name": "失望",
		"ename": "Disappointed Face",
		"tags": [
			"表情"
		],
		"alias": [
			"不高兴",
			"失望的脸",
			"脸",
			"难过"
		]
	},
	{
		"char": "😔",
		"name": "沮丧",
		"ename": "Pensive Face",
		"tags": [
			"表情"
		],
		"alias": [
			"失落",
			"心事重重",
			"忧虑",
			"沉思",
			"脸"
		]
	},
	{
		"char": "😕",
		"name": "困惑",
		"ename": "Confused Face",
		"tags": [
			"表情"
		],
		"alias": [
			"不懂",
			"不确定",
			"困扰",
			"疑惑",
			"脸"
		]
	},
	{
		"char": "🙁",
		"name": "微皱眉",
		"ename": "Slightly Frowning Face",
		"tags": [
			"表情"
		],
		"alias": [
			"不开心",
			"不高兴",
			"不高兴的脸",
			"委屈",
			"小委屈",
			"微微不满",
			"心情不好",
			"脸"
		]
	},
	{
		"char": "😣",
		"name": "坚持",
		"ename": "Persevering Face",
		"tags": [
			"表情"
		],
		"alias": [
			"专注",
			"入定",
			"头痛",
			"忍耐",
			"痛苦",
			"脸",
			"难受"
		]
	},
	{
		"char": "😖",
		"name": "难受",
		"ename": "Confounded Face",
		"tags": [
			"表情"
		],
		"alias": [
			"困惑",
			"困惑的脸",
			"焦头烂额",
			"纠结",
			"脸"
		]
	},
	{
		"char": "😫",
		"name": "疲惫",
		"ename": "Tired Face",
		"tags": [
			"表情"
		],
		"alias": [
			"倦容",
			"疲倦",
			"疲劳",
			"累",
			"脸"
		]
	},
	{
		"char": "😩",
		"name": "累趴",
		"ename": "Weary Face",
		"tags": [
			"表情"
		],
		"alias": [
			"疲倦",
			"疲劳",
			"疲惫",
			"累",
			"累死了",
			"脸"
		]
	},
	{
		"char": "🥺",
		"name": "求人",
		"ename": "Pleading Face",
		"tags": [
			"表情"
		],
		"alias": [
			"可怜兮兮的眼神",
			"大眼睛",
			"小狗的脸",
			"怜悯",
			"恳求的脸",
			"祈求",
			"祈求的脸",
			"脸",
			"请求"
		]
	},
	{
		"char": "😢",
		"name": "哭泣",
		"ename": "Crying Face",
		"tags": [
			"表情"
		],
		"alias": [
			"伤心",
			"哀伤",
			"哭",
			"哭脸",
			"泪",
			"脸"
		]
	},
	{
		"char": "😭",
		"name": "大哭",
		"ename": "Loudly Crying Face",
		"tags": [
			"表情"
		],
		"alias": [
			"哭",
			"放声大哭",
			"放声大哭的脸",
			"泪",
			"痛哭",
			"脸"
		]
	},
	{
		"char": "😤",
		"name": "怒气",
		"ename": "Face With Steam From Nose",
		"tags": [
			"表情"
		],
		"alias": [
			"不爽",
			"傲慢",
			"愤怒",
			"气炸了",
			"胜利",
			"自负",
			"赢",
			"趾高气昂"
		]
	},
	{
		"char": "😠",
		"name": "生气",
		"ename": "Angry Face",
		"tags": [
			"表情"
		],
		"alias": [
			"不爽",
			"不高兴",
			"怒",
			"愤怒",
			"脸"
		]
	},
	{
		"char": "😡",
		"name": "愤怒",
		"ename": "Enraged Face",
		"tags": [
			"表情"
		],
		"alias": [
			"发火",
			"发飙",
			"怒",
			"怒火中烧",
			"生气",
			"脸"
		]
	},
	{
		"char": "🤬",
		"name": "咒骂",
		"ename": "Face With Symbols On Mouth",
		"tags": [
			"表情"
		],
		"alias": [
			"不爽",
			"发誓",
			"嘴上有符号的脸",
			"生气",
			"碎碎唸的脸",
			"脸",
			"诅咒"
		]
	},
	{
		"char": "😳",
		"name": "脸红",
		"ename": "Flushed Face",
		"tags": [
			"表情"
		],
		"alias": [
			"困惑",
			"天呀",
			"害羞",
			"羞涩",
			"脸",
			"茫然",
			"迷茫",
			"难以置信"
		]
	},
	{
		"char": "🥵",
		"name": "热脸",
		"ename": "Hot Face",
		"tags": [
			"表情"
		],
		"alias": [
			"中暑",
			"冒汗",
			"出汗",
			"发烧",
			"发热",
			"吐舌",
			"心狂跳",
			"热",
			"脸发烧",
			"脸红"
		]
	},
	{
		"char": "🥶",
		"name": "冷脸",
		"ename": "Cold Face",
		"tags": [
			"表情"
		],
		"alias": [
			"冰柱",
			"冷",
			"冷冰冰",
			"冻",
			"冻僵",
			"满面寒霜",
			"脸",
			"脸色发青",
			"蓝色",
			"零下"
		]
	},
	{
		"char": "😱",
		"name": "惊恐",
		"ename": "Face Screaming In Fear",
		"tags": [
			"表情"
		],
		"alias": [
			"吓死",
			"吓死了",
			"害���",
			"尖叫",
			"恐怖",
			"惊吓大叫的脸",
			"脸",
			"害怕"
		]
	},
	{
		"char": "😨",
		"name": "害怕",
		"ename": "Fearful Face",
		"tags": [
			"表情"
		],
		"alias": [
			"不安",
			"怕",
			"恐怖",
			"恐惧",
			"脸"
		]
	},
	{
		"char": "😰",
		"name": "焦虑",
		"ename": "Anxious Face With Sweat",
		"tags": [
			"表情"
		],
		"alias": [
			"冷汗",
			"张嘴冒冷汗的脸",
			"惊讶",
			"无语",
			"汗",
			"紧张",
			"脸"
		]
	},
	{
		"char": "🤗",
		"name": "拥抱",
		"ename": "Smiling Face With Open Hands",
		"tags": [
			"表情"
		],
		"alias": [
			"抱",
			"抱抱",
			"笑",
			"脸"
		]
	},
	{
		"char": "🤔",
		"name": "思考",
		"ename": "Thinking Face",
		"tags": [
			"表情"
		],
		"alias": [
			"想",
			"想一想",
			"想事情",
			"脸"
		]
	},
	{
		"char": "🤭",
		"name": "捂嘴",
		"ename": "Face With Hand Over Mouth",
		"tags": [
			"表情"
		],
		"alias": [
			"不可说",
			"不说",
			"傻笑",
			"吃吃傻笑",
			"哎呀",
			"意外",
			"捂嘴而笑",
			"猛然发现",
			"秘密",
			"脸"
		]
	},
	{
		"char": "🤫",
		"name": "嘘",
		"ename": "Shushing Face",
		"tags": [
			"表情"
		],
		"alias": [
			"嘘声手势的脸",
			"安静",
			"安静的脸"
		]
	},
	{
		"char": "😶",
		"name": "无语",
		"ename": "Face Without Mouth",
		"tags": [
			"表情"
		],
		"alias": [
			"嘴",
			"安静",
			"沉默",
			"没嘴",
			"秘密",
			"脸"
		]
	},
	{
		"char": "😐",
		"name": "冷漠",
		"ename": "Neutral Face",
		"tags": [
			"表情"
		],
		"alias": [
			"无感",
			"脸",
			"表情空洞",
			"面无表情"
		]
	},
	{
		"char": "😑",
		"name": "面瘫",
		"ename": "Expressionless Face",
		"tags": [
			"表情"
		],
		"alias": [
			"无语",
			"没有反应",
			"绷着脸",
			"脸",
			"茫然",
			"面无表情"
		]
	},
	{
		"char": "😬",
		"name": "尬笑",
		"ename": "Grimacing Face",
		"tags": [
			"表情"
		],
		"alias": [
			"咬牙切齿",
			"尴尬",
			"牙医",
			"脸",
			"露齿",
			"露齿而笑",
			"鬼脸",
			"龇牙咧嘴"
		]
	},
	{
		"char": "🙄",
		"name": "白眼",
		"ename": "Face With Rolling Eyes",
		"tags": [
			"表情"
		],
		"alias": [
			"不敢苟同",
			"无语",
			"翻白眼",
			"脸",
			"随便啦"
		]
	},
	{
		"char": "😯",
		"name": "惊讶",
		"ename": "Hushed Face",
		"tags": [
			"表情"
		],
		"alias": [
			"吃惊",
			"哦",
			"我的天",
			"缄默",
			"脸",
			"静而无语"
		]
	},
	{
		"char": "😮",
		"name": "张口",
		"ename": "Face With Open Mouth",
		"tags": [
			"表情"
		],
		"alias": [
			"吃惊",
			"同情",
			"啊",
			"忘记",
			"我不信",
			"我的天",
			"脸"
		]
	},
	{
		"char": "😲",
		"name": "震惊",
		"ename": "Astonished Face",
		"tags": [
			"表情"
		],
		"alias": [
			"不可以",
			"惊",
			"惊讶",
			"惊讶的脸",
			"没可能",
			"绝不",
			"脸"
		]
	},
	{
		"char": "🥱",
		"name": "打哈欠",
		"ename": "Yawning Face",
		"tags": [
			"表情"
		],
		"alias": [
			"呵欠",
			"哈欠",
			"困",
			"困倦",
			"夜里",
			"打呵欠",
			"打哈欠的脸",
			"无聊",
			"昏昏欲睡",
			"晚安",
			"疲倦",
			"累"
		]
	},
	{
		"char": "😴",
		"name": "睡着",
		"ename": "Sleeping Face",
		"tags": [
			"表情"
		],
		"alias": [
			"呼噜",
			"小睡",
			"想睡",
			"打呼",
			"晚安",
			"睡容",
			"睡着了",
			"睡觉",
			"累",
			"累了",
			"脸"
		]
	},
	{
		"char": "🤤",
		"name": "流口水",
		"ename": "Drooling Face",
		"tags": [
			"表情"
		],
		"alias": [
			"口水",
			"垂涎",
			"垂涎三尺",
			"流口水的脸",
			"脸"
		]
	},
	{
		"char": "😵",
		"name": "晕",
		"ename": "Face With Crossed-Out Eyes",
		"tags": [
			"表情"
		],
		"alias": [
			"头晕",
			"头晕眼花",
			"晕头",
			"晕头的脸",
			"晕头转向",
			"脸"
		]
	},
	{
		"char": "🤐",
		"name": "闭嘴",
		"ename": "Zipper-Mouth Face",
		"tags": [
			"表情"
		],
		"alias": [
			"住嘴",
			"嘴",
			"封口",
			"秘密",
			"脸"
		]
	},
	{
		"char": "🤢",
		"name": "恶心",
		"ename": "Nauseated Face",
		"tags": [
			"表情"
		],
		"alias": [
			"吐",
			"呕",
			"恶心作呕的脸",
			"脸",
			"脸绿了"
		]
	},
	{
		"char": "🤮",
		"name": "呕吐",
		"ename": "Face Vomiting",
		"tags": [
			"表情"
		],
		"alias": [
			"不舒服",
			"吐",
			"呕吐的脸",
			"生病",
			"病容",
			"病恹恹",
			"脸"
		]
	},
	{
		"char": "😷",
		"name": "口罩",
		"ename": "Face With Medical Mask",
		"tags": [
			"表情"
		],
		"alias": [
			"医生",
			"感冒",
			"戴口罩",
			"戴口罩的脸",
			"生病",
			"病菌",
			"脸"
		]
	},
	{
		"char": "🤒",
		"name": "发烧",
		"ename": "Face With Thermometer",
		"tags": [
			"表情"
		],
		"alias": [
			"体温计",
			"咬着体温计的脸",
			"温度计",
			"生病",
			"脸",
			"量体温"
		]
	},
	{
		"char": "🤕",
		"name": "受伤",
		"ename": "Face With Head-Bandage",
		"tags": [
			"表情"
		],
		"alias": [
			"头绑绷带",
			"打绷带",
			"脸"
		]
	},
	{
		"char": "🤑",
		"name": "暴富",
		"ename": "Money-Mouth Face",
		"tags": [
			"表情"
		],
		"alias": [
			"发财",
			"拜金",
			"脸",
			"见钱眼开",
			"金钱至上",
			"钱"
		]
	},
	{
		"char": "🤠",
		"name": "牛仔",
		"ename": "Cowboy Hat Face",
		"tags": [
			"表情"
		],
		"alias": [
			"帽",
			"牛仔帽脸",
			"脸"
		]
	},
	{
		"char": "😈",
		"name": "恶魔笑",
		"ename": "Smiling Face With Horns",
		"tags": [
			"表情"
		],
		"alias": [
			"幻想",
			"微笑",
			"恶魔微笑",
			"犄角",
			"神话故事",
			"脸",
			"邪魔"
		]
	},
	{
		"char": "👿",
		"name": "恶魔怒",
		"ename": "Angry Face With Horns",
		"tags": [
			"表情"
		],
		"alias": [
			"带角的怒容",
			"幻想",
			"恶魔",
			"犄角",
			"生气的恶魔",
			"脸",
			"顽童"
		]
	},
	{
		"char": "👹",
		"name": "鬼怪",
		"ename": "Ogre",
		"tags": [
			"表情"
		],
		"alias": [
			"吓人",
			"妖怪",
			"幻想",
			"日本",
			"神话故事",
			"脸",
			"面具",
			"食人魔",
			"鬼",
			"魔鬼"
		]
	},
	{
		"char": "👺",
		"name": "天狗",
		"ename": "Goblin",
		"tags": [
			"表情"
		],
		"alias": [
			"妖怪",
			"小妖精",
			"幻想",
			"怪物",
			"日本",
			"神话故事",
			"脸",
			"鬼"
		]
	},
	{
		"char": "🤡",
		"name": "小丑",
		"ename": "Clown Face",
		"tags": [
			"表情"
		],
		"alias": [
			"小丑脸",
			"脸"
		]
	},
	{
		"char": "💀",
		"name": "骷髅",
		"ename": "Skull",
		"tags": [
			"表情"
		],
		"alias": [
			"头骨",
			"妖怪",
			"怪兽",
			"死亡",
			"神话故事",
			"脸",
			"身体"
		]
	},
	{
		"char": "👻",
		"name": "幽灵",
		"ename": "Ghost",
		"tags": [
			"表情"
		],
		"alias": [
			"万圣节",
			"妖怪",
			"幻想",
			"怪物",
			"神话故事",
			"脸",
			"鬼",
			"鬼脸"
		]
	},
	{
		"char": "👽",
		"name": "外星人",
		"ename": "Alien",
		"tags": [
			"表情"
		],
		"alias": [
			"ufo",
			"外太空",
			"外星",
			"太空",
			"幻想",
			"星际",
			"脸",
			"飞碟"
		]
	},
	{
		"char": "👾",
		"name": "游戏怪物",
		"ename": "Alien Monster",
		"tags": [
			"表情"
		],
		"alias": [
			"ufo",
			"外星",
			"外星人",
			"外星怪物",
			"太空",
			"怪物",
			"星际",
			"脸",
			"飞碟"
		]
	},
	{
		"char": "🤖",
		"name": "机器人",
		"ename": "Robot",
		"tags": [
			"表情"
		],
		"alias": [
			"怪物",
			"脸"
		]
	},
	{
		"char": "🎃",
		"name": "南瓜灯",
		"ename": "Jack-O-Lantern",
		"tags": [
			"表情"
		],
		"alias": [
			"万圣节",
			"南瓜",
			"庆祝",
			"灯",
			"灯笼"
		]
	},
	{
		"char": "😺",
		"name": "眯眼猫",
		"ename": "Grinning Cat",
		"tags": [
			"表情"
		],
		"alias": [
			"哈哈",
			"大笑的猫",
			"大笑的猫脸",
			"猫脸",
			"笑",
			"脸"
		]
	},
	{
		"char": "😸",
		"name": "咧嘴猫",
		"ename": "Grinning Cat With Smiling Eyes",
		"tags": [
			"表情"
		],
		"alias": [
			"呵呵",
			"微笑的猫",
			"微笑的猫脸",
			"猫脸",
			"笑",
			"笑颜逐开",
			"脸"
		]
	},
	{
		"char": "😹",
		"name": "笑哭猫",
		"ename": "Cat With Tears of Joy",
		"tags": [
			"表情"
		],
		"alias": [
			"喜极而泣",
			"快乐",
			"猫脸",
			"眼泪",
			"笑出眼泪",
			"笑出眼泪的猫",
			"笑出眼泪的猫脸",
			"脸"
		]
	},
	{
		"char": "😻",
		"name": "花痴猫",
		"ename": "Smiling Cat With Heart-Eyes",
		"tags": [
			"表情"
		],
		"alias": [
			"WC",
			"喜欢",
			"心",
			"猫",
			"猫脸",
			"脸",
			"花痴",
			"花痴的猫",
			"花痴的猫脸"
		]
	},
	{
		"char": "😼",
		"name": "坏笑猫",
		"ename": "Cat With Wry Smile",
		"tags": [
			"表情"
		],
		"alias": [
			"嘲讽笑容",
			"奸笑",
			"奸笑的猫",
			"奸笑的猫脸",
			"猫脸",
			"脸",
			"讽刺"
		]
	},
	{
		"char": "😽",
		"name": "亲亲猫",
		"ename": "Kissing Cat",
		"tags": [
			"表情"
		],
		"alias": [
			"亲亲",
			"吻",
			"猫脸",
			"猫脸亲亲",
			"脸",
			"闭眼亲亲的猫脸"
		]
	},
	{
		"char": "🙀",
		"name": "惊恐猫",
		"ename": "Weary Cat",
		"tags": [
			"表情"
		],
		"alias": [
			"惊讶",
			"猫脸",
			"疲倦",
			"疲倦的猫",
			"疲倦的猫脸",
			"疲劳",
			"疲惫",
			"累",
			"脸"
		]
	},
	{
		"char": "😿",
		"name": "哭泣猫",
		"ename": "Crying Cat",
		"tags": [
			"表情"
		],
		"alias": [
			"哭",
			"哭泣的猫",
			"哭泣的猫脸",
			"泪",
			"猫脸",
			"眼泪",
			"脸",
			"难过"
		]
	},
	{
		"char": "😾",
		"name": "生气猫",
		"ename": "Pouting Cat",
		"tags": [
			"表情"
		],
		"alias": [
			"猫脸",
			"生气",
			"生气的猫",
			"生气的猫脸",
			"脸"
		]
	},
	{
		"char": "💯",
		"name": "一百分",
		"ename": "Hundred Points Symbol",
		"tags": [
			"表情"
		],
		"alias": [
			"100",
			"满分",
			"百分百",
			"绝对",
			"考试"
		]
	},
	{
		"char": "🛑",
		"name": "停止标志",
		"ename": "Stop Sign",
		"tags": [
			"警告、危险"
		],
		"alias": [
			"停止",
			"八角形",
			"八边形",
			"标志"
		]
	},
	{
		"char": "📵",
		"name": "禁止手机",
		"ename": "No Mobile Phones",
		"tags": [
			"警告、危险"
		],
		"alias": [
			"严禁",
			"手机",
			"电话",
			"禁止",
			"禁止使用手机"
		]
	},
	{
		"char": "🔞",
		"name": "未成年人禁止",
		"ename": "No One Under Eighteen",
		"tags": [
			"警告、危险"
		],
		"alias": [
			"18禁",
			"儿童不宜",
			"未成年人不宜",
			"禁止"
		]
	},
	{
		"char": "🍎",
		"name": "红苹果",
		"ename": "Red Apple",
		"tags": [
			"饮食"
		],
		"alias": [
			"健康",
			"水果",
			"熟",
			"红",
			"苹果",
			"食物"
		]
	},
	{
		"char": "🍏",
		"name": "青苹果",
		"ename": "Green Apple",
		"tags": [
			"饮食"
		],
		"alias": [
			"水果",
			"苹果",
			"青"
		]
	},
	{
		"char": "🍊",
		"name": "橘子",
		"ename": "Tangerine",
		"tags": [
			"饮食"
		],
		"alias": [
			"柑桔",
			"柑橘",
			"桔子",
			"水果",
			"油桃",
			"维他命 C"
		]
	},
	{
		"char": "🍋",
		"name": "柠檬",
		"ename": "Lemon",
		"tags": [
			"饮食"
		],
		"alias": [
			"柑橘",
			"水果",
			"酸"
		]
	},
	{
		"char": "🍌",
		"name": "香蕉",
		"ename": "Banana",
		"tags": [
			"饮食"
		],
		"alias": [
			"水果",
			"钾"
		]
	},
	{
		"char": "🍉",
		"name": "西瓜",
		"ename": "Watermelon",
		"tags": [
			"饮食"
		],
		"alias": [
			"水果"
		]
	},
	{
		"char": "🍇",
		"name": "葡萄",
		"ename": "Grapes",
		"tags": [
			"饮食"
		],
		"alias": [
			"水果"
		]
	},
	{
		"char": "🍓",
		"name": "草莓",
		"ename": "Strawberry",
		"tags": [
			"饮食"
		],
		"alias": [
			"水果",
			"浆果"
		]
	},
	{
		"char": "🍒",
		"name": "樱桃",
		"ename": "Cherries",
		"tags": [
			"饮食"
		],
		"alias": [
			"水果"
		]
	},
	{
		"char": "🍑",
		"name": "桃子",
		"ename": "Peach",
		"tags": [
			"饮食"
		],
		"alias": [
			"桃",
			"水果"
		]
	},
	{
		"char": "🍐",
		"name": "梨",
		"ename": "Pear",
		"tags": [
			"饮食"
		],
		"alias": [
			"水果"
		]
	},
	{
		"char": "🥝",
		"name": "猕猴桃",
		"ename": "Kiwifruit",
		"tags": [
			"饮食"
		],
		"alias": [
			"奇异果",
			"水果",
			"食物"
		]
	},
	{
		"char": "🍅",
		"name": "番茄",
		"ename": "Tomato",
		"tags": [
			"饮食"
		],
		"alias": [
			"水果",
			"蔬菜",
			"西红柿"
		]
	},
	{
		"char": "🍆",
		"name": "茄子",
		"ename": "Eggplant",
		"tags": [
			"饮食"
		],
		"alias": [
			"蔬菜"
		]
	},
	{
		"char": "🥑",
		"name": "牛油果",
		"ename": "Avocado",
		"tags": [
			"饮食"
		],
		"alias": [
			"水果",
			"酪梨",
			"食物",
			"鳄梨",
			"黄油果"
		]
	},
	{
		"char": "🥦",
		"name": "西兰花",
		"ename": "Broccoli",
		"tags": [
			"饮食"
		],
		"alias": [
			"甘蓝",
			"野生卷心菜"
		]
	},
	{
		"char": "🥒",
		"name": "黄瓜",
		"ename": "Cucumber",
		"tags": [
			"饮食"
		],
		"alias": [
			"泡菜",
			"腌菜",
			"蔬菜",
			"食物"
		]
	},
	{
		"char": "🌽",
		"name": "玉米",
		"ename": "Ear of Corn",
		"tags": [
			"饮食"
		],
		"alias": [
			"农作物",
			"包谷",
			"苞米"
		]
	},
	{
		"char": "🥕",
		"name": "胡萝卜",
		"ename": "Carrot",
		"tags": [
			"饮食"
		],
		"alias": [
			"蔬菜",
			"食物"
		]
	},
	{
		"char": "🍄",
		"name": "蘑菇",
		"ename": "Mushroom",
		"tags": [
			"饮食"
		],
		"alias": [
			"毒蕈",
			"真菌"
		]
	},
	{
		"char": "🍞",
		"name": "面包",
		"ename": "Bread",
		"tags": [
			"饮食"
		],
		"alias": [
			"一条面包",
			"全麦面包",
			"小麦",
			"淀粉",
			"烤面包",
			"谷类",
			"食物",
			"餐厅"
		]
	},
	{
		"char": "🧀",
		"name": "奶酪",
		"ename": "Cheese Wedge",
		"tags": [
			"饮食"
		],
		"alias": [
			"芝士",
			"起司"
		]
	},
	{
		"char": "🍳",
		"name": "煎蛋",
		"ename": "Cooking",
		"tags": [
			"饮食"
		],
		"alias": [
			"一面老一面嫩的煎蛋",
			"做菜",
			"只煎一面老",
			"平底锅",
			"早餐",
			"煎",
			"蛋",
			"食堂"
		]
	},
	{
		"char": "🥓",
		"name": "培根",
		"ename": "Bacon",
		"tags": [
			"饮食"
		],
		"alias": [
			"烟肉",
			"熏肉",
			"肉",
			"背肯",
			"食物"
		]
	},
	{
		"char": "🍔",
		"name": "汉堡",
		"ename": "Hamburger",
		"tags": [
			"饮食"
		],
		"alias": [
			"吃",
			"汉堡包",
			"速食",
			"食物",
			"饿"
		]
	},
	{
		"char": "🍟",
		"name": "薯条",
		"ename": "French Fries",
		"tags": [
			"饮食"
		],
		"alias": [
			"快餐",
			"油炸",
			"食物"
		]
	},
	{
		"char": "🍕",
		"name": "披萨",
		"ename": "Pizza",
		"tags": [
			"饮食"
		],
		"alias": [
			"一片比萨",
			"比萨",
			"比萨饼",
			"起司",
			"辣味香肠",
			"食物",
			"饿"
		]
	},
	{
		"char": "🌭",
		"name": "热狗",
		"ename": "Hot Dog",
		"tags": [
			"饮食"
		],
		"alias": [
			"香肠"
		]
	},
	{
		"char": "🌮",
		"name": "墨西哥卷",
		"ename": "Taco",
		"tags": [
			"饮食"
		],
		"alias": [
			"卷饼",
			"玉米卷饼",
			"墨西哥",
			"墨西哥卷饼",
			"墨西哥玉米卷"
		]
	},
	{
		"char": "🍩",
		"name": "甜甜圈",
		"ename": "Doughnut",
		"tags": [
			"饮食"
		],
		"alias": [
			"甜",
			"甜点",
			"食物"
		]
	},
	{
		"char": "🍪",
		"name": "饼干",
		"ename": "Cookie",
		"tags": [
			"饮食"
		],
		"alias": [
			"巧克力片",
			"曲奇",
			"曲奇饼",
			"甜点"
		]
	},
	{
		"char": "🎂",
		"name": "生日蛋糕",
		"ename": "Birthday Cake",
		"tags": [
			"饮食"
		],
		"alias": [
			"庆祝",
			"甜",
			"甜点",
			"生日",
			"生日快乐",
			"糕点",
			"蛋糕"
		]
	},
	{
		"char": "🍰",
		"name": "蛋糕",
		"ename": "Shortcake",
		"tags": [
			"饮食"
		],
		"alias": [
			"一片蛋糕",
			"奶油",
			"奶油酥饼",
			"水果蛋糕",
			"甜点",
			"糕点"
		]
	},
	{
		"char": "🍫",
		"name": "巧克力",
		"ename": "Chocolate Bar",
		"tags": [
			"饮食"
		],
		"alias": [
			"万圣节",
			"巧克力棒",
			"甜",
			"甜品",
			"甜点",
			"糖果"
		]
	},
	{
		"char": "🍬",
		"name": "糖果",
		"ename": "Candy",
		"tags": [
			"饮食"
		],
		"alias": [
			"万圣节",
			"嗜甜食",
			"爱吃甜食",
			"甜",
			"甜点",
			"糖",
			"糖果纸",
			"蛀牙",
			"餐馆"
		]
	},
	{
		"char": "🍭",
		"name": "棒棒糖",
		"ename": "Lollipop",
		"tags": [
			"饮食"
		],
		"alias": [
			"果子",
			"甜",
			"糖",
			"糖果"
		]
	},
	{
		"char": "🍵",
		"name": "茶",
		"ename": "Teacup Without Handle",
		"tags": [
			"饮食"
		],
		"alias": [
			"乌龙茶",
			"无柄茶杯",
			"杯",
			"没有把手的茶杯",
			"热茶",
			"热饮",
			"茶杯",
			"饮料"
		]
	},
	{
		"char": "🍺",
		"name": "啤酒",
		"ename": "Beer Mug",
		"tags": [
			"饮食"
		],
		"alias": [
			"啤酒节",
			"喝酒",
			"杯",
			"酒",
			"酒吧"
		]
	},
	{
		"char": "🍻",
		"name": "碰杯",
		"ename": "Clinking Beer Mugs",
		"tags": [
			"饮食"
		],
		"alias": [
			"啤酒",
			"喝酒",
			"干杯",
			"酒",
			"酒吧"
		]
	},
	{
		"char": "🍷",
		"name": "红酒",
		"ename": "Wine Glass",
		"tags": [
			"饮食"
		],
		"alias": [
			"俱乐部",
			"喝酒",
			"葡萄酒",
			"酒",
			"酒吧",
			"酒杯",
			"饮料"
		]
	},
	{
		"char": "🍸",
		"name": "鸡尾酒",
		"ename": "Cocktail Glass",
		"tags": [
			"饮食"
		],
		"alias": [
			"俱乐部",
			"喝酒",
			"杯",
			"玻璃杯",
			"酒",
			"酒吧",
			"马丁尼",
			"鸡尾酒杯"
		]
	},
	{
		"char": "🥂",
		"name": "庆祝杯",
		"ename": "Clinking Glasses",
		"tags": [
			"饮食"
		],
		"alias": [
			"喝",
			"干杯",
			"庆祝",
			"杯",
			"碰杯"
		]
	},
	{
		"char": "🏠",
		"name": "房屋",
		"ename": "House",
		"tags": [
			"建筑"
		],
		"alias": [
			"住家",
			"家",
			"乡村家园",
			"心之所在",
			"房子",
			"郊区"
		]
	},
	{
		"char": "🏡",
		"name": "花园洋房",
		"ename": "House With Garden",
		"tags": [
			"建筑"
		],
		"alias": [
			"住家",
			"别墅",
			"家",
			"乡村家园",
			"庭院",
			"庭院居家",
			"心之所在",
			"房子",
			"花园",
			"郊区"
		]
	},
	{
		"char": "🏢",
		"name": "办公楼",
		"ename": "Office Building",
		"tags": [
			"建筑"
		],
		"alias": [
			"写字楼"
		]
	},
	{
		"char": "🏥",
		"name": "医院",
		"ename": "Hospital",
		"tags": [
			"建筑"
		],
		"alias": [
			"医生",
			"医药",
			"看病"
		]
	},
	{
		"char": "🏦",
		"name": "银行",
		"ename": "Bank",
		"tags": [
			"建筑"
		]
	},
	{
		"char": "🏨",
		"name": "酒店",
		"ename": "Hotel",
		"tags": [
			"建筑"
		],
		"alias": [
			"旅馆"
		]
	},
	{
		"char": "🏩",
		"name": "情人酒店",
		"ename": "Love Hotel",
		"tags": [
			"建筑"
		],
		"alias": [
			"情人旅馆",
			"情侣酒店",
			"旅馆"
		]
	},
	{
		"char": "🏪",
		"name": "便利店",
		"ename": "Convenience Store",
		"tags": [
			"建筑"
		],
		"alias": [
			"24 小时",
			"商店"
		]
	},
	{
		"char": "🏫",
		"name": "学校",
		"ename": "School",
		"tags": [
			"建筑"
		],
		"alias": [
			"教学楼"
		]
	},
	{
		"char": "🏬",
		"name": "百货商场",
		"ename": "Department Store",
		"tags": [
			"建筑"
		],
		"alias": [
			"商场",
			"百货公司",
			"百货商城",
			"百货商店"
		]
	},
	{
		"char": "🏭",
		"name": "工厂",
		"ename": "Factory",
		"tags": [
			"建筑"
		]
	},
	{
		"char": "🏯",
		"name": "日本城堡",
		"ename": "Japanese Castle",
		"tags": [
			"建筑"
		],
		"alias": [
			"城堡",
			"日本"
		]
	},
	{
		"char": "🏰",
		"name": "欧洲城堡",
		"ename": "Castle",
		"tags": [
			"建筑"
		],
		"alias": [
			"城堡",
			"欧洲"
		]
	},
	{
		"char": "🗼",
		"name": "东京塔",
		"ename": "Tokyo Tower",
		"tags": [
			"建筑"
		],
		"alias": [
			"东京",
			"塔"
		]
	},
	{
		"char": "🗽",
		"name": "自由女神像",
		"ename": "Statue of Liberty",
		"tags": [
			"建筑"
		],
		"alias": [
			"塑像",
			"纽约",
			"自由",
			"雕塑"
		]
	},
	{
		"char": "🗿",
		"name": "复活节岛石像",
		"ename": "Moai",
		"tags": [
			"建筑"
		],
		"alias": [
			"复活岛",
			"复活节岛",
			"摩埃",
			"摩艾",
			"摩艾石像",
			"旅行",
			"毛埃",
			"脸"
		]
	},
	{
		"char": "🏗",
		"name": "施工中",
		"ename": "Building Construction",
		"tags": [
			"建筑"
		],
		"alias": [
			"兴建",
			"建筑施工",
			"施工"
		]
	},
	{
		"char": "🕌",
		"name": "清真寺",
		"ename": "Mosque",
		"tags": [
			"建筑"
		],
		"alias": [
			"伊斯兰",
			"宗教",
			"穆斯林"
		]
	},
	{
		"char": "🕍",
		"name": "犹太会堂",
		"ename": "Synagogue",
		"tags": [
			"建筑"
		],
		"alias": [
			"会堂",
			"宗教",
			"犹太",
			"犹太教",
			"犹太教堂"
		]
	},
	{
		"char": "🕋",
		"name": "克尔白",
		"ename": "Kaaba",
		"tags": [
			"建筑"
		],
		"alias": [
			"伊斯兰",
			"天房",
			"宗教",
			"穆斯林"
		]
	},
	{
		"char": "🧪",
		"name": "试管",
		"ename": "Test Tube",
		"tags": [
			"物理、化学"
		],
		"alias": [
			"化学",
			"化学家",
			"实验",
			"实验室",
			"科学"
		]
	},
	{
		"char": "🧫",
		"name": "培养皿",
		"ename": "Petri Dish",
		"tags": [
			"物理、化学"
		],
		"alias": [
			"培养",
			"实验室",
			"生物学",
			"生物学家",
			"细菌"
		]
	},
	{
		"char": "🧬",
		"name": "DNA",
		"ename": "DNA Double Helix",
		"tags": [
			"物理、化学"
		],
		"alias": [
			"基因",
			"演化",
			"生命",
			"生物学家",
			"进化",
			"遗传学"
		]
	},
	{
		"char": "🔬",
		"name": "显微镜",
		"ename": "Microscope",
		"tags": [
			"物理、化学"
		],
		"alias": [
			"实验",
			"实验室",
			"工具",
			"生物",
			"科学",
			"细胞"
		]
	},
	{
		"char": "🔭",
		"name": "望远镜",
		"ename": "Telescope",
		"tags": [
			"物理、化学"
		],
		"alias": [
			"外星人",
			"天体",
			"天文",
			"天文学",
			"工具",
			"接触",
			"科学",
			"观星"
		]
	},
	{
		"char": "📡",
		"name": "卫星天线",
		"ename": "Satellite Antenna",
		"tags": [
			"物理、化学"
		],
		"alias": [
			"信号接收",
			"卫星",
			"卫星接收天线",
			"卫星碟形天线",
			"外星人",
			"天线",
			"接触"
		]
	},
	{
		"char": "🔋",
		"name": "电池",
		"ename": "Battery",
		"tags": [
			"物理、化学"
		],
		"alias": [
			"正极",
			"电",
			"电极",
			"电源",
			"蓄电池",
			"负极"
		]
	},
	{
		"char": "🌸",
		"name": "樱花",
		"ename": "Cherry Blossom",
		"tags": [
			"生物"
		],
		"alias": [
			"花"
		]
	},
	{
		"char": "🌻",
		"name": "向日葵",
		"ename": "Sunflower",
		"tags": [
			"生物"
		],
		"alias": [
			"太阳",
			"太阳花",
			"花"
		]
	},
	{
		"char": "🌹",
		"name": "玫瑰",
		"ename": "Rose",
		"tags": [
			"生物"
		],
		"alias": [
			"优雅",
			"红玫瑰",
			"花"
		]
	},
	{
		"char": "🌱",
		"name": "幼苗",
		"ename": "Seedling",
		"tags": [
			"生物"
		],
		"alias": [
			"发芽",
			"芽",
			"苗"
		]
	},
	{
		"char": "🌲",
		"name": "松树",
		"ename": "Evergreen Tree",
		"tags": [
			"生物"
		],
		"alias": [
			"圣诞树",
			"常青树",
			"树"
		]
	},
	{
		"char": "🌳",
		"name": "落叶树",
		"ename": "Deciduous Tree",
		"tags": [
			"生物"
		],
		"alias": [
			"树",
			"落叶",
			"落叶植物"
		]
	},
	{
		"char": "🌵",
		"name": "仙人掌",
		"ename": "Cactus",
		"tags": [
			"生物"
		],
		"alias": [
			"干旱",
			"植物",
			"沙漠"
		]
	},
	{
		"char": "🍀",
		"name": "四叶草",
		"ename": "Four Leaf Clover",
		"tags": [
			"生物"
		],
		"alias": [
			"幸运",
			"爱尔兰的"
		]
	},
	{
		"char": "🐶",
		"name": "狗",
		"ename": "Dog Face",
		"tags": [
			"生物"
		],
		"alias": [
			"宠物",
			"小狗",
			"汪星人",
			"狗脸",
			"脸"
		]
	},
	{
		"char": "🐱",
		"name": "猫",
		"ename": "Cat Face",
		"tags": [
			"生物"
		],
		"alias": [
			"宠物",
			"猫咪",
			"猫脸",
			"脸"
		]
	},
	{
		"char": "🐰",
		"name": "兔子",
		"ename": "Rabbit Face",
		"tags": [
			"生物"
		],
		"alias": [
			"兔",
			"兔子头",
			"兔宝宝",
			"宠物"
		]
	},
	{
		"char": "🦊",
		"name": "狐狸",
		"ename": "Fox Face",
		"tags": [
			"生物"
		],
		"alias": [
			"动物",
			"头",
			"狐狸的脸",
			"脸"
		]
	},
	{
		"char": "🐻",
		"name": "熊",
		"ename": "Bear Face",
		"tags": [
			"生物"
		],
		"alias": [
			"低吼",
			"头",
			"灰熊",
			"熊头",
			"熊脸",
			"脸"
		]
	},
	{
		"char": "🐼",
		"name": "熊猫",
		"ename": "Panda Face",
		"tags": [
			"生物"
		],
		"alias": [
			"头",
			"熊猫脸",
			"猫熊",
			"猫熊脸",
			"胖达",
			"脸"
		]
	},
	{
		"char": "🐨",
		"name": "考拉",
		"ename": "Koala",
		"tags": [
			"生物"
		],
		"alias": [
			"动物",
			"有袋类动物",
			"树袋熊",
			"澳大利亚"
		]
	},
	{
		"char": "🐯",
		"name": "老虎",
		"ename": "Tiger Face",
		"tags": [
			"生物"
		],
		"alias": [
			"森林之王",
			"老虎头",
			"脸"
		]
	},
	{
		"char": "🦁",
		"name": "狮子",
		"ename": "Lion Face",
		"tags": [
			"生物"
		],
		"alias": [
			"狮子头",
			"狮子座",
			"脸",
			"黄道十二宫"
		]
	},
	{
		"char": "🐮",
		"name": "牛",
		"ename": "Cow Face",
		"tags": [
			"生物"
		],
		"alias": [
			"乳牛",
			"奶牛",
			"奶牛头",
			"母牛",
			"牛头",
			"脸"
		]
	},
	{
		"char": "🐷",
		"name": "猪",
		"ename": "Pig Face",
		"tags": [
			"生物"
		],
		"alias": [
			"八戒",
			"猪头",
			"脸"
		]
	},
	{
		"char": "🐸",
		"name": "青蛙",
		"ename": "Frog Face",
		"tags": [
			"生物"
		],
		"alias": [
			"动物",
			"头",
			"脸",
			"青蛙头"
		]
	},
	{
		"char": "🐵",
		"name": "猴子",
		"ename": "Monkey Face",
		"tags": [
			"生物"
		],
		"alias": [
			"动物",
			"猴",
			"猴头"
		]
	},
	{
		"char": "🐔",
		"name": "鸡",
		"ename": "Chicken",
		"tags": [
			"生物"
		],
		"alias": [
			"动物"
		]
	},
	{
		"char": "🐦",
		"name": "鸟",
		"ename": "Bird",
		"tags": [
			"生物"
		],
		"alias": [
			"动物",
			"鸟类学"
		]
	},
	{
		"char": "🦅",
		"name": "鹰",
		"ename": "Eagle",
		"tags": [
			"生物"
		],
		"alias": [
			"老鹰",
			"鸟"
		]
	},
	{
		"char": "🦉",
		"name": "猫头鹰",
		"ename": "Owl",
		"tags": [
			"生物"
		],
		"alias": [
			"睿智",
			"鸟"
		]
	},
	{
		"char": "🦇",
		"name": "蝙蝠",
		"ename": "Bat",
		"tags": [
			"生物"
		],
		"alias": [
			"吸血鬼"
		]
	},
	{
		"char": "🐺",
		"name": "狼",
		"ename": "Wolf Face",
		"tags": [
			"生物"
		],
		"alias": [
			"头",
			"狼头",
			"脸"
		]
	},
	{
		"char": "🦄",
		"name": "独角兽",
		"ename": "Unicorn Face",
		"tags": [
			"生物"
		],
		"alias": [
			"头",
			"独角兽头",
			"脸"
		]
	},
	{
		"char": "🐝",
		"name": "蜜蜂",
		"ename": "Honeybee",
		"tags": [
			"生物"
		],
		"alias": [
			"勤劳",
			"昆虫",
			"蜂蜜"
		]
	},
	{
		"char": "🐛",
		"name": "毛虫",
		"ename": "Bug",
		"tags": [
			"生物"
		],
		"alias": [
			"昆虫",
			"毛毛虫"
		]
	},
	{
		"char": "🦋",
		"name": "蝴蝶",
		"ename": "Butterfly",
		"tags": [
			"生物"
		],
		"alias": [
			"昆虫",
			"漂亮",
			"美丽"
		]
	},
	{
		"char": "🐞",
		"name": "瓢虫",
		"ename": "Lady Beetle",
		"tags": [
			"生物"
		],
		"alias": [
			"昆虫",
			"母"
		]
	},
	{
		"char": "🐜",
		"name": "蚂蚁",
		"ename": "Ant",
		"tags": [
			"生物"
		]
	},
	{
		"char": "🕷",
		"name": "蜘蛛",
		"ename": "Spider",
		"tags": [
			"生物"
		],
		"alias": [
			"昆虫"
		]
	},
	{
		"char": "🐢",
		"name": "龟",
		"ename": "Turtle",
		"tags": [
			"生物"
		],
		"alias": [
			"乌龟",
			"海龟",
			"陆龟"
		]
	},
	{
		"char": "🐍",
		"name": "蛇",
		"ename": "Snake",
		"tags": [
			"生物"
		],
		"alias": [
			"持票人",
			"狡猾的人",
			"蛇夫座",
			"黄道十二宫"
		]
	},
	{
		"char": "🐙",
		"name": "章鱼",
		"ename": "Octopus",
		"tags": [
			"生物"
		],
		"alias": [
			"八爪",
			"鱼"
		]
	},
	{
		"char": "🐬",
		"name": "海豚",
		"ename": "Dolphin",
		"tags": [
			"生物"
		],
		"alias": [
			"鸭脚板"
		]
	},
	{
		"char": "🐳",
		"name": "鲸鱼",
		"ename": "Spouting Whale",
		"tags": [
			"生物"
		],
		"alias": [
			"喷水",
			"喷水的鲸",
			"鲸"
		]
	},
	{
		"char": "🦈",
		"name": "鲨鱼",
		"ename": "Shark",
		"tags": [
			"生物"
		],
		"alias": [
			"鱼",
			"鲨"
		]
	},
	{
		"char": "🐊",
		"name": "鳄鱼",
		"ename": "Crocodile",
		"tags": [
			"生物"
		]
	},
	{
		"char": "🐅",
		"name": "虎",
		"ename": "Tiger",
		"tags": [
			"生物"
		],
		"alias": [
			"动物园",
			"老虎"
		]
	},
	{
		"char": "🐆",
		"name": "豹",
		"ename": "Leopard",
		"tags": [
			"生物"
		],
		"alias": [
			"动物",
			"猎豹",
			"豹子"
		]
	},
	{
		"char": "🦓",
		"name": "斑马",
		"ename": "Zebra",
		"tags": [
			"生物"
		],
		"alias": [
			"条纹"
		]
	},
	{
		"char": "🐘",
		"name": "大象",
		"ename": "Elephant",
		"tags": [
			"生物"
		],
		"alias": [
			"动物",
			"象"
		]
	},
	{
		"char": "🦏",
		"name": "犀牛",
		"ename": "Rhinoceros",
		"tags": [
			"生物"
		],
		"alias": [
			"动物"
		]
	},
	{
		"char": "🐪",
		"name": "单峰骆驼",
		"ename": "Dromedary Camel",
		"tags": [
			"生物"
		],
		"alias": [
			"单峰",
			"单峰驼",
			"沙漠",
			"驼峰",
			"骆驼"
		]
	},
	{
		"char": "🐫",
		"name": "双峰骆驼",
		"ename": "Bactrian Camel",
		"tags": [
			"生物"
		],
		"alias": [
			"双峰",
			"沙漠",
			"骆驼"
		]
	},
	{
		"char": "🦒",
		"name": "长颈鹿",
		"ename": "Giraffe",
		"tags": [
			"生物"
		],
		"alias": [
			"斑点"
		]
	},
	{
		"char": "🌍",
		"name": "欧洲非洲",
		"ename": "Earth Globe Europe-Africa",
		"tags": [
			"地理"
		],
		"alias": [
			"世界",
			"地球",
			"地球上的欧洲非洲",
			"欧洲",
			"非洲"
		]
	},
	{
		"char": "🌎",
		"name": "美洲",
		"ename": "Earth Globe Americas",
		"tags": [
			"地理"
		],
		"alias": [
			"世界",
			"全球",
			"地球",
			"地球上的美洲"
		]
	},
	{
		"char": "🌏",
		"name": "亚洲澳洲",
		"ename": "Earth Globe Asia-Australia",
		"tags": [
			"地理"
		],
		"alias": [
			"世界",
			"亚洲",
			"亚澳",
			"全球",
			"地球",
			"地球上的亚洲",
			"地球上的亚洲澳洲",
			"澳洲"
		]
	},
	{
		"char": "🗺",
		"name": "世界地图",
		"ename": "World Map",
		"tags": [
			"地理"
		],
		"alias": [
			"世界",
			"地图"
		]
	},
	{
		"char": "🏔",
		"name": "雪山",
		"ename": "Snow-Capped Mountain",
		"tags": [
			"地理"
		],
		"alias": [
			"冷",
			"山",
			"泠",
			"雪",
			"雪封山头",
			"雪顶"
		]
	},
	{
		"char": "🌋",
		"name": "火山",
		"ename": "Volcano",
		"tags": [
			"地理"
		],
		"alias": [
			"喷发",
			"大自然",
			"山",
			"爆发"
		]
	},
	{
		"char": "🗻",
		"name": "富士山",
		"ename": "Mount Fuji",
		"tags": [
			"地理"
		],
		"alias": [
			"大自然",
			"山"
		]
	},
	{
		"char": "🏕",
		"name": "露营",
		"ename": "Camping",
		"tags": [
			"地理"
		],
		"alias": [
			"帐篷"
		]
	},
	{
		"char": "🏖",
		"name": "海滩",
		"ename": "Beach With Umbrella",
		"tags": [
			"地理"
		],
		"alias": [
			"伞",
			"有伞的海滩",
			"沙滩",
			"沙滩伞",
			"阳伞"
		]
	},
	{
		"char": "🏜",
		"name": "沙漠",
		"ename": "Desert",
		"tags": [
			"地理"
		],
		"alias": [
			"荒漠"
		]
	},
	{
		"char": "🏝",
		"name": "荒岛",
		"ename": "Desert Island",
		"tags": [
			"地理"
		],
		"alias": [
			"岛",
			"无人荒岛",
			"沙滩孤岛",
			"沙漠"
		]
	},
	{
		"char": "🌈",
		"name": "彩虹",
		"ename": "Rainbow",
		"tags": [
			"自然现象"
		],
		"alias": [
			"LGBT",
			"双性恋",
			"同志",
			"跨性别"
		]
	},
	{
		"char": "🌊",
		"name": "海浪",
		"ename": "Water Wave",
		"tags": [
			"自然现象"
		],
		"alias": [
			"波浪",
			"浪",
			"浪花",
			"海洋"
		]
	},
	{
		"char": "💧",
		"name": "水滴",
		"ename": "Droplet",
		"tags": [
			"自然现象"
		],
		"alias": [
			"冷",
			"天气",
			"水",
			"泪",
			"眼泪"
		]
	},
	{
		"char": "🌪",
		"name": "龙卷风",
		"ename": "Tornado",
		"tags": [
			"自然现象"
		],
		"alias": [
			"云",
			"天气",
			"旋风"
		]
	},
	{
		"char": "🌫",
		"name": "雾",
		"ename": "Fog",
		"tags": [
			"自然现象"
		],
		"alias": [
			"云",
			"霾"
		]
	},
	{
		"char": "🌬",
		"name": "风",
		"ename": "Wind Face",
		"tags": [
			"自然现象"
		],
		"alias": [
			"大风",
			"狂风",
			"风吹"
		]
	},
	{
		"char": "🌀",
		"name": "旋风",
		"ename": "Cyclone",
		"tags": [
			"自然现象"
		],
		"alias": [
			"台风",
			"天气",
			"晕",
			"气旋",
			"飓风",
			"龙卷风"
		]
	},
	{
		"char": "💨",
		"name": "高速",
		"ename": "Dashing Away",
		"tags": [
			"自然现象"
		],
		"alias": [
			"尾气",
			"扬尘而去",
			"放屁",
			"烟",
			"疾驰而去",
			"飞奔而去"
		]
	},
	{
		"char": "△",
		"name": "白三角",
		"ename": "White Up-Pointing Triangle",
		"tags": [
			"几何图形"
		],
		"alias": [
			"空心向上三角"
		]
	},
	{
		"char": "▲",
		"name": "黑三角",
		"ename": "Black Up-Pointing Triangle",
		"tags": [
			"几何图形"
		],
		"alias": [
			"三角",
			"上",
			"填充",
			"实心",
			"实心向上三角",
			"实心向上箭头",
			"箭头"
		]
	},
	{
		"char": "▽",
		"name": "白倒三角",
		"ename": "White Down-Pointing Triangle",
		"tags": [
			"几何图形"
		],
		"alias": [
			"空心向下三角"
		]
	},
	{
		"char": "▼",
		"name": "黑倒三角",
		"ename": "Black Down-Pointing Triangle",
		"tags": [
			"几何图形"
		],
		"alias": [
			"三角",
			"下",
			"填充",
			"实心",
			"实心向下三角",
			"实心向下箭头",
			"箭头"
		]
	},
	{
		"char": "◁",
		"name": "白左三角",
		"ename": "White Left-Pointing Triangle",
		"tags": [
			"几何图形"
		],
		"alias": [
			"空心向左三角"
		]
	},
	{
		"char": "◀",
		"name": "黑左三角",
		"ename": "Black Left-Pointing Triangle",
		"tags": [
			"几何图形"
		],
		"alias": [
			"三角",
			"倒转",
			"倒退按钮",
			"后退",
			"向左",
			"左"
		]
	},
	{
		"char": "▷",
		"name": "白右三角",
		"ename": "White Right-Pointing Triangle",
		"tags": [
			"几何图形"
		],
		"alias": [
			"空心向右三角"
		]
	},
	{
		"char": "▶",
		"name": "黑右三角",
		"ename": "Black Right-Pointing Triangle",
		"tags": [
			"几何图形"
		],
		"alias": [
			"三角",
			"右",
			"向右",
			"播放",
			"播放按钮",
			"箭头"
		]
	},
	{
		"char": "◻",
		"name": "白中方",
		"ename": "White Medium Square",
		"tags": [
			"几何图形"
		],
		"alias": [
			"中等",
			"方形",
			"正方形",
			"白色",
			"白色中方块"
		]
	},
	{
		"char": "◼",
		"name": "黑中方",
		"ename": "Black Medium Square",
		"tags": [
			"几何图形"
		],
		"alias": [
			"中等",
			"几何",
			"方形",
			"正方形",
			"黑色",
			"黑色中方块"
		]
	},
	{
		"char": "◽",
		"name": "白中小方",
		"ename": "White Medium Small Square",
		"tags": [
			"几何图形"
		],
		"alias": [
			"中小 正方形",
			"几何",
			"方形",
			"白色",
			"白色中小方块"
		]
	},
	{
		"char": "◾",
		"name": "黑中小方",
		"ename": "Black Medium Small Square",
		"tags": [
			"几何图形"
		],
		"alias": [
			"中小",
			"方形",
			"正方形",
			"黑色",
			"黑色中小方块"
		]
	},
	{
		"char": "⬠",
		"name": "白五边形",
		"ename": "White Pentagon",
		"tags": [
			"几何图形"
		]
	},
	{
		"char": "⬡",
		"name": "白六边形",
		"ename": "White Hexagon",
		"tags": [
			"几何图形"
		]
	},
	{
		"char": "⬢",
		"name": "黑六边形",
		"ename": "Black Hexagon",
		"tags": [
			"几何图形"
		]
	},
	{
		"char": "🎨",
		"name": "调色板",
		"ename": "Artist Palette",
		"tags": [
			"艺术"
		],
		"alias": [
			"绘画",
			"创意",
			"博物馆",
			"多种色彩",
			"娱乐",
			"画家",
			"画画",
			"调色盘"
		]
	},
	{
		"char": "🖌",
		"name": "画笔",
		"ename": "Paintbrush",
		"tags": [
			"艺术"
		],
		"alias": [
			"绘画",
			"刷",
			"毛笔",
			"画刷",
			"笔刷"
		]
	},
	{
		"char": "🖍",
		"name": "蜡笔",
		"ename": "Crayon",
		"tags": [
			"艺术"
		],
		"alias": [
			"绘画",
			"油画棒",
			"画棒"
		]
	},
	{
		"char": "✏",
		"name": "铅笔",
		"ename": "Pencil",
		"tags": [
			"艺术"
		],
		"alias": [
			"文具",
			"书写",
			"橡皮",
			"橡皮擦",
			"画画",
			"画笔",
			"笔",
			"绘画"
		]
	},
	{
		"char": "✐",
		"name": "右上铅笔",
		"ename": "Upper Right Pencil",
		"tags": [
			"艺术"
		],
		"alias": [
			"文具"
		]
	},
	{
		"char": "✒",
		"name": "钢笔尖",
		"ename": "Black Nib",
		"tags": [
			"艺术"
		],
		"alias": [
			"文具",
			"书写",
			"写字",
			"硬笔",
			"笔",
			"笔尖",
			"钢笔",
			"黑色笔尖"
		]
	},
	{
		"char": "🖊",
		"name": "钢笔",
		"ename": "Pen",
		"tags": [
			"艺术"
		],
		"alias": [
			"文具",
			"书写",
			"原子笔",
			"圆珠笔",
			"油笔",
			"笔"
		]
	},
	{
		"char": "🖋",
		"name": "左下钢笔",
		"ename": "Lower Left Fountain Pen",
		"tags": [
			"艺术"
		],
		"alias": [
			"文具",
			"书写",
			"写字",
			"硬笔",
			"笔",
			"钢笔"
		]
	},
	{
		"char": "✂",
		"name": "剪刀",
		"ename": "Black Scissors",
		"tags": [
			"艺术"
		],
		"alias": [
			"文具",
			"裁剪",
			"修剪",
			"剪",
			"剪子",
			"剪裁",
			"工具"
		]
	},
	{
		"char": "🎭",
		"name": "表演艺术",
		"ename": "Performing Arts",
		"tags": [
			"艺术"
		],
		"alias": [
			"戏剧",
			"面具",
			"剧院",
			"女演员",
			"演员",
			"莎士比亚",
			"表演"
		]
	},
	{
		"char": "🎬",
		"name": "场记板",
		"ename": "Clapper Board",
		"tags": [
			"艺术"
		],
		"alias": [
			"电影",
			"场记",
			"打板",
			"拍电影"
		]
	},
	{
		"char": "🎞",
		"name": "胶片格",
		"ename": "Film Frames",
		"tags": [
			"艺术"
		],
		"alias": [
			"电影",
			"帧",
			"影片帧",
			"电影胶卷",
			"电影胶片",
			"胶卷",
			"胶片"
		]
	},
	{
		"char": "🎟",
		"name": "入场券",
		"ename": "Admission Tickets",
		"tags": [
			"艺术"
		],
		"alias": [
			"门票",
			"票"
		]
	},
	{
		"char": "🖼",
		"name": "画框",
		"ename": "Frame with Picture",
		"tags": [
			"艺术"
		],
		"alias": [
			"绘画",
			"相框",
			"加框的照片",
			"博物馆",
			"带框的画",
			"框",
			"照片",
			"画"
		]
	},
	{
		"char": "🎪",
		"name": "马戏团帐篷",
		"ename": "Circus Tent",
		"tags": [
			"艺术"
		],
		"alias": [
			"马戏",
			"帐篷",
			"马戏团"
		]
	},
	{
		"char": "🧵",
		"name": "线轴",
		"ename": "Spool of Thread",
		"tags": [
			"艺术"
		],
		"alias": [
			"缝纫",
			"卷盘",
			"线",
			"绳子",
			"针",
			"针线"
		]
	},
	{
		"char": "🧶",
		"name": "毛线球",
		"ename": "Ball of Yarn",
		"tags": [
			"艺术"
		],
		"alias": [
			"编织",
			"毛线",
			"线球",
			"钩针编织"
		]
	},
	{
		"char": "🪡",
		"name": "缝纫针",
		"ename": "Sewing Needle",
		"tags": [
			"艺术"
		],
		"alias": [
			"缝纫",
			"线",
			"绣花针",
			"缝合",
			"缝合针",
			"缝线",
			"缝衣针",
			"裁剪",
			"针"
		]
	},
	{
		"char": "☺",
		"name": "空心笑脸",
		"ename": "HOLLOW SMILING FACE",
		"tags": [
			"表情"
		],
		"alias": [
			"高兴",
			"开心",
			"呵呵",
			"微笑",
			"放松",
			"笑",
			"脸"
		]
	},
	{
		"char": "☻",
		"name": "实心笑脸",
		"ename": "SOLID SMILING FACE",
		"tags": [
			"表情"
		],
		"alias": [
			"高兴",
			"开心"
		]
	},
	{
		"char": "☹",
		"name": "空心皱眉",
		"ename": "HOLLOW FROWNING FACE",
		"tags": [
			"表情"
		],
		"alias": [
			"不满",
			"不爽",
			"不高兴",
			"委屈",
			"皱眉",
			"皱眉的脸",
			"脸"
		]
	},
	{
		"char": "♂",
		"name": "男性、雄性",
		"ename": "Male",
		"tags": [
			"日常用品和概念"
		],
		"alias": [
			"男性符号",
			"符号",
			"雄性"
		]
	},
	{
		"char": "♀",
		"name": "女性、雌性",
		"ename": "Female",
		"tags": [
			"日常用品和概念"
		],
		"alias": [
			"女性符号",
			"符号",
			"雌性"
		]
	},
	{
		"char": "⚢",
		"name": "双女",
		"ename": "Doubled Female Sign",
		"tags": [
			"日常用品和概念"
		],
		"alias": [
			"女性",
			"双胞胎",
			"女同性恋"
		]
	},
	{
		"char": "⚣",
		"name": "双男",
		"ename": "Doubled Male Sign",
		"tags": [
			"日常用品和概念"
		],
		"alias": [
			"男性",
			"双胞胎",
			"男同性恋"
		]
	},
	{
		"char": "⚤",
		"name": "男女",
		"ename": "Interlaced Male and Female Sign",
		"tags": [
			"日常用品和概念"
		],
		"alias": [
			"性别",
			"结合",
			"双性恋",
			"异性恋"
		]
	},
	{
		"char": "⚥",
		"name": "双性",
		"ename": "Male and Female Sign",
		"tags": [
			"日常用品和概念"
		],
		"alias": [
			"性别",
			"中性"
		]
	},
	{
		"char": "⚦",
		"name": "男",
		"ename": "Male with Stroke Sign",
		"tags": [
			"日常用品和概念"
		],
		"alias": [
			"性别",
			"男性"
		]
	},
	{
		"char": "⚧",
		"name": "跨性别",
		"ename": "Male with Stroke and Male and Female Sign",
		"tags": [
			"日常用品和概念"
		],
		"alias": [
			"性别",
			"男性",
			"女性",
			"跨性别符号"
		]
	},
	{
		"char": "⚨",
		"name": "垂直男",
		"ename": "Vertical Male with Stroke Sign",
		"tags": [
			"日常用品和概念"
		],
		"alias": [
			"性别",
			"男性"
		]
	},
	{
		"char": "⚩",
		"name": "水平男",
		"ename": "Horizontal Male with Stroke Sign",
		"tags": [
			"日常用品和概念"
		],
		"alias": [
			"性别",
			"男性"
		]
	},
	{
		"char": "⚲",
		"name": "中性、无性别",
		"ename": "Neuter",
		"tags": [
			"日常用品和概念"
		],
		"alias": [
			"性别",
			"中性"
		]
	},
	{
		"char": "⚭",
		"name": "婚姻",
		"ename": "Marriage Symbol",
		"tags": [
			"日常用品和概念"
		],
		"alias": [
			"婚姻",
			"结合"
		]
	},
	{
		"char": "⚮",
		"name": "离婚",
		"ename": "Divorce Symbol",
		"tags": [
			"日常用品和概念"
		],
		"alias": [
			"离婚",
			"分离"
		]
	},
	{
		"char": "⚯",
		"name": "未婚",
		"ename": "Unmarried Partnership Symbol",
		"tags": [
			"日常用品和概念"
		],
		"alias": [
			"未婚",
			"关系"
		]
	},
	{
		"char": "⚰",
		"name": "棺材",
		"ename": "Coffin",
		"tags": [
			"日常用品和概念"
		],
		"alias": [
			"死亡",
			"葬礼",
			"埋葬",
			"灵柩",
			"陵墓"
		]
	},
	{
		"char": "⚱",
		"name": "骨灰盒",
		"ename": "Funeral Urn",
		"tags": [
			"日常用品和概念"
		],
		"alias": [
			"死亡",
			"葬礼",
			"丧礼",
			"瓮",
			"缸",
			"骨灰",
			"骨灰缸",
			"骨灰罐"
		]
	},
	{
		"char": "☎",
		"name": "实心电话",
		"ename": "Solid Telephone",
		"tags": [
			"日常用品和概念"
		],
		"alias": [
			"固定电话",
			"固话",
			"座机",
			"电话"
		]
	},
	{
		"char": "☏",
		"name": "空心电话",
		"ename": "Hollow Telephone",
		"tags": [
			"日常用品和概念"
		]
	},
	{
		"char": "☐",
		"name": "投票框",
		"ename": "Ballot Box",
		"tags": [
			"日常用品和概念"
		]
	},
	{
		"char": "☑",
		"name": "带勾的投票框",
		"ename": "Ballot Box with Check",
		"tags": [
			"日常用品和概念"
		],
		"alias": [
			"做好",
			"勾号",
			"勾选",
			"勾选框",
			"复选框",
			"带勾方格",
			"打勾",
			"搞定",
			"选票"
		]
	},
	{
		"char": "☒",
		"name": "带叉的投票框",
		"ename": "Ballot Box with X",
		"tags": [
			"日常用品和概念"
		]
	},
	{
		"char": "⛲",
		"name": "喷泉",
		"ename": "Fountain",
		"tags": [
			"日常用品和概念"
		],
		"alias": [
			"喷泉",
			"水"
		]
	},
	{
		"char": "☮",
		"name": "和平",
		"ename": "Peace Symbol",
		"tags": [
			"日常用品和概念"
		],
		"alias": [
			"和平符号"
		]
	},
	{
		"char": "♲",
		"name": "回收符号",
		"ename": "Universal Recycling Symbol",
		"tags": [
			"日常用品和概念"
		],
		"alias": [
			"环保",
			"回收"
		]
	},
	{
		"char": "♳",
		"name": "回收符号",
		"ename": "Recycling Symbol for Type-1 Plastics",
		"tags": [
			"日常用品和概念"
		],
		"alias": [
			"环保",
			"回收",
			"塑料"
		]
	},
	{
		"char": "♴",
		"name": "回收符号",
		"ename": "Recycling Symbol for Type-2 Plastics",
		"tags": [
			"日常用品和概念"
		],
		"alias": [
			"环保",
			"回收",
			"塑料"
		]
	},
	{
		"char": "♵",
		"name": "回收符号",
		"ename": "Recycling Symbol for Type-3 Plastics",
		"tags": [
			"日常用品和概念"
		],
		"alias": [
			"环保",
			"回收",
			"塑料"
		]
	},
	{
		"char": "♶",
		"name": "回收符号",
		"ename": "Recycling Symbol for Type-4 Plastics",
		"tags": [
			"日常用品和概念"
		],
		"alias": [
			"环保",
			"回收",
			"塑料"
		]
	},
	{
		"char": "♷",
		"name": "回收符号",
		"ename": "Recycling Symbol for Type-5 Plastics",
		"tags": [
			"日常用品和概念"
		],
		"alias": [
			"环保",
			"回收",
			"塑料"
		]
	},
	{
		"char": "♸",
		"name": "回收符号",
		"ename": "Recycling Symbol for Type-6 Plastics",
		"tags": [
			"日常用品和概念"
		],
		"alias": [
			"环保",
			"回收",
			"塑料"
		]
	},
	{
		"char": "♹",
		"name": "回收符号",
		"ename": "Recycling Symbol for Type-7 Plastics",
		"tags": [
			"日常用品和概念"
		],
		"alias": [
			"环保",
			"回收",
			"塑料"
		]
	},
	{
		"char": "♺",
		"name": "回收符号",
		"ename": "Recycling Symbol for Generic Materials",
		"tags": [
			"日常用品和概念"
		],
		"alias": [
			"环保",
			"回收"
		]
	},
	{
		"char": "♻",
		"name": "回收符号",
		"ename": "Black Universal Recycling Symbol",
		"tags": [
			"日常用品和概念"
		],
		"alias": [
			"环保",
			"回收",
			"再利用",
			"再生",
			"回收标志",
			"循环"
		]
	},
	{
		"char": "♼",
		"name": "回收符号",
		"ename": "Recycled Paper Symbol",
		"tags": [
			"日常用品和概念"
		],
		"alias": [
			"环保",
			"回收",
			"纸张"
		]
	},
	{
		"char": "♽",
		"name": "回收符号",
		"ename": "Partially-Recycled Paper Symbol",
		"tags": [
			"日常用品和概念"
		],
		"alias": [
			"环保",
			"回收",
			"纸张"
		]
	},
	{
		"char": "♾",
		"name": "回收符号",
		"ename": "Permanent Paper Sign",
		"tags": [
			"日常用品和概念"
		],
		"alias": [
			"环保",
			"回收",
			"纸张",
			"宇宙",
			"无尽",
			"无穷大",
			"极大"
		]
	},
	{
		"char": "♿",
		"name": "轮椅",
		"ename": "Wheelchair Symbol",
		"tags": [
			"日常用品和概念"
		],
		"alias": [
			"无障碍",
			"轮椅",
			"残疾",
			"残障",
			"轮椅标识",
			"轮椅符号"
		]
	},
	{
		"char": "🚬",
		"name": "吸烟",
		"ename": "Smoking",
		"tags": [
			"日常用品和概念"
		],
		"alias": [
			"吸烟",
			"健康",
			"卷烟",
			"抽烟",
			"烟",
			"烟草",
			"香烟"
		]
	},
	{
		"char": "🚭",
		"name": "禁止吸烟",
		"ename": "No Smoking",
		"tags": [
			"日常用品和概念"
		],
		"alias": [
			"禁止吸烟",
			"健康",
			"严禁",
			"吸烟",
			"抽烟",
			"禁止",
			"禁烟"
		]
	},
	{
		"char": "🚮",
		"name": "请勿乱扔垃圾",
		"ename": "Put Litter in Its Place",
		"tags": [
			"日常用品和概念"
		],
		"alias": [
			"环保",
			"垃圾",
			"倒垃圾",
			"垃圾丢弃处",
			"垃圾入篓",
			"垃圾桶"
		]
	},
	{
		"char": "🚯",
		"name": "请勿乱扔垃圾",
		"ename": "No Littering",
		"tags": [
			"日常用品和概念"
		],
		"alias": [
			"环保",
			"垃圾",
			"严禁",
			"禁丢垃圾",
			"禁止",
			"禁止乱扔垃圾"
		]
	},
	{
		"char": "🚰",
		"name": "饮用水",
		"ename": "Potable Water",
		"tags": [
			"日常用品和概念"
		],
		"alias": [
			"饮用水",
			"健康",
			"可以喝的",
			"喝水",
			"接水",
			"水",
			"水龙头"
		]
	},
	{
		"char": "🚱",
		"name": "非饮用水",
		"ename": "Non-Potable Water",
		"tags": [
			"日常用品和概念"
		],
		"alias": [
			"非饮用水",
			"健康",
			"水",
			"禁止用水",
			"节约用水",
			"非直饮水"
		]
	},
	{
		"char": "🚫",
		"name": "禁止",
		"ename": "Prohibited",
		"tags": [
			"日常用品和概念"
		],
		"alias": [
			"禁止",
			"交通",
			"不准",
			"不许",
			"严禁",
			"禁入",
			"禁行",
			"阻止"
		]
	},
	{
		"char": "🚹",
		"name": "男士洗手间",
		"ename": "Men's Room",
		"tags": [
			"日常用品和概念"
		],
		"alias": [
			"男士洗手间",
			"洗手间",
			"卫生间",
			"厕所",
			"男厕",
			"男士"
		]
	},
	{
		"char": "🚺",
		"name": "女士洗手间",
		"ename": "Women's Room",
		"tags": [
			"日常用品和概念"
		],
		"alias": [
			"女士洗手间",
			"洗手间",
			"卫生间",
			"厕所",
			"女厕",
			"女士"
		]
	},
	{
		"char": "🚻",
		"name": "洗手间",
		"ename": "Restroom",
		"tags": [
			"日常用品和概念"
		],
		"alias": [
			"洗手间",
			"设施",
			"WC",
			"卫生间",
			"厕所"
		]
	},
	{
		"char": "🚼",
		"name": "婴儿换尿布台",
		"ename": "Baby Symbol",
		"tags": [
			"日常用品和概念"
		],
		"alias": [
			"婴儿换尿布台",
			"设施",
			"婴儿",
			"宝宝",
			"换尿片",
			"母婴室"
		]
	},
	{
		"char": "🚽",
		"name": "马桶",
		"ename": "Toilet",
		"tags": [
			"日常用品和概念"
		],
		"alias": [
			"设施",
			"WC",
			"卫生间",
			"厕所",
			"洗手间"
		]
	},
	{
		"char": "🚾",
		"name": "厕所/洗手间",
		"ename": "Water Closet",
		"tags": [
			"日常用品和概念"
		],
		"alias": [
			"设施",
			"卫生间",
			"厕所",
			"洗手间",
			"盥洗室"
		]
	},
	{
		"char": "🚿",
		"name": "淋浴",
		"ename": "Shower",
		"tags": [
			"日常用品和概念"
		],
		"alias": [
			"设施",
			"喷头",
			"喷水",
			"水",
			"洗澡 花洒",
			"花洒"
		]
	},
	{
		"char": "🛀",
		"name": "浴缸",
		"ename": "Bath",
		"tags": [
			"日常用品和概念"
		],
		"alias": [
			"设施",
			"洗澡",
			"洗澡的人",
			"浴盆",
			"澡盆",
			"盆浴"
		]
	},
	{
		"char": "🛁",
		"name": "浴缸",
		"ename": "Bathtub",
		"tags": [
			"日常用品和概念"
		],
		"alias": [
			"设施",
			"沐浴",
			"泡沫浴",
			"泡澡",
			"洗澡",
			"浴盆",
			"澡盆"
		]
	},
	{
		"char": "⚐",
		"name": "空心旗",
		"ename": "HOLLOW FLAG",
		"tags": [
			"日常用品和概念"
		]
	},
	{
		"char": "⚑",
		"name": "实心旗",
		"ename": "SOLID FLAG",
		"tags": [
			"日常用品和概念"
		]
	},
	{
		"char": "⚒",
		"name": "锤子和镐",
		"ename": "HAMMER AND PICK",
		"tags": [
			"日常用品和概念"
		],
		"alias": [
			"工具",
			"铁锤",
			"铁镐",
			"锤子",
			"锤子与镐",
			"镐",
			"镐子"
		]
	},
	{
		"char": "⚕",
		"name": "阿斯克勒庇俄斯之杖",
		"ename": "Staff of Aesculapius",
		"tags": [
			"日常用品和概念"
		],
		"alias": [
			"古希腊",
			"医生",
			"医疗",
			"健康",
			"蛇杖",
			"医神杖",
			"医学",
			"医疗标志",
			"阿斯克勒庇俄斯",
			"阿斯克勒庇俄斯蛇杖"
		]
	},
	{
		"char": "⚖",
		"name": "天平",
		"ename": "Scales",
		"tags": [
			"日常用品和概念"
		],
		"alias": [
			"法律",
			"公正",
			"平衡",
			"审判",
			"公平",
			"天秤",
			"天秤座",
			"星座",
			"正义"
		]
	},
	{
		"char": "⚙",
		"name": "齿轮",
		"ename": "Gear",
		"tags": [
			"日常用品和概念"
		],
		"alias": [
			"机械",
			"工具",
			"工程",
			"设置",
			"传动",
			"零件"
		]
	},
	{
		"char": "⚿",
		"name": "带框钥匙",
		"ename": " SQUARED KEY",
		"tags": [
			"日常用品和概念"
		]
	},
	{
		"char": "🚩",
		"name": "三角旗",
		"ename": "Triangular Flag",
		"tags": [
			"日常用品和概念"
		],
		"alias": [
			"三角旗",
			"旗帜",
			"升旗",
			"旗",
			"旗杆上的三角旗",
			"旗杆上的旗帜",
			"红色旗帜",
			"高尔夫"
		]
	},
	{
		"char": "⛏",
		"name": "十字镐、矿镐",
		"ename": "PICK",
		"tags": [
			"日常用品和概念"
		],
		"alias": [
			"工具",
			"挖",
			"挖掘",
			"采矿",
			"铁镐",
			"锄头",
			"鹤嘴锄"
		]
	},
	{
		"char": "⛓",
		"name": "链条",
		"ename": "CHAINS",
		"tags": [
			"日常用品和概念"
		],
		"alias": [
			"铁链",
			"链",
			"锁链"
		]
	},
	{
		"char": "⛞",
		"name": "实心方块中空心圈内的斜线",
		"ename": "FALLING DIAGONAL IN WHITE CIRCLE IN BLACK SQUARE",
		"tags": [
			"日常用品和概念"
		],
		"alias": [
			"符号",
			"警告"
		]
	},
	{
		"char": "⛭",
		"name": "无毂齿轮",
		"ename": "GEAR WITHOUT HUB",
		"tags": [
			"日常用品和概念"
		],
		"alias": [
			"工具",
			"机械"
		]
	},
	{
		"char": "⛮",
		"name": "带手柄的齿轮",
		"ename": "GEAR WITH HANDLES",
		"tags": [
			"日常用品和概念"
		],
		"alias": [
			"工具",
			"机械"
		]
	},
	{
		"char": "⛼",
		"name": "墓碑",
		"ename": "HEADSTONE GRAVEYARD SYMBOL",
		"tags": [
			"日常用品和概念"
		],
		"alias": [
			"宗教",
			"墓地"
		]
	},
	{
		"char": "⛿",
		"name": "带水平黑条的白色旗",
		"ename": "WHITE FLAG WITH HORIZONTAL MIDDLE BLACK STRIPE",
		"tags": [
			"日常用品和概念"
		],
		"alias": [
			"旗帜",
			"符号"
		]
	},
	{
		"char": "⚠",
		"name": "警告标志",
		"ename": "WARNING SIGN",
		"tags": [
			"警告、危险"
		],
		"alias": [
			"小心",
			"警告"
		]
	},
	{
		"char": "☢",
		"name": "放射性标志",
		"ename": "Radioactive Sign",
		"tags": [
			"警告、危险"
		],
		"alias": [
			"辐射",
			"放射性",
			"标识"
		]
	},
	{
		"char": "☣",
		"name": "生物危害标志",
		"ename": "Biohazard Sign",
		"tags": [
			"警告、危险"
		],
		"alias": [
			"生化",
			"动物",
			"当心感染",
			"污染",
			"生物危害",
			"警告"
		]
	},
	{
		"char": "☠",
		"name": "骷髅和交叉骨",
		"ename": "Skull and Crossbones",
		"tags": [
			"警告、危险"
		],
		"alias": [
			"海盗",
			"交叉股骨",
			"头骨",
			"妖怪",
			"怪物",
			"死亡",
			"脸",
			"骨头",
			"骷髅"
		]
	},
	{
		"char": "☡",
		"name": "警告标志",
		"ename": "Caution Sign",
		"tags": [
			"警告、危险"
		]
	},
	{
		"char": "⚚",
		"name": "墨丘利之杖",
		"ename": "Staff of Hermes",
		"tags": [
			"经济、商业、货币"
		],
		"alias": [
			"古希腊",
			"神话",
			"商神杖",
			"商业",
			"沟通"
		]
	},
	{
		"char": "☤",
		"name": "卡杜/商神杖",
		"ename": "Caduceus",
		"tags": [
			"经济、商业、货币"
		],
		"alias": [
			"古希腊",
			"神话",
			"墨丘利之杖"
		]
	},
	{
		"char": "⚖",
		"name": "天平",
		"ename": "Scales",
		"tags": [
			"经济、商业、货币"
		],
		"alias": [
			"法律",
			"公正",
			"平衡",
			"审判",
			"公平",
			"天秤",
			"天秤座",
			"星座",
			"正义"
		]
	},
	{
		"char": "$",
		"name": "美元",
		"ename": "Dollar",
		"tags": [
			"经济、商业、货币"
		],
		"alias": [
			"货币",
			"钱",
			"美国",
			"加拿大",
			"澳大利亚",
			"新加坡",
			"新西兰",
			"香港",
			"比索",
			"美元符号",
			"金钱"
		]
	},
	{
		"char": "¢",
		"name": "分",
		"ename": "Cent",
		"tags": [
			"经济、商业、货币"
		],
		"alias": [
			"货币",
			"钱",
			"美分"
		]
	},
	{
		"char": "£",
		"name": "英镑",
		"ename": "Pound",
		"tags": [
			"经济、商业、货币"
		],
		"alias": [
			"货币",
			"钱",
			"英国",
			"英镑符号",
			"镑"
		]
	},
	{
		"char": "¤",
		"name": "货币",
		"ename": "Currency",
		"tags": [
			"经济、商业、货币"
		],
		"alias": [
			"货币",
			"钱"
		]
	},
	{
		"char": "¥",
		"name": "人民币、日元",
		"ename": "Yuan, Yen",
		"tags": [
			"经济、商业、货币"
		],
		"alias": [
			"货币",
			"钱",
			"中国",
			"日本",
			"元",
			"円",
			"人民币",
			"元符号",
			"日元"
		]
	},
	{
		"char": "֏",
		"name": "亚美尼亚德拉姆",
		"ename": "Armenian Dram",
		"tags": [
			"经济、商业、货币"
		],
		"alias": [
			"货币",
			"钱"
		]
	},
	{
		"char": "؋",
		"name": "阿富汗尼",
		"ename": "Afghani",
		"tags": [
			"经济、商业、货币"
		],
		"alias": [
			"货币",
			"钱"
		]
	},
	{
		"char": "₲",
		"name": "巴拉圭瓜拉尼",
		"ename": "Guarani",
		"tags": [
			"经济、商业、货币"
		],
		"alias": [
			"货币",
			"钱"
		]
	},
	{
		"char": "₵",
		"name": "加纳塞地",
		"ename": "Cedi",
		"tags": [
			"经济、商业、货币"
		],
		"alias": [
			"货币",
			"钱"
		]
	},
	{
		"char": "₸",
		"name": "哈萨克斯坦坚戈",
		"ename": "Tenge",
		"tags": [
			"经济、商业、货币"
		],
		"alias": [
			"货币",
			"钱"
		]
	},
	{
		"char": "₺",
		"name": "土耳其里拉",
		"ename": "Turkish Lira",
		"tags": [
			"经济、商业、货币"
		],
		"alias": [
			"货币",
			"钱"
		]
	},
	{
		"char": "₼",
		"name": "阿塞拜疆马纳特",
		"ename": "Manat",
		"tags": [
			"经济、商业、货币"
		],
		"alias": [
			"货币",
			"钱"
		]
	},
	{
		"char": "₾",
		"name": "格鲁吉亚拉里",
		"ename": "Lari",
		"tags": [
			"经济、商业、货币"
		],
		"alias": [
			"货币",
			"钱"
		]
	},
	{
		"char": "₿",
		"name": "比特币",
		"ename": "Bitcoin",
		"tags": [
			"经济、商业、货币"
		],
		"alias": [
			"货币",
			"钱",
			"BTC"
		]
	},
	{
		"char": "€",
		"name": "欧元",
		"ename": "Euro",
		"tags": [
			"经济、商业、货币"
		],
		"alias": [
			"货币",
			"钱",
			"欧元区",
			"欧元符号",
			"欧洲"
		]
	},
	{
		"char": "₨",
		"name": "卢比",
		"ename": "Rupee",
		"tags": [
			"经济、商业、货币"
		],
		"alias": [
			"货币",
			"钱"
		]
	},
	{
		"char": "₩",
		"name": "朝鲜元、韩元",
		"ename": "Won",
		"tags": [
			"经济、商业、货币"
		],
		"alias": [
			"货币",
			"钱",
			"朝鲜元",
			"韩元"
		]
	},
	{
		"char": "₪",
		"name": "以色列新谢克尔",
		"ename": "New Shekel",
		"tags": [
			"经济、商业、货币"
		],
		"alias": [
			"货币",
			"钱"
		]
	},
	{
		"char": "₫",
		"name": "越南盾",
		"ename": "Dong",
		"tags": [
			"经济、商业、货币"
		],
		"alias": [
			"货币",
			"钱"
		]
	},
	{
		"char": "₭",
		"name": "老挝基普",
		"ename": "Kip",
		"tags": [
			"经济、商业、货币"
		],
		"alias": [
			"货币",
			"钱"
		]
	},
	{
		"char": "₮",
		"name": "蒙古图格里克",
		"ename": "Tugrik",
		"tags": [
			"经济、商业、货币"
		],
		"alias": [
			"货币",
			"钱"
		]
	},
	{
		"char": "₥",
		"name": "密尔",
		"ename": "Mill",
		"tags": [
			"经济、商业、货币"
		],
		"alias": [
			"货币",
			"钱"
		]
	},
	{
		"char": "₦",
		"name": "尼日利亚奈拉",
		"ename": "Naira",
		"tags": [
			"经济、商业、货币"
		],
		"alias": [
			"货币",
			"钱"
		]
	},
	{
		"char": "₧",
		"name": "西班牙比塞塔",
		"ename": "Peseta",
		"tags": [
			"经济、商业、货币"
		],
		"alias": [
			"货币",
			"钱"
		]
	},
	{
		"char": "₴",
		"name": "乌克兰格里夫纳",
		"ename": "Hryvnia",
		"tags": [
			"经济、商业、货币"
		],
		"alias": [
			"货币",
			"钱"
		]
	},
	{
		"char": "₹",
		"name": "印度卢比",
		"ename": "Indian Rupee",
		"tags": [
			"经济、商业、货币"
		],
		"alias": [
			"货币",
			"钱",
			"卢比",
			"印度卢比符号"
		]
	},
	{
		"char": "₽",
		"name": "俄罗斯卢布",
		"ename": "Ruble",
		"tags": [
			"经济、商业、货币"
		],
		"alias": [
			"货币",
			"钱",
			"俄罗斯",
			"卢布",
			"卢布符号"
		]
	},
	{
		"char": "⛻",
		"name": "日本银行",
		"ename": "Japanese Bank Symbol",
		"tags": [
			"经济、商业、货币"
		]
	},
	{
		"char": "⛨",
		"name": "实心教堂、盾牌实心十字",
		"ename": "Solid Cross On Shield",
		"tags": [
			"建筑"
		]
	},
	{
		"char": "⛩",
		"name": "神社鸟居/神道教神社",
		"ename": "Shinto Shrine",
		"tags": [
			"建筑"
		],
		"alias": [
			"日本",
			"宗教",
			"神社",
			"神道教"
		]
	},
	{
		"char": "⛪",
		"name": "教堂",
		"ename": "Church",
		"tags": [
			"建筑"
		],
		"alias": [
			"基督",
			"基督教",
			"宗教",
			"小教堂"
		]
	},
	{
		"char": "⛫",
		"name": "城堡",
		"ename": "Castle",
		"tags": [
			"建筑"
		],
		"alias": [
			"城堡",
			"建筑"
		]
	},
	{
		"char": "⛬",
		"name": "历史遗址",
		"ename": "Historic Site",
		"tags": [
			"建筑"
		],
		"alias": [
			"遗址",
			"历史"
		]
	},
	{
		"char": "⛯",
		"name": "灯塔",
		"ename": "MAP SYMBOL FOR LIGHTHOUSE",
		"tags": [
			"建筑"
		],
		"alias": [
			"地图",
			"航海"
		]
	},
	{
		"char": "⛾",
		"name": "实心底空心杯",
		"ename": "CUP ON SOLID SQUARE",
		"tags": [
			"饮食"
		],
		"alias": [
			"杯子",
			"饮料"
		]
	},
	{
		"char": "☕",
		"name": "热饮",
		"ename": "Hot Beverage",
		"tags": [
			"饮食"
		],
		"alias": [
			"咖啡",
			"饮料",
			"早晨",
			"星巴克",
			"热气腾腾",
			"茶"
		]
	},
	{
		"char": "☂",
		"name": "雨伞",
		"ename": "Umbrella",
		"tags": [
			"出行、交通、旅游"
		],
		"alias": [
			"伞",
			"雨"
		]
	},
	{
		"char": "☔",
		"name": "带雨滴的雨伞",
		"ename": "Umbrella with Rain Drops",
		"tags": [
			"出行、交通、旅游"
		],
		"alias": [
			"下雨",
			"伞",
			"雨伞",
			"雨滴"
		]
	},
	{
		"char": "⛱",
		"name": "地面雨伞",
		"ename": "Umbrella On Ground",
		"tags": [
			"出行、交通、旅游"
		],
		"alias": [
			"沙滩",
			"度假",
			"下雨",
			"伞",
			"地上的阳伞",
			"太阳",
			"阳伞"
		]
	},
	{
		"char": "⛟",
		"name": "实心卡车",
		"ename": "SOLID TRUCK",
		"tags": [
			"出行、交通、旅游"
		],
		"alias": [
			"交通",
			"车辆"
		]
	},
	{
		"char": "⛴",
		"name": "渡轮",
		"ename": "FERRY",
		"tags": [
			"出行、交通、旅游"
		],
		"alias": [
			"交通",
			"航海",
			"旅客",
			"渡船",
			"轮船"
		]
	},
	{
		"char": "⛺",
		"name": "帐篷",
		"ename": "Tent",
		"tags": [
			"出行、交通、旅游"
		],
		"alias": [
			"帐篷",
			"露营"
		]
	},
	{
		"char": "⛵",
		"name": "帆船",
		"ename": "Sailboat",
		"tags": [
			"出行、交通、旅游"
		],
		"alias": [
			"游艇",
			"船",
			"驾帆船"
		]
	},
	{
		"char": "🚀",
		"name": "火箭",
		"ename": "Rocket",
		"tags": [
			"出行、交通、旅游"
		],
		"alias": [
			"火箭",
			"太空",
			"发射",
			"旅行"
		]
	},
	{
		"char": "🚁",
		"name": "直升机",
		"ename": "Helicopter",
		"tags": [
			"出行、交通、旅游"
		],
		"alias": [
			"直升机",
			"飞行器",
			"旅行",
			"直升飞机"
		]
	},
	{
		"char": "🚂",
		"name": "蒸汽机车",
		"ename": "Steam Locomotive",
		"tags": [
			"出行、交通、旅游"
		],
		"alias": [
			"火车",
			"蒸汽",
			"守车",
			"旅行",
			"火车头",
			"蒸汽火车",
			"蒸汽车头",
			"铁路"
		]
	},
	{
		"char": "🚃",
		"name": "电车",
		"ename": "Railway Car",
		"tags": [
			"出行、交通、旅游"
		],
		"alias": [
			"电车",
			"铁路",
			"旅行",
			"轨道车"
		]
	},
	{
		"char": "🚄",
		"name": "高速列车",
		"ename": "High-Speed Train",
		"tags": [
			"出行、交通、旅游"
		],
		"alias": [
			"火车",
			"高速",
			"动车",
			"新干线",
			"速度",
			"高铁"
		]
	},
	{
		"char": "🚅",
		"name": "子弹头列车",
		"ename": "Bullet Train",
		"tags": [
			"出行、交通、旅游"
		],
		"alias": [
			"火车",
			"子弹头",
			"动车",
			"子弹列车",
			"子弹头高速列车",
			"新干线",
			"高速",
			"高铁"
		]
	},
	{
		"char": "🚆",
		"name": "火车",
		"ename": "Train",
		"tags": [
			"出行、交通、旅游"
		],
		"alias": [
			"火车",
			"铁路",
			"到站",
			"呜呜"
		]
	},
	{
		"char": "🚇",
		"name": "地铁",
		"ename": "Metro",
		"tags": [
			"出行、交通、旅游"
		],
		"alias": [
			"地铁",
			"地下",
			"捷运"
		]
	},
	{
		"char": "🚈",
		"name": "轻轨",
		"ename": "Light Rail",
		"tags": [
			"出行、交通、旅游"
		],
		"alias": [
			"轻轨",
			"铁路",
			"到站",
			"单轨电车",
			"火车"
		]
	},
	{
		"char": "🚉",
		"name": "车站",
		"ename": "Station",
		"tags": [
			"出行、交通、旅游"
		],
		"alias": [
			"车站",
			"交通",
			"地铁",
			"捷运",
			"火车",
			"铁路"
		]
	},
	{
		"char": "🚊",
		"name": "电车",
		"ename": "Tram",
		"tags": [
			"出行、交通、旅游"
		],
		"alias": [
			"电车",
			"城市交通",
			"捷运",
			"路面电车"
		]
	},
	{
		"char": "🚋",
		"name": "电车",
		"ename": "Tram Car",
		"tags": [
			"出行、交通、旅游"
		],
		"alias": [
			"电车",
			"城市交通",
			"有轨电车",
			"轨道"
		]
	},
	{
		"char": "🚌",
		"name": "公共汽车",
		"ename": "Bus",
		"tags": [
			"出行、交通、旅游"
		],
		"alias": [
			"公共汽车",
			"城市交通",
			"公交",
			"公交车",
			"大巴"
		]
	},
	{
		"char": "🚍",
		"name": "迎面而来的公共汽车",
		"ename": "Oncoming Bus",
		"tags": [
			"出行、交通、旅游"
		],
		"alias": [
			"公共汽车",
			"城市交通",
			"公交",
			"大巴",
			"迎面驶来",
			"迎面驶来的公交车"
		]
	},
	{
		"char": "🚎",
		"name": "无轨电车",
		"ename": "Trolleybus",
		"tags": [
			"出行、交通、旅游"
		],
		"alias": [
			"无轨电车",
			"城市交通",
			"公共汽车",
			"电车"
		]
	},
	{
		"char": "🚏",
		"name": "公共汽车站",
		"ename": "Bus Stop",
		"tags": [
			"出行、交通、旅游"
		],
		"alias": [
			"公共汽车站",
			"交通",
			"公交站",
			"公交车站"
		]
	},
	{
		"char": "🚐",
		"name": "小巴",
		"ename": "Minibus",
		"tags": [
			"出行、交通、旅游"
		],
		"alias": [
			"小巴",
			"城市交通",
			"公共汽车",
			"开车",
			"移动房车"
		]
	},
	{
		"char": "🚑",
		"name": "救护车",
		"ename": "Ambulance",
		"tags": [
			"出行、交通、旅游"
		],
		"alias": [
			"救护车",
			"医疗",
			"急救",
			"车辆"
		]
	},
	{
		"char": "🚒",
		"name": "消防车",
		"ename": "Fire Engine",
		"tags": [
			"出行、交通、旅游"
		],
		"alias": [
			"消防车",
			"消防",
			"救火车",
			"火灾"
		]
	},
	{
		"char": "🚓",
		"name": "警车",
		"ename": "Police Car",
		"tags": [
			"出行、交通、旅游"
		],
		"alias": [
			"警车",
			"警察",
			"檀岛警騎",
			"汽车",
			"巡逻"
		]
	},
	{
		"char": "🚔",
		"name": "迎面而来的警车",
		"ename": "Oncoming Police Car",
		"tags": [
			"出行、交通、旅游"
		],
		"alias": [
			"警车",
			"警察",
			"汽车",
			"迎面驶来的警车"
		]
	},
	{
		"char": "🚕",
		"name": "出租车",
		"ename": "Taxi",
		"tags": [
			"出行、交通、旅游"
		],
		"alias": [
			"出租车",
			"城市交通",
			"小黄",
			"开车",
			"汽车",
			"的士",
			"计程车"
		]
	},
	{
		"char": "🚖",
		"name": "迎面而来的出租车",
		"ename": "Oncoming Taxi",
		"tags": [
			"出行、交通、旅游"
		],
		"alias": [
			"出租车",
			"城市交通",
			"优步",
			"叫车",
			"小黄",
			"开车",
			"的士",
			"迎面驶来的出租车"
		]
	},
	{
		"char": "🚗",
		"name": "汽车",
		"ename": "Automobile",
		"tags": [
			"出行、交通、旅游"
		],
		"alias": [
			"汽车",
			"交通工具",
			"开车",
			"轿车"
		]
	},
	{
		"char": "🚘",
		"name": "迎面而来的汽车",
		"ename": "Oncoming Automobile",
		"tags": [
			"出行、交通、旅游"
		],
		"alias": [
			"汽车",
			"交通工具",
			"开车",
			"轿车",
			"迎面而来",
			"迎面驶来的汽车"
		]
	},
	{
		"char": "🚙",
		"name": "运动型多用途车",
		"ename": "Sport Utility Vehicle",
		"tags": [
			"出行、交通、旅游"
		],
		"alias": [
			"SUV",
			"汽车",
			"休旅车",
			"休闲车",
			"开车",
			"房车",
			"车辆",
			"轿车",
			"驾驶"
		]
	},
	{
		"char": "🚚",
		"name": "货车",
		"ename": "Delivery Truck",
		"tags": [
			"出行、交通、旅游"
		],
		"alias": [
			"货车",
			"运输",
			"卡车",
			"开车",
			"送货"
		]
	},
	{
		"char": "🚛",
		"name": "铰接式货车",
		"ename": "Articulated Lorry",
		"tags": [
			"出行、交通、旅游"
		],
		"alias": [
			"货车",
			"运输",
			"卡车",
			"拖车",
			"搬运",
			"铰接式卡车"
		]
	},
	{
		"char": "🚜",
		"name": "拖拉机",
		"ename": "Tractor",
		"tags": [
			"出行、交通、旅游"
		],
		"alias": [
			"拖拉机",
			"农业"
		]
	},
	{
		"char": "🚝",
		"name": "单轨铁路",
		"ename": "Monorail",
		"tags": [
			"出行、交通、旅游"
		],
		"alias": [
			"单轨铁路",
			"铁路",
			"单轨",
			"单轨电车",
			"火车"
		]
	},
	{
		"char": "🚞",
		"name": "山区铁路",
		"ename": "Mountain Railway",
		"tags": [
			"出行、交通、旅游"
		],
		"alias": [
			"山区铁路",
			"铁路",
			"山区",
			"山地铁路",
			"火车"
		]
	},
	{
		"char": "🚟",
		"name": "悬索铁路",
		"ename": "Suspension Railway",
		"tags": [
			"出行、交通、旅游"
		],
		"alias": [
			"悬索铁路",
			"铁路",
			"悬挂",
			"悬挂式单轨",
			"空中轨道列车",
			"空轨"
		]
	},
	{
		"char": "🚠",
		"name": "山地缆车",
		"ename": "Mountain Cableway",
		"tags": [
			"出行、交通、旅游"
		],
		"alias": [
			"山地缆车",
			"缆车",
			"空中",
			"索道"
		]
	},
	{
		"char": "🚡",
		"name": "空中缆车",
		"ename": "Aerial Tramway",
		"tags": [
			"出行、交通、旅游"
		],
		"alias": [
			"空中缆车",
			"缆车",
			"空中",
			"索道"
		]
	},
	{
		"char": "🚢",
		"name": "轮船",
		"ename": "Ship",
		"tags": [
			"出行、交通、旅游"
		],
		"alias": [
			"轮船",
			"海运",
			"旅客",
			"旅行",
			"船"
		]
	},
	{
		"char": "🚣",
		"name": "划船的人",
		"ename": "Person Rowing Boat",
		"tags": [
			"出行、交通、旅游"
		],
		"alias": [
			"划船",
			"水上运动",
			"划桨",
			"划船运动",
			"划艇",
			"木筏",
			"河",
			"泛舟湖上",
			"湖",
			"独木舟",
			"船",
			"钓鱼"
		]
	},
	{
		"char": "🚤",
		"name": "快艇",
		"ename": "Speedboat",
		"tags": [
			"出行、交通、旅游"
		],
		"alias": [
			"快艇",
			"水上运动",
			"亿万富翁",
			"船",
			"豪华游艇"
		]
	},
	{
		"char": "🚥",
		"name": "水平交通信号灯",
		"ename": "Horizontal Traffic Light",
		"tags": [
			"出行、交通、旅游"
		],
		"alias": [
			"交通信号灯",
			"交通",
			"交通灯",
			"信号灯",
			"横向的红绿灯",
			"红绿灯"
		]
	},
	{
		"char": "🚦",
		"name": "垂直交通信号灯",
		"ename": "Vertical Traffic Light",
		"tags": [
			"出行、交通、旅游"
		],
		"alias": [
			"交通信号灯",
			"交通",
			"交叉口",
			"交通灯",
			"信号灯",
			"直的红绿灯",
			"红绿灯",
			"纵向的红绿灯"
		]
	},
	{
		"char": "🚧",
		"name": "施工",
		"ename": "Construction",
		"tags": [
			"出行、交通、旅游"
		],
		"alias": [
			"施工",
			"道路",
			"路障"
		]
	},
	{
		"char": "🚨",
		"name": "旋转的警灯",
		"ename": "Rotating Light",
		"tags": [
			"出行、交通、旅游"
		],
		"alias": [
			"警灯",
			"警察",
			"灯",
			"紧急",
			"警报",
			"警示",
			"警车灯"
		]
	},
	{
		"char": "🚪",
		"name": "门",
		"ename": "Door",
		"tags": [
			"出行、交通、旅游"
		],
		"alias": [
			"门",
			"建筑",
			"出入口",
			"前门",
			"后门",
			"大门",
			"屋门",
			"房门",
			"房间"
		]
	},
	{
		"char": "🚫",
		"name": "禁止",
		"ename": "Prohibited",
		"tags": [
			"出行、交通、旅游"
		],
		"alias": [
			"禁止",
			"交通",
			"不准",
			"不许",
			"严禁",
			"禁入",
			"禁行",
			"阻止"
		]
	},
	{
		"char": "🚲",
		"name": "自行车",
		"ename": "Bicycle",
		"tags": [
			"出行、交通、旅游"
		],
		"alias": [
			"自行车",
			"交通工具",
			"单车",
			"脚踏车",
			"自行车骑士",
			"飞驰",
			"骑车",
			"骑车疾驰"
		]
	},
	{
		"char": "🚳",
		"name": "禁止自行车",
		"ename": "No Bicycles",
		"tags": [
			"出行、交通、旅游"
		],
		"alias": [
			"禁止自行车",
			"交通",
			"严禁",
			"禁止",
			"禁行自行车",
			"自行车",
			"非机动车"
		]
	},
	{
		"char": "🚴",
		"name": "骑自行车的人",
		"ename": "Person Biking",
		"tags": [
			"出行、交通、旅游"
		],
		"alias": [
			"骑自行车",
			"运动",
			"单车",
			"脚踏车",
			"自行车",
			"自行车赛",
			"自行车骑士",
			"骑单车",
			"骑脚踏车者",
			"骑自行车者"
		]
	},
	{
		"char": "🚵",
		"name": "骑山地自行车的人",
		"ename": "Person Mountain Biking",
		"tags": [
			"出行、交通、旅游"
		],
		"alias": [
			"骑山地自行车",
			"运动",
			"体育竞技",
			"单车",
			"山",
			"山地自行车",
			"山地车",
			"山地骑行的人",
			"自行车",
			"骑山地车",
			"骑山地车的人",
			"骑自行车",
			"骑自行车者"
		]
	},
	{
		"char": "🚶",
		"name": "行人",
		"ename": "Person Walking",
		"tags": [
			"出行、交通、旅游"
		],
		"alias": [
			"行人",
			"交通",
			"压马路",
			"徒步",
			"散步",
			"昂首阔步",
			"竞走",
			"行走的人",
			"走路",
			"远足",
			"闲逛"
		]
	},
	{
		"char": "🚷",
		"name": "禁止行人",
		"ename": "No Pedestrians",
		"tags": [
			"出行、交通、旅游"
		],
		"alias": [
			"禁止行人",
			"交通",
			"严禁",
			"禁止行人通行",
			"行人"
		]
	},
	{
		"char": "🚸",
		"name": "儿童过马路",
		"ename": "Children Crossing",
		"tags": [
			"出行、交通、旅游"
		],
		"alias": [
			"儿童过马路",
			"交通",
			"儿童过街",
			"安全",
			"指示牌",
			"行人"
		]
	},
	{
		"char": "🛂",
		"name": "护照检查",
		"ename": "Passport Control",
		"tags": [
			"出行、交通、旅游"
		],
		"alias": [
			"护照检查",
			"海关",
			"安检",
			"护照",
			"检查",
			"通行证"
		]
	},
	{
		"char": "🛃",
		"name": "海关",
		"ename": "Customs",
		"tags": [
			"出行、交通、旅游"
		],
		"alias": [
			"海关",
			"边境",
			"行李打包"
		]
	},
	{
		"char": "🛄",
		"name": "行李提取",
		"ename": "Baggage Claim",
		"tags": [
			"出行、交通、旅游"
		],
		"alias": [
			"行李提取",
			"机场",
			"提取",
			"提取行李",
			"旅行",
			"行李"
		]
	},
	{
		"char": "🛅",
		"name": "行李寄存",
		"ename": "Left Luggage",
		"tags": [
			"出行、交通、旅游"
		],
		"alias": [
			"行李寄存",
			"机场",
			"储物柜",
			"寄存",
			"寄存行李",
			"行李"
		]
	},
	{
		"char": "⛽",
		"name": "燃油泵",
		"ename": "FUEL PUMP",
		"tags": [
			"出行、交通、旅游"
		],
		"alias": [
			"交通",
			"汽车",
			"加油",
			"加油站",
			"柴油",
			"油泵",
			"燃料",
			"燃油"
		]
	},
	{
		"char": "♨",
		"name": "温泉",
		"ename": "HOT SPRING",
		"tags": [
			"出行、交通、旅游"
		],
		"alias": [
			"水",
			"泉",
			"热气腾腾",
			"蒸汽"
		]
	},
	{
		"char": "⚓",
		"name": "船锚",
		"ename": "ANCHOR",
		"tags": [
			"出行、交通、旅游"
		],
		"alias": [
			"停泊",
			"工具",
			"船",
			"锚"
		]
	},
	{
		"char": "⛌",
		"name": "交通标志·交叉车道",
		"ename": "CROSSING LANES",
		"tags": [
			"出行、交通、旅游"
		]
	},
	{
		"char": "⛍",
		"name": "交通标志·故障车辆",
		"ename": "DISABLED CAR",
		"tags": [
			"出行、交通、旅游"
		]
	},
	{
		"char": "⛐",
		"name": "交通标志·车辆侧滑",
		"ename": "CAR SLIDING",
		"tags": [
			"出行、交通、旅游"
		]
	},
	{
		"char": "⛑",
		"name": "带白十字的头盔（救援/安全）",
		"ename": "HELMET WITH WHITE CROSS",
		"tags": [
			"出行、交通、旅游"
		],
		"alias": [
			"十字",
			"头盔",
			"安全帽",
			"救援人员头盔",
			"白十字头盔",
			"脸"
		]
	},
	{
		"char": "⛒",
		"name": "圆圈内的交叉车道",
		"ename": "CIRCLED CROSSING LANES",
		"tags": [
			"出行、交通、旅游"
		]
	},
	{
		"char": "⛔",
		"name": "禁止进入",
		"ename": "NO ENTRY",
		"tags": [
			"出行、交通、旅游"
		],
		"alias": [
			"交通",
			"禁止入内",
			"禁止通行",
			"禁行",
			"请勿入内",
			"请勿驶入"
		]
	},
	{
		"char": "⛕",
		"name": "交替单向左行交通",
		"ename": "ALTERNATE ONE-WAY LEFT WAY TRAFFIC",
		"tags": [
			"出行、交通、旅游"
		]
	},
	{
		"char": "⛖",
		"name": "实心双向左行交通",
		"ename": "SOLID TWO-WAY LEFT WAY TRAFFIC",
		"tags": [
			"出行、交通、旅游"
		]
	},
	{
		"char": "⛗",
		"name": "空心双向左行交通",
		"ename": "HOLLOW TWO-WAY LEFT WAY TRAFFIC",
		"tags": [
			"出行、交通、旅游"
		],
		"alias": [
			"交通",
			"道路"
		]
	},
	{
		"char": "⛘",
		"name": "实心左车道合并",
		"ename": "SOLID LEFT LANE MERGE",
		"tags": [
			"出行、交通、旅游"
		],
		"alias": [
			"交通",
			"道路"
		]
	},
	{
		"char": "⛙",
		"name": "空心左车道合并",
		"ename": "HOLLOW LEFT LANE MERGE",
		"tags": [
			"出行、交通、旅游"
		],
		"alias": [
			"交通",
			"道路"
		]
	},
	{
		"char": "⛚",
		"name": "慢行标志",
		"ename": "DRIVE SLOW SIGN",
		"tags": [
			"出行、交通、旅游"
		],
		"alias": [
			"交通",
			"警告"
		]
	},
	{
		"char": "⛜",
		"name": "左侧入口关闭",
		"ename": "LEFT CLOSED ENTRY",
		"tags": [
			"出行、交通、旅游"
		],
		"alias": [
			"交通",
			"道路"
		]
	},
	{
		"char": "⛠",
		"name": "限制左转入口-1",
		"ename": "RESTRICTED LEFT ENTRY-1",
		"tags": [
			"出行、交通、旅游"
		],
		"alias": [
			"交通",
			"道路"
		]
	},
	{
		"char": "⛡",
		"name": "限制左转入口-2",
		"ename": "RESTRICTED LEFT ENTRY-2",
		"tags": [
			"出行、交通、旅游"
		],
		"alias": [
			"交通",
			"道路"
		]
	},
	{
		"char": "𝅝",
		"name": "全音符",
		"ename": "Musical Symbol Whole Note",
		"tags": [
			"音乐"
		],
		"unicode": "U+1D15D"
	},
	{
		"char": "𝅗𝅥",
		"name": "二分音符",
		"ename": "Musical Symbol Half Note",
		"tags": [
			"音乐"
		],
		"unicode": "U+1D15E"
	},
	{
		"char": "♩",
		"name": "四分音符",
		"ename": "Quarter Note",
		"tags": [
			"音乐"
		],
		"unicode": "U+2669"
	},
	{
		"char": "♪",
		"name": "八分音符",
		"ename": "Eighth Note",
		"tags": [
			"音乐"
		],
		"alias": [
			"音符"
		],
		"unicode": "U+266A"
	},
	{
		"char": "♫",
		"name": "双八分音符",
		"ename": "Beamed Eighth Notes",
		"tags": [
			"音乐"
		],
		"unicode": "U+266B"
	},
	{
		"char": "♬",
		"name": "十六分音符",
		"ename": "Beamed Sixteenth Notes",
		"tags": [
			"音乐"
		],
		"unicode": "U+266C"
	},
	{
		"char": "♭",
		"name": "降号",
		"ename": "Music Flat Sign",
		"tags": [
			"音乐"
		],
		"alias": [
			"降音符",
			"音符"
		],
		"unicode": "U+266D"
	},
	{
		"char": "♮",
		"name": "还原号",
		"ename": "Music Natural Sign",
		"tags": [
			"音乐"
		],
		"unicode": "U+266E"
	},
	{
		"char": "♯",
		"name": "升号",
		"ename": "Music Sharp Sign",
		"tags": [
			"音乐"
		],
		"alias": [
			"升音符",
			"音符"
		],
		"unicode": "U+266F"
	},
	{
		"char": "𝄀",
		"name": "单小节线",
		"ename": "Musical Symbol Single Barline",
		"tags": [
			"音乐"
		],
		"unicode": "U+1D100"
	},
	{
		"char": "𝄁",
		"name": "双小节线",
		"ename": "Musical Symbol Double Barline",
		"tags": [
			"音乐"
		],
		"unicode": "U+1D101"
	},
	{
		"char": "𝄂",
		"name": "终止线",
		"ename": "Musical Symbol Final Barline",
		"tags": [
			"音乐"
		],
		"unicode": "U+1D102"
	},
	{
		"char": "𝄃",
		"name": "反向终止线",
		"ename": "Musical Symbol Reverse Final Barline",
		"tags": [
			"音乐"
		],
		"unicode": "U+1D103"
	},
	{
		"char": "𝄄",
		"name": "虚线小节线",
		"ename": "Musical Symbol Dashed Barline",
		"tags": [
			"音乐"
		],
		"unicode": "U+1D104"
	},
	{
		"char": "𝄅",
		"name": "短小节线",
		"ename": "Musical Symbol Short Barline",
		"tags": [
			"音乐"
		],
		"unicode": "U+1D105"
	},
	{
		"char": "𝄆",
		"name": "左反复记号",
		"ename": "Musical Symbol Left Repeat Sign",
		"tags": [
			"音乐"
		],
		"unicode": "U+1D106"
	},
	{
		"char": "𝄇",
		"name": "右反复记号",
		"ename": "Musical Symbol Right Repeat Sign",
		"tags": [
			"音乐"
		],
		"unicode": "U+1D107"
	},
	{
		"char": "𝄈",
		"name": "反复点",
		"ename": "Musical Symbol Repeat Dots",
		"tags": [
			"音乐"
		],
		"unicode": "U+1D108"
	},
	{
		"char": "𝄉",
		"name": "从记号处反复",
		"ename": "Musical Symbol Dal Segno",
		"tags": [
			"音乐"
		],
		"unicode": "U+1D109"
	},
	{
		"char": "𝄊",
		"name": "从头反复",
		"ename": "Musical Symbol Da Capo",
		"tags": [
			"音乐"
		],
		"unicode": "U+1D10A"
	},
	{
		"char": "𝄋",
		"name": "Segno记号",
		"ename": "Musical Symbol Segno",
		"tags": [
			"音乐"
		],
		"unicode": "U+1D10B"
	},
	{
		"char": "𝄌",
		"name": "Coda尾声",
		"ename": "Musical Symbol Coda",
		"tags": [
			"音乐"
		],
		"unicode": "U+1D10C"
	},
	{
		"char": "𝄍",
		"name": "重复音型-1",
		"ename": "Musical Symbol Repeated Figure-1",
		"tags": [
			"音乐"
		],
		"unicode": "U+1D10D"
	},
	{
		"char": "𝄎",
		"name": "重复音型-2",
		"ename": "Musical Symbol Repeated Figure-2",
		"tags": [
			"音乐"
		],
		"unicode": "U+1D10E"
	},
	{
		"char": "𝄏",
		"name": "重复音型-3",
		"ename": "Musical Symbol Repeated Figure-3",
		"tags": [
			"音乐"
		],
		"unicode": "U+1D10F"
	},
	{
		"char": "𝄐",
		"name": "延长记号",
		"ename": "Musical Symbol Fermata",
		"tags": [
			"音乐"
		],
		"unicode": "U+1D110"
	},
	{
		"char": "𝄑",
		"name": "下方延长记号",
		"ename": "Musical Symbol Fermata Below",
		"tags": [
			"音乐"
		],
		"unicode": "U+1D111"
	},
	{
		"char": "𝄒",
		"name": "呼吸记号",
		"ename": "Musical Symbol Breath Mark",
		"tags": [
			"音乐"
		],
		"unicode": "U+1D112"
	},
	{
		"char": "𝄓",
		"name": "停顿记号",
		"ename": "Musical Symbol Caesura",
		"tags": [
			"音乐"
		],
		"unicode": "U+1D113"
	},
	{
		"char": "𝄔",
		"name": "花括号",
		"ename": "Musical Symbol Brace",
		"tags": [
			"音乐"
		],
		"unicode": "U+1D114"
	},
	{
		"char": "𝄕",
		"name": "方括号",
		"ename": "Musical Symbol Bracket",
		"tags": [
			"音乐"
		],
		"unicode": "U+1D115"
	},
	{
		"char": "𝄖",
		"name": "单线谱表",
		"ename": "Musical Symbol One-Line Staff",
		"tags": [
			"音乐"
		],
		"unicode": "U+1D116"
	},
	{
		"char": "𝄗",
		"name": "双线谱表",
		"ename": "Musical Symbol Two-Line Staff",
		"tags": [
			"音乐"
		],
		"unicode": "U+1D117"
	},
	{
		"char": "𝄘",
		"name": "三线谱表",
		"ename": "Musical Symbol Three-Line Staff",
		"tags": [
			"音乐"
		],
		"unicode": "U+1D118"
	},
	{
		"char": "𝄙",
		"name": "四线谱表",
		"ename": "Musical Symbol Four-Line Staff",
		"tags": [
			"音乐"
		],
		"unicode": "U+1D119"
	},
	{
		"char": "𝄚",
		"name": "五线谱表",
		"ename": "Musical Symbol Five-Line Staff",
		"tags": [
			"音乐"
		],
		"unicode": "U+1D11A"
	},
	{
		"char": "𝄛",
		"name": "六线谱表",
		"ename": "Musical Symbol Six-Line Staff",
		"tags": [
			"音乐"
		],
		"unicode": "U+1D11B"
	},
	{
		"char": "𝄜",
		"name": "六弦指板图",
		"ename": "Musical Symbol Six-String Fretboard",
		"tags": [
			"音乐"
		],
		"unicode": "U+1D11C"
	},
	{
		"char": "𝄝",
		"name": "四弦指板图",
		"ename": "Musical Symbol Four-String Fretboard",
		"tags": [
			"音乐"
		],
		"unicode": "U+1D11D"
	},
	{
		"char": "𝄞",
		"name": "高音谱号",
		"ename": "Musical Symbol G Clef",
		"tags": [
			"音乐"
		],
		"unicode": "U+1D11E"
	},
	{
		"char": "𝄟",
		"name": "高八度高音谱号",
		"ename": "Musical Symbol G Clef Ottava Alta",
		"tags": [
			"音乐"
		],
		"unicode": "U+1D11F"
	},
	{
		"char": "𝄠",
		"name": "低八度高音谱号",
		"ename": "Musical Symbol G Clef Ottava Bassa",
		"tags": [
			"音乐"
		],
		"unicode": "U+1D120"
	},
	{
		"char": "𝄡",
		"name": "C谱号（中音谱号）",
		"ename": "Musical Symbol C Clef",
		"tags": [
			"音乐"
		],
		"unicode": "U+1D121"
	},
	{
		"char": "𝄢",
		"name": "低音谱号",
		"ename": "Musical Symbol F Clef",
		"tags": [
			"音乐"
		],
		"unicode": "U+1D122"
	},
	{
		"char": "𝄣",
		"name": "高八度低音谱号",
		"ename": "Musical Symbol F Clef Ottava Alta",
		"tags": [
			"音乐"
		],
		"unicode": "U+1D123"
	},
	{
		"char": "𝄤",
		"name": "低八度低音谱号",
		"ename": "Musical Symbol F Clef Ottava Bassa",
		"tags": [
			"音乐"
		],
		"unicode": "U+1D124"
	},
	{
		"char": "𝄥",
		"name": "打击乐谱号-1",
		"ename": "Musical Symbol Drum Clef-1",
		"tags": [
			"音乐"
		],
		"unicode": "U+1D125"
	},
	{
		"char": "𝄦",
		"name": "打击乐谱号-2",
		"ename": "Musical Symbol Drum Clef-2",
		"tags": [
			"音乐"
		],
		"unicode": "U+1D126"
	},
	{
		"char": "𝄩",
		"name": "多小节休止符",
		"ename": "Musical Symbol Multiple Measure Rest",
		"tags": [
			"音乐"
		],
		"unicode": "U+1D129"
	},
	{
		"char": "𝄪",
		"name": "重升号",
		"ename": "Musical Symbol Double Sharp",
		"tags": [
			"音乐"
		],
		"unicode": "U+1D12A"
	},
	{
		"char": "𝄫",
		"name": "重降号",
		"ename": "Musical Symbol Double Flat",
		"tags": [
			"音乐"
		],
		"unicode": "U+1D12B"
	},
	{
		"char": "𝄬",
		"name": "上翻平调号",
		"ename": "Musical Symbol Flat Up",
		"tags": [
			"音乐"
		],
		"unicode": "U+1D12C"
	},
	{
		"char": "𝄭",
		"name": "下翻平调号",
		"ename": "Musical Symbol Flat Down",
		"tags": [
			"音乐"
		],
		"unicode": "U+1D12D"
	},
	{
		"char": "𝄮",
		"name": "四分之一升号",
		"ename": "Musical Symbol Quarter Tone Sharp",
		"tags": [
			"音乐"
		],
		"unicode": "U+1D12E"
	},
	{
		"char": "𝄯",
		"name": "四分之一降号",
		"ename": "Musical Symbol Quarter Tone Flat",
		"tags": [
			"音乐"
		],
		"unicode": "U+1D12F"
	},
	{
		"char": "𝅙",
		"name": "空符头",
		"ename": "Musical Symbol Null Notehead",
		"tags": [
			"音乐"
		],
		"unicode": "U+1D159"
	},
	{
		"char": "𝅝",
		"name": "全音符",
		"ename": "Whole Note",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝅗𝅥",
		"name": "二分音符",
		"ename": "Half Note",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "♩",
		"name": "四分音符",
		"ename": "Quarter Note",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "♪",
		"name": "八分音符",
		"ename": "Eighth Note",
		"tags": [
			"音乐"
		],
		"alias": [
			"音符"
		]
	},
	{
		"char": "♫",
		"name": "双八分音符",
		"ename": "Beamed Eighth Notes",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "♬",
		"name": "十六分音符",
		"ename": "Beamed Sixteenth Notes",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "♭",
		"name": "降号",
		"ename": "Music Flat Sign",
		"tags": [
			"音乐"
		],
		"alias": [
			"降音符",
			"音符"
		]
	},
	{
		"char": "♮",
		"name": "本位号",
		"ename": "Music Natural Sign",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "♯",
		"name": "升号",
		"ename": "Music Sharp Sign",
		"tags": [
			"音乐"
		],
		"alias": [
			"升音符",
			"音符"
		]
	},
	{
		"char": "𝄀",
		"name": "单竖线",
		"ename": "Musical Symbol Single Barline",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝄁",
		"name": "双竖线",
		"ename": "Musical Symbol Double Barline",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝄂",
		"name": "终止线",
		"ename": "Musical Symbol Final Barline",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝄃",
		"name": "反向终止线",
		"ename": "Musical Symbol Reverse Final Barline",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝄄",
		"name": "虚线小节线",
		"ename": "Musical Symbol Dashed Barline",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝄅",
		"name": "短小节线",
		"ename": "Musical Symbol Short Barline",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝄆",
		"name": "左重复线",
		"ename": "Musical Symbol Left Repeat Sign",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝄇",
		"name": "右重复线",
		"ename": "Musical Symbol Right Repeat Sign",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝄈",
		"name": "重复点",
		"ename": "Musical Symbol Repeat Dots",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝄉",
		"name": "从记号处反复",
		"ename": "Musical Symbol Dal Segno",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝄊",
		"name": "从头反复",
		"ename": "Musical Symbol Da Capo",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝄋",
		"name": "记号",
		"ename": "Musical Symbol Segno",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝄌",
		"name": "尾声",
		"ename": "Musical Symbol Coda",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝄍",
		"name": "重复图样1",
		"ename": "Musical Symbol Repeated Figure-1",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝄎",
		"name": "重复图样2",
		"ename": "Musical Symbol Repeated Figure-2",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝄏",
		"name": "重复图样3",
		"ename": "Musical Symbol Repeated Figure-3",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝄐",
		"name": "延长记号",
		"ename": "Musical Symbol Fermata",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝄑",
		"name": "下方延长记号",
		"ename": "Musical Symbol Fermata Below",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝄒",
		"name": "呼吸记号",
		"ename": "Musical Symbol Breath Mark",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝄓",
		"name": "休止记号",
		"ename": "Musical Symbol Caesura",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝄔",
		"name": "花括号",
		"ename": "Musical Symbol Brace",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝄕",
		"name": "方括号",
		"ename": "Musical Symbol Bracket",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝄖",
		"name": "单线谱",
		"ename": "Musical Symbol One-Line Staff",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝄗",
		"name": "双线谱",
		"ename": "Musical Symbol Two-Line Staff",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝄘",
		"name": "三线谱",
		"ename": "Musical Symbol Three-Line Staff",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝄙",
		"name": "四线谱",
		"ename": "Musical Symbol Four-Line Staff",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝄚",
		"name": "五线谱",
		"ename": "Musical Symbol Five-Line Staff",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝄛",
		"name": "六线谱",
		"ename": "Musical Symbol Six-Line Staff",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝄜",
		"name": "六弦指板",
		"ename": "Musical Symbol Six-String Fretboard",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝄝",
		"name": "四弦指板",
		"ename": "Musical Symbol Four-String Fretboard",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝄞",
		"name": "G谱号",
		"ename": "Musical Symbol G Clef",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝄟",
		"name": "G谱号高八度",
		"ename": "Musical Symbol G Clef Ottava Alta",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝄠",
		"name": "G谱号低八度",
		"ename": "Musical Symbol G Clef Ottava Bassa",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝄡",
		"name": "C谱号",
		"ename": "Musical Symbol C Clef",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝄢",
		"name": "F谱号",
		"ename": "Musical Symbol F Clef",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝄣",
		"name": "F谱号高八度",
		"ename": "Musical Symbol F Clef Ottava Alta",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝄤",
		"name": "F谱号低八度",
		"ename": "Musical Symbol F Clef Ottava Bassa",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝄥",
		"name": "打击乐谱号1",
		"ename": "Musical Symbol Drum Clef-1",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝄦",
		"name": "打击乐谱号2",
		"ename": "Musical Symbol Drum Clef-2",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝄩",
		"name": "多小节休止符",
		"ename": "Musical Symbol Multiple Measure Rest",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝄪",
		"name": "重升号",
		"ename": "Musical Symbol Double Sharp",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝄫",
		"name": "重降号",
		"ename": "Musical Symbol Double Flat",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝄬",
		"name": "降半音号",
		"ename": "Musical Symbol Flat Up",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝄭",
		"name": "升半音号",
		"ename": "Musical Symbol Flat Down",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝄮",
		"name": "四分之一音升号",
		"ename": "Musical Symbol Quarter Tone Sharp",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝄯",
		"name": "四分之一音降号",
		"ename": "Musical Symbol Quarter Tone Flat",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝅅",
		"name": "长休止符",
		"ename": "Musical Symbol Longa Rest",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝅆",
		"name": "双全休止符",
		"ename": "Musical Symbol Breve Rest",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝅇",
		"name": "全休止符",
		"ename": "Musical Symbol Whole Rest",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝅈",
		"name": "二分休止符",
		"ename": "Musical Symbol Half Rest",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝅉",
		"name": "四分休止符",
		"ename": "Musical Symbol Quarter Rest",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝅊",
		"name": "八分休止符",
		"ename": "Musical Symbol Eighth Rest",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝅋",
		"name": "十六分休止符",
		"ename": "Musical Symbol Sixteenth Rest",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝅌",
		"name": "三十二分休止符",
		"ename": "Musical Symbol Thirty-Second Rest",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝅍",
		"name": "六十四分休止符",
		"ename": "Musical Symbol Sixty-Fourth Rest",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝅎",
		"name": "一百二十八分休止符",
		"ename": "Musical Symbol One-Hundred-Twenty-Eighth Rest",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝅏",
		"name": "二百五十六分休止符",
		"ename": "Musical Symbol Two-Hundred-Fifty-Sixth Rest",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝅐",
		"name": "五百一十二分休止符",
		"ename": "Musical Symbol Five-Hundred-Twelfth Rest",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝅑",
		"name": "一千零二十四分休止符",
		"ename": "Musical Symbol One-Thousand-Twenty-Fourth Rest",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝅒",
		"name": "长音符",
		"ename": "Musical Symbol Longa Note",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝅓",
		"name": "双全音符",
		"ename": "Musical Symbol Breve Note",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝅔",
		"name": "有符干的双全音符",
		"ename": "Musical Symbol Breve Note With Stem",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝅕",
		"name": "带斜线的双全音符",
		"ename": "Musical Symbol Breve Note With Slashed Stem",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝅖",
		"name": "带斜线和符干的双全音符",
		"ename": "Musical Symbol Breve Note With Slashed Stem and Flag",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝅗",
		"name": "空心符头",
		"ename": "Musical Symbol Void Notehead",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝅘",
		"name": "实心符头",
		"ename": "Musical Symbol Notehead Black",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝅙",
		"name": "空符头",
		"ename": "Musical Symbol Null Notehead",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝅚",
		"name": "簇形空心符头",
		"ename": "Musical Symbol Cluster Notehead White",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝅛",
		"name": "簇形实心符头",
		"ename": "Musical Symbol Cluster Notehead Black",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝅜",
		"name": "带斜线和符干的全音符",
		"ename": "Musical Symbol Whole Note With Slashed Stem and Flag",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝅝",
		"name": "空心二分音符",
		"ename": "Musical Symbol Void Half Note",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝅗𝅥",
		"name": "二分音符",
		"ename": "Musical Symbol Half Note",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝅘𝅥",
		"name": "带斜线和符干的二分音符",
		"ename": "Musical Symbol Half Note With Slashed Stem and Flag",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝅘𝅥𝅮",
		"name": "四分音符",
		"ename": "Musical Symbol Quarter Note",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝅘𝅥𝅯",
		"name": "带斜线和符干的四分音符",
		"ename": "Musical Symbol Quarter Note With Slashed Stem and Flag",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝅘𝅥𝅰",
		"name": "八分音符",
		"ename": "Musical Symbol Eighth Note",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝅘𝅥𝅱",
		"name": "十六分音符",
		"ename": "Musical Symbol Sixteenth Note",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝅘𝅥𝅲",
		"name": "三十二分音符",
		"ename": "Musical Symbol Thirty-Second Note",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝅥",
		"name": "六十四分音符",
		"ename": "Musical Symbol Sixty-Fourth Note",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝅦",
		"name": "一百二十八分音符",
		"ename": "Musical Symbol One-Hundred-Twenty-Eighth Note",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝅧",
		"name": "二百五十六分音符",
		"ename": "Musical Symbol Two-Hundred-Fifty-Sixth Note",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝅨",
		"name": "五百一十二分音符",
		"ename": "Musical Symbol Five-Hundred-Twelfth Note",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝅩",
		"name": "一千零二十四分音符",
		"ename": "Musical Symbol One-Thousand-Twenty-Fourth Note",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝅪",
		"name": "连音符",
		"ename": "Musical Symbol Combining Augmentation Dot",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝆒",
		"name": "颤音记号",
		"ename": "Musical Symbol Tremolo-1",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝆓",
		"name": "双颤音记号",
		"ename": "Musical Symbol Tremolo-2",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝆔",
		"name": "三颤音记号",
		"ename": "Musical Symbol Tremolo-3",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝆕",
		"name": "琶音上行",
		"ename": "Musical Symbol Arpeggiato Up",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝆖",
		"name": "琶音下行",
		"ename": "Musical Symbol Arpeggiato Down",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝆗",
		"name": "断音记号",
		"ename": "Musical Symbol Staccato",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝆘",
		"name": "特断音记号",
		"ename": "Musical Symbol Staccatissimo",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝆙",
		"name": "次断音记号",
		"ename": "Musical Symbol Marcato",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝆚",
		"name": "下方次断音记号",
		"ename": "Musical Symbol Marcato Below",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝆛",
		"name": "保持音记号",
		"ename": "Musical Symbol Tenuto",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝆜",
		"name": "保持音断音记号",
		"ename": "Musical Symbol Tenuto Staccato",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝆝",
		"name": "重音记号",
		"ename": "Musical Symbol Accent",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝆞",
		"name": "下方重音记号",
		"ename": "Musical Symbol Accent Below",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝆟",
		"name": "左指拨弦",
		"ename": "Musical Symbol Left-Hand Pizzicato",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝆠",
		"name": "自然泛音",
		"ename": "Musical Symbol Natural Harmonic",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝆡",
		"name": "人工泛音",
		"ename": "Musical Symbol Artificial Harmonic",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝆢",
		"name": "上方 mordent",
		"ename": "Musical Symbol Mordent",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝆣",
		"name": "下方 mordent",
		"ename": "Musical Symbol Inverted Mordent",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝆤",
		"name": "回音",
		"ename": "Musical Symbol Turn",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝆥",
		"name": "倒回音",
		"ename": "Musical Symbol Inverted Turn",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝆦",
		"name": "颤音",
		"ename": "Musical Symbol Trill",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝆧",
		"name": "上方颤音",
		"ename": "Musical Symbol Upper Trill",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝆨",
		"name": "下方颤音",
		"ename": "Musical Symbol Lower Trill",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝆩",
		"name": "上方普拉勒音",
		"ename": "Musical Symbol Upper Pralltriller",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝆪",
		"name": "下方普拉勒音",
		"ename": "Musical Symbol Lower Pralltriller",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝆫",
		"name": "上方普拉勒颤音",
		"ename": "Musical Symbol Upper Pralltriller Trill",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝆬",
		"name": "下方普拉勒颤音",
		"ename": "Musical Symbol Lower Pralltriller Trill",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝆭",
		"name": "上方 mordent 颤音",
		"ename": "Musical Symbol Upper Mordent Trill",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝆮",
		"name": "下方 mordent 颤音",
		"ename": "Musical Symbol Lower Mordent Trill",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝆯",
		"name": "上方回音颤音",
		"ename": "Musical Symbol Upper Turn Trill",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝆰",
		"name": "下方回音颤音",
		"ename": "Musical Symbol Lower Turn Trill",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝆱",
		"name": "上方颤音回音",
		"ename": "Musical Symbol Upper Trill Turn",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝆲",
		"name": "下方颤音回音",
		"ename": "Musical Symbol Lower Trill Turn",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝆳",
		"name": "上方普拉勒回音",
		"ename": "Musical Symbol Upper Pralltriller Turn",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝆴",
		"name": "下方普拉勒回音",
		"ename": "Musical Symbol Lower Pralltriller Turn",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝆵",
		"name": "上方 mordent 回音",
		"ename": "Musical Symbol Upper Mordent Turn",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝆶",
		"name": "下方 mordent 回音",
		"ename": "Musical Symbol Lower Mordent Turn",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝆷",
		"name": "上方回音普拉勒",
		"ename": "Musical Symbol Upper Turn Pralltriller",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝆸",
		"name": "下方回音普拉勒",
		"ename": "Musical Symbol Lower Turn Pralltriller",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝆹",
		"name": "上方颤音普拉勒",
		"ename": "Musical Symbol Upper Trill Pralltriller",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝆺",
		"name": "下方颤音普拉勒",
		"ename": "Musical Symbol Lower Trill Pralltriller",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝆹𝅥",
		"name": "上方普拉勒颤音普拉勒",
		"ename": "Musical Symbol Upper Pralltriller Pralltriller",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝆺𝅥",
		"name": "下方普拉勒颤音普拉勒",
		"ename": "Musical Symbol Lower Pralltriller Pralltriller",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝆹𝅥𝅮",
		"name": "连奏记号",
		"ename": "Musical Symbol Slur",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝆺𝅥𝅮",
		"name": "连音线",
		"ename": "Musical Symbol Tie",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝆹𝅥𝅯",
		"name": "连音线下方",
		"ename": "Musical Symbol Tie Below",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝆺𝅥𝅯",
		"name": "连奏记号下方",
		"ename": "Musical Symbol Slur Below",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝇁",
		"name": "乐句记号",
		"ename": "Musical Symbol Phrase Mark",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝇂",
		"name": "乐句记号下方",
		"ename": "Musical Symbol Phrase Mark Below",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝇃",
		"name": "渐强记号",
		"ename": "Musical Symbol Crescendo",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝇄",
		"name": "渐弱记号",
		"ename": "Musical Symbol Decrescendo",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝇅",
		"name": "渐强渐弱记号",
		"ename": "Musical Symbol Crescendo Decrescendo",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝇆",
		"name": "渐弱渐强记号",
		"ename": "Musical Symbol Decrescendo Crescendo",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝇇",
		"name": "极弱",
		"ename": "Musical Symbol Pianissimo",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝇈",
		"name": "弱",
		"ename": "Musical Symbol Piano",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝇉",
		"name": "中弱",
		"ename": "Musical Symbol Mezzo Piano",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝇊",
		"name": "中强",
		"ename": "Musical Symbol Mezzo Forte",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝇋",
		"name": "强",
		"ename": "Musical Symbol Forte",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝇌",
		"name": "极强",
		"ename": "Musical Symbol Fortissimo",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝇍",
		"name": "最弱",
		"ename": "Musical Symbol Pianississimo",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝇎",
		"name": "最强",
		"ename": "Musical Symbol Fortississimo",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝇏",
		"name": "突弱",
		"ename": "Musical Symbol Sforzando",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝇐",
		"name": "突强",
		"ename": "Musical Symbol Sforzato",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝇑",
		"name": "强后突弱",
		"ename": "Musical Symbol Forte Piano",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝇒",
		"name": "强后即弱",
		"ename": "Musical Symbol Forte-Piano",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝇓",
		"name": "渐强突弱",
		"ename": "Musical Symbol Crescendo On One Note",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝇔",
		"name": "渐弱突强",
		"ename": "Musical Symbol Decrescendo On One Note",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝇕",
		"name": "踏板记号",
		"ename": "Musical Symbol Pedal Mark",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝇖",
		"name": "释放踏板记号",
		"ename": "Musical Symbol Pedal Up Mark",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝇗",
		"name": "半踏板记号",
		"ename": "Musical Symbol Half Pedal Mark",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝇘",
		"name": "持续音踏板记号",
		"ename": "Musical Symbol Sustenuto Pedal Mark",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝇙",
		"name": "柔音踏板记号",
		"ename": "Musical Symbol Una Corda",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝇚",
		"name": "三弦踏板记号",
		"ename": "Musical Symbol Tre Corde",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝇛",
		"name": "制音器上提",
		"ename": "Musical Symbol With Dampers",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝇜",
		"name": "制音器放下",
		"ename": "Musical Symbol Without Dampers",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝇝",
		"name": "二连音",
		"ename": "Musical Symbol Duplet",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝇞",
		"name": "三连音",
		"ename": "Musical Symbol Triplet",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝇟",
		"name": "四连音",
		"ename": "Musical Symbol Quadruplet",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝇠",
		"name": "五连音",
		"ename": "Musical Symbol Quintuplet",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝇡",
		"name": "六连音",
		"ename": "Musical Symbol Sextuplet",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝇢",
		"name": "七连音",
		"ename": "Musical Symbol Septuplet",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝇣",
		"name": "八连音",
		"ename": "Musical Symbol Octuplet",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝇤",
		"name": "九连音",
		"ename": "Musical Symbol Nonuplet",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝇥",
		"name": "十连音",
		"ename": "Musical Symbol Decuplet",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝇦",
		"name": "十一连音",
		"ename": "Musical Symbol Undecuplet",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝇧",
		"name": "十二连音",
		"ename": "Musical Symbol Duodecuplet",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝇨",
		"name": "十三连音",
		"ename": "Musical Symbol Tredecuplet",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝇩",
		"name": "十四连音",
		"ename": "Musical Symbol Quattuordecuplet",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "𝇪",
		"name": "十五连音",
		"ename": "Musical Symbol Quindecuplet",
		"tags": [
			"音乐"
		]
	},
	{
		"char": "↑",
		"name": "上箭头",
		"ename": "Upwards Arrow",
		"tags": [
			"箭头、方向"
		],
		"alias": [
			"上",
			"向上的箭头",
			"箭头"
		]
	},
	{
		"char": "↓",
		"name": "下箭头",
		"ename": "Downwards Arrow",
		"tags": [
			"箭头、方向"
		],
		"alias": [
			"下",
			"向下的箭头",
			"箭头"
		]
	},
	{
		"char": "←",
		"name": "左箭头",
		"ename": "Leftwards Arrow",
		"tags": [
			"箭头、方向"
		],
		"alias": [
			"向左的箭头",
			"左",
			"箭头"
		]
	},
	{
		"char": "→",
		"name": "右箭头",
		"ename": "Rightwards Arrow",
		"tags": [
			"箭头、方向"
		],
		"alias": [
			"右",
			"向右的箭头",
			"箭头"
		]
	},
	{
		"char": "↖",
		"name": "左上箭头",
		"ename": "North West Arrow",
		"tags": [
			"箭头、方向"
		],
		"alias": [
			"左上",
			"方向",
			"标识",
			"箭头",
			"西北"
		]
	},
	{
		"char": "↗",
		"name": "右上箭头",
		"ename": "North East Arrow",
		"tags": [
			"箭头、方向"
		],
		"alias": [
			"东北",
			"右上",
			"方位",
			"方向",
			"标识",
			"箭头"
		]
	},
	{
		"char": "↘",
		"name": "右下箭头",
		"ename": "South East Arrow",
		"tags": [
			"箭头、方向"
		],
		"alias": [
			"东南",
			"右下",
			"方位",
			"方向",
			"标识",
			"箭头"
		]
	},
	{
		"char": "↙",
		"name": "左下箭头",
		"ename": "South West Arrow",
		"tags": [
			"箭头、方向"
		],
		"alias": [
			"左下",
			"方向",
			"标识",
			"箭头",
			"西南"
		]
	},
	{
		"char": "↔",
		"name": "左右箭头",
		"ename": "Left Right Arrow",
		"tags": [
			"箭头、方向"
		],
		"alias": [
			"左右",
			"箭头"
		]
	},
	{
		"char": "↕",
		"name": "上下箭头",
		"ename": "Up Down Arrow",
		"tags": [
			"箭头、方向"
		],
		"alias": [
			"上下",
			"箭头"
		]
	},
	{
		"char": "⇦",
		"name": "左双箭头",
		"ename": "Leftwards Paired Arrows",
		"tags": [
			"箭头、方向"
		],
		"alias": [
			"向左空心箭头"
		]
	},
	{
		"char": "⇧",
		"name": "上双箭头",
		"ename": "Upwards Paired Arrows",
		"tags": [
			"箭头、方向"
		],
		"alias": [
			"向上空心箭头"
		]
	},
	{
		"char": "⇨",
		"name": "右双箭头",
		"ename": "Rightwards Paired Arrows",
		"tags": [
			"箭头、方向"
		],
		"alias": [
			"向右空心箭头"
		]
	},
	{
		"char": "⇩",
		"name": "下双箭头",
		"ename": "Downwards Paired Arrows",
		"tags": [
			"箭头、方向"
		],
		"alias": [
			"向下空心箭头"
		]
	},
	{
		"char": "⇪",
		"name": "caps lock",
		"ename": "Upwards Arrow From Bar",
		"tags": [
			"箭头、方向"
		],
		"alias": [
			"尾部带杠的向上空心箭头"
		]
	},
	{
		"char": "➔",
		"name": "粗右箭头",
		"ename": "Heavy Rightwards Arrow",
		"tags": [
			"箭头、方向"
		]
	},
	{
		"char": "➘",
		"name": "右下粗箭头",
		"ename": "Heavy South East Arrow",
		"tags": [
			"箭头、方向"
		]
	},
	{
		"char": "➙",
		"name": "右上粗箭头",
		"ename": "Heavy North East Arrow",
		"tags": [
			"箭头、方向"
		]
	},
	{
		"char": "➚",
		"name": "右上粗箭头",
		"ename": "Heavy North East Arrow",
		"tags": [
			"箭头、方向"
		]
	},
	{
		"char": "➛",
		"name": "右箭头",
		"ename": "Rightwards Arrow",
		"tags": [
			"箭头、方向"
		]
	},
	{
		"char": "➜",
		"name": "粗圆头右箭头",
		"ename": "Heavy Round-Tipped Rightwards Arrow",
		"tags": [
			"箭头、方向"
		]
	},
	{
		"char": "➝",
		"name": "三角头右箭头",
		"ename": "Triangle-Headed Rightwards Arrow",
		"tags": [
			"箭头、方向"
		]
	},
	{
		"char": "➞",
		"name": "粗三角头右箭头",
		"ename": "Heavy Triangle-Headed Rightwards Arrow",
		"tags": [
			"箭头、方向"
		]
	},
	{
		"char": "➟",
		"name": "虚线三角头右箭头",
		"ename": "Dashed Triangle-Headed Rightwards Arrow",
		"tags": [
			"箭头、方向"
		]
	},
	{
		"char": "➠",
		"name": "粗虚线三角头右箭头",
		"ename": "Heavy Dashed Triangle-Headed Rightwards Arrow",
		"tags": [
			"箭头、方向"
		]
	},
	{
		"char": "➡",
		"name": "实心三角右箭头",
		"ename": "Solid Rightwards Arrow",
		"tags": [
			"箭头、方向"
		],
		"alias": [
			"东",
			"右",
			"向右箭头",
			"方向",
			"标识",
			"箭头"
		]
	},
	{
		"char": "➢",
		"name": "三维顶灯右箭头",
		"ename": "Three-D Top-Lighted Rightwards Arrowhead",
		"tags": [
			"箭头、方向"
		]
	},
	{
		"char": "➣",
		"name": "三维底灯右箭头",
		"ename": "Three-D Bottom-Lighted Rightwards Arrowhead",
		"tags": [
			"箭头、方向"
		]
	},
	{
		"char": "➤",
		"name": "实心三角",
		"ename": "Solid Rightwards Arrowhead",
		"tags": [
			"箭头、方向"
		]
	},
	{
		"char": "➥",
		"name": "旋转粗右箭头",
		"ename": "Heavy Rightwards Arrow With Tip Downwards",
		"tags": [
			"箭头、方向"
		]
	},
	{
		"char": "➦",
		"name": "圆圈内右箭头",
		"ename": "Rightwards Arrow With Tip Towards Top-Left Corner",
		"tags": [
			"箭头、方向"
		]
	},
	{
		"char": "➧",
		"name": "重黑三角",
		"ename": "Heavy Black Curved Upwards and Rightwards Arrow",
		"tags": [
			"箭头、方向"
		]
	},
	{
		"char": "➨",
		"name": "曲线右箭头",
		"ename": "Right-Side Arc-Ended Arrow",
		"tags": [
			"箭头、方向"
		]
	},
	{
		"char": "➩",
		"name": "曲线粗右箭头",
		"ename": "Heavy Right-Side Arc-Ended Arrow",
		"tags": [
			"箭头、方向"
		]
	},
	{
		"char": "➪",
		"name": "曲线三角头右箭头",
		"ename": "Triangle-Headed Right-Side Arc-Ended Arrow",
		"tags": [
			"箭头、方向"
		]
	},
	{
		"char": "➫",
		"name": "曲线粗三角头右箭头",
		"ename": "Heavy Triangle-Headed Right-Side Arc-Ended Arrow",
		"tags": [
			"箭头、方向"
		]
	},
	{
		"char": "➬",
		"name": "曲线虚线三角头右箭头",
		"ename": "Dashed Triangle-Headed Right-Side Arc-Ended Arrow",
		"tags": [
			"箭头、方向"
		]
	},
	{
		"char": "➭",
		"name": "曲线粗虚线三角头右箭头",
		"ename": "Heavy Dashed Triangle-Headed Right-Side Arc-Ended Arrow",
		"tags": [
			"箭头、方向"
		]
	},
	{
		"char": "➮",
		"name": "波浪线右箭头",
		"ename": "Wave-Lined Rightwards Arrow",
		"tags": [
			"箭头、方向"
		]
	},
	{
		"char": "➯",
		"name": "带垂直笔划的波浪线右箭头",
		"ename": "Wave-Lined Rightwards Arrow With Vertical Stroke",
		"tags": [
			"箭头、方向"
		]
	},
	{
		"char": "➱",
		"name": "右上双箭头",
		"ename": "Rightwards Two-Headed Arrow With Vertical Stroke",
		"tags": [
			"箭头、方向"
		]
	},
	{
		"char": "➲",
		"name": "粗右上双箭头",
		"ename": "Heavy Rightwards Two-Headed Arrow With Vertical Stroke",
		"tags": [
			"箭头、方向"
		]
	},
	{
		"char": "➳",
		"name": "粗右箭头",
		"ename": "Heavy Rightwards Arrow",
		"tags": [
			"箭头、方向"
		]
	},
	{
		"char": "➴",
		"name": "右下箭头",
		"ename": "Heavy South East Arrow",
		"tags": [
			"箭头、方向"
		]
	},
	{
		"char": "➵",
		"name": "粗右箭头",
		"ename": "Heavy Rightwards Arrow",
		"tags": [
			"箭头、方向"
		]
	},
	{
		"char": "➶",
		"name": "右上箭头",
		"ename": "Heavy North East Arrow",
		"tags": [
			"箭头、方向"
		]
	},
	{
		"char": "➷",
		"name": "左下箭头",
		"ename": "Heavy South West Arrow",
		"tags": [
			"箭头、方向"
		]
	},
	{
		"char": "➸",
		"name": "粗右箭头",
		"ename": "Heavy Rightwards Arrow",
		"tags": [
			"箭头、方向"
		]
	},
	{
		"char": "➹",
		"name": "右上箭头",
		"ename": "Heavy North East Arrow",
		"tags": [
			"箭头、方向"
		]
	},
	{
		"char": "➺",
		"name": "粗右箭头",
		"ename": "Heavy Rightwards Arrow",
		"tags": [
			"箭头、方向"
		]
	},
	{
		"char": "➻",
		"name": "右上箭头",
		"ename": "Heavy North East Arrow",
		"tags": [
			"箭头、方向"
		]
	},
	{
		"char": "➼",
		"name": "粗右箭头",
		"ename": "Heavy Rightwards Arrow",
		"tags": [
			"箭头、方向"
		]
	},
	{
		"char": "➽",
		"name": "右上箭头",
		"ename": "Heavy North East Arrow",
		"tags": [
			"箭头、方向"
		]
	},
	{
		"char": "➾",
		"name": "粗右箭头",
		"ename": "Heavy Rightwards Arrow",
		"tags": [
			"箭头、方向"
		]
	},
	{
		"char": "☚",
		"name": "实心左指",
		"ename": "Solid Left Pointing Index",
		"tags": [
			"箭头、方向"
		],
		"alias": [
			"手指",
			"指向"
		]
	},
	{
		"char": "☛",
		"name": "实心右指",
		"ename": "Solid Right Pointing Index",
		"tags": [
			"箭头、方向"
		],
		"alias": [
			"手指",
			"指向"
		]
	},
	{
		"char": "☜",
		"name": "空心左指",
		"ename": "Hollow Left Pointing Index",
		"tags": [
			"箭头、方向"
		],
		"alias": [
			"手指",
			"指向"
		]
	},
	{
		"char": "☝",
		"name": "空心上指",
		"ename": "Hollow Up Pointing Index",
		"tags": [
			"箭头、方向"
		],
		"alias": [
			"手指",
			"指向",
			"向上指",
			"手",
			"指上",
			"食指",
			"食指向上指"
		]
	},
	{
		"char": "☞",
		"name": "空心右指",
		"ename": "Hollow Right Pointing Index",
		"tags": [
			"箭头、方向"
		],
		"alias": [
			"手指",
			"指向"
		]
	},
	{
		"char": "☟",
		"name": "空心下指",
		"ename": "Hollow Down Pointing Index",
		"tags": [
			"箭头、方向"
		],
		"alias": [
			"手指",
			"指向"
		]
	},
	{
		"char": "⚞",
		"name": "右聚三线",
		"ename": "Three Lines Converging Right",
		"tags": [
			"箭头、方向"
		],
		"alias": [
			"汇聚"
		]
	},
	{
		"char": "⚟",
		"name": "左聚三线",
		"ename": "Three Lines Converging Left",
		"tags": [
			"箭头、方向"
		],
		"alias": [
			"汇聚"
		]
	},
	{
		"char": "●",
		"name": "实心子",
		"ename": "SOLID CIRCLE",
		"tags": [
			"围棋"
		],
		"alias": [
			"黑棋",
			"圆",
			"实心圆"
		]
	},
	{
		"char": "○",
		"name": "空心子",
		"ename": "HOLLOW CIRCLE",
		"tags": [
			"围棋"
		],
		"alias": [
			"白棋",
			"圆",
			"环形",
			"空心圆"
		]
	},
	{
		"char": "☆",
		"name": "星位、天元",
		"ename": "WHITE STAR",
		"tags": [
			"围棋"
		]
	},
	{
		"char": "⚆",
		"name": "棋谱·有提子的白子",
		"ename": "White Circle with Dot Right",
		"tags": [
			"围棋"
		],
		"alias": [
			"记谱",
			"白棋"
		]
	},
	{
		"char": "⚇",
		"name": "棋谱·提多子的白子",
		"ename": "White Circle with Two Dots",
		"tags": [
			"围棋"
		],
		"alias": [
			"记谱",
			"白棋",
			"块提"
		]
	},
	{
		"char": "⚈",
		"name": "棋谱·有提子的黑子",
		"ename": "Black Circle with White Dot Right",
		"tags": [
			"围棋"
		],
		"alias": [
			"记谱",
			"黑棋"
		]
	},
	{
		"char": "⚉",
		"name": "棋谱·提多子的黑子",
		"ename": "Black Circle with Two White Dots",
		"tags": [
			"围棋"
		],
		"alias": [
			"记谱",
			"黑棋",
			"块提"
		]
	},
	{
		"char": "⛣",
		"name": "棋谱·提多子的白子",
		"ename": "WHITE CIRCLE WITH DOT RIGHT",
		"tags": [
			"围棋"
		],
		"alias": [
			"记谱",
			"白棋",
			"块提"
		]
	},
	{
		"char": "♔",
		"name": "空心国王",
		"ename": "Hollow Chess King",
		"tags": [
			"国际象棋"
		]
	},
	{
		"char": "♕",
		"name": "空心王后",
		"ename": "Hollow Chess Queen",
		"tags": [
			"国际象棋"
		]
	},
	{
		"char": "♖",
		"name": "空心战车",
		"ename": "Hollow Chess Rook",
		"tags": [
			"国际象棋"
		]
	},
	{
		"char": "♗",
		"name": "空心主教",
		"ename": "Hollow Chess Bishop",
		"tags": [
			"国际象棋"
		]
	},
	{
		"char": "♘",
		"name": "空心骑士",
		"ename": "Hollow Chess Knight",
		"tags": [
			"国际象棋"
		]
	},
	{
		"char": "♙",
		"name": "空心兵",
		"ename": "Hollow Chess Pawn",
		"tags": [
			"国际象棋"
		]
	},
	{
		"char": "♚",
		"name": "实心国王",
		"ename": "Solid Chess King",
		"tags": [
			"国际象棋"
		]
	},
	{
		"char": "♛",
		"name": "实心王后",
		"ename": "Solid Chess Queen",
		"tags": [
			"国际象棋"
		]
	},
	{
		"char": "♜",
		"name": "实心战车",
		"ename": "Solid Chess Rook",
		"tags": [
			"国际象棋"
		]
	},
	{
		"char": "♝",
		"name": "实心主教",
		"ename": "Solid Chess Bishop",
		"tags": [
			"国际象棋"
		]
	},
	{
		"char": "♞",
		"name": "实心骑士",
		"ename": "Solid Chess Knight",
		"tags": [
			"国际象棋"
		]
	},
	{
		"char": "♟",
		"name": "实心兵",
		"ename": "Solid Chess Pawn",
		"tags": [
			"国际象棋"
		],
		"alias": [
			"兵",
			"受骗者",
			"牺牲品"
		]
	},
	{
		"char": "🨀",
		"name": "中性国王",
		"ename": "Neutral Chess King",
		"tags": [
			"国际象棋"
		]
	},
	{
		"char": "🨁",
		"name": "中性王后",
		"ename": "Neutral Chess Queen",
		"tags": [
			"国际象棋"
		]
	},
	{
		"char": "🨂",
		"name": "中性战车",
		"ename": "Neutral Chess Rook",
		"tags": [
			"国际象棋"
		]
	},
	{
		"char": "🨃",
		"name": "中性主教",
		"ename": "Neutral Chess Bishop",
		"tags": [
			"国际象棋"
		]
	},
	{
		"char": "🨄",
		"name": "中性骑士",
		"ename": "Neutral Chess Knight",
		"tags": [
			"国际象棋"
		]
	},
	{
		"char": "🨅",
		"name": "中性兵",
		"ename": "Neutral Chess Pawn",
		"tags": [
			"国际象棋"
		]
	},
	{
		"char": "🨉",
		"name": "向右白国王",
		"ename": "White Chess King Rotated Ninety Degrees",
		"tags": [
			"国际象棋"
		],
		"alias": [
			"90°"
		]
	},
	{
		"char": "🨊",
		"name": "向右白王后",
		"ename": "White Chess Queen Rotated Ninety Degrees",
		"tags": [
			"国际象棋"
		],
		"alias": [
			"90°"
		]
	},
	{
		"char": "🨋",
		"name": "向右白战车",
		"ename": "White Chess Rook Rotated Ninety Degrees",
		"tags": [
			"国际象棋"
		],
		"alias": [
			"90°"
		]
	},
	{
		"char": "🨌",
		"name": "向右白主教",
		"ename": "White Chess Bishop Rotated Ninety Degrees",
		"tags": [
			"国际象棋"
		],
		"alias": [
			"90°"
		]
	},
	{
		"char": "🨍",
		"name": "向右白骑士",
		"ename": "White Chess Knight Rotated Ninety Degrees",
		"tags": [
			"国际象棋"
		],
		"alias": [
			"90°"
		]
	},
	{
		"char": "🨎",
		"name": "向右白兵",
		"ename": "White Chess Pawn Rotated Ninety Degrees",
		"tags": [
			"国际象棋"
		],
		"alias": [
			"90°"
		]
	},
	{
		"char": "🨏",
		"name": "向右黑国王",
		"ename": "Black Chess King Rotated Ninety Degrees",
		"tags": [
			"国际象棋"
		],
		"alias": [
			"90°"
		]
	},
	{
		"char": "🨐",
		"name": "向右黑王后",
		"ename": "Black Chess Queen Rotated Ninety Degrees",
		"tags": [
			"国际象棋"
		],
		"alias": [
			"90°"
		]
	},
	{
		"char": "🨑",
		"name": "向右黑战车",
		"ename": "Black Chess Rook Rotated Ninety Degrees",
		"tags": [
			"国际象棋"
		],
		"alias": [
			"90°"
		]
	},
	{
		"char": "🨒",
		"name": "向右黑主教",
		"ename": "Black Chess Bishop Rotated Ninety Degrees",
		"tags": [
			"国际象棋"
		],
		"alias": [
			"90°"
		]
	},
	{
		"char": "🨓",
		"name": "向右黑骑士",
		"ename": "Black Chess Knight Rotated Ninety Degrees",
		"tags": [
			"国际象棋"
		],
		"alias": [
			"90°"
		]
	},
	{
		"char": "🨔",
		"name": "向右黑兵",
		"ename": "Black Chess Pawn Rotated Ninety Degrees",
		"tags": [
			"国际象棋"
		],
		"alias": [
			"90°"
		]
	},
	{
		"char": "🨕",
		"name": "向右中性国王",
		"ename": "Neutral Chess King Rotated Ninety Degrees",
		"tags": [
			"国际象棋"
		],
		"alias": [
			"90°"
		]
	},
	{
		"char": "🨖",
		"name": "向右中性王后",
		"ename": "Neutral Chess Queen Rotated Ninety Degrees",
		"tags": [
			"国际象棋"
		],
		"alias": [
			"90°"
		]
	},
	{
		"char": "🨗",
		"name": "向右中性战车",
		"ename": "Neutral Chess Rook Rotated Ninety Degrees",
		"tags": [
			"国际象棋"
		],
		"alias": [
			"90°"
		]
	},
	{
		"char": "🨘",
		"name": "向右中性主教",
		"ename": "Neutral Chess Bishop Rotated Ninety Degrees",
		"tags": [
			"国际象棋"
		],
		"alias": [
			"90°"
		]
	},
	{
		"char": "🨙",
		"name": "向右中性骑士",
		"ename": "Neutral Chess Knight Rotated Ninety Degrees",
		"tags": [
			"国际象棋"
		],
		"alias": [
			"90°"
		]
	},
	{
		"char": "🨚",
		"name": "向右中性兵",
		"ename": "Neutral Chess Pawn Rotated Ninety Degrees",
		"tags": [
			"国际象棋"
		],
		"alias": [
			"90°"
		]
	},
	{
		"char": "🨞",
		"name": "倒白国王",
		"ename": "White Chess Turned King",
		"tags": [
			"国际象棋"
		],
		"alias": [
			"镜像",
			"180°"
		]
	},
	{
		"char": "🨟",
		"name": "倒白王后",
		"ename": "White Chess Turned Queen",
		"tags": [
			"国际象棋"
		],
		"alias": [
			"镜像",
			"180°"
		]
	},
	{
		"char": "🨠",
		"name": "倒白战车",
		"ename": "White Chess Turned Rook",
		"tags": [
			"国际象棋"
		],
		"alias": [
			"镜像",
			"180°"
		]
	},
	{
		"char": "🨡",
		"name": "倒白主教",
		"ename": "White Chess Turned Bishop",
		"tags": [
			"国际象棋"
		],
		"alias": [
			"镜像",
			"180°"
		]
	},
	{
		"char": "🨢",
		"name": "倒白骑士",
		"ename": "White Chess Turned Knight",
		"tags": [
			"国际象棋"
		],
		"alias": [
			"镜像",
			"180°"
		]
	},
	{
		"char": "🨣",
		"name": "倒白兵",
		"ename": "White Chess Turned Pawn",
		"tags": [
			"国际象棋"
		],
		"alias": [
			"镜像",
			"180°"
		]
	},
	{
		"char": "🨤",
		"name": "倒黑国王",
		"ename": "Black Chess Turned King",
		"tags": [
			"国际象棋"
		],
		"alias": [
			"镜像",
			"180°"
		]
	},
	{
		"char": "🨥",
		"name": "倒黑王后",
		"ename": "Black Chess Turned Queen",
		"tags": [
			"国际象棋"
		],
		"alias": [
			"镜像",
			"180°"
		]
	},
	{
		"char": "🨦",
		"name": "倒黑战车",
		"ename": "Black Chess Turned Rook",
		"tags": [
			"国际象棋"
		],
		"alias": [
			"镜像",
			"180°"
		]
	},
	{
		"char": "🨧",
		"name": "倒黑主教",
		"ename": "Black Chess Turned Bishop",
		"tags": [
			"国际象棋"
		],
		"alias": [
			"镜像",
			"180°"
		]
	},
	{
		"char": "🨨",
		"name": "倒黑骑士",
		"ename": "Black Chess Turned Knight",
		"tags": [
			"国际象棋"
		],
		"alias": [
			"镜像",
			"180°"
		]
	},
	{
		"char": "🨩",
		"name": "倒黑兵",
		"ename": "Black Chess Turned Pawn",
		"tags": [
			"国际象棋"
		],
		"alias": [
			"镜像",
			"180°"
		]
	},
	{
		"char": "🨪",
		"name": "倒中性国王",
		"ename": "Neutral Chess Turned King",
		"tags": [
			"国际象棋"
		],
		"alias": [
			"镜像",
			"180°"
		]
	},
	{
		"char": "🨫",
		"name": "倒中性王后",
		"ename": "Neutral Chess Turned Queen",
		"tags": [
			"国际象棋"
		],
		"alias": [
			"镜像",
			"180°"
		]
	},
	{
		"char": "🨬",
		"name": "倒中性战车",
		"ename": "Neutral Chess Turned Rook",
		"tags": [
			"国际象棋"
		],
		"alias": [
			"镜像",
			"180°"
		]
	},
	{
		"char": "🨭",
		"name": "倒中性主教",
		"ename": "Neutral Chess Turned Bishop",
		"tags": [
			"国际象棋"
		],
		"alias": [
			"镜像",
			"180°"
		]
	},
	{
		"char": "🨮",
		"name": "倒中性骑士",
		"ename": "Neutral Chess Turned Knight",
		"tags": [
			"国际象棋"
		],
		"alias": [
			"镜像",
			"180°"
		]
	},
	{
		"char": "🨯",
		"name": "倒中性兵",
		"ename": "Neutral Chess Turned Pawn",
		"tags": [
			"国际象棋"
		],
		"alias": [
			"镜像",
			"180°"
		]
	},
	{
		"char": "🨳",
		"name": "向左白国王",
		"ename": "White Chess King Rotated Two Hundred Seventy Degrees",
		"tags": [
			"国际象棋"
		],
		"alias": [
			"270°"
		]
	},
	{
		"char": "🨴",
		"name": "向左白王后",
		"ename": "White Chess Queen Rotated Two Hundred Seventy Degrees",
		"tags": [
			"国际象棋"
		],
		"alias": [
			"270°"
		]
	},
	{
		"char": "🨵",
		"name": "向左白战车",
		"ename": "White Chess Rook Rotated Two Hundred Seventy Degrees",
		"tags": [
			"国际象棋"
		],
		"alias": [
			"270°"
		]
	},
	{
		"char": "🨶",
		"name": "向左白主教",
		"ename": "White Chess Bishop Rotated Two Hundred Seventy Degrees",
		"tags": [
			"国际象棋"
		],
		"alias": [
			"270°"
		]
	},
	{
		"char": "🨷",
		"name": "向左白骑士",
		"ename": "White Chess Knight Rotated Two Hundred Seventy Degrees",
		"tags": [
			"国际象棋"
		],
		"alias": [
			"270°"
		]
	},
	{
		"char": "🨸",
		"name": "向左白兵",
		"ename": "White Chess Pawn Rotated Two Hundred Seventy Degrees",
		"tags": [
			"国际象棋"
		],
		"alias": [
			"270°"
		]
	},
	{
		"char": "🨹",
		"name": "向左黑国王",
		"ename": "Black Chess King Rotated Two Hundred Seventy Degrees",
		"tags": [
			"国际象棋"
		],
		"alias": [
			"270°"
		]
	},
	{
		"char": "🨺",
		"name": "向左黑王后",
		"ename": "Black Chess Queen Rotated Two Hundred Seventy Degrees",
		"tags": [
			"国际象棋"
		],
		"alias": [
			"270°"
		]
	},
	{
		"char": "🨻",
		"name": "向左黑战车",
		"ename": "Black Chess Rook Rotated Two Hundred Seventy Degrees",
		"tags": [
			"国际象棋"
		],
		"alias": [
			"270°"
		]
	},
	{
		"char": "🨼",
		"name": "向左黑主教",
		"ename": "Black Chess Bishop Rotated Two Hundred Seventy Degrees",
		"tags": [
			"国际象棋"
		],
		"alias": [
			"270°"
		]
	},
	{
		"char": "🨽",
		"name": "向左黑骑士",
		"ename": "Black Chess Knight Rotated Two Hundred Seventy Degrees",
		"tags": [
			"国际象棋"
		],
		"alias": [
			"270°"
		]
	},
	{
		"char": "🨾",
		"name": "向左黑兵",
		"ename": "Black Chess Pawn Rotated Two Hundred Seventy Degrees",
		"tags": [
			"国际象棋"
		],
		"alias": [
			"270°"
		]
	},
	{
		"char": "🨿",
		"name": "向左中性国王",
		"ename": "Neutral Chess King Rotated Two Hundred Seventy Degrees",
		"tags": [
			"国际象棋"
		],
		"alias": [
			"270°"
		]
	},
	{
		"char": "🩀",
		"name": "向左中性王后",
		"ename": "Neutral Chess Queen Rotated Two Hundred Seventy Degrees",
		"tags": [
			"国际象棋"
		],
		"alias": [
			"270°"
		]
	},
	{
		"char": "🩁",
		"name": "向左中性战车",
		"ename": "Neutral Chess Rook Rotated Two Hundred Seventy Degrees",
		"tags": [
			"国际象棋"
		],
		"alias": [
			"270°"
		]
	},
	{
		"char": "🩂",
		"name": "向左中性主教",
		"ename": "Neutral Chess Bishop Rotated Two Hundred Seventy Degrees",
		"tags": [
			"国际象棋"
		],
		"alias": [
			"270°"
		]
	},
	{
		"char": "🩃",
		"name": "向左中性骑士",
		"ename": "Neutral Chess Knight Rotated Two Hundred Seventy Degrees",
		"tags": [
			"国际象棋"
		],
		"alias": [
			"270°"
		]
	},
	{
		"char": "🩄",
		"name": "向左中性兵",
		"ename": "Neutral Chess Pawn Rotated Two Hundred Seventy Degrees",
		"tags": [
			"国际象棋"
		],
		"alias": [
			"270°"
		]
	},
	{
		"char": "🨆",
		"name": "向右上白骑士",
		"ename": "White Chess Knight Rotated Forty-Five Degrees",
		"tags": [
			"国际象棋"
		],
		"alias": [
			"45°"
		]
	},
	{
		"char": "🨇",
		"name": "向右上黑骑士",
		"ename": "Black Chess Knight Rotated Forty-Five Degrees",
		"tags": [
			"国际象棋"
		],
		"alias": [
			"45°"
		]
	},
	{
		"char": "🨈",
		"name": "向右上中性骑士",
		"ename": "Neutral Chess Knight Rotated Forty-Five Degrees",
		"tags": [
			"国际象棋"
		],
		"alias": [
			"45°"
		]
	},
	{
		"char": "🨛",
		"name": "向右下白骑士",
		"ename": "White Chess Knight Rotated One Hundred Thirty-Five Degrees",
		"tags": [
			"国际象棋"
		],
		"alias": [
			"135°"
		]
	},
	{
		"char": "🨜",
		"name": "向右下黑骑士",
		"ename": "Black Chess Knight Rotated One Hundred Thirty-Five Degrees",
		"tags": [
			"国际象棋"
		],
		"alias": [
			"135°"
		]
	},
	{
		"char": "🨝",
		"name": "向右下中性骑士",
		"ename": "Neutral Chess Knight Rotated One Hundred Thirty-Five Degrees",
		"tags": [
			"国际象棋"
		],
		"alias": [
			"135°"
		]
	},
	{
		"char": "🨰",
		"name": "向左下白骑士",
		"ename": "White Chess Knight Rotated Two Hundred Twenty-Five Degrees",
		"tags": [
			"国际象棋"
		],
		"alias": [
			"225°"
		]
	},
	{
		"char": "🨱",
		"name": "向左下黑骑士",
		"ename": "Black Chess Knight Rotated Two Hundred Twenty-Five Degrees",
		"tags": [
			"国际象棋"
		],
		"alias": [
			"225°"
		]
	},
	{
		"char": "🨲",
		"name": "向左下中性骑士",
		"ename": "Neutral Chess Knight Rotated Two Hundred Twenty-Five Degrees",
		"tags": [
			"国际象棋"
		],
		"alias": [
			"225°"
		]
	},
	{
		"char": "🩅",
		"name": "向左上白骑士",
		"ename": "White Chess Knight Rotated Three Hundred Fifteen Degrees",
		"tags": [
			"国际象棋"
		],
		"alias": [
			"315°"
		]
	},
	{
		"char": "🩆",
		"name": "向左上黑骑士",
		"ename": "Black Chess Knight Rotated Three Hundred Fifteen Degrees",
		"tags": [
			"国际象棋"
		],
		"alias": [
			"315°"
		]
	},
	{
		"char": "🩇",
		"name": "向左上中性骑士",
		"ename": "Neutral Chess Knight Rotated Three Hundred Fifteen Degrees",
		"tags": [
			"国际象棋"
		],
		"alias": [
			"315°"
		]
	},
	{
		"char": "🩈",
		"name": "空心等跳马",
		"ename": "Hollow Chess Equihopper",
		"tags": [
			"国际象棋"
		]
	},
	{
		"char": "🩉",
		"name": "实心等跳马",
		"ename": "Solid Chess Equihopper",
		"tags": [
			"国际象棋"
		]
	},
	{
		"char": "🩊",
		"name": "中性等跳马",
		"ename": "Neutral Chess Equihopper",
		"tags": [
			"国际象棋"
		]
	},
	{
		"char": "🩋",
		"name": "空心等跳马旋转90°",
		"ename": "Hollow Chess Equihopper Rotated Ninety Degrees",
		"tags": [
			"国际象棋"
		]
	},
	{
		"char": "🩌",
		"name": "实心等跳马旋转90°",
		"ename": "Solid Chess Equihopper Rotated Ninety Degrees",
		"tags": [
			"国际象棋"
		]
	},
	{
		"char": "🩍",
		"name": "中性等跳马旋转90°",
		"ename": "Neutral Chess Equihopper Rotated Ninety Degrees",
		"tags": [
			"国际象棋"
		]
	},
	{
		"char": "🩎",
		"name": "空心骑士王后",
		"ename": "Hollow Chess Knight-Queen",
		"tags": [
			"国际象棋"
		]
	},
	{
		"char": "🩏",
		"name": "空心骑士战车",
		"ename": "Hollow Chess Knight-Rook",
		"tags": [
			"国际象棋"
		]
	},
	{
		"char": "🩐",
		"name": "空心骑士主教",
		"ename": "Hollow Chess Knight-Bishop",
		"tags": [
			"国际象棋"
		]
	},
	{
		"char": "🩑",
		"name": "实心骑士王后",
		"ename": "Solid Chess Knight-Queen",
		"tags": [
			"国际象棋"
		]
	},
	{
		"char": "🩒",
		"name": "实心骑士战车",
		"ename": "Solid Chess Knight-Rook",
		"tags": [
			"国际象棋"
		]
	},
	{
		"char": "🩓",
		"name": "实心骑士主教",
		"ename": "Solid Chess Knight-Bishop",
		"tags": [
			"国际象棋"
		]
	},
	{
		"char": "🩠",
		"name": "红帅",
		"ename": "Xiangqi Red General",
		"tags": [
			"中国象棋"
		]
	},
	{
		"char": "🩡",
		"name": "红仕",
		"ename": "Xiangqi Red Mandarin",
		"tags": [
			"中国象棋"
		]
	},
	{
		"char": "🩢",
		"name": "红相",
		"ename": "Xiangqi Red Elephant",
		"tags": [
			"中国象棋"
		]
	},
	{
		"char": "🩣",
		"name": "红马",
		"ename": "Xiangqi Red Horse",
		"tags": [
			"中国象棋"
		]
	},
	{
		"char": "🩤",
		"name": "红车",
		"ename": "Xiangqi Red Chariot",
		"tags": [
			"中国象棋"
		]
	},
	{
		"char": "🩥",
		"name": "红炮",
		"ename": "Xiangqi Red Cannon",
		"tags": [
			"中国象棋"
		]
	},
	{
		"char": "🩦",
		"name": "红兵",
		"ename": "Xiangqi Red Soldier",
		"tags": [
			"中国象棋"
		]
	},
	{
		"char": "🩧",
		"name": "黑将",
		"ename": "Xiangqi Black General",
		"tags": [
			"中国象棋"
		]
	},
	{
		"char": "🩨",
		"name": "黑士",
		"ename": "Xiangqi Black Mandarin",
		"tags": [
			"中国象棋"
		]
	},
	{
		"char": "🩩",
		"name": "黑象",
		"ename": "Xiangqi Black Elephant",
		"tags": [
			"中国象棋"
		]
	},
	{
		"char": "🩪",
		"name": "黑马",
		"ename": "Xiangqi Black Horse",
		"tags": [
			"中国象棋"
		]
	},
	{
		"char": "🩫",
		"name": "黑车",
		"ename": "Xiangqi Black Chariot",
		"tags": [
			"中国象棋"
		]
	},
	{
		"char": "🩬",
		"name": "黑炮",
		"ename": "Xiangqi Black Cannon",
		"tags": [
			"中国象棋"
		]
	},
	{
		"char": "🩭",
		"name": "黑卒",
		"ename": "Xiangqi Black Soldier",
		"tags": [
			"中国象棋"
		]
	},
	{
		"char": "🂡",
		"name": "黑桃A",
		"ename": "Playing Card Ace of Spades",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "🂢",
		"name": "黑桃2",
		"ename": "Playing Card Two of Spades",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "🂣",
		"name": "黑桃3",
		"ename": "Playing Card Three of Spades",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "🂤",
		"name": "黑桃4",
		"ename": "Playing Card Four of Spades",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "🂥",
		"name": "黑桃5",
		"ename": "Playing Card Five of Spades",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "🂦",
		"name": "黑桃6",
		"ename": "Playing Card Six of Spades",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "🂧",
		"name": "黑桃7",
		"ename": "Playing Card Seven of Spades",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "🂨",
		"name": "黑桃8",
		"ename": "Playing Card Eight of Spades",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "🂩",
		"name": "黑桃9",
		"ename": "Playing Card Nine of Spades",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "🂪",
		"name": "黑桃10",
		"ename": "Playing Card Ten of Spades",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "🂫",
		"name": "黑桃J",
		"ename": "Playing Card Jack of Spades",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "🂭",
		"name": "黑桃Q",
		"ename": "Playing Card Queen of Spades",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "🂮",
		"name": "黑桃K",
		"ename": "Playing Card King of Spades",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "🂬",
		"name": "黑桃骑士",
		"ename": "Playing Card Knight of Spades",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "🂱",
		"name": "红心A/红桃A",
		"ename": "Playing Card Ace of Hearts",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "🂲",
		"name": "红心2/红桃2",
		"ename": "Playing Card Two of Hearts",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "🂳",
		"name": "红心3/红桃3",
		"ename": "Playing Card Three of Hearts",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "🂴",
		"name": "红心4/红桃4",
		"ename": "Playing Card Four of Hearts",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "🂵",
		"name": "红心5/红桃5",
		"ename": "Playing Card Five of Hearts",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "🂶",
		"name": "红心6/红桃6",
		"ename": "Playing Card Six of Hearts",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "🂷",
		"name": "红心7/红桃7",
		"ename": "Playing Card Seven of Hearts",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "🂸",
		"name": "红心8/红桃8",
		"ename": "Playing Card Eight of Hearts",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "🂹",
		"name": "红心9/红桃9",
		"ename": "Playing Card Nine of Hearts",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "🂺",
		"name": "红心10/红桃10",
		"ename": "Playing Card Ten of Hearts",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "🂻",
		"name": "红心J/红桃J",
		"ename": "Playing Card Jack of Hearts",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "🂽",
		"name": "红心Q/红桃Q",
		"ename": "Playing Card Queen of Hearts",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "🂾",
		"name": "红心K/红桃K",
		"ename": "Playing Card King of Hearts",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "🂼",
		"name": "红心骑士/红桃骑士",
		"ename": "Playing Card Knight of Hearts",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "🃑",
		"name": "梅花A/草花A",
		"ename": "Playing Card Ace of Clubs",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "🃒",
		"name": "梅花2/草花2",
		"ename": "Playing Card Two of Clubs",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "🃓",
		"name": "梅花3/草花3",
		"ename": "Playing Card Three of Clubs",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "🃔",
		"name": "梅花4/草花4",
		"ename": "Playing Card Four of Clubs",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "🃕",
		"name": "梅花5/草花5",
		"ename": "Playing Card Five of Clubs",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "🃖",
		"name": "梅花6/草花6",
		"ename": "Playing Card Six of Clubs",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "🃗",
		"name": "梅花7/草花7",
		"ename": "Playing Card Seven of Clubs",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "🃘",
		"name": "梅花8/草花8",
		"ename": "Playing Card Eight of Clubs",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "🃙",
		"name": "梅花9/草花9",
		"ename": "Playing Card Nine of Clubs",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "🃚",
		"name": "梅花10/草花10",
		"ename": "Playing Card Ten of Clubs",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "🃛",
		"name": "梅花J/草花J",
		"ename": "Playing Card Jack of Clubs",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "🃝",
		"name": "梅花Q/草花Q",
		"ename": "Playing Card Queen of Clubs",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "🃞",
		"name": "梅花K/草花K",
		"ename": "Playing Card King of Clubs",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "🃜",
		"name": "梅花骑士/草花骑士",
		"ename": "Playing Card Knight of Clubs",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "🃁",
		"name": "方块A/方片A",
		"ename": "Playing Card Ace of Diamonds",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "🃂",
		"name": "方块2/方片2",
		"ename": "Playing Card Two of Diamonds",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "🃃",
		"name": "方块3/方片3",
		"ename": "Playing Card Three of Diamonds",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "🃄",
		"name": "方块4/方片4",
		"ename": "Playing Card Four of Diamonds",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "🃅",
		"name": "方块5/方片5",
		"ename": "Playing Card Five of Diamonds",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "🃆",
		"name": "方块6/方片6",
		"ename": "Playing Card Six of Diamonds",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "🃇",
		"name": "方块7/方片7",
		"ename": "Playing Card Seven of Diamonds",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "🃈",
		"name": "方块8/方片8",
		"ename": "Playing Card Eight of Diamonds",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "🃉",
		"name": "方块9/方片9",
		"ename": "Playing Card Nine of Diamonds",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "🃊",
		"name": "方块10/方片10",
		"ename": "Playing Card Ten of Diamonds",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "🃋",
		"name": "方块J/方片J",
		"ename": "Playing Card Jack of Diamonds",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "🃍",
		"name": "方块Q/方片Q",
		"ename": "Playing Card Queen of Diamonds",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "🃎",
		"name": "方块K/方片K",
		"ename": "Playing Card King of Diamonds",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "🃌",
		"name": "方块骑士/方片骑士",
		"ename": "Playing Card Knight of Diamonds",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "🃏",
		"name": "实心小丑/大王/大鬼",
		"ename": "Playing Card Solid Joker",
		"tags": [
			"扑克牌"
		],
		"alias": [
			"百搭",
			"鬼牌",
			"王牌",
			"大小王",
			"大王",
			"小丑",
			"小王",
			"扑克",
			"扑克小丑",
			"牌",
			"百搭牌"
		]
	},
	{
		"char": "🃟",
		"name": "空心小丑/小王/小鬼",
		"ename": "Playing Card Hollow Joker",
		"tags": [
			"扑克牌"
		],
		"alias": [
			"百搭",
			"鬼牌",
			"王牌"
		]
	},
	{
		"char": "🂿",
		"name": "红小丑/骑士/第三王",
		"ename": "Playing Card Red Joker(used as the third joker)",
		"tags": [
			"扑克牌"
		],
		"alias": [
			"百搭",
			"鬼牌",
			"王牌"
		]
	},
	{
		"char": "♠",
		"name": "实心桃",
		"ename": "Solid Spade Suit",
		"tags": [
			"扑克牌"
		],
		"alias": [
			"扑克",
			"牌",
			"葵扇",
			"黑桃",
			"黑桃花色"
		]
	},
	{
		"char": "♡",
		"name": "红心",
		"ename": "White Heart Suit",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "♢",
		"name": "方块",
		"ename": "White Diamond Suit",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "♣",
		"name": "梅花",
		"ename": "Black Club Suit",
		"tags": [
			"扑克牌"
		],
		"alias": [
			"扑克",
			"梅花花色",
			"牌",
			"草花"
		]
	},
	{
		"char": "♤",
		"name": "反色黑桃",
		"ename": "White Spade Suit",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "♥",
		"name": "反色红心",
		"ename": "Red Heart Suit",
		"tags": [
			"扑克牌"
		],
		"alias": [
			"扑克",
			"牌",
			"红心",
			"红桃",
			"红桃花色"
		]
	},
	{
		"char": "♧",
		"name": "反色梅花",
		"ename": "White Club Suit",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "♦",
		"name": "反色方块",
		"ename": "Red Diamond Suit",
		"tags": [
			"扑克牌"
		],
		"alias": [
			"扑克",
			"方块",
			"方片",
			"牌",
			"牌局"
		]
	},
	{
		"char": "🂠",
		"name": "牌背",
		"ename": "PLAYING CARD FOOL",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "🃠",
		"name": "傻瓜",
		"ename": "PLAYING CARD FOOL",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "🃡",
		"name": "个人",
		"ename": "PLAYING CARD TRUMP-01 individual",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "🃵",
		"name": "集体",
		"ename": "Playing Card Back 21 collective",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "🃢",
		"name": "童年",
		"ename": "PLAYING CARD TRUMP-02 childhood",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "🃣",
		"name": "少年",
		"ename": "PLAYING CARD TRUMP-03 youth",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "🃤",
		"name": "成年",
		"ename": "PLAYING CARD TRUMP-04 maturity",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "🃥",
		"name": "老年",
		"ename": "PLAYING CARD TRUMP-05 old age",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "🃦",
		"name": "早上",
		"ename": "PLAYING CARD TRUMP-06 morning",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "🃧",
		"name": "下午",
		"ename": "PLAYING CARD TRUMP-07 afternoon",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "🃨",
		"name": "晚上",
		"ename": "PLAYING CARD TRUMP-08 evening",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "🃩",
		"name": "夜晚",
		"ename": "PLAYING CARD TRUMP-09 night",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "🃪",
		"name": "土风（四元素之二）",
		"ename": "PLAYING CARD TRUMP-10 earth and air",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "🃫",
		"name": "水火（四元素之二）",
		"ename": "PLAYING CARD TRUMP-11 water and fire",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "🃬",
		"name": "跳舞",
		"ename": "PLAYING CARD TRUMP-12 dance",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "🃭",
		"name": "购物",
		"ename": "PLAYING CARD TRUMP-13 shopping",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "🃮",
		"name": "户外",
		"ename": "PLAYING CARD TRUMP-14 open air",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "🃯",
		"name": "视觉艺术",
		"ename": "PLAYING CARD TRUMP-15 visual arts",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "🃰",
		"name": "春",
		"ename": "PLAYING CARD TRUMP-16 spring",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "🃱",
		"name": "夏",
		"ename": "PLAYING CARD TRUMP-17 summer",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "🃲",
		"name": "秋",
		"ename": "PLAYING CARD TRUMP-18 autumn",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "🃳",
		"name": "冬",
		"ename": "PLAYING CARD TRUMP-19 winter",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "🃴",
		"name": "牌局",
		"ename": "Playing Card Back 20 the game",
		"tags": [
			"扑克牌"
		]
	},
	{
		"char": "🀀",
		"name": "东风",
		"ename": "Mahjong Tile East Wind",
		"tags": [
			"麻将"
		]
	},
	{
		"char": "🀁",
		"name": "南风",
		"ename": "Mahjong Tile South Wind",
		"tags": [
			"麻将"
		]
	},
	{
		"char": "🀂",
		"name": "西风",
		"ename": "Mahjong Tile West Wind",
		"tags": [
			"麻将"
		]
	},
	{
		"char": "🀃",
		"name": "北风",
		"ename": "Mahjong Tile North Wind",
		"tags": [
			"麻将"
		]
	},
	{
		"char": "🀄",
		"name": "红中",
		"ename": "Mahjong Tile Red Dragon",
		"tags": [
			"麻将"
		],
		"alias": [
			"方城之战",
			"牌局",
			"麻将红中"
		]
	},
	{
		"char": "🀅",
		"name": "发财",
		"ename": "Mahjong Tile Green Dragon",
		"tags": [
			"麻将"
		]
	},
	{
		"char": "🀆",
		"name": "白板",
		"ename": "Mahjong Tile White Dragon",
		"tags": [
			"麻将"
		]
	},
	{
		"char": "🀇",
		"name": "一万",
		"ename": "Mahjong Tile One of Characters",
		"tags": [
			"麻将"
		]
	},
	{
		"char": "🀈",
		"name": "二万",
		"ename": "Mahjong Tile Two of Characters",
		"tags": [
			"麻将"
		]
	},
	{
		"char": "🀉",
		"name": "三万",
		"ename": "Mahjong Tile Three of Characters",
		"tags": [
			"麻将"
		]
	},
	{
		"char": "🀊",
		"name": "四万",
		"ename": "Mahjong Tile Four of Characters",
		"tags": [
			"麻将"
		]
	},
	{
		"char": "🀋",
		"name": "五万",
		"ename": "Mahjong Tile Five of Characters",
		"tags": [
			"麻将"
		]
	},
	{
		"char": "🀌",
		"name": "六万",
		"ename": "Mahjong Tile Six of Characters",
		"tags": [
			"麻将"
		]
	},
	{
		"char": "🀍",
		"name": "七万",
		"ename": "Mahjong Tile Seven of Characters",
		"tags": [
			"麻将"
		]
	},
	{
		"char": "🀎",
		"name": "八万",
		"ename": "Mahjong Tile Eight of Characters",
		"tags": [
			"麻将"
		]
	},
	{
		"char": "🀏",
		"name": "九万",
		"ename": "Mahjong Tile Nine of Characters",
		"tags": [
			"麻将"
		]
	},
	{
		"char": "🀐",
		"name": "一索",
		"ename": "Mahjong Tile One of Bamboos",
		"tags": [
			"麻将"
		],
		"alias": [
			"一条",
			"麻雀"
		]
	},
	{
		"char": "🀑",
		"name": "二索",
		"ename": "Mahjong Tile Two of Bamboos",
		"tags": [
			"麻将"
		],
		"alias": [
			"二条"
		]
	},
	{
		"char": "🀒",
		"name": "三索",
		"ename": "Mahjong Tile Three of Bamboos",
		"tags": [
			"麻将"
		],
		"alias": [
			"三条"
		]
	},
	{
		"char": "🀓",
		"name": "四索",
		"ename": "Mahjong Tile Four of Bamboos",
		"tags": [
			"麻将"
		],
		"alias": [
			"四条"
		]
	},
	{
		"char": "🀔",
		"name": "五索",
		"ename": "Mahjong Tile Five of Bamboos",
		"tags": [
			"麻将"
		],
		"alias": [
			"五条"
		]
	},
	{
		"char": "🀕",
		"name": "六索",
		"ename": "Mahjong Tile Six of Bamboos",
		"tags": [
			"麻将"
		],
		"alias": [
			"六条"
		]
	},
	{
		"char": "🀖",
		"name": "七索",
		"ename": "Mahjong Tile Seven of Bamboos",
		"tags": [
			"麻将"
		],
		"alias": [
			"七条"
		]
	},
	{
		"char": "🀗",
		"name": "八索",
		"ename": "Mahjong Tile Eight of Bamboos",
		"tags": [
			"麻将"
		],
		"alias": [
			"八条"
		]
	},
	{
		"char": "🀘",
		"name": "九索",
		"ename": "Mahjong Tile Nine of Bamboos",
		"tags": [
			"麻将"
		],
		"alias": [
			"九条"
		]
	},
	{
		"char": "🀙",
		"name": "一筒",
		"ename": "Mahjong Tile One of Circles",
		"tags": [
			"麻将"
		],
		"alias": [
			"一饼"
		]
	},
	{
		"char": "🀚",
		"name": "二筒",
		"ename": "Mahjong Tile Two of Circles",
		"tags": [
			"麻将"
		],
		"alias": [
			"二饼"
		]
	},
	{
		"char": "🀛",
		"name": "三筒",
		"ename": "Mahjong Tile Three of Circles",
		"tags": [
			"麻将"
		],
		"alias": [
			"三饼"
		]
	},
	{
		"char": "🀜",
		"name": "四筒",
		"ename": "Mahjong Tile Four of Circles",
		"tags": [
			"麻将"
		],
		"alias": [
			"四饼"
		]
	},
	{
		"char": "🀝",
		"name": "五筒",
		"ename": "Mahjong Tile Five of Circles",
		"tags": [
			"麻将"
		],
		"alias": [
			"五饼"
		]
	},
	{
		"char": "🀞",
		"name": "六筒",
		"ename": "Mahjong Tile Six of Circles",
		"tags": [
			"麻将"
		],
		"alias": [
			"六饼"
		]
	},
	{
		"char": "🀟",
		"name": "七筒",
		"ename": "Mahjong Tile Seven of Circles",
		"tags": [
			"麻将"
		],
		"alias": [
			"七饼"
		]
	},
	{
		"char": "🀠",
		"name": "八筒",
		"ename": "Mahjong Tile Eight of Circles",
		"tags": [
			"麻将"
		],
		"alias": [
			"八饼"
		]
	},
	{
		"char": "🀡",
		"name": "九筒",
		"ename": "Mahjong Tile Nine of Circles",
		"tags": [
			"麻将"
		],
		"alias": [
			"九饼"
		]
	},
	{
		"char": "🀦",
		"name": "梅",
		"ename": "Mahjong Tile Plum",
		"tags": [
			"麻将"
		]
	},
	{
		"char": "🀧",
		"name": "兰",
		"ename": "Mahjong Tile Orchid",
		"tags": [
			"麻将"
		]
	},
	{
		"char": "🀨",
		"name": "竹",
		"ename": "Mahjong Tile Bamboo",
		"tags": [
			"麻将"
		]
	},
	{
		"char": "🀩",
		"name": "菊",
		"ename": "Mahjong Tile Chrysanthemum",
		"tags": [
			"麻将"
		]
	},
	{
		"char": "🀢",
		"name": "春",
		"ename": "Mahjong Tile Spring",
		"tags": [
			"麻将"
		]
	},
	{
		"char": "🀣",
		"name": "夏",
		"ename": "Mahjong Tile Summer",
		"tags": [
			"麻将"
		]
	},
	{
		"char": "🀤",
		"name": "秋",
		"ename": "Mahjong Tile Autumn",
		"tags": [
			"麻将"
		]
	},
	{
		"char": "🀥",
		"name": "冬",
		"ename": "Mahjong Tile Winter",
		"tags": [
			"麻将"
		]
	},
	{
		"char": "🀪",
		"name": "百搭",
		"ename": "Mahjong Tile Joker",
		"tags": [
			"麻将"
		]
	},
	{
		"char": "🀫",
		"name": "背面",
		"ename": "Mahjong Tile Back",
		"tags": [
			"麻将"
		]
	},
	{
		"char": "⚀",
		"name": "1点",
		"ename": "Die Face-1",
		"tags": [
			"骰子/色子"
		]
	},
	{
		"char": "⚁",
		"name": "2点",
		"ename": "Die Face-2",
		"tags": [
			"骰子/色子"
		]
	},
	{
		"char": "⚂",
		"name": "3点",
		"ename": "Die Face-3",
		"tags": [
			"骰子/色子"
		]
	},
	{
		"char": "⚃",
		"name": "4点",
		"ename": "Die Face-4",
		"tags": [
			"骰子/色子"
		]
	},
	{
		"char": "⚄",
		"name": "5点",
		"ename": "Die Face-5",
		"tags": [
			"骰子/色子"
		]
	},
	{
		"char": "⚅",
		"name": "6点",
		"ename": "Die Face-6",
		"tags": [
			"骰子/色子"
		]
	},
	{
		"char": "🀰",
		"name": "水平骨牌背面",
		"ename": "DOMINO TILE HORIZONTAL BACK",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🀱",
		"name": "水平骨牌 0-0",
		"ename": "DOMINO TILE HORIZONTAL-00-00",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🀲",
		"name": "水平骨牌 0-1",
		"ename": "DOMINO TILE HORIZONTAL-00-01",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🀳",
		"name": "水平骨牌 0-2",
		"ename": "DOMINO TILE HORIZONTAL-00-02",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🀴",
		"name": "水平骨牌 0-3",
		"ename": "DOMINO TILE HORIZONTAL-00-03",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🀵",
		"name": "水平骨牌 0-4",
		"ename": "DOMINO TILE HORIZONTAL-00-04",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🀶",
		"name": "水平骨牌 0-5",
		"ename": "DOMINO TILE HORIZONTAL-00-05",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🀷",
		"name": "水平骨牌 0-6",
		"ename": "DOMINO TILE HORIZONTAL-00-06",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🀸",
		"name": "水平骨牌 1-0",
		"ename": "DOMINO TILE HORIZONTAL-01-00",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🀹",
		"name": "水平骨牌 1-1",
		"ename": "DOMINO TILE HORIZONTAL-01-01",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🀺",
		"name": "水平骨牌 1-2",
		"ename": "DOMINO TILE HORIZONTAL-01-02",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🀻",
		"name": "水平骨牌 1-3",
		"ename": "DOMINO TILE HORIZONTAL-01-03",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🀼",
		"name": "水平骨牌 1-4",
		"ename": "DOMINO TILE HORIZONTAL-01-04",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🀽",
		"name": "水平骨牌 1-5",
		"ename": "DOMINO TILE HORIZONTAL-01-05",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🀾",
		"name": "水平骨牌 1-6",
		"ename": "DOMINO TILE HORIZONTAL-01-06",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🀿",
		"name": "水平骨牌 2-0",
		"ename": "DOMINO TILE HORIZONTAL-02-00",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🁀",
		"name": "水平骨牌 2-1",
		"ename": "DOMINO TILE HORIZONTAL-02-01",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🁁",
		"name": "水平骨牌 2-2",
		"ename": "DOMINO TILE HORIZONTAL-02-02",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🁂",
		"name": "水平骨牌 2-3",
		"ename": "DOMINO TILE HORIZONTAL-02-03",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🁃",
		"name": "水平骨牌 2-4",
		"ename": "DOMINO TILE HORIZONTAL-02-04",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🁄",
		"name": "水平骨牌 2-5",
		"ename": "DOMINO TILE HORIZONTAL-02-05",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🁅",
		"name": "水平骨牌 2-6",
		"ename": "DOMINO TILE HORIZONTAL-02-06",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🁆",
		"name": "水平骨牌 3-0",
		"ename": "DOMINO TILE HORIZONTAL-03-00",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🁇",
		"name": "水平骨牌 3-1",
		"ename": "DOMINO TILE HORIZONTAL-03-01",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🁈",
		"name": "水平骨牌 3-2",
		"ename": "DOMINO TILE HORIZONTAL-03-02",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🁉",
		"name": "水平骨牌 3-3",
		"ename": "DOMINO TILE HORIZONTAL-03-03",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🁊",
		"name": "水平骨牌 3-4",
		"ename": "DOMINO TILE HORIZONTAL-03-04",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🁋",
		"name": "水平骨牌 3-5",
		"ename": "DOMINO TILE HORIZONTAL-03-05",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🁌",
		"name": "水平骨牌 3-6",
		"ename": "DOMINO TILE HORIZONTAL-03-06",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🁍",
		"name": "水平骨牌 4-0",
		"ename": "DOMINO TILE HORIZONTAL-04-00",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🁎",
		"name": "水平骨牌 4-1",
		"ename": "DOMINO TILE HORIZONTAL-04-01",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🁏",
		"name": "水平骨牌 4-2",
		"ename": "DOMINO TILE HORIZONTAL-04-02",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🁐",
		"name": "水平骨牌 4-3",
		"ename": "DOMINO TILE HORIZONTAL-04-03",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🁑",
		"name": "水平骨牌 4-4",
		"ename": "DOMINO TILE HORIZONTAL-04-04",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🁒",
		"name": "水平骨牌 4-5",
		"ename": "DOMINO TILE HORIZONTAL-04-05",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🁓",
		"name": "水平骨牌 4-6",
		"ename": "DOMINO TILE HORIZONTAL-04-06",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🁔",
		"name": "水平骨牌 5-0",
		"ename": "DOMINO TILE HORIZONTAL-05-00",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🁕",
		"name": "水平骨牌 5-1",
		"ename": "DOMINO TILE HORIZONTAL-05-01",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🁖",
		"name": "水平骨牌 5-2",
		"ename": "DOMINO TILE HORIZONTAL-05-02",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🁗",
		"name": "水平骨牌 5-3",
		"ename": "DOMINO TILE HORIZONTAL-05-03",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🁘",
		"name": "水平骨牌 5-4",
		"ename": "DOMINO TILE HORIZONTAL-05-04",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🁙",
		"name": "水平骨牌 5-5",
		"ename": "DOMINO TILE HORIZONTAL-05-05",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🁚",
		"name": "水平骨牌 5-6",
		"ename": "DOMINO TILE HORIZONTAL-05-06",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🁛",
		"name": "水平骨牌 6-0",
		"ename": "DOMINO TILE HORIZONTAL-06-00",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🁜",
		"name": "水平骨牌 6-1",
		"ename": "DOMINO TILE HORIZONTAL-06-01",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🁝",
		"name": "水平骨牌 6-2",
		"ename": "DOMINO TILE HORIZONTAL-06-02",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🁞",
		"name": "水平骨牌 6-3",
		"ename": "DOMINO TILE HORIZONTAL-06-03",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🁟",
		"name": "水平骨牌 6-4",
		"ename": "DOMINO TILE HORIZONTAL-06-04",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🁠",
		"name": "水平骨牌 6-5",
		"ename": "DOMINO TILE HORIZONTAL-06-05",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🁡",
		"name": "水平骨牌 6-6",
		"ename": "DOMINO TILE HORIZONTAL-06-06",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🁢",
		"name": "垂直骨牌背面",
		"ename": "DOMINO TILE VERTICAL BACK",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🁣",
		"name": "垂直骨牌 0-0",
		"ename": "DOMINO TILE VERTICAL-00-00",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🁤",
		"name": "垂直骨牌 0-1",
		"ename": "DOMINO TILE VERTICAL-00-01",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🁥",
		"name": "垂直骨牌 0-2",
		"ename": "DOMINO TILE VERTICAL-00-02",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🁦",
		"name": "垂直骨牌 0-3",
		"ename": "DOMINO TILE VERTICAL-00-03",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🁧",
		"name": "垂直骨牌 0-4",
		"ename": "DOMINO TILE VERTICAL-00-04",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🁨",
		"name": "垂直骨牌 0-5",
		"ename": "DOMINO TILE VERTICAL-00-05",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🁩",
		"name": "垂直骨牌 0-6",
		"ename": "DOMINO TILE VERTICAL-00-06",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🁪",
		"name": "垂直骨牌 1-0",
		"ename": "DOMINO TILE VERTICAL-01-00",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🁫",
		"name": "垂直骨牌 1-1",
		"ename": "DOMINO TILE VERTICAL-01-01",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🁬",
		"name": "垂直骨牌 1-2",
		"ename": "DOMINO TILE VERTICAL-01-02",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🁭",
		"name": "垂直骨牌 1-3",
		"ename": "DOMINO TILE VERTICAL-01-03",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🁮",
		"name": "垂直骨牌 1-4",
		"ename": "DOMINO TILE VERTICAL-01-04",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🁯",
		"name": "垂直骨牌 1-5",
		"ename": "DOMINO TILE VERTICAL-01-05",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🁰",
		"name": "垂直骨牌 1-6",
		"ename": "DOMINO TILE VERTICAL-01-06",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🁱",
		"name": "垂直骨牌 2-0",
		"ename": "DOMINO TILE VERTICAL-02-00",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🁲",
		"name": "垂直骨牌 2-1",
		"ename": "DOMINO TILE VERTICAL-02-01",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🁳",
		"name": "垂直骨牌 2-2",
		"ename": "DOMINO TILE VERTICAL-02-02",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🁴",
		"name": "垂直骨牌 2-3",
		"ename": "DOMINO TILE VERTICAL-02-03",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🁵",
		"name": "垂直骨牌 2-4",
		"ename": "DOMINO TILE VERTICAL-02-04",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🁶",
		"name": "垂直骨牌 2-5",
		"ename": "DOMINO TILE VERTICAL-02-05",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🁷",
		"name": "垂直骨牌 2-6",
		"ename": "DOMINO TILE VERTICAL-02-06",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🁸",
		"name": "垂直骨牌 3-0",
		"ename": "DOMINO TILE VERTICAL-03-00",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🁹",
		"name": "垂直骨牌 3-1",
		"ename": "DOMINO TILE VERTICAL-03-01",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🁺",
		"name": "垂直骨牌 3-2",
		"ename": "DOMINO TILE VERTICAL-03-02",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🁻",
		"name": "垂直骨牌 3-3",
		"ename": "DOMINO TILE VERTICAL-03-03",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🁼",
		"name": "垂直骨牌 3-4",
		"ename": "DOMINO TILE VERTICAL-03-04",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🁽",
		"name": "垂直骨牌 3-5",
		"ename": "DOMINO TILE VERTICAL-03-05",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🁾",
		"name": "垂直骨牌 3-6",
		"ename": "DOMINO TILE VERTICAL-03-06",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🁿",
		"name": "垂直骨牌 4-0",
		"ename": "DOMINO TILE VERTICAL-04-00",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🂀",
		"name": "垂直骨牌 4-1",
		"ename": "DOMINO TILE VERTICAL-04-01",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🂁",
		"name": "垂直骨牌 4-2",
		"ename": "DOMINO TILE VERTICAL-04-02",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🂂",
		"name": "垂直骨牌 4-3",
		"ename": "DOMINO TILE VERTICAL-04-03",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🂃",
		"name": "垂直骨牌 4-4",
		"ename": "DOMINO TILE VERTICAL-04-04",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🂄",
		"name": "垂直骨牌 4-5",
		"ename": "DOMINO TILE VERTICAL-04-05",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🂅",
		"name": "垂直骨牌 4-6",
		"ename": "DOMINO TILE VERTICAL-04-06",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🂆",
		"name": "垂直骨牌 5-0",
		"ename": "DOMINO TILE VERTICAL-05-00",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🂇",
		"name": "垂直骨牌 5-1",
		"ename": "DOMINO TILE VERTICAL-05-01",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🂈",
		"name": "垂直骨牌 5-2",
		"ename": "DOMINO TILE VERTICAL-05-02",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🂉",
		"name": "垂直骨牌 5-3",
		"ename": "DOMINO TILE VERTICAL-05-03",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🂊",
		"name": "垂直骨牌 5-4",
		"ename": "DOMINO TILE VERTICAL-05-04",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🂋",
		"name": "垂直骨牌 5-5",
		"ename": "DOMINO TILE VERTICAL-05-05",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🂌",
		"name": "垂直骨牌 5-6",
		"ename": "DOMINO TILE VERTICAL-05-06",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🂍",
		"name": "垂直骨牌 6-0",
		"ename": "DOMINO TILE VERTICAL-06-00",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🂎",
		"name": "垂直骨牌 6-1",
		"ename": "DOMINO TILE VERTICAL-06-01",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🂏",
		"name": "垂直骨牌 6-2",
		"ename": "DOMINO TILE VERTICAL-06-02",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🂐",
		"name": "垂直骨牌 6-3",
		"ename": "DOMINO TILE VERTICAL-06-03",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🂑",
		"name": "垂直骨牌 6-4",
		"ename": "DOMINO TILE VERTICAL-06-04",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🂒",
		"name": "垂直骨牌 6-5",
		"ename": "DOMINO TILE VERTICAL-06-05",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "🂓",
		"name": "垂直骨牌 6-6",
		"ename": "DOMINO TILE VERTICAL-06-06",
		"tags": [
			"多米诺骨牌"
		]
	},
	{
		"char": "⚽",
		"name": "足球",
		"ename": "Soccer Ball",
		"tags": [
			"体育、运动"
		],
		"alias": [
			"足球",
			"运动",
			"大罗",
			"梅西",
			"球",
			"球赛",
			"罗纳尔多",
			"胖罗",
			"英式足球"
		]
	},
	{
		"char": "⚾",
		"name": "棒球",
		"ename": "Baseball",
		"tags": [
			"体育、运动"
		],
		"alias": [
			"棒球",
			"运动",
			"球"
		]
	},
	{
		"char": "🏀",
		"name": "篮球",
		"ename": "Basketball",
		"tags": [
			"体育、运动"
		],
		"alias": [
			"打球",
			"球",
			"篮筐",
			"运动"
		]
	},
	{
		"char": "🏐",
		"name": "排球",
		"ename": "Volleyball",
		"tags": [
			"体育、运动"
		],
		"alias": [
			"球",
			"球赛"
		]
	},
	{
		"char": "🏈",
		"name": "橄榄球",
		"ename": "American Football",
		"tags": [
			"体育、运动"
		],
		"alias": [
			"球",
			"美式橄榄球"
		]
	},
	{
		"char": "🏉",
		"name": "英式橄榄球",
		"ename": "Rugby Football",
		"tags": [
			"体育、运动"
		],
		"alias": [
			"橄榄球",
			"球",
			"运动"
		]
	},
	{
		"char": "🎾",
		"name": "网球",
		"ename": "Tennis",
		"tags": [
			"体育、运动"
		],
		"alias": [
			"球",
			"球拍",
			"网球拍"
		]
	},
	{
		"char": "🎳",
		"name": "保龄球",
		"ename": "Bowling",
		"tags": [
			"体育、运动"
		],
		"alias": [
			"全倒",
			"球",
			"运动"
		]
	},
	{
		"char": "🏏",
		"name": "板球",
		"ename": "Cricket Game",
		"tags": [
			"体育、运动"
		],
		"alias": [
			"球",
			"球拍"
		]
	},
	{
		"char": "🏑",
		"name": "曲棍球",
		"ename": "Field Hockey",
		"tags": [
			"体育、运动"
		],
		"alias": [
			"球",
			"球棍",
			"球赛"
		]
	},
	{
		"char": "🏒",
		"name": "冰球",
		"ename": "Ice Hockey",
		"tags": [
			"体育、运动"
		],
		"alias": [
			"冰球杆",
			"球",
			"球棍"
		]
	},
	{
		"char": "🏓",
		"name": "乒乓球",
		"ename": "Ping Pong",
		"tags": [
			"体育、运动"
		],
		"alias": [
			"乒乓",
			"桌球",
			"比赛",
			"球",
			"球拍"
		]
	},
	{
		"char": "🏸",
		"name": "羽毛球",
		"ename": "Badminton",
		"tags": [
			"体育、运动"
		],
		"alias": [
			"球拍",
			"羽球"
		]
	},
	{
		"char": "🥊",
		"name": "拳击手套",
		"ename": "Boxing Glove",
		"tags": [
			"体育、运动"
		],
		"alias": [
			"手套",
			"拳击"
		]
	},
	{
		"char": "🥋",
		"name": "武术服",
		"ename": "Martial Arts Uniform",
		"tags": [
			"体育、运动"
		],
		"alias": [
			"制服",
			"柔道",
			"武术",
			"空手道",
			"练武服",
			"跆拳道"
		]
	},
	{
		"char": "🥅",
		"name": "球门",
		"ename": "Goal Net",
		"tags": [
			"体育、运动"
		],
		"alias": [
			"球网"
		]
	},
	{
		"char": "🥇",
		"name": "金牌",
		"ename": "1st Place Medal",
		"tags": [
			"体育、运动"
		],
		"alias": [
			"奖牌",
			"第一",
			"第一名奖牌"
		]
	},
	{
		"char": "🥈",
		"name": "银牌",
		"ename": "2nd Place Medal",
		"tags": [
			"体育、运动"
		],
		"alias": [
			"亚军",
			"奖牌",
			"第二",
			"第二名奖牌"
		]
	},
	{
		"char": "🥉",
		"name": "铜牌",
		"ename": "3rd Place Medal",
		"tags": [
			"体育、运动"
		],
		"alias": [
			"奖牌",
			"季军",
			"第三",
			"第三名奖牌"
		]
	},
	{
		"char": "🏆",
		"name": "奖杯",
		"ename": "Trophy",
		"tags": [
			"体育、运动"
		],
		"alias": [
			"冠军",
			"奖励",
			"奖品",
			"奖赏",
			"胜利",
			"获胜"
		]
	},
	{
		"char": "🎯",
		"name": "靶心",
		"ename": "Direct Hit",
		"tags": [
			"体育、运动"
		],
		"alias": [
			"射箭",
			"射击",
			"命中",
			"标的",
			"正中靶心的飞镖",
			"直接命中",
			"要害",
			"飞镖"
		]
	},
	{
		"char": "⛵",
		"name": "帆船",
		"ename": "Sailboat",
		"tags": [
			"体育、运动"
		],
		"alias": [
			"游艇",
			"船",
			"驾帆船"
		]
	},
	{
		"char": "⛀",
		"name": "空心跳棋",
		"ename": "Hollow Draughts Man",
		"tags": [
			"体育、运动"
		]
	},
	{
		"char": "⛁",
		"name": "空心跳棋王",
		"ename": "Hollow Draughts King",
		"tags": [
			"体育、运动"
		]
	},
	{
		"char": "⛂",
		"name": "实心跳棋",
		"ename": "Solid Draughts Man",
		"tags": [
			"体育、运动"
		]
	},
	{
		"char": "⛃",
		"name": "实心跳棋王",
		"ename": "Solid Draughts King",
		"tags": [
			"体育、运动"
		],
		"alias": [
			"跳棋"
		]
	},
	{
		"char": "⛉",
		"name": "翻转白将棋",
		"ename": "Turned White Shogi Piece",
		"tags": [
			"体育、运动"
		]
	},
	{
		"char": "⛊",
		"name": "翻转黑将棋",
		"ename": "Turned Black Shogi Piece",
		"tags": [
			"体育、运动"
		]
	},
	{
		"char": "⛳",
		"name": "洞中旗",
		"ename": "Flag In Hole",
		"tags": [
			"体育、运动"
		],
		"alias": [
			"高尔夫球",
			"果岭",
			"果岭旗",
			"球洞",
			"高尔夫",
			"高尔夫球洞",
			"高球"
		]
	},
	{
		"char": "⛺",
		"name": "帐篷",
		"ename": "Tent",
		"tags": [
			"体育、运动"
		],
		"alias": [
			"露营",
			"户外"
		]
	},
	{
		"char": "⚔",
		"name": "击剑",
		"ename": "CROSSED SWORDS",
		"tags": [
			"体育、运动"
		],
		"alias": [
			"交叉",
			"交叉放置的剑",
			"剑",
			"十字",
			"双剑",
			"战死",
			"武器"
		]
	},
	{
		"char": "⛷",
		"name": "滑雪者",
		"ename": "SKIER",
		"tags": [
			"体育、运动"
		],
		"alias": [
			"运动",
			"人物",
			"滑雪",
			"滑雪的人",
			"雪"
		]
	},
	{
		"char": "⛸",
		"name": "冰鞋",
		"ename": "ICE SKATE",
		"tags": [
			"体育、运动"
		],
		"alias": [
			"运动",
			"器材",
			"冰刀",
			"溜冰",
			"滑冰"
		]
	},
	{
		"char": "⛹",
		"name": "玩球的人",
		"ename": "PERSON WITH BALL",
		"tags": [
			"体育、运动"
		],
		"alias": [
			"运动",
			"人物",
			"体育",
			"全网无阻",
			"打球",
			"游戏",
			"玩",
			"玩球",
			"球",
			"篮球",
			"篮球运动员",
			"罚球",
			"运球",
			"锦标赛"
		]
	},
	{
		"char": "（",
		"name": "全角括号",
		"ename": "Fullwidth Parenthesis",
		"tags": [
			"括号和引号"
		]
	},
	{
		"char": "）",
		"name": "全角括号",
		"ename": "Fullwidth Parenthesis",
		"tags": [
			"括号和引号"
		]
	},
	{
		"char": "〔",
		"name": "龟甲括号",
		"ename": "Torgoise Shell Bracket",
		"tags": [
			"括号和引号"
		],
		"alias": [
			"六角括号",
			"左六角括号",
			"括号",
			"龟壳形括号"
		]
	},
	{
		"char": "〕",
		"name": "龟甲括号",
		"ename": "Torgoise Shell Bracket",
		"tags": [
			"括号和引号"
		],
		"alias": [
			"六角括号",
			"右六角括号",
			"括号",
			"龟壳形括号"
		]
	},
	{
		"char": "【",
		"name": "全角龟甲括号",
		"ename": "Fullwidth Tortoise Shell Bracket",
		"tags": [
			"括号和引号"
		],
		"alias": [
			"左黑色透镜状方括号",
			"方括号",
			"荚状方括号",
			"透镜状方括号"
		]
	},
	{
		"char": "】",
		"name": "全角龟甲括号",
		"ename": "Fullwidth Tortoise Shell Bracket",
		"tags": [
			"括号和引号"
		],
		"alias": [
			"右黑色透镜状方括号",
			"方括号",
			"荚状方括号",
			"透镜状方括号"
		]
	},
	{
		"char": "《",
		"name": "双尖括号",
		"ename": "Double Angle Bracket",
		"tags": [
			"括号和引号"
		],
		"alias": [
			"书名号",
			"左双尖括号",
			"括号"
		]
	},
	{
		"char": "》",
		"name": "双尖括号",
		"ename": "Double Angle Bracket",
		"tags": [
			"括号和引号"
		],
		"alias": [
			"书名号",
			"右双尖括号",
			"括号"
		]
	},
	{
		"char": "〈",
		"name": "单尖括号",
		"ename": "Single Angle Bracket",
		"tags": [
			"括号和引号"
		],
		"alias": [
			"书名号",
			"人字形标记",
			"元组",
			"尖括号",
			"尖角括号",
			"左尖括号",
			"括号",
			"菱形括号"
		]
	},
	{
		"char": "〉",
		"name": "单尖括号",
		"ename": "Single Angle Bracket",
		"tags": [
			"括号和引号"
		],
		"alias": [
			"书名号",
			"人字形标记",
			"元组",
			"右尖括号",
			"尖括号",
			"尖角括号",
			"括号",
			"菱形括号"
		]
	},
	{
		"char": "『",
		"name": "空心透镜括号",
		"ename": "Hollow Lenticular Bracket",
		"tags": [
			"括号和引号"
		],
		"alias": [
			"中空角括号",
			"左中空角括号",
			"方括号"
		]
	},
	{
		"char": "』",
		"name": "空心透镜括号",
		"ename": "Hollow Lenticular Bracket",
		"tags": [
			"括号和引号"
		],
		"alias": [
			"中空角括号",
			"右中空角括号",
			"方括号"
		]
	},
	{
		"char": "「",
		"name": "空心角括号",
		"ename": "Hollow Corner Bracket",
		"tags": [
			"括号和引号"
		],
		"alias": [
			"左角括号",
			"方括号",
			"角括号"
		]
	},
	{
		"char": "」",
		"name": "空心角括号",
		"ename": "Hollow Corner Bracket",
		"tags": [
			"括号和引号"
		],
		"alias": [
			"右角括号",
			"方括号",
			"角括号"
		]
	},
	{
		"char": "﹃",
		"name": "竖排左双引号",
		"ename": "Presentation Form for Vertical Left Double Quotation Mark",
		"tags": [
			"括号和引号"
		]
	},
	{
		"char": "﹄",
		"name": "竖排右双引号",
		"ename": "Presentation Form for Vertical Right Double Quotation Mark",
		"tags": [
			"括号和引号"
		]
	},
	{
		"char": "‘",
		"name": "左单引号",
		"ename": "Left Single Quotation Mark",
		"tags": [
			"括号和引号"
		],
		"alias": [
			"单引号",
			"左撇号",
			"引号",
			"撇号",
			"花引号"
		]
	},
	{
		"char": "’",
		"name": "右单引号",
		"ename": "Right Single Quotation Mark",
		"tags": [
			"括号和引号"
		],
		"alias": [
			"单引号",
			"右撇号",
			"引号",
			"撇号",
			"花引号"
		]
	},
	{
		"char": "“",
		"name": "左双引号",
		"ename": "Left Double Quotation Mark",
		"tags": [
			"括号和引号"
		],
		"alias": [
			"双引号",
			"引号",
			"引用",
			"花引用"
		]
	},
	{
		"char": "”",
		"name": "右双引号",
		"ename": "Right Double Quotation Mark",
		"tags": [
			"括号和引号"
		],
		"alias": [
			"双引号",
			"引号",
			"引用",
			"花引号"
		]
	},
	{
		"char": "　",
		"name": "表意空格",
		"ename": "Ideographic Space",
		"tags": [
			"CJK符号和标点"
		]
	},
	{
		"char": "、",
		"name": "顿号",
		"ename": "Ideographic Comma",
		"tags": [
			"CJK符号和标点"
		]
	},
	{
		"char": "。",
		"name": "句号",
		"ename": "Ideographic Full Stop",
		"tags": [
			"CJK符号和标点"
		],
		"alias": [
			"表意文字",
			"表意文字的句号"
		]
	},
	{
		"char": "〃",
		"name": "同上符号",
		"ename": "Ditto Mark",
		"tags": [
			"CJK符号和标点"
		]
	},
	{
		"char": "〄",
		"name": "日本工业标准符号",
		"ename": "Japanese Industrial Standard Symbol",
		"tags": [
			"CJK符号和标点"
		]
	},
	{
		"char": "々",
		"name": "表意重复符号",
		"ename": "Ideographic Iteration Mark",
		"tags": [
			"CJK符号和标点"
		]
	},
	{
		"char": "〆",
		"name": "表意结束符号",
		"ename": "Ideographic Closing Mark",
		"tags": [
			"CJK符号和标点"
		]
	},
	{
		"char": "〇",
		"name": "表意数字零",
		"ename": "Ideographic Number Zero",
		"tags": [
			"CJK符号和标点"
		]
	},
	{
		"char": "〈",
		"name": "左尖括号",
		"ename": "Left Angle Bracket",
		"tags": [
			"CJK符号和标点"
		],
		"alias": [
			"人字形标记",
			"元组",
			"尖括号",
			"尖角括号",
			"括号",
			"菱形括号"
		]
	},
	{
		"char": "〉",
		"name": "右尖括号",
		"ename": "Right Angle Bracket",
		"tags": [
			"CJK符号和标点"
		],
		"alias": [
			"人字形标记",
			"元组",
			"尖括号",
			"尖角括号",
			"括号",
			"菱形括号"
		]
	},
	{
		"char": "《",
		"name": "左双尖括号",
		"ename": "Left Double Angle Bracket",
		"tags": [
			"CJK符号和标点"
		],
		"alias": [
			"双尖括号",
			"括号"
		]
	},
	{
		"char": "》",
		"name": "右双尖括号",
		"ename": "Right Double Angle Bracket",
		"tags": [
			"CJK符号和标点"
		],
		"alias": [
			"双尖括号",
			"括号"
		]
	},
	{
		"char": "「",
		"name": "左空心角括号",
		"ename": "Left Corner Bracket",
		"tags": [
			"CJK符号和标点"
		],
		"alias": [
			"左角括号",
			"方括号",
			"角括号"
		]
	},
	{
		"char": "」",
		"name": "右空心角括号",
		"ename": "Right Corner Bracket",
		"tags": [
			"CJK符号和标点"
		],
		"alias": [
			"右角括号",
			"方括号",
			"角括号"
		]
	},
	{
		"char": "『",
		"name": "左空心透镜括号",
		"ename": "Left Hollow Corner Bracket",
		"tags": [
			"CJK符号和标点"
		],
		"alias": [
			"中空角括号",
			"左中空角括号",
			"方括号"
		]
	},
	{
		"char": "』",
		"name": "右空心透镜括号",
		"ename": "Right Hollow Corner Bracket",
		"tags": [
			"CJK符号和标点"
		],
		"alias": [
			"中空角括号",
			"右中空角括号",
			"方括号"
		]
	},
	{
		"char": "【",
		"name": "左实心透镜括号",
		"ename": "Left Solid Lenticular Bracket",
		"tags": [
			"CJK符号和标点"
		],
		"alias": [
			"左黑色透镜状方括号",
			"方括号",
			"荚状方括号",
			"透镜状方括号"
		]
	},
	{
		"char": "】",
		"name": "右实心透镜括号",
		"ename": "Right Solid Lenticular Bracket",
		"tags": [
			"CJK符号和标点"
		],
		"alias": [
			"右黑色透镜状方括号",
			"方括号",
			"荚状方括号",
			"透镜状方括号"
		]
	},
	{
		"char": "〔",
		"name": "左六角括号",
		"ename": "Left Tortoise Shell Bracket",
		"tags": [
			"CJK符号和标点"
		],
		"alias": [
			"六角括号",
			"括号",
			"龟壳形括号"
		]
	},
	{
		"char": "〕",
		"name": "右六角括号",
		"ename": "Right Tortoise Shell Bracket",
		"tags": [
			"CJK符号和标点"
		],
		"alias": [
			"六角括号",
			"括号",
			"龟壳形括号"
		]
	},
	{
		"char": "〖",
		"name": "左空心六角括号",
		"ename": "Left Hollow Tortoise Shell Bracket",
		"tags": [
			"CJK符号和标点"
		],
		"alias": [
			"中空荚状方括号",
			"中空透镜状方括号",
			"左中空透镜状方括号",
			"方括号"
		]
	},
	{
		"char": "〗",
		"name": "右空心六角括号",
		"ename": "Right Hollow Tortoise Shell Bracket",
		"tags": [
			"CJK符号和标点"
		],
		"alias": [
			"中空荚状方括号",
			"中空透镜状方括号",
			"右中空透镜状方括号",
			"方括号"
		]
	},
	{
		"char": "〶",
		"name": "表意邮政符号",
		"ename": "Ideographic Postal Mark",
		"tags": [
			"CJK符号和标点"
		]
	},
	{
		"char": "〒",
		"name": "邮政符号",
		"ename": "Postal Mark",
		"tags": [
			"CJK符号和标点"
		]
	},
	{
		"char": "︐",
		"name": "竖排逗号",
		"ename": "Presentation Form For Vertical Comma",
		"tags": [
			"竖排形式"
		]
	},
	{
		"char": "︑",
		"name": "竖排顿号",
		"ename": "Presentation Form For Vertical Ideographic Comma",
		"tags": [
			"竖排形式"
		]
	},
	{
		"char": "︒",
		"name": "竖排句号",
		"ename": "Presentation Form For Vertical Ideographic Full Stop",
		"tags": [
			"竖排形式"
		]
	},
	{
		"char": "︓",
		"name": "竖排冒号",
		"ename": "Presentation Form For Vertical Colon",
		"tags": [
			"竖排形式"
		]
	},
	{
		"char": "︔",
		"name": "竖排分号",
		"ename": "Presentation Form For Vertical Semicolon",
		"tags": [
			"竖排形式"
		]
	},
	{
		"char": "︕",
		"name": "竖排感叹号",
		"ename": "Presentation Form For Vertical Exclamation Mark",
		"tags": [
			"竖排形式"
		]
	},
	{
		"char": "︖",
		"name": "竖排问号",
		"ename": "Presentation Form For Vertical Question Mark",
		"tags": [
			"竖排形式"
		]
	},
	{
		"char": "︗",
		"name": "竖排左括号",
		"ename": "Presentation Form For Vertical Left White Lenticular Bracket",
		"tags": [
			"竖排形式"
		]
	},
	{
		"char": "︘",
		"name": "竖排右括号",
		"ename": "Presentation Form For Vertical Right White Lenticular Bracket",
		"tags": [
			"竖排形式"
		]
	},
	{
		"char": "︙",
		"name": "竖排省略号",
		"ename": "Presentation Form For Vertical Horizontal Ellipsis",
		"tags": [
			"竖排形式"
		]
	},
	{
		"char": "︰",
		"name": "竖排两点引导符",
		"ename": "Presentation Form For Vertical Two Dot Leader",
		"tags": [
			"CJK兼容形式"
		]
	},
	{
		"char": "︱",
		"name": "竖排全角破折号",
		"ename": "Presentation Form For Vertical Em Dash",
		"tags": [
			"CJK兼容形式"
		]
	},
	{
		"char": "︳",
		"name": "竖排下划线",
		"ename": "Presentation Form For Vertical En Dash",
		"tags": [
			"CJK兼容形式"
		]
	},
	{
		"char": "︵",
		"name": "竖排左括号",
		"ename": "Presentation Form For Vertical Left Parenthesis",
		"tags": [
			"CJK兼容形式"
		]
	},
	{
		"char": "︶",
		"name": "竖排右括号",
		"ename": "Presentation Form For Vertical Right Parenthesis",
		"tags": [
			"CJK兼容形式"
		]
	},
	{
		"char": "︷",
		"name": "竖排左花括号",
		"ename": "Presentation Form For Vertical Left Curly Bracket",
		"tags": [
			"CJK兼容形式"
		]
	},
	{
		"char": "︸",
		"name": "竖排右花括号",
		"ename": "Presentation Form For Vertical Right Curly Bracket",
		"tags": [
			"CJK兼容形式"
		]
	},
	{
		"char": "︹",
		"name": "竖排左六角括号",
		"ename": "Presentation Form For Vertical Left Tortoise Shell Bracket",
		"tags": [
			"CJK兼容形式"
		]
	},
	{
		"char": "︺",
		"name": "竖排右六角括号",
		"ename": "Presentation Form For Vertical Right Tortoise Shell Bracket",
		"tags": [
			"CJK兼容形式"
		]
	},
	{
		"char": "︻",
		"name": "竖排左实心方括号",
		"ename": "Presentation Form For Vertical Left Black Lenticular Bracket",
		"tags": [
			"CJK兼容形式"
		]
	},
	{
		"char": "︼",
		"name": "竖排右实心方括号",
		"ename": "Presentation Form For Vertical Right Black Lenticular Bracket",
		"tags": [
			"CJK兼容形式"
		]
	},
	{
		"char": "︽",
		"name": "竖排左双尖括号",
		"ename": "Presentation Form For Vertical Left Double Angle Bracket",
		"tags": [
			"CJK兼容形式"
		]
	},
	{
		"char": "︾",
		"name": "竖排右双尖括号",
		"ename": "Presentation Form For Vertical Right Double Angle Bracket",
		"tags": [
			"CJK兼容形式"
		]
	},
	{
		"char": "︿",
		"name": "竖排左尖括号",
		"ename": "Presentation Form For Vertical Left Angle Bracket",
		"tags": [
			"CJK兼容形式"
		]
	},
	{
		"char": "﹀",
		"name": "竖排右尖括号",
		"ename": "Presentation Form For Vertical Right Angle Bracket",
		"tags": [
			"CJK兼容形式"
		]
	},
	{
		"char": "﹁",
		"name": "竖排左角括号",
		"ename": "Presentation Form For Vertical Left Corner Bracket",
		"tags": [
			"CJK兼容形式"
		]
	},
	{
		"char": "﹂",
		"name": "竖排右角括号",
		"ename": "Presentation Form For Vertical Right Corner Bracket",
		"tags": [
			"CJK兼容形式"
		]
	},
	{
		"char": "﹃",
		"name": "竖排左空心角括号",
		"ename": "Presentation Form For Vertical Left White Corner Bracket",
		"tags": [
			"CJK兼容形式"
		]
	},
	{
		"char": "﹄",
		"name": "竖排右空心角括号",
		"ename": "Presentation Form For Vertical Right White Corner Bracket",
		"tags": [
			"CJK兼容形式"
		]
	},
	{
		"char": "﹐",
		"name": "小逗号",
		"ename": "Small Comma",
		"tags": [
			"小写变体形式"
		]
	},
	{
		"char": "﹑",
		"name": "小顿号",
		"ename": "Small Ideographic Comma",
		"tags": [
			"小写变体形式"
		]
	},
	{
		"char": "﹒",
		"name": "小句号",
		"ename": "Small Full Stop",
		"tags": [
			"小写变体形式"
		]
	},
	{
		"char": "﹔",
		"name": "小分号",
		"ename": "Small Semicolon",
		"tags": [
			"小写变体形式"
		]
	},
	{
		"char": "﹕",
		"name": "小冒号",
		"ename": "Small Colon",
		"tags": [
			"小写变体形式"
		]
	},
	{
		"char": "﹖",
		"name": "小问号",
		"ename": "Small Question Mark",
		"tags": [
			"小写变体形式"
		]
	},
	{
		"char": "﹗",
		"name": "小感叹号",
		"ename": "Small Exclamation Mark",
		"tags": [
			"小写变体形式"
		]
	},
	{
		"char": "﹙",
		"name": "小左括号",
		"ename": "Small Left Parenthesis",
		"tags": [
			"小写变体形式"
		]
	},
	{
		"char": "﹚",
		"name": "小右括号",
		"ename": "Small Right Parenthesis",
		"tags": [
			"小写变体形式"
		]
	},
	{
		"char": "﹫",
		"name": "小@符号",
		"ename": "Small Commercial At",
		"tags": [
			"小写变体形式"
		]
	},
	{
		"char": "﹟",
		"name": "小井号",
		"ename": "Small Number Sign",
		"tags": [
			"小写变体形式"
		]
	},
	{
		"char": "﹩",
		"name": "小美元符号",
		"ename": "Small Dollar Sign",
		"tags": [
			"小写变体形式"
		]
	},
	{
		"char": "﹪",
		"name": "小百分比符号",
		"ename": "Small Percent Sign",
		"tags": [
			"小写变体形式"
		]
	},
	{
		"char": "﹠",
		"name": "小与符号",
		"ename": "Small Ampersand",
		"tags": [
			"小写变体形式"
		]
	},
	{
		"char": "！",
		"name": "全角感叹号",
		"ename": "Fullwidth Exclamation Mark",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "＂",
		"name": "全角引号",
		"ename": "Fullwidth Quotation Mark",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "＃",
		"name": "全角井号",
		"ename": "Fullwidth Number Sign",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "＄",
		"name": "全角美元符号",
		"ename": "Fullwidth Dollar Sign",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "％",
		"name": "全角百分比符号",
		"ename": "Fullwidth Percent Sign",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "＆",
		"name": "全角与符号",
		"ename": "Fullwidth Ampersand",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "＇",
		"name": "全角撇号",
		"ename": "Fullwidth Apostrophe",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "（",
		"name": "全角左括号",
		"ename": "Fullwidth Left Parenthesis",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "）",
		"name": "全角右括号",
		"ename": "Fullwidth Right Parenthesis",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "＊",
		"name": "全角星号",
		"ename": "Fullwidth Asterisk",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "＋",
		"name": "全角加号",
		"ename": "Fullwidth Plus Sign",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "，",
		"name": "全角逗号",
		"ename": "Fullwidth Comma",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "－",
		"name": "全角减号",
		"ename": "Fullwidth Hyphen-Minus",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "．",
		"name": "全角句号",
		"ename": "Fullwidth Full Stop",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "／",
		"name": "全角斜杠",
		"ename": "Fullwidth Solidus",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "０",
		"name": "全角数字0",
		"ename": "Fullwidth Digit Zero",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "１",
		"name": "全角数字1",
		"ename": "Fullwidth Digit One",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "２",
		"name": "全角数字2",
		"ename": "Fullwidth Digit Two",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "３",
		"name": "全角数字3",
		"ename": "Fullwidth Digit Three",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "４",
		"name": "全角数字4",
		"ename": "Fullwidth Digit Four",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "５",
		"name": "全角数字5",
		"ename": "Fullwidth Digit Five",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "６",
		"name": "全角数字6",
		"ename": "Fullwidth Digit Six",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "７",
		"name": "全角数字7",
		"ename": "Fullwidth Digit Seven",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "８",
		"name": "全角数字8",
		"ename": "Fullwidth Digit Eight",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "９",
		"name": "全角数字9",
		"ename": "Fullwidth Digit Nine",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "：",
		"name": "全角冒号",
		"ename": "Fullwidth Colon",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "；",
		"name": "全角分号",
		"ename": "Fullwidth Semicolon",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "＜",
		"name": "全角小于号",
		"ename": "Fullwidth Less-Than Sign",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "＝",
		"name": "全角等于号",
		"ename": "Fullwidth Equals Sign",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "＞",
		"name": "全角大于号",
		"ename": "Fullwidth Greater-Than Sign",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "？",
		"name": "全角问号",
		"ename": "Fullwidth Question Mark",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "＠",
		"name": "全角@符号",
		"ename": "Fullwidth Commercial At",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "Ａ",
		"name": "全角大写字母A",
		"ename": "Fullwidth Latin Capital Letter A",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "Ｂ",
		"name": "全角大写字母B",
		"ename": "Fullwidth Latin Capital Letter B",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "Ｃ",
		"name": "全角大写字母C",
		"ename": "Fullwidth Latin Capital Letter C",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "Ｄ",
		"name": "全角大写字母D",
		"ename": "Fullwidth Latin Capital Letter D",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "Ｅ",
		"name": "全角大写字母E",
		"ename": "Fullwidth Latin Capital Letter E",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "Ｆ",
		"name": "全角大写字母F",
		"ename": "Fullwidth Latin Capital Letter F",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "Ｇ",
		"name": "全角大写字母G",
		"ename": "Fullwidth Latin Capital Letter G",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "Ｈ",
		"name": "全角大写字母H",
		"ename": "Fullwidth Latin Capital Letter H",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "Ｉ",
		"name": "全角大写字母I",
		"ename": "Fullwidth Latin Capital Letter I",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "Ｊ",
		"name": "全角大写字母J",
		"ename": "Fullwidth Latin Capital Letter J",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "Ｋ",
		"name": "全角大写字母K",
		"ename": "Fullwidth Latin Capital Letter K",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "Ｌ",
		"name": "全角大写字母L",
		"ename": "Fullwidth Latin Capital Letter L",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "Ｍ",
		"name": "全角大写字母M",
		"ename": "Fullwidth Latin Capital Letter M",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "Ｎ",
		"name": "全角大写字母N",
		"ename": "Fullwidth Latin Capital Letter N",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "Ｏ",
		"name": "全角大写字母O",
		"ename": "Fullwidth Latin Capital Letter O",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "Ｐ",
		"name": "全角大写字母P",
		"ename": "Fullwidth Latin Capital Letter P",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "Ｑ",
		"name": "全角大写字母Q",
		"ename": "Fullwidth Latin Capital Letter Q",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "Ｒ",
		"name": "全角大写字母R",
		"ename": "Fullwidth Latin Capital Letter R",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "Ｓ",
		"name": "全角大写字母S",
		"ename": "Fullwidth Latin Capital Letter S",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "Ｔ",
		"name": "全角大写字母T",
		"ename": "Fullwidth Latin Capital Letter T",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "Ｕ",
		"name": "全角大写字母U",
		"ename": "Fullwidth Latin Capital Letter U",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "Ｖ",
		"name": "全角大写字母V",
		"ename": "Fullwidth Latin Capital Letter V",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "Ｗ",
		"name": "全角大写字母W",
		"ename": "Fullwidth Latin Capital Letter W",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "Ｘ",
		"name": "全角大写字母X",
		"ename": "Fullwidth Latin Capital Letter X",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "Ｙ",
		"name": "全角大写字母Y",
		"ename": "Fullwidth Latin Capital Letter Y",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "Ｚ",
		"name": "全角大写字母Z",
		"ename": "Fullwidth Latin Capital Letter Z",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "［",
		"name": "全角左方括号",
		"ename": "Fullwidth Left Square Bracket",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "＼",
		"name": "全角反斜杠",
		"ename": "Fullwidth Reverse Solidus",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "］",
		"name": "全角右方括号",
		"ename": "Fullwidth Right Square Bracket",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "＾",
		"name": "全角扬抑符",
		"ename": "Fullwidth Circumflex Accent",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "＿",
		"name": "全角下划线",
		"ename": "Fullwidth Low Line",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "｀",
		"name": "全角重音符",
		"ename": "Fullwidth Grave Accent",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "ａ",
		"name": "全角小写字母a",
		"ename": "Fullwidth Latin Small Letter A",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "ｂ",
		"name": "全角小写字母b",
		"ename": "Fullwidth Latin Small Letter B",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "ｃ",
		"name": "全角小写字母c",
		"ename": "Fullwidth Latin Small Letter C",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "ｄ",
		"name": "全角小写字母d",
		"ename": "Fullwidth Latin Small Letter D",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "ｅ",
		"name": "全角小写字母e",
		"ename": "Fullwidth Latin Small Letter E",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "ｆ",
		"name": "全角小写字母f",
		"ename": "Fullwidth Latin Small Letter F",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "ｇ",
		"name": "全角小写字母g",
		"ename": "Fullwidth Latin Small Letter G",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "ｈ",
		"name": "全角小写字母h",
		"ename": "Fullwidth Latin Small Letter H",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "ｉ",
		"name": "全角小写字母i",
		"ename": "Fullwidth Latin Small Letter I",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "ｊ",
		"name": "全角小写字母j",
		"ename": "Fullwidth Latin Small Letter J",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "ｋ",
		"name": "全角小写字母k",
		"ename": "Fullwidth Latin Small Letter K",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "ｌ",
		"name": "全角小写字母l",
		"ename": "Fullwidth Latin Small Letter L",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "ｍ",
		"name": "全角小写字母m",
		"ename": "Fullwidth Latin Small Letter M",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "ｎ",
		"name": "全角小写字母n",
		"ename": "Fullwidth Latin Small Letter N",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "ｏ",
		"name": "全角小写字母o",
		"ename": "Fullwidth Latin Small Letter O",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "ｐ",
		"name": "全角小写字母p",
		"ename": "Fullwidth Latin Small Letter P",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "ｑ",
		"name": "全角小写字母q",
		"ename": "Fullwidth Latin Small Letter Q",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "ｒ",
		"name": "全角小写字母r",
		"ename": "Fullwidth Latin Small Letter R",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "ｓ",
		"name": "全角小写字母s",
		"ename": "Fullwidth Latin Small Letter S",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "ｔ",
		"name": "全角小写字母t",
		"ename": "Fullwidth Latin Small Letter T",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "ｕ",
		"name": "全角小写字母u",
		"ename": "Fullwidth Latin Small Letter U",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "ｖ",
		"name": "全角小写字母v",
		"ename": "Fullwidth Latin Small Letter V",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "ｗ",
		"name": "全角小写字母w",
		"ename": "Fullwidth Latin Small Letter W",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "ｘ",
		"name": "全角小写字母x",
		"ename": "Fullwidth Latin Small Letter X",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "ｙ",
		"name": "全角小写字母y",
		"ename": "Fullwidth Latin Small Letter Y",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "ｚ",
		"name": "全角小写字母z",
		"ename": "Fullwidth Latin Small Letter Z",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "｛",
		"name": "全角左花括号",
		"ename": "Fullwidth Left Curly Bracket",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "｜",
		"name": "全角竖线",
		"ename": "Fullwidth Vertical Line",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "｝",
		"name": "全角右花括号",
		"ename": "Fullwidth Right Curly Bracket",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "～",
		"name": "全角波浪号",
		"ename": "Fullwidth Tilde",
		"tags": [
			"半角及全角形式"
		]
	},
	{
		"char": "①",
		"name": "带圈数字一",
		"ename": "Circled Digit One",
		"tags": [
			"数字"
		]
	},
	{
		"char": "②",
		"name": "带圈数字二",
		"ename": "Circled Digit Two",
		"tags": [
			"数字"
		]
	},
	{
		"char": "③",
		"name": "带圈数字三",
		"ename": "Circled Digit Three",
		"tags": [
			"数字"
		]
	},
	{
		"char": "④",
		"name": "带圈数字四",
		"ename": "Circled Digit Four",
		"tags": [
			"数字"
		]
	},
	{
		"char": "⑤",
		"name": "带圈数字五",
		"ename": "Circled Digit Five",
		"tags": [
			"数字"
		]
	},
	{
		"char": "⑥",
		"name": "带圈数字六",
		"ename": "Circled Digit Six",
		"tags": [
			"数字"
		]
	},
	{
		"char": "⑦",
		"name": "带圈数字七",
		"ename": "Circled Digit Seven",
		"tags": [
			"数字"
		]
	},
	{
		"char": "⑧",
		"name": "带圈数字八",
		"ename": "Circled Digit Eight",
		"tags": [
			"数字"
		]
	},
	{
		"char": "⑨",
		"name": "带圈数字九",
		"ename": "Circled Digit Nine",
		"tags": [
			"数字"
		]
	},
	{
		"char": "⑩",
		"name": "带圈数字十",
		"ename": "Circled Number Ten",
		"tags": [
			"数字"
		]
	},
	{
		"char": "Ⅰ",
		"name": "罗马数字一",
		"ename": "Roman Numeral One",
		"tags": [
			"数字"
		]
	},
	{
		"char": "Ⅱ",
		"name": "罗马数字二",
		"ename": "Roman Numeral Two",
		"tags": [
			"数字"
		]
	},
	{
		"char": "Ⅲ",
		"name": "罗马数字三",
		"ename": "Roman Numeral Three",
		"tags": [
			"数字"
		]
	},
	{
		"char": "Ⅳ",
		"name": "罗马数字四",
		"ename": "Roman Numeral Four",
		"tags": [
			"数字"
		]
	},
	{
		"char": "Ⅴ",
		"name": "罗马数字五",
		"ename": "Roman Numeral Five",
		"tags": [
			"数字"
		]
	},
	{
		"char": "Ⅵ",
		"name": "罗马数字六",
		"ename": "Roman Numeral Six",
		"tags": [
			"数字"
		]
	},
	{
		"char": "Ⅶ",
		"name": "罗马数字七",
		"ename": "Roman Numeral Seven",
		"tags": [
			"数字"
		]
	},
	{
		"char": "Ⅷ",
		"name": "罗马数字八",
		"ename": "Roman Numeral Eight",
		"tags": [
			"数字"
		]
	},
	{
		"char": "Ⅸ",
		"name": "罗马数字九",
		"ename": "Roman Numeral Nine",
		"tags": [
			"数字"
		]
	},
	{
		"char": "Ⅹ",
		"name": "罗马数字十",
		"ename": "Roman Numeral Ten",
		"tags": [
			"数字"
		]
	},
	{
		"char": "Ⅺ",
		"name": "罗马数字十一",
		"ename": "Roman Numeral Eleven",
		"tags": [
			"数字"
		]
	},
	{
		"char": "Ⅻ",
		"name": "罗马数字十二",
		"ename": "Roman Numeral Twelve",
		"tags": [
			"数字"
		]
	},
	{
		"char": "+",
		"name": "加号",
		"ename": "Plus Sign",
		"tags": [
			"运算符、操作符、比较符"
		],
		"alias": [
			"加",
			"相加"
		]
	},
	{
		"char": "-",
		"name": "减号",
		"ename": "Minus Sign",
		"tags": [
			"运算符、操作符、比较符"
		],
		"alias": [
			"横线",
			"负号",
			"连字符",
			"连字符-负号"
		]
	},
	{
		"char": "×",
		"name": "乘号",
		"ename": "Multiplication Sign",
		"tags": [
			"运算符、操作符、比较符"
		],
		"alias": [
			"乘以",
			"乘法",
			"乘积",
			"倍数"
		]
	},
	{
		"char": "÷",
		"name": "除号",
		"ename": "Division Sign",
		"tags": [
			"运算符、操作符、比较符"
		],
		"alias": [
			"商数",
			"除以",
			"除商",
			"除法"
		]
	},
	{
		"char": "±",
		"name": "正负号",
		"ename": "Plus-Minus Sign",
		"tags": [
			"运算符、操作符、比较符"
		],
		"alias": [
			"正负"
		]
	},
	{
		"char": "≠",
		"name": "不等于号",
		"ename": "Not Equal To",
		"tags": [
			"运算符、操作符、比较符"
		],
		"alias": [
			"不等号",
			"不相等",
			"不等",
			"不等于"
		]
	},
	{
		"char": "≈",
		"name": "约等于号",
		"ename": "Almost Equal To",
		"tags": [
			"运算符、操作符、比较符"
		],
		"alias": [
			"大概",
			"约等于",
			"近似值"
		]
	},
	{
		"char": "≅",
		"name": "全等于号",
		"ename": "Congruent To",
		"tags": [
			"运算符、操作符、比较符"
		],
		"alias": [
			"近似相等"
		]
	},
	{
		"char": "≡",
		"name": "恒等于号",
		"ename": "Identical To",
		"tags": [
			"运算符、操作符、比较符"
		],
		"alias": [
			"三线",
			"相同",
			"等于",
			"等同",
			"等同于"
		]
	},
	{
		"char": "∝",
		"name": "正比于",
		"ename": "Proportional To",
		"tags": [
			"运算符、操作符、比较符"
		],
		"alias": [
			"成比例"
		]
	},
	{
		"char": "≤",
		"name": "小于等于号",
		"ename": "Less-Than or Equal To",
		"tags": [
			"运算符、操作符、比较符"
		],
		"alias": [
			"不大于",
			"不等式",
			"小于",
			"小于等于",
			"相等",
			"等于"
		]
	},
	{
		"char": "≥",
		"name": "大于等于号",
		"ename": "Greater-Than or Equal To",
		"tags": [
			"运算符、操作符、比较符"
		],
		"alias": [
			"不小于",
			"不等",
			"大于",
			"大于等于",
			"相等",
			"等于"
		]
	},
	{
		"char": "∞",
		"name": "无穷大",
		"ename": "Infinity",
		"tags": [
			"运算符、操作符、比较符"
		],
		"alias": [
			"无穷大符号"
		]
	},
	{
		"char": "∫",
		"name": "积分",
		"ename": "Integral",
		"tags": [
			"运算符、操作符、比较符"
		]
	},
	{
		"char": "∑",
		"name": "求和",
		"ename": "N-Ary Summation",
		"tags": [
			"运算符、操作符、比较符"
		],
		"alias": [
			"N元求和"
		]
	},
	{
		"char": "∏",
		"name": "求积",
		"ename": "N-Ary Product",
		"tags": [
			"运算符、操作符、比较符"
		],
		"alias": [
			"N元乘积"
		]
	},
	{
		"char": "√",
		"name": "开方/平方根",
		"ename": "Square Root",
		"tags": [
			"运算符、操作符、比较符"
		],
		"alias": [
			"不尽根",
			"平方根",
			"开平方",
			"开根",
			"根号"
		]
	},
	{
		"char": "∛",
		"name": "开立方/立方根",
		"ename": "Cube Root",
		"tags": [
			"运算符、操作符、比较符"
		]
	},
	{
		"char": "∜",
		"name": "四次方根",
		"ename": "Fourth Root",
		"tags": [
			"运算符、操作符、比较符"
		]
	},
	{
		"char": "∠",
		"name": "角",
		"ename": "Angle",
		"tags": [
			"运算符、操作符、比较符"
		]
	},
	{
		"char": "⊥",
		"name": "垂直",
		"ename": "Up Tack",
		"tags": [
			"运算符、操作符、比较符"
		],
		"alias": [
			"上丁字"
		]
	},
	{
		"char": "∥",
		"name": "平行",
		"ename": "Parallel To",
		"tags": [
			"运算符、操作符、比较符"
		]
	},
	{
		"char": "∧",
		"name": "逻辑与",
		"ename": "Logical And",
		"tags": [
			"运算符、操作符、比较符"
		]
	},
	{
		"char": "∨",
		"name": "逻辑或",
		"ename": "Logical Or",
		"tags": [
			"运算符、操作符、比较符"
		]
	},
	{
		"char": "∩",
		"name": "交集",
		"ename": "Intersection",
		"tags": [
			"运算符、操作符、比较符"
		],
		"alias": [
			"集",
			"集合"
		]
	},
	{
		"char": "∪",
		"name": "并集",
		"ename": "Union",
		"tags": [
			"运算符、操作符、比较符"
		],
		"alias": [
			"集",
			"集合"
		]
	},
	{
		"char": "∈",
		"name": "属于",
		"ename": "Element Of",
		"tags": [
			"运算符、操作符、比较符"
		],
		"alias": [
			"元素",
			"包含",
			"成员",
			"是...的元素",
			"集合"
		]
	},
	{
		"char": "∉",
		"name": "不属于",
		"ename": "Not an Element Of",
		"tags": [
			"运算符、操作符、比较符"
		]
	},
	{
		"char": "⊂",
		"name": "…的子集",
		"ename": "Subset Of",
		"tags": [
			"运算符、操作符、比较符"
		],
		"alias": [
			"子集",
			"是...的子集",
			"集合"
		]
	},
	{
		"char": "⊃",
		"name": "…的超集",
		"ename": "Superset Of",
		"tags": [
			"运算符、操作符、比较符"
		],
		"alias": [
			"超集"
		]
	},
	{
		"char": "⊆",
		"name": "…的子集或等于",
		"ename": "Subset of or Equal To",
		"tags": [
			"运算符、操作符、比较符"
		],
		"alias": [
			"子集或等于"
		]
	},
	{
		"char": "⊇",
		"name": "…的超集或等于",
		"ename": "Superset of or Equal To",
		"tags": [
			"运算符、操作符、比较符"
		],
		"alias": [
			"超集或等于"
		]
	},
	{
		"char": "∅",
		"name": "空集",
		"ename": "Empty Set",
		"tags": [
			"运算符、操作符、比较符"
		]
	},
	{
		"char": "∀",
		"name": "任意",
		"ename": "For All",
		"tags": [
			"运算符、操作符、比较符"
		],
		"alias": [
			"全称量词"
		]
	},
	{
		"char": "∃",
		"name": "存在",
		"ename": "There Exists",
		"tags": [
			"运算符、操作符、比较符"
		],
		"alias": [
			"存在量词"
		]
	},
	{
		"char": "∴",
		"name": "所以",
		"ename": "Therefore",
		"tags": [
			"运算符、操作符、比较符"
		]
	},
	{
		"char": "∵",
		"name": "因为",
		"ename": "Because",
		"tags": [
			"运算符、操作符、比较符"
		]
	},
	{
		"char": "⚪",
		"name": "空心圆",
		"ename": "Medium Hollow Circle",
		"tags": [
			"几何图形"
		],
		"alias": [
			"圆形",
			"白色",
			"圆",
			"圈",
			"白",
			"白圈",
			"白色圆"
		]
	},
	{
		"char": "⚫",
		"name": "实心圆",
		"ename": "Medium Solid Circle",
		"tags": [
			"几何图形"
		],
		"alias": [
			"圆形",
			"黑色",
			"圆",
			"圈",
			"黑",
			"黑色圆"
		]
	},
	{
		"char": "⛛",
		"name": "重白下指三角",
		"ename": "Heavy White Down-Pointing Triangle",
		"tags": [
			"几何图形"
		],
		"alias": [
			"指向"
		]
	},
	{
		"char": "⚆",
		"name": "空心圆右点",
		"ename": "Hollow Circle with Dot Right",
		"tags": [
			"几何图形"
		],
		"alias": [
			"圆形",
			"点"
		]
	},
	{
		"char": "⚇",
		"name": "空心圆双点",
		"ename": "Hollow Circle with Two Dots",
		"tags": [
			"几何图形"
		],
		"alias": [
			"圆形",
			"点"
		]
	},
	{
		"char": "⚈",
		"name": "实心圆右点",
		"ename": "Solid Circle with White Dot Right",
		"tags": [
			"几何图形"
		],
		"alias": [
			"圆形",
			"点"
		]
	},
	{
		"char": "⚉",
		"name": "实心圆双点",
		"ename": "Solid Circle with Two White Dots",
		"tags": [
			"几何图形"
		],
		"alias": [
			"圆形",
			"点"
		]
	},
	{
		"char": "⛋",
		"name": "正方形内接菱形",
		"ename": "WHITE DIAMOND IN SQUARE",
		"tags": [
			"几何图形"
		],
		"alias": [
			"圆形",
			"点"
		]
	},
	{
		"char": "⛶",
		"name": "四角方框",
		"ename": "SQUARE FOUR CORNERS",
		"tags": [
			"几何图形"
		],
		"alias": [
			"符号",
			"几何"
		]
	},
	{
		"char": "⚛",
		"name": "原子符号",
		"ename": "Atom Symbol",
		"tags": [
			"物理、化学"
		],
		"alias": [
			"科学",
			"原子",
			"无神论",
			"物质"
		]
	},
	{
		"char": "☢",
		"name": "放射性标志",
		"ename": "Radioactive Sign",
		"tags": [
			"物理、化学"
		],
		"alias": [
			"辐射",
			"放射性",
			"标识"
		]
	},
	{
		"char": "⚡",
		"name": "高压",
		"ename": "High Voltage Sign",
		"tags": [
			"物理、化学"
		],
		"alias": [
			"电力",
			"危险",
			"有电",
			"闪电"
		]
	},
	{
		"char": "⚗",
		"name": "蒸馏器",
		"ename": "Alembic",
		"tags": [
			"物理、化学"
		],
		"alias": [
			"实验",
			"仪器",
			"净化",
			"化学",
			"工具",
			"蒸馏"
		]
	},
	{
		"char": "⚘",
		"name": "花卉",
		"ename": "Flower",
		"tags": [
			"生物"
		]
	},
	{
		"char": "☘",
		"name": "三叶草",
		"ename": "Shamrock",
		"tags": [
			"生物"
		],
		"alias": [
			"爱尔兰",
			"苜蓿",
			"酢浆草"
		]
	},
	{
		"char": "⚜",
		"name": "鸢尾花",
		"ename": "Fleur-De-Lis",
		"tags": [
			"生物"
		],
		"alias": [
			"花",
			"装饰",
			"百合花饰"
		]
	},
	{
		"char": "☙",
		"name": "反向旋转花心",
		"ename": "Reversed Rotated Floral Heart Bullet",
		"tags": [
			"生物"
		]
	},
	{
		"char": "☣",
		"name": "生物危害标志",
		"ename": "Biohazard Sign",
		"tags": [
			"生物"
		],
		"alias": [
			"生化",
			"动物",
			"当心感染",
			"污染",
			"生物危害",
			"警告"
		]
	},
	{
		"char": "☉",
		"name": "太阳",
		"ename": "Sun",
		"tags": [
			"天文"
		],
		"alias": [
			"太阳系",
			"日"
		]
	},
	{
		"char": "☀",
		"name": "实心太阳",
		"ename": "Solid Sun with Rays",
		"tags": [
			"天文"
		],
		"alias": [
			"太阳系",
			"日",
			"光芒",
			"光线",
			"太阳",
			"晴",
			"晴天",
			"阳光明媚",
			"阳光普照"
		]
	},
	{
		"char": "☼",
		"name": "空心太阳",
		"ename": "Hollow Sun with Rays",
		"tags": [
			"天文"
		],
		"alias": [
			"太阳系",
			"日",
			"光芒"
		]
	},
	{
		"char": "☽",
		"name": "上弦月",
		"ename": "First Quarter Moon",
		"tags": [
			"天文"
		],
		"alias": [
			"太阳系",
			"月亮",
			"月球",
			"月牙"
		]
	},
	{
		"char": "☾",
		"name": "下弦月",
		"ename": "Last Quarter Moon",
		"tags": [
			"天文"
		],
		"alias": [
			"太阳系",
			"月亮",
			"月球",
			"月牙"
		]
	},
	{
		"char": "☿",
		"name": "水星",
		"ename": "Mercury",
		"tags": [
			"天文"
		],
		"alias": [
			"太阳系八大行星",
			"太阳系九大行星"
		]
	},
	{
		"char": "♀",
		"name": "金星",
		"ename": "Venus",
		"tags": [
			"天文"
		],
		"alias": [
			"太阳系八大行星",
			"太阳系九大行星",
			"女性",
			"雌性",
			"女性符号",
			"符号"
		]
	},
	{
		"char": "♁",
		"name": "地球",
		"ename": "Earth",
		"tags": [
			"天文"
		],
		"alias": [
			"太阳系八大行星",
			"太阳系九大行星"
		]
	},
	{
		"char": "♂",
		"name": "火星",
		"ename": "Mars",
		"tags": [
			"天文"
		],
		"alias": [
			"太阳系八大行星",
			"太阳系九大行星",
			"男性",
			"雄性",
			"男性符号",
			"符号"
		]
	},
	{
		"char": "♃",
		"name": "木星",
		"ename": "Jupiter",
		"tags": [
			"天文"
		],
		"alias": [
			"太阳系八大行星",
			"太阳系九大行星"
		]
	},
	{
		"char": "♄",
		"name": "土星",
		"ename": "Saturn",
		"tags": [
			"天文"
		],
		"alias": [
			"太阳系八大行星",
			"太阳系九大行星"
		]
	},
	{
		"char": "♅",
		"name": "天王星",
		"ename": "Uranus",
		"tags": [
			"天文"
		],
		"alias": [
			"太阳系八大行星",
			"太阳系九大行星"
		]
	},
	{
		"char": "⛢",
		"name": "天王星天文符号",
		"ename": "Astronomical Symbol For Uranus",
		"tags": [
			"天文"
		],
		"alias": [
			"太阳系八大行星",
			"太阳系九大行星"
		]
	},
	{
		"char": "♆",
		"name": "海王星",
		"ename": "Neptune",
		"tags": [
			"天文"
		],
		"alias": [
			"太阳系八大行星",
			"太阳系九大行星",
			"三叉戟"
		]
	},
	{
		"char": "♇",
		"name": "冥王星",
		"ename": "Pluto",
		"tags": [
			"天文"
		],
		"alias": [
			"太阳系九大行星",
			"矮行星"
		]
	},
	{
		"char": "⚳",
		"name": "谷神星",
		"ename": "Ceres",
		"tags": [
			"天文"
		],
		"alias": [
			"太阳系",
			"矮行星"
		]
	},
	{
		"char": "⚴",
		"name": "智神星",
		"ename": "Pallas",
		"tags": [
			"天文"
		],
		"alias": [
			"太阳系",
			"小行星"
		]
	},
	{
		"char": "⚵",
		"name": "婚神星",
		"ename": "Juno",
		"tags": [
			"天文"
		],
		"alias": [
			"太阳系",
			"小行星"
		]
	},
	{
		"char": "⚶",
		"name": "灶神星",
		"ename": "Vesta",
		"tags": [
			"天文"
		],
		"alias": [
			"太阳系",
			"小行星"
		]
	},
	{
		"char": "⚷",
		"name": "凯龙星",
		"ename": "Chiron",
		"tags": [
			"天文"
		],
		"alias": [
			"太阳系",
			"小行星"
		]
	},
	{
		"char": "☄",
		"name": "彗星",
		"ename": "Comet",
		"tags": [
			"天文"
		],
		"alias": [
			"太阳系",
			"太空"
		]
	},
	{
		"char": "☊",
		"name": "升交点",
		"ename": "Ascending Node",
		"tags": [
			"天文"
		]
	},
	{
		"char": "☋",
		"name": "降交点",
		"ename": "Descending Node",
		"tags": [
			"天文"
		]
	},
	{
		"char": "☌",
		"name": "合点",
		"ename": "Conjunction",
		"tags": [
			"天文"
		]
	},
	{
		"char": "☍",
		"name": "冲日点",
		"ename": "Opposition",
		"tags": [
			"天文"
		]
	},
	{
		"char": "♈",
		"name": "白羊宫、白羊座",
		"ename": "Aries",
		"tags": [
			"天文"
		],
		"alias": [
			"黄道十二星座",
			"黄道十三星座",
			"黄道十二宫",
			"黄道十三宫",
			"公羊",
			"星座",
			"牡羊座",
			"白羊座"
		]
	},
	{
		"char": "♉",
		"name": "金牛宫、金牛座",
		"ename": "Taurus",
		"tags": [
			"天文"
		],
		"alias": [
			"黄道十二星座",
			"黄道十三星座",
			"黄道十二宫",
			"黄道十三宫",
			"公牛",
			"星座",
			"金牛",
			"金牛座"
		]
	},
	{
		"char": "♊",
		"name": "双子宫、双子座",
		"ename": "Gemini",
		"tags": [
			"天文"
		],
		"alias": [
			"黄道十二星座",
			"黄道十三星座",
			"黄道十二宫",
			"黄道十三宫",
			"双子",
			"双子座",
			"孪生子",
			"星座"
		]
	},
	{
		"char": "♋",
		"name": "巨蟹宫、巨蟹座",
		"ename": "Cancer",
		"tags": [
			"天文"
		],
		"alias": [
			"黄道十二星座",
			"黄道十三星座",
			"黄道十二宫",
			"黄道十三宫",
			"巨蟹",
			"巨蟹座",
			"星座",
			"螃蟹"
		]
	},
	{
		"char": "♌",
		"name": "狮子宫、狮子座",
		"ename": "Leo",
		"tags": [
			"天文"
		],
		"alias": [
			"黄道十二星座",
			"黄道十三星座",
			"黄道十二宫",
			"黄道十三宫",
			"星座",
			"狮子座",
			"雄狮"
		]
	},
	{
		"char": "♍",
		"name": "处女宫、处女座",
		"ename": "Virgo",
		"tags": [
			"天文"
		],
		"alias": [
			"黄道十二星座",
			"黄道十三星座",
			"黄道十二宫",
			"黄道十三宫",
			"处女座",
			"室女座",
			"星座"
		]
	},
	{
		"char": "♎",
		"name": "天秤宫、天秤座",
		"ename": "Libra",
		"tags": [
			"天文"
		],
		"alias": [
			"黄道十二星座",
			"黄道十三星座",
			"黄道十二宫",
			"黄道十三宫",
			"天秤座",
			"平衡",
			"星座",
			"正义"
		]
	},
	{
		"char": "♏",
		"name": "天蝎宫、天蝎座",
		"ename": "Scorpius",
		"tags": [
			"天文"
		],
		"alias": [
			"黄道十二星座",
			"黄道十三星座",
			"黄道十二宫",
			"黄道十三宫",
			"天蝎",
			"天蝎座",
			"星座",
			"蝎子"
		]
	},
	{
		"char": "♐",
		"name": "射手宫、射手座",
		"ename": "Sagittarius",
		"tags": [
			"天文"
		],
		"alias": [
			"黄道十二星座",
			"黄道十三星座",
			"黄道十二宫",
			"黄道十三宫",
			"人马座",
			"射手",
			"射手座",
			"弓箭手",
			"星座"
		]
	},
	{
		"char": "♑",
		"name": "摩羯宫、摩羯座",
		"ename": "Capricorn",
		"tags": [
			"天文"
		],
		"alias": [
			"黄道十二星座",
			"黄道十三星座",
			"黄道十二宫",
			"黄道十三宫",
			"天宫图",
			"山羊",
			"摩羯",
			"摩羯座",
			"星座"
		]
	},
	{
		"char": "♒",
		"name": "水瓶宫、水瓶座",
		"ename": "Aquarius",
		"tags": [
			"天文"
		],
		"alias": [
			"黄道十二星座",
			"黄道十三星座",
			"黄道十二宫",
			"黄道十三宫",
			"星座",
			"水",
			"水瓶座"
		]
	},
	{
		"char": "♓",
		"name": "双鱼宫、双鱼座",
		"ename": "Pisces",
		"tags": [
			"天文"
		],
		"alias": [
			"黄道十二星座",
			"黄道十三星座",
			"黄道十二宫",
			"黄道十三宫",
			"双鱼",
			"双鱼座",
			"星座",
			"鱼"
		]
	},
	{
		"char": "⛎",
		"name": "蛇夫宫、蛇夫座",
		"ename": "Ophiuchus",
		"tags": [
			"天文"
		],
		"alias": [
			"黄道十二星座",
			"黄道十三星座",
			"黄道十二宫",
			"黄道十三宫",
			"星座",
			"蛇",
			"蛇夫",
			"蛇夫座"
		]
	},
	{
		"char": "★",
		"name": "实心星",
		"ename": "Solid Star",
		"tags": [
			"抽象星形符号"
		],
		"alias": [
			"五角星",
			"五芒星",
			"实心星"
		]
	},
	{
		"char": "☆",
		"name": "空心星",
		"ename": "Hollow Star",
		"tags": [
			"抽象星形符号"
		],
		"alias": [
			"五角星",
			"五芒星",
			"空心星"
		]
	},
	{
		"char": "✡",
		"name": "大卫之星",
		"ename": "Star of David",
		"tags": [
			"抽象星形符号"
		],
		"alias": [
			"六角星",
			"六芒星",
			"大卫星",
			"宗教",
			"犹太",
			"犹太教"
		]
	},
	{
		"char": "✦",
		"name": "实心四角星",
		"ename": "Solid Four Pointed Star",
		"tags": [
			"抽象星形符号"
		],
		"alias": [
			"四角星",
			"四芒星"
		]
	},
	{
		"char": "✧",
		"name": "空心四角星",
		"ename": "Hollow Four Pointed Star",
		"tags": [
			"抽象星形符号"
		],
		"alias": [
			"四角星",
			"四芒星"
		]
	},
	{
		"char": "✩",
		"name": "轮廓白星",
		"ename": "Stress Outlined White Star",
		"tags": [
			"抽象星形符号"
		],
		"alias": [
			"五角星",
			"五芒星",
			"旋转星"
		]
	},
	{
		"char": "✪",
		"name": "实心圆空心星",
		"ename": "Circled Hollow Star",
		"tags": [
			"抽象星形符号"
		],
		"alias": [
			"五角星",
			"五芒星",
			"带圈星"
		]
	},
	{
		"char": "⍟",
		"name": "空心圆实心星",
		"ename": "APL Functional Symbol Circle Star",
		"tags": [
			"抽象星形符号"
		],
		"alias": [
			"五角星",
			"五芒星",
			"圈内星"
		]
	},
	{
		"char": "✫",
		"name": "实心星空心圆",
		"ename": "Open Centre Solid Star",
		"tags": [
			"抽象星形符号"
		],
		"alias": [
			"五角星",
			"五芒星"
		]
	},
	{
		"char": "✬",
		"name": "空心星实心圆",
		"ename": "Solid Centre Hollow Star",
		"tags": [
			"抽象星形符号"
		],
		"alias": [
			"五角星",
			"五芒星"
		]
	},
	{
		"char": "✭",
		"name": "描边实心星",
		"ename": "Outlined Solid Star",
		"tags": [
			"抽象星形符号"
		],
		"alias": [
			"五角星",
			"五芒星"
		]
	},
	{
		"char": "✮",
		"name": "粗描边实心星",
		"ename": "Heavy Outlined Solid Star",
		"tags": [
			"抽象星形符号"
		],
		"alias": [
			"五角星",
			"五芒星"
		]
	},
	{
		"char": "✯",
		"name": "风车星",
		"ename": "Pinwheel Star",
		"tags": [
			"抽象星形符号"
		],
		"alias": [
			"五角星",
			"五芒星"
		]
	},
	{
		"char": "✰",
		"name": "阴影空心星",
		"ename": "Shadowed Hollow Star",
		"tags": [
			"抽象星形符号"
		],
		"alias": [
			"五角星",
			"五芒星",
			"带影星"
		]
	},
	{
		"char": "⁂",
		"name": "星群",
		"ename": "Asterism",
		"tags": [
			"抽象星形符号"
		],
		"alias": [
			"三星",
			"三体"
		]
	},
	{
		"char": "⁎",
		"name": "星号",
		"ename": "Low Asterisk",
		"tags": [
			"抽象星形符号"
		]
	},
	{
		"char": "⁑",
		"name": "竖排双星号",
		"ename": "Two Asterisks Aligned Vertically",
		"tags": [
			"抽象星形符号"
		]
	},
	{
		"char": "⌑",
		"name": "凹正方形",
		"ename": "Square Lozenge",
		"tags": [
			"抽象星形符号"
		],
		"alias": [
			"方菱形"
		]
	},
	{
		"char": "⍣",
		"name": "星形分音符",
		"ename": "APL Functional Symbol Star Diaeresis",
		"tags": [
			"抽象星形符号"
		]
	},
	{
		"char": "⚝",
		"name": "空心星",
		"ename": "Outlined Hollow Star",
		"tags": [
			"抽象星形符号"
		],
		"alias": [
			"星形",
			"白色"
		]
	},
	{
		"char": "⛤",
		"name": "五角星",
		"ename": "Pentagram",
		"tags": [
			"抽象星形符号"
		],
		"alias": [
			"五角星",
			"魔法"
		]
	},
	{
		"char": "⛥",
		"name": "右手交织五角星",
		"ename": "Right-Handed Interlaced Pentagram",
		"tags": [
			"抽象星形符号"
		],
		"alias": [
			"五角星",
			"交织"
		]
	},
	{
		"char": "⛦",
		"name": "左手交织五角星",
		"ename": "Left-Handed Interlaced Pentagram",
		"tags": [
			"抽象星形符号"
		],
		"alias": [
			"五角星",
			"交织"
		]
	},
	{
		"char": "⛧",
		"name": "倒五角星",
		"ename": "Inverted Pentagram",
		"tags": [
			"抽象星形符号"
		],
		"alias": [
			"五角星",
			"倒置"
		]
	},
	{
		"char": "☀",
		"name": "实心太阳",
		"ename": "Solid Sun with Rays",
		"tags": [
			"天气"
		],
		"alias": [
			"光线",
			"太阳",
			"晴",
			"晴天",
			"阳光明媚",
			"阳光普照"
		]
	},
	{
		"char": "☼",
		"name": "空心太阳",
		"ename": "Hollow Sun with Rays",
		"tags": [
			"天气"
		]
	},
	{
		"char": "☁",
		"name": "云",
		"ename": "Cloud",
		"tags": [
			"天气"
		],
		"alias": [
			"云彩",
			"云朵",
			"阴"
		]
	},
	{
		"char": "❄",
		"name": "雪花",
		"ename": "Snowflake",
		"tags": [
			"天气"
		],
		"alias": [
			"冷",
			"雪"
		]
	},
	{
		"char": "⚡",
		"name": "高压",
		"ename": "High Voltage Sign",
		"tags": [
			"天气"
		],
		"alias": [
			"电力",
			"危险",
			"闪电",
			"雷电",
			"有电"
		]
	},
	{
		"char": "☇",
		"name": "闪电",
		"ename": "Lightning",
		"tags": [
			"天气"
		]
	},
	{
		"char": "☈",
		"name": "雷暴",
		"ename": "Thunderstorm",
		"tags": [
			"天气"
		]
	},
	{
		"char": "⛅",
		"name": "云后太阳",
		"ename": "Sun Behind Cloud",
		"tags": [
			"天气"
		],
		"alias": [
			"多云",
			"乌云蔽日",
			"阴"
		]
	},
	{
		"char": "⛆",
		"name": "雨",
		"ename": "Rain",
		"tags": [
			"天气"
		]
	},
	{
		"char": "⛈",
		"name": "暴风雨",
		"ename": "THUNDER CLOUD AND RAIN",
		"tags": [
			"天气"
		],
		"alias": [
			"阵雨",
			"雨",
			"雷",
			"雷暴",
			"雷阵雨"
		]
	},
	{
		"char": "⛉",
		"name": "雾",
		"ename": "Fog",
		"tags": [
			"天气"
		]
	},
	{
		"char": "⛊",
		"name": "雾",
		"ename": "Fog",
		"tags": [
			"天气"
		]
	},
	{
		"char": "⛋",
		"name": "雾",
		"ename": "Fog",
		"tags": [
			"天气"
		]
	},
	{
		"char": "☂",
		"name": "雨伞",
		"ename": "Umbrella",
		"tags": [
			"天气"
		],
		"alias": [
			"雨伞",
			"雨具",
			"伞",
			"雨"
		]
	},
	{
		"char": "☔",
		"name": "带雨滴的雨伞",
		"ename": "Umbrella with Rain Drops",
		"tags": [
			"天气"
		],
		"alias": [
			"雨伞",
			"雨具",
			"下雨",
			"伞",
			"雨滴"
		]
	},
	{
		"char": "☃",
		"name": "雪人",
		"ename": "Snowman",
		"tags": [
			"天气"
		],
		"alias": [
			"雪人",
			"冬天",
			"雪",
			"泠",
			"雪与雪人"
		]
	},
	{
		"char": "⛇",
		"name": "实心雪人",
		"ename": "Solid Snowman",
		"tags": [
			"天气"
		],
		"alias": [
			"雪人",
			"冬天",
			"雪"
		]
	},
	{
		"char": "⛄",
		"name": "雪人无雪",
		"ename": "Snowman Without Snow",
		"tags": [
			"天气"
		],
		"alias": [
			"雪人",
			"冬天",
			"下雪",
			"泠"
		]
	},
	{
		"char": "⛰",
		"name": "山",
		"ename": "Mountain",
		"tags": [
			"地理"
		],
		"alias": [
			"地形",
			"峰"
		]
	},
	{
		"char": "🔥",
		"name": "火",
		"ename": "Fire",
		"tags": [
			"自然现象"
		],
		"alias": [
			"火焰",
			"烧",
			"燃烧"
		]
	},
	{
		"char": "☯",
		"name": "太极·阴阳两仪",
		"ename": "Yin Yang",
		"tags": [
			"《易经》符号（八卦、六十四卦）"
		],
		"alias": [
			"易经",
			"道教",
			"太极",
			"宗教",
			"道",
			"阳",
			"阴",
			"阴阳"
		]
	},
	{
		"char": "⚊",
		"name": "阳爻",
		"ename": "MONOGRAM FOR YANG",
		"tags": [
			"《易经》符号（八卦、六十四卦）"
		],
		"alias": [
			"两仪",
			"阴阳",
			"四象",
			"八卦",
			"易经",
			"道教"
		]
	},
	{
		"char": "⚋",
		"name": "阴爻",
		"ename": "MONOGRAM FOR YIN",
		"tags": [
			"《易经》符号（八卦、六十四卦）"
		],
		"alias": [
			"两仪",
			"阴阳",
			"四象",
			"八卦",
			"易经",
			"道教"
		]
	},
	{
		"char": "⚌",
		"name": "四象·太阳",
		"ename": "MONOGRAM FOR GREATER YANG",
		"tags": [
			"《易经》符号（八卦、六十四卦）"
		],
		"alias": [
			"四象",
			"八卦",
			"易经",
			"道教"
		]
	},
	{
		"char": "⚍",
		"name": "四象·少阴",
		"ename": "MONOGRAM FOR LESSER YIN",
		"tags": [
			"《易经》符号（八卦、六十四卦）"
		],
		"alias": [
			"四象",
			"八卦",
			"易经",
			"道教"
		]
	},
	{
		"char": "⚎",
		"name": "四象·少阳",
		"ename": "MONOGRAM FOR LESSER YANG",
		"tags": [
			"《易经》符号（八卦、六十四卦）"
		],
		"alias": [
			"四象",
			"八卦",
			"易经",
			"道教"
		]
	},
	{
		"char": "⚏",
		"name": "四象·太阴",
		"ename": "MONOGRAM FOR GREATER YIN",
		"tags": [
			"《易经》符号（八卦、六十四卦）"
		],
		"alias": [
			"四象",
			"八卦",
			"易经",
			"道教"
		]
	},
	{
		"char": "☰",
		"name": "八卦·乾（天）",
		"ename": "Qian (Heaven)",
		"tags": [
			"《易经》符号（八卦、六十四卦）"
		],
		"alias": [
			"易经",
			"道教"
		]
	},
	{
		"char": "☱",
		"name": "八卦·兑（沼泽）",
		"ename": "Dui (Lake)",
		"tags": [
			"《易经》符号（八卦、六十四卦）"
		],
		"alias": [
			"易经",
			"道教"
		]
	},
	{
		"char": "☲",
		"name": "八卦·离（火）",
		"ename": "Li (Fire)",
		"tags": [
			"《易经》符号（八卦、六十四卦）"
		],
		"alias": [
			"易经",
			"道教"
		]
	},
	{
		"char": "☳",
		"name": "八卦·震（雷）",
		"ename": "Zhen (Thunder)",
		"tags": [
			"《易经》符号（八卦、六十四卦）"
		],
		"alias": [
			"易经",
			"道教"
		]
	},
	{
		"char": "☴",
		"name": "八卦·巽（风）",
		"ename": "Xun (Wind)",
		"tags": [
			"《易经》符号（八卦、六十四卦）"
		],
		"alias": [
			"易经",
			"道教"
		]
	},
	{
		"char": "☵",
		"name": "八卦·坎（水）",
		"ename": "Kan (Water)",
		"tags": [
			"《易经》符号（八卦、六十四卦）"
		],
		"alias": [
			"易经",
			"道教"
		]
	},
	{
		"char": "☶",
		"name": "八卦·艮（山）",
		"ename": "Gen (Mountain)",
		"tags": [
			"《易经》符号（八卦、六十四卦）"
		],
		"alias": [
			"易经",
			"道教"
		]
	},
	{
		"char": "☷",
		"name": "八卦·坤（地）",
		"ename": "Kun (Earth)",
		"tags": [
			"《易经》符号（八卦、六十四卦）"
		],
		"alias": [
			"易经",
			"道教"
		]
	},
	{
		"char": "䷀",
		"name": "六十四卦·乾卦",
		"ename": "Qian Hexagram",
		"tags": [
			"《易经》符号（八卦、六十四卦）"
		],
		"alias": [
			"易经",
			"道教"
		]
	},
	{
		"char": "䷁",
		"name": "六十四卦·坤卦",
		"ename": "Kun Hexagram",
		"tags": [
			"《易经》符号（八卦、六十四卦）"
		],
		"alias": [
			"易经",
			"道教"
		]
	},
	{
		"char": "䷂",
		"name": "六十四卦·屯卦",
		"ename": "Chun Hexagram",
		"tags": [
			"《易经》符号（八卦、六十四卦）"
		],
		"alias": [
			"易经",
			"道教"
		]
	},
	{
		"char": "䷃",
		"name": "六十四卦·蒙卦",
		"ename": "Meng Hexagram",
		"tags": [
			"《易经》符号（八卦、六十四卦）"
		],
		"alias": [
			"易经",
			"道教"
		]
	},
	{
		"char": "䷄",
		"name": "六十四卦·需卦",
		"ename": "Xu Hexagram",
		"tags": [
			"《易经》符号（八卦、六十四卦）"
		],
		"alias": [
			"易经",
			"道教"
		]
	},
	{
		"char": "䷅",
		"name": "六十四卦·讼卦",
		"ename": "Song Hexagram",
		"tags": [
			"《易经》符号（八卦、六十四卦）"
		],
		"alias": [
			"易经",
			"道教"
		]
	},
	{
		"char": "䷆",
		"name": "六十四卦·师卦",
		"ename": "Shi Hexagram",
		"tags": [
			"《易经》符号（八卦、六十四卦）"
		],
		"alias": [
			"易经",
			"道教"
		]
	},
	{
		"char": "䷇",
		"name": "六十四卦·比卦",
		"ename": "Bi Hexagram",
		"tags": [
			"《易经》符号（八卦、六十四卦）"
		],
		"alias": [
			"易经",
			"道教"
		]
	},
	{
		"char": "䷈",
		"name": "六十四卦·小畜卦",
		"ename": "Xiao Chu Hexagram",
		"tags": [
			"《易经》符号（八卦、六十四卦）"
		],
		"alias": [
			"易经",
			"道教"
		]
	},
	{
		"char": "䷉",
		"name": "六十四卦·履卦",
		"ename": "Lu Hexagram",
		"tags": [
			"《易经》符号（八卦、六十四卦）"
		],
		"alias": [
			"易经",
			"道教"
		]
	},
	{
		"char": "䷊",
		"name": "六十四卦·泰卦",
		"ename": "Tai Hexagram",
		"tags": [
			"《易经》符号（八卦、六十四卦）"
		],
		"alias": [
			"易经",
			"道教"
		]
	},
	{
		"char": "䷋",
		"name": "六十四卦·否卦",
		"ename": "Pi Hexagram",
		"tags": [
			"《易经》符号（八卦、六十四卦）"
		],
		"alias": [
			"易经",
			"道教"
		]
	},
	{
		"char": "䷌",
		"name": "六十四卦·同人卦",
		"ename": "Tong Ren Hexagram",
		"tags": [
			"《易经》符号（八卦、六十四卦）"
		],
		"alias": [
			"易经",
			"道教"
		]
	},
	{
		"char": "䷍",
		"name": "六十四卦·大有卦",
		"ename": "Da You Hexagram",
		"tags": [
			"《易经》符号（八卦、六十四卦）"
		],
		"alias": [
			"易经",
			"道教"
		]
	},
	{
		"char": "䷎",
		"name": "六十四卦·谦卦",
		"ename": "Qian Hexagram",
		"tags": [
			"《易经》符号（八卦、六十四卦）"
		],
		"alias": [
			"易经",
			"道教"
		]
	},
	{
		"char": "䷏",
		"name": "六十四卦·豫卦",
		"ename": "Yu Hexagram",
		"tags": [
			"《易经》符号（八卦、六十四卦）"
		],
		"alias": [
			"易经",
			"道教"
		]
	},
	{
		"char": "䷐",
		"name": "六十四卦·随卦",
		"ename": "Sui Hexagram",
		"tags": [
			"《易经》符号（八卦、六十四卦）"
		],
		"alias": [
			"易经",
			"道教"
		]
	},
	{
		"char": "䷑",
		"name": "六十四卦·蛊卦",
		"ename": "Gu Hexagram",
		"tags": [
			"《易经》符号（八卦、六十四卦）"
		],
		"alias": [
			"易经",
			"道教"
		]
	},
	{
		"char": "䷒",
		"name": "六十四卦·临卦",
		"ename": "Lin Hexagram",
		"tags": [
			"《易经》符号（八卦、六十四卦）"
		],
		"alias": [
			"易经",
			"道教"
		]
	},
	{
		"char": "䷓",
		"name": "六十四卦·观卦",
		"ename": "Guan Hexagram",
		"tags": [
			"《易经》符号（八卦、六十四卦）"
		],
		"alias": [
			"易经",
			"道教"
		]
	},
	{
		"char": "䷔",
		"name": "六十四卦·噬嗑卦",
		"ename": "Shi He Hexagram",
		"tags": [
			"《易经》符号（八卦、六十四卦）"
		],
		"alias": [
			"易经",
			"道教"
		]
	},
	{
		"char": "䷕",
		"name": "六十四卦·贲卦",
		"ename": "Bi Hexagram",
		"tags": [
			"《易经》符号（八卦、六十四卦）"
		],
		"alias": [
			"易经",
			"道教"
		]
	},
	{
		"char": "䷖",
		"name": "六十四卦·剥卦",
		"ename": "Bo Hexagram",
		"tags": [
			"《易经》符号（八卦、六十四卦）"
		],
		"alias": [
			"易经",
			"道教"
		]
	},
	{
		"char": "䷗",
		"name": "六十四卦·复卦",
		"ename": "Fu Hexagram",
		"tags": [
			"《易经》符号（八卦、六十四卦）"
		],
		"alias": [
			"易经",
			"道教"
		]
	},
	{
		"char": "䷘",
		"name": "六十四卦·无妄卦",
		"ename": "Wu Wang Hexagram",
		"tags": [
			"《易经》符号（八卦、六十四卦）"
		],
		"alias": [
			"易经",
			"道教"
		]
	},
	{
		"char": "䷙",
		"name": "六十四卦·大畜卦",
		"ename": "Da Chu Hexagram",
		"tags": [
			"《易经》符号（八卦、六十四卦）"
		],
		"alias": [
			"易经",
			"道教"
		]
	},
	{
		"char": "䷚",
		"name": "六十四卦·颐卦",
		"ename": "Yi Hexagram",
		"tags": [
			"《易经》符号（八卦、六十四卦）"
		],
		"alias": [
			"易经",
			"道教"
		]
	},
	{
		"char": "䷛",
		"name": "六十四卦·大过卦",
		"ename": "Da Guo Hexagram",
		"tags": [
			"《易经》符号（八卦、六十四卦）"
		],
		"alias": [
			"易经",
			"道教"
		]
	},
	{
		"char": "䷜",
		"name": "六十四卦·坎卦",
		"ename": "Kan Hexagram",
		"tags": [
			"《易经》符号（八卦、六十四卦）"
		],
		"alias": [
			"易经",
			"道教"
		]
	},
	{
		"char": "䷝",
		"name": "六十四卦·离卦",
		"ename": "Li Hexagram",
		"tags": [
			"《易经》符号（八卦、六十四卦）"
		],
		"alias": [
			"易经",
			"道教"
		]
	},
	{
		"char": "䷞",
		"name": "六十四卦·咸卦",
		"ename": "Xian Hexagram",
		"tags": [
			"《易经》符号（八卦、六十四卦）"
		],
		"alias": [
			"易经",
			"道教"
		]
	},
	{
		"char": "䷟",
		"name": "六十四卦·恒卦",
		"ename": "Heng Hexagram",
		"tags": [
			"《易经》符号（八卦、六十四卦）"
		],
		"alias": [
			"易经",
			"道教"
		]
	},
	{
		"char": "䷠",
		"name": "六十四卦·遁卦",
		"ename": "Dun Hexagram",
		"tags": [
			"《易经》符号（八卦、六十四卦）"
		],
		"alias": [
			"易经",
			"道教"
		]
	},
	{
		"char": "䷡",
		"name": "六十四卦·大壮卦",
		"ename": "Da Zhuang Hexagram",
		"tags": [
			"《易经》符号（八卦、六十四卦）"
		],
		"alias": [
			"易经",
			"道教"
		]
	},
	{
		"char": "䷢",
		"name": "六十四卦·晋卦",
		"ename": "Jin Hexagram",
		"tags": [
			"《易经》符号（八卦、六十四卦）"
		],
		"alias": [
			"易经",
			"道教"
		]
	},
	{
		"char": "䷣",
		"name": "六十四卦·明夷卦",
		"ename": "Ming Yi Hexagram",
		"tags": [
			"《易经》符号（八卦、六十四卦）"
		],
		"alias": [
			"易经",
			"道教"
		]
	},
	{
		"char": "䷤",
		"name": "六十四卦·家人卦",
		"ename": "Jia Ren Hexagram",
		"tags": [
			"《易经》符号（八卦、六十四卦）"
		],
		"alias": [
			"易经",
			"道教"
		]
	},
	{
		"char": "䷥",
		"name": "六十四卦·睽卦",
		"ename": "Kui Hexagram",
		"tags": [
			"《易经》符号（八卦、六十四卦）"
		],
		"alias": [
			"易经",
			"道教"
		]
	},
	{
		"char": "䷦",
		"name": "六十四卦·蹇卦",
		"ename": "Jian Hexagram",
		"tags": [
			"《易经》符号（八卦、六十四卦）"
		],
		"alias": [
			"易经",
			"道教"
		]
	},
	{
		"char": "䷧",
		"name": "六十四卦·解卦",
		"ename": "Jie Hexagram",
		"tags": [
			"《易经》符号（八卦、六十四卦）"
		],
		"alias": [
			"易经",
			"道教"
		]
	},
	{
		"char": "䷨",
		"name": "六十四卦·损卦",
		"ename": "Sun Hexagram",
		"tags": [
			"《易经》符号（八卦、六十四卦）"
		],
		"alias": [
			"易经",
			"道教"
		]
	},
	{
		"char": "䷩",
		"name": "六十四卦·益卦",
		"ename": "Yi Hexagram",
		"tags": [
			"《易经》符号（八卦、六十四卦）"
		],
		"alias": [
			"易经",
			"道教"
		]
	},
	{
		"char": "䷪",
		"name": "六十四卦·夬卦",
		"ename": "Guai Hexagram",
		"tags": [
			"《易经》符号（八卦、六十四卦）"
		],
		"alias": [
			"易经",
			"道教"
		]
	},
	{
		"char": "䷫",
		"name": "六十四卦·姤卦",
		"ename": "Gou Hexagram",
		"tags": [
			"《易经》符号（八卦、六十四卦）"
		],
		"alias": [
			"易经",
			"道教"
		]
	},
	{
		"char": "䷬",
		"name": "六十四卦·萃卦",
		"ename": "Cui Hexagram",
		"tags": [
			"《易经》符号（八卦、六十四卦）"
		],
		"alias": [
			"易经",
			"道教"
		]
	},
	{
		"char": "䷭",
		"name": "六十四卦·升卦",
		"ename": "Sheng Hexagram",
		"tags": [
			"《易经》符号（八卦、六十四卦）"
		],
		"alias": [
			"易经",
			"道教"
		]
	},
	{
		"char": "䷮",
		"name": "六十四卦·困卦",
		"ename": "Kun Hexagram",
		"tags": [
			"《易经》符号（八卦、六十四卦）"
		],
		"alias": [
			"易经",
			"道教"
		]
	},
	{
		"char": "䷯",
		"name": "六十四卦·井卦",
		"ename": "Jing Hexagram",
		"tags": [
			"《易经》符号（八卦、六十四卦）"
		],
		"alias": [
			"易经",
			"道教"
		]
	},
	{
		"char": "䷰",
		"name": "六十四卦·革卦",
		"ename": "Ge Hexagram",
		"tags": [
			"《易经》符号（八卦、六十四卦）"
		],
		"alias": [
			"易经",
			"道教"
		]
	},
	{
		"char": "䷱",
		"name": "六十四卦·鼎卦",
		"ename": "Ding Hexagram",
		"tags": [
			"《易经》符号（八卦、六十四卦）"
		],
		"alias": [
			"易经",
			"道教"
		]
	},
	{
		"char": "䷲",
		"name": "六十四卦·震卦",
		"ename": "Zhen Hexagram",
		"tags": [
			"《易经》符号（八卦、六十四卦）"
		],
		"alias": [
			"易经",
			"道教"
		]
	},
	{
		"char": "䷳",
		"name": "六十四卦·艮卦",
		"ename": "Gen Hexagram",
		"tags": [
			"《易经》符号（八卦、六十四卦）"
		],
		"alias": [
			"易经",
			"道教"
		]
	},
	{
		"char": "䷴",
		"name": "六十四卦·渐卦",
		"ename": "Jian Hexagram",
		"tags": [
			"《易经》符号（八卦、六十四卦）"
		],
		"alias": [
			"易经",
			"道教"
		]
	},
	{
		"char": "䷵",
		"name": "六十四卦·归妹卦",
		"ename": "Gui Mei Hexagram",
		"tags": [
			"《易经》符号（八卦、六十四卦）"
		],
		"alias": [
			"易经",
			"道教"
		]
	},
	{
		"char": "䷶",
		"name": "六十四卦·丰卦",
		"ename": "Feng Hexagram",
		"tags": [
			"《易经》符号（八卦、六十四卦）"
		],
		"alias": [
			"易经",
			"道教"
		]
	},
	{
		"char": "䷷",
		"name": "六十四卦·旅卦",
		"ename": "Lv Hexagram",
		"tags": [
			"《易经》符号（八卦、六十四卦）"
		],
		"alias": [
			"易经",
			"道教"
		]
	},
	{
		"char": "䷸",
		"name": "六十四卦·巽卦",
		"ename": "Xun Hexagram",
		"tags": [
			"《易经》符号（八卦、六十四卦）"
		],
		"alias": [
			"易经",
			"道教"
		]
	},
	{
		"char": "䷹",
		"name": "六十四卦·兑卦",
		"ename": "Dui Hexagram",
		"tags": [
			"《易经》符号（八卦、六十四卦）"
		],
		"alias": [
			"易经",
			"道教"
		]
	},
	{
		"char": "䷺",
		"name": "六十四卦·涣卦",
		"ename": "Huan Hexagram",
		"tags": [
			"《易经》符号（八卦、六十四卦）"
		],
		"alias": [
			"易经",
			"道教"
		]
	},
	{
		"char": "䷻",
		"name": "六十四卦·节卦",
		"ename": "Jie Hexagram",
		"tags": [
			"《易经》符号（八卦、六十四卦）"
		],
		"alias": [
			"易经",
			"道教"
		]
	},
	{
		"char": "䷼",
		"name": "六十四卦·中孚卦",
		"ename": "Zhong Fu Hexagram",
		"tags": [
			"《易经》符号（八卦、六十四卦）"
		],
		"alias": [
			"易经",
			"道教"
		]
	},
	{
		"char": "䷽",
		"name": "六十四卦·小过卦",
		"ename": "Xiao Guo Hexagram",
		"tags": [
			"《易经》符号（八卦、六十四卦）"
		],
		"alias": [
			"易经",
			"道教"
		]
	},
	{
		"char": "䷾",
		"name": "六十四卦·既济卦",
		"ename": "Ji Ji Hexagram",
		"tags": [
			"《易经》符号（八卦、六十四卦）"
		],
		"alias": [
			"易经",
			"道教"
		]
	},
	{
		"char": "䷿",
		"name": "六十四卦·未济卦",
		"ename": "Wei Ji Hexagram",
		"tags": [
			"《易经》符号（八卦、六十四卦）"
		],
		"alias": [
			"易经",
			"道教"
		]
	},
	{
		"char": "𝌀",
		"name": "单爻（地）",
		"ename": "Monogram for Earth",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝌁",
		"name": "双爻（天地区）",
		"ename": "Digram for Heavenly Earth",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝌂",
		"name": "双爻（人地区）",
		"ename": "Digram for Human Earth",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝌃",
		"name": "双爻（地天区）",
		"ename": "Digram for Earthly Heaven",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝌄",
		"name": "双爻（地人区）",
		"ename": "Digram for Earthly Human",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝌅",
		"name": "双爻（地区）",
		"ename": "Digram for Earth",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝌆",
		"name": "八十一首·中",
		"ename": "Tetragram for Centre",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝌇",
		"name": "八十一首·周",
		"ename": "Tetragram for Full Circle",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝌈",
		"name": "八十一首·礥",
		"ename": "Tetragram for Mired",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝌉",
		"name": "八十一首·闲/閑",
		"ename": "Tetragram for Barrier",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝌊",
		"name": "八十一首·少",
		"ename": "Tetragram for Keeping Small",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝌋",
		"name": "八十一首·戾",
		"ename": "Tetragram for Contrariety",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝌌",
		"name": "八十一首·上",
		"ename": "Tetragram for Ascent",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝌍",
		"name": "八十一首·干",
		"ename": "Tetragram for Opposition",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝌎",
		"name": "八十一首·狩",
		"ename": "Tetragram for Branching Out",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝌏",
		"name": "八十一首·羡",
		"ename": "Tetragram for Defectiveness or Distortion",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝌐",
		"name": "八十一首·差",
		"ename": "Tetragram for Divergence",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝌑",
		"name": "八十一首·重",
		"ename": "Tetragram for Youthfulness",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝌒",
		"name": "八十一首·增",
		"ename": "Tetragram for Increase",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝌓",
		"name": "八十一首·锐/銳",
		"ename": "Tetragram for Penetration",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝌔",
		"name": "八十一首·达/達",
		"ename": "Tetragram for Reach",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝌕",
		"name": "八十一首·交",
		"ename": "Tetragram for Contact",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝌖",
		"name": "八十一首·耎/䎡",
		"ename": "Tetragram for Holding Back",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝌗",
		"name": "八十一首·徯",
		"ename": "Tetragram for Waiting",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝌘",
		"name": "八十一首·从/從",
		"ename": "Tetragram for Following",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝌙",
		"name": "八十一首·进/進",
		"ename": "Tetragram for Advance",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝌚",
		"name": "八十一首·释/釋",
		"ename": "Tetragram for Release",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝌛",
		"name": "八十一首·格",
		"ename": "Tetragram for Resistance",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝌜",
		"name": "八十一首·夷",
		"ename": "Tetragram for Ease",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝌝",
		"name": "八十一首·乐/樂",
		"ename": "Tetragram for Joy",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝌞",
		"name": "八十一首·争/爭",
		"ename": "Tetragram for Contention",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝌟",
		"name": "八十一首·务/務",
		"ename": "Tetragram for Endeavour",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝌠",
		"name": "八十一首·事",
		"ename": "Tetragram for Duties",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝌡",
		"name": "八十一首·更",
		"ename": "Tetragram for Change",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝌢",
		"name": "八十一首·断/斷",
		"ename": "Tetragram for Decisiveness",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝌣",
		"name": "八十一首·榖",
		"ename": "Tetragram for Bold Resolution",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝌤",
		"name": "八十一首·裝",
		"ename": "Tetragram for Packing",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝌥",
		"name": "八十一首·众/眾",
		"ename": "Tetragram for Legion",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝌦",
		"name": "八十一首·密",
		"ename": "Tetragram for Closeness",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝌧",
		"name": "八十一首·亲/親",
		"ename": "Tetragram for Kinship",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝌨",
		"name": "八十一首·敛/歛",
		"ename": "Tetragram for Gathering",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝌩",
		"name": "八十一首·彊",
		"ename": "Tetragram for Strength",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝌪",
		"name": "八十一首·晬",
		"ename": "Tetragram for Purity",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝌫",
		"name": "八十一首·盛",
		"ename": "Tetragram for Fullness",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝌬",
		"name": "八十一首·居",
		"ename": "Tetragram for Residence",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝌭",
		"name": "八十一首·法",
		"ename": "Tetragram for Law or Model",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝌮",
		"name": "八十一首·应/應",
		"ename": "Tetragram for Response",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝌯",
		"name": "八十一首·迎",
		"ename": "Tetragram for Meeting",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝌰",
		"name": "八十一首·遇",
		"ename": "Tetragram for Encounter",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝌱",
		"name": "八十一首·灶/竈",
		"ename": "Tetragram for Stove",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝌲",
		"name": "八十一首·大",
		"ename": "Tetragram for Greatness",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝌳",
		"name": "八十一首·廓",
		"ename": "Tetragram for Enlargement",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝌴",
		"name": "八十一首·文",
		"ename": "Tetragram for Pattern",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝌵",
		"name": "八十一首·礼/禮",
		"ename": "Tetragram for Ritual",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝌶",
		"name": "八十一首·逃",
		"ename": "Tetragram for Flight",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝌷",
		"name": "八十一首·唐",
		"ename": "Tetragram for Extravagance",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝌸",
		"name": "八十一首·常",
		"ename": "Tetragram for Constancy",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝌹",
		"name": "八十一首·度",
		"ename": "Tetragram for Measure",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝌺",
		"name": "八十一首·永",
		"ename": "Tetragram for Eternity",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝌻",
		"name": "八十一首·昆",
		"ename": "Tetragram for Unity",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝌼",
		"name": "八十一首·灭/滅",
		"ename": "Tetragram for Decrease",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝌽",
		"name": "八十一首·唫",
		"ename": "Tetragram for Stoppage",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝌾",
		"name": "八十一首·守",
		"ename": "Tetragram for Guardedness",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝌿",
		"name": "八十一首·翕",
		"ename": "Tetragram for Contraction",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝍀",
		"name": "八十一首·聚",
		"ename": "Tetragram for Gathering",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝍁",
		"name": "八十一首·积/積",
		"ename": "Tetragram for Accumulation",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝍂",
		"name": "八十一首·饰/飾",
		"ename": "Tetragram for Embellishment",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝍃",
		"name": "八十一首·疑",
		"ename": "Tetragram for Doubt",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝍄",
		"name": "八十一首·视/視",
		"ename": "Tetragram for Watch",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝍅",
		"name": "八十一首·沈",
		"ename": "Tetragram for Sinking",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝍆",
		"name": "八十一首·内/內",
		"ename": "Tetragram for Inner",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝍇",
		"name": "八十一首·去",
		"ename": "Tetragram for Departure",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝍈",
		"name": "八十一首·晦",
		"ename": "Tetragram for Darkening",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝍉",
		"name": "八十一首·瞢",
		"ename": "Tetragram for Dimming",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝍊",
		"name": "八十一首·穷/窮",
		"ename": "Tetragram for Exhaustion",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝍋",
		"name": "八十一首·割",
		"ename": "Tetragram for Severance",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝍌",
		"name": "八十一首·止",
		"ename": "Tetragram for Stoppage",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝍍",
		"name": "八十一首·坚/堅",
		"ename": "Tetragram for Hardness",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝍎",
		"name": "八十一首·成",
		"ename": "Tetragram for Completion",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝍏",
		"name": "八十一首·阙/闕",
		"ename": "Tetragram for Closure",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝍐",
		"name": "八十一首·矢",
		"ename": "Tetragram for Failure",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝍑",
		"name": "八十一首·剧/劇",
		"ename": "Tetragram for Aggravation",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝍒",
		"name": "八十一首·驯/馴",
		"ename": "Tetragram for Compliance",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝍓",
		"name": "八十一首·将/將",
		"ename": "Tetragram for On the Verge",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝍔",
		"name": "八十一首·难/難",
		"ename": "Tetragram for Difficulties",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝍕",
		"name": "八十一首·勤/勤",
		"ename": "Tetragram for Labouring",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "𝍖",
		"name": "八十一首·养/養",
		"ename": "Tetragram for Fostering",
		"tags": [
			"《太玄经》符号（八十一首）"
		]
	},
	{
		"char": "☸",
		"name": "佛教法轮",
		"ename": "WHEEL OF DHARMA",
		"tags": [
			"哲学、宗教、神秘学"
		],
		"alias": [
			"佛",
			"宗教",
			"法轮",
			"舵",
			"轮盘",
			"达摩"
		]
	},
	{
		"char": "☥",
		"name": "生命之符",
		"ename": "Ankh",
		"tags": [
			"哲学、宗教、神秘学"
		],
		"alias": [
			"安卡",
			"安克",
			"埃及"
		]
	},
	{
		"char": "☤",
		"name": "商神杖",
		"ename": "Caduceus",
		"tags": [
			"哲学、宗教、神秘学"
		],
		"alias": [
			"墨丘利的节杖",
			"古希腊"
		]
	},
	{
		"char": "☓",
		"name": "圣安德鲁十字",
		"ename": "St Andrew's Cross",
		"tags": [
			"哲学、宗教、神秘学"
		],
		"alias": [
			"基督教"
		]
	},
	{
		"char": "☦",
		"name": "东正教十字",
		"ename": "Orthodox Cross",
		"tags": [
			"哲学、宗教、神秘学"
		],
		"alias": [
			"基督教",
			"东正教",
			"东正教十字架",
			"十字架",
			"基督",
			"宗教",
			"正教会十字"
		]
	},
	{
		"char": "☧",
		"name": "基督符号",
		"ename": "Chi Rho",
		"tags": [
			"哲学、宗教、神秘学"
		],
		"alias": [
			"基督教"
		]
	},
	{
		"char": "☨",
		"name": "洛林十字",
		"ename": "Cross of Lorraine",
		"tags": [
			"哲学、宗教、神秘学"
		],
		"alias": [
			"基督教",
			"法国"
		]
	},
	{
		"char": "☩",
		"name": "耶路撒冷十字",
		"ename": "Cross of Jerusalem",
		"tags": [
			"哲学、宗教、神秘学"
		],
		"alias": [
			"基督教"
		]
	},
	{
		"char": "♰",
		"name": "西叙利亚十字",
		"ename": "West Syriac Cross",
		"tags": [
			"哲学、宗教、神秘学"
		],
		"alias": [
			"十字",
			"基督教"
		]
	},
	{
		"char": "♱",
		"name": "东叙利亚十字",
		"ename": "East Syriac Cross",
		"tags": [
			"哲学、宗教、神秘学"
		],
		"alias": [
			"十字",
			"基督教"
		]
	},
	{
		"char": "⛝",
		"name": "交叉十字",
		"ename": "SQUARED SALTIRE",
		"tags": [
			"哲学、宗教、神秘学"
		],
		"alias": [
			"符号",
			"宗教"
		]
	},
	{
		"char": "☪",
		"name": "星月",
		"ename": "Star and Crescent",
		"tags": [
			"哲学、宗教、神秘学"
		],
		"alias": [
			"伊斯兰教",
			"伊斯兰",
			"宗教",
			"斋戒月",
			"穆斯林"
		]
	},
	{
		"char": "☫",
		"name": "法拉瓦哈",
		"ename": "Faravahar",
		"tags": [
			"哲学、宗教、神秘学"
		],
		"alias": [
			"伊朗"
		]
	},
	{
		"char": "☬",
		"name": "坎达（锡克教符号）",
		"ename": "Khanda",
		"tags": [
			"哲学、宗教、神秘学"
		],
		"alias": [
			"印度"
		]
	},
	{
		"char": "☭",
		"name": "镰刀锤子",
		"ename": "Hammer and Sickle",
		"tags": [
			"哲学、宗教、神秘学"
		],
		"alias": [
			"共产党",
			"苏维埃",
			"苏联"
		]
	},
	{
		"char": "⛤",
		"name": "五角星",
		"ename": "Pentagram",
		"tags": [
			"哲学、宗教、神秘学"
		],
		"alias": [
			"五角星",
			"魔法"
		]
	},
	{
		"char": "⛥",
		"name": "右手交织五角星",
		"ename": "Right-Handed Interlaced Pentagram",
		"tags": [
			"哲学、宗教、神秘学"
		],
		"alias": [
			"神秘学",
			"炼金术"
		]
	},
	{
		"char": "⛦",
		"name": "左手交织五角星",
		"ename": "Left-Handed Interlaced Pentagram",
		"tags": [
			"哲学、宗教、神秘学"
		],
		"alias": [
			"基督教",
			"东正教"
		]
	},
	{
		"char": "⛧",
		"name": "倒五角星",
		"ename": "Inverted Pentagram",
		"tags": [
			"哲学、宗教、神秘学"
		],
		"alias": [
			"倒置",
			"基督教"
		]
	},
	{
		"char": "⛨",
		"name": "盾牌实心十字",
		"ename": "Solid Cross On Shield",
		"tags": [
			"哲学、宗教、神秘学"
		],
		"alias": [
			"盾牌"
		]
	},
	{
		"char": "⛩",
		"name": "神道教神社",
		"ename": "Shinto Shrine",
		"tags": [
			"哲学、宗教、神秘学"
		],
		"alias": [
			"宗教",
			"日本",
			"神社",
			"神道教"
		]
	},
	{
		"char": "⛪",
		"name": "教堂",
		"ename": "Church",
		"tags": [
			"哲学、宗教、神秘学"
		],
		"alias": [
			"基督",
			"基督教",
			"宗教",
			"小教堂"
		]
	},
	{
		"char": "⚸",
		"name": "黑月莉莉丝",
		"ename": "Black Moon Lilith",
		"tags": [
			"哲学、宗教、神秘学"
		],
		"alias": [
			"黑月",
			"占星术"
		]
	},
	{
		"char": "⚹",
		"name": "六分相",
		"ename": "Sextile",
		"tags": [
			"哲学、宗教、神秘学"
		],
		"alias": [
			"六分相",
			"占星术"
		]
	},
	{
		"char": "⚺",
		"name": "十二分相",
		"ename": "Semisextile",
		"tags": [
			"哲学、宗教、神秘学"
		],
		"alias": [
			"半六分相",
			"占星术"
		]
	},
	{
		"char": "⚻",
		"name": "梅花相",
		"ename": "Quincunx",
		"tags": [
			"哲学、宗教、神秘学"
		],
		"alias": [
			"梅花相",
			"占星术"
		]
	},
	{
		"char": "⚼",
		"name": "倍八分相",
		"ename": "Sesquiquadrate",
		"tags": [
			"哲学、宗教、神秘学"
		],
		"alias": [
			"倍半四分相",
			"占星术"
		]
	}
];

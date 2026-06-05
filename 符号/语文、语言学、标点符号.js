const data = {
	name: '语文、语言学、标点符号',
	groups: [
		{
			name: '西文字母变体',
			symbols: []
		},
		{
			name: '音标',
			symbols: []
		},
		{
			name: '平假名',
			symbols: []
		},
		{
			name: '片假名',
			symbols: []
		},
		{
			name: "括号和引号",
			symbols: [
				{char: "（", name: "全角括号", ename: "Fullwidth Parenthesis"},
				{char: "）", name: "全角括号", ename: "Fullwidth Parenthesis"},
				{char: "〔", name: "龟甲括号", ename: "Torgoise Shell Bracket"},
				{char: "〕", name: "龟甲括号", ename: "Torgoise Shell Bracket"},
				{char: "【", name: "全角龟甲括号", ename: "Fullwidth Tortoise Shell Bracket"},
				{char: "】", name: "全角龟甲括号", ename: "Fullwidth Tortoise Shell Bracket"},
				{char: "《", name: "双尖括号", ename: "Double Angle Bracket", tags: ["书名号"]},
				{char: "》", name: "双尖括号", ename: "Double Angle Bracket", tags: ["书名号"]},
				{char: "〈", name: "单尖括号", ename: "Single Angle Bracket", tags: ["书名号"]},
				{char: "〉", name: "单尖括号", ename: "Single Angle Bracket", tags: ["书名号"]},
				{char: "『", name: "空心透镜括号", ename: "Hollow Lenticular Bracket"},
				{char: "』", name: "空心透镜括号", ename: "Hollow Lenticular Bracket"},
				{char: "「", name: "空心角括号", ename: "Hollow Corner Bracket"},
				{char: "」", name: "空心角括号", ename: "Hollow Corner Bracket"},
				{char: "﹃", name: "竖排左双引号", ename: "Presentation Form for Vertical Left Double Quotation Mark"},
				{
					char: "﹄",
					name: "竖排右双引号",
					ename: "Presentation Form for Vertical Right Double Quotation Mark"
				},
				{char: "‘", name: "左单引号", ename: "Left Single Quotation Mark"},
				{char: "’", name: "右单引号", ename: "Right Single Quotation Mark"},
				{char: "“", name: "左双引号", ename: "Left Double Quotation Mark"},
				{char: "”", name: "右双引号", ename: "Right Double Quotation Mark"}
			]
		},
		{
			name: "CJK符号和标点",
			symbols: [
				{char: "　", name: "表意空格", ename: "Ideographic Space"},
				{char: "、", name: "顿号", ename: "Ideographic Comma"},
				{char: "。", name: "句号", ename: "Ideographic Full Stop"},
				{char: "〃", name: "同上符号", ename: "Ditto Mark"},
				{char: "〄", name: "日本工业标准符号", ename: "Japanese Industrial Standard Symbol"},
				{char: "々", name: "表意重复符号", ename: "Ideographic Iteration Mark"},
				{char: "〆", name: "表意结束符号", ename: "Ideographic Closing Mark"},
				{char: "〇", name: "表意数字零", ename: "Ideographic Number Zero"},
				{char: "〈", name: "左尖括号", ename: "Left Angle Bracket"},
				{char: "〉", name: "右尖括号", ename: "Right Angle Bracket"},
				{char: "《", name: "左双尖括号", ename: "Left Double Angle Bracket"},
				{char: "》", name: "右双尖括号", ename: "Right Double Angle Bracket"},
				{char: "「", name: "左空心角括号", ename: "Left Corner Bracket"},
				{char: "」", name: "右空心角括号", ename: "Right Corner Bracket"},
				{char: "『", name: "左空心透镜括号", ename: "Left Hollow Corner Bracket"},
				{char: "』", name: "右空心透镜括号", ename: "Right Hollow Corner Bracket"},
				{char: "【", name: "左实心透镜括号", ename: "Left Solid Lenticular Bracket"},
				{char: "】", name: "右实心透镜括号", ename: "Right Solid Lenticular Bracket"},
				{char: "〔", name: "左六角括号", ename: "Left Tortoise Shell Bracket"},
				{char: "〕", name: "右六角括号", ename: "Right Tortoise Shell Bracket"},
				{char: "〖", name: "左空心六角括号", ename: "Left Hollow Tortoise Shell Bracket"},
				{char: "〗", name: "右空心六角括号", ename: "Right Hollow Tortoise Shell Bracket"},
				{char: "〶", name: "表意邮政符号", ename: "Ideographic Postal Mark"},
				{char: "〒", name: "邮政符号", ename: "Postal Mark"}
			]
		},
		{
			name: "竖排形式",
			symbols: [
				{char: "︐", name: "竖排逗号", ename: "Presentation Form For Vertical Comma"},
				{char: "︑", name: "竖排顿号", ename: "Presentation Form For Vertical Ideographic Comma"},
				{char: "︒", name: "竖排句号", ename: "Presentation Form For Vertical Ideographic Full Stop"},
				{char: "︓", name: "竖排冒号", ename: "Presentation Form For Vertical Colon"},
				{char: "︔", name: "竖排分号", ename: "Presentation Form For Vertical Semicolon"},
				{char: "︕", name: "竖排感叹号", ename: "Presentation Form For Vertical Exclamation Mark"},
				{char: "︖", name: "竖排问号", ename: "Presentation Form For Vertical Question Mark"},
				{
					char: "︗",
					name: "竖排左括号",
					ename: "Presentation Form For Vertical Left White Lenticular Bracket"
				},
				{
					char: "︘",
					name: "竖排右括号",
					ename: "Presentation Form For Vertical Right White Lenticular Bracket"
				},
				{char: "︙", name: "竖排省略号", ename: "Presentation Form For Vertical Horizontal Ellipsis"}
			]
		},
		{
			name: "CJK兼容形式",
			symbols: [
				{char: "︰", name: "竖排两点引导符", ename: "Presentation Form For Vertical Two Dot Leader"},
				{char: "︱", name: "竖排全角破折号", ename: "Presentation Form For Vertical Em Dash"},
				{char: "︳", name: "竖排下划线", ename: "Presentation Form For Vertical En Dash"},
				{char: "︵", name: "竖排左括号", ename: "Presentation Form For Vertical Left Parenthesis"},
				{char: "︶", name: "竖排右括号", ename: "Presentation Form For Vertical Right Parenthesis"},
				{char: "︷", name: "竖排左花括号", ename: "Presentation Form For Vertical Left Curly Bracket"},
				{char: "︸", name: "竖排右花括号", ename: "Presentation Form For Vertical Right Curly Bracket"},
				{
					char: "︹",
					name: "竖排左六角括号",
					ename: "Presentation Form For Vertical Left Tortoise Shell Bracket"
				},
				{
					char: "︺",
					name: "竖排右六角括号",
					ename: "Presentation Form For Vertical Right Tortoise Shell Bracket"
				},
				{
					char: "︻",
					name: "竖排左实心方括号",
					ename: "Presentation Form For Vertical Left Black Lenticular Bracket"
				},
				{
					char: "︼",
					name: "竖排右实心方括号",
					ename: "Presentation Form For Vertical Right Black Lenticular Bracket"
				},
				{
					char: "︽",
					name: "竖排左双尖括号",
					ename: "Presentation Form For Vertical Left Double Angle Bracket"
				},
				{
					char: "︾",
					name: "竖排右双尖括号",
					ename: "Presentation Form For Vertical Right Double Angle Bracket"
				},
				{char: "︿", name: "竖排左尖括号", ename: "Presentation Form For Vertical Left Angle Bracket"},
				{char: "﹀", name: "竖排右尖括号", ename: "Presentation Form For Vertical Right Angle Bracket"},
				{char: "﹁", name: "竖排左角括号", ename: "Presentation Form For Vertical Left Corner Bracket"},
				{char: "﹂", name: "竖排右角括号", ename: "Presentation Form For Vertical Right Corner Bracket"},
				{
					char: "﹃",
					name: "竖排左空心角括号",
					ename: "Presentation Form For Vertical Left White Corner Bracket"
				},
				{
					char: "﹄",
					name: "竖排右空心角括号",
					ename: "Presentation Form For Vertical Right White Corner Bracket"
				}
			]
		},
		{
			name: "小写变体形式",
			symbols: [
				{char: "﹐", name: "小逗号", ename: "Small Comma"},
				{char: "﹑", name: "小顿号", ename: "Small Ideographic Comma"},
				{char: "﹒", name: "小句号", ename: "Small Full Stop"},
				{char: "﹔", name: "小分号", ename: "Small Semicolon"},
				{char: "﹕", name: "小冒号", ename: "Small Colon"},
				{char: "﹖", name: "小问号", ename: "Small Question Mark"},
				{char: "﹗", name: "小感叹号", ename: "Small Exclamation Mark"},
				{char: "﹙", name: "小左括号", ename: "Small Left Parenthesis"},
				{char: "﹚", name: "小右括号", ename: "Small Right Parenthesis"},
				{char: "﹫", name: "小@符号", ename: "Small Commercial At"},
				{char: "﹟", name: "小井号", ename: "Small Number Sign"},
				{char: "﹩", name: "小美元符号", ename: "Small Dollar Sign"},
				{char: "﹪", name: "小百分比符号", ename: "Small Percent Sign"},
				{char: "﹠", name: "小与符号", ename: "Small Ampersand"}
			]
		},
		{
			name: "半角及全角形式",
			symbols: [
				{char: "！", name: "全角感叹号", ename: "Fullwidth Exclamation Mark"},
				{char: "＂", name: "全角引号", ename: "Fullwidth Quotation Mark"},
				{char: "＃", name: "全角井号", ename: "Fullwidth Number Sign"},
				{char: "＄", name: "全角美元符号", ename: "Fullwidth Dollar Sign"},
				{char: "％", name: "全角百分比符号", ename: "Fullwidth Percent Sign"},
				{char: "＆", name: "全角与符号", ename: "Fullwidth Ampersand"},
				{char: "＇", name: "全角撇号", ename: "Fullwidth Apostrophe"},
				{char: "（", name: "全角左括号", ename: "Fullwidth Left Parenthesis"},
				{char: "）", name: "全角右括号", ename: "Fullwidth Right Parenthesis"},
				{char: "＊", name: "全角星号", ename: "Fullwidth Asterisk"},
				{char: "＋", name: "全角加号", ename: "Fullwidth Plus Sign"},
				{char: "，", name: "全角逗号", ename: "Fullwidth Comma"},
				{char: "－", name: "全角减号", ename: "Fullwidth Hyphen-Minus"},
				{char: "．", name: "全角句号", ename: "Fullwidth Full Stop"},
				{char: "／", name: "全角斜杠", ename: "Fullwidth Solidus"},
				{char: "０", name: "全角数字0", ename: "Fullwidth Digit Zero"},
				{char: "１", name: "全角数字1", ename: "Fullwidth Digit One"},
				{char: "２", name: "全角数字2", ename: "Fullwidth Digit Two"},
				{char: "３", name: "全角数字3", ename: "Fullwidth Digit Three"},
				{char: "４", name: "全角数字4", ename: "Fullwidth Digit Four"},
				{char: "５", name: "全角数字5", ename: "Fullwidth Digit Five"},
				{char: "６", name: "全角数字6", ename: "Fullwidth Digit Six"},
				{char: "７", name: "全角数字7", ename: "Fullwidth Digit Seven"},
				{char: "８", name: "全角数字8", ename: "Fullwidth Digit Eight"},
				{char: "９", name: "全角数字9", ename: "Fullwidth Digit Nine"},
				{char: "：", name: "全角冒号", ename: "Fullwidth Colon"},
				{char: "；", name: "全角分号", ename: "Fullwidth Semicolon"},
				{char: "＜", name: "全角小于号", ename: "Fullwidth Less-Than Sign"},
				{char: "＝", name: "全角等于号", ename: "Fullwidth Equals Sign"},
				{char: "＞", name: "全角大于号", ename: "Fullwidth Greater-Than Sign"},
				{char: "？", name: "全角问号", ename: "Fullwidth Question Mark"},
				{char: "＠", name: "全角@符号", ename: "Fullwidth Commercial At"},
				{char: "Ａ", name: "全角大写字母A", ename: "Fullwidth Latin Capital Letter A"},
				{char: "Ｂ", name: "全角大写字母B", ename: "Fullwidth Latin Capital Letter B"},
				{char: "Ｃ", name: "全角大写字母C", ename: "Fullwidth Latin Capital Letter C"},
				{char: "Ｄ", name: "全角大写字母D", ename: "Fullwidth Latin Capital Letter D"},
				{char: "Ｅ", name: "全角大写字母E", ename: "Fullwidth Latin Capital Letter E"},
				{char: "Ｆ", name: "全角大写字母F", ename: "Fullwidth Latin Capital Letter F"},
				{char: "Ｇ", name: "全角大写字母G", ename: "Fullwidth Latin Capital Letter G"},
				{char: "Ｈ", name: "全角大写字母H", ename: "Fullwidth Latin Capital Letter H"},
				{char: "Ｉ", name: "全角大写字母I", ename: "Fullwidth Latin Capital Letter I"},
				{char: "Ｊ", name: "全角大写字母J", ename: "Fullwidth Latin Capital Letter J"},
				{char: "Ｋ", name: "全角大写字母K", ename: "Fullwidth Latin Capital Letter K"},
				{char: "Ｌ", name: "全角大写字母L", ename: "Fullwidth Latin Capital Letter L"},
				{char: "Ｍ", name: "全角大写字母M", ename: "Fullwidth Latin Capital Letter M"},
				{char: "Ｎ", name: "全角大写字母N", ename: "Fullwidth Latin Capital Letter N"},
				{char: "Ｏ", name: "全角大写字母O", ename: "Fullwidth Latin Capital Letter O"},
				{char: "Ｐ", name: "全角大写字母P", ename: "Fullwidth Latin Capital Letter P"},
				{char: "Ｑ", name: "全角大写字母Q", ename: "Fullwidth Latin Capital Letter Q"},
				{char: "Ｒ", name: "全角大写字母R", ename: "Fullwidth Latin Capital Letter R"},
				{char: "Ｓ", name: "全角大写字母S", ename: "Fullwidth Latin Capital Letter S"},
				{char: "Ｔ", name: "全角大写字母T", ename: "Fullwidth Latin Capital Letter T"},
				{char: "Ｕ", name: "全角大写字母U", ename: "Fullwidth Latin Capital Letter U"},
				{char: "Ｖ", name: "全角大写字母V", ename: "Fullwidth Latin Capital Letter V"},
				{char: "Ｗ", name: "全角大写字母W", ename: "Fullwidth Latin Capital Letter W"},
				{char: "Ｘ", name: "全角大写字母X", ename: "Fullwidth Latin Capital Letter X"},
				{char: "Ｙ", name: "全角大写字母Y", ename: "Fullwidth Latin Capital Letter Y"},
				{char: "Ｚ", name: "全角大写字母Z", ename: "Fullwidth Latin Capital Letter Z"},
				{char: "［", name: "全角左方括号", ename: "Fullwidth Left Square Bracket"},
				{char: "＼", name: "全角反斜杠", ename: "Fullwidth Reverse Solidus"},
				{char: "］", name: "全角右方括号", ename: "Fullwidth Right Square Bracket"},
				{char: "＾", name: "全角扬抑符", ename: "Fullwidth Circumflex Accent"},
				{char: "＿", name: "全角下划线", ename: "Fullwidth Low Line"},
				{char: "｀", name: "全角重音符", ename: "Fullwidth Grave Accent"},
				{char: "ａ", name: "全角小写字母a", ename: "Fullwidth Latin Small Letter A"},
				{char: "ｂ", name: "全角小写字母b", ename: "Fullwidth Latin Small Letter B"},
				{char: "ｃ", name: "全角小写字母c", ename: "Fullwidth Latin Small Letter C"},
				{char: "ｄ", name: "全角小写字母d", ename: "Fullwidth Latin Small Letter D"},
				{char: "ｅ", name: "全角小写字母e", ename: "Fullwidth Latin Small Letter E"},
				{char: "ｆ", name: "全角小写字母f", ename: "Fullwidth Latin Small Letter F"},
				{char: "ｇ", name: "全角小写字母g", ename: "Fullwidth Latin Small Letter G"},
				{char: "ｈ", name: "全角小写字母h", ename: "Fullwidth Latin Small Letter H"},
				{char: "ｉ", name: "全角小写字母i", ename: "Fullwidth Latin Small Letter I"},
				{char: "ｊ", name: "全角小写字母j", ename: "Fullwidth Latin Small Letter J"},
				{char: "ｋ", name: "全角小写字母k", ename: "Fullwidth Latin Small Letter K"},
				{char: "ｌ", name: "全角小写字母l", ename: "Fullwidth Latin Small Letter L"},
				{char: "ｍ", name: "全角小写字母m", ename: "Fullwidth Latin Small Letter M"},
				{char: "ｎ", name: "全角小写字母n", ename: "Fullwidth Latin Small Letter N"},
				{char: "ｏ", name: "全角小写字母o", ename: "Fullwidth Latin Small Letter O"},
				{char: "ｐ", name: "全角小写字母p", ename: "Fullwidth Latin Small Letter P"},
				{char: "ｑ", name: "全角小写字母q", ename: "Fullwidth Latin Small Letter Q"},
				{char: "ｒ", name: "全角小写字母r", ename: "Fullwidth Latin Small Letter R"},
				{char: "ｓ", name: "全角小写字母s", ename: "Fullwidth Latin Small Letter S"},
				{char: "ｔ", name: "全角小写字母t", ename: "Fullwidth Latin Small Letter T"},
				{char: "ｕ", name: "全角小写字母u", ename: "Fullwidth Latin Small Letter U"},
				{char: "ｖ", name: "全角小写字母v", ename: "Fullwidth Latin Small Letter V"},
				{char: "ｗ", name: "全角小写字母w", ename: "Fullwidth Latin Small Letter W"},
				{char: "ｘ", name: "全角小写字母x", ename: "Fullwidth Latin Small Letter X"},
				{char: "ｙ", name: "全角小写字母y", ename: "Fullwidth Latin Small Letter Y"},
				{char: "ｚ", name: "全角小写字母z", ename: "Fullwidth Latin Small Letter Z"},
				{char: "｛", name: "全角左花括号", ename: "Fullwidth Left Curly Bracket"},
				{char: "｜", name: "全角竖线", ename: "Fullwidth Vertical Line"},
				{char: "｝", name: "全角右花括号", ename: "Fullwidth Right Curly Bracket"},
				{char: "～", name: "全角波浪号", ename: "Fullwidth Tilde"}
			]
		},
		{
			name: '标记符号',
			symbols: []
		}
	]
};
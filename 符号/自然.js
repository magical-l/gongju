const data={
	name: '自然、科学',
	groups: [
		{
			name:'物理、化学',
			symbols: []
		},
		{
			name: '生物',
			symbols: [
				{char: "☘", name: "三叶草", ename: "Shamrock"},
				{char: "☙", name: "反向旋转花心", ename: "Reversed Rotated Floral Heart Bullet"}
			]
		},
		{
			name: '天文',
			symbols: [
				{char: "☉", name: "太阳", ename: "Sun", tags: ['日']},
				{char: "☀", name: "黑太阳", ename: "Black Sun with Rays", tags: ['日']},
				{char: "☼", name: "白太阳", ename: "White Sun with Rays", tags: ['日']},
				{char: "☽", name: "上弦月", ename: "First Quarter Moon", tags: ['月']},
				{char: "☾", name: "下弦月", ename: "Last Quarter Moon", tags: ['月']},
				{char: "☿", name: "水星", ename: "Mercury"},
				{char: "♀", name: "金星", ename: "Venus", tags: ['女性', '雌性']},
				{char: "♁", name: "地球", ename: "Earth"},
				{char: "♂", name: "火星", ename: "Mars", tags: ['男性', '雄性']},
				{char: "♃", name: "木星", ename: "Jupiter"},
				{char: "♄", name: "土星", ename: "Saturn"},
				{char: "♅", name: "天王星", ename: "Uranus"},
				{char: "⛢", name: "天王星天文符号", ename: "Astronomical Symbol For Uranus"},
				{char: "♆", name: "海王星", ename: "Neptune"},
				{char: "♇", name: "冥王星", ename: "Pluto"},
				{char: "⚳", name: "谷神星", ename: "Ceres", tags: ['矮行星']},
				{char: "⚴", name: "智神星", ename: "Pallas", tags: ['小行星']},
				{char: "⚵", name: "婚神星", ename: "Juno", tags: ['小行星']},
				{char: "⚶", name: "灶神星", ename: "Vesta", tags: ['小行星']},
				{char: "⚷", name: "凯龙星", ename: "Chiron", tags: ['小行星']},
				{char: "☄", name: "彗星", ename: "Comet"},
				{char: "☊", name: "升交点", ename: "Ascending Node"},
				{char: "☋", name: "降交点", ename: "Descending Node"},
				{char: "☌", name: "合点", ename: "Conjunction"},
				{char: "☍", name: "冲日点", ename: "Opposition"},

				{char: "♈", name: "白羊宫、白羊座", ename: "Aries"},
				{char: "♉", name: "金牛宫、金牛座", ename: "Taurus"},
				{char: "♊", name: "双子宫、双子座", ename: "Gemini"},
				{char: "♋", name: "巨蟹宫、巨蟹座", ename: "Cancer"},
				{char: "♌", name: "狮子宫、狮子座", ename: "Leo"},
				{char: "♍", name: "处女宫、处女座", ename: "Virgo"},
				{char: "♎", name: "天秤宫、天秤座", ename: "Libra"},
				{char: "♏", name: "天蝎宫、天蝎座", ename: "Scorpius"},
				{char: "♐", name: "射手宫、射手座", ename: "Sagittarius"},
				{char: "♑", name: "摩羯宫、摩羯座", ename: "Capricorn"},
				{char: "♒", name: "水瓶宫、水瓶座", ename: "Aquarius"},
				{char: "♓", name: "双鱼宫、双鱼座", ename: "Pisces"},
				{char: "⛎", name: "蛇夫宫、蛇夫座", ename: "Ophiuchus"}
			]
		},
		{
			name: '抽象星形符号',
			symbols: [
				{char: "★", name: "黑星", ename: "Black Star", tags: ["五角星", '五芒星', "实心星"]},
				{char: "☆", name: "白星", ename: "White Star", tags: ["五角星", '五芒星', "空心星"]},
				{char: "✡", name: "大卫之星", ename: "Star of David", tags: ["六角星", '六芒星']},
				{char: "✦", name: "黑四角星", ename: "Black Four Pointed Star", tags: ["四角星", '四芒星']},
				{char: "✧", name: "白四角星", ename: "White Four Pointed Star", tags: ["四角星", '四芒星']},
				{
					char: "✩",
					name: "轮廓白星",
					ename: "Stress Outlined White Star",
					tags: ["五角星", '五芒星', "旋转星"]
				},
				{char: "✪", name: "黑圆白星", ename: "Circled White Star", tags: ["五角星", '五芒星', "带圈星"]},
				{
					char: "⍟",
					name: "白圆黑星",
					ename: "APL Functional Symbol Circle Star",
					tags: ["五角星", '五芒星', '圈内星']
				},
				{char: "✫", name: "黑星白圆", ename: "Open Centre Black Star", tags: ["五角星", '五芒星']},
				{char: "✬", name: "白星黑圆", ename: "Black Centre White Star", tags: ["五角星", '五芒星']},
				{char: "✭", name: "描边黑星", ename: "Outlined Black Star", tags: ["五角星", '五芒星']},
				{char: "✮", name: "粗描边黑星", ename: "Heavy Outlined Black Star", tags: ["五角星", '五芒星']},
				{char: "✯", name: "风车星", ename: "Pinwheel Star", tags: ["五角星", '五芒星']},
				{char: "✰", name: "阴影白星", ename: "Shadowed White Star", tags: ["五角星", '五芒星', "带影星"]},
				{char: "⁂", name: "星群", ename: "Asterism", tags: ['三星', '三体']},
				{char: "⁎", name: "星号", ename: "Low Asterisk"},
				{char: "⁑", name: "竖排双星号", ename: "Two Asterisks Aligned Vertically"},
				{char: "⌑", name: "凹正方形", ename: "Square Lozenge", tags: ['方菱形']},
				{char: "⍣", name: "星形分音符", ename: "APL Functional Symbol Star Diaeresis"},
				{char: "⛤", name: "五角星", ename: "Pentagram", tags: ['五角星', '魔法']},
				{
					char: "⛥",
					name: "右手交织五角星",
					ename: "Right-Handed Interlaced Pentagram",
					tags: ['五角星', '交织']
				},
				{
					char: "⛦",
					name: "左手交织五角星",
					ename: "Left-Handed Interlaced Pentagram",
					tags: ['五角星', '交织']
				},
				{char: "⛧", name: "倒五角星", ename: "Inverted Pentagram", tags: ['五角星', '倒置']}
			]
		},
		{
			name: '天气',
			symbols: [
				{char: "☀", name: "黑太阳", ename: "Black Sun with Rays"},
				{char: "☼", name: "白太阳", ename: "White Sun with Rays"},
				{char: "☁", name: "云", ename: "Cloud"},
				{char: "❄", name: "雪花", ename: "Snowflake"},
				{char: "☇", name: "闪电", ename: "Lightning"},
				{char: "☈", name: "雷暴", ename: "Thunderstorm"},
				{char: "⛅", name: "云后太阳", ename: "Sun Behind Cloud", tags: ['多云']},
				{char: "⛆", name: "雨", ename: "Rain", tags: []},
				{char: "⛉", name: "雾", ename: "Fog", tags: []},
				{char: "⛊", name: "雾", ename: "Fog", tags: []},
				{char: "⛋", name: "雾", ename: "Fog", tags: []}
			]
		},
		{
			name: '地理',
			symbols: [
				{char: "⛰", name: "山", ename: "Mountain", tags: ['地形']}
			]
		},
		{
			name: '自然现象',
			symbols: [
				{char: "🔥", name: "火", ename: "Fire"}
			]
		}
	]
}
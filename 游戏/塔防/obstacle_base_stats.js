export const obstacleBaseStats = [
	{id: "普通1x1", width: 1, height: 1, health: 20, reward: 50},
	{id: "普通1x2", width: 1, height: 2, health: 50, reward: 100},
	{id: "普通2x1", width: 2, height: 1, health: 50, reward: 100},
	{id: "普通2x2", width: 2, height: 2, health: 80, reward: 150},
	{id: "小钱袋", width: 1, height: 1, health: 80, reward: 200},
	{id: "大钱袋", width: 2, height: 2, health: 200, reward: 2000},
	{
		id: "冰块1x1", width: 1, height: 1, health: 20, reward: 5,
		skills: {
			雪藏炮塔: {
				afterOwned(owner) {
				},
				activate(owner) {
				},
			},
		},
	},
	{
		id: "鸽子", width: 1, height: 1, health: 20, reward: 50,
		skills: {
			随机换位: {
				afterOwned(owner) {
					owner.afterAttackListeners?.push({
						name: '随机换位',
						activate(fighting) {
							if (hitOneInN(6)) {//1/6概率
								//随机找一个1*1空位置
								const emptyPlaces = fighting.gamingMap.emptyPlaces;
								const randomPlace = emptyPlaces.randomOne();
								if (randomPlace) {
									owner.moveTo(randomPlace);
								}
							}
						},
					});
				},
			},
		},
	},
	{
		id: "绵羊", width: 2, height: 1, health: 20, reward: 50,
		skills: {
			被薅羊毛: {//阶段性给钱

			},
			长毛: {},
		},
	},
	{
		id: "小灯", width: 1, height: 1, health: 20, reward: 0,
		skills: {
			点亮: {},
		},
	},
	{
		id: "开关", width: 1, height: 1, health: 20, reward: 0,
		skills: {
			开机关: {},
		},
	},
	{
		id: "小火锅", width: 1, height: 1, health: 20, reward: 0,
		skills: {
			小火锅: {},
		},
	},
	{
		id: "中火锅", width: 2, height: 1, health: 20, reward: 0,
		skills: {
			中火锅: {},
		},
	},
	{
		id: "收集碎片", width: 1, height: 1, health: 20, reward: 50,
		skills: {
			收集碎片: {},
		},
	},
];

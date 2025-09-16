//=======================================技能
class 杀敌 extends Skill {
	constructor({owner}) {
		super({
			name: '杀敌',
			intro: '击败所在位置的敌军',
			tip: '移动到新位置后，吃掉该位置的敌方棋子',
			owner,
			watchers: {
				'单位已移动': ({unit}) => {
					if (unit === owner) {
						this.gaming.getUnitsAt(unit.position)
							.filter(e => e !== unit)
							.each(u => unit.gaming.removeUnitFromPosition(u));
					}
				}
			}
		});
	}
}

class Move extends Skill {
	constructor(overrideCfg = {}) {
		super({
			name: '移动',
			watchers: {
				'position selected': ({position}) => {
					if (this.owner/*单位*/.owner/*玩家*/.selectedUnit === this.owner) {
						const availableTargetPositions = this.getAvailableTargetPositions();
						const payload = {unit: this.owner, availableTargetPositions};
						this.gaming.bulletin.notice('已获取可移动位置集', payload);
						if (this.game.battlefield.keepValidPositions(payload.availableTargetPositions)
							.find(e => e.isEqualTo(position))) {
							this.owner.position = position;
						}
					}
				}
			}
			,
			...overrideCfg
		});
	}

	getAvailableTargetPositions() {
		return Array.from(this.gaming.battlefield.positions.keys());
	}
}

class 步战四方 extends Move {
	constructor() {
		super({name: '步战四方', intro: '可以向前后左右移动一格', tip: '可以向前后左右移动一格。'});
	}

	getAvailableTargetPositions() {
		const [r, c] = [this.owner.position.rowNum, this.owner.position.colNum];
		return [
			new 棋盘点位(r - 1, c), new 棋盘点位(r + 1, c),
			new 棋盘点位(r, c - 1), new 棋盘点位(r, c + 1)
		];
	}
}

class 守营 extends Skill {
	constructor() {
		super({
			name: '守营', intro: '有守卫大营之责，不能冲锋陷阵。', tip: '不能离开九宫格。',
			watchers: {
				'已获取可移动位置集': ({unit, availableTargetPositions}) => {
					if (unit === this.owner) {
						availableTargetPositions.keepIf(position => position.r >= 4
																												&& position.r <= 6
																												&& (position.c <= 3 || position.c >= 8));
					}
				}
			}
		});
	}
}

class 护卫 extends Move {
	constructor() {
		super(
			{name: '护卫', intro: '斜刺里冲出，护卫将帅。', tip: '可以向左前方、右前方、左后方、右后方斜线移动至一格对角线方向。'});
	}

	getAvailableTargetPositions() {
		const [r, c] = [this.owner.position.rowNum, this.owner.position.colNum];
		return [
			new 棋盘点位(r - 1, c - 1), new 棋盘点位(r - 1, c + 1),
			new 棋盘点位(r + 1, c - 1), new 棋盘点位(r + 1, c + 1)
		];
	}
}

class 象行田 extends Move {
	constructor() {
		super({name: '象行田', intro: '走一个“田字形”。', tip: '可移动到斜线两格的位置（‘田字’对角线）。'});
	}

	getAvailableTargetPositions() {
		const [r, c] = [this.owner.position.rowNum, this.owner.position.colNum];
		return [
			new 棋盘点位(r - 2, c - 2), new 棋盘点位(r - 2, c + 2),
			new 棋盘点位(r + 2, c - 2), new 棋盘点位(r + 2, c + 2)
		];
	}
}

class 塞象眼 extends Skill {
	constructor() {
		super({
			name: '塞象眼', intro: '',
			watchers: {
				'已获取可移动位置集': ({unit, availableTargetPositions}) => {
					if (unit === this.owner) {
						const [r, c] = [this.owner.position.rowNum, this.owner.position.colNum];
						availableTargetPositions.keepIf(position =>
							!this.gaming.getUnitsAt(new 棋盘点位((position.r + r) / 2, (position.c + c) / 2)));
					}
				}
			}
		});
	}
}

class 水太深 extends Skill {
	constructor() {
		super({
			name: '水太深', intro: '', tip: '不能过河',
			watchers: {
				'已获取可移动位置集': ({unit, availableTargetPositions}) => {
					if (unit === this.owner) {
						availableTargetPositions.keepIf(position => {
							//todo：这里需要判断position是否位于‘本方区域’。定义一个叫areaOwner(position)的方法比较特定于中国象棋，不太好。
							// return this.game.battlefield.areaOwner(position) === this.owner.owner;
							return true;
						});
					}
				}
			}
		});
	}
}

class 马行日 extends Move {
	constructor() {
		super({name: '马行日', intro: '走一个“日字形”。', tip: '可以移动到“日字”对角线的位置'});
	}

	getAvailableTargetPositions() {
		const [r, c] = [this.owner.position.rowNum, this.owner.position.colNum];
		return [
			new 棋盘点位(r - 2, c - 1), new 棋盘点位(r - 2, c + 1),
			new 棋盘点位(r + 2, c - 1), new 棋盘点位(r + 2, c + 1),
			new 棋盘点位(r - 1, c - 2), new 棋盘点位(r - 1, c + 2),
			new 棋盘点位(r + 1, c - 2), new 棋盘点位(r + 1, c + 2)
		];
	}
}

class 绊马脚 extends Skill {
	constructor() {
		super({
			name: '绊马脚', intro: '',
			watchers: {
				'已获取可移动位置集': ({unit, availableTargetPositions}) => {
					if (unit === this.owner) {
						const [r, c] = [this.owner.position.rowNum, this.owner.position.colNum];
						availableTargetPositions.keepIf(position =>
							!this.gaming.getUnitsAt(
								new 棋盘点位(Math.trunc((position.r + r) / 2), Math.trunc((position.c + c) / 2))));
					}
				}
			}
		});
	}
}

class 轮子 extends Move {
	constructor() {
		super({name: '轮子', intro: ''});
	}

	getAvailableTargetPositions() {
		const [r, c] = [this.owner.position.rowNum, this.owner.position.colNum];
		const rt = [];
		for (let i = r - 1; i > 0; i--) {
			const p = new 棋盘点位(i, c);
			if (this.gaming.getUnitsAt(p)) {
				break;
			}
			rt.push(p);
		}
		for (let i = r + 1; i <= this.gaming.battlefield.rowSize; i++) {
			const p = new 棋盘点位(i, c);
			if (this.gaming.getUnitsAt(p)) {
				break;
			}
			rt.push(p);
		}
		for (let j = c - 1; j > 0; j--) {
			const p = new 棋盘点位(r, j);
			if (this.gaming.getUnitsAt(p)) {
				break;
			}
			rt.push(p);
		}
		for (let j = c + 1; j <= this.gaming.battlefield.colSize; j++) {
			const p = new 棋盘点位(r, j);
			if (this.gaming.getUnitsAt(p)) {
				break;
			}
			rt.push(p);
		}
		return rt;
	}
}

class 挡我者死 extends Skill {
	constructor() {
		super({
			name: '挡我者死', intro: '',
			watchers: {
				'已获取可移动位置集': ({unit, availableTargetPositions}) => {
					if (unit === this.owner) {
						const myPlayer = this.owner.owner;
						const [r, c] = [this.owner.position.rowNum, this.owner.position.colNum];
						const rs = availableTargetPositions.map(p => p.r);
						const minR = Math.min(rs);
						if (minR > 1) {
							const p = new 棋盘点位(minR - 1, c);
							const units = this.gaming.getUnitsAt(p);
							if (units) {
								if (units[0].owner !== myPlayer) {
									availableTargetPositions.push(p);
								}
							}
						}
						const maxR = Math.max(rs);
						if (maxR < this.gaming.battlefield.rowSize) {
							const p = new 棋盘点位(maxR + 1, c);
							const units = this.gaming.getUnitsAt(p);
							if (units) {
								if (units[0].owner !== myPlayer) {
									availableTargetPositions.push(p);
								}
							}
						}
						const cs = availableTargetPositions.map(p => p.c);
						const minC = Math.min(cs);
						if (minC > 1) {
							const p = new 棋盘点位(r, minC - 1);
							const units = this.gaming.getUnitsAt(p);
							if (units) {
								if (units[0].owner !== myPlayer) {
									availableTargetPositions.push(p);
								}
							}
						}
						const maxC = Math.max(cs);
						if (maxC < this.gaming.battlefield.colSize) {
							const p = new 棋盘点位(r, maxC + 1);
							const units = this.gaming.getUnitsAt(p);
							if (units) {
								if (units[0].owner !== myPlayer) {
									availableTargetPositions.push(p);
								}
							}
						}
					}
				}
			}
		});
	}
}

class 隔山打牛 extends Skill {
	constructor() {
		super({
			name: '隔山打牛', intro: '',
			watchers: {
				'已获取可移动位置集': ({unit, availableTargetPositions}) => {
					if (unit === this.owner) {
						const myPlayer = this.owner.owner;
						const [r, c] = [this.owner.position.rowNum, this.owner.position.colNum];
						//todo:给availableTargetPositions 加入可以炮击的位置。
					}
				}
			}
		});
	}
}

class 勇往直前 extends Move {
	constructor() {
		super({name: '勇往直前', intro: ''});
	}

	getAvailableTargetPositions() {
		return [new 棋盘点位(this.unit.position.r, this.team.ahead(this.unit.position.c, 1))];
	}
}

class 过河卒 extends Skill {
	constructor() {
		super({
			name: '过河卒', intro: '',
			watchers: {
				'单位已移动': ({unit}) => {
					if (unit === this.owner) {
						this.owner.addSkill(new 横冲直撞());
					}
				}
			}
		});
	}
}

class 横冲直撞 extends Move {
	constructor() {
		super({name: '横冲直撞', intro: ''});
	}

	getAvailableTargetPositions() {
		const [r, c] = [this.owner.position.rowNum, this.owner.position.colNum];
		//todo:这里需要得到‘前进’一步的坐标。但双方（两个队伍）朝向不同，‘前进’可能是+1也可能是-1。若定义一个aheadForTeam，也比较特定于中国象棋，不太好。
		return [new 棋盘点位(r, this.gaming.battlefield.aheadForTeam(this.team, r, 1)),
						new 棋盘点位(r, c - 1), new 棋盘点位(r, c + 1)
		];
	}
}

const 内置技能集 = {};//明确声明是个{:}。
[
	杀敌, 步战四方, 守营, 护卫, 象行田, 塞象眼, 水太深, 马行日, 绊马脚, 轮子, 挡我者死, 隔山打牛, 勇往直前, 过河卒,
	横冲直撞
]
	.forEach(e => 内置技能集[e.name] = e);//用于展示

//============================================

const 中国象棋默认配置 = {
	先手: 红方,
	棋盘: ```
		車馬象士将士象馬車
		空空空空空空空空空
		空砲空空空空空砲空
		卒空卒空卒空卒空卒
		空空空空空空空空空
		空空空空空空空空空
		兵空兵空兵空兵空兵
		空砲空空空空空砲空
		空空空空空空空空空
		车马相仕帅仕相马车
	```,
	队伍: {
		'红方': {
			棋子: {
				'帅': {
					显示: '\u{1FA60}',
					技能: ['步战四方', '守营', '杀敌']
				},
				'仕': {
					显示: '\u{1FA61}',
					技能: ['护卫', '守营', '杀敌']
				},
				'相': {
					显示: '\u{1FA62}',
					技能: ['象行田', '塞象眼', '水太深', '杀敌']
				},
				'车': {
					显示: '\u{1FA64}',
					技能: ['轮子', '挡我者死', '杀敌']
				},
				'马': {
					显示: '\u{1FA63}',
					技能: ['马行日', '绊马脚', '杀敌']
				},
				'炮': {
					显示: '\u{1FA65}',
					技能: ['轮子', '隔山打牛', '杀敌']
				},
				'兵': {
					显示: '\u{1FA66}',
					技能: ['勇往直前', '过河卒', '杀敌']
				}
			}
		},
		'黑方': {
			棋子: {
				'将': {
					显示: '\u{1FA67}',
					技能: ['步战四方', '守营', '杀敌']
				},
				'士': {
					显示: '\u{1FA68}',
					技能: ['护卫', '守营', '杀敌']
				},
				'象': {
					显示: '\u{1FA69}',
					技能: ['象行田', '塞象眼', '水太深', '杀敌']
				},
				'車': {
					显示: '\u{1FA6B}',
					技能: ['轮子', '挡我者死', '杀敌']
				},
				'馬': {
					显示: '\u{1FA6A}',
					技能: ['马行日', '绊马脚', '杀敌']
				},
				'砲': {
					显示: '\u{1FA6C}',
					技能: ['轮子', '隔山打牛', '杀敌']
				},
				'卒': {
					显示: '\u{1FA6D}',
					技能: ['勇往直前', '过河卒', '杀敌']
				}
			}
		}
	}
};

class 中国象棋 extends Game {
	constructor(cfg = {}) {
		super({...中国象棋默认配置, ...cfg});
		this.cfg.GamingClass = 棋局;
		this.cfg.BattlefieldClass = Board;
	}
}

class 棋局 extends Gaming {
	constructor(中国象棋) {
		super(中国象棋);
		this.先手 = 中国象棋.cfg.先手;
	}

	_buildSkill(owner, skillCfg) {
		return new 内置技能集[skillCfg]();
	}

	// _build() {
	// 	this.队伍 = Object.fromEntries(
	// 		Object.entries(this.game.cfg.队伍)
	// 			.map(([队伍名, 队伍cfg]) => [队伍名, this._setup队伍(队伍名, 队伍cfg)])
	// 	);
	// 	this.teams = this.队伍;
	// }
	//
	// _setup队伍(队伍名, 队伍cfg) {
	// 	return new Team(this, {
	// 		...队伍cfg,
	// 		棋子: Object.entries(队伍cfg.棋子)
	// 			.map(([棋子名, 棋子cfg]) => [棋子名, this._setup棋子(棋子名, 棋子cfg)])
	// 	});
	// }
	//
	// _setup棋子(棋子名, 棋子cfg) {
	// 	return new Unit({
	// 		...棋子cfg,
	// 		skills: 棋子cfg.skills.map(skillName => 内置技能集[skillName])
	// 	});
	// 	//Unit.define({...棋子cfg, name: 棋子名})};//todo:skills
	// }
}

// class 帅 extends Unit {
// 	constructor(overrideCfg = {}) {
// 		super({name: '帅', display: '\u{1FA60}', skills: [杀敌, 步战四方, 守营], ...overrideCfg});
// 	}
// }
//
// class 仕 extends Unit {
// 	constructor(overrideCfg = {}) {
// 		super({name: '仕', display: '\u{1FA61}', skills: [杀敌, 护卫, 守营], ...overrideCfg});
// 	}
// }
//
// class 相 extends Unit {
// 	constructor(overrideCfg = {}) {
// 		super({name: '相', display: '\u{1FA62}', skills: [杀敌, 象行田, 塞象眼, 水太深], ...overrideCfg});
// 	}
// }
//
// class 红方马 extends Unit {
// 	constructor(overrideCfg = {}) {
// 		super({name: '马', display: '\u{1FA63}', skills: [杀敌, 马行日, 绊马脚], ...overrideCfg});
// 	}
// }
//
// class 红方车 extends Unit {
// 	constructor(overrideCfg = {}) {
// 		super({name: '车', display: '\u{1FA64}', skills: [杀敌, 轮子, 挡我者死], ...overrideCfg});
// 	}
// }
//
// class 红方炮 extends Unit {
// 	constructor(overrideCfg = {}) {
// 		super({name: '炮', display: '\u{1FA65}', skills: [杀敌, 轮子, 隔山打牛], ...overrideCfg});
// 	}
// }
//
// class 兵 extends Unit {
// 	constructor(overrideCfg = {}) {
// 		super({name: '兵', display: '\u{1FA66}', skills: [杀敌, 勇往直前, 过河卒], ...overrideCfg});
// 	}
// }
//
// class 将 extends Unit {
// 	constructor(overrideCfg = {}) {
// 		super({name: '将', display: '\u{1FA67}', skills: [杀敌, 步战四方, 守营], ...overrideCfg});
// 	}
// }
//
// class 士 extends Unit {
// 	constructor(overrideCfg = {}) {
// 		super({name: '士', display: '\u{1FA68}', skills: [杀敌, 护卫, 守营], ...overrideCfg});
// 	}
// }
//
// class 象 extends Unit {
// 	constructor(overrideCfg = {}) {
// 		super({name: '象', display: '\u{1FA69}', skills: [杀敌, 象行田, 塞象眼, 水太深], ...overrideCfg});
// 	}
// }
//
// class 黑方马 extends Unit {
// 	constructor(overrideCfg = {}) {
// 		super({name: '马', display: '\u{1FA6A}', skills: [杀敌, 马行日, 绊马脚], ...overrideCfg});
// 	}
// }
//
// class 黑方车 extends Unit {
// 	constructor(overrideCfg = {}) {
// 		super({name: '车', display: '\u{1FA6B}', skills: [杀敌, 轮子, 挡我者死], ...overrideCfg});
// 	}
// }
//
// class 黑方炮 extends Unit {
// 	constructor(overrideCfg = {}) {
// 		super({name: '炮', display: '\u{1FA6C}', skills: [杀敌, 轮子, 隔山打牛], ...overrideCfg});
// 	}
// }
//
// class 卒 extends Unit {
// 	constructor(overrideCfg = {}) {
// 		super({name: '卒', display: '\u{1FA6D}', skills: [杀敌, 勇往直前, 过河卒], ...overrideCfg});
// 	}
// }
//
// const 内置单位集 = [
// 	帅, 仕, 相, 红方车, 红方马, 红方炮, 兵, 将, 士, 象, 黑方车, 黑方马, 黑方炮, 卒
// ];

// const 默认配置管理器 = {
// 	读取游戏默认配置() {
// 		//{	--实现部分若只有一行，则可以直接用‘=’。
// 		// 			‘队伍模板配置’:从《队伍目标集默认配置文件》解析队伍模板集,
// 		// 			‘玩家模板配置’:从《玩家目标集默认配置文件》解析玩家模板集,
// 		// 			‘规则模板配置’:从《规则目标集默认配置文件》解析规则模板集,
// 		// 			‘单位模板配置’:从《单位目标集默认配置文件》解析单位模板集,
// 		// 		}
// 	},
// 	修改游戏默认配置(cfgs) {
// 		//若 新的默认配置文件集对象 有 队伍目标集默认配置文件，则保存到《队伍目标集默认配置文件》
// 		// 		若 新的默认配置文件集对象 有 玩家目标集默认配置文件，则保存到《玩家目标集默认配置文件》
// 		// 		若 新的默认配置文件集对象 有 规则目标集默认配置文件，则保存到《规则目标集默认配置文件》
// 		// 		若 新的默认配置文件集对象 有 单位目标集默认配置文件，则保存到《单位目标集默认配置文件》
// 	}
// };
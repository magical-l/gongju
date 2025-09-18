const 红方id = '红方';
const 黑方id = '黑方';
const 红方玩家id = 红方id + '玩家';
const 黑方玩家id = 黑方id + '玩家';

//字段名将来展示于设置面板里，所以是中文。
const 中国象棋默认配置 = {
	棋盘: `
		車馬象士将士象馬車
		空空空空空空空空空
		空砲空空空空空砲空
		卒空卒空卒空卒空卒
		空空空空空空空空空
		空空空空空空空空空
		兵空兵空兵空兵空兵
		空炮空空空空空炮空
		空空空空空空空空空
		车马相仕帅仕相马车
	`,
	棋子类型: {
		'帅': {显示: '\u{1FA60}', 技能: ['步战四方', '守营', '杀敌'], 玩家: '红方玩家'},
		'仕': {显示: '\u{1FA61}', 技能: ['护卫', '守营', '杀敌'], 玩家: '红方玩家'},
		'相': {显示: '\u{1FA62}', 技能: ['象行田', '塞象眼', '水太深', '杀敌'], 玩家: '红方玩家'},
		'马': {显示: '\u{1FA63}', 技能: ['马行日', '绊马脚', '杀敌'], 玩家: '红方玩家'},
		'车': {显示: '\u{1FA64}', 技能: ['轮子', '挡我者死', '杀敌'], 玩家: '红方玩家'},
		'炮': {显示: '\u{1FA65}', 技能: ['轮子', '隔山打牛', '杀敌'], 玩家: '红方玩家'},
		'兵': {显示: '\u{1FA66}', 技能: ['勇往直前', '过河卒', '杀敌'], 玩家: '红方玩家'},
		'将': {显示: '\u{1FA67}', 技能: ['步战四方', '守营', '杀敌'], 玩家: '黑方玩家'},
		'士': {显示: '\u{1FA68}', 技能: ['护卫', '守营', '杀敌'], 玩家: '黑方玩家'},
		'象': {显示: '\u{1FA69}', 技能: ['象行田', '塞象眼', '水太深', '杀敌'], 玩家: '黑方玩家'},
		'馬': {显示: '\u{1FA6A}', 技能: ['马行日', '绊马脚', '杀敌'], 玩家: '黑方玩家'},
		'車': {显示: '\u{1FA6B}', 技能: ['轮子', '挡我者死', '杀敌'], 玩家: '黑方玩家'},
		'砲': {显示: '\u{1FA6C}', 技能: ['轮子', '隔山打牛', '杀敌'], 玩家: '黑方玩家'},
		'卒': {显示: '\u{1FA6D}', 技能: ['勇往直前', '过河卒', '杀敌'], 玩家: '黑方玩家'}
	},
	先手: 红方id,
	规则: ['不能叠加棋子', '王不见王', '斩将']
};

class 中国象棋 extends Game {
	constructor(cfg = {}, 红方名字, 黑方名字) {
		super(中国象棋.translateConfig({...中国象棋默认配置, ...cfg}, 红方名字, 黑方名字));
		this.cfg.GamingClass = 棋局;
		this.cfg.BattlefieldClass = 棋盘;
	}

	static translateConfig(cfg, 红方名字, 黑方名字) {
		return {
			棋盘: cfg.棋盘,
			battlefieldCfg: {rowSize: 10, colSize: 9},//现在是在‘棋局’里自行实现了_buildBattlefield。可以考虑凑父类的逻辑。
			teams: {
				[红方id]: {name: 红方id, color: 'red', players: {[红方玩家id]: {name: 红方名字}}},//以后可以给玩家加技能，比如‘走两步’
				[黑方id]: {name: 黑方id, color: 'black', players: {[黑方玩家id]: {name: 黑方名字}}}
			},
			unitTypes: Object.fromEntries(
				Object.entries(cfg.棋子类型)
				.map(([棋子名, 棋子]) =>
					[棋子名, {display: 棋子.显示, skills: 棋子.技能, player: 棋子.玩家, ...棋子}])
			),
			playerTurnSequence: cfg.先手 === 红方id ? [红方玩家id, 黑方玩家id] : [黑方玩家id, 红方玩家id],
			globalRules: cfg.规则,
			...cfg//带上原始数据
		};
	}
}

class 棋盘 extends Board {
	constructor(gaming, cfg) {
		super(gaming, cfg);
	}

	/**
	 * 调转棋盘。中国象棋是双方玩家面对面对弈，双方看到的棋盘恰好是180°调转。
	 * 返回棋盘转180°的位置关系。
	 */
	revert() {
		return [];//todo：实现
	}

	/**
	 * 返回指定玩家的‘地盘’（位置列表）。在经典棋盘里，红方占据下半边，黑方占据上半边。
	 * @param player
	 */
	areaOf(player) {
		return [];//todo：实现
	}

	/**
	 * 返回指定玩家的进攻方向：1表示向下，-1表示向上，可以加到rowNum上。在经典棋盘里，红方为-1，黑方为1。
	 * @param player
	 */
	forwardDirection(player) {
		return player.team.id === 红方id ? -1 : 1;
	}

	//todo：更多针对中国象棋棋盘的便捷方法。
}

class 棋局 extends Gaming {
	_buildBattlefield() {
		const battlefield = super._buildBattlefield();

		this.bulletin.notice('parsing board layout');
		const layout = this.cfg.棋盘.trim().split(/\s+/);
		const unitTypes = this.cfg.unitTypes;

		const playersById = this._getPlayersIdMap();

		// 根据布局字符串，创建单位实例并放置到棋盘上
		layout.forEach((rowStr, r) => {
			rowStr.split('').forEach((char, c) => {
				if (char !== '空') {
					const unitCfg = unitTypes[char];
					if (unitCfg) {
						const player = playersById[unitCfg.player];
						if (player) {
							const unit = this._buildUnit(player, {name: char, ...unitCfg});
							player.units.push(unit);
							const position = new 棋盘点位(r + 1, c + 1);
							battlefield.addUnitToPosition(unit, position);
						} else {
							console.warn(`未能根据ID找到玩家: ${unitCfg.player}`);
						}
					}
				}
			});
		});

		this.bulletin.notice('board parsed');
		return battlefield;
	}

	_buildSkill(owner, skillCfg) {
		// skillCfg 在此游戏中是一个字符串，如 '马行日'
		const SkillClass = 内置技能集[skillCfg];
		return super._buildSkill(owner, {class: SkillClass});
	}

	_buildGlobalRule(ruleCfg) {
		const RuleClass = 内置规则集[ruleCfg];
		return super._buildGlobalRule({class: RuleClass});
	}
}

const 内置规则集 = {
	'王不见王': class extends Rule {
		constructor(gaming, cfg) {
			super(gaming, {
				name: '王不见王', intro: '将帅不能碰见对方将帅，否则输棋。', tip: '将帅不能位于同一列且中间无其他棋子遮挡。',
				watchers: {
					'inited': () => {
						const allUnits = Array.from(this.gaming.battlefield.positionUnitsMapping.values()).flat();
						this.kingRed = allUnits.find(u => u.name === '帅');
						this.kingBlack = allUnits.find(u => u.name === '将');
					},
					'单位阵亡': ({unit}) => {
						if (unit === this.kingRed) {
							this.kingRed = null;
						}
						if (unit === this.kingBlack) {
							this.kingBlack = null;
						}
					},
					'已获取可移动位置集': ({unit, availableTargetPositions}) => {
						// 任何棋子移动后，都不能造成将帅对面的情况
						if (!this.kingRed || !this.kingBlack) {
							return; // 将帅不齐，不检查
						}

						const filteredPositions = availableTargetPositions.filter(targetPos => {
							const battlefield = this.gaming.battlefield;
							const movingUnit = unit;
							const fromPos = movingUnit.position;

							// 如果目标位置是对方将帅，则此规则不应阻止将军或绝杀
							if (targetPos.isEqualTo(this.kingRed.position) || targetPos.isEqualTo(this.kingBlack.position)) {
								return true;
							}

							// 推算移动后的将帅位置
							const futureKingRedPos = (movingUnit === this.kingRed) ? targetPos : this.kingRed.position;
							const futureKingBlackPos = (movingUnit === this.kingBlack) ? targetPos : this.kingBlack.position;

							// 如果移动后将帅不在同一列，则移动合法
							if (futureKingRedPos.colNum !== futureKingBlackPos.colNum) {
								return true;
							}

							// 如果在同一列，则检查两者之间是否有其他棋子
							const col = futureKingRedPos.colNum;
							const minRow = Math.min(futureKingRedPos.rowNum, futureKingBlackPos.rowNum);
							const maxRow = Math.max(futureKingRedPos.rowNum, futureKingBlackPos.rowNum);

							for (let r = minRow + 1; r < maxRow; r++) {
								const p = new 棋盘点位(r, col);

								// 如果有棋子要移动到将帅之间的位置，该移动合法，因为移动的棋子本身会成为遮挡物
								if (targetPos.isEqualTo(p)) {
									return true;
								}

								// 如果有棋子正从将帅之间的位置移开
								if (fromPos && fromPos.isEqualTo(p)) {
									// 如果该位置上还有其他棋子（虽然中国象棋里不常见），则移动合法
									if (battlefield.getUnitsAt(p).length > 1) {
										return true;
									}
									// 否则，该位置变为空，相当于少了一个遮挡物，继续检查下一行
								} else {
									// 检查棋盘上本来就在那里的棋子
									if (battlefield.getUnitsAt(p).length > 0) {
										return true; // 发现遮挡物，移动合法
									}
								}
							}

							// 遍历结束，未发现任何遮挡物，故移动非法
							return false;
						});

						// 用过滤后的结果替换原可移动位置列表
						availableTargetPositions.length = 0;
						availableTargetPositions.push(...filteredPositions);
					}
				},
				...cfg
			});
		}
	},
	'斩将': class extends Rule {
		constructor(gaming, cfg) {
			super(gaming, {
				name: '斩将', intro: '将帅阵亡则输棋。', tip: '保护好将帅。',
				watchers: {
					'单位阵亡': ({unit, killer}) => {
						if (unit.name === '将' || unit.name === '帅') {
							gaming.bulletin.notice('game:over', {winner: killer.owner});
						}
					}
				},
				...cfg
			});
		}
	},

	'不能叠加棋子': class extends Rule {
		constructor(gaming, cfg) {
			super(gaming, {
				name: '不能叠加棋子',
				intro: '棋子不能移动到已有己方棋子的位置。',
				...cfg,
				watchers: {
					'已获取可移动位置集': ({unit, availableTargetPositions}) => {
						if (!unit) {
							return;
						}
						const myTeam = unit.owner.team;
						const filtered = availableTargetPositions.filter(p => {
							const unitsAtTarget = this.gaming.battlefield.getUnitsAt(p);
							return unitsAtTarget.length === 0 || unitsAtTarget[0].owner.team !== myTeam;
						});
						availableTargetPositions.length = 0;
						availableTargetPositions.push(...filtered);
					}
				}
			});
		}
	},
};
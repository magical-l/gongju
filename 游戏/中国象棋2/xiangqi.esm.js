import {compareWithId, notice, watch} from './kit.esm.js';
import {
	BattlefieldBasedGaming, BattlefieldModule, Board, Player, Rule, Situation, Skill, TurnBasedGame, Unit, 棋盘点位,
} from './turn-based-game.esm.js';

export {
	红方id, 黑方id, 红方默认配置, 黑方默认配置, 红方玩家id, 黑方玩家id, 默认玩家顺序, 默认棋盘布局, 默认棋子类型,
	所有可选规则, 默认启用规则, 中国象棋默认配置,
	中国象棋, 战况, 棋盘, 棋局, 棋手,
	Move, 攻击,
	内置技能集, 内置规则集, 内置插件集,
};

const 汉语数字 = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
const calColName = (forwardDirection, is红方, colNum) => {
	if (forwardDirection < 0) {
		return is红方 ? 汉语数字[10 - colNum] : 10 - colNum;
	} else {
		return is红方 ? 汉语数字[colNum] : colNum;
	}
};

const 红方id = '红方';
const 黑方id = '黑方';
const 红方默认配置 = {name: 红方id, flag: 'red'};
const 黑方默认配置 = {name: 黑方id, flag: 'black'};
const 红方玩家id = 红方id + '玩家';
const 黑方玩家id = 黑方id + '玩家';
const is红方 = player => player.id === 红方玩家id;
const 默认玩家顺序 = [红方玩家id, 黑方玩家id];
const 默认棋盘布局 = `
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
`;
const 默认棋子类型 = {
	'帅': {显示: '\u{1FA60}', 技能: ['攻击', '步战四方', '守营'], 玩家: 红方玩家id},
	'仕': {显示: '\u{1FA61}', 技能: ['攻击', '护卫', '守营'], 玩家: 红方玩家id},
	'相': {显示: '\u{1FA62}', 技能: ['攻击', '象行田', '塞象眼', '水太深'], 玩家: 红方玩家id},
	'马': {显示: '\u{1FA63}', 技能: ['攻击', '马行日', '绊马脚'], 玩家: 红方玩家id},
	'车': {显示: '\u{1FA64}', 技能: ['轮子', '挡我者死'], 玩家: 红方玩家id},
	'炮': {显示: '\u{1FA65}', 技能: ['轮子', '隔山打牛'], 玩家: 红方玩家id},
	'兵': {显示: '\u{1FA66}', 技能: ['攻击', '勇往直前'], 玩家: 红方玩家id},
	'将': {显示: '\u{1FA67}', 技能: ['攻击', '步战四方', '守营'], 玩家: 黑方玩家id},
	'士': {显示: '\u{1FA68}', 技能: ['攻击', '护卫', '守营'], 玩家: 黑方玩家id},
	'象': {显示: '\u{1FA69}', 技能: ['攻击', '象行田', '塞象眼', '水太深'], 玩家: 黑方玩家id},
	'馬': {显示: '\u{1FA6A}', 技能: ['攻击', '马行日', '绊马脚'], 玩家: 黑方玩家id},
	'車': {显示: '\u{1FA6B}', 技能: ['轮子', '挡我者死'], 玩家: 黑方玩家id},
	'砲': {显示: '\u{1FA6C}', 技能: ['轮子', '隔山打牛'], 玩家: 黑方玩家id},
	'卒': {显示: '\u{1FA6D}', 技能: ['攻击', '勇往直前'], 玩家: 黑方玩家id},
};

class Move extends Skill {
	constructor(overrideCfg = {}) {
		super({name: '移动', ...overrideCfg});
	}

	activate(targets) {
		if (!targets || targets.length === 0) {
			return false;
		}
		const target = targets[0];
		const position = target instanceof Unit ? target.position : target;

		if (this.isValidTargets([position])) {
			this.gaming.battlefield.moveUnit(this.owner, position);
			return true;
		}
		return false;
	}

	_calculateReachablePositions() {
		let rawTargets = this.getRawTargetPositions();
		const eventPayload = {
			unit: this.owner,
			availableTargetPositions: [...rawTargets],
			blockedTargetPositions: [],
		};
		notice(this, '已获取可移动位置集', eventPayload);
		return {
			valid: this.gaming.battlefield.keepValidPositions(eventPayload.availableTargetPositions),
			blocked: this.gaming.battlefield.keepValidPositions(eventPayload.blockedTargetPositions),
		};
	}

	scopePositions() {
		const {valid, blocked} = this._calculateReachablePositions();
		return valid.concat(blocked);
	}

	get availableTargets() {
		const {valid} = this._calculateReachablePositions();
		return valid.filter(p => this.gaming.battlefield.getUnitsAt(p).length === 0);
	}

	get blockedTargets() {
		return this._calculateReachablePositions().blocked;
	}

	isValidTargets(targets) {
		const available = this.availableTargets || [];
		return targets.every(targetPos => {
			const pos = targetPos instanceof Unit ? targetPos.position : targetPos;
			return available.some(p => p.isEqualTo(pos));
		});
	}

	getRawTargetPositions() {
		return Array.from(this.gaming.battlefield.positions.keys());
	}
}

class 攻击 extends Skill {
	constructor(cfg) {
		super({
			name: '攻击',
			intro: '击败所在位置的敌军',
			tip: '选择敌方单位并将其击败',
			...cfg,
		});
	}

	activate(targets) {
		return (targets || []).map(targetUnit => {
			if (targetUnit instanceof Unit) {
				const place = targetUnit.position;
				const payload = {unit: this.owner, killed: targetUnit, place};
				this.gaming.battlefield.destroyUnit(targetUnit);
				notice(this, '单位杀敌', payload);
				return true;
			}
			return false;
		}).reduce((pre, cur) => pre || cur, false);
	}

	get availableTargets() {
		const unitsInScope = this.scopePositions().flatMap(p => this.gaming.battlefield.getUnitsAt(p));
		return unitsInScope.filter(unit => this.isAvailableTarget(unit));
	}

	scopePositions() {
		const moveSkill = this.owner.skills.find(s => s instanceof Move);
		if (!moveSkill) {
			return [];
		}
		return moveSkill.scopePositions();
	}

	isAvailableTarget(unit) {
		return unit.owner.id !== this.owner.owner.id;
	}
}

const 内置技能集 = {
	攻击,
	'挡我者死': class extends 攻击 {
		constructor(cfg) {
			super({
				name: '挡我者死',
				intro: '沿直线攻击敌方单位，中间不能有阻碍。',
				tip: '车可以沿直线攻击任何敌方单位，中间不能有其他棋子阻挡。攻击后移动到该位置。', ...cfg,
			});
		}

		scopePositions() {
			const {rowNum, colNum} = this.owner.position;
			const scope = [];
			const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
			directions.forEach(([dr, dc]) => {
				for (let i = 1; ; i++) {
					const r = rowNum + dr * i, c = colNum + dc * i, p = new 棋盘点位(r, c);
					if (!this.gaming.battlefield.isValidPosition(p)) {
						break;
					}
					scope.push(p);
					if (this.gaming.battlefield.getUnitsAt(p).length > 0) {
						break;
					}
				}
			});
			return scope;
		}
	},
	'隔山打牛': class extends 攻击 {
		constructor(cfg) {
			super({
				name: '隔山打牛',
				intro: '隔山打炮，跳过一个棋子攻击敌方单位。',
				tip: '炮可以跳过一个棋子（无论敌我）攻击路径上的第二个敌方棋子。攻击后移动到该位置。', ...cfg,
			});
		}

		scopePositions() {
			const {rowNum, colNum} = this.owner.position;
			const scope = [];
			const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
			directions.forEach(([dr, dc]) => {
				let jumpedOver = false;
				for (let i = 1; ; i++) {
					const r = rowNum + dr * i, c = colNum + dc * i, p = new 棋盘点位(r, c);
					if (!this.gaming.battlefield.isValidPosition(p)) {
						break;
					}
					const units = this.gaming.battlefield.getUnitsAt(p);
					if (units.length > 0) {
						if (!jumpedOver) {
							jumpedOver = true;
						} else {
							scope.push(p);
							break;
						}
					}
				}
			});
			return scope;
		}
	},
	'步战四方': class extends Move {
		constructor(cfg) {
			super({name: '步战四方', intro: '可以向前后左右移动一格', tip: '可以向前后左右移动一格。', ...cfg});
		}

		getRawTargetPositions() {
			const {rowNum, colNum} = this.owner.position;
			return this.gaming.battlefield.keepValidPositions([new 棋盘点位(rowNum - 1, colNum),
																												 new 棋盘点位(rowNum + 1, colNum),
																												 new 棋盘点位(rowNum, colNum - 1),
																												 new 棋盘点位(rowNum, colNum + 1)]);
		}
	},
	'守营': class extends Skill {
		constructor(cfg) {
			super({
				name: '守营',
				intro: '有守卫大营之责，不能冲锋陷阵。',
				tip: '不能离开九宫格。',
				...cfg,
				watchers: {
					'已获取可移动位置集': ({unit, availableTargetPositions}) => {
						if (unit.id === this.owner.id) {
							const filtered = availableTargetPositions.filter(p => this.gaming.battlefield.isInPalace(p));
							availableTargetPositions.length = 0;
							availableTargetPositions.push(...filtered);
						}
					},
				},
			});
		}
	},
	'护卫': class extends Move {
		constructor(cfg) {
			super({
				name: '护卫',
				intro: '斜刺里冲出，护卫将帅。',
				tip: '可以向左前方、右前方、左后方、右后方斜线移动至一格对角线方向。', ...cfg,
			});
		}

		getRawTargetPositions() {
			const {rowNum, colNum} = this.owner.position;
			return this.gaming.battlefield.keepValidPositions([new 棋盘点位(rowNum - 1, colNum - 1),
																												 new 棋盘点位(rowNum - 1, colNum + 1),
																												 new 棋盘点位(rowNum + 1, colNum - 1),
																												 new 棋盘点位(rowNum + 1, colNum + 1)]);
		}
	},
	'象行田': class extends Move {
		constructor(cfg) {
			super({
				name: '象行田',
				intro: '走一个“田字形”。',
				tip: '可移动到斜线两格的位置（‘田字’对角线）。',
				...cfg,
			});
		}

		getRawTargetPositions() {
			const {rowNum, colNum} = this.owner.position;
			return this.gaming.battlefield.keepValidPositions([new 棋盘点位(rowNum - 2, colNum - 2),
																												 new 棋盘点位(rowNum - 2, colNum + 2),
																												 new 棋盘点位(rowNum + 2, colNum - 2),
																												 new 棋盘点位(rowNum + 2, colNum + 2)]);
		}
	},
	'塞象眼': class extends Skill {
		constructor(cfg) {
			super({
				name: '塞象眼',
				intro: '如果“田”字中心有棋子，则无法移动过去。',
				...cfg,
				watchers: {
					'已获取可移动位置集': ({unit, availableTargetPositions, blockedTargetPositions}) => {
						if (unit.id === this.owner.id) {
							const {rowNum, colNum} = this.owner.position;
							const stillValid = [];
							availableTargetPositions.forEach(p => {
								const middlePos = new 棋盘点位((p.rowNum + rowNum) / 2, (p.colNum + colNum) / 2);
								if (this.gaming.battlefield.getUnitsAt(middlePos).length > 0) {
									blockedTargetPositions.push(p);
								} else {
									stillValid.push(p);
								}
							});
							availableTargetPositions.length = 0;
							availableTargetPositions.push(...stillValid);
						}
					},
				},
			});
		}
	},
	'水太深': class extends Skill {
		constructor(cfg) {
			super({
				name: '水太深',
				intro: '不能渡过楚河汉界。',
				tip: '不能过河',
				...cfg,
				watchers: {
					'已获取可移动位置集': ({unit, availableTargetPositions}) => {
						if (unit.id === this.owner.id) {
							const filtered = availableTargetPositions.filter(
								p => !this.gaming.battlefield.isAcrossRiver(p, unit.owner));
							availableTargetPositions.length = 0;
							availableTargetPositions.push(...filtered);
						}
					},
				},
			});
		}
	},
	'马行日': class extends Move {
		constructor(cfg) { super({name: '马行日', intro: '走一个“日字形”。', tip: '可以移动到“日字”对角线的位置', ...cfg}); }

		getRawTargetPositions() {
			const {rowNum, colNum} = this.owner.position;
			return this.gaming.battlefield.keepValidPositions([new 棋盘点位(rowNum - 2, colNum - 1),
																												 new 棋盘点位(rowNum - 2, colNum + 1),
																												 new 棋盘点位(rowNum + 2, colNum - 1),
																												 new 棋盘点位(rowNum + 2, colNum + 1),
																												 new 棋盘点位(rowNum - 1, colNum - 2),
																												 new 棋盘点位(rowNum - 1, colNum + 2),
																												 new 棋盘点位(rowNum + 1, colNum - 2),
																												 new 棋盘点位(rowNum + 1, colNum + 2)]);
		}
	},
	'绊马脚': class extends Skill {
		constructor(cfg) {
			super({
				name: '绊马脚',
				intro: '如果前进方向的第一个交叉点有棋子，则无法移动。',
				...cfg,
				watchers: {
					'已获取可移动位置集': ({unit, availableTargetPositions, blockedTargetPositions}) => {
						if (unit.id === this.owner.id) {
							const {rowNum, colNum} = this.owner.position;
							const stillValid = [];
							availableTargetPositions.forEach(p => {
								const dr = p.rowNum - rowNum, dc = p.colNum - colNum;
								let blockPos;
								if (Math.abs(dr) === 2 && Math.abs(dc) === 1) {
									blockPos = new 棋盘点位(rowNum + dr / 2, colNum);
								} else if (Math.abs(dr) === 1 && Math.abs(dc) === 2) {
									blockPos = new 棋盘点位(rowNum, colNum + dc / 2);
								}
								if (blockPos && this.gaming.battlefield.getUnitsAt(blockPos).length > 0) {
									blockedTargetPositions.push(p);
								} else {
									stillValid.push(p);
								}
							});
							availableTargetPositions.length = 0;
							availableTargetPositions.push(...stillValid);
						}
					},
				},
			});
		}
	},
	'轮子': class extends Move {
		constructor(cfg) { super({name: '轮子', intro: '在没有阻挡的情况下，可以在横向或纵向的任何位置移动。', ...cfg}); }

		getRawTargetPositions() {
			const {rowNum, colNum} = this.owner.position, {rowSize, colSize} = this.gaming.battlefield, rt = [];
			for (let r = rowNum - 1; r >= 1; r--) {
				const p = new 棋盘点位(r, colNum);
				if (this.gaming.battlefield.getUnitsAt(p).length > 0) {
					break;
				}
				rt.push(p);
			}
			for (let r = rowNum + 1; r <= rowSize; r++) {
				const p = new 棋盘点位(r, colNum);
				if (this.gaming.battlefield.getUnitsAt(p).length > 0) {
					break;
				}
				rt.push(p);
			}
			for (let c = colNum - 1; c >= 1; c--) {
				const p = new 棋盘点位(rowNum, c);
				if (this.gaming.battlefield.getUnitsAt(p).length > 0) {
					break;
				}
				rt.push(p);
			}
			for (let c = colNum + 1; c <= colSize; c++) {
				const p = new 棋盘点位(rowNum, c);
				if (this.gaming.battlefield.getUnitsAt(p).length > 0) {
					break;
				}
				rt.push(p);
			}
			return rt;
		}
	},
	'勇往直前': class extends Move {
		constructor(cfg) { super({name: '勇往直前', intro: '未过河时只能向前，过河后可横向移动。', ...cfg}); }

		getRawTargetPositions() {
			const {rowNum, colNum} = this.owner.position,
				forward = this.gaming.battlefield.forwardDirection(this.owner.owner),
				rt = [new 棋盘点位(rowNum + forward, colNum)];
			if (this.gaming.battlefield.isAcrossRiver(this.owner.position, this.owner.owner)) {
				rt.push(new 棋盘点位(rowNum, colNum - 1));
				rt.push(new 棋盘点位(rowNum, colNum + 1));
			}
			return this.gaming.battlefield.keepValidPositions(rt);
		}
	},
};

const 内置规则集 = {
	'杀敌后进驻': class extends Rule {
		constructor(gaming, cfg) {
			super(gaming, {
				name: '杀敌后进驻',
				intro: '吃子后占据其位置。',
				tip: '消灭敌方单位后，移动到该单位原来的位置。',
				watchers: {
					'单位杀敌': ({unit, killed, place}) => {
						this.gaming.battlefield.moveUnit(unit, place);
					},
				},
			});
		}
	},
	'王不见王': class extends Rule {
		constructor(gaming, cfg) {
			super(gaming, {
				name: '王不见王',
				intro: '将帅不能碰见对方将帅，否则输棋。',
				tip: '将帅不能位于同一列且中间无其他棋子遮挡。',
				...cfg,
				watchers: {
					'构建单位结束': ({unit}) => {
						const is红方_ = is红方(unit.owner);
						if (unit.name === '帅' && is红方_) {
							this.kingRed = unit;
						} else if (unit.name === '将' && !is红方_) {
							this.kingBlack = unit;
						}
					},
					'单位杀敌': ({killed}) => {
						if (killed === this.kingRed) {
							this.kingRed = null;
						}
						if (killed === this.kingBlack) {
							this.kingBlack = null;
						}
					},
					'已获取可移动位置集': ({unit, availableTargetPositions}) => {
						if (!this.kingRed || !this.kingBlack) {
							return;
						}
						const filteredPositions = availableTargetPositions.filter(targetPos => {
							const battlefield = this.gaming.battlefield,
								movingUnit = unit,
								fromPos = movingUnit.position;
							if (targetPos.isEqualTo(this.kingRed.position) || targetPos.isEqualTo(
								this.kingBlack.position)) {
								return true;
							}
							const futureKingRedPos = movingUnit === this.kingRed ? targetPos : this.kingRed.position,
								futureKingBlackPos = movingUnit === this.kingBlack ? targetPos : this.kingBlack.position;
							if (futureKingRedPos.colNum !== futureKingBlackPos.colNum) {
								return true;
							}
							const col = futureKingRedPos.colNum,
								minRow = Math.min(futureKingRedPos.rowNum, futureKingBlackPos.rowNum),
								maxRow = Math.max(futureKingRedPos.rowNum, futureKingBlackPos.rowNum);
							for (let r = minRow + 1; r < maxRow; r++) {
								const p = new 棋盘点位(r, col);
								if (targetPos.isEqualTo(p)) {
									return true;
								}
								if (fromPos && fromPos.isEqualTo(p)) {
									if (battlefield.getUnitsAt(p).length > 1) {
										return true;
									}
								} else {
									if (battlefield.getUnitsAt(p).length > 0) {
										return true;
									}
								}
							}
							return false;
						});
						availableTargetPositions.length = 0;
						availableTargetPositions.push(...filteredPositions);
					},
				},
			});
		}
	},
	'斩将': class extends Rule {
		constructor(gaming, cfg) {
			super(gaming, {
				name: '斩将',
				intro: '将帅阵亡则输棋。',
				tip: '保护好将帅。',
				watchers: {
					'单位杀敌': ({unit, killed}) => {
						if (killed.name === '将' || killed.name === '帅') {
							gaming.bulletin.notice('game over', {winner: unit.owner});
						}
					},
				}, ...cfg,
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
						const filtered = availableTargetPositions.filter(p => {
							const unitsAtTarget = this.gaming.battlefield.getUnitsAt(p);
							return unitsAtTarget.length === 0 || !compareWithId(unitsAtTarget[0].owner, unit.owner);
						});
						availableTargetPositions.length = 0;
						availableTargetPositions.push(...filtered);
					},
				},
			});
		}
	},
	'红方动两次': class extends Rule {
		constructor(gaming, cfg) {
			super(gaming, {
				name: '红方动两次',
				intro: '红方在自己的每个回合中，可以连续移动两次。', ...cfg,
				watchers: {
					'player-turn start': ({player}) => {
						if (is红方(player)) {
							player.actionsPerTurn = 2;
						}
					},
					'player-turn end': ({player}) => {
						if (is红方(player)) {
							player.actionsPerTurn = 1;
						}
					},
				},
			});
		}
	},
};
const 所有可选规则 = Object.keys(内置规则集);
const 默认启用规则 = ['不能叠加棋子', '王不见王', '斩将', '杀敌后进驻'];

const 内置插件集 = {};

const 中国象棋默认配置 = {
	棋盘: 默认棋盘布局,
	棋子类型: 默认棋子类型,
	玩家顺序: 默认玩家顺序,
	规则: 默认启用规则,
	插件: Object.keys(内置插件集),
};

class 中国象棋 extends TurnBasedGame {
	constructor(cfg = {}, 红方名字, 黑方名字) {
		super(中国象棋.translateConfig({...中国象棋默认配置, ...cfg}, 红方名字, 黑方名字));
		this.cfg.GamingClass = 棋局;
		this.cfg.BattlefieldClass = 棋盘;
		this.cfg.SituationClass = 战况;
		this.cfg.PlayerClass = 棋手;
		this.cfg.UnitClass = 棋子;
	}

	static translateConfig(cfg, 红方名字, 黑方名字) {
		const unitsPositionCfg = {};
		const layout = cfg.棋盘.trim().split(/\s+/);
		for (let i = 0; i < layout.length; i++) {
			const ps = layout[i].split('');
			for (let j = 0; j < ps.length; j++) {
				const unitTypeName = ps[j];
				if (unitTypeName && unitTypeName !== '空') {
					const positionDescription = `(${i + 1},${j + 1})`;
					unitsPositionCfg[positionDescription] = unitTypeName;
				}
			}
		}
		return {
			modules: [
				{
					class: BattlefieldModule,
					battlefieldClass: 棋盘,
					rowSize: 10,
					colSize: 9,
					unitsPositionCfg,
				},
			],
			unitTypes: Object.fromEntries(
				Object.entries(cfg.棋子类型)
							.map(([棋子名, 棋子]) =>
								[棋子名, {display: 棋子.显示, skills: 棋子.技能, player: 棋子.玩家, ...棋子}])),
			playerTurnSequence: cfg.玩家顺序.map(playerId =>
				playerId === 红方玩家id ? {id: 红方玩家id, name: 红方名字, team: 红方默认配置}
																: {id: 黑方玩家id, name: 黑方名字, team: 黑方默认配置}),
			globalRules: cfg.规则,
			plugins: cfg.插件,
			...cfg,
		};
	}
}

class 战况 extends Situation {
	_unitName;
	_roundNotations = [];
	get roundNotations() {
		return this._roundNotations;
	}

	constructor(gaming) {
		super(gaming);

		watch(this, '玩家选择了单位', ({player, units}) => {
				const unit = units[0],
					同名单位行号集 = [],
					{rowNum, colNum} = unit.position,
					forwardDirection = this.gaming.battlefield.forwardDirection(player);
				for (let i = 1; i <= this.gaming.battlefield.rowSize; i++) {
					const units = this.gaming.battlefield.getUnitsAt(new 棋盘点位(i, colNum));
					if (units.filter(u => u.name === unit.name && u.owner === player).length) {
						同名单位行号集.push(i);
					}
				}
				const len = 同名单位行号集.length;
				if (len === 1) {
					this._unitName = unit.name + calColName(forwardDirection, is红方(player), colNum);
				} else {
					同名单位行号集.sort(forwardDirection === -1 ? (a, b) => a - b : (a, b) => b - a);
					const index = 同名单位行号集.indexOf(rowNum);
					if (index === 0) {
						this._unitName = '前' + unit.name;
					} else if (index === len - 1) {
						this._unitName = '后' + unit.name;
					} else if (len === 3) {
						this._unitName = '中' + unit.name;
					} else {
						this._unitName = 汉语数字[index + 1] + unit.name;
					}
				}
			},
		);
		watch(this, '单位移动', move => this._generateNotation(move));
	}

	_generateNotation(move) {
		const isAttacking = (rowDiff, forwardDirection) => Math.sign(rowDiff) === Math.sign(forwardDirection);
		const {unit, from} = move,
			newPosition = unit.position,
			rowDiff = newPosition.rowNum - from.rowNum,
			newColNum = newPosition.colNum,
			is红方_ = is红方(unit.owner),
			forwardDirection = this.gaming.battlefield.forwardDirection(unit.owner);
		let moveType, target;
		if (rowDiff === 0) {
			moveType = '平';
			target = calColName(forwardDirection, is红方_, newColNum);
		} else {
			moveType = isAttacking(rowDiff, forwardDirection) ? '进' : '退';
			if (newColNum !== from.colNum) {
				target = calColName(forwardDirection, is红方_, newColNum);
			} else {
				target
					= is红方_ ? 汉语数字[Math.abs(rowDiff)] : Math.abs(rowDiff);
			}
		}
		const notation = `${this._unitName}${moveType}${target}`,
			roundNotations = this._roundNotations;
		if (is红方_) {
			roundNotations.push([notation]);
		} else {
			if (roundNotations.length > 0 && roundNotations.at(-1).length === 1) {
				roundNotations.at(-1).push(notation);
			} else {
				roundNotations.push(['', notation]);
			}
		}
	}
}

class 棋盘 extends Board {
	constructor(gaming, cfg) { super(gaming, cfg); }

	_initUnitsPositions() {
		super._initUnitsPositions();
		//确定双方进攻方向
		const allUnits = this.positions.flat().flatMap(p => this.getUnitsAt(p)),
			kingRed = allUnits.find(u => u.name === '帅'),
			kingBlack = allUnits.find(u => u.name === '将');
		if (kingRed && kingBlack) {
			if (kingRed.position.rowNum > kingBlack.position.rowNum) {
				this.playerDown = kingRed.owner;
				this.playerUp = kingBlack.owner;
			} else {
				this.playerDown = kingBlack.owner;
				this.playerUp = kingRed.owner;
			}
		}
		return allUnits;
	}

	revert() { return this.positions.slice().reverse().map(row => row.slice().reverse()); }

	areaOf(player) {
		const allPositions = this.positions.flat();
		if (this.playerDown && player === this.playerDown) {
			return allPositions.filter(p => p.rowNum >= 6);
		}
		if (this.playerUp && player === this.playerUp) {
			return allPositions.filter(p => p.rowNum <= 5);
		}
		return [];
	}

	forwardDirection(player) {
		if (this.playerDown && compareWithId(player, this.playerDown)) {
			return -1;
		}
		if (this.playerUp && compareWithId(player, this.playerUp)) {
			return 1;
		}
		return is红方(player) ? -1 : 1;
	}

	isValidPosition(position) {
		return position.rowNum >= 1 && position.rowNum <= this._rowSize && position.colNum >= 1 && position.colNum
					 <= this._colSize;
	}

	isInPalace(position) {
		if (position.colNum < 4 || position.colNum > 6) {
			return false;
		}
		return position.rowNum >= 1 && position.rowNum <= 3 || position.rowNum >= 8 && position.rowNum <= 10;
	}

	isAcrossRiver(position, player) {
		const forward = this.forwardDirection(player);
		if (forward === -1) {
			return position.rowNum <= 5;
		} else {
			return position.rowNum >= 6;
		}
	}
}

class 棋局 extends BattlefieldBasedGaming {
	_build() {
		//先监听，有些时机在super._build内部
		const eventTranslations = {
			'gaming build start': '游戏构建开始',
			'gaming build end': '游戏构建结束',
			'buildUnit start': '构建单位开始',
			'buildUnit end': '构建单位结束',
			'gaming start': '游戏开始',
			'gaming end': '游戏结束',
			'round start': '回合开始',
			'round end': '回合结束',
			'player-turn start': '轮次开始',
			'player-turn end': '轮次结束',
			'player selectUnits end': '玩家选择了单位',
			'player selectSkills end': '玩家选择了技能',
			'player:deselected-unit': '玩家取消选择单位',
			'battlefield moveUnit end': '单位移动',
		};
		Object.entries(eventTranslations)
					.forEach(([enTopiName, cnTopicName]) =>
						watch(this, enTopiName, payload => notice(this, cnTopicName, payload)));

		super._build();
	}

	_buildGlobalRule(ruleCfg) {
		const RuleClass = 内置规则集[ruleCfg];
		return super._buildGlobalRule({class: RuleClass});
	}

	_buildPlugin(pluginCfg) {
		const PluginClass = 内置插件集[pluginCfg];
		return super._buildPlugin({class: PluginClass});
	}
}

class 棋手 extends Player {
	selectUnits(units) {
		super.selectUnits(units);
		if (this.selectedUnits.length) {
			const unit = units[0],
				skillsToSelect = [],
				moveSkill = unit?.skills.find(s => s instanceof Move);
			if (moveSkill) {
				skillsToSelect.push(moveSkill);
			}
			const killSkill = unit?.skills.find(s => s instanceof 攻击);
			if (killSkill) {
				skillsToSelect.push(killSkill);
			}
			if (skillsToSelect.length > 0) {
				super.selectSkills(skillsToSelect);
			}
		}
	}
}

class 棋子 extends Unit {
	_buildSkill(skillCfg) {//skillCfg是skill的名字
		const SkillClass = 内置技能集[skillCfg];
		return super._buildSkill({class: SkillClass});
	}
}
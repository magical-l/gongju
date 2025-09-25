import {Board, Game, Gaming, Player, Situation, 棋盘点位} from './turn-based-game.esm.js';
import {内置插件集} from './defaultGlobalPlugins.esm.js';
import {内置规则集} from './defaultGlobalRules.esm.js';
import {Move, 内置技能集, 攻击} from './defaultSkills.esm.js';

const 红方id = '红方';
const 黑方id = '黑方';
const 红方默认配置 = {name: 红方id, flag: 'red'};
const 黑方默认配置 = {name: 黑方id, flag: 'black'};
const 红方玩家id = 红方id + '玩家';
const 黑方玩家id = 黑方id + '玩家';
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

const 所有可选规则 = ['不能叠加棋子', '王不见王', '斩将', '红方动两次'];
const 默认启用规则 = ['不能叠加棋子', '王不见王', '斩将'];

//字段名将来展示于设置面板里，所以是中文。
const 中国象棋默认配置 = {
	棋盘: 默认棋盘布局,
	棋子类型: 默认棋子类型,
	玩家顺序: 默认玩家顺序,
	规则: 默认启用规则,
	插件: 内置插件集,
};

class 中国象棋 extends Game {
	constructor(cfg = {}, 红方名字, 黑方名字) {
		super(中国象棋.translateConfig({...中国象棋默认配置, ...cfg}, 红方名字, 黑方名字));
		this.cfg.GamingClass = 棋局;
		this.cfg.BattlefieldClass = 棋盘;
		this.cfg.SituationClass = 战况;
		this.cfg.PlayerClass = 棋手;
	}

	static translateConfig(cfg, 红方名字, 黑方名字) {
		return {
			棋盘: cfg.棋盘,
			battlefieldCfg: {rowSize: 10, colSize: 9},//现在是在‘棋局’里自行实现了_buildBattlefield。可以考虑凑父类的逻辑。
			teams: {
				[红方id]: {...红方默认配置, players: {[红方玩家id]: {name: 红方名字}}},//以后可以给玩家加技能，比如‘走两步’
				[黑方id]: {...黑方默认配置, players: {[黑方玩家id]: {name: 黑方名字}}},
			},
			unitTypes: Object.fromEntries(
				Object.entries(cfg.棋子类型)
				.map(([棋子名, 棋子]) =>
					[棋子名, {display: 棋子.显示, skills: 棋子.技能, player: 棋子.玩家, ...棋子}]),
			),
			playerTurnSequence: cfg.玩家顺序,
			globalRules: cfg.规则, // 核心规则已内置，这里只加载可选规则
			plugins: cfg.插件,
			...cfg,//带上原始数据
		};
	}
}

class 战况 extends Situation {
	roundNotations = [];//[[红方行动,黑方行动],……]

	constructor(gaming) {
		super(gaming);
	}
}

class 棋盘 extends Board {
	constructor(gaming, cfg) {
		super(gaming, cfg);
	}

	/**
	 * 调转棋盘。中国象棋是双方玩家面对面对弈，双方看到的棋盘恰好是180°调转。
	 * 返回一个包含同样棋盘点位，但是行列都颠倒的二维数组。
	 */
	revert() {
		// 复制并反转所有行，然后对每一行进行复制和反转
		return this.positions.slice().reverse().map(row => row.slice().reverse());
	}

	/**
	 * 返回指定玩家的‘地盘’（位置列表）。在经典棋盘里，红方占据下半边，黑方占据上半边。
	 * @param player
	 */
	areaOf(player) {
		const allPositions = this.positions.flat();
		// 根据棋盘上记录的上下方位来判断
		if (this.playerDown && player === this.playerDown) {
			// “下方”玩家的地盘是6-10行
			return allPositions.filter(p => p.rowNum >= 6);
		}
		if (this.playerUp && player === this.playerUp) {
			// “上方”玩家的地盘是1-5行
			return allPositions.filter(p => p.rowNum <= 5);
		}
		// 提供一个默认值作为兼容
		return [];
	}

	/**
	 * 返回指定玩家的进攻方向：1表示向下，-1表示向上，可以加到rowNum上。在经典棋盘里，红方为-1，黑方为1。
	 * @param player
	 */
	forwardDirection(player) {
		// “下方”玩家（帅在下）的进攻方向是-1，“上方”玩家（将在上）的进攻方向是1
		if (this.playerDown && player === this.playerDown) {
			return -1;
		}
		if (this.playerUp && player === this.playerUp) {
			return 1;
		}
		// 如果出现意外情况，提供一个默认值作为兼容
		return player.team.id === 红方id ? -1 : 1;
	}

	/**
	 * 检查一个点位是否在棋盘边界内。
	 * @param {棋盘点位} position
	 * @returns {boolean}
	 */
	isValidPosition(position) {
		return position.rowNum >= 1 && position.rowNum <= this.rowSize &&
					 position.colNum >= 1 && position.colNum <= this.colSize;
	}

	/**
	 * 检查一个点位是否在九宫格内
	 * @param {棋盘点位} position
	 * @returns {boolean}
	 */
	isInPalace(position) {
		if (position.colNum < 4 || position.colNum > 6) {
			return false;
		}
		return position.rowNum >= 1 && position.rowNum <= 3 || position.rowNum >= 8 && position.rowNum <= 10;
	}

	/**
	 * 检查一个点位对指定玩家来说是否算“已过河”
	 * @param {棋盘点位} position
	 * @param {Player} player
	 * @returns {boolean}
	 */
	isAcrossRiver(position, player) {
		const forward = this.forwardDirection(player);
		if (forward === -1) {
			return position.rowNum <= 5;
		} else {
			return position.rowNum >= 6;
		}
	}
}

class 棋局 extends Gaming {
	_build() {
		super._build();
		this.situation.roundNotations = [];
		this.bulletin.watch('单位移动', move => this._generateNotation(move));

		// 事件名适配器：将框架的英文事件名翻译为中文，供应用层使用
		const eventTranslations = {
			'initing': '初始化中',
			'inited': '初始化完成',
			'game start': '游戏开始',
			'game end': '游戏结束',
			'round start': '回合开始',
			'round end': '回合结束',
			'player-turn start': '轮次开始',
			'player-turn end': '轮次结束',
			'player selected units': '玩家选择了单位',
			'player selected skills': '玩家选择了技能',
			'player:deselected-unit': '玩家取消选择单位',
			'unit moved': '单位移动',
		};

		Object.entries(eventTranslations)
		.forEach(([englishEvent, chineseEvent]) =>
			this.bulletin.watch(englishEvent, payload => this.bulletin.notice(chineseEvent, payload)));
	}

	_generateNotation(move) {
		const {unit, oldPosition} = move;
		const newPosition = unit.position;
		const isRed = unit.owner.team.id === '红方';
		const notation = `${unit.name}: ${oldPosition} -> ${newPosition}`;

		if (isRed) {
			this.situation.roundNotations.push([notation]);
		} else {
			if (this.situation.roundNotations.length > 0 && this.situation.roundNotations.at(-1).length === 1) {
				this.situation.roundNotations.at(-1).push(notation);
			} else {
				this.situation.roundNotations.push([null, notation]);
			}
		}
	}

	_buildBattlefield() {
		const battlefield = super._buildBattlefield();

		this.bulletin.notice('parsing board layout');
		const layout = this.cfg.棋盘.trim().split(/\s+/);
		const unitTypes = this.cfg.unitTypes;

		const playersById = this.playersIdMap;

		// 根据布局字符串，创建单位实例并放置到棋盘上
		layout.forEach((rowStr, r) => {
			rowStr.split('').forEach((char, c) => {
				if (char !== '空') {
					const unitCfg = unitTypes[char];
					if (unitCfg) {
						const player = playersById[unitCfg.player];
						if (player) {
							const unit = this._buildUnit(player, {name: char, ...unitCfg});
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

		// 根据将帅初始位置，决定双方的方位
		const allUnits = battlefield.positions.flat().flatMap(p => battlefield.getUnitsAt(p));
		const kingRed = allUnits.find(u => u.name === '帅');
		const kingBlack = allUnits.find(u => u.name === '将');

		if (kingRed && kingBlack) {
			if (kingRed.position.rowNum > kingBlack.position.rowNum) {
				battlefield.playerDown = kingRed.owner;
				battlefield.playerUp = kingBlack.owner;
			} else {
				battlefield.playerDown = kingBlack.owner;
				battlefield.playerUp = kingRed.owner;
			}
		}

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

	_buildPlugin(pluginCfg) {
		const PluginClass = 内置插件集[pluginCfg];
		return super._buildPlugin({class: PluginClass});
	}
}

class 棋手 extends Player {
	/**
	 * 选择棋子作为行动单位。
	 * @override
	 */
	selectUnits(units) {
		// 调用父类方法，完成基础的选择单位、重置技能和目标的操作
		super.selectUnits(units);

		if (this.selectedUnits.length) {
			// 象棋逻辑：选定棋子后，自动“选择”其默认的移动和杀敌技能
			const unit = units[0];
			const skillsToSelect = [];

			// 查找移动技能
			const moveSkill = unit?.skills.find(s => s instanceof Move);
			if (moveSkill) {
				skillsToSelect.push(moveSkill);
			}

			// 查找杀敌技能
			const killSkill = unit?.skills.find(s => s instanceof 攻击);
			if (killSkill) {
				skillsToSelect.push(killSkill);
			}

			if (skillsToSelect.length > 0) {
				// 直接调用父类的 selectSkills，不走 processInput 的分派逻辑
				super.selectSkills(skillsToSelect);
			}
		}
	}
}
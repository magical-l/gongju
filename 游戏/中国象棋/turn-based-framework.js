/**
 * 通用回合制游戏框架
 */

//===============================================基础类

/**
 * 公告栏(事件总线)，用于发布通知。同时也提供订阅、不再订阅的功能。
 */
class Bulletin {
	constructor() {
		this.listeners = {};
	}

	/**
	 * 订阅一个主题
	 * @param {string} topic 主题名
	 * @param {Function} watcher 订阅者（回调函数）
	 */
	watch(topic, watcher) {
		(this.listeners[topic] = this.listeners[topic] || []).push(watcher);
	}

	/**
	 * 取消订阅一个主题
	 * @param {string} topic 主题名
	 * @param {Function} watcher 订阅者（回调函数）
	 */
	unwatch(topic, watcher) {
		if (this.listeners[topic]) {
			this.listeners[topic] = this.listeners[topic].filter(i => i !== watcher);
		}
	}

	/**
	 * 发出一个通知
	 * @param {string} topic 主题名
	 * @param {object} payload 事件荷载
	 */
	notice(topic, payload = {}) {
		(this.listeners[topic] || []).forEach(cb => cb(payload));
	}
}

/**
 * 位置的抽象基类。强制子类实现toString()，用于在Map中作为唯一的key。
 */
class Position {
	toString() {
		throw new Error("子类必须实现toString()");
	}

	isEqualTo(otherPosition) {
		return otherPosition && this.toString() === otherPosition.toString();
	}
}

/**
 * 实现本接口意味着是一场游戏的一部分，可以直接访问到该场游戏（Gaming对象）
 */
class GamingPart {
	constructor(gaming) {
		this.gaming = gaming;
	}
}

/**
 * 战场。主要是地图、环境、单位等的实时情况。
 */
class Battlefield extends GamingPart {
	positions = new Map(); // Map<Position的key, Unit[]>

	constructor(gaming) {
		super(gaming);
	}

	moveUnit(unit, position) {
		this.removeUnitFromPosition(unit);
		this.addUnitToPosition(unit, position);
		this.gaming.bulletin.notice('单位已移动', {unit}); // payload中不包含to，因为unit.position已是最新
	}

	destroyUnit(unit) {
		this.removeUnitFromPosition(unit);
		if (unit.owner && unit.owner.units) {
			unit.owner.units = unit.owner.units.filter(u => u !== unit);
		}
		this.gaming.notice('unit:destroyed', {unit});
	}

	addUnitToPosition(unit, position) {
		const key = this._positionKey(position);
		if (!this.positions.has(key)) {
			this.positions.set(key, []);
		}
		this.positions.get(key).push(unit);
		unit._position = position; // 直接修改内部属性，避免触发setter递归
	}

	_positionKey(position) {
		return position.toString();
	}

	removeUnitFromPosition(unit) {
		if (!unit.position) {
			return;
		}
		const key = this._positionKey(unit.position);
		const unitsAtPos = this.positions.get(key);
		if (unitsAtPos) {
			const index = unitsAtPos.indexOf(unit);
			if (index > -1) {
				unitsAtPos.splice(index, 1);
				if (unitsAtPos.length === 0) {
					this.positions.delete(key);
				}
			}
		}
		unit._position = null; // 直接修改内部属性，避免触发setter递归
	}

	getUnitsAt(position) {
		return this.positions.get(this._positionKey(position)) || [];
	}

	/**
	 * 移除出界的位置。默认直接返回。
	 */
	keepValidPositions(positions) {
		return positions;
	}

	//todo：需要增加许多关于位置的方法。比如计算两个单位的距离、获取距离某个单位为x的位置集……
}

/**
 * 战况。记录游戏的实时状态、已成历史的客观事实（比如操作、事件等）。
 */
class Situation extends GamingPart {
	rounds = [];
	isStarted = false;
	isEnded = false;
	winner;

	constructor(gaming) {
		super(gaming);
	}
}

class Team extends GamingPart {
	name;
	color;
	players = [];

	constructor(gaming, cfg) {
		super(gaming);
		Object.assign(this, cfg);
	}
}

class Player extends GamingPart {
	id;
	team;
	name;
	units = [];
	selectedUnits = [];

	constructor(team, cfg) {
		super(team.gaming);
		Object.assign(this, cfg);
		//todo: this.inputChannel this.outputChannel
	}

	/**
	 * 轮到本玩家行动。返回一个Promise，在回合结束时resolve。
	 * @returns {Promise<void>}
	 */
	async play() {
		return new Promise(resolve => {
			const unwatchers = [];

			const endTurn = () => {
				unwatchers.forEach(u => u());
				this.selectedUnits = []; // 回合结束，清空选择
				resolve();
			};

			// 处理来自UI的输入（点击棋盘格子）
			const onInput = position => {
				const unitsAtPos = this.gaming.battlefield.getUnitsAt(position);

				if (this.selectedUnits.length > 0) {
					// 已有棋子被选中，本次点击视为选择目标位置
					const selectedUnit = this.selectedUnits[0];
					const moveSkills = selectedUnit.skills.filter(s => s instanceof Move);

					if (moveSkills.length > 0) {
						// 检查点击位置是否是有效移动目标
						let availableTargets = moveSkills.flatMap(s => s.getAvailableTargetPositions());
						// 发布事件，让其他技能（如塞象眼、绊马脚）可以修改目标位置
						const payload = {unit: selectedUnit, availableTargetPositions: availableTargets};
						this.gaming.bulletin.notice('已获取可移动位置集', payload);
						const validTargets = this.gaming.battlefield.keepValidPositions(payload.availableTargetPositions);

						if (validTargets.find(p => p.isEqualTo(position))) {
							// 是有效移动，执行移动。移动后，onMove处理器会结束回合。
							selectedUnit.position = position;
						} else {
							// 无效移动。如果点的是自己的另一个棋子，则切换选择。否则取消选择。
							if (unitsAtPos.length > 0 && unitsAtPos[0].owner === this) {
								this.selectedUnits = unitsAtPos;
								this.gaming.bulletin.notice('player:units_selected', {units: this.selectedUnits});
							} else {
								this.selectedUnits = [];
							}
						}
					}
				} else {
					// 没有棋子被选中，本次点击视为选择棋子
					if (unitsAtPos.length > 0 && unitsAtPos[0].owner === this) {
						this.selectedUnits = unitsAtPos;
						this.gaming.bulletin.notice('player:units_selected', {units: this.selectedUnits});
					}
				}
			};

			// 棋子移动后，当前玩家回合结束
			const onMove = ({unit}) => {
				if (unit.owner === this) {
					endTurn();
				}
			};

			this.gaming.bulletin.watch('ui:input', onInput);
			this.gaming.bulletin.watch('单位已移动', onMove);
			unwatchers.push(() => this.gaming.bulletin.unwatch('ui:input', onInput));
			unwatchers.push(() => this.gaming.bulletin.unwatch('单位已移动', onMove));
		});
	}
}

/**
 * 规则：有一定业务含义，若干个相关的逻辑片段的封装。这些逻辑片段是监听器（watchers）
 */
class Rule {
	name;
	intro = '';
	tip = '';
	watchers = {};

	constructor(cfg) {
		Object.assign(this, cfg);
	}
}

/**
 * 技能
 */
class Skill extends GamingPart {
	name;
	intro = '';
	watchers = {};
	owner;

	constructor(cfg) {
		super(cfg?.gaming);
		Object.assign(this, cfg);
	}

	/**
	 * 定义子类
	 * @param defaultCfg
	 * @returns
	 */
	static define(defaultCfg) {
		return class extends this {
			constructor(overrideCfg = {}) {
				super({...defaultCfg, ...overrideCfg});//对于同名属性，后者覆盖前者
			}
		};
	}
}

class Unit extends GamingPart {
	name;
	intro = '';
	显示 = name;
	owner; // player
	skills = [];
	_position = null;

	constructor(cfg) {
		super(cfg.owner?.gaming);
		Object.assign(this, cfg);
	}

	get position() {
		return this._position;
	}

	set position(p) {
		if (this._position && this._position.isEqualTo(p)) {
			return;
		}
		// setter作为移动指令的入口，通知战场来移动棋子
		this.gaming.battlefield.moveUnit(this, p);
	}

	static define(defaultCfg) {
		return class extends this {
			constructor(overrideCfg = {}) {
				super({...defaultCfg, ...overrideCfg});
			}
		};
	}
}

class Game {
	cfg;

	constructor(cfg = {}) {
		this.cfg = cfg;
	}

	newGaming() {
		const GamingClass = this.cfg.GamingClass ?? Gaming;
		return new GamingClass(this.cfg);
	}
}

/**
 * 一场游戏。
 */
class Gaming {
	cfg;
	bulletin = new Bulletin();
	teams = {};
	globalRules = [];
	battlefield;
	situation;
	playerTurnSequence = [];

	constructor(cfg) {
		this.cfg = cfg;
		this._build();
		this._start(); // 游戏创建后自动开始
	}

	get teamList() {
		return Object.values(this.teams);
	}

	_build() {
		this.bulletin.notice('initing', {gaming: this});
		this.teams = this._buildTeams();
		this.globalRules = this._buildGlobalRules();
		this.globalRules.forEach(rule =>
			Object.entries(rule.watchers)
				.forEach(([topicName, watcher]) => this.bulletin.watch(topicName, watcher.bind(rule))));
		this.battlefield = this._buildBattlefield();
		this.situation = this._buildSituation();
		this.playerTurnSequence = this._buildPlayerTurnSequence();
		this.bulletin.notice('inited', {gaming: this});
	}

	_buildTeams() {
		const teamsCfg = this.cfg.teams || {};
		this.bulletin.notice('building teams', {teamsCfg});
		const rt = Object.fromEntries(
			Object.entries(teamsCfg)
				.map(([id, teamCfg]) => [id, this._buildTeam(id, teamCfg)]),
		);
		this.bulletin.notice('built teams', {teams: rt});
		return rt;
	}

	_buildTeam(id, teamCfg) {
		const TeamClass = teamCfg.class ?? this.cfg.TeamClass ?? Team;
		this.bulletin.notice('building team', {gaming: this, id, teamCfg, class: TeamClass});
		const team = new TeamClass(this, {id, ...teamCfg});
		team.players = this._buildPlayers(teamCfg.players || {}, team);
		return team;
	}

	_buildPlayers(playerCfgs, team) {
		this.bulletin.notice('building players', {team, playerCfgs});
		const rt = Object.fromEntries(
			Object.entries(playerCfgs)
				.map(([id, cfg]) => [id, this._buildPlayer(id, cfg, team)]),
		);
		this.bulletin.notice('built players', {team, players: rt});
		return rt;
	}

	_buildPlayer(id, playerCfg, team) {
		const PlayerClass = playerCfg.class ?? this.cfg.PlayerClass ?? Player;
		this.bulletin.notice('building player', {team, playerCfg, class: PlayerClass});
		const rt = new PlayerClass(team, {id, ...playerCfg});
		this.bulletin.notice('built player', {player: rt});
		return rt;
	}

	_buildGlobalRules() {
		const rulesCfg = this.cfg.globalRules || [];
		this.bulletin.notice('building global rules', {gaming: this, rulesCfg});
		const rt = rulesCfg.map(ruleCfg => this._buildGlobalRule(ruleCfg));
		this.bulletin.notice('built global rules', {globalRules: rt});
		return rt;
	}

	_buildGlobalRule(ruleCfg) {
		const RuleClass = ruleCfg.class ?? this.cfg.RuleClass ?? Rule;
		this.bulletin.notice('building global rule', {gaming: this, ruleCfg, class: RuleClass});
		const rt = new RuleClass(ruleCfg);
		this.bulletin.notice('built global rule', {globalRule: rt});
		return rt;
	}

	_buildBattlefield() {
		const battlefieldCfg = this.cfg.battlefieldCfg || {};
		const BattlefieldClass = this.cfg.BattlefieldClass ?? Battlefield;
		this.bulletin.notice('building battlefield', {gaming: this, battlefieldCfg, class: BattlefieldClass});
		const rt = new BattlefieldClass(this);
		if (battlefieldCfg.units) {
			this._buildUnits(battlefieldCfg.units);
		}
		this.bulletin.notice('built battlefield', {battlefield: rt});
		return rt;
	}

	_buildUnits(unitsCfg) {
		this.bulletin.notice('building units', {unitsCfg});
		const rt = unitsCfg.map(unitCfg => this._buildUnit(unitCfg));
		this.bulletin.notice('built units', {rt});
		return rt;
	}

	_buildUnit(unitCfg) {
		const UnitClass = unitCfg.class ?? this.cfg.UnitClass ?? Unit;
		this.bulletin.notice('building unit', {unitCfg, class: UnitClass});
		const unit = new UnitClass({...unitCfg});
		unit.skills = this._buildSkills(unitCfg.skills || [], unit);
		this.bulletin.notice('built unit', {unit: unit});
		return unit;
	}

	_buildSkills(skillsCfg, owner) {
		this.bulletin.notice('building skills', {owner, skillsCfg});
		const rt = skillsCfg.map(skillCfg => {
			const skill = this._buildSkill(owner, skillCfg);
			if (skill.watchers) {
				Object.entries(skill.watchers)
					.forEach(([topic, watcher]) => this.bulletin.watch(topic, watcher.bind(skill)));
			}
			return skill;
		});
		this.bulletin.notice('built skills', {rt});
		return rt;
	}

	_buildSkill(owner, skillCfg) {
		const SkillClass = skillCfg.class ?? this.cfg.SkillClass ?? Skill;
		this.bulletin.notice('building skill', {owner, skillCfg, class: SkillClass});
		const rt = new SkillClass({owner, gaming: this});
		this.bulletin.notice('built skill', {skill: rt});
		return rt;
	}

	_buildSituation() {
		const SituationClass = this.cfg.SituationClass ?? Situation;
		this.bulletin.notice('building situation', {gaming: this});
		const rt = new SituationClass(this);
		this.bulletin.notice('built situation', {situation: rt});
		return rt;
	}

	_buildPlayerTurnSequence() {
		const playerIdMap = Object.fromEntries(
			this.teamList.flatMap(e => e.players)
				.map(player => [player.id, player]),
		);
		this.playerTurnSequence = this.cfg.playerTurnSequence.map(playerId => playerIdMap[playerId]);
	}

	_start() {
		// 使用IIFE（立即调用函数表达式）来启动异步游戏循环，避免构造函数变成异步
		(async () => {
			this.situation.isStarted = true;
			this.bulletin.notice('game:start', {gaming: this});

			while (!this.situation.isEnded) {
				const round = new Round(this, this.situation.rounds.length + 1);
				this.situation.rounds.push(round);
				await round.start();
			}

			this.situation.isEnded = true;
			this.bulletin.notice('game:end', {winner: this.situation.winner});
		})().catch(console.error);
	}
}

class Round extends GamingPart {
	constructor(gaming, index) {
		super(gaming);
		this.index = index;
	}

	/**
	 * 开始一个回合，即一个玩家的行动轮次
	 */
	async start() {
		const currentPlayer = players[activePlayerIndex];
		this.gaming.bulletin.notice('turn:start', {player: currentPlayer});
		this.gaming.playerTurnSequence.forEach(async player => {
			await player.play();
		});
		this.gaming.bulletin.notice('turn:end', {player: currentPlayer});
	}
}

//========================棋盘类游戏的类

class Board extends Battlefield {
	colSize;
	rowSize;

	constructor(gaming) {
		super(gaming);
		const rows = gaming.cfg.棋盘.trim().split(/\s+/);
		this.rowSize = rows.length;
		this.colSize = rows[0]?.length || 0;
		for (let r = 0; r < this.rowSize; r++) {
			for (let c = 0; c < this.colSize; c++) {
				this.positions.set(new 棋盘点位(r + 1, c + 1), []);
			}
		}
	}

	keepValidPositions(positions) {
		return positions.filter(p => p.rowNum > 0 && p.rowNum <= this.rowSize
																 && p.colNum > 0 && p.colNum <= this.colSize);
	}

	//todo：已知棋盘是二维的，可以简化父类的一些工具方法的算法
}

/**
 * 通用移动修改者：边界检查
 */
class BoundaryModifier extends Rule {
	get watchers() {
		return {'filter:move_targets': this.onFilter};
	}

	onFilter({targets}) {
		const width = this.gaming.config.battlefield.width;
		const height = this.gaming.config.battlefield.height;
		const finalTargets = targets.filter(t => t.rowNum >= 0 && t.rowNum < width && t.colNum >= 0 && t.colNum < height);
		targets.length = 0;
		targets.push(...finalTargets);
	}
}

class 棋盘点位 extends Position {
	constructor(rowNum, colNum) {
		super();
		this.rowNum = rowNum;
		this.colNum = colNum;
	}

	toString() {
		return `${this.rowNum},${this.colNum}`;
	}
}

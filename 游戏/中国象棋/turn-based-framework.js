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
		this.gaming.notice('单位已移动', {unit, to: position});
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
		unit.position = position;
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
		unit.position = null;
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

	/**
	 * 确保指定单位在指定位置。若已在则忽略。
	 * @param newPosition
	 * @param unit
	 */
	ensurePosition(unit, newPosition) {
		const oldPosition = unit.position;
		if (!oldPosition.isEqualTo(newPosition)) {
			this.removeUnitFromPosition(unit);
			this.addUnitToPosition(unit, newPosition);
		}
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
	team;
	name;
	units = [];
	selectedUnits = [];

	constructor(team, cfg) {
		super(team.gaming);
		Object.assign(this, cfg);
		//todo: this.inputChannel this.outputChannel
	}

	async play() {
		//todo:等待玩家输入（从inputChannel读取指令）

		//todo：下面的逻辑是象棋专用的
		this._playXiangqi();
	}

	_playXiangqi() {
		const watcher = (topicName, payload) => {
			//期望payload是一个坐标
			const units = this.gaming.battlefield.getUnitsAt(payload);
			if (units) {
				this.selectedUnits = [...units];
				this.gaming.bulletin.notice('selected units', this.selectedUnits);
				// this.selectedSkill = units[0].skills.find(e=>e instanceof MoveAction);
			} else {
				this.selectedUnits = [];
				// this.selectedSkill = null;
			}
			//todo:本玩家回合结束时，清掉这个watcher。
		};
		this.gaming.bulletin.watch('ui:input', watcher);
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
	display = name;
	player;
	skills = [];
	_position;

	constructor(cfg) {
		super(cfg.owner?.gaming);
		Object.assign(this, cfg);
		//cfg.skills将是Skill或其子类的类型对象（constructor）
		if (cfg.skills) {
			this.skills = cfg.skills.map(skill => new skill({owner: this}));
		}
	}

	get position() {
		return this._position;
	}

	set position(p) {
		if (!this._position.isEqualTo(p)) {
			this.gaming.battlefield.ensurePosition(this, p);
			this._position = p;
		}
	}

	static define(defaultCfg) {
		return class extends this {
			constructor(overrideCfg = {}) {
				super({...defaultCfg, ...overrideCfg});
			}
		};
	}
}

// class Skill extends Rule {
// 	constructor(owner, config) {
// 		super(owner.gaming, config);
// 		this.owner = owner;
// 	}
//
// 	/**
// 	 * 检查技能当前是否可用。UI可以调用此方法来决定是否将技能显示为可点击。
// 	 * @returns {boolean}
// 	 */
// 	get isEnabled() {
// 		return true; // 默认可用，子类可重写此逻辑（如检查冷却、魔法值等）
// 	}
//
// 	/**
// 	 * 当玩家在UI上点击并选中此技能时，由框架调用。
// 	 * @returns {Position[] | null}
// 	 * - 如果技能需要选择目标（如移动、攻击），则计算并返回可用目标数组。
// 	 * - 如果技能不需要选择目标（如原地buff），则直接执行并返回null。
// 	 */
// 	onSelected() {
// 		// 默认行为：如果技能需要目标，它应该重写此方法。
// 		// 如果是不需要目标的技能，它可以重写此方法以直接执行动作。
// 		console.warn(`技能 ${this.name} 没有实现 onSelected 方法。`);
// 		return null;
// 	}
//
// 	/**
// 	 * 当玩家选择了目标后，由框架调用以执行技能。
// 	 * @param {Position} target 玩家选择的目标
// 	 */
// 	execute(target) {
// 		// 默认行为：需要目标的技能应该重写此方法。
// 		console.warn(`技能 ${this.name} 没有实现 execute 方法。`);
// 	}
// }

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
	teams = [];
	globalRules = [];
	battlefield;
	situation;

	constructor(cfg) {
		this.cfg = cfg;
		this._build();
		this._start();
	}

	_build() {
		this.bulletin.notice('initing', {gaming: this});
		this.teams = this._buildTeams();
		this.globalRules = this._buildGlobalRules();
		this.globalRules.forEach(rule =>
			Object.entries(rule.watchers).forEach(([topicName, watcher]) => this.bulletin.watch(topicName, watcher)));
		this.battlefield = this._buildBattlefield();
		this.situation = this._buildSituation();
		this.bulletin.notice('inited', {gaming: this});
	}

	_buildTeams() {
		const teamsCfg = this.cfg.teams;
		this.bulletin.notice('building teams', {teamsCfg});
		const rt = teamsCfg.map(teamCfg => this._buildTeam(teamCfg));
		this.bulletin.notice('built teams', {teams: rt});
		return rt;
	}

	_buildTeam(teamCfg) {
		const TeamClass = teamCfg.class ?? this.cfg.TeamClass ?? Team;
		this.bulletin.notice('building team', {gaming: this, teamCfg, class: TeamClass});
		const team = new TeamClass(this, teamCfg);
		this._buildPlayers(teamCfg.players, team).forEach(e => team.players.push(e));
		return team;
	}

	_buildPlayers(playerCfgs, team) {
		this.bulletin.notice('building players', {team, playerCfgs});
		const rt = playerCfgs.map(playerCfg => this._buildPlayer(playerCfg, team));
		this.bulletin.notice('built players', {team, playerCfgs});
		return rt;
	}

	_buildPlayer(playerCfg, team) {
		const PlayerClass = playerCfg.class ?? this.cfg.PlayerClass ?? Player;
		this.bulletin.notice('building player', {team, playerCfg, class: PlayerClass});
		const rt = new PlayerClass(team, playerCfg);
		const unitsCfg = playerCfg.units || [];
		this._buildUnits(unitsCfg, rt).forEach(e => rt.units.push(e));
		this.bulletin.notice('built player', {player: rt});
		return rt;
	}

	_buildUnits(unitsCfg, owner) {
		this.bulletin.notice('building units', {unitsCfg, owner});
		const rt = unitsCfg.map(unitCfg => {
			return this._buildUnit(rt, unitCfg);
			// if (unitCfg.position) {
			// 	// 注意：这里的position应该是 {x, y} 对象，我们需要将它转换为Position实例
			// 	const pos = new 棋盘点位(unitCfg.position.rowNum, unitCfg.position.colNum);
			// 	this.battlefield.addUnitToPosition(unit, pos);
			// }
		});
		this.bulletin.notice('built units', {rt});
		return rt;
	}

	_buildUnit(owner, unitCfg) {
		const UnitClass = unitCfg.class ?? this.cfg.UnitClass ?? Unit;
		this.bulletin.notice('building unit', {owner, unitCfg, class: UnitClass});
		const rt = new UnitClass({...unitCfg, owner});
		const skillsCfg = unitCfg.skills;
		if (skillsCfg) {
			this._buildSkills(skillsCfg, rt).forEach(e => rt.skills.add(e));
		}
		this.bulletin.notice('built unit', {unit: rt});
		return rt;
	}

	_buildSkills(skillsCfg, owner) {
		this.bulletin.notice('building skills', {owner, skillsCfg});
		const rt = skillsCfg.map(skillCfg => this._buildSkill(owner, skillCfg));
		this.bulletin.notice('built skills', {rt});
		return rt;
	}

	_buildSkill(owner, skillCfg) {
		const SkillClass = skillCfg.class ?? this.cfg.SkillClass ?? Skill;
		this.bulletin.notice('building skill', {owner, skillCfg, class: SkillClass});
		const rt = new SkillClass(skillCfg);
		this.bulletin.notice('built skill', {skill: rt});
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
		const BattlefieldClass = this.cfg.BattlefieldClass ?? Battlefield;
		this.bulletin.notice('building battlefield', {gaming: this, class: BattlefieldClass});
		const rt = new BattlefieldClass(this);
		this.bulletin.notice('built battlefield', {battlefield: rt});
		return rt;
	}

	_buildSituation() {
		const SituationClass = this.cfg.SituationClass ?? Situation;
		this.bulletin.notice('building situation', {gaming: this});
		const rt = new SituationClass(this);
		this.bulletin.notice('built situation', {situation: rt});
		return rt;
	}

	_start() {
		while (!this.situation.isEnded) {
			const index = this.situation.rounds.length + 1;
			const round = new Round(this, index);
			this.situation.rounds.push(round);
			round.start();
		}
	}

	// 交互流程: selectUnit -> selectSkill -> selectTarget
	selectUnit(unit) {
		if (unit.owner !== this.getCurrentPlayer()) {
			return;
		}
		this.selectedUnit = unit;
		this.selectedSkill = null;
		this.notice('ui:unit_selected', {unit});
	}

	selectSkill(skill) {
		if (!this.selectedUnit || !this.selectedUnit.skills.includes(skill) || !skill.isEnabled) {
			return;
		}
		this.selectedSkill = skill;
		this.notice('ui:skill_selected', {skill});

		// 调用技能的onSelected，由技能决定下一步
		const targets = skill.onSelected();

		// 如果 onSelected 返回 null，说明技能已直接执行，回合可能结束
		if (targets === null) {
			this.endTurn();
		} else {
			// 否则，通知UI层显示可用目标
			this.notice('ui:show_targets', {targets});
		}
	}

	selectTarget(target) {
		if (!this.selectedSkill) {
			return;
		}

		// 执行技能
		this.selectedSkill.execute(target);

		// 清理状态并结束回合
		this.selectedUnit = null;
		this.selectedSkill = null;
		this.notice('ui:selection_cleared');
		this.endTurn();
	}

	getCurrentPlayer() {
		return this.players[this.activePlayerIndex];
	}

	endTurn() {
		this.notice('turn:end', {player: this.getCurrentPlayer()});
		if (this.situation.isEnded) {
			return;
		}
		this.activePlayerIndex = (this.activePlayerIndex + 1) % this.players.length;
		this.notice('turn:start', {player: this.getCurrentPlayer()});
	}

	endGame(winner) {
		if (this.situation.isEnded) {
			return;
		}
		this.situation.isEnded = true;
		this.situation.winner = winner;
		this.notice('game:end', {winner});
	}
}

class Round extends GamingPart {
	constructor(gaming, index) {
		super(gaming);
	}

	start() {
		this.gaming.players.each(player => player.play());
	}
}

//========================棋盘类游戏的类

class Board extends Battlefield {
	colSize;
	rowSize;

	constructor(gaming) {
		super(gaming);
		this.colSize = gaming.cfg.board.colSize;
		this.rowSize = gaming.cfg.board.rowSize;
		for (let r = 0; r < this.rowSize; r++) {
			for (let c = 0; c < this.colSize; c++) {
				this.positions.set(new 棋盘点位(r + 1, c + 1), []);
			}
		}
	}

	keepValidPositions(positions) {
		return positions.keepIf(p => p.rowNum > 0 && p.rowNum <= this.rowSize
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
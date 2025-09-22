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
	positions = [];
	positionUnitsMapping = new Map(); // Map<Position的key, Unit[]>

	constructor(gaming, cfg = {}) {
		super(gaming);
		Object.assign(this, cfg);
		this._initPositionUnitsMapping();
	}

	_initPositionUnitsMapping() {
		this.positions.flat().forEach(p => this.positionUnitsMapping.set(p.toString(), []));
	}

	moveUnit(unit, position) {
		this.removeUnitFromPosition(unit);
		this.addUnitToPosition(unit, position);
	}

	destroyUnit(unit) {
		this.removeUnitFromPosition(unit);
		if (unit.owner && unit.owner.units) {
			unit.owner.units = unit.owner.units.filter(u => u !== unit);
		}
	}

	addUnitToPosition(unit, position) {
		const key = this._positionKey(position);
		if (!this.positionUnitsMapping.has(key)) {
			this.positionUnitsMapping.set(key, []);
		}
		this.positionUnitsMapping.get(key).push(unit);
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
		const unitsAtPos = this.positionUnitsMapping.get(key);
		if (unitsAtPos) {
			const index = unitsAtPos.indexOf(unit);
			if (index > -1) {
				unitsAtPos.splice(index, 1);
				if (unitsAtPos.length === 0) {
					this.positionUnitsMapping.delete(key);
				}
			}
		}
		unit._position = null; // 直接修改内部属性，避免触发setter递归
	}

	getUnitsAt(position) {
		return this.positionUnitsMapping.get(this._positionKey(position)) || [];
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
	curPlayer;
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
	flag;//本队旗帜
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
	selectedSkills = [];
	selectedTargets = [];

	constructor(team, cfg) {
		super(team.gaming);
		Object.assign(this, cfg);
		this.team = team;
	}

	/**
	 * 玩家玩游戏。在回合制游戏里，玩家在自己的轮次里操作单位施放技能。
	 * 默认实现：不限定施放技能的次数，规则或技能可发布‘player-turn end’通知告知本玩家本轮次结束。
	 */
	async play() {
		let playerPlayed = false;
		const onPlayerPlayed = ({player}) => {
			if (player.id === this.id) {
				playerPlayed = true;
			}
		};
		this.gaming.bulletin.watch('player played', onPlayerPlayed);

		while (!playerPlayed) {
			//这里算是一次‘行动’
			const input = await this.gaming.waitForInput();
			if (playerPlayed) {
				break;
			}
			//设置技能三要素
			this.processInput(input);
			//三要素齐备，开始施放技能。
			if (this.selectedUnits?.length && this.selectedSkills?.length && this.selectedTargets?.length) {
				this.activateSkills(this.selectedUnits, this.selectedSkills, this.selectedTargets);
			}
			//每次行动后只清空目标。
			this.selectedTargets = [];
		}

		this.selectedUnits = [];
		this.selectedSkills = [];
		this.selectedTargets = [];

		this.gaming.bulletin.unwatch('player played', onPlayerPlayed);
	}

	/**
	 * 根据输入，设置施放技能三要素，并严格遵循 Unit -> Skill -> Target 的顺序。
	 * 该方法接受单个对象或数组作为输入，并将具体选择逻辑分派到 selectUnits, selectSkills, selectTargets 方法。
	 * @param {any|any[]} input
	 */
	processInput(input) {
		const inputs = Array.isArray(input) ? input : [input];
		if (inputs.length === 0) {
			return;
		}
		const firstItem = inputs[0];

		if (firstItem instanceof Unit) {
			this.selectingUnits(inputs);
		} else if (firstItem instanceof Skill) {
			this.selectSkills(inputs);
		} else {
			this.selectTargets(inputs);
		}
	}

	selectingUnits(inputs) {
		if (this.selectedUnits?.length && this.selectedSkills?.length) {
			const ownUnits = inputs.filter(u => u.owner?.id === this.id);
			if (!ownUnits.length || this.selectedSkills.some(e => e.isValidTargets(inputs))) {
				this.selectTargets(inputs);
			} else {
				this.selectUnits(ownUnits);
			}
		} else {
			this.selectUnits(inputs);
		}
	}

	selectUnits(units) {
		const ownUnits = units.filter(u => u.owner?.id === this.id);
		if (ownUnits.length > 0) {
			this.selectedUnits = ownUnits;
			this.selectedSkills = [];
			this.selectedTargets = [];
			this.gaming.bulletin.notice('player selected units', {player: this, units: ownUnits});
		}
	}

	/**
	 * 选择技能。默认实现是设置选中的技能。
	 * 只有拥有 `activate` 方法的技能（主动技能）才能被选中。
	 * @param {Skill[]} skills 要选择的技能
	 */
	selectSkills(skills) {
		if (this.selectedUnits?.length) {
			// 过滤出所有主动技能
			const activeSkills = skills.filter(s => typeof s?.activate === 'function');
			if (activeSkills.length > 0) {
				this.selectedSkills = activeSkills;
				this.gaming.bulletin.notice('player selected skills', {player: this, skills});
			}
		}
	}

	/**
	 * 选择目标。默认实现是设置选中的目标。
	 * @param {any[]} targets 要选择的目标
	 */
	selectTargets(targets) {
		// 必须在选定单位和技能后
		if (this.selectedUnits?.length && this.selectedSkills?.length) {
			this.selectedTargets = targets;
			this.gaming.bulletin.notice('player selected targets', {player: this, targets});
		}
	}

	/**
	 * 默认实现：每个技能都触发。技能自行处理目标（比如筛除非法目标等）
	 * 子类可覆写为只触发单个技能。
	 * @param selectedUnits
	 * @param selectedSkills
	 * @param selectedTargets
	 */
	activateSkills(selectedUnits, selectedSkills, selectedTargets) {
		// 遍历所有选中的单位
		selectedUnits.forEach(unit => {
			// 遍历所有选中的技能
			selectedSkills.forEach(skill => {
				// 确认当前单位拥有该技能
				if (unit.skills.includes(skill)) {
					// 触发技能，并将目标传入
					skill.activate(selectedTargets);
					this.gaming.bulletin.notice('unit used skill', {unit, skill, selectedTargets});
				}
			});
		});
	}
}

/**
 * 规则：有一定业务含义，若干个相关的逻辑片段的封装。这些逻辑片段是监听器（watchers）
 */
class Rule extends GamingPart {
	name;
	intro = '';
	tip = '';
	watchers = {};

	constructor(gaming, cfg) {
		super(gaming);
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

	getAvailableTargets() {
		return [];
	}

	isValidTargets(targets) {
		return false;
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
	static nextUnitId = 1;
	id;
	name;
	intro = '';
	显示 = name;
	owner; // player
	skills = [];
	_position = null;

	constructor(cfg) {
		super(cfg.owner?.gaming);
		this.id = Unit.nextUnitId++;
		Object.assign(this, cfg);
	}

	get position() {
		return this._position;
	}

	set position(p) {
		if (this._position && this._position.isEqualTo(p)) {
			return;
		}
		const oldPosition = this.position;
		// setter作为移动指令的入口，通知战场来移动棋子
		this.gaming.battlefield.moveUnit(this, p);
		this.gaming.bulletin.notice('单位移动', {unit: this, oldPosition});
	}

	addSkill(skill) {
		if (!skill || this.skills.includes(skill)) {
			return;
		}

		skill._boundWatchers = {};

		if (skill.watchers) {
			Object.entries(skill.watchers).forEach(([topic, watcher]) => {
				const boundWatcher = watcher.bind(skill);
				skill._boundWatchers[topic] = skill._boundWatchers[topic] || [];
				skill._boundWatchers[topic].push(boundWatcher);
				this.gaming.bulletin.watch(topic, boundWatcher);
			});
		}
		this.skills.push(skill);
	}

	removeSkill(skillOrClass) {
		const skillIndex = typeof skillOrClass === 'function'
											 ? this.skills.findIndex(s => s instanceof skillOrClass)
											 : this.skills.findIndex(s => s === skillOrClass);

		if (skillIndex === -1) {
			return;
		}

		const skill = this.skills[skillIndex];

		if (skill._boundWatchers) {
			Object.entries(skill._boundWatchers).forEach(([topic, boundWatchers]) => {
				boundWatchers.forEach(boundWatcher => {
					this.gaming.bulletin.unwatch(topic, boundWatcher);
				});
			});
		}

		this.skills.splice(skillIndex, 1);
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
	plugins = [];

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
		this.plugins = this._buildPlugins();
		this.plugins.forEach(plugin =>
			Object.entries(plugin.watchers)
			.forEach(([topicName, watcher]) => this.bulletin.watch(topicName, watcher.bind(plugin))));
		this.bulletin.notice('inited', {gaming: this});
	}

	_buildTeams() {
		const teamsCfg = this.cfg.teams || {};
		this.bulletin.notice('building teams', {teamsCfg});
		const rt = Object.fromEntries(
			Object.entries(teamsCfg)
			.map(([id, teamCfg]) => [id, this._buildTeam(id, teamCfg)])
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
			.map(([id, cfg]) => [id, this._buildPlayer(id, cfg, team)])
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
		const rt = new RuleClass(this, ruleCfg);
		this.bulletin.notice('built global rule', {globalRule: rt});
		return rt;
	}

	_buildBattlefield() {
		const battlefieldCfg = this.cfg.battlefieldCfg || {};
		const BattlefieldClass = this.cfg.BattlefieldClass ?? Battlefield;
		this.bulletin.notice('building battlefield', {gaming: this, battlefieldCfg, class: BattlefieldClass});
		const rt = new BattlefieldClass(this, battlefieldCfg);
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

	_buildUnit(owner, unitCfg) {
		const UnitClass = unitCfg.class ?? this.cfg.UnitClass ?? Unit;
		this.bulletin.notice('building unit', {unitCfg, class: UnitClass});
		const unit = new UnitClass({owner, ...unitCfg});
		unit.skills = []; // 清空来自配置的技能名数组，确保只包含技能实例
		const skills = this._buildSkills(unitCfg.skills || [], unit);
		skills.forEach(skill => unit.addSkill(skill));
		this.bulletin.notice('built unit', {unit: unit});
		return unit;
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

	_getPlayersIdMap() {
		const allPlayers = this.teamList.flatMap(team => Object.values(team.players));
		return Object.fromEntries(allPlayers.map(p => [p.id, p]));
	}

	_buildPlayerTurnSequence() {
		const playersById = this._getPlayersIdMap();
		return this.cfg.playerTurnSequence.map(playerId => playersById[playerId]);
	}

	_buildPlugins() {
		const pluginsCfg = this.cfg.plugins || [];
		this.bulletin.notice('building plugins', {gaming: this, pluginsCfg});
		const rt = pluginsCfg.map(pluginCfg => this._buildPlugin(pluginCfg));
		this.bulletin.notice('built plugins', {plugins: rt});
		return rt;
	}

	_buildPlugin(pluginCfg) {
		const PluginClass = pluginCfg.class ?? this.cfg.PluginClass ?? Plugin;
		this.bulletin.notice('building plugin', {gaming: this, pluginCfg, class: PluginClass});
		const rt = new PluginClass(this, pluginCfg);
		this.bulletin.notice('built plugin', {globalRule: rt});
		return rt;
	}

	waitForInput() {
		return new Promise(resolve => {
			const onInput = payload => {
				this.bulletin.unwatch('ui input', onInput);
				resolve(payload);
			};
			this.bulletin.watch('ui input', onInput);
		});
	}

	_start() {
		this.bulletin.watch('game over', ({winner}) => {
			this.situation.isEnded = true;
			this.situation.winner = winner;
		});
		// 使用IIFE（立即调用函数表达式）来启动异步游戏循环，避免构造函数变成异步
		(async () => {
			this.situation.isStarted = true;
			this.bulletin.notice('game start', {gaming: this});

			while (!this.situation.isEnded) {
				const round = new Round(this, this.situation.rounds.length + 1);
				this.situation.rounds.push(round);
				await round.start();
			}

			this.situation.isEnded = true;
			this.bulletin.notice('game end', {winner: this.situation.winner});
		})().catch(console.error);
	}
}

class Round extends GamingPart {
	constructor(gaming, index) {
		super(gaming);
		this.index = index;
	}

	/**
	 * 开始一个回合，玩家依次执行自己的行动轮次
	 */
	async start() {
		this.gaming.bulletin.notice('round start', {round: this});

		for (const player of this.gaming.playerTurnSequence) {
			this.gaming.situation.curPlayer = player;
			this.gaming.bulletin.notice('player-turn start', {player});
			await player.play(); // 等待当前玩家的回合结束
			this.gaming.situation.curPlayer = null;
			this.gaming.bulletin.notice('player-turn end', {player});
		}

		this.gaming.bulletin.notice('round end', {round: this});
	}
}

class Plugin extends GamingPart {
	name;
	intro = '';
	tip = '';
	watchers = {};

	constructor(gaming, cfg) {
		super(gaming);
		Object.assign(this, cfg);
	}
}

//========================棋盘类游戏的类

class Board extends Battlefield {
	colSize;
	rowSize;
	grid; // 使用二维数组优化棋子存储

	constructor(gaming, cfg = {}) {
		// 仍然调用父类构造函数，以运行GamingPart的初始化等逻辑
		// 但我们会忽略父类关于 positionUnitsMapping 的部分，用自己的grid代替
		super(gaming, {positions: Board.buildPositions(cfg.rowSize, cfg.colSize), ...cfg});
		this.rowSize = cfg.rowSize;
		this.colSize = cfg.colSize;

		// 初始化二维数组grid，每个格子是一个空数组，用于存放棋子
		this.grid = Array(this.rowSize).fill(null).map(() => Array(this.colSize).fill(null).map(() => []));
	}

	// 重写父类方法，使用grid进行操作
	addUnitToPosition(unit, position) {
		this.grid[position.rowNum - 1][position.colNum - 1].push(unit);
		unit._position = position; // 保持对unit._position的更新
	}

	// 重写父类方法，使用grid进行操作
	removeUnitFromPosition(unit) {
		if (!unit.position) {
			return;
		}
		const {rowNum, colNum} = unit.position;
		const unitsAtPos = this.grid[rowNum - 1][colNum - 1];
		const index = unitsAtPos.indexOf(unit);
		if (index > -1) {
			unitsAtPos.splice(index, 1);
		}
		unit._position = null; // 保持对unit._position的更新
	}

	// 重写父类方法，使用grid进行操作
	getUnitsAt(position) {
		// 添加边界检查以增加健壮性
		if (position.rowNum < 1 || position.rowNum > this.rowSize || position.colNum < 1 || position.colNum
				> this.colSize) {
			return [];
		}
		return this.grid[position.rowNum - 1][position.colNum - 1];
	}

	static buildPositions(rowSize, colSize) {
		const rt = [];
		for (let i = 0; i < rowSize; i++) {
			const row = [];
			rt.push(row);
			for (let j = 0; j < colSize; j++) {
				row.push(new 棋盘点位(i + 1, j + 1));
			}
		}
		return rt;
	}

	keepValidPositions(positions) {
		return positions.filter(p => p.rowNum > 0 && p.rowNum <= this.rowSize
																 && p.colNum > 0 && p.colNum <= this.colSize);
	}

	// todo：可以继续添加更多基于二维数组的便捷方法，例如计算距离、寻路等
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

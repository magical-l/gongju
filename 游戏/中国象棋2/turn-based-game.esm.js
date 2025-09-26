import {
	addCfgProps, aopAsyncMethod, aopGetter, aopMethod, Bulletin, compareWithId, ensureArray, notice, unwatch, watch,
	watchersWatch,
} from './kit.esm.js';

export {
	Game, Gaming, Rule, Battlefield, Situation,
	Team, Player, Unit, Skill, PassiveSkill, BuffSkill, Plugin,
	Board, 棋盘点位,
};

/**
 * 位置的抽象基类。强制子类实现toString()，用于在Map中作为唯一的key。
 */
class Position {
	get id() {
		return this.toString();
	}

	toString() {
		throw new Error("子类必须实现toString()");
	}

	isEqualTo(otherPosition) {
		return otherPosition && this.toString() === otherPosition.toString();
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
	#cfg;
	#bulletin = new Bulletin();
	#globalRules = [];
	#plugins = [];
	#battlefield;
	#situation;
	#teams = {};
	#playerTurnSequence = [];

	constructor(cfg) {
		this.#cfg = cfg;
		addCfgProps(this, this.#cfg);
		this._build();
		this._start(); // 游戏创建后自动开始
	}

	get cfg() {return this.#cfg;}

	get gaming() { return this; }

	get bulletin() { return this.#bulletin; }

	get battlefield() { return this.#battlefield; }

	get situation() { return this.#situation; }

	get teamList() { return Object.values(this.#teams); }

	get playerTurnSequence() { return [...this.#playerTurnSequence]; }

	get playersIdMap() {
		const allPlayers = this.teamList.flatMap(team => Object.values(team.players));
		return Object.fromEntries(allPlayers.map(p => [p.id, p]));
	}

	_build() {
		notice(this, 'gaming build start', {gaming: this});
		this.#teams = this._buildTeams();
		this.#globalRules = this._buildGlobalRules();
		this.#globalRules.forEach(rule =>
			Object.entries(rule.watchers)
			.forEach(([topicName, watcher]) => this.bulletin.watch(topicName, watcher.bind(rule))));
		this.#battlefield = this._buildBattlefield();
		this.#situation = this._buildSituation();
		this.#playerTurnSequence = this._buildPlayerTurnSequence();
		this.#plugins = this._buildPlugins();
		this.#plugins.forEach(plugin =>
			Object.entries(plugin.watchers)
			.forEach(([topicName, watcher]) => this.bulletin.watch(topicName, watcher.bind(plugin))));
		notice(this, 'gaming build end', {gaming: this});
	}

	_buildTeams() {
		const teamsCfg = this.cfg.teams || {};
		notice(this, 'gaming buildTeams start', {teamsCfg});
		const rt = Object.fromEntries(
			Object.entries(teamsCfg)
			.map(([id, teamCfg]) => [id, this._buildTeam(id, teamCfg)]),
		);
		notice(this, 'gaming buildTeams end', {teams: rt});
		return rt;
	}

	_buildTeam(id, teamCfg) {
		const TeamClass = teamCfg.class ?? this.cfg.TeamClass ?? Team;
		notice(this, 'gaming buildTeam start', {gaming: this, id, teamCfg, class: TeamClass});
		const team = new TeamClass({id, ...teamCfg}, this);
		// team.players = this._buildPlayers(teamCfg.players || {}, team);//todo：这里有一个设置team.players，但它是只读的
		return team;
	}

	// _buildPlayers(playerCfgs, team) {
	// 	notice(this, 'gaming buildPlayers start', {team, playerCfgs});
	// 	const rt = Object.fromEntries(
	// 		Object.entries(playerCfgs)
	// 		.map(([id, cfg]) => [id, this._buildPlayer(id, cfg, team)]),
	// 	);
	// 	notice(this, 'gaming buildPlayers end', {team, players: rt});
	// 	return rt;
	// }
	//
	// _buildPlayer(id, playerCfg, team) {
	// 	const PlayerClass = playerCfg.class ?? this.cfg.PlayerClass ?? Player;
	// 	notice(this, 'gaming buildPlayer start', {team, playerCfg, class: PlayerClass});
	// 	const rt = new PlayerClass(team, {id, ...playerCfg});
	// 	notice(this, 'gaming buildPlayer end', {player: rt});
	// 	return rt;
	// }

	_buildGlobalRules() {
		const rulesCfg = this.cfg.globalRules || [];
		notice(this, 'gaming buildGlobalRules start', {gaming: this, rulesCfg});
		const rt = rulesCfg.map(ruleCfg => this._buildGlobalRule(ruleCfg));
		notice(this, 'gaming buildGlobalRules end', {globalRules: rt});
		return rt;
	}

	_buildGlobalRule(ruleCfg) {
		const RuleClass = ruleCfg.class ?? this.cfg.RuleClass ?? Rule;
		notice(this, 'gaming buildGlobalRule start', {gaming: this, ruleCfg, class: RuleClass});
		const rt = new RuleClass(this, ruleCfg);
		notice(this, 'gaming buildGlobalRule end', {globalRule: rt});
		return rt;
	}

	_buildBattlefield() {
		const battlefieldCfg = this.cfg.battlefieldCfg || {};
		const BattlefieldClass = this.cfg.BattlefieldClass ?? Battlefield;
		notice(this, 'gaming buildBattlefield start', {gaming: this, battlefieldCfg, class: BattlefieldClass});
		const rt = new BattlefieldClass(this, battlefieldCfg);
		if (battlefieldCfg.units) {
			this._buildUnits(battlefieldCfg.units);
		}
		notice(this, 'gaming buildBattlefield end', {battlefield: rt});
		return rt;
	}

	_buildUnits(unitsCfg) {
		notice(this, 'gaming buildUnits start', {unitsCfg});
		const rt = unitsCfg.map(unitCfg => this._buildUnit(this.playersIdMap[unitCfg.owner], unitCfg));
		notice(this, 'gaming buildUnits end', {rt});
		return rt;
	}

	_buildUnit(owner, unitCfg) {
		const UnitClass = unitCfg.class ?? this.cfg.UnitClass ?? Unit;
		notice(this, 'gaming buildUnit start', {unitCfg, class: UnitClass});
		const unit = new UnitClass({owner, ...unitCfg});
		unit.skills = []; // 清空来自配置的技能名数组，确保只包含技能实例
		const skills = this._buildSkills(unitCfg.skills || [], unit);
		skills.forEach(skill => unit.addSkill(skill));
		notice(this, 'gaming buildUnit end', {unit: unit});
		return unit;
	}

	_buildSkills(skillsCfg, owner) {
		notice(this, 'gaming buildSkills start', {owner, skillsCfg});
		const rt = skillsCfg.map(skillCfg => this._buildSkill(owner, skillCfg));
		notice(this, 'gaming buildSkills end', {rt});
		return rt;
	}

	_buildSkill(owner, skillCfg) {
		const SkillClass = skillCfg.class ?? this.cfg.SkillClass ?? Skill;
		notice(this, 'gaming buildSkill start', {owner, skillCfg, class: SkillClass});
		const rt = new SkillClass(skillCfg, owner);
		notice(this, 'gaming buildSkill end', {skill: rt});
		return rt;
	}

	_buildSituation() {
		const SituationClass = this.cfg.SituationClass ?? Situation;
		notice(this, 'gaming buildSituation start', {gaming: this});
		const rt = new SituationClass(this);
		notice(this, 'gaming buildSituation end', {situation: rt});
		return rt;
	}

	_buildPlayerTurnSequence() {
		const playersIdMap = this.playersIdMap;
		return this.cfg.playerTurnSequence.map(playerId => playersIdMap[playerId]);
	}

	_buildPlugins() {
		const pluginsCfg = this.cfg.plugins || [];
		notice(this, 'gaming buildPlugins start', {gaming: this, pluginsCfg});
		const rt = pluginsCfg.map(pluginCfg => this._buildPlugin(pluginCfg));
		notice(this, 'gaming buildPlugins end', {plugins: rt});
		return rt;
	}

	_buildPlugin(pluginCfg) {
		const PluginClass = pluginCfg.class ?? this.cfg.PluginClass ?? Plugin;
		notice(this, 'gaming buildPlugin start', {gaming: this, pluginCfg, class: PluginClass});
		const rt = new PluginClass(this, pluginCfg);
		notice(this, 'gaming buildPlugin end', {globalRule: rt});
		return rt;
	}

	_start() {
		this.bulletin.watch('game over', ({winner}) => {
			this.situation.isEnded = true;
			this.situation.winner = winner;
		});
		// 使用IIFE（立即调用函数表达式）来启动异步游戏循环，避免构造函数变成异步
		(async () => {
			this.situation.isStarted = true;
			notice(this, 'gaming start', {gaming: this});

			while (!this.situation.isEnded) {
				await this.situation.startRound();
			}

			this.situation.isEnded = true;
			notice(this, 'gaming end', {winner: this.situation.winner});
		})().catch(console.error);
	}

	waitForInput() {
		return new Promise(resolve => {
			const onInput = payload => {
				unwatch(this, 'ui input', onInput);
				resolve(payload);
			};
			watch(this, 'ui input', onInput);
		});
	}
}

/**
 * 战场。主要是地图、环境、单位等的实时情况。
 */
class Battlefield {
	#cfg;
	#gaming;

	#positions = [];
	#positionUnitsMapping = new Map(); // Map<Position的key, Unit[]>

	constructor(gaming, cfg = {}) {
		this.#gaming = gaming;
		this.#cfg = cfg;
		this.#positions = cfg.positions || []; // 显式地从配置中初始化 positions
		addCfgProps(this, this.#cfg);
		this._initPositionUnitsMapping();

		aopMethod(this, 'addUnitToPosition', {
			noticePayloadBuilder: args => ({unit: args[0], position: args[1]}),
		});
		aopMethod(this, 'removeUnitFromPosition', {
			noticePayloadBuilder: args => ({unit: args[0], position: args[1]}),
		});
		aopMethod(this, 'getUnitsAt', {
			noticePayloadBuilder: args => ({position: args[0]}),
		});
		aopMethod(this, 'destroyUnit', {
			noticePayloadBuilder: args => ({unit: args[0]}),
		});
		aopMethod(this, 'moveUnit', {
			noticePayloadBuilder: args => ({unit: args[0], from: args[0].position, to: args[1]}),
		});
	}

	get gaming() { return this.#gaming; }

	get positions() { return [...this.#positions]; }

	_initPositionUnitsMapping() {
		this.#positions.flat().forEach(p => this.#positionUnitsMapping.set(p.toString(), []));
	}

	moveUnit(unit, toPosition) {
		this.removeUnitFromPosition(unit);
		this.addUnitToPosition(unit, toPosition);
	}

	destroyUnit(unit) {
		this.removeUnitFromPosition(unit);
		// if (unit.owner && unit.owner.units) {
		// 	unit.owner.units = unit.owner.units.filter(u => u !== unit);
		// }
	}

	addUnitToPosition(unit, position) {
		const key = this._positionKey(position);
		if (!this.#positionUnitsMapping.has(key)) {
			this.#positionUnitsMapping.set(key, []);
		}
		this.#positionUnitsMapping.get(key).push(unit);
		// unit._position = position; // 直接修改内部属性，避免触发setter递归
	}

	_positionKey(position) {
		return position.toString();
	}

	removeUnitFromPosition(unit, position = unit.position) {
		if (!unit.position) {
			return;
		}
		const key = this._positionKey(unit.position);
		const unitsAtPos = this.#positionUnitsMapping.get(key);
		if (unitsAtPos) {
			const index = unitsAtPos.indexOf(unit);
			if (index > -1) {
				unitsAtPos.splice(index, 1);
			}
		}
		// unit._position = null; // 直接修改内部属性，避免触发setter递归
	}

	getUnitsAt(position) {
		return this.#positionUnitsMapping.get(this._positionKey(position)) || [];
	}

	/**
	 * 移除出界的位置。
	 */
	keepValidPositions(positions) {
		return positions.filter(p => this.#positions.some(p2 => compareWithId(p, p2)));
	}

	//todo：需要增加许多关于位置的方法。比如计算两个单位的距离、获取距离某个单位为x的位置集……
}

/**
 * 战况。记录游戏的实时状态、已成历史的客观事实（比如操作、事件等）。
 */
class Situation {
	#gaming;
	#rounds = [];
	curPlayer;
	isStarted = false;
	isEnded = false;
	winner;

	constructor(gaming) {
		this.#gaming = gaming;
	}

	get gaming() { return this.#gaming; }

	get rounds() { return this.#rounds; }

	async startRound() {
		const round = new Round(this.gaming, this.#rounds.length + 1);
		this.#rounds.push(round);
		await round.start();
	}
}

class Round {
	#gaming;
	#index;

	constructor(gaming, index) {
		this.#gaming = gaming;
		this.#index = index;

		aopAsyncMethod(this, 'start');
	}

	get gaming() { return this.#gaming; }

	get index() { return this.#index; }

	/**
	 * 开始一个回合，玩家依次执行自己的行动轮次
	 */
	async start() {
		for (const player of this.gaming.playerTurnSequence) {
			this.gaming.situation.curPlayer = player;
			this.gaming.bulletin.notice('player-turn start', {player});
			await player.play(); // 等待当前玩家的回合结束
			this.gaming.situation.curPlayer = null;
			this.gaming.bulletin.notice('player-turn end', {player});
		}
	}
}

class Team {
	static #nextId = 1;

	#id;
	#cfg;
	#members = [];
	#gaming;

	constructor(cfg, gaming) {
		this.#id = 'id' in cfg ? cfg.id : Team.#nextId++;
		this.#cfg = cfg;
		this.#gaming = gaming;

		addCfgProps(this, this.#cfg);

		this._buildPlayers(cfg.players, this);

		aopMethod(this, 'addMember', {noticePayloadBuilder: args => ({member: args[0]})});
		aopMethod(this, 'removeMember', {noticePayloadBuilder: args => ({member: args[0]})});
		aopGetter(this, 'members', {typeName: 'team'});
	}

	get cfg() { return this.#cfg; }

	_buildPlayers(playerCfgs, team) {
		notice(this, 'gaming buildPlayers start', {team, playerCfgs});
		const rt = Object.fromEntries(
			Object.entries(playerCfgs)
			.map(([id, cfg]) => [id, this._buildPlayer(id, cfg, team)]),
		);
		notice(this, 'gaming buildPlayers end', {team, players: rt});
		return rt;
	}

	_buildPlayer(id, playerCfg, team) {
		const PlayerClass = playerCfg.class ?? this.cfg.PlayerClass ?? Player;
		notice(this, 'gaming buildPlayer start', {team, playerCfg, class: PlayerClass});
		const rt = new PlayerClass(team, {id, ...playerCfg});
		notice(this, 'gaming buildPlayer end', {player: rt});
		return rt;
	}

	get id() { return this.#id; }

	get members() { return [...this.#members]; }

	addMember(member) { this.#members.push(member); }

	removeMember(member) { this.#members = this.#members.filter(m => !compareWithId(m, member)); }

	get gaming() { return this.#gaming; }
}

class Player {
	static #nextId = 1;

	#cfg;
	#id;
	#team;
	#units = [];//拥有的单位的缓存

	#selectedUnits = [];
	#selectedSkills = [];
	#selectedTargets = [];

	constructor(team, cfg) {
		this.#cfg = cfg;
		this.#id = 'id' in cfg ? cfg.id : Player.#nextId++;
		this.#units = 'units' in cfg ? cfg.units : [];
		this.#team = team;
		this.actionsPerTurn = cfg.actionsPerTurn || 1; // 从配置或默认值初始化

		addCfgProps(this, this.#cfg);

		aopMethod(this, 'addUnit', {
			noticePayloadBuilder: args => ({unit: args[0]}),
		});
		aopMethod(this, 'removeUnit', {
			noticePayloadBuilder: args => ({unit: args[0]}),
		});
		aopMethod(this, 'selectUnits', {
			noticePayloadBuilder: args => ({units: args[0]}),
		});
		aopMethod(this, 'selectSkills', {
			noticePayloadBuilder: args => ({skills: args[0]}),
		});
		aopMethod(this, 'selectTargets', {
			noticePayloadBuilder: args => ({targets: args[0]}),
		});

		//单位的权威数据在Battlefield。本类监听Battlefield处理单位的通知，更新自己的单位缓存。
		watch(this, 'Battlefield addUnitToPosition', ({unit, position}) => {
			if (compareWithId(this, unit.owner)) {
				if (!this.#units.some(u => compareWithId(u, unit))) {
					this.addUnit(unit);
				}
			}
		});
		watch(this, 'Battlefield destroyUnit end', ({unit}) => {
			if (compareWithId(this, unit.owner)) {
				this.removeUnit(unit);
			}
		});
	}

	get id() { return this.#id; }

	get team() { return this.#team; }

	get units() { return this.#units; }

	get gaming() { return this.#team.gaming; }

	addUnit(unit) { this.#units.push(unit); }

	removeUnit(unit) { this.#units = this.#units.filter(e => compareWithId(e, unit));}

	/**
	 * 玩家玩游戏。在回合制游戏里，玩家在自己的轮次里操作单位施放技能。
	 * 默认实现：执行N次有效行动后（N由actionsPerTurn决定），本轮次结束。
	 */
	async play() {
		let actionsTaken = 0;
		while (actionsTaken < this.actionsPerTurn) {
			const input = await this.gaming.waitForInput();

			// 允许玩家通过特定输入提前结束回合
			if (input?.action === 'END_TURN') {
				break;
			}

			//设置技能三要素
			this.processInput(input);

			//三要素齐备，开始施放技能。
			if (this.#selectedUnits?.length && this.#selectedSkills?.length && this.#selectedTargets?.length) {
				const actionPerformed = this.activateSkills(this.#selectedUnits, this.#selectedSkills, this.#selectedTargets);
				if (actionPerformed) {
					actionsTaken++; // 成功行动，计数器加一
					this.#selectedTargets = []; // 成功行动后，清空目标，以便进行下一次行动
				}
			}
		}

		this.#selectedUnits = [];
		this.#selectedSkills = [];
		this.#selectedTargets = [];
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
			// 如果已经选择了单位和技能，那么后续的单位输入应被视为“目标”
			if (this.#selectedUnits?.length && this.#selectedSkills?.length) {
				// 检查这些“目标”对于当前选中的技能是否合法
				if (this.#selectedSkills.some(e => e.filterValidTargets(inputs).length > 0)) {
					this.selectTargets(inputs);
				} else {
					// 如果目标不合法，则检查本次输入是否是一次全新的“选择单位”动作
					const ownUnits = inputs.filter(u => u.owner?.id === this.id);
					if (ownUnits.length > 0) {
						this.selectUnits(ownUnits);
					}
					// 如果既不是合法目标，也不是选择新的己方单位，则忽略本次操作
				}
			} else {
				// 如果尚未选择单位/技能，则本次输入为“选择单位”
				this.selectUnits(inputs);
			}
		} else if (firstItem instanceof Skill) {
			this.selectSkills(inputs);
		} else {
			this.selectTargets(inputs);
		}
	}

	selectUnits(units) {
		const ownUnits = units.filter(u => u.owner?.id === this.id);
		if (ownUnits.length > 0) {
			this.#selectedUnits = ownUnits;
			this.#selectedSkills = [];
			this.#selectedTargets = [];
		}
	}

	/**
	 * 选择技能。默认实现是设置选中的技能。
	 * 只有拥有 `activate` 方法的技能（主动技能）才能被选中。
	 * @param {Skill[]} skills 要选择的技能
	 */
	selectSkills(skills) {
		if (this.#selectedUnits?.length) {
			// 过滤出所有主动技能
			const activeSkills = skills.filter(s => typeof s?.activate === 'function');
			if (activeSkills.length > 0) {
				this.#selectedSkills = activeSkills;
			}
		}
	}

	/**
	 * 选择目标。默认实现是设置选中的目标。
	 * @param {any[]} targets 要选择的目标
	 */
	selectTargets(targets) {
		// 必须在选定单位和技能后
		if (this.#selectedUnits?.length && this.#selectedSkills?.length) {
			this.#selectedTargets = targets;
		}
	}

	/**
	 * 默认实现：每个技能都触发。技能自行处理目标（比如筛除非法目标等）
	 * 子类可覆写为只触发单个技能。
	 * @param selectedUnits
	 * @param selectedSkills
	 * @param selectedTargets
	 * @returns {boolean} 是否成功触发了至少一个技能
	 */
	activateSkills(selectedUnits, selectedSkills, selectedTargets) {
		let activated = false;
		// 遍历所有选中的单位
		selectedUnits.forEach(unit => {
			// 遍历所有选中的技能
			selectedSkills.forEach(skill => {
				// 确认当前单位拥有该技能
				if (unit.skills.includes(skill)) {
					// 触发技能，并将目标传入
					skill.activate(selectedTargets);
					activated = true;
				}
			});
		});
		return activated;
	}
}

class Unit {
	static #nextId = 1;

	#cfg;
	#id;
	#skills = [];
	#position = null;//位置作为缓存

	#skillBoundWatchers = new WeakMap();

	/**
	 * cfg:{id?,name,intro?,display?,owner?,skills}
	 * @param cfg
	 * @returns {Proxy}
	 */
	constructor(cfg) {
		this.#cfg = cfg;
		this.#id = 'id' in cfg ? cfg.id : Unit.#nextId++;

		addCfgProps(this, this.#cfg);

		aopMethod(this, 'addSkill', {
			noticePayloadBuilder: args => ({skill: args[0]}),
		});
		aopMethod(this, 'removeSkill', {
			noticePayloadBuilder: args => ({skill: args[0]}),
		});

		watch(this, 'Battlefield moveUnit end', ({unit, to}) => {
			if (compareWithId(this, unit)) {
				this.#position = to;
			}
		});
	}

	get id() { return this.#id; }

	get display() { return this.#cfg.display ?? this.name; }

	get skills() { return [...this.#skills]; }

	get gaming() { return this.owner?.gaming; }

	get position() { return this.#position; }

	// set position(p) {
	// 	if (this.#position && this.#position.isEqualTo(p)) {
	// 		return;
	// 	}
	// 	const oldPosition = this.position;
	// 	// setter作为移动指令的入口，通知战场来移动单位
	// 	this.gaming.battlefield.moveUnit(this, p);
	// 	this.gaming.bulletin.notice('单位移动', {unit: this, oldPosition});
	// }

	addSkill(skill) {
		if (!skill || this.skills.includes(skill)) {
			return;
		}
		this.#skills.push(skill);

		if (skill.watchers) {
			const _boundWatchers = {};
			Object.entries(skill.watchers).forEach(([topic, watcher]) => {
				_boundWatchers[topic] = _boundWatchers[topic] ?? [];
				_boundWatchers[topic].push(watcher);
				this.gaming.bulletin.watch(topic, watcher);
			});
			this.#skillBoundWatchers.set(skill, _boundWatchers);
		}
	}

	removeSkill(skillOrClass) {
		const skillIndex = typeof skillOrClass === 'function'
											 ? this.skills.findIndex(s => s instanceof skillOrClass)
											 : this.skills.findIndex(s => s === skillOrClass);
		if (skillIndex === -1) {
			return;
		}

		const skill = this.skills[skillIndex];

		if (this.#skillBoundWatchers.has(skill)) {
			Object.entries(this.#skillBoundWatchers.get(skill))
			.forEach(([topic, boundWatchers]) =>
				boundWatchers.forEach(boundWatcher =>
					this.gaming.bulletin.unwatch(topic, boundWatcher)));
			this.#skillBoundWatchers.delete(skill);
		}

		this.#skills.splice(skillIndex, 1);
	}
}

/**
 * 规则：有一定业务含义，若干个相关的逻辑片段的封装。这些逻辑片段是监听器（watchers）
 */
class Rule {
	#cfg;
	#gaming;

	constructor(gaming, cfg) {
		this.#cfg = cfg;
		this.#gaming = gaming;
		addCfgProps(this, this.#cfg);
		watchersWatch(this, this.watchers);
	}

	get gaming() { return this.#gaming; }
}

class Skill {
	static #nextId = 1;
	static #instanceActivateCounts = new WeakMap();

	#id;
	#owner;
	#cfg;

	constructor(cfg, owner) {
		this.#id = 'id' in cfg ? cfg.id : Skill.#nextId++;
		this.#cfg = cfg;
		this.#owner = owner;
		Skill.#instanceActivateCounts.set(this, 0); // 在构造时初始化当前实例的计数

		watch(this, 'skill activate end', ({skill}) => {
			if (compareWithId(this, skill)) {
				Skill.#instanceActivateCounts.set(this, Skill.#instanceActivateCounts.get(this) + 1);
			}
		});

		//方法只声明了1个参数，对应args[0]。由于js不限制调用方提供多少个参数，args后面的元素就是调用方额外提供的参数，也许子类重写的方法里会用，所以也要传。
		aopMethod(this, 'filterValidTargets', {
			argsResolver: args => [ensureArray(args[0]), ...args.slice(1)],
			noticePayloadBuilder: args => ({targets: args[0]}),
		});
		aopAsyncMethod(this, 'activate', {
			argsResolver: args => [this.filterValidTargets(ensureArray(args[0])), ...args.slice(1)],
			noticePayloadBuilder: args => ({targets: args[0]}),
		});
		aopGetter(this, 'potentialTargets', {typeName: 'skill'});

		addCfgProps(this, this.#cfg);
	}

	/**
	 * 触发技能/技能生效。只针对参数中合法的若干个目标产生影响。若未对任何目标影响则返回false（施加影响但无效的不算在内）。
	 * 发布通知：
	 * 	'skill activate start'：若参数中无合法目标则不会发布。
	 * 	'skill activate end'：参数中有合法目标，且返回true，才会发布。
	 * 默认实现：无事发生，直接返回true。子类应重写此方法，只需要包含纯粹的技能逻辑，会自动统计触发次数、发布通知等。
	 * @param {Array<Object>} targets - 经过filterValidTargets过滤后的合法目标数组。
	 * @returns {boolean} - 返回true表示成功，false表示失败。
	 */
	async activate(targets) { return true; }

	/**
	 * 获取所有潜在的可用目标。子类应重写此方法以提供具体的寻目标逻辑。
	 * 默认实现：返回undefined（未定义可用目标）
	 * @returns {Array<Object>} - 潜在目标对象的数组。undefined照本意，表示‘未定义（可用目标）’，即不能获取或不能列举可用目标。null同[]，表示无可用目标。
	 */
	get potentialTargets() { return undefined; }

	/**
	 * 过滤传入的目标列表，返回其中合法的目标。子类可重写以提供更复杂的过滤规则。
	 * 默认实现：使用potentialTargets过滤。
	 * @param {Array<Object>} targets - 待过滤的目标数组。
	 * @returns {Array<Object>} - 过滤后的合法目标数组。
	 */
	filterValidTargets(targets) {
		const potential = this.potentialTargets || [];
		return targets.filter(t => potential.some(p => compareWithId(p, t)));
	}

	get id() { return this.#id; }

	get owner() { return this.#owner; }

	get gaming() { return this.owner?.gaming; }

	get activateCount() { return Skill.#instanceActivateCounts.get(this); }
}

/**
 * 被动技。主动技是由游戏主进程主动触发的技能，被动技则在自身定义的时机触发，一般游戏主进程不应主动触发。
 */
class PassiveSkill extends Skill {
	constructor(cfg, owner) {
		super(cfg, owner);
		//watchers中通常应当调用PassiveSkill.activate，需要从监听的通知的内容中组织出本技能所需目标。
		watchersWatch(this, cfg.watchers);
	}
}

/**
 * 增益技能。一种特殊的被动技，只在主人得到本技能时触发一次，给主人或相关元素增加一种状态（称为‘增益’）。
 */
class BuffSkill extends PassiveSkill {
	#isActivated = false;

	constructor(cfg, owner) {
		super(cfg, owner);

		// 在父类（已代理）的基础上，再次包装方法以加入BuffSkill的逻辑
		const rawActivate = this.activate;
		this.activate = async (...args) => {
			if (this.#isActivated) {
				console?.warn(`BuffSkill [${this.name}] 已经激活过一次，不能再次主动使用。`);
				return false;
			}
			const result = await rawActivate.apply(this, args);
			if (result === true) {
				this.#isActivated = true;
			}
			return result;
		};

		const rawFilterValidTargets = this.filterValidTargets;
		this.filterValidTargets = (...args) => {
			if (this.#isActivated) {
				console?.warn(`BuffSkill [${this.name}] 已经激活过一次，因此不返回任何合法目标。`);
				return [];
			}
			return rawFilterValidTargets.apply(this, args);
		};
		// 注册监听器
		const activateAfterAddSkill = ({unit, skill}) => {
			if (compareWithId(this.owner, unit) && compareWithId(this, skill)) {
				this.activate(this.owner);
				watch(this, 'Unit removeSkill end', ({unit, skill}) => {
					if (compareWithId(this.owner, unit) && compareWithId(this, skill)) {
						this.deactivate();
						unwatch(this, 'Unit addSkill end', activateAfterAddSkill);
					}
				});
			}
		};
		watchersWatch(this, {
			'Unit addSkill end': activateAfterAddSkill,
		});
	}

	/**
	 * 增益技能的filterValidTargets实现。
	 * 在构造函数中调用activate时，它需要允许owner通过。
	 * 之后，它会被覆盖以阻止主动使用。
	 * @param {Array<Object>} targets - 待过滤的目标数组。
	 * @returns {Array<Object>} - 过滤后的合法目标数组。
	 */
	filterValidTargets(targets) {
		const processedTargets = ensureArray(targets);
		return processedTargets.filter(t => compareWithId(t, this.owner));
	}

	async deactivate() { return true; }
}

class Plugin {
	#cfg;
	#gaming;

	constructor(gaming, cfg) {
		this.#cfg = cfg;
		this.#gaming = gaming;
		addCfgProps(this, this.#cfg);
		watchersWatch(this, this.watchers);
	}

	get gaming() { return this.#gaming; }
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

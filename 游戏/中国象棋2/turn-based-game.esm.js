import {
	addCfgProps, aopAsyncMethod, aopGetter, aopMethod, Bulletin, compareWithId, ensureArray, notice, unwatch, watch,
	watchersWatch,
} from './kit.esm.js';

export {
	TurnBasedGame, TurnBasedGaming, Rule, Situation,
	Player, Unit, Skill, PassiveSkill, BuffSkill,
	Plugin, Module,
};

class TurnBasedGame {
	cfg;

	constructor(cfg = {}) {
		this.cfg = cfg;
	}

	newGaming() {
		const GamingClass = this.cfg.GamingClass ?? TurnBasedGaming;
		const rt = new GamingClass(this.cfg);
		rt.build();
		rt.start();
		return rt;
	}
}

/**
 * 一场游戏。
 */
class TurnBasedGaming {
	_cfg;
	get cfg() {return this._cfg;}

	get unitTypes() { return this._cfg.unitTypes; }

	_bulletin = new Bulletin();
	get bulletin() { return this._bulletin; }

	_globalRules = [];
	_plugins = [];
	_modules = []; // 新增
	_situation;
	get situation() { return this._situation; }

	_playerTurnSequence = []; // 存储有序的玩家实例列表
	get playerTurnSequence() { return [...this._playerTurnSequence]; }

	_playersIdMap = {}; // 存储所有玩家实例的映射
	get playersIdMap() { return {...this._playersIdMap}; }

	get gaming() { return this; }

	constructor(cfg) {
		this._cfg = cfg;
		addCfgProps(this, this._cfg);
	}

	build() {
		notice(this, 'gaming build start', {gaming: this});
		//规则、插件通常是注册一些监听器
		this._globalRules = this._buildGlobalRules();
		this._plugins = this._buildPlugins();
		this._plugins.forEach(plugin =>
			Object.entries(plugin.watchers)
						.forEach(([topicName, watcher]) => this.bulletin.watch(topicName, watcher.bind(plugin))));
		this._playerTurnSequence = this._buildPlayerTurnSequence();
		this._playersIdMap = Object.fromEntries(this._playerTurnSequence.map(player => [player.id, player]));
		this._situation = this._buildSituation();

		this._modules = this._buildModules();
		notice(this, 'gaming build end', {gaming: this});
	}

	_buildPlayerTurnSequence() {
		const playerTurnSequence = this._cfg.playerTurnSequence;
		notice(this, 'gaming buildPlayerTurnSequence start', {playerTurnSequence});
		const rt = playerTurnSequence.map(playerCfg => {
			const PlayerClass = playerCfg.class ?? this._cfg.PlayerClass ?? Player;
			return new PlayerClass(this, playerCfg);
		});
		notice(this, 'gaming buildPlayerTurnSequence end', {playerTurnSequence: rt});
		return rt;
	}

	_buildGlobalRules() {
		const rulesCfg = this._cfg.globalRules || [];
		notice(this, 'gaming buildGlobalRules start', {gaming: this, rulesCfg});
		const rt = rulesCfg.map(ruleCfg => this._buildGlobalRule(ruleCfg));
		notice(this, 'gaming buildGlobalRules end', {globalRules: rt});
		return rt;
	}

	_buildGlobalRule(ruleCfg) {
		const RuleClass = ruleCfg.class ?? this._cfg.RuleClass ?? Rule;
		notice(this, 'gaming buildGlobalRule start', {gaming: this, ruleCfg, class: RuleClass});
		const rt = new RuleClass(this, ruleCfg);
		notice(this, 'gaming buildGlobalRule end', {globalRule: rt});
		return rt;
	}

	_buildSituation() {
		const SituationClass = this._cfg.SituationClass ?? Situation;
		notice(this, 'gaming buildSituation start', {gaming: this});
		const rt = new SituationClass(this);
		notice(this, 'gaming buildSituation end', {situation: rt});
		return rt;
	}

	_buildPlugins() {
		const pluginsCfg = this._cfg.plugins || [];
		notice(this, 'gaming buildPlugins start', {gaming: this, pluginsCfg});
		const rt = pluginsCfg.map(pluginCfg => this._buildPlugin(pluginCfg));
		notice(this, 'gaming buildPlugins end', {plugins: rt});
		return rt;
	}

	_buildPlugin(pluginCfg) {
		const PluginClass = pluginCfg.class ?? this._cfg.PluginClass ?? Plugin;
		notice(this, 'gaming buildPlugin start', {gaming: this, pluginCfg, class: PluginClass});
		const rt = new PluginClass(this, pluginCfg);
		notice(this, 'gaming buildPlugin end', {plugin: rt});
		return rt;
	}

	_buildModules() {
		const modulesCfg = this._cfg.modules || [];
		notice(this, 'gaming buildModules start', {gaming: this, modulesCfg});
		const rt = modulesCfg.map(moduleCfg => this._buildModule(moduleCfg));
		notice(this, 'gaming buildModules end', {modules: rt});
		return rt;
	}

	_buildModule(moduleCfg) {
		const ModuleClass = moduleCfg.class ?? this._cfg.ModuleClass ?? Module;
		notice(this, 'gaming buildModule start', {gaming: this, moduleCfg, class: ModuleClass});
		const rt = new ModuleClass(this, moduleCfg);
		notice(this, 'gaming buildModule end', {module: rt});
		return rt;
	}

	start() {
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
			watch(this, 'ui input', onInput, {watchHistory: false});
		});
	}
}

/**
 * 战况。记录游戏的实时状态、已成历史的客观事实（比如操作、事件等）。
 */
class Situation {
	_gaming;
	get gaming() { return this._gaming; }

	_rounds = [];
	get rounds() { return this._rounds; }

	curPlayer;
	isStarted = false;
	isEnded = false;
	winner;

	constructor(gaming) { this._gaming = gaming; }

	async startRound() {
		const round = new Round(this.gaming, this._rounds.length + 1);
		this._rounds.push(round);
		await round.start();
	}
}

class Round {
	_gaming;
	get gaming() { return this._gaming; }

	_index;
	get index() { return this._index; }

	constructor(gaming, index) {
		this._gaming = gaming;
		this._index = index;

		aopAsyncMethod(this, 'start');
	}

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
			// 如果当前玩家的回合导致游戏结束，则立即中断回合
			if (this.gaming.situation.isEnded) {
				break;
			}
		}
	}
}

class Player {
	static _nextId = 1;

	_cfg;
	_id;
	get id() { return this._id; }

	_gaming;
	get gaming() { return this._gaming; }

	_team;
	get team() { return this._team; }

	_skills = [];
	get skills() { return [...this._skills]; }

	_skillBoundWatchers = new WeakMap();

	selectedSkills = [];
	selectedTargets = [];

	constructor(gaming, cfg) {
		this._cfg = cfg;
		this._id = 'id' in cfg ? cfg.id : Player._nextId++;
		this._gaming = gaming;
		this._team = cfg.team;
		this.actionsPerTurn = cfg.actionsPerTurn || 1; // 从配置或默认值初始化

		addCfgProps(this, this._cfg);

		aopMethod(this, 'addSkill', {
			noticePayloadBuilder: args => ({skill: args[0]}),
		});
		aopMethod(this, 'removeSkill', {
			noticePayloadBuilder: args => ({skill: args[0]}),
		});
		aopMethod(this, 'selectSkills', {
			noticePayloadBuilder: args => ({skills: args[0]}),
		});
		aopMethod(this, 'selectTargets', {
			noticePayloadBuilder: args => ({targets: args[0]}),
		});

		aopMethod(this, 'play');

		const skills = this._buildSkills(cfg.skills || []);
		skills.forEach(skill => this.addSkill(skill));
	}

	_buildSkills(skillsCfg) {
		const owner = this;
		notice(this, 'player buildSkills start', {owner, skillsCfg});
		const rt = skillsCfg.map(skillCfg => this._buildSkill(skillCfg));
		notice(this, 'player buildSkills end', {rt});
		return rt;
	}

	_buildSkill(skillCfg) {
		const SkillClass = skillCfg.class ?? this.gaming._cfg.SkillClass ?? Skill;
		notice(this, 'player buildSkill start', {owner: this, skillCfg, class: SkillClass});
		const rt = new SkillClass({...skillCfg, owner: this});
		notice(this, 'player buildSkill end', {skill: rt});
		return rt;
	}

	addSkill(skill) {
		if (!skill || this.skills.includes(skill)) {
			return;
		}
		this._skills.push(skill);

		if (skill.watchers) {
			const _boundWatchers = {};
			Object.entries(skill.watchers).forEach(([topic, watcher]) => {
				_boundWatchers[topic] = _boundWatchers[topic] ?? [];
				_boundWatchers[topic].push(watcher);
				this.gaming.bulletin.watch(topic, watcher);
			});
			this._skillBoundWatchers.set(skill, _boundWatchers);
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

		if (this._skillBoundWatchers.has(skill)) {
			Object.entries(this._skillBoundWatchers.get(skill))
						.forEach(([topic, boundWatchers]) =>
							boundWatchers.forEach(boundWatcher =>
								this.gaming.bulletin.unwatch(topic, boundWatcher)));
			this._skillBoundWatchers.delete(skill);
		}

		this._skills.splice(skillIndex, 1);
	}

	/**
	 * 玩家玩游戏。在回合制游戏里，玩家在自己的轮次里施放技能。
	 * 默认实现：执行N次有效行动后（N由actionsPerTurn决定），本轮次结束。
	 */
	async play() {
		let actionsTaken = 0;
		while (actionsTaken < this.actionsPerTurn) {
			const input = await this.gaming.waitForInput();

			if (input?.action === 'END_TURN') {
				break;
			}

			this.processInput(input);

			const actionPerformed = await this.activateSkills();
			if (actionPerformed) {
				actionsTaken++; // 成功行动，计数器加一
				this.selectedTargets = []; // 成功行动后，清空目标，以便进行下一次行动
			}
		}

		this.selectedSkills = [];
		this.selectedTargets = [];
	}

	/**
	 * 根据输入，设置施放技能的要素，顺序： Skill -> Target。
	 * @param {any|any[]} input
	 */
	processInput(input) {
		const inputs = ensureArray(input);
		if (inputs.length === 0) {
			return;
		}
		const firstItem = inputs[0];

		if (firstItem instanceof Skill) {
			this.selectSkills(inputs);
		} else {
			this.selectTargets(inputs);
		}
	}

	/**
	 * 选择技能。默认实现是设置选中的技能。
	 * 只有拥有 `activate` 方法的技能（主动技能）才能被选中。
	 * @param {Skill[]} skills 要选择的技能
	 */
	selectSkills(skills) {
		// 过滤出所有主动技能
		skills = ensureArray(skills);
		const activeSkills = this.filterSelectableSkills(skills.filter(s => typeof s?.activate === 'function'));
		if (activeSkills.length > 0) {
			this.selectedSkills = activeSkills;
			this.selectedTargets = []; // 重置目标
		}
	}

	filterSelectableSkills(skills) {
		skills = ensureArray(skills);
		return skills.filter(s => this.skills.includes(s));
	}

	/**
	 * 选择目标。默认实现是设置选中的目标。
	 * @param {any[]} targets 要选择的目标
	 */
	selectTargets(targets) {
		// 必须在选定技能后
		if (this.selectedSkills?.length) {
			this.selectedTargets = targets;
		}
	}

	/**
	 * 默认实现：每个技能都触发。技能自行处理目标（比如筛除非法目标等）
	 * @returns {boolean} 是否成功触发了至少一个技能
	 */
	async activateSkills() {
		if (!this.isReadyToActivateSkills()) {
			return false;
		}
		//要素齐备，开始施放技能。
		let activated = false;
		for (const skill of this.selectedSkills) {
			// 确认当前玩家拥有该技能
			// if (this.skills.includes(skill)) {
			// 触发技能，并将目标传入
			activated = activated || await skill.activate(this.selectedTargets);
			// }
		}
		return activated;
	}

	isReadyToActivateSkills() {
		return !this.selectedSkills?.length || !this.selectedTargets?.length;
	}
}

class Unit {
	static _nextId = 1;

	_cfg;

	get display() { return this._cfg.display ?? this.name; }

	get gaming() { return this.owner?.gaming; }

	_id;
	get id() { return this._id; }

	_skills = [];
	get skills() { return [...this._skills]; }

	_skillBoundWatchers = new WeakMap();

	/**
	 * cfg:{id?,name,intro?,display?,owner?,skills}
	 * @param cfg
	 */
	constructor(cfg) {
		this._cfg = cfg;
		this._id = 'id' in cfg ? cfg.id : Unit._nextId++;

		addCfgProps(this, this._cfg);
		aopMethod(this, 'addSkill', {
			noticePayloadBuilder: args => ({skill: args[0]}),
		});
		aopMethod(this, 'removeSkill', {
			noticePayloadBuilder: args => ({skill: args[0]}),
		});

		const skills = this._buildSkills(cfg.skills || []);
		skills.forEach(skill => this.addSkill(skill));
	}

	_buildSkills(skillsCfg) {
		const owner = this;
		notice(this, 'unit buildSkills start', {owner, skillsCfg});
		const rt = skillsCfg.map(skillCfg => this._buildSkill(skillCfg));
		notice(this, 'unit buildSkills end', {rt});
		return rt;
	}

	_buildSkill(skillCfg) {
		const SkillClass = skillCfg.class ?? this.gaming._cfg.SkillClass ?? Skill;
		notice(this, 'unit buildSkill start', {owner: this, skillCfg, class: SkillClass});
		const rt = new SkillClass({...skillCfg, owner: this});
		notice(this, 'unit buildSkill end', {skill: rt});
		return rt;
	}

	addSkill(skill) {
		if (!skill || this.skills.includes(skill)) {
			return;
		}
		this._skills.push(skill);

		if (skill.watchers) {
			const _boundWatchers = {};
			Object.entries(skill.watchers).forEach(([topic, watcher]) => {
				_boundWatchers[topic] = _boundWatchers[topic] ?? [];
				_boundWatchers[topic].push(watcher);
				this.gaming.bulletin.watch(topic, watcher);
			});
			this._skillBoundWatchers.set(skill, _boundWatchers);
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

		if (this._skillBoundWatchers.has(skill)) {
			Object.entries(this._skillBoundWatchers.get(skill))
						.forEach(([topic, boundWatchers]) =>
							boundWatchers.forEach(boundWatcher =>
								this.gaming.bulletin.unwatch(topic, boundWatcher)));
			this._skillBoundWatchers.delete(skill);
		}

		this._skills.splice(skillIndex, 1);
	}
}

/**
 * 规则：有一定业务含义，若干个相关的逻辑片段的封装。这些逻辑片段是监听器（watchers）
 */
class Rule {
	_cfg;
	_gaming;
	get gaming() { return this._gaming; }

	constructor(gaming, cfg) {
		this._cfg = cfg;
		this._gaming = gaming;
		addCfgProps(this, this._cfg);
		watchersWatch(this, this.watchers);
	}
}

class Skill {
	static _nextId = 1;
	static _instanceActivateCounts = new WeakMap();

	get activateCount() { return Skill._instanceActivateCounts.get(this); }

	_id;
	get id() { return this._id; }

	_owner;
	get owner() { return this._owner; }

	_cfg;

	get gaming() { return this.owner?.gaming; }

	/**
	 * 获取所有潜在的可用目标。子类应重写此方法以提供具体的寻目标逻辑。
	 * 默认实现：返回undefined（未定义可用目标）
	 * @returns {Array<Object>} - 潜在目标对象的数组。undefined照本意，表示‘未定义（可用目标）’，即不能获取或不能列举可用目标。null同[]，表示无可用目标。
	 */
	get availableTargets() { return undefined; }

	constructor(cfg) {
		this._id = 'id' in cfg ? cfg.id : Skill._nextId++;
		this._cfg = cfg;
		this._owner = cfg.owner;
		Skill._instanceActivateCounts.set(this, 0); // 在构造时初始化当前实例的计数

		watch(this, 'skill activate end', ({skill}) => {
			if (compareWithId(this, skill)) {
				Skill._instanceActivateCounts.set(this, Skill._instanceActivateCounts.get(this) + 1);
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
		aopGetter(this, 'availableTargets', {typeName: 'skill'});

		addCfgProps(this, this._cfg);
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
	 * 过滤传入的目标列表，返回其中合法的目标。子类可重写以提供更复杂的过滤规则。
	 * 默认实现：使用availableTargets过滤。
	 * @param {Array<Object>} targets - 待过滤的目标数组。
	 * @returns {Array<Object>} - 过滤后的合法目标数组。
	 */
	filterValidTargets(targets) {
		const potential = this.availableTargets || [];
		return targets.filter(t => potential.some(p => compareWithId(p, t)));
	}
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
	_isActivated = false;

	constructor(cfg, owner) {
		super(cfg, owner);

		// 在父类（已代理）的基础上，再次包装方法以加入BuffSkill的逻辑
		const rawActivate = this.activate;
		this.activate = async (...args) => {
			if (this._isActivated) {
				console?.warn(`BuffSkill [${this.name}] 已经激活过一次，不能再次主动使用。`);
				return false;
			}
			const result = await rawActivate.apply(this, args);
			if (result === true) {
				this._isActivated = true;
			}
			return result;
		};

		const rawFilterValidTargets = this.filterValidTargets;
		this.filterValidTargets = (...args) => {
			if (this._isActivated) {
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
	_cfg;
	_gaming;
	get gaming() { return this._gaming; }

	constructor(gaming, cfg) {
		this._cfg = cfg;
		this._gaming = gaming;
		addCfgProps(this, this._cfg);
		watchersWatch(this, this.watchers);
	}
}

class Module {
	_cfg;
	_gaming;
	get gaming() { return this._gaming; }

	constructor(gaming, cfg) {
		this._cfg = cfg;
		this._gaming = gaming;
		addCfgProps(this, this._cfg);
		watchersWatch(this, this.watchers);
	}
}

export {Team, Skill, PassiveSkill, BuffSkill};

/**
 * 获取实例的完整类继承链
 * @param {Object} instance - 要检查的实例
 * @param {Object} [options] - 配置选项
 * @param {boolean} [options.includeObject=false] - 是否包含Object基类
 * @param {boolean} [options.reverse=false] - 是否反转顺序（从基类到子类）
 * @returns {string[]} 类名数组
 */
const getClassHierarchy = (instance, options = {includeObject: false, reverse: false}) => {
	const {includeObject = false, reverse = false} = options;
	const classes = [];
	let proto = Object.getPrototypeOf(instance);

	while (proto) {
		if (!includeObject && proto === Object.prototype) {
			break;
		}
		if (proto === null) {
			break;
		}
		const constructor = proto.constructor;
		if (constructor) {
			const name = constructor.name ||
									 constructor.toString().match(/function\s*([^\s(]+)/)?.[1] ||
									 '(anonymous)';
			classes.push(name);
		}

		proto = Object.getPrototypeOf(proto);
	}

	return reverse ? classes.reverse() : classes;
};

/**
 * 工具方法：确保总是得到一个数组。
 * 如果参数是数组，直接返回；如果是非空值，封装成单元素数组；否则返回空数组。
 * @param value - 待处理的值。
 * @returns {Array} - 确保是数组的返回值。
 */
const ensureArray = value => Array.isArray(value) ? value : (value !== null && value !== undefined ? [value] : []);
const compareWithId = (a, b) => a === b || a.id && b.id && a.id === b.id;

//简便方法，减少代码量
const watch = (gamingPart, topic, callback) => gamingPart.gaming?.bulletin.watch(topic, callback);
const watchersWatch = (gamingPart, watchers) => {
	if (watchers) {
		Object.entries(watchers).forEach(([topic, callback]) => watch(gamingPart, topic, callback));
	}
};
const unwatch = (gamingPart, topic, callback) => gamingPart.gaming?.bulletin.unwatch(topic, callback);
const notice = (gamingPart, topic, content) => gamingPart.gaming?.bulletin.notice(topic, content);

/**
 * 创建一个代理，用于将对实例未定义属性的访问转发到其私有 #privateCfg 对象。
 * @param {object} instance - 要代理的类实例。
 * @param {object} privateCfg - 私有的配置对象。
 * @returns {Proxy} - 返回配置好的代理实例。
 */
const proxy = (instance, privateCfg) => {
	return new Proxy(instance, {
		get: (target, prop, receiver) => {
			// 优先返回实例或原型链上已有的属性（包括被包装过的方法）
			if (prop in target) {
				return Reflect.get(target, prop, receiver);
			}
			// 否则，在 privateCfg 中查找
			if (prop in privateCfg) {
				const value = privateCfg[prop];
				return typeof value === 'object' && value !== null ? {...value} : value;
			}
			return undefined;
		},
		set: (target, prop, value, receiver) => {
			// 保护cfg属性不被外部修改
			if (prop in privateCfg) {
				console.error(`Cannot modify a read-only config property: ${prop}`);
				return false;
			}
			return Reflect.set(target, prop, value, receiver);
		},
	});
};

/**
 * 用于实际执行前后发通知的aop便捷工具方法。复杂逻辑的aop就自己写吧
 * @param self
 * @param methodName
 * @param options
 */
const aopMethod = (self, methodName,
									 options = {argsResolver: undefined, noticePayloadBuilder: undefined, typeName: ''}) => {
	const {argsResolver, noticePayloadBuilder, typeName} = options;
	const rawMethod = self[methodName];
	self[methodName] = (..._args_) => {
		//可以额外地先处理参数，比如把单个对象包装成数组
		const args = argsResolver ? argsResolver(_args_) : _args_;
		//获取继承链中的顶级父类的名字，也可以通过typeName自行指定。用于通知主题的主语。
		const typeName_ = typeName ?? getClassHierarchy(self).at(-1);

		const noticePayload = noticePayloadBuilder ? noticePayloadBuilder(args) : {};
		noticePayload[typeName_] = self;//通知内容里加入主语
		notice(self, typeName_ + ' ' + methodName + ' start', noticePayload);

		const result = rawMethod.apply(self, args);//执行写在代码里的原始方法代码

		noticePayload.result = result;//通知内容里加入方法执行结果
		notice(self, typeName_ + ' ' + methodName + ' end', noticePayload);
		return result;
	};
};

/**
 * 为实例的 getter 属性添加 AOP 效果，在 getter 访问前后发布通知。
 * @param {Object} self - 要代理的实例。
 * @param {string} propertyName - 要包装的 getter 属性名。
 * @param {Object} [options] - 配置选项。
 * @param {Function} [options.noticePayloadBuilder] - 可选。一个函数，用于构建通知的额外 payload。它接收实例作为参数。
 * @param {string} [options.typeName] - 可选。用于通知主题的类型名称。如果未提供，将通过 getClassHierarchy 自动获取。
 */
const aopGetter = (self, propertyName, options = {noticePayloadBuilder: undefined, typeName: ''}) => {
	const {noticePayloadBuilder, typeName} = options;
	// 1. 获取原始的 getter 函数的属性描述符
	// 首先在原型链上查找，因为 getter 通常定义在类的原型上
	let descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(self), propertyName);

	// 如果在原型链上找不到，尝试在实例自身查找（尽管对于 getter 来说不常见）
	if (!descriptor) {
		descriptor = Object.getOwnPropertyDescriptor(self, propertyName);
	}

	// 检查是否确实是一个 getter
	if (!descriptor || !descriptor.get) {
		console?.warn(`属性 '${propertyName}' 在实例上不是一个 getter 或不存在，无法应用 aopGetter。`);
		return;
	}

	const originalGetter = descriptor.get; // 获取原始的 getter 函数

	// 2. 重新定义该属性的 getter
	Object.defineProperty(self, propertyName, {
		get: function() {
			const typeName_ = typeName ?? getClassHierarchy(this).at(-1);
			// noticePayloadBuilder 可以选择接收实例作为参数，用于构建通知的额外数据
			const noticePayload = noticePayloadBuilder ? noticePayloadBuilder(self) : {};
			noticePayload[typeName_] = self; // 自动添加实例本身到 payload

			notice(this, typeName_ + ' get ' + propertyName + ' start', noticePayload);

			// 调用原始 getter 获取结果
			const result = originalGetter.call(this);

			noticePayload.result = result;
			notice(this, typeName_ + ' get ' + propertyName + ' end', noticePayload);
			return result;
		},
		// 保持原始的属性描述符配置，如可枚举性、可配置性
		configurable: descriptor.configurable,
		enumerable: descriptor.enumerable,
	});
};

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
		this._build();
		this._start(); // 游戏创建后自动开始
		return proxy(this, this.#cfg);
	}

	get gaming() { return this; }

	get bulletin() { return this.#bulletin; }

	get battlefield() { return this.#battlefield; }

	get situation() { return this.#situation; }

	get teamList() { return Object.values(this.#teams); }

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
		const team = new TeamClass(this, {id, ...teamCfg});
		team.players = this._buildPlayers(teamCfg.players || {}, team);
		return team;
	}

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
		const rt = unitsCfg.map(unitCfg => this._buildUnit(unitCfg));
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
		const rt = new SkillClass({owner, gaming: this});
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
				const round = new Round(this, this.situation.rounds.length + 1);
				this.situation.rounds.push(round);
				await round.start();
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

class Team {
	static #id = 0;

	#id;
	#cfg;
	#members = [];
	#gaming;

	constructor(cfg, gaming) {
		this.#id = ++Team.#id;
		this.#cfg = cfg;
		this.#gaming = gaming;

		aopMethod(this, 'addMember', {noticePayloadBuilder: args => ({member: args[0]})});
		aopMethod(this, 'removeMember', {noticePayloadBuilder: args => ({member: args[0]})});
		aopGetter(this, 'members', {typeName: 'team'});

		return proxy(this, this.#cfg);
	}

	get id() { return this.#id; }

	get members() { return [...this.#members]; }

	addMember(member) { this.#members.push(member); }

	removeMember(member) { this.#members = this.#members.filter(m => !compareWithId(m, member)); }

	get gaming() { return this.#gaming; }
}

class Skill {
	static #id = 0;
	static #instanceActivateCounts = new WeakMap();

	#id;
	#owner;
	#cfg;

	constructor(cfg, owner) {
		this.#id = ++Skill.#id;
		this.#cfg = cfg;
		this.#owner = owner;
		Skill.#instanceActivateCounts.set(this, 0); // 在构造时初始化当前实例的计数

		notice(this, 'skill activate end', ({skill}) => {
			if (compareWithId(this, skill)) {
				Skill.#instanceActivateCounts.set(this, Skill.#instanceActivateCounts.get(this) + 1);
			}
		});

		//方法只声明了1个参数，对应args[0]。由于js不限制调用方提供多少个参数，args后面的元素就是调用方额外提供的参数，也许子类重写的方法里会用，所以也要传。
		aopMethod(this, 'filterValidTargets', {
			argsResolver: args => [ensureArray(args[0]), ...args.slice(1)],
			noticePayloadBuilder: args => ({targets: args[0]}),
		});
		aopMethod(this, 'activate', {
			argsResolver: args => [this.filterValidTargets(ensureArray(args[0])), ...args.slice(1)],
			noticePayloadBuilder: args => ({targets: args[0]}),
		});
		aopGetter(this, 'potentialTargets', {typeName: 'skill'});

		return proxy(this, this.#cfg);
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
				watch(this, 'unit remove a skill end', ({unit, skill}) => {
					if (compareWithId(this.owner, unit) && compareWithId(this, skill)) {
						this.deactivate();
					}
					unwatch(this, 'unit add skill end', activateAfterAddSkill);
				});
			}
		};
		watchersWatch(this, {
			'unit add skill end': activateAfterAddSkill,
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

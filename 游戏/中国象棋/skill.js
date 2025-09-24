export {Team, Skill, PassiveSkill, BuffSkill};

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
		}
	});
};

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

		const rawAddMember = this.addMember;
		this.addMember = (...args) => {
			notice(this, 'team addMember start', {team: this, member: args[0]});
			const result = rawAddMember.apply(this, args);
			notice(this, 'team addMember end', {team: this, member: args[0]});
			return result;
		};

		const rawRemoveMember = this.removeMember;
		this.removeMember = (...args) => {
			notice(this, 'team removeMember start', {team: this, member: args[0]});
			const result = rawRemoveMember.apply(this, args);
			notice(this, 'team removeMember end', {team: this, member: args[0]});
			return result;
		};

		return proxy(this, this.#cfg);
	}

	get id() {
		return this.#id;
	}

	get members() {
		const rt = [...this.#members];
		notice(this, 'team getMembers end', {team: this, members: rt});
		return rt;
	}

	addMember(member) {
		this.#members.push(member);
	}

	removeMember(member) {
		this.#members = this.#members.filter(m => !compareWithId(m, member));
	}

	get gaming() {
		return this.#gaming;
	}
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

		const rawActivate = this.activate;
		this.activate = async (...args) => {
			const inputTargets = ensureArray(args[0]);
			const actualTargets = this.filterValidTargets(inputTargets);
			if (actualTargets.length === 0) {
				console?.warn(`技能 [${this.name}] 在提供的目标中没有找到任何合法目标，技能未发动。`);
				return false;
			}
			notice(this, 'skill activate start', {skill: this, targets: actualTargets});
			const result = await rawActivate.apply(this, [actualTargets, ...args.slice(1)]);
			if (result === false) {
				return false;
			}
			notice(this, 'skill activate end', {skill: this, targets: actualTargets});
			return true;
		};

		const rawFilterValidTargets = this.filterValidTargets;
		this.filterValidTargets = (...args) => {
			const actualTargets = ensureArray(args[0]);
			notice(this, 'skill filterValidTargets start', {skill: this, targets: actualTargets});
			const rt = rawFilterValidTargets.apply(this, [actualTargets, ...args.slice(1)]);
			notice(this, 'skill filterValidTargets end', {skill: this, targets: actualTargets, filteredTargets: rt});
			return rt;
		};

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
	async activate(targets) {
		return true;
	}

	/**
	 * 获取所有潜在的可用目标。子类应重写此方法以提供具体的寻目标逻辑。
	 * 默认实现：返回undefined（未定义可用目标）
	 * @returns {Array<Object>} - 潜在目标对象的数组。undefined照本意，表示‘未定义（可用目标）’，即不能获取或不能列举可用目标。null同[]，表示无可用目标。
	 */
	get potentialTargets() {
		notice(this, 'skill get potential targets start', {skill: this});
		const rt = undefined;
		notice(this, 'skill get potential targets end', {skill: this, targets: rt});
		return rt;
	}

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

	get id() {
		return this.#id;
	}

	get owner() {
		return this.#owner;
	}

	get gaming() {
		return this.owner?.gaming;
	}

	get activateCount() {
		return Skill.#instanceActivateCounts.get(this);
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
			'unit add skill end': activateAfterAddSkill
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

	async deactivate() {
		return true;
	}
}
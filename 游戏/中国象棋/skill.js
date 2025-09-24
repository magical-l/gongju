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
 * 创建一个通用的Proxy处理器，用于代理实例属性和只读配置属性。
 * @param instance - Proxy将要包裹的实例。
 * @param options - 配置选项。
 * @param options.getSpecific - 针对特定属性的get处理函数。
 *   如果处理了该属性，应返回处理结果；否则返回undefined。
 * @param options.setSpecific - 针对特定属性的set处理函数。
 *   如果处理了该属性，应返回true/false；否则返回undefined。
 * @param [options.readOnlyCfg=true] - #cfg属性是否只读。
 * @returns {Proxy} - 返回一个Proxy实例。
 */
const proxy = (instance, options = {}) => {
	const {
		getSpecific = (self, prop, originalValue) => undefined,
		setSpecific = (target, prop, value, receiver, originalSet) => undefined, // 默认不处理特定set
		readOnlyCfg = true
	} = options;

	return new Proxy(instance, {
		get: (target, prop, receiver) => {
			const originalValue = Reflect.get(target, prop, receiver);
			//优先处理特定属性
			const specificResult = getSpecific(receiver, prop, originalValue);//receiver（Proxy对象）作为“this”
			if (specificResult !== undefined) {
				return specificResult;
			}
			// 或者在#cfg里找找
			if (prop in target.#cfg) {
				const value = target.#cfg[prop];
				return typeof value === 'object' ? {...value} : value; // 返回副本防止外部修改
			}
			return originalValue;
		},
		set: (target, prop, value, receiver) => {
			// 1. 优先处理特定属性 (如Skill的activateCount保护)
			const specificResult = setSpecific(target, prop, value, receiver, Reflect.set);
			if (specificResult !== undefined) { // 如果特定处理函数返回了结果，则使用它
				return specificResult;
			}
			// 2. 阻止修改#cfg属性
			if (readOnlyCfg && prop in target.#cfg) {
				console.error(`Cannot modify a read-only config property: ${prop}`);
				return false;
			}
			// 3. 允许设置实例自身属性或创建新属性
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
		return proxy(this);
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
		notice(this, 'team addMember start', {team: this, member});
		this.#members.push(member);
		notice(this, 'team addMember end', {team: this, member});
	}

	removeMember(member) {
		notice(this, 'team removeMember start', {team: this, member});
		this.#members = this.#members.filter(m => !compareWithId(m, member));
		notice(this, 'team removeMember end', {team: this, member});
	}

	get gaming() {
		return this.#gaming;
	}
}

// 泛化的getSpecific处理函数
const createGetSpecificFromAopMap = aopMap =>
	(self, prop, originalValue) => {
		const aopLogic = aopMap[prop];
		if (aopLogic) {
			if (typeof originalValue !== 'function') {
				return originalValue;
			}
			return (...args) => aopLogic.apply(self, [originalValue, args]);
		}
		return undefined;
	};


// 通用的activate方法AOP逻辑
const commonActivateAopLogic = async (self, originalActivate, args) => {
	const inputTargets = ensureArray(args[0]);
	const actualTargets = self.filterValidTargets(inputTargets);
	if (actualTargets.length === 0) {
		console?.warn(`技能 [${self.name}] 在提供的目标中没有找到任何合法目标，技能未发动。`);
		return false;
	}
	notice(self, 'skill activate start', {skill: self, targets: actualTargets});
	const result = await originalActivate.apply(self, [actualTargets, ...args.slice(1)]);
	if (result === false) {
		return false;
	}
	notice(self, 'skill activate end', {skill: self, targets: actualTargets});
	return true;
};

// 通用的filterValidTargets方法AOP逻辑
const commonFilterValidTargetsAopLogic = (self, originalFunc, args) => {
	const actualTargets = ensureArray(args[0]);
	notice(self, 'skill filterValidTargets start', {skill: self, targets: actualTargets});
	const rt = originalFunc.apply(self, [actualTargets, ...args.slice(1)]);
	notice(self, 'skill filterValidTargets end', {skill: self, targets: actualTargets, filteredTargets: rt});
	return rt;
};

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

		// 定义Skill特有的Proxy处理逻辑
		// 返回一个Proxy，用于动态地为activate方法织入AOP逻辑，并代理cfg属性
		return proxy(this, {
			getSpecific: createGetSpecificFromAopMap({
				'activate': commonActivateAopLogic,
				'filterValidTargets': commonFilterValidTargetsAopLogic
			})
		});
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
		// 先调用父类构造函数，获取 Skill 的 Proxy 实例
		const rawMe = super(cfg, owner);

		// 在 Skill 的 Proxy 实例之上，再应用一层 BuffSkill 特有的 Proxy
		const actualMe = proxy(rawMe, {
			getSpecific: createGetSpecificFromAopMap({
				'activate': async (self, originalActivate, args) => {
					// BuffSkill 的一次性激活 AOP 检查
					if (rawMe.#isActivated) {
						console?.warn(`BuffSkill [${self.name}] 已经激活过一次，不能再次主动使用。`);
						return false;
					}

					// 调用 Skill 层的 activate AOP (它会继续调用原始方法)
					const result = await commonActivateAopLogic(self, originalActivate, args);

					// BuffSkill 首次成功激活后，标记为已激活
					if (result === true && !rawMe.#isActivated) {
						rawMe.#isActivated = true;
					}
					return result;
				},
				'filterValidTargets': (self, originalFunc, args) => {
					// BuffSkill 的一次性激活 AOP 检查
					if (rawMe.#isActivated) { // Access rawMe.#isActivated
						console?.warn(`BuffSkill [${self.name}] 已经激活过一次，因此不返回任何合法目标。`);
						return []; // 阻止过滤，直接返回空数组
					}
					// 调用 Skill 层的 filterValidTargets AOP
					return commonFilterValidTargetsAopLogic(self, originalFunc, args);
				}
			})
		});

		// 注册监听器，确保在 BuffSkill 的 AOP 之后
		const activateAfterAddSkill = ({unit, skill}) => {
			if (compareWithId(actualMe.owner, unit) && compareWithId(actualMe, skill)) {
				// 1. 执行初始激活 (会通过AOP)
				actualMe.activate(actualMe.owner);
				// 2. 初始激活后，监听移除事件
				watch(actualMe, 'unit remove a skill end', ({unit, skill}) => {
					if (compareWithId(actualMe.owner, unit) && compareWithId(actualMe, skill)) {
						actualMe.deactivate();
					}
					unwatch(this, 'unit add skill end', activateAfterAddSkill);
				});
			}
		};
		watchersWatch(actualMe, {
			'unit add skill end': activateAfterAddSkill
		});

		return actualMe;
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
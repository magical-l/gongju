export {Team, Skill, PassiveSkill, BuffSkill};

/**
 * 工具方法：确保总是得到一个数组。
 * 如果参数是数组，直接返回；如果是非空值，封装成单元素数组；否则返回空数组。
 * @param value - 待处理的值。
 * @returns {Array} - 确保是数组的返回值。
 */
const ensureArray = value => Array.isArray(value) ? value : (value !== null && value !== undefined ? [value] : []);
const compareWithId = (a, b) => a === b || a.id && b.id && a.id === b.id;

/**
 * 创建一个AOP包装函数。
 * @param {function} rawFunc - 原始函数。
 * @param {object} options - 配置选项。
 * @param {function} [options.paramProcessor] - (可选) 用于处理原始参数的函数。它接收原始参数数组 `args` 和 `this` 上下文。
 *                                    它应该返回一个值，这个值将作为 `rawFunc` 的第一个参数。
 *                                    如果它返回 `undefined`，则表示不处理第一个参数，使用原始的 `args[0]`。
 *                                    如果它返回 `false`，则整个包装函数会立即返回 `false`，`rawFunc` 不会被执行。
 *                                    如果它返回其他非 `undefined` 的值，则该值将作为 `rawFunc` 的第一个参数。
 * @param {function} [options.beforeHook] - (可选) 在 `rawFunc` 执行前调用的函数。它接收 `this` 上下文和最终传递给 `rawFunc` 的参数数组。
 *                                    如果它返回一个非 `undefined` 的值，则该值将作为整个包装函数的最终返回值，`rawFunc` 不会被执行。
 * @param {function} [options.afterHook] - (可选) 在 `rawFunc` 执行后调用的函数。它接收 `this` 上下文、最终传递给 `rawFunc` 的参数数组和 `rawFunc` 的返回值。
 *                                    如果它返回一个非 `undefined` 的值，该值将作为整个包装函数的最终返回值。
 * @param {boolean} [options.isAsync=false] - (可选) 指示包装函数是否为异步。如果为 `true`，则包装函数将是 `async` 函数，并 `await` 所有钩子和 `rawFunc`。
 *                                    如果为 `false`，则包装函数将是同步函数，不使用 `await`。默认值为 `false`。
 * @returns {function} - 包装后的函数。
 */
const aop = (rawFunc, options) => {
	const {paramProcessor, beforeHook, afterHook, isAsync = false} = options;

	if (isAsync) {
		return async function(...args) {
			let finalFirstArg = args[0];
			let restArgs = args.slice(1);

			if (paramProcessor) {
				const processedResult = await paramProcessor.call(this, args);
				if (processedResult === false) { // 明确返回false
					return false;
				} else if (processedResult !== undefined) { // 如果paramProcessor返回了一个值，则将其作为rawFunc的新第一个参数
					finalFirstArg = processedResult;
				}
			}

			const argsForRawFunc = [finalFirstArg, ...restArgs];

			if (beforeHook) {
				const beforeHookResult = await beforeHook.call(this, argsForRawFunc);
				if (beforeHookResult !== undefined) { // 如果beforeHook返回了一个值，则将其作为最终结果并停止执行
					return beforeHookResult;
				}
			}

			const result = await rawFunc.apply(this, argsForRawFunc);

			if (afterHook) {
				const afterHookResult = await afterHook.call(this, argsForRawFunc, result);
				if (afterHookResult !== undefined) { // 如果afterHook返回了一个值，则将其作为最终结果
					return afterHookResult;
				}
			}

			return result;
		};
	} else { // 同步版本
		return function(...args) {
			let finalFirstArg = args[0];
			let restArgs = args.slice(1);

			if (paramProcessor) {
				const processedResult = paramProcessor.call(this, args);
				if (processedResult === false) { // 明确返回false
					return false;
				} else if (processedResult !== undefined) { // 如果paramProcessor返回了一个值，则将其作为rawFunc的新第一个参数
					finalFirstArg = processedResult;
				}
			}

			const argsForRawFunc = [finalFirstArg, ...restArgs];

			if (beforeHook) {
				const beforeHookResult = beforeHook.call(this, argsForRawFunc);
				if (beforeHookResult !== undefined) { // 如果beforeHook返回了一个值，则将其作为最终结果并停止执行
					return beforeHookResult;
				}
			}

			const result = rawFunc.apply(this, argsForRawFunc);

			if (afterHook) {
				const afterHookResult = afterHook.call(this, argsForRawFunc, result);
				if (afterHookResult !== undefined) { // 如果afterHook返回了一个值，则将其作为最终结果
					return afterHookResult;
				}
			}

			return result;
		};
	}
};

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
		this.activate = aop(rawActivate, {
			paramProcessor: originalArgs => { // 参数处理器
				const inputTargets = ensureArray(originalArgs[0]);
				const actualTargets = this.filterValidTargets(inputTargets);
				if (actualTargets.length === 0) {
					console?.warn(`技能 [${this.name}] 在提供的目标中没有找到任何合法目标，技能未发动。`);
					return false;
				}
				return actualTargets;
			},
			beforeHook: argsForRawFunc => { // 前置行为
				const actualTargets = argsForRawFunc[0];
				notice(this, 'skill activate start', {skill: this, targets: actualTargets});
			},
			afterHook: (argsForRawFunc, result) => {
				const actualTargets = argsForRawFunc[0];
				if (result === false) {
					return false;
				}
				notice(this, 'skill activate end', {skill: this, targets: actualTargets});
				return true;
			},
			isAsync: true
		});

		const rawFilterValidTargets = this.filterValidTargets;
		this.filterValidTargets = aop(rawFilterValidTargets, {
			paramProcessor: originalArgs => ensureArray(originalArgs[0]),
			beforeHook: argsForRawFunc => {
				const actualTargets = argsForRawFunc[0];
				notice(this, 'skill filterValidTargets start', {skill: this, targets: actualTargets});
			},
			afterHook: (argsForRawFunc, result) => {
				const actualTargets = argsForRawFunc[0];
				notice(this, 'skill filterValidTargets end', {skill: this, targets: actualTargets, filteredTargets: result});
			},
			isAsync: false
		});

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
		this.activate = aop(rawActivate, {
			beforeHook: argsForRawFunc => { // 前置行为
				if (this.#isActivated) {
					console?.warn(`BuffSkill [${this.name}] 已经激活过一次，不能再次主动使用。`);
					return false;
				}
				return undefined; // 继续执行
			},
			afterHook: (argsForRawFunc, result) => {
				if (result === true) {
					this.#isActivated = true;
				}
				return undefined; // 让包装器返回原始函数的结果
			},
			isAsync: true
		});

		const rawFilterValidTargets = this.filterValidTargets;
		this.filterValidTargets = aop(rawFilterValidTargets, {
			beforeHook: argsForRawFunc => { // 前置行为
				if (this.#isActivated) {
					console?.warn(`BuffSkill [${this.name}] 已经激活过一次，因此不返回任何合法目标。`);
					return []; // 返回空数组并停止执行原始函数
				}
				return undefined; // 继续执行
			}
		});
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
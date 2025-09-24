export {Skill, PassiveSkill};

let __teamId = 0;
let __skillId = 0;
const __instanceActivateCounts = new WeakMap();

/**
 * 工具方法：确保输入总是一个数组。
 * 如果输入是数组，直接返回；如果是非空值，封装成单元素数组；否则返回空数组。
 * @param {*} value - 待处理的值。
 * @returns {Array} - 确保是数组的返回值。
 */
const ensureArray = value => Array.isArray(value) ? value : (value ? [value] : []);

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

class Team {
	#id;
	#cfg;
	#players = [];
	#gaming;

	constructor(gaming, cfg) {
		this.#id = ++__teamId;
		this.#cfg = cfg;
		this.#gaming = gaming;

		return new Proxy(this, {
			get: (target, prop, receiver) => {
				// 1. 访问实例自身属性（包括getter，如id, gaming等）
				if (prop in target) {
					return Reflect.get(target, prop, receiver);
				}
				// 2. 访问#cfg属性
				if (prop in target.#cfg) {
					const value = target.#cfg[prop];
					return typeof value === 'object' ? {...value} : value; // 返回副本防止外部修改
				}
				return undefined;
			},
			set: (target, prop, value, receiver) => {
				// 阻止修改#cfg属性
				if (prop in target.#cfg) {
					console.error(`Cannot modify a read-only config property: ${prop}`);
					return false;
				}
				// 允许设置实例自身属性或创建新属性
				return Reflect.set(target, prop, value, receiver);
			},
			has: (target, prop) => {
				return prop in target
							 || prop in target.#cfg;
			},
			ownKeys: target => {
				// 返回所有可访问的属性键
				return [
					...Reflect.ownKeys(target),
					...Object.keys(target.#cfg)
				];
			},
			getOwnPropertyDescriptor: (target, prop) => {
				if (prop in target.#cfg) {
					return {
						value: target.#cfg[prop],
						writable: false,
						enumerable: true,
						configurable: false
					};
				}
				return Reflect.getOwnPropertyDescriptor(target, prop);
			}
		});
	}

	get id() {
		return this.#id;
	}

	get players() {
		return [...this.#players];
	}

	get gaming() {
		return this.#gaming;
	}
}

class Skill {
	#id;
	#owner;
	#cfg;

	constructor(cfg, owner) {
		this.#id = ++__skillId;
		this.#cfg = cfg;
		this.#owner = owner;
		__instanceActivateCounts.set(this, 0); // 在构造时初始化当前实例的计数

		// 返回一个Proxy，用于动态地为activate方法织入AOP逻辑，并代理cfg属性
		return new Proxy(this, {
			get: (target, prop, receiver) => {
				// 如果是访问activate方法，则动态织入AOP逻辑
				if (prop === 'activate') {
					const originalActivate = Reflect.get(target, prop, receiver); // 获取原型链上最具体的activate方法

					// 如果不是函数，直接返回
					if (typeof originalActivate !== 'function') {
						return originalActivate;
					}

					// 返回一个包裹了AOP逻辑的新函数
					return async function(...args) {
						const self = this; // 确保this指向Proxy实例
						const inputTargets = ensureArray(args[0]);

						// 1. 调用filterValidTargets获取实际的合法目标列表
						const actualTargets = self.filterValidTargets(inputTargets);

						// 2. 如果没有合法目标，则技能不发动
						if (actualTargets.length === 0) {
							console.warn(`技能 [${self.name}] 在提供的目标中没有找到任何合法目标，技能未发动。`);
							return false;
						}

						// 3. 前置通知 (AOP前置)，通知中包含的是实际将要作用的目标
						self.gaming?.bulletin.notice('unit activating a skill',
							{unit: self.owner, skill: self, targets: actualTargets});

						// 4. 调用原始的activate方法，只传入合法目标作为第一个参数
						const result = await originalActivate.apply(self, [actualTargets, ...args.slice(1)]);

						// 5. 检查结果并执行后置AOP
						if (result === false) {
							return false;
						}

						// 6. 递增计数 (AOP后置)
						__instanceActivateCounts.set(self, __instanceActivateCounts.get(self) + 1);

						// 7. 后置通知 (AOP后置)
						self.gaming?.bulletin.notice('unit activated a skill',
							{unit: self.owner, skill: self, targets: actualTargets});

						return true;
					}.bind(receiver); // 关键：将包裹函数绑定到Proxy实例，确保this上下文正确
				}

				// 其他属性的访问：优先访问实例自身属性，然后是#cfg属性
				// 1. 访问实例自身属性（包括getter，如id, owner, gaming等）
				if (prop in target) {
					return Reflect.get(target, prop, receiver);
				}
				// 2. 访问#cfg属性
				if (prop in target.#cfg) {
					const value = target.#cfg[prop];
					return typeof value === 'object' ? {...value} : value; // 返回副本防止外部修改
				}
				return undefined;
			},
			set: (target, prop, value, receiver) => {
				// 阻止直接设置activateCount，它由内部管理，且是只读getter
				// if (prop === 'activateCount') {
				// 	console.warn('Cannot directly set activateCount. It is managed internally and is a read-only property.');
				// 	return false;
				// }
				// 阻止修改#cfg属性
				if (prop in target.#cfg) {
					console.error(`Cannot modify a read-only config property: ${prop}`);
					return false;
				}
				// 允许设置实例自身属性或创建新属性
				return Reflect.set(target, prop, value, receiver);
			},
			has: (target, prop) => {
				return prop in target
							 || prop in target.#cfg;
			},
			ownKeys: target => {
				// 返回所有可访问的属性键
				return [
					...Reflect.ownKeys(target),
					...Object.keys(target.#cfg)
				];
			},
			getOwnPropertyDescriptor: (target, prop) => {
				if (prop in target.#cfg) {
					return {
						value: target.#cfg[prop],
						writable: false,
						enumerable: true,
						configurable: false
					};
				}
				return Reflect.getOwnPropertyDescriptor(target, prop);
			}
		});
	}

	/**
	 * 技能的核心效果。子类应重写此方法。
	 * 此方法只包含纯粹的技能逻辑，不包含任何AOP相关的通知、校验或计数。
	 * @param {Array<Object>} targets - 经过filterValidTargets过滤后的合法目标数组。
	 * @returns {boolean} - 返回true表示成功，false表示失败。
	 */
	async activate(targets) {
		// 基类默认无效果，直接成功
		return true;
	}

	/**
	 * 获取所有潜在的可用目标。子类应重写此方法以提供具体的寻目标逻辑。
	 * @returns {Array<Object>} - 潜在目标对象的数组。
	 */
	get potentialTargets() {
		// 默认实现，例如返回空数组，或只返回自身
		return [];
	}

	/**
	 * 过滤传入的目标列表，返回其中合法的目标。子类可重写以提供更复杂的过滤规则。
	 * @param {Array<Object>} targets - 待过滤的目标数组。
	 * @returns {Array<Object>} - 过滤后的合法目标数组。
	 */
	filterValidTargets(targets) {
		const processedTargets = ensureArray(targets);
		const potential = this.potentialTargets; // 获取所有潜在的合法目标
		// 默认实现：检查传入的每个目标是否在potentialTargets列表中
		// 使用.some()进行对象比较，以防对象引用不同但内容相同的情况（如果目标有唯一ID）
		return processedTargets.filter(t => potential.some(p => p === t || p.id && p.id === t.id));
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
		return __instanceActivateCounts.get(this);
	}
}

/**
 * 被动技。被动技是不需要游戏主流程主动触发的技能。所以单位获得被动技时就会触发，且只触发一次。
 * @type {PassiveSkill}
 */
const PassiveSkill = class extends Skill {
	constructor(cfg, owner) {
		super(cfg, owner);

		// 1. 执行初始激活 (会通过AOP)
		// 此时，PassiveSkill.prototype.filterValidTargets会被调用，它需要允许owner通过
		this.activate(owner);

		// 2. 初始激活后，立即覆盖filterValidTargets，以阻止后续的主动使用
		this.filterValidTargets = targets => {
			console.warn(`被动技能 [${this.name}] 不能被主动使用，因此不返回任何合法目标。`);
			return [];
		};

		this.gaming?.bulletin.watch('unit lost a skill', ({unit, skill}) => {
			if (unit.id === this.owner.id && skill.id === this.id) {
				this.deactivate();
			}
		});
	}

	/**
	 * 被动技能的核心效果。通常被动技能不通过activate方法主动触发效果。
	 * 如果有需要，子类可以重写此方法，但它不会被主动调用。
	 * @param {Array<Object>} targets - 经过filterValidTargets过滤后的合法目标数组。
	 * @returns {boolean} - 返回true表示成功，false表示失败。
	 */
	async activate(targets) {
		return true;
	}

	/**
	 * 被动技能的filterValidTargets实现。
	 * 在构造函数中调用activate时，它需要允许owner通过。
	 * 之后，它会被覆盖以阻止主动使用。
	 * @param {Array<Object>} targets - 待过滤的目标数组。
	 * @returns {Array<Object>} - 过滤后的合法目标数组。
	 */
	filterValidTargets(targets) {
		// 默认情况下，被动技能的初始激活只针对自身owner
		const processedTargets = Skill.__ensureArray(targets);
		return processedTargets.filter(t => t === this.owner);
	}

	/**
	 * 技能失效。主人失去本技能时会被触发，移除本技能给主人附加的效果。
	 * 默认实现无事发生。
	 * @returns {Promise<void>}
	 */
	async deactivate() {
	}
};

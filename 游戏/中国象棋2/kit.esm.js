export {
	getClassHierarchy, ensureArray, compareWithId,
	watch, watchersWatch, unwatch, notice,
	proxy, aopMethod, aopAsyncMethod, aopGetter,
	Bulletin,
};
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
const aopAsyncMethod = (self, methodName,
												options = {argsResolver: undefined, noticePayloadBuilder: undefined, typeName: ''}) => {
	const {argsResolver, noticePayloadBuilder, typeName} = options;
	const rawMethod = self[methodName];
	self[methodName] = async (..._args_) => {
		//可以额外地先处理参数，比如把单个对象包装成数组
		const args = argsResolver ? argsResolver(_args_) : _args_;
		//获取继承链中的顶级父类的名字，也可以通过typeName自行指定。用于通知主题的主语。
		const typeName_ = typeName ?? getClassHierarchy(self).at(-1);

		const noticePayload = noticePayloadBuilder ? noticePayloadBuilder(args) : {};
		noticePayload[typeName_] = self;//通知内容里加入主语
		notice(self, typeName_ + ' ' + methodName + ' start', noticePayload);

		const result = await rawMethod.apply(self, args);//执行写在代码里的原始方法代码

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

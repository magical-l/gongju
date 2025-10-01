export {
	getClassHierarchy, ensureArray, compareWithId,
	watch, watchersWatch, unwatch, notice,
	addCfgProps, aopMethod, aopAsyncMethod, aopGetter,
	Bulletin,
};
/**
 * 获取实例的完整类继承链的类名列表。默认为从该类到其祖先类。
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
const watch = (gamingPart, topic, callback, options) => gamingPart.gaming?.bulletin.watch(topic, callback, options);
const watchersWatch = (gamingPart, watchers, options) => {
	if (watchers) {
		Object.entries(watchers).forEach(([topic, callback]) => watch(gamingPart, topic, callback, options));
	}
};
const unwatch = (gamingPart, topic, callback) => gamingPart.gaming?.bulletin.unwatch(topic, callback);
const notice = (gamingPart, topic, payload, options) => gamingPart.gaming?.bulletin.notice(topic, payload, options);

const addCfgProps = (instance, privateCfg) => {
	if (!privateCfg) {
		return;
	}
	for (const key in privateCfg) {
		if (!(key in instance)) {
			Object.defineProperty(instance, key, {
				get: () => privateCfg[key],
				enumerable: true,
				configurable: true,
			});
		}
	}
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
		const typeName_ = typeName ?? getClassHierarchy(self).at(-1).toLowerCase();

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
		const typeName_ = typeName ?? getClassHierarchy(self).at(-1).toLowerCase();

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

	// 1. 沿着原型链向上查找，直到找到属性描述符为止
	let descriptor;
	let proto = self;
	while (proto && !descriptor) {
		descriptor = Object.getOwnPropertyDescriptor(proto, propertyName);
		proto = Object.getPrototypeOf(proto);
	}

	// 2. 检查是否确实是一个 getter
	if (!descriptor || !descriptor.get) {
		console?.warn(`属性 '${propertyName}' 在实例上不是一个 getter 或不存在，无法应用 aopGetter。`);
		return;
	}

	const originalGetter = descriptor.get; // 获取原始的 getter 函数

	// 3. 重新定义该属性的 getter
	Object.defineProperty(self, propertyName, {
		get: function() {
			const typeName_ = typeName ?? getClassHierarchy(this).at(-1);
			const noticePayload = noticePayloadBuilder ? noticePayloadBuilder(self) : {};
			noticePayload[typeName_] = self;

			notice(this, typeName_ + ' get ' + propertyName + ' start', noticePayload);

			const result = originalGetter.call(this);

			noticePayload.result = result;
			notice(this, typeName_ + ' get ' + propertyName + ' end', noticePayload);
			return result;
		},
		configurable: descriptor.configurable,
		enumerable: descriptor.enumerable,
	});
};

/**
 * 公告栏(事件总线)，用于发布通知。同时也提供订阅、不再订阅的功能。
 */
class Bulletin {
	_listeners = {};
	get listeners() { return this._listeners; }

	_historyNotices = [];
	get historyNotices() { return this._historyNotices; }

	_topicMatchesPattern(topic, pattern) {
		if (pattern.includes('*')) {
			const regex = new RegExp(`^${pattern.replace(/\*/g, '.*?')}$`);
			return regex.test(topic);
		}
		return topic === pattern;
	}

	/**
	 * 订阅一个主题
	 * @param {string} topic 主题名，支持'*'通配符
	 * @param {Function} watcher 订阅者（回调函数）
	 * @param options
	 */
	watch(topic, watcher, options = {watchHistory: true}) {
		// 正常注册，用于接收未来事件
		(this._listeners[topic] = this._listeners[topic] || []).push(watcher);

		// 检查历史事件并立即“回溯”
		if (options.watchHistory) {
			this._historyNotices
				.filter(notice => this._topicMatchesPattern(notice.topic, topic))
				.forEach(event => watcher(event.payload));
		}
	}

	/**
	 * 取消订阅一个主题
	 * @param {string} topic 主题名
	 * @param {Function} watcher 订阅者（回调函数）
	 */
	unwatch(topic, watcher) {
		if (this._listeners[topic]) {
			this._listeners[topic] = this._listeners[topic].filter(i => i !== watcher);
		}
	}

	/**
	 * 发出一个通知
	 * @param {string} topic 主题名
	 * @param {object} payload 事件荷载
	 * @param {object} options 配置项，{ replayable: boolean }，默认为false
	 */
	notice(topic, payload = {}, options = {replayable: true}) {
		console?.log('通知：', topic, payload);
		if (options.replayable) {
			this._historyNotices.push({topic, payload});
		}

		Object.keys(this._listeners).forEach(pattern => {
			if (this._topicMatchesPattern(topic, pattern)) {
				this._listeners[pattern].forEach(cb => cb(payload));
			}
		});
	}
}

import {
	addCfgProps, aopAsyncMethod, aopGetter, aopMethod, Bulletin, compareWithId, ensureArray, lowerFirstLetter, notice,
	unwatch, watch, watchersWatch,
} from './kit.esm.js';

export {
	TurnBasedGame, TurnBasedGaming, Module, Plugin, Rule, Situation,
	SkillHolder, Skill, PassiveSkill, BuffSkill,
	Player, PlayerTurn, Round,
	Command, SelectSkillCommand, SelectTargetCommand, EndTurnCommand,
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
	_modules = [];
	_situation;
	get situation() { return this._situation; }

	_playerTurnSequence = [];
	get playerTurnSequence() { return [...this._playerTurnSequence]; }

	_playersIdMap = {};
	get playersIdMap() { return {...this._playersIdMap}; }

	get gaming() { return this; }

	_isCollectingChanges = false;
	_changeLog = [];

	constructor(cfg) {
		this._cfg = cfg;
		addCfgProps(this, this._cfg);
		this._isProcessingInput = false;
	}

	startChangeCollection() {
		this._changeLog = [];
		this._isCollectingChanges = true;

	}

	stopChangeCollection() {
		this._isCollectingChanges = false;

		return this._changeLog;
	}

	collectChange(change) {
		if (this._isCollectingChanges) {
			this._changeLog.push(change);
		}
	}

	build() {
		notice(this, 'gaming build start', {gaming: this});
		//规则、插件通常是注册一些监听器
		this._globalRules = this._buildGlobalRules();
		this._plugins = this._buildPlugins();
		this._plugins.forEach(plugin =>
			plugin.watchers && Object.entries(plugin.watchers)
															 .forEach(
																 ([topicName, watcher]) => this.bulletin.watch(topicName, watcher.bind(plugin))));
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

	async start() {
		this.bulletin.watch('game over', ({winner}) => {
			this.situation.isEnded = true;
			this.situation.winner = winner;
		});

		// 监听输入并直接调用当前玩家的play方法
		this.bulletin.watch('ui input', async input => {
			if (this.situation.isEnded || this._isProcessingInput) {
				return;
			}

			// 检查是否是特殊控制动作
			if (input?.action === 'INTERRUPT_TURN') {
				return;
			}

			// 普通输入：直接调用当前玩家的play方法
			if (this.situation.curPlayer) {
				this._isProcessingInput = true;
				try {
					await this._handlePlayerInput(input);
				} finally {
					this._isProcessingInput = false;
				}
			}
		});

		// 启动游戏
		this.situation.isStarted = true;
		notice(this, 'gaming start', {gaming: this});

		// 开始第一个回合
		await this.situation.startRound();
	}

	async _handlePlayerInput(input) {
		if (!this.situation.curPlayer) {
			return;
		}

		const player = this.situation.curPlayer;

		// 调用玩家的play方法处理输入
		const actionPerformed = await player.play(input);

		// 如果玩家完成了行动，检查是否需要轮转
		if (actionPerformed) {
			await this._checkTurnEnd(player);
		}
	}

	async _checkTurnEnd(currentPlayer) {
		const currentIndex = this.playerTurnSequence.findIndex(p => p.id === currentPlayer.id);
		notice(this, 'playerTurn end', {player: currentPlayer});

		if (this.situation.isEnded) {
			return;
		}

		// 检查是否是最后一个玩家
		if (currentIndex === this.playerTurnSequence.length - 1) {
			// 是，则代表回合结束
			notice(this, 'round end', {roundIndex: this.situation.currentRoundIndex});
			// 开始新回合（内部会增加回合数并从第一个玩家开始）
			await this.situation.startRound();
		} else {
			// 否，则轮到下一个玩家
			const nextPlayer = this.playerTurnSequence[currentIndex + 1];
			this.situation.curPlayer = nextPlayer;
			nextPlayer.prepareForNewTurn();
			notice(this, 'playerTurn start', {player: nextPlayer});
		}
	}

	waitForInput() {
		return new Promise(resolve => {
			const onInput = payload => {
				unwatch(this, 'ui input', onInput);

				// 检查是否是特殊控制动作
				if (payload?.action === 'INTERRUPT_TURN') {
					resolve(payload);
					return;
				}

				// 一般情况：转发为 player adapter input
				notice(this, 'player adapter input', payload);
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

	_historyRoot; // 历史树的根节点
	_currentNode; // 指向当前状态的节点

	_currentRound;
	get currentRound() { return this._currentRound; }
	get currentRoundIndex() { return this._currentRound?.index ?? 0; }

	_curPlayer;
	get curPlayer() { return this._curPlayer; }
	set curPlayer(player) {
		if (this._curPlayer === player) {
			return;
		}
		const payload = {player: player, oldPlayer: this._curPlayer};
		notice(this,'situaton set curPlayer start', payload);
		this._curPlayer = player;
		notice(this,'situaton set curPlayer end', payload);
	}

	isStarted = false;
	isEnded = false;
	winner;

	constructor(gaming) {
		this._gaming = gaming;
		this._historyRoot = new HistoryNode(null); // 根节点不包含任何轮次信息
		this._currentNode = this._historyRoot;
	}

	async startRound() {
		const newRoundIndex = this.currentRoundIndex + 1;
		const round = new Round(this.gaming, newRoundIndex);
		this._currentRound = round;
		await round.start();
	}

	recordTurn(player, actions) {
		const playerTurn = new PlayerTurn(this.currentRoundIndex, player, actions);
		const newNode = new HistoryNode(playerTurn, this._currentNode);
		this._currentNode.children.push(newNode);
		this._currentNode = newNode;
		return newNode;
	}

	rewind(steps = 1) {
		let moved = 0;
		for (let i = 0; i < steps; i++) {
			if (this._currentNode.parent) {
				const undoneTurn = this._currentNode.data;
				this._currentNode = this._currentNode.parent;
				// 框架层提供完整的轮次信息，包括变更记录
				notice(this, 'history-step-rewind', {
					turn: undoneTurn,
					changes: undoneTurn?.changes || [],
					success: undoneTurn?.success || false,
				});
				moved++;
			} else {
				break; // 到达根节点
			}
		}
		if (moved > 0) {
			notice(this, 'history-navigation-end', {
				to: this._currentNode.data,
				stepsMoved: moved,
			});
		}
		return this._currentNode;
	}

	fastForward({branchIndex = 0, steps = 1} = {}) {
		let moved = 0;
		for (let i = 0; i < steps; i++) {
			const targetNode = this._currentNode.children[branchIndex];
			if (targetNode) {
				this._currentNode = targetNode;
				// 框架层提供完整的轮次信息，包括变更记录
				this.gaming.bulletin.notice('history-step-fastforward', {
					turn: this._currentNode.data,
					changes: this._currentNode.data?.changes || [],
					success: this._currentNode.data?.success || false,
				});
				moved++;
			} else {
				break; // 没有更多子节点
			}
		}
		if (moved > 0) {
			notice(this, 'history-navigation-end', {
				to: this._currentNode.data,
				gaming: this.gaming,
				stepsMoved: moved,
			});
		}
		return this._currentNode;
	}

	canRewind() {
		return this._currentNode && !!this._currentNode.parent;
	}

	canFastForward() {
		return this._currentNode && this._currentNode.children.length > 0;
	}
}

class HistoryNode {
	constructor(playerTurn, parent = null) {
		this.data = playerTurn; // PlayerTurn 对象, 或者 null (对于根节点)
		this.parent = parent;
		this.children = [];
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
	 * 开始一个回合
	 */
	async start() {
		this.gaming.bulletin.notice('round start', {roundIndex: this.index});
		// 设置回合的第一个玩家
		if (this.gaming.playerTurnSequence.length > 0) {
			const firstPlayer = this.gaming.playerTurnSequence[0];
			this.gaming.situation.curPlayer = firstPlayer;
			firstPlayer.prepareForNewTurn(); // 重置第一个玩家的行动计数
			this.gaming.bulletin.notice('playerTurn start', {player: firstPlayer});
		}
	}
}

class PlayerTurn {
	_roundIndex;
	_player;
	_actions; // Array of {command, result}
	_timestamp;
	_notation = null;

	get roundIndex() { return this._roundIndex; }

	get player() { return this._player; }

	get actions() { return this._actions; }

	get timestamp() { return this._timestamp; }

	constructor(roundIndex, player, actions) {
		this._roundIndex = roundIndex;
		this._player = player;
		this._actions = actions;
		this._timestamp = Date.now();
	}

	/**
	 * 获取此轮次所有行动产生的变更记录
	 */
	get changes() {
		return this._actions.flatMap(a => a.result?.changes || []);
	}

	/**
	 * 获取此轮次是否成功（至少有一个行动成功）
	 */
	get success() {
		return this._actions.some(a => a.result?.actionsConsumed > 0);
	}

	/**
	 * 获取此轮次所有行动的命令
	 */
	get commands() {
		return this._actions.map(a => a.command);
	}

	/**
	 * 获取此轮次的记谱信息
	 */
	get notation() {
		return this._notation;
	}

	/**
	 * 设置记谱信息
	 */
	setNotation(notation) {
		this._notation = notation;
	}
}

class Command {
	constructor(player) { this.player = player; }

	async execute() { return {actionsConsumed: 0, changes: []}; }
}

class SelectSkillCommand extends Command {
	constructor(player, skills) {
		super(player);
		this.skills = skills;
	}

	async execute() {
		this.player.selectSkills(this.skills);
		return {actionsConsumed: 0, changes: []};
	}
}

class SelectTargetCommand extends Command {
	constructor(player, targets) {
		super(player);
		this.targets = targets;
	}

	async execute() {
		this.player.selectTargets(this.targets);
		const gaming = this.player.gaming;
		gaming.startChangeCollection();
		const success = await this.player.activateSkills();
		const changes = gaming.stopChangeCollection();
		return {actionsConsumed: success ? 1 : 0, changes};
	}
}

class EndTurnCommand extends Command {
	constructor(player) { super(player); }
}

const SkillHolder = {
	_initializeSkills(cfg) {
		aopMethod(this, 'addSkill', {
			noticePayloadBuilder: args => ({skillHolder: this, skill: args[0]}),
		});
		aopMethod(this, 'removeSkill', {
			noticePayloadBuilder: args => ({skillHolder: this, skill: args[0]}),
		});

		const skills = this._buildSkills(cfg.skills || []);
		skills.forEach(skill => this.addSkill(skill));
	},

	_isAvailable: true,
	get isAvailable() {
		return this._isAvailable;
	},
	set isAvailable(value) {
		if (this._isAvailable === value) {
			return;
		}
		this._isAvailable = value;
		notice(this, 'skillHolder set isAvailable', {skillHolder: this, isAvailable: value});
	},

	_buildSkills(skillsCfg) {
		const owner = this;
		const typeName = lowerFirstLetter(this.constructor.name);
		notice(this, `${typeName} buildSkills start`, {owner, skillsCfg});
		const rt = skillsCfg.map(skillCfg => this._buildSkill(skillCfg));
		notice(this, `${typeName} buildSkills end`, {rt});
		return rt;
	},

	_buildSkill(skillCfg) {
		const typeName = lowerFirstLetter(this.constructor.name);
		const SkillClass = skillCfg.class ?? this.gaming.cfg.SkillClass ?? Skill;
		notice(this, `${typeName} buildSkill start`, {owner: this, skillCfg, class: SkillClass});
		const rt = new SkillClass({...skillCfg, owner: this});
		notice(this, `${typeName} buildSkill end`, {skill: rt});
		return rt;
	},

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
	},

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
	},
};

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
		this._actionsTakenThisTurn = 0;
		this._currentTurnActions = [];

		addCfgProps(this, this._cfg);

		aopMethod(this, 'selectSkills', {
			noticePayloadBuilder: args => ({skillHolder: this, skills: args[0]}),
		});
		aopMethod(this, 'selectTargets', {
			noticePayloadBuilder: args => ({skillHolder: this, targets: args[0]}),
		});

		aopMethod(this, 'play');

		this._initializeSkills(cfg);

	}

	prepareForNewTurn() {
		this._actionsTakenThisTurn = 0;
	}

	/**
	 * 玩家玩游戏。在回合制游戏里，玩家在自己的轮次里施放技能。
	 * 默认实现：执行N次有效行动后（N由actionsPerTurn决定），本轮次结束。
	 */
	async play(input) {
		// 如果没有输入，返回false表示没有行动
		if (!input) {
			return false;
		}

		// 检查是否是结束轮次
		if (input?.action === 'END_TURN') {
			return true; // 主动结束轮次
		}

		// 处理输入
		const command = this.interpretInput(input);
		if (!command) {
			return false;
		}

		if (command instanceof EndTurnCommand) {
			return true; // 主动结束轮次
		}

		const result = await command.execute();
		this._currentTurnActions.push({ command, result });
		const actionsConsumed = result.actionsConsumed || 0;

		if (actionsConsumed > 0) {
			this.selectedTargets = []; // 成功行动后，清空目标
			this._actionsTakenThisTurn += actionsConsumed; // 增加已执行行动计数
		}

		// 判断是否结束本轮次：
		// 1. 玩家主动选择结束轮次 (已在上面处理)
		// 2. 玩家已执行的行动次数达到或超过了本轮次允许的最大行动次数
		const turnShouldEnd = (actionsConsumed > 0) && this._actionsTakenThisTurn >= this.actionsPerTurn;

		if (turnShouldEnd) {
			this.gaming.situation.recordTurn(this, this._currentTurnActions);

			// 为下个回合做准备
			this._currentTurnActions = [];
			this.selectedSkills = []; // 回合结束时清空选中的技能
		}

		return turnShouldEnd;
	}

	/**
	 * 将用户的原始输入（比如点击）解释为具体的游戏指令（Command）。
	 * 子类或模块可以重写此方法以支持更复杂的输入，例如选择单位。
	 * @param {any} input 用户的原始输入
	 * @returns {Command|null}
	 */
	interpretInput(input) {
		const eventPayload = {player: this, input: input, command: null};
		notice(this.gaming, 'interpret-input-request', eventPayload);

		if (eventPayload.command) {
			return eventPayload.command;
		}

		const inputs = ensureArray(input);
		if (inputs.length === 0) {
			return null;
		}
		const firstItem = inputs[0];

		if (firstItem instanceof Skill) {
			return new SelectSkillCommand(this, inputs);
		} else {
			return new SelectTargetCommand(this, inputs);
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
		return skills.filter(s => this.skills.includes(s) && s.isOwnerActive());
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
			// 检查技能拥有者是否活跃
			if (!skill.isOwnerActive()) {
				console?.warn(`技能 [${skill.id}] 的拥有者不活跃，无法激活。`);
				continue; // 跳过不活跃拥有者的技能
			}
			// 触发技能，并将目标传入
			activated = activated || await skill.activate(this.selectedTargets);
		}
		return activated;
	}

	isReadyToActivateSkills() {
		return this.selectedSkills?.length && this.selectedTargets?.length;
	}
}

Object.assign(Player.prototype, SkillHolder);

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

	/**
	 * 检查技能的拥有者（通常是游戏中的某个单位或棋子）是否处于活跃状态，
	 * 即是否可以被激活。子类可以重写此方法以提供具体的检查逻辑。
	 * 默认实现：总是返回 true。
	 * @returns {boolean} - 如果拥有者活跃，则返回 true；否则返回 false。
	 */
	isOwnerActive() {
		// 检查技能拥有者（SkillHolder）是否可用
		return this.owner?.isAvailable ?? false;
	}

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

class BuffSkill extends PassiveSkill {
	_isActivated = false;

	constructor(cfg, owner) {
		super(cfg, owner);

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

		const activateAfterAddSkill = ({skillHolder, skill}) => {
			if (compareWithId(this.owner, skillHolder) && compareWithId(this, skill)) {
				this.activate(this.owner);
				watch(this, '* removeSkill end', ({unit, skill}) => {
					if (compareWithId(this.owner, unit) && compareWithId(this, skill)) {
						this.deactivate();
						unwatch(this, '* addSkill end', activateAfterAddSkill);
					}
				});
			}
		};
		watchersWatch(this, {
			'* addSkill end': activateAfterAddSkill,
		});
	}

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
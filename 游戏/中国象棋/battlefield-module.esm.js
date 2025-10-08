import {addCfgProps, aopMethod, compareWithId, ensureArray, notice, watch} from './kit.esm.js';
import {Module, Player, SelectTargetCommand, Skill, TurnBasedGaming} from './turn-based-game.esm.js';
import {SelectUnitCommand, Unit, UnitModule} from './unit-module.esm.js';

export {
	BattlefieldBasedGaming, Battlefield, Position, BattlefieldModule,
	Board, 棋盘点位, Move, Attack,
};

/**
 * 位置的抽象基类。强制子类实现toString()，用于在Map中作为唯一的key。
 */
class Position {
	get id() { return this.toString(); }

	toString() { throw new Error("子类必须实现toString()"); }

	isEqualTo(otherPosition) { return otherPosition && this.toString() === otherPosition.toString(); }
}

/**
 * 战场。主要是地图、环境、单位等的实时情况。
 */
class Battlefield {
	_cfg;
	_gaming;
	get gaming() { return this._gaming; }

	_positions = [];
	get positions() { return [...this._positions]; }

	_positionUnitsMapping = new Map(); // Map<Position的key, Unit[]>
	_unitsById = new Map();

	get allUnitsInBattlefield() { return [...this._unitsById.values()]; }

	_unitPositionMapping = new Map();

	constructor(gaming, cfg = {}) {
		this._gaming = gaming;
		this._cfg = cfg;

		addCfgProps(this, this._cfg);

		aopMethod(this, 'addUnitToPosition', {
			noticePayloadBuilder: args => ({unit: args[0], position: args[1]}),
		});
		aopMethod(this, 'removeUnitFromPosition', {
			noticePayloadBuilder: args => ({unit: args[0], position: args[1]}),
		});
		// aopMethod(this, 'getUnitsAt', {//这个调用太频繁了，不发通知了。
		// 	noticePayloadBuilder: args => ({position: args[0]}),
		// });
		aopMethod(this, 'destroyUnit', {
			noticePayloadBuilder: args => ({unit: args[0]}),
		});
		aopMethod(this, 'moveUnit', {
			noticePayloadBuilder: args => ({unit: args[0], from: args[0].position, to: args[1]}),
		});

		this._positions = this._buildPositions(cfg); // 显式地从配置中初始化 positions
		this._initPositionUnitsMapping();
	}

	_buildPositions(cfg) {
		return cfg.positions || [];
	}

	_initPositionUnitsMapping() {
		this._positions.flat().forEach(p => this._positionUnitsMapping.set(p.toString(), []));
	}

	initUnitsPositions() {
		const unitsPositionCfg = this._cfg.unitsPositionCfg;
		if (!unitsPositionCfg) {
			return [];
		}

		notice(this, 'battlefield initUnitsPositions start', {unitsPositionCfg});

		const createdUnits = [];

		Object.entries(unitsPositionCfg)
					.forEach(([positionDescription, unitTypeName]) => {
						const unitType = this.gaming.unitTypes[unitTypeName];
						if (!unitType) {
							console.warn(`Unknown unit type name: ${unitTypeName}`);
							return;
						}

						const player = this.gaming.playersIdMap[unitType.player];
						if (!player) {
							console.warn(`Could not find player for unit type: ${unitTypeName}`);
							return;
						}

						const unit = this._buildUnit(player, {name: unitTypeName, ...unitType});
						const position = this.toPosition(positionDescription);

						if (unit && position) {
							this.addUnitToPosition(unit, position);
							createdUnits.push(unit);
						}
					});

		notice(this, 'battlefield initUnitsPositions end', {createdUnits});
	}

	_buildUnit(owner, unitCfg) {
		const UnitClass = unitCfg.class ?? this.gaming.cfg.UnitClass ?? Unit;
		notice(this, 'buildUnit start', {unitCfg, class: UnitClass});

		const unitType = this.gaming.unitTypes[unitCfg.name];
		const unit = new UnitClass({owner, ...unitType, ...unitCfg});
		notice(this, 'buildUnit end', {unit: unit});
		return unit;
	}

	/**
	 * 默认实现：尝试把参数解析为数值，当成this.positions的坐标。兜底返回第一个坐标。
	 * @param positionDescription
	 * @returns {*}
	 */
	toPosition(positionDescription) {
		// 默认实现：查找其字符串表示与描述匹配的位置。
		// 子类可以提供更具体的解析逻辑。
		return this.positions.find(p => p.toString() === positionDescription);
	}

	moveUnit(unit, toPosition) {
		this.removeUnitFromPosition(unit);
		this.addUnitToPosition(unit, toPosition);
	}

	destroyUnit(unit) { this.removeUnitFromPosition(unit); }

	addUnitToPosition(unit, position) {
		if (!this._positionUnitsMapping.has(position.id)) {
			this._positionUnitsMapping.set(position.id, []);
		}
		this._positionUnitsMapping.get(position.id).push(unit);
		this._unitPositionMapping.set(unit.id, position);
		this._unitsById.set(unit.id, unit);
	}

	removeUnitFromPosition(unit, position = unit.position) {
		if (!unit.position) {
			return;
		}
		const unitsAtPos = this._positionUnitsMapping.get(unit.position.id);
		if (unitsAtPos) {
			const index = unitsAtPos.indexOf(unit);
			if (index > -1) {
				unitsAtPos.splice(index, 1);
				this._unitPositionMapping.delete(unit.id);
				this._unitsById.delete(unit.id);
			}
		}
	}

	getUnitsAt(position) { return this._positionUnitsMapping.get(position.id) || []; }

	getUnitById(id) { return this._unitsById.get(id); }

	getPositionOfUnit(unit) { return this._unitPositionMapping.get(unit.id); }

	/**
	 * 移除出界的位置。
	 */
	keepValidPositions(positions) { return positions.filter(p => this._positions.some(p2 => compareWithId(p, p2))); }

	//todo：需要增加许多关于位置的方法。比如计算两个单位的距离、获取距离某个单位为x的位置集……
}

class BattlefieldModule extends Module {
	get watchers() {
		return {
			'player interpretInput start': (payload) => {
				const {player, input, command} = payload;
				if (command) {
					return;
				} // Another module already handled it.

				const inputs = ensureArray(input);
				if (inputs.length === 0) {
					return;
				}

				const firstItem = inputs[0];
				let unitToSelect = null;
				if (firstItem instanceof Unit) {
					unitToSelect = firstItem;
				} else {
					const potentialId = firstItem?.id ?? firstItem;
					const foundUnit = player.gaming.battlefield.getUnitById(potentialId);
					if (foundUnit) {
						unitToSelect = foundUnit;
					}
				}

				if (unitToSelect) {
					const unitsToProcess = [unitToSelect];
					if (player.selectedUnits?.length && player.selectedSkills?.length) {
						if (player.selectedSkills.some(e => e.filterValidTargets(unitsToProcess).length > 0)) {
							payload.command = new SelectTargetCommand(player, unitsToProcess);
						} else if (unitToSelect.owner?.id === player.id) {
							payload.command = new SelectUnitCommand(player, [unitToSelect]);
						}
					} else {
						payload.command = new SelectUnitCommand(player, unitsToProcess);
					}
				}
			},
			'player selectSkills start': (payload) => {
				const {player} = payload;
				if (!player.selectedUnits?.length) {
					payload.canProceed = false;
				}
			},
			'player filterSelectableSkills end': (payload) => {
				const {player, allSkills, selectableSkills} = payload;
				const finalSkills = new Set(selectableSkills);

				if (player.selectedUnits?.length) {
					const unitSkills = allSkills.filter(
						skill => player.selectedUnits.some(unit => compareWithId(unit, skill.owner)));
					unitSkills.forEach(skill => finalSkills.add(skill));
				}

				payload.selectableSkills = [...finalSkills];
			},
		};
	}

	constructor(gaming, cfg) {
		super(gaming, cfg);

		const BattlefieldClass = cfg.battlefieldClass ?? gaming.cfg.BattlefieldClass ?? Battlefield;
		notice(this, 'gaming buildBattlefield start', {gaming: gaming, battlefieldCfg: cfg, class: BattlefieldClass});
		const battlefield = new BattlefieldClass(gaming, cfg);
		notice(this, 'gaming buildBattlefield end', {battlefield});
		gaming.battlefield = battlefield;

		if (!Object.getOwnPropertyDescriptor(Unit.prototype, 'position')) {
			Object.defineProperty(Unit.prototype, 'position', {
				get: function() {
					return this.gaming.battlefield.getPositionOfUnit(this);
				},
				set: function(newPosition) {
					this.gaming.battlefield.moveUnit(this, newPosition);
				},
				configurable: true,
			});
		}

		this._upgradePlayerClass();
		gaming.playerTurnSequence.forEach(player => {
			// 为每个玩家实例初始化属性
			if (player.units === undefined) {
				player.units = [];
			}
			if (player.selectedUnits === undefined) {
				player.selectedUnits = [];
			}
		});

		watch(this, 'player play end', ({player}) => {
			player.selectedUnits = [];
		});

		//把战场上的单位都加到对应的Player.units里，做便捷访问入口
		watch(this, 'gaming build end', () => {
			this.gaming.battlefield.allUnitsInBattlefield.forEach(unit => {
				if (unit.owner && (!unit.owner.units || !unit.owner.units.includes(unit))) {
					unit.owner.addUnit(unit);
				}
			});
		});
		//单位被消灭时从玩家实例里移除。
		watch(this, 'battlefield destroyUnit end', ({unit}) => {
			if (unit && unit.owner) {
				unit.owner.removeUnit(unit);
			}
		});

		gaming.battlefield.initUnitsPositions();
	}

	_upgradePlayerClass() {
		if (Player.prototype._battlefieldBasedUpgraded) {
			return;
		}
		Player.prototype._battlefieldBasedUpgraded = true;

		const rawFilterSelectableSkills = Player.prototype.filterSelectableSkills;
		Player.prototype.filterSelectableSkills = function(skills) {
			skills = ensureArray(skills);
			const finalSkills = new Set();

			// 首先，获取属于玩家的技能（原始逻辑）
			const playerSkills = rawFilterSelectableSkills.call(this, skills);
			if (playerSkills) {
				playerSkills.forEach(skill => finalSkills.add(skill));
			}

			// 然后，添加属于选中单位的技能
			if (this.selectedUnits?.length) {
				const unitSkills = skills.filter(skill => this.selectedUnits.some(unit => compareWithId(unit, skill.owner)));
				unitSkills.forEach(skill => finalSkills.add(skill));
			}

			return [...finalSkills];
		};

		const rawIsReadyToActivateSkills = Player.prototype.isReadyToActivateSkills;
		Player.prototype.isReadyToActivateSkills = function() {
			return this.selectedUnits?.length && rawIsReadyToActivateSkills.call(this);
		};
	}
}

class Move extends Skill {
	constructor(overrideCfg = {}) { super({name: 'Move', ...overrideCfg}); }

	activate(targets) {
		if (!targets || targets.length === 0) {
			return false;
		}
		const target = targets[0];
		const position = target instanceof Unit ? target.position : target;

		if (this.isValidTargets([position])) {
			this.gaming.battlefield.moveUnit(this.owner, position);
			return true;
		}
		return false;
	}

	_calculateReachablePositions() {
		let rawTargets = this.getRawTargetPositions();
		const noticePayload = {
			unit: this.owner,
			availableTargetPositions: [...rawTargets],
			blockedTargetPositions: [],
		};
		notice(this, 'unit get movable targets', noticePayload);
		return {
			valid: this.gaming.battlefield.keepValidPositions(noticePayload.availableTargetPositions),
			blocked: this.gaming.battlefield.keepValidPositions(noticePayload.blockedTargetPositions),
		};
	}

	scopePositions() {
		const {valid, blocked} = this._calculateReachablePositions();
		return valid.concat(blocked);
	}

	get availableTargets() {
		const {valid} = this._calculateReachablePositions();
		return valid.filter(p => this.gaming.battlefield.getUnitsAt(p).length === 0);
	}

	get blockedTargets() {
		return this._calculateReachablePositions().blocked;
	}

	isValidTargets(targets) {
		const available = this.availableTargets || [];
		return targets.every(targetPos => {
			const pos = targetPos instanceof Unit ? targetPos.position : targetPos;
			return available.some(p => p.isEqualTo(pos));
		});
	}

	getRawTargetPositions() {
		return Array.from(this.gaming.battlefield.positions.keys());
	}
}

class Attack extends Skill {
	constructor(cfg) { super({name: 'Attack', ...cfg}); }

	activate(targets) {
		return (targets || []).map(targetUnit => {
			if (targetUnit instanceof Unit) {
				const place = targetUnit.position;
				const payload = {unit: this.owner, killed: targetUnit, place};
				this.gaming.battlefield.destroyUnit(targetUnit);
				notice(this, 'unit attack end', payload);
				return true;
			}
			return false;
		}).reduce((pre, cur) => pre || cur, false);
	}

	get availableTargets() {
		const unitsInScope = this.scopePositions().flatMap(p => this.gaming.battlefield.getUnitsAt(p));
		return unitsInScope.filter(unit => this.isAvailableTarget(unit));
	}

	scopePositions() {
		const moveSkill = this.owner.skills.find(s => s instanceof Move);
		if (!moveSkill) {
			return [];
		}
		return moveSkill.scopePositions();
	}

	isAvailableTarget(unit) {
		return unit.owner.id !== this.owner.owner.id;
	}
}

class BattlefieldBasedGaming extends TurnBasedGaming {
	constructor(cfg) {
		cfg.modules = cfg.modules || [];
		//如果modules里没有BattlefieldModule，就默认给它加上
		if (!cfg.modules.some(m => m.class === UnitModule)) {//依赖单位模块
			cfg.modules.push({class: UnitModule});
		}
		if (!cfg.modules.some(m => m.class === BattlefieldModule)) {
			cfg.modules.push({class: BattlefieldModule, ...cfg.battlefieldCfg});
		}
		super(cfg);
	}
}

//========================棋盘类游戏的类

class Board extends Battlefield {
	//不能声明属性，否则在super里初始化好的属性又被重新初始化了。
	// _colSize;
	// _rowSize;
	// _grid; // 使用二维数组优化棋子存储
	get rowSize() { return this._rowSize; }

	get colSize() { return this._colSize; }

	get grid() { return this._grid; }

	constructor(gaming, cfg = {}) {
		// 仍然调用父类构造函数，以运行GamingPart的初始化等逻辑
		// 但我们会忽略父类关于 positionUnitsMapping 的部分，用自己的grid代替
		super(gaming, {positions: Board.buildPositions(cfg.rowSize, cfg.colSize), ...cfg});
	}

	_initPositionUnitsMapping() {
		super._initPositionUnitsMapping();
		this._rowSize = this._cfg.rowSize;
		this._colSize = this._cfg.colSize;
		// 初始化二维数组grid，每个格子是一个空数组，用于存放棋子
		this._grid = Array(this._rowSize).fill(null).map(() => Array(this._colSize).fill(null).map(() => []));
	}

	// 重写父类方法，使用grid进行操作
	addUnitToPosition(unit, position) {
		super.addUnitToPosition(unit, position);
		this._grid[position.rowNum - 1][position.colNum - 1].push(unit);
	}

	// 重写父类方法，使用grid进行操作
	removeUnitFromPosition(unit, position = unit.position) {
		if (!position) {
			return;
		}
		super.removeUnitFromPosition(unit, position);
		const {rowNum, colNum} = position;
		const unitsAtPos = this._grid[rowNum - 1][colNum - 1];
		const index = unitsAtPos.findIndex(e => compareWithId(e, unit));
		if (index > -1) {
			unitsAtPos.splice(index, 1);
		}
	}

	// 重写父类方法，使用grid进行操作
	getUnitsAt(position) {
		// 添加边界检查以增加健壮性
		if (position.rowNum < 1 || position.rowNum > this._rowSize || position.colNum < 1 || position.colNum
				> this._colSize) {
			return [];
		}
		return this._grid[position.rowNum - 1][position.colNum - 1];
	}

	/**
	 * positionDescription格式为“(rowNum,colNum)”，都从1开始，表示第几行第几列
	 * @param positionDescription
	 * @returns {棋盘点位}
	 */
	toPosition(positionDescription) {
		const match = positionDescription.match(/\((\d+),(\d+)\)/);
		if (match) {
			const rowNum = parseInt(match[1], 10);
			const colNum = parseInt(match[2], 10);
			if (this.positions[rowNum - 1] && this.positions[rowNum - 1][colNum - 1]) {
				return this.positions[rowNum - 1][colNum - 1];
			}
		}
		return null;
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
		return positions.filter(p => p.rowNum > 0 && p.rowNum <= this._rowSize
																 && p.colNum > 0 && p.colNum <= this._colSize);
	}

	// todo：可以继续添加更多基于二维数组的便捷方法，例如计算距离、寻路等
}

class 棋盘点位 extends Position {
	rowNum;
	colNum;

	constructor(rowNum, colNum) {
		super();
		this.rowNum = rowNum;
		this.colNum = colNum;
	}

	toString() {
		return `${this.rowNum},${this.colNum}`;
	}
}
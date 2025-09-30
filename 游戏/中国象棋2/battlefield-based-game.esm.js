import {addCfgProps, aopMethod, compareWithId, ensureArray, notice, watch} from './kit.esm.js';
import {Module, Player, TurnBasedGaming, Unit} from './turn-based-game.esm.js';

export {
	BattlefieldBasedGaming, Battlefield, Position, BattlefieldModule,
	Board, 棋盘点位,
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
	get allUnitsInBattlefield() { return [...this._positionUnitsMapping.values()].flatMap(e => e); }

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
		const UnitClass = unitCfg.class ?? this.gaming._cfg.UnitClass ?? Unit;
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
		//todo：实现
		return this.positions[parseInt(positionDescription)];
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
			}
		}
	}

	getUnitsAt(position) { return this._positionUnitsMapping.get(position.id) || []; }

	/**
	 * 移除出界的位置。
	 */
	keepValidPositions(positions) { return positions.filter(p => this._positions.some(p2 => compareWithId(p, p2))); }

	//todo：需要增加许多关于位置的方法。比如计算两个单位的距离、获取距离某个单位为x的位置集……
}

class BattlefieldModule extends Module {
	constructor(gaming, cfg) {
		super(gaming, cfg);

		const BattlefieldClass = cfg.battlefieldClass ?? gaming._cfg.BattlefieldClass ?? Battlefield;
		notice(this, 'gaming buildBattlefield start', {gaming: gaming, battlefieldCfg: cfg, class: BattlefieldClass});
		const battlefield = new BattlefieldClass(gaming, cfg);
		notice(this, 'gaming buildBattlefield end', {battlefield});
		gaming.battlefield = battlefield;

		if (!Object.getOwnPropertyDescriptor(Unit.prototype, 'position')) {
			Object.defineProperty(Unit.prototype, 'position', {
				get: function() {
					return this.gaming.battlefield._unitPositionMapping.get(this.id);
				},
				set: function(newPosition) {
					this.gaming.battlefield.moveUnit(this, newPosition);
				},
				configurable: true,
			});
		}

		this._upgradePlayerClass();
		gaming.playerTurnSequence.forEach(player => {
			this._applyAopToPlayer(player);
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

	_applyAopToPlayer(player) {
		if (player._unitBasedAopApplied) {
			return;
		}
		aopMethod(player, 'addUnit', {noticePayloadBuilder: args => ({unit: args[0]})});
		aopMethod(player, 'removeUnit', {noticePayloadBuilder: args => ({unit: args[0]})});
		aopMethod(player, 'selectUnits', {noticePayloadBuilder: args => ({units: args[0]})});
		player._unitBasedAopApplied = true;
	}

	_upgradePlayerClass() {
		if (Player.prototype._unitBasedUpgraded) {
			return;
		}
		Player.prototype._unitBasedUpgraded = true;

		Player.prototype.addUnit = function(unit) {
			this.units.push(unit);
		};
		Player.prototype.removeUnit = function(unit) {
			const index = this.units.findIndex(e => compareWithId(e, unit));
			if (index > -1) {
				this.units.splice(index, 1);
			}
		};

		Player.prototype.selectUnits = function(units) {
			const ownUnits = units.filter(u => compareWithId(u.owner, this));
			if (ownUnits.length > 0) {
				this.selectedUnits = ownUnits;
				this.selectedSkills = [];
				this.selectedTargets = [];
			}
		};

		const rawProcessInput = Player.prototype.processInput;
		Player.prototype.processInput = function(...args) {
			const player = this;
			const input = args[0];
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
				const foundUnit = player.gaming.battlefield.allUnitsInBattlefield.find(u => u.id === potentialId);
				if (foundUnit) {
					unitToSelect = foundUnit;
				}
			}

			if (unitToSelect) {
				const unitsToProcess = [unitToSelect];

				if (player.selectedUnits?.length && player.selectedSkills?.length) {
					if (player.selectedSkills.some(e => e.filterValidTargets(unitsToProcess).length > 0)) {
						player.selectTargets(unitsToProcess);
					} else {
						const ownUnits = unitsToProcess.filter(u => u.owner?.id === player.id);
						if (ownUnits.length > 0) {
							player.selectUnits(ownUnits);
						}
					}
				} else {
					player.selectUnits(unitsToProcess);
				}
				return;
			}

			return rawProcessInput.apply(this, args);
		};

		const rawSelectSkills = Player.prototype.selectSkills;
		Player.prototype.selectSkills = function(...args) {
			if (!this.selectedUnits?.length) {
				return;
			}

			return rawSelectSkills.apply(this, args);
		};

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

		// Player.prototype.activateSkills = async function(...args) {
		// 	const player = this;
		// 	const [selectedSkills, selectedTargets] = args;
		// 	let activated = false;
		// 	if (player.selectedUnits) {
		// 		for (const unit of player.selectedUnits) {
		// 			for (const skill of selectedSkills) {
		// 				if (unit.skills.includes(skill)) {
		// 					activated = activated || await skill.activate(selectedTargets);
		// 				}
		// 			}
		// 		}
		// 	}
		// 	return activated;
		// };

		// Player.prototype.play = async function(...args) {
		// 	const player = this;
		// 	let actionsTaken = 0;
		// 	while (actionsTaken < player.actionsPerTurn) {
		// 		const input = await player.gaming.waitForInput();
		// 		if (input?.action === 'END_TURN') {
		// 			break;
		// 		}
		//
		// 		player.processInput(input);
		// 		//三要素齐备，开始施放技能。
		// 		if (player.selectedUnits?.length && player.selectedSkills?.length && player.selectedTargets?.length) {
		// 			const actionPerformed = await player.activateSkills(player.selectedSkills, player.selectedTargets);
		// 			if (actionPerformed) {
		// 				actionsTaken++;
		// 				player.selectedTargets = [];//每次使用技能后清除目标
		// 			}
		// 		}
		// 	}
		// 	player.selectedUnits = [];
		// 	player.selectedSkills = [];
		// 	player.selectedTargets = [];
		// };
	}
}

class BattlefieldBasedGaming extends TurnBasedGaming {
	constructor(cfg) {
		cfg.modules = cfg.modules || [];
		//如果modules里没有BattlefieldModule，就默认给它加上
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
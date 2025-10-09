import {Player, Rule, TurnBasedGame} from './../turn-based-game.esm.js';
import {BattlefieldBasedGaming, BattlefieldModule, Board, 棋盘点位} from './../battlefield-module.esm.js';
import {Unit, UnitModule} from './../unit-module.esm.js';

// --- 核心类定义 ---

/**
 * 五子棋游戏主类
 */
export class Gobang extends TurnBasedGame {
	constructor(cfg = {}) {
		super(Gobang.translateConfig({...cfg}));
		this.cfg.GamingClass = GobangGame;
		this.cfg.PlayerClass = GobangPlayer;
		this.cfg.UnitClass = GobangStone;
	}

	static translateConfig(cfg) {
		return {
			modules: [
				{class: UnitModule},
				{
					class: BattlefieldModule,
					battlefieldClass: GobangBoard, // 使用自定义棋盘类
					rowSize: 15,
					colSize: 15,
					unitsPositionCfg: {},
				},
			],
			playerTurnSequence: [
				{id: '黑方玩家', name: '黑方', team: {id: '黑方'}},
				{id: '白方玩家', name: '白方', team: {id: '白方'}},
			],
			globalRules: [
				{class: FiveInARowRule},
			],
			...cfg,
		};
	}
}

/**
 * 五子棋游戏逻辑类
 * 此类现在是空的，因为所有特定于UI的逻辑都将被移到视图层。
 * 它继承了BattlefieldBasedGaming的所有基础功能。
 */
class GobangGame extends BattlefieldBasedGaming {
	constructor(...args) {
		super(...args);
		this._moveNumber = 0; // Initialize move number
	}

	/**
	 * 在五子棋中，此方法用于在指定位置为指定玩家创建一颗棋子。
	 * 它直接创建 GobangStone 实例并将其添加到棋盘上。
	 * @param {Player} player - 棋子所属的玩家。
	 * @param {棋盘点位} position - 棋子要放置的棋盘点位。
	 * @param {Object} [unitTypeCfg] - 单位类型配置，可选，用于指定单位类。
	 * @returns {Unit} 创建的棋子实例。
	 */
	buildUnit(player, position, unitTypeCfg = {}) {
		this._moveNumber++; // Increment move number for the new piece
		const UnitClass = unitTypeCfg.class ?? GobangStone; // 默认使用 GobangStone
		const unit = new UnitClass({owner: player, position: position, moveNumber: this._moveNumber}); // Pass moveNumber

		this.battlefield.addUnitToPosition(unit, position);
		this.bulletin.notice('buildUnit end', {unit: unit});

		return unit;
	}
}

/**
 * 五子棋玩家类
 */
class GobangPlayer extends Player {
	interpretInput(input) {
		// 输入应该是棋盘点位
		if (!(input instanceof 棋盘点位)) {
			return null;
		}

		// 检查位置是否已有棋子
		const unitsAtTarget = this.gaming.battlefield.getUnitsAt(input);
		if (unitsAtTarget.length > 0) {
			return null; // 位置不为空，无效操作
		}

		// 返回一个落子命令
		const command = new PlaceStoneCommand(this, input);
		return command;
	}
}

/**
 * 五子棋棋子类
 * 此类现在是空的，因为它只代表一个数据实体。其视觉表现由视图层处理。
 */
class GobangStone extends Unit {
	constructor(cfg) {
		super(cfg);
		this._moveNumber = cfg.moveNumber; // Store the move number
	}

	get moveNumber() { return this._moveNumber; } // Add a getter
}

/**
 * 自定义五子棋棋盘类，确保 gaming 实例被正确存储，并提供 isValidPosition 方法。
 */
class GobangBoard extends Board {
	constructor(gaming, cfg) {
		super(gaming, cfg);
		// 显式存储 gaming 实例，以防基类未正确处理
		this._gaming = gaming;
	}

	/**
	 * 检查给定点位是否在棋盘范围内。
	 * @param {棋盘点位} position - 要检查的点位。
	 * @returns {boolean} - 如果点位有效则返回 true，否则返回 false。
	 */
	isValidPosition(position) {
		return position.rowNum >= 1 && position.rowNum <= this._rowSize &&
					 position.colNum >= 1 && position.colNum <= this._colSize;
	}
}

// --- 命令定义 ---

/**
 * 落子命令
 */
class PlaceStoneCommand {
	constructor(player, position) {
		this.player = player;
		this.position = position;
	}

	async execute() {
		const gaming = this.player.gaming;
		gaming.startChangeCollection();

		// 创建新棋子
		gaming.buildUnit(this.player, this.position);

		const changes = gaming.stopChangeCollection();
		return {actionsConsumed: 1, changes};
	}
}

// --- 规则定义 ---

/**
 * 五子连珠胜利规则
 */
class FiveInARowRule extends Rule {
	constructor(gaming, cfg) {
		super(gaming, {
			...cfg,
			watchers: {
				'buildUnit end': ({unit}) => {
					if (this.checkWin(unit)) {
						this.gaming.bulletin.notice('game over', {winner: unit.owner});
					}
				},
			},
		});
	}

	checkWin(unit) {
		const battlefield = this.gaming.battlefield;
		const player = unit.owner;
		const {rowNum, colNum} = unit.position;

		const directions = [
			[1, 0],  // 水平
			[0, 1],  // 垂直
			[1, 1],  // 右斜
			[1, -1],  // 左斜
		];

		for (const [dr, dc] of directions) {
			let count = 1;
			// 检查两个方向
			for (let sign = -1; sign <= 1; sign += 2) {
				if (sign === 0) {
					continue;
				}
				for (let i = 1; i < 5; i++) {
					const r = rowNum + i * dr * sign;
					const c = colNum + i * dc * sign;
					const pos = new 棋盘点位(r, c);

					if (!battlefield.isValidPosition(pos)) {
						break;
					}

					const unitsOnPos = battlefield.getUnitsAt(pos);
					if (unitsOnPos.length > 0 && unitsOnPos[0].owner === player) {
						count++;
					} else {
						break;
					}
				}
			}
			if (count >= 5) {
				return true;
			}
		}
		return false;
	}
}
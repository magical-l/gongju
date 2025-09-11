
/**
 * 游戏坐标：
 * r 行, 1-10, 红方在下（r=10为底线），黑方在上（r=1为底线）
 * c 列, 1-9,  红方视角，1为最右边，9为最左边
 */

// 技能基类
class Skill {
	constructor(unit) {
		this.unit = unit;
	}

	/**
	 * 模板方法/抽象方法，获取技能可用的目标。
	 * @returns {Array<[number, number]>} 返回一个包含 [r, c] 坐标的数组
	 */
	getValidTargets() {
		throw new Error("必须由子类实现");
	}
}

// 移动技能
class Move extends Skill {
	getValidTargets() {
		// 默认实现，具体逻辑由棋子自身的移动类覆盖
		return [];
	}

	/**
	 * 检查目标位置是否有效（在棋盘内且没有己方棋子）
	 * @param r
	 * @param c
	 * @returns {null|boolean} null:出界, true:可走, false:己方棋子
	 */
	checkTarget(r, c) {
		const game = this.unit.player.game;
		if (r < 1 || r > 10 || c < 1 || c > 9) return null; // Out of bounds
		const targetUnit = game.getUnitAt(r, c);
		if (targetUnit && targetUnit.player === this.unit.player) {
			return false; // Friendly unit
		}
		return true; // Valid target (empty or enemy)
	}
}

// 攻击技能（吃子），在中国象棋里通常是被动触发的
class Attack extends Skill {
	// 这里可以留作扩展，比如实现一些特殊的主动攻击技能
}


// 棋子单位基类
class Unit {
	constructor(player, name, r, c) {
		this.player = player;
		this.name = name;
		this.r = r;
		this.c = c;
		this.skills = [];
		this.id = `p${player.id}_${name}_${r}_${c}`; // 唯一ID
		this.initSkills();
	}

	/**
	 * 模板方法，初始化棋子技能，由子类覆盖
	 */
	initSkills() {
		// 默认只添加基础移动和攻击
		this.skills.push(new Move(this));
		this.skills.push(new Attack(this));
	}

	/**
	 * 获取特定类型的技能实例
	 * @param {Function} skillClass - 技能的类名 (e.g., Move)
	 * @returns {Skill|undefined}
	 */
	getSkill(skillClass) {
		return this.skills.find(s => s instanceof skillClass);
	}

	/**
	 * 棋子移动到新位置
	 * @param {number} r - 目标行
	 * @param {number} c - 目标列
	 */
	moveTo(r, c) {
		this.r = r;
		this.c = c;
	}

	/**
	 * 检查是否可以移动到目标位置
	 * @param {number} r
	 * @param {number} c
	 * @returns {boolean}
	 */
	canMoveTo(r, c) {
		const moveSkill = this.getSkill(Move);
		if (!moveSkill) return false;

		const validMoves = moveSkill.getValidTargets();
		return validMoves.some(move => move[0] === r && move[1] === c);
	}

	// CSS相关的类
	get cssClass() {
		return ['piece', this.player.id === 1 ? 'red' : 'black'];
	}
}

// 玩家类
class Player {
	constructor(id, game) {
		this.id = id; // 1 for red, 2 for black
		this.game = game;
	}

	/**
	 * 响应鼠标操作
	 * @param {number} r
	 * @param {number} c
	 */
	handleCellClick(r, c) {
		const game = this.game;
		const targetUnit = game.getUnitAt(r, c);
		const selectedUnit = game.selectedUnit;

		if (selectedUnit) {
			// 已经选中了一个棋子
			if (targetUnit && targetUnit.player === this) {
				// 目标是己方棋子，改选
				game.selectUnit(targetUnit);
			} else {
				// 尝试移动
				if (selectedUnit.canMoveTo(r, c)) {
					game.moveUnit(selectedUnit, r, c);
				} else {
					// 非法移动，取消选择
					game.deselectUnit();
				}
			}
		} else {
			// 没有选中棋子
			if (targetUnit && targetUnit.player === this) {
				// 选中己方棋子
				game.selectUnit(targetUnit);
			}
		}
	}
}

// 游戏主类
class Game {
	constructor() {
		this.players = [new Player(1, this), new Player(2, this)];
		this.currentPlayer = this.players[0]; // 红方先手
		this.board = this.createBoard();
		this.selectedUnit = null;
		this.initUnits();
	}

	createBoard() {
		// 创建一个 10x9 的棋盘, vue是从1开始，我们这里用0-9和0-8
		return Array(10).fill(null).map(() => Array(9).fill(null));
	}

	initUnits() {
		const red = this.players[0];
		const black = this.players[1];

		// 红方
		this.addUnit(new Che(red, 10, 1));
		this.addUnit(new Ma(red, 10, 2));
		this.addUnit(new Xiang(red, 10, 3));
		this.addUnit(new Shi(red, 10, 4));
		this.addUnit(new Jiang(red, 10, 5));
		this.addUnit(new Shi(red, 10, 6));
		this.addUnit(new Xiang(red, 10, 7));
		this.addUnit(new Ma(red, 10, 8));
		this.addUnit(new Che(red, 10, 9));
		this.addUnit(new Pao(red, 8, 2));
		this.addUnit(new Pao(red, 8, 8));
		this.addUnit(new Bing(red, 7, 1));
		this.addUnit(new Bing(red, 7, 3));
		this.addUnit(new Bing(red, 7, 5));
		this.addUnit(new Bing(red, 7, 7));
		this.addUnit(new Bing(red, 7, 9));

		// 黑方
		this.addUnit(new Che(black, 1, 1));
		this.addUnit(new Ma(black, 1, 2));
		this.addUnit(new Xiang(black, 1, 3));
		this.addUnit(new Shi(black, 1, 4));
		this.addUnit(new Jiang(black, 1, 5));
		this.addUnit(new Shi(black, 1, 6));
		this.addUnit(new Xiang(black, 1, 7));
		this.addUnit(new Ma(black, 1, 8));
		this.addUnit(new Che(black, 1, 9));
		this.addUnit(new Pao(black, 3, 2));
		this.addUnit(new Pao(black, 3, 8));
		this.addUnit(new Bing(black, 4, 1));
		this.addUnit(new Bing(black, 4, 3));
		this.addUnit(new Bing(black, 4, 5));
		this.addUnit(new Bing(black, 4, 7));
		this.addUnit(new Bing(black, 4, 9));
	}

	addUnit(unit) {
		this.board[unit.r - 1][unit.c - 1] = unit;
	}

	getUnitAt(r, c) {
		if (r < 1 || r > 10 || c < 1 || c > 9) return null;
		return this.board[r - 1][c - 1];
	}

	selectUnit(unit) {
		this.selectedUnit = unit;
	}

	deselectUnit() {
		this.selectedUnit = null;
	}

	moveUnit(unit, r, c) {
		const oldR = unit.r;
		const oldC = unit.c;
		const targetUnit = this.getUnitAt(r, c);

		if (targetUnit) {
			// 吃子
			console.log(`${unit.name} 吃掉了 ${targetUnit.name}`);
			// 实际游戏中，这里需要将 targetUnit 从棋子列表中移除
		}

		// 更新棋盘
		this.board[oldR - 1][oldC - 1] = null;
		unit.moveTo(r, c);
		this.board[r - 1][c - 1] = unit;

		this.deselectUnit();
		this.switchPlayer();
	}

	switchPlayer() {
		this.currentPlayer = this.currentPlayer.id === 1 ? this.players[1] : this.players[0];
	}
}


// --- 具体棋子的移动逻辑 ---

class CheMove extends Move {
	getValidTargets() {
		const targets = [];
		const {r, c} = this.unit;
		const game = this.unit.player.game;

		const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]]; // 上下左右
		for (const [dr, dc] of directions) {
			let nextR = r + dr, nextC = c + dc;
			while (true) {
				const status = this.checkTarget(nextR, nextC);
				if (status === null) break; // 出界
				targets.push([nextR, nextC]);
				if (status === false || game.getUnitAt(nextR, nextC)) break; // 撞到己方或任何棋子
				nextR += dr;
				nextC += dc;
			}
		}
		return targets;
	}
}

class MaMove extends Move {
	getValidTargets() {
		const targets = [];
		const {r, c} = this.unit;
		const game = this.unit.player.game;

		const moves = [
			{dr: -2, dc: -1, legR: -1, legC: 0}, {dr: -2, dc: 1, legR: -1, legC: 0},
			{dr: 2, dc: -1, legR: 1, legC: 0}, {dr: 2, dc: 1, legR: 1, legC: 0},
			{dr: -1, dc: -2, legR: 0, legC: -1}, {dr: -1, dc: 2, legR: 0, legC: 1},
			{dr: 1, dc: -2, legR: 0, legC: -1}, {dr: 1, dc: 2, legR: 0, legC: 1},
		];

		for (const move of moves) {
			// 检查蹩马腿
			if (game.getUnitAt(r + move.legR, c + move.legC)) {
				continue;
			}
			const targetR = r + move.dr;
			const targetC = c + move.dc;
			if (this.checkTarget(targetR, targetC)) {
				targets.push([targetR, targetC]);
			}
		}
		return targets;
	}
}

class XiangMove extends Move {
	getValidTargets() {
		const targets = [];
		const {r, c, player} = this.unit;
		const game = player.game;

		const moves = [
			{dr: 2, dc: 2, eyeR: 1, eyeC: 1}, {dr: 2, dc: -2, eyeR: 1, eyeC: -1},
			{dr: -2, dc: 2, eyeR: -1, eyeC: 1}, {dr: -2, dc: -2, eyeR: -1, eyeC: -1},
		];

		for (const move of moves) {
			const targetR = r + move.dr;
			// 检查是否过河
			if ((player.id === 1 && targetR < 6) || (player.id === 2 && targetR > 5)) {
				continue;
			}
			// 检查塞象眼
			if (game.getUnitAt(r + move.eyeR, c + move.eyeC)) {
				continue;
			}
			if (this.checkTarget(targetR, c + move.dc)) {
				targets.push([targetR, c + move.dc]);
			}
		}
		return targets;
	}
}

class ShiMove extends Move {
	getValidTargets() {
		const targets = [];
		const {r, c, player} = this.unit;

		const moves = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
		const palace = player.id === 1 ? {minR: 8, maxR: 10, minC: 4, maxC: 6} : {minR: 1, maxR: 3, minC: 4, maxC: 6};

		for (const [dr, dc] of moves) {
			const targetR = r + dr;
			const targetC = c + dc;
			// 检查是否在九宫内
			if (targetR >= palace.minR && targetR <= palace.maxR && targetC >= palace.minC && targetC <= palace.maxC) {
				if (this.checkTarget(targetR, targetC)) {
					targets.push([targetR, targetC]);
				}
			}
		}
		return targets;
	}
}

class JiangMove extends Move {
	getValidTargets() {
		const targets = [];
		const {r, c, player} = this.unit;
		const game = player.game;

		const moves = [[-1, 0], [1, 0], [0, -1], [0, 1]];
		const palace = player.id === 1 ? {minR: 8, maxR: 10, minC: 4, maxC: 6} : {minR: 1, maxR: 3, minC: 4, maxC: 6};

		for (const [dr, dc] of moves) {
			const targetR = r + dr;
			const targetC = c + dc;
			if (targetR >= palace.minR && targetR <= palace.maxR && targetC >= palace.minC && targetC <= palace.maxC) {
				if (this.checkTarget(targetR, targetC)) {
					targets.push([targetR, targetC]);
				}
			}
		}

		// 将对脸规则
		const opponentPlayer = game.players.find(p => p.id !== player.id);
		const opponentGeneral = game.board.flat().find(u => u instanceof Jiang && u.player === opponentPlayer);
		if (opponentGeneral && opponentGeneral.c === c) {
			const startR = Math.min(r, opponentGeneral.r) + 1;
			const endR = Math.max(r, opponentGeneral.r);
			let hasScreen = false;
			for (let i = startR; i < endR; i++) {
				if (game.getUnitAt(i, c)) {
					hasScreen = true;
					break;
				}
			}
			if (!hasScreen) {
				targets.push([opponentGeneral.r, opponentGeneral.c]);
			}
		}

		return targets;
	}
}

class PaoMove extends Move {
	getValidTargets() {
		const targets = [];
		const {r, c} = this.unit;
		const game = this.unit.player.game;

		const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
		for (const [dr, dc] of directions) {
			let nextR = r + dr, nextC = c + dc;
			let screen = false;
			while (true) {
				if (this.checkTarget(nextR, nextC) === null) break; // 出界

				const targetUnit = game.getUnitAt(nextR, nextC);
				if (!screen) {
					if (targetUnit) {
						screen = true; // 找到炮架
					} else {
						targets.push([nextR, nextC]); // 无炮架，正常移动
					}
				} else {
					if (targetUnit) {
						// 翻过炮架后，只能吃掉第一个遇到的对方棋子
						if (targetUnit.player !== this.unit.player) {
							targets.push([nextR, nextC]);
						}
						break; // 无论如何都停下
					}
				}
				nextR += dr;
				nextC += dc;
			}
		}
		return targets;
	}
}

class BingMove extends Move {
	getValidTargets() {
		const targets = [];
		const {r, c, player} = this.unit;

		const forward = player.id === 1 ? -1 : 1;
		const hasCrossedRiver = (player.id === 1 && r <= 5) || (player.id === 2 && r >= 6);

		// 向前
		if (this.checkTarget(r + forward, c)) {
			targets.push([r + forward, c]);
		}

		// 过河后可以横走
		if (hasCrossedRiver) {
			if (this.checkTarget(r, c - 1)) {
				targets.push([r, c - 1]);
			}
			if (this.checkTarget(r, c + 1)) {
				targets.push([r, c + 1]);
			}
		}
		return targets;
	}
}


// --- 具体棋子定义 ---

class Che extends Unit {
	constructor(player, r, c) {
		super(player, '车', r, c);
	}
	initSkills() {
		this.skills.push(new CheMove(this));
	}
}

class Ma extends Unit {
	constructor(player, r, c) {
		super(player, '马', r, c);
	}
	initSkills() {
		this.skills.push(new MaMove(this));
	}
}

class Xiang extends Unit {
	constructor(player, r, c) {
		super(player, player.id === 1 ? '相' : '象', r, c);
	}
	initSkills() {
		this.skills.push(new XiangMove(this));
	}
}

class Shi extends Unit {
	constructor(player, r, c) {
		super(player, player.id === 1 ? '仕' : '士', r, c);
	}
	initSkills() {
		this.skills.push(new ShiMove(this));
	}
}

class Jiang extends Unit {
	constructor(player, r, c) {
		super(player, player.id === 1 ? '帅' : '将', r, c);
	}
	initSkills() {
		this.skills.push(new JiangMove(this));
	}
}

class Pao extends Unit {
	constructor(player, r, c) {
		super(player, '炮', r, c);
	}
	initSkills() {
		this.skills.push(new PaoMove(this));
	}
}

class Bing extends Unit {
	constructor(player, r, c) {
		super(player, player.id === 1 ? '兵' : '卒', r, c);
	}
	initSkills() {
		this.skills.push(new BingMove(this));
	}
}


/**
 * 游戏坐标：
 * r 行, 1-10, 红方在下（r=10为底线），黑方在上（r=1为底线）
 * c 列, 1-9,  红方视角，1为最右边，9为最左边
 */

// #region ############# 核心类：回合、玩家、游戏 #############

// 回合类
class Turn {
	constructor(number, player) {
		this.number = number;
		this.currentPlayer = player;
		this.moves = []; // 记录本回合发生的所有移动
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
				// 尝试移动，此时调用规则引擎进行判断
				if (game.ruleEngine.isMoveValid(selectedUnit, r, c)) {
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
		this.board = this.createBoard();
		this.ruleEngine = new RuleEngine(this);
		this.turns = [];
		this.currentTurn = null;
		this.selectedUnit = null;
		this.isGameOver = false;

		this.initUnits();
		this.startNewTurn();
	}

	createBoard() {
		return Array(10).fill(null).map(() => Array(9).fill(null));
	}

	initUnits() {
		const red = this.players[0];
		const black = this.players[1];

		// ... (棋子初始化代码和之前一样)
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
			// 吃子逻辑，未来可以触发规则
		}

		this.board[oldR - 1][oldC - 1] = null;
		unit.moveTo(r, c);
		this.board[r - 1][c - 1] = unit;
		this.currentTurn.moves.push({unit, from: [oldR, oldC], to: [r, c]});

		this.deselectUnit();

		// 检查游戏是否结束
		if (this.ruleEngine.isGameOver()) {
			this.isGameOver = true;
			console.log(`游戏结束! 玩家 ${this.currentTurn.currentPlayer.id} 胜利!`);
		} else {
			this.startNewTurn();
		}
	}

	startNewTurn() {
		const nextPlayerId = this.currentTurn ? (this.currentTurn.currentPlayer.id === 1 ? 2 : 1) : 1;
		const nextPlayer = this.players.find(p => p.id === nextPlayerId);
		const newTurnNumber = this.turns.length + 1;
		this.currentTurn = new Turn(newTurnNumber, nextPlayer);
		this.turns.push(this.currentTurn);
	}
}

// #endregion

// #region ############# 规则引擎 #############

class Rule {
	constructor(game) {
		this.game = game;
	}

	/**
	 * 评估规则是否通过
	 * @param {object} context - 包含评估所需信息的上下文对象, e.g., { unit, r, c }
	 * @returns {boolean} - true: 通过, false: 阻止
	 */
	evaluate(context) {
		return true;
	}
}

class RuleEngine {
	constructor(game) {
		this.game = game;
		// 移动合法性规则列表
		this.moveValidationRules = [
			new BasicMoveShapeRule(game), // 1. 是否符合棋子基本走法
			new LineOfSightRule(game),    // 2. 是否路径上有子（车/炮）
			new FriendlyFireRule(game),   // 3. 是否吃己方棋子
			new HorseLegRule(game),       // 4. 是否蹩马腿
			new ElephantEyeRule(game),    // 5. 是否塞象眼
			new PalaceAndRiverRule(game), // 6. 是否遵守九宫和楚河汉界的限制
			new FlyingGeneralRule(game),  // 7. 是否触发王对王规则
			// 未来可以加入'是否造成自己被将军'的规则
		];
		// 游戏结束规则列表
		this.gameOverRules = [
			new CheckmateRule(game), // 是否将死
		];
	}

	getValidMovesForUnit(unit) {
		if (!unit) return [];
		const moveSkill = unit.getSkill(Move);
		if (!moveSkill) return [];

		const potentialMoves = moveSkill.getPotentialMoves();
		const validMoves = [];
		for (const move of potentialMoves) {
			const r = move[0];
			const c = move[1];
			if (this.isMoveValid(unit, r, c)) {
				validMoves.push(move);
			}
		}
		return validMoves;
	}

	isMoveValid(unit, r, c) {
		const context = {unit, r, c};
		for (const rule of this.moveValidationRules) {
			if (!rule.evaluate(context)) {
				// console.log(`移动失败: 规则 ${rule.constructor.name} 阻止了本次移动。`);
				return false;
			}
		}
		return true;
	}

	isGameOver() {
		for (const rule of this.gameOverRules) {
			if (rule.evaluate()) {
				return true;
			}
		}
		return false;
	}
}

// --- 具体规则实现 ---

// 规则1: 检查是否符合棋子的基本移动轨迹
class BasicMoveShapeRule extends Rule {
	evaluate({unit, r, c}) {
		const moveSkill = unit.getSkill(Move);
		if (!moveSkill) return false;
		const potentialMoves = moveSkill.getPotentialMoves();
		return potentialMoves.some(move => move[0] === r && move[1] === c);
	}
}

// 规则2: 直线路径规则（车/炮）
class LineOfSightRule extends Rule {
    evaluate({ unit, r, c }) {
        if (!(unit instanceof Che) && !(unit instanceof Pao)) {
            return true; // 此规则只适用于车和炮
        }

        const { r: startR, c: startC } = unit;
        const game = this.game;

        if (startR !== r && startC !== c) {
            return true; // 非直线移动，不由本规则处理
        }

        const screens = [];
        const distance = Math.abs(r - startR) + Math.abs(c - startC);
        const stepR = (r - startR) / distance;
        const stepC = (c - startC) / distance;

        for (let i = 1; i < distance; i++) {
            const currentR = startR + i * stepR;
            const currentC = startC + i * stepC;
            const pieceOnPath = game.getUnitAt(currentR, currentC);
            if (pieceOnPath) {
                screens.push(pieceOnPath);
            }
        }

        const targetUnit = game.getUnitAt(r, c);

        if (unit instanceof Che) {
            return screens.length === 0;
        }

        if (unit instanceof Pao) {
            if (targetUnit) { // 吃子
                return screens.length === 1;
            } else { // 移动
                return screens.length === 0;
            }
        }

        return true;
    }
}

// 规则3: 不能吃掉己方棋子
class FriendlyFireRule extends Rule {
	evaluate({r, c}) {
		const targetUnit = this.game.getUnitAt(r, c);
		if (targetUnit && targetUnit.player === this.game.currentTurn.currentPlayer) {
			return false;
		}
		return true;
	}
}

// 规则4: 马走日，不能被蹩腿
class HorseLegRule extends Rule {
	evaluate({unit, r, c}) {
		if (!(unit instanceof Ma)) return true; // 非马棋，直接通过
		const dr = r - unit.r;
		const dc = c - unit.c;
		let legR, legC;
		if (Math.abs(dr) === 2 && Math.abs(dc) === 1) {
			legR = unit.r + dr / 2;
			legC = unit.c;
		} else if (Math.abs(dr) === 1 && Math.abs(dc) === 2) {
			legR = unit.r;
			legC = unit.c + dc / 2;
		} else {
			return true; // 不是马的走法，此规则不关心
		}
		if (this.game.getUnitAt(legR, legC)) return false; // 被蹩马腿
		return true;
	}
}

// 规则5: 象走田，不能被塞象眼
class ElephantEyeRule extends Rule {
	evaluate({unit, r, c}) {
		if (!(unit instanceof Xiang)) return true;
		const eyeR = (unit.r + r) / 2;
		const eyeC = (unit.c + c) / 2;
		if (this.game.getUnitAt(eyeR, eyeC)) return false; // 被塞象眼
		return true;
	}
}

// 规则6: 将、士、象的九宫和过河限制
class PalaceAndRiverRule extends Rule {
	evaluate({unit, r, c}) {
		if (unit instanceof Jiang || unit instanceof Shi) {
			const palace = unit.player.id === 1 ? {minR: 8, maxR: 10, minC: 4, maxC: 6} : {minR: 1, maxR: 3, minC: 4, maxC: 6};
			if (r < palace.minR || r > palace.maxR || c < palace.minC || c > palace.maxC) return false;
		}
		if (unit instanceof Xiang) {
			if ((unit.player.id === 1 && r < 6) || (unit.player.id === 2 && r > 5)) return false; // 象不能过河
		}
		return true;
	}
}

// 规则7: 将帅不能直接见面
class FlyingGeneralRule extends Rule {
	evaluate({unit, r, c}) {
		// 这个规则比较复杂，因为它既是一种移动方式，也是一种限制
		// 简化处理：如果移动后造成将帅对脸，则移动非法
		// 完整的实现需要模拟移动后的局面，这里暂时只处理主动飞将的情况
		if (unit instanceof Jiang && this.game.getUnitAt(r, c) instanceof Jiang) {
			if (unit.c !== c) return false; // 飞将必须在同一直线
			const startR = Math.min(unit.r, r) + 1;
			const endR = Math.max(unit.r, r);
			for (let i = startR; i < endR; i++) {
				if (this.game.getUnitAt(i, c)) return false; // 中间有子，不能飞
			}
			return true;
		}
		return true;
	}
}

// 规则8: 游戏结束判断
class CheckmateRule extends Rule {
	evaluate() {
		// 简化版：如果将/帅被吃，则游戏结束
		const redGeneral = this.game.board.flat().find(u => u instanceof Jiang && u.player.id === 1);
		const blackGeneral = this.game.board.flat().find(u => u instanceof Jiang && u.player.id === 2);
		if (!redGeneral || !blackGeneral) {
			return true;
		}
		return false;
	}
}

// #endregion

// #region ############# 棋子和技能类 #############

// 技能基类
class Skill {
	constructor(unit) {
		this.unit = unit;
	}
}

// 移动技能 (现在只负责生成潜在移动位置，不关心合法性)
class Move extends Skill {
	getPotentialMoves() {
		return [];
	}
}

// 棋子单位基类
class Unit {
	constructor(player, name, r, c) {
		this.player = player;
		this.name = name;
		this.r = r;
		this.c = c;
		this.skills = [];
		this.id = `p${player.id}_${name}_${r}_${c}`;
		this.initSkills();
	}

	initSkills() {
		this.skills.push(new Move(this));
	}

	getSkill(skillClass) {
		return this.skills.find(s => s instanceof skillClass);
	}

	moveTo(r, c) {
		this.r = r;
		this.c = c;
	}

	get cssClass() {
		return ['piece', this.player.id === 1 ? 'red' : 'black'];
	}
}

// --- 具体棋子的移动轨迹定义 ---

class CheMove extends Move {
	getPotentialMoves() {
		const moves = [];
		// 车可以走到棋盘的任何一个角落
		for (let i = 1; i <= 10; i++) moves.push([i, this.unit.c]);
		for (let i = 1; i <= 9; i++) moves.push([this.unit.r, i]);
		return moves;
	}
}

class PaoMove extends CheMove {}

class MaMove extends Move {
	getPotentialMoves() {
		const {r, c} = this.unit;
		return [
			[r - 2, c - 1], [r - 2, c + 1],
			[r + 2, c - 1], [r + 2, c + 1],
			[r - 1, c - 2], [r - 1, c + 2],
			[r + 1, c - 2], [r + 1, c + 2],
		];
	}
}

class XiangMove extends Move {
	getPotentialMoves() {
		const {r, c} = this.unit;
		return [
			[r - 2, c - 2], [r - 2, c + 2],
			[r + 2, c - 2], [r + 2, c + 2],
		];
	}
}

class ShiMove extends Move {
	getPotentialMoves() {
		const {r, c} = this.unit;
		return [
			[r - 1, c - 1], [r - 1, c + 1],
			[r + 1, c - 1], [r + 1, c + 1],
		];
	}
}

class JiangMove extends Move {
	getPotentialMoves() {
		const {r, c} = this.unit;
		// 包含飞将的潜在位置
		const opponentGeneral = this.unit.player.game.board.flat().find(u => u instanceof Jiang && u.player !== this.unit.player);
		const moves = [
			[r - 1, c], [r + 1, c],
			[r, c - 1], [r, c + 1],
		];
		if (opponentGeneral) moves.push([opponentGeneral.r, opponentGeneral.c]);
		return moves;
	}
}

class BingMove extends Move {
	getPotentialMoves() {
		const {r, c, player} = this.unit;
		const forward = player.id === 1 ? -1 : 1;
		const hasCrossedRiver = (player.id === 1 && r <= 5) || (player.id === 2 && r >= 6);
		const moves = [[r + forward, c]];
		if (hasCrossedRiver) {
			moves.push([r, c - 1], [r, c + 1]);
		}
		return moves;
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

class Pao extends Unit {
	constructor(player, r, c) {
		super(player, '炮', r, c);
	}
	initSkills() {
		this.skills.push(new PaoMove(this));
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

class Bing extends Unit {
	constructor(player, r, c) {
		super(player, player.id === 1 ? '兵' : '卒', r, c);
	}
	initSkills() {
		this.skills.push(new BingMove(this));
	}
}

// #endregion

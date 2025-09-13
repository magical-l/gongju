/**
 * ====================================
 * 中国象棋 (Xiangqi) - 游戏实现
 * ====================================
 */

class XiangqiGame extends Game {
    createBoard() {
        return Array(10).fill(null).map(() => Array(9).fill(null));
    }

    initUnits(setup) {
        for (const pieceConfig of setup) {
            const { piece, player, r, c } = pieceConfig;
            const playerInstance = this.players.find(p => p.id === player);
            if (playerInstance) {
                const pieceDef = PIECE_DEFINITIONS[piece];
                const unit = new pieceDef.constructor(playerInstance, pieceDef.label, r, c);
                this.board[r - 1][c - 1] = unit;
                this.units.push(unit);
            }
        }
    }

    registerGameRules() {
        new MoveRule(this);
        new CaptureRule(this);
        new GameOverRule(this);
        registerFilterRules(this);
    }
}

class GameLauncher {
	launch() {
		const players = [new Player(1), new Player(2)];
		const config = {
			players: players,
			boardSetup: parseBoardSetup(VISUAL_BOARD_LAYOUT)
		};
		const game = new XiangqiGame(config, new EventBus());

		// 将game实例注入到player中，解决循环依赖
		players.forEach(p => p.game = game);

		return game;
	}
}

// #region ############# 象棋规则定义 #############

class MoveRule {
	constructor(game) {
		this.game = game;
		this.game.eventBus.on('unit:selected', this.onUnitSelected.bind(this));
	}

	onUnitSelected({game, action}) {
		const unit = action.selectedUnit;
		let potentialPositions = [];
		const moveSkill = unit.getSkill(Move);
		if (moveSkill) {
			potentialPositions = moveSkill.getPotentialPositions();
		}
		const context = {game, unit, potentialPositions};
		this.game.eventBus.emit('moveset:filter', context);
		action.validPositions = context.potentialPositions;
		this.game.eventBus.emit('moveset:finalized', {game, action: action});
	}
}

class CaptureRule {
	constructor(game) {
		this.game = game;
		this.game.eventBus.on('unit:after-move', this.onAfterMove.bind(this));
	}

	onAfterMove({game, captured}) {
		if (captured) {
			game.removeUnitFromList(captured);
			this.game.eventBus.emit('unit:captured', {game, captured});
		}
	}
}

class GameOverRule {
	constructor(game) {
		this.game = game;
		this.game.eventBus.on('unit:captured', this.onUnitCaptured.bind(this));
	}

	onUnitCaptured({game, captured}) {
		if (captured instanceof Jiang) {
			game.isGameOver = true;
			game.winner = game.curRound.curPlayerAction.player;
		}
	}
}

function registerFilterRules(game) {
	const eventBus = game.eventBus;
	eventBus.on('moveset:filter', context => {
		const {game, unit, potentialPositions} = context;
		context.potentialPositions = potentialPositions.filter(([r, c]) => {
			const targetUnit = game.getUnitAt(r, c);
			return !targetUnit || targetUnit.player !== unit.player;
		});
	});
	eventBus.on('moveset:filter', context => {
		const {game, unit, potentialPositions} = context;
		if (!(unit instanceof Ma)) return;
		context.potentialPositions = potentialPositions.filter(([r, c]) => {
			const dr = r - unit.r, dc = c - unit.c;
			let legR, legC;
			if (Math.abs(dr) === 2 && Math.abs(dc) === 1) { legR = unit.r + dr / 2; legC = unit.c; }
			else if (Math.abs(dr) === 1 && Math.abs(dc) === 2) { legR = unit.r; legC = unit.c + dc / 2; }
			else return true;
			return !game.getUnitAt(legR, legC);
		});
	});
    // ... more rules ...
}

// #endregion

// #region ############# 象棋棋子和技能定义 #############

class CheMove extends Move {
	getPotentialPositions() {
		const m = [];
		for (let i = 1; i <= 10; i++) {
			if (i !== this.unit.r) m.push([i, this.unit.c]);
		}
		for (let i = 1; i <= 9; i++) {
			if (i !== this.unit.c) m.push([this.unit.r, i]);
		}
		return m;
	}
}

class PaoMove extends CheMove {}

class 马行日 extends Move {
	getPotentialPositions() {
		const {r, c} = this.unit;
		return [[r - 2, c - 1], [r - 2, c + 1], [r + 2, c - 1], [r + 2, c + 1], [r - 1, c - 2], [r - 1, c + 2],
			[r + 1, c - 2], [r + 1, c + 2]].filter(([tr, tc]) => tr >= 1 && tr <= 10 && tc >= 1 && tc <= 9);
	}
}

class 象行田 extends Move {
	getPotentialPositions() {
		const {r, c} = this.unit;
		return [[r - 2, c - 2], [r - 2, c + 2], [r + 2, c - 2], [r + 2, c + 2]].filter(
			([tr, tc]) => tr >= 1 && tr <= 10 && tc >= 1 && tc <= 9);
	}
}

class ShiMove extends Move {
	getPotentialPositions() {
		const {r, c} = this.unit;
		return [[r - 1, c - 1], [r - 1, c + 1], [r + 1, c - 1], [r + 1, c + 1]].filter(
			([tr, tc]) => tr >= 1 && tr <= 10 && tc >= 1 && tc <= 9);
	}
}

class JiangMove extends Move {
	getPotentialPositions() {
		const {r, c} = this.unit;
		return [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].filter(
			([tr, tc]) => tr >= 1 && tr <= 10 && tc >= 1 && tc <= 9);
	}
}

class BingMove extends Move {
	getPotentialPositions() {
		const {r, c, player} = this.unit;
		const f = player.id === 1 ? -1 : 1;
		const river = player.id === 1 && r <= 5 || player.id === 2 && r >= 6;
		const m = [[r + f, c]];
		if (river) m.push([r, c - 1], [r, c + 1]);
		return m.filter(([tr, tc]) => tr >= 1 && tr <= 10 && tc >= 1 && tc <= 9);
	}
}

class Che extends Unit { constructor(p, l, r, c) { super(p, l, r, c); } initSkills() { this.skills.push(new CheMove(this)); } }
class Pao extends Unit { constructor(p, l, r, c) { super(p, l, r, c); } initSkills() { this.skills.push(new PaoMove(this)); } }
class Ma extends Unit { constructor(p, l, r, c) { super(p, l, r, c); } initSkills() { this.skills.push(new 马行日(this)); } }
class Xiang extends Unit { constructor(p, l, r, c) { super(p, l, r, c); } initSkills() { this.skills.push(new 象行田(this)); } }
class Shi extends Unit { constructor(p, l, r, c) { super(p, l, r, c); } initSkills() { this.skills.push(new ShiMove(this)); } }
class Jiang extends Unit { constructor(p, l, r, c) { super(p, l, r, c); } initSkills() { this.skills.push(new JiangMove(this)); } }
class Bing extends Unit { constructor(p, l, r, c) { super(p, l, r, c); } initSkills() { this.skills.push(new BingMove(this)); } }

// #endregion

// #region ############# 象棋棋盘定义 #############

const PIECE_DEFINITIONS = {
	'车': {constructor: Che, player: 2, label: '\u{1FA6B}'},
	'马': {constructor: Ma, player: 2, label: '\u{1FA6A}'},
	'象': {constructor: Xiang, player: 2, label: '\u{1FA69}'},
	'士': {constructor: Shi, player: 2, label: '\u{1FA68}'},
	'将': {constructor: Jiang, player: 2, label: '\u{1FA67}'},
	'炮': {constructor: Pao, player: 2, label: '\u{1FA6C}'},
	'兵': {constructor: Bing, player: 2, label: '\u{1FA6D}'},

	'俥': {constructor: Che, player: 1, label: '\u{1FA64}'},
	'傌': {constructor: Ma, player: 1, label: '\u{1FA63}'},
	'相': {constructor: Xiang, player: 1, label: '\u{1FA62}'},
	'仕': {constructor: Shi, player: 1, label: '\u{1FA61}'},
	'帅': {constructor: Jiang, player: 1, label: '\u{1FA60}'},
	'砲': {constructor: Pao, player: 1, label: '\u{1FA65}'},
	'卒': {constructor: Bing, player: 1, label: '\u{1FA66}'},

	'空': null
};

const VISUAL_BOARD_LAYOUT = [
	"车马象士将士象马车",
	"空空空空空空空空空",
	"空炮空空空空空炮空",
	"兵空兵空兵空兵空兵",
	"空空空空空空空空空",
	"空空空空空空空空空",
	"卒空卒空卒空卒空卒",
	"空砲空空空空空砲空",
	"空空空空空空空空空",
	"俥傌相仕帅仕相傌俥"
];

function parseBoardSetup(visualSetup) {
	const setup = [];
	visualSetup.forEach((rowStr, rIdx) => {
		rowStr.split('').forEach((char, cIdx) => {
			const pieceDef = PIECE_DEFINITIONS[char];
			if (pieceDef) {
				const r = rIdx + 1;
				const c = cIdx + 1;
				setup.push({piece: char, player: pieceDef.player, r: r, c: c});
			}
		});
	});
	return setup;
}

// #endregion

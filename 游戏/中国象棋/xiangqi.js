/**
 * ====================================
 * 中国象棋 (Xiangqi) - 游戏实现
 * ====================================
 */

const FACTION_RED = new Team(1, '红方');
const FACTION_BLACK = new Team(2, '黑方');

class XiangqiGame extends Game {
	createMap(config) {
		return new GameMap(10, 9);
	}

	initUnits(setup) {
		for (const unitConfig of setup) {
			const {unit, player, r, c} = unitConfig;
			const playerInstance = this.players.find(p => p.id === player);
			if (playerInstance) {
				const unitDef = UNIT_DEFINITIONS[unit];
				const newUnit = new unitDef.constructor(playerInstance, unitDef.label, r, c);
				this.map.addUnit(newUnit, r, c);
				this.units.push(newUnit);
			}
		}
	}

	registerGameRules(config) {
		new MoveRule(this);
		new CaptureRule(this);
		new GameOverRule(this);
		new CheckManager(this);
		registerFilterRules(this);
	}

	isKingInCheck(player) {
		const king = this.units.find(u => u instanceof Jiang && u.player === player);
		if (!king) {
			return false;
		}

		const opponents = this.units.filter(u => u.player !== player);
		for (const opponentUnit of opponents) {
			const moveSkill = opponentUnit.getSkill(Move);
			if (!moveSkill) {
				continue;
			}

			let potentialPositions = moveSkill.getPotentialPositions();
			const context = {game: this, unit: opponentUnit, potentialPositions};
			this.eventBus.emit('moveset:filter', context);
			const validMoves = context.potentialPositions;

			if (validMoves.some(move => move[0] === king.r && move[1] === king.c)) {
				console.log(`[将军!] ${player.id}号玩家的王被 ${opponentUnit.label} 将军了`);
				return true;
			}
		}

		return false;
	}
}

class GameLauncher {
	launch() {
		const players = [
			new Player(1, '红方玩家', FACTION_RED),
			new Player(2, '黑方玩家', FACTION_BLACK)
		];
		const config = {
			players: players,
			setup: parseMapSetup(VISUAL_MAP_LAYOUT)
		};
		const game = new XiangqiGame(config, new EventBus());
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
		const capturedUnit = captured[0];
		if (capturedUnit) {
			game.removeUnitFromGame(capturedUnit);
			this.game.eventBus.emit('unit:captured', {game, captured: capturedUnit});
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
			const winningPlayer = game.curRound.curPlayerTurn.player;
			game.winner = winningPlayer.team;
		}
	}
}

class CheckManager {
	constructor(game) {
		this.game = game;
		this.game.eventBus.on('player-turn:starting', this.onPlayerTurnStart.bind(this));
	}

	onPlayerTurnStart({game, action}) {
		const player = action.player;
		if (game.isKingInCheck(player)) {
			game.eventBus.emit('game:check', {player});
		}
	}
}

function registerFilterRules(game) {
	const eventBus = game.eventBus;

	eventBus.on('moveset:filter', context => {
		const {unit, potentialPositions} = context;
		context.potentialPositions = potentialPositions.filter(([r, c]) => {
			const targetUnits = game.getUnitsAt(r, c);
			return !targetUnits.some(u => u.player === unit.player);
		});
	});

	eventBus.on('moveset:filter', context => {
		const {unit, potentialPositions} = context;
		if (!(unit instanceof Ma)) {
			return;
		}
		context.potentialPositions = potentialPositions.filter(([r, c]) => {
			const dr = r - unit.r, dc = c - unit.c;
			let legR, legC;
			if (Math.abs(dr) === 2 && Math.abs(dc) === 1) {
				legR = unit.r + dr / 2;
				legC = unit.c;
			} else if (Math.abs(dr) === 1 && Math.abs(dc) === 2) {
				legR = unit.r;
				legC = unit.c + dc / 2;
			} else {
				return true;
			}
			return game.getUnitsAt(legR, legC).length === 0;
		});
	});

	eventBus.on('moveset:filter', context => {
		const {unit, potentialPositions} = context;
		if (!(unit instanceof Xiang)) {
			return;
		}
		context.potentialPositions = potentialPositions.filter(([r, c]) => {
			const eyeR = (unit.r + r) / 2, eyeC = (unit.c + c) / 2;
			return game.getUnitsAt(eyeR, eyeC).length === 0;
		});
	});

	eventBus.on('moveset:filter', context => {
		const {unit, potentialPositions} = context;
		if (unit instanceof Jiang || unit instanceof Shi) {
			const palace = unit.player.team.id === 1 ? {minR: 8, maxR: 10, minC: 4, maxC: 6} : {
				minR: 1,
				maxR: 3,
				minC: 4,
				maxC: 6
			};
			context.potentialPositions = potentialPositions.filter(
				([r, c]) => r >= palace.minR && r <= palace.maxR && c >= palace.minC && c <= palace.maxC);
		}
		if (unit instanceof Xiang) {
			context.potentialPositions = potentialPositions.filter(
				([r, c]) => !((unit.player.team.id === 1 && r < 6) || (unit.player.team.id === 2 && r > 5)));
		}
	});

	eventBus.on('moveset:filter', context => {
		const {unit, potentialPositions} = context;
		if (!(unit instanceof Pao) && !(unit instanceof Che)) {
			return;
		}
		console.log(`[调试] 开始为 ${unit.label} 计算直线路径规则...`);
		context.potentialPositions = potentialPositions.filter(([r, c]) => {
			const {r: startR, c: startC} = unit;
			const distance = Math.max(Math.abs(r - startR), Math.abs(c - startC));
			const stepR = distance === 0 ? 0 : (r - startR) / distance, stepC = distance === 0 ? 0 : (c - startC) / distance;
			let screens = 0;
			for (let i = 1; i < distance; i++) {
				if (game.getUnitsAt(startR + i * stepR, startC + i * stepC).length > 0) {
					screens++;
				}
			}
			const targetUnits = game.getUnitsAt(r, c);
			let result = false;
			if (unit instanceof Che) {
				result = screens === 0;
			} else if (unit instanceof Pao) {
				result = (targetUnits.length > 0 && screens === 1) || (targetUnits.length === 0 && screens === 0);
			}
			console.log(
				`[调试] ${unit.label} at (${startR},${startC}) -> (${r},${c}): screens=${screens}, targetUnits=${targetUnits.length}, result=${result}`);
			return result;
		});
	});

	eventBus.on('moveset:filter', context => {
		const {game, unit, potentialPositions} = context;
		context.potentialPositions = potentialPositions.filter(([r, c]) => {
			const tempMap = new GameMap(10, 9);
			game.units.forEach(u => tempMap.addUnit(new u.constructor(u.player), u.r, u.c));
			const movedUnit = tempMap.getUnitsAt(unit.r, unit.c)[0];
			tempMap.moveUnit(movedUnit, r, c);
			const generals = tempMap.grid.flat().flat().filter(u => u instanceof Jiang);
			if (generals.length < 2 || generals[0].c !== generals[1].c) {
				return true;
			}
			const [g1, g2] = generals;
			const minR = Math.min(g1.r, g2.r), maxR = Math.max(g1.r, g2.r);
			for (let i = minR + 1; i < maxR; i++) {
				if (tempMap.getUnitsAt(i, g1.c).length > 0) {
					return true;
				}
			}
			return false;
		});
	});
}

// #endregion

// #region ############# 象棋棋子和技能定义 #############

class XiangqiUnit extends Unit {
	get cssClass() {
		return ['unit', this.player.team.id === 1 ? 'red' : 'black'];
	}
}

class CheMove extends Move {
	getPotentialPositions() {
		const m = [], {r, c} = this.unit;
		for (let i = 1; i <= 10; i++) {
			if (i !== r) {
				m.push([i, c]);
			}
		}
		for (let i = 1; i <= 9; i++) {
			if (i !== c) {
				m.push([r, i]);
			}
		}
		return m;
	}
}

class PaoMove extends CheMove {
}

class MaMove extends Move {
	getPotentialPositions() {
		const {r, c} = this.unit;
		return [[r - 2, c - 1], [r - 2, c + 1], [r + 2, c - 1], [r + 2, c + 1], [r - 1, c - 2], [r - 1, c + 2],
			[r + 1, c - 2], [r + 1, c + 2]].filter(([tr, tc]) => tr >= 1 && tr <= 10 && tc >= 1 && tc <= 9);
	}
}

class XiangMove extends Move {
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
		const f = player.team.id === 1 ? -1 : 1;
		const river = (player.team.id === 1 && r <= 5) || (player.team.id === 2 && r >= 6);
		const m = [[r + f, c]];
		if (river) {
			m.push([r, c - 1], [r, c + 1]);
		}
		return m.filter(([tr, tc]) => tr >= 1 && tr <= 10 && tc >= 1 && tc <= 9);
	}
}

class Che extends XiangqiUnit {
	constructor(p, l, r, c) {
		super(p, l, r, c);
	}

	initSkills() {
		this.skills.push(new CheMove(this));
	}
}

class Pao extends XiangqiUnit {
	constructor(p, l, r, c) {
		super(p, l, r, c);
	}

	initSkills() {
		this.skills.push(new PaoMove(this));
	}
}

class Ma extends XiangqiUnit {
	constructor(p, l, r, c) {
		super(p, l, r, c);
	}

	initSkills() {
		this.skills.push(new MaMove(this));
	}
}

class Xiang extends XiangqiUnit {
	constructor(p, l, r, c) {
		super(p, l, r, c);
	}

	initSkills() {
		this.skills.push(new XiangMove(this));
	}
}

class Shi extends XiangqiUnit {
	constructor(p, l, r, c) {
		super(p, l, r, c);
	}

	initSkills() {
		this.skills.push(new ShiMove(this));
	}
}

class Jiang extends XiangqiUnit {
	constructor(p, l, r, c) {
		super(p, l, r, c);
	}

	initSkills() {
		this.skills.push(new JiangMove(this));
	}
}

class Bing extends XiangqiUnit {
	constructor(p, l, r, c) {
		super(p, l, r, c);
	}

	initSkills() {
		this.skills.push(new BingMove(this));
	}
}

// #endregion

// #region ############# 象棋地图定义 #############

const UNIT_DEFINITIONS = {
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

const VISUAL_MAP_LAYOUT = [
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

function parseMapSetup(visualSetup) {
	const setup = [];
	visualSetup.forEach((rowStr, rIdx) => {
		rowStr.split('').forEach((char, cIdx) => {
			const unitDef = UNIT_DEFINITIONS[char];
			if (unitDef) {
				const r = rIdx + 1;
				const c = cIdx + 1;
				setup.push({unit: char, player: unitDef.player, r: r, c: c});
			}
		});
	});
	return setup;
}

// #endregion
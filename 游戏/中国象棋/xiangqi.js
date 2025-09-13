const 红方 = new Team(1, '红方');
const 黑方 = new Team(2, '黑方');

class 象棋 extends Game {
	createMap(config) {
		return new GameMap();
	}

	initUnits(setup) {
		for (const unitConfig of setup) {
			const {unit, player, r, c} = unitConfig;
			const playerInstance = this.players.find(p => p.id === player);
			if (playerInstance) {
				const unitDef = UNIT_DEFINITIONS[unit];
				const position = new 棋盘点位(r, c);
				const newUnit = new unitDef.constructor(playerInstance, unitDef.label, position);
				this.map.addUnit(newUnit, position);
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

	// 内部使用的、不触发事件的移动计算方法
	_getValidMovesForUnit_internal(unit) {
		const moveSkill = unit.getSkill(Move);
		if (!moveSkill) {
			return [];
		}

		let potentialPositions = moveSkill.getPotentialPositions();

		// 手动执行所有过滤规则，但不触发事件
		potentialPositions = potentialPositions.filter(pos => {
			const targetUnits = this.getUnitsAt(pos);
			return !targetUnits.some(u => u.player === unit.player);
		});

		if (unit instanceof Ma) {
			potentialPositions = potentialPositions.filter(pos => {
				const dr = pos.r - unit.position.r, dc = pos.c - unit.position.c;
				let legR, legC;
				if (Math.abs(dr) === 2 && Math.abs(dc) === 1) {
					legR = unit.position.r + dr / 2;
					legC = unit.position.c;
				} else if (Math.abs(dr) === 1 && Math.abs(dc) === 2) {
					legR = unit.position.r;
					legC = unit.position.c + dc / 2;
				} else {
					return true;
				}
				return this.getUnitsAt(new 棋盘点位(legR, legC)).length === 0;
			});
		}

		if (unit instanceof Xiang) {
			potentialPositions = potentialPositions.filter(pos => {
				const eyeR = (unit.position.r + pos.r) / 2, eyeC = (unit.position.c + pos.c) / 2;
				return this.getUnitsAt(new 棋盘点位(eyeR, eyeC)).length === 0;
			});
		}

		if (unit instanceof Jiang || unit instanceof Shi) {
			const palace = unit.player.team.id === 1 ? {minR: 8, maxR: 10, minC: 4, maxC: 6} : {
				minR: 1,
				maxR: 3,
				minC: 4,
				maxC: 6
			};
			potentialPositions = potentialPositions.filter(
				pos => pos.r >= palace.minR && pos.r <= palace.maxR && pos.c >= palace.minC && pos.c <= palace.maxC);
		}
		if (unit instanceof Xiang) {
			potentialPositions = potentialPositions.filter(
				pos => !(unit.player.team.id === 1 && pos.r < 6 || unit.player.team.id === 2 && pos.r > 5));
		}

		if (unit instanceof Pao || unit instanceof Che) {
			potentialPositions = potentialPositions.filter(pos => {
				const {r: startR, c: startC} = unit.position;
				const distance = Math.max(Math.abs(pos.r - startR), Math.abs(pos.c - startC));
				const stepR = distance === 0 ? 0 : (pos.r - startR) / distance,
					stepC = distance === 0 ? 0 : (pos.c - startC) / distance;
				let screens = 0;
				for (let i = 1; i < distance; i++) {
					if (this.getUnitsAt(new 棋盘点位(startR + i * stepR, startC + i * stepC)).length > 0) {
						screens++;
					}
				}
				const targetUnits = this.getUnitsAt(pos);
				if (unit instanceof Che) {
					return screens === 0;
				}
				if (unit instanceof Pao) {
					return targetUnits.length > 0 && screens === 1 || targetUnits.length === 0
								 && screens === 0;
				}
				return false;
			});
		}

		return potentialPositions;
	}

	isKingInCheck(player) {
		const king = this.units.find(u => u instanceof Jiang && u.player === player);
		if (!king) {
			return false;
		}

		const opponents = this.units.filter(u => u.player !== player);
		for (const opponentUnit of opponents) {
			// 使用不触发事件的内部方法来计算攻击范围
			const validAttacks = this._getValidMovesForUnit_internal(opponentUnit);
			if (validAttacks.some(pos => pos.isEqualTo(king.position))) {
				console.log(`[将军!] ${player.name} 的王被 ${opponentUnit.label} 将军了`);
				return true;
			}
		}

		return false;
	}
}

class GameLauncher {
	launch() {
		const players = [
			new Player(1, '红方玩家', 红方),
			new Player(2, '黑方玩家', 黑方)
		];
		const config = {
			players: players,
			setup: parseMapSetup(VISUAL_MAP_LAYOUT)
		};
		const game = new 象棋(config, new EventBus());
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
		game.eventBus.on('unit:after-move', this.onAfterMove.bind(this));
	}

	onAfterMove({game, captured}) {
		const capturedUnit = captured[0];
		if (capturedUnit) {
			game.removeUnitFromGame(capturedUnit);
			game.eventBus.emit('unit:captured', {game, captured: capturedUnit});
		}
	}
}

class GameOverRule {
	constructor(game) {
		game.eventBus.on('unit:captured', this.onUnitCaptured.bind(this));
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
		game.eventBus.on('player-turn:starting', this.onPlayerTurnStart.bind(this));
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

	// 注意：这里的规则顺序很重要

	// 规则1：基础移动过滤 (己方、边界等)
	eventBus.on('moveset:filter', context => {
		const {unit, potentialPositions} = context;
		context.potentialPositions = potentialPositions.filter(pos => {
			const targetUnits = game.getUnitsAt(pos);
			return !targetUnits.some(u => u.player === unit.player);
		});
	});

	// 规则2：棋子专属规则 (马腿, 象眼, 九宫等)
	eventBus.on('moveset:filter', context => {
		const {unit, potentialPositions} = context;
		if (unit instanceof Ma) {
			context.potentialPositions = potentialPositions.filter(pos => {
				const dr = pos.r - unit.position.r, dc = pos.c - unit.position.c;
				let legR, legC;
				if (Math.abs(dr) === 2 && Math.abs(dc) === 1) {
					legR = unit.position.r + dr / 2;
					legC = unit.position.c;
				} else if (Math.abs(dr) === 1 && Math.abs(dc) === 2) {
					legR = unit.position.r;
					legC = unit.position.c + dc / 2;
				} else {
					return true;
				}
				return game.getUnitsAt(new 棋盘点位(legR, legC)).length === 0;
			});
		}
		if (unit instanceof Xiang) {
			context.potentialPositions = potentialPositions.filter(pos => {
				const eyeR = (unit.position.r + pos.r) / 2, eyeC = (unit.position.c + pos.c) / 2;
				return game.getUnitsAt(new 棋盘点位(eyeR, eyeC)).length === 0;
			});
		}
		if (unit instanceof Jiang || unit instanceof Shi) {
			const palace = unit.player.team.id === 1 ? {minR: 8, maxR: 10, minC: 4, maxC: 6} : {
				minR: 1,
				maxR: 3,
				minC: 4,
				maxC: 6
			};
			context.potentialPositions = potentialPositions.filter(
				pos => pos.r >= palace.minR && pos.r <= palace.maxR && pos.c >= palace.minC && pos.c <= palace.maxC);
		}
		if (unit instanceof Xiang) {
			context.potentialPositions = potentialPositions.filter(
				pos => !(unit.player.team.id === 1 && pos.r < 6 || unit.player.team.id === 2 && pos.r > 5));
		}
	});

	// 规则3：车、炮的路径
	eventBus.on('moveset:filter', context => {
		const {game, unit, potentialPositions} = context;
		if (!(unit instanceof Pao) && !(unit instanceof Che)) {
			return;
		}
		context.potentialPositions = potentialPositions.filter(pos => {
			const {r: startR, c: startC} = unit.position;
			const distance = Math.max(Math.abs(pos.r - startR), Math.abs(pos.c - startC));
			const stepR = distance === 0 ? 0 : (pos.r - startR) / distance,
				stepC = distance === 0 ? 0 : (pos.c - startC) / distance;
			let screens = 0;
			for (let i = 1; i < distance; i++) {
				if (game.getUnitsAt(new 棋盘点位(startR + i * stepR, startC + i * stepC)).length > 0) {
					screens++;
				}
			}
			const targetUnits = game.getUnitsAt(pos);
			if (unit instanceof Che) {
				return screens === 0;
			}
			if (unit instanceof Pao) {
				return targetUnits.length > 0 && screens === 1 || targetUnits.length === 0 && screens
							 === 0;
			}
			return false;
		});
	});

	// 规则4：最终规则 - 不能“送将”或“应将”
	// eventBus.on('moveset:filter', context => {
	// 	const {game, unit, potentialPositions} = context;
	// 	const player = unit.player;
	// 	context.potentialPositions = potentialPositions.filter(pos => {
	// 		const originalPos = unit.position;
	// 		const targetUnits = game.getUnitsAt(pos);
	// 		const capturedUnit = targetUnits[0];
	//
	// 		if (capturedUnit) {
	// 			game.removeUnitFromGame(capturedUnit);
	// 		}
	// 		game.map.moveUnit(unit, pos);
	//
	// 		const isSelfInCheck = game.isKingInCheck(player);
	//
	// 		game.map.moveUnit(unit, originalPos);
	// 		if (capturedUnit) {
	// 			game.units.push(capturedUnit);
	// 			game.map.addUnit(capturedUnit, pos);
	// 		}
	//
	// 		return !isSelfInCheck;
	// 	});
	// });
}

// #endregion

// #region ############# 象棋棋子和技能定义 #############

class 棋子 extends Unit {
	get cssClass() {
		return ['unit', this.player.team.id === 1 ? 'red' : 'black'];
	}
}

class CheMove extends Move {
	getPotentialPositions() {
		const m = [], {r, c} = this.unit.position;
		for (let i = 1; i <= 10; i++) {
			if (i !== r) {
				m.push(new 棋盘点位(i, c));
			}
		}
		for (let i = 1; i <= 9; i++) {
			if (i !== c) {
				m.push(new 棋盘点位(r, i));
			}
		}
		return m;
	}
}

class PaoMove extends CheMove {
}

class MaMove extends Move {
	getPotentialPositions() {
		const {r, c} = this.unit.position;
		return [
			[r - 2, c - 1], [r - 2, c + 1],
			[r + 2, c - 1], [r + 2, c + 1],
			[r - 1, c - 2], [r - 1, c + 2],
			[r + 1, c - 2], [r + 1, c + 2]
		].filter(([tr, tc]) => tr >= 1 && tr <= 10 && tc >= 1 && tc <= 9)
		.map(([tr, tc]) => new 棋盘点位(tr, tc));
	}
}

class XiangMove extends Move {
	getPotentialPositions() {
		const {r, c} = this.unit.position;
		return [[r - 2, c - 2], [r - 2, c + 2], [r + 2, c - 2], [r + 2, c + 2]]
		.filter(
			([tr, tc]) => tr >= 1 && tr <= 10 && tc >= 1 && tc <= 9).map(([tr, tc]) => new 棋盘点位(tr, tc));
	}
}

class ShiMove extends Move {
	getPotentialPositions() {
		const {r, c} = this.unit.position;
		return [[r - 1, c - 1], [r - 1, c + 1], [r + 1, c - 1], [r + 1, c + 1]].filter(
			([tr, tc]) => tr >= 1 && tr <= 10 && tc >= 1 && tc <= 9).map(([tr, tc]) => new 棋盘点位(tr, tc));
	}
}

class JiangMove extends Move {
	getPotentialPositions() {
		const {r, c} = this.unit.position;
		return [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].filter(
			([tr, tc]) => tr >= 1 && tr <= 10 && tc >= 1 && tc <= 9).map(([tr, tc]) => new 棋盘点位(tr, tc));
	}
}

class BingMove extends Move {
	getPotentialPositions() {
		const {r, c} = this.unit.position;
		const player = this.unit.player;
		const f = player.team.id === 1 ? -1 : 1;
		const river = player.team.id === 1 && r <= 5 || player.team.id === 2 && r >= 6;
		const m = [new 棋盘点位(r + f, c)];
		if (river) {
			m.push(new 棋盘点位(r, c - 1));
			m.push(new 棋盘点位(r, c + 1));
		}
		return m.filter(pos => pos.r >= 1 && pos.r <= 10 && pos.c >= 1 && pos.c <= 9);
	}
}

class Che extends 棋子 {
	constructor(p, l, pos) {
		super(p, l, pos);
	}

	initSkills() {
		this.skills.push(new CheMove(this));
	}
}

class Pao extends 棋子 {
	constructor(p, l, pos) {
		super(p, l, pos);
	}

	initSkills() {
		this.skills.push(new PaoMove(this));
	}
}

class Ma extends 棋子 {
	constructor(p, l, pos) {
		super(p, l, pos);
	}

	initSkills() {
		this.skills.push(new MaMove(this));
	}
}

class Xiang extends 棋子 {
	constructor(p, l, pos) {
		super(p, l, pos);
	}

	initSkills() {
		this.skills.push(new XiangMove(this));
	}
}

class Shi extends 棋子 {
	constructor(p, l, pos) {
		super(p, l, pos);
	}

	initSkills() {
		this.skills.push(new ShiMove(this));
	}
}

class Jiang extends 棋子 {
	constructor(p, l, pos) {
		super(p, l, pos);
	}

	initSkills() {
		this.skills.push(new JiangMove(this));
	}
}

class Bing extends 棋子 {
	constructor(p, l, pos) {
		super(p, l, pos);
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
/**
 * ====================================
 * 通用回合制游戏框架 (Turn-based Game Framework)
 * ====================================
 */

class EventBus {
	constructor() {
		this.listeners = {};
	}

	on(event, listener) {
		if (!this.listeners[event]) {
			this.listeners[event] = [];
		}
		this.listeners[event].push(listener);
	}

	off(event, listener) {
		if (this.listeners[event]) {
			this.listeners[event] = this.listeners[event].filter(cb => cb !== listener);
		}
	}

	emit(event, context) {
		console.log(`[事件]: ${event}`, context);
		if (this.listeners[event]) {
			this.listeners[event].forEach(listener => {
				try {
					listener(context);
				} catch (e) {
					console.error(`事件 ${event} 的监听器执行出错:`, e);
				}
			});
		}
	}
}

class Game {
	constructor(config, eventBus) {
		this.eventBus = eventBus;
		this.players = config.players || [];
		this.board = this.createBoard();
		this.units = [];
		this.rounds = [];
		this.curRound = null;
		this.isGameOver = false;
		this.winner = null;

		// 模板方法：由子类实现具体逻辑
		this.initUnits(config.boardSetup);
		this.registerGameRules();
	}

	async start() {
		this.eventBus.emit('game:starting', {game: this});
		while (!this.isGameOver) {
			const round = this.newRound();
			this.rounds.push(round);
			this.curRound = round;
			await this.curRound.start();
		}
		this.eventBus.emit('game:over', {game: this, winner: this.winner});
	}

	newRound() {
		const roundId = this.rounds.length + 1;
		return new Round(roundId, this);
	}

	// 模板方法，由子类实现
	createBoard() {
		throw new Error("createBoard() must be implemented by subclass");
	}

	// 模板方法，由子类实现
	initUnits(setup) {
		throw new Error("initUnits() must be implemented by subclass");
	}

	// 模板方法，由子类实现
	registerGameRules() {
		throw new Error("registerGameRules() must be implemented by subclass");
	}

	onPlayerInput({r, c}) {
		const curAction = this.curRound.curPlayerAction;
		if (this.isGameOver || !curAction) {
			return;
		}

		const unitAtPosition = this.getUnitAt(r, c);
		const curPlayer = curAction.player;

		if (curAction.selectedUnit) {
			if (unitAtPosition && unitAtPosition.player === curPlayer) {
				curAction.selectedUnit = unitAtPosition;
				this.eventBus.emit('unit:selected', {game: this, action: curAction});
				return;
			}
			const isPositionValid = curAction.validPositions.some(position => position[0] === r && position[1] === c);
			if (!isPositionValid) {
				curAction.selectedUnit = null;
				curAction.validPositions = [];
				this.eventBus.emit('unit:deselected', {game: this, action: curAction});
				return;
			}

			const from = {r: curAction.selectedUnit.r, c: curAction.selectedUnit.c};
			const targetUnit = this.getUnitAt(r, c);
			const movedUnit = curAction.selectedUnit;

			const newBoard = this.board.map(row => [...row]);
			movedUnit.moveTo(r, c);
			newBoard[from.r - 1][from.c - 1] = null;
			newBoard[r - 1][c - 1] = movedUnit;
			this.board = newBoard;

			this.eventBus.emit('board:updated', this.board);
			this.eventBus.emit('unit:after-move', {game: this, unit: movedUnit, captured: targetUnit});
		} else {
			if (unitAtPosition && unitAtPosition.player === curPlayer) {
				curAction.selectedUnit = unitAtPosition;
				this.eventBus.emit('unit:selected', {game: this, action: curAction});
			}
		}
	}

	getUnitAt(r, c) {
		if (r < 1 || r > this.board.length || c < 1 || c > this.board[0].length) {
			return null;
		}
		return this.board[r - 1][c - 1];
	}

	removeUnitFromList(unit) {
		if (!unit) {
			return;
		}
		const index = this.units.findIndex(u => u.id === unit.id);
		if (index > -1) {
			this.units.splice(index, 1);
		}
	}
}

class Round {
	constructor(id, game) {
		this.id = id;
		this.game = game;
		this.playerActions = [];
		this.curPlayerAction = null;
	}

	async start() {
		this.game.eventBus.emit('round:starting', {game: this.game, round: this});
		for (const player of this.game.players) {
			if (this.game.isGameOver) {
				break;
			}
			const playerAction = new PlayerAction(player, this.game);
			this.playerActions.push(playerAction);
			this.curPlayerAction = playerAction;
			await this.curPlayerAction.execute();
		}
		this.game.eventBus.emit('round:ended', {game: this.game, round: this});
	}
}

class PlayerAction {
	constructor(player, game) {
		this.player = player;
		this.game = game;
		this.selectedUnit = null;
		this.validPositions = [];
	}

	execute() {
		return new Promise(resolve => {
			this.game.eventBus.emit('player-action:starting', {game: this.game, action: this});
			const onMoved = () => {
				this.game.eventBus.off('unit:after-move', onMoved);
				this.end();
				resolve();
			};
			this.game.eventBus.on('unit:after-move', onMoved);
		});
	}

	end() {
		this.selectedUnit = null;
		this.validPositions = [];
		this.game.eventBus.emit('player-action:ended', {game: this.game, action: this});
	}
}

class Player {
	constructor(id) {
		this.id = id;
		this.game = null; // 由 Game 类在构造时注入
	}

	play(r, c) {
		const expectedPlayer = this.game.curRound.curPlayerAction.player;
		if (expectedPlayer === this) {
			this.game.eventBus.emit('player:input', {r, c});
		} else {
			console.warn(`非玩家 ${this.id} 的行动时间，操作无效。`);
		}
	}
}

class Unit {
	constructor(player, label, r, c) {
		this.player = player;
		this.label = label;
		this.r = r;
		this.c = c;
		this.skills = [];
		this.id = `p${player.id}_${label}_${Date.now()}_${Math.random()}`;
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
		return ['piece', `player-${this.player.id}`];
	}
}

class Skill {
	constructor(unit) {
		this.unit = unit;
	}
}

class Move extends Skill {
	getPotentialPositions() {
		return [];
	}
}

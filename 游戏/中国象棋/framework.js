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
		this.map = this.createMap(config);
		this.units = [];
		this.rounds = [];
		this.curRound = null;
		this.isGameOver = false;
		this.winner = null;
		this.selectedUnit = null;

		this.initUnits(config.setup);
		this.registerGameRules(config);
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

	createMap(config) {
		throw new Error("createMap() must be implemented by subclass");
	}

	initUnits(setup) {
		throw new Error("initUnits() must be implemented by subclass");
	}

	registerGameRules(config) {
		throw new Error("registerGameRules() must be implemented by subclass");
	}

	getUnitsAt(position) {
		return this.map.getUnitsAt(position);
	}

	removeUnitFromGame(unit) {
		if (!unit) {
			return;
		}
		this.map.removeUnit(unit);
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
		this.playerTurns = [];
		this.curPlayerTurn = null;
	}

	async start() {
		this.game.eventBus.emit('round:starting', {game: this.game, round: this});
		for (const player of this.game.players) {
			if (this.game.isGameOver) {
				break;
			}

			const playerTurn = new PlayerTurn(player, this.game);
			this.playerTurns.push(playerTurn);
			this.curPlayerTurn = playerTurn;

			const inputHandler = context => player.handleInput(context.position);
			this.game.eventBus.on('player:input', inputHandler);

			await playerTurn.execute();

			this.game.eventBus.off('player:input', inputHandler);
		}
		this.game.eventBus.emit('round:ended', {game: this.game, round: this});
	}
}

class PlayerTurn {
	constructor(player, game) {
		this.player = player;
		this.game = game;
		this.selectedUnit = null;
		this.validPositions = [];
	}

	execute() {
		return new Promise(resolve => {
			this.game.eventBus.emit('player-turn:starting', {game: this.game, action: this});
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
		this.game.eventBus.emit('player-turn:ended', {game: this.game, action: this});
	}
}

class Team {
	constructor(id, name) {
		this.id = id;
		this.name = name;
	}
}

class Player {
	constructor(id, name, team) {
		this.id = id;
		this.name = name;
		this.team = team;
		this.game = null;
	}

	handleInput(position) {
		const game = this.game;
		const curTurn = game.curRound.curPlayerTurn;

		if (curTurn.player.id !== this.id) {
			return;
		}

		const unitsAtPosition = [...game.map.getUnitsAt(position)];

		if (curTurn.selectedUnit) {
			const targetUnit = unitsAtPosition[0];
			if (targetUnit && targetUnit.player === this) {
				curTurn.selectedUnit = targetUnit;
				game.eventBus.emit('unit:selected', {game: game, action: curTurn});
				return;
			}
			const isPositionValid = curTurn.validPositions.some(pos => pos.isEqualTo(position));
			if (!isPositionValid) {
				curTurn.selectedUnit = null;
				curTurn.validPositions = [];
				game.eventBus.emit('unit:deselected', {game: game, action: curTurn});
				return;
			}

			const movedUnit = curTurn.selectedUnit;
			game.map.moveUnit(movedUnit, position);
			game.eventBus.emit('map:updated', game.map);
			game.eventBus.emit('unit:after-move', {game: game, unit: movedUnit, captured: unitsAtPosition});
		} else {
			const targetUnit = unitsAtPosition[0];
			if (targetUnit && targetUnit.player === this) {
				curTurn.selectedUnit = targetUnit;
				game.eventBus.emit('unit:selected', {game: game, action: curTurn});
			}
		}
	}
}

class Position {
	toString() {
		throw new Error("toString() must be implemented by subclass for use as a Map key.");
	}

	isEqualTo(otherPosition) {
		return this.toString() === otherPosition.toString();
	}
}

class 棋盘点位 extends Position {
	constructor(r, c) {
		super();
		this.r = r;
		this.c = c;
	}

	toString() {
		return `${this.r},${this.c}`;
	}
}

class GameMap {
	constructor() {
		this.units = new Map(); // 使用Map来存储单位，key为Position的字符串，value为Unit数组
	}

	getUnitsAt(position) {
		return this.units.get(position.toString()) || [];
	}

	addUnit(unit, position) {
		const posKey = position.toString();
		if (!this.units.has(posKey)) {
			this.units.set(posKey, []);
		}
		this.units.get(posKey).push(unit);
		unit.position = position;
	}

	removeUnit(unit) {
		if (!unit || !unit.position) {
			return;
		}
		const posKey = unit.position.toString();
		const unitsAtPos = this.units.get(posKey);
		if (unitsAtPos) {
			const index = unitsAtPos.findIndex(u => u.id === unit.id);
			if (index > -1) {
				unitsAtPos.splice(index, 1);
			}
		}
	}

	moveUnit(unit, newPosition) {
		this.removeUnit(unit);
		this.addUnit(unit, newPosition);
	}
}

class Unit {
	constructor(player, label, position) {
		this.player = player;
		this.label = label;
		this.position = position;
		this.skills = [];
		this.id = `u_${player.id}_${label}_${Date.now()}_${Math.random()}`;
		this.initSkills();
	}

	initSkills() {
		this.skills.push(new Move(this));
	}

	getSkill(skillClass) {
		return this.skills.find(s => s instanceof skillClass);
	}

	moveTo(newPosition) {
		this.position = newPosition;
	}

	get cssClass() {
		return ['unit', `player-${this.player.id}`];
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

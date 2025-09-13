/**
 * ====================================
 * 通用回合制游戏框架 (Turn-based Game Framework)
 * ====================================
 */

// #region ############# 框架核心类 #############

class Game {
	constructor(config = {}) {
		this.players = config.players || [];
		this.board = config.board || new Board();
		this.ruleEngine = new RuleEngine(this, config.rules || []);

		this.players.forEach(p => p.game = this);

		this.rounds = [];
		this.currentRound = null;
		this.selectedPiece = null;
		this.isGameOver = false;

		if (config.setup) {
			this.board.setupPieces(config.setup, this.players);
		}

		this.startNewRound();
	}

	get currentPlayer() {
		return this.currentRound ? this.currentRound.activePlayer : null;
	}

	startNewRound() {
		const newRoundNumber = this.rounds.length + 1;
		this.currentRound = new Round(newRoundNumber, this);
		this.rounds.push(this.currentRound);
	}

	movePiece(piece, r, c) {
		const { r: oldR, c: oldC } = piece.position;

		this.board.movePiece(piece, r, c);
		this.currentRound.moves.push({ piece, from: [oldR, oldC], to: [r, c] });

		this.deselectPiece();

		if (this.ruleEngine.isGameOver()) {
			this.isGameOver = true;
			console.log(`游戏结束! 玩家 ${this.currentPlayer.id} 胜利!`);
		} else {
			const roundCompleted = this.currentRound.advance();
			if (roundCompleted) {
				this.startNewRound();
			}
		}
	}

	selectPiece(piece) {
		this.selectedPiece = piece;
	}

	deselectPiece() {
		this.selectedPiece = null;
	}
}

class Round {
	constructor(number, game) {
		this.number = number;
		this.game = game;
		this.moves = [];
		this.activePlayer = game.players[0];
	}

	advance() {
		const currentPlayerIndex = this.game.players.indexOf(this.activePlayer);
		const nextPlayerIndex = (currentPlayerIndex + 1) % this.game.players.length;
		this.activePlayer = this.game.players[nextPlayerIndex];
		// 如果回到了第一个玩家，说明一个完整的回合结束了
		return nextPlayerIndex === 0;
	}
}

class Player {
	constructor(id) {
		this.id = id;
		this.game = null; // 由 Game 类在构造时注入
	}

	handleCellClick(r, c) {
		const game = this.game;
		if (game.currentPlayer !== this) return;

		const targetPiece = game.board.getPieceAt(r, c);
		const selectedPiece = game.selectedPiece;

		if (selectedPiece) {
			if (targetPiece && targetPiece.player === this) {
				game.selectPiece(targetPiece);
			} else {
				if (game.ruleEngine.isMoveValid(selectedPiece, r, c)) {
					game.movePiece(selectedPiece, r, c);
				} else {
					game.deselectPiece();
				}
			}
		} else {
			if (targetPiece && targetPiece.player === this) {
				game.selectPiece(targetPiece);
			}
		}
	}
}

class Board {
	constructor(rows, cols) {
		this.rows = rows;
		this.cols = cols;
		this.grid = Array(rows).fill(null).map(() => Array(cols).fill(null));
	}

	getPieceAt(r, c) {
		if (r < 1 || r > this.rows || c < 1 || c > this.cols) return null;
		return this.grid[r - 1][c - 1];
	}

	addPiece(piece, r, c) {
		pierce.position = { r, c };
		this.grid[r - 1][c - 1] = piece;
	}

	movePiece(piece, r, c) {
		const { r: oldR, c: oldC } = piece.position;
		this.grid[oldR - 1][oldC - 1] = null;
		this.addPiece(piece, r, c);
	}

	setupPieces(setup, players) {
		for (const pieceConfig of setup) {
			const { pieceFactory, player, r, c } = pieceConfig;
			const playerInstance = players.find(p => p.id === player);
			if (playerInstance) {
				this.addPiece(pieceFactory(playerInstance), r, c);
			}
		}
	}
}

class Piece {
	constructor(player, name) {
		this.player = player;
		this.name = name;
		this.position = { r: 0, c: 0 };
		this.actions = [];
		this.id = `p${player.id}_${name}_${Math.random()}`;
		this.initActions();
	}

	initActions() {}

	getAction(actionClass) {
		return this.actions.find(a => a instanceof actionClass);
	}

	get cssClass() {
		return ['piece', `player-${this.player.id}`];
	}
}

class Action {
	constructor(piece) {
		this.piece = piece;
	}
}

class MoveAction extends Action {
	getPotentialMoves() {
		return [];
	}
}

// #endregion

// #region ############# 框架规则引擎 #############

class Rule {
	constructor(game) {
		this.game = game;
	}

	evaluate(context) {
		return true;
	}
}

class RuleEngine {
	constructor(game, ruleClasses = []) {
		this.game = game;
		this.moveValidationRules = [];
		this.gameOverRules = [];

		ruleClasses.forEach(RuleClass => {
			const rule = new RuleClass(game);
			if (rule.type === 'move') {
				this.moveValidationRules.push(rule);
			} else if (rule.type === 'gameOver') {
				this.gameOverRules.push(rule);
			}
		});
	}

	getValidMovesForPiece(piece) {
		if (!piece) return [];
		const moveAction = piece.getAction(MoveAction);
		if (!moveAction) return [];

		const potentialMoves = moveAction.getPotentialMoves();
		return potentialMoves.filter(move => this.isMoveValid(piece, move[0], move[1]));
	}

	isMoveValid(piece, r, c) {
		const context = { piece, r, c };
		for (const rule of this.moveValidationRules) {
			if (!rule.evaluate(context)) {
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

// #endregion

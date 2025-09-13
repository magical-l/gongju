/**
 * ====================================
 * 中国象棋 (Xiangqi) - 游戏实现
 * ====================================
 */

// #region ############# 象棋棋子定义 #############

class XiangqiPiece extends Piece {
    get cssClass() {
        // 象棋的样式是红与黑，而不是 player-1, player-2
		return ['piece', this.player.id === 1 ? 'red' : 'black'];
	}
}

class Che extends XiangqiPiece {
	constructor(player) {
		super(player, player.id === 1 ? '\u{1FA64}' : '\u{1FA6B}');
	}
	initActions() {
		this.actions.push(new CheMove(this));
	}
}

class Ma extends XiangqiPiece {
	constructor(player) {
		super(player, player.id === 1 ? '\u{1FA63}' : '\u{1FA6A}');
	}
	initActions() {
		this.actions.push(new MaMove(this));
	}
}

class Xiang extends XiangqiPiece {
	constructor(player) {
		super(player, player.id === 1 ? '\u{1FA62}' : '\u{1FA69}');
	}
	initActions() {
		this.actions.push(new XiangMove(this));
	}
}

class Shi extends XiangqiPiece {
	constructor(player) {
		super(player, player.id === 1 ? '\u{1FA61}' : '\u{1FA68}');
	}
	initActions() {
		this.actions.push(new ShiMove(this));
	}
}

class Jiang extends XiangqiPiece {
	constructor(player) {
		super(player, player.id === 1 ? '\u{1FA60}' : '\u{1FA67}');
	}
	initActions() {
		this.actions.push(new JiangMove(this));
	}
}

class Pao extends XiangqiPiece {
	constructor(player) {
		super(player, player.id === 1 ? '\u{1FA65}' : '\u{1FA6C}');
	}
	initActions() {
		this.actions.push(new CheMove(this)); // 炮和车的潜在移动轨迹一样
	}
}

class Bing extends XiangqiPiece {
	constructor(player) {
		super(player, player.id === 1 ? '\u{1FA66}' : '\u{1FA6D}');
	}
	initActions() {
		this.actions.push(new BingMove(this));
	}
}

// #endregion

// #region ############# 象棋移动动作定义 #############

class CheMove extends MoveAction {
	getPotentialMoves() {
		const moves = [];
        const { r, c } = this.piece.position;
		for (let i = 1; i <= 10; i++) moves.push([i, c]);
		for (let i = 1; i <= 9; i++) moves.push([r, i]);
		return moves.filter(m => m[0] !== r || m[1] !== c);
	}
}

class MaMove extends MoveAction {
	getPotentialMoves() {
		const { r, c } = this.piece.position;
		return [
			[r - 2, c - 1], [r - 2, c + 1],
			[r + 2, c - 1], [r + 2, c + 1],
			[r - 1, c - 2], [r - 1, c + 2],
			[r + 1, c - 2], [r + 1, c + 2],
		];
	}
}

class XiangMove extends MoveAction {
	getPotentialMoves() {
		const { r, c } = this.piece.position;
		return [
			[r - 2, c - 2], [r - 2, c + 2],
			[r + 2, c - 2], [r + 2, c + 2],
		];
	}
}

class ShiMove extends MoveAction {
	getPotentialMoves() {
		const { r, c } = this.piece.position;
		return [
			[r - 1, c - 1], [r - 1, c + 1],
			[r + 1, c - 1], [r + 1, c + 1],
		];
	}
}

class JiangMove extends MoveAction {
	getPotentialMoves() {
		const { r, c } = this.piece.position;
		const moves = [
			[r - 1, c], [r + 1, c],
			[r, c - 1], [r, c + 1],
		];
        // 飞将规则的潜在移动也在这里定义
        const opponentGeneral = this.piece.player.game.board.grid.flat().find(p => p instanceof Jiang && p.player !== this.piece.player);
		if (opponentGeneral) moves.push([opponentGeneral.position.r, opponentGeneral.position.c]);
		return moves;
	}
}

class BingMove extends MoveAction {
	getPotentialMoves() {
		const { r, c } = this.piece.position;
        const player = this.piece.player;
		const forward = player.id === 1 ? -1 : 1;
		const hasCrossedRiver = (player.id === 1 && r <= 5) || (player.id === 2 && r >= 6);
		const moves = [[r + forward, c]];
		if (hasCrossedRiver) {
			moves.push([r, c - 1], [r, c + 1]);
		}
		return moves;
	}
}

// #endregion

// #region ############# 象棋规则定义 #############

class BoundsRule extends Rule {
    constructor(game) { super(game); this.type = 'move'; }
    evaluate({ r, c }) {
        return r >= 1 && r <= 10 && c >= 1 && c <= 9;
    }
}

class BasicMoveShapeRule extends Rule {
    constructor(game) { super(game); this.type = 'move'; }
	evaluate({ piece, r, c }) {
		const moveAction = piece.getAction(MoveAction);
		if (!moveAction) return false;
		return moveAction.getPotentialMoves().some(move => move[0] === r && move[1] === c);
	}
}

class LineOfSightRule extends Rule {
    constructor(game) { super(game); this.type = 'move'; }
    evaluate({ piece, r, c }) {
        if (!(piece instanceof Che) && !(piece instanceof Pao)) return true;
        const { r: startR, c: startC } = piece.position;
        if (startR !== r && startC !== c) return true;

        const screens = [];
        const distance = Math.max(Math.abs(r - startR), Math.abs(c - startC));
        const stepR = (r - startR) / distance;
        const stepC = (c - startC) / distance;

        for (let i = 1; i < distance; i++) {
            if (this.game.board.getPieceAt(startR + i * stepR, startC + i * stepC)) {
                screens.push(piece);
            }
        }

        const targetPiece = this.game.board.getPieceAt(r, c);
        if (piece instanceof Che) return screens.length === 0;
        if (piece instanceof Pao) return (targetPiece && screens.length === 1) || (!targetPiece && screens.length === 0);
        return true;
    }
}

class FriendlyFireRule extends Rule {
    constructor(game) { super(game); this.type = 'move'; }
	evaluate({ piece, r, c }) {
		const targetPiece = this.game.board.getPieceAt(r, c);
		return !(targetPiece && targetPiece.player === piece.player);
	}
}

class HorseLegRule extends Rule {
    constructor(game) { super(game); this.type = 'move'; }
	evaluate({ piece, r, c }) {
		if (!(piece instanceof Ma)) return true;
        const { r: startR, c: startC } = piece.position;
		const dr = r - startR, dc = c - startC;
		let legR, legC;
		if (Math.abs(dr) === 2 && Math.abs(dc) === 1) { legR = startR + dr / 2; legC = startC; }
		else if (Math.abs(dr) === 1 && Math.abs(dc) === 2) { legR = startR; legC = startC + dc / 2; }
		else return true;
		return !this.game.board.getPieceAt(legR, legC);
	}
}

class ElephantEyeRule extends Rule {
    constructor(game) { super(game); this.type = 'move'; }
	evaluate({ piece, r, c }) {
		if (!(piece instanceof Xiang)) return true;
		const eyeR = (piece.position.r + r) / 2;
		const eyeC = (piece.position.c + c) / 2;
		return !this.game.board.getPieceAt(eyeR, eyeC);
	}
}

class PalaceAndRiverRule extends Rule {
    constructor(game) { super(game); this.type = 'move'; }
	evaluate({ piece, r, c }) {
		if (piece instanceof Jiang || piece instanceof Shi) {
			const palace = piece.player.id === 1 ? {minR: 8, maxR: 10, minC: 4, maxC: 6} : {minR: 1, maxR: 3, minC: 4, maxC: 6};
			if (r < palace.minR || r > palace.maxR || c < palace.minC || c > palace.maxC) return false;
		}
		if (piece instanceof Xiang) {
			if ((piece.player.id === 1 && r < 6) || (piece.player.id === 2 && r > 5)) return false;
		}
		return true;
	}
}

class FlyingGeneralRule extends Rule {
    constructor(game) { super(game); this.type = 'move'; }
	evaluate({ piece, r, c }) {
		if (piece instanceof Jiang && this.game.board.getPieceAt(r, c) instanceof Jiang) {
			if (piece.position.c !== c) return false;
			const startR = Math.min(piece.position.r, r) + 1, endR = Math.max(piece.position.r, r);
			for (let i = startR; i < endR; i++) {
				if (this.game.board.getPieceAt(i, c)) return false;
			}
			return true;
		}
		return true;
	}
}

class CheckmateRule extends Rule {
    constructor(game) { super(game); this.type = 'gameOver'; }
	evaluate() {
		const generals = this.game.board.grid.flat().filter(p => p instanceof Jiang);
		return generals.length < 2;
	}
}

// #endregion

// #region ############# 游戏创建工厂 #############

const XIANGQI_RULES = [
    BoundsRule,
    BasicMoveShapeRule,
    LineOfSightRule,
    FriendlyFireRule,
    HorseLegRule,
    ElephantEyeRule,
    PalaceAndRiverRule,
    FlyingGeneralRule,
    CheckmateRule,
];

const DEFAULT_XIANGQI_SETUP = [
    { pieceFactory: (p) => new Che(p), player: 1, r: 10, c: 1 }, { pieceFactory: (p) => new Ma(p), player: 1, r: 10, c: 2 },
    { pieceFactory: (p) => new Xiang(p), player: 1, r: 10, c: 3 }, { pieceFactory: (p) => new Shi(p), player: 1, r: 10, c: 4 },
    { pieceFactory: (p) => new Jiang(p), player: 1, r: 10, c: 5 }, { pieceFactory: (p) => new Shi(p), player: 1, r: 10, c: 6 },
    { pieceFactory: (p) => new Xiang(p), player: 1, r: 10, c: 7 }, { pieceFactory: (p) => new Ma(p), player: 1, r: 10, c: 8 },
    { pieceFactory: (p) => new Che(p), player: 1, r: 10, c: 9 }, { pieceFactory: (p) => new Pao(p), player: 1, r: 8, c: 2 },
    { pieceFactory: (p) => new Pao(p), player: 1, r: 8, c: 8 }, { pieceFactory: (p) => new Bing(p), player: 1, r: 7, c: 1 },
    { pieceFactory: (p) => new Bing(p), player: 1, r: 7, c: 3 }, { pieceFactory: (p) => new Bing(p), player: 1, r: 7, c: 5 },
    { pieceFactory: (p) => new Bing(p), player: 1, r: 7, c: 7 }, { pieceFactory: (p) => new Bing(p), player: 1, r: 7, c: 9 },

    { pieceFactory: (p) => new Che(p), player: 2, r: 1, c: 1 }, { pieceFactory: (p) => new Ma(p), player: 2, r: 1, c: 2 },
    { pieceFactory: (p) => new Xiang(p), player: 2, r: 1, c: 3 }, { pieceFactory: (p) => new Shi(p), player: 2, r: 1, c: 4 },
    { pieceFactory: (p) => new Jiang(p), player: 2, r: 1, c: 5 }, { pieceFactory: (p) => new Shi(p), player: 2, r: 1, c: 6 },
    { pieceFactory: (p) => new Xiang(p), player: 2, r: 1, c: 7 }, { pieceFactory: (p) => new Ma(p), player: 2, r: 1, c: 8 },
    { pieceFactory: (p) => new Che(p), player: 2, r: 1, c: 9 }, { pieceFactory: (p) => new Pao(p), player: 2, r: 3, c: 2 },
    { pieceFactory: (p) => new Pao(p), player: 2, r: 3, c: 8 }, { pieceFactory: (p) => new Bing(p), player: 2, r: 4, c: 1 },
    { pieceFactory: (p) => new Bing(p), player: 2, r: 4, c: 3 }, { pieceFactory: (p) => new Bing(p), player: 2, r: 4, c: 5 },
    { pieceFactory: (p) => new Bing(p), player: 2, r: 4, c: 7 }, { pieceFactory: (p) => new Bing(p), player: 2, r: 4, c: 9 },
];

function createXiangqiGame(customConfig = {}) {
    const config = {
        players: [new Player(1), new Player(2)],
        board: new Board(10, 9),
        rules: XIANGQI_RULES,
        setup: customConfig.boardSetup || DEFAULT_XIANGQI_SETUP,
    };

    return new Game(config);
}

// #endregion

/**
 * =================================================================================
 * 新架构核心：事件总线 (Event Bus)
 * =================================================================================
 */
class EventBus {
    constructor() {
        this.listeners = {};
    }
    on(event, callback) {
        if (!this.listeners[event]) { this.listeners[event] = []; }
        this.listeners[event].push(callback);
    }
    off(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        }
    }
    emit(event, data) {
        console.log(`[事件]: ${event}`, data);
        if (this.listeners[event]) {
            this.listeners[event].slice().forEach(callback => {
                try { callback(data); } catch (e) { console.error(`事件 ${event} 的监听器执行出错:`, e); }
            });
        }
    }
}

/**
 * =================================================================================
 * 游戏坐标与棋子定义
 * =================================================================================
 */
const PIECE_MAP = {
    Che: (player, r, c) => new Che(player, r, c),
    Ma: (player, r, c) => new Ma(player, r, c),
    Xiang: (player, r, c) => new Xiang(player, r, c),
    Shi: (player, r, c) => new Shi(player, r, c),
    Jiang: (player, r, c) => new Jiang(player, r, c),
    Pao: (player, r, c) => new Pao(player, r, c),
    Bing: (player, r, c) => new Bing(player, r, c),
};
const DEFAULT_BOARD_SETUP = [
    { piece: 'Che', player: 1, r: 10, c: 1 }, { piece: 'Ma', player: 1, r: 10, c: 2 },
    { piece: 'Xiang', player: 1, r: 10, c: 3 }, { piece: 'Shi', player: 1, r: 10, c: 4 },
    { piece: 'Jiang', player: 1, r: 10, c: 5 }, { piece: 'Shi', player: 1, r: 10, c: 6 },
    { piece: 'Xiang', player: 1, r: 10, c: 7 }, { piece: 'Ma', player: 1, r: 10, c: 8 },
    { piece: 'Che', player: 1, r: 10, c: 9 }, { piece: 'Pao', player: 1, r: 8, c: 2 },
    { piece: 'Pao', player: 1, r: 8, c: 8 }, { piece: 'Bing', player: 1, r: 7, c: 1 },
    { piece: 'Bing', player: 1, r: 7, c: 3 }, { piece: 'Bing', player: 1, r: 7, c: 5 },
    { piece: 'Bing', player: 1, r: 7, c: 7 }, { piece: 'Bing', player: 1, r: 7, c: 9 },
    { piece: 'Che', player: 2, r: 1, c: 1 }, { piece: 'Ma', player: 2, r: 1, c: 2 },
    { piece: 'Xiang', player: 2, r: 1, c: 3 }, { piece: 'Shi', player: 2, r: 1, c: 4 },
    { piece: 'Jiang', player: 2, r: 1, c: 5 }, { piece: 'Shi', player: 2, r: 1, c: 6 },
    { piece: 'Xiang', player: 2, r: 1, c: 7 }, { piece: 'Ma', player: 2, r: 1, c: 8 },
    { piece: 'Che', player: 2, r: 1, c: 9 }, { piece: 'Pao', player: 2, r: 3, c: 2 },
    { piece: 'Pao', player: 2, r: 3, c: 8 }, { piece: 'Bing', player: 2, r: 4, c: 1 },
    { piece: 'Bing', player: 2, r: 4, c: 3 }, { piece: 'Bing', player: 2, r: 4, c: 5 },
    { piece: 'Bing', player: 2, r: 4, c: 7 }, { piece: 'Bing', player: 2, r: 4, c: 9 },
];

/**
 * =================================================================================
 * 核心类：Launcher, Game, Round, PlayerAction, Player
 * =================================================================================
 */

class GameLauncher {
    launch() {
        const config = { boardSetup: DEFAULT_BOARD_SETUP };
        const eventBus = new EventBus();
        const game = new Game(config, eventBus);
        game.start();
        return game;
    }
}

class Game {
    constructor(config, eventBus) {
        this.eventBus = eventBus;
        this.players = [new Player(1, this), new Player(2, this)];
        this.board = this.createBoard();
        this.units = [];
        this.rounds = [];
        this.currentRound = null;
        this.selectedUnit = null;
        this.validMoves = [];
        this.isGameOver = false;
        this.initUnits(config.boardSetup);
        this.registerGameRules();
        this.eventBus.on('player:input', this.handlePlayerInput.bind(this));
        this.eventBus.on('round:ended', this.nextRound.bind(this));
    }

    start() {
        this.eventBus.emit('game:starting', { game: this });
        this.nextRound();
    }

    nextRound() {
        if (this.isGameOver) return;
        const roundNumber = this.rounds.length + 1;
        this.currentRound = new Round(roundNumber, this);
        this.rounds.push(this.currentRound);
        this.currentRound.start();
    }

    handlePlayerInput({ r, c }) {
        if (this.isGameOver || !this.currentRound.currentPlayerAction) return;
        const unitAtPos = this.getUnitAt(r, c);
        const currentPlayer = this.currentRound.currentPlayerAction.player;

        if (!this.selectedUnit) {
            if (unitAtPos && unitAtPos.player === currentPlayer) {
                this.selectedUnit = unitAtPos;
                this.eventBus.emit('unit:selected', { game: this, unit: this.selectedUnit });
            }
        } else {
            if (unitAtPos && unitAtPos.player === currentPlayer) {
                this.selectedUnit = unitAtPos;
                this.eventBus.emit('unit:selected', { game: this, unit: this.selectedUnit });
                return;
            }
            const isMoveValid = this.validMoves.some(move => move[0] === r && move[1] === c);
            if (!isMoveValid) {
                this.selectedUnit = null;
                this.validMoves = [];
                this.eventBus.emit('unit:deselected', { game: this });
                return;
            }

            const from = { r: this.selectedUnit.r, c: this.selectedUnit.c };
            const targetUnit = this.getUnitAt(r, c);
            const movedUnit = this.selectedUnit;

            const newBoard = this.board.map(row => [...row]);
            movedUnit.moveTo(r, c);
            newBoard[from.r - 1][from.c - 1] = null;
            newBoard[r - 1][c - 1] = movedUnit;
            this.board = newBoard;

            this.eventBus.emit('board:updated', this.board);
            this.eventBus.emit('unit:after-move', { game: this, unit: movedUnit, captured: targetUnit });
        }
    }

    createBoard() {
        return Array(10).fill(null).map(() => Array(9).fill(null));
    }

    initUnits(setup) {
        for (const pieceConfig of setup) {
            const { piece, player, r, c } = pieceConfig;
            const playerInstance = this.players.find(p => p.id === player);
            if (playerInstance) {
                const unit = PIECE_MAP[piece](playerInstance, r, c);
                this.board[r - 1][c - 1] = unit;
                this.units.push(unit);
            }
        }
    }

    getUnitAt(r, c) {
        if (r < 1 || r > 10 || c < 1 || c > 9) return null;
        return this.board[r - 1][c - 1];
    }

    removeUnitFromList(unit) {
        if (!unit) return;
        const index = this.units.findIndex(u => u.id === unit.id);
        if (index > -1) this.units.splice(index, 1);
    }

    registerGameRules() {
        new MoveRule(this);
        new CaptureRule(this);
        new GameOverRule(this);
        registerFilterRules(this);
    }
}

class Round {
    constructor(number, game) {
        this.number = number;
        this.game = game;
        this.playerActions = [];
        this.currentPlayerAction = null;
        this.game.eventBus.on('player-action:ended', this.onPlayerActionEnded.bind(this));
    }

    start() {
        this.nextPlayerAction(this.game.players[0]);
    }

    nextPlayerAction(player) {
        this.currentPlayerAction = new PlayerAction(player, this.game);
        this.playerActions.push(this.currentPlayerAction);
        this.currentPlayerAction.start();
    }

    onPlayerActionEnded(context) {
        if (context.action !== this.currentPlayerAction) return;
        if (this.playerActions.length === 1) {
            this.nextPlayerAction(this.game.players[1]);
        } else {
            this.end();
        }
    }

    end() {
        this.game.eventBus.off('player-action:ended', this.onPlayerActionEnded.bind(this));
        this.game.eventBus.emit('round:ended', { game: this.game, round: this });
    }
}

class PlayerAction {
    constructor(player, game) {
        this.player = player;
        this.game = game;
    }
    start() {}
    end() {
        this.game.selectedUnit = null;
        this.game.validMoves = [];
        this.game.eventBus.emit('player-action:ended', { game: this.game, action: this });
    }
}

class Player {
    constructor(id, game) {
        this.id = id;
        this.game = game;
    }
    action(r, c) {
        if (this.game.currentRound && this.game.currentRound.currentPlayerAction.player === this) {
            this.game.eventBus.emit('player:input', { r, c });
        } else {
            console.warn(`非玩家 ${this.id} 的行动时间，操作无效。`);
        }
    }
}

/**
 * =================================================================================
 * 规则模块
 * =================================================================================
 */

class MoveRule {
    constructor(game) {
        this.game = game;
        this.game.eventBus.on('unit:selected', this.onUnitSelected.bind(this));
        this.game.eventBus.on('unit:after-move', this.onAfterMove.bind(this));
    }
    onUnitSelected({ game, unit }) {
        let potentialMoves = [];
        const moveSkill = unit.getSkill(Move);
        if (moveSkill) potentialMoves = moveSkill.getPotentialMoves();
        const context = { game, unit, potentialMoves };
        this.game.eventBus.emit('moveset:filter', context);
        game.validMoves = context.potentialMoves;
        this.game.eventBus.emit('moveset:finalized', { game, unit, validMoves: game.validMoves });
    }
    onAfterMove({ game }) {
        if (game.currentRound && game.currentRound.currentPlayerAction) {
            game.currentRound.currentPlayerAction.end();
        }
    }
}

class CaptureRule {
    constructor(game) {
        this.game = game;
        this.game.eventBus.on('unit:after-move', this.onAfterMove.bind(this));
    }
    onAfterMove({ game, captured }) {
        if (captured) {
            game.removeUnitFromList(captured);
            this.game.eventBus.emit('unit:captured', { game, captured });
        }
    }
}

class GameOverRule {
    constructor(game) {
        this.game = game;
        this.game.eventBus.on('unit:captured', this.onUnitCaptured.bind(this));
    }
    onUnitCaptured({ game, captured }) {
        if (captured instanceof Jiang) {
            game.isGameOver = true;
            const winner = captured.player.id === 1 ? game.players[1] : game.players[0];
            this.game.eventBus.emit('game:over', { game, winner });
        }
    }
}

function registerFilterRules(game) {
    const eventBus = game.eventBus;
    eventBus.on('moveset:filter', (context) => {
        const { game, unit, potentialMoves } = context;
        context.potentialMoves = potentialMoves.filter(([r, c]) => {
            const targetUnit = game.getUnitAt(r, c);
            return !targetUnit || targetUnit.player !== unit.player;
        });
    });
    eventBus.on('moveset:filter', (context) => {
        const { game, unit, potentialMoves } = context;
        if (!(unit instanceof Ma)) return;
        context.potentialMoves = potentialMoves.filter(([r, c]) => {
            const dr = r - unit.r, dc = c - unit.c;
            let legR, legC;
            if (Math.abs(dr) === 2 && Math.abs(dc) === 1) {
                legR = unit.r + dr / 2; legC = unit.c;
            } else if (Math.abs(dr) === 1 && Math.abs(dc) === 2) {
                legR = unit.r; legC = unit.c + dc / 2;
            } else { return true; }
            return !game.getUnitAt(legR, legC);
        });
    });
    eventBus.on('moveset:filter', (context) => {
        const { game, unit, potentialMoves } = context;
        if (!(unit instanceof Xiang)) return;
        context.potentialMoves = potentialMoves.filter(([r, c]) => {
            const eyeR = (unit.r + r) / 2, eyeC = (unit.c + c) / 2;
            return !game.getUnitAt(eyeR, eyeC);
        });
    });
    eventBus.on('moveset:filter', (context) => {
        const { unit, potentialMoves } = context;
        if (unit instanceof Jiang || unit instanceof Shi) {
            const palace = unit.player.id === 1 ? { minR: 8, maxR: 10, minC: 4, maxC: 6 } : { minR: 1, maxR: 3, minC: 4, maxC: 6 };
            context.potentialMoves = potentialMoves.filter(([r, c]) => r >= palace.minR && r <= palace.maxR && c >= palace.minC && c <= palace.maxC);
        }
        if (unit instanceof Xiang) {
            context.potentialMoves = potentialMoves.filter(([r, c]) => !((unit.player.id === 1 && r < 6) || (unit.player.id === 2 && r > 5)));
        }
    });
    eventBus.on('moveset:filter', (context) => {
        const { game, unit, potentialMoves } = context;
        if (!(unit instanceof Pao)) return;
        context.potentialMoves = potentialMoves.filter(([r, c]) => {
            const { r: startR, c: startC } = unit, screens = [];
            const distance = Math.max(Math.abs(r - startR), Math.abs(c - startC));
            const stepR = distance === 0 ? 0 : (r - startR) / distance, stepC = distance === 0 ? 0 : (c - startC) / distance;
            for (let i = 1; i < distance; i++) {
                if (game.getUnitAt(startR + i * stepR, startC + i * stepC)) screens.push(1);
            }
            const targetUnit = game.getUnitAt(r, c);
            return targetUnit ? screens.length === 1 : screens.length === 0;
        });
    });
    eventBus.on('moveset:filter', (context) => {
        const { game, unit, potentialMoves } = context;
        if (!(unit instanceof Che)) return;
        context.potentialMoves = potentialMoves.filter(([r, c]) => {
            const { r: startR, c: startC } = unit;
            const distance = Math.max(Math.abs(r - startR), Math.abs(c - startC));
            const stepR = distance === 0 ? 0 : (r - startR) / distance, stepC = distance === 0 ? 0 : (c - startC) / distance;
            for (let i = 1; i < distance; i++) {
                if (game.getUnitAt(startR + i * stepR, startC + i * stepC)) return false;
            }
            return true;
        });
    });
    eventBus.on('moveset:filter', (context) => {
        const { game, unit, potentialMoves } = context;
        context.potentialMoves = potentialMoves.filter(([r, c]) => {
            const tempBoard = game.board.map(row => [...row]);
            const getUnitAtOnTemp = (tr, tc) => tempBoard[tr - 1]?.[tc - 1] || null;
            tempBoard[unit.r - 1][unit.c - 1] = null;
            tempBoard[r - 1][c - 1] = unit;
            const generals = [];
            for (let i = 0; i < 10; i++) {
                for (let j = 0; j < 9; j++) {
                    const p = tempBoard[i][j];
                    if (p && p instanceof Jiang) generals.push(p);
                }
            }
            let isFlyingGeneral = false;
            if (generals.length === 2 && generals[0].c === generals[1].c) {
                const [g1, g2] = generals, col = g1.c, minR = Math.min(g1.r, g2.r), maxR = Math.max(g1.r, g2.r);
                let hasScreen = false;
                for (let i = minR + 1; i < maxR; i++) {
                    if (getUnitAtOnTemp(i, col)) { hasScreen = true; break; }
                }
                if (!hasScreen) isFlyingGeneral = true;
            }
            return !isFlyingGeneral;
        });
    });
}

/**
 * =================================================================================
 * 棋子和技能类 (Unit & Skill)
 * =================================================================================
 */

class Skill { constructor(unit) { this.unit = unit; } }
class Move extends Skill { getPotentialMoves() { return []; } }
class Unit {
    constructor(player, name, r, c) {
        this.player = player; this.name = name; this.r = r; this.c = c;
        this.skills = [];
        this.id = `p${player.id}_${name}_${Date.now()}_${Math.random()}`;
        this.initSkills();
    }
    initSkills() { this.skills.push(new Move(this)); }
    getSkill(skillClass) { return this.skills.find(s => s instanceof skillClass); }
    moveTo(r, c) { this.r = r; this.c = c; }
    get cssClass() { return ['piece', this.player.id === 1 ? 'red' : 'black']; }
}

class CheMove extends Move { getPotentialMoves() { const m = []; for (let i = 1; i <= 10; i++) if (i !== this.unit.r) m.push([i, this.unit.c]); for (let i = 1; i <= 9; i++) if (i !== this.unit.c) m.push([this.unit.r, i]); return m; } }
class PaoMove extends CheMove {}
class MaMove extends Move { getPotentialMoves() { const { r, c } = this.unit; return [[r - 2, c - 1], [r - 2, c + 1], [r + 2, c - 1], [r + 2, c + 1], [r - 1, c - 2], [r - 1, c + 2], [r + 1, c - 2], [r + 1, c + 2]].filter(([tr, tc]) => tr >= 1 && tr <= 10 && tc >= 1 && tc <= 9); } }
class XiangMove extends Move { getPotentialMoves() { const { r, c } = this.unit; return [[r - 2, c - 2], [r - 2, c + 2], [r + 2, c - 2], [r + 2, c + 2]].filter(([tr, tc]) => tr >= 1 && tr <= 10 && tc >= 1 && tc <= 9); } }
class ShiMove extends Move { getPotentialMoves() { const { r, c } = this.unit; return [[r - 1, c - 1], [r - 1, c + 1], [r + 1, c - 1], [r + 1, c + 1]].filter(([tr, tc]) => tr >= 1 && tr <= 10 && tc >= 1 && tc <= 9); } }
class JiangMove extends Move { getPotentialMoves() { const { r, c } = this.unit; return [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].filter(([tr, tc]) => tr >= 1 && tr <= 10 && tc >= 1 && tc <= 9); } }
class BingMove extends Move { getPotentialMoves() { const { r, c, player } = this.unit; const f = player.id === 1 ? -1 : 1; const river = (player.id === 1 && r <= 5) || (player.id === 2 && r >= 6); const m = [[r + f, c]]; if (river) { m.push([r, c - 1], [r, c + 1]); } return m.filter(([tr, tc]) => tr >= 1 && tr <= 10 && tc >= 1 && tc <= 9); } }

class Che extends Unit { constructor(p, r, c) { super(p, p.id === 1 ? '\u{1FA64}' : '\u{1FA6B}', r, c); } initSkills() { this.skills.push(new CheMove(this)); } }
class Pao extends Unit { constructor(p, r, c) { super(p, p.id === 1 ? '\u{1FA65}' : '\u{1FA6C}', r, c); } initSkills() { this.skills.push(new PaoMove(this)); } }
class Ma extends Unit { constructor(p, r, c) { super(p, p.id === 1 ? '\u{1FA63}' : '\u{1FA6A}', r, c); } initSkills() { this.skills.push(new MaMove(this)); } }
class Xiang extends Unit { constructor(p, r, c) { super(p, p.id === 1 ? '\u{1FA62}' : '\u{1FA69}', r, c); } initSkills() { this.skills.push(new XiangMove(this)); } }
class Shi extends Unit { constructor(p, r, c) { super(p, p.id === 1 ? '\u{1FA61}' : '\u{1FA68}', r, c); } initSkills() { this.skills.push(new ShiMove(this)); } }
class Jiang extends Unit { constructor(p, r, c) { super(p, p.id === 1 ? '\u{1FA60}' : '\u{1FA67}', r, c); } initSkills() { this.skills.push(new JiangMove(this)); } }
class Bing extends Unit { constructor(p, r, c) { super(p, p.id === 1 ? '\u{1FA66}' : '\u{1FA6D}', r, c); } initSkills() { this.skills.push(new BingMove(this)); } }
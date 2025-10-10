import {TurnBasedGame, Player} from './../turn-based-game.esm.js';
import {BattlefieldBasedGaming, BattlefieldModule, Board, 棋盘点位} from './../battlefield-module.esm.js';
import {Unit, UnitModule} from './../unit-module.esm.js';
import {notice} from '../kit.esm.js';

export {Go, GoGame, GoBoard, GoPlayer, GoStone};

// 围棋主类：配置棋盘与玩家；包含：提子、禁自杀、单点劫、双Pass结束+面积计分
class Go extends TurnBasedGame {
  constructor(cfg = {}) {
    super(Go.translateConfig({...cfg}));
    this.cfg.GamingClass = GoGame;
    this.cfg.PlayerClass = GoPlayer;
    this.cfg.UnitClass = GoStone;
  }

  // cfg: { size: 19|13|9, komi: number, first: '黑方'|'白方' }
  static translateConfig(cfg) {
    const size = cfg.size ?? 19;
    const first = cfg.first ?? '黑方';
    const players = [
      {id: '黑方玩家', name: '黑方', team: {id: '黑方'}},
      {id: '白方玩家', name: '白方', team: {id: '白方'}},
    ];
    const seq = first === '白方' ? [players[1], players[0]] : players;

    return {
      modules: [
        {class: UnitModule},
        {
          class: BattlefieldModule,
          battlefieldClass: GoBoard,
          rowSize: size,
          colSize: size,
          unitsPositionCfg: {},
        },
      ],
      komi: cfg.komi ?? 7.5,
      playerTurnSequence: seq,
      ...cfg,
    };
  }
}

class GoGame extends BattlefieldBasedGaming {
  constructor(...args) {
    super(...args);
    this._moveNumber = 0;
    this._prevBoardHash = '';  // 单点劫
    this._consecutivePasses = 0; // 连续Pass计数
  }

  // —— 便捷：获取点上的单位/所属、相邻点 —— //
  unitAt(pos) {
    const arr = this.battlefield.getUnitsAt(pos);
    return arr && arr.length > 0 ? arr[0] : null;
  }

  ownerAt(pos) {
    const u = this.unitAt(pos);
    return u ? u.owner : null;
  }

  neighborsOf(pos) {
    const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
    const list = dirs.map(([dr,dc]) => new 棋盘点位(pos.rowNum + dr, pos.colNum + dc));
    return list.filter(p => this.battlefield.isValidPosition(p));
  }

  // 返回同色联通块以及其气（相邻空点集合）
  getGroupAndLiberties(startPos) {
    const startOwner = this.ownerAt(startPos);
    if (!startOwner) return {group: new Set(), liberties: new Set()};
    const key = p => p.toString();
    const group = new Set([key(startPos)]);
    const liberties = new Set();
    const queue = [startPos];

    while (queue.length) {
      const cur = queue.pop();
      for (const nb of this.neighborsOf(cur)) {
        const nbUnit = this.unitAt(nb);
        if (!nbUnit) {
          liberties.add(key(nb));
        } else if (nbUnit.owner === startOwner) {
          const k = key(nb);
          if (!group.has(k)) {
            group.add(k);
            queue.push(nb);
          }
        }
      }
    }
    return {group, liberties};
  }

  // —— 操作：建立棋子 —— //
  buildUnit(player, position, unitTypeCfg = {}) {
    this._moveNumber++;
    const UnitClass = unitTypeCfg.class ?? GoStone;
    const unit = new UnitClass({owner: player, position: position, moveNumber: this._moveNumber});
    this.battlefield.addUnitToPosition(unit, position);
    this.bulletin.notice('buildUnit end', {unit});
    return unit;
  }

  // —— 盘面哈希：用于单点劫判断（上一手盘面是否被立即还原） —— //
  boardHash() {
    const n = this.battlefield.rowSize;
    const m = this.battlefield.colSize;
    let s = '';
    for (let r = 1; r <= n; r++) {
      for (let c = 1; c <= m; c++) {
        const pos = new 棋盘点位(r, c);
        const u = this.unitAt(pos);
        if (!u) { s += '.'; continue; }
        s += (u.owner?.team?.id === '黑方') ? 'B' : 'W';
      }
      s += '/';
    }
    return s;
  }

  // —— 面积计分（中国规则）：stones + territory；白加贴目 —— //
  computeAreaScore() {
    const n = this.battlefield.rowSize;
    const m = this.battlefield.colSize;

    const blackPlayer = this.playerTurnSequence.find(p => p.team?.id === '黑方');
    const whitePlayer = this.playerTurnSequence.find(p => p.team?.id === '白方');

    // 1) 盘上棋子数
    let blackStones = 0, whiteStones = 0;
    for (let r = 1; r <= n; r++) {
      for (let c = 1; c <= m; c++) {
        const u = this.unitAt(new 棋盘点位(r, c));
        if (u) {
          if (u.owner?.team?.id === '黑方') blackStones++;
          else whiteStones++;
        }
      }
    }

    // 2) 实空：对每个连通空区，若邻接颜色集合为单色，则归属该色
    const visited = new Set();
    const key = (p) => p.toString();
    let blackTerritory = 0, whiteTerritory = 0;

    for (let r = 1; r <= n; r++) {
      for (let c = 1; c <= m; c++) {
        const start = new 棋盘点位(r, c);
        if (this.unitAt(start) || visited.has(key(start))) continue;

        // BFS 空区
        const queue = [start];
        visited.add(key(start));
        const region = [];
        const neighborColors = new Set();

        while (queue.length) {
          const cur = queue.pop();
          region.push(cur);
          for (const nb of this.neighborsOf(cur)) {
            const u = this.unitAt(nb);
            if (!u) {
              const k = key(nb);
              if (!visited.has(k)) {
                visited.add(k);
                queue.push(nb);
              }
            } else {
              neighborColors.add(u.owner?.team?.id === '黑方' ? 'B' : 'W');
            }
          }
        }

        if (neighborColors.size === 1) {
          const color = [...neighborColors][0];
          if (color === 'B') blackTerritory += region.length;
          else whiteTerritory += region.length;
        }
      }
    }

    // 3) 贴目（加在白方）
    const komi = Number(this.cfg?.komi ?? this._cfg?.komi ?? 7.5);
    const black = blackStones + blackTerritory;
    const white = whiteStones + whiteTerritory + komi;

    const winner = (white > black) ? whitePlayer : blackPlayer;
    return {
      black, white,
      komi,
      blackStones, whiteStones,
      blackTerritory, whiteTerritory,
      winner,
    };
  }
}

// 棋子
class GoStone extends Unit {
  constructor(cfg) {
    super(cfg);
    this._moveNumber = cfg.moveNumber;
  }
  get moveNumber() { return this._moveNumber; }
}

// 围棋棋盘：复用Board；提供星位
class GoBoard extends Board {
  constructor(gaming, cfg) {
    super(gaming, cfg);
  }

  isValidPosition(position) {
    return position.rowNum >= 1 && position.rowNum <= this._rowSize
        && position.colNum >= 1 && position.colNum <= this._colSize;
  }

  // 星位：根据路数返回一组交叉点字符串 "r,c"
  starPoints() {
    const n = this._rowSize;
    if (n === 19) return this._star(19);
    if (n === 13) return this._star(13);
    if (n === 9) return this._star(9);
    return [];
  }

  _star(n) {
    const pts = [];
    const add = (r,c) => pts.push(`${r},${c}`);
    if (n === 19) {
      const ks = [4, 10, 16];
      ks.forEach(r => ks.forEach(c => add(r, c)));
    } else if (n === 13) {
      const ks = [4, 7, 10];
      ks.forEach(r => ks.forEach(c => add(r, c)));
    } else if (n === 9) {
      const ks = [3, 5, 7];
      ks.forEach(r => ks.forEach(c => add(r, c)));
    }
    return pts;
  }
}

class GoPlayer extends Player {
  interpretInput(input) {
    // 特殊动作
    if (input?.action === 'PASS') {
      return new PassCommand(this);
    }
    if (input?.action === 'RESIGN') {
      return new ResignCommand(this);
    }

    // 点击交叉点落子
    if (input instanceof 棋盘点位) {
      // 必须落在空点
      const unitsAt = this.gaming.battlefield.getUnitsAt(input);
      if (unitsAt.length > 0) return null;
      return new PlaceStoneCommand(this, input);
    }
    return null;
  }
}

// 命令定义（含：提子、禁自杀、单点劫、双Pass计分结束）
class PlaceStoneCommand {
  constructor(player, position) {
    this.player = player;
    this.position = position;
  }

  async execute() {
    const gaming = this.player.gaming;
    const bf = gaming.battlefield;

    // 再次确认空点
    if (bf.getUnitsAt(this.position).length > 0) {
      return {actionsConsumed: 0, changes: []};
    }

    gaming.startChangeCollection();

    // 1) 暂时落子
    const newUnit = gaming.buildUnit(this.player, this.position);

    // 2) 计算邻接对方块是否无气，执行提子，并记录用于回滚
    const neighbors = gaming.neighborsOf(this.position);
    const capturedList = []; // [{unit, pos}]
    const visitedEnemyGroups = new Set();
    const groupKey = (pos) => {
      const {group} = gaming.getGroupAndLiberties(pos);
      return [...group].sort()[0];
    };

    for (const nb of neighbors) {
      const nbUnit = gaming.unitAt(nb);
      if (!nbUnit || nbUnit.owner === this.player) continue;
      const gk = groupKey(nb);
      if (visitedEnemyGroups.has(gk)) continue;
      visitedEnemyGroups.add(gk);

    const {group, liberties} = gaming.getGroupAndLiberties(nb);
      if (liberties.size === 0) {
        for (const key of group) {
          const [r, c] = key.split(',').map(n => parseInt(n, 10));
          const pos = new 棋盘点位(r, c);
          const unitsAt = bf.getUnitsAt(pos);
          if (unitsAt.length > 0) {
            const enemy = unitsAt[0];
            capturedList.push({unit: enemy, pos});
            bf.destroyUnit(enemy);
          }
        }
      }
    }

    // 3) 禁自杀：若己方无气且本手未产生提子，则撤销
    const {liberties: myLibs} = gaming.getGroupAndLiberties(this.position);
    if (myLibs.size === 0 && capturedList.length === 0) {
      bf.destroyUnit(newUnit);
      const changes = gaming.stopChangeCollection();
      return {actionsConsumed: 0, changes};
    }

    // 4) 单点劫：若盘面哈希与上一手一致，则撤销（还原对方被提的子与本手新子）
    const newHash = gaming.boardHash();
    if (newHash === gaming._prevBoardHash) {
      for (const {unit, pos} of capturedList) {
        bf.addUnitToPosition(unit, pos);
      }
      bf.destroyUnit(newUnit);
      const changes = gaming.stopChangeCollection();
      return {actionsConsumed: 0, changes};
    }

    // 成功：更新哈希，并清零连续Pass
    gaming._prevBoardHash = newHash;
    gaming._consecutivePasses = 0;

    const changes = gaming.stopChangeCollection();
    return {actionsConsumed: 1, changes};
  }
}

class PassCommand {
  constructor(player) {
    this.player = player;
  }
  async execute() {
    const gaming = this.player.gaming;
    gaming._consecutivePasses = (gaming._consecutivePasses || 0) + 1;

    if (gaming._consecutivePasses >= 2) {
      // 进入计分并结束
      const scores = gaming.computeAreaScore();
      notice(gaming, 'game over', {winner: scores.winner, scores});
      // 重置以防后续交互
      gaming._consecutivePasses = 0;
      return {actionsConsumed: 1, changes: []};
    }
    return {actionsConsumed: 1, changes: []};
  }
}

class ResignCommand {
  constructor(player) {
    this.player = player;
  }
  async execute() {
    const gaming = this.player.gaming;
    const opponents = gaming.playerTurnSequence.filter(p => p.id !== this.player.id);
    const winner = opponents[0] || null;
    if (winner) {
      notice(gaming, 'game over', {winner});
    }
    return {actionsConsumed: 1, changes: []};
  }
}
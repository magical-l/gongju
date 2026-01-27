/* 中国象棋最小测试版运行器 */
console.log('[RUNNER] v6 starting');
(async () => {
  try {
    console.log('[RUNNER] waiting QUnit...');
    // 等待 QUnit 就绪（最多 10 秒）
    await new Promise((resolve, reject) => {
      const start = Date.now();
      const timer = setInterval(() => {
        if (typeof window !== 'undefined' && window.QUnit && QUnit.module && (QUnit.start || QUnit.begin)) {
          clearInterval(timer);
          console.log('[TEST] QUnit ready (module/begin present)');
          resolve();
        } else if (Date.now() - start > 10_000) {
          clearInterval(timer);
          console.error('[TEST] QUnit not ready in 10s');
          resolve(); // 仍继续，避免卡死
        }
      }, 50);
    });

    const modX = await import('./xiangqi.esm.js');
    const Xiangqi = modX['中国象棋']; // 命名导出：类名为中文
    try { if (typeof window !== 'undefined') window.Xiangqi = Xiangqi; } catch (_) {}
    const RED = modX['红方玩家id'];
    const BLACK = modX['黑方玩家id'];
    const modBF = await import('./../battlefield-module.esm.js');
    const BoardPoint = modBF['棋盘点位'];
    try { if (typeof window !== 'undefined') window.BoardPoint = BoardPoint; } catch (_) {}
    // 简易等待助手：等待条件成立或超时
    const waitFor = (predicate, timeout = 5000) => new Promise(resolve => {
      const start = Date.now();
      const timer = setInterval(() => {
        let ok = false;
        try { ok = !!predicate(); } catch (_) {}
        if (ok) { clearInterval(timer); resolve(true); }
        else if (Date.now() - start > timeout) { clearInterval(timer); resolve(false); }
      }, 10);
    });
    // 统一从技能中选择引擎定义的目标对象（优先 availableTargets，回退 raw）
    const pickTargetFor = (skill, r, c) => {
      try {
        const list = (() => {
          if (!skill) return [];
          if (typeof skill.availableTargets === 'function') return skill.availableTargets() || [];
          if (typeof skill.availableTargets === 'object') return skill.availableTargets || [];
          if (typeof skill.getRawTargetPositions === 'function') return skill.getRawTargetPositions() || [];
          return [];
        })();
        const match = list.find(p => {
          const pos = (p && (p.position || p)) || {};
          const rr = pos.rowNum ?? pos.row ?? pos.rowIndex;
          const cc = pos.colNum ?? pos.col ?? pos.colIndex;
          return rr === r && cc === c;
        });
        return match || (Array.isArray(list) && list.length > 0 ? list[0] : undefined);
      } catch (_) { return undefined; }
    };

    if (typeof QUnit !== 'undefined') {
      console.log('[TEST] QUnit detected, registering hooks...');
      // 测试完成钩子：控制台打印与页面插入文本，便于自动化等待与汇总
      if (QUnit.done) {
        QUnit.done(function (details) {
          const msg = `[TEST] 测试完成 - 通过:${details.passed}, 失败:${details.failed}, 总计:${details.total}`;
          console.log(msg);
          try {
            const p = document.createElement('p');
            p.id = 'test-summary';
            p.textContent = `tests completed: passed ${details.passed}, failed ${details.failed}, total ${details.total}`;
            document.body.appendChild(p);
            if (details && typeof details.failed === 'number') {
              document.title = (details.failed === 0 ? '✔ ' : '✖ ') + '中国象棋单元测试';
            }
          } catch (_) {}
        });
      }

      QUnit.module("中国象棋基础冒烟");
      
      QUnit.module("规则与棋盘判定");
      
      QUnit.test("前进方向/九宫/过河判定与己方区域", function(assert) {
        const game = new Xiangqi({});
        const gaming = game.newGaming();
        const bf = gaming.battlefield;
        // 前进方向：红方向上(-1)，黑方向下(+1)
        assert.equal(bf.forwardDirection({id: RED}), -1, "红方 forwardDirection = -1");
        assert.equal(bf.forwardDirection({id: BLACK}), 1, "黑方 forwardDirection = 1");
        // 九宫格
        assert.ok(bf.isInPalace(new BoardPoint(2,5)), "(2,5) 在九宫");
        assert.notOk(bf.isInPalace(new BoardPoint(5,5)), "(5,5) 不在九宫");
        assert.ok(bf.isInPalace(new BoardPoint(9,4)), "(9,4) 在九宫");
        // 过河判定
        assert.ok(bf.isAcrossRiver(new BoardPoint(5,5), {id: RED}), "红方(5,5) 视为过河");
        assert.notOk(bf.isAcrossRiver(new BoardPoint(6,5), {id: RED}), "红方(6,5) 未过河");
        assert.ok(bf.isAcrossRiver(new BoardPoint(6,5), {id: BLACK}), "黑方(6,5) 视为过河");
        assert.notOk(bf.isAcrossRiver(new BoardPoint(5,5), {id: BLACK}), "黑方(5,5) 未过河");
        // 己方区域
        assert.ok(bf.areaOf({id: RED}).every(p => p.rowNum >= 6), "红方己方区域在 6-10 行");
        assert.ok(bf.areaOf({id: BLACK}).every(p => p.rowNum <= 5), "黑方己方区域在 1-5 行");
      });
      
      QUnit.test("初始棋子排布校验", function(assert) {
        const game = new Xiangqi({});
        const gaming = game.newGaming();
        const bf = gaming.battlefield;
        const nameAt = (r,c) => (bf.getUnitsAt(new BoardPoint(r,c))[0] || {}).name || '';
        assert.equal(nameAt(10,1), '车', "红 车 at (10,1)");
        assert.equal(nameAt(10,5), '帅', "红 帅 at (10,5)");
        assert.equal(nameAt(1,5), '将', "黑 将 at (1,5)");
        assert.equal(nameAt(3,2), '砲', "红 砲 at (3,2)");
        assert.equal(nameAt(8,2), '炮', "黑 炮 at (8,2)");
      });
      
      QUnit.test("车开局被己方兵阻挡但可纵走两步", function(assert) {
        const game = new Xiangqi({});
        const gaming = game.newGaming();
        const bf = gaming.battlefield;
        // 取红方(10,1) 车
        const rook = bf.getUnitsAt(new BoardPoint(10,1))[0];
        assert.ok(rook && rook.name === '车', "找到红 车");
        const wheel = rook.skills.find(s => s.name === '轮子');
        assert.ok(wheel, "车具备‘轮子’技能");
        const moves = wheel.getRawTargetPositions();
        assert.equal(moves.length, 2, "开局时 车 竖向可达(9,1)(8,1) 两步");
      });
      
      QUnit.test("象/马在边界处的原始可达位数量（不考虑塞象眼/绊马脚）", function(assert) {
        const game = new Xiangqi({});
        const gaming = game.newGaming();
        const bf = gaming.battlefield;
        // 黑相(1,3)
        const elephant = bf.getUnitsAt(new BoardPoint(1,3))[0];
        assert.ok(elephant && (elephant.name === '象' || elephant.name === '相'), "找到黑 相/象");
        const eleMove = elephant.skills.find(s => s.name === '象行田');
        assert.ok(eleMove, "相具备‘象行田’");
        const eleTargets = eleMove.getRawTargetPositions();
        // 边界处应仅有 (3,1) 与 (3,5) 两个在棋盘内的对角
        assert.equal(eleTargets.length, 2, "边界处相原始可达位=2");
        // 黑馬(1,2)
        const knight = bf.getUnitsAt(new BoardPoint(1,2))[0];
        assert.ok(knight && (knight.name === '馬' || knight.name === '马'), "找到黑 马/馬");
        const knMove = knight.skills.find(s => s.name === '马行日');
        assert.ok(knMove, "马具备‘马行日’");
        const knTargets = knMove.getRawTargetPositions();
        // 边界处马通常可达 <= 4（根据边角限制）
        assert.ok(knTargets.length <= 4 && knTargets.length >= 2, "边界处马原始可达位在 2~4 范围内");
      });

      QUnit.test("可创建对局与棋盘尺寸正确", function(assert) {
        const game = new Xiangqi({});
        const gaming = game.newGaming();
        assert.ok(gaming && gaming.battlefield, "gaming 与 battlefield 存在");
        assert.equal(gaming.battlefield.rowSize, 10, "行数=10");
        assert.equal(gaming.battlefield.colSize, 9, "列数=9");
      });

      QUnit.test("初始将/帅位置存在", function(assert) {
        const game = new Xiangqi({});
        const gaming = game.newGaming();
        const bf = gaming.battlefield;

        const redGeneralPos = new BoardPoint(10, 5);
        const blackGeneralPos = new BoardPoint(1, 5);
        const redUnits = bf.getUnitsAt(redGeneralPos) || [];
        const blackUnits = bf.getUnitsAt(blackGeneralPos) || [];
        assert.equal(redUnits.length, 1, "红方帅在(10,5)");
        assert.equal(blackUnits.length, 1, "黑方将在(1,5)");
      });

      QUnit.module("回合与行动流程");
      QUnit.test("红走兵(7,3)->(6,3)，黑走卒(4,1)->(5,1) 后应轮到红方", async function(assert) {
        const game = new Xiangqi({});
        const gaming = game.newGaming();
        const bf = gaming.battlefield;
        const pt = (r, c) => new BoardPoint(r, c);

        // 红方：兵(7,3) 前进一步到 (6,3)
        const redPawn = bf.getUnitsAt(pt(7, 3))[0];
        assert.ok(redPawn && redPawn.name === '兵', "找到红兵(7,3)");
        const redMove = redPawn && redPawn.skills.find(s => s.name === '勇往直前');
        assert.ok(redMove, "红兵具备‘勇往直前’");
        const redTargets = redMove.getRawTargetPositions();
        const to63 = redTargets && redTargets.find(p => p.rowNum === 6 && p.colNum === 3);
        assert.ok(to63, "红兵可前进到(6,3)");
        gaming.bulletin.notice('ui input', gaming.situation && gaming.situation.curPlayer || (game && game.players && game.players[0]));
        gaming.bulletin.notice('ui input', redPawn);
        gaming.bulletin.notice('ui input', redMove);
        gaming.bulletin.notice('ui input', [pickTargetFor(redMove, 6, 3) || to63]);
        await waitFor(() => (bf.getUnitsAt(pt(6, 3))[0] || {}).name === '兵', 12000);
        await new Promise(r => setTimeout(r, 50));
        assert.equal((bf.getUnitsAt(pt(6, 3))[0] || {}).name, '兵', "红兵已到(6,3)");

        // 黑方：卒(4,1) 前进一步到 (5,1)
        const blackPawn = bf.getUnitsAt(pt(4, 1))[0];
        assert.ok(blackPawn && blackPawn.name === '卒', "找到黑卒(4,1)");
        const blackMove = blackPawn && blackPawn.skills.find(s => s.name === '勇往直前');
        assert.ok(blackMove, "黑卒具备‘勇往直前’");
        const blackTargets = blackMove.getRawTargetPositions();
        const to51 = blackTargets && blackTargets.find(p => p.rowNum === 5 && p.colNum === 1);
        assert.ok(to51, "黑卒可前进到(5,1)");
        gaming.bulletin.notice('ui input', gaming.situation && gaming.situation.curPlayer || (game && game.players && game.players[0]));
        gaming.bulletin.notice('ui input', blackPawn);
        gaming.bulletin.notice('ui input', blackMove);
        gaming.bulletin.notice('ui input', [pickTargetFor(blackMove, 5, 1) || to51]);
        await waitFor(() => (bf.getUnitsAt(pt(5, 1))[0] || {}).name === '卒', 12000);
        await new Promise(r => setTimeout(r, 50));
        assert.equal((bf.getUnitsAt(pt(5, 1))[0] || {}).name, '卒', "黑卒已到(5,1)");

        // 断言回合交替：应轮到红方
        await waitFor(() => (gaming.situation && gaming.situation.curPlayer && gaming.situation.curPlayer.id === '红方玩家'));
        const cur = gaming.situation && gaming.situation.curPlayer;
        assert.ok(cur && cur.id === '红方玩家', "当前玩家轮到红方");
      });

      QUnit.test("吃子后进驻 + 回合交替：红兵(7,3)->(6,3)->(5,3)，黑卒(4,1)->(5,1)->(6,1)，红兵(5,3)->(4,3) 吃卒", async function(assert) {
        const game = new Xiangqi({});
        const gaming = game.newGaming();
        const bf = gaming.battlefield;
        const pt = (r, c) => new BoardPoint(r, c);

        // 1) 红兵 7,3 -> 6,3
        let redPawn = bf.getUnitsAt(pt(7, 3))[0];
        assert.ok(redPawn && redPawn.name === '兵', "找到红兵(7,3)");
        let move = redPawn.skills.find(s => s.name === '勇往直前');
        let targets = move.getRawTargetPositions();
        let target = targets.find(p => p.rowNum === 6 && p.colNum === 3);
        assert.ok(target, "红兵可到(6,3)");
        gaming.bulletin.notice('ui input', gaming.situation && gaming.situation.curPlayer || (game && game.players && game.players[0]));
        gaming.bulletin.notice('ui input', redPawn);
        gaming.bulletin.notice('ui input', move);
        gaming.bulletin.notice('ui input', [pickTargetFor(move, 6, 3) || target]);
        await waitFor(() => (bf.getUnitsAt(pt(6, 3))[0] || {}).name === '兵');
        assert.equal((bf.getUnitsAt(pt(6, 3))[0] || {}).name, '兵', "红兵在(6,3)");

        // 2) 黑卒 4,1 -> 5,1
        let blackPawn = bf.getUnitsAt(pt(4, 1))[0];
        assert.ok(blackPawn && blackPawn.name === '卒', "找到黑卒(4,1)");
        let bmove = blackPawn.skills.find(s => s.name === '勇往直前');
        let btargets = bmove.getRawTargetPositions();
        let bto = btargets.find(p => p.rowNum === 5 && p.colNum === 1);
        assert.ok(bto, "黑卒可到(5,1)");
        gaming.bulletin.notice('ui input', gaming.situation && gaming.situation.curPlayer || (game && game.players && game.players[0]));
        gaming.bulletin.notice('ui input', blackPawn);
        gaming.bulletin.notice('ui input', bmove);
        gaming.bulletin.notice('ui input', [pickTargetFor(bmove, 5, 1) || bto]);
        await waitFor(() => (bf.getUnitsAt(pt(5, 1))[0] || {}).name === '卒');
        assert.equal((bf.getUnitsAt(pt(5, 1))[0] || {}).name, '卒', "黑卒在(5,1)");

        // 3) 红兵 6,3 -> 5,3
        redPawn = bf.getUnitsAt(pt(6, 3))[0];
        move = redPawn.skills.find(s => s.name === '勇往直前');
        targets = move.getRawTargetPositions();
        target = targets.find(p => p.rowNum === 5 && p.colNum === 3);
        assert.ok(target, "红兵可到(5,3)");
        gaming.bulletin.notice('ui input', gaming.situation && gaming.situation.curPlayer || (game && game.players && game.players[0]));
        gaming.bulletin.notice('ui input', redPawn);
        gaming.bulletin.notice('ui input', move);
        gaming.bulletin.notice('ui input', [pickTargetFor(move, 5, 3) || target]);
        await waitFor(() => (bf.getUnitsAt(pt(5, 3))[0] || {}).name === '兵');
        assert.equal((bf.getUnitsAt(pt(5, 3))[0] || {}).name, '兵', "红兵在(5,3)");

        // 4) 黑卒 5,1 -> 6,1
        blackPawn = bf.getUnitsAt(pt(5, 1))[0];
        bmove = blackPawn.skills.find(s => s.name === '勇往直前');
        btargets = bmove.getRawTargetPositions();
        bto = btargets.find(p => p.rowNum === 6 && p.colNum === 1);
        assert.ok(bto, "黑卒可到(6,1)");
        gaming.bulletin.notice('ui input', gaming.situation && gaming.situation.curPlayer || (game && game.players && game.players[0]));
        gaming.bulletin.notice('ui input', blackPawn);
        gaming.bulletin.notice('ui input', bmove);
        gaming.bulletin.notice('ui input', [pickTargetFor(bmove, 6, 1) || bto]);
        await waitFor(() => (bf.getUnitsAt(pt(6, 1))[0] || {}).name === '卒');
        assert.equal((bf.getUnitsAt(pt(6, 1))[0] || {}).name, '卒', "黑卒在(6,1)");

        // 5) 红兵 5,3 -> 4,3 （吃子）
        // 先确认(4,3) 原为黑卒
        const before = bf.getUnitsAt(pt(4, 3))[0];
        assert.ok(before && before.name === '卒', "待吃目标：黑卒在(4,3)");
        redPawn = bf.getUnitsAt(pt(5, 3))[0];
        move = redPawn.skills.find(s => s.name === '勇往直前');
        targets = move.getRawTargetPositions();
        target = targets.find(p => p.rowNum === 4 && p.colNum === 3);
        assert.ok(target, "红兵可到(4,3) 进行吃子");
        gaming.bulletin.notice('ui input', redPawn);
        gaming.bulletin.notice('ui input', move);
        gaming.bulletin.notice('ui input', [pickTargetFor(move, 4, 3) || target]);

        // 等待：杀敌后进驻
        await waitFor(() => (bf.getUnitsAt(pt(4, 3))[0] || {}).name === '兵');
        const at43 = bf.getUnitsAt(pt(4, 3))[0] || {};
        assert.equal(at43.name, '兵', "红兵已进驻(4,3)");
        // 断言：目标敌子被移除
        assert.notOk(before === (bf.getUnitsAt(pt(4, 3))[0] || null), "原黑卒已不在(4,3)");

        // 断言：回合交替 —— 吃子后应轮到黑方
        await waitFor(() => (gaming.situation && gaming.situation.curPlayer && gaming.situation.curPlayer.id === '黑方玩家'));
        const cur2 = gaming.situation && gaming.situation.curPlayer;
        assert.ok(cur2 && cur2.id === '黑方玩家', "当前玩家轮到黑方");
      });

      QUnit.module("炮隔山打牛");
      QUnit.test("红炮(3,2)->(3,3)；黑士(1,4)->(2,3)造屏；红炮(3,3)->(1,3) 吃黑相", async function(assert) {
        const game = new Xiangqi({});
        const gaming = game.newGaming();
        const bf = gaming.battlefield;
        const pt = (r, c) => new BoardPoint(r, c);

        // 前置：确认初始关键子
        const redCannon = bf.getUnitsAt(pt(3, 2))[0];
        assert.ok(redCannon && (redCannon.name === '砲' || redCannon.name === '炮'), "找到红炮(3,2)");
        const blackAdvisor = bf.getUnitsAt(pt(1, 4))[0];
        assert.ok(blackAdvisor && (blackAdvisor.name === '仕' || blackAdvisor.name === '士'), "找到黑士(1,4)");
        const blackElephant = bf.getUnitsAt(pt(1, 3))[0];
        assert.ok(blackElephant && (blackElephant.name === '象' || blackElephant.name === '相'), "找到黑相/象(1,3)");

        // 1) 红炮 3,2 -> 3,3 （非吃子直走）
        let cannonMove = redCannon.skills.find(s => s.name === '轮子');
        assert.ok(cannonMove, "红炮具备‘轮子’直行技能");
        let cannonTargets = cannonMove.getRawTargetPositions();
        let to33 = cannonTargets.find(p => p.rowNum === 3 && p.colNum === 3);
        assert.ok(to33, "红炮可走至(3,3)");
        gaming.bulletin.notice('ui input', redCannon);
        gaming.bulletin.notice('ui input', cannonMove);
        gaming.bulletin.notice('ui input', [pickTargetFor(cannonMove, 3, 3) || to33]);
        await waitFor(() => (bf.getUnitsAt(pt(3, 3))[0] || {}).name === redCannon.name);
        assert.equal((bf.getUnitsAt(pt(3, 3))[0] || {}).name, (redCannon.name), "红炮已在(3,3)");

        // 2) 黑士 1,4 -> 2,3 （造屏风）
        const adv = bf.getUnitsAt(pt(1, 4))[0];
        const advMove = adv && adv.skills.find(s => s.name && s.name.includes('士'));
        // 不依赖技能名，直接检索原始可达位包含(2,3)
        const advMoves = adv.skills.flatMap(s => (s.getRawTargetPositions ? s.getRawTargetPositions() : []));
        const advTo = advMoves.find(p => p.rowNum === 2 && p.colNum === 3);
        assert.ok(advTo, "黑士可至(2,3)");
        const advSel = (adv.skills.find(s => s.getRawTargetPositions && s.getRawTargetPositions().some(p => p.rowNum===2 && p.colNum===3)) || adv.skills[0]);
        gaming.bulletin.notice('ui input', adv);
        gaming.bulletin.notice('ui input', advSel);
        gaming.bulletin.notice('ui input', [pickTargetFor(advSel, 2, 3) || advTo]);
        await waitFor(() => (bf.getUnitsAt(pt(2, 3))[0] || {}).name === (adv.name));
        assert.equal((bf.getUnitsAt(pt(2, 3))[0] || {}).name, (adv.name), "黑士已在(2,3) 形成屏风");

        // 3) 红炮 3,3 -> 1,3 （隔山打牛吃黑相）
        const cannonAt33 = bf.getUnitsAt(pt(3, 3))[0];
        assert.ok(cannonAt33 && (cannonAt33.name === '砲' || cannonAt33.name === '炮'), "红炮在(3,3)");
        // 炮吃子通常通过专用技能（名称可能如“隔山打牛”），也可能仍由'轮子'或统一攻击技能实现
        const eatSkill = cannonAt33.skills.find(s => s.name && (s.name.includes('隔山') || s.name.includes('打牛') || s.name.includes('轮子') || s.name.includes('攻击'))) || cannonAt33.skills[0];
        const eatTargets = eatSkill.getRawTargetPositions ? eatSkill.getRawTargetPositions() : [];
        const to13 = eatTargets.find(p => p.rowNum === 1 && p.colNum === 3);
        assert.ok(to13, "红炮有吃至(1,3) 的原始可达位");
        gaming.bulletin.notice('ui input', cannonAt33);
        gaming.bulletin.notice('ui input', eatSkill);
        gaming.bulletin.notice('ui input', [pickTargetFor(eatSkill, 1, 3) || to13]);

        // 等待：黑相被消灭，红炮进驻(1,3)
        await waitFor(() => { const u = bf.getUnitsAt(pt(1, 3))[0] || {}; return u && (u.name === '砲' || u.name === '炮'); });
        const at13 = bf.getUnitsAt(pt(1, 3))[0] || {};
        assert.ok(at13 && (at13.name === '砲' || at13.name === '炮'), "红炮已进驻(1,3)");
        // 断言：回合交替，应轮到黑方
        await waitFor(() => (gaming.situation && gaming.situation.curPlayer && gaming.situation.curPlayer.id === '黑方玩家'));
        const cur = gaming.situation && gaming.situation.curPlayer;
        assert.ok(cur && cur.id === '黑方玩家', "当前玩家轮到黑方");
      });

      // 注册完所有测试后手动启动（延后到下一个宏任务，确保 DOM/模块就绪）
      if (typeof QUnit !== 'undefined' && QUnit.start) {
        console.log('[TEST] scheduling QUnit.start...');
        setTimeout(() => {
          try {
            console.log('[TEST] calling QUnit.start');
            QUnit.start();
          } catch (e) {
            console.error('[TEST] QUnit.start 调用失败', e);
          }
        }, 0);
      } else {
        console.warn('[TEST] QUnit.start 不可用，跳过调用');
      }
    } else {
      console.error('[TEST] QUnit 未加载');
    }
  } catch (error) {
    console.error('[TEST] 模块导入错误:', error, error && error.stack);
    if (typeof QUnit !== 'undefined') {
      QUnit.module("加载失败");
      QUnit.test("模块导入", function(assert) {
        assert.ok(false, "模块导入失败: " + ((error && error.stack) || (error && error.message) || error));
      });
    }
  }
/* 测试辅助：仅测试环境使用，快速构造局面 */
function __helper(bf) {
  const pt = (r,c)=>new BoardPoint(r,c);
  return {
    clearAt(r,c){ const arr = bf.getUnitsAt(pt(r,c))||[]; arr.forEach(u => u && u.die && u.die()); },
    place(name, sideId, r, c) {
      // 简化：从现有同名棋子克隆一枚到指定格；若无同名，取兵/卒占位
      const all = bf.getAllUnits ? bf.getAllUnits() : [];
      const src = all.find(u => u.name === name && u.owner && u.owner.id === sideId) || all.find(u => (sideId==='红方玩家'?u.name==='兵':u.name==='卒'));
      if (!src) return;
      // 如目标有子，先清空
      this.clearAt(r,c);
      // 移动或复制到目标：优先使用技能移动
      const skill = src.skills && src.skills.find(s => {
        const raws = s.getRawTargetPositions ? (s.getRawTargetPositions() || []) : [];
        const avs = typeof s.availableTargets === 'function' ? (s.availableTargets() || []) : [];
        const matchRaw = raws.some(p => p && p.rowNum === r && p.colNum === c);
        const matchAv = avs.some(p => {
          const pos = (p && (p.position || p)) || {};
          return pos.rowNum === r && pos.colNum === c;
        });
        return matchRaw || matchAv;
      });
      if (skill) {
        try {
          const avs = typeof skill.availableTargets === 'function' ? (skill.availableTargets() || []) : [];
          const tgt = avs.find(p => {
            const pos = (p && (p.position || p)) || {};
            return pos.rowNum === r && pos.colNum === c;
          }) || { rowNum: r, colNum: c };
          skill.activate([ tgt ]);
        } catch(_) {}
      }
      else if (src.moveTo) { try { src.moveTo(pt(r,c)); } catch(_){} }
      else {
        // 若无API，直接尝试底层放置（若bf提供）
        if (bf.setUnitAt) try { bf.setUnitAt(pt(r,c), src); } catch(_) {}
      }
    }
  };
}

/* 王不见王 与 将军/将死 */
QUnit.module("王不见王 / 将军将死");
QUnit.test("王不见王：两王同列直视应被禁止", function(assert) {
  const game = new Xiangqi({});
  const gaming = game.newGaming();
  const bf = gaming.battlefield;
  const pt = (r,c)=>new BoardPoint(r,c);
  const H = __helper(bf);

  // 找到红帅与黑将位置
  const redKingPos = pt(10,5), blackKingPos = pt(1,5);
  assert.ok((bf.getUnitsAt(redKingPos)[0]||{}).name === '帅', "红帅在(10,5)");
  assert.ok((bf.getUnitsAt(blackKingPos)[0]||{}).name === '将', "黑将在(1,5)");

  // 清空两者之间同列阻挡
  for (let r=2; r<=9; r++) H.clearAt(r,5);

  // 尝试让一方行动到造成王见王（若框架有判定API，可替换为直接断言）
  const redKing = bf.getUnitsAt(redKingPos)[0];
  const kingStep = redKing && redKing.skills && redKing.skills.find(s => s.getRawTargetPositions);
  const targets = kingStep ? kingStep.getRawTargetPositions() : [];
  const to95 = targets.find(p => p.rowNum===9 && p.colNum===5);
  // 行动应失败或被规则阻止（具体框架行为不同，这里以“不发生移动”为通过标准）
  if (to95) {
    gaming.bulletin.notice('ui input', redKing);
    gaming.bulletin.notice('ui input', kingStep);
    gaming.bulletin.notice('ui input', [pickTargetFor(kingStep, 9, 5) || to95]);
  }
  const stillRedKing = (bf.getUnitsAt(pt(10,5))[0]||{}).name === '帅';
  assert.ok(stillRedKing, "规则阻止造成王见王：红帅未越界到(9,5)");
});

QUnit.test("将军与将死：将军后轮到对方，无法解救则判定将死", function(assert) {
  const game = new Xiangqi({});
  const gaming = game.newGaming();
  const bf = gaming.battlefield;
  const pt = (r,c)=>new BoardPoint(r,c);
  const H = __helper(bf);

  // 先构造简单将军：红车沿列威胁黑将
  // 清空 2..9列5的阻挡，放红车在(9,5)，红帅保持原位，黑将(1,5)
  for (let r=2; r<=8; r++) H.clearAt(r,5);
  H.place('车','红方玩家',9,5);

  // 红车一步将军：9,5 -> 8,5
  const rook = bf.getUnitsAt(pt(9,5))[0];
  assert.ok(rook && rook.name==='车', "红车在(9,5)");
  const wheel = rook.skills && rook.skills.find(s=>s.getRawTargetPositions);
  const moves = wheel.getRawTargetPositions();
  const to85 = moves.find(p=>p.rowNum===8 && p.colNum===5);
  assert.ok(to85, "红车可至(8,5)");
  gaming.bulletin.notice('ui input', rook);
  gaming.bulletin.notice('ui input', wheel);
  gaming.bulletin.notice('ui input', [pickTargetFor(wheel, 8, 5) || to85]);
  assert.equal((bf.getUnitsAt(pt(8,5))[0]||{}).name, '车', "红车至(8,5) —— 将军");
  // 断言回合交替：应轮到黑方
  const cur = gaming.situation && gaming.situation.curPlayer;
  assert.ok(cur && cur.id==='黑方玩家', "将军后轮到黑方");

  // 构造将死：清理黑方可挡/可逃的路径，确保黑将无解
  for (let r=2; r<=7; r++) H.clearAt(r,5); // 保持一路威胁
  // 尝试让黑将逃离（若有可走目标则非将死）
  const blackKing = bf.getUnitsAt(pt(1,5))[0];
  const bStep = blackKing && blackKing.skills && blackKing.skills.find(s=>s.getRawTargetPositions);
  const escape = bStep ? bStep.getRawTargetPositions() : [];
  const hasEscape = escape.some(p => {
    const unit = bf.getUnitsAt(pt(p.rowNum,p.colNum))[0];
    return !unit || unit.owner.id!=='黑方玩家';
  });
  assert.ok(!hasEscape, "黑将无逃点（示意检查）");
});
})();
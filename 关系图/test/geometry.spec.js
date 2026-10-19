'use strict';

const { describe, it, assertEqual, assertTruthy, assertDeepEqual } = require('./spec-common');
const G = require('../geometry.js');

describe('几何', () => {
  it('端口坐标', () => {
    const rect = { x: 10, y: 20, width: 100, height: 60 };
    assertDeepEqual(G.portPoint(rect, 'right'), { x: 110, y: 50, nx: 1, ny: 0 });
    assertDeepEqual(G.portPoint(rect, 'top'), { x: 60, y: 20, nx: 0, ny: -1 });
  });

  it('曲线路径与中点', () => {
    const a = { x: 0, y: 0, nx: 1, ny: 0 };
    const b = { x: 200, y: 0, nx: -1, ny: 0 };
    const path = G.buildRelationPath(a, b, 'curve');
    assertTruthy(path.d.indexOf('C') > -1);
    assertEqual(path.mid.x, 100);
    assertEqual(path.mid.y, 0);
  });

  it('直线路径', () => {
    const a = { x: 0, y: 0, nx: 1, ny: 0 };
    const b = { x: 200, y: 100, nx: -1, ny: 0 };
    const path = G.buildRelationPath(a, b, 'straight');
    assertEqual(path.d, 'M 0 0 L 200 100');
    assertDeepEqual(path.mid, { x: 100, y: 50 });
  });

  it('自由端点也能生成路径', () => {
    const path = G.buildRelationPath({ x: 0, y: 0, nx: null, ny: null }, { x: 100, y: 0, nx: null, ny: null }, 'curve');
    assertTruthy(path.d.indexOf('C') > -1);
    assertEqual(path.mid.x, 50);
  });

  it('吸附参考线', () => {
    const moving = { x: 102, y: 50, width: 100, height: 40 };
    const other = { x: 100, y: 0, width: 100, height: 40 };
    const snap = G.snapGuides(moving, [other], 6);
    assertEqual(snap.dx, -2);
    assertEqual(snap.guideX, 100);
  });

  it('六种对齐方式', () => {
    const rects = [
      { id: 'a', x: 10, y: 20, width: 100, height: 40 },
      { id: 'b', x: 200, y: 100, width: 50, height: 80 }
    ];
    assertDeepEqual(G.alignRects(rects, 'left').map(r => r.x), [10, 10]);
    assertDeepEqual(G.alignRects(rects, 'right').map(r => r.x), [150, 200]);
    assertDeepEqual(G.alignRects(rects, 'centerX').map(r => r.x), [80, 105]);
    assertDeepEqual(G.alignRects(rects, 'top').map(r => r.y), [20, 20]);
    assertDeepEqual(G.alignRects(rects, 'bottom').map(r => r.y), [140, 100]);
    assertDeepEqual(G.alignRects(rects, 'centerY').map(r => r.y), [80, 60]);
    assertDeepEqual(G.alignRects(rects, 'left').map(r => r.id), ['a', 'b']);
  });

  it('水平分布按相邻边距等距且首尾不动', () => {
    const rects = [
      { id: 'a', x: 0, y: 0, width: 100, height: 40 },
      { id: 'b', x: 150, y: 30, width: 60, height: 20 },
      { id: 'c', x: 400, y: 10, width: 80, height: 60 }
    ];
    const out = {};
    G.distributeRects(rects, 'x').forEach(r => { out[r.id] = r; });
    assertEqual(out.a.x, 0);
    assertEqual(out.c.x, 400);
    assertEqual(out.b.x, 220);
    assertEqual(rects[1].x, 150);

    const two = {};
    G.distributeRects(rects.slice(0, 2), 'x').forEach(r => { two[r.id] = r; });
    assertEqual(two.b.x, 150);
  });

  it('垂直分布按相邻边距等距且首尾不动', () => {
    const rects = [
      { id: 'a', x: 0, y: 0, width: 100, height: 40 },
      { id: 'b', x: 10, y: 100, width: 60, height: 20 },
      { id: 'c', x: 20, y: 300, width: 80, height: 60 }
    ];
    const out = {};
    G.distributeRects(rects, 'y').forEach(r => { out[r.id] = r; });
    assertEqual(out.a.y, 0);
    assertEqual(out.c.y, 300);
    assertEqual(out.b.y, 160);
  });

  it('总尺寸超过首尾跨度时归零间距、首张不动、末张移动', () => {
    // 跨度 200，宽度和 300：无法容纳，间距应为 0，顺序排开。
    const rects = [
      { id: 'a', x: 0, y: 0, width: 100, height: 40 },
      { id: 'b', x: 60, y: 30, width: 100, height: 20 },
      { id: 'c', x: 100, y: 10, width: 100, height: 60 }
    ];
    const out = {};
    G.distributeRects(rects, 'x').forEach(r => { out[r.id] = r; });
    assertEqual(out.a.x, 0);
    assertEqual(out.b.x, 100);
    assertEqual(out.c.x, 200);
    assertEqual(out.c.x > 100, true);

    const vertical = [
      { id: 'a', x: 0, y: 0, width: 100, height: 40 },
      { id: 'b', x: 10, y: 20, width: 60, height: 40 },
      { id: 'c', x: 20, y: 30, width: 80, height: 40 }
    ];
    const outY = {};
    G.distributeRects(vertical, 'y').forEach(r => { outY[r.id] = r; });
    assertEqual(outY.a.y, 0);
    assertEqual(outY.b.y, 40);
    assertEqual(outY.c.y, 80);
    assertEqual(outY.a.x, 0);
    assertEqual(outY.b.x, 10);
  });

  it('框选矩形与卡片相交', () => {
    const card = { x: 100, y: 100, width: 160, height: 80 };
    assertEqual(G.rectsIntersect(card, { x: 120, y: 120, width: 20, height: 20 }), true);
    assertEqual(G.rectsIntersect(card, { x: 50, y: 50, width: 300, height: 300 }), true);
    assertEqual(G.rectsIntersect(card, { x: 0, y: 0, width: 40, height: 40 }), false);
    assertEqual(G.rectsIntersect(card, { x: 261, y: 0, width: 40, height: 300 }), false);
  });

  it('适应内容', () => {
    const view = G.fitView({ x: 0, y: 0, width: 200, height: 100 }, { width: 800, height: 600 }, 60);
    assertTruthy(view.zoom > 0);
    const back = G.worldToScreen({ x: 100, y: 50 }, view, { left: 0, top: 0 });
    assertEqual(Math.round(back.x), 400);
    assertEqual(Math.round(back.y), 300);
  });
});

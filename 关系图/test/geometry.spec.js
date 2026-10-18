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

  it('适应内容', () => {
    const view = G.fitView({ x: 0, y: 0, width: 200, height: 100 }, { width: 800, height: 600 }, 60);
    assertTruthy(view.zoom > 0);
    const back = G.worldToScreen({ x: 100, y: 50 }, view, { left: 0, top: 0 });
    assertEqual(Math.round(back.x), 400);
    assertEqual(Math.round(back.y), 300);
  });
});

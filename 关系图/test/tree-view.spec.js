'use strict';

const { describe, it, assertEqual, assertTruthy } = require('./spec-common');
const T = require('../tree-view.js');
const M = require('../model.js');

describe('左树 HTML', () => {
  it('按原型嵌套并标出状态', () => {
    const doc = M.createDocument();
    const a = M.createEntity(doc, { id: 'n_a', name: '物种' });
    M.createEntity(doc, { id: 'n_b', name: '虎', prototypeId: 'n_a', position: { x: 0, y: 0 } });
    M.createEntity(doc, { id: 'n_c', name: '白化虎', prototypeId: 'n_b' });
    const html = T.renderTreeHTML(doc, { selectedId: 'n_b', armedId: null, collapsed: new Set() });
    assertTruthy(html.indexOf('data-id="n_a"') > -1);
    assertTruthy(html.indexOf('白化虎') > -1);
    assertTruthy(html.indexOf('未放置') > -1);
    assertTruthy(html.indexOf('selected') > -1);
  });

  it('关系行显示标签和端点', () => {
    const doc = M.createDocument();
    M.createEntity(doc, { id: 'n_a', name: '虎', position: { x: 0, y: 0 } });
    M.createEntity(doc, { id: 'n_b', name: '狼', position: { x: 100, y: 0 } });
    M.createRelation(doc, { id: 'r_1', name: '捕食' });
    M.createRelation(doc, {
      id: 'r_2',
      prototypeId: 'r_1',
      ends: {
        a: M.makeBoundEnd('n_a', 'right'),
        b: M.makeBoundEnd('n_b', 'left')
      }
    });
    const html = T.renderTreeHTML(doc, { selectedId: null, armedId: 'r_1', collapsed: new Set() });
    assertTruthy(html.indexOf('捕食') > -1);
    assertTruthy(html.indexOf('虎 → 狼') > -1);
    assertTruthy(html.indexOf('armed') > -1);
  });

  it('escapeHTML 转义引号、尖括号与 &', () => {
    assertEqual(T.escapeHTML('a"b<c>d&e'), 'a&quot;b&lt;c&gt;d&amp;e');
    assertEqual(T.escapeHTML("a'b"), 'a&#39;b');
    assertEqual(T.escapeHTML(null), '');
  });

  it('data-id 输出经过转义', () => {
    const doc = {
      entities: [{ id: 'n_a"b', name: 'X', prototypeId: null, position: null, style: {} }],
      relations: []
    };
    const html = T.renderTreeHTML(doc, { selectedId: null, armedId: null, collapsed: new Set() });
    assertTruthy(html.indexOf('data-id="n_a&quot;b"') > -1);
    assertTruthy(html.indexOf('data-id="n_a"b"') === -1);
  });
});

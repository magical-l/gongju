'use strict';

const { describe, it, assertEqual, assertTruthy } = require('./spec-common');
const T = require('../tree-view.js');
const M = require('../model.js');

function rowClass(html, id) {
  const match = html.match(new RegExp('<div class="rg-tree-row([^"]*)"[^>]*data-id="' + id + '"'));
  return match ? match[1] : null;
}

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

  it('selectedIds 多选高亮并兼容 selectedId', () => {
    const doc = M.createDocument();
    M.createEntity(doc, { id: 'n_a', name: '物种' });
    M.createEntity(doc, { id: 'n_b', name: '虎' });
    M.createEntity(doc, { id: 'n_c', name: '狼' });
    const html = T.renderTreeHTML(doc, {
      selectedId: 'n_a',
      selectedIds: new Set(['n_a', 'n_b']),
      collapsed: new Set()
    });
    assertTruthy(rowClass(html, 'n_a').indexOf('selected') > -1);
    assertTruthy(rowClass(html, 'n_b').indexOf('selected') > -1);
    assertEqual(rowClass(html, 'n_c').indexOf('selected'), -1);

    const onlyMain = T.renderTreeHTML(doc, { selectedId: 'n_c', collapsed: new Set() });
    assertTruthy(rowClass(onlyMain, 'n_c').indexOf('selected') > -1);
  });

  it('搜索按实体名过滤并强制展开祖先', () => {
    const doc = M.createDocument();
    M.createEntity(doc, { id: 'n_a', name: '物种' });
    M.createEntity(doc, { id: 'n_b', name: '哺乳动物', prototypeId: 'n_a' });
    M.createEntity(doc, { id: 'n_c', name: '虎', prototypeId: 'n_b' });
    M.createEntity(doc, { id: 'n_d', name: '白化虎', prototypeId: 'n_c' });
    M.createEntity(doc, { id: 'n_e', name: '狼', prototypeId: 'n_b' });
    M.createEntity(doc, { id: 'n_f', name: '植物' });
    const html = T.renderTreeHTML(doc, {
      selectedId: null,
      query: '白化',
      collapsed: new Set(['n_a', 'n_b', 'n_c'])
    });
    ['n_a', 'n_b', 'n_c', 'n_d'].forEach(function (id) {
      assertTruthy(html.indexOf('data-id="' + id + '"') > -1, id + ' 应显示');
    });
    assertEqual(html.indexOf('data-id="n_e"'), -1);
    assertEqual(html.indexOf('data-id="n_f"'), -1);
    assertTruthy(html.indexOf('rg-tree-children') > -1);
  });

  it('搜索不区分大小写并匹配关系有效标签', () => {
    const doc = M.createDocument();
    M.createEntity(doc, { id: 'n_a', name: 'Tiger' });
    M.createEntity(doc, { id: 'n_b', name: 'Wolf' });
    M.createRelation(doc, { id: 'r_1', name: '捕食' });
    M.createRelation(doc, { id: 'r_2', prototypeId: 'r_1' });

    const byName = T.renderTreeHTML(doc, { selectedId: null, query: 'tIGer', collapsed: new Set() });
    assertTruthy(byName.indexOf('Tiger') > -1);
    assertEqual(byName.indexOf('Wolf'), -1);

    const byLabel = T.renderTreeHTML(doc, { selectedId: null, query: '捕食', collapsed: new Set() });
    assertTruthy(byLabel.indexOf('data-id="r_1"') > -1);
    assertTruthy(byLabel.indexOf('data-id="r_2"') > -1);
    assertEqual(byLabel.indexOf('data-id="n_a"'), -1);
  });

  it('搜索无匹配时显示空提示', () => {
    const doc = M.createDocument();
    M.createEntity(doc, { id: 'n_a', name: '虎' });
    const html = T.renderTreeHTML(doc, { selectedId: null, query: '不存在', collapsed: new Set() });
    assertTruthy(html.indexOf('没有匹配的对象') > -1);
    assertEqual(html.indexOf('data-id="n_a"'), -1);
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

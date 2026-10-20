'use strict';

const { describe, it, assertEqual, assertTruthy } = require('./spec-common');
const M = require('../model.js');
const T = require('../templates.js');

describe('内置模板', () => {
  it('导出五套模板且 id 唯一', () => {
    assertEqual(T.list.length, 5);
    const ids = new Set(T.list.map(function (tpl) { return tpl.id; }));
    assertEqual(ids.size, 5);
    T.list.forEach(function (tpl) {
      assertTruthy(tpl.name, '模板缺少名称');
      assertTruthy(tpl.desc, '模板缺少说明');
      assertEqual(typeof tpl.build, 'function');
    });
  });

  T.list.forEach(function (tpl) {
    it('模板「' + tpl.name + '」是合法文档', () => {
      const doc = tpl.build();
      const result = M.validateDocument(JSON.parse(JSON.stringify(doc)));
      assertEqual(result.ok, true, result.error);
    });

    it('模板「' + tpl.name + '」演示继承并有可见内容', () => {
      const doc = tpl.build();
      const roots = doc.entities.filter(function (e) {
        return !e.prototypeId && !e.position;
      });
      assertTruthy(roots.length >= 1, '缺少未放置根定义');
      assertTruthy(doc.entities.some(function (e) {
        return !!e.position && !!e.prototypeId;
      }), '缺少继承根定义的已放置实例');
      assertTruthy(doc.relations.some(function (r) { return !r.ends; }), '缺少关系定义');
      assertTruthy(doc.relations.some(function (r) {
        return !!r.ends && M.relationVisibility(doc, r);
      }), '缺少可见关系实例');
      assertTruthy(doc.entities.length >= 6 && doc.entities.length <= 10, '实体数量超出 6–10');
      assertTruthy(doc.relations.length >= 4, '关系数量少于 4');
    });

    it('模板「' + tpl.name + '」每次构建互不共享', () => {
      const first = tpl.build();
      const second = tpl.build();
      const original = second.entities[0].name;
      first.entities[0].name = '被改';
      assertEqual(second.entities[0].name, original);
    });
  });
});

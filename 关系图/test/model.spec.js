'use strict';

const { describe, it, assertEqual, assertDeepEqual, assertThrows, summary } = require('./spec-common');
const M = require('../model.js');

describe('文档与对象', () => {
  it('创建空文档', () => {
    const doc = M.createDocument('测试');
    assertEqual(doc.schemaVersion, 1);
    assertEqual(doc.name, '测试');
    assertEqual(doc.entities.length, 0);
    assertEqual(doc.relations.length, 0);
    assertEqual(doc.viewport.zoom, 1);
  });

  it('创建实体与关系并可查找', () => {
    const doc = M.createDocument();
    const e = M.createEntity(doc, { id: 'n_a', name: '物种' });
    const r = M.createRelation(doc, { id: 'r_a', name: '捕食' });
    assertEqual(M.findEntity(doc, 'n_a'), e);
    assertEqual(M.findRelation(doc, 'r_a'), r);
    assertEqual(M.kindOf(e), 'entity');
    assertEqual(M.kindOf(r), 'relation');
  });

  it('父原型不存在时抛错', () => {
    const doc = M.createDocument();
    assertThrows(() => M.createEntity(doc, { id: 'n_b', prototypeId: 'n_missing' }), '父原型不存在');
  });

  it('显式非法 ID 创建时抛错', () => {
    const doc = M.createDocument();
    assertThrows(() => M.createEntity(doc, { id: 'bad id' }), 'ID 非法');
    assertThrows(() => M.createEntity(doc, { id: 'x_1' }), 'ID 非法');
    assertThrows(() => M.createEntity(doc, { id: 'n_a"b' }), 'ID 非法');
    assertThrows(() => M.createRelation(doc, { id: 'n_1' }), 'ID 非法');
    assertThrows(() => M.createRelation(doc, { id: 'r_1<x>' }), 'ID 非法');
    assertEqual(doc.entities.length, 0);
    assertEqual(doc.relations.length, 0);
  });

  it('子对象、根与后代', () => {
    const doc = M.createDocument();
    const a = M.createEntity(doc, { id: 'n_a', name: '物种' });
    M.createEntity(doc, { id: 'n_b', name: '哺乳动物', prototypeId: 'n_a' });
    M.createEntity(doc, { id: 'n_c', name: '虎', prototypeId: 'n_b' });
    assertDeepEqual(M.getChildren(doc, a).map(x => x.id), ['n_b']);
    assertDeepEqual(M.getRoots(doc, 'entity').map(x => x.id), ['n_a']);
    assertDeepEqual(Array.from(M.getDescendantIds(doc, a)).sort(), ['n_b', 'n_c']);
    assertEqual(M.isDescendant(doc, 'n_c', 'n_a'), true);
    assertEqual(M.isDescendant(doc, 'n_a', 'n_c'), false);
  });
});

describe('样式与标签', () => {
  it('按属性沿原型链继承并覆盖', () => {
    const doc = M.createDocument();
    const a = M.createEntity(doc, { id: 'n_a', name: '物种' });
    const b = M.createEntity(doc, { id: 'n_b', name: '虎', prototypeId: 'n_a' });
    const c = M.createEntity(doc, { id: 'n_c', name: '白化虎', prototypeId: 'n_b', style: { fill: '#ffffff' } });
    M.setStyleKey(a, 'fill', '#fde8e8');
    assertEqual(M.resolveStyle(doc, b).fill, '#fde8e8');
    assertEqual(M.resolveStyle(doc, c).fill, '#ffffff');
    M.clearStyleKey(c, 'fill');
    assertEqual(M.resolveStyle(doc, c).fill, '#fde8e8');
  });

  it('样式来源区分默认/继承/覆盖', () => {
    const doc = M.createDocument();
    const a = M.createEntity(doc, { id: 'n_a', name: '物种' });
    const b = M.createEntity(doc, { id: 'n_b', name: '虎', prototypeId: 'n_a' });
    let src = M.getStyleSource(doc, b, 'border');
    assertEqual(src.source, 'default');
    M.setStyleKey(a, 'fill', '#fde8e8');
    src = M.getStyleSource(doc, b, 'fill');
    assertEqual(src.source, 'inherited');
    assertEqual(src.sourceName, '物种');
    M.setStyleKey(b, 'fill', '#fff');
    src = M.getStyleSource(doc, b, 'fill');
    assertEqual(src.source, 'own');
  });

  it('关系标签继承与覆盖', () => {
    const doc = M.createDocument();
    const r1 = M.createRelation(doc, { id: 'r_1', name: '捕食' });
    const r2 = M.createRelation(doc, { id: 'r_2', prototypeId: 'r_1' });
    assertEqual(M.effectiveRelationLabel(doc, r2), '捕食');
    r2.name = '吃';
    assertEqual(M.effectiveRelationLabel(doc, r2), '吃');
    r2.name = '';
    r1.name = '捕猎';
    assertEqual(M.effectiveRelationLabel(doc, r2), '捕猎');
    assertEqual(M.effectiveRelationLabel(doc, M.createRelation(doc, { id: 'r_3' })), '关系');
  });

  it('放置状态决定可见性', () => {
    const doc = M.createDocument();
    const a = M.createEntity(doc, { id: 'n_a', name: '虎', position: { x: 0, y: 0 } });
    const b = M.createEntity(doc, { id: 'n_b', name: '狼', position: { x: 200, y: 0 } });
    const c = M.createEntity(doc, { id: 'n_c', name: '鹿' });
    const bound = M.createRelation(doc, {
      id: 'r_1',
      ends: { a: M.makeBoundEnd('n_a', 'right'), b: M.makeBoundEnd('n_b', 'left') }
    });
    assertEqual(M.relationVisibility(doc, bound), true);
    const hidden = M.createRelation(doc, {
      id: 'r_2',
      ends: { a: M.makeBoundEnd('n_a', 'right'), b: M.makeBoundEnd('n_c', 'left') }
    });
    assertEqual(M.relationVisibility(doc, hidden), false);
    const free = M.createRelation(doc, {
      id: 'r_3',
      ends: { a: M.makeFreeEnd(10, 10), b: M.makeFreeEnd(100, 10) }
    });
    assertEqual(M.relationVisibility(doc, free), true);
    assertEqual(M.relationEndsAreFree(free), true);
    assertEqual(M.relationIsHalfBound(free), false);
  });

  it('端点可在实体与自由坐标之间改接', () => {
    const doc = M.createDocument();
    const a = M.createEntity(doc, { id: 'n_a', name: 'A' });
    const rel = M.createRelation(doc, {
      id: 'r_1',
      ends: { a: M.makeBoundEnd('n_a', 'right'), b: M.makeFreeEnd(100, 100) }
    });
    assertEqual(M.relationIsHalfBound(rel), true);
    M.setEnd(rel, 'b', M.makeBoundEnd('n_a', 'left'));
    assertEqual(M.relationIsHalfBound(rel), false);
    M.setEnd(rel, 'b', M.makeFreeEnd(200, 200));
    assertEqual(M.isEndFree(rel.ends.b), true);
  });

  it('默认名字', () => {
    const doc = M.createDocument();
    const root = M.createEntity(doc, { id: 'n_a', name: '物种' });
    assertEqual(M.nextEntityName(doc, null), '新实体');
    assertEqual(M.nextEntityName(doc, root), '物种 1');
    M.createEntity(doc, { id: 'n_b', name: '物种 1', prototypeId: 'n_a' });
    assertEqual(M.nextEntityName(doc, root), '物种 2');
    const r = M.createRelation(doc, { id: 'r_1', name: '捕食' });
    assertEqual(M.nextRelationDefinitionName(doc, r), '捕食 变体');
  });
});

describe('删除与校验', () => {
  it('被引用为原型的对象不能删', () => {
    const doc = M.createDocument();
    const a = M.createEntity(doc, { id: 'n_a', name: '物种' });
    M.createEntity(doc, { id: 'n_b', name: '虎', prototypeId: 'n_a' });
    const check = M.deletionCheck(doc, a);
    assertEqual(check.ok, false);
    assertThrows(() => M.deleteObject(doc, a), '以它为原型');
  });

  it('删除实体会连带删除挂在它上面的关系', () => {
    const doc = M.createDocument();
    const a = M.createEntity(doc, { id: 'n_a', name: '虎', position: { x: 0, y: 0 } });
    const b = M.createEntity(doc, { id: 'n_b', name: '狼', position: { x: 100, y: 0 } });
    M.createRelation(doc, {
      id: 'r_1',
      ends: { a: M.makeBoundEnd('n_a', 'right'), b: M.makeBoundEnd('n_b', 'left') }
    });
    const result = M.deleteObject(doc, a);
    assertEqual(result.deletedRelations, 1);
    assertEqual(doc.entities.length, 1);
    assertEqual(doc.relations.length, 0);
  });

  it('连带关系被当作原型时整体禁止删除', () => {
    const doc = M.createDocument();
    const a = M.createEntity(doc, { id: 'n_a', name: '虎', position: { x: 0, y: 0 } });
    const b = M.createEntity(doc, { id: 'n_b', name: '狼', position: { x: 100, y: 0 } });
    M.createRelation(doc, {
      id: 'r_1',
      ends: { a: M.makeBoundEnd('n_a', 'right'), b: M.makeBoundEnd('n_b', 'left') }
    });
    M.createRelation(doc, { id: 'r_2', prototypeId: 'r_1' });
    assertEqual(M.deletionCheck(doc, a).ok, false);
  });

  it('导入校验接受合法文档并拒绝坏文档', () => {
    const doc = M.createDocument('合法');
    const a = M.createEntity(doc, { id: 'n_a', name: '虎', position: { x: 1, y: 2 } });
    M.createRelation(doc, {
      id: 'r_1',
      ends: { a: M.makeBoundEnd('n_a', 'right'), b: M.makeFreeEnd(100, 20) }
    });
    const ok = M.validateDocument(JSON.parse(JSON.stringify(doc)));
    assertEqual(ok.ok, true);
    assertEqual(ok.doc.name, '合法');

    const badVersion = JSON.parse(JSON.stringify(doc));
    badVersion.schemaVersion = 2;
    assertEqual(M.validateDocument(badVersion).ok, false);

    const badRef = JSON.parse(JSON.stringify(doc));
    badRef.relations[0].prototypeId = 'r_missing';
    assertEqual(M.validateDocument(badRef).ok, false);

    const badCycle = JSON.parse(JSON.stringify(doc));
    badCycle.entities.push({ id: 'n_b', name: 'B', prototypeId: 'n_c', position: null, style: {} });
    badCycle.entities.push({ id: 'n_c', name: 'C', prototypeId: 'n_b', position: null, style: {} });
    assertEqual(M.validateDocument(badCycle).ok, false);

    const badEnd = JSON.parse(JSON.stringify(doc));
    badEnd.relations[0].ends.a.port = 'middle';
    assertEqual(M.validateDocument(badEnd).ok, false);

    const badStyle = JSON.parse(JSON.stringify(doc));
    badStyle.entities[0].style = { shape: 'diamond' };
    assertEqual(M.validateDocument(badStyle).ok, false);

    const selfLoop = JSON.parse(JSON.stringify(doc));
    selfLoop.relations[0].ends.b = M.makeBoundEnd('n_a', 'left');
    assertEqual(M.validateDocument(selfLoop).ok, false);
  });

  it('validateDocument 拒绝带引号或尖括号的 ID', () => {
    const doc = M.createDocument();
    M.createEntity(doc, { id: 'n_a', name: '虎', position: { x: 1, y: 2 } });
    M.createRelation(doc, {
      id: 'r_1',
      ends: { a: M.makeBoundEnd('n_a', 'right'), b: M.makeFreeEnd(100, 20) }
    });

    const quotedEntityId = JSON.parse(JSON.stringify(doc));
    quotedEntityId.entities[0].id = 'n_a"><script>';
    assertEqual(M.validateDocument(quotedEntityId).ok, false);

    const angleRelationId = JSON.parse(JSON.stringify(doc));
    angleRelationId.relations[0].id = 'r_1<x>';
    assertEqual(M.validateDocument(angleRelationId).ok, false);
  });
});

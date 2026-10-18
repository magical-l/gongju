(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.RGModel = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const SCHEMA_VERSION = 1;
  const PORTS = ['top', 'right', 'bottom', 'left'];
  const ENTITY_ID_PATTERN = /^n_[A-Za-z0-9_-]+$/;
  const RELATION_ID_PATTERN = /^r_[A-Za-z0-9_-]+$/;
  const ENTITY_STYLE_DEFAULTS = Object.freeze({
    shape: 'rounded', fill: '#ffffff', border: '#9aa3b2', text: '#1f2430', width: 168
  });
  const RELATION_STYLE_DEFAULTS = Object.freeze({
    color: '#5b6472', dash: false, arrow: 'end', lineStyle: 'curve', showLabel: true, width: 2
  });
  const ENTITY_STYLE_KEYS = ['shape', 'fill', 'border', 'text', 'width'];
  const RELATION_STYLE_KEYS = ['color', 'dash', 'arrow', 'lineStyle', 'showLabel', 'width'];
  const SHAPES = ['rounded', 'rect', 'pill'];
  const ARROWS = ['end', 'both', 'none'];
  const LINE_STYLES = ['curve', 'straight'];

  let idCounter = 0;
  function newId(prefix) {
    idCounter += 1;
    return prefix + Date.now().toString(36) + '_' + idCounter.toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function isValidEntityId(id) {
    return typeof id === 'string' && ENTITY_ID_PATTERN.test(id);
  }

  function isValidRelationId(id) {
    return typeof id === 'string' && RELATION_ID_PATTERN.test(id);
  }

  function kindOf(obj) {
    if (!obj || typeof obj.id !== 'string') return null;
    if (obj.id.startsWith('n_')) return 'entity';
    if (obj.id.startsWith('r_')) return 'relation';
    return null;
  }

  function createDocument(name) {
    return {
      schemaVersion: SCHEMA_VERSION,
      name: name || '未命名关系图',
      entities: [],
      relations: [],
      viewport: { x: 0, y: 0, zoom: 1 }
    };
  }

  function findEntity(doc, id) {
    return doc.entities.find(function (e) { return e.id === id; }) || null;
  }

  function findRelation(doc, id) {
    return doc.relations.find(function (r) { return r.id === id; }) || null;
  }

  function findObject(doc, id) {
    return findEntity(doc, id) || findRelation(doc, id);
  }

  function getParent(doc, obj) {
    if (!obj || !obj.prototypeId) return null;
    return kindOf(obj) === 'entity' ? findEntity(doc, obj.prototypeId) : findRelation(doc, obj.prototypeId);
  }

  function getChildren(doc, obj) {
    const arr = kindOf(obj) === 'entity' ? doc.entities : doc.relations;
    return arr.filter(function (o) { return o.prototypeId === obj.id && o.id !== obj.id; });
  }

  function getRoots(doc, kind) {
    const arr = kind === 'entity' ? doc.entities : doc.relations;
    return arr.filter(function (o) { return !o.prototypeId; });
  }

  function getDescendantIds(doc, obj) {
    const out = new Set();
    const walk = function (node) {
      getChildren(doc, node).forEach(function (child) {
        if (out.has(child.id)) return;
        out.add(child.id);
        walk(child);
      });
    };
    walk(obj);
    return out;
  }

  function isDescendant(doc, candidateId, ancestorId) {
    const ancestor = findObject(doc, ancestorId);
    return !!ancestor && getDescendantIds(doc, ancestor).has(candidateId);
  }

  function createEntity(doc, data) {
    const d = data || {};
    const explicitId = d.id != null;
    if (explicitId && !isValidEntityId(d.id)) throw new Error('实体 ID 非法: ' + d.id);
    const id = explicitId ? d.id : newId('n_');
    if (findObject(doc, id)) throw new Error('ID 已存在: ' + id);
    if (d.prototypeId && !findEntity(doc, d.prototypeId)) throw new Error('父原型不存在: ' + d.prototypeId);
    const entity = {
      id: id,
      name: typeof d.name === 'string' && d.name ? d.name : '新实体',
      prototypeId: d.prototypeId || null,
      position: d.position || null,
      style: d.style ? Object.assign({}, d.style) : {}
    };
    doc.entities.push(entity);
    return entity;
  }

  function createRelation(doc, data) {
    const d = data || {};
    const explicitId = d.id != null;
    if (explicitId && !isValidRelationId(d.id)) throw new Error('关系 ID 非法: ' + d.id);
    const id = explicitId ? d.id : newId('r_');
    if (findObject(doc, id)) throw new Error('ID 已存在: ' + id);
    if (d.prototypeId && !findRelation(doc, d.prototypeId)) throw new Error('父原型不存在: ' + d.prototypeId);
    const relation = {
      id: id,
      name: typeof d.name === 'string' ? d.name : '',
      prototypeId: d.prototypeId || null,
      ends: d.ends || null,
      style: d.style ? Object.assign({}, d.style) : {}
    };
    doc.relations.push(relation);
    return relation;
  }

  function setParent(doc, obj, parentId) {
    if (parentId === obj.id) throw new Error('不能以自己为原型');
    if (parentId) {
      const parent = kindOf(obj) === 'entity' ? findEntity(doc, parentId) : findRelation(doc, parentId);
      if (!parent) throw new Error('父原型不存在');
      if (isDescendant(doc, parentId, obj.id)) throw new Error('不能挂到自己的后代下');
    }
    obj.prototypeId = parentId || null;
  }

  function styleDefaults(kind) {
    return kind === 'entity' ? ENTITY_STYLE_DEFAULTS : RELATION_STYLE_DEFAULTS;
  }

  function styleChain(doc, obj) {
    const chain = [];
    const seen = new Set();
    let cur = obj;
    while (cur && !seen.has(cur.id)) {
      seen.add(cur.id);
      chain.unshift(cur);
      cur = getParent(doc, cur);
    }
    return chain;
  }

  function resolveStyle(doc, obj) {
    const style = Object.assign({}, styleDefaults(kindOf(obj)));
    styleChain(doc, obj).forEach(function (node) {
      Object.assign(style, node.style || {});
    });
    return style;
  }

  function getStyleSource(doc, obj, key) {
    const chain = styleChain(doc, obj);
    let found = null;
    for (let i = chain.length - 1; i >= 0; i -= 1) {
      const node = chain[i];
      if (node.style && Object.prototype.hasOwnProperty.call(node.style, key)) {
        found = node;
        break;
      }
    }
    if (!found) return { value: styleDefaults(kindOf(obj))[key], source: 'default' };
    const sourceName = kindOf(found) === 'entity' ? found.name : effectiveRelationLabel(doc, found);
    return {
      value: found.style[key],
      source: found === obj ? 'own' : 'inherited',
      sourceId: found.id,
      sourceName: sourceName
    };
  }

  function setStyleKey(obj, key, value) {
    obj.style = obj.style || {};
    obj.style[key] = value;
  }

  function clearStyleKey(obj, key) {
    if (obj.style) delete obj.style[key];
  }

  function effectiveRelationLabel(doc, relation) {
    const seen = new Set();
    let cur = relation;
    while (cur && !seen.has(cur.id)) {
      if (typeof cur.name === 'string' && cur.name.trim()) return cur.name.trim();
      seen.add(cur.id);
      cur = getParent(doc, cur);
    }
    return '关系';
  }

  function getLabelSource(doc, relation) {
    const seen = new Set();
    let cur = relation;
    while (cur && !seen.has(cur.id)) {
      if (typeof cur.name === 'string' && cur.name.trim()) {
        if (cur === relation) return { value: cur.name.trim(), source: 'own' };
        return { value: cur.name.trim(), source: 'inherited', sourceId: cur.id, sourceName: cur.name.trim() };
      }
      seen.add(cur.id);
      cur = getParent(doc, cur);
    }
    return { value: '关系', source: 'default' };
  }

  function isEndBound(end) {
    return !!(end && typeof end.entityId === 'string' && end.entityId);
  }

  function isEndFree(end) {
    return !!(end && Number.isFinite(end.x) && Number.isFinite(end.y));
  }

  function makeBoundEnd(entityId, port) { return { entityId: entityId, port: port }; }
  function makeFreeEnd(x, y) { return { x: x, y: y }; }

  function relationEndsAreFree(rel) {
    return !!rel.ends && isEndFree(rel.ends.a) && isEndFree(rel.ends.b);
  }

  function relationEndsAreBound(rel) {
    return !!rel.ends && isEndBound(rel.ends.a) && isEndBound(rel.ends.b);
  }

  function relationIsHalfBound(rel) {
    if (!rel.ends) return false;
    return isEndBound(rel.ends.a) !== isEndBound(rel.ends.b);
  }

  function relationIsPlaced(rel) { return !!rel.ends; }

  function relationVisibility(doc, rel) {
    if (!rel.ends) return false;
    const ends = [rel.ends.a, rel.ends.b];
    for (let i = 0; i < ends.length; i += 1) {
      if (!isEndBound(ends[i])) continue;
      const entity = findEntity(doc, ends[i].entityId);
      if (!entity || !entity.position) return false;
    }
    return true;
  }

  function placeEntity(entity, x, y) { entity.position = { x: x, y: y }; }
  function unplaceEntity(entity) { entity.position = null; }
  function cloneEnd(end) {
    return isEndBound(end)
      ? { entityId: end.entityId, port: end.port }
      : { x: end.x, y: end.y };
  }
  function placeRelation(relation, ends) {
    relation.ends = { a: cloneEnd(ends.a), b: cloneEnd(ends.b) };
  }
  function unplaceRelation(relation) { relation.ends = null; }
  function setEnd(relation, key, end) { relation.ends[key] = cloneEnd(end); }

  function nextEntityName(doc, parent) {
    if (!parent) {
      const used = new Set(doc.entities.map(function (e) { return e.name; }));
      if (!used.has('新实体')) return '新实体';
      let n = 2;
      while (used.has('新实体 ' + n)) n += 1;
      return '新实体 ' + n;
    }
    const used = new Set(doc.entities
      .filter(function (e) { return e.prototypeId === parent.id; })
      .map(function (e) { return e.name; }));
    let n = 1;
    while (used.has(parent.name + ' ' + n)) n += 1;
    return parent.name + ' ' + n;
  }

  function nextRelationDefinitionName(doc, parent) {
    if (!parent) {
      const used = new Set(doc.relations.map(function (r) { return r.name; }));
      if (!used.has('新关系')) return '新关系';
      let n = 2;
      while (used.has('新关系 ' + n)) n += 1;
      return '新关系 ' + n;
    }
    const base = effectiveRelationLabel(doc, parent) + ' 变体';
    const used = new Set(doc.relations
      .filter(function (r) { return r.prototypeId === parent.id; })
      .map(function (r) { return effectiveRelationLabel(doc, r); }));
    if (!used.has(base)) return base;
    let n = 2;
    while (used.has(base + ' ' + n)) n += 1;
    return base + ' ' + n;
  }

  function endsBoundTo(rel, entityId) {
    if (!rel.ends) return false;
    return (isEndBound(rel.ends.a) && rel.ends.a.entityId === entityId) ||
      (isEndBound(rel.ends.b) && rel.ends.b.entityId === entityId);
  }

  function deletionCheck(doc, obj) {
    const kind = kindOf(obj);
    const arr = kind === 'entity' ? doc.entities : doc.relations;
    const refs = arr.filter(function (o) { return o.prototypeId === obj.id; });
    if (refs.length) return { ok: false, reason: '有 ' + refs.length + ' 个对象以它为原型' };
    if (kind === 'relation') return { ok: true, incidentRelations: [] };
    const incident = doc.relations.filter(function (r) { return endsBoundTo(r, obj.id); });
    for (let i = 0; i < incident.length; i += 1) {
      const rel = incident[i];
      const relRefs = doc.relations.filter(function (r) { return r.prototypeId === rel.id; });
      if (relRefs.length) {
        return {
          ok: false,
          reason: '关联关系「' + effectiveRelationLabel(doc, rel) + '」仍被 ' + relRefs.length + ' 条关系引用'
        };
      }
    }
    return { ok: true, incidentRelations: incident };
  }

  function deleteObject(doc, obj) {
    const check = deletionCheck(doc, obj);
    if (!check.ok) throw new Error(check.reason);
    if (kindOf(obj) === 'entity') {
      const ids = new Set(check.incidentRelations.map(function (r) { return r.id; }));
      doc.relations = doc.relations.filter(function (r) { return !ids.has(r.id); });
      doc.entities = doc.entities.filter(function (e) { return e.id !== obj.id; });
      return { deletedRelations: ids.size };
    }
    doc.relations = doc.relations.filter(function (r) { return r.id !== obj.id; });
    return { deletedRelations: 1 };
  }

  function cloneDocument(doc) {
    return JSON.parse(JSON.stringify(doc));
  }

  function isPlainObject(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value);
  }

  function validateEnd(end, entityIds) {
    const hasEntity = Object.prototype.hasOwnProperty.call(end, 'entityId');
    const hasCoord = Object.prototype.hasOwnProperty.call(end, 'x') ||
      Object.prototype.hasOwnProperty.call(end, 'y');
    if (hasEntity && hasCoord) return '端点不能同时有实体和坐标';
    if (hasEntity) {
      if (!PORTS.includes(end.port)) return 'port 非法';
      if (!entityIds.has(end.entityId)) return '实体不存在';
      return '';
    }
    if (Number.isFinite(end.x) && Number.isFinite(end.y)) return '';
    return '必须是实体端点或自由坐标';
  }

  function validateStyle(style, allowed) {
    const keys = Object.keys(style);
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      const value = style[key];
      if (!allowed.includes(key)) return '未知属性 ' + key;
      if (key === 'shape' && !SHAPES.includes(value)) return 'shape 非法';
      if (key === 'arrow' && !ARROWS.includes(value)) return 'arrow 非法';
      if (key === 'lineStyle' && !LINE_STYLES.includes(value)) return 'lineStyle 非法';
      if ((key === 'dash' || key === 'showLabel') && typeof value !== 'boolean') return key + ' 必须是布尔';
      if ((key === 'fill' || key === 'border' || key === 'text' || key === 'color') &&
        (typeof value !== 'string' || !value.trim())) return key + ' 必须是非空字符串';
      if (key === 'width' && (!Number.isFinite(value) || value <= 0)) return 'width 必须是正数';
    }
    return '';
  }

  function hasCycle(items) {
    const byId = new Map(items.map(function (o) { return [o.id, o]; }));
    for (let i = 0; i < items.length; i += 1) {
      const seen = new Set();
      let cur = items[i];
      while (cur && cur.prototypeId) {
        if (seen.has(cur.id)) return true;
        seen.add(cur.id);
        cur = byId.get(cur.prototypeId);
      }
    }
    return false;
  }

  function validateDocument(raw) {
    const fail = function (msg) { return { ok: false, error: msg }; };
    if (!isPlainObject(raw)) return fail('文档不是对象');
    if (raw.schemaVersion !== SCHEMA_VERSION) return fail('schemaVersion 必须为 1');
    if (typeof raw.name !== 'string') return fail('name 必须是字符串');
    if (!Array.isArray(raw.entities)) return fail('entities 必须是数组');
    if (!Array.isArray(raw.relations)) return fail('relations 必须是数组');

    const ids = new Set();
    const entityIds = new Set();
    for (let i = 0; i < raw.entities.length; i += 1) {
      const e = raw.entities[i];
      const p = 'entities[' + i + ']';
      if (!isPlainObject(e)) return fail(p + ' 不是对象');
      if (!isValidEntityId(e.id)) return fail(p + '.id 非法');
      if (ids.has(e.id)) return fail('ID 重复: ' + e.id);
      ids.add(e.id);
      entityIds.add(e.id);
      if (typeof e.name !== 'string' || !e.name.trim()) return fail(p + '.name 必须是非空字符串');
      if (e.prototypeId != null && typeof e.prototypeId !== 'string') return fail(p + '.prototypeId 非法');
      if (e.position != null) {
        if (!isPlainObject(e.position) || !Number.isFinite(e.position.x) || !Number.isFinite(e.position.y)) {
          return fail(p + '.position 非法');
        }
      }
      if (!isPlainObject(e.style)) return fail(p + '.style 必须是对象');
      const styleErr = validateStyle(e.style, ENTITY_STYLE_KEYS);
      if (styleErr) return fail(p + '.style: ' + styleErr);
    }

    const relationIds = new Set();
    for (let i = 0; i < raw.relations.length; i += 1) {
      const r = raw.relations[i];
      const p = 'relations[' + i + ']';
      if (!isPlainObject(r)) return fail(p + ' 不是对象');
      if (!isValidRelationId(r.id)) return fail(p + '.id 非法');
      if (ids.has(r.id)) return fail('ID 重复: ' + r.id);
      ids.add(r.id);
      relationIds.add(r.id);
      if (typeof r.name !== 'string') return fail(p + '.name 必须是字符串');
      if (r.prototypeId != null && typeof r.prototypeId !== 'string') return fail(p + '.prototypeId 非法');
      if (!isPlainObject(r.style)) return fail(p + '.style 必须是对象');
      const styleErr = validateStyle(r.style, RELATION_STYLE_KEYS);
      if (styleErr) return fail(p + '.style: ' + styleErr);
      if (r.ends != null) {
        if (!isPlainObject(r.ends) || !isPlainObject(r.ends.a) || !isPlainObject(r.ends.b)) {
          return fail(p + '.ends 非法');
        }
        const errA = validateEnd(r.ends.a, entityIds);
        if (errA) return fail(p + '.ends.a: ' + errA);
        const errB = validateEnd(r.ends.b, entityIds);
        if (errB) return fail(p + '.ends.b: ' + errB);
        if (isEndBound(r.ends.a) && isEndBound(r.ends.b) &&
          r.ends.a.entityId === r.ends.b.entityId) {
          return fail(p + '.ends: 两端不能连接同一个实体');
        }
      }
    }

    for (let i = 0; i < raw.entities.length; i += 1) {
      const e = raw.entities[i];
      if (e.prototypeId != null && !entityIds.has(e.prototypeId)) {
        return fail('实体 ' + e.id + ' 的原型不存在');
      }
    }
    for (let i = 0; i < raw.relations.length; i += 1) {
      const r = raw.relations[i];
      if (r.prototypeId != null && !relationIds.has(r.prototypeId)) {
        return fail('关系 ' + r.id + ' 的原型不存在');
      }
    }
    if (hasCycle(raw.entities)) return fail('实体原型链存在环');
    if (hasCycle(raw.relations)) return fail('关系原型链存在环');

    const vp = raw.viewport;
    if (!isPlainObject(vp) || !Number.isFinite(vp.x) || !Number.isFinite(vp.y) || !Number.isFinite(vp.zoom)) {
      return fail('viewport 非法');
    }
    if (vp.zoom < 0.25 || vp.zoom > 3) return fail('viewport.zoom 超出范围');

    return { ok: true, doc: cloneDocument(raw) };
  }

  return {
    SCHEMA_VERSION: SCHEMA_VERSION,
    PORTS: PORTS,
    ENTITY_ID_PATTERN: ENTITY_ID_PATTERN,
    RELATION_ID_PATTERN: RELATION_ID_PATTERN,
    ENTITY_STYLE_DEFAULTS: ENTITY_STYLE_DEFAULTS,
    RELATION_STYLE_DEFAULTS: RELATION_STYLE_DEFAULTS,
    ENTITY_STYLE_KEYS: ENTITY_STYLE_KEYS,
    RELATION_STYLE_KEYS: RELATION_STYLE_KEYS,
    SHAPES: SHAPES,
    ARROWS: ARROWS,
    LINE_STYLES: LINE_STYLES,
    isValidEntityId: isValidEntityId,
    isValidRelationId: isValidRelationId,
    kindOf: kindOf,
    createDocument: createDocument,
    findEntity: findEntity,
    findRelation: findRelation,
    findObject: findObject,
    getParent: getParent,
    getChildren: getChildren,
    getRoots: getRoots,
    getDescendantIds: getDescendantIds,
    isDescendant: isDescendant,
    createEntity: createEntity,
    createRelation: createRelation,
    setParent: setParent,
    resolveStyle: resolveStyle,
    getStyleSource: getStyleSource,
    setStyleKey: setStyleKey,
    clearStyleKey: clearStyleKey,
    effectiveRelationLabel: effectiveRelationLabel,
    getLabelSource: getLabelSource,
    isEndBound: isEndBound,
    isEndFree: isEndFree,
    makeBoundEnd: makeBoundEnd,
    makeFreeEnd: makeFreeEnd,
    relationEndsAreFree: relationEndsAreFree,
    relationEndsAreBound: relationEndsAreBound,
    relationIsHalfBound: relationIsHalfBound,
    relationIsPlaced: relationIsPlaced,
    relationVisibility: relationVisibility,
    placeEntity: placeEntity,
    unplaceEntity: unplaceEntity,
    placeRelation: placeRelation,
    unplaceRelation: unplaceRelation,
    setEnd: setEnd,
    nextEntityName: nextEntityName,
    nextRelationDefinitionName: nextRelationDefinitionName,
    endsBoundTo: endsBoundTo,
    deletionCheck: deletionCheck,
    deleteObject: deleteObject,
    cloneDocument: cloneDocument,
    validateDocument: validateDocument
  };
});

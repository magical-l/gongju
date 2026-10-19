(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.RGTreeView = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const M = typeof require === 'function' ? require('./model.js') : window.RGModel;

  function escapeHTML(text) {
    return String(text == null ? '' : text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function entityStatus(entity) {
    return entity.position ? '在画布' : '未放置';
  }

  function relationSummary(doc, rel) {
    if (!rel.ends) return '未放置';
    const a = rel.ends.a;
    const b = rel.ends.b;
    const nameOf = function (end) {
      if (M.isEndBound(end)) {
        const entity = M.findEntity(doc, end.entityId);
        return entity ? entity.name : '?';
      }
      return '…';
    };
    if (M.isEndFree(a) && M.isEndFree(b)) return '自由线';
    return nameOf(a) + ' → ' + nameOf(b);
  }

  function relationStatus(doc, rel) {
    const summary = relationSummary(doc, rel);
    if (rel.ends && !M.relationVisibility(doc, rel)) return summary + ' · 端点未放置';
    return summary;
  }

  function isSelected(state, id) {
    if (state.selectedId === id) return true;
    const ids = state.selectedIds;
    if (!ids) return false;
    if (typeof ids.has === 'function') return ids.has(id);
    return false;
  }

  function matchesQuery(doc, obj, query) {
    const label = M.kindOf(obj) === 'entity' ? obj.name : M.effectiveRelationLabel(doc, obj);
    return String(label == null ? '' : label).toLowerCase().indexOf(query) > -1;
  }

  function collectVisibleIds(doc, matches) {
    const visible = new Set(matches);
    matches.forEach(function (id) {
      const seen = new Set();
      let cur = M.findObject(doc, id);
      while (cur && cur.prototypeId && !seen.has(cur.id)) {
        seen.add(cur.id);
        visible.add(cur.prototypeId);
        cur = M.findObject(doc, cur.prototypeId);
      }
    });
    return visible;
  }

  function buildSearch(doc, state) {
    const raw = state.query == null ? '' : String(state.query).trim();
    if (!raw) return null;
    const query = raw.toLowerCase();
    const matches = new Set();
    (doc.entities || []).forEach(function (entity) {
      if (matchesQuery(doc, entity, query)) matches.add(entity.id);
    });
    (doc.relations || []).forEach(function (relation) {
      if (matchesQuery(doc, relation, query)) matches.add(relation.id);
    });
    return { query: raw, visible: collectVisibleIds(doc, matches) };
  }

  function renderRow(doc, obj, state, depth, search) {
    if (search && !search.visible.has(obj.id)) return '';
    const kind = M.kindOf(obj);
    const children = M.getChildren(doc, obj);
    const visibleChildren = search
      ? children.filter(function (child) { return search.visible.has(child.id); })
      : children;
    const collapsed = state.collapsed && state.collapsed.has(obj.id);
    const expanded = search ? true : !collapsed;
    const selected = isSelected(state, obj.id) ? ' selected' : '';
    const armed = state.armedId === obj.id ? ' armed' : '';
    const label = kind === 'entity' ? obj.name : M.effectiveRelationLabel(doc, obj);
    const status = kind === 'entity' ? entityStatus(obj) : relationStatus(doc, obj);
    const idAttr = escapeHTML(obj.id);
    const toggle = visibleChildren.length
      ? '<button class="rg-twisty" data-action="toggle" title="折叠/展开">' + (expanded ? '▾' : '▸') + '</button>'
      : '<span class="rg-twisty placeholder"></span>';
    const count = visibleChildren.length ? '<span class="rg-tree-count">' + visibleChildren.length + '</span>' : '';
    const rowTitle = kind === 'relation'
      ? (armed ? '下一条线使用此关系；再次点击取消' : '点击设为下一条线使用的关系')
      : '拖到画布生成子对象；Ctrl+拖（Mac：Alt+拖）把对象本身放到画布';
    let html = '<li class="rg-tree-item" data-kind="' + kind + '" data-id="' + idAttr + '">' +
      '<div class="rg-tree-row' + selected + armed + '" data-kind="' + kind + '" data-id="' + idAttr + '" style="padding-left:' + (depth * 14) + 'px" title="' + escapeHTML(rowTitle) + '">' +
      toggle +
      '<span class="rg-tree-label">' + escapeHTML(label) + '</span>' +
      '<span class="rg-tree-status">' + escapeHTML(status) + '</span>' +
      count +
      '<button class="rg-tree-add" data-action="add-child" title="新建子对象">＋</button>' +
      '<button class="rg-tree-menu-btn" data-action="menu" title="更多">⋯</button>' +
      '</div>';
    if (visibleChildren.length && expanded) {
      html += '<ul class="rg-tree-children">' + visibleChildren.map(function (child) {
        return renderRow(doc, child, state, depth + 1, search);
      }).join('') + '</ul>';
    }
    html += '</li>';
    return html;
  }

  function renderSection(doc, kind, title, state, search) {
    const roots = M.getRoots(doc, kind);
    const visibleRoots = search
      ? roots.filter(function (obj) { return search.visible.has(obj.id); })
      : roots;
    const total = (kind === 'entity' ? doc.entities : doc.relations).length;
    const rows = visibleRoots.map(function (obj) { return renderRow(doc, obj, state, 0, search); }).join('');
    const emptyText = search ? '没有匹配的对象' : '还没有对象';
    return '<section class="rg-tree-section" data-kind="' + kind + '">' +
      '<header class="rg-tree-header">' +
      '<span class="rg-tree-title">' + title + '</span>' +
      '<span class="rg-tree-total">' + total + '</span>' +
      '<button class="rg-tree-add-root" data-action="add-root" data-kind="' + kind + '" title="新建根对象">＋</button>' +
      '</header>' +
      (rows ? '<ul class="rg-tree-root">' + rows + '</ul>' : '<p class="rg-tree-empty">' + emptyText + '</p>') +
      '</section>';
  }

  function renderTreeHTML(doc, state) {
    const s = state || {};
    const safe = {
      selectedId: s.selectedId == null ? null : s.selectedId,
      selectedIds: s.selectedIds || new Set(),
      armedId: s.armedId == null ? null : s.armedId,
      collapsed: s.collapsed || new Set(),
      query: s.query == null ? '' : s.query
    };
    const search = buildSearch(doc, safe);
    return renderSection(doc, 'entity', '实体', safe, search) +
      renderSection(doc, 'relation', '关系', safe, search);
  }

  return { renderTreeHTML: renderTreeHTML, escapeHTML: escapeHTML, relationSummary: relationSummary };
});

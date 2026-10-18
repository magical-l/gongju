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

  function renderRow(doc, obj, state, depth) {
    const kind = M.kindOf(obj);
    const children = M.getChildren(doc, obj);
    const collapsed = state.collapsed && state.collapsed.has(obj.id);
    const selected = state.selectedId === obj.id ? ' selected' : '';
    const armed = state.armedId === obj.id ? ' armed' : '';
    const label = kind === 'entity' ? obj.name : M.effectiveRelationLabel(doc, obj);
    const status = kind === 'entity' ? entityStatus(obj) : relationStatus(doc, obj);
    const idAttr = escapeHTML(obj.id);
    const toggle = children.length
      ? '<button class="rg-twisty" data-action="toggle" title="折叠/展开">' + (collapsed ? '▸' : '▾') + '</button>'
      : '<span class="rg-twisty placeholder"></span>';
    const count = children.length ? '<span class="rg-tree-count">' + children.length + '</span>' : '';
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
    if (children.length && !collapsed) {
      html += '<ul class="rg-tree-children">' + children.map(function (child) {
        return renderRow(doc, child, state, depth + 1);
      }).join('') + '</ul>';
    }
    html += '</li>';
    return html;
  }

  function renderSection(doc, kind, title, state) {
    const roots = M.getRoots(doc, kind);
    const total = (kind === 'entity' ? doc.entities : doc.relations).length;
    const rows = roots.map(function (obj) { return renderRow(doc, obj, state, 0); }).join('');
    return '<section class="rg-tree-section" data-kind="' + kind + '">' +
      '<header class="rg-tree-header">' +
      '<span class="rg-tree-title">' + title + '</span>' +
      '<span class="rg-tree-total">' + total + '</span>' +
      '<button class="rg-tree-add-root" data-action="add-root" data-kind="' + kind + '" title="新建根对象">＋</button>' +
      '</header>' +
      (rows ? '<ul class="rg-tree-root">' + rows + '</ul>' : '<p class="rg-tree-empty">还没有对象</p>') +
      '</section>';
  }

  function renderTreeHTML(doc, state) {
    const s = state || { selectedId: null, armedId: null, collapsed: new Set() };
    return renderSection(doc, 'entity', '实体', s) + renderSection(doc, 'relation', '关系', s);
  }

  return { renderTreeHTML: renderTreeHTML, escapeHTML: escapeHTML, relationSummary: relationSummary };
});

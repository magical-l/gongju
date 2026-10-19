(function (root) {
  'use strict';
  const M = root.RGModel;
  const G = root.RGGeometry;

  function CanvasView(canvasEl, callbacks) {
    this.el = canvasEl;
    this.cb = callbacks || {};
    this.world = canvasEl.querySelector('.rg-world');
    this.svg = canvasEl.querySelector('.rg-svg');
    this.defs = canvasEl.querySelector('defs');
    this.edgeLayer = canvasEl.querySelector('.rg-edge-layer');
    this.labelLayer = canvasEl.querySelector('.rg-label-layer');
    this.overlaySvg = canvasEl.querySelector('.rg-overlay-svg');
    this.overlayLayer = canvasEl.querySelector('.rg-overlay-layer');
    this.nodeLayer = canvasEl.querySelector('.rg-node-layer');
    this.emptyEl = canvasEl.querySelector('.rg-empty');
    this.measureCtx = null;
    this.viewport = { x: 0, y: 0, zoom: 1 };
    this.doc = null;
    this.state = null;
    this.markers = new Map();
    this.bindEvents();
  }

  CanvasView.prototype.bindEvents = function () {
    const self = this;
    this.el.addEventListener('pointerdown', function (e) {
      if (e.target.closest('.rg-card-input')) return;
      const resizeHandle = e.target.closest('.rg-resize-handle');
      if (resizeHandle) {
        e.preventDefault();
        const card = resizeHandle.closest('.rg-card');
        if (card && self.cb.onResizePointerDown) {
          self.cb.onResizePointerDown(card.dataset.id, resizeHandle.dataset.corner, e);
        }
        return;
      }
      const handle = e.target.closest('.rg-end-handle');
      if (handle) {
        e.preventDefault();
        self.cb.onHandlePointerDown && self.cb.onHandlePointerDown(handle.dataset.id, handle.dataset.end, e);
        return;
      }
      const port = e.target.closest('.rg-port');
      if (port) {
        e.preventDefault();
        const card = port.closest('.rg-card');
        self.cb.onPortPointerDown && self.cb.onPortPointerDown(card.dataset.id, port.dataset.port, e);
        return;
      }
      const card = e.target.closest('.rg-card');
      if (card) {
        e.preventDefault();
        self.cb.onCardPointerDown && self.cb.onCardPointerDown(card.dataset.id, e);
        return;
      }
      const edge = e.target.closest('[data-edge-id]');
      if (edge) {
        e.preventDefault();
        self.cb.onEdgePointerDown && self.cb.onEdgePointerDown(edge.dataset.edgeId, e);
        return;
      }
      self.cb.onCanvasPointerDown && self.cb.onCanvasPointerDown(e);
    });
    this.el.addEventListener('dblclick', function (e) {
      if (e.target.closest('.rg-card-input')) return;
      const card = e.target.closest('.rg-card');
      if (card) self.cb.onCardDoubleClick && self.cb.onCardDoubleClick(card.dataset.id);
    });
  };

  CanvasView.prototype.setViewport = function (vp) {
    this.viewport = { x: vp.x, y: vp.y, zoom: vp.zoom };
    this.world.style.transform = 'translate(' + vp.x + 'px,' + vp.y + 'px) scale(' + vp.zoom + ')';
    this.el.style.backgroundSize = (20 * vp.zoom) + 'px ' + (20 * vp.zoom) + 'px';
    this.el.style.backgroundPosition = vp.x + 'px ' + vp.y + 'px';
  };

  CanvasView.prototype.render = function (doc, state) {
    this.doc = doc;
    this.state = state || {};
    this.nodeLayer.textContent = '';
    this.edgeLayer.textContent = '';
    this.labelLayer.textContent = '';
    this.overlayLayer.textContent = '';
    this.renderNodes(doc);
    this.renderEdges(doc, this.state);
  };

  CanvasView.prototype.selectedIdSet = function (state) {
    const ids = state && state.selectedIds;
    if (ids && typeof ids.has === 'function') return ids;
    return new Set(state && state.selectedId ? [state.selectedId] : []);
  };

  CanvasView.prototype.renderNodes = function (doc) {
    const self = this;
    const selectedIds = this.selectedIdSet(this.state);
    const singleSelected = selectedIds.size === 1;
    doc.entities.forEach(function (entity) {
      if (!entity.position) return;
      const style = M.resolveStyle(doc, entity);
      const card = document.createElement('div');
      card.className = 'rg-card shape-' + style.shape;
      card.dataset.id = entity.id;
      card.style.left = entity.position.x + 'px';
      card.style.top = entity.position.y + 'px';
      card.style.minHeight = style.minHeight > 0 ? style.minHeight + 'px' : '';
      card.style.setProperty('--rg-fill', style.fill);
      card.style.setProperty('--rg-border', style.border);
      card.style.setProperty('--rg-text', style.text);
      const isSelected = selectedIds.has(entity.id);
      if (isSelected) card.classList.add('selected');
      if (isSelected && singleSelected) card.classList.add('single');
      const name = document.createElement('span');
      name.className = 'rg-card-name';
      name.textContent = entity.name;
      card.appendChild(name);
      M.PORTS.forEach(function (port) {
        const dot = document.createElement('span');
        dot.className = 'rg-port';
        dot.dataset.port = port;
        card.appendChild(dot);
      });
      if (isSelected && singleSelected) {
        ['nw', 'ne', 'sw', 'se'].forEach(function (corner) {
          const handle = document.createElement('span');
          handle.className = 'rg-resize-handle';
          handle.dataset.corner = corner;
          card.appendChild(handle);
        });
      }
      self.nodeLayer.appendChild(card);
      // 'auto' 是规则而非测量值：卡片进 DOM 后按自己的名字测量，子对象各算各的
      if (style.width === 'auto') {
        card.style.width = self.measureAutoWidth(card, name) + 'px';
      } else {
        card.style.width = style.width + 'px';
      }
    });
  };

  // 自动宽度 = 当前名字按卡片字体单行排版 + 左右 padding + 左右边框，夹在 [40, 480]
  CanvasView.prototype.measureAutoWidth = function (card, nameEl) {
    const text = nameEl ? nameEl.textContent : '';
    const cardStyle = window.getComputedStyle(card);
    const nameStyle = nameEl ? window.getComputedStyle(nameEl) : cardStyle;
    let width = 0;
    if (!this.measureCtx) this.measureCtx = document.createElement('canvas').getContext('2d');
    if (this.measureCtx) {
      this.measureCtx.font = [nameStyle.fontStyle, nameStyle.fontWeight, nameStyle.fontSize, nameStyle.fontFamily]
        .filter(Boolean).join(' ');
      width = this.measureCtx.measureText(text).width;
      const letterSpacing = parseFloat(nameStyle.letterSpacing);
      if (Number.isFinite(letterSpacing) && text.length > 1) width += letterSpacing * (text.length - 1);
    }
    ['paddingLeft', 'paddingRight', 'borderLeftWidth', 'borderRightWidth'].forEach(function (key) {
      const value = parseFloat(cardStyle[key]);
      if (Number.isFinite(value)) width += value;
    });
    const min = M.MIN_ENTITY_WIDTH;
    if (!Number.isFinite(width) || width <= 0) width = M.ENTITY_STYLE_DEFAULTS.width;
    return Math.max(min, Math.min(480, Math.ceil(width)));
  };

  // 名字变化后按自动规则重算（非 auto 的卡片不受名字影响）
  CanvasView.prototype.refreshAutoWidth = function (id) {
    const card = this.findCard(id);
    const entity = M.findEntity(this.doc, id);
    if (!card || !entity) return;
    if (M.resolveStyle(this.doc, entity).width !== 'auto') return;
    card.style.width = this.measureAutoWidth(card, card.querySelector('.rg-card-name')) + 'px';
    this.updateEdges(this.doc, this.state);
  };

  // width 为 'auto' 时现场测量，否则写数字宽度
  CanvasView.prototype.setEntityWidth = function (id, width) {
    const card = this.findCard(id);
    if (!card) return;
    const resolved = width === 'auto'
      ? this.measureAutoWidth(card, card.querySelector('.rg-card-name'))
      : width;
    if (!Number.isFinite(resolved)) return;
    card.style.width = Math.max(M.MIN_ENTITY_WIDTH, resolved) + 'px';
    this.updateEdges(this.doc, this.state);
  };

  CanvasView.prototype.applySelection = function (state) {
    this.state = state || {};
    const selectedIds = this.selectedIdSet(this.state);
    const singleSelected = selectedIds.size === 1;
    Array.from(this.nodeLayer.children).forEach(function (card) {
      const isSelected = selectedIds.has(card.dataset.id);
      card.classList.toggle('selected', isSelected);
      card.classList.toggle('single', isSelected && singleSelected);
      const handles = card.querySelectorAll('.rg-resize-handle');
      if (isSelected && singleSelected) {
        if (handles.length) return;
        ['nw', 'ne', 'sw', 'se'].forEach(function (corner) {
          const handle = document.createElement('span');
          handle.className = 'rg-resize-handle';
          handle.dataset.corner = corner;
          card.appendChild(handle);
        });
        return;
      }
      Array.from(handles).forEach(function (handle) { handle.remove(); });
    });
  };

  CanvasView.prototype.findCard = function (id) {
    const children = this.nodeLayer.children;
    for (let i = 0; i < children.length; i += 1) {
      if (children[i].dataset.id === id) return children[i];
    }
    return null;
  };

  CanvasView.prototype.getEntityRect = function (id) {
    const card = this.findCard(id);
    if (!card) return null;
    return {
      x: card.offsetLeft,
      y: card.offsetTop,
      width: card.offsetWidth,
      height: card.offsetHeight
    };
  };

  CanvasView.prototype.resolveEnd = function (end) {
    const self = this;
    return G.resolveEnd(end, function (entityId, port) {
      const rect = self.getEntityRect(entityId);
      return rect ? G.portPoint(rect, port) : null;
    });
  };

  CanvasView.prototype.renderEdges = function (doc, state) {
    const self = this;
    const contentRects = [];
    const contentPoints = [];
    const multiEntity = state.selectedIds
      && typeof state.selectedIds.has === 'function'
      && state.selectedIds.size > 1;
    doc.entities.forEach(function (entity) {
      if (!entity.position) return;
      const rect = self.getEntityRect(entity.id);
      if (rect) contentRects.push(rect);
    });
    doc.relations.forEach(function (rel) {
      if (!M.relationVisibility(doc, rel)) return;
      if (M.isEndFree(rel.ends.a)) contentPoints.push(rel.ends.a);
      if (M.isEndFree(rel.ends.b)) contentPoints.push(rel.ends.b);
      const style = M.resolveStyle(doc, rel);
      const a = self.resolveEnd(rel.ends.a);
      const b = self.resolveEnd(rel.ends.b);
      if (!a || !b) return;
      const path = G.buildRelationPath(a, b, style.lineStyle);
      if (!path) return;
      const hit = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      hit.setAttribute('d', path.d);
      hit.setAttribute('class', 'rg-edge-hit');
      hit.setAttribute('stroke', 'transparent');
      hit.setAttribute('stroke-width', '12');
      hit.setAttribute('fill', 'none');
      hit.dataset.edgeId = rel.id;
      self.edgeLayer.appendChild(hit);

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      line.setAttribute('d', path.d);
      line.setAttribute('class', 'rg-edge' + (!multiEntity && state.selectedId === rel.id ? ' selected' : ''));
      line.dataset.edgeId = rel.id;
      line.setAttribute('stroke', style.color);
      line.setAttribute('stroke-width', String(style.width));
      if (style.dash) line.setAttribute('stroke-dasharray', '6 4');
      if (style.arrow === 'end' || style.arrow === 'both') {
        line.setAttribute('marker-end', 'url(#' + self.ensureMarker(style.color) + ')');
      }
      if (style.arrow === 'both') {
        line.setAttribute('marker-start', 'url(#' + self.ensureMarker(style.color) + ')');
      }
      self.edgeLayer.appendChild(line);

      if (style.showLabel) {
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        label.setAttribute('class', 'rg-edge-label');
        label.dataset.edgeId = rel.id;
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', String(path.mid.x));
        text.setAttribute('y', String(path.mid.y));
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'middle');
        text.textContent = M.effectiveRelationLabel(doc, rel);
        label.appendChild(text);
        self.labelLayer.appendChild(label);
        const box = text.getBBox();
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', String(box.x - 4));
        rect.setAttribute('y', String(box.y - 2));
        rect.setAttribute('width', String(box.width + 8));
        rect.setAttribute('height', String(box.height + 4));
        rect.setAttribute('rx', '3');
        label.insertBefore(rect, text);
      }

      if (!multiEntity && state.selectedId === rel.id) {
        ['a', 'b'].forEach(function (key) {
          const handle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          handle.setAttribute('class', 'rg-end-handle');
          handle.setAttribute('cx', String(path[key].x));
          handle.setAttribute('cy', String(path[key].y));
          handle.setAttribute('r', '6');
          handle.dataset.id = rel.id;
          handle.dataset.end = key;
          self.overlayLayer.appendChild(handle);
        });
      }
    });
    const rectBox = G.bboxOfRects(contentRects);
    const pointBox = G.bboxOfPoints(contentPoints);
    let box = rectBox;
    if (pointBox) {
      box = rectBox ? {
        x: Math.min(rectBox.x, pointBox.x),
        y: Math.min(rectBox.y, pointBox.y),
        width: Math.max(rectBox.x + rectBox.width, pointBox.x + pointBox.width) - Math.min(rectBox.x, pointBox.x),
        height: Math.max(rectBox.y + rectBox.height, pointBox.y + pointBox.height) - Math.min(rectBox.y, pointBox.y)
      } : pointBox;
    }
    this.updateSvgBounds(box);
  };

  CanvasView.prototype.ensureMarker = function (color) {
    const key = color.replace(/[^a-zA-Z0-9]/g, '');
    const id = 'rg-arrow-' + key;
    if (this.markers.has(id)) return id;
    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    marker.setAttribute('id', id);
    marker.setAttribute('markerWidth', '10');
    marker.setAttribute('markerHeight', '10');
    marker.setAttribute('refX', '9');
    marker.setAttribute('refY', '5');
    marker.setAttribute('orient', 'auto-start-reverse');
    marker.setAttribute('markerUnits', 'strokeWidth');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M0,0 L10,5 L0,10 z');
    path.setAttribute('fill', color);
    marker.appendChild(path);
    this.defs.appendChild(marker);
    this.markers.set(id, true);
    return id;
  };

  CanvasView.prototype.updateSvgBounds = function (box) {
    const apply = function (svg, bx, by, bw, bh) {
      svg.setAttribute('viewBox', bx + ' ' + by + ' ' + bw + ' ' + bh);
      svg.style.left = bx + 'px';
      svg.style.top = by + 'px';
      svg.style.width = bw + 'px';
      svg.style.height = bh + 'px';
    };
    if (!box) {
      apply(this.svg, 0, 0, 1, 1);
      apply(this.overlaySvg, 0, 0, 1, 1);
      return;
    }
    const pad = 200;
    const bx = box.x - pad;
    const by = box.y - pad;
    const bw = box.width + pad * 2;
    const bh = box.height + pad * 2;
    apply(this.svg, bx, by, bw, bh);
    apply(this.overlaySvg, bx, by, bw, bh);
  };

  CanvasView.prototype.moveCardTo = function (id, x, y) {
    const card = this.findCard(id);
    if (!card) return;
    card.style.left = x + 'px';
    card.style.top = y + 'px';
  };

  CanvasView.prototype.resizeCardTo = function (id, rect) {
    const card = this.findCard(id);
    if (!card) return;
    if (rect.x != null) card.style.left = rect.x + 'px';
    if (rect.y != null) card.style.top = rect.y + 'px';
    // 只接受数字宽度；'auto' 必须走 setEntityWidth/refreshAutoWidth 测量
    if (rect.width != null && Number.isFinite(rect.width)) {
      card.style.width = Math.max(M.MIN_ENTITY_WIDTH, rect.width) + 'px';
    }
    if (rect.minHeight != null) {
      card.style.minHeight = rect.minHeight > 0 ? rect.minHeight + 'px' : '';
    }
    this.updateEdges(this.doc, this.state);
  };

  CanvasView.prototype.updateEdges = function (doc, state) {
    this.edgeLayer.textContent = '';
    this.labelLayer.textContent = '';
    this.overlayLayer.textContent = '';
    this.renderEdges(doc, state || this.state);
  };

  CanvasView.prototype.screenToWorld = function (clientX, clientY) {
    const rect = this.el.getBoundingClientRect();
    const origin = {
      left: rect.left + this.el.clientLeft,
      top: rect.top + this.el.clientTop
    };
    return G.screenToWorld(clientX, clientY, this.viewport, origin);
  };

  CanvasView.prototype.showRubberBand = function (d, color) {
    this.clearRubberBand();
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    path.setAttribute('class', 'rg-rubber');
    path.setAttribute('stroke', color || '#5b8def');
    this.overlayLayer.appendChild(path);
  };

  CanvasView.prototype.clearRubberBand = function () {
    const old = this.overlayLayer.querySelector('.rg-rubber');
    if (old) old.remove();
  };

  CanvasView.prototype.showMarquee = function (rect) {
    this.clearMarquee();
    if (!rect) return;
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    el.setAttribute('class', 'rg-marquee-rect');
    el.setAttribute('x', String(rect.x));
    el.setAttribute('y', String(rect.y));
    el.setAttribute('width', String(Math.max(0, rect.width)));
    el.setAttribute('height', String(Math.max(0, rect.height)));
    this.overlayLayer.appendChild(el);
  };

  CanvasView.prototype.clearMarquee = function () {
    const old = this.overlayLayer.querySelector('.rg-marquee-rect');
    if (old) old.remove();
  };

  CanvasView.prototype.clearOverlay = function () {
    this.clearRubberBand();
    this.clearMarquee();
    this.clearGuides();
  };

  CanvasView.prototype.showGuides = function (guide) {
    this.clearGuides();
    if (guide.guideX != null) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('class', 'rg-guide');
      line.setAttribute('x1', guide.guideX);
      line.setAttribute('x2', guide.guideX);
      line.setAttribute('y1', '-100000');
      line.setAttribute('y2', '100000');
      this.overlayLayer.appendChild(line);
    }
    if (guide.guideY != null) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('class', 'rg-guide');
      line.setAttribute('x1', '-100000');
      line.setAttribute('x2', '100000');
      line.setAttribute('y1', guide.guideY);
      line.setAttribute('y2', guide.guideY);
      this.overlayLayer.appendChild(line);
    }
  };

  CanvasView.prototype.clearGuides = function () {
    Array.from(this.overlayLayer.querySelectorAll('.rg-guide')).forEach(function (el) { el.remove(); });
  };

  CanvasView.prototype.setEmpty = function (text) {
    this.emptyEl.hidden = !text;
    this.emptyEl.textContent = text || '';
  };

  root.RGCanvasView = { CanvasView: CanvasView };
})(window);

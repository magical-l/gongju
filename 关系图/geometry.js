(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.RGGeometry = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const PORT_NORMALS = {
    top: { nx: 0, ny: -1 },
    right: { nx: 1, ny: 0 },
    bottom: { nx: 0, ny: 1 },
    left: { nx: -1, ny: 0 }
  };

  function portPoint(rect, port) {
    const n = PORT_NORMALS[port];
    if (!n) throw new Error('未知端口: ' + port);
    let x = rect.x + rect.width / 2;
    let y = rect.y + rect.height / 2;
    if (port === 'right') x = rect.x + rect.width;
    if (port === 'left') x = rect.x;
    if (port === 'top') y = rect.y;
    if (port === 'bottom') y = rect.y + rect.height;
    return { x: x, y: y, nx: n.nx, ny: n.ny };
  }

  function resolveEnd(end, getBoundPoint) {
    if (end && typeof end.entityId === 'string') {
      return getBoundPoint(end.entityId, end.port) || null;
    }
    if (end && Number.isFinite(end.x) && Number.isFinite(end.y)) {
      return { x: end.x, y: end.y, nx: null, ny: null };
    }
    return null;
  }

  function withDirections(a, b) {
    const pa = { x: a.x, y: a.y, nx: a.nx, ny: a.ny };
    const pb = { x: b.x, y: b.y, nx: b.nx, ny: b.ny };
    if (pa.nx == null || pa.ny == null) {
      const dx = pb.x - pa.x;
      const dy = pb.y - pa.y;
      const len = Math.hypot(dx, dy) || 1;
      pa.nx = dx / len;
      pa.ny = dy / len;
    }
    if (pb.nx == null || pb.ny == null) {
      const dx = pa.x - pb.x;
      const dy = pa.y - pb.y;
      const len = Math.hypot(dx, dy) || 1;
      pb.nx = dx / len;
      pb.ny = dy / len;
    }
    return [pa, pb];
  }

  function cubicPoint(p0, p1, p2, p3, t) {
    const u = 1 - t;
    return {
      x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
      y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y
    };
  }

  function buildRelationPath(endA, endB, lineStyle) {
    if (!endA || !endB) return null;
    const pair = withDirections(endA, endB);
    const a = pair[0];
    const b = pair[1];
    const dist = Math.hypot(b.x - a.x, b.y - a.y);
    if (lineStyle === 'straight') {
      return {
        d: 'M ' + a.x + ' ' + a.y + ' L ' + b.x + ' ' + b.y,
        mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
        a: a,
        b: b
      };
    }
    const k = Math.max(40, dist * 0.4);
    const c1 = { x: a.x + a.nx * k, y: a.y + a.ny * k };
    const c2 = { x: b.x + b.nx * k, y: b.y + b.ny * k };
    return {
      d: 'M ' + a.x + ' ' + a.y + ' C ' + c1.x + ' ' + c1.y + ' ' + c2.x + ' ' + c2.y + ' ' + b.x + ' ' + b.y,
      mid: cubicPoint(a, c1, c2, b, 0.5),
      a: a,
      b: b,
      c1: c1,
      c2: c2
    };
  }

  function rectLines(rect) {
    return {
      x: [rect.x, rect.x + rect.width / 2, rect.x + rect.width],
      y: [rect.y, rect.y + rect.height / 2, rect.y + rect.height]
    };
  }

  function bestSnap(values, candidates, threshold) {
    let best = null;
    for (let i = 0; i < values.length; i += 1) {
      for (let j = 0; j < candidates.length; j += 1) {
        const diff = candidates[j] - values[i];
        if (Math.abs(diff) <= threshold && (!best || Math.abs(diff) < Math.abs(best.diff))) {
          best = { diff: diff, line: candidates[j] };
        }
      }
    }
    return best;
  }

  function snapGuides(movingRect, otherRects, threshold) {
    const moving = rectLines(movingRect);
    const otherX = [];
    const otherY = [];
    otherRects.forEach(function (rect) {
      const lines = rectLines(rect);
      otherX.push.apply(otherX, lines.x);
      otherY.push.apply(otherY, lines.y);
    });
    const sx = bestSnap(moving.x, otherX, threshold);
    const sy = bestSnap(moving.y, otherY, threshold);
    return {
      dx: sx ? sx.diff : 0,
      dy: sy ? sy.diff : 0,
      guideX: sx ? sx.line : null,
      guideY: sy ? sy.line : null
    };
  }

  function bboxOfRects(rects) {
    if (!rects.length) return null;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    rects.forEach(function (r) {
      minX = Math.min(minX, r.x);
      minY = Math.min(minY, r.y);
      maxX = Math.max(maxX, r.x + r.width);
      maxY = Math.max(maxY, r.y + r.height);
    });
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }

  function bboxOfPoints(points) {
    if (!points.length) return null;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    points.forEach(function (p) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    });
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }

  function fitView(bbox, viewportSize, padding) {
    if (!bbox) return { x: 0, y: 0, zoom: 1 };
    const w = bbox.width + padding * 2;
    const h = bbox.height + padding * 2;
    const zoom = Math.max(0.25, Math.min(3, Math.min(viewportSize.width / w, viewportSize.height / h)));
    return {
      x: viewportSize.width / 2 - (bbox.x + bbox.width / 2) * zoom,
      y: viewportSize.height / 2 - (bbox.y + bbox.height / 2) * zoom,
      zoom: zoom
    };
  }

  function screenToWorld(clientX, clientY, viewport, originRect) {
    return {
      x: (clientX - originRect.left - viewport.x) / viewport.zoom,
      y: (clientY - originRect.top - viewport.y) / viewport.zoom
    };
  }

  function worldToScreen(point, viewport, originRect) {
    return {
      x: originRect.left + viewport.x + point.x * viewport.zoom,
      y: originRect.top + viewport.y + point.y * viewport.zoom
    };
  }

  return {
    portPoint: portPoint,
    resolveEnd: resolveEnd,
    buildRelationPath: buildRelationPath,
    cubicPoint: cubicPoint,
    snapGuides: snapGuides,
    bboxOfRects: bboxOfRects,
    bboxOfPoints: bboxOfPoints,
    fitView: fitView,
    screenToWorld: screenToWorld,
    worldToScreen: worldToScreen
  };
});

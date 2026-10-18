(function () {
	'use strict';

	const M = window.RGModel;
	const G = window.RGGeometry;
	const T = window.RGTreeView;
	const CV = window.RGCanvasView;

	const DRAG_THRESHOLD = 3;
	const STORAGE_KEY = 'relation_graph_v1';
	let saveTimer = null;

	const els = {
		tree: document.getElementById('rgTree'),
		canvas: document.getElementById('rgCanvas'),
		inspector: document.getElementById('rgInspector'),
		undo: document.getElementById('rgUndoBtn'),
		redo: document.getElementById('rgRedoBtn'),
		menu: document.getElementById('rgMenu'),
		newBtn: document.getElementById('rgNewBtn'),
		openBtn: document.getElementById('rgOpenBtn'),
		exportBtn: document.getElementById('rgExportBtn'),
		fileInput: document.getElementById('rgFileInput'),
		exportJson: document.getElementById('rgExportJson'),
		exportPng: document.getElementById('rgExportPng'),
		exportDialog: document.getElementById('rgExportDialog'),
		helpBtn: document.getElementById('rgHelpBtn'),
		helpDialog: document.getElementById('rgHelpDialog'),
		zoomIn: document.getElementById('rgZoomIn'),
		zoomOut: document.getElementById('rgZoomOut'),
		zoomReset: document.getElementById('rgZoomReset'),
		fitBtn: document.getElementById('rgFitBtn'),
		zoomDisplay: document.getElementById('rgZoomDisplay')
	};

	const app = {
		doc: M.createDocument(),
		selectedId: null,
		armedId: null,
		collapsed: new Set(),
		history: [],
		histIndex: -1,
		view: null,
		drag: null,
		inspectorDirty: false,
		hasEdited: false
	};

	function esc(text) {
		return T.escapeHTML(text);
	}

	function notify(type, message) {
		const toast = window.toastr;
		if (toast && typeof toast[type] === 'function') toast[type](message);
	}

	function scheduleSave() {
		clearTimeout(saveTimer);
		saveTimer = setTimeout(saveNow, 300);
	}

	function saveNow() {
		if (!app.hasEdited) return;
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(app.doc));
		} catch (err) {
			notify('warning', '本地保存失败：' + err.message);
		}
	}

	function backupBroken(raw) {
		try {
			localStorage.setItem(STORAGE_KEY + '_broken_' + Date.now(), raw);
			return true;
		} catch (err) {
			return false;
		}
	}

	function dropBroken(raw) {
		if (!backupBroken(raw)) return;
		try { localStorage.removeItem(STORAGE_KEY); } catch (err) { /* ignore */ }
	}

	function loadSaved() {
		let raw;
		try { raw = localStorage.getItem(STORAGE_KEY); } catch (err) { return null; }
		if (!raw) return null;
		let parsed;
		try {
			parsed = JSON.parse(raw);
		} catch (err) {
			dropBroken(raw);
			notify('warning', '本地数据损坏，已备份并新建空图');
			return null;
		}
		const result = M.validateDocument(parsed);
		if (!result.ok) {
			dropBroken(raw);
			notify('warning', '本地数据损坏，已备份并新建空图');
			return null;
		}
		return result.doc;
	}

	function snapshot() {
		return JSON.stringify({ name: app.doc.name, entities: app.doc.entities, relations: app.doc.relations });
	}

	function restore(snap) {
		const data = JSON.parse(snap);
		app.doc.name = data.name;
		app.doc.entities = data.entities;
		app.doc.relations = data.relations;
		if (app.selectedId && !M.findObject(app.doc, app.selectedId)) app.selectedId = null;
		if (app.armedId && !M.findRelation(app.doc, app.armedId)) app.armedId = null;
	}

	function initHistory() {
		app.history = [snapshot()];
		app.histIndex = 0;
		updateHistoryButtons();
	}

	function pushHistory() {
		app.hasEdited = true;
		const snap = snapshot();
		if (snap === app.history[app.histIndex]) return;
		app.history = app.history.slice(0, app.histIndex + 1);
		app.history.push(snap);
		if (app.history.length > 100) app.history.shift();
		app.histIndex = app.history.length - 1;
		updateHistoryButtons();
		scheduleSave();
	}

	function flushInspectorName() {
		if (!app.inspectorDirty) return;
		app.inspectorDirty = false;
		pushHistory();
	}

	function refreshObjectName(obj) {
		if (!obj) return;
		const kind = M.kindOf(obj);
		const changedIds = new Set([obj.id]);
		if (kind === 'relation') {
			M.getDescendantIds(app.doc, obj).forEach(function (id) { changedIds.add(id); });
		}
		Array.from(els.tree.querySelectorAll('.rg-tree-row')).forEach(function (row) {
			if (!changedIds.has(row.dataset.id)) return;
			const target = M.findObject(app.doc, row.dataset.id);
			const labelEl = row.querySelector('.rg-tree-label');
			if (!target || !labelEl) return;
			labelEl.textContent = M.kindOf(target) === 'entity' ? target.name : M.effectiveRelationLabel(app.doc, target);
		});
		if (kind === 'entity') {
			const card = app.view.findCard(obj.id);
			const cardName = card && card.querySelector('.rg-card-name');
			if (cardName) cardName.textContent = obj.name;
		}
		Array.from(els.tree.querySelectorAll('.rg-tree-row[data-kind="relation"]')).forEach(function (row) {
			const rel = M.findRelation(app.doc, row.dataset.id);
			const statusEl = row.querySelector('.rg-tree-status');
			if (!rel || !statusEl) return;
			let status = T.relationSummary(app.doc, rel);
			if (rel.ends && !M.relationVisibility(app.doc, rel)) status += ' · 端点未放置';
			statusEl.textContent = status;
		});
		app.view.updateEdges(app.doc, { selectedId: app.selectedId });
		if (app.armedId && !M.findRelation(app.doc, app.armedId)) app.armedId = null;
	}

	function undo() {
		flushInspectorName();
		if (app.histIndex <= 0) return;
		app.histIndex -= 1;
		restore(app.history[app.histIndex]);
		renderAll();
		updateHistoryButtons();
		scheduleSave();
	}

	function redo() {
		flushInspectorName();
		if (app.histIndex >= app.history.length - 1) return;
		app.histIndex += 1;
		restore(app.history[app.histIndex]);
		renderAll();
		updateHistoryButtons();
		scheduleSave();
	}

	function updateHistoryButtons() {
		els.undo.disabled = app.histIndex <= 0;
		els.redo.disabled = app.histIndex >= app.history.length - 1;
	}

	function renderTree() {
		els.tree.innerHTML = T.renderTreeHTML(app.doc, {
			selectedId: app.selectedId,
			armedId: app.armedId,
			collapsed: app.collapsed
		});
	}

	function renderAll() {
		flushInspectorName();
		renderTree();
		app.view.render(app.doc, { selectedId: app.selectedId, armedId: app.armedId });
		updateEmpty();
		renderInspector();
	}

	function select(id) {
		app.selectedId = id;
		renderAll();
		if (id) centerOnObject(id);
	}

	function renderSelection() {
		flushInspectorName();
		renderTree();
		Array.from(app.view.nodeLayer.children).forEach(function (card) {
			card.classList.toggle('selected', card.dataset.id === app.selectedId);
		});
		app.view.updateEdges(app.doc, { selectedId: app.selectedId, armedId: app.armedId });
		renderInspector();
	}

	function centerOnObject(id) {
		const obj = M.findObject(app.doc, id);
		if (!obj) return;
		let point = null;
		if (M.kindOf(obj) === 'entity' && obj.position) {
			const rect = app.view.getEntityRect(id);
			if (rect) point = { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
		}
		if (M.kindOf(obj) === 'relation' && obj.ends) {
			const a = app.view.resolveEnd(obj.ends.a);
			const b = app.view.resolveEnd(obj.ends.b);
			if (a && b) point = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
		}
		if (!point) return;
		const canvasRect = els.canvas.getBoundingClientRect();
		app.doc.viewport.x = canvasRect.width / 2 - point.x * app.doc.viewport.zoom;
		app.doc.viewport.y = canvasRect.height / 2 - point.y * app.doc.viewport.zoom;
		app.view.setViewport(app.doc.viewport);
		app.hasEdited = true;
		scheduleSave();
	}

	function updateEmpty() {
		const total = app.doc.entities.length + app.doc.relations.length;
		const visible = app.doc.entities.some(function (e) { return !!e.position; }) ||
			app.doc.relations.some(function (r) { return M.relationVisibility(app.doc, r); });
		if (visible) app.view.setEmpty(null);
		else if (total === 0) app.view.setEmpty('在左栏新建根对象，或把左栏节点拖到这里');
		else app.view.setEmpty('把左栏节点拖到这里生成实例');
	}

	function toggleCollapse(id) {
		if (app.collapsed.has(id)) app.collapsed.delete(id);
		else app.collapsed.add(id);
		renderAll();
	}

	function addRoot(kind) {
		let obj;
		if (kind === 'entity') {
			obj = M.createEntity(app.doc, { name: M.nextEntityName(app.doc, null) });
		} else {
			obj = M.createRelation(app.doc, { name: M.nextRelationDefinitionName(app.doc, null) });
		}
		app.selectedId = obj.id;
		pushHistory();
		renderAll();
	}

	function addChild(parentId) {
		const parent = M.findObject(app.doc, parentId);
		if (!parent) return;
		let obj;
		if (M.kindOf(parent) === 'entity') {
			obj = M.createEntity(app.doc, {
				name: M.nextEntityName(app.doc, parent),
				prototypeId: parent.id
			});
		} else {
			obj = M.createRelation(app.doc, {
				name: M.nextRelationDefinitionName(app.doc, parent),
				prototypeId: parent.id
			});
		}
		app.selectedId = obj.id;
		pushHistory();
		renderAll();
	}

	function placeObject(obj) {
		const c = els.canvas.getBoundingClientRect();
		const world = app.view.screenToWorld(c.left + c.width / 2, c.top + c.height / 2);
		if (M.kindOf(obj) === 'entity') {
			M.placeEntity(obj, world.x - 84, world.y - 22);
		} else {
			M.placeRelation(obj, {
				a: M.makeFreeEnd(world.x - 70, world.y),
				b: M.makeFreeEnd(world.x + 70, world.y)
			});
		}
		pushHistory();
		renderAll();
	}

	function unplaceObject(obj) {
		if (M.kindOf(obj) === 'entity') M.unplaceEntity(obj);
		else M.unplaceRelation(obj);
		pushHistory();
		renderAll();
	}

	function reverseRelation(rel) {
		const tmp = rel.ends.a;
		rel.ends.a = rel.ends.b;
		rel.ends.b = tmp;
		pushHistory();
		renderAll();
	}

	function openMenuAt(menu, x, y) {
		menu.hidden = false;
		menu.style.left = x + 'px';
		menu.style.top = y + 'px';
		setTimeout(function () {
			document.addEventListener('pointerdown', closeMenuOnOutside, { once: true });
		}, 0);
	}

	function closeMenuOnOutside(e) {
		if (els.menu.contains(e.target)) return;
		if (els.zoomDisplay.contains(e.target)) return;
		closeMenu();
	}

	function closeMenu() {
		els.menu.hidden = true;
		els.menu.textContent = '';
	}

	function openRowMenu(anchor, id) {
		const obj = M.findObject(app.doc, id);
		if (!obj) {
			closeMenu();
			return;
		}
		const rect = anchor.getBoundingClientRect();
		els.menu.textContent = '';
		const addItem = function (text, fn, danger) {
			const btn = document.createElement('button');
			btn.type = 'button';
			btn.className = 'btn' + (danger ? ' danger' : '');
			btn.textContent = text;
			btn.addEventListener('click', function () {
				closeMenu();
				const fresh = M.findObject(app.doc, id);
				if (!fresh) return;
				fn(fresh);
			});
			els.menu.appendChild(btn);
		};
		if (M.kindOf(obj) === 'entity') {
			addItem(obj.position ? '从画布移除' : '放到画布', function (fresh) {
				if (fresh.position) unplaceObject(fresh);
				else placeObject(fresh);
			});
		} else {
			addItem(obj.ends ? '从画布移除' : '放到画布', function (fresh) {
				if (fresh.ends) unplaceObject(fresh);
				else placeObject(fresh);
			});
			if (obj.ends) {
				addItem('反向', function (fresh) {
					reverseRelation(fresh);
				});
			}
		}
		addItem('删除', function () {
			app.selectedId = id;
			deleteSelected();
		}, true);
		openMenuAt(els.menu, rect.left, rect.bottom + 4);
	}

	let treeDrag = null;

	function isInsideCanvas(clientX, clientY) {
		const rect = els.canvas.getBoundingClientRect();
		return clientX >= rect.left && clientX <= rect.right &&
			clientY >= rect.top && clientY <= rect.bottom;
	}

	function onTreeDragMove(e) {
		if (!treeDrag) return;
		const dx = e.clientX - treeDrag.startX;
		const dy = e.clientY - treeDrag.startY;
		if (!treeDrag.moved && Math.hypot(dx, dy) > 4) {
			treeDrag.moved = true;
			document.body.classList.add('rg-dragging');
		}
	}

	function onTreeDragUp(e) {
		const drag = treeDrag;
		treeDrag = null;
		if (drag && typeof drag.cleanup === 'function') drag.cleanup();
		document.body.classList.remove('rg-dragging');
		if (!drag || !drag.moved) return;
		if (!isInsideCanvas(e.clientX, e.clientY)) return;
		const world = app.view.screenToWorld(e.clientX, e.clientY);
		if (drag.kind !== 'entity') {
			const relTemplate = M.findRelation(app.doc, drag.id);
			if (!relTemplate) return;
			app.armedId = drag.asSelf ? app.armedId : relTemplate.id;
			if (drag.asSelf) {
				if (relTemplate.ends) return;
				M.placeRelation(relTemplate, {
					a: M.makeFreeEnd(world.x - 70, world.y),
					b: M.makeFreeEnd(world.x + 70, world.y)
				});
				app.selectedId = relTemplate.id;
				pushHistory();
				renderAll();
				return;
			}
			const target = document.elementFromPoint(e.clientX, e.clientY);
			const card = target && target.closest('.rg-card');
			const portEl = target && target.closest('.rg-port');
			if (card) {
				const port = portEl ? portEl.dataset.port : nearestPort(card.dataset.id, e.clientX, e.clientY);
				const rect = app.view.getEntityRect(card.dataset.id);
				if (!rect) return;
				const p = G.portPoint(rect, port);
				const len = Math.hypot(p.nx, p.ny) || 1;
				const free = M.makeFreeEnd(p.x + p.nx * 120, p.y + p.ny * 120);
				const rel = M.createRelation(app.doc, {
					prototypeId: relTemplate.id,
					ends: { a: M.makeBoundEnd(card.dataset.id, port), b: free }
				});
				app.selectedId = rel.id;
				pushHistory();
				renderAll();
				return;
			}
			const rel = M.createRelation(app.doc, {
				prototypeId: relTemplate.id,
				ends: {
					a: M.makeFreeEnd(world.x - 70, world.y),
					b: M.makeFreeEnd(world.x + 70, world.y)
				}
			});
			app.selectedId = rel.id;
			pushHistory();
			renderAll();
			return;
		}
		const entity = M.findEntity(app.doc, drag.id);
		if (!entity) return;
		if (drag.asSelf) {
			M.placeEntity(entity, world.x - 84, world.y - 22);
			app.selectedId = entity.id;
			pushHistory();
			renderAll();
			return;
		}
		const child = M.createEntity(app.doc, {
			name: M.nextEntityName(app.doc, entity),
			prototypeId: entity.id,
			position: { x: world.x - 84, y: world.y - 22 }
		});
		app.selectedId = child.id;
		pushHistory();
		renderAll();
		startRename(child.id);
	}

	function startEntityMove(id, e) {
		const entity = M.findEntity(app.doc, id);
		if (!entity || !entity.position) return;
		app.selectedId = id;
		renderSelection();
		app.drag = {
			type: 'entity',
			id: id,
			moved: false,
			startX: e.clientX,
			startY: e.clientY,
			startWorld: app.view.screenToWorld(e.clientX, e.clientY),
			startPos: { x: entity.position.x, y: entity.position.y }
		};
		app.drag.cleanup = function () {
			window.removeEventListener('pointermove', onEntityMove);
			window.removeEventListener('pointerup', onEntityMoveEnd);
		};
		window.addEventListener('pointermove', onEntityMove);
		window.addEventListener('pointerup', onEntityMoveEnd);
	}

	function onEntityMove(e) {
		const drag = app.drag;
		if (!drag || drag.type !== 'entity') return;
		const entity = M.findEntity(app.doc, drag.id);
		if (!entity) return;
		if (!drag.moved) {
			const dx = e.clientX - drag.startX;
			const dy = e.clientY - drag.startY;
			if (Math.hypot(dx, dy) <= DRAG_THRESHOLD) return;
			drag.moved = true;
		}
		const world = app.view.screenToWorld(e.clientX, e.clientY);
		let x = drag.startPos.x + (world.x - drag.startWorld.x);
		let y = drag.startPos.y + (world.y - drag.startWorld.y);
		const current = app.view.getEntityRect(entity.id) || { width: 168, height: 40 };
		const movingRect = { x: x, y: y, width: current.width, height: current.height };
		const others = [];
		app.doc.entities.forEach(function (other) {
			if (other.id === entity.id || !other.position) return;
			const rect = app.view.getEntityRect(other.id);
			if (rect) others.push(rect);
		});
		const snap = G.snapGuides(movingRect, others, 6 / app.doc.viewport.zoom);
		x += snap.dx;
		y += snap.dy;
		entity.position.x = x;
		entity.position.y = y;
		app.view.moveCardTo(entity.id, x, y);
		app.view.updateEdges(app.doc, { selectedId: app.selectedId });
		if (snap.guideX != null || snap.guideY != null) app.view.showGuides(snap);
		else app.view.clearGuides();
	}

	function onEntityMoveEnd() {
		window.removeEventListener('pointermove', onEntityMove);
		window.removeEventListener('pointerup', onEntityMoveEnd);
		if (!app.drag || app.drag.type !== 'entity') return;
		const drag = app.drag;
		app.drag = null;
		app.view.clearGuides();
		if (!drag.moved) return;
		pushHistory();
		renderAll();
	}

	function startRename(id) {
		const card = app.view.findCard(id);
		const entity = M.findEntity(app.doc, id);
		if (!card || !entity) return;
		const nameEl = card.querySelector('.rg-card-name');
		if (!nameEl) return;
		const originalName = entity.name;
		const input = document.createElement('input');
		input.className = 'rg-card-input';
		input.value = originalName;
		nameEl.replaceWith(input);
		input.focus();
		input.select();
		const restoreName = function (name) {
			const span = document.createElement('span');
			span.className = 'rg-card-name';
			span.textContent = name;
			if (input.parentNode) input.replaceWith(span);
		};
		const syncInspectorName = function () {
			if (app.selectedId !== entity.id) return;
			const field = els.inspector.querySelector('[data-field="name"][data-obj-id]');
			if (!field || field.dataset.objId !== entity.id) return;
			field.value = entity.name;
		};
		let finished = false;
		input.addEventListener('input', function () {
			entity.name = input.value;
			app.hasEdited = true;
			scheduleSave();
		});
		const commit = function () {
			if (finished) return;
			finished = true;
			const value = input.value.trim();
			entity.name = value || originalName;
			if (entity.name !== originalName) pushHistory();
			restoreName(entity.name);
			refreshObjectName(entity);
			syncInspectorName();
		};
		const cancel = function () {
			if (finished) return;
			finished = true;
			entity.name = originalName;
			restoreName(originalName);
			refreshObjectName(entity);
			syncInspectorName();
			scheduleSave();
		};
		input.addEventListener('keydown', function (ev) {
			if (ev.key === 'Enter') {
				ev.preventDefault();
				commit();
			} else if (ev.key === 'Escape') {
				ev.preventDefault();
				cancel();
			}
		});
		input.addEventListener('blur', commit, { once: true });
	}

	function deleteSelected() {
		const obj = app.selectedId ? M.findObject(app.doc, app.selectedId) : null;
		if (!obj) return;
		try {
			const result = M.deleteObject(app.doc, obj);
			app.selectedId = null;
			if (app.armedId === obj.id) app.armedId = null;
			pushHistory();
			renderAll();
			if (M.kindOf(obj) === 'entity' && result.deletedRelations) {
				notify('info', '删除了实体及 ' + result.deletedRelations + ' 条关系');
			}
		} catch (err) {
			notify('warning', err.message);
		}
	}

	function startConnection(entityId, port, prototypeId, e) {
		const sourceRect = app.view.getEntityRect(entityId);
		if (!sourceRect) return;
		const sourcePoint = G.portPoint(sourceRect, port);
		app.drag = {
			type: 'connect',
			sourceEntityId: entityId,
			sourcePort: port,
			prototypeId: prototypeId || null,
			sourcePoint: sourcePoint,
			startX: e.clientX,
			startY: e.clientY,
			moved: false
		};
		app.drag.cleanup = function () {
			window.removeEventListener('pointermove', onConnectMove);
			window.removeEventListener('pointerup', onConnectEnd);
		};
		window.addEventListener('pointermove', onConnectMove);
		window.addEventListener('pointerup', onConnectEnd);
	}

	function onConnectMove(e) {
		const drag = app.drag;
		if (!drag || drag.type !== 'connect') return;
		if (!drag.moved) {
			const dx = e.clientX - drag.startX;
			const dy = e.clientY - drag.startY;
			if (Math.hypot(dx, dy) <= DRAG_THRESHOLD) return;
			drag.moved = true;
		}
		const world = app.view.screenToWorld(e.clientX, e.clientY);
		const path = G.buildRelationPath(drag.sourcePoint, { x: world.x, y: world.y }, 'curve');
		app.view.showRubberBand(path.d, getArmedColor(drag.prototypeId));
		highlightDropTarget(e.clientX, e.clientY, drag.sourceEntityId);
	}

	function clearDropTargets() {
		Array.from(document.querySelectorAll('.rg-card.drop-target')).forEach(function (el) {
			el.classList.remove('drop-target');
		});
	}

	function highlightDropTarget(clientX, clientY, sourceId) {
		clearDropTargets();
		const el = document.elementFromPoint(clientX, clientY);
		const card = el && el.closest('.rg-card');
		if (card && card.dataset.id !== sourceId) card.classList.add('drop-target');
	}

	function onConnectEnd(e) {
		window.removeEventListener('pointermove', onConnectMove);
		window.removeEventListener('pointerup', onConnectEnd);
		app.view.clearRubberBand();
		clearDropTargets();
		const drag = app.drag;
		app.drag = null;
		if (!drag || drag.type !== 'connect') return;
		if (!drag.moved) return;
		if (!isInsideCanvas(e.clientX, e.clientY)) return;
		const target = document.elementFromPoint(e.clientX, e.clientY);
		const card = target && target.closest('.rg-card');
		const portEl = target && target.closest('.rg-port');
		const targetEntityId = card ? card.dataset.id : null;
		if (targetEntityId && targetEntityId === drag.sourceEntityId) {
			notify('warning', '暂不支持自连');
			return;
		}
		const sourceEnd = M.makeBoundEnd(drag.sourceEntityId, drag.sourcePort);
		let targetEnd;
		if (targetEntityId) {
			let targetPort = portEl ? portEl.dataset.port : null;
			if (!targetPort) targetPort = nearestPort(targetEntityId, e.clientX, e.clientY);
			targetEnd = M.makeBoundEnd(targetEntityId, targetPort);
		} else {
			const world = app.view.screenToWorld(e.clientX, e.clientY);
			targetEnd = M.makeFreeEnd(world.x, world.y);
		}
		const create = function (prototypeId) {
			const rel = M.createRelation(app.doc, {
				prototypeId: prototypeId || null,
				ends: { a: sourceEnd, b: targetEnd }
			});
			app.selectedId = rel.id;
			pushHistory();
			renderAll();
		};
		if (drag.prototypeId) create(drag.prototypeId);
		else showRelationChooser(e.clientX, e.clientY, create);
	}

	function nearestPort(entityId, clientX, clientY) {
		const rect = app.view.getEntityRect(entityId);
		if (!rect) return 'right';
		const ports = ['top', 'right', 'bottom', 'left'];
		let best = 'right';
		let bestDist = Infinity;
		const origin = app.view.el.getBoundingClientRect();
		ports.forEach(function (port) {
			const p = G.portPoint(rect, port);
			const screen = G.worldToScreen(p, app.doc.viewport, origin);
			const d = Math.hypot(screen.x - clientX, screen.y - clientY);
			if (d < bestDist) {
				bestDist = d;
				best = port;
			}
		});
		return best;
	}

	function getArmedColor(prototypeId) {
		if (!prototypeId) return M.RELATION_STYLE_DEFAULTS.color;
		const rel = M.findRelation(app.doc, prototypeId);
		return rel ? M.resolveStyle(app.doc, rel).color : M.RELATION_STYLE_DEFAULTS.color;
	}

	function showRelationChooser(clientX, clientY, callback) {
		const menu = els.menu;
		menu.textContent = '';
		const candidates = app.doc.relations.slice().sort(function (a, b) {
			return (a.ends ? 1 : 0) - (b.ends ? 1 : 0);
		});
		candidates.forEach(function (rel) {
			const btn = document.createElement('button');
			btn.type = 'button';
			btn.className = 'btn';
			btn.textContent = M.effectiveRelationLabel(app.doc, rel) + (rel.ends ? ' · 已放置' : ' · 定义');
			btn.addEventListener('click', function () {
				closeMenu();
				callback(rel.id);
			});
			menu.appendChild(btn);
		});
		const def = document.createElement('button');
		def.type = 'button';
		def.className = 'btn';
		def.textContent = '默认样式';
		def.addEventListener('click', function () {
			closeMenu();
			callback(null);
		});
		menu.appendChild(def);
		openMenuAt(menu, clientX, clientY);
	}

	function startHandleDrag(relId, endKey, e) {
		const rel = M.findRelation(app.doc, relId);
		if (!rel || !rel.ends) return;
		const otherKey = endKey === 'a' ? 'b' : 'a';
		const other = app.view.resolveEnd(rel.ends[otherKey]);
		if (!other) return;
		app.drag = {
			type: 'handle',
			relId: relId,
			endKey: endKey,
			other: other,
			startX: e.clientX,
			startY: e.clientY,
			moved: false
		};
		app.drag.cleanup = function () {
			window.removeEventListener('pointermove', onHandleMove);
			window.removeEventListener('pointerup', onHandleEnd);
		};
		window.addEventListener('pointermove', onHandleMove);
		window.addEventListener('pointerup', onHandleEnd);
	}

	function onHandleMove(e) {
		const drag = app.drag;
		if (!drag || drag.type !== 'handle') return;
		if (!drag.moved) {
			const dx = e.clientX - drag.startX;
			const dy = e.clientY - drag.startY;
			if (Math.hypot(dx, dy) <= DRAG_THRESHOLD) return;
			drag.moved = true;
		}
		const world = app.view.screenToWorld(e.clientX, e.clientY);
		const path = G.buildRelationPath(drag.other, { x: world.x, y: world.y }, 'curve');
		app.view.showRubberBand(path.d, '#e91e63');
		highlightDropTarget(e.clientX, e.clientY, null);
	}

	function onHandleEnd(e) {
		window.removeEventListener('pointermove', onHandleMove);
		window.removeEventListener('pointerup', onHandleEnd);
		app.view.clearRubberBand();
		clearDropTargets();
		const drag = app.drag;
		app.drag = null;
		if (!drag || drag.type !== 'handle') return;
		if (!drag.moved) return;
		if (!isInsideCanvas(e.clientX, e.clientY)) return;
		const rel = M.findRelation(app.doc, drag.relId);
		if (!rel) return;
		const target = document.elementFromPoint(e.clientX, e.clientY);
		const card = target && target.closest('.rg-card');
		const portEl = target && target.closest('.rg-port');
		let end;
		if (card) {
			const otherKey = drag.endKey === 'a' ? 'b' : 'a';
			const otherEnd = rel.ends[otherKey];
			if (M.isEndBound(otherEnd) && otherEnd.entityId === card.dataset.id) {
				notify('warning', '暂不支持自连');
				return;
			}
			const port = portEl ? portEl.dataset.port : nearestPort(card.dataset.id, e.clientX, e.clientY);
			end = M.makeBoundEnd(card.dataset.id, port);
		} else {
			const world = app.view.screenToWorld(e.clientX, e.clientY);
			end = M.makeFreeEnd(world.x, world.y);
		}
		M.setEnd(rel, drag.endKey, end);
		pushHistory();
		renderAll();
	}

	function selectRelationOrDrag(id, e) {
		const rel = M.findRelation(app.doc, id);
		if (!rel || !rel.ends) {
			if (rel) app.armedId = id;
			select(id);
			return;
		}
		app.armedId = id;
		app.selectedId = id;
		renderAll();
		const bothFree = M.relationEndsAreFree(rel);
		const half = M.relationIsHalfBound(rel);
		if (!bothFree && !half) return;
		app.drag = {
			type: 'edge-move',
			id: id,
			startWorld: app.view.screenToWorld(e.clientX, e.clientY),
			startEnds: JSON.parse(JSON.stringify(rel.ends))
		};
		app.drag.cleanup = function () {
			window.removeEventListener('pointermove', onEdgeMove);
			window.removeEventListener('pointerup', onEdgeMoveEnd);
		};
		window.addEventListener('pointermove', onEdgeMove);
		window.addEventListener('pointerup', onEdgeMoveEnd);
	}

	function onEdgeMove(e) {
		const drag = app.drag;
		if (!drag || drag.type !== 'edge-move') return;
		const rel = M.findRelation(app.doc, drag.id);
		if (!rel) return;
		const world = app.view.screenToWorld(e.clientX, e.clientY);
		const dx = world.x - drag.startWorld.x;
		const dy = world.y - drag.startWorld.y;
		['a', 'b'].forEach(function (key) {
			const end = drag.startEnds[key];
			if (M.isEndFree(end)) rel.ends[key] = M.makeFreeEnd(end.x + dx, end.y + dy);
		});
		app.view.updateEdges(app.doc, { selectedId: app.selectedId });
	}

	function onEdgeMoveEnd() {
		window.removeEventListener('pointermove', onEdgeMove);
		window.removeEventListener('pointerup', onEdgeMoveEnd);
		if (!app.drag || app.drag.type !== 'edge-move') return;
		app.drag = null;
		pushHistory();
		renderAll();
	}

	function cancelActiveDrag() {
		const drag = app.drag;
		app.drag = null;
		if (drag && typeof drag.cleanup === 'function') drag.cleanup();
		if (drag) {
			if (drag.type === 'entity') {
				const entity = M.findEntity(app.doc, drag.id);
				if (entity && drag.startPos) {
					entity.position.x = drag.startPos.x;
					entity.position.y = drag.startPos.y;
				}
			} else if (drag.type === 'edge-move') {
				const rel = M.findRelation(app.doc, drag.id);
				if (rel && drag.startEnds) rel.ends = JSON.parse(JSON.stringify(drag.startEnds));
			}
		}
		if (treeDrag) {
			if (typeof treeDrag.cleanup === 'function') treeDrag.cleanup();
			treeDrag = null;
		}
		document.body.classList.remove('rg-dragging');
		clearDropTargets();
		app.view.clearOverlay();
		renderAll();
	}

	function prototypeSelectHTML(obj, kind) {
		const candidates = (kind === 'entity' ? app.doc.entities : app.doc.relations).filter(function (o) {
			return o.id !== obj.id && !M.isDescendant(app.doc, o.id, obj.id);
		});
		let html = '<label class="rg-field">原型<select data-field="prototype"><option value="">无（根）</option>';
		candidates.forEach(function (o) {
			const label = kind === 'entity' ? o.name : M.effectiveRelationLabel(app.doc, o);
			html += '<option value="' + esc(o.id) + '"' + (obj.prototypeId === o.id ? ' selected' : '') + '>' +
				esc(label) + '</option>';
		});
		return html + '</select></label>';
	}

	function styleRowHTML(obj, key, label, controlHTML) {
		const source = M.getStyleSource(app.doc, obj, key);
		const sourceText = source.source === 'default' ? '默认'
			: (source.source === 'own' ? '覆盖' : '继承自 ' + source.sourceName);
		const reset = source.source === 'own'
			? '<button class="btn small" data-reset-style="' + key + '" title="恢复继承">↺</button>'
			: '';
		return '<div class="rg-style-row"><span class="rg-style-label">' + label + '</span>' +
			controlHTML + '<span class="rg-style-source">' + esc(sourceText) + '</span>' +
			reset + '</div>';
	}

	function entityStyleHTML(obj, style) {
		const shape = '<select data-style-key="shape">' +
			['rounded:圆角', 'rect:直角', 'pill:胶囊'].map(function (item) {
				const parts = item.split(':');
				return '<option value="' + parts[0] + '"' + (style.shape === parts[0] ? ' selected' : '') + '>' + parts[1] + '</option>';
			}).join('') + '</select>';
		return styleRowHTML(obj, 'shape', '形状', shape) +
			styleRowHTML(obj, 'fill', '填充', '<input type="color" data-style-key="fill" value="' + esc(style.fill) + '">') +
			styleRowHTML(obj, 'border', '边框', '<input type="color" data-style-key="border" value="' + esc(style.border) + '">') +
			styleRowHTML(obj, 'text', '文字', '<input type="color" data-style-key="text" value="' + esc(style.text) + '">');
	}

	function relationStyleHTML(obj, style) {
		const arrow = '<select data-style-key="arrow">' +
			['end:终点', 'both:两端', 'none:无'].map(function (item) {
				const parts = item.split(':');
				return '<option value="' + parts[0] + '"' + (style.arrow === parts[0] ? ' selected' : '') + '>' + parts[1] + '</option>';
			}).join('') + '</select>';
		const line = '<select data-style-key="lineStyle">' +
			'<option value="curve"' + (style.lineStyle === 'curve' ? ' selected' : '') + '>曲线</option>' +
			'<option value="straight"' + (style.lineStyle === 'straight' ? ' selected' : '') + '>直线</option>' +
			'</select>';
		return styleRowHTML(obj, 'color', '颜色', '<input type="color" data-style-key="color" value="' + esc(style.color) + '">') +
			styleRowHTML(obj, 'dash', '虚线', '<input type="checkbox" data-style-key="dash"' + (style.dash ? ' checked' : '') + '>') +
			styleRowHTML(obj, 'arrow', '箭头', arrow) +
			styleRowHTML(obj, 'lineStyle', '线形', line) +
			styleRowHTML(obj, 'showLabel', '标签', '<input type="checkbox" data-style-key="showLabel"' + (style.showLabel ? ' checked' : '') + '>');
	}

	function endStatusText(end) {
		if (M.isEndBound(end)) {
			const entity = M.findEntity(app.doc, end.entityId);
			if (!entity) return '端点不存在';
			const base = entity.name + ' · ' + end.port;
			return entity.position ? base : base + '（未放置）';
		}
		if (M.isEndFree(end)) return '自由';
		return '未设置';
	}

	function renderInspector() {
		const el = els.inspector;
		const obj = app.selectedId ? M.findObject(app.doc, app.selectedId) : null;
		if (!obj) {
			el.innerHTML = '<h3>未选中</h3>' +
				'<label class="rg-field">图名<input data-field="doc-name" value="' + esc(app.doc.name) + '" placeholder="未命名关系图"></label>' +
				'<p class="rg-muted">选中实体或关系后可编辑属性。</p>' +
				'<p class="rg-muted">实体 ' + app.doc.entities.length + ' · 关系 ' + app.doc.relations.length + '</p>';
			return;
		}
		const kind = M.kindOf(obj);
		const style = M.resolveStyle(app.doc, obj);
		const isEntity = kind === 'entity';
		const nameValue = obj.name;
		const labelSource = isEntity ? null : M.getLabelSource(app.doc, obj);
		const children = M.getChildren(app.doc, obj);
		const placedChildren = children.filter(function (child) {
			return isEntity ? !!child.position : !!child.ends;
		}).length;
		const deletion = M.deletionCheck(app.doc, obj);
		let html = '<h3>' + (isEntity ? '实体' : '关系') + '</h3>';
		html += '<p class="rg-muted">' + children.length + ' 个子对象（' + placedChildren + ' 个已放置）</p>';
		html += '<label class="rg-field">' + (isEntity ? '名字' : '标签') +
			'<input data-field="name" data-obj-id="' + esc(obj.id) + '" value="' + esc(nameValue) + '" placeholder="' +
			(isEntity ? '' : (labelSource.source === 'inherited' ? '继承自 ' + esc(labelSource.sourceName) : '未命名')) + '"></label>';
		if (!isEntity && obj.ends) {
			html += '<p class="rg-muted">端点 A：' + esc(endStatusText(obj.ends.a)) +
				'　端点 B：' + esc(endStatusText(obj.ends.b)) + '</p>';
		}
		html += prototypeSelectHTML(obj, kind);
		html += isEntity ? entityStyleHTML(obj, style) : relationStyleHTML(obj, style);
		html += '<div class="rg-actions">';
		if (isEntity) {
			html += obj.position
				? '<button class="btn" data-action="unplace">从画布移除</button>'
				: '<button class="btn" data-action="place">放到画布</button>';
		} else if (obj.ends) {
			html += '<button class="btn" data-action="reverse">反向</button>';
			html += '<button class="btn" data-action="unplace">从画布移除</button>';
		} else {
			html += '<button class="btn" data-action="place">放到画布</button>';
		}
		html += '<button class="btn" data-action="add-child">＋ 子对象</button>';
		html += '<button class="btn danger" data-action="delete"' +
			(deletion.ok ? '' : ' disabled title="' + esc(deletion.reason) + '"') + '>删除</button>';
		html += '</div>';
		el.innerHTML = html;
	}

	function readStyleValue(input) {
		if (input.type === 'checkbox') return input.checked;
		return input.value;
	}

	app.view = new CV.CanvasView(els.canvas, {
		onCanvasPointerDown: function (e) {
			app.selectedId = null;
			renderAll();
			if (e.button !== 0) return;
			const start = { x: e.clientX, y: e.clientY, vx: app.doc.viewport.x, vy: app.doc.viewport.y };
			const move = function (ev) {
				app.doc.viewport.x = start.vx + ev.clientX - start.x;
				app.doc.viewport.y = start.vy + ev.clientY - start.y;
				app.view.setViewport(app.doc.viewport);
			};
			const up = function () {
				window.removeEventListener('pointermove', move);
				window.removeEventListener('pointerup', up);
				app.hasEdited = true;
				scheduleSave();
			};
			window.addEventListener('pointermove', move);
			window.addEventListener('pointerup', up);
		},
		onCardPointerDown: function (id, e) { startEntityMove(id, e); },
		onCardDoubleClick: function (id) { startRename(id); },
		onPortPointerDown: function (entityId, port, e) {
			startConnection(entityId, port, app.armedId, e);
		},
		onEdgePointerDown: function (id, e) {
			selectRelationOrDrag(id, e);
		},
		onHandlePointerDown: function (relId, endKey, e) {
			startHandleDrag(relId, endKey, e);
		}
	});

	els.tree.addEventListener('click', function (e) {
		const action = e.target.closest('[data-action]');
		if (action) {
			const row = action.closest('.rg-tree-row');
			const id = row && row.dataset.id;
			if (action.dataset.action === 'toggle') { toggleCollapse(id); return; }
			if (action.dataset.action === 'add-root') { addRoot(action.dataset.kind); return; }
			if (action.dataset.action === 'add-child') { addChild(id); return; }
			if (action.dataset.action === 'menu') { openRowMenu(action, id); return; }
		}
		const row = e.target.closest('.rg-tree-row');
		if (row) {
			if (row.dataset.kind === 'relation') {
				const id = row.dataset.id;
				if (app.armedId === id) {
					app.armedId = null;
					app.selectedId = id;
					renderAll();
					notify('info', '已取消下一条线使用的关系；下次拖线会先选择关系类型');
				} else {
					app.armedId = id;
					select(id);
				}
			} else {
				select(row.dataset.id);
			}
		}
	});

	els.tree.addEventListener('pointerdown', function (e) {
		const row = e.target.closest('.rg-tree-row');
		if (!row || e.button !== 0) return;
		if (e.target.closest('[data-action]')) return;
		treeDrag = {
			id: row.dataset.id,
			kind: row.dataset.kind,
			startX: e.clientX,
			startY: e.clientY,
			moved: false,
			asSelf: e.ctrlKey || e.altKey
		};
		treeDrag.cleanup = function () {
			window.removeEventListener('pointermove', onTreeDragMove);
			window.removeEventListener('pointerup', onTreeDragUp);
		};
		window.addEventListener('pointermove', onTreeDragMove);
		window.addEventListener('pointerup', onTreeDragUp);
	});

	els.inspector.addEventListener('input', function (e) {
		const field = e.target.dataset.field;
		if (field === 'doc-name') {
			app.doc.name = e.target.value;
			app.inspectorDirty = true;
			app.hasEdited = true;
			scheduleSave();
			return;
		}
		if (field !== 'name') return;
		const id = e.target.dataset.objId || app.selectedId;
		const obj = id ? M.findObject(app.doc, id) : null;
		if (!obj) return;
		const value = e.target.value.trim();
		if (M.kindOf(obj) === 'entity') {
			if (value) obj.name = value;
		} else {
			obj.name = value;
		}
		app.inspectorDirty = true;
		app.hasEdited = true;
		scheduleSave();
	});

	els.inspector.addEventListener('change', function (e) {
		const field = e.target.dataset.field;
		const obj = app.selectedId ? M.findObject(app.doc, app.selectedId) : null;
		if (field === 'doc-name') {
			const value = e.target.value.trim() || app.doc.name.trim() || '未命名关系图';
			app.doc.name = value;
			e.target.value = value;
			app.inspectorDirty = false;
			pushHistory();
			scheduleSave();
			return;
		}
		if (!obj) return;
		if (field === 'name') {
			if (e.target.dataset.objId && e.target.dataset.objId !== app.selectedId) return;
			const value = e.target.value.trim();
			const next = M.kindOf(obj) === 'entity' ? (value || obj.name) : value;
			const changed = next !== obj.name;
			obj.name = next;
			e.target.value = next;
			if (!changed && !app.inspectorDirty) return;
			app.inspectorDirty = false;
			pushHistory();
			refreshObjectName(obj);
			return;
		}
		if (field === 'prototype') {
			try {
				M.setParent(app.doc, obj, e.target.value || null);
			} catch (err) {
				notify('warning', err.message);
				renderAll();
				return;
			}
			pushHistory();
			renderAll();
			return;
		}
		const styleKey = e.target.dataset.styleKey;
		if (styleKey) {
			M.setStyleKey(obj, styleKey, readStyleValue(e.target));
			pushHistory();
			renderAll();
		}
	});

	els.inspector.addEventListener('focusout', function (e) {
		if (!app.inspectorDirty) return;
		const field = e.target.dataset.field;
		if (field !== 'name' && field !== 'doc-name') return;
		if (field === 'doc-name') {
			const value = (e.target.value || '').trim() || app.doc.name.trim() || '未命名关系图';
			app.doc.name = value;
			e.target.value = value;
		} else {
			const id = e.target.dataset.objId || app.selectedId;
			const obj = id ? M.findObject(app.doc, id) : null;
			if (obj) {
				const value = e.target.value.trim();
				obj.name = M.kindOf(obj) === 'entity' ? (value || obj.name) : value;
				refreshObjectName(obj);
			}
		}
		app.inspectorDirty = false;
		pushHistory();
	});

	els.inspector.addEventListener('keydown', function (e) {
		if (e.key !== 'Enter') return;
		const field = e.target.dataset.field;
		if (field !== 'name' && field !== 'doc-name') return;
		e.preventDefault();
		e.target.blur();
	});

	els.inspector.addEventListener('click', function (e) {
		const reset = e.target.closest('[data-reset-style]');
		const action = e.target.closest('[data-action]');
		const obj = app.selectedId ? M.findObject(app.doc, app.selectedId) : null;
		if (!obj) return;
		if (reset) {
			M.clearStyleKey(obj, reset.dataset.resetStyle);
			pushHistory();
			renderAll();
			return;
		}
		if (!action) return;
		const name = action.dataset.action;
		if (name === 'place') {
			placeObject(obj);
		} else if (name === 'unplace') {
			unplaceObject(obj);
		} else if (name === 'reverse') {
			if (obj.ends) {
				reverseRelation(obj);
			}
		} else if (name === 'add-child') {
			addChild(obj.id);
		} else if (name === 'delete') {
			deleteSelected();
		}
	});

	document.addEventListener('keydown', function (e) {
		if (els.helpDialog.open || els.exportDialog.open) return;
		const tag = (e.target.tagName || '').toLowerCase();
		if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable) return;
		if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
			e.preventDefault();
			if (e.shiftKey) redo();
			else undo();
		} else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
			e.preventDefault();
			redo();
		} else if (e.key === 'Delete' || e.key === 'Backspace') {
			e.preventDefault();
			deleteSelected();
		} else if (e.key === 'Escape') {
			closeMenu();
			cancelActiveDrag();
			if (app.armedId) {
				app.armedId = null;
				renderAll();
			}
		}
	});

	els.undo.addEventListener('click', undo);
	els.redo.addEventListener('click', redo);

	const ZOOM_PRESETS = [25, 50, 75, 100, 125, 150, 200, 300];
	const ZOOM_MIN = 25;
	const ZOOM_MAX = 300;

	function updateZoomDisplay() {
		const percent = Math.round(app.doc.viewport.zoom * 100);
		els.zoomDisplay.textContent = percent + '%';
		els.zoomIn.disabled = percent >= ZOOM_MAX;
		els.zoomOut.disabled = percent <= ZOOM_MIN;
	}

	function applyPointerZoom(clientX, clientY, factor) {
		const rect = els.canvas.getBoundingClientRect();
		const originLeft = rect.left + els.canvas.clientLeft;
		const originTop = rect.top + els.canvas.clientTop;
		const before = app.view.screenToWorld(clientX, clientY);
		const vp = app.doc.viewport;
		vp.zoom = Math.max(0.25, Math.min(3, vp.zoom * factor));
		vp.x = clientX - originLeft - before.x * vp.zoom;
		vp.y = clientY - originTop - before.y * vp.zoom;
		app.view.setViewport(vp);
		updateZoomDisplay();
		app.hasEdited = true;
		scheduleSave();
	}

	els.canvas.addEventListener('wheel', function (e) {
		e.preventDefault();
		applyPointerZoom(e.clientX, e.clientY, e.deltaY < 0 ? 1.1 : 1 / 1.1);
	}, { passive: false });

	function zoomToPercent(percent) {
		const target = Math.max(0.25, Math.min(3, percent / 100));
		const current = app.doc.viewport.zoom;
		if (Math.abs(target - current) < 0.000001) {
			updateZoomDisplay();
			return;
		}
		const rect = els.canvas.getBoundingClientRect();
		applyPointerZoom(rect.left + rect.width / 2, rect.top + rect.height / 2, target / current);
	}

	function zoomByStep(delta) {
		const percent = Math.round(app.doc.viewport.zoom * 100);
		const next = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, percent + delta));
		if (next === percent) return;
		zoomToPercent(next);
	}

	function openZoomMenu() {
		const rect = els.zoomDisplay.getBoundingClientRect();
		const current = Math.round(app.doc.viewport.zoom * 100);
		els.menu.textContent = '';
		ZOOM_PRESETS.forEach(function (percent) {
			const btn = document.createElement('button');
			btn.type = 'button';
			btn.className = 'btn' + (percent === current ? ' active' : '');
			btn.textContent = percent + '%';
			btn.addEventListener('click', function () {
				closeMenu();
				zoomToPercent(percent);
			});
			els.menu.appendChild(btn);
		});
		openMenuAt(els.menu, rect.left, rect.bottom + 4);
	}

	els.zoomDisplay.addEventListener('click', openZoomMenu);

	function fitContent() {
		const rects = [];
		const points = [];
		app.doc.entities.forEach(function (e) {
			if (!e.position) return;
			const r = app.view.getEntityRect(e.id);
			if (r) rects.push(r);
		});
		app.doc.relations.forEach(function (r) {
			if (!M.relationVisibility(app.doc, r)) return;
			if (M.isEndFree(r.ends.a)) points.push(r.ends.a);
			if (M.isEndFree(r.ends.b)) points.push(r.ends.b);
		});
		const box = G.bboxOfRects(rects);
		const pointBox = G.bboxOfPoints(points);
		let merged = box;
		if (pointBox) {
			merged = box ? {
				x: Math.min(box.x, pointBox.x),
				y: Math.min(box.y, pointBox.y),
				width: Math.max(box.x + box.width, pointBox.x + pointBox.width) - Math.min(box.x, pointBox.x),
				height: Math.max(box.y + box.height, pointBox.y + pointBox.height) - Math.min(box.y, pointBox.y)
			} : pointBox;
		}
		const canvasRect = els.canvas.getBoundingClientRect();
		const vp = G.fitView(merged, { width: canvasRect.width, height: canvasRect.height }, 60);
		app.doc.viewport = vp;
		app.view.setViewport(vp);
		updateZoomDisplay();
		app.hasEdited = true;
		scheduleSave();
	}

	els.zoomIn.addEventListener('click', function () { zoomByStep(10); });
	els.zoomOut.addEventListener('click', function () { zoomByStep(-10); });
	els.zoomReset.addEventListener('click', function () { zoomToPercent(100); });
	els.fitBtn.addEventListener('click', fitContent);

	function downloadBlob(blob, filename) {
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		a.remove();
		setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
	}

	function downloadText(filename, text, type) {
		downloadBlob(new Blob([text], { type: type || 'text/plain;charset=utf-8' }), filename);
	}

	function dateStamp() {
		const d = new Date();
		const m = String(d.getMonth() + 1).padStart(2, '0');
		const day = String(d.getDate()).padStart(2, '0');
		return '' + d.getFullYear() + m + day;
	}

	function exportFileName(ext) {
		const name = String(app.doc.name || '未命名关系图').replace(/[\\/:*?"<>|]/g, '_');
		return '关系图-' + name + '-' + dateStamp() + '.' + ext;
	}

	function confirmReplace(actionLabel) {
		if (app.doc.entities.length + app.doc.relations.length === 0) return true;
		return window.confirm('当前图有内容，' + actionLabel + '会替换它（可撤销，但刷新后不可恢复）。继续？');
	}

	function newDocument() {
		if (!confirmReplace('新建')) return;
		app.doc = M.createDocument();
		app.selectedId = null;
		app.armedId = null;
		app.view.setViewport(app.doc.viewport);
		updateZoomDisplay();
		pushHistory();
		renderAll();
		scheduleSave();
	}

	function importDocument(parsed) {
		const result = M.validateDocument(parsed);
		if (!result.ok) {
			notify('error', '导入失败：' + result.error);
			return;
		}
		if (!confirmReplace('导入')) return;
		app.doc = result.doc;
		app.selectedId = null;
		app.armedId = null;
		app.view.setViewport(app.doc.viewport);
		updateZoomDisplay();
		pushHistory();
		renderAll();
		scheduleSave();
	}

	function collectCssText() {
		let css = '';
		Array.from(document.styleSheets).forEach(function (sheet) {
			let rules = null;
			try { rules = sheet.cssRules; } catch (err) { return; }
			if (!rules) return;
			Array.from(rules).forEach(function (rule) {
				if (window.CSSRule && rule.type === window.CSSRule.IMPORT_RULE) return;
				css += rule.cssText + '\n';
			});
		});
		return css;
	}

	function exportPng() {
		if (els.exportDialog.open) els.exportDialog.close();
		const rects = [];
		const points = [];
		app.doc.entities.forEach(function (e) {
			if (!e.position) return;
			const r = app.view.getEntityRect(e.id);
			if (r) rects.push(r);
		});
		app.doc.relations.forEach(function (r) {
			if (!M.relationVisibility(app.doc, r)) return;
			if (M.isEndFree(r.ends.a)) points.push(r.ends.a);
			if (M.isEndFree(r.ends.b)) points.push(r.ends.b);
		});
		const box = G.bboxOfRects(rects);
		const pointBox = G.bboxOfPoints(points);
		let merged = box;
		if (pointBox) {
			merged = box ? {
				x: Math.min(box.x, pointBox.x),
				y: Math.min(box.y, pointBox.y),
				width: Math.max(box.x + box.width, pointBox.x + pointBox.width) - Math.min(box.x, pointBox.x),
				height: Math.max(box.y + box.height, pointBox.y + pointBox.height) - Math.min(box.y, pointBox.y)
			} : pointBox;
		}
		if (!merged) {
			notify('info', '没有可导出的内容');
			return;
		}
		const pad = 40;
		const bx = Math.round(merged.x - pad);
		const by = Math.round(merged.y - pad);
		const w = Math.max(1, Math.round(merged.width + pad * 2));
		const h = Math.max(1, Math.round(merged.height + pad * 2));

		const clone = app.view.world.cloneNode(true);
		clone.removeAttribute('id');
		clone.style.position = 'absolute';
		clone.style.left = '0px';
		clone.style.top = '0px';
		clone.style.transformOrigin = '0 0';
		clone.style.transform = 'translate(' + (-bx) + 'px,' + (-by) + 'px)';
		const overlay = clone.querySelector('.rg-overlay-svg');
		if (overlay) overlay.remove();
		Array.from(clone.querySelectorAll('.rg-port, .rg-end-handle, .rg-guide, .rg-rubber, .rg-card-input')).forEach(function (el) {
			el.remove();
		});
		Array.from(clone.querySelectorAll('.selected, .drop-target')).forEach(function (el) {
			el.classList.remove('selected', 'drop-target');
		});
		const svgEl = clone.querySelector('.rg-svg');
		if (!svgEl) {
			notify('error', '导出图片失败');
			return;
		}
		svgEl.removeAttribute('id');
		svgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
		svgEl.setAttribute('viewBox', bx + ' ' + by + ' ' + w + ' ' + h);
		svgEl.style.left = bx + 'px';
		svgEl.style.top = by + 'px';
		svgEl.style.width = w + 'px';
		svgEl.style.height = h + 'px';

		const rootStyle = window.getComputedStyle(document.documentElement);
		const bodyStyle = window.getComputedStyle(document.body);
		const varNames = [
			'--bg-base', '--bg-subtle', '--border-color', '--border-subtle',
			'--text-secondary', '--text-muted', '--accent-primary', '--accent-light',
			'--shadow-sm', '--shadow-md'
		];
		const wrapper = document.createElement('div');
		let wrapperStyle = 'width:' + w + 'px;height:' + h + 'px;position:relative;overflow:hidden;' +
			'background:#f9fafb;font-family:' + bodyStyle.fontFamily + ';font-size:' + bodyStyle.fontSize + ';' +
			'line-height:' + bodyStyle.lineHeight + ';color:' + bodyStyle.color + ';';
		varNames.forEach(function (name) {
			const value = rootStyle.getPropertyValue(name).trim();
			if (value) wrapperStyle += name + ':' + value + ';';
		});
		wrapper.setAttribute('style', wrapperStyle);
		wrapper.appendChild(clone);

		const css = collectCssText().replace(/&/g, '&amp;').replace(/</g, '&lt;');
		const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '">' +
			'<foreignObject width="100%" height="100%">' +
			'<div xmlns="http://www.w3.org/1999/xhtml" style="width:' + w + 'px;height:' + h + 'px">' +
			'<style>' + css + '</style>' + wrapper.outerHTML +
			'</div></foreignObject></svg>';

		const img = new Image();
		img.onload = function () {
			const canvas = document.createElement('canvas');
			canvas.width = w * 2;
			canvas.height = h * 2;
			const ctx = canvas.getContext('2d');
			ctx.scale(2, 2);
			ctx.drawImage(img, 0, 0);
			canvas.toBlob(function (blob) {
				if (!blob) {
					notify('error', '导出图片失败');
					return;
				}
				downloadBlob(blob, exportFileName('png'));
			}, 'image/png');
		};
		img.onerror = function () { notify('error', '导出图片失败'); };
		img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
	}

	els.newBtn.addEventListener('click', newDocument);
	els.openBtn.addEventListener('click', function () { els.fileInput.click(); });
	els.fileInput.addEventListener('change', function (e) {
		const file = e.target.files[0];
		e.target.value = '';
		if (!file) return;
		const reader = new FileReader();
		reader.onload = function () {
			let parsed;
			try {
				parsed = JSON.parse(String(reader.result));
			} catch (err) {
				notify('error', '不是合法 JSON');
				return;
			}
			importDocument(parsed);
		};
		reader.onerror = function () {
			notify('error', '读取文件失败');
		};
		reader.readAsText(file, 'utf-8');
	});
	els.exportBtn.addEventListener('click', function () { els.exportDialog.showModal(); });
	els.helpBtn.addEventListener('click', function () { els.helpDialog.showModal(); });
	els.exportJson.addEventListener('click', function () {
		els.exportDialog.close();
		downloadText(exportFileName('json'), JSON.stringify(app.doc, null, 2), 'application/json;charset=utf-8');
	});
	els.exportPng.addEventListener('click', exportPng);
	window.addEventListener('pagehide', saveNow);

	const saved = loadSaved();
	if (saved) app.doc = saved;
	app.view.setViewport(app.doc.viewport);
	updateZoomDisplay();
	initHistory();
	renderAll();

	window.RGApp = {
		app: app,
		get doc() { return app.doc; },
		state: app,
		get view() { return app.view; },
		select: select,
		renderAll: renderAll,
		undo: undo,
		redo: redo
	};
})();

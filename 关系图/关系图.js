(function () {
	'use strict';

	const M = window.RGModel;
	const G = window.RGGeometry;
	const T = window.RGTreeView;
	const CV = window.RGCanvasView;

	const DRAG_THRESHOLD = 3;
	// 缩放轴判定用屏幕像素意图，避免 100% 下 1px 抖动把另一轴写成覆盖项
	const RESIZE_AXIS_THRESHOLD = 2;
	const NUDGE_DELAY = 400;
	const STORAGE_KEY = 'relation_graph_v1';
	let saveTimer = null;

	const els = {
		tree: document.getElementById('rgTree'),
		treeSearch: document.getElementById('rgTreeSearch'),
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
		templateDialog: document.getElementById('rgTemplateDialog'),
		templateList: document.getElementById('rgTemplateList'),
		helpBtn: document.getElementById('rgHelpBtn'),
		helpDialog: document.getElementById('rgHelpDialog'),
		zoomIn: document.getElementById('rgZoomIn'),
		zoomOut: document.getElementById('rgZoomOut'),
		zoomReset: document.getElementById('rgZoomReset'),
		fitBtn: document.getElementById('rgFitBtn'),
		zoomDisplay: document.getElementById('rgZoomDisplay'),
		empty: document.getElementById('rgEmpty')
	};

	// 版本握手：浏览器缓存可能混用旧的 model.js 与本页脚本，
	// 此时常量缺失会把 undefined 带进宽度计算并写坏本地文档。
	if (!M || M.MODEL_VERSION !== 4 || !Number.isFinite(M.MIN_ENTITY_WIDTH)) {
		if (els.empty) {
			els.empty.hidden = false;
			els.empty.textContent = '页面资源版本不一致，请按 Ctrl+F5 强制刷新';
		}
		return;
	}

	const app = {
		doc: M.createDocument(),
		selectedId: null,
		selectedIds: new Set(),
		armedId: null,
		collapsed: new Set(),
		history: [],
		histIndex: -1,
		view: null,
		drag: null,
		inspectorDirty: false,
		inspectorNumberDirty: false,
		hasEdited: false,
		treeQuery: '',
		nudgeTimer: null,
		clipboard: null,
		pasteCount: 0
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
		let check;
		try {
			check = M.validateDocument(JSON.parse(JSON.stringify(app.doc)));
		} catch (err) {
			notify('warning', '自动保存已暂停：' + err.message);
			return;
		}
		if (!check.ok) {
			notify('warning', '自动保存已暂停：' + check.error);
			return;
		}
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

	// ---- 选择状态 ----

	function setPrimarySelection(id) {
		app.selectedId = id || null;
	}

	function setSingleSelection(id) {
		app.selectedIds = new Set(id ? [id] : []);
		setPrimarySelection(id);
	}

	function selectRelation(id) {
		app.selectedIds.clear();
		app.selectedId = id || null;
	}

	function toggleEntitySelection(id) {
		if (!id) return;
		if (app.selectedIds.has(id)) {
			app.selectedIds.delete(id);
			if (app.selectedId === id) {
				const rest = Array.from(app.selectedIds);
				app.selectedId = rest.length ? rest[rest.length - 1] : null;
			}
		} else {
			app.selectedIds.add(id);
			app.selectedId = id;
		}
	}

	function clearSelection() {
		app.selectedIds.clear();
		app.selectedId = null;
	}

	function selectAllPlaced() {
		const ids = app.doc.entities.filter(function (entity) {
			return !!entity.position;
		}).map(function (entity) {
			return entity.id;
		});
		app.selectedIds = new Set(ids);
		app.selectedId = ids.length ? ids[ids.length - 1] : null;
	}

	function pruneSelection() {
		const valid = new Set();
		app.selectedIds.forEach(function (id) {
			if (M.findEntity(app.doc, id)) valid.add(id);
		});
		app.selectedIds = valid;
		if (app.selectedId) {
			const obj = M.findObject(app.doc, app.selectedId);
			if (!obj) {
				app.selectedId = null;
			} else if (M.kindOf(obj) === 'relation') {
				app.selectedIds.clear();
			} else if (!app.selectedIds.has(app.selectedId)) {
				const rest = Array.from(app.selectedIds);
				app.selectedId = rest.length ? rest[rest.length - 1] : null;
			}
		}
		if (!app.selectedId && app.selectedIds.size) {
			const rest = Array.from(app.selectedIds);
			app.selectedId = rest[rest.length - 1];
		}
	}

	function snapshot() {
		return JSON.stringify({ name: app.doc.name, entities: app.doc.entities, relations: app.doc.relations });
	}

	function restore(snap) {
		const data = JSON.parse(snap);
		app.doc.name = data.name;
		app.doc.entities = data.entities;
		app.doc.relations = data.relations;
		pruneSelection();
		if (app.armedId && !M.findRelation(app.doc, app.armedId)) app.armedId = null;
	}

	function initHistory() {
		app.history = [snapshot()];
		app.histIndex = 0;
		updateHistoryButtons();
	}

	function pushHistory() {
		// 未落盘的微调并入本次历史，避免出现两条记录
		if (app.nudgeTimer) {
			clearTimeout(app.nudgeTimer);
			app.nudgeTimer = null;
		}
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

	function flushNudge() {
		if (!app.nudgeTimer) return;
		clearTimeout(app.nudgeTimer);
		app.nudgeTimer = null;
		pushHistory();
	}

	function flushInspectorName() {
		if (!app.inspectorDirty) return;
		app.inspectorDirty = false;
		pushHistory();
	}

	function flushInspectorNumber() {
		if (!app.inspectorNumberDirty) return;
		app.inspectorNumberDirty = false;
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
			// 按文字定宽的实体，名字变了宽度要跟着重算（继承到 auto 规则的子对象同理）
			if (M.resolveStyle(app.doc, obj).width === 'auto') app.view.refreshAutoWidth(obj.id);
		}
		Array.from(els.tree.querySelectorAll('.rg-tree-row[data-kind="relation"]')).forEach(function (row) {
			const rel = M.findRelation(app.doc, row.dataset.id);
			const statusEl = row.querySelector('.rg-tree-status');
			if (!rel || !statusEl) return;
			let status = T.relationSummary(app.doc, rel);
			if (rel.ends && !M.relationVisibility(app.doc, rel)) status += ' · 端点未放置';
			statusEl.textContent = status;
		});
		app.view.updateEdges(app.doc, { selectedId: app.selectedId, selectedIds: app.selectedIds });
		if (app.armedId && !M.findRelation(app.doc, app.armedId)) app.armedId = null;
	}

	function undo() {
		flushInspectorName();
		flushInspectorNumber();
		flushNudge();
		if (app.histIndex <= 0) return;
		app.histIndex -= 1;
		restore(app.history[app.histIndex]);
		renderAll();
		updateHistoryButtons();
		scheduleSave();
	}

	function redo() {
		flushInspectorName();
		flushInspectorNumber();
		flushNudge();
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
			selectedIds: app.selectedIds,
			armedId: app.armedId,
			collapsed: app.collapsed,
			query: app.treeQuery
		});
	}

	function renderAll() {
		flushInspectorName();
		flushInspectorNumber();
		pruneSelection();
		renderTree();
		app.view.render(app.doc, {
			selectedId: app.selectedId,
			selectedIds: app.selectedIds,
			armedId: app.armedId
		});
		updateEmpty();
		renderInspector();
	}

	function selectionState() {
		return {
			selectedId: app.selectedId,
			selectedIds: app.selectedIds,
			armedId: app.armedId
		};
	}

	function select(id) {
		const obj = id ? M.findObject(app.doc, id) : null;
		if (!obj) {
			clearSelection();
		} else if (M.kindOf(obj) === 'entity') {
			setSingleSelection(id);
		} else {
			selectRelation(id);
		}
		renderAll();
		if (obj) centerOnObject(id);
	}

	function renderSelection() {
		flushInspectorName();
		flushInspectorNumber();
		pruneSelection();
		renderTree();
		const state = selectionState();
		app.view.applySelection(state);
		app.view.updateEdges(app.doc, state);
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
		if (kind === 'entity') setSingleSelection(obj.id);
		else selectRelation(obj.id);
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
		if (M.kindOf(parent) === 'entity') setSingleSelection(obj.id);
		else selectRelation(obj.id);
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
			addItem('复制', function (fresh) {
				setSingleSelection(fresh.id);
				copySelection();
			});
			addItem('复制子树', function (fresh) {
				copySubtree(fresh.id);
			});
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
		addItem('删除', function (fresh) {
			if (M.kindOf(fresh) === 'relation') selectRelation(id);
			else setSingleSelection(id);
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
				selectRelation(relTemplate.id);
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
				selectRelation(rel.id);
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
			selectRelation(rel.id);
			pushHistory();
			renderAll();
			return;
		}
		const entity = M.findEntity(app.doc, drag.id);
		if (!entity) return;
		if (drag.asSelf) {
			M.placeEntity(entity, world.x - 84, world.y - 22);
			setSingleSelection(entity.id);
			pushHistory();
			renderAll();
			return;
		}
		const child = M.createEntity(app.doc, {
			name: M.nextEntityName(app.doc, entity),
			prototypeId: entity.id,
			position: { x: world.x - 84, y: world.y - 22 }
		});
		setSingleSelection(child.id);
		pushHistory();
		renderAll();
		startRename(child.id);
	}

	// ---- 卡片点选与组拖 ----

	function startEntityMove(id, e) {
		const entity = M.findEntity(app.doc, id);
		if (!entity || !entity.position) return;
		if (e.shiftKey) {
			toggleEntitySelection(id);
			renderSelection();
			return;
		}
		const wasMulti = app.selectedIds.size > 1 && app.selectedIds.has(id);
		if (!app.selectedIds.has(id)) {
			setSingleSelection(id);
		} else {
			setPrimarySelection(id);
		}
		renderSelection();

		const selectedAtStart = app.selectedIds.size;
		const ids = [];
		const starts = [];
		const rects = [];
		app.selectedIds.forEach(function (sid) {
			const item = M.findEntity(app.doc, sid);
			if (!item || !item.position) return;
			const rect = app.view.getEntityRect(sid);
			if (!rect) return;
			ids.push(sid);
			starts.push({ id: sid, x: item.position.x, y: item.position.y });
			rects.push(rect);
		});
		if (!ids.length) {
			setSingleSelection(id);
			renderSelection();
			return;
		}
		const box = G.bboxOfRects(rects);
		if (!box) return;
		app.drag = {
			type: 'entity',
			ids: ids,
			starts: starts,
			startBox: box,
			primaryId: id,
			multi: selectedAtStart > 1 || wasMulti,
			moved: false,
			startX: e.clientX,
			startY: e.clientY,
			startWorld: app.view.screenToWorld(e.clientX, e.clientY)
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
		if (!drag.moved) {
			const dx = e.clientX - drag.startX;
			const dy = e.clientY - drag.startY;
			if (Math.hypot(dx, dy) <= DRAG_THRESHOLD) return;
			drag.moved = true;
		}
		const world = app.view.screenToWorld(e.clientX, e.clientY);
		let dx = world.x - drag.startWorld.x;
		let dy = world.y - drag.startWorld.y;
		const movingRect = {
			x: drag.startBox.x + dx,
			y: drag.startBox.y + dy,
			width: drag.startBox.width,
			height: drag.startBox.height
		};
		const movingIds = new Set(drag.ids);
		const others = [];
		app.doc.entities.forEach(function (other) {
			if (!other.position || movingIds.has(other.id)) return;
			const rect = app.view.getEntityRect(other.id);
			if (rect) others.push(rect);
		});
		const snap = G.snapGuides(movingRect, others, 6 / app.doc.viewport.zoom);
		dx += snap.dx;
		dy += snap.dy;
		drag.starts.forEach(function (item) {
			const entity = M.findEntity(app.doc, item.id);
			if (!entity || !entity.position) return;
			entity.position.x = item.x + dx;
			entity.position.y = item.y + dy;
			app.view.moveCardTo(item.id, entity.position.x, entity.position.y);
		});
		app.view.updateEdges(app.doc, { selectedId: app.selectedId, selectedIds: app.selectedIds });
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
		if (!drag.moved) {
			// 多选时点一下（无位移）收拢为单点实体
			if (drag.multi) {
				setSingleSelection(drag.primaryId);
				renderSelection();
			}
			return;
		}
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

	function copySelection() {
		let payload = null;
		if (app.selectedIds.size) {
			payload = M.copyEntities(app.doc, Array.from(app.selectedIds));
		} else {
			const obj = app.selectedId ? M.findObject(app.doc, app.selectedId) : null;
			if (!obj) return false;
			if (M.kindOf(obj) !== 'entity') {
				notify('info', '暂不支持复制关系');
				return true;
			}
			payload = M.copyEntities(app.doc, [obj.id]);
		}
		if (!payload || !payload.entities.length) return false;
		app.clipboard = payload;
		app.pasteCount = 0;
		notify('info', '已复制 ' + payload.entities.length + ' 个实体');
		return true;
	}

	function copySubtree(id) {
		const payload = M.copyEntitySubtree(app.doc, id);
		if (!payload.entities.length) return;
		app.clipboard = payload;
		app.pasteCount = 0;
		notify('info', '已复制子树（' + payload.entities.length + ' 个实体），Ctrl+V 粘贴');
	}

	function pasteClipboard() {
		if (!app.clipboard) return false;
		app.pasteCount += 1;
		const result = M.pasteClipboard(app.doc, app.clipboard, 24 * app.pasteCount);
		if (!result.entityIds.length) return false;
		app.selectedIds = new Set(result.entityIds);
		app.selectedId = result.entityIds[result.entityIds.length - 1];
		pushHistory();
		renderAll();
		notify('info', '已粘贴 ' + result.entityIds.length + ' 个实体');
		return true;
	}

	function deleteSelected() {
		if (app.selectedIds.size) {
			const pending = Array.from(app.selectedIds);
			let deleted = 0;
			let deletedRelations = 0;
			let promoted = 0;
			let progress = true;
			while (progress && pending.length) {
				progress = false;
				for (let i = pending.length - 1; i >= 0; i -= 1) {
					const obj = M.findEntity(app.doc, pending[i]);
					if (!obj) {
						pending.splice(i, 1);
						continue;
					}
					try {
						const result = M.deleteObject(app.doc, obj);
						deleted += 1;
						deletedRelations += result.deletedRelations || 0;
						promoted += result.promoted || 0;
						pending.splice(i, 1);
						progress = true;
					} catch (err) {
						// 留给下一轮或汇总为阻塞
					}
				}
			}
			const blocked = [];
			pending.forEach(function (id) {
				const obj = M.findEntity(app.doc, id);
				if (!obj) return;
				const check = M.deletionCheck(app.doc, obj);
				blocked.push(obj.name + '：' + check.reason);
			});
			if (app.armedId && !M.findRelation(app.doc, app.armedId)) app.armedId = null;
			pruneSelection();
			if (deleted) {
				pushHistory();
				renderAll();
				const parts = ['删除了 ' + deleted + ' 个实体'];
				if (deletedRelations) parts.push('连带删除 ' + deletedRelations + ' 条关系');
				if (promoted) parts.push(promoted + ' 个子对象提升到父级');
				notify('info', parts.join('，'));
			} else {
				renderAll();
			}
			if (blocked.length) {
				notify('warning', '有 ' + blocked.length + ' 个实体未能删除：' + blocked.join('；'));
			}
			return;
		}
		const obj = app.selectedId ? M.findObject(app.doc, app.selectedId) : null;
		if (!obj) return;
		const isEntity = M.kindOf(obj) === 'entity';
		// 删除后 obj 已不在文档；标签必须在 deleteObject 之前取好
		const labelSnapshot = isEntity ? obj.name : M.effectiveRelationLabel(app.doc, obj);
		try {
			const result = M.deleteObject(app.doc, obj);
			clearSelection();
			if (app.armedId === obj.id) app.armedId = null;
			pushHistory();
			renderAll();
			const parts = ['已删除「' + labelSnapshot + '」'];
			if (isEntity && result.deletedRelations) {
				parts.push('连带删除 ' + result.deletedRelations + ' 条关系');
			}
			if (result.promoted) parts.push(result.promoted + ' 个子对象提升到父级');
			notify('info', parts.join('，'));
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
			selectRelation(rel.id);
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
		selectRelation(id);
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
		app.view.updateEdges(app.doc, { selectedId: app.selectedId, selectedIds: app.selectedIds });
	}

	function onEdgeMoveEnd() {
		window.removeEventListener('pointermove', onEdgeMove);
		window.removeEventListener('pointerup', onEdgeMoveEnd);
		if (!app.drag || app.drag.type !== 'edge-move') return;
		app.drag = null;
		pushHistory();
		renderAll();
	}

	// ---- 缩放 ----

	function startResize(id, corner, e) {
		const entity = M.findEntity(app.doc, id);
		if (!entity || !entity.position) return;
		const rect = app.view.getEntityRect(id);
		if (!rect) return;
		const style = entity.style || {};
		app.drag = {
			type: 'resize',
			id: id,
			corner: corner,
			moved: false,
			startX: e.clientX,
			startY: e.clientY,
			startRect: rect,
			startPos: { x: entity.position.x, y: entity.position.y },
			origWidth: Object.prototype.hasOwnProperty.call(style, 'width'),
			origWidthValue: style.width,
			origMinHeight: Object.prototype.hasOwnProperty.call(style, 'minHeight'),
			origMinHeightValue: style.minHeight
		};
		app.drag.cleanup = function () {
			window.removeEventListener('pointermove', onResizeMove);
			window.removeEventListener('pointerup', onResizeEnd);
		};
		window.addEventListener('pointermove', onResizeMove);
		window.addEventListener('pointerup', onResizeEnd);
	}

	function onResizeMove(e) {
		const drag = app.drag;
		if (!drag || drag.type !== 'resize') return;
		const mdx = e.clientX - drag.startX;
		const mdy = e.clientY - drag.startY;
		if (!drag.moved) {
			if (Math.hypot(mdx, mdy) <= DRAG_THRESHOLD) return;
			drag.moved = true;
		}
		const entity = M.findEntity(app.doc, drag.id);
		if (!entity || !entity.position) return;
		const zoom = app.doc.viewport.zoom || 1;
		const dx = mdx / zoom;
		const dy = mdy / zoom;
		const corner = drag.corner;
		const start = drag.startRect;
		// 只把真正拖动的轴写成覆盖项，避免纯纵向/纯横向拖动破坏另一轴的原型继承。
		// 判定用屏幕像素（不除 zoom），1px 抖动不算拖动该轴。
		const resizeWidth = (corner.indexOf('e') > -1 || corner.indexOf('w') > -1) && Math.abs(mdx) > RESIZE_AXIS_THRESHOLD;
		const resizeHeight = (corner.indexOf('n') > -1 || corner.indexOf('s') > -1) && Math.abs(mdy) > RESIZE_AXIS_THRESHOLD;

		let width = start.width;
		if (Number.isFinite(start.width)) {
			if (corner.indexOf('e') > -1) width = start.width + dx;
			else if (corner.indexOf('w') > -1) width = start.width - dx;
			width = Math.max(M.MIN_ENTITY_WIDTH, width);
		}
		const widthOk = Number.isFinite(width);

		let minHeight = start.height;
		if (Number.isFinite(start.height)) {
			if (corner.indexOf('s') > -1) minHeight = start.height + dy;
			else if (corner.indexOf('n') > -1) minHeight = start.height - dy;
			minHeight = Math.max(0, minHeight);
		}
		const heightOk = Number.isFinite(minHeight);

		let x = drag.startPos.x;
		let y = drag.startPos.y;
		if (corner.indexOf('w') > -1 && widthOk) x = drag.startPos.x + (start.width - width);
		if (corner.indexOf('n') > -1) y = drag.startPos.y + dy;

		entity.position.x = x;
		entity.position.y = y;
		entity.style = entity.style || {};
		const patch = { x: x, y: y };
		if (resizeWidth && widthOk) {
			entity.style.width = width;
			patch.width = width;
		}
		if (resizeHeight && heightOk) {
			if (minHeight > 0) entity.style.minHeight = minHeight;
			else M.clearStyleKey(entity, 'minHeight');
			patch.minHeight = minHeight;
		}
		app.view.resizeCardTo(drag.id, patch);
		// 最小高度小于内容高度时，高度由内容撑开；北侧拖动需要按实际高度回正位置
		if (corner.indexOf('n') > -1) {
			const card = app.view.findCard(drag.id);
			if (card) {
				const actualHeight = card.offsetHeight;
				const fixedY = drag.startPos.y + start.height - actualHeight;
				if (Math.abs(fixedY - y) > 0.01) {
					entity.position.y = fixedY;
					patch.y = fixedY;
					app.view.resizeCardTo(drag.id, patch);
				}
			}
		}
	}

	function onResizeEnd() {
		window.removeEventListener('pointermove', onResizeMove);
		window.removeEventListener('pointerup', onResizeEnd);
		if (!app.drag || app.drag.type !== 'resize') return;
		const drag = app.drag;
		app.drag = null;
		if (!drag.moved) return;
		pushHistory();
		renderAll();
	}

	// ---- 框选 ----

	function normalizeRect(a, b) {
		return {
			x: Math.min(a.x, b.x),
			y: Math.min(a.y, b.y),
			width: Math.abs(a.x - b.x),
			height: Math.abs(a.y - b.y)
		};
	}

	function startMarquee(e) {
		e.preventDefault();
		app.drag = {
			type: 'marquee',
			start: app.view.screenToWorld(e.clientX, e.clientY),
			startX: e.clientX,
			startY: e.clientY,
			moved: false,
			rect: null
		};
		app.drag.cleanup = function () {
			window.removeEventListener('pointermove', onMarqueeMove);
			window.removeEventListener('pointerup', onMarqueeEnd);
		};
		window.addEventListener('pointermove', onMarqueeMove);
		window.addEventListener('pointerup', onMarqueeEnd);
	}

	function onMarqueeMove(e) {
		const drag = app.drag;
		if (!drag || drag.type !== 'marquee') return;
		if (!drag.moved) {
			const dx = e.clientX - drag.startX;
			const dy = e.clientY - drag.startY;
			if (Math.hypot(dx, dy) <= DRAG_THRESHOLD) return;
			drag.moved = true;
		}
		const current = app.view.screenToWorld(e.clientX, e.clientY);
		drag.rect = normalizeRect(drag.start, current);
		// 框选期间不更新边，避免 overlay 被清掉
		app.view.showMarquee(drag.rect);
	}

	function onMarqueeEnd(e) {
		window.removeEventListener('pointermove', onMarqueeMove);
		window.removeEventListener('pointerup', onMarqueeEnd);
		if (!app.drag || app.drag.type !== 'marquee') return;
		const drag = app.drag;
		app.drag = null;
		app.view.clearMarquee();
		if (!drag.moved) {
			clearSelection();
			renderSelection();
			return;
		}
		const rect = drag.rect || normalizeRect(drag.start, app.view.screenToWorld(e.clientX, e.clientY));
		const ids = [];
		app.doc.entities.forEach(function (entity) {
			if (!entity.position) return;
			const entityRect = app.view.getEntityRect(entity.id);
			if (entityRect && G.rectsIntersect(entityRect, rect)) ids.push(entity.id);
		});
		app.selectedIds = new Set(ids);
		app.selectedId = ids.length ? ids[ids.length - 1] : null;
		renderSelection();
	}

	// ---- 方向键微调 / 对齐分布 ----

	function selectedPlacedRects() {
		const rects = [];
		app.selectedIds.forEach(function (id) {
			const entity = M.findEntity(app.doc, id);
			if (!entity || !entity.position) return;
			const rect = app.view.getEntityRect(id);
			if (!rect) return;
			rects.push({ id: id, x: rect.x, y: rect.y, width: rect.width, height: rect.height });
		});
		return rects;
	}

	function nudgeSelected(dx, dy) {
		const ids = [];
		app.selectedIds.forEach(function (id) {
			const entity = M.findEntity(app.doc, id);
			if (entity && entity.position) ids.push(id);
		});
		if (!ids.length) return false;
		ids.forEach(function (id) {
			const entity = M.findEntity(app.doc, id);
			entity.position.x += dx;
			entity.position.y += dy;
			app.view.moveCardTo(id, entity.position.x, entity.position.y);
		});
		app.view.updateEdges(app.doc, { selectedId: app.selectedId, selectedIds: app.selectedIds });
		app.hasEdited = true;
		scheduleSave();
		clearTimeout(app.nudgeTimer);
		app.nudgeTimer = setTimeout(function () {
			app.nudgeTimer = null;
			pushHistory();
			renderAll();
		}, NUDGE_DELAY);
		return true;
	}

	function applyPositions(list) {
		list.forEach(function (item) {
			const entity = M.findEntity(app.doc, item.id);
			if (!entity || !entity.position) return;
			entity.position.x = item.x;
			entity.position.y = item.y;
		});
		pushHistory();
		renderAll();
	}

	function alignSelected(mode) {
		const rects = selectedPlacedRects();
		if (rects.length < 2) return;
		applyPositions(G.alignRects(rects, mode));
	}

	function distributeSelected(axis) {
		const rects = selectedPlacedRects();
		if (rects.length < 3) return;
		applyPositions(G.distributeRects(rects, axis));
	}

	function cancelActiveDrag() {
		const drag = app.drag;
		app.drag = null;
		if (drag && typeof drag.cleanup === 'function') drag.cleanup();
		if (drag) {
			if (drag.type === 'entity') {
				drag.starts.forEach(function (item) {
					const entity = M.findEntity(app.doc, item.id);
					if (!entity || !entity.position) return;
					entity.position.x = item.x;
					entity.position.y = item.y;
				});
			} else if (drag.type === 'resize') {
				const entity = M.findEntity(app.doc, drag.id);
				if (entity) {
					entity.position = { x: drag.startPos.x, y: drag.startPos.y };
					entity.style = entity.style || {};
					if (drag.origWidth) entity.style.width = drag.origWidthValue;
					else delete entity.style.width;
					if (drag.origMinHeight) entity.style.minHeight = drag.origMinHeightValue;
					else delete entity.style.minHeight;
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

	// ---- 右栏 ----

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

	function styleSourceText(source, key) {
		let text = source.source === 'default' ? '默认'
			: (source.source === 'own' ? '覆盖' : '继承自 ' + source.sourceName);
		// width 行的值可能就是规则本身：标出「按文字」，避免误读成测出来的数字
		if (key === 'width' && source.value === 'auto') text += '（按文字）';
		return text;
	}

	function styleRowHTML(obj, key, label, controlHTML) {
		const source = M.getStyleSource(app.doc, obj, key);
		const sourceText = styleSourceText(source, key);
		const reset = source.source === 'own'
			? '<button class="btn small" data-reset-style="' + key + '" title="恢复继承">↺</button>'
			: '';
		return '<div class="rg-style-row" data-style-row="' + key + '"><span class="rg-style-label">' + label + '</span>' +
			controlHTML + '<span class="rg-style-source">' + esc(sourceText) + '</span>' +
			reset + '</div>';
	}

	// 就地刷新某一行的来源文本与 ↺，不重建 inspector，保住输入框焦点
	function refreshStyleRow(obj, key) {
		const row = els.inspector.querySelector('[data-style-row="' + key + '"]');
		if (!row) return;
		const source = M.getStyleSource(app.doc, obj, key);
		const sourceEl = row.querySelector('.rg-style-source');
		if (sourceEl) sourceEl.textContent = styleSourceText(source, key);
		if (key === 'width') {
			// 同步 auto 的显示态，但不重建输入框（保住焦点）
			const auto = source.value === 'auto';
			const input = row.querySelector('input[data-style-key="width"]');
			if (input) {
				input.placeholder = '按文字';
				if (auto) input.value = '';
				else if (document.activeElement !== input) input.value = String(source.value);
			}
			const fit = row.querySelector('[data-action="fit-width"]');
			if (fit) {
				fit.classList.toggle('active', auto);
				fit.textContent = auto ? '✓ 按文字' : '按文字';
			}
		}
		const existing = row.querySelector('[data-reset-style]');
		if (source.source === 'own') {
			if (!existing) {
				const btn = document.createElement('button');
				btn.className = 'btn small';
				btn.dataset.resetStyle = key;
				btn.title = '恢复继承';
				btn.textContent = '↺';
				row.appendChild(btn);
			}
		} else if (existing) {
			existing.remove();
		}
	}

	function entityStyleHTML(obj, style) {
		const shape = '<select data-style-key="shape">' +
			['rounded:圆角', 'rect:直角', 'pill:胶囊'].map(function (item) {
				const parts = item.split(':');
				return '<option value="' + parts[0] + '"' + (style.shape === parts[0] ? ' selected' : '') + '>' + parts[1] + '</option>';
			}).join('') + '</select>';
		const autoWidth = style.width === 'auto';
		const widthValue = autoWidth ? '' : String(style.width);
		const minHeightValue = style.minHeight > 0 ? String(style.minHeight) : '';
		const widthControl = '<input type="number" data-style-key="width" min="' + M.MIN_ENTITY_WIDTH +
			'" step="10" value="' + esc(widthValue) + '" placeholder="按文字">' +
			'<button class="btn small' + (autoWidth ? ' active' : '') + '" data-action="fit-width" ' +
			'title="按当前文字自动定宽（最小 40，最大 480）">' + (autoWidth ? '✓ 按文字' : '按文字') + '</button>';
		return styleRowHTML(obj, 'shape', '形状', shape) +
			styleRowHTML(obj, 'fill', '填充', '<input type="color" data-style-key="fill" value="' + esc(style.fill) + '">') +
			styleRowHTML(obj, 'border', '边框', '<input type="color" data-style-key="border" value="' + esc(style.border) + '">') +
			styleRowHTML(obj, 'text', '文字', '<input type="color" data-style-key="text" value="' + esc(style.text) + '">') +
			styleRowHTML(obj, 'width', '宽', widthControl) +
			styleRowHTML(obj, 'minHeight', '最小高度',
				'<input type="number" data-style-key="minHeight" min="0" step="10" value="' + esc(minHeightValue) + '" placeholder="自动">');
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

	function groupPanelHTML() {
		const total = app.selectedIds.size;
		const placed = selectedPlacedRects().length;
		const alignDisabled = placed < 2 ? ' disabled' : '';
		const distDisabled = placed < 3 ? ' disabled' : '';
		const alignBtn = function (mode, text) {
			return '<button class="btn small" data-action="align" data-align="' + mode + '"' + alignDisabled + '>' + text + '</button>';
		};
		const distBtn = function (axis, text, title) {
			return '<button class="btn small" data-action="distribute" data-axis="' + axis + '" title="' + title + '"' + distDisabled + '>' + text + '</button>';
		};
		let html = '<h3>组选择</h3>';
		html += '<p class="rg-muted">已选 ' + total + ' 个实体（' + placed + ' 个在画布）</p>';
		html += '<p class="rg-muted">对齐（仅画布中的实体）</p><div class="rg-actions">' +
			alignBtn('left', '左') + alignBtn('centerX', '中') + alignBtn('right', '右') +
			alignBtn('top', '上') + alignBtn('centerY', '中') + alignBtn('bottom', '下') +
			'</div>';
		html += '<p class="rg-muted">分布</p><div class="rg-actions">' +
			distBtn('x', '水平等距', '相邻卡片之间的空隙相等；只改左右位置') +
			distBtn('y', '垂直等距', '只改上下位置') + '</div>';
		html += '<p class="rg-muted">等距 = 相邻卡片之间的空隙相等；排成一行请先用上/中/下的「中」对齐，再水平等距。</p>';
		html += '<div class="rg-actions">' +
			'<button class="btn danger" data-action="delete-selection">删除所选</button>' +
			'<button class="btn" data-action="clear-selection">取消选择</button>' +
			'</div>';
		return html;
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
		flushInspectorNumber();
		const el = els.inspector;
		if (app.selectedIds.size > 1) {
			el.innerHTML = groupPanelHTML();
			return;
		}
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
		if (isEntity && children.length) {
			html += '<p class="rg-muted">尺寸会沿原型链传给子对象；子对象可单独覆盖。</p>';
		}
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

	// 宽 / 最小高度实时写入模型：空值或 0 清空覆盖，避免输入后未失焦就丢值
	function applyEntitySizeInput(obj, key, raw) {
		if (key !== 'width' && key !== 'minHeight') return;
		if (M.kindOf(obj) !== 'entity') return;
		const text = String(raw == null ? '' : raw).trim();
		const num = text === '' ? NaN : Number(text);
		if (key === 'width') {
			if (!Number.isFinite(num) || num <= 0) {
				// 清空 = 恢复继承；解析结果可能是 'auto'、祖先数字或默认 168
				M.clearStyleKey(obj, 'width');
			} else {
				// 输入数字 = 覆盖当前节点的 auto 规则
				M.setStyleKey(obj, 'width', Math.max(M.MIN_ENTITY_WIDTH, num));
			}
			app.view.setEntityWidth(obj.id, M.resolveStyle(app.doc, obj).width);
			// 继承宽度的子对象画布上也要立刻跟上（auto 的重新测量，数字的直接取新值）
			M.getDescendantIds(app.doc, obj).forEach(function (id) {
				const child = M.findEntity(app.doc, id);
				if (!child || !child.position) return;
				app.view.setEntityWidth(id, M.resolveStyle(app.doc, child).width);
			});
			return;
		}
		if (!Number.isFinite(num) || num <= 0) {
			M.clearStyleKey(obj, 'minHeight');
		} else {
			M.setStyleKey(obj, 'minHeight', num);
		}
		app.view.resizeCardTo(obj.id, { minHeight: M.resolveStyle(app.doc, obj).minHeight });
	}

	// ---- 适应内容 ----
	// 宽度的自动测量在 canvas-view.js（卡片进 DOM 后按自身字体测量），这里只写规则

	function fitEntityWidth(obj) {
		if (!obj || M.kindOf(obj) !== 'entity') return;
		flushInspectorName();
		// 写入的是规则而不是测量值：子对象继承 'auto' 后按自己的名字测量
		M.setStyleKey(obj, 'width', 'auto');
		pushHistory();
		renderAll();
	}

	app.view = new CV.CanvasView(els.canvas, {
		onCanvasPointerDown: function (e) {
			if (e.button !== 0) {
				clearSelection();
				renderSelection();
				return;
			}
			if (e.shiftKey) {
				startMarquee(e);
				return;
			}
			if (app.selectedId || app.selectedIds.size) {
				clearSelection();
				renderSelection();
			}
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
		},
		onResizePointerDown: function (id, corner, e) {
			startResize(id, corner, e);
		}
	});

	els.tree.addEventListener('click', function (e) {
		const action = e.target.closest('[data-action]');
		if (action) {
			const row = action.closest('.rg-tree-row');
			const id = row && row.dataset.id;
			if (action.dataset.action === 'toggle') {
				// 搜索结果里祖先强制展开；此时折叠操作不改变 collapsed
				if (app.treeQuery.trim()) return;
				toggleCollapse(id);
				return;
			}
			if (action.dataset.action === 'add-root') { addRoot(action.dataset.kind); return; }
			if (action.dataset.action === 'add-child') { addChild(id); return; }
			if (action.dataset.action === 'menu') { openRowMenu(action, id); return; }
		}
		const row = e.target.closest('.rg-tree-row');
		if (!row) return;
		if (row.dataset.kind === 'relation') {
			const id = row.dataset.id;
			if (app.armedId === id) {
				app.armedId = null;
				selectRelation(id);
				renderAll();
				notify('info', '已取消下一条线使用的关系；下次拖线会先选择关系类型');
			} else {
				app.armedId = id;
				select(id);
			}
			return;
		}
		if (e.shiftKey) {
			toggleEntitySelection(row.dataset.id);
			renderAll();
		} else {
			select(row.dataset.id);
		}
	});

	els.tree.addEventListener('pointerdown', function (e) {
		const row = e.target.closest('.rg-tree-row');
		if (!row || e.button !== 0) return;
		if (e.target.closest('[data-action]')) return;
		if (e.shiftKey) return;
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

	if (els.treeSearch) {
		els.treeSearch.addEventListener('input', function () {
			app.treeQuery = els.treeSearch.value;
			renderTree();
		});
		els.treeSearch.addEventListener('keydown', function (e) {
			if (e.key !== 'Escape') return;
			e.stopPropagation();
			if (!els.treeSearch.value) return;
			els.treeSearch.value = '';
			app.treeQuery = '';
			renderTree();
		});
	}

	els.inspector.addEventListener('input', function (e) {
		const styleKey = e.target.dataset.styleKey;
		if (styleKey === 'width' || styleKey === 'minHeight') {
			const obj = app.selectedId ? M.findObject(app.doc, app.selectedId) : null;
			if (!obj) return;
			applyEntitySizeInput(obj, styleKey, e.target.value);
			// 宽度规则（auto 与否）随输入即时反映到按钮/来源，但不重建输入框
			if (styleKey === 'width') refreshStyleRow(obj, 'width');
			app.inspectorNumberDirty = true;
			app.hasEdited = true;
			scheduleSave();
			return;
		}
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
			if (styleKey === 'width' || styleKey === 'minHeight') {
				// input 事件已实时写入模型；change 只提交历史并就地刷新来源/↺。
				// 不重建 inspector，避免转移焦点到另一个数值框时第一次点击被吞。
				if (!app.inspectorNumberDirty) return;
				app.inspectorNumberDirty = false;
				pushHistory();
				refreshStyleRow(obj, styleKey);
				scheduleSave();
				return;
			}
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
		const action = e.target.closest('[data-action]');
		if (action && app.selectedIds.size > 1) {
			const name = action.dataset.action;
			if (name === 'align') { alignSelected(action.dataset.align); return; }
			if (name === 'distribute') { distributeSelected(action.dataset.axis); return; }
			if (name === 'delete-selection') { deleteSelected(); return; }
			if (name === 'clear-selection') { clearSelection(); renderAll(); return; }
		}
		const reset = e.target.closest('[data-reset-style]');
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
		} else if (name === 'fit-width') {
			fitEntityWidth(obj);
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
		} else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
			e.preventDefault();
			selectAllPlaced();
			renderSelection();
		} else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
			if (copySelection()) e.preventDefault();
		} else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
			if (pasteClipboard()) e.preventDefault();
		} else if (e.key === 'Delete' || e.key === 'Backspace') {
			e.preventDefault();
			deleteSelected();
		} else if (e.key === 'Escape') {
			closeMenu();
			cancelActiveDrag();
			app.armedId = null;
			clearSelection();
			renderAll();
		} else if (!e.ctrlKey && !e.metaKey && !e.altKey &&
			(e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
			const step = e.shiftKey ? 10 : 1;
			let dx = 0;
			let dy = 0;
			if (e.key === 'ArrowLeft') dx = -step;
			else if (e.key === 'ArrowRight') dx = step;
			else if (e.key === 'ArrowUp') dy = -step;
			else dy = step;
			if (nudgeSelected(dx, dy)) e.preventDefault();
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
		clearSelection();
		app.armedId = null;
		app.view.setViewport(app.doc.viewport);
		updateZoomDisplay();
		pushHistory();
		renderAll();
		scheduleSave();
	}

	function renderTemplateList() {
		const templates = (window.RGTemplates && window.RGTemplates.list) || [];
		const items = templates.concat([{
			id: '', name: '空白图', desc: '从零开始，自己建实体与关系', icon: '✏️', tone: '#9aa3b2', blank: true
		}]);
		els.templateList.innerHTML = items.map(function (tpl) {
			return '<button type="button" class="rg-template-card' + (tpl.blank ? ' blank' : '') + '"' +
				' data-template="' + esc(tpl.id) + '" style="--rg-tone:' + esc(tpl.tone || '#9aa3b2') + '">' +
				'<span class="rg-template-icon">' + esc(tpl.icon || '📄') + '</span>' +
				'<span class="rg-template-body"><strong>' + esc(tpl.name) + '</strong>' +
				'<span>' + esc(tpl.desc) + '</span></span>' +
				'<span class="rg-template-go">→</span>' +
				'</button>';
		}).join('');
	}

	function applyTemplate(id) {
		const templates = (window.RGTemplates && window.RGTemplates.list) || [];
		const tpl = templates.find(function (item) { return item.id === id; });
		if (!tpl) return;
		if (!confirmReplace('使用模板「' + tpl.name + '」')) return;
		app.doc = tpl.build();
		clearSelection();
		app.armedId = null;
		app.view.setViewport(app.doc.viewport);
		updateZoomDisplay();
		pushHistory();
		renderAll();
		fitContent();
		notify('info', '已加载模板「' + tpl.name + '」，可直接改名字使用');
	}

	function importDocument(parsed) {
		const result = M.validateDocument(parsed);
		if (!result.ok) {
			notify('error', '导入失败：' + result.error);
			return;
		}
		if (!confirmReplace('导入')) return;
		app.doc = result.doc;
		clearSelection();
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

	els.newBtn.addEventListener('click', function () {
		renderTemplateList();
		els.templateDialog.showModal();
	});

	els.templateList.addEventListener('click', function (e) {
		const card = e.target.closest('[data-template]');
		if (!card) return;
		const id = card.dataset.template;
		els.templateDialog.close();
		if (id) applyTemplate(id);
		else newDocument();
	});
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
		renderSelection: renderSelection,
		undo: undo,
		redo: redo,
		clearSelection: clearSelection,
		selectAllPlaced: selectAllPlaced,
		alignSelected: alignSelected,
		distributeSelected: distributeSelected,
		fitEntityWidth: fitEntityWidth,
		deleteSelected: deleteSelected,
		nudgeSelected: nudgeSelected
	};
})();

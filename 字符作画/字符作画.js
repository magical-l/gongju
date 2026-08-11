
    // ---------- 符号库数据 ----------
    const normalGroups = {
        "🔣 装饰 & 符号": ["★", "☆", "☀", "☁", "⚡", "☾", "✿", "❀", "〰️", "➰", "✂️", "⚙️", "🌀", "◉", "◎", "▧", "▣", "▪️", "▫️", "☯", "♻️", "⚜️", "♩", "♪", "♫"],
        "⬆️ 箭头 & 标点": ["⬆️", "⬇️", "⬅️", "➡️", "↗️", "↘️", "↙️", "↖️", "❌", "✔️", "❗", "❓", "‼️", "⁉️"]
    };
    const emojiGroups = {
        "👥 人物角色": ["👩", "👨", "🧑", "👧", "👦", "👵", "👴", "👸", "🤴", "🧙", "🧚", "🧛", "🎅", "🤶", "💁", "🙋", "💂", "🕵️", "👩‍🌾", "👨‍🍳", "👩‍🎨", "🧑‍🚀"],
        "🐾 动物伙伴": ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐒", "🐔", "🐧", "🐦", "🐴", "🐺", "🦋", "🐌", "🐞", "🐝", "🐑", "🐄", "🦆"],
        "🌻 花草自然": ["🌸", "🌼", "🌻", "🌺", "🌹", "🥀", "🌿", "🍀", "🍃", "🍂", "🍁", "🌲", "🌳", "🌴", "🍎", "🍓", "🍊", "🥕", "🌽", "🍄"],
        "🏠 建筑物品": ["🏠", "🏡", "🏢", "🏘️", "🏰", "🗼", "🚗", "🚜", "🚲", "🚛", "✈️", "⛵", "🚀", "🛸", "⌛", "⏳", "⚓", "🔔", "📷", "💡", "🔑", "🧺", "🪣", "🧹", "🚪"]
    };

    let currentSelected = null;
    const selectedSet = new Set();
    let suppressClickSelect = false;
    let sceneTransform = { x: 0, y: 0 };
    let zoom = 1;
    const MIN_ZOOM = 0.5, MAX_ZOOM = 2.5, ZOOM_STEP = 0.1;
    let nextZIndex = 300;
    let isPanning = false;
    let panStart = { x: 0, y: 0 };
    let panStartTransform = { x: 0, y: 0 };
    const canvasElement = document.getElementById('sceneCanvas');
    const container = document.getElementById('canvasContainer');
    let canvasWidth = 800, canvasHeight = 600;

    // 历史记录
    let historyStack = [];
    let historyIndex = -1;
    const MAX_HISTORY = 50;

    function captureSnapshot() {
        const items = document.querySelectorAll('#sceneCanvas .scene-item');
        const elements = [];
        items.forEach(el => {
            elements.push({
                char: el.getAttribute('data-char'),
                repeat: parseInt(el.getAttribute('data-repeat')),
                fontSize: parseInt(el.getAttribute('data-fontsize')),
                left: el.style.left,
                top: el.style.top,
                zIndex: el.style.zIndex,
                color: el.style.color || null,
                rotation: parseFloat(el.getAttribute('data-rotation')) || 0,
                opacity: Number.isFinite(parseFloat(el.getAttribute('data-opacity'))) ? parseFloat(el.getAttribute('data-opacity')) : 1
            });
        });
        const bgGradient = canvasElement.style.background;
        return { bg: bgGradient, elements, transform: { x: sceneTransform.x, y: sceneTransform.y }, width: canvasWidth, height: canvasHeight };
    }

    function applySnapshot(snapshot) {
        while (canvasElement.firstChild) canvasElement.removeChild(canvasElement.firstChild);
        canvasElement.style.background = snapshot.bg;
        canvasWidth = snapshot.width;
        canvasHeight = snapshot.height;
        canvasElement.style.width = canvasWidth + 'px';
        canvasElement.style.height = canvasHeight + 'px';
        sceneTransform = { x: snapshot.transform.x, y: snapshot.transform.y };
        applyViewTransform();
        clampTransform();
        snapshot.elements.forEach(e => {
            const div = createCharacterDiv(e.char, e.fontSize, e.repeat, e.color, parseInt(e.zIndex), e.left, e.top);
            if (e.color && !isEmojiCharacter(e.char)) div.style.color = e.color;
            if (e.rotation) { div.style.transform = `rotate(${e.rotation}deg)`; div.setAttribute('data-rotation', e.rotation); }
            if (e.opacity != null && e.opacity !== 1) { div.style.opacity = e.opacity; div.setAttribute('data-opacity', e.opacity); }
            canvasElement.appendChild(div);
        });
        selectElement(null);
        refreshLayers();
    }

    function pushHistory() {
        const snapshot = captureSnapshot();
        if (historyIndex < historyStack.length - 1) {
            historyStack = historyStack.slice(0, historyIndex + 1);
        }
        historyStack.push(snapshot);
        if (historyStack.length > MAX_HISTORY) historyStack.shift();
        historyIndex = historyStack.length - 1;
        updateUndoRedoButtons();
    }

    function undo() {
        if (historyIndex > 0) {
            historyIndex--;
            applySnapshot(historyStack[historyIndex]);
            updateUndoRedoButtons();
        }
    }

    function redo() {
        if (historyIndex < historyStack.length - 1) {
            historyIndex++;
            applySnapshot(historyStack[historyIndex]);
            updateUndoRedoButtons();
        }
    }

    function updateUndoRedoButtons() {
        const undoBtn = document.getElementById('undoBtn');
        const redoBtn = document.getElementById('redoBtn');
        if (undoBtn) undoBtn.disabled = (historyIndex <= 0);
        if (redoBtn) redoBtn.disabled = (historyIndex >= historyStack.length - 1);
    }

    function isEmojiCharacter(charStr) {
        if (!charStr) return false;
        const code = charStr.codePointAt(0);
        if (!code) return false;
        if (code >= 0x1F300 && code <= 0x1F6FF) return true;
        if (code >= 0x1F900 && code <= 0x1F9FF) return true;
        if (code >= 0x2600 && code <= 0x26FF && /[\p{Emoji}]/u.test(charStr)) return true;
        return /[\p{Emoji_Presentation}]/u.test(charStr);
    }
    function getNewZIndex() { return nextZIndex++; }

    function createCharacterDiv(character, fontSize = 46, repeat = 1, color = null, customZ = null, left = '80px', top = '80px') {
        const div = document.createElement('div');
        div.className = 'scene-item';
        div.innerText = character.repeat(repeat);
        div.setAttribute('data-char', character);
        div.setAttribute('data-repeat', repeat);
        div.setAttribute('data-fontsize', fontSize);
        div.style.fontSize = fontSize + 'px';
        div.style.left = left;
        div.style.top = top;
        div.style.position = 'absolute';
        const finalZ = customZ !== null ? customZ : getNewZIndex();
        div.style.zIndex = finalZ;
        div.setAttribute('data-zindex', finalZ);
        div.style.opacity = 1;
        div.setAttribute('data-opacity', 1);
        div.setAttribute('data-rotation', 0);
        const isEmoji = isEmojiCharacter(character);
        if (!isEmoji && color) {
            div.style.color = color;
            div.setAttribute('data-color', color);
        } else {
            div.style.color = '';
        }
        makeDraggable(div);
        div.addEventListener('click', (e) => {
            e.stopPropagation();
            if (suppressClickSelect) { suppressClickSelect = false; return; }
            selectElement(div, { additive: e.ctrlKey || e.metaKey });
        });
        return div;
    }

    function makeDraggable(element) {
        let startX = 0, startY = 0, startLeft = 0, startTop = 0, dragging = false;
        let moved = false;
        let multiStarts = null;
        let multiDragActive = false;
        element.addEventListener('mousedown', (e) => {
            suppressClickSelect = false;
            if (e.target === element || element.contains(e.target)) {
                if (e.target.classList && e.target.classList.contains('resize-handle')) return;
                e.preventDefault();
                e.stopPropagation();
                startX = e.clientX;
                startY = e.clientY;
                startLeft = parseInt(element.style.left);
                startTop = parseInt(element.style.top);
                if (selectedSet.has(element) && selectedSet.size > 1) {
                    multiStarts = [...selectedSet].map(sel => ({
                        el: sel,
                        left: parseInt(sel.style.left),
                        top: parseInt(sel.style.top)
                    }));
                    multiDragActive = true;
                } else {
                    multiStarts = null;
                    multiDragActive = false;
                }
                dragging = true;
                moved = false;
                window.addEventListener('mousemove', onMouseMove);
                window.addEventListener('mouseup', onMouseUp);
            }
        });
        function onMouseMove(e) {
            if (!dragging) return;
            moved = true;
            let dx = e.clientX - startX;
            let dy = e.clientY - startY;
            if (multiStarts) {
                multiStarts.forEach(({ el, left, top }) => {
                    el.style.left = (left + dx) + 'px';
                    el.style.top = (top + dy) + 'px';
                });
            } else {
                element.style.left = (startLeft + dx) + 'px';
                element.style.top = (startTop + dy) + 'px';
            }
            if (currentSelected === element) {
                document.querySelectorAll('.resize-handle').forEach(h => updateHandlePosition(h, element));
            }
        }
        function onMouseUp() {
            if (dragging && moved) { pushHistory(); if (multiDragActive) suppressClickSelect = true; }
            dragging = false;
            multiDragActive = false;
            multiStarts = null;
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        }
    }

    // 缩放控制
    function showResizeHandles(element) {
        hideResizeHandles();
        const positions = ['tl', 'tr', 'bl', 'br'];
        positions.forEach(pos => {
            const handle = document.createElement('div');
            handle.className = `resize-handle ${pos}`;
            handle.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                startResize(element, pos, e);
            });
            canvasElement.appendChild(handle);
            updateHandlePosition(handle, element);
        });
    }
    function updateHandlePosition(handle, element) {
        const rect = element.getBoundingClientRect();
        const canvasRect = canvasElement.getBoundingClientRect();
        const leftRel = rect.left - canvasRect.left;
        const topRel = rect.top - canvasRect.top;
        if (handle.classList.contains('tl')) { handle.style.left = leftRel - 6 + 'px'; handle.style.top = topRel - 6 + 'px'; }
        else if (handle.classList.contains('tr')) { handle.style.left = leftRel + rect.width - 6 + 'px'; handle.style.top = topRel - 6 + 'px'; }
        else if (handle.classList.contains('bl')) { handle.style.left = leftRel - 6 + 'px'; handle.style.top = topRel + rect.height - 6 + 'px'; }
        else if (handle.classList.contains('br')) { handle.style.left = leftRel + rect.width - 6 + 'px'; handle.style.top = topRel + rect.height - 6 + 'px'; }
    }
    function hideResizeHandles() {
        document.querySelectorAll('.resize-handle').forEach(h => h.remove());
    }
    function startResize(element, position, e) {
        e.preventDefault();
        const startFontSize = parseInt(element.style.fontSize) || parseInt(element.getAttribute('data-fontsize')) || 40;
        const startX = e.clientX;
        const startY = e.clientY;
        let resizing = true;
        function onMouseMove(moveEv) {
            if (!resizing) return;
            let deltaX = (moveEv.clientX - startX) * 0.6;
            let deltaY = (moveEv.clientY - startY) * 0.6;
            let delta = (position === 'br' || position === 'tr') ? deltaX : -deltaX;
            if (position === 'bl' || position === 'br') delta = (deltaX + deltaY) / 2;
            else delta = (deltaX - deltaY) / 2;
            let newSize = Math.max(12, Math.round(startFontSize + delta));
            element.style.fontSize = newSize + 'px';
            element.setAttribute('data-fontsize', newSize);
            if (currentSelected === element) {
                const preview = document.getElementById('previewChar');
                if (preview) preview.style.fontSize = Math.min(80, newSize) + 'px';
                const sizeSlider = document.getElementById('sizeSlider');
                if (sizeSlider) sizeSlider.value = newSize;
                document.getElementById('sizeValueDisplay').innerText = newSize;
            }
            document.querySelectorAll('.resize-handle').forEach(h => updateHandlePosition(h, element));
        }
        function onMouseUp() {
            if (resizing) pushHistory();
            resizing = false;
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            if (currentSelected !== element) selectElement(element);
            else {
                hideResizeHandles();
                if (currentSelected) showResizeHandles(currentSelected);
            }
        }
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    }

    function selectElement(el, opts = {}) {
        if (currentSelected) hideResizeHandles();
        if (!el) { selectedSet.clear(); currentSelected = null; }
        else if (opts.additive) {
            // Ctrl+点击：切换
            if (selectedSet.has(el)) selectedSet.delete(el);
            else selectedSet.add(el);
            currentSelected = selectedSet.size ? [...selectedSet][selectedSet.size - 1] : null;
        } else {
            selectedSet.clear(); selectedSet.add(el); currentSelected = el;
        }
        document.querySelectorAll('.scene-item').forEach(i => i.classList.toggle('selected', selectedSet.has(i)));
        // 面板
        const propsDiv = document.getElementById('propsPanel');
        const multiDiv = document.getElementById('multiSelectPanel');
        const selDiv = document.getElementById('selectionControls');
        if (currentSelected) {
            propsDiv.style.display = 'block';
            if (selectedSet.size > 1) {
                if (multiDiv) multiDiv.style.display = 'block';
                selDiv.style.display = 'none';
                if (multiDiv) multiDiv.querySelector('#multiCount').textContent = selectedSet.size;
            } else {
                if (multiDiv) multiDiv.style.display = 'none';
                selDiv.style.display = 'block';
                showResizeHandles(currentSelected);
                updatePropsPanelWithElement(currentSelected);
            }
        } else {
            propsDiv.style.display = 'none';
        }
        if (typeof refreshLayers === 'function') refreshLayers();
    }

    function refreshLayers() {
        const list = document.getElementById('layerList');
        if (!list) return;
        list.innerHTML = '';
        const items = [...document.querySelectorAll('#sceneCanvas .scene-item')]
            .sort((a, b) => (parseInt(b.style.zIndex) || 0) - (parseInt(a.style.zIndex) || 0));
        items.forEach((el, i) => {
            const row = document.createElement('div');
            row.className = 'layer-item' + (selectedSet.has(el) ? ' active' : '');
            const ch = el.getAttribute('data-char') || '?';
            row.innerHTML = `<span class="layer-char">${ch.slice(0,1)}</span>
            <span class="layer-name">元素 ${items.length - i}</span>
            <button class="layer-up" title="上移一层">↑</button>
            <button class="layer-down" title="下移一层">↓</button>
            <button class="layer-del" title="删除">🗑</button>`;
            row.addEventListener('click', (e) => {
                if (e.target.closest('button')) return;
                selectElement(el, { additive: e.ctrlKey || e.metaKey });
            });
            row.querySelector('.layer-up').addEventListener('click', (e) => { e.stopPropagation(); swapLayerZ(el, -1); });
            row.querySelector('.layer-down').addEventListener('click', (e) => { e.stopPropagation(); swapLayerZ(el, 1); });
            row.querySelector('.layer-del').addEventListener('click', (e) => { e.stopPropagation(); el.remove(); selectElement(null); pushHistory(); refreshLayers(); });
            list.appendChild(row);
        });
    }
    function swapLayerZ(el, dir) {
        const items = [...document.querySelectorAll('#sceneCanvas .scene-item')]
            .sort((a, b) => (parseInt(a.style.zIndex) || 0) - (parseInt(b.style.zIndex) || 0));
        const idx = items.indexOf(el);
        const other = items[idx + dir];
        if (!other) return;
        const t = el.style.zIndex; el.style.zIndex = other.style.zIndex; other.style.zIndex = t;
        el.setAttribute('data-zindex', el.style.zIndex);
        other.setAttribute('data-zindex', other.style.zIndex);
        pushHistory(); refreshLayers();
    }

    function updatePropsPanelWithElement(el) {
        const char = el.getAttribute('data-char');
        let repeat = parseInt(el.getAttribute('data-repeat') || 1);
        const fontSize = parseInt(el.getAttribute('data-fontsize') || 42);
        const isEmoji = isEmojiCharacter(char);
        const previewDiv = document.getElementById('previewChar');
        previewDiv.innerText = char;
        previewDiv.style.fontSize = Math.min(80, fontSize) + 'px';
        document.getElementById('copyCharBtn').onclick = () => { navigator.clipboard.writeText(char); toastr.success(`已复制: ${char}`); };
        const sizeSlider = document.getElementById('sizeSlider');
        const sizeVal = document.getElementById('sizeValueDisplay');
        sizeSlider.value = fontSize;
        sizeVal.innerText = fontSize;
        sizeSlider.oninput = (e) => {
            let val = Math.round(parseFloat(e.target.value));
            sizeVal.innerText = val;
            el.style.fontSize = val + 'px';
            el.setAttribute('data-fontsize', val);
            previewDiv.style.fontSize = Math.min(80, val) + 'px';
            if (currentSelected === el) showResizeHandles(el);
            pushHistory();
        };
        const repSlider = document.getElementById('repeatSlider');
        const repSpan = document.getElementById('repeatValueDisplay');
        repSlider.value = repeat;
        repSpan.innerText = repeat;
        repSlider.oninput = (e) => {
            const newRep = parseInt(e.target.value);
            repSpan.innerText = newRep;
            el.setAttribute('data-repeat', newRep);
            const originalChar = el.getAttribute('data-char');
            el.innerText = originalChar.repeat(newRep);
            previewDiv.innerText = originalChar;
            pushHistory();
        };
        const rot = parseFloat(el.getAttribute('data-rotation')) || 0;
        const rotSlider = document.getElementById('rotationSlider');
        const rotVal = document.getElementById('rotationValueDisplay');
        rotSlider.value = rot; rotVal.textContent = rot;
        rotSlider.oninput = (e) => {
            const v = parseInt(e.target.value);
            rotVal.textContent = v;
            el.setAttribute('data-rotation', v);
            el.style.transform = v ? `rotate(${v}deg)` : '';
            pushHistory();
        };
        const op = parseFloat(el.getAttribute('data-opacity')) || 1;
        const opSlider = document.getElementById('opacitySlider');
        const opVal = document.getElementById('opacityValueDisplay');
        opSlider.value = Math.round(op * 100); opVal.textContent = Math.round(op * 100) + '%';
        opSlider.oninput = (e) => {
            const v = parseInt(e.target.value) / 100;
            opVal.textContent = e.target.value + '%';
            el.setAttribute('data-opacity', v);
            el.style.opacity = v;
            pushHistory();
        };
        const colorArea = document.getElementById('colorControlArea');
        const colorPicker = document.getElementById('charColorPicker');
        if (!isEmoji) {
            colorArea.style.display = 'block';
            let currentColor = el.style.color || '#2c5a2c';
            if (currentColor === '') currentColor = '#2c5a2c';
            colorPicker.value = currentColor;
            colorPicker.oninput = (e) => {
                el.style.color = e.target.value;
                el.setAttribute('data-color', e.target.value);
                pushHistory();
            };
        } else {
            colorArea.style.display = 'none';
        }
        document.getElementById('deleteItemBtn').onclick = () => {
            if (currentSelected) {
                currentSelected.remove();
                selectElement(null);
                pushHistory();
                refreshLayers();
            }
        };
        document.getElementById('closePropsBtn').onclick = () => selectElement(null);
    }

    const ARROWS = { ArrowUp: [0,-1], ArrowDown: [0,1], ArrowLeft: [-1,0], ArrowRight: [1,0] };
    let arrowHistoryDirty = false;

    function moveSelectedBy(dx, dy) {
        const targets = getSelectionTargets();
        targets.forEach(t => {
            t.style.left = (parseInt(t.style.left) || 0) + dx + 'px';
            t.style.top = (parseInt(t.style.top) || 0) + dy + 'px';
        });
        if (currentSelected) {
            document.querySelectorAll('.resize-handle').forEach(h => updateHandlePosition(h, currentSelected));
        }
    }
    function getSelectionTargets() {
        if (selectedSet.size > 0) return [...selectedSet];
        return currentSelected ? [currentSelected] : [];
    }

    function handleBackspaceDelete(e) {
        if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
            e.preventDefault();
            if (e.shiftKey) redo(); else undo();
            return;
        }
        if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) {
            e.preventDefault();
            redo();
            return;
        }
        if (e.target && e.target.closest && e.target.closest('input, select, textarea, button, [contenteditable]')) return;
        if (ARROWS[e.key] && currentSelected) {
            e.preventDefault();
            const step = e.shiftKey ? 10 : 1;
            moveSelectedBy(ARROWS[e.key][0] * step, ARROWS[e.key][1] * step);
            arrowHistoryDirty = true;
            return;
        }
        if (!currentSelected) return;
        if (e.key === 'Backspace') {
            e.preventDefault();
            let repeat = parseInt(currentSelected.getAttribute('data-repeat') || 1);
            if (repeat > 1) {
                repeat--;
                currentSelected.setAttribute('data-repeat', repeat);
                const originalChar = currentSelected.getAttribute('data-char');
                currentSelected.innerText = originalChar.repeat(repeat);
                const repSlider = document.getElementById('repeatSlider');
                if (repSlider) repSlider.value = repeat;
                document.getElementById('repeatValueDisplay').innerText = repeat;
                pushHistory();
            } else {
                getSelectionTargets().forEach(t => t.remove());
                selectElement(null);
                pushHistory();
            }
        } else if (e.key === 'Delete') {
            e.preventDefault();
            getSelectionTargets().forEach(t => t.remove());
            selectElement(null);
            pushHistory();
        }
    }

    function addSymbolToCanvas(char, x, y, record = true) {
        let left = Math.min(Math.max(x, 10), canvasElement.clientWidth - 40);
        let top = Math.min(Math.max(y, 10), canvasElement.clientHeight - 40);
        const defaultSize = isEmojiCharacter(char) ? 52 : 44;
        const defaultColor = isEmojiCharacter(char) ? null : '#2b5a2b';
        const newDiv = createCharacterDiv(char, defaultSize, 1, defaultColor, null, left + 'px', top + 'px');
        canvasElement.appendChild(newDiv);
        selectElement(newDiv);
        refreshLayers();
        if (record) pushHistory();
        return newDiv;
    }

    function applyViewTransform() {
        canvasElement.style.transform = `translate(${sceneTransform.x}px, ${sceneTransform.y}px) scale(${zoom})`;
    }
    function setZoom(z) {
        zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(z * 10) / 10));
        clampTransform();
        applyViewTransform();
        updateZoomUI();
    }
    function updateZoomUI() {
        const d = document.getElementById('zoomDisplay');
        if (d) d.textContent = Math.round(zoom * 100) + '%';
        const o = document.getElementById('zoomOutBtn'), i = document.getElementById('zoomInBtn');
        if (o) o.disabled = zoom <= MIN_ZOOM;
        if (i) i.disabled = zoom >= MAX_ZOOM;
    }

    function clampTransform() {
        const containerRect = container.getBoundingClientRect();
        const canvasRect = canvasElement.getBoundingClientRect();
        const maxX = 0;
        const maxY = 0;
        const minX = Math.min(0, containerRect.width - canvasRect.width);
        const minY = Math.min(0, containerRect.height - canvasRect.height);
        let newX = sceneTransform.x;
        let newY = sceneTransform.y;
        if (newX > maxX) newX = maxX;
        if (newX < minX) newX = minX;
        if (newY > maxY) newY = maxY;
        if (newY < minY) newY = minY;
        if (newX !== sceneTransform.x || newY !== sceneTransform.y) {
            sceneTransform.x = newX;
            sceneTransform.y = newY;
            applyViewTransform();
        }
    }

    function initCanvasPan() {
        container.addEventListener('mousedown', (e) => {
            if (e.target === container || e.target === canvasElement || e.target.classList.contains('canvas-container')) {
                isPanning = true;
                panStart.x = e.clientX;
                panStart.y = e.clientY;
                panStartTransform.x = sceneTransform.x;
                panStartTransform.y = sceneTransform.y;
                container.style.cursor = 'grabbing';
                e.preventDefault();
            }
        });
        window.addEventListener('mousemove', (e) => {
            if (!isPanning) return;
            const dx = e.clientX - panStart.x;
            const dy = e.clientY - panStart.y;
            sceneTransform.x = panStartTransform.x + dx;
            sceneTransform.y = panStartTransform.y + dy;
            clampTransform();
            applyViewTransform();
        });
        window.addEventListener('mouseup', () => {
            if (isPanning) pushHistory();
            isPanning = false;
            container.style.cursor = 'grab';
        });
    }

    function buildGroupedSymbols(containerId, groups) {
        const containerElem = document.getElementById(containerId);
        containerElem.innerHTML = '';
        for (const [groupName, symbols] of Object.entries(groups)) {
            const groupDiv = document.createElement('div');
            groupDiv.className = 'symbol-group';
            const header = document.createElement('div');
            header.className = 'group-header';
            header.innerHTML = `<span>${groupName}</span><span class="toggle-icon">▼</span>`;
            const content = document.createElement('div');
            content.className = 'group-content';
            symbols.forEach(sym => {
                const card = document.createElement('div');
                card.className = 'symbol-card';
                card.setAttribute('draggable', 'true');
                card.innerHTML = `<span>${sym}</span><span class="symbol-label"></span>`;
                card.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('text/plain', sym);
                    e.dataTransfer.effectAllowed = 'copy';
                });
                content.appendChild(card);
            });
            groupDiv.appendChild(header);
            groupDiv.appendChild(content);
            header.addEventListener('click', () => {
                const isCollapsed = content.classList.contains('collapsed');
                if (isCollapsed) {
                    content.classList.remove('collapsed');
                    header.querySelector('.toggle-icon').innerHTML = '▼';
                } else {
                    content.classList.add('collapsed');
                    header.querySelector('.toggle-icon').innerHTML = '▶';
                }
            });
            containerElem.appendChild(groupDiv);
        }
    }

    function initTabs() {
        const normalContainer = document.getElementById('normalSymbolsContainer');
        const emojiContainer = document.getElementById('emojiSymbolsContainer');
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const tab = btn.getAttribute('data-tab');
                if (tab === 'normal') {
                    normalContainer.style.display = 'block';
                    emojiContainer.style.display = 'none';
                } else {
                    normalContainer.style.display = 'none';
                    emojiContainer.style.display = 'block';
                }
            });
        });
    }

    function initDrop() {
        canvasElement.addEventListener('dragover', (e) => e.preventDefault());
        canvasElement.addEventListener('drop', (e) => {
            e.preventDefault();
            const char = e.dataTransfer.getData('text/plain');
            if (char) {
                const r = canvasElement.getBoundingClientRect();
                addSymbolToCanvas(char, (e.clientX - r.left) / zoom, (e.clientY - r.top) / zoom, true);
            }
        });
    }

    function initPaste() {
        window.addEventListener('paste', async (e) => {
            e.preventDefault();
            const text = (e.clipboardData || window.clipboardData).getData('text');
            if (!text) return;
            if (text.length > 1) {
                const ok = confirm(`剪贴板内容包含 ${text.length} 个字符。是否只取第一个字符“${text[0]}”添加到画布？`);
                if (!ok) return;
                addSymbolToCanvas(text[0], canvasWidth / 2, canvasHeight / 2, true);
            } else {
                addSymbolToCanvas(text, canvasWidth / 2, canvasHeight / 2, true);
            }
        });
    }

    function showCanvasSettings() {
        const dialog = document.createElement('div');
        dialog.className = 'modal';
        let currentGrad = canvasElement.style.background;
        let dir = '145deg';
        let col1 = '#b2e0fa', col2 = '#c5e0a4';
        if (currentGrad && currentGrad.includes('linear-gradient')) {
            const match = currentGrad.match(/linear-gradient\(([^,]+),([^,]+),([^,]+)\)/);
            if (match) {
                dir = match[1].trim();
                col1 = match[2].trim();
                col2 = match[3].trim();
            }
        }
        dialog.innerHTML = `
            <div class="body" id="canvasSettingsBody">
                <h3>🖌️ 画布设置</h3>
                <div class="gradient-preview" id="gradientPreview" style="background: ${currentGrad};"></div>
                <div class="gradient-controls">
                    <select id="gradientDir">
                        <option value="to top">⬆️ 向上 (to top)</option>
                        <option value="to right">➡️ 向右 (to right)</option>
                        <option value="to bottom">⬇️ 向下 (to bottom)</option>
                        <option value="to left">⬅️ 向左 (to left)</option>
                        <option value="135deg">↗️ 对角线 (135deg)</option>
                        <option value="120deg">↗️ 对角 (120deg)</option>
                        <option value="145deg" selected>🌅 天空草地 (145deg)</option>
                    </select>
                </div>
                <div class="gradient-controls">
                    <input type="color" id="gradColor1" value="${col1}">
                    <span>→</span>
                    <input type="color" id="gradColor2" value="${col2}">
                </div>
                <div class="preset-gradients">
                    <button class="preset-btn" data-dir="145deg" data-c1="#b2e0fa" data-c2="#c5e0a4">🌤️ 天空草地</button>
                    <button class="preset-btn" data-dir="135deg" data-c1="#f5f7fa" data-c2="#c3cfe2">☁️ 淡灰</button>
                    <button class="preset-btn" data-dir="120deg" data-c1="#f6d365" data-c2="#fda085">🌅 日落</button>
                    <button class="preset-btn" data-dir="to bottom" data-c1="#a1c4fd" data-c2="#c2e9fb">💙 天空蓝</button>
                    <button class="preset-btn" data-dir="to right" data-c1="#d4fc79" data-c2="#96e6a1">🍃 青草</button>
                </div>
                <label>宽度 (px)</label>
                <input type="number" id="canvasWidthInput" value="${canvasWidth}" step="50">
                <label>高度 (px)</label>
                <input type="number" id="canvasHeightInput" value="${canvasHeight}" step="50">
                <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 16px;">
                    <button id="dialogCancel">取消</button>
                    <button id="dialogConfirm">应用</button>
                </div>
            </div>
        `;
        document.body.appendChild(dialog);
        const confirmBtn = dialog.querySelector('#dialogConfirm');
        const cancelBtn = dialog.querySelector('#dialogCancel');
        const widthInput = dialog.querySelector('#canvasWidthInput');
        const heightInput = dialog.querySelector('#canvasHeightInput');
        const dirSelect = dialog.querySelector('#gradientDir');
        const color1 = dialog.querySelector('#gradColor1');
        const color2 = dialog.querySelector('#gradColor2');
        const previewDiv = dialog.querySelector('#gradientPreview');
        function updatePreview() {
            const grad = `linear-gradient(${dirSelect.value}, ${color1.value}, ${color2.value})`;
            previewDiv.style.background = grad;
        }
        dirSelect.addEventListener('input', updatePreview);
        color1.addEventListener('input', updatePreview);
        color2.addEventListener('input', updatePreview);
        dialog.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                dirSelect.value = btn.getAttribute('data-dir');
                color1.value = btn.getAttribute('data-c1');
                color2.value = btn.getAttribute('data-c2');
                updatePreview();
            });
        });
        updatePreview();
        const applySettings = () => {
            let newW = parseInt(widthInput.value) || 800;
            let newH = parseInt(heightInput.value) || 600;
            if (newW < 400) newW = 400;
            if (newH < 300) newH = 300;
            canvasWidth = newW;
            canvasHeight = newH;
            canvasElement.style.width = canvasWidth + 'px';
            canvasElement.style.height = canvasHeight + 'px';
            const newGrad = `linear-gradient(${dirSelect.value}, ${color1.value}, ${color2.value})`;
            canvasElement.style.background = newGrad;
            clampTransform();
            pushHistory();
            dialog.remove();
        };
        confirmBtn.onclick = applySettings;
        cancelBtn.onclick = () => dialog.remove();
    }

    function showHelp() {
        const dialog = document.createElement('div');
        dialog.className = 'modal';
        dialog.innerHTML = `
            <div class="body help-card">
                <h3>📖 使用帮助</h3>
                <ul>
                    <li>🖱️ 拖拽符号库中的字符到画布上添加</li>
                    <li>✨ 单击字符选中，拖动可移动位置</li>
                    <li>🔍 四角控制点拖拽缩放字符（字号）</li>
                    <li>⌨️ 选中后按 <kbd>Delete</kbd> 删除整个字符</li>
                    <li>⌨️ 选中后按 <kbd>Backspace</kbd> 减少重复次数（重复>1时）或删除</li>
                    <li>📋 <kbd>Ctrl+V</kbd> 粘贴剪贴板字符（仅第一个）</li>
                    <li>🎨 Emoji 表情不可染色，普通符号可自定义颜色</li>
                    <li>🖼️ 画布背景支持渐变色，可在「画布」中调整</li>
                    <li>📂 可保存/打开场景（本地存储）</li>
                    <li>↩️↪️ 支持撤销/重做 (Ctrl+Z / Ctrl+Y)</li>
                    <li>✨ 「新建」重置为空画布，「清空」仅清除字符</li>
                </ul>
                <div style="text-align:center; margin-top:16px;"><button id="closeHelpBtn">关闭</button></div>
            </div>
        `;
        document.body.appendChild(dialog);
        dialog.querySelector('#closeHelpBtn').onclick = () => dialog.remove();
    }

    function saveScene() {
        const data = captureSnapshot();
        localStorage.setItem('char_scene_data', JSON.stringify(data));
        toastr.success('场景已保存');
    }
    function loadScene() {
        const raw = localStorage.getItem('char_scene_data');
        if (!raw) { toastr.warning('无保存数据'); return; }
        const data = JSON.parse(raw);
        applySnapshot(data);
        pushHistory();
        toastr.success('加载完成');
    }
    function newScene() {
        if (confirm('新建将清除当前所有内容，是否继续？')) {
            while (canvasElement.firstChild) canvasElement.removeChild(canvasElement.firstChild);
            canvasElement.style.background = 'linear-gradient(145deg, #b2e0fa, #c5e0a4)';
            sceneTransform = { x: 0, y: 0 };
            zoom = 1;
            applyViewTransform();
            updateZoomUI();
            canvasWidth = 800;
            canvasHeight = 600;
            canvasElement.style.width = canvasWidth + 'px';
            canvasElement.style.height = canvasHeight + 'px';
            selectElement(null);
            pushHistory();
            refreshLayers();
        }
    }
    function clearCanvas() {
        while(canvasElement.firstChild) canvasElement.removeChild(canvasElement.firstChild);
        selectElement(null);
        pushHistory();
        refreshLayers();
    }

    function addDemoElements() {
        addSymbolToCanvas('🌞', 80, 70, false);
        addSymbolToCanvas('🌳', 180, 180, false);
        addSymbolToCanvas('🏡', 380, 300, false);
        addSymbolToCanvas('👩‍🌾', 520, 380, false);
        addSymbolToCanvas('🐕', 580, 440, false);
        addSymbolToCanvas('🍎', 240, 150, false);
        addSymbolToCanvas('〰️', 280, 520, false);
        pushHistory();
    }

    function initPanelFloating() {
        const panel = document.getElementById('rightPanel');
        const reopenBtn = document.getElementById('reopenPanelBtn');
        if (!panel || !reopenBtn) return;
        // 拖标题栏移动面板
        document.querySelectorAll('.panel-header').forEach(header => {
            header.addEventListener('mousedown', (e) => {
                if (e.target.closest('button, #closePropsBtn')) return;
                e.preventDefault();
                const startX = e.clientX, startY = e.clientY;
                const baseLeft = panel.offsetLeft, baseTop = panel.offsetTop;
                const onMove = (ev) => {
                    panel.style.left = (baseLeft + ev.clientX - startX) + 'px';
                    panel.style.top = (baseTop + ev.clientY - startY) + 'px';
                };
                const onUp = () => {
                    window.removeEventListener('mousemove', onMove);
                    window.removeEventListener('mouseup', onUp);
                };
                window.addEventListener('mousemove', onMove);
                window.addEventListener('mouseup', onUp);
            });
        });
        // 收起/展开
        document.querySelectorAll('.panel-collapse-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                panel.classList.add('collapsed');
                reopenBtn.style.display = 'inline-flex';
            });
        });
        reopenBtn.addEventListener('click', () => {
            panel.classList.remove('collapsed');
            reopenBtn.style.display = 'none';
        });
    }

    function initLayerToggle() {
        const btn = document.getElementById('layerToggleBtn');
        const list = document.getElementById('layerList');
        if (!btn || !list) return;
        btn.addEventListener('click', () => {
            const open = list.style.display !== 'none';
            list.style.display = open ? 'none' : 'block';
            btn.textContent = open ? '▶' : '▼';
        });
    }

    function init() {
        canvasElement.style.width = canvasWidth + 'px';
        canvasElement.style.height = canvasHeight + 'px';
        canvasElement.style.background = 'linear-gradient(145deg, #b2e0fa, #c5e0a4)';
        container.addEventListener('wheel', (e) => {
            if (e.ctrlKey) { e.preventDefault(); setZoom(zoom + (e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP)); }
        }, { passive: false });
        document.getElementById('zoomInBtn').onclick = () => setZoom(zoom + ZOOM_STEP);
        document.getElementById('zoomOutBtn').onclick = () => setZoom(zoom - ZOOM_STEP);
        document.getElementById('zoomResetBtn').onclick = () => setZoom(1);
        updateZoomUI();
        buildGroupedSymbols('emojiSymbolsContainer', emojiGroups);
        buildGroupedSymbols('normalSymbolsContainer', normalGroups);
        initTabs();
        initDrop();
        initCanvasPan();
        initPaste();
        initPanelFloating();
        initLayerToggle();
        window.addEventListener('keydown', handleBackspaceDelete);
        window.addEventListener('keyup', (e) => {
            if (ARROWS[e.key] && arrowHistoryDirty) { pushHistory(); arrowHistoryDirty = false; }
        });
        document.getElementById('undoBtn').onclick = undo;
        document.getElementById('redoBtn').onclick = redo;
        const multiDeleteBtn = document.getElementById('multiDeleteBtn');
        if (multiDeleteBtn) multiDeleteBtn.onclick = () => {
            getSelectionTargets().forEach(t => t.remove());
            selectElement(null);
            pushHistory();
            refreshLayers();
        };
        const multiCancelBtn = document.getElementById('multiCancelBtn');
        if (multiCancelBtn) multiCancelBtn.onclick = () => selectElement(null);
        document.getElementById('saveSceneBtn').onclick = saveScene;
        document.getElementById('loadSceneBtn').onclick = loadScene;
        document.getElementById('newSceneBtn').onclick = newScene;
        document.getElementById('clearCanvasBtn').onclick = clearCanvas;
        document.getElementById('canvasSettingsBtn').onclick = showCanvasSettings;
        document.getElementById('helpBtn').onclick = showHelp;
        addDemoElements();
        selectElement(null);
        canvasElement.addEventListener('click', (e) => {
            if (suppressClickSelect) { suppressClickSelect = false; return; }
            if (e.target === canvasElement) selectElement(null);
        });
        clampTransform();
        pushHistory();
        refreshLayers();
    }
    init();

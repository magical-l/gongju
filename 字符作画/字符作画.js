

    // ---------- 符号库数据 ----------
    const normalGroups = {
        "🔣 装饰 & 符号": ["★", "☆", "☀", "☁", "☾", "✿", "❀", "〰", "✂", "⚙", "◉", "◎", "▧", "▣", "▪", "▫", "☯", "♻", "⚜", "♩", "♪", "♫"],
        "⬆️ 箭头 & 标点": ["⬆", "⬇", "⬅", "➡", "↗", "↘", "↙", "↖", "✔", "‼", "⁉"]
    };
    const emojiGroups = {
        "👥 人物角色": ["👩", "👨", "🧑", "👧", "👦", "👵", "👴", "👸", "🤴", "🧙", "🧚", "🧛", "🎅", "🤶", "💁", "🙋", "💂", "🕵️", "👩‍🌾", "👨‍🍳", "👩‍🎨", "🧑‍🚀"],
        "🐾 动物伙伴": ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐒", "🐔", "🐧", "🐦", "🐴", "🐺", "🦋", "🐌", "🐞", "🐝", "🐑", "🐄", "🦆"],
        "🌻 花草自然": ["🌸", "🌼", "🌻", "🌺", "🌹", "🥀", "🌿", "🍀", "🍃", "🍂", "🍁", "🌲", "🌳", "🌴", "🍎", "🍓", "🍊", "🥕", "🌽", "🍄"],
        "🏠 建筑物品": ["🏠", "🏡", "🏢", "🏘️", "🏰", "🗼", "🚗", "🚜", "🚲", "🚛", "✈️", "⛵", "🚀", "🛸", "⌛", "⏳", "⚓", "🔔", "📷", "💡", "🔑", "🧺", "🪣", "🧹", "🚪"],
        "✨ 符号 & 标记": ["⚡", "🌀", "➰", "❌", "❗", "❓"]
    };

    let currentSelected = null;
    const selectedSet = new Set();
    let suppressClickSelect = false;
    let panelManuallyPositioned = false;  // 用户手动拖离过浮层 → 元素移动不再跟随
    let layerDragEl = null;
    let layerDragMoved = false;
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
        autoSave();
    }

    function undo() {
        if (historyIndex > 0) {
            historyIndex--;
            applySnapshot(historyStack[historyIndex]);
            updateUndoRedoButtons();
            autoSave();
        }
    }

    function redo() {
        if (historyIndex < historyStack.length - 1) {
            historyIndex++;
            applySnapshot(historyStack[historyIndex]);
            updateUndoRedoButtons();
            autoSave();
        }
    }

    function updateUndoRedoButtons() {
        const undoBtn = document.querySelector('.undo');
        const redoBtn = document.querySelector('.redo');
        if (undoBtn) undoBtn.disabled = (historyIndex <= 0);
        if (redoBtn) redoBtn.disabled = (historyIndex >= historyStack.length - 1);
    }

    // 把任意 CSS 颜色规范化为 #rrggbb（<input type=color> 只接受 hex）
    function toHexColor(colorStr) {
        if (!colorStr) return '#2c5a2c';
        if (/^#[0-9a-fA-F]{3,8}$/.test(colorStr)) return colorStr;
        const probe = document.createElement('span');
        probe.style.color = colorStr;
        probe.style.display = 'none';
        document.body.appendChild(probe);
        const rgb = getComputedStyle(probe).color;
        document.body.removeChild(probe);
        const m = rgb.match(/[\d.]+/g);
        if (!m) return '#2c5a2c';
        return '#' + m.slice(0, 3).map(v => (+v).toString(16).padStart(2, '0')).join('');
    }
    function isEmojiCharacter(charStr) {
        if (!charStr) return false;
        // U+FE0F (VS16) 变体选择符：明确要求按 emoji 呈现
        if (charStr.includes('️')) return true;
        // 主 emoji 区（这些字符只有 emoji 变体）
        const code = charStr.codePointAt(0);
        if (!code) return false;
        if (code >= 0x1F000 && code <= 0x1FAFF) return true;
        // 默认以 emoji 呈现的字符（Emoji_Presentation=Yes）
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
            if (selectedSet.has(element)) followFloatPanel();
        }
        function onMouseUp() {
            if (dragging && moved) { pushHistory(); suppressClickSelect = true; }
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
        const leftRel = (rect.left - canvasRect.left) / zoom;
        const topRel = (rect.top - canvasRect.top) / zoom;
        const w = rect.width / zoom;
        const h = rect.height / zoom;
        if (handle.classList.contains('tl')) { handle.style.left = leftRel - 6 + 'px'; handle.style.top = topRel - 6 + 'px'; }
        else if (handle.classList.contains('tr')) { handle.style.left = leftRel + w - 6 + 'px'; handle.style.top = topRel - 6 + 'px'; }
        else if (handle.classList.contains('bl')) { handle.style.left = leftRel - 6 + 'px'; handle.style.top = topRel + h - 6 + 'px'; }
        else if (handle.classList.contains('br')) { handle.style.left = leftRel + w - 6 + 'px'; handle.style.top = topRel + h - 6 + 'px'; }
    }
    function hideResizeHandles() {
        document.querySelectorAll('.resize-handle').forEach(h => h.remove());
    }
    function startResize(element, position, e) {
        e.preventDefault();
        const startFontSize = parseInt(element.style.fontSize) || parseInt(element.getAttribute('data-fontsize')) || 40;
        const startLeft = parseInt(element.style.left) || 0;
        const startTop = parseInt(element.style.top) || 0;
        const startWidth = element.offsetWidth;
        const startHeight = element.offsetHeight;
        const centerX = startLeft + startWidth / 2;
        const centerY = startTop + startHeight / 2;
        const startX = e.clientX;
        const startY = e.clientY;
        let resizing = true;
        function onMouseMove(moveEv) {
            if (!resizing) return;
            let deltaX = (moveEv.clientX - startX) * 0.6 / zoom;
            let deltaY = (moveEv.clientY - startY) * 0.6 / zoom;
            let delta = (position === 'br' || position === 'tr') ? deltaX : -deltaX;
            if (position === 'bl' || position === 'br') delta = (deltaX + deltaY) / 2;
            else delta = (deltaX - deltaY) / 2;
            let newSize = Math.max(12, Math.round(startFontSize + delta));
            element.style.fontSize = newSize + 'px';
            element.setAttribute('data-fontsize', newSize);
            const newWidth = element.offsetWidth;
            const newHeight = element.offsetHeight;
            element.style.left = (centerX - newWidth / 2) + 'px';
            element.style.top = (centerY - newHeight / 2) + 'px';
            if (currentSelected === element) {
                const sizeSlider = document.querySelector('.size-slider');
                if (sizeSlider) sizeSlider.value = newSize;
                document.querySelector('.size-value').innerText = newSize;
            }
            document.querySelectorAll('.resize-handle').forEach(h => updateHandlePosition(h, element));
            followFloatPanel();
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

    function positionFloatPanel(el) {
        const panel = document.getElementById('floatPanel');
        if (!panel || !el) return;
        const er = el.getBoundingClientRect();
        const cr = container.getBoundingClientRect();
        const margin = 8;
        let left = er.right - cr.left + margin;
        let top = er.top - cr.top - 12;
        // 横向：右侧放不下则翻到元素左侧
        if (left + panel.offsetWidth > container.clientWidth - margin) {
            left = er.left - cr.left - panel.offsetWidth - margin;
        }
        // 双向 clamp 进画布外框内，防止突破下沿
        left = Math.max(margin, Math.min(left, container.clientWidth - panel.offsetWidth - margin));
        top = Math.max(margin, Math.min(top, container.clientHeight - panel.offsetHeight - margin));
        panel.style.left = left + 'px';
        panel.style.top = top + 'px';
    }

    // 移动选中元素时浮层跟随，除非用户手动拖离过浮层
    function followFloatPanel() {
        if (panelManuallyPositioned) return;
        const panel = document.getElementById('floatPanel');
        if (!panel || !panel.classList.contains('visible')) return;
        if (!currentSelected) return;
        positionFloatPanel(selectedSet.size > 1 ? [...selectedSet].at(-1) : currentSelected);
    }

    function selectElement(el, opts = {}) {
        const prevSelected = currentSelected;  // 记录当前锚点元素，用于判断是否换选
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
        const multiDiv = document.querySelector('.multi-select');
        const selDiv = document.querySelector('.selection-controls');
        const floatPanel = document.getElementById('floatPanel');
        if (currentSelected) {
            propsDiv.open = true;
            if (selectedSet.size > 1) {
                if (multiDiv) multiDiv.style.display = 'block';
                selDiv.style.display = 'none';
                if (multiDiv) multiDiv.querySelector('.multi-count').textContent = selectedSet.size;
            } else {
                if (multiDiv) multiDiv.style.display = 'none';
                selDiv.style.display = 'block';
                showResizeHandles(currentSelected);
                updatePropsPanelWithElement(currentSelected);
            }
            // 浮层显隐与定位：单选贴 currentSelected，多选贴最近点选元素
            if (floatPanel) {
                floatPanel.classList.add('visible');
                const anchor = selectedSet.size > 1 ? [...selectedSet].at(-1) : currentSelected;
                // 手动拖离过且仍是同一锚点元素 → 保持停留；否则重新贴住
                if (!panelManuallyPositioned || anchor !== prevSelected) {
                    panelManuallyPositioned = false;
                    positionFloatPanel(anchor);
                }
            }
        } else {
            propsDiv.open = false;
            if (multiDiv) multiDiv.style.display = 'none';
            if (selDiv) selDiv.style.display = 'none';
            const previewDiv = document.querySelector('.selection-controls .preview-char');
            if (previewDiv) previewDiv.innerText = '';
            if (floatPanel) floatPanel.classList.remove('visible');
        }
        const title = document.querySelector('.panel-title');
        if (title) title.textContent = currentSelected ? '✨ 已选元素' : '✨ 已选元素（无）';
        if (typeof refreshLayers === 'function') refreshLayers();
    }

    function refreshLayers() {
        const rail = document.getElementById('layerRail');
        if (!rail) return;
        rail.innerHTML = '';
        const items = [...document.querySelectorAll('#sceneCanvas .scene-item')]
            .sort((a, b) => (parseInt(b.style.zIndex) || 0) - (parseInt(a.style.zIndex) || 0));
        items.forEach(el => {
            const ch = el.getAttribute('data-char') || '?';
            const cell = document.createElement('div');
            cell.className = 'layer-rail-item' + (selectedSet.has(el) ? ' active' : '');
            cell.innerText = [...ch][0];
            cell.title = ch;
            cell.setAttribute('draggable', 'true');
            cell.addEventListener('click', (e) => {
                if (layerDragMoved) { layerDragMoved = false; return; }
                selectElement(el, { additive: e.ctrlKey || e.metaKey });
            });
            cell.addEventListener('dragstart', (e) => {
                layerDragEl = el;
                layerDragMoved = true;
                e.dataTransfer.effectAllowed = 'move';
            });
            cell.addEventListener('dragover', (e) => e.preventDefault());
            cell.addEventListener('drop', (e) => {
                e.preventDefault();
                if (!layerDragEl || layerDragEl === el) { layerDragEl = null; return; }
                // 插入式排序：drop 在目标 cell 上半→插到目标上方，下半→插到目标下方
                const rect = cell.getBoundingClientRect();
                const insertBefore = e.clientY < rect.top + rect.height / 2;
                // 当前所有 scene-item 按 zIndex 降序（视觉从顶到底）
                const order = [...document.querySelectorAll('#sceneCanvas .scene-item')]
                    .sort((a, b) => (parseInt(b.style.zIndex) || 0) - (parseInt(a.style.zIndex) || 0));
                const fromIdx = order.indexOf(layerDragEl);
                if (fromIdx === -1) { layerDragEl = null; return; }
                order.splice(fromIdx, 1); // 取出拖拽元素
                let toIdx = order.indexOf(el);
                if (toIdx === -1) { layerDragEl = null; return; }
                if (!insertBefore) toIdx += 1; // 插到目标下方
                order.splice(toIdx, 0, layerDragEl); // 插入
                // 重分配连续 zIndex：顺序首位（顶层）最大
                order.forEach((item, i) => {
                    const z = order.length - 1 - i;
                    item.style.zIndex = z;
                    item.setAttribute('data-zindex', z);
                });
                layerDragEl = null;
                pushHistory();
                refreshLayers();
            });
            cell.addEventListener('dragend', () => {
                layerDragEl = null;
                layerDragMoved = false;
            });
            rail.appendChild(cell);
        });
    }
    function updatePropsPanelWithElement(el) {
        const char = el.getAttribute('data-char');
        let repeat = parseInt(el.getAttribute('data-repeat') || 1);
        const fontSize = parseInt(el.getAttribute('data-fontsize') || 42);
        const isEmoji = isEmojiCharacter(char);
        const previewDiv = document.querySelector('.selection-controls .preview-char');
        previewDiv.innerText = char;
        document.querySelector('.copy-char').onclick = () => { navigator.clipboard.writeText(char); toastr.success(`已复制: ${char}`); };
        const sizeSlider = document.querySelector('.size-slider');
        const sizeVal = document.querySelector('.size-value');
        sizeSlider.value = fontSize;
        sizeVal.innerText = fontSize;
        sizeSlider.oninput = (e) => {
            let val = Math.round(parseFloat(e.target.value));
            sizeVal.innerText = val;
            el.style.fontSize = val + 'px';
            el.setAttribute('data-fontsize', val);
            if (currentSelected === el) showResizeHandles(el);
            pushHistory();
        };
        const repSlider = document.querySelector('.repeat-slider');
        const repSpan = document.querySelector('.repeat-value');
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
        const rotSlider = document.querySelector('.rotation-slider');
        const rotVal = document.querySelector('.rotation-value');
        rotSlider.value = rot; rotVal.textContent = rot;
        rotSlider.oninput = (e) => {
            const v = parseInt(e.target.value);
            rotVal.textContent = v;
            el.setAttribute('data-rotation', v);
            el.style.transform = v ? `rotate(${v}deg)` : '';
            pushHistory();
        };
        const opAttr = parseFloat(el.getAttribute('data-opacity'));
        const op = Number.isFinite(opAttr) ? opAttr : 1;
        const opSlider = document.querySelector('.opacity-slider');
        const opVal = document.querySelector('.opacity-value');
        const trans = Math.round((1 - op) * 100);
        opSlider.value = trans; opVal.textContent = trans + '%';
        opSlider.oninput = (e) => {
            const v = parseInt(e.target.value) / 100;
            opVal.textContent = e.target.value + '%';
            const opv = 1 - v;
            el.setAttribute('data-opacity', opv);
            el.style.opacity = opv;
            pushHistory();
        };
        const colorArea = document.querySelector('.color-control');
        const colorPicker = document.querySelector('.color-picker');
        if (!isEmoji) {
            colorArea.style.display = 'block';
            let currentColor = el.style.color || '#2c5a2c';
            if (currentColor === '') currentColor = '#2c5a2c';
            colorPicker.value = toHexColor(currentColor);
            colorPicker.oninput = (e) => {
                el.style.color = e.target.value;
                el.setAttribute('data-color', e.target.value);
                pushHistory();
            };
        } else {
            colorArea.style.display = 'none';
        }
        document.querySelector('.delete-item').onclick = () => {
            if (currentSelected) {
                currentSelected.remove();
                selectElement(null);
                pushHistory();
                refreshLayers();
            }
        };
        const closePropsBtn = document.querySelector('.close-props');
        if (closePropsBtn) closePropsBtn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); selectElement(null); };
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
        followFloatPanel();
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
                const repSlider = document.querySelector('.repeat-slider');
                if (repSlider) repSlider.value = repeat;
                document.querySelector('.repeat-value').innerText = repeat;
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
        applyViewTransform();
        clampTransform();
        updateZoomUI();
        updatePanCursor();
    }
    function updateZoomUI() {
        const d = document.querySelector('.zoom-display');
        if (d) d.textContent = Math.round(zoom * 100) + '%';
        const o = document.querySelector('.zoom-out'), i = document.querySelector('.zoom-in');
        if (o) o.disabled = zoom <= MIN_ZOOM;
        if (i) i.disabled = zoom >= MAX_ZOOM;
    }

    function clampTransform() {
        // 画布无 translate 时的基准位置用 offsetLeft/Top（不受 transform 影响，拖拽过程中稳定）——clamp 必须基于它，否则放大后边缘内容不可达
        const baseLeft = canvasElement.offsetLeft;
        const baseTop = canvasElement.offsetTop;
        const canvasVisualW = canvasElement.getBoundingClientRect().width;
        const canvasVisualH = canvasElement.getBoundingClientRect().height;
        const containerW = container.clientWidth;
        const containerH = container.clientHeight;
        // 画布居中（base>0），放大后从基准向右下扩展——即使尺寸小于容器，右侧/下侧也可能已溢出，必须按位置判断
        const overflowX = baseLeft < 0 || baseLeft + canvasVisualW > containerW;
        const overflowY = baseTop < 0 || baseTop + canvasVisualH > containerH;
        let minX = 0, maxX = 0, minY = 0, maxY = 0;
        if (overflowX) {
            minX = Math.min(0, -baseLeft, containerW - canvasVisualW - baseLeft);
            maxX = Math.max(0, -baseLeft, containerW - canvasVisualW - baseLeft);
        }
        if (overflowY) {
            minY = Math.min(0, -baseTop, containerH - canvasVisualH - baseTop);
            maxY = Math.max(0, -baseTop, containerH - canvasVisualH - baseTop);
        }
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

    function updatePanCursor() {
        const cv = canvasElement.getBoundingClientRect();
        const cr = container.getBoundingClientRect();
        const canPan = cv.left < cr.left || cv.right > cr.right || cv.top < cr.top || cv.bottom > cr.bottom;
        container.classList.toggle('pan-enabled', canPan);
    }

    function initCanvasPan() {
        container.addEventListener('mousedown', (e) => {
            if (e.target === container || e.target === canvasElement || e.target.classList.contains('canvas-card')) {
                const cv = canvasElement.getBoundingClientRect();
                const cr = container.getBoundingClientRect();
                const canPan = cv.left < cr.left || cv.right > cr.right || cv.top < cr.top || cv.bottom > cr.bottom;
                if (!canPan) return;
                isPanning = true;
                panStart.x = e.clientX;
                panStart.y = e.clientY;
                panStartTransform.x = sceneTransform.x;
                panStartTransform.y = sceneTransform.y;
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
            updatePanCursor();
        });
    }

    function buildGroupedSymbols(containerSelector, groups) {
        const containerElem = document.querySelector(containerSelector);
        containerElem.innerHTML = '';
        for (const [groupName, symbols] of Object.entries(groups)) {
            const groupDiv = document.createElement('details');
            groupDiv.className = 'symbol-group';
            groupDiv.open = true;
            const header = document.createElement('summary');
            header.className = 'group-header';
            header.textContent = groupName;
            const content = document.createElement('div');
            content.className = 'group-content flex';
            symbols.forEach(sym => {
                const card = document.createElement('div');
                card.className = 'symbol-card inline flex items-single-line items-y-near-center';
                card.setAttribute('draggable', 'true');
                card.innerHTML = `<span>${sym}</span>`;
                card.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('text/plain', sym);
                    e.dataTransfer.effectAllowed = 'copy';
                });
                content.appendChild(card);
            });
            groupDiv.appendChild(header);
            groupDiv.appendChild(content);
            containerElem.appendChild(groupDiv);
        }
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

    const BG_DIRS = ['to top', 'to right', 'to bottom', 'to left', '135deg'];

    function canvasSettingsEls() {
        const dialog = document.getElementById('canvasSettingsDialog');
        return {
            dialog,
            body: dialog.querySelector('.settings-body'),
            solidRadio: dialog.querySelector('input[name="bgType"][value="solid"]'),
            gradientRadio: dialog.querySelector('input[name="bgType"][value="gradient"]'),
            solidRow: dialog.querySelector('.solid-row'),
            gradientRow: dialog.querySelector('.gradient-row'),
            widthInput: dialog.querySelector('.canvas-width'),
            heightInput: dialog.querySelector('.canvas-height'),
            bgColor: dialog.querySelector('.bg-color'),
            dirSelect: dialog.querySelector('.gradient-dir'),
            gradColor1: dialog.querySelector('.grad-color-1'),
            gradColor2: dialog.querySelector('.grad-color-2'),
        };
    }

    // 把 linear-gradient 拆成 dir/c1/c2（c1/c2 可能是 rgb(...)，统一走 toHexColor 归一）
    function parseGradient(bg) {
        const m = bg.match(/linear-gradient\(\s*([\s\S]*?)\s*\)$/i);
        if (!m) return null;
        const inner = m[1];
        const parts = [];
        let depth = 0, start = 0;
        for (let i = 0; i < inner.length; i++) {
            const ch = inner[i];
            if (ch === '(') depth++;
            else if (ch === ')') depth--;
            else if (ch === ',' && depth === 0) {
                parts.push(inner.slice(start, i));
                start = i + 1;
            }
        }
        parts.push(inner.slice(start));
        if (parts.length < 3) return null;
        return {
            dir: parts[0].trim(),
            c1: parts[1].trim(),
            c2: parts[2].trim(),
        };
    }

    function updateCanvasSettingsMode() {
        const els = canvasSettingsEls();
        const solid = els.solidRadio.checked;
        els.solidRow.style.display = solid ? 'flex' : 'none';
        els.gradientRow.style.display = solid ? 'none' : 'block';
    }

    // 用画布设置面板 body 背景做实时预览（纯色/渐变）
    function updateCanvasSettingsDialogBg() {
        const els = canvasSettingsEls();
        els.body.style.background = els.solidRadio.checked
            ? els.bgColor.value
            : `linear-gradient(${els.dirSelect.value}, ${els.gradColor1.value}, ${els.gradColor2.value})`;
    }

    function showCanvasSettings() {
        const els = canvasSettingsEls();
        els.widthInput.value = canvasWidth;
        els.heightInput.value = canvasHeight;
        const bg = (canvasElement.style.background || '').trim();
        if (/^linear-gradient\b/i.test(bg)) {
            els.gradientRadio.checked = true;
            const parsed = parseGradient(bg);
            const dir = parsed ? parsed.dir : '135deg';
            els.dirSelect.value = BG_DIRS.includes(dir) ? dir : '135deg';
            els.gradColor1.value = parsed ? toHexColor(parsed.c1) : '#b2e0fa';
            els.gradColor2.value = parsed ? toHexColor(parsed.c2) : '#c5e0a4';
        } else {
            els.solidRadio.checked = true;
            els.bgColor.value = bg ? toHexColor(bg) : '#b2e0fa';
        }
        updateCanvasSettingsMode();
        updateCanvasSettingsDialogBg();
        els.dialog.showModal();
    }

    function initCanvasSettingsDialog() {
        const els = canvasSettingsEls();
        els.solidRadio.addEventListener('change', () => { updateCanvasSettingsMode(); updateCanvasSettingsDialogBg(); });
        els.gradientRadio.addEventListener('change', () => { updateCanvasSettingsMode(); updateCanvasSettingsDialogBg(); });
        els.bgColor.addEventListener('input', updateCanvasSettingsDialogBg);
        els.dirSelect.addEventListener('change', updateCanvasSettingsDialogBg);
        els.gradColor1.addEventListener('input', updateCanvasSettingsDialogBg);
        els.gradColor2.addEventListener('input', updateCanvasSettingsDialogBg);
        els.dialog.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                els.gradientRadio.checked = true;
                els.dirSelect.value = btn.getAttribute('data-dir');
                els.gradColor1.value = btn.getAttribute('data-c1');
                els.gradColor2.value = btn.getAttribute('data-c2');
                updateCanvasSettingsMode();
                updateCanvasSettingsDialogBg();
            });
        });
        els.dialog.querySelector('.dialog-confirm').addEventListener('click', () => {
            let newW = parseInt(els.widthInput.value) || 800;
            let newH = parseInt(els.heightInput.value) || 600;
            if (newW < 400) newW = 400;
            if (newH < 300) newH = 300;
            canvasWidth = newW;
            canvasHeight = newH;
            canvasElement.style.width = canvasWidth + 'px';
            canvasElement.style.height = canvasHeight + 'px';
            updatePanCursor();
            canvasElement.style.background = els.solidRadio.checked
                ? els.bgColor.value
                : `linear-gradient(${els.dirSelect.value}, ${els.gradColor1.value}, ${els.gradColor2.value})`;
            clampTransform();
            pushHistory();
            els.dialog.close();
        });
        els.dialog.querySelector('.dialog-cancel').addEventListener('click', () => els.dialog.close());
    }

    function showHelp() {
        const dialog = document.createElement('dialog');
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
                    <li>💾 自动保存（本地存储）</li>
                    <li>↩️↪️ 支持撤销/重做 (Ctrl+Z / Ctrl+Y)</li>
                    <li>✨ 「新建」重置为空画布，「清空」仅清除字符</li>
                    <li>📂 「打开」可导入 JSON 文件，📤「导出」可导出 PNG / HTML / JSON</li>
                </ul>
                <div class="help-actions flex items-x-near-center"><button class="close-help">关闭</button></div>
            </div>
        `;
        document.body.appendChild(dialog);
        dialog.addEventListener('cancel', () => dialog.remove());
        dialog.showModal();
        dialog.querySelector('.close-help').onclick = () => { dialog.close(); dialog.remove(); };
    }

    // ---------- 导出 / 导入 ----------
    function downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    function showExportDialog() {
        const dialog = document.createElement('dialog');
        dialog.innerHTML = `
            <div class="body export-body">
                <h3>📤 导出</h3>
                <button class="btn export-option-btn export-png">🖼️ 导出 PNG 图片</button>
                <button class="btn export-option-btn export-html">📄 导出 HTML</button>
                <button class="btn export-option-btn export-json">📦 导出 JSON 数据</button>
                <div class="dialog-actions flex items-go-x items-near-right">
                    <button class="btn dialog-cancel">关闭</button>
                </div>
            </div>
        `;
        document.body.appendChild(dialog);
        dialog.addEventListener('cancel', () => dialog.remove());
        dialog.showModal();
        dialog.querySelector('.export-png').onclick = () => { exportPng(); dialog.close(); dialog.remove(); };
        dialog.querySelector('.export-html').onclick = () => { exportHtml(); dialog.close(); dialog.remove(); };
        dialog.querySelector('.export-json').onclick = () => { exportJson(); dialog.close(); dialog.remove(); };
        dialog.querySelector('.dialog-cancel').onclick = () => { dialog.close(); dialog.remove(); };
    }

    function exportPng() {
        // 用 SVG foreignObject 让浏览器自己渲染 DOM，再光栅化到 canvas——像素级还原（背景渐变、emoji 彩色、drop-shadow、旋转、透明度）
        const clone = canvasElement.cloneNode(true);
        clone.style.transform = '';            // 去掉平移/缩放
        clone.style.position = 'relative';
        clone.querySelectorAll('.scene-item.selected').forEach(el => el.classList.remove('selected'));
        clone.querySelectorAll('.resize-handle').forEach(el => el.remove());
        // 注入每个元素继承的真实字体，避免 foreignObject 用默认字体导致字形度量差异（emoji 不受影响，符号/CJK 会偏）
        const liveItems = [...document.querySelectorAll('#sceneCanvas .scene-item')];
        const cloneItems = [...clone.querySelectorAll('.scene-item')];
        liveItems.forEach((live, i) => {
            const c = cloneItems[i];
            if (c) c.style.fontFamily = getComputedStyle(live).fontFamily;
        });
        const css = '.scene-item { position: absolute; line-height: 1; white-space: nowrap; user-select: none; filter: drop-shadow(1px 2px 3px rgba(0,0,0,0.15)); } .scene-canvas { position: relative; }';
        const xmlns = 'http://www.w3.org/1999/xhtml';
        const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + canvasWidth + '" height="' + canvasHeight + '"><foreignObject width="100%" height="100%"><div xmlns="' + xmlns + '"><style>' + css + '</style>' + clone.outerHTML + '</div></foreignObject></svg>';
        const img = new Image();
        img.onload = () => {
            const c = document.createElement('canvas');
            c.width = canvasWidth;
            c.height = canvasHeight;
            c.getContext('2d').drawImage(img, 0, 0);
            c.toBlob(b => downloadBlob(b, '字符作画.png'), 'image/png');
        };
        img.onerror = () => { toastr.error('导出图片失败'); };
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    }

    function exportHtml() {
        const snapshot = captureSnapshot();
        const dataJson = JSON.stringify(snapshot).replace(/</g, '\\u003c');
        const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="utf-8">
    <title>字符作画 - 导出作品</title>
    <style>
        body { margin: 0; padding: 16px; font-family: system-ui, sans-serif; background: #f0f0f0; }
        .scene-canvas { position: relative; overflow: hidden; margin: 0 auto; border-radius: 8px; box-shadow: 0 2px 12px rgba(0,0,0,.15); }
        .scene-item { position: absolute; line-height: 1; white-space: nowrap; user-select: none; filter: drop-shadow(1px 2px 3px rgba(0,0,0,.15)); }
    </style>
</head>
<body>
    <div class="scene-canvas" id="scene" style="width:${snapshot.width}px;height:${snapshot.height}px;background:${snapshot.bg}"></div>
    <script>
        var DATA = ${dataJson};
        var scene = document.getElementById('scene');
        DATA.elements.forEach(function (e) {
            var div = document.createElement('div');
            div.className = 'scene-item';
            div.style.left = e.left;
            div.style.top = e.top;
            div.style.fontSize = e.fontSize + 'px';
            div.style.zIndex = e.zIndex;
            if (e.color) div.style.color = e.color;
            if (e.rotation) div.style.transform = 'rotate(' + e.rotation + 'deg)';
            div.style.opacity = e.opacity != null ? e.opacity : 1;
            div.innerText = e.char.repeat(e.repeat);
            scene.appendChild(div);
        });
    <\/script>
</body>
</html>`;
        downloadBlob(new Blob([html], { type: 'text/html' }), '字符作画.html');
    }

    function exportJson() {
        const data = captureSnapshot();
        downloadBlob(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), '字符作画.json');
    }

    function importJson() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json';
        input.style.display = 'none';
        document.body.appendChild(input);
        input.onchange = (e) => {
            const file = e.target.files && e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    try {
                        const raw = JSON.parse(ev.target.result);
                        if (!raw || typeof raw !== 'object' || !Array.isArray(raw.elements)) throw new Error('bad');
                        const snap = {
                            bg: (typeof raw.bg === 'string' && raw.bg) ? raw.bg : 'linear-gradient(145deg, #b2e0fa, #c5e0a4)',
                            width: (Number.isFinite(+raw.width) && +raw.width >= 400) ? +raw.width : 800,
                            height: (Number.isFinite(+raw.height) && +raw.height >= 300) ? +raw.height : 600,
                            transform: (raw.transform && Number.isFinite(+raw.transform.x) && Number.isFinite(+raw.transform.y))
                                ? { x: +raw.transform.x, y: +raw.transform.y } : { x: 0, y: 0 },
                            elements: raw.elements.map(el => {
                                const char = String(el.char ?? '');
                                if (!char) throw new Error('bad');
                                return {
                                    char,
                                    repeat: Math.max(1, parseInt(el.repeat) || 1),
                                    fontSize: Math.max(12, parseInt(el.fontSize) || 46),
                                    left: /px$/.test(String(el.left)) ? String(el.left) : (Number.isFinite(+el.left) ? (+el.left) + 'px' : '0px'),
                                    top: /px$/.test(String(el.top)) ? String(el.top) : (Number.isFinite(+el.top) ? (+el.top) + 'px' : '0px'),
                                    zIndex: (el.zIndex != null) ? el.zIndex : 300,
                                    color: (typeof el.color === 'string' && el.color) ? el.color : null,
                                    rotation: Number.isFinite(+el.rotation) ? +el.rotation : 0,
                                    opacity: Number.isFinite(+el.opacity) ? Math.min(1, Math.max(0, +el.opacity)) : 1,
                                };
                            }),
                        };
                        applySnapshot(snap);
                        pushHistory();
                        toastr.success('导入完成（' + snap.elements.length + ' 个元素）');
                    } catch (err) {
                        toastr.error('JSON 格式不正确或缺少必要字段');
                    }
                };
                reader.readAsText(file);
            }
            input.remove();
        };
        input.click();
    }

    function autoSave() {
        const data = captureSnapshot();
        localStorage.setItem('char_scene_data', JSON.stringify(data));
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

    let panelDragMoved = false;
    function initPanelFloating() {
        const panel = document.getElementById('floatPanel');
        if (!panel) return;
        // 拖标题栏（三个 summary）移动面板
        document.querySelectorAll('.panel-header').forEach(header => {
            header.addEventListener('mousedown', (e) => {
                if (e.target.closest('button, .close-props')) return;
                e.preventDefault();
                panelDragMoved = false;
                const startX = e.clientX, startY = e.clientY;
                const baseLeft = panel.offsetLeft, baseTop = panel.offsetTop;
                const onMove = (ev) => {
                    if (Math.abs(ev.clientX - startX) > 3 || Math.abs(ev.clientY - startY) > 3) {
                        panelDragMoved = true;
                        panelManuallyPositioned = true;
                    }
                    const dx = ev.clientX - startX, dy = ev.clientY - startY;
                    const card = panel.offsetParent;
                    const maxLeft = Math.max(0, card.clientWidth - panel.offsetWidth - 8);
                    const maxTop = Math.max(0, card.clientHeight - panel.offsetHeight - 8);
                    panel.style.left = Math.min(Math.max(0, baseLeft + dx), maxLeft) + 'px';
                    panel.style.top = Math.min(Math.max(0, baseTop + dy), maxTop) + 'px';
                };
                const onUp = () => {
                    window.removeEventListener('mousemove', onMove);
                    window.removeEventListener('mouseup', onUp);
                };
                window.addEventListener('mousemove', onMove);
                window.addEventListener('mouseup', onUp);
            });
            // 拖完面板后抑制随后的 summary 折叠/展开（否则拖一下面板会误触发）
            header.addEventListener('click', (e) => {
                if (panelDragMoved) {
                    panelDragMoved = false;
                    e.preventDefault();
                }
            });
        });
    }

    function init() {
        canvasElement.style.width = canvasWidth + 'px';
        canvasElement.style.height = canvasHeight + 'px';
        canvasElement.style.background = 'linear-gradient(145deg, #b2e0fa, #c5e0a4)';
        container.addEventListener('wheel', (e) => {
            if (e.ctrlKey) { e.preventDefault(); setZoom(zoom + (e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP)); }
        }, { passive: false });
        document.querySelector('.zoom-in').onclick = () => setZoom(zoom + ZOOM_STEP);
        document.querySelector('.zoom-out').onclick = () => setZoom(zoom - ZOOM_STEP);
        document.querySelector('.zoom-reset').onclick = () => setZoom(1);
        updateZoomUI();
        buildGroupedSymbols('.emoji-symbols', emojiGroups);
        buildGroupedSymbols('.normal-symbols', normalGroups);
        initDrop();
        initCanvasPan();
        initPaste();
        initPanelFloating();
        window.addEventListener('keydown', handleBackspaceDelete);
        window.addEventListener('keyup', (e) => {
            if (ARROWS[e.key] && arrowHistoryDirty) { pushHistory(); arrowHistoryDirty = false; }
        });
        document.querySelector('.undo').onclick = undo;
        document.querySelector('.redo').onclick = redo;
        const multiDeleteBtn = document.querySelector('.delete-multi');
        if (multiDeleteBtn) multiDeleteBtn.onclick = () => {
            getSelectionTargets().forEach(t => t.remove());
            selectElement(null);
            pushHistory();
            refreshLayers();
        };
        const multiCancelBtn = document.querySelector('.cancel-multi');
        if (multiCancelBtn) multiCancelBtn.onclick = () => selectElement(null);
        document.querySelector('.load-scene').onclick = importJson;
        document.querySelector('.export').onclick = showExportDialog;
        document.querySelector('.new-scene').onclick = newScene;
        document.querySelector('.clear-canvas').onclick = clearCanvas;
        document.querySelector('.canvas-settings').onclick = showCanvasSettings;
        initCanvasSettingsDialog();
        document.querySelector('.help-btn').onclick = showHelp;
        const savedRaw = localStorage.getItem('char_scene_data');
        if (savedRaw) {
            try { applySnapshot(JSON.parse(savedRaw)); }
            catch (err) { addDemoElements(); }
        } else {
            addDemoElements();
        }
        selectElement(null);
        canvasElement.addEventListener('click', (e) => {
            if (suppressClickSelect) { suppressClickSelect = false; return; }
            if (e.target === canvasElement) selectElement(null);
        });
        clampTransform();
        updatePanCursor();
        window.addEventListener('resize', updatePanCursor);
        pushHistory();
        refreshLayers();
    }
    init();

(() => {
    // Color Presets
    const PRESET_COLORS = [
        '#6366f1', '#ec4899', '#10b981', '#f59e0b', '#06b6d4', 
        '#8b5cf6', '#ef4444', '#14b8a6', '#f43f5e', '#a855f7'
    ];

    // State Variables
    const state = {
        nodes: [],
        links: [],
        selectedNodeIds: [], // Multi-select array
        
        // Linking state
        isLinking: false,
        linkStartNodeId: null,
        
        // Pan and Zoom
        pan: { x: 0, y: 0 },
        zoom: 1.0,
        isPanning: false,
        panStart: { x: 0, y: 0 },
        
        // Node dragging state
        dragNodeId: null,
        dragStartScreen: { x: 0, y: 0 },
        dragStartNodesCoords: {}, // Coordinates of all selected nodes when drag starts
        
        // Drag Selection state
        isSelecting: false,
        selectStart: { x: 0, y: 0 }
    };

    // DOM elements
    const elements = {
        canvasArea: document.getElementById('canvasArea'),
        svgCanvas: document.getElementById('svgCanvas'),
        zoomGroup: document.getElementById('zoomGroup'),
        linksGroup: document.getElementById('linksGroup'),
        tempLine: document.getElementById('tempLine'),
        nodesContainer: document.getElementById('nodesContainer'),
        selectionBox: document.getElementById('selectionBox'),
        
        addNodeBtn: document.getElementById('addNodeBtn'),
        arrangeBtn: document.getElementById('arrangeBtn'),
        clearBtn: document.getElementById('clearBtn'),
        saveJsonBtn: document.getElementById('saveJsonBtn'),
        loadJsonInput: document.getElementById('loadJsonInput'),
        exportPngBtn: document.getElementById('exportPngBtn'),
        
        sidebar: document.getElementById('sidebar'),
        noSelectionHint: document.getElementById('noSelectionHint'),
        nodeSettings: document.getElementById('nodeSettings'),
        nodeText: document.getElementById('nodeText'),
        colorPresetsContainer: document.getElementById('colorPresetsContainer'),
        nodeColorPicker: document.getElementById('nodeColorPicker'),
        nodeShape: document.getElementById('nodeShape'),
        nodeRotationSlider: document.getElementById('nodeRotationSlider'),
        nodeRotationVal: document.getElementById('nodeRotationVal'),
        nodeSizeSlider: document.getElementById('nodeSizeSlider'),
        nodeSizeVal: document.getElementById('nodeSizeVal'),
        deleteNodeBtn: document.getElementById('deleteNodeBtn'),
        exportCanvas: document.getElementById('exportCanvas')
    };

    // Initialize App
    init();

    function init() {
        buildColorPresets();
        bindEvents();
        loadLocalState();
        
        // Spawn starter nodes if grid is empty
        if (state.nodes.length === 0) {
            spawnStarterNodes();
        } else {
            renderAll();
        }
    }

    function spawnStarterNodes() {
        const center = getCanvasCenter();
        const node1 = createNode('Double-click to edit', center.x, center.y - 80, '#6366f1', 'pill', 16);
        const node2 = createNode('Click green ring to link', center.x, center.y + 80, '#10b981', 'pill', 14);
        
        state.nodes.push(node1, node2);
        state.links.push({ from: node1.id, to: node2.id });
        
        saveLocalState();
        renderAll();
    }

    function bindEvents() {
        // Add Node
        elements.addNodeBtn.addEventListener('click', () => {
            const center = getCanvasCenter();
            const node = createNode('New Idea', center.x, center.y, '#6366f1', 'pill', 14);
            state.nodes.push(node);
            selectNode(node.id);
            saveLocalState();
            renderAll();
        });

        // Double-click canvas to spawn node
        elements.canvasArea.addEventListener('dblclick', (e) => {
            if (e.target === elements.canvasArea || e.target === elements.svgCanvas || e.target === elements.nodesContainer) {
                const pt = screenToCanvas(e.clientX, e.clientY);
                const node = createNode('Idea', pt.x, pt.y, '#6366f1', 'pill', 14);
                state.nodes.push(node);
                selectNode(node.id);
                saveLocalState();
                renderAll();
            }
        });

        // Click canvas to deselect node, start panning or selection box
        elements.canvasArea.addEventListener('mousedown', (e) => {
            if (e.target === elements.canvasArea || e.target === elements.svgCanvas || e.target === elements.nodesContainer) {
                // Pan using middle-click, right-click, Space, Alt, or Ctrl key
                if (e.button === 1 || e.button === 2 || e.altKey || e.ctrlKey) {
                    state.isPanning = true;
                    state.panStart = { x: e.clientX - state.pan.x, y: e.clientY - state.pan.y };
                    e.preventDefault();
                } else {
                    // Left click on background: start drag selection box
                    deselectNode();
                    state.isSelecting = true;
                    state.selectStart = { x: e.clientX, y: e.clientY };
                    
                    const rect = elements.canvasArea.getBoundingClientRect();
                    elements.selectionBox.style.left = `${e.clientX - rect.left}px`;
                    elements.selectionBox.style.top = `${e.clientY - rect.top}px`;
                    elements.selectionBox.style.width = '0px';
                    elements.selectionBox.style.height = '0px';
                    elements.selectionBox.classList.remove('hidden');
                }
            }
        });

        elements.canvasArea.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        // Mouse Wheel Zoom centered on cursor
        elements.canvasArea.addEventListener('wheel', (e) => {
            e.preventDefault();
            const rect = elements.canvasArea.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const beforeZoomX = (mouseX - state.pan.x) / state.zoom;
            const beforeZoomY = (mouseY - state.pan.y) / state.zoom;

            const zoomFactor = 1.08;
            if (e.deltaY < 0) {
                state.zoom = Math.min(3.0, state.zoom * zoomFactor);
            } else {
                state.zoom = Math.max(0.3, state.zoom / zoomFactor);
            }

            state.pan.x = mouseX - beforeZoomX * state.zoom;
            state.pan.y = mouseY - beforeZoomY * state.zoom;

            applyPanAndZoom();
            renderLinks();
        });

        // Keyboard Delete listener
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
                    return;
                }
                if (state.selectedNodeIds.length > 0) {
                    const confirm = window.confirm(`Delete the ${state.selectedNodeIds.length} selected node(s)?`);
                    if (confirm) {
                        deleteMultipleNodes(state.selectedNodeIds);
                    }
                }
            }
        });

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        // Sidebar Inputs
        elements.nodeText.addEventListener('input', (e) => {
            // Text updates only the first/primary selected node
            const node = getSelectedNode();
            if (node && state.selectedNodeIds.length === 1) {
                node.text = e.target.value;
                const el = document.getElementById(`node-${node.id}`);
                if (el) el.querySelector('.node-label').textContent = node.text;
                saveLocalState();
            }
        });

        elements.nodeShape.addEventListener('change', (e) => {
            state.selectedNodeIds.forEach(id => {
                const node = state.nodes.find(n => n.id === id);
                if (node) {
                    node.shape = e.target.value;
                    const el = document.getElementById(`node-${node.id}`);
                    if (el) {
                        el.className = `mindmap-node shape-${node.shape} ${state.selectedNodeIds.includes(node.id) ? 'selected' : ''}`;
                    }
                }
            });
            renderLinks();
            saveLocalState();
        });

        elements.nodeRotationSlider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value, 10);
            elements.nodeRotationVal.textContent = val;
            state.selectedNodeIds.forEach(id => {
                const node = state.nodes.find(n => n.id === id);
                if (node) {
                    node.rotation = val;
                    const el = document.getElementById(`node-${node.id}`);
                    if (el) el.style.transform = `rotate(${node.rotation}deg)`;
                }
            });
            saveLocalState();
        });

        elements.nodeSizeSlider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value, 10);
            elements.nodeSizeVal.textContent = val;
            state.selectedNodeIds.forEach(id => {
                const node = state.nodes.find(n => n.id === id);
                if (node) {
                    node.size = val;
                    const el = document.getElementById(`node-${node.id}`);
                    if (el) el.style.fontSize = `${val}px`;
                }
            });
            saveLocalState();
        });

        elements.nodeColorPicker.addEventListener('input', (e) => {
            state.selectedNodeIds.forEach(id => {
                const node = state.nodes.find(n => n.id === id);
                if (node) {
                    node.color = e.target.value;
                    const el = document.getElementById(`node-${node.id}`);
                    if (el) el.style.backgroundColor = node.color;
                }
            });
            elements.colorPresetsContainer.querySelectorAll('.color-preset').forEach(p => p.classList.remove('active'));
            saveLocalState();
        });

        elements.deleteNodeBtn.addEventListener('click', () => {
            if (state.selectedNodeIds.length > 0) {
                const confirm = window.confirm(`Delete the ${state.selectedNodeIds.length} selected node(s)?`);
                if (confirm) {
                    deleteMultipleNodes(state.selectedNodeIds);
                }
            }
        });

        elements.clearBtn.addEventListener('click', clearCanvas);
        elements.arrangeBtn.addEventListener('click', triggerAutoArrange);
        elements.saveJsonBtn.addEventListener('click', exportJson);
        elements.loadJsonInput.addEventListener('change', importJson);
        elements.exportPngBtn.addEventListener('click', exportPng);
    }

    // Helper: Get center coordinate of the canvas area
    function getCanvasCenter() {
        const rect = elements.canvasArea.getBoundingClientRect();
        return {
            x: (rect.width / 2) - state.pan.x,
            y: (rect.height / 2) - state.pan.y
        };
    }

    function createNode(text, x, y, color, shape, size, rotation = 0) {
        return {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            text,
            x: Math.round(x),
            y: Math.round(y),
            color,
            shape,
            size,
            rotation
        };
    }

    function buildColorPresets() {
        elements.colorPresetsContainer.innerHTML = '';
        PRESET_COLORS.forEach(color => {
            const swatch = document.createElement('div');
            swatch.className = 'color-preset';
            swatch.style.backgroundColor = color;
            
            swatch.addEventListener('click', () => {
                const node = getSelectedNode();
                if (node) {
                    node.color = color;
                    elements.nodeColorPicker.value = color;
                    
                    const el = document.getElementById(`node-${node.id}`);
                    if (el) el.style.backgroundColor = color;

                    // Toggle preset active states
                    elements.colorPresetsContainer.querySelectorAll('.color-preset').forEach(p => {
                        p.classList.toggle('active', p.style.backgroundColor === color || rgbToHex(p.style.backgroundColor) === color);
                    });
                    saveLocalState();
                }
            });

            elements.colorPresetsContainer.appendChild(swatch);
        });
    }

    // Canvas Mouse handlers
    function screenToCanvas(clientX, clientY) {
        const rect = elements.canvasArea.getBoundingClientRect();
        return {
            x: (clientX - rect.left - state.pan.x) / state.zoom,
            y: (clientY - rect.top - state.pan.y) / state.zoom
        };
    }

    // Canvas Mouse handlers
    function handleMouseMove(e) {
        // 1. Pan background
        if (state.isPanning) {
            state.pan.x = e.clientX - state.panStart.x;
            state.pan.y = e.clientY - state.panStart.y;
            applyPanAndZoom();
            renderLinks();
            return;
        }

        // 2. Drag select box
        if (state.isSelecting) {
            const rect = elements.canvasArea.getBoundingClientRect();
            const x = Math.min(e.clientX, state.selectStart.x);
            const y = Math.min(e.clientY, state.selectStart.y);
            const w = Math.abs(e.clientX - state.selectStart.x);
            const h = Math.abs(e.clientY - state.selectStart.y);
            
            elements.selectionBox.style.left = `${x - rect.left}px`;
            elements.selectionBox.style.top = `${y - rect.top}px`;
            elements.selectionBox.style.width = `${w}px`;
            elements.selectionBox.style.height = `${h}px`;
            
            const boxMin = screenToCanvas(x, y);
            const boxMax = screenToCanvas(x + w, y + h);
            
            state.selectedNodeIds = [];
            state.nodes.forEach(node => {
                const el = document.getElementById(`node-${node.id}`);
                let nw = 140;
                let nh = 50;
                if (el) {
                    nw = el.offsetWidth;
                    nh = el.offsetHeight;
                }
                
                const nodeMinX = node.x;
                const nodeMaxX = node.x + nw;
                const nodeMinY = node.y;
                const nodeMaxY = node.y + nh;
                
                const intersects = !(nodeMaxX < boxMin.x || nodeMinX > boxMax.x || nodeMaxY < boxMin.y || nodeMinY > boxMax.y);
                if (intersects) {
                    state.selectedNodeIds.push(node.id);
                }
            });
            
            highlightSelectedNodes();
            return;
        }

        // 3. Drag note node
        if (state.dragNodeId) {
            const dx = e.clientX - state.dragStartScreen.x;
            const dy = e.clientY - state.dragStartScreen.y;
            
            state.selectedNodeIds.forEach(id => {
                const node = state.nodes.find(n => n.id === id);
                const orig = state.dragStartNodesCoords[id];
                if (node && orig) {
                    // Offset scaled by active zoom level
                    node.x = Math.round(orig.x + dx / state.zoom);
                    node.y = Math.round(orig.y + dy / state.zoom);
                    
                    const el = document.getElementById(`node-${node.id}`);
                    if (el) {
                        el.style.left = `${node.x}px`;
                        el.style.top = `${node.y}px`;
                    }
                }
            });
            renderLinks();
            return;
        }

        // 4. Connect linkage thread
        if (state.isLinking) {
            const pt = screenToCanvas(e.clientX, e.clientY);
            elements.tempLine.setAttribute('x2', String(pt.x));
            elements.tempLine.setAttribute('y2', String(pt.y));
        }
    }

    function handleMouseUp(e) {
        state.isPanning = false;
        state.dragNodeId = null;

        if (state.isSelecting) {
            state.isSelecting = false;
            elements.selectionBox.classList.add('hidden');
            updateSidebarForSelection();
        }

        if (state.isLinking) {
            state.isLinking = false;
            elements.tempLine.classList.add('hidden');
            
            // Look for dropped node card
            const targetNodeEl = e.target.closest('.mindmap-node');
            if (targetNodeEl) {
                const targetId = targetNodeEl.id.replace('node-', '');
                if (targetId !== state.linkStartNodeId) {
                    // Check duplicate connection
                    const exists = state.links.some(l => 
                        (l.from === state.linkStartNodeId && l.to === targetId) || 
                        (l.from === targetId && l.to === state.linkStartNodeId)
                    );
                    if (!exists) {
                        state.links.push({ from: state.linkStartNodeId, to: targetId });
                        saveLocalState();
                        renderLinks();
                    }
                }
            }
        }
        saveLocalState();
    }

    function applyPanAndZoom() {
        // Move container transform and scale
        elements.nodesContainer.style.transform = `translate(${state.pan.x}px, ${state.pan.y}px) scale(${state.zoom})`;
        elements.nodesContainer.style.transformOrigin = '0 0';
        
        elements.zoomGroup.setAttribute('transform', `translate(${state.pan.x}, ${state.pan.y}) scale(${state.zoom})`);
        
        // Scale and pan background grid
        const size = 30 * state.zoom;
        elements.canvasArea.style.backgroundSize = `${size}px ${size}px`;
        elements.canvasArea.style.backgroundPosition = `${state.pan.x}px ${state.pan.y}px`;
    }

    // Node interactions
    function selectNode(id) {
        if (state.selectedNodeIds.includes(id) && state.selectedNodeIds.length === 1) return;
        state.selectedNodeIds = [id];
        highlightSelectedNodes();
        updateSidebarForSelection();
    }

    function deselectNode() {
        state.selectedNodeIds = [];
        highlightSelectedNodes();
        updateSidebarForSelection();
    }

    function highlightSelectedNodes() {
        state.nodes.forEach(node => {
            const el = document.getElementById(`node-${node.id}`);
            if (el) {
                el.classList.toggle('selected', state.selectedNodeIds.includes(node.id));
            }
        });
    }

    function updateSidebarForSelection() {
        if (state.selectedNodeIds.length === 0) {
            elements.nodeSettings.classList.add('hidden');
            elements.noSelectionHint.classList.remove('hidden');
        } else {
            elements.noSelectionHint.classList.add('hidden');
            elements.nodeSettings.classList.remove('hidden');

            if (state.selectedNodeIds.length === 1) {
                const node = state.nodes.find(n => n.id === state.selectedNodeIds[0]);
                if (node) {
                    elements.nodeText.disabled = false;
                    elements.nodeText.value = node.text;
                    elements.nodeShape.value = node.shape;
                    elements.nodeRotationSlider.value = node.rotation || 0;
                    elements.nodeRotationVal.textContent = node.rotation || 0;
                    elements.nodeSizeSlider.value = node.size;
                    elements.nodeSizeVal.textContent = node.size;
                    elements.nodeColorPicker.value = node.color;
                    
                    elements.colorPresetsContainer.querySelectorAll('.color-preset').forEach(p => {
                        p.classList.toggle('active', p.style.backgroundColor === node.color || rgbToHex(p.style.backgroundColor) === node.color);
                    });
                }
            } else {
                // Batch styling mode
                elements.nodeText.disabled = true;
                elements.nodeText.value = `[Multiple Nodes Selected]`;
                
                // Set default fields to first item to avoid empty selections
                const node = state.nodes.find(n => n.id === state.selectedNodeIds[0]);
                if (node) {
                    elements.nodeShape.value = node.shape;
                    elements.nodeRotationSlider.value = node.rotation || 0;
                    elements.nodeRotationVal.textContent = node.rotation || 0;
                    elements.nodeSizeSlider.value = node.size;
                    elements.nodeSizeVal.textContent = node.size;
                    elements.nodeColorPicker.value = node.color;
                }
            }
        }
    }

    function deleteNode(id) {
        state.nodes = state.nodes.filter(n => n.id !== id);
        state.links = state.links.filter(l => l.from !== id && l.to !== id);
        
        deselectNode();
        saveLocalState();
        renderAll();
    }

    function deleteMultipleNodes(ids) {
        state.nodes = state.nodes.filter(n => !ids.includes(n.id));
        state.links = state.links.filter(l => !ids.includes(l.from) && !ids.includes(l.to));
        
        deselectNode();
        saveLocalState();
        renderAll();
    }

    function clearCanvas() {
        const confirm = window.confirm(`Clear the flowchart nodes?`);
        if (!confirm) return;
        
        state.nodes = [];
        state.links = [];
        state.pan = { x: 0, y: 0 };
        state.zoom = 1.0;
        deselectNode();
        saveLocalState();
        renderAll();
    }

    // Layout render loop
    function renderAll() {
        elements.nodesContainer.innerHTML = '';
        state.nodes.forEach(node => {
            createNodeEl(node);
        });
        applyPanAndZoom();
        renderLinks();
    }

    function createNodeEl(node) {
        const card = document.createElement('div');
        card.className = `mindmap-node shape-${node.shape}`;
        card.id = `node-${node.id}`;
        card.style.backgroundColor = node.color;
        card.style.fontSize = `${node.size}px`;
        card.style.left = `${node.x}px`;
        card.style.top = `${node.y}px`;
        card.style.transform = `rotate(${node.rotation || 0}deg)`;
        
        if (state.selectedNodeIds.includes(node.id)) {
            card.classList.add('selected');
        }

        const label = document.createElement('div');
        label.className = 'node-label';
        label.textContent = node.text;
        card.appendChild(label);

        // Connection Handle (+ ring icon)
        const connector = document.createElement('div');
        connector.className = 'node-connector';
        connector.title = 'Drag to connect node';
        
        connector.addEventListener('mousedown', (e) => {
            e.stopPropagation(); // Avoid card drags
            state.isLinking = true;
            state.linkStartNodeId = node.id;
            
            // Calculate center pivots in local coordinate space
            const w = card.offsetWidth;
            const h = card.offsetHeight;
            const x = node.x + w / 2;
            const y = node.y + h / 2;
            
            elements.tempLine.setAttribute('x1', String(x));
            elements.tempLine.setAttribute('y1', String(y));
            elements.tempLine.setAttribute('x2', String(x));
            elements.tempLine.setAttribute('y2', String(y));
            elements.tempLine.classList.remove('hidden');
        });

        card.appendChild(connector);

        // Click/Selection Event
        card.addEventListener('mousedown', (e) => {
            if (e.target.closest('.node-connector')) return;
            e.stopPropagation();
            
            // Toggle selection with Shift or Ctrl keys
            if (e.shiftKey || e.ctrlKey) {
                if (state.selectedNodeIds.includes(node.id)) {
                    state.selectedNodeIds = state.selectedNodeIds.filter(id => id !== node.id);
                } else {
                    state.selectedNodeIds.push(node.id);
                }
                highlightSelectedNodes();
                updateSidebarForSelection();
            } else {
                if (!state.selectedNodeIds.includes(node.id)) {
                    selectNode(node.id);
                }
            }
            
            // Prep drag coordinate offsets for all selected nodes
            state.dragNodeId = node.id;
            state.dragStartScreen = { x: e.clientX, y: e.clientY };
            state.dragStartNodesCoords = {};
            state.selectedNodeIds.forEach(id => {
                const n = state.nodes.find(item => item.id === id);
                if (n) {
                    state.dragStartNodesCoords[id] = { x: n.x, y: n.y };
                }
            });
        });

        elements.nodesContainer.appendChild(card);
    }

    function renderLinks() {
        elements.linksGroup.innerHTML = '';
        state.links.forEach((link, index) => {
            const fromNode = state.nodes.find(n => n.id === link.from);
            const toNode = state.nodes.find(n => n.id === link.to);
            if (!fromNode || !toNode) return;

            const fromEl = document.getElementById(`node-${link.from}`);
            const toEl = document.getElementById(`node-${link.to}`);
            
            let w1 = 140, h1 = 50;
            let w2 = 140, h2 = 50;
            if (fromEl) {
                w1 = fromEl.offsetWidth;
                h1 = fromEl.offsetHeight;
            }
            if (toEl) {
                w2 = toEl.offsetWidth;
                h2 = toEl.offsetHeight;
            }

            // Connection coordinates computed directly using board coordinates
            const x1 = fromNode.x + w1 / 2;
            const y1 = fromNode.y + h1 / 2;
            const x2 = toNode.x + w2 / 2;
            const y2 = toNode.y + h2 / 2;

            // Draw curved bezier line connector
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.className.baseVal = 'link-line';
            path.setAttribute('marker-end', 'url(#arrow)');
            
            // Midpoint coordinates control anchors
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;
            const controlY = y1; // Keep curves horizontal-ish
            
            const pathStr = `M ${x1} ${y1} C ${midX} ${controlY}, ${midX} ${y2}, ${x2} ${y2}`;
            path.setAttribute('d', pathStr);
            path.setAttribute('title', 'Click link to delete connection');

            // Delete link on hover-click
            path.addEventListener('click', () => {
                const confirmed = window.confirm('Remove this connection link?');
                if (confirmed) {
                    state.links = state.links.filter((_, idx) => idx !== index);
                    saveLocalState();
                    renderLinks();
                }
            });

            elements.linksGroup.appendChild(path);
        });
    }

    // Verlet Spring Auto-Arrange physics solver
    function triggerAutoArrange() {
        if (state.nodes.length === 0) return;
        deselectNode();

        const center = getCanvasCenter();
        const width = elements.canvasArea.clientWidth;
        const height = elements.canvasArea.clientHeight;

        // Force parameters
        const restLength = 150; 
        const kSpring = 0.05;  // Spring hook stiffness constant
        const kRepel = 22000;   // Repulsion power constant
        const gravity = 0.02;   // Central gravity index

        // Setup node physics arrays
        const nodesPhys = state.nodes.map(node => ({
            node,
            x: node.x,
            y: node.y,
            vx: 0,
            vy: 0
        }));

        let tick = 0;
        const maxTicks = 120; // 2 seconds of smooth physics sweep animation

        function runPhysTick() {
            if (tick >= maxTicks) {
                // Done! Update states and save coordinates
                nodesPhys.forEach(np => {
                    np.node.x = Math.round(np.x);
                    np.node.y = Math.round(np.y);
                });
                saveLocalState();
                renderAll();
                return;
            }

            // 1. Calculate Node Repulsion Forces
            for (let i = 0; i < nodesPhys.length; i++) {
                for (let j = i + 1; j < nodesPhys.length; j++) {
                    const n1 = nodesPhys[i];
                    const n2 = nodesPhys[j];
                    
                    const dx = n2.x - n1.x;
                    const dy = n2.y - n1.y;
                    const distSq = dx * dx + dy * dy + 0.1; // prevent division by zero
                    const dist = Math.sqrt(distSq);

                    if (dist < 400) {
                        const force = kRepel / distSq;
                        const fx = (dx / dist) * force;
                        const fy = (dy / dist) * force;
                        
                        // Push away from each other
                        n1.vx -= fx;
                        n1.vy -= fy;
                        n2.vx += fx;
                        n2.vy += fy;
                    }
                }
            }

            // 2. Calculate Link Spring Attraction Forces
            state.links.forEach(link => {
                const n1 = nodesPhys.find(n => n.node.id === link.from);
                const n2 = nodesPhys.find(n => n.node.id === link.to);
                if (!n1 || !n2) return;

                const dx = n2.x - n1.x;
                const dy = n2.y - n1.y;
                const dist = Math.sqrt(dx * dx + dy * dy) + 0.1;
                
                const force = kSpring * (dist - restLength);
                const fx = (dx / dist) * force;
                const fy = (dy / dist) * force;

                // Pull closer
                n1.vx += fx;
                n1.vy += fy;
                n2.vx -= fx;
                n2.vy -= fy;
            });

            // 3. Central gravity (pull towards the canvas center)
            nodesPhys.forEach(n => {
                const dx = center.x - n.x;
                const dy = center.y - n.y;
                n.vx += dx * gravity;
                n.vy += dy * gravity;
                
                // Damp velocity vectors (friction drag)
                n.vx *= 0.75;
                n.vy *= 0.75;

                // Apply velocity cap
                const speed = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
                const speedCap = 25;
                if (speed > speedCap) {
                    n.vx = (n.vx / speed) * speedCap;
                    n.vy = (n.vy / speed) * speedCap;
                }

                // Update position
                n.x += n.vx;
                n.y += n.vy;
            });

            // Draw current physics ticks visually
            nodesPhys.forEach(np => {
                const el = document.getElementById(`node-${np.node.id}`);
                if (el) {
                    el.style.left = `${np.x}px`;
                    el.style.top = `${np.y}px`;
                }
            });
            renderLinks();

            tick++;
            requestAnimationFrame(runPhysTick);
        }

        runPhysTick();
    }

    // JSON file operations
    function exportJson() {
        const dataStr = JSON.stringify({
            nodes: state.nodes,
            links: state.links,
            pan: state.pan
        }, null, 4);

        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'mindmap_diagram.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function importJson(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                state.nodes = Array.isArray(data.nodes) ? data.nodes : [];
                state.links = Array.isArray(data.links) ? data.links : [];
                state.pan = data.pan || { x: 0, y: 0 };
                
                deselectNode();
                saveLocalState();
                renderAll();
                window.alert('MindMap loaded successfully!');
            } catch (err) {
                window.alert('Error parsing JSON diagram file.');
            }
        };
        reader.readAsText(file);
        elements.loadJsonInput.value = '';
    }

    // Render Canvas PNG exporter purely client-side
    function exportPng() {
        if (state.nodes.length === 0) return;

        // Calculate bounding box containing all nodes
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;

        state.nodes.forEach(node => {
            // Assume max node dimension is around 250px by 100px for safety padding bounds
            minX = Math.min(minX, node.x - 120);
            minY = Math.min(minY, node.y - 60);
            maxX = Math.max(maxX, node.x + 120);
            maxY = Math.max(maxY, node.y + 60);
        });

        const width = maxX - minX;
        const height = maxY - minY;
        const padding = 50;

        const canvas = elements.exportCanvas;
        canvas.width = width + padding * 2;
        canvas.height = height + padding * 2;
        
        const ctx = canvas.getContext('2d');

        // Clear canvas context to ensure transparency is preserved
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Adjust coordinates relative to bounding box minX/minY offset with padding
        const getAdjCoords = (x, y) => ({
            x: x - minX + padding,
            y: y - minY + padding
        });

        // 2. Draw connections (lines/curves)
        state.links.forEach(link => {
            const from = state.nodes.find(n => n.id === link.from);
            const to = state.nodes.find(n => n.id === link.to);
            if (!from || !to) return;

            const p1 = getAdjCoords(from.x, from.y);
            const p2 = getAdjCoords(to.x, to.y);

            ctx.strokeStyle = '#6366f1';
            ctx.lineWidth = 3;
            ctx.beginPath();
            
            // Draw matching bezier curves
            const midX = (p1.x + p2.x) / 2;
            ctx.moveTo(p1.x, p1.y);
            ctx.bezierCurveTo(midX, p1.y, midX, p2.y, p2.x, p2.y);
            ctx.stroke();

            // Draw line end arrow marker
            const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
            // Back off slightly from center pivot to place arrow cleanly on target borders
            const arrowX = p2.x - 40 * Math.cos(angle);
            const arrowY = p2.y - 30 * Math.sin(angle);
            
            ctx.fillStyle = '#6366f1';
            ctx.beginPath();
            ctx.moveTo(arrowX, arrowY);
            ctx.lineTo(arrowX - 10 * Math.cos(angle - Math.PI / 6), arrowY - 10 * Math.sin(angle - Math.PI / 6));
            ctx.lineTo(arrowX - 10 * Math.cos(angle + Math.PI / 6), arrowY - 10 * Math.sin(angle + Math.PI / 6));
            ctx.closePath();
            ctx.fill();
        });

        // 3. Draw nodes
        state.nodes.forEach(node => {
            const p = getAdjCoords(node.x, node.y);
            const fontSz = node.size || 14;

            ctx.font = `500 ${fontSz}px "Inter", sans-serif`;
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Wrap text into multiple lines
            const lines = wrapText(ctx, node.text, 140);
            const textHeight = lines.length * (fontSz + 4);
            
            // Compute dimensions based on shapes
            let w = Math.max(120, 100);
            let h = Math.max(50, textHeight + 24);
            if (node.shape === 'pill') {
                w = Math.max(120, ctx.measureText(node.text).width + 36);
                h = Math.max(46, textHeight + 20);
            } else if (node.shape === 'oval') {
                w = 140;
                h = 100;
            }

            ctx.save();
            // Translate to node center
            ctx.translate(p.x, p.y);
            // Rotate context
            const angle = (node.rotation || 0) * Math.PI / 180;
            ctx.rotate(angle);

            // Draw node background capsule
            ctx.fillStyle = node.color;
            ctx.beginPath();
            if (node.shape === 'pill') {
                drawRoundRect(ctx, -w/2, -h/2, w, h, h/2);
            } else if (node.shape === 'rounded-rect') {
                drawRoundRect(ctx, -w/2, -h/2, w, h, 8);
            } else if (node.shape === 'oval') {
                ctx.ellipse(0, 0, w/2, h/2, 0, 0, 2 * Math.PI);
            } else if (node.shape === 'arrow') {
                ctx.moveTo(-w/2, -h/5);
                ctx.lineTo(w/10, -h/5);
                ctx.lineTo(w/10, -h/2);
                ctx.lineTo(w/2, 0);
                ctx.lineTo(w/10, h/2);
                ctx.lineTo(w/10, h/5);
                ctx.lineTo(-w/2, h/5);
                ctx.closePath();
            }
            ctx.fill();

            // Draw border outline
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Render node labels
            ctx.fillStyle = '#ffffff';
            lines.forEach((line, index) => {
                const lineY = -(textHeight / 2) + (index * (fontSz + 4)) + (fontSz / 2) + 2;
                ctx.fillText(line, 0, lineY);
            });

            ctx.restore();
        });

        // Trigger file download
        const url = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = url;
        a.download = 'mindmap_flowchart.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    // Helper: Wrap canvas labels text to multi-lines
    function wrapText(ctx, text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = words[0] || '';

        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = ctx.measureText(currentLine + " " + word).width;
            if (width < maxWidth) {
                currentLine += " " + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);
        return lines;
    }

    function drawRoundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }

    // Local Storage helpers
    function saveLocalState() {
        localStorage.setItem('mindmap_nodes', JSON.stringify(state.nodes));
        localStorage.setItem('mindmap_links', JSON.stringify(state.links));
        localStorage.setItem('mindmap_pan', JSON.stringify(state.pan));
        localStorage.setItem('mindmap_zoom', JSON.stringify(state.zoom));
    }

    // Local Storage helpers
    function loadLocalState() {
        const nodes = localStorage.getItem('mindmap_nodes');
        const links = localStorage.getItem('mindmap_links');
        const pan = localStorage.getItem('mindmap_pan');
        const zoom = localStorage.getItem('mindmap_zoom');
        
        if (nodes) state.nodes = JSON.parse(nodes);
        if (links) state.links = JSON.parse(links);
        if (pan) state.pan = JSON.parse(pan);
        if (zoom) state.zoom = JSON.parse(zoom);
    }

    // Helpers
    function rgbToHex(rgbStr) {
        if (!rgbStr.startsWith('rgb')) return rgbStr;
        const vals = rgbStr.match(/\d+/g).map(Number);
        return "#" + ((1 << 24) + (vals[0] << 16) + (vals[1] << 8) + vals[2]).toString(16).slice(1);
    }

    function getSelectedNode() {
        return state.nodes.find(n => n.id === state.selectedNodeIds[0]);
    }
})();

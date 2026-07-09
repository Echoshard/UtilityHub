const state = {
    originalCanvas: document.createElement('canvas'),
    editCanvas: document.createElement('canvas'),
    fileName: 'image',
    hasImage: false,
    tool: 'move',
    shape: 'circle',
    zoom: 1,
    panX: 0,
    panY: 0,
    isSpaceDown: false,
    isPointerDown: false,
    isPanning: false,
    lastPointer: null,
    brushSize: 32,
    hardness: 80,
    tolerance: 32,
    targetColor: null,
    healSource: null,
    healOffset: null,
    healMask: null,
    healMaskBounds: null,
    lastStrokeImage: null,
    selection: null,
    cropRect: null,
    cropDragHandle: null,
    resizeBox: null,
    resizePreview: null,
    history: [],
    adjustments: {
        brightness: 0,
        contrast: 0,
        saturation: 0
    }
};

const canvas = document.getElementById('viewportCanvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const stage = document.getElementById('canvasStage');
const toolsPanel = document.querySelector('.tools-panel');
const adjustPanel = document.querySelector('.adjust-panel');
const emptyState = document.getElementById('emptyState');
const imageMeta = document.getElementById('imageMeta');
const fileInput = document.getElementById('fileInput');
const editCtx = state.editCanvas.getContext('2d', { willReadFrequently: true });

const controls = {
    undo: document.getElementById('undoBtn'),
    reset: document.getElementById('resetBtn'),
    download: document.getElementById('downloadBtn'),
    rotateLeft: document.getElementById('rotateLeftBtn'),
    rotateRight: document.getElementById('rotateRightBtn'),
    flipX: document.getElementById('flipXBtn'),
    flipY: document.getElementById('flipYBtn'),
    brushSize: document.getElementById('brushSizeRange'),
    brushSizeValue: document.getElementById('brushSizeValue'),
    hardness: document.getElementById('hardnessRange'),
    hardnessValue: document.getElementById('hardnessValue'),
    paintColor: document.getElementById('paintColorInput'),
    paintHex: document.getElementById('paintHexInput'),
    tolerance: document.getElementById('toleranceRange'),
    toleranceValue: document.getElementById('toleranceValue'),
    targetSwatch: document.getElementById('targetSwatch'),
    targetText: document.getElementById('targetText'),
    spotHeal: document.getElementById('spotHealCheck'),
    clearSelection: document.getElementById('clearSelectionBtn'),
    cropX: document.getElementById('cropXInput'),
    cropY: document.getElementById('cropYInput'),
    cropW: document.getElementById('cropWInput'),
    cropH: document.getElementById('cropHInput'),
    centerCrop: document.getElementById('centerCropBtn'),
    applyCrop: document.getElementById('applyCropBtn'),
    width: document.getElementById('widthInput'),
    height: document.getElementById('heightInput'),
    lockRatio: document.getElementById('lockRatioCheck'),
    applyResize: document.getElementById('applyResizeBtn'),
    filterPreset: document.getElementById('filterPresetSelect'),
    brightness: document.getElementById('brightnessRange'),
    brightnessValue: document.getElementById('brightnessValue'),
    contrast: document.getElementById('contrastRange'),
    contrastValue: document.getElementById('contrastValue'),
    saturation: document.getElementById('saturationRange'),
    saturationValue: document.getElementById('saturationValue'),
    previewAdjust: document.getElementById('previewAdjustBtn'),
    applyAdjust: document.getElementById('applyAdjustBtn'),
    transparent: document.getElementById('transparentCheck'),
    backgroundColor: document.getElementById('backgroundColorInput'),
    applyBackground: document.getElementById('applyBackgroundBtn'),
    format: document.getElementById('formatSelect'),
    quality: document.getElementById('qualityRange'),
    qualityValue: document.getElementById('qualityValue')
};

const adjustmentSliders = [
    ['brightness', controls.brightness, controls.brightnessValue],
    ['contrast', controls.contrast, controls.contrastValue],
    ['saturation', controls.saturation, controls.saturationValue]
];

const FILTER_PRESETS = {
    normal: { brightness: 0, contrast: 0, saturation: 0 },
    mono: { brightness: 0, contrast: 8, saturation: -100 },
    warm: { brightness: 6, contrast: 8, saturation: 18 },
    cool: { brightness: 2, contrast: 10, saturation: 10 },
    punch: { brightness: 4, contrast: 24, saturation: 28 },
    fade: { brightness: 10, contrast: -18, saturation: -18 },
    bright: { brightness: 18, contrast: 8, saturation: 8 },
    noir: { brightness: -6, contrast: 32, saturation: -100 }
};

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function setEnabled(enabled) {
    [
        controls.undo,
        controls.reset,
        controls.download,
        controls.rotateLeft,
        controls.rotateRight,
        controls.flipX,
        controls.flipY,
        controls.cropX,
        controls.cropY,
        controls.cropW,
        controls.cropH,
        controls.centerCrop,
        controls.applyCrop,
        controls.width,
        controls.height,
        controls.applyResize,
        controls.filterPreset,
        controls.brightness,
        controls.contrast,
        controls.saturation,
        controls.previewAdjust,
        controls.applyAdjust,
        controls.applyBackground
    ].forEach(el => {
        el.disabled = !enabled;
    });
    controls.clearSelection.disabled = true;
}

function updateMeta() {
    if (!state.hasImage) {
        imageMeta.textContent = 'No image loaded';
        return;
    }
    imageMeta.textContent = `${state.fileName} - ${state.editCanvas.width} x ${state.editCanvas.height} - ${Math.round(state.zoom * 100)}%`;
}

function resizeViewport() {
    const rect = stage.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    render();
}

function screenSize() {
    return {
        width: canvas.clientWidth || stage.clientWidth,
        height: canvas.clientHeight || stage.clientHeight
    };
}

function imageToScreen(x, y) {
    return {
        x: state.panX + x * state.zoom,
        y: state.panY + y * state.zoom
    };
}

function screenToImage(x, y) {
    return {
        x: (x - state.panX) / state.zoom,
        y: (y - state.panY) / state.zoom
    };
}

function getPointer(event) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        image: screenToImage(event.clientX - rect.left, event.clientY - rect.top)
    };
}

function fitToViewport() {
    const view = screenSize();
    const margin = 80;
    const scaleX = (view.width - margin) / state.editCanvas.width;
    const scaleY = (view.height - margin) / state.editCanvas.height;
    state.zoom = clamp(Math.min(scaleX, scaleY), 0.05, 8);
    state.panX = (view.width - state.editCanvas.width * state.zoom) / 2;
    state.panY = (view.height - state.editCanvas.height * state.zoom) / 2;
    updateMeta();
}

function drawCheckerboard() {
    const view = screenSize();
    ctx.clearRect(0, 0, view.width, view.height);
    ctx.fillStyle = '#090d13';
    ctx.fillRect(0, 0, view.width, view.height);
    const tile = 24;
    for (let y = 0; y < view.height; y += tile) {
        for (let x = 0; x < view.width; x += tile) {
            ctx.fillStyle = ((x / tile + y / tile) % 2 === 0) ? '#111827' : '#0b1120';
            ctx.fillRect(x, y, tile, tile);
        }
    }
}

function render() {
    drawCheckerboard();
    if (!state.hasImage) return;

    const imageX = state.panX;
    const imageY = state.panY;
    const displayWidth = state.tool === 'resize' && state.resizePreview ? state.resizePreview.width : state.editCanvas.width;
    const displayHeight = state.tool === 'resize' && state.resizePreview ? state.resizePreview.height : state.editCanvas.height;
    const imageW = displayWidth * state.zoom;
    const imageH = displayHeight * state.zoom;

    ctx.save();
    ctx.imageSmoothingEnabled = state.zoom < 2;
    ctx.drawImage(state.editCanvas, imageX, imageY, imageW, imageH);
    ctx.strokeStyle = 'rgba(255,255,255,0.38)';
    ctx.lineWidth = 1;
    ctx.strokeRect(Math.round(imageX) + 0.5, Math.round(imageY) + 0.5, imageW, imageH);
    ctx.restore();

    drawSelectionOverlay();
    drawHealMaskOverlay();
    drawCropOverlay();
    drawResizeOverlay();
    drawBrushPreview();
}

function drawBrushPreview() {
    if (!state.lastPointer || !['brush', 'eraser', 'bgEraser', 'heal'].includes(state.tool)) return;
    const radius = state.brushSize * state.zoom / 2;
    ctx.save();
    ctx.strokeStyle = state.tool === 'eraser' || state.tool === 'bgEraser' ? '#ef4444' : '#5eead4';
    ctx.lineWidth = 1.5;
    if (state.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(state.lastPointer.x, state.lastPointer.y, radius, 0, Math.PI * 2);
        ctx.stroke();
    } else {
        ctx.strokeRect(state.lastPointer.x - radius, state.lastPointer.y - radius, radius * 2, radius * 2);
    }
    ctx.restore();
}

function drawCropOverlay() {
    if (state.tool !== 'crop' || !state.cropRect) return;
    const rect = normalizeRect(state.cropRect);
    const a = imageToScreen(rect.x, rect.y);
    const b = imageToScreen(rect.x + rect.w, rect.y + rect.h);
    const imageLeft = state.panX;
    const imageTop = state.panY;
    const imageWidth = state.editCanvas.width * state.zoom;
    const imageHeight = state.editCanvas.height * state.zoom;
    const cropLeft = a.x;
    const cropTop = a.y;
    const cropWidth = b.x - a.x;
    const cropHeight = b.y - a.y;

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.42)';
    ctx.fillRect(imageLeft, imageTop, imageWidth, cropTop - imageTop);
    ctx.fillRect(imageLeft, cropTop + cropHeight, imageWidth, imageTop + imageHeight - cropTop - cropHeight);
    ctx.fillRect(imageLeft, cropTop, cropLeft - imageLeft, cropHeight);
    ctx.fillRect(cropLeft + cropWidth, cropTop, imageLeft + imageWidth - cropLeft - cropWidth, cropHeight);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 5]);
    ctx.strokeRect(cropLeft, cropTop, cropWidth, cropHeight);
    ctx.setLineDash([]);
    drawCropHandles(cropLeft, cropTop, cropWidth, cropHeight);
    ctx.restore();
}

function drawCropHandles(x, y, width, height) {
    const points = [
        [x + width / 2, y],
        [x + width, y + height / 2],
        [x + width / 2, y + height],
        [x, y + height / 2]
    ];
    ctx.fillStyle = '#f59e0b';
    points.forEach(([px, py]) => {
        ctx.fillRect(px - 5, py - 5, 10, 10);
    });
}

function drawResizeOverlay() {
    if (state.tool !== 'resize' || !state.resizePreview) return;
    const a = imageToScreen(0, 0);
    const w = state.resizePreview.width * state.zoom;
    const h = state.resizePreview.height * state.zoom;
    ctx.save();
    ctx.strokeStyle = '#14b8a6';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 6]);
    ctx.strokeRect(a.x, a.y, w, h);
    ctx.fillStyle = '#14b8a6';
    drawHandle(a.x + w, a.y + h);
    ctx.setLineDash([]);
    ctx.restore();
}

function getCropHandle(point) {
    if (!state.cropRect) return null;
    const rect = normalizeRect(state.cropRect);
    const hit = Math.max(6, 14 / state.zoom);
    const insideX = point.x >= rect.x - hit && point.x <= rect.x + rect.w + hit;
    const insideY = point.y >= rect.y - hit && point.y <= rect.y + rect.h + hit;
    if (!insideX || !insideY) return nearestCropHandle(point);

    const distances = [
        { handle: 'left', value: Math.abs(point.x - rect.x) },
        { handle: 'right', value: Math.abs(point.x - (rect.x + rect.w)) },
        { handle: 'top', value: Math.abs(point.y - rect.y) },
        { handle: 'bottom', value: Math.abs(point.y - (rect.y + rect.h)) }
    ].sort((a, b) => a.value - b.value);

    return distances[0].value <= hit ? distances[0].handle : nearestCropHandle(point);
}

function nearestCropHandle(point) {
    const rect = normalizeRect(state.cropRect);
    const distances = [
        { handle: 'left', value: Math.abs(point.x - rect.x) },
        { handle: 'right', value: Math.abs(point.x - (rect.x + rect.w)) },
        { handle: 'top', value: Math.abs(point.y - rect.y) },
        { handle: 'bottom', value: Math.abs(point.y - (rect.y + rect.h)) }
    ].sort((a, b) => a.value - b.value);
    return distances[0].handle;
}

function dragCropSide(point) {
    const rect = normalizeRect(state.cropRect);
    const right = rect.x + rect.w;
    const bottom = rect.y + rect.h;

    if (state.cropDragHandle === 'left') {
        const x = clamp(point.x, 0, right - 1);
        state.cropRect = { x, y: rect.y, w: right - x, h: rect.h };
    } else if (state.cropDragHandle === 'right') {
        const newRight = clamp(point.x, rect.x + 1, state.editCanvas.width);
        state.cropRect = { x: rect.x, y: rect.y, w: newRight - rect.x, h: rect.h };
    } else if (state.cropDragHandle === 'top') {
        const y = clamp(point.y, 0, bottom - 1);
        state.cropRect = { x: rect.x, y, w: rect.w, h: bottom - y };
    } else if (state.cropDragHandle === 'bottom') {
        const newBottom = clamp(point.y, rect.y + 1, state.editCanvas.height);
        state.cropRect = { x: rect.x, y: rect.y, w: rect.w, h: newBottom - rect.y };
    }
}

function drawHandle(x, y) {
    ctx.fillRect(x - 5, y - 5, 10, 10);
}

function drawSelectionOverlay() {
    if (!state.selection) return;
    const data = state.selection.data;
    const width = state.selection.width;
    const height = state.selection.height;
    ctx.save();
    ctx.fillStyle = 'rgba(20,184,166,0.23)';
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (!data[y * width + x]) continue;
            const s = imageToScreen(x, y);
            ctx.fillRect(s.x, s.y, Math.max(1, state.zoom), Math.max(1, state.zoom));
        }
    }
    ctx.strokeStyle = '#5eead4';
    ctx.lineWidth = 1;
    const b = state.selection.bounds;
    const p = imageToScreen(b.x, b.y);
    ctx.strokeRect(p.x, p.y, b.w * state.zoom, b.h * state.zoom);
    ctx.restore();
}

function drawHealMaskOverlay() {
    if (state.tool !== 'heal' || !state.healMask || !controls.spotHeal.checked) return;
    ctx.save();
    ctx.globalAlpha = 0.32;
    ctx.drawImage(
        state.healMask,
        state.panX,
        state.panY,
        state.editCanvas.width * state.zoom,
        state.editCanvas.height * state.zoom
    );
    ctx.restore();
}

function pushHistory() {
    if (!state.hasImage) return;
    const snapshot = document.createElement('canvas');
    snapshot.width = state.editCanvas.width;
    snapshot.height = state.editCanvas.height;
    snapshot.getContext('2d').drawImage(state.editCanvas, 0, 0);
    state.history.push(snapshot);
    if (state.history.length > 30) state.history.shift();
    controls.undo.disabled = state.history.length === 0;
}

function undo() {
    const snapshot = state.history.pop();
    if (!snapshot) return;
    state.editCanvas.width = snapshot.width;
    state.editCanvas.height = snapshot.height;
    editCtx.drawImage(snapshot, 0, 0);
    syncFields();
    controls.undo.disabled = state.history.length === 0;
    render();
}

function syncFields() {
    controls.width.value = state.editCanvas.width;
    controls.height.value = state.editCanvas.height;
    syncCropFields();
    updateMeta();
}

function syncCropFields() {
    const rect = normalizeRect(state.cropRect || { x: 0, y: 0, w: state.editCanvas.width, h: state.editCanvas.height });
    controls.cropX.value = Math.round(rect.x);
    controls.cropY.value = Math.round(rect.y);
    controls.cropW.value = Math.round(rect.w);
    controls.cropH.value = Math.round(rect.h);
}

function loadFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
        const img = new Image();
        img.onload = () => {
            state.fileName = file.name.replace(/\.[^.]+$/, '') || 'image';
            state.hasImage = true;
            state.history = [];
            state.selection = null;
            state.targetColor = null;
            state.healSource = null;
            state.healMask = null;
            state.healMaskBounds = null;
            state.lastStrokeImage = null;
            state.cropRect = null;
            state.resizePreview = null;

            state.originalCanvas.width = img.naturalWidth;
            state.originalCanvas.height = img.naturalHeight;
            state.originalCanvas.getContext('2d').drawImage(img, 0, 0);

            state.editCanvas.width = img.naturalWidth;
            state.editCanvas.height = img.naturalHeight;
            editCtx.clearRect(0, 0, state.editCanvas.width, state.editCanvas.height);
            editCtx.drawImage(img, 0, 0);

            emptyState.classList.add('hidden');
            setEnabled(true);
            syncFields();
            fitToViewport();
            updateTargetUI();
            setTool('move');
        };
        img.src = reader.result;
    };
    reader.readAsDataURL(file);
}

function normalizeRect(rect) {
    const x = Math.min(rect.x, rect.x + rect.w);
    const y = Math.min(rect.y, rect.y + rect.h);
    const w = Math.abs(rect.w);
    const h = Math.abs(rect.h);
    return {
        x: clamp(x, 0, state.editCanvas.width),
        y: clamp(y, 0, state.editCanvas.height),
        w: clamp(w, 1, state.editCanvas.width - clamp(x, 0, state.editCanvas.width)),
        h: clamp(h, 1, state.editCanvas.height - clamp(y, 0, state.editCanvas.height))
    };
}

function sampleColor(x, y) {
    x = clamp(Math.floor(x), 0, state.editCanvas.width - 1);
    y = clamp(Math.floor(y), 0, state.editCanvas.height - 1);
    const px = editCtx.getImageData(x, y, 1, 1).data;
    return [px[0], px[1], px[2], px[3]];
}

function colorDistance(a, b) {
    const dr = a[0] - b[0];
    const dg = a[1] - b[1];
    const db = a[2] - b[2];
    return Math.sqrt(dr * dr + dg * dg + db * db);
}

function rgbToHex(color) {
    return `#${[color[0], color[1], color[2]].map(v => v.toString(16).padStart(2, '0')).join('')}`;
}

function updateTargetUI() {
    if (!state.targetColor) {
        controls.targetSwatch.style.background = '';
        controls.targetText.textContent = 'No target';
        return;
    }
    const hex = rgbToHex(state.targetColor);
    controls.targetSwatch.style.background = hex;
    controls.targetText.textContent = hex;
}

function pickPaintColor(point) {
    const color = sampleColor(point.image.x, point.image.y);
    const hex = rgbToHex(color);
    controls.paintColor.value = hex;
    controls.paintHex.value = hex;
}

function setTool(tool) {
    state.tool = tool;
    toolsPanel.dataset.activeTool = tool;
    adjustPanel.dataset.activeTool = tool;
    document.querySelectorAll('[data-tool]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tool === tool);
    });
    if (tool !== 'crop') {
        state.cropRect = null;
        state.cropDragHandle = null;
    }
    if (tool !== 'resize') {
        state.resizePreview = null;
    }
    if (tool === 'crop' && state.hasImage) {
        state.cropRect = { x: 0, y: 0, w: state.editCanvas.width, h: state.editCanvas.height };
        syncCropFields();
    }
    if (tool === 'resize' && state.hasImage) {
        state.resizePreview = { width: state.editCanvas.width, height: state.editCanvas.height };
        controls.width.value = state.resizePreview.width;
        controls.height.value = state.resizePreview.height;
    }
    render();
}

function paintAt(point, mode) {
    const x = point.image.x;
    const y = point.image.y;
    const radius = state.brushSize / 2;
    const alphaStop = clamp(state.hardness / 100, 0, 1);

    editCtx.save();
    editCtx.beginPath();
    if (state.shape === 'circle') {
        editCtx.arc(x, y, radius, 0, Math.PI * 2);
    } else {
        editCtx.rect(x - radius, y - radius, radius * 2, radius * 2);
    }
    editCtx.clip();

    if (mode === 'eraser') {
        editCtx.globalCompositeOperation = 'destination-out';
        if (state.shape === 'circle') {
            const grad = editCtx.createRadialGradient(x, y, radius * alphaStop, x, y, radius);
            grad.addColorStop(0, 'rgba(0,0,0,1)');
            grad.addColorStop(1, 'rgba(0,0,0,0)');
            editCtx.fillStyle = grad;
        } else {
            editCtx.globalAlpha = Math.max(0.08, alphaStop);
            editCtx.fillStyle = '#000';
        }
    } else {
        editCtx.globalCompositeOperation = 'source-over';
        if (state.shape === 'circle') {
            const grad = editCtx.createRadialGradient(x, y, radius * alphaStop, x, y, radius);
            grad.addColorStop(0, controls.paintColor.value);
            grad.addColorStop(1, `${controls.paintColor.value}00`);
            editCtx.fillStyle = grad;
        } else {
            editCtx.globalAlpha = Math.max(0.08, alphaStop);
            editCtx.fillStyle = controls.paintColor.value;
        }
    }

    editCtx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    editCtx.restore();
}

function backgroundEraseAt(point) {
    if (!state.targetColor) {
        state.targetColor = sampleColor(point.image.x, point.image.y);
        updateTargetUI();
    }
    const radius = state.brushSize / 2;
    const minX = clamp(Math.floor(point.image.x - radius), 0, state.editCanvas.width - 1);
    const minY = clamp(Math.floor(point.image.y - radius), 0, state.editCanvas.height - 1);
    const maxX = clamp(Math.ceil(point.image.x + radius), 0, state.editCanvas.width - 1);
    const maxY = clamp(Math.ceil(point.image.y + radius), 0, state.editCanvas.height - 1);
    const width = maxX - minX + 1;
    const height = maxY - minY + 1;
    const image = editCtx.getImageData(minX, minY, width, height);
    const data = image.data;
    const tolerance = state.tolerance;
    const hardness = state.hardness / 100;

    for (let yy = 0; yy < height; yy++) {
        for (let xx = 0; xx < width; xx++) {
            const px = minX + xx;
            const py = minY + yy;
            const dx = Math.abs(px - point.image.x);
            const dy = Math.abs(py - point.image.y);
            const inside = state.shape === 'circle'
                ? Math.sqrt(dx * dx + dy * dy) <= radius
                : dx <= radius && dy <= radius;
            if (!inside) continue;
            const index = (yy * width + xx) * 4;
            const current = [data[index], data[index + 1], data[index + 2], data[index + 3]];
            if (colorDistance(current, state.targetColor) <= tolerance) {
                const dist = state.shape === 'circle' ? Math.sqrt(dx * dx + dy * dy) : Math.max(dx, dy);
                const edge = clamp((radius - dist) / Math.max(1, radius * (1 - hardness)), 0, 1);
                const eraseAlpha = hardness >= 1 ? 1 : edge;
                data[index + 3] = Math.round(data[index + 3] * (1 - eraseAlpha));
            }
        }
    }

    editCtx.putImageData(image, minX, minY);
}

function healAt(point) {
    if (!state.healSource || !state.healOffset) return;
    const radius = state.brushSize / 2;
    const minX = clamp(Math.floor(point.image.x - radius), 0, state.editCanvas.width - 1);
    const minY = clamp(Math.floor(point.image.y - radius), 0, state.editCanvas.height - 1);
    const maxX = clamp(Math.ceil(point.image.x + radius), 0, state.editCanvas.width - 1);
    const maxY = clamp(Math.ceil(point.image.y + radius), 0, state.editCanvas.height - 1);
    const width = maxX - minX + 1;
    const height = maxY - minY + 1;
    const dest = editCtx.getImageData(minX, minY, width, height);
    const src = editCtx.getImageData(0, 0, state.editCanvas.width, state.editCanvas.height);

    for (let yy = 0; yy < height; yy++) {
        for (let xx = 0; xx < width; xx++) {
            const px = minX + xx;
            const py = minY + yy;
            const dx = px - point.image.x;
            const dy = py - point.image.y;
            const dist = state.shape === 'circle' ? Math.sqrt(dx * dx + dy * dy) : Math.max(Math.abs(dx), Math.abs(dy));
            if (dist > radius) continue;
            const sx = clamp(Math.round(px + state.healOffset.x), 0, state.editCanvas.width - 1);
            const sy = clamp(Math.round(py + state.healOffset.y), 0, state.editCanvas.height - 1);
            const di = (yy * width + xx) * 4;
            const si = (sy * state.editCanvas.width + sx) * 4;
            const feather = clamp((radius - dist) / Math.max(1, radius * (1 - state.hardness / 100)), 0, 1);
            const blend = state.hardness >= 100 ? 0.72 : 0.72 * feather;
            for (let c = 0; c < 4; c++) {
                dest.data[di + c] = Math.round(dest.data[di + c] * (1 - blend) + src.data[si + c] * blend);
            }
        }
    }

    editCtx.putImageData(dest, minX, minY);
}

function createHealMask() {
    state.healMask = document.createElement('canvas');
    state.healMask.width = state.editCanvas.width;
    state.healMask.height = state.editCanvas.height;
    state.healMaskBounds = null;
}

function expandHealBounds(minX, minY, maxX, maxY) {
    if (!state.healMaskBounds) {
        state.healMaskBounds = { minX, minY, maxX, maxY };
        return;
    }
    state.healMaskBounds.minX = Math.min(state.healMaskBounds.minX, minX);
    state.healMaskBounds.minY = Math.min(state.healMaskBounds.minY, minY);
    state.healMaskBounds.maxX = Math.max(state.healMaskBounds.maxX, maxX);
    state.healMaskBounds.maxY = Math.max(state.healMaskBounds.maxY, maxY);
}

function stampHealMask(point) {
    if (!state.healMask) createHealMask();
    const maskCtx = state.healMask.getContext('2d');
    const radius = state.brushSize / 2;
    const x = point.image.x;
    const y = point.image.y;
    const hardness = clamp(state.hardness / 100, 0, 1);

    maskCtx.save();
    if (state.shape === 'circle') {
        const grad = maskCtx.createRadialGradient(x, y, radius * hardness, x, y, radius);
        grad.addColorStop(0, 'rgba(20,184,166,1)');
        grad.addColorStop(1, 'rgba(20,184,166,0)');
        maskCtx.fillStyle = grad;
        maskCtx.beginPath();
        maskCtx.arc(x, y, radius, 0, Math.PI * 2);
        maskCtx.fill();
    } else {
        maskCtx.globalAlpha = Math.max(0.18, hardness);
        maskCtx.fillStyle = 'rgba(20,184,166,1)';
        maskCtx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }
    maskCtx.restore();

    expandHealBounds(
        clamp(Math.floor(x - radius - state.brushSize), 0, state.editCanvas.width - 1),
        clamp(Math.floor(y - radius - state.brushSize), 0, state.editCanvas.height - 1),
        clamp(Math.ceil(x + radius + state.brushSize), 0, state.editCanvas.width - 1),
        clamp(Math.ceil(y + radius + state.brushSize), 0, state.editCanvas.height - 1)
    );
}

function applySpotHeal() {
    if (!state.healMask || !state.healMaskBounds) return;
    const bounds = state.healMaskBounds;
    const minX = bounds.minX;
    const minY = bounds.minY;
    const width = bounds.maxX - bounds.minX + 1;
    const height = bounds.maxY - bounds.minY + 1;
    const source = editCtx.getImageData(0, 0, state.editCanvas.width, state.editCanvas.height);
    const patch = editCtx.getImageData(minX, minY, width, height);
    const mask = state.healMask.getContext('2d').getImageData(minX, minY, width, height);
    const sampleRadius = Math.max(6, Math.round(state.brushSize * 0.65));
    const directions = [
        [1, 0], [-1, 0], [0, 1], [0, -1],
        [0.7, 0.7], [-0.7, 0.7], [0.7, -0.7], [-0.7, -0.7],
        [1, 0.45], [-1, 0.45], [0.45, 1], [0.45, -1]
    ];

    for (let yy = 0; yy < height; yy++) {
        for (let xx = 0; xx < width; xx++) {
            const localIndex = (yy * width + xx) * 4;
            const maskAlpha = mask.data[localIndex + 3] / 255;
            if (maskAlpha <= 0) continue;

            const px = minX + xx;
            const py = minY + yy;
            let r = 0;
            let g = 0;
            let b = 0;
            let a = 0;
            let count = 0;

            directions.forEach(([dx, dy]) => {
                for (let step = sampleRadius; step <= sampleRadius * 3; step += sampleRadius) {
                    const sx = clamp(Math.round(px + dx * step), 0, state.editCanvas.width - 1);
                    const sy = clamp(Math.round(py + dy * step), 0, state.editCanvas.height - 1);
                    if (isMaskPixelInBounds(sx, sy, mask, bounds, width)) continue;
                    const si = (sy * state.editCanvas.width + sx) * 4;
                    r += source.data[si];
                    g += source.data[si + 1];
                    b += source.data[si + 2];
                    a += source.data[si + 3];
                    count++;
                    break;
                }
            });

            if (count === 0) continue;
            const blend = clamp(maskAlpha * 0.9, 0, 0.9);
            patch.data[localIndex] = Math.round(patch.data[localIndex] * (1 - blend) + (r / count) * blend);
            patch.data[localIndex + 1] = Math.round(patch.data[localIndex + 1] * (1 - blend) + (g / count) * blend);
            patch.data[localIndex + 2] = Math.round(patch.data[localIndex + 2] * (1 - blend) + (b / count) * blend);
            patch.data[localIndex + 3] = Math.round(patch.data[localIndex + 3] * (1 - blend) + (a / count) * blend);
        }
    }

    editCtx.putImageData(patch, minX, minY);
    state.healMask = null;
    state.healMaskBounds = null;
    render();
}

function isMaskPixelInBounds(x, y, mask, bounds, width) {
    if (x < bounds.minX || y < bounds.minY || x > bounds.maxX || y > bounds.maxY) return false;
    const localX = x - bounds.minX;
    const localY = y - bounds.minY;
    return mask.data[(localY * width + localX) * 4 + 3] > 12;
}

function createMagicWand(point) {
    const x = clamp(Math.floor(point.image.x), 0, state.editCanvas.width - 1);
    const y = clamp(Math.floor(point.image.y), 0, state.editCanvas.height - 1);
    const width = state.editCanvas.width;
    const height = state.editCanvas.height;
    const image = editCtx.getImageData(0, 0, width, height);
    const data = image.data;
    const target = sampleColor(x, y);
    const visited = new Uint8Array(width * height);
    const selected = new Uint8Array(width * height);
    const stack = [[x, y]];
    let minX = x, minY = y, maxX = x, maxY = y;

    while (stack.length) {
        const [cx, cy] = stack.pop();
        if (cx < 0 || cy < 0 || cx >= width || cy >= height) continue;
        const idx = cy * width + cx;
        if (visited[idx]) continue;
        visited[idx] = 1;
        const di = idx * 4;
        const color = [data[di], data[di + 1], data[di + 2], data[di + 3]];
        if (colorDistance(color, target) > state.tolerance || Math.abs(color[3] - target[3]) > state.tolerance) continue;
        selected[idx] = 1;
        minX = Math.min(minX, cx);
        minY = Math.min(minY, cy);
        maxX = Math.max(maxX, cx);
        maxY = Math.max(maxY, cy);
        stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
    }

    state.selection = {
        width,
        height,
        data: selected,
        bounds: { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 }
    };
    controls.clearSelection.disabled = false;
    render();
}

function eraseSelection() {
    if (!state.selection) return;
    pushHistory();
    const image = editCtx.getImageData(0, 0, state.editCanvas.width, state.editCanvas.height);
    for (let i = 0; i < state.selection.data.length; i++) {
        if (state.selection.data[i]) image.data[i * 4 + 3] = 0;
    }
    editCtx.putImageData(image, 0, 0);
    state.selection = null;
    controls.clearSelection.disabled = true;
    render();
}

function applyCrop() {
    if (!state.cropRect) return;
    pushHistory();
    const rect = normalizeRect({
        x: parseInt(controls.cropX.value, 10) || state.cropRect.x,
        y: parseInt(controls.cropY.value, 10) || state.cropRect.y,
        w: parseInt(controls.cropW.value, 10) || state.cropRect.w,
        h: parseInt(controls.cropH.value, 10) || state.cropRect.h
    });
    const next = document.createElement('canvas');
    next.width = Math.max(1, Math.round(rect.w));
    next.height = Math.max(1, Math.round(rect.h));
    next.getContext('2d').drawImage(state.editCanvas, rect.x, rect.y, rect.w, rect.h, 0, 0, next.width, next.height);
    state.editCanvas.width = next.width;
    state.editCanvas.height = next.height;
    editCtx.drawImage(next, 0, 0);
    state.cropRect = { x: 0, y: 0, w: next.width, h: next.height };
    state.selection = null;
    syncFields();
    fitToViewport();
}

function applyResize() {
    const width = Math.max(1, parseInt(controls.width.value, 10) || state.editCanvas.width);
    const height = Math.max(1, parseInt(controls.height.value, 10) || state.editCanvas.height);
    pushHistory();
    const next = document.createElement('canvas');
    next.width = width;
    next.height = height;
    const nextCtx = next.getContext('2d');
    nextCtx.imageSmoothingEnabled = true;
    nextCtx.imageSmoothingQuality = 'high';
    nextCtx.drawImage(state.editCanvas, 0, 0, width, height);
    state.editCanvas.width = width;
    state.editCanvas.height = height;
    editCtx.drawImage(next, 0, 0);
    state.selection = null;
    syncFields();
    fitToViewport();
}

function rotate(direction) {
    pushHistory();
    const next = document.createElement('canvas');
    next.width = state.editCanvas.height;
    next.height = state.editCanvas.width;
    const nctx = next.getContext('2d');
    nctx.translate(next.width / 2, next.height / 2);
    nctx.rotate(direction * Math.PI / 2);
    nctx.drawImage(state.editCanvas, -state.editCanvas.width / 2, -state.editCanvas.height / 2);
    state.editCanvas.width = next.width;
    state.editCanvas.height = next.height;
    editCtx.drawImage(next, 0, 0);
    state.selection = null;
    syncFields();
    fitToViewport();
}

function flip(horizontal) {
    pushHistory();
    const next = document.createElement('canvas');
    next.width = state.editCanvas.width;
    next.height = state.editCanvas.height;
    const nctx = next.getContext('2d');
    nctx.translate(horizontal ? next.width : 0, horizontal ? 0 : next.height);
    nctx.scale(horizontal ? -1 : 1, horizontal ? 1 : -1);
    nctx.drawImage(state.editCanvas, 0, 0);
    editCtx.clearRect(0, 0, state.editCanvas.width, state.editCanvas.height);
    editCtx.drawImage(next, 0, 0);
    render();
}

function flattenBackground() {
    pushHistory();
    const next = document.createElement('canvas');
    next.width = state.editCanvas.width;
    next.height = state.editCanvas.height;
    const nctx = next.getContext('2d');
    nctx.fillStyle = controls.backgroundColor.value;
    nctx.fillRect(0, 0, next.width, next.height);
    nctx.drawImage(state.editCanvas, 0, 0);
    editCtx.clearRect(0, 0, state.editCanvas.width, state.editCanvas.height);
    editCtx.drawImage(next, 0, 0);
    controls.transparent.checked = false;
    render();
}

function resetImage() {
    if (!state.hasImage) return;
    pushHistory();
    state.editCanvas.width = state.originalCanvas.width;
    state.editCanvas.height = state.originalCanvas.height;
    editCtx.drawImage(state.originalCanvas, 0, 0);
    state.selection = null;
    state.cropRect = { x: 0, y: 0, w: state.editCanvas.width, h: state.editCanvas.height };
    resetAdjustments();
    syncFields();
    fitToViewport();
}

function resetAdjustments() {
    Object.keys(state.adjustments).forEach(key => state.adjustments[key] = 0);
    controls.filterPreset.value = 'normal';
    adjustmentSliders.forEach(([key, input, label]) => {
        input.value = state.adjustments[key];
        label.textContent = state.adjustments[key];
    });
}

function setAdjustments(values, presetName = 'custom') {
    Object.assign(state.adjustments, values);
    controls.filterPreset.value = presetName;
    adjustmentSliders.forEach(([key, input, label]) => {
        input.value = state.adjustments[key];
        label.textContent = state.adjustments[key];
    });
    render();
}

function adjustedCanvas() {
    const next = document.createElement('canvas');
    next.width = state.editCanvas.width;
    next.height = state.editCanvas.height;
    const nctx = next.getContext('2d', { willReadFrequently: true });
    nctx.drawImage(state.editCanvas, 0, 0);
    const image = nctx.getImageData(0, 0, next.width, next.height);
    const data = image.data;
    const brightness = state.adjustments.brightness * 2.55;
    const contrastFactor = (259 * (state.adjustments.contrast + 255)) / (255 * (259 - state.adjustments.contrast));
    const saturation = 1 + state.adjustments.saturation / 100;

    for (let i = 0; i < data.length; i += 4) {
        let r = contrastFactor * (data[i] - 128) + 128 + brightness;
        let g = contrastFactor * (data[i + 1] - 128) + 128 + brightness;
        let b = contrastFactor * (data[i + 2] - 128) + 128 + brightness;
        const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        data[i] = clamp(gray + (r - gray) * saturation, 0, 255);
        data[i + 1] = clamp(gray + (g - gray) * saturation, 0, 255);
        data[i + 2] = clamp(gray + (b - gray) * saturation, 0, 255);
    }
    nctx.putImageData(image, 0, 0);
    return next;
}

function previewAdjustments() {
    if (!state.hasImage) return;
    const next = adjustedCanvas();
    ctx.save();
    ctx.drawImage(next, state.panX, state.panY, state.editCanvas.width * state.zoom, state.editCanvas.height * state.zoom);
    ctx.restore();
}

function applyAdjustments() {
    if (!state.hasImage) return;
    pushHistory();
    const next = adjustedCanvas();
    editCtx.clearRect(0, 0, state.editCanvas.width, state.editCanvas.height);
    editCtx.drawImage(next, 0, 0);
    resetAdjustments();
    render();
}

function exportImage() {
    if (!state.hasImage) return;
    const type = controls.format.value;
    const quality = parseInt(controls.quality.value, 10) / 100;
    const out = document.createElement('canvas');
    out.width = state.editCanvas.width;
    out.height = state.editCanvas.height;
    const outCtx = out.getContext('2d');

    if (type === 'image/jpeg' || !controls.transparent.checked) {
        outCtx.fillStyle = controls.backgroundColor.value;
        outCtx.fillRect(0, 0, out.width, out.height);
    }
    outCtx.drawImage(state.editCanvas, 0, 0);
    out.toBlob(blob => {
        if (!blob) return;
        const ext = type === 'image/jpeg' ? 'jpg' : type.split('/')[1];
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${state.fileName}_${out.width}x${out.height}.${ext}`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, type, quality);
}

function handlePointerDown(event) {
    if (!state.hasImage) return;
    canvas.setPointerCapture(event.pointerId);
    const point = getPointer(event);
    state.isPointerDown = true;
    state.lastPointer = point;

    if (state.isSpaceDown || event.button === 1 || state.tool === 'move') {
        state.isPanning = true;
        stage.classList.add('panning');
        return;
    }

    if (event.altKey && ['brush', 'eraser', 'heal'].includes(state.tool)) {
        if (state.tool === 'heal') {
            state.healSource = { x: point.image.x, y: point.image.y };
            controls.targetText.textContent = `Heal source ${Math.round(point.image.x)}, ${Math.round(point.image.y)}`;
        } else {
            pickPaintColor(point);
        }
        render();
        return;
    }

    if (state.tool === 'crop') {
        if (!state.cropRect) {
            state.cropRect = { x: 0, y: 0, w: state.editCanvas.width, h: state.editCanvas.height };
        }
        state.cropDragHandle = getCropHandle(point.image);
        syncCropFields();
        render();
        return;
    }

    if (state.tool === 'resize') {
        state.resizeBox = { start: point.image };
        return;
    }

    if (state.tool === 'wand') {
        createMagicWand(point);
        return;
    }

    if (['brush', 'eraser', 'bgEraser', 'heal'].includes(state.tool)) {
        pushHistory();
        if (state.tool === 'bgEraser') {
            state.targetColor = sampleColor(point.image.x, point.image.y);
            updateTargetUI();
        }
        if (state.tool === 'heal' && controls.spotHeal.checked) {
            createHealMask();
        } else if (state.tool === 'heal' && state.healSource) {
            state.healOffset = {
                x: state.healSource.x - point.image.x,
                y: state.healSource.y - point.image.y
            };
        }
        state.lastStrokeImage = point.image;
        applyStroke(point);
    }
}

function applyStroke(point, shouldRender = true) {
    if (state.tool === 'brush') paintAt(point, 'brush');
    if (state.tool === 'eraser') paintAt(point, 'eraser');
    if (state.tool === 'bgEraser') backgroundEraseAt(point);
    if (state.tool === 'heal') {
        if (controls.spotHeal.checked) {
            stampHealMask(point);
        } else {
            healAt(point);
        }
    }
    if (shouldRender) render();
}

function interpolateStroke(from, to) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const spacing = Math.max(1, state.brushSize * 0.22);
    const steps = Math.max(1, Math.ceil(distance / spacing));

    for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        applyStroke({ image: { x: from.x + dx * t, y: from.y + dy * t } }, false);
    }
    render();
}

function handlePointerMove(event) {
    const point = getPointer(event);
    state.lastPointer = point;

    if (state.isPanning && state.isPointerDown) {
        state.panX += point.x - state.lastScreenX;
        state.panY += point.y - state.lastScreenY;
        state.lastScreenX = point.x;
        state.lastScreenY = point.y;
        render();
        return;
    }

    if (state.isPointerDown && state.tool === 'crop' && state.cropRect) {
        dragCropSide(point.image);
        syncCropFields();
        render();
        return;
    }

    if (state.isPointerDown && state.tool === 'resize') {
        const width = Math.max(1, Math.round(point.image.x));
        const ratio = state.editCanvas.width / state.editCanvas.height;
        const height = controls.lockRatio.checked ? Math.max(1, Math.round(width / ratio)) : Math.max(1, Math.round(point.image.y));
        controls.width.value = width;
        controls.height.value = height;
        state.resizePreview = { width, height };
        render();
        return;
    }

    if (state.isPointerDown && ['brush', 'eraser', 'bgEraser', 'heal'].includes(state.tool)) {
        if (state.lastStrokeImage) {
            interpolateStroke(state.lastStrokeImage, point.image);
        } else {
            applyStroke(point);
        }
        state.lastStrokeImage = point.image;
        return;
    }

    state.lastScreenX = point.x;
    state.lastScreenY = point.y;
    render();
}

function handlePointerUp(event) {
    if (state.tool === 'heal' && controls.spotHeal.checked && state.healMask) {
        applySpotHeal();
    }
    state.isPointerDown = false;
    state.isPanning = false;
    state.cropDragHandle = null;
    state.resizeBox = null;
    state.lastStrokeImage = null;
    stage.classList.remove('panning');
    try {
        canvas.releasePointerCapture(event.pointerId);
    } catch {
        // Pointer may already be released by the browser.
    }
}

function handleWheel(event) {
    if (!state.hasImage) return;
    event.preventDefault();
    const point = getPointer(event);
    if (event.ctrlKey || event.metaKey) {
        const before = point.image;
        const factor = event.deltaY > 0 ? 0.9 : 1.1;
        state.zoom = clamp(state.zoom * factor, 0.03, 32);
        state.panX = point.x - before.x * state.zoom;
        state.panY = point.y - before.y * state.zoom;
    } else {
        state.panX -= event.shiftKey ? event.deltaY : event.deltaX;
        state.panY -= event.shiftKey ? 0 : event.deltaY;
    }
    updateMeta();
    render();
}

function updateBrushSize(delta) {
    state.brushSize = clamp(state.brushSize + delta, 1, 240);
    controls.brushSize.value = state.brushSize;
    controls.brushSizeValue.textContent = state.brushSize;
    render();
}

fileInput.addEventListener('change', event => loadFile(event.target.files[0]));

stage.addEventListener('dragover', event => {
    event.preventDefault();
    stage.classList.add('dragging');
});
stage.addEventListener('dragleave', () => stage.classList.remove('dragging'));
stage.addEventListener('drop', event => {
    event.preventDefault();
    stage.classList.remove('dragging');
    loadFile(event.dataTransfer.files[0]);
});

canvas.addEventListener('pointerdown', event => {
    const point = getPointer(event);
    state.lastScreenX = point.x;
    state.lastScreenY = point.y;
    handlePointerDown(event);
});
canvas.addEventListener('pointermove', handlePointerMove);
canvas.addEventListener('pointerup', handlePointerUp);
canvas.addEventListener('pointercancel', handlePointerUp);
canvas.addEventListener('wheel', handleWheel, { passive: false });

document.querySelectorAll('[data-tool]').forEach(button => {
    button.addEventListener('click', () => setTool(button.dataset.tool));
});

document.querySelectorAll('[data-shape]').forEach(button => {
    button.addEventListener('click', () => {
        state.shape = button.dataset.shape;
        document.querySelectorAll('[data-shape]').forEach(btn => btn.classList.toggle('active', btn === button));
        render();
    });
});

controls.brushSize.addEventListener('input', () => {
    state.brushSize = parseInt(controls.brushSize.value, 10);
    controls.brushSizeValue.textContent = state.brushSize;
    render();
});
controls.hardness.addEventListener('input', () => {
    state.hardness = parseInt(controls.hardness.value, 10);
    controls.hardnessValue.textContent = state.hardness;
});
controls.tolerance.addEventListener('input', () => {
    state.tolerance = parseInt(controls.tolerance.value, 10);
    controls.toleranceValue.textContent = state.tolerance;
});
controls.paintColor.addEventListener('input', () => {
    controls.paintHex.value = controls.paintColor.value;
});
controls.paintHex.addEventListener('change', () => {
    const value = controls.paintHex.value.trim();
    if (/^#[0-9a-f]{6}$/i.test(value)) controls.paintColor.value = value;
    controls.paintHex.value = controls.paintColor.value;
});

controls.cropX.addEventListener('input', () => {
    if (!state.cropRect) return;
    state.cropRect.x = parseInt(controls.cropX.value, 10) || 0;
    render();
});
controls.cropY.addEventListener('input', () => {
    if (!state.cropRect) return;
    state.cropRect.y = parseInt(controls.cropY.value, 10) || 0;
    render();
});
controls.cropW.addEventListener('input', () => {
    if (!state.cropRect) return;
    state.cropRect.w = parseInt(controls.cropW.value, 10) || 1;
    render();
});
controls.cropH.addEventListener('input', () => {
    if (!state.cropRect) return;
    state.cropRect.h = parseInt(controls.cropH.value, 10) || 1;
    render();
});
controls.centerCrop.addEventListener('click', () => {
    const size = Math.min(state.editCanvas.width, state.editCanvas.height);
    state.cropRect = {
        x: Math.floor((state.editCanvas.width - size) / 2),
        y: Math.floor((state.editCanvas.height - size) / 2),
        w: size,
        h: size
    };
    syncCropFields();
    render();
});
controls.applyCrop.addEventListener('click', applyCrop);

controls.width.addEventListener('input', () => {
    const width = parseInt(controls.width.value, 10);
    if (!Number.isFinite(width) || width < 1) return;
    if (controls.lockRatio.checked) {
        controls.height.value = Math.max(1, Math.round(width / (state.editCanvas.width / state.editCanvas.height)));
    }
    state.resizePreview = { width, height: parseInt(controls.height.value, 10) || state.editCanvas.height };
    render();
});
controls.height.addEventListener('input', () => {
    const height = parseInt(controls.height.value, 10);
    if (!Number.isFinite(height) || height < 1) return;
    if (controls.lockRatio.checked) {
        controls.width.value = Math.max(1, Math.round(height * (state.editCanvas.width / state.editCanvas.height)));
    }
    state.resizePreview = { width: parseInt(controls.width.value, 10) || state.editCanvas.width, height };
    render();
});
controls.applyResize.addEventListener('click', applyResize);

adjustmentSliders.forEach(([key, input, label]) => {
    input.addEventListener('input', () => {
        state.adjustments[key] = parseInt(input.value, 10);
        label.textContent = state.adjustments[key];
        controls.filterPreset.value = 'custom';
        render();
    });
});

controls.filterPreset.addEventListener('change', () => {
    const preset = FILTER_PRESETS[controls.filterPreset.value];
    if (preset) setAdjustments(preset, controls.filterPreset.value);
});

controls.previewAdjust.addEventListener('click', previewAdjustments);
controls.applyAdjust.addEventListener('click', applyAdjustments);
controls.rotateLeft.addEventListener('click', () => rotate(-1));
controls.rotateRight.addEventListener('click', () => rotate(1));
controls.flipX.addEventListener('click', () => flip(true));
controls.flipY.addEventListener('click', () => flip(false));
controls.applyBackground.addEventListener('click', flattenBackground);
controls.reset.addEventListener('click', resetImage);
controls.undo.addEventListener('click', undo);
controls.download.addEventListener('click', exportImage);
controls.clearSelection.addEventListener('click', () => {
    if (state.selection) {
        state.selection = null;
        controls.clearSelection.disabled = true;
        render();
    }
});
controls.quality.addEventListener('input', () => {
    controls.qualityValue.textContent = controls.quality.value;
});

document.addEventListener('keydown', event => {
    const tag = event.target.tagName;
    const isTyping = tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA';
    if (isTyping) return;

    if (event.code === 'Space') {
        state.isSpaceDown = true;
        stage.classList.add('panning');
        event.preventDefault();
    }
    if (event.key === '[') updateBrushSize(-2);
    if (event.key === ']') updateBrushSize(2);
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        undo();
    }
    if ((event.key === 'Delete' || event.key === 'Backspace') && state.selection) {
        event.preventDefault();
        eraseSelection();
    }
});

document.addEventListener('keyup', event => {
    const tag = event.target.tagName;
    const isTyping = tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA';
    if (isTyping) return;

    if (event.code === 'Space') {
        state.isSpaceDown = false;
        if (!state.isPanning) stage.classList.remove('panning');
    }
});

window.addEventListener('resize', resizeViewport);

setEnabled(false);
resizeViewport();

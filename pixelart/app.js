// ==========================================
// PALETTE PRESETS
// ==========================================
const RETRO_PALETTE = [
    '#000000', '#1e293b', '#64748b', '#cbd5e1', '#ffffff',
    '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e',
    '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6',
    '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#78350f'
];

// ==========================================
// STATE VARIABLES
// ==========================================
let gridSize = 16;
let frames = []; // Array of 2D arrays: grid[r][c] = color or null
let currentFrameIndex = 0;
let activeTool = 'pencil'; // 'pencil' | 'eraser' | 'bucket' | 'picker'
let activeColor = '#06b6d4';
let showGrid = true;

// Undo/Redo history per frame
let undoStack = []; // Stack of deep clones of frames
let redoStack = [];

// Animation Preview
let isPlaying = false;
let playFps = 6;
let previewFrameIndex = 0;
let previewIntervalId = null;

// Drawing state
let isDrawing = false;

// ==========================================
// ELEMENT REFERENCES
// ==========================================
const canvas = document.getElementById('paintCanvas');
const ctx = canvas.getContext('2d');
const animPreviewCanvas = document.getElementById('animationPreview');
const animPreviewCtx = animPreviewCanvas.getContext('2d');

const colorPicker = document.getElementById('colorPicker');
const colorHex = document.getElementById('colorHex');
const swatchesContainer = document.getElementById('swatchesContainer');

const gridSizeSelect = document.getElementById('gridSizeSelect');
const showGridCheck = document.getElementById('showGridCheck');

const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');
const clearBtn = document.getElementById('clearBtn');
const exportBtn = document.getElementById('exportBtn');
const exportGifBtn = document.getElementById('exportGifBtn');

const addFrameBtn = document.getElementById('addFrameBtn');
const duplicateFrameBtn = document.getElementById('duplicateFrameBtn');
const deleteFrameBtn = document.getElementById('deleteFrameBtn');
const carousel = document.getElementById('framesCarousel');

const playPreviewBtn = document.getElementById('playPreviewBtn');
const fpsSlider = document.getElementById('fpsSlider');
const fpsVal = document.getElementById('fpsVal');

// ==========================================
// CORE STATE INITIALIZATION
// ==========================================
function createEmptyGrid(size) {
    return Array.from({ length: size }, () => Array(size).fill(null));
}

function initStudio() {
    gridSize = parseInt(gridSizeSelect.value, 10);
    frames = [createEmptyGrid(gridSize)];
    currentFrameIndex = 0;
    
    undoStack = [];
    redoStack = [];
    
    isPlaying = false;
    if (previewIntervalId) clearInterval(previewIntervalId);
    playPreviewBtn.textContent = 'Play';

    setupPalette();
    saveState();
    renderAll();
}

// Save history state (before drawing stroke)
function saveState() {
    // Save snapshot of all frames
    const snapshot = frames.map(grid => grid.map(row => [...row]));
    undoStack.push(snapshot);
    redoStack = []; // Clear redo stack on new action
    
    // Cap undo history at 50 states to prevent memory bloat
    if (undoStack.length > 50) undoStack.shift();
}

function undo() {
    if (undoStack.length <= 1) return; // Need at least initial state to keep
    const current = frames.map(grid => grid.map(row => [...row]));
    redoStack.push(current);
    
    undoStack.pop(); // Pop current
    const previous = undoStack[undoStack.length - 1];
    
    frames = previous.map(grid => grid.map(row => [...row]));
    // Ensure index is within range
    currentFrameIndex = Math.min(currentFrameIndex, frames.length - 1);
    
    renderAll();
}

function redo() {
    if (redoStack.length === 0) return;
    const nextState = redoStack.pop();
    
    const current = frames.map(grid => grid.map(row => [...row]));
    undoStack.push(current);
    
    frames = nextState.map(grid => grid.map(row => [...row]));
    currentFrameIndex = Math.min(currentFrameIndex, frames.length - 1);
    
    renderAll();
}

// ==========================================
// RENDER BOARD & INTERACTIVE CANVAS
// ==========================================
function drawPixel(c, r, color) {
    const grid = frames[currentFrameIndex];
    if (r >= 0 && r < gridSize && c >= 0 && c < gridSize) {
        grid[r][c] = color;
    }
}

function getPixel(c, r) {
    const grid = frames[currentFrameIndex];
    if (r >= 0 && r < gridSize && c >= 0 && c < gridSize) {
        return grid[r][c];
    }
    return null;
}

function renderAll() {
    renderCanvas();
    renderCarousel();
    renderPreviewFrame();
}

function renderCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const grid = frames[currentFrameIndex];
    if (!grid) return;
    
    const cellSize = canvas.width / gridSize;
    
    // Draw Pixels
    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            const color = grid[r][c];
            if (color) {
                ctx.fillStyle = color;
                ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
            }
        }
    }
    
    // Draw Grid Lines if selected
    if (showGrid) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= gridSize; i++) {
            // Vertical
            ctx.beginPath();
            ctx.moveTo(i * cellSize, 0);
            ctx.lineTo(i * cellSize, canvas.height);
            ctx.stroke();
            // Horizontal
            ctx.beginPath();
            ctx.moveTo(0, i * cellSize);
            ctx.lineTo(canvas.width, i * cellSize);
            ctx.stroke();
        }
    }
}

// ==========================================
// FLOOD FILL BUCKET ALGORITHM
// ==========================================
function floodFill(startC, startR, targetColor) {
    const grid = frames[currentFrameIndex];
    const sourceColor = grid[startR][startC];
    
    if (sourceColor === targetColor) return;
    
    const queue = [[startC, startR]];
    
    while(queue.length > 0) {
        const [c, r] = queue.shift();
        
        if (grid[r][c] === sourceColor) {
            grid[r][c] = targetColor;
            
            // Check neighbors
            if (c > 0) queue.push([c - 1, r]);
            if (c < gridSize - 1) queue.push([c + 1, r]);
            if (r > 0) queue.push([c, r - 1]);
            if (r < gridSize - 1) queue.push([c, r + 1]);
        }
    }
}

// ==========================================
// DRAWING INTERACTION HANDLERS
// ==========================================
function handleCanvasPointer(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const cellSize = rect.width / gridSize;
    const c = Math.floor(x / cellSize);
    const r = Math.floor(y / cellSize);
    
    if (c >= 0 && c < gridSize && r >= 0 && r < gridSize) {
        if (activeTool === 'pencil') {
            drawPixel(c, r, activeColor);
            renderCanvas();
        } else if (activeTool === 'eraser') {
            drawPixel(c, r, null);
            renderCanvas();
        } else if (activeTool === 'picker') {
            const picked = getPixel(c, r);
            if (picked) {
                selectColor(picked);
            }
            activeTool = 'pencil';
            updateToolUI();
        } else if (activeTool === 'bucket') {
            saveState();
            floodFill(c, r, activeColor);
            renderAll();
        }
    }
}

canvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    if (activeTool !== 'bucket' && activeTool !== 'picker') {
        saveState();
    }
    handleCanvasPointer(e);
});

canvas.addEventListener('mousemove', (e) => {
    if (isDrawing && (activeTool === 'pencil' || activeTool === 'eraser')) {
        handleCanvasPointer(e);
    }
});

window.addEventListener('mouseup', () => {
    if (isDrawing) {
        isDrawing = false;
        renderAll(); // Full render on draw finish to sync previews
    }
});

// Touch controls support for tablets/mobile
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    isDrawing = true;
    if (activeTool !== 'bucket' && activeTool !== 'picker') {
        saveState();
    }
    handleCanvasPointer(e.touches[0]);
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (isDrawing && (activeTool === 'pencil' || activeTool === 'eraser')) {
        handleCanvasPointer(e.touches[0]);
    }
}, { passive: false });

canvas.addEventListener('touchend', () => {
    isDrawing = false;
    renderAll();
});

// ==========================================
// TIMELINE FRAMES MANAGER
// ==========================================
function renderCarousel() {
    carousel.innerHTML = '';
    
    frames.forEach((grid, idx) => {
        const card = document.createElement('div');
        card.className = `frame-card ${idx === currentFrameIndex ? 'active' : ''}`;
        
        // Thumbnail Canvas
        const thumbCanvas = document.createElement('canvas');
        thumbCanvas.width = 64;
        thumbCanvas.height = 64;
        const thumbCtx = thumbCanvas.getContext('2d');
        
        const cellSize = 64 / gridSize;
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                const color = grid[r][c];
                if (color) {
                    thumbCtx.fillStyle = color;
                    thumbCtx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
                }
            }
        }
        
        card.appendChild(thumbCanvas);
        
        const label = document.createElement('span');
        label.className = 'frame-num';
        label.textContent = idx + 1;
        card.appendChild(label);
        
        // Click to load frame
        card.addEventListener('click', () => {
            currentFrameIndex = idx;
            renderAll();
        });
        
        carousel.appendChild(card);
    });
}

addFrameBtn.addEventListener('click', () => {
    saveState();
    frames.push(createEmptyGrid(gridSize));
    currentFrameIndex = frames.length - 1;
    renderAll();
});

duplicateFrameBtn.addEventListener('click', () => {
    saveState();
    const source = frames[currentFrameIndex];
    const clone = source.map(row => [...row]);
    frames.splice(currentFrameIndex + 1, 0, clone);
    currentFrameIndex++;
    renderAll();
});

deleteFrameBtn.addEventListener('click', () => {
    if (frames.length <= 1) {
        alert("Cannot delete the only frame!");
        return;
    }
    saveState();
    frames.splice(currentFrameIndex, 1);
    currentFrameIndex = Math.max(0, currentFrameIndex - 1);
    renderAll();
});

// ==========================================
// COLOR PALETTE MANAGEMENT
// ==========================================
function setupPalette() {
    swatchesContainer.innerHTML = '';
    RETRO_PALETTE.forEach(color => {
        const swatch = document.createElement('div');
        swatch.className = 'swatch';
        swatch.style.backgroundColor = color;
        if (color === activeColor) swatch.classList.add('active');
        
        swatch.addEventListener('click', () => selectColor(color));
        swatchesContainer.appendChild(swatch);
    });
}

function selectColor(color) {
    activeColor = color;
    colorPicker.value = color;
    colorHex.value = color;
    
    // Toggle active swatch class
    Array.from(swatchesContainer.children).forEach(sw => {
        const bg = sw.style.backgroundColor;
        // Convert style hex or rgb to raw hex to match
        sw.classList.toggle('active', sw.style.backgroundColor === color || rgbToHex(sw.style.backgroundColor) === color);
    });
}

function rgbToHex(rgbStr) {
    if (!rgbStr.startsWith('rgb')) return rgbStr;
    const vals = rgbStr.match(/\d+/g).map(Number);
    return "#" + ((1 << 24) + (vals[0] << 16) + (vals[1] << 8) + vals[2]).toString(16).slice(1);
}

colorPicker.addEventListener('input', (e) => {
    selectColor(e.target.value);
});

colorHex.addEventListener('change', (e) => {
    let hex = e.target.value.trim();
    if (!hex.startsWith('#')) hex = '#' + hex;
    if (/^#[0-9A-F]{6}$/i.test(hex)) {
        selectColor(hex);
    } else {
        colorHex.value = activeColor;
    }
});

// ==========================================
// ANIMATION PREVIEW ENGINE
// ==========================================
function renderPreviewFrame() {
    animPreviewCtx.clearRect(0, 0, animPreviewCanvas.width, animPreviewCanvas.height);
    
    const frameIdx = isPlaying ? previewFrameIndex : currentFrameIndex;
    const grid = frames[frameIdx];
    if (!grid) return;
    
    const cellSize = animPreviewCanvas.width / gridSize;
    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            const color = grid[r][c];
            if (color) {
                animPreviewCtx.fillStyle = color;
                animPreviewCtx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
            }
        }
    }
}

function cyclePreview() {
    previewFrameIndex = (previewFrameIndex + 1) % frames.length;
    renderPreviewFrame();
}

function togglePlayPreview() {
    isPlaying = !isPlaying;
    if (isPlaying) {
        playPreviewBtn.textContent = 'Pause';
        previewFrameIndex = currentFrameIndex;
        if (previewIntervalId) clearInterval(previewIntervalId);
        previewIntervalId = setInterval(cyclePreview, 1000 / playFps);
    } else {
        playPreviewBtn.textContent = 'Play';
        if (previewIntervalId) {
            clearInterval(previewIntervalId);
            previewIntervalId = null;
        }
        renderPreviewFrame();
    }
}

playPreviewBtn.addEventListener('click', togglePlayPreview);

fpsSlider.addEventListener('input', (e) => {
    playFps = parseInt(e.target.value, 10);
    fpsVal.textContent = playFps;
    if (isPlaying) {
        clearInterval(previewIntervalId);
        previewIntervalId = setInterval(cyclePreview, 1000 / playFps);
    }
});

// ==========================================
// EXPORT HELPERS
// ==========================================
const EXPORT_SCALE = 16;

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function drawGridToContext(targetCtx, grid, xOffset, yOffset, scale) {
    targetCtx.imageSmoothingEnabled = false;
    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            const color = grid[r][c];
            if (color) {
                targetCtx.fillStyle = color;
                targetCtx.fillRect(xOffset + (c * scale), yOffset + (r * scale), scale, scale);
            }
        }
    }
}

function collectGifPalette() {
    const colorToIndex = new Map();
    const palette = [[0, 0, 0]]; // Index 0 is transparent.

    for (const grid of frames) {
        for (const row of grid) {
            for (const color of row) {
                if (!color || colorToIndex.has(color)) continue;
                if (palette.length >= 256) {
                    return null;
                }
                const rgb = hexToRgb(color);
                colorToIndex.set(color, palette.length);
                palette.push(rgb);
            }
        }
    }

    return { palette, colorToIndex };
}

function hexToRgb(hex) {
    const clean = hex.replace('#', '');
    return [
        parseInt(clean.slice(0, 2), 16),
        parseInt(clean.slice(2, 4), 16),
        parseInt(clean.slice(4, 6), 16)
    ];
}

function getColorTableBits(colorCount) {
    let bits = 1;
    while ((1 << bits) < colorCount) bits++;
    return Math.max(1, bits);
}

function writeString(bytes, value) {
    for (let i = 0; i < value.length; i++) {
        bytes.push(value.charCodeAt(i));
    }
}

function writeWord(bytes, value) {
    bytes.push(value & 0xff, (value >> 8) & 0xff);
}

function writeSubBlocks(bytes, data) {
    for (let i = 0; i < data.length; i += 255) {
        const block = data.slice(i, i + 255);
        bytes.push(block.length, ...block);
    }
    bytes.push(0);
}

function encodeLzw(indices, minCodeSize) {
    const clearCode = 1 << minCodeSize;
    const endCode = clearCode + 1;
    let nextCode = endCode + 1;
    let codeSize = minCodeSize + 1;
    const maxCode = 4095;
    const output = [];
    let bitBuffer = 0;
    let bitCount = 0;

    function writeCode(code) {
        bitBuffer |= code << bitCount;
        bitCount += codeSize;
        while (bitCount >= 8) {
            output.push(bitBuffer & 0xff);
            bitBuffer >>= 8;
            bitCount -= 8;
        }
    }

    function resetDictionary() {
        const dict = new Map();
        for (let i = 0; i < clearCode; i++) {
            dict.set(String(i), i);
        }
        nextCode = endCode + 1;
        codeSize = minCodeSize + 1;
        return dict;
    }

    let dict = resetDictionary();
    writeCode(clearCode);

    let phrase = String(indices[0]);
    for (let i = 1; i < indices.length; i++) {
        const current = indices[i];
        const combined = `${phrase},${current}`;

        if (dict.has(combined)) {
            phrase = combined;
        } else {
            writeCode(dict.get(phrase));

            if (nextCode <= maxCode) {
                dict.set(combined, nextCode++);
                if (nextCode === (1 << codeSize) && codeSize < 12) {
                    codeSize++;
                }
            } else {
                writeCode(clearCode);
                dict = resetDictionary();
            }

            phrase = String(current);
        }
    }

    writeCode(dict.get(phrase));
    writeCode(endCode);

    if (bitCount > 0) {
        output.push(bitBuffer & 0xff);
    }

    return output;
}

function frameToGifIndices(grid, colorToIndex, scale) {
    const size = gridSize * scale;
    const indices = new Array(size * size);
    let i = 0;

    for (let r = 0; r < gridSize; r++) {
        for (let sy = 0; sy < scale; sy++) {
            for (let c = 0; c < gridSize; c++) {
                const color = grid[r][c];
                const index = color ? colorToIndex.get(color) : 0;
                for (let sx = 0; sx < scale; sx++) {
                    indices[i++] = index;
                }
            }
        }
    }

    return indices;
}

function createGifBlob(scale) {
    const paletteData = collectGifPalette();
    if (!paletteData) {
        alert('GIF export supports up to 255 visible colors plus transparency. Reduce the number of colors and try again.');
        return null;
    }

    const { palette, colorToIndex } = paletteData;
    const tableBits = getColorTableBits(palette.length);
    const tableSize = 1 << tableBits;
    const minCodeSize = Math.max(2, tableBits);
    const width = gridSize * scale;
    const height = gridSize * scale;
    const delay = Math.max(2, Math.round(100 / playFps));
    const bytes = [];

    writeString(bytes, 'GIF89a');
    writeWord(bytes, width);
    writeWord(bytes, height);
    bytes.push(0x80 | ((tableBits - 1) << 4) | (tableBits - 1));
    bytes.push(0);
    bytes.push(0);

    for (let i = 0; i < tableSize; i++) {
        const rgb = palette[i] || [0, 0, 0];
        bytes.push(rgb[0], rgb[1], rgb[2]);
    }

    // Netscape loop extension: repeat forever.
    bytes.push(0x21, 0xff, 0x0b);
    writeString(bytes, 'NETSCAPE2.0');
    bytes.push(0x03, 0x01);
    writeWord(bytes, 0);
    bytes.push(0);

    frames.forEach(grid => {
        bytes.push(0x21, 0xf9, 0x04);
        bytes.push(0x09); // Restore to transparent background, transparent color enabled.
        writeWord(bytes, delay);
        bytes.push(0);
        bytes.push(0);

        bytes.push(0x2c);
        writeWord(bytes, 0);
        writeWord(bytes, 0);
        writeWord(bytes, width);
        writeWord(bytes, height);
        bytes.push(0);

        const indices = frameToGifIndices(grid, colorToIndex, scale);
        bytes.push(minCodeSize);
        writeSubBlocks(bytes, encodeLzw(indices, minCodeSize));
    });

    bytes.push(0x3b);
    return new Blob([new Uint8Array(bytes)], { type: 'image/gif' });
}

// ==========================================
// EXPORT COMPILERS
// ==========================================
function exportSpritesheet() {
    if (frames.length === 0) return;
    
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = gridSize * EXPORT_SCALE * frames.length;
    exportCanvas.height = gridSize * EXPORT_SCALE;
    const exportCtx = exportCanvas.getContext('2d');
    exportCtx.clearRect(0, 0, exportCanvas.width, exportCanvas.height);
    exportCtx.imageSmoothingEnabled = false;
    
    frames.forEach((grid, idx) => {
        const xOffset = idx * gridSize * EXPORT_SCALE;
        drawGridToContext(exportCtx, grid, xOffset, 0, EXPORT_SCALE);
    });
    
    exportCanvas.toBlob(blob => {
        if (blob) {
            downloadBlob(blob, `spritesheet_${gridSize}x${gridSize}_${frames.length}f_${EXPORT_SCALE}x.png`);
        }
    }, 'image/png');
}

function exportGif() {
    if (frames.length === 0) return;
    const blob = createGifBlob(EXPORT_SCALE);
    if (blob) {
        downloadBlob(blob, `pixel_animation_${gridSize}x${gridSize}_${frames.length}f_${playFps}fps.gif`);
    }
}

exportBtn.addEventListener('click', exportSpritesheet);
exportGifBtn.addEventListener('click', exportGif);

// ==========================================
// TOOL SELECTION CONTROLS
// ==========================================
function updateToolUI() {
    document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`tool-${activeTool}`).classList.add('active');
}

['pencil', 'eraser', 'bucket', 'picker'].forEach(tool => {
    document.getElementById(`tool-${tool}`).addEventListener('click', () => {
        activeTool = tool;
        updateToolUI();
    });
});

// Grid settings & clearances
gridSizeSelect.addEventListener('change', () => {
    if (confirm("Changing grid size will reset your workspace and discard current frames. Continue?")) {
        initStudio();
    } else {
        gridSizeSelect.value = gridSize;
    }
});

showGridCheck.addEventListener('change', (e) => {
    showGrid = e.target.checked;
    renderCanvas();
});

clearBtn.addEventListener('click', () => {
    if (confirm("Clear this frame?")) {
        saveState();
        frames[currentFrameIndex] = createEmptyGrid(gridSize);
        renderAll();
    }
});

undoBtn.addEventListener('click', undo);
redoBtn.addEventListener('click', redo);

// Support basic keyboard undo
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
    }
});

// Launch Studio
initStudio();

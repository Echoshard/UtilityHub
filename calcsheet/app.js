// ==========================================
// CONFIG & GRID GENERATION
// ==========================================
const COLS = 16; // A to P
const ROWS = 50; // 1 to 50

let data = {}; // Raw text/formulas. E.g. data["B3"] = "=SUM(A1:A5)"
let computedValues = {}; // Final values shown. E.g. computedValues["B3"] = 120
let activeCell = "A1";

// Track spilled cells from queries to clear them on re-evaluation
let querySpills = {}; // querySpills["C5"] = ["C6", "C7", "D5", "D6"...]

// ==========================================
// UNDO HISTORY
// ==========================================
let undoStack = [];
const UNDO_LIMIT = 100;

function pushUndoSnapshot() {
    undoStack.push(JSON.stringify(data));
    if (undoStack.length > UNDO_LIMIT) undoStack.shift();
}

function undo() {
    if (undoStack.length === 0) return;
    data = JSON.parse(undoStack.pop());
    recalculateSheet();

    // recalculateSheet skips the focused input to avoid disrupting in-progress typing;
    // refresh it explicitly here since undo just changed its value.
    const activeInput = document.getElementById(`cell-${activeCell}`);
    if (activeInput) {
        activeInput.value = computedValues[activeCell] !== undefined ? computedValues[activeCell] : (data[activeCell] || '');
    }
    formulaInput.value = data[activeCell] || '';
}

document.addEventListener('keydown', (e) => {
    const isCtrl = e.ctrlKey || e.metaKey;
    if (isCtrl && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
    }
});

document.getElementById('undoBtn').addEventListener('click', undo);

const headerRow = document.getElementById('headerRow');
const sheetBody = document.getElementById('sheetBody');
const activeCellLabel = document.getElementById('activeCellLabel');
const formulaInput = document.getElementById('formulaInput');

// ==========================================
// RESIZER BINDINGS & SELECTION STATS
// ==========================================
let selectionStart = null;
let selectionEnd = null;
let isSelecting = false;

function bindColResizer(resizer, th) {
    resizer.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const startX = e.clientX;
        const startWidth = th.offsetWidth;
        
        const onMouseMove = (e) => {
            const width = Math.max(45, startWidth + (e.clientX - startX));
            th.style.width = width + 'px';
        };
        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });
}

function bindRowResizer(resizer, tr) {
    resizer.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const startY = e.clientY;
        const startHeight = tr.offsetHeight;
        
        const onMouseMove = (e) => {
            const height = Math.max(20, startHeight + (e.clientY - startY));
            tr.style.height = height + 'px';
        };
        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });
}

function updateSelectionHighlights() {
    if (!selectionStart || !selectionEnd) {
        document.querySelectorAll('.spreadsheet-table td').forEach(td => {
            td.classList.remove('selected-range');
        });
        return;
    }
    
    const minCol = Math.min(selectionStart.col, selectionEnd.col);
    const maxCol = Math.max(selectionStart.col, selectionEnd.col);
    const minRow = Math.min(selectionStart.row, selectionEnd.row);
    const maxRow = Math.max(selectionStart.row, selectionEnd.row);
    
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const cellId = String.fromCharCode(65 + c) + (r + 1);
            const input = document.getElementById(`cell-${cellId}`);
            if (input) {
                const td = input.parentElement;
                const inRange = (c >= minCol && c <= maxCol && r >= minRow && r <= maxRow);
                td.classList.toggle('selected-range', inRange);
            }
        }
    }
}

function focusCell(colIdx, rowIdx) {
    const cellId = String.fromCharCode(65 + colIdx) + (rowIdx + 1);
    const targetInput = document.getElementById(`cell-${cellId}`);
    if (targetInput) {
        targetInput.focus();
        targetInput.setSelectionRange(targetInput.value.length, targetInput.value.length);
        selectCell(cellId);
    }
}

// Generate headers
for (let c = 0; c < COLS; c++) {
    const th = document.createElement('th');
    th.textContent = String.fromCharCode(65 + c); // A, B, C...
    th.style.width = '100px';
    
    const resizer = document.createElement('div');
    resizer.className = 'col-resizer';
    th.appendChild(resizer);
    bindColResizer(resizer, th);
    
    headerRow.appendChild(th);
}

// Generate rows
for (let r = 0; r < ROWS; r++) {
    const tr = document.createElement('tr');
    
    // Row header label (number)
    const th = document.createElement('th');
    th.textContent = r + 1;
    
    const resizer = document.createElement('div');
    resizer.className = 'row-resizer';
    th.appendChild(resizer);
    bindRowResizer(resizer, tr);
    
    tr.appendChild(th);
    
    for (let c = 0; c < COLS; c++) {
        const td = document.createElement('td');
        const cellId = String.fromCharCode(65 + c) + (r + 1);
        
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'cell-input';
        input.id = `cell-${cellId}`;
        input.dataset.id = cellId;
        
        input.addEventListener('focus', () => selectCell(cellId));
        input.addEventListener('change', (e) => handleCellChange(cellId, e.target.value));
        
        input.addEventListener('input', (e) => {
            if (cellId === activeCell) {
                data[cellId] = e.target.value;
                formulaInput.value = e.target.value;
                updateFormulaHighlights(e.target.value);
            }
        });

        input.addEventListener('blur', () => {
            // Delay slightly to check if focus shifted or if mousedown prevented it
            setTimeout(() => {
                const active = document.activeElement;
                if (!active || !active.classList.contains('cell-input') || active.id !== `cell-${activeCell}`) {
                    updateFormulaHighlights('');
                }
            }, 150);
        });
        
        // Arrow navigation & Enter saving
        input.addEventListener('keydown', (e) => {
            const coord = parseCellCoord(cellId);
            if (!coord) return;
            
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (coord.row >= 1) {
                    focusCell(coord.col, coord.row - 1);
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (coord.row + 2 <= ROWS) {
                    focusCell(coord.col, coord.row + 1);
                }
            } else if (e.key === 'ArrowLeft') {
                if (input.selectionStart === 0 && input.selectionEnd === 0) {
                    e.preventDefault();
                    if (coord.col >= 1) {
                        focusCell(coord.col - 1, coord.row);
                    }
                }
            } else if (e.key === 'ArrowRight') {
                if (input.selectionStart === input.value.length && input.selectionEnd === input.value.length) {
                    e.preventDefault();
                    if (coord.col + 1 < COLS) {
                        focusCell(coord.col + 1, coord.row);
                    }
                }
            } else if (e.key === 'Enter') {
                e.preventDefault();
                handleCellChange(cellId, input.value);
                const coord = parseCellCoord(cellId);
                if (coord) {
                    const nextRow = coord.row + 2; // row is 0-indexed, so row+1 is current, row+2 is below
                    if (nextRow <= ROWS) {
                        const nextColLetter = String.fromCharCode(65 + coord.col);
                        const nextCellId = nextColLetter + nextRow;
                        const nextInput = document.getElementById(`cell-${nextCellId}`);
                        if (nextInput) {
                            nextInput.focus();
                            selectCell(nextCellId);
                        }
                    } else {
                        input.blur();
                    }
                }
            }
        });
        
        input.addEventListener('mousedown', (e) => {
            const activeInput = document.getElementById(`cell-${activeCell}`);
            
            // Formula coordinate clicking selection
            if (activeInput && document.activeElement === activeInput && activeCell !== cellId) {
                const val = activeInput.value;
                if (val.startsWith('=')) {
                    e.preventDefault(); // Prevent focus shift
                    
                    const start = activeInput.selectionStart;
                    const end = activeInput.selectionEnd;
                    activeInput.value = val.substring(0, start) + cellId + val.substring(end);
                    
                    data[activeCell] = activeInput.value;
                    formulaInput.value = activeInput.value;
                    
                    const newPos = start + cellId.length;
                    activeInput.setSelectionRange(newPos, newPos);
                    updateFormulaHighlights(activeInput.value);
                    return;
                }
            }
            
            // Range drag selection
            selectionStart = parseCellCoord(cellId);
            selectionEnd = selectionStart;
            isSelecting = true;
            updateSelectionHighlights();
        });
        
        input.addEventListener('mouseenter', () => {
            if (isSelecting) {
                selectionEnd = parseCellCoord(cellId);
                updateSelectionHighlights();
            }
        });
        
        td.appendChild(input);
        tr.appendChild(td);
    }
    sheetBody.appendChild(tr);
}

// Global mouseup to release selection
document.addEventListener('mouseup', () => {
    isSelecting = false;
});

// ==========================================
// CLIPBOARD (COPY / CUT / PASTE) FOR BOX SELECTIONS
// ==========================================
let clipboardBuffer = null; // Fallback store used when the OS clipboard API is unavailable/blocked

function getSelectionBounds() {
    if (!selectionStart || !selectionEnd) return null;
    return {
        minCol: Math.min(selectionStart.col, selectionEnd.col),
        maxCol: Math.max(selectionStart.col, selectionEnd.col),
        minRow: Math.min(selectionStart.row, selectionEnd.row),
        maxRow: Math.max(selectionStart.row, selectionEnd.row)
    };
}

function buildSelectionText() {
    const bounds = getSelectionBounds();
    if (!bounds) return '';
    const { minCol, maxCol, minRow, maxRow } = bounds;

    const rowsText = [];
    for (let r = minRow; r <= maxRow; r++) {
        const colsText = [];
        for (let c = minCol; c <= maxCol; c++) {
            const cellId = String.fromCharCode(65 + c) + (r + 1);
            colsText.push(data[cellId] || '');
        }
        rowsText.push(colsText.join('\t'));
    }
    return rowsText.join('\n');
}

function clearSelectionRange() {
    const bounds = getSelectionBounds();
    if (!bounds) return;
    const { minCol, maxCol, minRow, maxRow } = bounds;

    pushUndoSnapshot();
    for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
            const cellId = String.fromCharCode(65 + c) + (r + 1);
            data[cellId] = '';
            const input = document.getElementById(`cell-${cellId}`);
            if (input) input.value = '';
        }
    }
    recalculateSheet();
}

function pasteTextAtActiveCell(text) {
    const activeCoord = parseCellCoord(activeCell);
    if (!activeCoord) return;

    pushUndoSnapshot();
    const rows = text.split(/\r?\n/);
    rows.forEach((rowStr, rOffset) => {
        if (rowStr === '' && rOffset === rows.length - 1) return;
        const cols = rowStr.split('\t');
        cols.forEach((val, cOffset) => {
            const targetCol = activeCoord.col + cOffset;
            const targetRow = activeCoord.row + rOffset;

            if (targetCol < COLS && targetRow < ROWS) {
                const targetId = String.fromCharCode(65 + targetCol) + (targetRow + 1);
                data[targetId] = val;
                const input = document.getElementById(`cell-${targetId}`);
                if (input) input.value = val;
            }
        });
    });

    recalculateSheet();
}

// Fires only when the browser recognizes a real text selection (e.g. a partial
// highlight inside a single focused cell). Box-dragging across separate <input>
// cells never creates one, so it does NOT cover box selections - see the
// keydown handler below for that.
document.addEventListener('copy', (e) => {
    const bounds = getSelectionBounds();
    if (!bounds) return;

    const isMultiCell = bounds.minCol !== bounds.maxCol || bounds.minRow !== bounds.maxRow;
    const active = document.activeElement;
    if (!isMultiCell && active && active.classList && active.classList.contains('cell-input') &&
        active.selectionStart !== active.selectionEnd) {
        return; // Let the browser copy just the highlighted substring
    }

    const text = buildSelectionText();
    clipboardBuffer = text;
    e.clipboardData.setData('text/plain', text);
    e.preventDefault();
});

document.addEventListener('paste', (e) => {
    const activeInput = document.getElementById(`cell-${activeCell}`);
    if (!activeInput || document.activeElement !== activeInput) return;
    if (activeInput.value.startsWith('=')) return;

    let text = e.clipboardData ? e.clipboardData.getData('text/plain') : '';
    if (!text && clipboardBuffer) text = clipboardBuffer;
    if (!text) return;

    pasteTextAtActiveCell(text);
    e.preventDefault();
});

// Explicit Ctrl/Cmd+C and +X handling for box (multi-cell) selections, since
// dragging across separate <input> cells doesn't produce a real browser text
// selection and the native 'copy' event above never fires for it.
document.addEventListener('keydown', (e) => {
    const isCtrl = e.ctrlKey || e.metaKey;
    if (!isCtrl) return;

    const key = e.key.toLowerCase();
    if (key !== 'c' && key !== 'x') return;

    const bounds = getSelectionBounds();
    if (!bounds) return;

    const isMultiCell = bounds.minCol !== bounds.maxCol || bounds.minRow !== bounds.maxRow;
    const active = document.activeElement;
    if (!isMultiCell && active && active.classList && active.classList.contains('cell-input') &&
        active.selectionStart !== active.selectionEnd) {
        return; // Let the browser cut/copy just the highlighted substring
    }

    e.preventDefault();
    const text = buildSelectionText();
    clipboardBuffer = text;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(() => {});
    }

    if (key === 'x') {
        clearSelectionRange();
    }
});

// Range Delete/Backspace Keyboard Handlers
document.addEventListener('keydown', (e) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
        const bounds = getSelectionBounds();
        if (bounds) {
            const isMultiCell = (bounds.minCol !== bounds.maxCol || bounds.minRow !== bounds.maxRow);

            if (isMultiCell) {
                e.preventDefault();
                clearSelectionRange();
            } else if (e.key === 'Delete' && document.activeElement && document.activeElement.classList.contains('cell-input')) {
                // Single-cell Delete clears the active focused input
                e.preventDefault();
                const cellId = document.activeElement.dataset.id;
                if (cellId) {
                    pushUndoSnapshot();
                    data[cellId] = '';
                    document.activeElement.value = '';
                    recalculateSheet();
                }
            }
        }
    }
});

// ==========================================
// CELL CELL SELECTION & FOCUS HANDLERS
// ==========================================
function selectCell(cellId) {
    activeCell = cellId;
    activeCellLabel.textContent = cellId;
    
    // Set formula input value to raw data (formula or text)
    formulaInput.value = data[cellId] || '';
    
    // Highlight cells referenced in this formula
    updateFormulaHighlights(data[cellId] || '');
    
    // Remove focused border styling from others, add to parent
    document.querySelectorAll('.cell-input').forEach(input => {
        input.parentElement.classList.remove('active-parent');
    });
    const activeInput = document.getElementById(`cell-${cellId}`);
    if (activeInput) activeInput.parentElement.classList.add('active-parent');
}

function handleCellChange(cellId, value) {
    if (data[cellId] === value) {
        updateFormulaHighlights('');
        return;
    }
    pushUndoSnapshot();
    data[cellId] = value;
    recalculateSheet();
    updateFormulaHighlights('');
}

// Recalculate cell equations on change
formulaInput.addEventListener('change', (e) => {
    if (data[activeCell] === e.target.value) {
        updateFormulaHighlights('');
        return;
    }
    pushUndoSnapshot();
    data[activeCell] = e.target.value;
    const input = document.getElementById(`cell-${activeCell}`);
    if (input) input.value = e.target.value;

    recalculateSheet();
    updateFormulaHighlights('');
});

// Sync typing in formula bar in real-time
formulaInput.addEventListener('input', (e) => {
    const activeInput = document.getElementById(`cell-${activeCell}`);
    if (activeInput) {
        activeInput.value = e.target.value;
        data[activeCell] = e.target.value;
    }
    updateFormulaHighlights(e.target.value);
});

formulaInput.addEventListener('blur', () => {
    // Clear highlights when formula bar loses focus, unless cell-input is active
    setTimeout(() => {
        const active = document.activeElement;
        if (!active || !active.classList.contains('cell-input') || active.id !== `cell-${activeCell}`) {
            updateFormulaHighlights('');
        }
    }, 150);
});

// ==========================================
// SHEET FORMULA EVALUATION ENGINE
// ==========================================
function getCellValue(cellId) {
    // Return computed value if present, else fallback to raw data
    if (computedValues[cellId] !== undefined) {
        const val = computedValues[cellId];
        const num = parseFloat(val);
        return isNaN(num) ? val : num;
    }
    const val = data[cellId] || '';
    const num = parseFloat(val);
    return isNaN(num) ? val : num;
}

function getCellValueByIndices(colIdx, rowIdx) {
    const cellId = String.fromCharCode(65 + colIdx) + (rowIdx + 1);
    return getCellValue(cellId);
}

function parseCellCoord(cellStr) {
    const match = cellStr.match(/^([A-P])([1-9][0-9]?)$/);
    if (!match) return null;
    return {
        col: match[1].charCodeAt(0) - 65,
        row: parseInt(match[2], 10) - 1
    };
}

function parseRange(rangeStr) {
    const parts = rangeStr.split(':');
    if (parts.length !== 2) return null;
    
    const start = parseCellCoord(parts[0]);
    const end = parseCellCoord(parts[1]);
    
    if (!start || !end) return null;
    
    return {
        startCol: Math.min(start.col, end.col),
        endCol: Math.max(start.col, end.col),
        startRow: Math.min(start.row, end.row),
        endRow: Math.max(start.row, end.row)
    };
}

function getValuesFromRange(rangeStr) {
    const range = parseRange(rangeStr);
    if (!range) return [];
    
    const values = [];
    for (let r = range.startRow; r <= range.endRow; r++) {
        for (let c = range.startCol; c <= range.endCol; c++) {
            const val = getCellValueByIndices(c, r);
            const num = parseFloat(val);
            if (!isNaN(num)) {
                values.push(num);
            }
        }
    }
    return values;
}

// ==========================================
// FORMULA CELL HIGHLIGHT ENGINE
// ==========================================
function updateFormulaHighlights(formulaText) {
    // Clear all previous formula reference highlights
    document.querySelectorAll('.spreadsheet-table td.formula-reference').forEach(td => {
        td.classList.remove('formula-reference');
    });

    if (!formulaText || !formulaText.startsWith('=')) {
        return;
    }

    const rangeRegex = /\b([A-P][1-9][0-9]?):([A-P][1-9][0-9]?)\b/gi;
    let tempText = formulaText;
    let match;
    const cellsToHighlight = new Set();

    // 1. Match ranges (e.g. A1:B5)
    while ((match = rangeRegex.exec(formulaText)) !== null) {
        const rangeStr = match[0];
        const range = parseRange(rangeStr);
        if (range) {
            for (let r = range.startRow; r <= range.endRow; r++) {
                for (let c = range.startCol; c <= range.endCol; c++) {
                    const cellId = String.fromCharCode(65 + c) + (r + 1);
                    cellsToHighlight.add(cellId);
                }
            }
        }
        // Replace range in tempText to avoid matching corners as individual cells
        tempText = tempText.replace(rangeStr, ' '.repeat(rangeStr.length));
    }

    // 2. Match individual cells (e.g. C2)
    const cellRegex = /\b([A-P][1-9][0-9]?)\b/gi;
    while ((match = cellRegex.exec(tempText)) !== null) {
        const cellId = match[0].toUpperCase();
        const coord = parseCellCoord(cellId);
        if (coord && coord.col < COLS && coord.row < ROWS) {
            cellsToHighlight.add(cellId);
        }
    }

    // 3. Highlight nodes
    cellsToHighlight.forEach(cellId => {
        const input = document.getElementById(`cell-${cellId}`);
        if (input) {
            input.parentElement.classList.add('formula-reference');
        }
    });
}

// Global recalculator loop
function recalculateSheet() {
    computedValues = {};
    
    // Clear old spilled query cells
    Object.values(querySpills).forEach(spilledList => {
        spilledList.forEach(cellId => {
            const input = document.getElementById(`cell-${cellId}`);
            if (input) input.value = '';
        });
    });
    querySpills = {};

    // Topological dependency evaluation simulation (multiple cycles handles basic nesting)
    for (let pass = 0; pass < 3; pass++) {
        for (let cellId in data) {
            const val = data[cellId];
            if (val && val.startsWith('=')) {
                computedValues[cellId] = evaluateFormula(val, cellId);
            } else {
                computedValues[cellId] = val;
            }
        }
    }
    
    // Update DOM inputs
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const cellId = String.fromCharCode(65 + c) + (r + 1);
            const input = document.getElementById(`cell-${cellId}`);
            if (!input) continue;
            
            // Do not override focused cell raw text/formula
            if (document.activeElement === input) continue;
            
            const computed = computedValues[cellId];
            if (computed !== undefined) {
                input.value = computed;
                // Highlight formula cell results
                const raw = data[cellId] || '';
                input.classList.toggle('formula-result', raw.startsWith('='));
            } else {
                input.value = '';
                input.classList.remove('formula-result');
            }
        }
    }
}

// Helper math functions for evaluation scope
function SUM(arr) {
    if (!Array.isArray(arr)) return parseFloat(arr) || 0;
    return arr.reduce((s, v) => s + (parseFloat(v) || 0), 0);
}
function AVERAGE(arr) {
    if (!Array.isArray(arr)) return parseFloat(arr) || 0;
    const vals = arr.map(v => parseFloat(v)).filter(v => !isNaN(v));
    return vals.length > 0 ? (vals.reduce((s, v) => s + v, 0) / vals.length) : 0;
}
function MIN(arr) {
    if (!Array.isArray(arr)) return parseFloat(arr) || 0;
    const vals = arr.map(v => parseFloat(v)).filter(v => !isNaN(v));
    return vals.length > 0 ? Math.min(...vals) : 0;
}
function MAX(arr) {
    if (!Array.isArray(arr)) return parseFloat(arr) || 0;
    const vals = arr.map(v => parseFloat(v)).filter(v => !isNaN(v));
    return vals.length > 0 ? Math.max(...vals) : 0;
}

function evaluateFormula(formulaText, cellId) {
    try {
        let text = formulaText.substring(1).trim();
        
        // 1. QUERY support (Case-insensitive check)
        if (/^QUERY\s*\(/i.test(text)) {
            return runQueryFormula(text, cellId);
        }
        
        // 2. Expand ranges like B2:B10 into arrays of coordinates [B2,B3...B10]
        text = text.replace(/([A-P])([1-9][0-9]?):([A-P])([1-9][0-9]?)/gi, (match) => {
            const range = parseRange(match);
            if (!range) return "[]";
            const coords = [];
            for (let r = range.startRow; r <= range.endRow; r++) {
                for (let c = range.startCol; c <= range.endCol; c++) {
                    const coord = String.fromCharCode(65 + c) + (r + 1);
                    coords.push(coord);
                }
            }
            return "[" + coords.join(",") + "]";
        });
        
        // 3. Replace individual coordinates (e.g. A1, B2) with their cell values.
        // We match with word boundaries to avoid replacing letters inside SUM/MAX function names.
        let evalText = text.replace(/\b([A-P])([1-9][0-9]?)\b/gi, (match) => {
            const val = getCellValue(match);
            if (typeof val === 'number') return val;
            if (val === '') return 0;
            if (!isNaN(parseFloat(val))) return parseFloat(val);
            return `"${val}"`;
        });
        
        // 4. Safe evaluate the JS expression
        const result = eval(evalText);
        return result !== undefined ? result : '';
    } catch (e) {
        console.error("Formula parse error:", formulaText, e);
        return "#ERROR!";
    }
}

// ==========================================
// SQL-LIKE QUERY() ENGINE & SPILL SYSTEM
// ==========================================
function runQueryFormula(queryFormula, triggerCellId) {
    try {
        // Parse args: QUERY(A1:C10, "SELECT Col1 WHERE Col2 > 10")
        // Find outer parenthesis, matching QUERY (case-insensitively, with potential spacing)
        const queryMatch = queryFormula.match(/^QUERY\s*\(/i);
        if (!queryMatch) return "#ERROR!";
        
        const prefixLen = queryMatch[0].length;
        const argText = queryFormula.substring(prefixLen, queryFormula.length - 1);
        
        // Split range and query string by comma, checking quotes
        let commaIdx = argText.indexOf(',');
        if (commaIdx === -1) return "#ARG!";
        
        const rangeStr = argText.substring(0, commaIdx).trim();
        let queryStr = argText.substring(commaIdx + 1).trim();
        
        // Remove enclosing quotes
        if ((queryStr.startsWith('"') && queryStr.endsWith('"')) ||
            (queryStr.startsWith("'") && queryStr.endsWith("'"))) {
            queryStr = queryStr.substring(1, queryStr.length - 1);
        }
        
        const range = parseRange(rangeStr);
        if (!range) return "#RANGE!";
        
        // Build 2D values grid from range
        const table = [];
        for (let r = range.startRow; r <= range.endRow; r++) {
            const rowData = [];
            for (let c = range.startCol; c <= range.endCol; c++) {
                const val = getCellValueByIndices(c, r);
                rowData.push(val);
            }
            table.push(rowData);
        }
        
        // Parse clauses using index offsets
        const queryUpper = queryStr.toUpperCase();
        const selectIdx = queryUpper.indexOf('SELECT');
        const whereIdx = queryUpper.indexOf('WHERE');
        const orderIdx = queryUpper.indexOf('ORDER BY');
        
        let selectCols = '*';
        let whereClause = '';
        let orderByCol = '';
        let orderDir = 'ASC';
        
        if (selectIdx !== -1) {
            let endIdx = queryStr.length;
            if (whereIdx !== -1 && whereIdx > selectIdx) endIdx = Math.min(endIdx, whereIdx);
            if (orderIdx !== -1 && orderIdx > selectIdx) endIdx = Math.min(endIdx, orderIdx);
            
            selectCols = queryStr.substring(selectIdx + 6, endIdx).trim();
        }
        
        if (whereIdx !== -1) {
            let endIdx = queryStr.length;
            if (orderIdx !== -1 && orderIdx > whereIdx) endIdx = Math.min(endIdx, orderIdx);
            
            whereClause = queryStr.substring(whereIdx + 5, endIdx).trim();
        }
        
        if (orderIdx !== -1) {
            const orderByClause = queryStr.substring(orderIdx + 8).trim();
            const orderMatch = orderByClause.match(/Col(\d+)(?:\s+(ASC|DESC))?/i);
            if (orderMatch) {
                orderByCol = 'Col' + orderMatch[1];
                orderDir = (orderMatch[2] || 'ASC').toUpperCase();
            }
        }
        
        // 1. Evaluate WHERE filter
        let filteredRows = table.filter(row => {
            if (!whereClause) return true;
            
            // Replace ColX (e.g. Col2, col2, COL2) with row value index (case-insensitive)
            let evalStr = whereClause.replace(/Col(\d+)/gi, (match, colNum) => {
                const idx = parseInt(colNum, 10) - 1;
                const val = row[idx];
                const num = parseFloat(val);
                if (typeof val === 'number' || !isNaN(num)) return !isNaN(num) ? num : val;
                if (!val) return 0;
                return `"${val}"`;
            });
            
            try {
                return eval(evalStr);
            } catch (e) {
                return false;
            }
        });
        
        // 2. Sort rows based on order by
        if (orderByCol) {
            const colIdx = parseInt(orderByCol.substring(3), 10) - 1;
            filteredRows.sort((a, b) => {
                let valA = a[colIdx];
                let valB = b[colIdx];
                
                const numA = parseFloat(valA);
                const numB = parseFloat(valB);
                if (!isNaN(numA) && !isNaN(numB)) {
                    valA = numA;
                    valB = numB;
                }
                
                if (valA < valB) return orderDir === 'ASC' ? -1 : 1;
                if (valA > valB) return orderDir === 'ASC' ? 1 : -1;
                return 0;
            });
        }
        
        // 3. Project select columns
        let resultTable = [];
        if (selectCols === '*') {
            resultTable = filteredRows;
        } else {
            const colIndices = selectCols.split(',').map(s => {
                const match = s.trim().match(/Col(\d+)/i);
                return match ? parseInt(match[1], 10) - 1 : -1;
            }).filter(idx => idx >= 0);
            
            resultTable = filteredRows.map(row => {
                return colIndices.map(idx => row[idx]);
            });
        }
        
        // 4. Spill Results to adjacent cell grid
        const startCoord = parseCellCoord(triggerCellId);
        if (!startCoord) return "#ERROR!";
        
        querySpills[triggerCellId] = [];
        
        for (let r = 0; r < resultTable.length; r++) {
            const rowVal = resultTable[r];
            const targetRow = startCoord.row + r;
            if (targetRow >= ROWS) break; // Exceeds grid bounds
            
            for (let c = 0; c < rowVal.length; c++) {
                const targetCol = startCoord.col + c;
                if (targetCol >= COLS) break;
                
                const targetId = String.fromCharCode(65 + targetCol) + (targetRow + 1);
                
                // Do not overwrite trigger cell itself with spill
                if (targetId === triggerCellId) continue;
                
                computedValues[targetId] = rowVal[c];
                querySpills[triggerCellId].push(targetId);
            }
        }
        
        // Return first cell value of result table to trigger cell
        return resultTable.length > 0 ? resultTable[0][0] : '';
    } catch (err) {
        console.error("Query parse failed:", queryFormula, err);
        return "#QUERY_ERR!";
    }
}

// ==========================================
// CANVAS CHART DRAWING PLOTTER
// ==========================================
const chartModal = document.getElementById('chartModal');
const chartCanvas = document.getElementById('chartCanvas');
const chartCtx = chartCanvas.getContext('2d');

document.getElementById('openChartBtn').addEventListener('click', () => {
    chartModal.classList.add('open');
});

document.getElementById('closeChartBtn').addEventListener('click', () => {
    chartModal.classList.remove('open');
});

document.getElementById('renderChartBtn').addEventListener('click', () => {
    const type = document.getElementById('chartType').value;
    const labelRange = document.getElementById('chartLabelRange').value.trim();
    const valueRange = document.getElementById('chartValueRange').value.trim();
    
    if (!labelRange || !valueRange) {
        alert("Please enter both Label and Value cell ranges.");
        return;
    }
    
    // Parse values
    const labels = getLabelsFromRange(labelRange);
    const values = getValuesFromRange(valueRange);
    
    if (labels.length === 0 || values.length === 0) {
        alert("No numerical data found in specified ranges.");
        return;
    }
    
    plotChart(type, labels, values);
});

function getLabelsFromRange(rangeStr) {
    const range = parseRange(rangeStr);
    if (!range) return [];
    
    const labels = [];
    for (let r = range.startRow; r <= range.endRow; r++) {
        for (let c = range.startCol; c <= range.endCol; c++) {
            const val = getCellValueByIndices(c, r);
            labels.push(val !== '' ? String(val) : `Cell ${String.fromCharCode(65+c)}${r+1}`);
        }
    }
    return labels;
}

function plotChart(type, labels, values) {
    chartCtx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
    
    const width = chartCanvas.width;
    const height = chartCanvas.height;
    
    const padding = 50;
    const graphWidth = width - 2 * padding;
    const graphHeight = height - 2 * padding;
    
    const maxVal = Math.max(...values, 1);
    
    if (type === 'bar') {
        const barWidth = graphWidth / labels.length - 10;
        chartCtx.fillStyle = '#10b981'; // Green Bars
        
        for (let i = 0; i < values.length; i++) {
            const pct = values[i] / maxVal;
            const barHeight = graphHeight * pct;
            
            const x = padding + i * (graphWidth / labels.length) + 5;
            const y = height - padding - barHeight;
            
            // Draw Bar
            chartCtx.fillRect(x, y, barWidth, barHeight);
            
            // Draw label
            chartCtx.fillStyle = '#64748b';
            chartCtx.font = '10px sans-serif';
            chartCtx.fillText(labels[i], x, height - padding + 15);
            
            // Draw value on bar
            chartCtx.fillStyle = '#fff';
            chartCtx.fillText(values[i].toFixed(1), x + 2, y - 5);
            chartCtx.fillStyle = '#10b981';
        }
    } else if (type === 'line') {
        chartCtx.strokeStyle = '#10b981';
        chartCtx.lineWidth = 3;
        chartCtx.beginPath();
        
        for (let i = 0; i < values.length; i++) {
            const pct = values[i] / maxVal;
            const x = padding + i * (graphWidth / (values.length - 1 || 1));
            const y = height - padding - graphHeight * pct;
            
            if (i === 0) chartCtx.moveTo(x, y);
            else chartCtx.lineTo(x, y);
            
            // Label
            chartCtx.fillStyle = '#64748b';
            chartCtx.font = '10px sans-serif';
            chartCtx.fillText(labels[i], x - 10, height - padding + 15);
            chartCtx.fillText(values[i].toFixed(1), x - 10, y - 10);
        }
        chartCtx.stroke();
    } else if (type === 'pie') {
        const total = values.reduce((sum, v) => sum + v, 0);
        let startAngle = 0;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(graphWidth, graphHeight) / 2;
        
        const colors = ['#10b981', '#3b82f6', '#ec4899', '#f59e0b', '#8b5cf6', '#ef4444'];
        
        for (let i = 0; i < values.length; i++) {
            const pct = values[i] / (total || 1);
            const sliceAngle = 2 * Math.PI * pct;
            
            chartCtx.fillStyle = colors[i % colors.length];
            chartCtx.beginPath();
            chartCtx.moveTo(centerX, centerY);
            chartCtx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
            chartCtx.closePath();
            chartCtx.fill();
            
            // Draw Legend
            chartCtx.fillRect(padding / 2, padding + i * 20, 12, 12);
            chartCtx.fillStyle = '#94a3b8';
            chartCtx.font = '11px sans-serif';
            chartCtx.fillText(`${labels[i]} (${(pct * 100).toFixed(0)}%)`, padding / 2 + 18, padding + i * 20 + 10);
            
            startAngle += sliceAngle;
        }
    }
}

// ==========================================
// CSV IMPORT/EXPORT ENGINE
// ==========================================
const csvLoader = document.getElementById('csvLoader');
const exportCsvBtn = document.getElementById('exportCsvBtn');
const clearSheetBtn = document.getElementById('clearSheetBtn');

csvLoader.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (evt) => {
        const text = evt.target.result;
        const rows = text.split('\n');

        pushUndoSnapshot();
        data = {};
        for (let r = 0; r < Math.min(rows.length, ROWS); r++) {
            const cols = rows[r].split(',');
            for (let c = 0; c < Math.min(cols.length, COLS); c++) {
                const cellId = String.fromCharCode(65 + c) + (r + 1);
                data[cellId] = cols[c].trim();
            }
        }
        recalculateSheet();
    };
    reader.readAsText(file);
});

exportCsvBtn.addEventListener('click', () => {
    let csvContent = "";
    for (let r = 0; r < ROWS; r++) {
        const rowData = [];
        for (let c = 0; c < COLS; c++) {
            const cellId = String.fromCharCode(65 + c) + (r + 1);
            rowData.push(data[cellId] || '');
        }
        csvContent += rowData.join(',') + '\n';
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `calcsheet_export_${Date.now()}.csv`;
    a.click();
});

clearSheetBtn.addEventListener('click', () => {
    if (confirm("Clear all data and formulas on this spreadsheet?")) {
        pushUndoSnapshot();
        data = {};
        recalculateSheet();
    }
});

// Help Modal Bindings
const helpModal = document.getElementById('helpModal');
const openHelpBtn = document.getElementById('openHelpBtn');
const closeHelpBtn = document.getElementById('closeHelpBtn');

if (openHelpBtn) {
    openHelpBtn.addEventListener('click', () => {
        helpModal.classList.add('open');
    });
}
if (closeHelpBtn) {
    closeHelpBtn.addEventListener('click', () => {
        helpModal.classList.remove('open');
    });
}

// Load Example Table with Query & Average
const loadExampleBtn = document.getElementById('loadExampleBtn');
if (loadExampleBtn) {
    loadExampleBtn.addEventListener('click', () => {
        pushUndoSnapshot();
        data = {};

        // Headers (A1:C1)
        data["A1"] = "Name";
        data["B1"] = "Age";
        data["C1"] = "Score";
        
        // Rows Data (A2:C9)
        data["A2"] = "Alice";   data["B2"] = "24"; data["C2"] = "85";
        data["A3"] = "Bob";     data["B3"] = "31"; data["C3"] = "92";
        data["A4"] = "Charlie"; data["B4"] = "22"; data["C4"] = "78";
        data["A5"] = "Diana";   data["B5"] = "29"; data["C5"] = "95";
        data["A6"] = "Ethan";   data["B6"] = "35"; data["C6"] = "88";
        data["A7"] = "Fiona";   data["B7"] = "26"; data["C7"] = "91";
        data["A8"] = "George";  data["B8"] = "19"; data["C8"] = "64";
        data["A9"] = "Hannah";  data["B9"] = "28"; data["C9"] = "89";
        
        // 1. Math formulas: Cells + Cells (Column E)
        data["E1"] = "Alice + Bob Score:";
        data["F1"] = "=C2 + C3";
        
        // 2. Cell Math Multiplication: (C5 Diana Score * 1.1)
        data["E3"] = "Diana + 10% Bonus:";
        data["F3"] = "=C5 * 1.1";
        
        // 3. Range SUM formula
        data["E5"] = "Total Score Sum:";
        data["F5"] = "=SUM(C2:C9)";
        
        // 4. Range AVERAGE formula
        data["E7"] = "Average Age:";
        data["F7"] = "=AVERAGE(B2:B9)";
        
        // 5. QUERY Spilling (Column H onwards)
        data["H1"] = "QUERY Spills (Ages > 25):";
        data["H2"] = '=Query(A2:C9, "SELECT Col1, Col3 WHERE Col2 > 25 ORDER BY Col3 DESC")';
        
        recalculateSheet();
        selectCell("H2");
        alert("Comprehensive Example Loaded!\n- F1, F3, F5, F7 demonstrate Cell Arithmetic and Range functions.\n- Column H demonstrates the SQL-style QUERY spilling results directly under the header label in H1.");
    });
}
// Start Sheet Recalculation loop initially
recalculateSheet();
selectCell("A1");

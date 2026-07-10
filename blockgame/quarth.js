// Framefall: an original rectangle-completion arcade game.
const FRAMEFALL_COLS = 16;
const FRAMEFALL_ROWS = 24;
const FRAMEFALL_DANGER_ROW = 21;
const FRAMEFALL_CELL = 24;
const FRAMEFALL_MAX_PROJECTILES = 4;
const FRAMEFALL_START_SPAWN_DELAY = 3;
const FRAMEFALL_MIN_SPAWN_DELAY = 1;

const FRAMEFALL_SHAPES = [
    // Wider pieces have short tails; narrow pieces have long tails.
    { id: 'wide-short-tail', width: 7, cells: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [0, 1], [6, 1], [0, 2], [6, 2]] },
    { id: 'medium-tail', width: 5, cells: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [0, 1], [4, 1], [0, 2], [4, 2], [0, 3], [4, 3]] },
    { id: 'long-tail', width: 4, cells: [[0, 0], [1, 0], [2, 0], [3, 0], [0, 1], [3, 1], [0, 2], [3, 2], [0, 3], [3, 3], [0, 4], [3, 4]] },
    { id: 'narrow-long-tail', width: 3, cells: [[0, 0], [1, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2], [0, 3], [2, 3], [0, 4], [2, 4], [0, 5], [2, 5]] },
    { id: 'left-long-hook', width: 3, cells: [[0, 0], [1, 0], [2, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5]] },
    { id: 'right-long-hook', width: 3, cells: [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2], [2, 3], [2, 4], [2, 5]] },
    { id: 'wide-short-t', width: 7, cells: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [3, 1], [3, 2]] },
    { id: 'medium-t', width: 5, cells: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [2, 1], [2, 2], [2, 3]] },
    { id: 'narrow-long-t', width: 3, cells: [[0, 0], [1, 0], [2, 0], [1, 1], [1, 2], [1, 3], [1, 4], [1, 5]] }
];

function createFramefallBoard(rows = FRAMEFALL_ROWS, columns = FRAMEFALL_COLS) {
    return Array.from({ length: rows }, () => Array(columns).fill(null));
}

function hasCompletePerimeter(board, rectangle) {
    const { left, right, top, bottom } = rectangle;
    for (let column = left; column <= right; column++) {
        if (!board[top][column] || !board[bottom][column]) return false;
    }
    for (let row = top; row <= bottom; row++) {
        if (!board[row][left] || !board[row][right]) return false;
    }
    return true;
}

function hasNoOutsideConnections(board, rectangle) {
    const { left, right, top, bottom } = rectangle;
    const rows = board.length;
    const columns = board[0].length;

    for (let column = left; column <= right; column++) {
        if (top > 0 && board[top][column] && board[top - 1][column]) return false;
        if (bottom < rows - 1 && board[bottom][column] && board[bottom + 1][column]) return false;
    }
    for (let row = top; row <= bottom; row++) {
        if (left > 0 && board[row][left] && board[row][left - 1]) return false;
        if (right < columns - 1 && board[row][right] && board[row][right + 1]) return false;
    }
    return true;
}

function findCompletedRectangle(board, shotColumn, shotRow) {
    const rows = board.length;
    const columns = board[0].length;
    const matches = [];

    for (let top = 0; top < rows - 1; top++) {
        for (let bottom = top + 1; bottom < rows; bottom++) {
            for (let left = 0; left < columns - 1; left++) {
                for (let right = left + 1; right < columns; right++) {
                    const shotOnBorder = shotColumn >= left && shotColumn <= right &&
                        shotRow >= top && shotRow <= bottom &&
                        (shotColumn === left || shotColumn === right || shotRow === top || shotRow === bottom);
                    const rectangle = { left, right, top, bottom };
                    if (!shotOnBorder || !hasCompletePerimeter(board, rectangle) || !hasNoOutsideConnections(board, rectangle)) continue;

                    let occupied = 0;
                    for (let row = top; row <= bottom; row++) {
                        for (let column = left; column <= right; column++) {
                            if (board[row][column]) occupied++;
                        }
                    }
                    matches.push({
                        left, right, top, bottom, occupied,
                        width: right - left + 1,
                        height: bottom - top + 1,
                        area: (right - left + 1) * (bottom - top + 1)
                    });
                }
            }
        }
    }

    matches.sort((a, b) =>
        b.area - a.area ||
        b.occupied - a.occupied ||
        b.width - a.width ||
        b.height - a.height ||
        a.left - b.left ||
        a.top - b.top
    );
    return matches[0] || null;
}

let framefallBoard = createFramefallBoard();
let framefallPlayerColumn = 8;
let framefallProjectiles = [];
let framefallScore = 0;
let framefallHighScore = 0;
let framefallStatus = 'GAMEOVER';
let framefallFast = false;
let framefallScrollInterval = 90;
let framefallScrollTicks = 0;
let framefallDifficultyTicks = 0;
let framefallSpawnDelay = FRAMEFALL_START_SPAWN_DELAY;
let framefallSpawnCountdown = framefallSpawnDelay;
let framefallGroupId = 0;
let framefallSeed = 0x4f524745;
let framefallClearingRect = null;
let framefallClearTicks = 0;
let framefallLoopId = null;
let framefallLastTime = 0;
let framefallAccumulator = 0;

const framefallCanvas = typeof document === 'undefined' ? null : document.getElementById('framefall-canvas');
const framefallCtx = framefallCanvas ? framefallCanvas.getContext('2d') : null;

function framefallRandom() {
    framefallSeed ^= framefallSeed << 13;
    framefallSeed ^= framefallSeed >>> 17;
    framefallSeed ^= framefallSeed << 5;
    return (framefallSeed >>> 0) / 4294967296;
}

function createFramefallSeed() {
    if (globalThis.crypto?.getRandomValues) {
        const values = new Uint32Array(1);
        globalThis.crypto.getRandomValues(values);
        return values[0] || 0x4f524745;
    }
    return (Date.now() >>> 0) || 0x4f524745;
}

function canSpawnFramefallShape(board, shape, column) {
    const lowestRowByColumn = new Map();
    for (const [x, y] of shape.cells) {
        const boardColumn = column + x;
        if (board[y][boardColumn]) return false;
        lowestRowByColumn.set(boardColumn, Math.max(lowestRowByColumn.get(boardColumn) ?? -1, y));
    }
    for (const [boardColumn, lowestRow] of lowestRowByColumn) {
        for (let row = lowestRow + 1; row < board.length; row++) {
            if (board[row][boardColumn]) return false;
        }
    }
    return true;
}

function spawnFramefallShape() {
    const shape = FRAMEFALL_SHAPES[Math.floor(framefallRandom() * FRAMEFALL_SHAPES.length)];
    const start = Math.floor(framefallRandom() * (FRAMEFALL_COLS - shape.width + 1));
    let column = -1;
    for (let offset = 0; offset <= FRAMEFALL_COLS - shape.width; offset++) {
        const candidate = (start + offset) % (FRAMEFALL_COLS - shape.width + 1);
        if (canSpawnFramefallShape(framefallBoard, shape, candidate)) {
            column = candidate;
            break;
        }
    }
    if (column < 0) return false;
    framefallGroupId++;
    for (const [x, y] of shape.cells) {
        framefallBoard[y][column + x] = { type: 'block', groupId: framefallGroupId };
    }
    return true;
}

function shiftFramefallBoard() {
    for (let row = FRAMEFALL_ROWS - 1; row > 0; row--) {
        framefallBoard[row] = framefallBoard[row - 1].slice();
    }
    framefallBoard[0].fill(null);

    framefallSpawnCountdown--;
    if (framefallSpawnCountdown <= 0 && spawnFramefallShape()) {
        framefallSpawnCountdown = framefallSpawnDelay;
    }

    if (framefallBoard.slice(FRAMEFALL_DANGER_ROW).some(row => row.some(Boolean))) {
        triggerFramefallGameOver();
    }
}

function attachFramefallProjectile(projectile, row) {
    const attachRow = row + 1;
    if (attachRow >= FRAMEFALL_ROWS || framefallBoard[attachRow][projectile.column]) return;
    framefallBoard[attachRow][projectile.column] = { type: 'block', groupId: 0 };
    const rectangle = findCompletedRectangle(framefallBoard, projectile.column, attachRow);
    if (rectangle) {
        framefallClearingRect = rectangle;
        framefallClearTicks = 12;
        if (typeof playSound === 'function') playSound('clear');
    } else if (typeof playSound === 'function') {
        playSound('lock');
    }
}

function updateFramefallProjectiles() {
    const remaining = [];
    for (const projectile of framefallProjectiles) {
        projectile.row -= 0.4;
        const row = Math.floor(projectile.row);
        if (row < 0) continue;
        if (framefallBoard[row][projectile.column]) {
            attachFramefallProjectile(projectile, row);
        } else {
            remaining.push(projectile);
        }
    }
    framefallProjectiles = remaining;
}

function clearFramefallRectangle() {
    let removed = 0;
    const { left, right, top, bottom } = framefallClearingRect;
    for (let row = top; row <= bottom; row++) {
        for (let column = left; column <= right; column++) {
            if (framefallBoard[row][column]) {
                framefallBoard[row][column] = null;
                removed++;
            }
        }
    }
    framefallScore += removed * 10;
    framefallHighScore = Math.max(framefallHighScore, framefallScore);
    framefallClearingRect = null;
    updateFramefallHud();
}

function updateFramefallTick() {
    if (framefallStatus !== 'PLAYING') return;
    if (framefallClearTicks > 0) {
        framefallClearTicks--;
        if (framefallClearTicks === 0) clearFramefallRectangle();
        return;
    }

    updateFramefallProjectiles();
    framefallDifficultyTicks++;
    if (framefallDifficultyTicks >= 1800) {
        framefallDifficultyTicks = 0;
        framefallScrollInterval = Math.max(25, framefallScrollInterval - 5);
        framefallSpawnDelay = Math.max(FRAMEFALL_MIN_SPAWN_DELAY, framefallSpawnDelay - 1);
        framefallSpawnCountdown = Math.min(framefallSpawnCountdown, framefallSpawnDelay);
        updateFramefallHud();
    }

    framefallScrollTicks += framefallFast ? 4 : 1;
    if (framefallScrollTicks >= framefallScrollInterval) {
        framefallScrollTicks -= framefallScrollInterval;
        shiftFramefallBoard();
    }
}

function framefallLoop(timestamp) {
    if (framefallStatus !== 'PLAYING') return;
    framefallAccumulator += Math.min(100, timestamp - framefallLastTime);
    framefallLastTime = timestamp;
    let steps = 0;
    while (framefallAccumulator >= 1000 / 60 && steps < 6) {
        updateFramefallTick();
        framefallAccumulator -= 1000 / 60;
        steps++;
    }
    renderFramefall();
    framefallLoopId = requestAnimationFrame(framefallLoop);
}

function drawFramefallBlock(column, row, color, glow = false) {
    const x = column * FRAMEFALL_CELL;
    const y = row * FRAMEFALL_CELL;
    framefallCtx.save();
    if (glow) {
        framefallCtx.shadowColor = '#f8fafc';
        framefallCtx.shadowBlur = 12;
    }
    framefallCtx.fillStyle = color;
    framefallCtx.fillRect(x + 2, y + 2, FRAMEFALL_CELL - 4, FRAMEFALL_CELL - 4);
    framefallCtx.fillStyle = 'rgba(255,255,255,.28)';
    framefallCtx.fillRect(x + 4, y + 4, FRAMEFALL_CELL - 8, 3);
    framefallCtx.restore();
}

function renderFramefall() {
    if (!framefallCtx) return;
    framefallCtx.fillStyle = '#07110f';
    framefallCtx.fillRect(0, 0, framefallCanvas.width, framefallCanvas.height);
    framefallCtx.strokeStyle = 'rgba(74,222,128,.08)';
    framefallCtx.lineWidth = 1;
    for (let column = 1; column < FRAMEFALL_COLS; column++) {
        framefallCtx.beginPath();
        framefallCtx.moveTo(column * FRAMEFALL_CELL, 0);
        framefallCtx.lineTo(column * FRAMEFALL_CELL, framefallCanvas.height);
        framefallCtx.stroke();
    }
    for (let row = 1; row < FRAMEFALL_ROWS; row++) {
        framefallCtx.beginPath();
        framefallCtx.moveTo(0, row * FRAMEFALL_CELL);
        framefallCtx.lineTo(framefallCanvas.width, row * FRAMEFALL_CELL);
        framefallCtx.stroke();
    }

    for (let row = 0; row < FRAMEFALL_ROWS; row++) {
        for (let column = 0; column < FRAMEFALL_COLS; column++) {
            const block = framefallBoard[row][column];
            if (!block) continue;
            const clearing = framefallClearingRect &&
                column >= framefallClearingRect.left && column <= framefallClearingRect.right &&
                row >= framefallClearingRect.top && row <= framefallClearingRect.bottom;
            const colors = ['#34d399', '#22d3ee', '#a78bfa', '#fbbf24', '#fb7185'];
            drawFramefallBlock(column, row, clearing && framefallClearTicks % 4 < 2 ? '#ffffff' : colors[Math.abs(block.groupId) % colors.length], clearing);
        }
    }

    framefallCtx.strokeStyle = '#fb7185';
    framefallCtx.lineWidth = 2;
    framefallCtx.setLineDash([8, 5]);
    framefallCtx.beginPath();
    framefallCtx.moveTo(0, FRAMEFALL_DANGER_ROW * FRAMEFALL_CELL + 1);
    framefallCtx.lineTo(framefallCanvas.width, FRAMEFALL_DANGER_ROW * FRAMEFALL_CELL + 1);
    framefallCtx.stroke();
    framefallCtx.setLineDash([]);

    for (const projectile of framefallProjectiles) {
        drawFramefallBlock(projectile.column, projectile.row, '#f8fafc', true);
    }
    drawFramefallBlock(framefallPlayerColumn, FRAMEFALL_ROWS - 1, '#4ade80', true);
    framefallCtx.fillStyle = '#07110f';
    framefallCtx.fillRect(framefallPlayerColumn * FRAMEFALL_CELL + 9, (FRAMEFALL_ROWS - 1) * FRAMEFALL_CELL + 4, 6, 7);
}

function updateFramefallHud() {
    if (typeof document === 'undefined') return;
    for (const id of ['framefall-score', 'framefall-score-mobile']) document.getElementById(id).textContent = framefallScore;
    for (const id of ['framefall-high-score', 'framefall-high-score-mobile']) document.getElementById(id).textContent = framefallHighScore;
    document.getElementById('framefall-speed').textContent = framefallScrollInterval;
}

function loadFramefallHighScore() {
    try { return Number(localStorage.getItem('framefallHighScore')) || 0; } catch (_) { return 0; }
}

function saveFramefallHighScore() {
    try { localStorage.setItem('framefallHighScore', String(framefallHighScore)); } catch (_) {}
}

function startFramefallGame() {
    stopFramefallGame();
    framefallBoard = createFramefallBoard();
    framefallPlayerColumn = 8;
    framefallProjectiles = [];
    framefallScore = 0;
    framefallHighScore = loadFramefallHighScore();
    framefallStatus = 'PLAYING';
    framefallFast = false;
    framefallSeed = createFramefallSeed();
    framefallScrollInterval = 80 + Math.floor(framefallRandom() * 21);
    framefallScrollTicks = 0;
    framefallDifficultyTicks = 0;
    framefallSpawnDelay = FRAMEFALL_START_SPAWN_DELAY;
    framefallSpawnCountdown = framefallSpawnDelay;
    framefallGroupId = 0;
    framefallClearingRect = null;
    framefallClearTicks = 0;
    framefallAccumulator = 0;
    spawnFramefallShape();
    document.getElementById('framefall-gameover-overlay').classList.remove('open');
    document.getElementById('framefall-pause-overlay').classList.remove('open');
    updateFramefallHud();
    renderFramefall();
    framefallLastTime = performance.now();
    framefallLoopId = requestAnimationFrame(framefallLoop);
}

function stopFramefallGame() {
    if (framefallLoopId) cancelAnimationFrame(framefallLoopId);
    framefallLoopId = null;
    framefallFast = false;
}

function pauseFramefallGame() {
    if (framefallStatus === 'GAMEOVER') return;
    if (framefallStatus === 'PLAYING') {
        framefallStatus = 'PAUSED';
        stopFramefallGame();
        document.getElementById('framefall-pause-overlay').classList.add('open');
    } else {
        framefallStatus = 'PLAYING';
        document.getElementById('framefall-pause-overlay').classList.remove('open');
        framefallLastTime = performance.now();
        framefallLoopId = requestAnimationFrame(framefallLoop);
    }
}

function triggerFramefallGameOver() {
    framefallStatus = 'GAMEOVER';
    framefallProjectiles = [];
    framefallHighScore = Math.max(framefallHighScore, framefallScore);
    saveFramefallHighScore();
    updateFramefallHud();
    document.getElementById('framefall-final-score').textContent = framefallScore;
    document.getElementById('framefall-gameover-overlay').classList.add('open');
    if (typeof playSound === 'function') playSound('gameover');
}

function moveFramefallPlayer(direction) {
    if (framefallStatus !== 'PLAYING') return;
    framefallPlayerColumn = Math.max(0, Math.min(FRAMEFALL_COLS - 1, framefallPlayerColumn + direction));
    if (typeof playSound === 'function') playSound('move');
    renderFramefall();
}

function fireFramefallProjectile() {
    if (framefallStatus !== 'PLAYING' || framefallProjectiles.length >= FRAMEFALL_MAX_PROJECTILES || framefallClearingRect) return;
    framefallProjectiles.push({ column: framefallPlayerColumn, row: FRAMEFALL_ROWS - 1.1 });
    if (typeof playSound === 'function') playSound('flip');
}

function setFramefallFast(value) {
    framefallFast = framefallStatus === 'PLAYING' && value;
}

if (typeof document !== 'undefined') {
    document.getElementById('framefall-pause-btn').addEventListener('click', pauseFramefallGame);
    document.getElementById('framefall-reset-btn').addEventListener('click', startFramefallGame);
    document.getElementById('framefall-retry-btn').addEventListener('click', startFramefallGame);
}

if (typeof module !== 'undefined') {
    module.exports = { createFramefallBoard, hasCompletePerimeter, findCompletedRectangle, createFramefallSeed, canSpawnFramefallShape, FRAMEFALL_SHAPES };
}

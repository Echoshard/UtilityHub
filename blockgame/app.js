// ==========================================
// AUDIO SYSTEM (CORS-safe HTML5 Audio & Chiptune Synth)
// ==========================================
const sounds = {
    swap: new Audio('audio/swap.wav'),
    move: new Audio('audio/move.wav'),
    clear: new Audio('audio/line_clear.wav'),
    lock: new Audio('audio/lock.wav'),
    flip: new Audio('audio/flip.wav'),
    gameover: new Audio('audio/line_clear.wav')
};

// Pre-load sounds
Object.values(sounds).forEach(audio => {
    audio.load();
});

function playSound(name) {
    try {
        const audio = sounds[name];
        if (audio) {
            const clone = audio.cloneNode();
            clone.volume = 0.4;
            clone.play().catch(err => {});
        }
    } catch (e) {
        console.warn("Audio playback failed:", e);
    }
}

// 8-Bit Chiptune Synth Player
let musicCtx = null;
let noteTimeoutId = null;
let chiptuneMuted = false;

const NOTE_FREQS = {
    'A3': 220, 'B3': 247, 'C4': 262, 'D4': 294, 'E4': 330, 'F4': 349, 'G4': 392,
    'A4': 440, 'B4': 494, 'C5': 523, 'D5': 587, 'E5': 659, 'F5': 698, 'G5': 784,
    'A5': 880, 'B5': 988, 'C6': 1047, 'rest': 0
};

// Tetris Theme A (Korobeiniki)
const TETRIS_MELODY = [
    'E5', 'B4', 'C5', 'D5', 'C5', 'B4', 'A4', 'A4', 'C5', 'E5', 'D5', 'C5', 'B4', 'C5', 'D5', 'E5',
    'C5', 'A4', 'A4', 'rest', 'D5', 'F5', 'A5', 'G5', 'F5', 'E5', 'C5', 'E5', 'D5', 'C5', 'B4', 'B4',
    'C5', 'D5', 'E5', 'C5', 'A4', 'A4', 'rest'
];
const TETRIS_DURS = [
    4, 2, 2, 4, 2, 2, 4, 2, 2, 4, 2, 2, 6, 2, 4, 4,
    4, 4, 4, 4, 6, 2, 4, 2, 2, 6, 2, 4, 2, 2, 4, 2,
    2, 4, 4, 4, 4, 4, 4
];

// Block Attack Upbeat Theme
const ATTACK_MELODY = [
    'C5', 'E5', 'G5', 'C6', 'A5', 'F5', 'D5', 'G5', 'E5', 'C5', 'A4', 'D5', 'B4', 'G4', 'B4', 'D5',
    'C5', 'G5', 'A5', 'F5', 'E5', 'D5', 'C5', 'rest'
];
const ATTACK_DURS = [
    2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
    4, 4, 4, 4, 4, 4, 8, 4
];

function initMusicContext() {
    if (!musicCtx) {
        musicCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (musicCtx && musicCtx.state === 'suspended') {
        musicCtx.resume().catch(() => {});
    }
}

function playChiptuneTrack(trackName) {
    stopChiptune();
    if (chiptuneMuted) return;
    
    initMusicContext();
    if (!musicCtx) return;
    
    const melody = (trackName === 'TETRIS') ? TETRIS_MELODY : ATTACK_MELODY;
    const durs = (trackName === 'TETRIS') ? TETRIS_DURS : ATTACK_DURS;
    
    let index = 0;
    
    function playNextNote() {
        if (chiptuneMuted || currentMode !== trackName) return;
        if (currentMode === 'TETRIS' && tetrisStatus !== 'PLAYING') return;
        if (currentMode === 'BLOCK_ATTACK' && attackStatus !== 'PLAYING') return;
        
        const note = melody[index];
        const durSteps = durs[index];
        const durSeconds = durSteps * 0.125; // 125ms per 16th note step
        
        if (note !== 'rest' && NOTE_FREQS[note]) {
            const now = musicCtx.currentTime;
            
            // Lead voice: triangle wave (Gameboy style)
            const osc = musicCtx.createOscillator();
            const gain = musicCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(NOTE_FREQS[note], now);
            
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + durSeconds - 0.02);
            
            osc.connect(gain);
            gain.connect(musicCtx.destination);
            
            osc.start(now);
            osc.stop(now + durSeconds - 0.01);
            
            // Bass accompaniment: warm low-pass sawtooth
            let bassNote = note.replace('5', '3').replace('6', '4').replace('4', '2');
            if (NOTE_FREQS[bassNote]) {
                const bassOsc = musicCtx.createOscillator();
                const bassGain = musicCtx.createGain();
                const filter = musicCtx.createBiquadFilter();
                
                bassOsc.type = 'sawtooth';
                bassOsc.frequency.setValueAtTime(NOTE_FREQS[bassNote], now);
                
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(200, now);
                
                bassGain.gain.setValueAtTime(0.03, now);
                bassGain.gain.exponentialRampToValueAtTime(0.001, now + durSeconds - 0.02);
                
                bassOsc.connect(filter);
                filter.connect(bassGain);
                bassGain.connect(musicCtx.destination);
                
                bassOsc.start(now);
                bassOsc.stop(now + durSeconds - 0.01);
            }
        }
        
        index = (index + 1) % melody.length;
        noteTimeoutId = setTimeout(playNextNote, durSeconds * 1000);
    }
    
    playNextNote();
}

function stopChiptune() {
    if (noteTimeoutId) {
        clearTimeout(noteTimeoutId);
        noteTimeoutId = null;
    }
}

// Music mute toggle handler
const musicToggleBtn = document.getElementById('music-toggle-btn');
const musicIcon = document.getElementById('music-icon');
if (musicToggleBtn) {
    musicToggleBtn.addEventListener('click', () => {
        chiptuneMuted = !chiptuneMuted;
        if (musicIcon) {
            musicIcon.textContent = chiptuneMuted ? '🔇 Off' : '🎵 On';
        }
        if (chiptuneMuted) {
            stopChiptune();
        } else {
            if (currentMode === 'TETRIS' || currentMode === 'BLOCK_ATTACK') {
                playChiptuneTrack(currentMode);
            }
        }
    });
}

// ==========================================
// ARCADE HUB CONFIG & VIEWS
// ==========================================
let currentMode = 'MENU'; // 'MENU' | 'BLOCK_ATTACK' | 'TETRIS'

const viewMenu = document.getElementById('menu-view');
const viewAttack = document.getElementById('attack-view');
const viewTetris = document.getElementById('tetris-view');
const mobileControls = document.getElementById('mobile-controls');

function switchView(mode) {
    currentMode = mode;
    
    // Stop any active loops & music
    stopAttackGame();
    stopTetrisGame();
    stopChiptune();

    viewMenu.classList.remove('active');
    viewAttack.classList.remove('active');
    viewTetris.classList.remove('active');
    mobileControls.style.display = 'none';

    if (mode === 'MENU') {
        viewMenu.classList.add('active');
    } else if (mode === 'BLOCK_ATTACK') {
        viewAttack.classList.add('active');
        if (window.innerWidth <= 768) mobileControls.style.display = 'flex';
        startAttackGame();
        playChiptuneTrack('BLOCK_ATTACK');
    } else if (mode === 'TETRIS') {
        viewTetris.classList.add('active');
        if (window.innerWidth <= 768) mobileControls.style.display = 'flex';
        startTetrisGame();
        playChiptuneTrack('TETRIS');
    }
}

document.getElementById('btn-mode-attack').addEventListener('click', () => switchView('BLOCK_ATTACK'));
document.getElementById('btn-mode-tetris').addEventListener('click', () => switchView('TETRIS'));

document.getElementById('attack-home-btn').addEventListener('click', () => switchView('MENU'));
document.getElementById('tetris-home-btn').addEventListener('click', () => switchView('MENU'));

// Handle window resize to toggle mobile controls display
window.addEventListener('resize', () => {
    if (currentMode !== 'MENU' && window.innerWidth <= 768) {
        mobileControls.style.display = 'flex';
    } else {
        mobileControls.style.display = 'none';
    }
});

// ==========================================
// BLOCK ATTACK GAME LOGIC
// ==========================================
const COLS = 6;
const ROWS = 12;
const TOTAL_ROWS = 13;
const BLOCK_SIZE = 48; // px

const BlockColor = {
    EMPTY: 0,
    RED: 1,
    GREEN: 2,
    YELLOW: 3,
    PURPLE: 4,
    CYAN: 5,
    BLUE: 6,
    GARBAGE: 7
};

const COLOR_CLASSES = {
    [BlockColor.EMPTY]: 'cell-empty',
    [BlockColor.RED]: 'c-red',
    [BlockColor.GREEN]: 'c-green',
    [BlockColor.YELLOW]: 'c-yellow',
    [BlockColor.PURPLE]: 'c-purple',
    [BlockColor.CYAN]: 'c-cyan',
    [BlockColor.BLUE]: 'c-blue',
    [BlockColor.GARBAGE]: 'c-garbage'
};

const HEX_COLORS = {
    [BlockColor.RED]: '#ef4444',
    [BlockColor.GREEN]: '#22c55e',
    [BlockColor.YELLOW]: '#eab308',
    [BlockColor.PURPLE]: '#a855f7',
    [BlockColor.CYAN]: '#06b6d4',
    [BlockColor.BLUE]: '#3b82f6',
    [BlockColor.GARBAGE]: '#64748b'
};

let attackGrid = [];
let attackNextRow = [];
let attackCursor = { x: 2, y: 6 };
let attackScore = 0;
let attackLevel = 1;
let attackTime = 0;
let attackTimeTimer = null;
let attackRiseOffset = 0;
let attackBaseSpeed = 0.05;
let attackStopTime = 0;
let attackStatus = 'GAMEOVER'; // 'PLAYING' | 'PAUSED' | 'GAMEOVER'
let attackParticles = [];
let attackLoopId = null;
let lastAttackFrameTime = 0;
let isPushingStack = false;

const attackGridEl = document.getElementById('attack-grid');
const attackCursorEl = document.getElementById('attack-cursor');
const attackParticlesCanvas = document.getElementById('attack-particles-canvas');
const attackParticlesCtx = attackParticlesCanvas.getContext('2d');
const attackScoreEl = document.getElementById('attack-score');
const attackLevelEl = document.getElementById('attack-level');
const attackTimeEl = document.getElementById('attack-time');
const attackSpeedSlider = document.getElementById('attack-speed-slider');
const attackSpeedVal = document.getElementById('attack-speed-val');

// Sync speed slider with label
attackSpeedSlider.addEventListener('input', () => {
    const val = parseFloat(attackSpeedSlider.value);
    attackSpeedVal.textContent = Math.round(val * 100);
    if (attackStatus === 'PLAYING') {
        attackBaseSpeed = val;
    }
});

function generateRandomBlock() {
    return {
        type: Math.floor(Math.random() * 6) + 1,
        state: 'IDLE', // 'IDLE' | 'CLEARING' | 'FALLING'
        timer: 0,
        visualOffset: { x: 0, y: 0 }
    };
}

function generateRow() {
    const row = [];
    for (let c = 0; c < COLS; c++) {
        let block = generateRandomBlock();
        while (c >= 2 && row[c - 1].type === block.type && row[c - 2].type === block.type) {
            block = generateRandomBlock();
        }
        row.push(block);
    }
    return row;
}

function generateEmptyRow() {
    return Array.from({ length: COLS }, () => ({
        type: BlockColor.EMPTY,
        state: 'IDLE',
        timer: 0,
        visualOffset: { x: 0, y: 0 }
    }));
}

function initAttackGrid() {
    attackGrid = [];
    // Top half empty
    for (let r = 0; r < 6; r++) {
        attackGrid.push(generateEmptyRow());
    }
    // Bottom half filled
    for (let r = 6; r < TOTAL_ROWS; r++) {
        attackGrid.push(generateRow());
    }
    attackNextRow = generateRow();
}

function performSwap() {
    if (attackStatus !== 'PLAYING') return;
    const { x, y } = attackCursor;
    if (x >= COLS - 1 || y >= ROWS) return;

    const b1 = attackGrid[y][x];
    const b2 = attackGrid[y][x + 1];

    // Cannot swap clearing blocks
    if (b1.state !== 'IDLE' || b2.state !== 'IDLE') return;

    attackGrid[y][x] = b2;
    attackGrid[y][x + 1] = b1;

    b1.visualOffset = { x: -1, y: 0 };
    b2.visualOffset = { x: 1, y: 0 };

    playSound('swap');
}

function checkAttackMatches() {
    const matched = new Set();
    const matches = [];

    // Horizontal check
    for (let r = 0; r < TOTAL_ROWS; r++) {
        for (let c = 0; c < COLS - 2; c++) {
            const b1 = attackGrid[r][c];
            const b2 = attackGrid[r][c + 1];
            const b3 = attackGrid[r][c + 2];

            if (b1.type !== BlockColor.EMPTY && b1.state === 'IDLE' &&
                b1.type === b2.type && b2.state === 'IDLE' &&
                b1.type === b3.type && b3.state === 'IDLE') {
                matched.add(`${r},${c}`);
                matched.add(`${r},${c + 1}`);
                matched.add(`${r},${c + 2}`);
            }
        }
    }

    // Vertical check
    for (let c = 0; c < COLS; c++) {
        for (let r = 0; r < TOTAL_ROWS - 2; r++) {
            const b1 = attackGrid[r][c];
            const b2 = attackGrid[r + 1][c];
            const b3 = attackGrid[r + 2][c];

            if (b1.type !== BlockColor.EMPTY && b1.state === 'IDLE' &&
                b1.type === b2.type && b2.state === 'IDLE' &&
                b1.type === b3.type && b3.state === 'IDLE') {
                matched.add(`${r},${c}`);
                matched.add(`${r + 1},${c}`);
                matched.add(`${r + 2},${c}`);
            }
        }
    }

    matched.forEach(key => {
        const [r, c] = key.split(',').map(Number);
        matches.push({ r, c });
    });

    return matches;
}

function createExplosion(r, c, color) {
    const count = 10;
    const cx = c * BLOCK_SIZE + BLOCK_SIZE / 2;
    const cy = r * BLOCK_SIZE + BLOCK_SIZE / 2;

    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        const speed = Math.random() * 2 + 2;
        attackParticles.push({
            x: cx,
            y: cy,
            color: color,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 1.5,
            life: 1.0,
            size: Math.random() * 3 + 3
        });
    }
}

function updateAttackGame(timestamp) {
    if (attackStatus !== 'PLAYING') return;

    if (!lastAttackFrameTime) lastAttackFrameTime = timestamp;
    const deltaTime = timestamp - lastAttackFrameTime;
    lastAttackFrameTime = timestamp;

    // 1. Handle board rising
    let currentRiseSpeed = attackStopTime > 0 ? 0 : attackBaseSpeed;
    if (isPushingStack && attackStopTime <= 0) {
        currentRiseSpeed = 2.0; // PUSH_SPEED
    }

    if (attackStopTime > 0) {
        attackStopTime--;
    } else {
        attackRiseOffset += currentRiseSpeed * (deltaTime / 16.66);
        if (attackRiseOffset >= 100) {
            // Check if top row is occupied -> GAME OVER
            const topRow = attackGrid[0];
            if (topRow.some(b => b.type !== BlockColor.EMPTY)) {
                triggerAttackGameOver();
                return;
            }

            // Push grid up
            attackGrid.shift();
            attackGrid.push(attackNextRow);
            attackNextRow = generateRow();
            attackRiseOffset = 0;

            if (attackCursor.y > 0) attackCursor.y--;
        }
    }

    // 2. Physics / Gravity / Fall / Match state updates
    let blocksChanged = false;

    for (let c = 0; c < COLS; c++) {
        for (let r = TOTAL_ROWS - 1; r >= 0; r--) {
            const block = attackGrid[r][c];

            // Visual sliding interpolation decay
            if (block.visualOffset.x !== 0 || block.visualOffset.y !== 0) {
                block.visualOffset.x *= 0.7;
                block.visualOffset.y *= 0.7;
                if (Math.abs(block.visualOffset.x) < 0.05) block.visualOffset.x = 0;
                if (Math.abs(block.visualOffset.y) < 0.05) block.visualOffset.y = 0;
                blocksChanged = true;
            }

            // Clearing timer
            if (block.state === 'CLEARING') {
                block.timer--;
                blocksChanged = true;
                if (block.timer <= 0) {
                    createExplosion(r, c, HEX_COLORS[block.type]);
                    block.type = BlockColor.EMPTY;
                    block.state = 'IDLE';
                    attackScore += 10 * attackLevel;
                    attackStopTime += 12; // Stop rising stack momentarily
                }
            }

            // Gravity falling check
            if (block.state === 'IDLE' && block.type !== BlockColor.EMPTY) {
                if (r < TOTAL_ROWS - 1) {
                    const below = attackGrid[r + 1][c];
                    if (below.type === BlockColor.EMPTY && below.state === 'IDLE') {
                        // Fall block down
                        attackGrid[r + 1][c] = block;
                        attackGrid[r][c] = below;
                        block.visualOffset.y = -1;
                        blocksChanged = true;
                    }
                }
            }
        }
    }

    // 3. Find and register matches
    const matches = checkAttackMatches();
    if (matches.length > 0) {
        let isNewMatch = false;
        matches.forEach(({ r, c }) => {
            const block = attackGrid[r][c];
            if (block.state === 'IDLE' && block.type !== BlockColor.EMPTY) {
                block.state = 'CLEARING';
                block.timer = 20; // CLEAR_TIME frames (down from 45)
                isNewMatch = true;
            }
        });

        if (isNewMatch) {
            attackStopTime = 20; // Stop stack rising (down from 45)
            playSound('clear');
        }
    }

    // 4. Update particles physics
    for (let i = attackParticles.length - 1; i >= 0; i--) {
        const p = attackParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.25; // gravity pull
        p.life -= 0.02;
        if (p.life <= 0) {
            attackParticles.splice(i, 1);
        }
    }

    // Render loop calls
    renderAttackGrid();
    renderAttackParticles();

    attackLoopId = requestAnimationFrame(updateAttackGame);
}

function renderAttackGrid() {
    attackGridEl.innerHTML = '';
    
    // Set vertical transform offset
    const translateY = (attackRiseOffset / 100) * BLOCK_SIZE;
    attackGridEl.style.transform = `translateY(${-translateY}px)`;

    // Render cells (Skip the topmost row buffer from visibility if needed, but drawing 13 rows handles rising transitions perfectly)
    for (let r = 0; r < TOTAL_ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const block = attackGrid[r][c];
            const cell = document.createElement('div');
            cell.className = 'cell';
            
            if (block.type !== BlockColor.EMPTY) {
                const blockEl = document.createElement('div');
                blockEl.className = `block ${COLOR_CLASSES[block.type]}`;
                if (block.state === 'CLEARING') blockEl.classList.add('clearing');
                
                // Visual sliding offset styles
                const xOffset = block.visualOffset.x * BLOCK_SIZE;
                const yOffset = block.visualOffset.y * BLOCK_SIZE;
                if (xOffset !== 0 || yOffset !== 0) {
                    blockEl.style.transform = `translate(${xOffset}px, ${yOffset}px)`;
                }
                
                cell.appendChild(blockEl);
            }
            attackGridEl.appendChild(cell);
        }
    }

    // Render cursor
    const cursorX = attackCursor.x * BLOCK_SIZE;
    const cursorY = attackCursor.y * BLOCK_SIZE - translateY;
    attackCursorEl.style.left = cursorX + 'px';
    attackCursorEl.style.top = cursorY + 'px';
    
    // Sync HUD stats
    attackScoreEl.textContent = attackScore;
    attackLevelEl.textContent = attackLevel;
}

function renderAttackParticles() {
    attackParticlesCtx.clearRect(0, 0, attackParticlesCanvas.width, attackParticlesCanvas.height);
    
    const translateY = (attackRiseOffset / 100) * BLOCK_SIZE;

    attackParticles.forEach(p => {
        attackParticlesCtx.fillStyle = p.color;
        attackParticlesCtx.globalAlpha = p.life;
        // Shift drawing by current rise stack offset so particles explode relative to rising cells
        attackParticlesCtx.fillRect(p.x, p.y - translateY, p.size, p.size);
    });
    attackParticlesCtx.globalAlpha = 1.0;
}

function triggerAttackGameOver() {
    attackStatus = 'GAMEOVER';
    stopChiptune();
    playSound('gameover');
    document.getElementById('attack-final-score').textContent = attackScore;
    document.getElementById('attack-gameover-overlay').classList.add('open');
    if (attackTimeTimer) clearInterval(attackTimeTimer);
}

function startAttackGame() {
    // Hide overlay
    document.getElementById('attack-gameover-overlay').classList.remove('open');
    document.getElementById('attack-pause-overlay').classList.remove('open');

    // Init state
    attackScore = 0;
    attackLevel = 1;
    attackTime = 0;
    attackRiseOffset = 0;
    attackStopTime = 0;
    attackBaseSpeed = parseFloat(attackSpeedSlider.value) || 0.05;
    attackParticles = [];
    attackCursor = { x: 2, y: 6 };
    isPushingStack = false;

    initAttackGrid();
    attackStatus = 'PLAYING';
    playChiptuneTrack('BLOCK_ATTACK');
    
    // Start timing clock
    if (attackTimeTimer) clearInterval(attackTimeTimer);
    attackTimeTimer = setInterval(() => {
        if (attackStatus === 'PLAYING') {
            attackTime++;
            const mins = Math.floor(attackTime / 60);
            const secs = attackTime % 60;
            attackTimeEl.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
            
            // Level up speed slightly every 30 seconds
            if (attackTime % 30 === 0) {
                attackLevel++;
                attackBaseSpeed = Math.min(1.0, attackBaseSpeed + 0.015);
                attackSpeedSlider.value = attackBaseSpeed;
                attackSpeedVal.textContent = Math.round(attackBaseSpeed * 100);
            }
        }
    }, 1000);

    lastAttackFrameTime = 0;
    if (attackLoopId) cancelAnimationFrame(attackLoopId);
    attackLoopId = requestAnimationFrame(updateAttackGame);
}

function stopAttackGame() {
    attackStatus = 'GAMEOVER';
    if (attackTimeTimer) clearInterval(attackTimeTimer);
    if (attackLoopId) cancelAnimationFrame(attackLoopId);
}

function pauseAttackGame() {
    if (attackStatus === 'PLAYING') {
        attackStatus = 'PAUSED';
        stopChiptune();
        document.getElementById('attack-pause-overlay').classList.add('open');
    } else if (attackStatus === 'PAUSED') {
        attackStatus = 'PLAYING';
        playChiptuneTrack('BLOCK_ATTACK');
        document.getElementById('attack-pause-overlay').classList.remove('open');
        lastAttackFrameTime = 0;
        attackLoopId = requestAnimationFrame(updateAttackGame);
    }
}

// Bind Attack Toolbar Actions
document.getElementById('attack-pause-btn').addEventListener('click', pauseAttackGame);
document.getElementById('attack-reset-btn').addEventListener('click', startAttackGame);
document.getElementById('attack-retry-btn').addEventListener('click', startAttackGame);

// ==========================================
// TETRIS GAME LOGIC
// ==========================================
const TETRIS_COLS = 10;
const TETRIS_ROWS = 20;

const TETRIS_COLORS = [
  '#06b6d4', // I
  '#3b82f6', // J
  '#f97316', // L
  '#eab308', // O
  '#22c55e', // S
  '#a855f7', // T
  '#ef4444'  // Z
];

const SHAPES = [
  [[1, 1, 1, 1]], // I
  [[0, 0, 1], [1, 1, 1]], // J
  [[1, 0, 0], [1, 1, 1]], // L
  [[1, 1], [1, 1]], // O
  [[0, 1, 1], [1, 1, 0]], // S
  [[0, 1, 0], [1, 1, 1]], // T
  [[1, 1, 0], [0, 1, 1]]  // Z
];

let tetrisBoard = [];
let tetrisCurrent = null;
let tetrisNext = null;
let tetrisHold = null;
let tetrisCanHold = true;
let tetrisScore = 0;
let tetrisLines = 0;
let tetrisLevel = 1;
let tetrisTime = 0;
let tetrisTimeTimer = null;
let tetrisDropInterval = 500; // ms
let tetrisSpeedSetting = 1; // 1-10 slider
let tetrisStatus = 'GAMEOVER'; // 'PLAYING' | 'PAUSED' | 'GAMEOVER'
let tetrisMode = 'sprint'; // 'sprint' | 'endless'
let tetrisLoopId = null;
let lastTetrisDropTime = 0;

const tetrisGridEl = document.getElementById('tetris-grid');
const tetrisHoldEl = document.getElementById('tetris-hold-grid');
const tetrisNextEl = document.getElementById('tetris-next-grid');
const tetrisScoreEl = document.getElementById('tetris-score');
const tetrisLevelEl = document.getElementById('tetris-level');
const tetrisLinesEl = document.getElementById('tetris-lines');
const tetrisTimeEl = document.getElementById('tetris-time');
const tetrisSpeedSlider = document.getElementById('tetris-speed-slider');
const tetrisSpeedVal = document.getElementById('tetris-speed-val');

tetrisSpeedSlider.addEventListener('input', () => {
    const val = parseInt(tetrisSpeedSlider.value, 10);
    tetrisSpeedVal.textContent = val;
    tetrisSpeedSetting = val;
    calculateTetrisDropInterval();
});

function calculateTetrisDropInterval() {
    const speedBase = 500 - (tetrisSpeedSetting - 1) * 40;
    const levelPenalty = (tetrisLevel - 1) * 30;
    tetrisDropInterval = Math.max(80, speedBase - levelPenalty);
}

function createEmptyBoard() {
    return Array.from({ length: TETRIS_ROWS }, () => Array(TETRIS_COLS).fill(0));
}

function getSpawnX(shape) {
    return Math.floor(TETRIS_COLS / 2) - Math.ceil(shape[0].length / 2);
}

function createTetromino(index) {
    const shape = SHAPES[index].map(row => [...row]);
    return {
        shape,
        colorIndex: index,
        x: getSpawnX(shape),
        y: 0
    };
}

function getRandomTetromino() {
    return createTetromino(Math.floor(Math.random() * SHAPES.length));
}

function rotateShape(shape) {
    return shape[0].map((_, index) => shape.map(row => row[index]).reverse());
}

function isValidPosition(board, piece) {
    for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
            if (!piece.shape[y][x]) continue;
            const boardX = piece.x + x;
            const boardY = piece.y + y;
            if (boardX < 0 || boardX >= TETRIS_COLS || boardY >= TETRIS_ROWS) return false;
            if (boardY >= 0 && board[boardY][boardX] !== 0) return false;
        }
    }
    return true;
}

function placeTetromino(board, piece) {
    for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
            if (!piece.shape[y][x]) continue;
            const boardY = piece.y + y;
            if (boardY >= 0) {
                board[boardY][piece.x + x] = piece.colorIndex + 1;
            }
        }
    }
}

function clearTetrisLines() {
    const remaining = tetrisBoard.filter(row => row.some(cell => cell === 0));
    const cleared = TETRIS_ROWS - remaining.length;
    
    if (cleared > 0) {
        const emptyRows = Array.from({ length: cleared }, () => Array(TETRIS_COLS).fill(0));
        tetrisBoard = [...emptyRows, ...remaining];
        
        tetrisLines += cleared;
        tetrisScore += cleared * 100 * tetrisLevel;
        
        // Level up every 10 lines
        const newLevel = Math.floor(tetrisLines / 10) + 1;
        if (newLevel !== tetrisLevel) {
            tetrisLevel = newLevel;
            calculateTetrisDropInterval();
        }
        
        playSound('clear');

        if (tetrisMode === 'sprint' && tetrisLines >= 50) {
            triggerTetrisGameWin();
        }
    }
}

function getGhostPiece() {
    const ghost = { ...tetrisCurrent };
    while (isValidPosition(tetrisBoard, { ...ghost, y: ghost.y + 1 })) {
        ghost.y++;
    }
    return ghost;
}

function tryMove(dx, dy) {
    const moved = { ...tetrisCurrent, x: tetrisCurrent.x + dx, y: tetrisCurrent.y + dy };
    if (isValidPosition(tetrisBoard, moved)) {
        tetrisCurrent = moved;
        renderTetris();
        return true;
    }
    return false;
}

function rotateCurrent() {
    const rotatedShape = rotateShape(tetrisCurrent.shape);
    const kickOffsets = [0, -1, 1, -2, 2];

    for (const offset of kickOffsets) {
        const rotated = {
            ...tetrisCurrent,
            shape: rotatedShape,
            x: tetrisCurrent.x + offset
        };
        if (isValidPosition(tetrisBoard, rotated)) {
            tetrisCurrent = rotated;
            playSound('flip');
            renderTetris();
            return;
        }
    }
}

function hardDrop() {
    const ghost = getGhostPiece();
    tetrisCurrent = ghost;
    lockPiece();
}

function holdPiece() {
    if (!tetrisCanHold) return;
    
    let temp = tetrisHold;
    tetrisHold = createTetromino(tetrisCurrent.colorIndex);
    
    if (!temp) {
        tetrisCurrent = tetrisNext;
        tetrisNext = getRandomTetromino();
    } else {
        tetrisCurrent = createTetromino(temp.colorIndex);
    }
    
    tetrisCanHold = false;
    playSound('swap');
    renderTetris();
}

function lockPiece() {
    placeTetromino(tetrisBoard, tetrisCurrent);
    playSound('lock');
    clearTetrisLines();
    
    if (tetrisStatus === 'GAMEOVER') return;
    
    const nextSpawn = createTetromino(tetrisNext.colorIndex);
    tetrisNext = getRandomTetromino();
    tetrisCanHold = true;
    
    if (!isValidPosition(tetrisBoard, nextSpawn)) {
        triggerTetrisGameOver();
        return;
    }
    
    tetrisCurrent = nextSpawn;
    renderTetris();
}

function updateTetrisGame(timestamp) {
    if (tetrisStatus !== 'PLAYING') return;

    if (!lastTetrisDropTime) lastTetrisDropTime = timestamp;
    const elapsed = timestamp - lastTetrisDropTime;

    if (elapsed >= tetrisDropInterval) {
        lastTetrisDropTime = timestamp;
        if (!tryMove(0, 1)) {
            lockPiece();
        }
    }

    tetrisLoopId = requestAnimationFrame(updateTetrisGame);
}

function renderPreview(piece, containerEl) {
    containerEl.innerHTML = '';
    
    const size = 4;
    const grid = Array.from({ length: size }, () => Array(size).fill(0));
    
    if (piece) {
        const offsetX = Math.floor((size - piece.shape[0].length) / 2);
        const offsetY = Math.floor((size - piece.shape.length) / 2);
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    grid[offsetY + y][offsetX + x] = piece.colorIndex + 1;
                }
            }
        }
    }

    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            const cellVal = grid[r][c];
            const cell = document.createElement('div');
            cell.className = 'preview-cell';
            
            if (cellVal) {
                const block = document.createElement('div');
                block.className = 'preview-block';
                block.style.backgroundColor = TETRIS_COLORS[cellVal - 1];
                cell.appendChild(block);
            }
            containerEl.appendChild(cell);
        }
    }
}

function renderTetris() {
    tetrisGridEl.innerHTML = '';
    
    const ghost = getGhostPiece();
    const activeCells = new Set();
    for (let y = 0; y < tetrisCurrent.shape.length; y++) {
        for (let x = 0; x < tetrisCurrent.shape[y].length; x++) {
            if (tetrisCurrent.shape[y][x]) {
                activeCells.add(`${tetrisCurrent.x + x},${tetrisCurrent.y + y}`);
            }
        }
    }

    const ghostCells = new Set();
    for (let y = 0; y < ghost.shape.length; y++) {
        for (let x = 0; x < ghost.shape[y].length; x++) {
            if (ghost.shape[y][x]) {
                ghostCells.add(`${ghost.x + x},${ghost.y + y}`);
            }
        }
    }

    for (let r = 0; r < TETRIS_ROWS; r++) {
        for (let c = 0; c < TETRIS_COLS; c++) {
            const cellVal = tetrisBoard[r][c];
            const key = `${c},${r}`;
            
            const cell = document.createElement('div');
            cell.className = 'flex items-center justify-center';
            cell.style.width = '30px';
            cell.style.height = '30px';

            let color = null;
            let isGhost = false;

            if (activeCells.has(key)) {
                color = TETRIS_COLORS[tetrisCurrent.colorIndex];
            } else if (ghostCells.has(key)) {
                color = TETRIS_COLORS[tetrisCurrent.colorIndex];
                isGhost = true;
            } else if (cellVal) {
                color = TETRIS_COLORS[cellVal - 1];
            }

            if (color) {
                const block = document.createElement('div');
                block.className = 'block';
                block.style.backgroundColor = color;
                block.style.width = '28px';
                block.style.height = '28px';
                
                if (isGhost) {
                    block.style.opacity = '0.35';
                    block.style.border = '1px dashed ' + color;
                }
                cell.appendChild(block);
            } else {
                cell.style.border = '1px solid rgba(255, 255, 255, 0.02)';
            }
            
            tetrisGridEl.appendChild(cell);
        }
    }

    // Stats
    tetrisScoreEl.textContent = tetrisScore;
    tetrisLevelEl.textContent = tetrisLevel;
    tetrisLinesEl.textContent = tetrisLines;
    
    // Hold / Next previews
    renderPreview(tetrisHold, tetrisHoldEl);
    renderPreview(tetrisNext, tetrisNextEl);
}

function triggerTetrisGameOver() {
    tetrisStatus = 'GAMEOVER';
    stopChiptune();
    playSound('gameover');
    
    const headerEl = document.getElementById('tetris-gameover-overlay').querySelector('h2');
    if (headerEl) headerEl.textContent = "GAME OVER";
    
    const scoreEl = document.getElementById('tetris-final-score');
    if (scoreEl) scoreEl.textContent = tetrisScore;
    
    document.getElementById('tetris-gameover-overlay').classList.add('open');
    if (tetrisTimeTimer) clearInterval(tetrisTimeTimer);
}

function triggerTetrisGameWin() {
    tetrisStatus = 'GAMEOVER';
    stopChiptune();
    playSound('gameover');
    
    const headerEl = document.getElementById('tetris-gameover-overlay').querySelector('h2');
    if (headerEl) headerEl.textContent = "SPRINT COMPLETED!";
    
    const scoreEl = document.getElementById('tetris-final-score');
    if (scoreEl) {
        const mins = Math.floor(tetrisTime / 60);
        const secs = tetrisTime % 60;
        scoreEl.innerHTML = `Time: <strong>${mins}:${secs.toString().padStart(2, '0')}</strong><br>Score: ${tetrisScore}`;
    }
    
    document.getElementById('tetris-gameover-overlay').classList.add('open');
    if (tetrisTimeTimer) clearInterval(tetrisTimeTimer);
}

function startTetrisGame() {
    // Hide overlay
    document.getElementById('tetris-gameover-overlay').classList.remove('open');
    document.getElementById('tetris-pause-overlay').classList.remove('open');

    // Read selected game mode
    const modeSelect = document.getElementById('tetris-mode-select');
    tetrisMode = modeSelect ? modeSelect.value : 'endless';

    // Init state
    tetrisBoard = createEmptyBoard();
    tetrisCurrent = getRandomTetromino();
    tetrisNext = getRandomTetromino();
    tetrisHold = null;
    tetrisCanHold = true;
    tetrisScore = 0;
    tetrisLines = 0;
    tetrisLevel = 1;
    tetrisTime = 0;
    tetrisSpeedSetting = parseInt(tetrisSpeedSlider.value, 10) || 1;
    calculateTetrisDropInterval();
    
    tetrisStatus = 'PLAYING';
    playChiptuneTrack('TETRIS');
    
    // Start timing clock
    if (tetrisTimeTimer) clearInterval(tetrisTimeTimer);
    tetrisTimeTimer = setInterval(() => {
        if (tetrisStatus === 'PLAYING') {
            tetrisTime++;
            const mins = Math.floor(tetrisTime / 60);
            const secs = tetrisTime % 60;
            tetrisTimeEl.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
        }
    }, 1000);

    lastTetrisDropTime = 0;
    renderTetris();
    
    if (tetrisLoopId) cancelAnimationFrame(tetrisLoopId);
    tetrisLoopId = requestAnimationFrame(updateTetrisGame);
}

function stopTetrisGame() {
    tetrisStatus = 'GAMEOVER';
    if (tetrisTimeTimer) clearInterval(tetrisTimeTimer);
    if (tetrisLoopId) cancelAnimationFrame(tetrisLoopId);
}

function pauseTetrisGame() {
    if (tetrisStatus === 'PLAYING') {
        tetrisStatus = 'PAUSED';
        stopChiptune();
        document.getElementById('tetris-pause-overlay').classList.add('open');
    } else if (tetrisStatus === 'PAUSED') {
        tetrisStatus = 'PLAYING';
        playChiptuneTrack('TETRIS');
        document.getElementById('tetris-pause-overlay').classList.remove('open');
        lastTetrisDropTime = 0;
        tetrisLoopId = requestAnimationFrame(updateTetrisGame);
    }
}

document.getElementById('tetris-pause-btn').addEventListener('click', pauseTetrisGame);
document.getElementById('tetris-reset-btn').addEventListener('click', startTetrisGame);
document.getElementById('tetris-retry-btn').addEventListener('click', startTetrisGame);

// ==========================================
// INPUT CONTROLS & BINDINGS (KEYBOARD & TOUCH)
// ==========================================

function handleActionUp() {
    if (currentMode === 'TETRIS' && tetrisStatus === 'PLAYING') {
        rotateCurrent();
    } else if (currentMode === 'BLOCK_ATTACK' && attackStatus === 'PLAYING') {
        if (attackCursor.y > 0) {
            attackCursor.y--;
            playSound('move');
            renderAttackGrid();
        }
    }
}

function handleActionDown() {
    if (currentMode === 'TETRIS' && tetrisStatus === 'PLAYING') {
        if (tryMove(0, 1)) {
            playSound('move');
        } else {
            lockPiece();
        }
    } else if (currentMode === 'BLOCK_ATTACK' && attackStatus === 'PLAYING') {
        if (attackCursor.y < ROWS - 1) {
            attackCursor.y++;
            playSound('move');
            renderAttackGrid();
        }
    }
}

function handleActionLeft() {
    if (currentMode === 'TETRIS' && tetrisStatus === 'PLAYING') {
        if (tryMove(-1, 0)) playSound('move');
    } else if (currentMode === 'BLOCK_ATTACK' && attackStatus === 'PLAYING') {
        if (attackCursor.x > 0) {
            attackCursor.x--;
            playSound('move');
            renderAttackGrid();
        }
    }
}

function handleActionRight() {
    if (currentMode === 'TETRIS' && tetrisStatus === 'PLAYING') {
        if (tryMove(1, 0)) playSound('move');
    } else if (currentMode === 'BLOCK_ATTACK' && attackStatus === 'PLAYING') {
        if (attackCursor.x < COLS - 2) {
            attackCursor.x++;
            playSound('move');
            renderAttackGrid();
        }
    }
}

function handleActionZ() {
    if (currentMode === 'TETRIS' && tetrisStatus === 'PLAYING') {
        holdPiece();
    } else if (currentMode === 'BLOCK_ATTACK' && attackStatus === 'PLAYING') {
        performSwap();
    }
}

function handleActionX(isDown) {
    if (currentMode === 'TETRIS' && tetrisStatus === 'PLAYING') {
        if (isDown) hardDrop();
    } else if (currentMode === 'BLOCK_ATTACK' && attackStatus === 'PLAYING') {
        isPushingStack = isDown;
    }
}

// Global Keyboard Handler
document.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'x', 'X', 'z', 'Z', 'p', 'P'].includes(e.key)) {
        e.preventDefault(); // prevent scroll
    }

    if (e.key === 'Escape' || e.key.toLowerCase() === 'p') {
        if (currentMode === 'BLOCK_ATTACK') pauseAttackGame();
        if (currentMode === 'TETRIS') pauseTetrisGame();
        return;
    }

    if (currentMode === 'BLOCK_ATTACK') {
        if (attackStatus === 'GAMEOVER') {
            if ([' ', 'z', 'Z', 'x', 'X', 'Enter'].includes(e.key)) startAttackGame();
            return;
        }
        if (attackStatus !== 'PLAYING') return;

        switch (e.key) {
            case 'ArrowUp': handleActionUp(); break;
            case 'ArrowDown': handleActionDown(); break;
            case 'ArrowLeft': handleActionLeft(); break;
            case 'ArrowRight': handleActionRight(); break;
            case ' ':
            case 'z':
            case 'Z':
                handleActionZ();
                break;
            case 'x':
            case 'X':
                handleActionX(true);
                break;
        }
    } else if (currentMode === 'TETRIS') {
        if (tetrisStatus === 'GAMEOVER') {
            if ([' ', 'z', 'Z', 'x', 'X', 'Enter'].includes(e.key)) startTetrisGame();
            return;
        }
        if (tetrisStatus !== 'PLAYING') return;

        switch (e.key) {
            case 'ArrowUp': handleActionUp(); break;
            case 'ArrowDown': handleActionDown(); break;
            case 'ArrowLeft': handleActionLeft(); break;
            case 'ArrowRight': handleActionRight(); break;
            case ' ':
            case 'x':
            case 'X':
                handleActionX(true);
                break;
            case 'z':
            case 'Z':
                handleActionZ();
                break;
        }
    }
});

document.addEventListener('keyup', (e) => {
    if (currentMode === 'BLOCK_ATTACK' && e.key.toLowerCase() === 'x') {
        handleActionX(false);
    }
});

// Mobile virtual gamepad bindings
const mobileUp = document.getElementById('m-btn-up');
const mobileDown = document.getElementById('m-btn-down');
const mobileLeft = document.getElementById('m-btn-left');
const mobileRight = document.getElementById('m-btn-right');
const mobileZ = document.getElementById('m-btn-z');
const mobileX = document.getElementById('m-btn-x');

mobileUp.addEventListener('click', handleActionUp);
mobileDown.addEventListener('click', handleActionDown);
mobileLeft.addEventListener('click', handleActionLeft);
mobileRight.addEventListener('click', handleActionRight);
mobileZ.addEventListener('click', handleActionZ);

// X button acts as a trigger key (need touchstart/touchend for smooth drag push in block attack)
mobileX.addEventListener('touchstart', (e) => { e.preventDefault(); handleActionX(true); });
mobileX.addEventListener('mousedown', (e) => { e.preventDefault(); handleActionX(true); });
mobileX.addEventListener('touchend', (e) => { e.preventDefault(); handleActionX(false); });
mobileX.addEventListener('mouseup', (e) => { e.preventDefault(); handleActionX(false); });

// Launch
switchView('MENU');

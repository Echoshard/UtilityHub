// ==========================================
// COOKIE PERSISTENCE & CUSTOM CONTROLS SYSTEM
// ==========================================
function setCookie(name, value, days) {
    const d = new Date();
    d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + d.toUTCString();
    document.cookie = name + "=" + encodeURIComponent(value) + ";" + expires + ";path=/;SameSite=Strict";
}

function getCookie(name) {
    const cname = name + "=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for(let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(cname) == 0) {
            return c.substring(cname.length, c.length);
        }
    }
    return "";
}

// Control settings state
let controlScheme = 'classic'; // 'classic' | 'custom'
let customKeys = {
    'left': 'ArrowLeft',
    'right': 'ArrowRight',
    'hard': ' ',
    'soft': 'ArrowDown',
    'rot-cw': 'ArrowUp',
    'rot-ccw': 'z',
    'hold': 'c'
};

// Load settings from cookie
function loadControlSettings() {
    const savedScheme = getCookie('arcade_control_scheme');
    if (savedScheme) {
        controlScheme = savedScheme;
    }
    
    const savedKeys = getCookie('arcade_custom_keys');
    if (savedKeys) {
        try {
            customKeys = JSON.parse(savedKeys);
        } catch (e) {
            console.error("Failed to parse custom keys cookie", e);
        }
    }
    updateGameInstructions();
}
loadControlSettings();

function updateGameInstructions() {
    const attackInst = document.getElementById('attack-instructions');
    const tetrisInst = document.getElementById('tetris-instructions');
    const puyoInst = document.getElementById('puyo-instructions');
    
    if (controlScheme === 'classic') {
        if (attackInst) {
            attackInst.innerHTML = `
                <p><strong>ARROWS</strong> to Move</p>
                <p><strong>Z / SPACE</strong> to Swap</p>
                <p><strong>X</strong> to Push Stack</p>
            `;
        }
        if (tetrisInst) {
            tetrisInst.innerHTML = `
                <p><strong>LEFT/RIGHT</strong> to Move</p>
                <p><strong>UP ARROW</strong> to Rotate CW</p>
                <p><strong>DOWN ARROW</strong> to Soft Drop</p>
                <p><strong>Z</strong> to Hold</p>
                <p><strong>X / SPACE</strong> to Hard Drop</p>
            `;
        }
        if (puyoInst) {
            puyoInst.innerHTML = `
                <p><strong>LEFT/RIGHT</strong> to Move</p>
                <p><strong>UP ARROW</strong> to Rotate CW</p>
                <p><strong>DOWN ARROW</strong> to Soft Drop</p>
                <p><strong>Z</strong> to Rotate CCW</p>
                <p><strong>X / SPACE</strong> to Hard Drop</p>
            `;
        }
    } else {
        const kLeft = formatKeyName(customKeys['left']).toUpperCase();
        const kRight = formatKeyName(customKeys['right']).toUpperCase();
        const kSoft = formatKeyName(customKeys['soft']).toUpperCase();
        const kRotCW = formatKeyName(customKeys['rot-cw']).toUpperCase();
        const kRotCCW = formatKeyName(customKeys['rot-ccw']).toUpperCase();
        const kHard = formatKeyName(customKeys['hard']).toUpperCase();
        const kHold = formatKeyName(customKeys['hold']).toUpperCase();

        if (attackInst) {
            attackInst.innerHTML = `
                <p><strong>${kLeft}/${kRight}</strong> to Move Left/Right</p>
                <p><strong>${kRotCW}/${kSoft}</strong> to Move Up/Down</p>
                <p><strong>${kHold}</strong> to Swap</p>
                <p><strong>${kHard}</strong> to Push Stack</p>
            `;
        }
        if (tetrisInst) {
            tetrisInst.innerHTML = `
                <p><strong>${kLeft}/${kRight}</strong> to Move</p>
                <p><strong>${kRotCW}</strong> to Rotate CW</p>
                <p><strong>${kRotCCW}</strong> to Rotate CCW</p>
                <p><strong>${kSoft}</strong> to Soft Drop</p>
                <p><strong>${kHold}</strong> to Hold</p>
                <p><strong>${kHard}</strong> to Hard Drop</p>
            `;
        }
        if (puyoInst) {
            puyoInst.innerHTML = `
                <p><strong>${kLeft}/${kRight}</strong> to Move</p>
                <p><strong>${kRotCW}</strong> to Rotate CW</p>
                <p><strong>${kRotCCW}</strong> to Rotate CCW</p>
                <p><strong>${kSoft}</strong> to Soft Drop</p>
                <p><strong>${kHard}</strong> to Hard Drop</p>
            `;
        }
    }
}

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

// Puyo Puyo Upbeat Theme
const PUYO_MELODY = [
    'A4', 'C5', 'E5', 'A5', 'G5', 'E5', 'C5', 'D5', 'F5', 'A5', 'D6', 'C6', 'A5', 'F5', 'G5', 'rest'
];
const PUYO_DURS = [
    2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 4, 4
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
    
    const melody = (trackName === 'TETRIS') ? TETRIS_MELODY : ((trackName === 'PUYO_PUYO') ? PUYO_MELODY : ATTACK_MELODY);
    const durs = (trackName === 'TETRIS') ? TETRIS_DURS : ((trackName === 'PUYO_PUYO') ? PUYO_DURS : ATTACK_DURS);
    
    let index = 0;
    
    function playNextNote() {
        if (chiptuneMuted || currentMode !== trackName) return;
        if (currentMode === 'TETRIS' && tetrisStatus !== 'PLAYING') return;
        if (currentMode === 'BLOCK_ATTACK' && attackStatus !== 'PLAYING') return;
        if (currentMode === 'PUYO_PUYO' && puyoStatus !== 'PLAYING') return;
        
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
let currentMode = 'MENU'; // 'MENU' | 'BLOCK_ATTACK' | 'TETRIS' | 'PUYO_PUYO' | 'FRAMEFALL'

const viewMenu = document.getElementById('menu-view');
const viewAttack = document.getElementById('attack-view');
const viewTetris = document.getElementById('tetris-view');
const viewPuyo = document.getElementById('puyo-view');
const viewFramefall = document.getElementById('framefall-view');
const mobileControls = document.getElementById('mobile-controls');
const headerGamesBtn = document.getElementById('header-games-btn');

// ==========================================
// DYNAMIC LAYOUT RESIZING
// ==========================================
function resizeGameLayouts() {
    const screens = document.querySelectorAll('.arcade-screen');
    screens.forEach(screen => {
        const layouts = screen.querySelectorAll('.view.active .game-layout');
        if (layouts.length === 0) return;
        
        const screenWidth = screen.clientWidth;
        const screenHeight = screen.clientHeight;
        
        let designWidth = 790;
        let designHeight = 620;
        
        if (currentMode === 'BLOCK_ATTACK') {
            designWidth = 780;
            designHeight = 590;
        } else if (currentMode === 'TETRIS') {
            designWidth = 790;
            designHeight = 620;
        } else if (currentMode === 'PUYO_PUYO') {
            designWidth = 785;
            designHeight = 530;
        } else if (currentMode === 'FRAMEFALL') {
            designWidth = 870;
            designHeight = 610;
        } else {
            layouts.forEach(layout => {
                layout.style.transform = '';
            });
            return;
        }

        const isMobile = window.innerWidth <= 768;
        let availHeight = screenHeight;
        if (isMobile) {
            designWidth = currentMode === 'TETRIS' ? 320 : (currentMode === 'PUYO_PUYO' ? 260 : (currentMode === 'FRAMEFALL' ? 400 : 308));
            designHeight = currentMode === 'TETRIS' ? 690 : (currentMode === 'PUYO_PUYO' ? 590 : (currentMode === 'FRAMEFALL' ? 690 : 660));
            availHeight = Math.max(200, screenHeight - 180);
        }
        
        let scale = Math.min(screenWidth / designWidth, availHeight / designHeight);
        if (scale > 1.0) {
            scale = 1.0;
        }
        
        layouts.forEach(layout => {
            layout.style.transform = `scale(${scale})`;
            layout.style.transformOrigin = 'center center';
        });
    });
}

function switchView(mode) {
    currentMode = mode;
    
    // Stop any active loops & music
    stopAttackGame();
    stopTetrisGame();
    stopPuyoGame();
    stopFramefallGame();
    stopChiptune();

    viewMenu.classList.remove('active');
    viewAttack.classList.remove('active');
    viewTetris.classList.remove('active');
    viewPuyo.classList.remove('active');
    viewFramefall.classList.remove('active');
    mobileControls.style.display = 'none';
    
    // Hide/show games back button in header
    if (headerGamesBtn) {
        if (mode === 'MENU') {
            headerGamesBtn.style.display = 'none';
        } else {
            headerGamesBtn.style.display = 'inline-flex';
        }
    }

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
    } else if (mode === 'PUYO_PUYO') {
        viewPuyo.classList.add('active');
        if (window.innerWidth <= 768) mobileControls.style.display = 'flex';
        startPuyoGame();
        playChiptuneTrack('PUYO_PUYO');
    } else if (mode === 'FRAMEFALL') {
        viewFramefall.classList.add('active');
        if (window.innerWidth <= 768) mobileControls.style.display = 'flex';
        startFramefallGame();
        playChiptuneTrack('BLOCK_ATTACK');
    }
    
    setTimeout(resizeGameLayouts, 0);
}

document.getElementById('btn-mode-attack').addEventListener('click', () => switchView('BLOCK_ATTACK'));
document.getElementById('btn-mode-tetris').addEventListener('click', () => switchView('TETRIS'));
const btnModePuyo = document.getElementById('btn-mode-puyo');
if (btnModePuyo) btnModePuyo.addEventListener('click', () => switchView('PUYO_PUYO'));
document.getElementById('btn-mode-framefall').addEventListener('click', () => switchView('FRAMEFALL'));

document.getElementById('attack-home-btn').addEventListener('click', () => switchView('MENU'));
document.getElementById('tetris-home-btn').addEventListener('click', () => switchView('MENU'));
document.getElementById('framefall-home-btn').addEventListener('click', () => switchView('MENU'));
if (headerGamesBtn) {
    headerGamesBtn.addEventListener('click', () => switchView('MENU'));
}

// Handle window resize to toggle mobile controls display and scale games
window.addEventListener('resize', () => {
    if (currentMode !== 'MENU' && window.innerWidth <= 768) {
        mobileControls.style.display = 'flex';
    } else {
        mobileControls.style.display = 'none';
    }
    resizeGameLayouts();
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
    const attackScoreMobileEl = document.getElementById('attack-score-mobile');
    if (attackScoreMobileEl) attackScoreMobileEl.textContent = attackScore;

    attackLevelEl.textContent = attackLevel;
    const attackLevelMobileEl = document.getElementById('attack-level-mobile');
    if (attackLevelMobileEl) attackLevelMobileEl.textContent = attackLevel;
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

    // Reset initial timer text displays
    attackTimeEl.textContent = "0:00";
    const attackTimeMobileInitial = document.getElementById('attack-time-mobile');
    if (attackTimeMobileInitial) attackTimeMobileInitial.textContent = "0:00";

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
            const formatted = `${mins}:${secs.toString().padStart(2, '0')}`;
            attackTimeEl.textContent = formatted;
            const attackTimeMobileEl = document.getElementById('attack-time-mobile');
            if (attackTimeMobileEl) attackTimeMobileEl.textContent = formatted;
            
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

function rotateCurrentCounterClockwise() {
    const rotatedShape = rotateShape(rotateShape(rotateShape(tetrisCurrent.shape)));
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
    const tetrisScoreMobileEl = document.getElementById('tetris-score-mobile');
    if (tetrisScoreMobileEl) tetrisScoreMobileEl.textContent = tetrisScore;

    tetrisLevelEl.textContent = tetrisLevel;
    const tetrisLevelMobileEl = document.getElementById('tetris-level-mobile');
    if (tetrisLevelMobileEl) tetrisLevelMobileEl.textContent = tetrisLevel;

    tetrisLinesEl.textContent = tetrisLines;
    const tetrisLinesMobileEl = document.getElementById('tetris-lines-mobile');
    if (tetrisLinesMobileEl) tetrisLinesMobileEl.textContent = tetrisLines;
    
    // Hold / Next previews
    renderPreview(tetrisHold, tetrisHoldEl);
    renderPreview(tetrisNext, tetrisNextEl);

    const tetrisHoldMobileEl = document.getElementById('tetris-hold-grid-mobile');
    if (tetrisHoldMobileEl) renderPreview(tetrisHold, tetrisHoldMobileEl);
    const tetrisNextMobileEl = document.getElementById('tetris-next-grid-mobile');
    if (tetrisNextMobileEl) renderPreview(tetrisNext, tetrisNextMobileEl);
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
    
    // Reset initial timer text displays
    tetrisTimeEl.textContent = "0:00";
    const tetrisTimeMobileInitial = document.getElementById('tetris-time-mobile');
    if (tetrisTimeMobileInitial) tetrisTimeMobileInitial.textContent = "0:00";

    tetrisStatus = 'PLAYING';
    playChiptuneTrack('TETRIS');
    
    // Start timing clock
    if (tetrisTimeTimer) clearInterval(tetrisTimeTimer);
    tetrisTimeTimer = setInterval(() => {
        if (tetrisStatus === 'PLAYING') {
            tetrisTime++;
            const mins = Math.floor(tetrisTime / 60);
            const secs = tetrisTime % 60;
            const formatted = `${mins}:${secs.toString().padStart(2, '0')}`;
            tetrisTimeEl.textContent = formatted;
            const tetrisTimeMobileEl = document.getElementById('tetris-time-mobile');
            if (tetrisTimeMobileEl) tetrisTimeMobileEl.textContent = formatted;
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
// PUYO PUYO GAME LOGIC
// ==========================================
const PUYO_COLS = 6;
const PUYO_ROWS = 12;

const PUYO_COLORS = [
    '#ef4444', // Red
    '#22c55e', // Green
    '#eab308', // Yellow
    '#a855f7', // Purple
    '#3b82f6'  // Blue
];

let puyoBoard = [];
let puyoCurrent = null;
let puyoNext = null;
let puyoScore = 0;
let puyoChain = 0;
let puyoLevel = 1;
let puyoTime = 0;
let puyoTimeTimer = null;
let puyoDropInterval = 800; // ms
let puyoSpeedSetting = 1; // 1-10
let puyoStatus = 'GAMEOVER'; // 'PLAYING' | 'PAUSED' | 'GAMEOVER'
let puyoState = 'PLAYING'; // 'PLAYING' | 'RESOLVING'
let puyoLoopId = null;
let lastPuyoDropTime = 0;

const puyoGridEl = document.getElementById('puyo-grid');
const puyoNextEl = document.getElementById('puyo-next-grid');
const puyoNextMobileEl = document.getElementById('puyo-next-grid-mobile');
const puyoScoreEl = document.getElementById('puyo-score');
const puyoScoreMobileEl = document.getElementById('puyo-score-mobile');
const puyoChainEl = document.getElementById('puyo-chain');
const puyoChainMobileEl = document.getElementById('puyo-chain-mobile');
const puyoLevelEl = document.getElementById('puyo-level');
const puyoLevelMobileEl = document.getElementById('puyo-level-mobile');
const puyoTimeEl = document.getElementById('puyo-time');
const puyoTimeMobileEl = document.getElementById('puyo-time-mobile');
const puyoSpeedSlider = document.getElementById('puyo-speed-slider');
const puyoSpeedVal = document.getElementById('puyo-speed-val');

if (puyoSpeedSlider) {
    puyoSpeedSlider.addEventListener('input', () => {
        const val = parseInt(puyoSpeedSlider.value, 10);
        if (puyoSpeedVal) puyoSpeedVal.textContent = val;
        puyoSpeedSetting = val;
        calculatePuyoDropInterval();
    });
}

function calculatePuyoDropInterval() {
    const speedBase = 800 - (puyoSpeedSetting - 1) * 70;
    const levelPenalty = (puyoLevel - 1) * 50;
    puyoDropInterval = Math.max(100, speedBase - levelPenalty);
}

function createPuyoBoard() {
    return Array.from({ length: PUYO_ROWS }, () => Array(PUYO_COLS).fill(0));
}

function isValidPuyoPosition(x, y) {
    return x >= 0 && x < PUYO_COLS && y >= 0 && y < PUYO_ROWS && puyoBoard[y][x] === 0;
}

const PUYO_ORBIT_OFFSETS = [
    { x: 0, y: -1 }, // 0: Up
    { x: 1, y: 0 },  // 1: Right
    { x: 0, y: 1 },  // 2: Down
    { x: -1, y: 0 }  // 3: Left
];

function isValidPairPosition(x, y, rotation) {
    // Pivot check
    if (x < 0 || x >= PUYO_COLS || y >= PUYO_ROWS) return false;
    if (y >= 0 && puyoBoard[y][x] !== 0) return false;
    
    // Orbit check
    const offset = PUYO_ORBIT_OFFSETS[rotation];
    const ox = x + offset.x;
    const oy = y + offset.y;
    if (ox < 0 || ox >= PUYO_COLS || oy >= PUYO_ROWS) return false;
    if (oy >= 0 && puyoBoard[oy][ox] !== 0) return false;
    
    return true;
}

function rotatePuyo(dir) {
    if (puyoStatus !== 'PLAYING' || puyoState !== 'PLAYING') return;
    const nextRot = (puyoCurrent.rotation + dir + 4) % 4;
    
    // Test rotation with wall kick
    const kicks = [0, -1, 1]; // center, kick left, kick right
    for (const kick of kicks) {
        if (isValidPairPosition(puyoCurrent.x + kick, puyoCurrent.y, nextRot)) {
            puyoCurrent.x += kick;
            puyoCurrent.rotation = nextRot;
            playSound('flip');
            renderPuyo();
            return;
        }
    }
}

function movePuyo(dx, dy) {
    if (puyoStatus !== 'PLAYING' || puyoState !== 'PLAYING') return false;
    if (isValidPairPosition(puyoCurrent.x + dx, puyoCurrent.y + dy, puyoCurrent.rotation)) {
        puyoCurrent.x += dx;
        puyoCurrent.y += dy;
        if (dx !== 0 || dy !== 0) playSound('move');
        renderPuyo();
        return true;
    }
    return false;
}

function hardDropPuyo() {
    if (puyoStatus !== 'PLAYING' || puyoState !== 'PLAYING') return;
    while (movePuyo(0, 1)) {
        // Drop until we hit something
    }
    lockPuyo();
}

function lockPuyo() {
    puyoState = 'RESOLVING';
    
    const x1 = puyoCurrent.x;
    const y1 = puyoCurrent.y;
    const offset = PUYO_ORBIT_OFFSETS[puyoCurrent.rotation];
    const x2 = puyoCurrent.x + offset.x;
    const y2 = puyoCurrent.y + offset.y;
    
    if (y1 >= 0 && y1 < PUYO_ROWS && x1 >= 0 && x1 < PUYO_COLS) {
        puyoBoard[y1][x1] = puyoCurrent.color1;
    }
    if (y2 >= 0 && y2 < PUYO_ROWS && x2 >= 0 && x2 < PUYO_COLS) {
        puyoBoard[y2][x2] = puyoCurrent.color2;
    }
    
    playSound('lock');
    puyoCurrent = null;
    
    resolvePuyoChains();
}

let puyoChainCount = 0;

function resolvePuyoChains() {
    // 1. Gravity settle ( Puyos drop individually )
    let dropped = false;
    do {
        dropped = false;
        for (let r = PUYO_ROWS - 2; r >= 0; r--) {
            for (let c = 0; c < PUYO_COLS; c++) {
                if (puyoBoard[r][c] !== 0 && puyoBoard[r + 1][c] === 0) {
                    puyoBoard[r + 1][c] = puyoBoard[r][c];
                    puyoBoard[r][c] = 0;
                    dropped = true;
                }
            }
        }
    } while (dropped);

    renderPuyo();

    // 2. Find matches (groups of 4+)
    const matches = findPuyoMatches();
    if (matches.length > 0) {
        puyoChainCount++;
        puyoChain = puyoChainCount;
        
        // Match calculation score: Cleared * 15 * Chain count * level
        puyoScore += matches.length * 15 * puyoChainCount * puyoLevel;
        updatePuyoHUD();
        playSound('clear');

        // Mark matches for pop animation
        const clearingKeys = new Set(matches.map(m => `${m.x},${m.y}`));
        renderPuyo(clearingKeys);

        // Wait 350ms for pop animation, then delete puyos and settle again
        setTimeout(() => {
            matches.forEach(m => {
                puyoBoard[m.y][m.x] = 0;
            });
            resolvePuyoChains();
        }, 350);
    } else {
        // End of chains
        puyoChainCount = 0;
        puyoChain = 0;
        updatePuyoHUD();
        
        // Check game over (middle column row 0 has a puyo)
        if (puyoBoard[0][2] !== 0 || puyoBoard[0][3] !== 0) {
            triggerPuyoGameOver();
            return;
        }
        
        spawnPuyo();
        puyoState = 'PLAYING';
    }
}

function findPuyoMatches() {
    const visited = Array.from({ length: PUYO_ROWS }, () => Array(PUYO_COLS).fill(false));
    let matchedCells = [];

    for (let r = 0; r < PUYO_ROWS; r++) {
        for (let c = 0; c < PUYO_COLS; c++) {
            if (puyoBoard[r][c] !== 0 && !visited[r][c]) {
                const color = puyoBoard[r][c];
                const group = [];
                const queue = [{ x: c, y: r }];
                visited[r][c] = true;
                
                while (queue.length > 0) {
                    const curr = queue.shift();
                    group.push(curr);
                    
                    const neighbors = [
                        { x: curr.x - 1, y: curr.y },
                        { x: curr.x + 1, y: curr.y },
                        { x: curr.x, y: curr.y - 1 },
                        { x: curr.x, y: curr.y + 1 }
                    ];
                    
                    for (const n of neighbors) {
                        if (n.x >= 0 && n.x < PUYO_COLS && n.y >= 0 && n.y < PUYO_ROWS) {
                            if (puyoBoard[n.y][n.x] === color && !visited[n.y][n.x]) {
                                visited[n.y][n.x] = true;
                                queue.push(n);
                            }
                        }
                    }
                }
                
                if (group.length >= 4) {
                    matchedCells = matchedCells.concat(group);
                }
            }
        }
    }
    return matchedCells;
}

function spawnPuyo() {
    puyoCurrent = {
        x: 2,
        y: 1,
        color1: puyoNext.color1,
        color2: puyoNext.color2,
        rotation: 0
    };
    
    puyoNext = {
        color1: Math.floor(Math.random() * 4) + 1,
        color2: Math.floor(Math.random() * 4) + 1
    };
    
    renderPuyo();
}

function updatePuyoHUD() {
    if (puyoScoreEl) puyoScoreEl.textContent = puyoScore;
    if (puyoScoreMobileEl) puyoScoreMobileEl.textContent = puyoScore;

    if (puyoChainEl) puyoChainEl.textContent = puyoChain;
    if (puyoChainMobileEl) puyoChainMobileEl.textContent = puyoChain;

    if (puyoLevelEl) puyoLevelEl.textContent = puyoLevel;
    if (puyoLevelMobileEl) puyoLevelMobileEl.textContent = puyoLevel;
}

function renderPuyoPreview(color1, color2, containerEl) {
    if (!containerEl) return;
    containerEl.innerHTML = '';
    
    const size = 4;
    const grid = Array.from({ length: size }, () => Array(size).fill(0));
    
    grid[1][1] = color2; // orbit
    grid[2][1] = color1; // pivot
    
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            const cellVal = grid[r][c];
            const cell = document.createElement('div');
            cell.className = 'preview-cell';
            
            if (cellVal) {
                const block = document.createElement('div');
                block.className = 'puyo';
                block.style.backgroundColor = PUYO_COLORS[cellVal - 1];
                block.style.width = '100%';
                block.style.height = '100%';
                
                const pupilL = document.createElement('div');
                pupilL.className = 'puyo-pupil-l';
                const pupilR = document.createElement('div');
                pupilR.className = 'puyo-pupil-r';
                block.appendChild(pupilL);
                block.appendChild(pupilR);
                cell.appendChild(block);
            }
            containerEl.appendChild(cell);
        }
    }
}

function renderPuyo(clearingKeys = new Set()) {
    if (!puyoGridEl) return;
    puyoGridEl.innerHTML = '';

    let px1 = -1, py1 = -1, px2 = -1, py2 = -1;
    if (puyoCurrent) {
        px1 = puyoCurrent.x;
        py1 = puyoCurrent.y;
        const offset = PUYO_ORBIT_OFFSETS[puyoCurrent.rotation];
        px2 = puyoCurrent.x + offset.x;
        py2 = puyoCurrent.y + offset.y;
    }

    for (let r = 0; r < PUYO_ROWS; r++) {
        for (let c = 0; c < PUYO_COLS; c++) {
            const key = `${c},${r}`;
            let colorIndex = 0;
            
            if (c === px1 && r === py1) {
                colorIndex = puyoCurrent.color1;
            } else if (c === px2 && r === py2) {
                colorIndex = puyoCurrent.color2;
            } else if (puyoBoard[r] && puyoBoard[r][c]) {
                colorIndex = puyoBoard[r][c];
            }

            const cell = document.createElement('div');
            cell.className = 'flex items-center justify-center';
            cell.style.width = '40px';
            cell.style.height = '40px';

            if (colorIndex) {
                const block = document.createElement('div');
                block.className = 'puyo';
                block.style.backgroundColor = PUYO_COLORS[colorIndex - 1];
                
                if (clearingKeys.has(key)) {
                    block.classList.add('clearing');
                }
                
                const pupilL = document.createElement('div');
                pupilL.className = 'puyo-pupil-l';
                const pupilR = document.createElement('div');
                pupilR.className = 'puyo-pupil-r';
                block.appendChild(pupilL);
                block.appendChild(pupilR);
                
                cell.appendChild(block);
            } else {
                cell.style.border = '1px solid rgba(255, 255, 255, 0.02)';
            }
            puyoGridEl.appendChild(cell);
        }
    }

    if (puyoNext) {
        renderPuyoPreview(puyoNext.color1, puyoNext.color2, puyoNextEl);
        renderPuyoPreview(puyoNext.color1, puyoNext.color2, puyoNextMobileEl);
    }
}

function updatePuyoGame(timestamp) {
    if (puyoStatus !== 'PLAYING') return;

    if (!lastPuyoDropTime) lastPuyoDropTime = timestamp;
    const elapsed = timestamp - lastPuyoDropTime;

    if (elapsed >= puyoDropInterval) {
        lastPuyoDropTime = timestamp;
        if (puyoState === 'PLAYING') {
            if (!movePuyo(0, 1)) {
                lockPuyo();
            }
        }
    }

    puyoLoopId = requestAnimationFrame(updatePuyoGame);
}

function triggerPuyoGameOver() {
    puyoStatus = 'GAMEOVER';
    stopChiptune();
    playSound('gameover');
    
    const finalScoreEl = document.getElementById('puyo-final-score');
    if (finalScoreEl) finalScoreEl.textContent = puyoScore;
    
    const overlay = document.getElementById('puyo-gameover-overlay');
    if (overlay) overlay.classList.add('open');
    if (puyoTimeTimer) clearInterval(puyoTimeTimer);
}

function startPuyoGame() {
    const gameoverOverlay = document.getElementById('puyo-gameover-overlay');
    if (gameoverOverlay) gameoverOverlay.classList.remove('open');
    const pauseOverlay = document.getElementById('puyo-pause-overlay');
    if (pauseOverlay) pauseOverlay.classList.remove('open');

    puyoBoard = createPuyoBoard();
    puyoNext = {
        color1: Math.floor(Math.random() * 4) + 1,
        color2: Math.floor(Math.random() * 4) + 1
    };
    
    spawnPuyo();
    puyoScore = 0;
    puyoChain = 0;
    puyoLevel = 1;
    puyoTime = 0;
    puyoSpeedSetting = parseInt(puyoSpeedSlider ? puyoSpeedSlider.value : 1, 10) || 1;
    calculatePuyoDropInterval();
    
    puyoStatus = 'PLAYING';
    puyoState = 'PLAYING';
    updatePuyoHUD();
    playChiptuneTrack('PUYO_PUYO');
    
    puyoTimeEl.textContent = "0:00";
    if (puyoTimeMobileEl) puyoTimeMobileEl.textContent = "0:00";

    if (puyoTimeTimer) clearInterval(puyoTimeTimer);
    puyoTimeTimer = setInterval(() => {
        if (puyoStatus === 'PLAYING') {
            puyoTime++;
            const mins = Math.floor(puyoTime / 60);
            const secs = puyoTime % 60;
            const formatted = `${mins}:${secs.toString().padStart(2, '0')}`;
            puyoTimeEl.textContent = formatted;
            if (puyoTimeMobileEl) puyoTimeMobileEl.textContent = formatted;

            if (puyoTime % 30 === 0) {
                puyoLevel = Math.min(10, puyoLevel + 1);
                calculatePuyoDropInterval();
                updatePuyoHUD();
            }
        }
    }, 1000);

    lastPuyoDropTime = 0;
    renderPuyo();
    
    if (puyoLoopId) cancelAnimationFrame(puyoLoopId);
    puyoLoopId = requestAnimationFrame(updatePuyoGame);
}

function stopPuyoGame() {
    puyoStatus = 'GAMEOVER';
    if (puyoTimeTimer) clearInterval(puyoTimeTimer);
    if (puyoLoopId) cancelAnimationFrame(puyoLoopId);
}

function pausePuyoGame() {
    if (puyoStatus === 'PLAYING') {
        puyoStatus = 'PAUSED';
        stopChiptune();
        const pauseOverlay = document.getElementById('puyo-pause-overlay');
        if (pauseOverlay) pauseOverlay.classList.add('open');
    } else if (puyoStatus === 'PAUSED') {
        puyoStatus = 'PLAYING';
        playChiptuneTrack('PUYO_PUYO');
        const pauseOverlay = document.getElementById('puyo-pause-overlay');
        if (pauseOverlay) pauseOverlay.classList.remove('open');
        lastPuyoDropTime = 0;
        puyoLoopId = requestAnimationFrame(updatePuyoGame);
    }
}

// Bind Puyo click events
const puyoPauseBtn = document.getElementById('puyo-pause-btn');
const puyoResetBtn = document.getElementById('puyo-reset-btn');
const puyoRetryBtn = document.getElementById('puyo-retry-btn');
const puyoHomeBtn = document.getElementById('puyo-home-btn');

if (puyoPauseBtn) puyoPauseBtn.addEventListener('click', pausePuyoGame);
if (puyoResetBtn) puyoResetBtn.addEventListener('click', startPuyoGame);
if (puyoRetryBtn) puyoRetryBtn.addEventListener('click', startPuyoGame);
if (puyoHomeBtn) puyoHomeBtn.addEventListener('click', () => switchView('MENU'));

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
    } else if (currentMode === 'PUYO_PUYO' && puyoStatus === 'PLAYING' && puyoState === 'PLAYING') {
        rotatePuyo(1); // Clockwise
    }
}

function handleActionDown() {
    if (currentMode === 'FRAMEFALL') { setFramefallFast(true); return; }
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
    } else if (currentMode === 'PUYO_PUYO' && puyoStatus === 'PLAYING' && puyoState === 'PLAYING') {
        movePuyo(0, 1);
    }
}

function handleActionLeft() {
    if (currentMode === 'FRAMEFALL') { moveFramefallPlayer(-1); return; }
    if (currentMode === 'TETRIS' && tetrisStatus === 'PLAYING') {
        if (tryMove(-1, 0)) playSound('move');
    } else if (currentMode === 'BLOCK_ATTACK' && attackStatus === 'PLAYING') {
        if (attackCursor.x > 0) {
            attackCursor.x--;
            playSound('move');
            renderAttackGrid();
        }
    } else if (currentMode === 'PUYO_PUYO' && puyoStatus === 'PLAYING' && puyoState === 'PLAYING') {
        movePuyo(-1, 0);
    }
}

function handleActionRight() {
    if (currentMode === 'FRAMEFALL') { moveFramefallPlayer(1); return; }
    if (currentMode === 'TETRIS' && tetrisStatus === 'PLAYING') {
        if (tryMove(1, 0)) playSound('move');
    } else if (currentMode === 'BLOCK_ATTACK' && attackStatus === 'PLAYING') {
        if (attackCursor.x < COLS - 2) {
            attackCursor.x++;
            playSound('move');
            renderAttackGrid();
        }
    } else if (currentMode === 'PUYO_PUYO' && puyoStatus === 'PLAYING' && puyoState === 'PLAYING') {
        movePuyo(1, 0);
    }
}

function handleActionZ() {
    if (currentMode === 'TETRIS' && tetrisStatus === 'PLAYING') {
        holdPiece();
    } else if (currentMode === 'BLOCK_ATTACK' && attackStatus === 'PLAYING') {
        performSwap();
    } else if (currentMode === 'PUYO_PUYO' && puyoStatus === 'PLAYING' && puyoState === 'PLAYING') {
        rotatePuyo(-1); // Counter-Clockwise
    }
}

function handleActionX(isDown) {
    if (currentMode === 'FRAMEFALL') { if (isDown) fireFramefallProjectile(); return; }
    if (currentMode === 'TETRIS' && tetrisStatus === 'PLAYING') {
        if (isDown) hardDrop();
    } else if (currentMode === 'BLOCK_ATTACK' && attackStatus === 'PLAYING') {
        isPushingStack = isDown;
    } else if (currentMode === 'PUYO_PUYO' && puyoStatus === 'PLAYING' && puyoState === 'PLAYING') {
        if (isDown) hardDropPuyo();
    }
}

// Global Keyboard Handler
document.addEventListener('keydown', (e) => {
    // List of keys to prevent default behavior (scrolling, etc.)
    const preventKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'x', 'X', 'z', 'Z', 'p', 'P'];
    if (controlScheme === 'custom') {
        Object.values(customKeys).forEach(k => {
            if (!preventKeys.includes(k)) preventKeys.push(k);
        });
    }
    
    // Only prevent default if we're not binding a key inside the modal
    if (preventKeys.includes(e.key) && !document.querySelector('.key-bind-input.listening')) {
        e.preventDefault(); // prevent scroll
    }

    if (e.key === 'Escape' || e.key.toLowerCase() === 'p') {
        if (currentMode === 'BLOCK_ATTACK') pauseAttackGame();
        if (currentMode === 'TETRIS') pauseTetrisGame();
        if (currentMode === 'PUYO_PUYO') pausePuyoGame();
        if (currentMode === 'FRAMEFALL') pauseFramefallGame();
        return;
    }
    
    // Skip normal game input if mapping keys
    if (document.querySelector('.key-bind-input.listening')) {
        return;
    }

    if (controlScheme === 'classic') {
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
        } else if (currentMode === 'FRAMEFALL') {
            if (framefallStatus === 'GAMEOVER') {
                if ([' ', 'x', 'X', 'Enter'].includes(e.key)) startFramefallGame();
                return;
            }
            if (framefallStatus !== 'PLAYING') return;
            if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') handleActionLeft();
            else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') handleActionRight();
            else if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') setFramefallFast(true);
            else if (e.key === ' ' || e.key.toLowerCase() === 'x') handleActionX(true);
        } else if (currentMode === 'PUYO_PUYO') {
            if (puyoStatus === 'GAMEOVER') {
                if ([' ', 'z', 'Z', 'x', 'X', 'Enter'].includes(e.key)) startPuyoGame();
                return;
            }
            if (puyoStatus !== 'PLAYING') return;

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
    } else {
        // Custom Controls Mode
        if (currentMode === 'BLOCK_ATTACK') {
            if (attackStatus === 'GAMEOVER') {
                if ([customKeys['hard'], customKeys['hold'], 'Enter'].includes(e.key)) startAttackGame();
                return;
            }
            if (attackStatus !== 'PLAYING') return;

            if (e.key === customKeys['left']) handleActionLeft();
            else if (e.key === customKeys['right']) handleActionRight();
            else if (e.key === customKeys['soft']) handleActionDown();
            else if (e.key === customKeys['rot-cw']) handleActionUp();
            else if (e.key === customKeys['hold']) handleActionZ(); // Swap
            else if (e.key === customKeys['hard']) handleActionX(true); // Push Stack
        } else if (currentMode === 'TETRIS') {
            if (tetrisStatus === 'GAMEOVER') {
                if ([customKeys['hard'], customKeys['hold'], 'Enter'].includes(e.key)) startTetrisGame();
                return;
            }
            if (tetrisStatus !== 'PLAYING') return;

            if (e.key === customKeys['left']) handleActionLeft();
            else if (e.key === customKeys['right']) handleActionRight();
            else if (e.key === customKeys['soft']) handleActionDown();
            else if (e.key === customKeys['rot-cw']) handleActionUp();
            else if (e.key === customKeys['rot-ccw']) rotateCurrentCounterClockwise();
            else if (e.key === customKeys['hard']) handleActionX(true);
            else if (e.key === customKeys['hold']) handleActionZ();
        } else if (currentMode === 'FRAMEFALL') {
            if (framefallStatus === 'GAMEOVER') {
                if ([customKeys['hard'], 'Enter'].includes(e.key)) startFramefallGame();
                return;
            }
            if (framefallStatus !== 'PLAYING') return;
            if (e.key === customKeys['left']) handleActionLeft();
            else if (e.key === customKeys['right']) handleActionRight();
            else if (e.key === customKeys['soft']) setFramefallFast(true);
            else if (e.key === customKeys['hard']) handleActionX(true);
        } else if (currentMode === 'PUYO_PUYO') {
            if (puyoStatus === 'GAMEOVER') {
                if ([customKeys['hard'], customKeys['hold'], 'Enter'].includes(e.key)) startPuyoGame();
                return;
            }
            if (puyoStatus !== 'PLAYING') return;

            if (e.key === customKeys['left']) handleActionLeft();
            else if (e.key === customKeys['right']) handleActionRight();
            else if (e.key === customKeys['soft']) handleActionDown();
            else if (e.key === customKeys['rot-cw']) handleActionUp();
            else if (e.key === customKeys['rot-ccw']) rotatePuyo(-1);
            else if (e.key === customKeys['hard']) handleActionX(true);
        }
    }
});

document.addEventListener('keyup', (e) => {
    if (currentMode === 'FRAMEFALL' && (e.key === 'ArrowDown' || e.key.toLowerCase() === 's' || e.key === customKeys['soft'])) {
        setFramefallFast(false);
    }
    if (controlScheme === 'classic') {
        if (currentMode === 'BLOCK_ATTACK' && e.key.toLowerCase() === 'x') {
            handleActionX(false);
        }
        if (currentMode === 'PUYO_PUYO' && e.key.toLowerCase() === 'x') {
            handleActionX(false);
        }
    } else {
        if (currentMode === 'BLOCK_ATTACK' && e.key === customKeys['hard']) {
            handleActionX(false);
        }
        if (currentMode === 'PUYO_PUYO' && e.key === customKeys['hard']) {
            handleActionX(false);
        }
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
mobileDown.addEventListener('click', () => {
    if (currentMode !== 'FRAMEFALL') handleActionDown();
});
mobileLeft.addEventListener('click', handleActionLeft);
mobileRight.addEventListener('click', handleActionRight);
mobileZ.addEventListener('click', handleActionZ);

mobileDown.addEventListener('touchstart', (e) => {
    if (currentMode === 'FRAMEFALL') { e.preventDefault(); setFramefallFast(true); }
});
mobileDown.addEventListener('mousedown', () => {
    if (currentMode === 'FRAMEFALL') setFramefallFast(true);
});
mobileDown.addEventListener('touchend', () => setFramefallFast(false));
mobileDown.addEventListener('mouseup', () => setFramefallFast(false));

// X button acts as a trigger key (need touchstart/touchend for smooth drag push in block attack)
mobileX.addEventListener('touchstart', (e) => { e.preventDefault(); handleActionX(true); });
mobileX.addEventListener('mousedown', (e) => { e.preventDefault(); handleActionX(true); });
mobileX.addEventListener('touchend', (e) => { e.preventDefault(); handleActionX(false); });
mobileX.addEventListener('mouseup', (e) => { e.preventDefault(); handleActionX(false); });

// Mobile virtual system buttons
const mobileHome = document.getElementById('m-btn-home');
const mobilePause = document.getElementById('m-btn-pause');
const mobileReset = document.getElementById('m-btn-reset');

if (mobileHome) {
    mobileHome.addEventListener('click', () => switchView('MENU'));
}
if (mobilePause) {
    mobilePause.addEventListener('click', () => {
        if (currentMode === 'BLOCK_ATTACK') pauseAttackGame();
        if (currentMode === 'TETRIS') pauseTetrisGame();
        if (currentMode === 'PUYO_PUYO') pausePuyoGame();
        if (currentMode === 'FRAMEFALL') pauseFramefallGame();
    });
}
if (mobileReset) {
    mobileReset.addEventListener('click', () => {
        if (currentMode === 'BLOCK_ATTACK') startAttackGame();
        if (currentMode === 'TETRIS') startTetrisGame();
        if (currentMode === 'PUYO_PUYO') startPuyoGame();
        if (currentMode === 'FRAMEFALL') startFramefallGame();
    });
}

// Initial layout scale call
resizeGameLayouts();

// Initialize custom controls UI
initControlsUI();

// Launch
switchView('MENU');

// ==========================================
// CONTROLS CONFIGURATION & BINDINGS SETUP
// ==========================================
function initControlsUI() {
    const modal = document.getElementById('controls-modal');
    const toggleBtn = document.getElementById('controls-toggle-btn');
    const closeBtn = document.getElementById('btn-close-modal');
    const resetBtn = document.getElementById('btn-reset-keys');
    const classicBtn = document.getElementById('scheme-classic-btn');
    const customBtn = document.getElementById('scheme-custom-btn');
    const configContainer = document.getElementById('custom-keys-config');
    
    if (!modal) return;
    
    // Toggle modal visibility
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            updateControlsUI();
            modal.classList.add('open');
        });
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('open');
        });
    }
    
    // Close modal if clicking outside content
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('open');
        }
    });
    
    // Switch to classic
    if (classicBtn) {
        classicBtn.addEventListener('click', () => {
            controlScheme = 'classic';
            setCookie('arcade_control_scheme', 'classic', 365);
            classicBtn.classList.add('active');
            if (customBtn) customBtn.classList.remove('active');
            if (configContainer) configContainer.classList.add('disabled');
            updateGameInstructions();
        });
    }
    
    // Switch to custom
    if (customBtn) {
        customBtn.addEventListener('click', () => {
            controlScheme = 'custom';
            setCookie('arcade_control_scheme', 'custom', 365);
            customBtn.classList.add('active');
            if (classicBtn) classicBtn.classList.remove('active');
            if (configContainer) configContainer.classList.remove('disabled');
            updateGameInstructions();
        });
    }
    
    // Reset keybinds
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            customKeys = {
                'left': 'ArrowLeft',
                'right': 'ArrowRight',
                'hard': ' ',
                'soft': 'ArrowDown',
                'rot-cw': 'ArrowUp',
                'rot-ccw': 'z',
                'hold': 'c'
            };
            setCookie('arcade_custom_keys', JSON.stringify(customKeys), 365);
            updateControlsUI();
            updateGameInstructions();
        });
    }
    
    // Map button click listeners for each binding row
    const bindingActions = ['left', 'right', 'hard', 'soft', 'rot-cw', 'rot-ccw', 'hold'];
    bindingActions.forEach(action => {
        const btn = document.getElementById('bind-' + action);
        if (btn) {
            btn.addEventListener('click', () => {
                // Clear any other active listening states
                document.querySelectorAll('.key-bind-input').forEach(b => {
                    b.classList.remove('listening');
                    const act = b.id.replace('bind-', '');
                    b.textContent = formatKeyName(customKeys[act]);
                });
                
                btn.classList.add('listening');
                btn.textContent = "Press any key...";
                
                const captureKey = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const newKey = e.key;
                    customKeys[action] = newKey;
                    setCookie('arcade_custom_keys', JSON.stringify(customKeys), 365);
                    
                    btn.textContent = formatKeyName(newKey);
                    btn.classList.remove('listening');
                    updateGameInstructions();
                    
                    window.removeEventListener('keydown', captureKey, true);
                };
                
                window.addEventListener('keydown', captureKey, true);
            });
        }
    });
}

function formatKeyName(key) {
    if (key === ' ') return 'Space';
    return key;
}

function updateControlsUI() {
    const classicBtn = document.getElementById('scheme-classic-btn');
    const customBtn = document.getElementById('scheme-custom-btn');
    const configContainer = document.getElementById('custom-keys-config');
    
    if (controlScheme === 'classic') {
        if (classicBtn) classicBtn.classList.add('active');
        if (customBtn) customBtn.classList.remove('active');
        if (configContainer) configContainer.classList.add('disabled');
    } else {
        if (customBtn) customBtn.classList.add('active');
        if (classicBtn) classicBtn.classList.remove('active');
        if (configContainer) configContainer.classList.remove('disabled');
    }
    
    const bindingActions = ['left', 'right', 'hard', 'soft', 'rot-cw', 'rot-ccw', 'hold'];
    bindingActions.forEach(action => {
        const btn = document.getElementById('bind-' + action);
        if (btn) {
            btn.textContent = formatKeyName(customKeys[action]);
        }
    });
}

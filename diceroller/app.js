// ==========================================
// 3D GEOMETRY GENERATORS (D4, D6, D8, D10, D12, D20)
// ==========================================
const phi = (1 + Math.sqrt(5)) / 2;
const ip = 1 / phi;

const GEOMETRIES = {
    2: { // Coin (D2)
        vertices: [
            // Top face (z = 0.15)
            [1, 0, 0.15], [0.707, 0.707, 0.15], [0, 1, 0.15], [-0.707, 0.707, 0.15],
            [-1, 0, 0.15], [-0.707, -0.707, 0.15], [0, -1, 0.15], [0.707, -0.707, 0.15],
            // Bottom face (z = -0.15)
            [1, 0, -0.15], [0.707, 0.707, -0.15], [0, 1, -0.15], [-0.707, 0.707, -0.15],
            [-1, 0, -0.15], [-0.707, -0.707, -0.15], [0, -1, -0.15], [0.707, -0.707, -0.15]
        ],
        faces: [
            [7, 6, 5, 4, 3, 2, 1, 0], // Heads (Face 0)
            [8, 9, 10, 11, 12, 13, 14, 15], // Tails (Face 1)
            [0, 1, 9, 8], [1, 2, 10, 9], [2, 3, 11, 10], [3, 4, 12, 11],
            [4, 5, 13, 12], [5, 6, 14, 13], [6, 7, 15, 14], [7, 0, 8, 15]
        ],
        scale: 35
    },
    4: { // Tetrahedron (D4)
        vertices: [
            [1, 1, 1], [-1, -1, 1], [-1, 1, -1], [1, -1, -1]
        ].map(v => normalize(v)),
        faces: [
            [0, 1, 2], [0, 3, 1], [0, 2, 3], [1, 3, 2]
        ],
        scale: 42
    },
    6: { // Cube (D6)
        vertices: [
            [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
            [-1, -1,  1], [1, -1,  1], [1, 1,  1], [-1, 1,  1]
        ].map(v => normalize(v)),
        faces: [
            [0, 1, 2, 3], [5, 4, 7, 6], [4, 0, 3, 7],
            [1, 5, 6, 2], [4, 5, 1, 0], [3, 2, 6, 7]
        ],
        scale: 30
    },
    8: { // Octahedron (D8)
        vertices: [
            [0, 0, 1], [1, 0, 0], [0, 1, 0], [-1, 0, 0], [0, -1, 0], [0, 0, -1]
        ],
        faces: [
            [0, 1, 2], [0, 2, 3], [0, 3, 4], [0, 4, 1],
            [5, 2, 1], [5, 3, 2], [5, 4, 3], [5, 1, 4]
        ],
        scale: 36
    },
    10: { // Pentagonal Trapezohedron (D10)
        vertices: getD10Vertices(),
        faces: [
            [0, 2, 7, 3], [0, 3, 8, 4], [0, 4, 9, 5], [0, 5, 10, 6], [0, 6, 11, 2],
            [1, 7, 2, 11], [1, 8, 3, 7], [1, 9, 4, 8], [1, 10, 5, 9], [1, 11, 6, 10]
        ],
        scale: 34
    },
    12: { // Dodecahedron (D12)
        vertices: [
            [-1, -1, -1], [ 1, -1, -1], [ 1,  1, -1], [-1,  1, -1],
            [-1, -1,  1], [ 1, -1,  1], [ 1,  1,  1], [-1,  1,  1],
            [0, -ip, -phi], [0,  ip, -phi], [0, -ip,  phi], [0,  ip,  phi],
            [-ip, -phi, 0], [ ip, -phi, 0], [-ip,  phi, 0], [ ip,  phi, 0],
            [-phi, 0, -ip], [ phi, 0, -ip], [-phi, 0,  ip], [ phi, 0,  ip]
        ].map(v => normalize(v)),
        faces: [
            [0, 8, 9, 3, 16],
            [0, 12, 13, 1, 8],
            [0, 16, 18, 4, 12],
            [1, 13, 5, 19, 17],
            [1, 17, 9, 2, 8],
            [2, 9, 3, 15, 14],
            [2, 17, 19, 6, 15],
            [3, 14, 7, 18, 16],
            [4, 10, 11, 7, 18],
            [4, 12, 13, 5, 10],
            [5, 10, 11, 6, 19],
            [6, 11, 7, 14, 15]
        ],
        scale: 32
    },
    20: { // Icosahedron (D20)
        vertices: [
            [-1,  phi, 0], [ 1,  phi, 0], [-1, -phi, 0], [ 1, -phi, 0],
            [0, -1,  phi], [0,  1,  phi], [0, -1, -phi], [0,  1, -phi],
            [ phi, 0, -1], [ phi, 0,  1], [-phi, 0, -1], [-phi, 0,  1]
        ].map(v => normalize(v)),
        faces: [
            [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
            [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
            [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
            [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]
        ],
        scale: 32
    }
};

function normalize(v) {
    const len = Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]);
    return len > 0 ? [v[0]/len, v[1]/len, v[2]/len] : [0,0,0];
}

function getD10Vertices() {
    const verts = [
        [0, 0, 1.25], // Top
        [0, 0, -1.25] // Bottom
    ];
    // Upper ring
    for (let i = 0; i < 5; i++) {
        const a = (i * 72 * Math.PI) / 180;
        verts.push([Math.cos(a), Math.sin(a), 0.35]);
    }
    // Lower ring
    for (let i = 0; i < 5; i++) {
        const a = ((i * 72 + 36) * Math.PI) / 180;
        verts.push([Math.cos(a), Math.sin(a), -0.35]);
    }
    return verts.map(v => normalize(v));
}

// ==========================================
// CUTE RETRO RETRO SYNTH AUDIO GENERATOR
// ==========================================
let audioCtx = null;

function initAudio() {
    try {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume().catch(() => {});
        }
    } catch (e) {
        console.warn("AudioContext initialization blocked or failed:", e);
    }
}

function playClatterSound() {
    try {
        initAudio();
        if (!audioCtx) return;
        
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(280 + Math.random() * 220, now);
        osc.frequency.exponentialRampToValueAtTime(70, now + 0.08);
        
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.start(now);
        osc.stop(now + 0.09);
    } catch (e) {}
}

function playLandSound() {
    try {
        initAudio();
        if (!audioCtx) return;
        
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(105, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.2);
        
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.start(now);
        osc.stop(now + 0.22);
    } catch (e) {}
}

// ==========================================
// THEME COLORS CONFIGURATION
// ==========================================
const THEMES = {
    obsidian: {
        fill: '#0f172a',
        stroke: '#a855f7',
        text: '#c084fc',
        textGlow: 'rgba(192, 132, 252, 0.8)'
    },
    ruby: {
        fill: '#dc2626',
        stroke: '#f87171',
        text: '#ffffff',
        textGlow: 'rgba(255, 255, 255, 0.6)'
    },
    gold: {
        fill: '#d97706',
        stroke: '#fbbf24',
        text: '#020617',
        textGlow: 'transparent'
    },
    emerald: {
        fill: '#064e3b',
        stroke: '#10b981',
        text: '#34d399',
        textGlow: 'rgba(52, 211, 153, 0.8)'
    },
    ice: {
        fill: 'rgba(186, 230, 253, 0.65)',
        stroke: '#0ea5e9',
        text: '#0369a1',
        textGlow: 'rgba(3, 105, 161, 0.4)'
    }
};

// ==========================================
// 3D DIE INSTANCE DEFINITION
// ==========================================
class Die {
    constructor(x, y, sides, style, value) {
        this.x = x;
        this.y = y;
        this.z = 100 + Math.random() * 50; // drop heights
        
        this.vx = (Math.random() * 2 - 1) * 7;
        this.vy = (Math.random() * 2 - 1) * 7;
        this.vz = -6 - Math.random() * 6;
        
        this.rotX = Math.random() * Math.PI * 2;
        this.rotY = Math.random() * Math.PI * 2;
        this.rotZ = Math.random() * Math.PI * 2;
        
        this.vRotX = (Math.random() * 2 - 1) * 0.35;
        this.vRotY = (Math.random() * 2 - 1) * 0.35;
        this.vRotZ = (Math.random() * 2 - 1) * 0.35;
        
        this.sides = sides;
        this.style = style;
        this.value = value;
        
        this.geometry = GEOMETRIES[sides] || GEOMETRIES[6];
        this.isSettled = false;
        this.topFaceIdx = -1;
    }
    
    update(width, height) {
        if (this.isSettled) return;
        
        this.x += this.vx;
        this.y += this.vy;
        this.vz -= 0.7; // gravity
        this.z += this.vz;
        
        this.rotX += this.vRotX;
        this.rotY += this.vRotY;
        this.rotZ += this.vRotZ;
        
        const scale = this.geometry.scale;
        const rBound = scale * diceScaleFactor * 0.8;
        
        // Wall bounces
        if (this.x < rBound) { this.x = rBound; this.vx = -this.vx * 0.75; playClatterSound(); }
        if (this.x > width - rBound) { this.x = width - rBound; this.vx = -this.vx * 0.75; playClatterSound(); }
        if (this.y < rBound) { this.y = rBound; this.vy = -this.vy * 0.75; playClatterSound(); }
        if (this.y > height - rBound) { this.y = height - rBound; this.vy = -this.vy * 0.75; playClatterSound(); }
        
        // Floor bounces
        if (this.z <= 0) {
            this.z = 0;
            
            if (Math.abs(this.vz) > 1.5) {
                playLandSound();
            }
            
            this.vz = -this.vz * 0.55; // bounce decay
            
            this.vx *= 0.8;
            this.vy *= 0.8;
            this.vRotX *= 0.8;
            this.vRotY *= 0.8;
            this.vRotZ *= 0.8;
            
            // Settle threshold
            if (Math.abs(this.vz) < 1.0 && Math.abs(this.vx) < 0.25 && Math.abs(this.vy) < 0.25) {
                this.vz = 0;
                this.vx = 0;
                this.vy = 0;
                this.vRotX = 0;
                this.vRotY = 0;
                this.vRotZ = 0;
                this.isSettled = true;
            }
        }
    }
}

// Rotations Matrix Projection
function rotate3D(v, rx, ry, rz) {
    let cosZ = Math.cos(rz), sinZ = Math.sin(rz);
    let x1 = v[0] * cosZ - v[1] * sinZ;
    let y1 = v[0] * sinZ + v[1] * cosZ;
    let z1 = v[2];
    
    let cosY = Math.cos(ry), sinY = Math.sin(ry);
    let x2 = x1 * cosY + z1 * sinY;
    let y2 = y1;
    let z2 = -x1 * sinY + z1 * cosY;
    
    let cosX = Math.cos(rx), sinX = Math.sin(rx);
    let x3 = x2;
    let y3 = y2 * cosX - z2 * sinX;
    let z3 = y2 * sinX + z2 * cosX;
    
    return [x3, y3, z3];
}

// ==========================================
// CANVAS TICK LOOP & RENDERING
// ==========================================
const canvas = document.getElementById('diceCanvas');
const ctx = canvas.getContext('2d');
const diceTray = document.getElementById('diceTray');

let diceScaleFactor = 2.0; // Default size: 200%
let activeDice = [];
let loopActive = false;

function resizeCanvas() {
    const rect = diceTray.getBoundingClientRect();
    if (canvas.width !== rect.width || canvas.height !== rect.height) {
        canvas.width = rect.width;
        canvas.height = rect.height;
    }
}
resizeCanvas();

function startPhysicsLoop() {
    if (!loopActive) {
        loopActive = true;
        requestAnimationFrame(tick);
    }
}

function tick() {
    resizeCanvas();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    let allSettled = true;
    activeDice.forEach(die => {
        die.update(canvas.width, canvas.height);
        if (!die.isSettled) allSettled = false;
    });
    
    // Compute camera-facing topFaceIdx for each die
    activeDice.forEach(die => {
        let bestFaceIdx = -1;
        let bestCz = -9999;
        
        die.geometry.faces.forEach((face, idx) => {
            let cx = 0, cy = 0, cz = 0;
            face.forEach(vi => {
                cx += die.geometry.vertices[vi][0];
                cy += die.geometry.vertices[vi][1];
                cz += die.geometry.vertices[vi][2];
            });
            cx /= face.length;
            cy /= face.length;
            cz /= face.length;
            
            const rotCenter = rotate3D([cx, cy, cz], die.rotX, die.rotY, die.rotZ);
            if (rotCenter[2] > bestCz) {
                bestCz = rotCenter[2];
                bestFaceIdx = idx;
            }
        });
        die.topFaceIdx = bestFaceIdx;
    });
    
    drawScene();
    
    if (allSettled) {
        loopActive = false;
        showSumResult();
    } else {
        requestAnimationFrame(tick);
    }
}

// Draw Scene with 3D Perspective Projection & Face Center Occlusion Checks
function drawScene() {
    const renderList = [];
    const cameraDistance = 3.0; // perspective term
    
    activeDice.forEach(die => {
        const theme = THEMES[die.style] || THEMES.obsidian;
        const rotVerts = die.geometry.vertices.map(v => rotate3D(v, die.rotX, die.rotY, die.rotZ));
        
        die.geometry.faces.forEach((face, idx) => {
            let cx = 0, cy = 0, cz = 0;
            face.forEach(vi => {
                cx += die.geometry.vertices[vi][0];
                cy += die.geometry.vertices[vi][1];
                cz += die.geometry.vertices[vi][2];
            });
            cx /= face.length;
            cy /= face.length;
            cz /= face.length;
            
            const rotCenter = rotate3D([cx, cy, cz], die.rotX, die.rotY, die.rotZ);
            
            // Only draw faces pointing in the positive Z half-space (towards camera)
            if (rotCenter[2] > -0.05) {
                let avgZ = face.reduce((sum, vi) => sum + rotVerts[vi][2], 0) / face.length;
                let worldDepth = die.z + avgZ * 25;
                
                renderList.push({
                    die: die,
                    theme: theme,
                    faceIndices: face,
                    rotVerts: rotVerts,
                    rotCenter: rotCenter,
                    worldDepth: worldDepth,
                    faceIdx: idx
                });
            }
        });
    });
    
    // Sort rendering list: further away drawn first (Painter's Algorithm)
    renderList.sort((a, b) => a.worldDepth - b.worldDepth);
    
    // Draw polygons
    const light = [-0.25, 0.25, 0.9];
    const lightLen = Math.sqrt(light[0]*light[0] + light[1]*light[1] + light[2]*light[2]);
    const lx = light[0] / lightLen, ly = light[1] / lightLen, lz = light[2] / lightLen;
    
    renderList.forEach(item => {
        const die = item.die;
        const theme = item.theme;
        const scale = die.geometry.scale;
        
        ctx.beginPath();
        item.faceIndices.forEach((vi, i) => {
            const rv = item.rotVerts[vi];
            const f = cameraDistance / (cameraDistance - rv[2] * 0.35);
            
            const px = die.x + rv[0] * scale * diceScaleFactor * f;
            const py = die.y - rv[1] * scale * diceScaleFactor * f - die.z; // subtract altitude
            
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        });
        ctx.closePath();
        
        // Compute normal vector based on rotated center coordinates
        const nlen = Math.sqrt(item.rotCenter[0]*item.rotCenter[0] + item.rotCenter[1]*item.rotCenter[1] + item.rotCenter[2]*item.rotCenter[2]);
        let nx = item.rotCenter[0] / (nlen || 1);
        let ny = item.rotCenter[1] / (nlen || 1);
        let nz = item.rotCenter[2] / (nlen || 1);
        
        const dot = nx * lx + ny * ly + nz * lz;
        const shade = 0.6 + 0.4 * Math.max(0, dot);
        
        ctx.fillStyle = shadeColor(theme.fill, shade);
        ctx.fill();
        
        ctx.strokeStyle = theme.stroke;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        // Write Number ONLY on the top-facing face
        if (item.faceIdx === die.topFaceIdx) {
            if (die.sides === 2 && item.faceIdx > 1) {
                // Do not write anything on the narrow side panels
            } else {
                let sumX = 0, sumY = 0;
                item.faceIndices.forEach(vi => {
                    const rv = item.rotVerts[vi];
                    const f = cameraDistance / (cameraDistance - rv[2] * 0.35);
                    sumX += die.x + rv[0] * scale * diceScaleFactor * f;
                    sumY += die.y - rv[1] * scale * diceScaleFactor * f - die.z;
                });
                const cx = sumX / item.faceIndices.length;
                const cy = sumY / item.faceIndices.length;
                
                let valText = '';
                if (die.sides === 2) {
                    valText = (item.faceIdx === 0) ? 'Heads' : 'Tails';
                } else {
                    if (die.isSettled) {
                        valText = die.value;
                    } else {
                        valText = Math.floor(Math.random() * die.sides) + 1;
                    }
                }
                
                ctx.fillStyle = theme.text;
                const fontFactor = die.sides === 2 ? 0.38 : 0.65;
                ctx.font = `bold ${scale * diceScaleFactor * fontFactor}px Outfit, sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                if (theme.textGlow !== 'transparent') {
                    ctx.shadowColor = theme.stroke;
                    ctx.shadowBlur = 8;
                }
                ctx.fillText(valText, cx, cy);
                ctx.shadowBlur = 0;
            }
        }
    });
}

function shadeColor(color, percent) {
    if (color.startsWith('rgba')) return color;
    let num = parseInt(color.replace("#",""), 16),
        amt = Math.round(255 * (percent - 1)),
        R = (num >> 16) + amt,
        G = (num >> 8 & 0x00FF) + amt,
        B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R<255?R<0?0:R:255)*0x10000 + (G<255?G<0?0:G:255)*0x100 + (B<255?B<0?0:B:255)).toString(16).slice(1);
}

// ==========================================
// D&D PARSER & TRIGGERS
// ==========================================
const notationInput = document.getElementById('notationInput');
const styleSelect = document.getElementById('styleSelect');
const resultSum = document.getElementById('resultSum');
const resultBreakdown = document.getElementById('resultBreakdown');
const rollBtn = document.getElementById('rollBtn');
const clearBtn = document.getElementById('clearBtn');

const advantageSlider = document.getElementById('advantageSlider');
const labelDis = document.getElementById('labelDis');
const labelNorm = document.getElementById('labelNorm');
const labelAdv = document.getElementById('labelAdv');

// Dice Size Slider elements & listener
const diceSizeSlider = document.getElementById('diceSizeSlider');
const diceSizeVal = document.getElementById('diceSizeVal');
if (diceSizeSlider) {
    diceSizeSlider.addEventListener('input', (e) => {
        const percent = parseInt(e.target.value, 10);
        if (diceSizeVal) {
            diceSizeVal.textContent = percent + '%';
        }
        diceScaleFactor = percent / 100;
        
        // Dynamic redraw of settled dice on size change
        if (!loopActive) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawScene();
        }
    });
}

// Sync notches clicks & drag updates
advantageSlider.addEventListener('input', updateSliderVisuals);
function updateSliderVisuals() {
    const val = parseInt(advantageSlider.value, 10);
    labelDis.classList.toggle('active', val === -1);
    labelNorm.classList.toggle('active', val === 0);
    labelAdv.classList.toggle('active', val === 1);
}

// Allow clicking labels to slide there
labelDis.addEventListener('click', () => { advantageSlider.value = -1; updateSliderVisuals(); });
labelNorm.addEventListener('click', () => { advantageSlider.value = 0; updateSliderVisuals(); });
labelAdv.addEventListener('click', () => { advantageSlider.value = 1; updateSliderVisuals(); });

function parseNotation(notation) {
    const clean = notation.replace(/\s+/g, '').toLowerCase();
    const match = clean.match(/^(\d*)d(\d+)(?:([+-])(\d+))?$/);
    if (!match) return null;
    
    const count = match[1] === "" ? 1 : parseInt(match[1], 10);
    const sides = parseInt(match[2], 10);
    const operator = match[3] || null;
    const modValue = match[4] ? parseInt(match[4], 10) : 0;
    
    let modifier = 0;
    if (operator === '+') modifier = modValue;
    if (operator === '-') modifier = -modValue;
    
    return { count, sides, modifier };
}

function clearTray() {
    activeDice = [];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    resultSum.textContent = '--';
    resultBreakdown.innerHTML = 'Tray cleared. Enter notation and roll to start!';
}

function getSecondaryTheme(primaryTheme) {
    const themesList = Object.keys(THEMES);
    const idx = themesList.indexOf(primaryTheme);
    const nextIdx = (idx + 1) % themesList.length;
    return themesList[nextIdx];
}

function rollDice() {
    const notation = notationInput.value.trim();
    const parsed = parseNotation(notation);
    
    if (!parsed) {
        alert("Invalid notation! Please enter format like: 4d6+10, 1d20, d8-2");
        return;
    }
    
    const validSides = [2, 4, 6, 8, 10, 12, 20];
    if (!validSides.includes(parsed.sides)) {
        parsed.sidesGeometry = 6;
    } else {
        parsed.sidesGeometry = parsed.sides;
    }
    
    if (parsed.count > 50) {
        alert("Maximum dice roll is capped at 50 to maintain performance.");
        return;
    }
    
    activeDice = [];
    playClatterSound();
    
    const theme = styleSelect.value;
    const rolls = [];
    const advantageMode = parseInt(advantageSlider.value, 10);
    
    const applyAdvantage = (parsed.count === 1 && advantageMode !== 0);
    
    if (applyAdvantage) {
        const val1 = Math.floor(Math.random() * parsed.sides) + 1;
        const val2 = Math.floor(Math.random() * parsed.sides) + 1;
        rolls.push(val1, val2);
        
        const spacing = 60 * diceScaleFactor;
        const x1 = canvas.width / 2 - spacing;
        const y1 = canvas.height / 2;
        const x2 = canvas.width / 2 + spacing;
        const y2 = canvas.height / 2;
        
        const theme1 = theme;
        const theme2 = getSecondaryTheme(theme);
        
        activeDice.push(new Die(x1, y1, parsed.sidesGeometry, theme1, val1));
        activeDice.push(new Die(x2, y2, parsed.sidesGeometry, theme2, val2));
        
        const selected = (advantageMode === 1) ? Math.max(val1, val2) : Math.min(val1, val2);
        parsed.total = selected + parsed.modifier;
        parsed.advantageMode = advantageMode;
        parsed.val1 = val1;
        parsed.val2 = val2;
        parsed.theme1 = theme1;
        parsed.theme2 = theme2;
    } else {
        for (let i = 0; i < parsed.count; i++) {
            const value = Math.floor(Math.random() * parsed.sides) + 1;
            rolls.push(value);
            
            const pad = 60 * diceScaleFactor;
            const x = pad + Math.random() * (canvas.width - pad * 2);
            const y = pad + Math.random() * (canvas.height - pad * 2);
            
            const die = new Die(x, y, parsed.sidesGeometry, theme, value);
            activeDice.push(die);
        }
        parsed.total = rolls.reduce((sum, r) => sum + r, 0) + parsed.modifier;
        parsed.advantageMode = 0;
    }
    
    parsed.rolls = rolls;
    rollBtn.dataset.parsed = JSON.stringify(parsed);
    
    startPhysicsLoop();
}

function showSumResult() {
    const rawParsed = rollBtn.dataset.parsed;
    if (!rawParsed) return;
    const parsed = JSON.parse(rawParsed);
    
    // Custom formatted display for coin flips (D2 with 0 modifier)
    if (parsed.sides === 2 && parsed.modifier === 0) {
        const headsCount = parsed.rolls.filter(r => r === 1).length;
        const tailsCount = parsed.rolls.filter(r => r === 2).length;
        
        if (parsed.count === 1) {
            const face = parsed.rolls[0] === 1 ? 'Heads' : 'Tails';
            resultSum.textContent = face;
            resultBreakdown.innerHTML = `Result: <span>${face}</span> (Coin Flip)`;
        } else {
            resultSum.textContent = `${headsCount}H / ${tailsCount}T`;
            const coinNames = parsed.rolls.map(r => r === 1 ? 'Heads' : 'Tails');
            resultBreakdown.innerHTML = `Result: <span>${headsCount} Heads, ${tailsCount} Tails</span> (Breakdown: ${coinNames.join(', ')})`;
        }
        return;
    }
    
    resultSum.textContent = parsed.total;
    
    let detail = `Result: <span>${parsed.total}</span> `;
    
    if (parsed.advantageMode !== 0) {
        const modeName = parsed.advantageMode === 1 ? "Advantage" : "Disadvantage";
        const selected = parsed.advantageMode === 1 ? Math.max(parsed.val1, parsed.val2) : Math.min(parsed.val1, parsed.val2);
        
        const THEME_NAMES = {
            obsidian: "Obsidian Neon",
            ruby: "Ruby Glass",
            gold: "Metallic Gold",
            emerald: "Emerald Glow",
            ice: "Frost Sapphire"
        };
        const tName1 = THEME_NAMES[parsed.theme1] || "Primary";
        const tName2 = THEME_NAMES[parsed.theme2] || "Secondary";
        
        detail += `(Breakdown: Selected <strong>${selected}</strong> from [${parsed.val1} (${tName1}), ${parsed.val2} (${tName2})] with ${modeName}`;
        if (parsed.modifier !== 0) {
            const sign = parsed.modifier > 0 ? ' + ' : ' - ';
            detail += `${sign}${Math.abs(parsed.modifier)}`;
        }
        detail += ` [d${parsed.sides}])`;
    } else {
        detail += `(Breakdown: `;
        detail += parsed.rolls.join(' + ');
        if (parsed.modifier !== 0) {
            const sign = parsed.modifier > 0 ? ' + ' : ' - ';
            detail += `${sign}${Math.abs(parsed.modifier)}`;
        }
        detail += ` [d${parsed.sides}])`;
    }
    
    resultBreakdown.innerHTML = detail;
}

rollBtn.addEventListener('click', () => {
    initAudio();
    rollDice();
});

clearBtn.addEventListener('click', () => {
    initAudio();
    clearTray();
});

document.querySelectorAll('.quick-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        initAudio();
        const sides = btn.dataset.sides;
        notationInput.value = `1d${sides}`;
        rollDice();
    });
});

notationInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        initAudio();
        rollDice();
    }
});



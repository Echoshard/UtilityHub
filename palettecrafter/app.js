// --- PALETTE CRAFTER APPLICATION LOGIC ---

// Elements
const baseColor = document.getElementById('baseColor');
const baseHex = document.getElementById('baseHex');
const presetSelect = document.getElementById('presetSelect');
const harmonyRule = document.getElementById('harmonyRule');
const swatchCount = document.getElementById('swatchCount');
const swatchCountVal = document.getElementById('swatchCountVal');
const satShift = document.getElementById('satShift');
const satVal = document.getElementById('satVal');
const simFilter = document.getElementById('simFilter');
const swatchesContainer = document.getElementById('swatchesContainer');

// Preview Elements
const darkPreview = document.getElementById('darkPreview');
const darkRatio = document.getElementById('darkRatio');
const darkScore = document.getElementById('darkScore');
const lightPreview = document.getElementById('lightPreview');
const lightRatio = document.getElementById('lightRatio');
const lightScore = document.getElementById('lightScore');

// Export Elements
const exportDialog = document.getElementById('exportDialog');
const dialogTitle = document.getElementById('dialogTitle');
const dialogCode = document.getElementById('dialogCode');
const dialogCopy = document.getElementById('dialogCopy');
const dialogClose = document.getElementById('dialogClose');

const exportCssBtn = document.getElementById('exportCssBtn');
const exportTailwindBtn = document.getElementById('exportTailwindBtn');
const exportHexBtn = document.getElementById('exportHexBtn');

// Active state
let generatedColors = [];

// Fallback presets if loading JSON fails (e.g. running via file:// CORS rules)
const FALLBACK_PRESETS = [
    { name: "Vibrant Purple (Default)", color: "#A855F7" },
    { name: "Google Blue", color: "#4285F4" },
    { name: "Spotify Green", color: "#1DB954" },
    { name: "Netflix Red", color: "#E50914" },
    { name: "Tailwind Teal", color: "#06B6D4" },
    { name: "Github Dark Slate", color: "#24292E" },
    { name: "Microsoft Orange", color: "#F25022" }
];

// --- PRESETS LOADING ENGINE ---
async function loadPresets() {
    try {
        const response = await fetch('presets.json');
        if (!response.ok) throw new Error('Not loaded');
        const data = await response.json();
        populatePresetsDropdown(data.presets || FALLBACK_PRESETS);
    } catch (err) {
        // Fallback for CORS file:// filesystem environment
        populatePresetsDropdown(FALLBACK_PRESETS);
    }
}

function populatePresetsDropdown(presets) {
    presetSelect.innerHTML = '<option value="">-- Choose Brand --</option>';
    presets.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.color;
        opt.textContent = `${p.name} (${p.color})`;
        presetSelect.appendChild(opt);
    });
}

// Load presets immediately
loadPresets();

// --- EVENT LISTENERS ---
baseColor.addEventListener('input', (e) => {
    baseHex.value = e.target.value.toUpperCase();
    presetSelect.value = ''; // clear preset selection on manual color pick
    generatePalette();
});

presetSelect.addEventListener('change', (e) => {
    const val = e.target.value;
    if (val) {
        baseColor.value = val;
        baseHex.value = val.toUpperCase();
        generatePalette();
    }
});

baseHex.addEventListener('input', (e) => {
    let hex = e.target.value;
    if (hex.startsWith('#')) hex = hex.slice(1);
    if (hex.length === 6) {
        baseColor.value = '#' + hex;
        generatePalette();
    }
});

harmonyRule.addEventListener('change', generatePalette);

swatchCount.addEventListener('input', (e) => {
    swatchCountVal.textContent = e.target.value;
    generatePalette();
});

satShift.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    satVal.textContent = val >= 0 ? `+${val}%` : `${val}%`;
    generatePalette();
});

// Color blindness simulator dropdown
simFilter.addEventListener('change', (e) => {
    const filter = e.target.value;
    const filterStyle = filter === 'none' ? 'none' : `url(#${filter})`;
    
    swatchesContainer.style.filter = filterStyle;
    darkPreview.style.filter = filterStyle;
    lightPreview.style.filter = filterStyle;
});

// Modal events
dialogClose.addEventListener('click', () => exportDialog.classList.remove('active'));
dialogCopy.addEventListener('click', () => {
    dialogCode.select();
    document.execCommand('copy');
    alert('📋 Copied to clipboard successfully!');
    exportDialog.classList.remove('active');
});

exportCssBtn.addEventListener('click', () => showExportModal('CSS Variables', buildCssExport()));
exportTailwindBtn.addEventListener('click', () => showExportModal('Tailwind CSS Config', buildTailwindExport()));
exportHexBtn.addEventListener('click', () => {
    const hexList = generatedColors.map(c => c.hex).join(', ');
    navigator.clipboard.writeText(hexList).then(() => {
        alert(`📋 Copied Hex List to Clipboard:\n${hexList}`);
    });
});

// --- COLOR CONVERSION UTILITIES ---
function hexToRgb(hex) {
    if (hex.startsWith('#')) hex = hex.slice(1);
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return { r, g, b };
}

function rgbToHex(r, g, b) {
    const clamp = (val) => Math.max(0, Math.min(255, Math.round(val)));
    const toHex = (c) => clamp(c).toString(16).padStart(2, '0').toUpperCase();
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0; // achromatic
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100)
    };
}

function hslToRgb(h, s, l) {
    s /= 100;
    l /= 100;
    h /= 360;

    let r, g, b;
    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }
    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}

function hslToHex(h, s, l) {
    const { r, g, b } = hslToRgb(h, s, l);
    return rgbToHex(r, g, b);
}

// --- HARMONY RULES GENERATION ---
function generatePalette() {
    const hex = baseColor.value;
    const { r, g, b } = hexToRgb(hex);
    const { h, s, l } = rgbToHsl(r, g, b);
    
    const count = parseInt(swatchCount.value, 10);
    const shift = parseInt(satShift.value, 10);
    
    // Apply saturation shift
    const adjustedS = Math.max(0, Math.min(100, s + shift));
    
    generatedColors = [];
    const rule = harmonyRule.value;

    if (rule === 'monochromatic') {
        // Vary lightness evenly
        for (let i = 0; i < count; i++) {
            const currentL = Math.max(10, Math.min(92, 12 + (i / (count - 1)) * 78));
            generatedColors.push({
                h, s: adjustedS, l: Math.round(currentL),
                hex: hslToHex(h, adjustedS, currentL)
            });
        }
    } 
    else if (rule === 'analogous') {
        // Spread hue around the base color
        const totalSpan = 60; // total hue range
        for (let i = 0; i < count; i++) {
            const offset = - (totalSpan / 2) + (i / (count - 1)) * totalSpan;
            const currentH = (h + offset + 360) % 360;
            generatedColors.push({
                h: Math.round(currentH), s: adjustedS, l,
                hex: hslToHex(currentH, adjustedS, l)
            });
        }
    } 
    else if (rule === 'complementary') {
        // Split half swatches on base side, half on complementary side
        const compH = (h + 180) % 360;
        const half = Math.ceil(count / 2);
        
        for (let i = 0; i < count; i++) {
            const isBase = i < half;
            const targetH = isBase ? h : compH;
            const step = isBase ? i : i - half;
            const subCount = isBase ? half : count - half;
            
            // Vary lightness slightly so colors are distinct
            const currentL = Math.max(25, Math.min(85, 35 + (step / Math.max(1, subCount - 1)) * 40));
            generatedColors.push({
                h: Math.round(targetH), s: adjustedS, l: Math.round(currentL),
                hex: hslToHex(targetH, adjustedS, currentL)
            });
        }
    } 
    else if (rule === 'split-complementary') {
        // Divide between Base (0 deg), Comp1 (150 deg), Comp2 (210 deg)
        const angles = [0, 150, 210];
        for (let i = 0; i < count; i++) {
            const angle = angles[i % 3];
            const targetH = (h + angle) % 360;
            const currentL = Math.max(30, Math.min(80, 35 + Math.floor(i / 3) * 15));
            generatedColors.push({
                h: Math.round(targetH), s: adjustedS, l: Math.round(currentL),
                hex: hslToHex(targetH, adjustedS, currentL)
            });
        }
    } 
    else if (rule === 'triadic') {
        // Divide between Base (0 deg), Option1 (120 deg), Option2 (240 deg)
        const angles = [0, 120, 240];
        for (let i = 0; i < count; i++) {
            const angle = angles[i % 3];
            const targetH = (h + angle) % 360;
            const currentL = Math.max(30, Math.min(80, 35 + Math.floor(i / 3) * 15));
            generatedColors.push({
                h: Math.round(targetH), s: adjustedS, l: Math.round(currentL),
                hex: hslToHex(targetH, adjustedS, currentL)
            });
        }
    } 
    else if (rule === 'tetradic') {
        // Double complementary: 0, 90, 180, 270
        const angles = [0, 90, 180, 270];
        for (let i = 0; i < count; i++) {
            const angle = angles[i % 4];
            const targetH = (h + angle) % 360;
            const currentL = Math.max(30, Math.min(80, 35 + Math.floor(i / 4) * 15));
            generatedColors.push({
                h: Math.round(targetH), s: adjustedS, l: Math.round(currentL),
                hex: hslToHex(targetH, adjustedS, currentL)
            });
        }
    }

    renderSwatches();
    updateA11yPreviews();
}

// --- ACCESSIBILITY / CONTRAST CALCULATIONS ---
function getLuminance(r, g, b) {
    const a = [r, g, b].map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function getContrastRatio(rgb1, rgb2) {
    const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
    const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
    const brightest = Math.max(l1, l2);
    const darkest = Math.min(l1, l2);
    return (brightest + 0.05) / (darkest + 0.05);
}

function getContrastScore(ratio) {
    if (ratio >= 7) return 'AAA';
    if (ratio >= 4.5) return 'AA';
    if (ratio >= 3) return 'AA Large';
    return 'FAIL';
}

function getA11yPillClass(score) {
    if (score === 'AAA') return 'a11y-pill pass-aaa';
    if (score === 'AA' || score === 'AA Large') return 'a11y-pill pass-aa';
    return 'a11y-pill fail';
}

// --- RENDER SWATCH CARDS ---
function renderSwatches() {
    swatchesContainer.innerHTML = '';

    generatedColors.forEach((color, index) => {
        const rgb = hslToRgb(color.h, color.s, color.l);
        const ratioWhite = getContrastRatio(rgb, { r: 255, g: 255, b: 255 });
        const ratioBlack = getContrastRatio(rgb, { r: 17, g: 24, b: 39 });
        
        const scoreWhite = getContrastScore(ratioWhite);
        const scoreBlack = getContrastScore(ratioBlack);

        const card = document.createElement('div');
        card.className = 'swatch-card';
        card.innerHTML = `
            <div class="swatch-color-box" style="background-color: ${color.hex};" title="Click to inspect this color"></div>
            <div class="swatch-info">
                <div class="swatch-hex">${color.hex}</div>
                <div class="swatch-details">
                    RGB: ${rgb.r}, ${rgb.g}, ${rgb.b}<br>
                    HSL: ${color.h}°, ${color.s}%, ${color.l}%
                </div>
                <div class="swatch-a11y-grid">
                    <span class="${getA11yPillClass(scoreWhite)}" title="Contrast with white text">${scoreWhite === 'FAIL' ? '✗ W' : '✓ W: ' + scoreWhite}</span>
                    <span class="${getA11yPillClass(scoreBlack)}" title="Contrast with dark text">${scoreBlack === 'FAIL' ? '✗ D' : '✓ D: ' + scoreBlack}</span>
                </div>
            </div>
        `;

        // Click color box to inspect typography contrast
        card.querySelector('.swatch-color-box').addEventListener('click', () => selectInspectColor(color));
        // Click hex to copy it
        card.querySelector('.swatch-hex').addEventListener('click', (e) => {
            navigator.clipboard.writeText(color.hex);
            alert(`📋 Hex code copied: ${color.hex}`);
        });

        swatchesContainer.appendChild(card);
    });
}

function selectInspectColor(color) {
    darkPreview.style.backgroundColor = color.hex;
    lightPreview.style.backgroundColor = color.hex;

    const rgb = hslToRgb(color.h, color.s, color.l);
    
    // Contrast with dark text (#111827)
    const ratioDark = getContrastRatio(rgb, { r: 17, g: 24, b: 39 });
    darkRatio.textContent = `${ratioDark.toFixed(1)}:1`;
    const scoreD = getContrastScore(ratioDark);
    darkScore.textContent = scoreD === 'FAIL' ? 'FAIL' : `PASS (${scoreD})`;
    darkScore.className = scoreD === 'FAIL' ? 'meta-score fail' : 'meta-score pass';
    darkScore.style.color = scoreD === 'FAIL' ? '#f87171' : '#34d399';

    // Contrast with light text (#ffffff)
    const ratioLight = getContrastRatio(rgb, { r: 255, g: 255, b: 255 });
    lightRatio.textContent = `${ratioLight.toFixed(1)}:1`;
    const scoreL = getContrastScore(ratioLight);
    lightScore.textContent = scoreL === 'FAIL' ? 'FAIL' : `PASS (${scoreL})`;
    lightScore.className = scoreL === 'FAIL' ? 'meta-score fail' : 'meta-score pass';
    lightScore.style.color = scoreL === 'FAIL' ? '#f87171' : '#34d399';
}

function updateA11yPreviews() {
    if (generatedColors.length > 0) {
        // Inspect the base color or first swatch on refresh
        const baseColorIdx = Math.floor(generatedColors.length / 2);
        selectInspectColor(generatedColors[baseColorIdx]);
    }
}

// --- EXPORT DOCUMENT STRINGS ---
function showExportModal(title, code) {
    dialogTitle.textContent = `Export as ${title}`;
    dialogCode.value = code;
    exportDialog.classList.add('active');
}

function buildCssExport() {
    let out = `/* Palette Crafter CSS Custom Properties */\n:root {\n`;
    generatedColors.forEach((c, i) => {
        out += `  --color-primary-${(i + 1) * 100}: ${c.hex};\n`;
    });
    out += `}`;
    return out;
}

function buildTailwindExport() {
    let out = `// Tailwind CSS Color Config\ncolors: {\n  primary: {\n`;
    generatedColors.forEach((c, i) => {
        const step = (i + 1) * 100 === 1000 ? 950 : (i + 1) * 100;
        out += `    "${step}": "${c.hex}",\n`;
    });
    out += `  }\n}`;
    return out;
}

// Start Palette Crafter
generatePalette();

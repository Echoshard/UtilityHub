// ==========================================
// PARAMETER MODEL
// ==========================================
function defaultParams() {
    return {
        waveType: 'square',
        volume: 0.5,
        attack: 0.0, sustain: 0.3, punch: 0.3, decay: 0.4,
        startFreq: 440, minFreq: 0, slide: 0, deltaSlide: 0,
        vibratoDepth: 0, vibratoSpeed: 0,
        arpeggioMult: 1, arpeggioTime: 0.3,
        dutyCycle: 0.5, dutySweep: 0,
        repeatSpeed: 0,
        flangerOffset: 0, flangerSweep: 0,
        lpfCutoff: 1, lpfResonance: 0, lpfRamp: 0,
        hpfCutoff: 0, hpfRamp: 0
    };
}

const PARAM_GROUPS = [
    { title: 'Envelope', fields: [
        { key: 'attack', label: 'Attack', min: 0, max: 1, step: 0.01 },
        { key: 'sustain', label: 'Sustain', min: 0, max: 1, step: 0.01 },
        { key: 'punch', label: 'Punch', min: 0, max: 1, step: 0.01 },
        { key: 'decay', label: 'Decay', min: 0, max: 1, step: 0.01 }
    ]},
    { title: 'Frequency', fields: [
        { key: 'startFreq', label: 'Start Freq (Hz)', min: 40, max: 2000, step: 1 },
        { key: 'minFreq', label: 'Freq Cutoff (Hz)', min: 0, max: 2000, step: 1 },
        { key: 'slide', label: 'Slide', min: -1, max: 1, step: 0.01 },
        { key: 'deltaSlide', label: 'Delta Slide', min: -1, max: 1, step: 0.01 }
    ]},
    { title: 'Vibrato', fields: [
        { key: 'vibratoDepth', label: 'Depth', min: 0, max: 1, step: 0.01 },
        { key: 'vibratoSpeed', label: 'Speed', min: 0, max: 1, step: 0.01 }
    ]},
    { title: 'Arpeggio', fields: [
        { key: 'arpeggioMult', label: 'Multiplier', min: 0.1, max: 4, step: 0.01 },
        { key: 'arpeggioTime', label: 'Time', min: 0, max: 1, step: 0.01 }
    ]},
    { title: 'Duty Cycle (Square)', fields: [
        { key: 'dutyCycle', label: 'Duty', min: 0, max: 1, step: 0.01 },
        { key: 'dutySweep', label: 'Duty Sweep', min: -1, max: 1, step: 0.01 }
    ]},
    { title: 'Repeat', fields: [
        { key: 'repeatSpeed', label: 'Speed (0 = off)', min: 0, max: 1, step: 0.01 }
    ]},
    { title: 'Flanger', fields: [
        { key: 'flangerOffset', label: 'Offset (0 = off)', min: 0, max: 1, step: 0.01 },
        { key: 'flangerSweep', label: 'Sweep', min: -1, max: 1, step: 0.01 }
    ]},
    { title: 'Low-Pass Filter', fields: [
        { key: 'lpfCutoff', label: 'Cutoff (1 = open)', min: 0, max: 1, step: 0.01 },
        { key: 'lpfResonance', label: 'Resonance', min: 0, max: 1, step: 0.01 },
        { key: 'lpfRamp', label: 'Ramp', min: -1, max: 1, step: 0.01 }
    ]},
    { title: 'High-Pass Filter', fields: [
        { key: 'hpfCutoff', label: 'Cutoff (0 = off)', min: 0, max: 1, step: 0.01 },
        { key: 'hpfRamp', label: 'Ramp', min: -1, max: 1, step: 0.01 }
    ]},
    { title: 'Volume', fields: [
        { key: 'volume', label: 'Master', min: 0, max: 1, step: 0.01 }
    ]}
];

let params = defaultParams();

// ==========================================
// SYNTHESIS ENGINE
// ==========================================
const SAMPLE_RATE = 44100;

function generateSfx(p) {
    const maxTotalSamples = SAMPLE_RATE * 6;

    const attackLen = Math.max(1, Math.round(p.attack * p.attack * SAMPLE_RATE));
    const sustainLen = Math.max(1, Math.round(p.sustain * p.sustain * SAMPLE_RATE));
    const decayLen = Math.max(1, Math.round(p.decay * p.decay * SAMPLE_RATE));
    const envTotalLen = attackLen + sustainLen + decayLen;

    const repeatIntervalSamples = p.repeatSpeed > 0
        ? Math.max(Math.round(SAMPLE_RATE * 0.015), Math.round(SAMPLE_RATE * (0.5 - p.repeatSpeed * 0.485)))
        : 0;

    const totalLen = Math.min(
        maxTotalSamples,
        repeatIntervalSamples > 0 ? SAMPLE_RATE * 2 : envTotalLen
    );

    const out = new Float32Array(totalLen);

    let lp = 0, bp = 0, hpState = 0;
    const lpfCutoffHz = 60 + Math.pow(p.lpfCutoff, 2) * 9000;
    const hpfCutoffHz = 20 + Math.pow(p.hpfCutoff, 2) * 4000;
    let lpfW = Math.min(1.15, (lpfCutoffHz / SAMPLE_RATE) * 2 * Math.PI);
    const lpfQ = Math.max(0.05, 1 - p.lpfResonance * 0.94);
    let hpfCoeff = Math.min(0.9, (hpfCutoffHz / SAMPLE_RATE) * 2 * Math.PI);

    const phaserBuf = new Float32Array(1024);
    let phaserPos = 0;
    const flangerBaseOffset = 4 + p.flangerOffset * 60;

    let freq = p.startFreq;
    let slideRate = p.slide * 0.0006;
    const dSlide = p.deltaSlide * 0.0000015;

    let phase = 0;
    let duty = 0.05 + p.dutyCycle * 0.45;
    const dutySweep = p.dutySweep * 0.0003;

    let vibPhase = 0;
    const vibInc = (p.vibratoSpeed * 18) / SAMPLE_RATE * 2 * Math.PI;

    let currentNoise = Math.random() * 2 - 1;
    let arpApplied = false;
    const arpeggioTimeSamples = Math.round(p.arpeggioTime * envTotalLen);

    let idx = 0;
    let sampleI = 0;

    for (let n = 0; n < totalLen; n++) {
        if (repeatIntervalSamples > 0 && sampleI >= repeatIntervalSamples) {
            sampleI = 0;
            idx = 0;
            freq = p.startFreq;
            slideRate = p.slide * 0.0006;
            phase = 0;
            duty = 0.05 + p.dutyCycle * 0.45;
            vibPhase = 0;
            arpApplied = false;
            lp = 0; bp = 0; hpState = 0;
        }

        let envVol;
        if (idx < attackLen) {
            envVol = idx / attackLen;
        } else if (idx < attackLen + sustainLen) {
            const t = (idx - attackLen) / sustainLen;
            envVol = 1 + (1 - t) * p.punch;
        } else if (idx < envTotalLen) {
            const t = (idx - attackLen - sustainLen) / decayLen;
            envVol = Math.max(0, 1 - t);
        } else {
            envVol = 0;
        }

        if (!arpApplied && idx >= arpeggioTimeSamples && p.arpeggioMult !== 1) {
            freq *= p.arpeggioMult;
            arpApplied = true;
        }

        slideRate += dSlide;
        freq *= (1 + slideRate);
        if (freq < 20) freq = 20;
        if (p.minFreq > 0 && freq < p.minFreq) freq = p.minFreq;
        if (freq > 8000) freq = 8000;

        vibPhase += vibInc;
        const effFreq = freq * (1 + Math.sin(vibPhase) * p.vibratoDepth * 0.1);

        duty += dutySweep;
        if (duty < 0.02) duty = 0.02;
        if (duty > 0.98) duty = 0.98;

        phase += effFreq / SAMPLE_RATE;
        if (phase >= 1) {
            phase -= Math.floor(phase);
            currentNoise = Math.random() * 2 - 1;
        }

        let raw;
        switch (p.waveType) {
            case 'square': raw = phase < duty ? 1 : -1; break;
            case 'saw': raw = 1 - 2 * phase; break;
            case 'sine': raw = Math.sin(phase * 2 * Math.PI); break;
            case 'triangle': raw = 1 - 4 * Math.abs(phase - 0.5); break;
            case 'noise': raw = currentNoise; break;
            default: raw = 0;
        }

        lpfW *= (1 + p.lpfRamp * 0.0004);
        const clampedW = Math.max(0.001, Math.min(1.15, lpfW));
        const hpOut = raw - lp - lpfQ * bp;
        bp += clampedW * hpOut;
        lp += clampedW * bp;
        bp = Math.max(-8, Math.min(8, bp));
        lp = Math.max(-8, Math.min(8, lp));
        const filtered = p.lpfCutoff >= 0.999 ? raw : lp;

        hpfCoeff *= (1 + p.hpfRamp * 0.0006);
        const clampedHp = Math.max(0.0001, Math.min(0.9, hpfCoeff));
        hpState += (filtered - hpState) * clampedHp;
        const hpOutFinal = p.hpfCutoff <= 0.001 ? filtered : filtered - hpState;

        phaserBuf[phaserPos] = hpOutFinal;
        const sweep = flangerBaseOffset + Math.sin(n * 0.0008 * (1 + p.flangerSweep * 4)) * flangerBaseOffset * p.flangerSweep;
        let delayIndex = phaserPos - Math.max(1, Math.round(sweep));
        while (delayIndex < 0) delayIndex += 1024;
        const delayed = phaserBuf[delayIndex % 1024];
        const phased = p.flangerOffset > 0 ? (hpOutFinal + delayed) * 0.5 : hpOutFinal;
        phaserPos = (phaserPos + 1) % 1024;

        out[n] = Math.max(-1, Math.min(1, phased * envVol * p.volume));

        idx++;
        sampleI++;
    }

    return out;
}

// ==========================================
// PRESET RANDOMIZERS
// ==========================================
function rand(min, max) { return min + Math.random() * (max - min); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

const PRESETS = {
    pickup() {
        const p = defaultParams();
        p.waveType = pick(['square', 'sine']);
        p.startFreq = rand(300, 900);
        p.attack = 0;
        p.sustain = rand(0.05, 0.15);
        p.punch = rand(0.2, 0.6);
        p.decay = rand(0.1, 0.3);
        p.arpeggioMult = rand(1.3, 2.2);
        p.arpeggioTime = rand(0.2, 0.5);
        p.volume = 0.6;
        return p;
    },
    laser() {
        const p = defaultParams();
        p.waveType = pick(['saw', 'square']);
        p.startFreq = rand(900, 2000);
        p.minFreq = rand(100, 300);
        p.slide = rand(-0.9, -0.4);
        p.attack = 0;
        p.sustain = rand(0.05, 0.2);
        p.decay = rand(0.1, 0.3);
        p.dutyCycle = rand(0.2, 0.6);
        p.volume = 0.5;
        return p;
    },
    explosion() {
        const p = defaultParams();
        p.waveType = 'noise';
        p.startFreq = rand(80, 200);
        p.attack = 0;
        p.sustain = rand(0.1, 0.3);
        p.decay = rand(0.4, 0.9);
        p.punch = rand(0.3, 0.8);
        p.lpfCutoff = rand(0.2, 0.5);
        p.lpfRamp = rand(-0.6, -0.2);
        p.repeatSpeed = Math.random() < 0.3 ? rand(0.3, 0.6) : 0;
        p.volume = 0.7;
        return p;
    },
    powerup() {
        const p = defaultParams();
        p.waveType = pick(['sine', 'square']);
        p.startFreq = rand(200, 500);
        p.slide = rand(0.2, 0.6);
        p.attack = rand(0.0, 0.1);
        p.sustain = rand(0.3, 0.6);
        p.decay = rand(0.2, 0.4);
        p.vibratoDepth = rand(0.1, 0.4);
        p.vibratoSpeed = rand(0.3, 0.7);
        p.volume = 0.5;
        return p;
    },
    hit() {
        const p = defaultParams();
        p.waveType = pick(['noise', 'square']);
        p.startFreq = rand(150, 500);
        p.attack = 0;
        p.sustain = rand(0.02, 0.08);
        p.decay = rand(0.08, 0.2);
        p.slide = rand(-0.4, -0.1);
        p.volume = 0.6;
        return p;
    },
    jump() {
        const p = defaultParams();
        p.waveType = pick(['square', 'sine']);
        p.startFreq = rand(250, 500);
        p.slide = rand(0.3, 0.7);
        p.attack = 0;
        p.sustain = rand(0.1, 0.2);
        p.decay = rand(0.1, 0.25);
        p.volume = 0.5;
        return p;
    },
    blip() {
        const p = defaultParams();
        p.waveType = 'square';
        p.startFreq = rand(400, 1200);
        p.attack = 0;
        p.sustain = rand(0.02, 0.06);
        p.decay = rand(0.02, 0.08);
        p.dutyCycle = rand(0.3, 0.7);
        p.volume = 0.45;
        return p;
    }
};

function fullyRandomParams() {
    const p = defaultParams();
    p.waveType = pick(['square', 'saw', 'sine', 'triangle', 'noise']);
    PARAM_GROUPS.forEach(group => group.fields.forEach(f => {
        p[f.key] = rand(f.min, f.max);
    }));
    p.volume = rand(0.3, 0.7);
    return p;
}

function mutateParams(base) {
    const p = { ...base };
    PARAM_GROUPS.forEach(group => group.fields.forEach(f => {
        if (Math.random() < 0.5) return;
        const range = f.max - f.min;
        const delta = (Math.random() * 2 - 1) * range * 0.15;
        p[f.key] = Math.max(f.min, Math.min(f.max, p[f.key] + delta));
    }));
    return p;
}

// ==========================================
// UI RENDERING
// ==========================================
const paramsStage = document.getElementById('paramsStage');
const waveCanvas = document.getElementById('waveCanvas');
const waveCtx = waveCanvas.getContext('2d');
const playBtn = document.getElementById('playBtn');
const randomizeBtn = document.getElementById('randomizeBtn');
const mutateBtn = document.getElementById('mutateBtn');
const exportBtn = document.getElementById('exportBtn');

const sliderEls = {};

function buildParamsUI() {
    paramsStage.innerHTML = '';
    PARAM_GROUPS.forEach(group => {
        const card = document.createElement('div');
        card.className = 'param-card';

        const heading = document.createElement('h3');
        heading.textContent = group.title;
        card.appendChild(heading);

        group.fields.forEach(field => {
            const row = document.createElement('div');
            row.className = 'slider-row';

            const label = document.createElement('div');
            label.className = 'slider-label';
            const valueSpan = document.createElement('span');
            valueSpan.textContent = params[field.key].toFixed(2);
            label.appendChild(document.createTextNode(field.label + ' '));
            label.appendChild(valueSpan);
            row.appendChild(label);

            const input = document.createElement('input');
            input.type = 'range';
            input.min = field.min;
            input.max = field.max;
            input.step = field.step;
            input.value = params[field.key];
            input.addEventListener('input', () => {
                params[field.key] = parseFloat(input.value);
                valueSpan.textContent = params[field.key].toFixed(2);
            });
            row.appendChild(input);

            sliderEls[field.key] = { input, valueSpan };
            card.appendChild(row);
        });

        paramsStage.appendChild(card);
    });
}

function refreshSliders() {
    PARAM_GROUPS.forEach(group => group.fields.forEach(field => {
        const el = sliderEls[field.key];
        if (!el) return;
        el.input.value = params[field.key];
        el.valueSpan.textContent = params[field.key].toFixed(2);
    }));
}

function setActiveWaveButton() {
    document.querySelectorAll('.wave-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.wave === params.waveType);
    });
}

document.querySelectorAll('.wave-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        params.waveType = btn.dataset.wave;
        setActiveWaveButton();
    });
});

document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        params = PRESETS[btn.dataset.preset]();
        refreshSliders();
        setActiveWaveButton();
        playSound();
    });
});

randomizeBtn.addEventListener('click', () => {
    params = fullyRandomParams();
    refreshSliders();
    setActiveWaveButton();
    playSound();
});

mutateBtn.addEventListener('click', () => {
    params = mutateParams(params);
    refreshSliders();
    setActiveWaveButton();
    playSound();
});

// ==========================================
// PLAYBACK & WAVEFORM PREVIEW
// ==========================================
let audioCtx = null;
function getAudioCtx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
}

function drawWaveform(samples) {
    const w = waveCanvas.width;
    const h = waveCanvas.height;
    waveCtx.clearRect(0, 0, w, h);
    waveCtx.strokeStyle = '#f59e0b';
    waveCtx.lineWidth = 1.5;
    waveCtx.beginPath();

    const step = Math.max(1, Math.floor(samples.length / w));
    for (let x = 0; x < w; x++) {
        const idx = x * step;
        const v = samples[idx] || 0;
        const y = h / 2 - v * (h / 2 - 4);
        if (x === 0) waveCtx.moveTo(x, y);
        else waveCtx.lineTo(x, y);
    }
    waveCtx.stroke();
}

function playSound() {
    const samples = generateSfx(params);
    drawWaveform(samples);

    const ctx = getAudioCtx();
    const buffer = ctx.createBuffer(1, samples.length, SAMPLE_RATE);
    buffer.copyToChannel(samples, 0);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start();
}

playBtn.addEventListener('click', playSound);

// ==========================================
// WAV EXPORT
// ==========================================
function encodeWav(samples, sampleRate) {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    function writeString(offset, str) {
        for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
    }

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, samples.length * 2, true);

    let offset = 44;
    for (let i = 0; i < samples.length; i++) {
        const s = Math.max(-1, Math.min(1, samples[i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
        offset += 2;
    }
    return buffer;
}

exportBtn.addEventListener('click', () => {
    const samples = generateSfx(params);
    const wavBuffer = encodeWav(samples, SAMPLE_RATE);
    const blob = new Blob([wavBuffer], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sfx_${params.waveType}_${Date.now()}.wav`;
    a.click();
});

// ==========================================
// INIT
// ==========================================
buildParamsUI();
setActiveWaveButton();
drawWaveform(new Float32Array(SAMPLE_RATE * 0.1));

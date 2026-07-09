// ==========================================
// STATE
// ==========================================
const RING_RADIUS = 118;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const PRESET_CYCLE = ['Focus', 'Short Break', 'Focus', 'Short Break', 'Focus', 'Short Break', 'Focus', 'Long Break'];

let totalSeconds = 25 * 60;
let remainingSeconds = totalSeconds;
let isRunning = false;
let tickHandle = null;
let currentLabel = 'Focus';
let cyclePosition = 0;
let sessionCount = 0;

const presetButtons = document.querySelectorAll('.preset-btn');
const customRange = document.getElementById('customRange');
const customValue = document.getElementById('customValue');
const autoStartCheck = document.getElementById('autoStartCheck');
const soundCheck = document.getElementById('soundCheck');
const tickCheck = document.getElementById('tickCheck');

const modeLabel = document.getElementById('modeLabel');
const timeDisplay = document.getElementById('timeDisplay');
const timeSub = document.getElementById('timeSub');
const ringProgress = document.getElementById('ringProgress');
const startPauseBtn = document.getElementById('startPauseBtn');
const resetBtn = document.getElementById('resetBtn');
const skipBtn = document.getElementById('skipBtn');
const sessionCountEl = document.getElementById('sessionCount');

ringProgress.style.strokeDasharray = RING_CIRCUMFERENCE;

// ==========================================
// AUDIO (WebAudio beeps, no external files)
// ==========================================
let audioCtx = null;
function getAudioCtx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
}

function beep(freq, durationMs, volume) {
    try {
        const ctx = getAudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.value = volume;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationMs / 1000);
        osc.stop(ctx.currentTime + durationMs / 1000);
    } catch (e) { /* audio unavailable */ }
}

function playCompletionSound() {
    if (!soundCheck.checked) return;
    beep(880, 180, 0.18);
    setTimeout(() => beep(1180, 220, 0.18), 200);
}

function playTickSound() {
    if (!tickCheck.checked) return;
    beep(440, 60, 0.06);
}

// ==========================================
// DISPLAY HELPERS
// ==========================================
function formatTime(totalSecs) {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function updateModeColor(label) {
    const isBreak = label.includes('Break');
    const color = isBreak ? 'var(--break-color)' : 'var(--focus-color)';
    document.documentElement.style.setProperty('--accent', isBreak ? '#10b981' : '#ef4444');
}

function render() {
    timeDisplay.textContent = formatTime(remainingSeconds);
    modeLabel.textContent = currentLabel;
    timeSub.textContent = isRunning ? 'Running' : (remainingSeconds === totalSeconds ? 'Ready' : 'Paused');

    const progress = totalSeconds > 0 ? (totalSeconds - remainingSeconds) / totalSeconds : 0;
    ringProgress.style.strokeDashoffset = RING_CIRCUMFERENCE * (1 - progress);

    document.title = isRunning ? `${formatTime(remainingSeconds)} - ${currentLabel}` : 'Pomodoro Timer';
}

// ==========================================
// PRESET / CUSTOM SELECTION
// ==========================================
function setDuration(minutes, label, resetRunning = true) {
    if (resetRunning) stopTimer();
    totalSeconds = Math.max(1, Math.round(minutes * 60));
    remainingSeconds = totalSeconds;
    currentLabel = label;
    updateModeColor(label);

    presetButtons.forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.minutes, 10) === minutes && btn.dataset.label === label);
    });
    customRange.value = minutes <= 120 ? minutes : customRange.value;
    customValue.textContent = customRange.value;

    startPauseBtn.textContent = 'Start';
    startPauseBtn.classList.remove('is-running');
    render();
}

presetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const minutes = parseInt(btn.dataset.minutes, 10);
        const label = btn.dataset.label;
        cyclePosition = PRESET_CYCLE.indexOf(label) >= 0 ? PRESET_CYCLE.indexOf(label) : 0;
        setDuration(minutes, label);
    });
});

customRange.addEventListener('input', () => {
    customValue.textContent = customRange.value;
});

customRange.addEventListener('change', () => {
    presetButtons.forEach(btn => btn.classList.remove('active'));
    setDuration(parseInt(customRange.value, 10), 'Custom');
});

// ==========================================
// TRANSPORT CONTROLS
// ==========================================
function startTimer() {
    if (isRunning) return;
    isRunning = true;
    startPauseBtn.textContent = 'Pause';
    startPauseBtn.classList.add('is-running');

    let lastTick = Date.now();
    tickHandle = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.round((now - lastTick) / 1000);
        if (elapsed >= 1) {
            lastTick = now;
            remainingSeconds = Math.max(0, remainingSeconds - elapsed);
            if (remainingSeconds <= 10 && remainingSeconds > 0) playTickSound();
            render();
            if (remainingSeconds <= 0) {
                completeSession();
            }
        }
    }, 250);

    render();
}

function stopTimer() {
    isRunning = false;
    if (tickHandle) {
        clearInterval(tickHandle);
        tickHandle = null;
    }
    startPauseBtn.textContent = 'Start';
    startPauseBtn.classList.remove('is-running');
}

function completeSession() {
    stopTimer();
    playCompletionSound();

    if (currentLabel === 'Focus' || currentLabel === 'Deep Work') {
        sessionCount++;
        sessionCountEl.textContent = sessionCount;
    }

    render();

    if (autoStartCheck.checked) {
        advanceCycle();
    }
}

function advanceCycle() {
    cyclePosition = (cyclePosition + 1) % PRESET_CYCLE.length;
    const nextLabel = PRESET_CYCLE[cyclePosition];
    const minutesMap = { 'Focus': 25, 'Short Break': 5, 'Long Break': 15 };
    setDuration(minutesMap[nextLabel], nextLabel, false);
    startTimer();
}

startPauseBtn.addEventListener('click', () => {
    if (isRunning) {
        stopTimer();
        render();
    } else {
        if (remainingSeconds <= 0) remainingSeconds = totalSeconds;
        startTimer();
    }
});

resetBtn.addEventListener('click', () => {
    stopTimer();
    remainingSeconds = totalSeconds;
    render();
});

skipBtn.addEventListener('click', () => {
    stopTimer();
    completeSession();
});

// ==========================================
// KEYBOARD SHORTCUT
// ==========================================
document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;
    if (e.code === 'Space') {
        e.preventDefault();
        startPauseBtn.click();
    }
});

// ==========================================
// INIT
// ==========================================
updateModeColor(currentLabel);
render();

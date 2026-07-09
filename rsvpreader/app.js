// ==========================================
// STATE
// ==========================================
let chunks = [];       // Array of chunk strings (1 or 2 words joined by a space)
let chunkSize = 1;
let wpm = 300;
let pauseOnPunctuation = true;
let currentIndex = 0;  // Index into chunks, points at the NEXT chunk to show
let isPlaying = false;
let playTimeoutId = null;

const textInput = document.getElementById('textInput');
const loadBtn = document.getElementById('loadBtn');
const pasteBtn = document.getElementById('pasteBtn');
const modeButtons = document.querySelectorAll('.mode-btn');
const speedRange = document.getElementById('speedRange');
const speedValue = document.getElementById('speedValue');
const wpmPill = document.getElementById('wpmPill');
const punctuationPauseCheck = document.getElementById('punctuationPauseCheck');
const totalWordsText = document.getElementById('totalWordsText');
const estTimeText = document.getElementById('estTimeText');

const wordDisplay = document.getElementById('wordDisplay');
const progressRange = document.getElementById('progressRange');
const progressLabel = document.getElementById('progressLabel');
const progressTime = document.getElementById('progressTime');
const playPauseBtn = document.getElementById('playPauseBtn');
const backBtn = document.getElementById('backBtn');
const forwardBtn = document.getElementById('forwardBtn');
const restartBtn = document.getElementById('restartBtn');

// ==========================================
// TOKENIZING / CHUNKING
// ==========================================
function tokenize(rawText) {
    return rawText.trim().split(/\s+/).filter(w => w.length > 0);
}

function buildChunks(words, size) {
    const result = [];
    for (let i = 0; i < words.length; i += size) {
        result.push(words.slice(i, i + size).join(' '));
    }
    return result;
}

function estimateSecondsRemaining(fromIndex) {
    // Approximate: each chunk takes (60/wpm * wordsInChunk) seconds, plus punctuation pauses
    let seconds = 0;
    for (let i = fromIndex; i < chunks.length; i++) {
        seconds += delayForChunkMs(chunks[i]) / 1000;
    }
    return seconds;
}

function formatClock(totalSecs) {
    const s = Math.max(0, Math.round(totalSecs));
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
}

// ==========================================
// LOAD TEXT
// ==========================================
function loadText() {
    const words = tokenize(textInput.value);
    chunks = buildChunks(words, chunkSize);
    currentIndex = 0;
    stopPlayback();

    totalWordsText.textContent = words.length;
    progressRange.max = Math.max(0, chunks.length - 1);
    progressRange.value = 0;

    updateEstimatedTime();
    renderProgress();

    if (chunks.length > 0) {
        renderChunk(chunks[0]);
    } else {
        showPlaceholder('Load text to begin');
    }
}

loadBtn.addEventListener('click', loadText);

pasteBtn.addEventListener('click', async () => {
    try {
        const text = await navigator.clipboard.readText();
        if (text) {
            textInput.value = text;
            loadText();
        }
    } catch (e) {
        textInput.focus();
        alert('Clipboard access was blocked. Press Ctrl+V in the text box instead.');
    }
});

// ==========================================
// CHUNK SIZE TOGGLE
// ==========================================
modeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        modeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        chunkSize = parseInt(btn.dataset.chunk, 10);

        // Rebuild chunks from the original text, preserving relative reading position
        const words = tokenize(textInput.value);
        if (words.length === 0) return;

        const progressRatio = chunks.length > 0 ? currentIndex / chunks.length : 0;
        chunks = buildChunks(words, chunkSize);
        currentIndex = Math.min(chunks.length - 1, Math.floor(progressRatio * chunks.length));
        if (currentIndex < 0) currentIndex = 0;

        progressRange.max = Math.max(0, chunks.length - 1);
        updateEstimatedTime();
        renderProgress();
        if (chunks.length > 0) renderChunk(chunks[currentIndex]);
    });
});

// ==========================================
// SPEED CONTROL (live - read fresh each tick, no restart needed)
// ==========================================
speedRange.addEventListener('input', () => {
    wpm = parseInt(speedRange.value, 10);
    speedValue.textContent = wpm;
    wpmPill.textContent = wpm;
    updateEstimatedTime();
});

punctuationPauseCheck.addEventListener('change', () => {
    pauseOnPunctuation = punctuationPauseCheck.checked;
    updateEstimatedTime();
});

function updateEstimatedTime() {
    const remaining = estimateSecondsRemaining(currentIndex);
    const total = estimateSecondsRemaining(0);
    estTimeText.textContent = formatClock(total);
    progressTime.textContent = `${formatClock(total - remaining)} / ${formatClock(total)}`;
}

// ==========================================
// ORP (Optimal Recognition Point) WORD RENDERING
// ==========================================
function pivotIndexFor(word) {
    // Roughly a third of the way in, biased by word length (classic RSVP heuristic)
    const len = word.length;
    if (len <= 1) return 0;
    if (len <= 5) return 1;
    return Math.min(len - 1, Math.round(len * 0.35));
}

function renderChunk(chunkText) {
    // Single word: use the ORP reading heuristic. Multi-word chunk: center the
    // whole chunk on the guide line instead, so it doesn't overflow to one side.
    const isMultiWord = chunkText.indexOf(' ') !== -1;
    const pIdx = isMultiWord ? Math.floor(chunkText.length / 2) : pivotIndexFor(chunkText);

    const before = chunkText.slice(0, pIdx);
    const pivotChar = chunkText.slice(pIdx, pIdx + 1) || ' ';
    const after = chunkText.slice(pIdx + 1);

    wordDisplay.classList.remove('placeholder');
    wordDisplay.innerHTML = '';

    const beforeSpan = document.createElement('span');
    beforeSpan.className = 'word-before';
    beforeSpan.textContent = before;

    const pivotSpan = document.createElement('span');
    pivotSpan.className = 'word-pivot';
    pivotSpan.textContent = pivotChar;

    const afterSpan = document.createElement('span');
    afterSpan.className = 'word-after';
    afterSpan.textContent = after;

    wordDisplay.appendChild(beforeSpan);
    wordDisplay.appendChild(pivotSpan);
    wordDisplay.appendChild(afterSpan);
}

function showPlaceholder(message) {
    wordDisplay.classList.add('placeholder');
    wordDisplay.textContent = message;
}

function renderProgress() {
    const total = chunks.length;
    progressLabel.textContent = `${total > 0 ? currentIndex + 1 : 0} / ${total}`;
    progressRange.value = currentIndex;
    updateEstimatedTime();
}

// ==========================================
// PLAYBACK ENGINE (setTimeout loop so speed changes apply on the very next chunk)
// ==========================================
function delayForChunkMs(chunkText) {
    const wordCount = chunkText.split(' ').length;
    const msPerWord = 60000 / Math.max(60, wpm);
    let delay = msPerWord * wordCount;

    if (pauseOnPunctuation && /[.,;:!?]$/.test(chunkText)) {
        const isSentenceEnd = /[.!?]$/.test(chunkText);
        delay *= isSentenceEnd ? 1.9 : 1.4;
    }
    return delay;
}

function scheduleNext() {
    if (!isPlaying) return;

    if (currentIndex >= chunks.length) {
        stopPlayback();
        return;
    }

    renderChunk(chunks[currentIndex]);
    renderProgress();

    const delay = delayForChunkMs(chunks[currentIndex]);
    currentIndex++;

    playTimeoutId = setTimeout(scheduleNext, delay);
}

function startPlayback() {
    if (chunks.length === 0) return;
    if (currentIndex >= chunks.length) currentIndex = 0;

    isPlaying = true;
    playPauseBtn.textContent = 'Pause';
    playPauseBtn.classList.add('is-playing');
    scheduleNext();
}

function stopPlayback() {
    isPlaying = false;
    if (playTimeoutId) {
        clearTimeout(playTimeoutId);
        playTimeoutId = null;
    }
    playPauseBtn.textContent = 'Play';
    playPauseBtn.classList.remove('is-playing');
}

playPauseBtn.addEventListener('click', () => {
    if (isPlaying) {
        stopPlayback();
    } else {
        startPlayback();
    }
});

restartBtn.addEventListener('click', () => {
    stopPlayback();
    currentIndex = 0;
    renderProgress();
    if (chunks.length > 0) renderChunk(chunks[0]);
});

backBtn.addEventListener('click', () => {
    stopPlayback();
    currentIndex = Math.max(0, currentIndex - 1);
    renderProgress();
    if (chunks.length > 0) renderChunk(chunks[currentIndex]);
});

forwardBtn.addEventListener('click', () => {
    stopPlayback();
    currentIndex = Math.min(Math.max(0, chunks.length - 1), currentIndex + 1);
    renderProgress();
    if (chunks.length > 0) renderChunk(chunks[currentIndex]);
});

progressRange.addEventListener('input', () => {
    stopPlayback();
    currentIndex = parseInt(progressRange.value, 10);
    renderProgress();
    if (chunks.length > 0) renderChunk(chunks[currentIndex]);
});

// ==========================================
// KEYBOARD SHORTCUTS
// ==========================================
document.addEventListener('keydown', (e) => {
    if (document.activeElement === textInput) return;

    if (e.code === 'Space') {
        e.preventDefault();
        playPauseBtn.click();
    } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        backBtn.click();
    } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        forwardBtn.click();
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        speedRange.value = Math.min(900, wpm + 25);
        speedRange.dispatchEvent(new Event('input'));
    } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        speedRange.value = Math.max(60, wpm - 25);
        speedRange.dispatchEvent(new Event('input'));
    }
});

// ==========================================
// INIT
// ==========================================
speedValue.textContent = wpm;
wpmPill.textContent = wpm;
showPlaceholder('Load text to begin');

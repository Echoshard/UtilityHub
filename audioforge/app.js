// ==========================================
// STATE VARIABLES
// ==========================================
let audioCtx = null;
let audioBuffer = null; // Decoded main AudioBuffer
let audioSourceNode = null;
let gainNode = null;

// Playback track variables
let isPlaying = false;
let startTime = 0; // Performance timestamp when playback started
let playOffset = 0; // Elapsed seconds offset where player is
let loopPlayback = false;
let animationFrameId = null;

// Editing select variables
let selectionStart = 0; // Seconds
let selectionEnd = 0; // Seconds
let currentZoom = 1.0; // Seconds per width pixel count (base scale)
let isSelecting = false;

// Element References
const audioLoader = document.getElementById('audioLoader');
const audioInfoText = document.getElementById('audioInfoText');

const waveCanvas = document.getElementById('waveCanvas');
const waveCtx = waveCanvas.getContext('2d');
const waveBoard = document.getElementById('waveBoard');
const selectionOverlay = document.getElementById('selectionOverlay');
const playCursor = document.getElementById('playCursor');

const selectStartText = document.getElementById('selectStartText');
const selectEndText = document.getElementById('selectEndText');
const totalDurationText = document.getElementById('totalDurationText');

const currentTimeText = document.getElementById('currentTimeText');
const maxTimeText = document.getElementById('maxTimeText');
const progressTrack = document.getElementById('progressTrack');
const progressFill = document.getElementById('progressFill');

const playBtn = document.getElementById('playBtn');
const pauseBtn = document.getElementById('pauseBtn');
const stopBtn = document.getElementById('stopBtn');
const loopCheck = document.getElementById('loopCheck');

const zoomInBtn = document.getElementById('zoomInBtn');
const zoomOutBtn = document.getElementById('zoomOutBtn');
const downloadWavBtn = document.getElementById('downloadWavBtn');

const btnTrim = document.getElementById('btn-trim');
const btnDelete = document.getElementById('btn-delete');
const btnSilence = document.getElementById('btn-silence');
const btnFadein = document.getElementById('btn-fadein');
const btnFadeout = document.getElementById('btn-fadeout');
const gainSlider = document.getElementById('gainSlider');
const gainVal = document.getElementById('gainVal');
const btnAmplify = document.getElementById('btn-amplify');

// ==========================================
// AUDIO CONTEXT & DECODER LOADER
// ==========================================
function initAudioCtx() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        gainNode = audioCtx.createGain();
        gainNode.connect(audioCtx.destination);
    }
}

audioLoader.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    initAudioCtx();
    audioInfoText.textContent = `Reading ${file.name}...`;
    disableAllControls();
    stopAudio();

    const reader = new FileReader();
    reader.onload = (evt) => {
        audioCtx.decodeAudioData(evt.target.result)
            .then(decodedBuffer => {
                audioBuffer = decodedBuffer;
                audioInfoText.textContent = `${file.name} | ${decodedBuffer.sampleRate}Hz | ${decodedBuffer.numberOfChannels}ch | ${decodedBuffer.duration.toFixed(2)}s`;
                
                // Initialize default zoom
                currentZoom = waveCanvas.width / decodedBuffer.duration;
                selectionStart = 0;
                selectionEnd = 0;
                playOffset = 0;
                
                enableAllControls();
                renderWaveform();
                updateSelectionUI();
                updateProgressUI();
            })
            .catch(err => {
                console.error("Decode error:", err);
                audioInfoText.textContent = "Error decoding audio file.";
            });
    };
    reader.readAsArrayBuffer(file);
});

// ==========================================
// ENABLE/DISABLE UI
// ==========================================
function enableAllControls() {
    [playBtn, pauseBtn, stopBtn, zoomInBtn, zoomOutBtn, downloadWavBtn,
     btnTrim, btnDelete, btnSilence, btnFadein, btnFadeout, gainSlider, btnAmplify].forEach(el => {
        el.disabled = false;
    });
}

function disableAllControls() {
    [playBtn, pauseBtn, stopBtn, zoomInBtn, zoomOutBtn, downloadWavBtn,
     btnTrim, btnDelete, btnSilence, btnFadein, btnFadeout, gainSlider, btnAmplify].forEach(el => {
        el.disabled = true;
    });
}

// ==========================================
// WAVEFORM DRAWING VISUALIZER
// ==========================================
function renderWaveform() {
    if (!audioBuffer) return;
    
    // Clear and match canvas scaling
    waveCtx.clearRect(0, 0, waveCanvas.width, waveCanvas.height);
    
    const width = waveCanvas.width;
    const height = waveCanvas.height;
    const midY = height / 2;
    
    // We average/peak channels
    const leftData = audioBuffer.getChannelData(0);
    const rightData = audioBuffer.numberOfChannels > 1 ? audioBuffer.getChannelData(1) : leftData;
    
    const duration = audioBuffer.duration;
    const totalSamples = leftData.length;
    
    // Determine bounds based on zoom
    const zoomWidth = duration * currentZoom;
    
    // Draw background grid meshes
    waveCtx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    waveCtx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
        waveCtx.beginPath();
        waveCtx.moveTo(x, 0);
        waveCtx.lineTo(x, height);
        waveCtx.stroke();
    }
    
    // Draw sound amplitude wave peaks
    waveCtx.strokeStyle = '#06b6d4'; // Cyan wave
    waveCtx.lineWidth = 1.5;
    waveCtx.beginPath();
    
    const step = Math.max(1, Math.floor(totalSamples / width));
    
    for (let i = 0; i < width; i++) {
        const startSampleIndex = Math.floor((i / zoomWidth) * totalSamples);
        if (startSampleIndex >= totalSamples) break;
        
        let min = 1.0;
        let max = -1.0;
        
        for (let j = 0; j < step; j++) {
            const idx = startSampleIndex + j;
            if (idx >= totalSamples) break;
            
            const val = (leftData[idx] + rightData[idx]) / 2;
            if (val < min) min = val;
            if (val > max) max = val;
        }
        
        const drawMinY = midY + min * midY;
        const drawMaxY = midY + max * midY;
        
        waveCtx.moveTo(i, drawMinY);
        waveCtx.lineTo(i, drawMaxY);
    }
    waveCtx.stroke();
}

// ==========================================
// DRAG-SELECTION EVENT HANDLERS
// ==========================================
function getOffsetSeconds(clientX) {
    const rect = waveCanvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = x / rect.width;
    return pct * audioBuffer.duration;
}

waveCanvas.addEventListener('mousedown', (e) => {
    if (!audioBuffer) return;
    isSelecting = true;
    const startSec = getOffsetSeconds(e.clientX);
    selectionStart = Math.max(0, Math.min(audioBuffer.duration, startSec));
    selectionEnd = selectionStart;
    
    // Position playhead here
    playOffset = selectionStart;
    updateSelectionUI();
    updateProgressUI();
});

waveCanvas.addEventListener('mousemove', (e) => {
    if (!audioBuffer || !isSelecting) return;
    const currentSec = getOffsetSeconds(e.clientX);
    selectionEnd = Math.max(0, Math.min(audioBuffer.duration, currentSec));
    
    updateSelectionUI();
});

window.addEventListener('mouseup', () => {
    if (isSelecting) {
        isSelecting = false;
        
        // Normalize selection bounds (so start <= end)
        if (selectionStart > selectionEnd) {
            const temp = selectionStart;
            selectionStart = selectionEnd;
            selectionEnd = temp;
        }
        updateSelectionUI();
    }
});

function updateSelectionUI() {
    if (!audioBuffer) return;
    
    const duration = audioBuffer.duration;
    const selectWidth = Math.abs(selectionEnd - selectionStart);
    
    // Draw highlights
    const leftPct = (Math.min(selectionStart, selectionEnd) / duration) * 100;
    const widthPct = (selectWidth / duration) * 100;
    
    selectionOverlay.style.left = `${leftPct}%`;
    selectionOverlay.style.width = `${widthPct}%`;
    
    selectStartText.textContent = `${Math.min(selectionStart, selectionEnd).toFixed(2)}s`;
    selectEndText.textContent = `${Math.max(selectionStart, selectionEnd).toFixed(2)}s`;
    totalDurationText.textContent = `${selectWidth.toFixed(2)}s`;
}

// ==========================================
// PLAYBACK ENGINE
// ==========================================
function updatePlaybackFrame() {
    if (!isPlaying || !audioBuffer) return;
    
    const now = audioCtx.currentTime;
    const elapsed = now - startTime;
    const currentPos = playOffset + elapsed;
    
    if (currentPos >= audioBuffer.duration) {
        if (loopPlayback) {
            playAudio(0); // Restart from beginning
        } else {
            stopAudio();
        }
        return;
    }
    
    // Update play cursor overlay position
    const pct = (currentPos / audioBuffer.duration) * 100;
    playCursor.style.left = `${pct}%`;
    currentTimeText.textContent = formatTime(currentPos);
    progressFill.style.width = `${pct}%`;
    
    animationFrameId = requestAnimationFrame(updatePlaybackFrame);
}

function playAudio(offsetSecs = null) {
    if (!audioBuffer) return;
    
    initAudioCtx();
    if (isPlaying) stopAudio();
    
    isPlaying = true;
    const startFrom = offsetSecs !== null ? offsetSecs : playOffset;
    playOffset = startFrom;
    
    audioSourceNode = audioCtx.createBufferSource();
    audioSourceNode.buffer = audioBuffer;
    audioSourceNode.connect(gainNode);
    
    // Play range or full
    audioSourceNode.start(0, startFrom);
    startTime = audioCtx.currentTime;
    
    playBtn.textContent = 'Pause';
    animationFrameId = requestAnimationFrame(updatePlaybackFrame);
}

function pauseAudio() {
    if (!isPlaying) return;
    
    // Save current elapsed offset
    const elapsed = audioCtx.currentTime - startTime;
    playOffset += elapsed;
    if (playOffset >= audioBuffer.duration) playOffset = 0;
    
    isPlaying = false;
    if (audioSourceNode) {
        audioSourceNode.stop();
        audioSourceNode.disconnect();
    }
    
    playBtn.textContent = 'Play';
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
}

function stopAudio() {
    isPlaying = false;
    playOffset = 0;
    
    if (audioSourceNode) {
        try { audioSourceNode.stop(); } catch (e) { }
        audioSourceNode.disconnect();
        audioSourceNode = null;
    }
    
    playBtn.textContent = 'Play';
    playCursor.style.left = '0%';
    progressFill.style.width = '0%';
    currentTimeText.textContent = '0:00';
    
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
}

playBtn.addEventListener('click', () => {
    if (isPlaying) {
        pauseAudio();
    } else {
        playAudio();
    }
});

pauseBtn.addEventListener('click', pauseAudio);
stopBtn.addEventListener('click', stopAudio);

loopCheck.addEventListener('change', (e) => {
    loopPlayback = e.target.checked;
});

// Click track timeline jumps
progressTrack.addEventListener('mousedown', (e) => {
    if (!audioBuffer) return;
    const rect = progressTrack.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = x / rect.width;
    const jumpSecs = pct * audioBuffer.duration;
    
    playOffset = jumpSecs;
    updateProgressUI();
    
    if (isPlaying) {
        playAudio(jumpSecs);
    }
});

function updateProgressUI() {
    if (!audioBuffer) return;
    const pct = (playOffset / audioBuffer.duration) * 100;
    playCursor.style.left = `${pct}%`;
    progressFill.style.width = `${pct}%`;
    currentTimeText.textContent = formatTime(playOffset);
    maxTimeText.textContent = formatTime(audioBuffer.duration);
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ==========================================
// AUDIO DESTRUCTIVE EDITING ENGINE
// ==========================================
function replaceAudioBuffer(newBuffer) {
    saveEditState();
    audioBuffer = newBuffer;
    
    selectionStart = 0;
    selectionEnd = 0;
    playOffset = 0;
    
    audioInfoText.textContent = `Modified | ${newBuffer.sampleRate}Hz | ${newBuffer.numberOfChannels}ch | ${newBuffer.duration.toFixed(2)}s`;
    
    stopAudio();
    renderWaveform();
    updateSelectionUI();
    updateProgressUI();
}

// History stack for Audio Forge edits (saves memory by caching only up to 5 steps of float channels)
let editHistoryStack = [];
function saveEditState() {
    if (!audioBuffer) return;
    // Clone channels
    const channels = [];
    for (let c = 0; c < audioBuffer.numberOfChannels; c++) {
        channels.push(new Float32Array(audioBuffer.getChannelData(c)));
    }
    editHistoryStack.push({
        channels: channels,
        sampleRate: audioBuffer.sampleRate,
        numberOfChannels: audioBuffer.numberOfChannels
    });
    if (editHistoryStack.length > 5) editHistoryStack.shift();
}

// Trim / Crop selection (keeps only highlighted range)
btnTrim.addEventListener('click', () => {
    if (!audioBuffer || selectionStart === selectionEnd) return;
    
    const startRate = audioBuffer.sampleRate;
    const offsetStart = Math.floor(selectionStart * startRate);
    const offsetEnd = Math.floor(selectionEnd * startRate);
    const length = offsetEnd - offsetStart;
    
    if (length <= 0) return;
    
    const newBuf = audioCtx.createBuffer(audioBuffer.numberOfChannels, length, startRate);
    for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
        const data = audioBuffer.getChannelData(ch).subarray(offsetStart, offsetEnd);
        newBuf.copyToChannel(data, ch);
    }
    
    replaceAudioBuffer(newBuf);
});

// Delete Selection (cuts segment and joins ends)
btnDelete.addEventListener('click', () => {
    if (!audioBuffer || selectionStart === selectionEnd) return;
    
    const rate = audioBuffer.sampleRate;
    const cutStart = Math.floor(selectionStart * rate);
    const cutEnd = Math.floor(selectionEnd * rate);
    const length = audioBuffer.length - (cutEnd - cutStart);
    
    if (length <= 0) {
        replaceAudioBuffer(audioCtx.createBuffer(audioBuffer.numberOfChannels, rate, rate)); // 1s empty
        return;
    }
    
    const newBuf = audioCtx.createBuffer(audioBuffer.numberOfChannels, length, rate);
    for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
        const chData = audioBuffer.getChannelData(ch);
        const newChData = new Float32Array(length);
        
        // Copy before cut
        newChData.set(chData.subarray(0, cutStart), 0);
        // Copy after cut
        newChData.set(chData.subarray(cutEnd), cutStart);
        
        newBuf.copyToChannel(newChData, ch);
    }
    
    replaceAudioBuffer(newBuf);
});

// Insert 1s silence at current selection start
btnSilence.addEventListener('click', () => {
    if (!audioBuffer) return;
    
    const rate = audioBuffer.sampleRate;
    const insertOffset = Math.floor(selectionStart * rate);
    const silenceLength = rate; // 1 second
    const length = audioBuffer.length + silenceLength;
    
    const newBuf = audioCtx.createBuffer(audioBuffer.numberOfChannels, length, rate);
    for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
        const chData = audioBuffer.getChannelData(ch);
        const newChData = new Float32Array(length);
        
        // Before insert
        newChData.set(chData.subarray(0, insertOffset), 0);
        // Silence remains zero
        // After insert
        newChData.set(chData.subarray(insertOffset), insertOffset + silenceLength);
        
        newBuf.copyToChannel(newChData, ch);
    }
    
    replaceAudioBuffer(newBuf);
});

// Fade In effect
btnFadein.addEventListener('click', () => {
    if (!audioBuffer || selectionStart === selectionEnd) return;
    
    saveEditState();
    const rate = audioBuffer.sampleRate;
    const fadeStart = Math.floor(selectionStart * rate);
    const fadeEnd = Math.floor(selectionEnd * rate);
    const length = fadeEnd - fadeStart;
    
    for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
        const data = audioBuffer.getChannelData(ch);
        for (let i = 0; i < length; i++) {
            const idx = fadeStart + i;
            const factor = i / length; // Linear ramp 0 -> 1
            data[idx] *= factor;
        }
    }
    renderWaveform();
});

// Fade Out effect
btnFadeout.addEventListener('click', () => {
    if (!audioBuffer || selectionStart === selectionEnd) return;
    
    saveEditState();
    const rate = audioBuffer.sampleRate;
    const fadeStart = Math.floor(selectionStart * rate);
    const fadeEnd = Math.floor(selectionEnd * rate);
    const length = fadeEnd - fadeStart;
    
    for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
        const data = audioBuffer.getChannelData(ch);
        for (let i = 0; i < length; i++) {
            const idx = fadeStart + i;
            const factor = 1.0 - (i / length); // Linear ramp 1 -> 0
            data[idx] *= factor;
        }
    }
    renderWaveform();
});

// Gain amplification controls
gainSlider.addEventListener('input', (e) => {
    gainVal.textContent = `${parseFloat(e.target.value).toFixed(1)}x`;
});

btnAmplify.addEventListener('click', () => {
    if (!audioBuffer || selectionStart === selectionEnd) return;
    
    saveEditState();
    const multiplier = parseFloat(gainSlider.value);
    const rate = audioBuffer.sampleRate;
    const startIdx = Math.floor(selectionStart * rate);
    const endIdx = Math.floor(selectionEnd * rate);
    
    for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
        const data = audioBuffer.getChannelData(ch);
        for (let i = startIdx; i < endIdx; i++) {
            data[i] = Math.max(-1.0, Math.min(1.0, data[i] * multiplier));
        }
    }
    renderWaveform();
});

// Zoom triggers
zoomInBtn.addEventListener('click', () => {
    currentZoom *= 1.4;
    renderWaveform();
});

zoomOutBtn.addEventListener('click', () => {
    currentZoom /= 1.4;
    renderWaveform();
});

// ==========================================
// WAV DIRECT BINARY EXPORT WRITER
// ==========================================
function bufferToWav(buffer) {
    const numOfChan = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    
    let result;
    if (numOfChan === 2) {
        result = interleave(buffer.getChannelData(0), buffer.getChannelData(1));
    } else {
        result = buffer.getChannelData(0);
    }
    
    const bufferLen = result.length * 2;
    const wavBuffer = new ArrayBuffer(44 + bufferLen);
    const view = new DataView(wavBuffer);
    
    /* RIFF identifier */
    writeString(view, 0, 'RIFF');
    /* file length */
    view.setUint32(4, 36 + bufferLen, true);
    /* RIFF type */
    writeString(view, 8, 'WAVE');
    /* format chunk identifier */
    writeString(view, 12, 'fmt ');
    /* format chunk length */
    view.setUint32(16, 16, true);
    /* sample format (raw) */
    view.setUint16(20, format, true);
    /* channel count */
    view.setUint16(22, numOfChan, true);
    /* sample rate */
    view.setUint32(24, sampleRate, true);
    /* byte rate */
    view.setUint32(28, sampleRate * numOfChan * (bitDepth / 8), true);
    /* block align */
    view.setUint16(32, numOfChan * (bitDepth / 8), true);
    /* bits per sample */
    view.setUint16(34, bitDepth, true);
    /* data chunk identifier */
    writeString(view, 36, 'data');
    /* data chunk length */
    view.setUint32(40, bufferLen, true);
    
    // Write audio PCM data
    floatTo16BitPCM(view, 44, result);
    
    return new Blob([view], { type: 'audio/wav' });
}

function interleave(inputL, inputR) {
    const length = inputL.length + inputR.length;
    const result = new Float32Array(length);
    let index = 0;
    let inputIndex = 0;
    while (index < length) {
        result[index++] = inputL[inputIndex];
        result[index++] = inputR[inputIndex];
        inputIndex++;
    }
    return result;
}

function floatTo16BitPCM(output, offset, input) {
    for (let i = 0; i < input.length; i++, offset += 2) {
        let s = Math.max(-1, Math.min(1, input[i]));
        output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
}

function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

downloadWavBtn.addEventListener('click', () => {
    if (!audioBuffer) return;
    const blob = bufferToWav(audioBuffer);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audioforge_edited_${Date.now()}.wav`;
    a.click();
    
    // Release memory
    setTimeout(() => URL.revokeObjectURL(url), 1000);
});

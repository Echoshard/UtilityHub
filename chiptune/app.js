(() => {
    // Notes mappings
    const MELODY_NOTES = [
        'C5', 'B4', 'A#4', 'A4', 'G#4', 'G4', 'F#4', 'F4', 'E4', 'D#4', 'D4', 'C#4', 'C4'
    ];
    const BASS_NOTES = [
        'C3', 'B2', 'A#2', 'A2', 'G#2', 'G2', 'F#2', 'F2', 'E2', 'D#2', 'D2', 'C#2', 'C2'
    ];
    const PERCUSSION_ROWS = [
        'Snare (Noise)', 'Hi-Hat (Click)', 'Kick (Thump)'
    ];

    // Note frequency calculator
    const NOTE_FREQS = {
        'C5': 523.25, 'B4': 493.88, 'A#4': 466.16, 'A4': 440.00, 'G#4': 415.30, 'G4': 392.00, 'F#4': 369.99, 'F4': 349.23, 'E4': 329.63, 'D#4': 311.13, 'D4': 293.66, 'C#4': 277.18, 'C4': 261.63,
        'C3': 130.81, 'B2': 123.47, 'A#2': 116.54, 'A2': 110.00, 'G#2': 103.83, 'G2': 98.00, 'F#2': 92.50, 'F2': 87.31, 'E2': 82.41, 'D#2': 77.78, 'D2': 73.42, 'C#2': 69.30, 'C2': 65.41
    };

    // App state
    const state = {
        activeChannel: 'melody', // 'melody' | 'lead' | 'bass' | 'percussion'
        bpm: 120,
        stepsCount: 16,
        isPlaying: false,
        masterVolume: 0.7,
        
        // Sequencer grid states: row index maps to notes array, col index maps to steps
        grids: {
            melody: Array.from({ length: 13 }, () => Array(16).fill(0)),
            lead: Array.from({ length: 13 }, () => Array(16).fill(0)),
            bass: Array.from({ length: 13 }, () => Array(16).fill(0)),
            percussion: Array.from({ length: 3 }, () => Array(16).fill(0))
        },
        
        // ADSR Envelopes per channel
        envelopes: {
            melody: { attack: 0.05, decay: 0.1, sustain: 0.6, release: 0.15 },
            lead: { attack: 0.02, decay: 0.08, sustain: 0.5, release: 0.2 },
            bass: { attack: 0.08, decay: 0.15, sustain: 0.7, release: 0.25 },
            percussion: { attack: 0.005, decay: 0.05, sustain: 0.1, release: 0.08 }
        }
    };

    // Web Audio vars
    let audioCtx = null;
    let masterGain = null;
    let noiseBuffer = null;
    
    // Scheduler vars
    let currentStep = 0;
    let nextNoteTime = 0.0;
    let schedulerTimerId = null;
    const lookahead = 25.0; // ms
    const scheduleAheadTime = 0.1; // seconds
    let stepTimes = []; // Tracks schedule times for visual cursor

    // DOM Elements
    const elements = {
        sequencerGrid: document.getElementById('sequencerGrid'),
        stepLabelsContainer: document.getElementById('stepLabelsContainer'),
        playBtn: document.getElementById('playBtn'),
        stopBtn: document.getElementById('stopBtn'),
        bpmSlider: document.getElementById('bpmSlider'),
        bpmVal: document.getElementById('bpmVal'),
        stepsSelect: document.getElementById('stepsSelect'),
        clearBtn: document.getElementById('clearBtn'),
        saveJsonBtn: document.getElementById('saveJsonBtn'),
        loadJsonInput: document.getElementById('loadJsonInput'),
        exportWavBtn: document.getElementById('exportWavBtn'),
        channelTabs: document.querySelectorAll('.channel-tab'),
        attackSlider: document.getElementById('attackSlider'),
        attackVal: document.getElementById('attackVal'),
        decaySlider: document.getElementById('decaySlider'),
        decayVal: document.getElementById('decayVal'),
        sustainSlider: document.getElementById('sustainSlider'),
        sustainVal: document.getElementById('sustainVal'),
        releaseSlider: document.getElementById('releaseSlider'),
        releaseVal: document.getElementById('releaseVal'),
        volumeSlider: document.getElementById('volumeSlider'),
        volumeVal: document.getElementById('volumeVal')
    };

    // Start App
    init();

    function init() {
        buildStepLabels();
        renderActiveGrid();
        syncEnvelopeSliders();
        bindEvents();
    }

    function bindEvents() {
        elements.playBtn.addEventListener('click', startPlayback);
        elements.stopBtn.addEventListener('click', stopPlayback);

        // Spacebar play/stop keydown listener
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.key === ' ') {
                if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'SELECT') {
                    return;
                }
                e.preventDefault();
                if (state.isPlaying) {
                    stopPlayback();
                } else {
                    startPlayback();
                }
            }
        });
        
        elements.bpmSlider.addEventListener('input', (e) => {
            state.bpm = parseInt(e.target.value, 10);
            elements.bpmVal.textContent = state.bpm;
        });

        if (elements.stepsSelect) {
            elements.stepsSelect.addEventListener('change', (e) => {
                const newSteps = parseInt(e.target.value, 10);
                resizeGrids(newSteps);
            });
        }

        elements.clearBtn.addEventListener('click', clearCurrentGrid);
        elements.saveJsonBtn.addEventListener('click', exportJson);
        elements.loadJsonInput.addEventListener('change', importJson);
        elements.exportWavBtn.addEventListener('click', exportToWav);

        // Switch channel tabs
        elements.channelTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                elements.channelTabs.forEach(t => {
                    t.classList.remove('active');
                    t.setAttribute('aria-selected', 'false');
                });
                tab.classList.add('active');
                tab.setAttribute('aria-selected', 'true');
                state.activeChannel = tab.dataset.channel;
                
                syncEnvelopeSliders();
                renderActiveGrid();
            });
        });

        // Envelope slider changes
        const updateEnv = () => {
            const env = state.envelopes[state.activeChannel];
            env.attack = parseFloat(elements.attackSlider.value);
            env.decay = parseFloat(elements.decaySlider.value);
            env.sustain = parseFloat(elements.sustainSlider.value);
            env.release = parseFloat(elements.releaseSlider.value);
            
            elements.attackVal.textContent = env.attack.toFixed(2);
            elements.decayVal.textContent = env.decay.toFixed(2);
            elements.sustainVal.textContent = env.sustain.toFixed(2);
            elements.releaseVal.textContent = env.release.toFixed(2);
        };
        elements.attackSlider.addEventListener('input', updateEnv);
        elements.decaySlider.addEventListener('input', updateEnv);
        elements.sustainSlider.addEventListener('input', updateEnv);
        elements.releaseSlider.addEventListener('input', updateEnv);

        // Volume slider changes
        elements.volumeSlider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value, 10);
            state.masterVolume = val / 100;
            elements.volumeVal.textContent = val;
            if (masterGain) {
                masterGain.gain.setValueAtTime(state.masterVolume, audioCtx.currentTime);
            }
        });
    }

    // Sequencer Layout Creators
    function buildStepLabels() {
        elements.stepLabelsContainer.innerHTML = '';
        elements.stepLabelsContainer.style.gridTemplateColumns = `repeat(${state.stepsCount}, 42px)`;
        for (let i = 1; i <= state.stepsCount; i++) {
            const el = document.createElement('div');
            el.className = 'step-label';
            el.textContent = String(i).padStart(2, '0');
            elements.stepLabelsContainer.appendChild(el);
        }
    }

    function renderActiveGrid() {
        elements.sequencerGrid.innerHTML = '';
        const channel = state.activeChannel;
        let notesArr = MELODY_NOTES;
        let rowsCount = 13;
        
        if (channel === 'bass') {
            notesArr = BASS_NOTES;
        } else if (channel === 'percussion') {
            notesArr = PERCUSSION_ROWS;
            rowsCount = 3;
        }

        for (let r = 0; r < rowsCount; r++) {
            const row = document.createElement('div');
            row.className = 'grid-row';
            
            // Note header
            const header = document.createElement('div');
            header.className = 'note-header';
            if (notesArr[r].includes('#')) {
                header.classList.add('sharps-flats');
            }
            header.textContent = notesArr[r];
            row.appendChild(header);

            // Row cells
            const cellsContainer = document.createElement('div');
            cellsContainer.className = 'row-cells';
            cellsContainer.style.gridTemplateColumns = `repeat(${state.stepsCount}, 42px)`;

            for (let c = 0; c < state.stepsCount; c++) {
                const cell = document.createElement('div');
                cell.className = 'note-cell';
                cell.dataset.row = r;
                cell.dataset.col = c;

                // Mark if active in the current channel
                const isActive = state.grids[channel][r][c] === 1;
                if (isActive) {
                    cell.classList.add(`active-${channel}`);
                } else {
                    // Show ghost marks if notes exist in other channels for this slot
                    const ghostChannels = getGhostChannels(r, c, channel);
                    if (ghostChannels.length > 0) {
                        if (ghostChannels.length > 1) {
                            cell.classList.add('ghost-layered');
                        } else {
                            cell.classList.add(`ghost-${ghostChannels[0]}`);
                        }
                    }
                }

                // Click handler
                cell.addEventListener('mousedown', () => {
                    const wasActive = state.grids[channel][r][c] === 1;
                    if (wasActive) {
                        state.grids[channel][r][c] = 0;
                        cell.classList.remove(`active-${channel}`);
                        
                        // Fall back to ghost marks if relevant
                        const ghostChannels = getGhostChannels(r, c, channel);
                        if (ghostChannels.length > 0) {
                            if (ghostChannels.length > 1) {
                                cell.classList.add('ghost-layered');
                            } else {
                                cell.classList.add(`ghost-${ghostChannels[0]}`);
                            }
                        }
                    } else {
                        // Clear any ghost marks
                        cell.className = 'note-cell';
                        state.grids[channel][r][c] = 1;
                        cell.classList.add(`active-${channel}`);
                        
                        // Play instant preview note
                        playPreviewNote(r);
                    }
                });

                cellsContainer.appendChild(cell);
            }
            row.appendChild(cellsContainer);
            elements.sequencerGrid.appendChild(row);
        }
    }

    function getGhostChannels(r, c, activeCh) {
        const list = [];
        Object.keys(state.grids).forEach(ch => {
            if (ch === activeCh) return;
            // Percussion row counts differ, only ghost notes of equivalent indices
            if (state.grids[ch][r] && state.grids[ch][r][c] === 1) {
                list.push(ch);
            }
        });
        return list;
    }

    function syncEnvelopeSliders() {
        const env = state.envelopes[state.activeChannel];
        elements.attackSlider.value = env.attack;
        elements.decaySlider.value = env.decay;
        elements.sustainSlider.value = env.sustain;
        elements.releaseSlider.value = env.release;

        elements.attackVal.textContent = env.attack.toFixed(2);
        elements.decayVal.textContent = env.decay.toFixed(2);
        elements.sustainVal.textContent = env.sustain.toFixed(2);
        elements.releaseVal.textContent = env.release.toFixed(2);
    }

    function resizeGrids(newSteps) {
        state.stepsCount = newSteps;
        Object.keys(state.grids).forEach(ch => {
            state.grids[ch] = state.grids[ch].map(row => {
                if (row.length < newSteps) {
                    return [...row, ...Array(newSteps - row.length).fill(0)];
                } else {
                    return row.slice(0, newSteps);
                }
            });
        });
        
        if (currentStep >= newSteps) {
            currentStep = 0;
        }
        
        buildStepLabels();
        renderActiveGrid();
    }

    function clearCurrentGrid() {
        const confirm = window.confirm(`Clear all channels in the sequencer?`);
        if (!confirm) return;
        Object.keys(state.grids).forEach(ch => {
            const rowCount = state.grids[ch].length;
            state.grids[ch] = Array.from({ length: rowCount }, () => Array(state.stepsCount).fill(0));
        });
        renderActiveGrid();
    }

    // Sound Synthesizers
    function initAudioContext() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            masterGain = audioCtx.createGain();
            masterGain.gain.setValueAtTime(state.masterVolume, audioCtx.currentTime);
            masterGain.connect(audioCtx.destination);
            
            // Build noise buffer once for snare/hats
            buildNoiseBuffer();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    function buildNoiseBuffer() {
        const bufferSize = audioCtx.sampleRate * 2.0; // 2 seconds
        const noise = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = noise.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        noiseBuffer = noise;
    }

    function playTone(freq, time, type, env, ctx = audioCtx, destination = masterGain) {
        if (!freq) return;

        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, time);

        // Envelope
        gainNode.gain.setValueAtTime(0, time);
        gainNode.gain.linearRampToValueAtTime(0.5, time + env.attack);
        gainNode.gain.exponentialRampToValueAtTime(0.5 * env.sustain, time + env.attack + env.decay);
        gainNode.gain.setValueAtTime(0.5 * env.sustain, time + env.attack + env.decay + 0.1); // hold a bit
        gainNode.gain.exponentialRampToValueAtTime(0.0001, time + env.attack + env.decay + 0.1 + env.release);

        osc.connect(gainNode);
        gainNode.connect(destination);

        osc.start(time);
        osc.stop(time + env.attack + env.decay + 0.1 + env.release);
    }

    // Drum Synths
    function playKick(time, env, ctx = audioCtx, destination = masterGain) {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.frequency.setValueAtTime(150, time);
        osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.12);

        gainNode.gain.setValueAtTime(0, time);
        gainNode.gain.linearRampToValueAtTime(1.0, time + 0.005);
        gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

        osc.connect(gainNode);
        gainNode.connect(destination);

        osc.start(time);
        osc.stop(time + 0.16);
    }

    function playSnare(time, env, ctx = audioCtx, destination = masterGain) {
        // Snare Noise shell
        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.value = 1000;

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0, time);
        noiseGain.gain.linearRampToValueAtTime(0.7, time + 0.01);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(destination);

        // Snare tone thump
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, time);
        osc.frequency.exponentialRampToValueAtTime(100, time + 0.1);

        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(0, time);
        oscGain.gain.linearRampToValueAtTime(0.4, time + 0.005);
        oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

        osc.connect(oscGain);
        oscGain.connect(destination);

        noise.start(time);
        osc.start(time);

        noise.stop(time + 0.21);
        osc.stop(time + 0.11);
    }

    function playHiHat(time, env, ctx = audioCtx, destination = masterGain) {
        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.value = 8000;

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0, time);
        noiseGain.gain.linearRampToValueAtTime(0.6, time + 0.005);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(destination);

        noise.start(time);
        noise.stop(time + 0.06);
    }

    function playPreviewNote(rowIndex) {
        initAudioContext();
        const time = audioCtx.currentTime;
        const channel = state.activeChannel;

        if (channel === 'melody') {
            playTone(NOTE_FREQS[MELODY_NOTES[rowIndex]], time, 'triangle', state.envelopes.melody);
        } else if (channel === 'lead') {
            playTone(NOTE_FREQS[MELODY_NOTES[rowIndex]], time, 'square', state.envelopes.lead);
        } else if (channel === 'bass') {
            playTone(NOTE_FREQS[BASS_NOTES[rowIndex]], time, 'sawtooth', state.envelopes.bass);
        } else if (channel === 'percussion') {
            if (rowIndex === 0) playSnare(time, state.envelopes.percussion);
            if (rowIndex === 1) playHiHat(time, state.envelopes.percussion);
            if (rowIndex === 2) playKick(time, state.envelopes.percussion);
        }
    }

    // Playback Scheduler Loop
    function startPlayback() {
        initAudioContext();
        if (state.isPlaying) return;
        
        state.isPlaying = true;
        currentStep = 0;
        nextNoteTime = audioCtx.currentTime;
        stepTimes = [];
        
        elements.playBtn.textContent = 'Playing';
        elements.playBtn.disabled = true;
        
        scheduler();
        requestAnimationFrame(drawStepHighlight);
    }

    function stopPlayback() {
        if (!state.isPlaying) return;
        state.isPlaying = false;
        clearTimeout(schedulerTimerId);
        
        elements.playBtn.textContent = 'Play';
        elements.playBtn.disabled = false;
        
        // Remove step cursor highlight
        const activeLabels = elements.stepLabelsContainer.querySelectorAll('.step-label');
        activeLabels.forEach(el => el.classList.remove('active-step'));
        const cells = elements.sequencerGrid.querySelectorAll('.note-cell');
        cells.forEach(c => c.classList.remove('active-column'));
    }

    function scheduler() {
        while (nextNoteTime < audioCtx.currentTime + scheduleAheadTime) {
            scheduleNote(currentStep, nextNoteTime);
            
            // Add schedule time to queue for drawing sync
            stepTimes.push({ step: currentStep, time: nextNoteTime });
            
            advanceStep();
        }
        schedulerTimerId = setTimeout(scheduler, lookahead);
    }

    function advanceStep() {
        const secondsPerBeat = 60.0 / state.bpm;
        const secondsPerStep = secondsPerBeat / 4; // 16th notes
        nextNoteTime += secondsPerStep;
        currentStep = (currentStep + 1) % state.stepsCount;
    }

    function scheduleNote(step, time) {
        // 1. Melody
        for (let r = 0; r < 13; r++) {
            if (state.grids.melody[r][step] === 1) {
                playTone(NOTE_FREQS[MELODY_NOTES[r]], time, 'triangle', state.envelopes.melody);
            }
        }
        // 2. Lead
        for (let r = 0; r < 13; r++) {
            if (state.grids.lead[r][step] === 1) {
                playTone(NOTE_FREQS[MELODY_NOTES[r]], time, 'square', state.envelopes.lead);
            }
        }
        // 3. Bass
        for (let r = 0; r < 13; r++) {
            if (state.grids.bass[r][step] === 1) {
                playTone(NOTE_FREQS[BASS_NOTES[r]], time, 'sawtooth', state.envelopes.bass);
            }
        }
        // 4. Percussion
        if (state.grids.percussion[0][step] === 1) {
            playSnare(time, state.envelopes.percussion);
        }
        if (state.grids.percussion[1][step] === 1) {
            playHiHat(time, state.envelopes.percussion);
        }
        if (state.grids.percussion[2][step] === 1) {
            playKick(time, state.envelopes.percussion);
        }
    }

    // Animation Loop: synchronise visual column sweeps to scheduled step times
    function drawStepHighlight() {
        if (!state.isPlaying) return;
        
        const currentTime = audioCtx.currentTime;
        let activeCol = -1;

        for (let i = 0; i < stepTimes.length; i++) {
            if (stepTimes[i].time <= currentTime) {
                activeCol = stepTimes[i].step;
            } else {
                break;
            }
        }

        // Clean queue of old past notes
        while (stepTimes.length > 0 && stepTimes[0].time < currentTime - 1.5) {
            stepTimes.shift();
        }

        if (activeCol !== -1) {
            const stepLabels = elements.stepLabelsContainer.querySelectorAll('.step-label');
            stepLabels.forEach((el, index) => {
                el.classList.toggle('active-step', index === activeCol);
            });

            const rows = elements.sequencerGrid.querySelectorAll('.grid-row');
            rows.forEach(row => {
                const cells = row.querySelectorAll('.note-cell');
                cells.forEach((cell, index) => {
                    cell.classList.toggle('active-column', index === activeCol);
                });
            });
        }

        requestAnimationFrame(drawStepHighlight);
    }

    // Loop File Operations (JSON Export/Import)
    function exportJson() {
        const dataStr = JSON.stringify({
            bpm: state.bpm,
            grids: state.grids,
            envelopes: state.envelopes
        }, null, 4);

        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'chiptune_composition.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function importJson(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.bpm) {
                    state.bpm = data.bpm;
                    elements.bpmSlider.value = state.bpm;
                    elements.bpmVal.textContent = state.bpm;
                }
                if (data.grids) {
                    state.grids = data.grids;
                    
                    // Auto-detect stepsCount from imported grids
                    const firstGrid = Object.values(state.grids)[0];
                    if (firstGrid && firstGrid[0]) {
                        state.stepsCount = firstGrid[0].length;
                        if (elements.stepsSelect) {
                            elements.stepsSelect.value = String(state.stepsCount);
                        }
                    }
                }
                if (data.envelopes) {
                    state.envelopes = data.envelopes;
                }
                syncEnvelopeSliders();
                buildStepLabels();
                renderActiveGrid();
                window.alert('Composition loaded successfully!');
            } catch (err) {
                window.alert('Error parsing JSON sequencer file.');
            }
        };
        reader.readAsText(file);
        elements.loadJsonInput.value = '';
    }

    // Audio offline compilation & WAV encoder
    async function exportToWav() {
        initAudioContext();
        elements.exportWavBtn.disabled = true;
        elements.exportWavBtn.textContent = 'Exporting...';

        const sampleRate = 44100;
        const secondsPerBeat = 60.0 / state.bpm;
        const secondsPerStep = secondsPerBeat / 4;
        const totalDuration = secondsPerStep * state.stepsCount;

        // Render audio offline
        const offlineCtx = new OfflineAudioContext(1, sampleRate * totalDuration, sampleRate);
        
        // Setup noise buffer inside offline rendering context
        const offNoiseBuffer = offlineCtx.createBuffer(1, sampleRate * 2.0, sampleRate);
        const offNoiseData = offNoiseBuffer.getChannelData(0);
        for (let i = 0; i < offNoiseData.length; i++) {
            offNoiseData[i] = Math.random() * 2 - 1;
        }

        const offlineGain = offlineCtx.createGain();
        offlineGain.gain.setValueAtTime(state.masterVolume, 0);
        offlineGain.connect(offlineCtx.destination);

        // Helper schedule function within offline scope
        const offPlayTone = (freq, time, type, env) => {
            const osc = offlineCtx.createOscillator();
            const gainNode = offlineCtx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, time);

            gainNode.gain.setValueAtTime(0, time);
            gainNode.gain.linearRampToValueAtTime(0.5, time + env.attack);
            gainNode.gain.exponentialRampToValueAtTime(0.5 * env.sustain, time + env.attack + env.decay);
            gainNode.gain.setValueAtTime(0.5 * env.sustain, time + env.attack + env.decay + 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, time + env.attack + env.decay + 0.1 + env.release);

            osc.connect(gainNode);
            gainNode.connect(offlineGain);
            osc.start(time);
            osc.stop(time + env.attack + env.decay + 0.1 + env.release);
        };

        const offPlayKick = (time) => {
            const osc = offlineCtx.createOscillator();
            const gainNode = offlineCtx.createGain();
            osc.frequency.setValueAtTime(150, time);
            osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.12);

            gainNode.gain.setValueAtTime(0, time);
            gainNode.gain.linearRampToValueAtTime(1.0, time + 0.005);
            gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

            osc.connect(gainNode);
            gainNode.connect(offlineGain);
            osc.start(time);
            osc.stop(time + 0.16);
        };

        const offPlaySnare = (time) => {
            const noise = offlineCtx.createBufferSource();
            noise.buffer = offNoiseBuffer;
            const filter = offlineCtx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 1000;
            const gn = offlineCtx.createGain();
            gn.gain.setValueAtTime(0, time);
            gn.gain.linearRampToValueAtTime(0.7, time + 0.01);
            gn.gain.exponentialRampToValueAtTime(0.001, time + 0.2);

            noise.connect(filter);
            filter.connect(gn);
            gn.connect(offlineGain);

            const osc = offlineCtx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(180, time);
            osc.frequency.exponentialRampToValueAtTime(100, time + 0.1);
            const og = offlineCtx.createGain();
            og.gain.setValueAtTime(0, time);
            og.gain.linearRampToValueAtTime(0.4, time + 0.005);
            og.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

            osc.connect(og);
            og.connect(offlineGain);

            noise.start(time);
            osc.start(time);
            noise.stop(time + 0.21);
            osc.stop(time + 0.11);
        };

        const offPlayHiHat = (time) => {
            const noise = offlineCtx.createBufferSource();
            noise.buffer = offNoiseBuffer;
            const filter = offlineCtx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.value = 8000;
            const gn = offlineCtx.createGain();
            gn.gain.setValueAtTime(0, time);
            gn.gain.linearRampToValueAtTime(0.6, time + 0.005);
            gn.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

            noise.connect(filter);
            filter.connect(gn);
            gn.connect(offlineGain);

            noise.start(time);
            noise.stop(time + 0.06);
        };

        // Render notes programmatically step by step in sequence
        for (let step = 0; step < state.stepsCount; step++) {
            const time = step * secondsPerStep;
            
            // Melody
            for (let r = 0; r < 13; r++) {
                if (state.grids.melody[r][step] === 1) {
                    offPlayTone(NOTE_FREQS[MELODY_NOTES[r]], time, 'triangle', state.envelopes.melody);
                }
            }
            // Lead
            for (let r = 0; r < 13; r++) {
                if (state.grids.lead[r][step] === 1) {
                    offPlayTone(NOTE_FREQS[MELODY_NOTES[r]], time, 'square', state.envelopes.lead);
                }
            }
            // Bass
            for (let r = 0; r < 13; r++) {
                if (state.grids.bass[r][step] === 1) {
                    offPlayTone(NOTE_FREQS[BASS_NOTES[r]], time, 'sawtooth', state.envelopes.bass);
                }
            }
            // Drums
            if (state.grids.percussion[0][step] === 1) {
                offPlaySnare(time);
            }
            if (state.grids.percussion[1][step] === 1) {
                offPlayHiHat(time);
            }
            if (state.grids.percussion[2][step] === 1) {
                offPlayKick(time);
            }
        }

        try {
            const buffer = await offlineCtx.startRendering();
            const wavBytes = bufferToWav(buffer);
            const blob = new Blob([wavBytes], { type: 'audio/wav' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'chiptune_composition.wav';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('WAV compilation error:', err);
            window.alert('Unable to export loop as WAV file.');
        } finally {
            elements.exportWavBtn.disabled = false;
            elements.exportWavBtn.textContent = 'Export WAV';
        }
    }

    // Helper: Encode AudioBuffer to 16-bit PCM WAV byte array
    function bufferToWav(buffer) {
        const numChannels = buffer.numberOfChannels;
        const sampleRate = buffer.sampleRate;
        const format = 1; // PCM 16-bit
        const bitDepth = 16;
        
        let result;
        if (numChannels === 2) {
            result = interleave(buffer.getChannelData(0), buffer.getChannelData(1));
        } else {
            result = buffer.getChannelData(0);
        }

        const bufferLength = result.length;
        const bytesPerSample = bitDepth / 8;
        const blockAlign = numChannels * bytesPerSample;

        const arrayBuffer = new ArrayBuffer(44 + bufferLength * bytesPerSample);
        const view = new DataView(arrayBuffer);

        /* RIFF identifier */
        writeString(view, 0, 'RIFF');
        /* file length */
        view.setUint32(4, 36 + bufferLength * bytesPerSample, true);
        /* RIFF type */
        writeString(view, 8, 'WAVE');
        /* format chunk identifier */
        writeString(view, 12, 'fmt ');
        /* format chunk length */
        view.setUint32(16, 16, true);
        /* sample format (raw) */
        view.setUint16(20, format, true);
        /* channel count */
        view.setUint16(22, numChannels, true);
        /* sample rate */
        view.setUint32(24, sampleRate, true);
        /* byte rate (sample rate * block align) */
        view.setUint32(28, sampleRate * blockAlign, true);
        /* block align (channel count * bytes per sample) */
        view.setUint16(32, blockAlign, true);
        /* bits per sample */
        view.setUint16(34, bitDepth, true);
        /* data chunk identifier */
        writeString(view, 36, 'data');
        /* data chunk length */
        view.setUint32(40, bufferLength * bytesPerSample, true);

        // Write PCM sample float numbers down to 16-bit short integers
        floatTo16BitPCM(view, 44, result);

        return arrayBuffer;
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
})();

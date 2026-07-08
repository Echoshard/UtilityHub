document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const editor = document.getElementById('text-editor');
    const readerView = document.getElementById('reader-view');
    const voiceSelect = document.getElementById('voice-select');
    
    // Sliders
    const rateSlider = document.getElementById('rate-slider');
    const pitchSlider = document.getElementById('pitch-slider');
    const volumeSlider = document.getElementById('volume-slider');
    
    // Sliders Values
    const rateVal = document.getElementById('rate-val');
    const pitchVal = document.getElementById('pitch-val');
    const volumeVal = document.getElementById('volume-val');
    
    // Playback Buttons
    const btnPlay = document.getElementById('btn-play');
    const btnPause = document.getElementById('btn-pause');
    const btnStop = document.getElementById('btn-stop');
    const btnClearText = document.getElementById('btn-clear-text');
    
    // Theme Switch
    const themeLightBtn = document.getElementById('theme-light');
    const themeDarkBtn = document.getElementById('theme-dark');
    
    // Resizer Elements
    const resizer = document.getElementById('pane-resizer');
    const editorPane = document.getElementById('editor-pane');
    const visualizerPane = document.getElementById('visualizer-pane');
    const sidebar = document.getElementById('sidebar');
    
    // Stats & Status Bar
    const visualizerStatus = document.getElementById('visualizer-status');
    const readingProgress = document.getElementById('reading-progress');
    const statWordsFooter = document.getElementById('stat-words-footer');
    const statCharsFooter = document.getElementById('stat-chars-footer');
    
    // State variables
    let voices = [];
    let wordSpans = [];
    let isPlaying = false;
    let isPaused = false;
    let offsetIndex = 0;
    let currentUtterance = null;
    let isDragging = false;
    
    // Presets
    const PRESETS = {
        quote: "The only limit to our realization of tomorrow will be our doubts of today. Let us move forward with strong and active faith. – Franklin D. Roosevelt",
        tech: "Artificial intelligence is changing the landscape of software development. Local applications run directly in the browser using standard web APIs, which ensures complete privacy, high performance, and full offline operation without sending sensitive data to external servers.",
        poem: "Two roads diverged in a yellow wood,\nAnd sorry I could not travel both\nAnd be one traveler, long I stood\nAnd looked down one as far as I could\nTo where it bent in the undergrowth;\n\nThen took the other, as just as fair,\nAnd having perhaps the better claim,\nBecause it was grassy and wanted wear;\nThough as for that the passing there\nHad worn them really about the same."
    };
    
    // ==========================================
    // INITIALIZATION & STATE MANAGEMENT
    // ==========================================
    
    function init() {
        // Load theme preferences
        const savedTheme = localStorage.getItem('markdown_theme') || 'dark';
        setTheme(savedTheme);

        // Load split pane position
        const savedPaneSplit = localStorage.getItem('tts_pane_split');
        if (savedPaneSplit) {
            applyPaneSplit(parseFloat(savedPaneSplit));
        }
        
        // Load voice parameters from storage
        const savedRate = localStorage.getItem('tts_rate');
        if (savedRate) {
            rateSlider.value = savedRate;
            rateVal.textContent = parseFloat(savedRate).toFixed(1) + 'x';
        }
        const savedPitch = localStorage.getItem('tts_pitch');
        if (savedPitch) {
            pitchSlider.value = savedPitch;
            pitchVal.textContent = parseFloat(savedPitch).toFixed(1);
        }
        const savedVolume = localStorage.getItem('tts_volume');
        if (savedVolume) {
            volumeSlider.value = savedVolume;
            volumeVal.textContent = Math.round(parseFloat(savedVolume) * 100) + '%';
        }
        
        // Load editor text
        const savedText = localStorage.getItem('tts_editor_text');
        editor.value = savedText !== null ? savedText : PRESETS.tech;
        
        // Populate system voices
        populateVoiceList();
        if (typeof speechSynthesis !== 'undefined' && speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = populateVoiceList;
        }
        
        // Initial setup
        setupEventListeners();
        updateStats();
        prepareReaderText(editor.value);
    }
    
    function populateVoiceList() {
        if (typeof speechSynthesis === 'undefined') return;
        
        voices = speechSynthesis.getVoices();
        const savedVoiceName = localStorage.getItem('tts_voice');
        voiceSelect.innerHTML = '';
        
        voices.forEach((voice) => {
            const option = document.createElement('option');
            option.textContent = `${voice.name} (${voice.lang})${voice.default ? ' [Default]' : ''}`;
            option.value = voice.name;
            voiceSelect.appendChild(option);
        });
        
        if (savedVoiceName) {
            voiceSelect.value = savedVoiceName;
        } else {
            // Find English voice as default
            const englishVoiceIndex = voices.findIndex(v => v.lang.startsWith('en-'));
            if (englishVoiceIndex !== -1) {
                voiceSelect.selectedIndex = englishVoiceIndex;
            }
        }
    }
    
    function saveState() {
        localStorage.setItem('tts_editor_text', editor.value);
        localStorage.setItem('tts_voice', voiceSelect.value);
        localStorage.setItem('tts_rate', rateSlider.value);
        localStorage.setItem('tts_pitch', pitchSlider.value);
        localStorage.setItem('tts_volume', volumeSlider.value);
    }
    
    // ==========================================
    // TEXT PARSING & VISUAL HIGHLIGHTING
    // ==========================================
    
    function prepareReaderText(text) {
        readerView.innerHTML = '';
        wordSpans = [];
        
        if (!text.trim()) {
            readerView.innerHTML = '<span class="placeholder-text">Type some text on the left and click Speak to begin highlighting!</span>';
            return;
        }
        
        // Match word boundaries, whitespace, or punctuation
        const regex = /(\b\w+\b)|([^\w\s]+)|(\s+)/g;
        let match;
        
        while ((match = regex.exec(text)) !== null) {
            const token = match[0];
            const startIndex = match.index;
            const endIndex = regex.lastIndex;
            
            if (match[1]) {
                // Word token
                const span = document.createElement('span');
                span.className = 'spoken-word';
                span.textContent = token;
                
                const spanItem = {
                    span: span,
                    start: startIndex,
                    end: endIndex,
                    text: token
                };
                
                wordSpans.push(spanItem);
                
                // Allow jumping speech to clicked word
                span.addEventListener('click', () => {
                    speakFromIndex(startIndex);
                });
                
                readerView.appendChild(span);
            } else {
                // White space or punctuation
                const textNode = document.createTextNode(token);
                readerView.appendChild(textNode);
            }
        }
    }
    
    function highlightWordSpan(charIndex) {
        clearActiveHighlights();
        
        // Find matching span
        const activeSpanItem = wordSpans.find(span => charIndex >= span.start && charIndex < span.end);
        
        if (activeSpanItem) {
            activeSpanItem.span.classList.add('active');
            
            // Auto scroll container
            const container = document.getElementById('reader-wrapper');
            const spanElement = activeSpanItem.span;
            
            const containerHeight = container.clientHeight;
            const spanTop = spanElement.offsetTop;
            const spanHeight = spanElement.clientHeight;
            
            container.scrollTop = spanTop - (containerHeight / 2) + (spanHeight / 2);
        }
    }
    
    function clearActiveHighlights() {
        wordSpans.forEach(item => {
            item.span.classList.remove('active');
        });
    }
    
    function updateProgress(charIndex, totalLength) {
        if (totalLength === 0) return;
        const percent = Math.min(100, Math.round((charIndex / totalLength) * 100));
        readingProgress.textContent = `${percent}% read`;
    }
    
    function updateStats() {
        const text = editor.value;
        const charCount = text.length;
        const cleanText = text.trim();
        const wordCount = cleanText === '' ? 0 : cleanText.split(/\s+/).length;
        
        statWordsFooter.textContent = `${wordCount} words`;
        statCharsFooter.textContent = `${charCount} chars`;
    }
    
    // ==========================================
    // PLAYBACK CONTROLS
    // ==========================================
    
    function playSpeech(startIndex = 0) {
        if (typeof speechSynthesis === 'undefined') return;
        
        if (isPaused) {
            speechSynthesis.resume();
            isPlaying = true;
            isPaused = false;
            updatePlaybackUI();
            return;
        }
        
        speechSynthesis.cancel();
        
        const fullText = editor.value;
        if (!fullText.trim()) return;
        
        prepareReaderText(fullText);
        
        const textToSpeak = fullText.substring(startIndex);
        if (!textToSpeak.trim()) return;
        
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        currentUtterance = utterance;
        offsetIndex = startIndex;
        
        // Load voice
        const selectedVoiceName = voiceSelect.value;
        const voice = voices.find(v => v.name === selectedVoiceName);
        if (voice) {
            utterance.voice = voice;
        }
        
        utterance.rate = parseFloat(rateSlider.value);
        utterance.pitch = parseFloat(pitchSlider.value);
        utterance.volume = parseFloat(volumeSlider.value);
        
        utterance.onboundary = (event) => {
            if (event.name === 'word') {
                const charIndex = event.charIndex;
                const absoluteCharIndex = offsetIndex + charIndex;
                highlightWordSpan(absoluteCharIndex);
                updateProgress(absoluteCharIndex, fullText.length);
            }
        };
        
        utterance.onend = () => {
            stopSpeech();
        };
        
        utterance.onerror = (e) => {
            // Cancel events usually throw errors, ignore if intentional stop
            if (isPlaying) {
                console.error("SpeechSynthesis error:", e);
                stopSpeech();
            }
        };
        
        isPlaying = true;
        isPaused = false;
        
        speechSynthesis.speak(utterance);
        updatePlaybackUI();
    }
    
    function pauseSpeech() {
        if (typeof speechSynthesis === 'undefined') return;
        if (isPlaying && !isPaused) {
            speechSynthesis.pause();
            isPlaying = false;
            isPaused = true;
            updatePlaybackUI();
        }
    }
    
    function stopSpeech() {
        if (typeof speechSynthesis === 'undefined') return;
        speechSynthesis.cancel();
        isPlaying = false;
        isPaused = false;
        currentUtterance = null;
        offsetIndex = 0;
        clearActiveHighlights();
        updatePlaybackUI();
        readingProgress.textContent = "0% read";
    }
    
    function speakFromIndex(index) {
        stopSpeech();
        setTimeout(() => {
            playSpeech(index);
        }, 100);
    }
    
    function updatePlaybackUI() {
        if (isPlaying) {
            btnPlay.disabled = true;
            btnPause.disabled = false;
            btnStop.disabled = false;
            visualizerStatus.textContent = "Reading...";
        } else if (isPaused) {
            btnPlay.disabled = false;
            document.getElementById('play-text').textContent = "Resume";
            btnPause.disabled = true;
            btnStop.disabled = false;
            visualizerStatus.textContent = "Paused";
        } else {
            btnPlay.disabled = false;
            document.getElementById('play-text').textContent = "Speak";
            btnPause.disabled = true;
            btnStop.disabled = true;
            visualizerStatus.textContent = "Ready";
        }
    }
    
    // ==========================================
    // PANE RESIZING
    // ==========================================
    
    function applyPaneSplit(percent) {
        const clampedPercent = Math.max(10, Math.min(90, percent));
        editorPane.style.width = clampedPercent + '%';
        visualizerPane.style.width = (100 - clampedPercent) + '%';
        resizer.style.left = clampedPercent + '%';
        localStorage.setItem('tts_pane_split', clampedPercent);
    }
    
    // ==========================================
    // EVENT LISTENERS
    // ==========================================
    
    function setupEventListeners() {
        // Text changes
        editor.addEventListener('input', () => {
            updateStats();
            prepareReaderText(editor.value);
            saveState();
            if (isPlaying || isPaused) {
                stopSpeech();
            }
        });
        
        // Preset loading
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const presetKey = btn.dataset.preset;
                const text = PRESETS[presetKey];
                if (text) {
                    stopSpeech();
                    editor.value = text;
                    updateStats();
                    prepareReaderText(text);
                    saveState();
                }
            });
        });
        
        // Voice parameter changes
        voiceSelect.addEventListener('change', () => {
            saveState();
            if (isPlaying || isPaused) {
                // Restart with new voice at current word progress if speaking
                const currentActive = wordSpans.find(span => span.span.classList.contains('active'));
                const restartIndex = currentActive ? currentActive.start : 0;
                speakFromIndex(restartIndex);
            }
        });
        
        rateSlider.addEventListener('input', () => {
            rateVal.textContent = parseFloat(rateSlider.value).toFixed(1) + 'x';
            saveState();
        });
        
        pitchSlider.addEventListener('input', () => {
            pitchVal.textContent = parseFloat(pitchSlider.value).toFixed(1);
            saveState();
        });
        
        volumeSlider.addEventListener('input', () => {
            volumeVal.textContent = Math.round(parseFloat(volumeSlider.value) * 100) + '%';
            saveState();
        });
        
        // Playback buttons
        btnPlay.addEventListener('click', () => playSpeech(0));
        btnPause.addEventListener('click', pauseSpeech);
        btnStop.addEventListener('click', stopSpeech);
        
        // Clear text button
        btnClearText.addEventListener('click', () => {
            stopSpeech();
            editor.value = '';
            updateStats();
            prepareReaderText('');
            saveState();
            editor.focus();
        });
        
        // Theme triggers
        themeLightBtn.addEventListener('click', () => setTheme('light'));
        themeDarkBtn.addEventListener('click', () => setTheme('dark'));
        
        // Resizer drag events
        resizer.addEventListener('mousedown', (e) => {
            e.preventDefault();
            isDragging = true;
            resizer.classList.add('dragging');
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const containerWidth = document.querySelector('.workspace-panes').clientWidth;
            const mouseX = e.clientX;
            const sidebarWidth = sidebar.clientWidth;
            const relativeX = mouseX - sidebarWidth;
            const pct = (relativeX / containerWidth) * 100;
            applyPaneSplit(pct);
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                resizer.classList.remove('dragging');
            }
        });
    }
    
    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('markdown_theme', theme);
        
        if (theme === 'light') {
            themeLightBtn.classList.add('active');
            themeDarkBtn.classList.remove('active');
        } else {
            themeLightBtn.classList.remove('active');
            themeDarkBtn.classList.add('active');
        }
    }
    
    // Launch
    init();
});

// ==========================================
// HOME ROW BLASTER — WEB SUITE GAME LOGIC
// ==========================================

// --- CORE GAME DATASETS ---
const LESSON_CATEGORIES = [
    { id: 'home', title: 'Home Row Lessons', desc: 'Foundation of touch typing.', diff: 'beginner' },
    { id: 'upper', title: 'Upper Row Lessons', desc: 'Expand to the top letter row.', diff: 'beginner' },
    { id: 'lower', title: 'Lower Row Lessons', desc: 'Complete the full alphabet.', diff: 'intermediate' },
    { id: 'numbers', title: 'Numbers Lessons', desc: 'Touch type numbers row.', diff: 'intermediate' },
    { id: 'punctuation', title: 'Punctuation Lessons', desc: 'Train symbol accuracy.', diff: 'advanced' },
    { id: 'numpad', title: 'Numeric Keypad', desc: 'Train the 10-key numeric pad.', diff: 'intermediate' },
    { id: 'normal', title: 'Normal Practice', desc: 'Real everyday sentences.', diff: 'intermediate' },
    { id: 'programmer', title: 'Code Practice', desc: 'Syntax-heavy programming.', diff: 'advanced' }
];

const LESSONS = {
    home: [
        { id: 'home_fj', title: 'F and J', keys: ['f', 'j'], text: 'f j f j ff jj fj jf f j ff jj fj jf j f j f j j f f fj jf jf fj' },
        { id: 'home_dk', title: 'D and K', keys: ['d', 'k'], text: 'd k d k dd kk dk kd d k dd kk dk kd k d k d k k d d dk kd kd dk' },
        { id: 'home_sl', title: 'S and L', keys: ['s', 'l'], text: 's l s l ss ll sl ls s l ss ll sl ls l s l s l l s s sl ls ls sl' },
        { id: 'home_a_semi', title: 'A and ;', keys: ['a', ';'], text: 'a ; a ; aa ;; a; ;a a ; aa ;; a; ;a ; a ; a ; ; a a a; ;a ;a a;' },
        { id: 'home_all', title: 'Full Home Row', keys: ['a','s','d','f','j','k','l',';'], text: 'asdf jkl; asdf jkl; a s d f j k l ; asdfjkl; fj dk sl a; lskd jf' },
        { id: 'home_words', title: 'Home Row Words', keys: ['a','s','d','f','j','k','l'], text: 'dad sad lad fall ask all salsa flask glass salads falls add dads' },
        { id: 'home_review', title: 'Home Row Review', keys: ['a','s','d','f','j','k','l',';'], text: 'dad; sad; fall; ask; flask; salsa; asdf jkl; jf dk sl a; glass;' }
    ],
    upper: [
        { id: 'upper_ei', title: 'E and I', keys: ['e', 'i'], text: 'e i e i ee ii ei ie e i ee ii ei ie i e i e i i e e ei ie ie ei' },
        { id: 'upper_ru', title: 'R and U', keys: ['r', 'u'], text: 'r u r u rr uu ru ur r u rr uu ru ur u r u r u u r r ru ur ur ru' },
        { id: 'upper_ty', title: 'T and Y', keys: ['t', 'y'], text: 't y t y tt yy ty yt t y tt yy ty yt y t y t y y t t ty yt yt ty' },
        { id: 'upper_wo', title: 'W and O', keys: ['w', 'o'], text: 'w o w o ww oo wo ow w o ww oo wo ow o w o w o o w w wo ow ow wo' },
        { id: 'upper_qp', title: 'Q and P', keys: ['q', 'p'], text: 'q p q p qq pp qp pq q p qq pp qp pq p q p q p p q q qp pq pq qp' },
        { id: 'upper_words', title: 'Upper Row Words', keys: ['e','i','r','u','t','y','w','o','q','p'], text: 'tree type power quiet upper write route wire pop wet pet row toy out' },
        { id: 'upper_review', title: 'Upper Row Review', keys: ['q','w','e','r','t','y','u','i','o','p'], text: 'quiet route to upper power. we write your type. poetry is wet toy.' }
    ],
    lower: [
        { id: 'lower_vm', title: 'V and M', keys: ['v', 'm'], text: 'v m v m vv mm vm mv v m vv mm vm mv m v v m m v v vm mv mv vm' },
        { id: 'lower_c_comma', title: 'C and ,', keys: ['c', ','], text: 'c , c , cc ,, c, ,c c , cc ,, c, ,c , c , c , , c c c, ,c ,c c,' },
        { id: 'lower_x_dot', title: 'X and .', keys: ['x', '.'], text: 'x . x . xx .. x. .x x . xx .. x. .x . x . x . . x x x. .x .x x.' },
        { id: 'lower_z_slash', title: 'Z and /', keys: ['z', '/'], text: 'z / z / zz // z/ /z z / zz // z/ /z / z / z / / z z z/ /z /z z/' },
        { id: 'lower_bn', title: 'B and N', keys: ['b', 'n'], text: 'b n b n bb nn bn nb b n bb nn bn nb n b n b n n b b bn nb nb bn' },
        { id: 'lower_words', title: 'Lower Row Words', keys: ['z','x','c','v','b','n','m',',','.','/'], text: 'van man box mix zone comma bottom vision zinc climb bank next new zone' },
        { id: 'lower_review', title: 'Lower Row Review', keys: ['a-z',',','.','/'], text: 'the brown fox jumps over a lazy dog. zinc, copper, brass, and gold.' }
    ],
    numbers: [
        { id: 'num_10', title: '1 and 0', keys: ['1', '0'], text: '1 0 1 0 11 00 10 01 100 1010 110 001 10 01 1001 0110' },
        { id: 'num_29', title: '2 and 9', keys: ['2', '9'], text: '2 9 2 9 22 99 29 92 929 229 992 209 290 1920 9021' },
        { id: 'num_38', title: '3 and 8', keys: ['3', '8'], text: '3 8 3 8 33 88 38 83 838 338 883 380 308 1983 8031' },
        { id: 'num_47', title: '4 and 7', keys: ['4', '7'], text: '4 7 4 7 44 77 47 74 747 447 774 470 407 1974 7041' },
        { id: 'num_56', title: '5 and 6', keys: ['5', '6'], text: '5 6 5 6 55 66 56 65 656 556 665 560 506 1956 6051' },
        { id: 'num_seq', title: 'Sequences & Review', keys: ['0-9'], text: '123 456 789 098 765 432 10 204 1000 9876 batch 7721 part 1058' }
    ],
    punctuation: [
        { id: 'punc_dot_comma', title: 'Period and Comma', keys: ['.', ','], text: 'hello, world. this is it, right here. green, blue, red. pass, fail.' },
        { id: 'punc_ques_slash', title: 'Question & Slash', keys: ['?', '/'], text: 'is it ready? pass/fail status. who is there? LG/204/test status?' },
        { id: 'punc_quotes', title: 'Quotes & Apostrophes', keys: ['"', "'"], text: 'it\'s "ready". machine\'s quality check. operator\'s "pass" result.' },
        { id: 'punc_colon_semi', title: 'Colon & Semicolon', keys: [':', ';'], text: 'status: active; error_count: 0; timestamp: 1230; code: "pass";' },
        { id: 'punc_brackets', title: 'Brackets & Braces', keys: ['[', ']', '{', '}'], text: '[PASS] {error: false} [STATION_204] {id: 1058} [batch: 7721]' }
    ],
    normal: [
        { id: 'norm_common', title: 'Common Sentences', keys: ['a-z'], text: 'the quick brown fox jumps over the lazy dog. type letters smoothly.' },
        { id: 'norm_business', title: 'Office Work', keys: ['a-z'], text: 'the operator confirmed the inspection result before uploading reports.' },
        { id: 'norm_technical', title: 'Technical Review', keys: ['a-z'], text: 'machine vision systems can detect defects before parts move forward.' }
    ],
    programmer: [
        { id: 'code_python', title: 'Python Code', keys: ['code'], text: 'def check_error(count):\n    if count > 0:\n        return False\n    return True' },
        { id: 'code_js', title: 'JavaScript', keys: ['code'], text: 'const checkQuality = (partId) => {\n    return partId !== null;\n};' },
        { id: 'code_html_css', title: 'HTML / CSS', keys: ['code'], text: '<div class="station" style="color: var(--neon-cyan);">\n    <p>LG-204 PASS</p>\n</div>' },
        { id: 'code_json', title: 'JSON Config', keys: ['code'], text: '{\n  "stationId": "LG-204",\n  "inspections": 1058,\n  "status": "PASS"\n}' },
        { id: 'code_sql', title: 'SQL Query', keys: ['code'], text: 'SELECT part_id, status FROM inspections WHERE status = \'PASS\';' }
    ],
    numpad: [
        { id: 'numpad_home', title: 'Numpad Home Row (4, 5, 6)', keys: ['4', '5', '6'], text: '4\n5\n6\n45\n56\n64\n456\n654' },
        { id: 'numpad_top', title: 'Numpad Top Row (7, 8, 9)', keys: ['7', '8', '9'], text: '7\n8\n9\n78\n89\n97\n789\n987' },
        { id: 'numpad_bottom', title: 'Numpad Bottom Row (1, 2, 3)', keys: ['1', '2', '3'], text: '1\n2\n3\n12\n23\n31\n123\n321' },
        { id: 'numpad_zero_dot', title: 'Numpad Zero and Decimal (0, .)', keys: ['0', '.'], text: '0\n.\n0.00\n0.12\n3.50\n9.99\n10.05' },
        { id: 'numpad_ops', title: 'Numpad Operators (+, -, *, /)', keys: ['+', '-', '*', '/'], text: '4+5\n6-2\n7*8\n9/3\n1+2-3\n8*9/2' },
        { id: 'numpad_all', title: 'Numeric Keypad Review', keys: ['0-9', '+', '-', '*', '/'], text: '145.20+36.80\n789-456*2/3\n1058*7721/204' }
    ]
};

// Word packs for games
const WORD_PACKS = {
    beginner: ['f', 'j', 'd', 'k', 's', 'l', 'a', ';', 'fj', 'jf', 'dk', 'kd', 'sl', 'ls', 'a;', ';a', 'asdf', 'jkl;'],
    intermediate: ['dad', 'sad', 'lad', 'fall', 'ask', 'all', 'salsa', 'flask', 'glass', 'salad', 'safe', 'desk', 'lead', 'jokes', 'flash', 'bottom', 'vision', 'zinc', 'next', 'box', 'mix', 'zone', 'comma'],
    advanced: [
        'quality', 'inspection', 'operator', 'confirmation', 'timestamp', 'machine vision', 'production', 'defects', 'fastener',
        'calibrating', 'measurement', 'tolerances', 'components', 'manufacturing', 'inspections', 'parameters', 'specification'
    ],
    programmer: [
        'function', 'return', 'const', 'let', 'import', 'export', 'class', 'error_count', 'partId', 'inspections', 'status',
        'SELECT', 'WHERE', 'False', 'True', 'stationId', 'undefined', 'document', 'canvas', 'AudioContext', 'oscillator'
    ],
    numpad: ['456', '789', '123', '405', '602', '7890', '1234', '5678', '9012', '1058', '7721', '204']
};

// --- RETRO SYNTH AUDIO ENGINE (Web Audio API) ---
let audioCtx = null;
let musicIntervalId = null;
let musicTempo = 125; // Beat step: 125ms (120 BPM 16th notes)
let chiptuneIndex = 0;
let isSfxEnabled = true;
let isMusicEnabled = true;
let sfxVolume = 0.5;
let musicVolume = 0.2;

// Melodic sequence loop (Progression: Am -> G -> F -> E)
const BASS_LINE = [
    'A2', 'A2', 'A2', 'A2', 'G2', 'G2', 'G2', 'G2',
    'F2', 'F2', 'F2', 'F2', 'E2', 'E2', 'E2', 'E2'
];
const MELODY_LINE = [
    'A4', 'C5', 'E5', 'A5', 'G4', 'B4', 'D5', 'G5',
    'F4', 'A4', 'C5', 'F5', 'E4', 'G#4', 'B4', 'E5'
];

const NOTE_FREQS = {
    'A2': 110.00, 'G2': 98.00, 'F2': 87.31, 'E2': 82.41,
    'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'B4': 493.88,
    'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99, 'A5': 880.00
};

function initAudio() {
    try {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume().catch(() => {});
        }
    } catch (e) {
        console.warn("AudioContext failed to initialize:", e);
    }
}

// Procedural sound synthesis functions
function playSfx(type) {
    if (!isSfxEnabled) return;
    initAudio();
    if (!audioCtx) return;

    const now = audioCtx.currentTime;
    const dest = audioCtx.destination;

    try {
        if (type === 'laser') {
            // Rapid downward sweep (triangle wave)
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(1100, now);
            osc.frequency.exponentialRampToValueAtTime(70, now + 0.14);
            
            gain.gain.setValueAtTime(sfxVolume * 0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
            
            osc.connect(gain);
            gain.connect(dest);
            osc.start(now);
            osc.stop(now + 0.15);
        } 
        else if (type === 'explosion') {
            // Decaying filtered noise arpeggio + low bass kick
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(120, now);
            osc.frequency.exponentialRampToValueAtTime(30, now + 0.35);

            gain.gain.setValueAtTime(sfxVolume * 0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

            osc.connect(gain);
            gain.connect(dest);
            osc.start(now);
            osc.stop(now + 0.36);

            // Noise buffer generator
            const bufferSize = audioCtx.sampleRate * 0.3;
            const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
            const data = noiseBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const noise = audioCtx.createBufferSource();
            noise.buffer = noiseBuffer;

            const noiseFilter = audioCtx.createBiquadFilter();
            noiseFilter.type = 'bandpass';
            noiseFilter.frequency.setValueAtTime(350, now);
            noiseFilter.Q.setValueAtTime(2.0, now);

            const noiseGain = audioCtx.createGain();
            noiseGain.gain.setValueAtTime(sfxVolume * 0.25, now);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

            noise.connect(noiseFilter);
            noiseFilter.connect(noiseGain);
            noiseGain.connect(dest);

            noise.start(now);
            noise.stop(now + 0.3);
        } 
        else if (type === 'crate_slide') {
            // Cute chirp sweep
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(580, now);
            osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);

            gain.gain.setValueAtTime(sfxVolume * 0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

            osc.connect(gain);
            gain.connect(dest);
            osc.start(now);
            osc.stop(now + 0.09);
        } 
        else if (type === 'crate_jam') {
            // Softer square wave buzzer (previously 0.15, now 0.04)
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(140, now);

            gain.gain.setValueAtTime(sfxVolume * 0.04, now);
            gain.gain.setValueAtTime(sfxVolume * 0.04, now + 0.08);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

            osc.connect(gain);
            gain.connect(dest);
            osc.start(now);
            osc.stop(now + 0.24);
        } 
        else if (type === 'rhythm_hit') {
            // Short sine click
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1500, now);
            
            gain.gain.setValueAtTime(sfxVolume * 0.18, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

            osc.connect(gain);
            gain.connect(dest);
            osc.start(now);
            osc.stop(now + 0.04);
        } 
        else if (type === 'click') {
            // Short retro click sound for button presses
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.exponentialRampToValueAtTime(150, now + 0.05);
            
            gain.gain.setValueAtTime(sfxVolume * 0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
            
            osc.connect(gain);
            gain.connect(dest);
            osc.start(now);
            osc.stop(now + 0.06);
        }
        else if (type === 'success') {
            // Major arpeggio notes arpeggiated
            const notes = ['C5', 'E5', 'G5', 'C6'];
            notes.forEach((note, idx) => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(NOTE_FREQS[note] || 523, now + idx * 0.08);

                gain.gain.setValueAtTime(sfxVolume * 0.15, now + idx * 0.08);
                gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);

                osc.connect(gain);
                gain.connect(dest);
                osc.start(now + idx * 0.08);
                osc.stop(now + idx * 0.08 + 0.27);
            });
        } 
        else if (type === 'failure') {
            // Descending sad glide
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(320, now);
            osc.frequency.linearRampToValueAtTime(90, now + 0.5);

            const lowpass = audioCtx.createBiquadFilter();
            lowpass.type = 'lowpass';
            lowpass.frequency.setValueAtTime(400, now);

            gain.gain.setValueAtTime(sfxVolume * 0.16, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

            osc.connect(lowpass);
            lowpass.connect(gain);
            gain.connect(dest);

            osc.start(now);
            osc.stop(now + 0.52);
        }
    } catch (e) {
        console.warn("Play SFX error:", e);
    }
}

// Background chiptune music scheduler
function startMusic() {
    stopMusic();
    if (!isMusicEnabled) return;
    initAudio();
    if (!audioCtx) return;

    chiptuneIndex = 0;
    
    function playStep() {
        if (!isMusicEnabled || !audioCtx) return;
        const now = audioCtx.currentTime;
        const dest = audioCtx.destination;

        try {
            // 1. Play Bass Note on every quarter step (beat index % 4 === 0)
            if (chiptuneIndex % 4 === 0) {
                const bassNote = BASS_LINE[Math.floor(chiptuneIndex / 4) % BASS_LINE.length];
                const freq = NOTE_FREQS[bassNote];
                if (freq) {
                    const osc = audioCtx.createOscillator();
                    const gain = audioCtx.createGain();
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(freq, now);

                    const filter = audioCtx.createBiquadFilter();
                    filter.type = 'lowpass';
                    filter.frequency.setValueAtTime(150, now);

                    gain.gain.setValueAtTime(musicVolume * 0.25, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

                    osc.connect(filter);
                    filter.connect(gain);
                    gain.connect(dest);
                    osc.start(now);
                    osc.stop(now + 0.48);
                }
            }

            // 2. Play lead voice on alternating beats (8th note pattern)
            if (chiptuneIndex % 2 === 0) {
                const melodyNote = MELODY_LINE[chiptuneIndex % MELODY_LINE.length];
                const freq = NOTE_FREQS[melodyNote];
                if (freq) {
                    const osc = audioCtx.createOscillator();
                    const gain = audioCtx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(freq, now);

                    gain.gain.setValueAtTime(musicVolume * 0.12, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

                    osc.connect(gain);
                    gain.connect(dest);
                    osc.start(now);
                    osc.stop(now + 0.24);
                }
            }

            // 3. Play simulated high-hat on off-beats
            if (chiptuneIndex % 2 !== 0) {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'triangle'; // triangle noise hit
                osc.frequency.setValueAtTime(12000, now);

                gain.gain.setValueAtTime(musicVolume * 0.04, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

                osc.connect(gain);
                gain.connect(dest);
                osc.start(now);
                osc.stop(now + 0.06);
            }

            chiptuneIndex++;
        } catch (e) {}

        musicIntervalId = setTimeout(playStep, musicTempo);
    }

    playStep();
}

function stopMusic() {
    if (musicIntervalId) {
        clearTimeout(musicIntervalId);
        musicIntervalId = null;
    }
}

// --- INTERACTIVE KEYBOARD GUIDE (Programmatic SVG Injection) ---
const KEY_ROWS_DEF = [
    [
        { key: '`', label: '`', w: 30, f: 'left-pinky' },
        { key: '1', label: '1', w: 30, f: 'left-pinky' },
        { key: '2', label: '2', w: 30, f: 'left-ring' },
        { key: '3', label: '3', w: 30, f: 'left-middle' },
        { key: '4', label: '4', w: 30, f: 'left-index' },
        { key: '5', label: '5', w: 30, f: 'left-index' },
        { key: '6', label: '6', w: 30, f: 'right-index' },
        { key: '7', label: '7', w: 30, f: 'right-index' },
        { key: '8', label: '8', w: 30, f: 'right-middle' },
        { key: '9', label: '9', w: 30, f: 'right-ring' },
        { key: '0', label: '0', w: 30, f: 'right-pinky' },
        { key: '-', label: '-', w: 30, f: 'right-pinky' },
        { key: '=', label: '=', w: 30, f: 'right-pinky' },
        { key: 'backspace', label: 'Back', w: 55, f: 'right-pinky' }
    ],
    [
        { key: 'tab', label: 'Tab', w: 45, f: 'left-pinky' },
        { key: 'q', label: 'Q', w: 30, f: 'left-pinky' },
        { key: 'w', label: 'W', w: 30, f: 'left-ring' },
        { key: 'e', label: 'E', w: 30, f: 'left-middle' },
        { key: 'r', label: 'R', w: 30, f: 'left-index' },
        { key: 't', label: 'T', w: 30, f: 'left-index' },
        { key: 'y', label: 'Y', w: 30, f: 'right-index' },
        { key: 'u', label: 'U', w: 30, f: 'right-index' },
        { key: 'i', label: 'I', w: 30, f: 'right-middle' },
        { key: 'o', label: 'O', w: 30, f: 'right-ring' },
        { key: 'p', label: 'P', w: 30, f: 'right-pinky' },
        { key: '[', label: '[', w: 30, f: 'right-pinky' },
        { key: ']', label: ']', w: 30, f: 'right-pinky' },
        { key: '\\', label: '\\', w: 40, f: 'right-pinky' }
    ],
    [
        { key: 'capslock', label: 'Caps', w: 50, f: 'left-pinky' },
        { key: 'a', label: 'A', w: 30, f: 'left-pinky' },
        { key: 's', label: 'S', w: 30, f: 'left-ring' },
        { key: 'd', label: 'D', w: 30, f: 'left-middle' },
        { key: 'f', label: 'F', w: 30, f: 'left-index' },
        { key: 'g', label: 'G', w: 30, f: 'left-index' },
        { key: 'h', label: 'H', w: 30, f: 'right-index' },
        { key: 'j', label: 'J', w: 30, f: 'right-index' },
        { key: 'k', label: 'K', w: 30, f: 'right-middle' },
        { key: 'l', label: 'L', w: 30, f: 'right-ring' },
        { key: ';', label: ';', w: 30, f: 'right-pinky' },
        { key: '\'', label: '\'', w: 30, f: 'right-pinky' },
        { key: 'enter', label: 'Enter', w: 65, f: 'right-pinky' }
    ],
    [
        { key: 'shiftleft', label: 'Shift', w: 70, f: 'left-pinky' },
        { key: 'z', label: 'Z', w: 30, f: 'left-pinky' },
        { key: 'x', label: 'X', w: 30, f: 'left-ring' },
        { key: 'c', label: 'C', w: 30, f: 'left-middle' },
        { key: 'v', label: 'V', w: 30, f: 'left-index' },
        { key: 'b', label: 'B', w: 30, f: 'left-index' },
        { key: 'n', label: 'N', w: 30, f: 'right-index' },
        { key: 'm', label: 'M', w: 30, f: 'right-index' },
        { key: ',', label: ',', w: 30, f: 'right-middle' },
        { key: '.', label: '.', w: 30, f: 'right-ring' },
        { key: '/', label: '/', w: 30, f: 'right-pinky' },
        { key: 'shiftright', label: 'Shift', w: 75, f: 'right-pinky' }
    ],
    [
        { key: 'controlleft', label: 'Ctrl', w: 50, f: 'left-pinky' },
        { key: 'meta', label: 'Win', w: 40, f: 'left-pinky' },
        { key: 'altleft', label: 'Alt', w: 40, f: 'thumbs' },
        { key: ' ', label: 'Space', w: 220, f: 'thumbs' },
        { key: 'altright', label: 'Alt', w: 40, f: 'thumbs' },
        { key: 'controlright', label: 'Ctrl', w: 50, f: 'right-pinky' }
    ]
];

// Helper to translate letters/characters to physical codes
const CHAR_TO_KEY = {
    ' ': ' ', '\n': 'enter', '`': '`', '~': '`', '!': '1', '@': '2', '#': '3', '$': '4', '%': '5',
    '^': '6', '&': '7', '*': '8', '(': '9', ')': '0', '_': '-', '+': '=', '{': '[', '}': ']',
    '|': '\\', ':': ';', '"': '\'', '<': ',', '>': '.', '?': '/'
};

function renderNumpadGuide(container) {
    let svgHTML = `<svg class="svg-keyboard numpad-layout" viewBox="0 0 134 166" fill="none" xmlns="http://www.w3.org/2000/svg" style="max-width: 150px; margin: 0 auto; display: block;">`;
    
    const keys = [
        // Row 0
        { key: 'numlock', label: 'NL', x: 5, y: 5, w: 28, h: 28, f: 'right-pinky' },
        { key: '/', label: '/', x: 37, y: 5, w: 28, h: 28, f: 'right-pinky' },
        { key: '*', label: '*', x: 69, y: 5, w: 28, h: 28, f: 'right-ring' },
        { key: '-', label: '-', x: 101, y: 5, w: 28, h: 28, f: 'right-pinky' },
        // Row 1
        { key: '7', label: '7', x: 5, y: 37, w: 28, h: 28, f: 'right-index' },
        { key: '8', label: '8', x: 37, y: 37, w: 28, h: 28, f: 'right-middle' },
        { key: '9', label: '9', x: 69, y: 37, w: 28, h: 28, f: 'right-ring' },
        { key: '+', label: '+', x: 101, y: 37, w: 28, h: 60, f: 'right-pinky' },
        // Row 2
        { key: '4', label: '4', x: 5, y: 69, w: 28, h: 28, f: 'right-index' },
        { key: '5', label: '5', x: 37, y: 69, w: 28, h: 28, f: 'right-middle' },
        { key: '6', label: '6', x: 69, y: 69, w: 28, h: 28, f: 'right-ring' },
        // Row 3
        { key: '1', label: '1', x: 5, y: 101, w: 28, h: 28, f: 'right-index' },
        { key: '2', label: '2', x: 37, y: 101, w: 28, h: 28, f: 'right-middle' },
        { key: '3', label: '3', x: 69, y: 101, w: 28, h: 28, f: 'right-ring' },
        { key: 'enter', label: 'Ent', x: 101, y: 101, w: 28, h: 60, f: 'right-pinky' },
        // Row 4
        { key: '0', label: '0', x: 5, y: 133, w: 60, h: 28, f: 'thumbs' },
        { key: '.', label: '.', x: 69, y: 133, w: 28, h: 28, f: 'right-middle' }
    ];

    keys.forEach(k => {
        const keyId = `key-numpad-${k.key.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
        svgHTML += `
            <g id="${keyId}">
                <rect class="kbd-key" x="${k.x}" y="${k.y}" width="${k.w}" height="${k.h}" rx="4" />
                <text class="kbd-text" x="${k.x + (k.w / 2)}" y="${k.y + (k.h / 2) + 5}">${k.label}</text>
            </g>`;
    });

    svgHTML += `</svg>`;
    container.innerHTML = svgHTML;
}

function renderKeyboardGuide() {
    const container = document.getElementById('svg-keyboard-container');
    if (!container) return;

    const isNumpad = selectedLesson && (selectedLesson.id.startsWith('numpad') || (selectedCategory && selectedCategory.id === 'numpad'));
    if (isNumpad) {
        renderNumpadGuide(container);
        return;
    }

    let svgHTML = `<svg class="svg-keyboard" viewBox="0 0 500 170" fill="none" xmlns="http://www.w3.org/2000/svg">`;
    
    let y = 5;
    KEY_ROWS_DEF.forEach(row => {
        let x = 5;
        row.forEach(k => {
            const keyId = `key-${k.key === ' ' ? 'space' : k.key.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
            svgHTML += `
                <g id="${keyId}">
                    <rect class="kbd-key" x="${x}" y="${y}" width="${k.w - 2}" height="28" />
                    <text class="kbd-text" x="${x + (k.w / 2) - 1}" y="${y + 15}">${k.label}</text>
                </g>`;
            x += k.w;
        });
        y += 32;
    });

    svgHTML += `</svg>`;
    container.innerHTML = svgHTML;
}

function highlightKeyboardKey(char, targetFinger = null) {
    // 1. Clear all previous highlights
    document.querySelectorAll('.kbd-key').forEach(el => {
        el.className.baseVal = 'kbd-key';
    });
    document.querySelectorAll('.finger-indicator').forEach(el => el.classList.remove('active'));

    if (!char) return;
    
    let lookupChar = char.toLowerCase();
    
    const isNumpad = selectedLesson && (selectedLesson.id.startsWith('numpad') || (selectedCategory && selectedCategory.id === 'numpad'));
    if (isNumpad) {
        let foundFinger = null;
        let numpadKeyName = lookupChar;
        
        // Map operators and digits for Numpad
        if (['7', '4', '1', '0'].includes(lookupChar)) foundFinger = 'right-index';
        else if (['8', '5', '2', '.'].includes(lookupChar)) foundFinger = 'right-middle';
        else if (['9', '6', '3', '*'].includes(lookupChar)) foundFinger = 'right-ring';
        else if (['/', '-', '+', '\n', 'enter'].includes(lookupChar)) foundFinger = 'right-pinky';
        
        if (lookupChar === ' ') {
            numpadKeyName = '0';
            foundFinger = 'thumbs';
        }
        if (lookupChar === '\n') numpadKeyName = 'enter';

        if (foundFinger) {
            const keyId = `key-numpad-${numpadKeyName.replace(/[^a-z0-9]/g, '_')}`;
            const keyGroup = document.getElementById(keyId);
            if (keyGroup) {
                const rect = keyGroup.querySelector('.kbd-key');
                if (rect) {
                    rect.className.baseVal = `kbd-key highlight-${foundFinger}`;
                }
            }
            const legendIndicator = document.querySelector(`.finger-indicator.${foundFinger}`);
            if (legendIndicator) legendIndicator.classList.add('active');
        }
        return;
    }

    if (CHAR_TO_KEY[lookupChar]) lookupChar = CHAR_TO_KEY[lookupChar];

    // Find key row definition
    let foundKey = null;
    for (let row of KEY_ROWS_DEF) {
        foundKey = row.find(k => k.key.toLowerCase() === lookupChar);
        if (foundKey) break;
    }

    if (foundKey) {
        const fingerClass = foundKey.f;
        const keyId = `key-${foundKey.key === ' ' ? 'space' : foundKey.key.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
        const keyGroup = document.getElementById(keyId);
        
        if (keyGroup) {
            const rect = keyGroup.querySelector('.kbd-key');
            if (rect) {
                rect.className.baseVal = `kbd-key highlight-${fingerClass}`;
            }
        }

        // Highlight recommended finger in the legend
        const legendIndicator = document.querySelector(`.finger-indicator.${fingerClass}`);
        if (legendIndicator) legendIndicator.classList.add('active');
    }
}

function highlightHomeRowKeys() {
    // Clear current highlights
    document.querySelectorAll('.kbd-key').forEach(el => el.className.baseVal = 'kbd-key');
    document.querySelectorAll('.finger-indicator').forEach(el => el.classList.remove('active'));

    const isNumpad = selectedLesson && (selectedLesson.id.startsWith('numpad') || (selectedCategory && selectedCategory.id === 'numpad'));
    if (isNumpad) {
        const numpadHomeKeys = [
            { key: '0', f: 'thumbs' },
            { key: '4', f: 'right-index' },
            { key: '5', f: 'right-middle' },
            { key: '6', f: 'right-ring' },
            { key: 'enter', f: 'right-pinky' }
        ];
        numpadHomeKeys.forEach(item => {
            const keyId = `key-numpad-${item.key}`;
            const keyGroup = document.getElementById(keyId);
            if (keyGroup) {
                const rect = keyGroup.querySelector('.kbd-key');
                if (rect) {
                    rect.className.baseVal = `kbd-key highlight-${item.f}`;
                }
            }
            const indicator = document.querySelector(`.finger-indicator.${item.f}`);
            if (indicator) indicator.classList.add('active');
        });
        return;
    }

    const homeRowKeys = [
        { key: 'a', f: 'left-pinky' },
        { key: 's', f: 'left-ring' },
        { key: 'd', f: 'left-middle' },
        { key: 'f', f: 'left-index' },
        { key: 'j', f: 'right-index' },
        { key: 'k', f: 'right-middle' },
        { key: 'l', f: 'right-ring' },
        { key: ';', f: 'right-pinky' }
    ];

    homeRowKeys.forEach(item => {
        const keyId = `key-${item.key === ';' ? '_' : item.key}`;
        const keyGroup = document.getElementById(keyId);
        if (keyGroup) {
            const rect = keyGroup.querySelector('.kbd-key');
            if (rect) {
                rect.className.baseVal = `kbd-key highlight-${item.f}`;
            }
        }
        
        // Also highlight finger legends
        const indicator = document.querySelector(`.finger-indicator.${item.f}`);
        if (indicator) indicator.classList.add('active');
    });
}

function highlightKeysForFinger(fingerClass) {
    if (document.querySelectorAll('.kbd-key').length === 0) return;
    
    // Clear other highlights
    document.querySelectorAll('.kbd-key').forEach(el => {
        el.className.baseVal = 'kbd-key';
    });
    if (!fingerClass) {
        if (drillIndex === 0 && drillStart === 0 && activeView === 'drill-view') {
            highlightHomeRowKeys();
        } else {
            highlightNextDrillKey();
        }
        return;
    }

    const isNumpad = selectedLesson && (selectedLesson.id.startsWith('numpad') || (selectedCategory && selectedCategory.id === 'numpad'));
    if (isNumpad) {
        const numpadKeysDef = [
            { key: 'numlock', f: 'right-pinky' },
            { key: '/', f: 'right-pinky' },
            { key: '*', f: 'right-ring' },
            { key: '-', f: 'right-pinky' },
            { key: '7', f: 'right-index' },
            { key: '8', f: 'right-middle' },
            { key: '9', f: 'right-ring' },
            { key: '+', f: 'right-pinky' },
            { key: '4', f: 'right-index' },
            { key: '5', f: 'right-middle' },
            { key: '6', f: 'right-ring' },
            { key: '1', f: 'right-index' },
            { key: '2', f: 'right-middle' },
            { key: '3', f: 'right-ring' },
            { key: 'enter', f: 'right-pinky' },
            { key: '0', f: 'thumbs' },
            { key: '.', f: 'right-middle' }
        ];
        
        numpadKeysDef.forEach(k => {
            if (k.f === fingerClass) {
                const keyId = `key-numpad-${k.key.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
                const keyGroup = document.getElementById(keyId);
                if (keyGroup) {
                    const rect = keyGroup.querySelector('.kbd-key');
                    if (rect) {
                        rect.className.baseVal = `kbd-key highlight-${fingerClass}`;
                    }
                }
            }
        });
        return;
    }

    // Highlight all keys belonging to this finger
    KEY_ROWS_DEF.forEach(row => {
        row.forEach(k => {
            if (k.f === fingerClass) {
                const keyId = `key-${k.key === ' ' ? 'space' : k.key.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
                const keyGroup = document.getElementById(keyId);
                if (keyGroup) {
                    const rect = keyGroup.querySelector('.kbd-key');
                    if (rect) {
                        rect.className.baseVal = `kbd-key highlight-${fingerClass}`;
                    }
                }
            }
        });
    });
}

// Visual click/key press simulation on keyboard guide
function handleKeyPressFeedback(key) {
    let lookupKey = key.toLowerCase();
    
    const isNumpad = selectedLesson && (selectedLesson.id.startsWith('numpad') || (selectedCategory && selectedCategory.id === 'numpad'));
    if (isNumpad) {
        let numpadKeyName = lookupKey;
        if (lookupKey === ' ') numpadKeyName = '0';
        if (lookupKey === 'enter') numpadKeyName = 'enter';
        
        const keyId = `key-numpad-${numpadKeyName.replace(/[^a-z0-9]/g, '_')}`;
        const keyGroup = document.getElementById(keyId);
        if (keyGroup) {
            const rect = keyGroup.querySelector('.kbd-key');
            if (rect) {
                rect.classList.add('pressed');
                setTimeout(() => rect.classList.remove('pressed'), 80);
            }
        }
        return;
    }

    if (lookupKey === 'alt') lookupKey = 'altleft';
    if (lookupKey === 'control') lookupKey = 'controlleft';
    if (lookupKey === 'shift') lookupKey = 'shiftleft';
    if (lookupKey === ' ') lookupKey = 'space';
    
    const keyId = `key-${lookupKey.replace(/[^a-z0-9]/g, '_')}`;
    const keyGroup = document.getElementById(keyId);
    if (keyGroup) {
        const rect = keyGroup.querySelector('.kbd-key');
        if (rect) {
            rect.classList.add('pressed');
            setTimeout(() => rect.classList.remove('pressed'), 80);
        }
    }
}

// --- APP ROUTER & GENERAL CONTROLS ---
let activeView = 'menu-view';
let selectedCategory = null;
let selectedLesson = null;
let currentActivity = null;

// High scores / Session variables
let sessionHistory = [];
let localScores = {};
const SAVE_KEY = 'homerow_scores';

function loadScores() {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
        try { localScores = JSON.parse(raw); } catch (e) { localScores = {}; }
    }
}
function saveScore(lessonId, activity, score, wpm, accuracy) {
    if (!document.getElementById('local-save-toggle').checked) return;
    const key = `${lessonId}_${activity}`;
    if (!localScores[key] || score > localScores[key].score) {
        localScores[key] = { score, wpm, accuracy, date: new Date().toLocaleDateString() };
        localStorage.setItem(SAVE_KEY, JSON.stringify(localScores));
    }
}

function switchView(viewId) {
    stopCurrentGameLoops();
    document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
    
    const target = document.getElementById(viewId);
    if (target) {
        target.classList.add('active');
        activeView = viewId;
    }
}

function stopCurrentGameLoops() {
    stopBlasterGame();
    stopCargoGame();
    stopRhythmGame();
    stopDrillMode();
    stopTestMode();
}

// --- GAME MODE 1: TRAINING DRILL (Home Row Academy) ---
let drillText = "";
let drillIndex = 0;
let drillErrors = 0;
let drillStart = 0;
let drillCorrects = 0;
let drillBackspaces = 0;
let drillMissedKeys = {};

function initDrillMode(lesson) {
    switchView('drill-view');
    
    // Dynamic course length extension (Tripled courses; Numbers/Numpad = 2-3 mins)
    const isNumpadOrNumber = lesson.id.startsWith('numpad') || lesson.id.startsWith('num_');
    const repeatsCount = isNumpadOrNumber ? 8 : 3;
    const separator = lesson.text.includes('\n') ? '\n' : ' ';
    drillText = Array(repeatsCount).fill(lesson.text).join(separator);

    drillIndex = 0;
    drillErrors = 0;
    drillCorrects = 0;
    drillBackspaces = 0;
    drillStart = 0;
    drillMissedKeys = {};

    document.getElementById('drill-title').textContent = `Academy Drill: ${lesson.title}`;
    document.getElementById('drill-wpm').textContent = '0';
    document.getElementById('drill-accuracy').textContent = '100%';
    document.getElementById('drill-errors').textContent = '0';
    document.getElementById('drill-feedback-char').textContent = 'Place fingers on HOME ROW (ASDF JKL;) & press any key to start...';
    document.getElementById('drill-feedback-char').style.color = 'var(--neon-cyan)';
    
    renderKeyboardGuide();
    renderDrillText();
    highlightHomeRowKeys();
}

function stopDrillMode() {
    // Clear keyboard highlights
    highlightKeyboardKey(null);
}

function renderDrillText() {
    const targetEl = document.getElementById('drill-target-text');
    if (!targetEl) return;
    
    let html = "";
    for (let i = 0; i < drillText.length; i++) {
        let char = drillText[i];
        let dispChar = char === ' ' ? '␣' : char;
        if (char === '\n') dispChar = '↵\n';
        
        let stateClass = '';
        if (i < drillIndex) {
            stateClass = 'correct';
        } else if (i === drillIndex) {
            stateClass = 'current';
        }
        
        html += `<span class="char ${stateClass}">${dispChar}</span>`;
    }
    targetEl.innerHTML = html;

    // Typewriter horizontal scrolling
    const charWidth = 32; 
    const parentWidth = targetEl.parentElement.getBoundingClientRect().width || 800;
    const offset = (parentWidth / 2) - (drillIndex * charWidth) - (charWidth / 2);
    targetEl.style.transform = `translateX(${offset}px)`;
}

function highlightNextDrillKey() {
    if (drillIndex < drillText.length) {
        highlightKeyboardKey(drillText[drillIndex]);
    } else {
        highlightKeyboardKey(null);
    }
}

function handleDrillInput(e) {
    if (drillIndex >= drillText.length) return;
    
    // Key presses like Shift/Caps should trigger keyboard feedback but not count as text input
    if (e.key.length > 1 && e.key !== 'Enter' && e.key !== 'Backspace') {
        handleKeyPressFeedback(e.key);
        return;
    }
    
    if (drillStart === 0) {
        drillStart = Date.now();
        highlightNextDrillKey();
    }
    
    const targetChar = drillText[drillIndex];
    let typedChar = e.key;
    if (typedChar === 'Enter') typedChar = '\n';

    handleKeyPressFeedback(e.key);

    if (e.key === 'Backspace') {
        drillBackspaces++;
        if (drillIndex > 0) {
            drillIndex--;
            renderDrillText();
            highlightNextDrillKey();
        }
        return;
    }

    if (typedChar === targetChar) {
        drillCorrects++;
        drillIndex++;
        playSfx('rhythm_hit');
        
        // Calculate WPM and Accuracy
        const elapsedMin = (Date.now() - drillStart) / 60000;
        const wpm = elapsedMin > 0 ? Math.round((drillCorrects / 5) / elapsedMin) : 0;
        const accuracy = Math.round((drillCorrects / (drillCorrects + drillErrors)) * 100);
        
        document.getElementById('drill-wpm').textContent = wpm;
        document.getElementById('drill-accuracy').textContent = `${accuracy}%`;
        
        if (drillIndex >= drillText.length) {
            // End of drill
            finishMission('Academy Drill', wpm, accuracy, drillErrors, wpm * 100);
        } else {
            renderDrillText();
            highlightNextDrillKey();
            document.getElementById('drill-feedback-char').textContent = 'Perfect!';
            document.getElementById('drill-feedback-char').style.color = 'var(--neon-green)';
        }
    } else {
        drillErrors++;
        playSfx('crate_jam');
        
        // Record missed key
        drillMissedKeys[targetChar] = (drillMissedKeys[targetChar] || 0) + 1;

        document.getElementById('drill-errors').textContent = drillErrors;
        const accuracy = Math.round((drillCorrects / (drillCorrects + drillErrors)) * 100);
        document.getElementById('drill-accuracy').textContent = `${accuracy}%`;
        
        document.getElementById('drill-feedback-char').textContent = `Typo! Expected "${targetChar === ' ' ? 'Space' : targetChar}"`;
        document.getElementById('drill-feedback-char').style.color = 'var(--neon-red)';
        
        // Flash current target red temporarily
        const targetEl = document.querySelectorAll('#drill-target-text .char')[drillIndex];
        if (targetEl) {
            targetEl.classList.add('incorrect');
            setTimeout(() => {
                targetEl.classList.remove('incorrect');
            }, 120);
        }
    }
}


// --- GAME MODE 2: SPEED GAME (Astro Type Blaster) ---
let blasterCanvas = null;
let blasterCtx = null;
let blasterLoopId = null;
let blasterAsteroids = [];
let blasterLasers = [];
let blasterScore = 0;
let blasterCombo = 1;
let blasterHealth = 100;
let blasterWordCount = 0;
let blasterCorrectChars = 0;
let blasterTotalAttempts = 0;
let blasterStartTime = 0;
let blasterTargetWord = null;
let blasterInputBuffer = "";
let lastAsteroidSpawn = 0;
let asteroidSpeedFactor = 1.0;
let currentBlasterWordpack = [];

class Asteroid {
    constructor(word, x, y, speed) {
        this.word = word;
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.activeCharIndex = 0;
        this.radius = 28 + word.length * 4;
        this.isDestroyed = false;
        this.angle = Math.random() * Math.PI * 2;
    }
    update() {
        this.y += this.speed * asteroidSpeedFactor;
        this.angle += 0.01;
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Draw rock outline
        ctx.strokeStyle = this === blasterTargetWord ? 'var(--neon-cyan)' : 'var(--text-muted)';
        ctx.lineWidth = this === blasterTargetWord ? 3 : 2;
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI * 2) / 8;
            const r = this.radius * (0.85 + Math.sin(angle * 3) * 0.1);
            const px = Math.cos(angle) * r;
            const py = Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.restore();

        // Draw text
        ctx.font = '14px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        
        // Split word into typed (green) and remaining (white)
        const typed = this.word.substring(0, this.activeCharIndex);
        const remaining = this.word.substring(this.activeCharIndex);
        
        const textWidth = ctx.measureText(this.word).width;
        let startX = this.x - textWidth / 2;
        
        ctx.fillStyle = 'var(--neon-green)';
        ctx.textAlign = 'left';
        ctx.fillText(typed, startX, this.y + 5);
        
        ctx.fillStyle = '#ffffff';
        ctx.fillText(remaining, startX + ctx.measureText(typed).width, this.y + 5);
    }
}

class Laser {
    constructor(sx, sy, tx, ty) {
        this.sx = sx;
        this.sy = sy;
        this.tx = tx;
        this.ty = ty;
        this.life = 1.0;
    }
    update() {
        this.life -= 0.1;
    }
    draw(ctx) {
        ctx.strokeStyle = `rgba(6, 182, 212, ${this.life})`;
        ctx.lineWidth = 4 * this.life;
        ctx.beginPath();
        ctx.moveTo(this.sx, this.sy);
        ctx.lineTo(this.tx, this.ty);
        ctx.stroke();
    }
}

function initBlasterGame(lessonOrPack) {
    switchView('blaster-view');
    blasterCanvas = document.getElementById('blaster-canvas');
    blasterCtx = blasterCanvas.getContext('2d');
    
    // Fit canvas resolution to bounding elements
    const rect = blasterCanvas.parentElement.getBoundingClientRect();
    blasterCanvas.width = rect.width;
    blasterCanvas.height = Math.max(380, rect.height);

    blasterAsteroids = [];
    blasterLasers = [];
    blasterScore = 0;
    blasterCombo = 1;
    blasterHealth = 100;
    blasterWordCount = 0;
    blasterCorrectChars = 0;
    blasterTotalAttempts = 0;
    blasterTargetWord = null;
    blasterInputBuffer = "";
    lastAsteroidSpawn = 0;
    blasterStartTime = Date.now();
    asteroidSpeedFactor = 1.0;

    // Load appropriate wordpack based on lesson keys
    if (lessonOrPack.id && lessonOrPack.id.startsWith('numpad')) {
        currentBlasterWordpack = [...WORD_PACKS.numpad];
    } else if (lessonOrPack.difficulty === 'numpad') {
        currentBlasterWordpack = [...WORD_PACKS.numpad];
    } else if (lessonOrPack.keys) {
        currentBlasterWordpack = [];
        if (lessonOrPack.keys.includes('code')) {
            currentBlasterWordpack = [...WORD_PACKS.programmer];
        } else {
            // Find letters in keys
            const keyLetters = lessonOrPack.keys.filter(k => k.length === 1);
            if (keyLetters.length > 0) {
                // Synthesize from letters
                currentBlasterWordpack = WORD_PACKS.beginner.concat(WORD_PACKS.intermediate).filter(w => {
                    return w.split('').every(ch => keyLetters.includes(ch));
                });
                if (currentBlasterWordpack.length === 0) {
                    currentBlasterWordpack = [...WORD_PACKS.beginner];
                }
            } else {
                currentBlasterWordpack = [...WORD_PACKS.intermediate];
            }
        }
    } else {
        currentBlasterWordpack = [...WORD_PACKS[lessonOrPack.difficulty || 'intermediate']];
    }

    document.getElementById('blaster-score').textContent = '00000';
    document.getElementById('blaster-combo').textContent = '1x';
    document.getElementById('blaster-health').textContent = '100%';
    document.getElementById('blaster-wpm').textContent = '0';
    document.getElementById('blaster-target-word').textContent = '-';
    document.getElementById('blaster-typed-val').textContent = '';

    blasterLoopId = requestAnimationFrame(blasterTick);
}

function stopBlasterGame() {
    if (blasterLoopId) {
        cancelAnimationFrame(blasterLoopId);
        blasterLoopId = null;
    }
}

function blasterTick() {
    const now = Date.now();
    blasterCtx.clearRect(0, 0, blasterCanvas.width, blasterCanvas.height);

    // Render Space Background (Cyber stars)
    blasterCtx.fillStyle = '#020617';
    blasterCtx.fillRect(0, 0, blasterCanvas.width, blasterCanvas.height);
    blasterCtx.fillStyle = 'rgba(255,255,255,0.03)';
    for(let i=0; i<30; i++) {
        let starX = (Math.sin(i*1203) * 0.5 + 0.5) * blasterCanvas.width;
        let starY = ((now * 0.05 + i*40) % blasterCanvas.height);
        blasterCtx.fillRect(starX, starY, 2, 2);
    }

    // Spawn asteroids (Balanced difficulty curve: slow spawns, soft ramp-up)
    if (now - lastAsteroidSpawn > Math.max(1000, 2500 - blasterScore / 15)) {
        const randWord = currentBlasterWordpack[Math.floor(Math.random() * currentBlasterWordpack.length)];
        const rx = 50 + Math.random() * (blasterCanvas.width - 100);
        blasterAsteroids.push(new Asteroid(randWord, rx, 0, 0.2 + Math.random() * 0.35));
        lastAsteroidSpawn = now;
        asteroidSpeedFactor = 1.0 + (blasterScore / 25000) * 0.1;
    }

    // Render Laser Blasters
    blasterLasers.forEach(laser => {
        laser.update();
        laser.draw(blasterCtx);
    });
    blasterLasers = blasterLasers.filter(l => l.life > 0);

    // Draw Ship at bottom center
    const shipX = blasterCanvas.width / 2;
    const shipY = blasterCanvas.height - 35;
    blasterCtx.strokeStyle = 'var(--neon-pink)';
    blasterCtx.lineWidth = 3;
    blasterCtx.fillStyle = '#0b0f19';
    blasterCtx.beginPath();
    blasterCtx.moveTo(shipX, shipY - 15);
    blasterCtx.lineTo(shipX - 18, shipY + 15);
    blasterCtx.lineTo(shipX + 18, shipY + 15);
    blasterCtx.closePath();
    blasterCtx.fill();
    blasterCtx.stroke();

    // Update & draw asteroids
    blasterAsteroids.forEach(ast => {
        ast.update();
        ast.draw(blasterCtx);

        // Check boundary collision with bottom
        if (ast.y + ast.radius >= blasterCanvas.height - 40) {
            ast.isDestroyed = true;
            blasterHealth = Math.max(0, blasterHealth - 15);
            playSfx('crate_jam');
            document.getElementById('blaster-health').textContent = `${blasterHealth}%`;
            
            // Check fail trigger
            if (blasterHealth <= 0) {
                stopBlasterGame();
                playSfx('failure');
                const elapsedMin = (Date.now() - blasterStartTime) / 60000;
                const wpm = Math.round((blasterCorrectChars / 5) / elapsedMin);
                const accuracy = blasterTotalAttempts > 0 ? Math.round((blasterCorrectChars / blasterTotalAttempts) * 100) : 0;
                finishMission('Astro Blaster', wpm, accuracy, blasterTotalAttempts - blasterCorrectChars, blasterScore);
            }

            if (ast === blasterTargetWord) {
                blasterTargetWord = null;
                blasterInputBuffer = "";
                document.getElementById('blaster-target-word').textContent = '-';
                document.getElementById('blaster-typed-val').textContent = '';
            }
        }
    });

    blasterAsteroids = blasterAsteroids.filter(a => !a.isDestroyed);

    if (blasterHealth > 0) {
        blasterLoopId = requestAnimationFrame(blasterTick);
    }
}

function handleBlasterInput(e) {
    if (e.key.length > 1) return; // skip modifier keys
    initAudio();

    const char = e.key;
    blasterTotalAttempts++;

    // Try to find a target if none is locked
    if (!blasterTargetWord) {
        const match = blasterAsteroids.find(a => a.word.startsWith(char));
        if (match) {
            blasterTargetWord = match;
            blasterInputBuffer = char;
            blasterTargetWord.activeCharIndex = 1;
            blasterCorrectChars++;
            playSfx('laser');
            
            // Add laser
            blasterLasers.push(new Laser(blasterCanvas.width/2, blasterCanvas.height - 35, blasterTargetWord.x, blasterTargetWord.y));
            
            document.getElementById('blaster-target-word').textContent = blasterTargetWord.word;
            document.getElementById('blaster-typed-val').textContent = blasterInputBuffer;
        } else {
            // Mistake
            blasterCombo = 1;
            document.getElementById('blaster-combo').textContent = '1x';
            playSfx('crate_jam');
        }
    } else {
        // We have a target. Check next character
        const nextChar = blasterTargetWord.word[blasterTargetWord.activeCharIndex];
        if (char === nextChar) {
            blasterInputBuffer += char;
            blasterTargetWord.activeCharIndex++;
            blasterCorrectChars++;
            playSfx('laser');

            blasterLasers.push(new Laser(blasterCanvas.width/2, blasterCanvas.height - 35, blasterTargetWord.x, blasterTargetWord.y));
            
            document.getElementById('blaster-typed-val').textContent = blasterInputBuffer;

            // Check if word is complete
            if (blasterTargetWord.activeCharIndex >= blasterTargetWord.word.length) {
                blasterTargetWord.isDestroyed = true;
                playSfx('explosion');
                
                // Add score
                const baseScore = blasterTargetWord.word.length * 100;
                blasterScore += baseScore * blasterCombo;
                blasterCombo = Math.min(8, blasterCombo + 1);
                
                blasterWordCount++;

                document.getElementById('blaster-score').textContent = String(blasterScore).padStart(5, '0');
                document.getElementById('blaster-combo').textContent = `${blasterCombo}x`;

                blasterTargetWord = null;
                blasterInputBuffer = "";
                document.getElementById('blaster-target-word').textContent = '-';
                document.getElementById('blaster-typed-val').textContent = '';
            }
        } else {
            // Typo
            blasterCombo = 1;
            document.getElementById('blaster-combo').textContent = '1x';
            playSfx('crate_jam');
        }
    }

    // Update live metrics
    const elapsedMin = (Date.now() - blasterStartTime) / 60000;
    const wpm = elapsedMin > 0 ? Math.round((blasterCorrectChars / 5) / elapsedMin) : 0;
    const accuracy = blasterTotalAttempts > 0 ? Math.round((blasterCorrectChars / blasterTotalAttempts) * 100) : 100;
    document.getElementById('blaster-wpm').textContent = wpm;
    document.getElementById('blaster-accuracy').textContent = `${accuracy}%`;
}


// --- GAME MODE 3: ACCURACY GAME (Cargo Sorter) ---
let cargoCanvas = null;
let cargoCtx = null;
let cargoLoopId = null;
let cargoCrates = [];
let cargoScore = 0;
let cargoSortedCount = 0;
let cargoAccuracy = 100;
let cargoCorrects = 0;
let cargoErrors = 0;
let cargoTotalAttempts = 0;
let cargoStartTime = 0;
let currentCargoWordpack = [];
let cargoCrateWidth = 140;
let cargoCrateHeight = 44;
let conveyorJammed = false;
let lastCrateSpawn = 0;
let cargoTargetCrate = null;

class Crate {
    constructor(word, x, y, speed, lane) {
        this.word = word;
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.typedBuffer = "";
        this.isSorted = false;
        this.isJammed = false;
        this.lane = lane;
    }
    update() {
        if (!conveyorJammed) {
            this.x += this.speed;
        }
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Crate block border: Locked target = cyan, Jammed = red, Idle = orange
        let borderStyle = 'var(--neon-orange)';
        if (this.isJammed) borderStyle = 'var(--neon-red)';
        else if (this === cargoTargetCrate) borderStyle = 'var(--neon-cyan)';

        ctx.strokeStyle = borderStyle;
        ctx.lineWidth = this === cargoTargetCrate ? 3 : 2;
        ctx.fillStyle = '#1e1b18';
        ctx.fillRect(0, 0, cargoCrateWidth, cargoCrateHeight);
        ctx.strokeRect(0, 0, cargoCrateWidth, cargoCrateHeight);

        // Highlight visual brackets
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.beginPath();
        ctx.moveTo(10, 10); ctx.lineTo(cargoCrateWidth - 10, 10);
        ctx.lineTo(cargoCrateWidth - 10, cargoCrateHeight - 10);
        ctx.lineTo(10, cargoCrateHeight - 10);
        ctx.closePath();
        ctx.stroke();

        ctx.restore();

        // Text drawing on crate center
        ctx.font = 'bold 13px "JetBrains Mono", monospace';
        
        const textX = this.x + cargoCrateWidth / 2;
        let textY = this.y + cargoCrateHeight / 2 + 5;

        // Split text colors based on typos
        let correctLen = 0;
        for (let i = 0; i < this.typedBuffer.length; i++) {
            if (this.typedBuffer[i] === this.word[i]) {
                correctLen++;
            } else {
                break;
            }
        }
        
        let correctPart = this.word.substring(0, correctLen);
        let typoPart = this.typedBuffer.substring(correctLen);
        let remainingPart = this.word.substring(this.typedBuffer.length);
        
        let isReady = false;
        if (this === cargoTargetCrate && this.typedBuffer === this.word) {
            correctPart += " ␣";
            isReady = true;
            textY = this.y + cargoCrateHeight / 2 - 2; // Shift up slightly
        }

        const totalWidth = ctx.measureText(correctPart + typoPart + remainingPart).width;
        let startX = textX - totalWidth / 2;
        ctx.textAlign = 'left';
        
        // Correct prefix in green
        ctx.fillStyle = 'var(--neon-green)';
        ctx.fillText(correctPart, startX, textY);
        startX += ctx.measureText(correctPart).width;
        
        // Typo suffix in red
        ctx.fillStyle = 'var(--neon-red)';
        ctx.fillText(typoPart, startX, textY);
        startX += ctx.measureText(typoPart).width;
        
        // Untyped suffix in white
        ctx.fillStyle = '#ffffff';
        ctx.fillText(remainingPart, startX, textY);

        // Flashing PRESS SPACE subtitle on the crate
        if (isReady) {
            const flash = Math.floor(Date.now() / 250) % 2 === 0;
            if (flash) {
                ctx.font = 'bold 9px "JetBrains Mono", monospace';
                ctx.textAlign = 'center';
                ctx.fillStyle = 'var(--neon-cyan)';
                ctx.fillText('PRESS SPACE', textX, this.y + 36);
            }
        }
    }
}

function initCargoGame(lessonOrPack) {
    switchView('cargo-view');
    cargoCanvas = document.getElementById('cargo-canvas');
    cargoCtx = cargoCanvas.getContext('2d');

    const rect = cargoCanvas.parentElement.getBoundingClientRect();
    cargoCanvas.width = rect.width;
    cargoCanvas.height = Math.max(340, rect.height);

    cargoCrates = [];
    cargoTargetCrate = null;
    document.getElementById('cargo-typed-val').textContent = '';
    cargoScore = 0;
    cargoSortedCount = 0;
    cargoAccuracy = 100;
    cargoCorrects = 0;
    cargoErrors = 0;
    cargoTotalAttempts = 0;
    cargoStartTime = Date.now();
    conveyorJammed = false;
    lastCrateSpawn = 0;

    if (lessonOrPack.keys) {
        currentCargoWordpack = [];
        if (lessonOrPack.keys.includes('code')) {
            currentCargoWordpack = [...WORD_PACKS.programmer];
        } else {
            const keyLetters = lessonOrPack.keys.filter(k => k.length === 1);
            if (keyLetters.length > 0) {
                currentCargoWordpack = WORD_PACKS.beginner.concat(WORD_PACKS.intermediate).filter(w => {
                    return w.split('').every(ch => keyLetters.includes(ch));
                });
                if (currentCargoWordpack.length === 0) {
                    currentCargoWordpack = [...WORD_PACKS.beginner];
                }
            } else {
                currentCargoWordpack = [...WORD_PACKS.intermediate];
            }
        }
    } else {
        currentCargoWordpack = [...WORD_PACKS[lessonOrPack.difficulty || 'intermediate']];
    }

    document.getElementById('cargo-score').textContent = '0';
    document.getElementById('cargo-count').textContent = '0';
    document.getElementById('cargo-jam-status').textContent = 'LINE OK';
    document.getElementById('cargo-jam-status').style.color = 'var(--neon-green)';
    document.getElementById('cargo-accuracy').textContent = '100%';
    document.getElementById('cargo-jam-alert').classList.add('hidden');
    document.getElementById('cargo-crate-target').textContent = '-';

    cargoLoopId = requestAnimationFrame(cargoTick);
}

function stopCargoGame() {
    if (cargoLoopId) {
        cancelAnimationFrame(cargoLoopId);
        cargoLoopId = null;
    }
}

function cargoTick() {
    const now = Date.now();
    cargoCtx.clearRect(0, 0, cargoCanvas.width, cargoCanvas.height);

    // Draw 4 conveyor background belt tracks
    for (let lane = 0; lane < 4; lane++) {
        let beltY = 30 + lane * 75;
        // belt background
        cargoCtx.fillStyle = '#0c0f1d';
        cargoCtx.fillRect(0, beltY + 18, cargoCanvas.width, 30);
        // belt frame lines
        cargoCtx.fillStyle = '#1e293b';
        cargoCtx.fillRect(0, beltY + 15, cargoCanvas.width, 3);
        cargoCtx.fillRect(0, beltY + 48, cargoCanvas.width, 3);
        
        // Animated rollers
        cargoCtx.strokeStyle = '#334155';
        cargoCtx.lineWidth = 1;
        let offset = conveyorJammed ? 0 : (now / 20) % 30;
        for (let x = offset; x < cargoCanvas.width; x += 30) {
            cargoCtx.beginPath();
            cargoCtx.arc(x, beltY + 33, 5, 0, Math.PI * 2);
            cargoCtx.stroke();
        }
    }

    // Spawn crates in lanes dynamically
    if (cargoCrates.length < 4 && now - lastCrateSpawn > 1500) {
        // Find lanes that are clear at the spawn area (x < 150)
        const busyLanes = cargoCrates.filter(c => c.x < 150).map(c => c.lane);
        const freeLanes = [0, 1, 2, 3].filter(l => !busyLanes.includes(l));
        
        if (freeLanes.length > 0) {
            const lane = freeLanes[Math.floor(Math.random() * freeLanes.length)];
            const word = currentCargoWordpack[Math.floor(Math.random() * currentCargoWordpack.length)];
            const y = 30 + lane * 75 + 5; // offset slightly within lane
            cargoCrates.push(new Crate(word, -cargoCrateWidth, y, 0.6 + Math.random() * 0.4, lane));
            lastCrateSpawn = now;
            updateCargoTargetDisplay();
        }
    }

    // Draw loading portal
    cargoCtx.fillStyle = '#1e293b';
    cargoCtx.fillRect(cargoCanvas.width - 50, 15, 50, 310);
    cargoCtx.strokeStyle = 'var(--neon-orange)';
    cargoCtx.lineWidth = 3;
    cargoCtx.strokeRect(cargoCanvas.width - 50, 15, 50, 310);

    // Update & Render crates
    let isGameOver = false;
    cargoCrates.forEach(c => {
        c.update();
        c.draw(cargoCtx);

        // Crate reaches loading portal unsorted -> Game Over!
        if (c.x + cargoCrateWidth >= cargoCanvas.width - 50) {
            isGameOver = true;
        }
    });

    if (isGameOver) {
        stopCargoGame();
        playSfx('failure');
        const elapsedMin = (Date.now() - cargoStartTime) / 60000;
        const wpm = elapsedMin > 0 ? Math.round((cargoCorrects / 5) / elapsedMin) : 0;
        finishMission('Cargo Sorter (Failed)', wpm, cargoAccuracy, cargoErrors, cargoScore);
        
        // Update results display style for failure
        document.getElementById('results-headline').textContent = 'MISSION FAILED';
        document.getElementById('results-headline').style.color = 'var(--neon-red)';
        return;
    }

    cargoCrates = cargoCrates.filter(c => !c.isSorted);

    // If game has sorted 10 crates, complete mission
    if (cargoSortedCount >= 10) {
        stopCargoGame();
        playSfx('success');
        const elapsedMin = (Date.now() - cargoStartTime) / 60000;
        const wpm = Math.round((cargoCorrects / 5) / elapsedMin);
        finishMission('Cargo Sorter', wpm, cargoAccuracy, cargoErrors, cargoScore);
        document.getElementById('results-headline').textContent = 'MISSION COMPLETE';
        document.getElementById('results-headline').style.color = 'var(--neon-green)';
    } else {
        cargoLoopId = requestAnimationFrame(cargoTick);
    }
}

function triggerCargoConveyorJam(jammed) {
    conveyorJammed = jammed;
    const overlay = document.getElementById('cargo-jam-alert');
    const statusText = document.getElementById('cargo-jam-status');
    
    if (jammed) {
        overlay.classList.remove('hidden');
        statusText.textContent = 'LINE JAMMED';
        statusText.style.color = 'var(--neon-red)';
        playSfx('crate_jam');
    } else {
        overlay.classList.add('hidden');
        statusText.textContent = 'LINE OK';
        statusText.style.color = 'var(--neon-green)';
    }
}

function updateCargoTargetDisplay() {
    const displayEl = document.getElementById('cargo-crate-target');
    const typedEl = document.getElementById('cargo-typed-val');
    const activeTextContainer = displayEl.parentElement;
    
    if (cargoTargetCrate) {
        if (cargoTargetCrate.typedBuffer === cargoTargetCrate.word) {
            displayEl.textContent = `${cargoTargetCrate.word} (Lane ${cargoTargetCrate.lane + 1}) [READY - PRESS SPACE]`;
            activeTextContainer.classList.add('flash-text');
        } else {
            displayEl.textContent = `${cargoTargetCrate.word} (Lane ${cargoTargetCrate.lane + 1})`;
            activeTextContainer.classList.remove('flash-text');
        }
        typedEl.textContent = cargoTargetCrate.typedBuffer;
    } else {
        if (cargoCrates.length > 0) {
            let closest = cargoCrates[0];
            cargoCrates.forEach(c => {
                if (c.x > closest.x) closest = c;
            });
            displayEl.textContent = `${closest.word} (Lane ${closest.lane + 1})`;
        } else {
            displayEl.textContent = '-';
        }
        activeTextContainer.classList.remove('flash-text');
        typedEl.textContent = '';
    }
}

function handleCargoInput(e) {
    if (cargoCrates.length === 0) return;
    initAudio();

    cargoTotalAttempts++;

    if (e.key === 'Backspace') {
        if (cargoTargetCrate && cargoTargetCrate.typedBuffer.length > 0) {
            cargoTargetCrate.typedBuffer = cargoTargetCrate.typedBuffer.slice(0, -1);
            
            // Check if there are still any typos in the buffer
            let hasTypo = false;
            for (let i = 0; i < cargoTargetCrate.typedBuffer.length; i++) {
                if (cargoTargetCrate.typedBuffer[i] !== cargoTargetCrate.word[i]) {
                    hasTypo = true;
                    break;
                }
            }
            
            if (!hasTypo) {
                cargoTargetCrate.isJammed = false;
                triggerCargoConveyorJam(false);
            }
        }
        updateCargoTargetDisplay();
        return;
    }

    if (e.key === ' ') {
        if (cargoTargetCrate) {
            if (cargoTargetCrate.typedBuffer === cargoTargetCrate.word) {
                // Sorted successfully
                cargoTargetCrate.isSorted = true;
                cargoSortedCount++;
                cargoScore += cargoTargetCrate.word.length * 150;
                playSfx('crate_slide');
                
                document.getElementById('cargo-score').textContent = cargoScore;
                document.getElementById('cargo-count').textContent = cargoSortedCount;
                
                // Remove crate from active conveyor rendering list
                cargoCrates = cargoCrates.filter(c => c !== cargoTargetCrate);
                cargoTargetCrate = null;
                updateCargoTargetDisplay();
            } else {
                // Incomplete word submitted
                cargoErrors++;
                triggerCargoConveyorJam(true);
            }
        }
        return;
    }

    if (e.key.length > 1) return;

    const char = e.key;

    if (!cargoTargetCrate) {
        // Find target: search active crates that start with this character
        // Sort them by highest X coordinate (closest to the loading portal)
        const candidates = cargoCrates.filter(c => c.word.startsWith(char) && !c.isSorted && !c.isJammed);
        if (candidates.length > 0) {
            candidates.sort((a, b) => b.x - a.x);
            cargoTargetCrate = candidates[0];
            cargoTargetCrate.typedBuffer = char;
            cargoCorrects++;
            playSfx('rhythm_hit');
        } else {
            // Mistake: jam conveyor line
            cargoErrors++;
            triggerCargoConveyorJam(true);
        }
    } else {
        // We already have a target.
        const nextCharIndex = cargoTargetCrate.typedBuffer.length;
        
        // If they already have a typo in the buffer, typing more keys just appends them and keeps line jammed
        let hasTypo = false;
        for (let i = 0; i < cargoTargetCrate.typedBuffer.length; i++) {
            if (cargoTargetCrate.typedBuffer[i] !== cargoTargetCrate.word[i]) {
                hasTypo = true;
                break;
            }
        }

        if (hasTypo) {
            // Append the extra typo key to buffer so they can see and backspace it
            if (cargoTargetCrate.typedBuffer.length < cargoTargetCrate.word.length + 5) {
                cargoTargetCrate.typedBuffer += char;
            }
            cargoErrors++;
            playSfx('crate_jam');
        } else {
            // No current typo. Check if new key matches expectation
            if (nextCharIndex < cargoTargetCrate.word.length) {
                const expected = cargoTargetCrate.word[nextCharIndex];
                if (char === expected) {
                    cargoTargetCrate.typedBuffer += char;
                    cargoCorrects++;
                    playSfx('rhythm_hit');
                } else {
                    // New typo made!
                    cargoTargetCrate.typedBuffer += char;
                    cargoErrors++;
                    cargoTargetCrate.isJammed = true;
                    triggerCargoConveyorJam(true);
                }
            } else {
                // Crate fully typed, typing more keys before pressing Enter is an error
                cargoErrors++;
                playSfx('crate_jam');
            }
        }
    }

    // Recalculate metrics
    cargoAccuracy = cargoTotalAttempts > 0 ? Math.round((cargoCorrects / cargoTotalAttempts) * 100) : 100;
    document.getElementById('cargo-accuracy').textContent = `${cargoAccuracy}%`;
    updateCargoTargetDisplay();
}


// --- GAME MODE 4: RHYTHM GAME (Rhythm Keys) ---
let rhythmCanvas = null;
let rhythmCtx = null;
let rhythmLoopId = null;
let rhythmScore = 0;
let rhythmCombo = 1;
let rhythmHitsCount = 0;
let rhythmAccuracy = 100;
let rhythmCorrects = 0;
let rhythmErrors = 0;
let rhythmTotalAttempts = 0;
let rhythmNotes = [];
let lastNoteSpawn = 0;
let rhythmStartTime = 0;
let currentRhythmPack = [];

const TARGET_LINE_Y = 320; // rhythm thresholds

class RhythmNote {
    constructor(char, x, y, speed) {
        this.char = char;
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.isHit = false;
        this.isMissed = false;
    }
    update() {
        this.y += this.speed;
        if (this.y > TARGET_LINE_Y + 25 && !this.isHit && !this.isMissed) {
            this.isMissed = true;
            triggerRhythmFeedback('MISS');
        }
    }
    draw(ctx) {
        if (this.isHit) return;
        ctx.save();
        ctx.translate(this.x, this.y);

        // Circular note glowing bubble
        ctx.strokeStyle = this.isMissed ? 'var(--neon-red)' : 'var(--neon-purple)';
        ctx.lineWidth = 3;
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.restore();

        // Note letter
        ctx.font = 'bold 15px "JetBrains Mono", monospace';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(this.char, this.x, this.y + 5);
    }
}

function initRhythmGame(lessonOrPack) {
    switchView('rhythm-view');
    rhythmCanvas = document.getElementById('rhythm-canvas');
    rhythmCtx = rhythmCanvas.getContext('2d');

    const rect = rhythmCanvas.parentElement.getBoundingClientRect();
    rhythmCanvas.width = rect.width;
    rhythmCanvas.height = Math.max(380, rect.height);

    rhythmNotes = [];
    rhythmScore = 0;
    rhythmCombo = 1;
    rhythmHitsCount = 0;
    rhythmAccuracy = 100;
    rhythmCorrects = 0;
    rhythmErrors = 0;
    rhythmTotalAttempts = 0;
    rhythmStartTime = Date.now();
    lastNoteSpawn = 0;

    if (lessonOrPack.keys) {
        currentRhythmPack = [];
        const keyLetters = lessonOrPack.keys.filter(k => k.length === 1);
        if (keyLetters.length > 0) {
            currentRhythmPack = [...keyLetters];
        } else {
            currentRhythmPack = ['f', 'j', 'd', 'k', 's', 'l'];
        }
    } else {
        currentRhythmPack = ['f', 'j', 'd', 'k', 's', 'l', 'a', ';'];
    }

    document.getElementById('rhythm-score').textContent = '0';
    document.getElementById('rhythm-combo').textContent = '1x';
    document.getElementById('rhythm-accuracy').textContent = '100%';
    document.getElementById('rhythm-timing-status').textContent = 'READY';
    document.getElementById('rhythm-timing-status').style.color = 'var(--text-muted)';

    rhythmLoopId = requestAnimationFrame(rhythmTick);
}

function stopRhythmGame() {
    if (rhythmLoopId) {
        cancelAnimationFrame(rhythmLoopId);
        rhythmLoopId = null;
    }
}

function rhythmTick() {
    const now = Date.now();
    rhythmCtx.clearRect(0, 0, rhythmCanvas.width, rhythmCanvas.height);

    // Draw scrolling background lines
    rhythmCtx.strokeStyle = 'rgba(255,255,255,0.02)';
    rhythmCtx.lineWidth = 1;
    for (let x = 60; x < rhythmCanvas.width; x += 80) {
        rhythmCtx.beginPath();
        rhythmCtx.moveTo(x, 0);
        rhythmCtx.lineTo(x, rhythmCanvas.height);
        rhythmCtx.stroke();
    }

    // Draw target threshold sync line
    rhythmCtx.strokeStyle = 'var(--neon-cyan)';
    rhythmCtx.lineWidth = 3;
    rhythmCtx.beginPath();
    rhythmCtx.moveTo(0, TARGET_LINE_Y);
    rhythmCtx.lineTo(rhythmCanvas.width, TARGET_LINE_Y);
    rhythmCtx.stroke();
    
    // Draw neon halo glow under line
    rhythmCtx.fillStyle = 'rgba(6, 182, 212, 0.08)';
    rhythmCtx.fillRect(0, TARGET_LINE_Y - 15, rhythmCanvas.width, 30);

    // Spawn falling notes on tracks (randomly lower or upper case)
    if (now - lastNoteSpawn > 1000) {
        let char = currentRhythmPack[Math.floor(Math.random() * currentRhythmPack.length)];
        if (Math.random() > 0.5) {
            char = char.toUpperCase();
        }
        const trackCount = Math.floor(rhythmCanvas.width / 80);
        const randTrack = Math.floor(Math.random() * Math.max(1, trackCount - 1)) + 1;
        const rx = randTrack * 80;
        
        rhythmNotes.push(new RhythmNote(char, rx, 0, 1.8));
        lastNoteSpawn = now;
    }

    // Update & draw notes
    rhythmNotes.forEach(n => {
        n.update();
        n.draw(rhythmCtx);
    });

    rhythmNotes = rhythmNotes.filter(n => !n.isHit && n.y < rhythmCanvas.height);

    // Game ends after 15 notes
    if (rhythmTotalAttempts >= 15) {
        stopRhythmGame();
        playSfx('success');
        const elapsedMin = (Date.now() - rhythmStartTime) / 60000;
        const wpm = Math.round((rhythmCorrects / 5) / elapsedMin);
        finishMission('Rhythm Keys', wpm, rhythmAccuracy, rhythmErrors, rhythmScore);
    } else {
        rhythmLoopId = requestAnimationFrame(rhythmTick);
    }
}

function triggerRhythmFeedback(status) {
    const statusEl = document.getElementById('rhythm-timing-status');
    statusEl.textContent = status;
    
    if (status === 'PERFECT') {
        statusEl.style.color = 'var(--neon-cyan)';
        rhythmScore += 300 * rhythmCombo;
        rhythmCombo = Math.min(8, rhythmCombo + 1);
        rhythmCorrects++;
        playSfx('rhythm_hit');
    } else if (status === 'GOOD') {
        statusEl.style.color = 'var(--neon-green)';
        rhythmScore += 150 * rhythmCombo;
        rhythmCombo = Math.min(8, rhythmCombo + 1);
        rhythmCorrects++;
        playSfx('rhythm_hit');
    } else if (status === 'LATE') {
        statusEl.style.color = 'var(--neon-yellow)';
        rhythmScore += 50 * rhythmCombo;
        rhythmCombo = 1;
        rhythmCorrects++;
        playSfx('rhythm_hit');
    } else {
        // MISS
        statusEl.style.color = 'var(--neon-red)';
        rhythmCombo = 1;
        rhythmErrors++;
        playSfx('crate_jam');
    }

    rhythmTotalAttempts++;
    document.getElementById('rhythm-score').textContent = rhythmScore;
    document.getElementById('rhythm-combo').textContent = `${rhythmCombo}x`;
    rhythmAccuracy = Math.round((rhythmCorrects / rhythmTotalAttempts) * 100);
    document.getElementById('rhythm-accuracy').textContent = `${rhythmAccuracy}%`;
}

function handleRhythmInput(e) {
    if (e.key.length > 1) return;
    initAudio();

    const char = e.key.toLowerCase();
    
    // Find closest note matching char
    let matchedNote = null;
    let minDistance = 9999;
    
    rhythmNotes.forEach(n => {
        if (n.char.toLowerCase() === char && !n.isHit && !n.isMissed) {
            const dist = Math.abs(n.y - TARGET_LINE_Y);
            if (dist < minDistance) {
                minDistance = dist;
                matchedNote = n;
            }
        }
    });

    if (matchedNote) {
        matchedNote.isHit = true;
        if (minDistance <= 12) {
            triggerRhythmFeedback('PERFECT');
        } else if (minDistance <= 25) {
            triggerRhythmFeedback('GOOD');
        } else if (minDistance <= 40) {
            triggerRhythmFeedback('LATE');
        } else {
            triggerRhythmFeedback('MISS');
        }
    } else {
        // Punish typing letters when no notes are near
        triggerRhythmFeedback('MISS');
    }
}


// --- GAME MODE 5: TYPING TEST VIEW ---
let testIntervalId = null;
let testTimeLeft = 60;
let testCorrects = 0;
let testErrors = 0;
let testTotalChars = 0;
let testStart = 0;
let testWordsArray = [];
let testTypedIndex = 0;
let testMissedKeys = {};
let isTestActive = false;

function initTestView() {
    switchView('test-view');
    isTestActive = false;
    document.getElementById('custom-text-section').classList.add('hidden');
    document.getElementById('btn-start-test').style.display = 'inline-block';
    
    // Setup target box display
    document.getElementById('test-target-box').innerHTML = "Select configuration options above and click [START TEST] to launch evaluation.";
}

function stopTestView() {
    stopTestMode();
}

function startTestMode() {
    initAudio();
    isTestActive = true;
    testTimeLeft = parseInt(document.getElementById('test-time-select').value, 10);
    testCorrects = 0;
    testErrors = 0;
    testTotalChars = 0;
    testTypedIndex = 0;
    testStart = Date.now();
    testMissedKeys = {};

    document.getElementById('test-time-left').textContent = `${testTimeLeft}s`;
    document.getElementById('test-live-wpm').textContent = '0';
    document.getElementById('test-live-accuracy').textContent = '100%';
    document.getElementById('test-live-errors').textContent = '0';
    document.getElementById('btn-start-test').style.display = 'none';

    // Parse appropriate text array
    const testType = document.getElementById('test-type-select').value;
    let sourceText = "";
    if (testType === 'basic') {
        sourceText = "sad dad had a fall. a lad asks for a glass of salsa. all safe glass flasks are on a desk. lead the path to the zone.";
    } else if (testType === 'beginner') {
        sourceText = "To type effectively on a keyboard, you should keep your fingers placed on the home row keys. This setup allows your fingers to quickly reach the other rows of keys above and below. With steady practice and clean posture, you can improve your speed and accuracy without having to look down at your keyboard.";
    } else if (testType === 'advanced') {
        sourceText = "While the QWERTY keyboard layout was initially designed in 1873 to prevent mechanical typewriter jams, modern typists continue to use it globally. Professional transcriptionists often achieve typing speeds exceeding 120 words per minute, demonstrating that muscle memory can easily bypass historical design constraints. Regular exercises and ergonomic setups minimize repetitive strain injuries.";
    } else if (testType === 'programmer') {
        sourceText = LESSONS.programmer[0].text;
    } else if (testType === 'python') {
        const pythonOptions = [
            "def calculate_quality(part_id, threshold):\n    if part_id is None:\n        return False\n    return part_id > threshold",
            "class StationInspector:\n    def __init__(self, inspector_id):\n        self.inspector_id = inspector_id\n        self.inspections = []\n    def add_inspection(self, record):\n        self.inspections.append(record)",
            "import math\ndef compute_distance(p1, p2):\n    return math.sqrt((p1[0] - p2[0])**2 + (p1[1] - p2[1])**2)"
        ];
        sourceText = pythonOptions[Math.floor(Math.random() * pythonOptions.length)];
    } else if (testType === 'csharp') {
        const csharpOptions = [
            "using System;\npublic class QualityChecker {\n    public static bool IsValid(int? partId, int threshold) {\n        return partId.HasValue && partId.Value > threshold;\n    }\n}",
            "public class Inspector {\n    public string InspectorId { get; set; }\n    public List<string> Inspections { get; } = new List<string>();\n    public void Log(string record) => Inspections.Add(record);\n}",
            "using System.Linq;\npublic class StationFilter {\n    public static double AverageScore(int[] scores) => scores.Any() ? scores.Average() : 0.0;\n}"
        ];
        sourceText = csharpOptions[Math.floor(Math.random() * csharpOptions.length)];
    } else if (testType === 'sql') {
        const sqlOptions = [
            "SELECT inspector_id, COUNT(*) FROM inspections WHERE status = 'Failed' GROUP BY inspector_id ORDER BY COUNT(*) DESC;",
            "SELECT p.part_id, p.name, s.status FROM parts p JOIN station_records s ON p.part_id = s.part_id WHERE s.inspected_at >= '2026-01-01';",
            "INSERT INTO stations (station_id, name, location, active) VALUES (105, 'Assembly Belt 4', 'Sector C', true);"
        ];
        sourceText = sqlOptions[Math.floor(Math.random() * sqlOptions.length)];
    } else if (testType === 'markdown') {
        const markdownOptions = [
            "# Quality Inspection Report\n\n- **Date:** 2026-07-09\n- **Inspector:** ID-102\n- **Overall Status:** *PASSED*\n\n> Make sure to calibrate all conveyor belt roller coordinates.",
            "## Touch Typing Arcade Rules\n\n- Type the letters as they appear.\n- Tap the spacebar to submit sorted crates.\n- Do **not** let crates reach the loading portal.",
            "### Database Schema\n\n- SELECT * FROM system_inspections;\n- SELECT * FROM high_scores;\n\n*Note: High scores are saved to localStorage.*"
        ];
        sourceText = markdownOptions[Math.floor(Math.random() * markdownOptions.length)];
    } else if (testType === 'numeric') {
        // Numeric keypad uses newlines between values to require Enter submission instead of space
        const numericOptions = [
            "456\n789\n123\n405\n602\n7890\n1234\n5678\n9012\n1058\n7721\n204",
            "789+\n456-\n123*\n0.05/\n9821\n4452\n3012\n9081\n7731\n5110",
            "55162\n90182\n44719\n38201\n10928\n37492\n84021\n77263\n1928"
        ];
        sourceText = numericOptions[Math.floor(Math.random() * numericOptions.length)];
    } else {
        sourceText = document.getElementById('custom-text-input').value.trim();
        if (sourceText.length === 0) {
            sourceText = "The user selected custom text practice but did not paste any paragraphs. Practice makes perfect typing skills.";
        }
    }

    // Programmatically make typing test text longer for longer durations
    const repeats = Math.max(1, Math.ceil(testTimeLeft / 30));
    const separator = sourceText.includes('\n') ? '\n\n' : ' ';
    testWordsArray = Array(repeats).fill(sourceText).join(separator);

    renderTestText();

    // Start timer interval
    if (testIntervalId) clearInterval(testIntervalId);
    testIntervalId = setInterval(() => {
        testTimeLeft--;
        document.getElementById('test-time-left').textContent = `${testTimeLeft}s`;
        
        // Update WPM
        const elapsedMin = (Date.now() - testStart) / 60000;
        const wpm = elapsedMin > 0 ? Math.round((testCorrects / 5) / elapsedMin) : 0;
        document.getElementById('test-live-wpm').textContent = wpm;

        if (testTimeLeft <= 0) {
            stopTestMode();
            playSfx('success');
            const accuracy = testTotalChars > 0 ? Math.round((testCorrects / testTotalChars) * 100) : 100;
            finishTest(wpm, accuracy, testErrors, testCorrects);
        }
    }, 1000);
}

function stopTestMode() {
    isTestActive = false;
    if (testIntervalId) {
        clearInterval(testIntervalId);
        testIntervalId = null;
    }
}

function renderTestText() {
    const box = document.getElementById('test-target-box');
    if (!box) return;

    let html = "";
    for (let i = 0; i < testWordsArray.length; i++) {
        let char = testWordsArray[i];
        let dispChar = char === ' ' ? '␣' : char;
        if (char === '\n') dispChar = '↵\n';

        let stateClass = '';
        if (i < testTypedIndex) {
            stateClass = 'correct';
        } else if (i === testTypedIndex) {
            stateClass = 'current';
        }

        html += `<span class="char ${stateClass}">${dispChar}</span>`;
    }
    box.innerHTML = html;
}

function handleTestInput(e) {
    if (!isTestActive) return;
    if (testTypedIndex >= testWordsArray.length) return;

    if (e.key.length > 1 && e.key !== 'Enter' && e.key !== 'Backspace') {
        handleKeyPressFeedback(e.key);
        return;
    }

    handleKeyPressFeedback(e.key);

    const targetChar = testWordsArray[testTypedIndex];
    let typedChar = e.key;
    if (typedChar === 'Enter') typedChar = '\n';
    
    testTotalChars++;

    if (e.key === 'Backspace') {
        if (testTypedIndex > 0) {
            testTypedIndex--;
            renderTestText();
        }
        return;
    }

    if (typedChar === targetChar) {
        testCorrects++;
        testTypedIndex++;
        playSfx('rhythm_hit');

        const elapsedMin = (Date.now() - testStart) / 60000;
        const wpm = elapsedMin > 0 ? Math.round((testCorrects / 5) / elapsedMin) : 0;
        const accuracy = Math.round((testCorrects / (testCorrects + testErrors)) * 100);

        document.getElementById('test-live-wpm').textContent = wpm;
        document.getElementById('test-live-accuracy').textContent = `${accuracy}%`;

        if (testTypedIndex >= testWordsArray.length) {
            stopTestMode();
            playSfx('success');
            finishTest(wpm, accuracy, testErrors, testCorrects);
        } else {
            renderTestText();
        }
    } else {
        testErrors++;
        playSfx('crate_jam');
        
        testMissedKeys[targetChar] = (testMissedKeys[targetChar] || 0) + 1;

        document.getElementById('test-live-errors').textContent = testErrors;
        const accuracy = Math.round((testCorrects / (testCorrects + testErrors)) * 100);
        document.getElementById('test-live-accuracy').textContent = `${accuracy}%`;

        // Flash target character red
        const span = document.querySelectorAll('#test-target-box .char')[testTypedIndex];
        if (span) {
            span.classList.add('incorrect');
            setTimeout(() => span.classList.remove('incorrect'), 120);
        }
    }
}

function finishTest(wpm, accuracy, errors, correctCount) {
    const rawWpm = Math.round(((correctCount + errors) / 5) / (parseInt(document.getElementById('test-time-select').value, 10) / 60));
    
    // Switch to results
    switchView('results-view');
    document.getElementById('results-headline').textContent = 'EVALUATION COMPLETE';
    document.getElementById('results-activity-name').textContent = 'Speed Typing Test';
    
    document.getElementById('r-wpm').textContent = wpm;
    document.getElementById('r-accuracy').textContent = `${accuracy}%`;
    document.getElementById('r-raw-wpm').textContent = rawWpm;
    document.getElementById('r-errors').textContent = errors;
    
    const finalScore = wpm * 100 + accuracy * 50 - errors * 30;
    document.getElementById('r-score').textContent = finalScore > 0 ? finalScore.toLocaleString() : 0;
    
    let grade = 'F';
    if (wpm >= 60 && accuracy >= 97) grade = 'S';
    else if (wpm >= 50 && accuracy >= 95) grade = 'A';
    else if (wpm >= 40 && accuracy >= 93) grade = 'B';
    else if (wpm >= 25 && accuracy >= 90) grade = 'C';
    else if (wpm >= 15 && accuracy >= 80) grade = 'D';
    document.getElementById('r-grade').textContent = grade;

    // Render missed keys
    renderMissedKeys(testMissedKeys);
    
    // Resolve badges
    const badges = [];
    if (wpm >= 40) badges.push({ icon: '⚡', title: 'Speed Cadet', desc: 'Reached speed greater than 40 WPM.' });
    if (errors === 0) badges.push({ icon: '🎯', title: 'Steady Hands', desc: 'Finished with 100% accuracy.' });
    renderAchievements(badges);
}


// --- COMMON RESULTS SCREEN LOGIC ---
function finishMission(activityName, wpm, accuracy, errors, score) {
    switchView('results-view');
    document.getElementById('results-headline').textContent = 'MISSION COMPLETE';
    document.getElementById('results-activity-name').textContent = activityName;

    document.getElementById('r-wpm').textContent = wpm;
    document.getElementById('r-accuracy').textContent = `${accuracy}%`;
    
    const correctCount = Math.round(wpm * 5); // approximation
    const rawWpm = Math.round(((correctCount + errors) / 5));
    document.getElementById('r-raw-wpm').textContent = rawWpm;
    document.getElementById('r-errors').textContent = errors;
    document.getElementById('r-score').textContent = score.toLocaleString();

    let grade = 'F';
    if (accuracy >= 98 && wpm >= 40) grade = 'S';
    else if (accuracy >= 96 && wpm >= 30) grade = 'A';
    else if (accuracy >= 92 && wpm >= 20) grade = 'B';
    else if (accuracy >= 85) grade = 'C';
    else if (accuracy >= 70) grade = 'D';
    document.getElementById('r-grade').textContent = grade;

    // Save score if setting is checked
    if (selectedLesson) {
        saveScore(selectedLesson.id, currentActivity, score, wpm, accuracy);
    }

    // Missed keys compilation
    let missed = {};
    if (currentActivity === 'drill') missed = drillMissedKeys;
    renderMissedKeys(missed);

    // Achievements badges trigger
    const badges = [];
    if (activityName === 'Academy Drill') badges.push({ icon: '🎓', title: 'Home Row Hero', desc: 'Completed a structured Touch Typing Academy lesson.' });
    if (activityName === 'Cargo Sorter' && accuracy === 100) badges.push({ icon: '📦', title: 'Perfect Cargo Run', desc: 'Sorted crates with 100% perfect accuracy.' });
    if (activityName === 'Astro Blaster' && wpm >= 35) badges.push({ icon: '🚀', title: 'Blaster Ace', desc: 'Survived speed targets at over 35 WPM.' });
    if (activityName === 'Rhythm Keys' && accuracy >= 95) badges.push({ icon: '🎵', title: 'Rhythm Sync', desc: 'Completed beat training with high alignment.' });
    if (wpm >= 45) badges.push({ icon: '⚡', title: 'Speed Cadet', desc: 'Exceeded 40 corrected WPM.' });
    
    renderAchievements(badges);
}

function renderMissedKeys(missedKeysObj) {
    const list = document.getElementById('r-missed-keys');
    list.innerHTML = "";
    
    const keys = Object.keys(missedKeysObj);
    if (keys.length === 0) {
        list.innerHTML = "<span>None! Clean execution!</span>";
    } else {
        keys.forEach(k => {
            const displayKey = k === ' ' ? 'Space' : k;
            list.innerHTML += `<span>${displayKey} (${missedKeysObj[k]})</span>`;
        });
    }
}

function renderAchievements(badgesArray) {
    const list = document.getElementById('r-achievements');
    list.innerHTML = "";
    if (badgesArray.length === 0) {
        list.innerHTML = "<p style='font-size:0.75rem; color:var(--text-muted);'>No badges unlocked on this run.</p>";
    } else {
        badgesArray.forEach(b => {
            list.innerHTML += `
                <div class="badge-item">
                    <span class="badge-icon">${b.icon}</span>
                    <div class="badge-details">
                        <h5>${b.title}</h5>
                        <p>${b.desc}</p>
                    </div>
                </div>`;
        });
    }
}


// --- VIEW ROUTING CONTROLLERS ---

function showCategorySelection() {
    switchView('category-view');
    const container = document.getElementById('category-list');
    container.innerHTML = "";

    LESSON_CATEGORIES.forEach(c => {
        const scoreKey = `${c.id}_high`;
        container.innerHTML += `
            <div class="category-card" data-cat="${c.id}">
                <div>
                    <h3>${c.title}</h3>
                    <p>${c.desc}</p>
                </div>
                <div class="card-info">
                    <span class="badge-diff ${c.diff}">${c.diff}</span>
                </div>
            </div>`;
    });

    // Listeners for cards
    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', () => {
            selectedCategory = LESSON_CATEGORIES.find(c => c.id === card.dataset.cat);
            showLessonSelection(selectedCategory);
        });
    });
}

function showLessonSelection(category) {
    switchView('lesson-view');
    document.getElementById('lesson-category-title').textContent = category.title;

    const container = document.getElementById('lesson-list');
    container.innerHTML = "";

    const drills = LESSONS[category.id] || [];
    drills.forEach(l => {
        const saved = localScores[`${l.id}_drill`] || localScores[`${l.id}_blaster`] || null;
        const bestText = saved ? `Best: ${saved.score.toLocaleString()} pts / ${saved.wpm} WPM` : 'Unplayed';
        
        container.innerHTML += `
            <div class="lesson-row" data-lesson="${l.id}">
                <div class="lesson-row-left">
                    <h4>${l.title}</h4>
                    <p>Keys: ${l.keys.join(', ').toUpperCase()}</p>
                </div>
                <div class="lesson-row-right">
                    <span style="font-size:0.75rem; color:var(--neon-yellow); font-family:var(--font-mono);">${bestText}</span>
                </div>
            </div>`;
    });

    document.querySelectorAll('.lesson-row').forEach(row => {
        row.addEventListener('click', () => {
            selectedLesson = drills.find(l => l.id === row.dataset.lesson);
            showActivitySelection(selectedLesson);
        });
    });
}

function showActivitySelection(lesson) {
    switchView('activity-view');
    const keysText = document.getElementById('selected-lesson-keys');
    const freeplayContainer = document.getElementById('freeplay-pack-select-container');
    
    if (lesson.id === 'free_play') {
        document.getElementById('selected-lesson-title').textContent = 'Free Play Mode';
        keysText.classList.add('hidden');
        freeplayContainer.classList.remove('hidden');
    } else {
        document.getElementById('selected-lesson-title').textContent = lesson.title;
        keysText.textContent = `Keyboard focus: ${lesson.keys.join(', ').toUpperCase()}`;
        keysText.classList.remove('hidden');
        freeplayContainer.classList.add('hidden');
    }
}

function startSelectedActivity(activity) {
    currentActivity = activity;
    
    if (selectedLesson.id === 'free_play') {
        const val = document.getElementById('freeplay-pack-select').value;
        selectedLesson.difficulty = val;
        if (val === 'beginner') {
            selectedLesson.keys = ['f','j','d','k','s','l','a',';'];
            selectedLesson.text = 'f j f j d k d k s l s l a ; a ;';
        } else if (val === 'intermediate') {
            selectedLesson.keys = ['a-z'];
            selectedLesson.text = 'dad sad lad fall ask safe desk lead jokes flash bottom vision';
        } else if (val === 'advanced') {
            selectedLesson.keys = ['a-z'];
            selectedLesson.text = 'operator confirmed calibration parameters specify technical vision components';
        } else if (val === 'programmer') {
            selectedLesson.keys = ['code'];
            selectedLesson.text = 'const checkQuality = (partId) => {\n    return partId !== null;\n};';
        } else if (val === 'numpad') {
            selectedLesson.keys = ['0-9', '+', '-', '*', '/'];
            selectedLesson.text = '4\n5\n6\n7\n8\n9\n1\n2\n3\n0\n.\n+';
        }
    }

    if (activity === 'drill') {
        initDrillMode(selectedLesson);
    } else if (activity === 'blaster') {
        initBlasterGame(selectedLesson);
    } else if (activity === 'sorter') {
        initCargoGame(selectedLesson);
    } else if (activity === 'rhythm') {
        initRhythmGame(selectedLesson);
    }
}


// --- MAIN INITIALIZATION & LISTENERS ---
window.addEventListener('DOMContentLoaded', () => {
    loadScores();
    renderKeyboardGuide();

    // Start chiptune loop music on landing (first interaction)
    const startMusicOnFirstInteraction = () => {
        initAudio();
        if (isMusicEnabled) {
            startMusic();
        }
        window.removeEventListener('click', startMusicOnFirstInteraction);
        window.removeEventListener('keydown', startMusicOnFirstInteraction);
    };
    window.addEventListener('click', startMusicOnFirstInteraction);
    window.addEventListener('keydown', startMusicOnFirstInteraction);

    // Global button click SFX trigger
    document.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
            playSfx('click');
        }
    });

    // Setup hover indicators for finger legend chips to show key placement
    document.querySelectorAll('.finger-indicator').forEach(indicator => {
        const classes = Array.from(indicator.classList);
        const fingerClass = classes.find(c => c !== 'finger-indicator' && c !== 'active');
        
        if (fingerClass) {
            indicator.addEventListener('mouseover', () => {
                highlightKeysForFinger(fingerClass);
            });
            indicator.addEventListener('mouseout', () => {
                highlightKeysForFinger(null);
            });
        }
    });

    // Sound toggle buttons
    const sfxBtn = document.getElementById('sfx-toggle-btn');
    const musicBtn = document.getElementById('music-toggle-btn');

    sfxBtn.addEventListener('click', () => {
        isSfxEnabled = !isSfxEnabled;
        sfxBtn.textContent = isSfxEnabled ? '🔊 SFX: On' : '🔇 SFX: Off';
        sfxBtn.classList.toggle('disabled', !isSfxEnabled);
        initAudio();
    });

    musicBtn.addEventListener('click', () => {
        isMusicEnabled = !isMusicEnabled;
        musicBtn.textContent = isMusicEnabled ? '🎵 Music: On' : '🔇 Music: Off';
        musicBtn.classList.toggle('disabled', !isMusicEnabled);
        initAudio();
        if (isMusicEnabled) {
            startMusic();
        } else {
            stopMusic();
        }
    });

    // Menu button hooks
    document.getElementById('btn-start-lessons').addEventListener('click', () => {
        initAudio();
        startMusic();
        showCategorySelection();
    });
    
    document.getElementById('btn-free-play').addEventListener('click', () => {
        initAudio();
        startMusic();
        // Free play chooses a category (or launches the selector directly with placeholder lesson)
        selectedLesson = { id: 'free_play', title: 'Free Play Mode', keys: ['f','j','d','k','s','l','a',';'], text: 'asdf jkl; dad sad fall flask ask salsa glass salads' };
        showActivitySelection(selectedLesson);
    });

    document.getElementById('btn-typing-test').addEventListener('click', () => {
        initAudio();
        startMusic();
        initTestView();
    });

    document.getElementById('btn-settings').addEventListener('click', () => {
        initAudio();
        switchView('settings-view');
    });

    // Navigation back triggers
    document.getElementById('btn-cat-back').addEventListener('click', () => switchView('menu-view'));
    document.getElementById('btn-lesson-back').addEventListener('click', () => showCategorySelection());
    document.getElementById('btn-activity-back').addEventListener('click', () => {
        if (selectedLesson.id === 'free_play') {
            switchView('menu-view');
        } else {
            showLessonSelection(selectedCategory);
        }
    });

    // Activity Selector click routing
    document.querySelectorAll('.activity-card').forEach(card => {
        card.addEventListener('click', () => {
            const act = card.dataset.activity;
            startSelectedActivity(act);
        });
    });

    // In-game Exit control triggers
    document.getElementById('btn-drill-quit').addEventListener('click', () => {
        stopDrillMode();
        showActivitySelection(selectedLesson);
    });
    document.getElementById('btn-drill-restart').addEventListener('click', () => initDrillMode(selectedLesson));

    document.getElementById('btn-blaster-quit').addEventListener('click', () => {
        stopBlasterGame();
        showActivitySelection(selectedLesson);
    });
    document.getElementById('btn-blaster-restart').addEventListener('click', () => initBlasterGame(selectedLesson));
    document.getElementById('btn-blaster-pause').addEventListener('click', (e) => {
        conveyorJammed = !conveyorJammed; // Simulating pause with speed factor toggle
        asteroidSpeedFactor = conveyorJammed ? 0 : 1.0;
        e.target.textContent = conveyorJammed ? 'RESUME' : 'PAUSE';
    });

    document.getElementById('btn-cargo-quit').addEventListener('click', () => {
        stopCargoGame();
        showActivitySelection(selectedLesson);
    });
    document.getElementById('btn-cargo-restart').addEventListener('click', () => initCargoGame(selectedLesson));

    document.getElementById('btn-rhythm-quit').addEventListener('click', () => {
        stopRhythmGame();
        showActivitySelection(selectedLesson);
    });
    document.getElementById('btn-rhythm-restart').addEventListener('click', () => initRhythmGame(selectedLesson));

    // Results Actions
    document.getElementById('btn-results-retry').addEventListener('click', () => {
        startSelectedActivity(currentActivity);
    });
    document.getElementById('btn-results-category').addEventListener('click', () => {
        if (selectedLesson.id === 'free_play') {
            switchView('menu-view');
        } else {
            showLessonSelection(selectedCategory);
        }
    });
    document.getElementById('btn-results-menu').addEventListener('click', () => switchView('menu-view'));

    // Typing Test hooks
    document.getElementById('test-type-select').addEventListener('change', (e) => {
        const isCustom = e.target.value === 'custom';
        document.getElementById('custom-text-section').classList.toggle('hidden', !isCustom);
    });
    document.getElementById('btn-start-test').addEventListener('click', startTestMode);
    document.getElementById('btn-test-reset').addEventListener('click', startTestMode);
    document.getElementById('btn-test-quit').addEventListener('click', () => {
        stopTestView();
        switchView('menu-view');
    });

    // Settings adjustments
    document.getElementById('sfx-volume').addEventListener('input', (e) => {
        sfxVolume = e.target.value / 100;
        document.getElementById('sfx-val').textContent = `${e.target.value}%`;
    });
    document.getElementById('music-volume').addEventListener('input', (e) => {
        musicVolume = e.target.value / 100;
        document.getElementById('music-val').textContent = `${e.target.value}%`;
    });
    document.getElementById('btn-clear-local').addEventListener('click', () => {
        if(confirm("Confirm clearing high scores data from this browser?")) {
            localStorage.removeItem(SAVE_KEY);
            localScores = {};
            alert("High scores wiped successfully.");
        }
    });
    document.getElementById('btn-settings-back').addEventListener('click', () => switchView('menu-view'));

    // Global Key Listener capture router
    window.addEventListener('keydown', (e) => {
        if (activeView === 'drill-view') {
            e.preventDefault();
            handleDrillInput(e);
        } else if (activeView === 'blaster-view') {
            e.preventDefault();
            handleBlasterInput(e);
        } else if (activeView === 'cargo-view') {
            e.preventDefault();
            handleCargoInput(e);
        } else if (activeView === 'rhythm-view') {
            e.preventDefault();
            handleRhythmInput(e);
        } else if (activeView === 'test-view') {
            // Only capture if test is active
            if (isTestActive) {
                e.preventDefault();
                handleTestInput(e);
            }
        }
    });

    // Adjust typewriter text centering on screen resizing
    window.addEventListener('resize', () => {
        if (activeView === 'drill-view') {
            renderDrillText();
        }
    });
});

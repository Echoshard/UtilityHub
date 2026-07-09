const WORDS = [
    'amber', 'anchor', 'apex', 'atlas', 'aurora', 'baker', 'beacon', 'birch', 'bravo', 'cabin',
    'cedar', 'cinder', 'clover', 'cobalt', 'comet', 'copper', 'coral', 'delta', 'dune', 'ember',
    'falcon', 'fable', 'forest', 'frost', 'galaxy', 'garden', 'harbor', 'hazel', 'indigo', 'iris',
    'jasmine', 'jolly', 'juniper', 'kernel', 'lagoon', 'lantern', 'lunar', 'maple', 'marble', 'meadow',
    'meteor', 'mint', 'nebula', 'north', 'nova', 'oasis', 'olive', 'onyx', 'orbit', 'pebble',
    'pepper', 'pixel', 'plume', 'prairie', 'quartz', 'quiet', 'raven', 'river', 'rocket', 'saffron',
    'sage', 'signal', 'silver', 'solace', 'spruce', 'summit', 'tango', 'temple', 'thistle', 'timber',
    'topaz', 'tulip', 'velvet', 'violet', 'voyage', 'walnut', 'willow', 'winter', 'zephyr', 'zinc'
];

const SETS = {
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lower: 'abcdefghijklmnopqrstuvwxyz',
    number: '0123456789',
    symbol: '!@#$%^&*_-+=?'
};

const AMBIGUOUS = '0O1Il|`\'"{}[]()/\\:;,.<>';

const state = {
    mode: 'password',
    results: []
};

const els = {
    modeButtons: Array.from(document.querySelectorAll('.mode-btn')),
    passwordOptions: document.getElementById('passwordOptions'),
    passphraseOptions: document.getElementById('passphraseOptions'),
    pinOptions: document.getElementById('pinOptions'),
    generateBtn: document.getElementById('generateBtn'),
    copyPrimaryBtn: document.getElementById('copyPrimaryBtn'),
    copyAllBtn: document.getElementById('copyAllBtn'),
    clearBtn: document.getElementById('clearBtn'),
    downloadTxtBtn: document.getElementById('downloadTxtBtn'),
    downloadCsvBtn: document.getElementById('downloadCsvBtn'),
    regeneratePrimaryBtn: document.getElementById('regeneratePrimaryBtn'),
    primaryOutput: document.getElementById('primaryOutput'),
    resultsList: document.getElementById('resultsList'),
    lengthRange: document.getElementById('lengthRange'),
    lengthValue: document.getElementById('lengthValue'),
    upperCheck: document.getElementById('upperCheck'),
    lowerCheck: document.getElementById('lowerCheck'),
    numberCheck: document.getElementById('numberCheck'),
    symbolCheck: document.getElementById('symbolCheck'),
    requireEachCheck: document.getElementById('requireEachCheck'),
    avoidAmbiguousCheck: document.getElementById('avoidAmbiguousCheck'),
    avoidRepeatsCheck: document.getElementById('avoidRepeatsCheck'),
    startLetterCheck: document.getElementById('startLetterCheck'),
    customSymbolsInput: document.getElementById('customSymbolsInput'),
    excludeInput: document.getElementById('excludeInput'),
    wordCountRange: document.getElementById('wordCountRange'),
    wordCountValue: document.getElementById('wordCountValue'),
    separatorInput: document.getElementById('separatorInput'),
    capitalizeWordsCheck: document.getElementById('capitalizeWordsCheck'),
    appendNumberCheck: document.getElementById('appendNumberCheck'),
    appendSymbolCheck: document.getElementById('appendSymbolCheck'),
    pinLengthRange: document.getElementById('pinLengthRange'),
    pinLengthValue: document.getElementById('pinLengthValue'),
    noSequentialPinCheck: document.getElementById('noSequentialPinCheck'),
    noRepeatPinCheck: document.getElementById('noRepeatPinCheck'),
    countRange: document.getElementById('countRange'),
    countValue: document.getElementById('countValue'),
    strengthFill: document.getElementById('strengthFill'),
    strengthLabel: document.getElementById('strengthLabel'),
    entropyText: document.getElementById('entropyText'),
    crackText: document.getElementById('crackText'),
    auditList: document.getElementById('auditList'),
    policyBox: document.getElementById('policyBox')
};

function randomInt(max) {
    if (max <= 0) return 0;
    const limit = Math.floor(0x100000000 / max) * max;
    const buffer = new Uint32Array(1);
    do {
        crypto.getRandomValues(buffer);
    } while (buffer[0] >= limit);
    return buffer[0] % max;
}

function pick(list) {
    return list[randomInt(list.length)];
}

function shuffle(chars) {
    const out = [...chars];
    for (let i = out.length - 1; i > 0; i--) {
        const j = randomInt(i + 1);
        [out[i], out[j]] = [out[j], out[i]];
    }
    return out.join('');
}

function uniqueChars(value) {
    return [...new Set(value.split(''))].join('');
}

function removeChars(source, chars) {
    const blocked = new Set(chars.split(''));
    return source.split('').filter(ch => !blocked.has(ch)).join('');
}

function getEnabledSets() {
    const sets = [];
    if (els.upperCheck.checked) sets.push({ key: 'upper', chars: SETS.upper });
    if (els.lowerCheck.checked) sets.push({ key: 'lower', chars: SETS.lower });
    if (els.numberCheck.checked) sets.push({ key: 'number', chars: SETS.number });
    if (els.symbolCheck.checked) sets.push({ key: 'symbol', chars: els.customSymbolsInput.value || SETS.symbol });

    return sets.map(set => {
        let chars = uniqueChars(set.chars);
        if (els.avoidAmbiguousCheck.checked) chars = removeChars(chars, AMBIGUOUS);
        if (els.excludeInput.value) chars = removeChars(chars, els.excludeInput.value);
        return { ...set, chars };
    }).filter(set => set.chars.length > 0);
}

function generatePassword() {
    const length = parseInt(els.lengthRange.value, 10);
    const sets = getEnabledSets();
    if (sets.length === 0) return 'Enable at least one character set';

    const pool = uniqueChars(sets.map(set => set.chars).join(''));
    const chars = [];

    if (els.startLetterCheck.checked) {
        const letters = uniqueChars(`${els.upperCheck.checked ? SETS.upper : ''}${els.lowerCheck.checked ? SETS.lower : ''}`);
        const cleanLetters = els.avoidAmbiguousCheck.checked ? removeChars(letters, AMBIGUOUS) : letters;
        const finalLetters = els.excludeInput.value ? removeChars(cleanLetters, els.excludeInput.value) : cleanLetters;
        if (finalLetters.length > 0) chars.push(pick(finalLetters));
    }

    if (els.requireEachCheck.checked) {
        sets.forEach(set => {
            const alreadyCovered = chars.some(ch => set.chars.includes(ch));
            if (!alreadyCovered && chars.length < length) chars.push(pick(set.chars));
        });
    }

    while (chars.length < length) {
        const next = pick(pool);
        if (els.avoidRepeatsCheck.checked && chars[chars.length - 1] === next) continue;
        chars.push(next);
    }

    return shuffle(chars.slice(0, length));
}

function generatePassphrase() {
    const count = parseInt(els.wordCountRange.value, 10);
    const separator = els.separatorInput.value;
    const words = [];
    for (let i = 0; i < count; i++) {
        let word = pick(WORDS);
        if (els.capitalizeWordsCheck.checked) word = word[0].toUpperCase() + word.slice(1);
        words.push(word);
    }

    let phrase = words.join(separator);
    if (els.appendNumberCheck.checked) phrase += `${separator}${randomInt(9000) + 1000}`;
    if (els.appendSymbolCheck.checked) phrase += `${separator}${pick(els.customSymbolsInput.value || SETS.symbol)}`;
    return phrase;
}

function isSequential(value) {
    return '0123456789'.includes(value) || '9876543210'.includes(value);
}

function generatePin() {
    const length = parseInt(els.pinLengthRange.value, 10);
    for (let attempt = 0; attempt < 200; attempt++) {
        let pin = '';
        while (pin.length < length) {
            const digit = String(randomInt(10));
            if (els.noRepeatPinCheck.checked && pin.endsWith(digit)) continue;
            pin += digit;
        }
        if (els.noSequentialPinCheck.checked && isSequential(pin)) continue;
        return pin;
    }
    return Array.from({ length }, () => String(randomInt(10))).join('');
}

function generateOne() {
    if (state.mode === 'passphrase') return generatePassphrase();
    if (state.mode === 'pin') return generatePin();
    return generatePassword();
}

function estimateEntropy(value) {
    if (!value) return 0;
    if (state.mode === 'passphrase') {
        const words = parseInt(els.wordCountRange.value, 10);
        let entropy = words * Math.log2(WORDS.length);
        if (els.appendNumberCheck.checked) entropy += Math.log2(9000);
        if (els.appendSymbolCheck.checked) entropy += Math.log2((els.customSymbolsInput.value || SETS.symbol).length);
        return entropy;
    }
    if (state.mode === 'pin') return value.length * Math.log2(10);
    return value.length * Math.log2(Math.max(1, uniqueChars(getEnabledSets().map(set => set.chars).join('')).length));
}

function crackTime(entropy) {
    const guessesPerSecond = 1e10;
    const seconds = (2 ** Math.min(entropy, 160)) / guessesPerSecond / 2;
    if (seconds < 1) return '<1 sec';
    if (seconds < 60) return `${Math.round(seconds)} sec`;
    if (seconds < 3600) return `${Math.round(seconds / 60)} min`;
    if (seconds < 86400) return `${Math.round(seconds / 3600)} hr`;
    if (seconds < 31536000) return `${Math.round(seconds / 86400)} days`;
    if (seconds < 31536000000) return `${Math.round(seconds / 31536000)} years`;
    return '>1000 years';
}

function strengthFromEntropy(entropy) {
    if (entropy < 40) return { label: 'Weak', color: '#ef4444', pct: 25 };
    if (entropy < 70) return { label: 'Okay', color: '#f59e0b', pct: 50 };
    if (entropy < 100) return { label: 'Strong', color: '#22c55e', pct: 78 };
    return { label: 'Very Strong', color: '#06b6d4', pct: 100 };
}

function renderStats(primary) {
    const entropy = estimateEntropy(primary);
    const strength = strengthFromEntropy(entropy);
    els.strengthFill.style.width = `${strength.pct}%`;
    els.strengthFill.style.background = strength.color;
    els.strengthLabel.textContent = strength.label;
    els.entropyText.textContent = `${Math.round(entropy)} bits`;
    els.crackText.textContent = crackTime(entropy);
}

function renderAudit(primary) {
    const checks = [];
    if (state.mode === 'password') {
        checks.push([primary.length >= 16, 'At least 16 characters']);
        checks.push([/[A-Z]/.test(primary), 'Includes uppercase']);
        checks.push(/[a-z]/.test(primary) ? [true, 'Includes lowercase'] : [false, 'Includes lowercase']);
        checks.push([/\d/.test(primary), 'Includes numbers']);
        checks.push([/[^\da-z]/i.test(primary), 'Includes symbols']);
        checks.push([!/(.)\1{2,}/.test(primary), 'Avoids long repeated runs']);
    } else if (state.mode === 'passphrase') {
        checks.push([parseInt(els.wordCountRange.value, 10) >= 5, 'At least 5 words']);
        checks.push([primary.length >= 24, 'Long readable secret']);
        checks.push([els.appendNumberCheck.checked || els.appendSymbolCheck.checked, 'Has extra suffix entropy']);
    } else {
        checks.push([primary.length >= 6, 'At least 6 digits']);
        checks.push([!/^(\d)\1+$/.test(primary), 'Not all one digit']);
        checks.push([!isSequential(primary), 'Not a simple sequence']);
    }

    els.auditList.innerHTML = checks.map(([ok, label]) => (
        `<div class="audit-item ${ok ? 'good' : 'warn'}">${ok ? 'Pass' : 'Check'} - ${label}</div>`
    )).join('');
}

function renderPolicy() {
    const items = [];
    if (state.mode === 'password') {
        items.push(`${els.lengthRange.value} characters`);
        items.push(getEnabledSets().map(set => set.key).join(', ') || 'no character sets selected');
        if (els.avoidAmbiguousCheck.checked) items.push('ambiguous characters removed');
        if (els.requireEachCheck.checked) items.push('requires every enabled character set');
    } else if (state.mode === 'passphrase') {
        items.push(`${els.wordCountRange.value} words`);
        items.push(`separator "${els.separatorInput.value}"`);
        if (els.capitalizeWordsCheck.checked) items.push('capitalized words');
    } else {
        items.push(`${els.pinLengthRange.value} digits`);
        if (els.noSequentialPinCheck.checked) items.push('simple sequences avoided');
    }
    els.policyBox.innerHTML = items.map(item => `<div>${item}</div>`).join('');
}

function renderResults() {
    const primary = state.results[0] || '';
    els.primaryOutput.value = primary;
    els.resultsList.innerHTML = state.results.map((value, index) => (
        `<div class="result-row"><code>${escapeHtml(value)}</code><button class="button" data-copy="${index}">Copy</button></div>`
    )).join('');
    renderStats(primary);
    renderAudit(primary);
    renderPolicy();
}

function escapeHtml(value) {
    return value.replace(/[&<>"']/g, ch => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[ch]));
}

function generateBatch() {
    const count = parseInt(els.countRange.value, 10);
    state.results = Array.from({ length: count }, generateOne);
    renderResults();
}

async function copyText(value) {
    if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(value);
    } else {
        const temp = document.createElement('textarea');
        temp.value = value;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand('copy');
        temp.remove();
    }
}

function downloadText(text, filename, type) {
    const blob = new Blob([text], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function setMode(mode) {
    state.mode = mode;
    els.modeButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.mode === mode));
    els.passwordOptions.classList.toggle('hidden', mode !== 'password');
    els.passphraseOptions.classList.toggle('hidden', mode !== 'passphrase');
    els.pinOptions.classList.toggle('hidden', mode !== 'pin');
    generateBatch();
}

function syncLabels() {
    els.lengthValue.textContent = els.lengthRange.value;
    els.wordCountValue.textContent = els.wordCountRange.value;
    els.pinLengthValue.textContent = els.pinLengthRange.value;
    els.countValue.textContent = els.countRange.value;
}

els.modeButtons.forEach(btn => btn.addEventListener('click', () => setMode(btn.dataset.mode)));
els.generateBtn.addEventListener('click', generateBatch);
els.regeneratePrimaryBtn.addEventListener('click', generateBatch);
els.copyPrimaryBtn.addEventListener('click', () => copyText(els.primaryOutput.value));
els.copyAllBtn.addEventListener('click', () => copyText(state.results.join('\n')));
els.clearBtn.addEventListener('click', () => {
    state.results = [];
    renderResults();
});
els.downloadTxtBtn.addEventListener('click', () => downloadText(state.results.join('\n'), 'passwords.txt', 'text/plain'));
els.downloadCsvBtn.addEventListener('click', () => {
    const rows = ['index,value', ...state.results.map((value, index) => `${index + 1},"${value.replace(/"/g, '""')}"`)];
    downloadText(rows.join('\n'), 'passwords.csv', 'text/csv');
});
els.resultsList.addEventListener('click', event => {
    const button = event.target.closest('[data-copy]');
    if (!button) return;
    copyText(state.results[parseInt(button.dataset.copy, 10)]);
});

[
    els.lengthRange,
    els.wordCountRange,
    els.pinLengthRange,
    els.countRange
].forEach(input => input.addEventListener('input', () => {
    syncLabels();
    generateBatch();
}));

[
    els.upperCheck,
    els.lowerCheck,
    els.numberCheck,
    els.symbolCheck,
    els.requireEachCheck,
    els.avoidAmbiguousCheck,
    els.avoidRepeatsCheck,
    els.startLetterCheck,
    els.customSymbolsInput,
    els.excludeInput,
    els.separatorInput,
    els.capitalizeWordsCheck,
    els.appendNumberCheck,
    els.appendSymbolCheck,
    els.noSequentialPinCheck,
    els.noRepeatPinCheck
].forEach(input => input.addEventListener('input', generateBatch));

syncLabels();
generateBatch();

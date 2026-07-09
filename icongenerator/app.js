const ICON_SIZES = [
    { size: 16, name: 'favicon-16x16.png', group: 'favicon' },
    { size: 32, name: 'favicon-32x32.png', group: 'favicon' },
    { size: 48, name: 'favicon-48x48.png', group: 'favicon' },
    { size: 180, name: 'apple-touch-icon.png', group: 'apple' },
    { size: 192, name: 'android-chrome-192x192.png', group: 'android' },
    { size: 256, name: 'icon-256x256.png', group: 'desktop' },
    { size: 512, name: 'android-chrome-512x512.png', group: 'android' }
];

const ICO_SIZES = [16, 32, 48, 256];

const state = {
    image: null,
    fileName: 'icon',
    sourceWidth: 0,
    sourceHeight: 0
};

const els = {
    fileInput: document.getElementById('fileInput'),
    dropZone: document.getElementById('dropZone'),
    sourceMeta: document.getElementById('sourceMeta'),
    mainPreview: document.getElementById('mainPreview'),
    previewStrip: document.getElementById('previewStrip'),
    sizeList: document.getElementById('sizeList'),
    snippetOutput: document.getElementById('snippetOutput'),
    resetBtn: document.getElementById('resetBtn'),
    downloadAllBtn: document.getElementById('downloadAllBtn'),
    downloadIcoBtn: document.getElementById('downloadIcoBtn'),
    downloadPngsBtn: document.getElementById('downloadPngsBtn'),
    downloadManifestBtn: document.getElementById('downloadManifestBtn'),
    downloadHtmlBtn: document.getElementById('downloadHtmlBtn'),
    copySnippetBtn: document.getElementById('copySnippetBtn'),
    fitSelect: document.getElementById('fitSelect'),
    paddingRange: document.getElementById('paddingRange'),
    paddingValue: document.getElementById('paddingValue'),
    radiusRange: document.getElementById('radiusRange'),
    radiusValue: document.getElementById('radiusValue'),
    transparentCheck: document.getElementById('transparentCheck'),
    backgroundColor: document.getElementById('backgroundColor'),
    applyBgBtn: document.getElementById('applyBgBtn'),
    appNameInput: document.getElementById('appNameInput'),
    themeColorInput: document.getElementById('themeColorInput')
};

const mainCtx = els.mainPreview.getContext('2d');

function setEnabled(enabled) {
    [
        els.resetBtn,
        els.downloadAllBtn,
        els.downloadIcoBtn,
        els.downloadPngsBtn,
        els.downloadManifestBtn,
        els.downloadHtmlBtn,
        els.copySnippetBtn,
        els.applyBgBtn
    ].forEach(button => {
        button.disabled = !enabled;
    });
}

function roundedRect(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function drawIcon(size) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, size, size);

    const radius = Math.round(size * (parseInt(els.radiusRange.value, 10) / 100));
    const padding = Math.round(size * (parseInt(els.paddingRange.value, 10) / 100));

    roundedRect(ctx, 0, 0, size, size, radius);
    ctx.clip();

    if (!els.transparentCheck.checked) {
        ctx.fillStyle = els.backgroundColor.value;
        ctx.fillRect(0, 0, size, size);
    }

    if (!state.image) {
        drawPlaceholder(ctx, size);
        return canvas;
    }

    const box = Math.max(1, size - padding * 2);
    const imageRatio = state.sourceWidth / state.sourceHeight;
    const boxRatio = 1;
    let drawWidth;
    let drawHeight;

    if (els.fitSelect.value === 'contain') {
        if (imageRatio > boxRatio) {
            drawWidth = box;
            drawHeight = box / imageRatio;
        } else {
            drawHeight = box;
            drawWidth = box * imageRatio;
        }
    } else if (imageRatio > boxRatio) {
        drawHeight = box;
        drawWidth = box * imageRatio;
    } else {
        drawWidth = box;
        drawHeight = box / imageRatio;
    }

    const x = (size - drawWidth) / 2;
    const y = (size - drawHeight) / 2;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(state.image, x, y, drawWidth, drawHeight);
    return canvas;
}

function drawPlaceholder(ctx, size) {
    ctx.fillStyle = '#101827';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size * 0.24, 0, Math.PI * 2);
    ctx.fill();
}

function render() {
    els.paddingValue.textContent = els.paddingRange.value;
    els.radiusValue.textContent = els.radiusRange.value;

    const preview = drawIcon(512);
    mainCtx.clearRect(0, 0, 512, 512);
    mainCtx.drawImage(preview, 0, 0);

    els.previewStrip.innerHTML = '';
    [16, 32, 48, 180, 192, 512].forEach(size => {
        const card = document.createElement('div');
        card.className = 'preview-card';
        const icon = drawIcon(size);
        card.appendChild(icon);
        const label = document.createElement('span');
        label.textContent = `${size} x ${size}`;
        card.appendChild(label);
        els.previewStrip.appendChild(card);
    });

    els.sizeList.innerHTML = '';
    ICON_SIZES.forEach(item => {
        const row = document.createElement('div');
        row.textContent = item.name;
        els.sizeList.appendChild(row);
    });

    els.snippetOutput.value = buildHtmlSnippet();
}

function loadFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
        const image = new Image();
        image.onload = () => {
            state.image = image;
            state.fileName = file.name.replace(/\.[^.]+$/, '') || 'icon';
            state.sourceWidth = image.naturalWidth;
            state.sourceHeight = image.naturalHeight;
            els.sourceMeta.textContent = `${file.name} - ${state.sourceWidth} x ${state.sourceHeight}`;
            setEnabled(true);
            render();
        };
        image.src = reader.result;
    };
    reader.readAsDataURL(file);
}

function canvasToBlob(canvas, type = 'image/png') {
    return new Promise(resolve => {
        canvas.toBlob(resolve, type);
    });
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function downloadText(text, filename, type = 'text/plain') {
    downloadBlob(new Blob([text], { type }), filename);
}

async function downloadPngSet() {
    if (!state.image) return;
    for (const item of ICON_SIZES) {
        const blob = await canvasToBlob(drawIcon(item.size));
        downloadBlob(blob, item.name);
    }
}

async function createIcoBlob() {
    const entries = [];
    for (const size of ICO_SIZES) {
        const blob = await canvasToBlob(drawIcon(size));
        const bytes = new Uint8Array(await blob.arrayBuffer());
        entries.push({ size, bytes });
    }

    const directorySize = 6 + entries.length * 16;
    const totalSize = directorySize + entries.reduce((sum, entry) => sum + entry.bytes.length, 0);
    const buffer = new ArrayBuffer(totalSize);
    const view = new DataView(buffer);
    const output = new Uint8Array(buffer);
    let offset = 0;

    view.setUint16(offset, 0, true); offset += 2;
    view.setUint16(offset, 1, true); offset += 2;
    view.setUint16(offset, entries.length, true); offset += 2;

    let imageOffset = directorySize;
    entries.forEach(entry => {
        view.setUint8(offset, entry.size === 256 ? 0 : entry.size); offset += 1;
        view.setUint8(offset, entry.size === 256 ? 0 : entry.size); offset += 1;
        view.setUint8(offset, 0); offset += 1;
        view.setUint8(offset, 0); offset += 1;
        view.setUint16(offset, 1, true); offset += 2;
        view.setUint16(offset, 32, true); offset += 2;
        view.setUint32(offset, entry.bytes.length, true); offset += 4;
        view.setUint32(offset, imageOffset, true); offset += 4;
        output.set(entry.bytes, imageOffset);
        imageOffset += entry.bytes.length;
    });

    return new Blob([buffer], { type: 'image/x-icon' });
}

function buildManifest() {
    const appName = els.appNameInput.value.trim() || 'My App';
    return JSON.stringify({
        name: appName,
        short_name: appName,
        icons: [
            {
                src: '/android-chrome-192x192.png',
                sizes: '192x192',
                type: 'image/png'
            },
            {
                src: '/android-chrome-512x512.png',
                sizes: '512x512',
                type: 'image/png'
            },
            {
                src: '/android-chrome-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable'
            }
        ],
        theme_color: els.themeColorInput.value,
        background_color: els.backgroundColor.value,
        display: 'standalone'
    }, null, 2);
}

function buildHtmlSnippet() {
    return [
        '<link rel="icon" href="/favicon.ico" sizes="any">',
        '<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">',
        '<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">',
        '<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">',
        '<link rel="manifest" href="/site.webmanifest">',
        `<meta name="theme-color" content="${els.themeColorInput.value}">`
    ].join('\n');
}

async function downloadIco() {
    if (!state.image) return;
    downloadBlob(await createIcoBlob(), 'favicon.ico');
}

function downloadManifest() {
    downloadText(buildManifest(), 'site.webmanifest', 'application/manifest+json');
}

function downloadHtmlSnippet() {
    downloadText(buildHtmlSnippet(), 'favicon-html-snippet.html', 'text/html');
}

async function downloadAll() {
    await downloadIco();
    await downloadPngSet();
    downloadManifest();
    downloadHtmlSnippet();
}

function reset() {
    state.image = null;
    state.fileName = 'icon';
    state.sourceWidth = 0;
    state.sourceHeight = 0;
    els.sourceMeta.textContent = 'No source image loaded';
    els.fileInput.value = '';
    setEnabled(false);
    render();
}

els.fileInput.addEventListener('change', event => loadFile(event.target.files[0]));
els.dropZone.addEventListener('dragover', event => {
    event.preventDefault();
    els.dropZone.classList.add('dragging');
});
els.dropZone.addEventListener('dragleave', () => els.dropZone.classList.remove('dragging'));
els.dropZone.addEventListener('drop', event => {
    event.preventDefault();
    els.dropZone.classList.remove('dragging');
    loadFile(event.dataTransfer.files[0]);
});

[
    els.fitSelect,
    els.paddingRange,
    els.radiusRange,
    els.transparentCheck,
    els.backgroundColor,
    els.appNameInput,
    els.themeColorInput
].forEach(control => {
    control.addEventListener('input', render);
});

els.applyBgBtn.addEventListener('click', () => {
    els.transparentCheck.checked = false;
    render();
});
els.downloadIcoBtn.addEventListener('click', downloadIco);
els.downloadPngsBtn.addEventListener('click', downloadPngSet);
els.downloadManifestBtn.addEventListener('click', downloadManifest);
els.downloadHtmlBtn.addEventListener('click', downloadHtmlSnippet);
els.downloadAllBtn.addEventListener('click', downloadAll);
els.resetBtn.addEventListener('click', reset);
els.copySnippetBtn.addEventListener('click', async () => {
    if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(els.snippetOutput.value);
    } else {
        els.snippetOutput.focus();
        els.snippetOutput.select();
        document.execCommand('copy');
    }
    els.copySnippetBtn.textContent = 'Copied';
    setTimeout(() => {
        els.copySnippetBtn.textContent = 'Copy Snippet';
    }, 900);
});

setEnabled(false);
render();

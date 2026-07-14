/* PDF Forge — combine, split, and remove pages from PDFs, fully offline.
   pdf-lib (window.PDFLib) does the document surgery; pdf.js (window.pdfjsLib)
   renders page thumbnails. Both are vendored in lib/. */
(function () {
    'use strict';

    const { PDFDocument } = window.PDFLib;
    // On file:// a real Web Worker can't start; pdf.js then falls back to the
    // fake worker, which finds window.pdfjsWorker (loaded via script tag).
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'lib/pdf.worker.min.js';

    // ---------- DOM ----------
    const $ = id => document.getElementById(id);
    const fileInput = $('fileInput');
    const docList = $('docList');
    const emptyState = $('emptyState');
    const statsLabel = $('statsLabel');
    const selCountEl = $('selCount');
    const mergeBtn = $('mergeBtn');
    const extractBtn = $('extractBtn');
    const removeBtn = $('removeBtn');
    const clearSelBtn = $('clearSelBtn');
    const splitBtn = $('splitBtn');
    const splitMode = $('splitMode');
    const splitEvery = $('splitEvery');
    const splitRanges = $('splitRanges');
    const dropOverlay = $('dropOverlay');
    const toast = $('toast');

    // ---------- State ----------
    // docs: [{ id, name, bytes, libDoc, pdfjsDoc, pageCount,
    //          pages: [{ srcIndex, selected, removed }] }]
    let docs = [];
    let nextId = 1;
    let busy = false;
    const thumbCache = new Map(); // 'docId:srcIndex' -> canvas

    // ---------- Helpers ----------
    let toastTimer = null;
    function showToast(msg) {
        toast.textContent = msg;
        toast.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
    }

    function baseName(name) {
        return name.replace(/\.pdf$/i, '');
    }

    function download(bytes, filename) {
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 5000);
    }

    const sleep = ms => new Promise(r => setTimeout(r, ms));

    function includedPages(doc) {
        return doc.pages.filter(p => !p.removed);
    }

    function selectedParts() {
        // [{doc, indices}] in document order
        const parts = [];
        for (const doc of docs) {
            const indices = doc.pages.filter(p => p.selected && !p.removed).map(p => p.srcIndex);
            if (indices.length) parts.push({ doc, indices });
        }
        return parts;
    }

    function totals() {
        let included = 0, selected = 0;
        for (const doc of docs) {
            for (const p of doc.pages) {
                if (!p.removed) {
                    included++;
                    if (p.selected) selected++;
                }
            }
        }
        return { included, selected };
    }

    // ---------- PDF operations ----------
    async function buildPdf(parts) {
        const out = await PDFDocument.create();
        for (const part of parts) {
            if (!part.indices.length) continue;
            const copied = await out.copyPages(part.doc.libDoc, part.indices);
            copied.forEach(p => out.addPage(p));
        }
        return out.save();
    }

    async function withBusy(label, fn) {
        if (busy) return;
        busy = true;
        updateUI();
        try {
            await fn();
        } catch (err) {
            console.error(err);
            showToast('⚠️ ' + label + ' failed: ' + (err && err.message ? err.message : err));
        } finally {
            busy = false;
            updateUI();
        }
    }

    // ---------- Loading files ----------
    async function addFiles(fileList) {
        const files = Array.from(fileList).filter(f =>
            f.type === 'application/pdf' || /\.pdf$/i.test(f.name));
        if (!files.length) {
            showToast('No PDF files found in the drop.');
            return;
        }
        for (const file of files) {
            try {
                const bytes = new Uint8Array(await file.arrayBuffer());
                const libDoc = await PDFDocument.load(bytes, { updateMetadata: false });
                const doc = {
                    id: nextId++,
                    name: file.name,
                    bytes: bytes,
                    libDoc: libDoc,
                    pdfjsDoc: null,
                    pageCount: libDoc.getPageCount(),
                    pages: libDoc.getPageIndices().map(i => ({ srcIndex: i, selected: false, removed: false }))
                };
                docs.push(doc);
                renderDocs();
                renderThumbs(doc); // async, fills in as it renders
            } catch (err) {
                console.error(err);
                showToast('⚠️ Could not open "' + file.name + '" — it may be encrypted or corrupt.');
            }
        }
        updateUI();
    }

    async function renderThumbs(doc) {
        try {
            // pdf.js may transfer (detach) the buffer it is given — pass a copy.
            const pdf = await pdfjsLib.getDocument({ data: doc.bytes.slice() }).promise;
            doc.pdfjsDoc = pdf;
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            for (const p of doc.pages) {
                const key = doc.id + ':' + p.srcIndex;
                if (thumbCache.has(key)) continue;
                const page = await pdf.getPage(p.srcIndex + 1);
                const base = page.getViewport({ scale: 1 });
                const scale = (120 / base.width) * dpr;
                const viewport = page.getViewport({ scale: scale });
                const canvas = document.createElement('canvas');
                canvas.width = Math.ceil(viewport.width);
                canvas.height = Math.ceil(viewport.height);
                await page.render({ canvasContext: canvas.getContext('2d'), viewport: viewport }).promise;
                thumbCache.set(key, canvas);
                const holder = docList.querySelector('.page-thumb[data-key="' + key + '"]');
                if (holder) {
                    const loading = holder.querySelector('.thumb-loading');
                    if (loading) holder.replaceChild(canvas, loading);
                }
            }
        } catch (err) {
            console.error('thumbnail render failed', err);
        }
    }

    // ---------- Rendering ----------
    function renderDocs() {
        docList.innerHTML = '';
        emptyState.style.display = docs.length ? 'none' : '';
        docs.forEach(function (doc, di) {
            const card = document.createElement('div');
            card.className = 'doc-card';
            card.dataset.doc = doc.id;

            const header = document.createElement('div');
            header.className = 'doc-header';

            const title = document.createElement('span');
            title.className = 'doc-title';
            title.textContent = doc.name;
            title.title = doc.name;

            const meta = document.createElement('span');
            meta.className = 'doc-meta';
            const inc = includedPages(doc).length;
            meta.textContent = inc === doc.pageCount
                ? doc.pageCount + ' page' + (doc.pageCount === 1 ? '' : 's')
                : inc + ' of ' + doc.pageCount + ' pages';

            const actions = document.createElement('div');
            actions.className = 'doc-actions';

            const btn = (label, title, cls) => {
                const b = document.createElement('button');
                b.className = 'icon-btn' + (cls ? ' ' + cls : '');
                b.textContent = label;
                b.title = title;
                return b;
            };

            const upBtn = btn('↑', 'Move up');
            upBtn.disabled = di === 0;
            upBtn.addEventListener('click', () => { docs.splice(di, 1); docs.splice(di - 1, 0, doc); renderDocs(); });

            const downBtn = btn('↓', 'Move down');
            downBtn.disabled = di === docs.length - 1;
            downBtn.addEventListener('click', () => { docs.splice(di, 1); docs.splice(di + 1, 0, doc); renderDocs(); });

            const selAllBtn = btn('Select all', 'Select every page in this document');
            selAllBtn.addEventListener('click', () => {
                doc.pages.forEach(p => { if (!p.removed) p.selected = true; });
                renderDocs();
            });

            const clearBtn = btn('Clear', 'Deselect this document\'s pages');
            clearBtn.addEventListener('click', () => {
                doc.pages.forEach(p => { p.selected = false; });
                renderDocs();
            });

            const restoreBtn = btn('Restore pages', 'Bring back removed pages');
            restoreBtn.style.display = doc.pages.some(p => p.removed) ? '' : 'none';
            restoreBtn.addEventListener('click', () => {
                doc.pages.forEach(p => { p.removed = false; });
                renderDocs();
                showToast('Restored all pages of ' + doc.name);
            });

            const dlBtn = btn('⬇ Download', 'Download this document (removed pages excluded)');
            dlBtn.addEventListener('click', () => withBusy('Download', async () => {
                const indices = includedPages(doc).map(p => p.srcIndex);
                if (!indices.length) { showToast('No pages left in this document.'); return; }
                const bytes = await buildPdf([{ doc, indices }]);
                download(bytes, baseName(doc.name) + (indices.length === doc.pageCount ? '' : '-edited') + '.pdf');
                showToast('Downloaded ' + baseName(doc.name) + '.pdf');
            }));

            const closeBtn = btn('✕', 'Remove this document from the list', 'danger');
            closeBtn.addEventListener('click', () => {
                docs = docs.filter(d => d !== doc);
                if (doc.pdfjsDoc) doc.pdfjsDoc.destroy();
                doc.pages.forEach(p => thumbCache.delete(doc.id + ':' + p.srcIndex));
                renderDocs();
                updateUI();
            });

            actions.append(upBtn, downBtn, selAllBtn, clearBtn, restoreBtn, dlBtn, closeBtn);
            header.append(title, meta, actions);
            card.appendChild(header);

            const grid = document.createElement('div');
            grid.className = 'page-grid';
            for (const p of doc.pages) {
                if (p.removed) continue;
                const key = doc.id + ':' + p.srcIndex;
                const thumb = document.createElement('div');
                thumb.className = 'page-thumb' + (p.selected ? ' selected' : '');
                thumb.dataset.key = key;
                const cached = thumbCache.get(key);
                if (cached) {
                    thumb.appendChild(cached);
                } else {
                    const loading = document.createElement('div');
                    loading.className = 'thumb-loading';
                    loading.textContent = 'Rendering…';
                    thumb.appendChild(loading);
                }
                const num = document.createElement('span');
                num.className = 'page-num';
                num.textContent = p.srcIndex + 1;
                thumb.appendChild(num);
                thumb.addEventListener('click', () => {
                    p.selected = !p.selected;
                    thumb.classList.toggle('selected', p.selected);
                    updateUI();
                });
                grid.appendChild(thumb);
            }
            card.appendChild(grid);
            docList.appendChild(card);
        });
        updateUI();
    }

    function updateUI() {
        const t = totals();
        selCountEl.textContent = t.selected;
        statsLabel.textContent = docs.length
            ? docs.length + ' doc' + (docs.length === 1 ? '' : 's') + ' · ' + t.included + ' pages' +
              (t.selected ? ' · ' + t.selected + ' selected' : '')
            : 'No PDFs loaded';
        mergeBtn.disabled = busy || t.included === 0;
        extractBtn.disabled = busy || t.selected === 0;
        removeBtn.disabled = busy || t.selected === 0;
        clearSelBtn.disabled = busy || t.selected === 0;
        splitBtn.disabled = busy || t.included === 0;
    }

    // ---------- Actions ----------
    mergeBtn.addEventListener('click', () => withBusy('Merge', async () => {
        const parts = docs.map(doc => ({ doc, indices: includedPages(doc).map(p => p.srcIndex) }));
        const bytes = await buildPdf(parts);
        download(bytes, docs.length === 1 ? baseName(docs[0].name) + '-edited.pdf' : 'merged.pdf');
        showToast('✅ Merged ' + totals().included + ' pages into one PDF.');
    }));

    extractBtn.addEventListener('click', () => withBusy('Extract', async () => {
        const parts = selectedParts();
        const count = parts.reduce((n, p) => n + p.indices.length, 0);
        const bytes = await buildPdf(parts);
        download(bytes, 'extracted.pdf');
        showToast('✅ Extracted ' + count + ' page' + (count === 1 ? '' : 's') + '.');
    }));

    removeBtn.addEventListener('click', () => {
        let n = 0;
        for (const doc of docs) {
            for (const p of doc.pages) {
                if (p.selected && !p.removed) { p.removed = true; p.selected = false; n++; }
            }
        }
        renderDocs();
        showToast('🗑 Removed ' + n + ' page' + (n === 1 ? '' : 's') + '. Use "Restore pages" on a document to undo.');
    });

    clearSelBtn.addEventListener('click', () => {
        docs.forEach(doc => doc.pages.forEach(p => { p.selected = false; }));
        renderDocs();
    });

    splitMode.addEventListener('change', () => {
        $('splitEveryGroup').hidden = splitMode.value !== 'every';
        $('splitRangesGroup').hidden = splitMode.value !== 'ranges';
    });

    function parseRanges(str, max) {
        const parts = str.split(',').map(s => s.trim()).filter(Boolean);
        if (!parts.length) return null;
        const groups = [];
        for (const part of parts) {
            const m = part.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
            if (!m) return null;
            const a = parseInt(m[1], 10);
            const b = m[2] ? parseInt(m[2], 10) : a;
            if (a < 1 || b < a || a > max) return null;
            const idx = [];
            for (let i = a; i <= Math.min(b, max); i++) idx.push(i - 1);
            groups.push(idx);
        }
        return groups;
    }

    splitBtn.addEventListener('click', () => withBusy('Split', async () => {
        // Flatten the combined sequence of included pages across all docs.
        const seq = [];
        for (const doc of docs) {
            for (const p of includedPages(doc)) seq.push({ doc, srcIndex: p.srcIndex });
        }
        let groups; // arrays of positions into seq
        if (splitMode.value === 'every') {
            const n = Math.max(1, parseInt(splitEvery.value, 10) || 1);
            groups = [];
            for (let i = 0; i < seq.length; i += n) {
                groups.push(seq.slice(i, i + n).map((_, j) => i + j));
            }
        } else if (splitMode.value === 'ranges') {
            groups = parseRanges(splitRanges.value, seq.length);
            if (!groups) {
                showToast('⚠️ Invalid ranges. Use e.g. "1-3, 4, 5-8" (combined sequence has ' + seq.length + ' pages).');
                return;
            }
        } else { // single
            groups = seq.map((_, i) => [i]);
        }
        if (groups.length > 40 && !window.confirm('This will download ' + groups.length + ' files. Continue?')) {
            return;
        }
        const stem = docs.length === 1 ? baseName(docs[0].name) : 'split';
        let fileNo = 0;
        for (const group of groups) {
            // batch consecutive pages of the same source doc into one copyPages call
            const parts = [];
            for (const pos of group) {
                const item = seq[pos];
                const last = parts[parts.length - 1];
                if (last && last.doc === item.doc) last.indices.push(item.srcIndex);
                else parts.push({ doc: item.doc, indices: [item.srcIndex] });
            }
            const bytes = await buildPdf(parts);
            fileNo++;
            download(bytes, stem + '-part' + fileNo + '.pdf');
            await sleep(300); // give the browser room between downloads
        }
        showToast('✅ Split into ' + groups.length + ' file' + (groups.length === 1 ? '' : 's') + '.');
    }));

    // ---------- File input & drag-drop ----------
    $('addBtn').addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => {
        addFiles(fileInput.files);
        fileInput.value = '';
    });

    let dragDepth = 0;
    document.addEventListener('dragenter', e => {
        if (!e.dataTransfer || !Array.from(e.dataTransfer.types).includes('Files')) return;
        e.preventDefault();
        dragDepth++;
        dropOverlay.classList.add('active');
    });
    document.addEventListener('dragover', e => e.preventDefault());
    document.addEventListener('dragleave', e => {
        e.preventDefault();
        if (--dragDepth <= 0) { dragDepth = 0; dropOverlay.classList.remove('active'); }
    });
    document.addEventListener('drop', e => {
        e.preventDefault();
        dragDepth = 0;
        dropOverlay.classList.remove('active');
        if (e.dataTransfer && e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
    });

    window.__pdfforge = { parseRanges, buildPdf }; // exposed for testing
    updateUI();
})();

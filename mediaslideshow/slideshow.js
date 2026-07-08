/* ===================== Config (tweak here) ===================== */
const THUMB_CONCURRENCY = 1;
const THUMB_WIDTH = 320;
const THUMB_FRACTION = 0.25;
const LOCAL_CACHE_PREFIX = 'thumbCacheV2:';  // localStorage key prefix

// IndexedDB Config
const DB_NAME = 'MediaSlideshowDB';
const STORE_NAME = 'media';

/* ===================== State ===================== */
let audioList = [], videoList = [], imageList = [];
let imageFolders = [], videoFolders = [];
let selectedImageFolders = new Set();     // "__ALL__" for all, "" for root
let selectedVideoFolders = new Set();

let audioIndex = 0, videoIndex = 0, slideIndex = 0;
let slideTimer = null;
const audioPlayer = new Audio();
let currentVideo = null;
let slideshowActive = false, videoActive = false;

let autoScrollPaused = false, inactivityTimer = null, autoScrollTimer = null;
let currentPreviewIndex = -1;

let previewVideos = false;
let videosDisabled = false;

// Deletion flow
let confirmOpen = false;
let pendingDeleteId = null;

// Object URL Tracking (to prevent memory leaks)
let objectUrls = [];

/* ======== Lazy thumbnail worker ======== */
const rIC = window.requestIdleCallback || function (cb) { return setTimeout(() => cb({ timeRemaining: () => 50 }), 60); };

let thumbObserver = null;
const thumbQueue = []; let thumbInFlight = 0;

const workerVideo = document.createElement('video');
workerVideo.crossOrigin = 'anonymous';
workerVideo.muted = true;
workerVideo.preload = 'metadata';
workerVideo.playsInline = true;
workerVideo.style.position = 'fixed';
workerVideo.style.left = '-9999px';
workerVideo.style.top = '-9999px';
document.body.appendChild(workerVideo);

const workerCanvas = document.createElement('canvas');
const workerCtx = workerCanvas.getContext('2d');

/* ===================== IndexedDB Engine ===================== */
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject(e.target.error);
    });
}

function getAllMediaFromDB() {
    return openDB().then(db => {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    });
}

function addMediaToDB(mediaItem) {
    return openDB().then(db => {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const request = store.put(mediaItem);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    });
}

function deleteMediaFromDB(id) {
    return openDB().then(db => {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const request = store.delete(id);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    });
}

function clearAllMediaFromDB() {
    return openDB().then(db => {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const request = store.clear();
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    });
}

/* ===================== Helpers ===================== */
function getFilteredImages() {
    return imageList.filter(imagePassesFolderFilter);
}

function getFolderFromPath(relativePath) {
    if (!relativePath) return '';
    const parts = relativePath.split('/');
    if (parts.length > 2) {
        return parts[1]; // E.g. "pics/FolderA/image.jpg" -> "FolderA"
    } else if (parts.length === 2) {
        return parts[0]; // E.g. "FolderA/image.jpg" -> "FolderA"
    }
    return '';
}

function getFileType(file) {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    
    // Fallback based on extension
    const ext = file.name.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
    if (['mp4', 'webm', 'avi', 'mov', 'm4v'].includes(ext)) return 'video';
    if (['mp3', 'wav', 'ogg'].includes(ext)) return 'audio';
    return null;
}

/* ===================== Menu toggle ===================== */
const hamburger = document.getElementById('hamburger');
if (hamburger) {
    hamburger.onclick = () => document.getElementById('controls').classList.toggle('show');
}
function closeMenu() {
    const controls = document.getElementById('controls');
    if (controls) controls.classList.remove('show');
}

/* ===================== Load media ===================== */
async function loadMedia() {
    // Revoke old object URLs to release memory
    objectUrls.forEach(url => URL.revokeObjectURL(url));
    objectUrls = [];

    // Reset lists
    imageList = [];
    videoList = [];
    audioList = [];
    const imageFolderSet = new Set();
    const videoFolderSet = new Set();

    try {
        const storedItems = await getAllMediaFromDB();
        
        storedItems.forEach(item => {
            const url = URL.createObjectURL(item.blob);
            objectUrls.push(url);

            const mediaObj = {
                id: item.id,
                name: item.name,
                folder: item.folder || '',
                url: url
            };

            if (item.type === 'image') {
                imageList.push(mediaObj);
                imageFolderSet.add(item.folder || '');
            } else if (item.type === 'video') {
                videoList.push(mediaObj);
                videoFolderSet.add(item.folder || '');
            } else if (item.type === 'audio') {
                audioList.push(mediaObj);
            }
        });

        // Shuffle images initially
        imageList.sort(() => Math.random() - 0.5);

        // Sort folders
        imageFolders = Array.from(imageFolderSet).filter(f => f !== '').sort();
        videoFolders = Array.from(videoFolderSet).filter(f => f !== '').sort();

        // Update database stats info
        const dbStatus = document.getElementById('db-status');
        if (dbStatus) {
            const total = imageList.length + videoList.length + audioList.length;
            dbStatus.textContent = total > 0 
                ? `Loaded ${total} files locally (${imageList.length} img, ${videoList.length} vid, ${audioList.length} audio)`
                : "Gallery empty. Add media to start!";
        }

    } catch (e) {
        console.error("Error reading IndexedDB:", e);
    }

    selectedImageFolders = new Set(['__ALL__']);
    selectedVideoFolders = new Set(['__ALL__']);
    audioIndex = 0;
    videoIndex = 0;

    renderFolderChips();
    if (CONFIG.audioVisible) populateAudioDropdown();

    applyVideoDisableState(false);
    renderGrid();
    if (CONFIG.audioVisible) syncAudioSelect();
    startAutoScroll();
}

window.onload = loadMedia;

/* ===================== Media Uploading & Importing ===================== */
const fileLoader = document.getElementById('fileLoader');
const folderLoader = document.getElementById('folderLoader');

if (fileLoader) {
    fileLoader.addEventListener('change', (e) => handleImportFiles(e.target.files));
}
if (folderLoader) {
    folderLoader.addEventListener('change', (e) => handleImportFiles(e.target.files));
}

async function handleImportFiles(files) {
    if (!files || files.length === 0) return;
    
    const dbStatus = document.getElementById('db-status');
    if (dbStatus) dbStatus.textContent = `Importing ${files.length} files...`;

    let importCount = 0;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const type = getFileType(file);
        
        if (!type) continue; // Skip unsupported files

        const folder = getFolderFromPath(file.webkitRelativePath);
        
        const mediaItem = {
            id: 'media_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            name: file.name,
            type: type,
            folder: folder,
            blob: file
        };

        try {
            await addMediaToDB(mediaItem);
            importCount++;
        } catch (e) {
            console.error("Error saving file to IndexedDB:", e);
        }
    }

    if (dbStatus) dbStatus.textContent = `Successfully imported ${importCount} files!`;
    
    // Clear uploader inputs
    if (fileLoader) fileLoader.value = '';
    if (folderLoader) folderLoader.value = '';

    setTimeout(() => {
        loadMedia();
    }, 1000);
}

// Reset gallery button
const resetGalleryBtn = document.getElementById('resetGalleryBtn');
if (resetGalleryBtn) {
    resetGalleryBtn.addEventListener('click', async () => {
        if (confirm("Are you sure you want to clear your local database gallery? All uploaded media files will be deleted from browser cache.")) {
            stopAudio();
            endAll();
            await clearAllMediaFromDB();
            // Clear local storage thumbnails too
            const keys = Object.keys(localStorage);
            keys.forEach(k => { if (k.startsWith(LOCAL_CACHE_PREFIX)) localStorage.removeItem(k); });
            
            loadMedia();
        }
    });
}

/* ===================== Folder filters UI ===================== */
function makeChip(label, active, onToggle) {
    const b = document.createElement('button');
    b.className = 'chip' + (active ? ' active' : '');
    b.type = 'button';
    b.setAttribute('aria-pressed', active ? 'true' : 'false');
    b.textContent = label;
    b.onclick = () => {
        const isOn = !b.classList.contains('active');
        b.classList.toggle('active', isOn);
        b.setAttribute('aria-pressed', isOn ? 'true' : 'false');
        onToggle(isOn);
        renderGrid();
    };
    return b;
}

function renderFolderChips() {
    const imgWrap = document.getElementById('imageFolderChips');
    if (imgWrap) {
        imgWrap.innerHTML = '';
        const imgAll = makeChip('All', selectedImageFolders.has('__ALL__'), (isOn) => {
            if (isOn) { selectedImageFolders = new Set(['__ALL__']); }
            else { selectedImageFolders.delete('__ALL__'); }
        });
        imgWrap.appendChild(imgAll);
        const imgRoot = makeChip('(root)', false, (isOn) => {
            selectedImageFolders.delete('__ALL__');
            if (isOn) selectedImageFolders.add(''); else selectedImageFolders.delete('');
        });
        imgWrap.appendChild(imgRoot);
        imageFolders.forEach(name => {
            const chip = makeChip(name, false, (isOn) => {
                selectedImageFolders.delete('__ALL__');
                if (isOn) selectedImageFolders.add(name); else selectedImageFolders.delete(name);
            });
            imgWrap.appendChild(chip);
        });
    }

    const vidWrap = document.getElementById('videoFolderChips');
    if (vidWrap) {
        vidWrap.innerHTML = '';
        const vidAll = makeChip('All', selectedVideoFolders.has('__ALL__'), (isOn) => {
            if (isOn) { selectedVideoFolders = new Set(['__ALL__']); }
            else { selectedVideoFolders.delete('__ALL__'); }
        });
        vidWrap.appendChild(vidAll);
        const vidRoot = makeChip('(root)', false, (isOn) => {
            selectedVideoFolders.delete('__ALL__');
            if (isOn) selectedVideoFolders.add(''); else selectedVideoFolders.delete('');
        });
        vidWrap.appendChild(vidRoot);
        videoFolders.forEach(name => {
            const chip = makeChip(name, false, (isOn) => {
                selectedVideoFolders.delete('__ALL__');
                if (isOn) selectedVideoFolders.add(name); else selectedVideoFolders.delete(name);
            });
            vidWrap.appendChild(chip);
        });
    }
}

function imagePassesFolderFilter(imgObj) {
    if (selectedImageFolders.has('__ALL__')) return true;
    return selectedImageFolders.has(imgObj.folder || '');
}
function videoPassesFolderFilter(vidObj) {
    if (selectedVideoFolders.has('__ALL__')) return true;
    return selectedVideoFolders.has(vidObj.folder || '');
}

/* ===================== Preview mode switch ===================== */
const previewVideosEl = document.getElementById('previewVideos');
if (previewVideosEl) {
    previewVideosEl.addEventListener('change', (e) => {
        if (videosDisabled) {
            e.target.checked = false;
            return;
        }
        previewVideos = e.target.checked;
        closeVideoBox(true);
        closeShadowbox();
        renderGrid();
    });
}

const disableVideosEl = document.getElementById('disableVideos');
if (disableVideosEl) {
    disableVideosEl.addEventListener('change', (e) => {
        videosDisabled = e.target.checked;
        applyVideoDisableState();
    });
}

/* ===================== Refresh cached thumbnails ===================== */
const refreshBtn = document.getElementById('refreshThumbsBtn');
if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
        if (videosDisabled) return;
        const keys = Object.keys(localStorage);
        keys.forEach(k => { if (k.startsWith(LOCAL_CACHE_PREFIX)) localStorage.removeItem(k); });
        renderGrid();
        alert('Cleared cached thumbnails. They will regenerate lazily as they appear.');
    });
}

// Scalable grid size initialization and listener
const gridSizeSlider = document.getElementById('gridSizeSlider');
if (gridSizeSlider) {
    const savedSize = localStorage.getItem('grid-item-size') || '240';
    gridSizeSlider.value = savedSize;
    document.documentElement.style.setProperty('--grid-item-size', savedSize + 'px');
    
    gridSizeSlider.addEventListener('input', (e) => {
        const val = e.target.value;
        document.documentElement.style.setProperty('--grid-item-size', val + 'px');
        localStorage.setItem('grid-item-size', val);
    });
}

/* ===================== Grid rendering ===================== */
function setupThumbObserver() {
    if (thumbObserver) thumbObserver.disconnect();
    thumbObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const wrap = entry.target;
                const src = wrap.dataset.src;
                const id = wrap.dataset.id;
                const imgEl = wrap.querySelector('img');
                enqueueThumb(id, src, imgEl);
                thumbObserver.unobserve(wrap);
            }
        });
    }, { root: document.getElementById('grid-container'), threshold: 0.2 });
}

function placeholderThumb() {
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360">
      <rect width="100%" height="100%" fill="#222"/>
      <rect x="240" y="120" width="160" height="120" rx="10" fill="#555"/>
      <polygon points="290,145 370,180 290,215" fill="#aaa"/>
    </svg>`
    );
}

function renderGrid() {
    const grid = document.getElementById('grid');
    grid.innerHTML = '';

    const useVideoPreview = previewVideos && !videosDisabled;

    if (imageList.length === 0 && videoList.length === 0) {
        // Render onboarding instructions
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; padding: 60px 40px; text-align: center; background: rgba(255,255,255,0.02); border: 1px dashed rgba(255,255,255,0.1); border-radius: 12px; max-width: 600px; margin: 40px auto; display: flex; flex-direction: column; align-items: center; gap: 16px;">
                <h3 style="margin: 0; color: #fff; font-size: 1.3rem;">Import Your Media</h3>
                <p style="color: #888; font-size: 0.95rem; line-height: 1.6; margin: 0 0 8px 0; max-width: 480px;">
                    This player runs completely offline. Use the <strong>Settings menu (☰)</strong> on the top-left to select your local files or import a whole folder of images, videos, and music!
                </p>
                <div style="display: flex; gap: 12px;">
                    <button class="action-primary" onclick="document.getElementById('fileLoader').click()">Select Files</button>
                    <button class="action-primary" onclick="document.getElementById('folderLoader').click()">Import Folder</button>
                </div>
            </div>
        `;
        return;
    }

    if (!useVideoPreview) {
        // IMAGE MODE (respect folder filter)
        const list = imageList.filter(imagePassesFolderFilter);
        list.forEach((imgObj, i) => {
            const img = document.createElement('img');
            img.loading = 'lazy';
            img.src = imgObj.url;
            img.alt = '';
            img.dataset.id = imgObj.id;
            img.onclick = () => openShadowboxByIndex(i, list);
            grid.appendChild(img);
        });
        return;
    }

    // VIDEO THUMBNAILS (lazy, cached) with folder filter
    setupThumbObserver();
    const vList = videoList.filter(videoPassesFolderFilter);

    vList.forEach((vidObj, i) => {
        const wrap = document.createElement('div');
        wrap.className = 'video-thumb';
        wrap.dataset.src = vidObj.url;
        wrap.dataset.id = vidObj.id;

        const img = document.createElement('img');
        img.alt = '';
        img.loading = 'lazy';
        const cached = localStorage.getItem(LOCAL_CACHE_PREFIX + vidObj.id);
        img.src = cached || placeholderThumb();

        wrap.appendChild(img);
        grid.appendChild(wrap);

        thumbObserver.observe(wrap);

        wrap.addEventListener('click', () => {
            openVideoFocus(i, vList);
        });
    });
}

/* ===================== Auto-scroll ===================== */
const gridContainer = document.getElementById('grid-container');
function startAutoScroll() {
    stopAutoScroll();
    const speed = Math.max(1, +document.getElementById('scrollSpeed').value || 1);
    autoScrollTimer = setInterval(() => {
        if (autoScrollPaused || slideshowActive || videoActive) return;
        if (gridContainer.scrollTop + gridContainer.clientHeight + 2 >= gridContainer.scrollHeight)
            gridContainer.scrollTop = 0;
        else
            gridContainer.scrollTop += speed;
    }, 30);
}
function stopAutoScroll() { if (autoScrollTimer) { clearInterval(autoScrollTimer); autoScrollTimer = null; } }
function pauseAutoScrollForInteraction() {
    autoScrollPaused = true; stopAutoScroll();
    if (inactivityTimer) clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => { autoScrollPaused = false; startAutoScroll(); }, 4000);
}
['wheel', 'touchstart', 'mousedown', 'keydown'].forEach(evt => {
    gridContainer.addEventListener(evt, pauseAutoScrollForInteraction, { passive: true });
});

/* ===================== Swipe Handler ===================== */
function addSwipeListener(el, onLeft, onRight) {
    if (!el) return;
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    const minSwipeDistance = 50;
    const maxSwipeTime = 500; // ms

    el.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
        touchStartTime = Date.now();
    }, { passive: true });

    el.addEventListener('touchend', e => {
        const touchEndX = e.changedTouches[0].screenX;
        const touchEndY = e.changedTouches[0].screenY;
        const duration = Date.now() - touchStartTime;

        if (duration > maxSwipeTime) return;

        const diffX = touchEndX - touchStartX;
        const diffY = touchEndY - touchStartY;

        if (Math.abs(diffY) > Math.abs(diffX)) return;
        if (Math.abs(diffX) < minSwipeDistance) return;

        if (diffX < 0) {
            if (onLeft) onLeft(); // Swipe Left -> Next
        } else {
            if (onRight) onRight(); // Swipe Right -> Prev
        }
    }, { passive: true });
}

/* ===================== Image Shadowbox ===================== */
function applyPreviewFit() {
    const img = document.getElementById('shadowImg');
    const fit = document.getElementById('fitContain').checked;
    img.classList.toggle('preview-fit', fit);
}

const shadowboxEl = document.getElementById('shadowbox');
addSwipeListener(shadowboxEl,
    () => openShadowboxByIndex(currentPreviewIndex + 1), 
    () => openShadowboxByIndex(currentPreviewIndex - 1)  
);

function openShadowboxByIndex(idx, filteredList = null) {
    if (previewVideos) return;
    const list = filteredList || getFilteredImages();
    if (!list.length) return;
    currentPreviewIndex = (idx + list.length) % list.length;
    const img = document.getElementById('shadowImg');
    const currentItem = list[currentPreviewIndex];
    img.src = currentItem.url;
    img.dataset.id = currentItem.id;
    document.getElementById('shadowbox').classList.add('open');
    applyPreviewFit();
    pauseAutoScrollForInteraction();
}
function closeShadowbox() {
    document.getElementById('shadowbox').classList.remove('open');
    currentPreviewIndex = -1;
}

/* ===================== Focus Video Overlay ===================== */
const videoBoxEl = document.getElementById('videoBox');
addSwipeListener(videoBoxEl,
    () => cycleVideoFocus(1), 
    () => cycleVideoFocus(-1) 
);

function cycleVideoFocus(offset) {
    if (!currentFocusVideoList || !currentFocusVideoList.length) return;
    const newIdx = (currentFocusVideoIndex + offset + currentFocusVideoList.length) % currentFocusVideoList.length;
    openVideoFocus(newIdx, currentFocusVideoList);
}

let currentFocusVideoIndex = -1;
let currentFocusVideoList = [];

function openVideoFocus(idx, list) {
    if (videosDisabled) return;
    if (!list.length) return;

    currentFocusVideoIndex = idx;
    currentFocusVideoList = list;
    const currentItem = list[idx];

    videoActive = true;
    stopAutoScroll();
    autoScrollPaused = true;

    const v = document.getElementById('videoFocus');
    v.src = currentItem.url;
    v.dataset.id = currentItem.id;
    v.loop = document.getElementById('videoLoop').checked;
    v.muted = false;
    v.volume = +document.getElementById('videoVolume').value;

    document.getElementById('videoBox').classList.add('open');

    currentVideo = v;
    v.play().catch(() => { });
}
function closeVideoBox(silent = false) {
    const box = document.getElementById('videoBox');
    if (!box.classList.contains('open')) return;
    const v = document.getElementById('videoFocus');
    try { v.pause(); } catch (e) { }
    v.removeAttribute('src'); v.load();
    box.classList.remove('open');

    currentVideo = null;
    videoActive = false;

    if (!silent) {
        autoScrollPaused = false;
        startAutoScroll();
    }
}

/* ===================== Fit-to-Screen live update ===================== */
const fitContainEl = document.getElementById('fitContain');
if (fitContainEl) {
    fitContainEl.addEventListener('change', (e) => {
        const fit = e.target.checked;
        if (slideshowActive && _slides) { _slides.forEach(img => img.classList.toggle('fit-contain', fit)); }
        if (document.getElementById('shadowbox').classList.contains('open')) applyPreviewFit();
    });
}

/* ===================== Audio ===================== */
function populateAudioDropdown() {
    const select = document.getElementById('audioSelect');
    if (!select) return;
    select.innerHTML = '';

    if (!audioList.length) {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = 'No tracks available';
        select.appendChild(opt);
        select.disabled = true;
        return;
    }

    audioList.forEach((audioObj, idx) => {
        const opt = document.createElement('option');
        opt.value = String(idx);
        opt.textContent = audioObj.name || `Track ${idx + 1}`;
        select.appendChild(opt);
    });
    select.disabled = false;
    if (audioIndex >= audioList.length) audioIndex = 0;
    select.value = String(audioIndex);
}

function syncAudioSelect() {
    const select = document.getElementById('audioSelect');
    if (!select) return;
    if (!audioList.length) {
        select.disabled = true;
        select.innerHTML = '<option value="">No tracks available</option>';
        return;
    }
    if (select.options.length !== audioList.length) {
        populateAudioDropdown();
        return;
    }
    select.disabled = false;
    if (audioIndex >= audioList.length) audioIndex = 0;
    select.value = String(audioIndex);
}

function applyAudioLoopBehavior() {
    const loopOn = document.getElementById('audioLoop').checked;
    audioPlayer.loop = loopOn;
    audioPlayer.onended = loopOn ? null : (() => advanceAudioIndex(1));
}

function playAudio() {
    if (!audioList.length) return;
    if (audioIndex < 0 || audioIndex >= audioList.length) audioIndex = 0;
    audioPlayer.src = audioList[audioIndex].url;
    audioPlayer.currentTime = 0;
    audioPlayer.volume = +document.getElementById('audioVolume').value;
    applyAudioLoopBehavior();
    audioPlayer.play().catch(() => { });
    syncAudioSelect();
}

function advanceAudioIndex(offset) {
    if (!audioList.length) return;
    audioIndex = (audioIndex + offset + audioList.length) % audioList.length;
    playAudio();
}

function nextAudio() {
    advanceAudioIndex(1);
}
function prevAudio() {
    advanceAudioIndex(-1);
}

function stopAudio() {
    try { audioPlayer.pause(); } catch (e) { }
    audioPlayer.currentTime = 0;
}

const audioVolEl = document.getElementById('audioVolume');
if (audioVolEl) audioVolEl.oninput = e => audioPlayer.volume = +e.target.value;

const audioLoopEl = document.getElementById('audioLoop');
if (audioLoopEl) audioLoopEl.onchange = applyAudioLoopBehavior;

const audioSelectEl = document.getElementById('audioSelect');
if (audioSelectEl) {
    audioSelectEl.addEventListener('change', (e) => {
        const idx = parseInt(e.target.value, 10);
        if (Number.isNaN(idx)) return;
        audioIndex = idx;
        playAudio();
    });
}

/* ===================== Main Video Player (with history) ===================== */
let videoHistory = [];
let videoHistoryPos = -1;

function applyVideoDisableState(render = true) {
    const disabled = videosDisabled;

    const toggle = document.getElementById('disableVideos');
    if (toggle) toggle.checked = disabled;

    ['videoStartBtn', 'videoNextBtn', 'videoPrevBtn'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.disabled = disabled;
    });

    const loopEl = document.getElementById('videoLoop');
    if (loopEl) loopEl.disabled = disabled;

    const previewToggle = document.getElementById('previewVideos');
    if (previewToggle) {
        previewToggle.disabled = disabled;
        if (disabled && previewVideos) {
            previewVideos = false;
            previewToggle.checked = false;
        }
    }

    const refreshBtn = document.getElementById('refreshThumbsBtn');
    if (refreshBtn) refreshBtn.disabled = disabled;

    if (disabled) {
        closeVideoBox(true);
        if (currentVideo && currentVideo.parentNode) {
            try { currentVideo.pause(); } catch (e) { }
            currentVideo.parentNode.removeChild(currentVideo);
        }
        currentVideo = null;
        videoActive = false;
        videoHistory = [];
        videoHistoryPos = -1;
        const gridWrap = document.getElementById('grid-container');
        if (gridWrap) gridWrap.style.display = '';
        const stage = document.getElementById('slideshow');
        if (stage) stage.classList.remove('on');
    }

    if (render) renderGrid();
}

function playVideo() {
    closeMenu();
    if (videosDisabled) return;
    const vList = videoList.filter(videoPassesFolderFilter);
    if (!vList.length) return;
    const idx = Math.floor(Math.random() * vList.length);
    playVideoAtAbsolute(vList, idx, false);
}
function nextVideo(random = false) {
    if (videosDisabled) return;
    const vList = videoList.filter(videoPassesFolderFilter);
    if (!vList.length) return;
    let idx;
    if (random) {
        if (vList.length === 1) idx = 0;
        else { do { idx = Math.floor(Math.random() * vList.length); } while (idx === videoIndex); }
    } else { idx = (videoIndex + 1) % vList.length; }
    playVideoAtAbsolute(vList, idx, false);
}
function prevVideo() {
    if (videosDisabled) return;
    if (videoHistoryPos > 0) {
        videoHistoryPos--;
        const state = videoHistory[videoHistoryPos];
        playVideoAtAbsolute(state.list, state.index, true);
    }
}
const videoVolEl = document.getElementById('videoVolume');
if (videoVolEl) {
    videoVolEl.oninput = e => { if (currentVideo) currentVideo.volume = +e.target.value; };
}

const videoLoopEl = document.getElementById('videoLoop');
if (videoLoopEl) {
    videoLoopEl.onchange = () => {
        if (currentVideo) {
            const loopOn = videoLoopEl.checked;
            currentVideo.loop = loopOn;
        }
    };
}

function playVideoAtAbsolute(list, idx, fromHistory) {
    if (videosDisabled) return;
    if (!list.length) return;
    idx = ((idx % list.length) + list.length) % list.length;
    videoIndex = idx;

    closeVideoBox(true); // Close focus if open

    const v = document.createElement('video');
    const currentItem = list[idx];
    v.src = currentItem.url;
    v.dataset.id = currentItem.id;

    addSwipeListener(v,
        () => nextVideo(),
        () => prevVideo()
    );

    v.autoplay = true; v.controls = true; v.playsInline = true;
    const volEl = document.getElementById('videoVolume');
    v.volume = volEl ? +volEl.value : 1;
    v.style.position = 'absolute'; v.style.inset = '0';
    v.style.width = '100%'; v.style.height = '100%'; v.style.objectFit = 'contain';

    const loopEl = document.getElementById('videoLoop');
    const loopOn = loopEl ? loopEl.checked : false;
    v.loop = loopOn;

    videoActive = true; slideshowActive = false;
    document.getElementById('slideshow').classList.remove('on');
    document.getElementById('grid-container').style.display = 'none';
    document.getElementById('main').appendChild(v);

    if (currentVideo && currentVideo.parentNode) currentVideo.parentNode.removeChild(currentVideo);
    currentVideo = v;

    if (!fromHistory) {
        const snapshot = { list: list.slice(), index: idx };
        if (videoHistoryPos < videoHistory.length - 1) videoHistory = videoHistory.slice(0, videoHistoryPos + 1);
        videoHistory.push(snapshot); videoHistoryPos = videoHistory.length - 1;
    }
}

/* ===================== Slideshow (fade + Ken Burns) ===================== */
let _slides = null;
let _goToSlide = null;

function startSlideshow() {
    closeMenu();
    const filtered = getFilteredImages();
    if (!filtered.length) return;
    slideshowActive = true; videoActive = false;

    closeVideoBox(true);
    if (currentVideo && currentVideo.parentNode) { try { currentVideo.pause(); } catch (e) { } currentVideo.parentNode.removeChild(currentVideo); currentVideo = null; }

    document.getElementById('grid-container').style.display = 'none';
    const stage = document.getElementById('slideshow');
    stage.innerHTML = ''; stage.classList.add('on');

    const fadeEl = document.getElementById('fadeTime');
    const slideEl = document.getElementById('slideTime');
    const fadeMs = Math.max(0, (fadeEl ? +fadeEl.value : 1) * 1000);
    const slideMs = Math.max(1, (slideEl ? +slideEl.value : 5) * 1000);
    document.documentElement.style.setProperty('--fade-ms', `${fadeMs}ms`);

    const fitEl = document.getElementById('fitContain');
    const fitContain = fitEl ? fitEl.checked : true;

    const transSelect = document.getElementById('transitionSelect');
    const transitionType = transSelect ? transSelect.value : 'kenburns';
    const useKB = (transitionType === 'kenburns');

    const kbZoomEl = document.getElementById('kbZoom');
    const kbDurEl = document.getElementById('kbDuration');
    const kbZoom = (kbZoomEl ? +kbZoomEl.value : 1.2) || 1.2;
    const kbDuration = (kbDurEl ? +kbDurEl.value : 10) || 10;
    document.documentElement.style.setProperty('--kb-duration', `${kbDuration}s`);

    // Show/hide zoom options based on Ken Burns selection
    const kbOptsPanel = document.getElementById('kbOptions');
    if (kbOptsPanel) {
        kbOptsPanel.style.display = useKB ? 'flex' : 'none';
    }

    filtered.forEach(imgObj => {
        const img = document.createElement('img');
        img.src = imgObj.url;
        img.dataset.id = imgObj.id;
        if (fitContain) img.classList.add('fit-contain');
        stage.appendChild(img);
    });

    const slides = Array.from(stage.querySelectorAll('img'));
    _slides = slides; slideIndex = 0;

    function applyRandomKB(img) {
        const zoomOnly = Math.random() < 0.25;
        const maxShift = 8;
        const randPct = (m) => (Math.random() * 2 * m - m).toFixed(2) + '%';
        const scaleEnd = kbZoom;
        const oxStart = zoomOnly ? '0%' : randPct(maxShift);
        const oyStart = zoomOnly ? '0%' : randPct(maxShift);
        const oxEnd = zoomOnly ? '0%' : randPct(maxShift);
        const oyEnd = zoomOnly ? '0%' : randPct(maxShift);

        img.style.setProperty('--ox-start', oxStart);
        img.style.setProperty('--oy-start', oyStart);
        img.style.setProperty('--ox-end', oxEnd);
        img.style.setProperty('--oy-end', oyEnd);
        img.style.setProperty('--scale-start', 1);
        img.style.setProperty('--scale-end', scaleEnd);
        img.classList.remove('kb'); void img.offsetWidth; img.classList.add('kb');
    }

    function goToSlide(idx) {
        slideIndex = (idx + slides.length) % slides.length;
        slides.forEach((im, i) => {
            im.classList.remove('active', 'kb', 'slide-fade', 'slide-slide-h', 'slide-slide-v', 'slide-zoom', 'slide-crt');
            if (i === slideIndex) {
                im.classList.add('active');
                if (useKB) {
                    applyRandomKB(im);
                } else {
                    void im.offsetWidth; // Reflow to restart CSS animation
                    im.classList.add('slide-' + transitionType);
                }
            }
        });
    }
    _goToSlide = goToSlide;

    addSwipeListener(stage,
        () => goToSlide(slideIndex + 1), 
        () => goToSlide(slideIndex - 1)  
    );

    clearInterval(slideTimer);
    goToSlide(0);
    slideTimer = setInterval(() => goToSlide(slideIndex + 1), slideMs);
}

/* ===================== Keyboard handling ===================== */
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (confirmOpen) { hideConfirm(); e.preventDefault(); return; }
        const anyClosed = closePreviewAndStop();
        if (anyClosed) { e.preventDefault(); return; }
    }

    if (e.key === 'Enter' && confirmOpen) {
        e.preventDefault(); confirmDeleteNow(); return;
    }

    const previewOpen = document.getElementById('shadowbox').classList.contains('open');
    if (previewOpen) {
        if (e.key === 'ArrowRight') { e.preventDefault(); openShadowboxByIndex(currentPreviewIndex + 1); return; }
        if (e.key === 'ArrowLeft') { e.preventDefault(); openShadowboxByIndex(currentPreviewIndex - 1); return; }
        if (e.key === 'Delete' && !confirmOpen) {
            e.preventDefault();
            const currentItem = document.getElementById('shadowImg');
            const id = currentItem.dataset.id;
            if (id) showConfirm(id);
        }
        return;
    }

    const focusOpen = document.getElementById('videoBox').classList.contains('open');
    if (focusOpen) {
        if (e.key === 'ArrowRight') { e.preventDefault(); cycleVideoFocus(1); return; }
        if (e.key === 'ArrowLeft') { e.preventDefault(); cycleVideoFocus(-1); return; }
        return; 
    }

    if (e.key === 'Delete' && slideshowActive && !confirmOpen) {
        e.preventDefault();
        const slides = _slides || [];
        if (!slides.length) return;
        const currentItem = slides[slideIndex];
        const id = currentItem?.dataset.id;
        if (id) showConfirm(id);
        return;
    }

    if (e.key === 'ArrowRight') {
        if (slideshowActive && typeof _goToSlide === 'function') { _goToSlide(slideIndex + 1); }
        else if (videoActive) { nextVideo(); }
        else { nextAudio(); }
    } else if (e.key === 'ArrowLeft') {
        if (slideshowActive && typeof _goToSlide === 'function') { _goToSlide(slideIndex - 1); }
        else if (videoActive) { prevVideo(); }
        else { prevAudio(); }
    }
});

function closePreviewAndStop() {
    let changed = false;
    if (slideshowActive) { endAll(); changed = true; }
    if (document.getElementById('shadowbox').classList.contains('open')) { closeShadowbox(); changed = true; }
    if (document.getElementById('videoBox').classList.contains('open')) { closeVideoBox(); changed = true; }
    return changed;
}

/* ===================== Deletion confirm modal & delete call ===================== */
const modal = document.getElementById('confirmModal');
const confirmPathEl = document.getElementById('confirmPath');
const confirmCancelBtn = document.getElementById('confirmCancel');
if (confirmCancelBtn) confirmCancelBtn.onclick = hideConfirm;
const confirmOkBtn = document.getElementById('confirmOk');
if (confirmOkBtn) confirmOkBtn.onclick = confirmDeleteNow;

function showConfirm(id) {
    confirmOpen = true;
    pendingDeleteId = id; 
    
    // Find item name
    const itemObj = imageList.find(i => i.id === id) || videoList.find(v => v.id === id);
    confirmPathEl.textContent = itemObj ? `${itemObj.name} (Folder: ${itemObj.folder || 'root'})` : 'Selected item';
    modal.classList.add('open');
}
function hideConfirm() {
    confirmOpen = false;
    pendingDeleteId = null;
    modal.classList.remove('open');
}

async function confirmDeleteNow() {
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;

    try {
        await deleteMediaFromDB(id);
        
        // Remove from imageList
        const deletedImg = imageList.find(p => p.id === id);
        if (deletedImg) {
            URL.revokeObjectURL(deletedImg.url);
            imageList = imageList.filter(p => p.id !== id);
        }
        
        // Remove from videoList
        const deletedVid = videoList.find(p => p.id === id);
        if (deletedVid) {
            URL.revokeObjectURL(deletedVid.url);
            videoList = videoList.filter(p => p.id !== id);
        }
        
        // Clear local storage video thumbnail cache
        localStorage.removeItem(LOCAL_CACHE_PREFIX + id);

        // 2) If slideshow active, remove node and advance/close
        if (_slides && _slides.length) {
            const stage = document.getElementById('slideshow');
            const imgs = Array.from(stage.querySelectorAll('img'));
            const toRemove = imgs.find(im => im.dataset.id === id);
            if (toRemove && toRemove.parentNode) toRemove.parentNode.removeChild(toRemove);
            _slides = Array.from(stage.querySelectorAll('img'));
            if (_slides.length === 0) {
                endAll();
            } else {
                slideIndex = Math.min(slideIndex, _slides.length - 1);
                if (typeof _goToSlide === 'function') _goToSlide(slideIndex);
            }
        }

        // 3) If lightbox open, advance or close
        if (document.getElementById('shadowbox').classList.contains('open')) {
            const filtered = getFilteredImages();
            if (!filtered.length) {
                closeShadowbox();
            } else {
                currentPreviewIndex = Math.min(currentPreviewIndex, filtered.length - 1);
                const img = document.getElementById('shadowImg');
                img.src = filtered[currentPreviewIndex].url;
                img.dataset.id = filtered[currentPreviewIndex].id;
            }
        }

        // Refresh database count status text
        const dbStatus = document.getElementById('db-status');
        if (dbStatus) {
            const total = imageList.length + videoList.length + audioList.length;
            dbStatus.textContent = `Loaded ${total} files locally (${imageList.length} img, ${videoList.length} vid, ${audioList.length} audio)`;
        }

        // 4) Refresh grid
        renderGrid();

    } catch (err) {
        alert('Delete failed.');
    } finally {
        hideConfirm();
    }
}

/* ===================== End / Back to preview ===================== */
function endAll() {
    slideshowActive = false; videoActive = false;
    closeVideoBox(true);
    if (currentVideo && currentVideo.parentNode) { try { currentVideo.pause(); } catch (e) { } currentVideo.parentNode.removeChild(currentVideo); currentVideo = null; }
    if (slideTimer) { clearInterval(slideTimer); slideTimer = null; }
    const stage = document.getElementById('slideshow'); stage.classList.remove('on'); stage.innerHTML = '';
    document.getElementById('grid-container').style.display = '';
    autoScrollPaused = false; startAutoScroll();
}

/* ===================== Thumbnail pipeline ===================== */
function enqueueThumb(id, src, imgEl) {
    const cached = localStorage.getItem(LOCAL_CACHE_PREFIX + id);
    if (cached) { imgEl.src = cached; return; }
    if (thumbQueue.find(j => j.id === id)) return;
    thumbQueue.push({ id, src, imgEl });
    kickProcessQueue();
}
function kickProcessQueue() {
    if (thumbInFlight >= THUMB_CONCURRENCY) return;
    if (!thumbQueue.length) return;
    thumbInFlight++;
    rIC(processOneThumb);
}
function processOneThumb() {
    const job = thumbQueue.shift();
    if (!job) { thumbInFlight = Math.max(thumbInFlight - 1, 0); return; }
    generateThumb(job.src).then(dataURL => {
        if (dataURL) {
            localStorage.setItem(LOCAL_CACHE_PREFIX + job.id, dataURL);
            job.imgEl.src = dataURL;
        }
    }).catch(() => { }).finally(() => {
        thumbInFlight = Math.max(thumbInFlight - 1, 0);
        rIC(kickProcessQueue);
    });
}
function generateThumb(src) {
    return new Promise((resolve) => {
        let finished = false;
        const finish = (url) => { if (finished) return; finished = true; resolve(url || null); };

        workerVideo.onloadedmetadata = () => {
            const dur = workerVideo.duration && isFinite(workerVideo.duration) ? workerVideo.duration : 0;
            let t = dur ? Math.min(Math.max(dur * THUMB_FRACTION, 0.1), dur - 0.25) : 0.1;
            try { workerVideo.currentTime = t; } catch (e) { finish(null); }
        };
        workerVideo.onseeked = () => {
            try {
                const vw = workerVideo.videoWidth || 640;
                const vh = workerVideo.videoHeight || 360;
                const tw = THUMB_WIDTH;
                const th = Math.max(1, Math.round(tw * (vh / vw)));
                workerCanvas.width = tw; workerCanvas.height = th;
                workerCtx.drawImage(workerVideo, 0, 0, tw, th);
                const url = workerCanvas.toDataURL('image/jpeg', 0.8);
                finish(url);
            } catch (e) { finish(null); }
            workerVideo.removeAttribute('src'); workerVideo.load();
        };
        workerVideo.onerror = () => { finish(null); };
        requestAnimationFrame(() => { workerVideo.src = src; });
        setTimeout(() => finish(null), 5000);
    });
}

// ==========================================
// BACKUP & RESTORE UTILITIES
// ==========================================
function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

function base64ToBlob(base64Data) {
    const parts = base64Data.split(';base64,');
    const contentType = parts[0].split(':')[1];
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);
    for (let i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
    }
    return new Blob([uInt8Array], { type: contentType });
}

async function backupGallery() {
    const btn = document.getElementById('backupBtn');
    if (!btn) return;
    btn.disabled = true;
    btn.textContent = 'Saving...';

    try {
        const items = await getAllMediaFromDB();
        const exportData = [];

        for (let item of items) {
            const base64 = await blobToBase64(item.blob);
            exportData.push({
                id: item.id,
                name: item.name,
                type: item.type,
                folder: item.folder || '',
                base64: base64
            });
        }

        const dataStr = JSON.stringify(exportData);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

        const filename = 'slideshow_backup_' + new Date().toISOString().split('T')[0] + '.json';
        const a = document.createElement('a');
        a.setAttribute('href', dataUri);
        a.setAttribute('download', filename);
        a.click();

        alert(`Backup created successfully! File saved: ${filename}`);
    } catch (e) {
        console.error("Backup failed:", e);
        alert("Failed to package the backup file.");
    } finally {
        btn.disabled = false;
        btn.textContent = 'Backup';
    }
}

async function handleRestoreFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    const dbStatus = document.getElementById('db-status');
    if (dbStatus) dbStatus.textContent = 'Reading backup file...';

    const reader = new FileReader();
    reader.onload = async (evt) => {
        try {
            const data = JSON.parse(evt.target.result);
            if (!Array.isArray(data)) {
                alert("Invalid backup file format.");
                return;
            }

            if (dbStatus) dbStatus.textContent = `Restoring ${data.length} items...`;

            for (let item of data) {
                const blob = base64ToBlob(item.base64);
                const mediaItem = {
                    id: item.id,
                    name: item.name,
                    type: item.type,
                    folder: item.folder || '',
                    blob: blob
                };
                await addMediaToDB(mediaItem);
            }

            alert("Restore successful! Gallery updated.");
            loadMedia();
        } catch (err) {
            console.error("Restore failed:", err);
            alert("Error parsing backup data. Make sure it is a valid slideshow JSON backup.");
        } finally {
            e.target.value = '';
        }
    };
    reader.readAsText(file);
}

// Bind backup/restore buttons
const backupBtn = document.getElementById('backupBtn');
if (backupBtn) backupBtn.addEventListener('click', backupGallery);

const restoreLoader = document.getElementById('restoreLoader');
if (restoreLoader) restoreLoader.addEventListener('change', handleRestoreFile);

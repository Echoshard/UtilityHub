// --- DIFF MASTER APPLICATION LOGIC ---

// Inputs
const textLeft = document.getElementById('textLeft');
const textRight = document.getElementById('textRight');
const fileLeft = document.getElementById('fileLeft');
const fileRight = document.getElementById('fileRight');

// Controls
const compareBtn = document.getElementById('compareBtn');
const clearBtn = document.getElementById('clearBtn');
const downloadBtn = document.getElementById('downloadBtn');
const segments = document.querySelectorAll('.segment');

// Views
const sideBySideView = document.getElementById('sideBySideView');
const inlineView = document.getElementById('inlineView');
const paneLeft = document.getElementById('paneLeft');
const paneRight = document.getElementById('paneRight');

// State
let currentViewMode = 'side-by-side';
let diffResult = [];
let leftFileName = 'merged_diff.txt';

// Sample Text on load
const SAMPLE_LEFT = `// UtilityHub Diff Example
function calculateTotal(items) {
    let total = 0;
    for (let i = 0; i < items.length; i++) {
        total += items[i].price;
    }
    return total;
}

// Deprecated function
function oldLogger() {
    console.log("Called logger");
}`;

const SAMPLE_RIGHT = `// UtilityHub Diff Example
function calculateTotal(items) {
    let total = 0;
    // Iterate and sum values
    items.forEach(item => {
        total += item.price;
    });
    return total;
}

function newLogger() {
    console.info("Info logger");
}`;

// --- INITIALIZATION ---
textLeft.value = SAMPLE_LEFT;
textRight.value = SAMPLE_RIGHT;

// Sync Scrolling for Side-by-Side panes
let isSyncingLeftScroll = false;
let isSyncingRightScroll = false;

paneLeft.addEventListener('scroll', () => {
    if (!isSyncingLeftScroll) {
        isSyncingRightScroll = true;
        paneRight.scrollTop = paneLeft.scrollTop;
        paneRight.scrollLeft = paneLeft.scrollLeft;
    }
    isSyncingLeftScroll = false;
});

paneRight.addEventListener('scroll', () => {
    if (!isSyncingRightScroll) {
        isSyncingLeftScroll = true;
        paneLeft.scrollTop = paneRight.scrollTop;
        paneLeft.scrollLeft = paneRight.scrollLeft;
    }
    isSyncingRightScroll = false;
});

// View mode switcher
segments.forEach(seg => {
    seg.addEventListener('click', () => {
        segments.forEach(s => s.classList.remove('active'));
        seg.classList.add('active');
        currentViewMode = seg.dataset.mode;
        
        if (currentViewMode === 'side-by-side') {
            sideBySideView.classList.add('active');
            inlineView.classList.remove('active');
        } else {
            sideBySideView.classList.remove('active');
            inlineView.classList.add('active');
        }
        renderDiff();
    });
});

// File upload readers
fileLeft.addEventListener('change', (e) => readFile(e.target, textLeft));
fileRight.addEventListener('change', (e) => readFile(e.target, textRight));

function readFile(input, targetTextArea) {
    const file = input.files[0];
    if (!file) return;
    if (targetTextArea === textLeft) {
        const dotIdx = file.name.lastIndexOf('.');
        if (dotIdx !== -1) {
            leftFileName = file.name.substring(0, dotIdx) + '_merged' + file.name.substring(dotIdx);
        } else {
            leftFileName = file.name + '_merged.txt';
        }
    }
    const reader = new FileReader();
    reader.onload = (e) => {
        targetTextArea.value = e.target.result;
        performDiff();
    };
    reader.readAsText(file);
}

// Clear action
clearBtn.addEventListener('click', () => {
    textLeft.value = '';
    textRight.value = '';
    paneLeft.innerHTML = '';
    paneRight.innerHTML = '';
    inlineView.innerHTML = '';
    leftFileName = 'merged_diff.txt';
});

// Compare action
compareBtn.addEventListener('click', performDiff);

// Download action
downloadBtn.addEventListener('click', () => {
    const text = textLeft.value;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = leftFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

// --- LCS DIFF ALGORITHM ---
function computeLCS(arr1, arr2) {
    const n = arr1.length;
    const m = arr2.length;
    const dp = Array(n + 1).fill(0).map(() => Array(m + 1).fill(0));
    
    for (let i = 1; i <= n; i++) {
        for (let j = 1; j <= m; j++) {
            if (arr1[i - 1] === arr2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }
    
    let i = n, j = m;
    const steps = [];
    
    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && arr1[i - 1] === arr2[j - 1]) {
            steps.push({ type: 'unchanged', left: arr1[i - 1], right: arr2[j - 1], leftLine: i, rightLine: j });
            i--;
            j--;
        } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
            steps.push({ type: 'add', val: arr2[j - 1], rightLine: j });
            j--;
        } else {
            steps.push({ type: 'delete', val: arr1[i - 1], leftLine: i });
            i--;
        }
    }
    
    return steps.reverse();
}

function performDiff() {
    const leftText = textLeft.value;
    const rightText = textRight.value;
    
    const leftLines = leftText.split(/\r?\n/);
    const rightLines = rightText.split(/\r?\n/);
    
    diffResult = computeLCS(leftLines, rightLines);
    renderDiff();
}

// Helper to escape HTML tags to print plaintext safely
function escapeHTML(str) {
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;');
}

// --- RENDER VIEWS ---
function renderDiff() {
    paneLeft.innerHTML = '';
    paneRight.innerHTML = '';
    inlineView.innerHTML = '';

    if (diffResult.length === 0) {
        return;
    }

    if (currentViewMode === 'side-by-side') {
        renderSideBySide();
    } else {
        renderInline();
    }
}

function renderSideBySide() {
    diffResult.forEach((item, index) => {
        const rowLeft = document.createElement('div');
        const rowRight = document.createElement('div');
        const mergeWrapper = document.createElement('div');
        mergeWrapper.className = 'diff-row-wrapper';

        if (item.type === 'unchanged') {
            rowLeft.className = 'diff-row';
            rowLeft.innerHTML = `<span class="diff-num">${item.leftLine}</span><span class="diff-text">${escapeHTML(item.left)}</span>`;
            
            rowRight.className = 'diff-row';
            rowRight.innerHTML = `<span class="diff-num">${item.rightLine}</span><span class="diff-text">${escapeHTML(item.right)}</span>`;
        } 
        else if (item.type === 'delete') {
            rowLeft.className = 'diff-row del';
            rowLeft.innerHTML = `<span class="diff-num">${item.leftLine}</span><span class="diff-text">${escapeHTML(item.val)}</span>`;
            
            rowRight.className = 'diff-row empty';
            rowRight.innerHTML = `<span class="diff-num">-</span><span class="diff-text"></span>`;

            // Merge control: deletion means we can delete from left to match right
            const mergeCol = document.createElement('div');
            mergeCol.className = 'merge-col';
            const btn = document.createElement('button');
            btn.className = 'btn-merge';
            btn.innerHTML = '✖';
            btn.title = 'Remove this line from original text';
            btn.addEventListener('click', () => mergeLine(index, 'delete'));
            mergeCol.appendChild(btn);
            mergeWrapper.appendChild(mergeCol);
        } 
        else if (item.type === 'add') {
            rowLeft.className = 'diff-row empty';
            rowLeft.innerHTML = `<span class="diff-num">-</span><span class="diff-text"></span>`;
            
            rowRight.className = 'diff-row add';
            rowRight.innerHTML = `<span class="diff-num">${item.rightLine}</span><span class="diff-text">${escapeHTML(item.val)}</span>`;

            // Merge control: addition means we can copy from right to left
            const mergeCol = document.createElement('div');
            mergeCol.className = 'merge-col';
            const btn = document.createElement('button');
            btn.className = 'btn-merge';
            btn.innerHTML = '◀';
            btn.title = 'Merge this line into original text';
            btn.addEventListener('click', () => mergeLine(index, 'add'));
            mergeCol.appendChild(btn);
            mergeWrapper.appendChild(mergeCol);
        }

        // Add matching rows to panes
        paneLeft.appendChild(rowLeft);
        
        // Wrapping the right row with the merge UI wrapper
        mergeWrapper.appendChild(rowRight);
        paneRight.appendChild(mergeWrapper);
    });
}

function renderInline() {
    let leftLineNum = 1;
    let rightLineNum = 1;

    diffResult.forEach(item => {
        const row = document.createElement('div');
        
        if (item.type === 'unchanged') {
            row.className = 'inline-row';
            row.innerHTML = `<span class="inline-num">${leftLineNum}</span><span class="inline-sign"> </span><span class="inline-text">${escapeHTML(item.left)}</span>`;
            leftLineNum++;
            rightLineNum++;
        } 
        else if (item.type === 'delete') {
            row.className = 'inline-row del';
            row.innerHTML = `<span class="inline-num">${leftLineNum}</span><span class="inline-sign">-</span><span class="inline-text">${escapeHTML(item.val)}</span>`;
            leftLineNum++;
        } 
        else if (item.type === 'add') {
            row.className = 'inline-row add';
            row.innerHTML = `<span class="inline-num">${rightLineNum}</span><span class="inline-sign">+</span><span class="inline-text">${escapeHTML(item.val)}</span>`;
            rightLineNum++;
        }
        
        inlineView.appendChild(row);
    });
}

// --- INTERACTIVE MERGING LOGIC ---
function mergeLine(diffIdx, type) {
    const originalText = textLeft.value;
    const originalLines = originalText.split(/\r?\n/);
    const item = diffResult[diffIdx];

    if (type === 'delete') {
        // Remove line from left side
        const lineIndex = item.leftLine - 1; // 1-indexed to 0-indexed
        originalLines.splice(lineIndex, 1);
    } 
    else if (type === 'add') {
        // Insert right line into left side. We need to calculate correct insertion index.
        // We find the line number of the closest preceding unchanged/deleted line on the left.
        let insertPos = 0;
        
        // Search backwards to find closest left line position
        for (let k = diffIdx - 1; k >= 0; k--) {
            const prev = diffResult[k];
            if (prev.type === 'unchanged') {
                insertPos = prev.leftLine; // inserts right after it
                break;
            } else if (prev.type === 'delete') {
                insertPos = prev.leftLine; // inserts right after it
                break;
            }
        }
        
        originalLines.splice(insertPos, 0, item.val);
    }

    // Write back and re-evaluate diff
    textLeft.value = originalLines.join('\n');
    performDiff();
}

// Initial calculation
performDiff();

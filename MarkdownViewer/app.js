document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const editor = document.getElementById('editor');
    const previewContent = document.getElementById('preview-content');
    const previewWrapper = document.getElementById('preview-wrapper');
    const docTitleInput = document.getElementById('doc-title');
    const syncScrollChk = document.getElementById('chk-sync-scroll');
    
    // Buttons
    const btnSidebarClose = document.getElementById('btn-sidebar-close');
    const btnSidebarOpen = document.getElementById('btn-sidebar-open');
    const sidebar = document.getElementById('sidebar');
    const btnImport = document.getElementById('btn-import');
    const fileLoader = document.getElementById('file-loader');
    const btnExportMd = document.getElementById('btn-export-md');
    const btnExportPdf = document.getElementById('btn-export-pdf');
    const btnClear = document.getElementById('btn-clear');
    
    // Status & Stats Elements
    const statWords = document.getElementById('stat-words');
    const statChars = document.getElementById('stat-chars');
    const statLines = document.getElementById('stat-lines');
    const statTime = document.getElementById('stat-time');
    const statWordsFooter = document.getElementById('stat-words-footer');
    const statCharsFooter = document.getElementById('stat-chars-footer');
    
    // Themes
    const themeLightBtn = document.getElementById('theme-light');
    const themeDarkBtn = document.getElementById('theme-dark');
    
    // Resizer Elements
    const resizer = document.getElementById('pane-resizer');
    const editorPane = document.getElementById('editor-pane');
    const previewPane = document.getElementById('preview-pane');
    
    // Modal Elements
    const modal = document.getElementById('confirm-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const modalConfirmBtn = document.getElementById('modal-confirm');
    const modalCancelBtn = document.getElementById('modal-cancel');
    
    // State variables
    let activeScrollSource = null;
    let pendingModalAction = null;
    
    // Pre-configured Templates
    const TEMPLATES = {
        readme: `# Project Name

A brief description of what this project does and who it's for.

## Features

- Lightweight & fast
- Full offline support
- Glassmorphic UI
- Real-time side-by-side rendering
- High-fidelity PDF export

## Installation

Install the dependencies and run the project:

\`\`\`bash
# Clone the repository
git clone https://github.com/username/projectname.git

# Navigate to the folder
cd projectname

# Launch application
npm start
\`\`\`

## Usage

Describe how to run and use the project. Give examples.

\`\`\`javascript
const markdownViewer = require('markdownviewer');

markdownViewer.init({
    offlineMode: true,
    theme: 'dark'
});
\`\`\`

## License

[MIT](https://choosealicense.com/licenses/mit/)
`,
        report: `# Executive Report: System Review

**Author:** QA & Core Engineering Team  
**Date:** July 2026  
**Status:** Approved

---

## 1. Executive Summary

This document details the diagnostic performance and scaling limits of our database endpoints under concurrent request loads. Initial test trials indicated high connection overheads under high throughputs, which have since been resolved using persistent connection pools.

## 2. Methodology & Setup

We simulated **10,000 requests per second** across 4 geographical nodes:

- Node A: North America East
- Node B: Western Europe
- Node C: Southeast Asia
- Node D: Tokyo Core

> Connection metrics were compiled using internal logging buffers and verified against third-party load telemetry logs.

## 3. Results Summary

| Node | Peak Latency (p95) | Error Rate | Status |
| :--- | :----------------- | :--------- | :----- |
| NA-East | 120ms | 0.02% | Stable |
| EU-West | 145ms | 0.05% | Stable |
| SE-Asia | 210ms | 0.12% | Monitor |
| JP-Core | 95ms | 0.00% | Optimal |

## 4. Key Recommendations

1. **Enable Cache Layer:** Deploy caching servers for global endpoints.
2. **Database Sharding:** Begin sharding the main transactional logs database by Region Code.
3. **Upgrade Hardware:** Upgrade RAM on Southeast Asia relays.
`,
        'cheat-sheet': `# Markdown Cheat Sheet

Here is a quick reference guide to common Markdown formatting patterns.

## Text Formatting

- **Bold text** using \`**text**\` or \`__text__\`
- *Italic text* using \`*text*\` or \`_text_\`
- ***Bold & Italic*** using \`***text***\`
- ~~Strikethrough~~ using \`~~text~~\`

## Heading Hierarchy

# Heading 1 (\`#\`)
## Heading 2 (\`##\`)
### Heading 3 (\`###\`)
#### Heading 4 (\`####\`)

## Custom Blockquotes

> Blockquotes are written by prepending a \`>\` at the start of a paragraph.
> They can span multiple paragraphs and contain formatting elements.

## Code Formats

Inline code uses backticks: \`const active = true;\`.

Block code uses triple backticks with an optional language identifier:

\`\`\`javascript
function calculateScore(inputs) {
    return inputs.reduce((acc, val) => acc + (val * 1.5), 0);
}
\`\`\`

## Lists

### Unordered List
- Coffee
- Tea
- Milk

### Ordered List
1. First item
2. Second item
3. Third item

### Task Checkboxes
- [x] Create layout skeleton
- [/] Design dark & light themes
- [ ] Implement backend server (not needed!)

## Structured Tables

| Syntax | Description | Align Left | Align Right |
| :--- | :--- | :--- | ---: |
| Header | Title | Left Col | Right Col |
| Paragraph | Text body | L-text | R-text |
`
    };

    const DEFAULT_CONTENT = `# Welcome to MarkDowner! 🚀

This is a premium, fully offline, side-by-side **Markdown Editor and Viewer**.

### Features at a glance:

1. 💻 **Full Offline Support**: Double-click this \`index.html\` to run it anywhere, no server required!
2. 🌗 **Sleek Themes**: Toggle between Slate Dark and Clean Light modes in the sidebar.
3. 📄 **Save to PDF**: Click **Save PDF** to open the browser print manager, styled to output a vector-perfect PDF.
4. ⚙️ **Split Screen Resizer**: Click and drag the thin bar between the panels to resize them to your preference.
5. 📂 **Local Storage**: Automatically saves your content locally.
6. 🎯 **Formatting Helpers**: Insert structures (Bold, Italic, Tables, Lists) instantly with toolbar shortcuts.
7. 🔄 **Scroll Syncing**: Dual scrolls are locked in proportion while you type!

---

### Basic Markdown Quick Guide

#### Task Checklist
- [x] Offline support
- [x] Side-by-side split layout
- [x] Print PDF template styling
- [ ] Upload to cloud database (strictly offline!)

#### Structured Table
| Metric | Performance | Status |
| :--- | :--- | :--- |
| Parsing speed | < 5ms | Optimal |
| Render efficiency | 60 FPS | Excellent |
| Server dependencies | None | Safe |

#### Code Block Syntax Colors
\`\`\`javascript
// This block is colored by the local regex syntax highlighter!
function generateDocumentPDF(filename, contents) {
    console.log("Compiling file: " + filename);
    const pdfOutput = renderEngine.print(contents);
    return pdfOutput;
}
\`\`\`

> Use the sidebar on the left to load pre-configured templates, or view document typing statistics in real-time. Happy documenting!
`;

    // ==========================================
    // INITIALIZATION & STATE MANAGEMENT
    // ==========================================
    
    function init() {
        // Load theme preferences
        const savedTheme = localStorage.getItem('markdown_theme') || 'dark';
        setTheme(savedTheme);

        // Configure Marked parser options
        if (window.marked) {
            marked.use({
                breaks: true,
                gfm: true
            });
        }

        // Initialize Resizer positioning
        const savedPaneSplit = localStorage.getItem('markdown_pane_split');
        if (savedPaneSplit) {
            applyPaneSplit(parseFloat(savedPaneSplit));
        }

        // Load Content and Title
        const storedTitle = localStorage.getItem('markdown_editor_title');
        const storedContent = localStorage.getItem('markdown_editor_content');
        
        docTitleInput.value = storedTitle !== null ? storedTitle : 'Welcome to MarkDowner';
        editor.value = storedContent !== null ? storedContent : DEFAULT_CONTENT;
        
        // Setup Event Listeners
        setupEventListeners();
        
        // Initial render & stats
        renderMarkdown();
        updateStats();
    }

    function saveContent() {
        localStorage.setItem('markdown_editor_content', editor.value);
        localStorage.setItem('markdown_editor_title', docTitleInput.value);
    }

    function closeModal() {
        modal.classList.remove('active');
        pendingModalAction = null;
    }

    // ==========================================
    // MARKDOWN COMPILING & RENDERING
    // ==========================================
    
    function renderMarkdown() {
        const mdText = editor.value;
        
        if (window.marked) {
            try {
                // Compile markdown using library
                let renderedHTML = marked.parse(mdText);
                
                // Set HTML output
                previewContent.innerHTML = renderedHTML;
                
                // Add custom classes to task checkboxes
                processTaskLists();
                
                // Perform syntax highlighting on code blocks
                applySyntaxHighlighting();
            } catch (err) {
                previewContent.innerHTML = `<div style="color:var(--danger); padding:20px;">Markdown Parsing Error: ${err.message}</div>`;
            }
        } else {
            // Fallback if marked is missing
            previewContent.innerHTML = `<pre style="white-space: pre-wrap;">${escapeHtml(mdText)}</pre>`;
        }
    }

    function processTaskLists() {
        // Convert [ ] and [x] in parsed code to styled checkboxes
        const listItems = previewContent.querySelectorAll('li');
        listItems.forEach(li => {
            const html = li.innerHTML.trim();
            if (html.startsWith('[ ]') || html.startsWith('[x]') || html.startsWith('[X]')) {
                const isChecked = html.startsWith('[x]') || html.startsWith('[X]');
                const cleanText = html.substring(3).trim();
                
                li.innerHTML = `<input type="checkbox" disabled ${isChecked ? 'checked' : ''}> <span>${cleanText}</span>`;
                
                // Add class to parent list to remove bullet points
                const parentUl = li.parentElement;
                if (parentUl && !parentUl.classList.contains('task-list')) {
                    parentUl.classList.add('task-list');
                }
            }
        });
    }

    function applySyntaxHighlighting() {
        const codeElements = previewContent.querySelectorAll('pre code');
        codeElements.forEach(codeBlock => {
            let code = codeBlock.innerHTML;
            
            // Unescape HTML first to work with raw code
            code = code.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
            
            // Clean/escape HTML helper
            const escape = (str) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            
            // Apply standard coding highlighter matching string, comments, keywords, operators, function names, and numbers.
            // 1. Mark Comments
            const comments = [];
            code = code.replace(/(\/\/[^\n]*|\/\*[\s\S]*?\*\/)/g, (match) => {
                comments.push(match);
                return `___COMMENT_${comments.length - 1}___`;
            });

            // 2. Mark Strings
            const strings = [];
            code = code.replace(/("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)/g, (match) => {
                strings.push(match);
                return `___STRING_${strings.length - 1}___`;
            });

            // Escape keywords and HTML symbols
            code = escape(code);

            // 3. Highlight Keywords
            const jsKeywords = /\b(const|let|var|function|return|if|else|for|while|import|export|from|class|extends|new|true|false|null|undefined|async|await|try|catch|finally|throw|default|switch|case|break|continue|typeof|instanceof)\b/g;
            code = code.replace(jsKeywords, '<span class="keyword">$1</span>');

            // 4. Highlight Numbers
            code = code.replace(/\b(\d+(\.\d+)?)\b/g, '<span class="number">$1</span>');

            // 5. Highlight Functions
            code = code.replace(/\b(\w+)(?=\s*\()/g, '<span class="function">$1</span>');

            // 6. Highlight Operators
            code = code.replace(/([+\-*\/=<>!&|%^~?:]+)/g, '<span class="operator">$1</span>');

            // Restore comments and strings safely
            code = code.replace(/___STRING_(\d+)___/g, (_, index) => `<span class="string">${escape(strings[index])}</span>`);
            code = code.replace(/___COMMENT_(\d+)___/g, (_, index) => `<span class="comment">${escape(comments[index])}</span>`);

            codeBlock.innerHTML = code;
        });
    }

    function escapeHtml(text) {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // ==========================================
    // DRAFT METRICS
    // ==========================================
    
    function updateStats() {
        const text = editor.value;
        
        // Count characters
        const charCount = text.length;
        
        // Count words
        const cleanText = text.trim();
        const wordCount = cleanText === '' ? 0 : cleanText.split(/\s+/).length;
        
        // Count lines
        const lineCount = text === '' ? 0 : text.split('\n').length;
        
        // Estimate reading time (average 200 words per minute)
        const readTimeMinutes = Math.max(1, Math.round(wordCount / 200));

        // Update DOM
        statWords.textContent = wordCount;
        statChars.textContent = charCount;
        statLines.textContent = lineCount;
        statTime.textContent = readTimeMinutes + 'm';
        
        statWordsFooter.textContent = wordCount + ' words';
        statCharsFooter.textContent = charCount + ' chars';
    }

    // ==========================================
    // FORMATTING HELPERS
    // ==========================================
    
    function insertFormatting(prefix, suffix, defaultText) {
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        const val = editor.value;
        
        const selection = val.substring(start, end);
        const replacementText = selection || defaultText;
        
        editor.value = val.substring(0, start) + prefix + replacementText + suffix + val.substring(end);
        
        // Highlight the newly inserted text
        editor.focus();
        editor.selectionStart = start + prefix.length;
        editor.selectionEnd = start + prefix.length + replacementText.length;
        
        // Trigger render & stats update
        renderMarkdown();
        updateStats();
        saveContent();
    }

    // ==========================================
    // PANE RESIZING LOGIC
    // ==========================================
    
    let isDragging = false;

    function applyPaneSplit(percent) {
        // Clamp between 10% and 90%
        const clampedPercent = Math.max(10, Math.min(90, percent));
        
        editorPane.style.width = clampedPercent + '%';
        previewPane.style.width = (100 - clampedPercent) + '%';
        resizer.style.left = clampedPercent + '%';
        
        localStorage.setItem('markdown_pane_split', clampedPercent);
    }

    // ==========================================
    // EVENT LISTENERS
    // ==========================================
    
    function setupEventListeners() {
        
        // Editor content alterations
        editor.addEventListener('input', () => {
            renderMarkdown();
            updateStats();
            saveContent();
        });

        // Intercept Tab key in textarea
        editor.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = editor.selectionStart;
                const end = editor.selectionEnd;
                const val = editor.value;
                
                editor.value = val.substring(0, start) + '    ' + val.substring(end);
                editor.selectionStart = editor.selectionEnd = start + 4;
                
                renderMarkdown();
                updateStats();
                saveContent();
            }
            
            // Formatting shortcuts (Ctrl+B, Ctrl+I, Ctrl+H, Ctrl+K)
            if (e.ctrlKey) {
                if (e.key === 'b' || e.key === 'B') {
                    e.preventDefault();
                    insertFormatting('**', '**', 'bold text');
                } else if (e.key === 'i' || e.key === 'I') {
                    e.preventDefault();
                    insertFormatting('*', '*', 'italic text');
                } else if (e.key === 'h' || e.key === 'H') {
                    e.preventDefault();
                    insertFormatting('### ', '', 'Heading');
                } else if (e.key === 'k' || e.key === 'K') {
                    e.preventDefault();
                    insertFormatting('[', '](https://example.com)', 'link text');
                }
            }
        });

        // Title changes save immediately
        docTitleInput.addEventListener('input', () => {
            saveContent();
        });

        // Sync Scroll hover lock
        editor.addEventListener('mouseenter', () => activeScrollSource = 'editor');
        previewWrapper.addEventListener('mouseenter', () => activeScrollSource = 'preview');
        
        // Sync scroll events
        editor.addEventListener('scroll', () => {
            if (activeScrollSource === 'editor' && syncScrollChk.checked) {
                const maxEditorScroll = editor.scrollHeight - editor.clientHeight;
                if (maxEditorScroll > 0) {
                    const pct = editor.scrollTop / maxEditorScroll;
                    previewWrapper.scrollTop = pct * (previewWrapper.scrollHeight - previewWrapper.clientHeight);
                }
            }
        });
        
        previewWrapper.addEventListener('scroll', () => {
            if (activeScrollSource === 'preview' && syncScrollChk.checked) {
                const maxPreviewScroll = previewWrapper.scrollHeight - previewWrapper.clientHeight;
                if (maxPreviewScroll > 0) {
                    const pct = previewWrapper.scrollTop / maxPreviewScroll;
                    editor.scrollTop = pct * (editor.scrollHeight - editor.clientHeight);
                }
            }
        });

        // Resizer event handlers
        resizer.addEventListener('mousedown', (e) => {
            e.preventDefault();
            isDragging = true;
            resizer.classList.add('dragging');
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const containerWidth = document.querySelector('.workspace-panes').clientWidth;
            const mouseX = e.clientX;
            
            // Account for sidebar width if open
            const sidebarWidth = sidebar.classList.contains('collapsed') ? 0 : sidebar.clientWidth;
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

        // Sidebar Collapse controls
        btnSidebarClose.addEventListener('click', () => {
            sidebar.classList.add('collapsed');
            btnSidebarOpen.style.display = 'inline-flex';
        });

        btnSidebarOpen.addEventListener('click', () => {
            sidebar.classList.remove('collapsed');
            btnSidebarOpen.style.display = 'none';
        });

        // Import markdown file
        btnImport.addEventListener('click', () => {
            fileLoader.click();
        });

        fileLoader.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (evt) => {
                const title = file.name.replace(/\.[^/.]+$/, ""); // Strip file extension
                const contents = evt.target.result;
                
                docTitleInput.value = title;
                editor.value = contents;
                
                renderMarkdown();
                updateStats();
                saveContent();
                
                // Reset file loader
                fileLoader.value = '';
            };
            reader.readAsText(file);
        });

        // Export as Markdown File
        btnExportMd.addEventListener('click', () => {
            const title = docTitleInput.value.trim() || 'untitled';
            const contents = editor.value;
            
            const blob = new Blob([contents], { type: 'text/markdown;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `${title}.md`;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Clean up memory
            setTimeout(() => URL.revokeObjectURL(url), 100);
        });

        // Save PDF trigger
        btnExportPdf.addEventListener('click', () => {
            saveContent();
            // Call native printing dialog
            window.print();
        });

        // Formatting Insertion Buttons
        document.querySelectorAll('.formatting-toolbar button[data-format]').forEach(btn => {
            btn.addEventListener('click', () => {
                const format = btn.dataset.format;
                switch (format) {
                    case 'bold':
                        insertFormatting('**', '**', 'bold text');
                        break;
                    case 'italic':
                        insertFormatting('*', '*', 'italic text');
                        break;
                    case 'heading':
                        // Check if cursor is at start of line
                        const cursor = editor.selectionStart;
                        const lineStart = editor.value.lastIndexOf('\n', cursor - 1) + 1;
                        if (cursor === lineStart) {
                            insertFormatting('### ', '', 'Heading');
                        } else {
                            insertFormatting('\n### ', '', 'Heading');
                        }
                        break;
                    case 'link':
                        insertFormatting('[', '](https://example.com)', 'link text');
                        break;
                    case 'image':
                        insertFormatting('![', '](https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=600)', 'image alt text');
                        break;
                    case 'code':
                        insertFormatting('\n```javascript\n', '\n```\n', '// code content');
                        break;
                    case 'list-ul':
                        insertFormatting('\n- ', '', 'item');
                        break;
                    case 'list-ol':
                        insertFormatting('\n1. ', '', 'item');
                        break;
                    case 'table':
                        const tableText = `\n| Header 1 | Header 2 |\n| :--- | :--- |\n| Row 1 Col 1 | Row 1 Col 2 |\n| Row 2 Col 1 | Row 2 Col 2 |\n`;
                        insertFormatting(tableText, '', '');
                        break;
                }
            });
        });

        // Clear editor action
        btnClear.addEventListener('click', () => {
            modalTitle.textContent = "Clear Document";
            modalMessage.textContent = "Are you sure you want to clear all text in the current document? You will lose any unsaved content.";
            
            pendingModalAction = () => {
                editor.value = '';
                renderMarkdown();
                updateStats();
                saveContent();
                closeModal();
            };
            
            modal.classList.add('active');
        });

        // Template loading buttons - Insert Directly at cursor
        document.querySelectorAll('.template-card[data-template]').forEach(btn => {
            btn.addEventListener('click', () => {
                const templateKey = btn.dataset.template;
                const templateContent = TEMPLATES[templateKey];
                
                if (templateContent) {
                    const start = editor.selectionStart;
                    const val = editor.value;
                    let prefix = '';
                    
                    if (val.trim() !== '') {
                        if (start > 0 && val[start - 1] !== '\n') {
                            prefix = '\n\n';
                        } else if (start > 1 && val[start - 1] === '\n' && val[start - 2] !== '\n') {
                            prefix = '\n';
                        }
                    }
                    
                    insertFormatting(prefix + templateContent, '', '');
                }
            });
        });

        // Theme toggler handles
        themeLightBtn.addEventListener('click', () => setTheme('light'));
        themeDarkBtn.addEventListener('click', () => setTheme('dark'));

        // Modal triggers
        modalCancelBtn.addEventListener('click', closeModal);
        modalConfirmBtn.addEventListener('click', () => {
            if (pendingModalAction) pendingModalAction();
        });

        // Close modal clicking outside content
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
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

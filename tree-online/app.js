// Tree Generator App Logic

document.addEventListener('DOMContentLoaded', () => {
    // Select elements
    const treeInput = document.getElementById('treeInput');
    const treeOutput = document.getElementById('treeOutput');
    const lineNumbers = document.getElementById('lineNumbers');
    const lineCount = document.getElementById('lineCount');
    
    const optFancy = document.getElementById('optFancy');
    const optTrailing = document.getElementById('optTrailing');
    const optFullPath = document.getElementById('optFullPath');
    const optRootDot = document.getElementById('optRootDot');
    const optFoldersOnly = document.getElementById('optFoldersOnly');
    
    const templateSelect = document.getElementById('templateSelect');
    const importBtn = document.getElementById('importBtn');
    const folderInput = document.getElementById('folderInput');
    
    const copyBtn = document.getElementById('copyBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const shareBtn = document.getElementById('shareBtn');
    const toast = document.getElementById('toast');

    // Default template templates definition
    const TEMPLATES = {
        web: `my-website-project
  src
    components
      Header.js
      Footer.js
      MainContent.js
    assets
      images
        logo.png
      styles
        global.css
    index.html
  package.json
  README.md`,
        
        python: `requests-wrapper
  requests_wrapper
    __init__.py
    client.py
    exceptions.py
    utils.py
  tests
    test_client.py
    test_utils.py
  requirements.txt
  setup.py
  LICENSE`,
        
        rust: `actix-web-db
  src
    main.rs
    db.rs
    handlers.rs
    models.rs
  tests
    integration.rs
  Cargo.toml
  Cargo.lock
  .gitignore`,
        
        minimal: `root
  folder-a
    file-a1.txt
  folder-b
    file-b1.txt`
    };

    // Initialize line numbers sidebar and textarea synchronization
    function updateLineNumbers() {
        const text = treeInput.value;
        const lines = text.split('\n');
        const count = lines.length;
        
        lineCount.textContent = count;
        
        let numbersHtml = '';
        for (let i = 1; i <= count; i++) {
            numbersHtml += `<div>${i}</div>`;
        }
        lineNumbers.innerHTML = numbersHtml;
    }

    // Scroll synchronization
    treeInput.addEventListener('scroll', () => {
        lineNumbers.scrollTop = treeInput.scrollTop;
    });

    // Auto-tab spacing in textarea (inserts 2 spaces on Tab)
    treeInput.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = treeInput.selectionStart;
            const end = treeInput.selectionEnd;
            const value = treeInput.value;
            
            // Insert 2 spaces
            treeInput.value = value.substring(0, start) + '  ' + value.substring(end);
            treeInput.selectionStart = treeInput.selectionEnd = start + 2;
            
            updateLineNumbers();
            generateTree();
        }
    });

    // Core Parser and Generator logic
    function generateTree() {
        const rawInput = treeInput.value;
        
        // Step 1: Parse lines and detect indentation levels
        const lines = rawInput.split('\n')
            .map((line) => {
                // regex matches leading spacing, optional markdown bullets (- / * / +), and remaining text
                const match = line.match(/^([ \t]*)(?:[-*+]\s+)?(.*)$/);
                if (!match) return null;
                
                const indentStr = match[1];
                const name = match[2].trim();
                
                // If it is an empty line, skip it
                if (!name) return null;
                
                // Calculate raw indent value (treat tab as 4 spaces)
                let rawIndent = 0;
                for (let char of indentStr) {
                    if (char === '\t') rawIndent += 4;
                    else rawIndent += 1;
                }
                
                return { rawIndent, name };
            })
            .filter(Boolean);

        if (lines.length === 0) {
            treeOutput.textContent = 'Please enter a folder structure list...';
            return;
        }

        // Step 2: Dynamically convert raw indent numbers to discrete hierarchical levels
        const uniqueIndents = [...new Set(lines.map(l => l.rawIndent))].sort((a, b) => a - b);
        lines.forEach(l => {
            l.level = uniqueIndents.indexOf(l.rawIndent);
        });

        // Step 3: Build the tree structure object
        const rootNode = { name: '.', children: [], isDirectory: true };
        const stack = [{ level: -1, node: rootNode }];

        for (const line of lines) {
            const endsWithSlash = line.name.endsWith('/');
            const currentNode = { name: line.name, children: [], isDirectory: endsWithSlash };
            
            // Pop stack until the top node has a level less than current
            while (stack.length > 0 && stack[stack.length - 1].level >= line.level) {
                stack.pop();
            }
            
            if (stack.length === 0) {
                rootNode.children.push(currentNode);
                stack.push({ level: line.level, node: currentNode });
            } else {
                const parent = stack[stack.length - 1].node;
                parent.children.push(currentNode);
                parent.isDirectory = true; // node has children, it is a directory
                stack.push({ level: line.level, node: currentNode });
            }
        }

        // Step 4: Render the tree recursively as ASCII text
        const options = {
            fancy: optFancy.checked,
            trailingSlash: optTrailing.checked,
            fullPath: optFullPath.checked,
            rootDot: optRootDot.checked,
            foldersOnly: optFoldersOnly.checked
        };

        if (options.foldersOnly) {
            const filterFolders = (node) => {
                node.children = node.children.filter(child => child.isDirectory || child.children.length > 0);
                node.children.forEach(filterFolders);
            };
            filterFolders(rootNode);
        }

        const outputText = renderNode(rootNode, '', true, options, '');
        treeOutput.textContent = outputText.trim();
    }

    // Recursive node drawing function
    function renderNode(node, prefix, isLast, options, parentPath) {
        let name = node.name;
        
        // Add trailing slash for directories if enabled
        if (options.trailingSlash && node.isDirectory && name !== '.' && !name.endsWith('/')) {
            name += '/';
        }
        
        // relative path logic
        let displayPath = name;
        if (options.fullPath) {
            displayPath = parentPath ? (parentPath + '/' + name) : name;
        }
        
        // Characters definitions
        const charBranch = options.fancy ? '├── ' : '|-- ';
        const charLastBranch = options.fancy ? '└── ' : '\\-- ';
        const charVertical = options.fancy ? '│   ' : '|   ';
        const charEmpty = '    ';
        
        let result = '';

        // If root container node
        if (node.name === '.') {
            if (options.rootDot) {
                const rootSymbol = options.trailingSlash ? './' : '.';
                result += rootSymbol + '\n';
                for (let i = 0; i < node.children.length; i++) {
                    const child = node.children[i];
                    const last = i === node.children.length - 1;
                    result += renderNode(child, '', last, options, '');
                }
            } else {
                for (let i = 0; i < node.children.length; i++) {
                    const child = node.children[i];
                    const last = i === node.children.length - 1;
                    result += renderNode(child, '', last, options, '');
                }
            }
            return result;
        }

        // Draw current node
        result += prefix + (isLast ? charLastBranch : charBranch) + displayPath + '\n';

        // Draw children
        const nextPrefix = prefix + (isLast ? charEmpty : charVertical);
        const nextParentPath = options.fullPath ? (parentPath ? parentPath + '/' + node.name : node.name) : '';
        
        for (let i = 0; i < node.children.length; i++) {
            const child = node.children[i];
            const last = i === node.children.length - 1;
            result += renderNode(child, nextPrefix, last, options, nextParentPath);
        }

        return result;
    }

    // Trigger update on text input or checkbox changes
    treeInput.addEventListener('input', () => {
        updateLineNumbers();
        generateTree();
    });
    
    [optFancy, optTrailing, optFullPath, optRootDot, optFoldersOnly].forEach(control => {
        control.addEventListener('change', generateTree);
    });

    // Handle Template changes
    templateSelect.addEventListener('change', () => {
        const val = templateSelect.value;
        if (TEMPLATES[val]) {
            treeInput.value = TEMPLATES[val];
            updateLineNumbers();
            generateTree();
        }
    });

    // Handle Folder Importer
    importBtn.addEventListener('click', () => {
        folderInput.click();
    });

    folderInput.addEventListener('change', (e) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const paths = [];
        for (let i = 0; i < files.length; i++) {
            paths.push(files[i].webkitRelativePath);
        }

        // Sort alphabetically so it is readable
        paths.sort();

        // Convert list of relative paths to a tree structure object
        const pathTree = {};
        for (let path of paths) {
            const parts = path.split('/');
            
            // Ignore files/folders matching common ignore list to prevent browser lag/crashes
            const shouldIgnore = parts.some(part => part === 'node_modules' || part === '.git' || part === '.DS_Store' || part === 'Thumbs.db');
            if (shouldIgnore) continue;

            let current = pathTree;
            for (let i = 0; i < parts.length; i++) {
                const part = parts[i];
                const isLast = i === parts.length - 1;
                
                if (!current[part]) {
                    current[part] = { _isDir: !isLast, _children: {} };
                }
                if (!isLast) {
                    current[part]._isDir = true;
                }
                current = current[part]._children;
            }
        }

        // Serialize object tree back to indented text
        function serialize(node, indent = 0) {
            let text = '';
            for (let key in node) {
                const info = node[key];
                if (optFoldersOnly.checked && !info._isDir) {
                    continue; // Skip files if Folders Only is checked
                }
                // Append trailing slash to folder names so our parser knows they are directories
                const displayName = info._isDir ? (key + '/') : key;
                text += '  '.repeat(indent) + displayName + '\n';
                text += serialize(info._children, indent + 1);
            }
            return text;
        }

        const serialized = serialize(pathTree);
        treeInput.value = serialized;
        updateLineNumbers();
        generateTree();
    });

    // Export Options: Copy
    copyBtn.addEventListener('click', () => {
        const text = treeOutput.textContent;
        navigator.clipboard.writeText(text).then(() => {
            showToast('Copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    });

    // Export Options: Download
    downloadBtn.addEventListener('click', () => {
        const text = treeOutput.textContent;
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        // Find a title
        let rootName = 'directory_structure';
        const firstLine = treeInput.value.split('\n')[0].trim().replace(/^[-*+]\s+/, '');
        if (firstLine) {
            rootName = firstLine.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
        }
        
        a.href = url;
        a.download = `${rootName}_tree.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    // Export Options: Share URL State saving
    shareBtn.addEventListener('click', () => {
        const state = {
            text: treeInput.value,
            options: {
                fancy: optFancy.checked,
                trailing: optTrailing.checked,
                path: optFullPath.checked,
                dot: optRootDot.checked,
                foldersOnly: optFoldersOnly.checked
            }
        };

        try {
            // Safe cross-browser base64 serialization
            const serialized = btoa(unescape(encodeURIComponent(JSON.stringify(state))));
            const shareUrl = `${window.location.origin}${window.location.pathname}#state=${serialized}`;
            
            navigator.clipboard.writeText(shareUrl).then(() => {
                showToast('Shareable link copied to clipboard!');
            }).catch(() => {
                showToast('Failed to copy link.');
            });
        } catch(e) {
            console.error(e);
            showToast('Error generating share link.');
        }
    });

    function showToast(message) {
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 2500);
    }

    // Load State from URL if present
    function loadStateFromUrl() {
        if (window.location.hash && window.location.hash.startsWith('#state=')) {
            try {
                const base64 = window.location.hash.substring(7);
                const decodedJson = decodeURIComponent(escape(atob(base64)));
                const state = JSON.parse(decodedJson);
                
                if (state && state.text) {
                    treeInput.value = state.text;
                    if (state.options) {
                        optFancy.checked = state.options.fancy !== false;
                        optTrailing.checked = state.options.trailing !== false;
                        optFullPath.checked = state.options.path === true;
                        optRootDot.checked = state.options.dot !== false;
                        optFoldersOnly.checked = state.options.foldersOnly === true;
                    }
                    return true;
                }
            } catch (e) {
                console.warn('Malformed URL state hash:', e);
            }
        }
        return false;
    }

    // Initial Load Sequence
    const loaded = loadStateFromUrl();
    if (!loaded) {
        // Load default web template
        treeInput.value = TEMPLATES.web;
        templateSelect.value = 'web';
    }
    
    updateLineNumbers();
    generateTree();
});

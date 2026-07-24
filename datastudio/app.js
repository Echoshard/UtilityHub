// ==========================================
// DOM REFERENCES
// ==========================================
const inputText = document.getElementById('inputText');
const outputCode = document.getElementById('outputCode');
const outputCodeInner = document.getElementById('outputCodeInner');
const parseBtn = document.getElementById('parseBtn');
const sampleBtn = document.getElementById('sampleBtn');
const clearBtn = document.getElementById('clearBtn');
const expandAllBtn = document.getElementById('expandAllBtn');
const collapseAllBtn = document.getElementById('collapseAllBtn');
const treeContainer = document.getElementById('treeContainer');
const copyOutputBtn = document.getElementById('copyOutputBtn');
const downloadOutputBtn = document.getElementById('downloadOutputBtn');
const errorPill = document.getElementById('errorPill');
const largeFileBanner = document.getElementById('largeFileBanner');

const inputCharsEl = document.getElementById('inputChars');
const inputWordsEl = document.getElementById('inputWords');
const inputTokensEl = document.getElementById('inputTokens');

const treeNodesEl = document.getElementById('treeNodes');
const treeCharsEl = document.getElementById('treeChars');
const treeWordsEl = document.getElementById('treeWords');
const treeTokensEl = document.getElementById('treeTokens');

const outputCharsEl = document.getElementById('outputChars');
const outputWordsEl = document.getElementById('outputWords');
const outputTokensEl = document.getElementById('outputTokens');

let currentValue = undefined;
let inputFormat = 'json';
let outputFormat = 'json';
let outputRaw = '';

// ==========================================
// STATISTICS CALCULATOR (Chars, Words, Tokens, Nodes)
// ==========================================
function calculateStats(text) {
    if (!text) return { chars: 0, words: 0, tokens: 0 };
    const chars = text.length;
    const trimmed = text.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    const matches = text.match(/[\w]+|[^\s\w]/g);
    let tokens = 0;
    if (matches) {
        for (let i = 0; i < matches.length; i++) {
            tokens += (matches[i].length > 4) ? Math.ceil(matches[i].length / 4) : 1;
        }
    }
    return { chars, words, tokens };
}

function countNodes(val) {
    if (val === undefined) return 0;
    if (val === null || typeof val !== 'object') return 1;
    let count = 1;
    if (Array.isArray(val)) {
        for (let i = 0; i < val.length; i++) {
            count += countNodes(val[i]);
        }
    } else {
        const keys = Object.keys(val);
        for (let i = 0; i < keys.length; i++) {
            count += countNodes(val[keys[i]]);
        }
    }
    return count;
}

function updateInputStats() {
    const stats = calculateStats(inputText.value);
    if (inputCharsEl) inputCharsEl.textContent = stats.chars.toLocaleString();
    if (inputWordsEl) inputWordsEl.textContent = stats.words.toLocaleString();
    if (inputTokensEl) inputTokensEl.textContent = stats.tokens.toLocaleString();
}

function updateTreeStats() {
    if (currentValue === undefined) {
        if (treeNodesEl) treeNodesEl.textContent = '0';
        if (treeCharsEl) treeCharsEl.textContent = '0';
        if (treeWordsEl) treeWordsEl.textContent = '0';
        if (treeTokensEl) treeTokensEl.textContent = '0';
        return;
    }
    const nodes = countNodes(currentValue);
    const jsonStr = JSON.stringify(currentValue);
    const stats = calculateStats(jsonStr);
    if (treeNodesEl) treeNodesEl.textContent = nodes.toLocaleString();
    if (treeCharsEl) treeCharsEl.textContent = stats.chars.toLocaleString();
    if (treeWordsEl) treeWordsEl.textContent = stats.words.toLocaleString();
    if (treeTokensEl) treeTokensEl.textContent = stats.tokens.toLocaleString();
}

function updateOutputStats() {
    const stats = calculateStats(outputRaw);
    if (outputCharsEl) outputCharsEl.textContent = stats.chars.toLocaleString();
    if (outputWordsEl) outputWordsEl.textContent = stats.words.toLocaleString();
    if (outputTokensEl) outputTokensEl.textContent = stats.tokens.toLocaleString();
}

function updateAllStats() {
    updateInputStats();
    updateTreeStats();
    updateOutputStats();
}


// ==========================================
// JSON (native)
// ==========================================
// JSON.parse / JSON.stringify used directly.

// ==========================================
// YAML (block-style subset: mappings, sequences, flow scalars)
// ==========================================
function parseYAML(text) {
    const lines = [];
    for (const raw of text.split(/\r?\n/)) {
        const trimmed = raw.trim();
        if (trimmed === '' || trimmed.startsWith('#')) continue;
        let line = raw;
        if (!/['"]/.test(line)) line = line.replace(/\s+#.*$/, '');
        if (line.trim() === '') continue;
        const indent = line.match(/^ */)[0].length;
        let text2 = line.slice(indent);

        // Flatten "- key: value" / "- value" into a dash marker plus a nested line,
        // so the recursive parser only ever deals with one shape per line.
        const dashMatch = text2.match(/^-\s+(\S.*)$/);
        if (dashMatch) {
            lines.push({ indent, text: '-' });
            lines.push({ indent: indent + 2, text: dashMatch[1] });
        } else {
            lines.push({ indent, text: text2 });
        }
    }

    let pos = 0;
    const peek = () => (pos < lines.length ? lines[pos] : null);

    function looksLikeMapping(text2) {
        return /^[^:]+:(\s|$)/.test(text2);
    }

    function parseBlock(indent) {
        const line = peek();
        if (!line || line.indent < indent) return null;
        if (line.text === '-') return parseSequence(line.indent);
        if (looksLikeMapping(line.text)) return parseMapping(line.indent);
        pos++;
        return parseScalar(line.text);
    }

    function parseSequence(indent) {
        const arr = [];
        while (peek() && peek().indent === indent && peek().text === '-') {
            pos++;
            const nested = peek();
            if (nested && nested.indent > indent) {
                arr.push(parseBlock(nested.indent));
            } else {
                arr.push(null);
            }
        }
        return arr;
    }

    function parseMapping(indent) {
        const obj = {};
        while (peek() && peek().indent === indent && peek().text !== '-') {
            const line = lines[pos];
            const match = line.text.match(/^([^:]+):\s*(.*)$/);
            if (!match) { pos++; continue; }
            pos++;
            const key = unquoteYaml(match[1].trim());
            const rest = match[2];
            if (rest.trim() === '') {
                const nested = peek();
                obj[key] = (nested && nested.indent > indent) ? parseBlock(nested.indent) : null;
            } else {
                obj[key] = parseScalar(rest);
            }
        }
        return obj;
    }

    function parseScalar(raw) {
        const t = raw.trim();
        if (t === '') return null;
        if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) return unquoteYaml(t);
        if (t.startsWith('[') || t.startsWith('{')) {
            try { return JSON.parse(t); } catch (e) { /* fall through */ }
        }
        if (/^(null|~)$/i.test(t)) return null;
        if (/^true$/i.test(t)) return true;
        if (/^false$/i.test(t)) return false;
        if (/^-?\d+$/.test(t)) return parseInt(t, 10);
        if (/^-?\d*\.\d+$/.test(t) || /^-?\d+\.\d*$/.test(t)) return parseFloat(t);
        return t;
    }

    function unquoteYaml(t) {
        if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
            try { return JSON.parse(t.startsWith("'") ? `"${t.slice(1, -1).replace(/"/g, '\\"')}"` : t); } catch (e) { return t.slice(1, -1); }
        }
        return t;
    }

    if (lines.length === 0) return null;
    return parseBlock(lines[0].indent);
}

function yamlScalar(value) {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (typeof value === 'number') return String(value);
    const str = String(value);
    const needsQuote = str === '' || /^\s|\s$/.test(str) || /^(true|false|null|~|-?\d+(\.\d+)?)$/i.test(str) || /[:#\[\]{}]/.test(str) || /^[-?]/.test(str);
    return needsQuote ? JSON.stringify(str) : str;
}

function stringifyYAML(value, indent = 0) {
    const pad = '  '.repeat(indent);
    if (Array.isArray(value)) {
        if (value.length === 0) return pad + '[]';
        return value.map(item => {
            if (item !== null && typeof item === 'object') {
                const childPad = '  '.repeat(indent + 1);
                const nested = stringifyYAML(item, indent + 1).split('\n');
                const firstLine = nested[0].slice(childPad.length);
                const rest = nested.slice(1).join('\n');
                return pad + '- ' + firstLine + (rest ? '\n' + rest : '');
            }
            return pad + '- ' + yamlScalar(item);
        }).join('\n');
    }
    if (value !== null && typeof value === 'object') {
        const keys = Object.keys(value);
        if (keys.length === 0) return pad + '{}';
        return keys.map(key => {
            const v = value[key];
            const isNonEmptyObject = v !== null && typeof v === 'object' && ((Array.isArray(v) && v.length > 0) || (!Array.isArray(v) && Object.keys(v).length > 0));
            if (isNonEmptyObject) return `${pad}${key}:\n${stringifyYAML(v, indent + 1)}`;
            if (Array.isArray(v)) return `${pad}${key}: []`;
            if (typeof v === 'object' && v !== null) return `${pad}${key}: {}`;
            return `${pad}${key}: ${yamlScalar(v)}`;
        }).join('\n');
    }
    return pad + yamlScalar(value);
}

// ==========================================
// XML (via browser DOMParser)
// ==========================================
function xmlElementToValue(el) {
    const obj = {};
    let hasAttrs = false;
    if (el.attributes) {
        for (const attr of Array.from(el.attributes)) {
            obj['@' + attr.name] = attr.value;
            hasAttrs = true;
        }
    }
    const childEls = Array.from(el.children);
    if (childEls.length === 0) {
        const text = (el.textContent || '').trim();
        if (!hasAttrs) return text;
        if (text) obj['#text'] = text;
        return obj;
    }
    childEls.forEach(child => {
        const val = xmlElementToValue(child);
        if (Object.prototype.hasOwnProperty.call(obj, child.tagName)) {
            if (!Array.isArray(obj[child.tagName])) obj[child.tagName] = [obj[child.tagName]];
            obj[child.tagName].push(val);
        } else {
            obj[child.tagName] = val;
        }
    });
    return obj;
}

function parseXML(text) {
    const doc = new DOMParser().parseFromString(text, 'application/xml');
    const errorNode = doc.querySelector('parsererror');
    if (errorNode) throw new Error('Invalid XML: ' + errorNode.textContent.trim().split('\n')[0]);
    const root = doc.documentElement;
    return { [root.tagName]: xmlElementToValue(root) };
}

function xmlEscape(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderXmlElement(tagName, value, indent) {
    const pad = '  '.repeat(indent);
    if (Array.isArray(value)) {
        return value.map(v => renderXmlElement(tagName, v, indent)).join('\n');
    }
    if (value === null || value === undefined) return `${pad}<${tagName} />`;
    if (typeof value !== 'object') return `${pad}<${tagName}>${xmlEscape(value)}</${tagName}>`;

    const attrs = [];
    const children = [];
    let textContent = null;
    for (const key of Object.keys(value)) {
        if (key === '#text') { textContent = value[key]; continue; }
        if (key.startsWith('@')) { attrs.push(`${key.slice(1)}="${xmlEscape(value[key])}"`); continue; }
        children.push(key);
    }
    const attrStr = attrs.length ? ' ' + attrs.join(' ') : '';
    if (children.length === 0) {
        if (textContent !== null) return `${pad}<${tagName}${attrStr}>${xmlEscape(textContent)}</${tagName}>`;
        return `${pad}<${tagName}${attrStr} />`;
    }
    const innerLines = [];
    if (textContent !== null) innerLines.push('  '.repeat(indent + 1) + xmlEscape(textContent));
    children.forEach(key => innerLines.push(renderXmlElement(key, value[key], indent + 1)));
    return `${pad}<${tagName}${attrStr}>\n${innerLines.join('\n')}\n${pad}</${tagName}>`;
}

function stringifyXML(value) {
    let rootTag = 'root';
    let rootValue = value;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        const keys = Object.keys(value);
        if (keys.length === 1) {
            rootTag = keys[0];
            rootValue = value[keys[0]];
        }
    }
    return '<?xml version="1.0" encoding="UTF-8"?>\n' + renderXmlElement(rootTag, rootValue, 0);
}

// ==========================================
// TOON (compact tabular notation subset)
// ==========================================
function toonScalar(value) {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (typeof value === 'number') return String(value);
    const str = String(value);
    const needsQuote = str === '' || /[,:\[\]{}\n]/.test(str) || /^\s|\s$/.test(str) || /^(true|false|null)$/i.test(str) || /^-?\d+(\.\d+)?$/.test(str);
    return needsQuote ? JSON.stringify(str) : str;
}

function isUniformObjectArray(arr) {
    if (!Array.isArray(arr) || arr.length === 0) return false;
    if (!arr.every(item => item !== null && typeof item === 'object' && !Array.isArray(item))) return false;
    const firstKeys = Object.keys(arr[0]);
    if (firstKeys.length === 0) return false;
    return arr.every(item => {
        const keys = Object.keys(item);
        if (keys.length !== firstKeys.length) return false;
        return firstKeys.every(k => keys.includes(k) && (item[k] === null || typeof item[k] !== 'object'));
    });
}

function stringifyTOON(value, indent = 0) {
    const pad = '  '.repeat(indent);
    if (Array.isArray(value)) return stringifyTOONArrayBody(value, indent);
    if (value !== null && typeof value === 'object') {
        const keys = Object.keys(value);
        if (keys.length === 0) return pad + '{}';
        return keys.map(key => stringifyTOONEntry(key, value[key], indent)).join('\n');
    }
    return pad + toonScalar(value);
}

function stringifyTOONEntry(key, value, indent) {
    const pad = '  '.repeat(indent);
    if (Array.isArray(value)) {
        if (value.length === 0) return `${pad}${key}[0]:`;
        if (isUniformObjectArray(value)) {
            const cols = Object.keys(value[0]);
            const header = `${pad}${key}[${value.length}]{${cols.join(',')}}:`;
            const rows = value.map(item => '  '.repeat(indent + 1) + cols.map(c => toonScalar(item[c])).join(',')).join('\n');
            return header + '\n' + rows;
        }
        if (value.every(v => v === null || typeof v !== 'object')) {
            return `${pad}${key}[${value.length}]: ${value.map(toonScalar).join(',')}`;
        }
        const childPad = '  '.repeat(indent + 1);
        const body = value.map(v => {
            if (v !== null && typeof v === 'object') return childPad + '- \n' + stringifyTOON(v, indent + 2);
            return childPad + '- ' + toonScalar(v);
        }).join('\n');
        return `${pad}${key}[${value.length}]:\n${body}`;
    }
    if (value !== null && typeof value === 'object') {
        const keys = Object.keys(value);
        if (keys.length === 0) return `${pad}${key}: {}`;
        return `${pad}${key}:\n` + keys.map(k => stringifyTOONEntry(k, value[k], indent + 1)).join('\n');
    }
    return `${pad}${key}: ${toonScalar(value)}`;
}

function stringifyTOONArrayBody(value, indent) {
    const pad = '  '.repeat(indent);
    if (value.length === 0) return pad + '[]';
    if (isUniformObjectArray(value)) {
        const cols = Object.keys(value[0]);
        const header = `${pad}[${value.length}]{${cols.join(',')}}:`;
        const rows = value.map(item => '  '.repeat(indent + 1) + cols.map(c => toonScalar(item[c])).join(',')).join('\n');
        return header + '\n' + rows;
    }
    if (value.every(v => v === null || typeof v !== 'object')) {
        return `${pad}[${value.length}]: ${value.map(toonScalar).join(',')}`;
    }
    return value.map(v => pad + '- ' + (v !== null && typeof v === 'object' ? '\n' + stringifyTOON(v, indent + 1) : toonScalar(v))).join('\n');
}

function splitTOONRow(text) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (ch === '"') { inQuotes = !inQuotes; current += ch; continue; }
        if (ch === ',' && !inQuotes) { result.push(current.trim()); current = ''; continue; }
        current += ch;
    }
    result.push(current.trim());
    return result;
}

function parseTOONScalar(token) {
    const t = token.trim();
    if (t === '') return null;
    if (t.startsWith('"') && t.endsWith('"')) {
        try { return JSON.parse(t); } catch (e) { return t.slice(1, -1); }
    }
    if (t === '{}') return {};
    if (t === '[]') return [];
    if (t === 'null') return null;
    if (t === 'true') return true;
    if (t === 'false') return false;
    if (/^-?\d+$/.test(t)) return parseInt(t, 10);
    if (/^-?\d*\.\d+$/.test(t) || /^-?\d+\.\d*$/.test(t)) return parseFloat(t);
    return t;
}

function unquoteTOON(t) {
    if (t.startsWith('"') && t.endsWith('"')) {
        try { return JSON.parse(t); } catch (e) { return t.slice(1, -1); }
    }
    return t;
}

function parseTOON(text) {
    const lines = [];
    for (const raw of text.split(/\r?\n/)) {
        if (raw.trim() === '') continue;
        const indent = raw.match(/^ */)[0].length;
        lines.push({ indent, text: raw.slice(indent) });
    }

    let pos = 0;
    const peek = () => (pos < lines.length ? lines[pos] : null);

    function parseValueAt(indent) {
        const line = peek();
        if (!line) return null;
        if (/^\[\d+\](\{[^}]*\})?:/.test(line.text)) return parseArrayHeaderAsRoot(indent);
        if (line.text === '-' || line.text.startsWith('- ')) return parseDashSequence(indent);
        if (/^[^:]+:/.test(line.text)) return parseMappingBlock(indent);
        pos++;
        return parseTOONScalar(line.text);
    }

    function parseMappingBlock(indent) {
        const obj = {};
        while (peek() && peek().indent === indent && peek().text !== '-' && !peek().text.startsWith('- ')) {
            const line = lines[pos];
            const headerMatch = line.text.match(/^([^:\[\]]+)\[(\d+)\](?:\{([^}]*)\})?:\s*(.*)$/);
            if (headerMatch) {
                const key = unquoteTOON(headerMatch[1].trim());
                pos++;
                obj[key] = parseArrayBody(indent, parseInt(headerMatch[2], 10), headerMatch[3], headerMatch[4]);
                continue;
            }
            const kvMatch = line.text.match(/^([^:]+):\s*(.*)$/);
            if (!kvMatch) { pos++; continue; }
            const key = unquoteTOON(kvMatch[1].trim());
            const rest = kvMatch[2];
            pos++;
            if (rest.trim() === '') {
                const nested = peek();
                obj[key] = (nested && nested.indent > indent) ? parseValueAt(nested.indent) : null;
            } else {
                obj[key] = parseTOONScalar(rest);
            }
        }
        return obj;
    }

    function parseArrayHeaderAsRoot(indent) {
        const line = lines[pos];
        const m = line.text.match(/^\[(\d+)\](?:\{([^}]*)\})?:\s*(.*)$/);
        pos++;
        return parseArrayBody(indent, parseInt(m[1], 10), m[2], m[3]);
    }

    function parseArrayBody(indent, count, colsStr, restOfLine) {
        if (colsStr) {
            const cols = colsStr.split(',').map(c => c.trim());
            const rows = [];
            for (let i = 0; i < count; i++) {
                const line = peek();
                if (!line || line.indent <= indent) break;
                pos++;
                const values = splitTOONRow(line.text);
                const obj = {};
                cols.forEach((c, idx) => { obj[c] = parseTOONScalar(values[idx] !== undefined ? values[idx] : ''); });
                rows.push(obj);
            }
            return rows;
        }
        if (restOfLine && restOfLine.trim() !== '') {
            return splitTOONRow(restOfLine).map(v => parseTOONScalar(v));
        }
        const nested = peek();
        if (nested && nested.indent > indent) return parseDashSequence(nested.indent);
        return [];
    }

    function parseDashSequence(indent) {
        const arr = [];
        while (peek() && peek().indent === indent && (peek().text === '-' || peek().text.startsWith('- '))) {
            const line = lines[pos];
            const rest = line.text === '-' ? '' : line.text.slice(2);
            pos++;
            if (rest.trim() === '') {
                const nested = peek();
                arr.push((nested && nested.indent > indent) ? parseValueAt(nested.indent) : null);
            } else {
                arr.push(parseTOONScalar(rest));
            }
        }
        return arr;
    }

    if (lines.length === 0) return null;
    return parseValueAt(lines[0].indent);
}

// ==========================================
// FORMAT DISPATCH
// ==========================================
function parseByFormat(format, text) {
    switch (format) {
        case 'json': return JSON.parse(text);
        case 'yaml': return parseYAML(text);
        case 'xml': return parseXML(text);
        case 'toon': return parseTOON(text);
        default: throw new Error('Unknown input format');
    }
}

function stringifyByFormat(format, value) {
    switch (format) {
        case 'json': return JSON.stringify(value, null, 2);
        case 'yaml': return stringifyYAML(value);
        case 'xml': return stringifyXML(value);
        case 'toon': return stringifyTOON(value);
        default: throw new Error('Unknown output format');
    }
}

// ==========================================
// SYNTAX HIGHLIGHTING (per output format)
// ==========================================
function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function highlightJSON(text) {
    const escaped = escapeHtml(text);
    return escaped.replace(
        /("(\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g,
        (match) => {
            let cls = 'tok-number';
            if (/^"/.test(match)) cls = /:\s*$/.test(match) ? 'tok-key' : 'tok-string';
            else if (/^(true|false)$/.test(match)) cls = 'tok-bool';
            else if (/^null$/.test(match)) cls = 'tok-null';
            return `<span class="${cls}">${match}</span>`;
        }
    );
}

function highlightScalarToken(text) {
    if (text === '') return '';
    const trimmed = text.trim();
    if (/^#/.test(trimmed)) return `<span class="tok-comment">${text}</span>`;
    if ((/^".*"$/.test(trimmed) || /^&#39;.*&#39;$/.test(trimmed)) && trimmed.length > 1) return `<span class="tok-string">${text}</span>`;
    if (/^(true|false)$/i.test(trimmed)) return `<span class="tok-bool">${text}</span>`;
    if (/^(null|~)$/i.test(trimmed)) return `<span class="tok-null">${text}</span>`;
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) return `<span class="tok-number">${text}</span>`;
    return text;
}

function highlightYAMLText(text) {
    const escaped = escapeHtml(text);
    return escaped.split('\n').map(line => {
        const dashMatch = line.match(/^(\s*-\s*)(.*)$/);
        let prefix = '', rest = line;
        if (dashMatch) { prefix = dashMatch[1]; rest = dashMatch[2]; }
        const kvMatch = rest.match(/^([^:]+:)(\s*)(.*)$/);
        if (kvMatch) {
            return prefix + `<span class="tok-key">${kvMatch[1]}</span>` + kvMatch[2] + highlightScalarToken(kvMatch[3]);
        }
        return prefix + highlightScalarToken(rest);
    }).join('\n');
}

function highlightTOONText(text) {
    const escaped = escapeHtml(text);
    return escaped.split('\n').map(line => {
        const dashMatch = line.match(/^(\s*-\s*)(.*)$/);
        let prefix = '', rest = line;
        if (dashMatch) { prefix = dashMatch[1]; rest = dashMatch[2]; }

        const headerMatch = rest.match(/^([^:\[\]]*)(\[\d+\])(\{[^}]*\})?(:)(\s*)(.*)$/);
        if (headerMatch) {
            const [, key, countPart, colsPart, colon, space, value] = headerMatch;
            let html = key ? `<span class="tok-key">${key}</span>` : '';
            html += `<span class="tok-punct">${countPart}</span>`;
            if (colsPart) html += `<span class="tok-punct">${colsPart}</span>`;
            html += `<span class="tok-punct">${colon}</span>${space}`;
            html += value.split(',').map(highlightScalarToken).join('<span class="tok-punct">,</span>');
            return prefix + html;
        }

        const kvMatch = rest.match(/^([^:]+:)(\s*)(.*)$/);
        if (kvMatch) {
            return prefix + `<span class="tok-key">${kvMatch[1]}</span>` + kvMatch[2] + highlightScalarToken(kvMatch[3]);
        }
        if (rest.includes(',')) {
            return prefix + rest.split(',').map(highlightScalarToken).join('<span class="tok-punct">,</span>');
        }
        return prefix + highlightScalarToken(rest);
    }).join('\n');
}

function highlightXmlTag(tag) {
    const inner = tag.slice(1, -1);
    if (inner.startsWith('?') || inner.startsWith('!')) {
        return `<span class="tok-comment">${escapeHtml(tag)}</span>`;
    }
    const closing = inner.startsWith('/');
    const selfClosing = inner.endsWith('/');
    let body = inner;
    if (closing) body = body.slice(1);
    if (selfClosing) body = body.slice(0, -1);
    body = body.trim();

    const nameMatch = body.match(/^[^\s]+/);
    const tagName = nameMatch ? nameMatch[0] : '';
    const rest = nameMatch ? body.slice(nameMatch[0].length) : '';

    let attrsHtml = '';
    const attrRegex = /([^\s=]+)\s*=\s*("[^"]*"|'[^']*')/g;
    let lastIdx = 0;
    let am;
    while ((am = attrRegex.exec(rest)) !== null) {
        attrsHtml += escapeHtml(rest.slice(lastIdx, am.index));
        attrsHtml += `<span class="tok-attr-name">${escapeHtml(am[1])}</span><span class="tok-punct">=</span><span class="tok-string">${escapeHtml(am[2])}</span>`;
        lastIdx = am.index + am[0].length;
    }
    attrsHtml += escapeHtml(rest.slice(lastIdx));

    let html = `<span class="tok-punct">&lt;${closing ? '/' : ''}</span><span class="tok-tag">${escapeHtml(tagName)}</span>${attrsHtml}`;
    html += `<span class="tok-punct">${selfClosing ? ' /&gt;' : '&gt;'}</span>`;
    return html;
}

function highlightXMLText(text) {
    let result = '';
    const tagRegex = /<[^>]+>/g;
    let lastIndex = 0;
    let match;
    while ((match = tagRegex.exec(text)) !== null) {
        const textBefore = text.slice(lastIndex, match.index);
        if (textBefore.trim()) result += `<span class="tok-text">${escapeHtml(textBefore)}</span>`;
        else result += escapeHtml(textBefore);
        result += highlightXmlTag(match[0]);
        lastIndex = match.index + match[0].length;
    }
    result += escapeHtml(text.slice(lastIndex));
    return result;
}

function highlightByFormat(format, text) {
    switch (format) {
        case 'json': return highlightJSON(text);
        case 'yaml': return highlightYAMLText(text);
        case 'xml': return highlightXMLText(text);
        case 'toon': return highlightTOONText(text);
        default: return escapeHtml(text);
    }
}

// ==========================================
// COLLAPSIBLE LAZY TREE RENDERER
// ==========================================
const PAGE_SIZE = 100;

function valueClassFor(value) {
    if (value === null) return 'tree-null';
    if (typeof value === 'string') return 'tree-string';
    if (typeof value === 'number') return 'tree-number';
    if (typeof value === 'boolean') return 'tree-bool';
    return '';
}

function formatLeafValue(value) {
    if (value === null) return 'null';
    if (typeof value === 'string') return JSON.stringify(value);
    return String(value);
}

function buildTreeNode(key, value, isRoot = false) {
    const wrapper = document.createElement('div');
    wrapper.className = 'tree-node';
    if (isRoot) wrapper.classList.add('tree-root');

    const row = document.createElement('div');
    row.className = 'tree-row';

    const isExpandable = value !== null && typeof value === 'object';
    const toggle = document.createElement('button');
    toggle.className = 'tree-toggle' + (isExpandable ? '' : ' leaf');
    toggle.textContent = isExpandable ? (isRoot ? '▾' : '▸') : '';
    row.appendChild(toggle);

    if (key !== null) {
        const keySpan = document.createElement('span');
        keySpan.className = 'tree-key';
        keySpan.textContent = key + ':';
        row.appendChild(keySpan);
    }

    let childrenContainer = null;
    let isRendered = false;
    let isCollapsed = !isRoot;

    if (isExpandable) {
        const isArray = Array.isArray(value);
        const entries = isArray ? value.map((v, i) => [i, v]) : Object.entries(value);

        const metaSpan = document.createElement('span');
        metaSpan.className = 'tree-meta';
        metaSpan.textContent = isArray ? `[${entries.length}]` : `{${entries.length}}`;
        row.appendChild(metaSpan);

        childrenContainer = document.createElement('div');
        childrenContainer.className = 'tree-children' + (isCollapsed ? ' collapsed' : '');

        let loadedCount = 0;

        function renderNextChunk() {
            const nextEntries = entries.slice(loadedCount, loadedCount + PAGE_SIZE);
            const frag = document.createDocumentFragment();
            for (const [k, v] of nextEntries) {
                frag.appendChild(buildTreeNode(k, v, false));
            }
            loadedCount += nextEntries.length;

            const oldMore = childrenContainer.querySelector('.tree-load-more');
            if (oldMore) oldMore.remove();

            childrenContainer.appendChild(frag);

            if (loadedCount < entries.length) {
                const remaining = entries.length - loadedCount;
                const loadMoreBtn = document.createElement('button');
                loadMoreBtn.className = 'tree-load-more';
                loadMoreBtn.textContent = `+ Load more (${remaining.toLocaleString()} remaining)...`;
                loadMoreBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    renderNextChunk();
                });
                childrenContainer.appendChild(loadMoreBtn);
            }
        }

        if (isRoot) {
            renderNextChunk();
            isRendered = true;
        }

        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!isRendered) {
                renderNextChunk();
                isRendered = true;
            }
            isCollapsed = !isCollapsed;
            childrenContainer.classList.toggle('collapsed', isCollapsed);
            toggle.textContent = isCollapsed ? '▸' : '▾';
        });

        row.addEventListener('click', (e) => {
            if (e.target === toggle || e.target.classList.contains('tree-load-more')) return;
            if (window.getSelection && window.getSelection().toString().length > 0) return;
            toggle.click();
        });
    } else {
        const valueSpan = document.createElement('span');
        valueSpan.className = valueClassFor(value);
        valueSpan.textContent = formatLeafValue(value);
        row.appendChild(valueSpan);
    }

    wrapper.appendChild(row);
    if (childrenContainer) wrapper.appendChild(childrenContainer);

    return wrapper;
}

function renderTree(value) {
    treeContainer.innerHTML = '';
    if (value === undefined) {
        treeContainer.innerHTML = '<p class="placeholder-text">Parse some data to explore it here.</p>';
        return;
    }
    const root = buildTreeNode(null, value, true);
    treeContainer.appendChild(root);
}

expandAllBtn.addEventListener('click', () => {
    if (currentValue === undefined) return;
    const totalNodes = countNodes(currentValue);
    const targetDepth = totalNodes > 500 ? 3 : 50;

    function expandRecursive(container, depth) {
        if (depth <= 0) return;
        const nodes = container.querySelectorAll(':scope > .tree-node');
        nodes.forEach(node => {
            const toggle = node.querySelector(':scope > .tree-row > .tree-toggle:not(.leaf)');
            const children = node.querySelector(':scope > .tree-children');
            if (toggle) {
                if (children && children.classList.contains('collapsed')) {
                    toggle.click();
                }
                if (children) {
                    expandRecursive(children, depth - 1);
                }
            }
        });
    }

    expandRecursive(treeContainer, targetDepth);
});

collapseAllBtn.addEventListener('click', () => {
    const containers = treeContainer.querySelectorAll('.tree-children');
    containers.forEach(c => {
        if (!c.parentElement.classList.contains('tree-root')) {
            c.classList.add('collapsed');
        }
    });
    const toggles = treeContainer.querySelectorAll('.tree-toggle:not(.leaf)');
    toggles.forEach(t => {
        if (!t.closest('.tree-root > .tree-row')) {
            t.textContent = '▸';
        }
    });
});

// ==========================================
// UI WIRING
// ==========================================
function showError(message) {
    if (!message) {
        errorPill.style.display = 'none';
        return;
    }
    errorPill.textContent = message;
    errorPill.style.display = 'inline-flex';
}

function renderOutputCode() {
    if (!outputRaw) {
        outputCode.classList.add('is-empty');
        outputCodeInner.textContent = 'Converted output appears here...';
        if (largeFileBanner) largeFileBanner.style.display = 'none';
        return;
    }
    outputCode.classList.remove('is-empty');

    const MAX_HIGHLIGHT_SIZE = 100000;
    if (outputRaw.length > MAX_HIGHLIGHT_SIZE) {
        if (largeFileBanner) {
            largeFileBanner.style.display = 'block';
            largeFileBanner.textContent = `⚡ Fast Mode: Highlighting paused for output >100KB (${(outputRaw.length / 1024).toFixed(1)} KB)`;
        }
        outputCodeInner.textContent = outputRaw;
    } else {
        if (largeFileBanner) largeFileBanner.style.display = 'none';
        outputCodeInner.innerHTML = highlightByFormat(outputFormat, outputRaw);
    }
}

function updateOutput() {
    if (currentValue === undefined) {
        outputRaw = '';
        renderOutputCode();
        updateOutputStats();
        return;
    }
    try {
        outputRaw = stringifyByFormat(outputFormat, currentValue);
        renderOutputCode();
        showError(null);
    } catch (e) {
        showError('Convert error: ' + e.message);
    }
    updateOutputStats();
}

function doParse() {
    const text = inputText.value;
    if (text.trim() === '') {
        currentValue = undefined;
        renderTree(undefined);
        outputRaw = '';
        renderOutputCode();
        showError(null);
        updateAllStats();
        return;
    }

    parseBtn.classList.add('loading');
    parseBtn.textContent = 'Parsing...';

    setTimeout(() => {
        try {
            currentValue = parseByFormat(inputFormat, text);
            showError(null);
            renderTree(currentValue);
            updateOutput();
        } catch (e) {
            showError('Parse error: ' + e.message);
            updateOutput();
        } finally {
            parseBtn.classList.remove('loading');
            parseBtn.textContent = 'Parse';
            updateAllStats();
        }
    }, 15);
}

parseBtn.addEventListener('click', doParse);

inputText.addEventListener('input', updateInputStats);

document.querySelectorAll('[data-format]').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('[data-format]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        inputFormat = btn.dataset.format;
    });
});

document.querySelectorAll('[data-outformat]').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('[data-outformat]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        outputFormat = btn.dataset.outformat;
        updateOutput();
    });
});

clearBtn.addEventListener('click', () => {
    inputText.value = '';
    currentValue = undefined;
    renderTree(undefined);
    outputRaw = '';
    renderOutputCode();
    showError(null);
    updateAllStats();
});

copyOutputBtn.addEventListener('click', () => {
    if (!outputRaw) return;
    navigator.clipboard.writeText(outputRaw).catch(() => {});
});

downloadOutputBtn.addEventListener('click', () => {
    if (!outputRaw) return;
    const ext = { json: 'json', yaml: 'yaml', xml: 'xml', toon: 'toon' }[outputFormat] || 'txt';
    const blob = new Blob([outputRaw], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `data.${ext}`;
    a.click();
});

sampleBtn.addEventListener('click', () => {
    document.querySelectorAll('[data-format]').forEach(b => b.classList.remove('active'));
    document.querySelector('[data-format="json"]').classList.add('active');
    inputFormat = 'json';
    inputText.value = JSON.stringify({
        project: 'Data Studio',
        version: 1,
        active: true,
        tags: ['json', 'yaml', 'xml', 'toon'],
        owner: { name: 'Chris', role: 'admin' },
        users: [
            { id: 1, name: 'Alice', admin: true },
            { id: 2, name: 'Bob', admin: false }
        ]
    }, null, 2);
    doParse();
});

// ==========================================
// DRAG & DROP FILE SUPPORT
// ==========================================
inputText.addEventListener('dragover', (e) => {
    e.preventDefault();
});

inputText.addEventListener('dragenter', (e) => {
    e.preventDefault();
    inputText.classList.add('drag-over');
});

inputText.addEventListener('dragleave', () => {
    inputText.classList.remove('drag-over');
});

inputText.addEventListener('drop', (e) => {
    e.preventDefault();
    inputText.classList.remove('drag-over');
    
    const file = e.dataTransfer.files[0];
    if (!file) return;
    
    const ext = file.name.split('.').pop().toLowerCase();
    const extMap = {
        'json': 'json',
        'yaml': 'yaml',
        'yml': 'yaml',
        'xml': 'xml',
        'toon': 'toon',
        'tn': 'toon'
    };
    const format = extMap[ext];
    if (format) {
        inputFormat = format;
        document.querySelectorAll('[data-format]').forEach(b => {
            b.classList.toggle('active', b.dataset.format === format);
        });
    }
    
    const reader = new FileReader();
    reader.onload = (evt) => {
        inputText.value = evt.target.result;
        doParse();
    };
    reader.readAsText(file);
});

// ==========================================
// INIT
// ==========================================
renderOutputCode();
updateAllStats();


// --- REGEXLAB APPLICATION LOGIC ---

// Tab Elements
const tabs = document.querySelectorAll('.tab-header');
const tabContents = document.querySelectorAll('.tab-content');

// Regex Tester Elements
const regexInput = document.getElementById('regexInput');
const flagsInput = document.getElementById('flagsInput');
const testInput = document.getElementById('testInput');
const highlightOverlay = document.getElementById('highlightOverlay');
const validationStatus = document.getElementById('validationStatus');
const validationText = document.getElementById('validationText');
const iconSuccess = document.querySelector('.icon-success');
const iconError = document.querySelector('.icon-error');
const matchesCount = document.getElementById('matchesCount');

// Breakdown Elements
const breakdownBody = document.getElementById('breakdownBody');

// Cheat Sheet Elements
const cheatSearch = document.getElementById('cheatSearch');
const cheatsheetList = document.getElementById('cheatsheetList');

// Trainer Elements
const lessonBadge = document.getElementById('lessonBadge');
const lessonTitle = document.getElementById('lessonTitle');
const lessonDesc = document.getElementById('lessonDesc');
const mustMatchList = document.getElementById('mustMatchList');
const shouldNotMatchList = document.getElementById('shouldNotMatchList');
const trainerStatusIndicator = document.getElementById('trainerStatusIndicator');
const nextLessonBtn = document.getElementById('nextLessonBtn');
const lessonSelect = document.getElementById('lessonSelect');

// State Variables
let currentLessonIndex = 0;
let regexValid = true;

// Default text on load
const DEFAULT_TEST_TEXT = `Welcome to RegExpLab! 
This editor highlights matches in real-time.
Try writing a regular expression above.
For example:
- [a-z]+ will match all lowercase words.
- [0-9]+ will match numbers (like 123, 4567, or 99).
- Welcome will match the start greeting.
- [A-Z][a-z]+ matches capitalized words like Welcome, RegExpLab, or This.`;

// --- TABS CONTROLLER ---
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));

        tab.classList.add('active');
        const contentId = `tab-${tab.dataset.tab}`;
        document.getElementById(contentId).classList.add('active');
    });
});

// --- CHEAT SHEET DATABASE & LOGIC ---
const CHEAT_DATA = [
    {
        category: "Character Classes",
        items: [
            { code: "\\d", desc: "Any decimal digit (equivalent to [0-9])" },
            { code: "\\D", desc: "Any non-digit character (equivalent to [^0-9])" },
            { code: "\\w", desc: "Any word character (alphanumeric plus underscore)" },
            { code: "\\W", desc: "Any non-word character" },
            { code: "\\s", desc: "Any whitespace character (spaces, tabs, line breaks)" },
            { code: "\\S", desc: "Any non-whitespace character" },
            { code: ".", desc: "Any character except line breaks" }
        ]
    },
    {
        category: "Quantifiers",
        items: [
            { code: "*", desc: "0 or more times (greedy)" },
            { code: "+", desc: "1 or more times (greedy)" },
            { code: "?", desc: "0 or 1 time (optional)" },
            { code: "{n}", desc: "Exactly n times" },
            { code: "{n,}", desc: "At least n times" },
            { code: "{n,m}", desc: "Between n and m times" },
            { code: "*?", desc: "0 or more times (lazy)" },
            { code: "+?", desc: "1 or more times (lazy)" }
        ]
    },
    {
        category: "Anchors & Boundaries",
        items: [
            { code: "^", desc: "Start of string / line" },
            { code: "$", desc: "End of string / line" },
            { code: "\\b", desc: "Word boundary" },
            { code: "\\B", desc: "Non-word boundary" }
        ]
    },
    {
        category: "Groups & Logic",
        items: [
            { code: "(x)", desc: "Capturing group (remembers match)" },
            { code: "(?:x)", desc: "Non-capturing group" },
            { code: "x|y", desc: "Alternation (match x OR y)" },
            { code: "[abc]", desc: "Character set (match any of a, b, or c)" },
            { code: "[^abc]", desc: "Negated character set (exclude a, b, or c)" },
            { code: "[a-z]", desc: "Character range (match lowercase a to z)" }
        ]
    },
    {
        category: "Lookarounds",
        items: [
            { code: "(?=x)", desc: "Positive lookahead (followed by x)" },
            { code: "(?!x)", desc: "Negative lookahead (not followed by x)" },
            { code: "(?<=x)", desc: "Positive lookbehind (preceded by x)" },
            { code: "(?<!x)", desc: "Negative lookbehind (not preceded by x)" }
        ]
    }
];

function renderCheatsheet(filter = "") {
    cheatsheetList.innerHTML = "";
    const cleanFilter = filter.toLowerCase().trim();

    CHEAT_DATA.forEach(section => {
        const filteredItems = section.items.filter(item => 
            item.code.toLowerCase().includes(cleanFilter) || 
            item.desc.toLowerCase().includes(cleanFilter)
        );

        if (filteredItems.length === 0) return;

        const secTitle = document.createElement('div');
        secTitle.className = "cheat-section-title";
        secTitle.textContent = section.category;
        cheatsheetList.appendChild(secTitle);

        filteredItems.forEach(item => {
            const row = document.createElement('div');
            row.className = "cheat-item";
            row.innerHTML = `
                <span class="cheat-code">${escapeHTML(item.code)}</span>
                <span class="cheat-desc">${escapeHTML(item.desc)}</span>
            `;
            row.addEventListener('click', () => insertToken(item.code));
            cheatsheetList.appendChild(row);
        });
    });
}

function insertToken(token) {
    const startPos = regexInput.selectionStart;
    const endPos = regexInput.selectionEnd;
    const val = regexInput.value;
    
    regexInput.value = val.substring(0, startPos) + token + val.substring(endPos, val.length);
    regexInput.focus();
    
    // Position cursor after inserted token
    const newCursorPos = startPos + token.length;
    regexInput.setSelectionRange(newCursorPos, newCursorPos);
    
    evaluateRegex();
}

cheatSearch.addEventListener('input', (e) => renderCheatsheet(e.target.value));

// --- TRAINER DATABASE & LESSONS ---
const LESSONS = [
    {
        title: "Lesson 1: Character Literals",
        desc: "The simplest regex pattern is a sequence of plain letters. It matches them exactly in order.",
        goal: "Write a pattern that matches the words 'cat' and 'bat' but not 'hat' or 'rat'.",
        mustMatch: ["cat", "bat"],
        shouldNotMatch: ["hat", "rat", "flat"],
        defaultPattern: "cat"
    },
    {
        title: "Lesson 2: Character Classes",
        desc: "Use '\\d' to match any numerical digit (0-9). Regular letters will be matched as literals.",
        goal: "Write a pattern that matches serial codes starting with 'ID-' followed by exactly three digits (e.g. 'ID-304').",
        mustMatch: ["ID-402", "ID-009", "ID-123"],
        shouldNotMatch: ["ID-abc", "ID-", "402", "ID-1234"],
        defaultPattern: "ID-\\d"
    },
    {
        title: "Lesson 3: Quantifiers",
        desc: "Use '+' to match 1 or more times, '*' for 0 or more, and '?' for optional characters.",
        goal: "Write a pattern that matches words ending in 'ing' (like 'singing' or 'going'), but not the word 'ing' itself.",
        mustMatch: ["playing", "running", "jumping"],
        shouldNotMatch: ["ing", "ring", "singer", "bingo"],
        defaultPattern: "ing"
    },
    {
        title: "Lesson 4: Anchors",
        desc: "Use '^' to anchor the pattern to the start of the line/string, and '$' to anchor to the end.",
        goal: "Write a pattern that matches only lines that start with 'Pass:' followed by any characters.",
        mustMatch: ["Pass: 123", "Pass: fully validated", "Pass: ok"],
        shouldNotMatch: ["Fail: Pass: 1", "Passed", "Pass"],
        defaultPattern: "^Pass:"
    },
    {
        title: "Lesson 5: Alternation (OR)",
        desc: "Use the pipe character '|' inside a group '(x|y)' to match either options.",
        goal: "Write a pattern that matches image file names ending only in '.png' or '.jpg' (like 'logo.png').",
        mustMatch: ["icon.png", "photo.jpg", "avatar.png"],
        shouldNotMatch: ["doc.pdf", "script.js", "photo.png.zip", "png"],
        defaultPattern: "png|jpg"
    },
    {
        title: "Lesson 6: Negated Character Sets",
        desc: "Use '[^...]' to match any character EXCEPT the ones inside the brackets.",
        goal: "Write a pattern that matches three-letter words starting with 'h' and ending with 't' EXCEPT 'hat' (e.g. 'hot', 'hut', 'hit').",
        mustMatch: ["hot", "hut", "hit"],
        shouldNotMatch: ["hat", "hitit", "ht"],
        defaultPattern: "h[a-z]t"
    },
    {
        title: "Lesson 7: Optional Match",
        desc: "Use '?' to make the preceding character optional (matches 0 or 1 time).",
        goal: "Write a pattern that matches both American spelling 'color' and British spelling 'colour' exactly.",
        mustMatch: ["color", "colour"],
        shouldNotMatch: ["colors", "colouur", "colr"],
        defaultPattern: "colo"
    },
    {
        title: "Lesson 8: Word Boundaries",
        desc: "Use '\\b' to assert a word boundary, preventing partial matching inside longer words.",
        goal: "Write a pattern that matches the standalone word 'plan' but not as a substring of 'planet', 'plant', or 'explain'.",
        mustMatch: ["plan", "a plan to", "my plan"],
        shouldNotMatch: ["planet", "plant", "explain", "planning"],
        defaultPattern: "plan"
    },
    {
        title: "Lesson 9: Whitespace Characters",
        desc: "Use '\\s' to match spacing like spaces, tabs, and page breaks.",
        goal: "Write a pattern that matches double spaces or tabs between characters to clean up spacing.",
        mustMatch: ["word  word", "a   b", "test\t\tline"],
        shouldNotMatch: ["word word", "a b", "testline"],
        defaultPattern: "\\s"
    },
    {
        title: "Lesson 10: Repetitions Range",
        desc: "Use '{min,max}' to specify the exact minimum and maximum number of matching repetitions allowed.",
        goal: "Write a pattern that matches hex color codes starting with '#' followed by exactly 3 or 6 hex digits (e.g. '#A85' or '#A855F7').",
        mustMatch: ["#fff", "#A855F7", "#000000"],
        shouldNotMatch: ["#ff", "#A855F799", "#G00", "fff"],
        defaultPattern: "#"
    }
];

function populateLessonSelect() {
    lessonSelect.innerHTML = "";
    LESSONS.forEach((lesson, index) => {
        const opt = document.createElement('option');
        opt.value = index;
        opt.textContent = `${index + 1}. ${lesson.title.replace(/Lesson \d+: /, '')}`;
        lessonSelect.appendChild(opt);
    });
}

function loadTrainerLesson(index) {
    if (index < 0 || index >= LESSONS.length) return;
    currentLessonIndex = index;
    const lesson = LESSONS[index];

    lessonBadge.textContent = `Lesson ${index + 1} of ${LESSONS.length}`;
    lessonSelect.value = index;
    lessonTitle.textContent = lesson.title;
    lessonDesc.textContent = lesson.desc;

    // Load lists
    mustMatchList.innerHTML = "";
    lesson.mustMatch.forEach(word => {
        const li = document.createElement('li');
        li.className = "match-item";
        li.innerHTML = `<span>${escapeHTML(word)}</span><span class="match-icon"></span>`;
        mustMatchList.appendChild(li);
    });

    shouldNotMatchList.innerHTML = "";
    lesson.shouldNotMatch.forEach(word => {
        const li = document.createElement('li');
        li.className = "match-item";
        li.innerHTML = `<span>${escapeHTML(word)}</span><span class="match-icon"></span>`;
        shouldNotMatchList.appendChild(li);
    });

    // Populate editor with hint/previous value
    regexInput.value = lesson.defaultPattern || "";
    flagsInput.value = "g";
    
    // Set matching sample text for the user to play with
    testInput.value = [...lesson.mustMatch, ...lesson.shouldNotMatch].join("\n");
    
    evaluateRegex();
}

nextLessonBtn.addEventListener('click', () => {
    if (currentLessonIndex + 1 < LESSONS.length) {
        loadTrainerLesson(currentLessonIndex + 1);
    } else {
        alert("🎉 Congratulations! You have completed all RegExpLab lessons!");
    }
});

// --- REGEX TESTER LOGIC ---
function escapeHTML(str) {
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;');
}

function evaluateRegex() {
    const pattern = regexInput.value;
    const flags = flagsInput.value;
    const text = testInput.value;

    if (!pattern) {
        setInvalidState("Empty pattern");
        matchesCount.textContent = "0 matches";
        breakdownBody.innerHTML = `<tr><td colspan="3" class="empty-message">No matches yet. Write a valid regex and input some text.</td></tr>`;
        highlightOverlay.innerHTML = escapeHTML(text) + '\n';
        checkTrainerPass(null);
        return;
    }

    try {
        // Test compile
        const regex = new RegExp(pattern, flags);
        setValidState();

        // Calculate Matches & Ranges
        const matches = [];
        let match;
        
        // Use a safe copy for highlight iteration (always globally flags)
        const globalFlags = flags.includes('g') ? flags : flags + 'g';
        const searchRegex = new RegExp(pattern, globalFlags);
        
        let preventInfinite = 0;
        while ((match = searchRegex.exec(text)) !== null) {
            if (match.index === searchRegex.lastIndex) {
                searchRegex.lastIndex++;
            }
            matches.push({
                value: match[0],
                start: match.index,
                end: match.index + match[0].length,
                groups: match.slice(1)
            });
            
            preventInfinite++;
            if (preventInfinite > 5000) break; // Infinite safety loop guard
        }

        matchesCount.textContent = `${matches.length} match${matches.length === 1 ? '' : 'es'}`;

        // Render Highlight Overlay
        let html = '';
        let lastIdx = 0;
        matches.forEach((m, idx) => {
            html += escapeHTML(text.slice(lastIdx, m.start));
            const altClass = (idx % 2 === 0) ? '' : 'class="alt"';
            html += `<mark ${altClass}>${escapeHTML(m.value)}</mark>`;
            lastIdx = m.end;
        });
        html += escapeHTML(text.slice(lastIdx));
        highlightOverlay.innerHTML = html + '\n';

        // Render Matches Breakdown Table
        if (matches.length === 0) {
            breakdownBody.innerHTML = `<tr><td colspan="3" class="empty-message">Pattern matches nothing in the test string.</td></tr>`;
        } else {
            breakdownBody.innerHTML = "";
            matches.forEach((m, index) => {
                const tr = document.createElement('tr');
                
                const matchCell = document.createElement('td');
                matchCell.innerHTML = `<span class="match-val">${escapeHTML(m.value || '(empty)')}</span>`;
                tr.appendChild(matchCell);
                
                const rangeCell = document.createElement('td');
                rangeCell.innerHTML = `<span class="range-val">${m.start}-${m.end}</span>`;
                tr.appendChild(rangeCell);

                const groupsCell = document.createElement('td');
                if (m.groups && m.groups.length > 0 && m.groups.some(g => g !== undefined)) {
                    m.groups.forEach((g, gi) => {
                        if (g !== undefined) {
                            groupsCell.innerHTML += `<span class="group-badge">${gi+1}: ${escapeHTML(g)}</span>`;
                        }
                    });
                } else {
                    groupsCell.innerHTML = `<span class="range-val">-</span>`;
                }
                tr.appendChild(groupsCell);

                breakdownBody.appendChild(tr);
            });
        }

        // Validate current Trainer lesson
        checkTrainerPass(regex);

    } catch (err) {
        setInvalidState(err.message);
        matchesCount.textContent = "0 matches";
        breakdownBody.innerHTML = `<tr><td colspan="3" class="empty-message">Invalid Regular Expression structure.</td></tr>`;
        highlightOverlay.innerHTML = escapeHTML(text) + '\n';
        checkTrainerPass(null);
    }
}

function setValidState() {
    regexValid = true;
    validationStatus.className = "validation-status valid";
    validationText.textContent = "Valid Regular Expression";
    iconSuccess.classList.remove('hidden');
    iconError.classList.add('hidden');
}

function setInvalidState(msg) {
    regexValid = false;
    validationStatus.className = "validation-status invalid";
    validationText.textContent = `Error: ${msg}`;
    iconSuccess.classList.add('hidden');
    iconError.classList.remove('hidden');
}

function checkTrainerPass(regex) {
    if (document.getElementById('tab-trainer').classList.contains('active')) {
        // We are on trainer tab
    }
    
    const lesson = LESSONS[currentLessonIndex];
    if (!lesson) return;

    let mustMatchPassed = true;
    let shouldNotMatchPassed = true;

    // Check MUST MATCH list
    const mustMatchLi = mustMatchList.querySelectorAll('.match-item');
    lesson.mustMatch.forEach((word, idx) => {
        const itemEl = mustMatchLi[idx];
        if (!itemEl) {
            mustMatchPassed = false;
            return;
        }
        const iconEl = itemEl.querySelector('.match-icon');
        if (!iconEl) {
            mustMatchPassed = false;
            return;
        }
        let passes = false;

        if (regex) {
            // Check full anchor matching for trainer evaluation
            try {
                const testRegex = new RegExp(`^(${regex.source})$`, regex.flags);
                passes = testRegex.test(word);
            } catch (e) {
                passes = false;
            }
        }

        if (passes) {
            itemEl.className = "match-item matched";
            iconEl.innerHTML = "✓";
        } else {
            itemEl.className = "match-item not-matched";
            iconEl.innerHTML = "✗";
            mustMatchPassed = false;
        }
    });

    // Check SHOULD NOT MATCH list
    const shouldNotMatchLi = shouldNotMatchList.querySelectorAll('.match-item');
    lesson.shouldNotMatch.forEach((word, idx) => {
        const itemEl = shouldNotMatchLi[idx];
        if (!itemEl) {
            shouldNotMatchPassed = false;
            return;
        }
        const iconEl = itemEl.querySelector('.match-icon');
        if (!iconEl) {
            shouldNotMatchPassed = false;
            return;
        }
        let passes = false;

        if (regex) {
            try {
                const testRegex = new RegExp(`^(${regex.source})$`, regex.flags);
                passes = testRegex.test(word);
            } catch (e) {
                passes = false;
            }
        }

        if (!passes) {
            itemEl.className = "match-item matched"; // this is correct (matched the requirement)
            iconEl.innerHTML = "✓";
        } else {
            itemEl.className = "match-item not-matched";
            iconEl.innerHTML = "✗";
            shouldNotMatchPassed = false;
        }
    });

    if (regex && mustMatchPassed && shouldNotMatchPassed) {
        trainerStatusIndicator.className = "status-indicator passed";
        trainerStatusIndicator.textContent = "Passed!";
        nextLessonBtn.disabled = false;
    } else {
        trainerStatusIndicator.className = "status-indicator";
        trainerStatusIndicator.textContent = "Not Met";
        nextLessonBtn.disabled = true;
    }
}

// Event Listeners
regexInput.addEventListener('input', evaluateRegex);
flagsInput.addEventListener('input', evaluateRegex);
testInput.addEventListener('input', evaluateRegex);

// Scroll synchronization
testInput.addEventListener('scroll', () => {
    highlightOverlay.scrollTop = testInput.scrollTop;
    highlightOverlay.scrollLeft = testInput.scrollLeft;
});

lessonSelect.addEventListener('change', (e) => {
    const index = parseInt(e.target.value, 10);
    loadTrainerLesson(index);
});

// Initialization
testInput.value = DEFAULT_TEST_TEXT;
renderCheatsheet();
populateLessonSelect();
loadTrainerLesson(0);

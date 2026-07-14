/* Emoji Finder — offline emoji search & copy.
   Data comes from emoji-data.js: window.EMOJI_GROUPS (string[]) and
   window.EMOJI_DATA (rows of [emoji, name, groupIndex, keywords, skinToneSupport]). */
(function () {
    'use strict';

    // ---------- Semantic synonym layer ----------
    // Maps a concept the user might type to terms that actually appear in
    // emoji names/keywords. Concept keys are matched by prefix, so typing
    // "engine", "enginee", or "engineering" all expand the same way.
    const SYNONYMS = {
        engineering: ['wrench', 'tool', 'gear', 'hammer', 'construction', 'toolbox', 'screwdriver', 'nut and bolt', 'mechanic', 'triangular ruler', 'factory', 'settings'],
        engineer: ['wrench', 'tool', 'gear', 'hammer', 'construction', 'toolbox', 'mechanic', 'settings'],
        programming: ['laptop', 'computer', 'keyboard', 'technologist', 'bug', 'robot', 'desktop'],
        coding: ['laptop', 'computer', 'keyboard', 'technologist', 'bug', 'robot'],
        developer: ['laptop', 'computer', 'technologist', 'keyboard'],
        software: ['laptop', 'computer', 'floppy', 'disk', 'technologist'],
        hardware: ['computer', 'keyboard', 'mouse', 'printer', 'battery', 'electric plug', 'chip'],
        technology: ['laptop', 'computer', 'mobile phone', 'robot', 'satellite', 'battery'],
        internet: ['globe', 'laptop', 'computer', 'satellite', 'signal', 'wifi'],
        science: ['microscope', 'telescope', 'test tube', 'alembic', 'dna', 'petri dish', 'scientist', 'atom'],
        chemistry: ['test tube', 'alembic', 'petri dish', 'scientist'],
        math: ['abacus', 'plus', 'divide', 'input numbers', 'chart', '1234', 'triangular ruler', 'straight ruler'],
        medicine: ['pill', 'syringe', 'stethoscope', 'hospital', 'health worker', 'ambulance', 'adhesive bandage', 'thermometer', 'crutch'],
        medical: ['pill', 'syringe', 'stethoscope', 'hospital', 'health worker', 'ambulance', 'adhesive bandage'],
        doctor: ['health worker', 'stethoscope', 'hospital', 'syringe', 'pill'],
        sick: ['face with thermometer', 'nauseated', 'sneezing', 'face with head-bandage', 'pill', 'microbe', 'vomiting'],
        health: ['heart', 'pill', 'stethoscope', 'apple', 'flexed biceps', 'hospital'],
        law: ['balance scale', 'judge', 'police', 'classical building', 'gavel', 'page facing up'],
        legal: ['balance scale', 'judge', 'classical building', 'page facing up', 'fountain pen'],
        police: ['police officer', 'police car', 'police car light', 'oncoming police car', 'detective', 'shield'],
        security: ['locked', 'key', 'shield', 'detective', 'police officer', 'closed lock'],
        privacy: ['locked', 'key', 'shushing', 'detective', 'see-no-evil'],
        finance: ['money', 'dollar', 'bank', 'chart increasing', 'chart decreasing', 'coin', 'credit card', 'money bag', 'yen', 'euro', 'pound'],
        money: ['dollar', 'money bag', 'coin', 'credit card', 'bank', 'money with wings', 'gem stone', 'yen', 'euro'],
        business: ['briefcase', 'office building', 'necktie', 'handshake', 'chart increasing', 'bar chart', 'office worker'],
        work: ['briefcase', 'office building', 'laptop', 'hammer', 'construction worker', 'necktie', 'alarm clock'],
        meeting: ['calendar', 'handshake', 'busts in silhouette', 'speech balloon', 'office building', 'memo'],
        education: ['graduation cap', 'school', 'books', 'teacher', 'student', 'pencil', 'backpack', 'abacus'],
        school: ['graduation cap', 'books', 'teacher', 'student', 'pencil', 'backpack', 'bell'],
        learning: ['books', 'graduation cap', 'student', 'brain', 'light bulb', 'open book'],
        writing: ['pencil', 'pen', 'memo', 'writing hand', 'notebook', 'fountain pen', 'keyboard'],
        reading: ['open book', 'books', 'newspaper', 'bookmark', 'glasses'],
        art: ['artist palette', 'paintbrush', 'crayon', 'performing arts', 'framed picture', 'artist'],
        music: ['musical note', 'musical notes', 'guitar', 'piano', 'headphone', 'microphone', 'saxophone', 'trumpet', 'violin', 'drum', 'radio'],
        photography: ['camera', 'camera with flash', 'movie camera', 'selfie', 'film frames'],
        video: ['movie camera', 'video camera', 'television', 'clapper board', 'film projector', 'videocassette'],
        gaming: ['video game', 'joystick', 'game die', 'chess', 'slot machine', 'direct hit', 'trophy'],
        sports: ['soccer ball', 'basketball', 'american football', 'baseball', 'tennis', 'trophy', 'medal', 'running', 'volleyball'],
        exercise: ['flexed biceps', 'person lifting weights', 'running', 'person cartwheeling', 'gymnastics', 'sweat'],
        gym: ['flexed biceps', 'person lifting weights', 'running shoe', 'boxing glove'],
        travel: ['airplane', 'luggage', 'world map', 'compass', 'passport control', 'globe', 'beach', 'ship', 'train'],
        vacation: ['beach with umbrella', 'desert island', 'airplane', 'luggage', 'sunglasses', 'camping', 'palm tree'],
        transportation: ['automobile', 'bus', 'train', 'airplane', 'bicycle', 'ship', 'taxi', 'motorcycle'],
        driving: ['automobile', 'racing car', 'oncoming automobile', 'vertical traffic light', 'motorway'],
        space: ['rocket', 'astronaut', 'satellite', 'milky way', 'ringed planet', 'telescope', 'alien', 'star', 'moon', 'flying saucer'],
        weather: ['sun', 'cloud', 'rain', 'snow', 'thunder', 'rainbow', 'umbrella', 'tornado', 'fog', 'wind'],
        rain: ['cloud with rain', 'umbrella', 'droplet', 'umbrella with rain drops'],
        snow: ['snowflake', 'snowman', 'cloud with snow', 'skier', 'ice'],
        hot: ['fire', 'hot face', 'sun', 'thermometer', 'hot springs', 'desert', 'hot pepper'],
        cold: ['snowflake', 'cold face', 'ice', 'snowman', 'polar bear'],
        nature: ['deciduous tree', 'evergreen tree', 'herb', 'leaf', 'mountain', 'blossom', 'seedling', 'national park'],
        garden: ['seedling', 'potted plant', 'blossom', 'tulip', 'rose', 'sunflower', 'herb'],
        farming: ['farmer', 'tractor', 'ear of corn', 'sheaf of rice', 'cow', 'pig', 'chicken', 'seedling'],
        ocean: ['water wave', 'fish', 'dolphin', 'whale', 'octopus', 'shell', 'anchor', 'sailboat', 'shark', 'coral'],
        beach: ['beach with umbrella', 'water wave', 'palm tree', 'sun', 'bikini', 'shell', 'desert island'],
        camping: ['tent', 'camping', 'fire', 'mountain', 'flashlight', 'compass'],
        food: ['pizza', 'hamburger', 'fork and knife', 'taco', 'sushi', 'bread', 'cooking', 'plate'],
        cooking: ['cooking', 'cook', 'fork and knife', 'salt', 'stew', 'kitchen knife'],
        breakfast: ['cooking', 'bacon', 'pancakes', 'croissant', 'hot beverage', 'egg', 'waffle'],
        coffee: ['hot beverage'],
        alcohol: ['beer mug', 'wine glass', 'cocktail glass', 'clinking glasses', 'tumbler glass', 'bottle with popping cork', 'sake'],
        drinks: ['beer mug', 'wine glass', 'cocktail glass', 'cup with straw', 'hot beverage', 'tropical drink', 'bubble tea'],
        dessert: ['shortcake', 'ice cream', 'doughnut', 'cookie', 'chocolate bar', 'cupcake', 'candy', 'pie'],
        celebration: ['party popper', 'confetti ball', 'balloon', 'birthday cake', 'sparkles', 'partying face', 'clinking glasses', 'fireworks'],
        party: ['party popper', 'confetti ball', 'balloon', 'partying face', 'clinking glasses', 'mirror ball', 'sparkles'],
        birthday: ['birthday cake', 'balloon', 'party popper', 'wrapped gift', 'confetti ball'],
        wedding: ['wedding', 'ring', 'person with veil', 'couple with heart', 'bouquet', 'church', 'heart'],
        holiday: ['christmas tree', 'santa claus', 'jack-o-lantern', 'fireworks', 'wrapped gift', 'menorah', 'palm tree'],
        christmas: ['christmas tree', 'santa claus', 'wrapped gift', 'snowman', 'bell', 'deer'],
        halloween: ['jack-o-lantern', 'ghost', 'spider', 'spider web', 'skull', 'vampire', 'zombie', 'bat', 'candy'],
        spooky: ['ghost', 'jack-o-lantern', 'skull', 'spider', 'zombie', 'vampire', 'coffin', 'bat'],
        love: ['red heart', 'heart', 'kiss', 'couple with heart', 'smiling face with hearts', 'rose', 'love letter', 'heart eyes'],
        romance: ['red heart', 'kiss', 'rose', 'couple with heart', 'love letter', 'candle', 'wine glass'],
        happy: ['grinning', 'smile', 'joy', 'beaming', 'sparkles', 'partying face', 'sun'],
        sad: ['crying', 'loudly crying', 'pensive', 'disappointed', 'frowning', 'broken heart', 'worried'],
        angry: ['angry', 'pouting', 'rage', 'face with symbols on mouth', 'fire', 'face with steam from nose'],
        scared: ['fearful', 'anxious face with sweat', 'face screaming in fear', 'ghost', 'worried'],
        surprised: ['astonished', 'face with open mouth', 'exploding head', 'flushed'],
        confused: ['confused', 'thinking face', 'face with raised eyebrow', 'question mark', 'woozy'],
        tired: ['sleepy', 'sleeping', 'yawning', 'weary', 'zzz', 'bed', 'tired face'],
        sleep: ['sleeping', 'zzz', 'bed', 'crescent moon', 'sleeping face', 'night with stars'],
        funny: ['face with tears of joy', 'rolling on the floor laughing', 'clown', 'grinning squinting', 'upside-down'],
        cool: ['smiling face with sunglasses', 'sunglasses', 'fire', 'ok hand', 'thumbs up'],
        agreement: ['thumbs up', 'ok hand', 'handshake', 'check mark', 'check mark button'],
        approval: ['thumbs up', 'ok hand', 'check mark button', 'hundred points', 'clapping hands'],
        no: ['thumbs down', 'cross mark', 'prohibited', 'no entry', 'person gesturing no'],
        yes: ['thumbs up', 'check mark', 'check mark button', 'ok hand', 'person gesturing ok'],
        thanks: ['folded hands', 'smiling face with smiling eyes', 'bouquet', 'red heart', 'handshake'],
        congratulations: ['party popper', 'clapping hands', 'trophy', 'confetti ball', 'sparkles', 'hundred points'],
        success: ['trophy', 'check mark button', 'chart increasing', 'hundred points', '1st place medal', 'sparkles', 'rocket'],
        winner: ['trophy', '1st place medal', 'sports medal', 'crown', 'party popper'],
        failure: ['cross mark', 'chart decreasing', 'disappointed', 'thumbs down', 'broken heart'],
        warning: ['warning', 'police car light', 'construction', 'no entry', 'triangular flag', 'megaphone'],
        danger: ['warning', 'skull and crossbones', 'high voltage', 'biohazard', 'radioactive', 'fire', 'no entry'],
        idea: ['light bulb', 'thought balloon', 'brain', 'thinking face', 'sparkles'],
        question: ['question mark', 'thinking face', 'person raising hand', 'red question mark', 'white question mark'],
        important: ['exclamation', 'red exclamation mark', 'pushpin', 'star', 'warning', 'bookmark', 'police car light'],
        announcement: ['megaphone', 'loudspeaker', 'bell', 'newspaper', 'postal horn'],
        communication: ['speech balloon', 'telephone', 'e-mail', 'envelope', 'mobile phone', 'megaphone', 'satellite antenna'],
        email: ['envelope', 'e-mail', 'incoming envelope', 'envelope with arrow', 'inbox tray', 'outbox tray', 'mailbox'],
        phone: ['mobile phone', 'telephone', 'telephone receiver', 'mobile phone with arrow', 'vibration mode'],
        time: ['alarm clock', 'hourglass', 'watch', 'stopwatch', 'mantelpiece clock', 'calendar', 'timer clock'],
        calendar: ['calendar', 'tear-off calendar', 'spiral calendar'],
        fast: ['rocket', 'racing car', 'high voltage', 'leopard', 'dashing away', 'running'],
        slow: ['turtle', 'snail', 'sloth', 'hourglass'],
        strong: ['flexed biceps', 'ox', 'gorilla', 'fire', 'hundred points', 'mechanical arm'],
        power: ['high voltage', 'battery', 'electric plug', 'flexed biceps', 'crown', 'fire'],
        magic: ['magic wand', 'crystal ball', 'sparkles', 'mage', 'fairy', 'unicorn', 'top hat', 'shooting star'],
        luck: ['four leaf clover', 'crossed fingers', 'game die', 'sparkles', 'shooting star'],
        death: ['skull', 'coffin', 'headstone', 'funeral urn', 'skull and crossbones', 'ghost', 'wilted flower'],
        religion: ['folded hands', 'church', 'mosque', 'synagogue', 'latin cross', 'star of david', 'om', 'menorah', 'prayer beads', 'kaaba'],
        baby: ['baby', 'baby bottle', 'baby symbol', 'child', 'baby chick', 'baby angel'],
        family: ['family', 'couple with heart', 'baby', 'house', 'man', 'woman', 'child', 'old woman', 'old man'],
        home: ['house', 'house with garden', 'houses', 'door', 'bed', 'couch and lamp', 'potted plant'],
        cleaning: ['broom', 'sponge', 'soap', 'basket', 'toilet', 'shower', 'bubbles'],
        shopping: ['shopping cart', 'shopping bags', 'credit card', 'department store', 'convenience store', 'coin', 'label'],
        gift: ['wrapped gift', 'ribbon', 'bouquet', 'party popper', 'love letter'],
        delivery: ['package', 'delivery truck', 'incoming envelope', 'airplane'],
        construction: ['construction', 'building construction', 'construction worker', 'brick', 'hammer'],
        fix: ['wrench', 'hammer', 'hammer and wrench', 'screwdriver', 'gear', 'toolbox', 'nut and bolt'],
        repair: ['wrench', 'hammer and wrench', 'screwdriver', 'toolbox', 'gear', 'mechanic'],
        measure: ['straight ruler', 'triangular ruler', 'balance scale', 'thermometer'],
        fire_dept: ['fire engine', 'firefighter', 'fire extinguisher', 'fire'],
        military: ['military helmet', 'military medal', 'crossed swords', 'shield', 'bomb', 'water pistol'],
        pirate: ['pirate flag', 'skull and crossbones', 'parrot', 'anchor', 'sailboat', 'gem stone', 'world map'],
        detective: ['detective', 'magnifying glass tilted left', 'magnifying glass tilted right', 'footprints', 'key', 'light bulb'],
        search: ['magnifying glass tilted left', 'magnifying glass tilted right', 'detective', 'telescope', 'eyes'],
        location: ['round pushpin', 'world map', 'compass', 'globe', 'pushpin'],
        direction: ['compass', 'right arrow', 'left arrow', 'up arrow', 'down arrow', 'round pushpin', 'world map'],
        silence: ['shushing face', 'zipper-mouth face', 'face without mouth', 'muted speaker'],
        loud: ['loudspeaker', 'megaphone', 'speaker high volume', 'face screaming in fear', 'postal horn', 'bell'],
        vote: ['ballot box with ballot', 'check mark', 'raised hand', 'classical building', 'memo'],
        government: ['classical building', 'office building', 'balance scale', 'ballot box with ballot', 'necktie'],
        environment: ['recycling symbol', 'seedling', 'globe showing americas', 'deciduous tree', 'wind face', 'sun', 'water wave', 'leaf'],
        recycle: ['recycling symbol', 'wastebasket', 'seedling', 'leaf fluttering in wind'],
        energy: ['high voltage', 'battery', 'electric plug', 'sun', 'fire', 'wind face', 'droplet'],
        light: ['light bulb', 'flashlight', 'candle', 'sun', 'sparkles', 'high voltage', 'red paper lantern'],
        dark: ['new moon', 'night with stars', 'crescent moon', 'black large square', 'bat', 'candle'],
        king: ['crown', 'prince', 'castle', 'gem stone'],
        queen: ['crown', 'princess', 'castle', 'gem stone'],
        movie: ['movie camera', 'clapper board', 'film projector', 'popcorn', 'cinema', 'admission tickets', 'film frames'],
        theater: ['performing arts', 'admission tickets', 'clapper board', 'microphone', 'ballet shoes'],
        dance: ['woman dancing', 'man dancing', 'people with bunny ears', 'ballet shoes', 'mirror ball', 'musical notes'],
        swim: ['person swimming', 'water wave', 'goggles', 'one-piece swimsuit', 'swim brief', 'beach with umbrella'],
        winter: ['snowflake', 'snowman', 'skier', 'ice skate', 'scarf', 'coat', 'hot beverage'],
        summer: ['sun', 'beach with umbrella', 'ice cream', 'sunglasses', 'palm tree', 'bikini', 'watermelon'],
        spring: ['cherry blossom', 'blossom', 'seedling', 'tulip', 'butterfly', 'rainbow', 'hatching chick'],
        autumn: ['fallen leaf', 'maple leaf', 'jack-o-lantern', 'chestnut', 'mushroom', 'wind face'],
        fall: ['fallen leaf', 'maple leaf', 'jack-o-lantern', 'chestnut', 'mushroom'],
        morning: ['sunrise', 'sun', 'hot beverage', 'alarm clock', 'rooster', 'sunrise over mountains'],
        night: ['crescent moon', 'night with stars', 'sleeping face', 'bed', 'owl', 'milky way', 'zzz'],
        pet: ['dog face', 'cat face', 'dog', 'cat', 'hamster', 'rabbit face', 'fish', 'bird', 'paw prints'],
        goodbye: ['waving hand', 'door', 'airplane departure', 'crying face', 'saluting face'],
        hello: ['waving hand', 'grinning', 'call me hand', 'raised hand', 'smiling face with open hands'],
        speed: ['rocket', 'racing car', 'dashing away', 'high voltage', 'stopwatch'],
        broken: ['broken heart', 'cross mark', 'wrench', 'hammer', 'face with head-bandage', 'chart decreasing'],
        new: ['new button', 'sparkles', 'baby', 'seedling', 'sunrise'],
        random: ['game die', 'slot machine', 'crystal ball', 'shuffle tracks button'],
        launch: ['rocket', 'airplane departure', 'party popper', 'checkered flag', 'high voltage'],
        deadline: ['alarm clock', 'hourglass done', 'calendar', 'stopwatch', 'face screaming in fear', 'fire'],
        bug: ['lady beetle', 'ant', 'cockroach', 'microbe', 'spider', 'wrench']
    };
    // ---------- Build search index ----------
    const GROUPS = window.EMOJI_GROUPS;
    const EMOJIS = window.EMOJI_DATA.map(function (row, i) {
        return {
            char: row[0],
            name: row[1],
            nameLower: row[1].toLowerCase(),
            nameWords: row[1].toLowerCase().split(/[\s-]+/),
            group: row[2],
            keywords: row[3] ? row[3].split('|') : [],
            tone: row[4] === 1,
            order: i
        };
    });

    // ---------- DOM refs ----------
    const $ = id => document.getElementById(id);
    const searchInput = $('searchInput');
    const searchWrap = searchInput.parentElement;
    const clearSearch = $('clearSearch');
    const resultsContainer = $('resultsContainer');
    const recentSection = $('recentSection');
    const recentGrid = $('recentGrid');
    const categoryBar = $('categoryBar');
    const copyModeSel = $('copyMode');
    const tonePicker = $('tonePicker');
    const toast = $('toast');
    const detailEmoji = $('detailEmoji');
    const detailName = $('detailName');
    const detailKeywords = $('detailKeywords');
    const detailCode = $('detailCode');

    $('emojiCount').textContent = EMOJIS.length.toLocaleString() + ' emojis';

    // ---------- State ----------
    let activeCategory = -2; // -2 = most common (default), -1 = all, >=0 = group index
    let skinTone = localStorage.getItem('emojifinder-tone') || '';
    let currentResults = [];
    const MAX_RECENT = 20;
    let recent = [];
    try { recent = JSON.parse(localStorage.getItem('emojifinder-recent') || '[]').slice(0, MAX_RECENT); } catch (e) { recent = []; }

    // ---------- Skin tone ----------
    function applyTone(e) {
        if (!skinTone || !e.tone) return e.char;
        // Insert the modifier after the first code point, dropping a
        // variation selector (FE0F) that would otherwise block it.
        const parts = Array.from(e.char);
        let rest = parts.slice(1);
        if (rest[0] === '️') rest = rest.slice(1);
        return parts[0] + skinTone + rest.join('');
    }

    tonePicker.addEventListener('click', function (ev) {
        const btn = ev.target.closest('.tone-swatch');
        if (!btn) return;
        skinTone = btn.dataset.tone;
        localStorage.setItem('emojifinder-tone', skinTone);
        tonePicker.querySelectorAll('.tone-swatch').forEach(b => b.classList.toggle('active', b === btn));
        render();
        renderRecent();
    });
    tonePicker.querySelectorAll('.tone-swatch').forEach(b => {
        b.classList.toggle('active', b.dataset.tone === skinTone);
    });

    // ---------- Search ----------
    function stems(token) {
        // Light stemming so "running" matches "run", "parties" matches "party".
        const out = [token];
        if (token.length > 4 && token.endsWith('ies')) out.push(token.slice(0, -3) + 'y');
        if (token.length > 3 && token.endsWith('es')) out.push(token.slice(0, -2));
        if (token.length > 3 && token.endsWith('s')) out.push(token.slice(0, -1));
        if (token.length > 5 && token.endsWith('ing')) {
            const base = token.slice(0, -3);
            out.push(base);
            if (base.length > 2 && base[base.length - 1] === base[base.length - 2]) out.push(base.slice(0, -1));
            out.push(base + 'e');
        }
        if (token.length > 4 && token.endsWith('ed')) {
            out.push(token.slice(0, -2));
            out.push(token.slice(0, -1));
        }
        return out;
    }

    function synonymTerms(token) {
        // Concept keys match on a shared prefix of 4+ chars so partial typing
        // ("engi"), full words ("engineering"), and close variants
        // ("celebrate" vs "celebration") all expand the same concept.
        const terms = [];
        for (const key in SYNONYMS) {
            const n = Math.min(key.length, token.length);
            let p = 0;
            while (p < n && key[p] === token[p]) p++;
            const exactOrExtends = p === key.length && (p === token.length || key.length >= 3);
            const typingKey = p === token.length && token.length >= 3;
            if (exactOrExtends || typingKey || p >= 6) {
                terms.push.apply(terms, SYNONYMS[key]);
            }
        }
        return terms;
    }

    // info = { t: token, variants: stems(t), syn: synonymTerms(t) } — computed
    // once per token in search(), not per emoji.
    function scoreToken(e, info) {
        const token = info.t;
        if (e.char === token) return 100;
        if (e.nameLower === token) return 100;
        let best = 0;
        for (const t of info.variants) {
            const penalty = t === token ? 0 : 5;
            if (e.nameLower === t) { best = Math.max(best, 95 - penalty); continue; }
            for (const w of e.nameWords) {
                if (w === t) { best = Math.max(best, 85 - penalty); break; }
                if (w.startsWith(t)) { best = Math.max(best, 70 - penalty); }
            }
            if (best < 65 && t.length >= 3 && e.nameLower.includes(t)) best = Math.max(best, 55 - penalty);
            for (const k of e.keywords) {
                if (k === t) { best = Math.max(best, 75 - penalty); break; }
                if (k.startsWith(t)) { best = Math.max(best, 60 - penalty); continue; }
                if (t.length >= 3 && k.includes(t)) best = Math.max(best, 42 - penalty);
            }
        }
        // Semantic layer: expand concept -> concrete terms.
        if (best < 65) {
            for (const term of info.syn) {
                if (e.nameLower === term) { best = Math.max(best, 65); continue; }
                if (e.nameLower.startsWith(term + ' ')) best = Math.max(best, 55);
                for (const w of e.nameWords) {
                    if (w === term) { best = Math.max(best, 50); break; }
                }
                for (const k of e.keywords) {
                    if (k === term) { best = Math.max(best, 52); break; }
                    // near-full prefix only (e.g. term "books" vs keyword "book")
                    if (k.startsWith(term) && k.length <= term.length + 2) best = Math.max(best, 45);
                    else if (term.startsWith(k) && k.length >= term.length - 2) best = Math.max(best, 45);
                }
            }
        }
        // Group name match (e.g. "flags", "objects") as a weak signal.
        if (best === 0 && token.length >= 3 && GROUPS[e.group].toLowerCase().includes(token)) best = 20;
        return best;
    }

    function search(query) {
        const tokens = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
        if (!tokens.length) return null;
        const infos = tokens.map(t => ({ t: t, variants: stems(t), syn: synonymTerms(t) }));
        const scored = [];
        for (const e of EMOJIS) {
            if (activeCategory >= 0 && e.group !== activeCategory) continue;
            let total = 0, ok = true;
            for (const t of infos) {
                const s = scoreToken(e, t);
                if (s === 0) { ok = false; break; }
                total += s;
            }
            if (ok) scored.push([total, e]);
        }
        scored.sort((a, b) => b[0] - a[0] || a[1].order - b[1].order);
        return scored.map(x => x[1]);
    }

    // ---------- Rendering ----------
    function emojiButton(e) {
        const btn = document.createElement('button');
        btn.className = 'emoji-btn';
        btn.textContent = applyTone(e);
        btn.title = e.name;
        btn.dataset.i = e.order;
        return btn;
    }

    // Progressive rendering: building 1,900 emoji buttons in one go janks the
    // keystroke, so paint the first chunk synchronously and stream the rest in
    // on animation frames. A bumped token abandons any in-flight fill.
    const RENDER_CHUNK = 200;
    let renderToken = 0;

    function renderSections(sections) {
        const token = ++renderToken;
        resultsContainer.innerHTML = '';
        const jobs = [];
        for (const s of sections) {
            const head = document.createElement('div');
            head.className = 'section-head';
            const h2 = document.createElement('h2');
            h2.textContent = s.title;
            const count = document.createElement('span');
            count.className = 'count';
            count.textContent = s.count;
            h2.appendChild(count);
            head.appendChild(h2);
            resultsContainer.appendChild(head);
            const grid = document.createElement('div');
            grid.className = 'emoji-grid';
            resultsContainer.appendChild(grid);
            jobs.push({ grid, list: s.list, i: 0 });
        }
        let ji = 0;
        function fill() {
            if (token !== renderToken) return;
            let n = 0;
            while (ji < jobs.length && n < RENDER_CHUNK) {
                const job = jobs[ji];
                const frag = document.createDocumentFragment();
                while (job.i < job.list.length && n < RENDER_CHUNK) {
                    frag.appendChild(emojiButton(job.list[job.i++]));
                    n++;
                }
                job.grid.appendChild(frag);
                if (job.i >= job.list.length) ji++;
            }
            if (ji < jobs.length) requestAnimationFrame(fill);
        }
        fill();
    }

    const GROUP_LISTS = GROUPS.map((_, gi) => EMOJIS.filter(e => e.group === gi));

    // The 100 most-used emojis (per Unicode emoji frequency data), shown as the
    // default view instead of dumping all 1,900.
    const POPULAR = ['😂', '❤️', '🤣', '👍', '😭', '🙏', '😘', '🥰', '😍', '😊',
        '🎉', '😁', '💕', '🥺', '😅', '🔥', '☺️', '🤦', '♥️', '🤷',
        '🙄', '😆', '🤗', '😉', '🎂', '🤔', '👏', '🙂', '😳', '🥳',
        '😎', '👌', '💜', '😔', '💪', '✨', '💖', '👀', '😋', '😏',
        '😢', '👉', '💗', '😩', '💯', '🌹', '💞', '🎈', '💙', '😃',
        '😡', '💐', '😜', '🙈', '🤞', '😄', '🤤', '🙌', '🤪', '❣️',
        '😀', '💋', '💀', '👇', '💔', '😌', '💓', '🤩', '🙃', '😬',
        '😱', '😴', '🤭', '😐', '🌞', '😒', '😇', '🌸', '😈', '🎶',
        '✌️', '🎊', '🥵', '😞', '💚', '☀️', '🖤', '💰', '😚', '👑',
        '🎁', '💥', '🙋', '☹️', '😑', '🥴', '👈', '💩', '✅', '👋'];
    const BY_CHAR = new Map(EMOJIS.map(e => [e.char, e]));
    const POPULAR_LIST = POPULAR.map(c => BY_CHAR.get(c)).filter(Boolean);

    const MAX_RESULTS = 100;

    function render() {
        const q = searchInput.value.trim();
        searchWrap.classList.toggle('has-text', q.length > 0);
        recentSection.hidden = q.length > 0 || recent.length === 0;

        if (q) {
            currentResults = search(q);
            if (!currentResults.length) {
                renderToken++;
                resultsContainer.innerHTML =
                    '<div class="no-results"><span class="big">🤷</span>No emoji found for "' +
                    q.replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c])) +
                    '"<br>Try a broader word like "happy", "tools", or "food".</div>';
                return;
            }
            const capped = currentResults.length > MAX_RESULTS;
            renderSections([{
                title: 'Results',
                count: capped
                    ? 'top ' + MAX_RESULTS + ' of ' + currentResults.length + ' matches'
                    : currentResults.length + ' match' + (currentResults.length === 1 ? '' : 'es'),
                list: currentResults.slice(0, MAX_RESULTS)
            }]);
        } else {
            currentResults = [];
            if (activeCategory === -2) {
                renderSections([{
                    title: '💯 Most Common',
                    count: POPULAR_LIST.length + ' emojis — search or pick a category for more',
                    list: POPULAR_LIST
                }]);
            } else if (activeCategory === -1) {
                const sections = [];
                for (let gi = 0; gi < GROUPS.length; gi++) {
                    if (GROUP_LISTS[gi].length) {
                        sections.push({ title: GROUPS[gi], count: String(GROUP_LISTS[gi].length), list: GROUP_LISTS[gi] });
                    }
                }
                renderSections(sections);
            } else {
                renderSections([{
                    title: GROUPS[activeCategory],
                    count: String(GROUP_LISTS[activeCategory].length),
                    list: GROUP_LISTS[activeCategory]
                }]);
            }
        }
    }

    function renderRecent() {
        recentGrid.innerHTML = '';
        if (!recent.length) { recentSection.hidden = true; return; }
        const frag = document.createDocumentFragment();
        for (const idx of recent) {
            const e = EMOJIS[idx];
            if (e) frag.appendChild(emojiButton(e));
        }
        recentGrid.appendChild(frag);
        if (!searchInput.value.trim()) recentSection.hidden = false;
    }

    // ---------- Categories ----------
    function buildCategoryBar() {
        const common = document.createElement('button');
        common.className = 'cat-chip active';
        common.textContent = '⭐ Common';
        common.dataset.cat = '-2';
        categoryBar.appendChild(common);
        const icons = ['😀', '🧑', '🐻', '🍔', '✈️', '⚽', '💡', '🔣', '🏳️'];
        GROUPS.forEach(function (g, i) {
            const chip = document.createElement('button');
            chip.className = 'cat-chip';
            chip.textContent = (icons[i] || '') + ' ' + g;
            chip.dataset.cat = String(i);
            categoryBar.appendChild(chip);
        });
        const all = document.createElement('button');
        all.className = 'cat-chip';
        all.textContent = '🌐 All';
        all.dataset.cat = '-1';
        categoryBar.appendChild(all);
        categoryBar.addEventListener('click', function (ev) {
            const chip = ev.target.closest('.cat-chip');
            if (!chip) return;
            activeCategory = parseInt(chip.dataset.cat, 10);
            categoryBar.querySelectorAll('.cat-chip').forEach(c => c.classList.toggle('active', c === chip));
            render();
        });
    }

    // ---------- Copy ----------
    function toCodepoints(str) {
        return Array.from(str).map(c => 'U+' + c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')).join(' ');
    }

    function copyPayload(e) {
        const ch = applyTone(e);
        switch (copyModeSel.value) {
            case 'codepoint': return toCodepoints(ch);
            case 'html': return Array.from(ch).map(c => '&#x' + c.codePointAt(0).toString(16).toUpperCase() + ';').join('');
            case 'shortcode': return ':' + e.nameLower.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') + ':';
            default: return ch;
        }
    }

    function copyText(text) {
        if (navigator.clipboard && window.isSecureContext) {
            return navigator.clipboard.writeText(text);
        }
        // file:// fallback
        return new Promise(function (resolve, reject) {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            try {
                document.execCommand('copy') ? resolve() : reject(new Error('copy failed'));
            } catch (err) {
                reject(err);
            } finally {
                document.body.removeChild(ta);
            }
        });
    }

    let toastTimer = null;
    function showToast(msg) {
        toast.textContent = msg;
        toast.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove('show'), 1400);
    }

    function copyEmoji(e, btn) {
        const payload = copyPayload(e);
        copyText(payload).then(function () {
            showToast('Copied ' + applyTone(e) + '  ' + (copyModeSel.value === 'emoji' ? e.name : payload));
            if (btn) {
                btn.classList.add('just-copied');
                setTimeout(() => btn.classList.remove('just-copied'), 500);
            }
            recent = [e.order].concat(recent.filter(i => i !== e.order)).slice(0, MAX_RECENT);
            localStorage.setItem('emojifinder-recent', JSON.stringify(recent));
            renderRecent();
        }).catch(function () {
            showToast('⚠️ Copy failed — select and copy manually: ' + payload);
        });
    }

    // ---------- Events ----------
    document.addEventListener('click', function (ev) {
        const btn = ev.target.closest('.emoji-btn');
        if (!btn) return;
        copyEmoji(EMOJIS[parseInt(btn.dataset.i, 10)], btn);
    });

    document.addEventListener('mouseover', function (ev) {
        const btn = ev.target.closest('.emoji-btn');
        if (!btn) return;
        const e = EMOJIS[parseInt(btn.dataset.i, 10)];
        const ch = applyTone(e);
        detailEmoji.textContent = ch;
        detailName.textContent = e.name;
        detailKeywords.textContent = e.keywords.join(', ');
        detailCode.textContent = toCodepoints(ch);
    });

    let debounce = null;
    searchInput.addEventListener('input', function () {
        clearTimeout(debounce);
        debounce = setTimeout(render, 60);
    });

    searchInput.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter' && currentResults.length) {
            copyEmoji(currentResults[0], null);
        } else if (ev.key === 'Escape') {
            searchInput.value = '';
            render();
        }
    });

    clearSearch.addEventListener('click', function () {
        searchInput.value = '';
        render();
        searchInput.focus();
    });

    $('clearRecent').addEventListener('click', function () {
        recent = [];
        localStorage.removeItem('emojifinder-recent');
        renderRecent();
    });

    // Global shortcut: "/" focuses search.
    document.addEventListener('keydown', function (ev) {
        if (ev.key === '/' && document.activeElement !== searchInput) {
            ev.preventDefault();
            searchInput.focus();
        }
    });

    // ---------- Init ----------
    window.__emojiSearch = search; // exposed for testing
    window.__popularList = POPULAR_LIST; // exposed for testing
    buildCategoryBar();
    renderRecent();
    render();
})();

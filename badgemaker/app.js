/**
 * Badge Forge - Application Logic
 */

(function () {
    // --- Canvas roundRect Polyfill for Browser Compatibility ---
    if (!CanvasRenderingContext2D.prototype.roundRect) {
        CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
            if (typeof r === 'number') {
                r = [r, r, r, r];
            } else if (Array.isArray(r)) {
                if (r.length === 1) r = [r[0], r[0], r[0], r[0]];
                else if (r.length === 2) r = [r[0], r[1], r[0], r[1]];
                else if (r.length === 3) r = [r[0], r[1], r[2], r[1]];
            } else {
                r = [0, 0, 0, 0];
            }
            this.moveTo(x + r[0], y);
            this.lineTo(x + w - r[1], y);
            this.quadraticCurveTo(x + w, y, x + w, y + r[1]);
            this.lineTo(x + w, y + h - r[2]);
            this.quadraticCurveTo(x + w, y + h, x + w - r[2], y + h);
            this.lineTo(x + r[3], y + h);
            this.quadraticCurveTo(x, y + h, x, y + h - r[3]);
            this.lineTo(x, y + r[0]);
            this.quadraticCurveTo(x, y, x + r[0], y);
            return this;
        };
    }

    // -------------------------------------------------------------
    // 1. STATE MANAGEMENT
    // -------------------------------------------------------------
    const state = {
        shape: 'rounded-rect',
        cornerRadius: 25,
        borderStyle: 'solid',
        borderWidth: 8,
        borderColor: '#ffffff',
        gloss: true,
        shadow: true,
        fillType: 'linear',
        fillColor1: '#ea580c',
        fillColor2: '#f43f5e',
        gradientAngle: 45,
        emoji: '🏆',
        emojiScale: 1.0,
        emojiOffsetX: 0,
        emojiOffsetY: 0,
        emojiRotation: 0,
        emojiGlowColor: '#ffd700',
        emojiGlowBlur: 8,
        bannerText: 'CHAMPION',
        bannerLayout: 'ribbon-bottom', // 'none', 'ribbon-bottom', 'arc-top', 'arc-bottom', 'flat-center'
        bannerFont: 'Outfit',
        bannerColor: '#dc2626',
        bannerTextColor: '#ffffff',
        bannerTextSize: 28,
        bannerOutlineColor: '#000000',
        appearEffect: 'pop', // 'none', 'pop', 'spin', 'drift'
        overlayEffect: 'shine', // 'none', 'shine', 'sparkles', 'pulse'
        fxIntensity: 1.0,
        animationSpeed: 1.0,
        transparentExport: true,
        gifCaptureMode: 'loop' // 'loop', 'reveal'
    };

    // Animation variables
    let isPlaying = true;
    let animFrameId = null;
    let lastTime = 0;
    let fpsTime = 0;
    let fpsFrames = 0;
    
    // Animation progress trackers
    let appearProgress = 1.0; // 0 to 1. 1.0 means fully appeared.
    let globalTime = 0; // continuous time increment
    let neonPulsePhase = 0;
    let isRecordingVideo = false; // flag to force solid background for video recorders

    // Canvas references
    const canvas = document.getElementById('badgeCanvas');
    const ctx = canvas.getContext('2d', { alpha: true });
    const viewport = document.getElementById('canvasViewport');

    // Particle Pools
    const fireParticles = [];
    const sparkleParticles = [];
    const MAX_FIRE_PARTICLES = 60;
    const MAX_SPARKLES = 25;

    // Emojis lists by category
    const EMOJI_CATEGORIES = {
        smileys: ['😂', '😍', '😎', '😡', '😱', '🤔', '😴', '🥳', '😇', '🤖', '💀', '👽', '🤠', '🤡', '🦊', '🦁', '🐷', '🐨'],
        badges: ['🏆', '🥇', '🥈', '🥉', '🎖', '🏅', '🎗', '🎫', '👑', '⭐️', '🌟', '💎', '🔑', '🏷', '📦', '🎁', '🎈', '🎉'],
        powers: ['🔥', '⚡', '💥', '✨', '☄️', '🔮', '🛡', '⚔️', '⚙️', '🧿', '🔋', '🔌', '💡', '🔔', '📣', '❤️', '💔', '🍀'],
        animals: ['👾', '🦖', '🦄', '🐝', '🐙', '🦖', '🦈', '🐉', '🐈', '🐕', '🦅', '🦉', '🦋', '🕷', '🌲', 'cactus', '🌻', '🍕'],
        hearts: ['❤️', '💖', '💝', '💜', '🖤', '💙', '💚', '💛', '🤍', '🧡', '💞', '💘', '🎀', '💌', '🌸', '🌹', '🌈', '🍭']
    };

    // Preset configurations
    const PRESETS = {
        'fire-champion': {
            shape: 'rounded-rect',
            cornerRadius: 25,
            borderStyle: 'solid',
            borderWidth: 8,
            borderColor: '#ffffff',
            gloss: true,
            shadow: true,
            fillType: 'linear',
            fillColor1: '#ea580c',
            fillColor2: '#f43f5e',
            gradientAngle: 45,
            emoji: '🏆',
            emojiScale: 1.0,
            emojiOffsetX: 0,
            emojiOffsetY: 0,
            emojiRotation: 0,
            emojiGlowColor: '#ffd700',
            emojiGlowBlur: 12,
            bannerText: 'CHAMPION',
            bannerLayout: 'ribbon-bottom',
            bannerFont: 'Outfit',
            bannerColor: '#dc2626',
            bannerTextColor: '#ffffff',
            bannerTextSize: 28,
            bannerOutlineColor: '#000000',
            appearEffect: 'pop',
            overlayEffect: 'shine',
            fxIntensity: 1.0,
            animationSpeed: 1.0
        },
        'vip-gold': {
            shape: 'shield',
            cornerRadius: 25,
            borderStyle: 'double',
            borderWidth: 10,
            borderColor: '#ffffff',
            gloss: true,
            shadow: true,
            fillType: 'linear',
            fillColor1: '#ffd700',
            fillColor2: '#b8860b',
            gradientAngle: 90,
            emoji: '👑',
            emojiScale: 1.15,
            emojiOffsetX: 0,
            emojiOffsetY: -10,
            emojiRotation: 0,
            emojiGlowColor: '#ffd700',
            emojiGlowBlur: 8,
            bannerText: 'VIP GOLD',
            bannerLayout: 'ribbon-bottom',
            bannerFont: 'Outfit',
            bannerColor: '#111827',
            bannerTextColor: '#f3f4f6',
            bannerTextSize: 24,
            bannerOutlineColor: '#d97706',
            appearEffect: 'spin',
            overlayEffect: 'sparkles',
            fxIntensity: 1.2,
            animationSpeed: 0.8
        },
        'cyber-neon': {
            shape: 'hexagon',
            cornerRadius: 15,
            borderStyle: 'neon',
            borderWidth: 6,
            borderColor: '#06b6d4',
            gloss: true,
            shadow: true,
            fillType: 'animated',
            fillColor1: '#1e1b4b',
            fillColor2: '#311042',
            gradientAngle: 120,
            emoji: '⚡',
            emojiScale: 1.1,
            emojiOffsetX: 0,
            emojiOffsetY: 0,
            emojiRotation: 15,
            emojiGlowColor: '#06b6d4',
            emojiGlowBlur: 16,
            bannerText: 'CYBER',
            bannerLayout: 'flat-center',
            bannerFont: 'Courier New',
            bannerColor: '#ec4899',
            bannerTextColor: '#ffffff',
            bannerTextSize: 26,
            bannerOutlineColor: '#1e1b4b',
            appearEffect: 'spin',
            overlayEffect: 'pulse',
            fxIntensity: 1.0,
            animationSpeed: 1.2
        },
        'heart-sparkle': {
            shape: 'heart',
            cornerRadius: 25,
            borderStyle: 'solid',
            borderWidth: 6,
            borderColor: '#ffffff',
            gloss: true,
            shadow: true,
            fillType: 'radial',
            fillColor1: '#ff007f',
            fillColor2: '#8b0000',
            gradientAngle: 0,
            emoji: '💖',
            emojiScale: 0.95,
            emojiOffsetX: 0,
            emojiOffsetY: -12,
            emojiRotation: 0,
            emojiGlowColor: '#ff007f',
            emojiGlowBlur: 10,
            bannerText: 'CUTE',
            bannerLayout: 'arc-bottom',
            bannerFont: 'Outfit',
            bannerColor: '#ffffff',
            bannerTextColor: '#ff007f',
            bannerTextSize: 28,
            bannerOutlineColor: '#ffffff',
            appearEffect: 'pop',
            overlayEffect: 'sparkles',
            fxIntensity: 1.0,
            animationSpeed: 0.8
        },
        'toxic-shield': {
            shape: 'octagon',
            cornerRadius: 25,
            borderStyle: 'dashed',
            borderWidth: 8,
            borderColor: '#22c55e',
            gloss: false,
            shadow: true,
            fillType: 'linear',
            fillColor1: '#14532d',
            fillColor2: '#022c22',
            gradientAngle: 180,
            emoji: '☣️',
            emojiScale: 1.05,
            emojiOffsetX: 0,
            emojiOffsetY: 0,
            emojiRotation: 0,
            emojiGlowColor: '#22c55e',
            emojiGlowBlur: 12,
            bannerText: 'HAZARD',
            bannerLayout: 'ribbon-bottom',
            bannerFont: 'Impact',
            bannerColor: '#15803d',
            bannerTextColor: '#fef08a',
            bannerTextSize: 28,
            bannerOutlineColor: '#022c22',
            appearEffect: 'drift',
            overlayEffect: 'pulse',
            fxIntensity: 1.0,
            animationSpeed: 1.0
        }
    };

    // -------------------------------------------------------------
    // 2. PARTICLE CLASS IMPLEMENTATIONS
    // -------------------------------------------------------------
    class FireParticle {
        constructor() {
            this.reset();
        }

        reset() {
            // Spawn around the bottom-ish contour of the badge (radius ~ 160)
            const angle = Math.PI * (0.1 + Math.random() * 0.8); // bottom half angle
            const spawnRadius = 150 + (Math.random() - 0.5) * 30;
            this.x = 256 + Math.cos(angle) * spawnRadius;
            this.y = 256 + Math.sin(angle) * spawnRadius;

            // Velocities: float upwards, sway horizontally
            this.vx = (Math.random() - 0.5) * 1.5;
            this.vy = -Math.random() * 4 - 2;

            this.size = Math.random() * 20 + 8;
            this.maxLife = Math.random() * 30 + 15;
            this.life = this.maxLife;
            this.depth = Math.random(); // 0 is back, 1 is front
        }

        update(speed) {
            this.x += this.vx * speed;
            this.y += this.vy * speed;
            this.vx += (Math.random() - 0.5) * 0.4;
            this.life -= speed;

            if (this.life <= 0) {
                this.reset();
            }
        }

        draw(gCtx, intensity) {
            const lifeRatio = this.life / this.maxLife; // 1 down to 0
            if (lifeRatio <= 0) return;

            gCtx.save();
            gCtx.globalCompositeOperation = 'screen';
            gCtx.beginPath();
            gCtx.arc(this.x, this.y, this.size * lifeRatio * intensity, 0, Math.PI * 2);

            // Interpolate colors: White center -> Yellow -> Orange -> Red -> Transparent
            let color;
            if (lifeRatio > 0.85) {
                color = `rgba(255, 255, 255, ${lifeRatio})`;
            } else if (lifeRatio > 0.55) {
                color = `rgba(253, 224, 71, ${lifeRatio})`; // Yellow
            } else if (lifeRatio > 0.25) {
                color = `rgba(249, 115, 22, ${lifeRatio * 1.2})`; // Orange
            } else {
                color = `rgba(239, 68, 68, ${lifeRatio * 1.5})`; // Red
            }

            gCtx.fillStyle = color;
            gCtx.shadowColor = 'rgba(239, 68, 68, 0.4)';
            gCtx.shadowBlur = this.size * 0.4;
            gCtx.fill();
            gCtx.restore();
        }
    }

    class Sparkle {
        constructor() {
            this.reset();
        }

        reset() {
            // Spawn anywhere around the badge box
            this.x = 256 + (Math.random() - 0.5) * 360;
            this.y = 256 + (Math.random() - 0.5) * 360;

            this.size = Math.random() * 8 + 4;
            this.maxLife = Math.random() * 45 + 15;
            this.life = this.maxLife;
            this.color = Math.random() > 0.5 ? '#fef08a' : '#a5b4fc'; // yellow-gold or indigo glow
            this.rot = Math.random() * Math.PI;
            this.rotSpeed = (Math.random() - 0.5) * 0.05;
        }

        update(speed) {
            this.life -= speed;
            this.rot += this.rotSpeed * speed;
            if (this.life <= 0) {
                this.reset();
            }
        }

        draw(gCtx, intensity, isTransparentGif = false) {
            const lifeRatio = this.life / this.maxLife;
            const alpha = Math.sin(lifeRatio * Math.PI); // smooth swell
            if (alpha <= 0) return;

            gCtx.save();
            gCtx.translate(this.x, this.y);
            gCtx.rotate(this.rot);
            gCtx.beginPath();
            
            // Draw a 4-point star
            const s = this.size * alpha * intensity;
            gCtx.moveTo(0, -s);
            gCtx.quadraticCurveTo(0, 0, s, 0);
            gCtx.quadraticCurveTo(0, 0, 0, s);
            gCtx.quadraticCurveTo(0, 0, -s, 0);
            gCtx.quadraticCurveTo(0, 0, 0, -s);

            gCtx.fillStyle = this.color;
            if (!isTransparentGif) {
                gCtx.shadowColor = this.color;
                gCtx.shadowBlur = s * 2.5;
            }
            gCtx.fill();
            gCtx.restore();
        }
    }

    // Initialize particle arrays
    for (let i = 0; i < MAX_FIRE_PARTICLES; i++) {
        fireParticles.push(new FireParticle());
    }
    for (let i = 0; i < MAX_SPARKLES; i++) {
        sparkleParticles.push(new Sparkle());
    }

    // -------------------------------------------------------------
    // 3. SHAPE PATH GENERATORS
    // -------------------------------------------------------------
    function makeShapePath(gCtx, shape, cx, cy, r, cornerRadPercent) {
        gCtx.beginPath();
        switch (shape) {
            case 'circle':
                gCtx.arc(cx, cy, r, 0, Math.PI * 2);
                break;
            case 'square':
                gCtx.rect(cx - r, cy - r, r * 2, r * 2);
                break;
            case 'rounded-rect':
                const size = r * 2;
                const rad = (cornerRadPercent / 100) * size;
                gCtx.roundRect(cx - r, cy - r, size, size, rad);
                break;
            case 'shield':
                // Classic visual shield layout
                gCtx.moveTo(cx, cy - r); // top center
                gCtx.lineTo(cx + r, cy - r); // top right
                gCtx.lineTo(cx + r, cy - r * 0.3); // right edge upper
                // curve down to the bottom point
                gCtx.quadraticCurveTo(cx + r, cy + r * 0.4, cx + r * 0.7, cy + r * 0.7);
                gCtx.quadraticCurveTo(cx + r * 0.3, cy + r * 0.9, cx, cy + r * 1.15); // bottom tip
                gCtx.quadraticCurveTo(cx - r * 0.3, cy + r * 0.9, cx - r * 0.7, cy + r * 0.7);
                gCtx.quadraticCurveTo(cx - r, cy + r * 0.4, cx - r, cy - r * 0.3);
                gCtx.lineTo(cx - r, cy - r); // top left
                gCtx.closePath();
                break;
            case 'hexagon':
                for (let i = 0; i < 6; i++) {
                    const angle = (Math.PI / 3) * i - Math.PI / 2;
                    const x = cx + r * Math.cos(angle);
                    const y = cy + r * Math.sin(angle);
                    if (i === 0) gCtx.moveTo(x, y);
                    else gCtx.lineTo(x, y);
                }
                gCtx.closePath();
                break;
            case 'octagon':
                for (let i = 0; i < 8; i++) {
                    const angle = (Math.PI / 4) * i - Math.PI / 8;
                    const x = cx + r * Math.cos(angle);
                    const y = cy + r * Math.sin(angle);
                    if (i === 0) gCtx.moveTo(x, y);
                    else gCtx.lineTo(x, y);
                }
                gCtx.closePath();
                break;
            case 'star-5':
                drawStarPath(gCtx, cx, cy, 5, r, r * 0.45);
                break;
            case 'star-8':
                drawStarPath(gCtx, cx, cy, 8, r, r * 0.65);
                break;
            case 'heart':
                // Classic Bezier heart
                gCtx.moveTo(cx, cy - r * 0.45);
                // Left curve
                gCtx.bezierCurveTo(cx - r * 0.5, cy - r * 1.25, cx - r * 1.35, cy - r * 0.6, cx - r * 1.15, cy + r * 0.15);
                gCtx.bezierCurveTo(cx - r * 0.95, cy + r * 0.6, cx - r * 0.4, cy + r * 0.85, cx, cy + r * 1.2); // bottom center
                // Right curve
                gCtx.bezierCurveTo(cx + r * 0.4, cy + r * 0.85, cx + r * 0.95, cy + r * 0.6, cx + r * 1.15, cy + r * 0.15);
                gCtx.bezierCurveTo(cx + r * 1.35, cy - r * 0.6, cx + r * 0.5, cy - r * 1.25, cx, cy - r * 0.45);
                gCtx.closePath();
                break;
            case 'diamond':
                gCtx.moveTo(cx, cy - r * 1.05); // top
                gCtx.lineTo(cx + r * 1.05, cy); // right
                gCtx.lineTo(cx, cy + r * 1.05); // bottom
                gCtx.lineTo(cx - r * 1.05, cy); // left
                gCtx.closePath();
                break;
        }
    }

    function drawStarPath(gCtx, cx, cy, spikes, outerRadius, innerRadius) {
        let rot = (Math.PI / 2) * 3;
        let x = cx;
        let y = cy;
        const step = Math.PI / spikes;

        gCtx.moveTo(cx, cy - outerRadius);
        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            gCtx.lineTo(x, y);
            rot += step;

            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            gCtx.lineTo(x, y);
            rot += step;
        }
        gCtx.lineTo(cx, cy - outerRadius);
        gCtx.closePath();
    }

    // Darken a hex color (e.g. for 3D ribbon folds)
    function darkenColor(hex, percent) {
        hex = hex.replace(/^\s*#|\s*$/g, '');
        if (hex.length === 3) {
            hex = hex.replace(/(.)/g, '$1$1');
        }
        let r = parseInt(hex.substr(0, 2), 16) || 0;
        let g = parseInt(hex.substr(2, 2), 16) || 0;
        let b = parseInt(hex.substr(4, 2), 16) || 0;

        r = Math.max(0, Math.min(255, Math.floor(r * (1 - percent))));
        g = Math.max(0, Math.min(255, Math.floor(g * (1 - percent))));
        b = Math.max(0, Math.min(255, Math.floor(b * (1 - percent))));

        const rHex = r.toString(16).padStart(2, '0');
        const gHex = g.toString(16).padStart(2, '0');
        const bHex = b.toString(16).padStart(2, '0');
        return `#${rHex}${gHex}${bHex}`;
    }

    // -------------------------------------------------------------
    // 4. MAIN RENDERING WORKHORSE
    // -------------------------------------------------------------
    function renderBadgeFrame(gCtx, width, height, isExport = false, isGifExport = false) {
        // Clear canvas
        gCtx.clearRect(0, 0, width, height);

        // Force solid dark background during video recording to prevent compression banding
        if (isRecordingVideo) {
            gCtx.fillStyle = '#12121a';
            gCtx.fillRect(0, 0, width, height);
        }

        const cx = width / 2;
        const cy = height / 2;
        const radius = 150; // base bounding radius of badge backing shape
        const fxIntensity = parseFloat(state.fxIntensity);

        // Update neon pulse state
        if (!isExport) {
            neonPulsePhase = (neonPulsePhase + 0.05 * parseFloat(state.animationSpeed)) % (Math.PI * 2);
        }

        // Apply appearance animation transformations (scale and rotate)
        let renderScale = 1.0;
        let renderRotation = 0; // radians
        let renderOffsetY = 0;

        if (state.appearEffect !== 'none') {
            const t = appearProgress;
            if (state.appearEffect === 'pop') {
                // Elastic pop-in curve
                const c4 = (2 * Math.PI) / 3;
                renderScale = t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
            } else if (state.appearEffect === 'spin') {
                // easeOutBack curve + rotation
                const c1 = 1.70158;
                const c3 = c1 + 1;
                renderScale = t === 1 ? 1 : 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
                renderRotation = (1 - t) * -Math.PI; // spin 180 deg
            } else if (state.appearEffect === 'drift') {
                // slide up from bottom
                renderScale = t;
                renderOffsetY = (1 - t) * 80;
            }
        }

        // Draw active background overlay particles (none for shine, handled in front)

        gCtx.save();
        // Shift context to badge center, apply scale/rotation, shift back
        gCtx.translate(cx, cy + renderOffsetY);
        gCtx.scale(renderScale, renderScale);
        gCtx.rotate(renderRotation);
        
        // We will execute backing shape operations relative to center (0,0)
        const localCx = 0;
        const localCy = 0;

        // 1. Backing Drop Shadow (disabled for transparent GIF exports to prevent 1-bit banding rings)
        const isTransparentGif = isGifExport && state.transparentExport;
        if (state.shadow && !isTransparentGif) {
            gCtx.shadowColor = 'rgba(0, 0, 0, 0.45)';
            gCtx.shadowBlur = 18;
            gCtx.shadowOffsetX = 0;
            gCtx.shadowOffsetY = 10;
        }

        // 2. Draw Backing Shape Fill
        makeShapePath(gCtx, state.shape, localCx, localCy, radius, state.cornerRadius);
        
        let fillStyle;
        if (state.fillType === 'solid') {
            fillStyle = state.fillColor1;
        } else if (state.fillType === 'linear') {
            const rad = (state.gradientAngle * Math.PI) / 180;
            const dx = radius * Math.cos(rad);
            const dy = radius * Math.sin(rad);
            fillStyle = gCtx.createLinearGradient(localCx - dx, localCy - dy, localCx + dx, localCy + dy);
            fillStyle.addColorStop(0, state.fillColor1);
            fillStyle.addColorStop(1, state.fillColor2);
        } else if (state.fillType === 'radial') {
            fillStyle = gCtx.createRadialGradient(localCx, localCy, radius * 0.1, localCx, localCy, radius);
            fillStyle.addColorStop(0, state.fillColor1);
            fillStyle.addColorStop(1, state.fillColor2);
        } else if (state.fillType === 'animated') {
            // Animate angle shifts using global continuous time
            const angleOffset = globalTime * 40;
            const rad = ((state.gradientAngle + angleOffset) % 360 * Math.PI) / 180;
            const dx = radius * Math.cos(rad);
            const dy = radius * Math.sin(rad);
            fillStyle = gCtx.createLinearGradient(localCx - dx, localCy - dy, localCx + dx, localCy + dy);
            fillStyle.addColorStop(0, state.fillColor1);
            fillStyle.addColorStop(0.5, state.fillColor2);
            fillStyle.addColorStop(1, state.fillColor1);
        }

        gCtx.fillStyle = fillStyle;
        gCtx.fill();

        // Immediately kill shadow after fill, so it doesn't affect borders, emojis, and labels
        gCtx.shadowColor = 'transparent';
        gCtx.shadowBlur = 0;
        gCtx.shadowOffsetX = 0;
        gCtx.shadowOffsetY = 0;

        // 3. Draw Backing Borders
        if (state.borderStyle !== 'none') {
            gCtx.save();
            gCtx.lineWidth = state.borderWidth;
            
            if (state.borderStyle === 'dashed') {
                gCtx.setLineDash([state.borderWidth * 2, state.borderWidth]);
            }

            if (state.borderStyle === 'neon') {
                // Pulse glow intensity
                const pulseMultiplier = 0.7 + Math.sin(neonPulsePhase) * 0.3;
                gCtx.strokeStyle = state.borderColor;
                gCtx.shadowColor = state.borderColor;
                gCtx.shadowBlur = 12 * pulseMultiplier;
                gCtx.stroke();
                gCtx.shadowBlur = 24 * pulseMultiplier;
                gCtx.stroke();
            } else if (state.borderStyle === 'double') {
                gCtx.strokeStyle = state.borderColor;
                gCtx.stroke();
                
                // Draw inner ring
                gCtx.lineWidth = Math.max(2, state.borderWidth / 2.5);
                gCtx.beginPath();
                makeShapePath(gCtx, state.shape, localCx, localCy, radius - state.borderWidth - 2, state.cornerRadius);
                gCtx.stroke();
            } else {
                // standard solid border
                gCtx.strokeStyle = state.borderColor;
                gCtx.stroke();
            }
            gCtx.restore();
        }

        // 4. Gloss Overlay Highlight Sweep
        if (state.gloss) {
            gCtx.save();
            // Clip to shape boundary
            makeShapePath(gCtx, state.shape, localCx, localCy, radius, state.cornerRadius);
            gCtx.clip();

            // Diagonal light shine gradient
            const glossGrad = gCtx.createLinearGradient(localCx - radius, localCy - radius, localCx + radius, localCy + radius);
            glossGrad.addColorStop(0, 'rgba(255, 255, 255, 0.38)');
            glossGrad.addColorStop(0.3, 'rgba(255, 255, 255, 0.15)');
            glossGrad.addColorStop(0.31, 'rgba(255, 255, 255, 0)');
            glossGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

            gCtx.fillStyle = glossGrad;
            gCtx.fillRect(localCx - radius * 1.5, localCy - radius * 1.5, radius * 3, radius * 3);
            gCtx.restore();
        }

        // 5. Draw Emoji / Icon
        gCtx.save();
        const emSize = 110 * parseFloat(state.emojiScale);
        gCtx.font = `bold ${emSize}px Arial, sans-serif`;
        gCtx.textAlign = 'center';
        gCtx.textBaseline = 'middle';

        // Apply emoji offsets, translations, and rotation
        const emX = state.emojiOffsetX;
        const emY = state.emojiOffsetY;
        gCtx.translate(emX, emY);
        gCtx.rotate((state.emojiRotation * Math.PI) / 180);

        // Emoji shadow/glow filter (disabled for transparent GIF exports to prevent 1-bit banding rings)
        if (state.emojiGlowBlur > 0 && !isTransparentGif) {
            gCtx.shadowColor = state.emojiGlowColor;
            gCtx.shadowBlur = state.emojiGlowBlur;
            gCtx.shadowOffsetX = 0;
            gCtx.shadowOffsetY = 0;
        }

        gCtx.fillText(state.emoji, 0, 0);
        gCtx.restore();

        // 6. Draw Banner Labels
        if (state.bannerLayout !== 'none' && state.bannerText.trim() !== '') {
            drawBanner(gCtx, localCx, localCy, radius);
        }

        // 7. Draw Shine Glint Overlay (Sweeps across the badge inside clipping mask)
        if (state.overlayEffect === 'shine') {
            gCtx.save();
            makeShapePath(gCtx, state.shape, localCx, localCy, radius, state.cornerRadius);
            gCtx.clip();

            gCtx.rotate(Math.PI / 5); // 36-degree diagonal tilt

            // Calculate translation phase
            const progress = (globalTime * 0.1) % 1.5; // loop with brief pause
            const sweepRange = radius * 3.5;
            let sweepY = -sweepRange;

            if (progress < 1.0) {
                sweepY = -sweepRange / 1.7 + progress * sweepRange * 1.18;
            } else {
                sweepY = sweepRange * 2; // pause offscreen
            }

            const shineWidth = 45 * fxIntensity;
            const shineGrad = gCtx.createLinearGradient(0, sweepY - shineWidth, 0, sweepY + shineWidth);
            shineGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
            shineGrad.addColorStop(0.35, 'rgba(255, 255, 255, 0.05)');
            shineGrad.addColorStop(0.5, `rgba(255, 255, 255, ${0.75 * fxIntensity})`); // bright core
            shineGrad.addColorStop(0.65, 'rgba(255, 255, 255, 0.05)');
            shineGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

            gCtx.fillStyle = shineGrad;
            gCtx.fillRect(-radius * 1.6, sweepY - shineWidth, radius * 3.2, shineWidth * 2);
            gCtx.restore();
        }

        gCtx.restore(); // restore from center translate/scale/rotation

        // Draw active foreground overlay particles (sparkles)
        if (state.overlayEffect === 'sparkles' && fxIntensity > 0) {
            sparkleParticles.forEach(sp => {
                sp.draw(gCtx, fxIntensity, isTransparentGif);
            });
        }
    }

    // -------------------------------------------------------------
    // 5. BANNER RENDERING
    // -------------------------------------------------------------
    function drawBanner(gCtx, cx, cy, r) {
        const text = state.bannerText.toUpperCase();
        gCtx.save();

        if (state.bannerLayout === 'ribbon-bottom') {
            // --- DRAW 3D FOLDED RIBBON ---
            const bannerW = r * 1.5;
            const bannerH = 46;
            const bannerY = cy + r * 0.55;
            const color = state.bannerColor;
            const darkColor = darkenColor(color, 0.35); // shade folding connects
            const backColor = darkenColor(color, 0.18); // back folding ends

            // Ribbon Side Ends (Left and Right backs with V notch cuts)
            const foldW = r * 0.22;
            const foldOffset = bannerW / 2;

            // Left end
            gCtx.fillStyle = backColor;
            gCtx.beginPath();
            gCtx.moveTo(cx - foldOffset - foldW, bannerY + 8);
            gCtx.lineTo(cx - foldOffset + 4, bannerY + 8);
            gCtx.lineTo(cx - foldOffset + 4, bannerY + bannerH + 4);
            gCtx.lineTo(cx - foldOffset - foldW, bannerY + bannerH + 4);
            gCtx.lineTo(cx - foldOffset - foldW + 12, bannerY + bannerH/2 + 6); // V cut
            gCtx.closePath();
            gCtx.fill();
            gCtx.strokeStyle = darkenColor(backColor, 0.2);
            gCtx.lineWidth = 1.5;
            gCtx.stroke();

            // Right end
            gCtx.beginPath();
            gCtx.moveTo(cx + foldOffset + foldW, bannerY + 8);
            gCtx.lineTo(cx + foldOffset - 4, bannerY + 8);
            gCtx.lineTo(cx + foldOffset - 4, bannerY + bannerH + 4);
            gCtx.lineTo(cx + foldOffset + foldW, bannerY + bannerH + 4);
            gCtx.lineTo(cx + foldOffset + foldW - 12, bannerY + bannerH/2 + 6); // V cut
            gCtx.closePath();
            gCtx.fill();
            gCtx.stroke();

            // Side Connection Folds (Darker shading for 3D overlap)
            gCtx.fillStyle = darkColor;
            // Left Connection
            gCtx.beginPath();
            gCtx.moveTo(cx - foldOffset, bannerY + bannerH);
            gCtx.lineTo(cx - foldOffset + 12, bannerY + bannerH + 8);
            gCtx.lineTo(cx - foldOffset + 12, bannerY + 8);
            gCtx.closePath();
            gCtx.fill();

            // Right Connection
            gCtx.beginPath();
            gCtx.moveTo(cx + foldOffset, bannerY + bannerH);
            gCtx.lineTo(cx + foldOffset - 12, bannerY + bannerH + 8);
            gCtx.lineTo(cx + foldOffset - 12, bannerY + 8);
            gCtx.closePath();
            gCtx.fill();

            // Front Ribbon Face
            gCtx.fillStyle = color;
            gCtx.beginPath();
            gCtx.roundRect(cx - foldOffset + 12, bannerY, bannerW - 24, bannerH, 4);
            gCtx.fill();
            
            gCtx.strokeStyle = '#ffffff';
            gCtx.lineWidth = 2.5;
            gCtx.stroke();

            // Front Ribbon Text
            gCtx.fillStyle = state.bannerTextColor;
            gCtx.font = `bold ${state.bannerTextSize}px ${state.bannerFont}, sans-serif`;
            gCtx.textAlign = 'center';
            gCtx.textBaseline = 'middle';
            
            // Text Outline
            gCtx.strokeStyle = state.bannerOutlineColor;
            gCtx.lineWidth = 4;
            gCtx.strokeText(text, cx, bannerY + bannerH / 2 + 1);
            gCtx.fillText(text, cx, bannerY + bannerH / 2 + 1);

        } else if (state.bannerLayout === 'flat-center') {
            // --- FLAT CENTER BANNER ---
            const barW = r * 1.8;
            const barH = state.bannerTextSize * 1.5;
            gCtx.fillStyle = state.bannerColor;
            
            gCtx.beginPath();
            gCtx.roundRect(cx - barW / 2, cy - barH / 2, barW, barH, 6);
            gCtx.fill();
            gCtx.strokeStyle = '#ffffff';
            gCtx.lineWidth = 2;
            gCtx.stroke();

            gCtx.fillStyle = state.bannerTextColor;
            gCtx.font = `bold ${state.bannerTextSize}px ${state.bannerFont}, sans-serif`;
            gCtx.textAlign = 'center';
            gCtx.textBaseline = 'middle';

            gCtx.strokeStyle = state.bannerOutlineColor;
            gCtx.lineWidth = 4;
            gCtx.strokeText(text, cx, cy + 1);
            gCtx.fillText(text, cx, cy + 1);

        } else if (state.bannerLayout === 'arc-top' || state.bannerLayout === 'arc-bottom') {
            // --- CURVED ARC TEXT ---
            const isTop = state.bannerLayout === 'arc-top';
            const arcRadius = r * 0.76;
            const startAngle = isTop ? -Math.PI / 2 : Math.PI / 2;

            gCtx.fillStyle = state.bannerTextColor;
            gCtx.font = `bold ${state.bannerTextSize}px ${state.bannerFont}, sans-serif`;
            gCtx.textAlign = 'center';
            gCtx.textBaseline = isTop ? 'bottom' : 'top';

            const chars = text.split('');
            // Spacing angle: scales with size
            const charSpacing = (state.bannerTextSize * 0.007);
            const totalAngle = (chars.length - 1) * charSpacing;
            
            let curAngle = isTop ? 
                startAngle - totalAngle / 2 : 
                startAngle + totalAngle / 2; // reverse order for bottom so text reads left-to-right

            for (let i = 0; i < chars.length; i++) {
                const charIndex = isTop ? i : (chars.length - 1 - i);
                const char = chars[charIndex];
                
                gCtx.save();
                const x = cx + arcRadius * Math.cos(curAngle);
                const y = cy + arcRadius * Math.sin(curAngle);
                gCtx.translate(x, y);
                
                // Rotations facing outward
                const normalRot = curAngle + (isTop ? Math.PI / 2 : -Math.PI / 2);
                gCtx.rotate(normalRot);

                // Outline
                gCtx.strokeStyle = state.bannerOutlineColor;
                gCtx.lineWidth = 4.5;
                gCtx.strokeText(char, 0, 0);
                gCtx.fillText(char, 0, 0);

                gCtx.restore();
                curAngle += isTop ? charSpacing : -charSpacing;
            }
        }
        gCtx.restore();
    }

    // -------------------------------------------------------------
    // 6. MAIN PLAYBACK & UPDATE LOOP
    // -------------------------------------------------------------
    function updateAnimationStates(deltaTime) {
        // Continuous global time multiplier
        const speed = parseFloat(state.animationSpeed) * (deltaTime / 16.67);
        globalTime += 0.05 * speed;

        // Intro Appear Progress Tracker
        if (state.appearEffect !== 'none') {
            appearProgress += 0.02 * speed;
            if (appearProgress > 1.0) appearProgress = 1.0;
        } else {
            appearProgress = 1.0;
        }

        // Active FX Updates
        if (state.overlayEffect === 'sparkles') {
            sparkleParticles.forEach(sp => sp.update(speed));
        }
    }

    function tick(timestamp) {
        if (!lastTime) lastTime = timestamp;
        let deltaTime = timestamp - lastTime;
        lastTime = timestamp;

        // Cap deltatime to prevent giant skips (e.g. background tab)
        if (deltaTime > 100) deltaTime = 16.67;

        // Track FPS
        fpsFrames++;
        if (timestamp - fpsTime >= 1000) {
            document.getElementById('fpsCounter').textContent = `FPS: ${fpsFrames}`;
            fpsFrames = 0;
            fpsTime = timestamp;
        }

        if (isPlaying) {
            updateAnimationStates(deltaTime);
        }

        // Draw everything
        renderBadgeFrame(ctx, canvas.width, canvas.height);

        animFrameId = requestAnimationFrame(tick);
    }

    function triggerAppearReset() {
        appearProgress = 0.0;
    }

    // -------------------------------------------------------------
    // 7. PNG EXPORTS (Alpha / Transparencies)
    // -------------------------------------------------------------
    function downloadPNG() {
        const originalTransparent = state.transparentExport;
        
        // Temporarily pause loop, render exact current frame, then capture
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');

        // Draw grid or transparent backing
        if (!originalTransparent) {
            tempCtx.fillStyle = '#18181b'; // matches default dark grid background fill
            tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        }

        // Render current state to temp canvas
        renderBadgeFrame(tempCtx, tempCanvas.width, tempCanvas.height, true);

        // Download via virtual link anchor
        tempCanvas.toBlob(blob => {
            if (!blob) return;
            const link = document.createElement('a');
            link.download = `custom_badge_${state.emoji}_${Date.now()}.png`;
            link.href = URL.createObjectURL(blob);
            link.click();
            URL.revokeObjectURL(link.href);
        }, 'image/png');
    }

    // -------------------------------------------------------------
    // 8. SYNCHRONOUS/INTERVAL GIF EXPORTS
    // -------------------------------------------------------------
    function downloadGIF() {
        const loadingModal = document.getElementById('loadingModal');
        const loadingStatus = document.getElementById('loadingStatusText');
        const progressBarFill = document.getElementById('progressBarFill');

        // Show compile progress overlay
        loadingModal.classList.add('active');
        loadingStatus.textContent = 'Preparing animation loops...';
        progressBarFill.style.width = '0%';

        // Pause active rendering loop
        const wasPlaying = isPlaying;
        isPlaying = false;
        if (animFrameId) cancelAnimationFrame(animFrameId);

        // Setup capture dimensions (512x512 matches native coordinates to avoid cropping)
        const gifWidth = 512;
        const gifHeight = 512;
        const captureCanvas = document.createElement('canvas');
        captureCanvas.width = gifWidth;
        captureCanvas.height = gifHeight;
        const capCtx = captureCanvas.getContext('2d', { willReadFrequently: true });

        const animSpeed = parseFloat(state.animationSpeed) || 1.0;
        const oneLoopDuration = 5000 / animSpeed;
        const duration = state.gifCaptureMode === 'reveal' ? 
            (1000 / animSpeed) + oneLoopDuration : 
            oneLoopDuration;

        const gifDelayMS = 50; // 50ms per frame (20 FPS)
        const framesToRecord = Math.max(10, Math.round(duration / gifDelayMS));

        // Save active states and set recording presets
        const initialAppearProgress = appearProgress;
        const initialGlobalTime = globalTime;

        if (state.gifCaptureMode === 'reveal') {
            appearProgress = 0.0; // Start reveal from zero
        }

        let currentFrameIndex = 0;
        
        // Instantiate the encoder from our local window.gifenc namespace
        const encoder = gifenc.GIFEncoder();

        // Render frames offscreen in a timeout queue to avoid freezing UI
        function recordNextFrame() {
            if (currentFrameIndex < framesToRecord) {
                loadingStatus.textContent = `Processing frame ${currentFrameIndex + 1} of ${framesToRecord}...`;
                const progressPct = Math.floor((currentFrameIndex / framesToRecord) * 90); // 0% to 90% progress
                progressBarFill.style.width = `${progressPct}%`;

                // Update animation frames steps by the exact time elapsed in this frame
                updateAnimationStates(gifDelayMS);

                capCtx.clearRect(0, 0, gifWidth, gifHeight);

                // Add solid backing if transparent is toggled OFF
                if (!state.transparentExport) {
                    capCtx.fillStyle = '#18181b';
                    capCtx.fillRect(0, 0, gifWidth, gifHeight);
                }

                // Render at captured scale
                renderBadgeFrame(capCtx, gifWidth, gifHeight, true, true);

                // Extract RGBA pixel data
                const imageData = capCtx.getImageData(0, 0, gifWidth, gifHeight);
                const pixels = imageData.data; // Uint8ClampedArray

                // Setup quantization format (rgba5551 supports 1-bit transparency, rgb565 does not)
                const format = state.transparentExport ? 'rgba5551' : 'rgb565';
                
                // Quantize pixel colors down to a 256-color palette
                const palette = gifenc.quantize(pixels, 256, { format: format });
                
                // Map the original RGBA pixels to the indices in the palette
                const index = gifenc.applyPalette(pixels, palette, format);

                // Setup frame options (including delay in MS)
                const writeOptions = { palette, delay: gifDelayMS };

                if (state.transparentExport) {
                    // Find the index representing the fully transparent color (alpha = 0)
                    let transparentIndex = 0;
                    for (let i = 0; i < palette.length; i++) {
                        const color = palette[i];
                        if (color && color.length > 3 && color[3] === 0) {
                            transparentIndex = i;
                            break;
                        }
                    }
                    writeOptions.transparent = true;
                    writeOptions.transparentIndex = transparentIndex;
                }

                // Write the frame to the GIF stream
                encoder.writeFrame(index, gifWidth, gifHeight, writeOptions);

                currentFrameIndex++;
                setTimeout(recordNextFrame, 15);
            } else {
                loadingStatus.textContent = 'Writing GIF file...';
                progressBarFill.style.width = '95%';

                setTimeout(() => {
                    // Finalize the GIF file
                    encoder.finish();
                    const buffer = encoder.bytes(); // Uint8Array containing exact written bytes
                    const blob = new Blob([buffer], { type: 'image/gif' });

                    progressBarFill.style.width = '100%';
                    loadingStatus.textContent = 'GIF Completed! Downloading...';

                    setTimeout(() => {
                        const link = document.createElement('a');
                        link.download = `animated_badge_${state.emoji}_${Date.now()}.gif`;
                        link.href = URL.createObjectURL(blob);
                        link.click();
                        URL.revokeObjectURL(link.href);

                        // Close modal, restore animations
                        loadingModal.classList.remove('active');
                        resetPlaybackState();
                    }, 500);
                }, 50);
            }
        }

        function resetPlaybackState() {
            // Restore initial global timeline states
            appearProgress = initialAppearProgress;
            globalTime = initialGlobalTime;
            isPlaying = wasPlaying;
            
            // Restart rendering ticks
            lastTime = performance.now();
            animFrameId = requestAnimationFrame(tick);
        }

        // Start capture stack
        setTimeout(recordNextFrame, 100);
    }

    // -------------------------------------------------------------
    // 8.5. WEBM EXPORTS (Hardware-Accelerated Real-Time Capture)
    // -------------------------------------------------------------
    function downloadWebM() {
        const loadingModal = document.getElementById('loadingModal');
        const loadingStatus = document.getElementById('loadingStatusText');
        const progressBarFill = document.getElementById('progressBarFill');

        // Show compile progress overlay
        loadingModal.classList.add('active');
        loadingStatus.textContent = 'Preparing video recording...';
        progressBarFill.style.width = '0%';

        isRecordingVideo = true; // Enable solid background to prevent video compression artifacts

        // Reset appearing animation so we capture the reveal sequence if reveal is selected,
        // or just capture the looping sequence in real time
        const wasPlaying = isPlaying;
        isPlaying = false;
        if (animFrameId) cancelAnimationFrame(animFrameId);

        const initialAppearProgress = appearProgress;
        const initialGlobalTime = globalTime;

        if (state.gifCaptureMode === 'reveal') {
            appearProgress = 0.0;
        }

        // Restart ticks so it draws continuously in real time
        isPlaying = true;
        lastTime = performance.now();
        animFrameId = requestAnimationFrame(tick);

        // Capture canvas stream at 30 fps
        const stream = canvas.captureStream(30);
        
        let options = { mimeType: 'video/mp4;codecs=h264' };
        let ext = 'mp4';
        let mimeType = 'video/mp4';

        if (MediaRecorder.isTypeSupported(options.mimeType)) {
            mimeType = options.mimeType;
        } else if (MediaRecorder.isTypeSupported('video/mp4')) {
            options = { mimeType: 'video/mp4' };
            mimeType = 'video/mp4';
        } else {
            ext = 'webm';
            options = { mimeType: 'video/webm;codecs=vp9' };
            mimeType = 'video/webm';
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                options = { mimeType: 'video/webm;codecs=vp8' };
                if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                    options = { mimeType: 'video/webm' };
                }
            }
            mimeType = options.mimeType;
        }

        let mediaRecorder;
        try {
            mediaRecorder = new MediaRecorder(stream, options);
        } catch (e) {
            mediaRecorder = new MediaRecorder(stream);
            ext = MediaRecorder.isTypeSupported('video/mp4') ? 'mp4' : 'webm';
            mimeType = ext === 'mp4' ? 'video/mp4' : 'video/webm';
        }

        const chunks = [];
        mediaRecorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
                chunks.push(e.data);
            }
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: mimeType });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.download = `custom_badge_${state.emoji}_${Date.now()}.${ext}`;
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
            
            isRecordingVideo = false; // Restore transparent preview
            
            // Restore playback states
            isPlaying = wasPlaying;
            if (!isPlaying) {
                if (animFrameId) cancelAnimationFrame(animFrameId);
            }
            appearProgress = initialAppearProgress;
            globalTime = initialGlobalTime;
            
            loadingModal.classList.remove('active');
        };

        const animSpeed = parseFloat(state.animationSpeed) || 1.0;
        const oneLoopDuration = 5000 / animSpeed;
        const duration = state.gifCaptureMode === 'reveal' ? 
            (1000 / animSpeed) + oneLoopDuration : 
            oneLoopDuration;
        
        // Start recording
        mediaRecorder.start();
        
        const startTime = Date.now();
        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const pct = Math.min(99, Math.floor((elapsed / duration) * 100));
            progressBarFill.style.width = `${pct}%`;
            loadingStatus.textContent = `Recording ${ext.toUpperCase()} video (${pct}%)...`;
        }, 50);

        setTimeout(() => {
            clearInterval(interval);
            progressBarFill.style.width = '100%';
            loadingStatus.textContent = 'Saving file...';
            mediaRecorder.stop();
        }, duration);
    }

    // -------------------------------------------------------------
    // 9. UI CONTROL SYNC & BINDINGS
    // -------------------------------------------------------------
    function initUIControls() {
        // Form control DOM elements
        const els = {
            shape: document.getElementById('shapeSelect'),
            cornerRadiusItem: document.getElementById('cornerRadiusItem'),
            cornerRadius: document.getElementById('cornerRadiusSlider'),
            cornerRadiusVal: document.getElementById('cornerRadiusVal'),
            borderStyle: document.getElementById('borderStyleSelect'),
            borderWidth: document.getElementById('borderWidthSlider'),
            borderWidthVal: document.getElementById('borderWidthVal'),
            borderColor: document.getElementById('borderColorPicker'),
            borderColorHex: document.getElementById('borderColorHex'),
            gloss: document.getElementById('glossToggle'),
            shadow: document.getElementById('shadowToggle'),
            fillType: document.getElementById('fillTypeSelect'),
            gradientAngleItem: document.getElementById('gradientAngleItem'),
            gradientAngle: document.getElementById('gradientAngleSlider'),
            gradientAngleVal: document.getElementById('gradientAngleVal'),
            fillColor1: document.getElementById('fillColor1Picker'),
            fillColor1Label: document.getElementById('fillColor1Label'),
            fillColor1Hex: document.getElementById('fillColor1Hex'),
            fillColor2Item: document.getElementById('fillColor2Item'),
            fillColor2: document.getElementById('fillColor2Picker'),
            fillColor2Hex: document.getElementById('fillColor2Hex'),
            emoji: document.getElementById('emojiInput'),
            emojiSize: document.getElementById('emojiSizeSlider'),
            emojiSizeVal: document.getElementById('emojiSizeVal'),
            emojiOffsetX: document.getElementById('emojiOffsetXSlider'),
            emojiOffsetXVal: document.getElementById('emojiOffsetXVal'),
            emojiOffsetY: document.getElementById('emojiOffsetYSlider'),
            emojiOffsetYVal: document.getElementById('emojiOffsetYVal'),
            emojiRotation: document.getElementById('emojiRotationSlider'),
            emojiRotationVal: document.getElementById('emojiRotationVal'),
            emojiGlowColor: document.getElementById('emojiGlowColorPicker'),
            emojiGlowColorHex: document.getElementById('emojiGlowColorHex'),
            emojiGlowBlur: document.getElementById('emojiGlowBlurSlider'),
            emojiGlowBlurVal: document.getElementById('emojiGlowBlurVal'),
            bannerText: document.getElementById('bannerTextInput'),
            bannerLayout: document.getElementById('bannerLayoutSelect'),
            bannerFont: document.getElementById('bannerFontSelect'),
            bannerColor: document.getElementById('bannerColorPicker'),
            bannerColorHex: document.getElementById('bannerColorHex'),
            bannerTextColor: document.getElementById('bannerTextColorPicker'),
            bannerTextColorHex: document.getElementById('bannerTextColorHex'),
            bannerTextSize: document.getElementById('bannerTextSizeSlider'),
            bannerTextSizeVal: document.getElementById('bannerTextSizeVal'),
            bannerOutlineColor: document.getElementById('bannerOutlineColorPicker'),
            bannerOutlineColorHex: document.getElementById('bannerOutlineColorHex'),
            appearEffect: document.getElementById('appearEffectSelect'),
            overlayEffect: document.getElementById('overlayEffectSelect'),
            fxIntensity: document.getElementById('fxIntensitySlider'),
            fxIntensityVal: document.getElementById('fxIntensityVal'),
            animationSpeed: document.getElementById('animationSpeedSlider'),
            animationSpeedVal: document.getElementById('animationSpeedVal'),
            transparentExport: document.getElementById('transparentExportToggle'),
            gifCaptureType: document.getElementById('gifCaptureTypeSelect')
        };

        // Binding: Picker and Hex Input synchronization
        function setupColorSync(pickerEl, hexEl, stateKey) {
            pickerEl.addEventListener('input', (e) => {
                hexEl.value = e.target.value.toUpperCase();
                state[stateKey] = e.target.value;
            });
            hexEl.addEventListener('change', (e) => {
                let val = e.target.value;
                if (!val.startsWith('#')) val = '#' + val;
                // Validate hex color
                if (/^#[0-9A-F]{6}$/i.test(val)) {
                    pickerEl.value = val;
                    state[stateKey] = val;
                    hexEl.value = val.toUpperCase();
                } else {
                    hexEl.value = pickerEl.value.toUpperCase();
                }
            });
        }

        setupColorSync(els.borderColor, els.borderColorHex, 'borderColor');
        setupColorSync(els.fillColor1, els.fillColor1Hex, 'fillColor1');
        setupColorSync(els.fillColor2, els.fillColor2Hex, 'fillColor2');
        setupColorSync(els.emojiGlowColor, els.emojiGlowColorHex, 'emojiGlowColor');
        setupColorSync(els.bannerColor, els.bannerColorHex, 'bannerColor');
        setupColorSync(els.bannerTextColor, els.bannerTextColorHex, 'bannerTextColor');
        
        if (els.bannerOutlineColor && els.bannerOutlineColorHex) {
            setupColorSync(els.bannerOutlineColor, els.bannerOutlineColorHex, 'bannerOutlineColor');
        }

        // Binding: Inputs state mapping & display triggers
        function bindInput(element, stateKey, event = 'input', processFn = null) {
            element.addEventListener(event, (e) => {
                let val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
                if (processFn) val = processFn(val);
                state[stateKey] = val;
                updateUIVisibilities();
            });
        }

        bindInput(els.shape, 'shape', 'change');
        bindInput(els.cornerRadius, 'cornerRadius', 'input', parseInt);
        bindInput(els.borderStyle, 'borderStyle', 'change');
        bindInput(els.borderWidth, 'borderWidth', 'input', parseInt);
        bindInput(els.gloss, 'gloss', 'change');
        bindInput(els.shadow, 'shadow', 'change');
        bindInput(els.fillType, 'fillType', 'change');
        bindInput(els.gradientAngle, 'gradientAngle', 'input', parseInt);
        bindInput(els.emoji, 'emoji', 'input');
        bindInput(els.emojiSize, 'emojiScale', 'input', (v) => parseFloat(v) / 100);
        bindInput(els.emojiOffsetX, 'emojiOffsetX', 'input', parseInt);
        bindInput(els.emojiOffsetY, 'emojiOffsetY', 'input', parseInt);
        bindInput(els.emojiRotation, 'emojiRotation', 'input', parseInt);
        bindInput(els.emojiGlowBlur, 'emojiGlowBlur', 'input', parseInt);
        bindInput(els.bannerText, 'bannerText', 'input');
        bindInput(els.bannerLayout, 'bannerLayout', 'change');
        bindInput(els.bannerFont, 'bannerFont', 'change');
        bindInput(els.bannerTextSize, 'bannerTextSize', 'input', parseInt);
        bindInput(els.appearEffect, 'appearEffect', 'change', (v) => {
            if (v !== 'none') triggerAppearReset();
            return v;
        });
        bindInput(els.overlayEffect, 'overlayEffect', 'change');
        bindInput(els.fxIntensity, 'fxIntensity', 'input', (v) => parseFloat(v) / 100);
        bindInput(els.animationSpeed, 'animationSpeed', 'input', (v) => parseFloat(v) / 10);
        bindInput(els.transparentExport, 'transparentExport', 'change');
        bindInput(els.gifCaptureType, 'gifCaptureMode', 'change');

        // Labels display updates
        els.cornerRadius.addEventListener('input', (e) => els.cornerRadiusVal.textContent = `${e.target.value}%`);
        els.borderWidth.addEventListener('input', (e) => els.borderWidthVal.textContent = `${e.target.value}px`);
        els.gradientAngle.addEventListener('input', (e) => els.gradientAngleVal.textContent = `${e.target.value}°`);
        els.emojiSize.addEventListener('input', (e) => els.emojiSizeVal.textContent = `${e.target.value}%`);
        els.emojiOffsetX.addEventListener('input', (e) => els.emojiOffsetXVal.textContent = `${e.target.value}px`);
        els.emojiOffsetY.addEventListener('input', (e) => els.emojiOffsetYVal.textContent = `${e.target.value}px`);
        els.emojiRotation.addEventListener('input', (e) => els.emojiRotationVal.textContent = `${e.target.value}°`);
        els.emojiGlowBlur.addEventListener('input', (e) => els.emojiGlowBlurVal.textContent = `${e.target.value}px`);
        els.bannerTextSize.addEventListener('input', (e) => els.bannerTextSizeVal.textContent = `${e.target.value}px`);
        els.fxIntensity.addEventListener('input', (e) => els.fxIntensityVal.textContent = `${e.target.value}%`);
        els.animationSpeed.addEventListener('input', (e) => els.animationSpeedVal.textContent = `${(e.target.value / 10).toFixed(1)}x`);

        // Dynamically hide/show subcontrols based on selected states
        function updateUIVisibilities() {
            // Corner radius only for rounded square
            if (state.shape === 'rounded-rect') {
                els.cornerRadiusItem.style.display = '';
            } else {
                els.cornerRadiusItem.style.display = 'none';
            }

            // Fill controls
            if (state.fillType === 'solid') {
                els.fillColor2Item.style.display = 'none';
                els.gradientAngleItem.style.display = 'none';
                els.fillColor1Label.textContent = 'Solid Color';
            } else if (state.fillType === 'radial') {
                els.fillColor2Item.style.display = '';
                els.gradientAngleItem.style.display = 'none';
                els.fillColor1Label.textContent = 'Inner Color';
            } else { // linear or animated
                els.fillColor2Item.style.display = '';
                els.gradientAngleItem.style.display = '';
                els.fillColor1Label.textContent = 'Primary Color';
            }
        }

        // Swatch clicks
        document.querySelectorAll('.palette-swatch').forEach(swatch => {
            swatch.addEventListener('click', () => {
                document.querySelectorAll('.palette-swatch').forEach(s => s.classList.remove('selected'));
                swatch.classList.add('selected');
                
                const colors = swatch.dataset.colors.split(',');
                if (colors.length >= 2) {
                    state.fillColor1 = colors[0];
                    state.fillColor2 = colors[1];
                    
                    els.fillColor1.value = colors[0];
                    els.fillColor1Hex.value = colors[0].toUpperCase();
                    els.fillColor2.value = colors[1];
                    els.fillColor2Hex.value = colors[1].toUpperCase();

                    // If filltype is solid, switch it to linear gradient to display the preset properly
                    if (state.fillType === 'solid') {
                        state.fillType = 'linear';
                        els.fillType.value = 'linear';
                    }
                    updateUIVisibilities();
                }
            });
        });

        // Categorized Emoji Picker
        const pickerToggleBtn = document.getElementById('emojiPickerToggleBtn');
        const pickerContainer = document.getElementById('emojiPickerContainer');
        const pickerGrid = document.getElementById('emojiPickerGrid');

        pickerToggleBtn.addEventListener('click', () => {
            const isVisible = pickerContainer.style.display !== 'none';
            pickerContainer.style.display = isVisible ? 'none' : '';
        });

        // Load grid emojis based on selected category tab
        function populatePickerTab(category) {
            pickerGrid.innerHTML = '';
            const emojis = EMOJI_CATEGORIES[category] || [];
            emojis.forEach(emo => {
                const item = document.createElement('div');
                item.className = 'emoji-item';
                item.textContent = emo;
                item.addEventListener('click', () => {
                    els.emoji.value = emo;
                    state.emoji = emo;
                    pickerContainer.style.display = 'none';
                });
                pickerGrid.appendChild(item);
            });
        }

        document.querySelectorAll('.picker-tab-btn').forEach(tabBtn => {
            tabBtn.addEventListener('click', (e) => {
                document.querySelectorAll('.picker-tab-btn').forEach(btn => btn.classList.remove('active'));
                tabBtn.classList.add('active');
                populatePickerTab(tabBtn.dataset.tab);
            });
        });

        // Load default tab
        populatePickerTab('smileys');

        // Presets quick buttons
        document.querySelectorAll('.preset-pill-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.preset-pill-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const presetKey = btn.dataset.preset;
                const config = PRESETS[presetKey];
                if (config) {
                    Object.keys(config).forEach(key => {
                        state[key] = config[key];
                    });
                    
                    // Sync state back to DOM controls
                    syncStateToUIControls();
                    triggerAppearReset();
                }
            });
        });

        // Sync local variables to DOM elements
        function syncStateToUIControls() {
            els.shape.value = state.shape;
            els.cornerRadius.value = state.cornerRadius;
            els.cornerRadiusVal.textContent = `${state.cornerRadius}%`;
            els.borderStyle.value = state.borderStyle;
            els.borderWidth.value = state.borderWidth;
            els.borderWidthVal.textContent = `${state.borderWidth}px`;
            
            els.borderColor.value = state.borderColor;
            els.borderColorHex.value = state.borderColor.toUpperCase();
            
            els.gloss.checked = state.gloss;
            els.shadow.checked = state.shadow;
            els.fillType.value = state.fillType;
            els.gradientAngle.value = state.gradientAngle;
            els.gradientAngleVal.textContent = `${state.gradientAngle}°`;
            
            els.fillColor1.value = state.fillColor1;
            els.fillColor1Hex.value = state.fillColor1.toUpperCase();
            els.fillColor2.value = state.fillColor2;
            els.fillColor2Hex.value = state.fillColor2.toUpperCase();
            
            els.emoji.value = state.emoji;
            els.emojiSize.value = Math.round(state.emojiScale * 100);
            els.emojiSizeVal.textContent = `${Math.round(state.emojiScale * 100)}%`;
            els.emojiOffsetX.value = state.emojiOffsetX;
            els.emojiOffsetXVal.textContent = `${state.emojiOffsetX}px`;
            els.emojiOffsetY.value = state.emojiOffsetY;
            els.emojiOffsetYVal.textContent = `${state.emojiOffsetY}px`;
            els.emojiRotation.value = state.emojiRotation;
            els.emojiRotationVal.textContent = `${state.emojiRotation}°`;
            
            els.emojiGlowColor.value = state.emojiGlowColor;
            els.emojiGlowColorHex.value = state.emojiGlowColor.toUpperCase();
            els.emojiGlowBlur.value = state.emojiGlowBlur;
            els.emojiGlowBlurVal.textContent = `${state.emojiGlowBlur}px`;

            els.bannerText.value = state.bannerText;
            els.bannerLayout.value = state.bannerLayout;
            els.bannerFont.value = state.bannerFont;
            
            els.bannerColor.value = state.bannerColor;
            els.bannerColorHex.value = state.bannerColor.toUpperCase();
            els.bannerTextColor.value = state.bannerTextColor;
            els.bannerTextColorHex.value = state.bannerTextColor.toUpperCase();
            els.bannerTextSize.value = state.bannerTextSize;
            els.bannerTextSizeVal.textContent = `${state.bannerTextSize}px`;

            els.appearEffect.value = state.appearEffect;
            els.overlayEffect.value = state.overlayEffect;
            els.fxIntensity.value = Math.round(state.fxIntensity * 100);
            els.fxIntensityVal.textContent = `${Math.round(state.fxIntensity * 100)}%`;
            els.animationSpeed.value = Math.round(state.animationSpeed * 10);
            els.animationSpeedVal.textContent = `${state.animationSpeed.toFixed(1)}x`;

            els.transparentExport.checked = state.transparentExport;
            els.gifCaptureType.value = state.gifCaptureMode;

            updateUIVisibilities();
        }

        // Initialize display visibility
        updateUIVisibilities();
    }

    // Playback Buttons
    function initPlaybackControls() {
        const playPauseBtn = document.getElementById('playPauseBtn');
        const playPauseIcon = document.getElementById('playPauseIcon');
        const restartBtn = document.getElementById('restartBtn');
        const toggleGridBtn = document.getElementById('toggleGridBtn');

        playPauseBtn.addEventListener('click', () => {
            isPlaying = !isPlaying;
            if (isPlaying) {
                playPauseIcon.innerHTML = '<rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect>'; // Pause bars
                playPauseBtn.title = 'Pause Animation';
            } else {
                playPauseIcon.innerHTML = '<polygon points="6 19 19 12 6 5 6 19"></polygon>'; // Play triangle
                playPauseBtn.title = 'Play Animation';
            }
        });

        restartBtn.addEventListener('click', () => {
            triggerAppearReset();
        });

        toggleGridBtn.addEventListener('click', () => {
            viewport.classList.toggle('checkerboard');
        });

        // Set default icon to pause bars (since plays on load)
        playPauseIcon.innerHTML = '<rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect>';
    }

    // -------------------------------------------------------------
    // 10. SETUP & LAUNCH
    // -------------------------------------------------------------
    function setup() {
        initUIControls();
        initPlaybackControls();

        // Bind Save Action elements
        document.getElementById('downloadPngBtn').addEventListener('click', downloadPNG);
        document.getElementById('downloadGifBtn').addEventListener('click', downloadGIF);
        document.getElementById('downloadWebmBtn').addEventListener('click', downloadWebM);

        // Turn on checkerboard pattern on initial run
        viewport.classList.add('checkerboard');

        // Start animation ticks
        lastTime = performance.now();
        animFrameId = requestAnimationFrame(tick);
    }

    // Run setup on load
    window.addEventListener('DOMContentLoaded', setup);

})();

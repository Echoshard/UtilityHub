# WebSuite Hub

A collection of high-fidelity, premium web utilities and game suites designed to run locally in any browser. Double-click the root `index.html` to launch the unified navigation panel.

---

## 🌟 Applications Included

### 1. [QR Pulse](QRCode/index.html)
A custom vector QR code generator and designer.
*   **Customization**: Select dot shapes (rounded, squares, smooth), adjust colors with linear gradients, and embed custom logos at the center.
*   **Downloads**: Export high-definition codes in SVG formats.

### 2. [MarkDowner](MarkdownViewer/index.html)
A responsive side-by-side Markdown editor and preview board.
*   **Autosave**: Automatic local drafts storage.
*   **PDF Layouts**: High-fidelity CSS page breaks print rules.
*   **Statistics**: Words/character trackers.

### 3. [Block Game Arcade Cabinet Suite](blockgame/index.html)
Retro neon cabinet console containing two classic puzzle games.
*   **Block Attack**: High-speed vertical stack-clearing action puzzle. Features horizontal block-swaps, combo match cascades, and particle explosions. Optimized clearing delays (20 frames) for lightning-fast matching.
*   **Tetris**: Grid drop engine with SRS kick offsets, ghost piece drop helpers, hold slot queues, next tetromino previews, level speeds, line clear calculations, and layout border clipping fixes. Supports both **Endless Mode** and **50-Line Sprint Mode** (with final completion time records). On-screen controls reference for both games.
*   **8-Bit Chiptune Synth**: Dual-channel oscillator loop player with dedicated mute toggles (`🎵 On` / `🔇 Off`).

### 4. [ReadAloud](TTS/index.html)
System-voice Text-to-Speech reader.
*   **Synthesizer**: Adjust reading speed, voice pitch, volumes, and choose from multiple preloaded system voices.
*   **Highlighting**: High-fidelity real-time active word focus tracking.

### 5. [RSVP Reader](rsvpreader/index.html)
Rapid Serial Visual Presentation speed-reading flash reader.
*   **Flash Display**: Shows text one or two words at a time with an Optimal Recognition Point (ORP) letter highlighted and centered on a guide line.
*   **Live Speed Control**: WPM slider adjusts pacing immediately, mid-read, with no restart required.
*   **Playback**: Play/Pause, step back/forward, restart, and a scrubbable progress bar with punctuation-aware pausing.

### 6. [Media Slideshow](mediaslideshow/index.html)
High-performance photo and video slideshow player.
*   **Media Imports**: Drag-and-drop or select local images, videos, and music into persistent browser cache.
*   **Visual Effects**: Smooth Ken Burns zoom transitions, CRT static/glitch overlays, and cover/contain image fit filters.
*   **Playlists & Resizing**: Background music player lists, local settings backup JSON file loaders, and a live preview grid thumbnail size slider (120px to 400px range).
*   **Deletions**: Always-on item deletion triggers with safety confirmation modals.

### 7. [Pixel Art Studio](pixelart/index.html)
Animation editor and pixel art painting suite.
*   **Grid Editor**: Draw, Erase, Paint Bucket, and Eyedropper tools with canvas sizes ranging from 8x8 to 64x64.
*   **Animation**: Multiple frames editor, live FPS previews, and spritsheet PNG compiling.

### 8. [AudioForge](audioforge/index.html)
Sound wave trimmer and gain effects workshop.
*   **Wave Editor**: Interactive waveform graph selector, trim bounds, fade-in/fade-out envelopes, and output gain amplifiers.
*   **Exports**: Dynamic WAV clip encoder.

### 9. [SFX Forge](sfxforge/index.html)
Procedural retro sound effect generator, bfxr-style.
*   **Presets**: Pickup/Coin, Laser/Shoot, Explosion, Powerup, Hit/Hurt, Jump, and Blip/Select archetypes, each randomizable.
*   **Synth Controls**: Square/saw/sine/triangle/noise waveforms with full envelope (attack/sustain/punch/decay), frequency slide/delta-slide, vibrato, arpeggio, duty cycle sweep, repeat/retrigger, flanger, and low-pass/high-pass filters.
*   **Tools**: Randomize, Mutate (nudge the current sound), live waveform preview, and WAV export.

### 10. [CalcSheet](calcsheet/index.html)
Matrix spreadsheet engine.
*   **Evaluation**: Range parser solver, coordinate cell math additions/multipliers (`=C2+B3*1.1`), and dynamic cell referencing.
*   **Query Spills**: SQL-style `=Query()` filters (case-insensitive column names and query function parsing) that automatically spill rows/columns into adjacent grid paths.
*   **Grid controls**: Column/row resizer handles, drag box multi-cell range selection highlights, tab-separated (TSV) copy-paste clipboard integrations (fully compatible with MS Excel/Google Sheets), Backspace/Delete keyboard range clearing, and full Undo (Ctrl+Z).
*   **Charts**: Dynamic canvas plotting module.

### 11. [3D Dice Roller](diceroller/index.html)
RPG board game 3D tray physics simulator.
*   **Physics Engine**: Platonic solids (D4, D6, D8, D12, d20) and Pentagonal Trapezohedron (D10) vector calculations. Bounces off borders with clatter-collision sounds.
*   **Layout Scale**: Defaulted to a 200% larger size with a live scale sizing slider (50% to 300%) and auto-scaling font faces.
*   **Advantage Spawning**: Side-by-side contrasting colored dice spawns with custom text-labeled total roll breakdowns.

### 12. [Chiptune Composer](chiptune/index.html)
A retro-styled multi-track loop editor and synthesizer.
*   **Step Sequencer**: Choose from 16, 32, or 64 steps grids. Loop sequences dynamically while keeping composition notes intact.
*   **Synthesizer Channels**: Draw patterns on Melody (Triangle), Lead (Square), Bass (Sawtooth), and Percussion (Noise) tracks with active channels ghost overlays.
*   **Synthesizer Envelopes**: Fine-tune Attack, Decay, Sustain, and Release parameters for each track.
*   **Keyboard Controls**: Press the **Spacebar** to toggle Play and Stop.
*   **Downloads**: Export compositions as JSON project files or compiled high-fidelity WAV loops.

### 13. [MindMapper Flowchart Workspace](mindmap/index.html)
Interactive infinite-canvas flowchart board and mind mapper.
*   **Canvas Workspace**: Support smooth pan and wheel-scroll zooming centering on mouse cursor coordinates.
*   **Dynamic Custom Shapes**: Add Pill, Rounded Rectangle, Oval, and Arrow shapes, with dynamic 360-degree rotation angles.
*   **Multi-Select Bounding Box**: Drag-select multiple nodes, drag them in unison, and edit colors or shapes in batch.
*   **Keyboard Shortcuts**: Delete selected nodes instantly by pressing the **Delete** or **Backspace** keys.
*   **Physics Solver**: Auto-arrange nodes using Verlet Spring physics solvers.
*   **Downloads**: Export diagrams as transparent background PNG images or load/save flowchart JSON configurations.

### 14. [Pomodoro Timer](pomodoro/index.html)
Focus interval timer with quick presets.
*   **Presets**: One-click 25 (Focus), 15 (Long Break), 5 (Short Break), and 60 (Deep Work) minute durations, plus a custom minutes slider.
*   **Timer**: Live countdown ring, session counter, optional auto-start of the next preset in the cycle, and WebAudio completion/tick sounds.

### 15. [Data Studio](datastudio/index.html)
JSON / YAML / XML / TOON viewer and converter.
*   **Collapsible Tree Explorer**: Parse any of the four formats into an expandable/collapsible tree, with Expand All / Collapse All controls.
*   **Conversion**: Convert freely between JSON, YAML, XML, and TOON (a compact tabular notation), with syntax-highlighted output.
*   **Tools**: Copy or download the converted output; loads a sample dataset to try immediately.

### 16. [ImageLab](imageconverter/index.html)
Offline image converter and mini editing workshop.
*   **Local Imports**: Drop or select browser-supported images without uploading anything.
*   **Canvas Editing**: Photoshop-style viewport with wheel scrolling, Ctrl-wheel zooming, Space-drag panning, visual crop, visual resize, rotate, flip, and flatten background tools.
*   **Brush Tools**: Paint brush, eraser, targeted background eraser, targeted healing brush, and magic wand selection. Brushes support size, hardness, circle/square shape, Alt color/source picking, and `[` / `]` size shortcuts.
*   **Exports**: Download edited images as PNG, JPEG, or WebP with adjustable quality.

### 17. [IconForge](icongenerator/index.html)
Offline favicon and app icon generator.
*   **Source Image**: Upload or drop one local image, then adjust fit, padding, corner radius, and background.
*   **Icon Outputs**: Generate favicon PNG sizes, Apple touch icon, Android app icons, and a multi-size `favicon.ico`.
*   **Web Assets**: Export `site.webmanifest` and ready-to-paste favicon HTML snippets.

### 18. [PasswordSmith](passwordgenerator/index.html)
Offline password, passphrase, and PIN generator.
*   **Generation Modes**: Create random passwords, readable passphrases, or numeric PINs using browser cryptographic randomness.
*   **Options**: Configure length, batch count, character sets, custom symbols, exclusions, ambiguity filtering, required sets, passphrase separators, and PIN sequence rules.
*   **Review & Export**: View entropy/strength estimates, copy individual or batch results, and export TXT or CSV files.

---

## 🚀 Getting Started

1.  **Launch via Double-click**: Simply open the root [index.html](index.html) file directly in your favorite web browser (Chrome, Edge, Firefox, or Safari).

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

### 3. [Recipes Cabinet](Recpies/index.html)
Family recipe binder and organizer designed to run completely offline.
*   **JSON Integration**: Select and load local `recipes.json` files directly from your computer, or download your edited recipes back into a local JSON bundle. Supports File System Access direct file writes where available.
*   **Editing & Categorization**: Create, update, and delete recipe cards in-browser. Fast lookup filters allow instant search by ingredients or category pills.
*   **PDF Cookbook**: Alphabetical printing setups supporting high-fidelity print breaks for physical paper binder compilations.

### 4. [Block Game Arcade Cabinet Suite](blockgame/index.html)
Retro neon cabinet console containing two classic puzzle games.
*   **Block Attack**: High-speed vertical stack-clearing action puzzle. Features horizontal block-swaps, combo match cascades, and particle explosions. Optimized clearing delays (20 frames) for lightning-fast matching.
*   **Tetris**: Grid drop engine with SRS kick offsets, ghost piece drop helpers, hold slot queues, next tetromino previews, level speeds, line clear calculations, and layout border clipping fixes. Supports both **Endless Mode** and **50-Line Sprint Mode** (with final completion time records).
*   **8-Bit Chiptune Synth**: Dual-channel oscillator loop player with dedicated mute toggles (`🎵 On` / `🔇 Off`).

### 5. [ReadAloud](TTS/index.html)
System-voice Text-to-Speech reader.
*   **Synthesizer**: Adjust reading speed, voice pitch, volumes, and choose from multiple preloaded system voices.
*   **Highlighting**: High-fidelity real-time active word focus tracking.

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

### 9. [CalcSheet](calcsheet/index.html)
Matrix spreadsheet engine.
*   **Evaluation**: Range parser solver, coordinate cell math additions/multipliers (`=C2+B3*1.1`), and dynamic cell referencing.
*   **Query Spills**: SQL-style `=Query()` filters (case-insensitive column names and query function parsing) that automatically spill rows/columns into adjacent grid paths.
*   **Grid controls**: Column/row resizer handles, drag box multi-cell range selection highlights, tab-separated (TSV) copy-paste clipboard integrations (fully compatible with MS Excel/Google Sheets), and Backspace/Delete keyboard range clearing.
*   **Charts**: Dynamic canvas plotting module.

### 10. [3D Dice Roller](diceroller/index.html)
RPG board game 3D tray physics simulator.
*   **Physics Engine**: Platonic solids (D4, D6, D8, D12, d20) and Pentagonal Trapezohedron (D10) vector calculations. Bounces off borders with clatter-collision sounds.
*   **Layout Scale**: Defaulted to a 200% larger size with a live scale sizing slider (50% to 300%) and auto-scaling font faces.
*   **Advantage Spawning**: Side-by-side contrasting colored dice spawns with custom text-labeled total roll breakdowns.

### 11. [Chiptune Composer](chiptune/index.html)
A retro-styled multi-track loop editor and synthesizer.
*   **Step Sequencer**: Choose from 16, 32, or 64 steps grids. Loop sequences dynamically while keeping composition notes intact.
*   **Synthesizer Channels**: Draw patterns on Melody (Triangle), Lead (Square), Bass (Sawtooth), and Percussion (Noise) tracks with active channels ghost overlays.
*   **Synthesizer Envelopes**: Fine-tune Attack, Decay, Sustain, and Release parameters for each track.
*   **Keyboard Controls**: Press the **Spacebar** to toggle Play and Stop.
*   **Downloads**: Export compositions as JSON project files or compiled high-fidelity WAV loops.

### 12. [MindMapper Flowchart Workspace](mindmap/index.html)
Interactive infinite-canvas flowchart board and mind mapper.
*   **Canvas Workspace**: Support smooth pan and wheel-scroll zooming centering on mouse cursor coordinates.
*   **Dynamic Custom Shapes**: Add Pill, Rounded Rectangle, Oval, and Arrow shapes, with dynamic 360-degree rotation angles.
*   **Multi-Select Bounding Box**: Drag-select multiple nodes, drag them in unison, and edit colors or shapes in batch.
*   **Keyboard Shortcuts**: Delete selected nodes instantly by pressing the **Delete** or **Backspace** keys.
*   **Physics Solver**: Auto-arrange nodes using Verlet Spring physics solvers.
*   **Downloads**: Export diagrams as transparent background PNG images or load/save flowchart JSON configurations.

### 13. [ImageLab](imageconverter/index.html)
Offline image converter and mini editing workshop.
*   **Local Imports**: Drop or select browser-supported images without uploading anything.
*   **Canvas Editing**: Photoshop-style viewport with wheel scrolling, Ctrl-wheel zooming, Space-drag panning, visual crop, visual resize, rotate, flip, and flatten background tools.
*   **Brush Tools**: Paint brush, eraser, targeted background eraser, targeted healing brush, and magic wand selection. Brushes support size, hardness, circle/square shape, Alt color/source picking, and `[` / `]` size shortcuts.
*   **Exports**: Download edited images as PNG, JPEG, or WebP with adjustable quality.

### 14. [IconForge](icongenerator/index.html)
Offline favicon and app icon generator.
*   **Source Image**: Upload or drop one local image, then adjust fit, padding, corner radius, and background.
*   **Icon Outputs**: Generate favicon PNG sizes, Apple touch icon, Android app icons, and a multi-size `favicon.ico`.
*   **Web Assets**: Export `site.webmanifest` and ready-to-paste favicon HTML snippets.

### 15. [PasswordSmith](passwordgenerator/index.html)
Offline password, passphrase, and PIN generator.
*   **Generation Modes**: Create random passwords, readable passphrases, or numeric PINs using browser cryptographic randomness.
*   **Options**: Configure length, batch count, character sets, custom symbols, exclusions, ambiguity filtering, required sets, passphrase separators, and PIN sequence rules.
*   **Review & Export**: View entropy/strength estimates, copy individual or batch results, and export TXT or CSV files.

---

## 🚀 Getting Started

1.  **Launch via Double-click**: Simply open the root [index.html](index.html) file directly in your favorite web browser (Chrome, Edge, Firefox, or Safari).

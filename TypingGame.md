# Home Row Blaster — Complete Game Plan

## 1. Project Summary

**Home Row Blaster** is an offline browser-based typing trainer and arcade game.

It combines structured typing lessons with arcade-style typing games, typing tests, and free play. The goal is to help users improve typing skill from beginner to intermediate to advanced without requiring accounts, cloud tracking, or forced progression.

The game is inspired by:

```text
Math Blaster-style educational progression
ZType-style word shooting
Typing test tools like Monkeytype
Accuracy-first typing trainers
```

The core idea:

```text
Choose Lesson → Choose Activity → Play
```

The player can follow suggested lessons or jump directly into games, typing tests, or specific practice areas at any time.

---

# 2. Design Goals

## Primary Goals

```text
Teach home row typing
Build typing speed
Build typing accuracy
Support beginner, intermediate, and advanced users
Support normal typing and programmer typing
Allow quick free play without progress tracking
Run offline in a browser
Avoid accounts, logins, or cloud storage
```

## Secondary Goals

```text
Make typing practice feel like a game
Reward accuracy more than raw speed
Let users practice specific keys or content types
Provide quick WPM testing
Support custom text practice
Keep the first version simple enough to build
```

---

# 3. Main Game Structure

The game has four major sections:

```text
1. Start Lessons
2. Free Play
3. Typing Test
4. Settings
```

## Main Menu

```text
Home Row Blaster

[Start Lessons]
[Free Play]
[Typing Test]
[Settings]
```

---

# 4. Core Player Flow

## Standard Lesson Flow

```text
Choose Lesson Category
→ Choose Specific Lesson
→ Choose Activity
→ Play
→ See Results
→ Choose another activity or lesson
```

## Free Play Flow

```text
Choose Game Mode
→ Choose Difficulty
→ Choose Word Pack or Content Type
→ Play Immediately
→ See Results
```

## Typing Test Flow

```text
Choose Test Type
→ Choose Duration
→ Type
→ See WPM and Accuracy
```

---

# 5. Progression Philosophy

The game should not force users through a locked linear path.

Do not require:

```text
User accounts
Cloud saves
Personal profiles
Mandatory progress tracking
Lesson unlock chains
Leaderboards tied to identity
```

Allowed:

```text
Current session stats
Current WPM
Current accuracy
Current errors
Current score
Optional local best score
Optional local progress on this device
Clear local data button
```

The game can recommend a path, but users should always be able to choose any lesson or game mode.

---

# 6. Lesson System

## Start Lessons Menu

When the player chooses **Start Lessons**, they see lesson categories:

```text
Home Row Lessons
Upper Row Lessons
Lower Row Lessons
Numbers Lessons
Punctuation Lessons
Normal Typing Lessons
Programmer Typing Lessons
Weak-Key Practice
Custom Lesson
```

Each lesson has:

```text
Title
Difficulty
Keys or skill focus
Sample text
Supported activities
Accuracy target
Recommended WPM target
```

---

# 7. Lesson Categories

## 7.1 Home Row Lessons

Purpose: teach the foundation of touch typing.

```text
F and J
D and K
S and L
A and ;
Full Home Row
Home Row Words
Home Row Review
```

Example drills:

```text
f j f j
ff jj fj jf
d k d k
asdf jkl;
dad sad lad fall ask
```

Difficulty:

```text
Beginner
```

---

## 7.2 Upper Row Lessons

Purpose: expand to the top letter row.

```text
E and I
R and U
T and Y
W and O
Q and P
Upper Row Words
Upper Row Review
```

Example content:

```text
red
tree
type
power
quiet
upper
write
route
```

Difficulty:

```text
Beginner to Intermediate
```

---

## 7.3 Lower Row Lessons

Purpose: complete the full alphabet.

```text
V and M
C and ,
X and .
Z and /
B and N
Lower Row Words
Lower Row Review
```

Example content:

```text
van
man
box
mix
zone
comma
bottom
vision
```

Difficulty:

```text
Beginner to Intermediate
```

---

## 7.4 Numbers Lessons

Purpose: teach number-row typing.

```text
1 and 0
2 and 9
3 and 8
4 and 7
5 and 6
Number Sequences
Numbers Review
```

Example content:

```text
123
204
1000
9876
Station 204
Part 1058
Batch 7721
```

Difficulty:

```text
Intermediate
```

---

## 7.5 Punctuation Lessons

Purpose: teach punctuation and symbol accuracy.

```text
Period and Comma
Question Mark and Slash
Quotes and Apostrophes
Colon and Semicolon
Parentheses
Brackets and Braces
Punctuation Review
```

Example content:

```text
Hello, operator.
Is the part ready?
"Quality Check"
status: ready;
[PASS]
(error_count)
```

Difficulty:

```text
Intermediate to Advanced
```

---

## 7.6 Normal Typing Lessons

Purpose: train real-world everyday typing.

```text
Common Words
Short Sentences
Capital Letters
Paragraphs
Technical Vocabulary
Manufacturing Vocabulary
AI / Machine Vision Vocabulary
```

Example content:

```text
The operator confirmed the inspection result before continuing.

Machine vision can detect defects before the part moves to the next station.

The system recorded the timestamp, station ID, and user confirmation.
```

Best for:

```text
Office work
Emails
Reports
Documentation
School work
Technical writing
Manufacturing documentation
```

Difficulty:

```text
Intermediate to Advanced
```

---

## 7.7 Programmer Typing Lessons

Purpose: train code-style typing.

```text
Python
JavaScript
HTML / CSS
JSON
Command Line
SQL
VB.NET
C-Style Syntax
```

Example content:

```text
if error_count > 0:
    return False

const stationId = "LG-204";

function checkQuality(partId) {
    return partId !== null;
}

SELECT part_id, status FROM inspections WHERE status = 'PASS';
```

Best for:

```text
Coding
Scripting
Command-line use
Configuration files
JSON
Syntax-heavy typing
Symbol accuracy
```

Difficulty:

```text
Advanced
```

---

## 7.8 Weak-Key Practice

Purpose: let users practice problem keys.

Since the game does not require progress tracking, weak-key practice can work in two ways:

```text
1. Session-based weak keys
2. Manual weak-key selection
```

Session-based weak keys:

```text
The game remembers missed keys during the current session only.
```

Manual weak-key selection:

```text
The user chooses keys they want to practice.
```

Example:

```text
Practice keys: D, K, E, R, ;
```

---

## 7.9 Custom Lesson

Purpose: allow user-defined practice.

Options:

```text
Paste custom text
Paste custom word list
Choose letters to include
Choose lesson difficulty
Choose activity type
```

Best for:

```text
Company vocabulary
Classroom vocabulary
Programming snippets
Manufacturing terms
Technical documentation
Personal practice
```

---

# 8. Choose Activity System

After selecting a lesson, the player chooses an activity.

```text
Training Drill
Astro Type Blaster
Cargo Sorter
Rhythm Keys
Typing Test
```

Example:

```text
Selected Lesson: F and J

Choose Activity:
1. Training Drill
2. Astro Type Blaster
3. Cargo Sorter
4. Rhythm Keys
5. Typing Test
```

This makes lesson content reusable across all modes.

---

# 9. Game Mode 1 — Training Drill

## Name

**Home Row Academy**

## Purpose

Teach correct finger placement, key recognition, and typing control.

This is the slowest and most instructional mode.

## Features

```text
On-screen keyboard
Highlighted next key
Highlighted finger guide
Correct/incorrect character feedback
Short drills
No timer for early beginner lessons
Accuracy requirement shown
End-of-drill result screen
```

## Beginner Example

```text
Mission: Engine Calibration
Keys: F and J

Type:
f j f j
ff jj fj jf
j f j f
fj jf ff jj
```

## Scoring

Training Drill should not focus heavily on score.

It should show:

```text
Accuracy
Errors
Correct characters
Incorrect characters
Backspaces
Optional WPM
```

## Suggested Accuracy Targets

```text
Beginner: 95%
Intermediate: 96%
Advanced: 97%
```

---

# 10. Game Mode 2 — Speed Game

## Name

**Astro Type Blaster**

## Purpose

Train speed, reaction time, and word recognition.

This is the ZType-style shooting game.

## Gameplay

Words, letters, or phrases fly toward the player’s ship. The player destroys targets by typing them correctly.

## Beginner Targets

```text
f
j
d
k
s
l
a
;
```

## Intermediate Targets

```text
dad
fall
safe
jazz
desk
lead
flash
ask
```

## Advanced Normal Targets

```text
quality
inspection
machine vision
operator confirmation
station status
production result
```

## Advanced Programmer Targets

```text
function
return true;
error_count
if status == "PASS":
const stationId = "LG-204";
```

## Scoring

```text
+100 points per destroyed target
+Combo bonus for clean streaks
+Speed bonus for quick completion
+Accuracy bonus
-50 points per typo
Lose health if target reaches the bottom
```

## Scoring Rule

Accuracy should be weighted heavily.

Recommended formula:

```text
Final Score = base score + combo bonus + speed bonus + accuracy bonus - mistake penalty
```

Do not reward frantic typing if accuracy is poor.

---

# 11. Game Mode 3 — Accuracy Game

## Name

**Cargo Sorter**

## Purpose

Train careful, exact typing.

This mode balances the speed game by rewarding accuracy over speed.

## Gameplay

Cargo crates move across a conveyor. Each crate has text on it. The player must type the text exactly to send the crate to the correct destination.

Mistakes jam the conveyor.

## Beginner Crates

```text
f
j
fj
jf
ff
jj
asdf
jkl;
```

## Intermediate Crates

```text
desk
safe
fall
lead
jokes
flash
Status Ready
```

## Advanced Normal Crates

```text
Quality Check
Station ID: 204
The operator confirmed the inspection result.
Machine vision detected a missing fastener.
```

## Advanced Programmer Crates

```text
if error_count > 0:
    return False

const stationId = "LG-204";

{
  "status": "PASS",
  "station": 204
}
```

## Scoring

Accuracy is the main score.

```text
Gold: 99–100%
Silver: 96–98%
Bronze: 92–95%
Retry: below 92%
```

## Penalties

```text
Typo: crate jam
Backspace: small penalty
Wrong capitalization: accuracy penalty
Wrong punctuation: accuracy penalty
Wrong spacing: accuracy penalty
Wrong indentation: accuracy penalty in Programmer Mode
```

---

# 12. Game Mode 4 — Rhythm Game

## Name

**Rhythm Keys**

## Purpose

Train typing rhythm, consistency, and smooth hand movement.

This is the third arcade-style game and can be built after the MVP.

## Gameplay

Letters, words, or phrases move toward a timing line. The player types them as they cross the line.

## Skills Trained

```text
Consistent typing pace
Smooth hand movement
Reduced hesitation
Timing
Typing rhythm
Accuracy under light pressure
```

## Beginner Version

```text
Single letters appear in rhythm:
f
j
d
k
```

## Intermediate Version

```text
Short words:
dad
safe
fall
desk
```

## Advanced Version

```text
Sentences, punctuation, and code snippets
```

## Scoring

```text
Perfect timing
Good timing
Late
Miss
Accuracy percentage
Combo streak
```

## Build Priority

Rhythm Keys is not required for the first MVP.

It should be added after:

```text
Training Drill
Astro Type Blaster
Cargo Sorter
Typing Test
```

---

# 13. Typing Test Mode

## Purpose

Typing Test gives users a quick WPM and accuracy score.

It is separate from lessons and arcade games.

## Main Test Types

```text
Normal Words
Programming
Custom Text
```

## Typing Test Menu

```text
Typing Test

[Normal Words]
[Programming]
[Custom Text]
```

---

## 13.1 Normal Words Test

Purpose: measure general typing speed.

Content:

```text
Common words
Sentences
Paragraphs
Office-style text
Technical writing
Manufacturing terms
AI / machine vision terms
```

Example:

```text
The system records each inspection result and displays the next instruction for the operator.
```

Best for:

```text
General typing
Office work
Documentation
Emails
Reports
Everyday computer use
```

---

## 13.2 Programming Test

Purpose: measure code-style typing speed and accuracy.

Content:

```text
Symbols
Brackets
Parentheses
Quotes
Indentation
Variable names
Short code snippets
JSON
Command-line text
```

Example:

```text
if error_count > 0:
    return False
```

Best for:

```text
Programmers
Scripting
Command-line users
Configuration files
Code accuracy
Symbol practice
```

---

## 13.3 Custom Text Test

Purpose: let the user paste any text.

Content options:

```text
User-pasted text
Custom word lists
Workplace terms
Code snippets
Training phrases
```

Best for:

```text
Practicing specific vocabulary
Practicing real work text
Practicing copied code
Practicing repeated phrases
```

---

## 13.4 Test Length Options

```text
15 seconds
30 seconds
60 seconds
2 minutes
5 minutes
Custom duration
```

Default:

```text
60 seconds
```

---

## 13.5 Difficulty Options

```text
Beginner
Intermediate
Advanced
Custom
```

Beginner:

```text
Short words
Simple sentences
Low punctuation
No complex symbols
```

Intermediate:

```text
Mixed words
Full sentences
Capital letters
Common punctuation
```

Advanced:

```text
Longer text
Numbers
Symbols
Punctuation
Technical vocabulary
Code snippets
```

---

## 13.6 WPM Calculation

Use standard corrected WPM.

```text
WPM = correct characters / 5 / minutes
```

Optional raw WPM:

```text
Raw WPM = total typed characters / 5 / minutes
```

Recommended display:

```text
WPM: corrected WPM
Raw WPM: optional
Accuracy: percent correct
```

Corrected WPM is preferred because it does not reward sloppy typing.

---

## 13.7 Typing Test Results Screen

At the end of the test, show:

```text
WPM
Raw WPM
Accuracy
Errors
Correct characters
Incorrect characters
Most missed keys
Test type
Test duration
```

Example:

```text
Typing Test Complete

Mode: Normal Words
Time: 60 seconds

WPM: 48
Raw WPM: 52
Accuracy: 96%
Errors: 12
Most Missed Keys: E, R, ;
```

---

# 14. Free Play Mode

## Purpose

Free Play lets users play any activity immediately without lessons or progress tracking.

## Free Play Menu

```text
Free Play

[Home Row Academy]
[Astro Type Blaster]
[Cargo Sorter]
[Rhythm Keys]
[Normal Typing Practice]
[Programmer Typing Practice]
[Custom Text Practice]
[Typing Test]
```

## Free Play Rules

```text
No lesson unlock required
No account required
No required progress tracking
No forced curriculum
Player chooses mode
Player chooses difficulty
Player plays immediately
```

## Free Play Setup Options

```text
Game mode
Difficulty
Content type
Duration
Target speed
Target accuracy
Word pack
Custom text
```

---

# 15. Advanced Mode

Advanced Mode should be split into two paths:

```text
1. Advanced Normal Typing
2. Advanced Programmer Typing
```

---

## 15.1 Advanced Normal Typing

Purpose: train real-world typing for business, documentation, and technical writing.

Content:

```text
Full sentences
Paragraphs
Capital letters
Punctuation
Numbers
Quotes
Apostrophes
Common business words
Technical vocabulary
Manufacturing vocabulary
AI / machine vision vocabulary
```

Example challenges:

```text
The operator confirmed the inspection result before continuing.

Machine vision can detect defects before the part moves to the next station.

The system recorded the timestamp, station ID, and user confirmation.
```

Skills trained:

```text
Reading ahead
Sentence flow
Capitalization
Punctuation accuracy
Sustained typing
Consistent speed
Low error rate
```

---

## 15.2 Advanced Programmer Typing

Purpose: train typing for code, scripts, and configuration files.

Content:

```text
Parentheses
Brackets
Braces
Quotes
Colons
Semicolons
Equals signs
Underscores
Camel case
Snake case
Indentation
Short code snippets
```

Example challenges:

```text
if error_count > 0:
    return False

const stationId = "LG-204";

function checkQuality(partId) {
    return partId !== null;
}
```

Skills trained:

```text
Symbol accuracy
Code punctuation
Case sensitivity
Indentation control
Exact copying
Special characters
Programmer typing rhythm
```

Programmer word packs:

```text
Python
JavaScript
HTML / CSS
JSON
Command Line
SQL
VB.NET
C-Style Syntax
```

---

# 16. Difficulty System

## Beginner

Focus:

```text
Home row
Finger placement
Key recognition
Accuracy before speed
No looking at keyboard
```

Target:

```text
10–25 WPM
95% accuracy
```

Modes:

```text
Home Row Academy
Slow Astro Type Blaster
Simple Cargo Sorter
Typing Test with simple words
```

---

## Intermediate

Focus:

```text
Full alphabet
Common words
Common letter patterns
Capital letters
Basic punctuation
Short sentences
```

Target:

```text
25–50 WPM
96% accuracy
```

Modes:

```text
Guided drills
Word-based Astro Type Blaster
Cargo Sorter with words and short sentences
Typing Test with normal sentences
```

---

## Advanced

Focus:

```text
Long words
Full sentences
Numbers
Symbols
Punctuation
Code
Workplace vocabulary
Custom word packs
```

Target:

```text
50–80+ WPM
97% accuracy
```

Modes:

```text
Timed drills
Fast Astro Type Blaster
Advanced Cargo Sorter
Rhythm Keys
Normal Typing Test
Programming Typing Test
Custom text challenges
```

---

# 17. Stats and Results

The game should show useful stats without requiring long-term tracking.

## Session Stats

```text
WPM
Raw WPM
Accuracy
Errors
Backspaces
Correct characters
Incorrect characters
Best streak
Current score
Most missed keys
Session duration
```

## Game-Specific Stats

Astro Type Blaster:

```text
Score
Targets destroyed
Targets missed
Health remaining
Combo streak
Accuracy
WPM
```

Cargo Sorter:

```text
Grade
Crates sorted
Crates jammed
Accuracy
Errors
Backspaces
Exact-match score
```

Rhythm Keys:

```text
Perfect hits
Good hits
Late hits
Misses
Combo
Accuracy
Timing consistency
```

Typing Test:

```text
WPM
Raw WPM
Accuracy
Errors
Correct characters
Incorrect characters
Most missed keys
Test duration
```

---

# 18. Optional Local Saving

Default behavior should not require saving.

Optional local-only saving can include:

```text
Save best scores on this device
Save selected settings
Save preferred difficulty
Save optional lesson completion
Clear all local data
Export local stats
```

Settings should include:

```text
Enable local save: On / Off
Clear local data
Export results
```

No cloud syncing is needed.

---

# 19. Rewards

Rewards should be cosmetic and session-based or local-only.

## Reward Types

```text
Ship skins
Laser styles
Cargo station themes
Robot helper cosmetics
Mission badges
Accuracy medals
Speed medals
Perfect-run badges
```

## Badge Examples

```text
Home Row Hero — completed a home row lesson
Perfect Cargo Run — 100% accuracy in Cargo Sorter
Speed Cadet — reached 40 WPM
No Backspace — completed a mission without backspace
Steady Hands — completed a session above 97% accuracy
Blaster Ace — survived Astro Type Blaster with 95% accuracy
Code Cadet — completed a programming typing test
```

## Reward Rule

Do not reward only speed.

Reward:

```text
Accuracy
Consistency
Clean typing
No-backspace runs
Completing lessons
Completing tests
Improving weak keys
```

---

# 20. Content Packs

## Built-In Word Packs

```text
Home Row
Common English
Beginner Words
Intermediate Words
Advanced Words
Office Typing
Manufacturing
AI / Machine Vision
Numbers
Punctuation
Programming
Command Line
JSON
Python
JavaScript
HTML / CSS
SQL
VB.NET
Custom
```

## Content Pack Structure

Each pack should define:

```text
Name
Difficulty
Mode compatibility
Words
Sentences
Phrases
Code snippets
Symbols
```

Example:

```json
{
  "name": "Programming - Python",
  "difficulty": "Advanced",
  "items": [
    "if error_count > 0:",
    "return False",
    "for item in results:",
    "print(\"Complete\")"
  ]
}
```

---

# 21. Privacy and Data Rules

The game should be local-first and privacy-friendly.

## Do Not Include

```text
Accounts
Login
Cloud storage
Online leaderboards
Analytics tracking
Personal profiles
Required progress tracking
Cross-device sync
```

## Acceptable

```text
Temporary session stats
Optional local save
Optional local high scores
Optional exported results
Clear local data
```

## Default Behavior

```text
Run offline
Do not upload anything
Do not require identity
Do not save long-term history unless enabled
```

---

# 22. Visual Style

## Recommended Theme

```text
Retro space academy
Arcade sci-fi
Bright but readable UI
Simple vector graphics
Large text
High contrast
Clear keyboard visuals
```

## Tone

```text
Educational
Arcade-like
Skill-focused
Not too childish
Simple and direct
```

## UI Requirements

```text
Readable fonts
Large text
High contrast
Color-blind safe indicators
Keyboard-friendly navigation
Clear feedback for correct and incorrect input
Pause button
Mute button
Restart button
```

---

# 23. Screen Layouts

## 23.1 Main Menu

```text
Home Row Blaster

Start Lessons
Free Play
Typing Test
Settings
```

---

## 23.2 Lesson Category Screen

```text
Choose Lesson Category

Home Row Lessons
Upper Row Lessons
Lower Row Lessons
Numbers Lessons
Punctuation Lessons
Normal Typing Lessons
Programmer Typing Lessons
Weak-Key Practice
Custom Lesson
```

---

## 23.3 Lesson Selection Screen

```text
Home Row Lessons

F and J — Beginner
D and K — Beginner
S and L — Beginner
A and ; — Beginner
Full Home Row — Beginner
Home Row Words — Beginner
Home Row Review — Beginner
```

---

## 23.4 Activity Selection Screen

```text
Selected Lesson: F and J

Choose Activity:

Training Drill
Astro Type Blaster
Cargo Sorter
Rhythm Keys
Typing Test
```

---

## 23.5 Training Drill Screen

```text
Top: Mission title
Center: Text to type
Below: Player input
Bottom: On-screen keyboard
Side panel: WPM, accuracy, errors
```

---

## 23.6 Astro Type Blaster Screen

```text
Top: Score, health, combo
Center: Falling words / enemies
Bottom: Player ship and typed input
Side panel: accuracy and WPM
```

---

## 23.7 Cargo Sorter Screen

```text
Top: Accuracy grade
Center: Conveyor belt with crates
Bottom: Player input
Side panel: jams, streak, grade
```

---

## 23.8 Rhythm Keys Screen

```text
Top: Combo and timing score
Center: Timing lane
Bottom: Typed input
Side panel: perfect, good, late, miss
```

---

## 23.9 Typing Test Screen

```text
Top: Timer
Center: Test text
Below: Player input
Side panel: WPM, accuracy, errors
```

---

## 23.10 Results Screen

```text
Session Complete

Mode:
Difficulty:
WPM:
Raw WPM:
Accuracy:
Errors:
Score:
Grade:
Most missed keys:

[Try Again]
[Choose Another Activity]
[Main Menu]
```

---

# 24. Recommended Tech Stack

For UtilityHub, build as an offline web tool.

```text
HTML
CSS
Vanilla JavaScript
JSON files
LocalStorage or IndexedDB for optional local save
```

No backend is required.

## Reasons

```text
Easy to host
Easy to run offline
Works in browser
No install required
No user accounts required
Simple to package in UtilityHub
```

---

# 25. Suggested Folder Structure

```text
home-row-blaster/
  index.html
  style.css
  app.js

  data/
    lessons.json
    wordpacks.json
    achievements.json
    settings.json

  js/
    storage.js
    stats.js
    lessons.js
    typingEngine.js
    trainingMode.js
    astroBlaster.js
    cargoSorter.js
    rhythmKeys.js
    typingTest.js
    weakKeys.js
    ui.js
```

---

# 26. Core Technical Systems

## 26.1 Typing Engine

Handles:

```text
Current text
Player input
Correct characters
Incorrect characters
Backspaces
Cursor position
WPM
Raw WPM
Accuracy
Errors
Completion state
```

This should be shared by:

```text
Training Drill
Cargo Sorter
Rhythm Keys
Typing Test
```

---

## 26.2 Game Loop

Used by arcade modes.

Handles:

```text
Animation frames
Spawning targets
Moving targets
Collisions
Timers
Health
Score
Pause/resume
Restart
```

---

## 26.3 Lesson Loader

Handles:

```text
Load lesson JSON
Display categories
Display lessons
Provide lesson text to each activity
```

---

## 26.4 Word Pack Loader

Handles:

```text
Load word packs
Filter by difficulty
Filter by mode
Pick random words
Pick random phrases
Pick code snippets
```

---

## 26.5 Stats System

Handles:

```text
Calculate WPM
Calculate raw WPM
Calculate accuracy
Track errors
Track weak keys
Generate result summary
```

---

## 26.6 Optional Storage System

Handles:

```text
Save settings locally
Save optional best scores locally
Clear local data
Export local stats
```

---

# 27. MVP Scope

The first playable version should be small but useful.

## MVP Must Include

```text
Main menu
Start Lessons
Free Play
Typing Test
Settings
Home Row lesson category
Home Row Academy / Training Drill
Astro Type Blaster
Cargo Sorter
Normal Words Typing Test
Programming Typing Test
60-second WPM test
Session stats
No required accounts
No required progress tracking
```

## MVP Lessons

```text
F and J
D and K
S and L
A and ;
Full Home Row
Home Row Words
Home Row Review
```

## MVP Typing Test

```text
Normal Words
Programming
Custom Text optional
30-second and 60-second options
WPM
Raw WPM
Accuracy
Errors
```

## MVP Free Play

```text
Astro Type Blaster
Cargo Sorter
Typing Test
Training Drill
```

## Do Not Include in MVP

```text
Cloud saves
Accounts
Leaderboards
Multiplayer
Rhythm Keys
Complex story mode
Full keyboard curriculum
Advanced cosmetics
Large achievement system
```

---

# 28. Build Phases

## Phase 1 — Basic Typing Engine

Build:

```text
Text display
Player input
Correct/incorrect character tracking
WPM calculation
Accuracy calculation
Results screen
```

Deliverable:

```text
A basic typing test works.
```

---

## Phase 2 — Menus and Data

Build:

```text
Main menu
Lesson category menu
Lesson selection menu
Activity selection menu
Load lessons from JSON
Load word packs from JSON
```

Deliverable:

```text
User can choose a lesson and activity.
```

---

## Phase 3 — Home Row Academy

Build:

```text
Training Drill mode
On-screen keyboard
Highlighted next key
Home row lessons
Finger/key guidance
Session result screen
```

Deliverable:

```text
User can practice home row lessons.
```

---

## Phase 4 — Typing Test

Build:

```text
Normal Words test
Programming test
Timer
WPM
Raw WPM
Accuracy
Errors
Results screen
```

Deliverable:

```text
User can take a WPM test for normal typing or programming.
```

---

## Phase 5 — Astro Type Blaster

Build:

```text
Falling targets
Target matching
Ship / laser animation
Health system
Score system
Combo system
Increasing speed
Accuracy penalty
```

Deliverable:

```text
User can play a ZType-style speed game.
```

---

## Phase 6 — Cargo Sorter

Build:

```text
Conveyor belt
Crates with text
Exact-match typing
Jam system
Accuracy grading
Gold / Silver / Bronze results
```

Deliverable:

```text
User can play an accuracy-focused typing game.
```

---

## Phase 7 — Free Play

Build:

```text
Free Play menu
Choose mode
Choose difficulty
Choose word pack
Play immediately
No unlock requirement
```

Deliverable:

```text
User can play any mode anytime.
```

---

## Phase 8 — Optional Local Save

Build:

```text
Save settings locally
Save optional best scores
Clear local data
Optional local progress
```

Deliverable:

```text
User can optionally save local results without accounts.
```

---

## Phase 9 — Full Keyboard Content

Build:

```text
Upper row lessons
Lower row lessons
Numbers lessons
Punctuation lessons
Normal typing lessons
Programmer typing lessons
More word packs
```

Deliverable:

```text
Game supports beginner through advanced typing practice.
```

---

## Phase 10 — Rhythm Keys

Build:

```text
Timing lane
Rhythm-based targets
Timing feedback
Combo system
Accuracy and timing score
```

Deliverable:

```text
User can practice typing rhythm and consistency.
```

---

# 29. Recommended First Version

The best first version is:

```text
Home Row Blaster MVP
```

## Includes

```text
Main menu
Selectable home row lessons
Training Drill
Astro Type Blaster
Cargo Sorter
Typing Test
Free Play
Normal Words WPM test
Programming WPM test
Session stats
Settings
No accounts
No required tracking
```

## Lesson Content

```text
F and J
D and K
S and L
A and ;
Full Home Row
Home Row Words
Home Row Review
```

## Game Content

```text
Letters
Home row words
Basic normal words
Basic programming snippets
```

---

# 30. Final Feature List

## Core Features

```text
Offline browser game
Selectable lessons
Training drills
Speed game
Accuracy game
Typing test
Free play
Normal typing mode
Programmer typing mode
Custom text support
Session stats
Optional local save
```

## Game Modes

```text
Home Row Academy
Astro Type Blaster
Cargo Sorter
Rhythm Keys
Typing Test
```

## Typing Test Types

```text
Normal Words
Programming
Custom Text
```

## Lesson Categories

```text
Home Row
Upper Row
Lower Row
Numbers
Punctuation
Normal Typing
Programmer Typing
Weak-Key Practice
Custom Lesson
```

## Stats

```text
WPM
Raw WPM
Accuracy
Errors
Backspaces
Score
Grade
Most missed keys
Correct characters
Incorrect characters
```

## Privacy

```text
No accounts
No cloud saves
No required tracking
No identity
Optional local-only save
Clear local data
```

---

# 31. Final Design Summary

**Home Row Blaster** should be built around this structure:

```text
Choose Lesson → Choose Activity → Play
```

The major sections are:

```text
Start Lessons
Free Play
Typing Test
Settings
```

The main modes are:

```text
Home Row Academy teaches typing.
Astro Type Blaster trains speed.
Cargo Sorter trains accuracy.
Rhythm Keys trains consistency.
Typing Test measures WPM.
```

Advanced practice is split into:

```text
Normal Typing
Programmer Typing
```

The game should be useful without accounts or saved progress. Users can follow suggested lessons, jump into any lesson, play arcade modes freely, or take a quick WPM test.

The first MVP should focus on home row, free play, WPM testing, and the two core arcade games: Astro Type Blaster and Cargo Sorter.

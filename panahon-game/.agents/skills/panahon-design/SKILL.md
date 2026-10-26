---
name: panahon-design
description: >-
  Design system, color palette, typography, and theming guide for PANAHON:
  Chrono Shift. Use this skill whenever creating, editing, or styling any
  UI component, screen, modal, or CSS for the PANAHON game project.
---

# PANAHON: Chrono Shift — Design & Theme Guide

## Core Aesthetic

PANAHON is a dark, atmospheric, historical-fantasy board game. The UI must feel:
- Ancient yet futuristic - like a time-traveler war room
- Immersive and cinematic - dramatic lighting, glowing accents, deep darks
- Premium and polished - glassmorphism panels, smooth transitions, rich typography

Never create plain, flat, or generic-looking UI. Every element must breathe the game tension and time-travel lore.

---

## Color Palette

### Base UI Colors
| Token | Value | Usage |
|---|---|---|
| --bg-dark | #0A0A12 | Root page background |
| --bg-panel | rgba(15,15,25,0.92) | Side panels, sidebars |
| --bg-card | rgba(20,20,35,0.95) | Cards, modals |
| --bg-glass | rgba(255,255,255,0.05) | Glassmorphism surfaces |
| --border-glass | rgba(255,255,255,0.1) | Subtle panel borders |
| --text-primary | #E8E4DC | Main body text (warm off-white) |
| --text-secondary | #A09888 | Labels, metadata, hints |
| --text-accent | #E8C547 | Highlights, headings, gold tones |
| --text-danger | #E74C3C | Errors, danger tiles |
| --text-success | #2ECC71 | Success, safe tiles |
| --energy-color | #00B4D8 | Player energy bar |

### Era-Specific Color Themes
Each of the 4 historical eras has its own palette:

| Era | Primary | Accent | Background Gradient |
|---|---|---|---|
| Spanish Colonial | #8B1A1A | #E8C547 | linear-gradient(135deg, #2D1010, #5C1A1A, #3D1515) |
| American Period | #1A3A5C | #4A90D9 | linear-gradient(135deg, #0D1B2A, #1B2838, #162234) |
| Japanese Occupation | #2D5016 | #6DBF4E | linear-gradient(135deg, #1A2F0E, #2D4A18, #1E3512) |
| Mythological | #4A1A6B | #B44ADE | linear-gradient(135deg, #1A0D2E, #2D1845, #221338) |

Era keys in code: spanish, american, japanese, myth

### Tile Type Colors
| Tile | Color |
|---|---|
| Clue | #3498DB |
| Event | #F1C40F |
| Danger | #E74C3C |
| Artifact | #9B59B6 |
| Time Gate | #00E5FF |
| Start | #2ECC71 |

---

## Typography

- --font-display: 'Cinzel', serif  =>  Titles, turn banners, era headers, player names
- --font-body: 'Inter', sans-serif  =>  Body text, labels, log entries, descriptions
- --font-pirate: 'Pirata One', cursive  =>  Decorative / flavor text only

Never use browser default fonts. Always reference the CSS variable tokens.

---

## Spacing & Radius System

- --space-xs:4px  --space-sm:8px  --space-md:16px  --space-lg:24px  --space-xl:32px  --space-2xl:48px
- --radius-sm:4px  --radius-md:8px  --radius-lg:12px  --radius-xl:16px

---

## Effects & Animations

### Glassmorphism Panels
background: var(--bg-panel);
border: 1px solid var(--border-glass);
backdrop-filter: blur(12px);
box-shadow: var(--shadow-md);

### Glow Effects
- Era glow vars: --spanish-glow, --american-glow, --japanese-glow, --myth-glow
- Gold accent glow: --shadow-glow
- Energy glow: --energy-glow

### Key Animations (CSS only)
- pawnHop: Moving player token bounce
- modalPop: Modal entrance with cubic-bezier spring
- pulse-glow: Timeline meter warnings
- timerFill: Auto-dismiss timer bars in side-card overlays
- ai-pulse-dot: Glowing dot for AI thinking state

All transitions use: --transition-fast (150ms), --transition-normal (300ms), --transition-slow (500ms)

---

## Component Design Patterns

### Panels / Sidebars
- Background: var(--bg-panel) with border: 1px solid var(--border-glass)
- Player sections: border-left: 3px solid <player.color>
- CSS classes: panel-section, panel-section-title

### Buttons
- btn btn-primary: Main game actions (Roll Dice, End Turn, Launch)
- btn btn-secondary: Secondary choices
- btn btn-accent: Special abilities, momentum actions
- action-btn: Icon+label ability buttons in right panel
- All buttons must have hover glow and slight lift: transform translateY(-1px)

### Modals
- Overlay: modal-overlay class (dark semi-transparent backdrop)
- Container: modal class with modalPop animation on open
- Always include a close X button
- Title color by context: danger=red, event=yellow, artifact=purple, clue=blue, neutral=gold accent

### Cards
- Use card-display class for card previews
- Era badge + card title in accent + description in muted text
- Danger cards: red border + dice roll result section

### Badges & Tags
- bot-badge: dark blue, for AI turns
- human-badge: teal, for human turns
- Small rounded pills for era names and card types

---

## Design Rules — Always Follow

1. Never use plain colors. Always use CSS variable tokens.
2. Dark-first. All backgrounds must be dark.
3. Era-aware theming. Apply era gradient/accent when showing era-specific content.
4. Glassmorphism for all panels and overlays. No solid opaque boxes.
5. Micro-animations are mandatory. Hover states, entrance animations, pulse effects.
6. Responsive typography. Use rem/em for font sizes, never px for font.
7. Player colors are dynamic from player.color property (PLAYER_COLORS array).
8. Log entries use log-entry class with [TYPE] prefix in muted color.
9. Icons-first approach. Use emoji icons for quick visual scannability (e.g. 🎲 ⏪ 💤 ✨ 📦 ⏭️).

---

## Key Source Files

- src/style.css — All CSS tokens, animations, utility classes
- src/gameData.js — PLAYER_COLORS, ERA_NAMES, TILE_TYPES constants
- src/components/GameScreen.jsx — Main game layout (header + 4 panels)
- src/components/Modals.jsx — CardModal, ChoiceModal, MaximizedCardPreview
- src/components/game/GameActions.jsx — Right panel: dice, actions, log
- src/components/game/GameBoard.jsx — Center board with era quadrants

# Quiet Core Design Guide

Quiet Core should feel like a calm Apple-native Sudoku utility. The board is the product. Everything else supports solving.

## Product Feel

- Calm, precise, fast, and quiet.
- No landing page, hero section, decorative blobs, card grids, or marketing copy.
- No confetti. Completion should feel like a soft exhale.
- Visual feedback should help the player think, not perform for them.

## Screen Hierarchy

```text
Quiet Core main screen
  ├── Header: title, difficulty, timer, mistakes left
  ├── Tools: undo, notes, mute
  ├── Board: 9x9 grid, primary focus
  ├── Keypad: digits 1-9
  └── Secondary feedback: sound/animation/completion notes
```

Priority:

1. Board
2. Selected cell and related highlights
3. Number keypad
4. Timer and mistakes
5. Undo, Notes, Mute
6. Completion feedback

## Visual Tokens

Use CSS variables for all durable choices.

```css
:root {
  --color-bg: #f7f7f5;
  --color-surface: #ffffff;
  --color-ink: #20242b;
  --color-muted: #68707a;
  --color-line: #c7ccd2;
  --color-grid-strong: #2c3138;
  --color-given: #eef0f2;
  --color-selected: #dce9f8;
  --color-related: #eef4fb;
  --color-same-number: #1e66a8;
  --color-mistake-bg: #f7dfdf;
  --color-mistake-text: #b42318;

  --radius-control: 8px;
  --duration-fast: 120ms;
  --duration-feedback: 160ms;
  --duration-complete: 700ms;
}
```

## Board Rules

- Board must be square with `aspect-ratio: 1 / 1`.
- Desktop/tablet board width: `min(100%, 430px)`.
- Mobile page padding: 16px.
- 3x3 grid boundaries are stronger than cell lines.
- Given cells are subtly gray and bolder.
- Selected cell uses pale blue fill and a visible 2px outline.
- Related row, column, and box use a softer blue wash.
- Mistakes use soft red background and red text.
- Mistake feedback must not rely on color alone.

## Controls

- Keypad is 9 equal columns.
- Keypad buttons are at least 40px tall on narrow mobile and 44px where space permits.
- Undo, Notes, and Mute must have visible disabled or pressed states.
- Notes and Mute need accessible pressed state labels.
- Controls should not look like decorative cards.

## Motion And Sound

- Select/place feedback: 120-160ms.
- Completion: one board-level breath under 1 second.
- Sound is optional and must have mute from day one.
- If audio fails or is blocked by the browser, visual feedback still works.
- No heavy animation library in v1.

## Responsive Behavior

- At 375-390px width, the board remains full-width.
- Header may wrap, but tools must not overlap the title or metadata.
- Mobile metadata should use short copy: `Easy · 04:18 · 3 left`.
- Secondary explanatory text stacks below the keypad on mobile.

## Accessibility

- Body text contrast must be at least 4.5:1.
- Cells and controls need visible focus outlines.
- Arrow keys move board selection.
- Number keys 1-9 enter values.
- Notes mode and mute state must be screen-reader-visible.
- Board cells should expose useful labels, for example: `Row 2 column 3, notes 1 3 5 8`.

## Approved Visual Reference

- Desktop: `/Users/mingyuoh/.gstack/projects/sudoku/designs/quiet-core-20260612-100051/quiet-core-wireframe-desktop.png`
- Mobile: `/Users/mingyuoh/.gstack/projects/sudoku/designs/quiet-core-20260612-100051/quiet-core-wireframe-mobile.png`
- HTML: `/Users/mingyuoh/.gstack/projects/sudoku/designs/quiet-core-20260612-100051/quiet-core-wireframe.html`

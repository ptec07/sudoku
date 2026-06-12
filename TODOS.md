# TODOs

## Seeded Puzzle Generation After Fixed-Puzzle V1

What: Add seeded puzzle generation after the first fixed puzzle works.

Why: Quiet Core v1 intentionally starts with one fixed puzzle, but replay value eventually needs more puzzles.

Pros:

- Adds replayability.
- Creates a path toward daily puzzles.
- Avoids maintaining a manual puzzle list forever.

Cons:

- Adds algorithm complexity.
- Raises puzzle quality questions.
- Bad generated puzzles are worse than no generated puzzles.

Context: Quiet Core v1 should prove board feel first. Once one fixed puzzle is playable and tested, add a seeded generator or curated puzzle set behind the same `puzzle.ts` boundary. Start boring: curated seeds may be better than a generator if puzzle quality matters.

Depends on:

- Fixed puzzle v1 complete.
- Engine validation tests passing.

## Theme Packs After Quiet Core V1

What: Add theme packs after Quiet Core v1 is playable.

Why: The long-term direction is color, sound, animation, and theme choice, but theme work before the board feels right would slow the first playable build.

Pros:

- Makes the app feel more personal.
- Creates the long-term product identity.
- Gives color and sound tokens a clean home.

Cons:

- Can become visual fiddling before the game loop is solid.
- Adds more states to test.

Context: v1 should use one calm Apple-like theme. After v1, introduce a small theme token system with 2-3 themes max, such as `Classic Calm`, `Night Focus`, and `Warm Paper`. Keep theme tokens explicit so board contrast and mistake feedback remain readable.

Depends on:

- v1 board UI complete.
- Selector states stable.
- Sound event names stable.

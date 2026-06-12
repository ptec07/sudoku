import { useEffect, useMemo, useState } from "react";
import { playGameEvents } from "./audio/sound";
import { Board } from "./components/Board";
import { Keypad } from "./components/Keypad";
import { Toolbar } from "./components/Toolbar";
import {
  clearCell,
  createInitialState,
  isDigit,
  placeNumber,
  selectCell,
  setMuted,
  setNotesMode,
  undo,
} from "./game/engine";
import { createPuzzle, difficultySettings } from "./game/puzzle";
import { canUndo, getBlockedDigits, getCellViews } from "./game/selectors";
import type { CellIndex, Digit, EngineResult, GameState } from "./game/types";
import type { Difficulty } from "./game/puzzle";

const difficulties = Object.entries(difficultySettings) as Array<
  [Difficulty, (typeof difficultySettings)[Difficulty]]
>;

function createNewGame(difficulty: Difficulty): GameState {
  const generated = createPuzzle({ clueCount: difficultySettings[difficulty].clueCount });
  return createInitialState(generated.puzzle, generated.solution);
}

function App() {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [game, setGame] = useState<GameState>(() => createNewGame("easy"));
  const [lastEvents, setLastEvents] = useState<string[]>([]);

  const cells = useMemo(() => getCellViews(game), [game]);
  const blockedDigits = useMemo(
    () => (game.notesMode ? [] : getBlockedDigits(game)),
    [game],
  );
  const mistakesUsed = 3 - game.mistakesRemaining;
  const inputDisabled = game.completed || game.mistakesRemaining === 0;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const maybeDigit = Number(event.key);
      if (isDigit(maybeDigit)) {
        event.preventDefault();
        run((state) => placeNumber(state, maybeDigit));
      }
      if (event.key === "Backspace" || event.key === "Delete") {
        event.preventDefault();
        run((state) => clearCell(state));
      }

      const selected = game.selected;
      if (selected === null) return;

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        run(() => selectCell(game, Math.max(0, selected - 1)));
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        run(() => selectCell(game, Math.min(80, selected + 1)));
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        run(() => selectCell(game, Math.max(0, selected - 9)));
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        run(() => selectCell(game, Math.min(80, selected + 9)));
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [game]);

  function run(action: (state: GameState) => EngineResult) {
    const result = action(game);
    setGame(result.state);
    setLastEvents(result.events);
    playGameEvents(result.events, result.state.muted);
  }

  function handleSelect(index: CellIndex) {
    run((state) => selectCell(state, index));
  }

  function handleDigit(digit: Digit) {
    run((state) => placeNumber(state, digit));
  }

  function handleClear() {
    run((state) => clearCell(state));
  }

  function handleUndo() {
    run((state) => undo(state));
  }

  function handleNotesToggle() {
    run((state) => setNotesMode(state, !state.notesMode));
  }

  function handleMuteToggle() {
    run((state) => setMuted(state, !state.muted));
  }

  function handleNewGame() {
    setGame((current) => ({
      ...createNewGame(difficulty),
      muted: current.muted,
    }));
    setLastEvents([]);
  }

  function handleDifficultyChange(nextDifficulty: Difficulty) {
    setDifficulty(nextDifficulty);
    setGame((current) => ({
      ...createNewGame(nextDifficulty),
      muted: current.muted,
    }));
    setLastEvents([]);
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <h1>Quiet Core</h1>
          <p className="meta" aria-label="Puzzle status">
            {difficultySettings[difficulty].label} puzzle <span aria-hidden="true">·</span> 04:18{" "}
            <span aria-hidden="true">·</span>{" "}
            {game.mistakesRemaining} left
          </p>
        </div>
        <Toolbar
          canUndo={canUndo(game)}
          disabled={inputDisabled}
          muted={game.muted}
          notesMode={game.notesMode}
          onMuteToggle={handleMuteToggle}
          onNewGame={handleNewGame}
          onNotesToggle={handleNotesToggle}
          onUndo={handleUndo}
        />
      </header>

      <section className="difficulty-control" aria-label="Difficulty">
        {difficulties.map(([level, settings]) => (
          <button
            aria-pressed={difficulty === level}
            className={[
              "difficulty-button",
              difficulty === level ? "difficulty-button-active" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            data-testid={`difficulty-${level}`}
            key={level}
            onClick={() => handleDifficultyChange(level)}
            type="button"
          >
            {settings.label}
          </button>
        ))}
      </section>

      <Board cells={cells} onSelect={handleSelect} />
      <Keypad
        blockedDigits={blockedDigits}
        disabled={inputDisabled}
        onClear={handleClear}
        onDigit={handleDigit}
      />

      <section className="status-row" aria-label="Feedback status">
        <span>Sound: {game.muted ? "muted" : "soft taps"}</span>
        <span>Notes: {game.notesMode ? "on" : "off"}</span>
        <span>Mistakes: {mistakesUsed}/3</span>
      </section>

      <section
        className={`completion-note ${game.completed ? "completion-note-solved" : ""}`}
        data-testid="completion-note"
        aria-live="polite"
      >
        {game.completed
          ? "Puzzle complete. The board settles, precise and quiet."
          : game.mistakesRemaining === 0
            ? "Puzzle paused after three mistakes. Undo a move or start a new puzzle."
          : "Completion moment: solved areas breathe once, then the board settles. No confetti."}
      </section>

      <output className="sr-only" aria-live="polite">
        {lastEvents.join(" ")}
      </output>
    </main>
  );
}

export default App;

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { playGameEvents } from "./audio/sound";
import { Board } from "./components/Board";
import { Keypad } from "./components/Keypad";
import { Toolbar } from "./components/Toolbar";
import {
  clearCell,
  createInitialState,
  isDigit,
  MAX_MISTAKES,
  placeNumber,
  selectCell,
  setMuted,
  setNotesMode,
  undo,
} from "./game/engine";
import { createPuzzle, difficultySettings } from "./game/puzzle";
import { canUndo, getCellViews } from "./game/selectors";
import type { CellIndex, Digit, EngineResult, GameState } from "./game/types";
import type { Difficulty } from "./game/puzzle";

const difficulties = Object.entries(difficultySettings) as Array<
  [Difficulty, (typeof difficultySettings)[Difficulty]]
>;
const SCORE_RECORDS_KEY = "quiet-core-score-records";

type ScoreRecord = {
  id: string;
  name: string;
  score: number;
  difficulty: Difficulty;
  createdAt: string;
};

function createNewGame(difficulty: Difficulty): GameState {
  const generated = createPuzzle({ clueCount: difficultySettings[difficulty].clueCount });
  return createInitialState(generated.puzzle, generated.solution);
}

function loadScoreRecords(): ScoreRecord[] {
  try {
    const savedRecords = window.localStorage.getItem(SCORE_RECORDS_KEY);
    if (!savedRecords) return [];

    const parsedRecords = JSON.parse(savedRecords);
    if (!Array.isArray(parsedRecords)) return [];

    return parsedRecords
      .filter(isScoreRecord)
      .sort((first, second) => second.score - first.score)
      .slice(0, 5);
  } catch {
    return [];
  }
}

function isScoreRecord(record: unknown): record is ScoreRecord {
  if (!record || typeof record !== "object") return false;

  const candidate = record as Partial<ScoreRecord>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.score === "number" &&
    typeof candidate.createdAt === "string" &&
    (candidate.difficulty === "easy" ||
      candidate.difficulty === "medium" ||
      candidate.difficulty === "hard")
  );
}

function saveScoreRecords(records: ScoreRecord[]) {
  window.localStorage.setItem(SCORE_RECORDS_KEY, JSON.stringify(records));
}

function App() {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [game, setGame] = useState<GameState>(() => createNewGame("easy"));
  const [lastEvents, setLastEvents] = useState<string[]>([]);
  const [playerName, setPlayerName] = useState("");
  const [scoreSaved, setScoreSaved] = useState(false);
  const [scoreRecords, setScoreRecords] = useState<ScoreRecord[]>(() => loadScoreRecords());

  const cells = useMemo(() => getCellViews(game), [game]);
  const mistakesUsed = MAX_MISTAKES - game.mistakesRemaining;
  const inputDisabled = game.completed || game.mistakesRemaining === 0;
  const isGameOver = game.mistakesRemaining === 0 && !game.completed;

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
    if (result.state.mistakesRemaining > 0 || result.state.completed) {
      setScoreSaved(false);
    }
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
    setPlayerName("");
    setScoreSaved(false);
  }

  function handleDifficultyChange(nextDifficulty: Difficulty) {
    setDifficulty(nextDifficulty);
    setGame((current) => ({
      ...createNewGame(nextDifficulty),
      muted: current.muted,
    }));
    setLastEvents([]);
    setPlayerName("");
    setScoreSaved(false);
  }

  function handleSaveScore(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = playerName.trim();
    if (!name || scoreSaved || !isGameOver) return;

    const nextRecord: ScoreRecord = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name,
      score: game.score,
      difficulty,
      createdAt: new Date().toISOString(),
    };
    const nextRecords = [nextRecord, ...scoreRecords]
      .sort((first, second) => second.score - first.score)
      .slice(0, 5);

    saveScoreRecords(nextRecords);
    setScoreRecords(nextRecords);
    setScoreSaved(true);
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
        disabled={inputDisabled}
        onClear={handleClear}
        onDigit={handleDigit}
      />

      <section className="status-row" aria-label="Feedback status">
        <span>Score: {game.score}</span>
        <span>Sound: {game.muted ? "muted" : "soft taps"}</span>
        <span>Notes: {game.notesMode ? "on" : "off"}</span>
        <span>Mistakes: {mistakesUsed}/{MAX_MISTAKES}</span>
      </section>

      <section
        className={[
          "completion-note",
          game.completed ? "completion-note-solved" : "",
          isGameOver ? "completion-note-game-over" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        data-testid="completion-note"
        aria-live="polite"
      >
        {game.completed
          ? `Puzzle complete. Final score: ${game.score}.`
          : isGameOver
            ? "Game over after five mistakes. Record your name or start a new puzzle."
          : "Completion moment: solved areas breathe once, then the board settles. No confetti."}
      </section>

      {isGameOver ? (
        <section className="score-panel" data-testid="game-over-panel" aria-label="Game over score">
          <div>
            <h2>Game over</h2>
            <p>Final score: {game.score}</p>
          </div>
          <form className="score-form" onSubmit={handleSaveScore}>
            <label htmlFor="player-name">Name</label>
            <div className="score-form-row">
              <input
                data-testid="player-name-input"
                disabled={scoreSaved}
                id="player-name"
                maxLength={18}
                onChange={(event) => setPlayerName(event.target.value)}
                placeholder="Player name"
                value={playerName}
              />
              <button
                className="tool-button"
                data-testid="save-score-button"
                disabled={scoreSaved || playerName.trim().length === 0}
                type="submit"
              >
                Save
              </button>
            </div>
          </form>
          {scoreRecords.length > 0 ? (
            <ol className="score-list" aria-label="Top scores">
              {scoreRecords.map((record) => (
                <li data-testid="score-record" key={record.id}>
                  <span>{record.name}</span>
                  <span>{difficultySettings[record.difficulty].label}</span>
                  <strong>{record.score}</strong>
                </li>
              ))}
            </ol>
          ) : null}
        </section>
      ) : null}

      <output className="sr-only" aria-live="polite">
        {lastEvents.join(" ")}
      </output>
    </main>
  );
}

export default App;

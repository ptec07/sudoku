import { describe, expect, it } from "vitest";
import {
  clearCell,
  createInitialState,
  MAX_MISTAKES,
  placeNumber,
  SCORE_PER_NUMBER,
  selectCell,
  setNotesMode,
  undo,
} from "./engine";
import {
  createPuzzle,
  createSeededRandom,
  difficultySettings,
  puzzle,
  solution,
  validatePuzzleShape,
} from "./puzzle";

describe("Sudoku engine", () => {
  it("creates locked givens and editable empty cells", () => {
    const state = createInitialState(puzzle, solution);

    expect(state.cells).toHaveLength(81);
    expect(state.cells[0]).toMatchObject({ value: 5, given: true, notes: [] });
    expect(state.cells[2]).toMatchObject({ value: null, given: false, notes: [] });
    expect(state.score).toBe(0);
    expect(state.mistakesRemaining).toBe(MAX_MISTAKES);
  });

  it("selects a cell without changing the board", () => {
    const state = createInitialState(puzzle, solution);
    const result = selectCell(state, 2);

    expect(result.state.selected).toBe(2);
    expect(result.events).toEqual(["cellSelected"]);
    expect(result.state.cells).toEqual(state.cells);
  });

  it("places a correct number and emits a domain event", () => {
    const state = selectCell(createInitialState(puzzle, solution), 2).state;
    const result = placeNumber(state, 4);

    expect(result.state.cells[2]).toMatchObject({ value: 4, mistake: false, notes: [] });
    expect(result.state.score).toBe(SCORE_PER_NUMBER);
    expect(result.events).toContain("numberPlaced");
    expect(result.state.history).toHaveLength(1);
  });

  it("commits a non-conflicting digit even when it is not the solution", () => {
    const state = selectCell(createInitialState(puzzle, solution), 2).state;
    const result = placeNumber(state, 1);

    expect(result.state.cells[2]).toMatchObject({ value: 1, mistake: false, notes: [] });
    expect(result.state.mistakesRemaining).toBe(MAX_MISTAKES);
    expect(result.state.score).toBe(SCORE_PER_NUMBER);
    expect(result.events).toContain("numberPlaced");
  });

  it("rejects visible row, column, or box conflicts before committing a digit", () => {
    const rowConflict = selectCell(createInitialState(puzzle, solution), 2).state;
    const rowResult = placeNumber(rowConflict, 5);

    const columnConflict = selectCell(createInitialState(puzzle, solution), 10).state;
    const columnResult = placeNumber(columnConflict, 9);

    const boxConflict = selectCell(createInitialState(puzzle, solution), 11).state;
    const boxResult = placeNumber(boxConflict, 5);

    expect(rowResult.state.cells[2]).toMatchObject({ value: null, mistake: true });
    expect(rowResult.state.mistakesRemaining).toBe(MAX_MISTAKES - 1);
    expect(rowResult.state.score).toBe(0);
    expect(rowResult.events).toEqual(["conflict", "mistake"]);
    expect(columnResult.state.cells[10]).toMatchObject({ value: null, mistake: true });
    expect(columnResult.events).toEqual(["conflict", "mistake"]);
    expect(boxResult.state.cells[11]).toMatchObject({ value: null, mistake: true });
    expect(boxResult.events).toEqual(["conflict", "mistake"]);
  });

  it("accepts a correct number after a previous mistake in the same cell", () => {
    const state = selectCell(createInitialState(puzzle, solution), 2).state;
    const mistaken = placeNumber(state, 5).state;
    const corrected = placeNumber(mistaken, 4);

    expect(corrected.state.cells[2]).toMatchObject({ value: 4, mistake: false });
    expect(corrected.state.mistakesRemaining).toBe(MAX_MISTAKES - 1);
    expect(corrected.state.score).toBe(SCORE_PER_NUMBER);
    expect(corrected.events).toContain("numberPlaced");
  });

  it("does not mutate a given cell", () => {
    const state = selectCell(createInitialState(puzzle, solution), 0).state;
    const result = placeNumber(state, 1);

    expect(result.state).toBe(state);
    expect(result.events).toEqual(["ignored"]);
  });

  it("does nothing when no cell is selected", () => {
    const state = createInitialState(puzzle, solution);
    const result = placeNumber(state, 4);

    expect(result.state).toBe(state);
    expect(result.events).toEqual(["ignored"]);
  });

  it("toggles notes in notes mode instead of placing a value", () => {
    const selected = selectCell(createInitialState(puzzle, solution), 2).state;
    const notesMode = setNotesMode(selected, true).state;
    const added = placeNumber(notesMode, 4).state;
    const removed = placeNumber(added, 4).state;

    expect(added.cells[2].value).toBeNull();
    expect(added.cells[2].notes).toEqual([4]);
    expect(removed.cells[2].notes).toEqual([]);
  });

  it("does not add notes to given or filled cells", () => {
    const selectedGiven = selectCell(createInitialState(puzzle, solution), 0).state;
    const givenNotesMode = setNotesMode(selectedGiven, true).state;
    const givenResult = placeNumber(givenNotesMode, 4);

    const selectedEditable = selectCell(createInitialState(puzzle, solution), 2).state;
    const filled = placeNumber(selectedEditable, 4).state;
    const filledNotesMode = setNotesMode(filled, true).state;
    const filledResult = placeNumber(filledNotesMode, 5);

    expect(givenResult.events).toEqual(["ignored"]);
    expect(filledResult.events).toEqual(["ignored"]);
  });

  it("undoes number placements and note toggles", () => {
    const state = selectCell(createInitialState(puzzle, solution), 2).state;
    const placed = placeNumber(state, 4).state;
    const undonePlacement = undo(placed).state;

    const notesMode = setNotesMode(state, true).state;
    const noteAdded = placeNumber(notesMode, 4).state;
    const undoneNote = undo(noteAdded).state;

    expect(undonePlacement.cells[2].value).toBeNull();
    expect(undoneNote.cells[2].notes).toEqual([]);
  });

  it("clears editable values, mistakes, and notes without touching givens", () => {
    const selected = selectCell(createInitialState(puzzle, solution), 2).state;
    const placed = placeNumber(selected, 4).state;
    const clearedPlaced = clearCell(placed);

    const notesMode = setNotesMode(selected, true).state;
    const noted = placeNumber(notesMode, 4).state;
    const clearedNotes = clearCell(noted);

    const given = selectCell(createInitialState(puzzle, solution), 0).state;
    const clearedGiven = clearCell(given);

    expect(clearedPlaced.state.cells[2]).toMatchObject({ value: null, mistake: false, notes: [] });
    expect(clearedPlaced.events).toEqual(["cellCleared"]);
    expect(clearedNotes.state.cells[2].notes).toEqual([]);
    expect(clearedGiven.state).toBe(given);
    expect(clearedGiven.events).toEqual(["ignored"]);
  });

  it("removes placed digits from notes in related cells", () => {
    let state = selectCell(createInitialState(puzzle, solution), 10).state;
    state = setNotesMode(state, true).state;
    state = placeNumber(state, 4).state;

    state = selectCell(state, 2).state;
    state = setNotesMode(state, false).state;
    const result = placeNumber(state, 4);

    expect(result.state.cells[10].notes).toEqual([]);
  });

  it("ends the game after five visible conflicts are exhausted", () => {
    let state = selectCell(createInitialState(puzzle, solution), 2).state;
    let result = placeNumber(state, 5);

    for (let attempt = 1; attempt < MAX_MISTAKES; attempt += 1) {
      result = placeNumber(result.state, 5);
    }

    const ignored = placeNumber(result.state, 4);

    expect(result.state.mistakesRemaining).toBe(0);
    expect(result.events).toContain("gameOver");
    expect(ignored.state.cells[2].value).toBeNull();
    expect(ignored.events).toEqual(["ignored"]);
  });

  it("ignores edits after the puzzle is completed", () => {
    const completed = {
      ...createInitialState(puzzle, solution),
      completed: true,
      cells: createInitialState(puzzle, solution).cells.map((cell, index) =>
        index === 2 ? { ...cell, value: null, given: false } : cell,
      ),
      selected: 2,
    };

    const result = placeNumber(completed, 4);

    expect(result.state).toBe(completed);
    expect(result.events).toEqual(["ignored"]);
  });

  it("safely ignores undo with empty history", () => {
    const state = createInitialState(puzzle, solution);
    const result = undo(state);

    expect(result.state).toBe(state);
    expect(result.events).toEqual(["ignored"]);
  });

  it("emits puzzleCompleted exactly once when the final cell solves the board", () => {
    let state = createInitialState(solution, solution);
    state = {
      ...state,
      completed: false,
      cells: state.cells.map((cell, index) =>
        index === 80 ? { ...cell, value: null, given: false } : cell,
      ),
    };

    const selected = selectCell(state, 80).state;
    const solved = placeNumber(selected, 9);
    const repeated = placeNumber(solved.state, 9);

    expect(solved.state.completed).toBe(true);
    expect(solved.events).toContain("puzzleCompleted");
    expect(repeated.events).not.toContain("puzzleCompleted");
  });

  it("rejects a puzzle given that does not match the solution", () => {
    const mismatchedPuzzle = [...puzzle];
    mismatchedPuzzle[0] = 1;

    expect(() => validatePuzzleShape(mismatchedPuzzle, solution)).toThrow(
      "does not match the solution",
    );
  });

  it("rejects an invalid solution grid", () => {
    const emptyPuzzle = Array.from({ length: 81 }, () => null);
    const invalidSolution = [...solution];
    invalidSolution[0] = 1;

    expect(() => validatePuzzleShape(emptyPuzzle, invalidSolution)).toThrow("invalid row");
  });

  it("generates a valid puzzle with givens that match its solution", () => {
    const generated = createPuzzle({ random: createSeededRandom(42), clueCount: 36 });

    expect(generated.puzzle).toHaveLength(81);
    expect(generated.solution).toHaveLength(81);
    expect(generated.puzzle.filter((value) => value !== null).length).toBeGreaterThanOrEqual(36);
    expect(() => validatePuzzleShape(generated.puzzle, generated.solution)).not.toThrow();
  });

  it("varies generated puzzles across seeds", () => {
    const first = createPuzzle({ random: createSeededRandom(100), clueCount: 36 });
    const second = createPuzzle({ random: createSeededRandom(101), clueCount: 36 });

    expect(first.puzzle).not.toEqual(second.puzzle);
    expect(first.solution).not.toEqual(second.solution);
  });

  it("defines difficulty levels by decreasing clue count", () => {
    expect(difficultySettings.easy.clueCount).toBeGreaterThan(
      difficultySettings.medium.clueCount,
    );
    expect(difficultySettings.medium.clueCount).toBeGreaterThan(
      difficultySettings.hard.clueCount,
    );
  });
});

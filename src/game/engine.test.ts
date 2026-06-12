import { describe, expect, it } from "vitest";
import { createInitialState, placeNumber, selectCell, setNotesMode, undo } from "./engine";
import { puzzle, solution } from "./puzzle";

describe("Sudoku engine", () => {
  it("creates locked givens and editable empty cells", () => {
    const state = createInitialState(puzzle, solution);

    expect(state.cells).toHaveLength(81);
    expect(state.cells[0]).toMatchObject({ value: 5, given: true, notes: [] });
    expect(state.cells[2]).toMatchObject({ value: null, given: false, notes: [] });
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
    expect(result.events).toContain("numberPlaced");
    expect(result.state.history).toHaveLength(1);
  });

  it("marks a wrong number quietly and decrements mistakes", () => {
    const state = selectCell(createInitialState(puzzle, solution), 2).state;
    const result = placeNumber(state, 5);

    expect(result.state.cells[2]).toMatchObject({ value: 5, mistake: true });
    expect(result.state.mistakesRemaining).toBe(2);
    expect(result.events).toContain("mistake");
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
});

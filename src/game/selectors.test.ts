import { describe, expect, it } from "vitest";
import { createInitialState, placeNumber, selectCell } from "./engine";
import { puzzle, solution } from "./puzzle";
import { areRelated, canUndo, getBlockedDigits, getCellViews, toRowCol } from "./selectors";

describe("Sudoku selectors", () => {
  it("maps cell index to row and column", () => {
    expect(toRowCol(0)).toEqual({ row: 0, col: 0 });
    expect(toRowCol(80)).toEqual({ row: 8, col: 8 });
  });

  it("identifies related row, column, and box cells", () => {
    expect(areRelated(0, 8)).toBe(true);
    expect(areRelated(0, 72)).toBe(true);
    expect(areRelated(0, 10)).toBe(true);
    expect(areRelated(0, 40)).toBe(false);
  });

  it("produces selected, related, same-number, and mistake view state", () => {
    let state = selectCell(createInitialState(puzzle, solution), 2).state;
    state = placeNumber(state, 5).state;
    state = selectCell(state, 0).state;

    const views = getCellViews(state);

    expect(views[0]).toMatchObject({ selected: true, value: 5 });
    expect(views[2]).toMatchObject({
      related: true,
      sameNumber: false,
      value: null,
      mistake: true,
    });
    expect(views[40].related).toBe(false);
    expect(views[2].ariaLabel).toContain("marked mistake");
  });

  it("reports undo availability", () => {
    const initial = createInitialState(puzzle, solution);
    const selected = selectCell(initial, 2).state;
    const placed = placeNumber(selected, 4).state;

    expect(canUndo(initial)).toBe(false);
    expect(canUndo(placed)).toBe(true);
  });

  it("reports visible conflicting digits for the selected editable cell", () => {
    const state = selectCell(createInitialState(puzzle, solution), 2).state;

    expect(getBlockedDigits(state)).toEqual([3, 5, 6, 7, 8, 9]);
  });

  it("does not block keypad digits when no editable cell is selected", () => {
    const initial = createInitialState(puzzle, solution);
    const selectedGiven = selectCell(initial, 0).state;

    expect(getBlockedDigits(initial)).toEqual([]);
    expect(getBlockedDigits(selectedGiven)).toEqual([]);
  });
});

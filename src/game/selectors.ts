import type { BoardCellView, CellIndex, Digit, GameState } from "./types";

export function toRowCol(index: CellIndex): { row: number; col: number } {
  return {
    row: Math.floor(index / 9),
    col: index % 9,
  };
}

export function areRelated(a: CellIndex, b: CellIndex): boolean {
  const first = toRowCol(a);
  const second = toRowCol(b);
  const sameBox =
    Math.floor(first.row / 3) === Math.floor(second.row / 3) &&
    Math.floor(first.col / 3) === Math.floor(second.col / 3);

  return first.row === second.row || first.col === second.col || sameBox;
}

export function getCellViews(state: GameState): BoardCellView[] {
  const selectedCell = state.selected === null ? null : state.cells[state.selected];
  const selectedValue = selectedCell?.value ?? null;

  return state.cells.map<BoardCellView>((cell, index) => {
    const { row, col } = toRowCol(index);
    const selected = state.selected === index;
    const related = state.selected !== null && !selected && areRelated(state.selected, index);
    const sameNumber = selectedValue !== null && cell.value === selectedValue;

    return {
      index,
      row,
      col,
      value: cell.value,
      notes: cell.notes,
      given: cell.given,
      selected,
      related,
      sameNumber,
      mistake: cell.mistake,
      complete: state.completed,
      ariaLabel: buildCellLabel(row, col, cell),
    };
  });
}

export function canUndo(state: GameState): boolean {
  return state.history.length > 0;
}

export function getBlockedDigits(state: GameState): Digit[] {
  const selected = state.selected;
  if (selected === null || state.completed || state.mistakesRemaining === 0) return [];

  const selectedCell = state.cells[selected];
  if (!selectedCell || selectedCell.given || selectedCell.value !== null) return [];

  const blocked = new Set<Digit>();
  state.cells.forEach((cell, index) => {
    if (index !== selected && cell.value !== null && areRelated(selected, index)) {
      blocked.add(cell.value);
    }
  });

  return [...blocked].sort((a, b) => a - b);
}

function buildCellLabel(
  row: number,
  col: number,
  cell: { value: number | null; given: boolean; notes: number[]; mistake: boolean },
): string {
  const position = `Row ${row + 1} column ${col + 1}`;
  const kind = cell.given ? "given" : "editable";
  const value = cell.value === null ? "empty" : `value ${cell.value}`;
  const notes = cell.notes.length > 0 ? `, notes ${cell.notes.join(" ")}` : "";
  const mistake = cell.mistake ? ", marked mistake" : "";

  return `${position}, ${kind}, ${value}${notes}${mistake}`;
}

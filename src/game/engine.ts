import type { Cell, CellIndex, Digit, EngineResult, GameEvent, GameSnapshot, GameState } from "./types";
import { validatePuzzleShape } from "./puzzle";

const BOARD_SIZE = 81;

export function isDigit(value: number): value is Digit {
  return Number.isInteger(value) && value >= 1 && value <= 9;
}

export function createInitialState(
  puzzleCells: Array<Digit | null>,
  solutionCells: Digit[],
): GameState {
  validatePuzzleShape(puzzleCells, solutionCells);

  return {
    cells: puzzleCells.map<Cell>((value) => ({
      value,
      given: value !== null,
      notes: [],
      mistake: false,
    })),
    solution: [...solutionCells],
    selected: null,
    notesMode: false,
    muted: false,
    completed: false,
    mistakesRemaining: 3,
    history: [],
    completedUnits: [],
  };
}

export function selectCell(state: GameState, index: CellIndex): EngineResult {
  if (!isCellIndex(index)) {
    return { state, events: ["ignored"] };
  }

  return {
    state: { ...state, selected: index },
    events: ["cellSelected"],
  };
}

export function setNotesMode(state: GameState, enabled: boolean): EngineResult {
  return {
    state: { ...state, notesMode: enabled },
    events: [],
  };
}

export function setMuted(state: GameState, muted: boolean): EngineResult {
  return {
    state: { ...state, muted },
    events: [],
  };
}

export function placeNumber(state: GameState, digit: Digit): EngineResult {
  const selected = state.selected;
  if (!canEditBoard(state) || selected === null || !isDigit(digit)) {
    return { state, events: ["ignored"] };
  }

  const cell = state.cells[selected];
  if (!cell || cell.given) {
    return { state, events: ["ignored"] };
  }

  if (state.notesMode) {
    return toggleNote(state, digit);
  }

  const nextCells = cloneCells(state.cells);
  const isCorrect = state.solution[selected] === digit;
  nextCells[selected] = {
    ...nextCells[selected],
    value: isCorrect ? digit : null,
    notes: [],
    mistake: !isCorrect,
  };
  if (isCorrect) {
    removePeerNotes(nextCells, selected, digit);
  }

  const nextBase = pushHistory(state);
  const mistakesRemaining = isCorrect
    ? state.mistakesRemaining
    : Math.max(0, state.mistakesRemaining - 1);
  const nextState: GameState = {
    ...nextBase,
    cells: nextCells,
    mistakesRemaining,
  };

  const events: GameEvent[] = isCorrect ? ["numberPlaced"] : ["mistake"];
  const unitEvents = getNewCompletedUnitEvents(state, nextState);
  const completed = isSolved(nextState);

  return {
    state: {
      ...nextState,
      completed,
      completedUnits: getCompletedUnits(nextState),
    },
    events: [
      ...events,
      ...unitEvents,
      ...(completed && !state.completed ? (["puzzleCompleted"] as const) : []),
      ...(!isCorrect && mistakesRemaining === 0 ? (["gameOver"] as const) : []),
    ],
  };
}

export function toggleNote(state: GameState, digit: Digit): EngineResult {
  const selected = state.selected;
  if (!canEditBoard(state) || selected === null || !isDigit(digit)) {
    return { state, events: ["ignored"] };
  }

  const cell = state.cells[selected];
  if (!cell || cell.given || cell.value !== null) {
    return { state, events: ["ignored"] };
  }

  const notes = cell.notes.includes(digit)
    ? cell.notes.filter((note) => note !== digit)
    : [...cell.notes, digit].sort((a, b) => a - b);

  const nextCells = cloneCells(state.cells);
  nextCells[selected] = { ...cell, notes };

  return {
    state: { ...pushHistory(state), cells: nextCells },
    events: ["noteToggled"],
  };
}

export function clearCell(state: GameState): EngineResult {
  const selected = state.selected;
  if (!canEditBoard(state) || selected === null) {
    return { state, events: ["ignored"] };
  }

  const cell = state.cells[selected];
  if (!cell || cell.given || (cell.value === null && cell.notes.length === 0 && !cell.mistake)) {
    return { state, events: ["ignored"] };
  }

  const nextCells = cloneCells(state.cells);
  nextCells[selected] = {
    ...cell,
    value: null,
    notes: [],
    mistake: false,
  };
  const nextState = {
    ...pushHistory(state),
    cells: nextCells,
    completed: false,
  };

  return {
    state: {
      ...nextState,
      completedUnits: getCompletedUnits(nextState),
    },
    events: ["cellCleared"],
  };
}

export function undo(state: GameState): EngineResult {
  const [previous, ...rest] = state.history;
  if (!previous) {
    return { state, events: ["ignored"] };
  }

  return {
    state: { ...previous, history: rest },
    events: ["undo"],
  };
}

export function isSolved(state: GameState): boolean {
  return state.cells.every((cell, index) => cell.value === state.solution[index] && !cell.mistake);
}

export function getCompletedUnits(state: GameState): string[] {
  const units: string[] = [];

  for (let row = 0; row < 9; row += 1) {
    const indices = Array.from({ length: 9 }, (_, col) => row * 9 + col);
    if (unitSolved(state, indices)) units.push(`row-${row}`);
  }

  for (let col = 0; col < 9; col += 1) {
    const indices = Array.from({ length: 9 }, (_, row) => row * 9 + col);
    if (unitSolved(state, indices)) units.push(`col-${col}`);
  }

  for (let boxRow = 0; boxRow < 3; boxRow += 1) {
    for (let boxCol = 0; boxCol < 3; boxCol += 1) {
      const indices = Array.from({ length: 9 }, (_, offset) => {
        const row = boxRow * 3 + Math.floor(offset / 3);
        const col = boxCol * 3 + (offset % 3);
        return row * 9 + col;
      });
      if (unitSolved(state, indices)) units.push(`box-${boxRow}-${boxCol}`);
    }
  }

  return units;
}

function getNewCompletedUnitEvents(previous: GameState, next: GameState): Array<"unitCompleted"> {
  const before = new Set(previous.completedUnits);
  return getCompletedUnits(next).some((unit) => !before.has(unit)) ? ["unitCompleted"] : [];
}

function canEditBoard(state: GameState): boolean {
  return !state.completed && state.mistakesRemaining > 0;
}

function removePeerNotes(cells: Cell[], placedIndex: CellIndex, digit: Digit): void {
  cells.forEach((cell, index) => {
    if (index !== placedIndex && arePeers(placedIndex, index) && cell.notes.includes(digit)) {
      cells[index] = {
        ...cell,
        notes: cell.notes.filter((note) => note !== digit),
      };
    }
  });
}

function arePeers(a: CellIndex, b: CellIndex): boolean {
  const rowA = Math.floor(a / 9);
  const colA = a % 9;
  const rowB = Math.floor(b / 9);
  const colB = b % 9;

  return (
    rowA === rowB ||
    colA === colB ||
    (Math.floor(rowA / 3) === Math.floor(rowB / 3) &&
      Math.floor(colA / 3) === Math.floor(colB / 3))
  );
}

function unitSolved(state: GameState, indices: CellIndex[]): boolean {
  return indices.every((index) => {
    const cell = state.cells[index];
    return cell.value === state.solution[index] && !cell.mistake;
  });
}

function pushHistory(state: GameState): GameState {
  return {
    ...state,
    history: [snapshot(state), ...state.history],
  };
}

function snapshot(state: GameState): GameSnapshot {
  const { history: _history, ...rest } = state;
  return {
    ...rest,
    cells: cloneCells(rest.cells),
    solution: [...rest.solution],
    completedUnits: [...rest.completedUnits],
  };
}

function cloneCells(cells: Cell[]): Cell[] {
  return cells.map((cell) => ({ ...cell, notes: [...cell.notes] }));
}

function isCellIndex(index: number): boolean {
  return Number.isInteger(index) && index >= 0 && index < BOARD_SIZE;
}

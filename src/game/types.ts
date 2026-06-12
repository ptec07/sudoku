export type Digit = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type CellIndex = number;

export type CellPosition = {
  row: number;
  col: number;
};

export type Cell = {
  value: Digit | null;
  given: boolean;
  notes: Digit[];
  mistake: boolean;
};

export type GameEvent =
  | "cellSelected"
  | "numberPlaced"
  | "noteToggled"
  | "mistake"
  | "conflict"
  | "cellCleared"
  | "undo"
  | "unitCompleted"
  | "puzzleCompleted"
  | "gameOver"
  | "ignored";

export type GameState = {
  cells: Cell[];
  solution: Digit[];
  selected: CellIndex | null;
  notesMode: boolean;
  muted: boolean;
  completed: boolean;
  mistakesRemaining: number;
  history: GameSnapshot[];
  completedUnits: string[];
};

export type GameSnapshot = Omit<GameState, "history">;

export type EngineResult = {
  state: GameState;
  events: GameEvent[];
};

export type BoardCellView = {
  index: CellIndex;
  row: number;
  col: number;
  value: Digit | null;
  notes: Digit[];
  given: boolean;
  selected: boolean;
  related: boolean;
  sameNumber: boolean;
  mistake: boolean;
  complete: boolean;
  ariaLabel: string;
};

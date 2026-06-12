import type { Digit } from "./types";

type RandomSource = () => number;

type PuzzleOptions = {
  clueCount?: number;
  random?: RandomSource;
};

export type Difficulty = "easy" | "medium" | "hard";

export const difficultySettings: Record<Difficulty, { label: string; clueCount: number }> = {
  easy: { label: "Easy", clueCount: 44 },
  medium: { label: "Medium", clueCount: 36 },
  hard: { label: "Hard", clueCount: 30 },
};

export type PuzzleDefinition = {
  puzzle: Array<Digit | null>;
  solution: Digit[];
};

export const puzzle: Array<Digit | null> = [
  5, 3, null, null, 7, null, null, null, null,
  6, null, null, 1, 9, 5, null, null, null,
  null, 9, 8, null, null, null, null, 6, null,
  8, null, null, null, 6, null, null, null, 3,
  4, null, null, 8, null, 3, null, null, 1,
  7, null, null, null, 2, null, null, null, 6,
  null, 6, null, null, null, null, 2, 8, null,
  null, null, null, 4, 1, 9, null, null, 5,
  null, null, null, null, 8, null, null, 7, 9,
];

export const solution: Digit[] = [
  5, 3, 4, 6, 7, 8, 9, 1, 2,
  6, 7, 2, 1, 9, 5, 3, 4, 8,
  1, 9, 8, 3, 4, 2, 5, 6, 7,
  8, 5, 9, 7, 6, 1, 4, 2, 3,
  4, 2, 6, 8, 5, 3, 7, 9, 1,
  7, 1, 3, 9, 2, 4, 8, 5, 6,
  9, 6, 1, 5, 3, 7, 2, 8, 4,
  2, 8, 7, 4, 1, 9, 6, 3, 5,
  3, 4, 5, 2, 8, 6, 1, 7, 9,
];

const DEFAULT_CLUE_COUNT = 36;
const GRID_SIZE = 9;
const BOX_SIZE = 3;

export function createPuzzle(options: PuzzleOptions = {}): PuzzleDefinition {
  const random = options.random ?? Math.random;
  const clueCount = Math.max(17, Math.min(81, options.clueCount ?? DEFAULT_CLUE_COUNT));
  const generatedSolution = createSolution(random);
  const generatedPuzzle = carvePuzzle(generatedSolution, clueCount, random);

  validatePuzzleShape(generatedPuzzle, generatedSolution);

  return {
    puzzle: generatedPuzzle,
    solution: generatedSolution,
  };
}

export function createSeededRandom(seed: number): RandomSource {
  let state = seed >>> 0;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

export function validatePuzzleShape(
  puzzleCells: Array<Digit | null>,
  solutionCells: Digit[],
): void {
  if (puzzleCells.length !== 81 || solutionCells.length !== 81) {
    throw new Error("Sudoku puzzle and solution must both contain 81 cells.");
  }

  puzzleCells.forEach((value, index) => {
    if (value !== null && value !== solutionCells[index]) {
      throw new Error(`Sudoku puzzle given at cell ${index} does not match the solution.`);
    }
  });

  validateSolutionUnits(solutionCells);
}

function createSolution(random: RandomSource): Digit[] {
  const rows = shuffleGroups(random);
  const cols = shuffleGroups(random);
  const digits = shuffle(
    Array.from({ length: GRID_SIZE }, (_, index) => (index + 1) as Digit),
    random,
  );

  return rows.flatMap((row) =>
    cols.map((col) => digits[solutionPattern(row, col)]),
  );
}

function solutionPattern(row: number, col: number): number {
  return (BOX_SIZE * (row % BOX_SIZE) + Math.floor(row / BOX_SIZE) + col) % GRID_SIZE;
}

function shuffleGroups(random: RandomSource): number[] {
  const groups = shuffle([0, 1, 2], random);

  return groups.flatMap((group) =>
    shuffle([0, 1, 2], random).map((offset) => group * BOX_SIZE + offset),
  );
}

function carvePuzzle(
  solvedCells: Digit[],
  clueCount: number,
  random: RandomSource,
): Array<Digit | null> {
  const puzzleCells: Array<Digit | null> = [...solvedCells];
  const pairs = shuffle(
    Array.from({ length: 41 }, (_, index) => [index, 80 - index] as const),
    random,
  );

  for (const [first, second] of pairs) {
    if (countClues(puzzleCells) <= clueCount) break;

    const previousFirst = puzzleCells[first];
    const previousSecond = puzzleCells[second];
    puzzleCells[first] = null;
    puzzleCells[second] = null;

    if (countClues(puzzleCells) < clueCount || countSolutions(puzzleCells) !== 1) {
      puzzleCells[first] = previousFirst;
      puzzleCells[second] = previousSecond;
    }
  }

  return puzzleCells;
}

function countSolutions(cells: Array<Digit | null>): number {
  const working = [...cells];

  function solve(found: number): number {
    if (found > 1) return found;

    const next = findBestEmptyCell(working);
    if (next === null) return found + 1;

    for (const candidate of next.candidates) {
      working[next.index] = candidate;
      found = solve(found);
      working[next.index] = null;
      if (found > 1) break;
    }

    return found;
  }

  return solve(0);
}

function findBestEmptyCell(
  cells: Array<Digit | null>,
): { index: number; candidates: Digit[] } | null {
  let best: { index: number; candidates: Digit[] } | null = null;

  for (let index = 0; index < cells.length; index += 1) {
    if (cells[index] !== null) continue;

    const candidates = getCandidates(cells, index);
    if (candidates.length === 0) return { index, candidates };
    if (best === null || candidates.length < best.candidates.length) {
      best = { index, candidates };
    }
  }

  return best;
}

function getCandidates(cells: Array<Digit | null>, index: number): Digit[] {
  const row = Math.floor(index / GRID_SIZE);
  const col = index % GRID_SIZE;
  const used = new Set<Digit>();

  for (let offset = 0; offset < GRID_SIZE; offset += 1) {
    const rowValue = cells[row * GRID_SIZE + offset];
    const colValue = cells[offset * GRID_SIZE + col];
    if (rowValue !== null) used.add(rowValue);
    if (colValue !== null) used.add(colValue);
  }

  const boxRow = Math.floor(row / BOX_SIZE) * BOX_SIZE;
  const boxCol = Math.floor(col / BOX_SIZE) * BOX_SIZE;
  for (let rowOffset = 0; rowOffset < BOX_SIZE; rowOffset += 1) {
    for (let colOffset = 0; colOffset < BOX_SIZE; colOffset += 1) {
      const value = cells[(boxRow + rowOffset) * GRID_SIZE + boxCol + colOffset];
      if (value !== null) used.add(value);
    }
  }

  return ([1, 2, 3, 4, 5, 6, 7, 8, 9] as Digit[]).filter((digit) => !used.has(digit));
}

function countClues(cells: Array<Digit | null>): number {
  return cells.filter((cell) => cell !== null).length;
}

function shuffle<T>(values: T[], random: RandomSource): T[] {
  const shuffled = [...values];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

function validateSolutionUnits(solutionCells: Digit[]): void {
  for (let row = 0; row < 9; row += 1) {
    const values = Array.from({ length: 9 }, (_, col) => solutionCells[row * 9 + col]);
    validateUnit(values, `row ${row + 1}`);
  }

  for (let col = 0; col < 9; col += 1) {
    const values = Array.from({ length: 9 }, (_, row) => solutionCells[row * 9 + col]);
    validateUnit(values, `column ${col + 1}`);
  }

  for (let boxRow = 0; boxRow < 3; boxRow += 1) {
    for (let boxCol = 0; boxCol < 3; boxCol += 1) {
      const values = Array.from({ length: 9 }, (_, offset) => {
        const row = boxRow * 3 + Math.floor(offset / 3);
        const col = boxCol * 3 + (offset % 3);
        return solutionCells[row * 9 + col];
      });
      validateUnit(values, `box ${boxRow + 1}-${boxCol + 1}`);
    }
  }
}

function validateUnit(values: Digit[], label: string): void {
  const expected = "123456789";
  const actual = [...values].sort((a, b) => a - b).join("");

  if (actual !== expected) {
    throw new Error(`Sudoku solution has an invalid ${label}.`);
  }
}

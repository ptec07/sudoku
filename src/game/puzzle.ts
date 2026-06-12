import type { Digit } from "./types";

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

// Bingo line calculation utility
// Used by API routes and the bingo page component

export interface BingoLineResult {
  lines: number;
  winningIndices: Set<number>;
}

/**
 * Calculate completed Bingo lines (rows, columns, diagonals) on a 5x5 grid.
 * Accepts Set<number> or number[] of completed task indices (0-24).
 */
export function calculateBingoLines(
  completedIndices: Set<number> | number[]
): BingoLineResult {
  const indexSet =
    completedIndices instanceof Set
      ? completedIndices
      : new Set(completedIndices);
  const winningIndices = new Set<number>();
  let lines = 0;

  // Check rows (5 rows)
  for (let row = 0; row < 5; row++) {
    let rowComplete = true;
    for (let col = 0; col < 5; col++) {
      if (!indexSet.has(row * 5 + col)) {
        rowComplete = false;
        break;
      }
    }
    if (rowComplete) {
      lines++;
      for (let col = 0; col < 5; col++) {
        winningIndices.add(row * 5 + col);
      }
    }
  }

  // Check columns (5 columns)
  for (let col = 0; col < 5; col++) {
    let colComplete = true;
    for (let row = 0; row < 5; row++) {
      if (!indexSet.has(row * 5 + col)) {
        colComplete = false;
        break;
      }
    }
    if (colComplete) {
      lines++;
      for (let row = 0; row < 5; row++) {
        winningIndices.add(row * 5 + col);
      }
    }
  }

  // Check diagonal (top-left to bottom-right: 0, 6, 12, 18, 24)
  let diag1Complete = true;
  for (let i = 0; i < 5; i++) {
    if (!indexSet.has(i * 5 + i)) {
      diag1Complete = false;
      break;
    }
  }
  if (diag1Complete) {
    lines++;
    for (let i = 0; i < 5; i++) {
      winningIndices.add(i * 5 + i);
    }
  }

  // Check diagonal (top-right to bottom-left: 4, 8, 12, 16, 20)
  let diag2Complete = true;
  for (let i = 0; i < 5; i++) {
    if (!indexSet.has(i * 5 + (4 - i))) {
      diag2Complete = false;
      break;
    }
  }
  if (diag2Complete) {
    lines++;
    for (let i = 0; i < 5; i++) {
      winningIndices.add(i * 5 + (4 - i));
    }
  }

  return { lines, winningIndices };
}

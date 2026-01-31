import { describe, it, expect } from "vitest";
import { calculateBingoLines } from "@/lib/bingo";

describe("calculateBingoLines", () => {
  it("returns 0 lines for empty set", () => {
    const result = calculateBingoLines(new Set<number>());
    expect(result.lines).toBe(0);
    expect(result.winningIndices.size).toBe(0);
  });

  it("returns 0 lines for partial row", () => {
    const result = calculateBingoLines(new Set([0, 1, 2, 3]));
    expect(result.lines).toBe(0);
  });

  it("detects complete first row (0-4)", () => {
    const result = calculateBingoLines(new Set([0, 1, 2, 3, 4]));
    expect(result.lines).toBe(1);
    expect(result.winningIndices).toEqual(new Set([0, 1, 2, 3, 4]));
  });

  it("detects complete third row (10-14)", () => {
    const result = calculateBingoLines(new Set([10, 11, 12, 13, 14]));
    expect(result.lines).toBe(1);
    expect(result.winningIndices).toEqual(new Set([10, 11, 12, 13, 14]));
  });

  it("detects complete last row (20-24)", () => {
    const result = calculateBingoLines(new Set([20, 21, 22, 23, 24]));
    expect(result.lines).toBe(1);
  });

  it("detects complete first column (0,5,10,15,20)", () => {
    const result = calculateBingoLines(new Set([0, 5, 10, 15, 20]));
    expect(result.lines).toBe(1);
    expect(result.winningIndices).toEqual(new Set([0, 5, 10, 15, 20]));
  });

  it("detects main diagonal (0,6,12,18,24)", () => {
    const result = calculateBingoLines(new Set([0, 6, 12, 18, 24]));
    expect(result.lines).toBe(1);
    expect(result.winningIndices).toEqual(new Set([0, 6, 12, 18, 24]));
  });

  it("detects anti-diagonal (4,8,12,16,20)", () => {
    const result = calculateBingoLines(new Set([4, 8, 12, 16, 20]));
    expect(result.lines).toBe(1);
    expect(result.winningIndices).toEqual(new Set([4, 8, 12, 16, 20]));
  });

  it("detects overlapping lines (row + column through center)", () => {
    // Third row (10-14) + third column (2,7,12,17,22)
    const indices = new Set([10, 11, 12, 13, 14, 2, 7, 17, 22]);
    const result = calculateBingoLines(indices);
    expect(result.lines).toBe(2);
    // Winning indices should include both the row and column
    expect(result.winningIndices.has(12)).toBe(true); // intersection
    expect(result.winningIndices.has(10)).toBe(true); // row
    expect(result.winningIndices.has(2)).toBe(true); // column
  });

  it("detects row + diagonal overlap", () => {
    // First row (0-4) + main diagonal (0,6,12,18,24)
    const indices = new Set([0, 1, 2, 3, 4, 6, 12, 18, 24]);
    const result = calculateBingoLines(indices);
    expect(result.lines).toBe(2);
  });

  it("returns 12 lines when all 25 cells are completed", () => {
    const all = new Set(Array.from({ length: 25 }, (_, i) => i));
    const result = calculateBingoLines(all);
    expect(result.lines).toBe(12); // 5 rows + 5 cols + 2 diags
    expect(result.winningIndices.size).toBe(25);
  });

  it("returns correct winningIndices for single line", () => {
    const result = calculateBingoLines(new Set([0, 1, 2, 3, 4]));
    for (let i = 0; i < 5; i++) {
      expect(result.winningIndices.has(i)).toBe(true);
    }
    // Should not include non-winning indices
    expect(result.winningIndices.has(5)).toBe(false);
  });

  it("returns correct winningIndices for overlapping lines", () => {
    // Row 0 + Column 0
    const indices = new Set([0, 1, 2, 3, 4, 5, 10, 15, 20]);
    const result = calculateBingoLines(indices);
    expect(result.lines).toBe(2);
    // All of row 0 and column 0 should be winning
    [0, 1, 2, 3, 4, 5, 10, 15, 20].forEach((idx) => {
      expect(result.winningIndices.has(idx)).toBe(true);
    });
  });

  it("accepts number[] input", () => {
    const result = calculateBingoLines([0, 1, 2, 3, 4]);
    expect(result.lines).toBe(1);
    expect(result.winningIndices).toEqual(new Set([0, 1, 2, 3, 4]));
  });

  it("accepts Set<number> input", () => {
    const result = calculateBingoLines(new Set([0, 1, 2, 3, 4]));
    expect(result.lines).toBe(1);
  });

  it("handles duplicates in array input", () => {
    const result = calculateBingoLines([0, 1, 2, 3, 4, 0, 1]);
    expect(result.lines).toBe(1);
  });
});

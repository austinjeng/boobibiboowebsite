import { describe, it, expect } from "vitest";
import { generateRoomCode } from "@/lib/room-code";

describe("generateRoomCode", () => {
  it("returns a 6-character string", () => {
    const code = generateRoomCode();
    expect(code).toHaveLength(6);
    expect(typeof code).toBe("string");
  });

  it("only contains allowed characters (no I, O, 0, 1)", () => {
    const disallowed = /[IO01]/;
    for (let i = 0; i < 100; i++) {
      const code = generateRoomCode();
      expect(code).not.toMatch(disallowed);
    }
  });

  it("only contains uppercase letters and digits", () => {
    const allowed = /^[A-Z2-9]+$/;
    for (let i = 0; i < 100; i++) {
      const code = generateRoomCode();
      expect(code).toMatch(allowed);
    }
  });

  it("produces varying output across 100 calls", () => {
    const codes = new Set<string>();
    for (let i = 0; i < 100; i++) {
      codes.add(generateRoomCode());
    }
    // With 30^6 possible codes, 100 calls should produce many unique values
    expect(codes.size).toBeGreaterThan(90);
  });
});

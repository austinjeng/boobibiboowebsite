import { describe, it, expect } from "vitest";
import {
  HAPPY_TAGS,
  CAUTION_TAGS,
  CONTEXT_TAGS,
  HAPPY_TAG_LABELS,
  CAUTION_TAG_LABELS,
  CONTEXT_TAG_LABELS,
  HAPPY_TAG_COLORS,
  CAUTION_TAG_COLORS,
  CONTEXT_TAG_COLORS,
  isValidHappyTag,
  isValidCautionTag,
  isValidContextTag,
  getHappyTagLabel,
  getCautionTagLabel,
  getContextTagLabel,
} from "@/lib/tags";

describe("tag constants", () => {
  it("has 10 happy tags", () => {
    expect(HAPPY_TAGS).toHaveLength(10);
  });

  it("has 8 caution tags", () => {
    expect(CAUTION_TAGS).toHaveLength(8);
  });

  it("has 5 context tags", () => {
    expect(CONTEXT_TAGS).toHaveLength(5);
  });

  it("every happy tag has a label", () => {
    for (const tag of HAPPY_TAGS) {
      expect(HAPPY_TAG_LABELS[tag]).toBeDefined();
      expect(typeof HAPPY_TAG_LABELS[tag]).toBe("string");
      expect(HAPPY_TAG_LABELS[tag].length).toBeGreaterThan(0);
    }
  });

  it("every caution tag has a label", () => {
    for (const tag of CAUTION_TAGS) {
      expect(CAUTION_TAG_LABELS[tag]).toBeDefined();
      expect(typeof CAUTION_TAG_LABELS[tag]).toBe("string");
    }
  });

  it("every context tag has a label", () => {
    for (const tag of CONTEXT_TAGS) {
      expect(CONTEXT_TAG_LABELS[tag]).toBeDefined();
      expect(typeof CONTEXT_TAG_LABELS[tag]).toBe("string");
    }
  });

  it("every happy tag has a color entry", () => {
    for (const tag of HAPPY_TAGS) {
      expect(HAPPY_TAG_COLORS[tag]).toBeDefined();
      expect(HAPPY_TAG_COLORS[tag].bg).toBeDefined();
      expect(HAPPY_TAG_COLORS[tag].text).toBeDefined();
    }
  });

  it("every caution tag has a color entry", () => {
    for (const tag of CAUTION_TAGS) {
      expect(CAUTION_TAG_COLORS[tag]).toBeDefined();
      expect(CAUTION_TAG_COLORS[tag].bg).toBeDefined();
      expect(CAUTION_TAG_COLORS[tag].text).toBeDefined();
    }
  });

  it("every context tag has a color entry", () => {
    for (const tag of CONTEXT_TAGS) {
      expect(CONTEXT_TAG_COLORS[tag]).toBeDefined();
      expect(CONTEXT_TAG_COLORS[tag].bg).toBeDefined();
      expect(CONTEXT_TAG_COLORS[tag].text).toBeDefined();
    }
  });
});

describe("isValidHappyTag", () => {
  it("returns true for valid happy tags", () => {
    expect(isValidHappyTag("vibe_good")).toBe(true);
    expect(isValidHappyTag("dessert_surprise")).toBe(true);
    expect(isValidHappyTag("want_revisit")).toBe(true);
  });

  it("returns false for invalid tags", () => {
    expect(isValidHappyTag("invalid_tag")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isValidHappyTag("")).toBe(false);
  });

  it("returns false for caution tags", () => {
    expect(isValidHappyTag("noisy")).toBe(false);
  });

  it("returns false for context tags", () => {
    expect(isValidHappyTag("date")).toBe(false);
  });

  it("is case-sensitive (uppercase returns false)", () => {
    expect(isValidHappyTag("VIBE_GOOD")).toBe(false);
    expect(isValidHappyTag("Vibe_Good")).toBe(false);
  });
});

describe("isValidCautionTag", () => {
  it("returns true for valid caution tags", () => {
    expect(isValidCautionTag("noisy")).toBe(true);
    expect(isValidCautionTag("pricey")).toBe(true);
    expect(isValidCautionTag("long_queue")).toBe(true);
  });

  it("returns false for invalid tags", () => {
    expect(isValidCautionTag("invalid")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isValidCautionTag("")).toBe(false);
  });

  it("returns false for happy tags", () => {
    expect(isValidCautionTag("vibe_good")).toBe(false);
  });

  it("is case-sensitive", () => {
    expect(isValidCautionTag("NOISY")).toBe(false);
  });
});

describe("isValidContextTag", () => {
  it("returns true for valid context tags", () => {
    expect(isValidContextTag("date")).toBe(true);
    expect(isValidContextTag("solo")).toBe(true);
    expect(isValidContextTag("friends")).toBe(true);
  });

  it("returns false for invalid tags", () => {
    expect(isValidContextTag("invalid")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isValidContextTag("")).toBe(false);
  });

  it("returns false for happy tags", () => {
    expect(isValidContextTag("vibe_good")).toBe(false);
  });

  it("is case-sensitive", () => {
    expect(isValidContextTag("DATE")).toBe(false);
  });
});

describe("label functions", () => {
  it("getHappyTagLabel returns correct Chinese labels", () => {
    expect(getHappyTagLabel("vibe_good")).toBe("氣氛很棒");
    expect(getHappyTagLabel("want_revisit")).toBe("想再去");
  });

  it("getCautionTagLabel returns correct Chinese labels", () => {
    expect(getCautionTagLabel("noisy")).toBe("較吵雜");
    expect(getCautionTagLabel("pricey")).toBe("價格偏高");
  });

  it("getContextTagLabel returns correct Chinese labels", () => {
    expect(getContextTagLabel("date")).toBe("約會");
    expect(getContextTagLabel("friends")).toBe("朋友");
  });
});

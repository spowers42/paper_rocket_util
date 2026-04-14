import { describe, it, expect } from "@jest/globals";
import { LABEL_COLORS, DEFAULT_LABEL_COLOR } from "../colors.js";

describe("LABEL_COLORS", () => {
  it("has no more than 10 choices", () => {
    expect(LABEL_COLORS.length).toBeLessThanOrEqual(10);
  });

  it("has at least one choice", () => {
    expect(LABEL_COLORS.length).toBeGreaterThan(0);
  });

  it("all colors have valid RGB values in [0, 1]", () => {
    for (const color of LABEL_COLORS) {
      expect(color.r).toBeGreaterThanOrEqual(0);
      expect(color.r).toBeLessThanOrEqual(1);
      expect(color.g).toBeGreaterThanOrEqual(0);
      expect(color.g).toBeLessThanOrEqual(1);
      expect(color.b).toBeGreaterThanOrEqual(0);
      expect(color.b).toBeLessThanOrEqual(1);
    }
  });

  it("all colors have a non-empty name", () => {
    for (const color of LABEL_COLORS) {
      expect(color.name.length).toBeGreaterThan(0);
    }
  });

  it("all color names are unique", () => {
    const names = LABEL_COLORS.map((c) => c.name);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe("DEFAULT_LABEL_COLOR", () => {
  it("is included in LABEL_COLORS", () => {
    expect(LABEL_COLORS).toContain(DEFAULT_LABEL_COLOR);
  });

  it("is Black", () => {
    expect(DEFAULT_LABEL_COLOR.name).toBe("Black");
  });
});

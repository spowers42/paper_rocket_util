import { describe, it, expect } from "@jest/globals";
import { VALID_DIAMETERS, DEFAULT_OVERLAP_MM } from "../types.js";

describe("VALID_DIAMETERS", () => {
  it("contains exactly 13, 18, 24, and 40 mm", () => {
    expect(VALID_DIAMETERS).toEqual([13, 18, 24, 40]);
  });
});

describe("DEFAULT_OVERLAP_MM", () => {
  it("is 6.35 mm (¼ inch)", () => {
    expect(DEFAULT_OVERLAP_MM).toBeCloseTo(6.35);
  });
});

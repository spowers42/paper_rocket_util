import { describe, it, expect } from "@jest/globals";
import { cylinderPattern, formatPatternSummary } from "../geometry.js";

// Hand-computed reference values: bodyWidth = π × diameter
const DIAMETER_CASES = [
  { diameter: 13, bodyWidth: Math.PI * 13 },
  { diameter: 18, bodyWidth: Math.PI * 18 },
  { diameter: 24, bodyWidth: Math.PI * 24 },
  { diameter: 40, bodyWidth: Math.PI * 40 },
];

const DEFAULT_OVERLAP = 6.35;

describe("cylinderPattern", () => {
  describe("body width equals π × inner diameter", () => {
    it.each(DIAMETER_CASES)("$diameter mm diameter", ({ diameter, bodyWidth }) => {
      const p = cylinderPattern(diameter, 200, DEFAULT_OVERLAP);
      expect(p.bodyWidth).toBeCloseTo(bodyWidth, 6);
    });
  });

  it("total width equals body width plus overlap", () => {
    const p = cylinderPattern(18, 200, DEFAULT_OVERLAP);
    expect(p.totalWidth).toBeCloseTo(p.bodyWidth + DEFAULT_OVERLAP, 6);
  });

  it("height equals the tube length", () => {
    const p = cylinderPattern(18, 350, DEFAULT_OVERLAP);
    expect(p.length).toBe(350);
  });

  it("fold line is at x = bodyWidth", () => {
    const p = cylinderPattern(24, 200, DEFAULT_OVERLAP);
    expect(p.foldLineX).toBeCloseTo(p.bodyWidth, 6);
  });

  it("cut lines are at y = 0 and y = length", () => {
    const length = 175;
    const p = cylinderPattern(18, length, DEFAULT_OVERLAP);
    expect(p.cutLines).toHaveLength(2);
    expect(p.cutLines[0].y).toBe(0);
    expect(p.cutLines[1].y).toBe(length);
  });

  it("accepts a custom overlap", () => {
    const p = cylinderPattern(18, 200, 10);
    expect(p.overlap).toBe(10);
    expect(p.totalWidth).toBeCloseTo(Math.PI * 18 + 10, 6);
  });

  it("stores the input diameter and length", () => {
    const p = cylinderPattern(40, 300, DEFAULT_OVERLAP);
    expect(p.diameter).toBe(40);
    expect(p.length).toBe(300);
  });
});

describe("formatPatternSummary", () => {
  it("includes all key dimensions", () => {
    const p = cylinderPattern(18, 200, DEFAULT_OVERLAP);
    const summary = formatPatternSummary(p);
    expect(summary).toContain("18.00 mm");
    expect(summary).toContain("200.00 mm");
    expect(summary).toContain(p.bodyWidth.toFixed(3));
    expect(summary).toContain(p.totalWidth.toFixed(3));
    expect(summary).toContain(DEFAULT_OVERLAP.toFixed(3));
  });
});

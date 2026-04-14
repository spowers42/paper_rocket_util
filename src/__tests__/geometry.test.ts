import { describe, it, expect } from "@jest/globals";
import { cylinderPattern, formatPatternSummary, calculateAlignmentMarks, ALIGNMENT_MARK_SPACING_MM } from "../geometry.js";

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

describe("calculateAlignmentMarks", () => {
  it("places marks at every 25 mm by default", () => {
    const marks = calculateAlignmentMarks(100);
    expect(marks.map((m) => m.y)).toEqual([25, 50, 75]);
  });

  it("does not place a mark at y=0 or y=length", () => {
    const marks = calculateAlignmentMarks(100);
    expect(marks.every((m) => m.y > 0 && m.y < 100)).toBe(true);
  });

  it("returns no marks when tube is shorter than one spacing interval", () => {
    const marks = calculateAlignmentMarks(20);
    expect(marks).toHaveLength(0);
  });

  it("returns exactly one mark when length equals one spacing interval", () => {
    const marks = calculateAlignmentMarks(ALIGNMENT_MARK_SPACING_MM * 2);
    expect(marks).toHaveLength(1);
    expect(marks[0].y).toBe(ALIGNMENT_MARK_SPACING_MM);
  });

  it("respects a custom spacing", () => {
    const marks = calculateAlignmentMarks(100, 20);
    expect(marks.map((m) => m.y)).toEqual([20, 40, 60, 80]);
  });
});

describe("cylinderPattern alignment marks", () => {
  it("includes alignment marks in the pattern", () => {
    const p = cylinderPattern(18, 100, 6.35);
    expect(p.alignmentMarks).toEqual([{ y: 25 }, { y: 50 }, { y: 75 }]);
  });

  it("has no alignment marks for a very short tube", () => {
    const p = cylinderPattern(18, 20, 6.35);
    expect(p.alignmentMarks).toHaveLength(0);
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

  it("includes alignment mark positions", () => {
    const p = cylinderPattern(18, 100, DEFAULT_OVERLAP);
    const summary = formatPatternSummary(p);
    expect(summary).toContain("25.0");
    expect(summary).toContain("50.0");
    expect(summary).toContain("75.0");
  });

  it("shows 'none' when there are no alignment marks", () => {
    const p = cylinderPattern(18, 20, DEFAULT_OVERLAP);
    const summary = formatPatternSummary(p);
    expect(summary).toContain("none");
  });
});

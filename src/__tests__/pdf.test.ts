import { describe, it, expect } from "@jest/globals";
import { PDFDocument } from "pdf-lib";
import {
  mm,
  MM_TO_PT,
  MARGIN_MM,
  PAGE_OVERLAP_MM,
  PAGE_SIZES_MM,
  calculateSegments,
  generateTubePdf,
} from "../pdf.js";
import { cylinderPattern } from "../geometry.js";

describe("mm", () => {
  it("converts 25.4 mm to exactly 72 pt (one inch)", () => {
    expect(mm(25.4)).toBeCloseTo(72, 5);
  });

  it("converts 0 mm to 0 pt", () => {
    expect(mm(0)).toBe(0);
  });

  it("is consistent with MM_TO_PT constant", () => {
    expect(mm(10)).toBeCloseTo(10 * MM_TO_PT, 10);
  });
});

describe("calculateSegments", () => {
  const usableHeight = PAGE_SIZES_MM.A4.height - 2 * MARGIN_MM; // 277 mm

  it("returns a single segment when tube fits on one page", () => {
    const segments = calculateSegments(200, usableHeight);
    expect(segments).toHaveLength(1);
    expect(segments[0]).toEqual({ yStart: 0, yEnd: 200 });
  });

  it("returns a single segment when tube length exactly equals usable height", () => {
    const segments = calculateSegments(usableHeight, usableHeight);
    expect(segments).toHaveLength(1);
    expect(segments[0]).toEqual({ yStart: 0, yEnd: usableHeight });
  });

  it("returns two segments for a tube slightly longer than one page", () => {
    const segments = calculateSegments(usableHeight + 1, usableHeight);
    expect(segments).toHaveLength(2);
  });

  it("first segment always starts at 0", () => {
    const segments = calculateSegments(500, usableHeight);
    expect(segments[0].yStart).toBe(0);
  });

  it("last segment always ends at the tube length", () => {
    const tubeLength = 500;
    const segments = calculateSegments(tubeLength, usableHeight);
    expect(segments[segments.length - 1].yEnd).toBe(tubeLength);
  });

  it("consecutive segments overlap by PAGE_OVERLAP_MM", () => {
    const segments = calculateSegments(500, usableHeight);
    for (let i = 0; i < segments.length - 1; i++) {
      const overlap = segments[i].yEnd - segments[i + 1].yStart;
      expect(overlap).toBeCloseTo(PAGE_OVERLAP_MM, 5);
    }
  });

  it("no segment exceeds the usable page height", () => {
    const segments = calculateSegments(800, usableHeight);
    for (const seg of segments) {
      expect(seg.yEnd - seg.yStart).toBeLessThanOrEqual(usableHeight + 0.001);
    }
  });
});

describe("generateTubePdf", () => {
  it("returns a valid PDF (starts with %PDF-)", async () => {
    const pattern = cylinderPattern(18, 200, 6.35);
    const bytes = await generateTubePdf(pattern);
    const header = Buffer.from(bytes.slice(0, 5)).toString("ascii");
    expect(header).toBe("%PDF-");
  });

  it("produces a single page for a short tube", async () => {
    const pattern = cylinderPattern(18, 200, 6.35);
    const bytes = await generateTubePdf(pattern);
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBe(1);
  });

  it("produces multiple pages for a long tube", async () => {
    const usableHeight = PAGE_SIZES_MM.A4.height - 2 * MARGIN_MM;
    const pattern = cylinderPattern(18, usableHeight * 2, 6.35);
    const bytes = await generateTubePdf(pattern);
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBeGreaterThan(1);
  });

  it("generates A4 pages at the correct dimensions", async () => {
    const pattern = cylinderPattern(18, 200, 6.35);
    const bytes = await generateTubePdf(pattern, "A4");
    const doc = await PDFDocument.load(bytes);
    const page = doc.getPage(0);
    const { width, height } = page.getSize();
    expect(width).toBeCloseTo(mm(PAGE_SIZES_MM.A4.width), 1);
    expect(height).toBeCloseTo(mm(PAGE_SIZES_MM.A4.height), 1);
  });

  it("generates Letter pages at the correct dimensions", async () => {
    const pattern = cylinderPattern(18, 200, 6.35);
    const bytes = await generateTubePdf(pattern, "Letter");
    const doc = await PDFDocument.load(bytes);
    const page = doc.getPage(0);
    const { width, height } = page.getSize();
    expect(width).toBeCloseTo(mm(PAGE_SIZES_MM.Letter.width), 1);
    expect(height).toBeCloseTo(mm(PAGE_SIZES_MM.Letter.height), 1);
  });

  it("works for all four tube diameters", async () => {
    for (const diameter of [13, 18, 24, 40] as const) {
      const pattern = cylinderPattern(diameter, 200, 6.35);
      const bytes = await generateTubePdf(pattern);
      const header = Buffer.from(bytes.slice(0, 5)).toString("ascii");
      expect(header).toBe("%PDF-");
    }
  });
});

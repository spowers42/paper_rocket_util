/**
 * Flat-pattern geometry for a cylindrical tube.
 *
 * The body of the pattern is a rectangle:
 *   width  = π × inner diameter  (one wrap closes exactly)
 *   height = tube length
 *
 * The overlap strip is a glue flap added beyond the body width:
 *   total width = body width + overlap
 *
 * Cut lines run along the top and bottom edges (full width).
 * The fold line runs parallel to the long axis at x = bodyWidth,
 * marking the start of the overlap strip.
 *
 * Alignment marks are small tick lines placed at regular intervals
 * along both the left edge (x=0) and the fold line (x=bodyWidth).
 * When rolling, the user matches the ticks on the left edge to the
 * corresponding ticks on the fold line to keep the tube straight.
 */

/** Spacing between alignment marks in mm */
export const ALIGNMENT_MARK_SPACING_MM = 50;

/** Length of each alignment mark tick in mm */
export const ALIGNMENT_MARK_LENGTH_MM = 2.5;

/** Length of fin alignment mark lines in mm */
export const FIN_MARK_LENGTH_MM = 20;

export type FinCount = 3 | 4;

export interface AlignmentMark {
  /** Y position of the mark along the tube length (mm) */
  y: number;
}

export interface CylinderPattern {
  /** Inner diameter of the tube (mm) */
  diameter: number;
  /** Tube length (mm) */
  length: number;
  /** Width of the main body rectangle: π × diameter (mm) */
  bodyWidth: number;
  /** Width of the glue seam overlap strip (mm) */
  overlap: number;
  /** Total paper width: bodyWidth + overlap (mm) */
  totalWidth: number;
  /** Cut lines: top and bottom edges at y=0 and y=length, spanning full totalWidth */
  cutLines: { y: number }[];
  /** Fold line: x position where the overlap strip begins */
  foldLineX: number;
  /**
   * Alignment marks along the left edge (x=0) and fold line (x=foldLineX).
   * Marks are placed at regular intervals, never at y=0 or y=length
   * (those positions are already indicated by the cut lines).
   */
  alignmentMarks: AlignmentMark[];
}

/**
 * Calculates alignment mark positions at regular intervals along the tube length,
 * excluding the ends (which are already marked by cut lines).
 */
export function calculateAlignmentMarks(length: number, spacing: number = ALIGNMENT_MARK_SPACING_MM): AlignmentMark[] {
  const marks: AlignmentMark[] = [];
  for (let y = spacing; y < length; y += spacing) {
    marks.push({ y });
  }
  return marks;
}

/**
 * Calculates evenly-spaced fin alignment mark x-positions along the tube circumference.
 * The first mark is at x=0 (the seam) and marks repeat every bodyWidth/finCount mm.
 * Not available for FAI (40 mm) tubes.
 */
export function calculateFinMarks(bodyWidth: number, finCount: FinCount): number[] {
  const spacing = bodyWidth / finCount;
  return Array.from({ length: finCount }, (_, i) => i * spacing);
}

/**
 * Calculates the flat-pattern geometry for a cylindrical tube.
 */
export function cylinderPattern(
  diameter: number,
  length: number,
  overlap: number
): CylinderPattern {
  const bodyWidth = Math.PI * diameter;
  const totalWidth = bodyWidth + overlap;

  return {
    diameter,
    length,
    bodyWidth,
    overlap,
    totalWidth,
    cutLines: [{ y: 0 }, { y: length }],
    foldLineX: bodyWidth,
    alignmentMarks: calculateAlignmentMarks(length),
  };
}

/**
 * Formats a CylinderPattern as a human-readable summary string.
 */
export function formatPatternSummary(p: CylinderPattern): string {
  const markPositions = p.alignmentMarks.map((m) => m.y.toFixed(1)).join(", ");
  return [
    `Flat-pattern dimensions (cylinder):`,
    `  Inner diameter : ${p.diameter.toFixed(2)} mm`,
    `  Tube length    : ${p.length.toFixed(2)} mm`,
    `  Body width     : ${p.bodyWidth.toFixed(3)} mm  (π × ${p.diameter} mm)`,
    `  Overlap strip  : ${p.overlap.toFixed(3)} mm`,
    `  Total width    : ${p.totalWidth.toFixed(3)} mm`,
    `  Fold line at   : x = ${p.foldLineX.toFixed(3)} mm`,
    `  Cut lines at   : y = 0 mm, y = ${p.length.toFixed(2)} mm`,
    `  Alignment marks: y = ${markPositions || "none"} mm (at x=0 and x=${p.foldLineX.toFixed(1)} mm)`,
  ].join("\n");
}

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
 */

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
  };
}

/**
 * Formats a CylinderPattern as a human-readable summary string.
 */
export function formatPatternSummary(p: CylinderPattern): string {
  return [
    `Flat-pattern dimensions (cylinder):`,
    `  Inner diameter : ${p.diameter.toFixed(2)} mm`,
    `  Tube length    : ${p.length.toFixed(2)} mm`,
    `  Body width     : ${p.bodyWidth.toFixed(3)} mm  (π × ${p.diameter} mm)`,
    `  Overlap strip  : ${p.overlap.toFixed(3)} mm`,
    `  Total width    : ${p.totalWidth.toFixed(3)} mm`,
    `  Fold line at   : x = ${p.foldLineX.toFixed(3)} mm`,
    `  Cut lines at   : y = 0 mm, y = ${p.length.toFixed(2)} mm`,
  ].join("\n");
}

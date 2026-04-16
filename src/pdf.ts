import { PDFDocument, rgb, degrees, StandardFonts, type PDFFont, type PDFPage } from "pdf-lib";
import { type CylinderPattern, type FrustumPattern, ALIGNMENT_MARK_LENGTH_MM, ALIGNMENT_MARK_SPACING_MM, FIN_MARK_LENGTH_MM, calculateFinMarks, calculateAlignmentMarks, cylinderPattern, type FinCount } from "./geometry.js";
import { type LabelColor, DEFAULT_LABEL_COLOR } from "./colors.js";
import { type TubeGraphic, type PageSize, DEFAULT_PAGE_SIZE } from "./types.js";

/** Points per millimetre (72 pt/inch ÷ 25.4 mm/inch) */
export const MM_TO_PT = 72 / 25.4;

/** Convert millimetres to PDF points */
export const mm = (value: number): number => value * MM_TO_PT;

/** Page margin on all sides (mm) */
export const MARGIN_MM = 10;

/**
 * Height of the repeated overlap zone between pages (mm).
 * The bottom of page N and the top of page N+1 show the same
 * slice of the pattern so the user can align them when taping.
 */
export const PAGE_OVERLAP_MM = 15;

/** Font size for competitor label printed on the tube (pt) */
export const LABEL_FONT_SIZE_PT = 11;

/** Distance from the bottom cut line to the start of the label text (mm) */
export const LABEL_BOTTOM_MARGIN_MM = 8;

/** Distance from the left cut line to the label text baseline (mm) */
export const LABEL_LEFT_OFFSET_MM = 7;

/**
 * Builds the competitor label string from optional name, license, and country.
 * Only includes fields that are provided; fields are separated by " · ".
 * Returns undefined if no fields are provided.
 */
export function buildLabel(
  name?: string,
  license?: string,
  country?: string
): string | undefined {
  const parts = [name, license, country].filter(Boolean) as string[];
  return parts.length > 0 ? parts.join("  ·  ") : undefined;
}

export const PAGE_SIZES_MM = {
  A4: { width: 210, height: 297 },
  Letter: { width: 215.9, height: 279.4 },
} as const;

export type { PageSize } from "./types.js";

/** A slice of the tube pattern rendered onto one page */
export interface Segment {
  /** Start of this slice in pattern coordinates (mm from top of tube) */
  yStart: number;
  /** End of this slice in pattern coordinates (mm from top of tube) */
  yEnd: number;
}

/**
 * Divides the tube length into page-sized segments.
 * Consecutive segments overlap by PAGE_OVERLAP_MM so the user
 * can align and tape multi-page prints together.
 */
export function calculateSegments(
  tubeLength: number,
  usableHeightMm: number
): Segment[] {
  if (tubeLength <= usableHeightMm) {
    return [{ yStart: 0, yEnd: tubeLength }];
  }
  const step = usableHeightMm - PAGE_OVERLAP_MM;
  const segments: Segment[] = [];
  let yStart = 0;
  while (yStart < tubeLength) {
    const yEnd = Math.min(yStart + usableHeightMm, tubeLength);
    segments.push({ yStart, yEnd });
    if (yEnd >= tubeLength) break;
    yStart += step;
  }
  return segments;
}

/** The position and size (all in mm) for a graphic on the flat pattern. */
export interface GraphicPlacement {
  x: number;
  y: number;      // distance from the TOP of the segment (pattern coordinates)
  width: number;
  height: number;
}

/** Margin around the graphic within the body area (mm) */
export const GRAPHIC_MARGIN_MM = 5;

/** Maximum graphic width as a fraction of the body width */
export const GRAPHIC_MAX_WIDTH_RATIO = 0.60;

/**
 * Calculates where to draw a graphic on the first page so that it:
 *   - is scaled to fit within the body width with GRAPHIC_MARGIN_MM on each side,
 *   - preserves the original aspect ratio,
 *   - is centered horizontally within the body width,
 *   - has its center placed at 1/3 from the top of the segment.
 *
 * @param imageWidthPx  Natural pixel width of the image
 * @param imageHeightPx Natural pixel height of the image
 * @param bodyWidthMm   Width of the tube body area (excludes overlap strip)
 * @param segHeightMm   Height of the first page segment
 */
export function calculateGraphicPlacement(
  imageWidthPx: number,
  imageHeightPx: number,
  bodyWidthMm: number,
  segHeightMm: number
): GraphicPlacement {
  const maxWidthMm = bodyWidthMm * GRAPHIC_MAX_WIDTH_RATIO;
  const maxHeightMm = segHeightMm - 2 * GRAPHIC_MARGIN_MM;

  const scale = Math.min(maxWidthMm / imageWidthPx, maxHeightMm / imageHeightPx);
  const widthMm = imageWidthPx * scale;
  const heightMm = imageHeightPx * scale;

  // Center horizontally within the body width
  const x = (bodyWidthMm - widthMm) / 2;

  // Center of image at 1/3 from the top; clamped so the image stays within margins
  const centerY = segHeightMm / 3;
  const y = Math.max(GRAPHIC_MARGIN_MM, centerY - heightMm / 2);

  return { x, y, width: widthMm, height: heightMm };
}

function drawPageContent(
  page: PDFPage,
  pattern: CylinderPattern,
  segment: Segment,
  pageNum: number,
  totalPages: number,
  font: PDFFont,
  boldFont: PDFFont,
  label?: string,
  labelColor?: LabelColor,
  finCount?: FinCount
): void {
  const { height: pageHeightPt } = page.getSize();
  const marginPt = mm(MARGIN_MM);

  const segHeightMm = segment.yEnd - segment.yStart;
  const segHeightPt = mm(segHeightMm);
  const totalWidthPt = mm(pattern.totalWidth);

  // Convert pattern coordinates → PDF coordinates.
  // Pattern: x=0 at left, y=0 at top of segment, increases downward.
  // PDF:     x=0 at left, y=0 at bottom of page, increases upward.
  const px = (x: number) => marginPt + mm(x);
  const py = (patY: number) => pageHeightPt - marginPt - mm(patY);

  const rectBottom = py(segHeightMm);
  const isFirstPage = pageNum === 1;
  const isLastPage = segment.yEnd >= pattern.length;

  // 1. Glue-seam overlap strip background (light grey)
  page.drawRectangle({
    x: px(pattern.bodyWidth),
    y: rectBottom,
    width: mm(pattern.overlap),
    height: segHeightPt,
    color: rgb(0.92, 0.92, 0.92),
  });

  // 2. Page-join overlap zones (light green) — same content appears on both
  //    adjacent pages so the user can align them.
  if (!isLastPage) {
    // Bottom of current page
    page.drawRectangle({
      x: px(0),
      y: rectBottom,
      width: totalWidthPt,
      height: mm(PAGE_OVERLAP_MM),
      color: rgb(0.87, 0.94, 0.87),
    });
  }
  if (!isFirstPage) {
    // Top of current page
    const overlapHeightMm = Math.min(PAGE_OVERLAP_MM, segHeightMm);
    page.drawRectangle({
      x: px(0),
      y: py(overlapHeightMm),
      width: totalWidthPt,
      height: mm(overlapHeightMm),
      color: rgb(0.87, 0.94, 0.87),
    });
  }

  // 3. Main rectangle border (the cut lines — top, bottom, left, right)
  page.drawRectangle({
    x: px(0),
    y: rectBottom,
    width: totalWidthPt,
    height: segHeightPt,
    borderColor: rgb(0, 0, 0),
    borderWidth: 0.5,
  });

  // 4. Fold line (dashed) at x = bodyWidth
  page.drawLine({
    start: { x: px(pattern.bodyWidth), y: py(0) },
    end: { x: px(pattern.bodyWidth), y: py(segHeightMm) },
    thickness: 0.5,
    color: rgb(0, 0, 0),
    dashArray: [mm(3), mm(2)],
  });

  // 5. Alignment mark ticks at x=0 (left edge) and x=bodyWidth (fold line).
  //    Left ticks point inward (rightward); fold ticks point inward (leftward).
  const tickLenPt = mm(ALIGNMENT_MARK_LENGTH_MM);
  for (const mark of pattern.alignmentMarks) {
    const markYInSeg = mark.y - segment.yStart;
    if (markYInSeg <= 0 || markYInSeg >= segHeightMm) continue;
    const markPdfY = py(markYInSeg);

    page.drawLine({
      start: { x: px(0), y: markPdfY },
      end: { x: px(0) + tickLenPt, y: markPdfY },
      thickness: 0.5,
      color: rgb(0, 0, 0),
    });
    page.drawLine({
      start: { x: px(pattern.bodyWidth), y: markPdfY },
      end: { x: px(pattern.bodyWidth) - tickLenPt, y: markPdfY },
      thickness: 0.5,
      color: rgb(0, 0, 0),
    });
  }

  // 6. Page-join dashed line and label (bottom of non-last pages)
  if (!isLastPage) {
    const joinLineY = py(segHeightMm - PAGE_OVERLAP_MM);
    page.drawLine({
      start: { x: px(0), y: joinLineY },
      end: { x: px(pattern.totalWidth), y: joinLineY },
      thickness: 0.4,
      color: rgb(0.4, 0.4, 0.4),
      dashArray: [mm(4), mm(2)],
    });
    page.drawText("align with top of next page", {
      x: px(0) + mm(2),
      y: joinLineY + mm(1),
      size: mm(2.5),
      font,
      color: rgb(0.4, 0.4, 0.4),
    });
  }

  // 7. Competitor label — drawn on the last page only, near the bottom cut line,
  //    rotated 90° so it reads upward along the tube length.
  //    With fin marks: centered in the first bay between fins. After 90° CCW rotation,
  //    the baseline is the right edge of the visible glyphs (characters extend leftward),
  //    so x is shifted right by half the font height to visually center the text.
  //    Without fin marks: uses LABEL_LEFT_OFFSET_MM.
  if (label && isLastPage) {
    const { r, g, b } = labelColor ?? DEFAULT_LABEL_COLOR;
    const fontHeightMm = LABEL_FONT_SIZE_PT / MM_TO_PT;
    const labelXMm = finCount
      ? pattern.bodyWidth / (2 * finCount) + fontHeightMm / 2
      : LABEL_LEFT_OFFSET_MM;
    page.drawText(label, {
      x: px(labelXMm),
      y: py(segHeightMm) + mm(LABEL_BOTTOM_MARGIN_MM),
      size: LABEL_FONT_SIZE_PT,
      font: boldFont,
      color: rgb(r, g, b),
      rotate: degrees(90),
    });
  }

  // 8. Fin alignment marks — drawn on the last page only, at the bottom cut line,
  //    extending upward FIN_MARK_LENGTH_MM. Marks are evenly spaced across the body width.
  if (finCount && isLastPage) {
    const finXPositions = calculateFinMarks(pattern.bodyWidth, finCount);
    const finMarkTopY = py(segHeightMm - FIN_MARK_LENGTH_MM);
    const finMarkBottomY = py(segHeightMm);

    for (const finX of finXPositions) {
      page.drawLine({
        start: { x: px(finX), y: finMarkBottomY },
        end: { x: px(finX), y: finMarkTopY },
        thickness: 0.8,
        color: rgb(0, 0, 0),
      });
    }
  }

  // 9. Page number (multi-page only), above the top margin
  if (totalPages > 1) {
    page.drawText(`Page ${pageNum} of ${totalPages}`, {
      x: px(0),
      y: pageHeightPt - marginPt + mm(3),
      size: mm(3),
      font,
      color: rgb(0.4, 0.4, 0.4),
    });
  }
}

/** Number of line segments used to approximate each arc on the frustum page */
const FRUSTUM_ARC_SEGMENTS = 180;

/**
 * Returns PDF-point coordinates for a point at angle α from the downward vertical
 * (α = 0 is directly below the apex, positive α sweeps clockwise),
 * at radius rMm from the apex located at (cxPt, cyPt) in PDF coordinates.
 */
function frustumPoint(
  cxPt: number,
  cyPt: number,
  rMm: number,
  alpha: number
): { x: number; y: number } {
  return {
    x: cxPt + mm(rMm) * Math.sin(alpha),
    y: cyPt - mm(rMm) * Math.cos(alpha),
  };
}

/**
 * Draws an arc as a polyline of FRUSTUM_ARC_SEGMENTS line segments.
 * alpha1 → alpha2 measured from the downward vertical; positive = clockwise.
 */
function drawFrustumArc(
  page: PDFPage,
  cxPt: number,
  cyPt: number,
  radiusMm: number,
  alpha1: number,
  alpha2: number,
  thickness: number,
  color: ReturnType<typeof rgb>,
  dashArray?: number[]
): void {
  const N = FRUSTUM_ARC_SEGMENTS;
  let prev = frustumPoint(cxPt, cyPt, radiusMm, alpha1);
  for (let i = 1; i <= N; i++) {
    const α = alpha1 + ((alpha2 - alpha1) * i) / N;
    const curr = frustumPoint(cxPt, cyPt, radiusMm, α);
    page.drawLine({ start: prev, end: curr, thickness, color, ...(dashArray ? { dashArray } : {}) });
    prev = curr;
  }
}

/**
 * Fills an annular wedge (between radii R1 and R2 at angles alpha1..alpha2)
 * with a solid grey background by drawing densely-packed radial lines.
 *
 * The outer arc length of the overlap strip equals `overlap` mm regardless of
 * R2, so a fixed line count gives consistent density for any transition length.
 */
function fillOverlapWedge(
  page: PDFPage,
  cxPt: number,
  cyPt: number,
  R1: number,
  R2: number,
  alpha1: number,
  alpha2: number,
  overlapMm: number
): void {
  // One line per ~0.3 mm of arc length at the outer edge → solid coverage.
  const N = Math.ceil(overlapMm / 0.3) + 1;
  // Line thickness wide enough to close the gap between adjacent lines.
  const thickness = (mm(overlapMm) / N) * 2.2;
  const grey = rgb(0.92, 0.92, 0.92);
  for (let i = 0; i <= N; i++) {
    const α = alpha1 + ((alpha2 - alpha1) * i) / N;
    page.drawLine({
      start: frustumPoint(cxPt, cyPt, R1, α),
      end: frustumPoint(cxPt, cyPt, R2, α),
      thickness,
      color: grey,
    });
  }
}

/**
 * Draws the frustum (transition section) flat-pattern onto a single PDF page.
 * No text is drawn — the pattern is geometry only.
 *
 * Layout: apex at the top-centre of the content area, sector opens downward.
 * The outer arc (large end, 40 mm ID) is at the bottom; the inner arc
 * (small end, 13 mm ID) is above it. The overlap wedge is on the right.
 */
function drawFrustumPage(page: PDFPage, pattern: FrustumPattern): void {
  const { width: pageWidthPt, height: pageHeightPt } = page.getSize();
  const { outerRadius: R2, innerRadius: R1, sectorAngle: θ, overlap } = pattern;
  const overlapAngle = overlap / R2;

  // Sector angle bounds — main body centred on the downward vertical (α = 0)
  const αLeft = -(θ / 2);
  const αFold = θ / 2;
  const αRight = θ / 2 + overlapAngle;

  // Apex centred horizontally, with a small top margin
  const usableWidthMm = pageWidthPt / MM_TO_PT - 2 * MARGIN_MM;
  const cxPt = mm(MARGIN_MM) + mm(usableWidthMm / 2);
  const cyPt = pageHeightPt - mm(MARGIN_MM) - mm(5);

  const black = rgb(0, 0, 0);

  // 1. Grey overlap wedge fill (drawn first so outlines render on top)
  fillOverlapWedge(page, cxPt, cyPt, R1, R2, αFold, αRight, overlap);

  // 2. Outer arc (large end) — full span including overlap
  drawFrustumArc(page, cxPt, cyPt, R2, αLeft, αRight, 0.5, black);

  // 3. Inner arc (small end) — full span including overlap
  drawFrustumArc(page, cxPt, cyPt, R1, αLeft, αRight, 0.5, black);

  // 4. Left radial cut line
  page.drawLine({
    start: frustumPoint(cxPt, cyPt, R1, αLeft),
    end: frustumPoint(cxPt, cyPt, R2, αLeft),
    thickness: 0.5,
    color: black,
  });

  // 5. Right radial cut line (outer edge of overlap strip)
  page.drawLine({
    start: frustumPoint(cxPt, cyPt, R1, αRight),
    end: frustumPoint(cxPt, cyPt, R2, αRight),
    thickness: 0.5,
    color: black,
  });

  // 6. Fold line (dashed) at the body / overlap boundary
  page.drawLine({
    start: frustumPoint(cxPt, cyPt, R1, αFold),
    end: frustumPoint(cxPt, cyPt, R2, αFold),
    thickness: 0.5,
    color: black,
    dashArray: [mm(3), mm(2)],
  });

  // 7. Alignment marks at ALIGNMENT_MARK_SPACING_MM intervals along the
  //    slant height (i.e. at radii R1+50, R1+100, … < R2), drawn on the
  //    left radial edge and the fold line.
  //
  //    The tick direction is tangential (perpendicular to the radial edge):
  //      left edge  → increasing-α direction = (cos αLeft,  sin αLeft)
  //      fold line  → decreasing-α direction = (-cos αFold, -sin αFold)
  const tickLenPt = mm(ALIGNMENT_MARK_LENGTH_MM);
  for (let r = R1 + ALIGNMENT_MARK_SPACING_MM; r < R2; r += ALIGNMENT_MARK_SPACING_MM) {
    const leftPt = frustumPoint(cxPt, cyPt, r, αLeft);
    page.drawLine({
      start: leftPt,
      end: { x: leftPt.x + tickLenPt * Math.cos(αLeft), y: leftPt.y + tickLenPt * Math.sin(αLeft) },
      thickness: 0.5,
      color: black,
    });

    const foldPt = frustumPoint(cxPt, cyPt, r, αFold);
    page.drawLine({
      start: foldPt,
      end: { x: foldPt.x - tickLenPt * Math.cos(αFold), y: foldPt.y - tickLenPt * Math.sin(αFold) },
      thickness: 0.5,
      color: black,
    });
  }
}

/**
 * Draws the shoulder piece flat-pattern strip onto an existing page.
 * No text is drawn. The strip is centred horizontally and its top edge is placed
 * at `layoutTopMm` mm below the top content margin.
 *
 * This is called after drawFrustumPage so both patterns share one sheet.
 */
function drawShoulderStrip(page: PDFPage, shoulder: CylinderPattern, layoutTopMm: number): void {
  const { width: pageWidthPt, height: pageHeightPt } = page.getSize();

  const patWidthPt = mm(shoulder.totalWidth);
  const patHeightPt = mm(shoulder.length);

  // Centre horizontally; position top edge at layoutTopMm from the top margin
  const patLeft = (pageWidthPt - patWidthPt) / 2;
  const patTop = pageHeightPt - mm(MARGIN_MM + layoutTopMm);
  const patBottom = patTop - patHeightPt;

  const black = rgb(0, 0, 0);

  // 1. Grey overlap strip
  page.drawRectangle({
    x: patLeft + mm(shoulder.bodyWidth),
    y: patBottom,
    width: mm(shoulder.overlap),
    height: patHeightPt,
    color: rgb(0.92, 0.92, 0.92),
  });

  // 2. Border (cut lines — top, bottom, left, right)
  page.drawRectangle({
    x: patLeft,
    y: patBottom,
    width: patWidthPt,
    height: patHeightPt,
    borderColor: black,
    borderWidth: 0.5,
  });

  // 3. Fold line (dashed) at x = bodyWidth
  page.drawLine({
    start: { x: patLeft + mm(shoulder.bodyWidth), y: patBottom },
    end: { x: patLeft + mm(shoulder.bodyWidth), y: patTop },
    thickness: 0.5,
    color: black,
    dashArray: [mm(3), mm(2)],
  });

  // 4. Alignment mark ticks — the shoulder is only 10 mm tall so there are
  //    none at the default 50 mm spacing, but we draw them if present.
  const tickLenPt = mm(ALIGNMENT_MARK_LENGTH_MM);
  for (const mark of shoulder.alignmentMarks) {
    const markY = patTop - mm(mark.y);
    page.drawLine({ start: { x: patLeft, y: markY }, end: { x: patLeft + tickLenPt, y: markY }, thickness: 0.5, color: black });
    page.drawLine({ start: { x: patLeft + mm(shoulder.bodyWidth), y: markY }, end: { x: patLeft + mm(shoulder.bodyWidth) - tickLenPt, y: markY }, thickness: 0.5, color: black });
  }
}

/**
 * Generates a PDF containing the flat-pattern for the given cylinder pattern.
 * Long tubes are tiled across multiple pages with an overlap zone for alignment.
 */
export async function generateTubePdf(
  pattern: CylinderPattern,
  pageSize: PageSize = DEFAULT_PAGE_SIZE,
  label?: string,
  labelColor?: LabelColor,
  finCount?: FinCount,
  graphic?: TubeGraphic,
  frustum?: FrustumPattern
): Promise<Uint8Array> {
  const pageDims = PAGE_SIZES_MM[pageSize];
  const usableHeightMm = pageDims.height - 2 * MARGIN_MM;
  const segments = calculateSegments(pattern.length, usableHeightMm);

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  for (let i = 0; i < segments.length; i++) {
    const page = pdfDoc.addPage([mm(pageDims.width), mm(pageDims.height)]);
    drawPageContent(page, pattern, segments[i], i + 1, segments.length, font, boldFont, label, labelColor, finCount);
  }

  // Append a combined page: transition section + shoulder piece (shared sheet)
  if (frustum) {
    const combinedPage = pdfDoc.addPage([mm(pageDims.width), mm(pageDims.height)]);
    drawFrustumPage(combinedPage, frustum);

    // The frustum apex sits 5 mm below the top margin; the outer arc ends
    // frustum.outerRadius mm below the apex. Add a 12 mm gap, then the shoulder.
    const FRUSTUM_APEX_TOP_MM = 5;
    const shoulderTopMm = FRUSTUM_APEX_TOP_MM + frustum.outerRadius + 12;
    const shoulderPattern = cylinderPattern(frustum.largeDiameter, 10, frustum.overlap);
    drawShoulderStrip(combinedPage, shoulderPattern, shoulderTopMm);
  }

  // Draw graphic on the first page only
  if (graphic) {
    const image =
      graphic.format === "png"
        ? await pdfDoc.embedPng(graphic.bytes)
        : await pdfDoc.embedJpg(graphic.bytes);

    const firstPage = pdfDoc.getPages()[0];
    const { height: pageHeightPt } = firstPage.getSize();
    const firstSegHeightMm = segments[0].yEnd - segments[0].yStart;

    const placement = calculateGraphicPlacement(
      image.width,
      image.height,
      pattern.bodyWidth,
      firstSegHeightMm
    );

    const px = (x: number) => mm(MARGIN_MM) + mm(x);
    // In PDF coords y=0 is at the bottom; drawImage uses the bottom-left corner of the image
    const pyImg = (patY: number) => pageHeightPt - mm(MARGIN_MM) - mm(patY);

    firstPage.drawImage(image, {
      x: px(placement.x),
      y: pyImg(placement.y + placement.height),
      width: mm(placement.width),
      height: mm(placement.height),
    });
  }

  return pdfDoc.save();
}

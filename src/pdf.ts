import { PDFDocument, rgb, degrees, StandardFonts, type PDFFont, type PDFPage } from "pdf-lib";
import { type CylinderPattern, ALIGNMENT_MARK_LENGTH_MM, FIN_MARK_LENGTH_MM, calculateFinMarks, type FinCount } from "./geometry.js";
import { type LabelColor, DEFAULT_LABEL_COLOR } from "./colors.js";

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

export type PageSize = keyof typeof PAGE_SIZES_MM;

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

/**
 * Generates a PDF containing the flat-pattern for the given cylinder pattern.
 * Long tubes are tiled across multiple pages with an overlap zone for alignment.
 */
export async function generateTubePdf(
  pattern: CylinderPattern,
  pageSize: PageSize = "A4",
  label?: string,
  labelColor?: LabelColor,
  finCount?: FinCount
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

  return pdfDoc.save();
}

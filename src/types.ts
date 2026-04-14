import type { LabelColor } from "./colors.js";
import type { FinCount } from "./geometry.js";

export const VALID_DIAMETERS = [13, 18, 24, 40] as const;
export type TubeDiameter = (typeof VALID_DIAMETERS)[number];

export const DEFAULT_OVERLAP_MM = 6.35; // 1/4 inch

export interface TubeOptions {
  diameter: TubeDiameter;
  length: number;            // mm
  overlap: number;           // mm, glue seam strip
  output: string;            // file path for PDF
  name?: string;
  license?: string;
  country?: string;
  labelColor?: LabelColor;   // text color for competitor label
  finCount?: FinCount;       // 3 or 4 fins; undefined = no fin marks; not available for FAI (40 mm)
  transitionLength?: number; // mm, FAI only (diameter 40)
}

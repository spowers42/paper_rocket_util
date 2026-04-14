export interface LabelColor {
  name: string;
  r: number;
  g: number;
  b: number;
}

export const LABEL_COLORS: readonly LabelColor[] = [
  { name: "Black",        r: 0,    g: 0,    b: 0    },
  { name: "Red",          r: 1,    g: 0.05, b: 0.05 },
  { name: "Blue",         r: 0.05, g: 0.3,  b: 0.95 },
  { name: "Green",        r: 0.05, g: 0.8,  b: 0.15 },
  { name: "Orange",       r: 1,    g: 0.45, b: 0    },
  { name: "Hot Pink",     r: 1,    g: 0.08, b: 0.58 },
  { name: "Purple",       r: 0.6,  g: 0.1,  b: 0.95 },
  { name: "Cyan",         r: 0,    g: 0.8,  b: 0.95 },
  { name: "Lime",         r: 0.5,  g: 0.95, b: 0    },
  { name: "Yellow",       r: 1,    g: 0.9,  b: 0    },
] as const;

export const DEFAULT_LABEL_COLOR = LABEL_COLORS[0]; // Black

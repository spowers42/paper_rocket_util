import { VALID_DIAMETERS, type TubeDiameter } from "./types.js";

/**
 * Returns true if n is one of the supported tube diameters.
 */
export function isValidDiameter(n: number): n is TubeDiameter {
  return (VALID_DIAMETERS as readonly number[]).includes(n);
}

/**
 * Parses a string as a positive finite number.
 * Returns the number, or null if the input is invalid.
 */
export function parsePositiveFloat(value: string): number | null {
  const n = parseFloat(value);
  if (isNaN(n) || !isFinite(n) || n <= 0) return null;
  return n;
}

/**
 * Inquirer-compatible validator for positive number inputs.
 * Returns true on success or an error string on failure.
 */
export function validatePositiveFloat(value: string): true | string {
  return parsePositiveFloat(value) !== null ? true : "Please enter a positive number.";
}

/**
 * Inquirer-compatible validator for the `number` prompt type.
 * Guards against undefined (empty input) and non-positive values.
 */
export function validatePositiveNumber(value: number | undefined): true | string {
  return value !== undefined && value > 0 ? true : "Please enter a positive number.";
}

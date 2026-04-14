import { describe, it, expect } from "@jest/globals";
import { isValidDiameter, parsePositiveFloat, validatePositiveFloat, validatePositiveNumber } from "../validation.js";

describe("isValidDiameter", () => {
  it.each([13, 18, 24, 40])("accepts %i mm", (d) => {
    expect(isValidDiameter(d)).toBe(true);
  });

  it.each([0, 12, 14, 17, 19, 23, 25, 39, 41, 100, -1])(
    "rejects %i mm",
    (d) => {
      expect(isValidDiameter(d)).toBe(false);
    }
  );
});

describe("parsePositiveFloat", () => {
  it("parses a positive integer string", () => {
    expect(parsePositiveFloat("200")).toBe(200);
  });

  it("parses a positive decimal string", () => {
    expect(parsePositiveFloat("6.35")).toBe(6.35);
  });

  it("returns null for zero", () => {
    expect(parsePositiveFloat("0")).toBeNull();
  });

  it("returns null for a negative number", () => {
    expect(parsePositiveFloat("-5")).toBeNull();
  });

  it("returns null for non-numeric input", () => {
    expect(parsePositiveFloat("abc")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(parsePositiveFloat("")).toBeNull();
  });

  it("returns null for Infinity", () => {
    expect(parsePositiveFloat("Infinity")).toBeNull();
  });
});

describe("validatePositiveNumber", () => {
  it("returns true for a positive number", () => {
    expect(validatePositiveNumber(200)).toBe(true);
  });

  it("returns true for a positive decimal", () => {
    expect(validatePositiveNumber(6.35)).toBe(true);
  });

  it("returns an error string for undefined (empty input)", () => {
    expect(validatePositiveNumber(undefined)).toBe("Please enter a positive number.");
  });

  it("returns an error string for zero", () => {
    expect(validatePositiveNumber(0)).toBe("Please enter a positive number.");
  });

  it("returns an error string for a negative number", () => {
    expect(validatePositiveNumber(-10)).toBe("Please enter a positive number.");
  });
});

describe("validatePositiveFloat", () => {
  it("returns true for a valid positive number string", () => {
    expect(validatePositiveFloat("50")).toBe(true);
  });

  it("returns an error string for zero", () => {
    expect(validatePositiveFloat("0")).toBe("Please enter a positive number.");
  });

  it("returns an error string for negative input", () => {
    expect(validatePositiveFloat("-1")).toBe("Please enter a positive number.");
  });

  it("returns an error string for non-numeric input", () => {
    expect(validatePositiveFloat("hello")).toBe("Please enter a positive number.");
  });
});

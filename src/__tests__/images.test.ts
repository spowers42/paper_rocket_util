import { describe, it, expect } from "@jest/globals";
import { detectImageFormat } from "../images.js";

/** Build a Uint8Array starting with the given bytes (rest are zero). */
function bytes(...head: number[]): Uint8Array {
  return new Uint8Array([...head, 0, 0, 0, 0]);
}

describe("detectImageFormat", () => {
  it("detects PNG from magic bytes 89 50 4E 47", () => {
    expect(detectImageFormat(bytes(0x89, 0x50, 0x4e, 0x47))).toBe("png");
  });

  it("detects JPEG from magic bytes FF D8 FF", () => {
    expect(detectImageFormat(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe("jpeg");
  });

  it("detects JPEG regardless of the fourth byte", () => {
    expect(detectImageFormat(bytes(0xff, 0xd8, 0xff, 0xee))).toBe("jpeg");
  });

  it("returns null for an unrecognised format", () => {
    expect(detectImageFormat(bytes(0x47, 0x49, 0x46, 0x38))).toBeNull(); // GIF
  });

  it("returns null for an empty-ish buffer", () => {
    expect(detectImageFormat(new Uint8Array(4))).toBeNull();
  });
});

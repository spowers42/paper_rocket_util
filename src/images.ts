export type ImageFormat = "png" | "jpeg";

/**
 * Detects the image format by inspecting magic bytes.
 * Returns 'png', 'jpeg', or null if the format is not recognised.
 *
 * PNG magic:  89 50 4E 47  (first 4 bytes)
 * JPEG magic: FF D8 FF     (first 3 bytes)
 */
export function detectImageFormat(bytes: Uint8Array): ImageFormat | null {
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "png";
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "jpeg";
  }
  return null;
}

import { homedir } from "os";

/**
 * Expands a leading `~` to the user's home directory.
 * Only replaces `~` when it is the entire path or is followed by `/`.
 * The `home` parameter is injectable for testing.
 */
export function expandTilde(filePath: string, home: string = homedir()): string {
  if (filePath === "~" || filePath.startsWith("~/")) {
    return home + filePath.slice(1);
  }
  return filePath;
}

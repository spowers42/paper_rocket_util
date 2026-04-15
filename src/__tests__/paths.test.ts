import { describe, it, expect } from "@jest/globals";
import { expandTilde } from "../paths.js";

const HOME = "/home/testuser";

describe("expandTilde", () => {
  it("expands ~ alone to the home directory", () => {
    expect(expandTilde("~", HOME)).toBe("/home/testuser");
  });

  it("expands ~/path to home directory + path", () => {
    expect(expandTilde("~/images/flag.png", HOME)).toBe("/home/testuser/images/flag.png");
  });

  it("leaves an absolute path unchanged", () => {
    expect(expandTilde("/absolute/path/flag.png", HOME)).toBe("/absolute/path/flag.png");
  });

  it("leaves a relative path unchanged", () => {
    expect(expandTilde("relative/path/flag.png", HOME)).toBe("relative/path/flag.png");
  });

  it("does not expand ~ in the middle of a path", () => {
    expect(expandTilde("/some/~/path", HOME)).toBe("/some/~/path");
  });

  it("does not expand ~username style paths", () => {
    expect(expandTilde("~otheruser/file.png", HOME)).toBe("~otheruser/file.png");
  });

  it("uses os.homedir() when no home argument is provided", () => {
    const result = expandTilde("~/test.png");
    expect(result.startsWith("~")).toBe(false);
    expect(result.endsWith("/test.png")).toBe(true);
  });
});

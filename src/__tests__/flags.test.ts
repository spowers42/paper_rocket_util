import { describe, it, expect } from "@jest/globals";
import { FAI_FLAGS, findFlag, flagCdnUrl } from "../flags.js";

describe("FAI_FLAGS", () => {
  it("contains at least one entry", () => {
    expect(FAI_FLAGS.length).toBeGreaterThan(0);
  });

  it("every entry has a non-empty country name and a 2-letter code", () => {
    for (const flag of FAI_FLAGS) {
      expect(flag.country.length).toBeGreaterThan(0);
      expect(flag.code).toMatch(/^[a-z]{2}$/);
    }
  });

  it("has no duplicate country names", () => {
    const names = FAI_FLAGS.map(f => f.country.toLowerCase());
    expect(new Set(names).size).toBe(FAI_FLAGS.length);
  });

  it("has no duplicate country codes", () => {
    const codes = FAI_FLAGS.map(f => f.code);
    expect(new Set(codes).size).toBe(FAI_FLAGS.length);
  });
});

describe("findFlag", () => {
  it("finds an exact match", () => {
    const result = findFlag("France");
    expect(result?.code).toBe("fr");
  });

  it("matches case-insensitively", () => {
    expect(findFlag("france")?.code).toBe("fr");
    expect(findFlag("FRANCE")?.code).toBe("fr");
    expect(findFlag("FrAnCe")?.code).toBe("fr");
  });

  it("trims leading and trailing whitespace", () => {
    expect(findFlag("  Germany  ")?.code).toBe("de");
  });

  it("returns undefined for an unknown country", () => {
    expect(findFlag("Atlantis")).toBeUndefined();
  });

  it("returns undefined for an empty string", () => {
    expect(findFlag("")).toBeUndefined();
  });

  it("finds United States by canonical name", () => {
    expect(findFlag("United States")?.code).toBe("us");
  });

  it("finds United States by abbreviation USA", () => {
    expect(findFlag("USA")?.code).toBe("us");
  });

  it("finds United States by full name", () => {
    expect(findFlag("United States of America")?.code).toBe("us");
  });

  it("finds United Kingdom by canonical name", () => {
    expect(findFlag("United Kingdom")?.code).toBe("gb");
  });

  it("finds United Kingdom by abbreviation UK", () => {
    expect(findFlag("UK")?.code).toBe("gb");
  });

  it("finds United Kingdom by Great Britain", () => {
    expect(findFlag("Great Britain")?.code).toBe("gb");
  });

  it("finds Czech Republic by alias Czechia", () => {
    expect(findFlag("Czechia")?.code).toBe("cz");
  });

  it("finds South Korea by alias Korea", () => {
    expect(findFlag("Korea")?.code).toBe("kr");
  });

  it("finds Russia by alias Russian Federation", () => {
    expect(findFlag("Russian Federation")?.code).toBe("ru");
  });

  it("alias matching is case-insensitive", () => {
    expect(findFlag("usa")?.code).toBe("us");
    expect(findFlag("USA")?.code).toBe("us");
    expect(findFlag("uSa")?.code).toBe("us");
  });
});

describe("flagCdnUrl", () => {
  it("returns a flagcdn.com PNG URL for the given code", () => {
    expect(flagCdnUrl("fr")).toBe("https://flagcdn.com/w320/fr.png");
  });
});

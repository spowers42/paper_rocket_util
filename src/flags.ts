export interface FlagDefinition {
  country: string;         // canonical display name
  code: string;            // ISO 3166-1 alpha-2, used for flagcdn.com URLs
  aliases?: readonly string[]; // alternative names and abbreviations
}

/** Countries that participate in FAI spacemodelling competitions. */
export const FAI_FLAGS: readonly FlagDefinition[] = [
  { country: "Australia",      code: "au", aliases: ["aus"] },
  { country: "Austria",        code: "at", aliases: ["aut"] },
  { country: "Belgium",        code: "be", aliases: ["bel"] },
  { country: "Bulgaria",       code: "bg", aliases: ["bul"] },
  { country: "Canada",         code: "ca", aliases: ["can"] },
  { country: "China",          code: "cn", aliases: ["prc", "people's republic of china"] },
  { country: "Croatia",        code: "hr", aliases: ["cro", "hrv"] },
  { country: "Czech Republic", code: "cz", aliases: ["czechia", "czech", "cze"] },
  { country: "Denmark",        code: "dk", aliases: ["den"] },
  { country: "Finland",        code: "fi", aliases: ["fin"] },
  { country: "France",         code: "fr", aliases: ["fra"] },
  { country: "Germany",        code: "de", aliases: ["ger", "deu"] },
  { country: "Hungary",        code: "hu", aliases: ["hun"] },
  { country: "Italy",          code: "it", aliases: ["ita"] },
  { country: "Japan",          code: "jp", aliases: ["jpn"] },
  { country: "Netherlands",    code: "nl", aliases: ["ned", "holland", "the netherlands"] },
  { country: "Norway",         code: "no", aliases: ["nor"] },
  { country: "Poland",         code: "pl", aliases: ["pol"] },
  { country: "Romania",        code: "ro", aliases: ["rou", "rom"] },
  { country: "Russia",         code: "ru", aliases: ["rus", "russian federation"] },
  { country: "Serbia",         code: "rs", aliases: ["srb"] },
  { country: "Slovakia",       code: "sk", aliases: ["svk"] },
  { country: "Slovenia",       code: "si", aliases: ["svn"] },
  { country: "South Africa",   code: "za", aliases: ["rsa", "south africa"] },
  { country: "South Korea",    code: "kr", aliases: ["korea", "republic of korea", "kor"] },
  { country: "Spain",          code: "es", aliases: ["esp"] },
  { country: "Sweden",         code: "se", aliases: ["swe"] },
  { country: "Switzerland",    code: "ch", aliases: ["sui", "che"] },
  { country: "Ukraine",        code: "ua", aliases: ["ukr"] },
  { country: "United Kingdom", code: "gb", aliases: ["uk", "great britain", "britain", "gbr"] },
  { country: "United States",  code: "us", aliases: ["usa", "us", "united states of america", "america"] },
] as const;

/**
 * Returns the flag definition whose country name or any alias matches the given
 * string (case-insensitive, whitespace-trimmed), or undefined if not found.
 */
export function findFlag(country: string): FlagDefinition | undefined {
  const normalized = country.trim().toLowerCase();
  return FAI_FLAGS.find(
    f =>
      f.country.toLowerCase() === normalized ||
      (f.aliases?.some(a => a.toLowerCase() === normalized) ?? false)
  );
}

/** Returns the flagcdn.com URL for a 320 px wide PNG of the given country code. */
export function flagCdnUrl(code: string): string {
  return `https://flagcdn.com/w320/${code}.png`;
}

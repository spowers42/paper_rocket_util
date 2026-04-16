#!/usr/bin/env node

import { select, input, confirm, number } from "@inquirer/prompts";
import chalk from "chalk";
import { VALID_DIAMETERS, DEFAULT_OVERLAP_MM, DEFAULT_PAGE_SIZE, type TubeDiameter, type TubeOptions, type TubeGraphic, type PageSize } from "./types.js";
import { validatePositiveFloat, validatePositiveNumber, parsePositiveFloat } from "./validation.js";
import { cylinderPattern, formatPatternSummary, frustumPattern, formatFrustumSummary, type FinCount } from "./geometry.js";
import { generateTubePdf, buildLabel } from "./pdf.js";
import { LABEL_COLORS, DEFAULT_LABEL_COLOR, type LabelColor } from "./colors.js";
import { findFlag, flagCdnUrl } from "./flags.js";
import { detectImageFormat } from "./images.js";
import { expandTilde } from "./paths.js";
import { readFile, writeFile, access } from "fs/promises";

async function main() {
  console.log(chalk.bold("\nPaper Rocket Utility"));
  console.log(chalk.dim("Generate a printable flat-pattern PDF for competition paper tubes\n"));

  const diameter = await select<TubeDiameter>({
    message: "Tube inner diameter:",
    choices: VALID_DIAMETERS.map((d) => ({
      name: `${d} mm${d === 40 ? " (FAI)" : ""}`,
      value: d,
    })),
  });

  const length = await number({
    message: "Tube length (mm):",
    required: true,
    validate: validatePositiveNumber,
  }) as number;

  const overlapInput = await input({
    message: `Glue seam overlap width (mm):`,
    default: String(DEFAULT_OVERLAP_MM),
    validate: validatePositiveFloat,
  });
  const overlap = parsePositiveFloat(overlapInput) ?? DEFAULT_OVERLAP_MM;

  let transitionLength: number | undefined;
  if (diameter === 40) {
    const addTransition = await confirm({
      message: "Add FAI transition section (40 mm → 13 mm)?",
      default: false,
    });
    if (addTransition) {
      transitionLength = await number({
        message: "Transition section length (mm):",
        required: true,
        validate: validatePositiveNumber,
      }) as number;
    }
  }

  const nameInput = await input({ message: "Competitor name (leave blank to skip):" });
  const licenseInput = await input({ message: "License number (leave blank to skip):" });
  const countryInput = await input({ message: "Country (leave blank to skip):" });

  const hasLabel = !!(nameInput || licenseInput || countryInput);

  // Graphic prompt: offer the country's flag if it's a known FAI nation, plus custom image
  let graphic: TubeGraphic | undefined;
  const matchedFlag = countryInput ? findFlag(countryInput) : undefined;
  const graphicChoices = [
    { name: "None", value: "none" },
    ...(matchedFlag ? [{ name: `Flag: ${matchedFlag.country}`, value: "flag" }] : []),
    { name: "Custom image file (PNG or JPEG)", value: "custom" },
  ];

  const graphicChoice = await select({
    message: "Add graphic to tube?",
    choices: graphicChoices,
  });

  if (graphicChoice === "flag") {
    process.stdout.write(chalk.dim("Fetching flag..."));
    const response = await fetch(flagCdnUrl(matchedFlag!.code));
    if (!response.ok) throw new Error(`Failed to fetch flag: ${response.statusText}`);
    const buffer = await response.arrayBuffer();
    graphic = { bytes: new Uint8Array(buffer), format: "png" };
    console.log(chalk.green(" done"));
  } else if (graphicChoice === "custom") {
    const filePath = await input({
      message: "Image file path:",
      validate: async (v) => {
        if (!v.trim()) return "Please enter a file path.";
        const resolved = expandTilde(v.trim());
        try {
          await access(resolved);
        } catch {
          return `File not found: ${resolved}`;
        }
        const bytes = new Uint8Array(await readFile(resolved));
        if (!detectImageFormat(bytes)) return "Unsupported format — please provide a PNG or JPEG file.";
        return true;
      },
    });
    const bytes = new Uint8Array(await readFile(expandTilde(filePath)));
    const format = detectImageFormat(bytes)!;
    graphic = { bytes, format };
  }

  let labelColor: LabelColor = DEFAULT_LABEL_COLOR;
  if (hasLabel) {
    labelColor = await select<LabelColor>({
      message: "Label text color:",
      choices: LABEL_COLORS.map((c) => ({ name: c.name, value: c })),
    });
  }

  let finCount: FinCount | undefined;
  if (diameter !== 40) {
    const addFinMarks = await confirm({
      message: "Add fin alignment marks?",
      default: true,
    });
    if (addFinMarks) {
      finCount = await select<FinCount>({
        message: "Number of fins:",
        choices: [
          { name: "3 fins (120° spacing)", value: 3 },
          { name: "4 fins (90° spacing)",  value: 4 },
        ],
      });
    }
  }

  const pageSize = await select<PageSize>({
    message: "Page size:",
    choices: [
      { name: "Letter (8.5 × 11 in)", value: "Letter" },
      { name: "A4 (210 × 297 mm)",    value: "A4" },
    ],
    default: DEFAULT_PAGE_SIZE,
  });

  const outputPath = await input({
    message: "Output PDF file path:",
    default: "tube.pdf",
  });

  const options: TubeOptions = {
    diameter,
    length,
    overlap,
    pageSize,
    output: outputPath,
    name: nameInput || undefined,
    license: licenseInput || undefined,
    country: countryInput || undefined,
    labelColor,
    finCount,
    transitionLength,
    graphic,
  };

  console.log(chalk.dim("\n" + "─".repeat(36)));
  console.log(chalk.bold("  Summary"));
  console.log(chalk.dim("─".repeat(36)));
  console.log(`  Diameter:   ${chalk.cyan(options.diameter + " mm")} (inner)`);
  console.log(`  Length:     ${chalk.cyan(options.length + " mm")}`);
  console.log(`  Overlap:    ${chalk.cyan(options.overlap + " mm")}`);
  if (options.transitionLength)
    console.log(`  Transition: ${chalk.cyan(options.transitionLength + " mm")} (40 → 13 mm)`);
  if (options.name)     console.log(`  Name:       ${chalk.cyan(options.name)}`);
  if (options.license)  console.log(`  License:    ${chalk.cyan(options.license)}`);
  if (options.country)  console.log(`  Country:    ${chalk.cyan(options.country)}`);
  if (hasLabel)         console.log(`  Label color:${chalk.cyan(" " + options.labelColor!.name)}`);
  if (options.finCount) console.log(`  Fin marks:  ${chalk.cyan(options.finCount + " fins")}`);
  if (options.graphic)  console.log(`  Graphic:    ${chalk.cyan(options.graphic.format.toUpperCase())}`);
  console.log(`  Page size:  ${chalk.cyan(options.pageSize)}`);
  console.log(`  Output:     ${chalk.cyan(options.output)}`);
  console.log(chalk.dim("─".repeat(36)));

  const pattern = cylinderPattern(options.diameter, options.length, options.overlap);
  console.log(chalk.bold("\n" + formatPatternSummary(pattern)));

  const transitionPattern = options.transitionLength !== undefined
    ? frustumPattern(options.transitionLength, options.overlap)
    : undefined;
  if (transitionPattern) {
    console.log(chalk.bold("\n" + formatFrustumSummary(transitionPattern)));
  }

  const label = buildLabel(options.name, options.license, options.country);

  process.stdout.write(chalk.dim("\nGenerating PDF..."));
  const pdfBytes = await generateTubePdf(pattern, options.pageSize, label, options.labelColor, options.finCount, options.graphic, transitionPattern);
  await writeFile(options.output, pdfBytes);
  console.log(chalk.green(` done\n`));
  console.log(`  ${chalk.bold("PDF written to:")} ${chalk.cyan(options.output)}\n`);
}

main().catch((err) => {
  // Handle Ctrl+C gracefully
  if (err.name === "ExitPromptError") process.exit(0);
  console.error(chalk.red("Error:"), err.message);
  process.exit(1);
});

#!/usr/bin/env node

import { select, input, confirm, number } from "@inquirer/prompts";
import chalk from "chalk";
import { VALID_DIAMETERS, DEFAULT_OVERLAP_MM, type TubeDiameter, type TubeOptions } from "./types.js";
import { validatePositiveFloat, validatePositiveNumber, parsePositiveFloat } from "./validation.js";
import { cylinderPattern, formatPatternSummary, type FinCount } from "./geometry.js";
import { generateTubePdf, buildLabel } from "./pdf.js";
import { LABEL_COLORS, DEFAULT_LABEL_COLOR, type LabelColor } from "./colors.js";
import { writeFile } from "fs/promises";

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

  const outputPath = await input({
    message: "Output PDF file path:",
    default: "tube.pdf",
  });

  const options: TubeOptions = {
    diameter,
    length,
    overlap,
    output: outputPath,
    name: nameInput || undefined,
    license: licenseInput || undefined,
    country: countryInput || undefined,
    labelColor,
    finCount,
    transitionLength,
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
  console.log(`  Output:     ${chalk.cyan(options.output)}`);
  console.log(chalk.dim("─".repeat(36)));

  const pattern = cylinderPattern(options.diameter, options.length, options.overlap);
  console.log(chalk.bold("\n" + formatPatternSummary(pattern)));

  const label = buildLabel(options.name, options.license, options.country);

  process.stdout.write(chalk.dim("\nGenerating PDF..."));
  const pdfBytes = await generateTubePdf(pattern, "A4", label, options.labelColor, options.finCount);
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

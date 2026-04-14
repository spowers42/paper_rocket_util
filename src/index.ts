#!/usr/bin/env node

import { select, input, confirm, number } from "@inquirer/prompts";
import chalk from "chalk";
import { VALID_DIAMETERS, DEFAULT_OVERLAP_MM, type TubeDiameter, type TubeOptions } from "./types.js";
import { validatePositiveFloat, parsePositiveFloat } from "./validation.js";
import { cylinderPattern, formatPatternSummary } from "./geometry.js";

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
    validate: (n) => (n !== undefined && n > 0 ? true : "Please enter a positive number."),
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
        validate: (n) => (n !== undefined && n > 0 ? true : "Please enter a positive number."),
      }) as number;

    }
  }

  const nameInput = await input({ message: "Competitor name (leave blank to skip):" });
  const licenseInput = await input({ message: "License number (leave blank to skip):" });
  const countryInput = await input({ message: "Country (leave blank to skip):" });

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
  if (options.name)    console.log(`  Name:       ${chalk.cyan(options.name)}`);
  if (options.license) console.log(`  License:    ${chalk.cyan(options.license)}`);
  if (options.country) console.log(`  Country:    ${chalk.cyan(options.country)}`);
  console.log(`  Output:     ${chalk.cyan(options.output)}`);
  console.log(chalk.dim("─".repeat(36)));

  const pattern = cylinderPattern(options.diameter, options.length, options.overlap);
  console.log(chalk.bold("\n" + formatPatternSummary(pattern)));
  console.log(chalk.yellow("\n(PDF generation not yet implemented — Milestone 3)\n"));
}

main().catch((err) => {
  // Handle Ctrl+C gracefully
  if (err.name === "ExitPromptError") process.exit(0);
  console.error(chalk.red("Error:"), err.message);
  process.exit(1);
});

# Paper Rocket Utility — Project Milestones

## Overview

A TypeScript CLI utility that generates a printable PDF containing the flat-pattern layout for rolling paper tubes used in model rocketry competition. Supports standard motor mount diameters and FAI-spec transitions.

**Key design decisions:**
- All diameters are **inner diameter** (the bore that the motor fits into)
- Wall thickness is not modeled — competition tubes are single-wrap paper
- Flat-pattern width = π × inner diameter (one wrap closes exactly)
- Default overlap (glue seam) is **¼ inch (6.35 mm)**, user-overridable
- Language: TypeScript; PDF generation: `pdf-lib`; interactive prompts: `@inquirer/prompts`
- UX is fully interactive — no command-line flags, user is guided through all options step by step

---

## Milestone 1: Project Foundation

Set up the project skeleton and basic CLI argument parsing.

- Initialize TypeScript project with `commander` for argument parsing and `pdf-lib` as a dependency
- Implement CLI argument parsing for:
  - Tube diameter (enum: 13, 18, 24, 40 mm)
  - Tube length (mm, user-defined)
  - Overlap length (mm, default 6.35 mm / ¼ inch)
- Print parsed values to stdout to verify wiring

**Exit criteria:** `paper_rocket --diameter 18 --length 200` parses and echoes inputs without error; `--overlap` accepts a custom value and defaults to 6.35 mm.

---

## Milestone 2: Cylinder Flat-Pattern Geometry

Implement the geometry math to produce a correct flat pattern for a cylindrical tube.

- Calculate flat-pattern rectangle: width = π × inner diameter, height = tube length
- Add overlap strip along one long edge for gluing (user-specified, default ¼ inch)
- Add registration marks / cut lines
- Output dimensions to stdout for verification against known values

**Exit criteria:** Calculated flat-pattern dimensions match hand-computed values for all four diameters.

---

## Milestone 3: Basic PDF Output

Render the flat pattern as a printable PDF.

- Use `pdf-lib` for all PDF rendering
- Draw the tube rectangle with cut lines, fold lines, and overlap zone
- Scale to fit on standard page sizes (A4 and US Letter), tiling across multiple pages if the tube is long
- Write output to a user-specified file path (`--output tube.pdf`)

**Exit criteria:** Generated PDF opens correctly, dimensions are accurate when printed at 100% scale, and multi-page tiling works for long tubes.

---

## Milestone 4: User Information on the Tube

Print competition-required identification on the flat pattern.

- Add CLI inputs: `--name`, `--license`, `--country`
- Render name, license number, and country as text along the length of the tube pattern
- Choose font size and placement that remains legible after rolling (i.e. not in the overlap zone)

**Exit criteria:** User info appears on the printed pattern in a readable position that does not interfere with seams or cut lines.

---

## Milestone 5: FAI Transition Section (40 mm → 13 mm)

Generate the frustum (truncated cone) flat pattern required for FAI competition tubes.

- Add `--transition-length` CLI argument (only valid when `--diameter 40`)
- Calculate the annular-sector flat pattern for a cone frustum:
  - Slant height from transition length and radii difference
  - Inner and outer arc radii and sweep angle
- Render the transition pattern in the same PDF as the body tube, on its own page or section
- Include cut lines, overlap strip, and orientation marks

**Exit criteria:** Printed and assembled transition fits flush between a 40 mm body tube and a 13 mm tube with no gaps at the specified length.

---

## Milestone 6: Country Flag Graphics

Allow a country flag to be printed on the tube body.

- Bundle a set of vector or high-resolution flag images for common FAI-competing nations
- Add `--flag <country-code>` CLI option to select a flag by ISO 3166-1 alpha-2 code
- Scale and tile the flag image within the printable area of the tube pattern (avoiding overlap strip)

**Exit criteria:** Flag renders on the pattern without distortion and does not obscure text or cut lines.

---

## Milestone 7: Custom Graphics

Allow users to supply their own image to be printed on the tube.

- Add `--graphic <file>` CLI option accepting PNG or SVG input
- Scale and position the image within the tube's printable zone
- Provide a `--graphic-scale` option and/or interactive placement hints

**Exit criteria:** A user-supplied PNG or SVG appears correctly scaled on the printed pattern.

---

## Future Considerations

- GUI wrapper or web frontend
- Support for multi-wrap tube wall thickness (not needed for single-wrap competition tubes)
- Fin tab cutouts in the body tube pattern
- Nose cone patterns

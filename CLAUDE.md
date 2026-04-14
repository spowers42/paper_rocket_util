# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

All workflows are run via [Task](https://taskfile.dev/) (`brew install go-task`):

```bash
task dev          # run the program interactively (no build required)
task build        # compile TypeScript → dist/
task test         # run all unit tests
task test:watch   # run tests in watch mode
task lint         # lint source files
task clean        # remove dist/
task ci           # install → build → lint → test
```

To run a single test file:
```bash
npm test -- --testPathPattern=validation
```

## Architecture

The program is a fully interactive CLI — there are no command-line flags. The user is guided through all inputs via `@inquirer/prompts` prompts in sequence.

**Module responsibilities:**

- `src/types.ts` — all shared types and constants (`TubeDiameter`, `TubeOptions`, `VALID_DIAMETERS`, `DEFAULT_OVERLAP_MM`). The source of truth for domain values.
- `src/validation.ts` — pure functions for input validation (`isValidDiameter`, `parsePositiveFloat`, `validatePositiveFloat`). Kept separate from `index.ts` so they can be unit tested without mocking the prompt layer.
- `src/index.ts` — the prompt orchestration loop. Collects all user input, assembles a `TubeOptions` object, and will invoke PDF generation (not yet implemented).

**Key domain rules:**
- All diameters are **inner diameter** (the motor bore). Flat-pattern body width = `π × inner diameter`.
- Tubes are single-wrap — wall thickness is not modeled.
- Overlap strip is additive: total paper width = `(π × ID) + overlap`. Default overlap = 6.35 mm (¼ inch).
- The FAI transition (40 mm → 13 mm frustum/truncated cone) is only available when diameter is 40 mm. Its flat pattern is an annular sector.

**Tests** live in `src/__tests__/` and are excluded from the TypeScript build (`tsconfig.json` exclude list). Jest is configured to only scan `src/` (see `jest.config.js` `roots`).

# Paper Rocket Utility

A command-line tool that generates printable PDF flat-patterns for rolling competition model rocketry paper tubes. Supports standard motor mount diameters and FAI transition sections.

## Requirements

- [Node.js](https://nodejs.org/) v18 or later

## Installation

Download the latest `paper-rocket.mjs` from the [Releases](https://github.com/spowers42/paper_rocket_util/releases) page and run it directly — no install step required:

```bash
node paper-rocket.mjs
```

### Install from source

Requires [Task](https://taskfile.dev/) (`brew install go-task`):

```bash
git clone https://github.com/spowers42/paper_rocket_util.git
cd paper_rocket_util
task install
```

After linking, the `paper-rocket` command is available globally.

## Usage

Run the tool and follow the interactive prompts:

```bash
node paper-rocket.mjs
# or, if installed from source:
paper-rocket
```

During development, you can run without building first:

```bash
task dev
```

### Workflow

The tool guides you through the following steps:

1. **Tube inner diameter** — choose from 13, 18, 24, or 40 mm (40 mm is the FAI competition size)
2. **Tube length** — in millimetres
3. **Glue seam overlap width** — in millimetres, defaults to 6.35 mm (¼ inch)
4. **FAI transition** *(40 mm only)* — optionally add a transition section that tapers from 40 mm down to 13 mm; if yes, enter the transition length in millimetres
5. **Competitor name** — printed on the tube; leave blank to skip
6. **License number** — printed on the tube; leave blank to skip
7. **Country** — printed on the tube; leave blank to skip
8. **Output file path** — where to save the PDF, defaults to `tube.pdf`

A summary of your inputs is shown before the PDF is written.

### Tube Diameters

| Diameter | Use |
|---|---|
| 13 mm | Standard mini motor mount |
| 18 mm | Standard 18 mm motor mount |
| 24 mm | Standard 24 mm motor mount |
| 40 mm | FAI competition body tube |

### Flat-Pattern Geometry

All diameters are **inner diameter**. The flat-pattern body width is exactly `π × inner diameter`, so one wrap of paper closes the tube to the correct bore. The overlap strip is added beyond that circumference as a glue flap.

For FAI tubes (40 mm), an optional transition section can be generated. This is a truncated cone (frustum) that steps down from the 40 mm body tube to a 13 mm tube. Its flat pattern is an annular sector.

## Development

Common workflows are available via [Task](https://taskfile.dev/). Run `task` with no arguments to list them:

```
task dev                  # run the program without building (uses tsx)
task build                # compile TypeScript to dist/
task bundle               # bundle to a single paper-rocket.mjs for distribution
task test                 # run all unit tests
task test:watch           # run tests in watch mode
task lint                 # lint source files
task clean                # remove compiled output and bundle
task ci                   # full check: install → build → lint → test
task install              # install, build, and link for global use
```

Install Task via Homebrew: `brew install go-task`

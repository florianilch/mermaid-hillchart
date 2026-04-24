# Contributing

## Getting Started

Prerequisites: Node.js `>=24` and pnpm `11` (enforced by workspace settings).

```bash
pnpm install    # Install dependencies
pnpm build      # Generate DSL artifacts and build workspace
pnpm test       # Run all tests
```

_Note: Run `pnpm build` to generate parser artifacts after cloning, switching branches, or editing the grammar._

## Common Commands

```bash
pnpm test       # Run all unit and integration tests
pnpm lint       # Run standard linting
pnpm fmt        # Apply code formatting
```

## Targeted Workflows

```bash
pnpm --filter mermaid-hillchart build                 # Build diagram package
pnpm --filter mermaid-hillchart test                  # Run diagram tests
pnpm --filter mermaid-hillchart-dsl test              # Run DSL tests
pnpm --filter mermaid-hillchart-integration-tests test # Run integration tests
```

## Modifying the Grammar

To change the Hill Chart syntax:

1. Edit `packages/dsl/src/hillchart.langium`.
2. Run `pnpm --filter mermaid-hillchart-dsl build` to regenerate the parser.
3. Run `pnpm test` to verify changes.

## Rendering Constraints

The diagram renderer uses a fixed mathematical coordinate system rather than a dynamic layout engine. Follow this 3-phase rendering cycle:

1. **Measure:** Pre-measure all text elements via the DOM to get accurate dimensions.
2. **Compute:** Calculate pure mathematical geometry and resolve collisions entirely in-memory using those measurements.
3. **Construct:** Build the final SVG DOM elements _only_ after all geometry is finalized.

JavaScript owns geometry (coordinates, layout). CSS owns presentation (colors, strokes).

## Preflight Checks

Before submitting a pull request, run these gate checks:

```bash
pnpm fmt:check && pnpm lint && pnpm test
```

## Architecture Overview

- `packages/dsl`: The Langium grammar and generated parser (converts text to AST).
- `packages/diagram`: The Mermaid plugin (handles API integration, state, and SVG rendering).
- `tests/integration`: Black-box tests exercising the compiled diagram package against Mermaid.

## Questions?

Open a GitHub issue or start a discussion.

# Changelog

## [0.2.0](https://github.com/florianilch/mermaid-hillchart/releases/tag/v0.2.0) - 2026-04-25

Scopes can now define their own colors, making them easier to distinguish when several scopes appear on the same hill chart.

### What's New

- Adds optional hex colors to `scope` declarations, supporting short and long RGB/RGBA forms such as `#3b82f6`.

## [0.1.0](https://github.com/florianilch/mermaid-hillchart/releases/tag/v0.1.0) - 2026-04-24

`mermaid-hillchart` brings Shape Up hill charts to Mermaid, helping teams publish bet progress and momentum where they already build, explain, and review the work.

### What's New

- Added the `hillchart` diagram type for Mermaid, including DSL parsing and rendering for titled hill charts with scopes positioned on the uphill or downhill side of the chart.

### Technical Changes

- Added README and usage documentation.
- Added contributing documentation.
- Added GitHub Actions CI for build, test, lint, and production dependency audit checks.
- Added monthly Dependabot updates for GitHub Actions dependencies.
- Added integration tests that verify the built package can be loaded and rendered by Mermaid.
- Set up the initial project structure.

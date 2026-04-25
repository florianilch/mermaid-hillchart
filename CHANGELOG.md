# Changelog

## [0.5.0] - 2026-04-25

Hill charts now follow the hand-drawn look, matching Mermaid's sketch-style rendering, themes, and look settings.

### What's New

- Adds hand-drawn rendering support for curves, peaks, and scope markers when the hand-drawn look is selected.

### Technical Changes

- Updates README examples

## [0.4.0] - 2026-04-25

Publish bet progress and momentum directly in existing Mermaid-powered docs, with shorter syntax for scope updates.

### What's New

- Adds a browser-ready bundle for CDN and script-tag setups, making it easier to show bet progress and momentum across Mermaid-powered docs.

### Improvements

- Adds `up` and `down` aliases for `uphill` and `downhill`, keeping scope updates terse.

## [0.3.0] - 2026-04-25

This release improves readability for crowded hill charts and adds a way to distinguish scopes that have not started or have been cut.

### What's New

- Adds an `inactive` modifier for scopes that have not started or have been cut.

### Improvements

- Improves readability in crowded hill charts by staggering nearby scope markers while keeping labels and leader lines aligned.

### Technical Changes

- Fixes the README syntax example.
- Adds renderer and scope-dot behavior test coverage.

## [0.2.0] - 2026-04-25

Scopes can now define their own colors, making them easier to distinguish when several scopes appear on the same hill chart.

### What's New

- Adds optional hex colors to `scope` declarations, supporting short and long RGB/RGBA forms such as `#3b82f6`.

## 0.1.0 - 2026-04-24

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

[0.2.0]: https://github.com/florianilch/mermaid-hillchart/compare/v0.1.0...v0.2.0
[0.3.0]: https://github.com/florianilch/mermaid-hillchart/compare/v0.2.0...v0.3.0
[0.4.0]: https://github.com/florianilch/mermaid-hillchart/compare/v0.3.0...v0.4.0
[0.5.0]: https://github.com/florianilch/mermaid-hillchart/compare/v0.4.0...v0.5.0

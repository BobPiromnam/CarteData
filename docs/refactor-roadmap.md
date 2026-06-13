# Plotypus Refactor Roadmap

Plotypus is intentionally usable from `file://`, so refactors should preserve classic script loading unless the app moves behind a local dev server. Avoid switching to ES modules without validating local-file behavior in the target browsers.

## Current Direction

- Keep user-visible behavior stable while splitting large constants and UI assets out of `app.js`.
- Prefer small classic-script modules that publish a single `window.PLOTYPUS_*` namespace.
- Move pure functions toward testable files before moving stateful DOM/render code.
- Use `scheduleRender()` for expensive redraws triggered by UI controls, so sidebar/table interactions update before the map recomputes.

## Suggested Extraction Order

1. `icons.js`: toolbar and setting SVG path catalogue. Done.
2. `config.js`: size presets, CSV aliases, marker shape options, region presets, and JSON-backed department defaults. Done.
3. `geometry.js`: rectangle/segment helpers already covered by label geometry tests.
4. `label-layout.js`: candidate generation, scoring, side-band optimization, manual-position handling.
5. `map-renderer.js`: D3 drawing for map, markers, leaders, labels, legend, callouts.
6. `project-io.js`: CSV/project import/export and local storage preferences.

Each step should leave `app.js` as the orchestrator until enough state has been separated to introduce clearer controller objects.

# Plotypus

**Plotypus** is a static web app for creating publication-style maps from tabular project data. It renders project markers, outside labels, leader lines, legend markers, no-coordinate callouts, and region colour fills into exportable SVG and PNG outputs.

Plotypus is designed for low-friction local use by non-technical users, while still giving technical publishers and departments a configuration layer for their own page sizes, map styles, fonts, categories, colours, and sample data.

> [!NOTE]
> Plotypus intentionally supports direct `file://` use. Keep that constraint in mind before introducing build tools, ES modules, package managers, or server-only behavior.

## Table Of Contents

- [Status](#status)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [CSV Format](#csv-format)
- [Project Files](#project-files)
- [Map Labeling Principles](#map-labeling-principles)
- [Development Workflow](#development-workflow)
- [Smoke Testing](#smoke-testing)
- [Browser Verification](#browser-verification)
- [Accessibility And Print Quality](#accessibility-and-print-quality)
- [Privacy And Data Handling](#privacy-and-data-handling)
- [Offline And Internal-Network Deployment](#offline-and-internal-network-deployment)
- [Refactor Guidelines](#refactor-guidelines)
- [Commit And Release Checklist](#commit-and-release-checklist)
- [Known Limitations](#known-limitations)
- [License](#license)

## Status

| Area | Current State |
| --- | --- |
| App type | Static HTML/CSS/JavaScript |
| Entry point | `index.html` |
| Canonical local path | `C:\Users\itthi\Dev\fincan\Plotypus` |
| Primary branch | `main` |
| Build step | None required |
| Runtime upload behavior | App does not upload project data |
| Boundary data | Bundled local JavaScript wrappers with raw GeoJSON references |
| External dependencies | D3 and Papa Parse load from jsDelivr unless vendored locally |

## Quick Start

### For Users

1. Open `index.html` in Microsoft Edge.
2. Use **Project points** to add, paste, import, or edit project data.
3. Use **Map regions** to choose the boundary, included regions, and region fills.
4. Use **Legend and markers** to define marker categories, shapes, colours, and ordering.
5. Use **Map layout** to choose book size, image size, print label size, map size, marker size, line width, label max characters, and map font.
6. Open **Preview**.
7. Click **Run auto-place** when you want Plotypus to calculate label positions.
8. Drag labels, callouts, legend, or map scale controls for final adjustment.
9. Export SVG or PNG.

### Important Behavior

> [!IMPORTANT]
> **Run auto-place is explicit.** Resizing, moving map furniture, hiding the legend, or dragging labels should not silently recompute every label.

- Manual label positions are preserved until **Run auto-place** is clicked again.
- Rows with blank longitude or latitude become no-coordinate callouts.
- Rows with blank names and valid coordinates render markers without labels.
- Fixed-size output matters: if labels and map furniture need room, reducing map scale is often better than shrinking text.

### For Maintainers

Open from disk:

```powershell
Start-Process .\index.html
```

Serve locally when testing JSON configuration:

```powershell
python -m http.server 8000
```

Then open:

```text
http://localhost:8000/
```

> [!WARNING]
> Browsers usually block JavaScript from reading sibling JSON files under `file://`. Use a local/static server when testing `plotypus.config.json`.

## Project Structure

| Path | Purpose |
| --- | --- |
| `.gitignore` | Generated smoke-test outputs and browser profiles |
| `index.html` | App shell and script loading order |
| `style.css` | App-shell styling, layout, controls, animation, and responsive behavior |
| `app.js` | Main app controller, D3 map rendering, CSV/project I/O, label placement, interactions, and export logic |
| `config.js` | Bundled defaults and optional JSON config loader |
| `plotypus.config.json` | Department-editable JSON configuration for hosted/local-server use |
| `icons.js` | Shared SVG icon path catalogue for toolbar and settings controls |
| `presets.js` | Legacy style preset fallback kept for backward compatibility |
| `sample-projects.csv` | Editable CSV sample data |
| `assets/` | Boundary data, logo assets, and bundled fonts |
| `themes/` | Map theme CSS files |
| `tests/` | Unit and smoke-test helpers |
| `docs/configuration.md` | Configuration guide for departments and maintainers |
| `docs/refactor-roadmap.md` | Refactor direction and extraction plan |
| `docs/commit-description.md` | Historical context for the current feature commit |
| `artifacts/` | Design/review artifacts used while tuning visual treatments |

## Configuration

Plotypus has two configuration layers:

| Layer | File | Use Case |
| --- | --- | --- |
| Bundled fallback | `config.js` | Keeps `index.html` usable from `file://` |
| Department config | `plotypus.config.json` | Lets hosted/local-server deployments customize defaults without editing app code |

Use `plotypus.config.json` to customize:

- book sizes
- related image sizes
- default print label size
- default map scale
- default marker size
- default leader-line width
- label max characters
- map font options and font stylesheets
- legend category names and marker styles
- category colour presets
- map styles and region colour ramps
- sample rows

See [`docs/configuration.md`](docs/configuration.md) before changing the JSON schema or adding department-specific configuration.

## CSV Format

Recommended columns:

```csv
name,footnote,type,priority,lon,lat,hideLine
```

Required columns:

```csv
name,type,lon,lat
```

| Column | Description |
| --- | --- |
| `name` | Label text |
| `footnote` | Superscript marker when supplied |
| `type` | Legend/category name |
| `priority` | Integer from `0` to `5`; higher-priority labels are placed earlier |
| `lon` | Longitude in decimal degrees |
| `lat` | Latitude in decimal degrees |
| `hideLine` | Hides the leader line for truthy values |

Accepted `hideLine` values include:

```text
yes, true, hide, hidden, no line, no leader line
```

The importer accepts common aliases such as `project name`, `longitude`, `latitude`, `label priority`, and `project type`.

## Project Files

**Save project** exports a JSON file containing the full map state:

- boundary selection
- map style
- layout settings
- map size
- legend categories
- project rows
- region visibility
- region fills
- region values
- manual region colour overrides
- manual label positions
- manual legend/callout positions

Use project files when preserving a working map. Use CSV when exchanging only the project-point table with Excel or another data source.

## Map Labeling Principles

Plotypus uses local label-placement heuristics inspired by established cartographic and visualization practice:

- preserve readable minimum label size
- prefer clean outside-map label bands for dense maps
- keep leader lines short and direct
- reduce leader crossings
- avoid label, marker, furniture, and map-boundary overlaps
- preserve side ordering where possible
- place higher-priority labels earlier
- shrink the map when the fixed canvas cannot fit labels, legend, and callouts cleanly
- preserve manual adjustments until the user explicitly reruns auto-place

> [!TIP]
> The label engine improves common dense-map cases but does not guarantee perfect publication output. Always review final SVG/PNG exports.

## Development Workflow

Before editing:

```powershell
git status --short
```

Lightweight validation:

```powershell
node --check app.js
node --check config.js
node --check icons.js
node -e "JSON.parse(require('fs').readFileSync('plotypus.config.json','utf8')); console.log('plotypus.config.json ok')"
node tests\label-geometry.test.cjs
git diff --check
```

## Smoke Testing

Run the headless smoke test with Chrome or Edge:

```powershell
.\tests\run-smoke.ps1
```

Useful options:

```powershell
.\tests\run-smoke.ps1 -MapScale 90 -LabelSize 12 -LabelChars 24
.\tests\run-smoke.ps1 -SkipScreenshot
```

The smoke runner writes generated output under `tests/smoke-output/`, which is ignored by Git.

## Browser Verification

Use browser or screenshot verification for visual UI changes when available.

If browser automation fails with:

```text
windows sandbox failed: spawn setup refresh
```

treat it as an environment issue, not an app regression. Fall back to the lightweight checks above and rerun browser smoke tests when the sandbox issue is resolved.

## Accessibility And Print Quality

Maintain these expectations:

- Do not reduce map labels below the 12 px/pt readability target.
- Keep map style choices separate from app-shell branding.
- Preserve keyboard-accessible controls where practical.
- Use meaningful button labels and tooltips for icon buttons.
- Keep legends and no-coordinate callouts compact and readable.
- Verify high-contrast and neutral-print themes after style changes.
- Export and inspect SVG for final publication maps.

## Privacy And Data Handling

| Topic | Behavior |
| --- | --- |
| Project data | Stays in the local page unless the user exports or saves files |
| Uploads | The app does not upload map/project data |
| Boundary data | Bundled locally for `file://` use |
| CDN dependencies | D3 and Papa Parse load from jsDelivr unless vendored locally |
| Fonts | Lato is bundled locally in `assets/fonts/lato/` |

## Offline And Internal-Network Deployment

To make Plotypus fully offline/internal-network safe:

1. Download D3 into a local `vendor/` folder.
2. Download Papa Parse into the same `vendor/` folder.
3. Update `index.html` to load those local files before `presets.js`, `config.js`, `icons.js`, boundary data, and `app.js`.
4. Serve the folder over an internal static host if departments need `plotypus.config.json`.
5. Re-run the validation commands and smoke tests.

## Refactor Guidelines

Plotypus intentionally supports direct `file://` use. Preserve classic script loading unless the project formally moves behind a local dev server or build step.

Current preferred extraction order:

1. `geometry.js` for rectangle and segment helpers.
2. `label-layout.js` for candidate generation, scoring, side-band optimization, and manual-position handling.
3. `map-renderer.js` for D3 drawing.
4. `project-io.js` for CSV/project import/export and storage preferences.

Keep behavior stable while extracting modules. Add or update tests before changing label-placement logic.

## Commit And Release Checklist

Before committing:

```powershell
git status --short
node --check app.js
node --check config.js
node --check icons.js
node tests\label-geometry.test.cjs
git diff --check
```

Before sharing with another department:

- [ ] Confirm `plotypus.config.json` loads from the intended hosting path.
- [ ] Confirm required fonts and theme CSS paths exist.
- [ ] Confirm sample data is non-sensitive and department-appropriate.
- [ ] Confirm D3 and Papa Parse are either allowed CDN dependencies or vendored locally.
- [ ] Export one SVG and one PNG from the target environment.
- [ ] Run the smoke test when browser automation is available.

## Known Limitations

- Auto-placement reduces overlap and crossings but does not replace final cartographic review.
- JSON configuration is not reliably loaded under `file://`; use a local/static server for JSON-backed department customization.
- D3 and Papa Parse are still external CDN dependencies unless vendored locally.
- Visual smoke testing depends on a working Chrome or Edge installation and may be blocked by local sandbox/browser setup.

## License

See [`LICENSE`](LICENSE).

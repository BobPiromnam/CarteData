Improve Plotypus label placement, UI polish, branding, tests, and department configuration

## Detailed Commit Body

This commit continues the Plotypus rename work by turning the app into a more polished, configurable, and testable map-labeling tool. The largest changes are in the auto-place label workflow, preview/map layout controls, department-level configuration, smoke/unit test infrastructure, and app branding/UI.

## Research And Design Rationale

The auto-place work was guided by a review of mapping-labeling approaches from open-source libraries, plotting tools, cartographic practice, and optimization research. The goal was not to add a large dependency, because Plotypus needs to remain a static app that can open from `file://`, but to adopt the useful ideas that fit the current D3/SVG implementation.

Research threads considered:

- Mapbox GL / MapLibre-style symbol placement: use collision detection, candidate anchors, viewport-aware placement, and avoid automatic repositioning unless the user explicitly requests it.
- D3 labeler and simulated-annealing approaches: use scoring functions and iterative/local optimization ideas for dense maps instead of one naive greedy pass.
- `ggrepel` / `adjustText`-style force relaxation: treat labels as rectangles that should repel each other, preserve readable leader lines, and avoid overlap with important geometry.
- `labelgun` and canvas/WebGL collision approaches: rely on fast bounding-box rejection and collision indexes, while avoiding dependency overhead for this static SVG app.
- QGIS/ArcGIS/cartographic production principles: prefer outside-map label bands for dense point maps, keep label order consistent along each side, reduce leader crossings, keep leaders short and direct, preserve manual edits, and use visual hierarchy/legibility before maximizing map scale.
- General cartography and geologic map design practice: do not let labels obscure the map unnecessarily, keep legend and no-coordinate callouts compact, maintain a minimum readable label size, and reduce the map when the fixed output canvas cannot fit the required label/leader/legend space.

The resulting approach keeps the implementation local and dependency-free while borrowing the practical ideas: candidate generation, rectangle geometry, leader-line crossing checks, outside perimeter label slots, side-band ordering, priority-based placement, leader-length quality gates, compact map furniture, and testable quality metrics.

## Discussion-Derived Context

This branch was driven by repeated visual reviews of the Preview tab against a designer-provided reference map. The recurring problem was that the map could technically render all labels, but the result did not read like a professional publication map when the canvas was reduced: labels crowded the Canada geography, leaders crossed heavily, the legend consumed too much space, and some labels were pushed near or beyond the canvas edge.

The discussion established several product/design constraints:

- Plotypus is a fixed-output map tool, not an infinite pan/zoom web map. If labels, callouts, and legend cannot fit around the geography at the chosen page size, the correct response is often to reduce the map scale rather than keep forcing labels into the map.
- Minimum text size matters. The label engine should not solve crowding by making labels unreadably small; 12 px/pt became the working lower bound.
- Auto-placement should be explicit. The user should be able to drag labels, resize the map, hide legend/callouts, and move furniture without the app silently recomputing all label positions unless `Run auto-place` is clicked.
- Manual edits are valuable. Once a label has been manually dragged, the app should preserve that user intent until the user explicitly reruns auto-place.
- The output needs to follow professional map-making conventions: clean outside labels, clear visual hierarchy, short/direct leaders, minimal crossings, compact legends, readable callouts, and restrained map furniture.

The research thread explored whether existing libraries, CLIs, APIs, MCP tools, Python libraries, JavaScript libraries, or open-source map-labeling projects should be adopted directly. The conclusion was to borrow algorithms and heuristics rather than embed a heavy dependency. The static-file constraint, D3/SVG rendering path, custom legend/callout furniture, and print-canvas requirements made a direct drop-in replacement unlikely to fit. The useful pieces from that research were translated into local implementation patterns:

- candidate anchors and collision filtering instead of random placement
- side bands and outside perimeter slots instead of only placing labels near points
- scoring penalties for label overlap, marker overlap, leader crossings, map overlap, furniture overlap, wrong-side placement, and excessive leader length
- local optimization/relaxation concepts for dense cases
- priority sorting for important labels
- quality gates that can reduce map scale when the layout cannot meet readable-spacing constraints
- smoke metrics that quantify what had previously been judged only by looking at screenshots

The discussion also identified that testing and tooling were part of the product problem. The team repeatedly needed to verify "what the map actually looks like," but the in-app browser was unreliable because of a Windows sandbox startup failure. That led to two tracks:

- focused unit tests for geometry and label-layout rules that can run without a browser
- a separate headless browser smoke runner that can produce screenshots and quality metrics when Chrome/Edge is available

The UI/UX changes came from observing friction while tuning labels:

- resizing the map caused long pauses, so render scheduling and dashed map-size previews were added
- snap-to-grid made dragging feel stuck, so it was removed
- hidden legend/callout toggles were causing unnecessary repositioning, so simple display changes were made lighter
- repeated top-right Preview settings needed clearer icons and less redundancy
- clearing the project table was dangerous, so a confirmation was added
- legend category ordering needed to scale beyond two items, so drag-to-reorder replaced up/down buttons

The branding/configuration work came later as the app became more shareable. Once the official Plotypus logo and earthier app-shell direction were settled, the app needed department-level customization without asking every team to edit `app.js`. That led to the JSON configuration layer, local font handling, theme separation, and docs explaining how other departments can set their own sizes, labels, colours, styles, and sample data.

## Auto-Place Labeling And Map Layout

- Added a denser label-placement engine with perimeter/outside-map candidates, side-band ordering, collision penalties, leader crossing checks, and reserved furniture avoidance.
- Added geometry helpers for rectangle overlap, segment crossing, segment-rectangle intersection, candidate scoring, and perimeter feasibility.
- Added per-label `priority` support so important labels can be placed earlier and receive cleaner positions.
- Preserved manual label positions after drag edits while allowing explicit `Run auto-place` to clear/recompute automatic placement.
- Added long-leader quality handling and map-scale reduction logic so fixed-size canvases can shrink the geography when labels need more surrounding space.
- Added optional elbow/routed leader behavior for dense clusters.
- Added compact legend/no-coordinate callout sizing and show/hide behavior that does not unnecessarily trigger full auto-placement.
- Added visual quality metrics to smoke output, including max/average leader length, longest leader label, minimum label gap, labels near canvas edge, overlap counts, and leader crossing counts.
- Enforced a minimum readable label size target of 12 px/pt in the smoke quality checks.

## UI, UX, And Performance

- Reworked the tab/table toolbar layout to reduce Preview-tab redundancy and move related controls into tab-specific top-right actions.
- Added icons to ribbon and preview controls, including more intuitive preview-setting icons and a custom lock marker icon.
- Changed `Auto-place labels` to an explicit top-level `Run auto-place` action so resize/move/show-hide interactions do not unexpectedly recompute labels.
- Added a render scheduler and preview loading state so expensive redraws are deferred and the UI can update first.
- Added map-scale drag controls that show a dashed preview box rather than fully redrawing the map continuously while resizing.
- Removed snap-to-grid behavior that could make label dragging feel stuck.
- Added deselect behavior when clicking off the canvas.
- Added a confirmation prompt for `Clear table`.
- Replaced legend marker up/down buttons with drag-to-reorder behavior and delayed redraws for expensive category changes.
- Persisted book/image size preferences across refresh.
- Tightened legend and no-coordinate callout spacing, and changed map callout/legend boxes to square corners for print-map consistency.

## Branding, Theme, And Offline Assets

- Rebranded the UI around Plotypus with a new platypus/map-pin style logo asset and SVG mark.
- Added favicon/logo assets and a Plotypus loading animation with a back-and-forth route motion.
- Bundled Lato font files locally to reduce font flash and improve `file://` behavior.
- Updated the app colour scheme toward earthier neutral tones while keeping map styling separate from app-shell styling.
- Added or revised map theme CSS files for GoC green, GoC blue, neutral print, and high contrast.
- Added a quieter triangle-pattern background treatment and preview artifacts for background review.

## Department Configuration

- Added `config.js` as a classic-script configuration bridge that publishes `window.PLOTYPUS_CONFIG`.
- Added `plotypus.config.json` as the department-editable configuration file for hosted/local-server deployments.
- Made configuration cover book sizes, related image sizes, print label defaults, marker defaults, line width, label max characters, map fonts, category names/styles, colour presets, map styles, and sample rows.
- Added JSON alias mapping so publisher-friendly keys like `bookSizes`, `fonts`, `defaults`, `mapStyles`, and `categories` map into the internal app config.
- Kept `file://` compatibility by falling back to bundled defaults in `config.js` when browsers block sibling JSON loading.
- Added `docs/configuration.md` explaining customization, font loading, map styles, and the `file://` limitation.
- Kept `presets.js` as a backward-compatible style preset fallback.

## Refactor And Maintainability

- Extracted SVG icon path data into `icons.js`.
- Extracted static app defaults into `config.js`.
- Added `docs/refactor-roadmap.md` with the next extraction targets: geometry helpers, label layout, map renderer, and project I/O.
- Added a test-mode API surface for pure label geometry/layout functions.
- Kept classic script loading to preserve direct `index.html` usage.

## Tests And Smoke Infrastructure

- Added focused unit tests for:
  - rectangle overlap and overlap area
  - segment crossing and segment-rectangle intersection
  - candidate scoring penalties
  - reserved furniture avoidance
  - long cross-map leader rejection
  - perimeter candidate generation and feasibility
  - ordered side-band optimization
  - manual-position preservation
- Added a PowerShell smoke-test runner that can launch Edge/Chrome headlessly, dump DOM output, capture screenshots, and enforce label quality thresholds.
- Added smoke HTML for exercising the map-label layout in a repeatable browser context.
- Added `.gitignore` entries for smoke-test browser profiles and generated smoke outputs.

## Verification

Current lightweight verification used during the work:

- `node --check app.js`
- `node --check config.js`
- `node --check icons.js`
- JSON parse check for `plotypus.config.json`
- `node tests\label-geometry.test.cjs`
- `git diff --check`

The in-app browser smoke path is still blocked in this environment by the known Windows sandbox startup failure:

```text
windows sandbox failed: spawn setup refresh
```

Treat that as an environment issue rather than an app regression. Browser/screenshot verification should be rerun once the sandbox setup is fixed.

## Notes Before Committing

- Review whether generated preview artifacts under `artifacts/` should be committed or kept as local review material.
- `tests/smoke-output/` is generated output and should remain ignored.
- Consider splitting this into smaller commits later if a cleaner history is needed: label engine, UI/branding, config/refactor, and tests.

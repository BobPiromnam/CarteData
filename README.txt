Plotypus

What this is
------------
Plotypus is a local static web app for creating maps with project points, outside labels, leader lines, legend markers and region colour fills.

It is designed for non-technical users:
1. Open index.html in Microsoft Edge.
2. Use the Map regions table to choose the map boundary, include regions and adjust fills.
3. Set legend markers and map style.
4. Import CSV data, paste from Excel, load sample data, or open a saved project file.
5. Review the Project points table and Map regions table.
6. Auto-place labels, make manual adjustments if needed, then export SVG or PNG.

Files
-----
index.html - App shell.
style.css - App styling.
presets.js - Developer-editable map style, region colour and category colour presets.
app.js - D3 map logic, CSV handling, label placement, project save/load and export.
sample-projects.csv - Sample data that can be edited in Excel.
assets/ - Local boundary GeoJSON and JavaScript-wrapped fallback data.
themes/ - CSS theme files used by map style presets.

CSV format
----------
Recommended columns:
name,footnote,type,lon,lat,hideLine

Required columns:
name,type,lon,lat

Accepted type values are based on the current legend marker names. The sample file uses:
Referred Project
Transformative Strategy

Rows with a blank lon or lat become callout items instead of map points.
Rows with a blank name and valid lon/lat show a marker without a label.
Footnotes must be letters or numbers to render as label superscripts.
Use hideLine values such as yes, true or no leader line to hide a leader line.

Project files
-------------
Save project exports a JSON file with the map boundary, map style, layout settings, legend categories, project rows, region visibility, region fills, region values, manual region colour overrides and manual label/box positions.

Use project files when you want to preserve the full map state. Use CSV when you only need to exchange the project-point table with Excel.

Online and local resources
--------------------------
This app can run by opening index.html directly in Microsoft Edge. Boundary data is bundled locally in JavaScript wrapper files so it works under file:// without local-fetch CORS errors:
- assets/canada-regions.js
- assets/world-countries.js

The raw GeoJSON files are also included for reference or hosted use:
- assets/canada-regions.geojson
- assets/world-countries.geojson

When opened from file://, Plotypus uses the bundled local boundary data first. When served over http:// or https://, it tries the online boundary source first and falls back to bundled local boundary data if the online source is blocked.

The app still loads these online resources unless they are vendored locally:
- D3 from jsDelivr
- Papa Parse from jsDelivr
- Lato from Google Fonts

Offline improvement
-------------------
To make the app fully offline and internal-network safe, download D3, Papa Parse and Lato into a local vendor folder and update index.html to load the local files before app.js.

Known limitations
-----------------
The label engine uses outside rails, sorting and collision checks. It reduces crossings and overlaps but does not guarantee a perfect publication layout every time. For final print, export SVG and do a final review.

No server is required.
No install is required.
No data is uploaded by the app, except that current index.html loads external library and Lato font files from the web unless those files are vendored locally.

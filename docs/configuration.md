# Plotypus Configuration

Plotypus has two configuration layers:

1. `plotypus.config.json` is the department-editable configuration file for hosted or local-server use.
2. `config.js` contains the bundled fallback defaults so `index.html` still opens directly from `file://`.

Browsers usually block JavaScript from reading a sibling JSON file when `index.html` is opened directly from disk. For JSON customization, serve the folder from a simple local/static web server or host the app internally. If the JSON cannot be loaded, Plotypus falls back to the defaults embedded in `config.js`.

## Common Edits

- `fonts`: Add font choices for the Map font dropdown. Use `stylesheet` when the font needs a local CSS file with `@font-face` rules.
- `defaults`: Set default book size, image size, print label size, map scale, marker size, line width and label max characters.
- `bookSizes`: Define the Book size dropdown and each related Image size option.
- `categories`: Set default legend marker/category names, shapes, colours, marker sizes and line widths.
- `categoryColourPresets`: Set the approved marker colour dropdown values.
- `mapStyles`: Set map style names, theme CSS files, region colour ramps and default category styles.
- `sampleRows`: Replace the built-in sample table loaded by the sample-data buttons.

## Adding A Font

1. Put the font files under `assets/fonts/<font-name>/`.
2. Create a CSS file with `@font-face` declarations.
3. Add a `fonts` entry:

```json
{
  "label": "Department Sans",
  "value": "Department Sans, Arial, sans-serif",
  "stylesheet": "assets/fonts/department-sans/department-sans.css"
}
```

## Adding A Map Style

1. Create a CSS file in `themes/`.
2. Add a `mapStyles` entry with a unique key.
3. Set `defaultMapStylePreset` to that key if it should be selected by default.

```json
{
  "defaultMapStylePreset": "department-green",
  "mapStyles": {
    "department-green": {
      "label": "Department green",
      "stylesheet": "themes/department-green.css",
      "regionColours": ["#dcebe4", "#94c2aa", "#217346"],
      "categoryStyles": [
        { "colour": "#444444", "stroke": "#ffffff", "markerSize": 10, "lineWidth": 2 },
        { "colour": "#ffffff", "stroke": "#555555", "markerSize": 10, "lineWidth": 2 }
      ]
    }
  }
}
```

Arrays replace the bundled defaults. Objects merge with bundled defaults.

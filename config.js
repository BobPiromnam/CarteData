(function () {
  const fallbackRegionColours = ["#c7ded5", "#96c6b4", "#6caf94", "#078c70"];

  const defaultConfig = {
    configPath: "plotypus.config.json",
    defaultFontFamily: "Lato, Segoe UI, Arial, sans-serif",
    defaultMapStylePreset: "goc-green",
    fontOptions: [
      {
        label: "Lato",
        value: "Lato, Segoe UI, Arial, sans-serif",
        stylesheet: "assets/fonts/lato/lato.css?v=20260612-file-fonts"
      },
      {
        label: "Segoe UI",
        value: "Segoe UI, Arial, sans-serif"
      },
      {
        label: "Arial",
        value: "Arial, sans-serif"
      }
    ],
    boundarySources: {
      canada: {
        label: "Canada provinces and territories",
        url: "https://data.opendatasoft.com/api/explore/v2.1/catalog/datasets/georef-canada-province%40public/exports/geojson?lang=en&timezone=America%2FToronto",
        fallbackUrl: "assets/canada-regions.geojson",
        fallbackKey: "canada",
        projection: "canada"
      },
      world: {
        label: "World countries",
        url: "https://datahub.io/core/geo-boundaries-world-110m/_r/-/countries.geojson",
        fallbackUrl: "assets/world-countries.geojson",
        fallbackKey: "world",
        projection: "world"
      }
    },
    sampleRows: [
      { name: "Grays Bay Road and Port", type: "Referred Project", lon: -108.4, lat: 68.5 },
      { name: "Arctic Economic and Security Corridor", type: "Referred Project", lon: -112.5, lat: 64.5 },
      { name: "Mackenzie Valley Highway", type: "Referred Project", lon: -124.0, lat: 65.5 },
      { name: "Red Chris Mine Expansion", type: "Referred Project", lon: -129.9, lat: 57.7 },
      { name: "Ksi Lisims LNG", type: "Referred Project", lon: -130.1, lat: 55.1 },
      { name: "North Coast Transmission Line", type: "Referred Project", lon: -128.0, lat: 54.9 },
      { name: "LNG Canada Phase 2", type: "Referred Project", lon: -128.65, lat: 54.05 },
      { name: "Northwest Critical Conservation Corridor", type: "Transformative Strategy", lon: -130.0, lat: 58.2 },
      { name: "Pathways Plus", type: "Transformative Strategy", lon: -111.4, lat: 56.7 },
      { name: "McIlvenna Bay Copper Mine", type: "Referred Project", lon: -103.9, lat: 54.5 },
      { name: "Crawford Nickel", type: "Referred Project", lon: -81.33, lat: 48.47 },
      { name: "Darlington New Nuclear Project", type: "Referred Project", lon: -78.72, lat: 43.87 },
      { name: "Nouveau Monde Graphite's Matawinie Mine", type: "Referred Project", lon: -73.92, lat: 46.68 },
      { name: "Contrecoeur Terminal Container Project", type: "Transformative Strategy", lon: -73.23, lat: 45.85 },
      { name: "Northcliff Resources' Sisson Mine", type: "Referred Project", lon: -67.25, lat: 46.35 },
      { name: "Wind West Atlantic Energy", type: "Transformative Strategy", lon: -63.2, lat: 45.0 },
      { name: "Iqaluit Hydro", type: "Referred Project", lon: -68.52, lat: 63.75 },
      { name: "Port of Churchill Plus", type: "Transformative Strategy", lon: -94.17, lat: 58.77 },
      { name: "Taltson Hydro Expansion Project", type: "Referred Project", lon: -111.0, lat: 60.5 },
      { name: "Alto High-Speed Rail, Ontario-Quebec Corridor", type: "Transformative Strategy", lon: -74.5, lat: 45.8 },
      { name: "Critical Minerals Strategy", type: "Transformative Strategy", lon: "", lat: "" }
    ],
    fallbackRegionColours,
    mapStylePresets: {
      "goc-green": {
        label: "GoC green",
        stylesheet: "themes/goc-green.css?v=20260612-map-only",
        regionColours: fallbackRegionColours,
        categoryStyles: [
          { colour: "#444444", stroke: "#ffffff", markerSize: 10, lineWidth: 2 },
          { colour: "#ffffff", stroke: "#555555", markerSize: 10, lineWidth: 2 },
          { colour: "#0b6b57", stroke: "#ffffff", markerSize: 10, lineWidth: 2 }
        ]
      },
      "goc-blue": {
        label: "GoC blue",
        stylesheet: "themes/goc-blue.css?v=20260612-map-only",
        regionColours: ["#d7e5f5", "#9dbbe0", "#26374a"],
        categoryStyles: [
          { colour: "#26374a", stroke: "#ffffff", markerSize: 10, lineWidth: 2 },
          { colour: "#ffffff", stroke: "#26374a", markerSize: 10, lineWidth: 2 },
          { colour: "#1c578a", stroke: "#ffffff", markerSize: 10, lineWidth: 2 }
        ]
      },
      "neutral-print": {
        label: "Neutral print",
        stylesheet: "themes/neutral-print.css?v=20260612-map-only",
        regionColours: ["#efefef", "#d8d8d8", "#bdbdbd"],
        categoryStyles: [
          { colour: "#222222", stroke: "#ffffff", markerSize: 10, lineWidth: 2 },
          { colour: "#ffffff", stroke: "#222222", markerSize: 10, lineWidth: 2 },
          { colour: "#777777", stroke: "#ffffff", markerSize: 10, lineWidth: 2 }
        ]
      },
      "high-contrast": {
        label: "High contrast",
        stylesheet: "themes/high-contrast.css?v=20260612-map-only",
        regionColours: ["#ffffff", "#d8d8d8", "#000000"],
        categoryStyles: [
          { colour: "#000000", stroke: "#ffffff", markerSize: 11, lineWidth: 3 },
          { colour: "#ffffff", stroke: "#000000", markerSize: 11, lineWidth: 3 },
          { colour: "#b00000", stroke: "#ffffff", markerSize: 11, lineWidth: 3 }
        ]
      }
    },
    csvColumnAliases: {
      name: ["name", "project", "project name"],
      footnote: ["footnote", "footnote marker", "note", "superscript"],
      type: ["type", "category", "project type"],
      priority: ["priority", "label priority", "importance", "rank"],
      lon: ["lon", "longitude", "long"],
      lat: ["lat", "latitude"],
      hideLine: ["hide line", "hide lines", "hideline", "no line", "no leader line"]
    },
    tableFields: ["name", "footnote", "type", "priority", "lon", "lat"],
    layoutDefaults: {
      bookSizeInput: "wide-map",
      imageSizeInput: "full",
      labelSizeInput: 12,
      mapScaleInput: 100,
      markerSizeInput: 10,
      lineWidthInput: 2,
      labelCharsInput: 24
    },
    storageKeys: {
      activeTable: "plotypus.activeTable",
      layoutPreferences: "plotypus.layoutPreferences"
    },
    dataTableNames: ["projects", "regions", "preview"],
    imageSizePresets: {
      "wide-map": {
        label: "Wide map",
        sizes: [
          { value: "full", label: "Full page", width: 1000, height: 620 },
          { value: "two-thirds", label: "2/3 page", width: 1000, height: 430 },
          { value: "half", label: "1/2 page", width: 1000, height: 310 },
          { value: "third", label: "1/3 page", width: 1000, height: 210 },
          { value: "quarter", label: "1/4 page", width: 1000, height: 160 }
        ]
      },
      "letter-landscape": {
        label: "11 x 8.5",
        sizes: [
          { value: "full", label: "Full page", width: 792, height: 570 },
          { value: "two-thirds", label: "2/3 page", width: 792, height: 395 },
          { value: "half", label: "1/2 page", width: 792, height: 285 },
          { value: "third", label: "1/3 page", width: 792, height: 190 },
          { value: "quarter", label: "1/4 page", width: 792, height: 145 }
        ]
      },
      letter: {
        label: "8.5 x 11",
        sizes: [
          { value: "full", label: "Full page", width: 612, height: 750 },
          { value: "two-thirds", label: "2/3 page", width: 612, height: 520 },
          { value: "half", label: "1/2 page", width: 612, height: 390 },
          { value: "third", label: "1/3 page", width: 612, height: 260 },
          { value: "quarter", label: "1/4 page", width: 612, height: 200 }
        ]
      },
      compact: {
        label: "6.5 x 9.75",
        sizes: [
          { value: "full", label: "Full page", width: 468, height: 700 },
          { value: "two-thirds", label: "2/3 page", width: 468, height: 468 },
          { value: "half", label: "1/2 page", width: 468, height: 350 },
          { value: "third", label: "1/3 page", width: 468, height: 235 },
          { value: "quarter", label: "1/4 page", width: 468, height: 175 }
        ]
      }
    },
    regionPresetOptions: {
      canada: [
        { value: "", label: "Choose preset" },
        { value: "all", label: "All Canada" },
        { value: "territories", label: "Territories" },
        { value: "western", label: "Western Canada" },
        { value: "prairies", label: "Prairies" },
        { value: "central", label: "Central Canada" },
        { value: "atlantic", label: "Atlantic Canada" }
      ],
      world: [
        { value: "", label: "Choose continent" },
        { value: "all", label: "All countries" },
        { value: "africa", label: "Africa" },
        { value: "antarctica", label: "Antarctica" },
        { value: "asia", label: "Asia" },
        { value: "europe", label: "Europe" },
        { value: "north-america", label: "North America" },
        { value: "oceania", label: "Oceania" },
        { value: "south-america", label: "South America" }
      ]
    },
    markerShapes: [
      { value: "circle", label: "Circle" },
      { value: "square", label: "Square" },
      { value: "diamond", label: "Diamond" },
      { value: "triangle-up", label: "Triangle up" },
      { value: "triangle-down", label: "Triangle down" },
      { value: "star", label: "Star" },
      { value: "plus", label: "Plus" },
      { value: "cross", label: "Cross" }
    ],
    categoryColourPresets: [
      { value: "", label: "Custom" },
      { value: "#26374a", label: "GoC blue" },
      { value: "#284162", label: "Deep blue" },
      { value: "#1c578a", label: "Accessible blue" },
      { value: "#217346", label: "Excel green" },
      { value: "#0b6b57", label: "Map green" },
      { value: "#7834bc", label: "Purple" },
      { value: "#a05a00", label: "Ochre" },
      { value: "#d3080c", label: "Alert red" },
      { value: "#444444", label: "Charcoal" },
      { value: "#ffffff", label: "White" }
    ],
    categorySettings: [
      {
        id: "referred",
        label: "Referred Project",
        defaultLabel: "Referred Project",
        shape: "circle",
        colour: "#444444",
        stroke: "#ffffff",
        markerSize: 10,
        lineWidth: 2,
        markerSizeCustom: false,
        lineWidthCustom: false,
        collapsed: false,
        removable: false
      },
      {
        id: "strategy",
        label: "Transformative Strategy",
        defaultLabel: "Transformative Strategy",
        shape: "square",
        colour: "#ffffff",
        stroke: "#555555",
        markerSize: 10,
        lineWidth: 2,
        markerSizeCustom: false,
        lineWidthCustom: false,
        collapsed: false,
        removable: true
      }
    ]
  };

  function isPlainObject(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }

  function deepMerge(base, override) {
    if (Array.isArray(override)) return override.slice();
    if (!isPlainObject(override)) return override === undefined ? base : override;
    const merged = { ...(isPlainObject(base) ? base : {}) };
    Object.keys(override).forEach((key) => {
      merged[key] = deepMerge(merged[key], override[key]);
    });
    return merged;
  }

  function normalizeExternalConfig(config) {
    if (!isPlainObject(config)) return {};
    const normalized = { ...config };
    if (config.defaults) normalized.layoutDefaults = deepMerge(normalized.layoutDefaults, mapLayoutDefaults(config.defaults));
    if (config.bookSizes) normalized.imageSizePresets = config.bookSizes;
    if (config.mapStyles) normalized.mapStylePresets = config.mapStyles;
    if (config.categories) normalized.categorySettings = config.categories;
    if (config.fonts) normalized.fontOptions = config.fonts;
    return normalized;
  }

  function mapLayoutDefaults(defaults) {
    return {
      bookSizeInput: defaults.bookSize || defaults.bookSizeInput,
      imageSizeInput: defaults.imageSize || defaults.imageSizeInput,
      labelSizeInput: defaults.printLabelSize || defaults.labelSizeInput,
      mapScaleInput: defaults.mapScale || defaults.mapScaleInput,
      markerSizeInput: defaults.defaultMarkerSize || defaults.markerSizeInput,
      lineWidthInput: defaults.defaultLineWidth || defaults.lineWidthInput,
      labelCharsInput: defaults.labelMaxChars || defaults.labelCharsInput
    };
  }

  function loadFontStylesheets(config) {
    const fonts = Array.isArray(config.fontOptions) ? config.fontOptions : [];
    fonts.forEach((font) => {
      if (!font || !font.stylesheet || document.querySelector(`link[href="${font.stylesheet}"]`)) return;
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = font.stylesheet;
      document.head.appendChild(link);
    });
  }

  async function loadExternalConfig(baseConfig) {
    const configPath = window.PLOTYPUS_CONFIG_PATH || baseConfig.configPath;
    const canFetchConfig = configPath && window.location.protocol !== "file:";
    if (!canFetchConfig || !window.fetch) return baseConfig;

    try {
      const response = await window.fetch(configPath, { cache: "no-store" });
      if (!response.ok) throw new Error(`Config request failed: ${response.status}`);
      const externalConfig = normalizeExternalConfig(await response.json());
      return deepMerge(baseConfig, externalConfig);
    } catch (error) {
      console.warn(`Plotypus config: using bundled defaults because ${configPath} could not be loaded.`, error);
      return baseConfig;
    }
  }

  window.PLOTYPUS_CONFIG = defaultConfig;
  window.PLOTYPUS_CONFIG_READY = loadExternalConfig(defaultConfig).then((config) => {
    window.PLOTYPUS_CONFIG = config;
    loadFontStylesheets(config);
    return config;
  });
})();

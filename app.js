(function () {
  if (!window.d3) {
    const message = "CarteData could not start because D3 did not load. Check network access or vendor D3 locally before opening this file offline.";
    const statusBox = document.querySelector("#statusBox");
    const mapSvg = document.querySelector("#mapSvg");
    if (statusBox) statusBox.innerHTML = `<div class="status-danger">${message}</div>`;
    if (mapSvg) {
      mapSvg.setAttribute("viewBox", "0 0 900 360");
      mapSvg.innerHTML = `<rect width="900" height="360" fill="#fff7e6"></rect><text x="450" y="180" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700" fill="#8a1f11">${message}</text>`;
    }
    return;
  }

  const boundarySources = {
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
  };

  const sampleRows = [
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
  ];

  // Safety defaults only. Policy-editable colours belong in presets.js.
  const fallbackRegionColours = ["#c7ded5", "#96c6b4", "#6caf94", "#078c70"];

  const mapStylePresets = window.MAP_APP_STYLE_PRESETS || {
    "goc-green": {
      label: "GoC green",
      stylesheet: "themes/goc-green.css",
      regionColours: fallbackRegionColours,
      categoryStyles: [
        { colour: "#444444", stroke: "#ffffff", markerSize: 10, lineWidth: 2 },
        { colour: "#ffffff", stroke: "#555555", markerSize: 10, lineWidth: 2 }
      ]
    }
  };

  const csvColumnAliases = {
    name: ["name", "project", "project name"],
    footnote: ["footnote", "footnote marker", "note", "superscript"],
    type: ["type", "category", "project type"],
    lon: ["lon", "longitude", "long"],
    lat: ["lat", "latitude"],
    hideLine: ["hide line", "hide lines", "hideline", "no line", "no leader line"]
  };

  const tableFields = ["name", "footnote", "type", "lon", "lat"];

  const layoutDefaults = {
    widthInput: 1600,
    heightInput: 1000,
    labelSizeInput: 16,
    markerSizeInput: 10,
    lineWidthInput: 2,
    labelCharsInput: 26
  };

  const markerShapes = [
    { value: "circle", label: "Circle" },
    { value: "square", label: "Square" },
    { value: "diamond", label: "Diamond" },
    { value: "triangle-up", label: "Triangle up" },
    { value: "triangle-down", label: "Triangle down" },
    { value: "star", label: "Star" },
    { value: "plus", label: "Plus" },
    { value: "cross", label: "Cross" }
  ];

  const colourPresets = window.MAP_APP_CATEGORY_COLOUR_PRESETS || [
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
  ];

  const iconPaths = {
    "folder-open": [
      '<path d="M3 7.5V6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v1.5"/>',
      '<path d="M3.6 18.5 5.2 10h16l-1.6 8.5a2 2 0 0 1-2 1.5h-12a2 2 0 0 1-2-1.5Z"/>'
    ],
    save: [
      '<path d="M5 3h12l2 2v16H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/>',
      '<path d="M7 3v6h9V3"/>',
      '<path d="M7 21v-7h10v7"/>'
    ],
    table: [
      '<rect x="3" y="4" width="18" height="16" rx="2"/>',
      '<path d="M3 10h18"/>',
      '<path d="M9 4v16"/>',
      '<path d="M15 4v16"/>'
    ],
    upload: [
      '<path d="M12 16V4"/>',
      '<path d="m7 9 5-5 5 5"/>',
      '<path d="M4 20h16"/>'
    ],
    download: [
      '<path d="M12 4v12"/>',
      '<path d="m7 11 5 5 5-5"/>',
      '<path d="M4 20h16"/>'
    ],
    wand: [
      '<path d="m14 4 6 6"/>',
      '<path d="m5 19 9-9"/>',
      '<path d="m13 5 6 6"/>',
      '<path d="M5 5h2"/>',
      '<path d="M6 4v2"/>',
      '<path d="M19 17h2"/>',
      '<path d="M20 16v2"/>'
    ],
    "svg-file": [
      '<path d="M6 3h8l4 4v14H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/>',
      '<path d="M14 3v5h5"/>',
      '<path d="M8 15h2l1 2 1-2h2"/>'
    ],
    image: [
      '<rect x="3" y="5" width="18" height="14" rx="2"/>',
      '<circle cx="8" cy="10" r="1.5"/>',
      '<path d="m21 16-5-5L5 19"/>'
    ]
  };

  const categorySettings = [
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
  ];

  const els = {
    tableBody: document.querySelector("#projectTable tbody"),
    regionTableBody: document.querySelector("#regionTable tbody"),
    tablePanelTitle: document.querySelector("#tablePanelTitle"),
    projectTableTab: document.querySelector("#projectTableTab"),
    regionTableTab: document.querySelector("#regionTableTab"),
    projectTablePane: document.querySelector("#projectTablePane"),
    regionTablePane: document.querySelector("#regionTablePane"),
    updateRegionValuesBtn: document.querySelector("#updateRegionValuesBtn"),
    applyRegionValueColoursBtn: document.querySelector("#applyRegionValueColoursBtn"),
    resetRegionValuesBtn: document.querySelector("#resetRegionValuesBtn"),
    themeStylesheet: document.querySelector("#themeStylesheet"),
    csvInput: document.querySelector("#csvInput"),
    projectInput: document.querySelector("#projectInput"),
    loadSampleBtn: document.querySelector("#loadSampleBtn"),
    downloadCsvBtn: document.querySelector("#downloadCsvBtn"),
    saveProjectBtn: document.querySelector("#saveProjectBtn"),
    ribbonOpenProjectBtn: document.querySelector("#ribbonOpenProjectBtn"),
    ribbonSaveProjectBtn: document.querySelector("#ribbonSaveProjectBtn"),
    ribbonLoadSampleBtn: document.querySelector("#ribbonLoadSampleBtn"),
    ribbonImportCsvBtn: document.querySelector("#ribbonImportCsvBtn"),
    ribbonExportCsvBtn: document.querySelector("#ribbonExportCsvBtn"),
    ribbonAutoPlaceBtn: document.querySelector("#ribbonAutoPlaceBtn"),
    ribbonExportSvgBtn: document.querySelector("#ribbonExportSvgBtn"),
    ribbonExportPngBtn: document.querySelector("#ribbonExportPngBtn"),
    addRowBtn: document.querySelector("#addRowBtn"),
    deleteSelectedBtn: document.querySelector("#deleteSelectedBtn"),
    clearRowsBtn: document.querySelector("#clearRowsBtn"),
    renderBtn: document.querySelector("#renderBtn"),
    exportSvgBtn: document.querySelector("#exportSvgBtn"),
    exportPngBtn: document.querySelector("#exportPngBtn"),
    mapTitleInput: document.querySelector("#mapTitleInput"),
    widthInput: document.querySelector("#widthInput"),
    heightInput: document.querySelector("#heightInput"),
    labelSizeInput: document.querySelector("#labelSizeInput"),
    markerSizeInput: document.querySelector("#markerSizeInput"),
    lineWidthInput: document.querySelector("#lineWidthInput"),
    labelCharsInput: document.querySelector("#labelCharsInput"),
    fontFamilyInput: document.querySelector("#fontFamilyInput"),
    showLegendInput: document.querySelector("#showLegendInput"),
    showCalloutsInput: document.querySelector("#showCalloutsInput"),
    showLineCasingInput: document.querySelector("#showLineCasingInput"),
    lockMarkerCoordinatesInput: document.querySelector("#lockMarkerCoordinatesInput"),
    categoryList: document.querySelector("#categoryList"),
    addCategoryBtn: document.querySelector("#addCategoryBtn"),
    regionSummary: document.querySelector("#regionSummary"),
    selectAllRegionsBtn: document.querySelector("#selectAllRegionsBtn"),
    clearRegionsBtn: document.querySelector("#clearRegionsBtn"),
    selectProjectRegionsBtn: document.querySelector("#selectProjectRegionsBtn"),
    resetRegionColoursBtn: document.querySelector("#resetRegionColoursBtn"),
    boundaryInput: document.querySelector("#boundaryInput"),
    mapStylePresetInput: document.querySelector("#mapStylePresetInput"),
    regionPresetInput: document.querySelector("#regionPresetInput"),
    svg: d3.select("#mapSvg"),
    statusBox: document.querySelector("#statusBox")
  };

  let canadaGeo = null;
  let lastLayout = null;
  let lastImportMessages = [];
  let manualLabelPositions = {};
  let manualBoxPositions = {};
  let pendingCsvImport = null;
  let nextRowId = 1;
  let regionVisibility = {};
  let regionFills = {};
  let regionValues = {};
  let regionColourOverrides = {};
  let currentMapStylePreset = "goc-green";
  let currentBoundary = "canada";

  function getMapStylePreset(presetId = currentMapStylePreset) {
    return mapStylePresets[presetId] || mapStylePresets["goc-green"];
  }

  function getCurrentRegionColourSet() {
    const preset = getMapStylePreset();
    return preset.regionColours && preset.regionColours.length ? preset.regionColours : fallbackRegionColours;
  }

  function cleanType(type) {
    const raw = String(type || "").trim().toLowerCase();
    const matchedCategory = categorySettings.find(category => {
      const label = category.label.trim().toLowerCase();
      const defaultLabel = category.defaultLabel.trim().toLowerCase();
      return raw === category.id || raw === label || raw === defaultLabel;
    });
    if (matchedCategory) return matchedCategory.id;
    if ((raw === "strategy" || raw === "transformative" || raw.includes("transformative")) && hasCategory("strategy")) return "strategy";
    return getDefaultCategory().id;
  }

  function getCategory(type) {
    return categorySettings.find(category => category.id === cleanType(type)) || getDefaultCategory();
  }

  function getDefaultCategory() {
    return categorySettings.find(category => category.id === "referred") || categorySettings[0];
  }

  function hasCategory(categoryId) {
    return categorySettings.some(category => category.id === categoryId);
  }

  function renderRibbonIcons() {
    document.querySelectorAll("[data-icon]").forEach(button => {
      const icon = iconPaths[button.dataset.icon];
      if (!icon || button.querySelector(".button-icon")) return;
      const label = button.textContent.trim();
      button.innerHTML = `
        <svg class="button-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          ${icon.join("")}
        </svg>
        <span>${escapeHtml(label)}</span>
      `;
    });
  }

  function getCategoryLabel(type) {
    return getCategory(type).label;
  }

  function getTypeOptions(selectedType) {
    return categorySettings.map(category => {
      const selected = cleanType(selectedType) === category.id ? " selected" : "";
      return `<option value="${escapeHtml(category.id)}"${selected}>${escapeHtml(category.label)}</option>`;
    }).join("");
  }

  function updateTypeOptions() {
    Array.from(els.tableBody.querySelectorAll(".type-input")).forEach(select => {
      const selectedType = cleanType(select.value);
      select.innerHTML = getTypeOptions(selectedType);
      select.value = selectedType;
    });
  }

  function makeCategoryId(label) {
    const base = String(label || "category")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "category";
    let candidate = base;
    let index = 2;
    while (categorySettings.some(category => category.id === candidate)) {
      candidate = `${base}-${index}`;
      index += 1;
    }
    return candidate;
  }

  function normalizeMarkerShape(shape) {
    return markerShapes.some(option => option.value === shape) ? shape : "circle";
  }

  function optionalNumber(value) {
    if (value === "" || value === null || value === undefined) return "";
    const n = Number(value);
    return Number.isFinite(n) ? n : "";
  }

  function getCategoryMarkerSize(category, settings) {
    return optionalNumber(category.markerSize) || settings.markerSize;
  }

  function getCategoryLineWidth(category, settings) {
    return optionalNumber(category.lineWidth) || settings.lineWidth;
  }

  function normalizeCategorySizes(category, settings = getSettings()) {
    category.markerSize = optionalNumber(category.markerSize) || settings.markerSize;
    category.lineWidth = optionalNumber(category.lineWidth) || settings.lineWidth;
  }

  function syncDefaultCategorySizes(settings = getSettings()) {
    categorySettings.forEach(category => {
      if (!category.markerSizeCustom) category.markerSize = settings.markerSize;
      if (!category.lineWidthCustom) category.lineWidth = settings.lineWidth;
    });
  }

  function getPresetValueForColour(colour) {
    const preset = colourPresets.find(option => option.value.toLowerCase() === String(colour || "").toLowerCase());
    return preset ? preset.value : "";
  }

  function renderCategoryEditors() {
    const settings = getSettings();
    categorySettings.forEach(category => normalizeCategorySizes(category, settings));
    els.categoryList.innerHTML = categorySettings.map(category => `
      <div class="category-editor${category.collapsed ? " is-collapsed" : ""}" data-category-id="${escapeHtml(category.id)}">
        <div class="category-header">
          <button class="toggle-category-btn icon-button" type="button" data-category-id="${escapeHtml(category.id)}" aria-label="${category.collapsed ? "Expand" : "Collapse"} ${escapeHtml(category.label)}">${category.collapsed ? "▸" : "▾"}</button>
          <div class="category-title-block">
            <span class="category-swatch">${getCategorySwatchSvg(category)}</span>
            <strong title="${escapeHtml(category.label)}">${escapeHtml(category.label)}</strong>
          </div>
          <div class="category-actions">
            <button class="move-category-btn icon-button" type="button" data-category-id="${escapeHtml(category.id)}" data-direction="up" aria-label="Move ${escapeHtml(category.label)} up"${categorySettings.indexOf(category) === 0 ? " disabled" : ""}>↑</button>
            <button class="move-category-btn icon-button" type="button" data-category-id="${escapeHtml(category.id)}" data-direction="down" aria-label="Move ${escapeHtml(category.label)} down"${categorySettings.indexOf(category) === categorySettings.length - 1 ? " disabled" : ""}>↓</button>
            ${category.removable ? `<button class="remove-category-btn icon-button" type="button" data-category-id="${escapeHtml(category.id)}" aria-label="Remove ${escapeHtml(category.label)}">×</button>` : ""}
          </div>
        </div>
        <div class="category-body category-form">
        <label class="category-name-field">
          Category name
          <input class="category-label-input" type="text" value="${escapeHtml(category.label)}" />
        </label>
          <label>
            Marker
            <select class="category-shape-input">
              ${markerShapes.map(shape => `<option value="${shape.value}"${category.shape === shape.value ? " selected" : ""}>${shape.label}</option>`).join("")}
            </select>
          </label>
          <label>
            Colour preset
            <select class="category-preset-input">
              ${colourPresets.map(preset => `<option value="${preset.value}"${getPresetValueForColour(category.colour) === preset.value ? " selected" : ""}>${preset.label}</option>`).join("")}
            </select>
          </label>
          <label>
            Custom colour
            <input class="category-colour-input" type="color" value="${escapeHtml(category.colour)}" />
          </label>
          <label>
            Marker size
            <input class="category-marker-size-input" type="number" min="4" max="30" step="1" value="${category.markerSize}" />
          </label>
          <label>
            Line width
            <input class="category-line-width-input" type="number" min="1" max="10" step="0.5" value="${category.lineWidth}" />
          </label>
        </div>
      </div>
    `).join("");
  }

  function toNumber(value) {
    if (value === null || value === undefined || value === "") return "";
    const n = Number(String(value).trim());
    return Number.isFinite(n) ? n : "";
  }

  function toBoolean(value) {
    if (value === true || value === false) return value;
    const raw = String(value || "").trim().toLowerCase();
    return ["1", "true", "yes", "y", "hide", "hidden", "no line", "no leader line"].includes(raw);
  }

  function normalizeFootnote(value) {
    return String(value || "").trim();
  }

  function getRenderableFootnote(value) {
    const footnote = normalizeFootnote(value);
    return /^[A-Za-z0-9]+$/.test(footnote) ? footnote : "";
  }

  function normalizeHeader(value) {
    return String(value || "").trim().toLowerCase();
  }

  function getField(row, aliases) {
    const directKey = aliases.find(alias => Object.prototype.hasOwnProperty.call(row, alias));
    if (directKey) return row[directKey];

    const keys = Object.keys(row);
    const matchedKey = keys.find(key => aliases.includes(normalizeHeader(key)));
    return matchedKey ? row[matchedKey] : undefined;
  }

  function normalizeRow(row) {
    return {
      rowId: row && row.rowId ? String(row.rowId) : "",
      name: String(getField(row, csvColumnAliases.name) || "").trim(),
      footnote: normalizeFootnote(getField(row, csvColumnAliases.footnote)),
      type: cleanType(getField(row, csvColumnAliases.type) || getDefaultCategory().label),
      lon: toNumber(getField(row, csvColumnAliases.lon)),
      lat: toNumber(getField(row, csvColumnAliases.lat)),
      hideLine: toBoolean(getField(row, csvColumnAliases.hideLine))
    };
  }

  function setRows(rows, importMessages = [], options = {}) {
    pendingCsvImport = null;
    lastImportMessages = importMessages;
    if (!options.preserveManualPositions) {
      manualLabelPositions = {};
      manualBoxPositions = {};
    }
    nextRowId = 1;
    els.tableBody.innerHTML = "";
    rows.forEach(row => addRow(normalizeRow(row)));
    updateDeleteButtonState();
    if (canadaGeo && Array.isArray(canadaGeo.features)) applyRegionColoursByValue(false);
    if (options.render !== false) render();
  }

  function addRow(row = { name: "", footnote: "", type: "referred", lon: "", lat: "", hideLine: false }) {
    const tr = document.createElement("tr");
    const rowId = row.rowId ? String(row.rowId) : String(nextRowId);
    tr.dataset.rowId = rowId;
    const numericRowId = Number(rowId);
    nextRowId = Number.isFinite(numericRowId) ? Math.max(nextRowId, numericRowId + 1) : nextRowId + 1;
    tr.innerHTML = `
      <td><input class="name-input" type="text" value="${escapeHtml(row.name || "")}" title="${escapeHtml(row.name || "")}" aria-label="Project name"></td>
      <td><input class="footnote-input" type="text" value="${escapeHtml(row.footnote || "")}" aria-label="Footnote marker" maxlength="2" pattern="[A-Za-z0-9]*"></td>
      <td>
        <select class="type-input" title="${escapeHtml(getCategoryLabel(row.type))}" aria-label="Project type">
          ${getTypeOptions(row.type)}
        </select>
      </td>
      <td><input class="lon-input" type="number" step="any" value="${row.lon === "" ? "" : row.lon}" aria-label="Longitude"></td>
      <td><input class="lat-input" type="number" step="any" value="${row.lat === "" ? "" : row.lat}" aria-label="Latitude"></td>
      <td class="line-cell"><input type="checkbox" class="hide-line-input" aria-label="Hide leader line"${row.hideLine ? " checked" : ""}></td>
      <td class="select-cell"><input type="checkbox" class="row-select" aria-label="Select row for deletion"></td>
    `;
    tr.querySelector(".type-input").value = cleanType(row.type);
    tr.querySelectorAll("input,select").forEach(input => input.addEventListener("change", () => {
      updateRowTitles(tr);
      refreshRegionColoursFromRows();
      render();
    }));
    tr.querySelectorAll("input[type='text'],input[type='number']").forEach(input => input.addEventListener("input", debounce(() => {
      updateRowTitles(tr);
      refreshRegionColoursFromRows();
      render();
    }, 350)));
    tr.querySelector(".row-select").addEventListener("change", updateDeleteButtonState);
    els.tableBody.appendChild(tr);
    updateDeleteButtonState();
    return tr;
  }

  function refreshRegionColoursFromRows() {
    if (!canadaGeo || !Array.isArray(canadaGeo.features)) return;
    applyRegionColoursByValue(false);
  }

  function updateRowTitles(tr) {
    tr.querySelector(".name-input").title = tr.querySelector(".name-input").value.trim();
    tr.querySelector(".type-input").title = getCategoryLabel(tr.querySelector(".type-input").value);
  }

  function getTableRows() {
    return Array.from(els.tableBody.querySelectorAll("tr"));
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function getRows() {
    return getTableRows().map(tr => ({
      rowId: tr.dataset.rowId,
      name: tr.querySelector(".name-input").value.trim(),
      footnote: normalizeFootnote(tr.querySelector(".footnote-input").value),
      type: cleanType(tr.querySelector(".type-input").value),
      lon: toNumber(tr.querySelector(".lon-input").value),
      lat: toNumber(tr.querySelector(".lat-input").value),
      hideLine: tr.querySelector(".hide-line-input").checked
    })).filter(row => row.name.length > 0 || row.lon !== "" || row.lat !== "");
  }

  function getSettings() {
    return {
      width: Number(els.widthInput.value) || 1600,
      height: Number(els.heightInput.value) || 1000,
      title: els.mapTitleInput.value.trim(),
      labelSize: Number(els.labelSizeInput.value) || 16,
      markerSize: Number(els.markerSizeInput.value) || 10,
      lineWidth: Number(els.lineWidthInput.value) || 2,
      labelMaxChars: Number(els.labelCharsInput.value) || 26,
      fontFamily: els.fontFamilyInput.value || "Lato, Arial, Helvetica, sans-serif",
      showLegend: els.showLegendInput.checked,
      showCallouts: els.showCalloutsInput.checked,
      showLineCasing: els.showLineCasingInput.checked,
      lockMarkerCoordinates: els.lockMarkerCoordinatesInput.checked
    };
  }

  function applySettings(settings = {}) {
    if (settings.title !== undefined) els.mapTitleInput.value = settings.title;
    if (settings.width !== undefined) els.widthInput.value = settings.width;
    if (settings.height !== undefined) els.heightInput.value = settings.height;
    if (settings.labelSize !== undefined) els.labelSizeInput.value = settings.labelSize;
    if (settings.markerSize !== undefined) els.markerSizeInput.value = settings.markerSize;
    if (settings.lineWidth !== undefined) els.lineWidthInput.value = settings.lineWidth;
    if (settings.labelMaxChars !== undefined) els.labelCharsInput.value = settings.labelMaxChars;
    if (settings.fontFamily !== undefined) els.fontFamilyInput.value = settings.fontFamily;
    if (settings.showLegend !== undefined) els.showLegendInput.checked = Boolean(settings.showLegend);
    if (settings.showCallouts !== undefined) els.showCalloutsInput.checked = Boolean(settings.showCallouts);
    if (settings.showLineCasing !== undefined) els.showLineCasingInput.checked = Boolean(settings.showLineCasing);
    if (settings.lockMarkerCoordinates !== undefined) els.lockMarkerCoordinatesInput.checked = Boolean(settings.lockMarkerCoordinates);
  }

  function getRegionName(feature, index) {
    const props = feature && feature.properties ? feature.properties : {};
    return normalizeRegionName(props.name || props.NAME || props.Name || props.ADMIN || props.admin || props.sovereignt || props.SOVEREIGNT || props.prov_name_en || props.prov_name || props.province_name || props.PRENAME || props.PRNAME || props.territory || props.province, index);
  }

  function normalizeRegionName(value, index) {
    if (Array.isArray(value)) return normalizeRegionName(value[0], index);
    if (value && typeof value === "object") {
      const objectValue = value.en || value.EN || value.name || value.label || Object.values(value).find(item => typeof item === "string");
      return normalizeRegionName(objectValue, index);
    }
    const name = String(value || "").trim();
    return name || `Region ${index + 1}`;
  }

  function getRegionId(feature, index) {
    return String(getRegionName(feature, index)).trim();
  }

  function getVisibleGeo() {
    if (!canadaGeo) return null;
    return {
      ...canadaGeo,
      features: canadaGeo.features.filter((feature, index) => regionVisibility[getRegionId(feature, index)] !== false)
    };
  }

  function getHiddenRegionForPoint(lon, lat) {
    if (!canadaGeo || !Array.isArray(canadaGeo.features)) return "";
    const hiddenFeatureIndex = canadaGeo.features.findIndex((feature, index) => {
      if (regionVisibility[getRegionId(feature, index)] !== false) return false;
      return d3.geoContains(feature, [lon, lat]);
    });
    return hiddenFeatureIndex >= 0 ? getRegionName(canadaGeo.features[hiddenFeatureIndex], hiddenFeatureIndex) : "";
  }

  function getRegionIdForPoint(lon, lat) {
    if (!canadaGeo || !Array.isArray(canadaGeo.features)) return "";
    const featureIndex = canadaGeo.features.findIndex(feature => d3.geoContains(feature, [lon, lat]));
    return featureIndex >= 0 ? getRegionId(canadaGeo.features[featureIndex], featureIndex) : "";
  }

  function initializeRegionVisibility() {
    if (!canadaGeo || !Array.isArray(canadaGeo.features)) return;
    const colours = getCurrentRegionColourSet();
    canadaGeo.features.forEach((feature, index) => {
      const id = getRegionId(feature, index);
      if (regionVisibility[id] === undefined) regionVisibility[id] = true;
      if (!regionFills[id]) regionFills[id] = colours[index % colours.length];
    });
  }

  function getRegionFill(feature, index) {
    const colours = getCurrentRegionColourSet();
    return regionFills[getRegionId(feature, index)] || colours[index % colours.length];
  }

  function getRegionColourPresetLabel(index, total) {
    if (total <= 1) return "Colour 1";
    if (index === 0) return `Colour ${index + 1} - lowest`;
    if (index === total - 1) return `Colour ${index + 1} - highest`;
    return `Colour ${index + 1}`;
  }

  function getRegionRows() {
    if (!canadaGeo || !Array.isArray(canadaGeo.features)) return [];
    return canadaGeo.features
      .map((feature, index) => ({
        feature,
        index,
        id: getRegionId(feature, index),
        name: getRegionName(feature, index)
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  function getProjectRegionCounts(rows = getRows()) {
    const counts = {};
    rows.forEach(row => {
      if (row.lon === "" || row.lat === "") return;
      const regionId = getRegionIdForPoint(Number(row.lon), Number(row.lat));
      if (!regionId) return;
      counts[regionId] = (counts[regionId] || 0) + 1;
    });
    return counts;
  }

  function normalizeRegionValue(value) {
    if (value === "" || value === null || value === undefined) return "";
    const numberValue = Number(String(value).trim());
    return Number.isFinite(numberValue) ? numberValue : "";
  }

  function getRegionTableRows() {
    const counts = getProjectRegionCounts();
    return getRegionRows().map(region => {
      const count = counts[region.id] || 0;
      const hasManualValue = Object.prototype.hasOwnProperty.call(regionValues, region.id);
      const storedValue = hasManualValue ? normalizeRegionValue(regionValues[region.id]) : count;
      return {
        ...region,
        count,
        value: storedValue,
        valueSource: hasManualValue ? "Manual" : "Project count",
        colourSource: regionColourOverrides[region.id] ? "Manual" : "Auto by value",
        included: regionVisibility[region.id] !== false,
        colour: getRegionFill(region.feature, region.index)
      };
    });
  }

  function getColourForRegionValue(value, allValues, colours = getCurrentRegionColourSet()) {
    const numericValue = normalizeRegionValue(value);
    if (numericValue === "" || !colours.length) return colours[0] || "#c7ded5";

    const numericValues = allValues
      .map(normalizeRegionValue)
      .filter(item => item !== "");
    if (!numericValues.length) return colours[0] || "#c7ded5";

    const min = Math.min(...numericValues);
    const max = Math.max(...numericValues);
    if (min === max) return numericValue > 0 ? colours[colours.length - 1] : colours[0];

    const ratio = (numericValue - min) / (max - min);
    const colourIndex = Math.max(0, Math.min(colours.length - 1, Math.round(ratio * (colours.length - 1))));
    return colours[colourIndex];
  }

  function applyRegionColoursByValue(shouldRender = true) {
    if (!canadaGeo || !Array.isArray(canadaGeo.features)) return;
    const regions = getRegionTableRows();
    const includedValues = regions
      .filter(region => region.included)
      .map(region => region.value);
    const comparisonValues = includedValues.length ? includedValues : regions.map(region => region.value);
    regions.forEach(region => {
      if (!regionColourOverrides[region.id]) {
        regionFills[region.id] = getColourForRegionValue(region.value, comparisonValues);
      }
    });
    renderRegionControls();
    renderRegionValueTable();
    if (shouldRender) render();
  }

  function updateRegionValuesFromProjectPoints(options = {}) {
    if (!canadaGeo || !Array.isArray(canadaGeo.features)) return;
    const shouldSelectRegions = options.selectRegions !== false;
    const counts = getProjectRegionCounts();
    regionValues = {};

    getRegionRows().forEach(region => {
      const count = counts[region.id] || 0;
      if (shouldSelectRegions) regionVisibility[region.id] = count > 0;
    });

    applyRegionColoursByValue(false);
    render();
    setStatusMessage(`Updated region colours from project counts in ${Object.keys(counts).length} region(s). Manual region values were cleared.`, "ok");
  }

  function resetRegionValues() {
    regionValues = {};
    applyRegionColoursByValue(false);
    render();
    setStatusMessage("Region values reset. The table now shows project counts as default values.", "ok");
  }

  function renderRegionValueTable() {
    if (!els.regionTableBody) return;
    if (!canadaGeo || !Array.isArray(canadaGeo.features)) {
      els.regionTableBody.innerHTML = `<tr><td colspan="8" class="empty-table-message">Map boundary must load before region values can be edited.</td></tr>`;
      return;
    }

    const rows = getRegionTableRows();
    const approvedColours = getCurrentRegionColourSet();
    els.regionTableBody.innerHTML = rows.map(region => `
      <tr>
        <td><span class="region-table-name" title="${escapeHtml(region.name)}">${escapeHtml(region.name)}</span></td>
        <td class="region-included-cell">
          <input class="region-table-included-input" type="checkbox" data-region-id="${escapeHtml(region.id)}" aria-label="Include ${escapeHtml(region.name)}"${region.included ? " checked" : ""}>
        </td>
        <td class="region-count-cell">${region.count}</td>
        <td>
          <input class="region-value-input" type="number" step="any" value="${region.value === "" ? "" : region.value}" data-region-id="${escapeHtml(region.id)}" aria-label="${escapeHtml(region.name)} region colour value">
        </td>
        <td class="region-source-cell">${escapeHtml(region.valueSource)}</td>
        <td>
          <select class="region-colour-set-input" data-region-id="${escapeHtml(region.id)}" aria-label="${escapeHtml(region.name)} approved fill colour">
            <option value=""${region.colourSource === "Auto by value" ? " selected" : ""}>Auto by value</option>
            ${approvedColours.map((colour, index) => `<option value="${escapeHtml(colour)}"${region.colourSource !== "Auto by value" && String(region.colour).toLowerCase() === colour.toLowerCase() ? " selected" : ""}>${escapeHtml(getRegionColourPresetLabel(index, approvedColours.length))}</option>`).join("")}
          </select>
        </td>
        <td>
          <input class="region-colour-input" type="color" value="${escapeHtml(region.colour)}" aria-label="${escapeHtml(region.name)} fill colour" data-region-id="${escapeHtml(region.id)}">
        </td>
        <td>
          <span class="region-fill-preview">
            <span class="region-fill-swatch" style="background:${escapeHtml(region.colour)}"></span>
            <span>${escapeHtml(region.colour)}</span>
          </span>
        </td>
      </tr>
    `).join("");
  }

  function renderRegionControls() {
    if (!canadaGeo || !Array.isArray(canadaGeo.features)) {
      els.regionSummary.textContent = "";
      renderRegionValueTable();
      return;
    }

    els.regionPresetInput.disabled = currentBoundary !== "canada";
    els.regionPresetInput.title = currentBoundary === "canada" ? "" : "Region presets are currently Canada-specific.";
    initializeRegionVisibility();
    const regions = getRegionRows();
    const selectedCount = regions.filter(region => regionVisibility[region.id] !== false).length;
    els.regionSummary.textContent = `${selectedCount} of ${regions.length} regions selected.`;
    renderRegionValueTable();
  }

  function setAllRegions(visible) {
    if (!canadaGeo || !Array.isArray(canadaGeo.features)) return;
    canadaGeo.features.forEach((feature, index) => {
      regionVisibility[getRegionId(feature, index)] = visible;
    });
    renderRegionControls();
    render();
  }

  function getRegionPresetNames(preset) {
    const groups = {
      all: [],
      territories: ["yukon", "northwest territories", "nunavut"],
      western: ["british columbia", "alberta", "saskatchewan", "manitoba"],
      prairies: ["alberta", "saskatchewan", "manitoba"],
      central: ["ontario", "quebec"],
      atlantic: ["newfoundland", "labrador", "prince edward island", "nova scotia", "new brunswick"]
    };
    return groups[preset] || [];
  }

  function regionMatchesPreset(name, presetNames) {
    const normalizedName = String(name || "").toLowerCase();
    return presetNames.some(presetName => normalizedName.includes(presetName));
  }

  function applyRegionPreset(preset) {
    if (!canadaGeo || !Array.isArray(canadaGeo.features) || !preset) return;
    if (preset === "all") {
      setAllRegions(true);
      return;
    }

    const presetNames = getRegionPresetNames(preset);
    canadaGeo.features.forEach((feature, index) => {
      const id = getRegionId(feature, index);
      const name = getRegionName(feature, index);
      regionVisibility[id] = regionMatchesPreset(name, presetNames);
    });
    renderRegionControls();
    render();
  }

  function applyRegionColourSet(colours = getCurrentRegionColourSet(), shouldRender = true) {
    if (!canadaGeo || !Array.isArray(canadaGeo.features)) return;
    canadaGeo.features.forEach((feature, index) => {
      regionFills[getRegionId(feature, index)] = colours[index % colours.length];
    });
    renderRegionControls();
    renderRegionValueTable();
    if (shouldRender) render();
  }

  function renderMapStyleOptions() {
    els.mapStylePresetInput.innerHTML = Object.keys(mapStylePresets).map(presetId => {
      const preset = mapStylePresets[presetId];
      return `<option value="${escapeHtml(presetId)}">${escapeHtml(preset.label || presetId)}</option>`;
    }).join("");
    els.mapStylePresetInput.value = currentMapStylePreset;
  }

  function applyMapStylePreset(presetId, options = {}) {
    const preset = getMapStylePreset(presetId);
    const shouldApplyMapColours = options.applyMapColours !== false;
    const shouldRender = options.render !== false;

    currentMapStylePreset = Object.prototype.hasOwnProperty.call(mapStylePresets, presetId) ? presetId : "goc-green";
    els.mapStylePresetInput.value = currentMapStylePreset;
    els.themeStylesheet.setAttribute("href", preset.stylesheet);

    if (shouldApplyMapColours) {
      preset.categoryStyles.forEach((style, index) => {
        const category = categorySettings[index];
        if (!category) return;
        category.colour = style.colour;
        category.stroke = style.stroke;
        category.markerSize = optionalNumber(style.markerSize) || category.markerSize || getSettings().markerSize;
        category.lineWidth = optionalNumber(style.lineWidth) || category.lineWidth || getSettings().lineWidth;
        category.markerSizeCustom = false;
        category.lineWidthCustom = false;
      });
      applyRegionColoursByValue(false);
      renderCategoryEditors();
      updateTypeOptions();
    }

    if (shouldRender) render();
  }

  function resetRegionColours() {
    regionColourOverrides = {};
    applyRegionColoursByValue();
  }

  function selectRegionsWithProjectPoints() {
    updateRegionValuesFromProjectPoints({ selectRegions: true });
  }

  function wrapLabel(text, maxChars) {
    const words = String(text).split(/\s+/).filter(Boolean);
    const lines = [];
    let current = "";
    words.forEach(word => {
      const candidate = current ? current + " " + word : word;
      if (candidate.length > maxChars && current) {
        lines.push(current);
        current = word;
      } else {
        current = candidate;
      }
    });
    if (current) lines.push(current);
    return lines.length ? lines : [String(text)];
  }

  function preferredSide(d, settings, mapBounds) {
    if (currentBoundary === "canada") {
      const name = labelKeyText(d);
      if (name.includes("grays") || name.includes("arctic") || name.includes("mackenzie")) return "top";
      if (name.includes("taltson") || name.includes("churchill")) return "right";
      if (d.lon >= -116 && d.lon <= -108 && d.lat >= 59) return "right";
      if (d.lon >= -116 && d.lon <= -108 && d.lat >= 55) return "bottom";
      if (d.lon >= -106 && d.lon <= -100 && d.lat >= 53 && d.lat <= 56) return "bottom";
      if (d.lon <= -123 && d.lat <= 59) return "left";
      if (d.lon <= -104 && d.lat >= 62) return "top";
      if (d.lon > -75 && d.lat >= 56) return "right";
      if (d.lon > -84 && d.lon < -70 && d.lat < 50) return d.lon < -76 ? "bottom" : "right";
      if (d.lon > -70) return "right";
      if (d.lon > -98 && d.lat >= 56) return "right";
      if (d.lat > 63) return "top";
      if (d.lon < -118) return "left";
    }

    const mapCenter = (mapBounds.x0 + mapBounds.x1) / 2;
    return d.x < mapCenter ? "left" : "right";
  }

  function createProjection(geo, settings) {
    const source = boundarySources[currentBoundary] || boundarySources.canada;
    if (source.projection === "world") {
      return d3.geoEqualEarth()
        .fitExtent([[settings.width * 0.06, settings.height * 0.10], [settings.width * 0.94, settings.height * 0.74]], geo);
    }

    return d3.geoConicConformal()
      .parallels([49, 77])
      .rotate([96, 0])
      .center([0, 61])
      .fitExtent([[settings.width * 0.09, settings.height * 0.07], [settings.width * 0.91, settings.height * 0.78]], geo);
  }

  function makeLabelBox(d, side, settings) {
    const lines = wrapLabel(d.name, settings.labelMaxChars);
    const lineHeight = settings.labelSize * 1.2;
    const footnote = getRenderableFootnote(d.footnote);
    const longest = Math.max(...lines.map(line => line.length));
    const baseTextWidth = Math.max(80, longest * settings.labelSize * 0.58);
    const footnoteWidth = footnote ? footnote.length * settings.labelSize * 0.42 + 4 : 0;
    const textWidth = Math.max(baseTextWidth, lines[lines.length - 1].length * settings.labelSize * 0.58 + footnoteWidth);
    const textHeight = lines.length * lineHeight;
    return { lines, lineHeight, textWidth, textHeight, footnote, side };
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function labelFontSize(label) {
    return label.lineHeight / 1.2;
  }

  function labelVisualHeight(label) {
    return label.textHeight - label.lineHeight + labelFontSize(label);
  }

  function labelBaselineForCenter(centerY, label) {
    return centerY + labelFontSize(label) - labelVisualHeight(label) / 2;
  }

  function clampLabelBaseline(y, label, minY, maxY) {
    const fontSize = labelFontSize(label);
    return clamp(y, minY + fontSize, maxY - labelVisualHeight(label) + fontSize);
  }

  function createHorizontalSlots(items, boxes, side, settings, mapBounds) {
    const x0 = 30;
    const x1 = settings.width - 30;
    const gap = Math.max(28, settings.labelSize * 1.8);
    const rowGap = Math.max(18, settings.labelSize * 1.2);
    const baseY = side === "top" ? mapBounds.y0 - 58 : mapBounds.y1 + 56;
    const rows = [];

    items.forEach((item, index) => {
      const box = boxes[index];
      const minX = x0;
      const maxX = Math.max(x0, x1 - box.textWidth);
      const desiredX = clamp(item.x - box.textWidth / 2 + getDesignerHorizontalOffset(item, side, settings), minX, maxX);
      let targetRow = null;

      for (const row of rows) {
        const last = row[row.length - 1];
        if (!last || desiredX >= last.x + last.box.textWidth + gap) {
          targetRow = row;
          break;
        }
      }

      if (!targetRow) {
        targetRow = [];
        rows.push(targetRow);
      }

      const previous = targetRow[targetRow.length - 1];
      const x = previous ? Math.max(desiredX, previous.x + previous.box.textWidth + gap) : desiredX;
      targetRow.push({ item, box, x: clamp(x, minX, maxX) });
    });

    rows.forEach(row => {
      let overflow = row.length ? row[row.length - 1].x + row[row.length - 1].box.textWidth - x1 : 0;
      for (let i = row.length - 1; overflow > 0 && i >= 0; i--) {
        const minX = i > 0 ? row[i - 1].x + row[i - 1].box.textWidth + gap : x0;
        const shift = Math.min(overflow, row[i].x - minX);
        row[i].x -= shift;
        overflow -= shift;
      }
    });

    const rowHeights = rows.map(row => row.reduce((height, slot) => Math.max(height, slot.box.textHeight), 0));
    const rowOffsets = [];
    rowHeights.reduce((offset, height, index) => {
      rowOffsets[index] = offset;
      return offset + height + rowGap;
    }, 0);

    const totalBlockHeight = rowHeights.reduce((sum, height) => sum + height, 0) + Math.max(0, rows.length - 1) * rowGap;
    const minY = Math.max(50, settings.labelSize * 1.2 + 12);
    const maxY = settings.height - totalBlockHeight - 24;
    const blockShift = side === "top"
      ? Math.max(0, minY - (baseY - totalBlockHeight))
      : Math.max(0, baseY + totalBlockHeight - (settings.height - 24));

    const slotsByItem = new Map();
    rows.forEach((row, rowIndex) => {
      row.forEach(slot => {
        const y = side === "top"
          ? baseY - rowOffsets[rowIndex] + blockShift
          : baseY + rowOffsets[rowIndex] - blockShift;
        slotsByItem.set(slot.item, {
          side,
          x: slot.x,
          y: clamp(y, minY, Math.max(minY, maxY + rowOffsets[rowIndex])),
          box: slot.box
        });
      });
    });

    return items.map(item => slotsByItem.get(item));
  }

  function createVerticalSlots(items, boxes, side, settings, mapBounds) {
    const labelGap = Math.max(22, settings.labelSize * 1.35);
    const minY = Math.max(58, settings.labelSize * 2);
    const maxY = settings.height - 44;
    const slots = items.map((item, index) => {
      const box = boxes[index];
      const centerY = item.y + getDesignerVerticalOffset(item, side, settings);
      return {
        item,
        box,
        y: clampLabelBaseline(labelBaselineForCenter(centerY, box), box, minY, maxY)
      };
    });

    slots.sort((a, b) => a.y - b.y);
    for (let i = 1; i < slots.length; i += 1) {
      const previous = slots[i - 1];
      const current = slots[i];
      const previousBottom = previous.y - labelFontSize(previous.box) + labelVisualHeight(previous.box);
      const minCurrentY = previousBottom + labelGap + labelFontSize(current.box);
      if (current.y < minCurrentY) current.y = minCurrentY;
    }

    for (let i = slots.length - 1; i >= 0; i -= 1) {
      const slot = slots[i];
      const maxSlotY = maxY - labelVisualHeight(slot.box) + labelFontSize(slot.box);
      if (slot.y > maxSlotY) slot.y = maxSlotY;
      if (i < slots.length - 1) {
        const next = slots[i + 1];
        const nextTop = next.y - labelFontSize(next.box);
        const maxBeforeNext = nextTop - labelGap - labelVisualHeight(slot.box) + labelFontSize(slot.box);
        if (slot.y > maxBeforeNext) slot.y = maxBeforeNext;
      }
      slot.y = Math.max(slot.y, minY + labelFontSize(slot.box));
    }

    const slotsByItem = new Map();
    slots.forEach(slot => {
      const lineOffset = getDesignerLineOffset(slot.item, side, settings);
      const rightX = clamp(slot.item.x + lineOffset, mapBounds.x0 + 20, settings.width - slot.box.textWidth - 30);
      const leftX = clamp(slot.item.x - lineOffset, 30 + slot.box.textWidth, mapBounds.x1 - 20);
      slotsByItem.set(slot.item, {
        side,
        x: side === "left" ? leftX : rightX,
        y: slot.y,
        box: slot.box
      });
    });

    return items.map(item => slotsByItem.get(item));
  }

  function labelKeyText(item) {
    return String(item.name || "").toLowerCase();
  }

  function getDesignerLineOffset(item, side, settings) {
    const unit = settings.labelSize;
    const base = Math.max(130, unit * 8);
    if (currentBoundary !== "canada") return base;

    const name = labelKeyText(item);
    if (side === "left") {
      if (item.lon <= -126) return Math.max(220, unit * 13);
      if (name.includes("north coast") || name.includes("lng canada")) return Math.max(190, unit * 11);
      return Math.max(170, unit * 10);
    }

    if (side === "right") {
      if (name.includes("iqaluit")) return Math.max(210, unit * 12);
      if (name.includes("churchill") || name.includes("taltson")) return Math.max(310, unit * 18);
      if (item.lon > -76 && item.lat < 48) return Math.max(175, unit * 10);
      return base;
    }

    return base;
  }

  function getDesignerHorizontalOffset(item, side, settings) {
    if (currentBoundary !== "canada") return 0;
    const unit = settings.labelSize;
    const name = labelKeyText(item);

    if (side === "top") {
      if (name.includes("mackenzie")) return -unit * 12;
      if (name.includes("arctic")) return -unit * 10;
      if (name.includes("grays")) return -unit * 8;
      if (item.lon < -118) return -unit * 8;
      return -unit * 3;
    }

    if (side === "bottom") {
      if (name.includes("crawford")) return -unit * 4;
      if (name.includes("darlington")) return -unit * 1;
      if (name.includes("pathways")) return -unit * 7;
      if (name.includes("mcilvenna")) return -unit * 4;
      return unit * 1.5;
    }

    return 0;
  }

  function getDesignerVerticalOffset(item, side, settings) {
    if (currentBoundary !== "canada") return 0;
    const unit = settings.labelSize;
    const name = labelKeyText(item);

    if (side === "left") {
      if (name.includes("northwest critical")) return -unit * 5;
      if (name.includes("red chris")) return -unit * 2.2;
      if (name.includes("ksi lisims")) return unit * 0.3;
      if (name.includes("north coast")) return unit * 3.4;
      if (name.includes("lng canada")) return unit * 6;
      if (item.lat >= 58) return -unit * 3.8;
      if (item.lat >= 55) return -unit * 1.8;
      if (item.lat <= 52) return unit * 3.2;
      return unit * 1.2;
    }

    if (side === "right") {
      if (name.includes("taltson")) return -unit * 8;
      if (name.includes("churchill")) return -unit * 5.5;
      if (name.includes("iqaluit")) return -unit * 0.5;
      if (name.includes("northcliff")) return unit * 2;
      if (name.includes("wind west")) return unit * 4.2;
      if (name.includes("nouveau")) return unit * 5.8;
      if (name.includes("contrecoeur")) return unit * 8;
      if (name.includes("alto")) return unit * 10.5;
      if (item.lon > -76 && item.lat < 48) return unit * 4.2;
      if (item.lon > -70 && item.lat < 48) return unit * 3.2;
      if (item.lat >= 58) return -unit * 0.8;
      return unit * 0.8;
    }

    return 0;
  }

  function createSlots(items, side, settings, mapBounds) {
    const boxes = items.map(d => makeLabelBox(d, side, settings));

    if (side === "left" || side === "right") {
      return createVerticalSlots(items, boxes, side, settings, mapBounds);
    }

    return createHorizontalSlots(items, boxes, side, settings, mapBounds);
  }

  function layoutLabels(points, settings, mapBounds) {
    const grouped = { left: [], right: [], top: [], bottom: [] };

    points.forEach(d => {
      const side = preferredSide(d, settings, mapBounds);
      grouped[side].push(d);
    });

    const placed = [];
    Object.keys(grouped).forEach(side => {
      const items = grouped[side].slice();
      if (side === "left" || side === "right") {
        items.sort((a, b) => a.y - b.y);
      } else {
        items.sort((a, b) => a.x - b.x);
      }
      const slots = createSlots(items, side, settings, mapBounds);
      items.forEach((item, i) => {
        const slot = slots[i];
        placed.push({
          ...item,
          labelSide: side,
          labelX: slot.x,
          labelY: slot.y,
          lines: slot.box.lines,
          lineHeight: slot.box.lineHeight,
          textWidth: slot.box.textWidth,
          textHeight: slot.box.textHeight,
          footnote: slot.box.footnote,
          anchor: side === "left" ? "end" : "start"
        });
      });
    });

    return applyManualLabelPositions(placed);
  }

  function getLabelKey(row) {
    return row.rowId ? `row:${row.rowId}` : getLegacyLabelKey(row);
  }

  function getLegacyLabelKey(row) {
    return `${cleanType(row.type)}|${row.name}`;
  }

  function applyManualLabelPositions(placed) {
    return placed.map((d, index) => {
      const key = getLabelKey(d);
      const manual = manualLabelPositions[key] || manualLabelPositions[getLegacyLabelKey(d)];
      return {
        ...d,
        layoutId: `label-${index}`,
        labelKey: key,
        labelX: manual ? manual.x : d.labelX,
        labelY: manual ? manual.y : d.labelY
      };
    });
  }

  function lineEnd(d) {
    const box = labelVisualBox(d);
    if (d.labelSide === "left") return { x: box.x1 + 8, y: box.centerY };
    if (d.labelSide === "right") return { x: box.x0 - 8, y: box.centerY };
    if (d.labelSide === "top") return { x: box.centerX, y: box.y1 + 8 };
    return { x: box.centerX, y: box.y0 - 8 };
  }

  function labelVisualBox(d, pad = 0) {
    const x = d.labelSide === "left" ? d.labelX - d.textWidth : d.labelX;
    const y = d.labelY - labelFontSize(d);
    const width = d.textWidth;
    const height = labelVisualHeight(d);
    return {
      x0: x - pad,
      y0: y - pad,
      x1: x + width + pad,
      y1: y + height + pad,
      centerX: x + width / 2,
      centerY: y + height / 2
    };
  }

  function labelRect(d) {
    return labelVisualBox(d, 10);
  }

  function segmentsCross(a, b, c, d) {
    function ccw(p1, p2, p3) {
      return (p3.y - p1.y) * (p2.x - p1.x) > (p2.y - p1.y) * (p3.x - p1.x);
    }
    return ccw(a, c, d) !== ccw(b, c, d) && ccw(a, b, c) !== ccw(a, b, d);
  }

  function rectsOverlap(a, b) {
    return !(a.x1 < b.x0 || b.x1 < a.x0 || a.y1 < b.y0 || b.y1 < a.y0);
  }

  function analyzeLayout(placed, settings, projectedProblems, hiddenRegionProblems, mapBounds) {
    let crossings = 0;
    let overlaps = 0;
    const lines = placed
      .filter(d => !d.hideLine)
      .map(d => ({ start: { x: d.x, y: d.y }, end: lineEnd(d), d }));
    const rects = placed.map(labelRect);

    for (let i = 0; i < lines.length; i++) {
      for (let j = i + 1; j < lines.length; j++) {
        if (segmentsCross(lines[i].start, lines[i].end, lines[j].start, lines[j].end)) crossings++;
      }
    }

    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) {
        if (rectsOverlap(rects[i], rects[j])) overlaps++;
      }
    }

    const longLines = lines.filter(line => {
      const dx = line.start.x - line.end.x;
      const dy = line.start.y - line.end.y;
      return Math.sqrt(dx * dx + dy * dy) > settings.width * 0.38;
    }).length;

    return { crossings, overlaps, longLines, projectedProblems, hiddenRegionProblems };
  }

  function checklistItem(state, label, detail) {
    const className = state === "ok" ? "status-ok" : state === "danger" ? "status-danger" : "status-warning";
    return `
      <div class="checklist-item ${className}">
        <span class="checklist-state">${state === "ok" ? "OK" : "Review"}</span>
        <span>
          <strong>${escapeHtml(label)}</strong>
          ${detail ? `<br><span>${escapeHtml(detail)}</span>` : ""}
        </span>
      </div>
    `;
  }

  function getEmptyCategoryLabels(rows) {
    const usedCategories = new Set(rows.map(row => cleanType(row.type)));
    return categorySettings
      .filter(category => !usedCategories.has(category.id))
      .map(category => category.label);
  }

  function getExportSizeMessage(settings) {
    const pngWidth = settings.width * 2;
    const pngHeight = settings.height * 2;
    const megapixels = (pngWidth * pngHeight / 1000000).toFixed(1);
    return `SVG: ${settings.width} x ${settings.height}. PNG: ${pngWidth} x ${pngHeight}, about ${megapixels} megapixels.`;
  }

  function updateStatus(rows, mappedRows, calloutRows, report, geoLoaded) {
    const settings = getSettings();
    const checklist = [];
    const emptyCategories = getEmptyCategoryLabels(rows);
    const pngMegapixels = settings.width * settings.height * 4 / 1000000;
    const boundaryLabel = (boundarySources[currentBoundary] || boundarySources.canada).label;
    const regionNoun = currentBoundary === "canada" ? "provinces or territories" : "regions";

    checklist.push(geoLoaded
      ? checklistItem("ok", "Map boundary loaded", `${boundaryLabel} boundary data is available.`)
      : checklistItem("danger", "Map boundary missing", "Check internet access or host the GeoJSON locally."));

    checklist.push(rows.length
      ? checklistItem("ok", "Project data loaded", `${rows.length} project row(s), including ${mappedRows.length} mapped point(s).`)
      : checklistItem("danger", "Project data missing", "Add rows, paste data, or import a CSV."));

    checklist.push(calloutRows.length
      ? checklistItem("warning", "Missing coordinates", `${calloutRows.length} row(s) will appear as callouts instead of map points.`)
      : checklistItem("ok", "Coordinates complete", "All project rows have longitude and latitude."));

    checklist.push(report.hiddenRegionProblems.length
      ? checklistItem("warning", "Hidden points", `${report.hiddenRegionProblems.length} project(s) are in unselected ${regionNoun}.`)
      : checklistItem("ok", "No hidden points", "Selected regions include all mapped project points."));

    checklist.push(report.projectedProblems.length
      ? checklistItem("danger", "Invalid coordinates", `${report.projectedProblems.length} point(s) could not be placed on the map.`)
      : checklistItem("ok", "Coordinate ranges", "No invalid or out-of-projection points detected."));

    checklist.push(report.overlaps
      ? checklistItem("warning", "Label overlaps", `${report.overlaps} overlapping label pair(s) detected.`)
      : checklistItem("ok", "Label overlaps", "No label overlaps detected."));

    checklist.push(report.crossings
      ? checklistItem("warning", "Leader line crossings", `${report.crossings} crossing(s) detected.`)
      : checklistItem("ok", "Leader line crossings", "No leader line crossings detected."));

    checklist.push(!rows.length
      ? checklistItem("warning", "Legend categories", "Add project rows to check whether each legend category is used.")
      : emptyCategories.length
        ? checklistItem("warning", "Empty legend categories", emptyCategories.join(", "))
        : checklistItem("ok", "Legend categories", "Every legend category is used by at least one row."));

    checklist.push(pngMegapixels > 16
      ? checklistItem("warning", "Export size", `${getExportSizeMessage(settings)} Large PNG exports may be slower in Edge.`)
      : checklistItem("ok", "Export size", getExportSizeMessage(settings)));

    if (report.longLines) {
      checklist.push(checklistItem("warning", "Long leader lines", `${report.longLines} long leader line(s). These may still be acceptable for print.`));
    }

    lastImportMessages.forEach(message => {
      checklist.push(checklistItem("warning", "CSV import note", message));
    });

    els.statusBox.innerHTML = `
      <div class="quality-checklist">
        <strong>Map quality checklist</strong>
        ${checklist.join("")}
      </div>
    `;
  }

  function setStatusMessage(message, level = "warning") {
    const className = level === "danger" ? "status-danger" : level === "ok" ? "status-ok" : "status-warning";
    els.statusBox.innerHTML = `<div class="${className}">${escapeHtml(message)}</div>`;
  }

  function summarizeImportRows(rows) {
    const mappedCount = rows.filter(row => row.lon !== "" && row.lat !== "").length;
    const calloutCount = rows.length - mappedCount;
    const categoryNames = Array.from(new Set(rows.map(row => getCategoryLabel(row.type))));
    return { mappedCount, calloutCount, categoryNames };
  }

  function showCsvImportPreview(report) {
    const rows = report.rows || [];
    const messages = report.messages || [];
    const summary = summarizeImportRows(rows);
    const columns = report.fields && report.fields.length ? report.fields.join(", ") : "No column headers detected.";
    const importDisabled = rows.length ? "" : " disabled";

    els.statusBox.innerHTML = `
      <div class="import-preview">
        <strong>CSV import preview</strong>
        <div class="mini-status">${escapeHtml(report.fileName || "Selected CSV")}</div>
        <div class="status-ok">
          ${rows.length} row(s) ready to import.<br>
          ${summary.mappedCount} mapped point(s).<br>
          ${summary.calloutCount} callout item(s) with no coordinates.
        </div>
        <div class="mini-status">
          Columns: ${escapeHtml(columns)}<br>
          Categories: ${escapeHtml(summary.categoryNames.join(", ") || "None")}
        </div>
        ${messages.length ? `<hr><div class="status-warning">${messages.map(escapeHtml).join("<br>")}</div>` : ""}
        <div class="status-actions">
          <button type="button" data-status-action="confirm-csv-import"${importDisabled}>Import rows</button>
          <button type="button" data-status-action="cancel-csv-import">Cancel</button>
        </div>
      </div>
    `;
  }

  function handleStatusAction(event) {
    const button = event.target.closest("[data-status-action]");
    if (!button) return;

    if (button.dataset.statusAction === "confirm-csv-import") {
      if (!pendingCsvImport || !pendingCsvImport.rows.length) {
        setStatusMessage("There are no CSV rows ready to import.", "warning");
        return;
      }
      const report = pendingCsvImport;
      pendingCsvImport = null;
      setRows(report.rows, report.messages);
      return;
    }

    if (button.dataset.statusAction === "cancel-csv-import") {
      pendingCsvImport = null;
      setStatusMessage("CSV import cancelled. The project table was not changed.", "warning");
    }
  }

  function autoPlaceLabels() {
    manualLabelPositions = {};
    render();
  }

  function switchDataTable(tableName) {
    const showRegions = tableName === "regions";
    els.projectTableTab.classList.toggle("is-active", !showRegions);
    els.regionTableTab.classList.toggle("is-active", showRegions);
    els.projectTableTab.setAttribute("aria-selected", String(!showRegions));
    els.regionTableTab.setAttribute("aria-selected", String(showRegions));
    els.projectTablePane.classList.toggle("is-active", !showRegions);
    els.regionTablePane.classList.toggle("is-active", showRegions);
    document.querySelectorAll(".table-actions").forEach(actions => {
      actions.classList.toggle("is-active", actions.dataset.tableActions === (showRegions ? "regions" : "projects"));
    });
    els.tablePanelTitle.textContent = showRegions ? "Map regions" : "Project table";
    if (showRegions) renderRegionValueTable();
  }

  function render() {
    const settings = getSettings();
    const rows = getRows();
    const svg = els.svg;
    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${settings.width} ${settings.height}`);
    svg.attr("width", settings.width);
    svg.attr("height", settings.height);

    svg.append("title").text(settings.title || "Custom map");
    svg.append("desc").text(`${(boundarySources[currentBoundary] || boundarySources.canada).label} map with outside labels, leader lines and markers generated from CSV data.`);

    if (settings.title) {
      svg.append("text")
        .attr("class", "map-title")
        .attr("x", 30)
        .attr("y", 42)
        .attr("font-family", settings.fontFamily)
        .text(settings.title);
    }

    if (!canadaGeo) {
      drawMissingMapMessage(svg, settings);
      updateStatus(rows, [], [], { crossings: 0, overlaps: 0, longLines: 0, projectedProblems: [], hiddenRegionProblems: [] }, false);
      if (!els.regionTableBody.contains(document.activeElement)) renderRegionValueTable();
      return;
    }

    const visibleGeo = getVisibleGeo();
    if (!visibleGeo || !visibleGeo.features.length) {
      const title = currentBoundary === "canada" ? "No provinces or territories selected" : "No regions selected";
      const message = currentBoundary === "canada" ? "Select at least one province or territory to draw the map." : "Select at least one region to draw the map.";
      drawMissingMapMessage(svg, settings, title, message);
      updateStatus(rows, [], [], { crossings: 0, overlaps: 0, longLines: 0, projectedProblems: [], hiddenRegionProblems: [] }, true);
      if (!els.regionTableBody.contains(document.activeElement)) renderRegionValueTable();
      return;
    }

    const projection = createProjection(visibleGeo, settings);

    const path = d3.geoPath(projection);
    const mapBoundsArray = path.bounds(visibleGeo);
    const mapBounds = {
      x0: mapBoundsArray[0][0],
      y0: mapBoundsArray[0][1],
      x1: mapBoundsArray[1][0],
      y1: mapBoundsArray[1][1]
    };

    svg.append("g")
      .selectAll("path")
      .data(visibleGeo.features)
      .join("path")
      .attr("class", "province")
      .attr("d", path)
      .attr("fill", (d, i) => getRegionFill(d, i));

    const mappedRows = [];
    const calloutRows = [];
    const projectedProblems = [];
    const hiddenRegionProblems = [];

    rows.forEach(row => {
      const hasCoords = row.lon !== "" && row.lat !== "";
      if (!hasCoords) {
        calloutRows.push(row);
        return;
      }
      const hiddenRegion = getHiddenRegionForPoint(Number(row.lon), Number(row.lat));
      if (hiddenRegion) {
        hiddenRegionProblems.push(`${row.name || "Unnamed point"} (${hiddenRegion})`);
        return;
      }
      const projected = projection([Number(row.lon), Number(row.lat)]);
      if (!projected || !Number.isFinite(projected[0]) || !Number.isFinite(projected[1])) {
        projectedProblems.push(row.name || "Unnamed point");
        return;
      }
      mappedRows.push({ ...row, x: projected[0], y: projected[1] });
    });

    const labelRows = mappedRows.filter(row => row.name);
    const placed = layoutLabels(labelRows, settings, mapBounds);
    const placedByRowId = new Map(placed.map(row => [row.rowId, row]));
    const markerRows = mappedRows.map(row => placedByRowId.get(row.rowId) || row);
    const leaderRows = placed.filter(row => !row.hideLine);
    const report = analyzeLayout(placed, settings, projectedProblems, hiddenRegionProblems, mapBounds);
    lastLayout = { placed, settings, report };

    const leaderLayer = svg.append("g").attr("class", "leader-layer");
    if (settings.showLineCasing) {
    leaderLayer.selectAll("path.leader-casing")
        .data(leaderRows)
        .join("path")
        .attr("class", "leader-casing")
        .attr("data-layout-id", d => d.layoutId)
        .attr("stroke-width", d => getCategoryLineWidth(getCategory(d.type), settings) + 3.5)
        .attr("d", d => linePath(d));
    }
    leaderLayer.selectAll("path.leader-line")
      .data(leaderRows)
      .join("path")
      .attr("class", "leader-line")
      .attr("data-layout-id", d => d.layoutId)
      .attr("stroke-width", d => getCategoryLineWidth(getCategory(d.type), settings))
      .attr("d", d => linePath(d));

    const markerLayer = svg.append("g").attr("class", "marker-layer");
    const markers = markerLayer.selectAll(".marker")
      .data(markerRows)
      .join(function (enter) {
        return enter.append(d => createMarkerElement(getCategory(d.type).shape));
      })
      .attr("class", d => `marker marker-${cleanType(d.type)}${settings.lockMarkerCoordinates ? " is-locked" : ""}`)
      .attr("fill", d => getCategory(d.type).colour)
      .attr("stroke", d => getCategory(d.type).stroke)
      .each(function (d) {
        moveMarkerNode(d3.select(this), d, { markerSize: getCategoryMarkerSize(getCategory(d.type), settings) });
      });
    if (!settings.lockMarkerCoordinates) attachMarkerDragging(markers, projection, settings);

    const labelBackgroundLayer = svg.append("g").attr("class", "label-background-layer");
    labelBackgroundLayer.selectAll("rect")
      .data(placed)
      .join("rect")
      .attr("class", "map-label-background")
      .attr("data-layout-id", d => d.layoutId)
      .each(function (d) {
        positionLabelBackground(d3.select(this), d);
      });

    const labelLayer = svg.append("g").attr("class", "label-layer");
    const labels = labelLayer.selectAll("text")
      .data(placed)
      .join("text")
      .attr("class", "map-label")
      .attr("font-size", settings.labelSize)
      .attr("font-family", settings.fontFamily)
      .attr("data-layout-id", d => d.layoutId)
      .attr("x", d => d.labelX)
      .attr("y", d => d.labelY)
      .attr("text-anchor", d => d.anchor);

    labels.each(function (d) {
      const text = d3.select(this);
      d.lines.forEach((line, i) => {
        text.append("tspan")
          .attr("class", "label-line")
          .attr("x", d.labelX)
          .attr("dy", i === 0 ? 0 : d.lineHeight)
          .text(line);
        if (i === d.lines.length - 1 && d.footnote) appendSuperscript(text, d.footnote, settings.labelSize);
      });
    });
    attachLabelDragging(labels);

    if (settings.showCallouts && calloutRows.length) drawCallouts(svg, calloutRows, settings, mapBounds);
    if (settings.showLegend) drawLegend(svg, settings);
    updateStatus(rows, mappedRows, calloutRows, report, true);
    if (!els.regionTableBody.contains(document.activeElement)) renderRegionValueTable();
  }

  function appendSuperscript(textSelection, value, labelSize) {
    textSelection.append("tspan")
      .attr("class", "label-footnote")
      .attr("dx", 2)
      .attr("baseline-shift", "super")
      .attr("font-size", labelSize * 0.68)
      .text(value);
  }

  function attachLabelDragging(labels) {
    labels.call(d3.drag()
      .on("start", function () {
        d3.select(this).classed("is-dragging", true);
      })
      .on("drag", function (event, d) {
        d.labelX += event.dx;
        d.labelY += event.dy;
        manualLabelPositions[d.labelKey] = { x: d.labelX, y: d.labelY };

        const label = d3.select(this)
          .attr("x", d.labelX)
          .attr("y", d.labelY);
        label.selectAll("tspan.label-line").attr("x", d.labelX);

        d3.select(`rect.map-label-background[data-layout-id="${d.layoutId}"]`)
          .call(node => positionLabelBackground(node, d));

        d3.selectAll(`path[data-layout-id="${d.layoutId}"]`)
          .attr("d", linePath(d));
      })
      .on("end", function () {
        d3.select(this).classed("is-dragging", false);
      }));
  }

  function attachMarkerDragging(markers, projection, settings) {
    markers.call(d3.drag()
      .on("start", function (event, d) {
        const pointer = d3.pointer(event, els.svg.node());
        d.dragOffsetX = d.x - pointer[0];
        d.dragOffsetY = d.y - pointer[1];
        d3.select(this).classed("is-dragging", true);
      })
      .on("drag", function (event, d) {
        const pointer = d3.pointer(event, els.svg.node());
        d.x = pointer[0] + d.dragOffsetX;
        d.y = pointer[1] + d.dragOffsetY;
        moveMarkerNode(d3.select(this), d, { markerSize: getCategoryMarkerSize(getCategory(d.type), settings) });
        d3.selectAll(`path[data-layout-id="${d.layoutId}"]`)
          .attr("d", linePath(d));
      })
      .on("end", function (event, d) {
        d3.select(this).classed("is-dragging", false);
        const coordinates = projection.invert([d.x, d.y]);
        if (!coordinates || !Number.isFinite(coordinates[0]) || !Number.isFinite(coordinates[1])) {
          setStatusMessage(`Could not update coordinates for ${d.name}.`, "danger");
          return;
        }

        const lon = roundCoordinate(coordinates[0]);
        const lat = roundCoordinate(coordinates[1]);
        updateTableCoordinates(d.rowId, lon, lat);
        d.lon = lon;
        d.lat = lat;
        setStatusMessage(`Updated coordinates for ${d.name}.`, "ok");
      }));
  }

  function positionLabelBackground(node, d) {
    const padX = 8;
    const padY = 5;
    const box = labelVisualBox(d);

    node.attr("x", box.x0 - padX)
      .attr("y", box.y0 - padY)
      .attr("width", box.x1 - box.x0 + padX * 2)
      .attr("height", box.y1 - box.y0 + padY * 2);
  }

  function moveMarkerNode(node, d, settings) {
    const tagName = node.node().tagName.toLowerCase();
    if (tagName === "rect") {
      node.attr("x", d.x - settings.markerSize)
        .attr("y", d.y - settings.markerSize)
        .attr("width", settings.markerSize * 2)
        .attr("height", settings.markerSize * 2);
      return;
    }

    if (tagName === "circle") {
      node.attr("cx", d.x)
        .attr("cy", d.y)
        .attr("r", settings.markerSize);
      return;
    }

    node.attr("d", markerPath(getCategory(d.type).shape, settings.markerSize))
      .attr("transform", `translate(${d.x},${d.y})`);
  }

  function roundCoordinate(value) {
    return Math.round(value * 100000) / 100000;
  }

  function updateTableCoordinates(rowId, lon, lat) {
    const tr = getTableRows()
      .find(row => row.dataset.rowId === String(rowId));
    if (!tr) return;

    tr.querySelector(".lon-input").value = lon;
    tr.querySelector(".lat-input").value = lat;
  }

  function getFocusedTablePosition() {
    const active = document.activeElement;
    if (!active || !els.tableBody.contains(active)) return null;

    const tr = active.closest("tr");
    const rowIndex = getTableRows().indexOf(tr);
    let fieldIndex = -1;
    if (active.classList.contains("name-input")) fieldIndex = tableFields.indexOf("name");
    if (active.classList.contains("footnote-input")) fieldIndex = tableFields.indexOf("footnote");
    if (active.classList.contains("type-input")) fieldIndex = tableFields.indexOf("type");
    if (active.classList.contains("lon-input")) fieldIndex = tableFields.indexOf("lon");
    if (active.classList.contains("lat-input")) fieldIndex = tableFields.indexOf("lat");

    if (rowIndex < 0 || fieldIndex < 0) return null;
    return { rowIndex, fieldIndex };
  }

  function parseExcelPaste(text) {
    const cleaned = String(text || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/\n$/, "");
    if (!cleaned.trim()) return [];
    if (window.Papa) return Papa.parse(cleaned, { delimiter: "\t" }).data;
    return parseDelimitedText(cleaned, "\t").data;
  }

  function parseDelimitedText(text, delimiter = ",") {
    const source = String(text || "").replace(/^\ufeff/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    const rows = [];
    const errors = [];
    let row = [];
    let field = "";
    let inQuotes = false;

    for (let index = 0; index < source.length; index += 1) {
      const char = source[index];
      const next = source[index + 1];

      if (char === '"') {
        if (inQuotes && next === '"') {
          field += '"';
          index += 1;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }

      if (!inQuotes && char === delimiter) {
        row.push(field);
        field = "";
        continue;
      }

      if (!inQuotes && char === "\n") {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
        continue;
      }

      field += char;
    }

    if (inQuotes) errors.push({ row: rows.length, message: "Unclosed quoted value." });
    row.push(field);
    if (row.some(value => String(value).length > 0) || rows.length === 0) rows.push(row);

    return { data: rows, errors };
  }

  function parseCsvText(text) {
    const parsed = parseDelimitedText(text, ",");
    const records = parsed.data.filter(row => row.some(value => String(value || "").trim() !== ""));
    const fields = records.length ? records[0].map(value => String(value || "").trim()) : [];
    const data = records.slice(1).map(record => {
      const row = {};
      fields.forEach((field, index) => {
        row[field] = record[index] === undefined ? "" : record[index];
      });
      if (record.length > fields.length) row.__parsed_extra = record.slice(fields.length);
      return row;
    });
    return { data, errors: parsed.errors, meta: { fields } };
  }

  function csvEscape(value) {
    const text = String(value === null || value === undefined ? "" : value);
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }

  function unparseCsvRows(rows, columns) {
    const lines = [
      columns.map(csvEscape).join(","),
      ...rows.map(row => columns.map(column => csvEscape(row[column])).join(","))
    ];
    return lines.join("\r\n");
  }

  function setTableField(tr, field, value) {
    if (field === "name") tr.querySelector(".name-input").value = String(value || "").trim();
    if (field === "footnote") tr.querySelector(".footnote-input").value = normalizeFootnote(value);
    if (field === "type") tr.querySelector(".type-input").value = cleanType(value);
    if (field === "lon") tr.querySelector(".lon-input").value = toNumber(value);
    if (field === "lat") tr.querySelector(".lat-input").value = toNumber(value);
  }

  function pasteIntoTable(event) {
    const text = event.clipboardData && event.clipboardData.getData("text");
    const pastedRows = parseExcelPaste(text);
    if (!pastedRows.length) return;

    event.preventDefault();
    const start = getFocusedTablePosition() || { rowIndex: getTableRows().length, fieldIndex: 0 };
    const rowsNeeded = start.rowIndex + pastedRows.length;

    while (getTableRows().length < rowsNeeded) {
      const tr = addRow();
      tr.classList.add("is-new");
      window.setTimeout(() => tr.classList.remove("is-new"), 120);
    }

    const tableRows = getTableRows();
    pastedRows.forEach((pastedRow, rowOffset) => {
      const tr = tableRows[start.rowIndex + rowOffset];
      pastedRow.forEach((value, colOffset) => {
        const field = tableFields[start.fieldIndex + colOffset];
        if (field) setTableField(tr, field, value);
      });
    });

    const firstPastedRow = tableRows[start.rowIndex];
    if (firstPastedRow) firstPastedRow.scrollIntoView({ block: "nearest", behavior: "smooth" });
    manualLabelPositions = {};
    refreshRegionColoursFromRows();
    render();
    setStatusMessage(`Pasted ${pastedRows.length} row(s) into the project table.`, "ok");
  }

  function updateDeleteButtonState() {
    const hasSelection = Array.from(els.tableBody.querySelectorAll(".row-select"))
      .some(checkbox => checkbox.checked);
    els.deleteSelectedBtn.disabled = !hasSelection;
  }

  function syncCategorySettingsFromControls() {
    Array.from(els.categoryList.querySelectorAll(".category-editor")).forEach(editor => {
      const category = categorySettings.find(item => item.id === editor.dataset.categoryId);
      if (!category) return;
      category.label = editor.querySelector(".category-label-input").value.trim() || category.defaultLabel;
      category.shape = normalizeMarkerShape(editor.querySelector(".category-shape-input").value);
      category.colour = editor.querySelector(".category-colour-input").value;
      category.markerSize = optionalNumber(editor.querySelector(".category-marker-size-input").value) || getSettings().markerSize;
      category.lineWidth = optionalNumber(editor.querySelector(".category-line-width-input").value) || getSettings().lineWidth;
      editor.querySelector(".category-header strong").textContent = category.label;
      editor.querySelector(".category-swatch").innerHTML = getCategorySwatchSvg(category);
    });
  }

  function applyCategorySettings(categories = []) {
    if (!categories.length) {
      renderCategoryEditors();
      updateTypeOptions();
      return;
    }

    const existingCategories = categorySettings.slice();
    const nextCategories = [];

    categories.forEach(savedCategory => {
      const category = existingCategories.find(item => item.id === savedCategory.id);
      const label = String(savedCategory.label || savedCategory.defaultLabel || "Category").trim() || "Category";
      const shape = normalizeMarkerShape(savedCategory.shape);
      const colour = savedCategory.colour || "#217346";
      const markerSize = optionalNumber(savedCategory.markerSize) || getSettings().markerSize;
      const lineWidth = optionalNumber(savedCategory.lineWidth) || getSettings().lineWidth;
      const markerSizeCustom = savedCategory.markerSizeCustom !== undefined
        ? Boolean(savedCategory.markerSizeCustom)
        : markerSize !== getSettings().markerSize;
      const lineWidthCustom = savedCategory.lineWidthCustom !== undefined
        ? Boolean(savedCategory.lineWidthCustom)
        : lineWidth !== getSettings().lineWidth;

      if (category) {
        category.label = label;
        category.shape = shape;
        category.colour = colour;
        category.markerSize = markerSize;
        category.lineWidth = lineWidth;
        category.markerSizeCustom = markerSizeCustom;
        category.lineWidthCustom = lineWidthCustom;
        category.collapsed = Boolean(savedCategory.collapsed);
        nextCategories.push(category);
        return;
      }

      nextCategories.push({
        id: makeCategoryId(savedCategory.id || label),
        label,
        defaultLabel: label,
        shape,
        colour,
        stroke: "#ffffff",
        markerSize,
        lineWidth,
        markerSizeCustom,
        lineWidthCustom,
        collapsed: Boolean(savedCategory.collapsed),
        removable: true
      });
    });

    existingCategories
      .filter(category => !category.removable && !nextCategories.some(item => item.id === category.id))
      .forEach(category => nextCategories.push(category));

    categorySettings.length = 0;
    nextCategories.forEach(category => categorySettings.push(category));
    renderCategoryEditors();
    updateTypeOptions();
  }

  function handleCategorySettingsChange(event) {
    if (event && event.target.classList.contains("category-preset-input") && event.target.value) {
      const editor = event.target.closest(".category-editor");
      editor.querySelector(".category-colour-input").value = event.target.value;
    }
    if (event && (event.target.classList.contains("category-marker-size-input") || event.target.classList.contains("category-line-width-input"))) {
      const editor = event.target.closest(".category-editor");
      const category = editor ? categorySettings.find(item => item.id === editor.dataset.categoryId) : null;
      if (category && event.target.classList.contains("category-marker-size-input")) category.markerSizeCustom = true;
      if (category && event.target.classList.contains("category-line-width-input")) category.lineWidthCustom = true;
    }
    syncCategorySettingsFromControls();
    updateTypeOptions();
    render();
  }

  function handleLayoutSettingsChange(event) {
    if (event && (event.target === els.markerSizeInput || event.target === els.lineWidthInput)) {
      syncDefaultCategorySizes();
    }
    renderCategoryEditors();
    render();
  }

  function resetLayoutInputToDefault(button) {
    const inputId = button && button.dataset ? button.dataset.resetInput : "";
    const input = inputId ? document.querySelector(`#${inputId}`) : null;
    if (!input || !Object.prototype.hasOwnProperty.call(layoutDefaults, inputId)) return;

    input.value = layoutDefaults[inputId];
    handleLayoutSettingsChange({ target: input });
    input.focus();
  }

  function addCategory() {
    const count = categorySettings.length + 1;
    const label = `Category ${count}`;
    categorySettings.push({
      id: makeCategoryId(label),
      label,
      defaultLabel: label,
      shape: "circle",
      colour: "#217346",
      stroke: "#ffffff",
      markerSize: getSettings().markerSize,
      lineWidth: getSettings().lineWidth,
      markerSizeCustom: false,
      lineWidthCustom: false,
      collapsed: false,
      removable: true
    });
    renderCategoryEditors();
    updateTypeOptions();
    render();
  }

  function toggleCategory(categoryId) {
    const category = categorySettings.find(item => item.id === categoryId);
    if (!category) return;
    category.collapsed = !category.collapsed;
    renderCategoryEditors();
  }

  function removeCategory(categoryId) {
    const category = categorySettings.find(item => item.id === categoryId);
    if (!category || !category.removable) return;
    if (categorySettings.length <= 1) {
      setStatusMessage("At least one legend marker is required.", "warning");
      return;
    }

    Array.from(els.tableBody.querySelectorAll(".type-input")).forEach(select => {
      if (select.value === categoryId) select.value = getDefaultCategory().id;
    });
    categorySettings.splice(categorySettings.indexOf(category), 1);
    renderCategoryEditors();
    updateTypeOptions();
    render();
  }

  function moveCategory(categoryId, direction) {
    const index = categorySettings.findIndex(category => category.id === categoryId);
    if (index < 0) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categorySettings.length) return;

    const category = categorySettings[index];
    categorySettings.splice(index, 1);
    categorySettings.splice(targetIndex, 0, category);
    renderCategoryEditors();
    updateTypeOptions();
    render();
  }

  function linePath(d) {
    const end = lineEnd(d);
    return `M${d.x},${d.y} L${end.x},${end.y}`;
  }

  function translatePosition(position) {
    return `translate(${position.x},${position.y})`;
  }

  function clampBoxPosition(position, dimensions, settings) {
    return {
      x: Math.max(0, Math.min(settings.width - dimensions.width, position.x)),
      y: Math.max(0, Math.min(settings.height - dimensions.height, position.y))
    };
  }

  function getBoxPosition(key, fallback, dimensions, settings) {
    const manual = manualBoxPositions[key];
    const position = manual && Number.isFinite(manual.x) && Number.isFinite(manual.y) ? manual : fallback;
    return clampBoxPosition(position, dimensions, settings);
  }

  function attachBoxDragging(group, key, position, dimensions, settings, label) {
    const state = { x: position.x, y: position.y };
    group.call(d3.drag()
      .on("start", function () {
        d3.select(this).classed("is-dragging", true);
      })
      .on("drag", function (event) {
        const next = clampBoxPosition({ x: state.x + event.dx, y: state.y + event.dy }, dimensions, settings);
        state.x = next.x;
        state.y = next.y;
        manualBoxPositions[key] = next;
        d3.select(this).attr("transform", translatePosition(next));
      })
      .on("end", function () {
        d3.select(this).classed("is-dragging", false);
        setStatusMessage(`${label} moved.`, "ok");
      }));
  }

  function drawLegend(svg, settings) {
    const rowHeight = 40;
    const verticalPadding = 18;
    const dimensions = { width: 430, height: verticalPadding * 2 + categorySettings.length * rowHeight };
    const position = getBoxPosition("legend", { x: 40, y: settings.height - 150 }, dimensions, settings);
    const group = svg.append("g")
      .attr("class", "legend-layer movable-map-box")
      .attr("transform", translatePosition(position));

    group.append("rect")
      .attr("class", "legend-box")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", dimensions.width)
      .attr("height", dimensions.height)
      .attr("rx", 18);

    categorySettings.forEach((category, index) => {
      const itemY = verticalPadding + index * rowHeight + rowHeight / 2;
      const legendMarkerSize = Math.max(8, Math.min(18, getCategoryMarkerSize(category, settings)));
      drawMarkerSymbol(group, category, 54, itemY, legendMarkerSize);
      group.append("text")
        .attr("class", "legend-text")
        .attr("x", 86)
        .attr("y", itemY)
        .attr("font-size", 22)
        .attr("font-family", settings.fontFamily)
        .attr("text-anchor", "start")
        .attr("dominant-baseline", "middle")
        .text(category.label);
    });

    attachBoxDragging(group, "legend", position, dimensions, settings, "Legend");
  }

  function drawCallouts(svg, calloutRows, settings, mapBounds) {
    const rowHeight = 38;
    const dimensions = { width: 420, height: 28 + calloutRows.length * rowHeight };
    const fallback = {
      x: Math.min(settings.width - dimensions.width - 120, mapBounds.x1 + 30),
      y: Math.max(80, mapBounds.y0 + 150)
    };
    const position = getBoxPosition("callouts", fallback, dimensions, settings);
    const group = svg.append("g")
      .attr("class", "callout-layer movable-map-box")
      .attr("transform", translatePosition(position));

    group.append("rect")
      .attr("class", "callout-box")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", dimensions.width)
      .attr("height", dimensions.height);

    calloutRows.forEach((row, i) => {
      const itemY = 28 + i * rowHeight;
      const category = getCategory(row.type);
      const calloutMarkerSize = Math.max(7, Math.min(14, getCategoryMarkerSize(category, settings)));
      drawMarkerSymbol(group, category, 34, itemY - 6, calloutMarkerSize);
      const calloutText = group.append("text")
        .attr("class", "callout-text")
        .attr("x", 62)
        .attr("y", itemY)
        .attr("font-size", settings.labelSize)
        .attr("font-family", settings.fontFamily)
        .text(row.name);
      const footnote = getRenderableFootnote(row.footnote);
      if (footnote) appendSuperscript(calloutText, footnote, settings.labelSize);
      group.append("text")
        .attr("class", "legend-note")
        .attr("x", 62)
        .attr("y", itemY + 18)
        .attr("font-size", settings.labelSize - 2)
        .attr("font-family", settings.fontFamily)
        .text("Canada-wide, not shown on map");
    });

    attachBoxDragging(group, "callouts", position, dimensions, settings, "Callouts");
  }

  function drawMarkerSymbol(svg, category, cx, cy, size) {
    const markerData = { x: cx, y: cy, type: category.id };
    if (category.shape === "square") {
      const rect = svg.append("rect")
        .attr("class", `marker marker-${category.id}`)
        .attr("width", size * 2)
        .attr("height", size * 2)
        .attr("fill", category.colour)
        .attr("stroke", category.stroke);
      moveMarkerNode(rect, markerData, { markerSize: size });
      return rect;
    }

    if (category.shape === "circle") {
      const circle = svg.append("circle")
        .attr("class", `marker marker-${category.id}`)
        .attr("r", size)
        .attr("fill", category.colour)
        .attr("stroke", category.stroke);
      moveMarkerNode(circle, markerData, { markerSize: size });
      return circle;
    }

    const path = svg.append("path")
      .attr("class", `marker marker-${category.id}`)
      .attr("fill", category.colour)
      .attr("stroke", category.stroke);
    moveMarkerNode(path, markerData, { markerSize: size });
    return path;
  }

  function createMarkerElement(shape) {
    const tagName = shape === "circle" ? "circle" : shape === "square" ? "rect" : "path";
    return document.createElementNS("http://www.w3.org/2000/svg", tagName);
  }

  function markerPath(shape, size) {
    const s = size;
    const t = size * 0.38;

    if (shape === "diamond") return `M0,${-s} L${s},0 L0,${s} L${-s},0 Z`;
    if (shape === "triangle-up") return `M0,${-s} L${s},${s} L${-s},${s} Z`;
    if (shape === "triangle-down") return `M${-s},${-s} L${s},${-s} L0,${s} Z`;
    if (shape === "plus") {
      return `M${-t},${-s} L${t},${-s} L${t},${-t} L${s},${-t} L${s},${t} L${t},${t} L${t},${s} L${-t},${s} L${-t},${t} L${-s},${t} L${-s},${-t} L${-t},${-t} Z`;
    }
    if (shape === "cross") {
      const a = size * 0.32;
      return `M0,${-a} L${s - a},${-s} L${s},${-s + a} L${a},0 L${s},${s - a} L${s - a},${s} L0,${a} L${-s + a},${s} L${-s},${s - a} L${-a},0 L${-s},${-s + a} L${-s + a},${-s} Z`;
    }
    if (shape === "star") return starPath(size);

    return `M0,${-s} L${s},0 L0,${s} L${-s},0 Z`;
  }

  function getCategorySwatchSvg(category) {
    const fill = escapeHtml(category.colour);
    const stroke = escapeHtml(category.stroke);
    if (category.shape === "circle") {
      return `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="${fill}" stroke="${stroke}" stroke-width="2.5"></circle></svg>`;
    }
    if (category.shape === "square") {
      return `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="5" width="14" height="14" fill="${fill}" stroke="${stroke}" stroke-width="2.5"></rect></svg>`;
    }

    return `<svg viewBox="-12 -12 24 24" aria-hidden="true"><path d="${markerPath(category.shape, 9)}" fill="${fill}" stroke="${stroke}" stroke-width="2.5"></path></svg>`;
  }

  function starPath(size) {
    const points = [];
    for (let i = 0; i < 10; i++) {
      const radius = i % 2 === 0 ? size : size * 0.45;
      const angle = -Math.PI / 2 + i * Math.PI / 5;
      points.push(`${Math.cos(angle) * radius},${Math.sin(angle) * radius}`);
    }
    return `M${points.join(" L")} Z`;
  }

  function drawMissingMapMessage(svg, settings, title = "Map boundary could not load", message = "The app could not load the online or local GeoJSON boundary file. Check network access and the assets folder.") {
    svg.append("rect")
      .attr("x", 30)
      .attr("y", 70)
      .attr("width", settings.width - 60)
      .attr("height", 160)
      .attr("fill", "#fff7e6")
      .attr("stroke", "#d29a22");
    svg.append("text")
      .attr("x", 55)
      .attr("y", 115)
      .attr("font-size", 20)
      .attr("font-weight", 700)
      .text(title);
    svg.append("text")
      .attr("x", 55)
      .attr("y", 150)
      .attr("font-size", 16)
      .text(message);
  }

  function download(filename, text, mime) {
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function getCssVar(name, fallback) {
    const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return value || fallback;
  }

  function quoteFontFamily(fontFamily) {
    return String(fontFamily || "Lato, Arial, Helvetica, sans-serif")
      .split(",")
      .map(font => {
        const trimmed = font.trim();
        return /\s/.test(trimmed) && !/^["'].*["']$/.test(trimmed) ? `"${trimmed}"` : trimmed;
      })
      .join(", ");
  }

  function getExportCss() {
    const mapBackground = getCssVar("--map-background", "#ffffff");
    const mapBoundary = getCssVar("--map-boundary", "#ffffff");
    const mapBoxBorder = getCssVar("--map-box-border", "#333333");
    const ink = getCssVar("--ink", "#222222");
    const muted = getCssVar("--muted", "#666666");
    const leader = getCssVar("--leader", "#333333");
    const fontFamily = quoteFontFamily(getSettings().fontFamily);

    return `
      #mapSvg { background: ${mapBackground}; }
      .map-title { font-size: 24px; font-weight: 700; fill: ${ink}; font-family: ${fontFamily}; }
      .province { stroke: ${mapBoundary}; stroke-width: 1.2; }
      .marker { stroke-width: 2.2; }
      .leader-casing { fill: none; stroke: ${mapBackground}; stroke-linecap: round; stroke-linejoin: round; }
      .leader-line { fill: none; stroke: ${leader}; stroke-linecap: round; stroke-linejoin: round; }
      .map-label-background { fill: #ffffff; stroke: none; }
      .map-label { font-family: ${fontFamily}; font-weight: 700; fill: ${ink}; }
      .label-footnote { font-weight: 700; }
      .callout-box, .legend-box { fill: ${mapBackground}; stroke: ${mapBoxBorder}; stroke-width: 1.5; }
      .callout-text, .legend-text { font-family: ${fontFamily}; fill: ${ink}; font-weight: 700; }
      .legend-note { font-family: ${fontFamily}; fill: ${muted}; font-style: italic; }
    `;
  }

  function cloneSvgForExport() {
    const svgNode = document.querySelector("#mapSvg");
    if (!svgNode || !svgNode.children.length) throw new Error("There is no map preview to export.");

    const clone = svgNode.cloneNode(true);
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.setAttribute("version", "1.1");
    clone.setAttribute("style", `background:${getCssVar("--map-background", "#ffffff")}`);

    const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
    style.textContent = getExportCss();
    clone.insertBefore(style, clone.firstChild);
    return clone;
  }

  function exportSvg() {
    try {
      const clone = cloneSvgForExport();
      const source = `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(clone)}`;
      download("custom-map.svg", source, "image/svg+xml;charset=utf-8");
      setStatusMessage("SVG export started. Check your Downloads folder for custom-map.svg.", "ok");
    } catch (error) {
      setStatusMessage(`SVG export failed: ${error.message || String(error)}`, "danger");
    }
  }

  function exportPng() {
    let url = "";
    try {
      const settings = getSettings();
      const clone = cloneSvgForExport();
      const svgText = new XMLSerializer().serializeToString(clone);
      const svgBlob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
      url = URL.createObjectURL(svgBlob);
      const img = new Image();

      img.onload = function () {
        try {
          const scale = 2;
          const canvas = document.createElement("canvas");
          canvas.width = settings.width * scale;
          canvas.height = settings.height * scale;
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("The browser could not create a PNG canvas.");
          ctx.fillStyle = getCssVar("--map-background", "#ffffff");
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          URL.revokeObjectURL(url);
          canvas.toBlob(blob => {
            if (!blob) {
              setStatusMessage("PNG export failed: the browser could not create the PNG file.", "danger");
              return;
            }
            const pngUrl = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = pngUrl;
            a.download = "custom-map.png";
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(pngUrl);
            setStatusMessage("PNG export started. Check your Downloads folder for custom-map.png.", "ok");
          }, "image/png");
        } catch (error) {
          URL.revokeObjectURL(url);
          setStatusMessage(`PNG export failed: ${error.message || String(error)}`, "danger");
        }
      };

      img.onerror = function () {
        URL.revokeObjectURL(url);
        setStatusMessage("PNG export failed: the browser could not read the generated SVG image.", "danger");
      };

      img.src = url;
    } catch (error) {
      if (url) URL.revokeObjectURL(url);
      setStatusMessage(`PNG export failed: ${error.message || String(error)}`, "danger");
    }
  }

  function exportCsv() {
    const rows = getRows();
    const exportRows = rows.map(row => ({
      name: row.name,
      footnote: row.footnote,
      type: getCategoryLabel(row.type),
      lon: row.lon,
      lat: row.lat,
      hideLine: row.hideLine ? "yes" : ""
    }));
    const columns = ["name", "footnote", "type", "lon", "lat", "hideLine"];
    const csvBody = window.Papa ? Papa.unparse(exportRows, { columns }) : unparseCsvRows(exportRows, columns);
    const csv = "\ufeff" + csvBody;
    download("custom-map-data.csv", csv, "text/csv;charset=utf-8");
  }

  function saveProject() {
    const project = {
      version: 3,
      savedAt: new Date().toISOString(),
      boundary: currentBoundary,
      mapStyle: currentMapStylePreset,
      settings: getSettings(),
      categories: categorySettings.map(category => ({
        id: category.id,
        label: category.label,
        shape: category.shape,
        colour: category.colour,
        markerSize: category.markerSize,
        lineWidth: category.lineWidth,
        markerSizeCustom: Boolean(category.markerSizeCustom),
        lineWidthCustom: Boolean(category.lineWidthCustom),
        collapsed: category.collapsed
      })),
      rows: getRows().map(row => ({
        rowId: row.rowId,
        name: row.name,
        footnote: row.footnote,
        type: cleanType(row.type),
        lon: row.lon,
        lat: row.lat,
        hideLine: row.hideLine
      })),
      regionVisibility,
      regionFills,
      regionColourOverrides,
      regionValues,
      manualLabelPositions,
      manualBoxPositions
    };

    download("custom-map-project.json", JSON.stringify(project, null, 2), "application/json;charset=utf-8");
    setStatusMessage("Project save started. Check your Downloads folder for custom-map-project.json.", "ok");
  }

  function loadProject(file) {
    const reader = new FileReader();
    reader.onload = async function () {
      try {
        const project = JSON.parse(String(reader.result || "{}"));
        if (!project || !Array.isArray(project.rows)) throw new Error("Project file is missing rows.");

        currentBoundary = Object.prototype.hasOwnProperty.call(boundarySources, project.boundary) ? project.boundary : "canada";
        els.boundaryInput.value = currentBoundary;
        applyMapStylePreset(project.mapStyle || "goc-green", { applyMapColours: false, render: false });
        applySettings(project.settings || {});
        applyCategorySettings(project.categories || []);
        regionVisibility = project.regionVisibility || {};
        regionFills = project.regionFills || {};
        regionColourOverrides = project.regionColourOverrides || {};
        regionValues = project.regionValues || {};
        manualLabelPositions = project.manualLabelPositions || {};
        manualBoxPositions = project.manualBoxPositions || {};
        setRows(project.rows, [], { preserveManualPositions: true, render: false });
        await loadGeo();
        renderRegionControls();
        render();
        setStatusMessage(`Loaded project with ${project.rows.length} row(s).`, "ok");
      } catch (error) {
        setStatusMessage(`Project load failed: ${error.message || String(error)}`, "danger");
      }
    };
    reader.onerror = function () {
      setStatusMessage("Project load failed: the browser could not read the selected file.", "danger");
    };
    reader.readAsText(file);
  }

  function importCsv(file) {
    if (window.Papa) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: results => {
          const report = validateCsvImport(results);
          pendingCsvImport = { ...report, fileName: file && file.name ? file.name : "Selected CSV" };
          showCsvImportPreview(pendingCsvImport);
        },
        error: err => {
          pendingCsvImport = null;
          setStatusMessage(`CSV import failed: ${err.message || String(err)}`, "danger");
        }
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = function () {
      try {
        const report = validateCsvImport(parseCsvText(String(reader.result || "")));
        report.messages.unshift("Papa Parse did not load, so CarteData used its built-in CSV parser. Review quoted fields before importing.");
        pendingCsvImport = { ...report, fileName: file && file.name ? file.name : "Selected CSV" };
        showCsvImportPreview(pendingCsvImport);
      } catch (error) {
        pendingCsvImport = null;
        setStatusMessage(`CSV import failed: ${error.message || String(error)}`, "danger");
      }
    };
    reader.onerror = function () {
      pendingCsvImport = null;
      setStatusMessage("CSV import failed: the browser could not read the selected file.", "danger");
    };
    reader.readAsText(file);
  }

  function validateCsvImport(results) {
    const messages = [];
    const sourceFields = results.meta && results.meta.fields ? results.meta.fields.filter(Boolean) : [];
    const fields = sourceFields.map(normalizeHeader);
    const hasColumn = aliases => aliases.some(alias => fields.includes(alias));

    if (!hasColumn(csvColumnAliases.name)) messages.push("CSV is missing a project name column. Point labels will be blank unless names are added in the table.");
    if (!hasColumn(csvColumnAliases.type)) messages.push(`CSV is missing a type column. Blank or missing types are imported as ${getDefaultCategory().label}.`);
    if (!hasColumn(csvColumnAliases.lon)) messages.push("CSV is missing a longitude column. Rows without longitude become callouts.");
    if (!hasColumn(csvColumnAliases.lat)) messages.push("CSV is missing a latitude column. Rows without latitude become callouts.");

    (results.errors || []).forEach(error => {
      const rowNumber = Number.isFinite(error.row) ? error.row + 2 : "unknown";
      messages.push(`CSV row ${rowNumber}: ${error.message}`);
    });

    const rows = [];
    (results.data || []).forEach((rawRow, index) => {
      if (rawRow.__parsed_extra && rawRow.__parsed_extra.length) {
        messages.push(`CSV row ${index + 2}: extra value(s) found. If a project name contains a comma, wrap the name in double quotes.`);
      }

      const row = normalizeRow(rawRow);
      const hasLon = row.lon !== "";
      const hasLat = row.lat !== "";
      if (!row.name && !hasLon && !hasLat) return;
      if (row.footnote && !getRenderableFootnote(row.footnote)) {
        messages.push(`CSV row ${index + 2}: footnote must contain only letters and numbers to appear as superscript.`);
      }
      if (!row.name && hasLon && hasLat) messages.push(`CSV row ${index + 2}: name is blank, so only the marker dot will be shown.`);
      if (hasLon !== hasLat) {
        messages.push(`CSV row ${index + 2}: only one coordinate is filled in. It will be treated as a callout unless both lon and lat are provided.`);
      }
      if (hasLon && (row.lon < -180 || row.lon > 180)) messages.push(`CSV row ${index + 2}: longitude is outside the valid range (-180 to 180).`);
      if (hasLat && (row.lat < -90 || row.lat > 90)) messages.push(`CSV row ${index + 2}: latitude is outside the valid range (-90 to 90).`);
      if (hasLon && hasLat && row.lon > -40 && row.lat < -40) {
        messages.push(`CSV row ${index + 2}: coordinates may be swapped. Canadian longitudes are usually negative and latitudes are usually positive.`);
      }

      rows.push(row);
    });

    return { rows, messages, fields: sourceFields };
  }

  function debounce(fn, wait) {
    let timeout;
    return function () {
      clearTimeout(timeout);
      timeout = setTimeout(fn, wait);
    };
  }

  function initEvents() {
    if (els.loadSampleBtn) els.loadSampleBtn.addEventListener("click", () => setRows(sampleRows));
    els.ribbonLoadSampleBtn.addEventListener("click", () => setRows(sampleRows));
    els.ribbonOpenProjectBtn.addEventListener("click", () => els.projectInput.click());
    els.ribbonSaveProjectBtn.addEventListener("click", saveProject);
    els.ribbonImportCsvBtn.addEventListener("click", () => els.csvInput.click());
    els.ribbonExportCsvBtn.addEventListener("click", exportCsv);
    els.ribbonAutoPlaceBtn.addEventListener("click", autoPlaceLabels);
    els.ribbonExportSvgBtn.addEventListener("click", exportSvg);
    els.ribbonExportPngBtn.addEventListener("click", exportPng);
    els.addRowBtn.addEventListener("click", () => {
      const tr = addRow();
      tr.classList.add("is-new");
      tr.scrollIntoView({ block: "nearest", behavior: "smooth" });
      tr.querySelector(".name-input").focus();
      window.setTimeout(() => tr.classList.remove("is-new"), 120);
    });
    els.clearRowsBtn.addEventListener("click", () => setRows([]));
    els.deleteSelectedBtn.addEventListener("click", () => {
      const selectedRows = Array.from(els.tableBody.querySelectorAll("tr"))
        .filter(tr => tr.querySelector(".row-select").checked);
      if (!selectedRows.length) {
        setStatusMessage("Select one or more rows before deleting.", "warning");
        return;
      }

      selectedRows.forEach(tr => tr.classList.add("is-deleting"));
      els.deleteSelectedBtn.disabled = true;
      window.setTimeout(() => {
        selectedRows.forEach(tr => tr.remove());
        updateDeleteButtonState();
        refreshRegionColoursFromRows();
        render();
      }, 260);
    });
    els.renderBtn.addEventListener("click", autoPlaceLabels);
    if (els.downloadCsvBtn) els.downloadCsvBtn.addEventListener("click", exportCsv);
    if (els.saveProjectBtn) els.saveProjectBtn.addEventListener("click", saveProject);
    if (els.exportSvgBtn) els.exportSvgBtn.addEventListener("click", exportSvg);
    if (els.exportPngBtn) els.exportPngBtn.addEventListener("click", exportPng);
    els.projectTableTab.addEventListener("click", () => switchDataTable("projects"));
    els.regionTableTab.addEventListener("click", () => switchDataTable("regions"));
    if (els.updateRegionValuesBtn) els.updateRegionValuesBtn.addEventListener("click", () => updateRegionValuesFromProjectPoints({ selectRegions: true }));
    els.applyRegionValueColoursBtn.addEventListener("click", () => {
      applyRegionColoursByValue();
      setStatusMessage("Applied region colours from the Map regions table.", "ok");
    });
    els.resetRegionValuesBtn.addEventListener("click", resetRegionValues);
    els.csvInput.addEventListener("change", e => {
      const file = e.target.files && e.target.files[0];
      if (file) importCsv(file);
      e.target.value = "";
    });
    els.projectInput.addEventListener("change", e => {
      const file = e.target.files && e.target.files[0];
      if (file) loadProject(file);
      e.target.value = "";
    });
    els.statusBox.addEventListener("click", handleStatusAction);
    document.querySelector("#projectTable").addEventListener("paste", pasteIntoTable);
    document.addEventListener("click", event => {
      const resetButton = event.target.closest(".reset-default-btn");
      if (resetButton) resetLayoutInputToDefault(resetButton);
    });
    [
      els.mapTitleInput,
      els.widthInput,
      els.heightInput,
      els.labelSizeInput,
      els.markerSizeInput,
      els.lineWidthInput,
      els.labelCharsInput,
      els.fontFamilyInput,
      els.showLegendInput,
      els.showCalloutsInput,
      els.showLineCasingInput,
      els.lockMarkerCoordinatesInput
    ].filter(Boolean).forEach(el => el.addEventListener("change", handleLayoutSettingsChange));
    els.addCategoryBtn.addEventListener("click", addCategory);
    els.categoryList.addEventListener("change", handleCategorySettingsChange);
    els.categoryList.addEventListener("input", debounce(handleCategorySettingsChange, 250));
    els.categoryList.addEventListener("click", event => {
      const removeButton = event.target.closest(".remove-category-btn");
      if (removeButton) removeCategory(removeButton.dataset.categoryId);

      const moveButton = event.target.closest(".move-category-btn");
      if (moveButton) moveCategory(moveButton.dataset.categoryId, moveButton.dataset.direction);

      const toggleButton = event.target.closest(".toggle-category-btn");
      if (toggleButton) toggleCategory(toggleButton.dataset.categoryId);
    });
    els.regionTableBody.addEventListener("change", event => {
      if (event.target.classList.contains("region-table-included-input")) {
        regionVisibility[event.target.dataset.regionId] = event.target.checked;
        renderRegionControls();
        render();
        return;
      }

      if (event.target.classList.contains("region-value-input")) {
        const value = normalizeRegionValue(event.target.value);
        if (value === "") {
          delete regionValues[event.target.dataset.regionId];
        } else {
          regionValues[event.target.dataset.regionId] = value;
        }
        applyRegionColoursByValue();
        return;
      }

      if (event.target.classList.contains("region-colour-input")) {
        regionColourOverrides[event.target.dataset.regionId] = true;
        regionFills[event.target.dataset.regionId] = event.target.value;
        renderRegionValueTable();
        render();
        return;
      }

      if (event.target.classList.contains("region-colour-set-input")) {
        if (event.target.value) {
          regionColourOverrides[event.target.dataset.regionId] = true;
          regionFills[event.target.dataset.regionId] = event.target.value;
          renderRegionValueTable();
          render();
          return;
        }
        delete regionColourOverrides[event.target.dataset.regionId];
        applyRegionColoursByValue();
        return;
      }
    });
    els.mapStylePresetInput.addEventListener("change", () => {
      applyMapStylePreset(els.mapStylePresetInput.value);
    });
    els.boundaryInput.addEventListener("change", async () => {
      currentBoundary = Object.prototype.hasOwnProperty.call(boundarySources, els.boundaryInput.value) ? els.boundaryInput.value : "canada";
      regionVisibility = {};
      regionFills = {};
      regionValues = {};
      regionColourOverrides = {};
      await loadGeo();
      render();
    });
    els.regionPresetInput.addEventListener("change", () => {
      applyRegionPreset(els.regionPresetInput.value);
      els.regionPresetInput.value = "";
    });
    els.selectAllRegionsBtn.addEventListener("click", () => setAllRegions(true));
    els.clearRegionsBtn.addEventListener("click", () => setAllRegions(false));
    els.selectProjectRegionsBtn.addEventListener("click", selectRegionsWithProjectPoints);
    els.resetRegionColoursBtn.addEventListener("click", resetRegionColours);
  }

  async function loadGeo() {
    const source = boundarySources[currentBoundary] || boundarySources.canada;
    try {
      canadaGeo = normalizeBoundaryGeoJson(await fetchGeoJsonWithFallback(source), source);
      initializeRegionVisibility();
      applyRegionColoursByValue(false);
    } catch (error) {
      canadaGeo = null;
      renderRegionControls();
      console.warn(`Could not load ${source.label} GeoJSON`, error);
    }
  }

  function normalizeBoundaryGeoJson(geo, source) {
    if (!geo || source.projection !== "canada") return geo;
    return rewindGeoJsonForD3(geo);
  }

  function rewindGeoJsonForD3(geo) {
    return {
      ...geo,
      features: Array.isArray(geo.features)
        ? geo.features.map(feature => ({
          ...feature,
          geometry: rewindGeometryForD3(feature.geometry)
        }))
        : geo.features
    };
  }

  function rewindGeometryForD3(geometry) {
    if (!geometry || !geometry.coordinates) return geometry;
    if (geometry.type === "Polygon") {
      return {
        ...geometry,
        coordinates: rewindPolygonForD3(geometry.coordinates)
      };
    }
    if (geometry.type === "MultiPolygon") {
      return {
        ...geometry,
        coordinates: geometry.coordinates.map(rewindPolygonForD3)
      };
    }
    return geometry;
  }

  function rewindPolygonForD3(rings) {
    return rings.map((ring, index) => {
      const area = planarRingArea(ring);
      const shouldReverseExterior = index === 0 && area > 0;
      const shouldReverseHole = index > 0 && area < 0;
      return shouldReverseExterior || shouldReverseHole ? ring.slice().reverse() : ring.slice();
    });
  }

  function planarRingArea(ring) {
    if (!Array.isArray(ring) || ring.length < 4) return 0;
    let area = 0;
    for (let i = 0; i < ring.length - 1; i += 1) {
      area += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
    }
    return area / 2;
  }

  async function fetchJson(url) {
    const response = await fetch(url, { cache: "force-cache" });
    if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`);
    return response.json();
  }

  async function fetchGeoJsonWithFallback(source) {
    const localBoundary = getLocalBoundary(source);
    if (window.location.protocol === "file:" && localBoundary) {
      return localBoundary;
    }

    try {
      return await fetchJson(source.url);
    } catch (onlineError) {
      console.warn(`Could not load online ${source.label} GeoJSON. Trying local fallback.`, onlineError);
      if (localBoundary) return localBoundary;
      return fetchJson(source.fallbackUrl);
    }
  }

  function getLocalBoundary(source) {
    if (!window.CARTEDATA_LOCAL_BOUNDARIES || !source || !source.fallbackKey) return null;
    return window.CARTEDATA_LOCAL_BOUNDARIES[source.fallbackKey] || null;
  }

  async function init() {
    renderRibbonIcons();
    initEvents();
    els.boundaryInput.value = currentBoundary;
    renderMapStyleOptions();
    renderCategoryEditors();
    setRows(sampleRows);
    await loadGeo();
    render();
  }

  init();
})();

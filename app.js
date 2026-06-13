(async function () {
  const appConfig = window.PLOTYPUS_TEST_MODE
    ? (window.PLOTYPUS_CONFIG || {})
    : await (window.PLOTYPUS_CONFIG_READY || Promise.resolve(window.PLOTYPUS_CONFIG || {}));
  const cloneConfigList = (items) => Array.isArray(items) ? items.map((item) => ({ ...item })) : [];
  const defaultFontFamily = appConfig.defaultFontFamily || "Lato, Segoe UI, Arial, sans-serif";

  if (!window.d3) {
    const message = "Plotypus could not start because D3 did not load. Check network access or vendor D3 locally before opening this file offline.";
    const statusBox = document.querySelector("#statusBox");
    const mapSvg = document.querySelector("#mapSvg");
    if (statusBox) statusBox.innerHTML = `<div class="status-danger">${message}</div>`;
    if (mapSvg) {
      mapSvg.setAttribute("viewBox", "0 0 900 360");
      mapSvg.innerHTML = `<rect width="900" height="360" fill="#fff7e6"></rect><text x="450" y="180" text-anchor="middle" font-family="${defaultFontFamily}" font-size="22" font-weight="700" fill="#8a1f11">${message}</text>`;
    }
    return;
  }

  const fallbackRegionColours = ["#c7ded5", "#96c6b4", "#6caf94", "#078c70"];
  const boundarySources = appConfig.boundarySources || {};
  const sampleRows = cloneConfigList(appConfig.sampleRows);
  const mapStylePresets = appConfig.mapStylePresets || window.MAP_APP_STYLE_PRESETS || appConfig.fallbackMapStylePresets || {
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
  const csvColumnAliases = appConfig.csvColumnAliases || {
    name: ["name", "project", "project name"],
    footnote: ["footnote", "footnote marker", "note", "superscript"],
    type: ["type", "category", "project type"],
    priority: ["priority", "label priority", "importance", "rank"],
    lon: ["lon", "longitude", "long"],
    lat: ["lat", "latitude"],
    hideLine: ["hide line", "hide lines", "hideline", "no line", "no leader line"]
  };
  const tableFields = appConfig.tableFields || ["name", "footnote", "type", "priority", "lon", "lat"];
  const layoutDefaults = appConfig.layoutDefaults || {
    bookSizeInput: "wide-map",
    imageSizeInput: "full",
    labelSizeInput: 12,
    mapScaleInput: 100,
    markerSizeInput: 10,
    lineWidthInput: 2,
    labelCharsInput: 24
  };
  const storageKeys = appConfig.storageKeys || {};
  const activeTableStorageKey = storageKeys.activeTable || "plotypus.activeTable";
  const layoutPreferencesStorageKey = storageKeys.layoutPreferences || "plotypus.layoutPreferences";
  const dataTableNames = appConfig.dataTableNames || ["projects", "regions", "preview"];
  const imageSizePresets = appConfig.imageSizePresets || {};
  const regionPresetOptions = appConfig.regionPresetOptions || { canada: [], world: [] };
  const markerShapes = cloneConfigList(appConfig.markerShapes);
  const configuredColourPresets = cloneConfigList(appConfig.categoryColourPresets);
  const colourPresets = configuredColourPresets.length ? configuredColourPresets : window.MAP_APP_CATEGORY_COLOUR_PRESETS || [];
  const fontOptions = cloneConfigList(appConfig.fontOptions);
  const iconPaths = window.PLOTYPUS_ICON_PATHS || {};
  const configuredCategorySettings = cloneConfigList(appConfig.categorySettings);
  const categorySettings = configuredCategorySettings.length ? configuredCategorySettings : [
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
    projectTable: document.querySelector("#projectTable"),
    regionTableBody: document.querySelector("#regionTable tbody"),
    tablePanelTitle: document.querySelector("#tablePanelTitle"),
    projectTableTab: document.querySelector("#projectTableTab"),
    regionTableTab: document.querySelector("#regionTableTab"),
    previewTableTab: document.querySelector("#previewTableTab"),
    projectTablePane: document.querySelector("#projectTablePane"),
    regionTablePane: document.querySelector("#regionTablePane"),
    previewTablePane: document.querySelector("#previewTablePane"),
    tableActions: Array.from(document.querySelectorAll(".table-actions")),
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
    exportSvgBtn: document.querySelector("#exportSvgBtn"),
    exportPngBtn: document.querySelector("#exportPngBtn"),
    bookSizeInput: document.querySelector("#bookSizeInput"),
    imageSizeInput: document.querySelector("#imageSizeInput"),
    mapHost: document.querySelector("#mapHost"),
    labelSizeInput: document.querySelector("#labelSizeInput"),
    mapScaleInput: document.querySelector("#mapScaleInput"),
    markerSizeInput: document.querySelector("#markerSizeInput"),
    lineWidthInput: document.querySelector("#lineWidthInput"),
    labelCharsInput: document.querySelector("#labelCharsInput"),
    fontFamilyInput: document.querySelector("#fontFamilyInput"),
    showLegendInput: document.querySelector("#showLegendInput"),
    showCalloutsInput: document.querySelector("#showCalloutsInput"),
    compactFurnitureInput: document.querySelector("#compactFurnitureInput"),
    showLineCasingInput: document.querySelector("#showLineCasingInput"),
    routeDenseLeadersInput: document.querySelector("#routeDenseLeadersInput"),
    showDistanceMarkersInput: document.querySelector("#showDistanceMarkersInput"),
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
  const defaultMapStylePreset = appConfig.defaultMapStylePreset || Object.keys(mapStylePresets)[0] || "goc-green";
  let currentMapStylePreset = defaultMapStylePreset;
  let currentBoundary = "canada";
  let renderOutputMode = "web";
  let mapScaleControlsVisible = false;
  let draggedCategoryId = null;
  let activeCategoryDropEditor = null;
  let activeCategoryDropPlacement = null;
  let pendingRenderFrame = null;
  let pendingRenderOptions = null;

  function on(element, eventName, handler) {
    if (element) element.addEventListener(eventName, handler);
  }

  function setPreviewBusy(isBusy) {
    if (!els.mapHost) return;
    els.mapHost.classList.toggle("is-rendering", Boolean(isBusy));
    els.mapHost.setAttribute("aria-busy", isBusy ? "true" : "false");
  }

  function mergeRenderOptions(current, next) {
    return {
      ...(current || {}),
      ...(next || {}),
      autoPlace: Boolean((current && current.autoPlace) || (next && next.autoPlace))
    };
  }

  function scheduleRender(options = {}) {
    pendingRenderOptions = mergeRenderOptions(pendingRenderOptions, options);
    setPreviewBusy(true);
    if (pendingRenderFrame !== null) return;

    pendingRenderFrame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const renderOptions = pendingRenderOptions || {};
        pendingRenderFrame = null;
        pendingRenderOptions = null;
        try {
          render(renderOptions);
        } finally {
          setPreviewBusy(false);
        }
      });
    });
  }

  function getMapStylePreset(presetId = currentMapStylePreset) {
    return mapStylePresets[presetId] || mapStylePresets[defaultMapStylePreset] || Object.values(mapStylePresets)[0];
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
    document.querySelectorAll("[data-setting-icon]").forEach(iconSlot => {
      const icon = iconPaths[iconSlot.dataset.settingIcon];
      if (!icon || iconSlot.querySelector("svg")) return;
      iconSlot.innerHTML = `
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          ${icon.join("")}
        </svg>
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
    els.categoryList.innerHTML = categorySettings.map((category, index) => `
      <div class="category-editor${category.collapsed ? " is-collapsed" : ""}" data-category-id="${escapeHtml(category.id)}">
        <div class="category-header">
          <div class="category-title-block">
            <span class="category-swatch">${getCategorySwatchSvg(category)}</span>
            <span>
              <strong title="${escapeHtml(category.label)}">${escapeHtml(category.label)}</strong>
              <small>${escapeHtml(markerShapes.find(shape => shape.value === category.shape)?.label || "Marker")} · ${escapeHtml(getPresetValueForColour(category.colour) ? getRegionColourPresetLabel(0, 1).replace("Colour 1", "Preset colour") : "Custom colour")}</small>
            </span>
          </div>
          <button class="toggle-category-btn icon-button" type="button" data-category-id="${escapeHtml(category.id)}" aria-label="${category.collapsed ? "Expand" : "Collapse"} ${escapeHtml(category.label)}" title="${category.collapsed ? "Expand" : "Collapse"}">${category.collapsed ? "▸" : "▾"}</button>
          <div class="category-actions">
            <button class="category-drag-handle icon-button" type="button" draggable="true" data-category-id="${escapeHtml(category.id)}" aria-label="Drag ${escapeHtml(category.label)} to reorder" title="Drag to reorder">
              <svg class="category-grip-icon" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="9" cy="6" r="1.8"></circle>
                <circle cx="15" cy="6" r="1.8"></circle>
                <circle cx="9" cy="12" r="1.8"></circle>
                <circle cx="15" cy="12" r="1.8"></circle>
                <circle cx="9" cy="18" r="1.8"></circle>
                <circle cx="15" cy="18" r="1.8"></circle>
              </svg>
            </button>
            <button class="remove-category-btn icon-button" type="button" data-category-id="${escapeHtml(category.id)}" aria-label="Remove ${escapeHtml(category.label)}" title="Remove"${categorySettings.length <= 1 ? " disabled" : ""}>×</button>
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

  function toPriority(value) {
    if (value === null || value === undefined || value === "") return 0;
    const priority = Math.round(Number(String(value).trim()));
    return Number.isFinite(priority) ? Math.max(0, Math.min(5, priority)) : 0;
  }

  function normalizeFootnote(value) {
    return String(value || "").trim();
  }

  function getRenderableFootnote(value) {
    const footnote = normalizeFootnote(value);
    return /^([A-Za-z0-9]+|\*)$/.test(footnote) ? footnote : "";
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
      priority: toPriority(getField(row, csvColumnAliases.priority)),
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

  function addRow(row = { name: "", footnote: "", type: getDefaultCategory().id, priority: 0, lon: "", lat: "", hideLine: false }) {
    const tr = document.createElement("tr");
    const rowId = row.rowId ? String(row.rowId) : String(nextRowId);
    const priority = toPriority(row.priority);
    tr.dataset.rowId = rowId;
    const numericRowId = Number(rowId);
    nextRowId = Number.isFinite(numericRowId) ? Math.max(nextRowId, numericRowId + 1) : nextRowId + 1;
    tr.innerHTML = `
      <td><input class="name-input" type="text" value="${escapeHtml(row.name || "")}" title="${escapeHtml(row.name || "")}" aria-label="Project name"></td>
      <td><input class="footnote-input" type="text" value="${escapeHtml(row.footnote || "")}" aria-label="Footnote marker" maxlength="2" pattern="[A-Za-z0-9]*|[*]"></td>
      <td>
        <select class="type-input" title="${escapeHtml(getCategoryLabel(row.type))}" aria-label="Project type">
          ${getTypeOptions(row.type)}
        </select>
      </td>
      <td><input class="priority-input" type="number" min="0" max="5" step="1" value="${priority}" aria-label="Label priority"></td>
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
      priority: toPriority(tr.querySelector(".priority-input").value),
      lon: toNumber(tr.querySelector(".lon-input").value),
      lat: toNumber(tr.querySelector(".lat-input").value),
      hideLine: tr.querySelector(".hide-line-input").checked
    })).filter(row => row.name.length > 0 || row.lon !== "" || row.lat !== "");
  }

  function getBookSizePreset(value = els.bookSizeInput.value) {
    return imageSizePresets[value] ? imageSizePresets[value] : imageSizePresets[layoutDefaults.bookSizeInput];
  }

  function getImageSizePreset(bookSizeValue = els.bookSizeInput.value, imageSizeValue = els.imageSizeInput.value) {
    const book = getBookSizePreset(bookSizeValue);
    return book.sizes.find(size => size.value === imageSizeValue) || book.sizes[0];
  }

  function formatImageSizeOption(size) {
    return `${size.label} (${size.width} x ${size.height})`;
  }

  function findImageSizePresetByDimensions(width, height) {
    const parsedWidth = Number(width);
    const parsedHeight = Number(height);
    if (!parsedWidth || !parsedHeight) return null;

    for (const [bookValue, book] of Object.entries(imageSizePresets)) {
      const size = book.sizes.find(option => option.width === parsedWidth && option.height === parsedHeight);
      if (size) return { bookValue, sizeValue: size.value };
    }

    return null;
  }

  function renderImageSizeOptions() {
    const currentValue = els.imageSizeInput.value;
    const book = getBookSizePreset();
    els.imageSizeInput.innerHTML = book.sizes.map(size => (
      `<option value="${escapeHtml(size.value)}">${escapeHtml(formatImageSizeOption(size))}</option>`
    )).join("");
    els.imageSizeInput.value = book.sizes.some(size => size.value === currentValue) ? currentValue : layoutDefaults.imageSizeInput;
  }

  function renderBookSizeOptions() {
    const currentValue = els.bookSizeInput.value;
    const bookEntries = Object.entries(imageSizePresets);
    els.bookSizeInput.innerHTML = bookEntries.map(([value, preset]) => (
      `<option value="${escapeHtml(value)}">${escapeHtml(preset.label || value)}</option>`
    )).join("");
    els.bookSizeInput.value = imageSizePresets[currentValue] ? currentValue : layoutDefaults.bookSizeInput;
  }

  function renderFontOptions() {
    const fonts = fontOptions.length ? fontOptions : [{ label: "Lato", value: defaultFontFamily }];
    const currentValue = normalizeFontFamily(els.fontFamilyInput.value);
    els.fontFamilyInput.innerHTML = fonts.map((font) => (
      `<option value="${escapeHtml(font.value || font.label)}">${escapeHtml(font.label || font.value)}</option>`
    )).join("");
    els.fontFamilyInput.value = fonts.some(font => normalizeFontFamily(font.value || font.label) === currentValue)
      ? currentValue
      : defaultFontFamily;
  }

  function applyImageSizePreset(bookValue, imageSizeValue) {
    els.bookSizeInput.value = imageSizePresets[bookValue] ? bookValue : layoutDefaults.bookSizeInput;
    renderImageSizeOptions();
    const book = getBookSizePreset();
    els.imageSizeInput.value = book.sizes.some(size => size.value === imageSizeValue) ? imageSizeValue : layoutDefaults.imageSizeInput;
  }

  function normalizeLayoutPreferences(preferences = {}) {
    const bookSize = imageSizePresets[preferences.bookSize] ? preferences.bookSize : layoutDefaults.bookSizeInput;
    const book = getBookSizePreset(bookSize);
    const imageSize = book.sizes.some(size => size.value === preferences.imageSize)
      ? preferences.imageSize
      : layoutDefaults.imageSizeInput;
    return { bookSize, imageSize };
  }

  function getSavedLayoutPreferences() {
    try {
      const raw = window.localStorage.getItem(layoutPreferencesStorageKey);
      if (!raw) return null;
      return normalizeLayoutPreferences(JSON.parse(raw));
    } catch (error) {
      return null;
    }
  }

  function applySavedLayoutPreferences() {
    const preferences = getSavedLayoutPreferences();
    if (!preferences) return false;
    applyImageSizePreset(preferences.bookSize, preferences.imageSize);
    return true;
  }

  function saveLayoutPreferences() {
    try {
      window.localStorage.setItem(layoutPreferencesStorageKey, JSON.stringify(normalizeLayoutPreferences({
        bookSize: els.bookSizeInput.value,
        imageSize: els.imageSizeInput.value
      })));
    } catch (error) {
      // Private browsing or file restrictions should not block the editor.
    }
  }

  function normalizeLabelSizePt(value) {
    const parsed = Number(value);
    const fallback = layoutDefaults.labelSizeInput;
    const labelSize = Number.isFinite(parsed) ? parsed : fallback;
    return Math.max(12, Math.min(30, labelSize));
  }

  function normalizeMapScale(value) {
    const parsed = Number(value);
    const fallback = layoutDefaults.mapScaleInput;
    const mapScale = Number.isFinite(parsed) ? parsed : fallback;
    return Math.max(45, Math.min(115, mapScale));
  }

  const defaultPrintLabelSizePt = 18;
  const defaultWebLabelSizePx = 12;
  const minimumWebLabelSizePx = 12;
  const webLabelSizeScale = defaultWebLabelSizePx / defaultPrintLabelSizePt;

  function getWebLabelSize(printPt) {
    // Keep the control in print points, but never render map text below 12 px.
    return Math.max(minimumWebLabelSizePx, Math.round(printPt * webLabelSizeScale));
  }

  function normalizeFontFamily(value) {
    const fontFamily = String(value || "").trim();
    return fontFamily && fontFamily !== "Lato" ? fontFamily : defaultFontFamily;
  }

  function getSettings(options = {}) {
    const imageSize = getImageSizePreset();
    const outputMode = options.outputMode || renderOutputMode;
    const labelSizePt = normalizeLabelSizePt(els.labelSizeInput.value);
    const mapScale = normalizeMapScale(els.mapScaleInput.value);
    return {
      outputMode,
      bookSize: imageSizePresets[els.bookSizeInput.value] ? els.bookSizeInput.value : layoutDefaults.bookSizeInput,
      imageSize: imageSize.value,
      width: imageSize.width,
      height: imageSize.height,
      title: "",
      labelSizePt,
      labelSize: labelSizePt,
      labelSizeRender: outputMode === "print" ? labelSizePt : getWebLabelSize(labelSizePt),
      mapScale,
      markerSize: Number(els.markerSizeInput.value) || 10,
      lineWidth: Number(els.lineWidthInput.value) || 2,
      labelMaxChars: Number(els.labelCharsInput.value) || 26,
      fontFamily: normalizeFontFamily(els.fontFamilyInput.value),
      showLegend: els.showLegendInput.checked,
      showCallouts: els.showCalloutsInput.checked,
      compactFurniture: els.compactFurnitureInput.checked,
      showLineCasing: els.showLineCasingInput.checked,
      routeDenseLeaders: els.routeDenseLeadersInput.checked,
      showDistanceMarkers: els.showDistanceMarkersInput.checked,
      lockMarkerCoordinates: els.lockMarkerCoordinatesInput.checked
    };
  }

  function applySettings(settings = {}) {
    const matchedPreset = findImageSizePresetByDimensions(settings.width, settings.height);
    applyImageSizePreset(
      settings.bookSize || (matchedPreset && matchedPreset.bookValue) || layoutDefaults.bookSizeInput,
      settings.imageSize || (matchedPreset && matchedPreset.sizeValue) || layoutDefaults.imageSizeInput
    );
    if (settings.labelSizePt !== undefined || settings.labelSize !== undefined) {
      els.labelSizeInput.value = normalizeLabelSizePt(settings.labelSizePt !== undefined ? settings.labelSizePt : settings.labelSize);
    }
    if (settings.mapScale !== undefined) els.mapScaleInput.value = normalizeMapScale(settings.mapScale);
    if (settings.markerSize !== undefined) els.markerSizeInput.value = settings.markerSize;
    if (settings.lineWidth !== undefined) els.lineWidthInput.value = settings.lineWidth;
    if (settings.labelMaxChars !== undefined) els.labelCharsInput.value = settings.labelMaxChars;
    els.fontFamilyInput.value = normalizeFontFamily(settings.fontFamily);
    if (settings.showLegend !== undefined) els.showLegendInput.checked = Boolean(settings.showLegend);
    if (settings.showCallouts !== undefined) els.showCalloutsInput.checked = Boolean(settings.showCallouts);
    if (settings.compactFurniture !== undefined) els.compactFurnitureInput.checked = Boolean(settings.compactFurniture);
    if (settings.showLineCasing !== undefined) els.showLineCasingInput.checked = Boolean(settings.showLineCasing);
    if (settings.routeDenseLeaders !== undefined) els.routeDenseLeadersInput.checked = Boolean(settings.routeDenseLeaders);
    if (settings.showDistanceMarkers !== undefined) els.showDistanceMarkersInput.checked = Boolean(settings.showDistanceMarkers);
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
      els.regionTableBody.innerHTML = `<tr><td colspan="6" class="empty-table-message">Map boundary must load before region values can be edited.</td></tr>`;
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
        <td class="region-value-cell">
          <input class="region-value-input" type="number" step="any" value="${region.value === "" ? "" : region.value}" data-region-id="${escapeHtml(region.id)}" aria-label="${escapeHtml(region.name)} colour order">
        </td>
        <td>
          <select class="region-colour-set-input" data-region-id="${escapeHtml(region.id)}" aria-label="${escapeHtml(region.name)} approved fill colour">
            <option value=""${region.colourSource === "Auto by value" ? " selected" : ""}>Auto by value</option>
            ${approvedColours.map((colour, index) => `<option value="${escapeHtml(colour)}"${region.colourSource !== "Auto by value" && String(region.colour).toLowerCase() === colour.toLowerCase() ? " selected" : ""}>${escapeHtml(getRegionColourPresetLabel(index, approvedColours.length))}</option>`).join("")}
          </select>
        </td>
        <td>
          <span class="region-fill-picker">
            <input class="region-colour-input" type="color" value="${escapeHtml(region.colour)}" aria-label="${escapeHtml(region.name)} preview fill colour" data-region-id="${escapeHtml(region.id)}">
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

    renderRegionPresetOptions();
    initializeRegionVisibility();
    const regions = getRegionRows();
    const selectedCount = regions.filter(region => regionVisibility[region.id] !== false).length;
    els.regionSummary.textContent = `${selectedCount} of ${regions.length} regions selected.`;
    renderRegionValueTable();
  }

  function renderRegionPresetOptions() {
    const options = regionPresetOptions[currentBoundary] || regionPresetOptions.canada;
    const currentValue = els.regionPresetInput.value;
    els.regionPresetInput.innerHTML = options.map(option => `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`).join("");
    els.regionPresetInput.value = options.some(option => option.value === currentValue) ? currentValue : "";
    els.regionPresetInput.disabled = false;
    els.regionPresetInput.title = currentBoundary === "world" ? "Select countries by continent." : "";
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

  function getWorldPresetContinents(preset) {
    const groups = {
      africa: ["africa"],
      antarctica: ["antarctica"],
      asia: ["asia"],
      europe: ["europe"],
      "north-america": ["north america"],
      oceania: ["oceania"],
      "south-america": ["south america"]
    };
    return groups[preset] || [];
  }

  function regionMatchesPreset(name, presetNames) {
    const normalizedName = String(name || "").toLowerCase();
    return presetNames.some(presetName => normalizedName.includes(presetName));
  }

  function getFeatureContinent(feature) {
    const props = feature && feature.properties ? feature.properties : {};
    return String(props.continent || "").trim().toLowerCase();
  }

  function applyRegionPreset(preset) {
    if (!canadaGeo || !Array.isArray(canadaGeo.features) || !preset) return;
    if (preset === "all") {
      setAllRegions(true);
      return;
    }

    const presetNames = currentBoundary === "world" ? getWorldPresetContinents(preset) : getRegionPresetNames(preset);
    canadaGeo.features.forEach((feature, index) => {
      const id = getRegionId(feature, index);
      const matchValue = currentBoundary === "world" ? getFeatureContinent(feature) : getRegionName(feature, index);
      regionVisibility[id] = regionMatchesPreset(matchValue, presetNames);
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

    currentMapStylePreset = Object.prototype.hasOwnProperty.call(mapStylePresets, presetId) ? presetId : defaultMapStylePreset;
    els.mapStylePresetInput.value = currentMapStylePreset;
    els.themeStylesheet.setAttribute("href", preset.stylesheet);

    if (shouldApplyMapColours) {
      const settings = getSettings();
      preset.categoryStyles.forEach((style, index) => {
        const category = categorySettings[index];
        if (!category) return;
        category.colour = style.colour;
        category.stroke = style.stroke;
        category.markerSize = optionalNumber(style.markerSize) || category.markerSize || settings.markerSize;
        category.lineWidth = optionalNumber(style.lineWidth) || category.lineWidth || settings.lineWidth;
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
      if (name.includes("mackenzie")) return "left";
      if (name.includes("red chris") || name.includes("ksi lisims") || name.includes("north coast") || name.includes("lng canada")) return "left";
      if (name.includes("grays") || name.includes("arctic")) return "top";
      if (name.includes("northwest critical")) return "left";
      if (name.includes("pathways") || name.includes("mcilvenna")) return "bottom";
      if (name.includes("taltson") || name.includes("churchill") || name.includes("iqaluit") || name.includes("alto") || name.includes("wind west")) return "right";
      if (name.includes("northcliff") || name.includes("contrecoeur")) return "right";
      if (name.includes("nouveau") || name.includes("darlington") || name.includes("crawford")) return "bottom";
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

  function referenceSideOptions(item) {
    if (currentBoundary !== "canada") return [];
    const name = labelKeyText(item);
    const rules = [
      [/mackenzie|red chris|ksi lisims|north coast|lng canada/, ["left"]],
      [/grays|arctic/, ["top", "left"]],
      [/northwest critical|mcilvenna/, ["bottom", "left"]],
      [/pathways/, ["bottom"]],
      [/taltson|churchill|iqaluit|alto|wind west|northcliff|contrecoeur/, ["right"]],
      [/nouveau|darlington|crawford/, ["bottom", "right"]]
    ];
    const match = rules.find(([pattern]) => pattern.test(name));
    return match ? match[1] : [];
  }

  function labelPriority(row) {
    return toPriority(row && row.priority);
  }

  function comparePlacementOrder(a, b, points, settings) {
    const priority = labelPriority(b) - labelPriority(a);
    if (priority) return priority;
    const difficulty = placementDifficulty(b, points, settings) - placementDifficulty(a, points, settings);
    if (difficulty) return difficulty;
    return a.y - b.y || a.x - b.x;
  }

  function createProjection(geo, settings) {
    const source = boundarySources[currentBoundary] || boundarySources.canada;
    const mapExtent = source.projection === "world"
      ? [[settings.width * 0.06, settings.height * 0.10], [settings.width * 0.94, settings.height * 0.74]]
      : [[settings.width * 0.09, settings.height * 0.07], [settings.width * 0.91, settings.height * 0.78]];
    const scaleFactor = settings.mapScale / 100;
    const scaleCenter = [
      (mapExtent[0][0] + mapExtent[1][0]) / 2,
      (mapExtent[0][1] + mapExtent[1][1]) / 2
    ];
    const applyMapScale = projection => {
      if (scaleFactor === 1) return projection;
      const translate = projection.translate();
      projection
        .scale(projection.scale() * scaleFactor)
        .translate([
          scaleCenter[0] + scaleFactor * (translate[0] - scaleCenter[0]),
          scaleCenter[1] + scaleFactor * (translate[1] - scaleCenter[1])
        ]);
      return projection;
    };

    if (source.projection === "world") {
      return applyMapScale(d3.geoEqualEarth().fitExtent(mapExtent, geo));
    }

    return applyMapScale(d3.geoConicConformal()
      .parallels([49, 77])
      .rotate([96, 0])
      .center([0, 61])
      .fitExtent(mapExtent, geo));
  }

  function projectRowsForLayout(rows, projection) {
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

    return { mappedRows, calloutRows, projectedProblems, hiddenRegionProblems };
  }

  function createMapLayoutContext(visibleGeo, rows, settings) {
    const projection = createProjection(visibleGeo, settings);
    const path = d3.geoPath(projection);
    const mapBoundsArray = path.bounds(visibleGeo);
    const mapBounds = {
      x0: mapBoundsArray[0][0],
      y0: mapBoundsArray[0][1],
      x1: mapBoundsArray[1][0],
      y1: mapBoundsArray[1][1]
    };
    return {
      settings,
      projection,
      path,
      mapBounds,
      ...projectRowsForLayout(rows, projection)
    };
  }

  function makeLabelBox(d, side, settings, mapBounds = null) {
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

  function constrainShiftDrag(start, next, dragState, event) {
    const sourceEvent = event && event.sourceEvent ? event.sourceEvent : null;
    const axisKey = Object.prototype.hasOwnProperty.call(dragState, "axis") ? "axis" : "dragAxis";
    if (!sourceEvent || !sourceEvent.shiftKey) {
      dragState[axisKey] = null;
      return next;
    }

    const dx = next.x - start.x;
    const dy = next.y - start.y;
    if (!dragState[axisKey] && Math.hypot(dx, dy) > 2) {
      dragState[axisKey] = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
    }

    if (dragState[axisKey] === "x") return { x: next.x, y: start.y };
    if (dragState[axisKey] === "y") return { x: start.x, y: next.y };
    return next;
  }

  function clearDistanceMarkers() {
    d3.select(els.svg.node()).selectAll(".distance-markers").remove();
  }

  function setPreviewLayerVisibility(selector, visible) {
    const svgNode = els.svg ? els.svg.node() : null;
    if (!svgNode) return false;
    const layer = d3.select(svgNode).selectAll(selector);
    const hasLayer = Boolean(layer.size());
    if (hasLayer) layer.style("display", visible ? null : "none");
    return hasLayer;
  }

  function setMapFurnitureVisibility(key, visible, visibilityInput, label) {
    const selector = key === "legend" ? ".legend-layer" : ".callout-layer";
    if (visibilityInput) visibilityInput.checked = visible;
    const hasLayer = setPreviewLayerVisibility(selector, visible);
    if (!visible || hasLayer) {
      setStatusMessage(`${label} ${visible ? "shown" : "hidden"}.`, "ok");
      return true;
    }
    return false;
  }

  function rectCenter(rect) {
    return {
      x: (rect.x0 + rect.x1) / 2,
      y: (rect.y0 + rect.y1) / 2
    };
  }

  function rectFromPosition(position, dimensions) {
    return {
      x0: position.x,
      y0: position.y,
      x1: position.x + dimensions.width,
      y1: position.y + dimensions.height
    };
  }

  function inflateRect(rect, pad) {
    return {
      x0: rect.x0 - pad,
      y0: rect.y0 - pad,
      x1: rect.x1 + pad,
      y1: rect.y1 + pad
    };
  }

  function mapBoundsRect(mapBounds) {
    return {
      x0: mapBounds.x0,
      y0: mapBounds.y0,
      x1: mapBounds.x1,
      y1: mapBounds.y1
    };
  }

  function drawMeasurementLine(layer, measurement) {
    if (!measurement || measurement.distance < 1) return;
    const label = `${Math.round(measurement.distance)} px`;
    const variant = measurement.variant ? ` ${measurement.variant}` : "";
    const midX = (measurement.x1 + measurement.x2) / 2;
    const midY = (measurement.y1 + measurement.y2) / 2;
    const isHorizontal = Math.abs(measurement.y1 - measurement.y2) < Math.abs(measurement.x1 - measurement.x2);
    const tickSize = 5;

    layer.append("line")
      .attr("class", `distance-marker-line${variant}`)
      .attr("x1", measurement.x1)
      .attr("y1", measurement.y1)
      .attr("x2", measurement.x2)
      .attr("y2", measurement.y2);

    const ticks = isHorizontal
      ? [
          { x1: measurement.x1, y1: measurement.y1 - tickSize, x2: measurement.x1, y2: measurement.y1 + tickSize },
          { x1: measurement.x2, y1: measurement.y2 - tickSize, x2: measurement.x2, y2: measurement.y2 + tickSize }
        ]
      : [
          { x1: measurement.x1 - tickSize, y1: measurement.y1, x2: measurement.x1 + tickSize, y2: measurement.y1 },
          { x1: measurement.x2 - tickSize, y1: measurement.y2, x2: measurement.x2 + tickSize, y2: measurement.y2 }
        ];

    ticks.forEach(tick => {
      layer.append("line")
        .attr("class", `distance-marker-tick${variant}`)
        .attr("x1", tick.x1)
        .attr("y1", tick.y1)
        .attr("x2", tick.x2)
        .attr("y2", tick.y2);
    });

    const badgeWidth = Math.max(42, label.length * 7 + 14);
    const badgeX = clamp(midX - badgeWidth / 2, 4, measurement.settings.width - badgeWidth - 4);
    const badgeY = clamp(midY - 10, 4, measurement.settings.height - 22);
    const badge = layer.append("g")
      .attr("class", `distance-marker-badge${variant}`)
      .attr("transform", `translate(${badgeX},${badgeY})`);

    badge.append("rect")
      .attr("width", badgeWidth)
      .attr("height", 20);

    badge.append("text")
      .attr("x", badgeWidth / 2)
      .attr("y", 14)
      .text(label);
  }

  function nearestCanvasMeasurements(subjectRect, settings) {
    const center = rectCenter(subjectRect);
    const leftDistance = subjectRect.x0;
    const rightDistance = settings.width - subjectRect.x1;
    const topDistance = subjectRect.y0;
    const bottomDistance = settings.height - subjectRect.y1;
    const horizontal = leftDistance <= rightDistance
      ? { x1: 0, y1: center.y, x2: subjectRect.x0, y2: center.y, distance: leftDistance, settings }
      : { x1: subjectRect.x1, y1: center.y, x2: settings.width, y2: center.y, distance: rightDistance, settings };
    const vertical = topDistance <= bottomDistance
      ? { x1: center.x, y1: 0, x2: center.x, y2: subjectRect.y0, distance: topDistance, settings }
      : { x1: center.x, y1: subjectRect.y1, x2: center.x, y2: settings.height, distance: bottomDistance, settings };

    return [horizontal, vertical];
  }

  function nearestRectMeasurement(subjectRect, targetRect, settings) {
    const subjectCenter = rectCenter(subjectRect);
    const targetCenter = rectCenter(targetRect);
    const overlapX = Math.min(subjectRect.x1, targetRect.x1) - Math.max(subjectRect.x0, targetRect.x0);
    const overlapY = Math.min(subjectRect.y1, targetRect.y1) - Math.max(subjectRect.y0, targetRect.y0);
    const candidates = [];

    if (subjectRect.x0 >= targetRect.x1) {
      const y = clamp(subjectCenter.y, targetRect.y0, targetRect.y1);
      candidates.push({ x1: targetRect.x1, y1: y, x2: subjectRect.x0, y2: y, distance: subjectRect.x0 - targetRect.x1, settings });
    } else if (targetRect.x0 >= subjectRect.x1) {
      const y = clamp(subjectCenter.y, targetRect.y0, targetRect.y1);
      candidates.push({ x1: subjectRect.x1, y1: y, x2: targetRect.x0, y2: y, distance: targetRect.x0 - subjectRect.x1, settings });
    } else if (overlapX > 0) {
      candidates.push({ x1: subjectCenter.x, y1: subjectRect.y0, x2: subjectCenter.x, y2: targetRect.y0, distance: Math.abs(subjectRect.y0 - targetRect.y0), settings });
      candidates.push({ x1: subjectCenter.x, y1: subjectRect.y1, x2: subjectCenter.x, y2: targetRect.y1, distance: Math.abs(subjectRect.y1 - targetRect.y1), settings });
    }

    if (subjectRect.y0 >= targetRect.y1) {
      const x = clamp(subjectCenter.x, targetRect.x0, targetRect.x1);
      candidates.push({ x1: x, y1: targetRect.y1, x2: x, y2: subjectRect.y0, distance: subjectRect.y0 - targetRect.y1, settings });
    } else if (targetRect.y0 >= subjectRect.y1) {
      const x = clamp(subjectCenter.x, targetRect.x0, targetRect.x1);
      candidates.push({ x1: x, y1: subjectRect.y1, x2: x, y2: targetRect.y0, distance: targetRect.y0 - subjectRect.y1, settings });
    } else if (overlapY > 0) {
      candidates.push({ x1: subjectRect.x0, y1: subjectCenter.y, x2: targetRect.x0, y2: subjectCenter.y, distance: Math.abs(subjectRect.x0 - targetRect.x0), settings });
      candidates.push({ x1: subjectRect.x1, y1: subjectCenter.y, x2: targetRect.x1, y2: subjectCenter.y, distance: Math.abs(subjectRect.x1 - targetRect.x1), settings });
    }

    return candidates
      .filter(candidate => Number.isFinite(candidate.distance) && candidate.distance > 0)
      .sort((a, b) => a.distance - b.distance)[0] || null;
  }

  function nearestLabelMeasurement(subjectRect, activeLabelKey, settings) {
    const placed = lastLayout && Array.isArray(lastLayout.placed) ? lastLayout.placed : [];
    return placed
      .filter(label => label.labelKey !== activeLabelKey)
      .map(label => nearestRectMeasurement(subjectRect, labelVisualBox(label, 8), settings))
      .filter(Boolean)
      .sort((a, b) => a.distance - b.distance)[0] || null;
  }

  function drawDistanceMarkers(svg, settings, subjectRect, options = {}) {
    if (!settings.showDistanceMarkers) {
      clearDistanceMarkers();
      return;
    }
    clearDistanceMarkers();
    const layer = svg.append("g")
      .attr("class", "distance-markers")
      .attr("aria-label", "Distance markers");

    nearestCanvasMeasurements(subjectRect, settings)
      .forEach(measurement => drawMeasurementLine(layer, measurement));

    if (options.mapBounds) {
      drawMeasurementLine(layer, nearestRectMeasurement(subjectRect, mapBoundsRect(options.mapBounds), settings));
    }

    if (options.includeNearbyLabels) {
      drawMeasurementLine(layer, nearestLabelMeasurement(subjectRect, options.activeLabelKey, settings));
    }

    if (!layer.selectAll("*").size()) layer.remove();
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
    const canvasBottom = settings.height - 24;
    const sideGap = Math.max(24, settings.labelSize * 1.5);

    const slotsByItem = new Map();
    rows.forEach((row, rowIndex) => {
      row.forEach(slot => {
        const fontSize = labelFontSize(slot.box);
        const visualHeight = labelVisualHeight(slot.box);
        const maxTopBaseline = mapBounds.y0 - sideGap - visualHeight + fontSize;
        const minBottomBaseline = mapBounds.y1 + sideGap + fontSize;
        const topY = clamp(baseY - rowOffsets[rowIndex], minY, Math.max(minY, maxTopBaseline));
        const bottomY = clamp(baseY + rowOffsets[rowIndex], Math.min(canvasBottom, minBottomBaseline), canvasBottom);
        slotsByItem.set(slot.item, {
          side,
          x: slot.x,
          y: side === "top" ? topY : bottomY,
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
    const sideGap = Math.max(24, settings.labelSize * 1.5);
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
      const leftMin = 30 + slot.box.textWidth;
      const leftMax = mapBounds.x0 - sideGap;
      const rightMin = mapBounds.x1 + sideGap;
      const rightMax = settings.width - slot.box.textWidth - 30;
      const leftX = leftMax >= leftMin
        ? clamp(slot.item.x - lineOffset, leftMin, leftMax)
        : leftMin;
      const rightX = rightMax >= rightMin
        ? clamp(slot.item.x + lineOffset, rightMin, rightMax)
        : Math.max(30, rightMax);
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
      if (name.includes("red chris")) return Math.max(215, unit * 12.5);
      if (name.includes("north coast") || name.includes("lng canada")) return Math.max(190, unit * 11);
      return Math.max(170, unit * 10);
    }

    if (side === "right") {
      if (name.includes("iqaluit")) return Math.max(210, unit * 12);
      if (name.includes("churchill") || name.includes("taltson")) return Math.max(310, unit * 18);
      if (name.includes("northcliff")) return Math.max(190, unit * 11);
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
      if (name.includes("arctic")) return -unit * 18;
      if (name.includes("grays")) return -unit * 3;
      if (item.lon < -118) return -unit * 8;
      return -unit * 3;
    }

    if (side === "bottom") {
      if (name.includes("crawford")) return -unit * 4;
      if (name.includes("darlington")) return -unit * 1;
      if (name.includes("pathways")) return -unit * 11;
      if (name.includes("mcilvenna")) return -unit * 4;
      if (name.includes("nouveau")) return unit * 9;
      return unit * 1.5;
    }

    return 0;
  }

  function getDesignerVerticalOffset(item, side, settings) {
    if (currentBoundary !== "canada") return 0;
    const unit = settings.labelSize;
    const name = labelKeyText(item);

    if (side === "left") {
      if (name.includes("northwest critical")) return unit * 7;
      if (name.includes("red chris")) return -unit * 7;
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
    const boxes = items.map(d => makeLabelBox(d, side, settings, mapBounds));

    if (side === "left" || side === "right") {
      return createVerticalSlots(items, boxes, side, settings, mapBounds);
    }

    return createHorizontalSlots(items, boxes, side, settings, mapBounds);
  }

  function rectArea(rect) {
    return Math.max(0, rect.x1 - rect.x0) * Math.max(0, rect.y1 - rect.y0);
  }

  function outsideRectArea(rect, bounds) {
    return rectArea(rect) - rectOverlapArea(rect, bounds);
  }

  function subtractInterval(intervals, blockedStart, blockedEnd) {
    return intervals.flatMap(interval => {
      const start = Math.max(interval.start, blockedStart);
      const end = Math.min(interval.end, blockedEnd);
      if (end <= start) return [interval];
      const next = [];
      if (start > interval.start) next.push({ start: interval.start, end: start });
      if (end < interval.end) next.push({ start: end, end: interval.end });
      return next;
    });
  }

  function createCapacitySide(side, zone, settings, obstacles) {
    const axis = side === "left" || side === "right" ? "y" : "x";
    const minSegment = Math.max(24, settings.labelSize * 1.6);
    let intervals = axis === "y"
      ? [{ start: zone.y0, end: zone.y1 }]
      : [{ start: zone.x0, end: zone.x1 }];

    obstacles.forEach(obstacle => {
      if (!rectsOverlap(zone, obstacle.rect)) return;
      intervals = axis === "y"
        ? subtractInterval(intervals, obstacle.rect.y0, obstacle.rect.y1)
        : subtractInterval(intervals, obstacle.rect.x0, obstacle.rect.x1);
    });

    return {
      side,
      zone,
      axis,
      thickness: axis === "y" ? zone.x1 - zone.x0 : zone.y1 - zone.y0,
      intervals: intervals
        .map(interval => ({ ...interval, remaining: interval.end - interval.start }))
        .filter(interval => interval.remaining >= minSegment)
    };
  }

  function createPerimeterCapacity(settings, mapBounds, obstacles = []) {
    const margin = Math.max(24, settings.labelSize * 1.5);
    const overlapAllowance = Math.max(18, settings.labelSize * 1.4);
    const x0 = margin;
    const y0 = margin;
    const x1 = settings.width - margin;
    const y1 = settings.height - margin;
    const mapRect = mapBoundsRect(mapBounds);
    const zones = {
      left: {
        x0,
        y0,
        x1: Math.max(x0, mapRect.x0 + overlapAllowance),
        y1
      },
      right: {
        x0: Math.min(x1, mapRect.x1 - overlapAllowance),
        y0,
        x1,
        y1
      },
      top: {
        x0,
        y0,
        x1,
        y1: Math.max(y0, mapRect.y0 + overlapAllowance)
      },
      bottom: {
        x0,
        y0: Math.min(y1, mapRect.y1 - overlapAllowance),
        x1,
        y1
      }
    };

    return Object.fromEntries(Object.entries(zones).map(([side, zone]) => [
      side,
      createCapacitySide(side, zone, settings, obstacles)
    ]));
  }

  function cloneCapacity(capacity) {
    return Object.fromEntries(Object.entries(capacity).map(([side, state]) => [
      side,
      {
        ...state,
        zone: { ...state.zone },
        intervals: state.intervals.map(interval => ({ ...interval }))
      }
    ]));
  }

  function labelCapacityDemand(label, side, settings, mapBounds) {
    const box = makeLabelBox(label, side, settings, mapBounds);
    const gap = Math.max(8, settings.labelSize * 0.65);
    return {
      side,
      box,
      length: side === "left" || side === "right"
        ? labelVisualHeight(box) + gap
        : box.textWidth + gap,
      thickness: side === "left" || side === "right"
        ? box.textWidth
        : labelVisualHeight(box)
    };
  }

  function tryReserveCapacity(sideState, demand) {
    if (!sideState || sideState.thickness < demand.thickness * 0.72) return false;
    const interval = sideState.intervals
      .filter(item => item.remaining >= demand.length)
      .sort((a, b) => a.remaining - b.remaining)[0];
    if (!interval) return false;
    interval.remaining -= demand.length;
    return true;
  }

  function assessPerimeterFeasibility(labelRows, settings, mapBounds, obstacles = []) {
    if (!labelRows.length) {
      return { feasible: true, placed: 0, total: 0, capacity: createPerimeterCapacity(settings, mapBounds, obstacles), unmet: [] };
    }

    const capacity = cloneCapacity(createPerimeterCapacity(settings, mapBounds, obstacles));
    const ordered = labelRows.slice().sort((a, b) => {
      const aBox = makeLabelBox(a, preferredSide(a, settings, mapBounds), settings, mapBounds);
      const bBox = makeLabelBox(b, preferredSide(b, settings, mapBounds), settings, mapBounds);
      return Math.max(bBox.textWidth, labelVisualHeight(bBox)) - Math.max(aBox.textWidth, labelVisualHeight(aBox));
    });
    const unmet = [];

    ordered.forEach(label => {
      const preferred = preferredSide(label, settings, mapBounds);
      const sides = compatibleSideOrder(preferred);
      const placed = sides.some(side => tryReserveCapacity(capacity[side], labelCapacityDemand(label, side, settings, mapBounds)));
      if (!placed) unmet.push(label);
    });

    return {
      feasible: unmet.length === 0,
      placed: labelRows.length - unmet.length,
      total: labelRows.length,
      capacity,
      unmet
    };
  }

  function chooseFeasibleMapLayoutContext(visibleGeo, rows, baseSettings) {
    const startScale = normalizeMapScale(baseSettings.mapScale);
    const minScale = Math.min(startScale, 65);
    const step = 5;
    let fallback = null;

    for (let scale = startScale; scale >= minScale; scale -= step) {
      const settings = { ...baseSettings, mapScale: scale };
      const context = createMapLayoutContext(visibleGeo, rows, settings);
      const labelRows = context.mappedRows.filter(row => row.name);
      settings.layoutObstacles = getLayoutBoxObstacles(settings, context.calloutRows);
      const feasibility = assessPerimeterFeasibility(labelRows, settings, context.mapBounds, settings.layoutObstacles);
      const placementQuality = feasibility.feasible
        ? measurePlacementQuality(layoutLabels(labelRows, settings, context.mapBounds), settings)
        : null;
      const candidate = { ...context, settings, feasibility, placementQuality, requestedMapScale: startScale };
      if (isBetterScaleFallback(candidate, fallback)) fallback = candidate;
      if (feasibility.feasible && placementQualityAcceptable(placementQuality)) {
        return candidate;
      }
    }

    return fallback || createMapLayoutContext(visibleGeo, rows, baseSettings);
  }

  function candidateSideOrder(preferred) {
    return compatibleSideOrder(preferred).concat(oppositeSide(preferred));
  }

  function oppositeSide(side) {
    if (side === "left") return "right";
    if (side === "right") return "left";
    if (side === "top") return "bottom";
    return "top";
  }

  function compatibleSideOrder(preferred) {
    const adjacent = {
      left: ["top", "bottom"],
      right: ["top", "bottom"],
      top: ["left", "right"],
      bottom: ["left", "right"]
    };
    return [preferred].concat(adjacent[preferred] || ["left", "right"]);
  }

  function makeLabelPlacement(item, candidate) {
    return {
      ...item,
      labelSide: candidate.side,
      labelX: candidate.x,
      labelY: candidate.y,
      lines: candidate.box.lines,
      lineHeight: candidate.box.lineHeight,
      textWidth: candidate.box.textWidth,
      textHeight: candidate.box.textHeight,
      footnote: candidate.box.footnote,
      anchor: candidate.side === "left" ? "end" : "start"
    };
  }

  function createCandidateForSide(item, side, box, settings, distance, offset, mapBounds) {
    const margin = Math.max(22, settings.labelSize * 1.4);
    const minX = margin;
    const maxX = Math.max(minX, settings.width - box.textWidth - margin);
    const minY = margin + labelFontSize(box);
    const maxY = settings.height - margin;
    const sideGap = Math.max(24, settings.labelSize * 1.5);
    const mapRect = mapBoundsRect(mapBounds);

    if (side === "left") {
      const labelRightMin = margin + box.textWidth;
      const labelRightMax = settings.width - margin;
      const preferredMax = mapRect.x0 - sideGap;
      const x = preferredMax >= labelRightMin
        ? clamp(item.x - distance, labelRightMin, preferredMax)
        : clamp(item.x - distance, labelRightMin, labelRightMax);
      const y = clampLabelBaseline(labelBaselineForCenter(item.y + offset, box), box, minY, maxY);
      return { side, x, y, box };
    }

    if (side === "right") {
      const preferredMin = mapRect.x1 + sideGap;
      const x = preferredMin <= maxX
        ? clamp(item.x + distance, preferredMin, maxX)
        : clamp(item.x + distance, minX, maxX);
      const y = clampLabelBaseline(labelBaselineForCenter(item.y + offset, box), box, minY, maxY);
      return { side, x, y, box };
    }

    const x = clamp(item.x - box.textWidth / 2 + offset, minX, maxX);
    if (side === "top") {
      const outsideBottom = mapRect.y0 - sideGap;
      const desiredBottom = Math.min(item.y - distance, outsideBottom);
      const y = clamp(desiredBottom - labelVisualHeight(box) + labelFontSize(box), minY, maxY - labelVisualHeight(box) + labelFontSize(box));
      return { side, x, y, box };
    }

    const outsideTop = mapRect.y1 + sideGap;
    const desiredTop = Math.max(item.y + distance, outsideTop);
    const y = clamp(desiredTop + labelFontSize(box), minY, maxY - labelVisualHeight(box) + labelFontSize(box));
    return { side, x, y, box };
  }

  function createLabelCandidates(item, settings, mapBounds, perimeterCandidates = []) {
    const preferred = preferredSide(item, settings, mapBounds);
    const distanceFactors = [0.7, 1, 1.35, 1.75, 2.2];
    const offsetSteps = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5];
    const candidates = [];
    const seen = new Set();
    const addCandidate = candidate => {
      if (!candidate) return;
      const key = `${candidate.side}:${Math.round(candidate.x)}:${Math.round(candidate.y)}`;
      if (seen.has(key)) return;
      seen.add(key);
      candidates.push(candidate);
    };

    perimeterCandidates.forEach(addCandidate);

    candidateSideOrder(preferred).forEach(side => {
      const box = makeLabelBox(item, side, settings, mapBounds);
      const baseDistance = getDesignerLineOffset(item, side, settings);
      const baseOffset = side === "left" || side === "right"
        ? getDesignerVerticalOffset(item, side, settings)
        : getDesignerHorizontalOffset(item, side, settings);
      const offsetUnit = side === "left" || side === "right"
        ? Math.max(26, settings.labelSize * 1.8)
        : Math.max(34, settings.labelSize * 2.2);

      distanceFactors.forEach(distanceFactor => {
        offsetSteps.forEach(step => {
          const candidate = createCandidateForSide(
            item,
            side,
            box,
            settings,
            Math.max(34, baseDistance * distanceFactor),
            baseOffset + step * offsetUnit,
            mapBounds
          );
          addCandidate(candidate);
        });
      });
    });

    return candidates;
  }

  function createPerimeterCandidateMap(points, settings, mapBounds) {
    const byKey = new Map(points.map(point => [getLabelKey(point), []]));
    ["left", "right", "top", "bottom"].forEach(side => {
      const sideItems = points.slice().sort((a, b) => {
        if (side === "left" || side === "right") return a.y - b.y || a.x - b.x;
        return a.x - b.x || a.y - b.y;
      });
      const boxes = sideItems.map(item => makeLabelBox(item, side, settings, mapBounds));
      createSlots(sideItems, side, settings, mapBounds).forEach((slot, index) => {
        if (!slot) return;
        const item = sideItems[index];
        const key = getLabelKey(item);
        const list = byKey.get(key);
        if (!list) return;
        list.push({
          side,
          x: slot.x,
          y: slot.y,
          box: boxes[index]
        });
      });
    });
    return byKey;
  }

  const labelPlacementWeights = {
    labelOverlapBase: 24000,
    labelOverlapArea: 44,
    mapOverlapBase: 12000,
    mapOverlapArea: 22,
    outsideCanvasArea: 1600,
    leaderLineLength: 3.5,
    leaderLineSoftMaxRatio: 0.2,
    leaderLineSoftMaxMin: 155,
    leaderLineExcessArea: 1.2,
    sideChange: 110,
    leaderLineCrossing: 42000,
    boxObstacleBase: 36000,
    boxObstacleArea: 95,
    leaderBoxCrossing: 9500,
    markerOverlapBase: 9000,
    markerOverlapArea: 90,
    leaderMarkerCrossing: 2600,
    sameSideCrowding: 90,
    leaderDirection: 900,
    verticalOrderInversion: 18000,
    offMapBonus: 4200,
    outsideMapBoundsBonus: 900,
    nearMapCenterPenalty: 1200,
    adjacentSideChange: 90000,
    oppositeSideChange: 160000,
    radialSideMismatch: 38000
  };

  function markerObstacleRect(point, settings) {
    const category = getCategory(point.type);
    const markerSize = getCategoryMarkerSize(category, settings);
    const pad = Math.max(5, markerSize * 0.75);
    const radius = markerSize / 2 + pad;
    return {
      x0: point.x - radius,
      y0: point.y - radius,
      x1: point.x + radius,
      y1: point.y + radius
    };
  }

  function lineSegmentForLabel(label) {
    return {
      start: { x: label.x, y: label.y },
      end: lineEnd(label)
    };
  }

  function countCandidateCrossings(candidateLabel, placed) {
    if (candidateLabel.hideLine) return 0;
    const candidateLine = lineSegmentForLabel(candidateLabel);
    return placed.filter(label => {
      if (label.hideLine) return false;
      const line = lineSegmentForLabel(label);
      return segmentsCross(candidateLine.start, candidateLine.end, line.start, line.end);
    }).length;
  }

  function pointInRect(point, rect) {
    return point.x >= rect.x0 && point.x <= rect.x1 && point.y >= rect.y0 && point.y <= rect.y1;
  }

  function segmentIntersectsRect(start, end, rect) {
    if (pointInRect(start, rect) || pointInRect(end, rect)) return true;
    const corners = [
      { x: rect.x0, y: rect.y0 },
      { x: rect.x1, y: rect.y0 },
      { x: rect.x1, y: rect.y1 },
      { x: rect.x0, y: rect.y1 }
    ];
    return corners.some((corner, index) => {
      const next = corners[(index + 1) % corners.length];
      return segmentsCross(start, end, corner, next);
    });
  }

  function countMarkerLineCrossings(candidateLabel, points, settings) {
    if (candidateLabel.hideLine) return 0;
    const candidateLine = lineSegmentForLabel(candidateLabel);
    return points.filter(point => {
      if (point.rowId === candidateLabel.rowId) return false;
      return segmentIntersectsRect(candidateLine.start, candidateLine.end, markerObstacleRect(point, settings));
    }).length;
  }

  function leaderDirectionPenalty(label) {
    if (label.hideLine) return 0;
    const end = lineEnd(label);
    const dx = end.x - label.x;
    const dy = end.y - label.y;
    if (label.labelSide === "left" && dx > 0) return labelPlacementWeights.leaderDirection;
    if (label.labelSide === "right" && dx < 0) return labelPlacementWeights.leaderDirection;
    if (label.labelSide === "top" && dy > 0) return labelPlacementWeights.leaderDirection;
    if (label.labelSide === "bottom" && dy < 0) return labelPlacementWeights.leaderDirection;
    return 0;
  }

  function leaderLengthPenalty(label, settings) {
    if (label.hideLine) return 0;
    const end = lineEnd(label);
    const length = Math.hypot(label.x - end.x, label.y - end.y);
    const softMax = Math.max(
      labelPlacementWeights.leaderLineSoftMaxMin,
      settings.width * labelPlacementWeights.leaderLineSoftMaxRatio
    );
    if (length <= softMax) return 0;
    const excess = length - softMax;
    return excess * excess * labelPlacementWeights.leaderLineExcessArea;
  }

  function markerObstaclePenalty(label, points, settings) {
    const rect = labelRect(label);
    return points.reduce((score, point) => {
      if (point.rowId === label.rowId) return score;
      const overlap = rectOverlapArea(rect, markerObstacleRect(point, settings));
      if (!overlap) return score;
      return score + labelPlacementWeights.markerOverlapBase + overlap * labelPlacementWeights.markerOverlapArea;
    }, 0);
  }

  function layoutBoxObstaclePenalty(label, settings) {
    const obstacles = Array.isArray(settings.layoutObstacles) ? settings.layoutObstacles : [];
    if (!obstacles.length) return 0;
    const rect = labelRect(label);
    const line = lineSegmentForLabel(label);

    return obstacles.reduce((score, obstacle) => {
      const overlap = rectOverlapArea(rect, obstacle.rect);
      const overlapPenalty = overlap
        ? labelPlacementWeights.boxObstacleBase + overlap * labelPlacementWeights.boxObstacleArea
        : 0;
      const linePenalty = !label.hideLine && segmentIntersectsRect(line.start, line.end, obstacle.rect)
        ? labelPlacementWeights.leaderBoxCrossing
        : 0;
      return score + overlapPenalty + linePenalty;
    }, 0);
  }

  function sideCrowdingPenalty(candidateLabel, placed, settings) {
    const candidateRect = labelBackgroundRect(candidateLabel);
    const minGap = Math.max(10, settings.labelSize * 0.8);
    return placed.reduce((score, label) => {
      if (label.labelSide !== candidateLabel.labelSide) return score;
      const rect = labelBackgroundRect(label);
      const verticalSide = label.labelSide === "left" || label.labelSide === "right";
      const candidateCenter = verticalSide ? candidateRect.centerY : candidateRect.centerX;
      const labelCenter = verticalSide ? rect.centerY : rect.centerX;
      const candidateSpan = verticalSide
        ? candidateRect.y1 - candidateRect.y0
        : candidateRect.x1 - candidateRect.x0;
      const labelSpan = verticalSide
        ? rect.y1 - rect.y0
        : rect.x1 - rect.x0;
      const distance = Math.abs(labelCenter - candidateCenter);
      const target = (candidateSpan + labelSpan) / 2 + minGap;
      return distance < target ? score + (target - distance) * labelPlacementWeights.sameSideCrowding : score;
    }, 0);
  }

  function verticalOrderPenalty(candidateLabel, placed) {
    return placed.reduce((score, label) => {
      if (label.labelSide !== candidateLabel.labelSide) return score;
      if (label.labelSide !== "left" && label.labelSide !== "right") return score;
      const anchorOrder = Math.sign(candidateLabel.y - label.y);
      const labelOrder = Math.sign(candidateLabel.labelY - label.labelY);
      return anchorOrder && labelOrder && anchorOrder !== labelOrder
        ? score + labelPlacementWeights.verticalOrderInversion
        : score;
    }, 0);
  }

  function sideCompatibilityPenalty(candidateLabel, preferredSideValue, mapBounds) {
    const name = labelKeyText(candidateLabel);
    if (candidateLabel.labelSide === preferredSideValue) return 0;
    let score = candidateLabel.labelSide === oppositeSide(preferredSideValue)
      ? labelPlacementWeights.oppositeSideChange
      : labelPlacementWeights.adjacentSideChange;
    if (currentBoundary === "canada" && name.includes("pathways") && candidateLabel.labelSide === "right") {
      score += labelPlacementWeights.oppositeSideChange;
    }
    if (currentBoundary === "canada" && name.includes("pathways") && candidateLabel.labelSide === "left") {
      score += labelPlacementWeights.adjacentSideChange;
    }
    if (currentBoundary === "canada" && name.includes("mcilvenna") && candidateLabel.labelSide === "right") {
      score += labelPlacementWeights.oppositeSideChange;
    }
    if (currentBoundary === "canada" && name.includes("north coast") && candidateLabel.labelSide !== "left") {
      score += labelPlacementWeights.adjacentSideChange;
    }
    if (currentBoundary === "canada" && name.includes("iqaluit") && candidateLabel.labelSide !== "right") {
      score += labelPlacementWeights.oppositeSideChange;
    }
    if (currentBoundary === "canada" && name.includes("alto") && candidateLabel.labelSide !== "right") {
      score += labelPlacementWeights.oppositeSideChange;
    }
    if (currentBoundary === "canada" && name.includes("northwest critical") && candidateLabel.labelSide !== "left" && candidateLabel.labelSide !== "bottom") {
      score += labelPlacementWeights.oppositeSideChange;
    }
    const mapCenterX = (mapBounds.x0 + mapBounds.x1) / 2;
    const mapCenterY = (mapBounds.y0 + mapBounds.y1) / 2;
    if (candidateLabel.labelSide === "left" && candidateLabel.x > mapCenterX) score += labelPlacementWeights.radialSideMismatch;
    if (candidateLabel.labelSide === "right" && candidateLabel.x < mapCenterX) score += labelPlacementWeights.radialSideMismatch;
    if (candidateLabel.labelSide === "top" && candidateLabel.y > mapCenterY) score += labelPlacementWeights.radialSideMismatch;
    if (candidateLabel.labelSide === "bottom" && candidateLabel.y < mapCenterY) score += labelPlacementWeights.radialSideMismatch;
    return score;
  }

  function scoreCandidate(candidateLabel, placed, settings, mapBounds, preferredSideValue, points = placed) {
    const rect = labelRect(candidateLabel);
    const canvasRect = { x0: 0, y0: 0, x1: settings.width, y1: settings.height };
    const mapRect = mapBoundsRect(mapBounds);
    const lineEndPoint = lineEnd(candidateLabel);
    const lineLength = Math.hypot(candidateLabel.x - lineEndPoint.x, candidateLabel.y - lineEndPoint.y);
    const mapOverlap = rectOverlapArea(rect, mapRect);
    const outsideCanvas = outsideRectArea(rect, canvasRect);
    const sidePenalty = sideCompatibilityPenalty(candidateLabel, preferredSideValue, mapBounds);
    const crossingPenalty = countCandidateCrossings(candidateLabel, placed) * labelPlacementWeights.leaderLineCrossing;
    const reducedMapPenaltyFactor = settings.mapScale < 90
      ? 1 + (90 - settings.mapScale) / 20
      : 1;
    const mapOverlapPenalty = mapOverlap
      ? (labelPlacementWeights.mapOverlapBase + mapOverlap * labelPlacementWeights.mapOverlapArea) * reducedMapPenaltyFactor
      : -labelPlacementWeights.offMapBonus;
    let score = sidePenalty
      + crossingPenalty
      + lineLength * labelPlacementWeights.leaderLineLength
      + leaderLengthPenalty(candidateLabel, settings)
      + mapOverlapPenalty
      + outsideCanvas * labelPlacementWeights.outsideCanvasArea
      + layoutBoxObstaclePenalty(candidateLabel, settings)
      + markerObstaclePenalty(candidateLabel, points, settings)
      + countMarkerLineCrossings(candidateLabel, points, settings) * labelPlacementWeights.leaderMarkerCrossing
      + sideCrowdingPenalty(candidateLabel, placed, settings)
      + verticalOrderPenalty(candidateLabel, placed)
      + leaderDirectionPenalty(candidateLabel);

    placed.forEach(label => {
      const overlap = rectOverlapArea(rect, labelRect(label));
      if (overlap) {
        score += labelPlacementWeights.labelOverlapBase + overlap * labelPlacementWeights.labelOverlapArea;
      }
    });

    if (rect.centerY < mapRect.y0 || rect.centerY > mapRect.y1) score -= labelPlacementWeights.outsideMapBoundsBonus;
    if (rect.centerX < mapRect.x0 || rect.centerX > mapRect.x1) score -= labelPlacementWeights.outsideMapBoundsBonus;
    if (rect.centerX > mapRect.x0 && rect.centerX < mapRect.x1 && rect.centerY > mapRect.y0 && rect.centerY < mapRect.y1) {
      score += labelPlacementWeights.nearMapCenterPenalty;
    }
    if (currentBoundary === "canada" && labelKeyText(candidateLabel).includes("northwest critical") && candidateLabel.labelSide === "left") {
      const targetY = mapRect.y1 + Math.max(18, settings.labelSize * 1.2);
      if (rect.centerY < targetY) score += (targetY - rect.centerY) * 1500;
    }
    if (currentBoundary === "canada" && labelKeyText(candidateLabel).includes("pathways") && candidateLabel.labelSide === "bottom") {
      const targetX = mapRect.x0 + Math.max(35, settings.labelSize * 3);
      if (rect.x0 < targetX) score += (targetX - rect.x0) * 1200;
    }

    return score;
  }

  function chooseBestCandidate(item, placed, settings, mapBounds, points = placed, perimeterCandidateMap = new Map()) {
    const preferred = preferredSide(item, settings, mapBounds);
    const candidates = createLabelCandidates(item, settings, mapBounds, perimeterCandidateMap.get(getLabelKey(item)));
    return candidates
      .map(candidate => {
        const label = makeLabelPlacement(item, candidate);
        return { label, score: scoreCandidate(label, placed, settings, mapBounds, preferred, points) };
      })
      .sort((a, b) => a.score - b.score)[0].label;
  }

  function candidateLabelsForItem(item, placed, settings, mapBounds, points, perimeterCandidateMap = new Map()) {
    const preferred = preferredSide(item, settings, mapBounds);
    return createLabelCandidates(item, settings, mapBounds, perimeterCandidateMap.get(getLabelKey(item)))
      .map(candidate => {
        const label = makeLabelPlacement(item, candidate);
        return {
          label,
          localScore: scoreCandidate(label, placed, settings, mapBounds, preferred, points)
        };
      })
      .sort((a, b) => a.localScore - b.localScore)
      .map(candidate => candidate.label);
  }

  function placementDifficulty(item, points, settings) {
    const radius = Math.max(46, settings.labelSize * 3.4);
    return points.reduce((count, other) => {
      if (other === item) return count;
      return Math.hypot(item.x - other.x, item.y - other.y) <= radius ? count + 1 : count;
    }, 0);
  }

  function layoutOptimizationNeeded(points, settings) {
    if (points.length >= 12) return true;
    if (Array.isArray(settings.layoutObstacles) && settings.layoutObstacles.length && points.length >= 6) return true;
    return points.some(point => placementDifficulty(point, points, settings) >= 3);
  }

  function makeSeededRandom(seed) {
    let state = Math.floor(seed) % 2147483647;
    if (state <= 0) state += 2147483646;
    return () => {
      state = state * 16807 % 2147483647;
      return (state - 1) / 2147483646;
    };
  }

  function layoutSeed(points, settings) {
    return points.reduce((seed, point) => {
      const x = Math.round(point.x * 10);
      const y = Math.round(point.y * 10);
      return (seed + x * 31 + y * 17 + String(point.name || "").length * 13) % 2147483647;
    }, Math.round(settings.width * 7 + settings.height * 11 + settings.mapScale * 19));
  }

  function scoreLayout(placed, settings, mapBounds, points) {
    return placed.reduce((score, label, index) => {
      const others = placed.filter((_, otherIndex) => otherIndex !== index);
      return score + scoreCandidate(label, others, settings, mapBounds, preferredSide(label, settings, mapBounds), points);
    }, 0);
  }

  function compactPathPoints(points) {
    return points.filter((point, index) => {
      if (index === 0) return true;
      const previous = points[index - 1];
      return Math.hypot(point.x - previous.x, point.y - previous.y) > 0.5;
    });
  }

  function shouldRouteDenseLeader(label, settings) {
    if (!settings.routeDenseLeaders || label.hideLine) return false;
    const end = lineEnd(label);
    const straightLength = Math.hypot(label.x - end.x, label.y - end.y);
    const longLeader = straightLength > Math.max(210, settings.width * 0.32);
    const southeastCluster = label.x > settings.width * 0.52
      && label.y > settings.height * 0.45
      && (label.labelSide === "right" || label.labelSide === "bottom");
    return longLeader || southeastCluster;
  }

  function leaderPathPoints(label, settings) {
    const end = lineEnd(label);
    const start = { x: label.x, y: label.y };
    if (!shouldRouteDenseLeader(label, settings)) return [start, end];

    if (label.labelSide === "left" || label.labelSide === "right") {
      const bendX = end.x;
      const bendY = start.y;
      return compactPathPoints([start, { x: bendX, y: bendY }, end]);
    }

    const bendX = start.x;
    const bendY = end.y;
    return compactPathPoints([start, { x: bendX, y: bendY }, end]);
  }

  function leaderSegmentsForLabel(label, settings) {
    const points = leaderPathPoints(label, settings);
    const segments = [];
    for (let index = 1; index < points.length; index += 1) {
      segments.push({ start: points[index - 1], end: points[index] });
    }
    return segments;
  }

  function leaderPathLength(label, settings) {
    return leaderSegmentsForLabel(label, settings).reduce((total, segment) => {
      return total + Math.hypot(segment.start.x - segment.end.x, segment.start.y - segment.end.y);
    }, 0);
  }

  function maxAllowedLeaderLength(settings) {
    return Math.max(360, settings.width * 0.38);
  }

  function measurePlacementQuality(placed, settings) {
    const lines = placed
      .filter(label => !label.hideLine)
      .map(label => ({ segments: leaderSegmentsForLabel(label, settings), length: leaderPathLength(label, settings), label }));
    const rects = placed.map(labelBackgroundRect);
    const obstacles = Array.isArray(settings.layoutObstacles) ? settings.layoutObstacles : [];
    let leaderCrossings = 0;
    let labelOverlaps = 0;
    let furnitureOverlaps = 0;
    let sideRuleViolations = 0;
    let leaderLengthTotal = 0;
    let maxLeaderLength = 0;
    const sideRuleViolationNames = [];
    const leaderLengthLimit = maxAllowedLeaderLength(settings);

    for (let i = 0; i < lines.length; i += 1) {
      leaderLengthTotal += lines[i].length;
      maxLeaderLength = Math.max(maxLeaderLength, lines[i].length);

      for (let j = i + 1; j < lines.length; j += 1) {
        const crosses = lines[i].segments.some(a => lines[j].segments.some(b => segmentsCross(a.start, a.end, b.start, b.end)));
        if (crosses) leaderCrossings += 1;
      }
    }

    for (let i = 0; i < rects.length; i += 1) {
      const expectedSides = referenceSideOptions(placed[i]);
      if (expectedSides.length && !expectedSides.includes(placed[i].labelSide)) {
        sideRuleViolations += 1;
        sideRuleViolationNames.push(placed[i].name || `label ${i + 1}`);
      }
      for (let j = i + 1; j < rects.length; j += 1) {
        if (rectsOverlap(rects[i], rects[j])) labelOverlaps += 1;
      }
      obstacles.forEach(obstacle => {
        if (rectsOverlap(rects[i], obstacle.rect)) furnitureOverlaps += 1;
      });
    }

    const hardProblems = leaderCrossings + labelOverlaps + furnitureOverlaps;
    return {
      leaderCrossings,
      labelOverlaps,
      furnitureOverlaps,
      hardProblems,
      sideRuleViolations,
      sideRuleViolationNames,
      leaderLengthLimit,
      excessLeaderLength: Math.max(0, maxLeaderLength - leaderLengthLimit),
      maxLeaderLength,
      averageLeaderLength: lines.length ? leaderLengthTotal / lines.length : 0
    };
  }

  function placementQualityAcceptable(quality) {
    return !quality || (quality.hardProblems === 0 && quality.sideRuleViolations === 0 && quality.excessLeaderLength <= 0);
  }

  function isBetterScaleFallback(candidate, fallback) {
    if (!candidate) return false;
    if (!fallback) return true;
    if (candidate.feasibility.placed !== fallback.feasibility.placed) {
      return candidate.feasibility.placed > fallback.feasibility.placed;
    }
    const candidateProblems = candidate.placementQuality ? candidate.placementQuality.hardProblems : Number.MAX_SAFE_INTEGER;
    const fallbackProblems = fallback.placementQuality ? fallback.placementQuality.hardProblems : Number.MAX_SAFE_INTEGER;
    if (candidateProblems !== fallbackProblems) return candidateProblems < fallbackProblems;
    const candidateSideViolations = candidate.placementQuality ? candidate.placementQuality.sideRuleViolations : Number.MAX_SAFE_INTEGER;
    const fallbackSideViolations = fallback.placementQuality ? fallback.placementQuality.sideRuleViolations : Number.MAX_SAFE_INTEGER;
    if (candidateSideViolations !== fallbackSideViolations) return candidateSideViolations < fallbackSideViolations;
    const candidateLeaderExcess = candidate.placementQuality ? candidate.placementQuality.excessLeaderLength : Number.MAX_SAFE_INTEGER;
    const fallbackLeaderExcess = fallback.placementQuality ? fallback.placementQuality.excessLeaderLength : Number.MAX_SAFE_INTEGER;
    if (Math.round(candidateLeaderExcess) !== Math.round(fallbackLeaderExcess)) {
      return candidateLeaderExcess < fallbackLeaderExcess;
    }
    const candidateMaxLeader = candidate.placementQuality ? candidate.placementQuality.maxLeaderLength : Number.MAX_SAFE_INTEGER;
    const fallbackMaxLeader = fallback.placementQuality ? fallback.placementQuality.maxLeaderLength : Number.MAX_SAFE_INTEGER;
    if (Math.round(candidateMaxLeader) !== Math.round(fallbackMaxLeader)) return candidateMaxLeader < fallbackMaxLeader;
    return candidate.settings.mapScale > fallback.settings.mapScale;
  }

  function countSideOrderInversions(placed) {
    return ["left", "right", "top", "bottom"].reduce((total, side) => {
      const labels = placed.filter(label => label.labelSide === side);
      let inversions = 0;

      for (let i = 0; i < labels.length; i += 1) {
        for (let j = i + 1; j < labels.length; j += 1) {
          const anchorOrder = side === "left" || side === "right"
            ? Math.sign(labels[i].y - labels[j].y)
            : Math.sign(labels[i].x - labels[j].x);
          const labelOrder = side === "left" || side === "right"
            ? Math.sign(labels[i].labelY - labels[j].labelY)
            : Math.sign(lineEnd(labels[i]).x - lineEnd(labels[j]).x);
          if (anchorOrder && labelOrder && anchorOrder !== labelOrder) inversions += 1;
        }
      }

      return total + inversions;
    }, 0);
  }

  function createOrderPreservingVerticalSlots(items, side, settings, mapBounds) {
    const topLimit = Math.max(34, settings.labelSize * 2.4);
    const bottomLimit = settings.height - Math.max(34, settings.labelSize * 2.2);
    const sideGap = Math.max(24, settings.labelSize * 1.5);
    const defaultGap = Math.max(18, settings.labelSize * 1.2);
    const ordered = items.slice().sort((a, b) => a.y - b.y || a.x - b.x);
    const slots = ordered.map(item => {
      const box = makeLabelBox(item, side, settings, mapBounds);
      const visualHeight = labelVisualHeight(box);
      const desiredCenter = item.y + getDesignerVerticalOffset(item, side, settings);
      return {
        item,
        box,
        height: visualHeight,
        desiredTop: desiredCenter - visualHeight / 2,
        top: desiredCenter - visualHeight / 2
      };
    });
    const totalHeight = slots.reduce((sum, slot) => sum + slot.height, 0);
    const availableHeight = Math.max(1, bottomLimit - topLimit);
    const gap = slots.length > 1
      ? Math.max(4, Math.min(defaultGap, (availableHeight - totalHeight) / (slots.length - 1)))
      : 0;

    slots.forEach(slot => {
      slot.top = clamp(slot.desiredTop, topLimit, bottomLimit - slot.height);
    });

    for (let i = 1; i < slots.length; i += 1) {
      const previous = slots[i - 1];
      const current = slots[i];
      current.top = Math.max(current.top, previous.top + previous.height + gap);
    }

    for (let i = slots.length - 1; i >= 0; i -= 1) {
      const slot = slots[i];
      slot.top = Math.min(slot.top, bottomLimit - slot.height);
      if (i < slots.length - 1) {
        const next = slots[i + 1];
        slot.top = Math.min(slot.top, next.top - gap - slot.height);
      }
      slot.top = Math.max(slot.top, topLimit);
    }

    const slotsByItem = new Map();
    slots.forEach(slot => {
      const lineOffset = getDesignerLineOffset(slot.item, side, settings);
      const leftMin = 30 + slot.box.textWidth;
      const leftMax = mapBounds.x0 - sideGap;
      const rightMin = mapBounds.x1 + sideGap;
      const rightMax = settings.width - slot.box.textWidth - 30;
      const leftX = leftMax >= leftMin
        ? clamp(slot.item.x - lineOffset, leftMin, leftMax)
        : leftMin;
      const rightX = rightMax >= rightMin
        ? clamp(slot.item.x + lineOffset, rightMin, rightMax)
        : Math.max(30, rightMax);

      slotsByItem.set(slot.item, {
        side,
        x: side === "left" ? leftX : rightX,
        y: slot.top + labelFontSize(slot.box),
        box: slot.box
      });
    });

    return items.map(item => slotsByItem.get(item));
  }

  function createOrderPreservingHorizontalSlots(items, side, settings, mapBounds) {
    const margin = Math.max(22, settings.labelSize * 1.4);
    const sideGap = Math.max(24, settings.labelSize * 1.5);
    const rowGap = Math.max(16, settings.labelSize * 1.15);
    const minCenterGap = Math.max(10, settings.labelSize * 0.8);
    const minX = margin;
    const maxX = settings.width - margin;
    const ordered = items.slice().sort((a, b) => a.x - b.x || a.y - b.y);
    const slots = ordered.map(item => {
      const box = makeLabelBox(item, side, settings, mapBounds);
      const currentCenter = item.labelSide === side && Number.isFinite(item.labelX)
        ? lineEnd(item).x
        : null;
      const desiredCenter = currentCenter || item.x + getDesignerHorizontalOffset(item, side, settings);
      return {
        item,
        box,
        width: box.textWidth,
        height: labelVisualHeight(box),
        desiredCenter,
        centerX: clamp(desiredCenter, minX + box.textWidth / 2, maxX - box.textWidth / 2)
      };
    });

    for (let i = 1; i < slots.length; i += 1) {
      slots[i].centerX = Math.max(slots[i].centerX, slots[i - 1].centerX + minCenterGap);
    }

    for (let i = slots.length - 1; i >= 0; i -= 1) {
      slots[i].centerX = Math.min(slots[i].centerX, maxX - slots[i].width / 2);
      if (i < slots.length - 1) {
        slots[i].centerX = Math.min(slots[i].centerX, slots[i + 1].centerX - minCenterGap);
      }
      slots[i].centerX = Math.max(slots[i].centerX, minX + slots[i].width / 2);
    }

    const rows = [];
    slots.forEach(slot => {
      const left = slot.centerX - slot.width / 2;
      const right = slot.centerX + slot.width / 2;
      let rowIndex = rows.findIndex(row => left >= row.right + Math.max(8, settings.labelSize * 0.65));
      if (rowIndex < 0) {
        rowIndex = rows.length;
        rows.push({ right: -Infinity, height: 0 });
      }
      rows[rowIndex].right = Math.max(rows[rowIndex].right, right);
      rows[rowIndex].height = Math.max(rows[rowIndex].height, slot.height);
      slot.rowIndex = rowIndex;
    });

    const rowOffsets = [];
    rows.reduce((offset, row, index) => {
      rowOffsets[index] = offset;
      return offset + row.height + rowGap;
    }, 0);

    const slotsByItem = new Map();
    slots.forEach(slot => {
      const rowOffset = rowOffsets[slot.rowIndex] || 0;
      const fontSize = labelFontSize(slot.box);
      const topBaseline = mapBounds.y0 - sideGap - rowOffset - slot.height + fontSize;
      const bottomBaseline = mapBounds.y1 + sideGap + rowOffset + fontSize;
      const minY = margin + fontSize;
      const maxY = settings.height - margin - slot.height + fontSize;

      slotsByItem.set(slot.item, {
        side,
        x: clamp(slot.centerX - slot.width / 2, minX, maxX - slot.width),
        y: clamp(side === "top" ? topBaseline : bottomBaseline, minY, maxY),
        box: slot.box
      });
    });

    return items.map(item => slotsByItem.get(item));
  }

  function createOrderedSideBandTrial(placed, side, settings, mapBounds) {
    const sideLabels = placed.filter(label => label.labelSide === side);
    if (sideLabels.length < 2) return placed;

    const replacements = new Map();
    const slots = side === "left" || side === "right"
      ? createOrderPreservingVerticalSlots(sideLabels, side, settings, mapBounds)
      : createOrderPreservingHorizontalSlots(sideLabels, side, settings, mapBounds);
    slots.forEach((slot, index) => {
      if (!slot) return;
      const label = sideLabels[index];
      replacements.set(getLabelKey(label), makeLabelPlacement(label, slot));
    });

    return placed.map(label => replacements.get(getLabelKey(label)) || label);
  }

  function optimizeOrderedSideBands(placed, points, settings, mapBounds) {
    let best = placed.slice();
    let bestScore = scoreLayout(best, settings, mapBounds, points);
    let bestQuality = measurePlacementQuality(best, settings);
    let bestInversions = countSideOrderInversions(best);
    if (!layoutOptimizationNeeded(points, settings) && bestInversions === 0) return best;

    for (let pass = 0; pass < 2; pass += 1) {
      let changed = false;

      ["left", "right", "top", "bottom"].forEach(side => {
        const trial = createOrderedSideBandTrial(best, side, settings, mapBounds);
        if (trial === best) return;

        const trialScore = scoreLayout(trial, settings, mapBounds, points);
        const trialQuality = measurePlacementQuality(trial, settings);
        const trialInversions = countSideOrderInversions(trial);
        const fewerHardProblems = trialQuality.hardProblems < bestQuality.hardProblems;
        const materiallyBetterOrder = trialInversions < bestInversions
          && trialQuality.hardProblems <= bestQuality.hardProblems
          && trialScore <= bestScore + labelPlacementWeights.verticalOrderInversion * 4;

        if (fewerHardProblems || trialScore + 0.1 < bestScore || materiallyBetterOrder) {
          best = trial;
          bestScore = trialScore;
          bestQuality = trialQuality;
          bestInversions = trialInversions;
          changed = true;
        }
      });

      if (!changed) break;
    }

    return best;
  }

  function optimizeDenseLayoutWithLocalSearch(placed, points, settings, mapBounds, perimeterCandidateMap = new Map()) {
    if (!layoutOptimizationNeeded(points, settings)) return placed;

    let best = placed.slice();
    let bestScore = scoreLayout(best, settings, mapBounds, points);
    const maxPasses = points.length >= 18 ? 5 : 3;
    const maxCandidatesPerLabel = points.length >= 18 ? 34 : 44;

    for (let pass = 0; pass < maxPasses; pass += 1) {
      let changed = false;
      const ordered = best.slice().sort((a, b) => comparePlacementOrder(a, b, points, settings));

      for (const current of ordered) {
        const index = best.findIndex(label => getLabelKey(label) === getLabelKey(current));
        if (index < 0) continue;

        const others = best.filter((_, otherIndex) => otherIndex !== index);
        const candidates = candidateLabelsForItem(best[index], others, settings, mapBounds, points, perimeterCandidateMap)
          .slice(0, maxCandidatesPerLabel);

        for (const candidate of candidates) {
          const trial = best.slice();
          trial[index] = candidate;
          const trialScore = scoreLayout(trial, settings, mapBounds, points);
          if (trialScore + 0.1 < bestScore) {
            best = trial;
            bestScore = trialScore;
            changed = true;
            break;
          }
        }
      }

      if (!changed) break;
    }

    return best;
  }

  function sameLabelPlacement(a, b) {
    return a
      && b
      && getLabelKey(a) === getLabelKey(b)
      && a.labelSide === b.labelSide
      && Math.abs(a.labelX - b.labelX) < 0.1
      && Math.abs(a.labelY - b.labelY) < 0.1;
  }

  function optimizeDenseLayoutWithAnnealing(placed, points, settings, mapBounds, perimeterCandidateMap = new Map()) {
    if (!layoutOptimizationNeeded(points, settings) || placed.length < 4) return placed;

    const candidateLists = placed.map((label, index) => {
      const others = placed.filter((_, otherIndex) => otherIndex !== index);
      const candidates = candidateLabelsForItem(label, others, settings, mapBounds, points, perimeterCandidateMap)
        .slice(0, points.length >= 18 ? 56 : 42);
      if (!candidates.some(candidate => sameLabelPlacement(candidate, label))) candidates.unshift(label);
      return candidates;
    });

    let current = placed.slice();
    let currentScore = scoreLayout(current, settings, mapBounds, points);
    let best = current.slice();
    let bestScore = currentScore;
    let bestQuality = measurePlacementQuality(best, settings);
    const random = makeSeededRandom(layoutSeed(points, settings));
    const iterations = points.length >= 18 ? 1800 : 1000;
    const startTemperature = Math.max(settings.width * 32, bestScore * 0.015);
    const endTemperature = Math.max(settings.labelSize * 18, 120);

    for (let iteration = 0; iteration < iterations; iteration += 1) {
      const labelIndex = Math.floor(random() * current.length);
      const candidates = candidateLists[labelIndex];
      if (!candidates || candidates.length < 2) continue;

      const candidate = candidates[Math.floor(random() * candidates.length)];
      if (sameLabelPlacement(candidate, current[labelIndex])) continue;

      const trial = current.slice();
      trial[labelIndex] = candidate;
      const trialScore = scoreLayout(trial, settings, mapBounds, points);
      const progress = iterations <= 1 ? 1 : iteration / (iterations - 1);
      const temperature = startTemperature * Math.pow(endTemperature / startTemperature, progress);
      const acceptWorse = Math.exp((currentScore - trialScore) / Math.max(1, temperature)) > random();

      if (trialScore + 0.1 < currentScore || acceptWorse) {
        current = trial;
        currentScore = trialScore;
      }

      if (trialScore + 0.1 < bestScore) {
        const trialQuality = measurePlacementQuality(trial, settings);
        if (trialQuality.hardProblems <= bestQuality.hardProblems) {
          best = trial;
          bestScore = trialScore;
          bestQuality = trialQuality;
        }
      }
    }

    return best;
  }

  function layoutLabelsWithGreedyCandidates(points, settings, mapBounds) {
    const perimeterCandidateMap = createPerimeterCandidateMap(points, settings, mapBounds);
    const ordered = points.slice().sort((a, b) => comparePlacementOrder(a, b, points, settings));
    let placed = [];

    ordered.forEach(item => {
      placed.push(chooseBestCandidate(item, placed, settings, mapBounds, points, perimeterCandidateMap));
    });

    for (let pass = 0; pass < 4; pass += 1) {
      let changed = false;
      for (let i = 0; i < placed.length; i += 1) {
        const current = placed[i];
        const others = placed.filter((_, index) => index !== i);
        const improved = chooseBestCandidate(current, others, settings, mapBounds, points, perimeterCandidateMap);
        const currentScore = scoreCandidate(current, others, settings, mapBounds, preferredSide(current, settings, mapBounds), points);
        const improvedScore = scoreCandidate(improved, others, settings, mapBounds, preferredSide(current, settings, mapBounds), points);
        if (improvedScore + 0.1 < currentScore) {
          placed[i] = improved;
          changed = true;
        }
      }
      if (!changed) break;
    }

    placed = optimizeDenseLayoutWithLocalSearch(placed, points, settings, mapBounds, perimeterCandidateMap);
    placed = optimizeDenseLayoutWithAnnealing(placed, points, settings, mapBounds, perimeterCandidateMap);
    placed = optimizeOrderedSideBands(placed, points, settings, mapBounds);

    const byKey = new Map(placed.map(label => [getLabelKey(label), label]));
    return points.map(point => byKey.get(getLabelKey(point)) || chooseBestCandidate(point, [], settings, mapBounds, points, perimeterCandidateMap));
  }

  function layoutLabels(points, settings, mapBounds) {
    return applyManualLabelPositions(layoutLabelsWithGreedyCandidates(points, settings, mapBounds));
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

  function rememberLabelPositions(placed) {
    const positions = {};
    placed.forEach(label => {
      const key = label.labelKey || getLabelKey(label);
      if (!key || !Number.isFinite(label.labelX) || !Number.isFinite(label.labelY)) return;
      positions[key] = {
        x: Math.round(label.labelX * 10) / 10,
        y: Math.round(label.labelY * 10) / 10
      };
    });
    manualLabelPositions = positions;
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

  function labelBackgroundRect(d) {
    const padX = 8;
    const padY = 5;
    const box = labelVisualBox(d);
    return {
      x0: box.x0 - padX,
      y0: box.y0 - padY,
      x1: box.x1 + padX,
      y1: box.y1 + padY,
      centerX: box.centerX,
      centerY: box.centerY
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

  function rectOverlapArea(a, b) {
    const width = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
    const height = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
    return width > 0 && height > 0 ? width * height : 0;
  }

  function analyzeLayout(placed, settings, projectedProblems, hiddenRegionProblems, mapBounds) {
    let crossings = 0;
    let overlaps = 0;
    const lines = placed
      .filter(d => !d.hideLine)
      .map(d => ({ segments: leaderSegmentsForLabel(d, settings), length: leaderPathLength(d, settings), d }));
    const rects = placed.map(labelRect);

    for (let i = 0; i < lines.length; i++) {
      for (let j = i + 1; j < lines.length; j++) {
        const crosses = lines[i].segments.some(a => lines[j].segments.some(b => segmentsCross(a.start, a.end, b.start, b.end)));
        if (crosses) crossings++;
      }
    }

    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) {
        if (rectsOverlap(rects[i], rects[j])) overlaps++;
      }
    }

    const longLines = lines.filter(line => line.length > maxAllowedLeaderLength(settings)).length;

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
    return `Print SVG: ${settings.width} x ${settings.height} pt. Web PNG: ${pngWidth} x ${pngHeight} px, about ${megapixels} megapixels.`;
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
    scheduleRender({ autoPlace: true });
  }

  function confirmClearProjectRows() {
    const rowCount = els.tableBody ? els.tableBody.querySelectorAll("tr").length : 0;
    if (!rowCount) {
      setStatusMessage("The project table is already empty.", "warning");
      return;
    }

    const label = rowCount === 1 ? "project row" : "project rows";
    const confirmed = window.confirm(`Clear ${rowCount} ${label} from Project points?\n\nThis cannot be undone unless you reload or reopen a saved project.`);
    if (!confirmed) {
      setStatusMessage("Clear table cancelled.", "warning");
      return;
    }

    setRows([]);
    setStatusMessage("Project table cleared.", "ok");
  }

  function getSavedDataTable() {
    try {
      const savedTable = window.localStorage.getItem(activeTableStorageKey);
      return dataTableNames.includes(savedTable) ? savedTable : "projects";
    } catch (error) {
      return "projects";
    }
  }

  function saveActiveDataTable(tableName) {
    if (!dataTableNames.includes(tableName)) return;
    try {
      window.localStorage.setItem(activeTableStorageKey, tableName);
    } catch (error) {
      // Storage can be unavailable in some locked-down browser contexts.
    }
  }

  function switchDataTable(tableName) {
    const tabs = [
      { name: "projects", title: "Project points", tab: els.projectTableTab, pane: els.projectTablePane, actions: "projects" },
      { name: "regions", title: "Map regions", tab: els.regionTableTab, pane: els.regionTablePane, actions: "regions" },
      { name: "preview", title: "Preview", tab: els.previewTableTab, pane: els.previewTablePane, actions: "preview" }
    ];
    const activeName = tabs.some(tab => tab.name === tableName) ? tableName : "projects";
    const activeTab = tabs.find(tab => tab.name === activeName);

    tabs.forEach(tab => {
      const isActive = tab.name === activeName;
      tab.tab.classList.toggle("is-active", isActive);
      tab.tab.setAttribute("aria-selected", String(isActive));
      tab.pane.classList.toggle("is-active", isActive);
    });

    els.tableActions.forEach(actions => {
      actions.classList.toggle("is-active", actions.dataset.tableActions === activeTab.actions);
    });
    els.tablePanelTitle.textContent = activeTab.title;
    if (activeName === "regions") renderRegionValueTable();
    saveActiveDataTable(activeName);
  }

  function clearPreviewInteractionOverlays() {
    d3.select(els.svg.node()).selectAll(".map-scale-controls, .distance-markers").remove();
  }

  function showMapScaleControls() {
    if (!lastLayout || !lastLayout.settings || !lastLayout.mapBounds) return;
    mapScaleControlsVisible = true;
    clearPreviewInteractionOverlays();
    drawMapScaleControls(els.svg, lastLayout.settings, lastLayout.mapBounds);
  }

  function hideMapScaleControls() {
    mapScaleControlsVisible = false;
    clearPreviewInteractionOverlays();
  }

  function render(options = {}) {
    let settings = getSettings();
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

    const shouldAutoPlace = Boolean(options.autoPlace);
    const layoutContext = shouldAutoPlace
      ? chooseFeasibleMapLayoutContext(visibleGeo, rows, settings)
      : createMapLayoutContext(visibleGeo, rows, settings);
    settings = layoutContext.settings;
    if (shouldAutoPlace && layoutContext.requestedMapScale && layoutContext.requestedMapScale !== settings.mapScale) {
      els.mapScaleInput.value = settings.mapScale;
    }
    settings.layoutObstacles = getLayoutBoxObstacles(settings, layoutContext.calloutRows);
    const {
      projection,
      path,
      mapBounds,
      mappedRows,
      calloutRows,
      projectedProblems,
      hiddenRegionProblems
    } = layoutContext;

    svg.on("click", event => {
      if (event.target === svg.node() && mapScaleControlsVisible) {
        hideMapScaleControls();
      }
    });

    svg.append("g")
      .attr("class", "map-layer")
      .selectAll("path")
      .data(visibleGeo.features)
      .join("path")
      .attr("class", "province")
      .attr("d", path)
      .attr("fill", (d, i) => getRegionFill(d, i))
      .on("click", event => {
        event.stopPropagation();
        showMapScaleControls();
      });

    const labelRows = mappedRows.filter(row => row.name);
    const placed = layoutLabels(labelRows, settings, mapBounds);
    rememberLabelPositions(placed);
    const placedByRowId = new Map(placed.map(row => [row.rowId, row]));
    const markerRows = mappedRows.map(row => placedByRowId.get(row.rowId) || row);
    const leaderRows = placed.filter(row => !row.hideLine);
    const report = analyzeLayout(placed, settings, projectedProblems, hiddenRegionProblems, mapBounds);
    lastLayout = { placed, settings, report, mapBounds, feasibility: layoutContext.feasibility };

    const leaderLayer = svg.append("g").attr("class", "leader-layer");
    if (settings.showLineCasing) {
    leaderLayer.selectAll("path.leader-casing")
        .data(leaderRows)
        .join("path")
        .attr("class", "leader-casing")
        .attr("data-layout-id", d => d.layoutId)
        .attr("data-label-side", d => d.labelSide)
        .attr("data-label-name", d => d.name)
        .attr("stroke-width", d => getCategoryLineWidth(getCategory(d.type), settings) + 3.5)
        .attr("d", d => linePath(d, settings));
    }
    leaderLayer.selectAll("path.leader-line")
      .data(leaderRows)
      .join("path")
      .attr("class", "leader-line")
      .attr("data-layout-id", d => d.layoutId)
      .attr("data-label-side", d => d.labelSide)
      .attr("data-label-name", d => d.name)
      .attr("stroke-width", d => getCategoryLineWidth(getCategory(d.type), settings))
      .attr("d", d => linePath(d, settings));

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
      .attr("data-label-side", d => d.labelSide)
      .attr("data-label-name", d => d.name)
      .each(function (d) {
        positionLabelBackground(d3.select(this), d);
      });

    const labelLayer = svg.append("g").attr("class", "label-layer");
    const labels = labelLayer.selectAll("text")
      .data(placed)
      .join("text")
      .attr("class", "map-label")
      .attr("font-size", settings.labelSizeRender)
      .attr("font-family", settings.fontFamily)
      .attr("data-layout-id", d => d.layoutId)
      .attr("data-label-side", d => d.labelSide)
      .attr("data-label-name", d => d.name)
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
        if (i === d.lines.length - 1 && d.footnote) appendSuperscript(text, d.footnote, settings.labelSizeRender);
      });
    });
    attachLabelDragging(labels);

    if (settings.showCallouts && calloutRows.length) drawCallouts(svg, calloutRows, settings, mapBounds);
    if (settings.showLegend) drawLegend(svg, settings, mapBounds);
    if (mapScaleControlsVisible) drawMapScaleControls(svg, settings, mapBounds);
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

  function drawMapScaleControls(svg, settings, mapBounds) {
    const pad = 8;
    const x0 = mapBounds.x0 - pad;
    const y0 = mapBounds.y0 - pad;
    const x1 = mapBounds.x1 + pad;
    const y1 = mapBounds.y1 + pad;
    const width = x1 - x0;
    const height = y1 - y0;
    const center = {
      x: (x0 + x1) / 2,
      y: (y0 + y1) / 2
    };
    const handleSize = 9;
    const handles = [
      { id: "nw", x: x0, y: y0 },
      { id: "n", x: center.x, y: y0 },
      { id: "ne", x: x1, y: y0 },
      { id: "e", x: x1, y: center.y },
      { id: "se", x: x1, y: y1 },
      { id: "s", x: center.x, y: y1 },
      { id: "sw", x: x0, y: y1 },
      { id: "w", x: x0, y: center.y }
    ];
    const guideLength = 18;
    const mapRect = { x0, y0, x1, y1 };
    drawDistanceMarkers(svg, settings, mapRect, { includeNearbyLabels: true });

    function boundsForScale(scale) {
      const ratio = normalizeMapScale(scale) / settings.mapScale;
      const scaledWidth = width * ratio;
      const scaledHeight = height * ratio;
      return {
        x0: center.x - scaledWidth / 2,
        y0: center.y - scaledHeight / 2,
        x1: center.x + scaledWidth / 2,
        y1: center.y + scaledHeight / 2,
        width: scaledWidth,
        height: scaledHeight
      };
    }

    function handlesForBounds(bounds) {
      return [
        { id: "nw", x: bounds.x0, y: bounds.y0 },
        { id: "n", x: center.x, y: bounds.y0 },
        { id: "ne", x: bounds.x1, y: bounds.y0 },
        { id: "e", x: bounds.x1, y: center.y },
        { id: "se", x: bounds.x1, y: bounds.y1 },
        { id: "s", x: center.x, y: bounds.y1 },
        { id: "sw", x: bounds.x0, y: bounds.y1 },
        { id: "w", x: bounds.x0, y: center.y }
      ];
    }

    function updateMapScalePreview(overlay, bounds, scale) {
      overlay.select(".map-scale-selection")
        .attr("x", bounds.x0)
        .attr("y", bounds.y0)
        .attr("width", bounds.width)
        .attr("height", bounds.height);

      overlay.select(".map-scale-center-guide-vertical")
        .attr("x1", center.x)
        .attr("y1", Math.max(0, bounds.y0 - guideLength))
        .attr("x2", center.x)
        .attr("y2", Math.min(settings.height, bounds.y1 + guideLength));

      overlay.select(".map-scale-center-guide-horizontal")
        .attr("x1", Math.max(0, bounds.x0 - guideLength))
        .attr("y1", center.y)
        .attr("x2", Math.min(settings.width, bounds.x1 + guideLength))
        .attr("y2", center.y);

      overlay.selectAll("rect.map-scale-handle")
        .data(handlesForBounds(bounds), d => d.id)
        .attr("x", d => d.x - handleSize / 2)
        .attr("y", d => d.y - handleSize / 2);

      const previewText = `${scale}%`;
      const previewWidth = Math.max(48, previewText.length * 9 + 18);
      const previewX = clamp(bounds.x1 + 10, 8, settings.width - previewWidth - 8);
      const previewY = clamp(bounds.y0 - 22, 8, settings.height - 24);
      overlay.select(".map-scale-badge")
        .attr("transform", `translate(${previewX},${previewY})`);
      overlay.select(".map-scale-badge rect")
        .attr("width", previewWidth);
      overlay.select(".map-scale-badge text")
        .text(previewText);
    }

    const overlay = svg.append("g")
      .attr("class", "map-scale-controls")
      .on("click", event => event.stopPropagation());

    overlay.append("rect")
      .attr("class", "map-scale-selection")
      .attr("x", x0)
      .attr("y", y0)
      .attr("width", width)
      .attr("height", height);

    overlay.append("line")
      .attr("class", "map-scale-center-guide map-scale-center-guide-vertical")
      .attr("x1", center.x)
      .attr("y1", Math.max(0, y0 - guideLength))
      .attr("x2", center.x)
      .attr("y2", Math.min(settings.height, y1 + guideLength));

    overlay.append("line")
      .attr("class", "map-scale-center-guide map-scale-center-guide-horizontal")
      .attr("x1", Math.max(0, x0 - guideLength))
      .attr("y1", center.y)
      .attr("x2", Math.min(settings.width, x1 + guideLength))
      .attr("y2", center.y);

    overlay.append("circle")
      .attr("class", "map-scale-center-point")
      .attr("cx", center.x)
      .attr("cy", center.y)
      .attr("r", 3);

    const badgeText = `${settings.mapScale}%`;
    const badgeX = clamp(x1 + 10, 8, settings.width - 58);
    const badgeY = clamp(y0 - 22, 8, settings.height - 24);
    const badge = overlay.append("g")
      .attr("class", "map-scale-badge")
      .attr("transform", `translate(${badgeX},${badgeY})`);
    badge.append("rect")
      .attr("width", Math.max(48, badgeText.length * 9 + 18))
      .attr("height", 22)
      .attr("rx", 4);
    badge.append("text")
      .attr("x", 9)
      .attr("y", 15)
      .text(badgeText);

    overlay.selectAll("rect.map-scale-handle")
      .data(handles)
      .join("rect")
      .attr("class", d => `map-scale-handle map-scale-handle-${d.id}`)
      .attr("x", d => d.x - handleSize / 2)
      .attr("y", d => d.y - handleSize / 2)
      .attr("width", handleSize)
      .attr("height", handleSize)
      .call(d3.drag()
        .on("start", function (event, d) {
          const pointer = d3.pointer(event, els.svg.node());
          d.startScale = settings.mapScale;
          d.scaleChanged = false;
          d.center = center;
          d.startDistance = Math.max(1, Math.hypot(pointer[0] - center.x, pointer[1] - center.y));
          clearDistanceMarkers();
          overlay.classed("is-previewing", true);
          d3.select(this).classed("is-dragging", true);
        })
        .on("drag", function (event, d) {
          const pointer = d3.pointer(event, els.svg.node());
          const currentDistance = Math.max(1, Math.hypot(pointer[0] - d.center.x, pointer[1] - d.center.y));
          const nextScale = normalizeMapScale(d.startScale * currentDistance / d.startDistance);
          if (String(nextScale) === String(els.mapScaleInput.value)) return;
          d.scaleChanged = true;
          els.mapScaleInput.value = nextScale;
          updateMapScalePreview(overlay, boundsForScale(nextScale), nextScale);
        })
        .on("end", function (event, d) {
          d3.select(this).classed("is-dragging", false);
          overlay.classed("is-previewing", false);
          if (d.scaleChanged) {
            scheduleRender();
            setStatusMessage("Map size changed. Press Run auto-place to recalculate placement for the new map size.", "ok");
          }
        }));
  }

  function attachLabelDragging(labels) {
    labels.call(d3.drag()
      .on("start", function (event, d) {
        d.dragStartX = d.labelX;
        d.dragStartY = d.labelY;
        d.dragAxis = null;
        d3.select(this).classed("is-dragging", true);
      })
      .on("drag", function (event, d) {
        const settings = getSettings();
        let next = constrainShiftDrag(
          { x: d.dragStartX, y: d.dragStartY },
          { x: d.labelX + event.dx, y: d.labelY + event.dy },
          d,
          event
        );
        d.labelX = next.x;
        d.labelY = next.y;
        manualLabelPositions[d.labelKey] = { x: d.labelX, y: d.labelY };

        const label = d3.select(this)
          .attr("x", d.labelX)
          .attr("y", d.labelY);
        label.selectAll("tspan.label-line").attr("x", d.labelX);

        d3.select(`rect.map-label-background[data-layout-id="${d.layoutId}"]`)
          .call(node => positionLabelBackground(node, d));

        d3.selectAll(`path[data-layout-id="${d.layoutId}"]`)
          .attr("d", linePath(d, settings));

        drawDistanceMarkers(els.svg, settings, labelVisualBox(d, 8), {
          mapBounds: lastLayout ? lastLayout.mapBounds : null,
          includeNearbyLabels: true,
          activeLabelKey: d.labelKey
        });
      })
      .on("end", function (event, d) {
        delete d.dragStartX;
        delete d.dragStartY;
        delete d.dragAxis;
        clearDistanceMarkers();
        d3.select(this).classed("is-dragging", false);
      }));
  }

  function attachMarkerDragging(markers, projection, settings) {
    markers.call(d3.drag()
      .on("start", function (event, d) {
        const pointer = d3.pointer(event, els.svg.node());
        d.dragOffsetX = d.x - pointer[0];
        d.dragOffsetY = d.y - pointer[1];
        d.dragStartX = d.x;
        d.dragStartY = d.y;
        d.dragAxis = null;
        d3.select(this).classed("is-dragging", true);
      })
      .on("drag", function (event, d) {
        const pointer = d3.pointer(event, els.svg.node());
        const next = constrainShiftDrag(
          { x: d.dragStartX, y: d.dragStartY },
          { x: pointer[0] + d.dragOffsetX, y: pointer[1] + d.dragOffsetY },
          d,
          event
        );
        d.x = next.x;
        d.y = next.y;
        moveMarkerNode(d3.select(this), d, { markerSize: getCategoryMarkerSize(getCategory(d.type), settings) });
        d3.selectAll(`path[data-layout-id="${d.layoutId}"]`)
          .attr("d", linePath(d, settings));
      })
      .on("end", function (event, d) {
        delete d.dragOffsetX;
        delete d.dragOffsetY;
        delete d.dragStartX;
        delete d.dragStartY;
        delete d.dragAxis;
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
    const box = labelBackgroundRect(d);

    node.attr("x", box.x0)
      .attr("y", box.y0)
      .attr("width", box.x1 - box.x0)
      .attr("height", box.y1 - box.y0);
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
    if (active.classList.contains("priority-input")) fieldIndex = tableFields.indexOf("priority");
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
    if (field === "priority") tr.querySelector(".priority-input").value = toPriority(value);
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
    const settings = getSettings();
    Array.from(els.categoryList.querySelectorAll(".category-editor")).forEach(editor => {
      const category = categorySettings.find(item => item.id === editor.dataset.categoryId);
      if (!category) return;
      category.label = editor.querySelector(".category-label-input").value.trim() || category.defaultLabel;
      category.shape = normalizeMarkerShape(editor.querySelector(".category-shape-input").value);
      category.colour = editor.querySelector(".category-colour-input").value;
      category.markerSize = optionalNumber(editor.querySelector(".category-marker-size-input").value) || settings.markerSize;
      category.lineWidth = optionalNumber(editor.querySelector(".category-line-width-input").value) || settings.lineWidth;
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
    const settings = getSettings();

    categories.forEach(savedCategory => {
      const category = existingCategories.find(item => item.id === savedCategory.id);
      const label = String(savedCategory.label || savedCategory.defaultLabel || "Category").trim() || "Category";
      const shape = normalizeMarkerShape(savedCategory.shape);
      const colour = savedCategory.colour || "#217346";
      const markerSize = optionalNumber(savedCategory.markerSize) || settings.markerSize;
      const lineWidth = optionalNumber(savedCategory.lineWidth) || settings.lineWidth;
      const markerSizeCustom = savedCategory.markerSizeCustom !== undefined
        ? Boolean(savedCategory.markerSizeCustom)
        : markerSize !== settings.markerSize;
      const lineWidthCustom = savedCategory.lineWidthCustom !== undefined
        ? Boolean(savedCategory.lineWidthCustom)
        : lineWidth !== settings.lineWidth;

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
    scheduleRender();
  }

  function handleLayoutSettingsChange(event) {
    const target = event ? event.target : null;
    if (target === els.showLegendInput && setMapFurnitureVisibility("legend", target.checked, target, "Legend")) return;
    if (target === els.showCalloutsInput && setMapFurnitureVisibility("callouts", target.checked, target, "No-coordinate callouts")) return;
    if (target === els.showLineCasingInput) {
      const hasLayer = setPreviewLayerVisibility(".leader-casing", target.checked);
      if (!target.checked || hasLayer) {
        setStatusMessage(`Leader casing ${target.checked ? "shown" : "hidden"}.`, "ok");
        return;
      }
    }
    if (target === els.showDistanceMarkersInput) {
      clearDistanceMarkers();
      setStatusMessage(`Distance markers ${target.checked ? "enabled" : "disabled"} for dragging.`, "ok");
      return;
    }

    if (event && event.target === els.bookSizeInput) {
      renderImageSizeOptions();
    }

    if (event && (event.target === els.bookSizeInput || event.target === els.imageSizeInput)) {
      saveLayoutPreferences();
    }

    if (event && (event.target === els.markerSizeInput || event.target === els.lineWidthInput)) {
      syncDefaultCategorySizes();
    }
    if (!target || target === els.markerSizeInput || target === els.lineWidthInput) {
      renderCategoryEditors();
    }
    scheduleRender();
    if (event && event.target === els.mapScaleInput) {
      setStatusMessage("Map size changed. Press Run auto-place to recalculate placement for the new map size.", "ok");
    }
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
    const settings = getSettings();
    categorySettings.push({
      id: makeCategoryId(label),
      label,
      defaultLabel: label,
      shape: "circle",
      colour: "#217346",
      stroke: "#ffffff",
      markerSize: settings.markerSize,
      lineWidth: settings.lineWidth,
      markerSizeCustom: false,
      lineWidthCustom: false,
      collapsed: false,
      removable: true
    });
    renderCategoryEditors();
    updateTypeOptions();
    scheduleRender();
  }

  function toggleCategory(categoryId) {
    const category = categorySettings.find(item => item.id === categoryId);
    if (!category) return;
    category.collapsed = !category.collapsed;
    renderCategoryEditors();
  }

  function removeCategory(categoryId) {
    const category = categorySettings.find(item => item.id === categoryId);
    if (!category) return;
    if (categorySettings.length <= 1) {
      setStatusMessage("At least one legend marker is required.", "warning");
      return;
    }

    const replacementCategory = categorySettings.find(item => item.id !== categoryId) || getDefaultCategory();
    Array.from(els.tableBody.querySelectorAll(".type-input")).forEach(select => {
      if (select.value === categoryId) select.value = replacementCategory.id;
    });
    categorySettings.splice(categorySettings.indexOf(category), 1);
    renderCategoryEditors();
    updateTypeOptions();
    scheduleRender();
  }

  function clearCategoryDropIndicators() {
    if (!els.categoryList) return;
    els.categoryList.querySelectorAll(".category-editor").forEach(editor => {
      editor.classList.remove("is-dragging", "is-drop-before", "is-drop-after");
    });
    activeCategoryDropEditor = null;
    activeCategoryDropPlacement = null;
  }

  function clearCategoryDropTargets() {
    if (activeCategoryDropEditor) {
      activeCategoryDropEditor.classList.remove("is-drop-before", "is-drop-after");
    }
    activeCategoryDropEditor = null;
    activeCategoryDropPlacement = null;
  }

  function setCategoryDropTarget(editor, placement) {
    if (activeCategoryDropEditor === editor && activeCategoryDropPlacement === placement) return;
    clearCategoryDropTargets();
    activeCategoryDropEditor = editor;
    activeCategoryDropPlacement = placement;
    editor.classList.toggle("is-drop-before", placement === "before");
    editor.classList.toggle("is-drop-after", placement === "after");
  }

  function reorderCategory(categoryId, targetCategoryId, placement) {
    if (!categoryId || !targetCategoryId || categoryId === targetCategoryId) return false;
    const fromIndex = categorySettings.findIndex(category => category.id === categoryId);
    const targetIndex = categorySettings.findIndex(category => category.id === targetCategoryId);
    if (fromIndex < 0 || targetIndex < 0) return false;

    const [category] = categorySettings.splice(fromIndex, 1);
    const adjustedTargetIndex = categorySettings.findIndex(item => item.id === targetCategoryId);
    const insertIndex = placement === "after" ? adjustedTargetIndex + 1 : adjustedTargetIndex;
    categorySettings.splice(insertIndex, 0, category);
    renderCategoryEditors();
    updateTypeOptions();
    scheduleRender();
    return true;
  }

  function getCategoryDropPlacement(event, editor) {
    const rect = editor.getBoundingClientRect();
    return event.clientY > rect.top + rect.height / 2 ? "after" : "before";
  }

  function handleCategoryDragStart(event) {
    const handle = event.target.closest(".category-drag-handle");
    if (!handle) return;
    draggedCategoryId = handle.dataset.categoryId;
    const editor = handle.closest(".category-editor");
    if (editor) editor.classList.add("is-dragging");
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", draggedCategoryId);
    }
  }

  function handleCategoryDragOver(event) {
    if (!draggedCategoryId) return;
    const editor = event.target.closest(".category-editor");
    if (!editor || !els.categoryList.contains(editor) || editor.dataset.categoryId === draggedCategoryId) {
      clearCategoryDropTargets();
      return;
    }
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
    const placement = getCategoryDropPlacement(event, editor);
    setCategoryDropTarget(editor, placement);
  }

  function handleCategoryDrop(event) {
    if (!draggedCategoryId) return;
    const editor = event.target.closest(".category-editor");
    if (!editor || !els.categoryList.contains(editor)) return;
    event.preventDefault();
    const placement = getCategoryDropPlacement(event, editor);
    const moved = reorderCategory(draggedCategoryId, editor.dataset.categoryId, placement);
    clearCategoryDropIndicators();
    if (moved) setStatusMessage("Legend marker order updated.", "ok");
    draggedCategoryId = null;
  }

  function handleCategoryDragEnd() {
    draggedCategoryId = null;
    clearCategoryDropIndicators();
  }

  function linePath(d, settings = getSettings()) {
    const points = leaderPathPoints(d, settings);
    return points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`).join(" ");
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

  function clampBoxDimensions(dimensions, constraints, settings) {
    const minWidth = constraints && Number.isFinite(constraints.minWidth) ? constraints.minWidth : 80;
    const minHeight = constraints && Number.isFinite(constraints.minHeight) ? constraints.minHeight : 40;
    const maxWidth = Math.max(minWidth, Math.min(
      constraints && Number.isFinite(constraints.maxWidth) ? constraints.maxWidth : settings.width,
      settings.width
    ));
    const maxHeight = Math.max(minHeight, Math.min(
      constraints && Number.isFinite(constraints.maxHeight) ? constraints.maxHeight : settings.height,
      settings.height
    ));
    return {
      width: Math.max(minWidth, Math.min(maxWidth, dimensions.width)),
      height: Math.max(minHeight, Math.min(maxHeight, dimensions.height))
    };
  }

  function getBoxDimensions(key, fallback, constraints, settings) {
    const manual = manualBoxPositions[key];
    return clampBoxDimensions({
      width: manual && Number.isFinite(manual.width) ? manual.width : fallback.width,
      height: manual && Number.isFinite(manual.height) ? manual.height : fallback.height
    }, constraints, settings);
  }

  function getBoxPosition(key, fallback, dimensions, settings) {
    const manual = manualBoxPositions[key];
    const position = manual && Number.isFinite(manual.x) && Number.isFinite(manual.y) ? manual : fallback;
    return clampBoxPosition(position, dimensions, settings);
  }

  function saveManualBoxState(key, position, dimensions) {
    manualBoxPositions[key] = {
      ...(manualBoxPositions[key] || {}),
      x: Math.round(position.x * 10) / 10,
      y: Math.round(position.y * 10) / 10,
      width: Math.round(dimensions.width * 10) / 10,
      height: Math.round(dimensions.height * 10) / 10
    };
  }

  function getLegendBoxLayout(settings) {
    const compact = settings.compactFurniture !== false;
    const headingSize = Math.max(settings.labelSize, Math.round(settings.labelSize * 1.02));
    const headingSizeRender = Math.max(settings.labelSizeRender, Math.round(settings.labelSizeRender * 1.02));
    const rowHeight = Math.max(compact ? 26 : 31, Math.round(settings.labelSize * (compact ? 1.85 : 2.15)));
    const headingHeight = Math.max(compact ? 24 : 30, Math.round(headingSize * (compact ? 1.45 : 1.7)));
    const verticalPadding = Math.max(compact ? 10 : 14, Math.round(settings.labelSize * (compact ? 0.8 : 1.05)));
    const longestLabelLength = Math.max(6, ...categorySettings.map(category => category.label.length));
    const widthPad = compact ? 75 : 105;
    const fallbackDimensions = {
      width: Math.max(compact ? 235 : 275, Math.min(390, Math.round(longestLabelLength * settings.labelSize * 0.58 + widthPad))),
      height: verticalPadding * 2 + headingHeight + categorySettings.length * rowHeight
    };
    const constraints = {
      minWidth: Math.max(compact ? 210 : 250, Math.round(longestLabelLength * settings.labelSizeRender * 0.58 + (compact ? 82 : 110))),
      minHeight: fallbackDimensions.height,
      maxWidth: settings.width - 20,
      maxHeight: settings.height - 20
    };
    const dimensions = getBoxDimensions("legend", fallbackDimensions, constraints, settings);
    const position = getBoxPosition("legend", { x: 40, y: settings.height - 150 }, dimensions, settings);
    return {
      dimensions,
      position,
      constraints,
      headingSizeRender,
      rowHeight,
      headingHeight,
      verticalPadding
    };
  }

  function getCalloutContentLayout(calloutRows, settings, width) {
    const compact = settings.compactFurniture !== false;
    const subtitleText = "Canada-wide, not shown on map";
    const nameSize = settings.labelSizeRender;
    const subtitleSizePt = Math.max(10, Math.round(settings.labelSize * 0.85));
    const subtitleSize = Math.max(9, Math.round(nameSize * 0.85));
    const lineH = Math.max(compact ? 18 : 21, Math.round(nameSize * (compact ? 1.45 : 1.65)));
    const subLineH = Math.max(compact ? 15 : 18, Math.round(subtitleSize * (compact ? 1.35 : 1.55)));
    const rowGap = Math.max(compact ? 6 : 10, Math.round(settings.labelSizeRender * (compact ? 0.55 : 0.75)));
    const padV = Math.max(compact ? 12 : 16, Math.round(settings.labelSize * (compact ? 0.75 : 1.05)));
    const textX = 52;
    const markerX = 26;
    const rightPad = compact ? 18 : 26;
    const textWidth = Math.max(90, width - textX - rightPad);
    const maxNameChars = Math.max(12, Math.floor(textWidth / Math.max(6, nameSize * 0.58)));
    let cursorY = padV;
    const rows = calloutRows.map((row, index) => {
      const nameLines = wrapLabel(row.name, maxNameChars);
      const nameHeight = nameLines.length * lineH;
      const rowHeight = nameHeight + subLineH;
      const layout = {
        row,
        rowY: cursorY,
        rowHeight,
        nameLines,
        subtitleY: cursorY + nameHeight
      };
      cursorY += rowHeight + (index < calloutRows.length - 1 ? rowGap : 0);
      return layout;
    });

    return {
      subtitleText,
      nameSize,
      subtitleSize,
      lineH,
      subLineH,
      rowGap,
      padV,
      textX,
      markerX,
      rows,
      contentHeight: Math.max(padV * 2, cursorY + padV)
    };
  }

  function getCalloutBoxLayout(calloutRows, settings) {
    const compact = settings.compactFurniture !== false;
    const longestNameLen = Math.max(0, ...calloutRows.map(row => String(row.name || "").length));
    const boxPad = compact ? 80 : 110;
    const nameWidth = longestNameLen * settings.labelSize * 0.58 + boxPad;
    const subWidth = "Canada-wide, not shown on map".length * Math.max(10, Math.round(settings.labelSize * 0.85)) * 0.56 + boxPad;
    const fallbackWidth = Math.max(compact ? 220 : 260, Math.min(settings.width - 40, Math.round(Math.max(nameWidth, subWidth))));
    const widthConstraints = {
      minWidth: compact ? 220 : 260,
      minHeight: 40,
      maxWidth: settings.width - 20,
      maxHeight: settings.height - 20
    };
    const widthOnly = getBoxDimensions("callouts", { width: fallbackWidth, height: 40 }, widthConstraints, settings).width;
    const content = getCalloutContentLayout(calloutRows, settings, widthOnly);
    const fallbackDimensions = {
      width: widthOnly,
      height: content.contentHeight
    };
    const constraints = {
      minWidth: widthConstraints.minWidth,
      minHeight: content.contentHeight,
      maxWidth: widthConstraints.maxWidth,
      maxHeight: widthConstraints.maxHeight
    };
    const dimensions = getBoxDimensions("callouts", fallbackDimensions, constraints, settings);
    const fittedContent = dimensions.width === widthOnly
      ? content
      : getCalloutContentLayout(calloutRows, settings, dimensions.width);
    dimensions.height = Math.max(dimensions.height, fittedContent.contentHeight);
    const fallback = {
      x: Math.max(30, settings.width - dimensions.width - 30),
      y: 30
    };
    const position = getBoxPosition("callouts", fallback, dimensions, settings);
    return {
      dimensions,
      position,
      constraints: { ...constraints, minHeight: fittedContent.contentHeight },
      ...fittedContent
    };
  }

  function getLayoutBoxObstacles(settings, calloutRows) {
    const pad = Math.max(12, Math.round(settings.labelSize * 0.8));
    const obstacles = [];
    if (settings.showLegend) {
      const legend = getLegendBoxLayout(settings);
      obstacles.push({
        key: "legend",
        rect: inflateRect(rectFromPosition(legend.position, legend.dimensions), pad)
      });
    }
    if (settings.showCallouts && calloutRows.length) {
      const callouts = getCalloutBoxLayout(calloutRows, settings);
      obstacles.push({
        key: "callouts",
        rect: inflateRect(rectFromPosition(callouts.position, callouts.dimensions), pad)
      });
    }
    return obstacles;
  }

  function attachBoxDragging(group, key, position, dimensions, settings, label, mapBounds) {
    const state = { x: position.x, y: position.y };
    group.call(d3.drag()
      .on("start", function () {
        state.dragStartX = state.x;
        state.dragStartY = state.y;
        state.axis = null;
        d3.select(this).classed("is-dragging", true);
      })
      .on("drag", function (event) {
        const constrained = constrainShiftDrag(
          { x: state.dragStartX, y: state.dragStartY },
          { x: state.x + event.dx, y: state.y + event.dy },
          state,
          event
        );
        const next = clampBoxPosition(constrained, dimensions, settings);
        state.x = next.x;
        state.y = next.y;
        saveManualBoxState(key, next, dimensions);
        d3.select(this).attr("transform", translatePosition(next));
        const subjectRect = rectFromPosition(next, dimensions);
        drawDistanceMarkers(els.svg, settings, subjectRect, {
          mapBounds,
          includeNearbyLabels: true
        });
      })
      .on("end", function () {
        delete state.dragStartX;
        delete state.dragStartY;
        delete state.axis;
        clearDistanceMarkers();
        d3.select(this).classed("is-dragging", false);
        setStatusMessage(`${label} moved.`, "ok");
      }));
  }

  function positionBoxControls(group, dimensions) {
    group.select(".box-hide-control")
      .attr("transform", `translate(${Math.max(8, dimensions.width - 25)},8)`);
    group.select(".box-resize-control")
      .attr("transform", `translate(${Math.max(0, dimensions.width - 16)},${Math.max(0, dimensions.height - 16)})`);
  }

  function attachBoxControls(group, key, position, dimensions, constraints, settings, label, mapBounds, visibilityInput) {
    const hide = group.append("g")
      .attr("class", "box-controls box-hide-control")
      .attr("role", "button")
      .attr("aria-label", `Hide ${label}`)
      .on("click", event => {
        event.stopPropagation();
        if (visibilityInput) {
          setMapFurnitureVisibility(key, false, visibilityInput, label);
        }
      });

    hide.append("rect")
      .attr("width", 17)
      .attr("height", 17)
      .attr("rx", 3);
    hide.append("line")
      .attr("x1", 5)
      .attr("y1", 5)
      .attr("x2", 12)
      .attr("y2", 12);
    hide.append("line")
      .attr("x1", 12)
      .attr("y1", 5)
      .attr("x2", 5)
      .attr("y2", 12);

    const resizeState = {
      x: position.x,
      y: position.y,
      width: dimensions.width,
      height: dimensions.height
    };
    const resize = group.append("g")
      .attr("class", "box-controls box-resize-control")
      .call(d3.drag()
        .on("start", function (event) {
          if (event.sourceEvent) event.sourceEvent.stopPropagation();
          d3.select(this).classed("is-dragging", true);
          group.classed("is-resizing", true);
        })
        .on("drag", function (event) {
          if (event.sourceEvent) event.sourceEvent.stopPropagation();
          const nextDimensions = clampBoxDimensions({
            width: resizeState.width + event.dx,
            height: resizeState.height + event.dy
          }, constraints, settings);
          const nextPosition = clampBoxPosition({ x: resizeState.x, y: resizeState.y }, nextDimensions, settings);
          resizeState.x = nextPosition.x;
          resizeState.y = nextPosition.y;
          resizeState.width = nextDimensions.width;
          resizeState.height = nextDimensions.height;
          saveManualBoxState(key, nextPosition, nextDimensions);
          group.attr("transform", translatePosition(nextPosition));
          group.select(".legend-box, .callout-box")
            .attr("width", nextDimensions.width)
            .attr("height", nextDimensions.height);
          positionBoxControls(group, nextDimensions);
          const subjectRect = rectFromPosition(nextPosition, nextDimensions);
          drawDistanceMarkers(els.svg, settings, subjectRect, {
            mapBounds,
            includeNearbyLabels: true
          });
        })
        .on("end", function () {
          d3.select(this).classed("is-dragging", false);
          group.classed("is-resizing", false);
          clearDistanceMarkers();
          scheduleRender();
          setStatusMessage(`${label} resized.`, "ok");
        }));

    resize.append("rect")
      .attr("width", 16)
      .attr("height", 16)
      .attr("rx", 3);
    resize.append("path")
      .attr("d", "M5,12 L12,5 M9,12 L12,9");

    positionBoxControls(group, dimensions);
  }

  function drawLegend(svg, settings, mapBounds) {
    const {
      dimensions,
      position,
      constraints,
      headingSizeRender,
      rowHeight,
      headingHeight,
      verticalPadding
    } = getLegendBoxLayout(settings);
    const group = svg.append("g")
      .attr("class", "legend-layer movable-map-box")
      .attr("transform", translatePosition(position));

    group.append("rect")
      .attr("class", "legend-box")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", dimensions.width)
      .attr("height", dimensions.height);

    group.append("text")
      .attr("class", "box-heading legend-heading")
      .attr("x", 24)
      .attr("y", verticalPadding + 4)
      .attr("font-size", headingSizeRender)
      .attr("font-family", settings.fontFamily)
      .attr("dominant-baseline", "hanging")
      .text("Legend");

    categorySettings.forEach((category, index) => {
      const itemY = verticalPadding + headingHeight + index * rowHeight + rowHeight / 2;
      const legendMarkerSize = Math.max(8, Math.min(18, getCategoryMarkerSize(category, settings)));
      drawMarkerSymbol(group, category, 46, itemY, legendMarkerSize);
      group.append("text")
        .attr("class", "legend-text")
        .attr("x", 72)
        .attr("y", itemY)
        .attr("font-size", settings.labelSizeRender)
        .attr("font-family", settings.fontFamily)
        .attr("text-anchor", "start")
        .attr("dominant-baseline", "middle")
        .text(category.label);
    });

    attachBoxDragging(group, "legend", position, dimensions, settings, "Legend", mapBounds);
    attachBoxControls(group, "legend", position, dimensions, constraints, settings, "Legend", mapBounds, els.showLegendInput);
  }

  function drawCallouts(svg, calloutRows, settings, mapBounds) {
    const {
      dimensions,
      position,
      constraints,
      subtitleText,
      nameSize,
      subtitleSize,
      lineH,
      textX,
      markerX,
      rows
    } = getCalloutBoxLayout(calloutRows, settings);
    const group = svg.append("g")
      .attr("class", "callout-layer movable-map-box")
      .attr("transform", translatePosition(position));

    group.append("rect")
      .attr("class", "callout-box")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", dimensions.width)
      .attr("height", dimensions.height);

    rows.forEach(layout => {
      const { row, rowY, nameLines, rowHeight, subtitleY } = layout;
      const category = getCategory(row.type);
      const markerSize = Math.max(7, Math.min(14, getCategoryMarkerSize(category, settings)));
      drawMarkerSymbol(group, category, markerX, rowY + rowHeight / 2, markerSize);

      const nameEl = group.append("text")
        .attr("class", "callout-text")
        .attr("x", textX)
        .attr("y", rowY)
        .attr("font-size", nameSize)
        .attr("font-family", settings.fontFamily)
        .attr("dominant-baseline", "hanging");
      nameLines.forEach((line, index) => {
        nameEl.append("tspan")
          .attr("x", textX)
          .attr("dy", index === 0 ? 0 : lineH)
          .text(line);
      });
      const footnote = getRenderableFootnote(row.footnote);
      if (footnote) appendSuperscript(nameEl, footnote, nameSize);

      group.append("text")
        .attr("class", "callout-subtitle")
        .attr("x", textX)
        .attr("y", subtitleY)
        .attr("font-size", subtitleSize)
        .attr("font-family", settings.fontFamily)
        .attr("dominant-baseline", "hanging")
        .text(subtitleText);
    });

    attachBoxDragging(group, "callouts", position, dimensions, settings, "Callouts", mapBounds);
    attachBoxControls(group, "callouts", position, dimensions, constraints, settings, "No-coordinate callouts", mapBounds, els.showCalloutsInput);
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
    return normalizeFontFamily(fontFamily)
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
    const ink = getCssVar("--map-ink", getCssVar("--ink", "#222222"));
    const muted = getCssVar("--map-muted", getCssVar("--muted", "#666666"));
    const leader = getCssVar("--leader", "#333333");
    const fontFamily = quoteFontFamily(getSettings().fontFamily);

    return `
      #mapSvg { background: ${mapBackground}; }
      .map-title { font-size: 24px; font-weight: 700; fill: ${ink}; font-family: ${fontFamily}; }
      .province { stroke: ${mapBoundary}; stroke-width: 1.2; }
      .marker { stroke-width: 2.2; }
      .leader-casing { fill: none; stroke: ${mapBackground}; stroke-linecap: round; stroke-linejoin: round; }
      .leader-line { fill: none; stroke: ${leader}; stroke-linecap: round; stroke-linejoin: round; }
      .map-label-background { fill: none; stroke: none; }
      .map-label { font-family: ${fontFamily}; font-weight: 700; fill: ${ink}; }
      .label-footnote { font-weight: 700; }
      .callout-box, .legend-box { fill: ${mapBackground}; stroke: ${mapBoxBorder}; stroke-width: 1.5; }
      .callout-text, .legend-text { font-family: ${fontFamily}; fill: ${ink}; font-weight: 700; }
      .box-heading { font-family: ${fontFamily}; fill: ${ink}; font-weight: 700; }
      .legend-note { font-family: ${fontFamily}; fill: ${muted}; font-style: italic; }
    `;
  }

  function cloneCurrentSvgForExport(outputMode = "web") {
    const svgNode = document.querySelector("#mapSvg");
    if (!svgNode || !svgNode.children.length) throw new Error("There is no map preview to export.");

    const clone = svgNode.cloneNode(true);
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.setAttribute("version", "1.1");
    clone.setAttribute("style", `background:${getCssVar("--map-background", "#ffffff")}`);
    if (outputMode === "print") {
      const settings = getSettings({ outputMode: "print" });
      clone.setAttribute("width", `${settings.width}pt`);
      clone.setAttribute("height", `${settings.height}pt`);
      clone.setAttribute("data-output", "print");
    } else {
      clone.setAttribute("data-output", "web");
    }

    clone.querySelectorAll(".map-scale-controls, .distance-markers, .box-controls").forEach(node => node.remove());

    const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
    style.textContent = getExportCss();
    clone.insertBefore(style, clone.firstChild);
    return clone;
  }

  function cloneSvgForExport(outputMode = "web") {
    if (outputMode === renderOutputMode) return cloneCurrentSvgForExport(outputMode);

    const previousOutputMode = renderOutputMode;
    try {
      renderOutputMode = outputMode;
      render();
      return cloneCurrentSvgForExport(outputMode);
    } finally {
      renderOutputMode = previousOutputMode;
      render();
    }
  }

  function exportSvg() {
    try {
      const clone = cloneSvgForExport("print");
      const source = `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(clone)}`;
      download("custom-map.svg", source, "image/svg+xml;charset=utf-8");
      setStatusMessage("Print SVG export started. Check your Downloads folder for custom-map.svg.", "ok");
    } catch (error) {
      setStatusMessage(`SVG export failed: ${error.message || String(error)}`, "danger");
    }
  }

  function exportPng() {
    let url = "";
    try {
      const settings = getSettings();
      const clone = cloneSvgForExport("web");
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
      priority: row.priority || "",
      lon: row.lon,
      lat: row.lat,
      hideLine: row.hideLine ? "yes" : ""
    }));
    const columns = ["name", "footnote", "type", "priority", "lon", "lat", "hideLine"];
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
        priority: row.priority || 0,
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
        applyMapStylePreset(project.mapStyle || defaultMapStylePreset, { applyMapColours: false, render: false });
        applySettings(project.settings || {});
        if (project.settings) saveLayoutPreferences();
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
        report.messages.unshift("Papa Parse did not load, so Plotypus used its built-in CSV parser. Review quoted fields before importing.");
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
        messages.push(`CSV row ${index + 2}: footnote must contain only letters, numbers, or a single asterisk to appear as superscript.`);
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
    on(els.loadSampleBtn, "click", () => setRows(sampleRows));
    on(els.ribbonLoadSampleBtn, "click", () => setRows(sampleRows));
    on(els.ribbonOpenProjectBtn, "click", () => els.projectInput.click());
    on(els.ribbonSaveProjectBtn, "click", saveProject);
    on(els.ribbonImportCsvBtn, "click", () => els.csvInput.click());
    on(els.ribbonExportCsvBtn, "click", exportCsv);
    on(els.ribbonAutoPlaceBtn, "click", autoPlaceLabels);
    on(els.ribbonExportSvgBtn, "click", exportSvg);
    on(els.ribbonExportPngBtn, "click", exportPng);
    on(els.addRowBtn, "click", () => {
      const tr = addRow();
      tr.classList.add("is-new");
      tr.scrollIntoView({ block: "nearest", behavior: "smooth" });
      tr.querySelector(".name-input").focus();
      window.setTimeout(() => tr.classList.remove("is-new"), 120);
    });
    on(els.clearRowsBtn, "click", confirmClearProjectRows);
    on(els.deleteSelectedBtn, "click", () => {
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
    on(els.downloadCsvBtn, "click", exportCsv);
    on(els.saveProjectBtn, "click", saveProject);
    on(els.exportSvgBtn, "click", exportSvg);
    on(els.exportPngBtn, "click", exportPng);
    on(els.projectTableTab, "click", () => switchDataTable("projects"));
    on(els.regionTableTab, "click", () => switchDataTable("regions"));
    on(els.previewTableTab, "click", () => switchDataTable("preview"));
    on(els.updateRegionValuesBtn, "click", () => updateRegionValuesFromProjectPoints({ selectRegions: true }));
    on(els.applyRegionValueColoursBtn, "click", () => {
      applyRegionColoursByValue();
      setStatusMessage("Applied region colours from the Map regions table.", "ok");
    });
    on(els.resetRegionValuesBtn, "click", resetRegionValues);
    on(els.csvInput, "change", e => {
      const file = e.target.files && e.target.files[0];
      if (file) importCsv(file);
      e.target.value = "";
    });
    on(els.projectInput, "change", e => {
      const file = e.target.files && e.target.files[0];
      if (file) loadProject(file);
      e.target.value = "";
    });
    on(els.statusBox, "click", handleStatusAction);
    on(els.projectTable, "paste", pasteIntoTable);
    document.addEventListener("click", event => {
      const resetButton = event.target.closest(".reset-default-btn");
      if (resetButton) resetLayoutInputToDefault(resetButton);
      if (mapScaleControlsVisible && els.mapHost && !els.mapHost.contains(event.target)) {
        hideMapScaleControls();
      }
    });
    [
      els.bookSizeInput,
      els.imageSizeInput,
      els.labelSizeInput,
      els.mapScaleInput,
      els.markerSizeInput,
      els.lineWidthInput,
      els.labelCharsInput,
      els.fontFamilyInput,
      els.showLegendInput,
      els.showCalloutsInput,
      els.compactFurnitureInput,
      els.showLineCasingInput,
      els.routeDenseLeadersInput,
      els.showDistanceMarkersInput,
      els.lockMarkerCoordinatesInput
    ].forEach(el => on(el, "change", handleLayoutSettingsChange));
    on(els.addCategoryBtn, "click", addCategory);
    on(els.categoryList, "change", handleCategorySettingsChange);
    on(els.categoryList, "input", debounce(handleCategorySettingsChange, 250));
    on(els.categoryList, "click", event => {
      const removeButton = event.target.closest(".remove-category-btn");
      if (removeButton) removeCategory(removeButton.dataset.categoryId);

      const toggleButton = event.target.closest(".toggle-category-btn");
      if (toggleButton) toggleCategory(toggleButton.dataset.categoryId);
    });
    on(els.categoryList, "dragstart", handleCategoryDragStart);
    on(els.categoryList, "dragover", handleCategoryDragOver);
    on(els.categoryList, "drop", handleCategoryDrop);
    on(els.categoryList, "dragend", handleCategoryDragEnd);
    on(els.regionTableBody, "change", event => {
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
    on(els.mapStylePresetInput, "change", () => {
      applyMapStylePreset(els.mapStylePresetInput.value);
    });
    on(els.boundaryInput, "change", async () => {
      currentBoundary = Object.prototype.hasOwnProperty.call(boundarySources, els.boundaryInput.value) ? els.boundaryInput.value : "canada";
      renderRegionPresetOptions();
      regionVisibility = {};
      regionFills = {};
      regionValues = {};
      regionColourOverrides = {};
      await loadGeo();
      render();
    });
    on(els.regionPresetInput, "change", () => {
      applyRegionPreset(els.regionPresetInput.value);
      els.regionPresetInput.value = "";
    });
    on(els.selectAllRegionsBtn, "click", () => setAllRegions(true));
    on(els.clearRegionsBtn, "click", () => setAllRegions(false));
    on(els.selectProjectRegionsBtn, "click", selectRegionsWithProjectPoints);
    on(els.resetRegionColoursBtn, "click", resetRegionColours);
  }

  async function loadGeo() {
    const source = boundarySources[currentBoundary] || boundarySources.canada;
    try {
      canadaGeo = normalizeBoundaryGeoJson(await fetchGeoJsonWithFallback(source), source);
      initializeRegionVisibility();
      applyRegionColoursByValue(false);
      renderRegionControls();
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
    renderBookSizeOptions();
    renderFontOptions();
    if (!applySavedLayoutPreferences()) renderImageSizeOptions();
    renderRegionPresetOptions();
    renderMapStyleOptions();
    renderCategoryEditors();
    setRows(sampleRows);
    await loadGeo();
    render();
    switchDataTable(getSavedDataTable());
  }

  function createTestApi() {
    return {
      rectsOverlap,
      rectOverlapArea,
      segmentsCross,
      pointInRect,
      segmentIntersectsRect,
      lineEnd,
      makeLabelPlacement,
      createCandidateForSide,
      createLabelCandidates,
      createPerimeterCandidateMap,
      createPerimeterCapacity,
      assessPerimeterFeasibility,
      scoreCandidate,
      countSideOrderInversions,
      createOrderPreservingVerticalSlots,
      createOrderPreservingHorizontalSlots,
      optimizeOrderedSideBands,
      applyManualLabelPositions,
      setManualLabelPositions(value) {
        manualLabelPositions = { ...(value || {}) };
      },
      getManualLabelPositions() {
        return { ...manualLabelPositions };
      }
    };
  }

  if (window.PLOTYPUS_TEST_MODE) {
    window.PLOTYPUS_TEST_API = createTestApi();
    return;
  }

  init();
})();

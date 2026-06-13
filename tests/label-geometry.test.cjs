const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

function loadApi() {
  const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
  const windowStub = {
    d3: {},
    PLOTYPUS_TEST_MODE: true,
    MAP_APP_STYLE_PRESETS: undefined,
    MAP_APP_CATEGORY_COLOUR_PRESETS: undefined,
    localStorage: {
      getItem() {
        return null;
      },
      setItem() {}
    }
  };
  const documentStub = {
    querySelector() {
      return null;
    },
    querySelectorAll() {
      return [];
    }
  };
  const d3Stub = {
    select() {
      return {};
    }
  };
  const context = {
    console,
    window: windowStub,
    document: documentStub,
    d3: d3Stub
  };

  vm.runInNewContext(appSource, context, { filename: "app.js" });
  assert.ok(windowStub.PLOTYPUS_TEST_API, "test API should be exported");
  return windowStub.PLOTYPUS_TEST_API;
}

function makeLabel(overrides = {}) {
  return {
    rowId: "row-a",
    name: "Alpha",
    type: "referred",
    x: 100,
    y: 100,
    labelX: 130,
    labelY: 100,
    labelSide: "right",
    lines: ["Alpha"],
    lineHeight: 12,
    textWidth: 40,
    textHeight: 12,
    hideLine: false,
    ...overrides
  };
}

function makeSettings(overrides = {}) {
  return {
    width: 300,
    height: 220,
    labelSize: 12,
    labelSizeRender: 12,
    markerSize: 10,
    lineWidth: 2,
    labelMaxChars: 26,
    ...overrides
  };
}

function makeMapBounds() {
  return { x0: 80, y0: 60, x1: 220, y1: 160 };
}

test("rect overlap detects collisions and computes positive area only", () => {
  const api = loadApi();
  const a = { x0: 0, y0: 0, x1: 10, y1: 10 };
  const b = { x0: 5, y0: 5, x1: 15, y1: 15 };
  const c = { x0: 11, y0: 11, x1: 20, y1: 20 };

  assert.equal(api.rectsOverlap(a, b), true);
  assert.equal(api.rectOverlapArea(a, b), 25);
  assert.equal(api.rectsOverlap(a, c), false);
  assert.equal(api.rectOverlapArea(a, c), 0);
});

test("segment crossing and segment-rectangle intersection catch leader conflicts", () => {
  const api = loadApi();
  const diagonalA = { x: 0, y: 0 };
  const diagonalB = { x: 10, y: 10 };
  const diagonalC = { x: 0, y: 10 };
  const diagonalD = { x: 10, y: 0 };
  const parallelC = { x: 0, y: 2 };
  const parallelD = { x: 10, y: 12 };
  const rect = { x0: 4, y0: 4, x1: 6, y1: 6 };

  assert.equal(api.segmentsCross(diagonalA, diagonalB, diagonalC, diagonalD), true);
  assert.equal(api.segmentsCross(diagonalA, diagonalB, parallelC, parallelD), false);
  assert.equal(api.segmentIntersectsRect(diagonalA, diagonalB, rect), true);
  assert.equal(api.segmentIntersectsRect({ x: 0, y: 20 }, { x: 10, y: 20 }, rect), false);
});

test("candidate scoring penalizes label-marker and leader-marker conflicts", () => {
  const api = loadApi();
  const settings = makeSettings();
  const mapBounds = makeMapBounds();
  const clean = makeLabel({ labelX: 230, labelY: 80, labelSide: "right" });
  const colliding = makeLabel({ labelX: 132, labelY: 100, labelSide: "right" });
  const points = [
    makeLabel({ rowId: "row-a", x: 100, y: 100 }),
    makeLabel({ rowId: "row-b", x: 150, y: 100, labelX: 10, labelY: 10 })
  ];

  const cleanScore = api.scoreCandidate(clean, [], settings, mapBounds, "right", points);
  const collidingScore = api.scoreCandidate(colliding, [], settings, mapBounds, "right", points);

  assert.ok(collidingScore > cleanScore, `expected marker conflict score ${collidingScore} > clean score ${cleanScore}`);
});

test("candidate scoring strongly penalizes labels that enter reserved layout boxes", () => {
  const api = loadApi();
  const settings = makeSettings({
    layoutObstacles: [
      { key: "legend", rect: { x0: 20, y0: 140, x1: 180, y1: 210 } }
    ]
  });
  const mapBounds = makeMapBounds();
  const clear = makeLabel({ labelX: 220, labelY: 70, labelSide: "right" });
  const blocked = makeLabel({ labelX: 40, labelY: 170, labelSide: "right" });
  const points = [makeLabel({ rowId: "row-a", x: 100, y: 100 })];

  const clearScore = api.scoreCandidate(clear, [], settings, mapBounds, "right", points);
  const blockedScore = api.scoreCandidate(blocked, [], settings, mapBounds, "right", points);

  assert.ok(blockedScore > clearScore, `expected layout obstacle score ${blockedScore} > clear score ${clearScore}`);
});

test("candidate scoring rejects opposite-side labels that create long cross-map leaders", () => {
  const api = loadApi();
  const settings = makeSettings({ width: 360, height: 240 });
  const mapBounds = { x0: 90, y0: 60, x1: 270, y1: 170 };
  const point = makeLabel({ rowId: "row-east", x: 245, y: 115, lon: -65, lat: 46 });
  const right = makeLabel({ ...point, labelX: 285, labelY: 115, labelSide: "right" });
  const left = makeLabel({ ...point, labelX: 75, labelY: 115, labelSide: "left" });

  const rightScore = api.scoreCandidate(right, [], settings, mapBounds, "right", [point]);
  const leftScore = api.scoreCandidate(left, [], settings, mapBounds, "right", [point]);

  assert.ok(leftScore > rightScore + 50000, `expected opposite-side score ${leftScore} to exceed right-side score ${rightScore}`);
});

test("perimeter candidates add outside-map slots for dense cartographic labels", () => {
  const api = loadApi();
  const settings = makeSettings();
  const mapBounds = makeMapBounds();
  const points = [
    makeLabel({ rowId: "row-a", name: "Alpha", x: 100, y: 100, lon: -120, lat: 55 }),
    makeLabel({ rowId: "row-b", name: "Beta", x: 145, y: 105, lon: -110, lat: 56 }),
    makeLabel({ rowId: "row-c", name: "Gamma", x: 170, y: 110, lon: -90, lat: 57 })
  ];
  const perimeterMap = api.createPerimeterCandidateMap(points, settings, mapBounds);
  const alphaSlots = perimeterMap.get("row:row-a");

  assert.ok(alphaSlots.length >= 4, "expected outside candidates on all sides");
  assert.ok(
    alphaSlots.some(candidate => candidate.side === "left" && candidate.x - candidate.box.textWidth <= mapBounds.x0),
    "expected a left perimeter candidate outside the map bounds"
  );
  assert.ok(
    alphaSlots.some(candidate => candidate.side === "top" && candidate.y - candidate.box.lineHeight / 1.2 < mapBounds.y0),
    "expected a top perimeter candidate outside the map bounds"
  );
});

test("perimeter feasibility accounts for outside strip capacity", () => {
  const api = loadApi();
  const settings = makeSettings({ width: 420, height: 300, labelSize: 12 });
  const mapBounds = { x0: 150, y0: 90, x1: 270, y1: 200 };
  const labels = [
    makeLabel({ rowId: "row-a", name: "Alpha Project", x: 160, y: 120, lon: -120, lat: 55 }),
    makeLabel({ rowId: "row-b", name: "Beta Project", x: 250, y: 140, lon: -90, lat: 55 }),
    makeLabel({ rowId: "row-c", name: "Gamma Project", x: 210, y: 95, lon: -100, lat: 65 })
  ];

  const result = api.assessPerimeterFeasibility(labels, settings, mapBounds, []);

  assert.equal(result.feasible, true);
  assert.equal(result.placed, labels.length);
});

test("perimeter feasibility rejects layouts when outside strips are too small or blocked", () => {
  const api = loadApi();
  const settings = makeSettings({ width: 320, height: 230, labelSize: 14 });
  const mapBounds = { x0: 45, y0: 40, x1: 275, y1: 190 };
  const labels = Array.from({ length: 8 }, (_, index) => makeLabel({
    rowId: `row-${index}`,
    name: `Very Long Infrastructure Label ${index + 1}`,
    x: 100 + index * 8,
    y: 80 + index * 5,
    lon: -110 + index,
    lat: 55
  }));
  const obstacles = [
    { key: "legend", rect: { x0: 20, y0: 150, x1: 240, y1: 220 } }
  ];

  const result = api.assessPerimeterFeasibility(labels, settings, mapBounds, obstacles);

  assert.equal(result.feasible, false);
  assert.ok(result.unmet.length > 0, "expected at least one label to exceed outside strip capacity");
});

test("ordered side-band pass preserves anchor order for same-side labels", () => {
  const api = loadApi();
  const settings = makeSettings({ width: 420, height: 280, labelSize: 12 });
  const mapBounds = { x0: 150, y0: 70, x1: 270, y1: 210 };
  const labels = [
    makeLabel({
      rowId: "upper",
      name: "Upper Label",
      x: 150,
      y: 80,
      labelX: 110,
      labelY: 170,
      labelSide: "left",
      textWidth: 80
    }),
    makeLabel({
      rowId: "lower",
      name: "Lower Label",
      x: 155,
      y: 150,
      labelX: 110,
      labelY: 85,
      labelSide: "left",
      textWidth: 80
    })
  ];

  assert.equal(api.countSideOrderInversions(labels), 1);

  const optimized = api.optimizeOrderedSideBands(labels, labels, settings, mapBounds);
  const upper = optimized.find(label => label.rowId === "upper");
  const lower = optimized.find(label => label.rowId === "lower");

  assert.equal(api.countSideOrderInversions(optimized), 0);
  assert.equal(upper.labelSide, "left");
  assert.equal(lower.labelSide, "left");
  assert.ok(upper.labelY < lower.labelY, `expected upper label ${upper.labelY} above lower label ${lower.labelY}`);
});

test("ordered side-band pass preserves anchor order for bottom labels", () => {
  const api = loadApi();
  const settings = makeSettings({ width: 520, height: 320, labelSize: 12 });
  const mapBounds = { x0: 120, y0: 70, x1: 400, y1: 220 };
  const labels = [
    makeLabel({
      rowId: "west",
      name: "West Bottom Label",
      x: 180,
      y: 170,
      labelX: 250,
      labelY: 285,
      labelSide: "bottom",
      textWidth: 110
    }),
    makeLabel({
      rowId: "east",
      name: "East Bottom Label",
      x: 260,
      y: 185,
      labelX: 150,
      labelY: 285,
      labelSide: "bottom",
      textWidth: 110
    })
  ];

  assert.equal(api.countSideOrderInversions(labels), 1);

  const optimized = api.optimizeOrderedSideBands(labels, labels, settings, mapBounds);
  const west = optimized.find(label => label.rowId === "west");
  const east = optimized.find(label => label.rowId === "east");

  assert.equal(api.countSideOrderInversions(optimized), 0);
  assert.equal(west.labelSide, "bottom");
  assert.equal(east.labelSide, "bottom");
  assert.ok(api.lineEnd(west).x < api.lineEnd(east).x, "expected bottom leader endpoints to follow anchor x-order");
});

test("manual positions override automatic labels and preserve stable keys", () => {
  const api = loadApi();
  const placed = [
    makeLabel({ rowId: "42", name: "Manual label", labelX: 10, labelY: 20 })
  ];

  api.setManualLabelPositions({ "row:42": { x: 88, y: 99 } });
  const result = api.applyManualLabelPositions(placed);

  assert.equal(result[0].labelKey, "row:42");
  assert.equal(result[0].layoutId, "label-0");
  assert.equal(result[0].labelX, 88);
  assert.equal(result[0].labelY, 99);
});

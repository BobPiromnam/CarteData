(function () {
  /*
    Developer note: add map styles here.

    1. Create a matching CSS file in themes/, for example themes/my-style.css.
       The CSS file should usually override :root variables only.
    2. Add a new entry to MAP_APP_STYLE_PRESETS.
       - label: what users see in the Map style dropdown.
       - stylesheet: path to the theme CSS file.
       - regionColours: approved region fill colours from lowest value to highest value.
       - categoryStyles: default marker/line styles applied to legend categories in order.
    3. To change the marker colour picker, edit MAP_APP_CATEGORY_COLOUR_PRESETS below.
    4. No build step is required. The app reads this file before app.js.
  */

  window.MAP_APP_CATEGORY_COLOUR_PRESETS = [
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

  window.MAP_APP_STYLE_PRESETS = {
    "goc-green": {
      label: "GoC green",
      stylesheet: "themes/goc-green.css?v=20260612-map-only",
      regionColours: ["#c7ded5", "#96c6b4", "#6caf94", "#078c70"],
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
  };
})();

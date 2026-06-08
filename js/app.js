/* ============================================================
   Baja Cape Loop — app
   Static, no build, no storage APIs. State lives in the URL hash.
   ============================================================ */
(function () {
  "use strict";

  var DATA = "./public/data/";
  var LEGEND = {
    F: "Large food store", f: "Limited food", W: "Water", M: "Motel",
    C: "Camping", R: "Restaurant", B: "Bike shop", $: "ATM",
    Bus: "Bus", Airport: "Airport"
  };

  /* ---------- tiny helpers ---------- */
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function getJSON(file) {
    return fetch(DATA + file).then(function (r) {
      if (!r.ok) throw new Error("Failed to load " + file + " (" + r.status + ")");
      return r.json();
    });
  }
  function decodeServices(svc) {
    if (!svc || svc === "—") return [];
    var out = [];
    // word tokens first
    ["Bus", "Airport"].forEach(function (w) {
      if (svc.indexOf(w) !== -1) out.push({ code: w, label: LEGEND[w] });
    });
    var base = svc.replace(/Bus|Airport|limited/g, "");
    for (var i = 0; i < base.length; i++) {
      var ch = base[i];
      if (LEGEND[ch]) out.push({ code: ch, label: LEGEND[ch] });
    }
    return out;
  }

  /* ---------- tab routing ---------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll(".tab"));
  var panels = {
    map: document.getElementById("panel-map"),
    itinerary: document.getElementById("panel-itinerary"),
    gear: document.getElementById("panel-gear"),
    readiness: document.getElementById("panel-readiness")
  };
  var mapInited = false;

  function showTab(name) {
    tabs.forEach(function (t) {
      var on = t.dataset.tab === name;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
    });
    Object.keys(panels).forEach(function (k) {
      var on = k === name;
      panels[k].classList.toggle("is-active", on);
      panels[k].hidden = !on;
    });
    if (name === "map" && !mapInited) initMap();
    if (name === "map" && window._bajaMap) {
      // map needs a resize when it becomes visible
      setTimeout(function () { window._bajaMap.resize(); }, 60);
    }
  }
  tabs.forEach(function (t) {
    t.addEventListener("click", function () { showTab(t.dataset.tab); });
  });
  document.addEventListener("click", function (e) {
    var jump = e.target.closest && e.target.closest("[data-jump]");
    if (jump) { e.preventDefault(); showTab(jump.dataset.jump); }
  });

  /* ============================================================
     MAP
     ============================================================ */
  function tokenLooksReal(t) {
    return typeof t === "string" && /^pk\./.test(t) && t.indexOf("PASTE_YOUR") === -1;
  }

  function initMap() {
    mapInited = true;
    var fallback = document.getElementById("map-fallback");
    var controls = document.getElementById("map-controls");

    if (typeof mapboxgl === "undefined" || !tokenLooksReal(window.MAPBOX_TOKEN)) {
      fallback.hidden = false;
      return;
    }

    try {
      mapboxgl.accessToken = window.MAPBOX_TOKEN;
      var map = new mapboxgl.Map({
        container: "map",
        style: "mapbox://styles/mapbox/outdoors-v12",
        center: [-109.87, 23.66],
        zoom: 8,
        cooperativeGestures: true
      });
      window._bajaMap = map;
      map.addControl(new mapboxgl.NavigationControl(), "top-left");

      map.on("error", function () { /* keep going; tiles may still load */ });

      Promise.all([getJSON("route.geojson"), getJSON("pois.geojson")])
        .then(function (res) {
          var route = res[0], pois = res[1];
          map.on("load", function () { buildMapLayers(map, route, pois, controls); });
          if (map.loaded()) buildMapLayers(map, route, pois, controls);
        })
        .catch(function () { fallback.hidden = false; });
    } catch (err) {
      fallback.hidden = false;
    }
  }

  function featureById(fc, id) {
    return { type: "FeatureCollection", features: fc.features.filter(function (f) { return f.properties.id === id; }) };
  }

  function buildMapLayers(map, route, pois, controls) {
    // --- alternates (drawn under the main line) ---
    [["los_cerritos", "#7a4ec2"], ["la_paz_shortcut", "#1c6e8c"]].forEach(function (pair) {
      var id = pair[0];
      map.addSource("alt-" + id, { type: "geojson", data: featureById(route, id) });
      map.addLayer({
        id: "alt-" + id, type: "line", source: "alt-" + id,
        layout: { "line-cap": "round", "line-join": "round", visibility: "none" },
        paint: { "line-color": pair[1], "line-width": 3, "line-dasharray": [1, 1.6] }
      });
    });

    // --- main loop: dashed line ---
    map.addSource("route", { type: "geojson", data: featureById(route, "main") });
    map.addLayer({
      id: "route-casing", type: "line", source: "route",
      layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": "#fbf7ec", "line-width": 6, "line-opacity": 0.7 }
    });
    map.addLayer({
      id: "route", type: "line", source: "route",
      layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": "#c2562e", "line-width": 3.2, "line-dasharray": [2, 1.8] }
    });

    // --- POIs ---
    map.addSource("pois", { type: "geojson", data: pois });
    map.addLayer({
      id: "poi-dots", type: "circle", source: "pois",
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 7, 5, 11, 9],
        "circle-color": ["case", ["get", "is_dry_carry_start"], "#c9791b", "#1b3a2f"],
        "circle-stroke-color": "#fbf7ec",
        "circle-stroke-width": 2.5
      }
    });
    map.addLayer({
      id: "poi-labels", type: "symbol", source: "pois",
      layout: {
        "text-field": ["get", "name"],
        "text-size": 12,
        "text-offset": [0, 1.3],
        "text-anchor": "top",
        "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Regular"]
      },
      paint: { "text-color": "#20271f", "text-halo-color": "#fbf7ec", "text-halo-width": 1.6 }
    });

    var popup = new mapboxgl.Popup({ closeButton: true, maxWidth: "280px", offset: 12 });
    function showPoi(e) {
      var p = e.features[0].properties;
      var coords = e.features[0].geometry.coordinates.slice();
      var svc = decodeServices(p.services).map(function (s) {
        return "<b>" + esc(s.code) + "</b> " + esc(s.label);
      }).join(" · ");
      var dry = (p.is_dry_carry_start === true || p.is_dry_carry_start === "true")
        ? '<p class="dry">💧 <strong>Dry-carry start</strong> — fill all bottles here.</p>' : "";
      var html = '<div class="poi-pop"><h3>' + esc(p.name) + "</h3>" +
        (svc ? '<p class="svc">' + svc + "</p>" : "") +
        dry +
        (p.notes ? '<p class="notes">' + esc(p.notes) + "</p>" : "") + "</div>";
      popup.setLngLat(coords).setHTML(html).addTo(map);
    }
    map.on("click", "poi-dots", showPoi);
    map.on("click", "poi-labels", showPoi);
    ["poi-dots", "poi-labels"].forEach(function (id) {
      map.on("mouseenter", id, function () { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", id, function () { map.getCanvas().style.cursor = ""; });
    });

    // --- fit to route ---
    try {
      var b = new mapboxgl.LngLatBounds();
      featureById(route, "main").features[0].geometry.coordinates.forEach(function (c) { b.extend(c); });
      map.fitBounds(b, { padding: 50, duration: 0 });
    } catch (e) {}

    // --- legend + alternate toggles ---
    var legendList = document.getElementById("legend-list");
    Object.keys(LEGEND).forEach(function (k) {
      legendList.appendChild(el("li", null, "<b>" + esc(k) + "</b> " + esc(LEGEND[k])));
    });
    controls.hidden = false;
    bindToggle("toggle-cerritos", "alt-los_cerritos", map);
    bindToggle("toggle-shortcut", "alt-la_paz_shortcut", map);
  }

  function bindToggle(checkboxId, layerId, map) {
    var cb = document.getElementById(checkboxId);
    cb.addEventListener("change", function () {
      map.setLayoutProperty(layerId, "visibility", cb.checked ? "visible" : "none");
    });
  }

  /* ============================================================
     ITINERARY
     ============================================================ */
  function renderItinerary(data) {
    var root = document.getElementById("itinerary-root");
    root.innerHTML = "";
    var o = data.overview;

    var head = el("div", "section-head");
    head.appendChild(el("h2", null, esc(o.title)));
    head.appendChild(el("p", "lede", esc(o.subtitle)));
    root.appendChild(head);

    // print button
    var actions = el("div", "readiness-actions");
    var pbtn = el("button", "btn ghost", "🖨️ Print 1-page brief");
    pbtn.addEventListener("click", function () { printPanel("panel-itinerary"); });
    actions.appendChild(pbtn);
    root.appendChild(actions);

    // stats
    var stats = el("div", "stat-row");
    [[o.total_mi + " mi", "Distance"], [o.total_km + " km", "Distance"],
     [o.total_gain_m.toLocaleString() + " m", "Climbing"], [o.riders, "Riders"],
     ["9.5+1", "Ride / rest days"]].forEach(function (s) {
      var st = el("div", "stat");
      st.appendChild(el("span", "n", esc(s[0])));
      st.appendChild(el("span", "l", esc(s[1])));
      stats.appendChild(st);
    });
    root.appendChild(stats);

    // callouts
    root.appendChild(callout("water", "🚰",
      "<strong>Water capacity for this loop: 4–6 L per rider.</strong> " + esc(o.logistics)));
    root.appendChild(callout("tubeless", "🛞", "<strong>" + esc(o.tubeless) + "</strong>"));

    data.days.forEach(function (d) {
      root.appendChild(renderDay(d));
    });

    var src = el("p", "muted", esc(o.source_note));
    src.style.marginTop = "1.2rem";
    src.style.fontSize = ".8rem";
    root.appendChild(src);
  }

  function callout(kind, icon, html) {
    var c = el("div", "callout " + kind);
    c.appendChild(el("span", "ic", icon));
    c.appendChild(el("div", null, html));
    return c;
  }

  function renderDay(d) {
    var cls = "day" + (d.is_rest ? " is-rest" : "") + (d.is_hard ? " is-hard" : "");
    var day = el("div", cls);

    var head = el("div", "day-head");
    head.appendChild(el("span", "day-num", d.is_rest ? "Rest" : "Day " + d.day));
    head.appendChild(el("h3", "day-title", esc(d.title)));
    var tags = el("div", "day-tags");
    if (d.is_hard) tags.appendChild(el("span", "tag hard", "Hard · +1,000 m"));
    if (d.is_rest) tags.appendChild(el("span", "tag rest", "Rest day"));
    head.appendChild(tags);
    day.appendChild(head);

    if (!d.is_rest) {
      var meta = el("div", "day-meta");
      meta.innerHTML =
        "<span><b>" + d.distance_mi + " mi</b> / " + d.distance_km + " km</span>" +
        "<span><b>" + d.gain_ft.toLocaleString() + " ft</b> / " + d.gain_m.toLocaleString() + " m climb</span>" +
        "<span>" + esc(d.surface) + "</span>";
      day.appendChild(meta);
    }

    var body = el("div", "day-body");
    body.appendChild(el("p", "day-route", "<b>" + esc(d.from) + "</b> → <b>" + esc(d.to) + "</b>"));
    var ul = el("ul");
    d.highlights.forEach(function (h) { ul.appendChild(el("li", null, esc(h))); });
    body.appendChild(ul);
    body.appendChild(el("p", "day-camp", "🏕️ <b>Camp/stay:</b> " + esc(d.camp)));

    var waterCls = "day-water" + (d.dry_carry ? " dry" : "");
    body.appendChild(el("p", waterCls, (d.dry_carry ? "💧 " : "🚰 ") + esc(d.water_note)));

    if (d.shortcut) {
      body.appendChild(el("p", "day-shortcut",
        "↪ <b>Option — " + esc(d.shortcut.name) + ":</b> " + esc(d.shortcut.detail)));
    }
    day.appendChild(body);
    return day;
  }

  /* ============================================================
     GEAR
     ============================================================ */
  function renderGear(data) {
    var root = document.getElementById("gear-root");
    root.innerHTML = "";
    var m = data.meta;

    var head = el("div", "section-head");
    head.appendChild(el("h2", null, "Gear &amp; 3-rider redundancy"));
    head.appendChild(el("p", "lede",
      "Three tiers of redundancy so one rider bailing never strips the group of something critical."));
    root.appendChild(head);

    root.appendChild(callout("tubeless", "🛞", "<strong>" + esc(m.tubeless_callout) + "</strong>"));
    root.appendChild(callout("water", "🚰", "<strong>Water: 4–6 L per rider.</strong> " + esc(m.water_callout)));

    // view toggle + print
    var bar = el("div");
    bar.style.display = "flex";
    bar.style.flexWrap = "wrap";
    bar.style.justifyContent = "space-between";
    bar.style.alignItems = "center";
    bar.style.gap = ".6rem";
    var toggle = el("div", "view-toggle");
    var bMatrix = el("button", "is-active", "Matrix");
    var bList = el("button", null, "Checklist");
    toggle.appendChild(bMatrix); toggle.appendChild(bList);
    var pbtn = el("button", "btn ghost", "🖨️ Print checklist");
    pbtn.addEventListener("click", function () { printPanel("panel-gear"); });
    bar.appendChild(toggle); bar.appendChild(pbtn);
    root.appendChild(bar);

    var matrixWrap = el("div", "gear-matrix-view");
    matrixWrap.appendChild(buildMatrix(data));
    var listWrap = el("div", "gear-list-view");
    listWrap.style.display = "none";
    buildChecklist(data).forEach(function (b) { listWrap.appendChild(b); });
    root.appendChild(matrixWrap);
    root.appendChild(listWrap);

    bMatrix.addEventListener("click", function () {
      bMatrix.classList.add("is-active"); bList.classList.remove("is-active");
      matrixWrap.style.display = ""; listWrap.style.display = "none";
    });
    bList.addEventListener("click", function () {
      bList.classList.add("is-active"); bMatrix.classList.remove("is-active");
      listWrap.style.display = ""; matrixWrap.style.display = "none";
    });
  }

  function carrierCell(item, rider) {
    var has = item.carriers.indexOf(rider) !== -1;
    return '<td class="col-r">' + (has ? '<span class="chk">✓</span>' : '<span class="dash">–</span>') + "</td>";
  }

  function buildMatrix(data) {
    var scroll = el("div", "matrix-scroll");
    var t = el("table", "matrix");
    var thead = el("thead");
    thead.innerHTML = "<tr><th>Item</th><th class='col-r'>Rider A</th><th class='col-r'>Rider B</th>" +
      "<th class='col-r'>Rider C</th><th class='col-r'>Shared</th></tr>";
    t.appendChild(thead);
    var tb = el("tbody");
    data.tiers.forEach(function (tier) {
      var tr = el("tr", "tier-row");
      tr.innerHTML = "<th colspan='5'>" + esc(tier.name) + "</th>";
      tb.appendChild(tr);
      tier.items.forEach(function (it) {
        var row = el("tr");
        var pri = it.priority ? '<span class="pri-badge">Top priority</span>' : "";
        row.innerHTML =
          "<td><span class='item-name'>" + esc(it.name) + pri + "</span>" +
          "<span class='item-detail'>" + esc(it.detail) + "</span></td>" +
          carrierCell(it, "A") + carrierCell(it, "B") + carrierCell(it, "C") +
          '<td class="col-r">' + (it.shared ? '<span class="chk">✓</span>' : '<span class="dash">–</span>') + "</td>";
        tb.appendChild(row);
      });
    });
    t.appendChild(tb);
    scroll.appendChild(t);
    return scroll;
  }

  function buildChecklist(data) {
    return data.tiers.map(function (tier) {
      var block = el("div", "tier-block");
      block.appendChild(el("h3", null, esc(tier.name)));
      block.appendChild(el("p", "tier-sub", esc(tier.subtitle)));
      var ul = el("ul", "check-list");
      tier.items.forEach(function (it) {
        var li = el("li");
        var carry = it.carriers.length === 3 ? "All riders"
          : it.shared ? "Carried by " + it.carriers.join(" + ") : it.carriers.join(" + ");
        var pri = it.priority ? '<span class="pri-badge">Top priority</span>' : "";
        li.innerHTML = '<span class="check-box"></span><div>' +
          '<span class="ci-name">' + esc(it.name) + pri + "</span> " +
          '<span class="ci-carry">(' + esc(carry) + ")</span>" +
          '<span class="ci-detail">' + esc(it.detail) + "</span></div>";
        ul.appendChild(li);
      });
      block.appendChild(ul);
      return block;
    });
  }

  /* ============================================================
     READINESS  (state in URL hash)
     ============================================================ */
  var readinessData = null;

  function readHash() {
    var m = location.hash.match(/ready=([^&]*)/);
    if (!m || !m[1]) return {};
    var set = {};
    decodeURIComponent(m[1]).split(",").forEach(function (id) { if (id) set[id] = true; });
    return set;
  }
  function writeHash(set) {
    var ids = Object.keys(set).filter(function (k) { return set[k]; }).sort();
    var hash = ids.length ? "#ready=" + ids.join(",") : "#ready=";
    history.replaceState(null, "", location.pathname + location.search + hash);
  }

  function renderReadiness(data) {
    readinessData = data;
    var root = document.getElementById("readiness-root");
    root.innerHTML = "";
    var meta = data.meta;
    var checked = readHash();

    var head = el("div", "section-head");
    head.appendChild(el("h2", null, esc(meta.title)));
    head.appendChild(el("p", "lede", esc(meta.persistence_note)));
    root.appendChild(head);

    // actions
    var actions = el("div", "readiness-actions");
    var copyBtn = el("button", "btn", "🔗 Copy shareable link");
    var note = el("span", "copied-note");
    note.style.display = "none";
    copyBtn.addEventListener("click", function () {
      var url = location.href;
      function ok() { note.textContent = "Link copied — paste it to share progress."; note.style.display = ""; setTimeout(function () { note.style.display = "none"; }, 4000); }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(ok, function () { window.prompt("Copy this link:", url); });
      } else { window.prompt("Copy this link:", url); }
    });
    var resetBtn = el("button", "btn ghost", "Reset");
    resetBtn.addEventListener("click", function () {
      writeHash({});
      renderReadiness(readinessData);
    });
    var printBtn = el("button", "btn ghost", "🖨️ Print");
    printBtn.addEventListener("click", function () { printPanel("panel-readiness"); });
    actions.appendChild(copyBtn); actions.appendChild(resetBtn); actions.appendChild(printBtn); actions.appendChild(note);
    root.appendChild(actions);

    // progress
    var total = 0, done = 0;
    data.phases.forEach(function (p) { p.items.forEach(function (i) { total++; if (checked[i.id]) done++; }); });
    var pw = el("div", "progress-wrap");
    var bar = el("div", "progress-bar");
    var span = el("span");
    span.style.width = total ? Math.round((done / total) * 100) + "%" : "0";
    bar.appendChild(span);
    pw.appendChild(bar);
    pw.appendChild(el("p", "progress-label", done + " of " + total + " done · " + esc(meta.trip_month) + " trip"));
    root.appendChild(pw);

    data.phases.forEach(function (phase) {
      var pe = el("div", "phase");
      var ph = el("div", "phase-head");
      ph.appendChild(el("h3", null, esc(phase.name)));
      ph.appendChild(el("p", "phase-sub", esc(phase.subtitle)));
      pe.appendChild(ph);
      var ul = el("ul");
      phase.items.forEach(function (item) {
        var li = el("li");
        var label = el("label");
        var cb = el("input");
        cb.type = "checkbox";
        cb.checked = !!checked[item.id];
        var txt = el("span", checked[item.id] ? "done" : null, esc(item.label));
        cb.addEventListener("change", function () {
          var set = readHash();
          if (cb.checked) set[item.id] = true; else delete set[item.id];
          writeHash(set);
          txt.className = cb.checked ? "done" : "";
          updateProgress();
        });
        label.appendChild(cb);
        label.appendChild(txt);
        li.appendChild(label);
        ul.appendChild(li);
      });
      pe.appendChild(ul);
      root.appendChild(pe);
    });

    function updateProgress() {
      var c = readHash(), d = 0;
      data.phases.forEach(function (p) { p.items.forEach(function (i) { if (c[i.id]) d++; }); });
      span.style.width = total ? Math.round((d / total) * 100) + "%" : "0";
      pw.querySelector(".progress-label").textContent = d + " of " + total + " done · " + meta.trip_month + " trip";
    }
  }

  /* ============================================================
     PRINT
     ============================================================ */
  function printPanel(panelId) {
    var p = document.getElementById(panelId);
    p.classList.add("print-show");
    function cleanup() {
      p.classList.remove("print-show");
      window.removeEventListener("afterprint", cleanup);
    }
    window.addEventListener("afterprint", cleanup);
    window.print();
  }

  /* ============================================================
     BOOT
     ============================================================ */
  function boot() {
    getJSON("itinerary.json").then(renderItinerary).catch(showError("itinerary-root"));
    getJSON("gear.json").then(renderGear).catch(showError("gear-root"));
    getJSON("readiness.json").then(renderReadiness).catch(showError("readiness-root"));
    // Open the tab named in the hash (#tab=gear), else default to map.
    var tm = location.hash.match(/tab=(\w+)/);
    if (tm && panels[tm[1]]) showTab(tm[1]);
    else showTab("map");
  }
  function showError(id) {
    return function (err) {
      document.getElementById(id).innerHTML =
        '<p class="muted">Could not load this section: ' + esc(err.message) + "</p>";
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else { boot(); }
})();

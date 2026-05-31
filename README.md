# Baja Cape Loop — Trip Planning Site

A static, shareable planning HQ for **3 riders** taking on the **Baja Cape Loop**
(~284 mi / 457 km, ~6,175 m climbing, clockwise) in **January**. It is the shared
source of truth for the next ~7 months of planning.

Four tabs:

1. **Map** — interactive Mapbox GL map with the loop as a **dashed line**,
   clickable resupply/POI markers (services + dry-carry warnings), and two
   toggleable alternates (Los Cerritos detour, La Paz shortcut).
2. **Itinerary** — day-by-day (9.5 riding days + 1 rest day), with per-day
   distance, climbing, highlights, camp, **water-carry flags**, and shortcut options.
3. **Gear** — a 3-rider redundancy **matrix** (Rider A / B / C / Shared) *and* a
   printable **checklist** grouped by tier.
4. **Readiness** — a 4-phase tracker (now → January). Checkbox state lives in the
   **URL**, so it survives a copy/paste — no accounts, no storage.

## Constraints baked in

- **Static only** — plain HTML/CSS/JS, no build step, no server, no database.
- **No browser storage** — no `localStorage` / `sessionStorage` / `IndexedDB`
  anywhere. Readiness state is encoded in the URL hash (`#ready=…`).
- **Offline-friendly** — all route/POI/itinerary/gear/readiness data is baked
  into static files under `public/data/`. Map tiles are the *only* runtime
  network dependency; if Mapbox is unavailable the other three tabs work fully.
- **Printable** — `@media print` gives a clean gear checklist and a 1-page
  itinerary brief (print buttons on those tabs).
- **Tubeless is mandatory** (cactus spines) and **water capacity for this loop is
  4–6 L per rider** — both surfaced prominently.

## Mapbox token setup

The map needs a **public** Mapbox GL token (starts with `pk.`). Public tokens are
safe to ship in a static site, but you must supply your own:

1. Get a free token at <https://account.mapbox.com/>.
2. Open **`js/config.js`** and replace the placeholder:

   ```js
   window.MAPBOX_TOKEN = "pk.eyJ1Ijoi...your-token...";
   ```

No token? The site still loads — the Map tab shows a friendly fallback and the
Itinerary / Gear / Readiness tabs are fully functional.

## Run locally

It's a static site, so any static server works:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

(Open via a server, not `file://`, so the `fetch()` calls for `public/data/*`
resolve.)

## Deploy to Cloudflare Pages

### Option A — Wrangler CLI (recommended)

A `wrangler.toml` is included (`pages_build_output_dir = "."`, no build command),
and `.assetsignore` keeps the upload to just the site (no repo tooling/docs):

```bash
wrangler pages deploy          # deploys the repo root
wrangler pages dev             # local preview
```

First run will prompt you to create/select the Pages project (the subdomain
comes from `name` in `wrangler.toml` — rename it if you like).

### Option B — Dashboard / Git integration

1. Push this repo to GitHub (or connect it directly).
2. In Cloudflare Pages → **Create project** → connect the repo.
3. Build settings:
   - **Framework preset:** `None`
   - **Build command:** *(leave empty — there is no build)*
   - **Build output directory:** `/` (the repo root)

Either way, asset paths are root-relative (`./css`, `./js`, `./public/data`), so
they resolve correctly on Pages.

After the first deploy, set your Mapbox token by editing `js/config.js` and
pushing — or, if you prefer not to commit a token, leave the placeholder and the
map fallback will show.

## Project layout

```
index.html              App shell + tab nav
css/styles.css          Field-guide styles + print stylesheet
js/config.js            MAPBOX_TOKEN placeholder (edit this)
js/app.js               Tabs, Mapbox, itinerary/gear/readiness, hash state, print
public/data/
  route.geojson         Main loop + 2 alternates (dashed lines)
  pois.geojson          15 resupply points (services + dry-carry flags)
  itinerary.json        Day-by-day + overview
  gear.json             3-tier redundancy model
  readiness.json        4-phase checklist
  data-provenance.md    Exact track source + clipping/sampling notes
tools/build_geojson.py  Regenerates the GeoJSON from the baked RWGPS data
```

## Regenerating the route/POI data

```bash
python3 tools/build_geojson.py
```

See `public/data/data-provenance.md` for exactly which track source was used.
**Before the trip, re-download the current full GPX from RideWithGPS** — the
route has live reroutes (this is Phase 3 in the readiness tracker).

# Data provenance

All trip data is **baked into static files** — the site makes **no API calls at
page load** except Mapbox tile requests. If Mapbox is unavailable, every other
tab still works.

## Route track — `route.geojson`

**Source used:** the authoritative RideWithGPS collection
[**BAJA CAPE LOOP 2024** (ID 2980271)](https://ridewithgps.com/collections/2980271?privacy_code=48jEWwKTAB8lBsMs4Ajst1R71mnq636d),
pulled via the RideWithGPS API.

| Feature | RWGPS route | Full track pts | Points baked in |
|---|---|---|---|
| Main loop (`main`) | [48551884](https://ridewithgps.com/routes/48551884) | 10,576 | 102 (API-sampled) |
| Los Cerritos detour (`los_cerritos`) | 48552686 | 626 | 106 (API-sampled) |
| La Paz → San Juan shortcut (`la_paz_shortcut`) | 48552716 | 647 | 109 (API-sampled) |

**Sampling note / fallback:** the RWGPS API returns a downsampled track
(~100 points per route), which is what is baked in here. This is intentionally
coarse — it renders a clean overview line for a *planning* map, not a
turn-by-turn navigation track. The full-resolution GPX was **not** fetchable in
this environment (direct host requests to `ridewithgps.com` and
`bikepacking.com` were blocked by the network policy), so the
bikepacking.com Baja Divide GPX fallback described in the brief was **not
needed and not used** — the RWGPS collection (the route's own source) was
available directly and is the better authority for *this* loop. **Before riding,
re-download the current full GPX from RWGPS** (the route has live reroutes — see
Phase 3 of the readiness tracker).

The main-loop line is rendered as a **dashed line** (`line-dasharray`) per the
brief; the two alternates are separate, toggleable dashed features.

## Resupply points — `pois.geojson`

The 15 resupply/POI anchors are the **real georeferenced POIs** linked to RWGPS
route 48551884 (not hand-geocoded). Each has:

- `name`, `services` (legend codes), `is_dry_carry_start` (bool), `notes`.

Service legend: **F** large food · **f** limited food · **W** water · **M** motel
· **C** camping · **R** restaurant · **B** bike shop · **$** ATM · Bus · Airport.

The four dry-carry stretches from the Resupply Sheet are encoded as
`is_dry_carry_start: true` on their starting town (Todos Santos, La Paz,
La Ribera, Cabo Pulmo) and surfaced in both the map popups and the per-day
itinerary water notes.

## Source hierarchy (kept in lanes)

| Domain | Authority |
|---|---|
| Distances, resupply, water-carry gaps, POI anchors | **Resupply Sheet** |
| Daily structure, rest day, shortcuts, direction | **Sarah Swallow's 11-day itinerary** |
| Gear, tubeless requirement, conditions | **bikepacking.com Baja Divide guide** |

**Water capacity for this loop is 4–6 L per rider.** The large remote-desert
water figures from the full Baja Divide guide apply to sections that are **not on
the Cape Loop** (the loop's longest dry carry is ~34 mi / 54 km, Todos Santos →
El Rosario) and are deliberately **not** used here.

## Data hygiene

- The Resupply Sheet's known La Ribera typo (`365,8`, comma decimal) is treated
  as `365.8` on ingest.
- `tools/build_geojson.py` asserts every coordinate parses as a float before
  writing the GeoJSON.

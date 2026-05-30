#!/usr/bin/env python3
"""
Builds public/data/route.geojson and public/data/pois.geojson for the
Baja Cape Loop planning site.

Track + POI coordinates were pulled from the authoritative RideWithGPS
collection 2980271 ("BAJA CAPE LOOP 2024") via the RWGPS API:
  - Main loop ....... route 48551884 (10,576 pts; API returned 102 sampled)
  - Los Cerritos .... route 48552686 (626 pts; API returned 106 sampled)
  - La Paz shortcut . route 48552716 (647 pts; API returned 109 sampled)

Resupply/POI coordinates are the real georeferenced anchors from the same
route's linked POIs. See data-provenance.md.

This script bakes everything into static GeoJSON — no API is called at page load.
"""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "public", "data")

# --- Track coordinate strings: "lat,lng;lat,lng;..." (sampled from RWGPS) ---

MAIN_LOOP = "23.17727,-109.70109;23.18247,-109.74568;23.22917,-109.78583;23.21688,-109.82823;23.21821,-109.84909;23.22208,-109.86628;23.23012,-109.89109;23.23633,-109.91688;23.24307,-109.93976;23.23785,-109.96178;23.24612,-109.96863;23.24200,-109.98456;23.24854,-110.01121;23.25902,-110.04599;23.27576,-110.07398;23.29385,-110.07890;23.31706,-110.06569;23.32739,-110.08311;23.38019,-110.09134;23.41206,-110.12623;23.43044,-110.17484;23.42681,-110.21319;23.48962,-110.20520;23.50863,-110.17516;23.54238,-110.14213;23.56949,-110.12228;23.60173,-110.10582;23.63756,-110.11333;23.65670,-110.09936;23.68671,-110.09592;23.70033,-110.12499;23.74257,-110.11109;23.77842,-110.12792;23.83107,-110.18225;23.86080,-110.17197;23.88716,-110.15187;23.89646,-110.14664;23.90253,-110.15274;23.91220,-110.15287;23.92434,-110.15175;23.93580,-110.15695;23.95294,-110.15894;23.96989,-110.15567;23.97940,-110.15212;23.98729,-110.15238;23.99799,-110.14976;24.00336,-110.15779;24.01493,-110.14901;24.01684,-110.13605;24.02545,-110.11987;24.04473,-110.14468;24.06467,-110.17944;24.09746,-110.26073;24.11759,-110.29359;24.13387,-110.30090;24.13887,-110.30682;24.09605,-110.25695;24.05956,-110.17146;24.02381,-110.12707;24.00412,-110.15698;23.98334,-110.15223;23.95230,-110.15900;23.91706,-110.15197;23.89403,-110.14511;23.89396,-110.11122;23.90935,-110.08754;23.91357,-110.06000;23.92976,-110.01376;23.98080,-109.98853;23.95351,-109.89152;23.94115,-109.84322;23.93090,-109.83740;23.91286,-109.82778;23.87653,-109.78276;23.82661,-109.73234;23.79046,-109.70386;23.75864,-109.71169;23.71828,-109.70856;23.66403,-109.69950;23.62900,-109.66660;23.61959,-109.63010;23.59111,-109.57087;23.57039,-109.51841;23.53864,-109.51479;23.50887,-109.47719;23.47486,-109.45524;23.43999,-109.42838;23.38947,-109.42864;23.35303,-109.44776;23.35614,-109.47715;23.33536,-109.49021;23.32697,-109.50296;23.31998,-109.51958;23.32222,-109.54456;23.32274,-109.56654;23.30430,-109.56345;23.28225,-109.56583;23.25409,-109.57355;23.22240,-109.58212;23.21252,-109.61386;23.17761,-109.65635;23.17746,-109.70032"

LOS_CERRITOS = "23.39511,-110.09942;23.39393,-110.09994;23.39332,-110.10098;23.39327,-110.10272;23.39263,-110.10387;23.39210,-110.10536;23.39267,-110.10635;23.39221,-110.10850;23.39122,-110.10946;23.38889,-110.11064;23.38791,-110.11126;23.38736,-110.11199;23.38655,-110.11255;23.38607,-110.11372;23.38482,-110.11750;23.38353,-110.11782;23.38124,-110.12083;23.37929,-110.12338;23.37850,-110.12472;23.37777,-110.12717;23.37720,-110.12982;23.37627,-110.13242;23.37515,-110.13505;23.37510,-110.13704;23.37311,-110.13952;23.37149,-110.14170;23.37144,-110.14283;23.37012,-110.14412;23.36796,-110.14604;23.36650,-110.14686;23.36572,-110.14812;23.36485,-110.15121;23.36228,-110.15043;23.35862,-110.14871;23.35771,-110.14870;23.35744,-110.14940;23.35677,-110.15106;23.35451,-110.15138;23.35432,-110.15409;23.35381,-110.15558;23.35396,-110.15658;23.35408,-110.15847;23.35394,-110.16048;23.35233,-110.16153;23.35099,-110.16225;23.34739,-110.16288;23.34495,-110.16773;23.34277,-110.17205;23.34210,-110.17331;23.33884,-110.17453;23.33485,-110.17595;23.33267,-110.17675;23.33008,-110.17713;23.33362,-110.17636;23.33735,-110.17505;23.34139,-110.17358;23.34273,-110.17214;23.34495,-110.16773;23.34749,-110.16272;23.34886,-110.16189;23.35150,-110.16244;23.35281,-110.16076;23.35393,-110.16040;23.35408,-110.15831;23.35399,-110.15646;23.35381,-110.15558;23.35429,-110.15426;23.35454,-110.15160;23.35540,-110.15147;23.35740,-110.14956;23.35769,-110.14877;23.35797,-110.14837;23.36165,-110.15014;23.36479,-110.15147;23.36553,-110.14850;23.36631,-110.14691;23.36756,-110.14632;23.36988,-110.14439;23.37137,-110.14293;23.37151,-110.14200;23.37260,-110.14014;23.37492,-110.13731;23.37520,-110.13599;23.37572,-110.13367;23.37705,-110.13039;23.37759,-110.12805;23.37807,-110.12530;23.37896,-110.12364;23.38033,-110.12209;23.38282,-110.11862;23.38463,-110.11766;23.38585,-110.11458;23.38653,-110.11314;23.38687,-110.11219;23.38771,-110.11180;23.38819,-110.11084;23.39043,-110.11031;23.39217,-110.10871;23.39258,-110.10675;23.39248,-110.10582;23.39228,-110.10438;23.39318,-110.10350;23.39337,-110.10187;23.39344,-110.10030;23.39479,-110.09940;23.39490,-110.09936"

LA_PAZ_SHORTCUT = "24.15956,-110.31512;24.15853,-110.31300;24.15616,-110.31346;24.15374,-110.30992;24.15122,-110.30615;24.14874,-110.30255;24.14667,-110.30056;24.14380,-110.30281;24.14091,-110.30516;24.13815,-110.30734;24.13472,-110.30233;24.13200,-110.29839;24.13018,-110.29774;24.12803,-110.30080;24.12415,-110.30407;24.12226,-110.30375;24.12139,-110.29908;24.12149,-110.29593;24.12080,-110.29458;24.11889,-110.29375;24.11581,-110.29344;24.11159,-110.29288;24.10988,-110.29180;24.10830,-110.28918;24.10671,-110.28502;24.10517,-110.28098;24.10374,-110.27722;24.10217,-110.27311;24.10024,-110.26805;24.09832,-110.26301;24.09640,-110.25800;24.09469,-110.25358;24.09263,-110.24814;24.09061,-110.24285;24.08861,-110.23764;24.08661,-110.23242;24.08462,-110.22719;24.08262,-110.22196;24.08062,-110.21669;24.07862,-110.21143;24.07662,-110.20616;24.07475,-110.20123;24.07271,-110.19590;24.07066,-110.19058;24.06928,-110.18734;24.06796,-110.18547;24.06592,-110.18158;24.06394,-110.17799;24.06135,-110.17411;24.05899,-110.17058;24.05737,-110.16691;24.05534,-110.16207;24.05350,-110.15775;24.05191,-110.15459;24.04995,-110.15160;24.04761,-110.14876;24.04585,-110.14619;24.04386,-110.14310;24.04162,-110.13869;24.03971,-110.13497;24.03747,-110.13051;24.03596,-110.12783;24.03277,-110.12487;24.02913,-110.12138;24.02614,-110.11769;24.02362,-110.11449;24.02130,-110.11151;24.02042,-110.10892;24.02147,-110.10757;24.02151,-110.10677;24.02038,-110.10483;24.01881,-110.10197;24.01809,-110.09805;24.01729,-110.09428;24.01763,-110.09233;24.01917,-110.09075;24.01990,-110.08903;24.01914,-110.08740;24.01733,-110.08422;24.01531,-110.07895;24.01328,-110.07367;24.01126,-110.06840;24.00945,-110.06376;24.00742,-110.05852;24.00540,-110.05327;24.00337,-110.04803;24.00136,-110.04285;23.99933,-110.03769;23.99725,-110.03231;23.99517,-110.02693;23.99308,-110.02154;23.99100,-110.01616;23.98891,-110.01077;23.98683,-110.00539;23.98474,-110.00003;23.98265,-109.99471;23.98155,-109.99135;23.98014,-109.98577;23.97873,-109.98019;23.97734,-109.97475;23.97602,-109.96947;23.97467,-109.96422;23.97332,-109.95911;23.97199,-109.95395;23.97084,-109.94953;23.96945,-109.94389;23.96817,-109.93865;23.96753,-109.93612;23.96687,-109.93398"


def to_coords(track):
    """'lat,lng;lat,lng' -> [[lng,lat], ...] (GeoJSON order)."""
    pts = []
    for pair in track.split(";"):
        lat, lng = pair.split(",")
        pts.append([round(float(lng), 5), round(float(lat), 5)])
    return pts


def line_feature(track, props):
    return {
        "type": "Feature",
        "properties": props,
        "geometry": {"type": "LineString", "coordinates": to_coords(track)},
    }


# --- Resupply POIs -----------------------------------------------------------
# (name, lng, lat, services, is_dry_carry_start, notes)
# Order = clockwise travel order. Coordinates are real RWGPS POI anchors.
# Legend: F large food | f limited food | W water | M motel | C camping
#         R restaurant | B bike shop | $ ATM | Bus | Airport
POIS = [
    ("San José del Cabo", -109.708138, 23.157187, "FWMCRB$ Bus Airport", False,
     "Trip start (drop-off). Full resupply, ATMs, small bike shop in town + high-end Specialized dealer at the south end. Airport ~1 mi off route."),
    ("Turn for Los Cerritos", -110.099361, 23.394322, "—", False,
     "Junction for the optional 16 mi round-trip detour to Playa Los Cerritos (best surf beach on the cape; beach camping)."),
    ("Todos Santos", -110.224825, 23.447927, "FWMCR$ Bus", True,
     "DRY-CARRY START → El Rosario (33.7 mi / 54 km, the loop's longest dry stretch — no reliable water on the climb). Full resupply, snowbird town; good place to top off everything."),
    ("El Rosario", -110.111923, 23.743117, "fW", False,
     "Limited food + water, a few miles before the pavement. First reliable water after the long Todos Santos climb."),
    ("Turn to El Triunfo", -110.108719, 23.803542, "fWR", False,
     "El Triunfo is 1.5 mi east of the route — restored mining town, several small stores and two sit-down eateries. Important resupply."),
    ("Los Divisaderos", -110.141867, 23.892376, "fW", False,
     "Limited food + water on the scenic dirt road before the long descent into La Paz."),
    ("La Paz", -110.318773, 24.160276, "FWMCRB$ Bus Airport", True,
     "DRY-CARRY START → Los Divisaderos (30.3 mi / 49 km, climbing out of La Paz). Rest-day hub — whale shark tours, full resupply, ATMs, bike shop, capital of BCS."),
    ("San Juan de los Planes", -109.936038, 23.967308, "FWR", False,
     "Food, water, restaurant. Last good resupply before the rocky coastal road to the East Cape."),
    ("El Cardonal", -109.750058, 23.845672, "fWMCR", False,
     "Limited food, water, motel, camping, restaurant along the scenic Sea of Cortez coast road."),
    ("Punta Pescadero", -109.702229, 23.797527, "M", False,
     "Motel only — no reliable food resupply."),
    ("Los Barriles", -109.703827, 23.679174, "FWMCRB$ Bus", False,
     "Largest East Cape resupply: full grocery (turn up the main street for the supermarket), ATM, bike shop. Load up here AND La Ribera before Cabo Pulmo."),
    ("La Ribera", -109.584194, 23.59757, "FWMR", True,
     "DRY-CARRY START → Cabo Pulmo (20.1 mi / 32 km). Cabo Pulmo is limited — load PAST it here. Food, water, motel, restaurant."),
    ("Cabo Pulmo", -109.429609, 23.437482, "fWMR limited", True,
     "DRY-CARRY START → Palo Escopeta (26.2 mi / 42 km, big climb day, only a tiny stop at the end). No grocery — just two restaurants. World-class snorkeling + favorite singletrack."),
    ("Turn to Playa El Arbolitos", -109.437959, 23.402798, "CR", False,
     "Junction for Playa Los Arbolitos — beach camping, showers, scenic snorkeling coves, occasional fish tacos & water."),
    ("Palo Escopeta", -109.582628, 23.220597, "fW", False,
     "Tiny store, limited hours. Last stop before the descent back to San José del Cabo (~10 mi further)."),
]


def poi_features():
    feats = []
    for name, lng, lat, services, dry, notes in POIS:
        feats.append({
            "type": "Feature",
            "properties": {
                "name": name,
                "services": services,
                "is_dry_carry_start": dry,
                "notes": notes,
            },
            "geometry": {"type": "Point", "coordinates": [round(lng, 6), round(lat, 6)]},
        })
    return feats


def main():
    os.makedirs(OUT, exist_ok=True)

    route = {
        "type": "FeatureCollection",
        "features": [
            line_feature(MAIN_LOOP, {
                "id": "main",
                "name": "Baja Cape Loop",
                "kind": "primary",
                "distance_mi": 284,
                "distance_km": 457,
                "climbing_m": 6175,
                "riding_days": 9.5,
                "source": "RWGPS route 48551884 (sampled)",
            }),
            line_feature(LOS_CERRITOS, {
                "id": "los_cerritos",
                "name": "Playa Los Cerritos detour",
                "kind": "alternate",
                "distance_mi": 16.1,
                "distance_km": 25.9,
                "source": "RWGPS route 48552686 (sampled)",
                "note": "Optional out-and-back to the best surf beach on the cape.",
            }),
            line_feature(LA_PAZ_SHORTCUT, {
                "id": "la_paz_shortcut",
                "name": "La Paz → San Juan de los Planes shortcut",
                "kind": "alternate",
                "distance_mi": 30.5,
                "distance_km": 49.1,
                "source": "RWGPS route 48552716 (sampled)",
                "note": "Paved shortcut that skips the Los Divisaderos dirt climb.",
            }),
        ],
    }

    pois = {"type": "FeatureCollection", "features": poi_features()}

    # Validate every numeric coordinate parses as a float (data-hygiene gate).
    for f in route["features"]:
        for lng, lat in f["geometry"]["coordinates"]:
            assert isinstance(lng, float) and isinstance(lat, float)
    for f in pois["features"]:
        lng, lat = f["geometry"]["coordinates"]
        assert isinstance(lng, float) and isinstance(lat, float)

    with open(os.path.join(OUT, "route.geojson"), "w") as fh:
        json.dump(route, fh, separators=(",", ":"))
    with open(os.path.join(OUT, "pois.geojson"), "w") as fh:
        json.dump(pois, fh, indent=1)

    n = len(route["features"][0]["geometry"]["coordinates"])
    print(f"route.geojson: {len(route['features'])} features, main loop {n} pts")
    print(f"pois.geojson:  {len(pois['features'])} resupply points")


if __name__ == "__main__":
    main()

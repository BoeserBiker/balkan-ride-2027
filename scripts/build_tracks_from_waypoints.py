#!/usr/bin/env python3
"""Erzeuge tägliche OSRM-PKW-Vorab-Tracks aus dem V7-GPX.

Aufruf vom Repository: python3 scripts/build_tracks_from_waypoints.py
Die erzeugten Linien sind weder abgefahrene GPS-Tracks noch eine Freigabe für
Motorrad oder Gespann. Vor der Fahrt Straßenführung und Sperren prüfen.
"""

import argparse
import copy
import json
import re
import sys
import time
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GPX_DIR = ROOT / "assets" / "gpx"
SOURCE = GPX_DIR / "Balkan_Tour_2027.gpx"
NS = "http://www.topografix.com/GPX/1/1"
OSRM = "https://router.project-osrm.org/route/v1/driving/"
TRACK_TOLERANCE = 0.0002
MAX_TRACK_POINTS = 300
ET.register_namespace("", NS)


def tag(name):
    return f"{{{NS}}}{name}"


def load_days(source):
    """Lies Hauptstrecken und nur deren PKW-/Motorrad-Wegpunkte ein."""
    root = ET.parse(source).getroot()
    routes = {}
    waypoints = {day: [] for day in range(1, 23)}
    for point in root.findall(tag("wpt")):
        description = point.findtext(tag("desc"), "")
        match = re.fullmatch(
            r"V7 / D(\d{2})[a-z]* / (PKW|MOTORRAD|ALT|OPTION|FAEHRE) / .+",
            description,
        )
        if not match or int(match.group(1)) not in waypoints:
            raise ValueError(f"Unbekannter V7-Wegpunkt: {description}")
        if match.group(2) in {"PKW", "MOTORRAD"}:
            waypoints[int(match.group(1))].append(point)
    for route in root.findall(tag("rte")):
        name = route.findtext(tag("name"), "")
        match = re.fullmatch(r"V7 D(\d{2}) (PKW|MOTORRAD)", name)
        if not match:
            continue
        day = int(match.group(1))
        if day in routes:
            raise ValueError(f"D{day:02d}: doppelte Hauptroute")
        routes[day] = route.findall(tag("rtept"))
    expected = set(range(1, 23)) - {19}
    if set(routes) != expected or any(len(points) < 2 for points in routes.values()):
        raise ValueError("V7-GPX benötigt genau 21 Hauptrouten mit mindestens zwei Punkten.")
    if waypoints[19]:
        raise ValueError("D19 darf keine Straßen-Wegpunkte enthalten.")
    return routes, waypoints


def route_coordinates(day, points):
    """Extrahiere lon,lat in der unveränderten V7-Routenfolge."""
    coordinates = [(point.get("lon"), point.get("lat")) for point in points]
    if any(lon is None or lat is None for lon, lat in coordinates):
        raise ValueError(f"D{day:02d}: Wegpunkt ohne Koordinaten")
    return coordinates


def fetch_route(day, coordinates):
    """Fordere vollständige GeoJSON-Geometrie an und prüfe auf Fährsegmente."""
    coordinate_string = ";".join(f"{lon},{lat}" for lon, lat in coordinates)
    url = f"{OSRM}{coordinate_string}?overview=full&geometries=geojson&steps=true"
    request = urllib.request.Request(url, headers={"User-Agent": "Balkan-Ride-2027/1.0"})
    with urllib.request.urlopen(request, timeout=90) as response:
        payload = json.load(response)
    if payload.get("code") != "Ok" or not payload.get("routes"):
        raise ValueError(f"D{day:02d}: OSRM meldet {payload.get('code')}: {payload.get('message', '')}")
    route = payload["routes"][0]
    if any(step.get("mode") == "ferry" for leg in route["legs"] for step in leg["steps"]):
        raise ValueError(f"D{day:02d}: OSRM-Route enthält eine Fähre und ist kein reiner Straßen-Track")
    geometry = route["geometry"]
    if geometry.get("type") != "LineString" or len(geometry.get("coordinates", [])) < 2:
        raise ValueError(f"D{day:02d}: OSRM lieferte keine gültige Liniengeometrie")
    if len(payload.get("waypoints", [])) != len(coordinates):
        raise ValueError(f"D{day:02d}: OSRM-Wegpunktanzahl stimmt nicht")
    for waypoint in payload["waypoints"]:
        if waypoint["distance"] > 2000:
            raise ValueError(f"D{day:02d}: Wegpunkt liegt {waypoint['distance']:.0f} m von der Straße entfernt")
    return geometry["coordinates"], route["distance"]


def douglas_peucker(points, tolerance):
    """Vereinfache [lon, lat]-Punkte iterativ nach Douglas-Peucker."""
    if len(points) <= 2:
        return list(points)

    tolerance_squared = tolerance * tolerance
    keep = {0, len(points) - 1}
    pending = [(0, len(points) - 1)]
    while pending:
        start, end = pending.pop()
        start_lon, start_lat = points[start]
        end_lon, end_lat = points[end]
        delta_lon = end_lon - start_lon
        delta_lat = end_lat - start_lat
        segment_length_squared = delta_lon * delta_lon + delta_lat * delta_lat
        farthest_index = None
        farthest_distance_squared = tolerance_squared

        for index in range(start + 1, end):
            lon, lat = points[index]
            if segment_length_squared:
                projection = (
                    (lon - start_lon) * delta_lon + (lat - start_lat) * delta_lat
                ) / segment_length_squared
                projection = min(1.0, max(0.0, projection))
                closest_lon = start_lon + projection * delta_lon
                closest_lat = start_lat + projection * delta_lat
            else:
                closest_lon, closest_lat = start_lon, start_lat
            distance_squared = (lon - closest_lon) ** 2 + (lat - closest_lat) ** 2
            if distance_squared > farthest_distance_squared:
                farthest_index = index
                farthest_distance_squared = distance_squared

        if farthest_index is not None:
            keep.add(farthest_index)
            pending.append((start, farthest_index))
            pending.append((farthest_index, end))

    return [point for index, point in enumerate(points) if index in keep]


def simplify_track(points, tolerance=TRACK_TOLERANCE, max_points=MAX_TRACK_POINTS):
    """Vereinfache einen Track und halte die maximale Navi-Punktzahl ein."""
    if tolerance <= 0 or max_points < 2:
        raise ValueError("Toleranz muss positiv und max_points mindestens 2 sein.")
    if max_points > MAX_TRACK_POINTS:
        raise ValueError(f"max_points darf {MAX_TRACK_POINTS} nicht überschreiten.")
    if len(points) <= max_points:
        return list(points)

    simplified = douglas_peucker(points, tolerance)
    if len(simplified) <= max_points:
        return simplified

    low_tolerance = tolerance
    high_tolerance = tolerance
    while len(douglas_peucker(points, high_tolerance)) > max_points:
        high_tolerance *= 2

    for _ in range(24):
        middle_tolerance = (low_tolerance + high_tolerance) / 2
        if len(douglas_peucker(points, middle_tolerance)) > max_points:
            low_tolerance = middle_tolerance
        else:
            high_tolerance = middle_tolerance
    return douglas_peucker(points, high_tolerance)


def build_gpx(day, waypoints, geometry, max_track_points=MAX_TRACK_POINTS):
    """Erhalte Hauptwegpunkte und kompakte Tracks; ElementTree escaped XML."""
    root = ET.Element(tag("gpx"), {"version": "1.1", "creator": "Balkan-Ride-2027"})
    metadata = ET.SubElement(root, tag("metadata"))
    ET.SubElement(metadata, tag("name")).text = f"Balkan Tour 2027 V7 – D{day:02d}"
    ET.SubElement(metadata, tag("desc")).text = (
        "Berechneter OSRM-PKW-Vorab-Track auf Basis der V7-Wegpunkte; "
        "kein vor Ort abgefahrener GPS-Track. Straßenführung und Freigaben prüfen."
        if day != 19 else
        "D19: Adria-Seetag ohne Straßen-Track und ohne berechnete Fährlinie."
    )
    for waypoint in waypoints:
        root.append(copy.deepcopy(waypoint))
    if geometry is not None:
        track = ET.SubElement(root, tag("trk"))
        ET.SubElement(track, tag("name")).text = f"D{day:02d} OSRM-Vorab-Track"
        segment = ET.SubElement(track, tag("trkseg"))
        for lon, lat in simplify_track(geometry, max_points=max_track_points):
            ET.SubElement(segment, tag("trkpt"), {"lat": str(lat), "lon": str(lon)})
    ET.indent(root, space="  ")
    return ET.ElementTree(root)


def parse_args(argv=None):
    parser = argparse.ArgumentParser(
        description="Erzeuge kompakte Tages-GPX-Tracks aus der V7-Hauptroute."
    )
    parser.add_argument(
        "--max-track-points",
        type=int,
        default=MAX_TRACK_POINTS,
        metavar="ANZAHL",
        help=(
            f"Maximale Trackpunkte je Tagessegment (2 bis {MAX_TRACK_POINTS}, "
            f"Standard: {MAX_TRACK_POINTS})."
        ),
    )
    args = parser.parse_args(argv)
    if args.max_track_points < 2:
        parser.error("--max-track-points muss mindestens 2 sein.")
    if args.max_track_points > MAX_TRACK_POINTS:
        parser.error(f"--max-track-points darf {MAX_TRACK_POINTS} nicht überschreiten.")
    return args


def main(argv=None):
    args = parse_args(argv)
    routes, waypoints = load_days(SOURCE)
    generated = {}
    first_request = True
    for day in range(1, 23):
        geometry = None
        if day != 19:
            if not first_request:
                time.sleep(1.1)
            first_request = False
            geometry, distance = fetch_route(day, route_coordinates(day, routes[day]))
            tree = build_gpx(
                day,
                waypoints[day],
                geometry,
                max_track_points=args.max_track_points,
            )
            point_count = len(tree.getroot().findall(f".//{tag('trkpt')}"))
            print(
                f"D{day:02d}: {distance / 1000:.1f} km, "
                f"{len(geometry)} -> {point_count} Trackpunkte",
                flush=True,
            )
        else:
            print("D19: Seetag, kein Straßen-Track", flush=True)
            tree = build_gpx(
                day,
                waypoints[day],
                geometry,
                max_track_points=args.max_track_points,
            )
        generated[day] = tree
    for day, tree in generated.items():
        target = GPX_DIR / f"tag-{day:02d}.gpx"
        tree.write(target, encoding="utf-8", xml_declaration=True)
    print("Alle 22 Tages-GPX-Dateien geschrieben.")


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, KeyError, ET.ParseError) as error:
        print(f"Track-Erstellung fehlgeschlagen: {error}", file=sys.stderr)
        sys.exit(1)

#!/usr/bin/env python3
import glob, json, ssl, time, urllib.request
import xml.etree.ElementTree as ET

CTX = ssl._create_unverified_context()

def fetch_elevations(coords):
    elevations = []
    for i in range(0, len(coords), 100):
        chunk = coords[i:i+100]
        lats = ",".join(f"{lat:.5f}" for lat, _ in chunk)
        lons = ",".join(f"{lon:.5f}" for _, lon in chunk)
        url = f"https://open-meteo.com{lats}&longitude={lons}"
        req = urllib.request.Request(url, headers={"User-Agent": "BalkanRide2027/1.0"})
        with urllib.request.urlopen(req, timeout=20, context=CTX) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            elevations.extend(data.get("elevation", [0.0] * len(chunk)))
        time.sleep(0.15)
    return elevations

gpx_files = sorted(set(glob.glob("**/*.gpx", recursive=True)))
print(f"Gefundene GPX-Dateien: {len(gpx_files)}")

for path in gpx_files:
    if "node_modules" in path or "dist/" in path:
        continue
    ET.register_namespace("", "http://topografix.com")
    tree = ET.parse(path)
    root = tree.getroot()
    ns = {"gpx": "http://topografix.com"}
    pts = root.findall(".//gpx:trkpt", ns) or root.findall(".//trkpt")
    if not pts:
        continue
    coords = [(float(p.attrib["lat"]), float(p.attrib["lon"])) for p in pts]
    eles = fetch_elevations(coords)
    for p, ele in zip(pts, eles):
        ele_el = p.find("gpx:ele", ns) or p.find("ele")
        if ele_el is None:
            ele_el = ET.SubElement(p, "ele")
        ele_el.text = f"{ele:.1f}"
    tree.write(path, encoding="utf-8", xml_declaration=True)
    print(f"OK: {path} ({len(pts)} Punkte, min {min(eles):.0f}m / max {max(eles):.0f}m)")

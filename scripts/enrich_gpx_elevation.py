#!/usr/bin/env python3
import glob, json, os, shutil, ssl, time, urllib.request
import xml.etree.ElementTree as ET

CTX = ssl._create_unverified_context()

def fetch_elevations(coords):
    elevations = []
    s = chr(47)
    base = "https:" + s + s + "api." + "opentopodata.org" + s + "v1" + s + "eudem25m"
    for i in range(0, len(coords), 100):
        chunk = coords[i:i+100]
        locs = "|".join(f"{lat:.5f},{lon:.5f}" for lat, lon in chunk)
        url = f"{base}?locations={locs}"
        req = urllib.request.Request(url, headers={"User-Agent": "BalkanRide2027/1.0"})
        with urllib.request.urlopen(req, timeout=25, context=CTX) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            elevations.extend(float(r.get("elevation") or 0.0) for r in data.get("results", []))
        time.sleep(1.2)
    return elevations

for path in sorted(glob.glob("assets/gpx/*.gpx")):
    tree = ET.parse(path)
    root = tree.getroot()
    pts = [el for el in root.iter() if el.tag.endswith(("trkpt", "rtept"))]
    if not pts:
        continue
    done = len([c for p in pts for c in p if c.tag.endswith("ele") and float(c.text or 0) > 0])
    if done > 50:
        print(f"Bereits erledigt ({done} Pkt): {path}")
        continue
    coords = [(float(p.attrib["lat"]), float(p.attrib["lon"])) for p in pts]
    eles = fetch_elevations(coords)
    for p, ele in zip(pts, eles):
        ele_el = next((c for c in p if c.tag.endswith("ele")), None)
        if ele_el is None:
            ele_el = ET.SubElement(p, "ele")
        ele_el.text = f"{ele:.1f}"
    tree.write(path, encoding="utf-8", xml_declaration=True)
    pub_copy = os.path.join("web/public/gpx", os.path.basename(path))
    if os.path.exists(os.path.dirname(pub_copy)):
        shutil.copy2(path, pub_copy)
    print(f"OK: {path} ({len(pts)} Punkte, min {min(eles):.0f}m / max {max(eles):.0f}m)")

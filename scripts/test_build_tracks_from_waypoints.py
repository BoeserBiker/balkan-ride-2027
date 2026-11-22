import io
import json
import unittest
from unittest.mock import patch
from xml.sax.saxutils import escape

import build_tracks_from_waypoints as tracks


class TrackGenerationTests(unittest.TestCase):
    def test_xml_special_characters_are_escaped_once(self):
        waypoint = tracks.ET.Element(tracks.tag("wpt"), {"lat": "42", "lon": "19"})
        name = "Kotor & Njeguši <Pass> 'Zitat' \"Test\""
        tracks.ET.SubElement(waypoint, tracks.tag("name")).text = name
        tracks.ET.SubElement(waypoint, tracks.tag("desc")).text = name

        output = io.BytesIO()
        tracks.build_gpx(10, [waypoint], [[19, 42], [20, 43]]).write(
            output, encoding="utf-8", xml_declaration=True
        )
        xml = output.getvalue()
        self.assertIn(escape(name).encode("utf-8"), xml)
        root = tracks.ET.fromstring(xml)
        self.assertEqual(root.findtext(f"{tracks.tag('wpt')}/{tracks.tag('name')}"), name)
        self.assertEqual(root.findtext(f"{tracks.tag('wpt')}/{tracks.tag('desc')}"), name)

    def test_koman_keeps_ferry_waypoints_out_of_road_request(self):
        routes, waypoints = tracks.load_days(tracks.SOURCE)
        coordinates = tracks.route_coordinates(13, routes[13])
        self.assertEqual(len(coordinates), 2)
        self.assertEqual(len(waypoints[13]), 2)
        self.assertTrue(all(
            "/ MOTORRAD /" in point.findtext(tracks.tag("desc"), "")
            for point in waypoints[13]
        ))
        result = tracks.build_gpx(13, waypoints[13], [[19.826294, 42.108561], [19.643354, 41.781664]])
        self.assertEqual(len(result.getroot().findall(tracks.tag("wpt"))), 2)
        self.assertEqual(len(result.getroot().findall(f".//{tracks.tag('trkpt')}")), 2)

    def test_alternative_and_direct_waypoints_are_excluded(self):
        _, waypoints = tracks.load_days(tracks.SOURCE)
        self.assertEqual(len(waypoints[11]), 6)
        self.assertTrue(all(
            "/ D11 / MOTORRAD /" in point.findtext(tracks.tag("desc"), "")
            for point in waypoints[11]
        ))

    def test_simplification_preserves_endpoints_and_respects_point_cap(self):
        points = [[index / 10000, (index % 2) / 1000] for index in range(2500)]
        simplified = tracks.simplify_track(points, tolerance=0.00001, max_points=100)
        self.assertLessEqual(len(simplified), 100)
        self.assertEqual(simplified[0], points[0])
        self.assertEqual(simplified[-1], points[-1])

    def test_douglas_peucker_keeps_turns_over_tolerance(self):
        points = [[0, 0], [1, 0], [1, 1], [2, 1]]
        simplified = tracks.douglas_peucker(points, tolerance=0.1)
        self.assertEqual(simplified, points)

    def test_cli_configures_maximum_track_points(self):
        self.assertEqual(tracks.parse_args([]).max_track_points, 300)
        self.assertEqual(
            tracks.parse_args(["--max-track-points", "250"]).max_track_points,
            250,
        )

    def test_cli_rejects_track_point_limit_above_300(self):
        with self.assertRaises(SystemExit):
            tracks.parse_args(["--max-track-points", "301"])

    def test_build_uses_configured_track_point_limit(self):
        points = [[index / 10000, (index % 2) / 1000] for index in range(500)]
        tree = tracks.build_gpx(10, [], points, max_track_points=50)
        self.assertLessEqual(
            len(tree.getroot().findall(f".//{tracks.tag('trkpt')}")),
            50,
        )

    def test_sea_day_has_no_track_or_waypoints(self):
        routes, waypoints = tracks.load_days(tracks.SOURCE)
        self.assertNotIn(19, routes)
        root = tracks.build_gpx(19, waypoints[19], None).getroot()
        self.assertIsNone(root.find(tracks.tag("trk")))
        self.assertEqual(root.findall(tracks.tag("wpt")), [])

    def test_osrm_ferry_leg_is_rejected(self):
        response = {
            "code": "Ok",
            "routes": [{"legs": [{"steps": [{"mode": "ferry"}]}]}],
        }
        with patch.object(tracks.urllib.request, "urlopen", return_value=io.BytesIO(json.dumps(response).encode())):
            with self.assertRaisesRegex(ValueError, "enthält eine Fähre"):
                tracks.fetch_route(13, [("19", "42"), ("20", "43")])


if __name__ == "__main__":
    unittest.main()

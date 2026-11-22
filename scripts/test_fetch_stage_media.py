import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import fetch_stage_media as media


class StageMediaTests(unittest.TestCase):
    def test_write_field_preserves_other_frontmatter_and_body(self):
        source = '---\ntag: 1\nbilder: []\nvideos: []\n---\nText bleibt.\n'
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "stage.md"
            path.write_text(source, encoding="utf-8")
            media.write_field(path, source, "bilder", [
                {"datei": "assets/media/test.jpg", "beschreibung": "Straße: Blick"},
            ])
            text, stage = media.load_stage(path)
        self.assertEqual(stage["bilder"][0]["beschreibung"], "Straße: Blick")
        self.assertEqual(stage["videos"], [])
        self.assertTrue(text.endswith("---\nText bleibt.\n"))

    @patch.object(media, "request_json")
    def test_commons_requires_landscape_and_attributable_cc_license(self, request):
        base = {
            "width": 2000, "height": 1000, "mime": "image/jpeg",
            "thumburl": "https://upload.wikimedia.org/test.jpg",
            "descriptionurl": "https://commons.wikimedia.org/wiki/File:Test.jpg",
            "extmetadata": {
                "LicenseUrl": {"value": "https://creativecommons.org/licenses/by-sa/4.0"},
                "LicenseShortName": {"value": "CC BY-SA 4.0"},
                "Artist": {"value": "<a>Alice</a>"},
            },
        }
        request.return_value = {"query": {"pages": [
            {"title": "File:Test.jpg", "imageinfo": [base]},
            {"title": "File:Map.jpg", "imageinfo": [base]},
            {"title": "File:Portrait.jpg", "imageinfo": [{**base, "height": 3000}]},
            {"title": "File:Unknown.jpg", "imageinfo": [{**base, "extmetadata": {}}]},
        ]}}
        images = list(media.commons_images("test"))
        self.assertEqual(len(images), 1)
        self.assertEqual(images[0]["author"], "Alice")

    @patch.object(media, "request_json")
    @patch.object(media.time, "sleep")
    def test_commons_excludes_the_other_nehaj_fortress(self, _sleep, request):
        info = {
            "width": 2000, "height": 1000, "mime": "image/jpeg",
            "thumburl": "https://upload.wikimedia.org/test.jpg",
            "descriptionurl": "https://commons.wikimedia.org/wiki/File:Test.jpg",
            "extmetadata": {
                "LicenseUrl": {"value": "https://creativecommons.org/licenses/by-sa/4.0"},
                "LicenseShortName": {"value": "CC BY-SA 4.0"},
                "Artist": {"value": "Alice"},
            },
        }
        request.return_value = {"query": {"pages": [
            {"title": "File:Haj-Nehaj Fortress.jpg", "imageinfo": [info]},
            {"title": "File:Nehaj Senj.jpg", "imageinfo": [info]},
        ]}}
        self.assertEqual([image["title"] for image in media.commons_images("Nehaj Fortress")], ["File:Nehaj Senj.jpg"])

    @patch.object(media, "request_json")
    def test_youtube_embed_uses_nocookie_and_header(self, request):
        request.side_effect = [
            {"items": [
                {"id": {"videoId": "abcdefghijk"}, "snippet": {"title": "Tour &amp; Pass"}},
                {"id": {"videoId": "lmnopqrstuv"}, "snippet": {"title": "Küstenfahrt"}},
            ]},
            {"items": [
                {"id": "abcdefghijk", "contentDetails": {"duration": "PT1M30S"}},
                {"id": "lmnopqrstuv", "contentDetails": {"duration": "PT2M"}},
            ]},
        ]
        source = '---\ntag: 3\nbilder: []\nvideos: []\n---\nText.\n'
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "stage.md"
            path.write_text(source, encoding="utf-8")
            media.add_videos(path, source, {"tag": 3, "videos": []}, "test-key")
            _, stage = media.load_stage(path)
        self.assertEqual(stage["videos"][0]["quelle"], "https://www.youtube-nocookie.com/embed/abcdefghijk")
        self.assertEqual(stage["videos"][0]["titel"], "Tour & Pass")
        self.assertEqual(stage["videos"][1]["quelle"], "https://www.youtube-nocookie.com/embed/lmnopqrstuv")
        search, details = request.call_args_list
        self.assertEqual(search.args[1]["videoDuration"], "short")
        self.assertEqual(search.args[1]["videoEmbeddable"], "true")
        self.assertEqual(search.args[1]["maxResults"], 25)
        self.assertEqual(details.args[0], media.YOUTUBE_VIDEOS_API)
        self.assertEqual(details.args[1], {"part": "contentDetails", "id": "abcdefghijk,lmnopqrstuv"})
        self.assertEqual(details.args[2], {"X-Goog-Api-Key": "test-key"})

    @patch.object(media, "request_json")
    def test_youtube_duration_limits_and_missing_details(self, request):
        source = '---\ntag: 3\nbilder: []\nvideos: []\n---\nText.\n'
        for duration, accepted in [
            ("PT4S", False), ("PT5S", True), ("PT2M", True),
            ("PT120.01S", False), ("PT2M1S", False), ("PT1H", False),
            ("PT", False), (None, False),
        ]:
            with self.subTest(duration=duration), tempfile.TemporaryDirectory() as directory:
                path = Path(directory) / "stage.md"
                path.write_text(source, encoding="utf-8")
                request.side_effect = [
                    {"items": [{"id": {"videoId": "abcdefghijk"}}]},
                    {"items": [{"id": "abcdefghijk", "contentDetails": {"duration": duration}}]},
                ]
                if accepted:
                    media.add_videos(path, source, {"tag": 3, "videos": []}, "test-key")
                    self.assertEqual(len(media.load_stage(path)[1]["videos"]), 1)
                else:
                    media.add_videos(path, source, {"tag": 3, "videos": []}, "test-key")
                    self.assertEqual(path.read_text(encoding="utf-8"), source)

    @patch.object(media, "request_json")
    def test_youtube_skips_unusable_candidates_in_search_order(self, request):
        source = '---\ntag: 3\nbilder: []\nvideos: []\n---\nText.\n'
        request.side_effect = [
            {"items": [{"id": {"videoId": value}} for value in ("aaaaaaaaaaa", "bbbbbbbbbbb", "ccccccccccc")]},
            {"items": [
                {"id": "ccccccccccc", "contentDetails": {"duration": "PT5S"}},
                {"id": "aaaaaaaaaaa", "contentDetails": {"duration": "PT121S"}},
            ]},
        ]
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "stage.md"
            path.write_text(source, encoding="utf-8")
            media.add_videos(path, source, {"tag": 3, "videos": []}, "test-key")
            self.assertTrue(media.load_stage(path)[1]["videos"][0]["quelle"].endswith("/ccccccccccc"))

    @patch.object(media, "request_json")
    def test_existing_youtube_video_is_preserved_and_second_unique_video_added(self, request):
        source = (
            '---\ntag: 3\nbilder: []\nvideos:\n'
            '  - typ: youtube\n    quelle: https://www.youtube-nocookie.com/embed/abcdefghijk\n'
            '    titel: Bereits vorhanden\n---\nText.\n'
        )
        request.side_effect = [
            {"items": [
                {"id": {"videoId": "abcdefghijk"}},
                {"id": {"videoId": "lmnopqrstuv"}, "snippet": {"title": "Neuer Treffer"}},
                {"id": {"videoId": "lmnopqrstuv"}},
            ]},
            {"items": [{"id": "lmnopqrstuv", "contentDetails": {"duration": "PT30S"}}]},
        ]
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "stage.md"
            path.write_text(source, encoding="utf-8")
            text, stage = media.load_stage(path)
            media.add_videos(path, text, stage, "test-key")
            updated = media.load_stage(path)[1]["videos"]
        self.assertEqual(updated[0], {
            "typ": "youtube",
            "quelle": "https://www.youtube-nocookie.com/embed/abcdefghijk",
            "titel": "Bereits vorhanden",
        })
        self.assertEqual(len(updated), 2)
        self.assertEqual(updated[1]["quelle"], "https://www.youtube-nocookie.com/embed/lmnopqrstuv")
        self.assertEqual(request.call_args_list[1].args[1]["id"], "lmnopqrstuv")

    @patch.object(media, "request_json")
    def test_two_existing_youtube_videos_are_left_untouched(self, request):
        source = (
            '---\ntag: 3\nbilder: []\nvideos:\n'
            '  - typ: youtube\n    quelle: https://www.youtube-nocookie.com/embed/abcdefghijk\n'
            '  - typ: youtube\n    quelle: https://www.youtube-nocookie.com/embed/lmnopqrstuv\n'
            '---\nText.\n'
        )
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "stage.md"
            path.write_text(source, encoding="utf-8")
            text, stage = media.load_stage(path)
            media.add_videos(path, text, stage, "test-key")
            self.assertEqual(path.read_text(encoding="utf-8"), source)
        request.assert_not_called()

    @patch.object(media, "youtube_key", side_effect=AssertionError("API-Schlüssel gelesen"))
    @patch.object(media, "add_images")
    @patch.object(media, "load_stage")
    def test_images_only_does_not_read_youtube_key(self, load, add_images, key):
        load.side_effect = [(None, {"tag": n}) for n in range(1, 23)]
        with patch("sys.argv", ["fetch_stage_media.py", "--images-only"]):
            self.assertEqual(media.main(), 0)
        self.assertEqual(add_images.call_count, 22)
        key.assert_not_called()

    def test_two_existing_photos_are_extended_without_changing_videos(self):
        source = (
            '---\ntag: 3\nbilder:\n'
            '  - datei: assets/media/tag-03/commons-01.jpg\n'
            '    quelle: https://example.test/one\n'
            '  - datei: assets/media/tag-03/commons-02.jpg\n'
            '    quelle: https://example.test/two\n'
            'videos:\n  - typ: youtube\n    quelle: https://www.youtube-nocookie.com/embed/abcdefghijk\n'
            '    titel: Unverändert\n---\nText bleibt.\n'
        )
        def image(name):
            return {
                "source": f"https://example.test/{name}", "mime": "image/jpeg",
                "title": f"File:{name}.jpg", "author": "Autor",
                "license": "CC BY 4.0", "license_url": "https://creativecommons.org/licenses/by/4.0/",
            }

        def download(_image, destination):
            destination.write_bytes(b"image")

        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            path = root / "tag-03.md"
            path.write_text(source, encoding="utf-8")
            text, stage = media.load_stage(path)
            with patch.object(media, "ROOT", root), \
                 patch.object(media, "commons_images", side_effect=lambda query: iter([image("three"), image("four")])), \
                 patch.object(media, "download_image", side_effect=download), \
                 patch.object(media.time, "sleep"):
                media.add_images(path, text, stage)
            result, updated = media.load_stage(path)
            self.assertEqual(len(updated["bilder"]), 4)
            self.assertEqual(updated["videos"], stage["videos"])
            self.assertEqual(result.split("videos:", 1)[1], source.split("videos:", 1)[1])
            self.assertTrue((root / "assets/media/tag-03/commons-03.jpg").exists())
            self.assertTrue((root / "assets/media/tag-03/commons-04.jpg").exists())


if __name__ == "__main__":
    unittest.main()

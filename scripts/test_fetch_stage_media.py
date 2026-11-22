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
    def test_youtube_embed_uses_nocookie_and_header(self, request):
        request.return_value = {"items": [
            {"id": {"videoId": "abcdefghijk"}, "snippet": {"title": "Tour &amp; Pass"}}
        ]}
        source = '---\ntag: 3\nbilder: []\nvideos: []\n---\nText.\n'
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "stage.md"
            path.write_text(source, encoding="utf-8")
            media.add_videos(path, source, {"tag": 3, "videos": []}, "test-key")
            _, stage = media.load_stage(path)
        self.assertEqual(stage["videos"][0]["quelle"], "https://www.youtube-nocookie.com/embed/abcdefghijk")
        self.assertEqual(stage["videos"][0]["titel"], "Tour & Pass")
        self.assertEqual(request.call_args.args[2], {"X-Goog-Api-Key": "test-key"})

    @patch.object(media, "youtube_key", side_effect=AssertionError("API-Schlüssel gelesen"))
    @patch.object(media, "add_images")
    @patch.object(media, "load_stage")
    def test_images_only_does_not_read_youtube_key(self, load, add_images, key):
        load.side_effect = [(None, {"tag": n}) for n in range(1, 23)]
        with patch("sys.argv", ["fetch_stage_media.py", "--images-only"]):
            self.assertEqual(media.main(), 0)
        self.assertEqual(add_images.call_count, 22)
        key.assert_not_called()


if __name__ == "__main__":
    unittest.main()

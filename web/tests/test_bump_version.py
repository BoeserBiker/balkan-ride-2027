import importlib.util
import json
import os
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch


SCRIPT = Path(__file__).resolve().parents[2] / "scripts" / "bump_version.py"
spec = importlib.util.spec_from_file_location("bump_version", SCRIPT)
bump_version = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bump_version)


class BumpVersionTest(unittest.TestCase):
    def test_increments_version_history_and_cache_twice(self):
        with tempfile.TemporaryDirectory() as directory:
            version_file = Path(directory) / "version.json"
            worker_file = Path(directory) / "sw.js"
            version_file.write_text(json.dumps({
                "version": "v2.34",
                "history": [{"version": "v2.34", "date": "2026-11-22", "message": "Start"}],
            }), encoding="utf-8")
            worker_file.write_text("const CACHE_NAME = `${CACHE_PREFIX}v11`;\n", encoding="utf-8")

            with patch.object(bump_version, "VERSION_FILE", version_file), \
                    patch.object(bump_version, "SERVICE_WORKER", worker_file):
                with patch.object(sys, "argv", ["bump_version.py", "Erste Änderung"]):
                    bump_version.main()
                with patch.object(sys, "argv", ["bump_version.py"]), \
                        patch.dict(os.environ, {"GIT_COMMIT_MSG": "Zweite Änderung"}):
                    bump_version.main()

            result = json.loads(version_file.read_text(encoding="utf-8"))
            self.assertEqual(result["version"], "v2.36")
            self.assertEqual([entry["message"] for entry in result["history"]],
                             ["Zweite Änderung", "Erste Änderung", "Start"])
            self.assertIn("`${CACHE_PREFIX}v13`", worker_file.read_text(encoding="utf-8"))

    def test_rejects_missing_message_without_changes(self):
        with tempfile.TemporaryDirectory() as directory:
            version_file = Path(directory) / "version.json"
            worker_file = Path(directory) / "sw.js"
            version_file.write_text('{"version":"v2.34","history":[]}', encoding="utf-8")
            worker_file.write_text("const CACHE_NAME = `${CACHE_PREFIX}v11`;\n", encoding="utf-8")
            with patch.object(bump_version, "VERSION_FILE", version_file), \
                    patch.object(bump_version, "SERVICE_WORKER", worker_file), \
                    patch.object(sys, "argv", ["bump_version.py"]), \
                    patch.dict(os.environ, {"GIT_COMMIT_MSG": ""}), \
                    self.assertRaises(SystemExit):
                bump_version.main()
            self.assertEqual(version_file.read_text(encoding="utf-8"), '{"version":"v2.34","history":[]}')
            self.assertEqual(worker_file.read_text(encoding="utf-8"), "const CACHE_NAME = `${CACHE_PREFIX}v11`;\n")


if __name__ == "__main__":
    unittest.main()

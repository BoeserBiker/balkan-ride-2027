#!/usr/bin/env python3
"""Increment the app version: python scripts/bump_version.py "Commit-Nachricht".

The message can alternatively be supplied via GIT_COMMIT_MSG.
"""

import argparse
from datetime import date
import json
import os
from pathlib import Path
import re


ROOT = Path(__file__).resolve().parent.parent
VERSION_FILE = ROOT / "web" / "public" / "version.json"
SERVICE_WORKER = ROOT / "web" / "public" / "sw.js"


def main() -> None:
    parser = argparse.ArgumentParser(description="App- und Service-Worker-Version erhöhen.")
    parser.add_argument("message", nargs="?", help="Commit-Nachricht für den Versionsverlauf")
    args = parser.parse_args()
    message = (args.message or os.environ.get("GIT_COMMIT_MSG", "")).strip()
    if not message:
        parser.error("Commit-Nachricht als Argument oder GIT_COMMIT_MSG angeben.")

    data = json.loads(VERSION_FILE.read_text(encoding="utf-8"))
    match = re.fullmatch(r"v(\d+)\.(\d+)", data["version"])
    if not match or not isinstance(data["history"], list):
        raise ValueError("Ungültige Versionsdatei: Version oder Verlauf prüfen.")

    version = f"v{match.group(1)}.{int(match.group(2)) + 1}"
    data["version"] = version
    data["history"].insert(0, {
        "version": version,
        "date": date.today().isoformat(),
        "message": message,
    })

    worker = SERVICE_WORKER.read_text(encoding="utf-8")
    pattern = r"(?<=const CACHE_NAME = `\$\{CACHE_PREFIX\}v)\d+(?=`;)"
    worker, count = re.subn(pattern, lambda found: str(int(found.group()) + 1), worker)
    if count != 1:
        raise ValueError("Service-Worker-Cacheversion nicht eindeutig gefunden.")

    VERSION_FILE.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    SERVICE_WORKER.write_text(worker, encoding="utf-8")
    print(f"Version {version} und Service-Worker-Cache aktualisiert.")


if __name__ == "__main__":
    main()

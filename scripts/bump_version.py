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
    if not isinstance(data, dict):
        raise ValueError("Ungültige Versionsdatei: JSON-Wurzel muss ein Objekt sein.")
    match = re.fullmatch(r"v(\d+)\.(\d+)", str(data.get("version", "")))
    history = data.get("history")
    service_worker_history = data.get("serviceWorkerHistory")
    if not match or not isinstance(history, list) or not isinstance(service_worker_history, list):
        raise ValueError("Ungültige Versionsdatei: Version oder Verlauf prüfen.")

    worker = SERVICE_WORKER.read_text(encoding="utf-8")
    pattern = r"(?<=const CACHE_NAME = `\$\{CACHE_PREFIX\}v)\d+(?=`;)"
    cache_match = re.search(pattern, worker)
    if cache_match is None:
        raise ValueError("Service-Worker-Cacheversion nicht eindeutig gefunden.")
    current_cache = f"v{cache_match.group()}"
    if data.get("serviceWorkerCache") != current_cache:
        raise ValueError("serviceWorkerCache stimmt nicht mit sw.js überein.")
    if (
        not service_worker_history
        or not isinstance(service_worker_history[0], dict)
        or service_worker_history[0].get("version") != current_cache
    ):
        raise ValueError("Oberster Service-Worker-Verlauf stimmt nicht mit sw.js überein.")

    version = f"v{match.group(1)}.{int(match.group(2)) + 1}"
    next_cache = f"v{int(cache_match.group()) + 1}"
    today = date.today().isoformat()
    data["version"] = version
    data["serviceWorkerCache"] = next_cache
    history.insert(0, {
        "version": version,
        "date": today,
        "message": message,
    })
    service_worker_history.insert(0, {
        "version": next_cache,
        "date": today,
        "message": message,
    })

    worker, count = re.subn(pattern, next_cache[1:], worker)
    if count != 1:
        raise ValueError("Service-Worker-Cacheversion nicht eindeutig gefunden.")

    VERSION_FILE.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    SERVICE_WORKER.write_text(worker, encoding="utf-8")
    print(f"Version {version} und Service-Worker-Cache {next_cache} aktualisiert.")


if __name__ == "__main__":
    main()

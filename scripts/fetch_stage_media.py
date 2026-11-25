#!/usr/bin/env python3
"""Ergänzt Etappenmedien aus Wikimedia Commons und optional YouTube."""

import argparse
from decimal import Decimal
import html
from html.parser import HTMLParser
import json
import os
from pathlib import Path
import re
import sys
import tempfile
import time
import unicodedata
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse
from urllib.request import Request, urlopen

import yaml

ROOT = Path(__file__).resolve().parents[1]
COMMONS_API = "https://commons.wikimedia.org/w/api.php"
YOUTUBE_API = "https://www.googleapis.com/youtube/v3/search"
YOUTUBE_VIDEOS_API = "https://www.googleapis.com/youtube/v3/videos"
USER_AGENT = "BalkanRide2027/1.0 (Wikimedia Commons stage media research)"
IMAGE_COUNT = 4
YOUTUBE_VIDEO_COUNT = 2
IMAGE_QUERIES = {
    1: ["Velburg Bavaria", "Recklinghausen city"],
    2: ["Villach Austria", "Velburg Bavaria"],
    3: ["Vrsic Pass", "Soca Valley"],
    4: ["Nehaj Fortress", "Postojna Slovenia"],
    5: ["Karlobag coast", "Maslenica bridge", "Zadar Croatia"],
    6: ["Primosten Croatia", "Omis Cetina", "Trogir Croatia"],
    7: ["Kravica waterfall", "Stari Most Mostar", "Makarska Riviera"],
    8: ["Nevesinje Bosnia", "Foca Drina"],
    9: ["Piva canyon", "Durmitor Sedlo", "Tara bridge"],
    10: ["Perast Kotor bay", "Kotor bay"],
    11: ["Theth Albania", "Tamare Albania"],
    12: ["Theth Albania", "Lake Koman Albania"],
    13: ["Lake Koman ferry", "Lezhe Albania"],
    14: ["Durres Albania", "Fier Albania"],
    15: ["Llogara Pass", "Himare Albania"],
    16: ["Meteora monasteries", "Ioannina Greece"],
    17: ["Meteora monasteries", "Igoumenitsa Greece"],
    18: ["Igoumenitsa port", "Igoumenitsa Greece"],
    19: ["Adriatic ferry", "Adriatic sea ferry"],
    20: ["Tarvisio Italy", "Villach Austria"],
    21: ["Villach Austria", "Velburg Bavaria"],
    22: ["Velburg Bavaria", "Recklinghausen city"],
}
EXCLUDED = re.compile(
    r"\b(map|karte|plan|logo|flag|coat of arms|wappen|diagram|poster|"
    r"illustration|drawing|sign|schild|cyclist|cycling|bicycle|bike race|"
    r"municipality location|outhouse|toilet|wc|scopolia|haj[- ]nehaj|"
    r"freezing rain)\b",
    re.IGNORECASE,
)
LICENSES = re.compile(
    r"^https?://creativecommons\.org/licenses/(by|by-sa)/(2\.0|2\.5|3\.0|4\.0)/?$"
)


class TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts = []

    def handle_data(self, data):
        self.parts.append(data)


def plain_text(value):
    parser = TextExtractor()
    parser.feed(value)
    return " ".join(html.unescape(" ".join(parser.parts)).split())


def request_json(url, params, headers=None):
    request = Request(
        f"{url}?{urlencode(params)}",
        headers={"User-Agent": USER_AGENT, **(headers or {})},
    )
    for attempt in range(3):
        try:
            with urlopen(request, timeout=45) as response:
                data = json.load(response)
            break
        except HTTPError as error:
            if url == COMMONS_API and error.code in {429, 503} and attempt < 2:
                retry_after = error.headers.get("Retry-After", "")
                delay = int(retry_after) if retry_after.isdigit() else 10 * (attempt + 1)
                print(f"Commons HTTP {error.code}: erneuter Versuch in {delay}s.", file=sys.stderr, flush=True)
                time.sleep(delay)
                continue
            raise RuntimeError(f"API-Fehler HTTP {error.code} bei {url}") from error
        except URLError as error:
            raise RuntimeError(f"API nicht erreichbar: {url}: {error.reason}") from error
    if "error" in data:
        raise RuntimeError(f"API meldet einen Fehler bei {url}: {data['error']}")
    return data


def load_stage(path):
    text = path.read_text(encoding="utf-8")
    match = re.match(r"\A---\r?\n(.*?)\r?\n---\r?\n", text, re.DOTALL)
    if not match:
        raise ValueError(f"{path}: YAML-Frontmatter fehlt")
    data = yaml.safe_load(match.group(1))
    if not isinstance(data, dict):
        raise ValueError(f"{path}: Frontmatter ist keine Zuordnung")
    return text, data


def write_field(path, text, field, entries):
    items = yaml.safe_dump(entries, allow_unicode=True, sort_keys=False, width=1000).rstrip()
    block = f"{field}:\n" + "\n".join(f"  {line}" for line in items.splitlines())
    match = re.search(rf"(?m)^{field}:(?:[^\n]*\n)(?:[ \t]+[^\n]*\n|\n)*", text)
    if not match:
        raise ValueError(f"{path}: Feld {field} nicht gefunden")
    path.write_text(text[:match.start()] + block + "\n" + text[match.end():], encoding="utf-8")


def commons_images(query):
    time.sleep(1)
    response = request_json(COMMONS_API, {
        "action": "query", "generator": "search", "gsrsearch": query,
        "gsrnamespace": 6, "gsrlimit": 30, "prop": "imageinfo",
        "iiprop": "url|size|mime|extmetadata", "iiurlwidth": 1600,
        "format": "json", "formatversion": 2, "maxlag": 5,
    })
    for page in response.get("query", {}).get("pages", []):
        title = page.get("title", "")
        normalized_title = unicodedata.normalize("NFKD", title).encode("ascii", "ignore").decode().lower()
        keywords = [word.lower() for word in re.findall(r"[A-Za-z]{4,}", query)]
        if not keywords or keywords[0] not in normalized_title:
            continue
        info = next(iter(page.get("imageinfo", [])), {})
        meta = info.get("extmetadata", {})
        license_url = meta.get("LicenseUrl", {}).get("value", "")
        license_name = plain_text(meta.get("LicenseShortName", {}).get("value", ""))
        author = plain_text(
            meta.get("Attribution", {}).get("value")
            or meta.get("Artist", {}).get("value", "")
        )
        if (
            EXCLUDED.search(title)
            or info.get("mime") not in {"image/jpeg", "image/png"}
            or info.get("width", 0) < 1000
            or info.get("width", 0) <= info.get("height", 0)
            or not LICENSES.fullmatch(license_url)
            or not license_name or not author
            or not info.get("thumburl") or not info.get("descriptionurl")
        ):
            continue
        yield {
            "title": title,
            "url": info["thumburl"],
            "source": info["descriptionurl"],
            "author": author,
            "license": license_name,
            "license_url": license_url,
            "mime": info["mime"],
        }


def download_image(image, destination):
    from PIL import Image, ImageOps

    url = image["url"]
    parsed = urlparse(url)
    if parsed.scheme != "https" or parsed.hostname not in {"upload.wikimedia.org", "thumb.wikimedia.org"}:
        raise ValueError(f"Unerwartete Commons-Bildquelle: {url}")
    url = urlunparse(parsed._replace(query="", fragment=""))
    try:
        with urlopen(Request(url, headers={"User-Agent": USER_AGENT}), timeout=60) as response:
            content_type = response.headers.get_content_type()
            payload = response.read()
    except HTTPError as error:
        raise RuntimeError(f"Commons-Bild HTTP {error.code}: {url}") from error
    except URLError as error:
        raise RuntimeError(f"Commons-Bild konnte nicht geladen werden: {url}: {error.reason}") from error
    if content_type != image["mime"] or not payload:
        raise ValueError(f"Unerwarteter Bildtyp für {url}: {content_type}")
    destination.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryFile() as source:
        source.write(payload)
        source.seek(0)
        with Image.open(source) as original:
            resized = ImageOps.exif_transpose(original)
            if resized.width <= resized.height:
                raise ValueError(f"Bild ist nach Ausrichtung kein Querformat: {url}")
            resized.thumbnail((1600, resized.height), Image.Resampling.LANCZOS)
            resized.save(destination, format="JPEG" if image["mime"] == "image/jpeg" else "PNG")


def add_images(path, text, stage):
    existing = stage.get("bilder")
    if not isinstance(existing, list):
        raise ValueError(f"{path}: bilder ist keine Liste")
    if len(existing) >= IMAGE_COUNT:
        print(f"{path.name}: {len(existing)} Bilder vorhanden; unverändert.")
        return
    number = stage["tag"]
    entries = list(existing)
    seen = {image.get("quelle") for image in entries if isinstance(image, dict)}
    pending = []
    with tempfile.TemporaryDirectory(prefix="balkan-media-") as temp_dir:
        for query in IMAGE_QUERIES[number] * IMAGE_COUNT:
            for image in commons_images(query):
                if image["source"] in seen or image["mime"] != "image/jpeg":
                    continue
                relative = Path("assets/media") / f"tag-{number:02}" / f"commons-{len(entries) + 1:02}.jpg"
                if (ROOT / relative).exists():
                    raise FileExistsError(f"Datei bereits vorhanden: {relative}")
                temporary = Path(temp_dir) / relative.name
                try:
                    download_image(image, temporary)
                except (OSError, ValueError, RuntimeError) as error:
                    print(f"Bild übersprungen: {error}", file=sys.stderr, flush=True)
                    continue
                pending.append((temporary, ROOT / relative))
                caption = re.sub(r"\.(jpe?g|png)$", "", image["title"].removeprefix("File:"), flags=re.I)
                entries.append({
                    "datei": relative.as_posix(), "beschreibung": caption,
                    "urheber": image["author"], "lizenz": image["license"],
                    "lizenz_url": image["license_url"], "quelle": image["source"],
                })
                seen.add(image["source"])
                print(f"{path.name}: {caption} ({image['license']})", flush=True)
                break
            if len(entries) >= IMAGE_COUNT:
                for temporary, destination in pending:
                    destination.parent.mkdir(parents=True, exist_ok=True)
                    temporary.replace(destination)
                write_field(path, text, "bilder", entries)
                return
            time.sleep(0.1)
    raise RuntimeError(f"{path.name}: nur {len(entries)} von {IMAGE_COUNT} Bildern gefunden")


def youtube_key():
    key = os.environ.get("YOUTUBE_API_KEY")
    if not key:
        env_file = ROOT / ".env"
        if env_file.exists():
            for line in env_file.read_text(encoding="utf-8").splitlines():
                if line.strip().startswith("YOUTUBE_API_KEY="):
                    key = line.split("=", 1)[1].strip().strip("\"'")
                    break
    if not key:
        raise RuntimeError("YOUTUBE_API_KEY fehlt in der Umgebung und in .env")
    return key


def duration_seconds(value):
    if not isinstance(value, str):
        raise ValueError(f"Ungültige YouTube-Dauer: {value!r}")
    match = re.fullmatch(r"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:[.,]\d+)?)S)?", value)
    if not match or not any(match.groups()):
        raise ValueError(f"Ungültige YouTube-Dauer: {value!r}")
    hours, minutes, seconds = match.groups()
    return int(hours or 0) * 3600 + int(minutes or 0) * 60 + Decimal((seconds or "0").replace(",", "."))


def youtube_video_id(video):
    if not isinstance(video, dict):
        return None
    source = video.get("quelle")
    if not isinstance(source, str):
        return None
    parsed = urlparse(source)
    hostname = parsed.hostname or ""
    if hostname in {"youtube-nocookie.com", "www.youtube-nocookie.com"}:
        match = re.fullmatch(r"/embed/([A-Za-z0-9_-]{11})/?", parsed.path)
        return match.group(1) if match else None
    if hostname in {"youtu.be", "www.youtu.be"}:
        video_id = parsed.path.strip("/").split("/", 1)[0]
    elif hostname in {"youtube.com", "www.youtube.com", "m.youtube.com"}:
        match = re.fullmatch(r"/(?:embed|shorts)/([A-Za-z0-9_-]{11})/?", parsed.path)
        if match:
            return match.group(1)
        video_id = parse_qs(parsed.query).get("v", [""])[0] if parsed.path == "/watch" else ""
    else:
        return None
    return video_id if re.fullmatch(r"[A-Za-z0-9_-]{11}", video_id) else None


def add_videos(path, text, stage, key):
    existing = stage.get("videos")
    if not isinstance(existing, list):
        raise ValueError(f"{path}: videos ist keine Liste")
    if len(existing) >= YOUTUBE_VIDEO_COUNT:
        print(f"{path.name}: {len(existing)} Videos vorhanden; unverändert.")
        return
    entries = list(existing)
    initial_count = len(entries)
    query = f"{IMAGE_QUERIES[stage['tag']][0]} motorcycle ride"
    response = request_json(YOUTUBE_API, {
        "part": "snippet", "type": "video", "videoEmbeddable": "true",
        "videoDuration": "short", "maxResults": 25, "q": query,
    }, {"X-Goog-Api-Key": key})
    seen = {video_id for video in existing if (video_id := youtube_video_id(video))}
    candidates = []
    for item in response.get("items", []):
        item_id = item.get("id")
        video_id = item_id.get("videoId") if isinstance(item_id, dict) else None
        if (
            not isinstance(video_id, str)
            or not re.fullmatch(r"[A-Za-z0-9_-]{11}", video_id)
            or video_id in seen
        ):
            continue
        seen.add(video_id)
        candidates.append(item)
    if candidates:
        details = request_json(YOUTUBE_VIDEOS_API, {
            "part": "contentDetails",
            "id": ",".join(item["id"]["videoId"] for item in candidates),
        }, {"X-Goog-Api-Key": key})
        durations = {
            item["id"]: item.get("contentDetails", {}).get("duration", "")
            for item in details.get("items", []) if "id" in item
        }
        for item in candidates:
            video_id = item["id"]["videoId"]
            try:
                seconds = duration_seconds(durations.get(video_id, ""))
            except ValueError as error:
                print(f"{path.name}: {video_id}: {error}", file=sys.stderr)
                continue
            if not 5 <= seconds <= 120:
                continue
            title = html.unescape(item.get("snippet", {}).get("title", "Etappenvideo"))
            entries.append({
                "typ": "youtube",
                "quelle": f"https://www.youtube-nocookie.com/embed/{video_id}",
                "titel": title,
            })
            if len(entries) >= YOUTUBE_VIDEO_COUNT:
                break
    added = len(entries) - initial_count
    if added:
        write_field(path, text, "videos", entries)
    print(f"{path.name}: {added} YouTube-Video(s) ergänzt; {len(entries)} insgesamt.")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--images-only", action="store_true", help="Nur Wikimedia-Bilder laden")
    group.add_argument("--youtube-only", action="store_true", help="Nur YouTube-Videos suchen")
    args = parser.parse_args()
    key = youtube_key() if not args.images_only else None
    errors = []
    for number in range(1, 23):
        path = ROOT / "content" / f"tag-{number:02}.md"
        try:
            text, stage = load_stage(path)
            if stage.get("tag") != number:
                raise ValueError(f"{path.name}: falsche Tagnummer")
            if not args.youtube_only:
                add_images(path, text, stage)
            if not args.images_only:
                text, stage = load_stage(path)
                add_videos(path, text, stage, key)
        except (OSError, ValueError, RuntimeError, yaml.YAMLError) as error:
            print(f"FEHLER: {error}", file=sys.stderr, flush=True)
            errors.append(number)
    if errors:
        print(f"Nicht vollständig bearbeitete Tage: {', '.join(map(str, errors))}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())

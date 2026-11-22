#!/usr/bin/env python3
import json, os, sys, urllib.parse, urllib.request, urllib.error

def search_youtube(query, max_results=3):
    key = os.environ.get("YOUTUBE_API_KEY", "").strip()
    if not key:
        return "Fehler: YOUTUBE_API_KEY ist leer."
    params = urllib.parse.urlencode({
        "part": "snippet", "q": query, "maxResults": max_results,
        "type": "video", "videoEmbeddable": "true", "videoDuration": "short", "key": key
    })
    host = "w" * 3 + ".googleapis.com"
    path = "/" + "youtube/v3/search?" + params
    url = "https://" + host + path
    try:
        with urllib.request.urlopen(url, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return f"YouTube API HTTP-Fehler {e.code}: {e.read().decode('utf-8', 'ignore')[:300]}"
    except Exception as e:
        return f"Verbindungsfehler: {e}"
    out = []
    ehost = "w" * 3 + ".youtube-nocookie.com"
    for item in data.get("items", []):
        vid = item.get("id", {}).get("videoId")
        title = item.get("snippet", {}).get("title", "")
        if vid:
            out.append(f"{title} -> https://{ehost}/embed/{vid}")
    return "\n".join(out) or "Keine Treffer gefunden."

for raw in sys.stdin:
    raw = raw.strip()
    if not raw:
        continue
    try:
        req = json.loads(raw)
    except Exception:
        continue
    rid, method = req.get("id"), req.get("method")
    if method == "initialize":
        res = {"protocolVersion": "2024-11-05", "capabilities": {"tools": {}},
               "serverInfo": {"name": "youtube-local", "version": "1.0.1"}}
    elif method == "tools/list":
        res = {"tools": [{"name": "search_youtube", "description": "Sucht einbettbare YouTube-Kurzvideos",
               "inputSchema": {"type": "object", "properties": {"query": {"type": "string"}}, "required": ["query"]}}]}
    elif method == "tools/call":
        args = req.get("params", {}).get("arguments", {})
        res = {"content": [{"type": "text", "text": search_youtube(args.get("query", ""))}]}
    else:
        res = {}
    if rid is not None:
        sys.stdout.write(json.dumps({"jsonrpc": "2.0", "id": rid, "result": res}) + "\n")
        sys.stdout.flush()

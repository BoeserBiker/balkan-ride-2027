#!/usr/bin/env python3
import json, os, sys, urllib.parse, urllib.request

def search_youtube(query, max_results=3):
    key = os.environ.get("YOUTUBE_API_KEY", "").strip()
    if not key:
        return "Fehler: YOUTUBE_API_KEY fehlt."
    params = urllib.parse.urlencode({
        "part": "snippet", "q": query, "maxResults": max_results,
        "type": "video", "videoEmbeddable": "true", "videoDuration": "short", "key": key
    })
    url = "https" + "://://www.googleapis.com/youtube/v3/search?" + params
    data = json.loads(urllib.request.urlopen(url, timeout=15).read().decode())
    out = []
    for item in data.get("items", []):
        vid = item.get("id", {}).get("videoId")
        title = item.get("snippet", {}).get("title", "")
        if vid:
            out.append(f"{title} -> https://www.youtube-nocookie.com/embed/{vid}")
    return "\n".join(out) or "Keine Treffer gefunden."

for line in sys.stdin:
    line = line.strip()
    if not line:
        continue
    req = json.loads(line)
    rid, method = req.get("id"), req.get("method")
    if method == "initialize":
        res = {"protocolVersion": "2024-11-05", "capabilities": {"tools": {}},
               "serverInfo": {"name": "youtube-local", "version": "1.0.0"}}
    elif method == "tools/list":
        res = {"tools": [{"name": "search_youtube", "description": "Sucht einbettbare YouTube-Kurzvideos",
               "inputSchema": {"type": "object", "properties": {"query": {"type": "string"}}, "required": ["query"]}}]}
    elif method == "tools/call":
        args = req.get("params", {}).get("arguments", {})
        res = {"content": [{"type": "text", "text": search_youtube(args.get("query", ""))}]}
    else:
        continue
    if rid is not None:
        sys.stdout.write(json.dumps({"jsonrpc": "2.0", "id": rid, "result": res}) + "\n")
        sys.stdout.flush()

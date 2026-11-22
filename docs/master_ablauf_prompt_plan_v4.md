# Master-Ablauf- und Prompt-Plan: Von Excel zur Live-Web-App (Polarsteps-Style PWA & 2-Stufen-Agent) – Version 4
*(Abgestimmt auf `docs/Balkan_Tour_Pflichtenheft_V4.md` und `docs/todo_plan_v4.md` – Projekt: **Balkan-Ride 2027**)*

---

## Phase 1: Die menschliche Basis (GitHub, Sicherheit & Repository Setup)
*Bevor du in VS Code eine Zeile Code schreibst, richtest du deine Infrastruktur und Sicherheitsregeln ein.*

1. **GitHub-Account & Repo:** Melde dich mit deinem privaten GitHub-Account an und erstelle ein neues Repository: **`balkan-ride-2027`**.
2. **Lokal verknüpfen:** Öffne das Terminal, navigiere in deinen lokalen Workspace-Ordner `Balkan-Ride-2027` und verknüpfe ihn mit GitHub:
   ```bash
   git init
   git branch -M main
   git remote add origin https://github.com/DEIN-BENUTZERNAME/balkan-ride-2027.git
   ```
3. **API-Key hinterlegen:** Hinterlege deinen Anthropic API-Key in GitHub unter `Settings` → `Secrets and variables` → `Actions` als Secret `ANTHROPIC_API_KEY`.
4. **Branch-Protection aktivieren:** Aktiviere unter `Settings` → `Branches` für `main` die Regel **Require a pull request before merging**.

---

## Phase 2: Einheitliche Befehlsdateien, Skills & 2-Stufen-Pipeline

### Ordnerstruktur (Projekt-Zielbild)
```text
Balkan-Ride-2027/
├── .github/
│   ├── copilot-instructions.md
│   ├── workflows/ai-agent-workflow.yml
│   └── scripts/agent_runner.py
├── config/
│   ├── commands/
│   │   ├── plan-item.md
│   │   └── implement-item.md
│   └── skills/
│       ├── plan-item/SKILL.md
│       └── implement-item/SKILL.md
├── content/
│   ├── tag-01.md
│   └── ... (bis tag-20.md)
├── assets/
│   ├── icons/          (PWA-Icons 192x192, 512x512, Apple-Touch-Icon)
│   ├── gpx/            (Gesamtroute + tag-01.gpx bis tag-20.gpx)
│   └── media/
│       ├── tag-01/     (Komprimierte Fotos & Videos für Step 1)
│       └── ... (bis tag-20/)
├── docs/
│   ├── Balkan_Tour_Pflichtenheft_V4.md
│   ├── master_ablauf_prompt_plan_v4.md
│   ├── todo_plan_v4.md
│   └── motorrad_checkliste_logistik.md
├── manifest.json
├── sw.js
└── index.html
```

### Schritt 2.1: Einheitliche Befehlsdateien (`config/commands/`)

#### Datei 1: `config/commands/plan-item.md`
```markdown
---
description: Analysiert ein GitHub-Issue und erstellt einen Umsetzungsplan ohne Codeänderungen.
---

# Aufgabe: Umsetzungsplan erstellen (`/plan-item`)

Du bist ein präziser KI-Projektassistent für das Motorrad-Roadbook "Balkan-Ride 2027".

## Deine strikten Regeln:
1. **Keine Dateiänderungen:** Du darfst in diesem Schritt KEINE Dateien erstellen, bearbeiten oder löschen.
2. **Analyse:** Lies den Titel und die Beschreibung des GitHub-Issues sowie die bestehenden Markdown-Dateien im Ordner `content/` und bei Bedarf `docs/motorrad_checkliste_logistik.md`.
3. **Planung:** Identifiziere, welche Etappen-Datei (z. B. `content/tag-05.md`) betroffen ist und welche YAML-Felder (`datum`, `titel`, `start`, `ziel`, `koordinaten_start`, `koordinaten_ziel`, `kilometer`, `fahrzeit`, `hoehenmeter`, `gpx_datei`, `highlights`, `bilder`, `videos`) oder Fließtexte angepasst werden müssen.
4. **Format:** Beginne deine Antwort EXAKT mit der Überschrift `## Umsetzungsplan`.
5. **Inhalt des Plans:**
   - **Betroffene Datei(en):** Liste die genauen Dateipfade auf.
   - **Geplante Änderungen:** Beschreibe stichpunktartig die geplanten YAML- und Textänderungen.
   - **Offene Fragen / Hinweise:** Stelle bei Unklarheiten im Sprachdiktat kurze Rückfragen.
6. **Abschluss-Hinweis:** Beende den Kommentar mit: *Freigabe erteilen: Kommentiere mit `/implement-item`, um die Umsetzung als Pull Request zu starten.*
```

#### Datei 2: `config/commands/implement-item.md`
```markdown
---
description: Setzt einen freigegebenen Umsetzungsplan in einem neuen Branch um und bereitet einen Pull Request vor.
---

# Aufgabe: Plan umsetzen (`/implement-item`)

Du bist ein KI-Code-Agent für das Motorrad-Roadbook "Balkan-Ride 2027".

## Deine strikten Regeln:
1. **Grundlage:** Lies das GitHub-Issue sowie den freigegebenen `## Umsetzungsplan` und eventuelle Antwort-Kommentare.
2. **Zielgenauigkeit:** Bearbeite AUSSCHLIESSLICH die im Plan vereinbarten Dateien im Ordner `content/`.
3. **YAML-Schema & Struktur erhalten:** Bewahre das vollständige YAML-Frontmatter exakt nach Pflichtenheft V4 (`tag`, `datum`, `titel`, `start`, `ziel`, `koordinaten_start`, `koordinaten_ziel`, `kilometer`, `fahrzeit`, `hoehenmeter`, `gpx_datei`, `highlights`, `bilder`, `videos`). Lösche keine bestehenden Koordinaten- oder Medienlisten!
4. **Tonfall:** Schreibe den Roadbook-Text im lockeren, direkten Biker-Slang ("Kurvenräuber", "Hobel", "Asphaltstrecke", "Kehren"), ohne Fakten, Tankstopp-Regeln oder Pass-Warnungen zu verwässern.
5. **Ausgabeformat:** Antworte AUSSCHLIESSLICH mit einem validen JSON-Objekt (Schlüssel = Dateipfad wie `"content/tag-05.md"`, Wert = vollständiger neuer Dateiinhalt) ohne Markdown-Codeblöcke.
```

### Schritt 2.2: Skill-Hüllen (`config/skills/`)
* **`config/skills/plan-item/SKILL.md`:** Verweist auf `config/commands/plan-item.md` mit `$ARGUMENTS`.
* **`config/skills/implement-item/SKILL.md`:** Verweist auf `config/commands/implement-item.md` mit `$ARGUMENTS`.

### Schritt 2.3: Die 2-Stufen GitHub Action (`.github/workflows/ai-agent-workflow.yml`)
```yaml
name: AI Roadbook 2-Stage Agent

on:
  issues:
    types: [opened]
  issue_comment:
    types: [created]

jobs:
  plan-stage:
    if: |
      vars.ROADBOOK_AGENT_USER != '' &&
      (
        (
          github.event_name == 'issues' &&
          github.event.action == 'opened' &&
          github.event.issue.user.login == vars.ROADBOOK_AGENT_USER
        ) ||
        (
          github.event_name == 'issue_comment' &&
          github.event.action == 'created' &&
          !github.event.issue.pull_request &&
          github.event.comment.user.login == vars.ROADBOOK_AGENT_USER &&
          contains(github.event.comment.body, '/plan-item')
        )
      )
    runs-on: ubuntu-latest
    permissions:
      contents: read
      issues: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.10'
      - run: pip install requests anthropic
      - name: Stufe 1 - Plan erstellen
        env:
          MODE: "plan"
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          ISSUE_NUMBER: ${{ github.event.issue.number }}
          REPOSITORY: ${{ github.repository }}
        run: python .github/scripts/agent_runner.py

  implement-stage:
    if: |
      github.event_name == 'issue_comment' &&
      github.event.action == 'created' &&
      vars.ROADBOOK_AGENT_USER != '' &&
      github.event.comment.user.login == vars.ROADBOOK_AGENT_USER &&
      !github.event.issue.pull_request &&
      contains(github.event.comment.body, '/implement-item')
    runs-on: ubuntu-latest
    permissions:
      contents: write
      issues: write
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.10'
      - run: pip install requests anthropic
      - name: Stufe 2 - Umsetzung & Pull Request
        env:
          MODE: "implement"
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          ISSUE_NUMBER: ${{ github.event.issue.number }}
          REPOSITORY: ${{ github.repository }}
        run: python .github/scripts/agent_runner.py
```

### Schritt 2.4: Das Python-Runner-Skript (`.github/scripts/agent_runner.py`)
```python
import os, json, re, subprocess, requests, anthropic

MODE = os.environ.get("MODE", "plan")
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN")
ISSUE_NUMBER = os.environ.get("ISSUE_NUMBER")
REPOSITORY = os.environ.get("REPOSITORY")
HEADERS = {"Authorization": f"Bearer {GITHUB_TOKEN}", "Accept": "application/vnd.github+json"}

def get_issue_context():
    url = f"https://api.github.com/repos/{REPOSITORY}/issues/{ISSUE_NUMBER}"
    issue = requests.get(url, headers=HEADERS).json()
    comments = requests.get(f"{url}/comments", headers=HEADERS).json()
    c_text = "\n\n".join([f"{c['user']['login']}: {c['body']}" for c in comments])
    return issue.get("title", ""), issue.get("body", ""), c_text

def post_comment(body):
    requests.post(f"https://api.github.com/repos/{REPOSITORY}/issues/{ISSUE_NUMBER}/comments", json={"body": body}, headers=HEADERS)

def load_files():
    data = {}
    if os.path.exists("content"):
        for fn in sorted(os.listdir("content")):
            if fn.endswith(".md"):
                p = os.path.join("content", fn)
                with open(p, "r", encoding="utf-8") as f:
                    data[p] = f.read()
    return data

def main():
    if not ANTHROPIC_API_KEY:
        return
    title, body, comments = get_issue_context()
    files = load_files()
    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    if MODE == "plan":
        with open("config/commands/plan-item.md", "r", encoding="utf-8") as f:
            instr = f.read()
        prompt = f"{instr}\n\nDateien:\n{json.dumps(files, ensure_ascii=False)}\n\nTicket #{ISSUE_NUMBER}: {title}\n{body}\nKommentare:\n{comments}"
        res = client.messages.create(model="claude-3-5-sonnet-20241022", max_tokens=2500, temperature=0.2, messages=[{"role": "user", "content": prompt}])
        post_comment(res.content[0].text.strip())

    elif MODE == "implement":
        with open("config/commands/implement-item.md", "r", encoding="utf-8") as f:
            instr = f.read()
        prompt = f"{instr}\n\nDateien:\n{json.dumps(files, ensure_ascii=False)}\n\nTicket #{ISSUE_NUMBER}: {title}\n{body}\nPlan & Kommentare:\n{comments}"
        res = client.messages.create(model="claude-3-5-sonnet-20241022", max_tokens=4000, temperature=0.2, messages=[{"role": "user", "content": prompt}])
        raw = re.sub(r"^```(json)?\s*|\s*```$", "", res.content[0].text.strip())
        try:
            changes = json.loads(raw)
            branch = f"feature/issue-{ISSUE_NUMBER}"
            subprocess.run(["git", "config", "--global", "user.name", "AI Roadbook Agent"], check=True)
            subprocess.run(["git", "config", "--global", "user.email", "agent@balkan-ride.local"], check=True)
            subprocess.run(["git", "checkout", "-b", branch], check=True)
            updated = []
            for path, content in changes.items():
                if path.startswith("content/") and path.endswith(".md"):
                    with open(path, "w", encoding="utf-8") as f:
                        f.write(content)
                    updated.append(path)
            if not updated:
                post_comment("Keine gültigen Dateien im Ordner content/ erkannt.")
                return
            subprocess.run(["git", "add", "content/"], check=True)
            subprocess.run(["git", "commit", "-m", f"feat: Umsetzung Issue #{ISSUE_NUMBER}"], check=True)
            subprocess.run(["git", "push", "-u", "origin", branch], check=True)
            pr = requests.post(f"https://api.github.com/repos/{REPOSITORY}/pulls", json={"title": f"Update (Issue #{ISSUE_NUMBER}): {title}", "head": branch, "base": "main", "body": f"Geänderte Dateien: {', '.join(updated)}\n\nCloses #{ISSUE_NUMBER}"}, headers=HEADERS).json()
            post_comment(f"Umsetzung bereit zur Prüfung im Pull Request: {pr.get('html_url', '')}")
        except Exception as e:
            post_comment(f"Fehler: {e}")

if __name__ == "__main__":
    main()
```

---

### Inbetriebnahme des V4-Grundgerüsts

* Lege unter **Settings → Secrets and variables → Actions** das Secret `ANTHROPIC_API_KEY` und die Repository-Variable `ROADBOOK_AGENT_USER` (dein GitHub-Login) an. Ohne den konfigurierten Login läuft keine Stufe. Die optionale Variable `ANTHROPIC_MODEL` überschreibt das Standardmodell `claude-sonnet-4-6`; die Claude-3.5-Modell-ID aus der Vorlage wird nicht mehr verwendet.
* Erlaube unter **Settings → Actions → General → Workflow permissions** das Erstellen von Pull Requests durch GitHub Actions. Schütze `main` mit der Pflicht zum Pull Request.
* Eröffne nach dem Upload ein Test-Issue mit einem Änderungswunsch für Tag 01. Prüfe den geposteten Umsetzungsplan und kommentiere danach exakt `/implement-item`. Wurde das Issue seit der Planung inhaltlich geändert, erstelle mit einem Kommentar `/plan-item` einen neuen Plan. Prüfe den PR vor dem Merge.
* Der Agent übergibt die relevanten Roadbook-Dateien und den Aufgabenkontext an die Anthropic API. Verwende dafür keine vertraulichen Inhalte oder Zugangsdaten.
* Die Skill-Hüllen liegen wie vorgesehen in `config/skills/`, nicht in einem Standardordner für die automatische Copilot-Erkennung. Lokal kannst du die jeweilige `SKILL.md` als Chat-Kontext anhängen und die Argumente im Chat angeben.
* Die Referenzetappe enthält die GPX- und Medienpfade aus dem Pflichtenheft. Die Dateien hinter diesen Pfaden kommen erst in Phase 3 hinzu.

## Phase 3: Daten-Migration aus Excel & Polarsteps-Web-App (inkl. PWA)

* **Prompt 1 (Etappen-Dateien aus Excel im V4-Schema):**
  > *"Lies `docs/Balkan_Tour_Pflichtenheft_V4.md` und `docs/motorrad_checkliste_logistik.md`. Hier sind die Rohdaten meiner Excel-Tabelle für unsere 20-tägige Motorradtour: [EXCEL-DATEN]. Erstelle im Ordner `content/` für jeden Tag eine eigene Markdown-Datei (`tag-01.md` bis `tag-20.md`) exakt nach dem erweiterten YAML-Schema aus Abschnitt 3A des Pflichtenhefts V4 (`tag`, `datum`, `titel`, `start`, `ziel`, `koordinaten_start`, `koordinaten_ziel`, `kilometer`, `fahrzeit`, `hoehenmeter`, `gpx_datei`, `highlights`, `bilder`, `videos`) und schreibe packende Roadbook-Texte im authentischen Biker-Slang."*

* **Prompt 2 (Polarsteps-Style Web-Roadbook & PWA):**
  > *"Lies `docs/Balkan_Tour_Pflichtenheft_V4.md` (Abschnitt 1, 2 und 4B/C). Erstelle die mobile Web-App im Dark-Adventure-Design mit Tailwind CSS und Leaflet.js (`index.html`), die alle Dateien aus `content/` dynamisch lädt. Implementiere das Polarsteps-Prinzip: geografische Gesamtrouten-Ansicht mit nummerierten Pins, tageweise Step-Navigation (Vorheriger/Nächster Step + Pin-Klick), geschmeidige Karten-Synchronisation (`flyTo`), Split-Screen am Desktop, Bottom-Sheet auf Mobilgeräten sowie eine integrierte Foto-/Video-Galerie mit Lightbox und Lazy Loading. Ergänze `manifest.json` (Name: `Balkan-Ride 2027`, Kurzname: `BalkanRide`) und `sw.js` für die Homescreen-Installation als PWA."*

---

## Phase 4: Der mobile 2-Stufen-Härtetest & Live-Gang
1. **GitHub Pages aktivieren:** Unter `Settings` → `Pages` den `main`-Branch live schalten.
2. **Stufe 1 testen:** In der GitHub-App ein Issue per Sprachdiktat anlegen und den `## Umsetzungsplan` des Agenten prüfen.
3. **Stufe 2 testen:** Mit `/implement-item` kommentieren, den erzeugten Pull Request in der App prüfen und per **Merge pull request** live schalten.
4. **PWA & Medien prüfen:** Live-Link auf dem Smartphone als PWA auf dem Homescreen installieren und Karten-`flyTo`, Lightbox-Galerie sowie GPX-Downloads testen.

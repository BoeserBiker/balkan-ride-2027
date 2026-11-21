# To-Do-Plan: Balkan-Ride 2027 (Von Excel zur Polarsteps-Web-App & PWA) – Version 4
*(Abgestimmt auf `docs/Balkan_Tour_Pflichtenheft_V4.md` und `docs/master_ablauf_prompt_plan_v4.md`)*

---



## Phase 1: Vorbereitung, Repository & Branch-Schutz (Tag 1)
*Ziel: Den VS-Code-Workspace und das abgesicherte GitHub-Repository `balkan-ride-2027` startklar machen.*

* [ ] **Git & GitHub Repository anlegen**◊◊
  * [x] Privaten GitHub-Account einrichten (2FA aktivieren) und das neue Repository **`balkan-ride-2027`** erstellen.
  * [ ] Lokalen Workspace-Ordner `Balkan-Ride-2027` im Terminal öffnen und mit Git verknüpfen (`git init`, `git branch -M main`, `git remote add origin ...`).
* [ ] **Sicherheit & Branch-Protection konfigurieren**
  * [ ] Anthropic API-Key erstellen und in GitHub unter `Settings` → `Secrets and variables` → `Actions` als Secret `ANTHROPIC_API_KEY` hinterlegen.
* [ ] **Workspace-Dokumente & Ordnerstruktur anlegen**
  * [x] Alle 4 Planungs- und Vorgabedateien in `docs/` ablegen (`Balkan_Tour_Pflichtenheft_V4.md`, `master_ablauf_prompt_plan_v4.md`, `todo_plan_v4.md`, `motorrad_checkliste_logistik.md`) und `.github/copilot-instructions.md` prüfen.
  * [x] Projektordner anlegen: `.github/workflows/`, `.github/scripts/`, `config/commands/`, `config/skills/plan-item/`, `config/skills/implement-item/`, `content/`, `assets/icons/`, `assets/gpx/`, `assets/media/`.

---

## Phase 2: Einheitliche Skills & zweistufige Automatisierung (Tag 2)
*Ziel: Das Regelwerk („Erst planen, dann bauen“) definieren und den Cloud-Agenten für Issues & Pull Requests scharfstellen.*

* [ ] **Einheitliche Befehlsdateien & Skills anlegen (Single Source of Truth)**
  * [ ] `config/commands/plan-item.md` mit YAML-Frontmatter (`description`) und Regeln für Analyse, YAML-V4-Prüfung und Erstellung des `## Umsetzungsplan`-Kommentars anlegen.
  * [ ] `config/commands/implement-item.md` mit Regeln für Branch-Erstellung (`feature/issue-XX`), Beibehaltung des V4-YAML-Schemas (inkl. Koordinaten & Medien) und Pull-Request-Eröffnung anlegen.
  * [ ] Passende Skill-Hüllen unter `config/skills/plan-item/SKILL.md` und `config/skills/implement-item/SKILL.md` anlegen.
* [ ] **GitHub Action & Python-Skript einfügen**
  * [ ] `.github/workflows/ai-agent-workflow.yml` anlegen (Trigger auf `issues: [opened]` und `issue_comment: [created]`, Benutzer-Filter auf eigenen Account, Berechtigungen `contents: write`, `issues: write`, `pull-requests: write`).
  * [ ] `.github/scripts/agent_runner.py` anlegen (liest Command-Dateien aus `config/commands/`, erstellt Branches und Pull Requests statt direkter `main`-Commits).
* [ ] **Ersten Basis-Upload durchführen**
  * [ ] Grundstruktur mit `git add .`, `git commit -m "Setup v4"` und `git push` auf GitHub hochladen.

---

## Phase 3: Daten-Import aus Excel, Polarsteps-UI & PWA (Tag 3–5)
*Ziel: Die 20 Tourtage im V4-YAML-Format migrieren, das Polarsteps-Roadbook bauen und als PWA konfigurieren.*

* [ ] **Excel-Daten & Medienstruktur vorbereiten**
  * [ ] Spalten aus der bestehenden Excel-Tabelle strukturieren (Tag, Datum, Titel, Start, Ziel, Koordinaten Start/Ziel, Kilometer, Fahrzeit, Höhenmeter, Highlights).
  * [ ] Unterordner `assets/media/tag-01/` bis `tag-20/` anlegen und erste Fotos auf max. `1600 px` Breite (WebP/JPEG, `200–400 KB`) optimieren; GPX-Tracks in `assets/gpx/` ablegen.
* [ ] **Die 20 Markdown-Dateien anlegen (`content/tag-01.md` bis `tag-20.md`)**
  * [ ] Über den VS-Code Copilot Agenten aus den Excel-Rohdaten im erweiterten YAML-V4-Schema (inkl. `koordinaten_start`, `koordinaten_ziel`, `bilder`, `videos`) und authentischem Biker-Slang generieren lassen.
* [ ] **Polarsteps-Style Web-Roadbook bauen (`index.html`)**
  * [ ] Responsive Web-App im Dark-Adventure-Look mit Tailwind CSS und Leaflet.js erstellen.
  * [ ] Geografische Gesamtrouten-Ansicht, nummerierte Tages-Pins, Step-Navigation (`Tag 01` bis `Tag 20`), bidirektionale Karten-Synchronisation (`flyTo`), Desktop-Split-Screen und Mobile-Bottom-Sheet umsetzen.
  * [ ] Multimediale Step-Karten mit Foto-/Video-Galerie, Lightbox-Vollbildansicht und Lazy Loading integrieren.
* [ ] **PWA-Funktionen integrieren (Pflichtszenario)**
  * [ ] `manifest.json` (App-Name `Balkan-Ride 2027`, Kurzname `BalkanRide`, Vollbildmodus `standalone`) und App-Icons (`192x192`, `512x512`, Apple-Touch-Icon) in `assets/icons/` anlegen.
  * [ ] Service Worker (`sw.js`) für kontrolliertes Caching und schnelle Updates nach PR-Merges einrichten und in `index.html` verknüpfen.

---

## Phase 4: Handy-Härtetest & zweistufige Iterations-Runden (Tag 6–12)
*Ziel: Den gesamten mobilen 2-Stufen-Workflow vom Smartphone aus testen und die Tourinhalte feinschleifen.*

* [ ] **Der Härtetest vom Handy aus (End-to-End-Test)**
  * [ ] Offizielle GitHub-App auf dem Smartphone installieren und einloggen.
  * [ ] Test-Issue über die Handy-Sprachdiktierfunktion eröffnen → prüfen, ob der Agent automatisch mit `## Umsetzungsplan` kommentiert.
  * [ ] Mit `/implement-item` kommentieren → prüfen, ob ein Feature-Branch angelegt und ein Pull Request eröffnet wird.
  * [ ] Änderungen im Pull Request auf dem Handy prüfen und mit **„Merge pull request“** freigeben.
* [ ] **Durchlauf der Verbesserungsrunden**
  * [ ] Etappentexte, Tankstellen-Hinweise (150-km-Regel), Pass-Infos, Fotos/Videos und Biker-Slang Schritt für Schritt über den Ticket- und PR-Workflow verfeinern.

---

## Phase 5: Finales Testing & Live-Gang (Tag 13–14)
*Ziel: Sicherstellen, dass PWA, Polarsteps-Karten, Medien-Galerien, GPX-Downloads und Sicherheitsregeln fehlerfrei laufen.*

* [ ] **Funktions-, Medien- & Offline-Test (PWA)**
  * [ ] GitHub Pages unter `Settings` → `Pages` aktivieren.
  * [ ] Live-URL (`https://...`) auf iOS und Android im mobilen Browser öffnen und über *„Zum Home-Bildschirm hinzufügen“* als App installieren.
  * [ ] Prüfen, ob Karten-`flyTo`, Lightbox-Bilder/Videos, Aktualisierungen nach einem PR-Merge sowie GPX-Downloads einwandfrei funktionieren.
* [ ] **Sicherheits- & Agenten-Stresstest**
  * [ ] Prüfen, dass unbefugte GitHub-Accounts den Agenten nicht auslösen können und direkte Pushes auf `main` blockiert sind.
  * [ ] Projekt-Link und PWA-Installationsanleitung an die Tourteilnehmer verteilen.

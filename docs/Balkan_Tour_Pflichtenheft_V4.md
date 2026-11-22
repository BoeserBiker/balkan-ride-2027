### Pflichtenheft & Projektplan: Balkan-Motorradtour 2027 (Web-Roadbook, Polarsteps-Style PWA & KI-Agent) – Version 4

#### 1. Zieldefinition
Entwicklung einer hochprofessionellen, mobilen und leicht bedienbaren Web-Präsentationsplattform (Roadbook) für eine 22-tägige Motorrad-Expedition über den Balkan (Slowenien bis Griechenland und zurück). Das Ziel ist es, Mitfahrer durch anspruchsvolle Routenbeschreibungen, interaktive Karten und authentischen Biker-Slang zu begeistern.

* **Visuelles & funktionales Leitbild (Polarsteps-Prinzip – Pflicht):**
  * **Geografische Gesamtrouten-Ansicht:** Darstellung des kompletten Tourverlaufs (Etappen-Verbindungslinie, GPX-Track und nummerierte Wegpunkte/Pins für alle 22 Reisetage) auf einer interaktiven Karte.
  * **Tageweise Steps (1 Step = 1 Reisetag):** Chronologische Navigation von Step zu Step (`Tag 01` bis `Tag 22`) über „Vorheriger / Nächster Step“-Steuerung oder direkte Pin-Auswahl auf der Karte.
  * **Bidirektionale Karten-Synchronisation:** Beim Wechsel zu einem Reisetag zoomt und zentriert die Karte geschmeidig (`flyTo`) auf den entsprechenden Tagesabschnitt und hebt den aktiven Step visuell hervor.
  * **Multimediale Step-Karten:** Jeder Reisetag vereint Eckdaten (Datum, Start/Ziel, Kilometer, Fahrzeit, Höhenmeter, Highlights), authentische Roadbook-Beschreibungen im Biker-Slang sowie eine integrierte **Foto- und Video-Galerie** (inkl. Lightbox-Vollbildansicht).
* **Zweistufiges, kontrolliertes Change Management (Pflicht):** Anpassungen und Korrekturen sollen weiterhin bequem von unterwegs per **Spracheingabe am Smartphone** über GitHub-Issues eingepflegt werden. Um unkontrollierte Änderungen am Live-System zu verhindern, arbeitet der autonome KI-Agent nach dem Prinzip **„Erst planen, dann bauen“**:
  1. **Planungsphase (`/plan-item`):** Der Agent analysiert das Issue und erstellt zunächst einen verbindlichen Umsetzungsplan als Kommentar.
  2. **Umsetzungsphase (`/implement-item`):** Erst nach ausdrücklicher Freigabe durch den Nutzer legt der Agent einen eigenen Arbeitszweig (*Branch*) an, setzt die Änderungen um und erstellt einen **Pull Request (PR)** gegen den Hauptzweig (`main`).
  3. **Live-Freigabe:** Die Veröffentlichung erfolgt erst nach Prüfung und 1-Klick-Merge des Pull Requests durch den Projektleiter.
* **Installierbare Smartphone-App (PWA – Pflicht):** Potenzielle Tourteilnehmer und Mitfahrer sollen das Roadbook als Progressive Web App (PWA) direkt über den mobilen Browser (iOS / Android) auf dem Homescreen ihres Smartphones installieren und im App-ähnlichen Vollbildmodus nutzen können – ohne Umweg über App Stores.

---

#### 2. Technische Architektur & Tech-Stack
* **Frontend & UI-Layout (Polarsteps-Style):**
  * **Technologies:** HTML5, Tailwind CSS (Dark Adventure Design), Vanilla JavaScript (ES6+), Leaflet.js (interaktive OpenStreetMap-/Topografie-Karten).
  * **Build:** Der App-Quellcode liegt unter `web/` und wird mit Vite ohne Laufzeit-Framework gebaut. Beim Build werden alle `content/tag-*.md`-Dateien samt YAML-Frontmatter eingelesen; das Ergebnis liegt unter `web/dist/` und verwendet den GitHub-Pages-Unterpfad `/balkan-ride-2027/`.
  * **Responsives Split-/Sheet-Layout:** Desktop als Split-Screen (interaktive Karte links, scrollbare Step-Chronik rechts); Mobile/PWA mit fixierter oberer Kartenansicht und interaktivem Bottom-Sheet bzw. Step-Switcher für Einhandbedienung.
* **PWA-Erweiterung (Pflicht):** Web App Manifest (`web/public/manifest.json`), Service Worker (`web/public/sw.js`) sowie App-Icons aus `assets/icons/` und Einbindung in `web/index.html` zur Homescreen-Installation und kontrollierten Zwischenspeicherung.
* **Datenhaltung (Micro-Files & Medien):**
  * Aufteilung der 22 Reisetage des geprüften Final-Plans V7 in einzelne Markdown-Dateien (`content/tag-01.md` bis `content/tag-22.md`) mit dem erweiterten YAML-Frontmatter für Geokoordinaten, Etappendaten sowie strukturierte Medienlisten (`bilder`, `videos`). Das V4-Feldschema bleibt unverändert.
  * Ablage von komprimierten Tourfotos, Vorschaubildern (Thumbnails) und GPX-Tracks in organisierten Unterordnern unter `assets/`.
* **Einheitliche Befehlsdateien & Skills (Single Source of Truth):** Auslagerung der KI-Arbeitsanweisungen in strukturierte Markdown-Dateien (`config/commands/` und `config/skills/`), sodass sowohl der Cloud-Agent als auch lokale Werkzeuge (z. B. in VS Code) nach identischen Regeln arbeiten.
* **Automatisierung / CI/CD & Branch-Schutz:** GitHub Actions triggert auf neue Issues sowie auf Freigabe-Kommentare. Direkte Schreibvorgänge auf den `main`-Branch sind für den Agenten untersagt; alle Änderungen laufen über Feature-Branches und Pull Requests.
* **GitHub-Pages-Deployment:** `.github/workflows/deploy-pages.yml` baut und veröffentlicht `web/dist/` bei Pushes auf `main`; in den Repository-Einstellungen muss GitHub Pages als Quelle „GitHub Actions“ verwenden.
* **KI-Agent:** Python-Skript (`.github/scripts/agent_runner.py`) unter Nutzung der Anthropic API (Claude 3.5 Sonnet) zur zweistufigen Bearbeitung einzelner Markdown-Dateien.

---

#### 3. Datenmodell & Ordnerstruktur des Workspaces

##### A) Erweitertes YAML-Frontmatter pro Step (`content/tag-XX.md`)
Jeder Reisetag bildet einen eigenständigen Step mit geografischen Koordinaten, Routenmetadaten und Medien-Referenzen:
```yaml
---
tag: 1
datum: "2027-06-05"
titel: "Anreise & Einstieg in die Julischen Alpen"
start: "Villach"
ziel: "Bovec (Soca-Tal)"
koordinaten_start: [46.6111, 13.8558]
koordinaten_ziel: [46.3381, 13.5524]
kilometer: 145
fahrzeit: "3h 15m"
hoehenmeter: 1850
gpx_datei: "assets/gpx/tag-01.gpx"
highlights:
  - "Wurzenpass (18 % Steigung)"
  - "Vrsic-Pass (50 Kehren)"
bilder:
  - datei: "assets/media/tag-01/vrsic-kehren.jpg"
    beschreibung: "Blick vom Vrsic-Pass Richtung Trenta-Tal"
videos:
  - typ: "mp4" # alternativ "youtube"
    quelle: "assets/media/tag-01/soca-fahrt.mp4"
    poster: "assets/media/tag-01/soca-poster.jpg"
    titel: "Kurventanz entlang der smaragdgrünen Soca"
---
Hier folgt der atmosphärische Roadbook-Text im authentischen Biker-Slang...
```

##### B) Verzeichnisstruktur
```text
balkan-tour-2027/
├── .github/
│   ├── workflows/
│   │   ├── ai-agent-workflow.yml
│   │   └── deploy-pages.yml
│   └── scripts/
│       └── agent_runner.py
├── config/
│   ├── commands/
│   │   ├── plan-item.md
│   │   └── implement-item.md
│   └── skills/
│       ├── plan-item/SKILL.md
│       └── implement-item/SKILL.md
├── content/
│   ├── tag-01.md
│   ├── tag-02.md
│   └── ... (bis tag-22.md)
├── assets/
│   ├── icons/          (PWA-Icons 192x192, 512x512, Apple-Touch-Icon)
│   ├── gpx/            (Gesamtroute + tag-01.gpx bis tag-22.gpx)
│   └── media/
│       ├── tag-01/     (Komprimierte Fotos & Videos für Step 1)
│       └── ... (bis tag-22/)
├── web/
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   ├── vite.config.js
│   ├── src/            (Vanilla-JS-App, Leaflet-Karte und Styles)
│   └── public/
│       ├── manifest.json
│       └── sw.js
├── app_spezifikation_polarsteps.md
├── Balkan_Tour_Pflichtenheft_V4.md
└── todo_plan.md
```

---

#### 4. Workflows, Skills & Agenten-Logik sowie PWA-Nutzung

##### A) Zweistufiger Agenten- & Update-Workflow (Plan → Build → PR)
1. **Idee / Änderungswunsch:** Der Nutzer erstellt am Smartphone (über die GitHub-App mit Sprachdiktat) ein neues Issue (z. B. Textanpassung, neue Highlights oder Verknüpfung neuer Medien für einen Reisetag).
2. **Stufe 1 – Planung (`/plan-item`):**
   * GitHub Actions startet `agent_runner.py` im Planungsmodus bei einem neuen Issue (`issues: opened`) des konfigurierten GitHub-Benutzers oder bei einem Kommentar (`issue_comment: created`) mit exakt `/plan-item` von diesem Benutzer. Pull-Request-Kommentare lösen keine Planungsstufe aus.
   * Der Agent lädt die Regeln aus `config/commands/plan-item.md`, analysiert die betroffene Datei (z. B. `content/tag-05.md`), ändert **keinen Code** und postet einen strukturierten Kommentar beginnend mit `## Umsetzungsplan` (inklusive eventueller Rückfragen).
3. **Prüfung & Freigabe durch den Nutzer:**
   * Der Nutzer prüft den Plan direkt in der GitHub-App auf dem Smartphone. Ist er einverstanden, kommentiert er das Ticket mit **`/implement-item`**. Für eine erneute Planung kommentiert er exakt **`/plan-item`**.
4. **Stufe 2 – Umsetzung & Pull Request (`/implement-item`):**
   * GitHub Actions reagiert auf den Kommentar (`issue_comment: created`), lädt die Regeln aus `config/commands/implement-item.md` und startet `agent_runner.py` im Umsetzungsmodus.
   * Der Agent legt einen eigenen Arbeitszweig (`feature/issue-<nummer>`) an, überarbeitet die betreffende Etappen-Datei unter Beibehaltung des vollständigen YAML-Schemas (inklusive Koordinaten- und Medienfeldern) im gewünschten Biker-Slang, committet die Änderung auf den Branch und eröffnet automatisch einen **Pull Request (PR)** gegen `main` (mit Referenz `Closes #<nummer>`).
5. **Finale Kontrolle & Live-Schaltung:**
   * Der Nutzer prüft in der GitHub-App die hervorgehobenen Textänderungen (Diff) im Pull Request und gibt das Update per **„Merge pull request“** für den Hauptzweig (`main`) und damit für die Live-Webseite frei.

##### B) Medien- & Performance-Richtlinien (GitHub Pages & Mobilfunk)
1. **Bildoptimierung:** Fotos vor dem Upload ins Repository auf max. `1600 px` Breite und WebP/JPEG (ca. `200–400 KB`) komprimieren, damit die Galerie auch bei schwachem Mobilfunknetz schnell lädt.
2. **Video-Einbindung:** Kurze Clips (`< 15–20 MB`, MP4/H.264) mit `preload="metadata"` und Poster-Bild direkt einbinden; längere Tourenvideos über ungelistete YouTube-/Vimeo-Embeds referenzieren, um das Repository schlank zu halten.
3. **Lazy Loading:** Bilder und Video-Player in nicht aktiven Steps werden erst bei Aufruf des jeweiligen Reisetags nachgeladen.

##### C) Pflichtszenario Tourteilnehmer-App (PWA)
1. **Aufruf & Installation:** Teilnehmer öffnen den `https://`-Link der veröffentlichten Seite (GitHub Pages) im mobilen Browser und legen die Anwendung über „Zum Home-Bildschirm hinzufügen“ / „App installieren“ als Icon auf dem Smartphone ab.
2. **Polarsteps-App-Erlebnis:** Start über das eigene Tour-Icon im Vollbildmodus mit Dark-Adventure-Optik, geografischer Gesamtroute, tageweiser Step-Navigation und integrierter Foto-/Video-Galerie pro Reisetag.
3. **Aktualität vs. Funklöcher:** Bei bestehender Verbindung müssen geänderte Etappeninhalte nach einem Pull-Request-Merge zuverlässig aktualisiert werden, während Offline-Zwischenspeicherung nur ergänzend wirkt und dedizierte GPX-Tracks sowie Offline-Karten auf Navi/Gerät für die Navigation in Regionen ohne Empfang (z. B. Gebirgspässe) nicht ersetzt.

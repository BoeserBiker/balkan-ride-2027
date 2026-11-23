## Arbeitsstand – Balkan-Ride 2027

**Stand:** 2026-11-22

**Workspace:** `Balkan-Ride-2027`  
**Leitdokument:** [.github/Dokumentationskonzept.md](../.github/Dokumentationskonzept.md)

## Aktueller Stand

- Workspace-Check am 2026-11-22: 19 Python- und vier Frontend-Tests sowie
  der Produktionsbuild erfolgreich. Alle 22 Etappen besitzen jeweils vier
  lokal lesbare Querformatbilder und einen strukturell gültigen
  YouTube-Nocookie-Eintrag; 21 GPX-Segmente haben 161–300 Punkte, D19 keinen
  Track. Bildinhalt, Videoverfügbarkeit und Videolaufzeit wurden dabei nicht
  online geprüft.
- `main` entsprach beim Check dem Remote-Stand `9d35be8`; der zugehörige
  GitHub-Pages-Lauf war erfolgreich. Zwei zunächst beanstandete ungültige
  Git-Referenznamen waren bei der Wiederholungsprüfung nicht mehr vorhanden;
  `git fsck` verlief anschließend ohne Befund. Ursache und Dauerhaftigkeit
  der Änderung sind unbekannt.
- Das Grundgerüst der Phasen 1 und 2 ist angelegt: GitHub-Workflow, Runner,
  Befehlsdateien, Skill-Hüllen und Referenzetappe `content/tag-01.md`.
- [x] **Phase 2 abgeschlossen:** Beide Agentenstufen liefen live; der Agent
  erstellte PR #2, der gemergt wurde. Alle Phase-2-Arbeitspunkte sind im
  [To-do-Plan](../docs/todo_plan_v4.md) abgehakt.
- Das öffentliche GitHub-Repository
  `https://github.com/BoeserBiker/balkan-ride-2027` ist mit lokalem `main`
  verbunden; der erste Commit `Setup V4 Grundgerüst` wurde gepusht.
- GitHub Actions ist aktiviert. Das Secret `ANTHROPIC_API_KEY` sowie die
  Repository-Variablen `ROADBOOK_AGENT_USER` und `ANTHROPIC_MODEL` sind
  vorhanden. Der Secret-Wert wurde nicht ausgelesen.
- Der Workflow ist aktiv. Nach Korrektur der Kommentar-Trigger in Commit
  `b9cd272` liefen Planungs- und Implementierungsstufe am 2026-11-22
  erfolgreich; [PR #2](https://github.com/BoeserBiker/balkan-ride-2027/pull/2)
  wurde durch den Agenten erstellt und gemergt.
- Die klassische Branch Protection war zunächst für das private Repository
  nicht verfügbar. Nach der Umstellung auf ein öffentliches Repository ist
  die PR-Pflicht für `main` laut Nutzer aktiv und getestet. Beim aktuellen
  Push meldete GitHub jedoch, dass die PR-Regel umgangen wurde; daher
  weiterhin bevorzugt Pull Requests verwenden und die Bypass-Konfiguration
  prüfen.
- Die Befehlsdateien wurden mit den Vorlagen des Master-Plans verglichen; das
  YAML der Referenzetappe wurde gegen Abschnitt 3A geprüft. Der Agent-Workflow
  wurde mit Issue #1 live durchlaufen; PR #2 wurde am 2026-11-22 gemergt.
- Die Phase-3-Web-App ist unter `web/` als Vanilla-JavaScript-Anwendung mit
  Vite, Tailwind CSS und Leaflet umgesetzt. Der Build liest alle
  `content/tag-*.md`-Dateien samt YAML-Frontmatter ein. Die Kartenansicht
  stellt vorhandene Start-/Zielpunkte und GPX-Wegpunkte dar; fehlende
  Fahrspur-Tracks und Mediendateien werden als solche kenntlich gemacht.
- PWA-Manifest, Service Worker und Icons in den Größen 192, 512 und Apple
  Touch sind vorhanden. `.github/workflows/deploy-pages.yml` baut und
  veröffentlicht `web/dist/` bei Pushes auf `main`.
- Das Reiseenduro-Motiv liegt als gemeinsame SVG-Vorlage in
  [`web/public/favicon.svg`](../web/public/favicon.svg); die drei PNG-Icons
  liegen daneben. Header, HTML und Manifest verwenden dasselbe Motiv.
  Das Motorrad zeigt nach links und trägt blaue und weiße Akzente.
  Service-Worker-Cache und Icon-URLs sind auf Version 3 gesetzt. Die
  tatsächliche Aktualisierung bereits installierter Homescreen-Icons auf
  iOS und Android muss auf Geräten geprüft werden.
- Der geprüfte Final-Plan V7 aus dem Geschwister-Workspace ist für alle
  22 Kalendertage (08.–29.09.2027) in
  [`content/tag-01.md`](../content/tag-01.md) bis
  [`content/tag-22.md`](../content/tag-22.md) übertragen. Die V7-Kilometer,
  Modellzeiten und GPS-Endpunkte bleiben erhalten. Jede Etappe hat vier
  Commons-Fotos mit Urheber- und Lizenznachweis sowie ein vorhandenes
  YouTube-Video. Routenhöhen sind ausdrücklich vorläufige Schätzungen.
- Der V7-Wegpunktplan und CSV-Kartenimport liegen unter
  [`assets/gpx/`](../assets/gpx/). Die Leaflet-Karte zeigt Haupt-, Alternativ-
  und Options-Wegpunkte sowie die `FAEHRE`-Gruppe; D19 erhält keine Linie über
  See. Der Plan enthält keine geprüften Fahrspur-Tracks.
- Alle 22 Tages-GPX-Dateien wurden am 2026-11-22 aus den V7-Hauptrouten
  erzeugt. Douglas-Peucker reduziert jedes Fahrsegment mit einer Toleranz von
  0,0002 Grad und höchstens 300 Trackpunkten; exportiert werden nur
  PKW-/MOTORRAD-Orientierungspunkte. Die Straßen-Tracks enthalten 161 bis 300
  Punkte; D19 hat keinen Track. Die Dateien sind 293 bis 16.163 Byte groß,
  gültiges XML und enthalten keine Alternativ-, Options- oder Fährwegpunkte.
  Zehn Generator-Tests und der Frontend-Build waren erfolgreich.
- Die Anzahl der Trackpunkte pro Segment ist über
  `--max-track-points` bis maximal 300 einstellbar (Standard 300). Nach jedem
  Import oder einer Änderung an den Eingabedateien kann der Generator direkt
  erneut gestartet werden; die Vorgaben halten fest, GPX, CSV und V7-Plan
  abzugleichen.
- Die allgemeinen Copilot-Vorgaben verweisen auf die
  [Riderrix-Agentendatei](../.github/agents/riderrix.agent.md) als zentrale
  Anweisung. Dort ist `TRACKPUNKTE_MAX` als Agentenvorgabe einstellbar; der
  Agent muss den Wert als `--max-track-points` übergeben. Ein manueller
  Skriptaufruf liest die Agentendatei nicht automatisch.
- Geprüfte Fahrspur-GPX-Tracks fehlen weiterhin. Die V7-Buchungen und
  Klosterzeiten sind offen; die Prüfpunkte stehen in
  [`docs/motorrad_checkliste_logistik.md`](../docs/motorrad_checkliste_logistik.md).
  Live-Tests auf iOS und Android sind noch ausständig.
- Der Agent-Workflow verwendet die GitHub-Repository-Variable
  `ROADBOOK_AGENT_USER`, das Secret `ANTHROPIC_API_KEY` und die optionale
  Modellvariable `ANTHROPIC_MODEL`. Der zweistufige Ablauf bis zum gemergten
  PR und die PR-Pflicht auf `main` sind live verifiziert.
- Codebase-Memory wurde zuletzt am 2026-11-20 im Vollmodus ausgeführt:
  273 Nodes, 459 Edges; Indexstatus `ready`. Es gab keine Parserfehler,
  Teilparses oder übersprungenen Dateien. Sieben Dateien unter
  `daten/chat_verlauf/` waren wegen `.gitignore` nicht indexiert; diese
  Chat-Exporte wurden inzwischen entfernt.
  Die Watch-Integration ist in der CLI-Sitzung nicht aktiv (`watched: false`,
  Grund `cli_session`). Nach Umzug oder wesentlichen Workspace-Änderungen
  erneut indizieren und Status prüfen.
- Codebase-Memory MCP 0.12.1 ist inzwischen lokal installiert und in der
  VS-Code-Benutzerkonfiguration registriert. Die Verbindung muss nach einem
  VS-Code-Neustart noch in der aktiven Sitzung bestätigt werden. Der Graph
  unter `../VS_CODE_Tools/.codebase-memory/` wurde nicht verändert.
- Die drei lokalen Chat-Sicherungen (jeweils Markdown und JSON) wurden am
  2026-11-21 auf Nutzerwunsch aus dem Workspace entfernt. Das Verzeichnis
  [`daten/chat_verlauf/`](../daten/chat_verlauf/) enthält aktuell keine
  Chat-Exporte; README und Ignore-Regel bleiben erhalten. Die Quelldaten in
  VS Code oder den Chat-Diensten wurden dadurch nicht gelöscht.
- **Wichtig für den Umzug:** Künftige Chat-Exporte sind durch
  [`daten/chat_verlauf/.gitignore`](../daten/chat_verlauf/.gitignore) von Git
  ausgeschlossen und werden bei einem Git-Klon nicht übertragen.

## Chronologie

### 2026-11-23 – Kartendarstellung aus Issue #9

- Die Kartenbeschriftung zeigt jetzt `Tag <Nummer> · <Start> → <Ziel>`; für
  Tag 2 lautet sie `Tag 2 · Velburg → Villach`. Die statische OSRM-/Seetag-Notiz
  wurde entfernt.
- Die mobilen Kartenaktionen „Einklappen“ und „Groß“ samt Handlern und
  Zustandsstyles wurden entfernt. Die Karte bleibt im oberen Bereich sticky
  und kann beim Scrollen des Etappeninhalts aus dem Sichtbereich wandern;
  Desktop-Kartenlayout bleibt unverändert.
- Der Service-Worker-Cache wurde auf v30, die App-Version auf v2.44 erhöht.
- Sechs Frontend-Tests und `npm run build --prefix web` waren erfolgreich.
  Browserprüfung: mobil (390 × 844) wird das bestätigte Label angezeigt, die
  Karte bleibt beim Scrollen oben und wandert am Ende des Etappenbereichs aus
  dem Viewport; Desktop (1280 × 900) behält `position: sticky` bei 74 px.
  OpenStreetMap-Kacheln wurden im Browser durch die Umgebung blockiert.
- Issue #9 ist auf `feature/issue-9` umgesetzt; der Pull Request und die
  Veröffentlichung auf `main` sind noch offen.
- Relevante Quellen: `web/src/main.js`, `web/src/map.js`,
  `web/src/style.css`, `web/tests/roadbook.test.js` und Issue #9.

### 2026-11-22 – Workspace-Check

- Nachprüfung um 15:16 CET: Git-Integrität erneut ohne Befund; die
  veröffentlichte GitHub-Pages-Adresse antwortete mit HTTP 200. Die im
  Browser geöffnete lokale Adresse auf Port 5173 war nicht erreichbar;
  ein Server wurde nicht gestartet. Eine Funktionsprüfung im Browser
  erfolgte dabei nicht.
- Git-Status und Remote-Stand geprüft; vor der Prüfungsdokumentation war der
  Arbeitsbaum sauber. Der erfolgreiche Pages-Lauf für `9d35be8` ist
  [hier](https://github.com/BoeserBiker/balkan-ride-2027/actions/runs/45031370393)
  dokumentiert.
- Beim ersten `git fsck` wurden `refs/heads/main 2` und
  `refs/remotes/origin/main 2` als ungültige Referenznamen beanstandet.
  Beim erneuten Prüfen waren die Dateien nicht mehr vorhanden und `git fsck`
  meldete keinen Fehler. Die Referenzen wurden bei diesem Check nicht
  verändert; die Ursache ist nicht geklärt.
- 19 Python-Tests und vier Frontend-Tests bestanden; `npm run build --prefix
  web` validierte das Frontmatter und baute erfolgreich. Es wurde kein
  Dev-Server gestartet und keine YouTube-API abgefragt.
- Offline geprüft: 22 Etappendateien, 88 lesbare Bilder mit Lizenzangaben
  und höchstens 1400 Pixel Breite, 22 Nocookie-Video-URLs und 22 parsebare
  Tages-GPX-Dateien. Die 21 Fahrsegmente enthalten 161–300 Punkte; D19
  enthält weder Tracksegment noch Wegpunkte. Die GPX-Dateien sind 293–16163
  Byte groß. Die inhaltliche Eignung und Online-Verfügbarkeit der Medien
  sowie die tatsächliche Befahrbarkeit der vorläufigen Tracks bleiben offen.
- Widerspruch in den offenen Punkten erkannt: Die Aussage zum privaten
  Repository ist historisch und widerspricht dem oben dokumentierten
  öffentlichen Stand. Die gemeldete Umgehung der PR-Pflicht bleibt zu prüfen.

### 2026-11-22 – Highlight-Fotos und Kurzvideo-Filter

- Highlights mit verfügbaren Bildern öffnen die bestehende Lightbox. Die
  Bildauswahl nutzt Stichworttreffer in Bildtexten und andernfalls den
  Highlight-Index; ohne verfügbare Bilder bleiben die Hinweise reiner Text.
- Die YouTube-Suche ist für den späteren eigenen Lauf auf kurze Treffer
  vorbereitet und prüft deren tatsächliche Dauer auf 5 bis 120 Sekunden.
  Bereits eingetragene Videos werden weiterhin weder geprüft noch ersetzt.
  Das Skript wurde nicht ausgeführt und es erfolgten keine YouTube-API-Aufrufe.
- Der Service-Worker-Cache nutzt Version 7. Grenzwerte und Bildauswahl wurden
  mit simulierten API-Antworten beziehungsweise Frontend-Tests geprüft;
  Produktionsbuild erfolgreich. Ein serverloser Browser-Test bestätigte das
  Öffnen des ausgewählten Bildes per Tastatur. Die Live-YouTube-Suche bleibt
  ungeprüft.

### 2026-11-22 – Etappen-Navigation veröffentlicht

- Die Zusammenführung von `feature/fahrzeit-etappen-navigation` nach `main`
  wurde vom Nutzer angefordert und über [PR #3](https://github.com/BoeserBiker/balkan-ride-2027/pull/3)
  durchgeführt. Der [GitHub-Pages-Lauf](https://github.com/BoeserBiker/balkan-ride-2027/actions/runs/45029980523)
  war erfolgreich; das veröffentlichte Bundle und Service-Worker-Version 6
  wurden abgerufen. Die Darstellung am iMac bleibt zu prüfen.

### 2026-11-22 – Fahrzeit und Etappen-Navigation

- Das Web-Frontend zeigt dezimale `Modell-h`-Werte im Fahrzeitfeld gerundet
  als Stunden und Minuten (`ca. 2:53 h`); ein Nullwert erscheint als
  `0 Std.`. Andere Zeitangaben und die YAML-Rohdaten bleiben unverändert.
- Die Etappenleiste hat Scroll-Pfeile, unterstützt vertikales Mausrad-Scrollen
  und zentriert die ausgewählte Etappe. Reduzierte Bewegung wird berücksichtigt;
  am Rand bleibt das normale vertikale Scrollen möglich.
- Service-Worker-Cache auf Version 6 erhöht. Frontend-Tests und
  Produktionsbuild waren erfolgreich. Pfeile, Mausrad und Zentrierung wurden
  im Browser mit dem gebauten Frontend geprüft; ein iMac-Gerätetest steht aus.

### 2026-11-22 – Vier Fotos und mobile Medienansicht

- [`fetch_stage_media.py`](../scripts/fetch_stage_media.py) ergänzt vorhandene
  Bilder auf vier lizenzierte Commons-JPEGs pro Tag; 44 Fotos wurden neu
  geladen. Quellen, Urheber, Lizenz und Bearbeitung stehen im Frontmatter.
  Die bisher vorhandenen Bilder und alle Video-Blöcke blieben unverändert.
  Eine irrtümlich gleichnamige Festung wurde bei der Sichtung ersetzt.
- Die Bildersuche nutzt die
  [Wikimedia-Commons-API](https://commons.wikimedia.org/w/api.php), abgerufen
  am 2026-11-22. Die automatische Bildauswahl und ihre Ortszuordnung bleiben
  fachlich zu prüfen. Es wurden keine YouTube-API-Aufrufe durchgeführt.
- Manifest-Orientierung `any`, dynamische Lightbox-Größen, YouTube-Parameter
  und ein direkter YouTube-Link wurden ergänzt; der Service-Worker-Cache nutzt
  Version 5. Bilder sind nach dem ersten Laden offline verfügbar, Videos nicht.
- Geprüft: 22 YAML-Etappen, 88 JPEGs im Querformat mit 1200–1400 Pixeln
  Breite und Lizenzangaben, unveränderte Video-Blöcke, sechs Python- und zwei
  Frontend-Tests sowie Produktionsbuild. Ein Browser-Test mit wechselnder
  Viewport-Größe prüfte die Lightbox. Echte Tests auf iOS und Android,
  insbesondere Wiedergabe und Drehung in der installierten PWA, stehen aus.

### 2026-11-22 – Etappenbilder und GPX-Downloads

- [`fetch_stage_media.py`](../scripts/fetch_stage_media.py) ergänzt getrennt
  Commons-Bilder oder YouTube-Videos. Der ausschließlich ausgeführte
  `--images-only`-Modus hat 44 Fotos mit Quellen-, Urheber-, Lizenz- und
  Bearbeitungshinweisen ergänzt: zwei pro Tag, JPG/PNG im Querformat, maximal
  1400 Pixel breit. Die automatische Bildauswahl sollte fachlich durchgesehen
  werden. Commons gab zeitweise HTTP 429 zurück; die fehlenden Tage wurden
  anschließend mit alternativen Treffern ergänzt.
- YouTube wurde nicht abgefragt. Für den eigenen Lauf ist
  `python3 scripts/fetch_stage_media.py --youtube-only` vorgesehen; der
  Schlüssel wird aus der ignorierten `.env` oder der Umgebung gelesen und
  bei diesem Lauf an die YouTube-API gesendet. Einbettbare Suchtreffer sind
  noch inhaltlich zu prüfen.
- Die Tageskarte bietet einen Download für geladene Straßen-Tracks; D19 ohne
  Track wird ausgeblendet. Der Build erzeugt ein ZIP mit allen 22 GPX-Dateien,
  einschließlich der leeren Seetag-Datei. Die Routen bleiben ungeprüfte
  OSRM-PKW-Vorab-Tracks.
- Cache-Version 4 speichert lokale Bilder nach dem ersten Laden; externe
  YouTube-Videos sind nicht offline verfügbar. YAML und Bildgrößen aller
  22 Tage, 300-Punkte-Grenze, bytegleicher ZIP-Inhalt, 14 Python-Tests,
  zwei Frontend-Tests, Offline-Cache-Simulation und Produktionsbuild wurden
  geprüft. Ein Gerätetest und die YouTube-Livesuche stehen aus.

### 2026-11-22 – Reiseenduro auf Blau-Weiß umgestellt

- Das Motorradmotiv wurde gespiegelt und zeigt nun nach links; orangefarbene
  Akzente wurden durch Blau und Weiß ersetzt. Die drei PNG-Icons wurden aus
  der SVG-Vorlage neu erzeugt und die Rahmenfarbe im Header angepasst.
- Service-Worker-Cache und Icon-URLs wurden auf Version 3 erhöht. Der Build und
  die PNG-Abmessungen wurden geprüft; ein Test auf iOS und Android bleibt offen.

### 2026-11-22 – Reiseenduro-Logo und PWA-Icons

- Fahrrad-Icon durch eine Reiseenduro mit Windschild, Schnabel, Speichenrädern
  und Gepäck ersetzt. SVG und PNG-Icons (180, 192 und 512 Pixel) liegen in
  `web/public/`; die bisherigen Fahrrad-Icons in `assets/icons/` wurden entfernt.
- Header, HTML und Manifest verwenden die neuen Dateien. Der Service Worker
  nutzt Cache-Version 2 und hält die versionierten Icons für Offline-Zugriffe
  bereit. Bestehende iOS-/Android-Installationen können die Aktualisierung
  ihres Homescreen-Icons unabhängig vom Service Worker verzögert übernehmen.
- Verifikation: PNG-Abmessungen, Manifest- und Build-Dateien geprüft;
  `npm run build --prefix web` erfolgreich. Service-Worker-Installation,
  Löschen des alten Caches und Offline-Zugriffe auf Icon und Startseite wurden
  simuliert. Ein Smartphone-Test steht aus.

### 2026-11-22 – Änderungen für lokalen Commit gebündelt

- Die anstehenden Roadbook-, Web-, GPX-, Generator- und Vorgabenänderungen
  werden auf dem Feature-Branch `feature/track-gpx-vorgaben` zum lokalen Commit
  zusammengefasst. Python-Caches und ignorierte Chat-Sicherungen bleiben
  ausgeschlossen; Push und Pull Request sind noch offen.

### 2026-11-22 – Copilot-Vorgaben und Trackpunkt-Einstellung gebündelt

- Die allgemeine `copilot-instructions.md` wurde auf wesentliche Vorgaben und
  den ausdrücklichen Leseverweis auf `agents/riderrix.agent.md` reduziert.
  Die ausführlichen Projektregeln werden in der Agentendatei gepflegt.
- In der Agentendatei steht `TRACKPUNKTE_MAX = 300` als Einstellung für den
  Agenten. Bei einem Track-Build muss er den eingestellten Wert ausdrücklich
  über `--max-track-points` an den Generator übergeben. Dessen harte Grenze von
  300 bleibt bestehen; manuelle Aufrufe lesen die Agentendatei nicht.
- Die bestehende GPX-Generierung und die Tagesdateien wurden nicht geändert.

### 2026-11-22 – Tages-GPX-Tracks auf 300 Punkte begrenzt

- Der Standard und die harte Obergrenze von
  [`build_tracks_from_waypoints.py`](../scripts/build_tracks_from_waypoints.py)
  wurden für den Garmin zūmo 660 auf 300 `<trkpt>` je Etappe festgelegt.
  Douglas-Peucker behält die Streckenform innerhalb der berechneten Toleranz
  bei; kleinere Werte können weiterhin per `--max-track-points` gesetzt werden.
- Die 22 Tages-GPX-Dateien wurden neu erzeugt. Die Straßen-Tracks haben 161
  bis 300 Punkte, D19 hat keinen Track; Dateigrößen: 293 bis 16.163 Byte.
  XML, Punktzahlen, Größen und Wegpunktkategorien sind geprüft. Zehn
  Generator-Tests und `npm run build --prefix web` waren erfolgreich.

### 2026-11-22 – Track-Neuberechnung nach Import konfigurierbar gemacht

- Die Copilot- und Riderrix-Vorgaben verlangen nun nach jedem Tourdatenimport
  bzw. jeder Änderung an einer Eingabedatei den Abgleich von
  `Balkan_Tour_2027.gpx`, `Balkan_Tour_Plan_2027_V7.md` und `Maps_Import.csv`
  sowie den erneuten Tages-Track-Build. Der Generator liest die GPX-Hauptroute;
  CSV und Markdown-Plan sind Konsistenzquellen.
- [`build_tracks_from_waypoints.py`](../scripts/build_tracks_from_waypoints.py)
  akzeptierte zu diesem damaligen Stand `--max-track-points N` (Standard 1.000);
  die Obergrenze wurde später auf 300 gesetzt.
- Verifikation: CLI-Standard und benutzerdefinierte Punktgrenze werden durch
  Generator-Tests geprüft. Die Neuberechnung bleibt ein expliziter lokaler
  Kommandoaufruf nach dem Import; ein Datei-Watcher wurde nicht eingerichtet.

### 2026-11-22 – Tages-GPX-Tracks vereinfacht und Navi-Wegpunkte bereinigt

- Auf Wunsch wurden alle 22 Dateien `assets/gpx/tag-01.gpx` bis
  `assets/gpx/tag-22.gpx` mit
  [`build_tracks_from_waypoints.py`](../scripts/build_tracks_from_waypoints.py)
  neu erzeugt. Die 21 Straßenrouten wurden über den OSRM-Route-Service
  (`https://router.project-osrm.org/route/v1/driving/`) aus dem lokalen
  [`Balkan_Tour_2027.gpx`](../assets/gpx/Balkan_Tour_2027.gpx) berechnet;
  D19 bleibt ein Seetag ohne Track.
- Eine reine Python-Implementierung von Douglas-Peucker vereinfacht mit
  0,0002 Grad Toleranz. Falls damit mehr als 1.000 Punkte verbleiben, wird die
  Toleranz zur Einhaltung der Navi-Obergrenze angepasst. Die Endpunkte bleiben
  erhalten. Als `<wpt>` werden nur PKW-/MOTORRAD-Punkte der Hauptrouten
  übernommen; ALT-, OPTION- und FAEHRE-Punkte bleiben draußen.
- Alle Dateien ließen sich mit `xml.etree.ElementTree` parsen; jedes
  Tracksegment hat höchstens 1.000 Punkte. Die Dateigrößen reichen von 293 B
  (D19) bis 49.196 B (D11), damit bleiben alle unter 80 KiB. Der vorhandene
  XML-Escaping-Roundtrip-Test deckt weiterhin Sonderzeichen wie `&` ab.
- Verifikation: sieben Tests in
  [`test_build_tracks_from_waypoints.py`](../scripts/test_build_tracks_from_waypoints.py)
  erfolgreich; `npm run build --prefix web` erfolgreich. Die OSRM-Linien sind
  berechnete Vorab-Tracks und keine vor Ort abgefahrenen oder freigegebenen
  Motorrad-Tracks.

### 2026-11-22 – Tages-GPX auf XML-Escaping geprüft

- Anlass war die XML-Fehlermeldung zu Tag 10. Bereits bei der ersten Prüfung
  waren alle 22 Tages-GPX-Dateien einschließlich `tag-10.gpx` wohlgeformt;
  eine fehlerhafte Datei für eine Neuerzeugung wurde nicht gefunden. Die
  vorhandenen Tracks wurden daher nicht überschrieben und keine neuen
  OSRM-Anfragen gestellt.
- [`build_tracks_from_waypoints.py`](../scripts/build_tracks_from_waypoints.py)
  verwendet bereits die XML-Serialisierung von ElementTree, die Text beim
  Schreiben escaped. Ein zusätzliches `escape()` vor der Serialisierung würde
  Sonderzeichen doppelt maskieren. Ein Regressionstest vergleicht die Ausgabe
  mit `xml.sax.saxutils.escape()` und prüft den unveränderten Text nach dem
  erneuten Einlesen.
- Prüfung: 22/22 Tagesdateien mit Python `xml.etree.ElementTree` lesbar,
  vier Generator-Tests erfolgreich, `npm run build --prefix web` erfolgreich.
  Ein Browser- oder PWA-Test wurde nicht durchgeführt; die Fahrbarkeit der
  vorläufigen OSRM-Tracks bleibt ungeprüft.

### 2026-11-22 – V7-Geodaten in Leaflet eingebunden

- Die V7-Dateien `Balkan_Tour_2027.gpx` und `Maps_Import.csv` wurden aus dem
  Geschwister-Workspace nach `assets/gpx/` übernommen. Der GPX enthält 30
  benannte Routen und 134 Wegpunkte; die CSV führt dieselben 134 Punkte
  gruppiert auf. Darunter sind Alternativen, Optionen und drei Wegpunkte der
  Gruppe `FAEHRE`. Der Seetag D19 besitzt keine Straßenroute.
- Die Tagesdateien verweisen nun auf die gemeinsame V7-GPX-Datei. Leaflet
  zeigt Wegpunkte je Etappe einschließlich Alternativen, Option und Fähre;
  die UI weist darauf hin, dass die Wegpunkte keine geprüften Fahrspur-Tracks
  sind und für D19 keine Linie über See vorliegt.
- Die Motorrad-Logistik-Checkliste enthält zusätzlich die noch zu prüfende
  Slowenien-Vignette und Karawankentunnel-Maut für D03alt. Die echte
  Fahrspur-GPX-Prüfung, Medien und noch offene V7-Buchungen bleiben ausstehend.

### 2026-11-22 – Final-Plan V7 ins Roadbook übertragen

- Kapitel 2 des geprüften
  Final-Plans V7 aus dem Geschwister-Workspace wurde nach dem
  unveränderten V4-Frontmatter-Schema in 22 Tagesdateien übertragen. Tag 01
  wurde auf Recklinghausen–Velburg aktualisiert; der Hinweis zur digitalen
  slowenischen E-Vignette blieb für die spätere Motorradetappe erhalten.
- Transportarten, Übernachtungen, Wetter-/Alternativrouten, Entscheidungspunkte
  D03alt, D07alt, D09alt, D10option, D11direkt, D11alt, D15alt und D16alt
  sowie die V7-Kilometer, Modellzeiten und Start-/Zielkoordinaten stehen in
  den Etappendateien. Für alle 22 Etappen sind die Medienlisten leer.
- Die nicht gelieferten Routenhöhen wurden als Schätzwerte berechnet:
  V7-Wegpunkte mit Nominatim geokodiert, Straßenlinien über OSRM rekonstruiert
  und SRTM30m-Höhen über Open Topo Data alle 500 m abgetastet. Ein gleitendes
  Fenster von fünf Samples, ein Mindestanstieg von mehr als 5 m und Rundung
  auf 50 m dämpfen Rasterrauschen. Es sind keine GPX-basierten Messwerte.
  Die rekonstruierten OSRM-Distanzen für D03 (176,2 statt 152,2 km) und D04
  (210,4 statt 171,9 km) weichen vom V7-Plan ab; diese Höhenwerte sind
  besonders vorläufig. Details und Quellen stehen in der
  [Motorrad-Logistik-Checkliste](../docs/motorrad_checkliste_logistik.md).
- Die D19-Hafenkoordinaten wurden aus den V7-Endpunkten D18 und D20 übernommen;
  eine GPS-Linie über See wird nicht behauptet. Die Anfrage „D29“ wurde als
  D19 interpretiert, da der Plan D01–D22 enthält und nur D19 keine GPS-Punkte
  angibt.
- Verifiziert: alle 22 YAML-Dateien enthalten exakt die 14 V4-Felder,
  gültige Koordinaten und leere Medien-Arrays; der Produktionsbuild
  `npm run build --prefix web` war erfolgreich. Im Browser wurden 22 Etappen,
  D19 (Seetag) und D22 (Heimkehr) angezeigt. Externe OpenStreetMap-Kacheln
  konnten im Browser wegen fehlender Netzwerkverbindung nicht geladen werden.

### 2026-11-22 – Phase 3 Web-App und Pages-Build gestartet

- Die Web-App wurde wie im Nutzerprompt unter `web/` eingerichtet. Bei der
  Framework-Wahl wurde das Pflichtenheft V4 als maßgeblich behandelt: Vanilla
  JavaScript statt React; Vite dient als Build-Werkzeug, Tailwind CSS und
  Leaflet werden verwendet.
- Der Build importiert und validiert die YAML-Frontmatter aus allen
  `content/tag-*.md`-Dateien sowie die Logistik-Checkliste. Die UI bietet
  Etappenauswahl, synchronisierte Karte, Foto-/Video-Leerzustände, Lightbox
  für vorhandene Bilder und lokal gespeicherte Logistik-Häkchen.
- PWA-Manifest, Service Worker, SVG-/PNG-App-Icons und ein GitHub-Pages-
  Workflow für Pushes auf `main` wurden ergänzt. Das Pages-Deployment wurde
  später nach Aktivierung der Quelle „GitHub Actions“ erfolgreich ausgeführt.
- Verifiziert: `npm run build --prefix web` erfolgreich. Die gebaute Seite
  wurde lokal im Browser geprüft; Tag 01, Kartenstatus und Logistikdaten
  werden angezeigt. Der Service Worker wurde registriert; im 390-px-Viewport
  entstand kein horizontaler Überlauf und ein Logistik-Häkchen blieb nach
  einem Neuladen erhalten. Der fehlende GPX-Track und fehlende Medien sind im
  Workspace weiterhin nicht vorhanden.
- Die Branch-Protection-Markierung in `docs/todo_plan_v4.md` bleibt erledigt:
  der Nutzer hat bestätigt, dass die PR-Pflicht nach der Umstellung auf ein
  öffentliches Repository aktiv und getestet ist.

### 2026-11-22 – GitHub Pages aktiviert und veröffentlicht

- Commit `74e0b3109a9cf1828333721832cdfcd28b4de729` wurde auf `main` gepusht.
  GitHub meldete beim Push, dass die PR-Pflicht umgangen wurde.
- Der erste Actions-Lauf scheiterte beim Deploy, weil GitHub Pages noch nicht
  aktiviert war. Die Pages-Quelle wurde auf „GitHub Actions“ gestellt und der
  Deploy-Schritt wiederholt.
- Der Build und Deploy waren danach erfolgreich:
  [Actions-Lauf 44978547310](https://github.com/BoeserBiker/balkan-ride-2027/actions/runs/44978547310).
  Die öffentliche Seite ist unter
  [https://boeserbiker.github.io/balkan-ride-2027/](https://boeserbiker.github.io/balkan-ride-2027/)
  erreichbar; `curl --head` lieferte HTTP 200.

### 2026-11-22 – Branch-Schutz für `main` bestätigt

- Der Nutzer bestätigte, dass das Repository inzwischen öffentlich ist und
  die PR-Pflicht für `main` darüber aktiviert und getestet wurde.
- Der To-do-Status für Sicherheit und Branch-Protection bleibt daher
  abgeschlossen; der frühere GitHub-Hinweis bezog sich auf den vorherigen
  privaten Repository-Status.

### 2026-11-22 – Issue-Kommentar-Trigger korrigiert

- Die GitHub-Action-Läufe `44971633172` bis `44972761257` wurden als
  `Skipped` geprüft. Der Kommentartext aus Issue #1 enthielt einen
  abschließenden Zeilenumbruch (`/implement-item\n`), wodurch der exakte
  Workflow-Stringvergleich nicht passte. Außerdem startete `plan-stage`
  bislang nur bei `issues.opened`.
- `plan-stage` akzeptiert nun neue Issues des konfigurierten Benutzers sowie
  `/plan-item`-Kommentare von diesem Benutzer. `implement-stage` akzeptiert
  `/implement-item`-Kommentare. Die Runner-Prüfung normalisiert Rand-
  Leerraum und verlangt danach weiterhin den vollständigen exakten Befehl.
- PR #2 wurde erfolgreich gemergt. Lokales `main` wurde mit
  `git pull --rebase origin main` auf den Merge-Commit
  `d5cf6da47a3c2fb43bd2a67c72c943e293ef9859` gebracht; der Vignettenhinweis
  ist in `content/tag-01.md` enthalten. Der lokale Dokumentations-Commit
  `85cd970` wurde danach auf `origin/main` gepusht.
- Lokal verifiziert: Workflow-YAML geparst, Python-Syntax/Diagnosen ohne
  Fehler und erlaubte sowie abgelehnte Eventfälle geprüft. GitHub akzeptierte
  den direkten Push nach `main`, meldete dabei jedoch, dass die PR-Regel
  umgangen wurde. Danach liefen `plan-stage` (Run `44974850350`) und
  `implement-stage` (Run `44975179606`) erfolgreich; daraus entstand
  [PR #2](https://github.com/BoeserBiker/balkan-ride-2027/pull/2), der am
  2026-11-22 gemergt wurde.

### 2026-11-21 – Workspace-Chat-Exporte entfernt

- Auf Nutzerwunsch die drei Chat-Export-Paare (sechs JSON-/Markdown-Dateien)
  aus `daten/chat_verlauf/` gelöscht.
- Die Verzeichnis-README und Ignore-Regeln bleiben bestehen; es liegen keine
  exportierten Chatverläufe mehr im Workspace.
- Die ursprünglichen Chats in VS Code oder den Chat-Diensten wurden nicht
  verändert. Die Dateien waren nicht von Git getrackt.

### 2026-11-21 – To-do-Fortschritt und Actions-Konfiguration geprüft

- Die GitHub-Konfiguration bestätigt das Secret `ANTHROPIC_API_KEY` und die
  Repository-Variablen `ROADBOOK_AGENT_USER=BoeserBiker` sowie
  `ANTHROPIC_MODEL=claude-sonnet-5-5`. Secret-Inhalte wurden nicht gelesen.
- Der Workflow `AI Roadbook 2-Stage Agent` ist aktiv; die GitHub-API meldet
  bisher keine Workflow-Läufe. Der Live-End-to-End-Test mit einem Issue ist
  offen.
- Für das private Repository verweigert GitHub den Abruf/Einrichten von
  Branch Protection mit HTTP 403 und dem Hinweis, dass ein Upgrade oder ein
  öffentliches Repository erforderlich ist. Die Sichtbarkeit blieb privat.
- Die vorhandenen Befehlsdateien, Skill-Hüllen, Workflow- und Runner-Dateien
  sowie der erste Push sind im To-do als erledigt markiert. Phase 3 (Tourdaten
  und Web-App/PWA) ist noch offen; aktuell liegt nur `content/tag-01.md` vor.

### 2026-11-21 – Git-Repository eingerichtet

- Das Projekt wurde als lokales Git-Repository initialisiert und auf den
  Branch `main` gestellt.
- Die Root-[`.gitignore`](../.gitignore) wurde um `VS_CODE_Tools/`,
  `.codebase-memory/` und `node_modules/` ergänzt.
- Lokale Chat-Sicherungen bleiben durch die vorhandene Ignore-Regel unter
  [`daten/chat_verlauf/`](../daten/chat_verlauf/) vom Commit ausgeschlossen.
- Remote `origin` ist auf
  `https://github.com/BoeserBiker/balkan-ride-2027.git` gesetzt.
- Der erste Commit `befd159aeb4888828e2b44f4288ba0b5c838775d` trägt die
  Nachricht `Setup V4 Grundgerüst`.
- Nach Autorisierung des GitHub-CLI-Zugangs einschließlich des Scopes
  `workflow` wurde `main` erfolgreich gepusht und ist als
  `origin/main` verifiziert.

### 2026-11-19 – Projektgrundgerüst

- Pflichtenheft V4, Master-Ablaufplan, To-do-Plan und Logistik-Checkliste
  gesichtet.
- Verzeichnisstruktur, Planungs- und Implementierungsbefehle,
  Skill-Hüllen, zweistufige GitHub Action, Python-Runner und
  Referenzetappe Tag 01 angelegt; den Master-Plan um Hinweise zur
  Inbetriebnahme ergänzt.
- Geprüft: Befehlsvorlagen und Etappen-YAML stimmen mit den Vorgaben überein;
  beide Runner-Stufen wurden simuliert. Ein Test-Push schrieb auf einen
  Feature-Branch und ließ `main` unverändert.
- Codebase-Memory im Vollmodus indiziert. Status: 154 Nodes / 274 Edges,
  keine ausgelassenen Dateien; bei 61 Dokumentverweisen waren 21 nicht
  aufgelöst.

### 2026-11-20 – Modellkonfiguration

- Auf Nachfrage den Standardwert `claude-sonnet-4-6` im Runner festgestellt.
  Eine gegebenenfalls auf GitHub gesetzte `ANTHROPIC_MODEL`-Variable wurde
  nicht ausgelesen; ihr tatsächlicher GitHub-Wert ist daher unbekannt.

### 2026-11-20 – Chat-Sicherung und Korrektur

- Drei lokal auffindbare, dem Workspace zuordenbare Chats als Markdown und
  strukturiertes JSON gesichert.
- Bei einer Prüfung festgestellt, dass frühere Exporte überwiegend
  Zwischenmeldungen und nicht alle finalen Antworten enthielten. Die
  gespeicherten Abschlussantworten wurden ergänzt und beide Formate
  synchronisiert.
- Die Sicherungen haben Momentaufnahme-Charakter. Anhänge und interne
  Werkzeugdaten sind nicht enthalten; der laufende Turn ist nicht vollständig.
- Auf Hinweis des Nutzers wurde festgestellt, dass der Arbeitsstand trotz
  vorhandener Dokumentationsvorgabe nicht fortgeschrieben worden war.
  Diese Datei, die Export-README und die verbindliche Agentenanweisung wurden
  daraufhin ergänzt. Die Pflichtabschnitte und relativen Dateiverweise wurden
  abschließend geprüft.

### 2026-11-20 – Codebase-Memory neu indiziert

- Nach den Änderungen an Chat-Sicherungen und Übergabedokumentation den
  Workspace erneut im Vollmodus indiziert.
- Ergebnis: `ready`, 273 Nodes / 459 Edges; keine Teilparses, Parserfehler
  oder regulär übersprungenen Dateien. Sieben Chatdateien waren aufgrund der
  lokalen Ignore-Regel absichtlich ausgeschlossen.
- Dokumentlinks: 75 Erwähnungen; 5 mehrdeutig, 11 unterhalb der
  Auflösungsschwelle, 8 nicht gefunden. Das ist eine Diagnose und kein
  Parserfehler.
- Persistentes Artefakt:
  [`.codebase-memory/graph.db.zst`](../.codebase-memory/graph.db.zst) mit
  Metadaten in [`.codebase-memory/artifact.json`](../.codebase-memory/artifact.json).
- Watch-Status: für die aktive CLI-Sitzung nicht aktiviert
  (`watched: false`, Grund `cli_session`). Bei weiteren Änderungen muss der
  Index manuell oder über eine aktive MCP-Sitzung aktualisiert werden.

### 2026-11-20 – Agent-Datei verifiziert

- Die Datei
  [`.github/agents/riderrix.agent.md`](../.github/agents/riderrix.agent.md)
  wurde als eigener Modul-Knoten im Codebase-Memory gefunden und vollständig
  durchsuchbar gemacht.
- Der Vollindex wurde danach erneuert; Zeitpunkt laut Artefakt:
  `2026-11-20T15:56:13Z`, unverändert `273 Nodes / 459 Edges`.
- Nicht vom Index erfasst bleiben weiterhin ausschließlich die sieben
  absichtlich ignorierten Dateien unter `daten/chat_verlauf/`. Für
  `.github/agents/riderrix.agent.md` liegt kein ausgeschlossener- oder
  Parserfehler vor.

### 2026-11-20 – Workspace-Review

- Struktur mit den vier Vorgabedokumenten, Exportregeln, Agentenanweisungen,
  Befehlen, Workflow, Runner und vorhandener Etappendatei abgeglichen.
- Vorhanden: Grundgerüst für den Issue-Plan-/Freigabe-/PR-Workflow sowie
  `content/tag-01.md`. Nicht vorhanden: `content/tag-02.md` bis
  `content/tag-20.md`, `index.html`, `manifest.json`, `sw.js`, PWA-Icons,
  GPX-Tracks und echte Medien. Phase 3 und Folgearbeiten aus dem To-do-Plan
  bleiben offen.
- `agent_runner.py` bestand die Python-Syntaxprüfung; die GitHub-Workflowdatei
  ließ sich mit Ruby/Psych als YAML laden und enthält beide erwarteten Jobs.
  Ein Lauf gegen GitHub oder mit echten Zugangsdaten wurde nicht ausgeführt.
- Im Workspace-Root ist kein Git-Repository erkennbar. Damit sind Branch,
  Remote, Push-Rechte und Branch-Schutz lokal nicht prüfbar.
- Dokumentationsabweichungen: Das Root-README verwendet einen allgemeinen
  Titel „Roadbook-Agent“ statt einer projektbezogenen Balkantour-Überschrift;
  der Master-Ablaufplan enthält ältere Claude-3.5-
  Beispiel-IDs, während produktiver Runner und Inbetriebnahmehinweis
  `claude-sonnet-4-6` verwenden.
- Die PyYAML-Prüfung war nicht ausführbar, weil `yaml` in der lokalen
  Python-Umgebung nicht installiert ist. Es wurden keine Abhängigkeiten
  installiert und keine Dateien des Agenten-Workflows geändert.

### 2026-11-20 – YAML-Prüfung nach PyYAML-Installation

- PyYAML 6.0.3 wurde in der verwendeten Python-3.13-Umgebung installiert.
- Mit PyYAML erfolgreich geparst: `.github/workflows/ai-agent-workflow.yml`;
  beide Jobs sowie die `issues`- und `issue_comment`-Trigger wurden geprüft.
- `content/tag-01.md` erfolgreich geparst; alle 14 V4-Frontmatter-Felder,
  Datums-/Koordinaten-Grundform und Listenfelder waren vorhanden.
- Das frühere Prüfhindernis „PyYAML nicht installiert“ ist damit behoben.
  Keine Projektdateien oder Abhängigkeitsmanifeste wurden geändert.

### 2026-11-21 – Codebase-Memory-MCP installiert

- Den offiziellen Installer von
  [DeusData/codebase-memory-mcp](https://github.com/DeusData/codebase-memory-mcp)
  heruntergeladen; Bash-Syntax geprüft. Der Installer verifizierte SHA-256 des
  macOS-ARM64-Releases und meldete Version 0.12.1.
- Server-Binary nach `~/.local/bin/codebase-memory-mcp` installiert; der
  Installer ergänzte `~/.local/bin` in `~/.zshrc`.
- Nur der MCP-Server wurde in der VS-Code-Benutzerdatei
  `~/Library/Application Support/Code/User/mcp.json` registriert. Die
  zusätzlichen Agentenprofile und Hooks wurden nicht eingerichtet.
- MCP-Handshake erfolgreich geprüft: 17 Tools wurden zurückgegeben. VS Code
  muss neu geladen werden, damit die aktive Copilot-Sitzung die Verbindung
  übernimmt.
- Das vorhandene `VS_CODE_Tools/.codebase-memory/` enthält weiterhin den
  Graph-Export von 2026-11-18 (47 Nodes / 125 Edges); er wurde nicht
  überschrieben oder neu indexiert. Der Installer behielt die beiden bereits
  vorhandenen Datenbanken in `~/.cache/codebase-memory-mcp`.

### 2026-11-21 – Projektindex neu aufgebaut

- Das Projekt
  `/Users/jorg/Documents/Projekte/Balkan-Ride-2027` wurde mit
  Codebase-Memory 0.12.1 im Vollmodus und mit persistentem Artefakt
  indexiert.
- Ergebnis: Projekt `Users-jorg-Documents-Projekte-Balkan-Ride-2027`,
  277 Nodes, 469 Edges, Status `indexed` / `ready`.
- Keine Teilparses, unbrauchbaren Parses oder ausgelassenen regulären
  Dateien gemeldet; 7 Dateien unter `daten/chat_verlauf/` bleiben wegen
  `.gitignore` absichtlich nicht indexiert. Das Verzeichnis
  `.codebase-memory/` ist vom Graphen ausgeschlossen.
- Das persistente Artefakt wurde aktualisiert:
  [`.codebase-memory/graph.db.zst`](../.codebase-memory/graph.db.zst)
  mit aktualisierten Metadaten in
  [`.codebase-memory/artifact.json`](../.codebase-memory/artifact.json).
- Abdeckungsprüfung für `docs`, `content`, `.github`, `config` und `export`
  meldete keine aufgezeichneten Indexprobleme. Da das Workspace kein Git-
  Repository ist, konnte die Änderungserkennung nicht über einen Git-Basiszweig
  validiert werden.

### 2026-11-21 – Gesamtprüfung des Workspace

- Das Pflichtenheft V4, der Master-Ablaufplan, der To-do-Plan und die
  Motorrad-Logistik wurden gegen die vorhandene Struktur abgeglichen.
- Technisch geprüft: Die GitHub-Workflowdatei lädt als gültiges YAML, der
  Python-Runner besteht die Syntaxprüfung und `content/tag-01.md` enthält ein
  valide parsebares V4-Frontmatter mit allen 14 vorgesehenen Feldern.
- Tatsächliche Projektabdeckung: 1 von 20 Etappendateien vorhanden.
  Keine Produktivdatei `index.html`, kein `manifest.json`, kein `sw.js`,
  keine echten GPX-Tracks, PWA-Icons oder Mediendateien vorhanden.
- Die Ordner `wissen/wissengraph/`, `daten/quellen_index.json` und die
  Quellenmetadaten sind noch nicht aufgebaut. Es wurden keine
  Wissensquellen oder Primärquellen verifiziert oder importiert.
- Das Root-Verzeichnis enthält weiterhin kein Git-Repository und kein Remote;
  Branch, Branch-Schutz, Actions-Variablen und GitHub-Secrets sind daher nicht
  lokal verifizierbar.
- Das Root-README enthält tatsächlich „Roadbook-Agent“ mit den Aufgaben
  Reiseplanung, Webseiten und App-Entwicklung; der frühere Hinweis auf einen
  „Renten-Steuer-Agent“ war falsch und wird hiermit korrigiert. Eine
  projektbezogene Balkantour-Benennung wäre dennoch sinnvoll.
- Der Agent-Workflow ist in den Grundbausteinen vorhanden und verwendet
  Benutzervalidierung, begrenzte Etappenpfade und V4-YAML-Prüfungen. Ein echter
  GitHub-Lauf, ein Live-Push und ein PR-Merge wurden nicht ausgeführt.

### 2026-11-21 – Korrektur des Workspace-Befunds

- Nach Direktansicht und Bestätigung des angezeigten Screenshots wurde
  festgestellt: [README.md](../README.md) enthält keinen Hinweis auf einen
  „Renten-Steuer-Agent“. Tatsächlich lautet die Überschrift „Roadbook-Agent“
  und der Inhalt beschreibt Reiseplanung, Webseiten und App-Entwicklung.
- Die frühere pauschale Behauptung zu einem „Renten-Steuer-Agent“ wird als
  Fehler zurückgenommen. Arbeitsstand und Prüfnotiz wurden entsprechend
  berichtigt.

## Offene Punkte und nächste Schritte

1. **Branch-Schutz klären:** Der frühere Hinweis auf ein privates Repository
   ist überholt; zum dokumentierten öffentlichen Stand siehe oben. Die beim
   Push gemeldete Umgehung der PR-Pflicht und die Bypass-Konfiguration prüfen.
2. **Workspace-Umzug abschließen:** Workspace einschließlich versteckter
   Projektdateien prüfen. Die Chat-Exportdateien wurden gelöscht; Geheimnisse
   weiterhin nicht in Dateien oder Git sichern.
3. **Ziel-Workspace prüfen:** Projektpfade, VS-Code-Workspace-Datei,
   Synchronisierung und Dateiintegrität verifizieren. VS Code neu laden und
   die MCP-Verbindung in der aktiven Sitzung prüfen; danach bei Bedarf
   `VS_CODE_Tools` neu indexieren. Die Watch-Strategie nach Möglichkeit
   prüfen; für die frühere CLI-Sitzung meldete sie `none`.
4. **GitHub-Automatisierung beobachten:** Der Plan → Freigabe → PR-Ablauf
   wurde mit PR #2 erfolgreich getestet. Nach weiteren Workflow-Änderungen
   erneut mit einem Test-Issue prüfen.
5. **Dokumentation bereinigen:** Root-README auf Balkan-Ride 2027 ausrichten
   und die veralteten Claude-3.5-Beispiele im Master-Ablaufplan aktualisieren
   oder eindeutig als historische Vorlage kennzeichnen.
6. **V7-Buchungen bestätigen:** Fähre Igoumenitsa–Fusina, Basis-Hotel
   Villach, Unterkunft Koman mit sicherem Motorradstellplatz, Meerblickzimmer
   Igoumenitsa, Koman-Fährbestätigung und Meteora-Ruhetage gemäß
   [`docs/motorrad_checkliste_logistik.md`](../docs/motorrad_checkliste_logistik.md)
   klären.
7. **GPX und Medien prüfen:** Nach Buchung echte Routen-/GPX-Tracks erstellen
   und die Höhenmeter daraus erneut berechnen. Commons-Bildauswahl und
   vorhandene Videos sichten sowie die iOS-/Android-PWA-Prüfung durchführen.

## Relevante Quellen

- [Pflichtenheft V4](../docs/Balkan_Tour_Pflichtenheft_V4.md)
- [Master-Ablaufplan V4](../docs/master_ablauf_prompt_plan_v4.md)
- [To-do-Plan V4](../docs/todo_plan_v4.md)
- [Motorrad-Checkliste Logistik](../docs/motorrad_checkliste_logistik.md)
- [Copilot-Anweisungen](../.github/copilot-instructions.md)
- [Dokumentationskonzept](../.github/Dokumentationskonzept.md)
- [Chatverlauf-Inventar](../daten/chat_verlauf/README.md)

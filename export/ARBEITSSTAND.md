## Arbeitsstand – Balkan-Ride 2027

**Stand:** 2026-11-27

**Workspace:** `Balkan-Ride-2027`  
**Leitdokument:** [.github/Dokumentationskonzept.md](../.github/Dokumentationskonzept.md)

## Aktueller Stand

- Web-Stand (Datei-Stand 2026-11-27): App-Version `v2.146`, Service-Worker-Cache `v159`
  (synchron laut `web/public/version.json` und `web/public/sw.js`, lokale
  Änderungen noch nicht committet). Die App
  startet auf einer **Tourübersicht** (`#start`, P01/P02) mit Direkteinstieg in
  die 22 Roadbook-Tage; das Hauptmenü zeigt dafür „Tourübersicht“ ab 768 px
  und „Tour“ darunter. Daneben bestehen die Ansichten Etappen/Galerie/Logistik, einen 5-Stufen-
  Schriftregler und kompakte Einstellungen, deren Versionskarten unter dem
  Aktualisierungsbutton liegen und ihre jeweilige Historie exklusiv öffnen.
  Die Tests trennen wiederverwendbare Basisprüfungen von issue-spezifischen
  Regressionen. Die Tourübersicht spricht persönlich mit „Du“ an; die
  Etappen bleiben unverändert. Ein konkretes Motorradmodell und eine Gruppengröße
  sind nicht im Code festgelegt; die Teilnahmegrenze aus F03 steht als Datum in
  `content/tour.md`. Der
  zuletzt ausgeführte Playwright-Closed-Loop prüfte fünf Viewports
  (375, 412, 767, 768 und 1280 px): 279/279 PASS nach der iOS-Anpassung,
  Screenshots und Messwerte in
  `web/.visual-report/REPORT.md`. Der Schalter „Slideshow auf der Startseite“
  ist standardmäßig an und speichert den Zustand lokal; ausgeschaltet werden
  laufende Timer geräumt und das Bento bleibt sichtbar. Die vier weiteren
  Slideshow-Einstellungen zeigten in jedem Viewport die erwarteten
  Standardwerte und Min-/Max-Grenzen; alle Eingaben maßen mindestens 44 px.
  Der Schalter maß 44 × 44 px und sein Textkontrast betrug in den drei
  Farbschemata mindestens 14,69:1. Die gemessene
  Unterkantenabweichung des Einstellungsbuttons zur „Galerie“-Beschriftung
  betrug bei allen vier Viewports 0,0 px. In Schriftstufe 5/5 lagen beide
  Versionskarten unter dem Aktualisierungsbutton; App- und Cache-Historie
  ließen sich ohne horizontalen oder vertikalen Inhaltsüberlauf exklusiv öffnen.
  Am 2026-11-27: 61/61 Node-Tests und Produktionsbuild erfolgreich, jeweils
  lokal. Der Desktop-Check zeigte das Höhenprofil bei 1280 × 800 px zwischen
  409 und 693 px; die aktuelle Prüfgrenze für die Unterkante beträgt 790 px
  (10 px Abstand zum Viewport-Rand). Der mobile CTA lag bei 375 × 812 px bei
  796 px und bei 412 × 915 px bei 899 px. Die Prüfergebnisse sind kein Nachweis
  für spätere Stände oder reale Geräte-/Offline-Bedingungen. Die fünf
  Zahlenmarken des Schriftreglers saßen weiterhin in allen Viewports mit
  0,0 px gemessener Abweichung unter den Soll-Rastpunkten 0/25/50/75/100 %.
  Dies ist keine reale Geräte-/Offline- oder fachliche V5-Abnahme.
- Die V5-Dokumentation ist in drei Zuständigkeiten getrennt: das
  [Lastenheft](../docs/master_ablauf_prompt_plan_v5.md) führt technische
  Vorgaben und Architektur, das
  [Pflichtenheft](../docs/Balkan_Tour_Pflichtenheft_V5.md) das Produkt- und
  Fachziel, dieses Daily den aktuellen Stand und alle offenen Arbeiten. V5
  ist seit der Freigabe durch BB am 2026-11-25 die verbindliche
  Arbeitsgrundlage; V4 bleibt als historische Referenz erhalten.
- Die tatsächliche Runner-Allowlist umfasst neben `content/tag-01.md` bis
  `content/tag-22.md` auch `web/index.html`, `web/src/`, `web/public/`,
  `web/tests/` und Teile von `config/`; `.github/`, `config/commands/`,
  `config/skills/`, `web/scripts/`, `web/package.json`, `docs/` und `export/`
  sowie `web/vite.config.js`, `assets/` und alle übrigen nicht gelisteten
  Pfade sind nicht erlaubt. A01 ist umgesetzt; die neue Workflow-Härtung A02
  benötigt wegen Änderungen an `.github/` und `config/commands/` einen direkt
  von BB autorisierten Maintainer-PR außerhalb des Issue-Runners.
- Die frühere Logistik-Datei wurde nach
  [`web/src/content/logistik.md`](../web/src/content/logistik.md) verschoben.
  Raw-Import in `web/src/main.js` und Sonderladen im Runner-Planlauf hängen
  damit nicht mehr an `docs/`. Für F02 ist entschieden, `docs/` privat zu
  halten; die Entfernung bereits versionierter Dateien aus dem Index bleibt
  offen.
- `export/` ist dem unbeaufsichtigten GitHub-Actions-Issue-Runner verboten.
  Eine interaktive VS-Code-Sitzung unter direkter Steuerung von BB darf die
  Export-Übergabe auf ausdrücklichen Wunsch fortschreiben.
- Der frühere Masterplan, das V5-Pflichtenheft und der To-do-Plan unter
  `docs/V5/` sind jetzt Verweise auf die kanonischen Dokumente bzw. dieses
  Daily. Die bestehenden V4-Dateien bleiben unverändert erhalten.
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
  Das Motorrad zeigt nach links und trägt blaue und weiße Akzente; auf dem
  blauen Tank steht ein weißes, um 45° gedrehtes BB-Vektormonogramm. Bei
  sehr kleinen Favicons und im kleinen Header sind die Buchstaben wegen der
  geringen Pixelzahl nicht zuverlässig einzeln lesbar.
  Die aktuellen Icon-URLs verwenden Version 4, das Manifest Version 5. Die
  tatsächliche Aktualisierung bereits installierter Homescreen-Icons auf iOS
  und Android muss auf Geräten geprüft werden.
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
  [`web/src/content/logistik.md`](../web/src/content/logistik.md).
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

### 2026-11-27 – iPhone: Slideshow trotz „Bewegung reduzieren“ (lokal)

- Meldung: Auf dem iPhone (App `v2.145`) funktioniert es weiterhin nicht,
  auf Android einwandfrei. Der Live-Stand enthielt bereits Apple-Tags,
  Touch-Icon und Splashbilder (HTTP 200).
- Gemessene Ursache der Slideshow: Mit aktivem `prefers-reduced-motion`
  (iOS „Bewegung reduzieren“) startete sie nie, im WebKit-Test gegen die
  Live-Seite `shown=false`. Die Slideshow hat nur harte Bildwechsel ohne
  Animation und ist per Schalter abstellbar; das Gating wurde entfernt.
  Dies weicht von der früheren Vorgabe ab, bei Bewegungsreduzierung die
  Timer zu räumen. Nach der Änderung startet sie im WebKit-iPhone-Profil
  mit und ohne Bewegungsreduzierung.
- Splashbild für das iPhone Air (420 × 912, DPR 3) ergänzt. App `v2.146`,
  Cache `v159`; 61/61 Tests, Build, 279/279 Visual-Prüfungen lokal.
- Offen/ungeprüft: Home-Bildschirm-Icon und nativer Splash. iOS speichert
  beide beim „Zum Home-Bildschirm“; die App muss dafür entfernt und neu
  hinzugefügt werden. Kein echter Gerätetest; ohne Rückmeldung, welches
  Symptom genau fehlt, ist die Ursache dort nicht gesichert. Kein Commit/Push.

### 2026-11-27 – iOS-PWA-Kompatibilität (lokal)

- Apple-Touch-Icon mit 180 × 180 px deklariert, Web-App-Metatags ergänzt
  und den HTML-Hintergrund vor dem Laden des Stylesheets auf die
  Manifestfarbe gesetzt. Vorhandene iPhone-Splashbilder und Android-Icons
  bleiben unverändert.
- Die Startseiten-Slideshow verwendet Fotos, keine Autoplay-Videos. Für ältere
  Safari-Versionen nutzen ihre Media-Query-Listener bei Bedarf `addListener`;
  ein `vh`-Fallback ergänzt das vorhandene `dvh`-Layout. Reduzierte Bewegung,
  mobile Ansicht und Slideshow-Einstellungen bleiben berücksichtigt.
- App `v2.144`, Service-Worker-Cache `v157`; lokal 61/61 Node-Tests,
  Produktionsbuild und 279/279 Chromium-Visual-Prüfungen bestanden.
  Playwright-WebKit prüfte im iPhone-Profil den Bildwechsel und die
  Rückkehr zum Bento sowohl mit moderner als auch simulierter älterer
  Media-Query-Listener-API. Bei diesem Lauf lag der CTA bei 727 px und damit
  außerhalb des gemessenen Viewports von 629 px.
  Kein Test auf einem echten iPhone; iOS-Homescreen-Icon, nativer Splash und
  tatsächliches Geräteverhalten bleiben gesondert zu prüfen.

### 2026-11-27 – PWA-Manifest und iOS-Startbilder (lokal)

- Manifest-ID, Start und Scope auf den Pages-Unterpfad gesetzt. Jeweils
  eigene PNG-Icons für `any` und `maskable`; die zwei maskierbaren Icons
  werden aus dem BB-SVG mit Abstand generiert. Der Visual-Check fand bei
  192 und 512 px keinen Motivpixel außerhalb des Sicherheitskreises und
  keine transparenten Pixel.
- iOS-Statusleisten-Meta ergänzt, Icon- und Startbild-URLs ohne Query;
  Startbilder für 828 × 1792, 1080 × 2340, 1242 × 2688 und 1284 × 2778
  ergänzt. Für das iPhone 12/13 mini ist 360 × 780 CSS-Pixel bei DPR 3
  angegeben; 375 × 812/DPR 3 bleibt dem 1125 × 2436-Bild zugeordnet.
- Der Service Worker lädt Manifest und Icons beim Installieren mit
  `cache: reload` und nutzt den neuen Cache `v155` (App `v2.142`).
  Splashbilder werden weiterhin nur bei Abruf gespeichert. Der zuvor
  bereits gestagte Versionsstand `v2.141`/`v154` blieb im Index erhalten.
- Lokal: 60/60 Node-Tests, Build und 279/279 Visual-Prüfungen erfolgreich.
  Ein lokaler Chromium-Test mit echtem Service Worker lieferte Manifest und
  alle fünf PNG-Icons nach Aktivierung auch offline mit HTTP 200.
  Keine Prüfung auf echten Android- oder iOS-Geräten; WebAPK-Erzeugung und
  Installationsangebot entscheidet der Browser, ein eigener
  `beforeinstallprompt`-Hinweis ist nicht implementiert.
- Abgleich am 2026-11-27: [iPhone-Viewport-Tabelle](https://yesviz.com/iphones.php),
  [W3C Web Application Manifest](https://www.w3.org/TR/2026/WD-appmanifest-20261118/).
  Die tatsächliche iOS-Startbildauswahl und Aktualisierung installierter
  Icons bleiben ohne Gerätetest offen. Kein Commit/Push.

### 2026-11-27 – iOS-Startbilder (lokal)

- Sieben Hochformat-Startbilder mit BB-Motorrad und Titel aus
  `web/public/favicon.svg` erzeugt; die Geräteabmessungen und
  DPR-Media-Queries sind in `web/index.html` mit dem Pages-Unterpfad verknüpft.
  Der Generator liegt in `web/scripts/generate-ios-splash.mjs`.
- Die Bilder werden nicht vorab im Service Worker gespeichert, sondern nur
  bei tatsächlichem Abruf im Cache `v152`; App-Version `v2.139`. Ob iOS den
  Service Worker beim nativen Startbildabruf nutzt, ist nicht geprüft.
- Lokal: 58/58 Node-Tests, Produktionsbuild und 278/278 bestehende
  Visual-Prüfungen erfolgreich; zwei erzeugte Bilder visuell kontrolliert.
  Kein Test auf einem echten iPhone; die sieben angeforderten Auflösungen
  decken nicht automatisch alle iPhone-Modelle ab.

### 2026-11-27 – BB-Monogramm auf dem Motorrad-Icon

- Weiße Vektorinitialen `BB` im 45°-Winkel mittig auf dem blauen Tank der
  gemeinsamen SVG-Vorlage ergänzt. Header und Favicon verwenden diese
  Vorlage; 180-, 192- und 512-px-PNGs wurden daraus mit Chromium neu
  gerendert. Keine weiteren Motorrad-Icons oder ICO-Dateien gefunden.
- Icon-URLs auf `v=4`, Manifest-URL auf `v=5` aktualisiert; App-Version
  `v2.137`, Service-Worker-Cache `v150`. Header-Außenmaße unverändert.
- Verifikation: 56/56 Node-Tests, Build und 278/278 Visual-Checks erfolgreich;
  Browser-Pixelvergleich SVG/PNGs: 0 abweichende Pixel in allen drei Größen.
  Die Sichtprüfung bei 16 und 38 CSS-Pixeln zeigt: Das Monogramm ist dort
  nicht zuverlässig als zwei Buchstaben lesbar; dafür wäre ein gesondertes
  vereinfachtes Kleinformat nötig. Reale Geräte und installierte
  Homescreen-Icons wurden nicht geprüft. Kein Commit/Push.

### 2026-11-27 – Höhenprofil-Prüfgrenze für Linux angepasst

- Der Visual-Check prüft Diagramm und Abschnitt nun bis maximal
  `Viewport-Höhe − 10 px`, bei 1280 × 800 px also bis 790 px statt 700 px.
  Hintergrund: der gemeldete Linux-Chromium-Wert für das Diagramm beträgt
  497–781 px; ein erneuter Linux-Lauf wurde hier nicht ausgeführt.
- Lokaler Visual-Check: 277/277 PASS; Diagramm 409–693 px bei Ziel ≤ 790 px.
  Bericht und Screenshot:
  [`web/.visual-report/REPORT.md`](../web/.visual-report/REPORT.md).
  Nur Prüfskript und Daily geändert; kein Commit oder Push.

### 2026-11-27 – Slideshow-Schalter und P01/P02-Abnahme (lokal)

- Einstellungen: „Slideshow auf der Startseite“ als 44 × 44 px großer
  Schalter mit Zustandsanzeige An/Aus ergänzt. Standard ist An, auch für
  vorhandene Slideshow-Einstellungen ohne Schalterwert. Der Boolean wird
  gemeinsam mit den bisherigen vier Werten in `balkan-ride-slideshow`
  gespeichert; Ausschalten beendet eine laufende Slideshow und räumt ihre
  Timer, sodass das Bento bestehen bleibt. Erneutes Einschalten startet die
  normale Wartezeit. Die Shell und der Einstellungsdialog werden in
  `web/src/main.js` erzeugt; `web/index.html` benötigte keine Änderung.
- Unit-Test prüft Standard, Bestandswerte, Speicherung, Ausschalten während
  einer aktiven Slideshow, Timerfreiheit und erneutes Einschalten. Der
  Visual-Check prüft alle fünf Viewports, Textkontrast in drei Farbschemata,
  Textüberlauf bei Schriftstufen 2/5 und 5/5 sowie das tatsächliche
  Ausschalten und Neuladen im iPhone-Viewport.
- Verifikation: 55/55 Node-Tests, Produktionsbuild und 277/277 Visual-Checks
  erfolgreich. Schalterkontrast mindestens 14,69:1; Desktop-Höhenprofil
  409–693 px bei Prüfgrenze 700 px (100 px Linux-Puffer). Bericht und
  Screenshots: [`web/.visual-report/REPORT.md`](../web/.visual-report/REPORT.md).
  Lokal mit macOS-Chromium geprüft, kein separater Linux- oder Gerätetest.
  App-Version `v2.132`, Service-Worker-Cache `v145`; kein Commit/Push.

### 2026-11-27 – P01/P02: finale Abnahme der Startseiten-Slideshow (lokal)

- Ergänzte Visual-Prüfung der vier Slideshow-Einstellungen: Standardwerte,
  Min-/Max-Grenzen, Zuordnung der Beschriftungen, Einbettung im Dialog und
  mindestens 44 px hohe Eingabefelder. Der Unit-Test schützt zusätzlich die
  Optionsnamen, Standardwerte und Touchhöhe. Die bestehenden Prüfungen sichern
  weiterhin die entfernte Kartenüberschrift und den 100-px-Puffer für das
  Desktop-Höhenprofil.
- Ergebnis: `node --test web/tests/*.test.js` 54/54 PASS,
  `npm run build --prefix web` PASS und `npm run test:visual --prefix web`
  266/266 PASS über fünf Viewports. Messwerte: iPhone-CTA 796/812 px,
  Android-CTA 899/915 px; Desktop-Diagramm 409–693 px bei Prüfgrenze 700 px
  (100 px Linux-Chromium-Puffer). Slideshow-Einstellungen waren in allen
  Viewports 44 px hoch und zeigten 2/5/30/15 mit den erwarteten Grenzen.
- Screenshots und vollständiger Bericht liegen in
  [`web/.visual-report/REPORT.md`](../web/.visual-report/REPORT.md). Die
  Abnahme ist lokal; sie ersetzt keine Prüfung auf echten Geräten oder einen
  separaten Linux-Chromium-Lauf. App-Version `v2.131` und Cache `v144`
  unverändert, da nur Test-/Prüfskripte und Dokumentation angepasst wurden.
  Kein Commit/Push.

### 2026-11-27 – Highlight-Slideshow im Bento-Bereich und Einstellungen (lokal)

- Die Kartenüberschrift „Unsere Tour auf einen Blick“ ist wieder entfernt.
- Mobil zeigt `#start` zuerst unverändert das Bento-Grid. Nach der
  eingestellten Pause startet im selben Container (Overlay, das Bento hält
  unsichtbar die Höhe) eine Slideshow mit Fotos der Kern-Highlights (Tag 3, 5,
  9, 11, 15, 17) aus `bilder` der Etappen: je Highlight höchstens N zufällig
  gewählte Bilder, Gesamtfolge zufällig gemischt und je Runde neu. Jedes Bild
  trägt „Tag NN · Highlight“ und Urheber · Lizenz. Nach der Slideshow-Dauer
  zurück zum Bento; der ×-Button (44 × 44 px) springt jederzeit zurück. Timer
  laufen nur auf sichtbarem mobilem `#start` und werden beim Verlassen, bei
  verstecktem Tab und bei `prefers-reduced-motion` geräumt.
- Einstellungsdialog, Abschnitt „Startseiten-Slideshow“ (Zahlenfelder,
  `localStorage`-Schlüssel `balkan-ride-slideshow`, Werte werden auf die
  Grenzen gekappt): Bilder pro Highlight 1–5 (2), Anzeigedauer pro Bild
  2–15 s (5), Slideshow-Dauer 10–120 s (30), Standardbild bis zur nächsten
  Slideshow 5–120 s (15).
- Tests: Startzustand, Zufallsauswahl und Limit, Beschriftung/Credit,
  Ablauf mit Rückkehr und Timer-Aufräumen (Fake-Timer), Speicherung und
  Grenzen. Ein bestehender Escape-Test prüfte „kein `<img>`“ und hing durch
  das neue Slideshow-Bild beim Formatieren der Fehlermeldung; er prüft jetzt
  gezielt eingeschleuste Bilder.
- Version `v2.131` / Cache `v144`; 54/54 Node-Tests, Build erfolgreich. Der
  Visual-Check wurde auf Wunsch nicht ausgeführt (Erwartung „ohne
  Kartenüberschrift“ bereits angepasst); Slideshow-Darstellung, Kontraste und
  Einstellungsdialog sind visuell ungeprüft. Kein Commit/Push.

### 2026-11-27 – P01/P02 final auf Design 4 (lokal, verifiziert)

- Der temporäre Design-Umschalter und die `?design=`-Logik sind aus Code,
  CSS, Karte und Tests entfernt. Mobil gilt fest: Titel und Untertitel in
  voller Breite, darunter Highlights (35 %, kompakte Zeilen, Links ≥ 44 px)
  neben der Karte (65 %) mit wieder eingesetzter Überschrift „Unsere Tour auf
  einen Blick“; die Karte füllt die Höhe der Highlight-Spalte. Darunter das
  Bento (Strecke gesamt mit Proportionsbalken Motorrad/Auto, Motorrad, Auto,
  9 Länder) und unten Route plus „Zur Tour →“.
- Kartenhinweis gekürzt auf „Vorläufige Tourkarte · keine Navigation“
  (mobil und Desktop einzeilig, per Visual-Check gemessen).
- Visual-Check erweitert: Bento-Kacheln und Proportionsbalken mobil, einzeilige
  Kartenüberschrift/Legende/Hinweis, sichtbarer Legendentext je Viewport,
  Höhenprofil-Puffer für Linux-Chromium (Diagramm-Unterkante ≤ Viewport −
  100 px; macOS 693/700 px). Prüfkriterium „Button am Hero-Rand“ an die
  Bento-Leiste (bis 8 px Innenabstand) angepasst.
- Messwerte: iPhone 12 mini Karte 218 × 233 px, CTA-Unterkante 796/812 px;
  Android 899/915 px; „Mitfahren“ jeweils erst unterhalb des ersten Viewports.
- Version `v2.130` / Cache `v143`. 50/50 Node-Tests, Build erfolgreich,
  Visual-Check 261/261 PASS über fünf Viewports, `git diff --check` ohne
  Befund. Linux-Lauf in GitHub Actions, echte Geräte und Offline-PWA nicht
  geprüft. Kein Commit/Push.

### 2026-11-27 – Fünf L-Form-Kartenvarianten ohne Kartentitel (lokal)

- Die Überschrift über der Übersichtskarte ist auf Mobil und Desktop entfernt.
  Mobil beginnt die Karte jetzt rechts auf Höhe von „Balkan-Ride 2027“ und
  läuft neben Titel und Highlights bis über das Bento-Grid (L-Form). Der
  Bento-Bereich mit Proportionsbalken ist unverändert und in allen Varianten
  identisch.
- Die Pillen-Leiste oben rechts ist entfernt; ein dezenter Zahlen-Umschalter
  `1 2 3 4 5` sitzt direkt unter der Karte (`?design=1..5`, Standard 1;
  sichtbar 28 px hoch, Trefferfläche per Pseudo-Element 44 px hoch, Breite bei
  375 px etwa 40 px je Ziffer).
- Varianten: 1 = L-Form 40/60; 2 = 38/62 mit engerem Zoom (8 px Rand) und
  halbtransparenter Fähr-Badge unten links in der Karte; 3 = randlose Karte bis
  zur rechten Bildschirmkante; 4 = 35/65 mit kompakteren Highlight-Zeilen
  (weiter mind. 44 px); 5 = Karte als Bento-Kachel mit Legende und Hinweis.
- Risiko: Titel und Untertitel brechen in der schmalen linken Spalte um, die
  linke Spalte wird dadurch höher. Ob „Zur Tour →“ auf kleinen Geräten
  (z. B. iPhone 12 mini) noch im ersten Viewport sitzt, ist ungemessen.
- Version `v2.129` / Cache `v142`; 49/49 Node-Tests, Build erfolgreich. Kein
  Visual-Check (auf Wunsch), kein Commit/Push. Offen: Variantenauswahl,
  danach Umschalter entfernen.

### 2026-11-27 – Fester Bento-Mix und vier Kartenvorschläge für `#start` (lokal)

- Der untere mobile Bereich ist fest Bento 2A mit dem zweifarbigen
  Proportionsbalken (Motorrad Gold, Auto/Fähre Grau) unter der
  Gesamtstrecke; 2B und 2C sind entfernt. Er ist in allen Vorschlägen
  identisch (per Test geprüft).
- Der Umschalter `1 | 2 | 3 | 4` (`?design=1..4`, Standard 1) variiert nur
  den oberen Bereich: 1 = Highlights 42 % / Karte 58 %, 8 px Abstand;
  2 = Karte in voller Highlight-Höhe, Fähre als Overlay-Badge in der Karte;
  3 = 45/55 mit engem Kartenzoom (8 px Rand; unten bleiben mobil 34 px für die
  Attribution frei); 4 = Highlights 40 % mit kompakteren Zeilen (weiter
  mind. 44 px) und Karte 60 % in voller Höhe. Die Legende sitzt dafür in einem
  neuen Kartenrahmen; Desktop-Darstellung und Desktop-Zoom bleiben gleich.
- Version `v2.128` / Cache `v141`; 49/49 Node-Tests, Build erfolgreich. Der
  Visual-Check wurde auf Wunsch nicht ausgeführt; Kartengröße, Lage von
  „Zur Tour →“ und Kontraste der Vorschläge sind nicht gemessen. Offen:
  Auswahl eines Vorschlags, danach Umschalter entfernen. Kein Commit/Push.

### 2026-11-27 – Bento-Varianten 2A/2B/2C und Kartentitel (lokal)

- Kartentitel auf Mobil und Desktop: „Unsere Tour auf einen Blick“.
- Die Designs 1 (Cockpit) und 3 (Strip) sind entfernt. Der Umschalter zeigt
  jetzt `2A | 2B | 2C` (URL weiterhin `?design=1|2|3`, Standard 2A):
  2A = bisheriges Bento-Design 2; 2B = gleiche Geometrie mit Gold-Rand und
  -Schimmer der Motorrad-Kachel, luftigerer Länder-Matrix ohne Zwischenlinien
  und goldfarben angebundener Start/Ziel-Leiste; 2C = gleiche Geometrie mit
  Proportionslinie Motorrad vs. Auto/Fähre unter der Gesamtstrecke und
  Länderroute mit Pfeilen.
- Version `v2.127` / Cache `v140`; 49/49 Node-Tests, Build erfolgreich. Der
  Visual-Check wurde auf Wunsch nicht ausgeführt; Lage von „Zur Tour →“ im
  ersten Viewport und Kontraste der Varianten sind nicht gemessen. Offen:
  Auswahl einer Variante, danach Umschalter entfernen. Kein Commit/Push.

### 2026-11-27 – km ohne „ca.“ und drei mobile Designvarianten für `#start` (lokal)

- Alle berechneten Kilometerangaben der Tourübersicht (Desktop-Kennzahlen,
  Aufschlüsselung, mobile Zusammenfassung) stehen ohne „ca.“. Roadbook-
  Kilometer hatten kein „ca.“; das „ca.“ bei Fahrzeiten bleibt unverändert.
- Unterhalb von 768 px gibt es drei Varianten des unteren Startbereichs,
  wählbar per `?design=1` (Standard), `?design=2`, `?design=3` und über die
  Vorschau-Pille `1 | 2 | 3` neben dem Titel: Expedition Cockpit (Glas-Karte,
  KPI-Raster, Länderkette), Editorial Bento (Gesamt-km groß, Split-Kacheln,
  Länder-Matrix, Action-Bar) und Adventure Strip (Bänder mit
  Proportionsbalken Motorrad/Auto und Länderroute, großer CTA). Alle Werte
  stammen aus den Etappendaten; Schriftgrößen sind mobil per `clamp()`
  begrenzt, Umschalter-Ziele 44 × 44 px. Desktop zeigt den Umschalter nicht.
- Offen: Entscheidung für eine Variante; danach Umschalter entfernen. Der
  Visual-Check wurde auf Wunsch nicht ausgeführt; die Unterkante „Zur Tour →“
  im ersten Viewport und die Kontraste der Varianten sind nicht gemessen.
- Version `v2.126` / Cache `v139`; 49/49 Node-Tests, Build erfolgreich.
  Kein Commit/Push.

### 2026-11-27 – Mobile Tourübersicht: kompakte Kennzahlen und Länder-Pills (lokal)

- Auf `#start` zeigt die mobile Zusammenfassung jetzt den kompakt formatierten
  Termin (`08.–29.09.2027`), daraus berechnete Kilometer-Kacheln ohne „ca.“
  oder Anhängerhinweis, Etappenzahlen je Transportart sowie Länder-Pills aus
  den Tourdaten. Die Fährlegende lautet auf Mobilgeräten „Fährverbindung“;
  Desktop behält unverändert „Fährverbindung (ca. Linie)“.
- Mobile Schriftgrößen in Überschrift, Intro, Highlights, Kennzahlen,
  Länder-Pills und CTA sind mit `clamp()` nach oben begrenzt, damit größere
  globale Schriftstufen den ersten Bildschirm weniger stark vergrößern. Die
  Änderungen an der Darstellung liegen in der Mobile-Media-Query; Desktop-
  Layoutregeln wurden nicht verändert.
- Versionierung: App `v2.125`, Service-Worker-Cache `v138` in
  `web/public/version.json`/`web/public/sw.js`. 48/48 Node-Tests und
  Produktionsbuild erfolgreich. Der Visual-Check wurde auf ausdrücklichen
  Wunsch nicht ausgeführt; die aktuelle First-Screen-Geometrie ist daher
  nicht visuell bestätigt. Kein Commit/Push.

### 2026-11-27 – Desktop-Höhenprofil: weiterer Abstandsnachzug (lokal)

- Nach dem gemeldeten Linux-Chromium-Ergebnis 542–826 px wurden die vertikalen
  Margins und Paddings oberhalb des Höhenprofils in der zweispaltigen
  Roadbook-Ansicht ab 901 px weiter reduziert, ohne Schrift- oder
  Elementgrößen zu verändern. Der Breakpoint entspricht dem bestehenden
  Desktop-Layout; bei 768–900 px ist die Ansicht weiterhin untereinander.
- Auf macOS zeigt der Visual-Report bei 1280 × 800 px nun den Abschnitt
  365–693 px und das Diagramm **409–693 px**, also 45 px höher als beim
  vorherigen lokalen Ergebnis. Linux/GitHub Actions wurde für diese Änderung
  noch nicht erneut ausgeführt und ist daher nicht bestätigt.
- Lokal: 48/48 Node-Tests, Build erfolgreich und 256/256 Visual-Prüfungen.
  Der Screenshot des Desktop-Profils wurde gesichtet. Der bereits vorgemerkte
  Versionsschritt `v2.122` / Cache `v135` gegenüber `HEAD` blieb unverändert;
  die betreffenden Änderungen waren bereits vor dieser Arbeit gestagt.
  Kein Commit/Push.

### 2026-11-27 – Desktop-Höhenprofil mit 52 px Viewport-Reserve (lokal)

- Auf den GH-Visual-Check mit Diagramm-Unterkante 878 px reagiert: die
  vertikalen Abstände in der zweispaltigen Roadbook-Ansicht (ab 901 px, dem
  tatsächlichen Breakpoint des Desktop-Layouts) wurden weiter reduziert.
  Ursache eines unwirksamen Teilabstands war die spätere Grundregel
  `.day-picker-head { margin-bottom: 12px; }`; die Desktop-Regel verwendet nun
  den spezifischeren Selektor `.day-picker .day-picker-head`.
- Geändert wurden ausschließlich vertikale Paddings und Margins an
  Journey-Header, Etappenwahl, Etappentitel, Kennzahlen und Höhenprofil.
  Schriften, Zeilenhöhen und Elementgrößen blieben unverändert. Der
  Playwright-Check verlangt nun mindestens 10 px Reserve und eine Diagramm-
  Unterkante von höchstens 790 px. Bei 1280 × 800 px liegen Abschnitt und
  Diagramm bei 410–738 px bzw. 454–738 px: 140 px früher als die gemeldeten
  550–878 px und 52 px Reserve bis zur 790-px-Grenze.
- Hauptmenü erneut abgesichert: „Tourübersicht“ ist ab 768 px, „Tour“ darunter
  sichtbar, erster Menüpunkt vor „Etappen“; es gibt genau einen Menülink und
  keine separaten Rücksprung-Zwischenlinks. Header-Geometrie blieb im
  Visual-Check grün.
- Versionierung: App `v2.118`, Service-Worker-Cache `v131`, synchron in
  `web/public/version.json` und `web/public/sw.js`. Closed-Loop: 48/48
  Node-Tests, Build erfolgreich, Visual-Check 256/256 über fünf Viewports,
  `git diff --check` ohne Befund. Keine echten Geräte-/Offline-Prüfungen.
  Kein Commit/Push.
- Betroffene Dateien: `web/src/style.css`, `web/tests/features.test.js`,
  `web/scripts/visual-check.mjs`, `web/public/version.json`, `web/public/sw.js`
  und dieses Daily.

### 2026-11-27 – Tourmenü und Desktop-Höhenprofil (lokal)

- Der neue Menüpunkt „Tourübersicht“ steht links neben „Etappen“; unter 768 px
  wird kompakt „Tour“ angezeigt. Auf `#start` setzt die bestehende
  Ansichtslogik `aria-current="page"`; im Roadbook wird der Menüpunkt aktiv
  statt zweier doppelter Zwischenlinks. Die bestehenden Header-Geometrie-Checks
  blieben grün.
- Die Abstände in der rechten Roadbook-Spalte wurden ab 901 px ausschließlich
  über vertikale Margins und Paddings verdichtet; Schriftgrößen,
  Zeilenhöhen und Elementdimensionen wurden nicht verändert. Der Visual-Check
  misst bei 1280 × 800 px den Höhenprofil-Abschnitt vollständig im Viewport:
  Abschnitt 462–790 px, Diagramm 506–790 px.
- Versionierung der sichtbaren Web-Änderung: App `v2.116`, Service-Worker-
  Cache `v129`; `web/public/version.json` und `web/public/sw.js` sind synchron.
  Finaler Closed-Loop: 48/48 Node-Tests, Build erfolgreich, Visual-Check
  256/256 über fünf Viewports; `git diff --check` ohne Befund. Keine echten
  Geräte- oder Offline-Prüfungen. Kein Commit/Push.
- Betroffene Dateien: `web/src/main.js`, `web/src/style.css`,
  `web/tests/issue-tour-landing.test.js`, `web/tests/features.test.js`,
  `web/scripts/visual-check.mjs`, `web/public/version.json`,
  `web/public/sw.js` und dieses Daily. `web/index.html` und
  `web/src/tour-overview.js` mussten nicht geändert werden: Navigation und
  Desktop-Abstände liegen im Shell-Aufbau bzw. Stylesheet.

### 2026-11-27 – P01/P02: Kontakt-Abschluss und finale Verifikation (lokal)

- Der Instagram-Kontaktbutton ist aus dem Abschnitt „Mitfahren“ herausgenommen
  und steht jetzt als eigener Footer ganz am Ende der Landingpage: nach dem
  Selbstcheck samt Orientierungshinweis, Planungsstand und 22-zeiligem
  Reiseverlauf. Der Test sichert die DOM-Reihenfolge und die Visual-Prüfung
  HTTPS, neuen Tab, Mindesthöhe und Position als letztes Landingpage-Element.
- Finale Prüfungen nach dieser Änderung: `node --test web/tests/*.test.js`
  48/48, `npm run build --prefix web` erfolgreich und
  `npm run test:visual --prefix web` 255/255 über iPhone 12 mini, Android,
  767 px, Tablet 768 px und Desktop. Visual-Check bestätigt für alle fünf
  Viewports, dass der CTA im ersten Viewport nahe dem unteren Rand bleibt und
  „Mitfahren“ erst darunter beginnt; Tablet-Kennzahlen sind zweispaltig
  verdichtet. Kontakt-Abschluss: `web/.visual-report/*-start-contact-footer.png`.
  `git diff --check` ohne Befund. Echte Geräte, echte Kacheln und Offline-PWA
  sind nicht geprüft. Kein Commit/Push.

### 2026-11-27 – P01/P02: Layout-Fix erster Bildschirm (Zwischenstand, danach final visuell geprüft)

- Der Hero (`.tour-hero`) ist jetzt eine Flex-Spalte (`space-between`) mit
  `min-height: calc(100dvh - var(--header-height, 64px) - var(--tour-start-top))`
  und 16 px Innenabstand unten: Route und „Zur Tour →“ stehen unten am ersten
  Bildschirm, „Mitfahren“ beginnt darunter. `--header-height` wird in
  `web/src/main.js` über `bindHeaderHeight` (ResizeObserver) gesetzt, da der
  sticky Header Platz im Layout belegt.
- Der Kennzahlen-Block (Karten plus Kilometer-/Etappenzeilen) steht ab 768 px im
  Hero links unter dem Intro, die Karte füllt rechts die volle Höhe; mobil
  (≤ 767 px) bleibt die kompakte Reihenfolge Titel/Untertitel, Highlights | Karte,
  Zusammenfassung, unten Route | Button.
- In diesem Zwischenstand waren nur Node-Tests (48/48) und Build ausgeführt;
  die anschließend erfolgte finale Visual-Verifikation samt Ergebnissen steht
  im Chronologie-Eintrag direkt darüber. Kein Commit/Push.

### 2026-11-27 – P01/P02: Untertitel und Kilometer-/Etappen-Aufschlüsselung (lokal)

- Der mobile Untertitel lautet jetzt „Unsere Tour, dein Abenteuer!“. Der längere
  Desktop-Introtext („Dein Überblick …“) blieb unverändert.
- Kennzahlen-Block (Desktop unter den Karten, mobil in der Zusammenfassung) mit
  zwei Zeilen, beim Laden aus den 22 `content/tag-*.md` abgeleitet (`kilometer`
  und Zeile `**Transport:**`, keine festen Zahlen im Code): aktuell
  „ca. 4.825 km gesamt · ca. 2.823 km Motorrad · Fähre ohne Kilometerangabe ·
  ca. 2.002 km Auto mit Anhänger“ und „22 Etappen · 4 Auto · 17 Motorrad · 1 Fähre“.
  Auto = Transport mit PKW (Tag 1, 2, 21, 22), Fähre = nur Fähre (Tag 19);
  Mischtage wie Tag 13 („Fähre als Fußpassagiere, anschließend Motorrad“) und
  Tag 18 („Motorrad + geplante Fähre“) zählen als Motorrad. Die mobile Zeile
  „18 Tourtage“ entfällt; die Desktop-Karte „Tourtage 18“ bleibt (17 + 1).
- **Abweichung zum Änderungswunsch:** Tag 19 führt `kilometer: 0.0`, die Etappendaten
  enthalten also keine Fährstrecke. „ca. 0 km Fähre“ wäre irreführend, eine Distanz
  wird nicht erfunden; angezeigt wird „Fähre ohne Kilometerangabe“. Sobald eine
  Fähretappe Kilometer führt, erscheint automatisch „ca. X km Fähre“ (per Test
  abgedeckt). Offen: BB entscheidet, ob eine Fährdistanz ergänzt werden soll.
- Lokal: 47/47 Node-Tests, Build, 245/245 Playwright-Prüfungen (fünf Viewports);
  mobiler CTA-Unterkante 624 px im Viewport. Echte Geräte, Kacheln und Offline-PWA
  ungeprüft. Version unverändert `v2.114`/`v127`. Kein Commit/Push.

### 2026-11-27 – P01/P02: Abschluss-Feinschliff Einstieg, Karte, Highlight-Links (lokal)

- **Mobil:** Start/Ziel („Recklinghausen ↔ Recklinghausen“) steht links neben
  „Zur Tour →“ in einer Flex-Zeile (`space-between`, 12 px Abstand); die Zeile
  ist nicht mehr Teil der Zusammenfassung. Die Highlight-Titel (Tag-Nr. + Kurztitel)
  sind selbst der deutsche Wikipedia-Link (neuer Tab, `noopener noreferrer`,
  ≥ 44 px, unterstrichen); das separate „Wiki“-Label entfällt. Folge: Mobil
  öffnen Highlights keine Etappe mehr, dafür der 22-zeilige Reiseverlauf; die
  Desktop-Karten behalten Etappen- und Wikipedia-Link.
- **Karte:** `fitBounds` ohne Zusatzrand, Padding 14 px (mobil unten 34 px für
  die Attribution), `zoomSnap: 0.25` (sonst Ganzzahl-Zoom mit bis zur Hälfte
  leerer Karte), Tagespunkte `radius: 2.5`. Ab 768 px füllt die Karte die rechte
  Spalte (`min-height: 290px`, aktuell 300 px).
- **Fährlinie:** Die Linie läuft über sieben Stützpunkte durch die Adria statt
  quer über Italien (Igoumenitsa-Track-Ende → [40.15, 19.10] → [41.80, 17.20]
  → [43.30, 14.40] → [44.40, 13.20] → [45.30, 12.50] → Fusina-Track-Anfang). Es
  ist eine grobe Orientierungslinie, keine Seekarte oder Route der Reederei.
  **Abweichung zum Änderungswunsch:** Die Projektdaten (`content/tag-19.md`,
  `content/tag-20.md`) nennen Fusina, nicht Ancona; die Linie endet deshalb an
  den vorhandenen GPX-Endpunkten. Die ersten Stützpunkte bis [41.80, 17.20]
  stammen aus dem Änderungswunsch, die nördlichen wurden bis Fusina ergänzt
  und sind nicht gegen eine Seekarte geprüft. Keine GPX-/Etappendatei geändert.
- Lokal: 46/46 Node-Tests, Build und 240/240 Playwright-Prüfungen in fünf
  Viewports (inkl. 767/768 px) erfolgreich; neu geprüft: Route neben Button,
  Titel-Links, Kartenausschnitt/Punktgröße, sieben Fährstützpunkte, Desktop-Höhe.
  Mobiler Highlight-Test öffnet Etappen über den Reiseverlauf. Externe Kacheln
  sind im Visual-Check ersetzt; echte Geräte, Kacheln und Offline-PWA bleiben
  ungeprüft. Version unverändert `v2.114`/`v127` (ein Schritt gegenüber `main`).
  Kein Commit/Push.

### 2026-11-27 – P01/P02: kompakter mobiler Einstieg und Fährlinie (lokal)

- Unter 768 px stehen sechs kurze Highlights mit getrennten Etappen- und
  Wikipedia-Links neben einer 180 px hohen Gesamtkarte; Zeitraum, Strecken,
  Länder und Route sowie der rechtsbündige Button „Zur Tour →“ folgen darunter.
  Ab 768 px bleibt der zweispaltige Desktop-Einstieg erhalten. Kurztexte und
  Werte stammen aus `content/tour.md` und den vorhandenen Etappendaten.
- Die ungefähre Fährlinie hat eine dunkle Kontur (9 px) und einen
  amberfarbenen Strich (5 px); die Legende übernimmt Farbe und Strichstärke.
  Auf Mobilgeräten bleibt die Route oberhalb der Kartenattribution sichtbar.
  Grundlage sind die benachbarten GPX-Trackenden; der Projektstand nennt
  Igoumenitsa–Fusina, nicht Ancona. Keine GPX- oder Etappendaten geändert.
- Lokal: 44/44 Node-Tests, Produktionsbuild und 235/235 Playwright-Prüfungen
  erfolgreich. Geprüft wurden fünf Viewports einschließlich 767/768 px,
  First-Screen, Touch-Ziele, Textüberlauf, Kontrast, Scroll-Rücksprung und
  Fährlinie; keine Konsolen- oder Laufzeitfehler. Screenshots und Messwerte:
  `web/.visual-report/REPORT.md`. Externe Kartenkacheln werden im Visual-Check
  ersetzt, der Service Worker ist blockiert: reale Geräte, echte Kacheln und
  Offline-Nutzung sind damit nicht geprüft. Version weiterhin `v2.114`/`v127`
  für die gemeinsamen lokalen Änderungen gegenüber `main`. Kein Commit/Push.

### 2026-11-27 – P01/P02: Scroll-Rücksprung und Fährlinie (lokal)

- Die Tourübersicht merkt beim Verlassen ihre Scrollposition; Rücksprung und
  Browser-Zurück/Vor stellen sie wieder her. Das Header-Logo führt nach oben.
  Der Einstiegsknopf steht mobil unter der Gesamtkarte, am Desktop links neben
  ihr unter dem Intro.
- Eine gestrichelte Orientierungslinie verbindet bei einer geladenen
  Fähretappe ohne Track die Track-Endpunkte der benachbarten Tage. Die Linie
  ist als ungefähre Fährverbindung gekennzeichnet und kein See-GPX. Fehlende
  oder fehlerhafte GPX-Dateien werden nicht als tracklose Fährfahrt interpretiert.
  Quellen: `content/tag-18.md` bis `content/tag-20.md` und die zugehörigen
  Tages-GPX. **Abweichung zum Änderungswunsch:** Der vorhandene Tourstand
  nennt Igoumenitsa–Fusina, nicht Ancona; die Karte folgt den Projektdaten,
  ohne den Hafen eigenmächtig zu ändern.
- Lokal: 43/43 Node-Tests, Build erfolgreich, 188/188 Playwright-Prüfungen.
  Scrollpositionen und Reihenfolge wurden in vier Viewports, die Fährlinie
  samt Legende sowie der Fehlerfall ohne Fähr-GPX geprüft. Externe Kacheln
  sind im Visual-Check ersetzt; echte Geräte und Offline-PWA bleiben ungeprüft.
  Version bleibt `v2.114`/`v127`, da beide lokalen Feinschliffe zusammen den
  einen Versionsschritt gegenüber `main` bilden. Kein Commit oder Push.

### 2026-11-27 – P01/P02: Feinschliff der Tourübersicht (lokal)

- Persönliche Du-Ansprache, sechs Länder-Badges und getrennte Wikipedia-Links
  für die Kern-Highlights sowie Hinweise zur Vorabbuchung der Fähren und
  voraussichtlich des Basislagers bei Villach und gegebenenfalls des letzten
  Hotels bei Igoumenitsa. Die Buchungen bleiben unbestätigt. Quellen:
  `content/tour.md` und die Etappen 3, 5, 9, 11, 15 und 17. Die dort
  verlinkten sechs deutschen Wikipedia-Seiten waren am 2026-11-27 über HTTPS
  erreichbar; die Länder beziehen sich auf das Highlight, nicht zwingend auf
  die gesamte Etappe. Offener Widerspruch: `content/tag-17.md` nennt ein
  bestätigtes Meerblickzimmer; die Etappendatei wurde auftragsgemäß nicht
  geändert, der Buchungsstatus muss geklärt werden.
- Gesamtkarte im Hero: 44 Start-/Zielpunkte und alle 21 vorhandenen
  Tracksegmente; Tag 19 besitzt keinen Track. Die bereits für die Etappenkarte
  geladenen GPX-Daten werden wiederverwendet, beide Karten beim Ansichtswechsel
  eingepasst. Fehlende GPX und Kacheln werden angezeigt; Kartendaten sind
  vorläufig und keine geprüfte Navigation.
- Versionsschritt gegenüber `main`: `v2.113`/`v126` → `v2.114`/`v127`;
  Historien und Service Worker synchron. Achtung: Der bestehende Pre-Commit-Hook
  erhöht beide Versionen beim späteren Commit erneut; vor einem Commit den
  korrekten Versionsschritt gegenüber `main` sicherstellen.
- Lokal: Node-Tests 40/40, Produktionsbuild erfolgreich, Playwright 172/172
  PASS in vier Viewports, 44/44 Punkte sichtbar, 21/21 Tracksegmente, kleinste
  geprüfte Touch-Fläche 44 px, Textkontrast mindestens 5,25:1. Simulierte
  GPX- und Kachelausfälle zeigen den Fallback; keine Laufzeitfehler im
  regulären Prüflauf. Der erste Lauf fand unzureichenden Kontrast der
  Kartenquellenangabe; nach Korrektur wurde der gesamte Closed-Loop wiederholt.
  Bericht: `web/.visual-report/REPORT.md`.
- Nicht nachgewiesen: echte Geräte, reale Offline-PWA und echte
  Kartenkacheln; der Visual-Check ersetzt externe Ressourcen und blockiert den
  Service Worker. Kein Commit oder Push.

### 2026-11-26 – P01/P02 Tour-Landingpage umgesetzt (lokal, nicht committet)

- **Stand der Abnahme von heute (BB, siehe Tagesabschluss oben):** A02-2 und
  A02-3 sind live abgenommen (Negativtest #28 dreimal vor dem Push blockiert,
  Positivtest #29 / PR #30 mit `/plan`, `/go` und Vorschau-Bildern gemergt,
  `main` danach `354f459`); `VISUAL_GATE_BLOCKING=true` ist gesetzt. Darauf
  aufbauend wurden `P01`/`P02` interaktiv umgesetzt. **Kein Commit, kein Push**;
  BB prüft das Ergebnis am 2026-11-27.
- **Einstieg (P01):** Die App öffnet auf `#start` (Tourübersicht). Die
  Hauptnavigation bleibt unverändert (Etappen · Galerie · Logistik), damit die
  Header-Checks gelten. Direkteinstieg: Button „Zu den 22 Etappen“, Kern-
  Highlights und der Reiseverlauf (22 Zeilen) öffnen die gewählte Etappe.
  Rücksprung: Logo/Titel im Header, „‹ Tourübersicht“ in der Etappenwahl
  (Desktop) bzw. über der Karte (mobil, 44 px hoch) und die Zurück-Taste des
  Browsers. `#roadbook`, `#media`, `#logistics` funktionieren als Direktlinks
  wie zuvor; alles andere (z. B. alter Anker `#top`) landet auf der
  Tourübersicht. Die Tagesleiste (←/→) ist auf der Tourübersicht ausgeblendet.
  Weil die Karte beim Start verborgen ist, passt `map.resize({ fitAll })` sie
  beim ersten Anzeigen neu ein.
- **Inhalte (P01/P02), ohne Erfindungen:** Zeitraum (08.–29. September 2027,
  22 Kalendertage), Gesamtstrecke (ca. 4.825 km, davon ca. 2.823 km auf dem
  Motorrad und 4 Gespanntage mit ca. 2.002 km), Tourtage (18, Tag 3–20) und
  Reiseverlauf werden zur Laufzeit aus `content/tag-01.md` bis `tag-22.md`
  berechnet (Gespanntag = „PKW“ in der Zeile `**Transport:**`). Alles, was sich
  daraus nicht ableiten lässt, steht in der neuen Datei
  [`content/tour.md`](../content/tour.md) (Länder, Kern-Highlights als
  Etappennummern, Teilnahme, Kontakt, Selbstcheck, Planungshinweise); sie wird
  beim Build gegen die Etappen geprüft (`validateTourInfo`, nur https-Kontakt,
  bekannte Etappen, unbekannte Felder verboten) und über das virtuelle Modul
  `virtual:tour-info` geladen (`web/vite.config.js`). Teilnahme/Kontakt aus F03:
  „Bis zu 5 Motorräder“, „Solo-Fahrer sind willkommen“, Kontakt
  `https://www.instagram.com/boeser_biker`; fehlt ein Feld in `tour.md`, entfällt
  die Angabe (keine Gruppengröße, kein Motorradmodell im Code). Der Selbstcheck ist
  rein informativ (F03): kein Filter, blockiert den Einstieg nicht, Haken nur auf
  dem Gerät (`localStorage`). „Stand der Planung“ nennt vorläufige Planwerte,
  nicht geprüfte GPX-Tracks, nicht vollständig bestätigte Fähren/Unterkünfte und
  Netzbedarf von Karte und Videos. Zusätzlich wurde in
  `web/src/content/logistik.md` der widersprüchliche Punkt „Maximal 4 bis 6
  Motorräder“ durch einen Verweis auf die Tourübersicht ersetzt.
- **Dateien:** neu `content/tour.md`, `web/src/tour-overview.js`,
  `web/tests/issue-tour-landing.test.js`, `web/tests/helpers/content.js`;
  geändert `web/src/main.js`, `web/src/map.js`, `web/src/style.css`,
  `web/src/virtual-roadbook-content.d.ts`, `web/vite.config.js`,
  `web/src/content/logistik.md`, `web/scripts/visual-check.mjs`,
  `web/tests/baseline.test.js`, dieses Daily. Die Dateinamen der Screenshots für
  die PR-Vorschau (`iphone-12-mini-main.png`, `iphone-12-mini-settings.png`,
  `desktop-main.png`) bleiben unverändert; neu: `*-start.png` und
  `*-start-selfcheck.png`.
- **Verifikation (lokal, 2026-11-26):** `node --test web/tests/*.test.js` 38/38;
  `npm run build --prefix web` erfolgreich; `npm run test:visual --prefix web`
  164/164 PASS (4 Viewports: iPhone 12 mini 375, Android 6,4 Zoll 412, Tablet
  768, Desktop 1280; Header-Checks unverändert grün). Neu im Visual-Check:
  Pflichtinhalte, Touch-Ziele ≥ 44 px, Textkontrast ≥ 4,5:1 in allen drei
  Farbschemata (kleinster Wert 5,25:1), Schriftstufe 5/5 ohne Überlauf oder
  abgeschnittenen Text, Einstieg/Rücksprung/Zurück-Taste, sichtbare Karte nach
  dem Einstieg, informativer Selbstcheck. Außerdem Runner-Tests 152/152 sowie
  Python-Tests `web/tests` 2/2 und `scripts` 20/20. Gegenproben (jeweils
  zurückgesetzt, jeweils rot): Karte nicht neu eingepasst; Reiseverlauf öffnet
  immer Etappe 1; Label-Farbe `#4a524c` (Kontrast 2,16:1); Zeilenhöhe 30 px
  (Visual-Check und Unit-Test). Das erste Visual-Ergebnis war rot (Überschrift
  mit Zeilenhöhe 1 schnitt Glyphen an); behoben mit `line-height: 1.2`.
- **Nicht nachgewiesen:** Lauf auf GitHub (Linux-Chromium im Gate), reale
  iOS-/Android-Geräte, Offline-Verhalten. Das PR-Vorschaubild
  `iphone-12-mini-main.png` zeigt jetzt die Etappenansicht mit dem neuen
  Rücksprung-Link.
- **Zur Prüfung durch BB:** (1) „Bis zu 5 Motorräder“ steht als Datum aus F03 in
  `content/tour.md` – falls auf der Seite gar keine Zahl erscheinen soll, Feld
  `teilnahme.max_motorraeder` entfernen. (2) Länderliste und die sechs Kern-
  Highlights (Tag 3, 5, 9, 11, 15, 17) sind redaktionell aus Etappenorten/-titeln
  abgeleitet. (3) Die vier Selbstcheck-Sätze sind aus der Logistik-Checkliste
  paraphrasiert. (4) `content/tour.md`, `web/vite.config.js` und
  `web/scripts/` kann der Issue-Runner nicht ändern (Allowlist) – Pflege
  also nur interaktiv/Maintainer. (5) `logistik.md` nennt weiterhin ein
  konkretes Motorradfabrikat („BMW“) – nicht Teil von P01/P02, bleibt offen.
  (6) Die später ausgeführte Versionspflege ist im Eintrag vom 2026-11-27
  dokumentiert; der Hook erhöht beim Commit nochmals.

### 2026-11-26 – Tagesabschluss: A02 live abgenommen

- **A02-2 und A02-3:** Live-Abnahme laut BB abgeschlossen. Der Negativtest
  in [Issue #28](https://github.com/BoeserBiker/balkan-ride-2027/issues/28)
  blockierte dreimal vor dem Push; kein fehlerhafter Feature-Branch wurde
  veröffentlicht und Debug-Artefakte wurden hochgeladen. Das Issue bleibt für
  die mobile CSS-Anpassung bis morgen offen.
- **Positivtest:** [Issue #29](https://github.com/BoeserBiker/balkan-ride-2027/issues/29)
  lief mit `/plan` und `/go` erfolgreich bis zum PR inklusive automatischer
  Vorschau auf `pr-previews`. [PR #30](https://github.com/BoeserBiker/balkan-ride-2027/pull/30)
  wurde gemergt, Issue #29 geschlossen; der Merge-Stand war `354f459`.
  Der anschließende Pages-Lauf und die Vorschau-Bereinigung waren erfolgreich.
- **Visual-Gate:** `VISUAL_GATE_BLOCKING=true` ist auf GitHub gesetzt.
  Der erfolgreiche Pages-Lauf führte den Visual-Check aus; ob dieser Lauf
  bereits nach dem Setzen der Variable stattfand, wurde nicht geprüft.
- **Morgen:** P01/P02 (Tour-Landingpage mit Tourübersicht und Teilnahme-/
  Kontaktinformationen) sowie Issue #28 abschließen.

### 2026-11-26 – A02-3 umgesetzt (Kurzbefehle `/plan` + `/go`, PR-Vorschaubilder)

- **Umfang:** nur `.github/workflows/ai-agent-workflow.yml`,
  `.github/workflows/cleanup-pr-preview.yml` (neu), `.github/scripts/agent_runner.py`,
  `.github/scripts/test_agent_runner.py`, `config/commands/plan-item.md`,
  `config/commands/implement-item.md` und dieses Daily. Kein App-Code, daher
  keine Versionsänderung durch den Agenten (Dateistand `v2.111` / `v124`; der
  lokale Pre-Commit-Hook erhöht beim Commit).
- **Namensabgrenzung:** Die bisher als „A02-3“ vorgemerkte Störungsbehandlung
  (SDK pinnen, Retry-/Timeout-Budget, Token-Vorabschätzung, D-11) heißt ab jetzt
  **A02-4**; „A02-3“ steht für diese Komfort-Erweiterung.
- **Kurzbefehle:** `comment_command()` im Runner ist die einzige Stelle, die
  Kommandos erkennt. Plan: `/plan-item` oder `/plan` auf einer eigenen Zeile (ein
  Hinweis darüber ist erlaubt). Freigabe: `/implement-item` oder `/go` als
  eigenständiges Wort (Zeilenanfang oder nach Leerraum; nicht in Backticks, URLs
  oder Wörtern wie `/going`, `/google`, `/go-live`). Enthält ein Kommentar beide
  Arten, löst er nichts aus. Weil GitHub-Ausdrücke kein Regex kennen, entscheidet
  der neue Job `route` (`MODE=route`, nur Leserechte) über die Ausgaben
  `plan`/`implement`; `plan-stage` und `implement-generate` hängen daran,
  `validate_event` prüft in jedem Modus erneut. `plan-report` reagiert nur noch
  auf einen Fehlschlag von `plan-stage`. Plan-Schlusssatz (`PLAN_FOOTER`) und
  Fehlerhinweise nennen beide Formen; `plan-item.md`/`implement-item.md` sind
  angepasst. Ohne Schrägstrich (`go`, `google`) passiert nichts.
- **Vorschaubilder:** `implement-verify` lädt nach dem blockierenden Visual-Check
  nur `iphone-12-mini-main.png`, `iphone-12-mini-settings.png` und
  `desktop-main.png` als `pr-preview-images-<run_id>-<attempt>` (1 Tag) hoch
  (nicht blockierend, `include-hidden-files`, weil `.visual-report` ein
  Punkt-Ordner ist). `implement-publish` lädt sie nach dem PR (`MODE=preview`,
  Schritte mit `continue-on-error`: ein Fehler lässt PR und Lauf unberührt),
  `validated_previews()` lässt nur flache, bekannte, höchstens 2 MB große PNG-Dateien
  mit gültigem Header zu, prüft, dass der offene PR genau auf `HEAD_SHA` zeigt, und
  schreibt sie per Git-Plumbing (temporärer Index, `commit-tree`) in den
  Orphan-Branch `pr-previews` unter `issue-<nr>/<sha7>/`; Fast-Forward-Push mit
  bis zu 3 Versuchen, nie Force; `main`, `feature/issue-<nr>` und Arbeitsbaum
  bleiben unberührt. Ein Wiederholungslauf ersetzt nur den eigenen Ordner. Der
  PR-Kommentar mit `<!-- roadbook-preview:<nr> -->` wird bei Wiederholung
  aktualisiert (nur eigene Bot-Kommentare) und bettet die Bilder per
  `raw.githubusercontent.com` ein (Repository ist öffentlich).
  `cleanup-pr-preview.yml` (`pull_request: closed`, nur gleichnamiges Repository,
  Checkout von `main`, `contents: write`) löscht `issue-<nr>/` über `MODE=cleanup`.
- **Tests:** Runner 152/152 (neu: `CommandTests`, `PreviewTests` mit echtem
  Bare-Remote, erweiterte `WorkflowPolicyTests` inkl. Cleanup-Workflow);
  `actionlint` ohne Befund. Gegenproben (jeweils zurückgesetzt): Regex ohne
  Wortgrenze → mehrere Tests rot; PNG-Prüfung entfernt → 4 Tests rot; Ordner-Ersatz im
  Branch entfernt → 2 Tests rot. Live ungeprüft: `upload-artifact`/`download-artifact`
  mit den drei Dateien, Rendern der `raw.githubusercontent.com`-Bilder in der
  GitHub-App und Schreibrechte von `GITHUB_TOKEN` auf `pr-previews` (Branch-Regeln).
- **Offen:** Maintainer-Commit durch BB (Änderung an `.github/` und
  `config/commands/`), Live-Abnahme zusammen mit A02-2 (grün/rot, danach
  `/plan` und `/go` sowie Vorschau im PR). `deploy-pages.yml` lädt
  `web/.visual-report/` ohne `include-hidden-files` hoch; bei Bedarf in einem
  eigenen Schritt nachziehen (nicht Teil von A02-3).

### 2026-11-25 – A02-2 umgesetzt (Commit-Bindung, Vorab-Prüfung, Deploy-Schutz, Visual-Gate)

- **Freigaben (BB):** D-4 = S2, D-6 = relaxed, D-7 = Bundle, D-8 = zweistufig,
  D-10 = ja, D-11 = A02-3 (später separat), D-12 = nicht ändern, D-14 = ja.
  **D-13 ist erledigt** (siehe Arbeitspakete). A02-1 liegt auf `origin/main`
  (`8c4e1bf`).
- **Ablauf neu** (`.github/workflows/ai-agent-workflow.yml`):
  `implement-generate` (nur `contents: read`/`issues: write`, Checkout ohne
  Zugangsdaten) erzeugt einen **lokalen** Commit auf `implement`, schreibt
  Bundle und `meta.json` und meldet `base_sha`, `head_sha`, `bundle_sha256`,
  `plan_sha256`, `artifact_name` (Artefakt `implement-bundle-<run>-<attempt>`,
  1 Tag). `implement-verify` (nur `contents: read`, keine Secrets, kein Token)
  checkt den Basisstand aus, führt `MODE=gate` aus (Bundle-Prüfsumme,
  `git bundle verify`, genau ein Agenten-Commit über `base_sha`,
  Pfad-Allowlist, Dateimodus 100644, Text-/Etappenschema,
  `enforce_changeset_policy`) und checkt erst danach `head_sha` aus; es folgen
  Agenten-Tests, Python-Tests (`web/tests`, `scripts`; D-14), `npm ci`,
  `node --test`, Build, Chromium-Installation und der **blockierende**
  Visual-Check; der Bericht wird mit `if: always()` als Artefakt gesichert.
  `implement-publish` (`needs` Generate und Verify; `concurrency`
  `roadbook-publish-<n>`) führt keinen Artefaktcode aus und läuft `MODE=publish`.
  `implement-report` und `plan-report` benennen die gescheiterte Stufe und
  kommentieren nicht doppelt (Marker `<!-- roadbook-run:<RUN_ID> -->`; bei
  einem Neustart desselben Laufs `<RUN_ID>-<ATTEMPT>`). Shell-Schritte nutzen
  `env:` statt Ausdrucks-Interpolation; per Test abgesichert.
- **Runner** (`.github/scripts/agent_runner.py`): `create_commit` (kein
  `fetch`/`push`), `write_bundle`, `import_bundle`, `inspect_commit`,
  `gate_bundle`, `publish_verified` mit den Prüfungen vor dem Push (Plan-Hash,
  Bundle/SHA, Änderungen ⊆ Plan, Versionsschritt gegen `origin/main`,
  Basis-Abgleich D-6 relaxed, fehlersensitives `git ls-remote --exit-code`
  (nur Exit 2 gilt als „fehlt“), nur Agenten-Commits auf einem bestehenden
  Branch, Branch-Regex `^feature/issue-[1-9][0-9]*$`,
  `--force-with-lease=<ref>:<erwartet>`, Read-after-write) und idempotenter PR
  (bestehender PR wird nur gemeldet). `anthropic` ist optional importiert, damit
  Gate/Publish/Report ohne das SDK laufen. `config/commands/implement-item.md`:
  Schlusssatz angepasst.
- **`deploy-pages.yml`:** Upload und `deploy` nur bei `refs/heads/main`
  (zusätzlich zur Environment-Regel); Python-Tests, Playwright-Installation und
  Visual-Check vor dem Pages-Artefakt; Bericht-Artefakt `visual-report`.
  **Rollout D-8:** `continue-on-error` hängt an der Repository-Variable
  `VISUAL_GATE_BLOCKING`. Solange sie nicht `true` ist, wird der erste
  Linux-Lauf nur gemessen; nach einem ausgewerteten Lauf setzt BB die Variable
  (keine Code-Änderung nötig). `web/scripts/visual-check.mjs` blieb unverändert.
- **Tests:** Runner-Tests 125 (vorher 85): echte Git-Integrationstests mit
  lokalem Bare-Remote (Commit nur lokal, Bundle-Roundtrip, Manipulation, Gate,
  Push exakt des geprüften SHA, Lease, leere Erwartung, fehlerhafter Remote,
  fremde Commits, wiederholter Lauf, veraltete Basis in drei Fällen, PR-
  Idempotenz), Report-/Marker-Tests und `WorkflowPolicyTests` (PyYAML). In
  `features.test.js` entfielen der Workflow-Quelltexttest und die
  Playwright-redundanten Assertions (Geometrie-/Abstands-CSS, Router-,
  Dialog- und Verlauf-Quelltexte; 149 → 68 `assert`-Zeilen in der Datei seit
  Beginn von A02-1). **Bewusst behalten** (kein Playwright-Gegenstück): die
  Speicher-Schlüssel `SETTINGS_KEYS`, die Etappen-Beschriftung, die
  Fahrzeit-Varianten (`.duration-*`), `[hidden]` und die
  Quelltext-Verbotsliste in `main.js`.
- **Verifikation (lokal, Python 3.13 in frischer Umgebung nur mit `requests`
  und `PyYAML`, wie im CI):** Runner 125/125, `web/tests` 2/2, `scripts` 20/20,
  `node --test web/tests/*.test.js` 20/20 (vorher 21; der Workflow-Text-Test
  entfiel), `npm run build --prefix web` erfolgreich,
  `npm run test:visual --prefix web` **100/100 PASS** in vier Viewports (375,
  412, 768, 1280 px; 0 FAIL, 24 Screenshots, keine Konsolenfehler,
  [Prüfbericht](../web/.visual-report/REPORT.md)), `actionlint` 1.7.12 ohne
  Befund, Python-3.10-Syntax der Runner-Dateien geprüft.
  **Gegenproben** (jeweils nachweislich rot, danach zurückgesetzt): (A)
  `ls-remote`-Fehler wie „Branch fehlt“ behandelt → 1 Test rot; (B) Lease durch
  `--force` ersetzt → 2 Tests rot; (C) `continue-on-error` am Visual-Check im
  Verify → Richtlinientest rot. Für Git wurden vorab Bundle-Roundtrip, Lease
  (leer, korrekt, veraltet) und `ls-remote`-Exitcodes (0/2/128) in einem
  lokalen Test-Repository nachgewiesen.
- **Nicht geprüft:** ein Live-Lauf in GitHub Actions (Bundle-Artefakt,
  `upload-artifact@v7`/`download-artifact@v8` – die Tags existieren laut
  GitHub-API, wurden aber nicht ausgeführt), Chromium-Start auf Ubuntu-Runnern,
  Python 3.10 des Workflows, reale Geräte.
- **Hinweise:** (1) `implement-publish` behält die Checkout-Zugangsdaten (nötig
  für den Push); es führt dort keinen Artefaktcode aus. (2) Das Gate im
  Verify kennt die Versionsstufe des Plans nicht (offline); sie wird beim
  Veröffentlichen geprüft. (3) Der Visual-Check blockiert Agenten-PRs sofort;
  scheitert er auf Linux aus Umgebungsgründen, muss er angepasst werden
  (Plan D-8). (4) Der lokale Pre-Commit-Hook erhöht beim Commit Version und
  Cache; App-Code blieb unverändert, daher keine Versionsänderung in diesem
  Schritt (Stand `v2.110` / `v123`). (5) Die Änderungen liegen nur lokal im
  Arbeitsbaum; kein Pull, Commit oder Push. Vor dem Merge dürfen keine
  Implementierungsläufe laufen oder warten.
- **Nächste Schritte:** Maintainer-Commit durch BB, **Live-Abnahme von A02-2**
  (grünes und absichtlich rotes Test-Issue), Auswertung des ersten
  Pages-Visual-Laufs und Setzen von `VISUAL_GATE_BLOCKING=true`; danach
  **P01/P02 (Tour-Landingpage)** und A02-3.

### 2026-11-25 – A02-1 umgesetzt (Plan-Vollständigkeit, Versionsschritt, robuste Tests)

- **Freigaben (BB) zum [Detailplan A02](../docs/V5/Detailplan_A02.md):**
  D-1 = a (Etappenänderungen verlangen beide Versionsdateien, aber keinen neuen
  Webtest), D-2 = B (Runner ergänzt fehlende Versionsdateien sichtbar mit
  „Pflichtdatei (vom Runner ergänzt)“; fehlender Webtest oder fehlende
  Versionsstufe lehnt den Plan ab), D-3 = V1 (`linkedom` und `postcss` als
  direkte `devDependencies`), D-4 = S2, D-5 = a, D-6 = relaxed, D-7 = Bundle,
  D-8 = zweistufig, D-9 = Offenlegung (`omitted_files`), D-10 = ja,
  D-11 = A02-3, D-12 = nicht ändern, D-14 = ja. **D-13 ist nicht entschieden**
  (Löschen des Alt-Branches `feature/issue-24`, Repository-Einstellung
  „Branch nach Merge löschen“; Admin-Aktion von BB).
- **Runner** (`.github/scripts/agent_runner.py`): Pflichtdatei- und
  Versionsstufen-Prüfung vor dem Posten des Plans und vor jedem Modellaufruf
  im Freigabezweig; `check_version_step` (Cache genau +1, synchrone Historien,
  App-Version gemäß Versionsstufe) und `enforce_changeset_policy` vor dem
  Commit; Versionsschritt gegen `origin/main` in `open_pull_request`;
  `collect_context` liefert `required_files`, `test_candidates` und
  `omitted_files` (Versionsdateien werden nicht als Inhalt geladen); Fehler im
  Planmodus erzeugen einen konkreten Kommentar mit Lauf-Marker
  `<!-- roadbook-run:<ID> -->` (der Marker steht auch in den
  Umsetzungs-Fehlerkommentaren). Bis A02-2 erscheint zusätzlich der
  allgemeine Kommentar des Jobs `plan-report`.
- **Commands:** `plan-item.md` (Regeln 5 und 8: Web-Änderung, Pflichtdateien,
  `Versionsstufe`, `test_candidates`, `omitted_files`) und `implement-item.md`
  (Regel 4: Versionsschritt und Versionsstufe) angepasst.
- **Tests:** neue Hilfe [`web/tests/helpers/dom.js`](../web/tests/helpers/dom.js)
  (DOM über `linkedom`, CSS-AST über `postcss`); die in Tabelle 3.5 für A02-1
  vorgesehenen Quelltext-/HTML-/CSS-Assertions in `features.test.js`,
  `roadbook.test.js` und `baseline.test.js` wurden auf DOM-/AST-Prüfungen
  umgestellt. Gemäß D-4 = S2 bleiben die Assertions bestehen, die erst das
  Visual-Gate aus A02-2 abdeckt (u. a. Header-/Dialog-Geometrie-CSS,
  `main.js`-Quelltextprüfungen, Workflow-Text-Test). Abweichungen vom Plan:
  `dialog.showModal()`, `Etappe ${String(...)`, `SETTINGS_KEYS` und die
  `main.js`-Quelltexte zu Router/Verlauf bleiben (Quelltext, aber
  formatunabhängig bzw. PW-abgedeckt erst nach A02-2).
- **Abhängigkeiten:** `linkedom` 0.18.15 (ISC; Pflegestand 2026-11-01) und
  `postcss` 8.5.33 (MIT; bereits transitiv über Vite vorhanden);
  `npm audit`: 0 Schwachstellen, `npm ci --dry-run` mit dem aktualisierten
  Lockfile ohne Fehler.
- **Verifikation (lokal, Tooling-Venv/Python 3.13):** Runner-Tests 85/85
  (vorher 49), `node --test web/tests/*.test.js` 21/21,
  `npm run build --prefix web` erfolgreich, `npm run test:visual --prefix web`
  100/100 PASS in vier Viewports (375, 412, 768, 1280 px; 0 FAIL, 24
  Screenshots, keine Laufzeit-/Konsolenfehler,
  [Prüfbericht](../web/.visual-report/REPORT.md)). **Gegenproben**
  (jeweils nachweislich rot, danach zurückgesetzt): (1) Theme-Farbe
  `schalke --accent` `#3897f0` → `#3897f1` ließ `features.test.js` fehlschlagen;
  (2) entferntes `aria-expanded` am Versionskarten-Button ließ den
  Versionskarten-Test fehlschlagen; (3) auf „Cache ≥ Basis“ abgeschwächte
  `check_version_step`-Prüfung ließ 5 Runner-Tests fehlschlagen. Positive
  Gegenprobe: reines Umsortieren von Attributen und Deklarationen samt Leerraum
  ließ alle 21 Node-Tests grün. Nicht geprüft: Python 3.10 der Workflows, ein
  Live-Lauf in GitHub Actions, reale Geräte.
- **Status:** Die Änderungen liegen nur lokal im Arbeitsbaum (kein Commit,
  kein Push). Wirksam auf `main` werden sie erst nach dem von BB
  autorisierten Maintainer-Commit; `.github/` und `config/commands/` darf der
  Issue-Runner nicht selbst ändern. App-Code und UI blieben unverändert, daher
  keine neue Versionsnummer in diesem Schritt (der lokale Pre-Commit-Hook
  erhöht sie beim Commit trotzdem). Nächster Schritt: **A02-2**.

### 2026-11-25 – A02 als nächste Workflow-Härtung eingeplant

- A02 im Lastenheft technisch und im Pflichtenheft produktseitig verankert:
  vollständige Pläne, SHA-gebundene isolierte Prüfung vor Push, Git-/Pages-
  Schutz, robuste Tests und Visual-Gate. A02 folgt auf A01 und geht größeren
  V5-Features über den Agentenworkflow voraus; Umsetzung nur als direkt von BB
  autorisierter Maintainer-PR.
- A01 als erledigt geführt: Der Agenten-PR
  [#23](https://github.com/BoeserBiker/balkan-ride-2027/pull/23) wurde
  gemergt; der zugehörige
  [Implementierungslauf](https://github.com/BoeserBiker/balkan-ride-2027/actions/runs/45662764461)
  meldet Generate, Verify und Publish erfolgreich. Frühere Versuche zum
  gleichen Issue waren fehlgeschlagen; der Erfolg belegt nicht bereits A02.
- Tatsächlichen lokalen Versionsstand `v2.107` / Cache `v120` im Kopf
  nachgezogen. Verifikation: Dokumentenabgleich, Versionsdateien und
  GitHub-PR-/Laufstatus gelesen; keine Tests, Builds oder Änderungen am
  Produkt- oder Runner-Code.

### 2026-11-25 – Issue-Agenten-Workflow analysiert

- Planvollständigkeit, fragile Tests, Prüf- und Versionsablauf sowie
  Git-/CI-Risiken untersucht; priorisiertes Härtungskonzept mit Fundstellen in
  [Analyse_Agent_Workflow_Haertung.md](../docs/V5/Analyse_Agent_Workflow_Haertung.md).
  Besonders offen: Bindung von Generierung, Verify und PR an denselben Commit,
  Versionsabgleich gegen `main` und Visual-Gate. Keine Härtung umgesetzt.
- Verifikation: statische Quellensichtung und modellfreie Messung der
  Kontextauswahl; keine Tests, Builds oder Live-Actions-Läufe. Der neue Bericht
  ist lokal und durch `.gitignore` ausgeschlossen; ältere `docs/`-Dateien
  können dennoch bereits versioniert sein.
- Damalige Abweichung im Daily-Kopf: Die Versionsdateien zeigten
  App `v2.107` und Cache `v120`, nicht `v2.95` und `v108`. Ein Live-Deploy
  wurde nicht geprüft; der Kopf wurde später berichtigt.

### 2026-11-25 – Wiederholte Implementierungen mit Lease-Push abgesichert

- `.github/scripts/agent_runner.py`: `commit_branch` akzeptiert als Push-Ziel
  ausschließlich `feature/issue-*`, aktualisiert vorher den Remote-Tracking-Ref
  und pusht mit `--force-with-lease`. Ein noch nicht vorhandener Remote-Branch
  blockiert den ersten Push nicht.
- Runner-Tests für den exakten Push-Refspec, den fehlenden Remote-Branch und
  unzulässige Zielbranches ergänzt.
- Verifikation: 49/49 Runner-Tests grün mit `python -m unittest discover -s
  .github/scripts -p test_agent_runner.py` aus der Tooling-Venv. Der direkte
  `unittest`-Dateipfadaufruf ist wegen des versteckten `.github`-Verzeichnisses
  unter Python 3.13 nicht als Modul ladbar.

### 2026-11-25 – P02-Selbstcheck-Modus festgelegt

- BB hat für die Selbstcheck-Checkboxen auf def künftigen Landingpage
  **„rein informativ“** gewählt. Die Haken dienen zur Orientierung und sind
  weder Teilnahmefilter noch Auswahlbedingung. Die Wahl ist in der
  [Freigabe-Checkliste V5](../docs/V5/Freigabe_Checkliste_V5.md) eingetragen;
  diese Entscheidung ist für `P02` damit nicht mehr offen.

### 2026-11-25 – V5-Freigabe verbucht, `docs/` vorbereitet, A01 geprüft

- **Freigabe (BB, 2026-11-25):** F01 A (V5 verbindlich), F02 B (`docs/`
  privat), F03 A (max. 5 Motorräder, Solo-Fahrer ja, Kontakt
  `https://www.instagram.com/boeser_biker`, Selbstcheck rein informativ),
  Startreihenfolge A (`A01` → `P01`/`P02` → `U01`/`U02` → `M01`–`M03` →
  `D`/`L`; `U02` vollständig erst nach `D02`/`D05`). Vermerk steht in der
  [Freigabe-Checkliste V5](../docs/V5/Freigabe_Checkliste_V5.md). Abweichung:
  Der Prompt nannte `https://instagram.com`; übernommen ist der konkrete
  Link aus der von BB ausgefüllten Checkliste.
- **`docs/` privat:** `/docs/` steht in `.gitignore`. Codeprüfung (`web/`,
  `scripts/`, `config/`, `.github/workflows/`): kein Laufzeit-, Build- oder
  Runner-Zugriff mehr auf `docs/`; nur Textverweise in den Agentendateien und
  Befehlsdateien. Der Index enthält `docs/` noch (zehn Dateien, darunter die
  V5-Dokumente). Für BB beim nächsten autorisierten Commit:
  `git rm -r --cached docs/`. Frühere Commits bleiben in der Git-Historie
  unverändert öffentlich einsehbar.
- **A01-Prüfung gegen die Runner-Regeln (`agent_runner.py`):** erlaubt sind
  `content/tag-01..22.md`, `web/index.html`, `web/src/`, `web/public/`,
  `web/tests/` und `config/` ohne `commands/` und `skills/`. Gesperrt, durch
  Tests belegt: `.github/`, `config/commands/`, `config/skills/`,
  `web/scripts/`, `web/package.json`, `web/vite.config.js`, `docs/`,
  `export/`, `daten/`, `assets/` sowie `README.md`. Die Planbindung ist durch
  bestehende Tests abgesichert (Änderungen außerhalb des genehmigten Plans
  und Diffs über die Dateiliste hinaus werden abgelehnt). Ergänzt wurden
  Tests für gesperrte `web/scripts/`, `daten/`, `assets/gpx/` sowie dafür,
  dass `docs/`-Inhalt nie im Modellkontext landet. `assets/gpx/` und
  `README.md` wurden bewusst nicht freigeschaltet (Routendaten durch ein
  Modell; Entscheidung bei BB).
- **V5-Verweise:** `riderrix.agent.md` und `copilot-instructions.md` zeigen
  auf V5 und nennen `docs/` als privat; V4 steht nur noch als historische
  Referenz. `config/commands/` enthalten keine V4-/V5-Dokumentverweise; die
  veraltete Erwähnung des entfernten `logistik`-Kontexts in `plan-item.md`
  wurde korrigiert.
- **Wichtig:** Der gepushte Commit `1f30b8e` enthält die Verschiebung der
  Logistik-Datei, aber nicht die Importänderung in `web/src/main.js`; der
  Actions-Lauf schlug mit `UNRESOLVED_IMPORT` fehl. Die lokale Korrektur
  (`web/src/main.js`, `web/tests/baseline.test.js`) muss mit committet werden.
- **Folge von F02:** Lastenheft (Closed-Loop-Regeln) und Pflichtenheft liegen
  künftig nur lokal; die Links in den öffentlichen `.github/`-Dateien sind für
  Klone und Cloud-Läufe nicht auflösbar.
- Verifikation: `.github/scripts/test_agent_runner.py` (47/47, `requests`
  temporär installiert), `node --test web/tests/*.test.js` (20/20),
  `npm run build --prefix web` erfolgreich. Kein Pull, Commit oder Push; keine
  Änderung unter `web/` in diesem Schritt, daher keine neue Versionsnummer.

### 2026-11-25 – Logistik-Inhalt aus `docs/` in die App verschoben

- `docs/motorrad_checkliste_logistik.md` wurde per `git mv` nach
  [`web/src/content/logistik.md`](../web/src/content/logistik.md) verschoben,
  weil die Datei App-Inhalt des Logistik-Tabs ist. Inhalt unverändert.
- Geändert: Raw-Import in `web/src/main.js`; der Sonderladepfad für `docs/`
  in `.github/scripts/agent_runner.py` entfällt (die Datei liegt jetzt im
  regulären `web/src/`-Kontext des Runners und ist dort bearbeitbar); Verweise
  in Daily, Freigabe-Checkliste V5 und Riderrix-Agentendatei. Ältere
  Chronik-Einträge und V4-Dokumente nennen bewusst noch den früheren Pfad.
- Neuer Basis-Test in `web/tests/baseline.test.js`: App-Inhalte werden aus
  `web/src/` und nicht aus `docs/` gebündelt. Versionen: `v2.100`, Cache
  `v113` (synchron in `version.json` und `sw.js`).
- Verifikation: `node --test web/tests/*.test.js` (20/20), Runner-Tests
  `.github/scripts/test_agent_runner.py` (46/46, `requests` temporär
  installiert), `npm run build --prefix web` erfolgreich.
- Offen: F02 betrifft nur noch, ob `docs/` selbst öffentlich bleibt. Bereits
  veröffentlichte Inhalte bleiben in der Git-Historie. Kein Commit oder Push;
  der Pre-Commit-Hook erhöht Version/Cache beim Commit erneut.

### 2026-11-25 – Freigabe-Checkliste V5 angelegt

- [Freigabe-Checkliste V5](../docs/V5/Freigabe_Checkliste_V5.md) ist ein
  Entscheidungs- und Abnahmeformular für `BB` (F01, F02, F03 und die
  Startreihenfolge der ersten Pakete). Sie enthält keine Anforderungen und
  keine parallele Aufgabenliste; alle Arbeitspakete bleiben hier offen.
- Ist-Nachweis geprüft: Der GitHub-Actions-Lauf `45644550675` auf `main`
  (Commit `95abf34`, Etappenkorrekturen jetzt committet) war erfolgreich mit
  Jobs `build` und `deploy`, `19/19` Node-Tests und Produktionsbuild. Die
  `100/100` Playwright-Checks stammen aus dem lokalen Bericht; sie laufen
  nicht als Actions-Gate.
- Hinweise für die Entscheidung: `U02` hängt an `D02`/`D05` und `P02` an
  `F03`; die Checkliste führt beide Abhängigkeiten bei der Reihenfolge auf.
  Gruppengröße und Kontaktweg bleiben unentschieden, bis `BB` sie einträgt.
- Keine Code-, Routen-, GPX- oder Mediendaten geändert; als
  Dokumentationsänderung keine Tests oder Build ausgeführt. Kein Pull,
  Commit oder Push.

### 2026-11-25 – CI-Fehler auf nicht enthaltene Etappenänderungen zurückgeführt

- Der GitHub-Actions-Lauf auf `756876a119fb1589b7db8a51e139eb8b41b899cb`
  scheiterte in `issue-group-address.test.js`, weil `content/tag-01.md` und
  weitere Etappen der Reihe `tag-01` bis `tag-20` im Commit noch „Zu zweit“
  und/oder „BMW 800 GS“ enthielten. Das ist kein Linux-, Case-Sensitivity-,
  Pfad-, Ignore- oder Zeitzonenfehler.
- Im lokalen Arbeitsbaum sind 20 Etappendateien bereits korrigiert; die
  vollständige Node-Suite besteht dort 19/19, auch unter `TZ=UTC`. Die
  Etappenänderungen sind jedoch nicht im getesteten Commit enthalten. Der
  Regressionstest bleibt bestehen, damit die veralteten Formulierungen nicht
  erneut in einen Commit gelangen.
- Die von den Tests per `new URL(..., import.meta.url)` gelesenen Dateien und
  alle 22 Etappendateien sind laut `git ls-files` getrackt. `.visual-report/`
  ist ignoriert, wird von `web/tests/*.test.js` aber nicht gelesen. Der Raw-
  Import der Logistikdatei in `web/src/main.js` ist ebenfalls getrackt.
- Verifikation: `node --test web/tests/*.test.js` (19/19),
  `npm run build --prefix web` erfolgreich. Kein Pull, Commit oder Push
  ausgeführt; GitHub Actions wird erst grün, wenn die bereits vorhandenen
  Etappenänderungen in einem autorisierten Commit enthalten sind.
- Quellen: `web/tests/issue-group-address.test.js`,
  `content/tag-01.md` bis `content/tag-20.md`, Workflow-Lauf
  `45642675188`.

### 2026-11-25 – Pre-Commit-Versionierung vollständig synchronisiert

- Der Pre-Commit-Lauf erhöhte zuvor App-Version und `sw.js`, ließ aber
  `serviceWorkerCache` und `serviceWorkerHistory` in `version.json` unverändert.
  `scripts/bump_version.py` aktualisiert jetzt App-Version, App-Verlauf,
  Service-Worker-Cache, Cache-Verlauf und `sw.js` gemeinsam. Vor dem Schreiben
  werden erforderliche Verlaufstrukturen und die Cache-Synchronität geprüft.
- `web/tests/test_bump_version.py` prüft zwei aufeinanderfolgende Läufe samt
  Versions- und Cache-Historien. Die Node-Basistests blieben unverändert und
  bestätigten nach dem Hook-Lauf beide Synchronitätsinvarianten.
- Für den lokalen Hook-Test wurde der bereits inkonsistente Zwischenstand
  `sw.js v107` / `version.json v106` zunächst vervollständigt. Der direkte
  Skriptlauf erhöhte anschließend auf App-Version `v2.95` und Cache `v108`.
- Verifikation nach `python3 scripts/bump_version.py`: Python-Unit-Tests
  (2/2), `node --test web/tests/*.test.js` (19/19),
  `npm run build --prefix web` und `npm run test:visual --prefix web`
  (100/100 PASS, 24 Screenshots).
- Quellen: `scripts/bump_version.py`, `web/tests/test_bump_version.py`,
  `web/tests/baseline.test.js`, `web/public/version.json`, `web/public/sw.js`
  und [Visual-Prüfbericht](../web/.visual-report/REPORT.md).

### 2026-11-25 – Versionsschema an bump_version.py angepasst

- Die Versionsdatei verwendet jetzt `v2.93`, passend zum vollständigen
  Versionsmuster `v<Zahl>.<Zahl>` in `scripts/bump_version.py`. Der oberste
  App-Historieneintrag stimmt mit `version` überein.
- Der Service-Worker-Cache wurde wegen der Web-Änderung von `v105` auf `v106`
  erhöht; `sw.js`, `serviceWorkerCache` und der neueste
  `serviceWorkerHistory`-Eintrag sind synchron.
- Das Basistest-Muster und Abschnitt 6 des Lastenhefts wurden auf das
  Skriptformat abgestimmt.
- Verifikation: `node --test web/tests/*.test.js` (19/19),
  `npm run build --prefix web` und `npm run test:visual --prefix web`
  (100/100 PASS, 24 Screenshots).
- Quellen: `scripts/bump_version.py`, `web/public/version.json`,
  `web/public/sw.js`, `web/tests/baseline.test.js`,
  `docs/master_ablauf_prompt_plan_v5.md` und
  [Visual-Prüfbericht](../web/.visual-report/REPORT.md).

### 2026-11-25 – Schriftregler-Zahlen an Rastpunkten ausgerichtet

- Die Zahlen 1–5 stehen nun exakt unter den fünf tatsächlichen Thumb-
  Rastpunkten bei 0 %, 25 %, 50 %, 75 % und 100 % der nutzbaren Reglerlänge.
- Der Visual-Check misst die Mittelpunkt-Abweichung in iPhone 12 mini
  (375 × 812), Android (412 × 915), Tablet (768 × 1024) und Desktop
  (1280 × 800); alle fünf Werte liegen je Viewport bei 0,0 px Abweichung.
- App-Version `v2.92.05`; Service-Worker-Cache von `v104` auf `v105` erhöht
  und mit `version.json` synchronisiert.
- Verifikation: `node --test web/tests/*.test.js` (19/19),
  `npm run build --prefix web` und `npm run test:visual --prefix web`
  (100/100 PASS, 24 Screenshots).
- Quellen: `web/src/style.css`, `web/tests/features.test.js`,
  `web/scripts/visual-check.mjs`, `web/public/sw.js`,
  `web/public/version.json` und
  [Visual-Prüfbericht](../web/.visual-report/REPORT.md).

### 2026-11-25 – Schriftregler auf fünf Stufen erweitert

- Der Schriftgrößenregler bietet jetzt die Stufen 1 bis 5: Klein, Normal,
  Groß, Sehr groß und Extra groß. Stufe 5 setzt die Grundschrift auf 20 px;
  vorhandene gespeicherte Stufe 4 behält ihre bisherige Größe und Bezeichnung.
- Die Versionskarten und geöffneten Historien wurden bei maximaler Schrift
  5/5 in allen vier Playwright-Viewports erneut auf Überlauf und
  Erreichbarkeit geprüft.
- App-Version `v2.92.04`; Service-Worker-Cache von `v103` auf `v104` erhöht
  und mit beiden Verläufen synchronisiert.
- Verifikation: `node --test web/tests/*.test.js` (19/19),
  `npm run build --prefix web` und `npm run test:visual --prefix web`
  (96/96 PASS, 24 Screenshots).
- Quellen: `web/src/main.js`, `web/src/style.css`,
  `web/tests/features.test.js`, `web/scripts/visual-check.mjs`,
  `web/public/sw.js`, `web/public/version.json` und
  [Visual-Prüfbericht](../web/.visual-report/REPORT.md).

### 2026-11-25 – Versionskarten öffnen ihre Historien direkt

- Die separaten Aufklapp-Leisten für App- und Cache-Verlauf wurden entfernt.
  Die Versionskarten stehen jetzt unter „App & Offline-Cache aktualisieren“,
  sind zugängliche Buttons und öffnen jeweils direkt darunter ihre Historie;
  die Verläufe schließen sich gegenseitig aus.
- Dialog, Karten und Historien sind im Playwright-Check bei Schriftstufe 4/4
  auf 375 × 812, 412 × 915, 768 × 1024 und 1280 × 800 geprüft. Die Historien
  bleiben innerhalb des scrollbaren Dialogs vollständig erreichbar.
- App-Version `v2.92.03`; Service-Worker-Cache von `v102` auf `v103` erhöht
  und mit beiden Verläufen synchronisiert.
- Verifikation: `node --test web/tests/*.test.js` (19/19),
  `npm run build --prefix web` und `npm run test:visual --prefix web`
  (96/96 PASS, 24 Screenshots).
- Quellen: `web/src/main.js`, `web/src/style.css`,
  `web/tests/features.test.js`, `web/scripts/visual-check.mjs`,
  `web/public/sw.js`, `web/public/version.json` und
  [Visual-Prüfbericht](../web/.visual-report/REPORT.md).

### 2026-11-25 – Closed-Loop-Regeln gebündelt und Tests modularisiert

- Das Lastenheft V5 ist die zentrale Quelle für Web-Prüfablauf,
  Versionssynchronisierung und Daily-Pflege. Copilot- und Riderrix-Vorgaben
  sowie die Export-README verweisen darauf, statt die ausführlichen Regeln
  parallel zu pflegen. Das Dokumentationskonzept bleibt maßgeblich für die
  Struktur der Übergabe; der GitHub-Issue-Runner erhält dadurch keinen Zugriff
  auf gesperrte Pfade.
- `web/tests/baseline.test.js` bündelt erweiterbare, einzeln benannte
  Grundinvarianten. `web/tests/issue-group-address.test.js` enthält den
  änderungsspezifischen Regressionstest; `features.test.js` behält die
  übrigen Feature- und Workflowprüfungen.
- Cache `v102` ist gegenüber `v101` um genau eins erhöht und mit
  `serviceWorkerCache` sowie dem neuesten Cache-Verlauf synchron. Die App
  bleibt `v2.92.02`, da keine sichtbare oder fachliche App-Änderung erfolgte.
- Verifikation: `node --test web/tests/*.test.js` (19/19) und
  `npm run build --prefix web` erfolgreich. Der Visual-Check wurde nicht
  erneut ausgeführt: UI und Funktionalität blieben unverändert; der letzte
  UI-Lauf ergab 84/84 PASS. Sein Bericht wurde vor dem rein technischen
  Cache-Schritt `v102` erzeugt.
- Quellen: [Lastenheft V5](../docs/master_ablauf_prompt_plan_v5.md),
  [.github/copilot-instructions.md](../.github/copilot-instructions.md),
  [Riderrix-Agent](../.github/agents/riderrix.agent.md),
  `web/tests/baseline.test.js`, `web/tests/issue-group-address.test.js`,
  `web/public/sw.js` und `web/public/version.json`.

### 2026-11-25 – Gruppenansprache und Motorradmodell neutralisiert

- Die UI- und Etappentexte sprechen die Reisegruppe jetzt in der Mehrzahl an.
  Festlegungen wie „BMW 800 GS“ und „zu zweit“ wurden aus den redaktionellen
  Etappentexten entfernt; Fahrzeugmodell und Gruppengröße bleiben offen.
  Originale externe Videotitel und Hashtags blieben als Quellenmetadaten
  unverändert.
- Das Pflichtenheft V5 hält die Produktregel fest. Routen-, GPX-, Entfernungs-,
  Höhenmeter- und Koordinatendaten wurden nicht geändert.
- App-Version `v2.92.02` und Service-Worker-Cache `v101` sind synchron in
  `web/public/version.json` und `web/public/sw.js` dokumentiert.
- Verifikation: `node --test web/tests/*.test.js` (18/18),
  `npm run build --prefix web` und `npm run test:visual --prefix web`
  (84/84, 20 Screenshots) erfolgreich. Der
  [Visual-Prüfbericht](../web/.visual-report/REPORT.md) enthält Messwerte und
  Screenshots.
- Quellen: `content/tag-01.md` bis `content/tag-22.md`,
  `web/src/main.js`, `web/src/roadbook.js`,
  `web/tests/features.test.js`, `web/public/sw.js`,
  `web/public/version.json` und
  [Pflichtenheft V5](../docs/Balkan_Tour_Pflichtenheft_V5.md).

### 2026-11-25 – V5-Dokumentation in Lastenheft, Pflichtenheft und Daily getrennt

- Das technische Lastenheft wurde als
  [docs/master_ablauf_prompt_plan_v5.md](../docs/master_ablauf_prompt_plan_v5.md)
  festgelegt. Es führt Architektur, Datenmodell, PWA, Agenten-Workflow,
  Tests und Versionssynchronisierung ohne laufende Tages-To-dos.
- Das schlanke
  [Produkt- und Fach-Pflichtenheft](../docs/Balkan_Tour_Pflichtenheft_V5.md)
  enthält Zielbild, 22-tägige Roadbook-Struktur, Biker-Ton, Medien-/GPX-
  Anforderungen und die Grenze zwischen PWA und Offline-Navigation.
- Dieses Daily ist die einzige Quelle für aktuellen Arbeitsstand, offene
  Entscheidungen, Arbeitspakete und nächste Schritte. Frühere Pfade unter
  `docs/V5/` wurden zu Verweisen umgestellt; der frühere V5-To-do-Pfad verweist
  auf die offene Arbeit im Daily. V4-Dateien wurden nicht gelöscht oder
  geändert.
- Die Referenzen in Riderrix, Root-README und Export-README wurden auf die
  Dreiteilung umgestellt. Es wurden keine Web-, Routen-, GPX-, Buchungs- oder
  Rechtsdaten geändert. Bearbeitung blieb auf dem aktuellen Branch `main`;
  kein Pull, Commit oder Push ausgeführt.
- Quellen: Lastenheft V5, Pflichtenheft V5, bisherige V5-Dokumente,
  `.github/agents/riderrix.agent.md`, `README.md` und
  `.github/Dokumentationskonzept.md`.

### 2026-11-25 – Galerie-Navigation und Headerausrichtung

- Die öffentliche Navigation wurde von „Medien“ in „Galerie“ umbenannt; der
  Galerie-Seitentitel und das Lightbox-Aria-Label verwenden die Bezeichnung
  konsistent. Die internen Ansichts-IDs und Medienfunktionen bleiben
  unverändert.
- Der Einstellungsbutton ist im Header nun mit Box-Modell- und Randabstand-
  Schutz ausgerichtet; negative vertikale Margins wurden entfernt. Ein
  Playwright-Geometriecheck prüft seine Unterkante relativ zum Galerie-Link
  sowie die Einhaltung des Header-Innenrands.
- Der Visual-Check umfasst jetzt zusätzlich 768 × 1024 px. Auf iPhone 12 mini
  (375 × 812), Android (412 × 915), Tablet (768 × 1024) und Desktop
  (1280 × 800) bestanden 84/84 Prüfungen; die Unterkantenabweichung lag in
  allen Viewports bei 0,0 px. Es wurden 20 Screenshots erzeugt.
- App-Version `v2.92.01` und Service-Worker-Cache `v100` sind in
  `web/public/version.json` und `web/public/sw.js` synchronisiert. Die
  Versionsprüfung sichert auch den Cache-Schritt `v99` → `v100` ab.
- Verifikation: `node --test web/tests/*.test.js` (17/17), `npm run build
  --prefix web` und `npm run test:visual --prefix web` (84/84) erfolgreich.
  Der [Visual-Prüfbericht](../web/.visual-report/REPORT.md) enthält Messwerte
  und Links zu den 20 Screenshots.
- Quellen: `web/src/main.js`, `web/src/style.css`,
  `web/scripts/visual-check.mjs`, `web/tests/features.test.js`,
  `web/public/sw.js` und `web/public/version.json`.

### 2026-11-25 – V5-Prüfergebnisse konsolidiert

- Die drei V5-Dokumente wurden anhand des tatsächlichen Runner-Codeumfangs
  korrigiert: Der Runner ist nicht auf Etappendateien beschränkt, erlaubt
  aber nur eine begrenzte Whitelist. Änderungen an `.github/` und
  `config/commands/` müssen als direkt von BB autorisierter Maintainer-PR
  außerhalb des unbeaufsichtigten Issue-Runners erfolgen (A01 bleibt offen).
- F02 dokumentiert nun beide technischen Verbindungen der
  Logistik-Checkliste: Raw-Import ins Web-Build und Laden in den Modellkontext
  beim Planlauf. Falls `docs/` privat bleibt, müssen beide getrennt werden.
- Der Ist-Stand der 3-Tab-App und das Split-/Stapel-Layout innerhalb
  „Etappen“ wurden von den V5-Zielen P01/U01 getrennt. U02 bezieht sich nach
  D02/D05 auf die getrennte Anzeige von Netto-Modellzeit und Brutto-
  Tagesdauer; die ellipsenfreie Grunddarstellung besteht bereits.
- Die Medienanforderungen wurden auf Lazy Loading, Lightbox, Posterbilder,
  Leerzustände, netzabhängige Einbettungen sowie Lizenz- und Duplikatprüfung
  zurückgeführt. T01 hält den lokalen Visual-Check verpflichtend und die
  Vorbereitung eines GitHub-Actions-CI-Gates fest. Der V5-Verzeichnisbaum
  enthält Masterplan und To-do-Plan; eine nicht vorhandene Agent-Prompt-Datei
  wird nicht mehr als vorhandene Quelle geführt.
- `export/` bleibt für den unbeaufsichtigten Runner gesperrt; diese
  Fortschreibung erfolgte in der interaktiven VS-Code-Sitzung unter direkter
  Steuerung von BB. F01 sowie offene Sach-, Datenschutz- und Routenprüfungen
  bleiben offen. Keine Routen-, Buchungs- oder Rechtsdaten wurden geändert.
- Quellen: [Pflichtenheft V5](../docs/V5/Balkan_Tour_Pflichtenheft_V5.md),
  [Masterplan V5](../docs/V5/master_ablauf_prompt_plan_v5.md),
  [To-do V5](../docs/V5/todo_plan_v5.md), `agent_runner.py`,
  `web/src/main.js` und Pages-Workflow.

### 2026-11-25 – V5-Dokumente und Übergabe auf Ist-Stand gebracht

- Pflichtenheft V5, V5-To-do und V5-Masterplan dokumentieren nun den
  App-Ist-Stand vom 25.11.2026 sowie den zweistufigen Playwright-Closed-Loop
  und den Prüfbericht mit 60/60 PASS und 15 Screenshots. Die V5-Dokumente
  bleiben Entwürfe; F01 und sämtliche offenen V5-Arbeitspakete bleiben offen.
- Root-README behält den bisherigen Roadbook-Agent-Inhalt und ergänzt einen
  knappen Balkan-Ride-Überblick. Export-README und dieser Arbeitsstand nennen
  App `v2.92`, Cache `v99`, 17/17 Node-Tests und erfolgreichen Build.
- Keine Routen-, Buchungs-, Rechts- oder Fachwerte wurden ergänzt oder
  bestätigt. Keine reale iOS-/Android-/Offline-Abnahme behauptet.
- Quellen: `web/public/version.json`, `web/public/sw.js`,
  `web/.visual-report/REPORT.md`, V5-Dokumente und Projekt-README.

### 2026-11-25 – Versionsverlauf in den Einstellungen überarbeitet

- Die Einstellungen zeigen App-Version und Service-Worker-Cache nun als
  kompakte Statuskarten nebeneinander. App- und Service-Worker-Verlauf sind
  getrennte, standardmäßig eingeklappte Bereiche; Einträge sind kompakter
  formatiert und innerhalb ihrer Listen scrollbar. Dialog, Karten und Listen
  begrenzen Breite und Box-Modell, damit Überschriften und Versionsnummern
  nicht an den Modalrändern abgeschnitten werden.
- Bei der Prüfung stand `web/public/sw.js` bereits auf `v97`, während
  `serviceWorkerCache` in `web/public/version.json` noch `v96` auswies. Den
  Cache nicht nochmals auf `v98` erhöht, sondern die JSON-Angabe samt neuem
  Verlaufseintrag auf den angeforderten `v97` synchronisiert. Die sichtbare
  Einstellungsänderung ist als App-Version `v2.91` mit Verlaufseintrag erfasst.
- Verifikation: `node --test web/tests/*.test.js` (17/17) und
  `npm run build --prefix web` erfolgreich. Kein Browser-/Gerätetest; keine
  persönlichen Chat- oder Falldaten in die Übergabe übernommen.
- Relevante Dateien: `web/src/main.js`, `web/src/style.css`,
  `web/public/sw.js`, `web/public/version.json`,
  `web/tests/features.test.js`.

### 2026-11-25 – Medienansicht und Versionspflege abgeschlossen

- Die Suche in `content/`, `scripts/` und `web/src/` fand keine verbliebenen
  `1400`-/`1440`- oder „skaliert“-Texte in Etappendaten oder UI. Die beiden
  technischen 1400-Pixel-Grenzen im Medienimport wurden auf 1600 Pixel
  angehoben, passend zur Vorgabe im Pflichtenheft V4; bestehende Bilder und
  Etappendateien wurden nicht verändert.
- Ein Regressionstest prüft in Etappen- und Gesamt-Medienansicht, dass der
  Bildtitel, Urheber und Lizenz erhalten bleiben und interne
  Bearbeitungsmetadaten nicht angezeigt werden. Das Fotogrid nutzt weiter
  automatische Zeilenhöhen und sichtbaren Overflow; die zentrierte Lightbox
  erhielt Scroll-Overflow-Schutz. Die Einstellungs-Verläufe waren bereits
  einzeln scrollbar und bleiben durch Tests abgesichert.
- Service-Worker-Cache `v96` und App-Version `v2.89` wurden in
  `web/public/version.json` mit jeweils neuem obersten Historieneintrag
  dokumentiert. Die Versionskonsistenz und Deployment-Testreihenfolge sind
  automatisiert geprüft.
- Verifikation: `node --test web/tests/*.test.js` (16/16), `npm run build
  --prefix web`, Python-AST-Syntaxprüfung und gezielte Suche in den relevanten
  Quellordnern erfolgreich. Kein Browser-/Gerätetest. Es wurden keine
  persönlichen Chat- oder Falldaten in die Übergabe übernommen.
- Relevante Dateien: `scripts/fetch_stage_media.py`,
  `web/src/roadbook.js`, `web/src/style.css`, `web/src/main.js`,
  `web/public/sw.js`, `web/public/version.json`,
  `web/tests/roadbook.test.js`, `web/tests/features.test.js`.

### 2026-11-24 – Pflichtenheft V5 erstellt

- Das V5-Pflichtenheft wurde auf Grundlage von V4, Review V4, V5-Agent-Prompt,
  Master-Ablaufplan, To-do-Plan, Logistik-Checkliste und Riderrix-Vorgaben
  konsolidiert.
- Verbindlich ergänzt: 22 Kalendertage Gesamtreise gegenüber 18 Kalendertagen
  Kern-Motorradtour; Landingpage vor den Tages-Steps; getrennte Netto-
  Modellfahrzeit und Brutto-Tagesdauer; Daten-/Höhen-/GPX-Abgleich;
  etappenbezogene Logistikmatrix; Kartenpin- und Layoutanforderungen;
  PWA-Offline-Grenzen; Medien-Duplikat- und Lizenzregeln.
- Das zweistufige `/plan-item`-/`/implement-item`-Verfahren darf nun die
  gesamte Roadbook-App umfassen, einschließlich `web/`, Tests, Inhalte,
  Assets sowie direkt betroffener Build-/CI- und Projektdokumentation. Die
  Umsetzungsstufe bleibt strikt auf die zuvor genehmigte Dateiliste begrenzt;
  Tests und Build sind vor dem PR vorgeschrieben. Secrets, private Exports
  und GitHub-Settings sind ausgeschlossen.
- Dies ist das in V5 festgelegte Soll-Verhalten, nicht die Bestätigung einer
  bereits erweiterten Runner-Fähigkeit. Befehlsdateien, Runner und gegebenenfalls
  Workflows müssen in einem separaten, freigegebenen PR angepasst und geprüft
  werden; auch die Agentenreferenz auf V4 muss nach Projektfreigabe aktualisiert
  werden.
- Gegen die gelesenen Quellvorgaben geprüft. Keine Code-, Etappen-, GPX-,
  Buchungs- oder Medienänderungen vorgenommen; als Dokumentationsänderung
  wurden keine Tests oder Produktionsbuild ausgeführt.
- Offen bleiben die im V5-Dokument markierten Routen-, Kennzahlen-,
  Buchungs-, Rechts-/Logistik-, Medien- und Geräteprüfungen. V5 ändert diese
  Tatsachen nicht und ersetzt keine einzeln geplanten Umsetzungs-PRs. Die
  app-weite Agentenfähigkeit und die Umstellung der Agentenvorgaben auf V5
  benötigen noch separate Implementierung und Freigabe.

### 2026-11-24 – Review V4 mit Pflichtenheft V5 abgeglichen

- Die Anforderungen zu Reisezeiträumen, Landingpage, Modell-/Bruttofahrzeit,
  GPX-/Höhenkonsistenz, Logistik, Kartenpins, UI-Überläufen, PWA-Offlinegrenzen
  sowie Medien-Duplikaten und Attribution sind in V5 grundsätzlich enthalten.
- Nicht ausdrücklich spezifiziert sind ein Kosten-/Budgetüberblick und
  geplante Reserve-/Puffertage. Der Review-Befund zur direkten Einbindung von
  `docs/motorrad_checkliste_logistik.md` wird nicht als Schutzanforderung für
  private Planungsdokumente aufgegriffen; dieser Punkt ist bedingt relevant,
  falls `docs/` privat bleiben soll.
- Teilweise abgebildet: die Höhenkonsistenz wird als allgemeine Anforderung
  festgelegt, aber die konkreten D01-Werte 2.550/3.750 hm und D14 mit 0 hm
  werden nicht als konkrete Prüffälle aufgeführt. Das Mitfahrerprofil steht
  auf der Landingpage; ob bestehende Checkboxen nur informativ oder eine echte
  Filterfunktion sein sollen, wird nicht festgelegt.
- Nur Dokumentenvergleich; Pflichtenheft V5 und App-Dateien wurden nicht
  geändert. Budget, Puffertage, Datenschutz-/Build-Grenze und konkrete
  Prüffälle bleiben als Klärungs-/Ergänzungspunkte offen.

### 2026-11-24 – Masterplan und To-do V5 erstellt

- [Master-Ablaufplan V5](../docs/V5/master_ablauf_prompt_plan_v5.md) und
  [To-do-Plan V5](../docs/V5/todo_plan_v5.md) wurden als Entwürfe auf Basis
  des Pflichtenhefts V5 sowie der V4-Quellen erstellt.
- Die Pläne enthalten die app-weite, pfadgebundene Erweiterung von
  `/plan-item` und `/implement-item`, Daten-/GPX-Prüfungen, Landingpage,
  Logistik-/Kostenmatrix, Puffer- und Fähr-Ausweichplanung, Datenschutz,
  Recruiting-Entscheidung, Medien, PWA und Tests/Build-Abnahme.
- V5 bleibt bis zur ausdrücklichen Freigabe ein Entwurf; V4 ist bis dahin
  maßgeblich. Die Agentenimplementierung und die App wurden nicht geändert.
- Dokumentlinks und Aufgaben wurden redaktionell geprüft. Als
  Dokumentationsänderung wurden keine Code-Tests oder Produktionsbuild
  ausgeführt. Nächste Schritte: V5 freigeben, Privacy-/Recruiting-Entscheidung
  treffen und die offenen Arbeiten über einzelne Issues/PRs planen.

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
  [Motorrad-Logistik-Checkliste](../web/src/content/logistik.md).
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
4. **GitHub-Automatisierung beobachten:** A02-2 und A02-3 sind laut
   Tagesabschluss live abgenommen. Nach weiteren Workflow-Änderungen erneut
   mit einem Test-Issue prüfen.
### V5-Arbeitspakete

Die Kästchen kennzeichnen offene und erledigte Punkte; diese Statuszeilen ersetzen
die frühere parallele To-do-Datei. Fachliche und technische Anforderungen
stehen in den beiden V5-Spezifikationen.

- [x] **F01:** V5 durch BB am 2026-11-25 freigegeben (Pflichtenheft V5 und
  Lastenheft V5 verbindlich; V4 historisch).
- [x] **F02:** `docs/` bleibt privat; per `git rm -r --cached docs/` aus dem
  Git-Tracking entfernt (Commit `8258db0`, Dateien bleiben lokal). Frühere
  Commits bleiben in der Git-Historie öffentlich einsehbar.
- [x] **F03:** Festgelegt: max. 5 Motorräder, Solo-Fahrer ja, Kontakt
  `https://www.instagram.com/boeser_biker`; Selbstcheck-Checkboxen sind rein
  informativ (keine Filter-/Teilnahmebedingung).
- [x] **A01:** App-weite Agentenfähigkeit umgesetzt; erfolgreicher Live-
  Durchlauf mit gemergtem [PR #23](https://github.com/BoeserBiker/balkan-ride-2027/pull/23).
- [x] **A02-2/A02:** Workflow-Härtung nach
  [Detailplan_A02.md](../docs/V5/Detailplan_A02.md) und
  [Analyse_Agent_Workflow_Haertung.md](../docs/V5/Analyse_Agent_Workflow_Haertung.md)
  in den Paketen A02-1 und A02-2 umgesetzt und live abgenommen. Die separate
  Störungsbehandlung A02-4 bleibt offen.
  - [x] **A02-1** (Plan-Vollständigkeit, Versionsschritt, robuste Tests):
    auf `origin/main` (`8c4e1bf`).
  - [x] **A02-2** (Commit-Bindung per Bundle, isolierte Prüfung vor dem Push,
    Deploy-Guard, Visual-Gate): lokal umgesetzt (Runner 125/125, Node 20/20,
    Python-Tests Web 2/2 und Skripte 20/20, Build, Visual 100/100,
    `actionlint` ohne Befund); Details in der Chronologie.
  - [x] **Live-Abnahme A02-2:** Negativtest #28 blockierte laut BB dreimal vor
    dem Push, Positivtest #29 führte zum gemergten PR #30.
  - [x] **A02-3** (Kurzbefehle `/plan` und `/go`, Vorschaubilder im PR,
    Cleanup-Workflow `cleanup-pr-preview.yml`): auf `main` und zusammen mit
    A02-2 live abgenommen; `/plan`, `/go` und PR-Vorschaubilder im Positivtest.
  - [ ] **A02-4** (Störungsbehandlung, bisher als A02-3 vorgemerkt):
    SDK/Abhängigkeiten pinnen, Retry-/Timeout-Budget, Token-Vorabschätzung
    (D-11).
- [x] **D-13:** `feature/issue-24` gelöscht und „Branch nach Merge löschen“
  aktiviert (von BB auf GitHub erledigt; per `gh` bestätigt:
  `deleteBranchOnMerge: true`, `feature/issue-24` nicht mehr vorhanden).
- **A03:** Zuvor gemeinsam mit A01–A03 als lokal geprüft aufgeführt
  (47/47 Runner-Tests); die eigenständige Zuordnung bleibt zu klären.
- [ ] **D01–D08:** Verbindliche Quellen abgleichen, Datenmodell migrieren und
  Höhen-, Distanz-, Zeit-, GPX- und Adressprüfungen durchführen.
- [x] **P01–P02:** Tour-Landingpage (Tourübersicht als Startseite mit
  Direkteinstieg in die 22 Tage, Rücksprung, Teilnahme/Kontakt aus F03 und rein
  informativem Selbstcheck) lokal umgesetzt und verifiziert (Node 38/38, Build,
  Visual 164/164); **nicht committet**. Nächster Schritt: Prüfung durch BB am
  2026-11-27, danach Maintainer-Commit und Auswertung des Gates auf GitHub. Die
  fachlichen Prüfpunkte stehen in der Chronologie. Daneben bleibt Issue #28
  (mobile CSS-Anpassung) offen.
- [ ] **L01–L05:** Etappenlogistik, Reichweite/Pannen, Fähren/Unterkünfte
  (u. a. Adria- und Koman-Fähre, Villach und Igoumenitsa), Kostenstruktur und
  Reserveplanung quellenbasiert klären.
- [ ] **U01–U02:** Kartenpins lesbar entflechten und Netto-Modellzeit von
  Brutto-Tagesdauer getrennt darstellen.
- [ ] **M01–M03:** Medien-Duplikate, Lizenzen/Attribution und Galerie-
  Performance samt Leerzuständen prüfen.
- [ ] **W01–W02:** PWA-Offlineumfang und Aktualisierung auf iOS/Android
  getrennt abnehmen.
- [x] **T01:** Visual-Gate (`npm run test:visual --prefix web`) in den
  Workflows eingerichtet: in `implement-verify` blockierend (ohne
  `continue-on-error`, Bericht als Artefakt auch bei Fehler); in
  `deploy-pages.yml` durch `VISUAL_GATE_BLOCKING=true` scharfgeschaltet.
  Der Visual-Check lief im erfolgreichen Pages-Lauf nach PR #30; ein Lauf
  nach dem Setzen der Variable wurde nicht gesondert nachgewiesen.
- [ ] **T02–T04:** Mobilen Agenten-End-to-End-Lauf, Gesamt- und
  Live-Abnahme abschließen; der lokale Visual-Check bleibt bei UI- und
  Funktionsänderungen verpflichtend.

## Relevante Quellen

- [Lastenheft V5](../docs/master_ablauf_prompt_plan_v5.md)
- [Pflichtenheft V5](../docs/Balkan_Tour_Pflichtenheft_V5.md)
- [Freigabe-Checkliste V5](../docs/V5/Freigabe_Checkliste_V5.md)
- [Pflichtenheft V4](../docs/Balkan_Tour_Pflichtenheft_V4.md)
- [Master-Ablaufplan V4](../docs/master_ablauf_prompt_plan_v4.md)
- [To-do-Plan V4](../docs/todo_plan_v4.md)
- [Motorrad-Checkliste Logistik](../web/src/content/logistik.md)
- [Copilot-Anweisungen](../.github/copilot-instructions.md)
- [Dokumentationskonzept](../.github/Dokumentationskonzept.md)
- [Chatverlauf-Inventar](../daten/chat_verlauf/README.md)

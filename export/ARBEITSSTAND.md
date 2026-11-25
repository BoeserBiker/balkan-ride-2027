## Arbeitsstand – Balkan-Ride 2027

**Stand:** 2026-11-25

**Workspace:** `Balkan-Ride-2027`  
**Leitdokument:** [.github/Dokumentationskonzept.md](../.github/Dokumentationskonzept.md)

## Aktueller Stand

- Web-Stand 2026-11-25: App-Version `v2.95`, Service-Worker-Cache `v108`
  (synchron laut `web/public/version.json` und `web/public/sw.js`). Die App
  hat getrennte Ansichten Etappen/Galerie/Logistik, einen 5-Stufen-
  Schriftregler und kompakte Einstellungen, deren Versionskarten unter dem
  Aktualisierungsbutton liegen und ihre jeweilige Historie exklusiv öffnen.
  Die Tests trennen wiederverwendbare Basisprüfungen von issue-spezifischen
  Regressionen. Roadbook und UI sprechen die Reisegruppe
  in der Mehrzahl an; ein konkretes Motorradmodell und eine Gruppengröße
  bleiben offen. Der
  Playwright-Closed-Loop prüfte vier Viewports
  (375, 412, 768 und 1280 px): 100/100 PASS, 24 Screenshots in
  `web/.visual-report/REPORT.md`. Die gemessene Unterkantenabweichung des
  Einstellungsbuttons zur „Galerie“-Beschriftung betrug bei allen vier
  Viewports 0,0 px. In Schriftstufe 5/5 lagen beide Versionskarten unter dem
  Aktualisierungsbutton; App- und Cache-Historie ließen sich ohne horizontalen
  oder vertikalen Inhaltsüberlauf exklusiv öffnen. 19/19 Node-Tests und
  Produktionsbuild erfolgreich. Die fünf Zahlenmarken des Schriftreglers
  sitzen in allen Viewports mit 0,0 px gemessener Abweichung unter den
  Soll-Rastpunkten 0/25/50/75/100 %.
  Dies ist keine reale Geräte-/Offline- oder fachliche V5-Abnahme.
- Die V5-Dokumentation ist in drei Zuständigkeiten getrennt: das
  [Lastenheft](../docs/master_ablauf_prompt_plan_v5.md) führt technische
  Vorgaben und Architektur, das
  [Pflichtenheft](../docs/Balkan_Tour_Pflichtenheft_V5.md) das Produkt- und
  Fachziel, dieses Daily den aktuellen Stand und alle offenen Arbeiten. V5
  ist seit der Freigabe durch BB am 2026-11-25 die verbindliche
  Arbeitsgrundlage; V4 bleibt als historische Referenz erhalten. Die
  Statuszeilen „Entwurf zur Nutzerfreigabe“ in den beiden V5-Dokumenten
  selbst sind noch nicht nachgezogen.
- Die tatsächliche Runner-Allowlist umfasst neben `content/tag-01.md` bis
  `content/tag-22.md` auch `web/index.html`, `web/src/`, `web/public/`,
  `web/tests/` und Teile von `config/`; `.github/`, `config/commands/`,
  `config/skills/`, `web/scripts/`, `web/package.json`, `docs/` und `export/`
  sowie `web/vite.config.js`, `assets/` und alle übrigen nicht gelisteten
  Pfade sind nicht erlaubt. A01 kann daher nicht über den bestehenden Runner
  laufen und braucht einen direkt von BB autorisierten Maintainer-PR.
- Die frühere Logistik-Datei wurde nach
  [`web/src/content/logistik.md`](../web/src/content/logistik.md) verschoben.
  Raw-Import in `web/src/main.js` und Sonderladen im Runner-Planlauf hängen
  damit nicht mehr an `docs/`; F02 betrifft nur noch die Frage, ob `docs/`
  selbst öffentlich bleibt. Die Privacy-Entscheidung bleibt offen.
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
  Das Motorrad zeigt nach links und trägt blaue und weiße Akzente.
  Beim damaligen Icon-Update wurden Service-Worker-Cache und Icon-URLs auf
  Version 3 gesetzt; der aktuelle Cache-Stand ist `v104`. Die tatsächliche
  Aktualisierung bereits installierter Homescreen-Icons auf iOS und Android
  muss auf Geräten geprüft werden.
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
4. **GitHub-Automatisierung beobachten:** Der Plan → Freigabe → PR-Ablauf
   wurde mit PR #2 erfolgreich getestet. Nach weiteren Workflow-Änderungen
   erneut mit einem Test-Issue prüfen.
### V5-Arbeitspakete – offen

Alle folgenden Punkte bleiben offen; diese kompakten Statuszeilen ersetzen
die frühere parallele To-do-Datei. Fachliche und technische Anforderungen
stehen in den beiden V5-Spezifikationen.

- [x] **F01:** V5 durch BB am 2026-11-25 freigegeben (Pflichtenheft V5 und
  Lastenheft V5 verbindlich; V4 historisch).
- [ ] **F02:** Entscheidung getroffen: `docs/` bleibt privat. `.gitignore` ist
  vorbereitet, beide Kopplungen sind getrennt; offen ist `git rm -r --cached
  docs/` im nächsten autorisierten Maintainer-Commit (siehe Chronologie).
- [x] **F03:** Festgelegt: max. 5 Motorräder, Solo-Fahrer ja, Kontakt
  `https://www.instagram.com/boeser_biker`; Selbstcheck-Checkboxen sind rein
  informativ (keine Filter-/Teilnahmebedingung).
- [x] **A01–A03:** Im lokalen Code nachgewiesen (47/47 Runner-Tests): V5-
  Pfadgrenzen, Planbindung und Agentenreferenzen. Wirksam auf `main` erst
  nach dem autorisierten Maintainer-Commit der `.github/`- und
  `config/commands/`-Änderungen.
- [ ] **D01–D08:** Verbindliche Quellen abgleichen, Datenmodell migrieren und
  Höhen-, Distanz-, Zeit-, GPX- und Adressprüfungen durchführen.
- [ ] **P01–P02:** Tourübersicht und Teilnahme-/Kontaktanforderungen nach
  Klärung der zugrunde liegenden Fakten umsetzen.
- [ ] **L01–L05:** Etappenlogistik, Reichweite/Pannen, Fähren/Unterkünfte
  (u. a. Adria- und Koman-Fähre, Villach und Igoumenitsa), Kostenstruktur und
  Reserveplanung quellenbasiert klären.
- [ ] **U01–U02:** Kartenpins lesbar entflechten und Netto-Modellzeit von
  Brutto-Tagesdauer getrennt darstellen.
- [ ] **M01–M03:** Medien-Duplikate, Lizenzen/Attribution und Galerie-
  Performance samt Leerzuständen prüfen.
- [ ] **W01–W02:** PWA-Offlineumfang und Aktualisierung auf iOS/Android
  getrennt abnehmen.
- [ ] **T01–T04:** Tests/CI, mobilen Agenten-End-to-End-Lauf, Gesamt- und
  Live-Abnahme abschließen; Visual-Check ist bis zu einem nachgewiesenen
  Actions-Gate lokal verpflichtend.

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

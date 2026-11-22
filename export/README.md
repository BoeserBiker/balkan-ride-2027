# Export- und Übergabedokumentation

## Zweck

Dieses Verzeichnis enthält die fortzuschreibende Projektübergabe. Maßgeblich
ist [.github/Dokumentationskonzept.md](../.github/Dokumentationskonzept.md).
`ARBEITSSTAND.md` hält den aktuellen Stand, wesentliche Entscheidungen und die
Chronologie fest; diese README erklärt Ablage, Pflege und Umzug.

## Pflege

- Vor Änderungen die vorhandene README und den Arbeitsstand lesen und
  fortschreiben.
- Nach jeder wesentlichen Projektänderung oder Analyse Datum, Ergebnis,
  Verifikation und offene Punkte im Arbeitsstand ergänzen.
- Nächste Schritte und relevante Quelldateien mit angeben.
- Keine Chatabschriften, Geheimnisse oder unnötigen personenbezogenen Daten in
  die Übergabedokumentation kopieren. Für den Gesprächsverlauf auf die
  gesonderten Dateien unter `daten/chat_verlauf/` verweisen.
- Die früheren Chat-Exporte unter `daten/chat_verlauf/` wurden am 2026-11-21
  auf Nutzerwunsch aus dem Workspace entfernt. Das Verzeichnis enthält derzeit
  keine Chat-Exporte. Die Ignore-Regeln bleiben als Schutz für mögliche
  künftige Exporte bestehen; sie sind keine Verschlüsselung.
- Bei einem Umzug den gesamten Workspace einschließlich versteckter Dateien
  prüfen. Chat-Exporte werden durch
  [`daten/chat_verlauf/.gitignore`](../daten/chat_verlauf/.gitignore) von Git
  ausgeschlossen und bei einem reinen Git-Klon nicht mitgenommen. Eine
  künftige Übertragung muss separat und geschützt erfolgen.
- Codebase-Memory ist ein externer/lokaler Index und wird durch das Kopieren der
  Workspace-Dateien nicht übertragen. Den Ziel-Workspace nach dem Umzug neu
  indizieren und den Indexstatus prüfen. Künftige Dateien unter
  `daten/chat_verlauf/` sind durch ihre `.gitignore` bewusst sowohl vom
  Git-Upload als auch von der Codebase-Memory-Indexierung ausgeschlossen.

## Dateien

- [ARBEITSSTAND.md](./ARBEITSSTAND.md) – Projektstatus, Chronologie, offene
  Punkte und Umzugs-Checkliste.
- Die Web-App liegt unter `../web/`; `.github/workflows/deploy-pages.yml`
  baut `web/dist/` und veröffentlicht es bei Pushes auf `main` über GitHub
  Pages. Die Pages-Quelle „GitHub Actions“ ist konfiguriert; die veröffentlichte
  App ist unter
  [boeserbiker.github.io/balkan-ride-2027](https://boeserbiker.github.io/balkan-ride-2027/)
  erreichbar.
- Die SVG-Vorlage und die daraus erzeugten PWA-Icons liegen in
  `../web/public/`. Bei einer Motivänderung PNGs erneut aus der SVG erzeugen,
  die Icon-URLs in HTML, Manifest und Header sowie den Service-Worker-Cache
  gemeinsam versionieren und die Aktualisierung auf Mobilgeräten prüfen.
- [Chatverlauf-Inventar](../daten/chat_verlauf/README.md) – lokale
  Gesprächssicherungen und deren Einschränkungen.
- Der lokale Final-Plan V7 liegt im Geschwister-Workspace unter
  `../../Balkan 27/Tourplaung/Balkan_Tour_Plan_2027_V7.md`; der V7-Wegpunktplan
  und der CSV-Kartenimport sind im Repository unter `../assets/gpx/` abgelegt.
  Die GPX-Wegpunkte sind keine geprüften Fahrspur-Tracks.
- Nach jedem Import oder jeder Änderung an einer Eingabe die Dateien
  `Balkan_Tour_2027.gpx`, `Balkan_Tour_Plan_2027_V7.md` und `Maps_Import.csv`
  abgleichen. Nur `../assets/gpx/Balkan_Tour_2027.gpx` speist den täglichen
  OSRM-Trackgenerator direkt; Änderungen an CSV oder Plan müssen vor der
  Neuberechnung in die GPX-Hauptroute übernommen werden. Die
  [Riderrix-Agentendatei](../.github/agents/riderrix.agent.md) enthält den
  gewünschten Trackpunkt-Parameter und den Agenten-Aufruf. Bei manuellem
  Skriptaufruf den Wert selbst mit `--max-track-points` übergeben; ohne Option
  gilt der Skriptstandard. Danach GPX-Dateien validieren und den Frontend-Build
  mit `npm run build --prefix web` prüfen.
- Medien können mit `python3 -m pip install -r scripts/requirements.txt`
  vorbereitet werden. `python3 scripts/fetch_stage_media.py --images-only`
  ergänzt bis auf vier Commons-JPEGs mit CC-Lizenz und Quellenangaben pro Tag;
  bestehende Medien werden nicht überschrieben. Die Treffer sind fachlich zu
  prüfen. `--youtube-only` sucht separat nach Videos mit einer geprüften Länge
  von 5 bis 120 Sekunden und benötigt `YOUTUBE_API_KEY` aus der Umgebung oder
  der ignorierten `.env`. Bereits vorhandene Videoeinträge bleiben unverändert
  und werden nicht erneut geprüft oder ersetzt. Ohne Flag
  werden beide Modi ausgeführt. Videos von YouTube benötigen eine Verbindung;
  lokale Bilder sind nach dem Laden im Service-Worker-Cache verfügbar.
- Der Web-Build erzeugt das GPX-ZIP aus den 22 Tagesdateien. D19 ist darin
  als Seetag ohne Straßen-Track enthalten; die Straßen-Tracks sind vorläufige
  OSRM-PKW-Routen und müssen vor der Tour geprüft werden.
- [Pflichtenheft V4](../docs/Balkan_Tour_Pflichtenheft_V4.md) – fachliche und
  technische Projektvorgaben.
- [Master-Ablaufplan V4](../docs/master_ablauf_prompt_plan_v4.md) – Agenten-
  und Automatisierungsplan.
- [To-do-Plan V4](../docs/todo_plan_v4.md) – Projektphasen und offene
  Checkliste.

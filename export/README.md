# Export- und Übergabedokumentation

## Zweck

Dieses Verzeichnis enthält die fortzuschreibende Projektübergabe. Maßgeblich
ist [.github/Dokumentationskonzept.md](../.github/Dokumentationskonzept.md).
`ARBEITSSTAND.md` hält den aktuellen Stand, wesentliche Entscheidungen und die
Chronologie fest; diese README erklärt Ablage, Pflege und Umzug.

## Dokumentenaufteilung

- [Lastenheft V5](../docs/master_ablauf_prompt_plan_v5.md) ist führend für
  technische Anforderungen, Architektur, Datenmodell, PWA, Qualitätssicherung
  und Agenten-Workflow.
- [Pflichtenheft V5](../docs/Balkan_Tour_Pflichtenheft_V5.md) enthält das
  Produkt- und Fachziel für Tour und Roadbook.
- [ARBEITSSTAND.md](./ARBEITSSTAND.md) ist das Daily und führt ausschließlich
  aktuellen Stand, Chronologie, offene Entscheidungen und nächste Schritte.
- Die früheren V5-Pfade unter `docs/V5/` sind Verweise, keine parallelen
  Spezifikationen oder To-do-Listen. V4-Dateien bleiben erhalten.

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
- Verbindliche Test-, Build-, Visual-, Versions- und Daily-Regeln stehen im
  [Lastenheft V5](../docs/master_ablauf_prompt_plan_v5.md), Abschnitte 5–7.

## Aktueller Web-Stand – 2026-11-25

- App-Version `v2.95`; Service-Worker-Cache `v108`. Die beiden Versionen und
  Verläufe sind in `../web/public/version.json` synchron dokumentiert.
- Die App führt die Ansichten Etappen, Galerie und Logistik; im
  Einstellungsdialog liegen die klickbaren Versionskarten unter dem
  Aktualisierungsbutton und öffnen ihre Verläufe direkt darunter, jeweils
  exklusiv. Der fünfstufige Schriftregler reicht von Klein bis Extra groß.
  UI und Roadbook sprechen die Reisegruppe in der Mehrzahl an; ein konkretes
  Motorradmodell bleibt offen. Basis- und issue-spezifische Regressionstests
  sind getrennt.
  19/19 Node-Tests und Produktionsbuild bestanden. Der
  Playwright-Closed-Loop besteht 100/100 Prüfungen und erzeugte 24 Screenshots
  für vier Viewports (375, 412, 768 und 1280 px), einschließlich Dialog und
  beider geöffneter Historien bei Schriftstufe 5/5; Ergebnisse stehen im
  [`web/.visual-report/REPORT.md`](../web/.visual-report/REPORT.md). Die
  fünf Zahlenmarken liegen dort an allen Viewports mit 0,0 px Abweichung
  unter den Rastpunkten 0/25/50/75/100 %. Dies
  ersetzt keine reale iOS-/Android-/Offline-Abnahme. Details, offene Punkte
  und nächste Schritte stehen in
  [ARBEITSSTAND.md](./ARBEITSSTAND.md).

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
  ergänzt bis auf vier Commons-JPEGs mit CC-Lizenz und Quellenangaben pro Tag
  und begrenzt die Bildbreite auf 1600 px; bestehende Medien werden nicht
  überschrieben. Die Treffer sind fachlich zu prüfen. `--youtube-only` sucht
  separat nach Videos mit einer geprüften Länge
  von 5 bis 120 Sekunden und benötigt `YOUTUBE_API_KEY` aus der Umgebung oder
  der ignorierten `.env`. Bereits vorhandene Videoeinträge bleiben unverändert
  und werden nicht erneut geprüft oder ersetzt. Ohne Flag
  werden beide Modi ausgeführt. Videos von YouTube benötigen eine Verbindung;
  lokale Bilder sind nach dem Laden im Service-Worker-Cache verfügbar.
- Der Web-Build erzeugt das GPX-ZIP aus den 22 Tagesdateien. D19 ist darin
  als Seetag ohne Straßen-Track enthalten; die Straßen-Tracks sind vorläufige
  OSRM-PKW-Routen und müssen vor der Tour geprüft werden.
- [Lastenheft V5](../docs/master_ablauf_prompt_plan_v5.md) – technische
  Vorgaben und Architektur.
- [Pflichtenheft V5](../docs/Balkan_Tour_Pflichtenheft_V5.md) – Produkt- und
  Fachanforderungen.
- [V5-Daily](./ARBEITSSTAND.md) – aktueller Projektstand und offene Arbeiten.
- [Früherer V5-To-do-Pfad](../docs/V5/todo_plan_v5.md) – Verweis auf das
  Daily; die Liste wird dort nicht parallel weitergeführt.
- [Pflichtenheft V4](../docs/Balkan_Tour_Pflichtenheft_V4.md) – erhaltene
  Vorgängergrundlage; bis zur ausdrücklichen V5-Freigabe maßgeblich.
- [Master-Ablaufplan V4](../docs/master_ablauf_prompt_plan_v4.md) – Agenten-
  und Automatisierungsplan.
- [To-do-Plan V4](../docs/todo_plan_v4.md) – Projektphasen und offene
  Checkliste.

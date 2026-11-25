# Lastenheft V5 – Balkan-Ride 2027

**Stand:** 25.11.2026 · **Status:** Entwurf zur ausdrücklichen Nutzerfreigabe

Dieses Dokument ist die führende technische Anforderungsspezifikation für
Architektur, Datenmodell, PWA, Qualitätssicherung und den zweistufigen
Agenten-Workflow. Es enthält keine laufende Aufgabenliste oder Tagesberichte.

## Dokumentenabgrenzung

- Das [Pflichtenheft V5](./Balkan_Tour_Pflichtenheft_V5.md) beschreibt
  ausschließlich Produktziel und fachliche Nutzeranforderungen.
- Das [Daily](../export/ARBEITSSTAND.md) hält aktuellen Projektstand,
  Entscheidungen, offene Arbeitspakete und nächste Schritte fest.
- V5 bleibt bis zur ausdrücklichen Freigabe durch den Projektverantwortlichen
  ein Entwurf; bis dahin gilt V4 als bisherige freigegebene Grundlage.
  Bestehende V4-Dokumente bleiben erhalten und werden nicht stillschweigend
  überschrieben.

## 1. Architektur und technische Leitplanken

- Das vorhandene Repository wird weiterverwendet. Vorgesehener Stack:
  HTML5, Tailwind CSS, Vanilla JavaScript (ES6+), Vite und Leaflet; kein
  Laufzeit-Frontend-Framework ohne eigene Freigabe einführen.
- Anwendungscode liegt unter `web/`; Etappendaten liegen in
  `content/tag-01.md` bis `content/tag-22.md`; Projektmedien und GPX-Dateien
  werden aus den jeweils freigegebenen Projektpfaden geladen.
- Der Produktionsbuild erzeugt `web/dist/` und berücksichtigt den
  GitHub-Pages-Unterpfad `/balkan-ride-2027/`. Ressourcen und Links müssen
  unter diesem Unterpfad funktionieren.
- Die Oberfläche setzt das im Pflichtenheft beschriebene
  Polarsteps-orientierte Erlebnis technisch um. Tagesauswahl, Kartenfokus,
  Step-Navigation und zugehörige Medien verwenden denselben aktiven
  Etappenstatus. Desktop- und Mobilansichten dürfen keine Inhalte oder
  Bedienfunktionen verlieren.
- Die tatsächlichen aktuellen Runner-Pfadgrenzen und ihr Verifikationsstand
  stehen im Daily. Eine gewünschte Erweiterung der Allowlist ist kein bereits
  vorhandenes Recht und muss separat geplant, genehmigt und getestet werden.

## 2. Datenmodell und Integrität

### 2.1 Etappen-Frontmatter

Das V4-Kompatibilitätsschema bleibt bis zu einer ausdrücklich geprüften
Migration erhalten. Die Pflichtfelder sind:

`tag`, `datum`, `titel`, `start`, `ziel`, `koordinaten_start`,
`koordinaten_ziel`, `kilometer`, `fahrzeit`, `hoehenmeter`, `gpx_datei`,
`highlights`, `bilder` und `videos`.

V5 ergänzt, soweit die Migration freigegeben ist:

- `fahrzeit_netto_modell` als reine modellierte Fahrzeit ohne Pausen;
- `tagesdauer_brutto_schaetzung` als getrennte, begründete Schätzung
  einschließlich relevanter Unterbrechungen;
- `hoehenmeter_status` und `gpx_status`;
- nachvollziehbare Medienmetadaten für Typ, Beschreibung/Titel, Quelle,
  Urheber, Lizenz, Poster und gegebenenfalls Symbolbild-Kennzeichnung.

Das Kompatibilitätsfeld `fahrzeit` bedeutet weiterhin ausschließlich
Netto-Modellfahrzeit und darf nicht stillschweigend umgedeutet werden.
Während einer Migration müssen `fahrzeit` und
`fahrzeit_netto_modell` übereinstimmen. Fehlende, unklare oder ungeprüfte
Werte bleiben eindeutig offen bzw. vorläufig; keine Koordinaten, Zeiten,
Distanzen, Höhenmeter, Quellen oder Statusangaben erfinden.

### 2.2 GPX und Validierung

- GPX-Dateien müssen wohlgeformtes XML mit korrekt zugeordneten
  `lat`-/`lon`-Attributen und den erwarteten Track-/Wegpunktstrukturen sein.
- Etappenplan, Kartenimport, Gesamt-GPX, Tages-GPX, Frontmatter und
  Kartendarstellung sind bei Änderungen gemeinsam auf Konsistenz zu prüfen.
- Ein Wegpunktplan oder berechneter PKW-Track ist kein geprüfter
  Motorrad-Fahrspur-Track. Datenstatus und Einschränkungen müssen erhalten
  bleiben; Generierung allein gilt nicht als Routenfreigabe.
- Koordinaten, Inhalte und Routenänderungen benötigen eine überprüfbare
  Projektquelle. Widersprüche werden dokumentiert und nicht stillschweigend
  aufgelöst.

## 3. PWA, Veröffentlichung und Datenschutz

- Die Anwendung verwendet Manifest, Service Worker und vorhandene
  Installationsressourcen. Build und Assets müssen unter dem Pages-Unterpfad
  korrekt funktionieren.
- App-Shell, lokale GPX-Dateien, externe Medien und externe Kartenkacheln sind
  als getrennte Ressourcen zu behandeln. Externe Kacheln oder Medien dürfen
  nicht als offline verfügbar dargestellt werden, sofern dies nicht
  gesondert zulässig und auf Zielgeräten getestet wurde.
- PWA-Installation ist nicht gleich Offline-Navigation. Der Umfang tatsächlich
  verfügbarer Inhalte muss nachvollziehbar sein; eine PWA darf nicht als
  garantierte Navigations- oder Notfalllösung bezeichnet werden.
- Private Inhalte, Zugangsdaten und Geheimnisse gehören weder in öffentliche
  Build-Artefakte noch in nicht freigegebene Modellkontexte, Issues oder PRs.
  Veröffentlichungsrelevante Datenschutzentscheidungen sind vor dem
  betreffenden Build zu klären. Der konkrete aktuelle Klärungsstand steht im
  Daily.
- Der unbeaufsichtigte GitHub-Actions-Issue-Runner darf `export/` nicht lesen
  oder ändern. Eine ausdrücklich von BB gesteuerte interaktive
  VS-Code-Sitzung darf `export/ARBEITSSTAND.md` und `export/README.md`
  fortschreiben.

## 4. Änderungs- und Agenten-Workflow

Für Änderungen über GitHub gilt verbindlich „erst planen, dann umsetzen“:

1. `/plan-item` analysiert den Issue-Kontext ohne Dateischreibzugriff und
   liefert einen Umsetzungsplan mit jedem benötigten repo-relativen
   Dateipfad, Änderung, Abhängigkeit, Quelle, Risiko und Prüfverfahren.
2. Der Projektverantwortliche prüft und genehmigt den konkreten Plan durch
   `/implement-item`. Änderungen am Issue, neue Abhängigkeiten oder zusätzliche
   Pfade erfordern eine erneute Planung und Freigabe.
3. `/implement-item` ändert nur die einzeln freigegebenen Dateien, arbeitet
   auf einem Feature-Branch nach dem Muster `feature/issue-<nummer>` und
   eröffnet einen Pull Request gegen `main`.
4. Automatisierte direkte Schreibzugriffe auf `main` sind verboten. Merge und
   Veröffentlichung erfolgen erst nach Prüfung des vollständigen Diffs und
   der Prüfnachweise durch den Projektverantwortlichen.
5. Nicht genehmigte Pfade, Geheimnisse, private Chat-Exporte und unzulässige
   administrative Ziele sind abzulehnen. `export/` bleibt dem
   unbeaufsichtigten Issue-Runner untersagt. Für technische Runnergrenzen und
   getrennte Maintainer-Arbeit gilt der im Daily dokumentierte Ist-Stand.

Die Spezifikation selbst erweitert keine Agentenberechtigung. Änderungen an
Commands, Runner oder Workflows benötigen einen separat geplanten und
autorisierten Maintainer-PR.

## 5. Verbindlicher Web-Änderungs-Closed-Loop

- Die Abschnitte 5–7 sind die einzige verbindliche Konfiguration für
  Prüfablauf, Web-Versionierung und Daily-Pflege. Globale Copilot- und
  Agentenanweisungen verweisen hierauf, statt die Regeln zu duplizieren.
- Änderungen an Web-Funktionen, Fehlerkorrekturen und UI erhalten passende
  automatisierte Tests unter `web/tests/` mit `node:test`. Der erweiterbare
  Basis-Test liegt in `web/tests/baseline.test.js`: jede Grundinvariante ist
  ein eigener Test und neue Basisprüfungen werden dort ergänzt. Für das
  Verhalten der konkreten Änderung gibt es einen getrennten
  `web/tests/issue-<topic>.test.js`-Test.
- Vor einem Web-PR werden in dieser Reihenfolge `node --test web/tests/*.test.js`
  und `npm run build --prefix web` erfolgreich ausgeführt. Die
  GitHub-Actions-Pipeline führt die Node-Tests vor dem
  Produktionsbuild aus; Fehler dürfen nicht stillschweigend übersprungen
  werden.
- UI- und Funktionsänderungen durchlaufen zusätzlich lokal
  `npm run test:visual --prefix web` nach dem Build. Der Prüfblock muss die
  geänderten Bereiche einschließlich Überlappungen, Textabschneiden und
  relevanter Schriftgrößen prüfen. Der Bericht
  `web/.visual-report/REPORT.md` mit Messwerten, PASS/FAIL und Screenshots ist
  auszuwerten; Abweichungen sind zu beheben und danach Node-Tests, Build und
  Visual-Check erneut auszuführen.
- Eine Ausführung des Visual-Checks in GitHub Actions darf erst behauptet
  werden, wenn sie im Workflow tatsächlich als Gate eingerichtet und
  nachgewiesen ist.
- GPX-, Daten-, Medien- oder Migrationsänderungen erhalten zusätzlich die
  dazu passenden Struktur-, Quellen- und Konsistenzprüfungen. Nicht
  ausführbare Prüfungen und Gründe werden ausdrücklich gemeldet.

## 6. App- und Service-Worker-Versionierung

- Die App-Version folgt dem von `scripts/bump_version.py` erwarteten Schema
  `v2.xx`. Das Skript erhöht die zweite numerische Komponente bei jedem Lauf.
- Bei Web-Änderungen wird die numerische Cache-Version in
  `web/public/sw.js` gegenüber dem vorherigen Stand genau um `+1` erhöht.
- `web/public/version.json` muss dazu `serviceWorkerCache` und den neuesten
  Eintrag in `serviceWorkerHistory` synchron enthalten. Der Eintrag enthält
  das Datum im Format `YYYY-MM-DD` und eine knappe sachliche Beschreibung.
- Sichtbare oder fachliche App-Änderungen erhöhen zusätzlich `version` und
  ergänzen den neuesten Eintrag in `history`. Rein technische Web-Änderungen
  erfordern keine App-Versionsänderung, sofern sie keine sichtbare oder
  fachliche Wirkung haben.
- Ein automatisierter Test prüft die Synchronität zwischen `sw.js`,
  `serviceWorkerCache`, dem neuesten Cache-Verlauf und – bei einer
  App-Versionsänderung – `version`/`history`.

## 7. Dokumentation und Geltungsbereich

Technische Anforderungen und Architektur werden ausschließlich hier
festgelegt; Produkt- und Fachanforderungen stehen im Pflichtenheft. Aktueller
Stand, Chronologie, offene Entscheidungen und nächste Schritte werden
ausschließlich im [Daily](../export/ARBEITSSTAND.md) gepflegt. Bei jeder
wesentlichen Änderung sind dort Ergebnis, Datum, Quellen und Verifikation
festzuhalten, ohne persönliche Chatdaten zu übernehmen. Die
[Export-README](../export/README.md) wird nur angepasst, wenn sich
Dokumentenaufteilung, Pflegeablauf oder ihr zusammenfassender Projektstand
ändert; sie dupliziert keine Tageschronik.

Die [V4-Unterlagen](./Balkan_Tour_Pflichtenheft_V4.md) bleiben erhalten.
Abweichungen zwischen V4 und dem noch nicht freigegebenen V5 werden bis zur
ausdrücklichen V5-Freigabe offengelegt und nicht eigenmächtig aufgelöst.

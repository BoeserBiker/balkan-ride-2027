## Arbeitsstand – Balkan-Ride 2027

**Stand:** 2026-11-21  
**Workspace:** `Balkan-Ride-2027`  
**Leitdokument:** [.github/Dokumentationskonzept.md](../.github/Dokumentationskonzept.md)

## Aktueller Stand

- Das Grundgerüst der Phasen 1 und 2 ist angelegt: GitHub-Workflow, Runner,
  Befehlsdateien, Skill-Hüllen und Referenzetappe `content/tag-01.md`.
- Beim Workspace-Review am 2026-11-20 ließ sich im aktuellen Ordner kein
  Git-Repository feststellen (`git rev-parse` schlägt fehl). GitHub-Verbindung
  und Branch-Protection sind daher lokal nicht verifizierbar.
- Die Befehlsdateien wurden mit den Vorlagen des Master-Plans verglichen; das
  YAML der Referenzetappe wurde gegen Abschnitt 3A geprüft. Der Agent wurde
  lokal mit simulierten API-Aufrufen getestet; ein echter Git-Push wurde nur
  gegen ein temporäres lokales Test-Remote geprüft. Kein Live-Lauf auf GitHub.
- `index.html`, PWA-Dateien, die übrigen 19 Etappen, GPX-Dateien und echte
  Mediendateien sind noch nicht Bestandteil des Grundgerüsts.
- Der Agent-Workflow erwartet die GitHub-Repository-Variable
  `ROADBOOK_AGENT_USER`, das Secret `ANTHROPIC_API_KEY`, erlaubte PR-Erstellung
  durch Actions und Branch-Schutz für `main`. Das Standardmodell im Runner ist
  `claude-sonnet-4-6`; `ANTHROPIC_MODEL` kann es überschreiben.
- Codebase-Memory wurde zuletzt am 2026-11-20 im Vollmodus ausgeführt:
  273 Nodes, 459 Edges; Indexstatus `ready`. Es gab keine Parserfehler,
  Teilparses oder übersprungenen Dateien. Sieben Dateien unter
  `daten/chat_verlauf/` sind absichtlich wegen `.gitignore` nicht indexiert.
  Die Watch-Integration ist in der CLI-Sitzung nicht aktiv (`watched: false`,
  Grund `cli_session`). Nach Umzug oder wesentlichen Workspace-Änderungen
  erneut indizieren und Status prüfen.
- Codebase-Memory MCP 0.12.1 ist inzwischen lokal installiert und in der
  VS-Code-Benutzerkonfiguration registriert. Die Verbindung muss nach einem
  VS-Code-Neustart noch in der aktiven Sitzung bestätigt werden. Der Graph
  unter `../VS_CODE_Tools/.codebase-memory/` wurde nicht verändert.
- Drei zuordenbare Chat-Sicherungen liegen als Markdown und JSON in
  [`daten/chat_verlauf/`](../daten/chat_verlauf/). Die abgeschlossenen
  Copilot-SDK-Antworten wurden nachträglich aus den Sitzungsabschlüssen
  ergänzt. Der VS-Code-Chat und der aktuelle Copilot-Chat enden jeweils an
  einem nicht abgeschlossenen Turn; diese fehlenden Antworten waren in den
  jeweiligen lokalen Aufzeichnungen nicht vorhanden.
- **Wichtig für den Umzug:** Die Chatdateien sind durch
  [`daten/chat_verlauf/.gitignore`](../daten/chat_verlauf/.gitignore) von Git
  ausgeschlossen. Ein Git-Klon enthält sie daher nicht. Für die Übertragung
  des vollständigen Workspace müssen diese Dateien separat und geschützt
  kopiert werden. Nicht ungeprüft in ein öffentliches oder geteiltes
  Repository aufnehmen.

## Chronologie

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

1. **Git- und GitHub-Setup verifizieren:** Repository initialisieren oder
   wieder mit dem passenden Repository verbinden; Remote, Branch `main`,
   Branch-Schutz und GitHub-Actions-Einstellungen prüfen.
2. **Workspace-Umzug abschließen:** Workspace einschließlich versteckter
   Projektdateien kopieren. Die drei Chat-JSON/Markdown-Paare separat aus dem
   Git-ignorierten Ordner geschützt übertragen. Geheimnisse nicht in Dateien
   oder Git sichern.
3. **Ziel-Workspace prüfen:** Projektpfade, VS-Code-Workspace-Datei,
   Synchronisierung und Dateiintegrität verifizieren. VS Code neu laden und
   die MCP-Verbindung in der aktiven Sitzung prüfen; danach bei Bedarf
   `VS_CODE_Tools` neu indexieren. Die Watch-Strategie nach Möglichkeit
   prüfen; für die frühere CLI-Sitzung meldete sie `none`.
4. **GitHub-Automatisierung einrichten:** `ROADBOOK_AGENT_USER` und
   `ANTHROPIC_API_KEY` hinterlegen, Actions das Erstellen von PRs erlauben und
   `main` mit PR-Pflicht schützen. Anschließend Plan → Freigabe → PR mit einem
   Test-Issue prüfen.
5. **Dokumentation bereinigen:** Root-README auf Balkan-Ride 2027 ausrichten
   und die veralteten Claude-3.5-Beispiele im Master-Ablaufplan aktualisieren
   oder eindeutig als historische Vorlage kennzeichnen.
6. **Projektphase 3 beginnen:** Tour-Rohdaten verifizieren, weitere
   Etappendateien und Medien/GPX erstellen; `index.html` und PWA erst gemäß
   freigegebenem Projektplan ergänzen.

## Relevante Quellen

- [Pflichtenheft V4](../docs/Balkan_Tour_Pflichtenheft_V4.md)
- [Master-Ablaufplan V4](../docs/master_ablauf_prompt_plan_v4.md)
- [To-do-Plan V4](../docs/todo_plan_v4.md)
- [Motorrad-Checkliste Logistik](../docs/motorrad_checkliste_logistik.md)
- [Copilot-Anweisungen](../.github/copilot-instructions.md)
- [Dokumentationskonzept](../.github/Dokumentationskonzept.md)
- [Chatverlauf-Inventar](../daten/chat_verlauf/README.md)

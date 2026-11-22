## Arbeitsstand – Balkan-Ride 2027

**Stand:** 2026-11-22

**Workspace:** `Balkan-Ride-2027`  
**Leitdokument:** [.github/Dokumentationskonzept.md](../.github/Dokumentationskonzept.md)

## Aktueller Stand

- Das Grundgerüst der Phasen 1 und 2 ist angelegt: GitHub-Workflow, Runner,
  Befehlsdateien, Skill-Hüllen und Referenzetappe `content/tag-01.md`.
- [x] **Phase 2 abgeschlossen:** Beide Agentenstufen liefen live; der Agent
  erstellte PR #2, der gemergt wurde. Alle Phase-2-Arbeitspunkte sind im
  [To-do-Plan](../docs/todo_plan_v4.md) abgehakt.
- Das private GitHub-Repository
  `https://github.com/BoeserBiker/balkan-ride-2027` ist mit lokalem `main`
  verbunden; der erste Commit `Setup V4 Grundgerüst` wurde gepusht.
- GitHub Actions ist aktiviert. Das Secret `ANTHROPIC_API_KEY` sowie die
  Repository-Variablen `ROADBOOK_AGENT_USER` und `ANTHROPIC_MODEL` sind
  vorhanden. Der Secret-Wert wurde nicht ausgelesen.
- Der Workflow ist aktiv. Nach Korrektur der Kommentar-Trigger in Commit
  `b9cd272` liefen Planungs- und Implementierungsstufe am 2026-11-22
  erfolgreich; [PR #2](https://github.com/BoeserBiker/balkan-ride-2027/pull/2)
  wurde durch den Agenten erstellt und gemergt.
- Die GitHub-API meldete, dass klassische Branch Protection für dieses private
  Repository ein Upgrade oder ein öffentliches Repository voraussetzt. Beim
  direkten Push auf `main` meldete GitHub außerdem, dass eine PR-Regel
  umgangen wurde; daher weiterhin Änderungen bevorzugt über PRs einbringen.
- Die Befehlsdateien wurden mit den Vorlagen des Master-Plans verglichen; das
  YAML der Referenzetappe wurde gegen Abschnitt 3A geprüft. Der Agent-Workflow
  wurde mit Issue #1 live durchlaufen; PR #2 wurde am 2026-11-22 gemergt.
- `index.html`, PWA-Dateien, die übrigen 19 Etappen, GPX-Dateien und echte
  Mediendateien sind noch nicht Bestandteil des Grundgerüsts.
- Der Agent-Workflow verwendet die GitHub-Repository-Variable
  `ROADBOOK_AGENT_USER`, das Secret `ANTHROPIC_API_KEY` und die optionale
  Modellvariable `ANTHROPIC_MODEL`. Der zweistufige Ablauf bis zum gemergten
  PR ist live verifiziert. Branch Protection bleibt ein separater offener
  Punkt.
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

1. **Branch-Schutz klären:** Für das private Repository ist die PR-Pflicht
   laut GitHub-Plan nicht verfügbar. Sichtbarkeit nicht ohne Entscheidung
   ändern; alternativ GitHub-Plan upgraden.
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

# Master-Ablauf- und Prompt-Plan V5

**Stand:** 24.11.2026 · **Status:** Entwurf zur Nutzerfreigabe · **Projekt:** Balkan-Ride 2027  
**Verbindlichkeit:** Erst nach ausdrücklicher Projektfreigabe werden das [Pflichtenheft V5](Balkan_Tour_Pflichtenheft_V5.md) und die freigegebenen V5-Planungsdokumente zur Referenz. Bis dahin gilt das [Pflichtenheft V4](../Balkan_Tour_Pflichtenheft_V4.md); dieser Ablauf ist ein Vorschlag, keine bereits erfolgte Umsetzung. Der [V5-To-do-Plan](todo_plan_v5.md) enthält Prioritäten, Abhängigkeiten und Abnahmekriterien.

## 1. Leitplanken und Ausgangslage

- Das bestehende Repository weiterverwenden, nicht neu initialisieren. Stack beibehalten: HTML5, Vanilla JavaScript, Vite, Tailwind CSS, Leaflet und GitHub Pages mit `/balkan-ride-2027/`; kein Laufzeit-Frontend-Framework einführen.
- V4 dokumentiert bereits Etappendateien, Roadbook, PWA, Pages und einen zweistufigen Agentenlauf. Das ist eine **V4-Grundlage**, keine Abnahme der V5-Anforderungen. V4-To-do-Status und tatsächlichen Lauf bei Bedarf erneut prüfen.
- Der aktuelle Runner akzeptiert laut Workspace nur `content/tag-01.md` bis `content/tag-22.md` und prüft das exakte V4-Schema. Die V5-Erweiterungen und app-weiten Änderungen benötigen deshalb Anpassungen; die vorhandene V4-Beschränkung bleibt bis dahin bestehen.
- **Dokumentation allein implementiert keine app-weite Agentenfähigkeit.** Dafür ist ein eigener, nach Planfreigabe umgesetzter und getesteter PR für Commands, Runner und gegebenenfalls Workflows nötig.
- Fakten ausschließlich aus freigegebenen Projektquellen oder überprüften Primärquellen übernehmen. Daten, Fährfahrpläne, Buchungen, Kosten, Adressen und Rechtslagen nicht erfinden; Herkunft, Stand, Methode und Status mitführen. Konflikte offenlegen statt überschreiben.
- Versions- und Änderungsdokumentation je späterer Umsetzung: Datum, Art, Version, betroffene Dateien/Etappen, Quellen, Tests, Abweichungen und nächste Schritte. Die zentrale Übergabe gemäß [Dokumentationskonzept](../../.github/Dokumentationskonzept.md) ist fortzuschreiben. Der Agenten-Workflow darf `export/` nicht ändern; wenn diese Beschränkung gilt, aktualisiert der Projektverantwortliche den Arbeitsstand separat.

## 2. Freigabe und Ablauf je Änderungswunsch

1. Projektverantwortlicher gibt V5-Dokumente ausdrücklich frei. Bis dahin nur unter V4 arbeiten; fachliche Konflikte vor Übernahme klären.
2. Ein Issue beschreibt Ziel, betroffene Etappen/Komponenten, Quellenstand und offene Fragen. Sprachaufnahme in der GitHub-App bleibt möglich.
3. `/plan-item`: Der Agent analysiert zulässigen Kontext ohne Dateiänderung und kommentiert beginnend mit `## Umsetzungsplan`. Der Plan nennt **jeden konkreten erwarteten Dateipfad**, Komponente, genaue Änderung, Abhängigkeiten, Quellen, Risiken sowie Tests und Build. Ein Verzeichnis, Glob oder bloßer Komponentenname ist keine Dateifreigabe. Unbekannte Zielpfade vor Freigabe konkretisieren.
4. Der Nutzer prüft den vollständigen Plan und erteilt durch `/implement-item` ausdrücklich die Freigabe. Bei verändertem Issue, neuen Abhängigkeiten, offenen Fragen oder nötigen weiteren Dateien: stoppen, mit `/plan-item` neu planen und erneut freigeben lassen. Kein nachträgliches stilles Erweitern.
5. `/implement-item`: Nur genehmigte, im freigegebenen Plan einzeln genannte Pfade ändern; Feature-Branch `feature/issue-<nummer>`, passende Tests und Produktionsbuild **vor PR-Eröffnung**, anschließend PR mit Issue-Referenz und Ergebnissen. Bei fehlgeschlagenen oder nicht ausführbaren Pflichtprüfungen kein erfolgreicher Abschluss behaupten; Blockade melden und vor PR klären.
6. Projektverantwortlicher prüft Diff und Testnachweise gegen den freigegebenen Plan. Erst seine Merge-Freigabe veröffentlicht über Pages. Ein Merge bestätigt weder Rechtslage noch Buchung oder abgefahrene Route.

### Dateigrenzen für die künftige Agenten-Erweiterung

| Bereich | Zielregel |
|---|---|
| Potenziell zulässig | Konkrete, einzeln freigegebene Dateien in `web/` einschließlich `web/tests/` und PWA, `content/`, `assets/`, Build-/CI-Konfiguration, `config/commands/`, betroffenen Skill-Hüllen und unmittelbar betroffener Projektdokumentation. Auch die Agentenimplementierung selbst nur im eigens freigegebenen PR. |
| Immer abgelehnt | Secrets **und Werte**, Zugangsdaten, private Exports einschließlich `export/`, sowie GitHub-Repository-/Organisations-Settings: im Agenten-Workflow weder lesen, ausgeben, erstellen, ändern noch löschen. Notwendigkeit separat an den Nutzer melden; keine Ausnahmen durch Planfreigabe. |
| Nicht freigegeben | Jeder nicht einzeln im aktuellen Plan genehmigte Pfad, auch innerhalb eines grundsätzlich zulässigen Verzeichnisses; unbekannte Binärformate oder nicht sicher validierbare Operationen stoppen. |

Die technische Durchsetzung muss vor Modellzugriff, Schreiben und Staging greifen: kanonische Repo-relative Pfade, keine absoluten Pfade, `..`, Symlink-Ausbrüche oder Verzeichnisfreigaben; bei verbotenen, zusätzlichen oder manipulierten Pfaden **gesamten Lauf ablehnen**, nicht stillschweigend filtern. Nur explizite Pfade stagen und den Diff vor PR erneut prüfen. Kein direkter automatisierter Schreibzugriff auf `main`. Notwendige GitHub-Administration erfolgt außerhalb des Agenten-Workflows nur nach gesonderter Nutzerautorisierung; sensible Werte gelangen weder in Modellkontext noch Logs, PR oder Tests.

## 3. Phasenplan mit Gates

### Phase 0 – V5 freigeben und Quellen-/Veröffentlichungsgrenzen entscheiden

**Eingang:** V4-Grundlagen, [Review](../Review_V4.md), [Logistik-Checkliste](../motorrad_checkliste_logistik.md), V5-Dokumente.  
**Aktion:** V5-Freigabe und Abweichungen dokumentieren; tatsächlichen Status der vorhandenen Anwendung, Tests und CI getrennt von V4-Erledigtmeldungen aufnehmen. Entscheiden, ob `docs/` privat bleiben soll, ob Recruiting-Checkboxen lediglich informieren oder wirklich filtern, sowie konkrete Gruppengrenze/Zählweise und Kontaktweg bestimmen.

**Privacy-Gate:** Der Review und `web/src/main.js` zeigen den direkten Raw-Import der Logistik-Checkliste aus `docs/` in den App-Build. Falls `docs/` privat sein soll, diese Kopplung vor öffentlichem Build entfernen: ausschließlich kuratierte, ausdrücklich zur Veröffentlichung freigegebene Daten als Build-Quelle verwenden und `web/dist/` auf private Texte/Artefakte prüfen. Ein privates Verzeichnis in einem öffentlichen Repository ist nicht durch Nicht-Import geschützt: Repository-Sichtbarkeit und bereits veröffentlichte Historie gesondert durch den Verantwortlichen prüfen. Keine privaten Daten in Issues, Agentenkontext oder PR übernehmen. Die Privacy-Entscheidung ist offen; bis zur Klärung kein ungeprüfter öffentlicher V5-Build.

**Gate:** ausdrückliche V5-Freigabe, dokumentierte Entscheidungen oder eindeutig als blockierend erfasste offene Punkte. Datenschutzfreigabe vor Veröffentlichung.

### Phase 1 – App-weite Agentenfähigkeit separat nachrüsten

**Abhängigkeit:** Phase 0/Freigabe. Eigener Issue, Plan, Freigabe und PR; bis zum Merge erfolgen App-Arbeiten manuell über geprüfte Feature-Branches/PRs oder nach geltendem V4-Workflow, nicht mit einer behaupteten erweiterten Fähigkeit.

1. `config/commands/plan-item.md`, `config/commands/implement-item.md`, Skill-Verweise, `.github/scripts/agent_runner.py` und bei Bedarf `.github/workflows/ai-agent-workflow.yml` analysieren; genaue zu ändernde Pfade erst im Plan festlegen. Planungsanalyse soll App, Tests, Daten, Assets, Build/CI und relevante Dokumentation umfassen, ohne private oder gesperrte Daten zu lesen.
2. Planbindung technisch absichern: autorisierter Issue-Kommentar, vertrauenswürdiger aktueller Plan, unveränderte Issue-Fassung, explizite Freigabe und unveränderliche konkrete Pfadliste. PR-Kommentare und unautorisierte Auslöser ablehnen. Bei späterer Plan-/Issue-Änderung erneut planen und freigeben.
3. Content-spezifische V4-Validierung nicht pauschal auf Web-Dateien anwenden; V5-Schema einschließlich offener Werte separat unterstützen, ohne bestehende Felder/Medien zu verlieren. Geeignete sichere Verarbeitung für Text, Assets und Lösch-/Neuanlagefälle spezifizieren; nicht unterstützte Fälle abbrechen.
4. Vor PR passende Tests und Build ausführen; Ergebnisse im PR aufführen. V5-Umsetzung muss auch die Ausführung im Agentenlauf ermöglichen, nicht nur auf spätere CI hoffen.

**Abnahmetests:** erlaubter Multi-Komponenten-Plan mit z. B. einzeln genehmigter Web-Datei und Testdatei; erfolgreicher Plan → Freigabe → Branch → PR. Negativfälle: fehlende/alte Freigabe, geändertes Issue/Plan, unautorisierter Benutzer, PR-Kommentar, nicht gelistete Datei in erlaubtem Ordner, private Exports, Secrets/Settings, Traversal, absolute Pfade und Symlinks; jeweils kein unzulässiger Lese-/Schreibzugriff und kein PR. Test- und Buildfehler verhindern PR. Nur geplante Dateien im Diff. Tests auf Runner-Ebene und geeignete `node:test`-Tests für Web-Änderungen; keine echten Secrets verwenden.

**Gate:** eigener PR geprüft und gemergt; Tests und Build nachgewiesen. Vorher kein „app-weit verfügbar“.

### Phase 2 – Daten- und Routenbasis prüfen

**Abhängigkeit:** V5-Freigabe; Datenarbeiten können unabhängig von Phase 1 manuell per PR laufen. Zuerst gültige Vorgaben und den tatsächlich verfügbaren freigegebenen Final-Plan feststellen. Die im V4-Master genannte externe V7-Datei ist eine historische Referenz, kein automatisch bestätigter aktueller Plan.

1. D01–D22 samt Datum, Start/Ziel, Alternativen, Koordinaten und Quellenstatus mit gültigem Plan abgleichen. Plan, Kartenimport-CSV, Gesamt-GPX, Tages-GPX, Frontmatter und Kartenanzeige gemeinsam prüfen; Widersprüche protokollieren.
2. Vollständiges V4-Schema erhalten; V5 ergänzt `fahrzeit_netto_modell`, `tagesdauer_brutto_schaetzung`, `hoehenmeter_status`, `gpx_status` und Medienmetadaten. `fahrzeit` bleibt Netto-Modellfahrzeit und muss während der Migration mit `fahrzeit_netto_modell` übereinstimmen. Fehlende Werte offen statt fiktiv; Darstellung und Validierung entsprechend migrieren.
3. D03/D04-Distanzabweichungen, D01-Höhenkonflikt, D14-Null und D11-Tagesdauer anhand neu geprüfter Daten bearbeiten; Einzeltests stehen im [To-do](todo_plan_v5.md), Abschnitt „P0 – Daten, Routen und Reviewbefunde“. Keinen Reviewwert automatisch übernehmen.
4. Wegpunktplan, OSRM-PKW-Vorabroute und Karten-Scrubber nicht als geprüfte Motorradfahrspur bezeichnen. Für bestätigte Routen Abgleich von Straßenart, Pässen, Schotter, Zufahrten und saisonalen Sperren sowie dokumentierte geeignete Prüfung oder Abfahrt; fehlende Vor-Ort-Abfahrt ausdrücklich nennen. Prüfer, Datum, Quelle und Einschränkungen festhalten; sonst vorläufig.
5. Bei Import/Änderung von Tourplan, CSV oder GPX: diese gemeinsam abgleichen, zuerst die Generatorquelle `assets/gpx/Balkan_Tour_2027.gpx` aktualisieren, anschließend Tages-Tracks nach der aktuellen [Riderrix-Anweisung](../../.github/agents/riderrix.agent.md) generieren. XML/Namespaces, `lat`/`lon`, Wegpunktkategorien, Punktzahl, Dateigröße und alle 22 Segmente prüfen; CSV-Format und Koordinaten beibehalten. Aus dem Generator entsteht keine Routenfreigabe.

**Gate:** alle angezeigten Daten geprüft oder sichtbar als offen/vorläufig klassifiziert; für Veröffentlichung relevante ungeklärte Sicherheitsrisiken gesondert entscheiden. Keine stillen Korrekturen.

### Phase 3 – Landingpage und Reiseorganisation

**Abhängigkeit:** Phase 0 und Datenstatus aus Phase 2; Implementierung per freigegebenem PR. Vor den Steps eine mobile und Desktop-taugliche Tourübersicht mit Roadbook-/Karten-CTA:

- 22 Kalendertage D01–D22, 08.–29.09.2027, ab/bis Recklinghausen inklusive PKW/Anhänger; 18 Kalendertage D03–D20 Motorradschleife ab/bis Villach, einschließlich Seetag D19. Nicht als 18 reine Fahrtage oder 20 Tage verkaufen.
- Länder, Route, Pässe, Fähre, Ruhetage und Alternativen nur nach freigegebener Quelle; exakte Adressen, Unterkunft und Buchungen belegt oder offen. Netto-Modellzeit und geschätzte Bruttodauer getrennt und nicht als Ankunftsgarantie.
- Kurvenerfahrung und Anspruch deutlich machen. Der V5-Zielrahmen „höchstens 4–6 Motorräder“ ist keine konkrete Obergrenze; Motorrad-/Personenzahl und Besatzung klären. CTA und Teilnahmebedingungen erst nach Bestätigung; sonst kein erfundener Kontakt.
- Recruiting-Checkboxen nach Entscheidung entweder klar als informative Checkliste ohne Filterversprechen oder als echte, getestete Filterfunktion mit definierten Kriterien, Interaktion und Ergebniszuständen umsetzen.
- D01–D22-Logistikmatrix mit Status, Quelle und „nicht zutreffend“: Grenze/Papiere, Versicherungsdeckung, Maut/Vignette, Tankreichweite und verifizierte Stopps, Fähre, Unterkunft/Stellplätze, Pannen-/Notfallplan und Strecken-/Wetterrisiken. Die 150-km-Restreichweitenregel ist eine Tourregel, keine Zusage zur Tankstellenverfügbarkeit. Amtliche Regeln, Versicherer und Betreiber aktuell prüfen.
- Budgetstruktur je Person und Etappe mit Kostenkategorie, Währung, Quelle/Stand, Status und Zuordnung; keine erfundenen Summen oder Umrechnungen. Fehlende Werte bleiben offen; Summen nur aus geeigneten freigegebenen Quelldaten, ohne offene Posten als null zu behandeln.
- Reserve-/Puffertage und Verzögerungs-/Fähr-Ausweichplan mit belegten Optionen, Auslösern, Entscheidungspunkten, Auswirkungen und Status erfassen. Nicht behaupten, dass ein Puffertag oder eine Ersatzfähre verfügbar ist, solange unbestätigt.

**Gate:** Landingpage und Matrix sind auf beiden Formfaktoren nutzbar; offene Fakten und Entscheidungen bleiben sichtbar, CTA erweckt keine Buchungszusage.

### Phase 4 – App, Karten, Medien und PWA

**Abhängigkeit:** Phase 0, Datenschutzentscheidung und für den jeweiligen Inhalt Phase 2/3. In kleinen PRs umsetzen:

1. Gesamtroute, 22 Steps, aktive Auswahl, Vorheriger/Nächster und Pin-Auswahl bidirektional synchronisieren; An-/Abreise und Motorradschleife unterscheiden. Desktop-Split, mobiles Sheet, Touch/Tastatur und reduzierte Bewegung beachten.
2. Dichte Pins durch getestete Gruppierung/Staffelung oder gleichwertige Lösung lesbar und einzeln erreichbar halten; keine Etappe verstecken. Start/Ziel und Seetag von Straßentracks unterscheiden, Legende und zugängliche Beschriftung anbieten. Fahrzeit und Einheiten vollständig lesbar, keine unverständliche Ellipse.
3. Medien je Etappe zuordnen, lazy laden, Lightbox und verständliche Leerzustände erhalten. Wiederholungen nach Pfad, URL, Video-ID und bei lokalen Dateien ggf. Hash prüfen; Ausnahmen redaktionell begründen. Lizenz, Urheber, Quelle und ggf. genaue CC-Version gegen Originalquelle prüfen; unklare Rechte nicht veröffentlichen; illustrative Fremdmedien als Symbolbild in Daten und UI kennzeichnen.
4. Manifest, Service Worker, Icons und Installation prüfen. App-Shell, lokale GPX und externe Medien/Kacheln getrennt behandeln; Offline-OSM-Kacheln nicht versprechen. Bei Netzverlust verständlicher Hinweis und Anleitung, freigegebene GPX und Offline-Karten vorher in einer geeigneten Navigationslösung bereitzustellen. PWA ist keine garantierte Offline- oder Notfallnavigation.
5. Cacheversion, Aktualisierung nach Merge, GPX-Abruf und tatsächlichen Cacheumfang nachweisen. iOS und Android getrennt installieren und online/offline testen; bis zum dokumentierten Test „nicht abgenommen“.

**Gate:** je Funktion passende `node:test`-Tests in `web/tests/`; in GitHub Actions vor Produktionsbuild ohne stilles Überspringen. Zusätzlich dokumentierte manuelle Browser-/Gerätetests für Karte, Touch, Darstellung, Installation und Funkloch.

### Phase 5 – Gesamtprüfung, Abnahme und Live-Schaltung

**Abhängigkeit:** Phasen 0–4 und jeweilige PR-Freigaben; die app-weite Agentenfähigkeit nur bei abgeschlossenem eigenen PR als verfügbar ausweisen.

1. Vor jedem PR aus dem Repo-Stamm `node --test web/tests/*.test.js` und `npm run build --prefix web` ausführen; weitere Runner-, Daten-, Medien-, GPX-/CSV-Tests je Änderung ergänzen. CI muss Tests vor dem Build ausführen. Fehler oder nicht ausführbare Tests samt Grund melden, niemals als Erfolg ausgeben.
2. Vollständigen Diff und freigegebene Pfadliste, Quellenstatus, Schema-/Trackkonsistenz, D01/D03/D04/D11/D14/D19, Medienrechte und alle D01–D22-Matrixeinträge prüfen. Reviewfälle sind Beobachtungen, keine bestätigten Ersatzdaten.
3. Desktop und schmales Mobilgerät: Landingpage, 22/18-Zählweise, Pins, Synchronisation, volle Fahrzeitwerte, Recruiting-Entscheidung, Logistik, Budget, Puffer, Galerie und Accessibility abnehmen. PWA auf iOS/Android inklusive Netzverlust und Aktualisierung separat nachweisen.
4. Zweistufigen End-to-End-Ablauf samt Negativfällen und Handybedienung prüfen; nicht autorisierte Auslösung und direkte `main`-Schreibvorgänge nachweisbar ausgeschlossen. PR nur nach Nutzerprüfung mergen.
5. Build-Artefakt auf Freigaben, sensible/private Inhalte und korrekten Pages-Unterpfad prüfen; bei offener Datenschutzentscheidung nicht veröffentlichen. Nach Merge Deployment und Live-Smoke-Test inklusive Quellen-/Statushinweisen dokumentieren; bei Fehler Veröffentlichung stoppen bzw. separat autorisiert zurückrollen. Anschließend freigegebenen Link und Installationshinweise verteilen.

**Gesamtabnahme:** Verantwortlicher dokumentiert Datum, Version/PR, Testumgebung, Ergebnisse, verbleibende Risiken und Freigabe. Offene Routen-, Rechts- oder Buchungsprüfungen bleiben auch nach technischem Livegang offen; sicherheitskritische ungeklärte Punkte dürfen nicht als freigegeben erscheinen.

## 4. Wiederverwendbare Issue-/Planvorlage

```markdown
Ziel und Nutzen:
Betroffene Etappen/Komponenten:
Freigegebene Quellen, Stand und offene Widersprüche:
Erwartetes Verhalten und Abnahmekriterien:
Datenschutz-/Veröffentlichungsstatus:

## Umsetzungsplan
**Betroffene Datei(en):**
- `konkreter/repo-relativer/dateipfad` – Änderung und Grund
**Abhängigkeiten und offene Fragen:** ...
**Prüfungen:** ...; node:test bei Web-Änderung; Produktionsbuild vor PR
**Grenzen:** Nur obige genehmigte Pfade; keine Secrets, privaten Exports oder GitHub-Settings.
```

Die Vorlage ist ein Muster, keine Freigabe des Beispielpfads. Bei fehlenden Pfaden, Quellen oder Entscheidungen erst nachplanen.

## 5. Quellen und Versionsstand

- [Pflichtenheft V5](Balkan_Tour_Pflichtenheft_V5.md), insbesondere Abschnitte 1–10: Produktspezifikation nach Freigabe.
- [Masterplan V4](../master_ablauf_prompt_plan_v4.md) und [To-do V4](../todo_plan_v4.md): Ablauf und dokumentierter V4-Stand; historische Setup-Kommandos nicht erneut ausführen.
- [Pflichtenheft V4](../Balkan_Tour_Pflichtenheft_V4.md), [Review V4](../Review_V4.md), [Logistik-Checkliste](../motorrad_checkliste_logistik.md), [Riderrix](../../.github/agents/riderrix.agent.md) und [Dokumentationskonzept](../../.github/Dokumentationskonzept.md).
- Workspace-Implementierung: [Plan-Command](../../config/commands/plan-item.md), [Implement-Command](../../config/commands/implement-item.md), [Runner](../../.github/scripts/agent_runner.py), [Pages-CI](../../.github/workflows/deploy-pages.yml), [App-Einstieg](../../web/src/main.js). Diese Beobachtungen sind keine externe Produktions- oder Rechteprüfung.

### Version V5 – 24.11.2026

**Art:** neuer Ablaufplan als Freigabeentwurf; **Umfang:** D01–D22, App, Agentenworkflow und Reiseorganisation; **Quellen:** oben. Keine Routendaten, Buchungen, Einstellungen oder Implementierungen geändert. Offene Punkte und konkrete Aufgaben stehen im [V5-To-do](todo_plan_v5.md).

# Pflichtenheft: Balkan-Ride 2027
## Web-Roadbook, Polarsteps-Style PWA und kontrollierter KI-Agent

**Version:** V5  
**Status:** Konsolidierte V5-Spezifikation zur Projektfreigabe. Nach ausdrücklicher Freigabe ist V5 die aktuelle Produktspezifikation und ersetzt V4; bis dahin bleibt V4 maßgeblich. Routendaten, Buchungen und offene Prüfungen sind nur dann verbindlich, wenn sie in einer freigegebenen Quelldatei bestätigt sind.  
**Projekt:** Balkan-Ride 2027  
**Basisdokument:** `docs/Balkan_Tour_Pflichtenheft_V4.md`  
**Überarbeitung:** Konsolidiert auf Basis des Reviews V4, der V5-Optimierungen und der vorhandenen Ablauf-, To-do- und Logistikvorgaben.  
**Änderungsdatum:** 24.11.2026

> **Faktenregel:** Dieses Pflichtenheft definiert Produkt- und Qualitätsanforderungen, keine Bestätigung noch offener Routendaten, Fahrzeiten, Kosten, Buchungen oder Rechtslagen. Werte und Aussagen ohne belastbare Projektquelle sind als offen bzw. zu verifizieren zu kennzeichnen. V4-Beispielwerte dienen ausschließlich der Veranschaulichung des Schemas und sind keine freigegebenen Tourdaten.

---

## 1. Zweck, Produktziel und verbindliche Abgrenzung

Entwickelt und betrieben wird eine mobile, leicht bedienbare Web-Präsentationsplattform (Roadbook) für die Balkanreise 2027. Sie soll die Reise übersichtlich vorstellen und Mitfahrern unterwegs verlässliche, nachvollziehbare Etappeninformationen bereitstellen. Gestaltung und Bedienung orientieren sich am Polarsteps-Prinzip: Gesamtroute, chronologische Tages-Steps, synchronisierte Karte und Mediengalerien.

### 1.1 Reisedauer und Zählweise – verbindliche Definition

Die Reise wird in zwei klar getrennte Zeiträume gegliedert:

| Abschnitt | Umfang | Abgrenzung |
|---|---:|---|
| Gesamtreise | **22 Kalendertage, D01–D22** | Einschließlich An- und Abreise mit PKW und Anhänger ab/bis Recklinghausen. Der dokumentierte Zeitraum ist 08.09.2027 bis 29.09.2027. |
| Kern-Motorradtour | **18 Kalendertage, D03–D20** | Motorradreise ab/bis Villach. Der Zeitraum schließt den als Seetag geführten D19 ein; er bedeutet daher nicht 18 reine Fahrtage. |

D01–D02 sind die Anreise mit PKW und Anhänger; D21–D22 sind die Rückreise. D03 beginnt die Motorradschleife ab Villach; D20 schließt sie in Villach ab. Diese Zählweise ist in Landingpage, Tagesnavigation, Statistiken und allen Projekttexten einheitlich zu verwenden. Die Gesamtreise darf nicht verkürzt als „20 Tage“ bezeichnet werden. „18 Tage Motorradreise“ muss als Kalendertage D03–D20 einschließlich Seetag erläutert werden.

**Zu verifizieren:** Tatsächliche Start-/Zieladressen, die genaue Zuordnung von Fahr- und Ruhetagen sowie alle tagesbezogenen Daten müssen mit dem freigegebenen Final-Plan abgeglichen werden. Die oben genannten Eckdaten ersetzen keine Routen- oder Buchungsprüfung.

### 1.2 Produktleitbild

- **Gesamtroutenansicht:** Interaktive Karte mit Route, GPX-Daten und nummerierten Pins für D01–D22; An-/Abreise und Motorradschleife müssen visuell unterscheidbar sein.
- **Tages-Steps:** Ein Step je Kalendertag, chronologisch `Tag 01` bis `Tag 22`, erreichbar über Vorheriger/Nächster und Pin-Auswahl.
- **Karten-Synchronisation:** Bei Step-Wechsel wird der zugehörige Tagesabschnitt sichtbar zentriert und der aktive Step deutlich hervorgehoben.
- **Etappenkarten:** Datum, Start/Ziel, bestätigte Distanz, Netto-Modellfahrzeit, gegebenenfalls Brutto-Tagesdauer, Höhenmeter mit Datenstatus, Highlights, Logistikhinweise und Medien.
- **Roadbook-Texte:** Direkt, gut lesbar und biker-tauglich. Stimmung und Bikerslang dürfen Fakten, Risiken, Unsicherheiten und Sicherheitshinweise nicht abschwächen.
- **Installierbare PWA:** Nutzung über mobilen Browser und Homescreen-Installation, ohne App-Store-Voraussetzung. PWA-Installation ist von echter Offline-Navigationsfähigkeit klar zu unterscheiden.

---

## 2. Verbindliche Tour-Landingpage vor den Tages-Steps

Vor der chronologischen Step-Ansicht ist eine eigenständige Tour-Übersicht/Landingpage als erster Einstieg umzusetzen. Sie darf nicht erst durch Öffnen eines einzelnen Tages-Steps erreichbar sein. Von ihr aus muss der Nutzer zu D01–D22 weitergehen können.

### 2.1 Mindestinhalt der Landingpage

1. **Eckdaten und Zählweise:** 22 Kalendertage D01–D22 ab/bis Recklinghausen mit PKW und Anhänger; davon 18 Kalendertage Kern-Motorradtour D03–D20 ab/bis Villach, einschließlich Seetag D19.
2. **Start und Ziel:** An-/Abreise ab/bis Recklinghausen sowie Start/Ziel der Motorradschleife in Villach. Exakte Adressen nur nach Bestätigung anzeigen.
3. **Route und Charakter:** Länder, Etappenfolge, Pass-/Kurvencharakter, Fähre, Ruhetage und Alternativen ausschließlich aus freigegebenen Tourdaten. Nicht bestätigte Angaben sind sichtbar als „offen“ oder „zu bestätigen“ markiert.
4. **Fahrzeit verständlich erklären:** Netto-Modellfahrzeit getrennt von geschätzter Brutto-Tagesdauer einschließlich Pausen, Tankstopps, Grenzaufenthalten, Ortsverkehr und sonstigen Unterbrechungen. Keine der beiden Angaben als verbindliche Ankunftszeit darstellen.
5. **Status der Planung:** Unterkunfts-, Fähr-, Routen- und Buchungsstatus transparent nach bestätigten, vorläufigen und offenen Punkten trennen. Nicht bestätigte Fahrpläne oder Reservierungen dürfen nicht wie gebucht erscheinen.
6. **Mitfahrer-Anforderungsprofil:** Anspruchsvolle, kurvenreiche Motorradreise; ausreichende Kurvenerfahrung ist erforderlich. Kleine Gruppe mit Zielrahmen von höchstens 4–6 Motorrädern. Die genaue Obergrenze und die Zählweise (Motorräder, Fahrer oder Teilnehmer) müssen vor einer verbindlichen Zusage festgelegt werden; „maximal 4 bis 6“ darf nicht als präzise Teilnehmerzahl stehen bleiben.
7. **Call-to-Action (CTA):** Eine klare Möglichkeit, Interesse zu bekunden bzw. Kontakt aufzunehmen und die nächsten Schritte zu erfragen. Zieladresse, Kontaktweg und verbindliche Teilnahmebedingungen sind erst einzutragen, wenn sie vom Projektverantwortlichen bestätigt wurden. Keine nicht freigegebene Buchungs- oder Zahlungszusage.
8. **Einstieg in die Karte/Steps:** Sichtbarer CTA zum Roadbook, zur Gesamtroute und zu den Tages-Steps; auf Mobilgeräten ohne langes Suchen bedienbar.

### 2.2 Abnahmekriterien

- Die Tour-Übersicht wird vor der Tages-Chronik angezeigt und ist auf Mobilgerät und Desktop nutzbar.
- 22 Kalendertage und 18 Kalendertage Kern-Motorradtour sind getrennt und konsistent beschriftet.
- Alle Eckdaten, Buchungsstände und CTA-Kontaktdaten sind belegt oder ausdrücklich als offen markiert.
- Nutzer können den Anspruch der Tour und den noch festzulegenden Gruppenumfang vor einer Kontaktaufnahme erkennen.

---

## 3. Technische Architektur und UI

### 3.1 Tech-Stack und Build

- **Frontend:** HTML5, Tailwind CSS im Dark-Adventure-Design, Vanilla JavaScript (ES6+) und Leaflet.js.
- **Build:** Vite ohne Laufzeit-Frontend-Framework. Der Quellcode liegt unter `web/`; Etappendateien `content/tag-*.md` einschließlich YAML-Frontmatter werden beim Build eingelesen.
- **Deployment:** Build-Ausgabe unter `web/dist/`; GitHub-Pages-Unterpfad `/balkan-ride-2027/`.
- **Kartenbasis:** OpenStreetMap-/Topografie-Kartenebenen gemäß bestehender Anwendung. Externe Kacheln sind als externe Ressource zu behandeln; Offline-Verfügbarkeit darf nicht vorausgesetzt werden.

### 3.2 Layout und Navigation

- Desktop: interaktive Karte und scrollbare Step-Chronik in einem Split-Layout.
- Mobil/PWA: Kartenansicht und bedienbares Bottom-Sheet bzw. Step-Switcher mit Einhandbedienung.
- Gesamtroute, Tages-Pins, aktive Etappe, Vorheriger/Nächster-Step und direkte Pin-Auswahl müssen synchron bleiben.
- Kartenanimationen (z. B. `flyTo`) dürfen die Bedienbarkeit nicht blockieren; für reduzierte Bewegung ist eine passende Darstellung vorzusehen.
- Zahlen und Einheiten müssen vollständig lesbar sein. Insbesondere dürfen Fahrzeit- und Statistikfelder weder abgeschnitten noch durch Ellipsen unverständlich werden.

### 3.3 Kartenpins und Kartenlesbarkeit

Die im Review festgestellten Pin-Überlagerungen im Balkanbereich sind zu beheben, ohne Etappen oder Wegpunkte stillschweigend zu verbergen. Für dichte Bereiche sind geeignete Darstellungen vorzusehen, etwa Zoom-abhängige Gruppierung, gestaffelte Marker, Cluster oder eine klare Auswahlansicht. Die konkrete Darstellung ist zu testen.

- Die Gesamtansicht muss Route, Tagesnummern und aktive Auswahl lesbar halten.
- Beim Zoomen oder Auswählen müssen Marker weiterhin einzeln erreichbar sein.
- Start-/Zielmarker und Sonderfälle (z. B. Seetag ohne Straßenfahrspur) sind von Straßen-Tracks unterscheidbar.
- Farb- und Symbolkodierung ist durch Legende bzw. zugängliche Beschriftung zu erklären.

### 3.4 UI-Abnahme

Mindestens zu prüfen sind Desktop und schmale Mobilansicht, Pin-Dichte, aktive Etappe, Textüberläufe, Fahrzeitfelder, Kartenbedienung, Tastatur-/Touch-Bedienbarkeit und Step-Wechsel. Bei jeder neuen Funktion, Fehlerkorrektur oder UI-Änderung in `web/` müssen passende automatisierte Tests unter `web/tests/` mit `node:test` ergänzt oder aktualisiert werden. Diese Tests müssen in GitHub Actions vor dem Produktionsbuild laufen und dürfen nicht stillschweigend übersprungen werden.

---

## 4. Datenmodell und vollständiges YAML-Frontmatter

### 4.1 Grundsatz und Schema-Kompatibilität

Das V4-Frontmatter bleibt die vollständige Pflichtbasis: `tag`, `datum`, `titel`, `start`, `ziel`, `koordinaten_start`, `koordinaten_ziel`, `kilometer`, `fahrzeit`, `hoehenmeter`, `gpx_datei`, `highlights`, `bilder` und `videos`. V5 erweitert dieses Schema um getrennte Fahrzeitbegriffe, Daten-/Prüfstatus und belastbare Medienmetadaten. Felder oder Medienlisten aus V4 dürfen bei Änderungen nicht stillschweigend gelöscht werden.

`fahrzeit` aus V4 ist als bisheriges Kompatibilitätsfeld zu behandeln. In der Anzeige bedeutet es ausschließlich **Netto-Modellfahrzeit**. Das neue Feld `fahrzeit_netto_modell` ist die explizite V5-Angabe. Während einer Migration müssen beide Werte übereinstimmen; bis App und Datenmigration die Kompatibilität abgeschlossen haben, darf `fahrzeit` nicht umgedeutet werden. Die geschätzte Brutto-Tagesdauer steht getrennt in `tagesdauer_brutto_schaetzung`.

### 4.2 Schema-Muster

Das folgende Muster beschreibt Felder, nicht konkrete Tourdaten. `null`, `TODO` und leere Listen sind Platzhalter für die Datenpflege und dürfen nicht als bestätigte Angaben veröffentlicht werden. Koordinaten, Kilometer, Zeiten, Höhenmeter und GPX-Dateipfade sind aus verifizierten Quellen zu übernehmen, nicht zu raten.

```yaml
---
tag: 1
datum: "TODO"
titel: "TODO"
start: "TODO"
ziel: "TODO"
koordinaten_start: [null, null]
koordinaten_ziel: [null, null]
kilometer: null
fahrzeit: "TODO" # V4-Kompatibilität: ausschließlich Netto-Modellfahrzeit
fahrzeit_netto_modell: "TODO"
tagesdauer_brutto_schaetzung: "TODO" # Schätzung; Pausen, Grenzen, Tankstopps etc. einbeziehen
hoehenmeter: null
hoehenmeter_status: "offen" # z. B. offen, vorläufig, geprüft; nur belegte Statuswerte verwenden
gpx_datei: "TODO"
gpx_status: "offen" # z. B. offen, berechnet, geprüft; Prüfstatus nicht vortäuschen
highlights: []
bilder:
  - datei: "TODO"
    beschreibung: "TODO"
    urheber: "TODO"
    lizenz: "TODO"
    quelle: "TODO"
    symbolbild: true
videos:
  - typ: "TODO" # z. B. mp4 oder youtube, sofern tatsächlich genutzt
    quelle: "TODO"
    poster: "TODO"
    titel: "TODO"
    urheber: "TODO"
    lizenz: "TODO"
    symbolbild: true
---
Roadbook-Text: nur belegte Routen- und Sicherheitsinformationen verwenden.
```

### 4.3 Datenqualität, Kennzahlen und Quellenstatus

- **Distanzen:** Etappen-Kilometer, GPX-Länge, Kartenlinie und angezeigte Kennzahlen müssen konsistent sein. Abweichungen sind zu untersuchen und im Datenstatus kenntlich zu machen, nicht durch stilles Überschreiben zu kaschieren.
- **Höhenmeter:** Frontmatter, GPX-Profil und UI-Anzeige müssen denselben definierten Datenstand abbilden. Quelle, Berechnungsmethode und Prüfstatus sind nachvollziehbar zu dokumentieren. Eine aus einem Profil berechnete Summe ist nicht ohne Prüfung ein bestätigter Messwert.
- **Nullwerte:** `0` darf nur dann als exakter Wert erscheinen, wenn es sachlich zutrifft. Bei D19 ist ein Nullwert für die reine Fährpassage keine gemessene Straßenhöhe; bei anderen Etappen ist eine methodisch bedingte Null nicht als exakter Messwert auszugeben.
- **Netto-Modellfahrzeit:** Reine modellierte Fahrzeit ohne Pausen und sonstige Unterbrechungen. Als Modellwert beschriften und Quelle/Stand dokumentieren.
- **Brutto-Tagesdauer:** Separate Schätzung der gesamten Etappendauer einschließlich Pausen, Tankstopps, Grenzaufenthalten, Ortsverkehr und sonstigen geplanten Unterbrechungen. Ist sie nicht belastbar ermittelbar, bleibt sie offen; keine präzise Dauer erfinden.
- **Datenherkunft:** Für jede relevante Distanz-, Zeit- und Höhenangabe sind Quelle, Stand und gegebenenfalls Methode im Projekt nachvollziehbar zu halten.
- **Unbestätigtes:** Als `offen`, `vorläufig`, `zu verifizieren` oder vergleichbar eindeutig markieren. Keine Annahme durch bloße Wiederholung in UI oder Text in einen bestätigten Fakt umwandeln.

### 4.4 GPX-Tracks und Routenfreigabe

Ein GPX-Wegpunktplan, ein Karten-Scrubber oder eine berechnete OSRM-PKW-Route ist kein geprüfter Motorrad-Fahrspur-Track. Solche Vorabdaten dürfen nicht als abgefahrene oder freigegebene Motorradroute dargestellt werden.

Für eine als geprüft ausgewiesene Tagesroute gelten mindestens folgende Anforderungen:

1. Track und zugehöriger Etappenplan, CSV-Kartenimport und Kartenanzeige sind konsistent abgeglichen.
2. Die Route ist für Motorradführung und die vorgesehene Maschine plausibilisiert; Straßenart, Pass-/Schotterabschnitte, saisonale Sperrungen und befahrbare Zufahrten sind soweit möglich geprüft.
3. Der Track ist vor Ort abgefahren oder durch eine nachvollziehbare, geeignete Prüfung als Motorradroutenführung bestätigt. Ist keine Abfahrt erfolgt, muss der Status dies ausdrücklich sagen.
4. Datum, Prüfer/Verantwortlicher, Datenquelle und Einschränkungen werden nachvollziehbar dokumentiert. Nicht belegbare Prüfungen werden nicht behauptet.
5. Tagesdistanz und Höhenprofil werden nach Eingang eines belastbaren Tracks erneut geprüft und mit den Frontmatter-Angaben abgeglichen.
6. Fehlende, vorläufige oder nicht geprüfte GPX-Dateien werden im Roadbook transparent angezeigt. Nutzer dürfen sie nicht als sichere Navigationsanweisung missverstehen.

**Bekannter Prüfbedarf aus den Quellen:** Die vorhandenen Notizen nennen für D03 und D04 Abweichungen zwischen rekonstruierten OSRM-Distanzen und V7-Kilometerwerten (D03: 176,2 statt 152,2 km; D04: 210,4 statt 171,9 km). Diese Vergleichswerte sind Prüfhinweise, keine freigegebenen Ersatzdistanzen. Die V7-GPX wird als Wegpunktplan, nicht als geprüfter Fahrspur-Track beschrieben. Werte dürfen erst nach Abgleich mit den maßgeblichen Quelldaten geändert werden.

---

## 5. Etappenbezogene Logistik- und Reiseorganisations-Matrix

Das Roadbook muss eine etappenbezogene Logistik-Matrix anbieten. Die Matrix kann als Gesamtübersicht mit Filtern oder als kompakte Angaben je Step umgesetzt werden; sie muss mindestens für D01–D22 vollständig prüfbar sein. Ein fehlender oder ungeprüfter Eintrag ist sichtbar als solcher zu kennzeichnen, nicht leer oder irreführend positiv darzustellen.

| Pflichtbereich | Pro Etappe zu dokumentieren | Status-/Quellenanforderung |
|---|---|---|
| Grenzübertritte und Papiere | Betroffene Grenze/Länder, benötigte Fahrer- und Fahrzeugunterlagen, Versicherungsnachweis und gegebenenfalls Vollmacht | Anforderungen vor Reise anhand aktueller offizieller Stellen und Versicherer prüfen; keine pauschale Rechtsbehauptung |
| Grüne Versicherungskarte / IVK | Geltungsbereich für die betroffenen Länder und etwaige Einschränkungen | Deckung direkt anhand gültiger Versicherungsunterlagen bestätigen; offen bis zur Prüfung |
| Maut und Vignetten | Für die Etappe relevante Länder, Straßen-/Tunnelgebühren und erforderliche Vignetten | Zuständige offizielle Stellen/Betreiber, Gültigkeitszeitraum und Fahrzeugklasse dokumentieren; keine Preise oder Regeln raten |
| Tankreichweite und Stopps | Reichweitenannahme der Maschine, letzte bekannte Tankmöglichkeit, geplante Tankstopps und Ausweichoptionen | Tatsächliche Tankstellenlage verifizieren. Gemäß Logistik-Checkliste gilt im abgelegenen Gebiet: ab etwa 150 km Restreichweite jede geeignete Tankmöglichkeit nutzen („immer vollmachen“); dies ist eine Tourregel, keine Garantie für Tankstellenverfügbarkeit |
| Fähren | Betreiber, Strecke, geplante Abfahrt/Rückfahrt, Check-in-Frist, Fahrzeug-/Kabinenangaben und Bestätigungsstatus | Fahrplan und Buchung direkt beim Betreiber bestätigen; Planzeiten nicht als Fahrplanzusage darstellen |
| Unterkünfte | Geplanter Ort/Unterkunft, Buchungsstatus, Motorradstellplatz und relevante An-/Abreisebedingungen | Adresse und Buchungsbestätigung prüfen; keine Unterkunft als gebucht ausgeben, solange unbestätigt |
| Pannen-/Notfallkonzept | Pannenausrüstung, Vorgehen bei Reifen-/Technikproblem, Kommunikations- und Notfallkontakt, nächster sinnvoller Hilfe-/Abbruchpunkt | Kontakte, Verfügbarkeit und Maßnahmen vor Veröffentlichung verifizieren; keine erfundenen Telefonnummern |
| Streckenbesonderheiten | Pass, Schotter, enge Straße, Wetter-/Sperrungsrisiko, Alternativroute und Entscheidungspunkt | Auf freigegebenen Routendaten oder überprüfbarer Quelle beruhen; Unsicherheiten sichtbar machen |

Die Matrix muss sowohl die Motorradschleife als auch die PKW-/Anhänger-An- und Rückreise angemessen abbilden. Nicht zutreffende Felder werden als „nicht zutreffend“ gekennzeichnet. Die Checkliste im Workspace ist Prüfgrundlage, aber nicht automatisch ein Nachweis, dass ein Punkt erledigt oder gebucht wurde.

### 5.1 Bereits dokumentierte offene Prüfpunkte

Folgende Punkte sind in der Logistik-Checkliste als zu prüfen bzw. zu bestätigen beschrieben und bleiben bis zum jeweiligen Nachweis offen:

- Geltungsbereich der Grünen Versicherungskarte/IVK für alle betroffenen Länder, Fahrzeugpapiere und gegebenenfalls Vollmacht.
- Relevante Maut-/Vignetten- und Tunnelbestimmungen, insbesondere die in der Checkliste genannte Slowenien-Vignette und Karawankentunnel-Maut für die dort bezeichnete Alternative.
- Tankstellen- und Reichweitenplanung in abgelegenen Regionen sowie Pannenausrüstung und Hilfeplan.
- Adriafähre Igoumenitsa–Fusina, genannte Reiseplanung am 25.09.2027, Fahrzeug/Kabine, Abfahrt, Ankunft und Check-in-Frist; September-Fahrplan und Buchungsstatus sind laut Checkliste nicht bestätigt.
- Koman-Fähre: Zeiten und Bedingungen für 2027 beim Betreiber bestätigen; die Checkliste nennt den 19.09.2027 als Tag zur Vorabklärung.
- Unterkunft nahe Koman, sichere Motorradabstellung während der Fährfahrt, Villach-Hotel und Abstellmöglichkeit für PKW/Anhänger sowie weitere in der Checkliste genannte Unterkünfte.
- In der Checkliste genannte Meteora-Öffnungszeiten, Ruhetage, Kleidervorschriften und Zahlungsbedingungen aktuell prüfen.
- Nach Feststehen echter Unterkunfts- und Fährterminal-Adressen die Etappen neu prüfen; die Checkliste hebt D09, D11 und D16 hervor.

Die genannten Daten und Beschreibungen geben den Status der vorliegenden Planungsnotiz wieder. Sie sind keine Bestätigung von Betreiberfahrplänen, Reservierungen, Rechtslagen oder Öffnungszeiten.

---

## 6. Medien, Herkunft und Lizenzkonformität

### 6.1 Grundregeln

- Medien werden nach Etappe unter `assets/media/tag-XX/` abgelegt. Bilder sind für Mobilfunknutzung zu optimieren; die V4-Richtwerte (max. 1600 px Breite, etwa 200–400 KB) sind Zielwerte und kein Freibrief, Qualität oder Lizenz zu vernachlässigen.
- Videos: kurze lokale Clips nur nach belegter Größe/Format und mit Posterbild; längere Videos können als externe Einbettung referenziert werden. Externe Einbettungen sind als netzabhängig auszuweisen.
- Galerieinhalte werden bedarfsgerecht nachgeladen (Lazy Loading). Nicht verfügbare Dateien erhalten einen verständlichen Leerzustand statt kaputter Bild-/Videoflächen.
- Es dürfen keine Medienrechte oder Verwendungsrechte aus bloßer Auffindbarkeit abgeleitet werden.

### 6.2 Duplikate

- Dieselbe Bild- oder Video-Referenz darf nicht ohne sachlichen Grund in mehreren Etappen wiederholt werden.
- Vor Veröffentlichung ist auf doppelte Pfade, URLs, Video-IDs und inhaltlich identische Dateien zu prüfen. Bei lokalen Medien kann zusätzlich ein Datei-Hash zum Erkennen identischer Inhalte verwendet werden.
- Ein absichtlich wiederkehrendes Medium muss im jeweiligen Step einen klaren redaktionellen Grund haben; sonst ist je Etappe eigenständiges, passendes Material zu verwenden.
- Das Review V4 benennt wiederholte Video-Referenzen zwischen D01/D22 und D11/D12 als konkreten Prüfbedarf. Diese Verweise sind vor Übernahme zu bereinigen oder nachvollziehbar zu begründen.

### 6.3 Attribution, Lizenz und Symbolbilder

Für jedes Fremdmedium sind Herkunft, Urheber/Attribution und Lizenz korrekt und zusammengehörig im Frontmatter zu erfassen. Bei Bedarf ist die konkrete Quell-URL mitzuführen. Lizenzbezeichnungen dürfen nicht aus einem Begleittext abgeleitet werden, wenn die Metadaten etwas anderes behaupten.

- Eigene Medien als eigene Medien kennzeichnen; dennoch Urheber/Quelle nach Projektregel dokumentieren.
- Fremdmedien, die nur die Region oder einen ähnlichen Eindruck illustrieren und nicht die konkrete Etappe dokumentieren, sichtbar als **Symbolbild** kennzeichnen – im Datenmodell und in der UI.
- Lizenztext und Attribution müssen den tatsächlichen Quelldaten entsprechen. Bei CC BY-SA insbesondere die genaue Version und die erforderliche Namensnennung prüfen.
- Bis Lizenz und Zuordnung geprüft sind, Medium nicht veröffentlichen; Status als offen markieren.
- Bei Videos gelten dieselben Anforderungen; externe Plattformen sind keine automatische Lizenzfreigabe.

**Bekannter Prüfbedarf aus Review V4:** D12/D13 werden als Beispiele für widersprüchliche Lizenz-/Urheberfelder genannt (Textangabe CC BY-SA 4.0 gegenüber Feldangabe CC BY-SA 3.0 sowie falsch belegte Urheberfelder). Diese Metadaten sind anhand der Originalquellen zu überprüfen; keine der Versionen wird hiermit als korrekt festgelegt.

---

## 7. PWA, Offline-Verhalten und Nutzerhinweise

### 7.1 PWA-Bestandteile

- Web App Manifest: `web/public/manifest.json`.
- Service Worker: `web/public/sw.js`.
- App-Icons und Einbindung in `web/index.html`.
- Homescreen-Installation über unterstützte mobile Browser; Verhalten und Anleitung plattformgerecht beschreiben.

### 7.2 Offline-Grenzen – verpflichtend verständlich ausweisen

Die App muss drei Kategorien unterscheiden:

1. **Lokale App-Dateien:** Shell, Styles, Skripte und ausgewählte lokale Medien können durch den Service Worker zwischengespeichert werden; Umfang und Aktualisierungsverhalten sind technisch zu prüfen.
2. **Lokale GPX-Dateien:** Etappen-GPX-Dateien können als lokale Projektdateien für Abruf/Download verfügbar sein und gegebenenfalls gecacht werden. Das ersetzt weder ein Navigationsgerät noch eine validierte Offline-Navigations-App.
3. **Externe OSM-Kartenkacheln:** Diese werden von einem externen Kartenanbieter geladen und sind durch das lokale Caching der App-Dateien nicht automatisch offline verfügbar. Offline-Kartenkacheln dürfen nicht versprochen werden, sofern keine gesonderte, zulässige und getestete Implementierung besteht.

Bei fehlender Verbindung muss die Anwendung verständlich darauf hinweisen, dass Kartenkacheln und externe Medien fehlen können. Nutzer sind anzuleiten, freigegebene GPX-Dateien und nötige Offline-Karten vorab in ihrem Navigationsgerät bzw. ihrer Offline-App bereitzustellen. Die PWA ist Roadbook und Informationsoberfläche, keine garantierte Notfall- oder Offline-Navigationslösung.

### 7.3 Aktualität und Offline-Abnahme

- Nach einem PR-Merge müssen geänderte Etappeninhalte bei verfügbarer Verbindung zuverlässig aktualisierbar sein; Cache-Strategie, Versionierung und Aktualisierungsanzeige sind zu testen.
- PWA-Installierbarkeit, App-Shell-Cache, GPX-Abruf, Verhalten ohne Netz, externe Kartenkacheln und iOS-/Android-Unterschiede sind getrennt abzunehmen.
- Aussagen wie „offline verfügbar“ müssen benennen, welche konkreten Inhalte verfügbar sind. Der Gesamtstatus der PWA und der Kartenkacheln ist in der UI bzw. Installationshilfe klar.
- Solange iOS-/Android- und Offline-Tests nicht dokumentiert sind, lautet der Status „noch nicht abgenommen“.

---

## 8. Workspace-Verzeichnisstruktur

Die folgende Zielstruktur erhält die V4-Grundstruktur und führt die in den Ablaufunterlagen benannten Projektdokumente und Medien weiter. Vorhandene Namen und Schemata sind bei der Umsetzung mit dem tatsächlichen Workspace abzugleichen; dieses Pflichtenheft ändert keine anderen Dateien.

```text
Balkan-Ride-2027/
├── .github/
│   ├── copilot-instructions.md
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
│   ├── gpx/ (Gesamtroute und Tages-GPX-Dateien; Prüfstatus dokumentieren)
│   └── media/
│       ├── tag-01/
│       └── ... (bis tag-22/)
├── web/
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   ├── vite.config.js
│   ├── src/
│   ├── tests/ (node:test für Web-Änderungen)
│   └── public/
│       ├── manifest.json
│       ├── sw.js
│       └── favicon.svg, apple-touch-icon.png, icon-192.png, icon-512.png
├── docs/
│   ├── Balkan_Tour_Pflichtenheft_V4.md
│   ├── Review_V4.md
│   ├── master_ablauf_prompt_plan_v4.md
│   ├── todo_plan_v4.md
│   ├── motorrad_checkliste_logistik.md
│   └── V5/
│       ├── Pflichtenheft_V5_Agent_Prompt.md
│       └── Balkan_Tour_Pflichtenheft_V5.md
└── ...
```

---

## 9. Zweistufiges Change-Management: `/plan-item` → Freigabe → `/implement-item`

Das in V4 etablierte Prinzip „Erst planen, dann bauen“ bleibt verbindlich und gilt für Änderungen an der **gesamten Roadbook-App**, nicht nur für Etappentexte oder Dateien unter `content/`. Dazu zählen – sofern ausdrücklich geplant und freigegeben – unter anderem `web/`-UI und -Logik, PWA-Dateien, `web/tests/`, `content/`, `assets/`, Build- und CI-Konfiguration sowie unmittelbar betroffene Projektdokumentation. Automatisierte Änderungen auf `main` sind untersagt; Umsetzung erfolgt über eigenen Branch und Pull Request.

Der erweiterte Geltungsbereich ist keine pauschale Änderungsbefugnis: `/implement-item` darf ausschließlich die im Umsetzungsplan einzeln aufgeführten und nach Planfreigabe genehmigten Dateien ändern. Secrets und deren Werte, private Exports sowie GitHub-Repository-/Organisations-Settings werden durch diesen Workflow nicht geändert. Solche administrativen oder sensiblen Änderungen benötigen einen separaten, vom Nutzer ausdrücklich autorisierten Vorgang außerhalb des Agenten-Workflows.

### 9.1 Stufe 1 – Planung (`/plan-item`)

1. Ein Änderungswunsch wird als GitHub-Issue erfasst, gegebenenfalls per Sprachdiktat.
2. Der Agent analysiert das Issue im Kontext der betroffenen Roadbook-Komponenten. Er ermittelt notwendige direkte Änderungen und Abhängigkeiten über passende Bereiche des Workspaces hinweg, beispielsweise App-Oberfläche/-Logik, PWA, Tests, Inhalte, Assets, Build/CI und direkt betroffene Projektdokumentation.
3. Er ändert keine Dateien und postet einen Kommentar, der exakt mit `## Umsetzungsplan` beginnt.
4. Der Plan nennt für jede Änderung die betroffene Komponente und jeden erwarteten Dateipfad, beschreibt die konkrete Änderung und Abhängigkeiten und führt passende Tests sowie Build-/Validierungsschritte auf. Er benennt außerdem betroffene Etappen, Datenfelder und offene Fragen, soweit einschlägig.
5. Der Plan muss den Umfang klar begrenzen. Nicht aufgeführte Dateien dürfen in der Implementierung nicht geändert werden. Secrets/Werte, private Exports und GitHub-Settings sind keine zulässigen Änderungsziele dieses Workflows; notwendige Änderungen daran sind separat zu behandeln.
6. Pull-Request-Kommentare lösen keine Planungsstufe aus. Befehlsauslösung und Benutzerberechtigung sind nach der Workflow-Konfiguration zu prüfen.

### 9.2 Freigabe

Der Nutzer prüft den Plan. Bei Einverständnis kommentiert er das Issue mit `/implement-item`; bei Änderungen oder Klärungsbedarf kann er mit `/plan-item` eine erneute Planung verlangen. Ohne ausdrückliche Freigabe keine Umsetzung.

### 9.3 Stufe 2 – Umsetzung und Pull Request (`/implement-item`)

1. Der Agent liest Issue, freigegebenen Plan und nachfolgende Kommentare.
2. Er ändert ausschließlich die im freigegebenen Plan einzeln benannten und genehmigten Dateien. Der erlaubte Dateiumfang kann Komponenten aus `web/`, `web/tests/`, `content/`, `assets/`, Build-/CI-Konfiguration und direkt betroffener Projektdokumentation umfassen; die bloße Zugehörigkeit zu diesen Bereichen ist keine Freigabe.
3. Secrets und deren Werte, private Exports sowie GitHub-Repository-/Organisations-Settings sind ausgeschlossen. Der Agent darf sie weder lesen, ausgeben, erstellen, verändern noch löschen; bei notwendigem Änderungsbedarf stoppt er und meldet den separaten administrativen Klärungsbedarf.
4. Bei Etappendaten erhält er das vollständige Frontmatter einschließlich Koordinaten- und Medienlisten. Bei allen Änderungen prüft er einschlägige Fakten anhand freigegebener Quellen. Unbestätigte Angaben bleiben als offen markiert und werden nicht ergänzt, um Lücken zu füllen.
5. Er erstellt einen Branch nach dem Muster `feature/issue-<nummer>`, committet ausschließlich die geplanten Änderungen dort und eröffnet einen PR gegen `main` mit Issue-Referenz.
6. Vor dem PR müssen passende Tests für die geänderten Komponenten ausgeführt werden; bei Änderungen an `web/` sind geeignete `node:test`-Tests unter `web/tests/` verpflichtend. Der Produktionsbuild ist auszuführen. Bei Routen-/Daten-/Assetänderungen kommen passende Schema-, Medien- und GPX-/CSV-Konsistenzprüfungen hinzu. Ergebnisse und nicht ausführbare Prüfungen werden im PR nachvollziehbar benannt.
7. Der Projektverantwortliche prüft den vollständigen Diff auf Übereinstimmung mit dem freigegebenen Plan und gibt die Veröffentlichung durch Merge frei.

### 9.4 Veröffentlichungs- und Sicherheitsregeln

- Direkte automatisierte Schreibvorgänge auf `main` sind verboten.
- `main` ist durch PR-Pflicht zu schützen.
- Agenten-Berechtigungen, GitHub-Action-Secrets und Workflow-Bedingungen sind minimal und projektbezogen zu halten.
- Der zweistufige Workflow darf Änderungen an App-Komponenten außerhalb von `content/` planen und umsetzen, aber nur innerhalb der einzeln freigegebenen Dateiliste. Er ist kein allgemeiner Workspace-Schreibzugriff.
- Secrets/Werte, private Exports und GitHub-Settings bleiben außerhalb dieses Workflows; sie dürfen nicht als beiläufige Nebenänderung in einen Roadbook-PR aufgenommen werden.
- Ein erfolgreicher Agentenlauf oder Merge bedeutet nicht automatisch, dass Route, Recht, Buchung oder Track vor Ort validiert wurden.
- Fehler, fehlende Rechte und nicht ausgeführte Prüfungen müssen offen gemeldet werden; nicht als erfolgreich ausgeben.
- Diese V5-Anforderung erweitert die Spezifikation, ändert aber nicht selbst die bestehende Agentenimplementierung. Die Ausweitung auf app-weite Änderungen muss in einem separaten, freigegebenen PR in Befehlsdateien, Runner und gegebenenfalls Workflows umgesetzt und mit zulässigen/abgelehnten Dateipfaden, Tests und Build verifiziert werden. Bis zu dieser Umsetzung darf die App-weite Fähigkeit nicht als bereits verfügbar gelten.

---

## 10. Build, Migration und Prüfablauf

### 10.1 Datenmigration und Track-Erzeugung

Die 22 Etappen werden aus dem freigegebenen Final-Plan in `content/tag-01.md` bis `content/tag-22.md` übertragen. Datum, Texte, Alternativen, Koordinaten und Etappenangaben sind exakt aus der gültigen Quelle zu übernehmen. Wo diese nicht geprüft oder widersprüchlich sind, wird die Unklarheit dokumentiert statt aufgelöst.

Wenn Plan, CSV-Kartenimport oder GPX-Quelle importiert bzw. geändert werden:

1. Die drei Quellen gemeinsam auf Konsistenz prüfen.
2. Tages-Tracks nach der im Workspace dokumentierten Generator-Anweisung neu berechnen.
3. Alle Tages-GPX-Dateien auf gültiges XML, Wegpunkt-/Trackpunktstruktur, Punktzahl, Dateigröße und Wegpunktkategorien prüfen.
4. Gegen Etappenplan, Kartenanzeige und Datenmodell abgleichen.
5. Webtests ausführen und den Produktionsbuild erstellen.

Ein generierter Track bleibt bis zur sachlichen Motorradprüfung „berechnet“ bzw. „vorläufig“; die Generierung selbst ist keine Fahrprüfung.

### 10.2 Funktionale Abnahme

- Landingpage, Tagesnavigation und Gesamtkarte auf Desktop und Mobilgeräten.
- Eindeutige Darstellung der 22-/18-Kalendertage-Definition.
- Distanz-, Höhen- und Fahrzeitkonsistenz zwischen Frontmatter, Track/Profil und UI.
- Sichtbarer Daten- und Buchungsstatus für offene Punkte.
- Pin-Lesbarkeit und vollständige Bedienbarkeit dichter Kartenbereiche.
- Mediengalerie, Lazy Loading, Lightbox, Duplikatprüfung und Lizenzangaben.
- PWA-Installation, App-Asset-Cache, GPX-Bereitstellung, Netzverlust und Kartenkachelgrenzen.
- Zweistufiger Issue-Planungs-/Freigabe-/PR-Prozess für App- und Roadbook-Änderungen in mehreren Komponenten; Planungsstufe benennt Komponenten und vollständige erwartete Dateiliste, Umsetzung bleibt exakt darauf begrenzt, mit passenden Tests und Produktionsbuild vor PR.
- Ausschluss sensibler/administrativer Ziele: Secrets/Werte, private Exports und GitHub-Settings.
- Automatisierte `node:test`-Tests in CI vor dem Produktionsbuild.

---

## 11. Offene Punkte und Widersprüche

Die folgenden Punkte bleiben offen, bis eine maßgebliche Projektquelle oder zuständige Stelle sie bestätigt:

1. **Gruppengröße:** Die Logistik-Checkliste und das Review verwenden „maximal 4 bis 6 Motorräder“; das ist keine eindeutige Obergrenze. Konkrete Motorrad- und Teilnehmerzahl samt Besatzung je Maschine festlegen, bevor die Landingpage verbindlich einlädt.
2. **Routen- und GPX-Status:** V7-GPX ist laut vorliegenden Notizen ein Wegpunktplan. D03/D04 weisen erhebliche Distanzabweichungen zu rekonstruierten OSRM-Werten auf. Kein Wert ist damit automatisch als endgültige Motorraddistanz bestätigt.
3. **Fahrzeit und Tagesdauer:** Vorhandene Werte werden im Review als Modellzeiten beschrieben. Brutto-Tagesdauer einschließlich Pausen, Grenzen und Tankstopps ist nicht automatisch bekannt; sie muss je Etappe nachvollziehbar geschätzt oder offen gelassen werden.
4. **Höhenmeter:** Frontmatter- und GPX-Profilwerte weichen laut Review ab. Methode, Quelle und Datenstand müssen je Anzeige harmonisiert werden.
5. **Fähren und Unterkünfte:** Die in der Logistik-Checkliste aufgeführten Fähren, Zeiten, Unterkünfte und Stellplatzabsprachen sind Prüf-/Buchungspunkte, keine bestätigten Reservierungen.
6. **Recht und Verkehr:** Versicherungsdeckung, Einreise-/Fahrzeugdokumente, Vignetten, Maut und sonstige Regeln benötigen aktuelle Prüfung bei offiziellen Stellen bzw. Versicherer/Betreiber. Dieses Pflichtenheft trifft dazu keine eigenständige Rechtsaussage.
7. **Medien:** Duplikate sowie die im Review benannten widersprüchlichen Lizenz-/Urheberangaben müssen anhand der Originalquellen geklärt werden.
8. **PWA-Offline-Abnahme:** App- und GPX-Caching sind von externen Kartenkacheln zu trennen. iOS-/Android-Abnahme und tatsächlicher Offline-Umfang sind erst nach dokumentiertem Test als erledigt auszuweisen.
9. **Landingpage-CTA:** Kontaktweg, Teilnahmeprozess und verbindliche Teilnahmebedingungen sind noch festzulegen; keine Kontaktdaten oder Buchungszusage ergänzen, solange sie nicht vorliegen.
10. **Dokumentenrang:** V4 ist das Basisdokument. Nach ausdrücklicher Projektfreigabe ersetzt V5 V4 als aktuelle Produktspezifikation; bis dahin bleibt V4 maßgeblich. Bei abweichenden Angaben in Review oder Hilfsdokumenten ist der Widerspruch zu benennen und fachlich zu klären; V5 darf keine nicht belegte Routentatsache stillschweigend zum neuen Fakt machen.
11. **App-weite Agentenfähigkeit:** Die Spezifikation verlangt Änderungen über `content/` hinaus. Die dafür nötige Anpassung und Verifikation des bestehenden Befehls-/Runner-/Workflow-Verhaltens ist ein separater Implementierungsschritt und durch die Erstellung dieses Pflichtenhefts nicht erfolgt.

---

## 12. Versions- und Änderungsdokumentation

### Version V5 – 24.11.2026

- **Art der Änderung:** Konsolidierte Fortschreibung der V4-Spezifikation; keine Änderung an Routendaten oder Buchungen.
- **Betroffene Bereiche:** Reisedauer/Zählweise, vorgeschaltete Landingpage, Fahrzeit- und Datenmodell, GPX-Prüfung, Logistikmatrix, Kartenpins/UI, PWA-Offlinegrenzen, Medienmetadaten und Change-Management.
- **Betroffene Etappen/Routen/Unterkünfte:** Anforderungen gelten projektweit D01–D22; konkret offene Planungsprüfungen D03/D04, D09, D11, D16, D19 sowie die in der Logistik-Checkliste aufgeführten Fähr- und Unterkunftspunkte.
- **Quelle:** V4-Pflichtenheft, Review V4, V5-Agent-Prompt, Master-Ablaufplan V4, To-do-Plan V4, Motorrad-Logistik-Checkliste und `.github/agents/riderrix.agent.md`.
- **Grenze:** Ausschließlich dieses Dokument spezifiziert Anforderungen. Etappenwerte, rechtliche Aussagen und Buchungsstände wurden nicht neu festgelegt.

---

## Quellenbasis

1. [Pflichtenheft V4](../Balkan_Tour_Pflichtenheft_V4.md) – Basisspezifikation und V4-Frontmatter.
2. [Review V4](../Review_V4.md) – Reviewbefunde zu Zählweise, UI, Datenqualität, PWA, Medien und offenen Veröffentlichungsfragen.
3. [V5-Agent-Prompt](./Pflichtenheft_V5_Agent_Prompt.md) – sechs verpflichtende V5-Optimierungen.
4. [Master-Ablaufplan V4](../master_ablauf_prompt_plan_v4.md) – Workspace-Zielstruktur, zweistufiger Agentenablauf, Track-/Build- und Abnahmehinweise.
5. [To-do-Plan V4](../todo_plan_v4.md) – Projektstatus, offene GPX-/Medien-/PWA- und Testpunkte.
6. [Motorrad-Logistik-Checkliste](../motorrad_checkliste_logistik.md) – Motorradlogistik, Reichweitenregel und offene Fähr-, Unterkunfts-, Routen- und Dokumentenprüfungen.
7. [Riderrix-Agentenvorgaben](../../.github/agents/riderrix.agent.md) – Projektarbeitsweise, Quellenpriorität, Daten-/GPX-Regeln und Web-Testpflicht.


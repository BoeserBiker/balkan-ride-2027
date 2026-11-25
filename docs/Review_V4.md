
## Kurzurteil
Die [Live-Seite](https://boeserbiker.github.io/balkan-ride-2027/) ist als interaktives Roadbook bereits solide: Gesamtkarte, 22 nummerierte Etappen-Pins, Tagesnavigation, Kartenzoom, POI-/Routeninteraktion, Mediengalerie und installierbare PWA sind vorhanden. Als **Mitfahrer-Landingpage und verlässlicher Tourplan** ist sie aber noch nicht reif: Zählweise, Routen-/Höhenwerte, Gruppenansprache und Buchungsstatus bleiben unklar.

## 1. Zielbild: Was passt – und was weicht ab?
- **Polarsteps-Grundprinzip weitgehend erfüllt:** Der Einstieg zeigt die Gesamtroute; Tageswahl und Kartenmarker synchronisieren Etappe und Karte. Das entspricht weitgehend dem `Pflichtenheft`. Auf der Desktop-Übersicht überlagern sich jedoch mehrere nummerierte Pins im Balkanbereich deutlich; die Route wird dort schwer lesbar.
- **Zählung und Reisebeginn widersprechen deiner Angabe:** Das aktuelle Roadbook und das Pflichtenheft sagen **22 Tage**, die Dateien laufen vom 08.09. bis 29.09.2027. D01/D02 sind Anreise mit PKW und Anhänger, D21/D22 die Rückfahrt; der Korridor D03–D20 umfasst 18 Kalendertage einschließlich des Seetags D19. Die Seite startet also in Recklinghausen, nicht in Slowenien. „20 Tage“ muss vor der Bewerbung eindeutig definiert werden: Kalendertage, Zeit ab Villach oder reine Motorradfahrtage. Siehe `Pflichtenheft`, `D01`, `D19` und `D22`.
- **PWA:** Manifest und Service Worker sind vorhanden; die PWA kann die App-Hülle, Assets und GPX-Dateien cachen. Die OSM-Kacheln kommen aber von einem externen Host und werden vom Service Worker nicht offline bereitgestellt (`map.js`, `sw.js`). Die iOS-/Android- und Offline-Abnahme ist im `To-do-Plan` noch offen.
- **Der Einstieg ist zu dünn:** „Der Balkan ruft“ und „Eine Menge Kehren“ vermitteln Stimmung, aber nicht Route, Dauer, Anspruch, Kosten-/Buchungsstatus oder Mitfahrerprofil (`main.js`). Die Pins sind im ersten Überblick außerdem dicht gedrängt.

## 2. Inhalte und Datenqualität
**Stärken:** Die 22 Etappen haben die erwarteten Kerndaten und lokale GPX-Pfade; die Texte enthalten konkrete Grenz-, Wetter- und Abbruchhinweise. D11 benennt beispielsweise die lange SH20/SH21-Etappe, Tankstopp, späteste Entscheidungspunkte und eine Ausweichvariante (`D11`). D13/D18 kennzeichnen Fährzeiten ausdrücklich als unbestätigt (`D13`, `D18`). Der Ton ist direkt und stellenweise bikertypisch, ohne die Sicherheitswarnungen zu verwässern.

**Vor Veröffentlichung kritisch korrigieren:**
- **GPX ist nicht gleich geprüfte Motorradroute:** D03 bezeichnet sich selbst als berechneten OSRM-PKW-Vorab-Track, nicht als abgefahrenen Track (`tag-03.gpx`). Die Logistiknotiz nennt erhebliche Abweichungen zwischen rekonstruierten und angezeigten Distanzen: D03 176,2 statt 152,2 km, D04 210,4 statt 171,9 km (`Logistik-Checkliste`). Damit können Kartenlinie/Scrubber und Etappen-Kilometer auseinanderlaufen.
- **Höhenmeter widersprechen sich sichtbar:** Im D01-Frontmatter stehen 2.550 hm; die Live-Seite zeigt im Höhenprofil 3.750 hm. Die Profilanzeige berechnet den Anstieg separat aus dem GPX, während die Etappenkarte den Frontmatter-Wert anzeigt (`D01`, `Profilberechnung`). Auch D14 mit 0 hm braucht eine sichtbare Erklärung statt eines scheinbar exakten Nullwerts.
- **„Fahrzeit“ wird zu leicht als Tagesdauer verstanden:** Die Werte sind Modellzeiten; sie sagen nicht zuverlässig Gesamtzeit inklusive Pausen, Ortsverkehr und Grenzen aus. Die Seite formatiert sie als ungefähre Stunden, aber die Statistikkachel kürzt den Wert in der Live-Ansicht mit „…“ ab (`roadbook.js`, `style.css`). D11 hat etwa 266,2 km und 7,07 Modellstunden, zuzüglich Grenze, Tankstopp und Pausen (`D11`).
- **Medien wirken eher illustrativ als persönlich:** Die Etappen nutzen überwiegend Commons-Fotos und externe YouTube-Videos. D01 und D22 verwenden dieselben Videos; D11 und D12 ebenfalls. Bei zwei Bildern in D12/D13 steht die Lizenzanweisung im Feld `urheber`, und der Text nennt CC-BY-SA 4.0, während das Feld `lizenz` CC BY-SA 3.0 ausweist (`D12`, `D13`). Das ist ein konkreter Metadaten-/Attributionsfehler.

## 3. Zusammenfassung: Ja, sie fehlt
Eine kompakte Tourübersicht **vor** den Tages-Steps ist klar notwendig. Sie sollte mindestens enthalten:
- eindeutige Zählung und Zeitraum (22 Kalendertage oder eine anders definierte 20-Tage-Tour),
- Start/Ziel inklusive der Gespann-An- und Rückreise,
- Länder und grobe Route, Motorradfahrtage, Fährtag und längste Etappen,
- Modellwerte versus tatsächliche Tagesdauer sowie offener GPX-/Buchungsstatus,
- Gruppengröße, erforderliche Fahrerfahrung, Teilnahme-/Kontakt-CTA.

## 4. Priorisierte nächste Schritte
1. **P0 – Faktenbasis:** 20/22-Tage-Zählung festlegen; Motorrad-GPX routen und freigeben; Kilometer und Höhenmeter zwischen Frontmatter, Track und Anzeige angleichen oder konsequent als Schätzung markieren. Fährverbindung, Unterkünfte und fehlende Puffer als offen kennzeichnen.
2. **P1 – Mitfahrer-Auswahl:** Anspruch und Gruppengröße auf der ersten Bildschirmansicht klar kommunizieren. Derzeit stehen „anspruchsvolle Tour“ und „maximal 4 bis 6 Motorräder“ nur als Checkboxen unter Logistik – zudem ist „maximal 4 bis 6“ nicht eindeutig. „Zu zweit auf der BMW 800 GS“ lässt zusätzlich offen, ob eine Maschine mit zwei Personen oder mehrere Motorräder gemeint sind (`Logistik-Checkliste`).
3. **P1 – Reiseorganisation:** Eine gut scannbare Matrix für Grenz-/Fahrzeugpapiere, Versicherungsdeckung, Vignetten/Maut je Land, Tankreichweite und geplante Stopps, Pannen-/Notfallplan, Unterkünfte, Fährtermine und grobes Budget ergänzen. Ein Teil davon ist schon in der Logistik-Checkliste, aber nicht als bestätigter, etappenbezogener Plan.
4. **P2 – Glaubwürdigkeit und Bedienbarkeit:** Eigenes Bild-/Videomaterial nach der Fahrt ergänzen oder Fremdmedien klar als Illustration markieren; Medienlizenzen korrigieren und Wiederholungen vermeiden. Außerdem Kartenpins entflechten und die abgeschnittene Fahrzeit lesbar machen.
5. **P2 – Öffentlichkeits-/PWA-Klarheit:** Die Logistikseite wird direkt aus `docs/motorrad_checkliste_logistik.md` in den Web-Build importiert (`main.js`). Falls `docs/` privat bleiben soll, ist das ein öffentlicher Build-Pfad, der getrennt werden muss. Für Mitfahrer außerdem Installation und Offline-GPX-Nutzung kurz erklären; Offline-Kartenkacheln bietet die Seite derzeit nicht.

**Gesamteinschätzung:** Als technisches Roadbook ist der Stand stark und die Texte enthalten erfreulich verantwortungsvolle Warnungen. Für eine glaubwürdige Mitfahrer-Akquise sind die Zählung, die nicht validierten Motorradtracks und die widersprüchlichen Kennzahlen jedoch zuerst zu bereinigen. Die `[cite:…]`-Marker aus deiner Nachricht waren nicht auf konkrete Quellen auflösbar; ich habe mich deshalb auf die lokalen Projektvorgaben, Etappen und die Live-Seite gestützt.
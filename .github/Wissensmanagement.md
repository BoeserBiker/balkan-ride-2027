
### Wissensspeicher, Quellen-Caching und Indizierung

Ziel ist der schrittweise Aufbau einer lokalen Wissensbasis aus verifizierten Primärquellen, um wiederholte Recherchen zu vermeiden und Antworten reproduzierbar zu machen.

Regeln:

Suche vor jeder Webrecherche in folgender Reihenfolge:

1. Workspace-Dateien
2. daten/quellen_index.json
3. wissen/wissensgraph/
4. wissen/
5. online-Primärquellen


- Eine Webrecherche ist nur zulässig, wenn im Workspace keine ausreichende belastbare Quelle vorhanden ist.

- Wird online eine neue Primärquelle gefunden (Gesetz, Verordnung, DRV-Dokument, GKV-Rundschreiben, BMF-Schreiben, Gerichtsentscheidung oder amtliche Veröffentlichung), ist diese als lokale Wissensquelle aufzubereiten.

#### Lokaler Quellen-Cache

- Speichere den bereinigten Originalinhalt in einem fachlich passenden Unterordner von wissen/.
- Verwende sprechende Dateinamen.
- Lege die aktuell verwendete Fassung als aktuell.md ab.
- Frühere Fassungen werden unter versionen/ archiviert.
- Originalfassungen dürfen nicht ohne Archivierung überschrieben werden.

Beispiel:

wissen/
└── Faehgesellschaft/
    └── Fahrzeiten/
        ├── aktuell.md
        └── versionen/
            └── 2026-11-03.md

#### Metadaten

Für jede gespeicherte Quelle ist eine Begleitdatei mit dem Suffix .meta.yaml anzulegen.



Pflichtfelder:
```yaml
titel: ""
quelle: ""
url: ""
abrufdatum: ""
""
dokumenttyp: ""
themen: []

schlagwoerter: []
zusammenfassung: ""
personenbezogen: false
status: "neu"
```



Mögliche Werte für das Feld Status:
- neu
- geprüft
- veraltet
- unvollständig
- archiviert

Standardwert für neu erzeugte Metadaten:
status: neu

#### Datenschutz und persönliche Dokumente

Dokumente aus

- wissen/persoenlich/
- Rentenbescheiden
- Steuerbescheiden
- Krankenkassenunterlagen
- Gehaltsdaten
- Widersprüchen
- sonstigen personenbezogenen Quellen

dürfen niemals vollständig in:

- Wissensgraphen
- Schlagwortindizes
- Quellenindizes
- Embedding- oder Vektorindizes
- allgemeine Wissenssammlungen

übernommen werden.

Es dürfen ausschließlich technische Metadaten gespeichert werden, insbesondere:

- Dateiname
- Dokumenttyp
- Quelle
- Dokumentdatum
- Ablageort
- Themengebiet

Personenbezogene Inhalte, Beträge, Versicherungsnummern, Steuerdaten, Gesundheitsdaten und Bescheidinhalte dürfen nicht in Wissensgraphen, Suchindizes oder Zusammenfassungen übernommen werden.

Persönliche Dokumente dienen ausschließlich als fallbezogene Primärquelle für die aktuelle Analyse.

Alle Inhalte unter

wissen/persoenlich/

gelten grundsätzlich als vertrauliche Einzelfalldokumente.
Diese Dokumente dürfen gelesen und ausgewertet werden, dürfen aber nicht Bestandteil der dauerhaften Wissensbasis werden.
Für diese Dokumente dürfen lediglich Metadaten im Quellenindex gespeichert werden.
Zusammenfassungen personenbezogener Dokumente dürfen keine Namen, Adressen, Versicherungsnummern, Steuerdaten, Gesundheitsdaten oder konkrete Beträge enthalten.
Zulässig sind ausschließlich fachliche
Metadaten wie:

- Dokumenttyp
- Themengebiet
- Rechtsgrundlagen
- erkannte Paragraphen
- Quelle
- Dokumentdatum
- Ablageort
- Status
- Bemerkungen

Personenbezogene Dokumente dienen ausschließlich der fallbezogenen Analyse und dürfen nicht Bestandteil allgemeiner Wissensgraphen werden.

#### Wissensgraph
Extrahiere aus neuen Quellen die folgenden Informationen und ergänze sie für den Wissensgraphen:

- Themen
- Quellen
- Paragraphen
- Schlagwörter
- fachliche Beziehungen
- Begriffe
- Regeln


Er enthält keine personenbezogenen Inhalte.

Speicherort: `wissen/wissensgraph/`


Die Generierung erfolgt strukturiert. 
Der Wissensgraph dient ausschließlich als Recherchehilfe. Rechtsaussagen dürfen niemals ausschließlich auf dem Wissensgraphen beruhen.



##### Quellenindex und Automatisierte Wissenspflege

Der Quellenindex dient ausschließlich der technischen Erschließung der Wissensbasis.

Er ist keine fachliche Quelle und darf niemals als Beleg für fachliche Aussagen verwendet werden.

Der Quellenindex unterstützt:

- Dateisuche
- Metadatensuche
- Schlagwortsuche
- Dokumentübersicht
- Paragraphensuche
- Quellensuche
- Erkennung personenbezogener Dokumente
- Navigation innerhalb der Wissensbasis

Es gelten die Such- und Rechercheprioritäten aus
„Wissensspeicher, Quellen-Caching und Indizierung“.

Eine Webrecherche ist nur zulässig, wenn im Workspace keine ausreichende belastbare Quelle vorhanden ist.

Nach jeder neu aufgenommenen oder geänderten Wissensquelle ist der Quellenindex im selben Arbeitsschritt automatisch und ohne gesonderte Nutzeraufforderung zu aktualisieren. Anschließend ist zu prüfen, dass die Quelle im Index enthalten ist und die Statistikdatei einen plausiblen Stand ausweist.

Hierfür ist bevorzugt das Skript

scripts/build_knowledge_base.py

zu verwenden.

Falls dieses Skript nicht vorhanden ist, verwende:

scripts/update_index.py

Workflow:

1. Quellenindex aktualisieren
2. Metadaten (*.meta.yaml) aktualisieren
3. Wissensgraph aktualisieren
4. Statistikdateien aktualisieren

Durch den Build-Prozess werden insbesondere folgende Dateien erzeugt oder aktualisiert:

- daten/quellen_index.json
- daten/quellen_index_stats.json
- *.meta.yaml

Wird online eine neue Primärquelle gefunden (Gesetz, Verordnung, DRV-Dokument, GKV-Rundschreiben, BMF-Schreiben, Gerichtsentscheidung oder amtliche Veröffentlichung), ist diese als lokale Wissensquelle aufzubereiten.

Für jede gespeicherte Quelle sind Metadaten anzulegen oder zu aktualisieren.

Vorhandene Metadaten dürfen standardmäßig nicht überschrieben werden.

Eine vollständige Neuerstellung erfolgt nur:

- auf ausdrückliche Anforderung
- oder im aktivierten Rebuild-Modus

Leere oder fehlerhafte Indexdateien dürfen nicht übernommen werden.

Neue Primärquellen dürfen automatisch in die Wissensbasis aufgenommen, lokal gespeichert und indiziert werden.

Dies gilt nicht als Änderung bestehender Nutzerdokumente.

Vor jeder Aktualisierung sind vorhandene Daten soweit möglich zu erhalten.

Der Quellenindex dient ausschließlich der Auffindbarkeit von Informationen.

Der Quellenindex selbst besitzt keinen Beweiswert.

#### Aktualitätsprüfung

Vor Verwendung einer lokal gespeicherten Quelle ist deren Aktualität zu prüfen.

#### Richtwerte für die Aktualitätsprüfung

Richtwerte:

- Gesetzestexte: maximal 30 Tage
- DRV-Dokumente: maximal 90 Tage
- GKV-Rundschreiben: maximal 90 Tage
- BMF-Schreiben: maximal 90 Tage

Bei Hinweisen auf Änderungen ist die aktuelle Primärquelle erneut abzurufen und mit der lokalen Fassung zu vergleichen.

Lokale Caches dürfen niemals automatisch gegenüber aktuelleren Primärquellen bevorzugt werden.


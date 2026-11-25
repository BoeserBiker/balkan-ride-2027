# Freigabe-Checkliste V5 – Balkan-Ride 2027

**Stand:** 25.11.2026 · **Entscheider:** `BB` · **Status:** zur Ausfüllung

Dieses Formular dient ausschließlich der formalen Freigabe von V5. Es enthält
keine Anforderungen und keine laufende Aufgabenliste. Anforderungen stehen im
[Pflichtenheft V5](../Balkan_Tour_Pflichtenheft_V5.md) und im
[Lastenheft V5](../master_ablauf_prompt_plan_v5.md); Stand, offene Arbeitspakete
und das Ergebnis dieser Freigabe werden im [Daily](../../export/ARBEITSSTAND.md)
geführt. Bis zur Unterschrift unten bleibt V5 ein Entwurf und V4 die bisherige
freigegebene Grundlage.

Ankreuzen: pro Punkt genau eine Option. Eine nicht angekreuzte Option bedeutet
„nicht entschieden“ – nichts wird dann stillschweigend übernommen.

## 1. Bereits erfüllte technische Voraussetzungen (Ist-Nachweis)

- [x] **Live-Deployment (`main`) grün:** Der GitHub-Actions-Lauf
  [Deploy Roadbook to GitHub Pages](https://github.com/BoeserBiker/balkan-ride-2027/actions/runs/45644550675)
  auf Commit `95abf34` war erfolgreich (Jobs `build` und `deploy`): `19/19`
  Node-Tests, Produktionsbuild. Live-URL:
  <https://boeserbiker.github.io/balkan-ride-2027/>.
- [x] **Playwright-Visual-Check (lokal):** `100/100` PASS in vier Viewports
  (375, 412, 768, 1280 px), Bericht in `web/.visual-report/REPORT.md`
  (lokal, nicht versioniert). Hinweis: Dieser Check läuft derzeit **nicht** als
  GitHub-Actions-Gate; das Gate ist erst mit `T01` vorgesehen.
- [x] **V5-Unterlagen konsolidiert (Stand 25.11.2026):**
  [Pflichtenheft V5](../Balkan_Tour_Pflichtenheft_V5.md) und
  [Lastenheft V5](../master_ablauf_prompt_plan_v5.md) sind getrennt nach
  Produkt-/Fachziel und Technik; das Daily führt den Stand.
  Die Dateien unter `docs/V5/` verweisen auf diese kanonischen Dokumente.
- Nicht Teil dieses Nachweises: reale Geräte-/Offline-Abnahme, fachliche
  Routen-, Buchungs- und Rechtsprüfungen (bleiben offen, siehe Daily).

## 2. Freigabe-Entscheidungen

### Punkt 1 – Formale V5-Projektfreigabe (`F01`)

Pflichtenheft V5 und Lastenheft V5 lösen V4 als verbindliche Arbeitsgrundlage
ab. V4-Dateien bleiben erhalten.

- [ ] **A – Freigabe erteilt:** V5 ist ab dem Freigabedatum verbindlich; die
  Agentenreferenz auf V4 wird danach in einem separaten, geplanten Schritt auf
  V5 umgestellt.
- [ ] **B – Noch nicht freigegeben:** V4 bleibt verbindlich; V5 bleibt Entwurf
  (Nachbesserungswunsch unten eintragen).

Nachbesserung / Anmerkung: ______________________________

### Punkt 2 – Umgang mit `docs/` und Repo-Privacy (`F02`)

Das Repository ist öffentlich; `docs/` ist aktuell getrackt.

- [ ] **A – `docs/` bleibt öffentlich** im Repo und Build. `F02` ist damit
  direkt abgeschlossen; keine Entkopplung nötig.
- [ ] **B – `docs/` wird privat gehalten** (z. B. per `.gitignore` und
  `git rm --cached`). Die beiden früheren Kopplungen der Logistik-Datei
  (Raw-Import in `web/src/main.js`, Planlauf-Kontext in
  `.github/scripts/agent_runner.py`) sind bereits getrennt: Die Datei liegt jetzt
  unter [`web/src/content/logistik.md`](../../web/src/content/logistik.md).
  Zusätzlich wären bereits veröffentlichte Git-Historie und Verweise in
  README/Agentendateien gesondert zu bewerten (nicht Teil dieser Freigabe).

### Punkt 3 – Teilnahme, Gruppengröße und Kontakt (`F03`)

Heute ist laut Daily weder eine Gruppengröße noch ein Kontaktweg festgelegt;
die Texte bleiben bewusst allgemein („Motorrad / Motorräder“). Ohne Festlegung
zeigt die künftige Landingpage keine Teilnahme- oder Kontaktzusagen.

- [ ] **A – Jetzt festlegen** (Werte unten eintragen):
  - Gruppengrenze: ______ Motorräder / Solo-Fahrer: [ ] ja  [ ] nein
  - Selbstcheck-Checkboxen: [ ] rein informativ  [ ] Filter/Auswahlbedingung
  - Kontaktweg: ______________________________
- [ ] **B – Bewusst noch `offen`:** Landingpage und Texte bleiben ohne
  Gruppengröße und Kontakt; `F03` und die davon abhängige Teilnahme-/
  Kontaktdarstellung in `P02` bleiben offen.

### Punkt 4 – Startreihenfolge der ersten V5-Umsetzungspakete

Vorschlag (Reihenfolge der Pakete aus dem Daily):

1. `A01` Maintainer-PR für app-weite Agentenfähigkeit (direkt von `BB`
   autorisiert; der Runner darf `.github/` und `config/commands/` nicht selbst
   ändern)
2. `P01`/`P02` Tour-Landingpage
3. `U01` Kartenpin-Entflechtung und `U02` Netto-/Brutto-Fahrzeit
4. `M01`–`M03` Medienlizenzen und Galerie
5. `D01`–`D08` / `L01`–`L05` Tourdaten, Logistik und Buchungen

Zwei Abhängigkeiten laut Daily sind vor der Bestätigung zu beachten:
`P02` benötigt die Entscheidung aus Punkt 3 (`F03`), und `U02` stützt sich auf
die Datenfelder aus `D02`/`D05`.

- [ ] **A – Reihenfolge wie vorgeschlagen bestätigt.** `U02` wird dann nur
  teilweise (Darstellungsstruktur) begonnen und nach `D02`/`D05` vollendet.
- [ ] **B – Angepasst:** `U02` und `P02` nach den jeweils benötigten Paketen
  einordnen; gewünschte Reihenfolge: ______________________________

## 3. Freigabevermerk

Mit der Unterschrift setzt `BB` die oben angekreuzten Entscheidungen in Kraft.
Nur angekreuzte Punkte gelten als entschieden; alles andere bleibt offen.

**Freigegeben am:** ___ · **Freigegeben durch:** BB · **Gewählte Optionen:**
Punkt 1: ___ · Punkt 2: ___ · Punkt 3: ___ · Punkt 4: ___

Unterschrift / Bestätigung: ______________________________

Nach dem Ausfüllen wird das Ergebnis im [Daily](../../export/ARBEITSSTAND.md)
festgehalten und die betroffenen Arbeitspakete dort fortgeschrieben.

# Roadbook-Agent

Persönlicher Agent für:

- Entwiklung von Reiseplänen
- Entwiklung von Webseiten
- App-Entwicklung

Mandant: BB

## Projektüberblick – Balkan-Ride 2027

Das Repository enthält das Projektgerüst für das digitale Roadbook der
Balkan-Ride 2027. Die Web-App bietet getrennte Ansichten für **Etappen**,
**Galerie** und **Logistik**.

- `content/` – Etappendaten und Roadbook-Inhalte
- `assets/gpx/` – GPX-Daten und Kartengrundlagen
- `web/` – Web-App, PWA, Tests und Playwright-Prüflauf
- `docs/master_ablauf_prompt_plan_v5.md` – technisches Lastenheft V5
- `docs/Balkan_Tour_Pflichtenheft_V5.md` – Produkt- und Fachanforderungen V5
- `export/` – Projektübergabe und Arbeitsstand

Das [Daily](export/ARBEITSSTAND.md) ist die einzige laufende Quelle für
aktuellen Stand, offene Entscheidungen und nächste Schritte. Frühere Pfade
unter `docs/V5/` bleiben als Verweise erhalten; die bestehenden V4-Dateien
werden nicht gelöscht.

**Dokumentierter Stand (25.11.2026):** App `v2.92.01`, Service-Worker-Cache
`v100`; 17/17 Node-Tests, Produktionsbuild und 84/84 visuelle
Playwright-Prüfungen bestanden. V5 bleibt ein Entwurf zur Nutzerfreigabe;
fachliche Routen-, Buchungs- und Datenschutzprüfungen sind davon nicht
abgenommen.

Lokale Befehle:

```bash
npm run dev --prefix web
node --test web/tests/*.test.js
npm run build --prefix web
npm run test:visual --prefix web
```

Der Visual-Prüfbericht mit Messwerten und Screenshots wird unter
`web/.visual-report/REPORT.md` erzeugt.
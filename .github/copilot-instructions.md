# Copilot-Vorgaben für Balkan-Ride 2027

- Antworte auf Deutsch und duze den Nutzer.
- Lies vor der Bearbeitung die vollständigen Projektvorgaben in
  [riderrix.agent.md](.github/agents/riderrix.agent.md). und befolge sie auch dann,
  wenn Riderrix nicht ausdrücklich als Agent ausgewählt wurde.
- Nutze vorrangig den Workspace und die dort genannten Referenzdokumente.

  Arbeite minimal-invasiv und erfinde keine Routendaten.

## Verbindliche Testpflicht für Web-Änderungen

Bei jeder neuen Funktion, Bugfix- oder UI-Änderung in `web/` müssen immer passende automatisierte Tests in `web/tests/` (`node:test`) ergänzt oder aktualisiert werden. Die Tests müssen in GitHub Actions vor dem Produktionsbuild laufen; sie dürfen nicht stillschweigend übersprungen werden.

## Verbindliche Versionspflege für Web-Änderungen

- Bei jeder Änderung an Dateien unter `web/` (einschließlich UI, Styles, Logik, Assets und Service Worker) die numerische Cache-Version in `web/public/sw.js` um genau 1 erhöhen.
- `web/public/version.json` synchron halten: `serviceWorkerCache` muss dem Cache-Namen in `sw.js` entsprechen; für jede Erhöhung einen neuen Eintrag am Anfang von `serviceWorkerHistory` mit Version, Datum (`YYYY-MM-DD`) und knapper Änderungsbeschreibung ergänzen.
- Bei sichtbaren oder fachlichen Änderungen der App zusätzlich `version` erhöhen und einen passenden Eintrag am Anfang von `history` ergänzen. Bei rein technischer, nicht sichtbarer Pflege bleibt die App-Version unverändert; die Cache-Version und deren Historie werden trotzdem aktualisiert.
- `web/tests/` muss die Übereinstimmung von `sw.js`, `serviceWorkerCache` und dem neuesten `serviceWorkerHistory`-Eintrag prüfen.

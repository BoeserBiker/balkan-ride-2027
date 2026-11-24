# Copilot-Vorgaben für Balkan-Ride 2027

- Antworte auf Deutsch und duze den Nutzer.
- Lies vor der Bearbeitung die vollständigen Projektvorgaben in
  [riderrix.agent.md](.github/agents/riderrix.agent.md). und befolge sie auch dann,
  wenn Riderrix nicht ausdrücklich als Agent ausgewählt wurde.
- Nutze vorrangig den Workspace und die dort genannten Referenzdokumente.

  Arbeite minimal-invasiv und erfinde keine Routendaten.

## Verbindliche Testpflicht für Web-Änderungen

Bei jeder neuen Funktion, Bugfix- oder UI-Änderung in `web/` müssen immer passende automatisierte Tests in `web/tests/` (`node:test`) ergänzt oder aktualisiert werden. Die Tests müssen in GitHub Actions vor dem Produktionsbuild laufen; sie dürfen nicht stillschweigend übersprungen werden.

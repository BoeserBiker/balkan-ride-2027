# Export- und Übergabedokumentation

## Zweck

Dieses Verzeichnis enthält die fortzuschreibende Projektübergabe. Maßgeblich
ist [.github/Dokumentationskonzept.md](../.github/Dokumentationskonzept.md).
`ARBEITSSTAND.md` hält den aktuellen Stand, wesentliche Entscheidungen und die
Chronologie fest; diese README erklärt Ablage, Pflege und Umzug.

## Pflege

- Vor Änderungen die vorhandene README und den Arbeitsstand lesen und
  fortschreiben.
- Nach jeder wesentlichen Projektänderung oder Analyse Datum, Ergebnis,
  Verifikation und offene Punkte im Arbeitsstand ergänzen.
- Nächste Schritte und relevante Quelldateien mit angeben.
- Keine Chatabschriften, Geheimnisse oder unnötigen personenbezogenen Daten in
  die Übergabedokumentation kopieren. Für den Gesprächsverlauf auf die
  gesonderten Dateien unter `daten/chat_verlauf/` verweisen.
- Die früheren Chat-Exporte unter `daten/chat_verlauf/` wurden am 2026-11-21
  auf Nutzerwunsch aus dem Workspace entfernt. Das Verzeichnis enthält derzeit
  keine Chat-Exporte. Die Ignore-Regeln bleiben als Schutz für mögliche
  künftige Exporte bestehen; sie sind keine Verschlüsselung.
- Bei einem Umzug den gesamten Workspace einschließlich versteckter Dateien
  prüfen. Chat-Exporte werden durch
  [`daten/chat_verlauf/.gitignore`](../daten/chat_verlauf/.gitignore) von Git
  ausgeschlossen und bei einem reinen Git-Klon nicht mitgenommen. Eine
  künftige Übertragung muss separat und geschützt erfolgen.
- Codebase-Memory ist ein externer/lokaler Index und wird durch das Kopieren der
  Workspace-Dateien nicht übertragen. Den Ziel-Workspace nach dem Umzug neu
  indizieren und den Indexstatus prüfen. Künftige Dateien unter
  `daten/chat_verlauf/` sind durch ihre `.gitignore` bewusst sowohl vom
  Git-Upload als auch von der Codebase-Memory-Indexierung ausgeschlossen.

## Dateien

- [ARBEITSSTAND.md](./ARBEITSSTAND.md) – Projektstatus, Chronologie, offene
  Punkte und Umzugs-Checkliste.
- [Chatverlauf-Inventar](../daten/chat_verlauf/README.md) – lokale
  Gesprächssicherungen und deren Einschränkungen.
- [Pflichtenheft V4](../docs/Balkan_Tour_Pflichtenheft_V4.md) – fachliche und
  technische Projektvorgaben.
- [Master-Ablaufplan V4](../docs/master_ablauf_prompt_plan_v4.md) – Agenten-
  und Automatisierungsplan.
- [To-do-Plan V4](../docs/todo_plan_v4.md) – Projektphasen und offene
  Checkliste.

# SWT Final — Teil C — Step 07: Bugfix "Plan erstellen" reagiert nicht (Web)

## Ziel

Nutzer-Report: Nach dem Fix aus Step 06 ("no_candidates") passierte beim
Tippen auf "Plan erstellen" in Schritt 3/3 des Onboardings scheinbar gar
nichts mehr — kein Fehler, kein Übergang zum Wochenplan.

## Root Cause

`OnboardingScreen.tsx` und `EinkaufslisteScreen.tsx` nutzten
`Alert.alert(...)` aus `react-native`, um Validierungs- bzw.
Verbindungsfehler anzuzeigen. **`Alert.alert` hat auf der Web-Zielplattform
(`react-native-web`, also `npm run web`) keine sichtbare Standard-
Implementierung** — der Aufruf läuft ins Leere, ohne Dialog, ohne
Konsolen-Ausgabe für den Nutzer sichtbar. Schlug also z. B. der Aufruf an
`matching-service` fehl (Service nicht gestartet, falscher Port, Netzwerk),
wurde das `catch`-Handling korrekt ausgeführt (inkl. `Alert.alert(...)` und
`setSubmitting(false)` im `finally`), aber der Nutzer sah nichts außer dem
Verschwinden des Ladeindikators — exakt das beschriebene Symptom "es
passiert nichts".

Auf iOS/Android hätte `Alert.alert` normal funktioniert; der Fehler war
also plattformspezifisch für die Web-Zielplattform, die laut Auftrag
("kein Expo Router nötig, reicht State-basierter Wechsel") und den
verwendeten `npm run web`-Tests aber ein primäres Testziel ist.

## Fix

**Entscheidung:** Alle `Alert.alert(...)`-Aufrufe in den beiden Screens
durch sichtbaren Inline-UI-Zustand ersetzt:
- `OnboardingScreen`: `errorMessage`-State, gerendert als roter Text direkt
  über dem "Weiter/Plan erstellen"-Button. Wird bei jedem neuen Versuch und
  beim Zurück-Navigieren zurückgesetzt.
- `EinkaufslisteScreen`: `showExportNotice`-State, gerendert als
  schließbares Banner unter dem Header (der Export-Button selbst ist laut
  Scope ohnehin nur ein Platzhalter, siehe Step 05).

**Begründung:** Inline-Text/Views funktionieren identisch auf allen drei
Zielplattformen (iOS, Android, Web) und sind zusätzlich einfacher zu
testen/verifizieren als ein nativer Alert-Dialog. Das ist konsistent mit
dem bereits in `App.tsx` verwendeten Muster (der App-weite Fehler-Screen
aus Step 05 nutzt ebenfalls reinen Text statt `Alert`, und funktionierte im
Screenshot des Nutzers bereits sichtbar korrekt — der Unterschied war rein,
*welche* Fehlerpfade noch `Alert.alert` nutzten).

## Verifikation

- `npm run typecheck` (root): grün über alle vier Workspaces.
- **Bundle-Inhalt geprüft statt nur "kompiliert fehlerfrei"** (Lektion aus
  Step 05 verinnerlicht): Das gebündelte JS wurde per `grep` durchsucht.
  `"Verbindung fehlgeschlagen"` (alter Alert-Titel) kommt 0× vor (korrekt
  entfernt), `"Bitte ein Alter zwischen"` und `"Tippen, um zu"` (neue
  Inline-Texte) kommen je 1× vor — die neuen Code-Pfade sind tatsächlich im
  ausgelieferten Bundle enthalten, nicht nur im Quellcode.
- End-to-End-Test (drei Profile aus Step 06) erneut gegen die live
  laufenden Services ausgeführt — weiterhin 21/21 Mahlzeiten pro Profil,
  keine Regression durch die UI-Änderung.
- `npm run test` (root): weiterhin 28/28 grün (reine UI-Änderung, keine
  Fachlogik betroffen).

## Referenzierte Requirements

REQ-001 (Onboarding muss tatsächlich abschließbar sein, nicht nur optisch
korrekt).

## Nächste Schritte laut Scope (README.md)

- REQ-008 vereinfacht: eine RLS-Policy in Supabase als Nachweis.

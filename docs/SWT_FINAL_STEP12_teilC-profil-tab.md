# SWT Final — Teil C — Step 12: Profil-Tab (read-only)

## Ziel

Letzte Ergänzung im vereinbarten Scope: ein Profil-Tab, der die
Onboarding-Angaben (REQ-001) und die daraus berechneten Makro-Werte
(REQ-002) anzeigt — reine Anzeige, kein Bearbeiten-Flow, keine neue
Backend-Route.

## Architekturentscheidungen

### 1. `OnboardingResult` um die Rohdaten erweitert, statt sie zu verwerfen

**Entscheidung:** `OnboardingScreen`s `OnboardingResult`-Interface enthält
jetzt zusätzlich `gender`, `ageYears`, `heightCm`, `weightKg`,
`activityLevel`, `goal` (vorher nur `dietType`, `allergies`, `macros`).
`App.tsx` hält diesen vollständigen Wert als `profile`-State, statt wie
bisher nur `dietType`/`allergies` separat von `macros` zu speichern.

**Begründung:** Die Werte wurden im Onboarding-Flow bereits erfasst und
zur Makro-Berechnung verwendet — sie gingen nach Abschluss bisher einfach
verloren. Für "reine Anzeige, nutzt den bereits vorhandenen App-State"
mussten sie zuerst *im* App-State ankommen, sonst hätte der Profil-Tab
einen zusätzlichen Re-Fetch oder eine zweite Zustands-Quelle gebraucht.

### 2. Gemeinsame Label-Maps statt Duplikation der Options-Arrays

**Entscheidung:** Neues Modul `src/domain/labels.ts` mit
`GENDER_LABELS`/`ACTIVITY_LABELS`/`GOAL_LABELS`/`DIET_LABELS`/
`ALLERGY_LABELS` (Enum-Wert → deutscher Anzeigetext). `ProfilScreen`
nutzt diese Maps; `OnboardingScreen`s eigene Options-Arrays (die
zusätzlich Untertitel für die Auswahl-Karten tragen) bleiben unverändert.

**Begründung:** Ohne die Maps hätte `ProfilScreen` entweder die Label-
Strings aus den Onboarding-Options-Arrays herausziehen müssen (Kopplung an
eine UI-Struktur, die für Auswahl-Karten gedacht ist, nicht für
Read-only-Zeilen) oder sie erneut inline duplizieren (Wartungsrisiko: zwei
Stellen mit denselben Übersetzungen). Eine kleine, reine Datei mit
Wert→Text-Zuordnungen ist die einfachste gemeinsame Quelle für beide
Screens.

### 3. Makro-Karte im "Tagesübersicht"-Stil (großer kcal-Wert, Makros darunter)

**Entscheidung:** Oberster Block auf dem Profil-Screen: große Kalorienzahl
(`calorieTargetKcal`) auf dunkelgrünem Hintergrund, darunter drei kleine
Makro-Werte (Protein/Fett/Kohlenhydrate in Gramm) nebeneinander, darunter
der Grundumsatz (BMR) als Kontextinfo.

**Begründung:** Exakt wie gewünscht ("ähnlich aufbereitet wie eine
Tagesübersicht"). Grüner Akzent (`colors.accentDark`, abgeleitet von
`#22C55E`) konsistent mit dem Rest der App (Onboarding-CTA, Wochenplan-
Badges).

### 4. Bottom-Nav-Tab "Profil" aktiviert

**Entscheidung:** `BottomNav.tsx`: `profile` ist jetzt Teil von
`MainScreen` (vorher nur `plan | grocery`, Profil-Tab war `enabled: false`
seit Step 05). `App.tsx` rendert `ProfilScreen` für
`activeScreen === "profile"`.

**Begründung:** Der Tab existierte bereits visuell (aus den Design-
Referenzen übernommen), war aber seit dem ersten Mobile-Schritt inert.
Jetzt hat er tatsächlich Inhalt.

## Verifikation

- `npm run typecheck` / `npm run test` (root): weiterhin grün über alle
  vier Workspaces (37/37 Tests — reine UI-/State-Änderung, keine
  Fachlogik in den Services betroffen).
- Bundle-Inhalt geprüft (`grep` auf "Deine Angaben aus dem Onboarding",
  "kcal Tagesziel", "Grundumsatz" im ausgelieferten Metro-Bundle) — alle
  drei vorhanden, Lektion aus Step 05/07 weiterhin angewendet.
- Eigenständiges Skript geprüft, dass `labels.ts` für **jeden** möglichen
  Enum-Wert (2 Geschlechter, 5 Aktivitätslevel, 3 Ziele, 3 Diät-Typen, 7
  Allergene) tatsächlich ein Label liefert — verhindert, dass der
  Profil-Screen für einen Onboarding-Wert `undefined` anzeigt.

## Referenzierte Requirements

REQ-001 (angezeigte Onboarding-Daten), REQ-002 (angezeigte Makro-Werte).

## Scope-Status

Mit diesem Schritt ist der für diese Abgabe vereinbarte Scope
(README.md-Tabelle: REQ-001–005 voll, REQ-008 vereinfacht) inklusive
dieser Zusatz-Anzeige abgeschlossen. Keine weiteren Features geplant
(REQ-006/009/010 bleiben Roadmap-only).

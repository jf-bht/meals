# SWT Final — Teil C — Step 08: Bugfix — Wochenplan zeigt 21× dasselbe Rezept

## Ziel

Nutzer-Report (Screenshot): Nach dem Fix aus Step 07 lief das Onboarding
durch, aber der Wochenplan zeigte für **jede** der 21 Mahlzeiten dasselbe
Rezept ("Rindersteak mit Ofengemüse").

## Root Cause

Für Profile mit hohem Kalorienbedarf pro Mahlzeit (hier: 850 kcal-Ziel)
erfüllte im Demo-Pool **nur ein einziges Rezept** (`r-14`) die ±15 %-
Kalorien-Toleranz. Die Eskalationsreihenfolge aus Step 06 war:

1. Makros streng + 5-Tage-Sperre aktiv
2. **5-Tage-Sperre ignorieren**, Makros streng
3. Sperre ignorieren + Makros lockern

Nach dem ersten Treffer auf `r-14` blockierte die 5-Tage-Sperre bei jedem
weiteren Slot Stufe 1 (r-14 ist "recent"). Stufe 2 wurde ausgelöst — aber
Stufe 2 ignoriert genau die Sperre, die verhindert hätte, dass wieder
dasselbe Rezept gewählt wird. Da weiterhin nur `r-14` die Kalorien-Toleranz
erfüllte, blieb es bei genau einem Kandidaten → `weightedPick` wählte ihn
deterministisch, jedes Mal. Die 5-Tage-Sperre konnte bei einer
Kandidatenmenge der Größe 1 nie etwas bewirken — sie ist nur wirksam, wenn
es *mehrere* Kandidaten gibt, aus denen ohne den zuletzt verwendeten
ausgewählt werden kann.

## Fix

**Entscheidung:** Reihenfolge der Eskalationsstufen in
`apps/mobile/src/domain/weekPlan.ts` vertauscht:

1. Makros streng + 5-Tage-Sperre aktiv (unverändert)
2. **Makros lockern (`relaxMacros: true`), 5-Tage-Sperre bleibt aktiv**
3. Nur wenn selbst das erschöpft ist: zusätzlich Sperre ignorieren

**Begründung:** "Variabilität vor Makro-Genauigkeit" — REQ-003 nennt
"Variabilität ohne Wiederholung" explizit als Zweck der gewichteten
Zufallsauswahl. Ein Wochenplan mit 21× demselben Gericht ist für den
Nutzer offensichtlich unbrauchbar, auch wenn die Kalorien exakt passen.
Indem die Makro-Toleranz *vor* der Wiederholungssperre gelockert wird,
steht in Stufe 2 der komplette Diät/Allergie-kompatible Rezept-Pool als
Kandidatenmenge zur Verfügung (nur die zuletzt verwendeten Rezepte bleiben
gesperrt) — die 5-Tage-Sperre kann dadurch tatsächlich greifen, weil es
wieder mehrere Kandidaten gibt, zwischen denen sie unterscheiden kann.

## Verifikation

- `npm run typecheck` / `npm run test` (root): weiterhin grün (reine
  Reihenfolge-Änderung in bestehender, bereits getesteter Logik —
  `matchesMacros`/`relaxMacros` selbst unverändert).
- **Gezielter Vielfalts-Test** mit exakt dem Profil-Typ aus dem Bug-Report
  (95 kg, sehr aktiv, Ziel Muskelaufbau → 4708,6 kcal/Tag,
  ≈1569,5 kcal/Mahlzeit) gegen die live laufenden Services: 21 generierte
  Mahlzeiten enthalten jetzt **14 von 14 möglichen Rezepten** (alle
  Diät-kompatiblen Pool-Einträge kommen vor, die meisten genau 1–2×),
  gegenüber vorher 1 von 14.

## Referenzierte Requirements

REQ-003 ("Variabilität ohne Wiederholung", 5-Tage-Sperre), REQ-004
(Wochenplan muss praktisch nutzbar sein).

## Nächste Schritte laut Scope (README.md)

- REQ-008 vereinfacht: eine RLS-Policy in Supabase als Nachweis.

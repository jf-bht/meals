# SWT Final — Teil C — Step 15: Mahlzeit-Swap (REQ-009)

## Ziel

REQ-009 wurde in der README-Scope-Tabelle ursprünglich als "Geplant, nicht
implementiert" eingestuft. Auf expliziten Wunsch nachträglich umgesetzt:
"Der Nutzer kann einzelne Mahlzeiten im Wochenplan gegen Alternativen aus
dem Rezept-Pool tauschen, ohne den gesamten Plan neu zu generieren. Die
Einkaufsliste aktualisiert sich dabei automatisch."

## Architekturentscheidungen

### 1. Swap-Button im Rezept-Detail-Modal, nicht direkt auf der Karte

**Entscheidung:** Der "Diese Mahlzeit tauschen ⇄"-Button sitzt im
`RecipeDetailModal` (Step 13) als neuer optionaler `onSwap`-Prop, nicht als
zusätzliches Icon direkt auf der Wochenplan-Karte.

**Begründung:** Der Nutzer sieht im Moment des Tauschens bereits das volle
Rezept (Makros, Zutaten) — eine informierte Entscheidung "will ich das
wirklich tauschen" ist im Detail-Kontext sinnvoller als ein Icon auf der
kompakten Übersichtskarte. `onSwap` ist optional, damit derselbe Modal-
Code im `HomeScreen`-Katalog (kein Plan-Bezug, dort ohne Swap-Möglichkeit)
weiter funktioniert.

### 2. `matchWithEscalation` als gemeinsame Funktion für Generierung und Swap

**Entscheidung:** Die dreistufige Eskalationslogik (Makros lockern → Sperre
ignorieren, siehe Step 06/08) wurde aus `generateWeekPlan` in eine
gemeinsame Funktion `matchWithEscalation` extrahiert, die jetzt auch
`swapMeal` nutzt.

**Begründung:** Ohne die Extraktion hätte `swapMeal` dieselbe drei-stufige
Fallback-Logik ein zweites Mal duplizieren müssen. Ein neuer Parameter
`guaranteedExclude` sorgt dafür, dass auch die letzte (großzügigste)
Eskalationsstufe das zu tauschende Rezept nie zurückgibt — "tauschen"
impliziert per Definition ein anderes Ergebnis.

### 3. Ausschluss-Menge beim Swap: eigenes Rezept + Mahlzeiten im 5-Tage-Fenster

**Entscheidung:** `swapMeal` schließt (a) das aktuell zu tauschende Rezept
immer aus (garantiert, auch im Fallback) und (b) alle anderen Mahlzeiten
im Plan, deren Tag innerhalb von 5 Tagen um den zu tauschenden Tag liegt
(`Math.abs(m.day - mealToReplace.day) < NO_REPEAT_DAYS`) — in beide
Zeitrichtungen, nicht nur rückwärts wie bei der ursprünglichen
Plan-Generierung.

**Begründung:** Die REQ-003-Wiederholungssperre soll auch nach einem Swap
gelten. Bei der initialen Generierung reicht eine rückwärtsgerichtete
Prüfung (Tage werden sequenziell aufgebaut), beim Swap eines beliebigen
Tages muss symmetrisch in beide Richtungen geprüft werden (ein Tausch am
Mittwoch darf nicht versehentlich ein Rezept vom Freitag derselben Woche
duplizieren).

### 4. Plan-State-Update: nur der eine Slot, dann Einkaufsliste neu laden

**Entscheidung:** `App.tsx`s `handleSwapMeal` ersetzt in `meals` gezielt nur
den einen Eintrag (`day` + `mealType`-Match) und ruft danach
`loadGroceryList` mit dem aktualisierten Array erneut auf — der Rest des
Wochenplans bleibt unverändert im State.

**Begründung:** Exakt die REQ-009-Vorgabe ("ohne den gesamten Plan neu zu
generieren", "Einkaufsliste aktualisiert sich automatisch"). Da
`loadGroceryList` bereits die tatsächlichen (ggf. skalierten)
`ingredientsPerPortion` aus jedem `meal.recipe` verwendet (Step 09), ist
kein Sonderfall für "nur ein Rezept hat sich geändert" nötig — die
komplette Liste wird aus dem aktuellen `meals`-Array neu aggregiert.

## Verifikation

- `npm run typecheck` / `npm run test` (root): weiterhin grün, 37/37 Tests
  (Refactoring von `generateWeekPlan` auf die gemeinsame
  `matchWithEscalation`-Funktion ändert das beobachtbare Verhalten nicht).
- Bundle-Inhalt geprüft (`grep` auf "Diese Mahlzeit tauschen" im
  ausgelieferten Metro-Bundle) — vorhanden.
- **End-to-End-Test** gegen die live laufenden Services:
  - Tausch einer Mittagsmahlzeit liefert garantiert ein anderes Rezept
    (`newRecipe.id !== mealToReplace.recipe.id`), weiterhin korrekt als
    `lunch` getaggt.
  - Die aus dem aktualisierten Plan neu generierte Einkaufsliste enthält
    das neue Rezept.
  - Ein zweiter, unmittelbar folgender Tausch derselben Mahlzeit liefert
    wieder ein drittes, unterschiedliches Rezept (nicht das ursprüngliche
    oder das erste Tausch-Ergebnis) — bestätigt, dass die
    Ausschluss-Logik über mehrere Tausch-Vorgänge hinweg korrekt bleibt.

## Referenzierte Requirements

REQ-009 (Kernanforderung dieses Schritts, jetzt implementiert statt
Roadmap-only), REQ-003 (Wiederholungssperre gilt weiterhin), REQ-005
(Einkaufsliste aktualisiert sich automatisch).

## Scope-Status

README.md-Status für REQ-009 sollte von "Geplant, nicht implementiert" auf
"Wird implementiert" geändert werden (folgt in einem separaten
README-Update, falls gewünscht).

# SWT Final — Teil C — Step 13: Rezept-Detail-Modal im Wochenplan

## Ziel

Letzter Zusatz für diesen Arbeitstag: Rezept-Karten im Wochenplan-Screen
klickbar machen. Tap öffnet ein Bottom-Sheet-Modal mit vollständigem
Rezept — Zutatenliste (Menge + Einheit), Kalorien/Makros,
Zubereitungszeit.

## Architekturentscheidungen

### 1. `prepTimeMinutes` neu im Rezept-Schema (matching-service)

**Entscheidung:** `Recipe` bekommt ein `prepTimeMinutes: number`-Feld; alle
15 Pool-Einträge sind mit plausiblen Werten (5–40 Min) befüllt.

**Begründung:** Die Zubereitungszeit war bisher nirgends im Datenmodell —
weder REQ-003 noch REQ-005 brauchten sie. Für die Rezept-Detailanzeige
(dieser Schritt) ist sie explizit gefordert, also am naheliegendsten direkt
am Rezept im `matching-service` ergänzt, wo auch Name/Makros/Zutaten
liegen.

### 2. Kein erneuter `GET /v1/recipes/:id`-Aufruf — bewusste Abweichung von der Vorgabe

**Problem:** Die Aufgabenstellung nannte explizit den vorhandenen `GET
/v1/recipes/:id`-Endpoint als Datenquelle für das Detail-Modal. Dieser
Endpoint liefert aber immer die **unskalierte Basis-Portion** direkt aus
`RECIPE_POOL` (`RECIPE_POOL.find(...)`, siehe `matching-service/src/
index.ts`) — nicht die für die jeweilige Mahlzeit tatsächlich verwendete,
ggf. über die Kohlenhydrat-Quelle skalierte Menge (`portionScaling.ts`,
Step 09).

**Entscheidung:** Das Detail-Modal verwendet stattdessen das Rezept-Objekt,
das bereits über `POST /v1/recipes/match` im Wochenplan geladen wurde
(`meal.recipe` — vollständig, inkl. `prepTimeMinutes`, das durch
`scaleRecipeToTarget`s Objekt-Spread unverändert durchgereicht wird). Kein
zusätzlicher Netzwerk-Aufruf nötig, keine Ladezeit im Modal.

**Begründung:** Ein Aufruf des GET-Endpoints hätte exakt das
Konsistenzproblem reproduziert, das in Step 09 für die Einkaufsliste bereits
gelöst wurde: Der Wochenplan würde z. B. "240g Couscous" zeigen (skaliert
auf ein hohes Kalorienziel), das Detail-Modal aber "80g Couscous" (Pool-
Basiswert) — für dieselbe Mahlzeit am selben Tag. Das wäre verwirrender als
gar keine Detailansicht. Die Vorgabe "keine neue Backend-Route nötig" ist
mit der gewählten Lösung sogar noch direkter erfüllt: Es gibt nicht einmal
einen *wiederverwendeten* Request beim Öffnen des Modals, weil die Daten
bereits lokal vorliegen.

### 3. Bottom-Sheet statt Vollbild-Screen

**Entscheidung:** `RecipeDetailModal` nutzt React Natives `Modal`
(`animationType="slide"`, `transparent`) mit einem von unten hochfahrenden
Sheet (max. 80 % Bildschirmhöhe) statt eines eigenen `AppState`-Werts in
`App.tsx`.

**Begründung:** Passt zum bestehenden Muster "einfacher State-Wechsel statt
Navigation-Library" (Step 05) — ein Modal-Overlay ist die native React-
Native-Grundfunktion dafür und braucht keine zusätzliche State-Maschine
oder Navigation-Bibliothek. Bottom-Sheet-Optik ist zudem der
Design-Sprache der anderen Screens (abgerundete Karten, viel Weißraum)
näher als ein Vollbild-Übergang.

## Verifikation

- `npm run typecheck` / `npm run test` (root): weiterhin grün, 37/37 Tests
  (reine Datenmodell-Ergänzung + UI, keine Änderung an Filter-/Auswahl-
  /Skalierungslogik).
- Bundle-Inhalt geprüft (`grep` auf "Zutaten (1 Portion)" im
  ausgelieferten Metro-Bundle) — vorhanden.
- **End-to-End-Test** (High-Kalorien-Profil, dasselbe wie in Step 09) gegen
  die live laufenden Services: Alle 21 Mahlzeiten haben `prepTimeMinutes`
  gesetzt; ein Beispiel-Rezept ("Feta-Ofengemüse mit Couscous") zeigt im
  Detail exakt die skalierte Couscous-Menge (240g statt Basis-80g) — genau
  konsistent mit dem, was auch die Einkaufsliste für diese Mahlzeit zeigen
  würde. Bestätigt, dass die Entscheidung aus Punkt 2 keine Dateninkonsistenz
  einführt.

## Referenzierte Requirements

REQ-003 (Rezept-Daten inkl. Zutaten, jetzt erweitert um Zubereitungszeit),
REQ-004 (Wochenplan-Interaktion).

## Scope-Status

Letzter Zusatz für diesen Arbeitstag (laut Nutzer-Vorgabe). Der in
README.md vereinbarte Scope (REQ-001–005 voll, REQ-008 vereinfacht) bleibt
unverändert; REQ-006/009/010 weiterhin Roadmap-only.

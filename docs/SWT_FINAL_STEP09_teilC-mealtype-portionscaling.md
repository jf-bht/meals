# SWT Final — Teil C — Step 09: Mahlzeiten-Typ-Filter & Portions-Skalierung

## Ziel

Nutzer-Feedback nach dem funktionierenden Wochenplan: (1) Frühstücke sollten
tatsächlich Frühstücksrezepte sein (nicht z. B. "Rindersteak"), (2) Rezepte
sollten unterschiedlich groß portioniert werden können (z. B. 200g vs. 300g
Reis), insbesondere über die Kohlenhydrat-Quelle, weil sich darüber
Kalorienziele präzise treffen lassen, ohne den Protein-/Fett-Bedarf aus
REQ-002 zu verzerren.

## Architekturentscheidungen

### 1. `mealTypes` als Rezept-Attribut, Filterung im matching-service

**Entscheidung:** Jedes Rezept im Pool bekommt `mealTypes: MealType[]`
(`"breakfast" | "lunch" | "dinner"`). `MatchInput` bekommt ein optionales
`mealType`-Feld; `filterCandidates` schließt Rezepte aus, deren
`mealTypes` das angefragte `mealType` nicht enthalten. Drei Rezepte sind
aktuell als `breakfast` getaggt (Gemüse-Omelett, Overnight Oats, neu: Quark
mit Müsli und Apfel — extra ergänzt, weil zwei Optionen für 7
Frühstücke/Woche zu wenig Varianz geboten hätten), elf als `lunch`+`dinner`.

**Begründung:** Realistische Einschränkung direkt an der Datenquelle
(Rezept-Metadaten) statt einer Sonderregel in der Auswahl-Logik. Der
Mobile-Client übergibt beim Generieren des Wochenplans (`weekPlan.ts`) das
`mealType` passend zum Slot — dieselbe Eskalationslogik (Makros lockern →
Sperre ignorieren) greift weiterhin, aber **innerhalb** der für diese
Mahlzeit erlaubten Rezepte.

### 2. Portions-Skalierung nur über die Kohlenhydrat-Quelle, nicht das ganze Rezept

**Entscheidung:** Neues Modul `portionScaling.ts`: `scaleRecipeToTarget`
identifiziert die Kohlenhydrat-Zutat eines Rezepts (über eine kleine
Dichte-Tabelle kcal/g und Kohlenhydrat-g/g für Reis, Kartoffel,
Süßkartoffel, Couscous, Quinoa, Vollkornbrot, Haferflocken, Müsli) und
passt **nur deren Menge** an, um die Rezept-Kalorien näher an das
Pro-Mahlzeit-Ziel zu bringen. Protein-/Fett-Zutaten (Fleisch, Fisch, Tofu,
Ei, Öl) bleiben unverändert.

**Begründung:** Exakt der vom Nutzer genannte Grund — REQ-002 legt Protein
(kg×1,5) und Fett (kg×1,0) fest an das Körpergewicht gekoppelt fest;
Kohlenhydrate sind explizit "der Rest". Würde man die Protein-Quelle
mitskalieren (z. B. 300g statt 200g Steak), würde die Proteinzufuhr über
das REQ-002-Ziel hinausschießen. Die Kohlenhydrat-Quelle ist der einzige
Bestandteil, der frei skaliert werden kann, ohne die REQ-002-Logik zu
unterlaufen — dieselbe "Kohlenhydrate = Rest"-Idee wird hier nur von der
Tagesebene auf die Rezept-Ebene heruntergebrochen.

Grenzen (bewusst gesetzt, in `portionScaling.ts` benannt): Menge wird auf
20–400 g und maximal 0,3×–3× der Basismenge geklammert, damit z. B. kein
"5 kg Reis" oder "kein Reis mehr" entsteht. Rezepte ohne erkannte
Kohlenhydrat-Quelle (z. B. Linsen-Curry — die Kohlenhydrate stecken in den
Linsen selbst, keine separat skalierbare Zutat) bleiben unverändert.

### 3. Skalierung erfolgt *nach* der gewichteten Auswahl, nicht davor

**Entscheidung:** `matchRecipe` wählt zuerst wie bisher über
`filterCandidates` + `weightedPick` (Kalorien-Toleranz, Makro-Nähe), und
skaliert erst danach das gewählte Rezept.

**Begründung:** Die ±15 %-Filterung soll weiterhin dafür sorgen, dass nur
grundsätzlich passende Rezepte in Frage kommen (kein Frühstücks-Porridge
wird zum 1500-kcal-Steak-Dinner hochskaliert) — die Skalierung verfeinert
nur die Portionsgröße des bereits sinnvoll ausgewählten Rezepts, ersetzt
aber nicht die Auswahl-Logik.

### 4. Einkaufsliste muss die skalierten Mengen zeigen — Kontraktänderung in grocery-service

**Problem, das dabei auffiel:** `grocery-service` lud Zutaten bisher per
`GET /v1/recipes/:id` erneut vom `matching-service` — das liefert die
**unskalierte Basis-Menge**, nicht die im Wochenplan tatsächlich verwendete
skalierte Menge. Die Einkaufsliste hätte sonst z. B. "80g Reis" gezeigt,
während der Plan tatsächlich "250g Reis" vorsah.

**Fix:** `WeekPlanRequestEntry` in `grocery-service` bekommt ein optionales
`ingredientsPerPortion`-Feld. Ist es gesetzt, verwendet `buildGroceryList`
diese Mengen direkt und ruft `matching-service` für diese ID gar nicht
mehr auf; ist es nicht gesetzt, bleibt das alte Verhalten (Fetch per ID)
als Fallback erhalten (z. B. für direkte API-Tests ohne Mobile-Client).
Der Mobile-Client (`App.tsx`) schickt jetzt immer die tatsächlichen
`ingredientsPerPortion` aus dem gematchten Rezept mit.

**Begründung:** Das ist dieselbe REST-Grenze wie in Step 04 (kein Import
zwischen den Services), nur erweitert: Der Aufrufer (hier: Mobile-App) hat
bereits die maßgeblichen Daten und muss sie nicht künstlich über eine
erneute REST-Anfrage rekonstruieren lassen, die den entscheidenden Kontext
(die Skalierung) gar nicht kennen kann.

## Verifikation

- `npm run test` (root): 37/37 Tests grün (26 matching-service inkl. 7 neue
  für `portionScaling.ts` und 1 für `mealType`-Filterung via bestehende
  Struktur, 11 grocery-service inkl. 2 neue für den Inline-Zutaten-Pfad).
- `npm run typecheck` (root): grün über alle vier Workspaces.
- **End-to-End-Test** (großes/very_active/gain-Profil, ~1570 kcal/Mahlzeit)
  gegen die live laufenden Services über den echten App-Code:
  - Alle 7 Frühstücke sind aus der Menge der drei getaggten
    Frühstücksrezepte (0 Fehltreffer).
  - Kohlenhydrat-Quellen wurden sichtbar hochskaliert (z. B. Müsli 150g,
    Quinoa 210g, Haferflocken 180g, Vollkornreis 240g — Basiswerte lagen
    bei 50–90g), Protein-/Fett-Zutaten unverändert.
  - Die generierte Einkaufsliste zeigt die tatsächlich skalierte
    Gesamtmenge (z. B. 960g Reis über die Woche aggregiert), nicht die
    Basis-Portionsgrößen.

## Referenzierte Requirements

REQ-002 (Kohlenhydrate = Rest — jetzt auch auf Rezept-Ebene angewendet),
REQ-003 (Rezept-Matching), REQ-004 (Wochenplan, 3 Mahlzeiten/Tag —
jetzt mit korrektem Mahlzeiten-Bezug), REQ-005 (Einkaufsliste muss den
tatsächlichen Plan widerspiegeln).

## Nächste Schritte laut Scope (README.md)

- REQ-008 vereinfacht: eine RLS-Policy in Supabase als Nachweis.

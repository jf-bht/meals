# SWT Final — Teil C — Step 04: Einkaufsliste generieren (REQ-005)

## Ziel

Erste Business-Logik im `grocery-service`: aus einem Wochenplan (Liste von
Rezept-IDs + Portionsanzahl) wird eine nach Kategorie gruppierte
Einkaufsliste erzeugt. Zutatendaten liegen im `matching-service` (dort sind
auch die Rezepte definiert) — `grocery-service` muss sie sich per REST
holen. Dieser Schritt ist damit der erste **echte Beleg für die
Modul-Trennung** aus Teil C: zwei unabhängige Prozesse tauschen über HTTP
Daten aus, ohne Code oder DB zu teilen.

## Architekturentscheidungen

### 1. Zutaten leben im matching-service, nicht dupliziert im grocery-service

**Entscheidung:** `Recipe.ingredientsPerPortion` wird im `matching-service`
ergänzt (dort, wo auch der Rezept-Pool liegt). Ein neuer Endpoint
`GET /v1/recipes/:id` exponiert ein einzelnes Rezept inkl. Zutaten.

**Begründung:** Rezeptdaten (Name, Makros, Zutaten) sind eine fachliche
Einheit — sie in zwei Services zu pflegen wäre Datenduplikation mit
Drift-Risiko. Der `grocery-service` bekommt stattdessen nur das, was er für
REQ-005 braucht, über eine klar begrenzte REST-Schnittstelle.

### 2. grocery-service validiert die Fremd-Response strukturell mit Zod statt zu importieren

**Entscheidung:** `matchingClient.ts` definiert ein eigenes,
minimales Zod-Schema (`RemoteRecipeSchema` — nur `id` und
`ingredientsPerPortion`), gegen das die HTTP-Response geparst wird. Es gibt
**keinen** Import aus `services/matching-service` und kein
`packages/shared`.

**Begründung:** Das ist der Kern der in Step 01 begründeten Modul-Trennung:
"kein Service importiert Code vom anderen". Ein Zod-Schema an der
Systemgrenze macht das robust — wenn der `matching-service` seine Antwort
später erweitert (z. B. um Nährwert-Tags), bricht der `grocery-service`
nicht, weil Zod unbekannte Felder ignoriert und nur die für REQ-005
relevanten Felder prüft.

### 3. Aggregation über (normalisierter Name + Einheit), keine Einheiten-Umrechnung

**Entscheidung:** Zutaten werden zusammengeführt, wenn Name (lowercase,
getrimmt) *und* Einheit übereinstimmen. Gleicher Name mit unterschiedlicher
Einheit (z. B. "Zwiebel" in `Stück` vs. `g`) bleibt bewusst ein separater
Posten.

**Begründung:** REQ-005 fordert "aggregiert, normalisiert" — eine
Normalisierung über verschiedene Einheiten hinweg (z. B. Stück → Gramm)
würde Produktdichte-/Größendaten benötigen, die es im MVP nicht gibt. Eine
falsche Umrechnung wäre schlimmer als zwei getrennte Zeilen auf der
Einkaufsliste. Das ist eine bewusste, dokumentierte Vereinfachung.

### 4. Kategorisierung über eine feste Lookup-Tabelle, mit "other" als Fallback

**Entscheidung:** `CATEGORY_BY_INGREDIENT` in `groceryList.ts` bildet
bekannte Zutatennamen auf `produce | protein | dairy | grains | pantry` ab;
unbekannte Namen fallen auf `other`, statt einen Fehler zu werfen.

**Begründung:** REQ-005 fordert Gruppierung "nach Kategorie". Ohne
Supabase-Anbindung (Kategorie wäre sonst ein DB-Feld pro Zutat) ist eine
feste Tabelle die einfachste Lösung, die den vorhandenen Beispiel-Pool aus
Step 03 vollständig abdeckt. Der `other`-Fallback verhindert, dass ein neues,
unbekanntes Rezept die gesamte Einkaufslisten-Generierung zum Absturz
bringt — bewusst fehlertolerant statt strikt.

### 5. Rezepte werden pro eindeutiger ID nur einmal geladen (Meal-Prep-Fall)

**Entscheidung:** `buildGroceryList` dedupliziert `recipeId`s aus dem
Wochenplan, bevor es REST-Aufrufe an den `matching-service` macht.

**Begründung:** Laut [Constitution/roadmap.md](../Constitution/roadmap.md)
kocht der Nutzer typischerweise für mehrere Tage vor (Meal Prep, z. B.
Sonntag für Mo+Di). Ohne Deduplizierung würde dasselbe Rezept mehrfach über
das Netzwerk geladen — unnötiger Overhead bei identischem Ergebnis. Ein Test
(`ruft dieselbe Rezept-ID nur einmal ab`) belegt das Verhalten.

### 6. Fehler vom matching-service werden differenziert durchgereicht

**Entscheidung:** `404` (Rezept existiert nicht) wird als `404` mit
`recipeId` durchgereicht; jeder andere Fehlerstatus vom `matching-service`
wird als `502 matching_service_unavailable` gemeldet.

**Begründung:** Macht sichtbar, *warum* die Einkaufsliste nicht generiert
werden konnte — fachlicher Fehler (Rezept-ID falsch) vs. Infrastruktur-Fehler
(anderer Service nicht erreichbar) sind für den Aufrufer (später: Mobile
App) unterschiedlich behandelbar.

## Verifikation

- `npm run test` im `grocery-service`-Workspace: 9/9 Tests grün — 6 für die
  reine Aggregations-/Kategorisierungslogik (`groceryList.test.ts`, ohne
  Netzwerk), 3 für die Orchestrierung mit injizierter Fake-`fetchRecipe`
  (`matchingClient.test.ts`, inkl. Deduplizierung und Fehler-Propagation).
- `npm run test` im `matching-service`-Workspace: weiterhin 18/18 grün (neue
  `ingredientsPerPortion`-Felder haben nichts an der bestehenden Logik
  verändert).
- `npm run typecheck` (root, über Turborepo): grün über alle drei
  Workspaces.
- **Echter Cross-Service-Test:** Beide Services parallel gestartet
  (`matching-service` :3001, `grocery-service` :3002). `POST
  /v1/grocery-list` mit einem Wochenplan, der `r-01` (2× + 1× = Meal Prep)
  und `r-08` referenziert, liefert eine korrekt aggregierte, nach Kategorie
  gruppierte Liste (z. B. Hähnchenbrust 150 g × 3 Portionen = 450 g).
  Eine unbekannte `recipeId` liefert korrekt `404`, durchgereicht vom
  `matching-service` über den `grocery-service` bis zur Response.

## Referenzierte Requirements

REQ-003 (liefert Rezepte inkl. Zutaten als Eingabe), REQ-005
(Kernanforderung dieses Schritts).

## Nächste Schritte laut Scope (README.md)

- REQ-001 (Onboarding) und REQ-004 (Wochenplan-Anzeige) in `apps/mobile`,
  um den End-to-End-Durchlauf Onboarding → Matching → Wochenplan →
  Einkaufsliste vollständig zu schließen.
- REQ-008 vereinfacht: eine RLS-Policy in Supabase als Nachweis.

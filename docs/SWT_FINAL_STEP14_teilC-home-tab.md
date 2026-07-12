# SWT Final — Teil C — Step 14: Home-Tab mit Rezept-Pool-Übersicht

## Ziel

Letzter (echter) Zusatz: Home-Tab (bisher seit Step 05 inert) mit
zentralem Logo oben und einer Übersicht über den gesamten Rezept-Pool
darunter, gruppiert nach Frühstück / Mittag & Abend. Tap auf ein Rezept
öffnet das bereits vorhandene Detail-Modal (Step 13).

## Vorüberlegung: neuer Endpoint vs. Client-seitige ID-Iteration

Vor der Umsetzung stand die Frage im Raum, ob ein neuer
`GET /v1/recipes`-Endpoint nötig ist, oder ob der Client stattdessen
`GET /v1/recipes/:id` in einer Schleife über bekannte IDs (`r-01`…`r-15`)
aufrufen könnte, um denselben Endpoint wiederzuverwenden.

**Entscheidung: neuer, minimaler Collection-Endpoint.**

**Begründung:** Eine ID-Schleife hätte den Mobile-Client an ein internes
Implementierungsdetail von `matching-service` gekoppelt (exaktes
ID-Schema und -Anzahl des Pools) — genau die Art Kopplung, die in dieser
Session mehrfach bewusst vermieden wurde (siehe z. B. Step 04/09: keine
Imports zwischen Services, eigenständige Zod-Verträge statt geteilter
Typen). Wächst der Pool oder ändert sich das ID-Schema (z. B. später
Supabase-UUIDs), würde der Client-Loop lautlos falsch laufen oder
mühsam synchron gepflegt werden müssen. Der neue Endpoint ist zudem
trivial (eine Zeile: `return RECIPE_POOL`) und spart gegenüber der
Schleife 14 von 15 HTTP-Requests.

## Architekturentscheidungen

### 1. `GET /v1/recipes` liefert den kompletten Pool ungefiltert

**Entscheidung:** Kein Query-Parameter, keine Paginierung — der Pool hat
15 Einträge, das rechtfertigt aktuell keine zusätzliche Komplexität.

**Begründung:** Bewusst minimal für den aktuellen Pool-Umfang; bei einem
über Supabase geladenen, deutlich größeren Bestand wäre Paginierung der
nächste Schritt, aber das würde den heutigen Scope sprengen.

### 2. HomeScreen zeigt die unskalierte Basis-Portion, nicht plan-bezogen

**Entscheidung:** Anders als der Wochenplan (Step 09/13) ist der Home-Tab
nicht an eine konkrete Mahlzeit im aktuellen Plan gebunden — er zeigt den
Rezept-Pool an sich. Das Detail-Modal zeigt hier deshalb konsistent die
Basis-Portion aus `RECIPE_POOL`, nicht skaliert.

**Begründung:** Es gibt hier keine "richtige" skalierte Menge, die man
stattdessen zeigen könnte — Skalierung ist immer relativ zu einem
konkreten Kalorienziel einer bestimmten Mahlzeit. Der Home-Tab ist ein
allgemeiner Katalog, kein Plan-Bezug; die Inkonsistenz-Gefahr aus Step 13
besteht hier nicht, weil es keine "richtige" Menge gibt, mit der man
vergleichen könnte.

### 3. Sektionen nach Mahlzeiten-Typ statt flacher Liste

**Entscheidung:** Zwei Abschnitte ("Frühstück", "Mittag- & Abendessen")
statt einer einzigen Liste oder drei separaten Abschnitten
(Frühstück/Mittag/Abend).

**Begründung:** `lunch` und `dinner` überlappen im Pool fast vollständig
(11 von 12 Nicht-Frühstücks-Rezepten sind für beide getaggt) — drei
Abschnitte hätten die relevanten Rezepte großteils doppelt gelistet. Zwei
Abschnitte spiegeln die tatsächliche Datenstruktur des Pools genauer.

## Verifikation

- `npm run typecheck` / `npm run test` (root): weiterhin grün, 37/37 Tests.
- Live-Test: `GET /v1/recipes` liefert alle 15 Rezepte (`r-01`…`r-15`) mit
  vollständigen Feldern.
- Bundle-Inhalt geprüft (`grep` auf "Rezept-Pool" und "Mittag- &
  Abendessen" im ausgelieferten Metro-Bundle) — beide vorhanden.

## Referenzierte Requirements

REQ-003 (Rezept-Pool als Datenquelle, jetzt zusätzlich als Übersicht
zugänglich).

## Scope-Status

Home-Tab war der letzte offene Punkt aus der Bottom-Nav (seit Step 05
inert). Damit sind alle vier Tabs (Home, Plan, Liste, Profil) funktional.

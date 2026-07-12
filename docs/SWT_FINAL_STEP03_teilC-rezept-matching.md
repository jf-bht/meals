# SWT Final — Teil C — Step 03: Rezept-Matching (REQ-003)

## Ziel

Zweite Business-Logik-Komponente im `matching-service`: aus einem
Rezept-Pool wird — basierend auf Diät-Typ, Allergien, Makro-Zielen (aus
Step 02 / REQ-002) und zuletzt verwendeten Rezepten — ein passendes Rezept
per gewichteter Zufallsauswahl ermittelt.

## Architekturentscheidungen

### 1. In-Memory-Rezept-Pool statt Supabase-Anbindung

**Entscheidung:** `src/recipes.ts` enthält einen festen `RECIPE_POOL` mit 10
Beispielrezepten (verschiedene Diät-Typen, Allergene, Makro-Profile) statt
eines DB-Zugriffs.

**Begründung:** Supabase ist laut Roadmap noch nicht angebunden (kommt mit
REQ-008/DSGVO-Umsetzung). Den Matching-Algorithmus jetzt schon von einer
konkreten DB-Anbindung zu entkoppeln, macht die Kernlogik unit-testbar ohne
Netzwerk/DB und lässt den Pool später 1:1 durch eine Supabase-Query ersetzen,
ohne `matching.ts` anzufassen — der Pool wird als Parameter durchgereicht
(`matchRecipe(input, pool)`), nicht global fest verdrahtet.

### 2. Diät-Typ-Hierarchie statt exakter Gleichheit

**Entscheidung:** `vegan ⊂ vegetarian ⊂ omnivore` — ein omnivorer Nutzer darf
auch vegetarische/vegane Rezepte bekommen, ein veganer Nutzer nur vegane.

**Begründung:** REQ-003 sagt nur "Filterung nach Diät-Typ", ohne die
Kompatibilitätsregel zu spezifizieren. Eine exakte Gleichheits-Filterung
(z. B. omnivore Nutzer bekommt *nur* omnivore Rezepte) würde den nutzbaren
Rezept-Pool für Fleischesser künstlich verkleinern, obwohl vegetarische/vegane
Rezepte für sie unproblematisch sind. Diese Hierarchie ist eine begründete
Annahme, dokumentiert in `matching.ts` (`ALLOWED_RECIPE_DIETS`).

### 3. ±15 % Toleranz auf alle vier Makro-Werte, nicht nur Kalorien

**Entscheidung:** Ein Rezept muss bei Kalorien **und** Protein **und** Fett
**und** Kohlenhydraten innerhalb von ±15 % des Ziels liegen.

**Begründung:** REQ-003 spezifiziert nur "nach Makros (±15 %)", ohne zu
sagen, ob das für Kalorien insgesamt oder jeden Makro-Wert einzeln gilt. Ich
habe mich für die strengere Auslegung (alle vier Werte) entschieden, weil
sonst ein Rezept mit passenden Kalorien, aber komplett verschobener
Makro-Verteilung (z. B. sehr fettreich statt proteinreich) fälschlich als
Match gelten würde — das würde dem Sinn von REQ-002 (individuelle
Protein-/Fett-/Kohlenhydrat-Ziele) widersprechen.

### 4. 5-Tage-Sperre über `recentRecipeIds`-Parameter statt eigener Persistenz

**Entscheidung:** Der Service verwaltet selbst keine Historie ("wann wurde
Rezept X zuletzt serviert"). Stattdessen übergibt der Aufrufer die Liste der
in den letzten 5 Tagen bereits verwendeten Rezept-IDs (`recentRecipeIds`);
der Service filtert diese nur heraus.

**Begründung:** Der Service ist zustandslos zwischen Requests (siehe Step
01: "kein geteilter In-Process-State"). Eine eigene zeitbasierte Historie
würde eine DB-Anbindung voraussetzen, die noch nicht existiert. Die
Verantwortung "welche Rezepte liefen in den letzten 5 Tagen" liegt fachlich
beim Wochenplan (der den Verlauf sowieso persistieren muss), nicht beim
Matching-Service — das hält die Modul-Grenze sauber.

### 5. Gewichtete statt uniforme Zufallsauswahl, mit injizierbarer RNG

**Entscheidung:** Jeder Kandidat erhält ein Gewicht `1 / (1 + Abweichung von
den Makro-Zielen)`; die Auswahl erfolgt gewichtet-zufällig über eine
injizierbare Zufallsfunktion (Default `Math.random`, in Tests eine
deterministische Funktion).

**Begründung:** REQ-003 fordert explizit "gewichtete Zufallsauswahl" (nicht
uniform), und [Constitution/techstack.md](../Constitution/techstack.md)
nennt als Zweck "Variabilität ohne Wiederholung". Näher am Makro-Ziel
liegende Rezepte werden wahrscheinlicher, aber nicht deterministisch
ausgewählt. Die injizierbare RNG macht die Gewichtungslogik selbst
deterministisch testbar, ohne echten Zufall in Tests simulieren zu müssen.

## Verifikation

- `npm run test` im `matching-service`-Workspace: 18/18 Tests grün (8 aus
  Step 02 + 10 neue für Filterung, Toleranz, Diät-Hierarchie, 5-Tage-Sperre,
  gewichtete Auswahl, Fehlerfälle).
- `npm run typecheck` (root, über Turborepo): weiterhin grün über alle drei
  Workspaces.
- Manueller Live-Test: `POST /v1/recipes/match` mit passendem Makro-Ziel
  liefert ein Rezept + `candidateCount`; mit widersprüchlichen Kriterien
  (alle veganen Kandidaten durch Allergien/5-Tage-Sperre ausgeschlossen)
  liefert der Endpoint `404 {"error":"no_candidates"}`.

## Referenzierte Requirements

REQ-002 (liefert die Makro-Ziele als Eingabe), REQ-003 (Kernanforderung
dieses Schritts).

## Nächste Schritte

- Supabase-Projekt anlegen: Schema für User-Profile, Rezept-Pool, Pläne;
  `RECIPE_POOL` durch echte DB-Query ersetzen.
- `grocery-service`: Einkaufslisten-Generierung (REQ-005) auf Basis eines
  Wochenplans, der aus wiederholten `matchRecipe`-Aufrufen entsteht.

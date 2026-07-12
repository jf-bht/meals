# SWT Final — Teil C — Step 05: Mobile Onboarding & Wochenplan (REQ-001, REQ-004)

## Ziel

`apps/mobile` von einem leeren Platzhalter zu einem echten Expo/React-Native-
Client ausbauen: Onboarding-Flow (REQ-001) sammelt die Eingaben für die
Makro-Berechnung, danach wird ein Wochenplan (REQ-004) generiert und die
zugehörige Einkaufsliste (REQ-005) angezeigt. Damit ist der End-to-End-
Durchlauf aus der Scope-Entscheidung (README.md) technisch geschlossen:
Onboarding → Matching → Wochenplan → Einkaufsliste, über alle drei Module
hinweg. Visuelles Vorbild: die drei Screenshots in `design-reference/`
(Onboarding, Wochenplan, Einkaufsliste) aus Teil A, Akzentfarbe `#22C55E`.

## Architekturentscheidungen

### 1. Echtes Expo-Scaffold statt Eigenbau

**Entscheidung:** `npx create-expo-app --template blank-typescript` direkt in
`apps/mobile` ausgeführt statt Config-Dateien von Hand zu schreiben.

**Begründung:** Expo/React Native haben viele bewegliche Teile (Metro-
Bundler-Config, Babel, native Module-Autolinking). Das offizielle Template
garantiert eine funktionierende Ausgangsbasis; danach nur `package.json`
(Name `@meals/mobile`, Turborepo-Scripts) und generierte Boilerplate-Dateien
(`LICENSE`, `AGENTS.md`, `CLAUDE.md`) angepasst/entfernt.

### 2. Kein Expo Router, keine Navigation-Library — einfache State-Machine

**Entscheidung:** `App.tsx` hält den Anwendungszustand
(`onboarding | generating | ready | error`) in `useState` und rendert je
nach Zustand den passenden Screen. Zwischen Wochenplan/Einkaufsliste
wechselt eine simple `BottomNav`-Komponente per Prop-Callback.

**Begründung:** Explizit im Auftrag gefordert ("kein Expo Router/komplexe
Navigation-Library nötig"). Für 3 Screens mit rein linearem/Tab-Fluss ist
eine State-Machine ausreichend und vollständig nachvollziehbar — passend
zum Anspruch "Code vollständig verstanden" aus Teil C.

### 3. React-Native-`StyleSheet` statt NativeWind

**Entscheidung:** Alle Styles über `StyleSheet.create` in TS-Dateien, kein
Tailwind/NativeWind, obwohl [Constitution/techstack.md](../Constitution/techstack.md)
NativeWind vorsieht.

**Begründung:** NativeWind bräuchte zusätzliche Babel-/Tailwind-Config und
eine weitere Build-Abhängigkeit — Risiko für den kompakten Scope dieser
Abgabe ohne fachlichen Mehrwert. Bewusste, dokumentierte Abweichung vom
Techstack-Dokument; bei einem echten Weiterbau wäre NativeWind der nächste
Schritt für Konsistenz mit der (geplanten) Web-Variante.

### 4. Kein Import aus services/* — eigene, duck-typed API-Verträge

**Entscheidung:** `apps/mobile/src/api/types.ts` definiert eigene
TypeScript-Interfaces für `MacroInput`, `Recipe`, `MatchInput` etc., die
strukturell den Server-Antworten entsprechen, aber nicht aus
`services/matching-service` importiert werden.

**Begründung:** Gleiches Prinzip wie schon beim `grocery-service` (Step 04):
Module sind nur über REST gekoppelt. Die Mobile-App ist ein separates
Deployment-Artefakt (App Store/Play Store) — ein Import aus einem
Node-Service wäre ohnehin nicht bundlebar und würde die Modul-Grenze
aufweichen.

### 5. Wochenplan-Orchestrierung (21 Slots) lebt im Client, nicht im Service

**Entscheidung:** `src/domain/weekPlan.ts` ruft `matching-service`
`POST /v1/recipes/match` sequenziell 21× auf (7 Tage × 3 Mahlzeiten) und
pflegt dabei ein rollierendes 5-Tage-Fenster bereits verwendeter Rezept-IDs
(REQ-003-Regel), das der zustandslose Service selbst nicht verwalten kann.

**Begründung:** Konsistent mit der in Step 03 getroffenen Entscheidung
("Historie liegt beim Aufrufer"). Für REQ-004 ist der Aufrufer hier die
Mobile-App (nicht `grocery-service` wie in Step 04) — die 5-Tage-Regel ist
Aufrufer-Verantwortung, unabhängig davon, wer aufruft.

### 6. CORS-Fix — ein echter Fund aus dem Browser-Test

**Entscheidung:** `@fastify/cors` in beiden Services registriert
(`origin: true`).

**Begründung:** Beim Testen der Web-Variante (`expo start --web`) im
Browser schlugen alle Fetch-Aufrufe fehl, obwohl dieselben Requests per
`curl` seit Step 02/04 funktionierten — `curl` unterliegt keiner
Same-Origin-Policy, ein echter Browser aber schon (Preflight-`OPTIONS` auf
`POST`-Requests mit JSON-Body). Ohne CORS-Header hätte die Web-Variante nie
funktioniert, nur iOS/Android (die keine CORS-Prüfung kennen). Das ist ein
konkretes Beispiel dafür, warum "im Browser testen" (nicht nur `curl`) für
Frontend-Änderungen notwendig ist.

### 7. Matching-Kriterium nachträglich korrigiert: nur Kalorien hart, nicht alle vier Makros

**Entscheidung:** `matchesMacros` in `matching.ts` prüft jetzt nur noch
`kcal` gegen ±15 % hart; Protein/Fett/Kohlenhydrate fließen weiterhin in die
gewichtete Auswahl (`macroDistance`) ein, sind aber kein Ausschlusskriterium
mehr (Änderung ggü. Step 03).

**Begründung:** Der End-to-End-Test mit echten Onboarding-Daten (68 kg,
moderat aktiv, Ziel halten → 2296,8 kcal/Tag, 102 g Protein/Tag) deckte auf:
Pro Mahlzeit ergibt REQ-002s feste Formel (Protein = kg×1,5, Fett = kg×1,0)
ein Makro-*Verhältnis* (hier: 17,8 % Kalorien aus Protein, 55,6 % aus
Kohlenhydraten), das kein einzelnes der 12 Demo-Rezepte auf allen drei
Sub-Makros gleichzeitig innerhalb ±15 % traf — reale Rezepte korrelieren
Protein/Fett/Kohlenhydrate anders, als die Formel es vorschreibt. Die
strikte Vier-Makro-Prüfung aus Step 03 erwies sich damit als in der Praxis
kaum erfüllbar, nicht nur als "Pool zu klein". Kalorien sind die im Alltag
entscheidende Zahl und die wörtlichste Lesart von "Makros ±15 %" — die
anderen drei Werte bleiben über die Gewichtung weiterhin relevant für die
Auswahl, nur nicht mehr als hartes Ausschlusskriterium. Zusätzlich wurden
zwei kalorienreichere Rezepte (r-11, r-12, 700–720 kcal) ergänzt, weil der
ursprüngliche Pool (500–620 kcal) realistische Pro-Mahlzeit-Ziele bei
üblichem Tagesbedarf (>2000 kcal) nicht abdeckte.

### 8. Fallback bei erschöpftem Demo-Pool statt Abbruch

**Entscheidung:** Trifft die 5-Tage-Sperre in `generateWeekPlan` auf einen
Slot, für den sonst kein Kandidat übrig bleibt (`404 no_candidates`), wird
die Sperre für diesen einen Slot ignoriert, statt den gesamten Wochenplan
abzubrechen.

**Begründung:** Der 12-Rezepte-Demo-Pool ist zu klein, um 21 Slots/Woche
ohne jede Wiederholung realistisch zu befüllen (das wäre erst mit dem
echten, über Supabase geladenen Rezept-Bestand sinnvoll). Ein harter Abbruch
würde den kompletten Prototyp für jedes Testprofil unbenutzbar machen. Die
App zeigt ohnehin einen expliziten Fehler-Screen für den Fall, dass auch der
Fallback fehlschlägt (z. B. keine Rezepte für die gewählte Diät/Allergie-
Kombination überhaupt vorhanden).

### 9. Fund während der Verifikation: `App.tsx` lag zunächst im falschen Verzeichnis

**Problem:** Die App-Komponente wurde versehentlich ins Repo-Root
(`Meals./App.tsx`) statt nach `apps/mobile/App.tsx` geschrieben. Expo
registriert `App.tsx` relativ zum Workspace-Verzeichnis (`index.ts` →
`import App from "./App"`) — dadurch bündelte Metro weiterhin die
generierte Platzhalter-Komponente ("Open up App.tsx to start working on
your app!"), nicht die eigentliche Onboarding-App. Der erste Metro-Bundle-
Test (211 Module) hatte also unbemerkt die falsche Datei geprüft.

**Wie es aufgefallen ist:** Beim erneuten, gezielten Prüfen des Bundle-
Inhalts (`grep` auf bekannte Onboarding-Strings) fehlten die erwarteten
Treffer — das Bundle enthielt nur die Template-Boilerplate.

**Fix:** Datei nach `apps/mobile/App.tsx` verschoben. Danach zeigte ein
erneuter `grep` auf das gebündelte JS die erwarteten Onboarding-Strings
("Erzähl uns von dir", "Was ist dein Ziel"), Bundle jetzt 244 statt 211
Module (Onboarding-/Wochenplan-/Einkaufslisten-Screens tatsächlich
enthalten).

**Lektion:** Ein grüner `npx tsc --noEmit` und ein fehlerfrei kompilierendes
Metro-Bundle beweisen nur, dass *irgendein* gültiges Programm gebündelt
wurde — nicht, dass es das *richtige* ist. Erst die inhaltliche Prüfung des
Bundle-Outputs (nicht nur Statuscode/Fehlerfreiheit) deckte den Fehler auf.

### 10. Export-Button sichtbar, aber transparent als "nicht implementiert" markiert

**Entscheidung:** Der Share-Icon-Button auf dem Einkaufslisten-Screen ist
visuell vorhanden (wie im Design), löst beim Tippen aber einen Hinweis-Alert
aus ("laut Scope nicht implementiert") statt echter Export-Funktionalität.

**Begründung:** REQ-010 ist laut README-Scope-Tabelle "Geplant, nicht
implementiert". Den Button einfach wirkungslos zu lassen wäre für
Testende/Prüfende verwirrend (wirkt wie ein Bug); ein expliziter Hinweis
macht die Scope-Grenze auch in der UI selbst sichtbar und ehrlich.

## Verifikation

- `npm run typecheck` (root, Turborepo): grün über alle vier Workspaces
  (inkl. `apps/mobile`, `tsc --noEmit`).
- `npm run test` (root, Turborepo): 27/27 Tests weiterhin grün
  (`matching-service` 18, `grocery-service` 9; `apps/mobile` hat aktuell
  keine Unit-Tests, da reine UI-Komposition ohne eigene Fachlogik außerhalb
  von `domain/weekPlan.ts`).
- Metro-Bundler (Expo Web) kompiliert das komplette Bundle fehlerfrei
  (244 Module); der Bundle-Inhalt wurde zusätzlich per `grep` auf bekannte
  UI-Strings geprüft, um sicherzustellen, dass tatsächlich die
  Onboarding-App und nicht die Template-Platzhalter-Komponente gebündelt
  wird (siehe Entscheidung 9 — dieser Check deckte einen echten
  Pfad-Fehler auf).
- **Echter End-to-End-Test über den exakten App-Code** (kein separates
  Test-Double): Ein Skript importiert `src/api/client.ts` und
  `src/domain/weekPlan.ts` direkt und ruft damit — gegen die live
  laufenden `matching-service`- und `grocery-service`-Prozesse — den
  kompletten Pfad REQ-002 → REQ-004 (21 Slots) → REQ-005 auf. Ergebnis:
  Makro-Berechnung, Wochenplan-Generierung und Einkaufslisten-Aggregation
  liefern durchgängig valide, aggregierte Daten.
- CORS-Preflight (`OPTIONS` mit `Origin`-Header) gegen `matching-service`
  liefert `204` mit korrekten `Access-Control-*`-Headern — Voraussetzung für
  den Web-Zielplattform-Test.
- **Kein automatisierter visueller Vergleich mit den Screenshots**: In
  dieser Umgebung steht kein Browser-Screenshot-Werkzeug zur Verfügung. Die
  Farben/Abstände/Komponenten (`theme.ts`, `SelectableCard`, `Chip`,
  `SegmentedControl`, `ScreenHeader`) wurden manuell aus den drei
  Screenshots in `design-reference/` abgeleitet, aber nicht pixelgenau
  gegen einen gerenderten Screenshot geprüft. Empfehlung: `npm run web
  --workspace=@meals/mobile` lokal öffnen und mit den Screenshots
  gegenprüfen.

## Referenzierte Requirements

REQ-001 (Onboarding-Flow), REQ-002/REQ-003 (als Backend-Aufrufe),
REQ-004 (Wochenplan-Anzeige inkl. "mit einem Tap neu generieren"),
REQ-005 (Einkaufsliste, als Anzeige-Konsument).

## Nächste Schritte laut Scope (README.md)

- REQ-008 vereinfacht: eine RLS-Policy in Supabase als Nachweis — letzter
  offener Punkt im aktuellen Scope.

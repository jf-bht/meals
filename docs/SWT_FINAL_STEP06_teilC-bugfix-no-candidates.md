# SWT Final — Teil C — Step 06: Bugfix "no_candidates" beim Onboarding

## Ziel

Beim manuellen Testen der App (Screenshot vom Nutzer: Fehler-Screen mit
`request_failed:404:{"error":"no_candidates"}` direkt nach Onboarding-
Abschluss) zeigte sich, dass selbst der in Step 05 eingebaute Fallback
(5-Tage-Sperre ignorieren) für bestimmte Profile nicht ausreicht. Dieser
Schritt behebt die Ursache robust, statt nur das konkrete Testprofil zu
patchen.

## Root Cause

Der Demo-Rezept-Pool deckte nach Step 05 den Kalorienbereich 470–850 kcal
pro Rezept ab. Bei manchen Onboarding-Eingaben liegt das errechnete
Pro-Mahlzeit-Ziel (Tagesziel ÷ 3) außerhalb dieses Bereichs ± 15 % — dann
liefert `matchRecipe` für **jeden** der 21 Wochenplan-Slots `404
no_candidates`, auch nachdem die 5-Tage-Sperre ignoriert wurde (Fallback aus
Step 05 hilft hier nicht, weil das Problem nicht Wiederholung, sondern
fehlende Kalorien-Abdeckung ist).

## Fix

### 1. `relaxMacros`-Flag im matching-service (letzte Eskalationsstufe)

**Entscheidung:** `MatchInput` bekommt ein optionales `relaxMacros`-Feld
(Default `false`). Ist es `true`, überspringt `filterCandidates` die
Kalorien-Toleranz-Prüfung komplett — Diät-Typ-Hierarchie und Allergien
bleiben davon unberührt (weiterhin hart gefiltert).

**Begründung:** Damit gibt es einen expliziten, benannten Fallback-Pfad für
Aufrufer, die lieber ein grob passendes Rezept bekommen als gar keins. Das
ist bewusst ein *client-gesteuertes* Opt-in (kein automatisches Verhalten
im Service selbst) — der Service bleibt in seinem Standardverhalten
weiterhin strikt REQ-003-konform.

### 2. Dritte Eskalationsstufe im Mobile-Client

**Entscheidung:** `generateWeekPlan` in `apps/mobile/src/domain/weekPlan.ts`
versucht pro Slot jetzt bis zu drei Anfragen: (1) normal, (2) ohne 5-Tage-
Sperre, (3) zusätzlich mit `relaxMacros: true`. Erst wenn alle drei
scheitern, wird der Fehler an die UI durchgereicht (Fehler-Screen aus
Step 05, der bereits existierte und korrekt gerendert hat — das war laut
Screenshot bereits sichtbar an der richtigen Stelle).

**Begründung:** Für einen Demo-Rezept-Pool mit 14 Einträgen ist es
unrealistisch, jede Kombination aus Körperdaten × Aktivität × Ziel ×
Diät × Allergien exakt abzudecken. Die Eskalation stellt sicher, dass der
Prototyp für praktisch jedes plausible Nutzerprofil einen vollständigen
7-Tage-Plan liefert, ohne die REQ-003-Kriterien (Diät/Allergien) jemals
aufzuweichen — nur die Makro-Genauigkeit sinkt im Worst Case.

### 3. Pool-Erweiterung: r-13 (380 kcal) und r-14 (850 kcal)

**Entscheidung:** Zwei weitere Rezepte ergänzt, um die Kalorien-Bandbreite
nach unten (leichte Mahlzeit) und oben (großer Bedarf) zu erweitern.

**Begründung:** Reduziert, wie oft die dritte Eskalationsstufe überhaupt
gebraucht wird — die meisten realistischen Profile sollten jetzt schon auf
Stufe 1 oder 2 einen Treffer finden. `relaxMacros` bleibt als Sicherheitsnetz
für echte Extremfälle (sehr niedriger/hoher Bedarf, stark einschränkende
Diät+Allergie-Kombination).

## Verifikation

- `npm run test` (root): 28/28 Tests grün, inkl. neuem Test
  `relaxMacros ignoriert nur die Kalorien-Toleranz, nicht Diät/Allergien`
  (prüft explizit, dass Allergien auch mit `relaxMacros: true` weiterhin
  hart gefiltert werden).
- `npm run typecheck` (root): grün über alle vier Workspaces.
- **End-to-End-Test mit drei Profilen** über den echten App-Code
  (`api/client.ts`, `domain/weekPlan.ts`) gegen die live laufenden
  Services:
  - Klein, sedentary, Ziel "lose" (1156 kcal/Tag) → 21 Mahlzeiten generiert.
  - Groß, very_active, Ziel "gain" (4708 kcal/Tag — deutlich oberhalb der
    Pool-Bandbreite) → 21 Mahlzeiten generiert (via `relaxMacros`-Fallback).
  - Das genaue Profil aus dem Bug-Report (weiblich, 28, 170 cm, 68 kg,
    moderat aktiv, Ziel halten, Gluten-Allergie, 2296,8 kcal/Tag) → 21
    Mahlzeiten generiert, u. a. "Chili con Carne mit Reis" (r-11).

## Referenzierte Requirements

REQ-003 (Matching-Kriterien — Eskalation greift nur bei Kalorien, nie bei
Diät-Typ/Allergien), REQ-004 (Wochenplan muss vollständig sein, 21 Slots).

## Nächste Schritte laut Scope (README.md)

- REQ-008 vereinfacht: eine RLS-Policy in Supabase als Nachweis.

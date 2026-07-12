# Meals

Mobile-first Ernährungsplanungs-App. Meals nimmt dem Nutzer die tägliche
Entscheidungsarbeit rund ums Essen ab — Onboarding, Rezept-Matching,
Wochenplan, Einkaufsliste. Details zu Vision und Zielgruppe siehe
[Constitution/mission.md](./Constitution/mission.md).

Dieses Repo ist Teil C der SWT-Abschlussaufgabe: eine verteilte App mit klar
getrennten, unabhängig lauffähigen Modulen (siehe [Aufgabe.md](./Aufgabe.md)).
Der fachliche Fortschritt ist unter [docs/](./docs) als Step-Dokumentation
festgehalten.

## Architektur

Turborepo-Monorepo mit npm Workspaces. Kein geteilter In-Process-State
zwischen den Modulen — alle Kommunikation läuft über REST bzw. über die
gemeinsame Supabase-Datenschicht.

```
apps/
  mobile/              React Native / Expo Client — Onboarding (REQ-001),
                        Wochenplan-Anzeige (REQ-004), Mahlzeit-Swap (REQ-009),
                        Profil-Tab, Home-Tab, Rezept-Detail-Modal
services/
  matching-service/    Makro-Berechnung (REQ-002) + Rezept-Matching (REQ-003)
  grocery-service/      Einkaufsliste (REQ-005), Kochtage-Vorschlag (REQ-006),
                        Export (REQ-010)
supabase/
  migrations/          RLS-Policy für user_profiles (REQ-008, vereinfacht)
```

| Requirement | Modul | Status |
|---|---|---|
| [REQ-001 Onboarding-Flow](./Requirements/Onboarding-Flow%20361277f89e7380ff81d2fbeda6828fa3.md) | `apps/mobile` | Wird implementiert |
| [REQ-002 Makro-Berechnung](./Requirements/Makro-Berechnung%20361277f89e7380dea2c1c34ca646b6df.md) | `services/matching-service` | Wird implementiert |
| [REQ-003 Rezept-Matching](./Requirements/Rezept-Matching%20361277f89e7380fca88ec215625ec487.md) | `services/matching-service` | Wird implementiert |
| [REQ-004 Wochenplan-Anzeige](./Requirements/Wochenplan-Anzeige%20361277f89e7380958bc6ee2c41f074de.md) | `apps/mobile` | Wird implementiert |
| [REQ-005 Einkaufsliste generieren](./Requirements/Einkaufsliste%20generieren%20361277f89e73803f91fef991a0afe734.md) | `services/grocery-service` | Wird implementiert |
| [REQ-006 Kochtage-Vorschlag](./Requirements/Kochtage-Vorschlag%20382277f89e7380949923c7e46a1dd670.md) | `services/grocery-service` | Geplant, nicht implementiert |
| [REQ-008 Datenschutz & DSGVO](./Requirements/Datenschutz%20&%20DSGVO%20382277f89e738094abafff39494874a7.md) | [Supabase-Migration](./supabase/migrations/20260712000000_user_profiles_rls.sql) | Vereinfacht |
| [REQ-009 Mahlzeit-Swap](./Requirements/Mahlzeit-Swap%20382277f89e7380c69ba9db3aabaea5d0.md) | `apps/mobile` | Wird implementiert |
| [REQ-010 Einkaufsliste exportieren](./Requirements/Einkaufsliste%20exportieren%20382277f89e73804b9158d95d300056b0.md) | `services/grocery-service` | Geplant, nicht implementiert |

REQ-007 (Performance Plangenerierung) ist ein Nicht-Funktional-Ziel ohne
eigenen Code-Umfang und ist für diese Abgabe nicht scharf getrackt.

**Scope-Begründung:** REQ-001–005 werden als vollständiger End-to-End-Durchlauf
(Onboarding → Matching → Wochenplan → Einkaufsliste) durch alle Module hinweg
implementiert. REQ-008 wird bewusst nur vereinfacht umgesetzt — eine einzelne
RLS-Policy als Nachweis des Konzepts, nicht die volle DSGVO-Tiefe. REQ-009
(Mahlzeit-Swap) wurde nachträglich ergänzt (siehe
[docs/SWT_FINAL_STEP15](./docs/SWT_FINAL_STEP15_teilC-mahlzeit-swap.md)).
REQ-006 und REQ-010 bleiben nur als Roadmap-Punkt dokumentiert, ohne Code.
Grund für die ursprüngliche Begrenzung: Der Anspruch dieser Abgabe ist ein
**vollständig verstandener, kompakter End-to-End-Durchlauf durch alle
Module** (siehe [Aufgabe.md](./Aufgabe.md): "Prove that you understood the
code completely"), nicht Feature-Vollständigkeit von Anfang an — REQ-009
wurde erst nachträglich als sinnvolle, gut abgrenzbare Ergänzung
identifiziert.

`grocery-service` ruft zusätzlich den bereits fertigen Nutrition-Tracker
(separates Repo, [github.com/jf-bht/nutrition-tracker](https://github.com/jf-bht/nutrition-tracker))
per REST an.

**Hinweis zur REST-Wiederverwendung:** `matching-service`s `GET
/v1/recipes/:id` liefert immer die unskalierte Basis-Portion aus dem
Rezept-Pool, nicht die für eine konkrete Mahlzeit ggf. über die
Kohlenhydrat-Quelle skalierte Menge (Portions-Skalierung, siehe
[docs/SWT_FINAL_STEP09](./docs/SWT_FINAL_STEP09_teilC-mealtype-portionscaling.md)).
Sowohl die Einkaufslisten-Aggregation (`grocery-service`) als auch das
Rezept-Detail-Modal (`apps/mobile`) verwenden deshalb bewusst das bereits
geladene, ggf. skalierte Rezept-Objekt aus dem Wochenplan statt diesen
Endpoint erneut aufzurufen — sonst würden Wochenplan, Einkaufsliste und
Detailansicht unterschiedliche Mengen für dieselbe Mahlzeit zeigen (siehe
[docs/SWT_FINAL_STEP13](./docs/SWT_FINAL_STEP13_teilC-rezept-detail.md)).

Weiterer Kontext zu Techstack-Entscheidungen: [Constitution/techstack.md](./Constitution/techstack.md).
Roadmap / Iterationsplanung: [Constitution/roadmap.md](./Constitution/roadmap.md).

## Setup

```bash
npm install
npm run dev        # startet alle Workspaces über Turborepo
npm run typecheck  # TypeScript strict über alle Workspaces
npm run test        # Unit-Tests (matching-service, grocery-service)
```

Jeder Service liest seine Konfiguration aus einer `.env`-Datei
(siehe jeweiliges `.env.example`).

Für die Mobile-App (`apps/mobile`) müssen `matching-service` (Port 3001) und
`grocery-service` (Port 3002) laufen, bevor Onboarding oder Wochenplan
funktionieren:

```bash
npm run dev --workspace=@meals/matching-service
npm run dev --workspace=@meals/grocery-service
npm run web --workspace=@meals/mobile   # oder: ios / android
```

## Status

Ursprünglicher Scope vollständig umgesetzt: End-to-End-Durchlauf Onboarding
→ Makro-Berechnung → Rezept-Matching → Wochenplan → Einkaufsliste
(REQ-001–005) über alle drei Module, plus REQ-008 vereinfacht (RLS-Policy).
Zusätzlich ergänzt: Splash-Screen, Home-Tab (Rezept-Pool-Übersicht),
Profil-Tab (Onboarding-Daten + Makros, read-only), Rezept-Detail-Modal im
Wochenplan und REQ-009 Mahlzeit-Swap. Details zu jedem Schritt,
Architekturentscheidungen und gefundenen/gefixten Bugs siehe
[docs/](./docs) (`SWT_FINAL_STEP01` bis `STEP15`).

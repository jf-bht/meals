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
  mobile/              React Native / Expo Client (Platzhalter, folgt später)
services/
  matching-service/    Makro-Berechnung (REQ-002) + Rezept-Matching (REQ-003)
  grocery-service/      Einkaufsliste (REQ-005), Kochtage-Vorschlag (REQ-006),
                        Mahlzeit-Swap (REQ-009), Export (REQ-010)
```

| Modul | Verantwortung | Requirements |
|---|---|---|
| `apps/mobile` | UI, Onboarding-Flow, Wochenplan-Anzeige | [REQ-001](./Requirements/Onboarding-Flow%20361277f89e7380ff81d2fbeda6828fa3.md), [REQ-004](./Requirements/Wochenplan-Anzeige%20361277f89e7380958bc6ee2c41f074de.md) |
| `services/matching-service` | Makro-Berechnung, Rezept-Matching | [REQ-002](./Requirements/Makro-Berechnung%20361277f89e7380dea2c1c34ca646b6df.md), [REQ-003](./Requirements/Rezept-Matching%20361277f89e7380fca88ec215625ec487.md) |
| `services/grocery-service` | Einkaufsliste, Kochtage, Swap, Export | [REQ-005](./Requirements/Einkaufsliste%20generieren%20361277f89e73803f91fef991a0afe734.md), [REQ-006](./Requirements/Kochtage-Vorschlag%20382277f89e7380949923c7e46a1dd670.md), [REQ-009](./Requirements/Mahlzeit-Swap%20382277f89e7380c69ba9db3aabaea5d0.md), [REQ-010](./Requirements/Einkaufsliste%20exportieren%20382277f89e73804b9158d95d300056b0.md) |
| Supabase (gemeinsame Datenschicht) | Auth, Postgres, Row-Level-Security | [REQ-008](./Requirements/Datenschutz%20&%20DSGVO%20382277f89e738094abafff39494874a7.md) |

`grocery-service` ruft zusätzlich den bereits fertigen Nutrition-Tracker
(separates Repo, [github.com/jf-bht/nutrition-tracker](https://github.com/jf-bht/nutrition-tracker))
per REST an.

Weiterer Kontext zu Techstack-Entscheidungen: [Constitution/techstack.md](./Constitution/techstack.md).
Roadmap / Iterationsplanung: [Constitution/roadmap.md](./Constitution/roadmap.md).

## Setup

```bash
npm install
npm run dev        # startet alle Workspaces über Turborepo
npm run typecheck  # TypeScript strict über alle Workspaces
```

Jeder Service liest seine Konfiguration aus einer `.env`-Datei
(siehe jeweiliges `.env.example`).

## Status

Aktuell nur lauffähiges Skelett (Health-Check-Endpunkte), noch keine
Business-Logik. Fortschritt siehe [docs/SWT_FINAL_STEP01_teilC-setup.md](./docs/SWT_FINAL_STEP01_teilC-setup.md).

## Entscheidungsgrundlage
Cross-Platform-First: iOS und Android mit einer gemeinsamen Codebasis, ohne Performance-Kompromisse für den Endnutzer. Web als sekundärer Kanal.

---
## Frontend — Mobile

| Technologie             | Entscheidung  | Begründung                                                                                                                              |
| ----------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **React Native + Expo** | ✅ **Gewählt** | Breite Community, Code-Sharing iOS/Android ~95 %, gute Performance durch New Architecture (JSI), Expo managed workflow beschleunigt MVP |
| Flutter                 | Alternative   | Sehr gute Performance, aber Dart-Ökosystem kleiner; weniger JS/TS-Synergien mit Backend                                                 |
| Native Swift/Kotlin     | Abgelehnt     | Doppelter Entwicklungsaufwand, nicht sinnvoll für MVP-Phase                                                                             |

## Frontend — Web
- **React (Vite)** — Code-Sharing mit React Native (Logik-Layer, Types, Hooks)
- Styling: **NativeWind** (Tailwind für React Native) → konsistentes Design-System

---
## Backend

| Technologie       | Entscheidung            | Begründung                                                                                            |
| ----------------- | ----------------------- | ----------------------------------------------------------------------------------------------------- |
| **Supabase**      | ✅ **Gewählt**           | PostgreSQL-Basis, Auth out-of-the-box, Realtime, Storage — stark reduziert Backend-Boilerplate im MVP |
| Node.js + Fastify | Fallback / Custom Logic | Für komplexere Matching-Algorithmen als Edge Functions oder eigenständiger Service                    |
| Python / FastAPI  | Premium-Phase           | Für ML-basiertes Rezept-Matching in späteren Iterationen                                              |

## Datenbank
- **PostgreSQL** (via Supabase) — relationale Struktur für User-Profile, Rezepte, Pläne, Zutaten
- Schema-first mit Typen-Generierung (supabase gen types)

---

## Matching-Algorithmus (MVP)
- Regelbasiert (kein ML in Iter. 1): Filterung nach Makros ± 10 %, Diät-Typ, Allergien
- Gewichtete Zufallsauswahl aus gefilterten Rezepten → Variabilität ohne Wiederholung
- ML-Upgrade (Premium): Collaborative Filtering auf Basis von User-Bewertungen

---

## DevOps & Tooling

| Bereich | Tool |
|---------|------|
| Monorepo | Turborepo (apps/mobile, apps/web, packages/shared) |
| Sprache | TypeScript (strict) throughout |
| CI/CD | GitHub Actions → EAS Build (Expo) |
| Testing | Jest + React Native Testing Library |
| API-Typen | Supabase-generierte Types + Zod für Validierung |

---

## Externe Schnittstellen (Roadmap)
- Apple HealthKit / Google Health Connect (Premium, Iter. 4+)
- iOS Calendar / Google Calendar API (Iter. 3)
- iOS Share Sheet / Android Sharesheet für Einkaufsliste (Iter. 2)

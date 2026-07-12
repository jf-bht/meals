# SWT Final — Teil C — Step 01: Monorepo-Grundgerüst

## Ziel

Teil C der Abschlussaufgabe fordert eine **verteilte App mit klar getrennten
Modulen**, die vollständig verstanden und dokumentiert werden muss (siehe
[Aufgabe.md](../Aufgabe.md)). Dieser Schritt legt das Turborepo-Grundgerüst an:
ein npm-Workspace-Monorepo mit zwei eigenständigen Node/TS-Services und einem
Platzhalter für den späteren React-Native-Client. Noch keine Business-Logik —
Ziel ist ein lauffähiges Skelett, das die Modul-Grenzen bereits real erzwingt
(getrennte `package.json`, getrennte Prozesse, getrennte Ports).

## Architekturentscheidungen

### 1. Turborepo + npm Workspaces statt einzelner Repos

**Entscheidung:** Ein Monorepo mit `apps/*` und `services/*` als Workspaces,
orchestriert über Turborepo (`turbo.json` mit Tasks `build`, `dev`, `lint`,
`typecheck`).

**Begründung:** Erlaubt getrennte, unabhängig deploybare Module (siehe unten)
ohne den Overhead mehrerer Repos für ein Uni-Projekt. Deckt sich mit
[Constitution/techstack.md](../Constitution/techstack.md), das Turborepo für
`apps/mobile`, `apps/web`, `packages/shared` vorsieht. `packages/shared` wird
hier bewusst noch **nicht** angelegt — es gibt aktuell keinen Code, der von
Mobile und den Services gemeinsam genutzt würde; eine leere Abstraktion würde
nur Struktur ohne Zweck hinzufügen.

### 2. Zwei eigenständige Services statt eines Backend-Monolithen

**Entscheidung:** `services/matching-service` (REQ-002, REQ-003) und
`services/grocery-service` (REQ-005, REQ-006, REQ-009, REQ-010) sind zwei
komplett unabhängige Node/TS-Prozesse mit eigenem `package.json`, eigenem
`tsconfig.json` und eigenem Port (3001 bzw. 3002, konfigurierbar über `.env`).

**Begründung:**
- Erfüllt die Aufgabenstellung "Module müssen getrennt sein" nicht nur
  organisatorisch (Ordner), sondern technisch: kein Service importiert Code
  vom anderen, es gibt keinen geteilten In-Process-State. Die einzige
  Verbindung ist HTTP/REST.
- Fachlich sind Matching (Makro-Berechnung, Rezept-Auswahl) und Grocery
  (Einkaufsliste, Kochtage, Swap, Export) unterschiedliche Verantwortungen mit
  unterschiedlicher Änderungsfrequenz — passt zum Grundsatz "Services am
  fachlichen Schnitt trennen, nicht an technischen Schichten".
- `grocery-service` wird später zusätzlich den externen Nutrition-Tracker
  (separates Repo, github.com/jf-bht/nutrition-tracker) per REST ansprechen —
  auch das ist ein reiner HTTP-Aufruf nach außen, kein Import.

### 3. Fastify statt Express als HTTP-Framework

**Entscheidung:** Beide Services nutzen Fastify für die REST-Schnittstelle.

**Begründung:** [Constitution/techstack.md](../Constitution/techstack.md)
nennt "Node.js + Fastify" explizit als Fallback für eigenständige Services mit
komplexerer Logik (z. B. Matching-Algorithmen) — genau der hier vorliegende
Fall. Fastify bringt Schema-Validierung und strukturiertes Logging von Haus
aus mit, was für spätere Request/Response-Typisierung (Zod, siehe Techstack)
gut passt.

### 4. `apps/mobile` als reiner Platzhalter

**Entscheidung:** `apps/mobile` enthält nur `package.json` mit Placeholder-
Scripts und ein README, aber noch kein `create-expo-app`-Scaffold.

**Begründung:** Der Fokus dieses Schritts liegt auf der Service-Trennung
(Kern der Teil-C-Anforderung "verteilte App"). Ein echtes Expo-Projekt jetzt
anzulegen würde Abhängigkeiten und Konfiguration hinzufügen, die erst mit
Onboarding-Flow (REQ-001) und Wochenplan-Anzeige (REQ-004) gebraucht werden.
Der Workspace existiert aber bereits, damit `npm install` und `turbo run`
schon jetzt über das komplette Monorepo funktionieren und der spätere
Scaffold sich nahtlos einfügt.

### 5. TypeScript strict über eine gemeinsame Basis-Config

**Entscheidung:** `tsconfig.base.json` im Root mit `strict: true` und
`noUncheckedIndexedAccess: true`; jeder Service erweitert diese Datei.

**Begründung:** Einheitliches Strictness-Level über alle Module hinweg, ohne
Duplikation der Compiler-Optionen. `noUncheckedIndexedAccess` ist bewusst
scharf gestellt, weil in Matching- und Grocery-Logik viel mit Arrays/Maps
(Rezept-Listen, Zutaten-Aggregation) gearbeitet wird und stille `undefined`-
Zugriffe früh auffallen sollen.

## Verifikation

- `npm install` im Root installiert alle Workspaces über einen einzigen
  `node_modules`-Baum (npm workspaces), ohne Business-Logik-Code.
- `npm run typecheck` (→ `turbo run typecheck`) läuft strict über alle drei
  Workspaces grün durch.
- Beide Services wurden unabhängig gestartet (`npm run dev --workspace=...`)
  und liefern auf ihren jeweiligen Ports einen `GET /health`-Response
  (`{"service": "...", "status": "ok"}`), was bestätigt: getrennte Prozesse,
  getrennte Ports, keine Kopplung zur Laufzeit.

## Referenzierte Requirements

REQ-001, REQ-002, REQ-003, REQ-004, REQ-005, REQ-006, REQ-008, REQ-009,
REQ-010 (siehe [Requirements/](../Requirements) und
[Requirements Overview.csv](../Requirements/Requirements%20Overview.csv)).

## Nächste Schritte

- Business-Logik Makro-Berechnung (REQ-002) im `matching-service`
- Rezept-Matching-Algorithmus (REQ-003)
- Supabase-Projekt anlegen, Schema für User/Rezepte/Pläne, RLS für REQ-008

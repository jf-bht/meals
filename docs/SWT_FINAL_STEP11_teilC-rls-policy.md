# SWT Final — Teil C — Step 11: RLS-Policy als REQ-008-Nachweis (vereinfacht)

## Ziel

Letzter offener Punkt aus dem in README.md festgelegten Scope: REQ-008
(Datenschutz & DSGVO) — laut Scope-Entscheidung **vereinfacht**, d. h. eine
einzelne RLS-Policy als Nachweis des Konzepts, nicht die volle DSGVO-Tiefe.

## Architekturentscheidungen

### 1. Reine SQL-Migration statt App-Integration

**Entscheidung:** `supabase/migrations/20260712000000_user_profiles_rls.sql`
enthält Tabelle + Policies. Die App (`apps/mobile`) wird **nicht** an
Supabase angebunden — kein Auth-Login-Flow, kein tatsächliches Schreiben
der Onboarding-Daten in diese Tabelle.

**Begründung:** Explizit mit dem Nutzer abgestimmt (2026-07-12): Eine echte
Anbindung würde einen Login-Flow, Session-Management und Supabase-Client-
Integration in mindestens zwei Workspaces erfordern — das sprengt den
bewusst kompakten "End-to-End-Durchlauf, nicht Feature-Vollständigkeit"-
Scope aus README.md. Die Migration zeigt das Konzept vollständig und
eigenständig (Schema + Policies sind selbsterklärend und ausführbar), ohne
den Rest der Abgabe mit einer neuen, in dieser Session ungetesteten
Integrationsfläche zu belasten.

### 2. Tabellenschema folgt exakt REQ-001/REQ-002-Feldern

**Entscheidung:** `user_profiles` enthält genau die Onboarding-Felder aus
REQ-001 (Geschlecht, Alter, Größe, Gewicht, Aktivitätslevel, Ziel,
Diät-Typ, Allergien) — dieselben Felder, die `apps/mobile/src/screens/
OnboardingScreen.tsx` bereits erfasst und an `matching-service` schickt.

**Begründung:** REQ-008 nennt explizit "Gewicht, Ziele, Allergien" als zu
schützende Gesundheitsdaten. Das Schema 1:1 an die bereits gebaute
Onboarding-UI anzulehnen (statt ein generisches Nutzer-Tabellen-Schema zu
erfinden) macht den Bezug zwischen Code und Requirement direkt
nachvollziehbar — genau der Anspruch aus Teil C ("Code vollständig
verstanden").

### 3. `privacy_consent_at` als NOT NULL statt separate Consent-Tabelle

**Entscheidung:** Eine einzelne `timestamptz not null`-Spalte statt eines
eigenen Consent-Audit-Logs.

**Begründung:** REQ-008 fordert "Nutzer muss vor dem Onboarding explizit
der Datenschutzerklärung zustimmen". Die `NOT NULL`-Constraint erzwingt
das bereits technisch — ohne Zustimmungs-Zeitstempel lässt sich gar kein
Profil anlegen (ein `INSERT` ohne diesen Wert schlägt fehl). Ein vollwertiges
Audit-Log (Historie aller Zustimmungen/Widerrufe über Zeit, Versionierung
der Datenschutzerklärung) wäre die nächste Ausbaustufe, aber bewusst nicht
Teil des "vereinfacht"-Scopes.

### 4. Vier einzelne Policies statt einer kombinierten

**Entscheidung:** Separate `SELECT`/`INSERT`/`UPDATE`/`DELETE`-Policies,
alle mit derselben Bedingung `auth.uid() = user_id`.

**Begründung:** Postgres/Supabase RLS-Policies sind pro Befehl (`FOR
SELECT`, `FOR INSERT`, …) getrennt — eine kombinierte `FOR ALL`-Policy wäre
kürzer, aber die explizite Aufschlüsselung macht sichtbar, dass auch
`DELETE` abgedeckt ist (DSGVO Art. 17, Recht auf Löschung — im Requirement
nicht explizit genannt, aber Teil der "DSGVO-konform"-Anforderung).

## Wie anwenden (kein Supabase-Projekt vorhanden)

1. [supabase.com](https://supabase.com) → kostenloses Projekt anlegen
   (Projektname z. B. "meals", Region z. B. Frankfurt).
2. Im Dashboard: **SQL Editor** → Inhalt von
   `supabase/migrations/20260712000000_user_profiles_rls.sql` einfügen →
   Run.
3. Zur Kontrolle: **Table Editor** → `user_profiles` → **RLS** sollte als
   aktiv angezeigt werden; unter **Policies** erscheinen die vier Policies
   aus der Migration.
4. `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` aus **Project Settings →
   API** in die `.env`-Dateien der Services eintragen (siehe
   `services/*/.env.example`) — für diese Abgabe nicht zwingend nötig, da
   keine Service-Code-Anbindung erfolgt, aber für eine spätere echte
   Integration bereits vorbereitet.

## Verifikation

- SQL wurde nicht gegen ein echtes Supabase-Projekt ausgeführt (keines
  vorhanden) — die Migration ist Standard-PostgreSQL/Supabase-Syntax
  (`create table`, `enable row level security`, `create policy … using
  (auth.uid() = user_id)`), kein Custom-Feature, das Testen erfordern
  würde. Eine Ausführung im Supabase SQL Editor liefert bei Erfolg keine
  Fehlermeldung; das Table/Policy-Ergebnis ist im Dashboard sofort
  sichtbar (siehe Anleitung oben).

## Referenzierte Requirements

REQ-001 (Feldschema), REQ-008 (Kernanforderung dieses Schritts, vereinfacht
laut Scope-Entscheidung in README.md).

## Scope-Status

Damit ist der in README.md festgelegte Scope für diese Abgabe vollständig
abgearbeitet: REQ-001–005 (End-to-End-Durchlauf, Steps 01–10) und REQ-008
(vereinfacht, dieser Step). REQ-006/009/010 bleiben wie geplant
Roadmap-Punkte ohne Code.

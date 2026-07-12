-- REQ-008 (Datenschutz & DSGVO): Gesundheitsdaten (Gewicht, Ziele,
-- Allergien) DSGVO-konform speichern, Zustimmung zur Datenschutzerklärung
-- vor dem Onboarding erfassen, Umsetzung über Supabase Row-Level-Security.
--
-- Scope-Hinweis (siehe README.md): Dies ist der vereinfachte Nachweis für
-- REQ-008 laut Teil-C-Scope-Entscheidung — eine Tabelle mit den in REQ-001
-- erfassten Onboarding-Daten plus RLS-Policies, die sicherstellen, dass
-- jeder Nutzer ausschließlich seine eigene Zeile lesen/schreiben/löschen
-- kann. Kein vollständiges DSGVO-Datenmodell (z. B. kein separates
-- Consent-Audit-Log, keine Datenexport-Funktion) — das wäre über den Scope
-- dieser Abgabe hinaus.

create table if not exists public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,

  -- Onboarding-Felder aus REQ-001
  gender text not null check (gender in ('male', 'female')),
  age_years integer not null check (age_years between 14 and 120),
  height_cm numeric not null check (height_cm between 100 and 250),
  weight_kg numeric not null check (weight_kg between 30 and 300),
  activity_level text not null
    check (activity_level in ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  goal text not null check (goal in ('lose', 'maintain', 'gain')),
  diet_type text not null check (diet_type in ('omnivore', 'vegetarian', 'vegan')),
  allergies text[] not null default '{}',

  -- REQ-008: "Nutzer muss vor dem Onboarding explizit der
  -- Datenschutzerklärung zustimmen" — NOT NULL erzwingt technisch, dass
  -- ohne Zustimmungs-Zeitstempel kein Profil angelegt werden kann.
  privacy_consent_at timestamptz not null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_profiles enable row level security;

-- Jeder Nutzer sieht/ändert/löscht ausschließlich seine eigene Zeile.
-- auth.uid() ist die von Supabase Auth bereitgestellte Nutzer-ID des
-- aktuell authentifizierten Requests (JWT-basiert).
create policy "user_profiles_select_own"
  on public.user_profiles
  for select
  using (auth.uid() = user_id);

create policy "user_profiles_insert_own"
  on public.user_profiles
  for insert
  with check (auth.uid() = user_id);

create policy "user_profiles_update_own"
  on public.user_profiles
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- DSGVO Art. 17 (Recht auf Löschung): Nutzer kann seine eigenen
-- Gesundheitsdaten jederzeit selbst entfernen.
create policy "user_profiles_delete_own"
  on public.user_profiles
  for delete
  using (auth.uid() = user_id);

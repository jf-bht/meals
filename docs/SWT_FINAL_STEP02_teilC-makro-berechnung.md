# SWT Final — Teil C — Step 02: Makro-Berechnung (REQ-002)

## Ziel

Erste Business-Logik im `matching-service`: aus den Onboarding-Daten
(Geschlecht, Alter, Größe, Gewicht, Aktivitätslevel, Ziel — REQ-001) werden
Tagesziele für Kalorien, Protein, Fett und Kohlenhydrate berechnet. Dies ist
die einfachste REQ-002/003-Komponente ohne Abhängigkeit auf Supabase oder
einen Rezept-Pool und eignet sich daher als erster Vertical Slice mit
echter, testbarer Logik.

## Architekturentscheidungen

### 1. Reine Berechnungsfunktion getrennt von der REST-Schicht

**Entscheidung:** `src/macros.ts` enthält ausschließlich die Berechnung
(`calculateMacros`) und die Zod-Schemas für Ein-/Ausgabe. `src/index.ts`
bindet das nur noch als `POST /v1/macros` ein.

**Begründung:** Die Rechenlogik ist ohne Fastify/HTTP komplett unit-testbar
(siehe `macros.test.ts`). Das hält die REST-Schicht dünn und macht die
Kernlogik wiederverwendbar, falls sie später z. B. auch beim Rezept-Matching
(REQ-003, gleicher Service) gebraucht wird.

### 2. Harris-Benedict (revidiert 1984) für den BMR

**Entscheidung:**
- Männer: `88.362 + 13.397×kg + 4.799×cm − 5.677×Jahre`
- Frauen: `447.593 + 9.247×kg + 3.098×cm − 4.330×Jahre`

**Begründung:** REQ-002 verlangt explizit Harris-Benedict. Die revidierte
Fassung (Roza & Shizgal 1984) ist die heute gebräuchliche Variante der
Originalformel von 1919 und wird in der Literatur meist synonym als
"Harris-Benedict" zitiert.

### 3. Aktivitäts- und Ziel-Faktor als fest hinterlegte Konstanten

**Entscheidung:** PAL-Faktoren `sedentary 1.2 / light 1.375 / moderate 1.55 /
active 1.725 / very_active 1.9`; Ziel-Faktoren `lose 0.85 / maintain 1.0 /
gain 1.15`.

**Begründung:** REQ-002 nennt "Aktivitätsfaktor × Ziel-Faktor", spezifiziert
aber keine konkreten Werte. Die PAL-Werte sind Standardwerte der
Ernährungswissenschaft. Für den Ziel-Faktor habe ich ±15 % gewählt (gängige
Praxisempfehlung für moderates Defizit/Überschuss). **Das ist eine bewusste
Annahme, keine Vorgabe aus den Requirements** — falls das Projekt später
andere Werte braucht, sind sie an einer einzigen Stelle (`ACTIVITY_FACTOR`,
`GOAL_FACTOR` in `macros.ts`) zentral änderbar.

### 4. Protein/Fett fix, Kohlenhydrate als Rest — mit Clamping

**Entscheidung:** `proteinG = kg × 1.5`, `fatG = kg × 1.0` (exakt wie in
REQ-002 vorgegeben). Kohlenhydrate ergeben sich aus den verbleibenden
Kalorien nach Abzug von Protein- und Fett-Kalorien, aber nie negativ
(`Math.max(0, …)`).

**Begründung:** Bei sehr hohem Körpergewicht kombiniert mit aggressivem
Kaloriendefizit (`goal: lose`, `activityLevel: sedentary`) kann der
rechnerische Rest negativ werden, weil Protein + Fett allein schon mehr
Kalorien binden als das Kalorienziel vorsieht. Ohne Clamping würde die API
negative Gramm-Werte zurückgeben, was fachlich unsinnig ist. Ein Test
(`Kohlenhydrate werden nie negativ`) deckt genau diesen Edge Case ab.

### 5. Zod-Validierung an der REST-Grenze

**Entscheidung:** `POST /v1/macros` validiert den Request-Body über das
`MacroInput`-Zod-Schema; bei Validierungsfehlern `400` mit strukturierten
`issues`.

**Begründung:** Deckt sich mit
[Constitution/techstack.md](../Constitution/techstack.md) ("Zod für
Validierung"). Health-Daten (Gewicht, Alter) sind nutzergeneriert und müssen
an der Systemgrenze geprüft werden, bevor sie in eine Formel mit
Exponential-/Linearkombinationen einfließen — ungültige Werte (negatives
Gewicht, Alter > 120) sollen nicht stillschweigend zu unsinnigen Kalorienzielen
führen.

## Verifikation

- `npm run test` im `matching-service`-Workspace: 8/8 Unit-Tests grün
  (Node's eingebauter Test-Runner via `node --import tsx --test`, siehe
  `package.json`), u. a. Formel-Korrektheit, Geschlechter-Unterschied,
  Monotonie von Aktivitäts-/Ziel-Faktor, Clamping, Validierungsfehler.
- `npm run typecheck` (root, über Turborepo): weiterhin grün über alle drei
  Workspaces.
- Manueller Live-Test: Service gestartet, `POST /v1/macros` mit gültigem
  Body liefert plausible Werte (`{"bmrKcal":1853.6,"calorieTargetKcal":2873.1,
  "proteinG":120,"fatG":80,"carbsG":418.3}` für 80 kg / 180 cm / 30 J. /
  männlich / moderate / maintain); mit ungültigem Body (`weightKg: -5`)
  liefert der Endpoint `400` mit Zod-`issues`.

## Referenzierte Requirements

REQ-001 (liefert die Eingabedaten), REQ-002 (Kernanforderung dieses Schritts).

## Nächste Schritte

- Rezept-Matching (REQ-003): Filterung nach Diät-Typ/Allergien, dann Makros
  (±15 %), gewichtete Zufallsauswahl, 5-Tage-Wiederholungssperre — nutzt das
  hier berechnete Makro-Ziel als Filterkriterium.
- Supabase-Anbindung, sobald ein Rezept-Pool persistiert werden muss.

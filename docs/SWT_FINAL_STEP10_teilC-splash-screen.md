# SWT Final — Teil C — Step 10: Splash/Start-Screen

## Ziel

Vor dem Onboarding fehlte ein Einstiegs-Screen mit Marke und klarem Call-to-
Action. Ergänzt: `SplashScreen` mit Logo-Badge, Wordmark "Meals", Claim
"Iss gut. Denk nicht drüber nach." und Button "Los geht's →".

## Architekturentscheidung

**Entscheidung:** Neuer `AppState`-Wert `"splash"` als Startzustand in
`App.tsx` (vorher startete die State-Machine direkt bei `"onboarding"`).
`SplashScreen.tsx` ist eine reine Präsentations-Komponente ohne eigene
Logik (kein API-Call, kein State außer dem `onStart`-Callback).

**Begründung:** Passt zum bestehenden Muster aus Step 05 (einfache
State-Machine statt Navigation-Library) — ein weiterer State-Wert reicht,
keine neue Abstraktion nötig. Das Logo ist als einfaches Farb-Badge mit "M"
umgesetzt (kein Bild-Asset vorhanden); reicht für den Zweck "Marke
präsent", ohne ein Icon-Set einzuführen.

## Verifikation

- `npm run typecheck` (root): grün über alle vier Workspaces.
- Bundle-Inhalt geprüft (`grep` auf "Los geht" und "Denk nicht" im
  ausgelieferten Metro-Bundle) — beide Strings vorhanden, Lektion aus
  Step 05/07 angewendet (nicht nur "kompiliert fehlerfrei" vertrauen).

## Referenzierte Requirements

Keine direkte REQ-Zuordnung — UI-Polish auf Wunsch, ergänzt den
Onboarding-Einstieg (REQ-001).

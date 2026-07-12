# SWT Final — Teil C — Step 16: Expo-Go-Kompatibilität (SDK 57 → 54)

## Ziel

Beim Testen auf einem echten iPhone über die Expo-Go-App aus dem App Store
kam "Project is incompatible with this version of Expo Go". Root Cause
identifizieren und beheben.

## Root Cause

Das `expo`-npm-Paket versioniert seit einigen Jahren 1:1 nach SDK-Nummer
(bestätigt über `npm view expo versions`: Major-Versionen 48–57 existieren
parallel zu den entsprechenden Expo-SDKs). Das Projekt stand auf
`expo@~57.0.4` (SDK 57). Die installierte Expo-Go-App war die Store-Version
54.0.2 — laut Nutzerangabe seit 9 Monaten nicht aktualisiert, was zeitlich
zur SDK-Release-Kadenz passt (~alle 3 Monate ein neuer SDK-Major, 57–54 = 3
Sprünge ≈ 9 Monate). Jede Expo-Go-App-Version unterstützt nur *ihre* SDK-
Version — daher die Inkompatibilität.

## Fix

**Entscheidung:** `expo` per `npx expo install expo@^54.0.0` auf SDK 54
heruntergestuft, danach `npx expo install --fix`, um alle abhängigen
Pakete (`react`, `react-native`, `react-dom`, `@expo/metro-runtime`,
`expo-status-bar`, `@types/react`) auf die von Expo für SDK 54 als
kompatibel deklarierten Versionen zu bringen.

**Nebenbefund:** Nach dem Fix meldete `npm ls typescript` eine
`invalid`-Version — eine verwaiste, lokal in `apps/mobile/node_modules`
verschachtelte `typescript@6.0.3`-Kopie kollidierte mit der von `apps/
mobile/package.json` (nach dem Fix: `~5.9.2`) geforderten Version. Behoben
durch `npm install typescript@~5.9.2 --workspace=@meals/mobile`, wodurch
npm die Version workspace-weit auf `5.9.3` (root-kompatibel) konsolidiert
hat — vorher gab es zwei verschiedene TypeScript-Versionen im selben
Monorepo, was früher oder später zu inkonsistenten Typecheck-Ergebnissen
zwischen Editor und CI hätte führen können.

**Bewusst keine SDK-Versionsfixierung im Code dokumentiert** (kein
Kommentar "SDK 54 wegen Nutzer-Expo-Go-Version") — das ist eine reine
Umgebungs-/Test-Anforderung, keine fachliche Entscheidung, und könnte sich
ändern, sobald die installierte Expo-Go-App aktualisiert wird.

## Verifikation

- `npx expo-doctor`: 20/20 Checks bestanden (projektinterne Konsistenz;
  prüft nicht gegen die auf einem Gerät installierte Expo-Go-Version, da
  das CLI diese nicht kennt).
- `npm ls typescript`: keine `invalid`-Meldung mehr, einheitlich `5.9.3`
  über alle vier Workspaces.
- `npm run typecheck` (root): weiterhin grün über alle vier Workspaces.
- Metro-Server-Manifest live abgefragt (`curl` mit
  `Accept: application/expo+json`): liefert `"sdkVersion": "54.0.0"` und
  `"runtimeVersion": "exposdk:54.0.0"` — genau die Version, die Expo Go
  54.0.2 laut Store-Angabe unterstützt.
- Web- und iOS-Bundle kompilieren weiterhin fehlerfrei (200 OK für beide
  Plattform-Bundle-Requests).

## Referenzierte Requirements

Keine direkte REQ-Zuordnung — Tooling-/Kompatibilitätsfix für reales
Geräte-Testing.

## Hinweis für den Nutzer

Mit `npx expo start` (LAN) oder `npx expo start --tunnel` (falls Handy und
Rechner nicht im selben Netzwerk sind) sollte die Expo-Go-App auf dem
iPhone den QR-Code jetzt akzeptieren. Falls die Expo-Go-App selbst später
aktualisiert wird (neue SDK-Version), muss dieser Downgrade ggf. wieder
rückgängig gemacht bzw. neu abgestimmt werden — SDK-Version des Projekts
und der installierten Expo-Go-App müssen immer exakt übereinstimmen.

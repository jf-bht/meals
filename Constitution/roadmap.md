
| Iteration     | Zeitraum  | Fokus                                                 |
| ------------- | --------- | ----------------------------------------------------- |
| MVP (Iter. 1) | Monat 1–2 | Onboarding + Rezept-Matching + Wochenplan             |
| Iter. 2       | Monat 3–4 | Einkaufsliste + Kochtage-Planung                      |
| Iter. 3       | Monat 5–6 | Kalender-Sync + Präferenz-Verfeinerung                |
| Premium Alpha | Monat 7+  | Health-App-Integration + Drittanbieter-Schnittstellen |

## Iteration 1 — MVP: Onboarding & Planung

**Ziel:** Der Nutzer kann die App installieren, sein Profil anlegen und einen ersten Wochenplan erhalten.

### Features
- Onboarding-Flow: Alter, Größe, Gewicht, Aktivitätslevel, Ziel (abnehmen / halten / zunehmen)
- Makro-Berechnung: Protein (KG × 1,5 g), Fett (KG × 1,0 g), Kohlenhydrate (Rest)
- Präferenz-Auswahl: Fleischesser / Vegetarisch / Vegan + Allergien
- Rezept-Matching aus initialem Pool (≥ 50 Rezepte)
- Anzeige Wochenplan (7 Tage, 3 Mahlzeiten/Tag)

### Nicht im Scope
- Einkaufsliste (Iter. 2)
- Kalender-Sync (Iter. 3)
- Health-App (Premium)

## Iteration 2 — Einkaufsliste & Kochtage

**Ziel:** Aus dem generierten Plan wird automatisch eine konsolidierte Einkaufsliste erstellt; Kochtage werden vorgeschlagen.

### Features
- Automatische Einkaufslisten-Generierung (Zutaten aggregiert, nach Kategorie sortiert)
- Kochtage-Vorschlag (z. B. Sonntag kochen für Mo+Di)
- Manuelle Anpassung einzelner Mahlzeiten (Swap-Funktion)
- Export / Teilen der Einkaufsliste (iOS Share Sheet / Android Intent)

---

## Iteration 3 — Kalender & Verfeinerung

**Ziel:** Der Plan passt sich dem persönlichen Alltag an.

### Features
- Kalender-Integration (iOS Calendar / Google Calendar) für Kochtage
- Feedback-Loop: Nutzer bewertet Mahlzeiten → beeinflusst künftige Vorschläge
- Erinnerungen (Push-Notifications: Kochtag heute, Einkauf morgen)

---

## Premium Roadmap (nach Modul-Scope)
- Apple Health / Google Fit Pull (Schritte, aktiver Kalorienverbrauch → dynamische Makro-Anpassung)
- Schnittstellen zu Bring!, AnyList, Rewe-Online
- Erweiterte Rezeptbibliothek (Community-Rezepte, Import via URL)

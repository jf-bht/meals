import type { ActivityLevel, DietType, Gender, Goal } from "../api/types";

// Deutsche Anzeige-Labels für die Onboarding-Werte — zentral gepflegt,
// damit ProfilScreen (und künftige Read-only-Ansichten) dieselben Texte
// wie der Onboarding-Flow verwenden, ohne die dortigen Options-Arrays
// (die zusätzlich Untertitel für die Auswahl-UI tragen) duplizieren zu
// müssen.
export const GENDER_LABELS: Record<Gender, string> = {
  female: "Weiblich",
  male: "Männlich",
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: "Sitzend",
  light: "Leicht aktiv",
  moderate: "Moderat aktiv",
  active: "Sehr aktiv",
  very_active: "Extrem aktiv",
};

export const GOAL_LABELS: Record<Goal, string> = {
  maintain: "Gewicht halten",
  lose: "Gewicht verlieren",
  gain: "Muskeln aufbauen",
};

export const DIET_LABELS: Record<DietType, string> = {
  omnivore: "Alles",
  vegetarian: "Vegetarisch",
  vegan: "Vegan",
};

// Muss mit den Allergen-Tokens aus services/matching-service/src/recipes.ts
// übereinstimmen (siehe OnboardingScreen.tsx ALLERGY_OPTIONS).
export const ALLERGY_LABELS: Record<string, string> = {
  dairy: "Laktose",
  gluten: "Gluten",
  peanut: "Nüsse",
  egg: "Eier",
  fish: "Fisch",
  soy: "Soja",
  sesame: "Sesam",
};

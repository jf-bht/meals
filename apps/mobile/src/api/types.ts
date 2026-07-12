// Diese Typen spiegeln die REST-Verträge von matching-service und
// grocery-service. Bewusst kein Import aus services/* — die Mobile-App ist
// ein unabhängiges Modul, das nur über HTTP mit den Services spricht (siehe
// README-Architektur). Weicht die Server-Antwort ab, bricht das hier,
// nicht heimlich zur Laufzeit.

export type Gender = "male" | "female";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";
export type Goal = "lose" | "maintain" | "gain";
export type DietType = "omnivore" | "vegetarian" | "vegan";

export interface MacroInput {
  gender: Gender;
  ageYears: number;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: Goal;
}

export interface MacroResult {
  bmrKcal: number;
  calorieTargetKcal: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
}

export interface RecipeMacros {
  kcal: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
}

export interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
}

export type MealType = "breakfast" | "lunch" | "dinner";

export interface Recipe {
  id: string;
  name: string;
  dietType: DietType;
  allergens: string[];
  mealTypes: MealType[];
  prepTimeMinutes: number;
  macrosPerPortion: RecipeMacros;
  ingredientsPerPortion: Ingredient[];
}

export interface MatchInput {
  dietType: DietType;
  allergies: string[];
  targetMacros: RecipeMacros;
  recentRecipeIds: string[];
  relaxMacros?: boolean;
  mealType?: MealType;
}

export interface MatchResult {
  recipe: Recipe;
  candidateCount: number;
  scaled: boolean;
}

export interface WeekPlanMeal {
  day: number; // 0 = Montag … 6 = Sonntag
  mealType: MealType;
  recipe: Recipe;
}

export interface GroceryListItem {
  name: string;
  quantity: number;
  unit: string;
  category: string;
}

export interface GroceryListGroup {
  category: string;
  items: GroceryListItem[];
}

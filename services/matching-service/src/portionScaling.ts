import type { Recipe } from "./recipes.js";
import type { RecipeMacros } from "./recipes.js";

/**
 * Näherungswerte (kcal/g und Kohlenhydrat-g/g) für die im Rezept-Pool
 * verwendeten Kohlenhydrat-Quellen. Bewusst grobe, literaturübliche Werte
 * für Trocken-/Rohgewicht (z. B. Reis ungekocht) — keine diätologische
 * Präzision, sondern eine plausible Grundlage, um die Portionsgröße
 * automatisch an das Kalorienziel anzupassen.
 */
const CARB_SOURCE_DENSITY: Record<string, { kcalPerG: number; carbsGPerG: number }> = {
  "reis": { kcalPerG: 3.5, carbsGPerG: 0.78 },
  "vollkornreis": { kcalPerG: 3.4, carbsGPerG: 0.75 },
  "kartoffel": { kcalPerG: 0.77, carbsGPerG: 0.17 },
  "süßkartoffel": { kcalPerG: 0.86, carbsGPerG: 0.2 },
  "couscous": { kcalPerG: 3.76, carbsGPerG: 0.77 },
  "quinoa": { kcalPerG: 3.68, carbsGPerG: 0.64 },
  "vollkornbrot": { kcalPerG: 2.5, carbsGPerG: 0.41 },
  "haferflocken": { kcalPerG: 3.89, carbsGPerG: 0.66 },
  "müsli": { kcalPerG: 3.75, carbsGPerG: 0.65 },
};

const MIN_GRAMS = 20;
const MAX_GRAMS = 400;
const MIN_SCALE_FACTOR = 0.3;
const MAX_SCALE_FACTOR = 3;

export interface ScaledRecipeResult {
  recipe: Recipe;
  scaled: boolean;
}

function normalize(name: string): string {
  return name.trim().toLowerCase();
}

function round5(value: number): number {
  return Math.round(value / 5) * 5;
}

/**
 * REQ-002 definiert Kohlenhydrate als "Rest" der Tageskalorien — dieselbe
 * Idee wird hier auf Rezept-Ebene angewendet: Protein-/Fett-Zutaten bleiben
 * unverändert (sie sind an den fixen Körpergewichts-Bedarf gekoppelt),
 * nur die Menge der Kohlenhydrat-Quelle wird so angepasst, dass die
 * Gesamt-Kalorien des Rezepts näher am Pro-Mahlzeit-Ziel liegen — z. B.
 * 250g statt 200g Reis, ohne die Fleisch-/Fisch-/Tofu-Menge zu verändern.
 */
export function scaleRecipeToTarget(recipe: Recipe, target: RecipeMacros): ScaledRecipeResult {
  const carbIndex = recipe.ingredientsPerPortion.findIndex(
    (ingredient) => normalize(ingredient.name) in CARB_SOURCE_DENSITY,
  );

  if (carbIndex === -1) {
    return { recipe, scaled: false };
  }

  const carbIngredient = recipe.ingredientsPerPortion[carbIndex]!;
  const density = CARB_SOURCE_DENSITY[normalize(carbIngredient.name)]!;

  const currentCarbKcal = carbIngredient.quantity * density.kcalPerG;
  const otherKcal = recipe.macrosPerPortion.kcal - currentCarbKcal;
  const desiredCarbKcal = Math.max(MIN_GRAMS * density.kcalPerG, target.kcal - otherKcal);
  const rawNewQuantity = desiredCarbKcal / density.kcalPerG;

  const clampedQuantity = Math.min(
    Math.max(rawNewQuantity, carbIngredient.quantity * MIN_SCALE_FACTOR, MIN_GRAMS),
    carbIngredient.quantity * MAX_SCALE_FACTOR,
    MAX_GRAMS,
  );
  const newQuantity = round5(clampedQuantity);

  if (newQuantity === carbIngredient.quantity) {
    return { recipe, scaled: false };
  }

  const quantityDelta = newQuantity - carbIngredient.quantity;
  const newKcal = Math.round(recipe.macrosPerPortion.kcal + quantityDelta * density.kcalPerG);
  const newCarbsG = Math.max(
    0,
    Math.round((recipe.macrosPerPortion.carbsG + quantityDelta * density.carbsGPerG) * 10) / 10,
  );

  const newIngredients = recipe.ingredientsPerPortion.map((ingredient, index) =>
    index === carbIndex ? { ...ingredient, quantity: newQuantity } : ingredient,
  );

  return {
    recipe: {
      ...recipe,
      macrosPerPortion: { ...recipe.macrosPerPortion, kcal: newKcal, carbsG: newCarbsG },
      ingredientsPerPortion: newIngredients,
    },
    scaled: true,
  };
}

import { z } from "zod";
import { DietType, RECIPE_POOL, type Recipe, type RecipeMacros } from "./recipes.js";

// Diät-Hierarchie: welche Rezept-Diät-Typen darf ein Nutzer mit gegebenem
// Diät-Typ essen? vegan ⊂ vegetarian ⊂ omnivore.
const ALLOWED_RECIPE_DIETS: Record<DietType, DietType[]> = {
  omnivore: ["omnivore", "vegetarian", "vegan"],
  vegetarian: ["vegetarian", "vegan"],
  vegan: ["vegan"],
};

const MACRO_TOLERANCE = 0.15; // ±15 % laut REQ-003
const NO_REPEAT_DAYS = 5;

export const MatchInput = z.object({
  dietType: DietType,
  allergies: z.array(z.string()).default([]),
  targetMacros: z.object({
    kcal: z.number().positive(),
    proteinG: z.number().nonnegative(),
    fatG: z.number().nonnegative(),
    carbsG: z.number().nonnegative(),
  }),
  // Rezept-IDs, die in den letzten NO_REPEAT_DAYS Tagen bereits verwendet
  // wurden. Der Service hat keinen eigenen Persistenz-Layer (kein
  // In-Process-State über Requests hinweg) — der Aufrufer (z. B.
  // grocery-service oder die Mobile-App) liefert den relevanten Zeitraum
  // selbst an.
  recentRecipeIds: z.array(z.string()).default([]),
});
export type MatchInput = z.infer<typeof MatchInput>;

export interface MatchResult {
  recipe: Recipe;
  candidateCount: number;
}

function isWithinTolerance(actual: number, target: number, tolerance: number): boolean {
  if (target === 0) return actual === 0;
  return Math.abs(actual - target) / target <= tolerance;
}

function matchesMacros(macros: RecipeMacros, target: RecipeMacros): boolean {
  return (
    isWithinTolerance(macros.kcal, target.kcal, MACRO_TOLERANCE) &&
    isWithinTolerance(macros.proteinG, target.proteinG, MACRO_TOLERANCE) &&
    isWithinTolerance(macros.fatG, target.fatG, MACRO_TOLERANCE) &&
    isWithinTolerance(macros.carbsG, target.carbsG, MACRO_TOLERANCE)
  );
}

/** Relative Abweichung der Rezept-Makros vom Ziel — je kleiner, desto besser passt es. */
function macroDistance(macros: RecipeMacros, target: RecipeMacros): number {
  const rel = (actual: number, goal: number) => (goal === 0 ? 0 : Math.abs(actual - goal) / goal);
  return (
    rel(macros.kcal, target.kcal) +
    rel(macros.proteinG, target.proteinG) +
    rel(macros.fatG, target.fatG) +
    rel(macros.carbsG, target.carbsG)
  );
}

export function filterCandidates(input: MatchInput, pool: Recipe[] = RECIPE_POOL): Recipe[] {
  const allowedDiets = new Set(ALLOWED_RECIPE_DIETS[input.dietType]);
  const recentIds = new Set(input.recentRecipeIds);

  return pool.filter((recipe) => {
    if (!allowedDiets.has(recipe.dietType)) return false;
    if (recipe.allergens.some((a) => input.allergies.includes(a))) return false;
    if (recentIds.has(recipe.id)) return false; // 5-Tage-Wiederholungssperre
    if (!matchesMacros(recipe.macrosPerPortion, input.targetMacros)) return false;
    return true;
  });
}

/**
 * Gewichtete Zufallsauswahl: Rezepte mit geringerer Abweichung von den
 * Makro-Zielen erhalten ein höheres Gewicht, sodass die Auswahl variabel
 * bleibt (REQ-003: "Variabilität ohne Wiederholung"), aber nicht rein
 * gleichverteilt ist.
 */
export function weightedPick(
  candidates: Recipe[],
  target: RecipeMacros,
  rng: () => number = Math.random,
): Recipe {
  if (candidates.length === 0) {
    throw new Error("no_candidates");
  }

  const weights = candidates.map((recipe) => 1 / (1 + macroDistance(recipe.macrosPerPortion, target)));
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);

  let threshold = rng() * totalWeight;
  for (let i = 0; i < candidates.length; i++) {
    threshold -= weights[i]!;
    if (threshold <= 0) return candidates[i]!;
  }
  return candidates[candidates.length - 1]!;
}

export function matchRecipe(
  rawInput: MatchInput,
  pool: Recipe[] = RECIPE_POOL,
  rng: () => number = Math.random,
): MatchResult {
  const input = MatchInput.parse(rawInput);
  const candidates = filterCandidates(input, pool);
  if (candidates.length === 0) {
    throw new Error("no_candidates");
  }
  return {
    recipe: weightedPick(candidates, input.targetMacros, rng),
    candidateCount: candidates.length,
  };
}

export { NO_REPEAT_DAYS, MACRO_TOLERANCE };

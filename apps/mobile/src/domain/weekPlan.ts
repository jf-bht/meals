import { matchRecipe } from "../api/client";
import type { DietType, MacroResult, MealType, Recipe, RecipeMacros, WeekPlanMeal } from "../api/types";

const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner"];
const NO_REPEAT_DAYS = 5; // REQ-003

function perMealTarget(dailyMacros: MacroResult): RecipeMacros {
  // Tagesziel wird zu gleichen Teilen auf 3 Mahlzeiten verteilt — REQ-002
  // definiert nur ein Tagesziel, keine Mahlzeiten-Aufteilung. Gleiche
  // Annahme wie schon in Step 03 (matching-service) dokumentiert.
  return {
    kcal: dailyMacros.calorieTargetKcal / 3,
    proteinG: dailyMacros.proteinG / 3,
    fatG: dailyMacros.fatG / 3,
    carbsG: dailyMacros.carbsG / 3,
  };
}

/**
 * Drei Eskalationsstufen gegen den kleinen Demo-Rezept-Pool — Reihenfolge
 * bewusst "Variabilität vor Makro-Genauigkeit" (REQ-003: "Variabilität
 * ohne Wiederholung", siehe Step 08 für die Begründung der Reihenfolge):
 * (1) exakt wie angefragt (Makro-Toleranz + 5-Tage-Sperre).
 * (2) Makro-Toleranz lockern, 5-Tage-Sperre bleibt aktiv.
 * (3) zusätzlich die 5-Tage-Sperre ignorieren — letzter Ausweg, akzeptiert
 *     Wiederholungen. `guaranteedExclude` bleibt auch hier ausgeschlossen
 *     (z. B. beim Tausch: nie wieder dasselbe Rezept zurückgeben).
 */
async function matchWithEscalation(params: {
  dietType: DietType;
  allergies: string[];
  targetMacros: RecipeMacros;
  mealType: MealType;
  recentRecipeIds: string[];
  guaranteedExclude?: string[];
}): Promise<Recipe> {
  const guaranteedExclude = params.guaranteedExclude ?? [];
  const attempts = [
    { recentRecipeIds: params.recentRecipeIds, relaxMacros: false },
    { recentRecipeIds: params.recentRecipeIds, relaxMacros: true },
    { recentRecipeIds: guaranteedExclude, relaxMacros: true },
  ];

  let lastError: unknown;
  for (const attempt of attempts) {
    try {
      const { recipe } = await matchRecipe({
        dietType: params.dietType,
        allergies: params.allergies,
        targetMacros: params.targetMacros,
        mealType: params.mealType,
        ...attempt,
      });
      return recipe;
    } catch (err) {
      lastError = err;
      if (!(err instanceof Error && err.message.includes("request_failed:404"))) {
        throw err;
      }
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("Kein passendes Rezept für diese Diät/Allergie-Kombination im Demo-Pool vorhanden.");
}

/**
 * REQ-004: 7-Tage-Plan mit je 3 Mahlzeiten. Ruft für jeden Slot
 * matching-service /v1/recipes/match auf und hält dabei die 5-Tage-Sperre
 * aus REQ-003 über ein rollierendes Fenster der zuletzt verwendeten
 * Rezept-IDs ein (siehe Step 03: der Service selbst ist zustandslos, die
 * Historie liegt beim Aufrufer — hier: der Mobile-Client).
 */
export async function generateWeekPlan(params: {
  dietType: DietType;
  allergies: string[];
  dailyMacros: MacroResult;
}): Promise<WeekPlanMeal[]> {
  const target = perMealTarget(params.dailyMacros);
  const usedRecipes: { id: string; day: number }[] = [];
  const meals: WeekPlanMeal[] = [];

  for (let day = 0; day < 7; day++) {
    for (const mealType of MEAL_TYPES) {
      const recentRecipeIds = usedRecipes.filter((u) => day - u.day < NO_REPEAT_DAYS).map((u) => u.id);
      const recipe = await matchWithEscalation({
        dietType: params.dietType,
        allergies: params.allergies,
        targetMacros: target,
        mealType,
        recentRecipeIds,
      });
      usedRecipes.push({ id: recipe.id, day });
      meals.push({ day, mealType, recipe });
    }
  }

  return meals;
}

/**
 * REQ-009: Einzelne Mahlzeit gegen eine Alternative aus dem Rezept-Pool
 * tauschen, ohne den gesamten Plan neu zu generieren. `mealToReplace.recipe.id`
 * wird garantiert ausgeschlossen (auch in der letzten Eskalationsstufe) —
 * "tauschen" impliziert ein anderes Ergebnis, nie dasselbe Rezept erneut.
 * Andere Mahlzeiten innerhalb der 5-Tage-Sperre bleiben zusätzlich
 * ausgeschlossen, damit der Tausch nicht versehentlich eine anderswo im
 * Plan bereits verwendete Wiederholung erzeugt.
 */
export async function swapMeal(params: {
  dietType: DietType;
  allergies: string[];
  dailyMacros: MacroResult;
  mealToReplace: WeekPlanMeal;
  allMeals: WeekPlanMeal[];
}): Promise<Recipe> {
  const target = perMealTarget(params.dailyMacros);
  const nearbyRecipeIds = params.allMeals
    .filter(
      (m) =>
        !(m.day === params.mealToReplace.day && m.mealType === params.mealToReplace.mealType) &&
        Math.abs(m.day - params.mealToReplace.day) < NO_REPEAT_DAYS,
    )
    .map((m) => m.recipe.id);

  return matchWithEscalation({
    dietType: params.dietType,
    allergies: params.allergies,
    targetMacros: target,
    mealType: params.mealToReplace.mealType,
    recentRecipeIds: [params.mealToReplace.recipe.id, ...nearbyRecipeIds],
    guaranteedExclude: [params.mealToReplace.recipe.id],
  });
}

import { matchRecipe } from "../api/client";
import type { DietType, MacroResult, MealType, WeekPlanMeal } from "../api/types";

const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner"];
const NO_REPEAT_DAYS = 5; // REQ-003

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
  // Tagesziel wird zu gleichen Teilen auf 3 Mahlzeiten verteilt — REQ-002
  // definiert nur ein Tagesziel, keine Mahlzeiten-Aufteilung. Gleiche
  // Annahme wie schon in Step 03 (matching-service) dokumentiert.
  const perMealTarget = {
    kcal: params.dailyMacros.calorieTargetKcal / 3,
    proteinG: params.dailyMacros.proteinG / 3,
    fatG: params.dailyMacros.fatG / 3,
    carbsG: params.dailyMacros.carbsG / 3,
  };

  const usedRecipes: { id: string; day: number }[] = [];
  const meals: WeekPlanMeal[] = [];

  for (let day = 0; day < 7; day++) {
    for (const mealType of MEAL_TYPES) {
      const recentRecipeIds = usedRecipes.filter((u) => day - u.day < NO_REPEAT_DAYS).map((u) => u.id);

      // Drei Eskalationsstufen — Reihenfolge bewusst "Variabilität vor
      // Makro-Genauigkeit" (REQ-003: "Variabilität ohne Wiederholung"):
      // (1) exakt wie angefragt (Makro-Toleranz + 5-Tage-Sperre).
      // (2) Makro-Toleranz lockern, 5-Tage-Sperre bleibt aktiv — wenn nur
      //     ein einziges Rezept im Pool die Kalorien-Toleranz trifft (wie
      //     bei sehr hohem/niedrigem Bedarf), würde reines "Sperre
      //     ignorieren" (alte Reihenfolge, Step 06) exakt dasselbe Rezept
      //     zurückgeben — keine Wiederholungssperre kann greifen, wenn es
      //     nur einen Kandidaten gibt. Erst die größere Auswahl aus dem
      //     kompletten Diät/Allergie-kompatiblen Pool macht die Sperre
      //     wirksam.
      // (3) Nur wenn selbst das den Pool erschöpft (z. B. sehr enge
      //     Diät/Allergie-Kombination), zusätzlich die 5-Tage-Sperre
      //     ignorieren — letzter Ausweg, akzeptiert Wiederholungen.
      const attempts = [
        { recentRecipeIds, relaxMacros: false },
        { recentRecipeIds, relaxMacros: true },
        { recentRecipeIds: [], relaxMacros: true },
      ];

      let recipe;
      let lastError: unknown;
      for (const attempt of attempts) {
        try {
          recipe = (
            await matchRecipe({
              dietType: params.dietType,
              allergies: params.allergies,
              targetMacros: perMealTarget,
              ...attempt,
            })
          ).recipe;
          break;
        } catch (err) {
          lastError = err;
          if (!(err instanceof Error && err.message.includes("request_failed:404"))) {
            throw err;
          }
        }
      }
      if (!recipe) {
        throw lastError instanceof Error
          ? lastError
          : new Error("Kein Rezept für diese Diät/Allergie-Kombination im Demo-Pool vorhanden.");
      }

      usedRecipes.push({ id: recipe.id, day });
      meals.push({ day, mealType, recipe });
    }
  }

  return meals;
}

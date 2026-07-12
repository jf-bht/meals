import { z } from "zod";
import {
  aggregateIngredients,
  groupByCategory,
  type GroceryListGroup,
  type RecipeForGroceryList,
  type WeekPlanEntry,
} from "./groceryList.js";

// Struktureller Vertrag an der Service-Grenze: grocery-service importiert
// keinen Code aus matching-service, sondern validiert dessen REST-Response
// eigenständig gegen dieses Schema. Nur die für REQ-005 relevanten Felder
// werden geprüft — zusätzliche Felder der Antwort (z. B. macrosPerPortion)
// werden von Zod ignoriert.
const RemoteRecipeSchema = z.object({
  id: z.string(),
  ingredientsPerPortion: z.array(
    z.object({
      name: z.string(),
      quantity: z.number(),
      unit: z.string(),
    }),
  ),
});
export type RemoteRecipe = z.infer<typeof RemoteRecipeSchema>;

export type FetchRecipeFn = (recipeId: string) => Promise<RemoteRecipe>;

export function createMatchingServiceClient(baseUrl: string, fetchImpl: typeof fetch = fetch): {
  fetchRecipe: FetchRecipeFn;
} {
  const fetchRecipe: FetchRecipeFn = async (recipeId) => {
    const response = await fetchImpl(`${baseUrl}/v1/recipes/${recipeId}`);
    if (response.status === 404) {
      throw new Error(`recipe_not_found:${recipeId}`);
    }
    if (!response.ok) {
      throw new Error(`matching_service_error:${response.status}`);
    }
    const body = await response.json();
    return RemoteRecipeSchema.parse(body);
  };
  return { fetchRecipe };
}

export interface WeekPlanRequestEntry {
  recipeId: string;
  portions: number;
}

/**
 * REQ-005 Orchestrierung: pro (eindeutiger) Rezept-ID im Wochenplan ein
 * Rezept vom matching-service laden, dann Zutaten aggregieren und nach
 * Kategorie gruppieren. Rezepte werden nur einmal pro ID geladen, auch
 * wenn sie mehrfach im Wochenplan vorkommen (z. B. Meal Prep).
 */
export async function buildGroceryList(
  weekPlan: WeekPlanRequestEntry[],
  fetchRecipe: FetchRecipeFn,
): Promise<GroceryListGroup[]> {
  const uniqueRecipeIds = [...new Set(weekPlan.map((entry) => entry.recipeId))];
  const recipesById = new Map<string, RecipeForGroceryList>();

  for (const recipeId of uniqueRecipeIds) {
    recipesById.set(recipeId, await fetchRecipe(recipeId));
  }

  const entries: WeekPlanEntry[] = weekPlan.map((planEntry) => ({
    recipe: recipesById.get(planEntry.recipeId)!,
    portions: planEntry.portions,
  }));

  return groupByCategory(aggregateIngredients(entries));
}

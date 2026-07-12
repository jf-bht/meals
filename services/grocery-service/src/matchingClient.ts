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
  // Optional: die tatsächlich verwendeten Zutatenmengen für diese
  // Mahlzeit. matching-service kann die Kohlenhydrat-Quelle pro Mahlzeit
  // automatisch skalieren (siehe matching-service/src/portionScaling.ts,
  // REQ-002 "Kohlenhydrate = Rest" auf Rezept-Ebene angewendet) — die
  // Basis-Zutaten unter derselben recipeId beim erneuten Abruf per
  // GET /v1/recipes/:id wären dann nicht mehr korrekt. Ist dieses Feld
  // gesetzt, wird es verwendet und recipeId nicht erneut abgerufen.
  ingredientsPerPortion?: RecipeForGroceryList["ingredientsPerPortion"];
}

/**
 * REQ-005 Orchestrierung: pro Wochenplan-Eintrag entweder die mitgelieferten
 * (ggf. skalierten) Zutaten verwenden, oder — falls nicht mitgeliefert —
 * das Rezept per REST vom matching-service laden (pro eindeutiger
 * Rezept-ID nur einmal, auch wenn sie mehrfach im Wochenplan vorkommt).
 * Danach: Zutaten aggregieren und nach Kategorie gruppieren.
 */
export async function buildGroceryList(
  weekPlan: WeekPlanRequestEntry[],
  fetchRecipe: FetchRecipeFn,
): Promise<GroceryListGroup[]> {
  const recipeIdsToFetch = [
    ...new Set(weekPlan.filter((entry) => !entry.ingredientsPerPortion).map((entry) => entry.recipeId)),
  ];
  const recipesById = new Map<string, RecipeForGroceryList>();

  for (const recipeId of recipeIdsToFetch) {
    recipesById.set(recipeId, await fetchRecipe(recipeId));
  }

  const entries: WeekPlanEntry[] = weekPlan.map((planEntry) => ({
    recipe: {
      id: planEntry.recipeId,
      ingredientsPerPortion: planEntry.ingredientsPerPortion ?? recipesById.get(planEntry.recipeId)!.ingredientsPerPortion,
    },
    portions: planEntry.portions,
  }));

  return groupByCategory(aggregateIngredients(entries));
}

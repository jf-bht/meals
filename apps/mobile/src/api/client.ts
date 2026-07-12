import type { MacroInput, MacroResult, MatchInput, MatchResult, GroceryListGroup, Ingredient } from "./types";

// EXPO_PUBLIC_-Variablen werden von Expo zur Build-Zeit eingebettet (siehe
// .env.example). Fallback auf localhost für iOS-Simulator/Web — im
// Android-Emulator muss stattdessen 10.0.2.2 verwendet werden (bekannte
// Einschränkung, siehe docs/SWT_FINAL_STEP05).
const MATCHING_SERVICE_URL = process.env.EXPO_PUBLIC_MATCHING_SERVICE_URL ?? "http://localhost:3001";
const GROCERY_SERVICE_URL = process.env.EXPO_PUBLIC_GROCERY_SERVICE_URL ?? "http://localhost:3002";

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`request_failed:${response.status}:${text}`);
  }
  return response.json() as Promise<T>;
}

export function calculateMacros(input: MacroInput): Promise<MacroResult> {
  return postJson<MacroResult>(`${MATCHING_SERVICE_URL}/v1/macros`, input);
}

export function matchRecipe(input: MatchInput): Promise<MatchResult> {
  return postJson<MatchResult>(`${MATCHING_SERVICE_URL}/v1/recipes/match`, input);
}

export function fetchGroceryList(
  weekPlan: { recipeId: string; portions: number; ingredientsPerPortion?: Ingredient[] }[],
): Promise<{ groups: GroceryListGroup[] }> {
  return postJson<{ groups: GroceryListGroup[] }>(`${GROCERY_SERVICE_URL}/v1/grocery-list`, { weekPlan });
}

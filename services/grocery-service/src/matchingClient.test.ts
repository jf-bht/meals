import { test } from "node:test";
import assert from "node:assert/strict";
import { buildGroceryList, type RemoteRecipe } from "./matchingClient.js";

const recipes: Record<string, RemoteRecipe> = {
  "r-01": {
    id: "r-01",
    ingredientsPerPortion: [
      { name: "Hähnchenbrust", quantity: 150, unit: "g" },
      { name: "Reis", quantity: 80, unit: "g" },
    ],
  },
  "r-08": {
    id: "r-08",
    ingredientsPerPortion: [{ name: "Rote Linsen", quantity: 100, unit: "g" }],
  },
};

function fakeFetchRecipe(callLog: string[]) {
  return async (recipeId: string) => {
    callLog.push(recipeId);
    const recipe = recipes[recipeId];
    if (!recipe) throw new Error(`recipe_not_found:${recipeId}`);
    return recipe;
  };
}

test("buildGroceryList lädt jedes Rezept und aggregiert die Zutaten", async () => {
  const callLog: string[] = [];
  const groups = await buildGroceryList(
    [
      { recipeId: "r-01", portions: 2 },
      { recipeId: "r-08", portions: 1 },
    ],
    fakeFetchRecipe(callLog),
  );

  const allItems = groups.flatMap((g) => g.items);
  const haehnchen = allItems.find((i) => i.name === "Hähnchenbrust");
  assert.equal(haehnchen!.quantity, 300); // 150 * 2
});

test("buildGroceryList ruft dieselbe Rezept-ID nur einmal ab, auch bei Mehrfachvorkommen", async () => {
  const callLog: string[] = [];
  await buildGroceryList(
    [
      { recipeId: "r-01", portions: 1 },
      { recipeId: "r-01", portions: 1 },
    ],
    fakeFetchRecipe(callLog),
  );
  assert.equal(callLog.length, 1);
});

test("buildGroceryList propagiert einen Fehler, wenn ein Rezept nicht existiert", async () => {
  const callLog: string[] = [];
  await assert.rejects(
    buildGroceryList([{ recipeId: "r-99", portions: 1 }], fakeFetchRecipe(callLog)),
    /recipe_not_found/,
  );
});

test("buildGroceryList nutzt mitgelieferte ingredientsPerPortion ohne erneuten Fetch (skalierte Mahlzeiten)", async () => {
  const callLog: string[] = [];
  const groups = await buildGroceryList(
    [
      {
        recipeId: "r-01",
        portions: 1,
        // Skalierte Menge (z. B. 250g statt Basis-80g Reis) — muss 1:1
        // übernommen werden, nicht die Basis-Menge von matching-service.
        ingredientsPerPortion: [
          { name: "Hähnchenbrust", quantity: 150, unit: "g" },
          { name: "Reis", quantity: 250, unit: "g" },
        ],
      },
    ],
    fakeFetchRecipe(callLog),
  );

  assert.equal(callLog.length, 0, "fetchRecipe darf nicht aufgerufen werden, wenn Zutaten mitgeliefert wurden");
  const reis = groups.flatMap((g) => g.items).find((i) => i.name === "Reis");
  assert.equal(reis!.quantity, 250);
});

test("buildGroceryList mischt Einträge mit und ohne mitgelieferte Zutaten korrekt", async () => {
  const callLog: string[] = [];
  const groups = await buildGroceryList(
    [
      { recipeId: "r-01", portions: 1, ingredientsPerPortion: [{ name: "Reis", quantity: 300, unit: "g" }] },
      { recipeId: "r-08", portions: 1 },
    ],
    fakeFetchRecipe(callLog),
  );

  assert.deepEqual(callLog, ["r-08"]);
  const allItems = groups.flatMap((g) => g.items);
  assert.equal(allItems.find((i) => i.name === "Reis")!.quantity, 300);
  assert.ok(allItems.find((i) => i.name === "Rote Linsen"));
});

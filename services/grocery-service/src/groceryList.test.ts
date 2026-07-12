import { test } from "node:test";
import assert from "node:assert/strict";
import { aggregateIngredients, groupByCategory, type WeekPlanEntry } from "./groceryList.js";

const chicken: WeekPlanEntry["recipe"] = {
  id: "r-01",
  ingredientsPerPortion: [
    { name: "Hähnchenbrust", quantity: 150, unit: "g" },
    { name: "Reis", quantity: 80, unit: "g" },
    { name: "Brokkoli", quantity: 120, unit: "g" },
  ],
};

const beef: WeekPlanEntry["recipe"] = {
  id: "r-02",
  ingredientsPerPortion: [
    { name: "Reis", quantity: 70, unit: "g" },
    { name: "Süßkartoffel", quantity: 200, unit: "g" },
  ],
};

test("Zutaten aus mehreren Mahlzeiten werden nach Name+Einheit aggregiert", () => {
  const items = aggregateIngredients([
    { recipe: chicken, portions: 1 },
    { recipe: beef, portions: 1 },
  ]);

  const reis = items.find((i) => i.name === "Reis");
  assert.ok(reis);
  assert.equal(reis!.quantity, 150); // 80 + 70
});

test("Menge wird mit der Portionsanzahl skaliert", () => {
  const items = aggregateIngredients([{ recipe: chicken, portions: 3 }]);
  const haehnchen = items.find((i) => i.name === "Hähnchenbrust");
  assert.equal(haehnchen!.quantity, 450); // 150 * 3
});

test("Gleicher Name mit unterschiedlicher Einheit bleibt ein separater Posten", () => {
  const recipeA: WeekPlanEntry["recipe"] = {
    id: "a",
    ingredientsPerPortion: [{ name: "Zwiebel", quantity: 1, unit: "Stück" }],
  };
  const recipeB: WeekPlanEntry["recipe"] = {
    id: "b",
    ingredientsPerPortion: [{ name: "Zwiebel", quantity: 50, unit: "g" }],
  };
  const items = aggregateIngredients([
    { recipe: recipeA, portions: 1 },
    { recipe: recipeB, portions: 1 },
  ]);
  assert.equal(items.length, 2);
});

test("Bekannte Zutaten werden korrekt kategorisiert", () => {
  const items = aggregateIngredients([{ recipe: chicken, portions: 1 }]);
  const haehnchen = items.find((i) => i.name === "Hähnchenbrust");
  const brokkoli = items.find((i) => i.name === "Brokkoli");
  assert.equal(haehnchen!.category, "protein");
  assert.equal(brokkoli!.category, "produce");
});

test("Unbekannte Zutaten fallen auf Kategorie 'other', statt zu crashen", () => {
  const exotic: WeekPlanEntry["recipe"] = {
    id: "x",
    ingredientsPerPortion: [{ name: "Drachenfrucht", quantity: 1, unit: "Stück" }],
  };
  const items = aggregateIngredients([{ recipe: exotic, portions: 1 }]);
  assert.equal(items[0]!.category, "other");
});

test("groupByCategory gruppiert und sortiert alphabetisch innerhalb der Kategorie", () => {
  const items = aggregateIngredients([
    { recipe: chicken, portions: 1 },
    { recipe: beef, portions: 1 },
  ]);
  const groups = groupByCategory(items);

  const produce = groups.find((g) => g.category === "produce");
  assert.ok(produce);
  const names = produce!.items.map((i) => i.name);
  assert.deepEqual(names, [...names].sort((a, b) => a.localeCompare(b)));
});

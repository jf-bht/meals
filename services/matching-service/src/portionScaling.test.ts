import { test } from "node:test";
import assert from "node:assert/strict";
import { scaleRecipeToTarget } from "./portionScaling.js";
import { RECIPE_POOL } from "./recipes.js";

const chicken = RECIPE_POOL.find((r) => r.id === "r-01")!; // Hähnchen mit Reis, 80g Reis, 550 kcal
const lentilCurry = RECIPE_POOL.find((r) => r.id === "r-04")!; // kein bekannter Carb-Ingredient

test("Kohlenhydrat-Quelle wird hochskaliert, wenn das Ziel über der Basis-Portion liegt", () => {
  const result = scaleRecipeToTarget(chicken, { kcal: 750, proteinG: 45, fatG: 12, carbsG: 100 });
  assert.equal(result.scaled, true);

  const reis = result.recipe.ingredientsPerPortion.find((i) => i.name === "Reis")!;
  assert.ok(reis.quantity > 80, `Reis sollte mehr als 80g sein, ist ${reis.quantity}g`);
  assert.ok(result.recipe.macrosPerPortion.kcal > chicken.macrosPerPortion.kcal);
});

test("Protein-Zutat (Hähnchenbrust) bleibt beim Skalieren unverändert", () => {
  const result = scaleRecipeToTarget(chicken, { kcal: 750, proteinG: 45, fatG: 12, carbsG: 100 });
  const huhn = result.recipe.ingredientsPerPortion.find((i) => i.name === "Hähnchenbrust")!;
  assert.equal(huhn.quantity, 150);
});

test("Kohlenhydrat-Quelle wird herunterskaliert, wenn das Ziel unter der Basis-Portion liegt", () => {
  const result = scaleRecipeToTarget(chicken, { kcal: 450, proteinG: 45, fatG: 12, carbsG: 40 });
  assert.equal(result.scaled, true);
  const reis = result.recipe.ingredientsPerPortion.find((i) => i.name === "Reis")!;
  assert.ok(reis.quantity < 80, `Reis sollte weniger als 80g sein, ist ${reis.quantity}g`);
});

test("Menge wird nicht unter das Mindestmaß (20g) skaliert", () => {
  const result = scaleRecipeToTarget(chicken, { kcal: 100, proteinG: 45, fatG: 12, carbsG: 0 });
  const reis = result.recipe.ingredientsPerPortion.find((i) => i.name === "Reis")!;
  assert.ok(reis.quantity >= 20);
});

test("Menge wird nicht über das Höchstmaß (400g) skaliert", () => {
  const result = scaleRecipeToTarget(chicken, { kcal: 5000, proteinG: 45, fatG: 12, carbsG: 1000 });
  const reis = result.recipe.ingredientsPerPortion.find((i) => i.name === "Reis")!;
  assert.ok(reis.quantity <= 400);
});

test("Rezepte ohne bekannte Kohlenhydrat-Quelle bleiben unverändert", () => {
  const result = scaleRecipeToTarget(lentilCurry, { kcal: 900, proteinG: 22, fatG: 14, carbsG: 65 });
  assert.equal(result.scaled, false);
  assert.deepEqual(result.recipe, lentilCurry);
});

test("Trifft die Basis-Portion das Ziel schon genau, bleibt die Menge unverändert", () => {
  const result = scaleRecipeToTarget(chicken, chicken.macrosPerPortion);
  assert.equal(result.scaled, false);
});

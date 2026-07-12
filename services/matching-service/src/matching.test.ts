import { test } from "node:test";
import assert from "node:assert/strict";
import { filterCandidates, matchRecipe, weightedPick, type MatchInput } from "./matching.js";
import { RECIPE_POOL } from "./recipes.js";

const baseInput: MatchInput = {
  dietType: "omnivore",
  allergies: [],
  targetMacros: { kcal: 550, proteinG: 40, fatG: 15, carbsG: 55 },
  recentRecipeIds: [],
  relaxMacros: false,
};

test("Veganer Nutzer bekommt nur vegane Rezepte", () => {
  const candidates = filterCandidates({
    ...baseInput,
    dietType: "vegan",
    // Makros nahe an r-08 (Rote-Linsen-Dal), damit mind. ein veganes
    // Rezept innerhalb der ±15%-Toleranz landet.
    targetMacros: { kcal: 470, proteinG: 21, fatG: 10, carbsG: 70 },
  });
  assert.ok(candidates.length > 0);
  assert.ok(candidates.every((r) => r.dietType === "vegan"));
});

test("Omnivorer Nutzer darf auch vegetarische/vegane Rezepte bekommen", () => {
  const candidates = filterCandidates(baseInput);
  const dietTypes = new Set(candidates.map((r) => r.dietType));
  assert.ok(dietTypes.has("omnivore"));
});

test("Rezepte mit Allergenen des Nutzers werden ausgeschlossen", () => {
  const candidates = filterCandidates({
    ...baseInput,
    dietType: "vegan",
    allergies: ["sesame"],
    targetMacros: { kcal: 500, proteinG: 20, fatG: 15, carbsG: 60 },
  });
  assert.ok(candidates.every((r) => !r.allergens.includes("sesame")));
});

test("Rezepte außerhalb der ±15%-Makro-Toleranz werden ausgeschlossen", () => {
  const candidates = filterCandidates({
    ...baseInput,
    targetMacros: { kcal: 5000, proteinG: 400, fatG: 200, carbsG: 600 },
  });
  assert.equal(candidates.length, 0);
});

test("Rezepte aus recentRecipeIds werden ausgeschlossen (5-Tage-Sperre)", () => {
  const withoutLock = filterCandidates(baseInput);
  const lockedId = withoutLock[0]!.id;
  const withLock = filterCandidates({ ...baseInput, recentRecipeIds: [lockedId] });
  assert.ok(!withLock.some((r) => r.id === lockedId));
  assert.equal(withLock.length, withoutLock.length - 1);
});

test("weightedPick wirft bei leerer Kandidatenliste", () => {
  assert.throws(() => weightedPick([], baseInput.targetMacros));
});

test("weightedPick ist deterministisch bei injizierter RNG", () => {
  const candidates = filterCandidates(baseInput);
  const pickAlwaysFirst = weightedPick(candidates, baseInput.targetMacros, () => 0);
  assert.equal(pickAlwaysFirst.id, candidates[0]!.id);
});

test("matchRecipe liefert ein Rezept, das alle Filterkriterien erfüllt", () => {
  const result = matchRecipe(baseInput);
  assert.ok(RECIPE_POOL.some((r) => r.id === result.recipe.id));
  assert.ok(result.candidateCount > 0);
});

test("matchRecipe wirft, wenn kein Rezept zu den Kriterien passt", () => {
  assert.throws(() => {
    matchRecipe({
      ...baseInput,
      dietType: "vegan",
      allergies: ["sesame", "soy", "peanut"],
      targetMacros: { kcal: 470, proteinG: 21, fatG: 10, carbsG: 70 },
      recentRecipeIds: ["r-08"],
    });
  });
});

test("relaxMacros ignoriert nur die Kalorien-Toleranz, nicht Diät/Allergien", () => {
  const strict = filterCandidates({
    ...baseInput,
    targetMacros: { kcal: 5000, proteinG: 400, fatG: 200, carbsG: 600 },
  });
  assert.equal(strict.length, 0);

  const relaxed = filterCandidates({
    ...baseInput,
    targetMacros: { kcal: 5000, proteinG: 400, fatG: 200, carbsG: 600 },
    relaxMacros: true,
  });
  assert.ok(relaxed.length > 0);
  assert.ok(relaxed.every((r) => ["omnivore", "vegetarian", "vegan"].includes(r.dietType)));

  const relaxedButAllergyExcluded = filterCandidates({
    ...baseInput,
    dietType: "vegan",
    allergies: ["sesame"],
    targetMacros: { kcal: 5000, proteinG: 400, fatG: 200, carbsG: 600 },
    relaxMacros: true,
  });
  assert.ok(relaxedButAllergyExcluded.every((r) => !r.allergens.includes("sesame")));
});

test("Ungültiger dietType wird von Zod abgelehnt", () => {
  assert.throws(() => {
    matchRecipe({ ...baseInput, dietType: "carnivore" as never });
  });
});

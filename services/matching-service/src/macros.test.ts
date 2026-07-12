import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateMacros, type MacroInput } from "./macros.js";

const baseInput: MacroInput = {
  gender: "male",
  ageYears: 30,
  heightCm: 180,
  weightKg: 80,
  activityLevel: "moderate",
  goal: "maintain",
};

test("Protein = Gewicht × 1,5 g", () => {
  const result = calculateMacros(baseInput);
  assert.equal(result.proteinG, 120); // 80 * 1.5
});

test("Fett = Gewicht × 1,0 g", () => {
  const result = calculateMacros(baseInput);
  assert.equal(result.fatG, 80); // 80 * 1.0
});

test("Kohlenhydrate = Rest der Kalorien nach Protein/Fett", () => {
  const result = calculateMacros(baseInput);
  const proteinKcal = result.proteinG * 4;
  const fatKcal = result.fatG * 9;
  const expectedCarbsKcal = result.calorieTargetKcal - proteinKcal - fatKcal;
  assert.ok(Math.abs(result.carbsG * 4 - expectedCarbsKcal) < 0.5);
});

test("BMR unterscheidet sich zwischen Mann und Frau bei sonst gleichen Werten", () => {
  const male = calculateMacros(baseInput);
  const female = calculateMacros({ ...baseInput, gender: "female" });
  assert.notEqual(male.bmrKcal, female.bmrKcal);
});

test("Aktiveres Level erhöht das Kalorienziel bei gleichem BMR", () => {
  const sedentary = calculateMacros({ ...baseInput, activityLevel: "sedentary" });
  const active = calculateMacros({ ...baseInput, activityLevel: "active" });
  assert.ok(active.calorieTargetKcal > sedentary.calorieTargetKcal);
});

test("Ziel 'lose' senkt, 'gain' erhöht das Kalorienziel ggü. 'maintain'", () => {
  const maintain = calculateMacros(baseInput);
  const lose = calculateMacros({ ...baseInput, goal: "lose" });
  const gain = calculateMacros({ ...baseInput, goal: "gain" });
  assert.ok(lose.calorieTargetKcal < maintain.calorieTargetKcal);
  assert.ok(gain.calorieTargetKcal > maintain.calorieTargetKcal);
});

test("Kohlenhydrate werden nie negativ (Clamping bei extremem Kaloriendefizit)", () => {
  const extreme = calculateMacros({
    ...baseInput,
    weightKg: 250,
    activityLevel: "sedentary",
    goal: "lose",
  });
  assert.ok(extreme.carbsG >= 0);
});

test("Ungültige Eingabe (z. B. negatives Gewicht) wirft einen Validierungsfehler", () => {
  assert.throws(() => {
    calculateMacros({ ...baseInput, weightKg: -5 });
  });
});

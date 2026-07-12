import { z } from "zod";

export const ActivityLevel = z.enum([
  "sedentary",
  "light",
  "moderate",
  "active",
  "very_active",
]);
export type ActivityLevel = z.infer<typeof ActivityLevel>;

export const Goal = z.enum(["lose", "maintain", "gain"]);
export type Goal = z.infer<typeof Goal>;

export const Gender = z.enum(["male", "female"]);
export type Gender = z.infer<typeof Gender>;

export const MacroInput = z.object({
  gender: Gender,
  ageYears: z.number().int().min(14).max(120),
  heightCm: z.number().min(100).max(250),
  weightKg: z.number().min(30).max(300),
  activityLevel: ActivityLevel,
  goal: Goal,
});
export type MacroInput = z.infer<typeof MacroInput>;

export interface MacroResult {
  bmrKcal: number;
  calorieTargetKcal: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
}

// PAL-Faktoren (Physical Activity Level) — Standardwerte aus der
// Ernährungswissenschaft (Harris & Benedict / gängige PAL-Tabellen).
// In REQ-002 nicht einzeln spezifiziert, daher hier fest hinterlegt.
const ACTIVITY_FACTOR: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

// Ziel-Faktor: Kalorien-Defizit/-Überschuss ggü. Erhaltungsbedarf.
// Ebenfalls nicht in REQ-002 spezifiziert — gängige Praxiswerte
// (15 % Defizit / Überschuss).
const GOAL_FACTOR: Record<Goal, number> = {
  lose: 0.85,
  maintain: 1.0,
  gain: 1.15,
};

const KCAL_PER_G_PROTEIN = 4;
const KCAL_PER_G_FAT = 9;
const KCAL_PER_G_CARBS = 4;

/** Harris-Benedict (revidiert 1984). */
function calculateBmr(input: MacroInput): number {
  const { gender, weightKg, heightCm, ageYears } = input;
  if (gender === "male") {
    return 88.362 + 13.397 * weightKg + 4.799 * heightCm - 5.677 * ageYears;
  }
  return 447.593 + 9.247 * weightKg + 3.098 * heightCm - 4.33 * ageYears;
}

export function calculateMacros(rawInput: MacroInput): MacroResult {
  const input = MacroInput.parse(rawInput);

  const bmrKcal = calculateBmr(input);
  const calorieTargetKcal =
    bmrKcal * ACTIVITY_FACTOR[input.activityLevel] * GOAL_FACTOR[input.goal];

  const proteinG = input.weightKg * 1.5;
  const fatG = input.weightKg * 1.0;

  const proteinKcal = proteinG * KCAL_PER_G_PROTEIN;
  const fatKcal = fatG * KCAL_PER_G_FAT;
  const remainingKcal = calorieTargetKcal - proteinKcal - fatKcal;
  // Bei sehr niedrigem Kalorienziel + hohem Körpergewicht kann der Rest
  // rechnerisch negativ werden — Kohlenhydrate dürfen nicht negativ sein.
  const carbsG = Math.max(0, remainingKcal / KCAL_PER_G_CARBS);

  return {
    bmrKcal: round1(bmrKcal),
    calorieTargetKcal: round1(calorieTargetKcal),
    proteinG: round1(proteinG),
    fatG: round1(fatG),
    carbsG: round1(carbsG),
  };
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

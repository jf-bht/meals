import { z } from "zod";

// Diät-Typ-Hierarchie: vegan ⊂ vegetarian ⊂ omnivore. Ein Rezept passt zum
// Nutzer, wenn sein Diät-Typ mindestens so streng ist wie der des Nutzers.
export const DietType = z.enum(["omnivore", "vegetarian", "vegan"]);
export type DietType = z.infer<typeof DietType>;

export interface RecipeMacros {
  kcal: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
}

export interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
}

export interface Recipe {
  id: string;
  name: string;
  dietType: DietType;
  allergens: string[];
  macrosPerPortion: RecipeMacros;
  // Mengen gelten pro 1 Portion — der Aufrufer (grocery-service) skaliert
  // mit der tatsächlichen Portionsanzahl aus dem Wochenplan.
  ingredientsPerPortion: Ingredient[];
}

// Platzhalter-Pool, bis der reale Rezept-Bestand aus Supabase geladen wird
// (siehe Constitution/techstack.md: Postgres via Supabase als Datenschicht).
// Deckt bewusst mehrere Diät-Typen, Allergene und Makro-Profile ab, damit
// Filterung und gewichtete Auswahl in Tests sinnvoll geprüft werden können.
export const RECIPE_POOL: Recipe[] = [
  {
    id: "r-01",
    name: "Hähnchen mit Reis und Brokkoli",
    dietType: "omnivore",
    allergens: [],
    macrosPerPortion: { kcal: 550, proteinG: 45, fatG: 12, carbsG: 60 },
    ingredientsPerPortion: [
      { name: "Hähnchenbrust", quantity: 150, unit: "g" },
      { name: "Reis", quantity: 80, unit: "g" },
      { name: "Brokkoli", quantity: 120, unit: "g" },
      { name: "Olivenöl", quantity: 1, unit: "EL" },
    ],
  },
  {
    id: "r-02",
    name: "Rindfleisch-Pfanne mit Süßkartoffel",
    dietType: "omnivore",
    allergens: [],
    macrosPerPortion: { kcal: 620, proteinG: 40, fatG: 22, carbsG: 55 },
    ingredientsPerPortion: [
      { name: "Rinderhack", quantity: 150, unit: "g" },
      { name: "Süßkartoffel", quantity: 200, unit: "g" },
      { name: "Zwiebel", quantity: 0.5, unit: "Stück" },
      { name: "Olivenöl", quantity: 1, unit: "EL" },
    ],
  },
  {
    id: "r-03",
    name: "Lachs mit Quinoa",
    dietType: "omnivore",
    allergens: ["fish"],
    macrosPerPortion: { kcal: 580, proteinG: 38, fatG: 24, carbsG: 45 },
    ingredientsPerPortion: [
      { name: "Lachsfilet", quantity: 150, unit: "g" },
      { name: "Quinoa", quantity: 70, unit: "g" },
      { name: "Zitrone", quantity: 0.25, unit: "Stück" },
      { name: "Olivenöl", quantity: 1, unit: "EL" },
    ],
  },
  {
    id: "r-04",
    name: "Linsen-Curry mit Naturjoghurt",
    dietType: "vegetarian",
    allergens: ["dairy"],
    macrosPerPortion: { kcal: 480, proteinG: 22, fatG: 14, carbsG: 65 },
    ingredientsPerPortion: [
      { name: "Linsen", quantity: 100, unit: "g" },
      { name: "Naturjoghurt", quantity: 100, unit: "g" },
      { name: "Zwiebel", quantity: 0.5, unit: "Stück" },
      { name: "Currypulver", quantity: 1, unit: "TL" },
    ],
  },
  {
    id: "r-05",
    name: "Feta-Ofengemüse mit Couscous",
    dietType: "vegetarian",
    allergens: ["dairy", "gluten"],
    macrosPerPortion: { kcal: 520, proteinG: 18, fatG: 20, carbsG: 62 },
    ingredientsPerPortion: [
      { name: "Feta", quantity: 60, unit: "g" },
      { name: "Couscous", quantity: 80, unit: "g" },
      { name: "Zucchini", quantity: 120, unit: "g" },
      { name: "Olivenöl", quantity: 1, unit: "EL" },
    ],
  },
  {
    id: "r-06",
    name: "Kichererbsen-Bowl mit Tahin",
    dietType: "vegan",
    allergens: ["sesame"],
    macrosPerPortion: { kcal: 500, proteinG: 20, fatG: 18, carbsG: 60 },
    ingredientsPerPortion: [
      { name: "Kichererbsen", quantity: 150, unit: "g" },
      { name: "Tahin", quantity: 1, unit: "EL" },
      { name: "Reis", quantity: 70, unit: "g" },
      { name: "Zitrone", quantity: 0.25, unit: "Stück" },
    ],
  },
  {
    id: "r-07",
    name: "Tofu-Wok mit Erdnusssauce",
    dietType: "vegan",
    allergens: ["soy", "peanut"],
    macrosPerPortion: { kcal: 540, proteinG: 28, fatG: 20, carbsG: 55 },
    ingredientsPerPortion: [
      { name: "Tofu", quantity: 150, unit: "g" },
      { name: "Erdnusssauce", quantity: 2, unit: "EL" },
      { name: "Reis", quantity: 80, unit: "g" },
      { name: "Zwiebel", quantity: 0.5, unit: "Stück" },
    ],
  },
  {
    id: "r-08",
    name: "Rote-Linsen-Dal mit Vollkornreis",
    dietType: "vegan",
    allergens: [],
    macrosPerPortion: { kcal: 470, proteinG: 21, fatG: 10, carbsG: 70 },
    ingredientsPerPortion: [
      { name: "Rote Linsen", quantity: 100, unit: "g" },
      { name: "Vollkornreis", quantity: 80, unit: "g" },
      { name: "Zwiebel", quantity: 0.5, unit: "Stück" },
      { name: "Currypulver", quantity: 1, unit: "TL" },
    ],
  },
  {
    id: "r-09",
    name: "Pute mit Ofenkartoffeln",
    dietType: "omnivore",
    allergens: [],
    macrosPerPortion: { kcal: 560, proteinG: 42, fatG: 15, carbsG: 58 },
    ingredientsPerPortion: [
      { name: "Putenbrust", quantity: 150, unit: "g" },
      { name: "Kartoffel", quantity: 250, unit: "g" },
      { name: "Olivenöl", quantity: 1, unit: "EL" },
    ],
  },
  {
    id: "r-10",
    name: "Gemüse-Omelett mit Vollkornbrot",
    dietType: "vegetarian",
    allergens: ["egg", "gluten"],
    macrosPerPortion: { kcal: 490, proteinG: 25, fatG: 22, carbsG: 40 },
    ingredientsPerPortion: [
      { name: "Eier", quantity: 3, unit: "Stück" },
      { name: "Vollkornbrot", quantity: 60, unit: "g" },
      { name: "Paprika", quantity: 80, unit: "g" },
      { name: "Olivenöl", quantity: 1, unit: "EL" },
    ],
  },
  // r-11/r-12 wurden ergänzt, weil der ursprüngliche Pool (500–620 kcal)
  // realistische Pro-Mahlzeit-Ziele bei höherem Tageskalorienbedarf (z. B.
  // ~2300 kcal/Tag ÷ 3 ≈ 766 kcal) nicht innerhalb der ±15%-Toleranz aus
  // REQ-003 abdeckte — matchRecipe lieferte in diesen Fällen korrekt, aber
  // zu häufig "no_candidates". Siehe docs/SWT_FINAL_STEP05.
  {
    id: "r-11",
    name: "Chili con Carne mit Reis",
    dietType: "omnivore",
    allergens: [],
    macrosPerPortion: { kcal: 720, proteinG: 45, fatG: 25, carbsG: 70 },
    ingredientsPerPortion: [
      { name: "Rinderhack", quantity: 180, unit: "g" },
      { name: "Kidneybohnen", quantity: 150, unit: "g" },
      { name: "Reis", quantity: 90, unit: "g" },
      { name: "Zwiebel", quantity: 0.5, unit: "Stück" },
    ],
  },
  {
    id: "r-12",
    name: "Falafel-Teller mit Hummus",
    dietType: "vegan",
    allergens: ["sesame"],
    macrosPerPortion: { kcal: 700, proteinG: 24, fatG: 26, carbsG: 85 },
    ingredientsPerPortion: [
      { name: "Kichererbsen", quantity: 180, unit: "g" },
      { name: "Hummus", quantity: 60, unit: "g" },
      { name: "Vollkornreis", quantity: 90, unit: "g" },
      { name: "Tahin", quantity: 1, unit: "EL" },
    ],
  },
  // r-13/r-14 erweitern die Kalorien-Bandbreite des Pools weiter nach unten
  // (leichte Mahlzeit) und oben (großer Esser/hoher Bedarf), damit mehr
  // reale Onboarding-Profile ohne relaxMacros-Fallback einen Treffer
  // finden. Siehe docs/SWT_FINAL_STEP05 / STEP06.
  {
    id: "r-13",
    name: "Overnight Oats mit Beeren",
    dietType: "vegetarian",
    allergens: ["dairy"],
    macrosPerPortion: { kcal: 380, proteinG: 18, fatG: 10, carbsG: 55 },
    ingredientsPerPortion: [
      { name: "Haferflocken", quantity: 60, unit: "g" },
      { name: "Naturjoghurt", quantity: 100, unit: "g" },
      { name: "Beeren", quantity: 80, unit: "g" },
    ],
  },
  {
    id: "r-14",
    name: "Rindersteak mit Ofengemüse",
    dietType: "omnivore",
    allergens: [],
    macrosPerPortion: { kcal: 850, proteinG: 55, fatG: 35, carbsG: 50 },
    ingredientsPerPortion: [
      { name: "Rindersteak", quantity: 200, unit: "g" },
      { name: "Süßkartoffel", quantity: 200, unit: "g" },
      { name: "Brokkoli", quantity: 150, unit: "g" },
      { name: "Olivenöl", quantity: 1, unit: "EL" },
    ],
  },
];

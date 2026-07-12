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

export interface Recipe {
  id: string;
  name: string;
  dietType: DietType;
  allergens: string[];
  macrosPerPortion: RecipeMacros;
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
  },
  {
    id: "r-02",
    name: "Rindfleisch-Pfanne mit Süßkartoffel",
    dietType: "omnivore",
    allergens: [],
    macrosPerPortion: { kcal: 620, proteinG: 40, fatG: 22, carbsG: 55 },
  },
  {
    id: "r-03",
    name: "Lachs mit Quinoa",
    dietType: "omnivore",
    allergens: ["fish"],
    macrosPerPortion: { kcal: 580, proteinG: 38, fatG: 24, carbsG: 45 },
  },
  {
    id: "r-04",
    name: "Linsen-Curry mit Naturjoghurt",
    dietType: "vegetarian",
    allergens: ["dairy"],
    macrosPerPortion: { kcal: 480, proteinG: 22, fatG: 14, carbsG: 65 },
  },
  {
    id: "r-05",
    name: "Feta-Ofengemüse mit Couscous",
    dietType: "vegetarian",
    allergens: ["dairy", "gluten"],
    macrosPerPortion: { kcal: 520, proteinG: 18, fatG: 20, carbsG: 62 },
  },
  {
    id: "r-06",
    name: "Kichererbsen-Bowl mit Tahin",
    dietType: "vegan",
    allergens: ["sesame"],
    macrosPerPortion: { kcal: 500, proteinG: 20, fatG: 18, carbsG: 60 },
  },
  {
    id: "r-07",
    name: "Tofu-Wok mit Erdnusssauce",
    dietType: "vegan",
    allergens: ["soy", "peanut"],
    macrosPerPortion: { kcal: 540, proteinG: 28, fatG: 20, carbsG: 55 },
  },
  {
    id: "r-08",
    name: "Rote-Linsen-Dal mit Vollkornreis",
    dietType: "vegan",
    allergens: [],
    macrosPerPortion: { kcal: 470, proteinG: 21, fatG: 10, carbsG: 70 },
  },
  {
    id: "r-09",
    name: "Pute mit Ofenkartoffeln",
    dietType: "omnivore",
    allergens: [],
    macrosPerPortion: { kcal: 560, proteinG: 42, fatG: 15, carbsG: 58 },
  },
  {
    id: "r-10",
    name: "Gemüse-Omelett mit Vollkornbrot",
    dietType: "vegetarian",
    allergens: ["egg", "gluten"],
    macrosPerPortion: { kcal: 490, proteinG: 25, fatG: 22, carbsG: 40 },
  },
];

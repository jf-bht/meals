export type GroceryCategory = "produce" | "protein" | "dairy" | "grains" | "pantry" | "other";

export interface RecipeIngredient {
  name: string;
  quantity: number;
  unit: string;
}

export interface RecipeForGroceryList {
  id: string;
  ingredientsPerPortion: RecipeIngredient[];
}

export interface WeekPlanEntry {
  recipe: RecipeForGroceryList;
  portions: number;
}

export interface GroceryListItem {
  name: string;
  quantity: number;
  unit: string;
  category: GroceryCategory;
}

export interface GroceryListGroup {
  category: GroceryCategory;
  items: GroceryListItem[];
}

// Kategorisierung anhand des (normalisierten) Zutatennamens. Deckt aktuell
// nur die Zutaten aus dem Beispiel-Rezept-Pool des matching-service ab —
// unbekannte Zutaten fallen bewusst auf "other" statt einen Fehler zu
// werfen, damit die Einkaufsliste auch bei neuen/unbekannten Zutaten nie
// komplett fehlschlägt.
const CATEGORY_BY_INGREDIENT: Record<string, GroceryCategory> = {
  "hähnchenbrust": "protein",
  "rinderhack": "protein",
  "rindersteak": "protein",
  "lachsfilet": "protein",
  "putenbrust": "protein",
  "tofu": "protein",
  "kichererbsen": "protein",
  "kidneybohnen": "protein",
  "linsen": "protein",
  "rote linsen": "protein",
  "eier": "protein",
  "naturjoghurt": "dairy",
  "feta": "dairy",
  "reis": "grains",
  "vollkornreis": "grains",
  "quinoa": "grains",
  "couscous": "grains",
  "vollkornbrot": "grains",
  "haferflocken": "grains",
  "brokkoli": "produce",
  "süßkartoffel": "produce",
  "zwiebel": "produce",
  "zitrone": "produce",
  "zucchini": "produce",
  "kartoffel": "produce",
  "paprika": "produce",
  "beeren": "produce",
  "olivenöl": "pantry",
  "currypulver": "pantry",
  "tahin": "pantry",
  "erdnusssauce": "pantry",
  "hummus": "pantry",
};

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

function categorize(name: string): GroceryCategory {
  return CATEGORY_BY_INGREDIENT[normalizeName(name)] ?? "other";
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * REQ-005: Zutaten aus allen Mahlzeiten des Wochenplans aggregieren.
 * Zutaten werden über (normalisierter Name + Einheit) zusammengeführt —
 * gleicher Name mit unterschiedlicher Einheit wird bewusst als separater
 * Posten behandelt, da eine Einheiten-Umrechnung (z. B. Stück ↔ g) ohne
 * Produktdaten nicht zuverlässig möglich ist.
 */
export function aggregateIngredients(entries: WeekPlanEntry[]): GroceryListItem[] {
  const byKey = new Map<string, GroceryListItem>();

  for (const entry of entries) {
    for (const ingredient of entry.recipe.ingredientsPerPortion) {
      const key = `${normalizeName(ingredient.name)}|${ingredient.unit}`;
      const quantity = ingredient.quantity * entry.portions;
      const existing = byKey.get(key);
      if (existing) {
        existing.quantity = round1(existing.quantity + quantity);
      } else {
        byKey.set(key, {
          name: ingredient.name,
          quantity: round1(quantity),
          unit: ingredient.unit,
          category: categorize(ingredient.name),
        });
      }
    }
  }

  return [...byKey.values()];
}

const CATEGORY_ORDER: GroceryCategory[] = ["produce", "protein", "dairy", "grains", "pantry", "other"];

export function groupByCategory(items: GroceryListItem[]): GroceryListGroup[] {
  const byCategory = new Map<GroceryCategory, GroceryListItem[]>();
  for (const item of items) {
    const list = byCategory.get(item.category) ?? [];
    list.push(item);
    byCategory.set(item.category, list);
  }

  return CATEGORY_ORDER.filter((category) => byCategory.has(category)).map((category) => ({
    category,
    items: byCategory.get(category)!.sort((a, b) => a.name.localeCompare(b.name)),
  }));
}

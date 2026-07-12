import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { fetchRecipes } from "../api/client";
import { RecipeDetailModal } from "./RecipeDetailModal";
import { DIET_LABELS } from "../domain/labels";
import { colors, radii, spacing, typography } from "../theme";
import type { MealType, Recipe } from "../api/types";

const SECTIONS: { title: string; mealType: MealType }[] = [
  { title: "Frühstück", mealType: "breakfast" },
  { title: "Mittag- & Abendessen", mealType: "lunch" },
];

/**
 * REQ-003-Datenquelle im Überblick: lädt den kompletten Rezept-Pool über
 * GET /v1/recipes (siehe matching-service/src/index.ts) statt einzelne
 * IDs zu erraten. Rein informativ — kein Bezug zum aktuellen Wochenplan,
 * daher zeigt das Detail-Modal hier immer die unskalierte Basis-Portion.
 */
export function HomeScreen() {
  const [recipes, setRecipes] = useState<Recipe[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  useEffect(() => {
    fetchRecipes()
      .then(setRecipes)
      .catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, []);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoText}>M</Text>
        </View>
        <Text style={styles.wordmark}>Meals</Text>
        <Text style={styles.subtitle}>Rezept-Pool ({recipes?.length ?? "…"})</Text>
      </View>

      {error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>matching-service nicht erreichbar: {error}</Text>
        </View>
      ) : !recipes ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accentDark} size="large" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {SECTIONS.map((section) => {
            const sectionRecipes = recipes.filter((r) => r.mealTypes.includes(section.mealType));
            if (sectionRecipes.length === 0) return null;
            return (
              <View key={section.mealType} style={styles.sectionBlock}>
                <Text style={typography.sectionLabel}>{section.title}</Text>
                {sectionRecipes.map((recipe) => (
                  <Pressable key={recipe.id} style={styles.card} onPress={() => setSelectedRecipe(recipe)}>
                    <View style={styles.thumbnail}>
                      <Text style={styles.thumbnailLabel}>FOTO</Text>
                    </View>
                    <View style={styles.cardBody}>
                      <Text style={styles.recipeName}>{recipe.name}</Text>
                      <Text style={styles.recipeMeta}>
                        ⏱ {recipe.prepTimeMinutes} Min · {recipe.macrosPerPortion.kcal} kcal ·{" "}
                        {DIET_LABELS[recipe.dietType]}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            );
          })}
        </ScrollView>
      )}

      <RecipeDetailModal
        recipe={selectedRecipe}
        visible={selectedRecipe !== null}
        onClose={() => setSelectedRecipe(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.screenBackground,
  },
  header: {
    alignItems: "center",
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logoBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  logoText: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
  },
  wordmark: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: colors.accentDark,
    marginTop: 2,
    fontWeight: "600",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  errorText: {
    color: colors.danger,
    textAlign: "center",
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  sectionBlock: {
    marginBottom: spacing.md,
  },
  card: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: radii.md,
    backgroundColor: colors.accentTint,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  thumbnailLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.accentDark,
  },
  cardBody: {
    flex: 1,
    justifyContent: "center",
  },
  recipeName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  recipeMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
});

import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ScreenHeader } from "../components/ScreenHeader";
import { RecipeDetailModal } from "./RecipeDetailModal";
import { colors, radii, spacing, typography } from "../theme";
import type { MealType, WeekPlanMeal } from "../api/types";

const WEEKDAY_LABELS = ["SO", "MO", "DI", "MI", "DO", "FR", "SA"];
const MEAL_LABELS: Record<MealType, string> = {
  breakfast: "Frühstück",
  lunch: "Mittagessen",
  dinner: "Abendessen",
};

function formatDay(dayIndex: number): { weekday: string; date: string } {
  const date = new Date();
  date.setDate(date.getDate() + dayIndex);
  return {
    weekday: WEEKDAY_LABELS[date.getDay()]!,
    date: `${date.getDate()}.${date.getMonth() + 1}.`,
  };
}

export function WochenplanScreen({
  meals,
  loading,
  onRegenerate,
  onSwapMeal,
}: {
  meals: WeekPlanMeal[];
  loading: boolean;
  onRegenerate: () => void;
  // REQ-009: tauscht genau diese eine Mahlzeit, ohne den Plan neu zu
  // generieren. Wirft bei Fehlschlag (z. B. kein Alternative im Demo-Pool).
  onSwapMeal: (meal: WeekPlanMeal) => Promise<void>;
}) {
  const [selectedMeal, setSelectedMeal] = useState<WeekPlanMeal | null>(null);
  const [swapping, setSwapping] = useState(false);
  const [swapError, setSwapError] = useState<string | null>(null);

  async function handleSwapPress() {
    if (!selectedMeal) return;
    setSwapping(true);
    setSwapError(null);
    try {
      await onSwapMeal(selectedMeal);
      setSelectedMeal(null);
    } catch (err) {
      setSwapError(err instanceof Error ? err.message : "Tausch fehlgeschlagen.");
    } finally {
      setSwapping(false);
    }
  }

  const days = Array.from({ length: 7 }, (_, day) => ({
    day,
    ...formatDay(day),
    meals: meals.filter((m) => m.day === day),
  }));

  const rangeLabel = `${formatDay(0).date}–${formatDay(6).date} · REQ-004 Wochenplan`;

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Dein Wochenplan"
        subtitle={loading ? "Plan wird neu generiert…" : rangeLabel}
        actionIcon="⟳"
        onActionPress={onRegenerate}
      />

      {loading ? (
        <View style={styles.loadingWrapper}>
          <ActivityIndicator color={colors.accentDark} size="large" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {days.map((d) => (
            <View key={d.day} style={styles.dayBlock}>
              <Text style={styles.dayHeading}>
                {d.weekday} · {d.date}
              </Text>
              {d.meals.map((meal) => (
                <Pressable
                  key={`${meal.day}-${meal.mealType}`}
                  style={styles.card}
                  onPress={() => {
                    setSwapError(null);
                    setSelectedMeal(meal);
                  }}
                >
                  <View style={styles.thumbnail}>
                    <Text style={styles.thumbnailLabel}>FOTO</Text>
                  </View>
                  <View style={styles.cardBody}>
                    <View style={styles.cardHeaderRow}>
                      <Text style={styles.mealType}>{MEAL_LABELS[meal.mealType]}</Text>
                    </View>
                    <Text style={styles.recipeName}>{meal.recipe.name}</Text>
                    <Text style={styles.recipeMeta}>
                      ⏱ {meal.recipe.prepTimeMinutes} Min · {meal.recipe.macrosPerPortion.kcal} kcal
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          ))}
        </ScrollView>
      )}

      <RecipeDetailModal
        recipe={selectedMeal?.recipe ?? null}
        visible={selectedMeal !== null}
        onClose={() => setSelectedMeal(null)}
        onSwap={handleSwapPress}
        swapping={swapping}
        swapError={swapError}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.screenBackground,
  },
  loadingWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  dayBlock: {
    marginBottom: spacing.md,
  },
  dayHeading: {
    ...typography.sectionLabel,
    marginBottom: spacing.sm,
  },
  card: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    marginBottom: spacing.sm,
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
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  mealType: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.accentDark,
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

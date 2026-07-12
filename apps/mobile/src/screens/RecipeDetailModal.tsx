import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { PrimaryButton } from "../components/PrimaryButton";
import { colors, radii, spacing, typography } from "../theme";
import type { Recipe } from "../api/types";

/**
 * Zeigt das vollständige Rezept einer Mahlzeit aus dem Wochenplan. Nutzt
 * bewusst das Rezept-Objekt, das bereits über POST /v1/recipes/match im
 * Wochenplan geladen wurde — nicht einen erneuten GET /v1/recipes/:id-
 * Aufruf. Grund: matching-service kann die Kohlenhydrat-Quelle pro
 * Mahlzeit skalieren (siehe portionScaling.ts, Step 09); GET /v1/recipes/:id
 * liefert immer die unskalierte Basis-Portion aus dem Pool. Ein erneuter
 * Fetch würde hier andere Mengen zeigen als tatsächlich im Wochenplan (und
 * in der Einkaufsliste) verwendet werden — dasselbe Konsistenzproblem, das
 * in Step 09 für die Einkaufsliste bereits gelöst wurde.
 */
export function RecipeDetailModal({
  recipe,
  visible,
  onClose,
  onSwap,
  swapping,
  swapError,
}: {
  recipe: Recipe | null;
  visible: boolean;
  onClose: () => void;
  // REQ-009 Mahlzeit-Swap: nur gesetzt, wenn das Modal für eine konkrete
  // Mahlzeit im Wochenplan geöffnet wurde (nicht z. B. im HomeScreen-Katalog,
  // wo es keinen Plan-Bezug gibt).
  onSwap?: () => void;
  swapping?: boolean;
  swapError?: string | null;
}) {
  return (
    <Modal visible={visible && recipe !== null} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {recipe ? (
            <>
              <View style={styles.header}>
                <View style={styles.headerText}>
                  <Text style={styles.title}>{recipe.name}</Text>
                  <Text style={styles.subtitle}>⏱ {recipe.prepTimeMinutes} Min · {recipe.macrosPerPortion.kcal} kcal</Text>
                </View>
                <Pressable onPress={onClose} style={styles.closeButton}>
                  <Text style={styles.closeIcon}>✕</Text>
                </Pressable>
              </View>

              <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.macroRow}>
                  <MacroChip label="Protein" value={recipe.macrosPerPortion.proteinG} />
                  <MacroChip label="Fett" value={recipe.macrosPerPortion.fatG} />
                  <MacroChip label="Kohlenhydrate" value={recipe.macrosPerPortion.carbsG} />
                </View>

                <Text style={typography.sectionLabel}>Zutaten (1 Portion)</Text>
                <View style={styles.card}>
                  {recipe.ingredientsPerPortion.map((ingredient, index) => (
                    <View
                      key={`${ingredient.name}-${index}`}
                      style={[
                        styles.ingredientRow,
                        index < recipe.ingredientsPerPortion.length - 1 && styles.ingredientRowDivider,
                      ]}
                    >
                      <Text style={styles.ingredientName}>{ingredient.name}</Text>
                      <Text style={styles.ingredientQuantity}>
                        {ingredient.quantity} {ingredient.unit}
                      </Text>
                    </View>
                  ))}
                </View>
              </ScrollView>

              {onSwap ? (
                <View style={styles.footer}>
                  {swapError ? <Text style={styles.errorText}>{swapError}</Text> : null}
                  <PrimaryButton label="Diese Mahlzeit tauschen ⇄" onPress={onSwap} loading={swapping} />
                </View>
              ) : null}
            </>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

function MacroChip({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.macroChip}>
      <Text style={styles.macroChipValue}>{Math.round(value)}g</Text>
      <Text style={styles.macroChipLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(17, 24, 39, 0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    maxHeight: "80%",
    paddingBottom: spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerText: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: colors.accentDark,
    marginTop: 4,
    fontWeight: "600",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    backgroundColor: colors.chipNeutral,
    alignItems: "center",
    justifyContent: "center",
  },
  closeIcon: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  content: {
    padding: spacing.md,
  },
  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  macroRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: colors.accentTint,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },
  macroChip: {
    alignItems: "center",
  },
  macroChipValue: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.accentDark,
  },
  macroChipLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.sm,
  },
  ingredientRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
  },
  ingredientRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  ingredientName: {
    fontSize: 15,
    color: colors.textPrimary,
  },
  ingredientQuantity: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});

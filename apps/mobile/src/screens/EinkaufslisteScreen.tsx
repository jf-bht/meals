import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ScreenHeader } from "../components/ScreenHeader";
import { PrimaryButton } from "../components/PrimaryButton";
import { colors, radii, spacing, typography } from "../theme";
import type { GroceryListGroup } from "../api/types";

const CATEGORY_LABELS: Record<string, string> = {
  produce: "Obst & Gemüse",
  protein: "Fleisch, Fisch & Eiweiß",
  dairy: "Kühlregal",
  grains: "Getreide & Beilagen",
  pantry: "Vorrat",
  other: "Sonstiges",
};

function itemKey(category: string, name: string, unit: string): string {
  return `${category}|${name}|${unit}`;
}

export function EinkaufslisteScreen({
  groups,
  loading,
}: {
  groups: GroceryListGroup[];
  loading: boolean;
}) {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const totalItems = useMemo(() => groups.reduce((sum, g) => sum + g.items.length, 0), [groups]);

  function toggle(key: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function markAllDone() {
    const all = new Set<string>();
    for (const group of groups) {
      for (const item of group.items) {
        all.add(itemKey(group.category, item.name, item.unit));
      }
    }
    setChecked(all);
  }

  function handleExportPress() {
    // REQ-010 (Export) ist laut Scope-Entscheidung (README.md) für diese
    // Abgabe bewusst nicht implementiert — nur als Roadmap-Punkt vermerkt.
    Alert.alert(
      "Noch nicht verfügbar",
      "Export/Teilen (REQ-010) ist laut Scope dieser Abgabe nicht implementiert — nur als Roadmap-Punkt dokumentiert.",
    );
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Einkaufsliste"
        subtitle={loading ? "Liste wird generiert…" : `${totalItems} Artikel · aus deinem Wochenplan`}
        actionIcon="↑"
        onActionPress={handleExportPress}
      />

      {loading ? (
        <View style={styles.loadingWrapper}>
          <ActivityIndicator color={colors.accentDark} size="large" />
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.content}>
            {groups.map((group) => (
              <View key={group.category} style={styles.groupBlock}>
                <Text style={typography.sectionLabel}>{CATEGORY_LABELS[group.category] ?? group.category}</Text>
                <View style={styles.card}>
                  {group.items.map((item, index) => {
                    const key = itemKey(group.category, item.name, item.unit);
                    const isChecked = checked.has(key);
                    return (
                      <Pressable
                        key={key}
                        onPress={() => toggle(key)}
                        style={[styles.row, index < group.items.length - 1 && styles.rowDivider]}
                      >
                        <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                          {isChecked ? <Text style={styles.checkmark}>✓</Text> : null}
                        </View>
                        <Text style={[styles.itemName, isChecked && styles.itemNameChecked]}>{item.name}</Text>
                        <Text style={[styles.itemQuantity, isChecked && styles.itemNameChecked]}>
                          {item.quantity} {item.unit}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={styles.footer}>
            <PrimaryButton label="Alle als erledigt markieren ✓" onPress={markAllDone} />
          </View>
        </>
      )}
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
  groupBlock: {
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  checkboxChecked: {
    backgroundColor: colors.accentDark,
    borderColor: colors.accentDark,
  },
  checkmark: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  itemName: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
  },
  itemNameChecked: {
    color: colors.textMuted,
    textDecorationLine: "line-through",
  },
  itemQuantity: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  footer: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});

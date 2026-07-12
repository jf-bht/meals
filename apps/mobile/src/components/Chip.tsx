import { Pressable, StyleSheet, Text } from "react-native";
import { colors, radii, spacing } from "../theme";

export function Chip({
  label,
  selected,
  onPress,
  tone = "neutral",
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  tone?: "neutral" | "danger";
}) {
  const activeBg = tone === "danger" ? colors.dangerTint : colors.accentTint;
  const activeText = tone === "danger" ? colors.danger : colors.accentDark;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        { backgroundColor: selected ? activeBg : colors.chipNeutral },
      ]}
    >
      <Text style={[styles.label, { color: selected ? activeText : colors.textSecondary }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
  },
});

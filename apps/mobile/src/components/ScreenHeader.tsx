import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing } from "../theme";

export function ScreenHeader({
  title,
  subtitle,
  actionIcon,
  onActionPress,
}: {
  title: string;
  subtitle?: string;
  actionIcon?: string;
  onActionPress?: () => void;
}) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.topRow}>
        <Text style={styles.wordmark}>Meals</Text>
        {actionIcon ? (
          <Pressable onPress={onActionPress} style={styles.actionButton}>
            <Text style={styles.actionIcon}>{actionIcon}</Text>
          </Pressable>
        ) : null}
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  wordmark: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    backgroundColor: colors.accentTint,
    alignItems: "center",
    justifyContent: "center",
  },
  actionIcon: {
    fontSize: 16,
    color: colors.accentDark,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: colors.accentDark,
    marginTop: 4,
    fontWeight: "600",
  },
});

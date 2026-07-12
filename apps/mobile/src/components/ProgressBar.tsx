import { StyleSheet, View } from "react-native";
import { colors, radii, spacing } from "../theme";

export function ProgressBar({ step, totalSteps }: { step: number; totalSteps: number }) {
  return (
    <View style={styles.row}>
      {Array.from({ length: totalSteps }).map((_, index) => (
        <View
          key={index}
          style={[styles.segment, index < step ? styles.segmentActive : styles.segmentInactive]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: radii.pill,
  },
  segmentActive: {
    backgroundColor: colors.accent,
  },
  segmentInactive: {
    backgroundColor: colors.border,
  },
});

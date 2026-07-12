import { StyleSheet, Text, View } from "react-native";
import { PrimaryButton } from "../components/PrimaryButton";
import { colors, spacing } from "../theme";

export function SplashScreen({ onStart }: { onStart: () => void }) {
  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoText}>M</Text>
        </View>
        <Text style={styles.wordmark}>Meals</Text>
        <Text style={styles.tagline}>Iss gut. Denk nicht drüber nach.</Text>
      </View>

      <View style={styles.footer}>
        <PrimaryButton label="Los geht's →" onPress={onStart} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surface,
    justifyContent: "space-between",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  logoBadge: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  logoText: {
    fontSize: 44,
    fontWeight: "800",
    color: "#fff",
  },
  wordmark: {
    fontSize: 34,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  tagline: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  footer: {
    padding: spacing.md,
  },
});

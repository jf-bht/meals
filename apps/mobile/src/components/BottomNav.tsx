import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../theme";

export type MainScreen = "plan" | "grocery";

const TABS: { key: MainScreen | "home" | "profile"; label: string; icon: string; enabled: boolean }[] = [
  { key: "home", label: "Home", icon: "⌂", enabled: false },
  { key: "plan", label: "Plan", icon: "▤", enabled: true },
  { key: "grocery", label: "Liste", icon: "▾", enabled: true },
  { key: "profile", label: "Profil", icon: "○", enabled: false },
];

export function BottomNav({ active, onChange }: { active: MainScreen; onChange: (screen: MainScreen) => void }) {
  return (
    <View style={styles.wrapper}>
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Pressable
            key={tab.key}
            disabled={!tab.enabled}
            onPress={() => tab.enabled && onChange(tab.key as MainScreen)}
            style={styles.tab}
          >
            <Text style={[styles.icon, isActive && styles.iconActive, !tab.enabled && styles.disabled]}>
              {tab.icon}
            </Text>
            <Text style={[styles.label, isActive && styles.labelActive, !tab.enabled && styles.disabled]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  icon: {
    fontSize: 18,
    color: colors.textMuted,
  },
  iconActive: {
    color: colors.accentDark,
  },
  label: {
    fontSize: 11,
    color: colors.textMuted,
  },
  labelActive: {
    color: colors.accentDark,
    fontWeight: "700",
  },
  disabled: {
    opacity: 0.4,
  },
});

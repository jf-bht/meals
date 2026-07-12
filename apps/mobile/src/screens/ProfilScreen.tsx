import { ScrollView, StyleSheet, Text, View } from "react-native";
import { ScreenHeader } from "../components/ScreenHeader";
import { colors, radii, spacing, typography } from "../theme";
import { ACTIVITY_LABELS, ALLERGY_LABELS, DIET_LABELS, GENDER_LABELS, GOAL_LABELS } from "../domain/labels";
import type { OnboardingResult } from "./OnboardingScreen";

/**
 * Reine Anzeige der Onboarding-Angaben (REQ-001) und der daraus
 * berechneten Makro-Werte (REQ-002) — kein Bearbeiten-Flow, kein
 * zusätzlicher Backend-Aufruf. Nutzt ausschließlich den bereits im
 * App-State vorhandenen `profile`-Wert aus App.tsx.
 */
export function ProfilScreen({ profile }: { profile: OnboardingResult }) {
  const { macros } = profile;

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Profil" subtitle="Deine Angaben aus dem Onboarding" />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.macroCard}>
          <Text style={styles.kcalValue}>{Math.round(macros.calorieTargetKcal)}</Text>
          <Text style={styles.kcalLabel}>kcal Tagesziel</Text>

          <View style={styles.macroRow}>
            <MacroStat label="Protein" value={macros.proteinG} />
            <MacroStat label="Fett" value={macros.fatG} />
            <MacroStat label="Kohlenhydrate" value={macros.carbsG} />
          </View>

          <Text style={styles.bmrNote}>Grundumsatz (BMR): {Math.round(macros.bmrKcal)} kcal</Text>
        </View>

        <Text style={typography.sectionLabel}>Körperdaten & Aktivität</Text>
        <View style={styles.card}>
          <InfoRow label="Geschlecht" value={GENDER_LABELS[profile.gender]} />
          <InfoRow label="Alter" value={`${profile.ageYears} Jahre`} />
          <InfoRow label="Größe" value={`${profile.heightCm} cm`} />
          <InfoRow label="Gewicht" value={`${profile.weightKg} kg`} last />
        </View>
        <View style={styles.card}>
          <InfoRow label="Aktivitätslevel" value={ACTIVITY_LABELS[profile.activityLevel]} last />
        </View>

        <Text style={typography.sectionLabel}>Ziel & Ernährung</Text>
        <View style={styles.card}>
          <InfoRow label="Ziel" value={GOAL_LABELS[profile.goal]} />
          <InfoRow label="Ernährungsweise" value={DIET_LABELS[profile.dietType]} last={profile.allergies.length === 0} />
          {profile.allergies.length > 0 ? (
            <InfoRow
              label="Unverträglichkeiten"
              value={profile.allergies.map((a) => ALLERGY_LABELS[a] ?? a).join(", ")}
              last
            />
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

function MacroStat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.macroStat}>
      <Text style={styles.macroStatValue}>{Math.round(value)}g</Text>
      <Text style={styles.macroStatLabel}>{label}</Text>
    </View>
  );
}

function InfoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.infoRow, !last && styles.infoRowDivider]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.screenBackground,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  macroCard: {
    backgroundColor: colors.accentDark,
    borderRadius: radii.lg,
    padding: spacing.lg,
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  kcalValue: {
    fontSize: 48,
    fontWeight: "800",
    color: "#fff",
  },
  kcalLabel: {
    fontSize: 14,
    color: colors.accentTint,
    marginTop: -4,
    marginBottom: spacing.md,
  },
  macroRow: {
    flexDirection: "row",
    gap: spacing.lg,
  },
  macroStat: {
    alignItems: "center",
  },
  macroStatValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  macroStatLabel: {
    fontSize: 12,
    color: colors.accentTint,
    marginTop: 2,
  },
  bmrNote: {
    fontSize: 12,
    color: colors.accentTint,
    marginTop: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
  },
  infoRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
});

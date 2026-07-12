import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { PrimaryButton } from "../components/PrimaryButton";
import { ProgressBar } from "../components/ProgressBar";
import { SelectableCard } from "../components/SelectableCard";
import { SegmentedControl } from "../components/SegmentedControl";
import { Chip } from "../components/Chip";
import { colors, spacing, typography } from "../theme";
import { calculateMacros } from "../api/client";
import type { ActivityLevel, DietType, Gender, Goal, MacroResult } from "../api/types";

const TOTAL_STEPS = 3;

const ACTIVITY_OPTIONS: { value: ActivityLevel; title: string; subtitle: string }[] = [
  { value: "sedentary", title: "Sitzend", subtitle: "Bürojob, kaum Bewegung" },
  { value: "light", title: "Leicht aktiv", subtitle: "1–3× Sport/Woche" },
  { value: "moderate", title: "Moderat aktiv", subtitle: "3–5× Sport/Woche" },
  { value: "active", title: "Sehr aktiv", subtitle: "6–7× Sport/Woche" },
  { value: "very_active", title: "Extrem aktiv", subtitle: "Körperliche Arbeit + Sport" },
];

const GOAL_OPTIONS: { value: Goal; title: string; subtitle: string }[] = [
  { value: "maintain", title: "Gewicht halten", subtitle: "Ausgewogen weiteressen" },
  { value: "lose", title: "Gewicht verlieren", subtitle: "Moderates Kaloriendefizit" },
  { value: "gain", title: "Muskeln aufbauen", subtitle: "Mehr Eiweiß, leichter Überschuss" },
];

// Allergen-Tokens entsprechen den im matching-service RECIPE_POOL
// verwendeten Werten (siehe services/matching-service/src/recipes.ts),
// damit die Auswahl hier tatsächlich gegen den Demo-Pool filtert.
const ALLERGY_OPTIONS: { value: string; label: string }[] = [
  { value: "dairy", label: "Laktose" },
  { value: "gluten", label: "Gluten" },
  { value: "peanut", label: "Nüsse" },
  { value: "egg", label: "Eier" },
  { value: "fish", label: "Fisch" },
  { value: "soy", label: "Soja" },
  { value: "sesame", label: "Sesam" },
];

export interface OnboardingResult {
  dietType: DietType;
  allergies: string[];
  macros: MacroResult;
}

export function OnboardingScreen({ onComplete }: { onComplete: (result: OnboardingResult) => void }) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  // Nicht Alert.alert() verwenden: React Native Web zeigt Alert.alert()
  // standardmäßig nicht sichtbar an (nur console-Ausgabe) — auf der
  // Web-Zielplattform (siehe README "npm run web") würde ein Fehler damit
  // lautlos verschluckt. Sichtbarer Inline-Text funktioniert auf allen
  // drei Zielplattformen (iOS/Android/Web) gleich.
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [gender, setGender] = useState<Gender>("female");
  const [age, setAge] = useState("28");
  const [height, setHeight] = useState("170");
  const [weight, setWeight] = useState("68");

  const [activityLevel, setActivityLevel] = useState<ActivityLevel>("moderate");

  const [goal, setGoal] = useState<Goal>("maintain");
  const [dietType, setDietType] = useState<DietType>("omnivore");
  const [allergies, setAllergies] = useState<string[]>([]);

  const stepTitle = useMemo(() => {
    if (step === 1) return "Erzähl uns von dir";
    if (step === 2) return "Wie aktiv bist du?";
    return "Was ist dein Ziel?";
  }, [step]);

  const stepSubtitle = useMemo(() => {
    if (step === 1) return "Für die Berechnung deines Kalorienbedarfs.";
    if (step === 2) return "Bestimmt deinen Aktivitätsfaktor.";
    return "Darauf stimmen wir deinen Plan ab.";
  }, [step]);

  function toggleAllergy(value: string) {
    setAllergies((prev) => (prev.includes(value) ? prev.filter((a) => a !== value) : [...prev, value]));
  }

  function validateStep1(): boolean {
    const ageNum = Number(age);
    const heightNum = Number(height);
    const weightNum = Number(weight);
    if (!ageNum || ageNum < 14 || ageNum > 120) {
      setErrorMessage("Bitte ein Alter zwischen 14 und 120 Jahren angeben.");
      return false;
    }
    if (!heightNum || heightNum < 100 || heightNum > 250) {
      setErrorMessage("Bitte eine Größe zwischen 100 und 250 cm angeben.");
      return false;
    }
    if (!weightNum || weightNum < 30 || weightNum > 300) {
      setErrorMessage("Bitte ein Gewicht zwischen 30 und 300 kg angeben.");
      return false;
    }
    return true;
  }

  async function handleNext() {
    setErrorMessage(null);

    if (step === 1) {
      if (!validateStep1()) return;
      setStep(2);
      return;
    }
    if (step === 2) {
      setStep(3);
      return;
    }

    setSubmitting(true);
    try {
      const macros = await calculateMacros({
        gender,
        ageYears: Number(age),
        heightCm: Number(height),
        weightKg: Number(weight),
        activityLevel,
        goal,
      });
      onComplete({ dietType, allergies, macros });
    } catch (err) {
      setErrorMessage(
        `matching-service nicht erreichbar (Port 3001). Läuft der Service? Details: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        {step > 1 ? (
          <Text
            style={styles.backButton}
            onPress={() => {
              setErrorMessage(null);
              setStep(step - 1);
            }}
          >
            ←
          </Text>
        ) : (
          <View style={styles.backPlaceholder} />
        )}
        <View style={styles.progressWrapper}>
          <ProgressBar step={step} totalSteps={TOTAL_STEPS} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.stepLabel}>SCHRITT {step} VON {TOTAL_STEPS}</Text>
        <Text style={typography.headline}>{stepTitle}</Text>
        <Text style={[typography.body, styles.subtitle]}>{stepSubtitle}</Text>

        {step === 1 ? (
          <View style={styles.stepBody}>
            <Text style={typography.sectionLabel}>Geschlecht</Text>
            <View style={styles.spacerSm} />
            <SegmentedControl
              value={gender}
              onChange={setGender}
              options={[
                { value: "female", label: "Weiblich" },
                { value: "male", label: "Männlich" },
              ]}
            />
            <View style={styles.spacerMd} />
            <LabeledInput label="Alter (Jahre)" value={age} onChangeText={setAge} />
            <LabeledInput label="Größe (cm)" value={height} onChangeText={setHeight} />
            <LabeledInput label="Gewicht (kg)" value={weight} onChangeText={setWeight} />
          </View>
        ) : null}

        {step === 2 ? (
          <View style={styles.stepBody}>
            {ACTIVITY_OPTIONS.map((option) => (
              <SelectableCard
                key={option.value}
                title={option.title}
                subtitle={option.subtitle}
                selected={activityLevel === option.value}
                onPress={() => setActivityLevel(option.value)}
              />
            ))}
          </View>
        ) : null}

        {step === 3 ? (
          <View style={styles.stepBody}>
            {GOAL_OPTIONS.map((option) => (
              <SelectableCard
                key={option.value}
                title={option.title}
                subtitle={option.subtitle}
                selected={goal === option.value}
                onPress={() => setGoal(option.value)}
              />
            ))}

            <View style={styles.spacerMd} />
            <Text style={typography.sectionLabel}>Ernährungsweise</Text>
            <View style={styles.spacerSm} />
            <SegmentedControl
              value={dietType}
              onChange={setDietType}
              options={[
                { value: "omnivore", label: "Alles" },
                { value: "vegetarian", label: "Vegetarisch" },
                { value: "vegan", label: "Vegan" },
              ]}
            />

            <View style={styles.spacerMd} />
            <Text style={typography.sectionLabel}>Unverträglichkeiten (optional)</Text>
            <View style={styles.spacerSm} />
            <View style={styles.chipRow}>
              {ALLERGY_OPTIONS.map((option) => (
                <Chip
                  key={option.value}
                  label={option.label}
                  tone="danger"
                  selected={allergies.includes(option.value)}
                  onPress={() => toggleAllergy(option.value)}
                />
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        <PrimaryButton
          label={step < TOTAL_STEPS ? "Weiter →" : "Plan erstellen →"}
          onPress={handleNext}
          loading={submitting}
        />
      </View>
    </View>
  );
}

function LabeledInput({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType="numeric"
        style={styles.input}
        placeholderTextColor={colors.textMuted}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  backButton: {
    fontSize: 20,
    color: colors.accentDark,
    width: 36,
    height: 36,
    lineHeight: 36,
    textAlign: "center",
    backgroundColor: colors.accentTint,
    borderRadius: 999,
  },
  backPlaceholder: {
    width: 36,
    height: 36,
  },
  progressWrapper: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  stepLabel: {
    ...typography.sectionLabel,
    marginTop: spacing.md,
  },
  subtitle: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  stepBody: {
    marginTop: spacing.sm,
  },
  spacerSm: {
    height: spacing.sm,
  },
  spacerMd: {
    height: spacing.lg,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    color: colors.textPrimary,
  },
  footer: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
});

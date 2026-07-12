import { useState } from "react";
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SplashScreen } from "./src/screens/SplashScreen";
import { OnboardingScreen, type OnboardingResult } from "./src/screens/OnboardingScreen";
import { HomeScreen } from "./src/screens/HomeScreen";
import { WochenplanScreen } from "./src/screens/WochenplanScreen";
import { EinkaufslisteScreen } from "./src/screens/EinkaufslisteScreen";
import { ProfilScreen } from "./src/screens/ProfilScreen";
import { BottomNav, type MainScreen } from "./src/components/BottomNav";
import { PrimaryButton } from "./src/components/PrimaryButton";
import { generateWeekPlan } from "./src/domain/weekPlan";
import { fetchGroceryList } from "./src/api/client";
import type { DietType, GroceryListGroup, MacroResult, WeekPlanMeal } from "./src/api/types";
import { colors, spacing, typography } from "./src/theme";

type AppState = "splash" | "onboarding" | "generating" | "ready" | "error";

export default function App() {
  const [state, setState] = useState<AppState>("splash");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeScreen, setActiveScreen] = useState<MainScreen>("home");

  // Vollständige Onboarding-Angaben + berechnete Makros — Grundlage für
  // ProfilScreen (reine Anzeige) und für "Plan neu generieren".
  const [profile, setProfile] = useState<OnboardingResult | null>(null);
  const [meals, setMeals] = useState<WeekPlanMeal[]>([]);
  const [groceryGroups, setGroceryGroups] = useState<GroceryListGroup[]>([]);
  const [groceryLoading, setGroceryLoading] = useState(false);

  async function runPlanGeneration(dietType: DietType, allergies: string[], macroResult: MacroResult) {
    setState("generating");
    setErrorMessage(null);
    try {
      const weekPlan = await generateWeekPlan({ dietType, allergies, dailyMacros: macroResult });
      setMeals(weekPlan);
      setState("ready");
      setActiveScreen("plan");
      void loadGroceryList(weekPlan);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Unbekannter Fehler bei der Plan-Generierung.");
      setState("error");
    }
  }

  async function loadGroceryList(weekPlan: WeekPlanMeal[]) {
    setGroceryLoading(true);
    try {
      // Tatsächliche (ggf. skalierte) Zutatenmengen mitschicken statt nur
      // die recipeId — matching-service passt die Kohlenhydrat-Quelle pro
      // Mahlzeit an das Kalorienziel an (siehe portionScaling.ts), die
      // Einkaufsliste muss diese Menge zeigen, nicht die Basis-Portion.
      const { groups } = await fetchGroceryList(
        weekPlan.map((m) => ({
          recipeId: m.recipe.id,
          portions: 1,
          ingredientsPerPortion: m.recipe.ingredientsPerPortion,
        })),
      );
      setGroceryGroups(groups);
    } catch {
      setGroceryGroups([]);
    } finally {
      setGroceryLoading(false);
    }
  }

  function handleOnboardingComplete(result: OnboardingResult) {
    setProfile(result);
    void runPlanGeneration(result.dietType, result.allergies, result.macros);
  }

  // REQ-004: "Nutzer kann den Plan mit einem Tap neu generieren" — nutzt
  // dieselben Onboarding-Eingaben (Diät/Allergien/Makro-Ziel) erneut.
  function handleRegenerate() {
    if (!profile) return;
    void runPlanGeneration(profile.dietType, profile.allergies, profile.macros);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      {state === "splash" ? <SplashScreen onStart={() => setState("onboarding")} /> : null}

      {state === "onboarding" ? <OnboardingScreen onComplete={handleOnboardingComplete} /> : null}

      {state === "generating" ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accentDark} size="large" />
          <Text style={[typography.body, styles.centeredText]}>Dein Wochenplan wird erstellt…</Text>
        </View>
      ) : null}

      {state === "error" ? (
        <View style={styles.centered}>
          <Text style={typography.title}>Das hat nicht geklappt</Text>
          <Text style={[typography.caption, styles.centeredText]}>{errorMessage}</Text>
          <View style={styles.retryButton}>
            <PrimaryButton label="Erneut versuchen" onPress={() => setState("onboarding")} />
          </View>
        </View>
      ) : null}

      {state === "ready" && profile ? (
        <View style={styles.flexFill}>
          <View style={styles.flexFill}>
            {activeScreen === "home" ? <HomeScreen /> : null}
            {activeScreen === "plan" ? (
              <WochenplanScreen meals={meals} loading={false} onRegenerate={handleRegenerate} />
            ) : null}
            {activeScreen === "grocery" ? (
              <EinkaufslisteScreen groups={groceryGroups} loading={groceryLoading} />
            ) : null}
            {activeScreen === "profile" ? <ProfilScreen profile={profile} /> : null}
          </View>
          <BottomNav active={activeScreen} onChange={setActiveScreen} />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  flexFill: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    gap: spacing.md,
  },
  centeredText: {
    textAlign: "center",
  },
  retryButton: {
    marginTop: spacing.md,
    alignSelf: "stretch",
  },
});

import React from "react";
import { View, StyleSheet, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useOnboardingContext } from "../OnboardingContext";

type Props = {
  navigation: any;
};

const stateOptions = [
  { id: "energised", label: "Energised and ready", icon: "zap" as const },
  {
    id: "overwhelmed",
    label: "Overwhelmed and stretched",
    icon: "alert-circle" as const,
  },
  {
    id: "burnt_out",
    label: "Burnt out or recovering",
    icon: "battery" as const,
  },
  { id: "stuck", label: "Stuck or stagnant", icon: "pause-circle" as const },
  {
    id: "rebuilding",
    label: "Rebuilding after a setback",
    icon: "refresh-cw" as const,
  },
  { id: "curious", label: "Curious and exploring", icon: "compass" as const },
];

export function EmotionalStateScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { payload, update } = useOnboardingContext();

  const canContinue = !!payload.currentState;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.backgroundRoot,
          paddingTop: insets.top + Spacing.lg,
        },
      ]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText type="h2" style={styles.heading}>
          How would you describe where you are right now?
        </ThemedText>
        <ThemedText style={[styles.subheading, { color: theme.textSecondary }]}>
          This is a temperature check. We will not suggest six new habits if you
          are barely holding on.
        </ThemedText>

        <View style={styles.optionList}>
          {stateOptions.map((option) => {
            const selected = payload.currentState === option.id;
            return (
              <Pressable
                key={option.id}
                onPress={() => update("currentState", option.id)}
                style={[
                  styles.optionCard,
                  {
                    backgroundColor: selected
                      ? theme.primary + "15"
                      : theme.backgroundDefault,
                    borderColor: selected ? theme.primary : theme.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.optionIcon,
                    { backgroundColor: theme.primary + "20" },
                  ]}
                >
                  <Feather name={option.icon} size={20} color={theme.primary} />
                </View>
                <ThemedText style={styles.optionLabel}>
                  {option.label}
                </ThemedText>
                {selected ? (
                  <View
                    style={[
                      styles.checkBadge,
                      { backgroundColor: theme.primary },
                    ]}
                  >
                    <Feather name="check" size={14} color="#fff" />
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.navButtons}>
          <Pressable
            style={[styles.backButton, { borderColor: theme.border }]}
            onPress={() => navigation.goBack()}
          >
            <ThemedText style={{ color: theme.textSecondary }}>Back</ThemedText>
          </Pressable>
          <Pressable
            style={[
              styles.continueButton,
              { backgroundColor: canContinue ? theme.primary : theme.border },
            ]}
            onPress={() => navigation.navigate("Tone")}
            disabled={!canContinue}
          >
            <ThemedText style={styles.continueButtonText}>Continue</ThemedText>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  scrollContent: {
    flexGrow: 1,
  },
  heading: {
    marginBottom: Spacing.md,
  },
  subheading: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  optionList: {
    gap: Spacing.sm,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    gap: Spacing.md,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  optionLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
  checkBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  navButtons: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  backButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  continueButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  continueButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
});

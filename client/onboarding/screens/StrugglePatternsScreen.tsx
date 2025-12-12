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

const struggleOptions = [
  {
    id: "inconsistency",
    label: "Inconsistency",
    description: "I start strong, then fade after a week",
  },
  {
    id: "restart",
    label: "Hard to Restart",
    description: "I skip one day and never come back",
  },
  {
    id: "overambition",
    label: "Overambition",
    description: "I set goals that are way too ambitious",
  },
  {
    id: "forgetfulness",
    label: "Forgetfulness",
    description: "I forget to do things unless I am reminded",
  },
  {
    id: "procrastination",
    label: "Procrastination",
    description: "I put things off until I feel ready",
  },
  {
    id: "accountability",
    label: "Lack of Accountability",
    description: "I lose motivation when no one is watching",
  },
  {
    id: "distraction",
    label: "Distraction",
    description: "I get distracted by new ideas",
  },
  {
    id: "burnout",
    label: "Burnout",
    description: "I burn out, then stop everything",
  },
  {
    id: "perfectionism",
    label: "Perfectionism",
    description: "I wait for the perfect time that never comes",
  },
];

const MAX_SELECTIONS = 3;

export function StrugglePatternsScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { payload, update } = useOnboardingContext();

  const togglePattern = (id: string) => {
    const current = payload.strugglePatterns ?? [];
    if (current.includes(id)) {
      update(
        "strugglePatterns",
        current.filter((p: string) => p !== id)
      );
    } else {
      // Enforce max 3 selections
      if (current.length < MAX_SELECTIONS) {
        update("strugglePatterns", [...current, id]);
      }
    }
  };

  const canContinue = (payload.strugglePatterns?.length ?? 0) >= 1;

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
          What trips you up?
        </ThemedText>
        <ThemedText style={[styles.subheading, { color: theme.textSecondary }]}>
          Pick up to 3 patterns that sound like you.
        </ThemedText>

        {(payload.strugglePatterns?.length ?? 0) > 0 && (
          <ThemedText
            style={[
              styles.selectionCounter,
              { color: theme.primary, marginBottom: Spacing.md },
            ]}
          >
            {payload.strugglePatterns?.length} of {MAX_SELECTIONS} selected
          </ThemedText>
        )}

        <View style={styles.optionList}>
          {struggleOptions.map((struggle) => {
            const selected = (payload.strugglePatterns ?? []).includes(
              struggle.id
            );
            return (
              <Pressable
                key={struggle.id}
                onPress={() => togglePattern(struggle.id)}
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
                    styles.checkbox,
                    {
                      backgroundColor: selected ? theme.primary : "transparent",
                      borderColor: selected ? theme.primary : theme.border,
                    },
                  ]}
                >
                  {selected ? (
                    <Feather name="check" size={14} color="#fff" />
                  ) : null}
                </View>
                <View style={styles.optionContent}>
                  <ThemedText style={styles.optionLabel}>
                    {struggle.label}
                  </ThemedText>
                  {selected && (
                    <ThemedText
                      style={[
                        styles.optionDescription,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {struggle.description}
                    </ThemedText>
                  )}
                </View>
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
            onPress={() => navigation.navigate("Motivation")}
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
  selectionCounter: {
    fontSize: 13,
    fontWeight: "600",
  },
  optionList: {
    gap: Spacing.sm,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  optionDescription: {
    fontSize: 12,
    marginTop: 4,
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

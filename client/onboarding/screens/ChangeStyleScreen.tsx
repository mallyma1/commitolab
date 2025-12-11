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

const changeStyleOptions = [
  {
    id: "slow_and_steady",
    label: "Slow and steady",
    description: "I prefer small changes that build over time. Sustainable beats intense.",
  },
  {
    id: "deep_dive",
    label: "Deep dive",
    description: "I like to go all in. I would rather commit hard and adjust later.",
  },
  {
    id: "structured_plan",
    label: "Structured plan",
    description: "I want a clear schedule and reminders. I need the scaffolding.",
  },
  {
    id: "flexible_flow",
    label: "Flexible flow",
    description: "I prefer loose guidelines. Too much structure feels rigid.",
  },
  {
    id: "accountability",
    label: "Accountability",
    description: "I need someone or something watching. Left alone, I drift.",
  },
];

export function ChangeStyleScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { payload, update } = useOnboardingContext();

  const canContinue = !!payload.changeStyle;

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
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText type="h2" style={styles.heading}>
          How do you prefer to change?
        </ThemedText>
        <ThemedText style={[styles.subheading, { color: theme.textSecondary }]}>
          Pick the one that feels most like you. We will design your streak intensity around this.
        </ThemedText>

        <View style={styles.optionList}>
          {changeStyleOptions.map((option) => {
            const selected = payload.changeStyle === option.id;
            return (
              <Pressable
                key={option.id}
                onPress={() => update("changeStyle", option.id)}
                style={[
                  styles.optionCard,
                  {
                    backgroundColor: selected ? theme.primary + "15" : theme.backgroundDefault,
                    borderColor: selected ? theme.primary : theme.border,
                  },
                ]}
              >
                <View style={styles.optionContent}>
                  <ThemedText style={styles.optionLabel}>{option.label}</ThemedText>
                  <ThemedText style={[styles.optionDesc, { color: theme.textSecondary }]}>
                    {option.description}
                  </ThemedText>
                </View>
                {selected ? (
                  <View style={[styles.checkBadge, { backgroundColor: theme.primary }]}>
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
            onPress={() => navigation.navigate("State")}
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
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  optionDesc: {
    fontSize: 13,
    lineHeight: 18,
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

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

const toneOptions = [
  { id: "direct", label: "Direct and no-nonsense" },
  { id: "encouraging", label: "Encouraging and warm" },
  { id: "analytical", label: "Analytical and data-driven" },
  { id: "stoic", label: "Stoic and grounded" },
  { id: "humorous", label: "Humorous and light" },
];

const accountabilityOptions = [
  { id: "light", label: "Light", description: "Gentle reminders, no pressure" },
  {
    id: "moderate",
    label: "Moderate",
    description: "Clear nudges, some pushback on excuses",
  },
  {
    id: "strict",
    label: "Strict",
    description: "Call me out when I slip, no hand-holding",
  },
];

export function ToneScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { payload, update, prefetchAI } = useOnboardingContext();

  const toggleTone = (tone: string) => {
    const current = payload.tonePreferences ?? [];
    if (current.includes(tone)) {
      update(
        "tonePreferences",
        current.filter((t: string) => t !== tone)
      );
    } else if (current.length < 2) {
      update("tonePreferences", [...current, tone]);
    }
  };

  const canContinue =
    (payload.tonePreferences?.length ?? 0) >= 1 &&
    !!payload.accountabilityLevel;

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
          How should we talk to you?
        </ThemedText>
        <ThemedText style={[styles.subheading, { color: theme.textSecondary }]}>
          Pick 1-2 tones that feel right.
        </ThemedText>

        <View style={styles.chipGrid}>
          {toneOptions.map((tone) => {
            const selected = (payload.tonePreferences ?? []).includes(tone.id);
            return (
              <Pressable
                key={tone.id}
                onPress={() => toggleTone(tone.id)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: selected
                      ? theme.primary + "20"
                      : theme.backgroundDefault,
                    borderColor: selected ? theme.primary : theme.border,
                  },
                ]}
              >
                <ThemedText
                  style={[
                    styles.chipText,
                    selected ? { color: theme.primary } : null,
                  ]}
                >
                  {tone.label}
                </ThemedText>
                {selected ? (
                  <Feather name="check" size={14} color={theme.primary} />
                ) : null}
              </Pressable>
            );
          })}
        </View>

        <ThemedText style={[styles.fieldLabel, { marginTop: Spacing.xl }]}>
          How much accountability do you want?
        </ThemedText>

        <View style={styles.optionList}>
          {accountabilityOptions.map((option) => {
            const selected = payload.accountabilityLevel === option.id;
            return (
              <Pressable
                key={option.id}
                onPress={() => update("accountabilityLevel", option.id as any)}
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
                <View style={styles.optionContent}>
                  <ThemedText style={styles.optionLabel}>
                    {option.label}
                  </ThemedText>
                  <ThemedText
                    style={[styles.optionDesc, { color: theme.textSecondary }]}
                  >
                    {option.description}
                  </ThemedText>
                </View>
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
            onPress={() => {
              prefetchAI(payload);
              navigation.navigate("Summary");
            }}
            disabled={!canContinue}
          >
            <ThemedText style={styles.continueButtonText}>
              Generate My Profile
            </ThemedText>
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
  fieldLabel: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  chipText: {
    fontSize: 13,
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

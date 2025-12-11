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
  "I start strong, then fade after a week",
  "I skip one day and never come back",
  "I set goals that are way too ambitious",
  "I forget to do things unless I am reminded",
  "I put things off until I feel ready",
  "I lose motivation when no one is watching",
  "I get distracted by new ideas",
  "I burn out, then stop everything",
  "I wait for the perfect time that never comes",
];

export function StrugglePatternsScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { payload, update } = useOnboardingContext();

  const togglePattern = (pattern: string) => {
    const current = payload.strugglePatterns;
    if (current.includes(pattern)) {
      update("strugglePatterns", current.filter((p) => p !== pattern));
    } else {
      update("strugglePatterns", [...current, pattern]);
    }
  };

  const canContinue = payload.strugglePatterns.length >= 1;

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
          What trips you up the most?
        </ThemedText>
        <ThemedText style={[styles.subheading, { color: theme.textSecondary }]}>
          Be honest. This helps us anticipate where you might slip and design around it.
        </ThemedText>

        <View style={styles.optionList}>
          {struggleOptions.map((pattern) => {
            const selected = payload.strugglePatterns.includes(pattern);
            return (
              <Pressable
                key={pattern}
                onPress={() => togglePattern(pattern)}
                style={[
                  styles.optionCard,
                  {
                    backgroundColor: selected ? theme.primary + "15" : theme.backgroundDefault,
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
                  {selected ? <Feather name="check" size={14} color="#fff" /> : null}
                </View>
                <ThemedText style={styles.optionText}>{pattern}</ThemedText>
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
  optionList: {
    gap: Spacing.sm,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
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
  },
  optionText: {
    flex: 1,
    fontSize: 14,
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

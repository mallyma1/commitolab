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

const rewardOptions = [
  { id: "streak_counter", label: "Watching my streak number grow" },
  { id: "visible_progress", label: "Seeing visual proof of progress" },
  { id: "avoiding_loss", label: "Not wanting to break my streak" },
  { id: "self_trust", label: "Building trust with myself" },
  { id: "external_praise", label: "Getting recognition from others" },
  { id: "intrinsic", label: "Feeling good about keeping a promise" },
  { id: "health", label: "Feeling healthier or more energetic" },
  { id: "control", label: "Feeling in control of my life" },
];

export function MotivationScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { payload, update } = useOnboardingContext();

  const toggleReward = (reward: string) => {
    const current = payload.rewardStyle ?? [];
    if (current.includes(reward)) {
      update(
        "rewardStyle",
        current.filter((r: string) => r !== reward)
      );
    } else if (current.length < 3) {
      update("rewardStyle", [...current, reward]);
    }
  };

  const canContinue = (payload.rewardStyle?.length ?? 0) >= 1;

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
          What actually motivates you to keep going?
        </ThemedText>
        <ThemedText style={[styles.subheading, { color: theme.textSecondary }]}>
          Pick up to 3. This tells us how to frame your progress.
        </ThemedText>

        <View style={styles.optionList}>
          {rewardOptions.map((reward) => {
            const selected = (payload.rewardStyle ?? []).includes(reward.id);
            return (
              <Pressable
                key={reward.id}
                onPress={() => toggleReward(reward.id)}
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
                <ThemedText style={styles.optionText}>
                  {reward.label}
                </ThemedText>
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
            onPress={() => navigation.navigate("ChangeStyle")}
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

import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing } from "@/constants/theme";

type Props = {
  navigation: any;
};

export function OnboardingIntroScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.backgroundRoot,
          paddingTop: insets.top + Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xl,
        },
      ]}
    >
      <View style={styles.content}>
        <ThemedText type="h1" style={styles.heading}>
          Build the version of you that shows up.
        </ThemedText>
        <ThemedText style={[styles.subheading, { color: theme.textSecondary }]}>
          This is not a habit tracker. It is a commitment system that learns how
          you tick, then designs realistic streaks around your life.
        </ThemedText>

        <View style={styles.promises}>
          <PromiseItem icon="clock" text="Takes about 3 minutes." />
          <PromiseItem
            icon="shield"
            text="No judgement. We are here to understand, not to diagnose."
          />
          <PromiseItem
            icon="zap"
            text="At the end you will receive a personal profile and 3-5 starter commitments designed for your patterns."
          />
        </View>
      </View>

      <Pressable
        style={[styles.primaryButton, { backgroundColor: theme.primary }]}
        onPress={() => navigation.navigate("Roles")}
      >
        <ThemedText style={styles.primaryButtonText}>Let's Begin</ThemedText>
        <Feather name="arrow-right" size={20} color="#fff" />
      </Pressable>
    </View>
  );
}

function PromiseItem({
  icon,
  text,
}: {
  icon: keyof typeof Feather.glyphMap;
  text: string;
}) {
  const { theme } = useTheme();

  return (
    <View style={styles.promiseRow}>
      <View
        style={[styles.promiseIcon, { backgroundColor: theme.primary + "20" }]}
      >
        <Feather name={icon} size={16} color={theme.primary} />
      </View>
      <ThemedText style={[styles.promiseText, { color: theme.textSecondary }]}>
        {text}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    justifyContent: "space-between",
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  heading: {
    marginBottom: Spacing.md,
  },
  subheading: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  promises: {
    gap: Spacing.md,
  },
  promiseRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  promiseIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  promiseText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});

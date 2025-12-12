import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, EarthyColors } from "@/constants/theme";
import { getHabitProfile, HabitProfileType } from "@/lib/habit-profile";

interface HabitProfileCardProps {
  profileType: HabitProfileType | string | null;
  onLearnMore?: () => void;
}

export function HabitProfileCard({
  profileType,
  onLearnMore,
}: HabitProfileCardProps) {
  const { theme } = useTheme();

  if (!profileType) {
    return (
      <Card style={styles.card}>
        <View style={styles.emptyState}>
          <Feather name="user" size={32} color={theme.textSecondary} />
          <ThemedText
            style={[styles.emptyText, { color: theme.textSecondary }]}
          >
            Complete behavioral onboarding to discover your habit profile
          </ThemedText>
        </View>
      </Card>
    );
  }

  const profile = getHabitProfile(profileType as HabitProfileType);

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: profile.color }]}>
          <Feather name="user" size={20} color="#fff" />
        </View>
        <View style={styles.headerText}>
          <ThemedText type="h4">{profile.name}</ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            Your habit profile
          </ThemedText>
        </View>
      </View>

      <ThemedText style={[styles.description, { color: theme.textSecondary }]}>
        {profile.description}
      </ThemedText>

      <View style={styles.section}>
        <ThemedText
          style={[styles.sectionLabel, { color: theme.textSecondary }]}
        >
          Key strength
        </ThemedText>
        <View style={styles.bulletItem}>
          <Feather
            name="check-circle"
            size={14}
            color={EarthyColors.forestGreen}
          />
          <ThemedText style={styles.bulletText}>
            {profile.strengths[0]}
          </ThemedText>
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText
          style={[styles.sectionLabel, { color: theme.textSecondary }]}
        >
          Watch out for
        </ThemedText>
        <View style={styles.bulletItem}>
          <Feather name="alert-circle" size={14} color={EarthyColors.clayRed} />
          <ThemedText style={styles.bulletText}>
            {profile.riskZones[0]}
          </ThemedText>
        </View>
      </View>

      {onLearnMore ? (
        <Pressable
          style={[
            styles.learnMoreButton,
            { backgroundColor: `${profile.color}15` },
          ]}
          onPress={onLearnMore}
        >
          <ThemedText style={[styles.learnMoreText, { color: profile.color }]}>
            View full profile
          </ThemedText>
          <Feather name="arrow-right" size={16} color={profile.color} />
        </Pressable>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  badge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  headerText: {
    flex: 1,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  section: {
    marginBottom: Spacing.sm,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  bulletItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  bulletText: {
    fontSize: 14,
    flex: 1,
  },
  learnMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.md,
  },
  learnMoreText: {
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
  },
  emptyText: {
    textAlign: "center",
    maxWidth: 200,
  },
});

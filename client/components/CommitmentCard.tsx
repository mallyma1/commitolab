import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  WithSpringConfig,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { Commitment } from "@/hooks/useCommitments";

interface CommitmentCardProps {
  commitment: Commitment;
  onPress: () => void;
}

const springConfig: WithSpringConfig = {
  damping: 15,
  mass: 0.3,
  stiffness: 150,
  overshootClamping: true,
  energyThreshold: 0.001,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const categoryIcons: Record<string, keyof typeof Feather.glyphMap> = {
  fitness: "activity",
  reading: "book",
  meditation: "sun",
  sobriety: "heart",
  learning: "book-open",
  creative: "edit-3",
};

const categoryColors: Record<string, string> = {
  fitness: "#EF4444",
  reading: "#8B5CF6",
  meditation: "#10B981",
  sobriety: "#F59E0B",
  learning: "#3B82F6",
  creative: "#EC4899",
};

export default function CommitmentCard({ commitment, onPress }: CommitmentCardProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const daysLeft = Math.max(
    0,
    Math.ceil(
      (new Date(commitment.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, springConfig);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springConfig);
  };

  const categoryColor = categoryColors[commitment.category] || theme.primary;
  const categoryIcon = categoryIcons[commitment.category] || "target";

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.card,
        { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
        animatedStyle,
      ]}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <ThemedText type="h4" numberOfLines={1} style={styles.title}>
            {commitment.title}
          </ThemedText>
          <View style={[styles.categoryBadge, { backgroundColor: `${categoryColor}20` }]}>
            <Feather name={categoryIcon} size={12} color={categoryColor} />
            <ThemedText style={[styles.categoryText, { color: categoryColor }]}>
              {commitment.category}
            </ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.streakContainer}>
          <View style={[styles.streakBadge, { backgroundColor: theme.primary }]}>
            <ThemedText style={styles.streakNumber}>{commitment.currentStreak}</ThemedText>
            <ThemedText style={styles.streakLabel}>day streak</ThemedText>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Feather name="award" size={16} color={theme.accent} />
            <ThemedText style={[styles.statText, { color: theme.textSecondary }]}>
              Best: {commitment.longestStreak}
            </ThemedText>
          </View>
          <View style={styles.stat}>
            <Feather name="calendar" size={16} color={theme.textSecondary} />
            <ThemedText style={[styles.statText, { color: theme.textSecondary }]}>
              {daysLeft} days left
            </ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <ThemedText style={[styles.checkInText, { color: theme.primary }]}>
          Tap to check in
        </ThemedText>
        <Feather name="chevron-right" size={20} color={theme.primary} />
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.md,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  content: {
    marginBottom: Spacing.md,
  },
  streakContainer: {
    marginBottom: Spacing.md,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "baseline",
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    gap: 6,
  },
  streakNumber: {
    fontSize: 32,
    fontWeight: "700",
    color: "#fff",
  },
  streakLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(255,255,255,0.9)",
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.lg,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statText: {
    fontSize: 14,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 4,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  checkInText: {
    fontSize: 14,
    fontWeight: "600",
  },
});

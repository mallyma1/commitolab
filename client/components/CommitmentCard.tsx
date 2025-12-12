import React from "react";
import {
  View,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Platform,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  WithSpringConfig,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { Commitment } from "@/hooks/useCommitments";

interface CommitmentCardProps {
  commitment: Commitment;
  onPress: () => void;
  isCheckedInToday?: boolean;
  onQuickCheckIn?: () => void;
  isCheckingIn?: boolean;
}

const springConfig: WithSpringConfig = {
  damping: 15,
  mass: 0.3,
  stiffness: 150,
  overshootClamping: true,
  energyThreshold: 0.001,
};

const bounceConfig: WithSpringConfig = {
  damping: 8,
  mass: 0.5,
  stiffness: 200,
};

const categoryIcons: Record<string, keyof typeof Feather.glyphMap> = {
  fitness: "activity",
  reading: "book",
  meditation: "sun",
  sobriety: "heart",
  learning: "book-open",
  creative: "edit-3",
  work: "briefcase",
  creativity: "feather",
  mental_health: "heart",
  nutrition: "coffee",
  personal_improvement: "trending-up",
  custom: "target",
};

const categoryColors: Record<string, string> = {
  fitness: "#EF4444",
  reading: "#8B5CF6",
  meditation: "#10B981",
  sobriety: "#F59E0B",
  learning: "#3B82F6",
  creative: "#EC4899",
  work: "#6366F1",
  creativity: "#EC4899",
  mental_health: "#10B981",
  nutrition: "#F59E0B",
  personal_improvement: "#8B5CF6",
  custom: "#6B7280",
};

function triggerHaptic() {
  if (Platform.OS !== "web") {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }
}

export default function CommitmentCard({
  commitment,
  onPress,
  isCheckedInToday = false,
  onQuickCheckIn,
  isCheckingIn = false,
}: CommitmentCardProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const checkButtonScale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const checkButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkButtonScale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, springConfig);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springConfig);
  };

  const handleCheckIn = () => {
    if (isCheckedInToday || isCheckingIn || !onQuickCheckIn) return;

    checkButtonScale.value = withSequence(
      withSpring(1.2, bounceConfig),
      withSpring(1, bounceConfig)
    );

    triggerHaptic();
    onQuickCheckIn();
  };

  const categoryColor = categoryColors[commitment.category] || theme.primary;
  const categoryIcon = categoryIcons[commitment.category] || "target";

  const formatCadence = (cadence: string) => {
    return cadence.charAt(0).toUpperCase() + cadence.slice(1);
  };

  return (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: theme.backgroundDefault,
          borderColor: isCheckedInToday ? theme.success : theme.border,
          borderWidth: isCheckedInToday ? 2 : 1,
        },
        animatedStyle,
      ]}
    >
      <View style={styles.topRow}>
        <Pressable
          style={styles.titleSection}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <View
            style={[styles.categoryDot, { backgroundColor: categoryColor }]}
          />
          <ThemedText type="h4" numberOfLines={1} style={styles.title}>
            {commitment.title}
          </ThemedText>
        </Pressable>

        <Pressable
          onPress={handleCheckIn}
          disabled={isCheckedInToday || isCheckingIn}
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
        >
          <Animated.View
            style={[
              styles.checkButton,
              {
                backgroundColor: isCheckedInToday
                  ? theme.success
                  : `${theme.primary}15`,
                borderColor: isCheckedInToday ? theme.success : theme.primary,
                opacity: isCheckedInToday || isCheckingIn ? 0.7 : 1,
              },
              checkButtonAnimatedStyle,
            ]}
          >
            {isCheckingIn ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : isCheckedInToday ? (
              <Feather name="check" size={20} color="#fff" />
            ) : (
              <Feather name="plus" size={20} color={theme.primary} />
            )}
          </Animated.View>
        </Pressable>
      </View>

      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View style={styles.content}>
          <View style={styles.streakContainer}>
            <View
              style={[
                styles.streakBadge,
                {
                  backgroundColor:
                    commitment.currentStreak > 0
                      ? theme.primary
                      : theme.backgroundSecondary,
                },
              ]}
            >
              <ThemedText
                style={[
                  styles.streakNumber,
                  {
                    color:
                      commitment.currentStreak > 0
                        ? "#fff"
                        : theme.textSecondary,
                  },
                ]}
              >
                {commitment.currentStreak}
              </ThemedText>
              <ThemedText
                style={[
                  styles.streakLabel,
                  {
                    color:
                      commitment.currentStreak > 0
                        ? "rgba(255,255,255,0.9)"
                        : theme.textSecondary,
                  },
                ]}
              >
                day streak
              </ThemedText>
            </View>

            {commitment.currentStreak > 0 && commitment.currentStreak >= 3 ? (
              <View style={styles.fireContainer}>
                <Feather name="zap" size={16} color={theme.accent} />
              </View>
            ) : null}
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Feather name={categoryIcon} size={14} color={categoryColor} />
              <ThemedText
                style={[styles.metaText, { color: theme.textSecondary }]}
              >
                {commitment.category.replace("_", " ")}
              </ThemedText>
            </View>
            <View style={styles.metaItem}>
              <Feather name="repeat" size={14} color={theme.textSecondary} />
              <ThemedText
                style={[styles.metaText, { color: theme.textSecondary }]}
              >
                {formatCadence(commitment.cadence)}
              </ThemedText>
            </View>
            <View style={styles.metaItem}>
              <Feather name="award" size={14} color={theme.accent} />
              <ThemedText
                style={[styles.metaText, { color: theme.textSecondary }]}
              >
                Best: {commitment.longestStreak}
              </ThemedText>
            </View>
          </View>
        </View>

        {isCheckedInToday ? (
          <View
            style={[
              styles.statusBar,
              { backgroundColor: `${theme.success}15` },
            ]}
          >
            <Feather name="check-circle" size={14} color={theme.success} />
            <ThemedText style={[styles.statusText, { color: theme.success }]}>
              Checked in today
            </ThemedText>
          </View>
        ) : (
          <View
            style={[
              styles.statusBar,
              { backgroundColor: `${theme.primary}08` },
            ]}
          >
            <Feather name="clock" size={14} color={theme.primary} />
            <ThemedText style={[styles.statusText, { color: theme.primary }]}>
              Tap + to check in
            </ThemedText>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    paddingBottom: 0,
  },
  titleSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: Spacing.sm,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  title: {
    flex: 1,
  },
  checkButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingTop: Spacing.md,
  },
  streakContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "baseline",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    gap: 6,
  },
  streakNumber: {
    fontSize: 28,
    fontWeight: "700",
  },
  streakLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  fireContainer: {
    marginLeft: Spacing.xs,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.lg,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    textTransform: "capitalize",
  },
  statusBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "500",
  },
});

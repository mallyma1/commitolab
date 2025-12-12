import React, { useMemo, useCallback } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { ProGate } from "@/components/ProGate";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/query-client";
import { Spacing, BorderRadius, EarthyColors } from "@/constants/theme";
import type { DopamineEntry } from "@shared/schema";

const CHECKLIST_ITEMS = [
  {
    id: "movedBody",
    label: "Moved your body",
    icon: "activity",
    description: "Walk, workout, stretch or any physical effort.",
  },
  {
    id: "daylight",
    label: "Got daylight",
    icon: "sun",
    description: "At least a few minutes of natural light.",
  },
  {
    id: "social",
    label: "Real connection",
    icon: "users",
    description: "Spoke, laughed or shared a moment with someone.",
  },
  {
    id: "creative",
    label: "Created something",
    icon: "edit-3",
    description: "Even small: writing, cooking, building, planning.",
  },
  {
    id: "music",
    label: "Intentional music",
    icon: "music",
    description: "Listened to music on purpose, not just in the background.",
  },
  {
    id: "learning",
    label: "Learned something",
    icon: "book-open",
    description: "New idea, skill, or insight you did not have yesterday.",
  },
  {
    id: "coldExposure",
    label: "Cold exposure",
    icon: "droplet",
    description: "Cold shower, plunge or even a short cold rinse.",
  },
  {
    id: "protectedSleep",
    label: "Protected your sleep",
    icon: "moon",
    description: "Gave yourself a real chance to rest (bedtime, screens, comfort).",
  },
] as const;

type ChecklistKey = (typeof CHECKLIST_ITEMS)[number]["id"];

export default function DopamineLabScreen() {
  return (
    <ProGate feature="dopamineLab" featureName="Dopamine Lab">
      <DopamineLabContent />
    </ProGate>
  );
}

function DopamineLabContent() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const queryClient = useQueryClient();

  const { data: todayEntry, isLoading } = useQuery<DopamineEntry | null>({
    queryKey: ["/api/dopamine/today"],
    enabled: !!user,
  });

  const saveMutation = useMutation({
    mutationFn: async (updates: Partial<Record<ChecklistKey, boolean>>) => {
      const currentData = {
        movedBody: todayEntry?.movedBody ?? false,
        daylight: todayEntry?.daylight ?? false,
        social: todayEntry?.social ?? false,
        creative: todayEntry?.creative ?? false,
        music: todayEntry?.music ?? false,
        learning: todayEntry?.learning ?? false,
        coldExposure: todayEntry?.coldExposure ?? false,
        protectedSleep: todayEntry?.protectedSleep ?? false,
        ...updates,
      };
      return apiRequest("POST", "/api/dopamine", currentData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dopamine/today"] });
    },
  });

  const isChecked = useCallback(
    (id: ChecklistKey): boolean => {
      if (!todayEntry) return false;
      return Boolean((todayEntry as any)[id]);
    },
    [todayEntry],
  );

  const checkedCount = useMemo(() => {
    if (!todayEntry) return 0;
    return CHECKLIST_ITEMS.filter((item) => (todayEntry as any)[item.id]).length;
  }, [todayEntry]);

  const toggleItem = (id: ChecklistKey) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const newValue = !isChecked(id);
    saveMutation.mutate({ [id]: newValue });
  };

  const score = checkedCount;
  const maxScore = CHECKLIST_ITEMS.length;

  const insight = useMemo(() => {
    if (score === 0) {
      return "Start with one small win. One natural hit today already changes the pattern.";
    } else if (score <= 2) {
      return "Good start. Consistent small actions reshape your reward system over time.";
    } else if (score <= 4) {
      return "Solid balance. You are already giving your brain more stable rewards.";
    } else if (score <= 6) {
      return "Strong day. You are stacking habits that support mood, focus and motivation.";
    } else {
      return "Elite day. You are consistently choosing behaviours that compound over years, not minutes.";
    }
  }, [score]);

  const patternLabel = useMemo(() => {
    if (score === 0) return "Today is still wide open.";
    if (score <= 2) return "Light baseline of natural dopamine.";
    if (score <= 4) return "You are building a steady base.";
    if (score <= 6) return "You have a strong, protective pattern today.";
    return "This is the kind of day that rewires your defaults.";
  }, [score]);

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: headerHeight + Spacing.lg,
            paddingBottom: tabBarHeight + Spacing.xl + insets.bottom,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro card: why this lab exists */}
        <View
          style={[
            styles.educationCard,
            { backgroundColor: `${EarthyColors.forestGreen}15` },
          ]}
        >
          <Feather name="info" size={20} color={EarthyColors.forestGreen} />
          <View style={styles.educationContent}>
            <ThemedText type="h4" style={{ color: EarthyColors.forestGreen }}>
              The Dopamine Lab
            </ThemedText>
            <ThemedText style={[styles.educationText, { color: theme.textSecondary }]}>
              This space tracks the simple behaviours that support healthy dopamine
              regulation over time: movement, light, sleep, connection and effort.
              It is not medical advice, but a daily snapshot of the habits that keep
              your motivation system stable instead of spiking and crashing.
            </ThemedText>
            <ThemedText
              style={[
                styles.educationHint,
                { color: theme.textSecondary },
              ]}
            >
              Aim for at least 4 natural dopamine actions most days. A few small
              ticks here, done consistently, have more impact than any single big reset.
            </ThemedText>
          </View>
        </View>

        {/* Score and pattern */}
        <View style={styles.scoreSection}>
          <View
            style={[
              styles.scoreCircle,
              { borderColor: EarthyColors.copper },
            ]}
          >
            <ThemedText
              style={[styles.scoreNumber, { color: EarthyColors.copper }]}
            >
              {score}
            </ThemedText>
            <ThemedText
              style={[styles.scoreMax, { color: theme.textSecondary }]}
            >
              /{maxScore}
            </ThemedText>
          </View>
          <ThemedText style={[styles.scoreLabel, { color: theme.textSecondary }]}>
            Today&apos;s natural dopamine score
          </ThemedText>
          <ThemedText style={[styles.patternLabel, { color: theme.textSecondary }]}>
            {patternLabel}
          </ThemedText>
        </View>

        {/* How to use section */}
        <View style={styles.howToCard}>
          <ThemedText type="h4" style={{ marginBottom: Spacing.xs }}>
            How to use this each day
          </ThemedText>
          <View style={styles.howToRow}>
            <View style={styles.dot} />
            <ThemedText style={[styles.howToText, { color: theme.textSecondary }]}>
              Check off only what you genuinely did, even if it was small.
            </ThemedText>
          </View>
          <View style={styles.howToRow}>
            <View style={styles.dot} />
            <ThemedText style={[styles.howToText, { color: theme.textSecondary }]}>
              Use this as a counterweight to quick hits like scrolling, gambling,
              or constant notifications.
            </ThemedText>
          </View>
          <View style={styles.howToRow}>
            <View style={styles.dot} />
            <ThemedText style={[styles.howToText, { color: theme.textSecondary }]}>
              Do not chase perfection. The goal is a stable, repeatable pattern,
              not a perfect score.
            </ThemedText>
          </View>
        </View>

        {/* Checklist */}
        <ThemedText type="h4" style={styles.sectionTitle}>
          Today&apos;s checklist
        </ThemedText>

        <View style={styles.checklist}>
          {CHECKLIST_ITEMS.map((item) => {
            const checked = isChecked(item.id);
            return (
              <Pressable
                key={item.id}
                style={[
                  styles.checklistItem,
                  {
                    backgroundColor: checked
                      ? `${EarthyColors.forestGreen}15`
                      : theme.backgroundSecondary,
                    borderColor: checked ? EarthyColors.forestGreen : theme.border,
                    opacity: saveMutation.isPending ? 0.7 : 1,
                  },
                ]}
                onPress={() => toggleItem(item.id)}
                disabled={saveMutation.isPending}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      backgroundColor: checked
                        ? EarthyColors.forestGreen
                        : "transparent",
                      borderColor: checked
                        ? EarthyColors.forestGreen
                        : theme.border,
                    },
                  ]}
                >
                  {checked ? (
                    <Animated.View entering={FadeIn.duration(200)}>
                      <Feather name="check" size={16} color="#fff" />
                    </Animated.View>
                  ) : null}
                </View>

                <View style={styles.itemIcon}>
                  <Feather
                    name={item.icon as any}
                    size={20}
                    color={
                      checked ? EarthyColors.forestGreen : theme.textSecondary
                    }
                  />
                </View>

                <View style={styles.itemContent}>
                  <ThemedText
                    style={[
                      styles.itemLabel,
                      { color: checked ? EarthyColors.forestGreen : theme.text },
                    ]}
                  >
                    {item.label}
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.itemDescription,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {item.description}
                  </ThemedText>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Insight card */}
        <View
          style={[
            styles.insightCard,
            { backgroundColor: `${EarthyColors.copper}15` },
          ]}
        >
          <Feather name="zap" size={20} color={EarthyColors.copper} />
          <View style={styles.insightContent}>
            <ThemedText type="h4" style={{ color: EarthyColors.copper }}>
              Today&apos;s insight
            </ThemedText>
            <ThemedText
              style={[styles.insightText, { color: theme.text }]}
            >
              {insight}
            </ThemedText>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  educationCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
  },
  educationContent: {
    flex: 1,
  },
  educationText: {
    fontSize: 14,
    lineHeight: 22,
    marginTop: Spacing.xs,
  },
  educationHint: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: Spacing.sm,
  },
  scoreSection: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  scoreCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    marginBottom: Spacing.sm,
  },
  scoreNumber: {
    fontSize: 36,
    fontWeight: "700",
  },
  scoreMax: {
    fontSize: 18,
    fontWeight: "500",
  },
  scoreLabel: {
    fontSize: 14,
  },
  patternLabel: {
    fontSize: 13,
    marginTop: 4,
    textAlign: "center",
    paddingHorizontal: Spacing.md,
  },
  howToCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    backgroundColor: "rgba(255,255,255,0.01)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    marginBottom: Spacing.xl,
  },
  howToRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
    backgroundColor: EarthyColors.copper,
  },
  howToText: {
    fontSize: 13,
    lineHeight: 20,
    flex: 1,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  checklist: {
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  checklistItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  itemIcon: {
    width: 32,
    alignItems: "center",
  },
  itemContent: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  itemDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  insightCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
  },
  insightContent: {
    flex: 1,
  },
  insightText: {
    fontSize: 14,
    lineHeight: 22,
    marginTop: Spacing.xs,
  },
});

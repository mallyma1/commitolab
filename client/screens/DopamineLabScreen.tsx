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
  { id: "movedBody", label: "Moved body", icon: "activity", description: "Any physical activity" },
  { id: "daylight", label: "Got daylight", icon: "sun", description: "Natural light exposure" },
  { id: "social", label: "Social connection", icon: "users", description: "Meaningful interaction" },
  { id: "creative", label: "Creativity", icon: "edit-3", description: "Made or created something" },
  { id: "music", label: "Music", icon: "music", description: "Listened or played" },
  { id: "learning", label: "Learned something", icon: "book-open", description: "New information or skill" },
  { id: "coldExposure", label: "Cold exposure", icon: "droplet", description: "Cold shower or similar" },
  { id: "protectedSleep", label: "Protected sleep", icon: "moon", description: "Quality rest" },
] as const;

type ChecklistKey = typeof CHECKLIST_ITEMS[number]["id"];

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

  const isChecked = useCallback((id: ChecklistKey): boolean => {
    if (!todayEntry) return false;
    return Boolean(todayEntry[id]);
  }, [todayEntry]);

  const checkedCount = useMemo(() => {
    if (!todayEntry) return 0;
    return CHECKLIST_ITEMS.filter(item => todayEntry[item.id]).length;
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
      return "Start your natural dopamine journey today. Even one activity counts.";
    } else if (score <= 2) {
      return "Good start. Small consistent actions build lasting habits.";
    } else if (score <= 4) {
      return "Nice progress. Your brain is getting natural rewards.";
    } else if (score <= 6) {
      return "Excellent balance. You're supporting healthy dopamine production.";
    } else {
      return "Outstanding. You're building a foundation for sustainable motivation.";
    }
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
            paddingBottom: tabBarHeight + Spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.educationCard, { backgroundColor: `${EarthyColors.forestGreen}15` }]}>
          <Feather name="info" size={20} color={EarthyColors.forestGreen} />
          <View style={styles.educationContent}>
            <ThemedText type="h4" style={{ color: EarthyColors.forestGreen }}>
              Natural Dopamine
            </ThemedText>
            <ThemedText style={[styles.educationText, { color: theme.textSecondary }]}>
              Dopamine is your motivation molecule. Natural activities like movement, 
              sunlight, and connection provide sustainable rewards without the crash 
              of quick digital hits.
            </ThemedText>
          </View>
        </View>

        <View style={styles.scoreSection}>
          <View style={[styles.scoreCircle, { borderColor: EarthyColors.copper }]}>
            <ThemedText style={[styles.scoreNumber, { color: EarthyColors.copper }]}>
              {score}
            </ThemedText>
            <ThemedText style={[styles.scoreMax, { color: theme.textSecondary }]}>
              /{maxScore}
            </ThemedText>
          </View>
          <ThemedText style={[styles.scoreLabel, { color: theme.textSecondary }]}>
            Today's Natural Rewards
          </ThemedText>
        </View>

        <ThemedText type="h4" style={styles.sectionTitle}>
          Daily Checklist
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
                    borderColor: checked
                      ? EarthyColors.forestGreen
                      : theme.border,
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
                    color={checked ? EarthyColors.forestGreen : theme.textSecondary}
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
                  <ThemedText style={[styles.itemDescription, { color: theme.textSecondary }]}>
                    {item.description}
                  </ThemedText>
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={[styles.insightCard, { backgroundColor: `${EarthyColors.copper}15` }]}>
          <Feather name="zap" size={20} color={EarthyColors.copper} />
          <View style={styles.insightContent}>
            <ThemedText type="h4" style={{ color: EarthyColors.copper }}>
              Today's Insight
            </ThemedText>
            <ThemedText style={[styles.insightText, { color: theme.text }]}>
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
  scoreSection: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
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

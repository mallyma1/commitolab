import React, {
  useMemo,
  useCallback,
  useState,
} from "react";
import {
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Platform,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { ProGate } from "@/components/ProGate";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/query-client";
import {
  Spacing,
  BorderRadius,
  EarthyColors,
} from "@/constants/theme";
import type { DopamineEntry } from "@shared/schema";

const CHECKLIST_ITEMS = [
  {
    id: "movedBody",
    label: "Moved body",
    icon: "activity",
    description: "Any kind of movement counts.",
  },
  {
    id: "daylight",
    label: "Got daylight",
    icon: "sun",
    description: "Natural light outside or by a window.",
  },
  {
    id: "social",
    label: "Social connection",
    icon: "users",
    description: "One meaningful chat or check in.",
  },
  {
    id: "creative",
    label: "Creativity",
    icon: "edit-3",
    description: "Made or worked on something.",
  },
  {
    id: "music",
    label: "Music",
    icon: "music",
    description: "Listened or played intentionally.",
  },
  {
    id: "learning",
    label: "Learned something",
    icon: "book-open",
    description: "New idea, skill or insight.",
  },
  {
    id: "coldExposure",
    label: "Cold exposure",
    icon: "droplet",
    description: "Cold shower or similar reset.",
  },
  {
    id: "protectedSleep",
    label: "Protected sleep",
    icon: "moon",
    description: "Respected your sleep window.",
  },
] as const;

const INTRO_SLIDES = [
  {
    id: "what",
    title: "What is Dopamine Lab?",
    description:
      "A simple daily dashboard for behaviours that give you stable, natural dopamine instead of quick hits.",
    icon: "info",
  },
  {
    id: "how",
    title: "How to use it",
    description:
      "Once per day, tick what you actually did. No perfection. Just honest tracking of the basics.",
    icon: "check-square",
  },
  {
    id: "why",
    title: "Why it matters",
    description:
      "Over time you will see how movement, light, sleep and connection change your baseline mood and cravings.",
    icon: "trending-up",
  },
] as const;

type ChecklistKey = (typeof CHECKLIST_ITEMS)[number]["id"];

const SCREEN_WIDTH =
  Dimensions.get("window").width - Spacing.lg * 2;

export default function DopamineLabScreen() {
  return (
    <ProGate feature="dopamineLab" featureName="Dopamine Lab">
      <DopamineLabContent />
    </ProGate>
  );
}

function todayISO() {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

function DopamineLabContent() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const queryClient = useQueryClient();

  const [introIndex, setIntroIndex] = useState(0);

  const { data: todayEntry, isLoading } =
    useQuery<DopamineEntry | null>({
      queryKey: ["/api/dopamine/today"],
      enabled: !!user,
    });

  const saveMutation = useMutation({
    mutationFn: async (
      updates: Partial<Record<ChecklistKey, boolean>>,
    ) => {
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
    // optimistic update so ticks feel instant
    onMutate: async (
      updates: Partial<Record<ChecklistKey, boolean>>,
    ) => {
      await queryClient.cancelQueries({
        queryKey: ["/api/dopamine/today"],
      });

      const previous =
        queryClient.getQueryData<DopamineEntry | null>([
          "/api/dopamine/today",
        ]);

      const baseline: DopamineEntry | any = {
        id: previous?.id ?? "local",
        date: previous?.date ?? todayISO(),
        movedBody: previous?.movedBody ?? false,
        daylight: previous?.daylight ?? false,
        social: previous?.social ?? false,
        creative: previous?.creative ?? false,
        music: previous?.music ?? false,
        learning: previous?.learning ?? false,
        coldExposure: previous?.coldExposure ?? false,
        protectedSleep: previous?.protectedSleep ?? false,
      };

      const optimistic = {
        ...baseline,
        ...updates,
      };

      queryClient.setQueryData(
        ["/api/dopamine/today"],
        optimistic,
      );

      return { previous };
    },
    onError: (_err, _vars, context: any) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(
          ["/api/dopamine/today"],
          context.previous,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/dopamine/today"],
      });
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
    return CHECKLIST_ITEMS.filter((item) =>
      Boolean((todayEntry as any)[item.id]),
    ).length;
  }, [todayEntry]);

  const toggleItem = (id: ChecklistKey) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(
        Haptics.ImpactFeedbackStyle.Light,
      );
    }
    const newValue = !isChecked(id);
    saveMutation.mutate({ [id]: newValue });
  };

  const score = checkedCount;
  const maxScore = CHECKLIST_ITEMS.length;

  const insight = useMemo(() => {
    if (score === 0) {
      return "Start with one small tick today. The point is momentum, not perfection.";
    }
    if (score <= 2) {
      return "Solid start. Protect one more habit tomorrow and keep stacking.";
    }
    if (score <= 4) {
      return "Nice balance. You are giving your brain steady, natural rewards.";
    }
    if (score <= 6) {
      return "Strong day. These basics are doing heavy lifting for your mood and focus.";
    }
    return "Elite day. Keep an eye on recovery and avoid turning this into pressure.";
  }, [score]);

  const handleIntroScroll = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    const { contentOffset, layoutMeasurement } =
      event.nativeEvent;
    const index = Math.round(
      contentOffset.x / layoutMeasurement.width,
    );
    setIntroIndex(index);
  };

  if (!user) {
    return (
      <ThemedView
        style={[
          styles.container,
          styles.loadingContainer,
          {
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
          },
        ]}
      >
        <ThemedText>
          Please sign in to use Dopamine Lab.
        </ThemedText>
      </ThemedView>
    );
  }

  if (isLoading) {
    return (
      <ThemedView
        style={[
          styles.container,
          styles.loadingContainer,
          {
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
          },
        ]}
      >
        <ActivityIndicator
          size="large"
          color={theme.primary}
        />
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
            paddingBottom:
              tabBarHeight + Spacing.xl + insets.bottom,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro slides */}
        <View style={styles.introWrapper}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleIntroScroll}
            scrollEventThrottle={16}
          >
            {INTRO_SLIDES.map((slide) => (
              <View
                key={slide.id}
                style={[
                  styles.introCard,
                  { width: SCREEN_WIDTH },
                ]}
              >
                <View style={styles.introIconCircle}>
                  <Feather
                    name={slide.icon as any}
                    size={20}
                    color={EarthyColors.copper}
                  />
                </View>
                <ThemedText
                  type="h4"
                  style={styles.introTitle}
                >
                  {slide.title}
                </ThemedText>
                <ThemedText
                  style={[
                    styles.introText,
                    { color: theme.textSecondary },
                  ]}
                >
                  {slide.description}
                </ThemedText>
              </View>
            ))}
          </ScrollView>
          <View style={styles.introDots}>
            {INTRO_SLIDES.map((slide, index) => (
              <View
                key={slide.id}
                style={[
                  styles.introDot,
                  index === introIndex &&
                    styles.introDotActive,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Education card */}
        <View
          style={[
            styles.educationCard,
            { backgroundColor: `${EarthyColors.forestGreen}15` },
          ]}
        >
          <Feather
            name="activity"
            size={20}
            color={EarthyColors.forestGreen}
          />
          <View style={styles.educationContent}>
            <ThemedText
              type="h4"
              style={{ color: EarthyColors.forestGreen }}
            >
              Daily natural score
            </ThemedText>
            <ThemedText
              style={[
                styles.educationText,
                { color: theme.textSecondary },
              ]}
            >
              Each tick is a small, evidence based behaviour
              that smooths your dopamine curve and supports
              long term focus.
            </ThemedText>
          </View>
        </View>

        {/* Score section */}
        <View style={styles.scoreSection}>
          <View
            style={[
              styles.scoreCircle,
              { borderColor: EarthyColors.copper },
            ]}
          >
            <ThemedText
              style={[
                styles.scoreNumber,
                { color: EarthyColors.copper },
              ]}
            >
              {score}
            </ThemedText>
            <ThemedText
              style={[
                styles.scoreMax,
                { color: theme.textSecondary },
              ]}
            >
              /{maxScore}
            </ThemedText>
          </View>
          <ThemedText
            style={[
              styles.scoreLabel,
              { color: theme.textSecondary },
            ]}
          >
            Today&apos;s natural rewards
          </ThemedText>
        </View>

        {/* Checklist */}
        <ThemedText
          type="h4"
          style={styles.sectionTitle}
        >
          Daily checklist
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
                    opacity: saveMutation.isPending
                      ? 0.9
                      : 1,
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
                    <Animated.View
                      entering={FadeIn.duration(160)}
                    >
                      <Feather
                        name="check"
                        size={16}
                        color="#fff"
                      />
                    </Animated.View>
                  ) : null}
                </View>

                <View style={styles.itemIcon}>
                  <Feather
                    name={item.icon as any}
                    size={20}
                    color={
                      checked
                        ? EarthyColors.forestGreen
                        : theme.textSecondary
                    }
                  />
                </View>

                <View style={styles.itemContent}>
                  <ThemedText
                    style={[
                      styles.itemLabel,
                      {
                        color: checked
                          ? EarthyColors.forestGreen
                          : theme.text,
                      },
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
          <Feather
            name="zap"
            size={20}
            color={EarthyColors.copper}
          />
          <View style={styles.insightContent}>
            <ThemedText
              type="h4"
              style={{ color: EarthyColors.copper }}
            >
              Today&apos;s insight
            </ThemedText>
            <ThemedText
              style={[
                styles.insightText,
                { color: theme.text },
              ]}
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
  introWrapper: {
    marginBottom: Spacing.lg,
  },
  introCard: {
    backgroundColor: "#00000010",
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginRight: Spacing.md,
  },
  introIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
    backgroundColor: `${EarthyColors.copper}20`,
  },
  introTitle: {
    marginBottom: Spacing.xs,
  },
  introText: {
    fontSize: 13,
    lineHeight: 20,
  },
  introDots: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: Spacing.sm,
    gap: 6,
  },
  introDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#99999940",
  },
  introDotActive: {
    width: 10,
    backgroundColor: EarthyColors.copper,
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

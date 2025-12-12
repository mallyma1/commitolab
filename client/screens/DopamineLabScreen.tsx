import React, {
  useMemo,
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Platform,
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

type HabitId =
  | "movedBody"
  | "daylight"
  | "social"
  | "creative"
  | "music"
  | "learning"
  | "coldExposure"
  | "protectedSleep"
  | "stillness"
  | "natureTime";

type HabitConfig = {
  id: HabitId;
  label: string;
  icon: string;
  description: string;
  scienceKey: string;
};

// We map some UI habits onto the same underlying fields for now
// so we do not have to change the shared schema yet:
// - stillness -> treated as "creative" in data layer for now
// - natureTime -> treated as "daylight" in data layer for now
const HABITS: HabitConfig[] = [
  {
    id: "movedBody",
    label: "Moved your body",
    icon: "activity",
    description: "Any exercise or walk that raised your heart rate a little.",
    scienceKey: "movement",
  },
  {
    id: "daylight",
    label: "Morning light",
    icon: "sunrise",
    description: "At least a few minutes of outside light before noon.",
    scienceKey: "light",
  },
  {
    id: "social",
    label: "Real connection",
    icon: "users",
    description: "A genuine chat, call or time with someone you care about.",
    scienceKey: "social",
  },
  {
    id: "creative",
    label: "Created something",
    icon: "edit-3",
    description: "Wrote, designed, built or made progress on a project.",
    scienceKey: "creative",
  },
  {
    id: "music",
    label: "Intentional music",
    icon: "music",
    description: "Listened or played, not just background noise.",
    scienceKey: "music",
  },
  {
    id: "learning",
    label: "Learnt something",
    icon: "book-open",
    description: "Read, watched or practised something new.",
    scienceKey: "learning",
  },
  {
    id: "coldExposure",
    label: "Cold reset",
    icon: "droplet",
    description: "Cold shower or similar that shifted your state.",
    scienceKey: "cold",
  },
  {
    id: "protectedSleep",
    label: "Protected sleep",
    icon: "moon",
    description: "Tried to keep a consistent sleep window.",
    scienceKey: "sleep",
  },
  {
    id: "stillness",
    label: "Stillness / prayer",
    icon: "heart",
    description:
      "Meditation, breathwork, prayer or quiet reflection, even for a few minutes.",
    scienceKey: "meditation",
  },
  {
    id: "natureTime",
    label: "Time in nature",
    icon: "feather",
    description:
      "Park, trees, water or any place that felt more natural than digital.",
    scienceKey: "nature",
  },
];

type LocalState = {
  movedBody: boolean;
  daylight: boolean;
  social: boolean;
  creative: boolean;
  music: boolean;
  learning: boolean;
  coldExposure: boolean;
  protectedSleep: boolean;
  stillness: boolean;
  natureTime: boolean;
};

function emptyLocal(): LocalState {
  return {
    movedBody: false,
    daylight: false,
    social: false,
    creative: false,
    music: false,
    learning: false,
    coldExposure: false,
    protectedSleep: false,
    stillness: false,
    natureTime: false,
  };
}

const SCIENCE_SNIPPETS: Record<string, string> = {
  movement:
    "Regular movement increases dopamine receptor sensitivity over time, which can improve motivation rather than just give a short spike.",
  light:
    "Morning daylight helps set your circadian rhythm, anchoring cortisol and dopamine to a more stable daily pattern.",
  social:
    "Quality social connection activates dopamine and oxytocin systems together, which is linked to better resilience and lower stress.",
  creative:
    "Creative work often produces small, repeated dopamine pulses as you solve problems or make progress, which is healthier than one big hit.",
  music:
    "Music can modulate dopamine release in reward pathways and is used in clinical settings to support mood and movement.",
  learning:
    "Learning something new increases dopamine in response to novelty and prediction error, reinforcing curiosity and progress.",
  cold:
    "Short controlled cold exposure can trigger a significant, lasting increase in dopamine and noradrenaline, improving focus for hours.",
  sleep:
    "Consistent sleep supports the overnight reset of dopamine receptors and reduces the craving for quick digital hits.",
  meditation:
    "Meditation and prayer practices can reduce baseline stress signalling, making your natural dopamine peaks feel clearer and more rewarding.",
  nature:
    "Time in natural spaces is linked to lower stress hormones and improved mood, which supports a healthier dopamine baseline.",
};

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

  const [localState, setLocalState] = useState<LocalState>(emptyLocal());

  const { data: todayEntry, isLoading } =
    useQuery<DopamineEntry | null>({
      queryKey: ["/api/dopamine/today"],
      enabled: !!user,
    });

  // Seed local state from server on first load and when server data changes
  useEffect(() => {
    if (!todayEntry) {
      setLocalState(emptyLocal());
      return;
    }

    setLocalState((prev) => ({
      ...prev,
      movedBody: Boolean(
        (todayEntry as any).movedBody ?? prev.movedBody,
      ),
      daylight: Boolean(
        (todayEntry as any).daylight ?? prev.daylight,
      ),
      social: Boolean(
        (todayEntry as any).social ?? prev.social,
      ),
      creative: Boolean(
        (todayEntry as any).creative ?? prev.creative,
      ),
      music: Boolean(
        (todayEntry as any).music ?? prev.music,
      ),
      learning: Boolean(
        (todayEntry as any).learning ?? prev.learning,
      ),
      coldExposure: Boolean(
        (todayEntry as any).coldExposure ??
          prev.coldExposure,
      ),
      protectedSleep: Boolean(
        (todayEntry as any).protectedSleep ??
          prev.protectedSleep,
      ),
      // stillness and natureTime are mapped into creative/daylight
      stillness: Boolean(
        (todayEntry as any).creative ??
          prev.stillness,
      ),
      natureTime: Boolean(
        (todayEntry as any).daylight ??
          prev.natureTime,
      ),
    }));
  }, [todayEntry]);

  const saveMutation = useMutation({
    mutationFn: async (nextState: LocalState) => {
      // Map UI state back into the existing backend fields for now
      const payload = {
        movedBody: nextState.movedBody,
        daylight:
          nextState.daylight || nextState.natureTime,
        social: nextState.social,
        creative:
          nextState.creative || nextState.stillness,
        music: nextState.music,
        learning: nextState.learning,
        coldExposure: nextState.coldExposure,
        protectedSleep: nextState.protectedSleep,
      };

      return apiRequest("POST", "/api/dopamine", payload);
    },
    onMutate: async (nextState: LocalState) => {
      await queryClient.cancelQueries({
        queryKey: ["/api/dopamine/today"],
      });
      // Optimistically reflect the local state
      setLocalState(nextState);
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/dopamine/today"],
      });
    },
  });

  const toggleHabit = (id: HabitId) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(
        Haptics.ImpactFeedbackStyle.Light,
      );
    }

    setLocalState((prev) => {
      const next = {
        ...prev,
        [id]: !prev[id],
      } as LocalState;
      saveMutation.mutate(next);
      return next;
    });
  };

  const score = useMemo(() => {
    return HABITS.reduce(
      (total, habit) =>
        localState[habit.id] ? total + 1 : total,
      0,
    );
  }, [localState]);

  const target = 3;
  const maxScore = HABITS.length;

  const insight = useMemo(() => {
    if (score === 0) {
      return "Start by aiming for any one habit today. The goal is consistency, not a perfect board.";
    }
    if (score < target) {
      return "Nice work. You are on the board. See if you can nudge it to three habits most days.";
    }
    if (score === target) {
      return "You have hit the daily target. Anything above this is bonus, not pressure.";
    }
    if (score < maxScore) {
      return "Strong day. Make sure it still feels sustainable and not like a checklist you have to clear.";
    }
    return "You ticked everything. Brilliant, but keep an eye on rest so this stays enjoyable.";
  }, [score, target, maxScore]);

  const scienceKeyForToday = useMemo(() => {
    if (score === 0) return null;
    const activeKeys = HABITS.filter(
      (h) => localState[h.id],
    ).map((h) => h.scienceKey);
    if (activeKeys.length === 0) return null;
    // Simple deterministic pick from active habits
    const index =
      new Date().getDate() % activeKeys.length;
    return activeKeys[index];
  }, [localState, score]);

  const scienceSnippet =
    scienceKeyForToday &&
    SCIENCE_SNIPPETS[scienceKeyForToday];

  const { theme: t } = { theme };

  const insetsBottom = insets.bottom;

  if (!user) {
    return (
      <ThemedView
        style={[
          styles.container,
          styles.loadingContainer,
          {
            paddingTop: insets.top,
            paddingBottom: insetsBottom,
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
            paddingBottom: insetsBottom,
          },
        ]}
      >
        <ActivityIndicator
          size="large"
          color={t.primary}
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
              tabBarHeight + Spacing.xl + insetsBottom,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header summary */}
        <View style={styles.headerCard}>
          <View style={styles.headerIconRow}>
            <View style={styles.headerIconBadge}>
              <Feather
                name="zap"
                size={18}
                color={EarthyColors.copper}
              />
            </View>
            <ThemedText
              style={[
                styles.headerTag,
                { color: t.textSecondary },
              ]}
            >
              Aim for at least three ticks a day
            </ThemedText>
          </View>
          <ThemedText
            type="h3"
            style={styles.headerTitle}
          >
            Natural dopamine, not endless scrolling
          </ThemedText>
          <ThemedText
            style={[
              styles.headerText,
              { color: t.textSecondary },
            ]}
          >
            Tick what you genuinely did today across movement, light, sleep,
            connection, stillness and learning. This is a quiet scoreboard for
            the basics that actually move the needle.
          </ThemedText>
        </View>

        {/* Score section */}
        <View style={styles.scoreRow}>
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
                { color: t.textSecondary },
              ]}
            >
              /{maxScore}
            </ThemedText>
          </View>
          <View style={styles.scoreCopy}>
            <ThemedText
              style={[
                styles.scoreLabel,
                { color: t.text },
              ]}
            >
              Today&apos;s natural rewards
            </ThemedText>
            <ThemedText
              style={[
                styles.scoreSub,
                { color: t.textSecondary },
              ]}
            >
              Target: {target} or more. The point is trend, not perfection.
            </ThemedText>
          </View>
        </View>

        {/* Checklist */}
        <ThemedText
          type="h4"
          style={styles.sectionTitle}
        >
          Daily checklist
        </ThemedText>

        <View style={styles.checklist}>
          {HABITS.map((habit) => {
            const checked = localState[habit.id];
            return (
              <Pressable
                key={habit.id}
                style={[
                  styles.checklistItem,
                  {
                    backgroundColor: checked
                      ? `${EarthyColors.forestGreen}15`
                      : t.backgroundSecondary,
                    borderColor: checked
                      ? EarthyColors.forestGreen
                      : t.border,
                    opacity: saveMutation.isPending
                      ? 0.9
                      : 1,
                  },
                ]}
                onPress={() => toggleHabit(habit.id)}
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
                        : t.border,
                    },
                  ]}
                >
                  {checked ? (
                    <Animated.View
                      entering={FadeIn.duration(140)}
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
                    name={habit.icon as any}
                    size={20}
                    color={
                      checked
                        ? EarthyColors.forestGreen
                        : t.textSecondary
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
                          : t.text,
                      },
                    ]}
                  >
                    {habit.label}
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.itemDescription,
                      { color: t.textSecondary },
                    ]}
                  >
                    {habit.description}
                  </ThemedText>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Insight and science */}
        <View
          style={[
            styles.insightCard,
            { backgroundColor: `${EarthyColors.copper}15` },
          ]}
        >
          <Feather
            name="target"
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
                { color: t.text },
              ]}
            >
              {insight}
            </ThemedText>
          </View>
        </View>

        {scienceSnippet && (
          <View
            style={[
              styles.scienceCard,
              { backgroundColor: t.backgroundSecondary },
            ]}
          >
            <View style={styles.scienceHeader}>
              <View style={styles.scienceIconBadge}>
                <Feather
                  name="activity"
                  size={16}
                  color={EarthyColors.copper}
                />
              </View>
              <ThemedText
                style={[
                  styles.scienceTitle,
                  { color: t.text },
                ]}
              >
                Science note for today
              </ThemedText>
            </View>
            <ThemedText
              style={[
                styles.scienceText,
                { color: t.textSecondary },
              ]}
            >
              {scienceSnippet}
            </ThemedText>
          </View>
        )}
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
  headerCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    backgroundColor: "#0000000d",
    marginBottom: Spacing.xl,
  },
  headerIconRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  headerIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: `${EarthyColors.copper}20`,
    marginRight: Spacing.sm,
  },
  headerTag: {
    fontSize: 12,
  },
  headerTitle: {
    marginBottom: Spacing.sm,
  },
  headerText: {
    fontSize: 13,
    lineHeight: 20,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  scoreCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 4,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
    flexDirection: "row",
  },
  scoreNumber: {
    fontSize: 32,
    fontWeight: "700",
  },
  scoreMax: {
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 2,
  },
  scoreCopy: {
    flex: 1,
  },
  scoreLabel: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  scoreSub: {
    fontSize: 13,
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
    fontSize: 15,
    fontWeight: "500",
  },
  itemDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  insightCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  insightContent: {
    flex: 1,
  },
  insightText: {
    fontSize: 14,
    lineHeight: 22,
    marginTop: Spacing.xs,
  },
  scienceCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
  },
  scienceHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  scienceIconBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: `${EarthyColors.copper}25`,
    marginRight: Spacing.xs,
  },
  scienceTitle: {
    fontSize: 13,
    fontWeight: "600",
  },
  scienceText: {
    fontSize: 13,
    lineHeight: 20,
  },
});
import React, {
  useMemo,
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Platform,
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

type HabitId =
  | "movedBody"
  | "daylight"
  | "social"
  | "creative"
  | "music"
  | "learning"
  | "coldExposure"
  | "protectedSleep"
  | "stillness"
  | "natureTime";

type HabitConfig = {
  id: HabitId;
  label: string;
  icon: string;
  description: string;
  scienceKey: string;
};

// We map some UI habits onto the same underlying fields for now
// so we do not have to change the shared schema yet:
// - stillness -> treated as "creative" in data layer for now
// - natureTime -> treated as "daylight" in data layer for now
const HABITS: HabitConfig[] = [
  {
    id: "movedBody",
    label: "Moved your body",
    icon: "activity",
    description: "Any exercise or walk that raised your heart rate a little.",
    scienceKey: "movement",
  },
  {
    id: "daylight",
    label: "Morning light",
    icon: "sunrise",
    description: "At least a few minutes of outside light before noon.",
    scienceKey: "light",
  },
  {
    id: "social",
    label: "Real connection",
    icon: "users",
    description: "A genuine chat, call or time with someone you care about.",
    scienceKey: "social",
  },
  {
    id: "creative",
    label: "Created something",
    icon: "edit-3",
    description: "Wrote, designed, built or made progress on a project.",
    scienceKey: "creative",
  },
  {
    id: "music",
    label: "Intentional music",
    icon: "music",
    description: "Listened or played, not just background noise.",
    scienceKey: "music",
  },
  {
    id: "learning",
    label: "Learnt something",
    icon: "book-open",
    description: "Read, watched or practised something new.",
    scienceKey: "learning",
  },
  {
    id: "coldExposure",
    label: "Cold reset",
    icon: "droplet",
    description: "Cold shower or similar that shifted your state.",
    scienceKey: "cold",
  },
  {
    id: "protectedSleep",
    label: "Protected sleep",
    icon: "moon",
    description: "Tried to keep a consistent sleep window.",
    scienceKey: "sleep",
  },
  {
    id: "stillness",
    label: "Stillness / prayer",
    icon: "heart",
    description:
      "Meditation, breathwork, prayer or quiet reflection, even for a few minutes.",
    scienceKey: "meditation",
  },
  {
    id: "natureTime",
    label: "Time in nature",
    icon: "feather",
    description:
      "Park, trees, water or any place that felt more natural than digital.",
    scienceKey: "nature",
  },
];

type LocalState = {
  movedBody: boolean;
  daylight: boolean;
  social: boolean;
  creative: boolean;
  music: boolean;
  learning: boolean;
  coldExposure: boolean;
  protectedSleep: boolean;
  stillness: boolean;
  natureTime: boolean;
};

function emptyLocal(): LocalState {
  return {
    movedBody: false,
    daylight: false,
    social: false,
    creative: false,
    music: false,
    learning: false,
    coldExposure: false,
    protectedSleep: false,
    stillness: false,
    natureTime: false,
  };
}

const SCIENCE_SNIPPETS: Record<string, string> = {
  movement:
    "Regular movement increases dopamine receptor sensitivity over time, which can improve motivation rather than just give a short spike.",
  light:
    "Morning daylight helps set your circadian rhythm, anchoring cortisol and dopamine to a more stable daily pattern.",
  social:
    "Quality social connection activates dopamine and oxytocin systems together, which is linked to better resilience and lower stress.",
  creative:
    "Creative work often produces small, repeated dopamine pulses as you solve problems or make progress, which is healthier than one big hit.",
  music:
    "Music can modulate dopamine release in reward pathways and is used in clinical settings to support mood and movement.",
  learning:
    "Learning something new increases dopamine in response to novelty and prediction error, reinforcing curiosity and progress.",
  cold:
    "Short controlled cold exposure can trigger a significant, lasting increase in dopamine and noradrenaline, improving focus for hours.",
  sleep:
    "Consistent sleep supports the overnight reset of dopamine receptors and reduces the craving for quick digital hits.",
  meditation:
    "Meditation and prayer practices can reduce baseline stress signalling, making your natural dopamine peaks feel clearer and more rewarding.",
  nature:
    "Time in natural spaces is linked to lower stress hormones and improved mood, which supports a healthier dopamine baseline.",
};

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

  const [localState, setLocalState] = useState<LocalState>(emptyLocal());

  const { data: todayEntry, isLoading } =
    useQuery<DopamineEntry | null>({
      queryKey: ["/api/dopamine/today"],
      enabled: !!user,
    });

  // Seed local state from server on first load and when server data changes
  useEffect(() => {
    if (!todayEntry) {
      setLocalState(emptyLocal());
      return;
    }

    setLocalState((prev) => ({
      ...prev,
      movedBody: Boolean(
        (todayEntry as any).movedBody ?? prev.movedBody,
      ),
      daylight: Boolean(
        (todayEntry as any).daylight ?? prev.daylight,
      ),
      social: Boolean(
        (todayEntry as any).social ?? prev.social,
      ),
      creative: Boolean(
        (todayEntry as any).creative ?? prev.creative,
      ),
      music: Boolean(
        (todayEntry as any).music ?? prev.music,
      ),
      learning: Boolean(
        (todayEntry as any).learning ?? prev.learning,
      ),
      coldExposure: Boolean(
        (todayEntry as any).coldExposure ??
          prev.coldExposure,
      ),
      protectedSleep: Boolean(
        (todayEntry as any).protectedSleep ??
          prev.protectedSleep,
      ),
      // stillness and natureTime are mapped into creative/daylight
      stillness: Boolean(
        (todayEntry as any).creative ??
          prev.stillness,
      ),
      natureTime: Boolean(
        (todayEntry as any).daylight ??
          prev.natureTime,
      ),
    }));
  }, [todayEntry]);

  const saveMutation = useMutation({
    mutationFn: async (nextState: LocalState) => {
      // Map UI state back into the existing backend fields for now
      const payload = {
        movedBody: nextState.movedBody,
        daylight:
          nextState.daylight || nextState.natureTime,
        social: nextState.social,
        creative:
          nextState.creative || nextState.stillness,
        music: nextState.music,
        learning: nextState.learning,
        coldExposure: nextState.coldExposure,
        protectedSleep: nextState.protectedSleep,
      };

      return apiRequest("POST", "/api/dopamine", payload);
    },
    onMutate: async (nextState: LocalState) => {
      await queryClient.cancelQueries({
        queryKey: ["/api/dopamine/today"],
      });
      // Optimistically reflect the local state
      setLocalState(nextState);
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/dopamine/today"],
      });
    },
  });

  const toggleHabit = (id: HabitId) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(
        Haptics.ImpactFeedbackStyle.Light,
      );
    }

    setLocalState((prev) => {
      const next = {
        ...prev,
        [id]: !prev[id],
      } as LocalState;
      saveMutation.mutate(next);
      return next;
    });
  };

  const score = useMemo(() => {
    return HABITS.reduce(
      (total, habit) =>
        localState[habit.id] ? total + 1 : total,
      0,
    );
  }, [localState]);

  const target = 3;
  const maxScore = HABITS.length;

  const insight = useMemo(() => {
    if (score === 0) {
      return "Start by aiming for any one habit today. The goal is consistency, not a perfect board.";
    }
    if (score < target) {
      return "Nice work. You are on the board. See if you can nudge it to three habits most days.";
    }
    if (score === target) {
      return "You have hit the daily target. Anything above this is bonus, not pressure.";
    }
    if (score < maxScore) {
      return "Strong day. Make sure it still feels sustainable and not like a checklist you have to clear.";
    }
    return "You ticked everything. Brilliant, but keep an eye on rest so this stays enjoyable.";
  }, [score, target, maxScore]);

  const scienceKeyForToday = useMemo(() => {
    if (score === 0) return null;
    const activeKeys = HABITS.filter(
      (h) => localState[h.id],
    ).map((h) => h.scienceKey);
    if (activeKeys.length === 0) return null;
    // Simple deterministic pick from active habits
    const index =
      new Date().getDate() % activeKeys.length;
    return activeKeys[index];
  }, [localState, score]);

  const scienceSnippet =
    scienceKeyForToday &&
    SCIENCE_SNIPPETS[scienceKeyForToday];

  const { theme: t } = { theme };

  const insetsBottom = insets.bottom;

  if (!user) {
    return (
      <ThemedView
        style={[
          styles.container,
          styles.loadingContainer,
          {
            paddingTop: insets.top,
            paddingBottom: insetsBottom,
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
            paddingBottom: insetsBottom,
          },
        ]}
      >
        <ActivityIndicator
          size="large"
          color={t.primary}
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
              tabBarHeight + Spacing.xl + insetsBottom,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header summary */}
        <View style={styles.headerCard}>
          <View style={styles.headerIconRow}>
            <View style={styles.headerIconBadge}>
              <Feather
                name="zap"
                size={18}
                color={EarthyColors.copper}
              />
            </View>
            <ThemedText
              style={[
                styles.headerTag,
                { color: t.textSecondary },
              ]}
            >
              Aim for at least three ticks a day
            </ThemedText>
          </View>
          <ThemedText
            type="h3"
            style={styles.headerTitle}
          >
            Natural dopamine, not endless scrolling
          </ThemedText>
          <ThemedText
            style={[
              styles.headerText,
              { color: t.textSecondary },
            ]}
          >
            Tick what you genuinely did today across movement, light, sleep,
            connection, stillness and learning. This is a quiet scoreboard for
            the basics that actually move the needle.
          </ThemedText>
        </View>

        {/* Score section */}
        <View style={styles.scoreRow}>
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
                { color: t.textSecondary },
              ]}
            >
              /{maxScore}
            </ThemedText>
          </View>
          <View style={styles.scoreCopy}>
            <ThemedText
              style={[
                styles.scoreLabel,
                { color: t.text },
              ]}
            >
              Today&apos;s natural rewards
            </ThemedText>
            <ThemedText
              style={[
                styles.scoreSub,
                { color: t.textSecondary },
              ]}
            >
              Target: {target} or more. The point is trend, not perfection.
            </ThemedText>
          </View>
        </View>

        {/* Checklist */}
        <ThemedText
          type="h4"
          style={styles.sectionTitle}
        >
          Daily checklist
        </ThemedText>

        <View style={styles.checklist}>
          {HABITS.map((habit) => {
            const checked = localState[habit.id];
            return (
              <Pressable
                key={habit.id}
                style={[
                  styles.checklistItem,
                  {
                    backgroundColor: checked
                      ? `${EarthyColors.forestGreen}15`
                      : t.backgroundSecondary,
                    borderColor: checked
                      ? EarthyColors.forestGreen
                      : t.border,
                    opacity: saveMutation.isPending
                      ? 0.9
                      : 1,
                  },
                ]}
                onPress={() => toggleHabit(habit.id)}
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
                        : t.border,
                    },
                  ]}
                >
                  {checked ? (
                    <Animated.View
                      entering={FadeIn.duration(140)}
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
                    name={habit.icon as any}
                    size={20}
                    color={
                      checked
                        ? EarthyColors.forestGreen
                        : t.textSecondary
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
                          : t.text,
                      },
                    ]}
                  >
                    {habit.label}
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.itemDescription,
                      { color: t.textSecondary },
                    ]}
                  >
                    {habit.description}
                  </ThemedText>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Insight and science */}
        <View
          style={[
            styles.insightCard,
            { backgroundColor: `${EarthyColors.copper}15` },
          ]}
        >
          <Feather
            name="target"
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
                { color: t.text },
              ]}
            >
              {insight}
            </ThemedText>
          </View>
        </View>

        {scienceSnippet && (
          <View
            style={[
              styles.scienceCard,
              { backgroundColor: t.backgroundSecondary },
            ]}
          >
            <View style={styles.scienceHeader}>
              <View style={styles.scienceIconBadge}>
                <Feather
                  name="activity"
                  size={16}
                  color={EarthyColors.copper}
                />
              </View>
              <ThemedText
                style={[
                  styles.scienceTitle,
                  { color: t.text },
                ]}
              >
                Science note for today
              </ThemedText>
            </View>
            <ThemedText
              style={[
                styles.scienceText,
                { color: t.textSecondary },
              ]}
            >
              {scienceSnippet}
            </ThemedText>
          </View>
        )}
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
  headerCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    backgroundColor: "#0000000d",
    marginBottom: Spacing.xl,
  },
  headerIconRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  headerIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: `${EarthyColors.copper}20`,
    marginRight: Spacing.sm,
  },
  headerTag: {
    fontSize: 12,
  },
  headerTitle: {
    marginBottom: Spacing.sm,
  },
  headerText: {
    fontSize: 13,
    lineHeight: 20,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  scoreCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 4,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
    flexDirection: "row",
  },
  scoreNumber: {
    fontSize: 32,
    fontWeight: "700",
  },
  scoreMax: {
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 2,
  },
  scoreCopy: {
    flex: 1,
  },
  scoreLabel: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  scoreSub: {
    fontSize: 13,
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
    fontSize: 15,
    fontWeight: "500",
  },
  itemDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  insightCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  insightContent: {
    flex: 1,
  },
  insightText: {
    fontSize: 14,
    lineHeight: 22,
    marginTop: Spacing.xs,
  },
  scienceCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
  },
  scienceHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  scienceIconBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: `${EarthyColors.copper}25`,
    marginRight: Spacing.xs,
  },
  scienceTitle: {
    fontSize: 13,
    fontWeight: "600",
  },
  scienceText: {
    fontSize: 13,
    lineHeight: 20,
  },
});

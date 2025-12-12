import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { PremiumColors, Spacing, BorderRadius } from "@/constants/theme";

const DOPAMINE_STORAGE_KEY = "@dopamine_lab_data";
const DOPAMINE_INTRO_KEY = "@dopamine_intro_seen";

// Motivational quotes
const MOTIVATIONAL_QUOTES = [
  "Small wins compound into lasting change.",
  "Consistency is the bedrock of motivation.",
  "Natural dopamine fuels sustainable growth.",
  "Every habit is a vote for the person you want to be.",
  "Progress, not perfection.",
];

// Premium habit definitions
type HabitId =
  | "movedBody"
  | "daylight"
  | "meditation"
  | "nature"
  | "breathing"
  | "learning"
  | "hydration"
  | "cold"
  | "social";

type HabitConfig = {
  id: HabitId;
  label: string;
  icon: string;
  description: string;
  science: string;
};

const PREMIUM_HABITS: HabitConfig[] = [
  {
    id: "movedBody",
    label: "Movement",
    icon: "activity",
    description: "Physical activity or training",
    science: "Releases dopamine and BDNF, improving mood and motivation.",
  },
  {
    id: "daylight",
    label: "Daylight",
    icon: "sun",
    description: "10+ mins of sunlight",
    science: "Regulates circadian rhythms and dopamine receptors.",
  },
  {
    id: "meditation",
    label: "Meditation",
    icon: "wind",
    description: "Mental stillness or grounding",
    science: "Reduces cortisol, increases baseline dopamine tone.",
  },
  {
    id: "nature",
    label: "Nature",
    icon: "leaf",
    description: "Time in natural environment",
    science: "Lowers stress and enhances psychological restoration.",
  },
  {
    id: "breathing",
    label: "Deep Breathing",
    icon: "wind",
    description: "5+ minutes of conscious breathing",
    science: "Activates parasympathetic nervous system, calms mind.",
  },
  {
    id: "learning",
    label: "Learning",
    icon: "book-open",
    description: "Something new and interesting",
    science: "Stimulates neural plasticity and sense of progress.",
  },
  {
    id: "hydration",
    label: "Hydration",
    icon: "droplet",
    description: "Consistent water intake",
    science: "Improves cognitive function and mood stability.",
  },
  {
    id: "cold",
    label: "Cold Exposure",
    icon: "cloud",
    description: "Cold shower or ice bath",
    science: "Triggers norepinephrine release, builds resilience.",
  },
  {
    id: "social",
    label: "Social Connection",
    icon: "users",
    description: "Meaningful interaction",
    science: "Releases oxytocin, deepens belonging and motivation.",
  },
];

interface HabitState {
  [habitId: string]: boolean;
}

interface DailyData {
  date: string;
  habits: HabitState;
  score: number;
}

// Header Section with Score Ring
function HeaderSection({
  todayScore,
  maxScore,
}: {
  todayScore: number;
  maxScore: number;
}) {
  const insets = useSafeAreaInsets();
  const quoteIndex = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
  const quote = MOTIVATIONAL_QUOTES[quoteIndex];
  const percentage = (todayScore / maxScore) * 100;

  return (
    <LinearGradient
      colors={[PremiumColors.sandBeige, PremiumColors.backgroundMain]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}
    >
      <View style={styles.scoreContainer}>
        <View style={styles.scoreRing}>
          <ThemedText type="h1" style={styles.scoreValue}>
            {todayScore}
          </ThemedText>
          <ThemedText style={styles.scoreLabel}>of {maxScore}</ThemedText>
        </View>
        <View style={styles.scoreInfo}>
          <ThemedText type="h3">Today's Progress</ThemedText>
          <View
            style={[
              styles.progressBar,
              { width: `${Math.min(percentage, 100)}%` },
            ]}
          />
          <ThemedText style={styles.progressPercent}>
            {Math.round(percentage)}%
          </ThemedText>
        </View>
      </View>

      <View style={styles.quoteCard}>
        <Feather
          name="message-circle"
          size={16}
          color={PremiumColors.copperOrange}
          style={styles.quoteIcon}
        />
        <ThemedText style={styles.quoteText}>{quote}</ThemedText>
      </View>
    </LinearGradient>
  );
}

// Premium Habit Tile
function HabitTile({
  habit,
  checked,
  onToggle,
  index,
}: {
  habit: (typeof PREMIUM_HABITS)[0];
  checked: boolean;
  onToggle: () => void;
  index: number;
}) {
  const scale = useSharedValue(1);
  const checkScale = useSharedValue(checked ? 1 : 0);
  const opacity = useSharedValue(checked ? 1 : 0);

  useEffect(() => {
    checkScale.value = withSpring(checked ? 1 : 0, {
      damping: 8,
      mass: 1,
      overshootClamping: true,
    });
    opacity.value = withTiming(checked ? 1 : 0, { duration: 200 });
  }, [checked, checkScale, opacity]);

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withSpring(1.03, { damping: 10, mass: 0.8 });
    scale.value = withSpring(1, { damping: 10, mass: 0.8 });
    onToggle();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const checkAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).springify()}
      style={animatedStyle}
    >
      <Pressable
        onPress={handlePress}
        style={[styles.habitTile, checked && styles.habitTileChecked]}
      >
        <View style={[styles.iconCircle, checked && styles.iconCircleChecked]}>
          <Feather
            name={habit.icon as any}
            size={20}
            color={checked ? "white" : PremiumColors.copperOrange}
          />
        </View>

        <View style={styles.habitContent}>
          <ThemedText style={styles.habitLabel}>{habit.label}</ThemedText>
          <ThemedText style={styles.habitDescription}>
            {habit.description}
          </ThemedText>
        </View>

        <Animated.View style={[styles.checkmark, checkAnimatedStyle]}>
          <Feather name="check" size={18} color={PremiumColors.forestGreen} />
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

// Weekly Trends Graph
function WeeklyTrendsGraph({ weeklyData }: { weeklyData: DailyData[] }) {
  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date.toISOString().slice(0, 10));
    }
    return days;
  };

  const last7Days = getLast7Days();
  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const maxCount = PREMIUM_HABITS.length;

  const dayScores = last7Days.map((day) => {
    const dayData = weeklyData.find((d) => d.date === day);
    return dayData?.score || 0;
  });

  return (
    <View style={styles.trendContainer}>
      <ThemedText type="h3" style={styles.trendTitle}>
        Weekly Progress
      </ThemedText>

      <View style={styles.graphContainer}>
        {dayScores.map((score, idx) => {
          const height = (score / maxCount) * 100;
          const isToday = idx === last7Days.length - 1;
          const barColor =
            score < 3
              ? PremiumColors.copperOrange
              : score < PREMIUM_HABITS.length
                ? PremiumColors.skyBlue
                : PremiumColors.forestGreen;

          return (
            <View key={idx} style={styles.barWrapper}>
              <Animated.View
                entering={FadeInDown.delay(idx * 100).springify()}
                style={[
                  styles.bar,
                  {
                    height: `${Math.max(height, 15)}%`,
                    backgroundColor: barColor,
                    borderRadius: isToday ? 8 : 4,
                    borderWidth: isToday ? 2 : 0,
                    borderColor: PremiumColors.forestGreen,
                  },
                ]}
              />
              <ThemedText style={styles.dayLabel}>{dayLabels[idx]}</ThemedText>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// Science Card (Collapsible)
function ScienceCard() {
  const [expanded, setExpanded] = useState(false);
  const heightAnim = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    height: heightAnim.value,
    overflow: "hidden",
  }));

  const handleToggle = () => {
    setExpanded(!expanded);
    heightAnim.value = withTiming(expanded ? 0 : 300, { duration: 300 });
  };

  return (
    <View style={styles.scienceCard}>
      <Pressable style={styles.scienceHeader} onPress={handleToggle}>
        <View style={styles.scienceTitleRow}>
          <Feather name="zap" size={20} color={PremiumColors.copperOrange} />
          <ThemedText type="h3" style={styles.scienceTitle}>
            Why These Habits
          </ThemedText>
        </View>
        <Feather
          name={expanded ? "chevron-up" : "chevron-down"}
          size={20}
          color={PremiumColors.textSecondary}
        />
      </Pressable>

      <Animated.View style={animatedStyle}>
        <ScrollView
          scrollEnabled={false}
          style={styles.scienceContent}
          contentContainerStyle={styles.scienceContentInner}
        >
          {PREMIUM_HABITS.slice(0, 4).map((habit) => (
            <View key={habit.id} style={styles.scienceItem}>
              <ThemedText style={styles.scienceHabitName}>
                {habit.label}
              </ThemedText>
              <ThemedText style={styles.scienceExplanation}>
                {habit.science}
              </ThemedText>
            </View>
          ))}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

// Onboarding Modal
function OnboardingModal({
  visible,
  onDismiss,
}: {
  visible: boolean;
  onDismiss: () => void;
}) {
  const [slide, setSlide] = useState(0);
  const slides = [
    {
      title: "Dopamine Lab",
      description: "Understanding your biology helps you build better habits.",
      icon: "brain",
    },
    {
      title: "Natural Rewards",
      description: "Real dopamine comes from healthy habits, not shortcuts.",
      icon: "zap",
    },
    {
      title: "Track What Matters",
      description: "Daily check-ins show which habits fuel your motivation.",
      icon: "check-circle",
    },
  ];

  const currentSlide = slides[slide];

  if (!visible) return null;

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Feather
          name={currentSlide.icon as any}
          size={48}
          color={PremiumColors.copperOrange}
          style={styles.modalIcon}
        />
        <ThemedText type="h2" style={styles.modalTitle}>
          {currentSlide.title}
        </ThemedText>
        <ThemedText style={styles.modalDescription}>
          {currentSlide.description}
        </ThemedText>

        <View style={styles.slideIndicators}>
          {slides.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.indicator,
                idx === slide && styles.indicatorActive,
              ]}
            />
          ))}
        </View>

        <View style={styles.modalButtons}>
          {slide < slides.length - 1 ? (
            <Pressable
              style={styles.nextButton}
              onPress={() => setSlide(slide + 1)}
            >
              <ThemedText style={styles.nextButtonText}>Next</ThemedText>
            </Pressable>
          ) : (
            <Pressable style={styles.startButton} onPress={onDismiss}>
              <ThemedText style={styles.startButtonText}>Let's Go</ThemedText>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

// Main Screen
export default function DopamineLabScreen() {
  const insets = useSafeAreaInsets();
  const [todayData, setTodayData] = useState<HabitState>({});
  const [weeklyData, setWeeklyData] = useState<DailyData[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const todayScore = Object.values(todayData).filter(Boolean).length;

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [intro, data] = await Promise.all([
          AsyncStorage.getItem(DOPAMINE_INTRO_KEY),
          AsyncStorage.getItem(DOPAMINE_STORAGE_KEY),
        ]);

        if (!intro) {
          setShowOnboarding(true);
        }

        if (data) {
          const parsed = JSON.parse(data);
          setWeeklyData(parsed.weekly || []);

          const todayEntry = parsed.weekly?.find(
            (d: DailyData) => d.date === today
          );
          if (todayEntry) {
            setTodayData(todayEntry.habits);
          }
        }
      } catch (error) {
        console.error("Failed to load dopamine data:", error);
      }
    };

    loadData();
  }, [today]);

  // Save data
  const saveData = useCallback(
    async (newHabits: HabitState) => {
      try {
        setTodayData(newHabits);

        const updatedWeekly = weeklyData.filter((d) => d.date !== today);
        const todayEntry: DailyData = {
          date: today,
          habits: newHabits,
          score: Object.values(newHabits).filter(Boolean).length,
        };
        updatedWeekly.push(todayEntry);

        // Keep only last 30 days
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 30);
        const filtered = updatedWeekly.filter(
          (d) => new Date(d.date) >= cutoff
        );

        await AsyncStorage.setItem(
          DOPAMINE_STORAGE_KEY,
          JSON.stringify({ weekly: filtered })
        );
        setWeeklyData(filtered);
      } catch (error) {
        console.error("Failed to save dopamine data:", error);
      }
    },
    [today, weeklyData]
  );

  const handleHabitToggle = (habitId: string) => {
    const newHabits = {
      ...todayData,
      [habitId]: !todayData[habitId],
    };
    saveData(newHabits);
  };

  const handleOnboardingDismiss = async () => {
    setShowOnboarding(false);
    await AsyncStorage.setItem(DOPAMINE_INTRO_KEY, "true");
  };

  return (
    <ThemedView style={styles.root}>
      <ScrollView
        scrollIndicatorInsets={{ right: 1 }}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <HeaderSection
          todayScore={todayScore}
          maxScore={PREMIUM_HABITS.length}
        />

        <View style={styles.content}>
          <ThemedText type="h2" style={styles.sectionTitle}>
            Today's Habits
          </ThemedText>

          <View style={styles.habitGrid}>
            {PREMIUM_HABITS.map((habit, idx) => (
              <HabitTile
                key={habit.id}
                habit={habit}
                checked={todayData[habit.id] || false}
                onToggle={() => handleHabitToggle(habit.id)}
                index={idx}
              />
            ))}
          </View>

          <WeeklyTrendsGraph weeklyData={weeklyData} />

          <ScienceCard />

          <View style={styles.spacer} />
        </View>
      </ScrollView>

      <OnboardingModal
        visible={showOnboarding}
        onDismiss={handleOnboardingDismiss}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PremiumColors.backgroundMain,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.lg,
  },
  scoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
  },
  scoreRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: "700",
    color: PremiumColors.forestGreen,
  },
  scoreLabel: {
    fontSize: 12,
    color: PremiumColors.textSecondary,
  },
  scoreInfo: {
    flex: 1,
  },
  progressBar: {
    height: 6,
    backgroundColor: PremiumColors.forestGreen,
    borderRadius: 3,
    marginVertical: Spacing.sm,
  },
  progressPercent: {
    fontSize: 12,
    color: PremiumColors.textSecondary,
  },
  quoteCard: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    gap: Spacing.sm,
  },
  quoteIcon: {
    marginTop: -4,
  },
  quoteText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
    color: PremiumColors.textPrimary,
    lineHeight: 20,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xl,
  },
  sectionTitle: {
    marginTop: Spacing.lg,
    color: PremiumColors.textPrimary,
  },
  habitGrid: {
    gap: Spacing.md,
  },
  habitTile: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: PremiumColors.borderLight,
    gap: Spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  habitTileChecked: {
    backgroundColor: PremiumColors.forestGreen + "08",
    borderColor: PremiumColors.forestGreen,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: PremiumColors.copperOrange + "15",
    justifyContent: "center",
    alignItems: "center",
  },
  iconCircleChecked: {
    backgroundColor: PremiumColors.forestGreen,
  },
  habitContent: {
    flex: 1,
  },
  habitLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: PremiumColors.textPrimary,
    marginBottom: 2,
  },
  habitDescription: {
    fontSize: 12,
    color: PremiumColors.textSecondary,
  },
  checkmark: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  trendContainer: {
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  trendTitle: {
    color: PremiumColors.textPrimary,
  },
  graphContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    height: 150,
    backgroundColor: "white",
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  barWrapper: {
    alignItems: "center",
    flex: 1,
    justifyContent: "flex-end",
    height: "100%",
    gap: Spacing.sm,
  },
  bar: {
    width: "80%",
    minHeight: 8,
  },
  dayLabel: {
    fontSize: 11,
    color: PremiumColors.textSecondary,
  },
  scienceCard: {
    backgroundColor: "white",
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: PremiumColors.borderLight,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  scienceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
  },
  scienceTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
  },
  scienceTitle: {
    flex: 1,
    color: PremiumColors.textPrimary,
  },
  scienceContent: {
    maxHeight: 400,
  },
  scienceContentInner: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
  },
  scienceItem: {
    gap: Spacing.xs,
  },
  scienceHabitName: {
    fontWeight: "600",
    color: PremiumColors.forestGreen,
    fontSize: 13,
  },
  scienceExplanation: {
    fontSize: 12,
    color: PremiumColors.textSecondary,
    lineHeight: 18,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  modalIcon: {
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    marginBottom: Spacing.sm,
    color: PremiumColors.textPrimary,
  },
  modalDescription: {
    textAlign: "center",
    color: PremiumColors.textSecondary,
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  slideIndicators: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PremiumColors.borderLight,
  },
  indicatorActive: {
    backgroundColor: PremiumColors.forestGreen,
    width: 24,
  },
  modalButtons: {
    width: "100%",
  },
  nextButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: PremiumColors.skyBlue,
    borderRadius: BorderRadius.sm,
  },
  nextButtonText: {
    textAlign: "center",
    color: "white",
    fontWeight: "600",
  },
  startButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: PremiumColors.forestGreen,
    borderRadius: BorderRadius.sm,
  },
  startButtonText: {
    textAlign: "center",
    color: "white",
    fontWeight: "600",
  },
  spacer: {
    height: Spacing.lg,
  },
});

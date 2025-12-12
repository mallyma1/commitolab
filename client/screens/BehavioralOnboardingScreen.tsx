import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, EarthyColors } from "@/constants/theme";
import { generateHabitProfile, HabitProfile } from "@/lib/habit-profile";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface OnboardingData {
  motivations: string[];
  focusArea: string;
  tonePreference: string;
  relapseTriggers: string[];
  rewardStyle: string[];
  environmentRisks: string[];
  changeStyle: string;
}

interface BehavioralOnboardingScreenProps {
  onComplete: (data: OnboardingData & { habitProfile: HabitProfile }) => void;
}

const SCIENTIFIC_MICROCARDS = [
  "Most habits run on a loop: cue, action, reward. Repetition strengthens the loop.",
  "Visual logs make progress more memorable than text alone.",
  "Environment often overrides willpower. Adjusting cues is more effective than forcing action.",
  "The brain rewards consistency with dopamine, especially when progress is visible.",
  "Identity-based habits last longer than outcome goals.",
];

const MOTIVATIONS = [
  { id: "more_discipline", label: "More discipline" },
  { id: "more_focus", label: "More focus" },
  { id: "better_routine", label: "Better routine" },
  { id: "more_energy", label: "More energy" },
  { id: "mental_clarity", label: "Mental clarity" },
  { id: "feeling_in_control", label: "Feeling in control" },
  { id: "inner_calm", label: "Inner calm" },
  { id: "restarting_strong", label: "Restarting strong" },
  { id: "becoming_my_best_self", label: "Becoming my best self" },
];

const FOCUS_AREAS = [
  { id: "mind", label: "Mind", icon: "sun" },
  { id: "body", label: "Body", icon: "activity" },
  { id: "work", label: "Work", icon: "briefcase" },
  { id: "lifestyle", label: "Lifestyle", icon: "home" },
  { id: "creativity", label: "Creativity", icon: "feather" },
];

const TONE_PREFERENCES = [
  { id: "direct", label: "Direct" },
  { id: "calm", label: "Calm" },
  { id: "data_driven", label: "Data-driven" },
  { id: "encouraging", label: "Encouraging" },
  { id: "stoic", label: "Stoic" },
];

const RELAPSE_TRIGGERS = [
  { id: "distractions", label: "Distractions" },
  { id: "overwhelm", label: "Overwhelm" },
  { id: "low_energy", label: "Low energy" },
  { id: "losing_momentum", label: "Losing momentum" },
  { id: "forgetfulness", label: "Forgetfulness" },
  { id: "emotional_dips", label: "Emotional dips" },
  { id: "lack_of_structure", label: "Lack of structure" },
];

const REWARD_STYLES = [
  { id: "feeling_better_mentally", label: "Feeling better mentally" },
  { id: "seeing_progress", label: "Seeing progress" },
  { id: "external_rewards", label: "External rewards" },
  { id: "building_identity", label: "Building identity" },
  { id: "avoiding_negative_outcomes", label: "Avoiding negative outcomes" },
];

const ENVIRONMENT_RISKS = [
  { id: "chaotic_schedule", label: "Chaotic schedule" },
  { id: "phone_always_nearby", label: "Phone always nearby" },
  { id: "no_routine_space", label: "No routine space" },
  { id: "unsupportive_people", label: "Unsupportive people" },
  { id: "evenings_messy", label: "Evenings messy" },
  { id: "mornings_rushed", label: "Mornings rushed" },
];

const CHANGE_STYLES = [
  { id: "all_in_fast", label: "I go all-in fast" },
  { id: "build_slowly", label: "I build slowly" },
  { id: "wait_until_ready", label: "I wait until I feel ready" },
  { id: "try_many_things", label: "I try many things at once" },
];

export default function BehavioralOnboardingScreen({
  onComplete,
}: BehavioralOnboardingScreenProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    motivations: [],
    focusArea: "",
    tonePreference: "",
    relapseTriggers: [],
    rewardStyle: [],
    environmentRisks: [],
    changeStyle: "",
  });

  const canContinue = useCallback(() => {
    switch (step) {
      case 0:
      case 1:
        return true;
      case 2:
        return data.motivations.length > 0;
      case 3:
        return data.focusArea !== "";
      case 4:
        return data.tonePreference !== "";
      case 5:
        return data.relapseTriggers.length > 0;
      case 6:
        return data.rewardStyle.length > 0;
      case 7:
        return data.environmentRisks.length > 0;
      case 8:
        return data.changeStyle !== "";
      case 9:
        return true;
      default:
        return false;
    }
  }, [step, data]);

  const handleNext = () => {
    if (step < 9) {
      setStep(step + 1);
    } else {
      const habitProfile = generateHabitProfile({
        motivations: data.motivations,
        rewardStyle: data.rewardStyle,
        changeStyle: data.changeStyle,
        relapseTriggers: data.relapseTriggers,
      });
      onComplete({ ...data, habitProfile });
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const toggleArrayItem = (key: keyof OnboardingData, item: string) => {
    const arr = data[key] as string[];
    if (arr.includes(item)) {
      setData({ ...data, [key]: arr.filter((i) => i !== item) });
    } else {
      setData({ ...data, [key]: [...arr, item] });
    }
  };

  const setSingleItem = (key: keyof OnboardingData, value: string) => {
    setData({ ...data, [key]: value });
  };

  const renderMicrocard = (index: number) => (
    <View
      style={[
        styles.microcard,
        { backgroundColor: `${EarthyColors.sandBeige}20` },
      ]}
    >
      <Feather name="info" size={14} color={EarthyColors.terraBrown} />
      <ThemedText
        style={[styles.microcardText, { color: theme.textSecondary }]}
      >
        {SCIENTIFIC_MICROCARDS[index % SCIENTIFIC_MICROCARDS.length]}
      </ThemedText>
    </View>
  );

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <Animated.View
            entering={FadeIn.duration(400)}
            exiting={FadeOut.duration(200)}
            style={styles.stepContainer}
          >
            <View style={styles.cinematicContent}>
              <ThemedText type="h1" style={styles.cinematicTitle}>
                Most people break promises to themselves.
              </ThemedText>
              <ThemedText
                type="bodyLarge"
                style={[
                  styles.cinematicSubtitle,
                  { color: theme.textSecondary },
                ]}
              >
                You're not here to be most people.
              </ThemedText>
            </View>
          </Animated.View>
        );

      case 1:
        return (
          <Animated.View
            entering={SlideInRight.duration(300)}
            exiting={SlideOutLeft.duration(200)}
            style={styles.stepContainer}
          >
            <View style={styles.contentSection}>
              <ThemedText type="h2" style={styles.stepTitle}>
                This is where discipline becomes visible.
              </ThemedText>
              <ThemedText
                type="bodyLarge"
                style={[styles.stepSubtitle, { color: theme.textSecondary }]}
              >
                Your habits turn into proof. Your proof turns into identity.
              </ThemedText>
              {renderMicrocard(0)}
            </View>
          </Animated.View>
        );

      case 2:
        return (
          <Animated.View
            entering={SlideInRight.duration(300)}
            exiting={SlideOutLeft.duration(200)}
            style={styles.stepContainer}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <ThemedText type="h3" style={styles.questionTitle}>
                What transformation are you aiming for?
              </ThemedText>
              <ThemedText style={[styles.hint, { color: theme.textSecondary }]}>
                Select all that apply
              </ThemedText>
              <View style={styles.optionsGrid}>
                {MOTIVATIONS.map((item) => (
                  <Pressable
                    key={item.id}
                    style={[
                      styles.optionChip,
                      {
                        backgroundColor: data.motivations.includes(item.id)
                          ? EarthyColors.terraBrown
                          : theme.backgroundSecondary,
                        borderColor: data.motivations.includes(item.id)
                          ? EarthyColors.terraBrown
                          : theme.border,
                      },
                    ]}
                    onPress={() => toggleArrayItem("motivations", item.id)}
                  >
                    <ThemedText
                      style={[
                        styles.optionText,
                        {
                          color: data.motivations.includes(item.id)
                            ? "#fff"
                            : theme.text,
                        },
                      ]}
                    >
                      {item.label}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
              {renderMicrocard(1)}
            </ScrollView>
          </Animated.View>
        );

      case 3:
        return (
          <Animated.View
            entering={SlideInRight.duration(300)}
            exiting={SlideOutLeft.duration(200)}
            style={styles.stepContainer}
          >
            <ThemedText type="h3" style={styles.questionTitle}>
              Where do you need the biggest shift?
            </ThemedText>
            <View style={styles.focusGrid}>
              {FOCUS_AREAS.map((item) => (
                <Pressable
                  key={item.id}
                  style={[
                    styles.focusCard,
                    {
                      backgroundColor:
                        data.focusArea === item.id
                          ? EarthyColors.terraBrown
                          : theme.backgroundSecondary,
                      borderColor:
                        data.focusArea === item.id
                          ? EarthyColors.terraBrown
                          : theme.border,
                    },
                  ]}
                  onPress={() => setSingleItem("focusArea", item.id)}
                >
                  <Feather
                    name={item.icon as any}
                    size={28}
                    color={data.focusArea === item.id ? "#fff" : theme.primary}
                  />
                  <ThemedText
                    style={[
                      styles.focusLabel,
                      {
                        color: data.focusArea === item.id ? "#fff" : theme.text,
                      },
                    ]}
                  >
                    {item.label}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
            {renderMicrocard(2)}
          </Animated.View>
        );

      case 4:
        return (
          <Animated.View
            entering={SlideInRight.duration(300)}
            exiting={SlideOutLeft.duration(200)}
            style={styles.stepContainer}
          >
            <ThemedText type="h3" style={styles.questionTitle}>
              How should StreakProof speak to you?
            </ThemedText>
            <View style={styles.optionsList}>
              {TONE_PREFERENCES.map((item) => (
                <Pressable
                  key={item.id}
                  style={[
                    styles.listOption,
                    {
                      backgroundColor:
                        data.tonePreference === item.id
                          ? EarthyColors.terraBrown
                          : theme.backgroundSecondary,
                      borderColor:
                        data.tonePreference === item.id
                          ? EarthyColors.terraBrown
                          : theme.border,
                    },
                  ]}
                  onPress={() => setSingleItem("tonePreference", item.id)}
                >
                  <ThemedText
                    style={{
                      color:
                        data.tonePreference === item.id ? "#fff" : theme.text,
                    }}
                  >
                    {item.label}
                  </ThemedText>
                  {data.tonePreference === item.id ? (
                    <Feather name="check" size={20} color="#fff" />
                  ) : null}
                </Pressable>
              ))}
            </View>
          </Animated.View>
        );

      case 5:
        return (
          <Animated.View
            entering={SlideInRight.duration(300)}
            exiting={SlideOutLeft.duration(200)}
            style={styles.stepContainer}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <ThemedText type="h3" style={styles.questionTitle}>
                What usually pulls you off track?
              </ThemedText>
              <ThemedText style={[styles.hint, { color: theme.textSecondary }]}>
                Select all that apply
              </ThemedText>
              <View style={styles.optionsGrid}>
                {RELAPSE_TRIGGERS.map((item) => (
                  <Pressable
                    key={item.id}
                    style={[
                      styles.optionChip,
                      {
                        backgroundColor: data.relapseTriggers.includes(item.id)
                          ? EarthyColors.clayRed
                          : theme.backgroundSecondary,
                        borderColor: data.relapseTriggers.includes(item.id)
                          ? EarthyColors.clayRed
                          : theme.border,
                      },
                    ]}
                    onPress={() => toggleArrayItem("relapseTriggers", item.id)}
                  >
                    <ThemedText
                      style={[
                        styles.optionText,
                        {
                          color: data.relapseTriggers.includes(item.id)
                            ? "#fff"
                            : theme.text,
                        },
                      ]}
                    >
                      {item.label}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
              {renderMicrocard(3)}
            </ScrollView>
          </Animated.View>
        );

      case 6:
        return (
          <Animated.View
            entering={SlideInRight.duration(300)}
            exiting={SlideOutLeft.duration(200)}
            style={styles.stepContainer}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <ThemedText type="h3" style={styles.questionTitle}>
                What keeps you returning to a habit?
              </ThemedText>
              <ThemedText style={[styles.hint, { color: theme.textSecondary }]}>
                Select all that apply
              </ThemedText>
              <View style={styles.optionsGrid}>
                {REWARD_STYLES.map((item) => (
                  <Pressable
                    key={item.id}
                    style={[
                      styles.optionChip,
                      {
                        backgroundColor: data.rewardStyle.includes(item.id)
                          ? EarthyColors.forestGreen
                          : theme.backgroundSecondary,
                        borderColor: data.rewardStyle.includes(item.id)
                          ? EarthyColors.forestGreen
                          : theme.border,
                      },
                    ]}
                    onPress={() => toggleArrayItem("rewardStyle", item.id)}
                  >
                    <ThemedText
                      style={[
                        styles.optionText,
                        {
                          color: data.rewardStyle.includes(item.id)
                            ? "#fff"
                            : theme.text,
                        },
                      ]}
                    >
                      {item.label}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
              {renderMicrocard(4)}
            </ScrollView>
          </Animated.View>
        );

      case 7:
        return (
          <Animated.View
            entering={SlideInRight.duration(300)}
            exiting={SlideOutLeft.duration(200)}
            style={styles.stepContainer}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <ThemedText type="h3" style={styles.questionTitle}>
                What does your environment look like when habits slip?
              </ThemedText>
              <ThemedText style={[styles.hint, { color: theme.textSecondary }]}>
                Select all that apply
              </ThemedText>
              <View style={styles.optionsGrid}>
                {ENVIRONMENT_RISKS.map((item) => (
                  <Pressable
                    key={item.id}
                    style={[
                      styles.optionChip,
                      {
                        backgroundColor: data.environmentRisks.includes(item.id)
                          ? EarthyColors.smokeGrey
                          : theme.backgroundSecondary,
                        borderColor: data.environmentRisks.includes(item.id)
                          ? EarthyColors.smokeGrey
                          : theme.border,
                      },
                    ]}
                    onPress={() => toggleArrayItem("environmentRisks", item.id)}
                  >
                    <ThemedText
                      style={[
                        styles.optionText,
                        {
                          color: data.environmentRisks.includes(item.id)
                            ? "#fff"
                            : theme.text,
                        },
                      ]}
                    >
                      {item.label}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </Animated.View>
        );

      case 8:
        return (
          <Animated.View
            entering={SlideInRight.duration(300)}
            exiting={SlideOutLeft.duration(200)}
            style={styles.stepContainer}
          >
            <ThemedText type="h3" style={styles.questionTitle}>
              How do you usually approach change?
            </ThemedText>
            <View style={styles.optionsList}>
              {CHANGE_STYLES.map((item) => (
                <Pressable
                  key={item.id}
                  style={[
                    styles.listOption,
                    {
                      backgroundColor:
                        data.changeStyle === item.id
                          ? EarthyColors.copper
                          : theme.backgroundSecondary,
                      borderColor:
                        data.changeStyle === item.id
                          ? EarthyColors.copper
                          : theme.border,
                    },
                  ]}
                  onPress={() => setSingleItem("changeStyle", item.id)}
                >
                  <ThemedText
                    style={{
                      color: data.changeStyle === item.id ? "#fff" : theme.text,
                    }}
                  >
                    {item.label}
                  </ThemedText>
                  {data.changeStyle === item.id ? (
                    <Feather name="check" size={20} color="#fff" />
                  ) : null}
                </Pressable>
              ))}
            </View>
          </Animated.View>
        );

      case 9:
        const profile = generateHabitProfile({
          motivations: data.motivations,
          rewardStyle: data.rewardStyle,
          changeStyle: data.changeStyle,
          relapseTriggers: data.relapseTriggers,
        });
        return (
          <Animated.View
            entering={FadeIn.duration(400)}
            exiting={FadeOut.duration(200)}
            style={styles.stepContainer}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <View
                style={[
                  styles.profileCard,
                  { backgroundColor: theme.backgroundSecondary },
                ]}
              >
                <View
                  style={[
                    styles.profileBadge,
                    { backgroundColor: profile.color },
                  ]}
                >
                  <Feather name="user" size={24} color="#fff" />
                </View>
                <ThemedText type="h3" style={styles.profileName}>
                  {profile.name}
                </ThemedText>
                <ThemedText
                  style={[
                    styles.profileDescription,
                    { color: theme.textSecondary },
                  ]}
                >
                  {profile.description}
                </ThemedText>

                <View style={styles.profileSection}>
                  <ThemedText type="h4" style={styles.sectionTitle}>
                    Your Strengths
                  </ThemedText>
                  {profile.strengths.map((strength, i) => (
                    <View key={i} style={styles.bulletItem}>
                      <Feather
                        name="check-circle"
                        size={16}
                        color={EarthyColors.forestGreen}
                      />
                      <ThemedText style={styles.bulletText}>
                        {strength}
                      </ThemedText>
                    </View>
                  ))}
                </View>

                <View style={styles.profileSection}>
                  <ThemedText type="h4" style={styles.sectionTitle}>
                    Risk Zones
                  </ThemedText>
                  {profile.riskZones.map((risk, i) => (
                    <View key={i} style={styles.bulletItem}>
                      <Feather
                        name="alert-circle"
                        size={16}
                        color={EarthyColors.clayRed}
                      />
                      <ThemedText style={styles.bulletText}>{risk}</ThemedText>
                    </View>
                  ))}
                </View>

                <View style={styles.profileSection}>
                  <ThemedText type="h4" style={styles.sectionTitle}>
                    Strategies for Success
                  </ThemedText>
                  {profile.strategies.map((strategy, i) => (
                    <View key={i} style={styles.bulletItem}>
                      <Feather
                        name="target"
                        size={16}
                        color={EarthyColors.copper}
                      />
                      <ThemedText style={styles.bulletText}>
                        {strategy}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              </View>
            </ScrollView>
          </Animated.View>
        );

      default:
        return null;
    }
  };

  return (
    <LinearGradient
      colors={[theme.gradientStart, theme.gradientEnd]}
      style={styles.container}
    >
      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + Spacing.lg,
            paddingBottom: insets.bottom + Spacing.lg,
          },
        ]}
      >
        {step > 0 ? (
          <View style={styles.header}>
            <Pressable onPress={handleBack} style={styles.backButton}>
              <Feather name="arrow-left" size={24} color={theme.text} />
            </Pressable>
            <View style={styles.progressContainer}>
              {Array.from({ length: 10 }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.progressDot,
                    {
                      backgroundColor:
                        i <= step ? EarthyColors.terraBrown : theme.border,
                    },
                  ]}
                />
              ))}
            </View>
            <View style={{ width: 40 }} />
          </View>
        ) : null}

        <View style={styles.stepContent}>{renderStep()}</View>

        <View style={styles.footer}>
          <Pressable
            style={[
              styles.continueButton,
              {
                backgroundColor: canContinue()
                  ? EarthyColors.terraBrown
                  : theme.border,
              },
            ]}
            onPress={handleNext}
            disabled={!canContinue()}
          >
            <ThemedText style={styles.continueText}>
              {step === 9 ? "Build my first streak" : "Continue"}
            </ThemedText>
            <Feather name="arrow-right" size={20} color="#fff" />
          </Pressable>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  backButton: {
    padding: Spacing.sm,
  },
  progressContainer: {
    flexDirection: "row",
    gap: 6,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stepContent: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
  },
  cinematicContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
  },
  cinematicTitle: {
    textAlign: "center",
    marginBottom: Spacing.lg,
    lineHeight: 42,
  },
  cinematicSubtitle: {
    textAlign: "center",
  },
  contentSection: {
    flex: 1,
    justifyContent: "center",
  },
  stepTitle: {
    marginBottom: Spacing.md,
    lineHeight: 36,
  },
  stepSubtitle: {
    marginBottom: Spacing.xl,
    lineHeight: 26,
  },
  questionTitle: {
    marginBottom: Spacing.sm,
  },
  hint: {
    marginBottom: Spacing.lg,
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  optionChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  optionText: {
    fontSize: 14,
  },
  focusGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  focusCard: {
    width: (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.md) / 2,
    aspectRatio: 1.5,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.sm,
  },
  focusLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  optionsList: {
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  listOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  microcard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.md,
  },
  microcardText: {
    flex: 1,
    fontSize: 13,
    fontStyle: "italic",
    lineHeight: 20,
  },
  profileCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
  },
  profileBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  profileName: {
    marginBottom: Spacing.sm,
  },
  profileDescription: {
    textAlign: "center",
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  profileSection: {
    width: "100%",
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.sm,
  },
  bulletItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  bulletText: {
    flex: 1,
    lineHeight: 22,
  },
  footer: {
    paddingTop: Spacing.md,
  },
  continueButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.sm,
    height: 56,
    borderRadius: BorderRadius.sm,
  },
  continueText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

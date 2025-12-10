import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import Animated, { SlideInRight, SlideOutLeft } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";
import { useAuth } from "@/contexts/AuthContext";
import type { IdentityArchetype, GoalCategory } from "@shared/schema";

const archetypeLabels: Record<IdentityArchetype, string> = {
  athlete: "The Athlete",
  focused_creative: "The Focused Creative",
  disciplined_builder: "The Disciplined Builder",
  balanced_mind: "The Balanced Mind",
  better_everyday: "The Better Everyday",
};

const archetypeDescriptions: Record<IdentityArchetype, string> = {
  athlete: "Driven by discipline, progress and intentional effort.",
  focused_creative: "Seeks clarity, deep focus and space to create their best work.",
  disciplined_builder: "Values structure, long term gains and steady execution.",
  balanced_mind: "Wants peace, mental clarity and a healthier internal world.",
  better_everyday: "Small upgrades each day that compound into a different life.",
};

const archetypeIcons: Record<IdentityArchetype, keyof typeof Feather.glyphMap> = {
  athlete: "activity",
  focused_creative: "feather",
  disciplined_builder: "layers",
  balanced_mind: "sun",
  better_everyday: "trending-up",
};

const goalCategoryLabels: Record<GoalCategory, string> = {
  fitness: "Fitness",
  learning: "Learning",
  work: "Work",
  creativity: "Creativity",
  mental_health: "Mental Health",
  nutrition: "Nutrition",
  personal_improvement: "Personal Improvement",
  custom: "Custom",
};

const cadences = ["daily", "weekly", "custom"] as const;
type Cadence = (typeof cadences)[number];

type OnboardingScreenProps = {
  onComplete: () => void;
};

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, refreshUser } = useAuth();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [identityArchetype, setIdentityArchetype] = useState<IdentityArchetype | null>(null);
  const [goalCategory, setGoalCategory] = useState<GoalCategory | null>(null);
  const [goalReason, setGoalReason] = useState("");
  const [cadence, setCadence] = useState<Cadence>("daily");

  const canGoNextStep2 = !!identityArchetype;
  const canGoNextStep4 = !!goalCategory && goalReason.trim().length >= 10;

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleFinish = async () => {
    if (!identityArchetype || !goalCategory || !user) return;

    try {
      setLoading(true);

      const apiUrl = getApiUrl();
      const response = await fetch(new URL(`/api/users/${user.id}/onboarding`, apiUrl).toString(), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": user.id,
        },
        body: JSON.stringify({
          identityArchetype,
          primaryGoalCategory: goalCategory,
          primaryGoalReason: goalReason.trim(),
          preferredCadence: cadence,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to complete onboarding");
      }

      await refreshUser();
      onComplete();
    } catch (error) {
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const progress = (step / 4) * 100;

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <ThemedText style={[styles.progressLabel, { color: theme.textSecondary }]}>
              Streak Tracker Setup
            </ThemedText>
            <ThemedText style={[styles.stepLabel, { color: theme.textSecondary }]}>
              Step {step} of 4
            </ThemedText>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
            <View
              style={[
                styles.progressFill,
                { width: `${progress}%`, backgroundColor: theme.primary },
              ]}
            />
          </View>
        </View>

        <Animated.View
          key={step}
          entering={SlideInRight.duration(300)}
          exiting={SlideOutLeft.duration(200)}
          style={styles.stepContent}
        >
          {step === 1 ? <Step1Intro onNext={handleNext} /> : null}
          {step === 2 ? (
            <Step2Identity
              identityArchetype={identityArchetype}
              onSelect={setIdentityArchetype}
              onNext={handleNext}
              onBack={handleBack}
              canContinue={canGoNextStep2}
            />
          ) : null}
          {step === 3 ? <Step3Science onNext={handleNext} onBack={handleBack} /> : null}
          {step === 4 ? (
            <Step4Personalise
              identityArchetype={identityArchetype}
              goalCategory={goalCategory}
              goalReason={goalReason}
              cadence={cadence}
              onSetGoalCategory={setGoalCategory}
              onSetGoalReason={setGoalReason}
              onSetCadence={setCadence}
              onBack={handleBack}
              onFinish={handleFinish}
              canFinish={canGoNextStep4}
              loading={loading}
            />
          ) : null}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function Step1Intro({ onNext }: { onNext: () => void }) {
  const { theme } = useTheme();

  return (
    <View>
      <ThemedText type="h1" style={styles.heading}>
        Let's build the version of you that shows up.
      </ThemedText>
      <ThemedText style={[styles.subheading, { color: theme.textSecondary }]}>
        Most people break promises to themselves. You're here because you're done being
        one of them. Streak Tracker turns your commitments into visible, verifiable
        streaks that are harder to abandon.
      </ThemedText>

      <View style={styles.bulletList}>
        <BulletPoint icon="target" text="Capture your promise with one clear commitment." />
        <BulletPoint icon="camera" text="Prove you showed up with visual check-ins." />
        <BulletPoint icon="zap" text="Use streak psychology to stay consistent." />
      </View>

      <Pressable
        style={[styles.primaryButton, { backgroundColor: theme.primary }]}
        onPress={onNext}
      >
        <ThemedText style={styles.primaryButtonText}>Let's Begin</ThemedText>
        <Feather name="arrow-right" size={20} color="#fff" />
      </Pressable>
    </View>
  );
}

function BulletPoint({ icon, text }: { icon: keyof typeof Feather.glyphMap; text: string }) {
  const { theme } = useTheme();

  return (
    <View style={styles.bulletRow}>
      <View style={[styles.bulletIcon, { backgroundColor: theme.primary + "20" }]}>
        <Feather name={icon} size={16} color={theme.primary} />
      </View>
      <ThemedText style={[styles.bulletText, { color: theme.textSecondary }]}>{text}</ThemedText>
    </View>
  );
}

function Step2Identity({
  identityArchetype,
  onSelect,
  onNext,
  onBack,
  canContinue,
}: {
  identityArchetype: IdentityArchetype | null;
  onSelect: (value: IdentityArchetype) => void;
  onNext: () => void;
  onBack: () => void;
  canContinue: boolean;
}) {
  const { theme } = useTheme();
  const archetypes: IdentityArchetype[] = [
    "athlete",
    "focused_creative",
    "disciplined_builder",
    "balanced_mind",
    "better_everyday",
  ];

  return (
    <View>
      <ThemedText type="h2" style={styles.heading}>
        Which version of you are you becoming?
      </ThemedText>
      <ThemedText style={[styles.subheading, { color: theme.textSecondary }]}>
        Streak Tracker works best when it reflects the identity you're stepping into,
        not just a task list.
      </ThemedText>

      <View style={styles.archetypeGrid}>
        {archetypes.map((key) => {
          const selected = identityArchetype === key;
          return (
            <Pressable
              key={key}
              onPress={() => onSelect(key)}
              style={[
                styles.archetypeCard,
                {
                  backgroundColor: selected ? theme.primary + "15" : theme.backgroundDefault,
                  borderColor: selected ? theme.primary : theme.border,
                },
              ]}
            >
              <View style={[styles.archetypeIcon, { backgroundColor: theme.primary + "20" }]}>
                <Feather name={archetypeIcons[key]} size={20} color={theme.primary} />
              </View>
              <ThemedText style={styles.archetypeLabel}>{archetypeLabels[key]}</ThemedText>
              <ThemedText style={[styles.archetypeDesc, { color: theme.textSecondary }]}>
                {archetypeDescriptions[key]}
              </ThemedText>
              {selected ? (
                <View style={[styles.checkBadge, { backgroundColor: theme.primary }]}>
                  <Feather name="check" size={14} color="#fff" />
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <NavigationButtons onBack={onBack} onNext={onNext} canContinue={canContinue} />
    </View>
  );
}

function Step3Science({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { theme } = useTheme();

  return (
    <View>
      <ThemedText type="h2" style={styles.heading}>
        Why this method works.
      </ThemedText>
      <ThemedText style={[styles.subheading, { color: theme.textSecondary }]}>
        Streak Tracker is built on behavioural science, not wishful thinking.
      </ThemedText>

      <View style={styles.scienceCards}>
        <ScienceCard
          tag="Visual Feedback"
          title="Visual proof keeps habits alive."
          description="Seeing your own evidence builds a feedback loop that makes progress feel real and harder to ignore."
        />
        <ScienceCard
          tag="Streak Psychology"
          title="Streaks use loss aversion."
          description="Once you have a streak, breaking it feels like a loss, so your brain fights harder to keep it alive."
        />
        <ScienceCard
          tag="Commitment Effect"
          title="Accountability boosts success."
          description="When goals are recorded and visible, people are more likely to follow through than keeping them in their head."
        />
      </View>

      <NavigationButtons onBack={onBack} onNext={onNext} canContinue />
    </View>
  );
}

function ScienceCard({
  tag,
  title,
  description,
}: {
  tag: string;
  title: string;
  description: string;
}) {
  const { theme } = useTheme();

  return (
    <Card style={styles.scienceCard}>
      <View style={[styles.scienceTag, { backgroundColor: theme.primary + "20" }]}>
        <ThemedText style={[styles.scienceTagText, { color: theme.primary }]}>{tag}</ThemedText>
      </View>
      <ThemedText style={styles.scienceTitle}>{title}</ThemedText>
      <ThemedText style={[styles.scienceDesc, { color: theme.textSecondary }]}>
        {description}
      </ThemedText>
    </Card>
  );
}

function Step4Personalise({
  identityArchetype,
  goalCategory,
  goalReason,
  cadence,
  onSetGoalCategory,
  onSetGoalReason,
  onSetCadence,
  onBack,
  onFinish,
  canFinish,
  loading,
}: {
  identityArchetype: IdentityArchetype | null;
  goalCategory: GoalCategory | null;
  goalReason: string;
  cadence: Cadence;
  onSetGoalCategory: (val: GoalCategory) => void;
  onSetGoalReason: (val: string) => void;
  onSetCadence: (val: Cadence) => void;
  onBack: () => void;
  onFinish: () => void;
  canFinish: boolean;
  loading: boolean;
}) {
  const { theme } = useTheme();
  const identityLabel = identityArchetype
    ? archetypeLabels[identityArchetype].toLowerCase()
    : "the version of you that shows up";

  const categories: GoalCategory[] = [
    "fitness",
    "learning",
    "work",
    "creativity",
    "mental_health",
    "nutrition",
    "personal_improvement",
    "custom",
  ];

  return (
    <View>
      <ThemedText type="h2" style={styles.heading}>
        Make this personal.
      </ThemedText>
      <ThemedText style={[styles.subheading, { color: theme.textSecondary }]}>
        You're building momentum as {identityLabel}. Let's anchor it to one clear habit
        that matters.
      </ThemedText>

      <ThemedText style={styles.fieldLabel}>
        What do you want to get consistent with first?
      </ThemedText>
      <View style={styles.chipGrid}>
        {categories.map((cat) => {
          const selected = goalCategory === cat;
          return (
            <Pressable
              key={cat}
              onPress={() => onSetGoalCategory(cat)}
              style={[
                styles.chip,
                {
                  backgroundColor: selected ? theme.primary + "20" : theme.backgroundDefault,
                  borderColor: selected ? theme.primary : theme.border,
                },
              ]}
            >
              <ThemedText style={[styles.chipText, selected ? { color: theme.primary } : null]}>
                {goalCategoryLabels[cat]}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      <ThemedText style={styles.fieldLabel}>Why does this matter to you?</ThemedText>
      <TextInput
        style={[
          styles.textArea,
          {
            backgroundColor: theme.backgroundDefault,
            borderColor: theme.border,
            color: theme.text,
          },
        ]}
        value={goalReason}
        onChangeText={onSetGoalReason}
        placeholder="Be honest with yourself. For example: I'm tired of feeling like I start things and never finish them."
        placeholderTextColor={theme.textSecondary}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />
      <ThemedText style={[styles.fieldHint, { color: theme.textSecondary }]}>
        At least 10 characters so we can echo this back when it gets hard.
      </ThemedText>

      <ThemedText style={styles.fieldLabel}>How often do you want to show up?</ThemedText>
      <View style={styles.chipGrid}>
        {cadences.map((c) => {
          const selected = cadence === c;
          return (
            <Pressable
              key={c}
              onPress={() => onSetCadence(c)}
              style={[
                styles.chip,
                {
                  backgroundColor: selected ? theme.primary + "20" : theme.backgroundDefault,
                  borderColor: selected ? theme.primary : theme.border,
                },
              ]}
            >
              <ThemedText style={[styles.chipText, selected ? { color: theme.primary } : null]}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.navButtons}>
        <Pressable style={[styles.backButton, { borderColor: theme.border }]} onPress={onBack}>
          <ThemedText style={{ color: theme.textSecondary }}>Back</ThemedText>
        </Pressable>
        <Pressable
          style={[
            styles.primaryButton,
            { flex: 1, backgroundColor: canFinish ? theme.primary : theme.border },
          ]}
          onPress={onFinish}
          disabled={!canFinish || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <ThemedText style={styles.primaryButtonText}>Start My Streak</ThemedText>
              <Feather name="zap" size={18} color="#fff" />
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

function NavigationButtons({
  onBack,
  onNext,
  canContinue,
}: {
  onBack: () => void;
  onNext: () => void;
  canContinue: boolean;
}) {
  const { theme } = useTheme();

  return (
    <View style={styles.navButtons}>
      <Pressable style={[styles.backButton, { borderColor: theme.border }]} onPress={onBack}>
        <ThemedText style={{ color: theme.textSecondary }}>Back</ThemedText>
      </Pressable>
      <Pressable
        style={[
          styles.continueButton,
          { backgroundColor: canContinue ? theme.text : theme.border },
        ]}
        onPress={onNext}
        disabled={!canContinue}
      >
        <ThemedText style={[styles.continueButtonText, { color: theme.backgroundRoot }]}>
          Continue
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    flexGrow: 1,
  },
  progressContainer: {
    marginBottom: Spacing.xl,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  progressLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  stepLabel: {
    fontSize: 12,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  stepContent: {
    flex: 1,
  },
  heading: {
    marginBottom: Spacing.md,
  },
  subheading: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  bulletList: {
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  bulletIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
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
  archetypeGrid: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  archetypeCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    position: "relative",
  },
  archetypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  archetypeLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  archetypeDesc: {
    fontSize: 13,
  },
  checkBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  scienceCards: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  scienceCard: {
    padding: Spacing.md,
  },
  scienceTag: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  scienceTagText: {
    fontSize: 10,
    textTransform: "uppercase",
    fontWeight: "600",
    letterSpacing: 1,
  },
  scienceTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  scienceDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 14,
    minHeight: 80,
  },
  fieldHint: {
    fontSize: 12,
    marginTop: Spacing.xs,
  },
  navButtons: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  backButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  continueButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  continueButtonText: {
    fontWeight: "600",
    fontSize: 15,
  },
});

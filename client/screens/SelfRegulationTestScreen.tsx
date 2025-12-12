import React, { useState, useMemo } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
} from "react-native";
import Animated, { FadeIn, SlideInRight } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { ProGate } from "@/components/ProGate";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, EarthyColors } from "@/constants/theme";

const QUESTIONS = [
  {
    id: 1,
    text: "When I set a goal, I usually stick with it even when it gets hard.",
    dimension: "persistence",
  },
  {
    id: 2,
    text: "I find it easy to resist short-term temptations for long-term benefits.",
    dimension: "impulse_control",
  },
  {
    id: 3,
    text: "I regularly reflect on my habits and what's working or not.",
    dimension: "self_awareness",
  },
  {
    id: 4,
    text: "When I feel stressed, I have healthy ways to cope.",
    dimension: "emotion_regulation",
  },
  {
    id: 5,
    text: "I can delay gratification when there's a good reason to.",
    dimension: "impulse_control",
  },
  {
    id: 6,
    text: "I bounce back quickly after setbacks.",
    dimension: "resilience",
  },
  {
    id: 7,
    text: "I understand what triggers my unproductive behaviors.",
    dimension: "self_awareness",
  },
  {
    id: 8,
    text: "I can motivate myself to do things I don't feel like doing.",
    dimension: "motivation",
  },
  {
    id: 9,
    text: "When things don't go as planned, I adapt my approach.",
    dimension: "flexibility",
  },
  {
    id: 10,
    text: "I have rituals or routines that help me stay on track.",
    dimension: "structure",
  },
  {
    id: 11,
    text: "I rarely give up on my commitments, even when progress is slow.",
    dimension: "persistence",
  },
  {
    id: 12,
    text: "I can recognize when negative emotions are affecting my decisions.",
    dimension: "emotion_regulation",
  },
];

const ANSWER_OPTIONS = [
  { value: 1, label: "Strongly disagree" },
  { value: 2, label: "Disagree" },
  { value: 3, label: "Neutral" },
  { value: 4, label: "Agree" },
  { value: 5, label: "Strongly agree" },
];

type DimensionScores = {
  persistence: number;
  impulse_control: number;
  self_awareness: number;
  emotion_regulation: number;
  resilience: number;
  motivation: number;
  flexibility: number;
  structure: number;
};

const DIMENSION_LABELS: Record<keyof DimensionScores, string> = {
  persistence: "Persistence",
  impulse_control: "Impulse Control",
  self_awareness: "Self-Awareness",
  emotion_regulation: "Emotion Regulation",
  resilience: "Resilience",
  motivation: "Self-Motivation",
  flexibility: "Adaptability",
  structure: "Structure & Routine",
};

const DIMENSION_ICONS: Record<keyof DimensionScores, string> = {
  persistence: "target",
  impulse_control: "shield",
  self_awareness: "eye",
  emotion_regulation: "heart",
  resilience: "refresh-cw",
  motivation: "zap",
  flexibility: "git-branch",
  structure: "grid",
};

function getProfileType(scores: DimensionScores): {
  type: string;
  title: string;
  description: string;
  strengths: string[];
  growthAreas: string[];
} {
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const avgScore = totalScore / Object.keys(scores).length;

  const sortedDimensions = Object.entries(scores).sort(
    ([, a], [, b]) => b - a
  ) as [keyof DimensionScores, number][];

  const topStrengths = sortedDimensions.slice(0, 2).map(([key]) => key);
  const growthAreas = sortedDimensions.slice(-2).map(([key]) => key);

  let type = "balanced";
  let title = "Balanced Builder";
  let description = "You have a well-rounded approach to self-regulation.";

  if (avgScore >= 4) {
    type = "master";
    title = "Self-Regulation Master";
    description =
      "You demonstrate exceptional self-control and awareness. Your habits are likely strong and sustainable.";
  } else if (avgScore >= 3.5) {
    type = "strong";
    title = "Disciplined Achiever";
    description =
      "You have solid self-regulation skills. Focus on your growth areas to reach mastery.";
  } else if (avgScore >= 2.5) {
    type = "developing";
    title = "Growing Practitioner";
    description =
      "You're building self-regulation skills. Consistent practice will strengthen your foundations.";
  } else {
    type = "emerging";
    title = "Emerging Starter";
    description =
      "You're at the beginning of your self-regulation journey. Small, consistent steps will build momentum.";
  }

  return {
    type,
    title,
    description,
    strengths: topStrengths.map((k) => DIMENSION_LABELS[k]),
    growthAreas: growthAreas.map((k) => DIMENSION_LABELS[k]),
  };
}

export default function SelfRegulationTestScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();

  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [expandedDimension, setExpandedDimension] = useState<string | null>(
    null
  );

  const progress = Object.keys(answers).length / QUESTIONS.length;

  const dimensionScores = useMemo((): DimensionScores | null => {
    if (Object.keys(answers).length < QUESTIONS.length) return null;

    const scores: Record<string, { sum: number; count: number }> = {};

    QUESTIONS.forEach((q) => {
      if (!scores[q.dimension]) {
        scores[q.dimension] = { sum: 0, count: 0 };
      }
      scores[q.dimension].sum += answers[q.id] || 0;
      scores[q.dimension].count += 1;
    });

    return Object.fromEntries(
      Object.entries(scores).map(([key, val]) => [
        key,
        val.count > 0 ? val.sum / val.count : 0,
      ])
    ) as DimensionScores;
  }, [answers]);

  const profile = dimensionScores ? getProfileType(dimensionScores) : null;

  const handleAnswer = (questionId: number, value: number) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setAnswers((prev) => ({ ...prev, [questionId]: value }));

    if (currentQuestion < QUESTIONS.length - 1) {
      setTimeout(() => setCurrentQuestion(currentQuestion + 1), 300);
    }
  };

  const handleComplete = () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setShowResults(true);
  };

  const handleRetake = () => {
    setAnswers({});
    setCurrentQuestion(0);
    setShowResults(false);
  };

  if (showResults && dimensionScores && profile) {
    return (
      <ProGate feature="selfRegulationTest" featureName="Self-Regulation Test">
        <ThemedView style={styles.container}>
          <ScrollView
            contentContainerStyle={[
              styles.content,
              {
                paddingTop: headerHeight + Spacing.lg,
                paddingBottom: insets.bottom + Spacing.xl,
              },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View entering={FadeIn.duration(400)}>
              <Card style={styles.resultCard}>
                <View
                  style={[
                    styles.profileBadge,
                    { backgroundColor: `${EarthyColors.forestGreen}20` },
                  ]}
                >
                  <Feather
                    name="target"
                    size={32}
                    color={EarthyColors.forestGreen}
                  />
                </View>
                <ThemedText type="h2" style={styles.profileTitle}>
                  {profile.title}
                </ThemedText>
                <ThemedText
                  style={[
                    styles.profileDescription,
                    { color: theme.textSecondary },
                  ]}
                >
                  {profile.description}
                </ThemedText>
                <ThemedText
                  style={[
                    styles.testNote,
                    { color: theme.textSecondary, marginTop: Spacing.lg },
                  ]}
                >
                  You can retake this anytime to track your progress.
                </ThemedText>
              </Card>

              <ThemedText type="h4" style={styles.sectionTitle}>
                Your Strengths
              </ThemedText>
              <View style={styles.tagContainer}>
                {profile.strengths.map((s) => (
                  <View
                    key={s}
                    style={[
                      styles.tag,
                      { backgroundColor: `${EarthyColors.forestGreen}20` },
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.tagText,
                        { color: EarthyColors.forestGreen },
                      ]}
                    >
                      {s}
                    </ThemedText>
                  </View>
                ))}
              </View>

              <ThemedText type="h4" style={styles.sectionTitle}>
                Areas to Develop
              </ThemedText>
              <View style={styles.tagContainer}>
                {profile.growthAreas.map((g) => (
                  <Pressable
                    key={g}
                    onPress={() =>
                      setExpandedDimension(expandedDimension === g ? null : g)
                    }
                    style={[
                      styles.tag,
                      { backgroundColor: `${EarthyColors.copper}15` },
                    ]}
                  >
                    <View
                      style={{
                        flex: 1,
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <ThemedText
                        style={[styles.tagText, { color: EarthyColors.copper }]}
                      >
                        {g}
                      </ThemedText>
                      <Feather
                        name={
                          expandedDimension === g
                            ? "chevron-up"
                            : "chevron-down"
                        }
                        size={14}
                        color={EarthyColors.copper}
                      />
                    </View>
                    {expandedDimension === g && (
                      <ThemedText
                        style={[
                          styles.developmentTip,
                          { color: EarthyColors.copper, marginTop: Spacing.sm },
                        ]}
                      >
                        Focus on building consistency here. Small daily
                        practices strengthen this skill.
                      </ThemedText>
                    )}
                  </Pressable>
                ))}
              </View>

              <ThemedText type="h4" style={styles.sectionTitle}>
                Your Scores
              </ThemedText>
              <Card style={styles.dimensionsCard}>
                {Object.entries(dimensionScores).map(([key, score]) => (
                  <View key={key} style={styles.dimensionRow}>
                    <View style={styles.dimensionInfo}>
                      <Feather
                        name={
                          DIMENSION_ICONS[key as keyof DimensionScores] as any
                        }
                        size={16}
                        color={theme.textSecondary}
                      />
                      <ThemedText style={styles.dimensionLabel}>
                        {DIMENSION_LABELS[key as keyof DimensionScores]}
                      </ThemedText>
                    </View>
                    <View style={styles.dimensionBar}>
                      <View
                        style={[
                          styles.dimensionFill,
                          {
                            width: `${(score / 5) * 100}%`,
                            backgroundColor:
                              score >= 4
                                ? EarthyColors.forestGreen
                                : score >= 3
                                  ? EarthyColors.copper
                                  : EarthyColors.rust,
                          },
                        ]}
                      />
                    </View>
                    <ThemedText
                      style={[
                        styles.dimensionScore,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {score.toFixed(1)}
                    </ThemedText>
                  </View>
                ))}
              </Card>

              <View style={styles.buttonRow}>
                <Pressable
                  style={[styles.retakeButton, { borderColor: theme.border }]}
                  onPress={handleRetake}
                >
                  <Feather name="refresh-cw" size={18} color={theme.text} />
                  <ThemedText>Retake Test</ThemedText>
                </Pressable>
                <Pressable
                  style={[
                    styles.doneButton,
                    { backgroundColor: EarthyColors.forestGreen },
                  ]}
                  onPress={() => navigation.goBack()}
                >
                  <ThemedText style={{ color: "#fff", fontWeight: "600" }}>
                    Done
                  </ThemedText>
                </Pressable>
              </View>
            </Animated.View>
          </ScrollView>
        </ThemedView>
      </ProGate>
    );
  }

  const question = QUESTIONS[currentQuestion];
  const isComplete = Object.keys(answers).length === QUESTIONS.length;

  return (
    <ProGate feature="selfRegulationTest" featureName="Self-Regulation Test">
      <ThemedView style={styles.container}>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: headerHeight + Spacing.lg,
              paddingBottom: insets.bottom + Spacing.xl,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.introCard,
              { backgroundColor: `${EarthyColors.forestGreen}10` },
            ]}
          >
            <Feather
              name="clipboard"
              size={24}
              color={EarthyColors.forestGreen}
            />
            <ThemedText style={[styles.introText, { color: theme.text }]}>
              Answer honestly. This 12-question assessment reveals your
              self-regulation strengths and growth areas.
            </ThemedText>
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <ThemedText style={{ color: theme.textSecondary }}>
                Question {currentQuestion + 1} of {QUESTIONS.length}
              </ThemedText>
              <ThemedText style={{ color: theme.textSecondary }}>
                {Math.round(progress * 100)}%
              </ThemedText>
            </View>
            <View
              style={[styles.progressBar, { backgroundColor: theme.border }]}
            >
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${progress * 100}%`,
                    backgroundColor: EarthyColors.forestGreen,
                  },
                ]}
              />
            </View>
          </View>

          <Animated.View
            key={currentQuestion}
            entering={SlideInRight.duration(300)}
          >
            <Card style={styles.questionCard}>
              <ThemedText type="h4" style={styles.questionText}>
                {question.text}
              </ThemedText>

              <View style={styles.answersContainer}>
                {ANSWER_OPTIONS.map((option) => {
                  const selected = answers[question.id] === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      style={[
                        styles.answerOption,
                        {
                          backgroundColor: selected
                            ? `${EarthyColors.forestGreen}15`
                            : theme.backgroundSecondary,
                          borderColor: selected
                            ? EarthyColors.forestGreen
                            : theme.border,
                        },
                      ]}
                      onPress={() => handleAnswer(question.id, option.value)}
                    >
                      <View
                        style={[
                          styles.radio,
                          {
                            borderColor: selected
                              ? EarthyColors.forestGreen
                              : theme.border,
                            backgroundColor: selected
                              ? EarthyColors.forestGreen
                              : "transparent",
                          },
                        ]}
                      >
                        {selected ? <View style={styles.radioInner} /> : null}
                      </View>
                      <ThemedText
                        style={[
                          styles.answerLabel,
                          {
                            color: selected
                              ? EarthyColors.forestGreen
                              : theme.text,
                          },
                        ]}
                      >
                        {option.label}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            </Card>
          </Animated.View>

          <View style={styles.navRow}>
            <Pressable
              style={[styles.navButton, { borderColor: theme.border }]}
              onPress={() =>
                setCurrentQuestion(Math.max(0, currentQuestion - 1))
              }
              disabled={currentQuestion === 0}
            >
              <Feather
                name="chevron-left"
                size={20}
                color={currentQuestion === 0 ? theme.border : theme.text}
              />
            </Pressable>

            {isComplete ? (
              <Pressable
                style={[
                  styles.completeButton,
                  { backgroundColor: EarthyColors.forestGreen },
                ]}
                onPress={handleComplete}
              >
                <ThemedText style={{ color: "#fff", fontWeight: "600" }}>
                  See My Results
                </ThemedText>
                <Feather name="arrow-right" size={18} color="#fff" />
              </Pressable>
            ) : (
              <Pressable
                style={[styles.navButton, { borderColor: theme.border }]}
                onPress={() =>
                  setCurrentQuestion(
                    Math.min(QUESTIONS.length - 1, currentQuestion + 1)
                  )
                }
                disabled={currentQuestion === QUESTIONS.length - 1}
              >
                <Feather
                  name="chevron-right"
                  size={20}
                  color={
                    currentQuestion === QUESTIONS.length - 1
                      ? theme.border
                      : theme.text
                  }
                />
              </Pressable>
            )}
          </View>
        </ScrollView>
      </ThemedView>
    </ProGate>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  introCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  introText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
  },
  progressSection: {
    marginBottom: Spacing.lg,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  questionCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  questionText: {
    marginBottom: Spacing.lg,
    lineHeight: 26,
  },
  answersContainer: {
    gap: Spacing.sm,
  },
  answerOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    gap: Spacing.md,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#fff",
  },
  answerLabel: {
    fontSize: 15,
  },
  navRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Spacing.md,
  },
  navButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  completeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    height: 48,
    borderRadius: 24,
  },
  resultCard: {
    padding: Spacing.xl,
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  profileBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  profileTitle: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  profileDescription: {
    textAlign: "center",
    lineHeight: 22,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  tag: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  tagText: {
    fontSize: 14,
    fontWeight: "500",
  },
  dimensionsCard: {
    padding: Spacing.lg,
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  testNote: {
    fontSize: 13,
  },
  developmentTip: {
    fontSize: 12,
  },
  dimensionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  dimensionInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    width: 130,
  },
  dimensionLabel: {
    fontSize: 13,
  },
  dimensionBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#e5e5e5",
    overflow: "hidden",
  },
  dimensionFill: {
    height: "100%",
    borderRadius: 4,
  },
  dimensionScore: {
    width: 32,
    textAlign: "right",
    fontSize: 13,
    fontWeight: "600",
  },
  buttonRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  retakeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    height: 48,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  doneButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    borderRadius: BorderRadius.sm,
  },
});

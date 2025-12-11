import React, { useState, useEffect } from "react";
import { View, StyleSheet, Modal, Pressable, ScrollView, TextInput } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeIn, FadeOut, SlideInRight, SlideOutLeft } from "react-native-reanimated";
import { ThemedText } from "./ThemedText";
import { Button } from "./Button";
import { Card } from "./Card";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";

interface ChurnPreventionModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirmDelete: () => void;
  streakCount?: number;
  checkInsCount?: number;
}

const CONCERNS = [
  { id: "hard", label: "Too hard to keep up", icon: "trending-down" as const },
  { id: "forget", label: "I keep forgetting", icon: "bell-off" as const },
  { id: "busy", label: "Life got busy", icon: "clock" as const },
  { id: "features", label: "Missing features I need", icon: "tool" as const },
  { id: "other", label: "Something else", icon: "help-circle" as const },
];

const SCIENCE_FACTS = [
  {
    title: "The 66-Day Truth",
    description: "Research shows habits take an average of 66 days to form. Most people quit at day 21, just when the brain is starting to rewire.",
    icon: "cpu",
    source: "University College London",
  },
  {
    title: "Loss Aversion is Real",
    description: "Your brain weighs losses 2x more than gains. Breaking a streak feels worse than starting one feels good. Use this psychology to your advantage.",
    icon: "alert-triangle",
    source: "Kahneman & Tversky",
  },
  {
    title: "The Compound Effect",
    description: "Small daily actions compound exponentially. 1% better each day = 37x better in a year. Your streak is building something bigger than you see.",
    icon: "trending-up",
    source: "Darren Hardy",
  },
  {
    title: "Identity Shapes Behavior",
    description: "Every check-in is a vote for the person you want to become. You're not just tracking habits, you're building proof of who you are.",
    icon: "user-check",
    source: "James Clear, Atomic Habits",
  },
];

export function ChurnPreventionModal({
  visible,
  onClose,
  onConfirmDelete,
  streakCount = 0,
  checkInsCount = 0,
}: ChurnPreventionModalProps) {
  const { theme } = useTheme();
  const [step, setStep] = useState(1);
  const [selectedConcern, setSelectedConcern] = useState<string | null>(null);
  const [exitSurveyQuestions, setExitSurveyQuestions] = useState<string[]>([]);
  const [surveyAnswers, setSurveyAnswers] = useState<string[]>([]);
  const [surveyFailed, setSurveyFailed] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchExitSurvey();
    }
  }, [visible]);

  const fetchExitSurvey = async () => {
    try {
      const url = new URL("/api/account/exit-survey", getApiUrl());
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch survey");
      const data = await res.json();
      setExitSurveyQuestions(data.questions || []);
      setSurveyAnswers(new Array(data.questions?.length || 0).fill(""));
      setSurveyFailed(false);
    } catch {
      setSurveyFailed(true);
      setExitSurveyQuestions([]);
      setSurveyAnswers([]);
    }
  };

  const updateSurveyAnswer = (index: number, value: string) => {
    const newAnswers = [...surveyAnswers];
    newAnswers[index] = value;
    setSurveyAnswers(newAnswers);
  };

  const handleClose = () => {
    setStep(1);
    setSelectedConcern(null);
    setSurveyAnswers([]);
    onClose();
  };

  const handleContinueToScience = () => {
    setStep(2);
  };

  const handleStillWantToLeave = () => {
    setStep(3);
  };

  const handleConfirmDelete = async () => {
    if (!surveyFailed && exitSurveyQuestions.length > 0) {
      try {
        const url = new URL("/api/account/exit-survey", getApiUrl());
        await fetch(url.toString(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            concern: selectedConcern,
            answers: surveyAnswers,
          }),
        });
      } catch {
      }
    }
    setStep(1);
    setSelectedConcern(null);
    setSurveyAnswers([]);
    onConfirmDelete();
  };

  const renderStep1 = () => (
    <Animated.View entering={FadeIn} exiting={SlideOutLeft} style={styles.stepContainer}>
      <View style={styles.header}>
        <View style={[styles.iconCircle, { backgroundColor: `${theme.primary}20` }]}>
          <Feather name="heart" size={32} color={theme.primary} />
        </View>
        <ThemedText type="h3" style={styles.title}>
          This isn't working out?
        </ThemedText>
        <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
          We hear you. Building habits is hard. Before you go, help us understand what's happening.
        </ThemedText>
      </View>

      <View style={styles.concernsList}>
        {CONCERNS.map((concern) => (
          <Pressable
            key={concern.id}
            style={[
              styles.concernItem,
              {
                borderColor: selectedConcern === concern.id ? theme.primary : theme.border,
                backgroundColor: selectedConcern === concern.id ? `${theme.primary}10` : theme.backgroundDefault,
              },
            ]}
            onPress={() => setSelectedConcern(concern.id)}
          >
            <Feather
              name={concern.icon}
              size={20}
              color={selectedConcern === concern.id ? theme.primary : theme.textSecondary}
            />
            <ThemedText style={styles.concernLabel}>{concern.label}</ThemedText>
            {selectedConcern === concern.id ? (
              <Feather name="check-circle" size={20} color={theme.primary} />
            ) : null}
          </Pressable>
        ))}
      </View>

      <View style={styles.actions}>
        <Button
          onPress={handleContinueToScience}
          disabled={!selectedConcern}
          style={styles.flexButton}
        >
          Let's talk about it
        </Button>
        <Pressable
          style={[styles.secondaryButton, { borderColor: theme.border }]}
          onPress={handleClose}
        >
          <ThemedText style={[styles.secondaryButtonText, { color: theme.text }]}>
            Never mind
          </ThemedText>
        </Pressable>
      </View>
    </Animated.View>
  );

  const renderStep2 = () => (
    <Animated.View entering={SlideInRight} exiting={SlideOutLeft} style={styles.stepContainer}>
      <View style={styles.header}>
        <View style={[styles.iconCircle, { backgroundColor: `${theme.accent}20` }]}>
          <Feather name="zap" size={32} color={theme.accent} />
        </View>
        <ThemedText type="h3" style={styles.title}>
          The science says: don't quit yet
        </ThemedText>
        <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
          Your brain is designed to make this hard. Here's what research tells us about building lasting habits.
        </ThemedText>
      </View>

      <ScrollView style={styles.scienceScroll} showsVerticalScrollIndicator={false}>
        {SCIENCE_FACTS.map((fact, index) => (
          <Card key={index} style={styles.scienceCard}>
            <View style={[styles.scienceIcon, { backgroundColor: `${theme.primary}15` }]}>
              <Feather name={fact.icon as any} size={20} color={theme.primary} />
            </View>
            <View style={styles.scienceContent}>
              <ThemedText style={styles.scienceTitle}>{fact.title}</ThemedText>
              <ThemedText style={[styles.scienceDescription, { color: theme.textSecondary }]}>
                {fact.description}
              </ThemedText>
              <ThemedText style={[styles.scienceSource, { color: theme.textSecondary, opacity: 0.7 }]}>
                {fact.source}
              </ThemedText>
            </View>
          </Card>
        ))}
      </ScrollView>

      {(streakCount > 0 || checkInsCount > 0) ? (
        <Card style={{ ...styles.statsReminder, backgroundColor: `${theme.primary}10` }}>
          <Feather name="award" size={24} color={theme.primary} />
          <View style={styles.statsText}>
            <ThemedText style={styles.statsLabel}>You've built something here</ThemedText>
            <ThemedText style={[styles.statsValue, { color: theme.textSecondary }]}>
              {checkInsCount} check-ins{streakCount > 0 ? ` and a ${streakCount}-day streak` : ""}
            </ThemedText>
          </View>
        </Card>
      ) : null}

      <View style={styles.actions}>
        <Button onPress={handleClose} style={styles.flexButton}>
          Give it another shot
        </Button>
        <Pressable
          style={[styles.secondaryButton, { borderColor: theme.border }]}
          onPress={handleStillWantToLeave}
        >
          <ThemedText style={[styles.secondaryButtonText, { color: theme.text }]}>
            I still want to leave
          </ThemedText>
        </Pressable>
      </View>
    </Animated.View>
  );

  const renderStep3 = () => (
    <Animated.View entering={SlideInRight} exiting={FadeOut} style={styles.stepContainer}>
      <View style={styles.header}>
        <View style={[styles.iconCircle, { backgroundColor: `${theme.error}20` }]}>
          <Feather name="alert-circle" size={32} color={theme.error} />
        </View>
        <ThemedText type="h3" style={styles.title}>
          Are you absolutely sure?
        </ThemedText>
        <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
          This action cannot be undone. All your data, streaks, and progress will be permanently deleted.
        </ThemedText>
      </View>

      {!surveyFailed && exitSurveyQuestions.length > 0 ? (
        <ScrollView style={styles.surveyScroll} showsVerticalScrollIndicator={false}>
          <ThemedText style={[styles.surveyLabel, { color: theme.textSecondary }]}>
            Before you go, help us improve (optional):
          </ThemedText>
          {exitSurveyQuestions.map((question, idx) => (
            <View key={idx} style={styles.surveyQuestion}>
              <ThemedText style={styles.surveyQuestionText}>{question}</ThemedText>
              <TextInput
                style={[
                  styles.surveyInput,
                  {
                    backgroundColor: theme.backgroundDefault,
                    borderColor: theme.border,
                    color: theme.text,
                  },
                ]}
                value={surveyAnswers[idx] || ""}
                onChangeText={(text) => updateSurveyAnswer(idx, text)}
                placeholder="Your thoughts..."
                placeholderTextColor={theme.textSecondary}
                multiline
              />
            </View>
          ))}
        </ScrollView>
      ) : null}

      <Card style={{ ...styles.warningCard, borderColor: theme.error }}>
        <ThemedText style={[styles.warningTitle, { color: theme.error }]}>
          You will lose:
        </ThemedText>
        <View style={styles.warningList}>
          <View style={styles.warningItem}>
            <Feather name="x-circle" size={16} color={theme.error} />
            <ThemedText style={[styles.warningText, { color: theme.textSecondary }]}>
              All your commitments and check-ins
            </ThemedText>
          </View>
          <View style={styles.warningItem}>
            <Feather name="x-circle" size={16} color={theme.error} />
            <ThemedText style={[styles.warningText, { color: theme.textSecondary }]}>
              Your streak history and statistics
            </ThemedText>
          </View>
          <View style={styles.warningItem}>
            <Feather name="x-circle" size={16} color={theme.error} />
            <ThemedText style={[styles.warningText, { color: theme.textSecondary }]}>
              Any uploaded photos and notes
            </ThemedText>
          </View>
        </View>
      </Card>

      <View style={styles.actions}>
        <Button onPress={handleClose} style={styles.flexButton}>
          Keep my account
        </Button>
        <Pressable
          style={[styles.deleteButton, { borderColor: theme.error }]}
          onPress={handleConfirmDelete}
        >
          <Feather name="trash-2" size={18} color={theme.error} />
          <ThemedText style={[styles.deleteButtonText, { color: theme.error }]}>
            Delete forever
          </ThemedText>
        </Pressable>
      </View>
    </Animated.View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: theme.backgroundDefault }]}>
          <Pressable style={styles.closeButton} onPress={handleClose}>
            <Feather name="x" size={24} color={theme.textSecondary} />
          </Pressable>

          <View style={styles.progress}>
            {[1, 2, 3].map((s) => (
              <View
                key={s}
                style={[
                  styles.progressDot,
                  {
                    backgroundColor: s <= step ? theme.primary : theme.border,
                    width: s === step ? 24 : 8,
                  },
                ]}
              />
            ))}
          </View>

          {step === 1 ? renderStep1() : null}
          {step === 2 ? renderStep2() : null}
          {step === 3 ? renderStep3() : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  container: {
    width: "100%",
    maxWidth: 440,
    maxHeight: "90%",
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
  },
  closeButton: {
    position: "absolute",
    top: Spacing.md,
    right: Spacing.md,
    zIndex: 10,
    padding: Spacing.xs,
  },
  progress: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  progressDot: {
    height: 8,
    borderRadius: 4,
  },
  stepContainer: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  title: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  subtitle: {
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
  },
  concernsList: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  concernItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.md,
  },
  concernLabel: {
    flex: 1,
    fontSize: 15,
  },
  actions: {
    gap: Spacing.sm,
    marginTop: "auto",
  },
  flexButton: {
    flex: 1,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  scienceScroll: {
    maxHeight: 280,
    marginBottom: Spacing.md,
  },
  scienceCard: {
    flexDirection: "row",
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  scienceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  scienceContent: {
    flex: 1,
  },
  scienceTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  scienceDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  scienceSource: {
    fontSize: 11,
    fontStyle: "italic",
  },
  statsReminder: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
    borderWidth: 0,
  },
  statsText: {
    flex: 1,
  },
  statsLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  statsValue: {
    fontSize: 13,
    marginTop: 2,
  },
  warningCard: {
    padding: Spacing.lg,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  warningTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  warningList: {
    gap: Spacing.sm,
  },
  warningItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  warningText: {
    fontSize: 14,
    flex: 1,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  surveyScroll: {
    maxHeight: 200,
    marginBottom: Spacing.md,
  },
  surveyLabel: {
    fontSize: 13,
    marginBottom: Spacing.md,
  },
  surveyQuestion: {
    marginBottom: Spacing.md,
  },
  surveyQuestionText: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: Spacing.xs,
  },
  surveyInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: "top",
  },
});

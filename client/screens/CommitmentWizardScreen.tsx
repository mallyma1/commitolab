import React, { useState, useMemo } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
} from "react-native";
import Animated, {
  FadeIn,
  SlideInRight,
  SlideOutLeft,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, EarthyColors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import {
  CommitmentTemplate,
  getRecommendedTemplates,
  commitmentTemplates,
} from "@/lib/commitment-templates";
import { useCreateCommitment } from "@/hooks/useCommitments";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";

const PROOF_MODES = [
  {
    id: "none",
    label: "No proof needed",
    description: "Just confirm completion",
  },
  {
    id: "note_only",
    label: "Note required",
    description: "Write a reflection",
  },
  {
    id: "photo_optional",
    label: "Photo optional",
    description: "Add visual proof if you want",
  },
  {
    id: "photo_required",
    label: "Photo required",
    description: "Build identity through visible proof",
  },
];

const ACCOUNTABILITY_LEVELS = [
  { id: "soft", label: "Soft", description: "Gentle reminders, flexible" },
  {
    id: "standard",
    label: "Standard",
    description: "Regular check-ins, balanced",
  },
  {
    id: "strict",
    label: "Strict",
    description: "Strong accountability, no excuses",
  },
];

const CADENCES = [
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
];

interface WizardData {
  templateId: string | null;
  title: string;
  description: string;
  category: string;
  cadence: string;
  proofMode: string;
  accountabilityLevel: string;
  startToday: boolean;
  duration: number;
}

export default function CommitmentWizardScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user } = useAuth();
  const createCommitment = useCreateCommitment();

  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>({
    templateId: null,
    title: "",
    description: "",
    category: "personal_improvement",
    cadence: "daily",
    proofMode: "photo_optional",
    accountabilityLevel: "standard",
    startToday: true,
    duration: 30,
  });

  const recommendedTemplates = useMemo(() => {
    if (!user) return commitmentTemplates.slice(0, 6);
    return getRecommendedTemplates(
      user.focusArea || "mind",
      user.motivations || []
    );
  }, [user]);

  const handleSelectTemplate = (template: CommitmentTemplate | null) => {
    if (template) {
      setData({
        ...data,
        templateId: template.id,
        title: template.title,
        description: template.description,
        category: template.category,
        cadence: template.suggestedCadence,
        proofMode: template.suggestedProofMode,
        duration: template.duration,
      });
    } else {
      setData({
        ...data,
        templateId: null,
        title: "",
        description: "",
      });
    }
    setStep(1);
  };

  const handleNext = () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      handleCreate();
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleCreate = async () => {
    const today = new Date();
    const startDate = data.startToday
      ? today.toISOString().split("T")[0]
      : new Date(today.getTime() + 86400000).toISOString().split("T")[0];
    const endDate = new Date(
      new Date(startDate).getTime() + data.duration * 86400000
    )
      .toISOString()
      .split("T")[0];

    try {
      await createCommitment.mutateAsync({
        title: data.title,
        description: data.description,
        category: data.category,
        cadence: data.cadence,
        startDate,
        endDate,
        proofMode: data.proofMode,
        accountabilityLevel: data.accountabilityLevel,
        templateId: data.templateId,
      });
      navigation.goBack();
    } catch (error) {
      console.error("Failed to create commitment:", error);
    }
  };

  const canContinue = () => {
    switch (step) {
      case 0:
        return true;
      case 1:
        return data.title.trim().length > 0;
      case 2:
        return true;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <Animated.View
            entering={FadeIn.duration(300)}
            style={styles.stepContainer}
          >
            <ThemedText type="h3" style={styles.stepTitle}>
              Choose your streak
            </ThemedText>
            <ThemedText
              style={[styles.stepSubtitle, { color: theme.textSecondary }]}
            >
              Based on your profile, we recommend these:
            </ThemedText>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.templatesGrid}>
                {recommendedTemplates.map((template) => (
                  <Pressable
                    key={template.id}
                    style={[
                      styles.templateCard,
                      {
                        backgroundColor: theme.backgroundSecondary,
                        borderColor: theme.border,
                      },
                    ]}
                    onPress={() => handleSelectTemplate(template)}
                  >
                    <ThemedText type="h4" numberOfLines={1}>
                      {template.title}
                    </ThemedText>
                    <ThemedText
                      style={[
                        styles.templateDesc,
                        { color: theme.textSecondary },
                      ]}
                      numberOfLines={2}
                    >
                      {template.description}
                    </ThemedText>
                    <View style={styles.templateMeta}>
                      <View
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
                          {template.suggestedCadence}
                        </ThemedText>
                      </View>
                    </View>
                  </Pressable>
                ))}
                <Pressable
                  style={[
                    styles.templateCard,
                    styles.customCard,
                    {
                      backgroundColor: theme.backgroundTertiary,
                      borderColor: theme.border,
                    },
                  ]}
                  onPress={() => handleSelectTemplate(null)}
                >
                  <Feather name="plus" size={24} color={theme.primary} />
                  <ThemedText type="h4">Custom streak</ThemedText>
                  <ThemedText
                    style={[
                      styles.templateDesc,
                      { color: theme.textSecondary },
                    ]}
                  >
                    Create your own commitment
                  </ThemedText>
                </Pressable>
              </View>
            </ScrollView>
          </Animated.View>
        );

      case 1:
        return (
          <Animated.View
            entering={SlideInRight.duration(300)}
            exiting={SlideOutLeft.duration(200)}
            style={styles.stepContainer}
          >
            <KeyboardAwareScrollViewCompat showsVerticalScrollIndicator={false}>
              <ThemedText type="h3" style={styles.stepTitle}>
                Customize your streak
              </ThemedText>

              <View style={styles.formGroup}>
                <ThemedText style={styles.label}>Title</ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.backgroundSecondary,
                      color: theme.text,
                      borderColor: theme.border,
                    },
                  ]}
                  value={data.title}
                  onChangeText={(text) => setData({ ...data, title: text })}
                  placeholder="e.g., Morning meditation"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>

              <View style={styles.formGroup}>
                <ThemedText style={styles.label}>
                  Description (optional)
                </ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    styles.textArea,
                    {
                      backgroundColor: theme.backgroundSecondary,
                      color: theme.text,
                      borderColor: theme.border,
                    },
                  ]}
                  value={data.description}
                  onChangeText={(text) =>
                    setData({ ...data, description: text })
                  }
                  placeholder="What will you do?"
                  placeholderTextColor={theme.textSecondary}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.formGroup}>
                <ThemedText style={styles.label}>How often?</ThemedText>
                <View style={styles.cadenceRow}>
                  {CADENCES.map((cadence) => (
                    <Pressable
                      key={cadence.id}
                      style={[
                        styles.cadenceChip,
                        {
                          backgroundColor:
                            data.cadence === cadence.id
                              ? EarthyColors.terraBrown
                              : theme.backgroundSecondary,
                          borderColor:
                            data.cadence === cadence.id
                              ? EarthyColors.terraBrown
                              : theme.border,
                        },
                      ]}
                      onPress={() => setData({ ...data, cadence: cadence.id })}
                    >
                      <ThemedText
                        style={{
                          color:
                            data.cadence === cadence.id ? "#fff" : theme.text,
                        }}
                      >
                        {cadence.label}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <ThemedText style={styles.label}>Proof type</ThemedText>
                {PROOF_MODES.map((mode) => (
                  <Pressable
                    key={mode.id}
                    style={[
                      styles.listOption,
                      {
                        backgroundColor:
                          data.proofMode === mode.id
                            ? `${EarthyColors.terraBrown}15`
                            : theme.backgroundSecondary,
                        borderColor:
                          data.proofMode === mode.id
                            ? EarthyColors.terraBrown
                            : theme.border,
                      },
                    ]}
                    onPress={() => setData({ ...data, proofMode: mode.id })}
                  >
                    <View>
                      <ThemedText>{mode.label}</ThemedText>
                      <ThemedText
                        style={[
                          styles.optionDesc,
                          { color: theme.textSecondary },
                        ]}
                      >
                        {mode.description}
                      </ThemedText>
                    </View>
                    {data.proofMode === mode.id ? (
                      <Feather
                        name="check"
                        size={20}
                        color={EarthyColors.terraBrown}
                      />
                    ) : null}
                  </Pressable>
                ))}
              </View>

              <View style={styles.formGroup}>
                <ThemedText style={styles.label}>Start</ThemedText>
                <View style={styles.cadenceRow}>
                  <Pressable
                    style={[
                      styles.cadenceChip,
                      {
                        backgroundColor: data.startToday
                          ? EarthyColors.forestGreen
                          : theme.backgroundSecondary,
                        borderColor: data.startToday
                          ? EarthyColors.forestGreen
                          : theme.border,
                      },
                    ]}
                    onPress={() => setData({ ...data, startToday: true })}
                  >
                    <ThemedText
                      style={{ color: data.startToday ? "#fff" : theme.text }}
                    >
                      Today
                    </ThemedText>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.cadenceChip,
                      {
                        backgroundColor: !data.startToday
                          ? EarthyColors.forestGreen
                          : theme.backgroundSecondary,
                        borderColor: !data.startToday
                          ? EarthyColors.forestGreen
                          : theme.border,
                      },
                    ]}
                    onPress={() => setData({ ...data, startToday: false })}
                  >
                    <ThemedText
                      style={{ color: !data.startToday ? "#fff" : theme.text }}
                    >
                      Tomorrow
                    </ThemedText>
                  </Pressable>
                </View>
              </View>
            </KeyboardAwareScrollViewCompat>
          </Animated.View>
        );

      case 2:
        return (
          <Animated.View
            entering={SlideInRight.duration(300)}
            exiting={SlideOutLeft.duration(200)}
            style={styles.stepContainer}
          >
            <ThemedText type="h3" style={styles.stepTitle}>
              Set your accountability
            </ThemedText>
            <ThemedText
              style={[styles.stepSubtitle, { color: theme.textSecondary }]}
            >
              How much structure do you want?
            </ThemedText>

            <View style={styles.accountabilityGrid}>
              {ACCOUNTABILITY_LEVELS.map((level) => (
                <Pressable
                  key={level.id}
                  style={[
                    styles.accountabilityCard,
                    {
                      backgroundColor:
                        data.accountabilityLevel === level.id
                          ? EarthyColors.copper
                          : theme.backgroundSecondary,
                      borderColor:
                        data.accountabilityLevel === level.id
                          ? EarthyColors.copper
                          : theme.border,
                    },
                  ]}
                  onPress={() =>
                    setData({ ...data, accountabilityLevel: level.id })
                  }
                >
                  <ThemedText
                    type="h4"
                    style={{
                      color:
                        data.accountabilityLevel === level.id
                          ? "#fff"
                          : theme.text,
                    }}
                  >
                    {level.label}
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.accountabilityDesc,
                      {
                        color:
                          data.accountabilityLevel === level.id
                            ? "rgba(255,255,255,0.8)"
                            : theme.textSecondary,
                      },
                    ]}
                  >
                    {level.description}
                  </ThemedText>
                </Pressable>
              ))}
            </View>

            <View
              style={[
                styles.summaryCard,
                { backgroundColor: theme.backgroundSecondary },
              ]}
            >
              <ThemedText type="h4" style={styles.summaryTitle}>
                Summary
              </ThemedText>
              <View style={styles.summaryRow}>
                <ThemedText style={{ color: theme.textSecondary }}>
                  Streak:
                </ThemedText>
                <ThemedText>{data.title || "Custom streak"}</ThemedText>
              </View>
              <View style={styles.summaryRow}>
                <ThemedText style={{ color: theme.textSecondary }}>
                  Cadence:
                </ThemedText>
                <ThemedText style={{ textTransform: "capitalize" }}>
                  {data.cadence}
                </ThemedText>
              </View>
              <View style={styles.summaryRow}>
                <ThemedText style={{ color: theme.textSecondary }}>
                  Proof:
                </ThemedText>
                <ThemedText>
                  {PROOF_MODES.find((m) => m.id === data.proofMode)?.label}
                </ThemedText>
              </View>
              <View style={styles.summaryRow}>
                <ThemedText style={{ color: theme.textSecondary }}>
                  Accountability:
                </ThemedText>
                <ThemedText style={{ textTransform: "capitalize" }}>
                  {data.accountabilityLevel}
                </ThemedText>
              </View>
            </View>
          </Animated.View>
        );

      default:
        return null;
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + Spacing.md,
            paddingBottom: insets.bottom + Spacing.lg,
          },
        ]}
      >
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color={theme.text} />
          </Pressable>
          <View style={styles.progressContainer}>
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                style={[
                  styles.progressDot,
                  {
                    backgroundColor:
                      i <= step ? EarthyColors.terraBrown : theme.border,
                    width: i === step ? 24 : 8,
                  },
                ]}
              />
            ))}
          </View>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.stepContent}>{renderStep()}</View>

        {step > 0 ? (
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
              disabled={!canContinue() || createCommitment.isPending}
            >
              <ThemedText style={styles.continueText}>
                {step === 2 ? "Create Streak" : "Continue"}
              </ThemedText>
              <Feather
                name={step === 2 ? "check" : "arrow-right"}
                size={20}
                color="#fff"
              />
            </Pressable>
          </View>
        ) : null}
      </View>
    </ThemedView>
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
    alignItems: "center",
    gap: 6,
  },
  progressDot: {
    height: 8,
    borderRadius: 4,
  },
  stepContent: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    marginBottom: Spacing.sm,
  },
  stepSubtitle: {
    marginBottom: Spacing.lg,
  },
  templatesGrid: {
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  templateCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  customCard: {
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.xl,
  },
  templateDesc: {
    fontSize: 14,
    marginTop: Spacing.xs,
  },
  templateMeta: {
    flexDirection: "row",
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  tag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  formGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  input: {
    height: 52,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    paddingTop: Spacing.md,
    textAlignVertical: "top",
  },
  cadenceRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  cadenceChip: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignItems: "center",
  },
  listOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  optionDesc: {
    fontSize: 13,
    marginTop: 2,
  },
  accountabilityGrid: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  accountabilityCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  accountabilityDesc: {
    marginTop: Spacing.xs,
  },
  summaryCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  summaryTitle: {
    marginBottom: Spacing.md,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
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

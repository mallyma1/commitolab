import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useOnboardingContext } from "../OnboardingContext";
import type {
  CommitmentRecommendation,
  OnboardingPayload,
  HabitProfileSummary,
} from "@/shared/onboardingTypes";

type OnboardingCompleteData = {
  payload: OnboardingPayload;
  summary: HabitProfileSummary | null;
  recommendations: CommitmentRecommendation[];
  selectedRecommendations: CommitmentRecommendation[];
};

type Props = {
  navigation: any;
  onComplete: (data: OnboardingCompleteData) => void;
};

export function RecommendationsScreen({ navigation, onComplete }: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const {
    payload,
    summary,
    recommendations,
    aiLoading,
    recommendationsSource,
    aiTimedOut,
    aiError,
    prefetchAI,
  } = useOnboardingContext();
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (recommendations.length > 0 && selectedIds.size === 0) {
      const allSelected = new Set(recommendations.map((_, idx) => idx));
      setSelectedIds(allSelected);
    }
  }, [recommendations, selectedIds.size]);

  const toggleSelection = (idx: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(idx)) {
      newSet.delete(idx);
    } else {
      newSet.add(idx);
    }
    setSelectedIds(newSet);
  };

  if (!summary) {
    return (
      <View
        style={[
          styles.container,
          styles.centered,
          { backgroundColor: theme.backgroundRoot, paddingTop: insets.top },
        ]}
      >
        <ThemedText style={[styles.errorText, { color: theme.textSecondary }]}>
          Missing profile summary
        </ThemedText>
        <Pressable
          style={[styles.retryButton, { borderColor: theme.border }]}
          onPress={() => navigation.goBack()}
        >
          <ThemedText>Go back</ThemedText>
        </Pressable>
      </View>
    );
  }

  if (recommendations.length === 0) {
    return (
      <View
        style={[
          styles.container,
          styles.centered,
          { backgroundColor: theme.backgroundRoot, paddingTop: insets.top },
        ]}
      >
        <ActivityIndicator size="large" color={theme.primary} />
        <ThemedText
          style={[styles.loadingText, { color: theme.textSecondary }]}
        >
          Preparing starter streaks for you...
        </ThemedText>
      </View>
    );
  }

  const isUsingFallback = recommendationsSource !== "server";
  const isRefining = aiLoading && recommendations.length > 0;

  const cadenceIcon = (cadence: string) => {
    return cadence === "daily" ? "calendar" : "repeat";
  };

  const proofLabel = (mode: string) => {
    switch (mode) {
      case "photo_required":
        return "Photo required";
      case "photo_optional":
        return "Photo optional";
      case "tick_only":
        return "Tick to check in";
      default:
        return "No proof needed";
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.backgroundRoot,
          paddingTop: insets.top + Spacing.lg,
        },
      ]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText type="h2" style={styles.heading}>
          Your Starter Commitments
        </ThemedText>
        <ThemedText style={[styles.subheading, { color: theme.textSecondary }]}>
          Tap to select the ones you want to start with. You can add more later.
        </ThemedText>

        {(isRefining || isUsingFallback) && (
          <View
            style={[
              styles.notice,
              {
                backgroundColor: theme.backgroundSecondary,
                borderColor: theme.border,
              },
            ]}
          >
            <ThemedText style={[styles.noticeTitle, { color: theme.text }]}>
              Starter picks are ready
            </ThemedText>
            <ThemedText
              style={[styles.noticeText, { color: theme.textSecondary }]}
            >
              We will swap in AI-tuned recommendations as soon as they finish.
            </ThemedText>
          </View>
        )}

        {(aiTimedOut || aiError) && (
          <View
            style={[
              styles.notice,
              {
                backgroundColor: theme.backgroundSecondary,
                borderColor: theme.border,
              },
            ]}
          >
            <ThemedText style={[styles.noticeTitle, { color: theme.text }]}>
              Still using quick picks
            </ThemedText>
            <ThemedText
              style={[styles.noticeText, { color: theme.textSecondary }]}
            >
              {aiError === "Request timed out" || aiTimedOut
                ? "This took longer than expected. You can continue with these picks or try again."
                : "Could not enhance these picks. You can continue or retry."}
            </ThemedText>
            <Pressable
              style={[
                styles.retryButton,
                {
                  borderColor: theme.border,
                  opacity: aiLoading ? 0.5 : 1,
                },
              ]}
              onPress={() => !aiLoading && prefetchAI(payload)}
              disabled={aiLoading}
            >
              {aiLoading ? (
                <ActivityIndicator size="small" color={theme.text} />
              ) : (
                <ThemedText>Retry AI now</ThemedText>
              )}
            </Pressable>
          </View>
        )}

        <View style={styles.recList}>
          {recommendations.map((rec, idx) => {
            const selected = selectedIds.has(idx);
            return (
              <Pressable
                key={idx}
                onPress={() => toggleSelection(idx)}
                style={[
                  styles.recCard,
                  {
                    backgroundColor: selected
                      ? theme.primary + "10"
                      : theme.backgroundDefault,
                    borderColor: selected ? theme.primary : theme.border,
                  },
                ]}
              >
                <View style={styles.recHeader}>
                  <View
                    style={[
                      styles.checkbox,
                      {
                        backgroundColor: selected
                          ? theme.primary
                          : "transparent",
                        borderColor: selected ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    {selected ? (
                      <Feather name="check" size={14} color="#fff" />
                    ) : null}
                  </View>
                  <ThemedText style={styles.recTitle}>{rec.title}</ThemedText>
                </View>
                <ThemedText
                  style={[styles.recDesc, { color: theme.textSecondary }]}
                >
                  {rec.short_description}
                </ThemedText>
                <View style={styles.recMeta}>
                  <View style={styles.metaItem}>
                    <Feather
                      name={cadenceIcon(rec.cadence)}
                      size={14}
                      color={theme.textSecondary}
                    />
                    <ThemedText
                      style={[styles.metaText, { color: theme.textSecondary }]}
                    >
                      {rec.cadence.charAt(0).toUpperCase() +
                        rec.cadence.slice(1)}
                    </ThemedText>
                  </View>
                  <View style={styles.metaItem}>
                    <Feather
                      name="camera"
                      size={14}
                      color={theme.textSecondary}
                    />
                    <ThemedText
                      style={[styles.metaText, { color: theme.textSecondary }]}
                    >
                      {proofLabel(rec.proof_mode)}
                    </ThemedText>
                  </View>
                </View>
                <ThemedText
                  style={[styles.recReason, { color: theme.textSecondary }]}
                >
                  {rec.reason}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          style={[
            styles.primaryButton,
            {
              backgroundColor:
                selectedIds.size > 0 ? theme.primary : theme.border,
            },
          ]}
          onPress={() => {
            const selectedRecs = recommendations.filter((_, idx) =>
              selectedIds.has(idx)
            );
            onComplete({
              payload,
              summary,
              recommendations,
              selectedRecommendations: selectedRecs,
            });
          }}
          disabled={selectedIds.size === 0}
        >
          <ThemedText style={styles.primaryButtonText}>
            Confirm and start ({selectedIds.size})
          </ThemedText>
          <Feather name="zap" size={20} color="#fff" />
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    flexGrow: 1,
  },
  heading: {
    marginBottom: Spacing.sm,
  },
  subheading: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 14,
  },
  notice: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  noticeText: {
    marginTop: Spacing.xs,
    fontSize: 12,
    lineHeight: 18,
  },
  errorText: {
    marginTop: Spacing.md,
    fontSize: 14,
    textAlign: "center",
  },
  retryButton: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  recList: {
    gap: Spacing.md,
  },
  recCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
  },
  recHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  recTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
  },
  recDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: Spacing.sm,
    marginLeft: 40,
  },
  recMeta: {
    flexDirection: "row",
    gap: Spacing.lg,
    marginLeft: 40,
    marginBottom: Spacing.sm,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
  },
  recReason: {
    fontSize: 12,
    fontStyle: "italic",
    marginLeft: 40,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    marginTop: Spacing.xl,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});

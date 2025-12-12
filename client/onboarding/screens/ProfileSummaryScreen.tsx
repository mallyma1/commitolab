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
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useOnboardingContext } from "../OnboardingContext";

type Props = {
  navigation: any;
};

const FACTS = [
  "Small, consistent actions beat occasional big efforts.",
  "Habits stick faster when tied to an existing routine.",
  "Celebrating tiny wins releases dopamine that fuels momentum.",
  "Lowering friction, like prepping the night before, doubles follow-through.",
  "Tracking streaks visually increases completion rates by ~40%.",
];

export function ProfileSummaryScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { payload, summary, aiStatus, prefetchAI, summarySource, aiTimedOut } =
    useOnboardingContext();
  const [factIndex, setFactIndex] = useState(0);

  useEffect(() => {
    const factInterval = setInterval(() => {
      setFactIndex((prev) => (prev + 1) % FACTS.length);
    }, 4500);
    return () => clearInterval(factInterval);
  }, []);

  const currentFact = FACTS[factIndex];
  const isUsingFallback = summarySource !== "server";
  const isRefining = aiStatus === "running" && summarySource === "fallback";
  const showTimeoutNotice = aiTimedOut || aiStatus === "failed";

  if (!summary) {
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
          Building your quick profile...
        </ThemedText>
      </View>
    );
  }

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
          Your Habit Profile
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
              Finishing with AI
            </ThemedText>
            <ThemedText
              style={[styles.noticeText, { color: theme.textSecondary }]}
            >
              We built a quick profile already. AI is polishing details in the
              background.
            </ThemedText>
          </View>
        )}

        {showTimeoutNotice && (
          <View
            style={[
              styles.timeoutNotice,
              {
                backgroundColor: theme.backgroundSecondary,
                borderColor: theme.border,
              },
            ]}
          >
            <ThemedText style={[styles.timeoutTitle, { color: theme.text }]}>
              {aiTimedOut
                ? "Taking longer than expected"
                : "Using quick profile"}
            </ThemedText>
            <ThemedText
              style={[styles.timeoutText, { color: theme.textSecondary }]}
            >
              {aiTimedOut
                ? "You can keep going now. We will retry in the background."
                : "We could not finish the AI pass. You can continue and retry later."}
            </ThemedText>
            <View style={styles.timeoutActions}>
              <Pressable
                style={[
                  styles.retryButton,
                  styles.inlineButton,
                  { borderColor: theme.border },
                ]}
                onPress={() => prefetchAI(payload)}
              >
                <ThemedText>Retry now</ThemedText>
              </Pressable>
            </View>
          </View>
        )}

        <View
          style={[
            styles.factBanner,
            {
              backgroundColor: theme.backgroundSecondary,
              borderColor: theme.border,
            },
          ]}
        >
          <ThemedText style={[styles.factTitle, { color: theme.text }]}>
            Quick fact
          </ThemedText>
          <ThemedText style={[styles.factText, { color: theme.textSecondary }]}>
            {currentFact}
          </ThemedText>
        </View>

        <Card
          style={Object.assign({}, styles.profileCard, {
            borderColor: theme.primary,
          })}
        >
          <ThemedText style={styles.profileName}>
            {summary.profile_name}
          </ThemedText>
        </Card>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="zap" size={18} color={theme.primary} />
            <ThemedText style={styles.sectionTitle}>Strengths</ThemedText>
          </View>
          {summary.strengths.map((item, idx) => (
            <ThemedText
              key={idx}
              style={[styles.bulletItem, { color: theme.textSecondary }]}
            >
              {item}
            </ThemedText>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="alert-triangle" size={18} color="#F59E0B" />
            <ThemedText style={styles.sectionTitle}>Risk Zones</ThemedText>
          </View>
          {summary.risk_zones.map((item, idx) => (
            <ThemedText
              key={idx}
              style={[styles.bulletItem, { color: theme.textSecondary }]}
            >
              {item}
            </ThemedText>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="check-circle" size={18} color="#10B981" />
            <ThemedText style={styles.sectionTitle}>Best Practices</ThemedText>
          </View>
          {summary.best_practices.map((item, idx) => (
            <ThemedText
              key={idx}
              style={[styles.bulletItem, { color: theme.textSecondary }]}
            >
              {item}
            </ThemedText>
          ))}
        </View>

        <Pressable
          style={[styles.primaryButton, { backgroundColor: theme.primary }]}
          onPress={() => navigation.navigate("Recommendations")}
        >
          <ThemedText style={styles.primaryButtonText}>
            Design my streaks
          </ThemedText>
          <Feather name="arrow-right" size={20} color="#fff" />
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
    marginBottom: Spacing.lg,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 14,
  },
  factBanner: {
    marginTop: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    width: "100%",
  },
  notice: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    width: "100%",
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
  factTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  factText: {
    fontSize: 13,
    lineHeight: 20,
  },
  timeoutNotice: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    width: "100%",
  },
  timeoutTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  timeoutText: {
    marginTop: Spacing.xs,
    fontSize: 12,
    lineHeight: 18,
  },
  timeoutActions: {
    marginTop: Spacing.sm,
    flexDirection: "row",
    gap: Spacing.sm,
  },
  inlineButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    marginTop: 0,
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
  profileCard: {
    padding: Spacing.lg,
    borderWidth: 2,
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  bulletItem: {
    fontSize: 14,
    lineHeight: 22,
    marginLeft: Spacing.lg + Spacing.sm,
    marginBottom: 4,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});

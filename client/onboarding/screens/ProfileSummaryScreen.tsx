import React from "react";
import { View, StyleSheet, Pressable, ScrollView, ActivityIndicator } from "react-native";
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

export function ProfileSummaryScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { payload, summary, aiLoading, aiError, prefetchAI } = useOnboardingContext();

  if (aiLoading || !summary) {
    return (
      <View
        style={[
          styles.container,
          styles.centered,
          { backgroundColor: theme.backgroundRoot, paddingTop: insets.top },
        ]}
      >
        <ActivityIndicator size="large" color={theme.primary} />
        <ThemedText style={[styles.loadingText, { color: theme.textSecondary }]}>
          Analysing your answers...
        </ThemedText>
      </View>
    );
  }

  if (aiError) {
    return (
      <View
        style={[
          styles.container,
          styles.centered,
          { backgroundColor: theme.backgroundRoot, paddingTop: insets.top },
        ]}
      >
        <Feather name="alert-circle" size={48} color={theme.textSecondary} />
        <ThemedText style={[styles.errorText, { color: theme.textSecondary }]}>
          We could not generate your profile right now.
        </ThemedText>
        <Pressable
          style={[styles.retryButton, { borderColor: theme.border }]}
          onPress={() => prefetchAI(payload)}
        >
          <ThemedText>Try again</ThemedText>
        </Pressable>
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
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText type="h2" style={styles.heading}>
          Your Habit Profile
        </ThemedText>

        <Card style={[styles.profileCard, { borderColor: theme.primary }]}>
          <ThemedText style={styles.profileName}>{summary.profile_name}</ThemedText>
        </Card>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="zap" size={18} color={theme.primary} />
            <ThemedText style={styles.sectionTitle}>Strengths</ThemedText>
          </View>
          {summary.strengths.map((item, idx) => (
            <ThemedText key={idx} style={[styles.bulletItem, { color: theme.textSecondary }]}>
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
            <ThemedText key={idx} style={[styles.bulletItem, { color: theme.textSecondary }]}>
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
            <ThemedText key={idx} style={[styles.bulletItem, { color: theme.textSecondary }]}>
              {item}
            </ThemedText>
          ))}
        </View>

        <Pressable
          style={[styles.primaryButton, { backgroundColor: theme.primary }]}
          onPress={() => navigation.navigate("Recommendations")}
        >
          <ThemedText style={styles.primaryButtonText}>Design my streaks</ThemedText>
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

import React, { useState } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useHeaderHeight } from "@react-navigation/elements";

import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";
import { Button } from "./Button";
import { UpgradeModal } from "./UpgradeModal";
import { useTheme } from "@/hooks/useTheme";
import { useSubscription, type ProFeature } from "@/hooks/useSubscription";
import { Spacing, BorderRadius, EarthyColors } from "@/constants/theme";
import { FREE_MODE } from "../../shared/config";

interface ProGateProps {
  feature: ProFeature;
  featureName: string;
  children: React.ReactNode;
}

const FEATURE_DETAILS: Record<ProFeature, { icon: keyof typeof Feather.glyphMap; color: string; description: string }> = {
  dopamineLab: {
    icon: "activity",
    color: EarthyColors.forestGreen,
    description: "Track natural dopamine activities for sustainable motivation and energy.",
  },
  stoicRoom: {
    icon: "feather",
    color: EarthyColors.copper,
    description: "Daily philosophical reflections to strengthen your mindset and resilience.",
  },
  selfRegulationTest: {
    icon: "user-check",
    color: EarthyColors.terraBrown,
    description: "Discover your self-regulation strengths and growth opportunities.",
  },
  advancedAnalytics: {
    icon: "trending-up",
    color: EarthyColors.clayRed,
    description: "Deep insights into your habit patterns and progress over time.",
  },
  unlimitedCommitments: {
    icon: "layers",
    color: EarthyColors.forestGreen,
    description: "Track as many habits as you need without any limitations.",
  },
  customReminders: {
    icon: "bell",
    color: EarthyColors.copper,
    description: "Smart, personalized reminders timed for maximum effectiveness.",
  },
};

export function ProGate({ feature, featureName, children }: ProGateProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { isPro, isLoading, error } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const featureInfo = FEATURE_DETAILS[feature];

  let headerHeight = 0;
  try {
    headerHeight = useHeaderHeight();
  } catch {
    headerHeight = 0;
  }

  if (FREE_MODE) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </ThemedView>
    );
  }

  if (!isPro || error) {
    return (
      <ThemedView style={styles.container}>
        <View
          style={[
            styles.content,
            {
              paddingTop: headerHeight > 0 ? headerHeight + Spacing.lg : insets.top + Spacing.xl,
              paddingBottom: insets.bottom + Spacing.xl,
            },
          ]}
        >
          <View style={[styles.iconContainer, { backgroundColor: `${featureInfo.color}15` }]}>
            <Feather name={featureInfo.icon} size={48} color={featureInfo.color} />
          </View>

          <ThemedText type="h2" style={styles.title}>
            {featureName}
          </ThemedText>

          <ThemedText style={[styles.description, { color: theme.textSecondary }]}>
            {featureInfo.description}
          </ThemedText>

          <View style={[styles.proBadge, { backgroundColor: `${EarthyColors.terraBrown}15` }]}>
            <Feather name="lock" size={14} color={EarthyColors.terraBrown} />
            <ThemedText style={[styles.proBadgeText, { color: EarthyColors.terraBrown }]}>
              Pro Feature
            </ThemedText>
          </View>

          <Button onPress={() => setShowUpgradeModal(true)} style={styles.button}>
            Upgrade to Pro
          </Button>

          <ThemedText style={[styles.benefitsTitle, { color: theme.textSecondary }]}>
            Pro also includes:
          </ThemedText>

          <View style={styles.features}>
            {Object.entries(FEATURE_DETAILS)
              .filter(([key]) => key !== feature)
              .slice(0, 3)
              .map(([key, info]) => (
                <FeatureItem
                  key={key}
                  icon={info.icon}
                  label={key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()).trim()}
                  color={info.color}
                />
              ))}
          </View>
        </View>

        <UpgradeModal
          visible={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          feature={featureName}
        />
      </ThemedView>
    );
  }

  return <>{children}</>;
}

function FeatureItem({ icon, label, color }: { icon: keyof typeof Feather.glyphMap; label: string; color: string }) {
  const { theme } = useTheme();
  return (
    <View style={styles.featureItem}>
      <View style={[styles.featureIcon, { backgroundColor: `${color}15` }]}>
        <Feather name={icon} size={14} color={color} />
      </View>
      <ThemedText style={[styles.featureLabel, { color: theme.textSecondary }]}>
        {label}
      </ThemedText>
    </View>
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
    flex: 1,
    paddingHorizontal: Spacing.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  description: {
    textAlign: "center",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  proBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xl,
  },
  proBadgeText: {
    fontSize: 13,
    fontWeight: "600",
  },
  button: {
    width: "100%",
    maxWidth: 280,
    marginBottom: Spacing.xl,
  },
  benefitsTitle: {
    fontSize: 13,
    marginBottom: Spacing.md,
  },
  features: {
    gap: Spacing.sm,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  featureIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  featureLabel: {
    fontSize: 13,
  },
});

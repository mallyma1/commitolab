import React from "react";
import { View, StyleSheet, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useOnboardingContext } from "../OnboardingContext";

type Props = {
  navigation: any;
};

const domainOptions = [
  { id: "fitness", label: "Fitness / movement", icon: "activity" as const },
  { id: "nutrition", label: "Nutrition / eating habits", icon: "coffee" as const },
  { id: "sleep", label: "Sleep / recovery", icon: "moon" as const },
  { id: "focus", label: "Focus / deep work", icon: "target" as const },
  { id: "sobriety", label: "Sobriety / harm reduction", icon: "shield" as const },
  { id: "relationships", label: "Relationships / connection", icon: "heart" as const },
  { id: "creativity", label: "Creative output", icon: "feather" as const },
  { id: "learning", label: "Learning / skill building", icon: "book" as const },
  { id: "money", label: "Money / financial habits", icon: "dollar-sign" as const },
  { id: "mindfulness", label: "Mindfulness / calm", icon: "sun" as const },
];

export function FocusDomainsScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { payload, update } = useOnboardingContext();

  const toggleDomain = (domain: string) => {
    const current = payload.focusDomains;
    if (current.includes(domain)) {
      update("focusDomains", current.filter((d) => d !== domain));
    } else if (current.length < 3) {
      update("focusDomains", [...current, domain]);
    }
  };

  const canContinue = payload.focusDomains.length >= 1 && payload.focusDomains.length <= 3;

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
          What areas of life do you most want to improve?
        </ThemedText>
        <ThemedText style={[styles.subheading, { color: theme.textSecondary }]}>
          Pick 1-3. We will focus your commitments here first.
        </ThemedText>

        <View style={styles.domainGrid}>
          {domainOptions.map((domain) => {
            const selected = payload.focusDomains.includes(domain.id);
            return (
              <Pressable
                key={domain.id}
                onPress={() => toggleDomain(domain.id)}
                style={[
                  styles.domainCard,
                  {
                    backgroundColor: selected ? theme.primary + "15" : theme.backgroundDefault,
                    borderColor: selected ? theme.primary : theme.border,
                  },
                ]}
              >
                <View style={[styles.domainIcon, { backgroundColor: theme.primary + "20" }]}>
                  <Feather name={domain.icon} size={20} color={theme.primary} />
                </View>
                <ThemedText style={styles.domainLabel}>{domain.label}</ThemedText>
                {selected ? (
                  <View style={[styles.checkBadge, { backgroundColor: theme.primary }]}>
                    <Feather name="check" size={12} color="#fff" />
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.navButtons}>
          <Pressable
            style={[styles.backButton, { borderColor: theme.border }]}
            onPress={() => navigation.goBack()}
          >
            <ThemedText style={{ color: theme.textSecondary }}>Back</ThemedText>
          </Pressable>
          <Pressable
            style={[
              styles.continueButton,
              { backgroundColor: canContinue ? theme.primary : theme.border },
            ]}
            onPress={() => navigation.navigate("Struggles")}
            disabled={!canContinue}
          >
            <ThemedText style={styles.continueButtonText}>Continue</ThemedText>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  scrollContent: {
    flexGrow: 1,
  },
  heading: {
    marginBottom: Spacing.md,
  },
  subheading: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  domainGrid: {
    gap: Spacing.sm,
  },
  domainCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    gap: Spacing.md,
  },
  domainIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  domainLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
  checkBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
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
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
});

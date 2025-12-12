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

const roleOptions = [
  { id: "parent", label: "Parent" },
  { id: "founder", label: "Founder / entrepreneur" },
  { id: "employee", label: "Employee" },
  { id: "student", label: "Student" },
  { id: "carer", label: "Carer" },
  { id: "freelancer", label: "Freelancer / self-employed" },
  { id: "retired", label: "Retired" },
  { id: "looking_for_work", label: "Looking for work" },
];

const pressureOptions = [
  { id: "children", label: "Raising small children" },
  { id: "aging_parents", label: "Caring for aging parents" },
  { id: "work_hours", label: "Long work hours" },
  { id: "irregular_schedule", label: "Irregular schedule" },
  { id: "financial_stress", label: "Financial stress" },
  { id: "health_challenges", label: "Health challenges" },
  { id: "relationship_transitions", label: "Relationship transitions" },
  { id: "none", label: "None of these apply" },
];

export function RolesScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { payload, update } = useOnboardingContext();

  const toggleRole = (role: string) => {
    const current = payload.roles ?? [];
    if (current.includes(role)) {
      update(
        "roles",
        current.filter((r: string) => r !== role)
      );
    } else {
      update("roles", [...current, role]);
    }
  };

  const togglePressure = (pressure: string) => {
    const current = payload.pressures ?? [];
    if (current.includes(pressure)) {
      update(
        "pressures",
        current.filter((p: string) => p !== pressure)
      );
    } else {
      update("pressures", [...current, pressure]);
    }
  };

  const canContinue = (payload.roles?.length ?? 0) > 0;

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
          What roles do you hold in life right now?
        </ThemedText>
        <ThemedText style={[styles.subheading, { color: theme.textSecondary }]}>
          Select all that apply. This helps us calibrate how much capacity you
          realistically have.
        </ThemedText>

        <View style={styles.chipGrid}>
          {roleOptions.map((role) => {
            const selected = (payload.roles ?? []).includes(role.id);
            return (
              <Pressable
                key={role.id}
                onPress={() => toggleRole(role.id)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: selected
                      ? theme.primary + "20"
                      : theme.backgroundDefault,
                    borderColor: selected ? theme.primary : theme.border,
                  },
                ]}
              >
                <ThemedText
                  style={[
                    styles.chipText,
                    selected ? { color: theme.primary } : null,
                  ]}
                >
                  {role.label}
                </ThemedText>
                {selected ? (
                  <Feather name="check" size={14} color={theme.primary} />
                ) : null}
              </Pressable>
            );
          })}
        </View>

        <ThemedText style={[styles.fieldLabel, { marginTop: Spacing.xl }]}>
          Any of these pressures active right now?
        </ThemedText>
        <ThemedText style={[styles.fieldHint, { color: theme.textSecondary }]}>
          Optional but helps us avoid overloading you.
        </ThemedText>

        <View style={[styles.chipGrid, { marginTop: Spacing.md }]}>
          {pressureOptions.map((pressure) => {
            const selected = (payload.pressures ?? []).includes(pressure.id);
            return (
              <Pressable
                key={pressure.id}
                onPress={() => togglePressure(pressure.id)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: selected
                      ? theme.primary + "20"
                      : theme.backgroundDefault,
                    borderColor: selected ? theme.primary : theme.border,
                  },
                ]}
              >
                <ThemedText
                  style={[
                    styles.chipText,
                    selected ? { color: theme.primary } : null,
                  ]}
                >
                  {pressure.label}
                </ThemedText>
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
            onPress={() => navigation.navigate("FocusDomains")}
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
  fieldLabel: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  fieldHint: {
    fontSize: 13,
    marginBottom: Spacing.sm,
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  chipText: {
    fontSize: 13,
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

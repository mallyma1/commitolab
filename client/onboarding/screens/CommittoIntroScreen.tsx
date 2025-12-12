import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/Button";
import { Spacing, BorderRadius } from "@/constants/theme";

export function CommittoIntroScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation = useNavigation<any>();

  return (
    <ThemedView style={{ flex: 1, backgroundColor: theme.backgroundRoot }}>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          {
            paddingTop: insets.top + Spacing.xl,
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          entering={FadeInDown.duration(400)}
          style={styles.content}
        >
          {/* Slide 1: What is Commito */}
          <View style={styles.slide}>
            <View
              style={[styles.icon, { backgroundColor: `${theme.primary}20` }]}
            >
              <Feather name="target" size={48} color={theme.primary} />
            </View>

            <ThemedText
              type="h2"
              style={[styles.title, { marginTop: Spacing.xl }]}
            >
              Welcome to Commito
            </ThemedText>

            <ThemedText
              style={[
                styles.subtitle,
                { color: theme.textSecondary, marginTop: Spacing.md },
              ]}
            >
              The app for building real change, one commitment at a time.
            </ThemedText>

            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.backgroundSecondary,
                  marginTop: Spacing.lg,
                },
              ]}
            >
              <ThemedText style={{ lineHeight: 24 }}>
                Commito is simple: you make commitments, check in daily, and
                track your progress. Over time, you become the person you want
                to be.
              </ThemedText>
            </View>
          </View>

          {/* Slide 2: Why Commitments Work */}
          <View style={[styles.slide, { marginTop: Spacing.xl * 2 }]}>
            <View
              style={[styles.icon, { backgroundColor: `${theme.success}20` }]}
            >
              <Feather name="check-circle" size={48} color={theme.success} />
            </View>

            <ThemedText
              type="h2"
              style={[styles.title, { marginTop: Spacing.xl }]}
            >
              Why Commitments Work
            </ThemedText>

            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.backgroundSecondary,
                  marginTop: Spacing.lg,
                },
              ]}
            >
              <View style={styles.point}>
                <Feather name="zap" size={16} color={theme.primary} />
                <ThemedText style={styles.pointText}>
                  <ThemedText type="h4" style={{ color: theme.primary }}>
                    Visible progress
                  </ThemedText>{" "}
                  - See your streak grow every day
                </ThemedText>
              </View>

              <View style={[styles.point, { marginTop: Spacing.md }]}>
                <Feather name="repeat" size={16} color={theme.primary} />
                <ThemedText style={styles.pointText}>
                  <ThemedText type="h4" style={{ color: theme.primary }}>
                    Momentum
                  </ThemedText>{" "}
                  - Small wins compound into big change
                </ThemedText>
              </View>

              <View style={[styles.point, { marginTop: Spacing.md }]}>
                <Feather name="users" size={16} color={theme.primary} />
                <ThemedText style={styles.pointText}>
                  <ThemedText type="h4" style={{ color: theme.primary }}>
                    Identity
                  </ThemedText>{" "}
                  - You become your commitments
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Slide 3: How Daily Check-Ins Work */}
          <View style={[styles.slide, { marginTop: Spacing.xl * 2 }]}>
            <View
              style={[styles.icon, { backgroundColor: `${theme.accent}20` }]}
            >
              <Feather name="calendar" size={48} color={theme.accent} />
            </View>

            <ThemedText
              type="h2"
              style={[styles.title, { marginTop: Spacing.xl }]}
            >
              Daily Check-Ins
            </ThemedText>

            <ThemedText
              style={[
                styles.subtitle,
                { color: theme.textSecondary, marginTop: Spacing.md },
              ]}
            >
              Every commitment needs a check-in to count.
            </ThemedText>

            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.backgroundSecondary,
                  marginTop: Spacing.lg,
                },
              ]}
            >
              <ThemedText style={{ lineHeight: 24 }}>
                Each day, tap the{" "}
                <ThemedText type="h4" style={{ color: theme.primary }}>
                  +
                </ThemedText>{" "}
                button on your commitment to check in. Optional: add a photo for
                proof.
              </ThemedText>

              <ThemedText
                style={[
                  styles.subtitle,
                  { marginTop: Spacing.md, color: theme.textSecondary },
                ]}
              >
                One check-in extends your streak. Miss a day and the streak
                resets—but you can always start fresh.
              </ThemedText>
            </View>
          </View>

          {/* Slide 4: Weekly Progress & Insights */}
          <View style={[styles.slide, { marginTop: Spacing.xl * 2 }]}>
            <View
              style={[styles.icon, { backgroundColor: `${theme.warning}20` }]}
            >
              <Feather name="trending-up" size={48} color={theme.warning} />
            </View>

            <ThemedText
              type="h2"
              style={[styles.title, { marginTop: Spacing.xl }]}
            >
              See Your Progress
            </ThemedText>

            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.backgroundSecondary,
                  marginTop: Spacing.lg,
                },
              ]}
            >
              <ThemedText style={{ lineHeight: 24 }}>
                Track your streaks, see weekly trends, and watch yourself
                improve. Commito generates personalized insights so you know
                what's working.
              </ThemedText>

              <ThemedText
                style={[
                  styles.subtitle,
                  { marginTop: Spacing.md, color: theme.textSecondary },
                ]}
              >
                Data without overwhelm. Just the numbers that matter.
              </ThemedText>
            </View>
          </View>

          {/* Slide 5: AI Personalization */}
          <View style={[styles.slide, { marginTop: Spacing.xl * 2 }]}>
            <View
              style={[styles.icon, { backgroundColor: `${theme.primary}20` }]}
            >
              <Feather name="zap" size={48} color={theme.primary} />
            </View>

            <ThemedText
              type="h2"
              style={[styles.title, { marginTop: Spacing.xl }]}
            >
              AI-Powered Coaching
            </ThemedText>

            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.backgroundSecondary,
                  marginTop: Spacing.lg,
                },
              ]}
            >
              <ThemedText style={{ lineHeight: 24 }}>
                As you use Commito, the app learns your patterns and adapts.
                You'll get smarter reminders, better commitment suggestions, and
                coaching tailored to how you work best.
              </ThemedText>

              <ThemedText
                style={[
                  styles.subtitle,
                  { marginTop: Spacing.md, color: theme.textSecondary },
                ]}
              >
                The more you use it, the smarter it gets.
              </ThemedText>
            </View>
          </View>

          {/* CTA */}
          <View style={{ marginTop: Spacing.xl * 2, marginBottom: Spacing.lg }}>
            <Button onPress={() => navigation.navigate("Roles")}>
              Start Building
            </Button>
            <ThemedText
              style={[
                styles.skipText,
                { color: theme.textSecondary, marginTop: Spacing.md },
              ]}
            >
              You can update these preferences anytime in Settings.
            </ThemedText>
          </View>
        </Animated.View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
  },
  content: {
    flex: 1,
  },
  slide: {
    alignItems: "center",
  },
  icon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    fontSize: 16,
    lineHeight: 24,
  },
  card: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
  },
  point: {
    flexDirection: "row",
    gap: Spacing.md,
    alignItems: "flex-start",
  },
  pointText: {
    flex: 1,
    lineHeight: 22,
  },
  skipText: {
    textAlign: "center",
    fontSize: 14,
  },
});

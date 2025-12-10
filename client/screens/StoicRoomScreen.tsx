import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Share,
  Platform,
} from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, EarthyColors, Gradients } from "@/constants/theme";

const STOIC_QUOTES = [
  {
    text: "We suffer more often in imagination than in reality.",
    author: "Seneca",
    source: "Letters from a Stoic",
    explanation: "Your mind amplifies problems. Most worries never materialize.",
  },
  {
    text: "The happiness of your life depends upon the quality of your thoughts.",
    author: "Marcus Aurelius",
    source: "Meditations",
    explanation: "You control your inner world. Choose thoughts that serve you.",
  },
  {
    text: "No man is free who is not master of himself.",
    author: "Epictetus",
    source: "Discourses",
    explanation: "True freedom comes from self-discipline, not external circumstances.",
  },
  {
    text: "It is not things that disturb us, but our judgments about things.",
    author: "Epictetus",
    source: "Enchiridion",
    explanation: "Events are neutral. Your interpretation creates your experience.",
  },
  {
    text: "Begin at once to live, and count each separate day as a separate life.",
    author: "Seneca",
    source: "Letters from a Stoic",
    explanation: "Today is all you have. Make it count.",
  },
  {
    text: "Waste no more time arguing about what a good man should be. Be one.",
    author: "Marcus Aurelius",
    source: "Meditations",
    explanation: "Action over analysis. Become who you wish to be.",
  },
  {
    text: "If it is not right, do not do it. If it is not true, do not say it.",
    author: "Marcus Aurelius",
    source: "Meditations",
    explanation: "Simple moral clarity. Integrity in every action.",
  },
  {
    text: "He who fears death will never do anything worthy of a living man.",
    author: "Seneca",
    source: "Letters from a Stoic",
    explanation: "Fear limits potential. Embrace mortality to live fully.",
  },
  {
    text: "The soul becomes dyed with the color of its thoughts.",
    author: "Marcus Aurelius",
    source: "Meditations",
    explanation: "Habitual thoughts shape character. Guard your mind.",
  },
  {
    text: "First say to yourself what you would be; then do what you have to do.",
    author: "Epictetus",
    source: "Discourses",
    explanation: "Define your identity, then act accordingly.",
  },
];

export default function StoicRoomScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [currentQuote, setCurrentQuote] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [savedQuotes, setSavedQuotes] = useState<number[]>([]);

  const quote = STOIC_QUOTES[currentQuote];

  const handleNextQuote = () => {
    setShowExplanation(false);
    setCurrentQuote((prev) => (prev + 1) % STOIC_QUOTES.length);
  };

  const handleSaveQuote = () => {
    if (savedQuotes.includes(currentQuote)) {
      setSavedQuotes(savedQuotes.filter((i) => i !== currentQuote));
    } else {
      setSavedQuotes([...savedQuotes, currentQuote]);
    }
  };

  const handleShareQuote = async () => {
    try {
      await Share.share({
        message: `"${quote.text}" - ${quote.author}`,
      });
    } catch (error) {
      console.error("Error sharing quote:", error);
    }
  };

  const isSaved = savedQuotes.includes(currentQuote);

  return (
    <LinearGradient
      colors={[EarthyColors.warmCharcoal, EarthyColors.deepEarth]}
      style={styles.container}
    >
      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + Spacing.xl,
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
      >
        <View style={styles.header}>
          <ThemedText type="h3" style={styles.title}>
            Stoic Room
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Daily wisdom for the disciplined mind
          </ThemedText>
        </View>

        <View style={styles.quoteContainer}>
          <Animated.View
            key={currentQuote}
            entering={FadeIn.duration(400)}
            exiting={FadeOut.duration(200)}
            style={styles.quoteCard}
          >
            <View style={styles.quoteMarks}>
              <ThemedText style={styles.quoteMark}>"</ThemedText>
            </View>
            <ThemedText style={styles.quoteText}>{quote.text}</ThemedText>
            <View style={styles.attribution}>
              <ThemedText style={styles.author}>{quote.author}</ThemedText>
              <ThemedText style={styles.source}>{quote.source}</ThemedText>
            </View>

            {showExplanation ? (
              <Animated.View
                entering={FadeIn.duration(300)}
                style={[
                  styles.explanationCard,
                  { backgroundColor: `${EarthyColors.sandBeige}15` },
                ]}
              >
                <Feather name="info" size={16} color={EarthyColors.sandBeige} />
                <ThemedText style={styles.explanationText}>
                  {quote.explanation}
                </ThemedText>
              </Animated.View>
            ) : null}
          </Animated.View>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={[styles.actionButton, { backgroundColor: `${EarthyColors.sandBeige}20` }]}
            onPress={() => setShowExplanation(!showExplanation)}
          >
            <Feather
              name="help-circle"
              size={20}
              color={EarthyColors.sandBeige}
            />
            <ThemedText style={styles.actionText}>
              {showExplanation ? "Hide meaning" : "Why this quote?"}
            </ThemedText>
          </Pressable>

          <View style={styles.iconActions}>
            <Pressable
              style={[styles.iconButton, { backgroundColor: `${EarthyColors.sandBeige}20` }]}
              onPress={handleSaveQuote}
            >
              <Feather
                name={isSaved ? "bookmark" : "bookmark"}
                size={20}
                color={isSaved ? EarthyColors.gold : EarthyColors.sandBeige}
              />
            </Pressable>

            <Pressable
              style={[styles.iconButton, { backgroundColor: `${EarthyColors.sandBeige}20` }]}
              onPress={handleShareQuote}
            >
              <Feather name="share" size={20} color={EarthyColors.sandBeige} />
            </Pressable>
          </View>
        </View>

        <Pressable
          style={[styles.nextButton, { backgroundColor: EarthyColors.copper }]}
          onPress={handleNextQuote}
        >
          <ThemedText style={styles.nextText}>Next Quote</ThemedText>
          <Feather name="arrow-right" size={20} color="#fff" />
        </Pressable>
      </View>
    </LinearGradient>
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
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  title: {
    color: EarthyColors.sandBeige,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    color: `${EarthyColors.sandBeige}80`,
    fontSize: 14,
  },
  quoteContainer: {
    flex: 1,
    justifyContent: "center",
  },
  quoteCard: {
    alignItems: "center",
  },
  quoteMarks: {
    marginBottom: Spacing.md,
  },
  quoteMark: {
    fontSize: 64,
    color: EarthyColors.copper,
    opacity: 0.5,
    lineHeight: 64,
  },
  quoteText: {
    fontSize: 24,
    lineHeight: 36,
    textAlign: "center",
    color: EarthyColors.warmOffWhite,
    fontWeight: "300",
    marginBottom: Spacing.xl,
  },
  attribution: {
    alignItems: "center",
  },
  author: {
    fontSize: 16,
    fontWeight: "600",
    color: EarthyColors.sandBeige,
    marginBottom: Spacing.xs,
  },
  source: {
    fontSize: 14,
    color: `${EarthyColors.sandBeige}70`,
    fontStyle: "italic",
  },
  explanationCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.xl,
  },
  explanationText: {
    flex: 1,
    fontSize: 14,
    color: EarthyColors.sandBeige,
    lineHeight: 22,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  actionText: {
    color: EarthyColors.sandBeige,
    fontSize: 14,
  },
  iconActions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  nextButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.sm,
    height: 56,
    borderRadius: BorderRadius.sm,
  },
  nextText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

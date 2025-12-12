import React, { useState } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import Animated, { useSharedValue, withSpring } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

export interface FeatureInfo {
  what: string;
  why: string;
  how: string;
}

interface Props {
  title: string;
  icon: string;
  info: FeatureInfo;
  color?: string;
}

export function FeatureInfoCard({ title, icon, info, color }: Props) {
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const scaleAnim = useSharedValue(1);

  const handlePress = () => {
    scaleAnim.value = withSpring(expanded ? 1 : 0.98);
    setExpanded(!expanded);
  };

  const bgColor = color || theme.primary;

  return (
    <Pressable onPress={handlePress}>
      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor: `${bgColor}15`,
            borderColor: `${bgColor}30`,
          },
        ]}
      >
        <View style={styles.header}>
          <View style={[styles.iconBox, { backgroundColor: `${bgColor}25` }]}>
            <Feather name={icon as any} size={20} color={bgColor} />
          </View>

          <ThemedText type="h4" style={{ flex: 1 }}>
            {title}
          </ThemedText>

          <Feather
            name={expanded ? "chevron-up" : "chevron-down"}
            size={20}
            color={theme.textSecondary}
          />
        </View>

        {expanded && (
          <View style={styles.details}>
            <Section label="What" text={info.what} />
            <Section label="Why" text={info.why} />
            <Section label="How" text={info.how} color={bgColor} />
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

function Section({
  label,
  text,
  color,
}: {
  label: string;
  text: string;
  color?: string;
}) {
  const { theme } = useTheme();

  return (
    <View style={styles.section}>
      <ThemedText
        type="h4"
        style={[styles.label, { color: color || theme.primary }]}
      >
        {label}
      </ThemedText>
      <ThemedText style={[styles.text, { color: theme.textSecondary }]}>
        {text}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.lg,
    marginVertical: Spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  details: {
    marginTop: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.md,
  },
  label: {
    marginBottom: Spacing.xs,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
  },
});

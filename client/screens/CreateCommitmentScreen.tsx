import React, { useState } from "react";
import { View, StyleSheet, TextInput, ScrollView, Pressable, Alert, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useCreateCommitment } from "@/hooks/useCommitments";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const categories = [
  { id: "fitness", label: "Fitness", icon: "activity" as const },
  { id: "reading", label: "Reading", icon: "book" as const },
  { id: "meditation", label: "Meditation", icon: "sun" as const },
  { id: "sobriety", label: "Sobriety", icon: "heart" as const },
  { id: "learning", label: "Learning", icon: "book-open" as const },
  { id: "creative", label: "Creative", icon: "edit-3" as const },
];

const cadenceOptions = [
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
];

export default function CreateCommitmentScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const createCommitment = useCreateCommitment();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("fitness");
  const [cadence, setCadence] = useState("daily");
  const [duration, setDuration] = useState("30");

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert("Title Required", "Please enter a commitment title");
      return;
    }

    const durationNum = parseInt(duration, 10);
    if (isNaN(durationNum) || durationNum < 1) {
      Alert.alert("Invalid Duration", "Please enter a valid number of days");
      return;
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + durationNum);

    try {
      await createCommitment.mutateAsync({
        title: title.trim(),
        category,
        cadence,
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
      });
      Alert.alert("Success", "Your commitment has been created! Start your streak today.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert("Error", "Failed to create commitment. Please try again.");
    }
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={[
        styles.container,
        {
          paddingBottom: insets.bottom + Spacing.xl,
        },
      ]}
    >
      <View style={styles.form}>
        <ThemedText style={styles.label}>What&apos;s your commitment?</ThemedText>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.backgroundDefault,
              borderColor: theme.border,
              color: theme.text,
            },
          ]}
          placeholder="e.g., Morning workout, Read 30 pages"
          placeholderTextColor={theme.textSecondary}
          value={title}
          onChangeText={setTitle}
        />

        <ThemedText style={styles.label}>Category</ThemedText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {categories.map((cat) => {
            const isActive = category === cat.id;
            return (
              <Pressable
                key={cat.id}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: isActive ? theme.primary : theme.backgroundDefault,
                    borderColor: isActive ? theme.primary : theme.border,
                  },
                ]}
                onPress={() => setCategory(cat.id)}
              >
                <Feather
                  name={cat.icon}
                  size={16}
                  color={isActive ? "#fff" : theme.textSecondary}
                />
                <ThemedText
                  style={[
                    styles.categoryText,
                    { color: isActive ? "#fff" : theme.text },
                  ]}
                >
                  {cat.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </ScrollView>

        <ThemedText style={styles.label}>How often?</ThemedText>
        <View style={styles.cadenceContainer}>
          {cadenceOptions.map((option) => {
            const isActive = cadence === option.id;
            return (
              <Pressable
                key={option.id}
                style={[
                  styles.cadenceButton,
                  {
                    backgroundColor: isActive ? theme.primary : theme.backgroundDefault,
                    borderColor: isActive ? theme.primary : theme.border,
                  },
                ]}
                onPress={() => setCadence(option.id)}
              >
                <ThemedText
                  style={[
                    styles.cadenceText,
                    { color: isActive ? "#fff" : theme.text },
                  ]}
                >
                  {option.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        <ThemedText style={styles.label}>Duration (days)</ThemedText>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.backgroundDefault,
              borderColor: theme.border,
              color: theme.text,
            },
          ]}
          placeholder="30"
          placeholderTextColor={theme.textSecondary}
          value={duration}
          onChangeText={setDuration}
          keyboardType="number-pad"
        />

        <View style={styles.buttonContainer}>
          <Button
            onPress={handleCreate}
            disabled={createCommitment.isPending}
            style={styles.createButton}
          >
            {createCommitment.isPending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              "Create Commitment"
            )}
          </Button>
        </View>
      </View>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  form: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  input: {
    height: Spacing.inputHeight,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
  },
  categoryScroll: {
    flexGrow: 0,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    marginRight: Spacing.sm,
    gap: 6,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "500",
  },
  cadenceContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  cadenceButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  cadenceText: {
    fontSize: 14,
    fontWeight: "600",
  },
  buttonContainer: {
    marginTop: Spacing.xl,
  },
  createButton: {
    marginTop: Spacing.md,
  },
});

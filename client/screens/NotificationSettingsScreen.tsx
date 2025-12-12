import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Switch,
  Pressable,
  Alert,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, EarthyColors } from "@/constants/theme";
import {
  NotificationSettings,
  defaultNotificationSettings,
  getNotificationSettings,
  saveNotificationSettings,
  requestNotificationPermission,
} from "@/lib/notifications";

const TIME_OPTIONS = [
  { label: "6:00 AM", value: "06:00" },
  { label: "7:00 AM", value: "07:00" },
  { label: "8:00 AM", value: "08:00" },
  { label: "9:00 AM", value: "09:00" },
  { label: "10:00 AM", value: "10:00" },
  { label: "12:00 PM", value: "12:00" },
  { label: "6:00 PM", value: "18:00" },
  { label: "8:00 PM", value: "20:00" },
  { label: "9:00 PM", value: "21:00" },
];

export default function NotificationSettingsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const [settings, setSettings] = useState<NotificationSettings>(
    defaultNotificationSettings
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const stored = await getNotificationSettings();
    setSettings(stored);
    setIsLoading(false);
  };

  const handleToggleEnabled = async (value: boolean) => {
    if (value) {
      if (Platform.OS === "web") {
        Alert.alert(
          "Not Available",
          "Push notifications are not available on web. Please use the mobile app via Expo Go."
        );
        return;
      }

      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert(
          "Permission Required",
          "Please enable notifications in your device settings to receive reminders."
        );
        return;
      }
    }

    const newSettings = { ...settings, enabled: value };
    setSettings(newSettings);
    await saveNotificationSettings(newSettings);
  };

  const handleToggle = async (
    key: keyof NotificationSettings,
    value: boolean
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    await saveNotificationSettings(newSettings);
  };

  const handleTimeChange = async (time: string) => {
    const newSettings = { ...settings, dailyReminderTime: time };
    setSettings(newSettings);
    await saveNotificationSettings(newSettings);
  };

  if (isLoading) {
    return <View style={{ flex: 1, backgroundColor: theme.backgroundRoot }} />;
  }

  return (
    <KeyboardAwareScrollViewCompat
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.xl,
        paddingBottom: insets.bottom + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
    >
      <Card style={styles.settingCard}>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: `${EarthyColors.forestGreen}20` },
              ]}
            >
              <Feather name="bell" size={20} color={EarthyColors.forestGreen} />
            </View>
            <View style={styles.settingText}>
              <ThemedText style={styles.settingTitle}>
                Enable Notifications
              </ThemedText>
              <ThemedText
                style={[styles.settingDesc, { color: theme.textSecondary }]}
              >
                Get reminders to check in and stay accountable
              </ThemedText>
            </View>
          </View>
          <Switch
            value={settings.enabled}
            onValueChange={handleToggleEnabled}
            trackColor={{ false: theme.border, true: EarthyColors.forestGreen }}
            thumbColor="#fff"
          />
        </View>
      </Card>

      {settings.enabled ? (
        <>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Reminder Settings
          </ThemedText>

          <Card style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: `${EarthyColors.terraBrown}20` },
                  ]}
                >
                  <Feather
                    name="clock"
                    size={20}
                    color={EarthyColors.terraBrown}
                  />
                </View>
                <View style={styles.settingText}>
                  <ThemedText style={styles.settingTitle}>
                    Daily Reminder
                  </ThemedText>
                  <ThemedText
                    style={[styles.settingDesc, { color: theme.textSecondary }]}
                  >
                    Get a daily nudge to check in
                  </ThemedText>
                </View>
              </View>
              <Switch
                value={settings.dailyReminder}
                onValueChange={(value) => handleToggle("dailyReminder", value)}
                trackColor={{
                  false: theme.border,
                  true: EarthyColors.terraBrown,
                }}
                thumbColor="#fff"
              />
            </View>

            {settings.dailyReminder ? (
              <View
                style={[styles.timeSelector, { borderTopColor: theme.border }]}
              >
                <ThemedText
                  style={[
                    styles.timeSelectorLabel,
                    { color: theme.textSecondary },
                  ]}
                >
                  Reminder Time
                </ThemedText>
                <View style={styles.timeOptions}>
                  {TIME_OPTIONS.slice(0, 5).map((option) => (
                    <Pressable
                      key={option.value}
                      style={[
                        styles.timeOption,
                        {
                          backgroundColor:
                            settings.dailyReminderTime === option.value
                              ? EarthyColors.terraBrown
                              : theme.backgroundDefault,
                          borderColor:
                            settings.dailyReminderTime === option.value
                              ? EarthyColors.terraBrown
                              : theme.border,
                        },
                      ]}
                      onPress={() => handleTimeChange(option.value)}
                    >
                      <ThemedText
                        style={[
                          styles.timeOptionText,
                          {
                            color:
                              settings.dailyReminderTime === option.value
                                ? "#fff"
                                : theme.text,
                          },
                        ]}
                      >
                        {option.label}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
                <View style={styles.timeOptions}>
                  {TIME_OPTIONS.slice(5).map((option) => (
                    <Pressable
                      key={option.value}
                      style={[
                        styles.timeOption,
                        {
                          backgroundColor:
                            settings.dailyReminderTime === option.value
                              ? EarthyColors.terraBrown
                              : theme.backgroundDefault,
                          borderColor:
                            settings.dailyReminderTime === option.value
                              ? EarthyColors.terraBrown
                              : theme.border,
                        },
                      ]}
                      onPress={() => handleTimeChange(option.value)}
                    >
                      <ThemedText
                        style={[
                          styles.timeOptionText,
                          {
                            color:
                              settings.dailyReminderTime === option.value
                                ? "#fff"
                                : theme.text,
                          },
                        ]}
                      >
                        {option.label}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}
          </Card>

          <Card style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: `${EarthyColors.clayRed}20` },
                  ]}
                >
                  <Feather
                    name="alert-triangle"
                    size={20}
                    color={EarthyColors.clayRed}
                  />
                </View>
                <View style={styles.settingText}>
                  <ThemedText style={styles.settingTitle}>
                    Streak Warnings
                  </ThemedText>
                  <ThemedText
                    style={[styles.settingDesc, { color: theme.textSecondary }]}
                  >
                    Alert when your streak is at risk
                  </ThemedText>
                </View>
              </View>
              <Switch
                value={settings.streakWarnings}
                onValueChange={(value) => handleToggle("streakWarnings", value)}
                trackColor={{ false: theme.border, true: EarthyColors.clayRed }}
                thumbColor="#fff"
              />
            </View>
          </Card>

          <Card style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: `${EarthyColors.gold}20` },
                  ]}
                >
                  <Feather name="sun" size={20} color={EarthyColors.gold} />
                </View>
                <View style={styles.settingText}>
                  <ThemedText style={styles.settingTitle}>
                    Motivational Messages
                  </ThemedText>
                  <ThemedText
                    style={[styles.settingDesc, { color: theme.textSecondary }]}
                  >
                    Receive Stoic wisdom and encouragement
                  </ThemedText>
                </View>
              </View>
              <Switch
                value={settings.motivationalMessages}
                onValueChange={(value) =>
                  handleToggle("motivationalMessages", value)
                }
                trackColor={{ false: theme.border, true: EarthyColors.gold }}
                thumbColor="#fff"
              />
            </View>
          </Card>
        </>
      ) : null}

      <View style={styles.infoCard}>
        <Feather name="info" size={16} color={theme.textSecondary} />
        <ThemedText style={[styles.infoText, { color: theme.textSecondary }]}>
          Notifications help you stay consistent. We recommend enabling at least
          the daily reminder for best results.
        </ThemedText>
      </View>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  settingCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  settingInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: Spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  settingDesc: {
    fontSize: 13,
  },
  sectionTitle: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  timeSelector: {
    borderTopWidth: 1,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
  },
  timeSelectorLabel: {
    fontSize: 13,
    marginBottom: Spacing.sm,
  },
  timeOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  timeOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  timeOptionText: {
    fontSize: 13,
    fontWeight: "500",
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    padding: Spacing.md,
    marginTop: Spacing.lg,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
});

import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const NOTIFICATION_SETTINGS_KEY = "@streakproof:notification_settings";

export interface NotificationSettings {
  enabled: boolean;
  dailyReminder: boolean;
  dailyReminderTime: string;
  streakWarnings: boolean;
  motivationalMessages: boolean;
}

export const defaultNotificationSettings: NotificationSettings = {
  enabled: false,
  dailyReminder: true,
  dailyReminderTime: "09:00",
  streakWarnings: true,
  motivationalMessages: true,
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "web") {
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === "granted";
}

export async function getNotificationSettings(): Promise<NotificationSettings> {
  try {
    const stored = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    if (stored) {
      return { ...defaultNotificationSettings, ...JSON.parse(stored) };
    }
    return defaultNotificationSettings;
  } catch {
    return defaultNotificationSettings;
  }
}

export async function saveNotificationSettings(settings: NotificationSettings): Promise<void> {
  await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));

  if (settings.enabled && settings.dailyReminder) {
    await scheduleDailyReminder(settings.dailyReminderTime);
  } else {
    await cancelAllScheduledNotifications();
  }
}

export async function scheduleDailyReminder(timeString: string): Promise<void> {
  if (Platform.OS === "web") return;

  await cancelAllScheduledNotifications();

  const [hours, minutes] = timeString.split(":").map(Number);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Time to check in",
      body: "Keep your streak alive. Open StreakProof and log your progress.",
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: hours,
      minute: minutes,
    },
  });
}

export async function cancelAllScheduledNotifications(): Promise<void> {
  if (Platform.OS === "web") return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function sendStreakWarning(commitmentTitle: string, currentStreak: number): Promise<void> {
  if (Platform.OS === "web") return;

  const settings = await getNotificationSettings();
  if (!settings.enabled || !settings.streakWarnings) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Streak at risk",
      body: `Your ${currentStreak}-day streak for "${commitmentTitle}" needs attention. Don't let it slip.`,
      sound: true,
    },
    trigger: null,
  });
}

export async function sendMotivationalMessage(message: string): Promise<void> {
  if (Platform.OS === "web") return;

  const settings = await getNotificationSettings();
  if (!settings.enabled || !settings.motivationalMessages) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Your daily spark",
      body: message,
      sound: true,
    },
    trigger: null,
  });
}

export async function sendStreakMilestone(commitmentTitle: string, streak: number): Promise<void> {
  if (Platform.OS === "web") return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Milestone reached",
      body: `${streak} days strong on "${commitmentTitle}". You're building something real.`,
      sound: true,
    },
    trigger: null,
  });
}

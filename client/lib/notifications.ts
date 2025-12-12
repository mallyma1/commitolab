import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { apiRequest } from "@/lib/query-client";

const NOTIFICATION_SETTINGS_KEY = "@streakproof:notification_settings";
const PUSH_TOKEN_KEY = "@streakproof:push_token";

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

export async function saveNotificationSettings(
  settings: NotificationSettings
): Promise<void> {
  await AsyncStorage.setItem(
    NOTIFICATION_SETTINGS_KEY,
    JSON.stringify(settings)
  );

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

export async function sendStreakWarning(
  commitmentTitle: string,
  currentStreak: number
): Promise<void> {
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

export async function sendStreakMilestone(
  commitmentTitle: string,
  streak: number
): Promise<void> {
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

export async function getExpoPushToken(): Promise<string | null> {
  if (Platform.OS === "web") return null;

  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    return tokenData.data;
  } catch (error) {
    console.log("Could not get push token:", error);
    return null;
  }
}

export async function registerPushToken(): Promise<string | null> {
  if (Platform.OS === "web") return null;

  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return null;

  const token = await getExpoPushToken();
  if (!token) return null;

  const storedToken = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
  if (storedToken === token) {
    return token;
  }

  try {
    await apiRequest("POST", "/api/push-tokens", {
      token,
      platform: Platform.OS,
      deviceId: Constants.deviceId,
    });
    await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
    return token;
  } catch (error) {
    console.log("Failed to register push token:", error);
    return null;
  }
}

export async function unregisterPushToken(): Promise<void> {
  if (Platform.OS === "web") return;

  const storedToken = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
  if (!storedToken) return;

  try {
    await apiRequest(
      "DELETE",
      `/api/push-tokens/${encodeURIComponent(storedToken)}`
    );
    await AsyncStorage.removeItem(PUSH_TOKEN_KEY);
  } catch (error) {
    console.log("Failed to unregister push token:", error);
  }
}

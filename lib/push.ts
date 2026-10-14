/**
 * Push notification registration (Expo).
 *
 * `registerForPushNotifications()` runs after sign-in (lib/session.tsx). It
 * explains why we'd like to send notifications, asks for permission, fetches
 * this device's Expo push token, and saves it via `api.registerPushToken`. The
 * Cloud Functions then send new-post and deadline reminders to that token.
 *
 * Push needs a development/production build with FCM configured on Android
 * (google-services.json) — tokens aren't issued in Expo Go or on simulators.
 */

import { Alert, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { api } from "@/lib/api";

let cachedToken: string | null = null;

// If the user taps "Not now" on our explainer, wait a week before asking again.
const PROMPT_DISMISSED_KEY = "push-prompt-dismissed-at";
const REASK_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

// Show notifications even while the app is in the foreground; without this,
// Android silently drops the banner when the app is open.
if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/**
 * Explain the value before the one-shot OS prompt (iOS only lets us ask once).
 * Resolves true if the user wants notifications.
 */
async function explainAndConfirm(): Promise<boolean> {
  try {
    const dismissedAt = Number(await AsyncStorage.getItem(PROMPT_DISMISSED_KEY));
    if (dismissedAt && Date.now() - dismissedAt < REASK_AFTER_MS) return false;
  } catch {
    // storage unavailable — just ask
  }
  const accepted = await new Promise<boolean>((resolve) => {
    Alert.alert(
      "Stay on top of your classes",
      "classd can notify you when your class rep posts a task or announcement, and remind you before work is due.",
      [
        { text: "Not now", style: "cancel", onPress: () => resolve(false) },
        { text: "Turn on", onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
  if (!accepted) {
    await AsyncStorage.setItem(PROMPT_DISMISSED_KEY, String(Date.now())).catch(() => {});
  }
  return accepted;
}

export async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === "web") return null;

  // Physical devices always work. Emulators can receive push too, but only if
  // they run a Google Play Services system image — so we allow them in dev
  // (e.g. an Android Studio emulator) and only hard-block in production builds.
  if (!Device.isDevice && !__DEV__) return null;

  const { status: existing, canAskAgain } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (existing !== "granted") {
    if (!canAskAgain || !(await explainAndConfirm())) return null;
    status = (await Notifications.requestPermissionsAsync()).status;
  }
  if (status !== "granted") return null;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  let token: string | null = null;
  try {
    token = (await Notifications.getExpoPushTokenAsync()).data;
  } catch (e) {
    // Most common cause on Android: the build has no FCM config
    // (google-services.json) or the emulator lacks Google Play Services.
    console.warn("[push] getExpoPushTokenAsync failed:", e);
    return null;
  }

  if (token && token !== cachedToken) {
    try {
      await api.registerPushToken(token);
    } catch (e) {
      console.warn("[push] failed to save token:", e);
    }
    cachedToken = token;
  }
  return token;
}

/** Remove this device's token from the backend (call on sign-out). */
export async function unregisterForPushNotifications(): Promise<void> {
  if (!cachedToken) return;
  try {
    await api.unregisterPushToken(cachedToken);
  } finally {
    cachedToken = null;
  }
}

/**
 * Where a tapped notification should take the user, from the `data` the Cloud
 * Functions attach (see functions/src/index.ts). Null if it isn't ours.
 */
export function routeForNotification(
  data: Record<string, unknown> | undefined,
): { pathname: "/(tabs)/task/[id]" | "/(tabs)/class/[id]"; params: { id: string } } | null {
  if (!data) return null;
  const str = (v: unknown) => (typeof v === "string" && v ? v : undefined);
  // new-task push carries taskId; deadline reminders carry kind + docId
  const taskId = str(data.taskId) ?? (data.kind === "task" ? str(data.docId) : undefined);
  if (taskId) return { pathname: "/(tabs)/task/[id]", params: { id: taskId } };
  // announcements and materials open their class
  const classId = str(data.classId);
  if (classId) return { pathname: "/(tabs)/class/[id]", params: { id: classId } };
  return null;
}

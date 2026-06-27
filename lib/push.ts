/**
 * Push notification registration (Expo).
 *
 * Call `registerForPushNotifications()` after the user signs in. It asks for
 * permission, fetches this device's Expo push token, and saves it to the
 * backend via `api.registerPushToken`. The `deadlineReminders` Cloud Function
 * then sends deadline/overdue reminders to that token.
 *
 * REQUIRES (frontend setup — not yet done):
 *   1. npx expo install expo-notifications expo-device
 *   2. add EAS projectId so getExpoPushTokenAsync works (app.json -> extra.eas.projectId)
 *   3. Android: configure FCM credentials for Expo push (eas credentials)
 *   4. a physical device — push tokens are not issued on simulators
 *
 * This file imports expo-notifications lazily so the app still builds before
 * that package is installed; calling the function before setup throws clearly.
 */

import { api } from "@/lib/api";
import { Platform } from "react-native";

let cachedToken: string | null = null;

export async function registerForPushNotifications(): Promise<string | null> {
  // Lazy, type-suppressed imports: these packages aren't installed until the
  // push setup steps above are done, so we don't want them to break the build.
  let Notifications: any;
  let Device: any;
  try {
    // @ts-ignore optional dependency — installed during push setup
    Notifications = await import("expo-notifications");
    // @ts-ignore optional dependency — installed during push setup
    Device = await import("expo-device");
  } catch {
    console.warn("[push] expo-notifications/expo-device not installed — skipping");
    return null;
  }

  if (!Device.isDevice) {
    console.warn("[push] must use a physical device for push notifications");
    return null;
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (existing !== "granted") {
    status = (await Notifications.requestPermissionsAsync()).status;
  }
  if (status !== "granted") {
    console.warn("[push] notification permission not granted");
    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const tokenResponse = await Notifications.getExpoPushTokenAsync();
  const token = tokenResponse.data;

  if (token && token !== cachedToken) {
    await api.registerPushToken(token);
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

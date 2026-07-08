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

import { Platform } from "react-native";
import { api } from "@/lib/api";

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

  // Show notifications even while the app is in the foreground; without this,
  // Android silently drops the banner when the app is open.
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  // Physical devices always work. Emulators can receive push too, but only if
  // they run a Google Play Services system image — so we allow them in dev
  // (e.g. an Android Studio emulator) and only hard-block in production builds.
  if (!Device.isDevice && !__DEV__) {
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

  let token: string | null = null;
  try {
    const tokenResponse = await Notifications.getExpoPushTokenAsync();
    token = tokenResponse.data;
    console.log("[push] Expo push token:", token);
  } catch (e) {
    // Most common cause on Android: the build has no FCM config
    // (google-services.json) or the emulator lacks Google Play Services.
    console.warn("[push] getExpoPushTokenAsync failed:", e);
    return null;
  }

  if (token && token !== cachedToken) {
    try {
      await api.registerPushToken(token);
      console.log("[push] token saved to Firestore");
    } catch (e) {
      console.warn("[push] failed to save token to Firestore:", e);
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

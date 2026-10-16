// Firebase client initialization for the mobile app.
//
// All values come from EXPO_PUBLIC_* env vars so they are bundled into the
// client at build time (see .env.example). Firebase web API keys are not
// secrets — access is controlled by Firestore security rules — but we
// still keep them in env so different builds (dev/staging/prod) can point at
// different projects.
//
// NOTE: `getAnalytics` is intentionally NOT used here — it is web-only and
// throws in React Native. Use a native analytics SDK later if needed.

import { Platform } from "react-native";
import Constants from "expo-constants";
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { connectAuthEmulator, getAuth, initializeAuth, type Auth } from "firebase/auth";
// getReactNativePersistence ships only in firebase's React Native build, so the
// browser type definitions TypeScript resolves don't list it. The import is
// valid at runtime under Metro/Expo.
// @ts-ignore
import { getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { connectFirestoreEmulator, getFirestore, type Firestore } from "firebase/firestore";
import { connectFunctionsEmulator, getFunctions, type Functions } from "firebase/functions";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Avoid re-initializing on Fast Refresh.
const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Persist the auth session across app restarts using AsyncStorage on native.
// `initializeAuth` may only be called once per app; on Fast Refresh (or on web,
// where getReactNativePersistence is undefined) we fall back to getAuth().
function resolveAuth(): Auth {
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    return getAuth(app);
  }
}

export const auth: Auth = resolveAuth();
export const db: Firestore = getFirestore(app);
export const functions: Functions = getFunctions(app);

/**
 * Local development against the Firebase Emulator Suite (`pnpm emulators`),
 * enabled with EXPO_PUBLIC_USE_EMULATOR=1 (`pnpm start:emulator`). Nothing
 * touches the live project, so it's free and safe to break.
 *
 * The emulators run on your computer. The app reaches them at the same address
 * it loads its JavaScript from (Expo's hostUri), which works for the Android
 * emulator and for a phone on the same Wi-Fi. EXPO_PUBLIC_EMULATOR_HOST
 * overrides it.
 */
export const usingEmulator = process.env.EXPO_PUBLIC_USE_EMULATOR === "1";

function emulatorHost(): string {
  if (process.env.EXPO_PUBLIC_EMULATOR_HOST) return process.env.EXPO_PUBLIC_EMULATOR_HOST;
  const devServer = Constants.expoConfig?.hostUri?.split(":")[0];
  if (devServer) return devServer;
  // the Android emulator sees the host computer at 10.0.2.2
  return Platform.OS === "android" ? "10.0.2.2" : "localhost";
}

// connect*Emulator may only run once per instance; a module-level flag on
// globalThis survives Fast Refresh re-running this file.
const g = globalThis as { __classdEmulatorConnected?: boolean };
if (usingEmulator && !g.__classdEmulatorConnected) {
  const host = emulatorHost();
  connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
  connectFirestoreEmulator(db, host, 8080);
  connectFunctionsEmulator(functions, host, 5001);
  g.__classdEmulatorConnected = true;
  console.info(`[firebase] using local emulators at ${host}`);
}

export default app;

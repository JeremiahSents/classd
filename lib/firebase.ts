// Firebase client initialization for the mobile app.
//
// All values come from EXPO_PUBLIC_* env vars so they are bundled into the
// client at build time (see .env.example). Firebase web API keys are not
// secrets — access is controlled by Firestore/Storage security rules — but we
// still keep them in env so different builds (dev/staging/prod) can point at
// different projects.
//
// NOTE: `getAnalytics` is intentionally NOT used here — it is web-only and
// throws in React Native. Use a native analytics SDK later if needed.

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, initializeAuth, type Auth } from "firebase/auth";
// getReactNativePersistence ships only in firebase's React Native build, so the
// browser type definitions TypeScript resolves don't list it. The import is
// valid at runtime under Metro/Expo.
// @ts-ignore
import { getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

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
  } catch (e: any) {
    // Expected during Fast Refresh, but if it happens on fresh launch, persistence drops!
    if (e.code !== "auth/already-initialized") {
      console.error("Firebase Auth persistence failed to initialize:", e);
    }
    return getAuth(app);
  }
}

export const auth: Auth = resolveAuth();
export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);

export default app;

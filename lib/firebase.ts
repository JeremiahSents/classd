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
import { getAuth, type Auth } from "firebase/auth";
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

// TODO(backend): for persisted auth across app restarts, install
// `@react-native-async-storage/async-storage` and switch to
// `initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) })`.
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);

export default app;

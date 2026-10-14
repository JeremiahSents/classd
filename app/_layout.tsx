import "../global.css";

import { useEffect } from "react";
import { Platform } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ClassesProvider } from "@/lib/classes-store";
import { SessionProvider } from "@/lib/session";
import { ToastProvider } from "@/components/ui/toast";
import { NotificationRouter } from "@/components/navigation/notification-router";

// Keep the native splash visible until the first screen is ready.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <SafeAreaProvider>
      <SessionProvider>
        <ClassesProvider>
          <ToastProvider>
            <StatusBar style="dark" />
            {Platform.OS !== "web" ? <NotificationRouter /> : null}
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="(admin)" />
              <Stack.Screen name="privacy" />
            </Stack>
          </ToastProvider>
        </ClassesProvider>
      </SessionProvider>
    </SafeAreaProvider>
  );
}

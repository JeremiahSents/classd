import "../global.css";

import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ClassesProvider } from "@/lib/classes-store";
import { SessionProvider } from "@/lib/session";

// Keep the native splash visible until the first screen is ready.
SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ duration: 300, fade: true });

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <SafeAreaProvider>
      <SessionProvider>
        <ClassesProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="class/[id]" />
            <Stack.Screen name="unit/[id]" />
          </Stack>
        </ClassesProvider>
      </SessionProvider>
    </SafeAreaProvider>
  );
}

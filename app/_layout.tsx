import "../global.css";

import { useEffect } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { Stack, type ErrorBoundaryProps } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ClassesProvider } from "@/lib/classes-store";
import { SessionProvider } from "@/lib/session";
import { ToastProvider } from "@/components/ui/toast";
import { NotificationRouter } from "@/components/navigation/notification-router";

// Keep the native splash visible until the first screen is ready.
SplashScreen.preventAutoHideAsync();

// Shown instead of a blank screen if any screen throws while rendering.
// expo-router picks this export up automatically.
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  useEffect(() => {
    console.error("[app] unhandled render error", error);
  }, [error]);

  return (
    <SafeAreaProvider>
      <View className="flex-1 items-center justify-center gap-4 bg-background px-8">
        <Text className="text-5xl">😵</Text>
        <Text className="text-center text-xl font-bold text-foreground">
          Something went wrong
        </Text>
        <Text className="text-center text-sm text-muted-foreground">
          The app hit an unexpected error. Try again — if it keeps happening, restart the app.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={retry}
          className="mt-2 h-12 items-center justify-center rounded-xl bg-primary px-8 active:opacity-90"
        >
          <Text className="text-base font-semibold text-primary-foreground">Try again</Text>
        </Pressable>
      </View>
    </SafeAreaProvider>
  );
}

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

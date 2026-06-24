import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Logo } from "@/components/ui/logo";
import { useSession } from "@/lib/session";

export default function Splash() {
  const router = useRouter();
  const { loading, isAuthenticated } = useSession();
  // hold the splash for a brief minimum so it doesn't flash on fast auth resolves
  const [minTimePassed, setMinTimePassed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinTimePassed(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (loading || !minTimePassed) return;
    // signed in -> app; signed out -> auth flow
    router.replace(isAuthenticated ? "/(tabs)" : "/register");
  }, [loading, minTimePassed, isAuthenticated, router]);

  return (
    <View className="flex-1 items-center justify-center gap-5 bg-primary">
      <StatusBar style="light" />
      <Logo size={120} tintColor="#ffffff" />
      <Text className="text-3xl font-bold tracking-tight text-primary-foreground">
        classd
      </Text>
    </View>
  );
}

import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Logo } from "@/components/ui/logo";
import { useSession } from "@/lib/session";

export default function Splash() {
  const router = useRouter();
  const { loading, isAuthenticated, role } = useSession();
  // hold the splash for a brief minimum so it doesn't flash on fast auth resolves
  const [minTimePassed, setMinTimePassed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinTimePassed(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (loading || !minTimePassed) return;
    if (!isAuthenticated) {
      router.replace("/login");
    } else if (role === "admin") {
      // cast: expo-router's typed routes regenerate for (admin) on next `expo start`
      router.replace("/(admin)" as never);
    } else {
      router.replace("/(tabs)");
    }
  }, [loading, minTimePassed, isAuthenticated, role, router]);

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

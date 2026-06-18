import { useEffect } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Logo } from "@/components/logo";

export default function Splash() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/register");
    }, 1800);
    return () => clearTimeout(timer);
  }, [router]);

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

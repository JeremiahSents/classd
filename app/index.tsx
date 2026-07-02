import { useSession } from "@/lib/session";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ActivityIndicator, Image, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Welcome() {
  const router = useRouter();
  const { loading, isAuthenticated, role } = useSession();
  // hold the splash for a brief minimum so it doesn't flash on fast auth resolves
  const [minTimePassed, setMinTimePassed] = useState(false);

  // Signed-in users skip the welcome screen and go straight to the app.
  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace("/(tabs)");
    }
  }, [loading, isAuthenticated, router]);

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
    <View className="flex-1 bg-[#5645E6]">
      <StatusBar style="light" />
      <SafeAreaView className="flex-1">
        <View className="flex-1 items-center justify-center px-8">
          <Image
            source={require("@/assets/images/white-classd.png")}
            resizeMode="contain"
            style={{ width: 128, height: 128 }}
          />

          <Text className="mt-7 text-4xl font-bold tracking-tight text-white">
            Classd
          </Text>
          <Text className="mt-3 text-center text-lg leading-7 text-white/80">
            Your academics.{"\n"}All in one place.
          </Text>
        </View>

        <View className="gap-4 px-7 pb-4">
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/register")}
            className="h-14 items-center justify-center rounded-2xl bg-white active:opacity-90"
          >
            <Text className="text-base font-semibold text-[#4636CE]">
              Get Started
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/login")}
            className="h-12 items-center justify-center active:opacity-70"
          >
            <Text className="text-base font-semibold text-white">Log In</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

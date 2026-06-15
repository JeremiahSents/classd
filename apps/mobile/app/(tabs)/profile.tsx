import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LogOut } from "lucide-react-native";
import { Button } from "@/components/ui/button";

export default function Profile() {
  const router = useRouter();

  function handleSignOut() {
    // TODO: clear auth session
    router.replace("/login");
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="flex-1 gap-8 px-6 pt-2">
        <Text className="text-2xl font-bold text-foreground">Profile</Text>

        <View className="items-center gap-4 pt-6">
          <View className="h-24 w-24 items-center justify-center rounded-full bg-primary">
            <Text className="text-3xl font-bold text-primary-foreground">JS</Text>
          </View>
          <View className="items-center gap-1">
            <Text className="text-xl font-semibold text-foreground">
              Jeremiah Sentomero
            </Text>
            <Text className="text-base text-muted-foreground">
              sentomerojeremy@gmail.com
            </Text>
          </View>
        </View>

        <View className="mt-auto pb-32">
          <Button
            label="Sign out"
            variant="outline"
            leftIcon={<LogOut size={20} color="#111" />}
            onPress={handleSignOut}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

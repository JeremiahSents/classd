import { useEffect, useState } from "react";
import { Pressable, ScrollView, Switch, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "nativewind";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowLeft01Icon,
  Moon02Icon,
  Notification01Icon,
} from "@hugeicons/core-free-icons";
import { goBackOrProfile } from "@/lib/navigation";

const NOTIFICATIONS_KEY = "classd.settings.allowNotifications";
const DARK_THEME_KEY = "classd.settings.darkTheme";

export default function AppSettingsScreen() {
  const router = useRouter();
  const { colorScheme, setColorScheme } = useColorScheme();
  const [allowNotifications, setAllowNotifications] = useState(false);
  const [darkTheme, setDarkTheme] = useState(colorScheme === "dark");

  useEffect(() => {
    let mounted = true;
    async function loadSettings() {
      const [savedNotifications, savedDarkTheme] = await Promise.all([
        AsyncStorage.getItem(NOTIFICATIONS_KEY),
        AsyncStorage.getItem(DARK_THEME_KEY),
      ]);
      if (!mounted) return;
      if (savedNotifications !== null) {
        setAllowNotifications(savedNotifications === "true");
      }
      if (savedDarkTheme !== null) {
        const enabled = savedDarkTheme === "true";
        setDarkTheme(enabled);
        setColorScheme(enabled ? "dark" : "light");
      }
    }
    loadSettings().catch(() => {});
    return () => {
      mounted = false;
    };
  }, [setColorScheme]);

  async function toggleNotifications(value: boolean) {
    setAllowNotifications(value);
    await AsyncStorage.setItem(NOTIFICATIONS_KEY, String(value));
  }

  async function toggleDarkTheme(value: boolean) {
    setDarkTheme(value);
    setColorScheme(value ? "dark" : "light");
    await AsyncStorage.setItem(DARK_THEME_KEY, String(value));
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="flex-row items-center justify-between px-5 py-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => goBackOrProfile(router)}
          className="h-10 w-10 items-center justify-center rounded-full bg-secondary active:opacity-80"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={21} color="#64748b" />
        </Pressable>
        <Text className="text-lg font-black text-foreground">App settings</Text>
        <View className="h-10 w-10" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-6 pb-12 pt-6"
      >
        <View className="gap-3 rounded-3xl border border-border bg-card p-2">
          <SettingSwitchRow
            title="Allow notifications"
            description="Class updates, tasks, and reminders."
            icon={Notification01Icon}
            value={allowNotifications}
            onValueChange={toggleNotifications}
          />
          <View className="mx-4 h-px bg-border" />
          <SettingSwitchRow
            title="Dark theme"
            description="Use a darker interface across the app."
            icon={Moon02Icon}
            value={darkTheme}
            onValueChange={toggleDarkTheme}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingSwitchRow({
  title,
  description,
  icon,
  value,
  onValueChange,
}: {
  title: string;
  description: string;
  icon: any;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View className="min-h-[82px] flex-row items-center justify-between gap-4 rounded-2xl px-4 py-4">
      <View className="min-w-0 flex-1 flex-row items-center gap-3">
        <View className="h-11 w-11 items-center justify-center rounded-2xl bg-secondary">
          <HugeiconsIcon icon={icon} size={22} color="#4f46e5" />
        </View>
        <View className="min-w-0 flex-1 gap-1">
          <Text className="text-base font-bold text-foreground">{title}</Text>
          <Text className="text-sm leading-5 text-muted-foreground">
            {description}
          </Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "#e5e7eb", true: "#c7d2fe" }}
        thumbColor={value ? "#4f46e5" : "#ffffff"}
        ios_backgroundColor="#e5e7eb"
      />
    </View>
  );
}

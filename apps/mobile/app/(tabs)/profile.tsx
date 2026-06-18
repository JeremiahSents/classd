import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowRight01Icon,
  BookOpen01Icon,
  CheckmarkCircle02Icon,
  Logout01Icon,
  Settings01Icon,
  UserEdit01Icon,
  UserSwitchIcon,
} from "@hugeicons/core-free-icons";
import { useSession } from "@/lib/session";
import { useClasses } from "@/lib/classes-store";

interface SettingsItem {
  label: string;
  icon: any;
  onPress: () => void;
  destructive?: boolean;
}

export default function Profile() {
  const router = useRouter();
  const { role, firstName, email, switchRole } = useSession();
  const { classes, tasks, enrolledClassIds, isTaskComplete } = useClasses();

  function handleSignOut() {
    // TODO: clear auth session
    router.replace("/(auth)/register");
  }

  const isLecturer = role === "lecturer";

  // Dummy stats
  const activeClasses = isLecturer ? classes.length : enrolledClassIds.length;
  const pendingTasks = isLecturer
    ? tasks.length // for lecturer, total tasks set
    : tasks.filter(
        (t) => enrolledClassIds.includes(t.classId) && !isTaskComplete(t.id),
      ).length;

  const items: SettingsItem[] = [
    {
      label: isLecturer ? "Switch to student view" : "Switch to lecturer view",
      icon: UserSwitchIcon,
      onPress: () => switchRole(),
    },
    {
      label: "Edit Profile",
      icon: UserEdit01Icon,
      onPress: () => {},
    },
    {
      label: "App Settings",
      icon: Settings01Icon,
      onPress: () => {},
    },
    {
      label: "Sign Out",
      icon: Logout01Icon,
      onPress: handleSignOut,
      destructive: true,
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView
        contentContainerClassName="px-6 pb-32 pt-8"
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center gap-4">
          <Image
            source={`https://api.dicebear.com/7.x/avataaars/png?seed=${firstName}`}
            style={{ width: 100, height: 100, borderRadius: 50 }}
            contentFit="cover"
            className="bg-secondary"
          />
          <View className="items-center gap-1">
            <Text className="text-2xl font-bold text-foreground">
              {firstName}
            </Text>
            <Text className="text-sm font-medium text-muted-foreground">
              {email}
            </Text>
            <View className="mt-1 rounded-full bg-primary/10 px-3 py-1">
              <Text className="text-xs font-bold capitalize tracking-wide text-primary">
                {role} account
              </Text>
            </View>
          </View>
        </View>

        <View className="mt-8 flex-row gap-4">
          <View className="flex-1 items-center justify-center rounded-2xl border border-border bg-card py-5">
            <HugeiconsIcon icon={BookOpen01Icon} size={28} color="#4f46e5" />
            <Text className="mt-3 text-2xl font-black text-foreground">
              {activeClasses}
            </Text>
            <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {activeClasses === 1 ? "Active Class" : "Active Classes"}
            </Text>
          </View>
          <View className="flex-1 items-center justify-center rounded-2xl border border-border bg-card py-5">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={28} color="#22c55e" />
            <Text className="mt-3 text-2xl font-black text-foreground">
              {pendingTasks}
            </Text>
            <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Pending Tasks
            </Text>
          </View>
        </View>

        <View className="mt-8 gap-1.5 rounded-3xl border border-border bg-card p-2">
          {items.map((item, i) => (
            <Pressable
              key={i}
              accessibilityRole="button"
              onPress={item.onPress}
              className="flex-row items-center justify-between rounded-2xl px-4 py-3.5 active:bg-secondary"
            >
              <View className="flex-row items-center gap-3">
                <HugeiconsIcon
                  icon={item.icon}
                  size={22}
                  color={item.destructive ? "#ef4444" : "#64748b"}
                />
                <Text
                  className={`text-base font-medium ${
                    item.destructive ? "text-red-500" : "text-foreground"
                  }`}
                >
                  {item.label}
                </Text>
              </View>
              <HugeiconsIcon icon={ArrowRight01Icon} size={20} color="#cbd5e1" />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

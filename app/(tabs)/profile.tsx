import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowRight01Icon,
  BookOpen01Icon,
  CheckmarkCircle02Icon,
  CrownIcon,
  Logout01Icon,
  Settings01Icon,
  UserEdit01Icon,
  Camera02Icon,
} from "@hugeicons/core-free-icons";
import { useSession } from "@/lib/session";
import { useHomeData } from "@/lib/hooks/use-home-data";
import { AvatarPickerModal } from "@/components/modals/avatar-picker-modal";

interface SettingsItem {
  id: string;
  label: string;
  icon: any;
  onPress: () => void;
  destructive?: boolean;
}

export default function Profile() {
  const router = useRouter();
  const { user, name, email, avatarUrl, updateAvatar, signOut } = useSession();
  const { classes, tasks, completedTaskIds } = useHomeData();

  const [avatarPickerVisible, setAvatarPickerVisible] = useState(false);

  async function handleSignOut() {
    await signOut().catch(() => {});
    router.replace("/(auth)/register");
  }

  function handleAvatarSelect(url: string) {
    updateAvatar(url).catch(() => {});
  }

  const activeClasses = classes.length;
  const managedClasses = user
    ? classes.filter((c) => c.ownerId === user.id || c.classRepId === user.id).length
    : 0;
  const pendingTasks = tasks.filter((t) => !completedTaskIds.includes(t.id)).length;
  const profileBadge =
    managedClasses > 0
      ? `Rep for ${managedClasses} ${managedClasses === 1 ? "class" : "classes"}`
      : "Class member";

  const items: SettingsItem[] = [
    {
      id: "edit-profile",
      label: "Edit Profile",
      icon: UserEdit01Icon,
      onPress: () => router.push("/profile/edit"),
    },
    {
      id: "app-settings",
      label: "App Settings",
      icon: Settings01Icon,
      onPress: () => router.push("/profile/settings"),
    },
    {
      id: "sign-out",
      label: "Sign Out",
      icon: Logout01Icon,
      onPress: handleSignOut,
      destructive: true,
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <AvatarPickerModal
        visible={avatarPickerVisible}
        currentAvatarUrl={avatarUrl}
        onClose={() => setAvatarPickerVisible(false)}
        onSelect={handleAvatarSelect}
      />
      <ScrollView
        contentContainerClassName="px-6 pb-32 pt-8"
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center gap-4">
          <View className="relative">
            <View className="h-[100px] w-[100px] items-center justify-center overflow-hidden rounded-full bg-secondary border border-border">
              <Image
                source={{ uri: avatarUrl }}
                style={{ width: "85%", height: "85%" }}
                contentFit="contain"
              />
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Edit avatar"
              onPress={() => setAvatarPickerVisible(true)}
              className="absolute bottom-0 right-0 h-8 w-8 items-center justify-center rounded-full border-[3px] border-background bg-primary active:opacity-80"
            >
              <HugeiconsIcon icon={Camera02Icon} size={14} color="#ffffff" />
            </Pressable>
          </View>
          <View className="items-center gap-1">
            <Text className="text-2xl font-bold text-foreground">
              {name}
            </Text>
            <Text className="text-sm font-medium text-muted-foreground">
              {email}
            </Text>
            <View className="mt-1 rounded-full bg-primary/10 px-3 py-1">
              <Text className="text-xs font-bold capitalize tracking-wide text-primary">
                {profileBadge}
              </Text>
            </View>
          </View>
        </View>

        <View className="mt-8 flex-row gap-4">
          <View className="flex-1 items-center justify-center rounded-2xl border border-border bg-card py-5">
            <HugeiconsIcon icon={CrownIcon} size={28} color="#4f46e5" />
            <Text className="mt-3 text-2xl font-black text-foreground">
              {managedClasses}
            </Text>
            <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Managed Classes
            </Text>
          </View>
          <View className="flex-1 items-center justify-center rounded-2xl border border-border bg-card py-5">
            <HugeiconsIcon icon={BookOpen01Icon} size={28} color="#0f766e" />
            <Text className="mt-3 text-2xl font-black text-foreground">
              {activeClasses}
            </Text>
            <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Classes
            </Text>
          </View>
        </View>

        <View className="mt-4 items-center justify-center rounded-2xl border border-border bg-card py-5">
          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={28} color="#22c55e" />
          <Text className="mt-3 text-2xl font-black text-foreground">
            {pendingTasks}
          </Text>
          <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Pending Tasks
          </Text>
        </View>

        <View className="mt-8 gap-1.5 rounded-3xl border border-border bg-card p-2">
          {items.map((item, i) => (
            <Pressable
              key={item.id}
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

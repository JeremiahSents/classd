import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { HugeiconsIcon } from "@hugeicons/react-native";
import type { IconSvgElement } from "@hugeicons/react-native";
import {
  Notification01Icon,
  ArrowRight01Icon,
  HelpCircleIcon,
  InformationCircleIcon,
  Logout01Icon,
  PencilEdit01Icon,
  RepeatIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { useClasses } from "@/lib/classes-store";
import { useSession } from "@/lib/session";

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

interface SettingsItem {
  label: string;
  Icon: IconSvgElement;
  onPress?: () => void;
}

export default function Profile() {
  const router = useRouter();
  const { classes, units } = useClasses();
  const { role, name, email, switchRole } = useSession();

  function handleSignOut() {
    // TODO: clear auth session
    router.replace("/login");
  }

  const unitCount = units.length;
  const isLecturer = role === "lecturer";

  const items: SettingsItem[] = [
    {
      label: isLecturer ? "Switch to student view" : "Switch to lecturer view",
      Icon: RepeatIcon,
      onPress: switchRole,
    },
    { label: "Edit profile", Icon: PencilEdit01Icon },
    { label: "Notifications", Icon: Notification01Icon },
    { label: "Help & support", Icon: HelpCircleIcon },
    { label: "About classd", Icon: InformationCircleIcon },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView
        contentContainerClassName="gap-6 px-6 pb-32 pt-2"
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-2xl font-bold text-foreground">Profile</Text>

        {/* Identity */}
        <View className="items-center gap-4 pt-2">
          <View className="h-24 w-24 items-center justify-center rounded-full bg-primary">
            <Text className="text-3xl font-bold text-primary-foreground">
              {initials(name)}
            </Text>
          </View>
          <View className="items-center gap-1.5">
            <Text className="text-xl font-semibold text-foreground">{name}</Text>
            <Text className="text-base text-muted-foreground">{email}</Text>
            <View className="mt-1 rounded-full bg-primary/10 px-3 py-1">
              <Text className="text-xs font-semibold text-primary">
                {isLecturer ? "Lecturer" : "Student"}
              </Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View className="flex-row gap-3">
          <View className="flex-1 items-center gap-1 rounded-2xl border border-border bg-card py-5">
            <Text className="text-2xl font-bold text-foreground">{classes.length}</Text>
            <Text className="text-sm text-muted-foreground">
              Class{classes.length === 1 ? "" : "es"}
            </Text>
          </View>
          <View className="flex-1 items-center gap-1 rounded-2xl border border-border bg-card py-5">
            <Text className="text-2xl font-bold text-foreground">{unitCount}</Text>
            <Text className="text-sm text-muted-foreground">
              Unit{unitCount === 1 ? "" : "s"}
            </Text>
          </View>
        </View>

        {/* Settings list */}
        <View className="overflow-hidden rounded-2xl border border-border bg-card">
          {items.map((item, index) => (
            <Pressable
              key={item.label}
              accessibilityRole="button"
              onPress={item.onPress}
              className={`flex-row items-center gap-3 px-4 py-4 active:bg-secondary ${
                index > 0 ? "border-t border-border" : ""
              }`}
            >
              <HugeiconsIcon icon={item.Icon} size={20} color="#4f46e5" />
              <Text className="flex-1 text-base font-medium text-foreground">
                {item.label}
              </Text>
              <HugeiconsIcon icon={ArrowRight01Icon} size={18} color="#9ca3af" />
            </Pressable>
          ))}
        </View>

        <Button
          label="Sign out"
          variant="outline"
          leftIcon={<HugeiconsIcon icon={Logout01Icon} size={20} color="#111" />}
          onPress={handleSignOut}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

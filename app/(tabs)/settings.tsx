import { useState } from "react";
import { Pressable, ScrollView, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Delete02Icon,
  SecurityCheckIcon,
} from "@hugeicons/core-free-icons";
import { DeleteAccountModal } from "@/components/modals/delete-account-modal";
import { useToast } from "@/components/ui/toast";
import type { NotificationPrefs } from "@/lib/api";
import { useSession } from "@/lib/session";

const DEFAULT_PREFS: NotificationPrefs = { newPosts: true, reminders: true };

export default function Settings() {
  const router = useRouter();
  const toast = useToast();
  const { user, updateNotificationPrefs } = useSession();
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const prefs = user?.notificationPrefs ?? DEFAULT_PREFS;

  async function togglePref(key: keyof NotificationPrefs, value: boolean) {
    setSaving(true);
    try {
      await updateNotificationPrefs({ ...prefs, [key]: value });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save your settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="flex-row items-center gap-2 px-4 pb-1 pt-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full active:bg-secondary"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={26} color="#111" />
        </Pressable>
        <Text className="flex-1 text-xl font-bold text-foreground">Settings</Text>
      </View>

      <ScrollView
        contentContainerClassName="gap-8 px-6 pb-32 pt-4"
        showsVerticalScrollIndicator={false}
      >
        {/* Notifications */}
        <View className="gap-2">
          <Text className="px-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Notifications
          </Text>
          <View className="rounded-3xl border border-border bg-card p-2">
            <PrefRow
              label="New posts"
              hint="New tasks and announcements in your classes"
              value={prefs.newPosts}
              disabled={saving}
              onChange={(v) => togglePref("newPosts", v)}
            />
            <View className="mx-4 h-px bg-border" />
            <PrefRow
              label="Reminders"
              hint="When something is due soon or overdue"
              value={prefs.reminders}
              disabled={saving}
              onChange={(v) => togglePref("reminders", v)}
            />
          </View>
        </View>

        {/* About */}
        <View className="gap-2">
          <Text className="px-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            About
          </Text>
          <View className="rounded-3xl border border-border bg-card p-2">
            <Pressable
              accessibilityRole="button"
              // cast: typed routes regenerate for privacy on next `expo start`
              onPress={() => router.push("/privacy" as never)}
              className="flex-row items-center justify-between rounded-2xl px-4 py-3.5 active:bg-secondary"
            >
              <View className="flex-row items-center gap-3">
                <HugeiconsIcon icon={SecurityCheckIcon} size={22} color="#64748b" />
                <Text className="text-base font-medium text-foreground">Privacy policy</Text>
              </View>
              <HugeiconsIcon icon={ArrowRight01Icon} size={20} color="#cbd5e1" />
            </Pressable>
          </View>
        </View>

        {/* Danger zone */}
        <View className="gap-2">
          <Text className="px-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Account
          </Text>
          <View className="rounded-3xl border border-border bg-card p-2">
            <Pressable
              accessibilityRole="button"
              onPress={() => setDeleteVisible(true)}
              className="flex-row items-center gap-3 rounded-2xl px-4 py-3.5 active:bg-secondary"
            >
              <HugeiconsIcon icon={Delete02Icon} size={22} color="#ef4444" />
              <Text className="text-base font-medium text-red-500">Delete account</Text>
            </Pressable>
          </View>
        </View>

        <Text className="text-center text-xs text-muted-foreground">
          classd {Constants.expoConfig?.version ?? ""}
        </Text>
      </ScrollView>

      <DeleteAccountModal visible={deleteVisible} onClose={() => setDeleteVisible(false)} />
    </SafeAreaView>
  );
}

function PrefRow({
  label,
  hint,
  value,
  disabled,
  onChange,
}: {
  label: string;
  hint: string;
  value: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <View className="flex-row items-center gap-3 px-4 py-3">
      <View className="flex-1 gap-0.5">
        <Text className="text-base font-medium text-foreground">{label}</Text>
        <Text className="text-xs text-muted-foreground">{hint}</Text>
      </View>
      <Switch
        accessibilityLabel={label}
        value={value}
        disabled={disabled}
        onValueChange={onChange}
        trackColor={{ true: "#4f46e5" }}
      />
    </View>
  );
}

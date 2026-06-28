import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowLeft01Icon,
  Camera02Icon,
  Mail01Icon,
  UserAccountIcon,
} from "@hugeicons/core-free-icons";
import { AvatarPickerModal } from "@/components/modals/avatar-picker-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { goBackOrProfile } from "@/lib/navigation";
import { useSession } from "@/lib/session";

export default function EditProfileScreen() {
  const router = useRouter();
  const { name, email, avatarUrl, updateProfile } = useSession();
  const [draftName, setDraftName] = useState(name);
  const [draftAvatarUrl, setDraftAvatarUrl] = useState(avatarUrl);
  const [avatarPickerVisible, setAvatarPickerVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasChanges = useMemo(
    () => draftName.trim() !== name || draftAvatarUrl !== avatarUrl,
    [avatarUrl, draftAvatarUrl, draftName, name],
  );

  async function handleSave() {
    if (!draftName.trim()) {
      setError("Please enter your name.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await updateProfile({
        name: draftName.trim(),
        avatarUrl: draftAvatarUrl,
      });
      goBackOrProfile(router);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Profile update failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <AvatarPickerModal
        visible={avatarPickerVisible}
        currentAvatarUrl={draftAvatarUrl}
        onClose={() => setAvatarPickerVisible(false)}
        onSelect={setDraftAvatarUrl}
      />

      <View className="flex-row items-center justify-between px-5 py-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => goBackOrProfile(router)}
          className="h-10 w-10 items-center justify-center rounded-full bg-secondary active:opacity-80"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={21} color="#64748b" />
        </Pressable>
        <Text className="text-lg font-black text-foreground">Edit profile</Text>
        <View className="h-10 w-10" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-6 pb-12 pt-6"
      >
        <View className="items-center">
          <View className="relative">
            <View className="h-[116px] w-[116px] items-center justify-center overflow-hidden rounded-full border border-border bg-secondary">
              <Image
                source={{ uri: draftAvatarUrl }}
                style={{ width: "84%", height: "84%" }}
                contentFit="contain"
              />
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Choose avatar"
              onPress={() => setAvatarPickerVisible(true)}
              className="absolute bottom-1 right-1 h-9 w-9 items-center justify-center rounded-full border-[3px] border-background bg-primary active:opacity-80"
            >
              <HugeiconsIcon icon={Camera02Icon} size={16} color="#ffffff" />
            </Pressable>
          </View>
        </View>

        <View className="mt-8 gap-5">
          <View className="gap-3">
            <View className="flex-row items-center gap-2">
              <HugeiconsIcon icon={UserAccountIcon} size={18} color="#64748b" />
              <Text className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                Public details
              </Text>
            </View>
            <Input
              label="Name"
              value={draftName}
              onChangeText={setDraftName}
              autoCapitalize="words"
              autoComplete="name"
              autoCorrect={false}
            />
          </View>

          <View className="gap-3">
            <View className="flex-row items-center gap-2">
              <HugeiconsIcon icon={Mail01Icon} size={18} color="#64748b" />
              <Text className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                Account email
              </Text>
            </View>
            <Input
              label="Email"
              value={email}
              editable={false}
              selectTextOnFocus={false}
              containerClassName="opacity-70"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Text className="text-xs leading-5 text-muted-foreground">
              Email changes needs admin approval.
            </Text>
          </View>
        </View>

        {error ? (
          <Text className="pt-5 text-center text-sm font-semibold text-red-500">
            {error}
          </Text>
        ) : null}

        <Button
          label="Save changes"
          loading={saving}
          disabled={!hasChanges || saving}
          onPress={handleSave}
          className="mt-8"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { PlusSignIcon, UserGroupIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { CreateGroupModal } from "@/components/modals/create-group-modal";
import { api, type Group } from "@/lib/api";
import { useClasses } from "@/lib/classes-store";

export default function Groups() {
  const router = useRouter();
  const { classes } = useClasses();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [createVisible, setCreateVisible] = useState(false);

  const load = useCallback(async () => {
    try {
      setGroups(await api.listMyGroups());
    } catch {
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  // creating a group needs at least one class to attach it to
  const canCreate = classes.length > 0;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="flex-row items-center justify-between px-6 pb-4 pt-8">
        <Text className="text-2xl font-bold text-foreground">My groups</Text>
        {canCreate ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Create a group"
            onPress={() => setCreateVisible(true)}
            className="h-11 w-11 items-center justify-center rounded-full bg-primary active:opacity-90"
          >
            <HugeiconsIcon icon={PlusSignIcon} size={22} color="#fff" />
          </Pressable>
        ) : null}
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#4f46e5" />
        </View>
      ) : groups.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-4 px-6 pb-24">
          <HugeiconsIcon icon={UserGroupIcon} size={52} color="#cbd5e1" />
          <Text className="text-sm font-semibold text-muted-foreground">
            You&#39;re not in any groups yet
          </Text>
          {canCreate ? (
            <Button
              label="Create your first group"
              leftIcon={<HugeiconsIcon icon={PlusSignIcon} size={20} color="#fff" />}
              onPress={() => setCreateVisible(true)}
            />
          ) : (
            <Text className="max-w-xs text-center text-xs text-muted-foreground">
              Join a class first, then create or join a project group.
            </Text>
          )}
        </View>
      ) : (
        <ScrollView contentContainerClassName="gap-3 px-6 pb-32" showsVerticalScrollIndicator={false}>
          {groups.map((g) => (
            <Pressable
              key={g.id}
              accessibilityRole="button"
              onPress={() =>
                // cast: expo-router typed routes regenerate for group/[id] on next `expo start`
                router.push({ pathname: "/(tabs)/group/[id]", params: { id: g.id } } as never)
              }
              className="gap-1 rounded-2xl border border-border bg-card p-4 active:bg-secondary"
            >
              <Text className="text-base font-semibold text-foreground">{g.name}</Text>
              {g.memberCount !== undefined ? (
                <Text className="text-xs text-muted-foreground">
                  {g.memberCount} member{g.memberCount === 1 ? "" : "s"}
                </Text>
              ) : null}
            </Pressable>
          ))}
        </ScrollView>
      )}

      <CreateGroupModal
        classes={classes}
        visible={createVisible}
        onClose={() => setCreateVisible(false)}
        onCreated={load}
      />
    </SafeAreaView>
  );
}

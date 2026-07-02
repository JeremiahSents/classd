import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { UserGroupIcon } from "@hugeicons/core-free-icons";
import { api, type Group } from "@/lib/api";

export default function Groups() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="px-6 pb-4 pt-8">
        <Text className="text-2xl font-bold text-foreground">My groups</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#4f46e5" />
        </View>
      ) : groups.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-3 px-6 pb-24">
          <HugeiconsIcon icon={UserGroupIcon} size={52} color="#cbd5e1" />
          <Text className="text-sm font-semibold text-muted-foreground">
            You&#39;re not in any groups yet
          </Text>
          <Text className="max-w-xs text-center text-xs text-muted-foreground">
            Open a class, go to the Groups tab, and create or join a project group.
          </Text>
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
    </SafeAreaView>
  );
}

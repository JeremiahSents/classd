import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { api, type Class, type Member } from "@/lib/api";

export default function AdminClassDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [cls, setCls] = useState<Class | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [c, m] = await Promise.all([api.getClass(id), api.listMembers(id)]);
      setCls(c);
      setMembers(m);
    } catch {
      setCls(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function makeRep(memberId: string) {
    setBusyId(memberId);
    try {
      await api.assignClassRep(id, memberId);
      await load();
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#4f46e5" />
      </SafeAreaView>
    );
  }

  if (!cls) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <Text className="text-base text-muted-foreground">Class not found.</Text>
      </SafeAreaView>
    );
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
        <Text className="flex-1 text-xl font-bold text-foreground" numberOfLines={1}>
          {cls.name}
        </Text>
      </View>

      <View className="gap-1 px-6 pb-3">
        <Text className="font-mono text-xs text-muted-foreground">
          ID {cls.id.slice(0, 8).toUpperCase()}
        </Text>
        <Text className="text-xs text-muted-foreground">Join code {cls.code}</Text>
      </View>

      <Text className="px-6 pb-2 text-sm font-semibold text-foreground">
        Members ({members.length})
      </Text>

      <ScrollView
        contentContainerClassName="gap-3 px-6 pb-32"
        showsVerticalScrollIndicator={false}
      >
        {members.length === 0 ? (
          <Text className="text-muted-foreground">No members have joined yet.</Text>
        ) : (
          members.map((m) => {
            const isRep = cls.classRepId === m.id;
            return (
              <View
                key={m.id}
                className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-4"
              >
                <View className="flex-1">
                  <Text className="text-base font-medium text-foreground">
                    {m.name || m.email}
                  </Text>
                  <Text className="text-xs text-muted-foreground">{m.email}</Text>
                </View>
                {isRep ? (
                  <View className="rounded-full bg-primary/10 px-3 py-1.5">
                    <Text className="text-xs font-bold text-primary">Class Rep</Text>
                  </View>
                ) : (
                  <Pressable
                    accessibilityRole="button"
                    disabled={busyId === m.id}
                    onPress={() => makeRep(m.id)}
                    className="rounded-full border border-border px-3 py-1.5 active:bg-secondary"
                  >
                    <Text className="text-xs font-semibold text-foreground">
                      {busyId === m.id ? "..." : "Make rep"}
                    </Text>
                  </Pressable>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

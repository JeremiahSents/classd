import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { api, type Class, type Member } from "@/lib/api";
import { confirmAction } from "@/lib/confirm";

export default function AdminClassDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const toast = useToast();

  const [cls, setCls] = useState<Class | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<"code" | "delete" | null>(null);

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

  async function removeMember(member: Member) {
    const ok = await confirmAction({
      title: `Remove ${member.name || member.email}?`,
      message: "They'll lose access to this class until they join again with the code.",
      confirmLabel: "Remove",
    });
    if (!ok) return;
    setBusyId(member.id);
    try {
      await api.removeMember(id, member.id);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not remove member.");
    } finally {
      setBusyId(null);
    }
  }

  async function newJoinCode() {
    const ok = await confirmAction({
      title: "Generate a new join code?",
      message: "The old code stops working. Current members stay in the class.",
      confirmLabel: "Generate",
      destructive: false,
    });
    if (!ok) return;
    setBusyAction("code");
    try {
      setCls(await api.regenerateClassCode(id));
      toast.success("New join code ready", "🔑");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not change the code.");
    } finally {
      setBusyAction(null);
    }
  }

  async function deleteClass() {
    const ok = await confirmAction({
      title: `Delete ${cls?.name ?? "this class"}?`,
      message:
        "This permanently removes the class with all its members, tasks, announcements, materials and groups.",
      confirmLabel: "Delete class",
    });
    if (!ok) return;
    setBusyAction("delete");
    try {
      await api.deleteClass(id);
      toast.success("Class deleted", "🗑️");
      router.back();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete the class.");
      setBusyAction(null);
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
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${m.name || m.email}`}
                  disabled={busyId === m.id}
                  onPress={() => removeMember(m)}
                  className="rounded-full border border-red-300 px-3 py-1.5 active:bg-red-500/10"
                >
                  <Text className="text-xs font-semibold text-red-500">Remove</Text>
                </Pressable>
              </View>
            );
          })
        )}

        {/* Class settings */}
        <View className="mt-4 gap-3">
          <Button
            label="Generate new join code"
            variant="outline"
            loading={busyAction === "code"}
            disabled={busyAction !== null}
            onPress={newJoinCode}
          />
          <Pressable
            accessibilityRole="button"
            disabled={busyAction !== null}
            onPress={deleteClass}
            className={`h-14 items-center justify-center rounded-xl border border-red-300 active:bg-red-500/10 ${
              busyAction !== null ? "opacity-50" : ""
            }`}
          >
            <Text className="text-base font-semibold text-red-500">
              {busyAction === "delete" ? "Deleting..." : "Delete class"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

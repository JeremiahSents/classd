import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowLeft01Icon,
  CheckmarkCircle02Icon,
  CircleIcon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { SegmentedTabs } from "@/components/ui/segmented-tabs";
import { EmptySectionHint } from "@/components/ui/section-header";
import { AddGroupTaskModal } from "@/components/modals/add-group-task-modal";
import { api, type Group, type GroupTask, type Member } from "@/lib/api";
import { useSession } from "@/lib/session";

const TABS = ["Tasks", "Members"];

function dueLabel(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff < 0) return "Overdue";
  const days = Math.floor(diff / 86_400_000);
  if (days < 1) return "Due today";
  if (days < 2) return "Due tomorrow";
  return `Due in ${days} days`;
}

export default function GroupDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useSession();

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [tasks, setTasks] = useState<GroupTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const [addVisible, setAddVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [g, m, t] = await Promise.all([
        api.getGroup(id),
        api.listGroupMembers(id),
        api.listGroupTasks(id),
      ]);
      setGroup(g);
      setMembers(m);
      setTasks(t);
    } catch {
      setGroup(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const isMember = members.some((m) => m.id === user?.id);

  async function toggleMembership() {
    setBusy(true);
    try {
      if (isMember) await api.leaveGroup(id);
      else await api.joinGroup(id);
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function toggleTask(t: GroupTask) {
    const next = t.status === "completed" ? "pending" : "completed";
    setTasks((prev) => prev.map((x) => (x.id === t.id ? { ...x, status: next } : x)));
    try {
      await api.setGroupTaskStatus(id, t.id, next);
    } catch {
      await load();
    }
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#4f46e5" />
      </SafeAreaView>
    );
  }

  if (!group) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <Text className="text-base text-muted-foreground">Group not found.</Text>
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
          {group.name}
        </Text>
      </View>

      <View className="flex-row items-center justify-between px-6 pb-3">
        <Text className="text-sm text-muted-foreground">
          {members.length} member{members.length === 1 ? "" : "s"}
        </Text>
        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={toggleMembership}
          className={`rounded-full px-4 py-1.5 ${
            isMember ? "border border-border" : "bg-primary"
          } active:opacity-80`}
        >
          <Text className={`text-xs font-semibold ${isMember ? "text-foreground" : "text-primary-foreground"}`}>
            {isMember ? "Leave group" : "Join group"}
          </Text>
        </Pressable>
      </View>

      <View className="px-6 pb-2">
        <SegmentedTabs tabs={TABS} active={tab} onChange={setTab} />
      </View>

      {tab === 0 && isMember ? (
        <View className="px-6 pb-2">
          <Button
            label="Assign a task"
            variant="outline"
            leftIcon={<HugeiconsIcon icon={PlusSignIcon} size={18} color="#111" />}
            onPress={() => setAddVisible(true)}
          />
        </View>
      ) : null}

      <ScrollView contentContainerClassName="gap-3 px-6 pb-32 pt-2" showsVerticalScrollIndicator={false}>
        {tab === 0 ? (
          tasks.length > 0 ? (
            tasks.map((t) => (
              <View key={t.id} className="flex-row gap-3 rounded-2xl border border-border bg-card p-4">
                <Pressable
                  accessibilityRole="button"
                  disabled={!isMember}
                  onPress={() => toggleTask(t)}
                  hitSlop={8}
                  className="pt-0.5"
                >
                  <HugeiconsIcon
                    icon={t.status === "completed" ? CheckmarkCircle02Icon : CircleIcon}
                    size={22}
                    color={t.status === "completed" ? "#22c55e" : "#9ca3af"}
                  />
                </Pressable>
                <View className="flex-1 gap-1">
                  <Text
                    className={`text-base font-semibold text-foreground ${
                      t.status === "completed" ? "line-through opacity-60" : ""
                    }`}
                  >
                    {t.title}
                  </Text>
                  {t.description ? (
                    <Text className="text-sm text-muted-foreground" numberOfLines={2}>
                      {t.description}
                    </Text>
                  ) : null}
                  <Text className="text-xs text-muted-foreground">
                    {t.assignedToName} · {dueLabel(t.dueAt)}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <EmptySectionHint
              text={isMember ? "No tasks yet — assign one" : "No tasks yet"}
            />
          )
        ) : (
          members.length > 0 ? (
            members.map((m) => (
              <View key={m.id} className="rounded-2xl border border-border bg-card p-4">
                <Text className="text-base font-medium text-foreground">{m.name || m.email}</Text>
                {m.email ? <Text className="text-xs text-muted-foreground">{m.email}</Text> : null}
              </View>
            ))
          ) : (
            <EmptySectionHint text="No members yet" />
          )
        )}
      </ScrollView>

      <AddGroupTaskModal
        groupId={id}
        members={members}
        visible={addVisible}
        onClose={() => setAddVisible(false)}
        onCreated={load}
      />
    </SafeAreaView>
  );
}

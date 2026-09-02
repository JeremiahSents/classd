import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowLeft01Icon,
  CheckmarkCircle02Icon,
  CircleIcon,
  Search01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { SegmentedTabs } from "@/components/ui/segmented-tabs";
import type { GroupTaskItem } from "@/lib/types";
import { useClasses } from "@/lib/classes-store";

const FILTERS = ["All", "Pending", "Completed"];

function GroupTaskRow({
  task,
  onToggle,
  onPress,
}: {
  task: GroupTaskItem;
  onToggle: () => void;
  onPress?: () => void;
}) {
  return (
    <View className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-4">
      <Pressable
        accessibilityRole="button"
        onPress={onToggle}
        hitSlop={8}
        className="active:opacity-60"
      >
        <HugeiconsIcon
          icon={task.completed ? CheckmarkCircle02Icon : CircleIcon}
          size={24}
          color={task.completed ? "#22c55e" : "#9ca3af"}
        />
      </Pressable>
      <Pressable className="flex-1 gap-1 active:opacity-60" onPress={onPress} disabled={!onPress}>
        <Text
          className={`text-[15px] font-semibold ${
            task.completed ? "text-muted-foreground line-through" : "text-foreground"
          }`}
          numberOfLines={1}
        >
          {task.title}
        </Text>
        <View className="flex-row items-center gap-1.5">
          <HugeiconsIcon icon={UserGroupIcon} size={12} color="#64748b" />
          <Text className="text-xs text-muted-foreground" numberOfLines={1}>
            {task.groupName} · {task.dueLabel}
            {task.assignedToName ? ` · ${task.assignedToName}` : ""}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

export default function GroupTasks() {
  const router = useRouter();
  const { groupTasks, toggleGroupTask } = useClasses();
  const [filter, setFilter] = useState(0); // 0 all, 1 pending, 2 completed
  const [search, setSearch] = useState("");

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return groupTasks.filter((t) => {
      if (filter === 1 && t.completed) return false;
      if (filter === 2 && !t.completed) return false;
      if (!q) return true;
      return (
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.groupName.toLowerCase().includes(q)
      );
    });
  }, [groupTasks, filter, search]);

  // group by the project group they belong to
  const grouped = useMemo(() => {
    const map = new Map<string, { name: string; className: string; tasks: GroupTaskItem[] }>();
    for (const t of visible) {
      const entry = map.get(t.groupId) ?? { name: t.groupName, className: t.className, tasks: [] };
      entry.tasks.push(t);
      map.set(t.groupId, entry);
    }
    return Array.from(map.entries());
  }, [visible]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="flex-row items-center gap-2 px-4 pb-2 pt-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full active:bg-secondary"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={26} color="#111" />
        </Pressable>
        <Text className="text-xl font-bold text-foreground">All group tasks</Text>
      </View>

      {/* Search */}
      <View className="px-6 pb-3">
        <View className="flex-row items-center gap-2 rounded-xl border border-border bg-secondary/50 px-3">
          <HugeiconsIcon icon={Search01Icon} size={18} color="#9ca3af" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search group tasks..."
            className="h-11 flex-1 text-base text-foreground"
            placeholderTextColor="#9ca3af"
            autoCapitalize="none"
          />
        </View>
      </View>

      {/* Completion-status filter */}
      <View className="px-6 pb-2">
        <SegmentedTabs tabs={FILTERS} active={filter} onChange={setFilter} />
      </View>

      {grouped.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-3 px-6 pb-24">
          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={48} color="#cbd5e1" />
          <Text className="text-sm font-semibold text-muted-foreground">
            {search ? "No group tasks match your search" : "All caught up!"}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerClassName="gap-4 px-6 pb-32 pt-2"
          showsVerticalScrollIndicator={false}
        >
          {grouped.map(([groupId, { name, className, tasks }]) => (
            <View key={groupId} className="gap-3">
              <Text className="text-xs font-black uppercase tracking-wider text-slate-900">
                {name || "Group"}
                {className ? <Text className="text-primary"> · {className}</Text> : null}{" "}
                <Text className="text-slate-400">({tasks.length})</Text>
              </Text>
              {tasks.map((t) => (
                <GroupTaskRow
                  key={t.id}
                  task={t}
                  onToggle={() => toggleGroupTask(t.groupId, t.id)}
                  onPress={() =>
                    router.push({ pathname: "/(tabs)/groups/group/[id]", params: { id: t.groupId } } as never)
                  }
                />
              ))}
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

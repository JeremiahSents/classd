import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowLeft01Icon,
  CheckmarkCircle02Icon,
  PlusSignIcon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { TaskRow } from "@/components/class/task-row";
import { QuickAddTaskModal } from "@/components/modals/quick-add-task-modal";
import { SegmentedTabs } from "@/components/ui/segmented-tabs";
import { useClasses } from "@/lib/classes-store";

const FILTERS = ["All", "Pending", "Completed"];

export default function Tasks() {
  const router = useRouter();
  const { tasks, classes, className, isTaskComplete, toggleTaskComplete } = useClasses();
  const [filter, setFilter] = useState(0); // 0 all, 1 pending, 2 completed
  const [search, setSearch] = useState("");
  const [addVisible, setAddVisible] = useState(false);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks.filter((t) => {
      const done = isTaskComplete(t.id);
      if (filter === 1 && done) return false;
      if (filter === 2 && !done) return false;
      if (!q) return true;
      return (
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        className(t.classId).toLowerCase().includes(q)
      );
    });
  }, [tasks, filter, search, isTaskComplete, className]);

  // group by class, per the document ("tasks are grouped by unit")
  const grouped = useMemo(() => {
    const map = new Map<string, typeof visible>();
    for (const t of visible) {
      const list = map.get(t.classId) ?? [];
      list.push(t);
      map.set(t.classId, list);
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
        <Text className="flex-1 text-xl font-bold text-foreground">All tasks</Text>
        {classes.length > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add task"
            onPress={() => setAddVisible(true)}
            className="h-10 w-10 items-center justify-center rounded-full bg-primary active:opacity-90"
          >
            <HugeiconsIcon icon={PlusSignIcon} size={20} color="#fff" />
          </Pressable>
        ) : null}
      </View>

      {/* Search */}
      <View className="px-6 pb-3">
        <View className="flex-row items-center gap-2 rounded-xl border border-border bg-secondary/50 px-3">
          <HugeiconsIcon icon={Search01Icon} size={18} color="#9ca3af" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search tasks..."
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
            {search ? "No tasks match your search" : "No tasks here"}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerClassName="gap-4 px-6 pb-32 pt-2"
          showsVerticalScrollIndicator={false}
        >
          {grouped.map(([classId, classTasks]) => (
            <View key={classId} className="gap-3">
              <Text className="text-xs font-black uppercase tracking-wider text-slate-900">
                {className(classId) || "Class"}{" "}
                <Text className="text-slate-400">({classTasks.length})</Text>
              </Text>
              {classTasks.map((t) => (
                <TaskRow
                  key={t.id}
                  title={t.title}
                  description={t.description}
                  dueLabel={t.dueLabel}
                  completed={isTaskComplete(t.id)}
                  onToggle={() => toggleTaskComplete(t.id)}
                  onPress={() =>
                    router.push({ pathname: "/(tabs)/task/[id]", params: { id: t.id } })
                  }
                />
              ))}
            </View>
          ))}
        </ScrollView>
      )}
      <QuickAddTaskModal
        classes={classes}
        visible={addVisible}
        onClose={() => setAddVisible(false)}
      />
    </SafeAreaView>
  );
}

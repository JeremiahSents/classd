import { Pressable, Text, View } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { CheckmarkCircle02Icon, UserGroupIcon } from "@hugeicons/core-free-icons";
import type { GroupTaskItem } from "@/lib/types";
import { SectionTitle } from "./section-title";

function Divider() {
  return <View className="mx-4 h-px bg-border/60" />;
}

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
    <View className="flex-row items-center gap-3 px-4 py-3.5">
      {/* Left — task info (tap to open the group) */}
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
            {task.groupName}
            {task.className ? ` · ${task.className}` : ""} · {task.dueLabel}
            {task.assignedToName ? ` · ${task.assignedToName}` : ""}
          </Text>
        </View>
      </Pressable>

      {/* Right — shared completion toggle */}
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: task.completed }}
        accessibilityLabel={`Mark "${task.title}" as ${task.completed ? "pending" : "completed"}`}
        onPress={onToggle}
        hitSlop={12}
        className="active:opacity-60"
      >
        {task.completed ? (
          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={26} color="#22c55e" strokeWidth={2} />
        ) : (
          <View className="h-[26px] w-[26px] rounded-full border-2 border-border" />
        )}
      </Pressable>
    </View>
  );
}

export function GroupTasksSection({
  tasks,
  onToggle,
  onTaskPress,
  onSeeAll,
}: {
  tasks: GroupTaskItem[];
  onToggle: (groupId: string, taskId: string) => void;
  onTaskPress?: (groupId: string) => void;
  onSeeAll?: () => void;
}) {
  if (tasks.length === 0) {
    return (
      <View className="gap-4">
        <SectionTitle title="Group tasks" count={0} onSeeAll={onSeeAll} />
        <View className="items-center gap-2 rounded-2xl border border-dashed border-border bg-card py-8">
          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={24} color="#22c55e" />
          <Text className="text-sm font-semibold text-muted-foreground">
            All caught up!
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="gap-4">
      <SectionTitle title="Group tasks" count={tasks.length} onSeeAll={onSeeAll} />
      <View className="overflow-hidden rounded-2xl">
        {tasks.map((task, index) => (
          <View key={task.id}>
            {index > 0 && <Divider />}
            <GroupTaskRow
              task={task}
              onToggle={() => onToggle(task.groupId, task.id)}
              onPress={onTaskPress ? () => onTaskPress(task.groupId) : undefined}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

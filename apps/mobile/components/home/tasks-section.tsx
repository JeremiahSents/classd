import { Pressable, Text, View } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import type { Task } from "@/lib/types";
import { SectionTitle } from "./section-title";

/* ------------------------------------------------------------------ */
/*  Urgency styling                                                   */
/* ------------------------------------------------------------------ */
function urgencyColor(dueLabel: string): string {
  const d = dueLabel.toLowerCase();
  if (d.includes("overdue")) return "#ef4444";
  if (d.includes("tomorrow")) return "#f59e0b";
  if (d.match(/[23] day/)) return "#f59e0b";
  return "#9ca3af";
}

/* ------------------------------------------------------------------ */
/*  Task row                                                          */
/* ------------------------------------------------------------------ */
function TaskRow({
  task,
  classLabel,
  completed,
  onToggle,
}: {
  task: Task;
  classLabel: string;
  completed: boolean;
  onToggle: () => void;
}) {
  const dotColor = urgencyColor(task.dueLabel);

  return (
    <View className="flex-row items-center gap-3 px-4 py-3.5">
      {/* Left — task info */}
      <View className="flex-1 gap-1">
        <Text
          className={`text-[15px] font-semibold ${
            completed
              ? "text-muted-foreground line-through"
              : "text-foreground"
          }`}
          numberOfLines={1}
        >
          {task.title}
        </Text>
        <View className="flex-row items-center gap-1.5">
          {!completed && (
            <View
              style={{ backgroundColor: dotColor }}
              className="h-1.5 w-1.5 rounded-full"
            />
          )}
          <Text className="text-xs text-muted-foreground" numberOfLines={1}>
            {task.dueLabel}
            {classLabel ? ` · ${classLabel}` : ""}
          </Text>
        </View>
      </View>

      {/* Right — checkbox */}
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: completed }}
        accessibilityLabel={`Mark "${task.title}" as ${completed ? "incomplete" : "complete"}`}
        onPress={onToggle}
        hitSlop={12}
        className="active:opacity-60"
      >
        {completed ? (
          <HugeiconsIcon
            icon={CheckmarkCircle02Icon}
            size={26}
            color="#22c55e"
            strokeWidth={2}
          />
        ) : (
          <View className="h-[26px] w-[26px] rounded-full border-2 border-border" />
        )}
      </Pressable>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Separator                                                         */
/* ------------------------------------------------------------------ */
function Divider() {
  return <View className="mx-4 h-px bg-border/60" />;
}

/* ------------------------------------------------------------------ */
/*  Section                                                           */
/* ------------------------------------------------------------------ */
export function TasksSection({
  tasks,
  className,
  isTaskComplete,
  toggleTaskComplete,
}: {
  tasks: Task[];
  className: (classId: string) => string;
  isTaskComplete: (taskId: string) => boolean;
  toggleTaskComplete: (taskId: string) => void;
}) {
  if (tasks.length === 0) {
    return (
      <View className="gap-4">
        <SectionTitle title="Your tasks" count={0} />
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
      <SectionTitle title="Your tasks" count={tasks.length} />
      <View className="overflow-hidden rounded-2xl">
        {tasks.map((task, index) => (
          <View key={task.id}>
            {index > 0 && <Divider />}
            <TaskRow
              task={task}
              classLabel={className(task.classId)}
              completed={isTaskComplete(task.id)}
              onToggle={() => toggleTaskComplete(task.id)}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

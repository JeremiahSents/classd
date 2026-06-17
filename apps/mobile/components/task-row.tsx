import { Pressable, Text, View } from "react-native";
import { CalendarClock, CheckCircle2, Circle } from "lucide-react-native";
import { TASK_TYPE_LABEL, type TaskType } from "@/lib/types";

interface TaskRowProps {
  title: string;
  description: string;
  type: TaskType;
  dueLabel: string;
  /** When provided, shows a completion toggle (student view). */
  completed?: boolean;
  onToggle?: () => void;
}

const TYPE_STYLES: Record<TaskType, string> = {
  assignment: "bg-primary/10 text-primary",
  cat: "bg-destructive/10 text-destructive",
  deadline: "bg-amber-500/10 text-amber-600",
};

export function TaskRow({
  title,
  description,
  type,
  dueLabel,
  completed,
  onToggle,
}: TaskRowProps) {
  const checkable = !!onToggle;

  return (
    <View
      className={`flex-row gap-3 rounded-2xl border border-border bg-card p-4 ${
        completed ? "opacity-60" : ""
      }`}
    >
      {checkable ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={completed ? "Mark incomplete" : "Mark complete"}
          onPress={onToggle}
          hitSlop={8}
          className="pt-0.5"
        >
          {completed ? (
            <CheckCircle2 size={22} color="#4f46e5" />
          ) : (
            <Circle size={22} color="#9ca3af" />
          )}
        </Pressable>
      ) : null}

      <View className="flex-1 gap-2">
        <View className="flex-row items-start justify-between gap-3">
          <Text
            className={`flex-1 text-base font-semibold text-foreground ${
              completed ? "line-through" : ""
            }`}
          >
            {title}
          </Text>
          <View className={`rounded-full px-2.5 py-1 ${TYPE_STYLES[type].split(" ")[0]}`}>
            <Text className={`text-xs font-semibold ${TYPE_STYLES[type].split(" ")[1]}`}>
              {TASK_TYPE_LABEL[type]}
            </Text>
          </View>
        </View>
        {description ? (
          <Text className="text-sm text-muted-foreground" numberOfLines={2}>
            {description}
          </Text>
        ) : null}
        <View className="flex-row items-center gap-1.5">
          <CalendarClock size={14} color="#71717a" />
          <Text className="text-xs font-medium text-muted-foreground">{dueLabel}</Text>
        </View>
      </View>
    </View>
  );
}

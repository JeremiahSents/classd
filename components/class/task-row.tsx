import { Pressable, Text, View } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  Appointment01Icon,
  CheckmarkCircle02Icon,
  CircleIcon,
} from "@hugeicons/core-free-icons";

interface TaskRowProps {
  title: string;
  description: string;
  dueLabel: string;
  /** When provided, shows a completion toggle (student view). */
  completed?: boolean;
  onToggle?: () => void;
  /** Tap the row body to open task details. */
  onPress?: () => void;
}

export function TaskRow({
  title,
  description,
  dueLabel,
  completed,
  onToggle,
  onPress,
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
            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={22} color="#4f46e5" />
          ) : (
            <HugeiconsIcon icon={CircleIcon} size={22} color="#9ca3af" />
          )}
        </Pressable>
      ) : null}

      <Pressable className="flex-1 gap-2 active:opacity-60" onPress={onPress} disabled={!onPress}>
        <View className="flex-row items-start justify-between gap-3">
          <Text
            className={`flex-1 text-base font-semibold text-foreground ${
              completed ? "line-through" : ""
            }`}
          >
            {title}
          </Text>
          <View className="rounded-full bg-primary/10 px-2.5 py-1">
            <Text className="text-xs font-semibold text-primary">Assignment</Text>
          </View>
        </View>
        {description ? (
          <Text className="text-sm text-muted-foreground" numberOfLines={2}>
            {description}
          </Text>
        ) : null}
        <View className="flex-row items-center gap-1.5">
          <HugeiconsIcon icon={Appointment01Icon} size={14} color="#71717a" />
          <Text className="text-xs font-medium text-muted-foreground">{dueLabel}</Text>
        </View>
      </Pressable>
    </View>
  );
}

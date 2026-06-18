import { ScrollView, Text, View } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import type { Task } from "@/lib/types";
import { SectionTitle } from "./section-title";

function TaskCard({
  task,
  index,
  unitName,
}: {
  task: Task;
  index: number;
  unitName: (unitId: string) => string;
}) {
  const palette = index % 2 === 0 ? "bg-rose-50" : "bg-emerald-50";
  const dot = index % 2 === 0 ? "bg-rose-400" : "bg-emerald-400";

  return (
    <View className={`w-36 gap-3 rounded-2xl p-4 ${palette}`}>
      <View className="gap-1">
        <Text className="text-[10px] font-semibold text-slate-400">Deadline</Text>
        <View className="flex-row items-center gap-1.5">
          <View className={`h-1.5 w-1.5 rounded-full ${dot}`} />
          <Text className="text-xs font-bold text-slate-500">{task.dueLabel}</Text>
        </View>
      </View>
      <Text className="text-sm font-bold leading-5 text-slate-800" numberOfLines={3}>
        {task.title}
      </Text>
      <Text className="text-xs text-slate-400" numberOfLines={1}>
        {unitName(task.unitId)}
      </Text>
    </View>
  );
}

export function TasksSection({
  tasks,
  unitName,
}: {
  tasks: Task[];
  unitName: (unitId: string) => string;
}) {
  return (
    <View className="gap-4">
      <SectionTitle title="Your tasks" count={tasks.length} />
      {tasks.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-3 pr-4"
        >
          {tasks.slice(0, 6).map((task, index) => (
            <TaskCard
              key={task.id}
              task={task}
              index={index}
              unitName={unitName}
            />
          ))}
        </ScrollView>
      ) : (
        <View className="items-center gap-2 rounded-2xl bg-emerald-50 p-5">
          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={24} color="#10b981" />
          <Text className="text-sm font-bold text-slate-700">No tasks due</Text>
        </View>
      )}
    </View>
  );
}

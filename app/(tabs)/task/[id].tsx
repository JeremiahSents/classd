import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  Appointment01Icon,
  ArrowLeft01Icon,
  CheckmarkCircle02Icon,
  CircleIcon,
} from "@hugeicons/core-free-icons";
import { TASK_TYPE_LABEL, type TaskType } from "@/lib/types";
import { useClasses } from "@/lib/classes-store";
import { useSession } from "@/lib/session";

const TYPE_STYLES: Record<TaskType, string> = {
  assignment: "bg-primary/10 text-primary",
  cat: "bg-destructive/10 text-destructive",
  deadline: "bg-amber-500/10 text-amber-600",
};

export default function TaskDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getTask, getClass, className, isTaskComplete, toggleTaskComplete } = useClasses();
  const { role, user } = useSession();

  const task = getTask(id);

  if (!task) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <Text className="text-base text-muted-foreground">Task not found.</Text>
      </SafeAreaView>
    );
  }

  const classroom = getClass(task.classId);
  const canManage = role === "admin" || classroom?.classRepId === user?.id;
  const completed = isTaskComplete(task.id);

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
        <Text className="text-base font-semibold text-muted-foreground">Task</Text>
      </View>

      <ScrollView
        contentContainerClassName="gap-5 px-6 pb-32 pt-3"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-start justify-between gap-3">
          <Text className="flex-1 text-2xl font-bold text-foreground">{task.title}</Text>
          <View className={`rounded-full px-3 py-1 ${TYPE_STYLES[task.type].split(" ")[0]}`}>
            <Text className={`text-xs font-semibold ${TYPE_STYLES[task.type].split(" ")[1]}`}>
              {TASK_TYPE_LABEL[task.type]}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-2">
          <HugeiconsIcon icon={Appointment01Icon} size={16} color="#71717a" />
          <Text className="text-sm font-medium text-muted-foreground">{task.dueLabel}</Text>
          {className(task.classId) ? (
            <Text className="text-sm text-muted-foreground">· {className(task.classId)}</Text>
          ) : null}
        </View>

        {task.description ? (
          <View className="gap-1.5">
            <Text className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Details
            </Text>
            <Text className="text-base leading-6 text-foreground">{task.description}</Text>
          </View>
        ) : null}

        {/* Members complete tasks; the class rep/admin doesn't tick their own. */}
        {!canManage ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => toggleTaskComplete(task.id)}
            className={`mt-2 h-14 flex-row items-center justify-center gap-3 rounded-xl ${
              completed ? "bg-secondary" : "bg-primary"
            } active:opacity-90`}
          >
            <HugeiconsIcon
              icon={completed ? CheckmarkCircle02Icon : CircleIcon}
              size={22}
              color={completed ? "#22c55e" : "#ffffff"}
            />
            <Text
              className={`text-base font-semibold ${
                completed ? "text-foreground" : "text-primary-foreground"
              }`}
            >
              {completed ? "Completed" : "Mark as complete"}
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  Appointment01Icon,
  ArrowLeft01Icon,
  CheckmarkCircle02Icon,
  CircleIcon,
  Delete02Icon,
  PencilEdit02Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { AddTaskModal } from "@/components/modals/add-task-modal";
import { useClasses } from "@/lib/classes-store";
import { useSession } from "@/lib/session";

export default function TaskDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    getTask,
    getClass,
    className,
    membersForClass,
    isTaskComplete,
    toggleTaskComplete,
    deleteTask,
  } = useClasses();
  const { role, user } = useSession();

  const [editVisible, setEditVisible] = useState(false);
  // two-tap confirm so it works identically on native and web
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const task = getTask(id);

  if (!task) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <Text className="text-base text-muted-foreground">Task not found.</Text>
      </SafeAreaView>
    );
  }

  const classroom = getClass(task.classId);
  const myMemberRole = membersForClass(task.classId).find((m) => m.id === user?.id)?.role;
  const canManage =
    role === "admin" || classroom?.classRepId === user?.id || myMemberRole === "classRep";
  const completed = isTaskComplete(task.id);

  async function handleDelete() {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    if (!task) return;
    setDeleting(true);
    try {
      await deleteTask(task.classId, task.id);
      router.back();
    } finally {
      setDeleting(false);
      setConfirmingDelete(false);
    }
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
        <Text className="flex-1 text-base font-semibold text-muted-foreground">Task</Text>
        {canManage ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Edit task"
            onPress={() => setEditVisible(true)}
            className="h-10 w-10 items-center justify-center rounded-full active:bg-secondary"
          >
            <HugeiconsIcon icon={PencilEdit02Icon} size={22} color="#111" />
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        contentContainerClassName="gap-5 px-6 pb-32 pt-3"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-start justify-between gap-3">
          <Text className="flex-1 text-2xl font-bold text-foreground">{task.title}</Text>
          <View className="rounded-full bg-primary/10 px-3 py-1">
            <Text className="text-xs font-semibold text-primary">Assignment</Text>
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
        ) : (
          <View className="mt-2 gap-3">
            <Button
              label="Edit task"
              variant="outline"
              leftIcon={<HugeiconsIcon icon={PencilEdit02Icon} size={18} color="#111" />}
              onPress={() => setEditVisible(true)}
            />
            <Pressable
              accessibilityRole="button"
              disabled={deleting}
              onPress={handleDelete}
              className={`h-14 flex-row items-center justify-center gap-3 rounded-xl border ${
                confirmingDelete ? "border-red-500 bg-red-500" : "border-red-300 bg-transparent"
              } active:opacity-80 ${deleting ? "opacity-50" : ""}`}
            >
              <HugeiconsIcon
                icon={Delete02Icon}
                size={18}
                color={confirmingDelete ? "#ffffff" : "#ef4444"}
              />
              <Text
                className={`text-base font-semibold ${
                  confirmingDelete ? "text-white" : "text-red-500"
                }`}
              >
                {deleting
                  ? "Deleting..."
                  : confirmingDelete
                    ? "Tap again to confirm"
                    : "Delete task"}
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      <AddTaskModal
        classId={task.classId}
        task={task}
        visible={editVisible}
        onClose={() => setEditVisible(false)}
      />
    </SafeAreaView>
  );
}

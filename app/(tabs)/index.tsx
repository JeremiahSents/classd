import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { PlusSignIcon, UserAdd01Icon } from "@hugeicons/core-free-icons";
import { BooksIcon } from "@/components/ui/books-icon";
import { Button } from "@/components/ui/button";
import { JoinClassModal } from "@/components/modals/join-class-modal";
import { QuickAddTaskModal } from "@/components/modals/quick-add-task-modal";
import { HomeHeader } from "@/components/home/home-header";
import { TasksSection } from "@/components/home/tasks-section";
import { GroupTasksSection } from "@/components/home/group-tasks-section";
import { UpdatesSection } from "@/components/home/updates-section";
import { useClasses } from "@/lib/classes-store";
import { useSession } from "@/lib/session";

/* ------------------------------------------------------------------ */
/*  Small helpers                                                     */
/* ------------------------------------------------------------------ */
function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function UserGreeting({ firstName }: { firstName: string }) {
  return (
    <View className="flex-1">
      <Text className="text-sm font-medium text-muted-foreground">{greeting()}</Text>
      <Text className="text-xl font-bold tracking-tight text-foreground">{firstName}</Text>
    </View>
  );
}

function JoinButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Join a class"
      onPress={onPress}
      className="h-11 w-11 items-center justify-center rounded-full bg-primary active:opacity-90"
    >
      <HugeiconsIcon icon={UserAdd01Icon} size={22} color="#fff" />
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/*  Home screen                                                       */
/* ------------------------------------------------------------------ */
export default function Home() {
  const router = useRouter();
  const {
    loading,
    classes,
    tasks,
    announcements,
    groupTasks,
    groupCount,
    className,
    membersForClass,
    isTaskComplete,
    toggleTaskComplete,
    toggleGroupTask,
    refresh,
  } = useClasses();
  const { firstName, user } = useSession();
  const [joinVisible, setJoinVisible] = useState(false);
  const [quickAddVisible, setQuickAddVisible] = useState(false);

  // Keep data fresh — e.g. after an admin assigns this user as a class rep.
  useFocusEffect(
    useCallback(() => {
      void refresh(true);
    }, [refresh]),
  );

  // Classes where this user is the assigned rep. Announcements and manage
  // controls still use this; task creation uses all enrolled classes below.
  const repClasses = classes.filter(
    (c) =>
      c.classRepId === user?.id ||
      membersForClass(c.id).find((m) => m.id === user?.id)?.role === "classRep",
  );
  const isEmpty = classes.length === 0;

  // Dashboard shows only outstanding work; "See all" opens the full, filterable list.
  const pendingTasks = tasks.filter((t) => !isTaskComplete(t.id)).slice(0, 5);
  const pendingGroupTasks = groupTasks.filter((t) => !t.completed).slice(0, 5);

  function navigateToTask(taskId: string) {
    router.push({ pathname: "/(tabs)/task/[id]", params: { id: taskId } });
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#4f46e5" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      {isEmpty ? (
        <View className="flex-1">
          <View className="flex-row items-center justify-between px-6 pt-4">
            <UserGreeting firstName={firstName} />
            <JoinButton onPress={() => setJoinVisible(true)} />
          </View>

          <View className="flex-1 items-center justify-center gap-8 px-6">
            <BooksIcon size={140} />
            <Button
              label="Join your first class"
              leftIcon={<HugeiconsIcon icon={UserAdd01Icon} size={20} color="#fff" />}
              onPress={() => setJoinVisible(true)}
            />
          </View>
        </View>
      ) : (
        <ScrollView
          contentContainerClassName="gap-8 px-6 pb-32 pt-2"
          showsVerticalScrollIndicator={false}
        >
          <HomeHeader firstName={firstName} />

          {/* Quick add task — available for the user's enrolled classes */}
          {classes.length > 0 ? (
            <Button
              label="Add task"
              variant="outline"
              leftIcon={<HugeiconsIcon icon={PlusSignIcon} size={20} color="#111" />}
              onPress={() => setQuickAddVisible(true)}
            />
          ) : null}

          <TasksSection
            tasks={pendingTasks}
            className={className}
            isTaskComplete={isTaskComplete}
            toggleTaskComplete={toggleTaskComplete}
            onTaskPress={navigateToTask}
            onSeeAll={() =>
              // cast: typed routes regenerate for tasks on next `expo start`
              router.push("/(tabs)/tasks" as never)
            }
          />

          {/* Group tasks — only for users who belong to at least one group */}
          {groupCount > 0 ? (
            <GroupTasksSection
              tasks={pendingGroupTasks}
              onToggle={toggleGroupTask}
              onTaskPress={(groupId) =>
                // cast: typed routes regenerate for group/[id] on next `expo start`
                router.push({ pathname: "/(tabs)/group/[id]", params: { id: groupId } } as never)
              }
              onSeeAll={() =>
                // cast: typed routes regenerate for group-tasks on next `expo start`
                router.push("/(tabs)/group-tasks" as never)
              }
            />
          ) : null}

          <UpdatesSection
            announcements={announcements}
            className={className}
            onSeeAll={() => router.push("/(tabs)/announcements")}
          />
        </ScrollView>
      )}

      <JoinClassModal visible={joinVisible} onClose={() => setJoinVisible(false)} />
      <QuickAddTaskModal
        classes={classes}
        visible={quickAddVisible}
        onClose={() => setQuickAddVisible(false)}
      />
    </SafeAreaView>
  );
}

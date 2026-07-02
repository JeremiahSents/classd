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
import { UpdatesSection } from "@/components/home/updates-section";
import { CreateClassModal } from "@/components/modals/create-class-modal";
import { JoinClassModal } from "@/components/modals/join-class-modal";
import { BooksIcon } from "@/components/ui/books-icon";
import { Button } from "@/components/ui/button";
import type { Class } from "@/lib/api";
import { api } from "@/lib/api";
import { useHomeData } from "@/lib/hooks/use-home-data";
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
    className,
    membersForClass,
    isTaskComplete,
    toggleTaskComplete,
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

  // Classes where this user is the assigned rep — they can quick-add tasks here.
  // Recognised via the class's classRepId or their member-doc role.
  const repClasses = classes.filter(
    (c) =>
      c.classRepId === user?.id ||
      membersForClass(c.id).find((m) => m.id === user?.id)?.role === "classRep",
  );
  const isEmpty = classes.length === 0;

  function navigateToClass(classId: string) {
    router.push(`/(tabs)/class/${classId}`);
  }

  function handleClassCreated(_cls: Class) {
    reload();
  }

  function handleClassJoined(_cls: Class) {
    reload();
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background" edges={["top"]}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

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
          {error || actionError ? (
            <Text className="px-6 pt-4 text-center text-sm font-medium text-red-500">
              {error ?? actionError}
            </Text>
          ) : null}

          <View className="flex-1 items-center justify-center gap-9 px-6">
            <BooksIcon size={150} />
            <View className="items-center gap-2">
              <Text className="text-center text-2xl font-black text-foreground">
                Start with a class
              </Text>
              <Text className="max-w-xs text-center text-sm leading-6 text-muted-foreground">
                Create a class or join an existing one with a code.
              </Text>
            </View>
            <View className="w-full max-w-sm items-center gap-4">
              <Button
                label="Create a class"
                className="h-15 w-full"
                leftIcon={<HugeiconsIcon icon={DashboardCircleAddIcon} size={24} color="#fff" />}
                onPress={() => setCreateVisible(true)}
              />
              <Pressable
                accessibilityRole="button"
                onPress={() => setJoinVisible(true)}
                hitSlop={8}
                className="active:opacity-60"
              >
                <Text className="text-sm font-bold text-primary">
                  Join with a code
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : (
        <ScrollView
          contentContainerClassName="gap-8 px-6 pb-32 pt-6"
          showsVerticalScrollIndicator={false}
        >
          <HomeHeader firstName={firstName} />

          {/* Quick add task — only for users who rep at least one class */}
          {repClasses.length > 0 ? (
            <Button
              label="Quick add task"
              variant="outline"
              leftIcon={<HugeiconsIcon icon={PlusSignIcon} size={20} color="#111" />}
              onPress={() => setQuickAddVisible(true)}
            />
          ) : null}

          <ClassSchedule
            classes={classes}
            onClassPress={navigateToClass}
            onNewClass={() => {}}
            onSeeAll={() => router.push("/(tabs)/classes")}
          />

          <TasksSection
            tasks={tasks}
            className={className}
            isTaskComplete={isTaskComplete}
            toggleTaskComplete={toggleTaskComplete}
            onTaskPress={navigateToTask}
            onSeeAll={() =>
              // cast: typed routes regenerate for tasks on next `expo start`
              router.push("/(tabs)/tasks" as never)
            }
          />

          <UpdatesSection
            announcements={announcements}
            className={className}
            onSeeAll={() => router.push("/(tabs)/announcements")}
          />
        </ScrollView>
      )}

      <JoinClassModal visible={joinVisible} onClose={() => setJoinVisible(false)} />
      <QuickAddTaskModal
        classes={repClasses}
        visible={quickAddVisible}
        onClose={() => setQuickAddVisible(false)}
      />
    </SafeAreaView>
  );
}

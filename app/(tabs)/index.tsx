import { ClassSchedule } from "@/components/home/class-schedule";
import { ClassesSection } from "@/components/home/classes-section";
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
import { DashboardCircleAddIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/* ------------------------------------------------------------------ */
/*  Home screen                                                       */
/* ------------------------------------------------------------------ */
export default function Home() {
  const router = useRouter();
  const {
    classes,
    tasks,
    announcements,
    completedTaskIds,
    loading,
    error,
    reload,
    reloadCompletions,
  } = useHomeData();
  const { firstName, avatarUrl } = useSession();
  const [createVisible, setCreateVisible] = useState(false);
  const [joinVisible, setJoinVisible] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const isEmpty = classes.length === 0;

  // className helper: map classId → class name for display
  const classNameMap = Object.fromEntries(classes.map((c) => [c.id, c.name]));
  const className = (classId: string) => classNameMap[classId] ?? "";

  async function handleToggleTask(taskId: string) {
    const isDone = completedTaskIds.includes(taskId);
    setActionError(null);
    try {
      await api.setTaskComplete(taskId, !isDone);
      reloadCompletions();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to update task.");
    }
  }

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

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      {isEmpty ? (
        <View className="flex-1">
          {/* Top header */}
          <View className="px-6 pt-2">
            <HomeHeader
              firstName={firstName}
              avatarUrl={avatarUrl}
              onAvatarPress={() => router.push("/(tabs)/profile")}
              onCreateClass={() => setCreateVisible(true)}
              onJoinClass={() => setJoinVisible(true)}
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
          {error || actionError ? (
            <Text className="text-center text-sm font-medium text-red-500">
              {error ?? actionError}
            </Text>
          ) : null}

          {/* 1. Greeting */}
          <HomeHeader
            firstName={firstName}
            avatarUrl={avatarUrl}
            onAvatarPress={() => router.push("/(tabs)/profile")}
            onCreateClass={() => setCreateVisible(true)}
            onJoinClass={() => setJoinVisible(true)}
          />

          {/* 2. Your classes */}
          <ClassesSection
            classes={classes}
            onClassPress={navigateToClass}
            onSeeAll={() => router.push("/(tabs)/classes")}
          />

          {/* 3. Today's schedule */}
          <ClassSchedule
            classes={classes}
            onClassPress={navigateToClass}
            onNewClass={() => setCreateVisible(true)}
            onSeeAll={() => router.push("/(tabs)/classes")}
          />

          {/* 4. Tasks checklist */}
          <TasksSection
            tasks={tasks}
            className={className}
            completedTaskIds={completedTaskIds}
            onToggle={handleToggleTask}
          />

          {/* 5. Announcements summary */}
          <UpdatesSection
            announcements={announcements}
            className={className}
          />
        </ScrollView>
      )}

      <CreateClassModal
        visible={createVisible}
        onClose={() => setCreateVisible(false)}
        onCreated={handleClassCreated}
      />
      <JoinClassModal
        visible={joinVisible}
        onClose={() => setJoinVisible(false)}
        onJoined={handleClassJoined}
      />
    </SafeAreaView>
  );
}

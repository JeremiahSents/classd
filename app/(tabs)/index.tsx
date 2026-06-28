import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { PlusSignIcon, UserAdd01Icon } from "@hugeicons/core-free-icons";
import { BooksIcon } from "@/components/ui/books-icon";
import { Button } from "@/components/ui/button";
import { CreateClassModal } from "@/components/modals/create-class-modal";
import { JoinClassModal } from "@/components/modals/join-class-modal";
import { AddMenu } from "@/components/modals/add-menu";
import { HomeHeader } from "@/components/home/home-header";
import { ClassSchedule } from "@/components/home/class-schedule";
import { TasksSection } from "@/components/home/tasks-section";
import { UpdatesSection } from "@/components/home/updates-section";
import { useHomeData } from "@/lib/hooks/use-home-data";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";
import type { Class } from "@/lib/api";

/* ------------------------------------------------------------------ */
/*  Small helpers                                                     */
/* ------------------------------------------------------------------ */
function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function UserGreeting({ size = "large" }: { size?: "small" | "large" }) {
  const nameClassName =
    size === "large"
      ? "text-3xl font-bold tracking-tight text-foreground"
      : "text-xl font-bold tracking-tight text-foreground";

  return (
    <View className="flex-1">
      <Text className="text-sm font-medium text-muted-foreground">
        {greeting()}
      </Text>
      <Text className={nameClassName}>{useSession().firstName}</Text>
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
    classes,
    tasks,
    announcements,
    completedTaskIds,
    loading,
    error,
    reload,
    reloadCompletions,
  } = useHomeData();
  const { role, firstName } = useSession();
  const [createVisible, setCreateVisible] = useState(false);
  const [joinVisible, setJoinVisible] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const isClassRep = role === "classRep";
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
          <View className="flex-row items-center justify-between px-6 pt-4">
            <View className="flex-1">
              <UserGreeting size="small" />
            </View>
            {isClassRep ? (
              <AddMenu onNewClass={() => setCreateVisible(true)} />
            ) : (
              <JoinButton onPress={() => setJoinVisible(true)} />
            )}
          </View>
          {error || actionError ? (
            <Text className="px-6 pt-4 text-center text-sm font-medium text-red-500">
              {error ?? actionError}
            </Text>
          ) : null}

          <View className="flex-1 items-center justify-center gap-8 px-6">
            <BooksIcon size={140} />
            <Button
              label={
                isClassRep
                  ? "Create your first class"
                  : "Join your first class"
              }
              leftIcon={
                isClassRep ? (
                  <HugeiconsIcon icon={PlusSignIcon} size={20} color="#fff" />
                ) : (
                  <HugeiconsIcon icon={UserAdd01Icon} size={20} color="#fff" />
                )
              }
              onPress={() =>
                isClassRep ? setCreateVisible(true) : setJoinVisible(true)
              }
            />
          </View>
        </View>
      ) : (
        <ScrollView
          contentContainerClassName="gap-8 px-6 pb-32 pt-2"
          showsVerticalScrollIndicator={false}
        >
          {error || actionError ? (
            <Text className="text-center text-sm font-medium text-red-500">
              {error ?? actionError}
            </Text>
          ) : null}

          {/* 1. Greeting */}
          <HomeHeader firstName={firstName} />

          {/* 2. Today's classes */}
          <ClassSchedule
            classes={classes}
            onClassPress={navigateToClass}
            onNewClass={() => setCreateVisible(true)}
            onSeeAll={() => router.push("/(tabs)/classes")}
          />

          {/* 3. Tasks checklist */}
          <TasksSection
            tasks={tasks}
            className={className}
            completedTaskIds={completedTaskIds}
            onToggle={handleToggleTask}
          />

          {/* 4. Announcements summary */}
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

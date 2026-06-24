import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
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
    className,
    getClass,
    enrolledClassIds,
    isTaskComplete,
    toggleTaskComplete,
  } = useClasses();
  const { role, firstName } = useSession();
  const [createVisible, setCreateVisible] = useState(false);
  const [joinVisible, setJoinVisible] = useState(false);

  const isClassRep = role === "classRep";

  // Class reps see everything; students see only what they're enrolled in.
  const visibleClasses = isClassRep
    ? classes
    : classes.filter((c) => enrolledClassIds.includes(c.id));
  const visibleTasks = isClassRep
    ? tasks
    : tasks.filter((t) => enrolledClassIds.includes(t.classId));
  const visibleAnnouncements = isClassRep
    ? announcements
    : announcements.filter((a) => enrolledClassIds.includes(a.classId));

  const isEmpty = visibleClasses.length === 0;

  function openPrimary() {
    if (isClassRep) setCreateVisible(true);
    else setJoinVisible(true);
  }

  function navigateToClass(classId: string) {
    router.push({ pathname: "/(tabs)/class/[id]", params: { id: classId } });
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
              onPress={openPrimary}
            />
          </View>
        </View>
      ) : (
        <ScrollView
          contentContainerClassName="gap-8 px-6 pb-32 pt-2"
          showsVerticalScrollIndicator={false}
        >
          {/* 1. Greeting */}
          <HomeHeader firstName={firstName} />

          {/* 2. Today's classes */}
          <ClassSchedule
            classes={visibleClasses}
            onClassPress={navigateToClass}
            onNewClass={() => setCreateVisible(true)}
            onSeeAll={() => router.push("/(tabs)/classes")}
          />

          {/* 3. Tasks checklist */}
          <TasksSection
            tasks={visibleTasks}
            className={className}
            isTaskComplete={isTaskComplete}
            toggleTaskComplete={toggleTaskComplete}
          />

          {/* 4. Announcements summary */}
          <UpdatesSection
            announcements={visibleAnnouncements}
            className={className}
          />
        </ScrollView>
      )}

      <CreateClassModal
        visible={createVisible}
        onClose={() => setCreateVisible(false)}
      />
      <JoinClassModal
        visible={joinVisible}
        onClose={() => setJoinVisible(false)}
      />
    </SafeAreaView>
  );
}

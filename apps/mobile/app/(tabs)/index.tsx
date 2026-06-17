import { useState } from "react";
import { Image } from "expo-image";
import { Pressable, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Plus, UserPlus } from "lucide-react-native";
import { BooksIcon } from "@/components/ui/books-icon";
import { Button } from "@/components/ui/button";
import { ClassCard } from "@/components/class-card";
import { CreateClassModal } from "@/components/create-class-modal";
import { JoinClassModal } from "@/components/join-class-modal";
import { AddMenu } from "@/components/add-menu";
import {
  SectionHeader,
  EmptySectionHint,
} from "@/components/section-header";
import { AssignmentRow, AnnouncementRow } from "@/components/list-row";
import { useClasses } from "@/lib/classes-store";
import { useSession } from "@/lib/session";
import { useTabBarScrollHandler } from "@/lib/tab-bar-scroll";

function JoinButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Join a class"
      onPress={onPress}
      className="h-11 w-11 items-center justify-center rounded-full bg-primary active:opacity-90"
    >
      <UserPlus size={22} color="#fff" />
    </Pressable>
  );
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function UserGreeting({ size = "large" }: { size?: "small" | "large" }) {
  const avatarSize = size === "large" ? 44 : 40;
  const nameClassName =
    size === "large"
      ? "text-3xl font-bold tracking-tight text-foreground"
      : "text-xl font-bold tracking-tight text-foreground";

  return (
    <View className="flex-row items-center gap-3">
      <View className="overflow-hidden rounded-full">
        <Image
          source={require("../../assets/images/logo.png")}
          style={{ height: avatarSize, width: avatarSize }}
          contentFit="cover"
        />
      </View>
      <View className="flex-1">
        <Text className="text-sm font-medium text-muted-foreground">
          {greeting()}
        </Text>
        <Text className={nameClassName}>{useSession().firstName}</Text>
      </View>
    </View>
  );
}

export default function Home() {
  const router = useRouter();
  const { classes, units, tasks, announcements, unitName, enrolledClassIds } =
    useClasses();
  const { role } = useSession();
  const [createVisible, setCreateVisible] = useState(false);
  const [joinVisible, setJoinVisible] = useState(false);
  const scrollHandler = useTabBarScrollHandler();

  const isLecturer = role === "lecturer";

  // Lecturers see everything; students see only what they're enrolled in.
  const visibleClasses = isLecturer
    ? classes
    : classes.filter((c) => enrolledClassIds.includes(c.id));
  const enrolledUnitIds = isLecturer
    ? null
    : new Set(
        units.filter((u) => enrolledClassIds.includes(u.classId)).map((u) => u.id),
      );
  const visibleTasks = enrolledUnitIds
    ? tasks.filter((t) => enrolledUnitIds.has(t.unitId))
    : tasks;
  const visibleAnnouncements = enrolledUnitIds
    ? announcements.filter((a) => enrolledUnitIds.has(a.unitId))
    : announcements;

  const isEmpty = visibleClasses.length === 0;

  function openPrimary() {
    if (isLecturer) setCreateVisible(true);
    else setJoinVisible(true);
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      {isEmpty ? (
        <View className="flex-1">
          {/* Top header fills the empty space and sets context */}
          <View className="flex-row items-center justify-between px-6 pt-4">
            <View className="flex-1">
              <UserGreeting size="small" />
            </View>
            {isLecturer ? (
              <AddMenu onNewClass={() => setCreateVisible(true)} />
            ) : (
              <JoinButton onPress={() => setJoinVisible(true)} />
            )}
          </View>

          <View className="flex-1 items-center justify-center gap-8 px-6">
            <BooksIcon size={140} />
            <Button
              label={isLecturer ? "Create your first class" : "Join your first class"}
              leftIcon={
                isLecturer ? (
                  <Plus size={20} color="#fff" />
                ) : (
                  <UserPlus size={20} color="#fff" />
                )
              }
              onPress={openPrimary}
            />
          </View>
        </View>
      ) : (
        <Animated.ScrollView
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          contentContainerClassName="gap-4 px-6 pb-32 pt-2"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-row items-start justify-between pb-2 pt-2">
            <View className="flex-1 gap-2">
              <UserGreeting />
            </View>
            {isLecturer ? (
              <AddMenu onNewClass={() => setCreateVisible(true)} />
            ) : (
              <JoinButton onPress={() => setJoinVisible(true)} />
            )}
          </View>

          {/* Classes — most recent few */}
          <SectionHeader
            title="Classes"
            actionLabel={visibleClasses.length > 3 ? "See all" : undefined}
            onAction={() => router.push("/(tabs)/classes")}
          />
          {visibleClasses.slice(0, 3).map((classroom) => (
            <ClassCard
              key={classroom.id}
              classroom={classroom}
              onPress={() =>
                router.push({ pathname: "/class/[id]", params: { id: classroom.id } })
              }
            />
          ))}

          {/* Assignments — recent across all units */}
          <SectionHeader title="Assignments" />
          {visibleTasks.length > 0 ? (
            visibleTasks.slice(0, 3).map((t) => (
              <AssignmentRow
                key={t.id}
                title={t.title}
                className={unitName(t.unitId)}
                dueLabel={t.dueLabel}
              />
            ))
          ) : (
            <EmptySectionHint text="No assignments yet" />
          )}

          {/* Announcements — recent across all units */}
          <SectionHeader title="Announcements" />
          {visibleAnnouncements.length > 0 ? (
            visibleAnnouncements.slice(0, 3).map((n) => (
              <AnnouncementRow
                key={n.id}
                title={n.title}
                className={unitName(n.unitId)}
                timeLabel={n.timeLabel}
              />
            ))
          ) : (
            <EmptySectionHint text="No announcements yet" />
          )}
        </Animated.ScrollView>
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

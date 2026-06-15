import { useState } from "react";
import { Image } from "expo-image";
import { Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Plus } from "lucide-react-native";
import { BooksIcon } from "@/components/ui/books-icon";
import { Button } from "@/components/ui/button";
import { ClassCard } from "@/components/class-card";
import { CreateClassModal } from "@/components/create-class-modal";
import { AddMenu } from "@/components/add-menu";
import {
  SectionHeader,
  EmptySectionHint,
} from "@/components/section-header";
import { AssignmentRow, AnnouncementRow } from "@/components/list-row";
import { useClasses } from "@/lib/classes-store";
import { useTabBarScrollHandler } from "@/lib/tab-bar-scroll";

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
        <Text className={nameClassName}>Jeremiah</Text>
      </View>
    </View>
  );
}

export default function Home() {
  const router = useRouter();
  const { classes, tasks, announcements, unitName } = useClasses();
  const [modalVisible, setModalVisible] = useState(false);
  const scrollHandler = useTabBarScrollHandler();

  const isEmpty = classes.length === 0;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      {isEmpty ? (
        <View className="flex-1">
          {/* Top header fills the empty space and sets context */}
          <View className="flex-row items-center justify-between px-6 pt-4">
            <View className="flex-1">
              <UserGreeting size="small" />
            </View>
            <AddMenu onNewClass={() => setModalVisible(true)} />
          </View>

          <View className="flex-1 items-center justify-center gap-8 px-6">
            <BooksIcon size={140} />
            <Button
              label="Create your first class"
              leftIcon={<Plus size={20} color="#fff" />}
              onPress={() => setModalVisible(true)}
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
            <AddMenu onNewClass={() => setModalVisible(true)} />
          </View>

          {/* Classes — most recent few */}
          <SectionHeader
            title="Classes"
            actionLabel={classes.length > 3 ? "See all" : undefined}
            onAction={() => router.push("/(tabs)/classes")}
          />
          {classes.slice(0, 3).map((classroom) => (
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
          {tasks.length > 0 ? (
            tasks.slice(0, 3).map((t) => (
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
          {announcements.length > 0 ? (
            announcements.slice(0, 3).map((n) => (
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
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
}

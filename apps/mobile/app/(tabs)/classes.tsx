import { useState } from "react";
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
import { useClasses } from "@/lib/classes-store";
import { useSession } from "@/lib/session";
import { useTabBarScrollHandler } from "@/lib/tab-bar-scroll";

export default function Classes() {
  const router = useRouter();
  const { classes, enrolledClassIds } = useClasses();
  const { role } = useSession();
  const [createVisible, setCreateVisible] = useState(false);
  const [joinVisible, setJoinVisible] = useState(false);
  const scrollHandler = useTabBarScrollHandler();

  const isLecturer = role === "lecturer";
  const visibleClasses = isLecturer
    ? classes
    : classes.filter((c) => enrolledClassIds.includes(c.id));
  const isEmpty = visibleClasses.length === 0;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 pb-4 pt-2">
        <Text className="text-2xl font-bold text-foreground">Classes</Text>
        {isLecturer ? (
          <AddMenu onNewClass={() => setCreateVisible(true)} />
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Join a class"
            onPress={() => setJoinVisible(true)}
            className="h-11 w-11 items-center justify-center rounded-full bg-primary active:opacity-90"
          >
            <UserPlus size={22} color="#fff" />
          </Pressable>
        )}
      </View>

      {isEmpty ? (
        <View className="flex-1 items-center justify-center gap-8 px-6 pb-24">
          <BooksIcon size={120} />
          <Button
            label={isLecturer ? "Create your first class" : "Join your first class"}
            leftIcon={
              isLecturer ? (
                <Plus size={20} color="#fff" />
              ) : (
                <UserPlus size={20} color="#fff" />
              )
            }
            onPress={() => (isLecturer ? setCreateVisible(true) : setJoinVisible(true))}
          />
        </View>
      ) : (
        <Animated.ScrollView
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          contentContainerClassName="gap-4 px-6 pb-32"
          showsVerticalScrollIndicator={false}
        >
          {visibleClasses.map((classroom) => (
            <ClassCard
              key={classroom.id}
              classroom={classroom}
              onPress={() =>
                router.push({ pathname: "/class/[id]", params: { id: classroom.id } })
              }
            />
          ))}
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

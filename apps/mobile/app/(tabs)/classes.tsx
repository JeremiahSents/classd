import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { PlusSignIcon, UserAdd01Icon } from "@hugeicons/core-free-icons";
import { BooksIcon } from "@/components/ui/books-icon";
import { Button } from "@/components/ui/button";
import { ClassCard } from "@/components/class/class-card";
import { CreateClassModal } from "@/components/modals/create-class-modal";
import { JoinClassModal } from "@/components/modals/join-class-modal";
import { AddMenu } from "@/components/modals/add-menu";
import { useClasses } from "@/lib/classes-store";
import { useSession } from "@/lib/session";

export default function Classes() {
  const router = useRouter();
  const { classes, enrolledClassIds } = useClasses();
  const { role } = useSession();
  const [createVisible, setCreateVisible] = useState(false);
  const [joinVisible, setJoinVisible] = useState(false);

  const isLecturer = role === "lecturer";
  const visibleClasses = isLecturer
    ? classes
    : classes.filter((c) => enrolledClassIds.includes(c.id));
  const isEmpty = visibleClasses.length === 0;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 pb-4 pt-8">
        <Text className="text-2xl font-bold text-foreground">Classes</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => (isLecturer ? setCreateVisible(true) : setJoinVisible(true))}
          className="h-11 w-11 items-center justify-center rounded-full bg-primary active:opacity-90"
        >
          {isLecturer ? (
            <HugeiconsIcon icon={PlusSignIcon} size={22} color="#fff" />
          ) : (
            <HugeiconsIcon icon={UserAdd01Icon} size={22} color="#fff" />
          )}
        </Pressable>
      </View>

      {isEmpty ? (
        <View className="flex-1 items-center justify-center gap-8 px-6 pb-24">
          <BooksIcon size={120} />
          <Button
            label={isLecturer ? "Create your first class" : "Join your first class"}
            leftIcon={
              isLecturer ? (
                <HugeiconsIcon icon={PlusSignIcon} size={20} color="#fff" />
              ) : (
                <HugeiconsIcon icon={UserAdd01Icon} size={20} color="#fff" />
              )
            }
            onPress={() => (isLecturer ? setCreateVisible(true) : setJoinVisible(true))}
          />
        </View>
      ) : (
        <ScrollView
          contentContainerClassName="gap-4 px-6 pb-32"
          showsVerticalScrollIndicator={false}
        >
          {visibleClasses.map((classroom) => (
            <ClassCard
              key={classroom.id}
              classroom={classroom}
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/class/[id]",
                  params: { id: classroom.id },
                })
              }
            />
          ))}
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

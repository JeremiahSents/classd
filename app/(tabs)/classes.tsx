import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { PlusSignIcon, UserAdd01Icon } from "@hugeicons/core-free-icons";
import { BooksIcon } from "@/components/ui/books-icon";
import { Button } from "@/components/ui/button";
import { ClassCard } from "@/components/class/class-card";
import { CreateClassModal } from "@/components/modals/create-class-modal";
import { JoinClassModal } from "@/components/modals/join-class-modal";
import { useApiClasses } from "@/lib/hooks/use-api-classes";
import { useSession } from "@/lib/session";
import type { Class } from "@/lib/api";

export default function Classes() {
  const router = useRouter();
  const { classes, loading, error, reload } = useApiClasses();
  const { role } = useSession();
  const [createVisible, setCreateVisible] = useState(false);
  const [joinVisible, setJoinVisible] = useState(false);

  const isClassRep = role === "classRep";
  const isEmpty = classes.length === 0;

  function handleClassCreated(_cls: Class) {
    reload();
  }

  function handleClassJoined(_cls: Class) {
    reload();
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 pb-4 pt-8">
        <Text className="text-2xl font-bold text-foreground">Classes</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => (isClassRep ? setCreateVisible(true) : setJoinVisible(true))}
          className="h-11 w-11 items-center justify-center rounded-full bg-primary active:opacity-90"
        >
          {isClassRep ? (
            <HugeiconsIcon icon={PlusSignIcon} size={22} color="#fff" />
          ) : (
            <HugeiconsIcon icon={UserAdd01Icon} size={22} color="#fff" />
          )}
        </Pressable>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center gap-3 px-6 pb-24">
          <Text className="text-center text-sm font-medium text-red-500">
            {error}
          </Text>
          <Button label="Try again" variant="outline" onPress={reload} />
        </View>
      ) : isEmpty ? (
        <View className="flex-1 items-center justify-center gap-8 px-6 pb-24">
          <BooksIcon size={120} />
          <Button
            label={isClassRep ? "Create your first class" : "Join your first class"}
            leftIcon={
              isClassRep ? (
                <HugeiconsIcon icon={PlusSignIcon} size={20} color="#fff" />
              ) : (
                <HugeiconsIcon icon={UserAdd01Icon} size={20} color="#fff" />
              )
            }
            onPress={() => (isClassRep ? setCreateVisible(true) : setJoinVisible(true))}
          />
        </View>
      ) : (
        <ScrollView
          contentContainerClassName="gap-4 px-6 pb-32"
          showsVerticalScrollIndicator={false}
        >
          {classes.map((classroom) => (
            <ClassCard
              key={classroom.id}
              classroom={classroom}
              onPress={() => router.push(`/(tabs)/class/${classroom.id}`)}
            />
          ))}
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

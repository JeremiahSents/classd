import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { CrownIcon, UserAdd01Icon } from "@hugeicons/core-free-icons";
import { BooksIcon } from "@/components/ui/books-icon";
import { Button } from "@/components/ui/button";
import { ClassCard } from "@/components/class/class-card";
import { CreateClassModal } from "@/components/modals/create-class-modal";
import { JoinClassModal } from "@/components/modals/join-class-modal";
import { useApiClasses } from "@/lib/hooks/use-api-classes";
import type { Class } from "@/lib/api";

export default function Classes() {
  const router = useRouter();
  const { classes, loading, error, reload } = useApiClasses();
  const [createVisible, setCreateVisible] = useState(false);
  const [joinVisible, setJoinVisible] = useState(false);

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
          accessibilityLabel="Join class"
          onPress={() => setJoinVisible(true)}
          className="h-11 w-11 items-center justify-center rounded-full bg-primary active:opacity-90"
        >
          <HugeiconsIcon icon={UserAdd01Icon} size={22} color="#fff" />
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
          <View className="items-center gap-2">
            <Text className="text-center text-2xl font-black text-foreground">
              Create or join a class
            </Text>
            <Text className="max-w-sm text-center text-sm leading-6 text-muted-foreground">
              Create a class to manage it as rep, or join with a code as a member.
            </Text>
          </View>
          <Button
            label="Create a class"
            leftIcon={<HugeiconsIcon icon={CrownIcon} size={20} color="#fff" />}
            onPress={() => setCreateVisible(true)}
          />
          <Pressable
            accessibilityRole="button"
            onPress={() => setJoinVisible(true)}
            className="active:opacity-70"
          >
            <Text className="text-sm font-bold text-primary">
              Have a code? Join a class
            </Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerClassName="gap-4 px-6 pb-32"
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            accessibilityRole="button"
            onPress={() => setCreateVisible(true)}
            className="gap-2 rounded-2xl border border-border bg-card p-5 active:bg-secondary"
          >
            <View className="flex-row items-center gap-3">
              <View className="h-11 w-11 items-center justify-center rounded-full bg-primary">
                <HugeiconsIcon icon={CrownIcon} size={22} color="#fff" />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-black text-foreground">
                  Create a class
                </Text>
                <Text className="text-sm leading-5 text-muted-foreground">
                  You will automatically become the class rep.
                </Text>
              </View>
            </View>
          </Pressable>
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

import { useState } from "react";
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
import { useClasses } from "@/lib/classes-store";
import { useTabBarScrollHandler } from "@/lib/tab-bar-scroll";

export default function Classes() {
  const router = useRouter();
  const { classes } = useClasses();
  const [modalVisible, setModalVisible] = useState(false);
  const scrollHandler = useTabBarScrollHandler();

  const isEmpty = classes.length === 0;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 pb-4 pt-2">
        <Text className="text-2xl font-bold text-foreground">Classes</Text>
        <AddMenu onNewClass={() => setModalVisible(true)} />
      </View>

      {isEmpty ? (
        <View className="flex-1 items-center justify-center gap-8 px-6 pb-24">
          <BooksIcon size={120} />
          <Button
            label="Create your first class"
            leftIcon={<Plus size={20} color="#fff" />}
            onPress={() => setModalVisible(true)}
          />
        </View>
      ) : (
        <Animated.ScrollView
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          contentContainerClassName="gap-4 px-6 pb-32"
          showsVerticalScrollIndicator={false}
        >
          {classes.map((classroom) => (
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
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
}

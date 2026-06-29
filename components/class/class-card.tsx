import { Pressable, Text, View, type PressableProps } from "react-native";
import { Image } from "expo-image";
import type { Class } from "@/lib/api";

interface ClassCardProps extends Omit<PressableProps, "children"> {
  classroom: Class;
}

export function ClassCard({ classroom, ...props }: ClassCardProps) {
  // Deterministic member count based on class id (15 to 34)
  const membersCount = (classroom.id.charCodeAt(classroom.id.length - 1) % 20) + 15;

  return (
    <Pressable
      accessibilityRole="button"
      className="relative h-[120px] w-full overflow-hidden rounded-[20px] active:opacity-90"
      {...props}
    >
      {/* Full Background Image */}
      <Image
        source={{ uri: classroom.coverUrl }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        contentFit="cover"
        transition={200}
      />
      {/* Gradient/Dark Overlay to ensure text readability */}
      <View className="absolute bottom-0 left-0 right-0 top-0 bg-black/40" />

      {/* Content */}
      <View className="flex-1 p-4 justify-center">
        <Text className="text-xl font-bold tracking-tight text-white mb-1.5" numberOfLines={1}>
          {classroom.name}
        </Text>

        <Text className="text-[14px] font-medium text-white/80" numberOfLines={1}>
          {membersCount} members
        </Text>
      </View>
    </Pressable>
  );
}

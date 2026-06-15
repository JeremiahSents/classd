import { Pressable, Text, View, type PressableProps } from "react-native";
import { Image } from "expo-image";
import type { Classroom } from "@/lib/classes";

interface ClassCardProps extends Omit<PressableProps, "children"> {
  classroom: Classroom;
}

export function ClassCard({ classroom, ...props }: ClassCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      className="overflow-hidden rounded-2xl border border-border bg-card active:opacity-90"
      {...props}
    >
      <Image
        source={{ uri: classroom.coverUrl }}
        style={{ width: "100%", height: 112 }}
        contentFit="cover"
        transition={200}
      />
      <View className="gap-1 p-4">
        <Text className="text-base font-semibold text-foreground" numberOfLines={1}>
          {classroom.name}
        </Text>
        <Text className="text-sm tracking-widest text-muted-foreground">
          {classroom.code}
        </Text>
      </View>
    </Pressable>
  );
}

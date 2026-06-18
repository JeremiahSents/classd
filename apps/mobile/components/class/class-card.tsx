import { Pressable, Text, View, type PressableProps } from "react-native";
import { Image } from "expo-image";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Folder01Icon, ChartHistogramIcon, MoreVerticalIcon } from "@hugeicons/core-free-icons";
import type { Classroom } from "@/lib/classes";

interface ClassCardProps extends Omit<PressableProps, "children"> {
  classroom: Classroom;
}

export function ClassCard({ classroom, ...props }: ClassCardProps) {
  // Dummy teacher name for now, as it's not in the data model
  const teacherName = "Jeremiah Sentomero"; 

  return (
    <Pressable
      accessibilityRole="button"
      className="overflow-hidden rounded-[16px] border border-border bg-card active:opacity-90"
      {...props}
    >
      {/* Top Half: Cover Image & Details */}
      <View className="h-[140px] w-full">
        <Image
          source={{ uri: classroom.coverUrl }}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          contentFit="cover"
          transition={200}
        />
        {/* Dark Overlay for Text Readability */}
        <View className="absolute bottom-0 left-0 right-0 top-0 bg-black/40" />

        <View className="flex-1 justify-between p-4">
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-4">
              <Text className="text-[22px] font-bold tracking-tight text-white" numberOfLines={1}>
                {classroom.name}
              </Text>
              <Text className="text-sm font-medium text-white/90" numberOfLines={1}>
                {classroom.code}
              </Text>
            </View>
            <Pressable hitSlop={12} className="h-8 w-8 items-center justify-center rounded-full active:bg-white/20">
              <HugeiconsIcon icon={MoreVerticalIcon} size={20} color="#fff" />
            </Pressable>
          </View>
          <Text className="text-sm font-medium text-white/90" numberOfLines={1}>
            {teacherName}
          </Text>
        </View>
      </View>

      {/* Bottom Half: Content & Footer */}
      <View className="min-h-[100px] justify-end bg-card">
        {/* Teacher Avatar overlapping the edge */}
        <View className="absolute right-4 top-[-28px] z-10 h-14 w-14 rounded-full border-[3px] border-card bg-secondary shadow-sm">
          <Image
            source={{ uri: `https://api.dicebear.com/7.x/avataaars/png?seed=${teacherName}` }}
            style={{ width: "100%", height: "100%", borderRadius: 999 }}
            contentFit="cover"
          />
        </View>

        {/* Footer Area with Icons */}
        <View className="flex-row justify-end gap-4 border-t border-border/60 p-3">
          <Pressable hitSlop={8} className="active:opacity-60">
            <HugeiconsIcon icon={ChartHistogramIcon} size={22} color="#64748b" />
          </Pressable>
          <Pressable hitSlop={8} className="active:opacity-60">
            <HugeiconsIcon icon={Folder01Icon} size={22} color="#64748b" />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

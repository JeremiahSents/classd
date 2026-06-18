import { Pressable, Text, View } from "react-native";

export function SectionTitle({
  title,
  count,
  onSeeAll,
}: {
  title: string;
  count: number;
  onSeeAll?: () => void;
}) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-xs font-black uppercase tracking-wider text-slate-900">
        {title} <Text className="text-slate-400">({count})</Text>
      </Text>
      {onSeeAll ? (
        <Pressable accessibilityRole="button" onPress={onSeeAll} hitSlop={8}>
          <Text className="text-xs font-bold text-indigo-900">See all</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

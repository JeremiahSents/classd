import { View } from "react-native";
import type { Class } from "@/lib/api";
import { ClassCard } from "@/components/class/class-card";
import { SectionTitle } from "./section-title";

export function ClassesSection({
  classes,
  onClassPress,
  onSeeAll,
  limit = 3,
}: {
  classes: Class[];
  onClassPress: (classId: string) => void;
  onSeeAll?: () => void;
  limit?: number;
}) {
  const preview = classes.slice(0, limit);

  return (
    <View className="gap-4">
      <SectionTitle
        title="Your classes"
        count={classes.length}
        onSeeAll={classes.length > limit ? onSeeAll : undefined}
      />
      <View className="gap-3">
        {preview.map((classroom) => (
          <ClassCard
            key={classroom.id}
            classroom={classroom}
            onPress={() => onClassPress(classroom.id)}
          />
        ))}
      </View>
    </View>
  );
}

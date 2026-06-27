import { Pressable, Text, View } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowRight01Icon,
  Clock01Icon,
} from "@hugeicons/core-free-icons";
import type { Class } from "@/lib/api";
import { formatTime, classesToday, type TodayClass } from "@/lib/schedule";
import { SectionTitle } from "./section-title";

/* ------------------------------------------------------------------ */
/*  Palette — rotate through a set of accent colors per class         */
/* ------------------------------------------------------------------ */
const ACCENTS = ["#4f46e5", "#0ea5e9", "#f59e0b", "#10b981", "#f43f5e", "#8b5cf6"];

function accentFor(index: number): string {
  return ACCENTS[index % ACCENTS.length];
}

/* ------------------------------------------------------------------ */
/*  Class row                                                         */
/* ------------------------------------------------------------------ */
function ClassRow({
  todayClass,
  accent,
  onPress,
}: {
  todayClass: TodayClass;
  accent: string;
  onPress: () => void;
}) {
  const { classroom, block } = todayClass;
  const startTime = formatTime(block.startMinutes);
  const endTime = formatTime(block.endMinutes);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${classroom.name}`}
      onPress={onPress}
      className="flex-row items-center active:opacity-80"
    >
      {/* Colored accent bar */}
      <View
        style={{ backgroundColor: accent, width: 4, borderRadius: 4 }}
        className="self-stretch my-3 ml-3"
      />

      <View className="flex-1 gap-0.5 px-3 py-3.5">
        <Text
          className="text-[15px] font-semibold text-foreground"
          numberOfLines={1}
        >
          {classroom.name}
        </Text>
        <View className="flex-row items-center gap-1.5">
          <HugeiconsIcon icon={Clock01Icon} size={13} color="#9ca3af" />
          <Text className="text-xs text-muted-foreground" numberOfLines={1}>
            {startTime} – {endTime}{block.location ? ` · ${block.location}` : ""}
          </Text>
        </View>
      </View>

      {/* Right — chevron */}
      <View className="pr-4">
        <HugeiconsIcon icon={ArrowRight01Icon} size={18} color="#9ca3af" />
      </View>
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/*  Separator                                                         */
/* ------------------------------------------------------------------ */
function Divider() {
  return <View className="mx-4 h-px bg-border/60" />;
}

/* ------------------------------------------------------------------ */
/*  Section                                                           */
/* ------------------------------------------------------------------ */
export function ClassSchedule({
  classes,
  onClassPress,
  onNewClass,
  onSeeAll,
}: {
  classes: Class[];
  onClassPress: (classId: string) => void;
  onNewClass: () => void;
  onSeeAll?: () => void;
}) {
  const todayClasses = classesToday(classes);

  return (
    <View className="gap-4">
      <SectionTitle
        title="Today's classes"
        count={todayClasses.length}
        onSeeAll={todayClasses.length > 0 ? onSeeAll : undefined}
      />

      {todayClasses.length > 0 ? (
        <View className="overflow-hidden rounded-2xl">
          {todayClasses.map((todayClass, index) => (
            <View key={`${todayClass.classroom.id}-${index}`}>
              {index > 0 && <Divider />}
              <ClassRow
                todayClass={todayClass}
                accent={accentFor(index)}
                onPress={() => onClassPress(todayClass.classroom.id)}
              />
            </View>
          ))}
        </View>
      ) : (
        <View className="items-center gap-2 rounded-2xl border border-dashed border-border bg-card py-8">
          <HugeiconsIcon icon={Clock01Icon} size={22} color="#9ca3af" />
          <Text className="text-sm font-semibold text-muted-foreground">
            No classes today
          </Text>
        </View>
      )}
    </View>
  );
}

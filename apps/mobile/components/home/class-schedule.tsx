import { Pressable, Text, View } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Location01Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import type { Classroom } from "@/lib/classes";
import type { Unit } from "@/lib/types";
import { formatTime, unitsToday, type ScheduledUnit } from "@/lib/schedule";
import { SectionTitle } from "./section-title";

function TodayClassRow({
  unit,
  classroom,
  onPress,
}: {
  unit: ScheduledUnit;
  classroom?: Classroom;
  onPress: () => void;
}) {
  const [time, period] = formatTime(unit.startMinutes).split(" ");

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${unit.name}`}
      onPress={onPress}
      className="flex-row overflow-hidden rounded-2xl bg-slate-50 active:opacity-80"
    >
      <View className="w-16 items-center justify-center border-r border-slate-200 py-4">
        <Text className="text-sm font-black text-slate-900">{time}</Text>
        <Text className="text-[10px] font-semibold uppercase text-slate-400">
          {period}
        </Text>
      </View>
      <View className="flex-1 justify-center gap-1.5 px-4 py-4">
        <Text className="text-sm font-bold text-slate-800" numberOfLines={1}>
          {unit.name}
        </Text>
        <View className="flex-row items-center gap-1.5">
          <HugeiconsIcon icon={Location01Icon} size={12} color="#94a3b8" />
          <Text className="flex-1 text-xs text-slate-500" numberOfLines={1}>
            {unit.location ?? "Class"}
            {classroom ? ` · ${classroom.name}` : ""}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export function ClassSchedule({
  classes,
  units,
  onNewClass,
  onUnitPress,
  onSeeAll,
}: {
  classes: Classroom[];
  units: Unit[];
  onNewClass: () => void;
  onUnitPress: (unit: Unit) => void;
  onSeeAll?: () => void;
}) {
  const today = unitsToday(units);

  return (
    <View className="gap-4">
      <SectionTitle
        title="Today classes"
        count={today.length}
        onSeeAll={today.length > 0 ? onSeeAll : undefined}
      />
      <View className="gap-3">
        {today.map((unit) => {
          const classroom = classes.find((item) => item.id === unit.classId);
          return (
            <TodayClassRow
              key={unit.id}
              unit={unit}
              classroom={classroom}
              onPress={() => onUnitPress(unit)}
            />
          );
        })}
        {today.length === 0 ? (
          units.length === 0 ? (
            <Pressable
              accessibilityRole="button"
              onPress={onNewClass}
              className="items-center gap-3 rounded-2xl bg-slate-50 p-6"
            >
              <HugeiconsIcon icon={PlusSignIcon} size={24} color="#312e81" />
              <Text className="text-sm font-bold text-indigo-950">
                Create your first class
              </Text>
            </Pressable>
          ) : (
            <View className="rounded-2xl bg-slate-50 p-5">
              <Text className="text-sm font-medium text-slate-500">
                No classes scheduled today.
              </Text>
            </View>
          )
        ) : null}
      </View>
    </View>
  );
}

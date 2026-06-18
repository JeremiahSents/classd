import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { CalendarCheckIn01Icon, Location01Icon } from "@hugeicons/core-free-icons";
import type { Unit } from "@/lib/types";
import {
  formatDuration,
  formatTime,
  nowState,
  type ScheduledUnit,
} from "@/lib/schedule";

function LiveCard({
  unit,
  progress,
  minutesRemaining,
  onPress,
}: {
  unit: ScheduledUnit;
  progress: number;
  minutesRemaining: number;
  onPress: () => void;
}) {
  const fill = useSharedValue(0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    fill.value = withTiming(Math.min(1, Math.max(0, progress)), {
      duration: 900,
    });
  }, [progress, fill]);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(0.35, { duration: 850 }), -1, true);
  }, [pulse]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${fill.value * 100}%`,
  }));
  const dotStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${unit.name}, in progress`}
      onPress={onPress}
      className="gap-4 rounded-[1.75rem] bg-primary px-5 py-5 active:opacity-95"
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <View className="h-2 w-2 items-center justify-center">
            <Animated.View
              style={dotStyle}
              className="h-2 w-2 rounded-full bg-white"
            />
          </View>
          <Text className="text-[11px] font-bold uppercase tracking-wider text-white/80">
            In progress
          </Text>
        </View>
        <Text className="text-xs font-bold text-white">
          {formatDuration(minutesRemaining)} left
        </Text>
      </View>

      <View className="gap-1">
        <Text className="text-2xl font-black text-white" numberOfLines={1}>
          {unit.name}
        </Text>
        <View className="flex-row items-center gap-1.5">
          <HugeiconsIcon icon={Location01Icon} size={13} color="rgba(255,255,255,0.85)" />
          <Text className="text-sm text-white/85" numberOfLines={1}>
            {unit.location ?? "Class"} · {formatTime(unit.startMinutes)} –{" "}
            {formatTime(unit.endMinutes)}
          </Text>
        </View>
      </View>

      <View className="h-2 overflow-hidden rounded-full bg-white/25">
        <Animated.View style={fillStyle} className="h-2 rounded-full bg-white" />
      </View>
    </Pressable>
  );
}

function NextCard({
  unit,
  minutesRemaining,
  onPress,
}: {
  unit: ScheduledUnit;
  minutesRemaining: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${unit.name}, up next`}
      onPress={onPress}
      className="flex-row items-center gap-4 rounded-[1.75rem] border border-indigo-100 bg-indigo-50 px-5 py-4 active:opacity-90"
    >
      <View className="h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
        <Text className="text-sm font-black text-primary">
          {formatTime(unit.startMinutes).replace(/ (AM|PM)$/, "")}
        </Text>
      </View>
      <View className="flex-1 gap-0.5">
        <Text className="text-[11px] font-bold uppercase tracking-wider text-primary">
          Up next · in {formatDuration(minutesRemaining)}
        </Text>
        <Text className="text-base font-bold text-indigo-950" numberOfLines={1}>
          {unit.name}
        </Text>
        <View className="flex-row items-center gap-1.5">
          <HugeiconsIcon icon={Location01Icon} size={12} color="#6366f1" />
          <Text className="text-xs text-indigo-900/70" numberOfLines={1}>
            {unit.location ?? "Class"}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function RestCard({ todayCount }: { todayCount: number }) {
  return (
    <View className="flex-row items-center gap-3 rounded-[1.75rem] border border-slate-100 bg-slate-50 px-5 py-5">
      <View className="h-11 w-11 items-center justify-center rounded-2xl bg-white">
        <HugeiconsIcon icon={CalendarCheckIn01Icon} size={20} color="#64748b" />
      </View>
      <View className="flex-1">
        <Text className="text-base font-bold text-slate-800">
          {todayCount > 0 ? "Done for today" : "No classes today"}
        </Text>
        <Text className="text-sm text-slate-500">
          {todayCount > 0
            ? "All your classes have wrapped up."
            : "Enjoy the free day."}
        </Text>
      </View>
    </View>
  );
}

/**
 * Shows the class happening right now with a live progress bar, or the next
 * class up, or a rest state. Re-evaluates every 30s so "time left" stays fresh.
 */
export function CurrentClass({
  units,
  onUnitPress,
}: {
  units: Unit[];
  onUnitPress: (unit: Unit) => void;
}) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const state = nowState(units, now);

  if (state.live) {
    return (
      <LiveCard
        key={state.live.id}
        unit={state.live}
        progress={state.progress}
        minutesRemaining={state.minutesRemaining}
        onPress={() => onUnitPress(state.live!)}
      />
    );
  }

  if (state.next) {
    return (
      <NextCard
        unit={state.next}
        minutesRemaining={state.minutesRemaining}
        onPress={() => onUnitPress(state.next!)}
      />
    );
  }

  return <RestCard todayCount={state.todayCount} />;
}

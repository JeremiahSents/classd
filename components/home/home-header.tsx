import { Text, View } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { CrownIcon, UserGroupIcon } from "@hugeicons/core-free-icons";

const dateFormatter = new Intl.DateTimeFormat("en", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function HomeHeader({
  firstName,
  repClassCount = 0,
}: {
  firstName: string;
  repClassCount?: number;
}) {
  const today = dateFormatter.format(new Date());
  const managesClasses = repClassCount > 0;
  const statusLabel = managesClasses
    ? `Rep for ${repClassCount} ${repClassCount === 1 ? "class" : "classes"}`
    : "Member dashboard";

  return (
    <View className="rounded-3xl bg-primary/8 px-6 pb-6 pt-5">
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="text-sm font-medium text-muted-foreground">
            {greeting()}
          </Text>
          <Text className="mt-0.5 text-3xl font-black tracking-tight text-foreground">
            Hi {firstName}
          </Text>
        </View>
        <View className="items-end gap-2">
          <Text className="text-xs font-semibold text-muted-foreground">
            {today}
          </Text>
          <View className="flex-row items-center gap-1.5 rounded-full bg-background/80 px-3 py-1.5">
            <HugeiconsIcon
              icon={managesClasses ? CrownIcon : UserGroupIcon}
              size={14}
              color={managesClasses ? "#4f46e5" : "#64748b"}
            />
            <Text className="text-xs font-bold text-foreground">
              {statusLabel}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

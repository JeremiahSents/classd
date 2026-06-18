import { Text, View } from "react-native";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function HomeHeader({ firstName }: { firstName: string }) {
  const today = new Intl.DateTimeFormat("en", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date());

  return (
    <View className="rounded-[2rem] bg-[#cfe0fa] px-6 pb-7 pt-7">
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="text-sm font-medium text-slate-600">
            {greeting()}
          </Text>
          <Text className="mt-0.5 text-3xl font-black text-indigo-950">
            Hi {firstName}
          </Text>
        </View>
        <Text className="mt-1 text-xs font-bold text-slate-700">{today}</Text>
      </View>
    </View>
  );
}

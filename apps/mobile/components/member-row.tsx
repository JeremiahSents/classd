import type { ReactNode } from "react";
import { Text, View } from "react-native";

interface MemberRowProps {
  name: string;
  email: string;
  isRep?: boolean;
  /** Optional trailing control (e.g. a "Make rep" action). */
  trailing?: ReactNode;
}

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function MemberRow({ name, email, isRep, trailing }: MemberRowProps) {
  return (
    <View className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-4">
      <View className="h-10 w-10 items-center justify-center rounded-full bg-secondary">
        <Text className="text-sm font-bold text-secondary-foreground">
          {initials(name)}
        </Text>
      </View>
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text className="text-base font-semibold text-foreground" numberOfLines={1}>
            {name}
          </Text>
          {isRep ? (
            <View className="rounded-full bg-primary/10 px-2 py-0.5">
              <Text className="text-xs font-semibold text-primary">Class rep</Text>
            </View>
          ) : null}
        </View>
        <Text className="text-sm text-muted-foreground" numberOfLines={1}>
          {email}
        </Text>
      </View>
      {trailing}
    </View>
  );
}

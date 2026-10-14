import { Pressable, Text, View } from "react-native";
import { ANNOUNCEMENT_CATEGORY_LABEL, type Announcement } from "@/lib/types";

/** Category → badge colours, shared by every announcement surface. */
export function categoryStyle(category: Announcement["category"]) {
  if (category === "cat") return { bg: "bg-destructive/10", text: "text-destructive" };
  if (category === "deadline") return { bg: "bg-amber-500/10", text: "text-amber-600" };
  return { bg: "bg-primary/10", text: "text-primary" };
}

interface AnnouncementCardProps {
  announcement: Announcement;
  onPress?: () => void;
}

/** An announcement in a list (feed, class Updates tab). Tap for details. */
export function AnnouncementCard({ announcement: a, onPress }: AnnouncementCardProps) {
  const cat = categoryStyle(a.category);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a.title}
      onPress={onPress}
      disabled={!onPress}
      className="gap-1.5 rounded-2xl border border-border bg-card p-4 active:bg-secondary"
    >
      <View className="flex-row items-center justify-between gap-3">
        <Text className="flex-1 text-base font-semibold text-foreground">{a.title}</Text>
        <Text className="text-xs text-muted-foreground">{a.timeLabel}</Text>
      </View>
      <View className="flex-row items-center gap-2">
        <View className={`rounded-full px-2 py-0.5 ${cat.bg}`}>
          <Text className={`text-[11px] font-semibold ${cat.text}`}>
            {ANNOUNCEMENT_CATEGORY_LABEL[a.category]}
          </Text>
        </View>
        {a.dueLabel ? (
          <Text className="text-xs font-medium text-muted-foreground">{a.dueLabel}</Text>
        ) : null}
      </View>
      {a.content ? (
        <Text className="text-sm text-muted-foreground" numberOfLines={3}>
          {a.content}
        </Text>
      ) : null}
    </Pressable>
  );
}

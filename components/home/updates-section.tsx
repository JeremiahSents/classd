import { Text, View } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Calendar03Icon, Clock01Icon } from "@hugeicons/core-free-icons";
import type { Announcement } from "@/lib/api";
import { formatTimeAgo } from "@/lib/utils";

function AnnouncementPill({
  announcement,
  className,
}: {
  announcement: Announcement;
  className: (classId: string) => string;
}) {
  return (
    <View className="flex-row items-center gap-3 rounded-2xl px-4 py-3">
      <View className="h-9 w-9 items-center justify-center rounded-full bg-primary/10">
        <HugeiconsIcon icon={Calendar03Icon} size={17} color="#3730a3" />
      </View>
      <View className="flex-1">
        <Text className="text-sm font-bold text-slate-800" numberOfLines={1}>
          {announcement.title}
        </Text>
        <Text className="text-xs text-slate-500" numberOfLines={1}>
          {className(announcement.classId)} · {formatTimeAgo(announcement.createdAt)}
        </Text>
      </View>
    </View>
  );
}

export function UpdatesSection({
  announcements,
  className,
}: {
  announcements: Announcement[];
  className: (classId: string) => string;
}) {
  if (announcements.length === 0) return null;

  return (
    <View className="gap-3">
      <View className="flex-row items-center gap-2">
        <HugeiconsIcon icon={Clock01Icon} size={16} color="#64748b" />
        <Text className="text-xs font-black uppercase tracking-wider text-slate-900">
          Latest updates
        </Text>
      </View>
      {announcements.slice(0, 2).map((announcement) => (
        <AnnouncementPill
          key={announcement.id}
          announcement={announcement}
          className={className}
        />
      ))}
    </View>
  );
}

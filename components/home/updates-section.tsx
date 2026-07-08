import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Calendar03Icon, Clock01Icon } from "@hugeicons/core-free-icons";
import { AnnouncementDetailModal } from "@/components/modals/announcement-detail-modal";
import type { Announcement } from "@/lib/types";

function AnnouncementPill({
  announcement,
  className,
  onPress,
}: {
  announcement: Announcement;
  className: (classId: string) => string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-2xl px-4 py-3 active:bg-secondary/60"
    >
      <View className="h-9 w-9 items-center justify-center rounded-full bg-primary/10">
        <HugeiconsIcon icon={Calendar03Icon} size={17} color="#3730a3" />
      </View>
      <View className="flex-1">
        <Text className="text-sm font-bold text-slate-800" numberOfLines={1}>
          {announcement.title}
        </Text>
        <Text className="text-xs text-slate-500" numberOfLines={1}>
          {className(announcement.classId)} · {announcement.timeLabel}
        </Text>
      </View>
    </Pressable>
  );
}

export function UpdatesSection({
  announcements,
  className,
  onSeeAll,
}: {
  announcements: Announcement[];
  className: (classId: string) => string;
  onSeeAll?: () => void;
}) {
  // Tapping a pill opens a centered detail card.
  const [selected, setSelected] = useState<Announcement | null>(null);

  // Dashboard feed = still-relevant updates only: never overdue, and each is
  // either posted within the last week or has a future due date. (Store hands
  // these to us newest-first.)
  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const relevant = announcements.filter((a) => {
    const dueMs = a.dueAt ? new Date(a.dueAt).getTime() : null;
    if (dueMs !== null && dueMs < now) return false; // overdue — drop it
    const postedRecently = new Date(a.createdAt).getTime() >= weekAgo;
    const dueInFuture = dueMs !== null && dueMs >= now;
    return postedRecently || dueInFuture;
  });

  if (relevant.length === 0) return null;

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <HugeiconsIcon icon={Clock01Icon} size={16} color="#64748b" />
          <Text className="text-xs font-black uppercase tracking-wider text-slate-900">
            Latest updates
          </Text>
        </View>
        {onSeeAll ? (
          <Pressable accessibilityRole="button" onPress={onSeeAll} hitSlop={8}>
            <Text className="text-xs font-bold text-indigo-900">See all</Text>
          </Pressable>
        ) : null}
      </View>
      {relevant.slice(0, 8).map((announcement) => (
        <AnnouncementPill
          key={announcement.id}
          announcement={announcement}
          className={className}
          onPress={() => setSelected(announcement)}
        />
      ))}

      <AnnouncementDetailModal
        announcement={selected}
        className={className}
        onClose={() => setSelected(null)}
      />
    </View>
  );
}

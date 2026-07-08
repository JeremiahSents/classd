import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Calendar03Icon, Cancel01Icon, Clock01Icon } from "@hugeicons/core-free-icons";
import { ANNOUNCEMENT_CATEGORY_LABEL } from "@/lib/types";
import type { Announcement } from "@/lib/types";

/** Category → badge colours, matching the announcements feed. */
function categoryStyle(category: Announcement["category"]) {
  if (category === "cat") return { bg: "bg-destructive/10", text: "text-destructive" };
  if (category === "deadline") return { bg: "bg-amber-500/10", text: "text-amber-600" };
  return { bg: "bg-primary/10", text: "text-primary" };
}

interface AnnouncementDetailModalProps {
  announcement: Announcement | null;
  className: (classId: string) => string;
  onClose: () => void;
}

export function AnnouncementDetailModal({
  announcement,
  className,
  onClose,
}: AnnouncementDetailModalProps) {
  const visible = !!announcement;
  const cat = announcement ? categoryStyle(announcement.category) : categoryStyle("general");

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {/* Dimmed backdrop — tap anywhere outside to dismiss */}
      <Pressable
        onPress={onClose}
        className="flex-1 items-center justify-center bg-black/50 px-8"
      >
        {/* Stop propagation so taps inside the card don't close it */}
        <Pressable
          onPress={() => {}}
          className="w-full max-w-sm gap-4 rounded-3xl bg-card p-5"
        >
          {announcement ? (
            <>
              <View className="flex-row items-start justify-between gap-3">
                <View className={`rounded-full px-2.5 py-1 ${cat.bg}`}>
                  <Text className={`text-[11px] font-bold ${cat.text}`}>
                    {ANNOUNCEMENT_CATEGORY_LABEL[announcement.category]}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                  onPress={onClose}
                  className="h-8 w-8 items-center justify-center rounded-full bg-secondary active:opacity-70"
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={18} color="#64748b" />
                </Pressable>
              </View>

              <Text className="text-lg font-bold text-foreground">{announcement.title}</Text>

              <View className="gap-1.5">
                <View className="flex-row items-center gap-2">
                  <HugeiconsIcon icon={Clock01Icon} size={14} color="#94a3b8" />
                  <Text className="text-xs text-muted-foreground">
                    {className(announcement.classId)} · {announcement.timeLabel}
                  </Text>
                </View>
                {announcement.dueLabel ? (
                  <View className="flex-row items-center gap-2">
                    <HugeiconsIcon icon={Calendar03Icon} size={14} color="#94a3b8" />
                    <Text className="text-xs font-medium text-muted-foreground">
                      {announcement.dueLabel}
                    </Text>
                  </View>
                ) : null}
              </View>

              {announcement.content ? (
                <ScrollView className="max-h-64" showsVerticalScrollIndicator={false}>
                  <Text className="text-sm leading-6 text-foreground">
                    {announcement.content}
                  </Text>
                </ScrollView>
              ) : null}
            </>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

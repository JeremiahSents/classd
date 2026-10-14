import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  Calendar03Icon,
  Cancel01Icon,
  Clock01Icon,
  Delete02Icon,
  PencilEdit02Icon,
} from "@hugeicons/core-free-icons";
import { categoryStyle } from "@/components/class/announcement-card";
import { AddAnnouncementModal } from "@/components/modals/add-announcement-modal";
import { useToast } from "@/components/ui/toast";
import { useClasses } from "@/lib/classes-store";
import { confirmAction } from "@/lib/confirm";
import { ANNOUNCEMENT_CATEGORY_LABEL } from "@/lib/types";
import type { Announcement } from "@/lib/types";

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
  const toast = useToast();
  const { canManageClass, deleteAnnouncement } = useClasses();
  // the editor is a sibling modal; hide this one while it's open
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const visible = !!announcement && !editing;
  const cat = announcement ? categoryStyle(announcement.category) : categoryStyle("general");
  const canManage = announcement ? canManageClass(announcement.classId) : false;

  async function handleDelete() {
    if (!announcement) return;
    const ok = await confirmAction({
      title: "Delete this announcement?",
      message: "It will be removed for everyone in the class.",
      confirmLabel: "Delete",
    });
    if (!ok) return;
    setDeleting(true);
    try {
      await deleteAnnouncement(announcement.classId, announcement.id);
      toast.success("Announcement deleted", "🗑️");
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete announcement.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
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

                {/* the class rep (or an admin) can edit or delete */}
                {canManage ? (
                  <View className="flex-row gap-3 pt-1">
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => setEditing(true)}
                      className="h-11 flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-border active:bg-secondary"
                    >
                      <HugeiconsIcon icon={PencilEdit02Icon} size={16} color="#111" />
                      <Text className="text-sm font-semibold text-foreground">Edit</Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      disabled={deleting}
                      onPress={handleDelete}
                      className={`h-11 flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-red-300 active:bg-red-500/10 ${
                        deleting ? "opacity-50" : ""
                      }`}
                    >
                      <HugeiconsIcon icon={Delete02Icon} size={16} color="#ef4444" />
                      <Text className="text-sm font-semibold text-red-500">
                        {deleting ? "Deleting..." : "Delete"}
                      </Text>
                    </Pressable>
                  </View>
                ) : null}
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>

      {announcement && canManage ? (
        <AddAnnouncementModal
          classId={announcement.classId}
          announcement={announcement}
          visible={editing}
          onClose={() => {
            setEditing(false);
            // close the (now stale) detail view too
            onClose();
          }}
        />
      ) : null}
    </>
  );
}

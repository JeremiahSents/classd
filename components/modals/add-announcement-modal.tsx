import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { DateTimeField } from "@/components/ui/date-time-field";
import { useToast } from "@/components/ui/toast";
import {
  ANNOUNCEMENT_CATEGORY_LABEL,
  type Announcement,
  type AnnouncementCategory,
} from "@/lib/types";
import { useClasses } from "@/lib/classes-store";

interface AddAnnouncementModalProps {
  classId: string;
  /** When set, the modal edits this announcement instead of posting a new one. */
  announcement?: Announcement;
  visible: boolean;
  onClose: () => void;
}

const CATEGORIES: AnnouncementCategory[] = ["general", "cat", "deadline"];

export function AddAnnouncementModal({
  classId,
  announcement,
  visible,
  onClose,
}: AddAnnouncementModalProps) {
  const toast = useToast();
  const { addAnnouncement, updateAnnouncement } = useClasses();
  const isEdit = !!announcement;
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<AnnouncementCategory>("general");
  const [due, setDue] = useState<Date | null>(null); // optional
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // prefill from the announcement being edited each time the modal opens
  useEffect(() => {
    if (visible && announcement) {
      setTitle(announcement.title);
      setContent(announcement.content);
      setCategory(announcement.category);
      const d = announcement.dueAt ? new Date(announcement.dueAt) : null;
      setDue(d && !isNaN(d.getTime()) ? d : null);
    }
  }, [visible, announcement]);

  function reset() {
    setTitle("");
    setContent("");
    setCategory("general");
    setDue(null);
    setError(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSave() {
    if (!title.trim() || !content.trim()) return;
    // due date is optional
    const dueAt = due ? due.toISOString() : undefined;
    setError(null);
    setSubmitting(true);
    try {
      if (isEdit && announcement) {
        await updateAnnouncement(announcement.classId, announcement.id, {
          title: title.trim(),
          content,
          category,
          // null clears a due date that was removed
          dueAt: dueAt ?? null,
        });
      } else {
        await addAnnouncement(classId, { title: title.trim(), content, category, dueAt });
      }
      reset();
      onClose();
      toast.success(isEdit ? "Announcement updated!" : "Announcement posted!", "📣");
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : isEdit
            ? "Could not update announcement."
            : "Could not post announcement.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 justify-end bg-black/40"
      >
        <View className="max-h-[88%] rounded-t-3xl bg-card">
          <View className="flex-row items-center justify-between border-b border-border p-4">
            <View className="w-8" />
            <Text className="text-base font-bold text-foreground">
              {isEdit ? "Edit Announcement" : "New Announcement"}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={handleClose}
              className="h-8 w-8 items-center justify-center rounded-full bg-secondary active:opacity-70"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={18} color="#64748b" />
            </Pressable>
          </View>

          <ScrollView className="px-6 py-4" showsVerticalScrollIndicator={false}>
            <View className="gap-5 pb-8">
              {/* Category */}
              <View className="gap-2">
                <Text className="text-sm font-semibold text-foreground">Category</Text>
                <View className="flex-row gap-2">
                  {CATEGORIES.map((c) => (
                    <Pressable
                      key={c}
                      onPress={() => setCategory(c)}
                      className={`flex-1 items-center rounded-xl border py-2.5 ${
                        category === c
                          ? "border-primary bg-primary/10"
                          : "border-border bg-transparent"
                      }`}
                    >
                      <Text
                        className={`text-sm font-medium ${
                          category === c ? "text-primary" : "text-muted-foreground"
                        }`}
                      >
                        {ANNOUNCEMENT_CATEGORY_LABEL[c]}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View className="gap-2">
                <Text className="text-sm font-semibold text-foreground">
                  Title *
                </Text>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="e.g. Midterm moved to Friday"
                  className="rounded-xl border border-border bg-secondary/50 px-4 py-3 text-base text-foreground"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View className="gap-2">
                <Text className="text-sm font-semibold text-foreground">
                  Message *
                </Text>
                <TextInput
                  value={content}
                  onChangeText={setContent}
                  placeholder="Details..."
                  multiline
                  textAlignVertical="top"
                  className="min-h-[100px] rounded-xl border border-border bg-secondary/50 px-4 py-3 text-base text-foreground"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              {/* Optional due date — e.g. when a CAT sits or a deadline falls */}
              <View className="gap-2">
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm font-semibold text-foreground">
                    Due date (optional)
                  </Text>
                  {due ? (
                    <Pressable onPress={() => setDue(null)} hitSlop={8}>
                      <Text className="text-xs font-semibold text-primary">Clear</Text>
                    </Pressable>
                  ) : null}
                </View>
                <DateTimeField value={due} onChange={setDue} placeholder="No due date" />
              </View>

              {error ? (
                <Text className="text-sm font-medium text-red-500">{error}</Text>
              ) : null}

              <Button
                label={isEdit ? "Save Changes" : "Post Announcement"}
                onPress={handleSave}
                loading={submitting}
                disabled={!title.trim() || !content.trim()}
              />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

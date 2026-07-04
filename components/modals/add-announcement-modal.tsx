import { useState } from "react";
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
import { ANNOUNCEMENT_CATEGORY_LABEL, type AnnouncementCategory } from "@/lib/types";
import { useClasses } from "@/lib/classes-store";

interface AddAnnouncementModalProps {
  classId: string;
  visible: boolean;
  onClose: () => void;
}

const CATEGORIES: AnnouncementCategory[] = ["general", "cat", "deadline"];

/** Combine a YYYY-MM-DD date and HH:MM time into an ISO string, or null. */
function toIso(date: string, time: string): string | null {
  const clean = date.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(clean)) return null;
  const t = time.trim() || "23:59";
  if (!/^\d{2}:\d{2}$/.test(t)) return null;
  const d = new Date(`${clean}T${t}:00`);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

export function AddAnnouncementModal({
  classId,
  visible,
  onClose,
}: AddAnnouncementModalProps) {
  const { addAnnouncement } = useClasses();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<AnnouncementCategory>("general");
  const [dueDate, setDueDate] = useState(""); // optional YYYY-MM-DD
  const [dueTime, setDueTime] = useState(""); // optional HH:MM
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setTitle("");
    setContent("");
    setCategory("general");
    setDueDate("");
    setDueTime("");
    setError(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSave() {
    if (!title.trim() || !content.trim()) return;
    // due date is optional — but if given, it must parse
    let dueAt: string | undefined;
    if (dueDate.trim()) {
      const iso = toIso(dueDate, dueTime);
      if (!iso) {
        setError("Enter a valid due date (YYYY-MM-DD) or leave it empty.");
        return;
      }
      dueAt = iso;
    }
    setError(null);
    setSubmitting(true);
    try {
      await addAnnouncement(classId, { title: title.trim(), content, category, dueAt });
      reset();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not post announcement.");
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
              New Announcement
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
              <View className="flex-row gap-3">
                <View className="flex-[2] gap-2">
                  <Text className="text-sm font-semibold text-foreground">
                    Due date (optional)
                  </Text>
                  <TextInput
                    value={dueDate}
                    onChangeText={setDueDate}
                    placeholder="YYYY-MM-DD"
                    autoCapitalize="none"
                    className="rounded-xl border border-border bg-secondary/50 px-4 py-3 text-base text-foreground"
                    placeholderTextColor="#9ca3af"
                  />
                </View>
                <View className="flex-1 gap-2">
                  <Text className="text-sm font-semibold text-foreground">Time</Text>
                  <TextInput
                    value={dueTime}
                    onChangeText={setDueTime}
                    placeholder="23:59"
                    autoCapitalize="none"
                    className="rounded-xl border border-border bg-secondary/50 px-4 py-3 text-base text-foreground"
                    placeholderTextColor="#9ca3af"
                  />
                </View>
              </View>

              {error ? (
                <Text className="text-sm font-medium text-red-500">{error}</Text>
              ) : null}

              <Button
                label="Post Announcement"
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

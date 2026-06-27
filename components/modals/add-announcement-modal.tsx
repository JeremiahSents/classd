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
import { api, type Announcement } from "@/lib/api";

interface AddAnnouncementModalProps {
  classId: string;
  visible: boolean;
  onClose: () => void;
  /** Called after the announcement is successfully posted. */
  onCreated?: (announcement: Announcement) => void;
}

export function AddAnnouncementModal({
  classId,
  visible,
  onClose,
  onCreated,
}: AddAnnouncementModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!title.trim() || !content.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const announcement = await api.createAnnouncement(classId, {
        title: title.trim(),
        content,
      });
      onCreated?.(announcement);
      handleClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to post announcement.");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setTitle("");
    setContent("");
    setError(null);
    onClose();
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
        <View className="rounded-t-3xl bg-card">
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
                  className="min-h-[120px] rounded-xl border border-border bg-secondary/50 px-4 py-3 text-base text-foreground"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              {error ? (
                <Text className="text-center text-sm text-destructive">
                  {error}
                </Text>
              ) : null}

              <Button
                label="Post Announcement"
                onPress={handleSave}
                loading={loading}
                disabled={!title.trim() || !content.trim()}
              />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

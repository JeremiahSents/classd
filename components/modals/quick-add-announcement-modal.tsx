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
import type { Classroom } from "@/lib/classes";
import { useClasses } from "@/lib/classes-store";

interface QuickAddAnnouncementModalProps {
  /** Classes the current user can post to (the ones they rep). */
  classes: Classroom[];
  visible: boolean;
  onClose: () => void;
}

export function QuickAddAnnouncementModal({
  classes,
  visible,
  onClose,
}: QuickAddAnnouncementModalProps) {
  const { addAnnouncement } = useClasses();
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // default to the first class whenever the list changes / modal opens
  useEffect(() => {
    if (visible && !classId && classes[0]) setClassId(classes[0].id);
  }, [visible, classId, classes]);

  function reset() {
    setTitle("");
    setContent("");
    setError(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSave() {
    if (!classId) {
      setError("Pick a class.");
      return;
    }
    if (!title.trim() || !content.trim()) {
      setError("Enter a title and a message.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await addAnnouncement(classId, { title: title.trim(), content: content.trim() });
      reset();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not post announcement.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 justify-end bg-black/40"
      >
        <View className="max-h-[88%] rounded-t-3xl bg-card">
          <View className="flex-row items-center justify-between border-b border-border p-4">
            <View className="w-8" />
            <Text className="text-base font-bold text-foreground">New announcement</Text>
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
              {/* Class picker */}
              <View className="gap-2">
                <Text className="text-sm font-semibold text-foreground">Class</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerClassName="gap-2"
                >
                  {classes.map((c) => (
                    <Pressable
                      key={c.id}
                      onPress={() => setClassId(c.id)}
                      className={`rounded-xl border px-4 py-2.5 ${
                        classId === c.id
                          ? "border-primary bg-primary/10"
                          : "border-border bg-transparent"
                      }`}
                    >
                      <Text
                        className={`text-sm font-medium ${
                          classId === c.id ? "text-primary" : "text-muted-foreground"
                        }`}
                      >
                        {c.name}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              <View className="gap-2">
                <Text className="text-sm font-semibold text-foreground">Title *</Text>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="e.g. Midterm moved to Friday"
                  className="rounded-xl border border-border bg-secondary/50 px-4 py-3 text-base text-foreground"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View className="gap-2">
                <Text className="text-sm font-semibold text-foreground">Message *</Text>
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

              {error ? <Text className="text-sm font-medium text-red-500">{error}</Text> : null}

              <Button
                label="Post announcement"
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

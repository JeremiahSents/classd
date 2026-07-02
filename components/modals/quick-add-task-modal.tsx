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

interface QuickAddTaskModalProps {
  /** Classes the current user can post to (the ones they rep). */
  classes: Classroom[];
  visible: boolean;
  onClose: () => void;
}

function toIso(date: string, time: string): string | null {
  const clean = date.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(clean)) return null;
  const t = time.trim() || "23:59";
  if (!/^\d{2}:\d{2}$/.test(t)) return null;
  const d = new Date(`${clean}T${t}:00`);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

export function QuickAddTaskModal({ classes, visible, onClose }: QuickAddTaskModalProps) {
  const { addTask } = useClasses();
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // default to the first class whenever the list changes / modal opens
  useEffect(() => {
    if (visible && !classId && classes[0]) setClassId(classes[0].id);
  }, [visible, classId, classes]);

  function reset() {
    setTitle("");
    setDescription("");
    setDueDate("");
    setDueTime("");
    setError(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSave() {
    const dueAt = toIso(dueDate, dueTime);
    if (!classId) {
      setError("Pick a class.");
      return;
    }
    if (!title.trim()) {
      setError("Enter a title.");
      return;
    }
    if (!dueAt) {
      setError("Enter a valid due date (YYYY-MM-DD).");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await addTask(classId, { title: title.trim(), description, dueAt });
      reset();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add task.");
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
            <Text className="text-base font-bold text-foreground">Quick add task</Text>
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
                  placeholder="e.g. Essay Draft"
                  className="rounded-xl border border-border bg-secondary/50 px-4 py-3 text-base text-foreground"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View className="gap-2">
                <Text className="text-sm font-semibold text-foreground">Description</Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Additional details..."
                  multiline
                  textAlignVertical="top"
                  className="min-h-[70px] rounded-xl border border-border bg-secondary/50 px-4 py-3 text-base text-foreground"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View className="flex-row gap-3">
                <View className="flex-[2] gap-2">
                  <Text className="text-sm font-semibold text-foreground">Due date *</Text>
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

              {error ? <Text className="text-sm font-medium text-red-500">{error}</Text> : null}

              <Button
                label="Add task"
                onPress={handleSave}
                loading={submitting}
                disabled={!title.trim() || !dueDate.trim()}
              />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

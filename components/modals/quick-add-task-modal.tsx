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
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
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
  const toast = useToast();
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
      toast.success("Task posted!");
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
                <Input
                  label="Title *"
                  value={title}
                  onChangeText={setTitle}
                  placeholder="e.g. Essay Draft"
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
                  className="min-h-[96px] rounded-xl border border-input bg-card px-4 py-3 text-base leading-5 text-foreground"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View className="flex-row gap-3">
                <DateTimeField
                  containerClassName="flex-[1.45]"
                  label="Due date *"
                  mode="date"
                  value={dueDate}
                  onChange={setDueDate}
                  placeholder="Select date"
                />
                <DateTimeField
                  containerClassName="flex-1"
                  label="Time"
                  mode="time"
                  value={dueTime}
                  onChange={setDueTime}
                  placeholder="23:59"
                />
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

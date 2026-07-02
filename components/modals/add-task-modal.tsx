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
import type { Task } from "@/lib/types";
import { useClasses } from "@/lib/classes-store";

interface AddTaskModalProps {
  classId: string;
  /** When set, the modal edits this task instead of creating a new one. */
  task?: Task;
  visible: boolean;
  onClose: () => void;
  /** Called after the task is successfully created. */
  onCreated?: (task: Task) => void;
}

/** Combine a YYYY-MM-DD date and HH:MM time into an ISO string, or null. */
function toIso(date: string, time: string): string | null {
  const clean = date.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(clean)) return null;
  const t = time.trim() || "23:59";
  if (!/^\d{2}:\d{2}$/.test(t)) return null;
  const d = new Date(`${clean}T${t}:00`);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

export function AddTaskModal({ classId, task, visible, onClose }: AddTaskModalProps) {
  const { addTask, updateTask } = useClasses();
  const isEdit = !!task;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(""); // YYYY-MM-DD
  const [dueTime, setDueTime] = useState(""); // HH:MM (optional)
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // prefill from the task being edited each time the modal opens
  useEffect(() => {
    if (visible && task) {
      setTitle(task.title);
      setDescription(task.description);
      const due = new Date(task.dueAt);
      if (!isNaN(due.getTime())) {
        setDueDate(due.toISOString().slice(0, 10));
        setDueTime(
          `${String(due.getHours()).padStart(2, "0")}:${String(due.getMinutes()).padStart(2, "0")}`,
        );
      }
    }
  }, [visible, task]);

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
      if (isEdit && task) {
        await updateTask(task.classId, task.id, {
          title: title.trim(),
          description,
          dueAt,
        });
      } else {
        await addTask(classId, { title: title.trim(), description, dueAt });
      }
      reset();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save task.");
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
        <View className="rounded-t-3xl bg-card">
          <View className="flex-row items-center justify-between border-b border-border p-4">
            <View className="w-8" />
            <Text className="text-base font-bold text-foreground">
              {isEdit ? "Edit Task" : "Add Task"}
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
              {/* Type selector */}
              <View className="gap-2">
                <Text className="text-sm font-semibold text-foreground">Title *</Text>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="e.g. Essay Draft"
                  textAlignVertical="center"
                  className="h-14 rounded-xl border border-border bg-secondary/50 px-4 py-0 text-base leading-5 text-foreground"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              {/* Description */}
              <View className="gap-2">
                <Text className="text-sm font-semibold text-foreground">Description</Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Additional details..."
                  multiline
                  textAlignVertical="top"
                  className="min-h-[80px] rounded-xl border border-border bg-secondary/50 px-4 py-3 text-base text-foreground"
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

              {error ? (
                <Text className="text-sm font-medium text-red-500">{error}</Text>
              ) : null}

              <Button
                label={isEdit ? "Save Changes" : "Save Task"}
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

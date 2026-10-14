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
import type { Task } from "@/lib/types";
import { useClasses } from "@/lib/classes-store";

interface AddTaskModalProps {
  classId: string;
  /** When set, the modal edits this task instead of creating a new one. */
  task?: Task;
  visible: boolean;
  onClose: () => void;
}

export function AddTaskModal({ classId, task, visible, onClose }: AddTaskModalProps) {
  const toast = useToast();
  const { addTask, updateTask } = useClasses();
  const isEdit = !!task;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [due, setDue] = useState<Date | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // prefill from the task being edited each time the modal opens
  useEffect(() => {
    if (visible && task) {
      setTitle(task.title);
      setDescription(task.description);
      const d = new Date(task.dueAt);
      if (!isNaN(d.getTime())) setDue(d);
    }
  }, [visible, task]);

  function reset() {
    setTitle("");
    setDescription("");
    setDue(null);
    setError(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSave() {
    if (!title.trim()) {
      setError("Enter a title.");
      return;
    }
    if (!due) {
      setError("Pick a due date.");
      return;
    }
    const dueAt = due.toISOString();

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
      toast.success(isEdit ? "Task updated" : "Task posted!");
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
                  className="min-h-[80px] rounded-xl border border-border bg-secondary/50 px-4 py-3 text-base text-foreground"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <DateTimeField label="Due date *" value={due} onChange={setDue} />

              {error ? (
                <Text className="text-sm font-medium text-red-500">{error}</Text>
              ) : null}

              <Button
                label={isEdit ? "Save Changes" : "Save Task"}
                onPress={handleSave}
                loading={submitting}
                disabled={!title.trim() || !due}
              />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

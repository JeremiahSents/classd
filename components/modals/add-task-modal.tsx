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
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Cancel01Icon, Calendar01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { TASK_TYPE_LABEL } from "@/lib/types";
import type { TaskType } from "@/lib/types";
import { api, type Task } from "@/lib/api";

interface AddTaskModalProps {
  classId: string;
  visible: boolean;
  onClose: () => void;
  /** Called after the task is successfully created. */
  onCreated?: (task: Task) => void;
}

const TYPES: TaskType[] = ["assignment", "cat", "deadline"];

/** Format a Date as "Mon, Jun 30" */
function formatPickedDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function AddTaskModal({
  classId,
  visible,
  onClose,
  onCreated,
}: AddTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<TaskType>("assignment");
  const [dueDate, setDueDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7); // default: one week from now
    return d;
  });
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handlePickerChange(_event: DateTimePickerEvent, selected?: Date) {
    setShowPicker(Platform.OS === "ios"); // keep open on iOS, close on Android
    if (selected) setDueDate(selected);
  }

  async function handleSave() {
    if (!title.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const task = await api.createTask(classId, {
        title: title.trim(),
        description,
        type,
        dueAt: dueDate.toISOString(),
      });
      onCreated?.(task);
      handleClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save task.");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setTitle("");
    setDescription("");
    setType("assignment");
    setDueDate(() => {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      return d;
    });
    setShowPicker(false);
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
            <Text className="text-base font-bold text-foreground">Add Task</Text>
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
                <Text className="text-sm font-semibold text-foreground">Type</Text>
                <View className="flex-row gap-2">
                  {TYPES.map((t) => (
                    <Pressable
                      key={t}
                      onPress={() => setType(t)}
                      className={`flex-1 items-center rounded-xl border py-2.5 ${
                        type === t
                          ? "border-primary bg-primary/10"
                          : "border-border bg-transparent"
                      }`}
                    >
                      <Text
                        className={`text-sm font-medium ${
                          type === t ? "text-primary" : "text-muted-foreground"
                        }`}
                      >
                        {TASK_TYPE_LABEL[t]}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Title */}
              <View className="gap-2">
                <Text className="text-sm font-semibold text-foreground">
                  Title *
                </Text>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="e.g. Essay Draft"
                  className="rounded-xl border border-border bg-secondary/50 px-4 py-3 text-base text-foreground"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              {/* Description */}
              <View className="gap-2">
                <Text className="text-sm font-semibold text-foreground">
                  Description
                </Text>
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

              {/* Due date */}
              <View className="gap-2">
                <Text className="text-sm font-semibold text-foreground">
                  Due Date *
                </Text>
                <Pressable
                  onPress={() => setShowPicker((s) => !s)}
                  className="flex-row items-center gap-3 rounded-xl border border-border bg-secondary/50 px-4 py-3"
                >
                  <HugeiconsIcon icon={Calendar01Icon} size={20} color="#64748b" />
                  <Text className="flex-1 text-base text-foreground">
                    {formatPickedDate(dueDate)}
                  </Text>
                </Pressable>

                {showPicker && (
                  <DateTimePicker
                    value={dueDate}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    minimumDate={new Date()}
                    onChange={handlePickerChange}
                  />
                )}
              </View>

              {error ? (
                <Text className="text-center text-sm text-destructive">
                  {error}
                </Text>
              ) : null}

              <Button
                label="Save Task"
                onPress={handleSave}
                loading={loading}
                disabled={!title.trim()}
              />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

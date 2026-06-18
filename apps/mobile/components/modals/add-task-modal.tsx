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
import { TASK_TYPE_LABEL } from "@/lib/types";
import type { TaskType } from "@/lib/types";
import { useClasses } from "@/lib/classes-store";

interface AddTaskModalProps {
  classId: string;
  visible: boolean;
  onClose: () => void;
}

const TYPES: TaskType[] = ["assignment", "cat", "deadline"];

export function AddTaskModal({ classId, visible, onClose }: AddTaskModalProps) {
  const { addTask } = useClasses();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<TaskType>("assignment");
  const [dueLabel, setDueLabel] = useState("");

  function handleSave() {
    if (!title.trim() || !dueLabel.trim()) return;
    addTask(classId, {
      title,
      description,
      type,
      dueLabel,
    });
    setTitle("");
    setDescription("");
    setType("assignment");
    setDueLabel("");
    onClose();
  }

  function handleClose() {
    setTitle("");
    setDescription("");
    setType("assignment");
    setDueLabel("");
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

              <View className="gap-2">
                <Text className="text-sm font-semibold text-foreground">
                  Due Label *
                </Text>
                <TextInput
                  value={dueLabel}
                  onChangeText={setDueLabel}
                  placeholder="e.g. Due tomorrow, Due in 2 days"
                  className="rounded-xl border border-border bg-secondary/50 px-4 py-3 text-base text-foreground"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <Button
                label="Save Task"
                onPress={handleSave}
                disabled={!title.trim() || !dueLabel.trim()}
              />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

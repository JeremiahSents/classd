import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { X } from "lucide-react-native";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useClasses } from "@/lib/classes-store";
import { TASK_TYPE_LABEL, type TaskType } from "@/lib/types";

interface AddTaskModalProps {
  unitId: string;
  visible: boolean;
  onClose: () => void;
}

const TYPES: TaskType[] = ["assignment", "cat", "deadline"];

export function AddTaskModal({ unitId, visible, onClose }: AddTaskModalProps) {
  const { addTask } = useClasses();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<TaskType>("assignment");
  const [dueLabel, setDueLabel] = useState("");

  function handleClose() {
    setTitle("");
    setDescription("");
    setType("assignment");
    setDueLabel("");
    onClose();
  }

  function handleAdd() {
    addTask(unitId, {
      title,
      description,
      type,
      dueLabel: dueLabel.trim() || "No due date",
    });
    handleClose();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        className="flex-1 justify-end bg-black/50"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View className="gap-6 rounded-t-3xl bg-background p-6 pb-10">
          <View className="flex-row items-center justify-between">
            <Text className="text-xl font-bold text-foreground">New task</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={handleClose}
              className="h-9 w-9 items-center justify-center rounded-full active:bg-secondary"
            >
              <X size={22} color="#71717a" />
            </Pressable>
          </View>

          <View className="gap-4">
            <Input
              label="Title"
              placeholder="e.g. Lab Report 2"
              value={title}
              onChangeText={setTitle}
              autoFocus
            />

            {/* Type selector */}
            <View className="gap-2">
              <Text className="text-center text-sm font-medium text-foreground">
                Type
              </Text>
              <View className="flex-row gap-2">
                {TYPES.map((t) => {
                  const selected = t === type;
                  return (
                    <Pressable
                      key={t}
                      accessibilityRole="button"
                      onPress={() => setType(t)}
                      className={`flex-1 items-center rounded-xl border py-3 ${
                        selected
                          ? "border-primary bg-primary/10"
                          : "border-border bg-card"
                      }`}
                    >
                      <Text
                        className={
                          selected
                            ? "text-sm font-semibold text-primary"
                            : "text-sm font-medium text-muted-foreground"
                        }
                      >
                        {TASK_TYPE_LABEL[t]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <Input
              label="Description (optional)"
              placeholder="Add details"
              value={description}
              onChangeText={setDescription}
              multiline
            />
            <Input
              label="Due"
              placeholder="e.g. Due Friday 5pm"
              value={dueLabel}
              onChangeText={setDueLabel}
            />
          </View>

          <View className="flex-row gap-3">
            <Button
              className="flex-1"
              variant="outline"
              label="Cancel"
              onPress={handleClose}
            />
            <Button
              className="flex-1"
              label="Post task"
              disabled={!title.trim()}
              onPress={handleAdd}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

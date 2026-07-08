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
import { useToast } from "@/components/ui/toast";
import { api, type Member } from "@/lib/api";

interface Props {
  groupId: string;
  members: Member[];
  visible: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

function toIso(date: string, time: string): string | null {
  const clean = date.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(clean)) return null;
  const t = time.trim() || "23:59";
  if (!/^\d{2}:\d{2}$/.test(t)) return null;
  const d = new Date(`${clean}T${t}:00`);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

export function AddGroupTaskModal({ groupId, members, visible, onClose, onCreated }: Props) {
  const toast = useToast();
  const [assignedTo, setAssignedTo] = useState(members[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible && !assignedTo && members[0]) setAssignedTo(members[0].id);
  }, [visible, assignedTo, members]);

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
    const assignee = members.find((m) => m.id === assignedTo);
    if (!assignee) {
      setError("Pick who to assign.");
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
      await api.createGroupTask(groupId, {
        title: title.trim(),
        description,
        dueAt,
        assignedTo: assignee.id,
        assignedToName: assignee.name || assignee.email,
      });
      reset();
      onCreated?.();
      onClose();
      toast.success(`Task assigned to ${assignee.name || assignee.email}!`);
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
            <Text className="text-base font-bold text-foreground">Assign group task</Text>
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
                <Text className="text-sm font-semibold text-foreground">Assign to</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
                  {members.map((m) => (
                    <Pressable
                      key={m.id}
                      onPress={() => setAssignedTo(m.id)}
                      className={`rounded-xl border px-4 py-2.5 ${
                        assignedTo === m.id
                          ? "border-primary bg-primary/10"
                          : "border-border bg-transparent"
                      }`}
                    >
                      <Text
                        className={`text-sm font-medium ${
                          assignedTo === m.id ? "text-primary" : "text-muted-foreground"
                        }`}
                      >
                        {m.name || m.email}
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
                  placeholder="e.g. Write introduction"
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
                label="Assign task"
                onPress={handleSave}
                loading={submitting}
                disabled={!title.trim() || !dueDate.trim() || members.length === 0}
              />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

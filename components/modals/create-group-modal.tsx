import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import type { Classroom } from "@/lib/classes";

interface Props {
  /** Fixed class to create in (class detail screen)... */
  classId?: string;
  /** ...or a list to pick from (groups tab). Provide one of the two. */
  classes?: Classroom[];
  visible: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export function CreateGroupModal({ classId, classes, visible, onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [selectedClassId, setSelectedClassId] = useState(classId ?? classes?.[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // default to the fixed class, or the first pickable one, when opened
  useEffect(() => {
    if (visible && !selectedClassId) {
      setSelectedClassId(classId ?? classes?.[0]?.id ?? "");
    }
  }, [visible, selectedClassId, classId, classes]);

  function handleClose() {
    setName("");
    setError(null);
    onClose();
  }

  async function handleCreate() {
    if (!name.trim()) return;
    if (!selectedClassId) {
      setError("Pick a class for the group.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.createGroup(selectedClassId, name.trim());
      setName("");
      onCreated?.();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create group.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        className="flex-1 justify-end bg-black/50"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable className="absolute inset-0" onPress={handleClose} />
        <View className="gap-6 rounded-t-3xl bg-background p-6 pb-10">
          <View className="flex-row items-center justify-between">
            <Text className="text-xl font-bold text-foreground">Create a group</Text>
            <Pressable
              accessibilityRole="button"
              onPress={handleClose}
              className="h-9 w-9 items-center justify-center rounded-full active:bg-secondary"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={22} color="#71717a" />
            </Pressable>
          </View>

          {/* Class picker — only when the caller passed a list to choose from */}
          {!classId && classes && classes.length > 0 ? (
            <View className="gap-2">
              <Text className="text-sm font-bold text-foreground">Class</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="gap-2"
              >
                {classes.map((c) => (
                  <Pressable
                    key={c.id}
                    onPress={() => setSelectedClassId(c.id)}
                    className={`rounded-xl border px-4 py-2.5 ${
                      selectedClassId === c.id
                        ? "border-primary bg-primary/10"
                        : "border-border bg-transparent"
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        selectedClassId === c.id ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {c.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ) : null}

          <Input
            label="Group name"
            placeholder="e.g. Project Team A"
            value={name}
            onChangeText={setName}
            autoFocus
            autoCapitalize="words"
          />
          {error ? <Text className="text-sm text-red-500">{error}</Text> : null}
          <Button label="Create group" loading={busy} disabled={!name.trim()} onPress={handleCreate} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

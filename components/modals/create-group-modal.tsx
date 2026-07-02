import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

interface Props {
  classId: string;
  visible: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export function CreateGroupModal({ classId, visible, onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClose() {
    setName("");
    setError(null);
    onClose();
  }

  async function handleCreate() {
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await api.createGroup(classId, name.trim());
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

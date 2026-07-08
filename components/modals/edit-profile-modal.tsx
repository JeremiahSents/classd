import { useEffect, useState } from "react";
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
import { useToast } from "@/components/ui/toast";
import { useSession } from "@/lib/session";

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

export function EditProfileModal({ visible, onClose }: EditProfileModalProps) {
  const { name, updateName } = useSession();
  const toast = useToast();
  const [value, setValue] = useState(name);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // reset the field to the current name each time the modal opens
  useEffect(() => {
    if (visible) {
      setValue(name);
      setError(null);
    }
  }, [visible, name]);

  function handleClose() {
    setError(null);
    onClose();
  }

  async function handleSave() {
    const trimmed = value.trim();
    if (!trimmed) {
      setError("Enter a display name.");
      return;
    }
    if (trimmed === name) {
      handleClose();
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await updateName(trimmed);
      onClose();
      toast.success("Profile updated!", "✨");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save your name.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        className="flex-1 justify-end bg-black/50"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable className="absolute inset-0" onPress={handleClose} />
        <View>
          <View className="gap-6 rounded-t-3xl bg-background p-6 pb-10">
            <View className="flex-row items-center justify-between">
              <Text className="text-xl font-bold text-foreground">Edit profile</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                onPress={handleClose}
                className="h-9 w-9 items-center justify-center rounded-full active:bg-secondary"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={22} color="#71717a" />
              </Pressable>
            </View>

            <View className="gap-2">
              <Input
                label="Display name"
                placeholder="Your name"
                value={value}
                onChangeText={(v) => {
                  setValue(v);
                  setError(null);
                }}
                autoCapitalize="words"
                autoFocus
                returnKeyType="done"
                onSubmitEditing={() => value.trim() && handleSave()}
              />
              {error ? (
                <Text className="text-sm text-destructive">{error}</Text>
              ) : null}
            </View>

            <Button
              label="Save changes"
              loading={saving}
              disabled={!value.trim()}
              onPress={handleSave}
            />
          </View>
          {/* Solid filler to cover the gap left by keyboard padding */}
          <View className="absolute left-0 right-0 top-full h-[1000px] bg-background" />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

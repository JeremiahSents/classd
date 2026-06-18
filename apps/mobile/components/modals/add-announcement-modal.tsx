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
import { useClasses } from "@/lib/classes-store";

interface AddAnnouncementModalProps {
  unitId: string;
  visible: boolean;
  onClose: () => void;
}

export function AddAnnouncementModal({
  unitId,
  visible,
  onClose,
}: AddAnnouncementModalProps) {
  const { addAnnouncement } = useClasses();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  function handleClose() {
    setTitle("");
    setContent("");
    onClose();
  }

  function handleAdd() {
    addAnnouncement(unitId, { title, content });
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
            <Text className="text-xl font-bold text-foreground">
              New announcement
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={handleClose}
              className="h-9 w-9 items-center justify-center rounded-full active:bg-secondary"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={22} color="#71717a" />
            </Pressable>
          </View>

          <View className="gap-4">
            <Input
              label="Title"
              placeholder="e.g. Class cancelled Monday"
              value={title}
              onChangeText={setTitle}
              autoFocus
            />
            <Input
              label="Message"
              placeholder="Write your announcement"
              value={content}
              onChangeText={setContent}
              multiline
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
              label="Post"
              disabled={!title.trim()}
              onPress={handleAdd}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

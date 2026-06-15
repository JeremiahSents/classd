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

interface AddUnitModalProps {
  classId: string;
  visible: boolean;
  onClose: () => void;
}

export function AddUnitModal({ classId, visible, onClose }: AddUnitModalProps) {
  const { addUnit } = useClasses();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  function handleClose() {
    setName("");
    setCode("");
    onClose();
  }

  function handleAdd() {
    addUnit(classId, name, code);
    handleClose();
  }

  const canAdd = name.trim().length > 0;

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
            <Text className="text-xl font-bold text-foreground">Add a unit</Text>
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
              label="Unit name"
              placeholder="e.g. Cell Biology"
              value={name}
              onChangeText={setName}
              autoFocus
              autoCapitalize="words"
            />
            <Input
              label="Unit code (optional)"
              placeholder="e.g. BIO 1101"
              value={code}
              onChangeText={setCode}
              autoCapitalize="characters"
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
              label="Add unit"
              disabled={!canAdd}
              onPress={handleAdd}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

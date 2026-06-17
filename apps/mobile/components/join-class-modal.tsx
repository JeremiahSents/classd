import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { X } from "lucide-react-native";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useClasses } from "@/lib/classes-store";

interface JoinClassModalProps {
  visible: boolean;
  onClose: () => void;
}

export function JoinClassModal({ visible, onClose }: JoinClassModalProps) {
  const router = useRouter();
  const { joinClass } = useClasses();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleClose() {
    setCode("");
    setError(null);
    onClose();
  }

  function handleJoin() {
    const match = joinClass(code);
    if (!match) {
      setError("No class found with that code.");
      return;
    }
    handleClose();
    router.push({ pathname: "/class/[id]", params: { id: match.id } });
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
            <Text className="text-xl font-bold text-foreground">Join a class</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={handleClose}
              className="h-9 w-9 items-center justify-center rounded-full active:bg-secondary"
            >
              <X size={22} color="#71717a" />
            </Pressable>
          </View>

          <View className="gap-2">
            <Input
              label="Class code"
              placeholder="Enter the 6-digit code"
              value={code}
              onChangeText={(v) => {
                setCode(v);
                setError(null);
              }}
              keyboardType="number-pad"
              autoFocus
            />
            {error ? (
              <Text className="text-center text-sm text-destructive">{error}</Text>
            ) : null}
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
              label="Join"
              disabled={!code.trim()}
              onPress={handleJoin}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

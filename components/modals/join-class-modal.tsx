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
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, type Class } from "@/lib/api";

interface JoinClassModalProps {
  visible: boolean;
  onClose: () => void;
  /** Called with the joined class so parent screens can refresh. */
  onJoined?: (cls: Class) => void;
}

export function JoinClassModal({
  visible,
  onClose,
  onJoined,
}: JoinClassModalProps) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleClose() {
    setCode("");
    setError(null);
    onClose();
  }

  async function handleJoin() {
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const cls = await api.joinClassByCode(code.trim());
      onJoined?.(cls);
      handleClose();
      router.push({ pathname: "/(tabs)/class/[id]", params: { id: cls.id } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "No class found with that code.");
    } finally {
      setLoading(false);
    }
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
        <Pressable className="absolute inset-0" onPress={handleClose} />
        <View>
          <View className="gap-6 rounded-t-3xl bg-background p-6 pb-10">
            <View className="flex-row items-center justify-between">
              <Text className="text-xl font-bold text-foreground">Join with class code</Text>
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
              <Text className="text-sm leading-5 text-muted-foreground">
                You will join as a member. Create a class when you need to manage one.
              </Text>
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
                label="Join as member"
                disabled={!code.trim()}
                loading={loading}
                onPress={handleJoin}
              />
            </View>
          </View>
          {/* Solid filler to cover the gap left by keyboard padding */}
          <View className="absolute left-0 right-0 top-full h-[1000px] bg-background" />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

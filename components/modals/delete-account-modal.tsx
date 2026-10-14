import { useEffect, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useSession } from "@/lib/session";

interface DeleteAccountModalProps {
  visible: boolean;
  onClose: () => void;
}

/** Password-confirmed, permanent account deletion. */
export function DeleteAccountModal({ visible, onClose }: DeleteAccountModalProps) {
  const router = useRouter();
  const toast = useToast();
  const { deleteAccount } = useSession();
  const [password, setPassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // start clean each time the modal opens
  useEffect(() => {
    if (visible) {
      setPassword("");
      setError(null);
    }
  }, [visible]);

  async function handleDelete() {
    if (!password) {
      setError("Enter your password to confirm.");
      return;
    }
    setError(null);
    setDeleting(true);
    try {
      await deleteAccount(password);
      onClose();
      toast.show("Your account has been deleted", { tone: "info", emoji: "👋" });
      router.replace("/(auth)/login");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete your account.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        className="flex-1 justify-end bg-black/50"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable className="absolute inset-0" onPress={onClose} />
        <View className="gap-5 rounded-t-3xl bg-background p-6 pb-10">
          <View className="flex-row items-center justify-between">
            <Text className="text-xl font-bold text-foreground">Delete account</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={onClose}
              className="h-9 w-9 items-center justify-center rounded-full active:bg-secondary"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={22} color="#71717a" />
            </Pressable>
          </View>

          <Text className="text-sm leading-5 text-muted-foreground">
            {
              "This permanently deletes your account, your profile, and your task progress, and removes you from all classes and groups. This can't be undone."
            }
          </Text>

          <Input
            label="Password"
            placeholder="Enter your password to confirm"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password"
          />

          {error ? <Text className="text-sm font-medium text-red-500">{error}</Text> : null}

          <Pressable
            accessibilityRole="button"
            disabled={deleting}
            onPress={handleDelete}
            className={`h-14 items-center justify-center rounded-xl bg-red-500 active:opacity-90 ${
              deleting ? "opacity-50" : ""
            }`}
          >
            <Text className="text-base font-semibold text-white">
              {deleting ? "Deleting..." : "Delete my account"}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

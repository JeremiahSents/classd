import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Share,
  Text,
  View,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  Tick02Icon,
  Copy01Icon,
  Share08Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, type Class } from "@/lib/api";

interface CreateClassModalProps {
  visible: boolean;
  onClose: () => void;
  /** Called with the newly created class so parent screens can refresh. */
  onCreated?: (cls: Class) => void;
}

export function CreateClassModal({
  visible,
  onClose,
  onCreated,
}: CreateClassModalProps) {
  const [name, setName] = useState("");
  const [created, setCreated] = useState<Class | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setName("");
    setCreated(null);
    setCopied(false);
    setError(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleContinue() {
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const cls = await api.createClass({ name: name.trim() });
      setCreated(cls);
      onCreated?.(cls);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create class.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!created) return;
    await Clipboard.setStringAsync(created.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function handleShare() {
    if (!created) return;
    await Share.share({
      message: `Join my class "${created.name}" on classd with code ${created.code}`,
    });
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
            {/* Header */}
            <View className="flex-row items-center justify-between">
              <Text className="text-xl font-bold text-foreground">
                {created ? "Class created" : "Create a class"}
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

            {created ? (
              <View className="gap-6">
                <View className="gap-2">
                  <Text className="text-base text-muted-foreground">
                    You are now the class rep for {created.name}. Share this code so classmates can join as members.
                  </Text>
                  <View className="items-center rounded-2xl border border-border bg-card py-6">
                    <Text className="text-4xl font-bold tracking-[0.3em] text-foreground">
                      {created.code}
                    </Text>
                  </View>
                </View>

                <View className="flex-row gap-3">
                  <Button
                    className="flex-1"
                    variant="outline"
                    label={copied ? "Copied" : "Copy code"}
                    leftIcon={
                      copied ? (
                        <HugeiconsIcon icon={Tick02Icon} size={20} color="#111" />
                      ) : (
                        <HugeiconsIcon icon={Copy01Icon} size={20} color="#111" />
                      )
                    }
                    onPress={handleCopy}
                  />
                  <Button
                    className="flex-1"
                    variant="outline"
                    label="Share link"
                    leftIcon={<HugeiconsIcon icon={Share08Icon} size={20} color="#111" />}
                    onPress={handleShare}
                  />
                </View>

                <Button label="Done" onPress={handleClose} />
              </View>
            ) : (
              <View className="gap-6">
                <Input
                  label="Class name"
                  placeholder="e.g. Intro to Biology"
                  value={name}
                  onChangeText={setName}
                  autoFocus
                  autoCapitalize="words"
                  returnKeyType="done"
                  onSubmitEditing={() => name.trim() && handleContinue()}
                />
                <Text className="text-sm leading-5 text-muted-foreground">
                  You will be listed as the class rep and get a code to share.
                </Text>
                {error ? (
                  <Text className="text-center text-sm text-destructive">
                    {error}
                  </Text>
                ) : null}
                <View className="flex-row gap-3">
                  <Button
                    className="flex-1"
                    variant="outline"
                    label="Cancel"
                    onPress={handleClose}
                  />
                  <Button
                    className="flex-1"
                    label="Continue"
                    disabled={!name.trim()}
                    loading={loading}
                    onPress={handleContinue}
                  />
                </View>
              </View>
            )}
          </View>
          {/* Solid filler to cover the gap left by keyboard padding */}
          <View className="absolute left-0 right-0 top-full h-[1000px] bg-background" />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

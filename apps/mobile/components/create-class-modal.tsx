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
import { Check, Copy, Share2, X } from "lucide-react-native";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useClasses } from "@/lib/classes-store";
import type { Classroom } from "@/lib/classes";

interface CreateClassModalProps {
  visible: boolean;
  onClose: () => void;
}

export function CreateClassModal({ visible, onClose }: CreateClassModalProps) {
  const { addClass } = useClasses();
  const [name, setName] = useState("");
  const [created, setCreated] = useState<Classroom | null>(null);
  const [copied, setCopied] = useState(false);

  function reset() {
    setName("");
    setCreated(null);
    setCopied(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleContinue() {
    const classroom = addClass(name);
    setCreated(classroom);
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
              <X size={22} color="#71717a" />
            </Pressable>
          </View>

          {created ? (
            <View className="gap-6">
              <View className="gap-2">
                <Text className="text-base text-muted-foreground">
                  Share this code so students can join {created.name}.
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
                      <Check size={20} color="#111" />
                    ) : (
                      <Copy size={20} color="#111" />
                    )
                  }
                  onPress={handleCopy}
                />
                <Button
                  className="flex-1"
                  variant="outline"
                  label="Share link"
                  leftIcon={<Share2 size={20} color="#111" />}
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
                  onPress={handleContinue}
                />
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

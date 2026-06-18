import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { NOTION_FACES } from "@/lib/avatars";

interface AvatarPickerModalProps {
  visible: boolean;
  currentAvatarUrl: string;
  onSelect: (url: string) => void;
  onClose: () => void;
}

export function AvatarPickerModal({
  visible,
  currentAvatarUrl,
  onSelect,
  onClose,
}: AvatarPickerModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/40">
        <View className="h-[80%] rounded-t-3xl bg-background">
          {/* Header */}
          <View className="flex-row items-center justify-between border-b border-border p-4">
            <View className="w-8" />
            <Text className="text-base font-bold text-foreground">
              Choose your face
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              className="h-8 w-8 items-center justify-center rounded-full bg-secondary active:opacity-70"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={18} color="#64748b" />
            </Pressable>
          </View>

          {/* Grid */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerClassName="p-6 pb-12"
          >
            <View className="flex-row flex-wrap justify-between gap-y-6">
              {NOTION_FACES.map((url, i) => {
                const isSelected = url === currentAvatarUrl;
                return (
                  <Pressable
                    key={i}
                    onPress={() => {
                      onSelect(url);
                      onClose();
                    }}
                    className={`h-[100px] w-[30%] items-center justify-center rounded-2xl border-2 ${
                      isSelected ? "border-primary bg-primary/5" : "border-border bg-secondary"
                    } active:opacity-70`}
                  >
                    <Image
                      source={{ uri: url }}
                      style={{ width: 80, height: 80 }}
                      contentFit="contain"
                    />
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

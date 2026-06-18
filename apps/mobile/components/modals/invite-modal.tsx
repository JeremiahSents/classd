import { Modal, Pressable, Text, View } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { JoinCodeCard } from "@/components/class/join-code-card";

interface InviteModalProps {
  className: string;
  code: string;
  visible: boolean;
  onClose: () => void;
}

export function InviteModal({
  className,
  code,
  visible,
  onClose,
}: InviteModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <View className="gap-6 rounded-t-3xl bg-background p-6 pb-10">
          <View className="flex-row items-center justify-between">
            <Text className="text-xl font-bold text-foreground">Invite students</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={onClose}
              className="h-9 w-9 items-center justify-center rounded-full active:bg-secondary"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={22} color="#71717a" />
            </Pressable>
          </View>
          <JoinCodeCard className={className} code={code} />
        </View>
      </View>
    </Modal>
  );
}

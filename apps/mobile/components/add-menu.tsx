import { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  GraduationCap,
  Megaphone,
  Plus,
  ClipboardList,
  type LucideIcon,
} from "lucide-react-native";

interface AddMenuProps {
  onNewClass: () => void;
  onNewAnnouncement?: () => void;
  onNewTask?: () => void;
}

interface MenuItem {
  label: string;
  Icon: LucideIcon;
  onPress?: () => void;
}

export function AddMenu({
  onNewClass,
  onNewAnnouncement,
  onNewTask,
}: AddMenuProps) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  const items: MenuItem[] = [
    { label: "New class", Icon: GraduationCap, onPress: onNewClass },
    { label: "New announcement", Icon: Megaphone, onPress: onNewAnnouncement },
    { label: "New task", Icon: ClipboardList, onPress: onNewTask },
  ];

  function select(item: MenuItem) {
    setOpen(false);
    item.onPress?.();
  }

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add"
        onPress={() => setOpen(true)}
        className="h-11 w-11 items-center justify-center rounded-full bg-primary active:opacity-90"
      >
        <Plus size={22} color="#fff" />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        {/* Tap-outside backdrop */}
        <Pressable className="flex-1" onPress={() => setOpen(false)}>
          <View
            style={{ position: "absolute", top: insets.top + 56, right: 16 }}
            className="w-60 overflow-hidden rounded-2xl border border-border bg-popover shadow-lg"
          >
            {items.map((item, index) => (
              <Pressable
                key={item.label}
                accessibilityRole="button"
                onPress={() => select(item)}
                className={`flex-row items-center gap-3 px-4 py-3.5 active:bg-secondary ${
                  index > 0 ? "border-t border-border" : ""
                }`}
              >
                <item.Icon size={20} color="#4f46e5" />
                <Text className="text-base font-medium text-popover-foreground">
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

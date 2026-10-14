import { Pressable, Text, View } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import type { IconSvgElement } from "@hugeicons/react-native";
import { Delete02Icon, File01Icon, File02Icon, Image01Icon } from "@hugeicons/core-free-icons";

interface MaterialRowProps {
  name: string;
  sizeLabel?: string;
  addedLabel: string;
  mimeType?: string;
  /** Open/download the file. */
  onPress?: () => void;
  /** Shown to class managers only. */
  onDelete?: () => void;
}

function iconFor(mimeType?: string): IconSvgElement {
  if (!mimeType) return File02Icon;
  if (mimeType.startsWith("image/")) return Image01Icon;
  if (mimeType === "application/pdf" || mimeType.includes("word")) return File01Icon;
  return File02Icon;
}

export function MaterialRow({
  name,
  sizeLabel,
  addedLabel,
  mimeType,
  onPress,
  onDelete,
}: MaterialRowProps) {
  const icon = iconFor(mimeType);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${name}`}
      onPress={onPress}
      disabled={!onPress}
      className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-4 active:bg-secondary"
    >
      <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
        <HugeiconsIcon icon={icon} size={20} color="#4f46e5" />
      </View>
      <View className="flex-1">
        <Text className="text-base font-semibold text-foreground" numberOfLines={1}>
          {name}
        </Text>
        <Text className="text-sm text-muted-foreground">
          {sizeLabel ? `${sizeLabel} · ` : ""}
          {addedLabel}
        </Text>
      </View>
      {onDelete ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Delete ${name}`}
          onPress={onDelete}
          hitSlop={8}
          className="h-9 w-9 items-center justify-center rounded-full active:bg-red-500/10"
        >
          <HugeiconsIcon icon={Delete02Icon} size={18} color="#ef4444" />
        </Pressable>
      ) : null}
    </Pressable>
  );
}

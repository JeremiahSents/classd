import { Text, View } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import type { IconSvgElement } from "@hugeicons/react-native";
import { File01Icon, File02Icon, Image01Icon } from "@hugeicons/core-free-icons";

interface MaterialRowProps {
  name: string;
  sizeLabel?: string;
  addedLabel: string;
  mimeType?: string;
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
}: MaterialRowProps) {
  const icon = iconFor(mimeType);
  return (
    <View className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-4">
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
    </View>
  );
}

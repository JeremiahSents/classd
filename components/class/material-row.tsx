import { Text, View } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import type { IconSvgElement } from "@hugeicons/react-native";
import { File01Icon, File02Icon, Image01Icon } from "@hugeicons/core-free-icons";
import { formatTimeAgo } from "@/lib/utils";

interface MaterialRowProps {
  name: string;
  sizeBytes?: number;
  /** ISO timestamp — shown as "2h ago", "Jun 15", etc. */
  createdAt: string;
  mimeType?: string;
}

function iconFor(mimeType?: string): IconSvgElement {
  if (!mimeType) return File02Icon;
  if (mimeType.startsWith("image/")) return Image01Icon;
  if (mimeType === "application/pdf" || mimeType.includes("word")) return File01Icon;
  return File02Icon;
}

function formatSize(bytes?: number): string | undefined {
  if (!bytes && bytes !== 0) return undefined;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MaterialRow({
  name,
  sizeBytes,
  createdAt,
  mimeType,
}: MaterialRowProps) {
  const icon = iconFor(mimeType);
  const sizeLabel = formatSize(sizeBytes);
  const addedLabel = formatTimeAgo(createdAt);

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

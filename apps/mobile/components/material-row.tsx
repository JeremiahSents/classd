import { Text, View } from "react-native";
import { FileText, Image as ImageIcon, File } from "lucide-react-native";

interface MaterialRowProps {
  name: string;
  sizeLabel?: string;
  addedLabel: string;
  mimeType?: string;
}

function iconFor(mimeType?: string) {
  if (!mimeType) return File;
  if (mimeType.startsWith("image/")) return ImageIcon;
  if (mimeType === "application/pdf" || mimeType.includes("word")) return FileText;
  return File;
}

export function MaterialRow({
  name,
  sizeLabel,
  addedLabel,
  mimeType,
}: MaterialRowProps) {
  const Icon = iconFor(mimeType);
  return (
    <View className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-4">
      <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
        <Icon size={20} color="#4f46e5" />
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

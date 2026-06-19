import { Pressable, Text, View } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";

interface SectionHeaderProps {
  title: string;
  /** Optional "See all" affordance shown on the right. */
  actionLabel?: string;
  onAction?: () => void;
}

export function SectionHeader({
  title,
  actionLabel,
  onAction,
}: SectionHeaderProps) {
  return (
    <View className="flex-row items-center justify-between pb-1 pt-2">
      <Text className="text-lg font-bold text-foreground">{title}</Text>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          onPress={onAction}
          className="flex-row items-center active:opacity-60"
        >
          <Text className="text-sm font-semibold text-primary">{actionLabel}</Text>
          <HugeiconsIcon icon={ArrowRight01Icon} size={16} color="#4f46e5" />
        </Pressable>
      ) : null}
    </View>
  );
}

/** Muted placeholder shown when a section has no items yet. */
export function EmptySectionHint({ text }: { text: string }) {
  return (
    <View className="items-center rounded-2xl border border-dashed border-border bg-card py-8">
      <Text className="text-sm text-muted-foreground">{text}</Text>
    </View>
  );
}

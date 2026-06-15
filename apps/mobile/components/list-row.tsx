import { Text, View } from "react-native";
import { ClipboardList, Megaphone, type LucideIcon } from "lucide-react-native";

interface ListRowProps {
  Icon: LucideIcon;
  title: string;
  subtitle: string;
  meta: string;
}

function ListRow({ Icon, title, subtitle, meta }: ListRowProps) {
  return (
    <View className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-4">
      <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/10">
        <Icon size={20} color="#4f46e5" />
      </View>
      <View className="flex-1">
        <Text className="text-base font-semibold text-foreground" numberOfLines={1}>
          {title}
        </Text>
        <Text className="text-sm text-muted-foreground" numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <Text className="text-xs text-muted-foreground">{meta}</Text>
    </View>
  );
}

export function AssignmentRow({
  title,
  className,
  dueLabel,
}: {
  title: string;
  className: string;
  dueLabel: string;
}) {
  return (
    <ListRow Icon={ClipboardList} title={title} subtitle={className} meta={dueLabel} />
  );
}

export function AnnouncementRow({
  title,
  className,
  timeLabel,
}: {
  title: string;
  className: string;
  timeLabel: string;
}) {
  return (
    <ListRow Icon={Megaphone} title={title} subtitle={className} meta={timeLabel} />
  );
}

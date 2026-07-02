import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Megaphone01Icon, PlusSignIcon, Search01Icon } from "@hugeicons/core-free-icons";
import { QuickAddAnnouncementModal } from "@/components/modals/quick-add-announcement-modal";
import { useClasses } from "@/lib/classes-store";
import { useSession } from "@/lib/session";

export default function Announcements() {
  const { announcements, classes, className, membersForClass } = useClasses();
  const { user } = useSession();
  const [search, setSearch] = useState("");
  const [addVisible, setAddVisible] = useState(false);

  // Classes this user reps — they can quick-add announcements to them.
  const repClasses = classes.filter(
    (c) =>
      c.classRepId === user?.id ||
      membersForClass(c.id).find((m) => m.id === user?.id)?.role === "classRep",
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return announcements;
    return announcements.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.content.toLowerCase().includes(q) ||
        className(a.classId).toLowerCase().includes(q),
    );
  }, [announcements, search, className]);

  // group announcements by the class they belong to
  const grouped = useMemo(() => {
    const map = new Map<string, typeof visible>();
    for (const a of visible) {
      const list = map.get(a.classId) ?? [];
      list.push(a);
      map.set(a.classId, list);
    }
    return Array.from(map.entries());
  }, [visible]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 pb-4 pt-8">
        <Text className="text-2xl font-bold text-foreground">Announcements</Text>
        {repClasses.length > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="New announcement"
            onPress={() => setAddVisible(true)}
            className="h-11 w-11 items-center justify-center rounded-full bg-primary active:opacity-90"
          >
            <HugeiconsIcon icon={PlusSignIcon} size={22} color="#fff" />
          </Pressable>
        ) : null}
      </View>

      {/* Search */}
      <View className="px-6 pb-3">
        <View className="flex-row items-center gap-2 rounded-xl border border-border bg-secondary/50 px-3">
          <HugeiconsIcon icon={Search01Icon} size={18} color="#9ca3af" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search announcements..."
            className="h-11 flex-1 text-base text-foreground"
            placeholderTextColor="#9ca3af"
            autoCapitalize="none"
          />
        </View>
      </View>

      {grouped.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-3 px-6 pb-24">
          <HugeiconsIcon icon={Megaphone01Icon} size={48} color="#cbd5e1" />
          <Text className="text-sm font-semibold text-muted-foreground">
            {search ? "No announcements match your search" : "No announcements yet"}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerClassName="gap-5 px-6 pb-32 pt-2"
          showsVerticalScrollIndicator={false}
        >
          {grouped.map(([classId, classAnnouncements]) => (
            <View key={classId} className="gap-3">
              {/* class section header */}
              <Text className="text-xs font-black uppercase tracking-wider text-slate-900">
                {className(classId) || "Class"}{" "}
                <Text className="text-slate-400">({classAnnouncements.length})</Text>
              </Text>
              {classAnnouncements.map((a) => (
                <View
                  key={a.id}
                  className="gap-1.5 rounded-2xl border border-border bg-card p-4"
                >
                  <View className="flex-row items-center justify-between gap-3">
                    <Text className="flex-1 text-base font-semibold text-foreground">
                      {a.title}
                    </Text>
                    <Text className="text-xs text-muted-foreground">{a.timeLabel}</Text>
                  </View>
                  {a.content ? (
                    <Text className="text-sm text-muted-foreground">{a.content}</Text>
                  ) : null}
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      )}

      <QuickAddAnnouncementModal
        classes={repClasses}
        visible={addVisible}
        onClose={() => setAddVisible(false)}
      />
    </SafeAreaView>
  );
}

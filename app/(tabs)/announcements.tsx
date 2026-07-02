import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { ArrowLeft01Icon, Megaphone01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { useClasses } from "@/lib/classes-store";

export default function Announcements() {
  const router = useRouter();
  const { announcements, className } = useClasses();
  const [search, setSearch] = useState("");

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

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="flex-row items-center gap-2 px-4 pb-2 pt-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full active:bg-secondary"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={26} color="#111" />
        </Pressable>
        <Text className="text-xl font-bold text-foreground">Announcements</Text>
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

      {visible.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-3 px-6 pb-24">
          <HugeiconsIcon icon={Megaphone01Icon} size={48} color="#cbd5e1" />
          <Text className="text-sm font-semibold text-muted-foreground">
            {search ? "No announcements match your search" : "No announcements yet"}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerClassName="gap-3 px-6 pb-32 pt-2"
          showsVerticalScrollIndicator={false}
        >
          {visible.map((a) => (
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
              <Text className="text-xs font-medium text-primary">
                {className(a.classId)}
              </Text>
              {a.content ? (
                <Text className="text-sm text-muted-foreground">{a.content}</Text>
              ) : null}
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

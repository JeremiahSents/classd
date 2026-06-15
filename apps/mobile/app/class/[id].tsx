import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { BookOpen, ChevronLeft } from "lucide-react-native";
import { JoinCodeCard } from "@/components/join-code-card";
import { AddUnitModal } from "@/components/add-unit-modal";
import { MemberRow } from "@/components/member-row";
import { SectionHeader, EmptySectionHint } from "@/components/section-header";
import { useClasses } from "@/lib/classes-store";

export default function ClassDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    getClass,
    unitsForClass,
    membersForClass,
    tasksForUnit,
    announcementsForUnit,
  } = useClasses();
  const [addUnitVisible, setAddUnitVisible] = useState(false);

  const classroom = getClass(id);

  if (!classroom) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <Text className="text-base text-muted-foreground">Class not found.</Text>
      </SafeAreaView>
    );
  }

  const units = unitsForClass(id);
  const members = membersForClass(id);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center gap-2 px-4 pb-2 pt-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full active:bg-secondary"
        >
          <ChevronLeft size={26} color="#111" />
        </Pressable>
        <Text className="flex-1 text-xl font-bold text-foreground" numberOfLines={1}>
          {classroom.name}
        </Text>
      </View>

      <ScrollView
        contentContainerClassName="gap-4 px-6 pb-12 pt-2"
        showsVerticalScrollIndicator={false}
      >
        <JoinCodeCard className={classroom.name} code={classroom.code} />

        {/* Units */}
        <SectionHeader
          title="Units"
          actionLabel="Add"
          onAction={() => setAddUnitVisible(true)}
        />
        {units.length > 0 ? (
          units.map((unit) => {
            const taskCount = tasksForUnit(unit.id).length;
            const announcementCount = announcementsForUnit(unit.id).length;
            return (
              <View
                key={unit.id}
                className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-4"
              >
                <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <BookOpen size={20} color="#4f46e5" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-foreground">
                    {unit.name}
                  </Text>
                  <Text className="text-sm text-muted-foreground">
                    {unit.code ? `${unit.code} · ` : ""}
                    {taskCount} task{taskCount === 1 ? "" : "s"} ·{" "}
                    {announcementCount} announcement
                    {announcementCount === 1 ? "" : "s"}
                  </Text>
                </View>
              </View>
            );
          })
        ) : (
          <EmptySectionHint text="No units yet — add one to get started" />
        )}

        {/* Members */}
        <SectionHeader title={`Members (${members.length})`} />
        {members.length > 0 ? (
          members.map((member) => (
            <MemberRow
              key={member.id}
              name={member.name}
              email={member.email}
              isRep={classroom.classRepId === member.id}
            />
          ))
        ) : (
          <EmptySectionHint text="No one has joined with the code yet" />
        )}
      </ScrollView>

      <AddUnitModal
        classId={id}
        visible={addUnitVisible}
        onClose={() => setAddUnitVisible(false)}
      />
    </SafeAreaView>
  );
}

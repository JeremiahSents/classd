import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, ChevronRight, Hash, UserPlus } from "lucide-react-native";
import { InviteModal } from "@/components/invite-modal";
import { AddUnitModal } from "@/components/add-unit-modal";
import { MemberRow } from "@/components/member-row";
import { SectionHeader, EmptySectionHint } from "@/components/section-header";
import { useClasses } from "@/lib/classes-store";
import { useSession } from "@/lib/session";

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
  const { role } = useSession();
  const [addUnitVisible, setAddUnitVisible] = useState(false);
  const [inviteVisible, setInviteVisible] = useState(false);

  const isLecturer = role === "lecturer";
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
    <View className="flex-1 bg-background">
      {/* Banner */}
      <View className="h-44 w-full">
        <Image
          source={{ uri: classroom.coverUrl }}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
        />
        <SafeAreaView className="absolute left-0 right-0 top-0" edges={["top"]}>
          <View className="px-4 pt-2">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back"
              onPress={() => router.back()}
              className="h-10 w-10 items-center justify-center rounded-full bg-black/30 active:bg-black/50"
            >
              <ChevronLeft size={26} color="#fff" />
            </Pressable>
          </View>
        </SafeAreaView>
      </View>

      {/* Title block */}
      <View className="flex-row items-center justify-between gap-3 px-6 pb-2 pt-4">
        <View className="flex-1">
          <Text className="text-2xl font-bold text-foreground" numberOfLines={1}>
            {classroom.name}
          </Text>
          <Text className="text-sm text-muted-foreground">
            {members.length} member{members.length === 1 ? "" : "s"}
          </Text>
        </View>
        {isLecturer ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => setInviteVisible(true)}
            className="h-11 flex-row items-center gap-2 rounded-full bg-primary px-4 active:opacity-90"
          >
            <UserPlus size={18} color="#fff" />
            <Text className="text-sm font-semibold text-primary-foreground">
              Invite
            </Text>
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        contentContainerClassName="gap-2 px-6 pb-12 pt-2"
        showsVerticalScrollIndicator={false}
      >
        {/* Units as channels */}
        <SectionHeader
          title="Units"
          actionLabel={isLecturer ? "Add" : undefined}
          onAction={() => setAddUnitVisible(true)}
        />
        {units.length > 0 ? (
          units.map((unit) => {
            const taskCount = tasksForUnit(unit.id).length;
            const announcementCount = announcementsForUnit(unit.id).length;
            return (
              <Pressable
                key={unit.id}
                accessibilityRole="button"
                onPress={() =>
                  router.push({ pathname: "/unit/[id]", params: { id: unit.id } })
                }
                className="flex-row items-center gap-3 rounded-2xl px-2 py-3 active:bg-secondary"
              >
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-secondary">
                  <Hash size={20} color="#4f46e5" />
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
                <ChevronRight size={20} color="#9ca3af" />
              </Pressable>
            );
          })
        ) : (
          <EmptySectionHint
            text={
              isLecturer
                ? "No units yet — add one to get started"
                : "No units yet"
            }
          />
        )}

        {/* Members */}
        <View className="pt-2">
          <SectionHeader title={`Members (${members.length})`} />
        </View>
        {members.length > 0 ? (
          <View className="gap-3">
            {members.map((member) => (
              <MemberRow
                key={member.id}
                name={member.name}
                email={member.email}
                isRep={classroom.classRepId === member.id}
              />
            ))}
          </View>
        ) : (
          <EmptySectionHint text="No one has joined with the code yet" />
        )}
      </ScrollView>

      <AddUnitModal
        classId={id}
        visible={addUnitVisible}
        onClose={() => setAddUnitVisible(false)}
      />
      <InviteModal
        className={classroom.name}
        code={classroom.code}
        visible={inviteVisible}
        onClose={() => setInviteVisible(false)}
      />
    </View>
  );
}

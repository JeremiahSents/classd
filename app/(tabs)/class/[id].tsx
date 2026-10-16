import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowLeft01Icon,
  PlusSignIcon,
  UserAdd01Icon,
} from "@hugeicons/core-free-icons";
import { InviteModal } from "@/components/modals/invite-modal";
import { AddTaskModal } from "@/components/modals/add-task-modal";
import { AddAnnouncementModal } from "@/components/modals/add-announcement-modal";
import { MemberRow } from "@/components/class/member-row";
import { TaskRow } from "@/components/class/task-row";
import { SegmentedTabs } from "@/components/ui/segmented-tabs";
import { EmptySectionHint } from "@/components/ui/section-header";
import { AnnouncementCard } from "@/components/class/announcement-card";
import { AnnouncementDetailModal } from "@/components/modals/announcement-detail-modal";
import { useRefreshControl } from "@/components/ui/refresh-control";
import { useClasses } from "@/lib/classes-store";
import { useSession } from "@/lib/session";
import { confirmAction } from "@/lib/confirm";
import { api, type Group } from "@/lib/api";
import type { Announcement } from "@/lib/types";
import { CreateGroupModal } from "@/components/modals/create-group-modal";
import { useToast } from "@/components/ui/toast";

const TABS = ["Tasks", "Updates", "Members", "Groups"];
// indexes into TABS, so the checks below read by name
const TAB = { tasks: 0, updates: 1, members: 2, groups: 3 } as const;

export default function ClassDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    getClass,
    membersForClass,
    tasksForClass,
    announcementsForClass,
    removeMember,
    leaveClass,
    isTaskComplete,
    toggleTaskComplete,
    refresh,
    className,
    canManageClass,
  } = useClasses();
  const { user } = useSession();
  const toast = useToast();

  const [tab, setTab] = useState(0);
  const [inviteVisible, setInviteVisible] = useState(false);
  const [addTaskVisible, setAddTaskVisible] = useState(false);
  const [addAnnouncementVisible, setAddAnnouncementVisible] = useState(false);
  const [createGroupVisible, setCreateGroupVisible] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  const loadGroups = useCallback(async () => {
    try {
      setGroups(await api.listGroups(id));
    } catch {
      setGroups([]);
    }
  }, [id]);

  // refresh on focus so a just-assigned rep sees their manage controls
  useFocusEffect(
    useCallback(() => {
      void refresh(true);
      void loadGroups();
    }, [refresh, loadGroups]),
  );
  const refreshControl = useRefreshControl(() => Promise.all([refresh(true), loadGroups()]));

  const classroom = getClass(id);

  if (!classroom) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <Text className="text-base text-muted-foreground">Class not found.</Text>
      </SafeAreaView>
    );
  }

  const members = membersForClass(id);

  // Whoever is the assigned rep of THIS class (or an admin) can manage it.
  const canManage = canManageClass(id);
  // set when the user is enrolled (admins manage without being members)
  const myMemberRole = members.find((m) => m.id === user?.id)?.role;
  const tasks = tasksForClass(id);
  const announcements = announcementsForClass(id);

  async function handleRemoveMember(memberId: string, memberName: string) {
    const ok = await confirmAction({
      title: `Remove ${memberName || "this member"}?`,
      message: "They'll lose access to this class until they join again with the code.",
      confirmLabel: "Remove",
    });
    if (!ok) return;
    try {
      await removeMember(id, memberId);
      toast.success("Member removed", "👋");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not remove member.");
    }
  }

  async function handleLeave() {
    const ok = await confirmAction({
      title: `Leave ${classroom?.name ?? "this class"}?`,
      message: "You'll stop seeing its tasks and announcements. You can rejoin with the class code.",
      confirmLabel: "Leave",
    });
    if (!ok) return;
    try {
      await leaveClass(id);
      toast.success("You left the class", "👋");
      router.replace("/(tabs)/classes");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not leave the class.");
    }
  }

  function handleAdd() {
    if (tab === TAB.tasks) setAddTaskVisible(true);
    else if (tab === TAB.updates) setAddAnnouncementVisible(true);
    else if (tab === TAB.members) setInviteVisible(true);
    else setCreateGroupVisible(true); // Groups tab — any member can create
  }

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
              <HugeiconsIcon icon={ArrowLeft01Icon} size={26} color="#fff" />
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
          <Text className="mt-0.5 font-mono text-[11px] text-muted-foreground">
            ID {classroom.id.slice(0, 8).toUpperCase()}
          </Text>
        </View>
        {canManage || tab === TAB.groups ? (
          <Pressable
            accessibilityRole="button"
            onPress={handleAdd}
            className="h-11 flex-row items-center gap-2 rounded-full bg-primary px-4 active:opacity-90"
          >
            <HugeiconsIcon
              icon={tab === TAB.members ? UserAdd01Icon : PlusSignIcon}
              size={18}
              color="#fff"
            />
            <Text className="text-sm font-semibold text-primary-foreground">
              {tab === TAB.members ? "Invite" : "Add"}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {/* Tabs */}
      <View className="px-6 pb-2 pt-1">
        <SegmentedTabs tabs={TABS} active={tab} onChange={setTab} />
      </View>

      {/* Content */}
      <ScrollView
        refreshControl={refreshControl}
        contentContainerClassName="gap-4 px-6 pb-32 pt-3"
        showsVerticalScrollIndicator={false}
      >
        {/* Tasks */}
        {tab === TAB.tasks ? (
          tasks.length > 0 ? (
            tasks.map((t) => (
              <TaskRow
                key={t.id}
                title={t.title}
                description={t.description}
                dueLabel={t.dueLabel}
                completed={canManage ? undefined : isTaskComplete(t.id)}
                onToggle={canManage ? undefined : () => toggleTaskComplete(t.id)}
                onPress={() =>
                  router.push({ pathname: "/(tabs)/task/[id]", params: { id: t.id } })
                }
              />
            ))
          ) : (
            <EmptySectionHint
              text={canManage ? "No tasks yet — tap Add to post one" : "No tasks yet"}
            />
          )
        ) : null}

        {/* Announcements */}
        {tab === TAB.updates ? (
          announcements.length > 0 ? (
            announcements.map((a) => (
              <AnnouncementCard
                key={a.id}
                announcement={a}
                onPress={() => setSelectedAnnouncement(a)}
              />
            ))
          ) : (
            <EmptySectionHint
              text={
                canManage
                  ? "No announcements yet — tap Add to post one"
                  : "No announcements yet"
              }
            />
          )
        ) : null}

        {/* Members */}
        {tab === TAB.members ? (
          members.length > 0 ? (
            <View className="gap-3">
              {members.map((member) => {
                const isRep = classroom.classRepId === member.id;
                // managers can remove students (not themselves or the rep)
                const removable = canManage && !isRep && member.id !== user?.id;
                return (
                  <MemberRow
                    key={member.id}
                    name={member.name}
                    email={member.email}
                    isRep={isRep}
                    trailing={
                      removable ? (
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Remove ${member.name}`}
                          onPress={() => handleRemoveMember(member.id, member.name)}
                          className="rounded-full border border-red-300 px-3 py-1.5 active:bg-red-500/10"
                        >
                          <Text className="text-xs font-semibold text-red-500">Remove</Text>
                        </Pressable>
                      ) : undefined
                    }
                  />
                );
              })}
            </View>
          ) : (
            <EmptySectionHint text="No one has joined with the code yet" />
          )
        ) : null}
        {tab === TAB.members && myMemberRole ? (
          <Pressable
            accessibilityRole="button"
            onPress={handleLeave}
            className="mt-2 h-12 items-center justify-center rounded-xl border border-red-300 active:bg-red-500/10"
          >
            <Text className="text-base font-semibold text-red-500">Leave class</Text>
          </Pressable>
        ) : null}

        {/* Groups */}
        {tab === TAB.groups ? (
          groups.length > 0 ? (
            groups.map((g) => (
              <Pressable
                key={g.id}
                accessibilityRole="button"
                onPress={() =>
                  // cast: typed routes regenerate for group/[id] on next `expo start`
                  router.push({ pathname: "/(tabs)/group/[id]", params: { id: g.id } } as never)
                }
                className="gap-1 rounded-2xl border border-border bg-card p-4 active:bg-secondary"
              >
                <Text className="text-base font-semibold text-foreground">{g.name}</Text>
                {g.memberCount !== undefined ? (
                  <Text className="text-xs text-muted-foreground">
                    {g.memberCount} member{g.memberCount === 1 ? "" : "s"}
                  </Text>
                ) : null}
              </Pressable>
            ))
          ) : (
            <EmptySectionHint text="No groups yet — tap Add to create one" />
          )
        ) : null}
      </ScrollView>

      <InviteModal
        className={classroom.name}
        code={classroom.code}
        visible={inviteVisible}
        onClose={() => setInviteVisible(false)}
      />
      <AddTaskModal
        classId={id}
        visible={addTaskVisible}
        onClose={() => setAddTaskVisible(false)}
      />
      <AddAnnouncementModal
        classId={id}
        visible={addAnnouncementVisible}
        onClose={() => setAddAnnouncementVisible(false)}
      />
      <AnnouncementDetailModal
        announcement={selectedAnnouncement}
        className={className}
        onClose={() => setSelectedAnnouncement(null)}
      />
      <CreateGroupModal
        classId={id}
        visible={createGroupVisible}
        onClose={() => setCreateGroupVisible(false)}
        onCreated={loadGroups}
      />
    </View>
  );
}

import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import * as Clipboard from "expo-clipboard";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowLeft01Icon,
  Copy01Icon,
  PlusSignIcon,
  Tick02Icon,
  UserAdd01Icon,
} from "@hugeicons/core-free-icons";
import { InviteModal } from "@/components/modals/invite-modal";
import { AddTaskModal } from "@/components/modals/add-task-modal";
import { AddAnnouncementModal } from "@/components/modals/add-announcement-modal";
import { MemberRow } from "@/components/class/member-row";
import { TaskRow } from "@/components/class/task-row";
import { MaterialRow } from "@/components/class/material-row";
import { SegmentedTabs } from "@/components/ui/segmented-tabs";
import { EmptySectionHint } from "@/components/ui/section-header";
import { useClassDetail } from "@/lib/hooks/use-class-detail";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";
import { goBackOrHome } from "@/lib/navigation";
import { formatTimeAgo } from "@/lib/utils";
import type { Task, Announcement } from "@/lib/api";

const TABS = ["Tasks", "Materials", "Updates", "Members"];

export default function ClassDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const classId = Array.isArray(id) ? id[0] : id;
  const {
    classroom,
    members,
    tasks,
    announcements,
    materials,
    completedTaskIds,
    loading,
    error,
    reloadTasks,
    reloadAnnouncements,
    reloadMaterials,
    reloadCompletions,
  } = useClassDetail(classId ?? "");
  const { user } = useSession();

  const [tab, setTab] = useState(0);
  const [inviteVisible, setInviteVisible] = useState(false);
  const [addTaskVisible, setAddTaskVisible] = useState(false);
  const [addAnnouncementVisible, setAddAnnouncementVisible] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const canManageClass =
    !!user && !!classroom && (classroom.ownerId === user.id || classroom.classRepId === user.id);

  async function handleToggleTask(taskId: string) {
    const isDone = completedTaskIds.includes(taskId);
    setActionError(null);
    try {
      await api.setTaskComplete(taskId, !isDone);
      reloadCompletions();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to update task.");
    }
  }

  async function pickFile() {
    const result = await DocumentPicker.getDocumentAsync({
      multiple: false,
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    setActionError(null);
    try {
      await api.uploadMaterial(classId ?? "", {
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType ?? undefined,
        sizeBytes: asset.size ?? undefined,
      });
      reloadMaterials();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to upload material.");
    }
  }

  async function handleCopyClassCode() {
    const code = classroom?.code;
    if (!code) return;
    await Clipboard.setStringAsync(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1500);
  }

  function handleAdd() {
    if (tab === 0) setAddTaskVisible(true);
    else if (tab === 1) pickFile();
    else if (tab === 2) setAddAnnouncementVisible(true);
    else setInviteVisible(true);
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (error || !classroom) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <Text className="text-base text-muted-foreground">
          {error ?? "Class not found."}
        </Text>
      </SafeAreaView>
    );
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
              onPress={() => goBackOrHome(router)}
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
          <View className="mt-1 flex-row flex-wrap items-center gap-2">
            <Text className="text-sm text-muted-foreground">
              {members.length} member{members.length === 1 ? "" : "s"}
            </Text>
            {classroom.code ? (
              <>
                <View className="h-1 w-1 rounded-full bg-muted-foreground/50" />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Copy class code ${classroom.code}`}
                  onPress={handleCopyClassCode}
                  hitSlop={8}
                  className="flex-row items-center gap-1 rounded-full bg-secondary px-2.5 py-1 active:opacity-70"
                >
                  <Text className="text-xs font-semibold text-foreground">
                    {classroom.code}
                  </Text>
                  <HugeiconsIcon
                    icon={copiedCode ? Tick02Icon : Copy01Icon}
                    size={14}
                    color={copiedCode ? "#22c55e" : "#71717a"}
                  />
                </Pressable>
              </>
            ) : null}
          </View>
        </View>
        {canManageClass ? (
          <Pressable
            accessibilityRole="button"
            onPress={handleAdd}
            className="h-11 flex-row items-center gap-2 rounded-full bg-primary px-4 active:opacity-90"
          >
            <HugeiconsIcon
              icon={tab === 3 ? UserAdd01Icon : PlusSignIcon}
              size={18}
              color="#fff"
            />
            <Text className="text-sm font-semibold text-primary-foreground">
              {tab === 3 ? "Invite" : "Add"}
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
        contentContainerClassName="gap-4 px-6 pb-32 pt-3"
        showsVerticalScrollIndicator={false}
      >
        {actionError ? (
          <Text className="text-center text-sm font-medium text-red-500">
            {actionError}
          </Text>
        ) : null}

        {/* Tasks */}
        {tab === 0 ? (
          tasks.length > 0 ? (
            tasks.map((t: Task) => (
              <TaskRow
                key={t.id}
                title={t.title}
                description={t.description}
                type={t.type}
                dueAt={t.dueAt}
                completed={canManageClass ? undefined : completedTaskIds.includes(t.id)}
                onToggle={canManageClass ? undefined : () => handleToggleTask(t.id)}
              />
            ))
          ) : (
            <EmptySectionHint
              text={canManageClass ? "No tasks yet - tap Add to post one" : "No tasks yet"}
            />
          )
        ) : null}

        {/* Materials */}
        {tab === 1 ? (
          materials.length > 0 ? (
            materials.map((m) => (
              <MaterialRow
                key={m.id}
                name={m.name}
                sizeBytes={m.sizeBytes}
                createdAt={m.createdAt}
                mimeType={m.mimeType}
              />
            ))
          ) : (
            <EmptySectionHint
              text={
                canManageClass
                  ? "No materials yet - tap Add to upload a file"
                  : "No materials yet"
              }
            />
          )
        ) : null}

        {/* Announcements */}
        {tab === 2 ? (
          announcements.length > 0 ? (
            announcements.map((a: Announcement) => (
              <View
                key={a.id}
                className="gap-1.5 rounded-2xl border border-border bg-card p-4"
              >
                <View className="flex-row items-center justify-between gap-3">
                  <Text className="flex-1 text-base font-semibold text-foreground">
                    {a.title}
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    {formatTimeAgo(a.createdAt)}
                  </Text>
                </View>
                {a.content ? (
                  <Text className="text-sm text-muted-foreground">{a.content}</Text>
                ) : null}
              </View>
            ))
          ) : (
            <EmptySectionHint
              text={
                canManageClass
                  ? "No announcements yet - tap Add to post one"
                  : "No announcements yet"
              }
            />
          )
        ) : null}

        {/* Members */}
        {tab === 3 ? (
          members.length > 0 ? (
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
        classId={classId ?? ""}
        visible={addTaskVisible}
        onClose={() => setAddTaskVisible(false)}
        onCreated={() => reloadTasks()}
      />
      <AddAnnouncementModal
        classId={classId ?? ""}
        visible={addAnnouncementVisible}
        onClose={() => setAddAnnouncementVisible(false)}
        onCreated={() => reloadAnnouncements()}
      />
    </View>
  );
}

import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { ArrowLeft01Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { SegmentedTabs } from "@/components/ui/segmented-tabs";
import { TaskRow } from "@/components/class/task-row";
import { MaterialRow } from "@/components/class/material-row";
import { AddTaskModal } from "@/components/modals/add-task-modal";
import { AddAnnouncementModal } from "@/components/modals/add-announcement-modal";
import { EmptySectionHint } from "@/components/ui/section-header";
import { useClasses } from "@/lib/classes-store";
import { useSession } from "@/lib/session";

const TABS = ["Tasks", "Announcements", "Materials"];

function formatSize(bytes?: number): string | undefined {
  if (!bytes && bytes !== 0) return undefined;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UnitDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    getUnit,
    getClass,
    tasksForUnit,
    announcementsForUnit,
    materialsForUnit,
    addMaterial,
    isTaskComplete,
    toggleTaskComplete,
  } = useClasses();

  const { role } = useSession();
  const [tab, setTab] = useState(0);
  const [addTaskVisible, setAddTaskVisible] = useState(false);
  const [addAnnouncementVisible, setAddAnnouncementVisible] = useState(false);

  const isLecturer = role === "lecturer";
  const unit = getUnit(id);

  if (!unit) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <Text className="text-base text-muted-foreground">Unit not found.</Text>
      </SafeAreaView>
    );
  }

  const classroom = getClass(unit.classId);
  const tasks = tasksForUnit(id);
  const announcements = announcementsForUnit(id);
  const materials = materialsForUnit(id);

  async function pickFile() {
    const result = await DocumentPicker.getDocumentAsync({
      multiple: false,
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    addMaterial(id, {
      name: asset.name,
      sizeLabel: formatSize(asset.size),
      mimeType: asset.mimeType,
      uri: asset.uri,
    });
  }

  function handleAdd() {
    if (tab === 0) setAddTaskVisible(true);
    else if (tab === 1) setAddAnnouncementVisible(true);
    else pickFile();
  }

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
          <HugeiconsIcon icon={ArrowLeft01Icon} size={26} color="#111" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-xl font-bold text-foreground" numberOfLines={1}>
            # {unit.name}
          </Text>
          {classroom ? (
            <Text className="text-sm text-muted-foreground" numberOfLines={1}>
              {classroom.name}
            </Text>
          ) : null}
        </View>
        {isLecturer ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add"
            onPress={handleAdd}
            className="h-10 w-10 items-center justify-center rounded-full bg-primary active:opacity-90"
          >
            <HugeiconsIcon icon={PlusSignIcon} size={22} color="#fff" />
          </Pressable>
        ) : (
          <View className="h-10 w-10" />
        )}
      </View>

      <View className="px-6 pb-2 pt-1">
        <SegmentedTabs tabs={TABS} active={tab} onChange={setTab} />
      </View>

      <ScrollView
        contentContainerClassName="gap-4 px-6 pb-12 pt-3"
        showsVerticalScrollIndicator={false}
      >
        {tab === 0 ? (
          tasks.length > 0 ? (
            tasks.map((t) => (
              <TaskRow
                key={t.id}
                title={t.title}
                description={t.description}
                type={t.type}
                dueLabel={t.dueLabel}
                completed={isLecturer ? undefined : isTaskComplete(t.id)}
                onToggle={isLecturer ? undefined : () => toggleTaskComplete(t.id)}
              />
            ))
          ) : (
            <EmptySectionHint
              text={isLecturer ? "No tasks yet — tap + to post one" : "No tasks yet"}
            />
          )
        ) : null}

        {tab === 1 ? (
          announcements.length > 0 ? (
            announcements.map((a) => (
              <View
                key={a.id}
                className="gap-1.5 rounded-2xl border border-border bg-card p-4"
              >
                <View className="flex-row items-center justify-between gap-3">
                  <Text className="flex-1 text-base font-semibold text-foreground">
                    {a.title}
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    {a.timeLabel}
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
                isLecturer
                  ? "No announcements yet — tap + to post one"
                  : "No announcements yet"
              }
            />
          )
        ) : null}

        {tab === 2 ? (
          materials.length > 0 ? (
            materials.map((m) => (
              <MaterialRow
                key={m.id}
                name={m.name}
                sizeLabel={m.sizeLabel}
                addedLabel={m.addedLabel}
                mimeType={m.mimeType}
              />
            ))
          ) : (
            <EmptySectionHint
              text={
                isLecturer
                  ? "No materials yet — tap + to upload a file"
                  : "No materials yet"
              }
            />
          )
        ) : null}
      </ScrollView>

      <AddTaskModal
        unitId={id}
        visible={addTaskVisible}
        onClose={() => setAddTaskVisible(false)}
      />
      <AddAnnouncementModal
        unitId={id}
        visible={addAnnouncementVisible}
        onClose={() => setAddAnnouncementVisible(false)}
      />
    </SafeAreaView>
  );
}

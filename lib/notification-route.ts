// Where a tapped push notification should take the user, from the `data` the
// Cloud Functions attach (see functions/src/index.ts). Pure, so it's unit-tested
// directly (tests/unit/); used by components/navigation/notification-router.tsx.

export interface NotificationRoute {
  pathname: "/task/[id]" | "/class/[id]" | "/group/[id]";
  params: { id: string };
}

export function routeForNotification(
  data: Record<string, unknown> | undefined,
): NotificationRoute | null {
  if (!data) return null;
  const str = (v: unknown) => (typeof v === "string" && v ? v : undefined);
  // new-task push carries taskId; deadline reminders carry kind + docId
  const taskId = str(data.taskId) ?? (data.kind === "task" ? str(data.docId) : undefined);
  if (taskId) return { pathname: "/task/[id]", params: { id: taskId } };
  // group tasks open their group
  const groupId = str(data.groupId);
  if (groupId) return { pathname: "/group/[id]", params: { id: groupId } };
  // announcements open their class
  const classId = str(data.classId);
  if (classId) return { pathname: "/class/[id]", params: { id: classId } };
  return null;
}

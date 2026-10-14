// Class/task/member/announcement state, backed by the real `@/lib/api`.
//
// Data is loaded from the backend when a user signs in and refreshed after
// mutations. UI-shaped types (with human labels like "Due tomorrow") are mapped
// from the API's ISO-timestamp shapes here, so screens stay presentation-only.
//
// Materials are loaded per class, on demand (`loadMaterials`), since they're
// only shown on the class screen.
import { AppState } from "react-native";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  api,
  ApiError,
  type Announcement as ApiAnnouncement,
  type Class as ApiClass,
  type Material as ApiMaterial,
  type Member as ApiMember,
  type Task as ApiTask,
  type UpdateAnnouncementInput,
  type UploadFileInput,
} from "@/lib/api";
import { dueLabel, formatSize, relativeTime } from "@/lib/format";
import { useSession } from "@/lib/session";
import type { Classroom } from "@/lib/classes";
import type { Announcement, AnnouncementCategory, GroupTaskItem, Material, Member, Task } from "@/lib/types";

/* ------------------------------------------------------------------ *
 * API -> UI mappers
 * ------------------------------------------------------------------ */

const toClassroom = (c: ApiClass): Classroom => ({
  id: c.id,
  name: c.name,
  code: c.code,
  coverUrl: c.coverUrl,
  classRepId: c.classRepId,
  schedules: c.schedules,
});

const toTask = (t: ApiTask): Task => ({
  id: t.id,
  classId: t.classId,
  // Fall back to a visible placeholder so a task doc missing its title still
  // reads as a real row instead of a blank line.
  title: t.title?.trim() || "Untitled task",
  description: t.description,
  dueLabel: dueLabel(t.dueAt),
  dueAt: t.dueAt,
});

const toAnnouncement = (a: ApiAnnouncement): Announcement => ({
  id: a.id,
  classId: a.classId,
  title: a.title,
  content: a.content,
  category: a.category,
  timeLabel: relativeTime(a.createdAt),
  createdAt: a.createdAt,
  ...(a.dueAt ? { dueLabel: dueLabel(a.dueAt), dueAt: a.dueAt } : {}),
});

const toMaterial = (m: ApiMaterial): Material => ({
  id: m.id,
  classId: m.classId,
  name: m.name,
  sizeLabel: formatSize(m.sizeBytes),
  mimeType: m.mimeType,
  url: m.url,
  addedLabel: relativeTime(m.createdAt),
  createdAt: m.createdAt,
});

const toMember = (m: ApiMember): Member => ({
  id: m.id,
  name: m.name,
  email: m.email,
  role: m.role,
});

/* ------------------------------------------------------------------ *
 * Store
 * ------------------------------------------------------------------ */

interface ClassesStore {
  loading: boolean;
  classes: Classroom[];
  tasks: Task[];
  announcements: Announcement[];
  groupTasks: GroupTaskItem[];
  /** How many project groups the user belongs to (drives the dashboard section). */
  groupCount: number;
  enrolledClassIds: string[];

  getClass: (classId: string) => Classroom | undefined;
  getTask: (taskId: string) => Task | undefined;
  membersForClass: (classId: string) => Member[];
  tasksForClass: (classId: string) => Task[];
  announcementsForClass: (classId: string) => Announcement[];
  materialsForClass: (classId: string) => Material[];
  className: (classId: string) => string;
  /** Admin, or the rep of this class — can post, edit and delete its content. */
  canManageClass: (classId: string) => boolean;

  isTaskComplete: (taskId: string) => boolean;
  toggleTaskComplete: (taskId: string) => void;
  toggleGroupTask: (groupId: string, taskId: string) => void;

  refresh: (silent?: boolean) => Promise<void>;
  joinClass: (code: string) => Promise<Classroom | null>;
  addClass: (name: string) => Promise<Classroom>;
  assignCR: (classId: string, memberId: string) => void;
  removeMember: (classId: string, memberId: string) => Promise<void>;
  /** Leave a class the current user is enrolled in. */
  leaveClass: (classId: string) => Promise<void>;
  addTask: (
    classId: string,
    input: { title: string; description: string; dueAt: string },
  ) => Promise<Task>;
  updateTask: (
    classId: string,
    taskId: string,
    patch: Partial<{ title: string; description: string; dueAt: string }>,
  ) => Promise<Task>;
  deleteTask: (classId: string, taskId: string) => Promise<void>;
  addAnnouncement: (
    classId: string,
    input: { title: string; content: string; category: AnnouncementCategory; dueAt?: string },
  ) => Promise<Announcement>;
  updateAnnouncement: (
    classId: string,
    announcementId: string,
    patch: UpdateAnnouncementInput,
  ) => Promise<Announcement>;
  deleteAnnouncement: (classId: string, announcementId: string) => Promise<void>;
  /** Fetch a class's materials (called when the class screen opens). */
  loadMaterials: (classId: string) => Promise<void>;
  uploadMaterial: (classId: string, file: UploadFileInput) => Promise<Material>;
  deleteMaterial: (classId: string, materialId: string) => Promise<void>;
}

const ClassesContext = createContext<ClassesStore | null>(null);

export function ClassesProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user, role } = useSession();

  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [membersByClass, setMembersByClass] = useState<Record<string, Member[]>>({});
  const [groupTasks, setGroupTasks] = useState<GroupTaskItem[]>([]);
  const [groupCount, setGroupCount] = useState(0);
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);
  const [materialsByClass, setMaterialsByClass] = useState<Record<string, Material[]>>({});

  const refresh = useCallback(async (silent = false) => {
    if (!isAuthenticated) {
      setClasses([]);
      setTasks([]);
      setAnnouncements([]);
      setMembersByClass({});
      setGroupTasks([]);
      setGroupCount(0);
      setCompletedTaskIds([]);
      setMaterialsByClass({});
      setLoading(false);
      return;
    }
    if (!silent) setLoading(true);
    try {
      const [cls, myTasks, myAnns, completed] = await Promise.all([
        api.listClasses(),
        api.listMyTasks(),
        api.listMyAnnouncements(),
        api.listCompletedTaskIds(),
      ]);
      setClasses(cls.map(toClassroom));
      // tasks soonest-due first; announcements newest first (ISO sorts chronologically)
      setTasks([...myTasks].sort((a, b) => a.dueAt.localeCompare(b.dueAt)).map(toTask));
      setAnnouncements(
        [...myAnns].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(toAnnouncement),
      );
      setCompletedTaskIds(completed);

      const memberEntries = await Promise.all(
        cls.map(async (c) => [c.id, (await api.listMembers(c.id)).map(toMember)] as const),
      );
      setMembersByClass(Object.fromEntries(memberEntries));

      // group tasks across all of the user's project groups, for the dashboard
      const myGroups = await api.listMyGroups();
      setGroupCount(myGroups.length);
      // look up each group's class name so tasks can show which unit they're for
      const classNameById = new Map(cls.map((c) => [c.id, c.name] as const));
      const perGroup = await Promise.all(
        myGroups.map(async (g) =>
          (await api.listGroupTasks(g.id)).map(
            (t): GroupTaskItem => ({
              id: t.id,
              groupId: g.id,
              groupName: g.name,
              classId: g.classId,
              className: classNameById.get(g.classId) ?? "",
              title: t.title,
              description: t.description,
              dueLabel: dueLabel(t.dueAt),
              assignedToName: t.assignedToName,
              completed: t.status === "completed",
            }),
          ),
        ),
      );
      setGroupTasks(perGroup.flat());
    } catch (e) {
      console.warn("[classes-store] load failed", e);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void refresh();
  }, [refresh, user?.id]);

  // pick up anything posted while the app was in the background
  useEffect(() => {
    if (!isAuthenticated) return;
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") void refresh(true);
    });
    return () => sub.remove();
  }, [isAuthenticated, refresh]);

  const value = useMemo<ClassesStore>(() => {
    const enrolledClassIds = classes.map((c) => c.id);

    return {
      loading,
      classes,
      tasks,
      announcements,
      groupTasks,
      groupCount,
      enrolledClassIds,

      getClass: (classId) => classes.find((c) => c.id === classId),
      getTask: (taskId) => tasks.find((t) => t.id === taskId),
      membersForClass: (classId) => membersByClass[classId] ?? [],
      tasksForClass: (classId) => tasks.filter((t) => t.classId === classId),
      announcementsForClass: (classId) => announcements.filter((a) => a.classId === classId),
      materialsForClass: (classId) => materialsByClass[classId] ?? [],
      className: (classId) => classes.find((c) => c.id === classId)?.name ?? "",
      // rep status comes from either the class's classRepId or the user's own
      // member-doc role, so partially-synced data still works
      canManageClass: (classId) =>
        role === "admin" ||
        classes.find((c) => c.id === classId)?.classRepId === user?.id ||
        membersByClass[classId]?.find((m) => m.id === user?.id)?.role === "classRep",

      isTaskComplete: (taskId) => completedTaskIds.includes(taskId),
      toggleTaskComplete: (taskId) => {
        const done = completedTaskIds.includes(taskId);
        // optimistic update, then persist
        setCompletedTaskIds((prev) =>
          done ? prev.filter((t) => t !== taskId) : [...prev, taskId],
        );
        void api.setTaskComplete(taskId, !done).catch((e) => {
          console.warn("[classes-store] setTaskComplete failed", e);
          // revert on failure
          setCompletedTaskIds((prev) =>
            done ? [...prev, taskId] : prev.filter((t) => t !== taskId),
          );
        });
      },

      toggleGroupTask: (groupId, taskId) => {
        const current = groupTasks.find((t) => t.id === taskId);
        if (!current) return;
        const nextStatus = current.completed ? "pending" : "completed";
        // optimistic update, then persist
        setGroupTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t)),
        );
        void api.setGroupTaskStatus(groupId, taskId, nextStatus).catch((e) => {
          console.warn("[classes-store] setGroupTaskStatus failed", e);
          setGroupTasks((prev) =>
            prev.map((t) => (t.id === taskId ? { ...t, completed: current.completed } : t)),
          );
        });
      },

      refresh,

      joinClass: async (code) => {
        try {
          const c = await api.joinClassByCode(code.trim());
          await refresh();
          return toClassroom(c);
        } catch (e) {
          if (e instanceof ApiError && e.code === "not-found") return null;
          throw e;
        }
      },

      addClass: async (name) => {
        const c = await api.createClass({ name });
        await refresh();
        return toClassroom(c);
      },

      assignCR: (classId, memberId) => {
        void api.assignClassRep(classId, memberId).then(() => refresh());
      },

      removeMember: async (classId, memberId) => {
        await api.removeMember(classId, memberId);
        setMembersByClass((prev) => ({
          ...prev,
          [classId]: (prev[classId] ?? []).filter((m) => m.id !== memberId),
        }));
        void refresh(true);
      },

      leaveClass: async (classId) => {
        await api.leaveClass(classId);
        // drop the class and everything in it from local state right away
        setClasses((prev) => prev.filter((c) => c.id !== classId));
        setTasks((prev) => prev.filter((t) => t.classId !== classId));
        setAnnouncements((prev) => prev.filter((a) => a.classId !== classId));
        void refresh(true);
      },

      // Create/update/delete apply an optimistic local change and reconcile in
      // the background, so posting feels instant instead of waiting on a full
      // reload. (The notification Cloud Functions run server-side and never
      // block these writes.)
      addTask: async (classId, input) => {
        const t = await api.createTask(classId, input);
        const task = toTask(t);
        setTasks((prev) =>
          [...prev, task].sort((a, b) => a.dueAt.localeCompare(b.dueAt)),
        );
        void refresh(true);
        return task;
      },

      updateTask: async (classId, taskId, patch) => {
        const t = await api.updateTask(classId, taskId, patch);
        const task = toTask(t);
        setTasks((prev) => prev.map((x) => (x.id === taskId ? task : x)));
        void refresh(true);
        return task;
      },

      deleteTask: async (classId, taskId) => {
        await api.deleteTask(classId, taskId);
        setTasks((prev) => prev.filter((x) => x.id !== taskId));
        void refresh(true);
      },

      addAnnouncement: async (classId, input) => {
        const a = await api.createAnnouncement(classId, input);
        const announcement = toAnnouncement(a);
        setAnnouncements((prev) => [announcement, ...prev]);
        void refresh(true);
        return announcement;
      },

      updateAnnouncement: async (classId, announcementId, patch) => {
        const announcement = toAnnouncement(
          await api.updateAnnouncement(classId, announcementId, patch),
        );
        setAnnouncements((prev) => prev.map((x) => (x.id === announcementId ? announcement : x)));
        void refresh(true);
        return announcement;
      },

      deleteAnnouncement: async (classId, announcementId) => {
        await api.deleteAnnouncement(classId, announcementId);
        setAnnouncements((prev) => prev.filter((x) => x.id !== announcementId));
        void refresh(true);
      },

      loadMaterials: async (classId) => {
        try {
          const list = await api.listMaterials(classId);
          // newest first (ISO sorts chronologically)
          const sorted = [...list]
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
            .map(toMaterial);
          setMaterialsByClass((prev) => ({ ...prev, [classId]: sorted }));
        } catch (e) {
          console.warn("[classes-store] listMaterials failed", e);
        }
      },

      uploadMaterial: async (classId, file) => {
        const material = toMaterial(await api.uploadMaterial(classId, file));
        setMaterialsByClass((prev) => ({
          ...prev,
          [classId]: [material, ...(prev[classId] ?? [])],
        }));
        return material;
      },

      deleteMaterial: async (classId, materialId) => {
        await api.deleteMaterial(classId, materialId);
        setMaterialsByClass((prev) => ({
          ...prev,
          [classId]: (prev[classId] ?? []).filter((m) => m.id !== materialId),
        }));
      },
    };
  }, [loading, classes, tasks, announcements, groupTasks, groupCount, membersByClass, materialsByClass, completedTaskIds, refresh, role, user?.id]);

  return <ClassesContext.Provider value={value}>{children}</ClassesContext.Provider>;
}

export function useClasses(): ClassesStore {
  const ctx = useContext(ClassesContext);
  if (!ctx) {
    throw new Error("useClasses must be used within a ClassesProvider");
  }
  return ctx;
}

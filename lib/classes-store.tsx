// Class/task/member/announcement state, backed by the real `@/lib/api`.
//
// Data is loaded from the backend when a user signs in and refreshed after
// mutations. UI-shaped types (with human labels like "Due tomorrow") are mapped
// from the API's ISO-timestamp shapes here, so screens stay presentation-only.
//
// NOTE: Materials are kept local-only for now — the Materials backend isn't
// implemented yet, so uploaded files live in memory and are not persisted.
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
  type Member as ApiMember,
  type Task as ApiTask,
} from "@/lib/api";
import { useSession } from "@/lib/session";
import type { Classroom } from "@/lib/classes";
import type { Announcement, Material, Member, Task, TaskType } from "@/lib/types";

/* ------------------------------------------------------------------ *
 * API -> UI mappers
 * ------------------------------------------------------------------ */

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(iso).toLocaleDateString();
}

function dueLabel(iso: string): string {
  const dayMs = 86_400_000;
  const diff = new Date(iso).getTime() - Date.now();
  if (diff < 0) {
    const over = Math.floor(-diff / dayMs);
    return over < 1 ? "Overdue" : `Overdue by ${over}d`;
  }
  const days = Math.floor(diff / dayMs);
  if (days < 1) return "Due today";
  if (days < 2) return "Due tomorrow";
  if (days < 7) return `Due in ${days} days`;
  return `Due ${new Date(iso).toLocaleDateString()}`;
}

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
  title: t.title,
  description: t.description,
  type: t.type,
  dueLabel: dueLabel(t.dueAt),
});

const toAnnouncement = (a: ApiAnnouncement): Announcement => ({
  id: a.id,
  classId: a.classId,
  title: a.title,
  content: a.content,
  timeLabel: relativeTime(a.createdAt),
});

const toMember = (m: ApiMember): Member => ({
  id: m.id,
  name: m.name,
  email: m.email,
});

/* ------------------------------------------------------------------ *
 * Store
 * ------------------------------------------------------------------ */

interface ClassesStore {
  loading: boolean;
  classes: Classroom[];
  tasks: Task[];
  announcements: Announcement[];
  enrolledClassIds: string[];

  getClass: (classId: string) => Classroom | undefined;
  getTask: (taskId: string) => Task | undefined;
  membersForClass: (classId: string) => Member[];
  tasksForClass: (classId: string) => Task[];
  announcementsForClass: (classId: string) => Announcement[];
  materialsForClass: (classId: string) => Material[];
  className: (classId: string) => string;

  isTaskComplete: (taskId: string) => boolean;
  toggleTaskComplete: (taskId: string) => void;

  refresh: (silent?: boolean) => Promise<void>;
  joinClass: (code: string) => Promise<Classroom | null>;
  addClass: (name: string) => Promise<Classroom>;
  assignCR: (classId: string, memberId: string) => void;
  removeMember: (classId: string, memberId: string) => void;
  addTask: (
    classId: string,
    input: { title: string; description: string; type: TaskType; dueAt: string },
  ) => Promise<Task>;
  addAnnouncement: (
    classId: string,
    input: { title: string; content: string },
  ) => Promise<Announcement>;
  addMaterial: (
    classId: string,
    input: { name: string; sizeLabel?: string; mimeType?: string; uri?: string },
  ) => Material;
}

const ClassesContext = createContext<ClassesStore | null>(null);

export function ClassesProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useSession();

  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [membersByClass, setMembersByClass] = useState<Record<string, Member[]>>({});
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);
  // Materials are local-only until the backend supports them.
  const [materials, setMaterials] = useState<Material[]>([]);

  const refresh = useCallback(async (silent = false) => {
    if (!isAuthenticated) {
      setClasses([]);
      setTasks([]);
      setAnnouncements([]);
      setMembersByClass({});
      setCompletedTaskIds([]);
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
      setTasks(myTasks.map(toTask));
      setAnnouncements(myAnns.map(toAnnouncement));
      setCompletedTaskIds(completed);

      const memberEntries = await Promise.all(
        cls.map(async (c) => [c.id, (await api.listMembers(c.id)).map(toMember)] as const),
      );
      setMembersByClass(Object.fromEntries(memberEntries));
    } catch (e) {
      console.warn("[classes-store] load failed", e);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void refresh();
  }, [refresh, user?.id]);

  const value = useMemo<ClassesStore>(() => {
    const enrolledClassIds = classes.map((c) => c.id);

    return {
      loading,
      classes,
      tasks,
      announcements,
      enrolledClassIds,

      getClass: (classId) => classes.find((c) => c.id === classId),
      getTask: (taskId) => tasks.find((t) => t.id === taskId),
      membersForClass: (classId) => membersByClass[classId] ?? [],
      tasksForClass: (classId) => tasks.filter((t) => t.classId === classId),
      announcementsForClass: (classId) => announcements.filter((a) => a.classId === classId),
      materialsForClass: (classId) => materials.filter((m) => m.classId === classId),
      className: (classId) => classes.find((c) => c.id === classId)?.name ?? "",

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

      removeMember: (classId, memberId) => {
        void api.removeMember(classId, memberId).then(() => refresh());
      },

      addTask: async (classId, input) => {
        const t = await api.createTask(classId, input);
        await refresh();
        return toTask(t);
      },

      addAnnouncement: async (classId, input) => {
        const a = await api.createAnnouncement(classId, input);
        await refresh();
        return toAnnouncement(a);
      },

      addMaterial: (classId, input) => {
        const material: Material = { id: `mat-${Date.now()}`, classId, addedLabel: "Just now", ...input };
        setMaterials((prev) => [material, ...prev]);
        return material;
      },
    };
  }, [loading, classes, tasks, announcements, membersByClass, materials, completedTaskIds, refresh]);

  return <ClassesContext.Provider value={value}>{children}</ClassesContext.Provider>;
}

export function useClasses(): ClassesStore {
  const ctx = useContext(ClassesContext);
  if (!ctx) {
    throw new Error("useClasses must be used within a ClassesProvider");
  }
  return ctx;
}

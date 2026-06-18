import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { createClassroom, type Classroom } from "@/lib/classes";
import type {
  Announcement,
  Material,
  Member,
  Task,
  TaskType,
} from "@/lib/types";
import {
  seedAnnouncements,
  seedClasses,
  seedMaterials,
  seedMembers,
  seedTasks,
} from "@/lib/dummy-data";

interface ClassesStore {
  classes: Classroom[];

  // Selectors
  getClass: (classId: string) => Classroom | undefined;
  membersForClass: (classId: string) => Member[];
  tasksForClass: (classId: string) => Task[];
  announcementsForClass: (classId: string) => Announcement[];
  materialsForClass: (classId: string) => Material[];
  className: (classId: string) => string;
  /** Flat lists for dashboards/aggregates. */
  tasks: Task[];
  announcements: Announcement[];

  // Student enrollment + task completion
  enrolledClassIds: string[];
  joinClass: (code: string) => Classroom | null;
  isTaskComplete: (taskId: string) => boolean;
  toggleTaskComplete: (taskId: string) => void;

  // Actions
  addClass: (name: string) => Classroom;
  assignCR: (classId: string, memberId: string) => void;
  removeMember: (classId: string, memberId: string) => void;
  addTask: (
    classId: string,
    input: { title: string; description: string; type: TaskType; dueLabel: string },
  ) => Task;
  addAnnouncement: (
    classId: string,
    input: { title: string; content: string },
  ) => Announcement;
  addMaterial: (
    classId: string,
    input: { name: string; sizeLabel?: string; mimeType?: string; uri?: string },
  ) => Material;
}

const ClassesContext = createContext<ClassesStore | null>(null);

export function ClassesProvider({ children }: { children: ReactNode }) {
  const [classes, setClasses] = useState<Classroom[]>(seedClasses);
  const [membersByClass, setMembersByClass] =
    useState<Record<string, Member[]>>(seedMembers);
  const [tasks, setTasks] = useState<Task[]>(seedTasks);
  const [announcements, setAnnouncements] =
    useState<Announcement[]>(seedAnnouncements);
  const [materials, setMaterials] = useState<Material[]>(seedMaterials);
  // Current student's enrollment + completed tasks (single student for now).
  const [enrolledClassIds, setEnrolledClassIds] = useState<string[]>([
    "bio101",
    "cs204",
  ]);
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>(["t1"]);

  const value = useMemo<ClassesStore>(
    () => ({
      classes,
      tasks,
      announcements,
      enrolledClassIds,

      getClass: (classId) => classes.find((c) => c.id === classId),
      membersForClass: (classId) => membersByClass[classId] ?? [],
      tasksForClass: (classId) => tasks.filter((t) => t.classId === classId),
      announcementsForClass: (classId) =>
        announcements.filter((a) => a.classId === classId),
      materialsForClass: (classId) =>
        materials.filter((m) => m.classId === classId),
      className: (classId) => classes.find((c) => c.id === classId)?.name ?? "",

      joinClass: (code) => {
        const match = classes.find((c) => c.code === code.trim());
        if (!match) return null;
        setEnrolledClassIds((prev) =>
          prev.includes(match.id) ? prev : [...prev, match.id],
        );
        return match;
      },

      isTaskComplete: (taskId) => completedTaskIds.includes(taskId),

      toggleTaskComplete: (taskId) => {
        setCompletedTaskIds((prev) =>
          prev.includes(taskId)
            ? prev.filter((t) => t !== taskId)
            : [...prev, taskId],
        );
      },

      addClass: (name) => {
        const classroom = createClassroom(name);
        setClasses((prev) => [classroom, ...prev]);
        return classroom;
      },

      assignCR: (classId, memberId) => {
        setClasses((prev) =>
          prev.map((c) =>
            c.id === classId ? { ...c, classRepId: memberId } : c,
          ),
        );
      },

      removeMember: (classId, memberId) => {
        setMembersByClass((prev) => ({
          ...prev,
          [classId]: (prev[classId] ?? []).filter((m) => m.id !== memberId),
        }));
        setClasses((prev) =>
          prev.map((c) =>
            c.id === classId && c.classRepId === memberId
              ? { ...c, classRepId: undefined }
              : c,
          ),
        );
      },

      addTask: (classId, input) => {
        const task: Task = { id: `t-${Date.now()}`, classId, ...input };
        setTasks((prev) => [task, ...prev]);
        return task;
      },

      addAnnouncement: (classId, input) => {
        const announcement: Announcement = {
          id: `n-${Date.now()}`,
          classId,
          timeLabel: "Just now",
          ...input,
        };
        setAnnouncements((prev) => [announcement, ...prev]);
        return announcement;
      },

      addMaterial: (classId, input) => {
        const material: Material = {
          id: `mat-${Date.now()}`,
          classId,
          addedLabel: "Just now",
          ...input,
        };
        setMaterials((prev) => [material, ...prev]);
        return material;
      },
    }),
    [
      classes,
      membersByClass,
      tasks,
      announcements,
      materials,
      enrolledClassIds,
      completedTaskIds,
    ],
  );

  return <ClassesContext.Provider value={value}>{children}</ClassesContext.Provider>;
}

export function useClasses(): ClassesStore {
  const ctx = useContext(ClassesContext);
  if (!ctx) {
    throw new Error("useClasses must be used within a ClassesProvider");
  }
  return ctx;
}

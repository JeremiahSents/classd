import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { createClassroom, type Classroom } from "@/lib/classes";
import type { Announcement, Member, Task, TaskType, Unit } from "@/lib/types";
import {
  seedAnnouncements,
  seedClasses,
  seedMembers,
  seedTasks,
  seedUnits,
} from "@/lib/dummy-data";

interface ClassesStore {
  classes: Classroom[];

  // Selectors
  getClass: (classId: string) => Classroom | undefined;
  getUnit: (unitId: string) => Unit | undefined;
  unitsForClass: (classId: string) => Unit[];
  membersForClass: (classId: string) => Member[];
  tasksForUnit: (unitId: string) => Task[];
  announcementsForUnit: (unitId: string) => Announcement[];
  unitName: (unitId: string) => string;
  /** Flat recent lists for the dashboard. */
  tasks: Task[];
  announcements: Announcement[];

  // Actions
  addClass: (name: string) => Classroom;
  addUnit: (classId: string, name: string, code: string) => Unit;
  assignCR: (classId: string, memberId: string) => void;
  removeMember: (classId: string, memberId: string) => void;
  addTask: (
    unitId: string,
    input: { title: string; description: string; type: TaskType; dueLabel: string },
  ) => Task;
  addAnnouncement: (
    unitId: string,
    input: { title: string; content: string },
  ) => Announcement;
}

const ClassesContext = createContext<ClassesStore | null>(null);

export function ClassesProvider({ children }: { children: ReactNode }) {
  const [classes, setClasses] = useState<Classroom[]>(seedClasses);
  const [units, setUnits] = useState<Unit[]>(seedUnits);
  const [membersByClass, setMembersByClass] =
    useState<Record<string, Member[]>>(seedMembers);
  const [tasks, setTasks] = useState<Task[]>(seedTasks);
  const [announcements, setAnnouncements] =
    useState<Announcement[]>(seedAnnouncements);

  const value = useMemo<ClassesStore>(
    () => ({
      classes,
      tasks,
      announcements,

      getClass: (classId) => classes.find((c) => c.id === classId),
      getUnit: (unitId) => units.find((u) => u.id === unitId),
      unitsForClass: (classId) => units.filter((u) => u.classId === classId),
      membersForClass: (classId) => membersByClass[classId] ?? [],
      tasksForUnit: (unitId) => tasks.filter((t) => t.unitId === unitId),
      announcementsForUnit: (unitId) =>
        announcements.filter((a) => a.unitId === unitId),
      unitName: (unitId) => units.find((u) => u.id === unitId)?.name ?? "",

      addClass: (name) => {
        const classroom = createClassroom(name);
        setClasses((prev) => [classroom, ...prev]);
        return classroom;
      },

      addUnit: (classId, name, code) => {
        const unit: Unit = {
          id: `u-${Date.now()}`,
          classId,
          name: name.trim(),
          code: code.trim(),
        };
        setUnits((prev) => [...prev, unit]);
        return unit;
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

      addTask: (unitId, input) => {
        const task: Task = { id: `t-${Date.now()}`, unitId, ...input };
        setTasks((prev) => [task, ...prev]);
        return task;
      },

      addAnnouncement: (unitId, input) => {
        const announcement: Announcement = {
          id: `n-${Date.now()}`,
          unitId,
          timeLabel: "Just now",
          ...input,
        };
        setAnnouncements((prev) => [announcement, ...prev]);
        return announcement;
      },
    }),
    [classes, units, membersByClass, tasks, announcements],
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

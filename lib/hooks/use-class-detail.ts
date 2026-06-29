/**
 * useClassDetail — fetches all data for a single class:
 *   class doc, members, tasks, announcements, materials.
 *
 * Loads everything concurrently on mount and whenever `reload()` is called.
 */
import { useCallback, useEffect, useState } from "react";
import {
  api,
  type Class,
  type Member,
  type Task,
  type Announcement,
  type Material,
} from "@/lib/api";

interface ClassDetailState {
  classroom: Class | null;
  members: Member[];
  tasks: Task[];
  announcements: Announcement[];
  materials: Material[];
  completedTaskIds: string[];
  loading: boolean;
  error: string | null;
  reload: () => void;
  reloadTasks: () => void;
  reloadAnnouncements: () => void;
  reloadMaterials: () => void;
  reloadCompletions: () => void;
}

export function useClassDetail(classId: string): ClassDetailState {
  const [classroom, setClassroom] = useState<Class | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [tasksTick, setTasksTick] = useState(0);
  const [announcementsTick, setAnnouncementsTick] = useState(0);
  const [materialsTick, setMaterialsTick] = useState(0);
  const [completionsTick, setCompletionsTick] = useState(0);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  const reloadTasks = useCallback(() => setTasksTick((t) => t + 1), []);
  const reloadAnnouncements = useCallback(
    () => setAnnouncementsTick((t) => t + 1),
    [],
  );
  const reloadMaterials = useCallback(
    () => setMaterialsTick((t) => t + 1),
    [],
  );
  const reloadCompletions = useCallback(
    () => setCompletionsTick((t) => t + 1),
    [],
  );

  // Full reload: class + members + all sub-collections.
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);

    if (!classId) {
      setClassroom(null);
      setMembers([]);
      setTasks([]);
      setAnnouncements([]);
      setMaterials([]);
      setCompletedTaskIds([]);
      setError("Class not found.");
      setLoading(false);
      return () => {
        alive = false;
      };
    }

    Promise.all([
      api.getClass(classId),
      api.listMembers(classId),
      api.listTasks(classId),
      api.listAnnouncements(classId),
      api.listMaterials(classId),
      api.listCompletedTaskIds(),
    ])
      .then(([cls, mems, tsks, anns, mats, cids]) => {
        if (!alive) return;
        setClassroom(cls);
        setMembers(mems);
        setTasks(tsks);
        setAnnouncements(anns);
        setMaterials(mats);
        setCompletedTaskIds(cids);
      })
      .catch((e: Error) => {
        if (alive) setError(e.message);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [classId, tick]);

  // Individual sub-collection reloads (after mutations).
  useEffect(() => {
    if (tasksTick === 0) return;
    let alive = true;
    api
      .listTasks(classId)
      .then((t) => alive && setTasks(t))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [classId, tasksTick]);

  useEffect(() => {
    if (announcementsTick === 0) return;
    let alive = true;
    api
      .listAnnouncements(classId)
      .then((a) => alive && setAnnouncements(a))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [classId, announcementsTick]);

  useEffect(() => {
    if (materialsTick === 0) return;
    let alive = true;
    api
      .listMaterials(classId)
      .then((m) => alive && setMaterials(m))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [classId, materialsTick]);

  useEffect(() => {
    if (completionsTick === 0) return;
    let alive = true;
    api
      .listCompletedTaskIds()
      .then((ids) => alive && setCompletedTaskIds(ids))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [completionsTick]);

  return {
    classroom,
    members,
    tasks,
    announcements,
    materials,
    completedTaskIds,
    loading,
    error,
    reload,
    reloadTasks,
    reloadAnnouncements,
    reloadMaterials,
    reloadCompletions,
  };
}

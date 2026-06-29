/**
 * useHomeData — fetches everything needed for the home dashboard:
 *   - the user's classes
 *   - all tasks across those classes
 *   - all announcements across those classes
 *   - the user's completed task IDs
 *
 * Uses the api.listMyTasks / listMyAnnouncements aggregates so the client
 * doesn't need to fan out across class IDs manually.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { api, type Class, type Task, type Announcement } from "@/lib/api";

interface HomeDataState {
  classes: Class[];
  tasks: Task[];
  announcements: Announcement[];
  completedTaskIds: string[];
  loading: boolean;
  error: string | null;
  reload: () => void;
  reloadCompletions: () => void;
}

export function useHomeData(): HomeDataState {
  const hasLoadedRef = useRef(false);
  const [classes, setClasses] = useState<Class[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [completionsTick, setCompletionsTick] = useState(0);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  const reloadCompletions = useCallback(
    () => setCompletionsTick((t) => t + 1),
    [],
  );

  useEffect(() => {
    let alive = true;
    setLoading(!hasLoadedRef.current);
    setError(null);

    Promise.all([
      api.listClasses(),
      api.listMyTasks(),
      api.listMyAnnouncements(),
      api.listCompletedTaskIds(),
    ])
      .then(([cls, tsks, anns, cids]) => {
        if (!alive) return;
        setClasses(cls);
        setTasks(tsks);
        setAnnouncements(anns);
        setCompletedTaskIds(cids);
      })
      .catch((e: Error) => {
        if (alive) setError(e.message);
      })
      .finally(() => {
        if (!alive) return;
        hasLoadedRef.current = true;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [tick]);

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
    classes,
    tasks,
    announcements,
    completedTaskIds,
    loading,
    error,
    reload,
    reloadCompletions,
  };
}

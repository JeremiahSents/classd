/**
 * useApiClasses — fetches the current user's classes from the Firebase API.
 * Class reps get classes they own; students get classes they're enrolled in.
 */
import { useCallback, useEffect, useState } from "react";
import { api, type Class } from "@/lib/api";

interface ApiClassesState {
  classes: Class[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function useApiClasses(): ApiClassesState {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    api
      .listClasses()
      .then((data) => {
        if (alive) setClasses(data);
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
  }, [tick]);

  return { classes, loading, error, reload };
}

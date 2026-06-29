/**
 * useApiClasses — fetches the current user's classes from the Firebase API.
 * Includes classes the user created as rep and classes they joined as a member.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { api, type Class } from "@/lib/api";

interface ApiClassesState {
  classes: Class[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function useApiClasses(): ApiClassesState {
  const hasLoadedRef = useRef(false);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let alive = true;
    setLoading(!hasLoadedRef.current);
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
        if (!alive) return;
        hasLoadedRef.current = true;
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [tick]);

  return { classes, loading, error, reload };
}

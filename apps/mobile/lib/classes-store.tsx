import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { createClassroom, type Classroom } from "@/lib/classes";
import { seedClasses } from "@/lib/dummy-data";

interface ClassesStore {
  classes: Classroom[];
  addClass: (name: string) => Classroom;
}

const ClassesContext = createContext<ClassesStore | null>(null);

export function ClassesProvider({ children }: { children: ReactNode }) {
  const [classes, setClasses] = useState<Classroom[]>(seedClasses);

  const value = useMemo<ClassesStore>(
    () => ({
      classes,
      addClass: (name: string) => {
        const classroom = createClassroom(name);
        setClasses((prev) => [classroom, ...prev]);
        return classroom;
      },
    }),
    [classes],
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

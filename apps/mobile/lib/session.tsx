import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type Role = "lecturer" | "student";

interface Profile {
  name: string;
  email: string;
}

/** Hardcoded identities per role until real auth lands. */
const PROFILES: Record<Role, Profile> = {
  lecturer: { name: "Jeremiah Sentomero", email: "sentomerojeremy@gmail.com" },
  student: { name: "Brian Otieno", email: "brian.otieno@strathmore.edu" },
};

interface Session {
  role: Role;
  name: string;
  email: string;
  firstName: string;
  signIn: (role: Role) => void;
  signOut: () => void;
  /** Quick role swap (dev convenience to preview the other view). */
  switchRole: () => void;
}

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>("lecturer");

  const value = useMemo<Session>(() => {
    const profile = PROFILES[role];
    return {
      role,
      name: profile.name,
      email: profile.email,
      firstName: profile.name.split(" ")[0],
      signIn: setRole,
      signOut: () => setRole("lecturer"),
      switchRole: () =>
        setRole((prev) => (prev === "lecturer" ? "student" : "lecturer")),
    };
  }, [role]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): Session {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return ctx;
}

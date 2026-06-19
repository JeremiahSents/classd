// MIGRATION NOTE (backend): this is fake auth — it just swaps between two
// hardcoded profiles. To go live, drive this from `@/lib/api` auth methods:
// `api.onAuthStateChanged` to populate the session, `api.signInWithEmail` /
// `signInWithGoogle` / `signUpWithEmail` from the auth screens, `api.signOut`
// from profile, and `api.updateProfile` for avatar changes. `switchRole` is a
// dev-only convenience and should be dropped once real roles come from auth.
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { NOTION_FACES } from "./avatars";

export type Role = "lecturer" | "student";

interface Profile {
  name: string;
  email: string;
  avatarUrl: string;
}

/** Hardcoded identities per role until real auth lands. */
const PROFILES: Record<Role, Profile> = {
  lecturer: { 
    name: "Jeremiah Sentomero", 
    email: "sentomerojeremy@gmail.com",
    avatarUrl: NOTION_FACES[0],
  },
  student: { 
    name: "Brian Otieno", 
    email: "brian.otieno@strathmore.edu",
    avatarUrl: NOTION_FACES[1],
  },
};

interface Session {
  role: Role;
  name: string;
  email: string;
  firstName: string;
  avatarUrl: string;
  updateAvatar: (url: string) => void;
  signIn: (role: Role) => void;
  signOut: () => void;
  /** Quick role swap (dev convenience to preview the other view). */
  switchRole: () => void;
}

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>("lecturer");
  // Store custom avatars per role so they don't reset when switching roles
  const [customAvatars, setCustomAvatars] = useState<Record<Role, string>>({
    lecturer: PROFILES.lecturer.avatarUrl,
    student: PROFILES.student.avatarUrl,
  });

  const value = useMemo<Session>(() => {
    const profile = PROFILES[role];
    const avatarUrl = customAvatars[role];
    
    return {
      role,
      name: profile.name,
      email: profile.email,
      firstName: profile.name.split(" ")[0],
      avatarUrl,
      updateAvatar: (url: string) => {
        setCustomAvatars((prev) => ({ ...prev, [role]: url }));
      },
      signIn: setRole,
      signOut: () => setRole("lecturer"),
      switchRole: () =>
        setRole((prev) => (prev === "lecturer" ? "student" : "lecturer")),
    };
  }, [role, customAvatars]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): Session {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return ctx;
}

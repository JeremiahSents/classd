// Real auth session, driven by `@/lib/api`.
//
// `api.onAuthStateChanged` is the source of truth: it fires on launch (restoring
// a persisted session) and on every sign-in / sign-out. The auth screens call
// the sign-in/up methods, profile calls signOut/updateAvatar, and the rest of
// the UI just reads role/name/avatarUrl off the current user.
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  api,
  type Role,
  type SignInInput,
  type SignUpInput,
  type UserProfile,
} from "@/lib/api";
import {
  registerForPushNotifications,
  unregisterForPushNotifications,
} from "@/lib/push";

export type { Role };

interface Session {
  /** True until the first auth-state callback resolves on launch. */
  loading: boolean;
  isAuthenticated: boolean;
  user: UserProfile | null;

  // Convenience accessors (safe defaults while signed out).
  role: Role;
  name: string;
  email: string;
  firstName: string;
  avatarUrl: string;

  // Actions — all async, all throw ApiError on failure for the UI to display.
  // Sign-in/up return the signed-in profile so callers can route by role.
  signUpWithEmail: (input: SignUpInput) => Promise<UserProfile>;
  signInWithEmail: (input: SignInInput) => Promise<UserProfile>;
  signOut: () => Promise<void>;
  updateAvatar: (url: string) => Promise<void>;
  /** Change the user's display name. */
  updateName: (name: string) => Promise<void>;
}

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = api.onAuthStateChanged((u) => {
      setUser(u);
      setLoading(false);
      // Register this device for push once signed in. No-ops (logs a warning)
      // until expo-notifications/expo-device are installed and on a real device.
      if (u) void registerForPushNotifications().catch(() => {});
    });
    return unsubscribe;
  }, []);

  const value = useMemo<Session>(
    () => ({
      loading,
      isAuthenticated: !!user,
      user,
      role: user?.role ?? "student",
      name: user?.name ?? "",
      email: user?.email ?? "",
      firstName: user?.name?.split(" ")[0] ?? "",
      avatarUrl: user?.avatarUrl ?? "",

      signUpWithEmail: async (input) => {
        const result = await api.signUpWithEmail(input);
        return result.user;
      },
      signInWithEmail: async (input) => {
        const result = await api.signInWithEmail(input);
        return result.user;
      },
      signOut: async () => {
        // best-effort: drop this device's token so it stops getting pushes
        await unregisterForPushNotifications().catch(() => {});
        await api.signOut();
      },
      updateAvatar: async (url) => {
        // profile-doc change won't refire onAuthStateChanged, so update locally.
        const updated = await api.updateProfile({ avatarUrl: url });
        setUser(updated);
      },
      updateName: async (name) => {
        const updated = await api.updateProfile({ name: name.trim() });
        setUser(updated);
      },
    }),
    [user, loading],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): Session {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return ctx;
}

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
  signUpWithEmail: (input: SignUpInput) => Promise<void>;
  signInWithEmail: (input: SignInInput) => Promise<void>;
  signInWithGoogle: (idToken: string, role?: Role) => Promise<void>;
  signInWithApple: (identityToken: string, role?: Role) => Promise<void>;
  signOut: () => Promise<void>;
  updateAvatar: (url: string) => Promise<void>;
}

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = api.onAuthStateChanged((u) => {
      setUser(u);
      setLoading(false);
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
        await api.signUpWithEmail(input);
      },
      signInWithEmail: async (input) => {
        await api.signInWithEmail(input);
      },
      signInWithGoogle: async (idToken, role) => {
        await api.signInWithGoogle(idToken, role);
      },
      signInWithApple: async (identityToken, role) => {
        await api.signInWithApple(identityToken, role);
      },
      signOut: async () => {
        await api.signOut();
      },
      updateAvatar: async (url) => {
        // profile-doc change won't refire onAuthStateChanged, so update locally.
        const updated = await api.updateProfile({ avatarUrl: url });
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

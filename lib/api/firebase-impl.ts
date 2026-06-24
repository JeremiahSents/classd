/**
 * Firebase implementation of ClassdApi — THE FILE THE BACKEND DEV BUILDS.
 *
 * Every method below currently throws `notImplemented()`. Replace each body
 * with real Firebase Auth / Firestore / Storage calls. The `db`, `auth`, and
 * `storage` singletons are exported from `@/lib/firebase`.
 *
 * Firestore data model (see BACKEND_INTEGRATION.md for full detail):
 *   users/{uid}
 *   classes/{classId}
 *   classes/{classId}/members/{uid}
 *   classes/{classId}/tasks/{taskId}
 *   classes/{classId}/announcements/{announcementId}
 *   classes/{classId}/materials/{materialId}
 *   users/{uid}/completions/{taskId}    (per-user task completion)
 *
 * Tips:
 *  - Map Firestore Timestamps to ISO strings (`.toDate().toISOString()`) before
 *    returning — the contract requires ISO strings, not Timestamp objects.
 *  - Throw `ApiError` (not raw Firebase errors) so the UI can react. A small
 *    `wrap()` helper that maps Firebase error codes is a good idea.
 */

import { FirebaseError } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithCredential,
  GoogleAuthProvider,
  OAuthProvider,
  signOut as fbSignOut,
  onAuthStateChanged as fbOnAuthStateChanged,
  updateProfile as fbUpdateProfile,
  type AuthCredential,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  type DocumentData,
} from "firebase/firestore";
import {
  ApiError,
  type ClassdApi,
  type AuthResult,
  type Class,
  type CreateClassInput,
  type CreateTaskInput,
  type CreateAnnouncementInput,
  type Member,
  type Task,
  type Announcement,
  type Material,
  type Role,
  type SignInInput,
  type SignUpInput,
  type UploadFileInput,
  type UserProfile,
} from "./contract";
import { auth, db } from "@/lib/firebase";
import { getFaceFor } from "@/lib/avatars";

function notImplemented(method: string): never {
  throw new ApiError("unknown", `firebase-impl: ${method} not implemented yet`);
}

/* ------------------------------------------------------------------ *
 * Auth helpers
 * ------------------------------------------------------------------ */

/** Firestore Timestamp | string | Date -> ISO string (the contract shape). */
function tsToIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  // serverTimestamp() not yet resolved, or missing — best-effort fallback.
  return new Date().toISOString();
}

/** Shape a raw users/{uid} document into a UserProfile. */
function toUserProfile(uid: string, data: DocumentData): UserProfile {
  return {
    id: uid,
    name: (data.name as string) ?? "",
    email: (data.email as string) ?? "",
    role: (data.role as Role) ?? "student",
    avatarUrl: (data.avatarUrl as string) ?? "",
    createdAt: tsToIso(data.createdAt),
  };
}

/** Read a user's profile doc; null if it does not exist. */
async function loadProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? toUserProfile(uid, snap.data()) : null;
}

/**
 * Sign in with a federated credential (Google/Apple) and, on first sign-in,
 * create the users/{uid} profile document. `role` is only used for new users.
 */
async function signInWithOAuth(
  credential: AuthCredential,
  role: Role | undefined,
): Promise<AuthResult> {
  const cred = await signInWithCredential(auth, credential);
  const uid = cred.user.uid;

  const existing = await loadProfile(uid);
  if (existing) return { user: existing, isNewUser: false };

  // First sign-in for this account — create the profile.
  const name =
    cred.user.displayName?.trim() || cred.user.email?.split("@")[0] || "Student";
  const email = cred.user.email ?? "";
  const avatarUrl = cred.user.photoURL ?? getFaceFor(uid);
  const newRole: Role = role ?? "student";

  await setDoc(doc(db, "users", uid), {
    name,
    email,
    role: newRole,
    avatarUrl,
    createdAt: serverTimestamp(),
  });

  const user: UserProfile = {
    id: uid,
    name,
    email,
    role: newRole,
    avatarUrl,
    createdAt: new Date().toISOString(),
  };
  return { user, isNewUser: true };
}

/** Map a raw Firebase error to an ApiError the UI knows how to show. */
function toApiError(e: unknown): ApiError {
  if (e instanceof ApiError) return e;
  if (e instanceof FirebaseError) {
    switch (e.code) {
      case "auth/email-already-in-use":
        return new ApiError("already-exists", "An account with this email already exists.");
      case "auth/invalid-email":
        return new ApiError("invalid-argument", "That email address is not valid.");
      case "auth/weak-password":
        return new ApiError("invalid-argument", "Password should be at least 6 characters.");
      case "auth/missing-password":
        return new ApiError("invalid-argument", "Please enter your password.");
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return new ApiError("unauthenticated", "Incorrect email or password.");
      case "auth/too-many-requests":
        return new ApiError("unknown", "Too many attempts. Please try again later.");
      case "auth/network-request-failed":
        return new ApiError("unknown", "Network error. Check your connection and try again.");
      case "auth/operation-not-allowed":
        return new ApiError("permission-denied", "This sign-in method is not enabled.");
      default:
        return new ApiError("unknown", "Something went wrong. Please try again.");
    }
  }
  return new ApiError("unknown", "Something went wrong. Please try again.");
}

export const firebaseApi: ClassdApi = {
  // ---- Auth ----
  async signUpWithEmail(input: SignUpInput): Promise<AuthResult> {
    try {
      const cred = await createUserWithEmailAndPassword(auth, input.email, input.password);
      const uid = cred.user.uid;
      const name = input.name?.trim() || input.email.split("@")[0];
      const avatarUrl = getFaceFor(uid);

      // mirror the name onto the Auth profile too (handy elsewhere)
      await fbUpdateProfile(cred.user, { displayName: name });

      // create the Firestore profile document
      await setDoc(doc(db, "users", uid), {
        name,
        email: input.email,
        role: input.role,
        avatarUrl,
        createdAt: serverTimestamp(),
      });

      const user: UserProfile = {
        id: uid,
        name,
        email: input.email,
        role: input.role,
        avatarUrl,
        createdAt: new Date().toISOString(),
      };
      return { user, isNewUser: true };
    } catch (e) {
      throw toApiError(e);
    }
  },

  async signInWithEmail(input: SignInInput): Promise<AuthResult> {
    try {
      const cred = await signInWithEmailAndPassword(auth, input.email, input.password);
      const user = await loadProfile(cred.user.uid);
      if (!user) {
        throw new ApiError("not-found", "Your profile could not be found. Please sign up again.");
      }
      return { user, isNewUser: false };
    } catch (e) {
      throw toApiError(e);
    }
  },

  async signInWithGoogle(idToken: string, role?: Role): Promise<AuthResult> {
    try {
      const credential = GoogleAuthProvider.credential(idToken);
      return await signInWithOAuth(credential, role);
    } catch (e) {
      throw toApiError(e);
    }
  },

  async signInWithApple(identityToken: string, role?: Role): Promise<AuthResult> {
    try {
      const credential = new OAuthProvider("apple.com").credential({ idToken: identityToken });
      return await signInWithOAuth(credential, role);
    } catch (e) {
      throw toApiError(e);
    }
  },

  async signOut(): Promise<void> {
    try {
      await fbSignOut(auth);
    } catch (e) {
      throw toApiError(e);
    }
  },

  async getCurrentUser(): Promise<UserProfile | null> {
    const current = auth.currentUser;
    if (!current) return null;
    try {
      return await loadProfile(current.uid);
    } catch (e) {
      throw toApiError(e);
    }
  },

  onAuthStateChanged(cb: (user: UserProfile | null) => void): () => void {
    // returns Firebase's own unsubscribe function
    return fbOnAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        cb(null);
        return;
      }
      try {
        cb(await loadProfile(fbUser.uid));
      } catch {
        // a profile read failure shouldn't crash the auth listener
        cb(null);
      }
    });
  },

  async updateProfile(
    patch: Partial<Pick<UserProfile, "name" | "avatarUrl">>,
  ): Promise<UserProfile> {
    const current = auth.currentUser;
    if (!current) throw new ApiError("unauthenticated", "Not signed in");
    try {
      const fields: Record<string, unknown> = {};
      if (patch.name !== undefined) fields.name = patch.name;
      if (patch.avatarUrl !== undefined) fields.avatarUrl = patch.avatarUrl;

      await updateDoc(doc(db, "users", current.uid), fields);
      if (patch.name !== undefined) {
        await fbUpdateProfile(current, { displayName: patch.name });
      }

      const user = await loadProfile(current.uid);
      if (!user) throw new ApiError("not-found", "Profile not found");
      return user;
    } catch (e) {
      throw toApiError(e);
    }
  },

  // ---- Classes ----
  // Lecturer: query classes where ownerId == uid.
  // Student: query collectionGroup("members") where uid, then load classes.
  async listClasses(): Promise<Class[]> {
    return notImplemented("listClasses");
  },
  async getClass(_classId: string): Promise<Class> {
    return notImplemented("getClass");
  },
  // Generate unique 6-digit code; setDoc classes/{id} with ownerId, createdAt.
  async createClass(_input: CreateClassInput): Promise<Class> {
    return notImplemented("createClass");
  },
  // Find class by code; add caller to classes/{id}/members/{uid}.
  async joinClassByCode(_code: string): Promise<Class> {
    return notImplemented("joinClassByCode");
  },
  async leaveClass(_classId: string): Promise<void> {
    return notImplemented("leaveClass");
  },
  // updateDoc(classes/{id}, { classRepId }).
  async assignClassRep(_classId: string, _memberId: string): Promise<void> {
    return notImplemented("assignClassRep");
  },

  // ---- Members ----
  async listMembers(_classId: string): Promise<Member[]> {
    return notImplemented("listMembers");
  },
  async removeMember(_classId: string, _memberId: string): Promise<void> {
    return notImplemented("removeMember");
  },

  // ---- Tasks ----
  async listTasks(_classId: string): Promise<Task[]> {
    return notImplemented("listTasks");
  },
  async listMyTasks(): Promise<Task[]> {
    return notImplemented("listMyTasks");
  },
  async createTask(_classId: string, _input: CreateTaskInput): Promise<Task> {
    return notImplemented("createTask");
  },
  // Read users/{uid}/completions where exists.
  async listCompletedTaskIds(): Promise<string[]> {
    return notImplemented("listCompletedTaskIds");
  },
  // setDoc/deleteDoc users/{uid}/completions/{taskId}.
  async setTaskComplete(_taskId: string, _complete: boolean): Promise<void> {
    return notImplemented("setTaskComplete");
  },

  // ---- Announcements ----
  async listAnnouncements(_classId: string): Promise<Announcement[]> {
    return notImplemented("listAnnouncements");
  },
  async listMyAnnouncements(): Promise<Announcement[]> {
    return notImplemented("listMyAnnouncements");
  },
  async createAnnouncement(
    _classId: string,
    _input: CreateAnnouncementInput,
  ): Promise<Announcement> {
    return notImplemented("createAnnouncement");
  },

  // ---- Materials ----
  async listMaterials(_classId: string): Promise<Material[]> {
    return notImplemented("listMaterials");
  },
  // uploadBytes to storage at materials/{classId}/{id}-{name}; getDownloadURL;
  // then write the metadata doc.
  async uploadMaterial(_classId: string, _file: UploadFileInput): Promise<Material> {
    return notImplemented("uploadMaterial");
  },
  // delete the doc + the storage object at material.storagePath.
  async deleteMaterial(_classId: string, _materialId: string): Promise<void> {
    return notImplemented("deleteMaterial");
  },
};

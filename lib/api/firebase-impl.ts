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
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  query,
  where,
  limit,
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

/* ------------------------------------------------------------------ *
 * Class / Member helpers
 * ------------------------------------------------------------------ */

const coverFor = (seed: string) => `https://picsum.photos/seed/${seed}/600/400`;

/** Current user's uid, or throw. */
function requireUid(): string {
  const u = auth.currentUser;
  if (!u) throw new ApiError("unauthenticated", "Not signed in");
  return u.uid;
}

/** Shape a classes/{id} document into a Class. */
function toClass(id: string, data: DocumentData): Class {
  return {
    id,
    name: data.name ?? "",
    code: data.code ?? "",
    coverUrl: data.coverUrl ?? coverFor(id),
    ownerId: data.ownerId ?? "",
    classRepId: data.classRepId ?? undefined,
    schedules: data.schedules ?? [],
    createdAt: tsToIso(data.createdAt),
  };
}

/** Shape a classes/{id}/members/{uid} document into a Member. */
function toMember(uid: string, data: DocumentData): Member {
  return {
    id: uid,
    name: data.name ?? "",
    email: data.email ?? "",
    avatarUrl: data.avatarUrl ?? undefined,
    role: (data.role as Role) ?? "student",
    joinedAt: tsToIso(data.joinedAt),
  };
}

/** A 6-digit class join code, unique across the classes collection. */
async function uniqueClassCode(): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const candidate = Math.floor(100000 + Math.random() * 900000).toString();
    const existing = await getDocs(
      query(collection(db, "classes"), where("code", "==", candidate), limit(1)),
    );
    if (existing.empty) return candidate;
  }
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/** Ids of the classes the current user can see (owned for class rep, joined for student). */
async function visibleClassIds(): Promise<string[]> {
  const uid = requireUid();
  const profile = await loadProfile(uid);
  if (profile?.role === "classRep") {
    const snap = await getDocs(query(collection(db, "classes"), where("ownerId", "==", uid)));
    return snap.docs.map((d) => d.id);
  }
  const memberSnap = await getDocs(
    query(collectionGroup(db, "members"), where("uid", "==", uid)),
  );
  return memberSnap.docs
    .map((d) => d.ref.parent.parent?.id)
    .filter((id): id is string => !!id);
}

/** Shape a classes/{id}/tasks/{taskId} document into a Task. */
function toTask(id: string, classId: string, data: DocumentData): Task {
  return {
    id,
    classId,
    title: data.title ?? "",
    description: data.description ?? "",
    type: data.type ?? "assignment",
    dueAt: tsToIso(data.dueAt),
    createdBy: data.createdBy ?? "",
    createdAt: tsToIso(data.createdAt),
  };
}

/** Shape a classes/{id}/announcements/{id} document into an Announcement. */
function toAnnouncement(id: string, classId: string, data: DocumentData): Announcement {
  return {
    id,
    classId,
    title: data.title ?? "",
    content: data.content ?? "",
    createdBy: data.createdBy ?? "",
    createdAt: tsToIso(data.createdAt),
  };
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
  async listClasses(): Promise<Class[]> {
    const uid = requireUid();
    try {
      const profile = await loadProfile(uid);
      if (profile?.role === "classRep") {
        // classes this user owns
        const snap = await getDocs(
          query(collection(db, "classes"), where("ownerId", "==", uid)),
        );
        return snap.docs.map((d) => toClass(d.id, d.data()));
      }
      // student: classes where a members/{uid} doc exists
      const memberSnap = await getDocs(
        query(collectionGroup(db, "members"), where("uid", "==", uid)),
      );
      const classRefs = memberSnap.docs
        .map((d) => d.ref.parent.parent)
        .filter((ref): ref is NonNullable<typeof ref> => ref !== null);
      const classDocs = await Promise.all(classRefs.map((ref) => getDoc(ref)));
      return classDocs.filter((d) => d.exists()).map((d) => toClass(d.id, d.data()!));
    } catch (e) {
      throw toApiError(e);
    }
  },

  async getClass(classId: string): Promise<Class> {
    try {
      const snap = await getDoc(doc(db, "classes", classId));
      if (!snap.exists()) throw new ApiError("not-found", "Class not found");
      return toClass(snap.id, snap.data());
    } catch (e) {
      throw toApiError(e);
    }
  },

  async createClass(input: CreateClassInput): Promise<Class> {
    const uid = requireUid();
    try {
      const ref = doc(collection(db, "classes")); // pre-generate the id
      const joinCode = await uniqueClassCode();
      const name = input.name.trim();
      const coverUrl = coverFor(ref.id);
      const schedules = input.schedules ?? [];

      await setDoc(ref, {
        name,
        code: joinCode,
        coverUrl,
        ownerId: uid,
        schedules,
        createdAt: serverTimestamp(),
      });

      return {
        id: ref.id,
        name,
        code: joinCode,
        coverUrl,
        ownerId: uid,
        schedules,
        createdAt: new Date().toISOString(),
      };
    } catch (e) {
      throw toApiError(e);
    }
  },

  async joinClassByCode(joinCode: string): Promise<Class> {
    const uid = requireUid();
    try {
      const found = await getDocs(
        query(collection(db, "classes"), where("code", "==", joinCode.trim()), limit(1)),
      );
      if (found.empty) throw new ApiError("not-found", "No class with that code");
      const classDoc = found.docs[0];

      const profile = await loadProfile(uid);
      await setDoc(doc(db, "classes", classDoc.id, "members", uid), {
        uid,
        name: profile?.name ?? "",
        email: profile?.email ?? "",
        avatarUrl: profile?.avatarUrl ?? "",
        role: profile?.role ?? "student",
        joinedAt: serverTimestamp(),
      });
      return toClass(classDoc.id, classDoc.data());
    } catch (e) {
      throw toApiError(e);
    }
  },

  async leaveClass(classId: string): Promise<void> {
    const uid = requireUid();
    try {
      await deleteDoc(doc(db, "classes", classId, "members", uid));
    } catch (e) {
      throw toApiError(e);
    }
  },

  async assignClassRep(classId: string, memberId: string): Promise<void> {
    requireUid();
    try {
      await updateDoc(doc(db, "classes", classId), { classRepId: memberId });
    } catch (e) {
      throw toApiError(e);
    }
  },

  // ---- Members ----
  async listMembers(classId: string): Promise<Member[]> {
    try {
      const snap = await getDocs(collection(db, "classes", classId, "members"));
      return snap.docs.map((d) => toMember(d.id, d.data()));
    } catch (e) {
      throw toApiError(e);
    }
  },

  async removeMember(classId: string, memberId: string): Promise<void> {
    requireUid();
    try {
      await deleteDoc(doc(db, "classes", classId, "members", memberId));
      // if the removed member was the assigned class rep, clear it
      const classSnap = await getDoc(doc(db, "classes", classId));
      if (classSnap.exists() && classSnap.data().classRepId === memberId) {
        await updateDoc(doc(db, "classes", classId), { classRepId: deleteField() });
      }
    } catch (e) {
      throw toApiError(e);
    }
  },

  // ---- Tasks ----
  async listTasks(classId: string): Promise<Task[]> {
    try {
      const snap = await getDocs(collection(db, "classes", classId, "tasks"));
      return snap.docs.map((d) => toTask(d.id, classId, d.data()));
    } catch (e) {
      throw toApiError(e);
    }
  },

  async listMyTasks(): Promise<Task[]> {
    try {
      const classIds = await visibleClassIds();
      const perClass = await Promise.all(
        classIds.map((cid) =>
          getDocs(collection(db, "classes", cid, "tasks")).then((snap) =>
            snap.docs.map((d) => toTask(d.id, cid, d.data())),
          ),
        ),
      );
      return perClass.flat();
    } catch (e) {
      throw toApiError(e);
    }
  },

  async createTask(classId: string, input: CreateTaskInput): Promise<Task> {
    const uid = requireUid();
    try {
      const ref = doc(collection(db, "classes", classId, "tasks"));
      const dueAtIso = new Date(input.dueAt).toISOString();
      await setDoc(ref, {
        title: input.title.trim(),
        description: input.description,
        type: input.type,
        dueAt: Timestamp.fromDate(new Date(input.dueAt)),
        createdBy: uid,
        createdAt: serverTimestamp(),
      });
      return {
        id: ref.id,
        classId,
        title: input.title.trim(),
        description: input.description,
        type: input.type,
        dueAt: dueAtIso,
        createdBy: uid,
        createdAt: new Date().toISOString(),
      };
    } catch (e) {
      throw toApiError(e);
    }
  },

  async listCompletedTaskIds(): Promise<string[]> {
    const uid = requireUid();
    try {
      const snap = await getDocs(collection(db, "users", uid, "completions"));
      return snap.docs.map((d) => d.id);
    } catch (e) {
      throw toApiError(e);
    }
  },

  async setTaskComplete(taskId: string, complete: boolean): Promise<void> {
    const uid = requireUid();
    try {
      const ref = doc(db, "users", uid, "completions", taskId);
      if (complete) {
        await setDoc(ref, { completedAt: serverTimestamp() });
      } else {
        await deleteDoc(ref);
      }
    } catch (e) {
      throw toApiError(e);
    }
  },

  // ---- Announcements ----
  async listAnnouncements(classId: string): Promise<Announcement[]> {
    try {
      const snap = await getDocs(collection(db, "classes", classId, "announcements"));
      return snap.docs.map((d) => toAnnouncement(d.id, classId, d.data()));
    } catch (e) {
      throw toApiError(e);
    }
  },

  async listMyAnnouncements(): Promise<Announcement[]> {
    try {
      const classIds = await visibleClassIds();
      const perClass = await Promise.all(
        classIds.map((cid) =>
          getDocs(collection(db, "classes", cid, "announcements")).then((snap) =>
            snap.docs.map((d) => toAnnouncement(d.id, cid, d.data())),
          ),
        ),
      );
      return perClass.flat();
    } catch (e) {
      throw toApiError(e);
    }
  },

  async createAnnouncement(
    classId: string,
    input: CreateAnnouncementInput,
  ): Promise<Announcement> {
    const uid = requireUid();
    try {
      const ref = doc(collection(db, "classes", classId, "announcements"));
      await setDoc(ref, {
        title: input.title.trim(),
        content: input.content,
        createdBy: uid,
        createdAt: serverTimestamp(),
      });
      return {
        id: ref.id,
        classId,
        title: input.title.trim(),
        content: input.content,
        createdBy: uid,
        createdAt: new Date().toISOString(),
      };
    } catch (e) {
      throw toApiError(e);
    }
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

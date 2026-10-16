/**
 * Firebase implementation of ClassdApi — every method talks to Firebase Auth,
 * Firestore, or a Cloud Function (`functions/src/index.ts`).
 *
 * Firestore data model (see ARCHITECTURE.md for full detail):
 *   users/{uid}
 *   classes/{classId}
 *   classes/{classId}/members/{uid}
 *   classes/{classId}/tasks/{taskId}
 *   classes/{classId}/announcements/{announcementId}
 *   users/{uid}/completions/{taskId}    (per-user task completion)
 *
 * Conventions:
 *  - Firestore Timestamps are mapped to ISO strings before returning — the
 *    contract requires ISO strings, not Timestamp objects.
 *  - Every method throws `ApiError` (via `toApiError`), never a raw Firebase
 *    error, so the UI can show a friendly message.
 */

import { FirebaseError } from "firebase/app";
import {
  EmailAuthProvider,
  createUserWithEmailAndPassword,
  reauthenticateWithCredential,
  reload,
  sendEmailVerification as fbSendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged as fbOnAuthStateChanged,
  updateProfile as fbUpdateProfile,
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
  arrayUnion,
  arrayRemove,
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
  type CreateGroupTaskInput,
  type Member,
  type Task,
  type Announcement,
  type Group,
  type GroupTask,
  type GroupTaskStatus,
  type SignInInput,
  type SignUpInput,
  type UpdateAnnouncementInput,
  type UserProfile,
} from "./contract";
import { httpsCallable } from "firebase/functions";
import { auth, db, functions } from "@/lib/firebase";
import { getFaceFor } from "@/lib/avatars";

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
    // system role is only admin|student — coerce any legacy value to student
    role: data.role === "admin" ? "admin" : "student",
    avatarUrl: (data.avatarUrl as string) ?? "",
    createdAt: tsToIso(data.createdAt),
    // verification lives on the Auth user, not the profile doc
    emailVerified: auth.currentUser?.uid === uid ? auth.currentUser.emailVerified : false,
    notificationPrefs: {
      newPosts: data.notificationPrefs?.newPosts !== false,
      reminders: data.notificationPrefs?.reminders !== false,
    },
  };
}

/** Read a user's profile doc; null if it does not exist. */
async function loadProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? toUserProfile(uid, snap.data()) : null;
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
      case "auth/missing-email":
        return new ApiError("invalid-argument", "Please enter your email.");
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
      case "permission-denied":
        return new ApiError("permission-denied", "You don't have permission to do that.");
      // Cloud Function errors carry a message written for the user
      case "functions/unauthenticated":
        return new ApiError("unauthenticated", e.message);
      case "functions/invalid-argument":
        return new ApiError("invalid-argument", e.message);
      case "functions/not-found":
        return new ApiError("not-found", e.message);
      case "functions/permission-denied":
        return new ApiError("permission-denied", e.message);
      case "functions/resource-exhausted":
        return new ApiError("unknown", e.message);
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
    // per-class role: classRep or student (legacy values coerce to student)
    role: data.role === "classRep" ? "classRep" : "student",
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
  if (profile?.role === "admin") {
    const snap = await getDocs(collection(db, "classes"));
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
    // legacy docs have no category; treat them as general
    category:
      data.category === "cat" || data.category === "deadline" ? data.category : "general",
    ...(data.dueAt ? { dueAt: tsToIso(data.dueAt) } : {}),
    createdBy: data.createdBy ?? "",
    createdAt: tsToIso(data.createdAt),
  };
}

/**
 * Ids of the groups the current user already belongs to within a class.
 * Used to enforce "one group per class" on join/create.
 */
async function myGroupIdsInClass(classId: string): Promise<string[]> {
  const uid = requireUid();
  const memberSnap = await getDocs(
    query(collectionGroup(db, "groupMembers"), where("uid", "==", uid)),
  );
  const refs = memberSnap.docs
    .map((d) => d.ref.parent.parent)
    .filter((ref): ref is NonNullable<typeof ref> => ref !== null);
  const snaps = await Promise.all(refs.map((ref) => getDoc(ref)));
  return snaps
    .filter((s) => s.exists() && s.data()!.classId === classId)
    .map((s) => s.id);
}

/** Shape a groups/{id} document into a Group. */
function toGroup(id: string, data: DocumentData, memberCount?: number): Group {
  return {
    id,
    classId: data.classId ?? "",
    name: data.name ?? "",
    createdBy: data.createdBy ?? "",
    createdAt: tsToIso(data.createdAt),
    ...(memberCount !== undefined ? { memberCount } : {}),
  };
}

/** Shape a groups/{id}/tasks/{taskId} document into a GroupTask. */
function toGroupTask(id: string, groupId: string, data: DocumentData): GroupTask {
  return {
    id,
    groupId,
    title: data.title ?? "",
    description: data.description ?? "",
    dueAt: tsToIso(data.dueAt),
    assignedTo: data.assignedTo ?? "",
    assignedToName: data.assignedToName ?? "",
    status: (data.status as GroupTaskStatus) ?? "pending",
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
      // best-effort: the home screen offers a resend if this fails
      await fbSendEmailVerification(cred.user).catch(() => {});

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
        emailVerified: false,
        notificationPrefs: { newPosts: true, reminders: true },
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
    patch: Partial<Pick<UserProfile, "name" | "avatarUrl" | "notificationPrefs">>,
  ): Promise<UserProfile> {
    const current = auth.currentUser;
    if (!current) throw new ApiError("unauthenticated", "Not signed in");
    try {
      const fields: Record<string, unknown> = {};
      if (patch.name !== undefined) fields.name = patch.name;
      if (patch.avatarUrl !== undefined) fields.avatarUrl = patch.avatarUrl;
      if (patch.notificationPrefs !== undefined) fields.notificationPrefs = patch.notificationPrefs;

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

  async deleteAccount(password: string): Promise<void> {
    const current = auth.currentUser;
    if (!current?.email) throw new ApiError("unauthenticated", "Not signed in");
    try {
      // proves it's really them (and satisfies Firebase's recent-login rule)
      await reauthenticateWithCredential(
        current,
        EmailAuthProvider.credential(current.email, password),
      );
      // data + Auth account are removed server-side by the deleteAccount function
      await httpsCallable(functions, "deleteAccount")();
      await fbSignOut(auth);
    } catch (e) {
      if (
        e instanceof FirebaseError &&
        (e.code === "auth/invalid-credential" || e.code === "auth/wrong-password")
      ) {
        throw new ApiError("unauthenticated", "That password isn't right.");
      }
      throw toApiError(e);
    }
  },

  async sendPasswordReset(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (e) {
      // don't reveal whether an account exists for this email
      if (e instanceof FirebaseError && e.code === "auth/user-not-found") return;
      throw toApiError(e);
    }
  },

  async sendEmailVerification(): Promise<void> {
    const current = auth.currentUser;
    if (!current) throw new ApiError("unauthenticated", "Not signed in");
    try {
      await fbSendEmailVerification(current);
    } catch (e) {
      throw toApiError(e);
    }
  },

  async reloadCurrentUser(): Promise<UserProfile | null> {
    const current = auth.currentUser;
    if (!current) return null;
    try {
      await reload(current);
      return await loadProfile(current.uid);
    } catch (e) {
      throw toApiError(e);
    }
  },

  // ---- Project groups ----
  async listGroups(classId: string): Promise<Group[]> {
    try {
      const snap = await getDocs(query(collection(db, "groups"), where("classId", "==", classId)));
      return await Promise.all(
        snap.docs.map(async (d) => {
          const members = await getDocs(collection(db, "groups", d.id, "groupMembers"));
          return toGroup(d.id, d.data(), members.size);
        }),
      );
    } catch (e) {
      throw toApiError(e);
    }
  },

  async listMyGroups(): Promise<Group[]> {
    const uid = requireUid();
    try {
      const memberSnap = await getDocs(
        query(collectionGroup(db, "groupMembers"), where("uid", "==", uid)),
      );
      const groupRefs = memberSnap.docs
        .map((d) => d.ref.parent.parent)
        .filter((ref): ref is NonNullable<typeof ref> => ref !== null);
      const groups = await Promise.all(groupRefs.map((ref) => getDoc(ref)));
      return groups.filter((g) => g.exists()).map((g) => toGroup(g.id, g.data()!));
    } catch (e) {
      throw toApiError(e);
    }
  },

  async getGroup(groupId: string): Promise<Group> {
    try {
      const snap = await getDoc(doc(db, "groups", groupId));
      if (!snap.exists()) throw new ApiError("not-found", "Group not found");
      return toGroup(snap.id, snap.data());
    } catch (e) {
      throw toApiError(e);
    }
  },

  async createGroup(classId: string, name: string): Promise<Group> {
    const uid = requireUid();
    try {
      // one group per class
      if ((await myGroupIdsInClass(classId)).length > 0) {
        throw new ApiError(
          "already-exists",
          "You're already in a group for this class. Leave it first to join or create another.",
        );
      }
      const profile = await loadProfile(uid);
      const ref = doc(collection(db, "groups"));
      const trimmed = name.trim();
      await setDoc(ref, {
        classId,
        name: trimmed,
        createdBy: uid,
        createdAt: serverTimestamp(),
      });
      // creator auto-joins
      await setDoc(doc(db, "groups", ref.id, "groupMembers", uid), {
        uid,
        name: profile?.name ?? "",
        email: profile?.email ?? "",
        joinedAt: serverTimestamp(),
      });
      return {
        id: ref.id,
        classId,
        name: trimmed,
        createdBy: uid,
        createdAt: new Date().toISOString(),
      };
    } catch (e) {
      throw toApiError(e);
    }
  },

  async updateGroup(groupId: string, patch: { name: string }): Promise<Group> {
    requireUid();
    try {
      const ref = doc(db, "groups", groupId);
      await updateDoc(ref, { name: patch.name.trim() });
      const snap = await getDoc(ref);
      if (!snap.exists()) throw new ApiError("not-found", "Group not found");
      return toGroup(snap.id, snap.data());
    } catch (e) {
      throw toApiError(e);
    }
  },

  async deleteGroup(groupId: string): Promise<void> {
    requireUid();
    try {
      // the onGroupDeleted function removes its members and tasks
      await deleteDoc(doc(db, "groups", groupId));
    } catch (e) {
      throw toApiError(e);
    }
  },

  async joinGroup(groupId: string): Promise<void> {
    const uid = requireUid();
    try {
      // one group per class: block joining if already in another group here
      const groupSnap = await getDoc(doc(db, "groups", groupId));
      if (!groupSnap.exists()) throw new ApiError("not-found", "Group not found");
      const classId = groupSnap.data().classId as string;
      const others = (await myGroupIdsInClass(classId)).filter((id) => id !== groupId);
      if (others.length > 0) {
        throw new ApiError(
          "already-exists",
          "You're already in a group for this class. Leave it first to join another.",
        );
      }
      const profile = await loadProfile(uid);
      await setDoc(doc(db, "groups", groupId, "groupMembers", uid), {
        uid,
        name: profile?.name ?? "",
        email: profile?.email ?? "",
        joinedAt: serverTimestamp(),
      });
    } catch (e) {
      throw toApiError(e);
    }
  },

  async leaveGroup(groupId: string): Promise<void> {
    const uid = requireUid();
    try {
      await deleteDoc(doc(db, "groups", groupId, "groupMembers", uid));
    } catch (e) {
      throw toApiError(e);
    }
  },

  async listGroupMembers(groupId: string): Promise<Member[]> {
    try {
      const snap = await getDocs(collection(db, "groups", groupId, "groupMembers"));
      return snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name ?? "",
          email: data.email ?? "",
          role: "student" as const,
          joinedAt: tsToIso(data.joinedAt),
        };
      });
    } catch (e) {
      throw toApiError(e);
    }
  },

  async listGroupTasks(groupId: string): Promise<GroupTask[]> {
    try {
      const snap = await getDocs(collection(db, "groups", groupId, "tasks"));
      return snap.docs.map((d) => toGroupTask(d.id, groupId, d.data()));
    } catch (e) {
      throw toApiError(e);
    }
  },

  async createGroupTask(groupId: string, input: CreateGroupTaskInput): Promise<GroupTask> {
    const uid = requireUid();
    try {
      const ref = doc(collection(db, "groups", groupId, "tasks"));
      const dueIso = new Date(input.dueAt).toISOString();
      await setDoc(ref, {
        title: input.title.trim(),
        description: input.description,
        dueAt: Timestamp.fromDate(new Date(input.dueAt)),
        assignedTo: input.assignedTo,
        assignedToName: input.assignedToName,
        status: "pending",
        createdBy: uid,
        createdAt: serverTimestamp(),
      });
      return {
        id: ref.id,
        groupId,
        title: input.title.trim(),
        description: input.description,
        dueAt: dueIso,
        assignedTo: input.assignedTo,
        assignedToName: input.assignedToName,
        status: "pending",
        createdBy: uid,
        createdAt: new Date().toISOString(),
      };
    } catch (e) {
      throw toApiError(e);
    }
  },

  async setGroupTaskStatus(
    groupId: string,
    taskId: string,
    status: GroupTaskStatus,
  ): Promise<void> {
    requireUid();
    try {
      await updateDoc(doc(db, "groups", groupId, "tasks", taskId), { status });
    } catch (e) {
      throw toApiError(e);
    }
  },

  // ---- Push notifications ----
  async registerPushToken(token: string): Promise<void> {
    const uid = requireUid();
    try {
      await updateDoc(doc(db, "users", uid), { expoPushTokens: arrayUnion(token) });
    } catch (e) {
      throw toApiError(e);
    }
  },

  async unregisterPushToken(token: string): Promise<void> {
    const uid = requireUid();
    try {
      await updateDoc(doc(db, "users", uid), { expoPushTokens: arrayRemove(token) });
    } catch (e) {
      throw toApiError(e);
    }
  },

  // ---- Classes ----
  async listClasses(): Promise<Class[]> {
    const uid = requireUid();
    try {
      const profile = await loadProfile(uid);
      if (profile?.role === "admin") {
        // admin: every class in the system
        const snap = await getDocs(collection(db, "classes"));
        return snap.docs.map((d) => toClass(d.id, d.data()));
      }
      // members (students + assigned reps): classes where a members/{uid} doc exists
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
    requireUid();
    try {
      // runs in the joinClass Cloud Function, so students never list classes
      const join = httpsCallable<{ code: string }, { classId: string }>(functions, "joinClass");
      const { data } = await join({ code: joinCode.trim() });
      const snap = await getDoc(doc(db, "classes", data.classId));
      if (!snap.exists()) throw new ApiError("not-found", "Class not found");
      return toClass(snap.id, snap.data());
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
      // demote the previous rep's member doc, if any
      const classSnap = await getDoc(doc(db, "classes", classId));
      const previousRepId = classSnap.exists() ? classSnap.data().classRepId : undefined;
      if (previousRepId && previousRepId !== memberId) {
        await updateDoc(doc(db, "classes", classId, "members", previousRepId), {
          role: "student",
        }).catch(() => {}); // previous rep may have left the class
      }

      // promote the new rep on both the class doc and their member doc
      await updateDoc(doc(db, "classes", classId), { classRepId: memberId });
      await updateDoc(doc(db, "classes", classId, "members", memberId), {
        role: "classRep",
      });
    } catch (e) {
      throw toApiError(e);
    }
  },

  async regenerateClassCode(classId: string): Promise<Class> {
    requireUid();
    try {
      const ref = doc(db, "classes", classId);
      await updateDoc(ref, { code: await uniqueClassCode() });
      const snap = await getDoc(ref);
      if (!snap.exists()) throw new ApiError("not-found", "Class not found");
      return toClass(snap.id, snap.data());
    } catch (e) {
      throw toApiError(e);
    }
  },

  async deleteClass(classId: string): Promise<void> {
    requireUid();
    try {
      // the onClassDeleted function removes members, posts, files and groups
      await deleteDoc(doc(db, "classes", classId));
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
        dueAt: Timestamp.fromDate(new Date(input.dueAt)),
        createdBy: uid,
        createdAt: serverTimestamp(),
      });
      return {
        id: ref.id,
        classId,
        title: input.title.trim(),
        description: input.description,
        dueAt: dueAtIso,
        createdBy: uid,
        createdAt: new Date().toISOString(),
      };
    } catch (e) {
      throw toApiError(e);
    }
  },

  async updateTask(
    classId: string,
    taskId: string,
    patch: Partial<CreateTaskInput>,
  ): Promise<Task> {
    requireUid();
    try {
      const ref = doc(db, "classes", classId, "tasks", taskId);
      const fields: Record<string, unknown> = {};
      if (patch.title !== undefined) fields.title = patch.title.trim();
      if (patch.description !== undefined) fields.description = patch.description;
      if (patch.dueAt !== undefined) fields.dueAt = Timestamp.fromDate(new Date(patch.dueAt));
      await updateDoc(ref, fields);

      const snap = await getDoc(ref);
      if (!snap.exists()) throw new ApiError("not-found", "Task not found");
      return toTask(snap.id, classId, snap.data());
    } catch (e) {
      throw toApiError(e);
    }
  },

  async deleteTask(classId: string, taskId: string): Promise<void> {
    requireUid();
    try {
      await deleteDoc(doc(db, "classes", classId, "tasks", taskId));
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
        category: input.category,
        ...(input.dueAt ? { dueAt: Timestamp.fromDate(new Date(input.dueAt)) } : {}),
        createdBy: uid,
        createdAt: serverTimestamp(),
      });
      return {
        id: ref.id,
        classId,
        title: input.title.trim(),
        content: input.content,
        category: input.category,
        ...(input.dueAt ? { dueAt: new Date(input.dueAt).toISOString() } : {}),
        createdBy: uid,
        createdAt: new Date().toISOString(),
      };
    } catch (e) {
      throw toApiError(e);
    }
  },

  async updateAnnouncement(
    classId: string,
    announcementId: string,
    patch: UpdateAnnouncementInput,
  ): Promise<Announcement> {
    requireUid();
    try {
      const ref = doc(db, "classes", classId, "announcements", announcementId);
      const fields: Record<string, unknown> = {};
      if (patch.title !== undefined) fields.title = patch.title.trim();
      if (patch.content !== undefined) fields.content = patch.content;
      if (patch.category !== undefined) fields.category = patch.category;
      if (patch.dueAt === null) fields.dueAt = deleteField();
      else if (patch.dueAt !== undefined) fields.dueAt = Timestamp.fromDate(new Date(patch.dueAt));
      await updateDoc(ref, fields);

      const snap = await getDoc(ref);
      if (!snap.exists()) throw new ApiError("not-found", "Announcement not found");
      return toAnnouncement(snap.id, classId, snap.data());
    } catch (e) {
      throw toApiError(e);
    }
  },

  async deleteAnnouncement(classId: string, announcementId: string): Promise<void> {
    requireUid();
    try {
      await deleteDoc(doc(db, "classes", classId, "announcements", announcementId));
    } catch (e) {
      throw toApiError(e);
    }
  },
};

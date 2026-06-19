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
// import { auth, db, storage } from "@/lib/firebase";

function notImplemented(method: string): never {
  throw new ApiError("unknown", `firebase-impl: ${method} not implemented yet`);
}

export const firebaseApi: ClassdApi = {
  // ---- Auth ----
  // createUserWithEmailAndPassword + write users/{uid} doc with role.
  async signUpWithEmail(_input: SignUpInput): Promise<AuthResult> {
    return notImplemented("signUpWithEmail");
  },
  // signInWithEmailAndPassword + read users/{uid}.
  async signInWithEmail(_input: SignInInput): Promise<AuthResult> {
    return notImplemented("signInWithEmail");
  },
  // signInWithCredential(GoogleAuthProvider.credential(idToken)); create
  // users/{uid} on first sign-in.
  async signInWithGoogle(_idToken: string, _role?: Role): Promise<AuthResult> {
    return notImplemented("signInWithGoogle");
  },
  async signInWithApple(_identityToken: string, _role?: Role): Promise<AuthResult> {
    return notImplemented("signInWithApple");
  },
  async signOut(): Promise<void> {
    return notImplemented("signOut");
  },
  // auth.currentUser → read users/{uid}.
  async getCurrentUser(): Promise<UserProfile | null> {
    return notImplemented("getCurrentUser");
  },
  // onAuthStateChanged(auth, ...) → load profile → cb.
  onAuthStateChanged(_cb: (user: UserProfile | null) => void): () => void {
    notImplemented("onAuthStateChanged");
  },
  // updateDoc(users/{uid}, patch).
  async updateProfile(
    _patch: Partial<Pick<UserProfile, "name" | "avatarUrl">>,
  ): Promise<UserProfile> {
    return notImplemented("updateProfile");
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

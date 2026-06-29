/**
 * ClassdApi — the single contract between the mobile frontend and the backend.
 *
 * The frontend ONLY talks to the backend through this interface. There are two
 * implementations:
 *   - `mock-impl.ts`     in-memory seed data (current prototype behaviour)
 *   - `firebase-impl.ts` real Firebase (auth + Firestore + Storage) — TO BUILD
 *
 * Backend dev: implement every method in `firebase-impl.ts` so it satisfies
 * this interface. When done, flip EXPO_PUBLIC_API_BACKEND=firebase. The UI does
 * not change.
 *
 * Conventions:
 *  - All methods are async (return Promises).
 *  - Timestamps are ISO 8601 strings (e.g. "2026-06-19T08:00:00.000Z"). The UI
 *    turns these into human labels ("Due tomorrow", "2h ago") — do NOT send
 *    pre-formatted labels from the backend.
 *  - Throw `ApiError` (see below) on failure so the UI can show a message.
 *  - "Current user" is derived from the auth session on the backend; the client
 *    never passes a userId for the caller.
 */

export type Role = "classRep" | "student";
export type TaskType = "assignment" | "cat" | "deadline";

/** Standard error the UI knows how to display. */
export class ApiError extends Error {
  constructor(
    public code: ApiErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export type ApiErrorCode =
  | "unauthenticated"
  | "permission-denied"
  | "not-found"
  | "invalid-argument"
  | "already-exists"
  | "unknown";

/* ------------------------------------------------------------------ *
 * Entities (server shapes)
 * ------------------------------------------------------------------ */

export interface UserProfile {
  id: string; // Firebase Auth uid
  name: string;
  email: string;
  role: Role;
  avatarUrl: string;
  createdAt: string; // ISO
}

export interface ScheduleBlock {
  location?: string;
  /** 0 = Sun … 6 = Sat */
  day: number;
  /** minutes from midnight, e.g. 8 * 60 */
  startMinutes: number;
  endMinutes: number;
}

export interface Class {
  id: string;
  name: string;
  /** 6-digit join code, unique, issued by the backend on create. */
  code: string;
  coverUrl: string;
  /** uid of the user who created the class. */
  ownerId: string;
  /** uid of the appointed class rep for this class. */
  classRepId?: string;
  schedules: ScheduleBlock[];
  createdAt: string; // ISO
}

export interface Member {
  id: string; // uid
  name: string;
  email: string;
  avatarUrl?: string;
  role: Role;
  joinedAt: string; // ISO
}

export interface Task {
  id: string;
  classId: string;
  title: string;
  description: string;
  type: TaskType;
  /** When the task is due. ISO; UI formats the label. */
  dueAt: string;
  createdBy: string; // uid
  createdAt: string; // ISO
}

export interface Announcement {
  id: string;
  classId: string;
  title: string;
  content: string;
  createdBy: string; // uid
  createdAt: string; // ISO
}

export interface Material {
  id: string;
  classId: string;
  name: string;
  sizeBytes?: number;
  mimeType?: string;
  /** Public/download URL from Cloud Storage. */
  url: string;
  /** Storage object path, needed for deletion. */
  storagePath: string;
  uploadedBy: string; // uid
  createdAt: string; // ISO
}

/* ------------------------------------------------------------------ *
 * Request payloads
 * ------------------------------------------------------------------ */

export interface SignUpInput {
  name?: string;
  email: string;
  password: string;
  role: Role;
}

export interface SignInInput {
  email: string;
  password: string;
}

export interface AuthResult {
  user: UserProfile;
  /** True if this was the user's first sign-in (just created). */
  isNewUser: boolean;
}

export interface CreateClassInput {
  name: string;
  schedules?: ScheduleBlock[];
}

export interface CreateTaskInput {
  title: string;
  description: string;
  type: TaskType;
  dueAt: string; // ISO
}

export interface CreateAnnouncementInput {
  title: string;
  content: string;
}

/** A file selected from the device, ready to upload. */
export interface UploadFileInput {
  /** Local uri from expo-document-picker. */
  uri: string;
  name: string;
  mimeType?: string;
  sizeBytes?: number;
}

/* ------------------------------------------------------------------ *
 * The contract
 * ------------------------------------------------------------------ */

export interface ClassdApi {
  // ---- Auth ----
  signUpWithEmail(input: SignUpInput): Promise<AuthResult>;
  signInWithEmail(input: SignInInput): Promise<AuthResult>;
  /** `idToken` from expo-auth-session / Google sign-in. `role` only used if new. */
  signInWithGoogle(idToken: string, role?: Role): Promise<AuthResult>;
  signInWithApple(identityToken: string, role?: Role): Promise<AuthResult>;
  signOut(): Promise<void>;
  /** Current signed-in profile, or null. */
  getCurrentUser(): Promise<UserProfile | null>;
  /** Subscribe to auth changes; returns an unsubscribe fn. */
  onAuthStateChanged(cb: (user: UserProfile | null) => void): () => void;
  updateProfile(patch: Partial<Pick<UserProfile, "name" | "avatarUrl">>): Promise<UserProfile>;

  // ---- Push notifications ----
  /** Save an Expo push token for the current user's device. */
  registerPushToken(token: string): Promise<void>;
  /** Remove an Expo push token (on sign-out or token refresh). */
  unregisterPushToken(token: string): Promise<void>;

  // ---- Classes ----
  /** Classes the caller created as rep or joined as a member. */
  listClasses(): Promise<Class[]>;
  getClass(classId: string): Promise<Class>;
  createClass(input: CreateClassInput): Promise<Class>; // creator becomes class rep
  joinClassByCode(code: string): Promise<Class>; // joins as member
  leaveClass(classId: string): Promise<void>; // member
  assignClassRep(classId: string, memberId: string): Promise<void>; // class rep

  // ---- Members ----
  listMembers(classId: string): Promise<Member[]>;
  removeMember(classId: string, memberId: string): Promise<void>; // class rep

  // ---- Tasks ----
  listTasks(classId: string): Promise<Task[]>;
  /** All tasks across the caller's classes (home dashboard). */
  listMyTasks(): Promise<Task[]>;
  createTask(classId: string, input: CreateTaskInput): Promise<Task>; // class rep
  /** Per-user completion state. */
  listCompletedTaskIds(): Promise<string[]>;
  setTaskComplete(taskId: string, complete: boolean): Promise<void>;

  // ---- Announcements ----
  listAnnouncements(classId: string): Promise<Announcement[]>;
  /** All announcements across the caller's classes (home feed). */
  listMyAnnouncements(): Promise<Announcement[]>;
  createAnnouncement(classId: string, input: CreateAnnouncementInput): Promise<Announcement>;

  // ---- Materials ----
  listMaterials(classId: string): Promise<Material[]>;
  /** Uploads the file to Storage, then records metadata. */
  uploadMaterial(classId: string, file: UploadFileInput): Promise<Material>;
  deleteMaterial(classId: string, materialId: string): Promise<void>;
}

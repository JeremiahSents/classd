/**
 * In-memory mock implementation of ClassdApi.
 *
 * This is the current prototype behaviour, behind the contract. It lets the app
 * run with no backend (EXPO_PUBLIC_API_BACKEND=mock). State is NOT persisted —
 * it resets on reload. Backend dev: use this as the behavioural reference for
 * `firebase-impl.ts`.
 */

import {
  ApiError,
  type ClassdApi,
  type AuthResult,
  type Class,
  type CreateAnnouncementInput,
  type CreateClassInput,
  type CreateTaskInput,
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

const now = () => new Date().toISOString();
const id = (p: string) => `${p}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
const code = () => Math.floor(100000 + Math.random() * 900000).toString();
const coverFor = (seed: string) => `https://picsum.photos/seed/${seed}/600/400`;

/* ---- seed state ---- */

const LECTURER: UserProfile = {
  id: "u-lecturer",
  name: "Jeremiah Sentomero",
  email: "sentomerojeremy@gmail.com",
  role: "lecturer",
  avatarUrl: "https://www.notion.so/icons/user-circle-filled_gray.svg",
  createdAt: now(),
};

let currentUser: UserProfile | null = LECTURER;
const authListeners = new Set<(u: UserProfile | null) => void>();
const emitAuth = () => authListeners.forEach((cb) => cb(currentUser));

let classes: Class[] = [
  { id: "bio101", name: "Intro to Biology", code: "428193", coverUrl: coverFor("bio101"), ownerId: "u-lecturer", classRepId: "m2", createdAt: now(), schedules: [{ location: "SCI Lab 1", day: 4, startMinutes: 480, endMinutes: 600 }, { location: "SCI 204", day: 4, startMinutes: 630, endMinutes: 720 }] },
  { id: "cs204", name: "Data Structures", code: "771204", coverUrl: coverFor("cs204"), ownerId: "u-lecturer", classRepId: "m5", createdAt: now(), schedules: [{ location: "Tech 3.1", day: 4, startMinutes: 780, endMinutes: 900 }] },
  { id: "hist110", name: "World History", code: "560338", coverUrl: coverFor("hist110"), ownerId: "u-lecturer", createdAt: now(), schedules: [{ location: "Hum 2.1", day: 3, startMinutes: 660, endMinutes: 780 }] },
  { id: "math150", name: "Calculus I", code: "903517", coverUrl: coverFor("math150"), ownerId: "u-lecturer", createdAt: now(), schedules: [{ location: "Math 1.0", day: 5, startMinutes: 540, endMinutes: 660 }] },
];

const membersByClass: Record<string, Member[]> = {
  bio101: [
    { id: "m1", name: "Aisha Mwangi", email: "aisha.mwangi@strathmore.edu", role: "student", joinedAt: now() },
    { id: "m2", name: "Brian Otieno", email: "brian.otieno@strathmore.edu", role: "student", joinedAt: now() },
    { id: "m3", name: "Cynthia Wambui", email: "cynthia.wambui@strathmore.edu", role: "student", joinedAt: now() },
  ],
  cs204: [{ id: "m5", name: "Esther Njeri", email: "esther.njeri@strathmore.edu", role: "student", joinedAt: now() }],
  hist110: [{ id: "m8", name: "Henry Kibet", email: "henry.kibet@strathmore.edu", role: "student", joinedAt: now() }],
  math150: [],
};

let tasks: Task[] = [
  { id: "t1", classId: "bio101", title: "Cell Structure Lab Report", description: "Submit your write-up on the microscope lab.", type: "assignment", dueAt: now(), createdBy: "u-lecturer", createdAt: now() },
  { id: "t3", classId: "cs204", title: "Binary Trees Problem Set", description: "Problems 1-8 from the handout.", type: "assignment", dueAt: now(), createdBy: "u-lecturer", createdAt: now() },
];

let announcements: Announcement[] = [
  { id: "n1", classId: "math150", title: "Midterm moved to Friday", content: "Rescheduled to Friday 9am.", createdBy: "u-lecturer", createdAt: now() },
  { id: "n2", classId: "cs204", title: "Guest lecture Thursday", content: "Industry speaker on graph databases.", createdBy: "u-lecturer", createdAt: now() },
];

let materials: Material[] = [
  { id: "mat1", classId: "bio101", name: "Lecture 3 - Cell Membrane.pdf", sizeBytes: 2_400_000, mimeType: "application/pdf", url: "", storagePath: "materials/bio101/mat1", uploadedBy: "u-lecturer", createdAt: now() },
];

let enrolledClassIds = ["bio101", "cs204"];
let completedTaskIds = ["t1"];

const requireAuth = () => {
  if (!currentUser) throw new ApiError("unauthenticated", "Not signed in");
  return currentUser;
};

/** Classes visible to the caller given their role. */
const visibleClasses = () => {
  const u = requireAuth();
  return u.role === "lecturer"
    ? classes.filter((c) => c.ownerId === u.id)
    : classes.filter((c) => enrolledClassIds.includes(c.id));
};

export const mockApi: ClassdApi = {
  async signUpWithEmail(input: SignUpInput): Promise<AuthResult> {
    currentUser = { id: id("u"), name: input.name ?? input.email.split("@")[0], email: input.email, role: input.role, avatarUrl: LECTURER.avatarUrl, createdAt: now() };
    emitAuth();
    return { user: currentUser, isNewUser: true };
  },
  async signInWithEmail(input: SignInInput): Promise<AuthResult> {
    currentUser = { ...LECTURER, email: input.email };
    emitAuth();
    return { user: currentUser, isNewUser: false };
  },
  async signInWithGoogle(_idToken, role: Role = "lecturer"): Promise<AuthResult> {
    currentUser = { ...LECTURER, role };
    emitAuth();
    return { user: currentUser, isNewUser: false };
  },
  async signInWithApple(_token, role: Role = "lecturer"): Promise<AuthResult> {
    currentUser = { ...LECTURER, role };
    emitAuth();
    return { user: currentUser, isNewUser: false };
  },
  async signOut() {
    currentUser = null;
    emitAuth();
  },
  async getCurrentUser() {
    return currentUser;
  },
  onAuthStateChanged(cb) {
    authListeners.add(cb);
    cb(currentUser);
    return () => authListeners.delete(cb);
  },
  async updateProfile(patch) {
    const u = requireAuth();
    currentUser = { ...u, ...patch };
    emitAuth();
    return currentUser;
  },

  async listClasses() {
    return visibleClasses();
  },
  async getClass(classId) {
    const c = classes.find((x) => x.id === classId);
    if (!c) throw new ApiError("not-found", "Class not found");
    return c;
  },
  async createClass(input: CreateClassInput) {
    const u = requireAuth();
    const c: Class = { id: id("c"), name: input.name.trim(), code: code(), coverUrl: coverFor(id("seed")), ownerId: u.id, schedules: input.schedules ?? [], createdAt: now() };
    classes = [c, ...classes];
    membersByClass[c.id] = [];
    return c;
  },
  async joinClassByCode(joinCode) {
    const c = classes.find((x) => x.code === joinCode.trim());
    if (!c) throw new ApiError("not-found", "No class with that code");
    if (!enrolledClassIds.includes(c.id)) enrolledClassIds = [...enrolledClassIds, c.id];
    return c;
  },
  async leaveClass(classId) {
    enrolledClassIds = enrolledClassIds.filter((x) => x !== classId);
  },
  async assignClassRep(classId, memberId) {
    classes = classes.map((c) => (c.id === classId ? { ...c, classRepId: memberId } : c));
  },

  async listMembers(classId) {
    return membersByClass[classId] ?? [];
  },
  async removeMember(classId, memberId) {
    membersByClass[classId] = (membersByClass[classId] ?? []).filter((m) => m.id !== memberId);
    classes = classes.map((c) => (c.id === classId && c.classRepId === memberId ? { ...c, classRepId: undefined } : c));
  },

  async listTasks(classId) {
    return tasks.filter((t) => t.classId === classId);
  },
  async listMyTasks() {
    const ids = new Set(visibleClasses().map((c) => c.id));
    return tasks.filter((t) => ids.has(t.classId));
  },
  async createTask(classId, input: CreateTaskInput) {
    const u = requireAuth();
    const t: Task = { id: id("t"), classId, createdBy: u.id, createdAt: now(), ...input };
    tasks = [t, ...tasks];
    return t;
  },
  async listCompletedTaskIds() {
    return completedTaskIds;
  },
  async setTaskComplete(taskId, complete) {
    completedTaskIds = complete
      ? Array.from(new Set([...completedTaskIds, taskId]))
      : completedTaskIds.filter((x) => x !== taskId);
  },

  async listAnnouncements(classId) {
    return announcements.filter((a) => a.classId === classId);
  },
  async listMyAnnouncements() {
    const ids = new Set(visibleClasses().map((c) => c.id));
    return announcements.filter((a) => ids.has(a.classId));
  },
  async createAnnouncement(classId, input: CreateAnnouncementInput) {
    const u = requireAuth();
    const a: Announcement = { id: id("n"), classId, createdBy: u.id, createdAt: now(), ...input };
    announcements = [a, ...announcements];
    return a;
  },

  async listMaterials(classId) {
    return materials.filter((m) => m.classId === classId);
  },
  async uploadMaterial(classId, file: UploadFileInput) {
    const u = requireAuth();
    const m: Material = { id: id("mat"), classId, name: file.name, sizeBytes: file.sizeBytes, mimeType: file.mimeType, url: file.uri, storagePath: `materials/${classId}/${file.name}`, uploadedBy: u.id, createdAt: now() };
    materials = [m, ...materials];
    return m;
  },
  async deleteMaterial(classId, materialId) {
    materials = materials.filter((m) => !(m.classId === classId && m.id === materialId));
  },
};

/**
 * Backend smoke test — exercises the Firestore backend with NO frontend.
 *
 * It signs up an admin (class owner) + a student as real Firebase Auth users
 * and runs the same Firestore operations that lib/api/firebase-impl.ts
 * performs — classes, join-by-code, tasks, completions, announcements, and
 * project groups — so it verifies both the data model AND the security rules.
 * Includes negative tests (student can't create class tasks; a non-member
 * can't create group tasks).
 *
 * Run against the LOCAL EMULATOR (recommended — safe, no real data, needs Java):
 *   1) firebase emulators:start --only auth,firestore
 *   2) in another terminal:  USE_EMULATOR=1 node scripts/backend-smoke.mjs
 *
 * Or against the REAL project (deploy rules + enable Email/Password first):
 *   node scripts/backend-smoke.mjs
 *   (uses timestamped test emails and cleans up after itself)
 */

import { readFileSync } from "node:fs";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  deleteUser,
} from "firebase/auth";
import {
  getFirestore,
  connectFirestoreEmulator,
  collection,
  collectionGroup,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  limit,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

/* ---------- config ---------- */

function loadEnv() {
  const env = {};
  try {
    const txt = readFileSync(new URL("../.env", import.meta.url), "utf8");
    for (const line of txt.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  } catch {
    /* no .env — emulator only needs projectId */
  }
  return env;
}

const env = loadEnv();
const USE_EMULATOR = process.env.USE_EMULATOR === "1";

const app = initializeApp({
  apiKey: env.EXPO_PUBLIC_FIREBASE_API_KEY ?? "demo-key",
  authDomain: env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? "classd-f6db8",
  storageBucket: env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.EXPO_PUBLIC_FIREBASE_APP_ID,
});

const auth = getAuth(app);
const db = getFirestore(app);

if (USE_EMULATOR) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  console.log("→ Using LOCAL EMULATOR\n");
} else {
  console.log("→ Using REAL project: " + (env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? "?") + "\n");
}

/* ---------- tiny test harness ---------- */

let passed = 0;
let failed = 0;

async function step(name, fn) {
  try {
    const result = await fn();
    console.log("  ✓ " + name);
    passed++;
    return result;
  } catch (e) {
    console.log("  ✗ " + name + "  ->  " + (e.code || e.message));
    failed++;
    throw e;
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error("assertion failed: " + msg);
}

/* ---------- operations (mirror firebase-impl.ts) ---------- */

async function signUp(email, password, name, role) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await setDoc(doc(db, "users", cred.user.uid), {
    name,
    email,
    role,
    avatarUrl: "",
    createdAt: serverTimestamp(),
  });
  return cred.user.uid;
}

async function createClass(name) {
  const uid = auth.currentUser.uid;
  const ref = doc(collection(db, "classes"));
  const code = String(Math.floor(100000 + Math.random() * 900000));
  await setDoc(ref, {
    name,
    code,
    coverUrl: `https://picsum.photos/seed/${ref.id}/600/400`,
    ownerId: uid,
    schedules: [],
    createdAt: serverTimestamp(),
  });
  return { id: ref.id, code };
}

async function joinByCode(code) {
  const uid = auth.currentUser.uid;
  const found = await getDocs(
    query(collection(db, "classes"), where("code", "==", code), limit(1)),
  );
  assert(!found.empty, "class with code exists");
  const classId = found.docs[0].id;
  await setDoc(doc(db, "classes", classId, "members", uid), {
    uid,
    name: "Test Student",
    email: auth.currentUser.email,
    role: "student",
    joinedAt: serverTimestamp(),
  });
  return classId;
}

async function myClassIds() {
  const uid = auth.currentUser.uid;
  const snap = await getDocs(query(collectionGroup(db, "members"), where("uid", "==", uid)));
  return snap.docs.map((d) => d.ref.parent.parent.id);
}

async function createTask(classId, title) {
  const uid = auth.currentUser.uid;
  const ref = doc(collection(db, "classes", classId, "tasks"));
  await setDoc(ref, {
    title,
    description: "desc",
    type: "assignment",
    dueAt: Timestamp.fromDate(new Date(Date.now() + 86_400_000)),
    createdBy: uid,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

async function createAnnouncement(classId, title) {
  const uid = auth.currentUser.uid;
  const ref = doc(collection(db, "classes", classId, "announcements"));
  await setDoc(ref, { title, content: "body", createdBy: uid, createdAt: serverTimestamp() });
  return ref.id;
}

async function myTasks() {
  const ids = await myClassIds();
  const out = [];
  for (const cid of ids) {
    const ts = await getDocs(collection(db, "classes", cid, "tasks"));
    out.push(...ts.docs.map((d) => d.id));
  }
  return out;
}

async function setComplete(taskId) {
  const uid = auth.currentUser.uid;
  await setDoc(doc(db, "users", uid, "completions", taskId), { completedAt: serverTimestamp() });
}

async function completedIds() {
  const uid = auth.currentUser.uid;
  const s = await getDocs(collection(db, "users", uid, "completions"));
  return s.docs.map((d) => d.id);
}

/* ---------- project-group operations (mirror firebase-impl.ts) ---------- */

async function createGroup(classId, name) {
  const uid = auth.currentUser.uid;
  const ref = doc(collection(db, "groups"));
  await setDoc(ref, { classId, name, createdBy: uid, createdAt: serverTimestamp() });
  // creator auto-joins
  await setDoc(doc(db, "groups", ref.id, "groupMembers", uid), {
    uid,
    name: "Test Student",
    email: auth.currentUser.email,
    joinedAt: serverTimestamp(),
  });
  return ref.id;
}

async function myGroupIds() {
  const uid = auth.currentUser.uid;
  const snap = await getDocs(
    query(collectionGroup(db, "groupMembers"), where("uid", "==", uid)),
  );
  return snap.docs.map((d) => d.ref.parent.parent.id);
}

async function createGroupTask(groupId, title, assignedTo, assignedToName) {
  const uid = auth.currentUser.uid;
  const ref = doc(collection(db, "groups", groupId, "tasks"));
  await setDoc(ref, {
    title,
    description: "desc",
    dueAt: Timestamp.fromDate(new Date(Date.now() + 86_400_000)),
    assignedTo,
    assignedToName,
    status: "pending",
    createdBy: uid,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

async function setGroupTaskStatus(groupId, taskId, status) {
  await setDoc(
    doc(db, "groups", groupId, "tasks", taskId),
    { status },
    { merge: true },
  );
}

/* ---------- the flow ---------- */

const stamp = Date.now();
const repEmail = `rep_${stamp}@test.classd`;
const stuEmail = `stu_${stamp}@test.classd`;
const pass = "Test123!pass";

let repUid, stuUid, classId, taskId, annId, groupId, groupTaskId;

async function main() {
  console.log("ADMIN (class owner)");
  repUid = await step("sign up admin", () => signUp(repEmail, pass, "Test Admin", "admin"));
  const cls = await step("create class", () => createClass("Smoke Test Class"));
  classId = cls.id;
  taskId = await step("create task", () => createTask(classId, "Smoke Task 1"));
  annId = await step("create announcement", () => createAnnouncement(classId, "Smoke Note 1"));
  await step("admin sees own class in listClasses", async () => {
    const snap = await getDocs(query(collection(db, "classes"), where("ownerId", "==", repUid)));
    assert(snap.docs.some((d) => d.id === classId), "owned class present");
  });

  console.log("\nSTUDENT");
  await signOut(auth);
  stuUid = await step("sign up student", () => signUp(stuEmail, pass, "Test Student", "student"));
  await step("join class by code", async () => {
    const joined = await joinByCode(cls.code);
    assert(joined === classId, "joined the right class");
  });
  await step("student sees joined class (collection-group query)", async () => {
    const ids = await myClassIds();
    assert(ids.includes(classId), "joined class visible");
  });
  await step("student sees the task in listMyTasks", async () => {
    const ids = await myTasks();
    assert(ids.includes(taskId), "task visible to student");
  });
  await step("mark task complete + read it back", async () => {
    await setComplete(taskId);
    const done = await completedIds();
    assert(done.includes(taskId), "completion recorded");
  });

  console.log("\nPROJECT GROUPS (as student)");
  groupId = await step("create group (creator auto-joins)", () =>
    createGroup(classId, "Smoke Group A"),
  );
  await step("student sees group in listMyGroups (collection-group query)", async () => {
    const ids = await myGroupIds();
    assert(ids.includes(groupId), "created group visible");
  });
  groupTaskId = await step("assign a group task to self", () =>
    createGroupTask(groupId, "Smoke Group Task", stuUid, "Test Student"),
  );
  await step("toggle group task to completed + read it back", async () => {
    await setGroupTaskStatus(groupId, groupTaskId, "completed");
    const snap = await getDocs(collection(db, "groups", groupId, "tasks"));
    const t = snap.docs.find((d) => d.id === groupTaskId);
    assert(t && t.get("status") === "completed", "status updated");
  });

  console.log("\nSECURITY RULES (negative tests)");
  await step("student is BLOCKED from creating a task", async () => {
    try {
      await createTask(classId, "should be denied");
      throw new Error("NOT blocked — rules are too permissive!");
    } catch (e) {
      assert(e.code === "permission-denied", "expected permission-denied, got " + (e.code || e.message));
    }
  });
  await step("NON-member is BLOCKED from creating a group task", async () => {
    // the admin never joined the group, so this write must be denied
    await signOut(auth);
    await signInWithEmailAndPassword(auth, repEmail, pass);
    try {
      await createGroupTask(groupId, "should be denied", repUid, "Test Admin");
      throw new Error("NOT blocked — group rules are too permissive!");
    } catch (e) {
      assert(e.code === "permission-denied", "expected permission-denied, got " + (e.code || e.message));
    }
  });
}

async function cleanup() {
  console.log("\nCLEANUP");
  try {
    await signOut(auth).catch(() => {});
    // student removes group data, own completion + profile, deletes own auth user
    await signInWithEmailAndPassword(auth, stuEmail, pass);
    if (groupId) {
      if (groupTaskId) {
        await deleteDoc(doc(db, "groups", groupId, "tasks", groupTaskId)).catch(() => {});
      }
      await deleteDoc(doc(db, "groups", groupId, "groupMembers", stuUid)).catch(() => {});
      await deleteDoc(doc(db, "groups", groupId)).catch(() => {});
    }
    await deleteDoc(doc(db, "users", stuUid, "completions", taskId)).catch(() => {});
    await deleteDoc(doc(db, "classes", classId, "members", stuUid)).catch(() => {});
    await deleteDoc(doc(db, "users", stuUid)).catch(() => {});
    await deleteUser(auth.currentUser).catch(() => {});
    // rep removes class content + class + profile, deletes own auth user
    await signInWithEmailAndPassword(auth, repEmail, pass);
    await deleteDoc(doc(db, "classes", classId, "tasks", taskId)).catch(() => {});
    await deleteDoc(doc(db, "classes", classId, "announcements", annId)).catch(() => {});
    await deleteDoc(doc(db, "classes", classId)).catch(() => {});
    await deleteDoc(doc(db, "users", repUid)).catch(() => {});
    await deleteUser(auth.currentUser).catch(() => {});
    console.log("  ✓ test data removed");
  } catch (e) {
    console.log("  (cleanup note: " + e.message + " — you may have leftover test data)");
  }
}

main()
  .catch(() => {})
  .finally(async () => {
    await cleanup();
    console.log(`\nRESULT: ${passed} passed, ${failed} failed`);
    process.exit(failed > 0 ? 1 : 0);
  });

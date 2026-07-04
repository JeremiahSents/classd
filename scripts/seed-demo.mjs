/**
 * Demo data seeder — fills the REAL Firebase project with realistic data so
 * the app can be demoed end to end. Unlike backend-smoke.mjs it does NOT
 * clean up after itself.
 *
 * Creates (idempotently — safe to re-run):
 *   - 4 accounts: 1 admin, 1 class rep, 2 students (fixed emails/passwords)
 *   - 2 classes owned by the admin, everyone joined, rep assigned
 *   - tasks with staggered due dates (one due soon, one overdue -> reminders)
 *   - announcements: CAT due soon, deadline in 3 days, general notice
 *   - a project group with both students + group tasks
 *
 * Run:  node scripts/seed-demo.mjs
 * Prerequisites: rules + indexes deployed, Email/Password auth enabled.
 * All credentials are printed at the end.
 */

import { readFileSync } from "node:fs";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
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
    /* no .env */
  }
  return env;
}

const env = loadEnv();
const app = initializeApp({
  apiKey: env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.EXPO_PUBLIC_FIREBASE_APP_ID,
});
const auth = getAuth(app);
const db = getFirestore(app);

console.log(`Seeding demo data into: ${env.EXPO_PUBLIC_FIREBASE_PROJECT_ID}\n`);

/* ---------- fixed demo accounts ---------- */

const PASS = "Demo123!pass";
const USERS = {
  admin: { email: "admin@demo.classd.app", name: "Demo Admin", role: "admin" },
  rep: { email: "rep@demo.classd.app", name: "Ryan Rep", role: "student" },
  stu1: { email: "aisha@demo.classd.app", name: "Aisha Mwangi", role: "student" },
  stu2: { email: "brian@demo.classd.app", name: "Brian Otieno", role: "student" },
};

const hours = (n) => Timestamp.fromMillis(Date.now() + n * 3_600_000);

/** Sign in; create the account (+ users doc) if it doesn't exist yet. */
async function signInOrCreate(u) {
  try {
    const cred = await signInWithEmailAndPassword(auth, u.email, PASS);
    return cred.user.uid;
  } catch {
    const cred = await createUserWithEmailAndPassword(auth, u.email, PASS);
    await setDoc(doc(db, "users", cred.user.uid), {
      name: u.name,
      email: u.email,
      role: u.role,
      avatarUrl: "",
      createdAt: serverTimestamp(),
    });
    return cred.user.uid;
  }
}

async function ensureClass(name, adminUid) {
  const existing = await getDocs(
    query(collection(db, "classes"), where("ownerId", "==", adminUid), where("name", "==", name)),
  );
  if (!existing.empty) {
    const d = existing.docs[0];
    return { id: d.id, code: d.get("code"), reused: true };
  }
  const ref = doc(collection(db, "classes"));
  const code = String(Math.floor(100000 + Math.random() * 900000));
  await setDoc(ref, {
    name,
    code,
    coverUrl: `https://picsum.photos/seed/${ref.id}/600/400`,
    ownerId: adminUid,
    schedules: [],
    createdAt: serverTimestamp(),
  });
  return { id: ref.id, code, reused: false };
}

async function joinClass(classId, uid, name, email) {
  await setDoc(doc(db, "classes", classId, "members", uid), {
    uid,
    name,
    email,
    avatarUrl: "",
    role: "student",
    joinedAt: serverTimestamp(),
  });
}

async function ensureDoc(ref, data) {
  if (!(await getDoc(ref)).exists()) await setDoc(ref, data);
}

/* ---------- the seed ---------- */

async function main() {
  // 1. accounts
  const uids = {};
  for (const [key, u] of Object.entries(USERS)) {
    await signOut(auth).catch(() => {});
    uids[key] = await signInOrCreate(u);
    console.log(`  user ready: ${u.name} <${u.email}>`);
  }

  // 2. classes (as admin)
  await signOut(auth);
  await signInWithEmailAndPassword(auth, USERS.admin.email, PASS);
  const bio = await ensureClass("Intro to Biology", uids.admin);
  const cs = await ensureClass("Data Structures", uids.admin);
  console.log(`  class ready: Intro to Biology (code ${bio.code})`);
  console.log(`  class ready: Data Structures (code ${cs.code})`);

  // 3. everyone joins both classes (self-join as each user)
  for (const key of ["rep", "stu1", "stu2"]) {
    await signOut(auth);
    await signInWithEmailAndPassword(auth, USERS[key].email, PASS);
    for (const cls of [bio, cs]) {
      await joinClass(cls.id, uids[key], USERS[key].name, USERS[key].email);
    }
  }
  console.log("  memberships ready (rep + 2 students in both classes)");

  // 4. assign the rep (as admin): classRepId + member-doc role
  await signOut(auth);
  await signInWithEmailAndPassword(auth, USERS.admin.email, PASS);
  for (const cls of [bio, cs]) {
    await updateDoc(doc(db, "classes", cls.id), { classRepId: uids.rep });
    await updateDoc(doc(db, "classes", cls.id, "members", uids.rep), { role: "classRep" });
  }
  console.log(`  class rep assigned: ${USERS.rep.name} (both classes)`);

  // 5. tasks + announcements (as the rep) — fixed ids make re-runs idempotent
  await signOut(auth);
  await signInWithEmailAndPassword(auth, USERS.rep.email, PASS);

  const seedTask = (cls, slug, data) =>
    ensureDoc(doc(db, "classes", cls.id, "tasks", `demo-${slug}`), {
      createdBy: uids.rep,
      createdAt: serverTimestamp(),
      ...data,
    });
  const seedAnn = (cls, slug, data) =>
    ensureDoc(doc(db, "classes", cls.id, "announcements", `demo-${slug}`), {
      createdBy: uids.rep,
      createdAt: serverTimestamp(),
      ...data,
    });

  await seedTask(bio, "lab-report", {
    title: "Cell Structure Lab Report",
    description: "Write up the microscope lab: methods, results, discussion.",
    dueAt: hours(20), // due soon -> reminder candidate
  });
  await seedTask(bio, "essay-draft", {
    title: "Photosynthesis Essay Draft",
    description: "1,500 words with at least five cited sources.",
    dueAt: hours(5 * 24),
  });
  await seedTask(cs, "problem-set", {
    title: "Binary Trees Problem Set",
    description: "Problems 1-8 from the handout.",
    dueAt: hours(-3 * 24), // overdue -> reminder candidate
  });
  await seedTask(cs, "linked-lists", {
    title: "Linked List Implementation",
    description: "Implement a doubly linked list with unit tests.",
    dueAt: hours(2 * 24),
  });
  console.log("  tasks ready (incl. one due soon, one overdue)");

  await seedAnn(bio, "cat-1", {
    title: "CAT 1 — Cell Biology",
    content: "Covers lectures 1-6. Bring a pencil for the diagram section.",
    category: "cat",
    dueAt: hours(18), // due soon -> reminder candidate
  });
  await seedAnn(cs, "project-deadline", {
    title: "Project proposal deadline",
    content: "Submit your project proposal PDF on the portal.",
    category: "deadline",
    dueAt: hours(3 * 24),
  });
  await seedAnn(bio, "room-change", {
    title: "Lab moved to SCI 204",
    content: "This week only — the usual lab is being serviced.",
    category: "general", // no due date
  });
  console.log("  announcements ready (CAT due soon, deadline, general)");

  // 6. student activity: stu1 completes a task, creates a group
  await signOut(auth);
  await signInWithEmailAndPassword(auth, USERS.stu1.email, PASS);
  await ensureDoc(doc(db, "users", uids.stu1, "completions", "demo-essay-draft"), {
    completedAt: serverTimestamp(),
  });

  const groupRef = doc(db, "groups", "demo-project-team-a");
  await ensureDoc(groupRef, {
    classId: bio.id,
    name: "Project Team A",
    createdBy: uids.stu1,
    createdAt: serverTimestamp(),
  });
  await ensureDoc(doc(groupRef, "groupMembers", uids.stu1), {
    uid: uids.stu1,
    name: USERS.stu1.name,
    email: USERS.stu1.email,
    joinedAt: serverTimestamp(),
  });
  await ensureDoc(doc(groupRef, "tasks", "demo-gt-slides"), {
    title: "Prepare presentation slides",
    description: "10 slides max, cover methodology and findings.",
    dueAt: hours(2 * 24),
    assignedTo: uids.stu2,
    assignedToName: USERS.stu2.name,
    status: "pending",
    createdBy: uids.stu1,
    createdAt: serverTimestamp(),
  });
  await ensureDoc(doc(groupRef, "tasks", "demo-gt-intro"), {
    title: "Draft the introduction",
    description: "One page, cite the two key papers.",
    dueAt: hours(4 * 24),
    assignedTo: uids.stu1,
    assignedToName: USERS.stu1.name,
    status: "completed",
    createdBy: uids.stu1,
    createdAt: serverTimestamp(),
  });

  // stu2 joins the group
  await signOut(auth);
  await signInWithEmailAndPassword(auth, USERS.stu2.email, PASS);
  await ensureDoc(doc(groupRef, "groupMembers", uids.stu2), {
    uid: uids.stu2,
    name: USERS.stu2.name,
    email: USERS.stu2.email,
    joinedAt: serverTimestamp(),
  });
  console.log("  group ready (Project Team A: 2 members, 2 tasks)");

  /* ---------- summary ---------- */
  console.log(`
================ DEMO DATA READY ================
Log in with any of these (password: ${PASS})

  ADMIN      ${USERS.admin.email}
  CLASS REP  ${USERS.rep.email}   (rep of both classes)
  STUDENT    ${USERS.stu1.email}
  STUDENT    ${USERS.stu2.email}

Classes (join codes for testing the join flow):
  Intro to Biology  -> ${bio.code}
  Data Structures   -> ${cs.code}

Reminder-window items (test runRemindersNow after registering a device):
  task "Cell Structure Lab Report"  due in ~20h  -> due_soon
  task "Binary Trees Problem Set"   3 days late  -> overdue
  CAT  "CAT 1 - Cell Biology"       due in ~18h  -> due_soon
=================================================`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Seed failed:", e.code || e.message);
    process.exit(1);
  });

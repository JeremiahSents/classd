/**
 * Fill the LOCAL Firebase emulators with demo data (never the live project):
 *   1) pnpm emulators          (terminal 1, leave it running)
 *   2) pnpm seed:emulator      (terminal 2)
 *
 * RESETS the emulators first, then creates:
 *   - 4 accounts (all email-verified): 1 admin, 1 class rep, 2 students
 *   - 2 classes with fixed join codes, everyone enrolled, rep assigned
 *   - tasks with staggered due dates (one due soon, one overdue -> reminders)
 *   - announcements: CAT due soon, deadline in 3 days, general notice
 *   - a project group with both students + group tasks
 *   - a third class nobody has joined yet (join code 333333) to test joining
 *
 * Writes go around the security rules (it's seeding), so rule changes don't
 * break it.
 */

import { readFileSync } from "node:fs";
import { initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, setDoc, Timestamp } from "firebase/firestore";

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

// must match the project the app and `firebase emulators:start` use
const PROJECT_ID = loadEnv().EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? "classd-f6db8";
const AUTH_URL = "http://127.0.0.1:9099";
const FIRESTORE_URL = "http://127.0.0.1:8080";
// "Bearer owner" is the emulator's admin token
const OWNER = { Authorization: "Bearer owner", "Content-Type": "application/json" };

const PASS = "Demo123!pass";
const USERS = {
  admin: { email: "admin@demo.classd.app", name: "Demo Admin", role: "admin" },
  rep: { email: "rep@demo.classd.app", name: "Ryan Rep", role: "student" },
  stu1: { email: "aisha@demo.classd.app", name: "Aisha Mwangi", role: "student" },
  stu2: { email: "brian@demo.classd.app", name: "Brian Otieno", role: "student" },
};

const now = Timestamp.now();
const hours = (n) => Timestamp.fromMillis(Date.now() + n * 3_600_000);

/* ---------- helpers ---------- */

async function request(url, init) {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`${init?.method ?? "GET"} ${url} -> ${res.status} ${await res.text()}`);
  return res.status === 204 ? null : res.json();
}

/** Wipe the emulators so every seed starts from the same state. */
async function reset() {
  await request(`${AUTH_URL}/emulator/v1/projects/${PROJECT_ID}/accounts`, { method: "DELETE" });
  await request(
    `${FIRESTORE_URL}/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`,
    { method: "DELETE" },
  );
}

/** Create an email-verified Auth user; returns its uid. */
async function createUser(u) {
  const body = { email: u.email, password: PASS, displayName: u.name, emailVerified: true };
  const res = await request(
    `${AUTH_URL}/identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts`,
    { method: "POST", headers: OWNER, body: JSON.stringify(body) },
  );
  return res.localId;
}

/* ---------- the seed ---------- */

async function main() {
  try {
    await reset();
  } catch (e) {
    console.error(
      `Can't reach the emulators (${e.message}).\nStart them first with:  pnpm emulators`,
    );
    process.exit(1);
  }
  console.log(`Seeding the local emulators (project ${PROJECT_ID})\n`);

  const uids = {};
  for (const [key, u] of Object.entries(USERS)) uids[key] = await createUser(u);

  const env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { host: "127.0.0.1", port: 8080 },
  });

  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();

    // profiles
    for (const [key, u] of Object.entries(USERS)) {
      await setDoc(doc(db, "users", uids[key]), {
        name: u.name,
        email: u.email,
        role: u.role,
        avatarUrl: "",
        createdAt: now,
      });
    }

    // classes: two with everyone in them, one empty for testing "join"
    const classes = [
      { id: "demo-bio", name: "Intro to Biology", code: "111111", members: true },
      { id: "demo-cs", name: "Data Structures", code: "222222", members: true },
      { id: "demo-hist", name: "World History", code: "333333", members: false },
    ];
    for (const c of classes) {
      await setDoc(doc(db, "classes", c.id), {
        name: c.name,
        code: c.code,
        coverUrl: `https://picsum.photos/seed/${c.id}/600/400`,
        ownerId: uids.admin,
        ...(c.members ? { classRepId: uids.rep } : {}),
        schedules: [],
        createdAt: now,
      });
      if (!c.members) continue;
      for (const key of ["rep", "stu1", "stu2"]) {
        await setDoc(doc(db, "classes", c.id, "members", uids[key]), {
          uid: uids[key],
          name: USERS[key].name,
          email: USERS[key].email,
          avatarUrl: "",
          role: key === "rep" ? "classRep" : "student",
          joinedAt: now,
        });
      }
    }

    const task = (classId, id, data) =>
      setDoc(doc(db, "classes", classId, "tasks", id), {
        createdBy: uids.rep,
        createdAt: now,
        ...data,
      });
    const announcement = (classId, id, data) =>
      setDoc(doc(db, "classes", classId, "announcements", id), {
        createdBy: uids.rep,
        createdAt: now,
        ...data,
      });

    await task("demo-bio", "lab-report", {
      title: "Cell Structure Lab Report",
      description: "Write up the microscope lab: methods, results, discussion.",
      dueAt: hours(20), // due soon -> reminder candidate
    });
    await task("demo-bio", "essay-draft", {
      title: "Photosynthesis Essay Draft",
      description: "1,500 words with at least five cited sources.",
      dueAt: hours(5 * 24),
    });
    await task("demo-cs", "problem-set", {
      title: "Binary Trees Problem Set",
      description: "Problems 1-8 from the handout.",
      dueAt: hours(-3 * 24), // overdue -> reminder candidate
    });
    await task("demo-cs", "linked-lists", {
      title: "Linked List Implementation",
      description: "Implement a doubly linked list with unit tests.",
      dueAt: hours(2 * 24),
    });

    await announcement("demo-bio", "cat-1", {
      title: "CAT 1 — Cell Biology",
      content: "Covers lectures 1-6. Bring a pencil for the diagram section.",
      category: "cat",
      dueAt: hours(18),
    });
    await announcement("demo-cs", "project-deadline", {
      title: "Project proposal deadline",
      content: "Submit your project proposal PDF on the portal.",
      category: "deadline",
      dueAt: hours(3 * 24),
    });
    await announcement("demo-bio", "room-change", {
      title: "Lab moved to SCI 204",
      content: "This week only — the usual lab is being serviced.",
      category: "general",
    });

    // Aisha has finished one task
    await setDoc(doc(db, "users", uids.stu1, "completions", "essay-draft"), {
      completedAt: now,
    });

    // a project group with both students
    await setDoc(doc(db, "groups", "demo-team-a"), {
      classId: "demo-bio",
      name: "Project Team A",
      createdBy: uids.stu1,
      createdAt: now,
    });
    for (const key of ["stu1", "stu2"]) {
      await setDoc(doc(db, "groups", "demo-team-a", "groupMembers", uids[key]), {
        uid: uids[key],
        name: USERS[key].name,
        email: USERS[key].email,
        joinedAt: now,
      });
    }
    await setDoc(doc(db, "groups", "demo-team-a", "tasks", "slides"), {
      title: "Prepare presentation slides",
      description: "10 slides max, cover methodology and findings.",
      dueAt: hours(2 * 24),
      assignedTo: uids.stu2,
      assignedToName: USERS.stu2.name,
      status: "pending",
      createdBy: uids.stu1,
      createdAt: now,
    });
  });
  await env.cleanup();

  console.log(`================ EMULATOR DATA READY ================
Log in with any of these (password: ${PASS})

  ADMIN      ${USERS.admin.email}
  CLASS REP  ${USERS.rep.email}   (rep of Biology + Data Structures)
  STUDENT    ${USERS.stu1.email}
  STUDENT    ${USERS.stu2.email}

Join codes:  Biology 111111 · Data Structures 222222
             World History 333333 (nobody joined yet — try joining it)

Browse/edit the data: http://localhost:4000
=====================================================`);
}

main().catch((e) => {
  console.error("Seed failed:", e.message);
  process.exit(1);
});

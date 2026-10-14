/**
 * Firestore security-rules tests. Run with the emulator (needs Java):
 *   pnpm test:rules
 *
 * Covers the rules that keep the app safe: no self-promotion to admin, only
 * admins create classes, join codes can't be scraped, and only class
 * managers post content.
 */

import { readFileSync } from "node:fs";
import { after, before, beforeEach, describe, test } from "node:test";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

let env;

const ADMIN = "admin";
const REP = "rep";
const STUDENT = "student";
const OUTSIDER = "outsider";

const db = (uid) => env.authenticatedContext(uid).firestore();

before(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-classd",
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
  });
});

after(async () => {
  await env?.cleanup();
});

// Seed: one class owned by ADMIN, REP as its rep, STUDENT enrolled, OUTSIDER not.
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const fs = ctx.firestore();
    for (const uid of [ADMIN, REP, STUDENT, OUTSIDER]) {
      await setDoc(doc(fs, "users", uid), {
        name: uid,
        email: `${uid}@test.dev`,
        role: uid === ADMIN ? "admin" : "student",
        avatarUrl: "",
      });
    }
    await setDoc(doc(fs, "classes", "c1"), {
      name: "Biology",
      code: "123456",
      ownerId: ADMIN,
      classRepId: REP,
    });
    await setDoc(doc(fs, "classes", "c1", "members", REP), { uid: REP, role: "classRep" });
    await setDoc(doc(fs, "classes", "c1", "members", STUDENT), { uid: STUDENT, role: "student" });
    await setDoc(doc(fs, "classes", "c1", "tasks", "t1"), { title: "Lab report" });
    await setDoc(doc(fs, "groups", "g1"), { classId: "c1", name: "Team A", createdBy: STUDENT });
    await setDoc(doc(fs, "groups", "g1", "groupMembers", STUDENT), { uid: STUDENT });
  });
});

describe("users", () => {
  test("sign-up creates a student profile", async () => {
    await assertSucceeds(
      setDoc(doc(db("new"), "users", "new"), {
        name: "New",
        email: "new@test.dev",
        role: "student",
        avatarUrl: "",
        createdAt: serverTimestamp(),
      }),
    );
  });

  test("sign-up cannot create an admin", async () => {
    await assertFails(
      setDoc(doc(db("new"), "users", "new"), {
        name: "New",
        email: "new@test.dev",
        role: "admin",
        avatarUrl: "",
      }),
    );
  });

  test("a user cannot promote themselves to admin", async () => {
    await assertFails(updateDoc(doc(db(STUDENT), "users", STUDENT), { role: "admin" }));
  });

  test("a user can change their name, avatar and push tokens", async () => {
    await assertSucceeds(
      updateDoc(doc(db(STUDENT), "users", STUDENT), {
        name: "Renamed",
        avatarUrl: "x",
        expoPushTokens: ["t"],
        notificationPrefs: { newPosts: false, reminders: true },
      }),
    );
  });

  test("a user cannot change their email field", async () => {
    await assertFails(updateDoc(doc(db(STUDENT), "users", STUDENT), { email: "x@y.z" }));
  });

  test("a user cannot edit someone else's profile", async () => {
    await assertFails(updateDoc(doc(db(STUDENT), "users", REP), { name: "x" }));
  });

  test("profiles are deleted only by the server", async () => {
    await assertFails(deleteDoc(doc(db(STUDENT), "users", STUDENT)));
  });
});

describe("classes", () => {
  test("only admins create classes", async () => {
    await assertSucceeds(
      setDoc(doc(db(ADMIN), "classes", "c2"), { name: "Chem", code: "654321", ownerId: ADMIN }),
    );
    await assertFails(
      setDoc(doc(db(STUDENT), "classes", "c3"), { name: "Chem", code: "111111", ownerId: STUDENT }),
    );
  });

  test("members read their class; outsiders can't", async () => {
    await assertSucceeds(getDoc(doc(db(STUDENT), "classes", "c1")));
    await assertFails(getDoc(doc(db(OUTSIDER), "classes", "c1")));
  });

  test("students can't list classes (no join-code scraping)", async () => {
    await assertFails(getDocs(collection(db(STUDENT), "classes")));
    await assertSucceeds(getDocs(collection(db(ADMIN), "classes")));
  });

  test("students can't add themselves directly — joining goes through the function", async () => {
    await assertFails(
      setDoc(doc(db(OUTSIDER), "classes", "c1", "members", OUTSIDER), {
        uid: OUTSIDER,
        role: "student",
      }),
    );
  });

  test("a student lists their own memberships (listClasses query)", async () => {
    const fs = db(STUDENT);
    await assertSucceeds(
      getDocs(query(collectionGroup(fs, "members"), where("uid", "==", STUDENT))),
    );
    await assertFails(getDocs(query(collectionGroup(fs, "members"), where("uid", "==", REP))));
  });

  test("members see the class roster; outsiders can't", async () => {
    await assertSucceeds(getDocs(collection(db(STUDENT), "classes", "c1", "members")));
    await assertFails(getDocs(collection(db(OUTSIDER), "classes", "c1", "members")));
  });

  test("a member can leave", async () => {
    await assertSucceeds(deleteDoc(doc(db(STUDENT), "classes", "c1", "members", STUDENT)));
  });

  test("only the owner/admin changes a class (e.g. new join code)", async () => {
    await assertSucceeds(updateDoc(doc(db(ADMIN), "classes", "c1"), { code: "999999" }));
    await assertFails(updateDoc(doc(db(REP), "classes", "c1"), { code: "999999" }));
  });
});

describe("class content", () => {
  test("the rep posts tasks, announcements and materials; students can't", async () => {
    for (const sub of ["tasks", "announcements", "materials"]) {
      await assertSucceeds(setDoc(doc(db(REP), "classes", "c1", sub, "new"), { title: "x" }));
      await assertFails(setDoc(doc(db(STUDENT), "classes", "c1", sub, "new2"), { title: "x" }));
    }
  });

  test("members read tasks; outsiders can't", async () => {
    await assertSucceeds(getDocs(collection(db(STUDENT), "classes", "c1", "tasks")));
    await assertFails(getDocs(collection(db(OUTSIDER), "classes", "c1", "tasks")));
  });
});

describe("groups", () => {
  test("class members create groups; outsiders can't", async () => {
    await assertSucceeds(
      setDoc(doc(db(REP), "groups", "g2"), { classId: "c1", name: "B", createdBy: REP }),
    );
    await assertFails(
      setDoc(doc(db(OUTSIDER), "groups", "g3"), { classId: "c1", name: "C", createdBy: OUTSIDER }),
    );
  });

  test("outsiders can't join a group in a class they're not in", async () => {
    await assertFails(
      setDoc(doc(db(OUTSIDER), "groups", "g1", "groupMembers", OUTSIDER), { uid: OUTSIDER }),
    );
    await assertSucceeds(
      setDoc(doc(db(REP), "groups", "g1", "groupMembers", REP), { uid: REP }),
    );
  });

  test("only the creator renames or deletes a group", async () => {
    await assertFails(updateDoc(doc(db(REP), "groups", "g1"), { name: "Hijacked" }));
    await assertSucceeds(updateDoc(doc(db(STUDENT), "groups", "g1"), { name: "Team B" }));
    await assertFails(updateDoc(doc(db(STUDENT), "groups", "g1"), { classId: "other" }));
    await assertSucceeds(deleteDoc(doc(db(STUDENT), "groups", "g1")));
  });
});

describe("server-only collections", () => {
  test("clients can't touch reminder markers or join attempts", async () => {
    await assertFails(getDoc(doc(db(STUDENT), "sentNotifications", "x")));
    await assertFails(setDoc(doc(db(STUDENT), "joinAttempts", STUDENT), { failures: 0 }));
  });
});

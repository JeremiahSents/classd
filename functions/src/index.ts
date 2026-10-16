/**
 * Classd Cloud Functions — deadline & overdue push notifications.
 *
 * `deadlineReminders` runs hourly: it scans every class's tasks (assignments)
 * AND announcements that carry a due date (CATs, deadlines), finds enrolled
 * students to remind — skipping students who already completed a task — and
 * sends them Expo push notifications. `sentNotifications` markers prevent
 * duplicate sends.
 *
 * Requires the Blaze plan (scheduled functions + outbound network to Expo).
 */

import { setGlobalOptions } from "firebase-functions";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { HttpsError, onCall, onRequest } from "firebase-functions/v2/https";
import { onDocumentCreated, onDocumentDeleted } from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import {
  getFirestore,
  Timestamp,
  FieldValue,
  type DocumentReference,
} from "firebase-admin/firestore";

setGlobalOptions({ maxInstances: 10 });
initializeApp();
const db = getFirestore();

const HOUR = 60 * 60 * 1000;
const DUE_SOON_WINDOW = 24 * HOUR; // remind when due within 24h
const OVERDUE_GRACE = 24 * HOUR; // "overdue for a while" = at least 24h past due
const OVERDUE_MAX = 14 * 24 * HOUR; // stop nagging after two weeks

type ReminderType = "due_soon" | "overdue";
/** What kind of document the reminder is about. */
type ReminderKind = "task" | "announcement";

interface ExpoMessage {
  to: string;
  title: string;
  body: string;
  data: Record<string, string>;
}

interface Candidate {
  kind: ReminderKind;
  docId: string;
  classRef: DocumentReference;
  title: string;
  /** Announcement category (cat/deadline/general), when kind is announcement. */
  category?: string;
  type: ReminderType;
}

/**
 * Whether a user wants this kind of notification. Both are on unless the user
 * switched them off in Settings (users/{uid}.notificationPrefs).
 */
function wantsNotification(
  userSnap: FirebaseFirestore.DocumentSnapshot,
  kind: "newPosts" | "reminders",
): boolean {
  return userSnap.get(`notificationPrefs.${kind}`) !== false;
}

/** POST messages to Expo's push service in batches of 100. */
async function sendExpoPush(messages: ExpoMessage[]): Promise<void> {
  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages.slice(i, i + 100);
    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(chunk),
    });
    if (!res.ok) {
      logger.error("Expo push request failed", {
        status: res.status,
        body: await res.text(),
      });
    }
  }
}

function messageFor(c: Candidate): { title: string; body: string } {
  if (c.kind === "announcement") {
    const noun = c.category === "cat" ? "CAT" : "Deadline";
    return c.type === "due_soon"
      ? { title: `${noun} approaching`, body: `"${c.title}" is coming up soon.` }
      : { title: `${noun} passed`, body: `"${c.title}" is past its date.` };
  }
  return c.type === "due_soon"
    ? { title: "Assignment due soon", body: `"${c.title}" is due soon.` }
    : { title: "Overdue assignment", body: `"${c.title}" is overdue.` };
}

/** Query a collection group for docs whose dueAt falls in a window. */
async function dueInWindow(
  group: "tasks" | "announcements",
  fromMs: number,
  toMs: number,
) {
  return db
    .collectionGroup(group)
    .where("dueAt", ">", Timestamp.fromMillis(fromMs))
    .where("dueAt", "<=", Timestamp.fromMillis(toMs))
    .get();
}

/** Scan tasks + dated announcements, notify, and mark reminders sent. */
async function processReminders(): Promise<{ candidates: number; sent: number }> {
  const now = Date.now();

  // tasks (assignments)
  const tasksDueSoon = await dueInWindow("tasks", now, now + DUE_SOON_WINDOW);
  const tasksOverdue = await dueInWindow("tasks", now - OVERDUE_MAX, now - OVERDUE_GRACE);
  // announcements that carry a due date (CATs, deadlines) — docs without
  // dueAt aren't in the index, so they're skipped automatically
  const annsDueSoon = await dueInWindow("announcements", now, now + DUE_SOON_WINDOW);
  const annsOverdue = await dueInWindow("announcements", now - OVERDUE_MAX, now - OVERDUE_GRACE);

  const candidates: Candidate[] = [];
  const collect = (
    docs: FirebaseFirestore.QueryDocumentSnapshot[],
    kind: ReminderKind,
    type: ReminderType,
  ) => {
    for (const d of docs) {
      const classRef = d.ref.parent.parent;
      if (!classRef) continue;
      candidates.push({
        kind,
        docId: d.id,
        classRef,
        title: d.get("title") ?? (kind === "task" ? "A task" : "An announcement"),
        ...(kind === "announcement" ? { category: d.get("category") ?? "general" } : {}),
        type,
      });
    }
  };
  collect(tasksDueSoon.docs, "task", "due_soon");
  collect(tasksOverdue.docs, "task", "overdue");
  collect(annsDueSoon.docs, "announcement", "due_soon");
  collect(annsOverdue.docs, "announcement", "overdue");

  const messages: ExpoMessage[] = [];
  const markSent: DocumentReference[] = [];

  for (const c of candidates) {
    const members = await c.classRef.collection("members").get();
    for (const member of members.docs) {
      const uid = member.id;

      // tasks only: skip students who already completed the assignment
      if (c.kind === "task") {
        const completion = await db.doc(`users/${uid}/completions/${c.docId}`).get();
        if (completion.exists) continue;
      }

      // skip if we already sent this exact reminder (task markers keep the
      // legacy id format; announcements are prefixed to avoid collisions)
      const markerId =
        c.kind === "task"
          ? `${c.docId}_${uid}_${c.type}`
          : `ann-${c.docId}_${uid}_${c.type}`;
      const logRef = db.doc(`sentNotifications/${markerId}`);
      if ((await logRef.get()).exists) continue;

      // need at least one device token, and reminders switched on
      const userSnap = await db.doc(`users/${uid}`).get();
      if (!wantsNotification(userSnap, "reminders")) continue;
      const tokens: string[] = userSnap.get("expoPushTokens") ?? [];
      if (tokens.length === 0) continue;

      const { title, body } = messageFor(c);
      for (const token of tokens) {
        messages.push({
          to: token,
          title,
          body,
          data: {
            kind: c.kind,
            docId: c.docId,
            classId: c.classRef.id,
            type: c.type,
          },
        });
      }
      markSent.push(logRef);
    }
  }

  if (messages.length > 0) {
    await sendExpoPush(messages);
    // only mark sent after a send attempt, so failures retry on the next run
    await Promise.all(markSent.map((ref) => ref.set({ sentAt: FieldValue.serverTimestamp() })));
  }

  logger.info("Reminder scan complete", {
    candidates: candidates.length,
    notifications: messages.length,
  });
  return { candidates: candidates.length, sent: messages.length };
}

/** Hourly scheduled scan. */
export const deadlineReminders = onSchedule("every 60 minutes", async () => {
  await processReminders();
});

/**
 * Manual trigger for testing. Guarded by REMINDER_SECRET (set in functions/.env).
 *   GET https://<region>-<project>.cloudfunctions.net/runRemindersNow?secret=...
 * Secure or remove once you no longer need on-demand runs.
 */
export const runRemindersNow = onRequest(async (req, res) => {
  if (!process.env.REMINDER_SECRET || req.query.secret !== process.env.REMINDER_SECRET) {
    res.status(403).send("forbidden");
    return;
  }
  const result = await processReminders();
  res.json({ ok: true, ...result });
});

/* ------------------------------------------------------------------ *
 * New-post notifications: push every enrolled student when a class rep
 * posts a new task or announcement (functional requirement ix).
 * ------------------------------------------------------------------ */

async function notifyClassMembers(
  classId: string,
  title: string,
  body: string,
  data: Record<string, string>,
): Promise<void> {
  const members = await db.collection("classes").doc(classId).collection("members").get();
  const messages: ExpoMessage[] = [];
  for (const member of members.docs) {
    const userSnap = await db.doc(`users/${member.id}`).get();
    if (!wantsNotification(userSnap, "newPosts")) continue;
    const tokens: string[] = userSnap.get("expoPushTokens") ?? [];
    for (const token of tokens) {
      messages.push({ to: token, title, body, data });
    }
  }
  if (messages.length > 0) await sendExpoPush(messages);
}

export const onTaskPosted = onDocumentCreated(
  "classes/{classId}/tasks/{taskId}",
  async (event) => {
    const task = event.data?.data();
    if (!task) return;
    await notifyClassMembers(
      event.params.classId,
      "New task posted",
      String(task.title ?? "A new task"),
      { classId: event.params.classId, taskId: event.params.taskId, type: "new_task" },
    );
  },
);

export const onAnnouncementPosted = onDocumentCreated(
  "classes/{classId}/announcements/{announcementId}",
  async (event) => {
    const announcement = event.data?.data();
    if (!announcement) return;
    await notifyClassMembers(
      event.params.classId,
      "New announcement",
      String(announcement.title ?? "A new announcement"),
      {
        classId: event.params.classId,
        announcementId: event.params.announcementId,
        type: "new_announcement",
      },
    );
  },
);

/* ------------------------------------------------------------------ *
 * Join a class by code. Runs server-side so students never need read
 * access to the classes collection — join codes can't be scraped.
 * ------------------------------------------------------------------ */

const JOIN_WINDOW = HOUR;
const MAX_FAILED_JOINS = 10; // wrong codes allowed per user per hour

export const joinClass = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Please sign in again.");

  const code = String(request.data?.code ?? "").trim();
  if (!/^\d{6}$/.test(code)) {
    throw new HttpsError("invalid-argument", "Enter the 6-digit class code.");
  }

  // rate limit wrong guesses so codes can't be brute-forced
  const attemptsRef = db.doc(`joinAttempts/${uid}`);
  const attempts = await attemptsRef.get();
  const windowStart: number = attempts.get("windowStart") ?? 0;
  const failures: number =
    Date.now() - windowStart < JOIN_WINDOW ? attempts.get("failures") ?? 0 : 0;
  if (failures >= MAX_FAILED_JOINS) {
    throw new HttpsError(
      "resource-exhausted",
      "Too many wrong codes. Please try again in an hour.",
    );
  }

  const found = await db.collection("classes").where("code", "==", code).limit(1).get();
  if (found.empty) {
    await attemptsRef.set({
      windowStart: failures === 0 ? Date.now() : windowStart,
      failures: failures + 1,
    });
    throw new HttpsError("not-found", "No class with that code");
  }

  const classDoc = found.docs[0];
  const memberRef = classDoc.ref.collection("members").doc(uid);
  // re-entering the code must not demote an existing class rep
  if (!(await memberRef.get()).exists) {
    const user = await db.doc(`users/${uid}`).get();
    await memberRef.set({
      uid,
      name: user.get("name") ?? "",
      email: user.get("email") ?? "",
      avatarUrl: user.get("avatarUrl") ?? "",
      // everyone joins as a regular student; an admin promotes to classRep later
      role: "student",
      joinedAt: FieldValue.serverTimestamp(),
    });
  }
  return { classId: classDoc.id };
});

/* ------------------------------------------------------------------ *
 * Cleanup triggers. Clients only delete the top-level doc; these remove
 * everything hanging off it so nothing is orphaned.
 * ------------------------------------------------------------------ */

/** Delete every group in a class, with its members and tasks. */
async function deleteGroupsInClass(classId: string): Promise<void> {
  const groups = await db.collection("groups").where("classId", "==", classId).get();
  await Promise.all(groups.docs.map((g) => db.recursiveDelete(g.ref)));
}

// A class was deleted: remove its members, tasks, announcements and project
// groups.
export const onClassDeleted = onDocumentDeleted("classes/{classId}", async (event) => {
  const classId = event.params.classId;
  await db.recursiveDelete(db.collection("classes").doc(classId));
  await deleteGroupsInClass(classId);
});

// A group was deleted: remove its members and tasks.
export const onGroupDeleted = onDocumentDeleted("groups/{groupId}", async (event) => {
  await db.recursiveDelete(db.collection("groups").doc(event.params.groupId));
});

// Someone left (or was removed from) a class: if they were its rep, clear the
// rep slot so they lose manage rights, and take them out of the class's groups.
export const onMemberRemoved = onDocumentDeleted(
  "classes/{classId}/members/{uid}",
  async (event) => {
    const { classId, uid } = event.params;
    const classRef = db.collection("classes").doc(classId);
    const classSnap = await classRef.get();
    if (!classSnap.exists) return; // whole class deleted — onClassDeleted handles it
    if (classSnap.get("classRepId") === uid) {
      await classRef.update({ classRepId: FieldValue.delete() });
    }
    const groups = await db.collection("groups").where("classId", "==", classId).get();
    await Promise.all(
      groups.docs.map((g) => g.ref.collection("groupMembers").doc(uid).delete()),
    );
  },
);

/* ------------------------------------------------------------------ *
 * Account deletion (required by the App Store and Google Play). The app
 * re-checks the password first; this removes the user's data and their
 * Auth account. Classes and groups they created stay for everyone else.
 * ------------------------------------------------------------------ */

export const deleteAccount = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Please sign in again.");

  // leave every class (onMemberRemoved clears rep slots and class groups)
  const memberships = await db.collectionGroup("members").where("uid", "==", uid).get();
  await Promise.all(memberships.docs.map((d) => d.ref.delete()));

  // leave any remaining project groups
  const groupMemberships = await db
    .collectionGroup("groupMembers")
    .where("uid", "==", uid)
    .get();
  await Promise.all(groupMemberships.docs.map((d) => d.ref.delete()));

  // profile, push tokens and task completions
  await db.recursiveDelete(db.doc(`users/${uid}`));
  await db.doc(`joinAttempts/${uid}`).delete();

  await getAuth().deleteUser(uid);
  logger.info("Account deleted", { uid });
  return { ok: true };
});

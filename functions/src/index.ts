/**
 * Classd Cloud Functions — deadline & overdue push notifications.
 *
 * `deadlineReminders` runs hourly: it scans every class's tasks, finds students
 * who are enrolled, haven't completed the task, and whose deadline is either
 * approaching or overdue, then sends them an Expo push notification. A
 * `sentNotifications/{taskId}_{uid}_{type}` marker prevents duplicate sends.
 *
 * Requires the Blaze plan (scheduled functions + outbound network to Expo).
 */

import { setGlobalOptions } from "firebase-functions";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { initializeApp } from "firebase-admin/app";
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

interface ExpoMessage {
  to: string;
  title: string;
  body: string;
  data: Record<string, string>;
}

interface Candidate {
  taskId: string;
  classRef: DocumentReference;
  title: string;
  type: ReminderType;
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

function messageFor(type: ReminderType, title: string): { title: string; body: string } {
  return type === "due_soon"
    ? { title: "Deadline approaching", body: `"${title}" is due soon.` }
    : { title: "Overdue task", body: `"${title}" is overdue.` };
}

/** Scan tasks, work out who to notify, send pushes, and mark them sent. */
async function processReminders(): Promise<{ candidates: number; sent: number }> {
  const now = Date.now();

  const dueSoon = await db
    .collectionGroup("tasks")
    .where("dueAt", ">", Timestamp.fromMillis(now))
    .where("dueAt", "<=", Timestamp.fromMillis(now + DUE_SOON_WINDOW))
    .get();

  const overdue = await db
    .collectionGroup("tasks")
    .where("dueAt", ">=", Timestamp.fromMillis(now - OVERDUE_MAX))
    .where("dueAt", "<", Timestamp.fromMillis(now - OVERDUE_GRACE))
    .get();

  const candidates: Candidate[] = [];
  for (const d of dueSoon.docs) {
    const classRef = d.ref.parent.parent;
    if (classRef) {
      candidates.push({ taskId: d.id, classRef, title: d.get("title") ?? "A task", type: "due_soon" });
    }
  }
  for (const d of overdue.docs) {
    const classRef = d.ref.parent.parent;
    if (classRef) {
      candidates.push({ taskId: d.id, classRef, title: d.get("title") ?? "A task", type: "overdue" });
    }
  }

  const messages: ExpoMessage[] = [];
  const markSent: DocumentReference[] = [];

  for (const c of candidates) {
    const members = await c.classRef.collection("members").get();
    for (const member of members.docs) {
      const uid = member.id;

      // skip if the student already completed the task
      const completion = await db.doc(`users/${uid}/completions/${c.taskId}`).get();
      if (completion.exists) continue;

      // skip if we already sent this exact reminder
      const logRef = db.doc(`sentNotifications/${c.taskId}_${uid}_${c.type}`);
      if ((await logRef.get()).exists) continue;

      // need at least one device token
      const userSnap = await db.doc(`users/${uid}`).get();
      const tokens: string[] = userSnap.get("expoPushTokens") ?? [];
      if (tokens.length === 0) continue;

      const { title, body } = messageFor(c.type, c.title);
      for (const token of tokens) {
        messages.push({
          to: token,
          title,
          body,
          data: { taskId: c.taskId, classId: c.classRef.id, type: c.type },
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

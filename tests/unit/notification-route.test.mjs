// Unit tests for lib/notification-route.ts — where tapping a push lands.
import assert from "node:assert/strict";
import { test } from "node:test";
import { routeForNotification } from "../../lib/notification-route.ts";

const task = (id) => ({ pathname: "/(tabs)/task/[id]", params: { id } });
const cls = (id) => ({ pathname: "/(tabs)/class/[id]", params: { id } });
const group = (id) => ({ pathname: "/(tabs)/group/[id]", params: { id } });

test("new-task push opens the task", () => {
  assert.deepEqual(
    routeForNotification({ classId: "c1", taskId: "t1", type: "new_task" }),
    task("t1"),
  );
});

test("task reminder (kind + docId) opens the task", () => {
  assert.deepEqual(
    routeForNotification({ kind: "task", docId: "t2", classId: "c1", type: "due_soon" }),
    task("t2"),
  );
});

test("announcement reminder opens its class, not a task", () => {
  assert.deepEqual(
    routeForNotification({ kind: "announcement", docId: "a1", classId: "c1", type: "overdue" }),
    cls("c1"),
  );
});

test("announcement posts open their class", () => {
  assert.deepEqual(routeForNotification({ classId: "c1", announcementId: "a1" }), cls("c1"));
});

test("group-task push opens the group", () => {
  assert.deepEqual(
    routeForNotification({ groupId: "g1", groupTaskId: "gt1", type: "new_group_task" }),
    group("g1"),
  );
});

test("unknown payloads are ignored", () => {
  assert.equal(routeForNotification(undefined), null);
  assert.equal(routeForNotification({}), null);
  assert.equal(routeForNotification({ classId: "" }), null);
});

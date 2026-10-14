// Unit tests for the label helpers in lib/format.ts. Run: pnpm test
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { dueLabel, formatSize, relativeTime } from "../../lib/format.ts";

const NOW = Date.parse("2026-06-15T12:00:00.000Z");
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const iso = (offsetMs) => new Date(NOW + offsetMs).toISOString();

describe("relativeTime", () => {
  test("recent times", () => {
    assert.equal(relativeTime(iso(-10_000), NOW), "Just now");
    assert.equal(relativeTime(iso(-5 * MIN), NOW), "5m ago");
    assert.equal(relativeTime(iso(-3 * HOUR), NOW), "3h ago");
    assert.equal(relativeTime(iso(-2 * DAY), NOW), "2d ago");
  });

  test("older than a week falls back to a date", () => {
    const old = iso(-10 * DAY);
    assert.equal(relativeTime(old, NOW), new Date(old).toLocaleDateString());
  });
});

describe("dueLabel", () => {
  test("upcoming", () => {
    assert.equal(dueLabel(iso(2 * HOUR), NOW), "Due today");
    assert.equal(dueLabel(iso(DAY + HOUR), NOW), "Due tomorrow");
    assert.equal(dueLabel(iso(3 * DAY + HOUR), NOW), "Due in 3 days");
  });

  test("far future shows the date", () => {
    const later = iso(30 * DAY);
    assert.equal(dueLabel(later, NOW), `Due ${new Date(later).toLocaleDateString()}`);
  });

  test("overdue", () => {
    assert.equal(dueLabel(iso(-HOUR), NOW), "Overdue");
    assert.equal(dueLabel(iso(-2 * DAY - HOUR), NOW), "Overdue by 2d");
  });
});

describe("formatSize", () => {
  test("bytes, KB and MB", () => {
    assert.equal(formatSize(undefined), undefined);
    assert.equal(formatSize(0), "0 B");
    assert.equal(formatSize(512), "512 B");
    assert.equal(formatSize(14 * 1024), "14 KB");
    assert.equal(formatSize(2.4 * 1024 * 1024), "2.4 MB");
  });
});

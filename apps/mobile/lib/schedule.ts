import type { Unit } from "@/lib/types";

/** A unit that has a known weekly time slot. */
export interface ScheduledUnit extends Unit {
  day: number;
  startMinutes: number;
  endMinutes: number;
}

export function hasSchedule(unit: Unit): unit is ScheduledUnit {
  return (
    typeof unit.day === "number" &&
    typeof unit.startMinutes === "number" &&
    typeof unit.endMinutes === "number"
  );
}

export function minutesSinceMidnight(now = new Date()): number {
  return now.getHours() * 60 + now.getMinutes();
}

/** Units that meet on the given day, sorted by start time. */
export function unitsToday(units: Unit[], now = new Date()): ScheduledUnit[] {
  const day = now.getDay();
  return units
    .filter(hasSchedule)
    .filter((unit) => unit.day === day)
    .sort((a, b) => a.startMinutes - b.startMinutes);
}

/** "8:00 AM" from minutes-since-midnight. */
export function formatTime(minutes: number): string {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const period = hour < 12 ? "AM" : "PM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${minute.toString().padStart(2, "0")} ${period}`;
}

/** "1h 12m" / "45m" from a duration in minutes. */
export function formatDuration(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  if (m < 60) return `${m}m`;
  const hours = Math.floor(m / 60);
  const rem = m % 60;
  return rem === 0 ? `${hours}h` : `${hours}h ${rem}m`;
}

export interface NowState {
  /** The class happening right now, if any. */
  live?: ScheduledUnit;
  /** The next class later today, if any. */
  next?: ScheduledUnit;
  /** 0..1 progress through the live class. */
  progress: number;
  /** Minutes left in the live class, or until the next one starts. */
  minutesRemaining: number;
  /** How many classes meet today. */
  todayCount: number;
}

/** Where the day stands right now: live class, next class, and progress. */
export function nowState(units: Unit[], now = new Date()): NowState {
  const today = unitsToday(units, now);
  const mins = minutesSinceMidnight(now);
  const live = today.find((u) => mins >= u.startMinutes && mins < u.endMinutes);
  const next = today.find((u) => u.startMinutes > mins);

  if (live) {
    const span = live.endMinutes - live.startMinutes;
    return {
      live,
      next,
      progress: span > 0 ? (mins - live.startMinutes) / span : 0,
      minutesRemaining: live.endMinutes - mins,
      todayCount: today.length,
    };
  }

  return {
    next,
    progress: 0,
    minutesRemaining: next ? next.startMinutes - mins : 0,
    todayCount: today.length,
  };
}

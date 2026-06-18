import type { Classroom, ClassScheduleBlock } from "./classes";

export function formatTime(minutesFromMidnight: number): string {
  const h = Math.floor(minutesFromMidnight / 60);
  const m = minutesFromMidnight % 60;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  const mStr = m.toString().padStart(2, "0");
  return `${h12}:${mStr} ${period}`;
}

export interface TodayClass {
  classroom: Classroom;
  block: ClassScheduleBlock;
}

/**
 * Returns all class schedule blocks occurring today, sorted by start time.
 */
export function classesToday(classes: Classroom[]): TodayClass[] {
  const todayDay = new Date().getDay(); // 0 = Sun, 6 = Sat
  const results: TodayClass[] = [];

  for (const c of classes) {
    if (!c.schedules) continue;
    for (const block of c.schedules) {
      if (block.day === todayDay) {
        results.push({ classroom: c, block });
      }
    }
  }

  return results.sort((a, b) => a.block.startMinutes - b.block.startMinutes);
}

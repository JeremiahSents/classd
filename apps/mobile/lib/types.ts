export type TaskType = "assignment" | "cat" | "deadline";

/** A unit (course) inside a class. Tasks/announcements live under a unit. */
export interface Unit {
  id: string;
  classId: string;
  name: string;
  code: string;
}

/** A user enrolled in a class. */
export interface Member {
  id: string;
  name: string;
  email: string;
}

export interface Task {
  id: string;
  unitId: string;
  title: string;
  description: string;
  type: TaskType;
  /** Human-readable due label for now (e.g. "Due tomorrow"). */
  dueLabel: string;
}

export interface Announcement {
  id: string;
  unitId: string;
  title: string;
  content: string;
  /** Human-readable relative time for now (e.g. "2h ago"). */
  timeLabel: string;
}

export const TASK_TYPE_LABEL: Record<TaskType, string> = {
  assignment: "Assignment",
  cat: "CAT",
  deadline: "Deadline",
};

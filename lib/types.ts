export type TaskType = "assignment" | "cat" | "deadline";

/** A user enrolled in a class. */
export interface Member {
  id: string;
  name: string;
  email: string;
}

export interface Task {
  id: string;
  classId: string;
  title: string;
  description: string;
  type: TaskType;
  /** Human-readable due label for now (e.g. "Due tomorrow"). */
  dueLabel: string;
}

export interface Announcement {
  id: string;
  classId: string;
  title: string;
  content: string;
  /** Human-readable relative time for now (e.g. "2h ago"). */
  timeLabel: string;
}

/** A file/resource attached to a class. */
export interface Material {
  id: string;
  classId: string;
  name: string;
  /** Human-readable size, e.g. "2.4 MB". */
  sizeLabel?: string;
  mimeType?: string;
  /** Local uri from the picker; no cloud upload yet. */
  uri?: string;
  /** Human-readable added time, e.g. "Just now" / "2 days ago". */
  addedLabel: string;
}

export const TASK_TYPE_LABEL: Record<TaskType, string> = {
  assignment: "Assignment",
  cat: "CAT",
  deadline: "Deadline",
};

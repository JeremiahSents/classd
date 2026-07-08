/** Announcements are tagged: general notice, a CAT sitting, or a deadline. */
export type AnnouncementCategory = "general" | "cat" | "deadline";

/** A user enrolled in a class. */
export interface Member {
  id: string;
  name: string;
  email: string;
  /** Role within the class this membership belongs to. */
  role?: "classRep" | "student";
}

/** A task is an assignment — actionable work a student marks complete. */
export interface Task {
  id: string;
  classId: string;
  title: string;
  description: string;
  /** Human-readable due label for now (e.g. "Due tomorrow"). */
  dueLabel: string;
  /** Raw ISO due date — used when editing a task. */
  dueAt: string;
  /** User id of the task creator, used to allow editing personal tasks. */
  createdBy: string;
}

export interface Announcement {
  id: string;
  classId: string;
  title: string;
  content: string;
  category: AnnouncementCategory;
  /** Human-readable relative time for now (e.g. "2h ago"). */
  timeLabel: string;
  /** Raw ISO creation time — used to tell recent posts from stale ones. */
  createdAt: string;
  /** Human-readable due label, when the announcement has a due date. */
  dueLabel?: string;
  /** Raw ISO due date — used when editing. */
  dueAt?: string;
}

/** A task inside a project group, shaped for the dashboard. */
export interface GroupTaskItem {
  id: string;
  groupId: string;
  groupName: string;
  /** The class the group belongs to, so the user knows which unit it's for. */
  classId: string;
  className: string;
  title: string;
  description: string;
  dueLabel: string;
  assignedToName: string;
  completed: boolean;
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

export const ANNOUNCEMENT_CATEGORY_LABEL: Record<AnnouncementCategory, string> = {
  general: "General",
  cat: "CAT",
  deadline: "Deadline",
};

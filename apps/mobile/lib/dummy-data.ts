import { coverUrlFor, type Classroom } from "@/lib/classes";

export interface Assignment {
  id: string;
  title: string;
  className: string;
  dueLabel: string;
}

export interface Announcement {
  id: string;
  title: string;
  className: string;
  timeLabel: string;
}

export const seedClasses: Classroom[] = [
  { id: "bio101", name: "Intro to Biology", code: "428193", coverUrl: coverUrlFor("bio101") },
  { id: "cs204", name: "Data Structures", code: "771204", coverUrl: coverUrlFor("cs204") },
  { id: "hist110", name: "World History", code: "560338", coverUrl: coverUrlFor("hist110") },
  { id: "math150", name: "Calculus I", code: "903517", coverUrl: coverUrlFor("math150") },
];

export const seedAssignments: Assignment[] = [
  { id: "a1", title: "Cell Structure Lab Report", className: "Intro to Biology", dueLabel: "Due tomorrow" },
  { id: "a2", title: "Binary Trees Problem Set", className: "Data Structures", dueLabel: "Due in 3 days" },
  { id: "a3", title: "Essay: The Industrial Revolution", className: "World History", dueLabel: "Due next week" },
];

export const seedAnnouncements: Announcement[] = [
  { id: "n1", title: "Midterm moved to Friday", className: "Calculus I", timeLabel: "2h ago" },
  { id: "n2", title: "Guest lecture this Thursday", className: "Data Structures", timeLabel: "Yesterday" },
  { id: "n3", title: "Lab safety briefing recap", className: "Intro to Biology", timeLabel: "2 days ago" },
];

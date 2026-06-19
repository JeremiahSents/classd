import { coverUrlFor, type Classroom } from "@/lib/classes";
import type { Announcement, Material, Member, Task } from "@/lib/types";

export const seedClasses: Classroom[] = [
  {
    id: "bio101",
    name: "Intro to Biology",
    code: "428193",
    coverUrl: coverUrlFor("bio101"),
    classRepId: "m2",
    schedules: [
      { location: "SCI Lab 1", day: 4, startMinutes: 8 * 60, endMinutes: 10 * 60 },
      { location: "SCI 204", day: 4, startMinutes: 10 * 60 + 30, endMinutes: 12 * 60 },
    ],
  },
  {
    id: "cs204",
    name: "Data Structures",
    code: "771204",
    coverUrl: coverUrlFor("cs204"),
    classRepId: "m5",
    schedules: [
      { location: "Tech 3.1", day: 4, startMinutes: 13 * 60, endMinutes: 15 * 60 },
      { location: "Tech 3.4", day: 4, startMinutes: 15 * 60 + 30, endMinutes: 17 * 60 },
    ],
  },
  {
    id: "hist110",
    name: "World History",
    code: "560338",
    coverUrl: coverUrlFor("hist110"),
    schedules: [
      { location: "Hum 2.1", day: 3, startMinutes: 11 * 60, endMinutes: 13 * 60 },
    ],
  },
  {
    id: "math150",
    name: "Calculus I",
    code: "903517",
    coverUrl: coverUrlFor("math150"),
    schedules: [
      { location: "Math 1.0", day: 5, startMinutes: 9 * 60, endMinutes: 11 * 60 },
    ],
  },
];

export const seedMembers: Record<string, Member[]> = {
  bio101: [
    { id: "m1", name: "Aisha Mwangi", email: "aisha.mwangi@strathmore.edu" },
    { id: "m2", name: "Brian Otieno", email: "brian.otieno@strathmore.edu" },
    { id: "m3", name: "Cynthia Wambui", email: "cynthia.wambui@strathmore.edu" },
    { id: "m4", name: "David Kimani", email: "david.kimani@strathmore.edu" },
  ],
  cs204: [
    { id: "m5", name: "Esther Njeri", email: "esther.njeri@strathmore.edu" },
    { id: "m6", name: "Felix Mutua", email: "felix.mutua@strathmore.edu" },
    { id: "m7", name: "Grace Achieng", email: "grace.achieng@strathmore.edu" },
  ],
  hist110: [
    { id: "m8", name: "Henry Kibet", email: "henry.kibet@strathmore.edu" },
    { id: "m9", name: "Irene Wanjiru", email: "irene.wanjiru@strathmore.edu" },
  ],
  math150: [
    { id: "m10", name: "James Omondi", email: "james.omondi@strathmore.edu" },
  ],
};

export const seedTasks: Task[] = [
  { id: "t1", classId: "bio101", title: "Cell Structure Lab Report", description: "Submit your write-up on the microscope lab.", type: "assignment", dueLabel: "Due tomorrow" },
  { id: "t2", classId: "bio101", title: "Genetics CAT 1", description: "In-class test covering Mendelian inheritance.", type: "cat", dueLabel: "Due in 3 days" },
  { id: "t3", classId: "cs204", title: "Binary Trees Problem Set", description: "Problems 1-8 from the handout.", type: "assignment", dueLabel: "Due in 3 days" },
  { id: "t4", classId: "cs204", title: "Sorting Algorithms Deadline", description: "Final commit for the sorting project.", type: "deadline", dueLabel: "Due next week" },
  { id: "t5", classId: "hist110", title: "Essay: The Industrial Revolution", description: "1500 words, cite at least 5 sources.", type: "assignment", dueLabel: "Due next week" },
];

export const seedMaterials: Material[] = [
  { id: "mat1", classId: "bio101", name: "Lecture 3 - Cell Membrane.pdf", sizeLabel: "2.4 MB", mimeType: "application/pdf", addedLabel: "2 days ago" },
  { id: "mat2", classId: "bio101", name: "Lab Manual.docx", sizeLabel: "840 KB", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", addedLabel: "1 week ago" },
  { id: "mat3", classId: "cs204", name: "Tree Traversal Diagrams.png", sizeLabel: "1.1 MB", mimeType: "image/png", addedLabel: "Yesterday" },
];

export const seedAnnouncements: Announcement[] = [
  { id: "n1", classId: "math150", title: "Midterm moved to Friday", content: "The midterm has been rescheduled to this Friday at 9am.", timeLabel: "2h ago" },
  { id: "n2", classId: "cs204", title: "Guest lecture this Thursday", content: "We have an industry guest speaker on graph databases.", timeLabel: "Yesterday" },
  { id: "n3", classId: "bio101", title: "Lab safety briefing recap", content: "Reminder to review the lab safety slides before next session.", timeLabel: "2 days ago" },
];

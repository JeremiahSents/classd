import { coverUrlFor, type Classroom } from "@/lib/classes";
import type { Announcement, Member, Task, Unit } from "@/lib/types";

export const seedClasses: Classroom[] = [
  { id: "bio101", name: "Intro to Biology", code: "428193", coverUrl: coverUrlFor("bio101"), classRepId: "m2" },
  { id: "cs204", name: "Data Structures", code: "771204", coverUrl: coverUrlFor("cs204"), classRepId: "m5" },
  { id: "hist110", name: "World History", code: "560338", coverUrl: coverUrlFor("hist110") },
  { id: "math150", name: "Calculus I", code: "903517", coverUrl: coverUrlFor("math150") },
];

export const seedUnits: Unit[] = [
  { id: "u-bio-1", classId: "bio101", name: "Cell Biology", code: "BIO 1101" },
  { id: "u-bio-2", classId: "bio101", name: "Genetics", code: "BIO 1102" },
  { id: "u-cs-1", classId: "cs204", name: "Trees & Graphs", code: "CS 2041" },
  { id: "u-cs-2", classId: "cs204", name: "Algorithms", code: "CS 2042" },
  { id: "u-hist-1", classId: "hist110", name: "Modern Era", code: "HIS 1101" },
  { id: "u-math-1", classId: "math150", name: "Limits & Derivatives", code: "MAT 1501" },
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
  { id: "t1", unitId: "u-bio-1", title: "Cell Structure Lab Report", description: "Submit your write-up on the microscope lab.", type: "assignment", dueLabel: "Due tomorrow" },
  { id: "t2", unitId: "u-bio-2", title: "Genetics CAT 1", description: "In-class test covering Mendelian inheritance.", type: "cat", dueLabel: "Due in 3 days" },
  { id: "t3", unitId: "u-cs-1", title: "Binary Trees Problem Set", description: "Problems 1-8 from the handout.", type: "assignment", dueLabel: "Due in 3 days" },
  { id: "t4", unitId: "u-cs-2", title: "Sorting Algorithms Deadline", description: "Final commit for the sorting project.", type: "deadline", dueLabel: "Due next week" },
  { id: "t5", unitId: "u-hist-1", title: "Essay: The Industrial Revolution", description: "1500 words, cite at least 5 sources.", type: "assignment", dueLabel: "Due next week" },
];

export const seedAnnouncements: Announcement[] = [
  { id: "n1", unitId: "u-math-1", title: "Midterm moved to Friday", content: "The midterm has been rescheduled to this Friday at 9am.", timeLabel: "2h ago" },
  { id: "n2", unitId: "u-cs-1", title: "Guest lecture this Thursday", content: "We have an industry guest speaker on graph databases.", timeLabel: "Yesterday" },
  { id: "n3", unitId: "u-bio-1", title: "Lab safety briefing recap", content: "Reminder to review the lab safety slides before next session.", timeLabel: "2 days ago" },
];

# Classd — Presentation Script

A spoken script for presenting the app and walking through the code. Roughly
12–15 minutes. `[Stage directions in brackets]` tell you when to switch between
the running app and the code. Say the rest out loud, in your own words — it
doesn't have to be word-for-word.

---

## 0. Before you start (setup checklist)
- App running on the emulator/phone, logged in as a **class rep** account.
- Editor open on the project, with `ARCHITECTURE.md` in one tab.
- A second account handy (or the admin) if you want to show notifications.

---

## 1. Opening — what it is (≈1 min)

> "Good morning. This is **Classd** — a mobile app that helps university
> students keep track of their academic work in one place: their classes, their
> assignments, deadlines, announcements, and their project groups.
>
> The problem we set out to solve is that right now this stuff is scattered —
> it's in WhatsApp groups, in email, on notice boards, in people's heads. So
> things get missed. Classd pulls it all into one app and adds reminders so you
> don't forget a deadline.
>
> It's built with React Native and Expo for the app, and Firebase for the
> backend. Let me show you what it does, and then I'll walk you through how it's
> put together."

---

## 2. Live demo — what the user sees (≈3–4 min)

> "Let me start with what a student sees when they open the app."

[Show the **home dashboard**.]

> "This is the dashboard. At the top there's a greeting, then the student's
> pending tasks — only the ones they haven't done yet — then any tasks from their
> project groups, and at the bottom the latest announcements. Everything here is
> the student's real data, pulled live from the database."

[Tap an announcement → the **detail popup** appears.]

> "If I tap an announcement, I get a quick popup with the full details — the
> category, when it was posted, the due date, and the message."

[Go to the **Classes** tab → open a class.]

> "Here are the classes I'm in. If I open one, I can see its tasks, materials,
> announcements, the member list, and any project groups. Because I'm the class
> representative for this class, I also get an **Add** button here that regular
> students don't see."

[As the rep, tap **Add** → create a task → save. Point out the toast.]

> "So as a rep, I can post an assignment. I fill in the title and due date, hit
> save — and notice it appears instantly, and I get this little confirmation.
> Behind the scenes that also triggers a notification to everyone in the class,
> which I'll come back to."

[Open the task → **mark it complete**.]

> "As a student, I can tick a task off when it's done. That's tracked per
> student, so my completed list is mine — it doesn't affect anyone else."

[Quickly show **Groups** → open a group.]

> "Students can also form project groups within a class, assign tasks to each
> other, and see whose turn it is to do what. A person can only be in one group
> per class, so nobody's in two teams for the same unit."

[Optional: show **Profile** briefly.]

> "And there's a profile page with your stats, where you can change your name or
> avatar."

---

## 3. The architecture — how it's built (≈3 min)

> "Now let me show you how it's actually put together, because the design is the
> part I'm most happy with."

[Switch to the code. Open `ARCHITECTURE.md` and show the diagram in §2.]

> "The whole app is built in **layers**, and every single feature flows through
> the same four layers, top to bottom.
>
> At the top are the **screens** — what the user sees. The screens don't know
> anything about the database. When a screen needs data, it asks a **store** —
> that's the second layer. We have two stores: one for who's logged in, and one
> for all the classes, tasks, announcements, and groups.
>
> The store then goes through a single **API layer** — this is the important bit.
> There's one object called `api`, and it's the *only* door to the backend.
> Nothing else in the app is allowed to talk to Firebase directly.
>
> And underneath that is **Firebase** itself — authentication, the database, and
> the cloud functions that send notifications."

[Open `lib/api/contract.ts`.]

> "This file is basically the contract — it lists everything the backend can do
> and every type of data. If you want to know what the app is capable of, you
> read this one file."

[Open `lib/api/index.ts` — show the one line.]

> "And this is the switch. This one line decides whether we use the real Firebase
> backend or an in-memory fake one for testing. Because everything goes through
> this, we could swap the entire backend by changing one file, and not a single
> screen would need to change."

> "The reason this matters: it keeps the app **easy to change and easy to test**.
> The UI is presentation-only, and all the backend logic lives in one place."

---

## 4. Following one feature through the layers (≈2 min)

> "Let me make that concrete by tracing exactly what happens when I posted that
> task earlier."

[Open `ARCHITECTURE.md` §12, or open the files as you go.]

> "One — I tap Add, which opens the **add-task modal**." [open
> `components/modals/add-task-modal.tsx`]
> "Two — the modal calls `addTask` on the classes **store**." [open
> `lib/classes-store.tsx`, find `addTask`]
> "Three — the store calls `api.createTask`, and updates the screen immediately
> so it feels instant."
> "Four — the **firebase implementation** actually writes the task to the
> database." [open `lib/api/firebase-impl.ts`, find `createTask`]
> "Five — that database write automatically triggers a **cloud function** that
> sends the notification." [open `functions/src/index.ts`, show `onTaskPosted`]
>
> "So it's: screen → store → api → firebase → cloud function. And that same path
> is how *every* action in the app works — creating a class, joining a group,
> everything. Once you understand this one flow, you understand the whole app."

---

## 5. The standout feature — notifications (≈2 min)

> "The part I want to highlight is the notification system, because it's the most
> technically involved."

[Open `functions/src/index.ts`.]

> "These are cloud functions — code that runs on Google's servers, not in the
> app. There are four. Two of them fire the instant something is posted — a new
> task or a new announcement — and notify everyone in the class.
>
> The other one runs on a schedule, every hour, and scans for deadlines. If an
> assignment is due within 24 hours, it sends a 'due soon' reminder. If it's
> overdue, it sends an 'overdue' reminder.
>
> And it's careful about it: it skips anyone who's already finished the task, and
> it keeps a record of every reminder it sends so it never sends the same one
> twice."

> "We tested all of this end to end — registering a device, the due-soon
> reminder, the overdue reminder, the no-duplicates rule, and the skip-completed
> rule — and all five passed."

[If you have a second device/account: post a task and let the notification land.]

---

## 6. Roles and permissions (≈1 min)

> "One design decision worth mentioning is how permissions work. There are two
> levels.
>
> Your **account** is either an admin or a student. But whether you can *post* in
> a particular class depends on a **second** role that's specific to that class —
> you're either the class representative or a regular student. So the same person
> can be the rep of one class and just a student in another.
>
> The admin creates the classes and appoints the reps. The reps post the work.
> The students do the work. And all of this is enforced by security rules on the
> server, so it can't be bypassed from the app."

---

## 7. Closing (≈1 min)

> "So to sum up: Classd brings a student's academic life into one place — classes,
> tasks, announcements, and groups — with automatic reminders so deadlines don't
> slip. It's built on a clean, layered design where the interface, the data, and
> the backend are cleanly separated, which made it straightforward to build,
> test, and extend.
>
> Thank you — I'm happy to take any questions, or to show you where any specific
> part of the code lives."

---

## 8. Likely questions — quick answers

- **"Where's the code for X?"** → Open `ARCHITECTURE.md` §11, the lookup table.
  Every feature maps to a file.
- **"Why Firebase?"** → Managed auth, real-time database, and serverless
  functions in one place — no server to run ourselves, and it scales.
- **"Why React Native / Expo?"** → One codebase for Android and iOS, fast to
  develop, and Expo handles the build and notification plumbing.
- **"How do you know a rep can't be faked?"** → Security rules
  (`firestore.rules`): joining a class is always as a student, and only the class
  owner or an admin can promote someone to rep.
- **"Does the notification slow down posting?"** → No. The cloud functions run on
  the server *after* the write; the app never waits for them. Posting updates the
  screen instantly.
- **"What would you add next?"** → The materials/file backend (currently the UI
  is there but files aren't persisted), and tightening the rule that lets a user
  edit their own role.

---

### Timing summary
| Section | Time |
|---|---|
| Opening | 1 min |
| Live demo | 3–4 min |
| Architecture | 3 min |
| One feature through the layers | 2 min |
| Notifications | 2 min |
| Roles | 1 min |
| Closing | 1 min |
| **Total** | **~13–14 min** |

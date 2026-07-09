# Classd — Codebase & Functionality Guide

A map of **what the app does** and **where each piece of code lives**, so you can
point to any feature and explain the flow between components.

---

## 1. What the app is

Classd is a mobile app (Android/iOS) that helps university students coordinate
academic work — classes, assignments (tasks), announcements, and project groups —
with push-notification reminders. It's built with **React Native + Expo** and a
**Firebase** backend.

### Tech stack

| Concern | Technology | Where |
|---|---|---|
| App framework | React Native + Expo (SDK 54) | whole `app/`, `components/` |
| Navigation | expo-router (file-based) | `app/` folder structure |
| Styling | NativeWind (Tailwind for RN) | `className=""` props, `global.css`, `tailwind.config.js` |
| Auth | Firebase Authentication (email/password) | `lib/firebase.ts`, `lib/api/firebase-impl.ts` |
| Database | Cloud Firestore (NoSQL) | `lib/api/firebase-impl.ts`, `firestore.rules` |
| Push notifications | Expo Notifications + FCM + Cloud Functions | `lib/push.ts`, `functions/src/index.ts` |
| Server logic | Firebase Cloud Functions (Node 22) | `functions/src/index.ts` |

---

## 2. The big picture — a layered architecture

Every feature follows the **same top-to-bottom flow**. Understanding this one
diagram lets you trace any functionality:

```
┌─────────────────────────────────────────────────────────────┐
│  SCREENS            app/(tabs)/*, app/(auth)/*, app/(admin)/* │  ← what the user sees
│  COMPONENTS         components/**                              │
└───────────────┬─────────────────────────────────────────────┘
                │  read state + call actions via hooks
                ▼
┌─────────────────────────────────────────────────────────────┐
│  STATE STORES (React Context)                                 │  ← in-memory app state
│    lib/session.tsx      → who's logged in (auth)              │     + maps DB shapes to
│    lib/classes-store.tsx→ classes/tasks/announcements/groups  │       UI shapes
└───────────────┬─────────────────────────────────────────────┘
                │  every backend call goes through ONE object
                ▼
┌─────────────────────────────────────────────────────────────┐
│  API CONTRACT          lib/api/index.ts  → exports `api`      │  ← the ONLY door to the
│    interface           lib/api/contract.ts (ClassdApi)        │     backend
│    real impl           lib/api/firebase-impl.ts               │
│    fake impl           lib/api/mock-impl.ts                   │
└───────────────┬─────────────────────────────────────────────┘
                │  Firestore / Auth SDK calls
                ▼
┌─────────────────────────────────────────────────────────────┐
│  FIREBASE (cloud)   Auth · Firestore · Cloud Messaging        │
│  CLOUD FUNCTIONS    functions/src/index.ts (react to writes)  │  ← notifications fire here
└─────────────────────────────────────────────────────────────┘
```

**The golden rule:** screens never call Firebase directly. They call a **store
hook** (`useClasses()` / `useSession()`), the store calls the **`api`** object,
and only `lib/api/firebase-impl.ts` knows Firebase exists. If you want to change
how data is fetched, you change one file (`firebase-impl.ts`) and nothing else.

---

## 3. Directory map

```
app/                        Routes (expo-router: file = screen)
  _layout.tsx               Root: wraps app in providers (Session, Classes, Toast)
  index.tsx                 Splash screen → routes by auth state/role
  (auth)/
    login.tsx               Login + Register (one screen, toggled)
    register.tsx            (alias screen)
  (tabs)/                   The main app (bottom tab bar)
    _layout.tsx             Declares the 5 tabs + hidden detail screens
    index.tsx               HOME dashboard
    classes.tsx             Classes list
    class/[id].tsx          Class detail (tasks/materials/updates/members/groups)
    task/[id].tsx           Task detail (complete / edit / delete)
    tasks.tsx               "All tasks" (filter + search)
    announcements.tsx       Announcements feed (grouped by class)
    groups.tsx              My groups list
    group/[id].tsx          Group detail (tasks + members)
    group-tasks.tsx         "All group tasks" (filter + search)
    profile.tsx             Profile (stats, edit, sign out)
  (admin)/                  Admin-only area
    _layout.tsx             Stack layout
    index.tsx               Admin home: all classes, create class
    class/[id].tsx          Admin class detail: assign class rep

components/
  home/                     Dashboard sections (tasks, group-tasks, updates, header)
  class/                    Class-detail rows (task-row, member-row, material-row…)
  modals/                   All popups (create/join/add/edit/detail/invite…)
  navigation/               floating-tab-bar.tsx (the custom bottom bar)
  ui/                       Primitives: button, input, segmented-tabs, toast, logo…

lib/
  firebase.ts               Firebase SDK init (auth/db/storage singletons)
  api/
    contract.ts             ClassdApi interface + all data types (the "spec")
    index.ts                Picks firebase vs mock impl; exports `api`
    firebase-impl.ts        REAL backend — every method implemented against Firebase
    mock-impl.ts            In-memory fake backend (for offline dev)
  session.tsx               Auth session context (useSession)
  classes-store.tsx         Main data store context (useClasses)
  push.ts                   Push-notification registration
  types.ts                  UI-facing types (Task, Announcement, GroupTaskItem…)
  classes.ts                Classroom UI type
  avatars.ts, utils.ts      Helpers

functions/src/index.ts      Cloud Functions (notifications)
firestore.rules             Security rules (who can read/write what)
```

---

## 4. The core layers in detail

### 4.1 Firebase initialization — `lib/firebase.ts`
Creates the three singletons the whole backend uses: `auth`, `db` (Firestore),
`storage`. Config comes from `EXPO_PUBLIC_FIREBASE_*` env vars (`.env`). Auth is
set up with **AsyncStorage persistence** so a login survives app restarts
(`resolveAuth()`).

### 4.2 The API contract — `lib/api/contract.ts`
This is the **spec** for the whole backend: the `ClassdApi` interface lists every
operation (`signInWithEmail`, `listClasses`, `createTask`, `joinGroup`, …) plus
every data type (`Class`, `Task`, `Announcement`, `Group`, `Member`, …). If you
want to know "what can the backend do?", read this file top to bottom.

### 4.3 The backend switch — `lib/api/index.ts`
```ts
export const api = backend === "firebase" ? firebaseApi : mockApi;
```
Reads `EXPO_PUBLIC_API_BACKEND`. In production it's `"firebase"`. Everything
imports `{ api } from "@/lib/api"` and never the impl files directly.

### 4.4 The real backend — `lib/api/firebase-impl.ts`
The biggest/most important file. Each `ClassdApi` method is implemented with
Firebase SDK calls. Key helpers at the top:
- `tsToIso()` — converts Firestore Timestamps → ISO strings.
- `toClass/toMember/toTask/toAnnouncement/toGroup/toGroupTask()` — shape raw
  Firestore docs into contract types.
- `requireUid()` — current user id or throw.
- `toApiError()` — maps Firebase errors → friendly `ApiError`.
- `visibleClassIds()` / `myGroupIdsInClass()` — cross-collection lookups.

### 4.5 Auth state store — `lib/session.tsx`
React Context exposing **who is logged in**. `useSession()` gives you
`user, role, name, email, firstName, avatarUrl, isAuthenticated, loading` plus
actions `signInWithEmail, signUpWithEmail, signOut, updateAvatar, updateName`.
- Source of truth: `api.onAuthStateChanged()` (fires on launch + every sign
  in/out).
- On sign-in it calls `registerForPushNotifications()`; on sign-out,
  `unregisterForPushNotifications()`.

### 4.6 Main data store — `lib/classes-store.tsx`
The heart of the app's state. `useClasses()` exposes classes, tasks,
announcements, group tasks, members, completion state, and all the actions to
mutate them. Responsibilities:
- **Load** everything on login via `refresh()` (parallel `api.list*` calls).
- **Map** API/ISO shapes → UI shapes with human labels (`dueLabel` = "Due
  tomorrow", `timeLabel` = "2h ago"), via `toTask/toAnnouncement/…`.
- **Sort** (tasks soonest-first, announcements newest-first).
- **Optimistic updates**: `addTask/updateTask/deleteTask/addAnnouncement` change
  local state immediately, then `refresh(true)` in the background — so posting
  feels instant. (This is why posting is fast; the notification functions run
  server-side and never block the UI.)

---

## 5. Navigation & routing

expo-router turns the **file tree** into routes. Grouping folders in parentheses
(`(tabs)`, `(auth)`, `(admin)`) organize routes without adding a URL segment.

- **`app/_layout.tsx`** — the root. Wraps everything in provider order:
  `SafeAreaProvider → SessionProvider → ClassesProvider → ToastProvider`. So any
  screen can call `useSession()`, `useClasses()`, `useToast()`.
- **`app/index.tsx`** — the splash. Waits for auth to resolve, then
  `router.replace()` to `/login` (signed out), `/(admin)` (admin), or `/(tabs)`
  (student).
- **`app/(tabs)/_layout.tsx`** — declares the 5 visible tabs (index, classes,
  groups, announcements, profile) plus **hidden detail screens** (`class/[id]`,
  `task/[id]`, `group/[id]`, `tasks`, `group-tasks`) with `href: null` so they
  live inside the tab navigator (keeping the tab bar visible) but aren't tabs.
- **`components/navigation/floating-tab-bar.tsx`** — the custom glass bottom bar.
  `ICONS` maps route→icon; `PARENT_TAB` keeps the parent tab highlighted while a
  detail screen is open (e.g. Classes stays lit on `class/[id]`).

---

## 6. Feature-by-feature map

Each feature below lists **what it does**, the **files**, and the **data flow**.

### 6.1 App launch & auth routing
- **Files:** `app/index.tsx`, `lib/session.tsx`, `lib/firebase.ts`.
- **Flow:** app opens → `SessionProvider` subscribes to `api.onAuthStateChanged`
  → Firebase restores the persisted session from AsyncStorage → `app/index.tsx`
  reads `isAuthenticated`/`role` and redirects.

### 6.2 Authentication (register / login / logout)
- **Files:** `app/(auth)/login.tsx` (UI), `lib/session.tsx` (actions),
  `lib/api/firebase-impl.ts` (`signUpWithEmail`, `signInWithEmail`, `signOut`).
- **Flow (login):** `login.tsx handleSubmit()` → `useSession().signInWithEmail()`
  → `api.signInWithEmail()` → `firebase-impl` calls `signInWithEmailAndPassword`
  + reads the `users/{uid}` profile → returns `UserProfile` → screen routes by
  `role`.
- **Register** always creates a `role: "student"` user and writes a `users/{uid}`
  profile doc (`firebase-impl.signUpWithEmail`).
- **Persistence:** handled by AsyncStorage in `lib/firebase.ts`.

### 6.3 Roles & permissions
There are **two** role concepts — this trips people up, so it's worth knowing:
- **System role** (`users/{uid}.role`): `"admin"` or `"student"`. Only
  distinguishes admins. Set at sign-up (student) or in the DB (admin).
- **Per-class role** (`classes/{id}/members/{uid}.role`): `"classRep"` or
  `"student"`. This is what grants task/announcement posting **within a class**.
- **Where "can I manage this class?" is decided:** `app/(tabs)/class/[id].tsx`
  → `canManage = role === "admin" || classroom.classRepId === user.id ||
  myMemberRole === "classRep"`. The same check appears in `task/[id].tsx` and is
  used to show/hide "Quick add" buttons on the dashboard (`index.tsx repClasses`).

### 6.4 Home dashboard
- **Files:** `app/(tabs)/index.tsx` (screen), `components/home/*`
  (`home-header`, `tasks-section`, `group-tasks-section`, `updates-section`).
- **What it shows:** greeting header, a "Quick add task" button (reps only),
  **pending** tasks (`TasksSection`), **pending** group tasks with their class
  (`GroupTasksSection`, only if the user is in a group — gated on
  `groupCount`), and **Latest updates** (`UpdatesSection`).
- **Latest updates logic** (`updates-section.tsx`): shows announcements that are
  **not overdue** and were either **posted in the last 7 days** or are **due in
  the future**, newest-first, up to 8. Tapping one opens
  `components/modals/announcement-detail-modal.tsx`.
- **Data:** all read from `useClasses()`.

### 6.5 Classes
- **List:** `app/(tabs)/classes.tsx` → `useClasses().classes` →
  `api.listClasses()` (`firebase-impl`: admins see all, students see classes they
  have a `members/{uid}` doc in).
- **Create a class:** two entry points — the admin home (`app/(admin)/index.tsx`)
  and `components/modals/create-class-modal.tsx` → `useClasses().addClass()` →
  `api.createClass()` (`firebase-impl` generates a unique 6-digit join code via
  `uniqueClassCode()`). Success shows a friendly toast.
- **Join a class:** `components/modals/join-class-modal.tsx` →
  `useClasses().joinClass(code)` → `api.joinClassByCode()` (finds the class by
  code, writes a `members/{uid}` doc with `role: "student"`).
- **Class detail:** `app/(tabs)/class/[id].tsx` — 5 tabs (Tasks, Materials,
  Updates, Members, Groups). The "Add"/"Invite" button in the header is gated on
  `canManage` (see 6.3). Members list uses `components/class/member-row.tsx`;
  invite popup is `components/modals/invite-modal.tsx`.

### 6.6 Tasks (assignments)
- **Create/Edit:** `components/modals/add-task-modal.tsx` (also handles edit) and
  `components/modals/quick-add-task-modal.tsx` → `useClasses().addTask()` /
  `updateTask()` → `api.createTask()`/`updateTask()`.
- **Delete:** `app/(tabs)/task/[id].tsx handleDelete()` → `useClasses().deleteTask()`.
- **Mark complete:** `useClasses().toggleTaskComplete()` → `api.setTaskComplete()`
  writes `users/{uid}/completions/{taskId}`. Completion is **per-user**, stored
  under the user, not the task.
- **Views:** dashboard `TasksSection`; full list `app/(tabs)/tasks.tsx` (All /
  Pending / Completed filter + search, grouped by class); detail
  `app/(tabs)/task/[id].tsx`.
- **UI type mapping:** `classes-store.tsx toTask()` — note the `"Untitled task"`
  fallback so a DB doc missing its title still renders a usable row.

### 6.7 Announcements
- **Categories:** `general | cat | deadline` (`lib/types.ts`), optional due date.
- **Create:** `components/modals/add-announcement-modal.tsx` (from a class) and
  `components/modals/quick-add-announcement-modal.tsx` (from the Announcements
  tab) → `useClasses().addAnnouncement()` → `api.createAnnouncement()`.
- **Views:** dashboard `UpdatesSection`; full feed `app/(tabs)/announcements.tsx`
  (grouped by class, search); inside a class under the "Updates" tab of
  `class/[id].tsx`; detail popup `announcement-detail-modal.tsx`.

### 6.8 Project groups
- **List (mine):** `app/(tabs)/groups.tsx` → `api.listMyGroups()`.
- **Create:** `components/modals/create-group-modal.tsx` → `api.createGroup()`.
- **Detail:** `app/(tabs)/group/[id].tsx` — Tasks/Members tabs, join/leave
  button, rename (creator only), header shows the group's **class name** (via
  `useClasses().className`).
- **Join/leave:** `group/[id].tsx toggleMembership()` → `api.joinGroup()` /
  `leaveGroup()`.
- **Group tasks:** assign via `components/modals/add-group-task-modal.tsx` →
  `api.createGroupTask()`; toggle via `api.setGroupTaskStatus()`. Dashboard shows
  them in `GroupTasksSection`; full list `app/(tabs)/group-tasks.tsx`.
- **One group per class rule:** enforced in `firebase-impl.ts` — `createGroup`
  and `joinGroup` call `myGroupIdsInClass()` and throw `already-exists` if you're
  already in a group for that class. The UI surfaces it as an error toast.

### 6.9 Profile
- **Files:** `app/(tabs)/profile.tsx`, `components/modals/edit-profile-modal.tsx`,
  `components/modals/avatar-picker-modal.tsx`.
- **What it does:** shows the role badge (rep of any class → "Class
  Representative"), active-class + pending-task stats, edit display name
  (`useSession().updateName` → `api.updateProfile({name})`), change avatar
  (`updateAvatar`), sign out.

### 6.10 Admin module
- **Guard:** routing to `/(admin)` happens only when `role === "admin"`
  (`app/index.tsx`, `login.tsx`). Layout: `app/(admin)/_layout.tsx`.
- **Admin home:** `app/(admin)/index.tsx` — lists every class with member counts,
  create a class.
- **Assign class rep:** `app/(admin)/class/[id].tsx makeRep()` →
  `api.assignClassRep()` (`firebase-impl` demotes the old rep, sets
  `classes/{id}.classRepId`, and flips the member's per-class `role` to
  `classRep`).

### 6.11 Notifications (the whole pipeline)
Three parts:
1. **Register a device** — `lib/push.ts registerForPushNotifications()`, called
   from `lib/session.tsx` on sign-in. Gets an Expo push token and saves it to
   `users/{uid}.expoPushTokens` via `api.registerPushToken()`. Also sets the
   foreground notification handler so banners show while the app is open.
2. **Server sends** — `functions/src/index.ts` (see §7).
3. **In-app confirmations** — the friendly success toasts are a *separate*
   thing: `components/ui/toast.tsx` (`useToast().success()`), fired from the
   create/join modals. Not push notifications.

---

## 7. Cloud Functions — `functions/src/index.ts`

Server-side code that reacts to the database and sends Expo push notifications.
Four functions:

| Function | Trigger | What it does |
|---|---|---|
| `onTaskPosted` | a task doc is created | pushes "New task posted" to all class members |
| `onAnnouncementPosted` | an announcement doc is created | pushes "New announcement" to all class members |
| `deadlineReminders` | scheduled, hourly | scans tasks + dated announcements; pushes "due soon" (within 24h) and "overdue" reminders |
| `runRemindersNow` | HTTP (secret-guarded) | runs the same scan on demand, for testing |

Key logic in `processReminders()`: finds candidates in the due-soon/overdue
windows, skips users who **completed** a task, and writes `sentNotifications/…`
markers so the same reminder is **never sent twice**. Push delivery goes through
`sendExpoPush()` → Expo → FCM → device.

---

## 8. Firestore data model

```
users/{uid}                        profile: name, email, role, avatarUrl, expoPushTokens[]
  completions/{taskId}             per-user task completion (completedAt)

classes/{classId}                  name, code, ownerId, classRepId, coverUrl, schedules
  members/{uid}                    uid, name, email, role(classRep|student), joinedAt
  tasks/{taskId}                   title, description, dueAt, createdBy, createdAt
  announcements/{id}               title, content, category, dueAt?, createdBy, createdAt

groups/{groupId}                   classId, name, createdBy, createdAt
  groupMembers/{uid}               uid, name, email, joinedAt
  tasks/{taskId}                   title, description, dueAt, assignedTo, status

sentNotifications/{markerId}       dedupe markers for reminders
codes/{code}                       join-code lookup
```

---

## 9. Security rules — `firestore.rules`

Enforces access server-side (the client can't bypass them). Highlights:
- `isAdmin()` / `canManageClass()` — helper functions for permission checks.
- A user can only read their own profile (admins can read anyone, to list
  members).
- Tasks/announcements: **anyone in the class can read**; only the rep/owner/admin
  can write (`canManageClass`).
- Joining a class must be as a `"student"` — you can't self-assign `classRep`.
- Group membership: a user can add/remove only themselves.

> Known gap (documented): a user can currently write their own `users/{uid}` doc
> including `role`, so the rules alone don't prevent self-promotion to admin.

---

## 10. Styling — NativeWind

Tailwind-style `className` props compiled at build time.
- `global.css` — Tailwind directives + CSS variables (colors as HSL).
- `tailwind.config.js` — theme (maps `bg-primary` etc. to the CSS vars).
- `metro.config.js` — wraps Metro with `withNativeWind`.
- `babel.config.js` — the `nativewind` preset + `jsxImportSource`.
- UI primitives that centralize styles: `components/ui/button.tsx`,
  `input.tsx`, `segmented-tabs.tsx`, `toast.tsx`.

---

## 11. Quick reference — "where is the code that…"

| I want to find… | Look in |
|---|---|
| what the backend *can* do | `lib/api/contract.ts` |
| how any backend call actually works | `lib/api/firebase-impl.ts` |
| the current user / login state | `lib/session.tsx` (`useSession`) |
| classes/tasks/announcements/groups state | `lib/classes-store.tsx` (`useClasses`) |
| login / register screen | `app/(auth)/login.tsx` |
| the home dashboard | `app/(tabs)/index.tsx` + `components/home/*` |
| a class page | `app/(tabs)/class/[id].tsx` |
| creating a task | `components/modals/add-task-modal.tsx` → `classes-store.addTask` |
| marking a task done | `classes-store.toggleTaskComplete` → `api.setTaskComplete` |
| the "all tasks" filter/search | `app/(tabs)/tasks.tsx` |
| announcements feed | `app/(tabs)/announcements.tsx` |
| the announcement popup | `components/modals/announcement-detail-modal.tsx` |
| project groups | `app/(tabs)/groups.tsx`, `app/(tabs)/group/[id].tsx` |
| "one group per class" enforcement | `lib/api/firebase-impl.ts` (`myGroupIdsInClass`) |
| editing your display name | `components/modals/edit-profile-modal.tsx` |
| the admin panel / assigning a rep | `app/(admin)/index.tsx`, `app/(admin)/class/[id].tsx` |
| who can manage a class | `class/[id].tsx` (`canManage`) |
| the bottom tab bar | `components/navigation/floating-tab-bar.tsx` |
| push-token registration | `lib/push.ts` |
| notification sending (server) | `functions/src/index.ts` |
| in-app success popups (toasts) | `components/ui/toast.tsx` |
| security / who-can-do-what rules | `firestore.rules` |
| Firebase setup / config | `lib/firebase.ts` (+ `.env`) |

---

## 12. A worked example — "what happens when a rep posts a task?"

Trace it end to end (a good demo of the whole architecture):

1. Rep taps **Add** on `app/(tabs)/class/[id].tsx` → opens
   `components/modals/add-task-modal.tsx`.
2. Modal `handleSave()` validates input and calls
   `useClasses().addTask(classId, {title, description, dueAt})`.
3. `lib/classes-store.tsx addTask` calls `api.createTask(...)`, then optimistically
   adds the task to local state and fires a background `refresh(true)`.
4. `lib/api/firebase-impl.ts createTask` writes a doc to
   `classes/{classId}/tasks/{taskId}` in Firestore.
5. The modal closes and `useToast().success("Task posted!")` shows a toast.
6. **Server-side**, that Firestore write triggers `onTaskPosted` in
   `functions/src/index.ts`, which pushes "New task posted" to every class
   member's device via Expo → FCM.
7. Later, `deadlineReminders` will also remind members as the due date nears.

That single path — **screen → store → api → firebase-impl → Firestore →
Cloud Function** — is how *every* write in the app works.
```

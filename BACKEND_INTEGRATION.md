# classd — Backend Integration Guide

This is the single source of truth for wiring a real backend into the **classd**
mobile app. Today the app is a fully-working frontend prototype with **no real
backend** — all data lives in memory and resets on reload. Your job is to make
it real.

The backend is **Firebase** (project `classd-f6db8`): Auth + Cloud Firestore +
Cloud Storage, with optional Cloud Functions for server-side logic.

---

## 1. The big picture

The whole app talks to the backend through **one typed interface**:
[`ClassdApi`](lib/api/contract.ts). There are two implementations:

| File | What it is | Status |
|---|---|---|
| [`lib/api/mock-impl.ts`](lib/api/mock-impl.ts) | In-memory seed data (current prototype) | ✅ done |
| [`lib/api/firebase-impl.ts`](lib/api/firebase-impl.ts) | Real Firebase | ⬜ **you build this** |
| [`lib/api/index.ts`](lib/api/index.ts) | Picks the impl via `EXPO_PUBLIC_API_BACKEND` | ✅ done |

**You implement every method in `firebase-impl.ts`** so it satisfies the
contract. Use `mock-impl.ts` as the behavioural reference — it shows exactly
what each method should return. When a method works, flip the env flag and the
UI uses it with zero UI changes.

> The UI currently reads from two React Context stores —
> [`classes-store.tsx`](lib/classes-store.tsx) and
> [`session.tsx`](lib/session.tsx) — that still hold local state.
> The last step (Section 7) is rewiring those stores to call `api.*`. Do the
> contract first; rewire the stores last.

### Rules of the contract

- **All methods are async** (return Promises).
- **Timestamps are ISO 8601 strings** (`"2026-06-19T08:00:00.000Z"`), never
  Firestore `Timestamp` objects and never pre-formatted labels. Convert with
  `snapshot.data().createdAt.toDate().toISOString()`. The UI turns ISO into
  "Due tomorrow" / "2h ago" itself.
- **Throw `ApiError(code, message)`** (from the contract) on failure, not raw
  Firebase errors. Map Firebase error codes to the `ApiErrorCode` union.
- **The caller's identity** comes from the auth session on the server — the
  client never passes its own userId.

---

## 2. Environment setup

1. Copy [`.env.example`](.env.example) → `.env`.
2. Fill `EXPO_PUBLIC_FIREBASE_API_KEY` from the Firebase console
   (Project settings → General → Your apps → SDK config). The others are
   pre-filled for `classd-f6db8`.
3. Keep `EXPO_PUBLIC_API_BACKEND=mock` while building; switch to `firebase`
   to test against the real backend.
4. Restart with `pnpm start` (runs `expo start --clear`) after env changes —
   Expo only reads `EXPO_PUBLIC_*` at bundle time.

Firebase singletons are already set up in
[`lib/firebase.ts`](lib/firebase.ts) and export
`auth`, `db`, `storage`. Uncomment the import at the top of `firebase-impl.ts`.

> **Auth persistence:** to keep users signed in across restarts, install
> `@react-native-async-storage/async-storage` and switch `getAuth(app)` to
> `initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) })`
> in `firebase.ts`. Noted there as a TODO.

---

## 3. Firestore data model

```
users/{uid}
  name, email, role, avatarUrl, createdAt

classes/{classId}
  name, code (6-digit, unique), coverUrl, ownerId (uid),
  classRepId?, schedules[], createdAt

classes/{classId}/members/{uid}
  name, email, avatarUrl?, role, joinedAt

classes/{classId}/tasks/{taskId}
  title, description, type, dueAt, createdBy, createdAt

classes/{classId}/announcements/{announcementId}
  title, content, createdBy, createdAt

classes/{classId}/materials/{materialId}
  name, sizeBytes?, mimeType?, url, storagePath, uploadedBy, createdAt

users/{uid}/completions/{taskId}
  completedAt        # presence = task done, for this user
```

**Cloud Storage layout:** `materials/{classId}/{materialId}-{filename}`.

### Field shapes
The exact TypeScript shapes are the entity interfaces in
[`contract.ts`](lib/api/contract.ts) (`UserProfile`, `Class`,
`Member`, `Task`, `Announcement`, `Material`, `ScheduleBlock`). Store native
Firestore `Timestamp`s in the DB; convert to ISO strings on read.

### Notes & decisions
- **`code`** — generate a random unique 6-digit code on `createClass`. Enforce
  uniqueness (retry on collision, or a `codes/{code}` lookup doc).
- **`role`** — lives on `users/{uid}` and is copied onto the member doc. Set at
  sign-up (the auth screen sends `role`).
- **Enrollment** — a student is enrolled iff a `members/{uid}` doc exists under
  the class. `listClasses` for a student = `collectionGroup("members")` where
  the doc id is their uid, then load the parent classes.
- **`coverUrl`** — currently `https://picsum.photos/seed/{id}/600/400`. Keep
  that as a default, or let class representatives upload a cover later.

---

## 4. API surface — what each method does

Full signatures + payload types are in `contract.ts`. Summary:

**Auth**
- `signUpWithEmail({name?, email, password, role})` → create auth user + `users/{uid}` doc.
- `signInWithEmail({email, password})`
- `signInWithGoogle(idToken, role?)` / `signInWithApple(identityToken, role?)` — create profile on first sign-in.
- `signOut()`, `getCurrentUser()`, `onAuthStateChanged(cb)`, `updateProfile(patch)`

**Classes**
- `listClasses()` — class rep: owned; student: enrolled.
- `getClass(id)`, `createClass({name, schedules?})` (class rep),
  `joinClassByCode(code)` (student), `leaveClass(id)`,
  `assignClassRep(classId, memberId)` (class rep)

**Members**
- `listMembers(classId)`, `removeMember(classId, memberId)` (class rep)

**Tasks**
- `listTasks(classId)`, `listMyTasks()` (home dashboard, all classes),
  `createTask(classId, {title, description, type, dueAt})` (class rep),
  `listCompletedTaskIds()`, `setTaskComplete(taskId, complete)` (per-user)

**Announcements**
- `listAnnouncements(classId)`, `listMyAnnouncements()` (home feed),
  `createAnnouncement(classId, {title, content})`

**Materials**
- `listMaterials(classId)`,
  `uploadMaterial(classId, {uri, name, mimeType?, sizeBytes?})` — upload to
  Storage, `getDownloadURL`, then write the metadata doc,
  `deleteMaterial(classId, materialId)` — delete doc **and** the storage object.

---

## 5. Security rules (do not skip)

`firestore.rules` is currently **empty** (deny-all once deployed). Draft:

- `users/{uid}` — readable by signed-in users; writable only by `uid`.
- `classes/{classId}` — read if owner or member; create/update/delete by owner only.
- `members` — read by class members; write by class owner (or self for join/leave).
- `tasks` / `announcements` — read by members; create/update/delete by owner.
- `materials` — read by members; write by owner.
- `users/{uid}/completions` — read/write only by `uid`.

Mirror the same ownership/membership checks in **Storage rules** for
`materials/{classId}/**`. Test with the Firebase Emulator Suite before deploying.

---

## 6. Cloud Functions (optional, only if needed)

[`functions/src/index.ts`](functions/src/index.ts) is empty scaffolding. Most of
the app works as direct client→Firestore calls under good rules. Reach for a
callable/trigger only when a client can't be trusted or needs atomicity:

- **Unique join codes** — a callable `createClass` that allocates the code
  server-side avoids race conditions.
- **Cascade deletes** — `onClassDeleted` to clean up subcollections + storage.
- **Push notifications** — `onTaskCreated` / `onAnnouncementCreated` to notify
  enrolled students.

If you add callables, add matching methods on the contract rather than calling
them ad-hoc from screens.

---

## 7. Recommended order — start here

Build bottom-up; the app keeps running on mock data the whole time.

1. **Env + smoke test.** Do Section 2. Confirm `import { auth, db, storage } from "@/lib/firebase"` resolves and the app still boots on `mock`.
2. **Auth.** Implement the auth methods in `firebase-impl.ts`. Wire
   [`session.tsx`](lib/session.tsx) to `api.onAuthStateChanged` /
   `signIn*` / `signOut`, and the auth screens
   ([`register.tsx`](app/(auth)/register.tsx) — see the
   `// TODO: wire up to auth backend`) and profile sign-out
   ([`profile.tsx`](app/(tabs)/profile.tsx) — `// TODO: clear auth session`).
   This is the foundation everything else needs.
3. **Classes read path.** `listClasses`, `getClass`. Seed one class manually in
   the console to test.
4. **Classes write path.** `createClass`, `joinClassByCode`, `leaveClass`.
5. **Members.** `listMembers`, `assignClassRep`, `removeMember`.
6. **Tasks** then **Announcements** then **Materials** (Materials last — it adds
   Storage upload/download on top of Firestore).
7. **Security rules** (Section 5) — write and emulator-test as you go, harden
   before any real users.
8. **Rewire the stores.** Replace the in-memory mutations in
   [`classes-store.tsx`](lib/classes-store.tsx) with `api.*` calls,
   adding `loading`/`error` state per the pattern below. Then delete
   [`dummy-data.ts`](lib/dummy-data.ts).
9. Flip `EXPO_PUBLIC_API_BACKEND=firebase` and run the full app.

### Async rewire pattern (step 8)
The store selectors are currently synchronous (`tasksForClass(id)`). Moving to
async means loading data in effects and holding it in state:

```tsx
const [tasks, setTasks] = useState<Task[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  let alive = true;
  api.listTasks(classId)
    .then((t) => alive && setTasks(t))
    .catch((e: ApiError) => /* surface e.message */)
    .finally(() => alive && setLoading(false));
  return () => { alive = false; };
}, [classId]);
```

For mutations (`createTask`, `setTaskComplete`, …) call the api, then refetch or
optimistically update local state.

---

## 8. Definition of done

- [ ] Every `firebase-impl.ts` method implemented; no `notImplemented` left.
- [ ] App runs end-to-end with `EXPO_PUBLIC_API_BACKEND=firebase`.
- [ ] Firestore + Storage security rules written and emulator-tested.
- [ ] Sign up → create class → join by code (2nd account) → post task/
      announcement → upload material → mark complete, all persist across reload.
- [ ] `dummy-data.ts` deleted; stores read from `api`.
- [ ] `pnpm typecheck` passes.

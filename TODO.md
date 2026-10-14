# Classd — Pre-deployment TODO

Ordered by priority. Items in P0 block release; P1 should ship with v1.0; P2 can follow in an update.

## P0 — Blockers (security & broken features)

### Security
- [ ] **Stop self-promotion to admin** — `firestore.rules:23` lets a user write their whole `users/{uid}` doc, including `role`. Restrict updates so `role` (and `email`) can't change; only allow `name`, `avatarUrl`, `expoPushTokens`.
- [ ] **Restrict class creation to admins** — `firestore.rules:52` lets any signed-in user create a class. Add `isAdmin()` (or decide reps can create too and document it).
- [ ] **Audit the rest of `firestore.rules`** — groups, group tasks, `codes/`, `sentNotifications/` (clients shouldn't read/write this at all).
- [ ] **Write Storage rules** (`storage.rules`) for materials: only class members read, only rep/owner/admin write, file size + type limits.
- [ ] **Protect `runRemindersNow`** — confirm the secret is set in `functions/.env` / Secret Manager and not committed. Consider deleting it before launch.
- [ ] **Enable Firebase App Check** to block scripted abuse of Firestore/Functions.

### Broken / fake features
- [ ] **Make Materials real** — `listMaterials`, `uploadMaterial`, `deleteMaterial` throw `notImplemented` (`lib/api/firebase-impl.ts:919-928`); `addMaterial` in `lib/classes-store.tsx:348` is local-only.
  - [ ] Upload to Firebase Storage `classes/{classId}/materials/{id}`
  - [ ] Firestore doc in `classes/{classId}/materials` (name, size, mimeType, url, uploadedBy, createdAt)
  - [ ] Upload progress + error toast; open/download a material; delete (rep only)
  - [ ] Optional: push notification "New material posted"

### Release config
- [ ] **Fix OTA update safety** — `app.json` uses `runtimeVersion.policy: "sdkVersion"`. Adding a native module (e.g. the new datetimepicker) doesn't change it, so `eas update` would push JS that crashes older builds. Switch to `"fingerprint"` (or `"appVersion"`) before the first store build.
- [ ] **Add `expo-notifications` config plugin** to `app.json` (Android notification icon + color, default channel).

## P1 — Required for store approval / v1.0

### Store requirements
- [ ] **Delete account** in Profile (Apple and Google both require it). Delete auth user + `users/{uid}` + completions + memberships (best done in a Cloud Function).
- [ ] **Privacy policy & terms** — host a page, link it in the app (login screen + profile) and in store listings.
- [ ] **Store assets** — app icon check, screenshots, descriptions, Play data-safety form, App Store privacy labels.
- [ ] **Notification permission prompt** — explain why before the OS prompt; handle "denied" gracefully.

### Auth
- [ ] **Forgot password** on the login screen (`sendPasswordResetEmail`).
- [ ] **Email verification** after sign-up (or at least a banner until verified).
- [ ] Friendlier auth error messages (weak password, email in use, network error).

### Missing actions (API exists, no UI)
- [ ] **Leave class** — `api.leaveClass` exists but nothing in the UI calls it.
- [ ] **Edit / delete announcements** — only tasks have edit/delete.
- [ ] **Delete class** (admin/owner) and **delete group** (creator).
- [ ] Confirm `removeMember` UI exists for reps and shows a confirmation dialog.
- [ ] **Regenerate join code** (in case a code leaks).

### Data freshness
- [ ] **Pull-to-refresh** on Home, Classes, Tasks, Announcements, Groups.
- [ ] **Live updates** — switch key lists to Firestore `onSnapshot` listeners (or at least refresh on app foreground).
- [ ] Tapping a push notification deep-links to the task/announcement.

### Uncommitted work
- [ ] Test the `DateTimeField` refactor on Android + iOS, then commit it with the `@react-native-community/datetimepicker` dependency.
- [ ] Decide on the deleted `.claude/skills/firebase-*` files, `ARCHITECTURE.md`, `PRESENTATION_SCRIPT.md` — commit or discard.

## P2 — Polish

### UX
- [ ] Consistent loading skeletons, empty states, and error/retry states on every screen.
- [ ] Root **error boundary** so a crash shows a friendly screen instead of a white screen.
- [ ] Offline handling — banner when offline; enable Firestore offline persistence.
- [ ] Dark mode pass (`userInterfaceStyle: "automatic"` is on — verify every screen).
- [ ] Accessibility — labels on icon buttons, font scaling, contrast.
- [ ] Haptics on complete/toggle actions.
- [ ] Class cover images and schedules (fields exist in the data model but aren't used).
- [ ] Notification settings in Profile (mute a class, turn off reminders).

### Code health
- [ ] Remove unused imports in `components/class/class-card.tsx:3-4` (the 4 lint warnings).
- [ ] Remove `console.log` in `lib/push.ts:79,90`.
- [ ] Update the stale header comment in `lib/api/firebase-impl.ts`.
- [ ] Delete empty `apps/` and `packages/` folders.
- [ ] Update `README.md` (drop "today's classes", add groups, admin, notifications, backend setup).

### Quality & ops
- [ ] Unit tests: mapping helpers in `lib/classes-store.tsx`, `processReminders` in `functions/src/index.ts`.
- [ ] Firestore rules tests with the emulator (`@firebase/rules-unit-testing`).
- [ ] CI (GitHub Actions): `pnpm typecheck`, `pnpm lint`, functions build, rules tests.
- [ ] Crash reporting (Sentry via `@sentry/react-native`) + basic analytics.
- [ ] Verify all Firestore composite indexes are in `firestore.indexes.json` (check both it and `firebase.indexes.json` — consolidate into one).
- [ ] Set Firebase budget alerts; check the hourly `deadlineReminders` cost at scale.
- [ ] Separate dev / prod Firebase projects (so testing doesn't touch real users' data).

## Launch checklist
- [ ] All P0 + P1 done
- [ ] `firebase deploy --only firestore:rules,firestore:indexes,storage,functions`
- [ ] Production EAS build tested on real devices (Android + iOS)
- [ ] Internal testing track (Play) / TestFlight with a few real students
- [ ] Submit for review

# Classd — Pre-deployment TODO

✅ = done in code. 👤 = needs you (accounts, consoles, devices or decisions).

## P0 — Blockers

### Security
- [x] ✅ Stop self-promotion to admin (rules: role locked on create/update)
- [x] ✅ Only admins create classes
- [x] ✅ Join codes can't be scraped — joining runs in the `joinClass` function (rate limited)
- [x] ✅ Members-only reads for classes, rosters, tasks, announcements
- [x] ✅ Server-only `sentNotifications` / `joinAttempts`
- [x] ✅ Rules tests on the emulator (`pnpm test:rules`, 21 tests)
- [ ] 👤 `runRemindersNow`: check `REMINDER_SECRET` is set and long, or delete the function after testing
- [ ] 👤 Firebase App Check — needs the native `@react-native-firebase/app-check` setup plus Play Integrity / App Attest registration in the console

### Features
- [ ] Materials (file uploads) — built, then removed for now; restore from commit `f90aec3` (needs Firebase Storage + `storage.rules`)

### Release config
- [x] ✅ `runtimeVersion` → `fingerprint`
- [x] ✅ `expo-notifications` plugin + Android notification icon

## P1 — Store approval / v1.0

### Store requirements
- [x] ✅ Delete account (Settings → Delete account)
- [x] ✅ In-app privacy policy (`app/privacy.tsx`, linked from login + Settings)
- [ ] 👤 Host the privacy policy at a public URL for the store listings, and review the wording
- [ ] 👤 Store assets: screenshots, descriptions, Play data-safety form, App Store privacy labels
- [x] ✅ Explainer before the notification permission prompt

### Auth
- [x] ✅ Forgot password
- [x] ✅ Email verification (sent on sign-up + Home banner)

### Missing actions
- [x] ✅ Leave class
- [x] ✅ Edit / delete announcements
- [x] ✅ Delete class (admin) and delete group (creator)
- [x] ✅ Remove member (rep + admin, with confirmation)
- [x] ✅ Generate a new join code (admin)

### Data freshness
- [x] ✅ Pull-to-refresh everywhere
- [x] ✅ Refresh on app resume and when a push arrives
- [ ] Live `onSnapshot` listeners (optional — resume/push refresh covers most cases)
- [x] ✅ Tapping a push opens the task / class

## P2 — Polish
- [x] ✅ Root error boundary ("Something went wrong / Try again")
- [ ] Offline banner (needs `@react-native-community/netinfo`). Note: the Firebase JS SDK has no persistent offline cache on React Native.
- [ ] Dark mode — locked to light for now; needs hard-coded colours moved to theme tokens
- [ ] Class cover images and schedules (in the data model, unused)
- [ ] Haptics on complete/toggle
- [ ] Accessibility pass (labels added on new controls; older screens not audited)

### Code health
- [x] ✅ Lint warnings, debug `console.log`s, stale comments, dead code, stale config
- [x] ✅ README rewritten
- [x] ✅ Unit tests (`pnpm test`) + CI (`.github/workflows/ci.yml`)
- [ ] 👤 Crash reporting (e.g. Sentry) — needs an account/DSN
- [ ] 👤 Separate dev and prod Firebase projects
- [ ] 👤 Firebase budget alerts

## Launch checklist (👤)
- [ ] `firebase deploy --only firestore:rules,firestore:indexes,functions`
- [ ] New EAS build (native config changed), then test on real Android + iOS devices
- [ ] Internal testing track (Play) / TestFlight with a few real students
- [ ] Submit for review

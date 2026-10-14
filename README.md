# classd

classd is a mobile app (Android/iOS) that helps university students keep up with their classes. Admins create classes and assign a class representative; the rep posts tasks, announcements and course materials; students join with a 6-digit code, track their work, and get push reminders before things are due.

## What it does

- **Classes**: admins create classes and assign a class rep. Students join with a 6-digit code and can leave at any time. Admins can issue a new join code or delete a class.
- **Tasks**: reps post assignments with due dates; students mark them complete. Edit, delete, filter and search.
- **Announcements**: general notices, CATs and deadlines, with optional due dates. Reps can edit or delete them.
- **Materials**: reps upload files (up to 25 MB) that everyone in the class can open.
- **Project groups**: students form one group per class, assign group tasks, and track them on the dashboard.
- **Notifications**: push alerts for new posts plus due-soon and overdue reminders. Tapping one opens the task or class. Each kind can be turned off in Settings.
- **Accounts**: email sign-up with verification, password reset, profile and avatar, and in-app account deletion.

## Tech stack

- **Expo SDK 54** with Expo Router, **React Native 0.81**, React 19, TypeScript
- **NativeWind** (Tailwind CSS) for styling
- **Firebase**: Auth, Firestore, Storage and Cloud Functions
- **pnpm** for package management

## Requirements

- **Node.js 20 or newer** (CI uses 24)
- **pnpm 9.15.9 or newer**
- **Java 21+** and the **Firebase CLI** (`npm i -g firebase-tools`) to run the security-rules tests
- A development build for push notifications (they don't work in Expo Go)

## Getting started

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Copy `.env.example` to `.env` and fill in the Firebase keys. Set `EXPO_PUBLIC_API_BACKEND=firebase` for the real backend, or `mock` to run on in-memory sample data.

3. Start the Expo development server:

   ```bash
   pnpm start
   ```

   Then press `a` (Android), `i` (iOS), or scan the QR code.

## Scripts

| Script | What it does |
| --- | --- |
| `pnpm start` / `android` / `ios` / `web` | Start Expo (with a cleared cache) |
| `pnpm typecheck` | TypeScript checks |
| `pnpm lint` | Expo lint |
| `pnpm test` | Unit tests (`tests/unit`) |
| `pnpm test:rules` | Firestore security-rules tests on the emulator (`tests/rules`) |
| `pnpm format` | Format with Prettier |
| `pnpm eas:*` | EAS builds, updates and store submissions — see `package.json` |

CI (`.github/workflows/ci.yml`) runs the typecheck, lint, unit tests, the Cloud Functions build and the rules tests on every push and pull request.

## Backend

Everything the app can do is defined in `lib/api/contract.ts` and implemented against Firebase in `lib/api/firebase-impl.ts`. Screens never call Firebase directly.

| Piece | File |
| --- | --- |
| Firestore security rules | `firestore.rules` |
| Storage security rules (materials) | `storage.rules` |
| Indexes | `firestore.indexes.json` |
| Cloud Functions | `functions/src/index.ts` |

The Cloud Functions send push notifications (new posts, hourly due/overdue reminders), handle joining a class by code and deleting an account, and clean up when a class, group or membership is deleted.

Deploy everything with:

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage,functions
```

The functions need the Blaze plan (scheduled functions and outbound requests to Expo's push service).

## Project structure

- **`app`**: Expo Router screens: `(auth)` login, `(tabs)` the main app, `(admin)` the admin area.
- **`components`**: UI building blocks, rows, home sections and modals.
- **`lib`**: session and data stores, the API layer, and helpers.
- **`functions`**: Firebase Cloud Functions.
- **`tests`**: unit tests and security-rules tests.
- **`assets`**: icons, splash image and fonts.

## Notes

- Use the package scripts instead of `npx expo start`; they include the startup flags this project expects.
- `runtimeVersion` uses the `fingerprint` policy, so an `eas update` only reaches builds with matching native code. After adding a native module, ship a new build.
- Admin accounts are created by setting `role: "admin"` on the user's `users/{uid}` document in the Firebase console. The app can't do this, by design.

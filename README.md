# classd

classd is a mobile-first classroom management app built with Expo and React Native. It helps class representatives create classes and share class activity, while students can join classes, view their schedule, track tasks, and keep up with announcements.

## What it does

- **Class management**: Class representatives can create classes, and students can join the classes they are enrolled in.
- **Role-based experience**: Class representative and student views show the right actions for each role.
- **Home dashboard**: Users can see today's classes, upcoming tasks, and recent updates in one place.
- **Task tracking**: Students can mark tasks as complete from the app.
- **Announcements**: Classes can surface updates and announcements for enrolled users.

## Tech stack

- **Expo SDK 54** with Expo Router
- **React Native 0.81** and React 19
- **TypeScript**
- **NativeWind** and Tailwind CSS for styling
- **Firebase** and Firebase Cloud Functions support
- **pnpm** for package management

## Requirements

Before getting started, install:

- **Node.js 20 or newer**
- **pnpm 9.15.9 or newer**
- **Expo Go** on your Android or iOS device, or an Android/iOS simulator

## Getting started

1. Clone the project and open it:

   ```bash
   git clone <repository-url>
   cd classd
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Start the Expo development server:

   ```bash
   pnpm start
   ```

4. Open the app:

   - **Expo Go**: Scan the QR code from the terminal.
   - **Android emulator**: Press `a` in the Expo terminal, or run `pnpm android`.
   - **iOS simulator**: Press `i` in the Expo terminal, or run `pnpm ios`.
   - **Web**: Run `pnpm web`.

## Available scripts

- **`pnpm start`**: Start Expo with a cleared cache.
- **`pnpm android`**: Start Expo and open Android.
- **`pnpm ios`**: Start Expo and open iOS.
- **`pnpm web`**: Start Expo for web.
- **`pnpm lint`**: Run Expo lint checks.
- **`pnpm typecheck`**: Run TypeScript checks.
- **`pnpm format`**: Format TypeScript and TSX files with Prettier.

## Firebase functions

Firebase Cloud Functions live in the `functions` folder.

```bash
cd functions
npm install
npm run build
npm run serve
```

Use `npm run deploy` inside `functions` when you are ready to deploy functions to Firebase.

## Temporary class representative setup

All public signups are created as students. Until the invitation/promotion flow
is implemented, create a class representative for testing by:

1. Signing up normally in the app.
2. Opening Firebase Console for the active project.
3. Editing `users/{uid}.role` from `student` to `classRep`.
4. Signing out and back in, or restarting the app, so the session reloads the
   updated profile.

Do not add a hidden promotion code in the app for this phase.

## Project structure

- **`app`**: Expo Router screens and navigation routes.
- **`components`**: Reusable UI, class, home, and modal components.
- **`lib`**: App state and shared logic.
- **`functions`**: Firebase Cloud Functions source.
- **`assets`**: Images, icons, fonts, and other static assets.

## Notes

Use the package scripts instead of running `npx expo start` directly. The scripts include the Expo startup flags this project expects.
